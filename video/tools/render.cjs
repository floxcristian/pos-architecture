/* Frame-controlled motion graphics. Capture locally; encode and subtitle with FFmpeg. */
'use strict';
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { spawn, execFileSync } = require('node:child_process');
const { once } = require('node:events');
const { pathToFileURL } = require('node:url');
const assert = require('node:assert/strict');
const { chromium } = require('playwright');
const root = path.resolve(__dirname, '..');
const work = path.join(root, 'work');
const qa = process.argv.includes('--qa');
const arg = name => {const i=process.argv.indexOf(name);return i>=0?process.argv[i+1]:null;};
const limit = Number(arg('--limit') || Infinity);
const selectedIds = arg('--scenes')?.split(',').map(value=>value.trim()).filter(Boolean);
const concurrency = Math.max(1,Math.min(3,Number(arg('--workers')||2)));
const fps = 24;
const motionSeconds = 9;
const python = path.join(root,'.venv/Scripts/python.exe');
const ffmpeg = execFileSync(python,['-c','import imageio_ffmpeg; print(imageio_ffmpeg.get_ffmpeg_exe())'],{encoding:'utf8',windowsHide:true}).trim();
const sourceHash = crypto.createHash('sha256');
for(const name of ['renderer.html','renderer.css','renderer.js']) sourceHash.update(fs.readFileSync(path.join(root,name)));
sourceHash.update(fs.readFileSync(__filename));
const rendererHash=sourceHash.digest('hex');
const readJSON=file=>JSON.parse(fs.readFileSync(file,'utf8').replace(/^\uFEFF/,''));

