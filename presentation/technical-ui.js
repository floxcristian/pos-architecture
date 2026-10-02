/* Optional technical exploration. Reads local evidence; never calls an endpoint. */
(() => {
  'use strict';
  const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const $ = selector => document.querySelector(selector);
  const $$ = selector => [...document.querySelectorAll(selector)];
  const data = () => window.POS_TECHNICAL || {components:[],endpoints:[],groups:[],gaps:[],scopeNote:'Catálogo técnico pendiente de cargar.'};
  const list = value => Array.isArray(value) ? value : [];
  const text = value => typeof value === 'string' ? value : Array.isArray(value) ? value.map(text).join(' · ') : value && typeof value === 'object' ? (value.label || value.name || value.note || JSON.stringify(value)) : value == null ? 'Por confirmar' : String(value);
  const link = s => /^(\.\.\/docs\/|https:\/\/github\.com\/)/.test(s?.url || '') ? `<a href="${esc(s.url)}" target="_blank" rel="noopener">${esc(s.label || 'Ver evidencia')} ↗</a>` : esc(s?.label || 'Fuente por confirmar');
  const sources = items => `<ul class="source-list tech-sources">${list(items).map(s=>`<li>${link(s)}</li>`).join('')}</ul>`;
  const zones = {terminal:'Puesto / PC',branch:'Sucursal',central:'Central lógico',external:'Sistema externo',unknown:'Ubicación sin confirmar'};
  const state = {view:'endpoints',query:'',group:'all',app:'all',limit:6,zoom:'fit',edge:'wan'};
  let bridge = {};
  const views = [['endpoints','Rutas'],['deployment','Despliegue'],['coverage','Fuentes y pendientes']];
  const deployment = {id:'V01',key:'technical-deployment',title:'Despliegue lógico actual',status:'Actual · evidencia mixta',description:'Aplicaciones y repositorios agrupados por puesto de caja, sucursal e integración central.'};
  const edgeCases = [
    {id:'wan',name:'WAN o precios caídos',trigger:'No se puede consultar el precio remoto al preparar el pago.',today:'En la ruta revisada, una falla remota de precios puede bloquear el pago. Tener PostgreSQL local no acredita autonomía de esa operación.',evidence:'Código revisado',status:'Operación permitida o restringida según datos, vigencia y política.',action:'Usar reglas locales autorizadas cuando existan; explicar qué capacidad falta. No inventar precio, crédito ni autorización fiscal.',source:'../docs/analisis-repositorios/mountain-implementos.md'},
    {id:'lan',name:'LAN o escritor caído',trigger:'La caja no puede comunicarse con el servidor de sucursal.',today:'La arquitectura usa servicios y persistencia de sucursal; no se ha acreditado autonomía del puesto ni failover productivo.',evidence:'Límite por confirmar',status:'Nuevos comandos que requieren ese escritor detenidos.',action:'Recuperar el escritor autorizado. No crear otra base o autoridad implícita en el PC; autonomía por terminal es otro diseño.',source:'../docs/propuesta-arquitectura.md'},
    {id:'ack',name:'Respuesta perdida y reenvío',trigger:'El receptor guardó un evento, pero su acuse no llegó al emisor.',today:'La sincronización tiene estados y reintentos. El análisis no demuestra unicidad de efectos externos de extremo a extremo.',evidence:'Garantía no acreditada',status:'Entrega pendiente con identidad original; efecto local reconocido si ya existe.',action:'Reenviar la misma identidad y registrar inbox + efecto local atómicamente. Consultar o conciliar ERP por su contrato: no confundir ACK con contabilización.',source:'../docs/revision-resiliencia-datos-pos.md'},
    {id:'payment',name:'Pago o DTE incierto',trigger:'El proveedor pudo aplicar el efecto antes de un timeout.',today:'Los repositorios no demuestran una capacidad universal de consulta, idempotencia o recuperación para todos los proveedores.',evidence:'Contrato por confirmar',status:'Resultado desconocido; proveedor y referencias originales conservados.',action:'Consultar solo si existe capacidad fiable; de lo contrario, resolución operativa. No cambiar proveedor ni generar otra identidad para repetir el efecto.',source:'../docs/extensibilidad-proveedores-dispositivos.md'},
    {id:'schedule',name:'Fin de ventana de sincronización y mantenimiento',trigger:'Un job está en curso cuando cierra la ventana de sincronización.',today:'El equipo informa L–V 07–22 y sábado 07–16. El cron revisado y otras entradas tienen diferencias; producción requiere contraste.',evidence:'Relato + discrepancia de código',status:'Admisión cerrada, drenaje o checkpoint; efectos inciertos conservados.',action:'Definir calendario por flujo y zona IANA, acotar trabajo en curso y reabrir con límites y jitter. El reloj no convierte una llamada incierta en fallida.',source:'../docs/revision-resiliencia-datos-pos.md'},
    {id:'restore',name:'Restauración de la central',trigger:'Un restore retrocede tanto negocio como registros de deduplicación.',today:'No se aportó un ensayo de restauración que demuestre reconciliación ni objetivos RPO/RTO del POS.',evidence:'Evidencia pendiente',status:'Recuperación con identidades y resultados por reconstruir.',action:'Conservar registros según el horizonte de restore, reconstruir y conciliar, y excluir escritores antiguos. Retener la inbox en la misma base no cubre su retroceso.',source:'../docs/revision-resiliencia-datos-pos.md'},
    {id:'credit',name:'Misma NC en dos cajas',trigger:'Dos puestos o sucursales intentan consumir el mismo saldo de una nota de crédito.',today:'Mongo participa en estados de NC; el código revisado no acredita un protocolo que autorice gasto concurrente offline de ese saldo.',evidence:'Garantía por verificar',status:'Reserva/consumo con autoridad y transición atómica.',action:'Preservar identidad, importe, moneda y propietario. Sin autoridad disponible, exigir asignación exclusiva previa o restricción explícita; no liberar por un timeout incierto.',source:'../docs/revision-resiliencia-datos-pos.md'},
    {id:'cutover',name:'Venta tardía tras corte ERP',trigger:'Una tienda entrega después del corte una operación creada bajo la política anterior.',today:'Chile usa AX y la migración futura aún no tiene producto o calendario aprobados.',evidence:'Contexto informado',status:'Destino, versión y referencias originales preservados.',action:'Clasificar pendientes y conservar consultas históricas. La hora de llegada no decide el ERP; un resultado incierto no se reenvía al nuevo destino. Véase V06 en las vistas documentadas.',source:'../docs/vistas-arquitectura-y-flujos.md'}
  ];
  function component(id) { return list(data().components).find(c=>c.id===id); }
  function componentName(id) { return component(id)?.name || id || 'Destino por confirmar'; }
  function badge(label, proposed=false) { return `<span class="status-badge ${proposed?'proposed':'pending'}">${esc(label || 'Por confirmar')}</span>`; }
  function componentRows(c) {
    const rows = [['Repositorio',c.repo],['Tecnología',c.runtime],['Ubicación',c.location || zones[c.zone] || c.zone || 'Por confirmar']];
    return `<dl class="tech-component-facts">${rows.filter(([,value])=>value).map(([label,value])=>`<div><dt>${label}</dt><dd>${esc(text(value))}</dd></div>`).join('')}</dl>`;
  }
  function componentDetail(c) {
    return `${badge(text(c.confidence))}<p class="tech-detail-intro">${esc(c.responsibility)}</p>${componentRows(c)}${c.locationEvidence?`<h3>Sobre su ubicación</h3><p>${esc(text(c.locationEvidence))}</p>`:''}${c.pending?`<h3>Qué falta confirmar</h3><p>${esc(text(c.pending))}</p>`:''}${sources(c.sources)}`;
  }
  function componentEvidenceHTML(currentId, additionalSources=[]) {
    const matches=list(data().components).filter(c=>(c.currentId||c.id)===currentId);
    if(!matches.length)return '';
    const seen = new Set(matches.flatMap(c=>list(c.sources).map(s=>s.url)));
    const extraSources = list(additionalSources).filter(s=>{if(seen.has(s.url))return false;seen.add(s.url);return true;});
    return `<details class="technical-evidence"><summary>Detalles técnicos</summary>${matches.map(c=>`<div class="tech-inline-component">${matches.length>1?`<strong>${esc(c.name)}</strong>`:''}${componentRows(c)}${c.locationEvidence?`<p>${esc(text(c.locationEvidence))}</p>`:''}${c.pending?`<p class="small-note"><b>Por confirmar:</b> ${esc(text(c.pending))}</p>`:''}${sources(c.sources)}</div>`).join('')}${extraSources.length?sources(extraSources):''}</details>`;
  }
  function explorerHTML() {
    return `<section class="technical-explorer" aria-label="Evidencia del sistema actual"><div class="tech-view-switch" role="group" aria-label="Vista de la evidencia">${views.map(([id,title])=>`<button data-tech-view="${id}" aria-controls="tech-view" aria-pressed="${state.view===id}">${title}</button>`).join('')}</div><div id="tech-view" class="tech-view" role="region" aria-label="Contenido de la evidencia"></div></section>`;
  }
  function endpointsPanel() {
    return `<div class="tech-view-heading"><h3>Rutas observadas, con procedencia</h3><p>Este catálogo selecciona integraciones relevantes; no es un OpenAPI completo. Buscar o pulsar una ruta no realiza solicitudes a la empresa.</p><a class="btn secondary small" href="#datos">Seguir tablas de una operación →</a></div><div class="tech-evidence-legend"><span><strong>Ruta declarada:</strong> entrada definida por un receptor.</span><span><strong>Llamada encontrada:</strong> uso observado en un consumidor; destino efectivo por comprobar.</span></div><div class="tech-endpoint-filters"><label>Buscar ruta, propósito o repo<input id="tech-query" type="search" value="${esc(state.query)}" placeholder="Por ejemplo: cliente, venta o GET" autocomplete="off"></label><label>Flujo<select id="tech-group"><option value="all">Todos los flujos</option>${list(data().groups).map(g=>`<option value="${esc(g.id)}" ${state.group===g.id?'selected':''}>${esc(g.title)}</option>`).join('')}</select></label><label>Aplicación<select id="tech-app"><option value="all">Todas las aplicaciones</option>${list(data().components).map(c=>`<option value="${esc(c.id)}" ${state.app===c.id?'selected':''}>${esc(c.name)}</option>`).join('')}</select></label></div><div class="tech-results-bar"><span id="tech-result-count" role="status"></span><button class="btn secondary small" data-tech-reset>Limpiar filtros</button></div><div id="tech-endpoint-results"></div><div id="tech-pagination"></div>`;
  }
  function renderEndpoints() {
    if(!$('#tech-endpoint-results'))return;
    const q=state.query.trim().toLocaleLowerCase('es');
    const matches=list(data().endpoints).filter(e=>(state.group==='all'||e.group===state.group)&&(state.app==='all'||e.from===state.app||e.to===state.app)&&(!q||[e.method,e.path,e.purpose,text(e.repo),componentName(e.from),componentName(e.to)].join(' ').toLocaleLowerCase('es').includes(q)));
    $('#tech-result-count').textContent=`${matches.length} rutas encontradas · ${Math.min(state.limit,matches.length)} visibles`;
    $('#tech-endpoint-results').innerHTML=matches.length?matches.slice(0,state.limit).map(e=>`<article class="tech-endpoint" data-endpoint-id="${esc(e.id)}"><div class="tech-endpoint-title"><span class="http-method">${esc(e.method || 'Por verificar')}</span><code>${esc(e.path)}</code><span class="tech-route-kind">${e.evidenceType==='route'?'Ruta declarada':e.evidenceType==='call'?'Llamada encontrada':esc(e.evidenceType || 'Evidencia parcial')}</span></div><p>${esc(e.purpose)}</p><div class="tech-route-meta"><span>${esc(componentName(e.from))} → ${esc(componentName(e.to))}</span><span>Repo: ${esc(text(e.repo))}</span></div><details><summary>Ejecución, offline, fallos y fuente</summary><dl class="tech-endpoint-facts"><div><dt>Alcance de evidencia</dt><dd>${esc(e.confidence||"Código observado; contrato productivo por confirmar.")}</dd></div><div><dt>Ejecución observada</dt><dd>${esc(text(e.execution))}</dd></div><div><dt>Si no hay conexión</dt><dd>${esc(text(e.offline))}</dd></div><div><dt>Fallo o incertidumbre</dt><dd>${esc(text(e.failure))}</dd></div><div><dt>Commit auditado</dt><dd><code>${esc(e.commit || 'Por confirmar')}</code></dd></div></dl>${sources(e.sources)}</details></article>`).join(''):'<div class="tech-empty"><strong>No hay rutas con esos filtros.</strong><p>Prueba otro término o limpia los filtros.</p></div>';
    $('#tech-pagination').innerHTML=matches.length>state.limit?`<button class="btn secondary" data-tech-more>Mostrar ${Math.min(6,matches.length-state.limit)} rutas más</button>`:'';
  }
  function diagramPanel() {
    return `<div id="tech-diagram-body">${diagramBody(deployment)}</div>`;
  }
  function diagramBody(d) {
    const diagram=window.POS_DIAGRAMS?.[d.key];
    return `<div class="tech-view-heading"><div>${badge(d.status,d.status.startsWith('Propuesta'))}<h3>${esc(d.id+' · '+d.title)}</h3><p>${esc(d.description)}</p></div></div><div class="tech-diagram-controls"><span>Ajustar muestra la estructura; 100 % permite leer y desplazar el detalle.</span><div><button class="btn secondary small" data-tech-zoom="fit" aria-pressed="${state.zoom==='fit'}">Ajustar</button><button class="btn secondary small" data-tech-zoom="75" aria-pressed="${state.zoom===75}">75 %</button><button class="btn secondary small" data-tech-zoom="100" aria-pressed="${state.zoom===100}">100 %</button><button class="btn secondary small" data-tech-zoom="125" aria-pressed="${state.zoom===125}">125 %</button></div></div><div class="tech-diagram-scroll" tabindex="0" role="region" aria-label="Diagrama ${esc(d.title)}; área desplazable"><div class="tech-diagram-render" id="tech-diagram-render" data-tech-diagram="${d.key}">${diagram?.svg || '<p>Diagrama pendiente de generar.</p>'}</div></div>${d.id==='V01'?`<details class="tech-node-list"><summary>Consultar todas las fichas sin recorrer el mapa</summary><div class="tag-list tech-deployment-links">${list(data().components).map(c=>`<button class="tag" data-tech-component="${esc(c.id)}">${esc(c.name)}</button>`).join('')}</div></details>`:''}<p class="tech-diagram-reference">${link({label:'Evidencia de V01 y vistas V02–V06: venta, sincronización, continuidad, estados y cambio de ERP',url:'../docs/vistas-arquitectura-y-flujos.md'})}</p>`;
  }
  function prepareDiagram() {
    const el=$('#tech-diagram-render');const svg=el?.querySelector('svg');if(!svg||el.closest('[hidden]')||!el.getClientRects().length)return;
    const box=svg.getAttribute('viewBox')?.split(/\s+/).map(Number);const width=box?.[2]||950;
    const viewportWidth=el.parentElement.clientWidth;if(!viewportWidth)return;
    const available=Math.max(250,viewportWidth-24);
    const displayWidth=state.zoom==='fit'?Math.min(width,available):Math.round(width*state.zoom/100);
    svg.setAttribute('style',`display:block;width:${displayWidth}px;max-width:none;height:auto;margin:0 auto;`);
    svg.setAttribute('role','img');
    // Sequence/activity views remain images. Deployment also supports direct inspection.
    svg.querySelectorAll('[data-node]').forEach(node=>{node.removeAttribute('tabindex');node.removeAttribute('role');node.removeAttribute('aria-label');});
    if(el.dataset.techDiagram==='technical-deployment') {
      svg.setAttribute('role','group');
      const mapping={UI:['ui'],Print:['print'],Card:['transbank'],API:['backend'],Sync:['sync'],PG:['localdb'],Price:['pricing','promotions'],Bus:['bus','broker'],Read:['readapi'],Worker:['bus-processor'],Admin:['central-admin'],Pay:['payments'],CPG:['centraldb'],Mongo:['mongo'],AXAPI:['axapi'],AX:['ax'],MPOS:['mpos'],Fiscal:['fiscal-acepta','fiscal-ingydev'],Carro:list(data().components).filter(c=>/ApiCarro/i.test(c.name)).map(c=>c.id)};
      svg.querySelectorAll('g.node').forEach(node=>{
        const id=/^flowchart-(.+)-\d+$/.exec(node.id)?.[1];const components=list(mapping[id]).map(component).filter(Boolean);if(!components.length)return;
        node.setAttribute('role','button');node.setAttribute('tabindex','0');node.setAttribute('aria-label','Explorar '+components.map(c=>c.name).join(' y '));node.setAttribute('data-tech-node',id);
        if(node.dataset.techBound)return;node.dataset.techBound='true';
        const open=()=>bridge.openModal?.(components.map(c=>c.name).join(' / '),`${components.length>1?'<p>Esta agrupación reúne las siguientes piezas:</p>':''}${components.map(c=>`<section class="tech-node-detail"><h3>${esc(c.name)}</h3>${componentDetail(c)}</section>`).join('')}`);
        node.addEventListener('click',open);node.addEventListener('keydown',event=>{if(event.key==='Enter'||event.key===' '){event.preventDefault();event.stopPropagation();open();}});
      });
      if(state.zoom!=='fit') {
        const start=svg.querySelector('[data-tech-node="UI"]');const viewport=el.parentElement;
        if(start){const item=start.getBoundingClientRect(),area=viewport.getBoundingClientRect();viewport.scrollLeft+=item.left-area.left+item.width/2-viewport.clientWidth/2;viewport.scrollTop+=item.top-area.top+item.height/2-viewport.clientHeight/2;}
      }
    }
  }
  function coveragePanel() {
    const d=data();
    return `<div class="tech-view-heading"><h3>Qué está cubierto y qué falta demostrar</h3><p>${esc(d.scopeNote || 'Catálogo de aplicaciones e integraciones revisadas.')}</p></div><div class="tech-coverage-strip"><div><strong>${list(d.components).length}</strong><span>componentes del catálogo</span></div><div><strong>${list(d.endpoints).length}</strong><span>rutas y llamadas seleccionadas</span></div><div><strong>${list(d.gaps).length}</strong><span>vacíos documentados</span></div></div><p class="tech-coverage-limit">El catálogo reúne las piezas y rutas revisadas del POS de Chile. Falta completar los inventarios de Perú y España.</p>${functionalCoverageHTML()}${snapshotHTML()}<details class="tech-node-list tech-audited-components"><summary>Consultar todas las piezas auditadas</summary>${componentsPanel()}</details><div class="tech-gap-list">${list(d.gaps).map(g=>`<article><h4>${esc(componentName(g.component) || g.id)}</h4><p><strong>Falta:</strong> ${esc(g.missing)}</p><p><strong>Consecuencia:</strong> ${esc(g.effect)}</p></article>`).join('')}</div><div class="tech-source-index"><h4>Continuar en la evidencia</h4>${sources([{label:'Recorridos entre aplicaciones, bases y tablas',url:'../docs/recorridos-datos-tablas.md'},{label:'Catálogo de integraciones y rutas verificadas',url:'../docs/catalogo-integraciones-actuales.md'},{label:'Vistas de arquitectura, secuencias y actividad',url:'../docs/vistas-arquitectura-y-flujos.md'},{label:'Índice de auditoría de repositorios',url:'../docs/analisis-repositorios/README.md'},{label:'Matriz de cobertura de la documentación y presentación',url:'../docs/cobertura-documentacion-presentacion.md'},{label:'Decisiones de arquitectura: motivo, coste y evidencia requerida',url:'../docs/propuesta-arquitectura.md#decisiones-de-arquitectura'},{label:'Información pendiente del equipo',url:'../docs/solicitud-informacion-equipo.md'}])}</div>`;
  }
  function functionalCoverageHTML() {
    const modules=[['Ofertas','Consulta de ofertas y dependencia remota de precio examinadas; motor local sigue siendo propuesta.'],['Punto de venta','Recorridos de producto, guardado y facturación examinados; no se auditó toda variante de caja.'],['Cobranzas','La PPTX documenta recaudación, cuotas y acuerdos; faltan recorridos completos y pruebas productivas.'],['Devoluciones','Hay evidencia de rutas y estado de NC; faltan contratos completos de devolución de dinero y concurrencia.'],['Reportes','La PPTX incluye ventas, recaudación, cierres e informe Z; no se demuestra exhaustividad funcional.'],['Configuraciones','Clientes, usuarios, perfiles y parámetros declarados; permisos productivos y todas sus rutas no están certificados.'],['Tablero de sincronización','Vista de mensajes/errores orientada a soporte. Es distinto del proceso sincronizador AdonisJS de sucursal.']];
    return `<details class="tech-functional"><summary>Cobertura de los siete módulos de la presentación original</summary><p>Un módulo de la UI, una aplicación desplegada y un repositorio no son el mismo inventario.</p><dl>${modules.map(([name,description])=>`<div><dt>${name}</dt><dd>${description}</dd></div>`).join('')}</dl>${sources([{label:'Módulos declarados en la diapositiva 3',url:'../docs/antecedentes-presentacion-chile.md'},{label:'Matriz completa de documentación y presentación',url:'../docs/cobertura-documentacion-presentacion.md'}])}</details>`;
  }
  function snapshotHTML() {
    return `<details class="tech-functional tech-snapshots"><summary>Ramas y commits del catálogo técnico</summary><p>Versiones de los repositorios utilizadas para construir el catálogo.</p><dl>${list(data().snapshots).map(s=>`<div><dt>${esc(s.repo)}</dt><dd><strong>${esc(s.branch)} · ${esc(s.date)}</strong><code>${esc(s.commit)}</code>${s.note?`<p>${esc(s.note)}</p>`:''}${link({label:'Ver árbol del commit',url:'https://github.com/developer-implementos/'+s.repo+'/tree/'+s.commit})}</dd></div>`).join('')}</dl></details>`;
  }
  function componentsPanel() {
    const components=list(data().components);
    return `<div class="tech-view-heading"><h3>Aplicaciones, procesos y repositorios</h3><p>Abre una zona para explorar sus aplicaciones, repositorios y conexiones.</p></div>${Object.entries(zones).map(([zone,label])=>{const items=components.filter(c=>(c.zone||'unknown')===zone);return items.length?`<details class="tech-zone"><summary>${label}<span>${items.length} componentes</span></summary><div class="tech-component-grid">${items.map(c=>`<article class="tech-component-card"><div class="tech-component-heading"><span>${esc(text(c.confidence))}</span><h4>${esc(c.name)}</h4></div><p>${esc(c.responsibility)}</p>${componentRows(c)}<button class="btn secondary small" data-tech-component="${esc(c.id)}">Ver evidencia y pendientes</button></article>`).join('')}</div></details>`:'';}).join('')}`;
  }
  function renderView() {
    if(!$('#tech-view'))return;
    $('#tech-view').innerHTML=state.view==='endpoints'?endpointsPanel():state.view==='coverage'?coveragePanel():diagramPanel();
    $$('[data-tech-view]').forEach(el=>el.setAttribute('aria-pressed',String(el.dataset.techView===state.view)));
    if(state.view==='endpoints')renderEndpoints();else prepareDiagram();
  }
  function edgeCasesHTML() {
    return `<section class="edgecase-explorer"><div class="section-heading"><span class="eyebrow">FALLOS Y RECUPERACIÓN / PARA PROFUNDIZAR</span><h2>¿Qué estado debe quedar después del fallo?</h2><p>Ocho situaciones representativas. Distingue evidencia actual de la respuesta propuesta; no son incidencias de producción reproducidas.</p></div><details id="edgecase-explorer"><summary>Explorar límites, estados y acciones esperadas</summary><div class="edgecase-layout"><div class="edgecase-selector" role="group" aria-label="Caso límite">${edgeCases.map((c,i)=>`<button data-edgecase="${c.id}" aria-controls="edgecase-detail" aria-pressed="${state.edge===c.id}"><span>${String(i+1).padStart(2,'0')}</span>${esc(c.name)}</button>`).join('')}</div><div id="edgecase-detail" class="edgecase-detail" role="region" aria-labelledby="edgecase-title"></div></div></details></section>`;
  }
  function renderEdge() {
    if(!$('#edgecase-detail'))return;const c=edgeCases.find(c=>c.id===state.edge)||edgeCases[0];
    $('#edgecase-detail').innerHTML=`<span class="eyebrow">CASO / ${esc(c.name)}</span><h3 id="edgecase-title">${esc(c.trigger)}</h3><div class="edgecase-now"><span>HOY · ${esc(c.evidence)}</span><p>${esc(c.today)}</p></div><div class="edgecase-target"><span>PROPUESTO · ESTADO Y RESPUESTA</span><h4>${esc(c.status)}</h4><p>${esc(c.action)}</p></div>${sources([{label:'Evidencia y protocolo detallado',url:c.source},{label:'Matriz ampliada de resiliencia',url:'../docs/revision-resiliencia-datos-pos.md'}])}`;
    $$('[data-edgecase]').forEach(el=>el.setAttribute('aria-pressed',String(el.dataset.edgecase===state.edge)));
  }
  function notify(message) {const el=$('#announcement');if(el)el.textContent=message;}
  document.addEventListener('click',event=>{
    const el=event.target.closest('button');if(!el)return;
    if(el.dataset.techView){state.view=el.dataset.techView;renderView();notify(views.find(v=>v[0]===state.view)?.[1]||'Vista técnica');}
    else if(el.dataset.techComponent){const c=component(el.dataset.techComponent);if(c)bridge.openModal?.(c.name,componentDetail(c));}
    else if(el.hasAttribute('data-tech-reset')){state.query='';state.group='all';state.app='all';state.limit=6;renderView();$('#tech-query')?.focus({preventScroll:true});}
    else if(el.hasAttribute('data-tech-more')){state.limit+=6;renderEndpoints();const next=$('[data-tech-more]');if(next)next.focus({preventScroll:true});else {$('#tech-result-count').setAttribute('tabindex','-1');$('#tech-result-count').focus({preventScroll:true});}}
    else if(el.dataset.techZoom){state.zoom=el.dataset.techZoom==='fit'?'fit':Number(el.dataset.techZoom);prepareDiagram();$$('[data-tech-zoom]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.techZoom===String(state.zoom))));}
    else if(el.dataset.edgecase){state.edge=el.dataset.edgecase;renderEdge();notify($('#edgecase-title')?.textContent||'Caso seleccionado');}
  });
  document.addEventListener('input',event=>{if(event.target.id==='tech-query'){state.query=event.target.value;state.limit=6;renderEndpoints();}});
  document.addEventListener('change',event=>{
    const el=event.target;
    if(el.id==='tech-group'||el.id==='tech-app'){state[el.id==='tech-group'?'group':'app']=el.value;state.limit=6;renderEndpoints();}
  });
  window.POS_TECH_UI={explorerHTML,edgeCasesHTML,componentEvidenceHTML,refresh:prepareDiagram,mount(options={}){bridge=options;renderView();renderEdge();}};
})();
