/* Guided, read-only data journeys. All evidence and SVGs are local assets. */
(() => {
  'use strict';
  const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const $ = selector => document.querySelector(selector);
  const $$ = selector => [...document.querySelectorAll(selector)];
  const list = value => Array.isArray(value) ? value : [];
  const stringify = value => Array.isArray(value) ? value.join(' · ') : value && typeof value === 'object' ? Object.entries(value).map(([k,v])=>`${k}: ${v}`).join(' · ') : String(value ?? '');
  const data = () => window.POS_DATAFLOWS || {flows:[]};
  const state = {flow:'D03',step:0,zoom:'step'};
  let bridge = {};
  const current = () => list(data().flows).find(f=>f.id===state.flow) || list(data().flows)[0];
  const sourceLink = source => /^(\.\.\/docs\/|https:\/\/github\.com\/)/.test(source?.url || '') ? `<a href="${esc(source.url)}" target="_blank" rel="noopener">${esc(source.label || 'Ver evidencia')} ↗</a>` : esc(source?.label || 'Fuente pendiente');
  const sources = items => `<ul class="source-list df-sources">${list(items).map(s=>`<li>${sourceLink(s)}</li>`).join('')}</ul>`;
  function html() {
    return `<section class="dataflow-explorer" id="dataflow-explorer" aria-label="Recorridos de datos y tablas del sistema actual"><div class="df-introduction"><span class="eyebrow">ACTUAL / SEGUIR LECTURAS Y ESCRITURAS</span><h2>Qué cambia en cada base.</h2><p>Selecciona una tabla para consultar campos, estados y alcance del esquema.</p></div><label class="df-selector">Recorrido<select id="dataflow-select">${list(data().flows).map(f=>`<option value="${esc(f.id)}" ${current()?.id===f.id?'selected':''}>${esc(f.id+' · '+f.title)}</option>`).join('')}</select></label><div id="dataflow-stage"></div></section>`;
  }
  function nodeModal(id) {
    const flow=current(),node=flow?.nodes?.[id];if(!node)return;
    const facts=[['Base / frontera',node.db],['Operación observada',node.operation],['Tabla y esquema: alcance de evidencia',node.schemaEvidence],['Campos y estados',node.stateFields]];
    bridge.openModal?.(node.title,`<span class="status-badge reported">${esc(node.evidence || 'Actual · alcance según fuente')}</span><p class="df-node-description">${esc(node.description)}</p><dl class="df-node-facts">${facts.filter(([,value])=>stringify(value)).map(([label,value])=>`<div><dt>${esc(label)}</dt><dd>${esc(stringify(value))}</dd></div>`).join('')}</dl>${sources(node.sources)}<p class="small-note">La ruta revisada no acredita el esquema físico, la configuración o el commit de producción salvo evidencia expresa. La ficha no consulta una base real.</p>`);
  }
  function render() {
    const flow=current();if(!$('#dataflow-stage')||!flow)return;
    state.flow=flow.id;state.step=Math.min(state.step,Math.max(0,list(flow.steps).length-1));
    const diagram=window.POS_DIAGRAMS?.[flow.key];
    $('#dataflow-stage').innerHTML=`<div class="df-flow-heading"><h3>${esc(flow.title)}</h3><p>${esc(flow.summary)}</p></div><div class="df-layout"><div class="df-map-card"><div class="df-map-toolbar"><div class="df-readwrite-legend"><span><b>LEE</b> consulta datos</span><span><b>ESCRIBE</b> modifica datos</span></div><div class="df-zoom" role="group" aria-label="Tamaño del recorrido"><button class="btn secondary small" data-df-zoom="step" aria-pressed="${state.zoom==='step'}">Seguir paso</button><button class="btn secondary small" data-df-zoom="fit" aria-pressed="${state.zoom==='fit'}">Ajustar</button><button class="btn secondary small" data-df-zoom="100" aria-pressed="${state.zoom===100}">100 %</button><button class="btn secondary small" data-df-source>Mermaid</button></div></div><div class="df-map-scroll" tabindex="0" role="region" aria-label="Recorrido ${esc(flow.title)}; diagrama desplazable"><div class="df-map-render" id="dataflow-map">${diagram?.svg || '<p>Diagrama pendiente de generar.</p>'}</div></div><p class="df-map-hint">Las piezas resaltadas participan en el paso. Las flechas explican la operación; las cajas delimitan bases o zonas. «Seguir paso» centra las piezas activas a tamaño legible. «Ajustar» muestra el conjunto; puedes desplazar el dibujo.</p><details class="df-node-list"><summary>Explorar las piezas sin recorrer el dibujo</summary><div class="tag-list">${Object.entries(flow.nodes || {}).map(([id,node])=>`<button class="tag" data-df-node="${esc(id)}">${esc(node.title)}</button>`).join('')}</div></details></div><section class="df-guide" aria-label="Pasos del recorrido"><div class="df-guide-top"><span class="eyebrow">PASO A PASO / MANUAL</span><button class="btn secondary small" data-df-action="reset">Reiniciar</button></div><div class="df-step-track" role="group" aria-label="Elegir paso del recorrido">${list(flow.steps).map((step,i)=>`<button data-df-step="${i}" aria-label="Paso ${i+1}: ${esc(step.title)}" aria-pressed="false">${i+1}</button>`).join('')}</div><div id="dataflow-story" class="df-story" aria-live="polite" aria-atomic="true"></div><div class="df-guide-actions"><button class="btn secondary" data-df-action="previous">← Anterior</button><button class="btn primary" data-df-action="next">Siguiente →</button></div><div id="dataflow-step-evidence"></div></section></div>${flow.caveat?`<div class="df-caveat"><strong>Límite del recorrido</strong><p>${esc(flow.caveat)}</p></div>`:''}<p class="df-document">${sourceLink({label:'Leer el recorrido completo y sus referencias',url:data().sourceDocument || '../docs/recorridos-datos-tablas.md'})}</p>`;
    const calls={D01:'sale',D02:'sync',D03:'masters',D04:'customer',D05:'credit'};
    $('#dataflow-stage').insertAdjacentHTML('beforeend',`<nav class="related-reading" aria-label="Otra pregunta sobre esta operación"><strong>¿Necesitas seguir las llamadas entre aplicaciones?</strong><a class="btn secondary small" href="#mapa?flujo=${calls[flow.id]}">Abrir este recorrido en la biblioteca de llamadas →</a></nav>`);
    prepareDiagram();updateStep();
  }
  function prepareDiagram() {
    const map=$('#dataflow-map'),svg=map?.querySelector('svg'),flow=current();if(!svg||!flow)return;
    const width=Number(svg.getAttribute('viewBox')?.split(/\s+/)[2]) || 900;
    const available=Math.max(240,map.parentElement.clientWidth-24);
    svg.setAttribute('style',`display:block;width:${state.zoom==='fit'?Math.min(width,available):width}px;max-width:none;height:auto;margin:0 auto;`);
    svg.setAttribute('role','group');svg.setAttribute('aria-label',flow.title);
    svg.querySelectorAll('g.node').forEach(node=>{
      const id=/^flowchart-(.+)-\d+$/.exec(node.id)?.[1],detail=flow.nodes?.[id];if(!detail)return;
      node.setAttribute('data-df-node',id);node.setAttribute('role','button');node.setAttribute('tabindex','0');node.setAttribute('aria-label','Ver detalle: '+detail.title);
      if(node.dataset.dfBound)return;node.dataset.dfBound='true';
      node.addEventListener('click',()=>nodeModal(id));
      node.addEventListener('keydown',event=>{if(event.key==='Enter'||event.key===' '){event.preventDefault();event.stopPropagation();nodeModal(id);}});
    });
    $$('[data-df-zoom]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.dfZoom===String(state.zoom))));
    if(state.zoom==='step') {
      const bounds=activeBounds();
      const scale=bounds?Math.max(.8,Math.min(1,(available-35)/bounds.width,500/bounds.height)):1;
      svg.style.width=Math.round(width*scale)+'px';
    }
    centerStep();
  }
  function activeBounds() {
    const ids=new Set(list(current()?.steps?.[state.step]?.nodes));
    const boxes=$$('#dataflow-map [data-df-node]').filter(node=>ids.has(node.dataset.dfNode)).map(node=>node.getBoundingClientRect());
    if(!boxes.length)return null;
    const left=Math.min(...boxes.map(b=>b.left)),top=Math.min(...boxes.map(b=>b.top));
    const right=Math.max(...boxes.map(b=>b.right)),bottom=Math.max(...boxes.map(b=>b.bottom));
    return {left,top,width:right-left,height:bottom-top};
  }
  function centerStep() {
    if(state.zoom==='fit')return;
    const bounds=activeBounds(),viewport=$('.df-map-scroll');
    if(bounds&&viewport){const area=viewport.getBoundingClientRect();viewport.scrollLeft+=bounds.left-area.left+bounds.width/2-viewport.clientWidth/2;viewport.scrollTop+=bounds.top-area.top+bounds.height/2-viewport.clientHeight/2;}

  }
  function updateStep() {
    const flow=current(),step=flow?.steps?.[state.step];if(!step||!$('#dataflow-story'))return;
    $('#dataflow-story').innerHTML=`<span class="df-step-number">${String(state.step+1).padStart(2,'0')} / ${String(flow.steps.length).padStart(2,'0')}</span><h4 id="dataflow-step-title">${esc(step.title)}</h4><p>${esc(step.text)}</p>${step.endpoint?`<div class="df-step-endpoint"><span>RUTA / LLAMADA OBSERVADA</span><code>${esc(stringify(step.endpoint))}</code></div>`:''}`;
    $('#dataflow-step-evidence').innerHTML=list(step.sources).length?`<details class="df-step-sources"><summary>Evidencia de este paso</summary>${sources(step.sources)}</details>`:'';
    $$('[data-df-step]').forEach(button=>button.setAttribute('aria-pressed',String(Number(button.dataset.dfStep)===state.step)));
    $('[data-df-action="previous"]').disabled=state.step===0;
    $('[data-df-action="next"]').disabled=state.step===flow.steps.length-1;
    const active=new Set(list(step.nodes));
    $$('#dataflow-map [data-df-node]').forEach(node=>{node.classList.toggle('df-active',active.has(node.dataset.dfNode));node.classList.toggle('df-inactive',active.size>0&&!active.has(node.dataset.dfNode));});
    if(state.zoom==='step')prepareDiagram();else centerStep();
  }
  document.addEventListener('change',event=>{if(event.target.id==='dataflow-select'){state.flow=event.target.value;state.step=0;state.zoom='step';render();}});
  document.addEventListener('click',event=>{
    const button=event.target.closest('button');if(!button)return;
    if(button.dataset.dfAction){const flow=current();if(!flow)return;state.step=button.dataset.dfAction==='reset'?0:Math.min(flow.steps.length-1,Math.max(0,state.step+(button.dataset.dfAction==='next'?1:-1)));updateStep();}
    else if(button.hasAttribute('data-df-step')){state.step=Number(button.dataset.dfStep);updateStep();}
    else if(button.dataset.dfZoom){state.zoom=['fit','step'].includes(button.dataset.dfZoom)?button.dataset.dfZoom:100;prepareDiagram();}
    else if(button.dataset.dfNode)nodeModal(button.dataset.dfNode);
    else if(button.hasAttribute('data-df-source')){const diagram=window.POS_DIAGRAMS?.[current()?.key];if(diagram)bridge.openModal?.('Mermaid · '+current().id,`<p>Fuente local del recorrido actual. No ejecuta transacciones ni acredita producción.</p><pre class="source-code"><code>${esc(diagram.source)}</code></pre>`);}
  });
  window.POS_DATAFLOWS_UI={html,mount(context){bridge=context || {};render();}};
})();
