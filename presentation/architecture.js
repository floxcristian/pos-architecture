/* Deterministic, browser-only explanations. No queue, database or external service is called. */
'use strict';
(() => {
  const deck = window.POS_ARCH_DECK;
  const labs = window.POS_ARCH_LABS;
  const slideRoot = document.getElementById('slide');
  const main = document.getElementById('deck-main');
  const announcement = document.getElementById('announcement');
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const labStates = new Map();
  let index = 0;
  let timer = null;
  let playing = false;
  let wan = true;
  let lan = true;
  let financialCase = 'erp';
  let diagramScale = 1;
  let diagramFit = 1;
  let drag = null;
  const escape = value => String(value ?? '').replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
  const statusLabels = {ready:'Preparado',running:'En curso',waiting:'En espera',success:'Paso completado',warning:'Atención',error:'Detenido'};
  const current = () => deck.slides[index];
  const sources = values => `<div class="source-links">${values.map(source => `<a class="text-link" href="${escape(source.url)}" ${source.url.startsWith('https:') ? 'target="_blank" rel="noopener noreferrer"' : ''}>${escape(source.label)}</a>`).join('')}</div>`;
  const points = (items, numbered = false) => `<div class="point-list">${items.map(([title,detail],i) => `<section class="point">${numbered ? `<span class="point-number" aria-hidden="true">${String(i+1).padStart(2,'0')}</span>` : ''}<div><h3>${escape(title)}</h3><p>${escape(detail)}</p></div></section>`).join('')}</div>`;
  const note = text => text ? `<p class="takeaway">${escape(text)}</p>` : '';
  function codeCard(code, highlighted = [], copyKey = '') {
    return `<section class="code-card" aria-label="${escape(code.label)}"><div class="code-header"><span>${escape(code.label)}</span><span class="code-language">${escape(code.language)}</span>${copyKey ? `<button type="button" data-copy="${escape(copyKey)}" aria-label="Copiar ejemplo de ${escape(code.label)}">Copiar</button>` : ''}</div><pre class="code-lines" tabindex="0" aria-label="Ejemplo de código, ${escape(code.language)}"><code>${code.source.split('\n').map((line,i) => `<span class="code-line${highlighted.includes(i+1) ? ' is-highlight' : ''}"><span class="line-number" aria-hidden="true">${i+1}</span><span>${escape(line) || ' '}</span></span>`).join('')}</code></pre><details class="code-contract"><summary>Alcance y contratos del ejemplo</summary><p class="code-note">${escape(code.note)}</p></details></section>`;
  }
  function diagramCard(id) {
    const diagram = deck.diagrams[id];
    return `<figure class="diagram-card"><button type="button" class="diagram-preview" data-diagram="${id}" aria-label="Abrir póster completo de ${escape(diagram.title)}"><img src="architecture-diagrams/${diagram.file}.svg" alt="${escape(diagram.alt)}" loading="eager"><span>Vista previa del mapa · abrir póster completo ↗</span></button><figcaption class="diagram-caption"><strong>${escape(diagram.title)}</strong><span>Tipos y relaciones rotulados · leyenda y detalle en el póster editable</span></figcaption></figure>`;
  }
  function hero(slide) {
    return `<div class="hero"><div class="hero-copy"><p class="eyebrow">Propuesta de arquitectura · Chile, Perú y España</p><h1>${escape(slide.title).replace('\n','<br>')}</h1><p class="slide-lead">${escape(slide.lead)}</p><div class="hero-actions"><button type="button" class="primary" data-action="next">Comenzar el recorrido →</button><button type="button" data-action="overview">Explorar el índice</button></div><p class="hero-disclaimer">Modelo de referencia y simulaciones didácticas. Sin conexión a sistemas reales.</p></div><div class="hero-map" aria-label="Composición del producto corporativo"><p class="eyebrow">Qué se reutiliza y qué cambia</p><div class="hero-node hero-node-featured"><span class="node-index">01</span><div><strong>Núcleo compartido</strong><span>Ventas, caja, devoluciones, maestros y precios</span></div></div><div class="hero-link">Módulos y contratos comunes ↓</div><div class="hero-node"><span class="node-index">02</span><div><strong>Perfiles versionados</strong><span>País · entidad legal · sucursal · caja</span></div></div><div class="hero-link">Capacidades aprobadas y compatibles ↓</div><div class="hero-node"><span class="node-index">03</span><div><strong>Extensiones por contrato</strong><span>Fiscalidad, pagos, ERP y periféricos homologados</span></div></div><p class="map-footnote">Continuidad offline, seguridad e integridad forman parte de las capacidades del producto.</p></div></div><div class="hero-metrics"><span><strong>07</strong> diagramas C4 y dinámicas</span><span><strong>05</strong> laboratorios interactivos</span><span><strong>19</strong> escenas para recorrer</span></div>`;
  }
  function continuity() {
    const working = lan;
    const result = !lan ? {status:'error',title:'Se detienen los nuevos comandos',detail:'El puesto no alcanza al backend de sucursal. No abre otra base de ventas ni confirma operaciones por su cuenta.'} : !wan ? {status:'warning',title:'Operación local condicionada',detail:'Las operaciones autorizadas pueden confirmarse localmente. La outbox conserva pendientes. Pago y fiscalidad dependen de sus capacidades validadas.'} : {status:'success',title:'Operación y entrega disponibles',detail:'El backend confirma localmente y el sincronizador entrega a país. Un ACK de país no equivale a aceptación del ERP.'};
    return `<section class="continuity-controls" aria-label="Disponibilidad de red"><button type="button" data-action="toggle-wan" aria-pressed="${wan}">WAN ${wan ? 'conectada' : 'desconectada'}</button><button type="button" data-action="toggle-lan" aria-pressed="${lan}">LAN ${lan ? 'conectada' : 'desconectada'}</button><span>Cambia cada enlace y observa el resultado.</span></section><div class="continuity-map"><div class="continuity-node"><span class="eyebrow">Puesto</span><h3>Interfaz de caja</h3><p>Envía comandos autorizados.</p></div><div class="network-link ${lan ? '' : 'is-offline'}"><strong>${lan ? '→ LAN →' : '× LAN caída ×'}</strong><span>${lan ? 'Servidor accesible' : 'Sin escritor alternativo'}</span></div><div class="continuity-node ${working ? '' : 'is-offline'}"><span class="eyebrow">Sucursal</span><h3>Backend + PostgreSQL</h3><p>${working ? 'Confirma venta y outbox.' : 'Inaccesible desde el puesto.'}</p></div><div class="network-link ${wan ? '' : 'is-offline'}"><strong>${wan ? '→ WAN →' : '× WAN caída ×'}</strong><span>${wan ? 'Entrega con identidad' : 'Pendiente durable'}</span></div><div class="continuity-node ${wan ? '' : 'is-offline'}"><span class="eyebrow">País</span><h3>Integración</h3><p>Aplica, acusa y concilia.</p></div></div><section class="continuity-result" data-status="${result.status}" role="status"><span class="status-tag" data-status="${result.status}">${result.status==='success'?'Disponible':statusLabels[result.status]}</span><h2>${result.title}</h2><p>${result.detail}</p></section>`;
  }
  const financialCases = {
    erp:{label:'ERP no disponible',values:[['Venta','Confirmada','success'],['Pago','Aceptado por proveedor','success'],['Fiscalidad','Según resultado del proveedor','ready'],['ERP','Pendiente de integración','waiting']],message:'Reintentar la integración con su identidad. No volver a confirmar la venta ni repetir el cobro.'},
    payment:{label:'Respuesta de pago perdida',values:[['Venta','Sin nueva confirmación','waiting'],['Pago','Resultado incierto','warning'],['Fiscalidad','No inferir emisión','ready'],['ERP','Sin nuevo envío de venta','ready']],message:'Conservar paymentAttemptId y evidencia. Consultar o conciliar según el proveedor antes de permitir otro intento.'},
    fiscal:{label:'Documento fiscal pendiente',values:[['Venta','Confirmada localmente','success'],['Pago','Aceptado por proveedor','success'],['Fiscalidad','Pendiente / requiere consulta','warning'],['ERP','Estado propio de integración','ready']],message:'Resolver la emisión con la referencia original. El tratamiento operativo exige una modalidad fiscal previamente validada.'},
  };
  function financialStates() {
    const value = financialCases[financialCase];
    return `<label class="field-label" for="financial-case">Situación de ejemplo</label><select id="financial-case">${Object.entries(financialCases).map(([id,item]) => `<option value="${id}" ${id===financialCase ? 'selected' : ''}>${item.label}</option>`).join('')}</select><div class="state-cards">${value.values.map(([name,status,tone]) => `<section class="state-card"><h2>${name}</h2><span class="status-tag" data-status="${tone}">${status}</span></section>`).join('')}</div><p class="takeaway" role="status">${value.message}</p>`;
  }
  function getLabState(id) {
    if (!labStates.has(id)) labStates.set(id,{scenario:0,step:0});
    return labStates.get(id);
  }
  function labMarkup(id) {
    const lab = labs[id];
    const state = getLabState(id);
    const scenario = lab.scenarios[state.scenario];
    const step = scenario.steps[state.step];
    return `<section class="lab" aria-label="${escape(lab.title)}"><div class="lab-toolbar"><div><label for="lab-scenario">Caso de uso</label><select id="lab-scenario" data-lab="${id}">${lab.scenarios.map((item,i)=>`<option value="${i}" ${i===state.scenario?'selected':''}>${escape(item.label)}</option>`).join('')}</select></div><p>${escape(scenario.summary)}</p><span class="badge">Simulación local</span></div><div class="lab-layout"><div class="lab-workspace"><div class="step-track" role="group" aria-label="Elegir paso">${scenario.steps.map((item,i)=>`<button type="button" class="step-dot ${i===state.step?'is-current':i<state.step?'is-complete':''}" data-step="${i}" aria-label="Paso ${i+1}: ${escape(item.title)}" ${i===state.step?'aria-current="step"':''}>${i+1}</button>`).join('')}</div><div class="lab-controls"><button type="button" data-action="lab-reset">Reiniciar</button><button type="button" data-action="lab-back" ${state.step===0?'disabled':''}>Paso anterior</button><button type="button" data-action="lab-play" class="primary" aria-pressed="${playing}">${playing?'Pausar':'Reproducir'}</button><button type="button" data-action="lab-next" ${state.step===scenario.steps.length-1?'disabled':''}>Paso siguiente</button></div><div class="lab-nodes" aria-label="Participantes del flujo">${lab.nodes.map((node,i)=>`<button type="button" class="lab-node ${step.active.includes(node.id)?'is-active':''}" data-node="${node.id}" data-lab-node="${node.id}" aria-haspopup="dialog" aria-label="Responsabilidad de ${escape(node.label)}"><span class="node-index">${String(i+1).padStart(2,'0')}</span><strong>${escape(node.label)}</strong><span class="node-activity">${step.active.includes(node.id)?'Participa en este paso':'Ver responsabilidad'}</span></button>`).join('')}</div><section class="lab-step"><div class="step-header"><span class="eyebrow">Paso ${state.step+1} de ${scenario.steps.length}</span><span class="status-tag" data-status="${step.status}">${escape(statusLabels[step.status]||step.status)}</span></div><h2>${escape(step.title)}</h2><p>${escape(step.detail)}</p></section><p class="motion-note">${reduceMotion.matches ? 'Movimiento reducido activo. Reproducir avanza el relato sin animar los elementos.' : 'Reproducir avanza cada 4 segundos. Puedes pausar y recorrer cada paso.'}</p></div><div class="lab-code">${codeCard(lab.code,step.codeLines,id)}<p class="lab-intro">${escape(lab.intro)}</p><details class="lab-sources"><summary>Fuentes oficiales del ejemplo</summary>${sources(lab.sources)}</details></div></div><details class="lab-trace"><summary>Ver la traza de esta simulación</summary><ol>${scenario.steps.slice(0,state.step+1).map((item,i)=>`<li><span class="trace-sequence">${String(i+1).padStart(2,'0')}</span><strong>${escape(item.title)}</strong><span class="status-tag" data-status="${item.status}">${escape(statusLabels[item.status]||item.status)}</span></li>`).join('')}</ol><p>Estados ilustrativos; no son logs de un sistema conectado.</p></details></section>`;
  }
  function sourcesMarkup() {
    const technical = Object.values(labs).flatMap(lab=>lab.sources);
    const unique = [...new Map(technical.map(source=>[source.url,source])).values()];
    return `<div class="source-grid">${deck.sources.map(source=>`<a class="source-card" href="${escape(source.url)}" ${source.url.startsWith('https:')?'target="_blank" rel="noopener noreferrer"':''}><strong>${escape(source.label)} ↗</strong><span>${escape(source.detail)}</span></a>`).join('')}</div><details class="technical-sources"><summary>Documentación oficial de los ejemplos</summary>${sources(unique)}</details><p class="takeaway">Los ejemplos muestran contratos; no ejecutan código de infraestructura en el navegador.</p>`;
  }
  function body(slide) {
    switch(slide.kind) {
      case 'hero': return hero(slide);
      case 'diagram': return `<div class="slide-grid diagram-layout">${diagramCard(slide.diagram)}<div class="content-stack">${points(slide.items)}${note(slide.takeaway)}</div></div>`;
      case 'principles': return `${points(slide.items,true)}${note(slide.takeaway)}`;
      case 'data': return `<div class="comparison-grid">${slide.items.map(([title,detail],i)=>`<section class="decision-card ${i===0?'is-recommended':''}"><span class="eyebrow">${i===0?'Base recomendada':'Perfil diferente'}</span><h2>${escape(title)}</h2><p>${escape(detail)}</p></section>`).join('')}</div>${note(slide.takeaway)}`;
      case 'continuity': return continuity()+note(slide.takeaway);
      case 'states': return financialStates()+note(slide.takeaway);
      case 'lab': return `${slide.diagram?`<div class="related-diagram"><button type="button" data-diagram="${slide.diagram}">Abrir diagrama completo de Excalidraw ↗</button></div>`:''}<div id="lab-host">${labMarkup(slide.lab)}</div>`;
      case 'operations': return `<div class="slide-grid"><div>${points(slide.items)}</div><div class="log-example"><p class="eyebrow">Trazabilidad ilustrativa</p>${codeCard({label:'Un evento, varias referencias',language:'JSON',source:'{\n  "eventId": "evt-demo-042",\n  "operationId": "sale-demo-018",\n  "traceId": "trace-demo-007",\n  "branchId": "branch-demo",\n  "delivery": "acknowledged",\n  "erp": "pending",\n  "attempt": 3\n}',note:'Datos sintéticos. Ajustar campos, acceso y retención al contrato real.'})}<p class="takeaway">Entrega confirmada y ERP pendiente pueden coexistir.</p></div></div>${note(slide.takeaway)}`;
      case 'code': return `<div class="slide-grid">${codeCard(slide.code,[],'nx')}<div class="content-stack">${points(slide.items)}</div></div>`;
      case 'roadmap': return `<div class="timeline">${points(slide.items)}</div>${note(slide.takeaway)}`;
      case 'sources': return sourcesMarkup();
      default: return '';
    }
  }
  function render(focus = true) {
    pause(false);
    const slide = current();
    slideRoot.className=`slide slide-${slide.kind}`;
    slideRoot.dataset.slide=slide.id;
    slideRoot.innerHTML=(slide.kind==='hero'?'':`<header class="slide-heading"><p class="eyebrow">${escape(slide.chapter)}${slide.badge?`<span class="badge">${escape(slide.badge)}</span>`:''}</p><h1>${escape(slide.title)}</h1><p class="slide-lead">${escape(slide.lead)}</p></header>`)+body(slide);
    document.getElementById('chapter-label').textContent=slide.chapter;
    document.getElementById('slide-count').textContent=`${String(index+1).padStart(2,'0')} / ${deck.slides.length}`;
    document.getElementById('progress-fill').style.width=`${(index+1)/deck.slides.length*100}%`;
    document.querySelector('.deck-progress').setAttribute('aria-valuenow',String(index+1));
    document.querySelector('.deck-progress').setAttribute('aria-valuemax',String(deck.slides.length));
    document.getElementById('previous').disabled=index===0;
    document.getElementById('next').disabled=index===deck.slides.length-1;
    document.title=`${slide.title.replace('\n',' ')} · POS Atlas`;
    main.scrollTop=0;
    if(focus) slideRoot.focus({preventScroll:true});
  }
  function route(focus = true) {
    const [slug,query='']=location.hash.slice(1).split('?');
    index=Math.max(0,deck.slides.findIndex(slide=>slide.id===slug));
    if(current().lab) {
      const params=new URLSearchParams(query);
      const lab=labs[current().lab];
      const scenarioIndex=lab.scenarios.findIndex(scenario=>scenario.id===params.get('caso'));
      const state=getLabState(current().lab);
      if(scenarioIndex>=0) state.scenario=scenarioIndex;
      const step=Number(params.get('paso'));
      if(params.has('paso') && Number.isInteger(step)) state.step=Math.max(0,Math.min(lab.scenarios[state.scenario].steps.length-1,step-1));
      else state.step=Math.min(state.step,lab.scenarios[state.scenario].steps.length-1);
    }
    render(focus);
  }
  function go(nextIndex) {
    if(nextIndex<0||nextIndex>=deck.slides.length) return;
    const id=deck.slides[nextIndex].id;
    if(location.hash==='#'+id) {index=nextIndex;render();} else location.hash=id;
  }
  function persistStep() {
    const lab=labs[current().lab], state=getLabState(current().lab);
    const hash=`#${current().id}?caso=${encodeURIComponent(lab.scenarios[state.scenario].id)}&paso=${state.step+1}`;
    // replaceState keeps browser Back meaningful: chapters, not every animation frame.
    try { history.replaceState(null,'',hash); } catch { /* file:// can restrict history changes. */ }
  }
  function refreshLab(focusSelector) {
    const host=document.getElementById('lab-host');
    const openDetails=[...host.querySelectorAll('details[open]')].map(el=>el.className);
    host.innerHTML=labMarkup(current().lab);
    host.querySelector('.lab').classList.add('is-stepping');
    for(const name of openDetails) { const details=host.getElementsByClassName(name)[0]; if(details)details.open=true; }
    if(focusSelector) (host.querySelector(focusSelector)||host.querySelector('[aria-current="step"]')).focus({preventScroll:true});
    const state=getLabState(current().lab);
    const scenario=labs[current().lab].scenarios[state.scenario];
    const step=scenario.steps[state.step];
    announcement.textContent=`Paso ${state.step+1} de ${scenario.steps.length}. ${step.title}. ${step.detail}`;
    persistStep();
  }
  function pause(update = true) {
    clearTimeout(timer);timer=null;playing=false;
    if(update) {
      const button=document.querySelector('[data-action="lab-play"]');
      if(button) {button.textContent='Reproducir';button.setAttribute('aria-pressed','false');}
    }
  }
  function schedule() {
    timer=setTimeout(()=>{
      const state=getLabState(current().lab), last=labs[current().lab].scenarios[state.scenario].steps.length-1;
      if(state.step<last) state.step++;
      if(state.step>=last) pause(false);
      const restore=document.activeElement?.dataset.action==='lab-play'?'[data-action="lab-play"]':null;
      refreshLab(restore);
      if(playing) schedule();
    },4000);
  }
  function togglePlay() {
    if(playing) {pause();return;}
    const state=getLabState(current().lab), last=labs[current().lab].scenarios[state.scenario].steps.length-1;
    if(state.step===last) state.step=0;
    playing=true;
    refreshLab('[data-action="lab-play"]');
    schedule();
  }
  function openDialog(id) {pause();document.getElementById(id).showModal();}
  function overview() {
    document.getElementById('overview-grid').innerHTML=deck.slides.map((slide,i)=>`<button type="button" class="overview-item ${i===index?'is-current':''}" data-slide-index="${i}" ${i===index?'aria-current="page"':''}><span class="overview-number">${String(i+1).padStart(2,'0')}</span><span><small>${escape(slide.chapter)}</small><strong>${escape(slide.title.replace('\n',' '))}</strong><span>${slide.lab?'Laboratorio interactivo':slide.diagram?'Diagrama C4 / Excalidraw':'Modelo y decisiones'}</span></span></button>`).join('');
    openDialog('overview');
  }
  function notes() {
    const slide=current();
    document.getElementById('notes-title').textContent='Notas para presentar';
    document.getElementById('notes-content').innerHTML=`<h3>${escape(slide.title.replace('\n',' '))}</h3><ol>${slide.notes.map(item=>`<li>${escape(item)}</li>`).join('')}</ol><p class="keyboard-help"><kbd>←</kbd> <kbd>→</kbd> cambian de diapositiva. <kbd>O</kbd> abre el índice; <kbd>N</kbd> abre notas. Dentro de un control, las teclas conservan su función habitual.</p>`;
    openDialog('notes');
  }
  const viewport=document.getElementById('diagram-viewport');
  const diagramImage=document.getElementById('diagram-image');
  function setZoom(scale, preserveCenter = true) {
    if(!diagramImage.naturalWidth) return;
    const oldWidth=diagramImage.width, oldHeight=diagramImage.height;
    const centerX=(viewport.scrollLeft+viewport.clientWidth/2)/Math.max(oldWidth,viewport.clientWidth);
    const centerY=(viewport.scrollTop+viewport.clientHeight/2)/Math.max(oldHeight,viewport.clientHeight);
    diagramScale=Math.max(.03,Math.min(4,scale));
    diagramImage.width=Math.round(diagramImage.naturalWidth*diagramScale);
    diagramImage.height=Math.round(diagramImage.naturalHeight*diagramScale);
    document.getElementById('diagram-stage').style.width=`${Math.max(viewport.clientWidth,diagramImage.width)}px`;
    document.getElementById('diagram-stage').style.height=`${Math.max(viewport.clientHeight,diagramImage.height)}px`;
    document.getElementById('zoom-label').textContent=`${Math.round(diagramScale*100)} %`;
    viewport.scrollLeft=preserveCenter?centerX*Math.max(viewport.clientWidth,diagramImage.width)-viewport.clientWidth/2:0;
    viewport.scrollTop=preserveCenter?centerY*Math.max(viewport.clientHeight,diagramImage.height)-viewport.clientHeight/2:0;
  }
  function fitDiagram() {
    if(!diagramImage.naturalWidth) return;
    diagramFit=Math.min((viewport.clientWidth-24)/diagramImage.naturalWidth,(viewport.clientHeight-24)/diagramImage.naturalHeight,1);
    setZoom(diagramFit,false);
  }
  function openDiagram(id) {
    const diagram=deck.diagrams[id];
    document.getElementById('diagram-title').textContent=diagram.title;
    const download=document.getElementById('diagram-download');
    download.href=`../docs/diagramas-excalidraw/${diagram.file}.excalidraw`;
    download.download=diagram.file+'.excalidraw';
    diagramImage.alt=diagram.alt;
    diagramImage.onload=fitDiagram;
    diagramImage.src=`../docs/diagramas-excalidraw/${diagram.file}.svg`;
    openDialog('diagram-dialog');
    if(diagramImage.complete) fitDiagram();
  }
  viewport.addEventListener('pointerdown',event=>{
    if(event.button!==0) return;
    drag={x:event.clientX,y:event.clientY,left:viewport.scrollLeft,top:viewport.scrollTop};
    viewport.setPointerCapture(event.pointerId);viewport.classList.add('is-dragging');
  });
  viewport.addEventListener('pointermove',event=>{if(drag){viewport.scrollLeft=drag.left-event.clientX+drag.x;viewport.scrollTop=drag.top-event.clientY+drag.y;}});
  const endDrag=()=>{drag=null;viewport.classList.remove('is-dragging');};
  viewport.addEventListener('pointerup',endDrag);viewport.addEventListener('pointercancel',endDrag);
  diagramImage.addEventListener('dragstart',event=>event.preventDefault());
  viewport.addEventListener('keydown',event=>{
    const movement={ArrowLeft:[-100,0],ArrowRight:[100,0],ArrowUp:[0,-100],ArrowDown:[0,100]}[event.key];
    if(movement){event.preventDefault();viewport.scrollBy(...movement);}
    if(event.key==='+'||event.key==='='){event.preventDefault();setZoom(diagramScale*1.3);}
    if(event.key==='-'){event.preventDefault();setZoom(diagramScale/1.3);}
  });
  window.addEventListener('resize',()=>{if(document.getElementById('diagram-dialog').open)fitDiagram();});
  document.addEventListener('click',async event=>{
    const button=event.target.closest('button');
    if(!button) return;
    if(button.dataset.diagram){openDiagram(button.dataset.diagram);return;}
    if(button.dataset.labNode){
      const node=labs[current().lab].nodes.find(node=>node.id===button.dataset.labNode);
      document.getElementById('notes-title').textContent='Responsabilidad del participante';
      document.getElementById('notes-content').innerHTML=`<h3>${escape(node.label)}</h3><p>${escape(node.detail)}</p><p class="takeaway">${escape(labs[current().lab].question)}</p>`;
      openDialog('notes');return;
    }
    if(button.dataset.slideIndex){document.getElementById('overview').close();go(Number(button.dataset.slideIndex));return;}
    if(button.dataset.step!==undefined){pause();getLabState(current().lab).step=Number(button.dataset.step);refreshLab(`[data-step="${button.dataset.step}"]`);return;}
    if(button.dataset.copy){
      const source=button.dataset.copy==='nx'?current().code.source:labs[button.dataset.copy].code.source;
      try{await navigator.clipboard.writeText(source);button.textContent='Copiado';announcement.textContent='Ejemplo copiado.';}
      catch{button.textContent='Selecciona el código';button.closest('.code-card').querySelector('pre').focus();announcement.textContent='Selecciona el texto del ejemplo para copiarlo manualmente.';}
      return;
    }
    const action=button.dataset.action;
    if(action==='next')go(index+1);
    else if(action==='previous')go(index-1);
    else if(action==='overview')overview();
    else if(action==='notes')notes();
    else if(action==='close-dialog')button.closest('dialog').close();
    else if(action==='fullscreen'){
      try{if(document.fullscreenElement)await document.exitFullscreen();else await document.documentElement.requestFullscreen();}
      catch{announcement.textContent='Este navegador no permite pantalla completa. Puedes usar su opción de pantalla completa.';}
    }
    else if(action==='zoom-in')setZoom(diagramScale*1.3);
    else if(action==='zoom-out')setZoom(diagramScale/1.3);
    else if(action==='zoom-fit')fitDiagram();
    else if(action==='zoom-native')setZoom(1);
    else if(action==='lab-play')togglePlay();
    else if(action?.startsWith('lab-')){
      pause();const state=getLabState(current().lab), last=labs[current().lab].scenarios[state.scenario].steps.length-1;
      state.step=action==='lab-reset'?0:Math.max(0,Math.min(last,state.step+(action==='lab-next'?1:-1)));
      refreshLab(`[data-action="${action}"]:not(:disabled)`);
    }
    else if(action==='toggle-wan'||action==='toggle-lan'){
      if(action==='toggle-wan')wan=!wan;else lan=!lan;
      render(false);slideRoot.querySelector(`[data-action="${action}"]`).focus({preventScroll:true});
    }
  });
  document.addEventListener('change',event=>{
    if(event.target.id==='lab-scenario'){
      pause();const state=getLabState(current().lab);state.scenario=Number(event.target.value);state.step=0;refreshLab('#lab-scenario');
    }
    if(event.target.id==='financial-case'){financialCase=event.target.value;render(false);document.getElementById('financial-case').focus({preventScroll:true});}
  });
  document.addEventListener('keydown',event=>{
    if(event.defaultPrevented||event.ctrlKey||event.altKey||event.metaKey||document.querySelector('dialog[open]'))return;
    if(event.target.closest('input,select,textarea,button,a,summary,pre,[contenteditable="true"]'))return;
    if(event.key==='ArrowRight'||event.key==='PageDown'){event.preventDefault();go(index+1);}
    else if(event.key==='ArrowLeft'||event.key==='PageUp'){event.preventDefault();go(index-1);}
    else if(event.key==='Home'){event.preventDefault();go(0);}
    else if(event.key==='End'){event.preventDefault();go(deck.slides.length-1);}
    else if(event.key.toLowerCase()==='o'||event.key==='Escape'){event.preventDefault();overview();}
    else if(event.key.toLowerCase()==='n'){event.preventDefault();notes();}
    else if(event.code==='Space'&&current().lab){event.preventDefault();togglePlay();}
  });
  document.addEventListener('focusin',event=>{
    if(playing && event.target.closest('#lab-host') && event.target.dataset.action!=='lab-play')pause();
  });
  document.addEventListener('visibilitychange',()=>{if(document.hidden)pause();});
  document.addEventListener('fullscreenchange',()=>{document.getElementById('fullscreen-button').textContent=document.fullscreenElement?'Salir de pantalla completa':'Pantalla completa';});
  reduceMotion.addEventListener('change',()=>{pause();if(current().lab)refreshLab();});
  window.addEventListener('hashchange',()=>route());
  route(false);
})();
