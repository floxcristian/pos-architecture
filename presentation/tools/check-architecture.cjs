/* QA for the public architecture deck and deterministic teaching labs. No infrastructure calls. */
'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const path = require('node:path');
const { spawn } = require('node:child_process');
const { pathToFileURL } = require('node:url');
const root = path.resolve(__dirname, '..');
const port = Number(process.env.POS_ARCH_QA_PORT || 4197);
const base = `http://127.0.0.1:${port}`;
function playwright() {
  for (const name of [process.env.PLAYWRIGHT_MODULE_PATH, 'playwright', path.join(require('node:os').homedir(), '.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright')].filter(Boolean)) {
    try { return require(name); } catch (error) { if(error.code!=='MODULE_NOT_FOUND')throw error; }
  }
  throw new Error('Set PLAYWRIGHT_MODULE_PATH to the installed Playwright module for QA. The deck needs no runtime dependency.');
}
async function run() {
  const server=spawn(process.execPath,[path.join(root,'server.cjs')],{env:{...process.env,POS_ATLAS_PORT:String(port)},windowsHide:true,stdio:['ignore','pipe','pipe']});
  let browser;
  const report={slides:0,diagrams:0,scenarios:0,steps:0,viewports:[],checks:[],errors:[],external:[]};
  const output=path.join(root,'qa','architecture');
  await fs.mkdir(output,{recursive:true});
  try {
    await new Promise((resolve,reject)=>{
      const timeout=setTimeout(()=>reject(new Error('Preview startup timeout')),10000);
      server.stdout.once('data',()=>{clearTimeout(timeout);resolve();});
      server.once('exit',code=>{clearTimeout(timeout);reject(new Error('Preview exited '+code));});
    });
    browser=await playwright().chromium.launch();
    const page=await browser.newPage({viewport:{width:1440,height:1000},reducedMotion:'reduce'});
    page.on('pageerror',error=>report.errors.push(error.message));
    page.on('request',request=>{if(!request.url().startsWith(base)&&!request.url().startsWith('data:')&&!request.url().startsWith('file:'))report.external.push(request.url());});
    const response=await page.goto(base+'/presentation/architecture.html');
    assert.match(response.headers()['content-security-policy'],/connect-src 'none'/);
    await page.waitForSelector('[data-slide="inicio"]');
    const {deck,labs}=await page.evaluate(()=>({deck:window.POS_ARCH_DECK,labs:window.POS_ARCH_LABS}));
    assert.equal(deck.slides.length,19);
    assert.equal(new Set(deck.slides.map(slide=>slide.id)).size,19);
    const go=async id=>{await page.evaluate(id=>{location.hash=id;},id);await page.waitForSelector(`[data-slide="${id.split('?')[0]}"]`);};
    const noOverflow=async()=>{
      const bounds=await page.evaluate(()=>({body:document.body.scrollWidth,window:innerWidth,outerHeight:document.documentElement.scrollHeight,height:innerHeight,slide:document.querySelector('#slide').scrollWidth,slideWidth:document.querySelector('#slide').clientWidth}));
      assert.ok(bounds.body<=bounds.window+1,JSON.stringify(bounds));
      assert.ok(bounds.outerHeight<=bounds.height+1,'Unexpected document scroll '+JSON.stringify(bounds));
      assert.ok(bounds.slide<=bounds.slideWidth+1,'Slide horizontal overflow '+JSON.stringify(bounds));
    };
    for(const slide of deck.slides){
      await go(slide.id);await noOverflow();
      assert.equal(await page.locator('#slide h1').count(),1);
      for (const img of await page.locator('#slide img').all()) {
        await img.evaluate(el => el.decode());
        assert.ok(await img.evaluate(el => el.naturalWidth > 0));
      }
      await page.screenshot({path:path.join(output,slide.id+'.png')});report.slides++;
      if(slide.diagram){
        await page.locator(`[data-diagram="${slide.diagram}"]`).click();
        await page.waitForFunction(()=>document.querySelector('#diagram-image').complete&&document.querySelector('#diagram-image').naturalWidth>0);
        const download=await page.locator('#diagram-download').getAttribute('href');
        assert.ok((await fs.stat(path.resolve(root,download))).isFile());
        const initial=await page.locator('#zoom-label').innerText();
        await page.locator('[data-action="zoom-native"]').click();
        assert.equal(await page.locator('#zoom-label').innerText(),'100 %');
        assert.notEqual(initial,'100 %');
        await page.locator('#diagram-viewport').focus();await page.keyboard.press('ArrowRight');
        assert.ok(await page.locator('#diagram-viewport').evaluate(el=>el.scrollLeft>0));
        await page.locator('[data-action="zoom-fit"]').click();
        await page.keyboard.press('Escape');
        assert.equal(await page.locator('dialog[open]').count(),0);report.diagrams++;
      }
    }
    console.log('Desktop: 19 slides, seven diagrams, zoom, keyboard and editable downloads PASS.');
    for(const slide of deck.slides.filter(slide=>slide.lab)){
      await go(slide.id);
      const lab=labs[slide.lab];
      const nodeIds=new Set(lab.nodes.map(node=>node.id));
      const lineCount=lab.code.source.split('\n').length;
      for(let s=0;s<lab.scenarios.length;s++){
        await page.locator('#lab-scenario').selectOption(String(s));report.scenarios++;
        for(let n=0;n<lab.scenarios[s].steps.length;n++){
          const step=lab.scenarios[s].steps[n];
          assert.ok(step.active.every(id=>nodeIds.has(id)));
          assert.ok(step.codeLines.every(line=>line>=1&&line<=lineCount));
          await page.locator(`[data-step="${n}"]`).click();
          assert.equal(await page.locator('.lab-step h2').innerText(),step.title);
          assert.equal(await page.locator('.code-line.is-highlight').count(),step.codeLines.length);
          assert.equal(await page.locator('.lab-node.is-active').count(),step.active.length);
          assert.equal(await page.locator('[data-action="lab-next"]').isDisabled(),n===lab.scenarios[s].steps.length-1);
          report.steps++;
        }
      }
    }
    console.log('Labs: 15 scenarios and 90 state/code transitions PASS.');
    await go('bullmq');
    await page.locator('.lab-node').first().click();
    assert.equal(await page.locator('#notes').evaluate(el=>el.open),true);
    assert.match(await page.locator('#notes-content').innerText(),/\S+/);
    await page.keyboard.press('Escape');
    assert.ok(await page.locator('.lab-node').first().evaluate(el=>el===document.activeElement));
    await page.locator('.code-contract summary').click();
    await page.locator('[data-step="0"]').click();
    assert.equal(await page.locator('.code-contract').evaluate(el=>el.open),true);
    report.checks.push('Node responsibility dialog, restored focus and persistent code contract disclosure');
    await go('bullmq?caso=manual&paso=3');
    await page.waitForSelector('[data-step="2"][aria-current="step"]');
    await page.locator('[data-action="lab-play"]').click();
    await page.waitForSelector('[data-step="3"][aria-current="step"]',{timeout:7000});
    await page.locator('[data-action="lab-play"]').click();
    await page.waitForTimeout(4300);
    assert.equal(await page.locator('[data-step="3"]').getAttribute('aria-current'),'step');
    await page.locator('[data-action="lab-play"]').click();
    await go('inicio');await page.waitForTimeout(4300);await go('bullmq');
    assert.equal(await page.locator('[data-step="3"]').getAttribute('aria-current'),'step');
    assert.equal(await page.locator('[data-action="lab-play"]').getAttribute('aria-pressed'),'false');
    report.checks.push('Autoplay, pause, route teardown, deep links and reduced-motion state rendering');
    await go('continuidad');
    await page.locator('[data-action="toggle-wan"]').click();
    assert.match(await page.locator('.continuity-result').innerText(),/Operación local condicionada/);
    await page.locator('[data-action="toggle-lan"]').click();
    assert.match(await page.locator('.continuity-result').innerText(),/Se detienen los nuevos comandos/);
    await go('estados');await page.locator('#financial-case').selectOption('payment');
    assert.match(await page.locator('.state-cards').innerText(),/Resultado incierto/);
    await page.locator('#slide').focus();await page.keyboard.press('n');
    assert.equal(await page.locator('#notes').evaluate(el=>el.open),true);await page.keyboard.press('Escape');
    await page.locator('#slide').focus();await page.keyboard.press('o');
    assert.equal(await page.locator('.overview-item').count(),19);
    await page.locator('[data-slide-index="0"]').click();await page.waitForSelector('[data-slide="inicio"]');
    await page.locator('#slide').focus();await page.keyboard.press('ArrowRight');await page.waitForSelector('[data-slide="decisiones"]');
    report.checks.push('WAN/LAN, payment uncertainty, overview, notes and chapter keyboard navigation');
    for(const width of [320,375,768,1920]){
      await page.setViewportSize({width,height:width<=375?850:1080});
      for(const id of ['inicio','contenedores','bullmq','rabbitmq','estados','fuentes']){await go(id);await noOverflow();}
      await page.screenshot({path:path.join(output,`viewport-${width}.png`)});report.viewports.push(width);
    }
    // Verify the newly linked entry does not introduce overflow in the existing Atlas.
    await page.setViewportSize({width:375,height:850});await page.goto(base+'/presentation/index.html');
    await page.waitForSelector('#main h1');
    assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'Atlas mobile overflow');
    assert.ok(await page.locator('a[href="architecture.html"]:visible').count()>=1);
    await page.goto(pathToFileURL(path.join(root,'architecture.html')).href+'#rabbitmq?caso=routing&paso=2');
    await page.waitForSelector('[data-step="1"][aria-current="step"]');
    report.checks.push('Responsive layout, existing Atlas entry and offline file:// access');
    assert.deepEqual(report.errors,[]);assert.deepEqual(report.external,[]);
    await fs.writeFile(path.join(output,'report.json'),JSON.stringify(report,null,2));
    console.log(JSON.stringify(report,null,2));
  }finally{await browser?.close();server.kill();}
}
run().catch(error=>{console.error(error);process.exitCode=1;});
