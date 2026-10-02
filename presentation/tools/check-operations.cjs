/* Behavioral QA for the optional operational cases. Never calls corporate APIs. */
'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const path = require('node:path');
const {pathToFileURL} = require('node:url');
const {spawn} = require('node:child_process');
const root = path.resolve(__dirname, '..');
const snapshotDir = path.join(root, 'qa');
const viewports = [[1440,1000],[1024,768],[768,1024],[390,844],[375,812],[844,390]];
function playwright() {
  for(const candidate of [process.env.PLAYWRIGHT_MODULE_PATH,'playwright',require('node:path').join(require('node:os').homedir(), '.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright')].filter(Boolean)) {
    try { return require(candidate); } catch(error) { if(error.code!=='MODULE_NOT_FOUND')throw error; }
  }
  throw new Error('Use the existing Playwright installation via PLAYWRIGHT_MODULE_PATH. No dependency is installed by this check.');
}
const normalize = text => String(text).replace(/\s+/g,' ').trim();
async function main() {
  const port=4181,base=`http://127.0.0.1:${port}`;
  const server=spawn(process.execPath,[path.join(root,'server.cjs')],{env:{...process.env,POS_ATLAS_PORT:String(port)},windowsHide:true,stdio:['ignore','pipe','pipe']});
  let browser;
  const checks=[],errors=[],external=[],layoutProblems=[];
  const report={date:new Date().toISOString(),engine:'Playwright / Chromium',checks,errors,external,layoutProblems};
  try {
    await new Promise((resolve,reject)=>{const timer=setTimeout(()=>reject(new Error('Preview server timeout')),8000);server.stdout.once('data',()=>{clearTimeout(timer);resolve();});server.once('exit',code=>{clearTimeout(timer);reject(new Error('Preview server exited: '+code));});});
    browser=await playwright().chromium.launch({headless:true});
    const page=await browser.newPage({viewport:{width:1440,height:1000},reducedMotion:'reduce'});
    page.on('pageerror',error=>errors.push(error.message));
    page.on('request',request=>{if(!request.url().startsWith(base)&&!request.url().startsWith('data:'))external.push(request.url());});
    const openCase=async(target,c,useFile=false)=>{
      await target.goto((useFile?pathToFileURL(path.join(root,'index.html')).href:base+'/')+'#'+c.chapter);
      await target.locator('#ops-explorer > summary').waitFor();
      if(!await target.locator('#ops-explorer').evaluate(details=>details.open))await target.locator('#ops-explorer > summary').click();
      await target.locator('#ops-select').selectOption(c.id);
    };
    const assertView=async(target,c,mode)=>{
      const definition=c[mode];
      assert.equal(await target.locator(`[data-ops-mode="${mode}"]`).getAttribute('aria-pressed'),'true');
      assert.equal(normalize(await target.locator('.ops-case-intro h3').innerText()),normalize(c.title));
      assert.equal(normalize(await target.locator('.ops-case-intro p').innerText()),normalize(definition.summary));
      assert.equal(await target.locator('.ops-reading li').count(),definition.steps.length);
      assert.ok(normalize(await target.locator('.ops-boundary').innerText()).includes(normalize(definition.boundary)));
      assert.equal(await target.locator('#ops-diagram svg').count(),1);
      assert.equal(await target.locator('#ops-diagram svg').getAttribute('role'),'img');
      assert.ok((await target.locator('#ops-diagram svg').getAttribute('aria-label')).includes(c.title));
    };
    await page.goto(base+'/#venta');
    const cases=await page.evaluate(()=>window.POS_OPERATIONS?.cases);
    assert.ok(Array.isArray(cases),'POS_OPERATIONS.cases must load as a local asset');
    assert.equal(cases.length,4);assert.equal(new Set(cases.map(c=>c.id)).size,4);
    assert.deepEqual(cases.map(c=>c.id).sort(),['O01','O02','O03','O04']);
    const expectedChapters={O01:'venta',O02:'propuesta',O03:'venta',O04:'evolucion'};
    for(const c of cases) {
      assert.equal(c.chapter,expectedChapters[c.id]);
      assert.ok(c.title&&c.evidenceNote&&c.sources.length);
      assert.ok(c.challenge?.question&&c.challenge.current&&c.challenge.proposed&&c.challenge.test);
      for(const mode of ['current','proposed'])assert.ok(c[mode]?.diagram&&c[mode].summary&&c[mode].boundary&&c[mode].steps.length);
    }
    const document=await fs.readFile(path.join(root,'../docs/operacion-caja-y-evolucion.md'),'utf8');
    const documentedSources=[...document.matchAll(/```mermaid\s*\r?\n([\s\S]*?)```/g)].map(match=>match[1].trim());
    assert.equal(documentedSources.length,8);
    const diagramKeys=cases.flatMap(c=>[c.current.diagram,c.proposed.diagram]);
    assert.equal(new Set(diagramKeys).size,8);
    const diagrams=await page.evaluate(keys=>keys.map(key=>({key,source:window.POS_DIAGRAMS?.[key]?.source?.trim(),svg:window.POS_DIAGRAMS?.[key]?.svg})),diagramKeys);
    for(const diagram of diagrams){assert.ok(diagram.source&&diagram.svg,'Missing compiled diagram: '+diagram.key);assert.equal(documentedSources.filter(source=>source===diagram.source).length,1,'Diagram must exactly match one documented source: '+diagram.key);}
    assert.equal(new Set(diagrams.map(d=>d.source)).size,8);
    checks.push('Cuatro casos y ocho diagramas locales: metadata coherente y paridad exacta con los ocho Mermaid del documento.');
    for(const c of cases) {
      await openCase(page,c);
      assert.equal(await page.locator('#ops-challenge-answer').isVisible(),false);
      await assertView(page,c,'current');
      await page.locator('[data-ops-challenge]').click();
      assert.equal(await page.locator('[data-ops-challenge]').getAttribute('aria-expanded'),'true');
      assert.ok(normalize(await page.locator('#ops-challenge-answer').innerText()).includes(normalize(c.challenge.current)));
      for(const mode of ['proposed','current']) {
        await page.locator(`[data-ops-mode="${mode}"]`).click();await assertView(page,c,mode);
        assert.equal(await page.locator('#ops-challenge-answer').isVisible(),true,'Opening the explanation persists when toggling modes');
        assert.ok(normalize(await page.locator('#ops-challenge-answer').innerText()).includes(normalize(c.challenge[mode])));
        assert.ok(normalize(await page.locator('#ops-challenge-answer').innerText()).includes(normalize(c.challenge.test)));
        assert.equal(await page.locator('[data-ops-source]').count(),0);
        await page.locator('[data-ops-zoom="100"]').click();assert.equal(await page.locator('[data-ops-zoom="100"]').getAttribute('aria-pressed'),'true');
        await page.locator('.ops-map-scroll').focus();await page.keyboard.press('ArrowRight');await page.keyboard.press('ArrowLeft');
        assert.ok(page.url().endsWith('#'+c.chapter),'Diagram arrows must not change the chapter');
        await page.locator('[data-ops-zoom="fit"]').click();assert.equal(await page.locator('[data-ops-zoom="fit"]').getAttribute('aria-pressed'),'true');
      }
      await page.locator('[data-ops-challenge]').click();assert.equal(await page.locator('#ops-challenge-answer').isVisible(),false);
      await page.locator('.ops-evidence > summary').focus();await page.keyboard.press('Enter');
      assert.equal(await page.locator('.ops-evidence').evaluate(details=>details.open),true);
      assert.equal(await page.locator('.ops-evidence .source-list a').count(),c.sources.length);
      assert.equal(await page.locator('.ops-evidence a[target="_blank"]:not([rel~="noopener"])').count(),0);
    }
    checks.push('Actual/propuesto, explicación del desafío persistente al alternar, fuentes, ausencia de controles de código del diagrama, zoom y flechas internas.');
    const saleCases=cases.filter(c=>c.chapter==='venta');
    const concepts=await page.evaluate(()=>window.POS_OPERATIONS.concepts);
    assert.equal(concepts.length,4);
    await openCase(page,saleCases[0]);
    assert.equal(await page.locator('[data-ops-concept]').count(),4);
    for(const concept of concepts) {
      const button=page.locator(`[data-ops-concept="${concept.id}"]`);
      await button.focus();await page.keyboard.press('Enter');
      assert.equal(await page.locator('#modal-title').innerText(),concept.title);
      const body=normalize(await page.locator('#modal-body').innerText());
      assert.ok(body.includes(normalize(concept.text))&&body.includes(normalize(concept.boundary)));
      assert.equal(await page.locator('#modal-body .source-list a').count(),concept.sources.length);
      await page.keyboard.press('Escape');assert.equal(await page.evaluate(()=>document.activeElement.dataset.opsConcept),concept.id);
    }
    checks.push('Cuatro conceptos de venta/cobranza/NC/devolución abren por teclado, conservan límites/fuentes y devuelven el foco al cerrar.');
    await openCase(page,saleCases[0]);await page.locator('[data-ops-mode="proposed"]').click();await page.locator('[data-ops-challenge]').click();
    await page.locator('#ops-select').selectOption(saleCases[1].id);await assertView(page,saleCases[1],'proposed');
    assert.equal(await page.locator('#ops-challenge-answer').isVisible(),false,'A different case resets its explanation');
    await page.locator('#ops-select').selectOption(saleCases[0].id);await assertView(page,saleCases[0],'proposed');
    checks.push('Cambiar entre O01/O03 conserva el modo elegido y reinicia la explicación del caso.');
    await fs.mkdir(snapshotDir,{recursive:true});
    for(const [width,height] of viewports) {
      await page.setViewportSize({width,height});
      for(const c of cases) {
        await openCase(page,c);
        for(const mode of ['current','proposed']) {
          await page.locator(`[data-ops-mode="${mode}"]`).click();await assertView(page,c,mode);
          if(await page.locator('[data-ops-challenge]').getAttribute('aria-expanded')!=='true')await page.locator('[data-ops-challenge]').click();
          await page.locator('[data-ops-zoom="100"]').click();
          if(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1))layoutProblems.push(`${c.id}/${mode} overflows ${width}x${height}`);
          assert.ok((await page.locator('.ops-map-scroll').boundingBox()).width<=width);
          if([1440,390].includes(width))await page.locator('.ops-content').screenshot({path:path.join(snapshotDir,`operations-${c.id}-${mode}-${width}.png`)});
        }
      }
    }
    assert.deepEqual(layoutProblems,[]);
    checks.push('48 vistas responsive: cuatro casos × dos modos × seis tamaños (375–1440 px y paisaje), explicación abierta y zoom 100 %, sin desbordamiento horizontal.');
    const offlinePage=await browser.newPage({viewport:{width:390,height:844},offline:true,reducedMotion:'reduce'});
    offlinePage.on('pageerror',error=>errors.push('file:// '+error.message));
    offlinePage.on('request',request=>{if(!request.url().startsWith('file:')&&!request.url().startsWith('data:'))external.push(request.url());});
    for(const c of cases){await openCase(offlinePage,c,true);for(const mode of ['current','proposed']){await offlinePage.locator(`[data-ops-mode="${mode}"]`).click();await assertView(offlinePage,c,mode);}await offlinePage.locator('[data-ops-challenge]').click();assert.ok(await offlinePage.locator('#ops-challenge-answer').isVisible());}
    await openCase(offlinePage,saleCases[0],true);
    for(const concept of concepts){await offlinePage.locator(`[data-ops-concept="${concept.id}"]`).click();assert.equal(await offlinePage.locator('#modal-title').innerText(),concept.title);await offlinePage.keyboard.press('Escape');}
    assert.deepEqual(errors,[]);assert.deepEqual(external,[]);
    checks.push('Los ocho recorridos funcionan mediante file:// con red deshabilitada; cero errores JavaScript y solicitudes externas.');
    await fs.writeFile(path.join(snapshotDir,'operations-report.json'),JSON.stringify(report,null,2)+'\n');
    console.log(checks.join('\n'));console.log(`PASS: ${checks.length} grupos de verificaciones de operaciones.`);
  } finally {if(browser)await browser.close();server.kill();}
}
main().catch(error=>{console.error(error);process.exitCode=1;});
