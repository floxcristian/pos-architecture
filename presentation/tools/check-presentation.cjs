/* Behavioral QA for the static tutorial; never calls corporate services. */
'use strict';
const path = require('node:path');
const fs = require('node:fs/promises');
const { pathToFileURL } = require('node:url');
const assert = require('node:assert/strict');
const { spawn } = require('node:child_process');
const root = path.resolve(__dirname, '..');
function playwright() {
  for (const candidate of [process.env.PLAYWRIGHT_MODULE_PATH, 'playwright', require('node:path').join(require('node:os').homedir(), '.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright')].filter(Boolean)) {
    try { return require(candidate); } catch (e) { if(e.code!=='MODULE_NOT_FOUND') throw e; }
  }
  throw new Error('Install Playwright for QA or set PLAYWRIGHT_MODULE_PATH. The presentation itself needs no dependency.');
}
async function main() {
  const port = 4179;
  const server=spawn(process.execPath,[path.join(root,'server.cjs')],{env:{...process.env,POS_ATLAS_PORT:String(port)},windowsHide:true,stdio:['ignore','pipe','pipe']});
  let browser;
  const logs=[];
  try {
    await new Promise((resolve,reject)=>{const timeout=setTimeout(()=>reject(new Error('Preview server timeout')),8000);server.stdout.once('data',()=>{clearTimeout(timeout);resolve();});server.once('exit',code=>{clearTimeout(timeout);reject(new Error('Server exited: '+code));});});
    browser=await playwright().chromium.launch({headless:true});
    const page=await browser.newPage({viewport:{width:1440,height:1000},reducedMotion:'reduce'});
    const errors=[],external=[];
    page.on('pageerror',e=>errors.push(e.message));
    page.on('request',r=>{if(!r.url().startsWith(`http://127.0.0.1:${port}`)&&!r.url().startsWith('data:'))external.push(r.url());});
    const base=`http://127.0.0.1:${port}`;
    const goto=async id=>{await page.goto(`${base}/#${id}`);await page.locator('h1').waitFor();};
    const click=action=>page.locator(`[data-action="${action}"]`).first().click();
    await goto('mapa');
    assert.equal(await page.locator('[data-map-view][role="tab"]').count(),4);
    assert.equal(await page.locator('#map-panel-general').isVisible(),true);
    assert.equal(await page.locator('#map-panel-general .ix-context').count(),0);
    assert.equal(await page.locator('[data-node]').count(),11);
    for(const node of await page.locator('[data-node]').all()) {
      await node.click();
      assert.equal(await node.getAttribute('aria-pressed'),'true');
      assert.ok((await page.locator('.inspector-title:visible').innerText()).length>3);
    }
    await page.locator('[data-node="localdb"]').focus();await page.keyboard.press('Enter');
    assert.match(await page.locator('.inspector-title:visible').innerText(),/PostgreSQL/);
    logs.push('Mapa: todos los nodos abren fichas; selección accesible por teclado.');
    const technical=await page.evaluate(()=>window.POS_TECHNICAL);
    const sourceViews=[...(await fs.readFile(path.join(root,'../docs/vistas-arquitectura-y-flujos.md'),'utf8')).matchAll(/```mermaid\s*\r?\n([\s\S]*?)```/g)].map(m=>m[1].trim());
    const viewKeys=['technical-deployment','technical-sale','technical-sync','technical-continuity','technical-erp-state'];
    const compiledViews=await page.evaluate(keys=>keys.map(key=>window.POS_DIAGRAMS[key].source.trim()),viewKeys);assert.deepEqual(compiledViews,sourceViews.slice(0,5));
    assert.ok(technical.components.length>=20);assert.ok(technical.endpoints.length>=25);
    const componentIds=new Set(technical.components.map(c=>c.id));const groupIds=new Set(technical.groups.map(g=>g.id));
    for(const endpoint of technical.endpoints) {
      assert.ok(componentIds.has(endpoint.from),`Unknown source ${endpoint.id}: ${endpoint.from}`);
      assert.ok(componentIds.has(endpoint.to),`Unknown destination ${endpoint.id}: ${endpoint.to}`);
      assert.ok(groupIds.has(endpoint.group),`Unknown group ${endpoint.id}: ${endpoint.group}`);
      assert.ok(endpoint.path&&endpoint.method&&endpoint.sources.length);
      assert.match(endpoint.commit,/^[a-f0-9]{40}$/);
    }
    await page.locator('.inspector .technical-evidence > summary').click();assert.match(await page.locator('.inspector .technical-evidence').innerText(),/Ubicación/);
    await page.locator('[data-map-view="evidencia"]').click();
    assert.equal(await page.locator('details#technical-explorer').count(),0);
    assert.equal(await page.locator('[data-tech-view="endpoints"]').getAttribute('aria-pressed'),'true');
    assert.deepEqual(await page.locator('[data-tech-view]').evaluateAll(items=>items.map(el=>el.dataset.techView).sort()),['coverage','deployment','endpoints']);
    assert.equal(await page.locator('.tech-endpoint').count(),6);
    await page.locator('[data-tech-more]').click();assert.equal(await page.locator('.tech-endpoint').count(),12);
    await page.locator('#tech-query').fill('/punto-de-venta');assert.ok(await page.locator('.tech-endpoint').count()>0);assert.match(await page.locator('.tech-endpoint').first().innerText(),/punto-de-venta/);
    await page.locator('.tech-endpoint details > summary').first().click();assert.ok(await page.locator('.tech-endpoint .tech-sources a').first().getAttribute('href'));
    await page.locator('#tech-query').fill('no-existe-endpoint-xyz');assert.equal(await page.locator('.tech-endpoint').count(),0);assert.match(await page.locator('.tech-empty').innerText(),/No hay rutas/);
    await page.locator('[data-tech-reset]').click();await page.locator('#tech-group').selectOption('printing');assert.ok(await page.locator('.tech-endpoint').count()>0);
    await page.locator('[data-tech-reset]').click();await page.locator('#tech-app').selectOption('backend');
    const filteredIds=await page.locator('.tech-endpoint').evaluateAll(items=>items.map(el=>el.dataset.endpointId));
    assert.ok(filteredIds.length>0);assert.ok(filteredIds.every(id=>technical.endpoints.some(e=>e.id===id&&(e.from==='backend'||e.to==='backend'))));
    await page.locator('[data-tech-view="deployment"]').click();
    assert.ok(await page.locator('[data-tech-node]').count()>=15);
    await page.locator('[data-tech-node="PG"]').focus();await page.keyboard.press('Enter');assert.match(await page.locator('#modal-body').innerText(),/PostgreSQL/);
    await page.screenshot({path:path.join(root,'qa','technical-hotspot-1440.png')});await page.keyboard.press('Escape');
    assert.equal(await page.locator('[data-tech-node="PG"]').evaluate(el=>el===document.activeElement),true);
    const evidenceHash=new URL(page.url()).hash;
    await page.locator('[data-tech-zoom="100"]').click();await page.locator('.tech-diagram-scroll').focus();await page.keyboard.press('ArrowRight');assert.equal(new URL(page.url()).hash,evidenceHash);
    assert.equal(await page.locator('#tech-diagram-render svg').count(),1);
    assert.equal(await page.locator('#tech-diagram-render').getAttribute('data-tech-diagram'),'technical-deployment');
    assert.equal(await page.locator('#tech-diagram-select').count(),0);
    assert.equal(await page.locator('[data-tech-source]').count(),0);
    await page.locator('[data-tech-view="coverage"]').click();assert.match(await page.locator('.tech-coverage-limit').innerText(),/Perú y España/);
    assert.equal(await page.locator('details.tech-audited-components').evaluate(el=>el.open),false);
    await page.locator('details.tech-audited-components > summary').click();
    for(const zone of await page.locator('.tech-audited-components .tech-zone > summary').all())await zone.click();
    assert.equal(await page.locator('.tech-component-card').count(),technical.components.length);
    await page.locator('.tech-audited-components [data-tech-component="backend"]').click();assert.match(await page.locator('#modal-body').innerText(),/Repositorio/);assert.ok((await page.locator('#modal-body .tech-component-facts').innerText()).includes(technical.components.find(c=>c.id==='backend').repo));await page.keyboard.press('Escape');
    await page.locator('.tech-functional:not(.tech-snapshots) > summary').click();assert.equal(await page.locator('.tech-functional:not(.tech-snapshots) dt').count(),7);
    await page.locator('.tech-snapshots > summary').click();assert.equal(await page.locator('.tech-snapshots dt').count(),technical.snapshots.length);
    assert.ok(await page.locator('.tech-source-index a[href*="decisiones-de-arquitectura"]').count());
    assert.ok(await page.locator('#map-panel-evidencia a[href*="vistas-arquitectura-y-flujos.md"]').count());
    logs.push('Ecosistema: Vista general inicial; Evidencia sin otro plegable, catálogo coherente, filtros/paginación/fuentes, V01 de despliegue accesible y fuentes V01–V05 idénticas al documento. Inventario bajo Cobertura y enlace a las vistas documentadas.');
    await goto('venta');
    await page.clock.install();
    await click('flow-next');assert.match(await page.locator('#step-title').innerText(),/guarda/);
    await click('flow-play');await page.clock.runFor(6100);assert.match(await page.locator('#step-title').innerText(),/facturación/);
    await click('flow-play');const paused=await page.locator('#step-title').innerText();await page.clock.runFor(12000);assert.equal(await page.locator('#step-title').innerText(),paused);
    await click('flow-play');await page.locator('[data-node="localdb"]').click();assert.equal(await page.locator('[data-action="flow-play"]').getAttribute('aria-pressed'),'false');await page.keyboard.press('Escape');
    await click('flow-reset');assert.match(await page.locator('#step-count').innerText(),/01/);
    await page.locator('[data-flow-step="5"]').click();assert.equal(await page.locator('[data-action="flow-next"]').isDisabled(),true);
    logs.push('Venta: avance, reproducción, pausa, reinicio, selección de paso y pausa al inspeccionar.');
    await goto('datos');await page.locator('.df-original-context > summary').click();await page.locator('[data-node="mpos"]').click();assert.match(await page.locator('.inspector-title:visible').innerText(),/MPOS/);await page.keyboard.press('Escape');
    await page.locator('[data-data-mode="customer"]').click();assert.equal(await page.locator('[data-node]').count(),4);
    await page.locator('[data-flow-step="3"]').click();assert.match(await page.locator('#step-description').innerText(),/limpia la venta en preparación/);
    logs.push('Datos: lotes y RUT se exploran de forma independiente.');
    await page.locator('.df-original-context > summary').click();
    const dataflows=await page.evaluate(()=>window.POS_DATAFLOWS.flows);
    assert.equal(dataflows.length,5);assert.equal(new Set(dataflows.map(f=>f.id)).size,5);
    const flowDocument=await fs.readFile(path.join(root,'../docs/recorridos-datos-tablas.md'),'utf8');
    const flowSources=[...flowDocument.matchAll(/```mermaid\s*\r?\n([\s\S]*?)```/g)].map(match=>match[1].trim());
    assert.equal(flowSources.length,5);
    const compiledFlows=await page.evaluate(keys=>keys.map(key=>window.POS_DIAGRAMS[key].source.trim()),dataflows.map(flow=>flow.key));
    assert.deepEqual(compiledFlows,flowSources);
    for(const flow of dataflows) {
      await page.locator('#dataflow-select').selectOption(flow.id);
      assert.equal(await page.locator('#dataflow-map svg').count(),1);
      assert.equal(await page.locator('#dataflow-map [data-df-node]').count(),Object.keys(flow.nodes).length);
      assert.ok(flow.steps.length>=2);assert.ok(flow.caveat&&flow.summary);
      for(let step=0;step<flow.steps.length;step++) {
        const definition=flow.steps[step];
        for(const id of definition.nodes)assert.ok(flow.nodes[id],flow.id+' unknown step node '+id);
        await page.locator(`[data-df-step="${step}"]`).click();
        assert.equal(await page.locator('#dataflow-step-title').innerText(),definition.title);
        assert.equal(await page.locator('#dataflow-map .df-active').count(),new Set(definition.nodes).size);
        const highlightStyles=await page.locator('#dataflow-map .df-active').evaluateAll(nodes=>nodes.map(node=>{const shape=node.querySelector('rect,path,polygon');return shape?{stroke:getComputedStyle(shape).stroke,width:parseFloat(getComputedStyle(shape).strokeWidth)}:null;}));
        assert.ok(highlightStyles.every(style=>style&&style.stroke==='rgb(8, 127, 112)'&&style.width>=4),'Visible stroke must match active nodes');
        assert.equal(await page.locator(`[data-df-step="${step}"]`).getAttribute('aria-pressed'),'true');
        if(definition.endpoint)assert.ok(await page.locator('.df-step-endpoint').count());
      }
      assert.equal(await page.locator('[data-df-action="next"]').isDisabled(),true);
      await page.locator('[data-df-action="previous"]').click();
      assert.equal(await page.locator('#dataflow-step-title').innerText(),flow.steps[flow.steps.length-2].title);
      await page.locator('[data-df-action="reset"]').click();
      assert.equal(await page.locator('[data-df-action="previous"]').isDisabled(),true);
      await page.locator('[data-df-action="next"]').click();assert.equal(await page.locator('#dataflow-step-title').innerText(),flow.steps[1].title);
      for(const [id,node] of Object.entries(flow.nodes)) {
        assert.ok(node.description&&node.sources?.length,flow.id+' missing node evidence '+id);
        const target=page.locator(`#dataflow-map [data-df-node="${id}"]`);
        await page.keyboard.press('Tab');await target.focus();assert.equal(await target.evaluate(node=>getComputedStyle(node.querySelector('rect,path,polygon')).stroke),'rgb(176, 95, 48)');await page.keyboard.press('Enter');
        assert.equal(await page.locator('#modal-title').innerText(),node.title);
        assert.ok(await page.locator('.df-node-facts').count());
        assert.ok(await page.locator('#modal .source-list a').count());
        await page.keyboard.press('Escape');
        assert.equal(await page.evaluate(()=>document.activeElement.dataset.dfNode),id);
      }
      assert.equal(await page.locator('[data-df-source]').count(),0);
      await page.locator('[data-df-zoom="100"]').click();await page.locator('.df-map-scroll').focus();await page.keyboard.press('ArrowRight');assert.ok(page.url().endsWith('#datos'));
      await page.locator('[data-df-zoom="fit"]').click();
    }
    logs.push('Datos y tablas: cinco flujos idénticos a D01–D05, pasos manuales, lecturas/escrituras, todos los nodos con fuentes, foco restaurado y zoom sin navegar de capítulo.');

    await goto('offline');
    await click('offline-next');assert.equal(await page.locator('#actual-network').innerText(),'Sin Internet');
    await click('offline-next');assert.match(await page.locator('#demo-local').innerText(),/persistida/);assert.equal(await page.locator('#demo-central').innerText(),'0');
    await click('offline-next');assert.match(await page.locator('#demo-outbox').innerText(),/pendiente/);
    await click('offline-next');assert.match(await page.locator('#demo-central').innerText(),/^1/);
    for(let i=0;i<3;i++)await click('offline-replay');assert.match(await page.locator('#demo-central').innerText(),/^1/);assert.equal(await page.locator('#demo-erp').innerText(),'Pendiente');
    await click('offline-next');assert.match(await page.locator('#demo-erp').innerText(),/Confirmado en el ejemplo/);
    await click('offline-reset');assert.equal(await page.locator('#demo-central').innerText(),'0');
    logs.push('Offline: pérdida WAN, commit local, reconexión, entrega, reentrega sin duplicado y resultado ERP separado.');
    await page.locator('#edgecase-explorer > summary').click();assert.equal(await page.locator('[data-edgecase]').count(),8);
    for(const scenario of await page.locator('[data-edgecase]').all()) {await scenario.focus();await page.keyboard.press('Enter');assert.equal(await scenario.getAttribute('aria-pressed'),'true');assert.ok((await page.locator('.edgecase-now').innerText()).length>90);assert.match(await page.locator('.edgecase-target').innerText(),/PROPUESTO/);}
    logs.push('Casos límite: ocho escenarios distinguen evidencia actual, estado propuesto, acción y fuentes; selección por teclado.');
    await goto('propuesta');
    await page.locator('.ix-context > summary').click();
    for(const tab of await page.locator('[data-compare]').all()){await tab.click();assert.equal(await tab.getAttribute('aria-pressed'),'true');assert.ok((await page.locator('#comparison-detail').innerText()).length>80);}
    for(const id of ['mediation','rabbitmq','bullmq','dataplatform']){await page.locator(`[data-component-id="${id}"]`).click();assert.equal(await page.locator('#modal').evaluate(el=>el.open),true);assert.ok((await page.locator('#modal-body').innerText()).length>250);await page.keyboard.press('Escape');}
    await page.locator('[data-node="outbox"]').click();assert.match(await page.locator('.inspector-title:visible').innerText(),/Outbox/);
    assert.equal(await page.locator('[data-action="mermaid"]').count(),0);
    await goto('evolucion');await page.locator('[data-country="ES"]').click();assert.match(await page.locator('#country-detail').innerText(),/Gira/);
    await page.locator('[data-country="PE"]').click();assert.match(await page.locator('#country-detail').innerText(),/custom/);
    assert.match(await page.locator('#country-detail').innerText(),/12 entradas/);
    for(const id of ['printer','terminal','timeout']) {
      const scenario=page.locator(`[data-provider-case="${id}"]`);
      await scenario.focus();await page.keyboard.press('Enter');
      assert.equal(await scenario.getAttribute('aria-pressed'),'true');
      assert.equal(await page.locator('.capability-state dt').count(),3);
      assert.ok((await page.locator('#provider-case-title').innerText()).length>30);
      for(const component of await page.locator('#provider-case [data-component-id]').all()) {
        await component.click();assert.equal(await page.locator('#modal').evaluate(el=>el.open),true);
        assert.match(await page.locator('#modal-body').innerText(),/Propuesta/);await page.keyboard.press('Escape');
      }
    }
    const pending=await page.locator('#binding-pending').innerText();
    assert.match(pending,/Proveedor A.*desconocido/);
    await click('provider-profile');
    assert.match(await page.locator('#binding-new').innerText(),/Proveedor B/);
    assert.equal(await page.locator('#binding-pending').innerText(),pending);
    assert.match(await page.locator('#binding-explanation').innerText(),/solo si A lo admite/);
    assert.match(await page.locator('#provider-case .provider-boundary').innerText(),/reversas.*proveedor, comercio y referencias originales/);
    assert.equal(await page.locator('[data-action="provider-profile"]').evaluate(el=>el===document.activeElement),true);
    await click('provider-profile');assert.match(await page.locator('#binding-new').innerText(),/Proveedor A/);
    await page.locator('.provider-map > summary').click();
    assert.equal(await page.locator('.provider-map [data-node]').count(),7);
    for(const node of await page.locator('.provider-map [data-node]').all()) {
      await node.focus();await page.keyboard.press('Enter');
      assert.equal(await page.locator('#modal').evaluate(el=>el.open),true);
      assert.ok((await page.locator('#modal-body').innerText()).length>250);
      await page.keyboard.press('Escape');
      assert.equal(await node.evaluate(el=>el===document.activeElement),true);
    }
    logs.push('Proveedores: tres escenarios y siete piezas accesibles; cambiar perfil conserva operación e intentos pendientes en A, consultas condicionadas y reversas de origen.');
    await page.locator('.rfid-explorer > summary').click();
    for(const scenario of ['checkout','inventory','selfservice']) {
      const control=page.locator(`[data-rfid-case="${scenario}"]`);await control.focus();await page.keyboard.press('Enter');
      assert.equal(await control.getAttribute('aria-pressed'),'true');assert.ok((await page.locator('#rfid-case-title').innerText()).length>25);
      if(scenario==='inventory')assert.match(await page.locator('.rfid-boundary').innerText(),/caja no maneja stock/);
      if(scenario==='selfservice')assert.match(await page.locator('.rfid-intro').innerText(),/decisiones independientes/);
    }
    await page.locator('[data-rfid-case="checkout"]').click();
    assert.equal(await page.locator('[data-action="rfid-confirm"]').isDisabled(),true);
    await click('rfid-read');
    for(const [id,expected] of [['rfid-observations','5'],['rfid-unique','3'],['rfid-skus','2'],['rfid-cart','0']])assert.equal(await page.locator('#'+id).innerText(),expected);
    assert.match(await page.locator('#rfid-quantities').innerText(),/SKU-A: 2 unidades.*SKU-B: 1 unidad/);
    await click('rfid-read');assert.equal(await page.locator('#rfid-observations').innerText(),'10');assert.equal(await page.locator('#rfid-unique').innerText(),'3');assert.equal(await page.locator('#rfid-cart').innerText(),'0');
    await click('rfid-confirm');assert.equal(await page.locator('#rfid-cart').innerText(),'3');assert.match(await page.locator('#rfid-result').innerText(),/No hay pago ni emisión/);
    assert.equal(await page.locator('[data-action="rfid-read"]').isDisabled(),true);assert.equal(await page.locator('[data-action="rfid-confirm"]').isDisabled(),true);
    assert.equal(await page.evaluate(()=>document.activeElement.id),'rfid-result');
    await click('rfid-reset');for(const id of ['rfid-observations','rfid-unique','rfid-skus','rfid-cart'])assert.equal(await page.locator('#'+id).innerText(),'0');
    await page.locator('.rfid-map > summary').click();assert.equal(await page.locator('.rfid-map [data-node]').count(),7);
    for(const node of await page.locator('.rfid-map [data-node]').all()) {
      await node.focus();await page.keyboard.press('Enter');assert.equal(await page.locator('#modal').evaluate(el=>el.open),true);
      assert.match(await page.locator('#modal-body').innerText(),/Propuesta/);await page.keyboard.press('Escape');assert.equal(await node.evaluate(el=>el===document.activeElement),true);
    }
    logs.push('RFID: tres escenarios; 5 observaciones, 3 tags, 2 SKU y carrito 0 hasta revisión; repetición sin duplicar candidatos, dos unidades del mismo SKU, selección fijada sin pago, reinicio y siete fichas accesibles.');
    await goto('datos');await page.locator('[data-component-id="syncpolicy"]').click();assert.match(await page.locator('#modal-body').innerText(),/07:00 a 22:00/);assert.match(await page.locator('#modal-body').innerText(),/domingos/);await page.keyboard.press('Escape');
    logs.push('Propuesta: comparaciones, diagramas sin controles de código fuente y países.');
    await goto('ia');
    assert.equal(await page.locator('#chapter-nav .chapter-button').count(),8);
    assert.match(await page.locator('#chapter-counter').innerText(),/07.*08/s);
    const aiCases=await page.evaluate(()=>window.POS_CONTENT.aiCases.map(c=>({id:c.id,local:!!c.local})));
    assert.equal(aiCases.length,7);
    const coreState=await page.locator('#ai-core-state').innerText();
    for(const c of aiCases) {
      await page.locator(`[data-ai-case="${c.id}"]`).focus();await page.keyboard.press('Enter');
      assert.equal(await page.locator(`[data-ai-case="${c.id}"]`).getAttribute('aria-pressed'),'true');
      for(const network of ['online','offline']) {
        await page.locator(`[data-ai-network="${network}"]`).click();
        assert.equal(await page.locator(`[data-ai-network="${network}"]`).evaluate(el=>el===document.activeElement),true);
        for(const evidence of [true,false]) {
          await page.locator('#ai-evidence').setChecked(evidence);
          const mode=!evidence?'abstain':network==='online'?'suggest':c.local?'local':'disabled';
          assert.equal(await page.locator('.ai-outcome').getAttribute('data-ai-mode'),mode);
          assert.equal(await page.locator('#ai-core-state').innerText(),coreState);
          if(!evidence)assert.match(await page.locator('#ai-outcome-text').innerText(),/No se muestra contenido restringido/);
        }
      }
    }
    await page.locator('.ai-map > summary').click();assert.equal(await page.locator('.ai-map [data-node]').count(),7);
    for(const node of await page.locator('.ai-map [data-node]').all()) {
      await node.focus();await page.keyboard.press('Enter');
      assert.equal(await page.locator('#modal').evaluate(el=>el.open),true);
      assert.match(await page.locator('#modal-body').innerText(),/Propuesta/);
      await page.keyboard.press('Escape');assert.equal(await node.evaluate(el=>el===document.activeElement),true);
    }
    assert.equal(await page.locator('.ai-map [data-action="mermaid"]').count(),0);
    await page.locator('.ai-services > summary').click();assert.equal(await page.locator('.ai-service-list article').count(),3);
    assert.match(await page.locator('.ai-services').innerText(),/ONNX.*preview/s);
    assert.match(await page.locator('.ai-services').innerText(),/No entrenar.*no retenerlos/s);
    logs.push('IA: siete casos, 28 combinaciones conexión/evidencia, abstención, degradación local explícita, núcleo independiente y siete fichas de arquitectura por teclado.');
    await goto('repaso');
    assert.match(await page.locator('#chapter-counter').innerText(),/08.*08/s);
    const answers=await page.evaluate(()=>window.POS_CONTENT.questions.map(q=>({correct:q.options.findIndex(x=>x.correct),wrong:q.options.findIndex(x=>!x.correct)})));
    for(let i=0;i<answers.length;i++) {await page.locator(`[data-question="${i}"][data-answer="${answers[i].wrong}"]`).click();assert.match(await page.locator(`#feedback-${i}`).innerText(),/Inténtalo/);await page.locator(`[data-question="${i}"][data-answer="${answers[i].correct}"]`).click();}
    assert.match(await page.locator('#quiz-score').innerText(),/4 de 4/);await click('quiz-reset');assert.match(await page.locator('#quiz-score').innerText(),/0 de 4/);
    await click('glossary');await page.locator('#glossary-search').fill('acl');assert.equal(await page.locator('.glossary-item').count(),1);
    await page.locator('#glossary-search').fill('xxxxyyyy');assert.match(await page.locator('#glossary-results').innerText(),/No hay/);await page.keyboard.press('Escape');assert.equal(await page.locator('#modal').evaluate(el=>el.open),false);
    await click('sources');assert.equal(await page.locator('.source-image').evaluate(img=>img.complete&&img.naturalWidth>0),true);await page.keyboard.press('Escape');
    await click('present');assert.equal(await page.locator('.sidebar').isVisible(),false);await click('present');
    await goto('datos');await page.reload();assert.match(await page.locator('h1').innerText(),/operación deja una huella/);
    logs.push('Repaso, filtros de glosario, fuentes, exposición, cierre con Esc y enlaces profundos.');
    const snapshots=path.join(root,'qa');await fs.mkdir(snapshots,{recursive:true});
    const layoutProblems=[];
    for(const [width,height] of [[1440,1000],[1024,768],[768,1024],[390,844],[375,812],[844,390]]) {
      await page.setViewportSize({width,height});
      for(const id of ['mapa','venta','datos','offline','propuesta','evolucion','ia','repaso']) {
        await goto(id);
        if(id==='mapa') {
          for(const view of ['general','repositorios','peticiones','evidencia']) {
            await page.locator(`[data-map-view="${view}"]`).click();
            assert.equal(await page.locator('[role="tabpanel"]:visible').count(),1);
            assert.equal(await page.locator(`#map-panel-${view}`).isVisible(),true);
            if(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1))layoutProblems.push(`ecosystem-${view}: overflow at ${width}x${height}`);
            if([1440,390].includes(width))await page.locator(`#map-panel-${view}`).screenshot({path:path.join(snapshots,`ecosystem-${view}-${width}.png`)});
          }
          for(const view of ['endpoints','deployment','coverage']) {
            await page.locator(`[data-tech-view="${view}"]`).click();
            if(view==='deployment')await page.locator('[data-tech-zoom="100"]').click();
            if(view==='endpoints'){await page.locator('[data-tech-reset]').click();await page.locator('.tech-endpoint details > summary').first().click();}
            if(view==='coverage'){
              await page.locator('.tech-functional:not(.tech-snapshots) > summary').click();
              await page.locator('.tech-audited-components > summary').click();
              for(const zone of await page.locator('.tech-audited-components .tech-zone > summary').all())await zone.click();
            }
            if(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1))layoutProblems.push(`technical-${view}: overflow at ${width}x${height}`);
            if([1440,390].includes(width)&&['endpoints','deployment'].includes(view))await page.locator('#tech-view').screenshot({path:path.join(snapshots,`technical-${view}-${width}.png`)});
            if(width===390&&view==='deployment'){await page.locator('[data-tech-node="UI"]').focus();await page.keyboard.press('Enter');await page.screenshot({path:path.join(snapshots,'technical-hotspot-390.png')});await page.keyboard.press('Escape');}
          }
          await page.locator('[data-map-view="general"]').click();
        }
        if(id==='datos') {
          for(const flow of dataflows) {
            await page.locator('#dataflow-select').selectOption(flow.id);
            await page.locator('[data-df-action="next"]').click();
            if(width<800)await page.locator('[data-df-zoom="100"]').click();
            if(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1))layoutProblems.push(`dataflow-${flow.id}: overflow at ${width}x${height}`);
            if([1440,390].includes(width)&&['D01','D03','D05'].includes(flow.id))await page.locator('#dataflow-explorer').screenshot({path:path.join(snapshots,`dataflow-${flow.id}-${width}.png`)});
          }
        }
        if(id==='offline') {
          await page.locator('#edgecase-explorer > summary').click();await page.locator('[data-edgecase="payment"]').click();
          if([1440,390].includes(width))await page.locator('.edgecase-layout').screenshot({path:path.join(snapshots,`edgecases-${width}.png`)});
        }
        if(id==='evolucion') {
          await page.locator('[data-provider-case="timeout"]').click();await click('provider-profile');
          await page.locator('.provider-map > summary').click();
          if([1440,390].includes(width))await page.locator('.provider-module').screenshot({path:path.join(snapshots,`providers-${width}.png`)});
          await page.locator('.rfid-explorer > summary').click();await click('rfid-reset');await click('rfid-read');await click('rfid-read');
          await page.locator('.rfid-map > summary').click();
          if([1440,390].includes(width))await page.locator('.rfid-module').screenshot({path:path.join(snapshots,`rfid-${width}.png`)});
        }
        if(id==='ia') {
          await page.locator('[data-ai-case="catalog"]').click();
          await page.locator('[data-ai-network="offline"]').click();await page.locator('#ai-evidence').check();
          await page.locator('.ai-map > summary').click();
          await page.locator('.ai-services > summary').click();
          if([1440,390].includes(width)) {
            await page.locator('.chapter-title').focus();await page.evaluate(()=>window.scrollTo(0,0));
            await page.screenshot({path:path.join(snapshots,`ia-${width}.png`),fullPage:true});
          }
        }
        const overflow=await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1);
        if(overflow)layoutProblems.push(`${id}: overflow at ${width}x${height}`);
        if((width===1440&&['mapa','venta','offline','propuesta'].includes(id))||(width===390&&['mapa','offline'].includes(id)))await page.screenshot({path:path.join(snapshots,`${id}-${width}.png`),fullPage:true});
      }
    }
    assert.deepEqual(layoutProblems,[]);
    logs.push('Responsive: 48 capítulos, 24 pestañas de Ecosistema, 18 vistas técnicas y 30 recorridos de datos sin desbordamiento horizontal (375–1440 px y paisaje), con diagramas y casos límite desplegados.');
    await page.setViewportSize({width:390,height:844});await goto('mapa');await page.locator('[data-node="localdb"]').click();assert.equal(await page.evaluate(()=>document.activeElement.id),'inspector');
    assert.deepEqual(errors,[]);assert.deepEqual(external,[]);
    const filePage=await browser.newPage({viewport:{width:1440,height:1000},offline:true});
    await filePage.goto(pathToFileURL(path.join(root,'index.html')).href+'#offline');await filePage.locator('[data-action="offline-next"]').click();assert.equal(await filePage.locator('#actual-network').innerText(),'Sin Internet');
    await filePage.goto(pathToFileURL(path.join(root,'index.html')).href+'#evolucion');await filePage.locator('[data-provider-case="timeout"]').click();
    await filePage.locator('[data-action="provider-profile"]').click();assert.match(await filePage.locator('#binding-new').innerText(),/Proveedor B/);
    assert.match(await filePage.locator('#binding-pending').innerText(),/Proveedor A.*desconocido/);
    await filePage.locator('.rfid-explorer > summary').click();await filePage.locator('[data-action="rfid-read"]').click();assert.equal(await filePage.locator('#rfid-unique').innerText(),'3');
    await filePage.locator('[data-action="rfid-confirm"]').click();assert.equal(await filePage.locator('#rfid-cart').innerText(),'3');assert.match(await filePage.locator('#rfid-result').innerText(),/No hay pago ni emisión/);
    await filePage.goto(pathToFileURL(path.join(root,'index.html')).href+'#ia');
    await filePage.locator('[data-ai-network="offline"]').click();assert.equal(await filePage.locator('.ai-outcome').getAttribute('data-ai-mode'),'local');
    await filePage.locator('#ai-evidence').uncheck();assert.equal(await filePage.locator('.ai-outcome').getAttribute('data-ai-mode'),'abstain');
    await filePage.goto(pathToFileURL(path.join(root,'index.html')).href+'#mapa?vista=evidencia');await filePage.locator('[data-tech-view="endpoints"]').click();
    await filePage.locator('#tech-query').fill('/punto-de-venta');assert.ok(await filePage.locator('.tech-endpoint').count()>0);
    await filePage.locator('[data-tech-view="deployment"]').click();assert.equal(await filePage.locator('#tech-diagram-render svg').count(),1);
    const fileErrors=[],fileExternal=[];
    filePage.on('pageerror',error=>fileErrors.push(error.message));
    filePage.on('request',request=>{if(!request.url().startsWith('file:')&&!request.url().startsWith('data:'))fileExternal.push(request.url());});
    await filePage.goto(pathToFileURL(path.join(root,'index.html')).href+'#datos');
    for(const flow of dataflows){await filePage.locator('#dataflow-select').selectOption(flow.id);await filePage.locator('[data-df-action="next"]').click();assert.equal(await filePage.locator('#dataflow-step-title').innerText(),flow.steps[1].title);}
    assert.deepEqual(fileErrors,[]);assert.deepEqual(fileExternal,[]);
    logs.push('Archivo local file:// operativo sin red; cero solicitudes externas y errores de JavaScript durante las pruebas.');
    const blocked=await page.request.get(`${base}/repos/package.json`);assert.equal(blocked.status(),403);
    const badMethod=await page.request.post(base);assert.equal(badMethod.status(),405);
    logs.push('Servidor limitado a lectura de la presentación y fuentes; no sirve los repositorios.');
    const report={date:new Date().toISOString(),engine:'Playwright / Chromium',checks:logs,errors,external,layoutProblems};
    await fs.writeFile(path.join(snapshots,'report.json'),JSON.stringify(report,null,2)+'\n');
    console.log(logs.join('\n'));
    console.log(`PASS: ${logs.length} grupos de verificaciones. Capturas en presentation/qa/.`);
  } finally {if(browser)await browser.close();server.kill();}
}
main().catch(e=>{console.error(e);process.exitCode=1;});
