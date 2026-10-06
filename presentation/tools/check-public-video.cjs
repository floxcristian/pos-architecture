/* The same real-browser checks can target local public/ or a deployed Vercel URL. */
'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const qa = path.join(root, 'presentation/qa/video');
const publication = require(path.join(root, 'video/publication.json'));
const externalBase = process.argv.find(value => /^https?:\/\//.test(value));
const mode = externalBase ? 'deployed' : 'local';
function playwright() {
  for (const name of [process.env.PLAYWRIGHT_MODULE_PATH, path.join(root,'video/node_modules/playwright'), 'playwright'].filter(Boolean)) {
    try { return require(name); } catch(error) { if(error.code !== 'MODULE_NOT_FOUND') throw error; }
  }
  throw new Error('Set PLAYWRIGHT_MODULE_PATH to an installed Playwright. QA does not install packages.');
}

async function main() {
  await fs.mkdir(qa, {recursive:true});
  const report = {generatedAt:new Date().toISOString(), mode, status:'RUNNING', checks:[], viewports:[], errors:[]};
  let server, browser;
  try {
    if (!externalBase) server = await require('./serve-public.cjs').servePublic(0);
    const base = new URL(externalBase || `http://127.0.0.1:${server.address().port}`).origin;
    report.base = base;
    browser = await playwright().chromium.launch({headless:true});
    const http = await playwright().request.newContext({baseURL:base});
    const documentResponse = await http.get('/video');
    assert.equal(documentResponse.status(), 200);
    const csp = documentResponse.headers()['content-security-policy'];
    assert.match(csp, /media-src 'self'/);
    assert.match(csp, /script-src 'self'/);
    assert.match(csp, /connect-src 'none'/);
    report.csp = csp;
    const range = await http.get('/media/' + publication.file, {headers:{Range:'bytes=0-63'}});
    assert.equal(range.status(), 206);
    assert.equal(range.headers()['content-range'], `bytes 0-63/${publication.bytes}`);
    assert.equal((await range.body()).length, 64);
    assert.match(range.headers()['content-type'], /video\/mp4/);
    for (const forbidden of ['/video/publication.json','/video/output/manifest.json','/.git/config','/presentation/tools/build-vercel.cjs']) {
      assert.equal((await http.get(forbidden)).status(), 404, `Repository file exposed: ${forbidden}`);
    }
    // Vercel rejects encoded traversal as a bad request before static routing;
    // the local parity server returns not found. Both must deny the request.
    assert.ok([400,403,404].includes((await http.get('/%2e%2e%2f.git/config')).status()), 'Encoded traversal was not rejected');
    report.checks.push('Same-origin media, CSP, 206 byte ranges, repository files inaccessible');

    for (const width of [1440,768,375]) {
      const context = await browser.newContext({viewport:{width,height:1000}, reducedMotion:'reduce'});
      await context.grantPermissions(['clipboard-read','clipboard-write'], {origin:base});
      const page = await context.newPage();
      page.setDefaultTimeout(30000);
      const state = {width, errors:[], failedRequests:[], externalRequests:[], seeks:[]};
      report.viewports.push(state);
      page.on('pageerror', error => state.errors.push(error.message));
      page.on('console', message => { if(message.type() === 'error') state.errors.push(message.text()); });
      page.on('requestfailed', request => {
        if (!request.failure()?.errorText?.includes('ERR_ABORTED')) state.failedRequests.push({url:request.url(),error:request.failure()?.errorText});
      });
      page.on('request', request => { if (!request.url().startsWith(base + '/') && !request.url().startsWith('data:')) state.externalRequests.push(request.url()); });
      await page.goto(base + '/video', {waitUntil:'domcontentloaded'});
      const film = page.locator('#film');
      await page.waitForFunction(() => document.querySelector('#film').error || document.querySelector('#film').readyState >= 1, null, {timeout:90000});
      state.metadata = await film.evaluate(video => ({duration:video.duration,width:video.videoWidth,height:video.videoHeight,error:video.error?.message,paused:video.paused,controls:video.controls,source:video.currentSrc}));
      assert.equal(state.metadata.error, undefined);
      assert.equal(state.metadata.width, publication.width);
      assert.equal(state.metadata.height, publication.height);
      assert.ok(Math.abs(state.metadata.duration - publication.durationSeconds) < .15);
      assert.equal(state.metadata.paused, true, 'Page must not autoplay');
      assert.equal(state.metadata.controls, true);
      assert.equal(state.metadata.source, base + '/media/' + publication.file);
      const chapters = page.locator('.chapters button[data-time]');
      assert.equal(await chapters.count(), 14);
      const chapterData = await chapters.evaluateAll(buttons => buttons.map(button => ({start:Number(button.dataset.time),title:button.querySelector('strong').textContent,disabled:button.disabled,label:button.getAttribute('aria-label')})));
      chapterData.forEach((chapter,index) => { assert.equal(chapter.disabled,false); assert.ok(chapter.label.includes(chapter.title)); assert.ok(index === 0 ? chapter.start === 0 : chapter.start > chapterData[index-1].start); });
      for (const index of [0,7,13]) {
        await film.evaluate(video => {video.muted=true;video.pause();});
        await chapters.nth(index).click();
        await page.waitForFunction(({start,index}) => {
          const video = document.querySelector('#film');
          return !video.seeking && !video.paused && video.readyState >= 2 && video.currentTime > start + .4 && video.currentTime < start + 5 && document.querySelectorAll('.chapters button')[index].getAttribute('aria-current') === 'true';
        }, {start:chapterData[index].start,index}, {timeout:90000});
        const playback = await film.evaluate(video => {video.pause();return {time:video.currentTime,frames:video.getVideoPlaybackQuality().totalVideoFrames,error:video.error?.message,focused:document.activeElement===video};});
        assert.ok(playback.frames > 0);assert.equal(playback.error,undefined);assert.equal(playback.focused,true);
        assert.equal(await page.locator('#current-chapter').textContent(),chapterData[index].title);
        assert.equal(await page.locator('.chapters [aria-current="true"]').count(),1);
        state.seeks.push({chapter:index+1,...playback});
      }
      for (const link of await page.locator('.resource-links a').all()) {
        const response = await http.head(await link.getAttribute('href'));
        assert.equal(response.status(),200);
      }
      await page.locator('#include-time').check();
      await page.locator('#copy-link').click();
      const shared = await page.evaluate(() => navigator.clipboard.readText());
      const shareUrl = new URL(shared);
      assert.equal(shareUrl.origin,base);assert.equal(shareUrl.pathname,'/video');
      assert.equal(Number(shareUrl.searchParams.get('t')),Math.floor(await film.evaluate(video=>video.currentTime)));
      await page.locator('#include-time').uncheck();await page.locator('#copy-link').click();
      assert.equal(await page.evaluate(()=>navigator.clipboard.readText()),base+'/video');
      await page.evaluate(() => Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText:()=>Promise.reject(new Error('QA denied clipboard'))}}));
      await page.locator('#copy-link').click();
      assert.equal(await page.locator('#copy-fallback').isVisible(),true);
      assert.equal(await page.locator('#share-url').inputValue(),base+'/video');
      assert.equal(await page.locator('#share-url').evaluate(input=>input===document.activeElement && input.selectionStart===0 && input.selectionEnd===input.value.length),true);
      await page.evaluate(()=>scrollTo(0,0));
      state.layout = await page.evaluate(()=>({viewport:innerWidth,document:document.documentElement.scrollWidth,body:document.body.scrollWidth}));
      assert.ok(state.layout.document <= width+1 && state.layout.body <= width+1,JSON.stringify(state.layout));
      await page.screenshot({path:path.join(qa,`${mode}-${width}.png`),fullPage:true});

      if (width === 1440) {
        state.directTimes = [];
        for (const value of ['120.5','invalid','999999']) {
          await page.goto(base+'/video?t='+value,{waitUntil:'domcontentloaded'});
          const target = value === '120.5' ? 120.5 : value === 'invalid' ? 0 : publication.durationSeconds-.1;
          await page.waitForFunction(time=>{const v=document.querySelector('#film');return v.readyState>=2 && !v.seeking && Math.abs(v.currentTime-time)<.16;},target,{timeout:90000});
          const result=await film.evaluate(video=>({time:video.currentTime,paused:video.paused,error:video.error?.message}));
          assert.equal(result.paused,true);assert.equal(result.error,undefined);
          state.directTimes.push({value,...result});
        }
      }
      assert.deepEqual(state.errors,[]);assert.deepEqual(state.failedRequests,[]);assert.deepEqual(state.externalRequests,[]);
      report.checks.push(`${width}px: metadata, 14 chapters, real muted playback/seeking, clipboard + fallback, downloads, responsive layout, no browser errors`);
      await context.close();
    }
    await http.dispose();
    report.status='PASS';
  } catch(error) {
    report.status='FAIL';report.errors.push(error.stack || String(error));process.exitCode=1;
  } finally {
    await browser?.close();
    if(server) await new Promise(resolve=>server.close(resolve));
    await fs.writeFile(path.join(qa,`${mode}-report.json`),JSON.stringify(report,null,2)+'\n');
    console.log(JSON.stringify(report,null,2));
  }
}
main().catch(error=>{console.error(error);process.exitCode=1;});
