/* Local interaction-viewer QA. Never executes corporate APIs. */
'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs/promises'),path=require('node:path'),vm=require('node:vm'),crypto=require('node:crypto');
const {pathToFileURL}=require('node:url'),{spawn}=require('node:child_process');
const root=path.resolve(__dirname,'..'),qa=path.join(root,'qa');
const sizes=[[1440,1000],[1024,768],[768,1024],[390,844],[375,812],[844,390]],modes=['step','all','sequence'];
const norm=v=>String(v).replace(/\s+/g,' ').trim(),slug=v=>v.toLowerCase().replace(/\x60/g,'').replace(/[^\p{L}\p{N}\s_-]/gu,'').replace(/ /g,'-');
function playwright(){for(const name of [process.env.PLAYWRIGHT_MODULE_PATH,'playwright',require('node:path').join(require('node:os').homedir(), '.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright')].filter(Boolean)){try{return require(name);}catch(e){if(e.code!=='MODULE_NOT_FOUND')throw e;}}throw Error('Use existing Playwright via PLAYWRIGHT_MODULE_PATH. No dependencies are installed.');}
async function metadata(report){
 const sandbox={window:{}},urls=new Set();
 for(const name of ['current','extensions','proposed']){
  const filename='interactions-'+name+'.js',source=await fs.readFile(path.join(root,filename),'utf8');
  report.assets[filename]=crypto.createHash('sha256').update(source).digest('hex');vm.runInNewContext(source,sandbox);
 }
 const rawFlows=JSON.parse(JSON.stringify(Object.values(sandbox.window).flat()));
 assert.deepEqual(rawFlows.map(f=>f.id).sort(),['sale','sync','masters','customer','printing','credit','proposed-sale','proposed-erp'].sort());
 for(const f of rawFlows){
  for(const key of ['id','title','mode','summary','boundary'])assert.ok(f[key],f.id+' '+key);
  const sets={};for(const key of ['groups','nodes','edges']){sets[key]=new Set(f[key].map(i=>i.id));assert.equal(sets[key].size,f[key].length,f.id+' duplicate '+key);}
  for(const g of f.groups){for(const key of ['title','repo','runtime','zone'])assert.ok(g[key],g.id+' '+key);if(g.evidence!==undefined)assert.ok(typeof g.evidence==='string'&&g.evidence.trim(),g.id+' evidence');}
  for(const n of f.nodes){assert.ok(sets.groups.has(n.group));assert.ok(['component','table','external'].includes(n.kind));for(const key of ['title','subtitle','detail'])assert.ok(n[key],n.id+' '+key);}
  for(const e of f.edges){
   assert.ok(sets.nodes.has(e.from)&&sets.nodes.has(e.to),e.id+' endpoint');
   assert.ok(['HTTP','SQL','MongoDB','AMQP','Interno','SOAP','Por confirmar'].includes(e.protocol),e.id+' protocol');
   assert.ok(['code','reported','unknown','proposed'].includes(e.certainty),e.id+' evidence');
   if(f.mode==='proposed')assert.equal(e.certainty,'proposed');
   for(const key of ['label','detail','effect','boundary'])assert.ok(e[key],e.id+' '+key);
  }
  const used=new Set();for(const s of f.steps){assert.ok(s.title&&s.detail&&s.edges.length);if(s.boundary!==undefined)assert.ok(typeof s.boundary==='string'&&s.boundary.trim());for(const id of s.edges){assert.ok(sets.edges.has(id));used.add(id);}}
  assert.equal(used.size,f.edges.length,f.id+' unreferenced edge');
  for(const i of [...f.nodes,...f.edges]){assert.ok(i.sources.length);for(const s of i.sources){assert.ok(s.label);urls.add(s.url);}}
 }
 const original=JSON.stringify([sandbox.window.POS_INTERACTIONS_CURRENT,sandbox.window.POS_INTERACTIONS_EXTENSIONS,sandbox.window.POS_INTERACTIONS_PROPOSED]);
 const viewSource=await fs.readFile(path.join(root,'interactions-view-data.js'),'utf8');report.assets['interactions-view-data.js']=crypto.createHash('sha256').update(viewSource).digest('hex');vm.runInNewContext(viewSource,sandbox);
 assert.equal(typeof sandbox.window.POS_INTERACTIONS_VIEW?.all,'function','App-level projection must be explicitly loaded');
 const flows=JSON.parse(JSON.stringify(sandbox.window.POS_INTERACTIONS_VIEW.all()));
 assert.equal(JSON.stringify([sandbox.window.POS_INTERACTIONS_CURRENT,sandbox.window.POS_INTERACTIONS_EXTENSIONS,sandbox.window.POS_INTERACTIONS_PROPOSED]),original,'Projection must not mutate audited implementation data');
 assert.deepEqual(flows.map(f=>f.id).sort(),rawFlows.map(f=>f.id).sort());
 report.projection=[];
 for(const f of flows){
  const raw=rawFlows.find(r=>r.id===f.id),nodes=new Map(f.nodes.map(n=>[n.id,n])),edges=new Map(f.edges.map(e=>[e.id,e]));
  assert.equal(nodes.size,f.nodes.length);assert.equal(edges.size,f.edges.length);assert.equal(f.mode,raw.mode);
  const projectedId=n=>n.kind==='component'?'app:'+n.group:n.id;
  // The master publication is a broker effect, despite its source model's shared app group.
  const retainInternalEffects=new Set(['masters:enqueue-job']);
  const hidden=raw.edges.filter(e=>{const a=raw.nodes.find(n=>n.id===e.from),b=raw.nodes.find(n=>n.id===e.to);return e.protocol==='Interno'&&a.kind==='component'&&b.kind==='component'&&a.group===b.group&&!retainInternalEffects.has(f.id+':'+e.id);});
  const hiddenIds=new Set(hidden.map(e=>e.id)),retained=raw.edges.filter(e=>!hiddenIds.has(e.id));
  assert.deepEqual([...edges.keys()].sort(),retained.map(e=>e.id).sort(),f.id+' must preserve every transport/query/unknown-boundary edge');
  assert.deepEqual((f.implementationEdges||[]).map(e=>e.id).sort(),[...hiddenIds].sort(),f.id+' only internal same-app calls may be hidden');
  for(const n of raw.nodes){const v=nodes.get(projectedId(n));assert.ok(v,f.id+' missing projection '+n.id);assert.ok(v.implementationNodes.some(r=>r.id===n.id),n.id+' missing implementation trace');if(n.kind!=='component')assert.equal(v.kind,n.kind);if(n.kind==='table')assert.equal(v.title,n.title,n.id+' table title altered');}
  for(const n of f.nodes){assert.ok(f.groups.some(g=>g.id===n.group));for(const item of n.implementationNodes)assert.ok(raw.nodes.some(r=>r.id===item.id));}
  for(const e of retained){const v=edges.get(e.id);for(const key of ['protocol','certainty','detail','effect','boundary'])assert.equal(v[key],e[key],e.id+' altered '+key);if(['HTTP','SOAP'].includes(e.protocol)||/\b(SELECT|INSERT|UPDATE|DELETE|BEGIN|COMMIT|ROLLBACK)\b/.test(e.label))assert.equal(v.label,e.label,e.id+' route/contract/SQL text altered');assert.equal(v.from,projectedId(raw.nodes.find(n=>n.id===e.from)));assert.equal(v.to,projectedId(raw.nodes.find(n=>n.id===e.to)));assert.deepEqual(v.implementationEdges,[e],e.id+' missing implementation trace');if(retainInternalEffects.has(f.id+':'+e.id))assert.ok(v.retainedInternalEffect,'Broker effect needs an explicit explanation');}
  const used=new Set();for(const s of f.steps){assert.ok(s.edges.length);for(const id of s.edges){assert.ok(edges.has(id));used.add(id);}assert.ok(s.implementationSteps.length);assert.ok(s.implementationEdges.length);}
  assert.deepEqual([...used].sort(),[...edges.keys()].sort(),f.id+' orphaned projected edge');
  const rawRows=raw.steps.reduce((n,s)=>n+s.edges.length,0),rows=f.steps.reduce((n,s)=>n+s.edges.length,0);assert.ok(rows<=rawRows);assert.ok(f.steps.length<=raw.steps.length);
  report.projection.push({id:f.id,rawNodes:raw.nodes.length,nodes:f.nodes.length,rawEdges:raw.edges.length,edges:f.edges.length,hiddenInternalEdges:hidden.length,rawSequenceRows:rawRows,sequenceRows:rows});
 }
 for(const url of urls){
  if(url.startsWith('../docs/')){
   const [relative,anchor]=url.split('#'),source=await fs.readFile(path.resolve(root,relative),'utf8');
   if(anchor)assert.ok([...source.matchAll(/^#{1,6} (.+)$/gm)].map(m=>slug(m[1])).includes(decodeURIComponent(anchor)),url+' missing anchor');
  }else assert.match(url,/^https:\/\/github\.com\/.*\/blob\/[a-f0-9]{40}\//,'Immutable code source expected');
 }
 report.flows=flows.map(f=>({id:f.id,mode:f.mode,groups:f.groups.length,nodes:f.nodes.length,edges:f.edges.length,steps:f.steps.length}));
 report.uniqueSources=urls.size;report.checks.push('Ocho flujos: implementación auditada intacta; apps agregadas trazables; tablas, endpoints, SQL/Mongo, certeza y fronteras preservados.');return flows;
}
async function main(){
 await fs.mkdir(qa,{recursive:true});
 const report={date:new Date().toISOString(),assets:{},checks:[],errors:[],external:[],layoutProblems:[],responsiveViews:0,interactionChecks:0};
 const flows=await metadata(report),port=4182,base='http://127.0.0.1:'+port;
 const server=spawn(process.execPath,[path.join(root,'server.cjs')],{env:{...process.env,POS_ATLAS_PORT:String(port)},windowsHide:true,stdio:['ignore','pipe','pipe']});
 let browser;
 const record=(p,file=false)=>{p.on('pageerror',e=>report.errors.push(e.message));p.on('request',r=>{if(!(file?r.url().startsWith('file:'):r.url().startsWith(base))&&!r.url().startsWith('data:'))report.external.push(r.url());});};
 try{
  await new Promise((resolve,reject)=>{const t=setTimeout(()=>reject(Error('Server timeout')),8000);server.stdout.once('data',()=>{clearTimeout(t);resolve();});server.once('exit',c=>{clearTimeout(t);reject(Error('Server exit '+c));});});
  browser=await playwright().chromium.launch({headless:true});
  const page=await browser.newPage({viewport:{width:1440,height:1000},reducedMotion:'reduce'});record(page);
  async function open(p,f,file=false){
   await p.goto((file?pathToFileURL(path.join(root,'index.html')).href:base+'/')+'#'+(f.mode==='proposed'?'propuesta':'mapa?flujo='+f.id));
   if(f.mode==='proposed'&&!await p.locator('#interaction-library').evaluate(el=>el.open))await p.locator('#interaction-library > summary').click();
   if(f.mode!=='proposed')assert.equal(await p.locator('#map-panel-peticiones').isVisible(),true);
   await p.locator('#ix-flow').selectOption(f.id);await p.locator('[data-ix-mode="step"]').click();await p.locator('[data-ix-zoom="100"]').click();
   assert.equal(await p.locator('#ix-flow').inputValue(),f.id);assert.equal(norm(await p.locator('#ix-summary').textContent()),norm(f.summary));
  }
  async function sources(p,items){const urls=await p.locator('#ix-detail a').evaluateAll(a=>a.map(el=>el.getAttribute('href')));for(const s of items)assert.ok(urls.includes(s.url),'Missing visible/expandable source '+s.url);}
  async function detail(p,e){const t=norm(await p.locator('#ix-detail').innerText());for(const key of ['detail','effect','boundary'])assert.ok(t.includes(norm(e[key])),e.id+' '+key);await sources(p,e.sources);}
  async function implementation(p,item,node=false){
   const panel=p.locator('#ix-detail details.ix-implementation'),count=await panel.count();
   assert.ok(count<=1);if(!node||item.kind==='component')assert.equal(count,1,'Implementation must remain available by disclosure');
   if(count&&!await panel.evaluate(el=>el.open))await panel.locator(':scope > summary').click();
   const text=norm(await p.locator('#ix-detail').innerText());for(const record of node?item.implementationNodes:item.implementationEdges){assert.ok(text.includes(norm(record[node?'title':'label'])),record.id+' implementation not shown');assert.ok(text.includes(norm(record.detail)),record.id+' implementation explanation missing');await sources(p,record.sources);}
   for(const edge of node?(item.implementationEdges||[]):[]){assert.ok(text.includes(norm(edge.label)),edge.id+' hidden internal call not available in app inspector');await sources(p,edge.sources);}
   if(!node){const paragraphs=await p.locator('#ix-detail p,#ix-detail dd').allTextContents();for(const key of ['detail','effect','boundary'])assert.equal(paragraphs.map(norm).filter(t=>t===norm(item[key])).length,1,item.id+' repeated '+key+' after implementation disclosure');}
  }
  async function geometry(p,context){
   const errors=await p.evaluate(()=>{
    const out=[];if(document.documentElement.scrollWidth>innerWidth+1)out.push('document overflow');
    for(const el of document.querySelectorAll('.ix-node,.ix-group-head,.ix-seq-group,.ix-edge-label,.ix-seq-tables'))if(el.scrollHeight>el.clientHeight+3)out.push((el.dataset.ixNode||el.dataset.ixEdge||el.textContent.trim().slice(0,45))+' content '+el.scrollHeight+'/'+el.clientHeight);
    const sequence=document.querySelector('[data-ix-mode="sequence"]').getAttribute('aria-pressed')==='true',flow=window.POS_INTERACTIONS_VIEW.all().find(f=>f.id===document.querySelector('#ix-flow').value);
    for(const el of document.querySelectorAll('.ix-node strong,.ix-node-subtitle,.ix-group-head,.ix-seq-node strong,.ix-seq-group')){const names=el.textContent.match(/\b(?:[A-Za-z_$][\w$]*(?:Controller|Services?|Repository|Mediator)|Class[A-Z]\w*|(?:SEQ|TP|MS|MP)_[A-Za-z0-9_]+)\b/g);if(names)out.push('implementation identifier on canvas: '+names.join(', '));}
    const intersects=(a,b)=>Math.min(a.right,b.right)-Math.max(a.left,b.left)>1&&Math.min(a.bottom,b.bottom)-Math.max(a.top,b.top)>1;
    const participant=id=>{const node=flow.nodes.find(n=>n.id===id);return node.kind==='table'?'tables:'+node.group:node.id;};
    const headers=[...document.querySelectorAll('.ix-seq-group[data-ix-participant]')],lifelines=[...document.querySelectorAll('.ix-lifeline[data-ix-participant]')];
    if(sequence){
     const band=document.querySelector('.ix-seq-headers'),viewport=document.querySelector('.ix-viewport'),surface=document.querySelector('.ix-surface');
     let headerOffset=0;
     if(!band)out.push('sequence header band missing');
     else{
      const transform=new DOMMatrixReadOnly(getComputedStyle(band).transform),scale=new DOMMatrixReadOnly(getComputedStyle(surface).transform).a;
      headerOffset=transform.m42*scale;
      const bandHeight=band.getBoundingClientRect().height,pinned=bandHeight<=Math.min(viewport.clientHeight/2,viewport.clientHeight-100);
      if(pinned&&Math.abs(band.getBoundingClientRect().top-viewport.getBoundingClientRect().top-viewport.clientTop)>2)out.push('sequence headers must remain at viewport top when room permits');
      if(!pinned&&Math.abs(headerOffset)>1)out.push('oversized sequence headers must scroll normally');
      if(headerOffset+bandHeight>surface.getBoundingClientRect().height+1)out.push('sequence header translation extends beyond diagram');
     }
     // Sticky headers intentionally cover past rows. Check the original layout,
     // before the header-band translation, for unintended label/header overlap.
     const originalHeaderRect=header=>{const r=header.getBoundingClientRect();return {left:r.left,right:r.right,top:r.top-headerOffset,bottom:r.bottom-headerOffset};};
     if(document.querySelector('.ix-seq-node'))out.push('sequence repeats participant cards');
     const expected=new Set(flow.nodes.map(n=>participant(n.id)));
     if(headers.length!==expected.size||lifelines.length!==expected.size)out.push('sequence participant/header/lifeline count differs');
     for(const id of expected){if(headers.filter(h=>h.dataset.ixParticipant===id).length!==1)out.push(id+' must have one header');if(lifelines.filter(l=>l.dataset.ixParticipant===id).length!==1)out.push(id+' must have one lifeline');}
     for(let i=0;i<headers.length;i++)for(let j=i+1;j<headers.length;j++)if(intersects(headers[i].getBoundingClientRect(),headers[j].getBoundingClientRect()))out.push('sequence headers overlap');
     const labels=[...document.querySelectorAll('.ix-surface .ix-edge-label')];
     for(let i=0;i<labels.length;i++){
      const r=labels[i].getBoundingClientRect();
      for(const header of headers)if(intersects(r,originalHeaderRect(header)))out.push(labels[i].dataset.ixEdge+' sequence label overlaps header');
      for(let j=i+1;j<labels.length;j++)if(intersects(r,labels[j].getBoundingClientRect()))out.push(labels[i].dataset.ixEdge+' sequence labels overlap');
     }
    }
    [...document.querySelectorAll('.ix-wire-line')].forEach(el=>{
     const d=el.getAttribute('d'),b=el.getBBox(),s=el.ownerSVGElement;
     if(/NaN|undefined/.test(d)||b.x<-1||b.y<-1||b.x+b.width>Number(s.getAttribute('width'))+1||b.y+b.height>Number(s.getAttribute('height'))+1)out.push('invalid/outside path '+d);
     const wire=el.closest('[data-ix-wire]'),edge=flow.edges.find(e=>e.id===wire.dataset.ixWire);
     if(sequence){
      const fromId=participant(edge.from),toId=participant(edge.to),start=el.getPointAtLength(0),end=el.getPointAtLength(el.getTotalLength());
      for(const [id,pt,side] of [[fromId,start,'source'],[toId,end,'target']]){
       const line=lifelines.find(l=>l.dataset.ixParticipant===id);
       if(!line){out.push(edge.id+' missing '+side+' lifeline');continue;}
       const a=line.getPointAtLength(0),z=line.getPointAtLength(line.getTotalLength());
       if(Math.abs(pt.x-a.x)>1||pt.y<a.y-1||pt.y>z.y+1)out.push(edge.id+' '+side+' misses participant lifeline');
      }
      if(fromId===toId){if(end.y<=start.y+1||b.width<=1)out.push(edge.id+' self-call must return lower on its lifeline');}
      else if(Math.abs(start.y-end.y)>1||Math.abs(start.x-end.x)<=1)out.push(edge.id+' distinct participants must have a horizontal connector');
     }else{
      const target=document.querySelector('.ix-surface [data-ix-node="'+edge.to+'"]');
      if(target){const pt=el.getPointAtLength(el.getTotalLength()),ctm=el.getScreenCTM(),p=new DOMPoint(pt.x,pt.y).matrixTransform(ctm),r=target.getBoundingClientRect(),dx=Math.max(r.left-p.x,0,p.x-r.right),dy=Math.max(r.top-p.y,0,p.y-r.bottom);if(dx>15*Math.abs(ctm.a)+1||dy>2)out.push(edge.id+' arrow misses receiving component ('+dx.toFixed(1)+','+dy.toFixed(1)+')');}
     }
    });
    return out;
   });for(const e of errors)report.layoutProblems.push(context+': '+e);
  }
  async function sequenceCenter(p,context){
   await p.locator('[data-ix-center]').click();
   await p.waitForFunction(()=>{
    const band=document.querySelector('.ix-seq-headers'),viewport=document.querySelector('.ix-viewport');
    if(!band)return false;
    const pinned=band.getBoundingClientRect().height<=Math.min(viewport.clientHeight/2,viewport.clientHeight-100);
    return pinned?Math.abs(band.getBoundingClientRect().top-viewport.getBoundingClientRect().top-viewport.clientTop)<=2:Math.abs(new DOMMatrixReadOnly(getComputedStyle(band).transform).m42)<=1;
   });
   const result=await p.evaluate(()=>{
    const viewport=document.querySelector('.ix-viewport'),band=document.querySelector('.ix-seq-headers'),step=document.querySelector('[data-ix-step][aria-pressed="true"]').dataset.ixStep;
    const selected=document.querySelector('[data-ix-seq-step="'+step+'"] .ix-edge-label[aria-pressed="true"]');
    const maxScroll=viewport.scrollHeight-viewport.clientHeight;
    const bandRect=band.getBoundingClientRect(),viewTop=viewport.getBoundingClientRect().top+viewport.clientTop,pinned=bandRect.height<=Math.min(viewport.clientHeight/2,viewport.clientHeight-100);
    return {exists:Boolean(selected),clamped:maxScroll-viewport.scrollTop<=2,labelTop:selected?.getBoundingClientRect().top,contentTop:pinned?bandRect.bottom:viewTop};
   });
   assert.ok(result.exists,context+' selected sequence label missing');
   if(!result.clamped)assert.ok(result.labelTop>=result.contentTop-2,context+' centering must place selected call in the readable area');
  }
  for(const f of flows){
   await open(page,f);assert.equal(await page.locator('[data-ix-step]').count(),f.steps.length);
   for(let i=0;i<f.steps.length;i++){
    const s=f.steps[i];await page.locator('[data-ix-step="'+i+'"]').click();
    assert.equal(norm(await page.locator('#ix-step-title').innerText()),norm(s.title));assert.equal(norm(await page.locator('#ix-step-text').innerText()),norm(s.detail));
    assert.equal(await page.locator('#ix-call option').count(),s.edges.length);
    for(const id of s.edges){
     const e=f.edges.find(e=>e.id===id);await page.locator('#ix-call').selectOption(id);await detail(page,e);
     assert.equal(await page.locator('[data-ix-step="'+i+'"]').getAttribute('aria-pressed'),'true','Selecting reused edge must retain step');
     for(const n of new Set([e.from,e.to]))assert.equal(await page.locator('.ix-surface [data-ix-node="'+n+'"]').count(),1);
     const b=page.locator('.ix-surface button[data-ix-edge="'+id+'"]');assert.equal(await b.count(),1);await b.focus();await page.keyboard.press('Enter');await detail(page,e);
     assert.equal(await page.locator('[data-ix-step="'+i+'"]').getAttribute('aria-pressed'),'true','Activating reused edge must retain step');
     await implementation(page,e);report.interactionChecks++;await geometry(page,f.id+'/'+i+'/'+id);
    }
    const e=f.edges.find(e=>e.id===s.edges[0]),n=f.nodes.find(n=>n.id===e.from);await page.locator('#ix-call').selectOption(e.id);
    const b=page.locator('.ix-surface [data-ix-node="'+n.id+'"]');await b.focus();await page.keyboard.press('Enter');
    assert.equal(await page.locator('#ix-detail h3').innerText(),n.title);assert.ok(norm(await page.locator('#ix-detail').innerText()).includes(norm(n.detail)));await sources(page,n.sources);await implementation(page,n,true);
    assert.ok(await b.evaluate(el=>getComputedStyle(el).outlineStyle!=='none'&&parseFloat(getComputedStyle(el).outlineWidth)>0),'Node focus must be visible');
    await page.locator('[data-ix-return]').click();
   }
   await page.locator('[data-ix-mode="all"]').click();assert.equal(await page.locator('.ix-surface [data-ix-node]').count(),f.nodes.length);await geometry(page,f.id+'/all');
   for(const n of f.nodes){const button=page.locator('.ix-surface [data-ix-node="'+n.id+'"]');await button.focus();await page.keyboard.press('Enter');assert.equal(await page.locator('#ix-detail h3').innerText(),n.title);await implementation(page,n,true);await sources(page,n.sources);}
   await page.locator('[data-ix-mode="sequence"]').click();assert.equal(await page.locator('.ix-surface .ix-edge-label').count(),f.steps.reduce((n,s)=>n+s.edges.length,0));await sequenceCenter(page,f.id+'/sequence');await geometry(page,f.id+'/sequence');
   const header=page.locator('.ix-seq-group[data-ix-node]').first(),headerId=await header.getAttribute('data-ix-node'),headerNode=f.nodes.find(n=>n.id===headerId);
   const beforeHeaderFocus=await page.locator('.ix-viewport').evaluate(el=>({top:el.scrollTop,pinned:document.querySelector('.ix-seq-headers').getBoundingClientRect().height<=Math.min(el.clientHeight/2,el.clientHeight-100)}));
   await header.focus();
   if(beforeHeaderFocus.pinned)assert.ok(Math.abs(await page.locator('.ix-viewport').evaluate(el=>el.scrollTop)-beforeHeaderFocus.top)<=1,f.id+' focusing pinned header must preserve vertical position');
   await page.keyboard.press('Enter');assert.equal(await page.locator('#ix-detail h3').innerText(),headerNode.title);await sources(page,headerNode.sources);
   assert.ok(await header.evaluate(el=>getComputedStyle(el).outlineStyle!=='none'&&parseFloat(getComputedStyle(el).outlineWidth)>0),'Sequence header focus must be visible');
   await page.locator('[data-ix-return]').click();
   const tableEdge=f.edges.find(e=>[e.from,e.to].some(id=>f.nodes.find(n=>n.id===id).kind==='table'));
   if(tableEdge){
    const stepIndex=f.steps.findIndex(s=>s.edges.includes(tableEdge.id));await page.locator('[data-ix-step="'+stepIndex+'"]').click();
    const edgeButton=page.locator('.ix-surface button[data-ix-edge="'+tableEdge.id+'"]').first();await edgeButton.focus();await page.keyboard.press('Enter');await detail(page,tableEdge);
    const tableNode=f.nodes.find(n=>n.kind==='table'&&[tableEdge.from,tableEdge.to].includes(n.id));
    await page.locator('#ix-detail [data-ix-node="'+tableNode.id+'"]').focus();await page.keyboard.press('Enter');assert.equal(await page.locator('#ix-detail h3').innerText(),tableNode.title);await sources(page,tableNode.sources);
    await page.locator('[data-ix-return]').click();await detail(page,tableEdge);
   }
   if(!await page.locator('.ix-relations').evaluate(el=>el.open))await page.locator('.ix-relations > summary').click();const e=f.edges.at(-1);await page.locator('[data-ix-relation="'+e.id+'"]').click();await detail(page,e);
   const flowHash=new URL(page.url()).hash;
   await page.locator('.ix-viewport').focus();await page.keyboard.press('ArrowRight');await page.keyboard.press('ArrowLeft');assert.equal(new URL(page.url()).hash,flowHash);
  }
  report.checks.push('Todos los pasos/conexiones: ficha y fuentes, selección de nodos por teclado, relaciones reutilizadas, tres modos y flechas sin cambiar capítulo.');
  report.checks.push('Secuencia: una cabecera fija y línea de vida por participante, centrado debajo de las cabeceras, tablas agrupadas por base, conectores sobre origen/destino, bucles solo para autollamadas y acceso por teclado a cabeceras y tablas desde la ficha de conexión.');
  await open(page,flows.find(f=>f.id==='proposed-sale'));
  await page.locator('[data-ix-expand]').focus();await page.keyboard.press('Enter');assert.equal(await page.locator('dialog.ix-expanded').evaluate(el=>el.open),true);
  await page.keyboard.press('Escape');await page.locator('dialog.ix-expanded').waitFor({state:'detached'});assert.equal(await page.locator('dialog.ix-expanded').count(),0);assert.equal(await page.evaluate(()=>document.activeElement.hasAttribute('data-ix-expand')),true);
  await page.locator('[data-ix-zoom="fit"]').click();assert.equal(await page.locator('[data-ix-zoom="fit"]').getAttribute('aria-pressed'),'true');
  await page.locator('[data-ix-zoom="100"]').click();assert.equal(await page.locator('[data-ix-zoom="100"]').getAttribute('aria-pressed'),'true');
  const scale=await page.locator('#ix-scale').innerText();await page.locator('[data-ix-zoom="in"]').click();assert.notEqual(await page.locator('#ix-scale').innerText(),scale);await page.locator('[data-ix-zoom="out"]').click();
  report.checks.push('Ampliación modal, Escape/restauración de foco y zoom Ajustar/100 %/±.');
  const pointerFlow=flows.find(f=>f.id==='proposed-sale'),pointerEdge=pointerFlow.edges.find(e=>e.id===pointerFlow.steps[0].edges[0]);
  await page.locator('.ix-surface [data-ix-node="'+pointerEdge.from+'"]').click();await page.locator('.ix-board').scrollIntoViewIfNeeded();
  const linePoint=await page.locator('.ix-wire-hit').evaluate(el=>{const p=el.getPointAtLength(el.getTotalLength()*.14),q=new DOMPoint(p.x,p.y).matrixTransform(el.getScreenCTM());return{x:q.x,y:q.y,hit:document.elementFromPoint(q.x,q.y)?.classList.contains('ix-wire-hit')};});
  assert.ok(linePoint.hit,'Pointer test must hit the SVG stroke, not its label');await page.mouse.click(linePoint.x,linePoint.y);assert.equal(await page.locator('#ix-detail h3').innerText(),pointerEdge.label);
  report.checks.push('El trazo SVG selecciona la conexión y no inicia arrastre; la etiqueta sigue siendo accesible por teclado.');
  for(const [width,height] of sizes){
   await page.setViewportSize({width,height});
   for(const f of flows){
    await open(page,f);
    for(const mode of modes){
     await page.locator('[data-ix-mode="'+mode+'"]').click();if(mode==='sequence')await sequenceCenter(page,f.id+'/'+mode+'/'+width+'x'+height);await geometry(page,f.id+'/'+mode+'/'+width+'x'+height);report.responsiveViews++;assert.ok((await page.locator('.ix-viewport').boundingBox()).width<=width);
     if([1440,390].includes(width)&&mode==='step'){
      await page.locator('[data-ix-zoom="fit"]').click();await page.locator('.ix-board').screenshot({path:path.join(qa,'interactions-'+f.id+'-default-'+width+'.png')});
      await page.locator('[data-ix-zoom="100"]').click();await page.locator('.ix-board').screenshot({path:path.join(qa,'interactions-'+f.id+'-100-'+width+'.png')});
     }
     if([1440,390].includes(width)&&mode==='sequence'&&f.id==='proposed-erp')await page.locator('.ix-board').screenshot({path:path.join(qa,'interactions-sequence-'+width+'.png')});
     if([1440,390].includes(width)&&mode==='sequence'&&['sale','sync'].includes(f.id)){
      await page.locator('[data-ix-zoom="fit"]').click();await page.locator('.ix-board').screenshot({path:path.join(qa,'interactions-sequence-'+f.id+'-'+width+'.png')});
      if(f.id==='sync'){
       const selfEdge=f.edges.find(e=>e.from===e.to),stepIndex=f.steps.findIndex(s=>s.edges.includes(selfEdge.id));await page.locator('[data-ix-step="'+stepIndex+'"]').click();await page.locator('#ix-call').selectOption(selfEdge.id);await page.locator('[data-ix-zoom="100"]').click();await sequenceCenter(page,f.id+'/sequence-self/'+width);await geometry(page,f.id+'/sequence-self/'+width);
       await page.locator('.ix-board').screenshot({path:path.join(qa,'interactions-sequence-self-'+width+'.png')});
      }
     }
    }
   }
  }
  report.checks.push(report.responsiveViews+' vistas responsive: ocho flujos, tres modos, seis tamaños; medidas de texto y geometría SVG.');
  await page.setViewportSize({width:844,height:390});
  const shortFlow=flows.find(f=>f.id==='sync');await open(page,shortFlow);await page.locator('[data-ix-mode="sequence"]').click();await page.locator('[data-ix-zoom="100"]').click();
  for(let i=0;i<5;i++)await page.locator('[data-ix-zoom="in"]').click();
  assert.equal(norm(await page.locator('#ix-scale').innerText()),'175 %');
  const shortViewport=await page.locator('.ix-viewport').evaluate(el=>({height:el.clientHeight,scrollHeight:el.scrollHeight,bandHeight:document.querySelector('.ix-seq-headers').getBoundingClientRect().height}));
  assert.ok(shortViewport.bandHeight>Math.min(shortViewport.height/2,shortViewport.height-100),'Short viewport must exercise non-pinned headers');
  for(let i=0;i<5;i++){
   const height=await page.locator('.ix-viewport').evaluate(async el=>{el.scrollTop=el.scrollHeight;await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));return el.scrollHeight;});
   assert.equal(height,shortViewport.scrollHeight,'Repeated scrolling must not increase diagram scroll height');
  }
  const shortEdge=shortFlow.edges.find(e=>e.from===e.to),shortStep=shortFlow.steps.findIndex(s=>s.edges.includes(shortEdge.id));
  await page.locator('[data-ix-step="'+shortStep+'"]').click();await page.locator('#ix-call').selectOption(shortEdge.id);await sequenceCenter(page,'short-viewport-175');await geometry(page,'short-viewport-175');
  const centeredShort=await page.evaluate(()=>{
   const viewport=document.querySelector('.ix-viewport'),step=document.querySelector('[data-ix-step][aria-pressed="true"]').dataset.ixStep,label=document.querySelector('[data-ix-seq-step="'+step+'"] .ix-edge-label[aria-pressed="true"]').getBoundingClientRect(),top=viewport.getBoundingClientRect().top+viewport.clientTop;
   return {fits:label.height<=viewport.clientHeight-24,top:label.top,bottom:label.bottom,viewTop:top,viewBottom:top+viewport.clientHeight};
  });
  if(centeredShort.fits)assert.ok(centeredShort.top>=centeredShort.viewTop-2&&centeredShort.bottom<=centeredShort.viewBottom+2,'A fitting selected label must be visible in short viewport at 175%');
  await page.locator('.ix-board').screenshot({path:path.join(qa,'interactions-sequence-short-175.png')});
  report.checks.push('Cabeceras con espacio suficiente conservan posición al enfocarlas. En 844×390 al 175 %, las cabeceras grandes dejan espacio a las flechas, el scroll no crece y centrar muestra la etiqueta seleccionada cuando cabe.');
  const navigation=await browser.newPage({viewport:{width:1440,height:1000},reducedMotion:'reduce'});record(navigation);
  async function assertMapTab(p,id,focused=false){
   const tab=p.locator('[data-map-view="'+id+'"]');
   assert.equal(await p.locator('[data-map-view][role="tab"]').count(),4);
   assert.equal(await p.locator('[data-map-view][aria-selected="true"]').count(),1);
   assert.equal(await p.locator('[data-map-view][tabindex="0"]').count(),1);
   assert.equal(await tab.getAttribute('aria-selected'),'true');assert.equal(await tab.getAttribute('tabindex'),'0');
   assert.equal(await tab.getAttribute('aria-controls'),'map-panel-'+id);
   assert.equal(await p.locator('#map-panel-'+id).getAttribute('role'),'tabpanel');
   assert.equal(await p.locator('#map-panel-'+id).getAttribute('aria-labelledby'),await tab.getAttribute('id'));
   assert.equal(await p.locator('#map-panel-'+id).isVisible(),true);
   assert.equal(await p.locator('[role="tabpanel"]:visible').count(),1);
   if(focused)assert.equal(await p.evaluate(()=>document.activeElement.dataset.mapView),id);
  }
  for(const width of [1440,390]){
   await navigation.setViewportSize({width,height:width===1440?1000:844});
   await navigation.goto(base+'/#mapa');await assertMapTab(navigation,'general');
   assert.equal(await navigation.locator('#interaction-viewer').isVisible(),false);
   assert.equal(await navigation.locator('#map-panel-general .ix-context').count(),0);
   await navigation.locator('[data-map-view="general"]').focus();
   for(const [key,id] of [['ArrowRight','repositorios'],['ArrowRight','peticiones'],['End','evidencia'],['ArrowRight','general'],['ArrowLeft','evidencia'],['Home','general']]){
    await navigation.keyboard.press(key);await assertMapTab(navigation,id,true);
   }
   await navigation.locator('[data-map-view="peticiones"]').click();await assertMapTab(navigation,'peticiones');
   assert.equal(await navigation.locator('#interaction-viewer').isVisible(),true);
   await navigation.locator('#ix-flow').selectOption('sale');await navigation.locator('[data-ix-step="1"]').click();
   const savedCall=(await navigation.locator('#ix-call option').all()).at(-1);await navigation.locator('#ix-call').selectOption(await savedCall.getAttribute('value'));
   const selectedCall=await navigation.locator('#ix-call').inputValue(),selectedStep=await navigation.locator('[data-ix-step][aria-pressed="true"]').getAttribute('data-ix-step');
   await navigation.locator('[data-map-view="repositorios"]').click();await assertMapTab(navigation,'repositorios');
   await navigation.locator('#repo-connection').selectOption('repo-admin');await navigation.locator('#repo-all').uncheck();
   assert.equal(new URLSearchParams(new URL(navigation.url()).hash.split('?')[1]).get('vista'),'repositorios');
   await navigation.locator('[data-map-view="general"]').click();await assertMapTab(navigation,'general');
   await navigation.locator('[data-map-view="repositorios"]').click();assert.equal(await navigation.locator('#repo-connection').inputValue(),'repo-admin');assert.equal(await navigation.locator('#repo-all').isChecked(),false);
   await navigation.locator('[data-map-view="peticiones"]').click();await assertMapTab(navigation,'peticiones');
   assert.equal(await navigation.locator('#ix-flow').inputValue(),'sale');assert.equal(await navigation.locator('#ix-call').inputValue(),selectedCall);assert.equal(await navigation.locator('[data-ix-step][aria-pressed="true"]').getAttribute('data-ix-step'),selectedStep);
   assert.equal(await navigation.locator('.ix-overview').evaluate(el=>el.open),false);await navigation.locator('.ix-overview > summary').focus();await navigation.keyboard.press('Enter');
   assert.ok((await navigation.locator('#ix-summary').innerText()).length>30);assert.ok((await navigation.locator('#ix-flow-boundary').innerText()).length>30);
   await geometry(navigation,'tabs-persist/'+width);
   for(const id of ['general','repositorios','peticiones','evidencia']){await navigation.goto(base+'/#mapa?vista='+id);await assertMapTab(navigation,id);}
   await navigation.goto(base+'/#propuesta');assert.equal(await navigation.locator('#interaction-library').evaluate(el=>el.open),false,'Proposed library starts closed');
   const summary=navigation.locator('#interaction-library > summary');await summary.focus();await navigation.keyboard.press('Enter');await navigation.locator('#ix-flow').waitFor();
   assert.equal(await navigation.locator('#interaction-library').evaluate(el=>el.open),true);await geometry(navigation,'library-open/propuesta/'+width);
   await summary.focus();await navigation.keyboard.press('Enter');assert.equal(await navigation.locator('#interaction-library').evaluate(el=>el.open),false);
   for(const f of flows){await navigation.goto(base+'/#'+(f.mode==='proposed'?'propuesta':'mapa')+'?flujo='+f.id);await navigation.waitForFunction(id=>document.querySelector('#ix-flow')?.value===id,f.id);if(f.mode==='proposed')assert.equal(await navigation.locator('#interaction-library').evaluate(el=>el.open),true);else await assertMapTab(navigation,'peticiones');await geometry(navigation,'deep-link/'+f.id+'/'+width);}
   await navigation.goto(base+'/#venta');await navigation.locator('a[href="#mapa?flujo=sync"]').click();await navigation.waitForFunction(()=>document.querySelector('#ix-flow')?.value==='sync');
   await navigation.goBack();await navigation.locator('.chapter-venta').waitFor();await navigation.goForward();await navigation.waitForFunction(()=>document.querySelector('#ix-flow')?.value==='sync');await assertMapTab(navigation,'peticiones');
   const fresh=await browser.newPage({viewport:{width,height:844},reducedMotion:'reduce'});record(fresh);await fresh.goto(base+'/#datos');assert.equal(await fresh.locator('#dataflow-select').inputValue(),'D03','Fresh data chapter begins with masters');await fresh.close();
   await navigation.goto(base+'/#datos?flujo=D01');assert.equal(await navigation.locator('#dataflow-select').inputValue(),'D01');await navigation.locator('a[href="#mapa?flujo=sale"]').click();await navigation.waitForFunction(()=>document.querySelector('#ix-flow')?.value==='sale');
  }
  await navigation.goto(base+'/#mapa');await navigation.setViewportSize({width:390,height:844});await navigation.locator('[data-map-view="peticiones"]').click();await geometry(navigation,'resize-hidden-then-open');
  await navigation.goto(base+'/#propuesta?flujo=sale');assert.equal(await navigation.locator('#interaction-library').evaluate(el=>el.open),false,'Wrong-chapter flow must not open unrelated journey');
  report.checks.push('Ecosistema con cuatro pestañas independientes: selección ARIA, teclado con flechas/Home/End y una vista visible. Conexión/repositorios y flujo/paso/petición persisten al cambiar; URLs de pestañas y ocho enlaces directos, historial atrás/adelante, biblioteca de Propuesta y Datos inicial D03 en desktop/móvil.');
  const library=await browser.newPage({viewport:{width:1440,height:1000},reducedMotion:'no-preference'});record(library);await library.clock.install();
  const tf=flows.find(f=>f.id==='proposed-sale');await open(library,tf);await library.locator('[data-ix-step="'+(tf.steps.length-1)+'"]').click();await library.locator('#ix-call').selectOption(tf.steps.at(-1).edges.at(-1));
  const foldedStep=await library.locator('#ix-counter').textContent(),foldedCall=await library.locator('#ix-call').inputValue();
  await library.locator('#interaction-library > summary').click();assert.equal(await library.locator('#interaction-library').evaluate(el=>el.open),false);await library.clock.runFor(13000);
  await library.locator('#interaction-library > summary').click();assert.equal(await library.locator('#ix-counter').textContent(),foldedStep);assert.equal(await library.locator('#ix-call').inputValue(),foldedCall);
  await library.evaluate(()=>{location.hash='venta';});await library.locator('#interaction-viewer').waitFor({state:'detached'});await library.evaluate(()=>{location.hash='propuesta';});await library.locator('#ix-flow').waitFor({state:'attached'});assert.equal(await library.locator('#interaction-library').evaluate(el=>el.open),false);await library.locator('#interaction-library > summary').click();assert.equal(await library.locator('[data-ix-step="0"]').getAttribute('aria-pressed'),'true');
  report.checks.push('La biblioteca conserva el paso y la conexión al plegarse y abrirse; cambiar de capítulo desmonta el visor y la biblioteca vuelve cerrada.');
  const tabManual=await browser.newPage({viewport:{width:1440,height:1000},reducedMotion:'no-preference'});record(tabManual);await tabManual.clock.install();
  const saleFlow=flows.find(f=>f.id==='sale');await open(tabManual,saleFlow);await tabManual.locator('[data-ix-step="1"]').click();await tabManual.locator('#ix-call').selectOption(saleFlow.steps[1].edges.at(-1));
  const tabCounter=await tabManual.locator('#ix-counter').textContent(),tabCall=await tabManual.locator('#ix-call').inputValue();
  await tabManual.locator('[data-map-view="general"]').click();await tabManual.clock.runFor(13000);assert.equal(await tabManual.locator('#ix-counter').textContent(),tabCounter);assert.equal(await tabManual.locator('#ix-call').inputValue(),tabCall);
  await tabManual.locator('[data-map-view="peticiones"]').click();assert.equal(await tabManual.locator('#ix-counter').textContent(),tabCounter);assert.equal(await tabManual.locator('#ix-call').inputValue(),tabCall);
  report.checks.push('Ocultar Peticiones y volver conserva el paso y la conexión seleccionados, sin avance automático.');
  const expandedHistory=await browser.newPage({viewport:{width:1440,height:1000},reducedMotion:'no-preference'});record(expandedHistory);await expandedHistory.clock.install();
  await expandedHistory.goto(base+'/#mapa');await expandedHistory.locator('[data-map-view="peticiones"]').click();
  await expandedHistory.locator('[data-ix-step="1"]').click();await expandedHistory.locator('#ix-call').selectOption(saleFlow.steps[1].edges.at(-1));
  const historyCounter=await expandedHistory.locator('#ix-counter').textContent(),historyCall=await expandedHistory.locator('#ix-call').inputValue();
  await expandedHistory.locator('[data-ix-expand]').click();assert.equal(await expandedHistory.locator('dialog.ix-expanded').evaluate(el=>el.open),true);
  await expandedHistory.goBack();await expandedHistory.locator('#map-panel-general').waitFor({state:'visible'});await expandedHistory.locator('dialog.ix-expanded').waitFor({state:'detached'});
  await assertMapTab(expandedHistory,'general',true);
  assert.equal(await expandedHistory.locator('dialog.ix-expanded').count(),0);
  assert.equal(await expandedHistory.locator('#map-panel-peticiones #interaction-viewer').count(),1,'Expanded viewer must return to its original panel');
  assert.equal(await expandedHistory.evaluate(()=>document.activeElement.id),'map-tab-general');
  await expandedHistory.clock.runFor(13000);assert.equal(await expandedHistory.locator('#ix-counter').textContent(),historyCounter);assert.equal(await expandedHistory.locator('#ix-call').inputValue(),historyCall);
  report.checks.push('Atrás del navegador desde Peticiones ampliado cierra el diálogo, devuelve el visor a su panel y enfoca Vista general, conservando el paso y la conexión.');
  const off=await browser.newPage({viewport:{width:390,height:844},offline:true,reducedMotion:'reduce'});record(off,true);
  for(const f of flows){await open(off,f,true);for(const mode of modes){await off.locator('[data-ix-mode="'+mode+'"]').click();assert.ok(await off.locator('.ix-surface [data-ix-node]').count());}if(!await off.locator('.ix-relations').evaluate(el=>el.open))await off.locator('.ix-relations > summary').click();const e=f.edges.at(-1);await off.locator('[data-ix-relation="'+e.id+'"]').click();await detail(off,e);}
  await off.goto(pathToFileURL(path.join(root,'index.html')).href+'#propuesta?flujo=proposed-erp');assert.equal(await off.locator('#ix-flow').inputValue(),'proposed-erp');assert.equal(await off.locator('#interaction-library').evaluate(el=>el.open),true);
  const nojs=await browser.newPage({javaScriptEnabled:false,offline:true});record(nojs,true);await nojs.goto(pathToFileURL(path.join(root,'index.html')).href);assert.ok((await nojs.locator('noscript').innerText()).length>20);
  report.checks.push('Ocho flujos y tres modos por file:// sin red; fallback sin JavaScript. Cero solicitudes corporativas.');
  assert.deepEqual(report.errors,[]);assert.deepEqual(report.external,[]);report.layoutProblems=[...new Set(report.layoutProblems)];assert.deepEqual(report.layoutProblems,[]);
  report.status='PASS';console.log(report.checks.join('\n'));console.log('PASS: '+report.checks.length+' grupos.');
 }catch(error){report.status='FAIL';report.failure=error.stack;throw error;}
 finally{report.layoutProblems=[...new Set(report.layoutProblems)];await fs.writeFile(path.join(qa,'interactions-report.json'),JSON.stringify(report,null,2)+'\n');if(browser)await browser.close();server.kill();}
}
main().catch(error=>{console.error(error);process.exitCode=1;});
