/* Offline UI QA for the nine-repository map; never contacts corporate services. */
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
  await page.goto(url);const data=await page.evaluate(()=>window.POS_REPOSITORIES);
  assert.equal(data.repositories.length,9);assert.equal(data.connections.length,13);
  assert.equal(await page.locator('.repo-node').count(),6);assert.equal(await page.locator('#repo-references [data-repository]').count(),3);
  assert.equal(await page.locator('#repo-connection option').count(),13);
  const actual=data.connections.filter(c=>[c.from,c.to].every(id=>data.repositories.find(r=>r.id===id).role==='runtime'));
  async function geometry(context){
   const out=await page.evaluate(()=>{
    const problems=[];if(document.documentElement.scrollWidth>innerWidth+1)problems.push('document overflow');
    const rect=el=>el.getBoundingClientRect(),overlap=(a,b)=>Math.min(a.right,b.right)-Math.max(a.left,b.left)>1&&Math.min(a.bottom,b.bottom)-Math.max(a.top,b.top)>1;
    const nodes=[...document.querySelectorAll('.repo-node')],labels=[...document.querySelectorAll('.repo-edge-number')];
    for(const el of [...nodes,...document.querySelectorAll('#repo-references button')])if(el.scrollHeight>el.clientHeight+2)problems.push(el.dataset.repository+' clipped text');
    for(let i=0;i<labels.length;i++){for(const n of nodes)if(overlap(rect(labels[i]),rect(n)))problems.push(labels[i].dataset.repoEdge+' badge overlaps '+n.dataset.repository);for(let j=i+1;j<labels.length;j++)if(overlap(rect(labels[i]),rect(labels[j])))problems.push(labels[i].dataset.repoEdge+' badge overlaps '+labels[j].dataset.repoEdge);}
    for(const el of document.querySelectorAll('.repo-wire > path:first-child')){const b=el.getBBox(),s=el.ownerSVGElement;if(b.x<0||b.y<0||b.x+b.width>Number(s.getAttribute('width'))+1||b.y+b.height>Number(s.getAttribute('height'))+1)problems.push('path outside map');}
    return problems;
   });report.layout.push(...out.map(s=>context+': '+s));
  }
  for(const [width,height] of [[1440,1000],[390,844]]){
   await page.setViewportSize({width,height});await page.locator('#repo-all').check();
   for(const connection of data.connections){
    await page.locator('#repo-connection').selectOption(connection.id);
    const text=norm(await page.locator('#repo-connection-detail').innerText());
    assert.ok(text.includes(norm(connection.detail)));assert.ok(text.includes(connection.from)&&text.includes(connection.to));
    assert.equal(await page.locator('#repo-connection-detail a').count(),connection.sources.length);
    assert.deepEqual(await page.locator('#repo-connection-detail a').evaluateAll(a=>a.map(a=>a.getAttribute('href'))),connection.sources.map(s=>s.url));
    await page.locator('#repo-all').uncheck();
    assert.equal(await page.locator('.repo-edge-number').count(),actual.some(c=>c.id===connection.id)?1:0);
    await page.locator('#repo-all').check();assert.equal(await page.locator('.repo-edge-number').count(),actual.length);
    await geometry(connection.id+'/'+width);report.connectionViews++;
   }
   for(const repository of data.repositories){
    const target=page.locator('[data-repository="'+repository.id+'"]');await target.focus();await page.keyboard.press('Enter');
    assert.equal(await page.locator('#modal-title').innerText(),repository.name);
    const text=norm(await page.locator('#modal-body').innerText());assert.ok(text.includes(norm(repository.boundary)));assert.ok(text.includes(norm(repository.summary)));
    assert.equal(await page.locator('#modal-body .repo-units dt').count(),repository.units.length);
    assert.deepEqual(await page.locator('#modal-body .repo-sources a').evaluateAll(a=>a.map(a=>a.getAttribute('href'))),repository.sources.map(s=>s.url));
    if(repository.id==='mountain-concentrador')await page.locator('#modal').screenshot({path:path.join(qa,'repositories-concentrador-modal-'+width+'.png')});
    await page.keyboard.press('Escape');assert.equal(await page.evaluate(()=>document.activeElement.dataset.repository),repository.id);
    report.modalViews++;
   }
   await page.locator('#repo-connection').selectOption('repo-admin');await page.locator('.repo-module').screenshot({path:path.join(qa,'repositories-admin-'+width+'.png')});
   await page.locator('[data-repo-zoom]').click();assert.equal(await page.locator('[data-repo-zoom]').innerText(),'Ajustar');await geometry('100/'+width);
   await page.locator('.repo-viewport').focus();await page.keyboard.press('ArrowRight');await page.keyboard.press('ArrowLeft');assert.ok(page.url().endsWith('#mapa'));
   await page.locator('.repo-viewport').screenshot({path:path.join(qa,'repositories-100-'+width+'.png')});
   await page.locator('[data-repo-zoom]').click();assert.equal(await page.locator('[data-repo-zoom]').innerText(),'100 %');
  }
  report.checks.push('26 selecciones de conexión y 18 fichas por teclado, fuentes exactas, nombres completos y límites; modal Escape devuelve el foco.');
  // Full-map badges must be directly reachable, including the route over the middle top card.
  await page.setViewportSize({width:1440,height:1000});
  for(const connection of actual){const b=page.locator('button[data-repo-edge="'+connection.id+'"]');await b.focus();await page.keyboard.press('Enter');assert.equal(await page.locator('#repo-connection').inputValue(),connection.id);assert.equal(await page.evaluate(()=>document.activeElement.dataset.repoEdge),connection.id);}
  report.checks.push('Los diez números de relaciones operacionales se seleccionan por teclado; precedentes se mantienen fuera del grafo POS.');
  for(const [width,height] of [[1024,768],[768,1024],[375,812],[844,390],[1440,1000],[390,844]]){
   await page.setViewportSize({width,height});await geometry('resize/'+width+'x'+height);
   const mapsize=await page.locator('.repo-map').evaluate(el=>({width:parseFloat(el.style.width),count:el.querySelectorAll('.repo-node').length}));assert.equal(mapsize.count,6);
   if(width===390)assert.equal(mapsize.width,400);
  }
  report.checks.push('Fit/100 %, seis tamaños y cambio entre columnas y mapa vertical: nombres, tarjetas, flechas y números sin recortes ni solapes.');
  await page.setViewportSize({width:1440,height:1000});await page.locator('[data-repository="mountain-concentrador"]').focus();await page.keyboard.press('Enter');
  await page.setViewportSize({width:390,height:844});await page.keyboard.press('Escape');
  assert.equal(await page.evaluate(()=>document.activeElement.dataset.repository),'mountain-concentrador','Resize during modal must preserve a useful return focus');
  report.checks.push('Resize con modal abierto conserva el foco del repositorio al cerrar.');
  assert.deepEqual(report.errors,[]);assert.deepEqual(report.external,[]);report.layout=[...new Set(report.layout)];assert.deepEqual(report.layout,[]);
  report.status='PASS';console.log(report.checks.join('\n'));console.log('PASS: '+report.checks.length+' grupos; file:// offline, cero solicitudes externas.');
 }catch(error){report.status='FAIL';report.failure=error.stack;throw error;}
 finally{report.layout=[...new Set(report.layout)];await fs.writeFile(path.join(qa,'repositories-report.json'),JSON.stringify(report,null,2)+'\n');await browser.close();}
}
main().catch(e=>{console.error(e);process.exitCode=1;});
