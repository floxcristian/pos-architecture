/* Reveal course: render trusted educational data; simulations never call infrastructure. */
(() => {
  'use strict';
  const C = window.POS_REVEAL_CONTENT;
  const L = window.POS_REVEAL_LABS;
  const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
  const main = $('#presentation');
  const dialog = $('#course-dialog');
  const navigationWidget = 'input,select,textarea,[contenteditable],[role=slider],[role=combobox],[role=listbox],[role=menu],[role=tablist],[role=radiogroup]';
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const query = new URLSearchParams(location.search);
  const reading = query.get('lectura') === '1' || (!query.has('lectura') && innerWidth < 700 && !query.has('print-pdf'));
  const slideById = new Map(C.slides.map(slide => [slide.id, slide]));
  const states = new Map();
  let currentId = C.slides[0].id;
  let timer = null;
  let playingId = null;
  let dialogOpener = null;

  const diagramModels = {
    context: {file:'01-contexto',caption:'C1 · Personas y sistemas. Las flechas nombran relaciones; no representan orden de ejecución.',nodes:[
      ['operator',55,35,250,95,'Personas de tienda','Cajero · supervisor'],['platform',55,270,250,95,'Equipo corporativo','Configura y opera'],
      ['pos',470,150,280,115,'POS corporativo','Un producto multipaís','main'],['master',925,25,290,90,'Maestros / precios','Autoridad por dato y país'],
      ['provider',925,190,290,90,'Pago y fiscalidad','Contratos homologados'],['erp',925,355,290,90,'Sistemas empresariales','AX · Gira · custom']],edges:[
      ['operator','pos','Vende / opera',389,85],['platform','pos','Configura',389,348],['master','pos','Publica datos',831,100],['pos','provider','Solicita',835,196],['pos','erp','Integra operaciones',815,385]]},
    containers: {file:'02-contenedores',caption:'C2 · Aplicaciones y almacenamiento. Angular/Tauri es cliente; la autoridad de venta está en sucursal.',nodes:[
      ['ui',30,50,270,100,'Cliente POS','Angular + Tauri','main'],['api',485,50,280,100,'Backend sucursal','Casos de uso + permisos','main'],['db',485,305,280,100,'PostgreSQL local','Venta · precios · outbox','data'],
      ['sync',30,305,270,100,'Sincronizador','Proceso supervisado'],['country',950,20,275,95,'API de país','Recepción autorizada'],['country-db',950,200,275,95,'PostgreSQL país','Inbox · efecto · outbox','data'],['workers',950,375,275,95,'Workers de país','Integración / publicación']],edges:[
      ['ui','api','Comandos · LAN',393,80],['api','db','Transacción local',637,237],['db','sync','Trabajo durable',389,344],['sync','country','HTTPS por lotes',530,466],['country','country-db','Commit de país',1090,162],['country-db','workers','Lee trabajo',1090,341]],routes:{'sync-country':'M165 405 V480 H850 V67 H950'}},
    backend: {file:'03-backend-sucursal',caption:'C3 · Componentes dentro del mismo backend. Las reglas nacionales entran por contratos explícitos.',boundary:[20,10,1210,430,'Un proceso · Backend de sucursal'],nodes:[
      ['entry',55,170,250,100,'Entrada autorizada','Identidad · validación'],['usecase',490,65,285,100,'Aplicación','Venta · caja · devolución','main'],['pricing',490,285,285,100,'Dominio / precios','Reglas puras versionadas','data'],
      ['ports',930,65,265,100,'Contratos POS','Pago · fiscalidad'],['store',930,285,265,100,'Persistencia','Venta · auditoría · outbox']],edges:[
      ['entry','usecase','Caso de uso',387,127],['usecase','ports','Contrato',850,99],['usecase','pricing','Calcula',638,235],['usecase','store','Guarda',846,293]]},
    sync: {file:'04-sincronizador',caption:'C3 · Salida e ingreso tienen estados propios. Recibir una publicación no la vuelve utilizable para vender.',nodes:[
      ['schedule',35,45,290,100,'Planificación / manual','Permiso · exclusión · auditoría'],['outbox',485,45,290,100,'Salida de operaciones','Outbox → HTTPS → acuse','main'],['remote',935,45,290,100,'Plataforma de país','Recepción / publicaciones'],
      ['staging',935,310,290,100,'Entrada durable','Snapshot + deltas + cursor'],['validate',485,310,290,100,'Candidata aislada','Validación + compatibilidad'],['active',35,310,290,100,'Publicación local','Puntero activo + cursor','data']],edges:[
      ['schedule','outbox','Despacha salida',410,72],['outbox','remote','Identidad estable',862,72],['remote','staging','Datos versionados',1090,240],['staging','validate','Conjunto completo',862,342],['validate','active','Commit corto',413,342]]},
    deployment: {file:'05-despliegue',caption:'Despliegue · Perfil WAN: sin Internet, pero con LAN y servidor disponibles. No equivale a caja aislada.',nodes:[
      ['register',35,60,290,105,'Puesto de caja','Cliente · lector · impresión','main'],['branch',485,60,290,105,'Servidor de sucursal','Backend + PostgreSQL','data'],['country',935,60,290,105,'Plataforma de país','API + DB + workers'],
      ['sync',485,320,290,100,'Worker de sucursal','Sigue sin la ventana POS'],['erp',935,320,290,100,'Red autorizada ERP','Adaptador homologado']],edges:[
      ['register','branch','LAN',404,97],['branch','country','WAN / HTTPS',862,97],['branch','sync','Datos locales',641,250],['country','erp','Integración',1090,250]]}
  };

  function nodeCenter(node) { return [node[1]+node[3]/2,node[2]+node[4]/2]; }
  function diagram(key, id) {
    const model = diagramModels[key];
    if (!model) throw new Error(`Unknown diagram ${key}`);
    const nodes = new Map(model.nodes.map(node => [node[0],node]));
    const arrowId = `arrow-${id}`;
    const boundary = model.boundary ? `<rect class="boundary" x="${model.boundary[0]}" y="${model.boundary[1]}" width="${model.boundary[2]}" height="${model.boundary[3]}" rx="18"/><text class="boundary-label" x="42" y="38">${esc(model.boundary[4])}</text>` : '';
    const edges = model.edges.map(([from,to,label,lx,ly]) => {
      const a=nodes.get(from),b=nodes.get(to),[ax,ay]=nodeCenter(a),[bx,by]=nodeCenter(b);
      let d;
      if (Math.abs(bx-ax)>Math.abs(by-ay)) {
        const sx=ax+(bx>ax?1:-1)*a[3]/2, ex=bx+(bx>ax?-1:1)*b[3]/2;
        d=`M${sx} ${ay} C${(sx+ex)/2} ${ay} ${(sx+ex)/2} ${by} ${ex} ${by}`;
      } else { const sy=ay+(by>ay?1:-1)*a[4]/2,ey=by+(by>ay?-1:1)*b[4]/2; d=`M${ax} ${sy} L${bx} ${ey}`; }
      return `<path class="edge" d="${model.routes?.[`${from}-${to}`] || d}" marker-end="url(#${arrowId})"/><text class="edge-label" x="${lx}" y="${ly}" text-anchor="middle">${esc(label)}</text>`;
    }).join('');
    const boxes = model.nodes.map(([,x,y,w,h,title,detail,tone])=>`<g class="${tone==='main'?'main-node':tone==='data'?'data-node':''}"><rect class="node-rect" x="${x}" y="${y}" width="${w}" height="${h}" rx="12"/><text class="node-title" x="${x+w/2}" y="${y+38}" text-anchor="middle">${esc(title)}</text><text class="node-detail" x="${x+w/2}" y="${y+69}" text-anchor="middle">${esc(detail)}</text></g>`).join('');
    const mobile=`<div class="diagram-reading-list"><dl>${model.nodes.map(node=>`<div><dt>${esc(node[5])}</dt><dd>${esc(node[6])}</dd></div>`).join('')}</dl><h3>Relaciones del mapa</h3><ul>${model.edges.map(([a,b,label])=>`<li><strong>${esc(nodes.get(a)[5])} → ${esc(nodes.get(b)[5])}</strong><span>${esc(label)}</span></li>`).join('')}</ul></div>`;
    return `<svg class="diagram-svg" viewBox="0 0 1260 500" role="img" aria-labelledby="diagram-title-${id} diagram-desc-${id}"><title id="diagram-title-${id}">${esc(model.caption)}</title><desc id="diagram-desc-${id}">${esc(model.edges.map(([a,b,l])=>`${nodes.get(a)[5]} → ${nodes.get(b)[5]}: ${l}`).join('. '))}</desc><defs><marker id="${arrowId}" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0 0 L8 4 L0 8" fill="#7f99bd"/></marker></defs>${boundary}${edges}${boxes}</svg>${mobile}<div class="diagram-caption"><span>${esc(model.caption)}</span><a href="../docs/diagramas-excalidraw/${model.file}.excalidraw" download>Excalidraw completo ↓</a></div>`;
  }
  function cards(items = []) { return `<div class="card-grid count-${items.length}">${items.map((item,i)=>`<article class="concept-card"><div class="card-number">${esc(item.kicker || `0${i+1}`)}</div><h3>${esc(item.title)}</h3><p>${esc(item.text)}</p></article>`).join('')}</div>`; }
  function code(slide) {
    const block = slide.code || {};
    const aside = (slide.items || []).map(item=>`<article><h3>${esc(item.title)}</h3><p>${esc(item.text)}</p></article>`).join('');
    return `<div class="code-layout ${aside?'':'solo'}"><div><div class="code-label">${esc(block.label || (slide.kind==='tree'?'Estructura ilustrativa del producto':'Fragmento educativo'))}</div><pre data-id="${esc(slide.autoAnimate || slide.id)}"><code class="language-${esc(block.language || 'plaintext')}" ${!reading && block.highlights?`data-line-numbers="${esc(block.highlights)}"`:''}>${esc(block.source)}</code></pre><p class="code-caption">${slide.kind==='tree'?'Carpetas orientativas: responsabilidades, no servidores.':'Ejemplo conceptual: sigue entradas, llamada y resultado.'}</p></div>${aside?`<div class="code-aside">${aside}</div>`:''}</div>`;
  }
  function labMarkup(slide) {
    const lab=L[slide.lab];
    if (!lab) throw new Error(`Unknown lab ${slide.lab}`);
    states.set(slide.id,{scenario:0,step:0});
    return `<div class="lab" data-lab="${esc(slide.lab)}" data-owner="${esc(slide.id)}"><div class="lab-scenarios" role="group" aria-label="Escenario del laboratorio"><span>ESCENARIO</span>${lab.scenarios.map((s,i)=>`<button type="button" data-scenario="${i}" aria-pressed="${i===0}">${esc(s.label)}</button>`).join('')}</div><div class="lab-flow" style="--nodes:${lab.nodes.length}">${lab.nodes.map(node=>`<div class="lab-node" data-node="${esc(node.id)}"><h3>${esc(node.label)}</h3><p>${esc(node.detail)}</p></div>`).join('')}</div><div class="lab-route" aria-hidden="true"></div><div class="lab-split"><div><div class="lab-explanation" aria-live="polite" aria-atomic="true"><h3 class="lab-step-title"></h3><p class="lab-step-text"></p></div><div class="lab-values"></div></div><div class="lab-console"><p class="console-label">Evidencia simulada · no ejecuta servicios</p><div class="lab-log"></div><pre class="lab-code"></pre></div></div><div class="lab-controls"><output aria-label="Paso del escenario"></output><button type="button" data-lab-action="prev" aria-label="Paso anterior del laboratorio">← Paso</button><button type="button" data-lab-action="next">Paso →</button><button type="button" data-lab-action="play" class="primary">Reproducir</button><button type="button" data-lab-action="reset">Reiniciar</button></div></div>`;
  }
  function body(slide) {
    switch(slide.kind) {
      case 'cover':return `<div class="cover-system"><div class="cover-unit" data-id="common-core"><div class="unit-number">01 / REUTILIZAR</div><h3>Núcleo compartido</h3><p>Ventas, caja, precios y reglas comunes.</p></div><div class="cover-arrow" aria-hidden="true">→</div><div class="cover-unit"><div class="unit-number">02 / CONFIGURAR</div><h3>Perfiles por país</h3><p>Capacidades aprobadas y versiones compatibles.</p></div><div class="cover-arrow" aria-hidden="true">→</div><div class="cover-unit"><div class="unit-number">03 / EXTENDER</div><h3>Contratos propios</h3><p>Fiscalidad, pagos, ERP y dispositivos.</p></div></div>`;
      case 'outline':return `<div class="route-grid">${C.chapters.map((chapter,i)=>`<div class="route-entry"><span>0${i+1}</span><h3><a href="#/${esc(C.slides.find(s=>s.chapter===chapter.id).id)}" data-jump="${esc(C.slides.find(s=>s.chapter===chapter.id).id)}">${esc(chapter.title)}</a></h3></div>`).join('')}</div>`;
      case 'cards':return cards(slide.items);
      case 'compare':return `<div class="compare-grid" style="--cols:${slide.columns.length}">${slide.columns.map(column=>`<article class="compare-column"><h3>${esc(column.title)}</h3><ul>${column.items.map(item=>`<li>${esc(item)}</li>`).join('')}</ul></article>`).join('')}</div>`;
      case 'diagram':return diagram(slide.diagramKey,slide.id);
      case 'code':case 'tree':return code(slide);
      case 'lab':return labMarkup(slide);
      case 'quiz':return `<div class="quiz" data-owner="${esc(slide.id)}"><div class="quiz-options" role="group" aria-label="${esc(slide.question || slide.title)}">${slide.options.map((option,i)=>`<button type="button" data-answer="${i}" aria-pressed="false"><span class="option-letter">${String.fromCharCode(65+i)}</span>${esc(option.label)}</button>`).join('')}</div><div class="quiz-feedback" aria-live="polite"></div></div>`;
      case 'closing':return `${cards(slide.items || [])}<div class="closing-links">${(slide.links || C.sources).map(link=>`<a href="${esc(link.url)}">${esc(link.label)} ↗</a>`).join('')}</div>`;
      default:throw new Error(`Unknown slide kind: ${slide.kind}`);
    }
  }
  const locations = new Map();
  $('#course-slides').innerHTML=C.chapters.map((chapter,h)=>`<section class="chapter-stack" aria-label="${esc(chapter.title)}">${C.slides.filter(slide=>slide.chapter===chapter.id).map((slide,v)=>{
    locations.set(slide.id,{h,v});
    const title=slide.kind==='cover'?'h1':'h2';
    return `<section id="${esc(slide.id)}" class="course-slide kind-${slide.kind} ${slide.kind==='cover'?'cover':''}" data-chapter="${esc(chapter.id)}" ${slide.autoAnimate?`data-auto-animate data-auto-animate-id="${esc(slide.autoAnimate)}"`:''} aria-labelledby="title-${esc(slide.id)}"><div class="slide-head"><p class="eyebrow">${esc(chapter.title)}</p><${title} id="title-${esc(slide.id)}">${esc(slide.title)}</${title}>${slide.lead?`<p class="slide-lead">${esc(slide.lead)}</p>`:''}</div><div class="slide-body">${body(slide)}</div>${slide.takeaway?`<div class="takeaway">${esc(slide.takeaway)}</div>`:''}${slide.source?`<div class="slide-source">Profundizar: <a href="${esc(slide.source.url)}">${esc(slide.source.label)}</a></div>`:''}<aside class="notes">${(slide.notes || []).map(note=>`<p>${esc(note)}</p>`).join('')}</aside></section>`;
  }).join('')}</section>`).join('');

  function stateOf(root) { return states.get(root.dataset.owner); }
  function routeSvg(lab,step,owner) {
    // Arrows follow the exact source and destination, including return/ACK paths.
    const count=lab.nodes.length;
    const nodeWidth=(1200-(count-1)*38)/count;
    const names = new Map(lab.nodes.map((node,i)=>[node.id,{label:node.label,x:nodeWidth/2+i*(nodeWidth+38)}]));
    const paths=(step.links || []).map(([from,to],i)=>{
      const a=names.get(from),b=names.get(to);
      if(!a || !b) throw new Error(`Invalid route ${from} → ${to}`);
      const d=`M${a.x} 8 Q${(a.x+b.x)/2} ${from===to?42:60+i*10} ${b.x} 8`;
      return `<path d="${d}" stroke="var(--cyan)" stroke-width="2" fill="none" marker-end="url(#lab-arrow-${owner}-${i})"/><defs><marker id="lab-arrow-${owner}-${i}" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto"><path d="M0 0L6 3L0 6" fill="var(--cyan)"/></marker></defs>${!reduced.matches?`<circle r="4" fill="var(--cyan)"><animateMotion dur="1.2s" repeatCount="1" path="${d}" fill="freeze"/></circle>`:''}`;
    }).join('');
    return `<svg viewBox="0 0 1200 70" preserveAspectRatio="none" focusable="false">${paths}</svg>`;
  }
  function paintLab(root) {
    const state=stateOf(root),lab=L[root.dataset.lab],scenario=lab.scenarios[state.scenario],step=scenario.steps[state.step];
    $$('[data-scenario]',root).forEach((button,i)=>button.setAttribute('aria-pressed',String(i===state.scenario)));
    $$('.lab-node',root).forEach(node=>node.classList.toggle('active',step.active.includes(node.dataset.node)));
    $('.lab-route',root).innerHTML=routeSvg(lab,step,root.dataset.owner);
    $('.lab-step-title',root).textContent=step.title;
    $('.lab-step-text',root).textContent=step.text;
    $('.lab-values',root).innerHTML=(step.values || []).map(item=>`<div class="lab-value ${esc(item.tone || '')}"><span>${esc(item.label)}</span><strong>${esc(item.value)}</strong></div>`).join('');
    const labels=new Map(lab.nodes.map(node=>[node.id,node.label]));
    $('.console-label',root).textContent=step.code?'Código conceptual · auxiliares por implementar':'Evidencia simulada · no ejecuta servicios';
    $('.lab-log',root).textContent=step.log;
    $('.lab-code',root).textContent=step.code || (step.links || []).map(([a,b])=>`${labels.get(a)} → ${labels.get(b)}`).join('\n');
    $('.lab-code',root).hidden=!$('.lab-code',root).textContent;
    $('output',root).textContent=`Paso ${state.step+1} / ${scenario.steps.length}`;
    $('[data-lab-action=prev]',root).disabled=state.step===0;
    $('[data-lab-action=next]',root).disabled=state.step===scenario.steps.length-1;
    $('[data-lab-action=play]',root).textContent=playingId===root.dataset.owner?'Pausar':'Reproducir';
    root.dataset.step=String(state.step);
    root.dataset.scenario=String(state.scenario);
  }
  function stop(freeze = true) {
    clearTimeout(timer);timer=null;playingId=null;
    if(freeze)$$('.lab-route svg').forEach(svg=>svg.pauseAnimations?.());
    $$('[data-lab-action=play]').forEach(button=>button.textContent='Reproducir');
  }
  function schedule(root) {
    const state=stateOf(root),steps=L[root.dataset.lab].scenarios[state.scenario].steps;
    timer=setTimeout(()=>{
      if (document.hidden || dialog.open || currentId!==root.dataset.owner) {stop();return;}
      if (state.step>=steps.length-1) {stop();return;}
      state.step++;paintLab(root);
      if(state.step===steps.length-1) stop(false);else schedule(root);
    },Math.max(4200,Math.min(9000,steps[state.step].text.length*33)));
  }
  function current() { return slideById.get(currentId); }
  function update(id,announce=true) {
    if(!slideById.has(id))return;
    if(currentId!==id) stop();
    currentId=id;
    const slide=current(),index=C.slides.indexOf(slide),chapter=C.chapters.find(c=>c.id===slide.chapter);
    $('#chapter-label').textContent=chapter.title;
    $('#slide-count').textContent=`${String(index+1).padStart(2,'0')} / ${C.slides.length}`;
    $('[data-ui=previous]').disabled=index===0;
    $('[data-ui=next]').disabled=index===C.slides.length-1;
    const params=new URLSearchParams(location.search);params.set('lectura',reading?'0':'1');params.delete('print-pdf');
    $('#reading-link').href=`?${params}#/${id}`;
    $('#reading-link').textContent=reading?'Presentar':'Leer';
    if(announce)$('#course-announcement').textContent=`${index+1} de ${C.slides.length}. ${slide.title}`;
  }
  function goTo(id) {
    if(!locations.has(id))return;
    if(reading){document.getElementById(id).scrollIntoView({behavior:reduced.matches?'instant':'smooth',block:'start'});history.replaceState(null,'',`#/${id}`);update(id);}
    else {const p=locations.get(id);Reveal.slide(p.h,p.v,-1);}
  }
  function navigate(direction) {
    stop();
    const target=C.slides[C.slides.indexOf(current())+direction];
    if(target)goTo(target.id);
  }
  function openDialog(kind,opener) {
    stop();dialogOpener=opener || document.activeElement;
    let title,content;
    if(kind==='index') {
      title='El recorrido, capítulo por capítulo';
      content=`<p>→ o Siguiente: siguiente lámina. ← o Anterior: lámina anterior. Recorren toda la presentación en orden, también al cambiar de capítulo. Espacio avanza los bloques resaltados del código y luego la lámina; Mayús + Espacio retrocede. El índice permite saltar a cualquier tema. En móvil, el modo lectura conserva los laboratorios.</p><div class="index-chapters">${C.chapters.map((chapter,i)=>`<div class="index-chapter"><h3>${esc(chapter.title)}</h3><ol>${C.slides.filter(slide=>slide.chapter===chapter.id).map(slide=>`<li><a href="#/${slide.id}" data-jump="${slide.id}">${esc(slide.title)}</a></li>`).join('')}</ol></div>`).join('')}</div>`;
    } else if(kind==='notes') {
      title=current().title;
      content=`<p>Notas para quien presenta. Los ejemplos son didácticos y usan datos simulados.</p><ol>${(current().notes || []).map(note=>`<li>${esc(note)}</li>`).join('')}</ol>${current().source?`<p><a href="${esc(current().source.url)}">${esc(current().source.label)}</a></p>`:''}`;
    } else {title='Términos, en lenguaje directo';content=`<dl class="glossary-grid">${C.glossary.map(item=>`<div><dt>${esc(item.term)}</dt><dd>${esc(item.meaning)}</dd></div>`).join('')}</dl>`;}
    $('#dialog-title').textContent=title;
    $('#dialog-eyebrow').textContent=kind==='notes'?'Notas del presentador':kind==='index'?'8 capítulos · una plataforma':'Glosario de arquitectura';
    $('#dialog-body').innerHTML=content;
    dialog.showModal();
  }
  dialog.addEventListener('close',()=>dialogOpener?.focus({preventScroll:true}));
  document.addEventListener('click',event=>{
    const jump=event.target.closest('[data-jump]');
    if(jump){event.preventDefault();if(dialog.open)dialog.close();goTo(jump.dataset.jump);return;}
    const ui=event.target.closest('[data-ui]');
    if(ui){
      const action=ui.dataset.ui;
      if(action==='previous'||action==='next')navigate(action==='next'?1:-1);
      else if(action==='close')dialog.close();
      else if(action==='fullscreen') {if(document.fullscreenElement)document.exitFullscreen().catch(()=>{});else document.documentElement.requestFullscreen?.().catch(()=>{});}
      else openDialog(action,ui);
      return;
    }
    const root=event.target.closest('.lab');
    if(root){
      const scenario=event.target.closest('button[data-scenario]'),action=event.target.closest('[data-lab-action]')?.dataset.labAction;
      const state=stateOf(root),steps=L[root.dataset.lab].scenarios[state.scenario].steps;
      if(scenario){stop();state.scenario=Number(scenario.dataset.scenario);state.step=0;}
      else if(action==='play'){
        if(playingId===root.dataset.owner){stop();return;}
        else {stop();if(state.step===steps.length-1)state.step=0;playingId=root.dataset.owner;schedule(root);}
      } else if(action){stop();if(action==='reset')state.step=0;else state.step=Math.max(0,Math.min(steps.length-1,state.step+(action==='next'?1:-1)));}
      if(scenario||action)paintLab(root);
      return;
    }
    const answer=event.target.closest('[data-answer]');
    if(answer){const quiz=answer.closest('.quiz'),slide=slideById.get(quiz.dataset.owner),option=slide.options[Number(answer.dataset.answer)];$$('[data-answer]',quiz).forEach(button=>button.setAttribute('aria-pressed',String(button===answer)));const feedback=$('.quiz-feedback',quiz);feedback.className=`quiz-feedback ${option.correct?'success':'warning'}`;feedback.textContent=`${option.correct?'Correcto.':'Revisa este punto.'} ${option.feedback}`;}
  });
  document.addEventListener('keydown',event=>{
    if(dialog.open){event.stopPropagation();return;}
    if(event.defaultPrevented||event.ctrlKey||event.metaKey||event.altKey||event.target.closest(navigationWidget))return;
    // Navigation remains available after clicking a button or following an index link.
    const direction={ArrowRight:1,PageDown:1,ArrowLeft:-1,PageUp:-1}[event.key];
    if(direction){event.preventDefault();event.stopImmediatePropagation();navigate(direction);return;}
    // Preserve native Space/Enter activation for focused controls.
    if(event.target.closest('button,a'))return;
    const action={o:'index',n:'notes',g:'glossary'}[event.key.toLowerCase()];
    if(action){event.preventDefault();event.stopImmediatePropagation();openDialog(action);}
  },true);
  document.addEventListener('visibilitychange',()=>{if(document.hidden)stop();});
  reduced.addEventListener('change',()=>{stop();if(!reading)Reveal.configure({transition:reduced.matches?'none':'slide',autoAnimate:!reduced.matches});$$('.lab').forEach(paintLab);});
  document.addEventListener('fullscreenchange',()=>{const button=$('[data-ui=fullscreen]');button.textContent=document.fullscreenElement?'Salir de pantalla completa':'Pantalla completa';button.setAttribute('aria-label',button.textContent);});
  $$('.lab').forEach(paintLab);

  async function initialize() {
    if(reading) {
      document.body.classList.add('reading-mode');
      const observer=new IntersectionObserver(entries=>{const best=entries.filter(e=>e.isIntersecting).sort((a,b)=>b.intersectionRatio-a.intersectionRatio)[0];if(best){update(best.target.id,false);history.replaceState(null,'',`#/${best.target.id}`);}},{root:main,threshold:[0,.1,.3,.5,.7]});
      $$('.course-slide').forEach(slide=>observer.observe(slide));
      const id=decodeURIComponent(location.hash.replace(/^#\/?/,''));
      if(slideById.has(id))goTo(id);else update(currentId,false);
    } else {
      Reveal.on('slidechanged',event=>update(event.currentSlide.id));
      Reveal.on('overviewshown',stop);
      await Reveal.initialize({width:1280,height:780,margin:.035,minScale:.2,maxScale:1.6,center:false,display:'flex',navigationMode:'linear',controls:false,progress:true,hash:true,hashOneBasedIndex:false,history:true,respondToHashChanges:true,transition:reduced.matches?'none':'slide',transitionSpeed:'fast',backgroundTransition:'none',autoAnimate:!reduced.matches,autoAnimateDuration:.45,autoSlide:0,loop:false,embedded:true,scrollActivationWidth:null,help:true,disableLayout:false,pdfSeparateFragments:false,plugins:[RevealHighlight],keyboardCondition:()=>!dialog.open&&!document.activeElement?.closest(`button,a,${navigationWidget}`)});
      update(Reveal.getCurrentSlide().id,false);
    }
    document.body.dataset.ready='true';
  }
  window.POSCourse={goTo,stop,getState:()=>({currentId,reading,playingId,labs:Object.fromEntries([...states].map(([id,state])=>[id,{...state}]))})};
  initialize().catch(error=>{console.error(error);$('#course-announcement').textContent='No se pudo iniciar la presentación. Recarga la página.';});
})();
