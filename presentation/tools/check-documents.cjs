// Validate local documentation links and Mermaid syntax without corporate access.
'use strict';
const fs=require('node:fs/promises');
const path=require('node:path');
const root=path.resolve(__dirname,'../..');
const playwrightCandidates=[process.env.PLAYWRIGHT_MODULE_PATH,'playwright',require('node:path').join(require('node:os').homedir(), '.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright')].filter(Boolean);
let playwright;
for(const candidate of playwrightCandidates){try{playwright=require(candidate);break;}catch(e){if(e.code!=='MODULE_NOT_FOUND')throw e;}}
const slug=s=>s.toLowerCase().replace(/[`*]/g,'').replace(/[^\p{L}\p{N}\s_-]/gu,'').trim().replace(/ /g,'-');
async function markdown(dir){const entries=await fs.readdir(dir,{withFileTypes:true});const result=[];for(const e of entries){const file=path.join(dir,e.name);if(e.isDirectory())result.push(...await markdown(file));else if(e.name.endsWith('.md'))result.push(file);}return result;}
async function main(){
  const files=[path.join(root,'README.md'),...await markdown(path.join(root,'docs')),path.join(root,'presentation/README.md'),path.join(root,'presentation/CONTENT_NOTES.md')];
  const errors=[],diagrams=[];let links=0;
  for(const file of files){
    const content=await fs.readFile(file,'utf8');
    for(const match of content.matchAll(/```mermaid\s*\n([\s\S]*?)```/g))diagrams.push({file:path.relative(root,file),source:match[1]});
    const stripped=content.replace(/```[\s\S]*?```/g,'');
    for(const m of stripped.matchAll(/\[[^\]]*\]\(([^)]+)\)/g)){
      let target=m[1].replace(/^<|>$/g,'');if(/^(https?:|mailto:|app:|codex:)/.test(target))continue;
      const [pathname,anchor]=target.split('#');const full=pathname?path.resolve(path.dirname(file),decodeURIComponent(pathname)):file;links++;
      try{const stat=await fs.stat(full);if(anchor&&stat.isFile()&&full.endsWith('.md')){const text=await fs.readFile(full,'utf8');const headings=[...text.matchAll(/^#{1,6}\s+(.+)$/gm)].map(h=>slug(h[1]));if(!headings.includes(decodeURIComponent(anchor)))errors.push(`${path.relative(root,file)}: unknown anchor ${target}`);}}catch{errors.push(`${path.relative(root,file)}: missing ${target}`);}
    }
  }
  if(!playwright)throw new Error('Playwright needed for Mermaid validation. Set PLAYWRIGHT_MODULE_PATH.');
  const browser=await playwright.chromium.launch({headless:true});
  try{const page=await browser.newPage();await page.setContent('<!doctype html><html><body></body></html>');await page.addScriptTag({path:path.join(root,'presentation/tools/vendor/mermaid.min.js')});await page.evaluate(()=>window.mermaid.initialize({startOnLoad:false,securityLevel:'strict'}));
    for(const d of diagrams){try{await page.evaluate(source=>window.mermaid.parse(source),d.source);}catch(e){errors.push(`${d.file}: Mermaid ${e.message.slice(0,250)}`);}}
  }finally{await browser.close();}
  console.log(JSON.stringify({markdownFiles:files.length,localLinks:links,mermaidDiagrams:diagrams.length,errors},null,2));
  if(errors.length)process.exitCode=1;
}
main().catch(e=>{console.error(e);process.exitCode=1;});
