/* Read-only validation of GitHub evidence against locally available Git objects.
 * Does not execute corporate code, fetch objects, or print source contents.
 * Usage: node tools/check-source-evidence.cjs [file ...]
 */
'use strict';
const fs = require('node:fs');
const path = require('node:path');
const {execFileSync} = require('node:child_process');
const root = path.resolve(__dirname, '..');
const walk = dir => fs.readdirSync(dir, {withFileTypes:true}).flatMap(e => e.isDirectory() ? walk(path.join(dir,e.name)) : [path.join(dir,e.name)]);
const inputs = process.argv.slice(2).map(p=>path.resolve(root,p));
const files = inputs.length ? inputs : [...walk(path.join(root,'docs')).filter(p=>p.endsWith('.md')),...['technical-data.js','dataflows-data.js','operations-data.js','interactions-current.js','interactions-extensions.js','interactions-proposed.js','repositories-data.js'].map(name=>path.join(root,'presentation',name))].filter(p=>fs.existsSync(p));
const refs = new Map();
for (const file of files) {
  const source = fs.readFileSync(file,'utf8');
  const regex = /https:\/\/github\.com\/developer-implementos\/([a-zA-Z0-9_-]+)\/blob\/([0-9a-f]{40})\/([^\s<>"')\]]+)/g;
  for (const m of source.matchAll(regex)) {
    const raw=m[3].split('#');
    const target=decodeURIComponent(raw[0]);
    const anchor=raw[1]||'';
    const key=`${m[1]}@${m[2]}:${target}#${anchor}`;
    if(!refs.has(key))refs.set(key,{repo:m[1],sha:m[2],target,anchor,origins:[]});
    refs.get(key).origins.push(path.relative(root,file));
  }
}
const cache = new Map();
const errors=[];
let bounded=0;
for(const [key,ref] of refs) {
  const objectKey=`${ref.repo}@${ref.sha}:${ref.target}`;
  if(!cache.has(objectKey)) {
    const checkout=path.join(root,'repos',ref.repo);
    try {
      const content=execFileSync('git',['show',`${ref.sha}:${ref.target}`],{
        cwd:checkout,encoding:'utf8',maxBuffer:32*1024*1024,
        env:{...process.env,GIT_NO_LAZY_FETCH:'1',GIT_TERMINAL_PROMPT:'0'},
        stdio:['ignore','pipe','pipe'],windowsHide:true
      });
      cache.set(objectKey,{lines:content.split(/\r?\n/).length-(content.endsWith('\n')?1:0)});
    } catch { cache.set(objectKey,{error:'Local Git object unavailable; no fetch attempted.'}); }
  }
  const object=cache.get(objectKey);
  if(object.error){errors.push({reference:key,reason:object.error,origins:ref.origins});continue;}
  if(ref.anchor) {
    const bounds=/^L(\d+)(?:-L(\d+))?$/.exec(ref.anchor);
    if(!bounds){errors.push({reference:key,reason:'Unrecognized line anchor',origins:ref.origins});continue;}
    const start=Number(bounds[1]),end=Number(bounds[2]||bounds[1]);
    if(start<1||end<start||end>object.lines)errors.push({reference:key,reason:`Line range outside file (${object.lines} lines)`,origins:ref.origins});
    else bounded++;
  }
}
console.log(JSON.stringify({files:files.length,uniqueReferences:refs.size,gitObjects:cache.size,validLineAnchors:bounded,errors},null,2));
if(errors.length)process.exitCode=1;
