/* Offline UI QA for the current POS map and proposed corporate reuse; never contacts corporate services. */
'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs/promises'),path=require('node:path'),{pathToFileURL}=require('node:url');
const root=path.resolve(__dirname,'..'),qa=path.join(root,'qa'),url=pathToFileURL(path.join(root,'index.html')).href+'#mapa';
const norm=s=>s.replace(/\s+/g,' ').trim();
function playwright(){for(const p of [process.env.PLAYWRIGHT_MODULE_PATH,'playwright',require('node:path').join(require('node:os').homedir(), '.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright')].filter(Boolean)){try{return require(p);}catch(e){if(e.code!=='MODULE_NOT_FOUND')throw e;}}throw Error('An existing Playwright runtime is required. No install is performed.');}
async function main(){
 const report={date:new Date().toISOString(),checks:[],errors:[],external:[],layout:[],connectionViews:0,modalViews:0};
 await fs.mkdir(qa,{recursive:true});const browser=await playwright().chromium.launch({headless:true});
 try{
  const page=await browser.newPage({viewport:{width:1440,height:1000},reducedMotion:'reduce',offline:true});
  page.on('pageerror',e=>report.errors.push(e.message));page.on('request',r=>{if(!r.url().startsWith('file:')&&!r.url().startsWith('data:'))report.external.push(r.url());});
  await page.goto(url+'?vista=repositorios');const data=await page.evaluate(()=>window.POS_REPOSITORIES);
  assert.equal(await page.locator('[data-map-view="repositorios"]').getAttribute('aria-selected'),'true');
  assert.equal(await page.locator('#map-panel-repositorios').isVisible(),true);
  assert.equal(data.repositories.length,8);assert.equal(data.connections.length,11);
  const runtime=data.repositories.filter(r=>r.role==='runtime'),platform=data.repositories.filter(r=>r.role==='platform');
  assert.equal(runtime.length,6);assert.equal(platform.length,2);
  assert.equal(await page.locator('.repo-node').count(),6);assert.equal(await page.locator('#repo-references').count(),0);
  assert.equal(await page.locator('.repo-platform-module').count(),0);
  assert.equal(await page.locator('.repo-module [data-repo-zoom]').count(),0);
  assert.ok(!(await page.locator('.repo-map-caption').innerText()).includes('Línea continua'));
  for(const repository of platform)assert.equal(await page.locator('[data-repository="'+repository.id+'"]').count(),0);
  assert.equal(await page.locator('#repo-connection option').count(),10);
  const actual=data.connections.filter(c=>[c.from,c.to].every(id=>runtime.some(r=>r.id===id)));
  assert.deepEqual(await page.locator('#repo-connection option').evaluateAll(options=>options.map(o=>o.value)),actual.map(c=>c.id));
  async function geometry(context){
   const out=await page.evaluate(()=>{
    const problems=[];if(document.documentElement.scrollWidth>innerWidth+1)problems.push('document overflow');
    const rect=el=>el.getBoundingClientRect(),overlap=(a,b)=>Math.min(a.right,b.right)-Math.max(a.left,b.left)>1&&Math.min(a.bottom,b.bottom)-Math.max(a.top,b.top)>1;
    const nodes=[...document.querySelectorAll('.repo-node')],labels=[...document.querySelectorAll('.repo-edge-number')];
    for(const el of [...nodes,...document.querySelectorAll('.repo-platform-module [data-repository]')])if(el.scrollHeight>el.clientHeight+2)problems.push(el.dataset.repository+' clipped text');
    for(let i=0;i<labels.length;i++){for(const n of nodes)if(overlap(rect(labels[i]),rect(n)))problems.push(labels[i].dataset.repoEdge+' badge overlaps '+n.dataset.repository);for(let j=i+1;j<labels.length;j++)if(overlap(rect(labels[i]),rect(labels[j])))problems.push(labels[i].dataset.repoEdge+' badge overlaps '+labels[j].dataset.repoEdge);}
    for(const el of document.querySelectorAll('.repo-wire > path:first-child')){const b=el.getBBox(),s=el.ownerSVGElement;if(b.x<0||b.y<0||b.x+b.width>Number(s.getAttribute('width'))+1||b.y+b.height>Number(s.getAttribute('height'))+1)problems.push('path outside map');}
    return problems;
   });report.layout.push(...out.map(s=>context+': '+s));
  }
  for(const [width,height] of [[1440,1000],[390,844]]){
   await page.setViewportSize({width,height});await page.locator('#repo-all').check();
   for(const connection of actual){
    await page.locator('#repo-connection').selectOption(connection.id);
    const text=norm(await page.locator('#repo-connection-detail').innerText());
    assert.ok(text.includes(norm(connection.detail)));assert.ok(text.includes(connection.from)&&text.includes(connection.to));
    assert.equal(await page.locator('#repo-connection-detail a').count(),connection.sources.length);
    assert.deepEqual(await page.locator('#repo-connection-detail a').evaluateAll(a=>a.map(a=>a.getAttribute('href'))),connection.sources.map(s=>s.url));
    await page.locator('#repo-all').uncheck();
    assert.equal(await page.locator('.repo-edge-number').count(),1);
    await page.locator('#repo-all').check();assert.equal(await page.locator('.repo-edge-number').count(),actual.length);
    await geometry(connection.id+'/'+width);report.connectionViews++;
   }
   for(const repository of runtime){
    const target=page.locator('[data-repository="'+repository.id+'"]');await target.focus();await page.keyboard.press('Enter');
    assert.equal(await page.locator('#modal-title').innerText(),repository.name);
    assert.ok(norm(await page.locator('#modal-body').innerText()).includes(norm(repository.summary)));
    const scope=page.locator('#modal-body details.detail-section');assert.equal(await scope.evaluate(el=>el.open),false);
    await scope.locator('summary').click();assert.ok(norm(await scope.innerText()).includes(norm(repository.boundary)));
    await scope.locator('summary').click();
    assert.equal(await page.locator('#modal-body .repo-units dt').count(),repository.units.length);
    assert.deepEqual(await page.locator('#modal-body .repo-sources a').evaluateAll(a=>a.map(a=>a.getAttribute('href'))),repository.sources.map(s=>s.url));
    if(repository.id==='mountain-concentrador')await page.locator('#modal').screenshot({path:path.join(qa,'repositories-concentrador-modal-'+width+'.png')});
    await page.keyboard.press('Escape');assert.equal(await page.evaluate(()=>document.activeElement.dataset.repository),repository.id);
    report.modalViews++;
   }
   await page.locator('#repo-connection').selectOption('repo-admin');await page.locator('.repo-module').screenshot({path:path.join(qa,'repositories-admin-'+width+'.png')});
   const repositoryHash=new URL(page.url()).hash;
   await page.locator('.repo-viewport').focus();await page.keyboard.press('ArrowRight');await page.keyboard.press('ArrowLeft');assert.equal(new URL(page.url()).hash,repositoryHash);
   assert.equal(await page.locator('.repo-viewport').evaluate(el=>el.scrollLeft),0,'The fitted map must not need horizontal keyboard scrolling');
   await page.locator('.repo-viewport').screenshot({path:path.join(qa,'repositories-fit-'+width+'.png')});
  }
  report.checks.push('Ecosistema: 20 selecciones de conexiones actuales y 12 fichas por teclado, fuentes exactas, nombres completos y límites; modal Escape devuelve el foco. Plataforma fuera de las fichas y del selector.');
  // Full-map badges must be directly reachable, including the route over the middle top card.
  await page.setViewportSize({width:1440,height:1000});
  for(const connection of actual){const b=page.locator('button[data-repo-edge="'+connection.id+'"]');await b.focus();await page.keyboard.press('Enter');assert.equal(await page.locator('#repo-connection').inputValue(),connection.id);assert.equal(await page.evaluate(()=>document.activeElement.dataset.repoEdge),connection.id);}
  report.checks.push('Los diez números de relaciones operacionales se seleccionan por teclado; precedentes se mantienen fuera del grafo POS.');
  await page.locator('#repo-connection').selectOption('repo-admin');await page.locator('#repo-all').uncheck();
  await page.locator('[data-map-view="general"]').click();assert.equal(await page.locator('.repo-module').isVisible(),false);
  await page.locator('[data-map-view="repositorios"]').click();
  assert.equal(await page.locator('#repo-connection').inputValue(),'repo-admin');
  assert.equal(await page.locator('#repo-all').isChecked(),false);assert.equal(await page.locator('.repo-edge-number').count(),1);
  await page.locator('#repo-all').check();
  report.checks.push('La pestaña Repositorios conserva conexión y filtro al explorar Vista general y volver.');
  for(const [width,height] of [[1024,768],[768,1024],[375,812],[844,390],[1440,1000],[390,844]]){
   await page.setViewportSize({width,height});await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));await geometry('resize/'+width+'x'+height);
   const mapsize=await page.locator('.repo-map').evaluate(el=>{const viewport=el.closest('.repo-viewport');return {width:parseFloat(el.style.width),displayWidth:el.getBoundingClientRect().width,available:viewport.clientWidth,scrollWidth:viewport.scrollWidth,count:el.querySelectorAll('.repo-node').length};});assert.equal(mapsize.count,6);
   assert.ok(mapsize.displayWidth<=mapsize.available+1,'Map must fit its viewport automatically at '+width+'px');
   assert.ok(mapsize.scrollWidth<=mapsize.available+1,'Map must not create horizontal overflow at '+width+'px');
   assert.equal(await page.locator('.repo-module [data-repo-zoom]').count(),0);
   if(width===390)assert.equal(mapsize.width,400);
  }
  report.checks.push('Ajuste automático al ancho en seis tamaños, sin botón de zoom ni leyenda de tipos de línea; teclado y mapa vertical conservados, sin desbordamiento horizontal, recortes ni solapes.');
  await page.setViewportSize({width:1440,height:1000});await page.locator('[data-repository="mountain-concentrador"]').focus();await page.keyboard.press('Enter');
  await page.setViewportSize({width:390,height:844});await page.keyboard.press('Escape');
  assert.equal(await page.evaluate(()=>document.activeElement.dataset.repository),'mountain-concentrador','Resize during modal must preserve a useful return focus');
  report.checks.push('Resize con modal abierto conserva el foco del repositorio al cerrar.');
  const corporateConnection=data.connections.find(c=>c.id==='repo-core-ci');assert.ok(corporateConnection);
  for(const [width,height] of [[1440,1000],[390,844]]){
   await page.setViewportSize({width,height});await page.goto(url.replace('#mapa','#propuesta'));
   await page.locator('.repo-platform-module').waitFor();
   assert.equal(await page.locator('.repo-module').count(),0);
   assert.equal(await page.locator('.repo-platform-module [data-repository]').count(),2);
   assert.deepEqual(await page.locator('.repo-platform-module [data-repository]').evaluateAll(nodes=>nodes.map(n=>n.dataset.repository)),platform.map(r=>r.id));
   for(const repository of platform){
    const target=page.locator('.repo-platform-module [data-repository="'+repository.id+'"]');await target.focus();await page.keyboard.press('Enter');
    assert.equal(await page.locator('#modal-title').innerText(),repository.name);
    assert.ok(norm(await page.locator('#modal-body').innerText()).includes(norm(repository.summary)));
    const scope=page.locator('#modal-body details.detail-section');assert.equal(await scope.evaluate(el=>el.open),false);
    await scope.locator('summary').click();assert.ok(norm(await scope.innerText()).includes(norm(repository.boundary)));
    await scope.locator('summary').click();
    assert.equal(await page.locator('#modal-body .repo-units dt').count(),repository.units.length);
    assert.deepEqual(await page.locator('#modal-body .repo-sources a').evaluateAll(links=>links.map(a=>a.getAttribute('href'))),repository.sources.map(s=>s.url));
    await page.keyboard.press('Escape');assert.equal(await page.evaluate(()=>document.activeElement.dataset.repository),repository.id);
    report.modalViews++;
   }
   const connectionDetail=page.locator('details.repo-platform-connection');assert.equal(await connectionDetail.count(),1);
   if(!await connectionDetail.evaluate(el=>el.open)){await connectionDetail.locator('summary').focus();await page.keyboard.press('Enter');}
   assert.ok(await connectionDetail.evaluate(el=>el.open));
   const connectionText=norm(await connectionDetail.innerText());assert.ok(connectionText.includes(norm(corporateConnection.detail)));
   assert.deepEqual(await connectionDetail.locator('.repo-sources a').evaluateAll(links=>links.map(a=>a.getAttribute('href'))),corporateConnection.sources.map(s=>s.url));
   await geometry('propuesta/'+width);
   await page.locator('.repo-platform-module').screenshot({path:path.join(qa,'repositories-proposed-platform-'+width+'.png')});
   await page.goto(url.replace('#mapa','#evolucion'));await page.locator('.chapter-evolucion').waitFor();
   assert.equal(await page.locator('.repo-platform-module, .reuse-grid').count(),0);
   for(const repository of platform)assert.equal(await page.locator('[data-repository="'+repository.id+'"]').count(),0);
  }
  report.checks.push('Propuesta: dos fichas corporativas en escritorio y móvil, con unidades, límites, fuentes y foco de retorno intactos. Evidencia CI/CD accesible por teclado; Evolución sin fichas duplicadas.');
  assert.deepEqual(report.errors,[]);assert.deepEqual(report.external,[]);report.layout=[...new Set(report.layout)];assert.deepEqual(report.layout,[]);
  report.status='PASS';console.log(report.checks.join('\n'));console.log('PASS: '+report.checks.length+' grupos; file:// offline, cero solicitudes externas.');
 }catch(error){report.status='FAIL';report.failure=error.stack;throw error;}
 finally{report.layout=[...new Set(report.layout)];await fs.writeFile(path.join(qa,'repositories-report.json'),JSON.stringify(report,null,2)+'\n');await browser.close();}
}
main().catch(e=>{console.error(e);process.exitCode=1;});
