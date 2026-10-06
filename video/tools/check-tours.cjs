/* Validate narration-guided camera poses, every cue boundary and reverse seeking. */
'use strict';
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const { pathToFileURL } = require('node:url');
const { chromium } = require('playwright');
const root = path.resolve(__dirname, '..');
const qa = path.join(root, 'work/qa/guided');
const read = name => JSON.parse(fs.readFileSync(path.join(root, name), 'utf8').replace(/^\uFEFF/, ''));
const esc = value => String(value).replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
const closeRect = (actual, expected, context) => {
  for (const key of ['x','y','w','h']) assert.ok(Math.abs(actual[key]-expected[key])<.000001,`${context}: focus ${key}`);
};

async function main(){
  const timeline=read('work/timeline.json');
  const scenes=timeline.scenes.filter(scene=>scene.kind==='diagram');
  assert.equal(scenes.length,7);
  fs.mkdirSync(qa,{recursive:true});
  const browser=await chromium.launch();
  const report={status:'RUNNING',scenes:[],errors:[],timebase:'spoken word boundaries + narration lead',scope:'Geometry, timing, all cues, boundary arrival, reverse seeking; semantic review is separate.'};
  const page=await browser.newPage({viewport:{width:1920,height:1080},deviceScaleFactor:1});
  page.on('pageerror',error=>report.errors.push(error.message));
  page.on('request',request=>{if(!/^(file|data|blob):/.test(request.url()))report.errors.push('External request: '+request.url());});
  await page.goto(pathToFileURL(path.join(root,'renderer.html')).href);
  await page.evaluate(()=>window.videoRendererReady);
  try{
    for(const scene of scenes){
      const cues=scene.diagramTour.cues;
      const record={id:scene.id,diagram:scene.diagram,narration:scene.narration,cues:[]};
      const pose=async timeSeconds=>{
        const subtitle=scene.captions.find(cue=>timeSeconds>=cue.start&&timeSeconds<cue.end)?.text||'';
        const metadata={chapterTitle:scene.chapterTitle,chapterNumber:scene.chapterNumber,totalChapters:timeline.chapters.length,sceneNumber:scene.sceneNumber,totalScenes:timeline.scenes.length,duration:scene.duration,timeSeconds,subtitle};
        await page.evaluate(async data=>window.renderVideoScene(data.scene,Math.min(1,data.metadata.timeSeconds/9),data.metadata),{scene,metadata});
        const result=await page.evaluate(()=>window.inspectVideoScene());
        assert.deepEqual(result.problems,[],`${scene.id} at ${timeSeconds}: unsafe layout`);
        assert.ok(result.diagramTour?.timeProvided,`${scene.id}: missing exact time`);
        return result.diagramTour;
      };
      for(let index=0;index<cues.length;index++){
        const cue=cues[index];
        const anchored=await pose(cue.start+.00001);
        assert.equal(anchored.cueId,cue.id,`${scene.id}: wrong cue at spoken anchor`);
        closeRect(anchored.focus,cue.focus,`${scene.id}/${cue.id}: arrival`);
        const sample=cue.start+Math.min(1.5,(cue.end-cue.start)*.4);
        const stable=await pose(sample);
        assert.equal(stable.cueId,cue.id);
        closeRect(stable.focus,cue.focus,`${scene.id}/${cue.id}: narration hold`);
        const image=`${scene.id}-${String(index+1).padStart(2,'0')}.png`;
        await page.screenshot({path:path.join(qa,image)});
        if(index>0){
          const previous=await pose(cue.start-.001);
          assert.equal(previous.cueId,cues[index-1].id,`${scene.id}: premature label`);
          const transition=await pose(cue.start-.2);
          assert.ok(transition.transition,`${scene.id}: missing camera transition`);
        }
        record.cues.push({id:cue.id,phrase:cue.phrase,label:cue.label,description:cue.description,start:cue.start,end:cue.end,targets:cue.targets,focus:cue.focus,scale:stable.scale,sample,image});
      }
      for(const cue of [...cues].reverse()){
        const actual=await pose(cue.start+.05);
        assert.equal(actual.cueId,cue.id,`${scene.id}: reverse seek`);
        closeRect(actual.focus,cue.focus,`${scene.id}/${cue.id}: reverse seek`);
      }
      assert.ok(cues.some(cue=>cue.start>9),`${scene.id}: still stops at 9 seconds`);
      report.scenes.push(record);
      console.log(`PASS ${scene.id}: ${cues.length} spoken anchors / forward and reverse camera poses`);
    }
    assert.deepEqual(report.errors,[]);
    report.status='PASS';
  }catch(error){report.status='FAIL';report.failure=error.message;throw error;}
  finally{
    fs.writeFileSync(path.join(qa,'tour-report.json'),JSON.stringify(report,null,2));
    const body=report.scenes.map(scene=>`<section><h2>${esc(scene.id)} · ${esc(scene.diagram)}</h2><p>${esc(scene.narration)}</p>${scene.cues.map(cue=>`<article><h3>${cue.start.toFixed(2)}–${cue.end.toFixed(2)} s · ${esc(cue.label)}</h3><blockquote>${esc(cue.phrase)}</blockquote><p>${esc(cue.description)}</p><img src="${cue.image}" alt="${esc(cue.label)}"><details><summary>Elementos originales y encuadre</summary><pre>${esc(JSON.stringify({targets:cue.targets,focus:cue.focus},null,2))}</pre></details></article>`).join('')}</section>`).join('');
    fs.writeFileSync(path.join(qa,'storyboard.html'),`<!doctype html><html lang="es"><meta charset="utf-8"><title>Recorridos narrados · revisión</title><style>body{background:#0b1220;color:#f4f7ff;font:18px/1.5 system-ui;margin:32px auto;width:min(1600px,95%)}h1,h2{color:#a8caff}section{margin-top:60px}article{margin:28px 0 50px;border-top:1px solid #385074}img{display:block;width:100%}blockquote{border-left:4px solid #579bff;padding:8px 20px}pre{white-space:pre-wrap}</style><h1>Frase pronunciada → elemento del diagrama → encuadre</h1><p>Estado geométrico: ${report.status}. Revisar la correspondencia semántica de cada cuadro.</p>${body}</html>`);
    await browser.close();
  }
  console.log(`PASS: ${report.scenes.reduce((sum,scene)=>sum+scene.cues.length,0)} guided shots`);
}
main().catch(error=>{console.error(error);process.exitCode=1;});
