/* C4 explorer. Uses pre-rendered local SVGs; no Mermaid runtime or network dependency. */
(() => {
  'use strict';
  const esc = value => String(value ?? '').replace(/[&<>"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[character]));
  const model = () => window.POS_C4;
  const state = { view: 'containers', selected: 'branchApi', zoom: 1 };
  const initialNodes = { context: 'pos', containers: 'branchApi', backend: 'sales', sync: 'schedule', deployment: 'branchApi' };
  let root, bridge = {}, controller, observer, drag;
  let pendingCenter = false;
  const view = () => model()?.views.find(item => item.id === state.view) || model()?.views[0];
  const query = selector => root?.querySelector(selector);
  const links = items => `<ul class="source-list">${items.map(item => `<li><a href="${esc(item.url)}" target="_blank" rel="noopener">${esc(item.label)}</a></li>`).join('')}</ul>`;

  function html() {
    if (!model()) return '<p>El modelo C4 no está disponible. Consulta la guía de arquitectura.</p>';
    return `<section class="c4-explorer" id="c4-explorer" aria-labelledby="c4-heading">
      <div class="c4-heading"><div><span class="status-badge proposed">Arquitectura propuesta</span><h2 id="c4-heading">La arquitectura, por nivel de detalle</h2><p>Explora el alcance, los procesos y los datos. Selecciona un bloque para consultar su responsabilidad y sus límites.</p></div></div>
      <div class="c4-toolbar"><label for="c4-view-select">Vista C4<select id="c4-view-select">${model().views.map(item => `<option value="${esc(item.id)}" ${item.id === state.view ? 'selected' : ''}>${esc(item.level + ' · ' + item.title)}</option>`).join('')}</select></label><div class="c4-zoom-controls" role="group" aria-label="Escala del diagrama"><button type="button" class="btn secondary small" data-c4-action="out" aria-label="Alejar diagrama">−</button><output id="c4-zoom-label" aria-live="polite">100 %</output><button type="button" class="btn secondary small" data-c4-action="in" aria-label="Acercar diagrama">+</button><button type="button" class="btn secondary small" data-c4-action="actual">100 %</button><button type="button" class="btn secondary small" data-c4-action="fit">Ajustar</button></div></div>
      <div id="c4-view-heading" class="c4-view-heading"></div>
      <div class="c4-workspace"><div class="c4-map-column"><div class="c4-map-help"><span id="c4-pan-help">Desplaza el mapa con las barras, arrastrando el fondo o con las flechas al darle foco.</span><button type="button" class="btn secondary small" data-c4-action="center">Centrar selección</button></div><div id="c4-viewport" class="c4-viewport" tabindex="0" role="region" aria-label="Mapa C4 desplazable" aria-describedby="c4-pan-help"><div id="c4-canvas" class="c4-canvas"></div></div><div class="c4-pan-controls" role="group" aria-label="Desplazar el diagrama"><button type="button" class="btn secondary small" data-c4-pan="left" aria-label="Desplazar a la izquierda">←</button><button type="button" class="btn secondary small" data-c4-pan="up" aria-label="Desplazar hacia arriba">↑</button><button type="button" class="btn secondary small" data-c4-pan="down" aria-label="Desplazar hacia abajo">↓</button><button type="button" class="btn secondary small" data-c4-pan="right" aria-label="Desplazar a la derecha">→</button><span class="small-note">Escala real para leer; Ajustar para ver el conjunto.</span></div></div><aside class="c4-detail" id="c4-detail" aria-labelledby="c4-detail-heading"></aside></div>
      <div class="c4-legend" aria-label="Leyenda del modelo"><h3>Cómo leer estas vistas</h3><ul>${model().legend.map(item => `<li>${esc(item)}</li>`).join('')}</ul></div>
      <details class="c4-alternative"><summary>Consultar elementos y relaciones sin recorrer el mapa</summary><div id="c4-alternative-body"></div></details>
      <p class="c4-reference"><a href="../docs/c4-arquitectura-propuesta.md" target="_blank" rel="noopener">Guía C4, decisiones y fuentes</a></p>
      <p class="c4-reference"><a href="../docs/diagramas-excalidraw/index.html" target="_blank" rel="noopener">Diagramas editables en Excalidraw: siete vistas y atlas completo</a></p>
      <p class="sr-only" id="c4-announcement" role="status" aria-live="polite"></p>
    </section>`;
  }

  function detailHTML(node) {
    return `<span class="c4-element-kind">${esc(node.type)}</span><h3 id="c4-detail-heading">${esc(node.name)}</h3><p class="c4-technology">${esc(node.technology)}</p><p>${esc(node.summary)}</p><dl><div><dt>Responsabilidad y contrato</dt><dd>${esc(node.detail)}</dd></div><div><dt>Propiedad de datos</dt><dd>${esc(node.ownership)}</dd></div><div><dt>Sin conexión o ante fallos</dt><dd>${esc(node.offline)}</dd></div></dl><h4>Fundamento y alcance</h4>${links(node.sources)}`;
  }

  function showDetail(id, announce = true) {
    const node = model()?.nodes[id];
    if (!node || id === 'legend' || !view().nodeIds.includes(id)) return;
    state.selected = id;
    query('#c4-detail').innerHTML = detailHTML(node) + (typeof bridge.openModal === 'function' ? '<button type="button" class="btn secondary" data-c4-action="detail">Ampliar ficha</button>' : '');
    root.querySelectorAll('[data-c4-node]').forEach(element => {
      const selected = element.dataset.c4Node === id;
      element.setAttribute('aria-pressed', String(selected));
      element.classList.toggle('c4-selected', selected);
    });
    if (announce) query('#c4-announcement').textContent = `Ficha seleccionada: ${node.name}. ${node.summary}`;
  }

  function renderView() {
    const selectedView = view();
    if (!root || !selectedView) return;
    if (!selectedView.nodeIds.includes(state.selected)) state.selected = initialNodes[selectedView.id] || selectedView.nodeIds.find(id => id !== 'legend');
    query('#c4-view-heading').innerHTML = `<h3>${esc(selectedView.level + ' · ' + selectedView.title)}</h3><p>${esc(selectedView.scope)}</p><p class="c4-scope-note">${esc(selectedView.note)}</p>`;
    query('#c4-viewport').setAttribute('aria-label', `${selectedView.level}: ${selectedView.title}. Mapa desplazable.`);
    query('#c4-canvas').innerHTML = window.POS_DIAGRAMS?.[selectedView.key]?.svg || '<p class="c4-unavailable">El SVG de esta vista está pendiente de generar. Los elementos, relaciones y fichas están disponibles debajo.</p>';
    const svg = query('#c4-canvas svg');
    if (svg) {
      svg.setAttribute('role', 'group');
      svg.setAttribute('aria-label', `${selectedView.level}: ${selectedView.title}`);
      svg.querySelectorAll('g.node').forEach(element => {
        const id = element.dataset.node || /^flowchart-(.+)-\d+$/.exec(element.id)?.[1];
        element.removeAttribute('data-node');
        if (id === 'legend' || !selectedView.nodeIds.includes(id)) {
          element.removeAttribute('tabindex');
          element.removeAttribute('role');
          element.removeAttribute('aria-label');
          return;
        }
        element.dataset.c4Node = id;
        // Keep Mermaid's base colors while allowing interactive focus/selection.
        element.querySelectorAll('rect,polygon,path,circle,ellipse').forEach(shape => {
          for (const property of ['stroke', 'stroke-width']) {
            const value = shape.style.getPropertyValue(property);
            if (value) shape.style.setProperty(property, value);
          }
        });
        element.setAttribute('tabindex', '0');
        element.setAttribute('role', 'button');
        element.setAttribute('aria-label', `Consultar ${model().nodes[id].name}: ${model().nodes[id].summary}`);
      });
    }
    query('#c4-alternative-body').innerHTML = `<h4>Elementos de esta vista</h4><div class="c4-element-list">${selectedView.nodeIds.filter(id => id !== 'legend').map(id => { const node = model().nodes[id]; return `<button type="button" class="c4-element-button" data-c4-node="${esc(id)}"><strong>${esc(node.name)}</strong><span>${esc(node.type)} · ${esc(node.technology)}</span></button>`; }).join('')}</div><h4>Relaciones dirigidas</h4><ol class="c4-relationship-list">${selectedView.relationships.map(item => `<li><strong>${esc(model().nodes[item.from].name)}</strong> → <strong>${esc(model().nodes[item.to].name)}</strong><span>${esc(item.label)}</span></li>`).join('')}</ol>`;
    showDetail(state.selected, false);
    query('#c4-viewport').scrollTo({ top: 0, left: 0 });
    // A chapter may mount while hidden. Defer this one-time placement until
    // ResizeObserver sees its viewport; later resize/zoom keeps the user's pan.
    pendingCenter = true;
    scale();
  }

  function scale() {
    const svg = query('#c4-canvas svg'), viewport = query('#c4-viewport');
    if (!svg || !viewport?.clientWidth || !viewport.getClientRects().length) return;
    const dimensions = svg.getAttribute('viewBox')?.split(/\s+/).map(Number);
    if (!dimensions?.[2] || !dimensions[3]) return;
    const zoom = state.zoom === 'fit' ? Math.min((viewport.clientWidth - 40) / dimensions[2], (viewport.clientHeight - 40) / dimensions[3], 1) : state.zoom;
    svg.style.cssText = `display:block;width:${Math.round(dimensions[2] * zoom)}px;max-width:none;height:${Math.round(dimensions[3] * zoom)}px;margin:0;`;
    query('#c4-zoom-label').textContent = `${Math.round(zoom * 100)} %${state.zoom === 'fit' ? ' · ajustado' : ''}`;
    query('[data-c4-action="out"]').disabled = state.zoom !== 'fit' && state.zoom <= 0.35;
    query('[data-c4-action="in"]').disabled = state.zoom !== 'fit' && state.zoom >= 1.75;
    query('[data-c4-action="fit"]').setAttribute('aria-pressed', String(state.zoom === 'fit'));
    query('[data-c4-action="actual"]').setAttribute('aria-pressed', String(state.zoom === 1));
    if (pendingCenter) {
      pendingCenter = false;
      centerSelection();
    }
  }

  function changeZoom(action) {
    const viewport = query('#c4-viewport');
    if (!viewport) return;
    const oldWidth = query('#c4-canvas svg')?.getBoundingClientRect().width || 1;
    const center = [(viewport.scrollLeft + viewport.clientWidth / 2) / oldWidth, (viewport.scrollTop + viewport.clientHeight / 2) / oldWidth];
    if (action === 'fit') state.zoom = 'fit';
    else if (action === 'actual') state.zoom = 1;
    else state.zoom = Math.max(0.35, Math.min(1.75, (state.zoom === 'fit' ? 0.75 : state.zoom) + (action === 'in' ? 0.15 : -0.15)));
    scale();
    const width = query('#c4-canvas svg')?.getBoundingClientRect().width || 1;
    viewport.scrollTo({ left: Math.max(0, center[0] * width - viewport.clientWidth / 2), top: Math.max(0, center[1] * width - viewport.clientHeight / 2) });
  }

  function centerSelection() {
    const viewport = query('#c4-viewport');
    const element = query(`#c4-canvas [data-c4-node="${state.selected}"]`);
    if (!viewport || !element) return;
    const box = element.getBoundingClientRect(), frame = viewport.getBoundingClientRect();
    viewport.scrollBy({ left: box.left - frame.left + box.width / 2 - viewport.clientWidth / 2, top: box.top - frame.top + box.height / 2 - viewport.clientHeight / 2 });
  }

  function pan(direction) {
    query('#c4-viewport')?.scrollBy({ left: direction === 'left' ? -180 : direction === 'right' ? 180 : 0, top: direction === 'up' ? -180 : direction === 'down' ? 180 : 0 });
  }

  function destroy() {
    controller?.abort();
    observer?.disconnect();
    controller = undefined;
    observer = undefined;
    root = undefined;
    drag = undefined;
    pendingCenter = false;
  }

  function mount(options = {}) {
    destroy();
    root = document.getElementById('c4-explorer');
    if (!root || !model()) return;
    bridge = options;
    controller = new AbortController();
    const eventOptions = { signal: controller.signal };
    root.addEventListener('click', event => {
      const element = event.target.closest('[data-c4-node],[data-c4-action],[data-c4-pan]');
      if (!element || !root.contains(element)) return;
      if (element.dataset.c4Node) showDetail(element.dataset.c4Node);
      else if (element.dataset.c4Pan) pan(element.dataset.c4Pan);
      else if (element.dataset.c4Action === 'center') centerSelection();
      else if (element.dataset.c4Action === 'detail') {
        const node = model().nodes[state.selected];
        // IDs belong to the in-page region; do not duplicate them in the modal.
        bridge.openModal?.(node.name, detailHTML(node).replace(' id="c4-detail-heading"', ''));
      } else changeZoom(element.dataset.c4Action);
    }, eventOptions);
    query('#c4-view-select').addEventListener('change', event => {
      state.view = event.target.value;
      state.zoom = 1;
      renderView();
      query('#c4-announcement').textContent = `Vista seleccionada: ${view().level}. ${view().title}.`;
    }, eventOptions);
    root.addEventListener('keydown', event => {
      const node = event.target.closest('[data-c4-node]');
      if (node && (event.key === 'Enter' || event.key === ' ') && node.tagName.toLowerCase() !== 'button') {
        event.preventDefault(); event.stopPropagation(); showDetail(node.dataset.c4Node); return;
      }
      if (!event.target.closest('#c4-viewport')) return;
      const direction = { ArrowLeft: 'left', ArrowRight: 'right', ArrowUp: 'up', ArrowDown: 'down' }[event.key];
      if (direction) { event.preventDefault(); event.stopPropagation(); pan(direction); }
      else if (event.key === '+' || event.key === '-') { event.preventDefault(); event.stopPropagation(); changeZoom(event.key === '+' ? 'in' : 'out'); }
    }, eventOptions);
    const viewport = query('#c4-viewport');
    viewport.addEventListener('pointerdown', event => {
      if (event.pointerType !== 'mouse' || event.button !== 0 || event.target.closest('[data-c4-node]')) return;
      drag = { x: event.clientX, y: event.clientY, left: viewport.scrollLeft, top: viewport.scrollTop };
      viewport.setPointerCapture(event.pointerId);
      viewport.classList.add('c4-dragging');
      event.preventDefault();
    }, eventOptions);
    viewport.addEventListener('pointermove', event => {
      if (!drag) return;
      viewport.scrollLeft = drag.left + drag.x - event.clientX;
      viewport.scrollTop = drag.top + drag.y - event.clientY;
    }, eventOptions);
    const endDrag = () => { drag = undefined; viewport.classList.remove('c4-dragging'); };
    viewport.addEventListener('pointerup', endDrag, eventOptions);
    viewport.addEventListener('pointercancel', endDrag, eventOptions);
    viewport.addEventListener('lostpointercapture', endDrag, eventOptions);
    renderView();
    observer = new ResizeObserver(() => scale());
    observer.observe(viewport);
  }

  window.POS_C4_UI = { html, mount, destroy, refresh: scale };
})();