async function main(){
  const script=readJSON(path.join(root,'content/scenes.json'));
  const timeline=readJSON(path.join(work,'timeline.json'));
  if(selectedIds)assert.ok(selectedIds.every(id=>timeline.scenes.some(scene=>scene.id===id)),'Unknown scene selection');
  const scenes=timeline.scenes.filter(scene=>!selectedIds||selectedIds.includes(scene.id)).slice(0,limit);
  const captureDir=path.join(work,'qa');
  const segmentsDir=path.join(work,'segments');
  fs.mkdirSync(captureDir,{recursive:true});fs.mkdirSync(segmentsDir,{recursive:true});
  const browser=await chromium.launch();
  const report=[];
  let next=0;
  async function worker(workerId){
    const page=await browser.newPage({viewport:{width:1920,height:1080},deviceScaleFactor:1});
    const errors=[];
    page.on('pageerror',error=>errors.push(error.message));
    page.on('request',request=>{if(!request.url().startsWith('file:')&&!request.url().startsWith('data:'))errors.push('Unexpected external request: '+request.url());});
    await page.goto(pathToFileURL(path.join(root,'renderer.html')).href);
    await page.waitForFunction(()=>typeof window.renderVideoScene==='function');
    while(next<scenes.length){
      const scene=scenes[next++];
      const sceneIndex=script.scenes.findIndex(s=>s.id===scene.id);
      const chapterIndex=script.chapters.findIndex(c=>c.id===scene.chapter);
      const metadata={chapterTitle:script.chapters[chapterIndex].title,chapterNumber:chapterIndex+1,totalChapters:script.chapters.length,sceneNumber:sceneIndex+1,totalScenes:script.scenes.length,duration:scene.duration||35};
      const draw=(progress,timeSeconds=scene.duration)=>page.evaluate(async ({scene,progress,metadata})=>await window.renderVideoScene(scene,progress,metadata),{scene,progress,metadata:{...metadata,timeSeconds}});
      await draw(1,scene.duration);
      const layout=await page.evaluate(()=>({width:document.documentElement.scrollWidth,height:document.documentElement.scrollHeight,images:[...document.images].map(img=>({src:img.src,valid:img.complete&&img.naturalWidth>0}))}));
      assert.ok(layout.width<=1920&&layout.height<=1080,`${scene.id}: overflow ${JSON.stringify(layout)}`);
      assert.ok(layout.images.every(img=>img.valid),`${scene.id}: missing image`);
      const inspected=await page.evaluate(()=>window.inspectVideoScene());
      assert.deepEqual(inspected.problems,[],`${scene.id}: unsafe visual layout`);
      assert.deepEqual(errors,[],scene.id);
      await page.screenshot({path:path.join(captureDir,scene.id+'.jpg'),type:'jpeg',quality:93});
      if(qa){
        await draw(.35,motionSeconds*.35);await page.screenshot({path:path.join(captureDir,scene.id+'-motion.jpg'),type:'jpeg',quality:85});
        for(const cue of scene.diagramTour?.cues||[]){
          const time=cue.start+Math.min(.6,(cue.end-cue.start)/3);
          await draw(Math.min(1,time/motionSeconds),time);
          const state=await page.evaluate(()=>window.inspectVideoScene());
          assert.deepEqual(state.problems,[],`${scene.id}/${cue.id}: unsafe guided pose`);
          await page.screenshot({path:path.join(captureDir,`${scene.id}-cue-${cue.id}.jpg`),type:'jpeg',quality:93});
        }
        report.push({id:scene.id,...layout,status:'PASS'});
        console.log(`QA ${sceneIndex+1}/${scenes.length} ${scene.id}`);continue;
      }
      const contentHash=crypto.createHash('sha256').update(JSON.stringify({rendererHash,scene,fps,motionSeconds}));
      contentHash.update(fs.readFileSync(path.join(root,scene.subtitles)));
      if(scene.diagram)contentHash.update(fs.readFileSync(path.resolve(root,'../docs/diagramas-excalidraw',scene.diagram+'.svg')));
      const hash=contentHash.digest('hex');
      const destination=path.join(segmentsDir,scene.id+'.mp4');
      const marker=path.join(segmentsDir,scene.id+'.json');
      if(fs.existsSync(destination)&&fs.existsSync(marker)&&readJSON(marker).hash===hash){console.log(`CACHE ${scene.id}`);continue;}
      const temp=path.join(segmentsDir,scene.id+'.partial.mp4');
      const continuous=Boolean(scene.diagramTour);
      const animation=continuous?scene.duration:Math.min(motionSeconds,scene.duration);
      const frames=continuous?scene.frames:Math.ceil(animation*fps);
      const filter=`tpad=stop_mode=clone:stop_duration=${Math.max(0,scene.duration-animation)+.2},ass=filename=${scene.subtitles},format=yuv420p`;
      const args=['-hide_banner','-loglevel','warning','-y','-f','image2pipe','-framerate',String(fps),'-vcodec','mjpeg','-i','pipe:0','-i',path.join(root,scene.audio),'-vf',filter,'-af',`adelay=${Math.round(scene.lead*1000)},apad,aresample=48000`,'-t',scene.duration.toFixed(6),'-c:v','libx264','-preset','veryfast','-crf','21','-pix_fmt','yuv420p','-r',String(fps),'-g','48','-threads','2','-c:a','aac','-b:a','128k','-ac','2','-ar','48000','-movflags','+faststart',temp];
      const encoder=spawn(ffmpeg,args,{cwd:root,windowsHide:true,stdio:['pipe','ignore','pipe']});
      const completion=new Promise((resolve,reject)=>{encoder.once('error',reject);encoder.once('close',code=>code===0?resolve():reject(new Error(`FFmpeg ${scene.id} exit ${code}: ${log.slice(-2500)}`)));});
      // Attach rejection handler while frames are being written to avoid unhandled exits.
      completion.catch(()=>{});
      let log='';encoder.stderr.on('data',chunk=>{log+=chunk.toString();});
      encoder.stdin.on('error',()=>{});
      const started=Date.now();
      let lastCaptureKey=null,lastBuffer=null,capturedFrames=0;
      console.log(`RENDER [${workerId}] ${sceneIndex+1}/${scenes.length} ${scene.id} (${scene.duration.toFixed(1)}s)`);
      try{
        for(let frame=0;frame<frames;frame++){
          const timeSeconds=frame/fps;
          const progress=continuous?Math.min(1,timeSeconds/motionSeconds):frame/(frames-1);
          const state=await draw(progress,timeSeconds);
          // A held camera has no clock-driven effects. Encode every frame, reusing
          // pixels only while entrance, cue, camera and highlight pose are identical.
          // A changed spoken cue or interpolation always forces a fresh capture.
          const tour=state.diagramTour;
          if(continuous)assert.ok(tour?.timeProvided,`${scene.id}: missing narration time`);
          const captureKey=continuous?JSON.stringify([progress,tour.cueId,tour.focus,tour.transition?.progress??0]):String(frame);
          if(captureKey!==lastCaptureKey){
            lastBuffer=await page.screenshot({type:'jpeg',quality:93});
            lastCaptureKey=captureKey;capturedFrames++;
          }
          const buffer=lastBuffer;
          if(encoder.exitCode!==null)await completion;
          if(!encoder.stdin.write(buffer))await Promise.race([once(encoder.stdin,'drain'),completion.then(()=>{throw Error('Encoder exited before all frames');})]);
        }
        encoder.stdin.end();await completion;
        fs.renameSync(temp,destination);
        fs.writeFileSync(marker,JSON.stringify({hash,duration:scene.duration,frames:scene.frames,capturedFrames,guidedCues:scene.diagramTour?.cues.length||0},null,2));
        fs.writeFileSync(path.join(segmentsDir,scene.id+'.log'),log);
        console.log(`DONE ${scene.id} in ${((Date.now()-started)/1000).toFixed(1)}s`);
      }catch(error){encoder.kill();throw error;}
    }
    await page.close();
  }
  try{await Promise.all(Array.from({length:concurrency},(_,i)=>worker(i+1)));}
  finally{await browser.close();}
  if(qa)fs.writeFileSync(path.join(captureDir,'layout-report.json'),JSON.stringify(report,null,2));
  console.log(`${qa?'QA':'RENDER'} COMPLETE: ${scenes.length} scenes.`);
}
main().catch(error=>{console.error(error);process.exitCode=1;});
