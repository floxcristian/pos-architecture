/* Comparison of reviewed operational paths and proposed contracts. Static only. */
(() => {
  'use strict';
  const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const $ = s => document.querySelector(s);
  const data = () => window.POS_OPERATIONS || {cases:[]};
  const state = {chapter:null,selected:{},mode:'current',zoom:'fit',challenge:false};
  let bridge = {};
  const cases = () => data().cases.filter(c => c.chapter === state.chapter);
  const current = () => cases().find(c => c.id === state.selected[state.chapter]) || cases()[0];
  const sourceHTML = sources => `<ul class="source-list">${sources.map(s => `<li><a href="${esc(s.url)}" target="_blank" rel="noopener">${esc(s.label)} ↗</a></li>`).join('')}</ul>`;
  function conceptsHTML() {
    return '<div class="ops-concepts"><h3>Operaciones distintas</h3><p>Una venta, una cobranza, una NC y una devolución pueden mover dinero por caminos diferentes.</p><div class="tag-list">'+(data().concepts||[]).map(c=>'<button class="btn secondary small" data-ops-concept="'+esc(c.id)+'">'+esc(c.title)+'</button>').join('')+'</div></div>';
  }
  function html(chapter) {
    const available=data().cases.filter(c=>c.chapter===chapter);if(!available.length)return '';
    const titles={venta:'Apertura, cierre e impresión',propuesta:'Precios y ofertas durante una desconexión',evolucion:'Una versión nueva en una sucursal'};
    return `<section class="ops-module" aria-labelledby="ops-heading"><div class="section-heading"><span class="eyebrow">OPERACIÓN / ACTUAL Y PROPUESTA</span><h2 id="ops-heading">${titles[chapter]}</h2><p>Compara el recorrido observado con el contrato que necesita el POS corporativo. Cada caso conserva sus fuentes y una excepción para discutir.</p></div><details id="ops-explorer"><summary>Explorar ${available.length===1?'el caso operativo':'los '+available.length+' casos operativos'}</summary><div class="ops-content">${chapter==='venta'?conceptsHTML():''}<label class="ops-selector">Caso<select id="ops-select">${available.map(c=>`<option value="${esc(c.id)}">${esc(c.id+' · '+c.title)}</option>`).join('')}</select></label><div class="ops-modes" role="group" aria-label="Comparar arquitectura actual y propuesta"><button class="btn secondary" data-ops-mode="current">Código actual</button><button class="btn secondary" data-ops-mode="proposed">Contrato propuesto</button></div><div id="ops-case"></div></div></details></section>`;
  }
  function render() {
    const c=current();if(!c||!$('#ops-case'))return;
    const view=c[state.mode];state.selected[state.chapter]=c.id;$('#ops-select').value=c.id;
    document.querySelectorAll('[data-ops-mode]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.opsMode===state.mode)));
    $('#ops-case').innerHTML=`<div class="ops-case-intro"><span class="status-badge ${state.mode==='current'?'code':'proposed'}">${state.mode==='current'?'Operación actual':'Propuesta'}</span><h3>${esc(c.title)}</h3><p>${esc(view.summary)}</p></div><div class="ops-layout"><div class="ops-map-card"><div class="ops-map-toolbar"><span>${esc(c.id)} / ${state.mode==='current'?'Actual':'Propuesto'}</span><div class="tag-list"><button class="btn secondary small" data-ops-zoom="fit">Ajustar</button><button class="btn secondary small" data-ops-zoom="100">100 %</button></div></div><div class="ops-map-scroll" tabindex="0" role="region" aria-label="Diagrama de ${esc(c.title)}; usa las flechas para desplazar"><div id="ops-diagram">${window.POS_DIAGRAMS?.[view.diagram]?.svg || '<p>Diagrama pendiente.</p>'}</div></div><p class="ops-map-hint">Desplaza el diagrama para ver el recorrido completo. Usa 100 % para ampliar sus etiquetas.</p></div><div class="ops-reading"><h4>Qué ocurre en este recorrido</h4><ol>${view.steps.map(s=>`<li>${esc(s)}</li>`).join('')}</ol><p class="ops-boundary"><strong>Frontera que importa</strong>${esc(view.boundary)}</p></div></div><div class="ops-challenge"><div><span class="eyebrow">EXCEPCIÓN PARA DISCUTIR</span><h4>${esc(c.challenge.question)}</h4></div><button class="btn secondary" data-ops-challenge aria-expanded="${state.challenge}">${state.challenge?'Ocultar explicación':'Ver qué cambia'}</button><div id="ops-challenge-answer" ${state.challenge?'':'hidden'} aria-live="polite"><p><strong>${state.mode==='current'?'En el recorrido actual':'En el contrato propuesto'}:</strong> ${esc(c.challenge[state.mode])}</p><p><strong>Prueba pendiente:</strong> ${esc(c.challenge.test)}</p></div></div><details class="ops-evidence"><summary>Fuentes y alcance de este caso</summary><p>${esc(c.evidenceNote)}</p>${sourceHTML(c.sources)}<a href="../docs/operacion-caja-y-evolucion.md" target="_blank" rel="noopener">Leer el análisis y los diagramas completos ↗</a></details>`;
    resize();
  }
  function resize() {
    const box=$('#ops-diagram'),svg=box?.querySelector('svg');if(!svg||box.closest('[hidden]')||!box.getClientRects().length)return;
    const viewportWidth=box.parentElement.clientWidth;if(!viewportWidth)return;
    const width=Number(svg.getAttribute('viewBox')?.split(/\s+/)[2])||800;
    svg.setAttribute('style',`display:block;width:${state.zoom==='fit'?Math.min(width,Math.max(240,viewportWidth-24)):width}px;max-width:none;height:auto;margin:0 auto;`);
    svg.setAttribute('role','img');svg.setAttribute('aria-label',current().title+' · '+(state.mode==='current'?'actual':'propuesto'));
    document.querySelectorAll('[data-ops-zoom]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.opsZoom===String(state.zoom))));
  }
  document.addEventListener('change',e=>{if(e.target.id==='ops-select'){state.selected[state.chapter]=e.target.value;state.challenge=false;state.zoom='fit';render();}});
  document.addEventListener('click',e=>{
    const b=e.target.closest('button');if(!b)return;
    if(b.dataset.opsConcept){const c=data().concepts.find(c=>c.id===b.dataset.opsConcept);if(c)bridge.openModal?.(c.title,'<p>'+esc(c.text)+'</p><div class="notice"><strong>Límite del recorrido</strong><p>'+esc(c.boundary)+'</p></div>'+sourceHTML(c.sources));}
    else if(b.dataset.opsMode){state.mode=b.dataset.opsMode;state.zoom='fit';render();}
    else if(b.dataset.opsZoom){state.zoom=b.dataset.opsZoom==='fit'?'fit':100;resize();}
    else if(b.hasAttribute('data-ops-challenge')){state.challenge=!state.challenge;$('#ops-challenge-answer').hidden=!state.challenge;b.setAttribute('aria-expanded',String(state.challenge));b.textContent=state.challenge?'Ocultar explicación':'Ver qué cambia';}
  });
  document.addEventListener('toggle',e=>{if(e.target.id==='ops-explorer'&&e.target.open)resize();},true);
  window.addEventListener('resize',resize);
  window.POS_OPERATIONS_UI={html,refresh:resize,mount(chapter,context){state.chapter=chapter;state.mode='current';state.challenge=false;state.zoom='fit';bridge=context||{};render();}};
})();
