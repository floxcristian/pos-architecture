/* Presentación local: no analítica, servicios remotos ni transacciones reales. */
(() => {
  'use strict';
  const C = window.POS_CONTENT;
  const D = window.POS_DIAGRAMS;
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
  const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const chapters = [
    {id:'mapa', label:'El ecosistema actual', hint:'Qué existe hoy', title:'La caja es parte de un ecosistema.', intro:'Empieza por las piezas del POS de Chile. Después puedes ver su código, seguir una operación o consultar la evidencia desde las pestañas.', eyebrow:'01 / Entender el punto de partida'},
    {id:'venta', label:'El viaje de una venta', hint:'Guardar ≠ registrar en AX', title:'Una venta. Varios momentos.', intro:'En Chile, el DTE de una venta puede ser una boleta o una factura electrónica. Guardar la venta, emitir ese documento y registrarla en el ERP son pasos diferentes.', eyebrow:'02 / Seguir una operación'},
    {id:'datos', label:'Cómo llegan los datos', hint:'Flujos, tablas y estados', title:'Cada operación deja una huella.', intro:'Empieza por los maestros: listados de clientes, direcciones y productos que se actualizan en la sucursal. Sigue sus cambios por las tablas y aplicaciones, o elige otra operación para explorar sus datos.', eyebrow:'03 / Seguir los datos'},
    {id:'offline', label:'Cuando se corta Internet', hint:'Laboratorio interactivo', title:'La conexión cae. ¿Qué puede seguir?', intro:'Prueba la diferencia entre tener una base local y diseñar una operación offline de extremo a extremo. En este ejemplo suponemos una venta permitida; las políticas reales aún deben acordarse.', eyebrow:'04 / Experimentar sin riesgo'},
    {id:'propuesta', label:'La arquitectura propuesta', hint:'Responsabilidades y garantías', title:'Autonomía local. Integración confiable.', intro:'Conservamos la fortaleza de la sucursal y hacemos explícitas las reglas, la persistencia y los estados. Esta es la arquitectura objetivo, pendiente de validar con el equipo.', eyebrow:'05 / Diseñar el siguiente paso'},
    {id:'evolucion', label:'Tres países, una evolución', hint:'ERP, estándares y transición', title:'Un núcleo común. Adaptadores por país.', intro:'El POS debe expresar su propio negocio. Las diferencias de ERP, fiscalidad y proveedores se resuelven mediante contratos y adaptadores explícitos.', eyebrow:'06 / Evolucionar sin rehacer todo'},
    {id:'ia', label:'IA en el POS', hint:'Ayuda opcional, reglas firmes', title:'Ayudar a las personas. Respetar las reglas.', intro:'Siete servicios candidatos, todavía no implementados. La IA puede buscar, proponer o resumir; la venta y sus reglas no dependen de que el modelo esté disponible.', eyebrow:'07 / Explorar una ayuda con límites'},
    {id:'repaso', label:'Comprueba lo aprendido', hint:'Repaso y siguientes decisiones', title:'Ahora, conecta las piezas.', intro:'Cuatro situaciones para comprobar el modelo mental. Puedes volver a intentar cada respuesta y consultar el glosario en cualquier momento.', eyebrow:'08 / Llevarlo a la conversación del equipo'}
  ];
  const mapViews = [{id:'general',label:'Vista general'},{id:'repositorios',label:'Repositorios'},{id:'peticiones',label:'Peticiones'},{id:'evidencia',label:'Evidencia'}];
  const mediaMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const state = {chapter:'mapa', mapView:'general', selected:'localdb', dataMode:'masters', compare:0, country:'CL', providerCase:'printer', providerChanged:false, rfidCase:'checkout', rfidReads:0, rfidSeen:[], rfidConfirmed:false, aiCase:'procedures', aiNetwork:'online', aiEvidence:true, flowStep:0, presenting:false, reduced:mediaMotion.matches, offline:0, replay:false, answers:{}};
  const flowDefs = {
    sale: [
      {title:'La persona prepara la venta', text:'La interfaz recoge el cliente, los productos y el medio de pago. En el flujo actual hay consultas remotas: preparar una venta no prueba autonomía offline.', nodes:['ui','backend'], states:['En preparación','Sin resultado','Pendiente de envío']},
      {title:'La sucursal guarda la operación', text:'En la ruta revisada, el backend hace commit de la venta y sus pagos en PostgreSQL antes de invocar la facturación. Persistida localmente no significa aceptada por el ERP.', nodes:['backend','localdb'], states:['Persistida','Aún no invocado','Pendiente de envío']},
      {title:'Se invoca la facturación', text:'La emisión del DTE tiene un resultado propio y puede fallar. Este paso ocurre después del commit local; el diagrama no supone aprobación fiscal ni liquidación de un pago.', nodes:['backend','fiscal'], states:['Persistida','Resultado propio','Pendiente de envío']},
      {title:'El sincronizador envía los elegibles', text:'La selección revisada de boletas y facturas exige estados de DTE y referencias admitidas fuera de development. Guardar la venta no garantiza que ya sea elegible para enviar. El minuto reportado por el equipo varía con reintentos y ventanas.', nodes:['localdb','sync'], states:['Persistida','Condiciona elegibilidad','Preparación / envío si procede']},
      {title:'La integración central recibe', text:'El bus y los adaptadores llevan el registro hacia AX. Una recepción central todavía no demuestra contabilización en el ERP. Hay que conocer qué confirma cada acuse.', nodes:['sync','bus'], states:['Persistida','Resultado propio','Recepción central']},
      {title:'AX registra después', text:'El registro llega al ERP más tarde. El objetivo es poder demostrar su resultado y conciliar diferencias. La reserva externa y la deuda en AX pueden estar en momentos distintos; caja no maneja stock.', nodes:['bus','ax'], states:['Persistida','Resultado propio','Resultado ERP por verificar']}
    ],
    masters: [
      {title:'El origen central necesita confirmación', text:'Según los apuntes, cambios de AX pasan por MPOS SQL. Faltan jobs, DDL y configuración para verificar ese tramo, su ubicación y una eventual ejecución diaria. Las líneas discontinuas señalan esa incertidumbre.', nodes:['ax','mpos']},
      {title:'Se prepara y anuncia un lote', text:'mountain-concentrador contiene el lector Java de MPOS, generación de lotes PostgreSQL y aviso por JMS. Falta confirmar los artefactos activos y el productor AX→MPOS.', nodes:['bus','readapi']},
      {title:'La sucursal consulta y descarga', text:'El consumidor revisado atiende avisos AMQP y consulta maestros con un cron de tres minutos, sujeto a condiciones. Ese intervalo no es una promesa de frescura de extremo a extremo.', nodes:['readapi','sync']},
      {title:'El consumidor aplica los datos', text:'El sincronizador descarga detalles y actualiza la base local. No es evidencia de que el centro escriba directamente en todas las bases de caja. Persistencia y acuses deben ser recuperables.', nodes:['sync','localdb']}
    ],
    customer: [
      {title:'Se selecciona o carga un cliente', text:'En el flujo revisado, cargar la ficha por RUT puede activar un refresco. No significa que cada tecla dispare esa secuencia.', nodes:['ui','backend']},
      {title:'El backend consulta la integración', text:'La API remota devuelve datos del cliente. Esta consulta no demuestra una modificación del cliente en AX. Los contactos tienen otra ruta y no deben darse todos por refrescados.', nodes:['backend','clientapi']},
      {title:'Se actualiza la copia local', text:'El backend persiste datos de cliente, direcciones y estado de cuenta según la ruta. El refresco complementa los lotes; no elimina la distribución masiva.', nodes:['backend','localdb']},
      {title:'La caída remota tiene un impacto', text:'El código puede devolver datos locales junto a un error. En el flujo principal inspeccionado, la interfaz limpia la venta en preparación. Es un hallazgo estático, no una incidencia productiva reproducida.', nodes:['backend','ui']}
    ]
  };
  const icons = {app:'Aplicación', db:'Base de datos', external:'Sistema externo', process:'Proceso'};
  function badge(status) { return `<span class="status-badge ${esc(status)}">${esc(C.statusLabels[status] || status)}</span>`; }
  function sourceLink(s) { const safe = /^(\.\.\/docs\/|https:\/\/github\.com\/)/.test(s.url); return safe ? `<a href="${esc(s.url)}" target="_blank" rel="noopener">${esc(s.label)} <span aria-hidden="true">↗</span></a>` : esc(s.label); }
  function button(label, action, extra = '', cls = 'secondary') { return `<button class="btn ${cls}" data-action="${action}" ${extra}>${label}</button>`; }
  function announce(text) { $('#announcement').textContent = text; }
  function notify(text) { const el = $('#toast'); el.textContent=text; el.hidden=false; clearTimeout(notify.timer); notify.timer=setTimeout(()=>el.hidden=true,5000); }
  function setHash(id) { if (location.hash === '#'+id) navigate(id); else location.hash=id; }
  function header(chapter) { return `<div class="chapter-header"><div class="chapter-meta"><span class="eyebrow">${chapter.eyebrow}</span>${['propuesta','evolucion','ia'].includes(chapter.id) ? badge('proposed') : chapter.id === 'offline' ? '<span class="status-badge proposed">Simulación didáctica</span>' : ''}</div><h1 class="chapter-title" tabindex="-1">${chapter.title}</h1><p class="chapter-intro">${chapter.intro}</p></div>`; }
  function takeaway(text) { return `<div class="key-takeaway"><span>IDEA CLAVE</span><p>${text}</p></div>`; }
  function diagram(key, title, info='Selecciona una app o una base de datos') {
    const d = D?.[key];
    if (!d) return '<div class="notice warning">No se pudo cargar el diagrama. Revisa que diagrams.js esté junto a index.html.</div>';
    return `<div class="diagram-card"><div class="diagram-toolbar"><div><strong>${title}</strong><small>${info}</small></div></div><p class="diagram-scroll-hint">Desliza el mapa y selecciona un componente.</p><div class="diagram-canvas diagram" data-diagram="${key}">${d.svg}</div></div>`;
  }
  function inspector() { return '<aside class="inspector" id="inspector" aria-label="Detalle del componente"></aside>'; }
  function nodeList(ids, title='Más piezas del ecosistema') { return `<details class="node-list"><summary>${title}</summary><div class="tag-list">${ids.map(id=>`<button class="tag" data-component="${id}">${esc(C.components[id]?.title || id)}</button>`).join('')}</div></details>`; }
  function flowBlock(key) {
    const def = flowDefs[key];
    return `<section class="flow-controller" aria-label="Control del recorrido"><div class="step-track" role="group" aria-label="Elegir paso">${def.map((s,i)=>`<button class="step-dot" data-flow-step="${i}" aria-label="Paso ${i+1}: ${esc(s.title)}" aria-pressed="false">${i+1}</button>`).join('')}</div><div class="step-story" aria-live="polite" aria-atomic="true"><span class="step-count" id="step-count"></span><div><h2 class="step-title" id="step-title"></h2><p class="step-description" id="step-description"></p></div></div>${key==='sale'?'<div class="state-strip" id="flow-states"></div>':''}</section>`;
  }
  function providerModule() {
    return `<section class="provider-module" aria-labelledby="provider-title"><div class="section-heading"><span class="eyebrow">PROVEEDORES Y DISPOSITIVOS / PROPUESTA</span><h2 id="provider-title">Cambiar una pieza sin rehacer el POS.</h2><p>Distintas aplicaciones de facturación, impresoras y terminales pueden compartir contratos del producto. El esfuerzo depende de lo que ya esté probado.</p></div><div class="provider-scenarios" role="group" aria-label="Ejemplo de cambio de proveedor o dispositivo">${C.providerScenarios.map(c=>`<button data-provider-case="${c.id}" aria-pressed="${state.providerCase===c.id}" aria-controls="provider-case"><span>${c.number}</span>${esc(c.label)}</button>`).join('')}</div><div id="provider-case" class="provider-case" role="region" aria-labelledby="provider-case-title"></div><details class="provider-map"><summary>Ver cómo se conectan los contratos, perfiles y adaptadores</summary>${diagram('providers','Extensibilidad / responsabilidades','Propuesta · selecciona una pieza para entender su límite')}<p class="small-note">La sucursal sigue siendo el escritor del negocio. La aplicación local del PC accede al hardware; no crea una segunda autoridad de venta. El adaptador fiscal puede operar local o remotamente según su integración.</p></details><p class="provider-scope">Ejemplos hipotéticos: no acreditan modelos homologados ni compatibilidad universal. ${sourceLink({label:'Criterios y matriz por proveedor',url:'../docs/extensibilidad-proveedores-dispositivos.md'})}</p></section>`;
  }
  function rfidModule() {
    return `<section class="rfid-module" aria-labelledby="rfid-title"><div class="section-heading"><span class="eyebrow">EVOLUCIÓN FUTURA / POR EVALUAR</span><h2 id="rfid-title">RFID: leer productos no es cobrar.</h2><p>Lectura masiva en caja, conteos rápidos y autoservicio son capacidades distintas. Esta exploración no implica compra de hardware ni una decisión de producto.</p></div><details class="rfid-explorer"><summary>Explorar tres escenarios y probar una lectura de etiquetas</summary><div class="provider-scenarios rfid-scenarios" role="group" aria-label="Escenario futuro de RFID">${C.rfidScenarios.map((s,i)=>`<button data-rfid-case="${s.id}" aria-pressed="${state.rfidCase===s.id}" aria-controls="rfid-case"><span>0${i+1}</span>${esc(s.label)}</button>`).join('')}</div><div class="rfid-case" id="rfid-case" role="region" aria-labelledby="rfid-case-title"></div><details class="rfid-map"><summary>Ver responsabilidades y adaptadores</summary>${diagram('rfid','RFID / observación, selección y autoridad','Propuesta · selecciona una responsabilidad')}<p class="small-note">Perfiles por sucursal y puesto; modelo de lector, etiquetas, materiales y zona requieren homologación. Metales, líquidos e interferencias se prueban en condiciones reales, sin prometer precisión universal.</p></details><p class="rfid-fallback"><strong>Alternativa operativa:</strong> código de barras o captura manual con control físico de la cesta. Un código sin serial no permite saber si es la misma unidad ya detectada por RFID; deduplicar por SKU borraría unidades legítimas.</p><p class="provider-scope">Sin WAN solo se usan datos y permisos locales vigentes con LAN y escritor de sucursal disponibles. Un lector no crea autonomía por terminal. ${sourceLink({label:'Decisiones y límites de RFID',url:'../docs/evolucion-rfid-autoservicio.md'})}</p></details></section>`;
  }
  function interactionLibrary(chapter) {
    const proposed=chapter==='propuesta';
    return `<details class="journey-library" id="interaction-library"><summary><strong>${proposed?'Consultar los contratos de venta y entrega al ERP':'Consultar una operación: HTTP, mensajes y tablas'}</strong><span>${proposed?'Dos recorridos propuestos, paso a paso':'Seis recorridos actuales · venta, sincronización, maestros, cliente, impresión y NC'}</span></summary>${window.POS_INTERACTIONS_UI?.html(chapter)||''}</details>`;
  }
  function relatedReading(items) {
    return `<nav class="related-reading" aria-label="Profundizar en este tema"><strong>Para una pregunta concreta</strong><div>${items.map(([href,label])=>`<a class="btn secondary small" href="${href}">${label} →</a>`).join('')}</div></nav>`;
  }
  function currentPage() {
    return `<div id="ecosystem-views"><div class="map-tabs" role="tablist" aria-label="Perspectivas del ecosistema">${mapViews.map(v=>`<button id="map-tab-${v.id}" role="tab" data-map-view="${v.id}" aria-controls="map-panel-${v.id}" aria-selected="${state.mapView===v.id}" tabindex="${state.mapView===v.id?0:-1}">${v.label}</button>`).join('')}</div>${mapViews.map(v=>`<section class="map-panel" id="map-panel-${v.id}" role="tabpanel" aria-labelledby="map-tab-${v.id}" tabindex="0" hidden></section>`).join('')}</div>`;
  }
  function mapPanelHTML(view) {
    if(view==='repositorios') return window.POS_REPOSITORIES_UI?.html() || '';
    if(view==='peticiones') return window.POS_INTERACTIONS_UI?.html('mapa') || '';
    if(view==='evidencia') return window.POS_TECH_UI?.explorerHTML() || '';
    return `<p class="map-perspective">Cada sucursal tiene backend, base de datos y sincronizador. La integración central conecta con Dynamics AX; la caja no administra el stock. Selecciona una pieza para conocer su función y explorar sus operaciones.</p><div class="stage-layout"><div>${diagram('current','Chile / piezas del POS actual','Selecciona una app o base de datos para ver su detalle')}${nodeList(['devices','centraldb','readapi','mpos','orsan'],'Otras piezas y referencias del ecosistema')}</div>${inspector()}</div>`;
  }
  function showMapView(view, focus=false) {
    if(!mapViews.some(v=>v.id===view))view='general';
    state.mapView=view;
    $$('[data-map-view]').forEach(b=>{const active=b.dataset.mapView===view;b.setAttribute('aria-selected',String(active));b.tabIndex=active?0:-1;});
    $$('.map-panel').forEach(p=>p.hidden=p.id!=='map-panel-'+view);
    const panel=$('#map-panel-'+view);if(!panel)return;
    if(!panel.dataset.mounted){
      panel.innerHTML=mapPanelHTML(view);panel.dataset.mounted='true';
      if(view==='general'){wireDiagrams(panel);selectComponent(state.selected||'ui');}
      if(view==='repositorios')window.POS_REPOSITORIES_UI?.mount({openModal});
      if(view==='peticiones')window.POS_INTERACTIONS_UI?.mount('mapa');
      if(view==='evidencia')window.POS_TECH_UI?.mount({openModal});
    }
    document.dispatchEvent(new CustomEvent('pos:map-view',{detail:{view}}));
    if(view==='evidencia')window.POS_TECH_UI?.refresh?.();
    if(focus)$('#map-tab-'+view).focus({preventScroll:true});
  }
  function chooseMapView(view) {
    showMapView(view,true);
    const params=new URLSearchParams({vista:view});
    if(view==='peticiones'&&$('#ix-flow'))params.set('flujo',$('#ix-flow').value);
    state.linkedFlow=null;
    const hash='#mapa?'+params;if(location.hash!==hash)history.pushState(null,'',hash);
  }
  function openLinkedRepository(id) {
    if(!id)return;
    const button=$$('[data-repository]',$('#map-panel-repositorios')).find(b=>b.dataset.repository===id);
    if(button){button.focus({preventScroll:true});button.click();}
  }
  function componentConnections(id) {
    if(state.chapter!=='mapa')return '';
    const journeys={ui:['sale'],backend:['sale','customer'],localdb:['sale','masters'],sync:['sync','masters'],bus:['sync','masters'],axapi:['sync'],ax:['sync'],fiscal:['sale'],devices:['printing'],readapi:['masters'],centraldb:['masters'],mpos:['masters'],mongo:['credit'],clientapi:['customer']};
    const names={sale:'Venta',customer:'Cliente por RUT',sync:'Envío a AX',masters:'Distribución de maestros',printing:'Impresión',credit:'Notas de crédito'};
    const repos=window.POS_REPOSITORIES?.repositories.filter(r=>r.role==='runtime'&&window.POS_TECHNICAL?.components.some(c=>c.currentId===id&&(c.repo===r.id||c.repo?.startsWith(r.id+'/'))))||[];
    const links=[...(journeys[id]||[]).map(flow=>`<a href="#mapa?vista=peticiones&flujo=${flow}">${names[flow]} →</a>`),...repos.map(r=>`<a href="#mapa?vista=repositorios&repo=${r.id}">${esc(r.name)} →</a>`)];
    return links.length?`<nav class="component-connections" aria-label="Explorar esta pieza"><strong>Explorar esta pieza</strong>${links.join('')}</nav>`:'';
  }
  function salePage() { return `<div class="stage-layout flow-stage"><div>${diagram('sale','El recorrido actual de una venta','Selecciona un componente para abrir su ficha')}</div>${flowBlock('sale')}</div>${takeaway('Local, fiscal y ERP tienen estados propios. Un único “sincronizado” oculta información que necesitamos para operar y conciliar.')}${relatedReading([['#mapa?flujo=sale','Llamadas HTTP de la venta'],['#mapa?flujo=sync','Envío y respuesta de AX'],['#datos?flujo=D01','Tablas y estados de la venta']])}`; }
  function dataContext() { return `<div class="segmented" aria-label="Camino de los datos"><button data-data-mode="masters" aria-pressed="${state.dataMode==='masters'}">Distribución por lotes</button><button data-data-mode="customer" aria-pressed="${state.dataMode==='customer'}">Consulta de cliente por RUT</button></div><div class="stage-layout flow-stage"><div>${diagram(state.dataMode,state.dataMode==='masters'?'Maestros / del centro a la sucursal':'Cliente / refresco bajo demanda')}</div>${flowBlock(state.dataMode)}</div><div class="notice ${state.dataMode==='masters'?'warning':''}">${state.dataMode==='masters'?'<strong>Falta cerrar el tramo central.</strong> El lector de MPOS y la API central están revisados en mountain-concentrador. El productor AX→MPOS, el job diario y los hosts siguen por confirmar.':'<strong>Una copia no equivale a autorización.</strong> Disponer del estado de cuenta local no concede por sí solo permiso para vender a crédito offline.'}</div>`; }
  function dataPage() { return `${window.POS_DATAFLOWS_UI?.html() || ''}<details class="df-original-context"><summary>Contexto: lotes y consulta por RUT</summary><p class="df-context-intro">Dos ritmos complementarios. La vista resumida ayuda a ubicar los recorridos detallados de arriba.</p>${dataContext()}</details>`; }
  function offlinePage() { return `<div class="lab-banner"><span class="lab-label">LABORATORIO</span><span>Caída de Internet (WAN) · LAN y servidor de sucursal disponibles</span><button class="btn secondary small" data-action="offline-reset">Reiniciar laboratorio</button></div><div class="comparison-grid offline-grid"><section class="comparison-card before"><div class="card-kicker">HOY / EVIDENCIA REVISADA</div><h2>La base local ya existe.</h2><p>La consulta remota de precios puede bloquear el pago si falla. El resultado depende de la operación y de sus servicios externos.</p><div class="state-row"><span>Conexión con el centro</span><strong id="actual-network"></strong></div><div class="state-row"><span>Consulta de precios</span><strong id="actual-price"></strong></div><div class="state-row"><span>Persistencia local</span><strong>Disponible en sucursal</strong></div><p class="small-note">Una aplicación de escritorio no elimina esta dependencia.</p>${button('Inspeccionar precios','inspect-modal','data-component-id="pricing"','secondary small')}</section><section class="comparison-card after"><div class="card-kicker">PROPUESTO / EJEMPLO DIDÁCTICO</div><h2>La operación conserva su identidad.</h2><p>Venta de ejemplo con datos y reglas vigentes. El pago externo y la aprobación fiscal no se simulan.</p><div class="state-row"><span>Venta local</span><strong id="demo-local"></strong></div><div class="state-row"><span>Outbox local</span><strong id="demo-outbox"></strong></div><div class="state-row"><span>Registros centrales aplicados</span><strong id="demo-central"></strong></div><div class="state-row"><span>Resultado ERP</span><strong id="demo-erp"></strong></div><div class="state-row"><span>Fiscalidad / pago externo</span><strong>No demostrados</strong></div></section></div><section class="lab-control"><div><span class="eyebrow" id="lab-step"></span><h2 id="lab-title"></h2><p id="lab-description" aria-live="polite"></p></div><div class="lab-buttons"><button class="btn primary" data-action="offline-next" id="offline-next"></button><button class="btn secondary" data-action="offline-replay" id="offline-replay" hidden>Reenviar el mismo evento</button></div></section><div class="event-log" id="event-log" aria-label="Bitácora del ejemplo"></div>${takeaway('Aceptar una venta offline requiere reglas explícitas. La durabilidad, la deduplicación y la conciliación se diseñan; no aparecen por usar una cola o una app instalada.')}`; }
  function proposedPage() { return `<section class="compare-module"><div class="section-heading"><span class="eyebrow">ANTES / PROPUESTO</span><h2>Qué cambia, en concreto</h2></div><div class="segmented comparison-tabs" aria-label="Tema de comparación">${C.comparisons.map((x,i)=>`<button data-compare="${i}" aria-pressed="${state.compare===i}">${esc(x.topic)}</button>`).join('')}</div><div id="comparison-detail"></div></section>${interactionLibrary('propuesta')}<details class="ix-context"><summary>Vista general de responsabilidades y decisiones</summary><div class="stage-layout"><div>${diagram('proposed','Objetivo / sucursal y plataforma','Outbox e inbox son registros durables, no necesariamente bases separadas')}${nodeList(['edge','edgedb','offers','outbox','inbox','platform','acl','observability','tauri'],'Explorar todas las decisiones de diseño')}${takeaway('Una transacción local guarda negocio + outbox. El receptor registra inbox + efecto local. Las llamadas a ERP, pagos y fiscalidad conservan estados y recuperación propios.')}</div>${inspector()}</div></details><div class="tech-panel">${window.POS_REPOSITORIES_UI?.platformHTML() || ''}<div class="tag-list"><button class="tag" data-action="term" data-term="Monolito modular">Monolito modular</button><button class="tag" data-action="term" data-term="Monorepo">Nx / monorepo</button><button class="tag" data-action="inspect-modal" data-component-id="tauri">Tauri / shell candidato</button><button class="tag" data-action="inspect-modal" data-component-id="observability">Pino / Sentry / trazas</button></div></div>`; }
  function evolutionPage() { return `<div class="country-grid" aria-label="País que se está explorando">${Object.entries(C.countries).map(([id,x])=>`<button class="country-card" data-country="${id}" aria-pressed="${state.country===id}"><span class="country-code">${id}</span><span><strong>${x.name}</strong><small>${esc(x.erp)}</small></span></button>`).join('')}</div><div class="country-detail" id="country-detail" aria-live="polite"></div><div class="chapter-split"><div>${diagram('migration','Aislar la dependencia del ERP','Transición conceptual · destino y fechas por decidir')}${nodeList(['platform','acl','ax','erpnext'],'Explorar las piezas de la migración')}</div><div class="migration-story"><span class="eyebrow">EL LÍMITE QUE PROTEGE AL POS</span><h2>El ERP cambia detrás de un contrato.</h2><p>Una <button class="inline-term" data-action="term" data-term="Fachada">fachada</button> ofrece una entrada estable. La <button class="inline-term" data-action="term" data-term="ACL">ACL</button> traduce significado, estados y errores del ERP.</p><div class="contract-example"><span>Vocabulario del POS</span><code>RegistrarVenta · ConsultarCliente</code><span>Mapeo controlado por adaptador</span><code>AX hoy → ERP común por definir</code></div><p>El núcleo no copia nombres de tablas ni estados internos de AX. La transición requiere validar equivalencias y conciliar, incluso con buenos contratos.</p><div class="notice warning">Chile sería el primer país en migrar. El posible inicio el próximo año es una intención informada, sin producto ni calendario aprobados.</div></div></div>${providerModule()}${rfidModule()}<section class="standard-panel"><h2>Estándares que debemos acordar</h2><div class="standard-grid"><p><strong>Datos.</strong> Convención de schemas y tablas, propietario por módulo y migraciones versionadas.</p><p><strong>Código.</strong> Vocabulario de negocio compartido, dependencias permitidas y contratos versionados.</p><p><strong>Operación.</strong> Identidad de venta, correlación, estados observables y procedimientos de conciliación.</p></div></section><section><div class="section-heading"><span class="eyebrow">ADOPCIÓN PROGRESIVA</span><h2>Construir evidencia antes de ampliar</h2></div><div class="roadmap">${[['01','Acordar','Definir perfil offline, autoridad de datos y operaciones por país.'],['02','Demostrar','Probar pérdida de red, reinicio, duplicados, fiscalidad y periféricos.'],['03','Pilotar','Una sucursal controlada, conciliación y reversión ensayada.'],['04','Extender','Desplegar gradualmente y sustituir el adaptador ERP cuando corresponda.']].map(([n,t,p])=>`<div class="phase"><span>${n}</span><h3>${t}</h3><p>${p}</p></div>`).join('')}</div></section>`; }
  function recapPage() { return `<div class="quiz-progress"><span>REPASO INTERACTIVO</span><strong id="quiz-score">0 de 4 resueltas</strong>${button('Volver a intentar','quiz-reset','','secondary small')}</div><div class="quiz-grid">${C.questions.map((q,i)=>`<section class="question-card" aria-labelledby="question-${i}"><span class="question-number">0${i+1}</span><h2 id="question-${i}">${esc(q.prompt)}</h2><div class="answer-options">${q.options.map((o,j)=>`<button class="answer-button" data-question="${i}" data-answer="${j}" aria-pressed="false"><span>${String.fromCharCode(65+j)}</span>${esc(o.text)}</button>`).join('')}</div><p class="feedback" id="feedback-${i}" aria-live="polite"></p></section>`).join('')}</div><section class="next-decisions"><span class="eyebrow">LA SIGUIENTE CONVERSACIÓN</span><h2>Seis respuestas que necesitamos del equipo</h2><ol><li><strong>Offline:</strong> ¿sin Internet, sin red local o también sin servidor?</li><li><strong>Políticas:</strong> ¿qué ventas, pagos, crédito y documentos se permiten desconectados?</li><li><strong>Producción:</strong> ¿qué commits y configuraciones están desplegados en cada país?</li><li><strong>Datos:</strong> ¿quién publica maestros, genera los lotes y administra MPOS?</li><li><strong>Integridad:</strong> ¿cómo se identifican, reintentan y concilian las operaciones?</li><li><strong>Migración:</strong> ¿cuál es el ERP destino, el alcance por país y el plan de corte?</li></ol><div class="tag-list"><a class="btn primary" href="../docs/solicitud-informacion-equipo.md" target="_blank" rel="noopener">Abrir solicitud completa ↗</a>${button('Ver todas las fuentes','sources')}</div></section>`; }
  function aiServicesBlock() {
    return `<details class="ai-services"><summary>Servicios a evaluar</summary><p class="ai-services-intro">Alternativas candidatas, sin compra, adopción ni pruebas productivas. Para empezar, elegir un proveedor cloud si se justifica; esta lista no propone desplegarlos todos.</p><div class="ai-service-list">${C.aiServices.map(s=>`<article><div><h3>${esc(s.name)}</h3><p>${esc(s.use)}</p></div><p>${esc(s.limits)}</p></article>`).join('')}</div><p class="ai-services-foot">No entrenar con los datos no equivale a no retenerlos. Verificar servicio, modelo, región y contrato. ${sourceLink({label:'Comparación y fuentes oficiales',url:'../docs/servicios-ia-pos.md'})}</p></details>`;
  }
  function aiPage() {
    return `<div class="ai-pilots"><div><span class="eyebrow">DOS CANDIDATOS A PILOTO</span><strong>Valor y datos por comprobar.</strong></div><p><b>01</b> Procedimientos y soporte con fuentes aprobadas.</p><p><b>02</b> Búsqueda asistida, después de curar catálogo y compatibilidades.</p></div><section class="ai-lab" aria-labelledby="ai-lab-title"><div class="ai-lab-heading"><div><span class="eyebrow">LABORATORIO / SIN MODELOS REALES</span><h2 id="ai-lab-title">¿Qué ayuda queda disponible?</h2><p>Cambia la conexión y la evidencia; después explora un servicio.</p></div><div class="ai-lab-controls"><div class="segmented" role="group" aria-label="Conectividad del ejemplo"><button data-ai-network="online" aria-pressed="${state.aiNetwork==='online'}">Conectado</button><button data-ai-network="offline" aria-pressed="${state.aiNetwork==='offline'}">Sin Internet</button></div><label class="ai-evidence-control"><input type="checkbox" id="ai-evidence" ${state.aiEvidence?'checked':''}><span>Fuentes vigentes y acceso autorizado</span></label></div></div><div class="ai-lab-grid"><div class="ai-case-selector" role="group" aria-label="Servicio de IA que se está explorando">${C.aiCases.map((c,i)=>`<button data-ai-case="${c.id}" aria-controls="ai-case-detail" aria-pressed="${state.aiCase===c.id}"><span class="ai-case-number">${String(i+1).padStart(2,'0')}</span><span><strong>${esc(c.label)}</strong><small>${esc(c.priority)}</small></span></button>`).join('')}</div><div class="ai-case-detail" id="ai-case-detail" role="region" aria-labelledby="ai-case-title"></div></div><div class="ai-core-strip"><span class="ai-core-mark" aria-hidden="true">=</span><div><strong id="ai-core-state">El núcleo no depende de la IA.</strong><p>La venta solo continúa si LAN, servidor y políticas lo permiten. Pago, crédito y fiscalidad mantienen sus límites propios; esta simulación no los aprueba.</p></div>${button('Ver este límite','inspect-modal','data-component-id="aicore"','secondary small')}</div></section><div class="ai-action-chain" aria-label="Responsabilidades de una acción asistida"><span><b>1</b> La IA sugiere</span><span><b>2</b> La persona revisa</span><span><b>3</b> El núcleo valida</span><p>Confirmar una sugerencia no elude permisos, precios ni reglas del negocio.</p></div><details class="ai-map provider-map"><summary>Ver la arquitectura de esta ayuda opcional</summary>${diagram('ai','IA / fuentes, controles y núcleo','Propuesta · cada componente explica su responsabilidad')}<p class="small-note">El modelo no escribe en la base de caja. Hardware local, proveedor remoto, residencia de datos y presupuesto siguen por evaluar. RAG y embeddings ayudan a recuperar contenido; no garantizan verdad.</p></details>${aiServicesBlock()}<p class="provider-scope">Ejemplos sintéticos, sin consultas a proveedores ni ejecución de acciones. ${sourceLink({label:'Casos, alternativas y criterios de piloto',url:'../docs/servicios-ia-pos.md'})}</p>`;
  }
  const pages = {mapa:currentPage,venta:salePage,datos:dataPage,offline:offlinePage,propuesta:proposedPage,evolucion:evolutionPage,ia:aiPage,repaso:recapPage};
  function researchSupplement() {
    if(state.chapter==='offline') return window.POS_TECH_UI?.edgeCasesHTML() || '';
    if(state.chapter==='datos') return `<div class="notice warning"><strong>Horario informado de Chile:</strong> L–V 07:00–22:00; sábado 07:00–16:00. El equipo indica mantenimiento fuera de esa ventana los sábados. El código revisado tiene diferencias: domingo permitido en el cron y otras rutas sin la misma compuerta.<div class="tag-list">${button('Entender horario y mantenimiento','inspect-modal','data-component-id="syncpolicy"','secondary small')}</div></div>`;
    if(state.chapter==='propuesta') return `<section class="tech-panel"><div><span class="eyebrow">REVISIÓN CRÍTICA / INTEGRACIÓN Y DATOS</span><h2>Elegir por responsabilidad.</h2><p>Base preferente para piloto: outbox local, HTTPS con recepción durable y despacho central acotado sobre PostgreSQL. Comparar primero las capacidades corporativas existentes; adoptar un broker nuevo exige evidencia.</p></div><div class="tag-list">${[['mediation','Evolución de WSO2'],['rabbitmq','RabbitMQ central'],['bullmq','BullMQ y sus backends'],['dataplatform','Simplificar bases']].map(([id,label])=>button(label,'inspect-modal',`data-component-id="${id}"`,'secondary small')).join('')}</div></section>`;
    if(state.chapter==='evolucion') return `<div class="notice"><strong>46 entradas públicas de tiendas al 01-10-2026:</strong> Chile 31, Perú 12 y España 3. No equivalen a cajas activas ni a despliegues POS. El volumen, los pendientes y la capacidad de cada ERP determinan el dimensionamiento.<div class="tag-list"><a class="btn secondary small" href="../docs/cobertura-publica-sucursales.md" target="_blank" rel="noopener">Inventario y fuentes ↗</a><a class="btn secondary small" href="../docs/revision-arquitectura-corporativa.md" target="_blank" rel="noopener">Revisión en tres rondas ↗</a></div></div>`;
    return '';
  }
  function navHTML() { return chapters.map((ch,i)=>`<button class="chapter-button" data-chapter="${ch.id}" ${state.chapter===ch.id?'aria-current="step"':''}><span class="nav-index">${String(i+1).padStart(2,'0')}</span><span class="nav-copy"><strong>${ch.label}</strong><small>${ch.hint}</small></span></button>`).join(''); }
  function navigate(id, focus = true) {
    const [chapterId, query=''] = id.split('?');
    const chapter = chapters.find(ch=>ch.id===chapterId) || chapters[0];
    const params=new URLSearchParams(query);
    state.linkedFlow=params.get('flujo');
    const mapView=state.linkedFlow?'peticiones':params.get('vista')||'general';
    if($('#modal').open)$('#modal').close();
    if(chapter.id==='mapa'&&state.chapter==='mapa'&&$('#ecosystem-views')){
      showMapView(mapView);openLinkedFlow();
      if(state.mapView==='repositorios')openLinkedRepository(params.get('repo'));
      return;
    }
    state.chapter=chapter.id;state.flowStep=0;state.mapView=mapView;
    state.selected=({mapa:'ui',venta:'backend',datos:state.dataMode==='masters'?'mpos':'clientapi',propuesta:'edge'})[state.chapter] || null;
    render();
    if(focus){$('.chapter-title').focus({preventScroll:true});window.scrollTo({top:0,behavior:'instant'});}
    if(state.chapter==='mapa'&&state.mapView==='repositorios')openLinkedRepository(params.get('repo'));
  }
  function render() {
    const idx=chapters.findIndex(ch=>ch.id===state.chapter), ch=chapters[idx];
    $('#chapter-nav').innerHTML=navHTML();
    $('#chapter-counter').innerHTML=`<span>${String(idx+1).padStart(2,'0')} <span class="counter-total">/ ${String(chapters.length).padStart(2,'0')}</span></span><strong>${ch.label}</strong>`;
    $('#mobile-chapter').innerHTML=chapters.map(c=>`<option value="${c.id}" ${c.id===ch.id?'selected':''}>${c.label}</option>`).join('');
    window.POS_INTERACTIONS_UI?.destroy();
    $('#main').innerHTML=`<article class="chapter chapter-${ch.id}">${header(ch)}${pages[ch.id]()}${researchSupplement()}${window.POS_OPERATIONS_UI?.html(ch.id)||''}<div class="footer-nav">${idx>0?button('← '+chapters[idx-1].label,'previous'):''}<span>${idx+1} / ${chapters.length}</span>${idx<chapters.length-1?button(chapters[idx+1].label+' →','next','','primary'):button('Volver al mapa ↗','home','','primary')}</div></article>`;
    wireDiagrams();
    if ($('#inspector')) selectComponent(state.selected);
    if (state.chapter==='venta'||state.chapter==='datos') updateFlow();
    if (state.chapter==='offline') updateOffline();
    if (state.chapter==='propuesta') updateComparison();
    if (state.chapter==='evolucion') { updateCountry(); updateProviderCase(); updateRfidCase(); }
    if (state.chapter==='ia') updateAiCase();
    if (state.chapter==='repaso') updateQuiz();
    window.POS_TECH_UI?.mount({openModal});
    window.POS_DATAFLOWS_UI?.mount({openModal});
    window.POS_OPERATIONS_UI?.mount(ch.id,{openModal});
    window.POS_INTERACTIONS_UI?.mount(ch.id);
    window.POS_REPOSITORIES_UI?.mount({openModal});
    if(ch.id==='mapa')showMapView(state.mapView);
    openLinkedFlow();
    document.title=`${ch.label} · POS Atlas`;
  }
  function openLinkedFlow() {
    const id=state.linkedFlow;if(!id)return;
    const select=$(['mapa','propuesta'].includes(state.chapter)?'#ix-flow':state.chapter==='datos'?'#dataflow-select':'#unused-linked-flow');
    if(!select||![...select.options].some(option=>option.value===id))return;
    const library=$('#interaction-library');if(library)library.open=true;
    if(select.value!==id){select.value=id;select.dispatchEvent(new Event('change',{bubbles:true}));}
    // Opening a disclosure changes the diagram's measured size before scrolling.
    requestAnimationFrame(()=>requestAnimationFrame(()=>{if(!select.isConnected)return;select.focus({preventScroll:true});(library||$('#map-panel-peticiones')||$('#dataflow-explorer')).scrollIntoView({block:'start',behavior:'instant'});}));
  }
  function componentHTML(id) {
    const c=C.components[id]; if (!c) return '';
    const offline = Array.isArray(c.offline) ? `<ul>${c.offline.map(item=>`<li>${esc(item)}</li>`).join('')}</ul>` : `<p>${esc(c.offline)}</p>`;
    const technicalDetails = window.POS_TECH_UI?.componentEvidenceHTML(id,c.status==='proposed'?[]:c.sources)||'';
    const references = technicalDetails && c.status!=='proposed' ? '' : `<details class="detail-section"><summary>${c.tech.length?'Tecnología y evidencia':'Fuentes'}</summary>${c.tech.length?`<div class="tag-list">${c.tech.map(t=>`<span class="tag">${esc(t)}</span>`).join('')}</div>`:''}<ul class="source-list">${c.sources.map(s=>`<li>${sourceLink(s)}</li>`).join('')}</ul></details>`;
    const proposalOverride = state.chapter==='propuesta' && ['ui','ax'].includes(id) ? '<div class="notice">Este componente aparece como contexto. La ficha describe el sistema actual; su adaptación futura debe validarse.</div>' : '';
    return `<div class="inspector-kind">${esc(icons[c.kind] || c.kind)} <span>·</span> ${esc(c.place)}</div>${badge(c.status)}<h2 class="inspector-title">${esc(c.title)}</h2><p class="inspector-subtitle">${esc(c.subtitle)}</p><p class="inspector-summary">${esc(c.description)}</p>${componentConnections(id)}${technicalDetails}${proposalOverride}<section class="detail-section"><h3>Qué hace</h3><ul>${c.responsibilities.map(t=>`<li>${esc(t)}</li>`).join('')}</ul></section><section class="detail-section offline-detail"><h3>Si no hay conexión</h3>${offline}</section>${references}`;
  }
  function selectComponent(id, user = false) {
    if (!C.components[id]) return;
    state.selected=id;
    if ($('#inspector')) {
      $('#inspector').innerHTML=componentHTML(id);
      $$('.diagram-canvas [data-node]').forEach(el=>{el.classList.toggle('is-selected',el.dataset.node===id);el.setAttribute('aria-pressed',String(el.dataset.node===id));});
      $$('[data-component]').forEach(el=>el.setAttribute('aria-pressed',String(el.dataset.component===id)));
      if (user) announce(`Detalle de ${C.components[id].title}. ${C.statusLabels[C.components[id].status]}.`);
      if (user && innerWidth<=1100) {
        $('#inspector').setAttribute('tabindex','-1'); $('#inspector').focus({preventScroll:true});
        $('#inspector').scrollIntoView({behavior:state.reduced?'instant':'smooth',block:'start'});
      }
    } else openModal(C.components[id].title,componentHTML(id));
  }
  function wireDiagrams(root=document) {
    $$('.diagram-canvas',root).forEach(canvas=>{
      const svg=$('svg',canvas); if (svg) {svg.setAttribute('role','group'); svg.removeAttribute('height'); svg.setAttribute('width','100%');}
      $$('[data-node]',canvas).forEach(el=>{
        el.setAttribute('role','button'); el.setAttribute('tabindex','0'); el.setAttribute('aria-pressed','false');
        el.setAttribute('aria-label','Explorar '+(C.components[el.dataset.node]?.title||el.dataset.node));
        el.addEventListener('click',()=>selectComponent(el.dataset.node,true));
        el.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();selectComponent(el.dataset.node,true);}});
      });
    });
  }
  function activeFlow() { return state.chapter==='venta'?'sale':state.chapter==='datos'?state.dataMode:null; }
  function updateFlow() {
    const key=activeFlow(); if(!key||!$('#step-title')) return;
    const steps=flowDefs[key],step=steps[state.flowStep];
    $('#step-count').textContent=`${String(state.flowStep+1).padStart(2,'0')} / ${String(steps.length).padStart(2,'0')}`;
    $('#step-title').textContent=step.title; $('#step-description').textContent=step.text;
    $$('[data-flow-step]').forEach(el=>el.setAttribute('aria-pressed',String(Number(el.dataset.flowStep)===state.flowStep)));
    $$('.diagram-canvas [data-node]').forEach(el=>{el.classList.toggle('is-active',step.nodes.includes(el.dataset.node));el.classList.toggle('is-dimmed',!step.nodes.includes(el.dataset.node));});
    const pairs=[step.nodes];
    if(key==='sale'&&state.flowStep===3)pairs.push(['branch','posting']);
    if(key==='masters'&&state.flowStep===1)pairs.push(['upstream','download']);
    $$('.diagram-canvas .flowchart-link').forEach(el=>el.classList.toggle('is-active',pairs.some(([a,b])=>el.id.startsWith(`L_${a}_${b}_`)||el.id.startsWith(`L_${b}_${a}_`))));
    if (step.states) $('#flow-states').innerHTML=['Venta local','Documento fiscal','Integración ERP'].map((label,i)=>`<div><span>${label}</span><strong>${esc(step.states[i])}</strong></div>`).join('');
  }
  const labSteps=[
    {title:'Todo comienza conectado.',desc:'Corta la conexión con el centro. La red local y la base de la sucursal seguirán disponibles en este ejemplo.',action:'1. Cortar Internet'},
    {title:'La sucursal perdió Internet.',desc:'En el diseño propuesto, una venta permitida puede usar reglas y datos vigentes. Registrarás DEMO-001 junto a su evento, en una misma transacción local.',action:'2. Registrar venta permitida'},
    {title:'Guardada localmente; integración pendiente.',desc:'La venta y la outbox sobreviven como datos durables. Aún no se ha enviado nada al centro. La fiscalidad y los pagos externos tienen reglas propias.',action:'3. Reconectar con el centro'},
    {title:'Volvió la conexión. Falta entregar.',desc:'Reconectar no equivale a sincronizar. El publicador conserva la identidad del evento y debe recibir un acuse durable del receptor.',action:'4. Entregar evento al centro'},
    {title:'El receptor aplicó el evento una vez.',desc:'Inbox + efecto local se registran juntos. Puedes repetir el envío: el contador central sigue en uno. El ERP todavía necesita su propio resultado.',action:'5. Simular confirmación ERP'},
    {title:'Cada etapa conserva su resultado.',desc:'La operación tiene confirmación ERP en este escenario de éxito. Si la respuesta fuera incierta, habría que consultar y conciliar antes de repetir un efecto externo.',action:'Volver a empezar'}
  ];
  function updateOffline() {
    const n=state.offline,s=labSteps[n],connected=n===0||n>=3;
    $('#actual-network').textContent=connected?'Conectada':'Sin Internet';
    $('#actual-price').textContent=connected?'Servicio remoto requerido':'Puede bloquear el pago';
    $('#demo-local').textContent=n>=2?'DEMO-001 · persistida':'Sin operación';
    $('#demo-outbox').textContent=n>=4?'1 evento · acuse central':n>=2?'1 evento · pendiente':'Sin pendientes';
    $('#demo-central').textContent=n>=4?'1 · identidad única':'0';
    $('#demo-erp').textContent=n===5?'Confirmado en el ejemplo':n>=2?'Pendiente':'Sin operación';
    $('#lab-step').textContent=`PASO ${n+1} DE 6`;
    $('#lab-title').textContent=s.title;$('#lab-description').textContent=s.desc;
    $('#offline-next').textContent=s.action; $('#offline-replay').hidden=n<4;
    const events=[['00','Conexión disponible'],...(n>=1?[['01','Internet desconectado']]:[]),...(n>=2?[['02','Commit local: venta + outbox']]:[]),...(n>=3?[['03','Conexión restablecida']]:[]),...(n>=4?[['04','Inbox + efecto central: 1 registro']]:[]),...(state.replay?[['↺','Mismo evento recibido: efecto omitido']]:[]),...(n>=5?[['05','Confirmación ERP de ejemplo']]:[])];
    $('#event-log').innerHTML=events.map(([idx,text])=>`<div><span>${idx}</span>${text}</div>`).join('');
    if(state.replay) $('#lab-description').textContent='Reenvío reconocido por su identidad. Sigue habiendo una venta local y un registro central. Esto protege el efecto central; no demuestra deduplicación automática dentro del ERP.';
  }
  function updateComparison() { const c=C.comparisons[state.compare]; $('#comparison-detail').innerHTML=`<div class="comparison-grid"><div class="comparison-card before"><span class="card-kicker">HOY</span><p>${esc(c.before)}</p></div><div class="comparison-card after"><span class="card-kicker">PROPUESTO</span><p>${esc(c.after)}</p></div></div><p class="comparison-caveat"><strong>Condición:</strong> ${esc(c.caveat)}</p>`; $$('[data-compare]').forEach(el=>el.setAttribute('aria-pressed',String(Number(el.dataset.compare)===state.compare))); }
  function updateCountry() {const c=C.countries[state.country]; $('#country-detail').innerHTML=`<strong>${esc(c.name)} / ${esc(c.erp)}</strong><p>${esc(c.detail)}</p>`;$$('[data-country]').forEach(el=>el.setAttribute('aria-pressed',String(el.dataset.country===state.country)));}
  function updateRfidCase() {
    const s=C.rfidScenarios.find(x=>x.id===state.rfidCase); if(!s||!$('#rfid-case')) return;
    const grouped={};
    state.rfidSeen.forEach(id=>{const item=C.rfidDemo.mapping[id];if(item)grouped[item.sku]=(grouped[item.sku]||0)+item.units;});
    const units=Object.values(grouped).reduce((sum,n)=>sum+n,0);
    const lab=s.id==='checkout'?`<section class="rfid-lab" aria-label="Laboratorio sintético de lectura RFID"><div class="rfid-lab-label"><span class="eyebrow">EJEMPLO SINTÉTICO / SIN LECTOR NI VENTA REAL</span><p>Solo aquí se supone un tag por unidad y mapeo validado. Tres tags no garantizan tres artículos válidos en otros casos.</p></div><div class="rfid-metrics"><div><strong id="rfid-observations">${state.rfidReads}</strong><span>Lecturas recibidas</span></div><div><strong id="rfid-unique">${state.rfidSeen.length}</strong><span>Tags únicos en sesión</span></div><div><strong id="rfid-skus">${Object.keys(grouped).length}</strong><span>SKU distintos candidatos</span></div><div class="rfid-cart"><strong id="rfid-cart">${state.rfidConfirmed?units:0}</strong><span>Unidades en carrito simulado</span></div></div><div class="rfid-lab-body"><div><span class="rfid-small-label">CANDIDATOS · NO SON COBROS</span><ul class="rfid-candidates">${state.rfidSeen.length?state.rfidSeen.map(id=>`<li><code>${esc(id)}</code><span>${esc(C.rfidDemo.mapping[id].sku)} · 1 unidad</span></li>`).join(''):'<li class="rfid-empty">Aún no se han leído etiquetas.</li>'}</ul>${state.rfidSeen.length?`<p class="rfid-quantities" id="rfid-quantities">${Object.entries(grouped).map(([sku,qty])=>`${esc(sku)}: ${qty} ${qty===1?'unidad':'unidades'}`).join(' · ')}</p>`:''}</div><div class="rfid-session-note"><strong>${state.rfidConfirmed?'Sesión cerrada y selección fijada':state.rfidSeen.length?'Falta revisar la selección':'La lectura todavía no comenzó'}</strong><p id="rfid-result">${state.rfidConfirmed?'Se simularon revisión y validación del comando normal. El carrito de ejemplo tiene tres unidades en dos líneas. No hay pago ni emisión; las lecturas tardías no modifican esta selección.':state.rfidSeen.length?'Las lecturas repetidas conservan tres candidatos. Dos tags distintos de SKU-A representan dos unidades en este ejemplo. El carrito permanece vacío hasta revisión y validación.':'Presiona Leer zona: llegarán cinco observaciones de tres etiquetas sintéticas asociadas a dos SKU.'}</p></div></div><div class="rfid-controls">${button(state.rfidReads?'Repetir lectura del lote':'Leer zona','rfid-read',state.rfidConfirmed?'disabled':'','primary')}${button(state.rfidConfirmed?'Selección ya validada en el ejemplo':'Simular revisión y validación','rfid-confirm',!state.rfidSeen.length||state.rfidConfirmed?'disabled':'')}${button('Reiniciar','rfid-reset','','secondary small')}</div><p class="rfid-session-limit">Que una etiqueta deje de leerse no demuestra que se retiró el objeto. La sesión y la cesta requieren cierre y revisión explícitos; el laboratorio no simula radio real ni retiro automático.</p></section>`:`<ol class="rfid-scenario-steps">${s.steps.map(step=>`<li>${esc(step)}</li>`).join('')}</ol>`;
    $('#rfid-case').innerHTML=`<h3 id="rfid-case-title">${esc(s.title)}</h3><p class="rfid-intro">${esc(s.description)}</p>${lab}<p class="rfid-boundary">${esc(s.boundary)}</p>`;
    $$('[data-rfid-case]').forEach(el=>el.setAttribute('aria-pressed',String(el.dataset.rfidCase===state.rfidCase)));
  }
  function updateAiCase() {
    const c=C.aiCases.find(x=>x.id===state.aiCase); if(!c||!$('#ai-case-detail')) return;
    const offline=state.aiNetwork==='offline';
    const mode=!state.aiEvidence?'abstain':offline?(c.local?'local':'disabled'):'suggest';
    const labels={abstain:'Me abstengo: falta evidencia o acceso vigente',local:'Sigue la consulta local, sin un modelo',disabled:'Ayuda remota deshabilitada',suggest:'Ayuda propuesta, pendiente de verificar'};
    const outcome=!state.aiEvidence?'No hay evidencia utilizable para esta respuesta. No se muestra contenido restringido ni se inventa una conclusión. Se debe obtener una fuente vigente y permiso válido.':offline?c.offline:c.online;
    $('#ai-case-detail').innerHTML=`<div class="ai-case-heading"><span class="eyebrow">${esc(c.priority)}</span><h3 id="ai-case-title">${esc(c.title)}</h3><p>${esc(c.purpose)}</p></div><blockquote class="ai-example"><span>EJEMPLO SINTÉTICO</span><p>${esc(c.example)}</p></blockquote><div class="ai-outcome ${mode}" data-ai-mode="${mode}"><strong id="ai-outcome-state">${labels[mode]}</strong><p id="ai-outcome-text">${esc(outcome)}</p><small>${state.aiEvidence?'Supuesto: fuente autorizada y versión vigente verificadas para este usuario.':'Sin fuente verificable o permiso vigente. La conectividad no resuelve esa falta.'}</small></div><p class="ai-boundary"><strong>Límite del servicio.</strong> ${esc(c.boundary)}</p><details class="ai-case-evaluation"><summary>Datos y evaluación necesarios</summary><dl><div><dt>Preparar</dt><dd>${esc(c.inputs)}</dd></div><div><dt>Medir</dt><dd>${esc(c.metric)}</dd></div></dl><p>Las metas, el coste y el retorno del piloto deben medirse; no hay SLA ni ROI aprobados.</p>${c.reference?`<p class="source-list">${sourceLink(c.reference)}</p>`:""}</details>`;
    $$('[data-ai-case]').forEach(el=>el.setAttribute('aria-pressed',String(el.dataset.aiCase===state.aiCase)));
    $$('[data-ai-network]').forEach(el=>el.setAttribute('aria-pressed',String(el.dataset.aiNetwork===state.aiNetwork)));
  }
  function updateProviderCase() {
    const c=C.providerScenarios.find(x=>x.id===state.providerCase); if(!c||!$('#provider-case')) return;
    const binding=c.id==='timeout'?`<div class="provider-binding"><div class="binding-heading"><strong>Prueba el cambio de perfil</strong><span>Ejemplo de pago · A y B son ficticios</span></div><dl><div><dt>Operación e intentos pendientes</dt><dd id="binding-pending">Proveedor A · resultado desconocido</dd></div><div><dt>Operaciones nuevas independientes</dt><dd id="binding-new">${state.providerChanged?'Proveedor B · perfil nuevo':'Proveedor A · perfil actual'}</dd></div></dl><button class="btn secondary small" data-action="provider-profile" aria-pressed="${state.providerChanged}">${state.providerChanged?'Restablecer el perfil de nuevas operaciones':'Simular cambio a B para operaciones nuevas'}</button><p id="binding-explanation" role="status">${state.providerChanged?'El pendiente conserva A, su comercio y referencias. Consultar solo si A lo admite; de lo contrario, mantener la incertidumbre y resolver operativamente. No cobrar mediante B.':'El perfil aún apunta a A. Puedes cambiarlo y observar qué ocurre con la operación pendiente.'}</p></div>`:'';
    $('#provider-case').innerHTML=`<div class="provider-case-grid"><div class="provider-story"><h3 id="provider-case-title">${esc(c.title)}</h3><p>${esc(c.description)}</p><ol class="provider-steps">${c.steps.map(step=>`<li>${esc(step)}</li>`).join('')}</ol></div><dl class="capability-state" aria-label="Tres comprobaciones diferentes">${[c.capability,c.enabled,c.available].map(([label,desc])=>`<div><dt>${esc(label)}</dt><dd>${esc(desc)}</dd></div>`).join('')}</dl></div>${binding}<p class="provider-boundary">${esc(c.boundary)}</p><div class="provider-inspect"><span>Explora las piezas:</span>${c.components.map(id=>`<button class="btn secondary small" data-action="inspect-modal" data-component-id="${id}">${esc(C.components[id].title)}</button>`).join('')}</div>`;
    $$('[data-provider-case]').forEach(el=>el.setAttribute('aria-pressed',String(el.dataset.providerCase===state.providerCase)));
  }
  function updateQuiz() {
    let correct=0;
    C.questions.forEach((q,i)=>{
      const choice=state.answers[i],selected=q.options[choice]; if(selected?.correct)correct++;
      $$(`[data-question="${i}"]`).forEach(el=>{const checked=Number(el.dataset.answer)===choice;el.setAttribute('aria-pressed',String(checked));el.classList.toggle('correct',checked&&selected.correct);el.classList.toggle('incorrect',checked&&!selected.correct);});
      $(`#feedback-${i}`).textContent=selected?(selected.correct?'Correcto. ':'Inténtalo otra vez. ')+selected.feedback:'';
    });
    $('#quiz-score').textContent=`${correct} de ${C.questions.length} resueltas`;
  }
  function openModal(title, html) { updateFlow();$('#modal-title').textContent=title;$('#modal-body').innerHTML=html;const modal=$('#modal');if(!modal.open)modal.showModal();$('#modal-body').scrollTop=0; }
  function renderGlossary(query='') {
    const norm=v=>v.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();const terms=C.glossary.filter(t=>norm(t.term+' '+t.definition).includes(norm(query)));
    $('#glossary-results').innerHTML=terms.length?terms.map(t=>`<article class="glossary-item"><h3 class="term">${esc(t.term)}</h3><p>${esc(t.definition)}</p><p class="term-example">${esc(t.example)}</p></article>`).join(''):'<p>No hay coincidencias. Prueba con otra palabra.</p>';
    $('#glossary-count').textContent=`${terms.length} términos`;
  }
  function glossary(query='') {openModal('Un glosario para seguir la conversación',`<label class="search-label" for="glossary-search">Buscar un concepto</label><input id="glossary-search" type="search" placeholder="Por ejemplo: outbox, ERP, ACL…" autocomplete="off" value="${esc(query)}"><p id="glossary-count" class="small-note" role="status"></p><div class="glossary-list" id="glossary-results"></div>`);renderGlossary(query);$('#glossary-search').focus();}
  function sources() {openModal('Fuentes, evidencia y alcance',`<p>${esc(C.meta.scope)}</p><p>${esc(C.meta.evidenceNote)}</p><h3>Cómo leer las etiquetas</h3><div class="evidence-list">${Object.entries(C.statusLabels).map(([s,t])=>`<div>${badge(s)}<span>${esc({code:'Revisión de versiones concretas de los repositorios.',reported:'Antecedente proporcionado por el equipo o presentación.',proposed:'Diseño objetivo o candidato, todavía por validar.',pending:'Falta evidencia suficiente para afirmarlo.',historical:'Referencia conservada, sin asumir que siga operativa.'}[s])}</span></div>`).join('')}</div><h3>Documentación del proyecto</h3><ul class="source-list">${C.sourceIndex.map(s=>`<li>${sourceLink(s)}</li>`).join('')}</ul><p class="small-note">Los documentos se abren en una nueva pestaña. Las fuentes del repositorio contienen referencias por commit. No se ejecutaron servicios corporativos para construir este tutorial.</p><h3>Imagen original de Chile</h3><a href="../docs/referencias/arquitectura-actual-chile.png" target="_blank" rel="noopener"><img class="source-image" src="../docs/referencias/arquitectura-actual-chile.png" alt="Imagen histórica de la arquitectura de caja en Chile, con presentación, servicios, integración y ERP"></a><p class="small-note">La imagen conserva la arquitectura original. El proveedor vigente para cheques es Orsan.</p>`);}
  function help() {openModal('Cómo usar POS Atlas',`<div class="help-grid"><div><h3>Para presentar</h3><p>Activa <strong>Modo exposición</strong> para ampliar el contenido. La pantalla completa se activa por separado. Usa las flechas del teclado para cambiar de capítulo.</p><h3>Para explorar</h3><p>Selecciona una aplicación o base para abrir su ficha. Los controles permiten pausar, reiniciar o elegir cualquier paso de los recorridos.</p></div><div><h3>Teclado</h3><dl class="shortcuts"><dt>← / →</dt><dd>Capítulo anterior / siguiente</dd><dt>G</dt><dd>Glosario</dd><dt>P</dt><dd>Modo exposición</dd><dt>Esc</dt><dd>Cerrar la ventana de ayuda o salir del modo exposición</dd></dl></div></div><label class="motion-toggle"><input type="checkbox" id="motion-toggle" ${state.reduced?'checked':''}> Reducir movimiento de los diagramas</label><p class="small-note">Se respeta la preferencia del sistema. Nada avanza automáticamente al abrir un capítulo; la reproducción siempre la inicias tú.</p><div class="notice">El laboratorio es una explicación interactiva, no una prueba del POS. No envía información ni ejecuta ventas reales.</div>`);}
  function togglePresent() {state.presenting=!state.presenting;document.body.classList.toggle('presenting',state.presenting);const b=$('[data-action="present"]');b.setAttribute('aria-pressed',String(state.presenting));b.textContent=state.presenting?'Salir de exposición':'Modo exposición';notify(state.presenting?'Modo exposición: usa ← y → para navegar. P vuelve al modo exploración.':'Modo exploración activado.');}
  function chapterOffset(n) {const idx=chapters.findIndex(c=>c.id===state.chapter);if(chapters[idx+n])setHash(chapters[idx+n].id);}
  async function action(name,el) {
    switch(name) {
      case 'next':chapterOffset(1);break;
      case 'previous':chapterOffset(-1);break;
      case 'home':setHash('mapa');break;
      case 'glossary':glossary();break;
      case 'term':glossary(el.dataset.term);break;
      case 'sources':sources();break;
      case 'help':help();break;
      case 'close-modal':$('#modal').close();break;
      case 'present':togglePresent();break;
      case 'fullscreen':try {if(document.fullscreenElement)await document.exitFullscreen();else if(document.documentElement.requestFullscreen)await document.documentElement.requestFullscreen();else notify('Pantalla completa no disponible en este navegador. Puedes usar F11.');}catch{notify('El navegador no permitió pantalla completa. Puedes usar F11.');}break;
      case 'offline-next':state.offline=(state.offline+1)%6;state.replay=false;updateOffline();break;
      case 'offline-reset':state.offline=0;state.replay=false;updateOffline();break;
      case 'offline-replay':state.replay=true;updateOffline();announce('Reenvío reconocido: un solo registro central.');break;
      case 'inspect-modal':openModal(C.components[el.dataset.componentId].title,componentHTML(el.dataset.componentId));break;
      case 'quiz-reset':state.answers={};updateQuiz();break;
      case 'provider-profile':state.providerChanged=!state.providerChanged;updateProviderCase();$('[data-action="provider-profile"]').focus({preventScroll:true});break;
      case 'rfid-read':if(state.rfidConfirmed)break;state.rfidReads+=C.rfidDemo.observations.length;state.rfidSeen=[...new Set([...state.rfidSeen,...C.rfidDemo.observations])];updateRfidCase();$('[data-action="rfid-read"]').focus({preventScroll:true});announce('Lecturas: '+state.rfidReads+'. Tres tags únicos y dos SKU candidatos. El carrito sigue sin confirmar.');break;
      case 'rfid-confirm':if(!state.rfidSeen.length||state.rfidConfirmed)break;state.rfidConfirmed=true;updateRfidCase();$('#rfid-result').setAttribute('tabindex','-1');$('#rfid-result').focus({preventScroll:true});announce('Selección simulada: tres unidades, dos líneas. No se realizó pago ni emisión.');break;
      case 'rfid-reset':state.rfidReads=0;state.rfidSeen=[];state.rfidConfirmed=false;updateRfidCase();$('[data-action="rfid-reset"]').focus({preventScroll:true});announce('Sesión RFID de ejemplo reiniciada.');break;
    }
  }
  document.addEventListener('click',e=>{
    const el=e.target.closest('button,a[data-action]'); if(!el) return;
    if(el.dataset.mapView) chooseMapView(el.dataset.mapView);
    else if(el.dataset.action) action(el.dataset.action,el);
    else if(el.dataset.chapter) setHash(el.dataset.chapter);
    else if(el.dataset.component) selectComponent(el.dataset.component,true);
    else if(el.dataset.flowStep!==undefined){state.flowStep=Number(el.dataset.flowStep);updateFlow();}
    else if(el.dataset.dataMode){state.dataMode=el.dataset.dataMode;state.flowStep=0;state.selected=state.dataMode==='masters'?'mpos':'clientapi';render();$('.df-original-context').open=true;$(`[data-data-mode="${state.dataMode}"]`).focus({preventScroll:true});}
    else if(el.dataset.compare!==undefined){state.compare=Number(el.dataset.compare);updateComparison();}
    else if(el.dataset.country){state.country=el.dataset.country;updateCountry();}
    else if(el.dataset.providerCase){state.providerCase=el.dataset.providerCase;updateProviderCase();announce(C.providerScenarios.find(c=>c.id===state.providerCase).title);}
    else if(el.dataset.rfidCase){state.rfidCase=el.dataset.rfidCase;updateRfidCase();announce(C.rfidScenarios.find(c=>c.id===state.rfidCase).title);}
    else if(el.dataset.aiCase){state.aiCase=el.dataset.aiCase;updateAiCase();announce($('#ai-case-title').textContent+'. '+$('#ai-outcome-state').textContent);}
    else if(el.dataset.aiNetwork){state.aiNetwork=el.dataset.aiNetwork;updateAiCase();announce($('#ai-outcome-state').textContent);}
    else if(el.dataset.question!==undefined){state.answers[el.dataset.question]=Number(el.dataset.answer);updateQuiz();}
  });
  document.addEventListener('input',e=>{if(e.target.id==='glossary-search')renderGlossary(e.target.value);});
  document.addEventListener('change',e=>{
    if(e.target.id==='mobile-chapter')setHash(e.target.value);
    if(e.target.id==='ix-flow'&&state.chapter==='mapa')history.replaceState(null,'','#mapa?vista=peticiones&flujo='+encodeURIComponent(e.target.value));
    if(e.target.id==='motion-toggle'){state.reduced=e.target.checked;document.body.classList.toggle('reduce-motion',state.reduced);updateFlow();}
    if(e.target.id==='ai-evidence'){state.aiEvidence=e.target.checked;updateAiCase();announce($('#ai-outcome-state').textContent);}
  });
  document.addEventListener('keydown',e=>{
    if(e.defaultPrevented || e.ctrlKey||e.altKey||e.metaKey) return;
    if($('#modal').open) { if(e.key==='Escape'){e.preventDefault();$('#modal').close();} return; }
    const tab=e.target.closest('[data-map-view]');
    if(tab&&['ArrowLeft','ArrowRight','Home','End'].includes(e.key)){
      e.preventDefault();const index=mapViews.findIndex(v=>v.id===tab.dataset.mapView);
      const next=e.key==='Home'?0:e.key==='End'?mapViews.length-1:(index+(e.key==='ArrowRight'?1:-1)+mapViews.length)%mapViews.length;
      chooseMapView(mapViews[next].id);return;
    }
    if(e.target.closest('input,textarea,select,[contenteditable="true"]'))return;
    if(e.target.closest('.tech-diagram-scroll,.df-map-scroll, .ops-map-scroll, .ix-viewer, .repo-viewport'))return;
    if(e.key==='Escape'&&state.presenting){togglePresent();return;}
    if(e.key.toLowerCase()==='g'){e.preventDefault();glossary();return;}
    if(e.key.toLowerCase()==='p'){e.preventDefault();togglePresent();return;}
    // Arrow keys remain available to focused diagram nodes and native controls.
    if(e.target.closest('button,a,[role="button"],summary'))return;
    if(e.key==='ArrowRight'){e.preventDefault();chapterOffset(1);}
    if(e.key==='ArrowLeft'){e.preventDefault();chapterOffset(-1);}
  });
  document.addEventListener('fullscreenchange',()=>{$('[data-action="fullscreen"]').setAttribute('aria-label',document.fullscreenElement?'Salir de pantalla completa':'Pantalla completa');});
  window.addEventListener('hashchange',()=>navigate(location.hash.slice(1)));
  mediaMotion.addEventListener('change',e=>{state.reduced=e.matches;document.body.classList.toggle('reduce-motion',state.reduced);updateFlow();});
  $('#modal').addEventListener('click',e=>{if(e.target===$('#modal')){const r=e.target.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)e.target.close();}});
  document.body.classList.toggle('reduce-motion',state.reduced);
  if(!C||!D){$('#main').innerHTML='<p class="notice warning">Faltan archivos de la presentación. Abre index.html junto a content.js, diagrams.js y app.js.</p>';return;}
  navigate(location.hash.slice(1),false);
})();
