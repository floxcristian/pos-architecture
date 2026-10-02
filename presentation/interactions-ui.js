/* Application and data interaction viewer. All diagrams are local HTML/SVG; no API is invoked. */
(() => {
  'use strict';
  const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const all = () => window.POS_INTERACTIONS_VIEW?.all() || [];
  const certainty = {code:'Observado en código',reported:'Informado por el equipo',unknown:'Tramo por confirmar',proposed:'Contrato propuesto'};
  const kind = {component:'Aplicación',table:'Tabla / datos',external:'Sistema externo'};
  const zones = {terminal:'Puesto de caja',branch:'Sucursal',central:'Integración central',external:'Sistema externo',erp:'ERP / adaptadores',device:'Dispositivo local'};
  const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches || document.body.classList.contains('reduce-motion');
  const link = s => /^(\.\.\/docs\/|https:\/\/github\.com\/)/.test(s.url) ? `<a href="${esc(s.url)}" target="_blank" rel="noopener">${esc(s.label)} ↗</a>` : esc(s.label);
  const sources = items => `<details class="ix-sources"><summary>Evidencia y referencias (${items.length})</summary><ul>${items.map(s=>`<li>${link(s)}</li>`).join('')}</ul></details>`;
  let dispose = () => {};
  function html(chapter) {
    if (!['mapa','propuesta'].includes(chapter)) return '';
    return `<section class="ix-viewer" id="interaction-viewer" aria-labelledby="ix-title"><div class="ix-heading"><div><span class="eyebrow">APLICACIONES → LLAMADAS → DATOS</span><h2 id="ix-title">Quién llama a quién.</h2><p>Sigue llamadas entre aplicaciones, bases y tablas. Selecciona un recorrido y pulsa una aplicación o conexión para consultar su implementación.</p></div><button class="btn secondary" data-ix-expand>Ampliar visor</button></div><div class="ix-picker"><label for="ix-flow">Recorrido</label><select id="ix-flow"></select><span id="ix-scope"></span></div><details class="ix-overview"><summary>Alcance del recorrido</summary><p class="ix-summary" id="ix-summary"></p><p class="ix-overview-boundary" id="ix-flow-boundary"></p></details><div class="ix-controls"><div class="ix-modes" role="group" aria-label="Vista del recorrido"><button data-ix-mode="step" aria-pressed="true">Seguir paso</button><button data-ix-mode="all" aria-pressed="false">Aplicaciones y datos</button><button data-ix-mode="sequence" aria-pressed="false">Secuencia</button></div><div class="ix-zoom" role="group" aria-label="Escala del diagrama"><button data-ix-zoom="fit" aria-pressed="true">Ajustar</button><button data-ix-zoom="100" aria-pressed="false">100 %</button><button data-ix-zoom="out" aria-label="Alejar diagrama">−</button><output id="ix-scale" aria-label="Escala actual"></output><button data-ix-zoom="in" aria-label="Acercar diagrama">+</button></div></div><div class="ix-story"><div><span class="eyebrow" id="ix-counter"></span><h3 id="ix-step-title"></h3><p id="ix-step-text"></p></div><div class="ix-transport"><button class="btn secondary" data-ix-prev aria-label="Paso anterior">←</button><button class="btn primary" data-ix-next>Siguiente →</button><button class="btn secondary" data-ix-play aria-pressed="false">Reproducir</button></div></div><div class="ix-step-list" id="ix-steps" aria-label="Elegir paso"></div><div class="ix-call-picker"><label for="ix-call">Conexión de este paso</label><select id="ix-call"></select></div><div class="ix-board"><div class="ix-board-caption"><span id="ix-board-caption"></span><span>Aplicación · <span class="ix-db-key">Tabla</span> · <span class="ix-unknown-key">Por confirmar</span></span></div><div class="ix-viewport" tabindex="0" role="region" aria-label="Diagrama interactivo; desplaza con las flechas o arrastra el fondo"><div class="ix-size"><div class="ix-surface"></div></div></div><div class="ix-board-footer"><span>Arrastra el fondo o desplaza para explorar. Ajustar muestra el conjunto; 100 % amplía las etiquetas.</span><button class="btn secondary small" data-ix-center>Centrar paso</button></div></div><div id="ix-detail" class="ix-detail" aria-live="polite" aria-atomic="true"></div><details class="ix-relations"><summary>Explorar todas las relaciones del recorrido</summary><div id="ix-relation-list"></div></details><p class="ix-limit" id="ix-limit"></p><p class="ix-doc"><a href="../docs/visor-interacciones-componentes.md" target="_blank" rel="noopener">Cómo leer estos diagramas y qué evidencia conservan ↗</a></p></section>`;
  }
  function mount(chapter) {
    dispose();
    const root = document.querySelector('#interaction-viewer'); if (!root) return;
    const isEcosystemViewer=Boolean(root.closest('#map-panel-peticiones'));
    const $ = s => root.querySelector(s), $$ = s => [...root.querySelectorAll(s)];
    const flows = all().filter(f=>f.mode===(chapter==='propuesta'?'proposed':'current')); if (!flows.length) return;
    const state = {flow:flows[0],step:0,mode:innerWidth>=1000?'all':'step',zoom:'fit',scale:1,edge:null,node:null,timer:null,running:false};
    let dimensions={width:800,height:500}, currentLayout=null, resizeFrame=0, dialog=null, placeholder=null;
    const viewport=$('.ix-viewport'), surface=$('.ix-surface'), size=$('.ix-size');
    const n = id => state.flow.nodes.find(n=>n.id===id), g = id => state.flow.groups.find(g=>g.id===id), edge = id => state.flow.edges.find(e=>e.id===id);
    const step = () => state.flow.steps[state.step];
    const activeEdges = () => [edge(state.edge)||edge(step().edges[0])].filter(Boolean);
    const nodeName = id => n(id)?.title || id;
    const groupName = id => g(n(id)?.group)?.title || '';
    const stop = () => { clearInterval(state.timer); state.timer=null; state.running=false; root.classList.remove('ix-playing'); $('[data-ix-play]').textContent='Reproducir'; $('[data-ix-play]').setAttribute('aria-pressed','false'); };
    $('#ix-flow').innerHTML=flows.map(f=>`<option value="${esc(f.id)}">${esc(f.title)}</option>`).join('');
    function nodeHTML(node,box) {
      const selected=state.node===node.id, active=activeEdges().some(e=>e.from===node.id||e.to===node.id);
      return `<button class="ix-node ix-${esc(node.kind)} ${active?'ix-active':''}" data-ix-node="${esc(node.id)}" aria-pressed="${selected}" style="left:${box.x}px;top:${box.y}px;width:${box.w}px;${box.h?'height:'+box.h+'px':''}"><span class="ix-node-kind">${kind[node.kind]||'Aplicación'}</span><strong>${esc(node.title)}</strong><span class="ix-node-subtitle">${esc(node.subtitle)}</span></button>`;
    }
    function groupHead(group) {
      return `<span>${esc(zones[group.zone]||group.zone)}</span><h4>${esc(group.title)}</h4>`;
    }
    function labelHTML(e,i,maxWidth) {
      const uncertain=e.certainty==='unknown'||e.certainty==='reported';
      return `<button xmlns="http://www.w3.org/1999/xhtml" class="ix-edge-label" data-ix-edge="${esc(e.id)}" aria-pressed="${state.edge===e.id}" style="max-width:${maxWidth}px"><span>${i+1} · ${esc(e.protocol)}</span><strong>${esc(e.label)}</strong>${uncertain?'<em>POR CONFIRMAR</em>':''}</button>`;
    }
    // Measure the actual styled text in one hidden batch before routing arrows.
    // Widths remain bounded for reading; heights are never guessed from a line count.
    function measure(items) {
      const stage=document.createElement('div');stage.setAttribute('aria-hidden','true');stage.inert=true;
      stage.style.cssText='position:fixed;left:0;top:0;visibility:hidden;pointer-events:none;width:max-content;contain:layout style;';
      stage.innerHTML=items.map(item=>`<div>${item.html}</div>`).join('');root.append(stage);
      try {return Object.fromEntries(items.map((item,i)=>{const rect=stage.children[i].firstElementChild.getBoundingClientRect();return [item.id,{w:Math.ceil(rect.width),h:Math.ceil(rect.height)}];}));}
      finally {stage.remove();}
    }
    function componentLayout() {
      const relevant=new Set(activeEdges().flatMap(e=>[e.from,e.to]));
      const nodes=state.mode==='step'?state.flow.nodes.filter(n=>relevant.has(n.id)):state.flow.nodes;
      const groups=state.flow.groups.filter(g=>nodes.some(n=>n.group===g.id));
      const compact=viewport.clientWidth<600, boxes={}, groupBoxes={};
      const standalone=group=>{const items=nodes.filter(n=>n.group===group.id);return items.length===1&&items[0].kind!=='table';};
      const cols=compact?1:state.mode==='all'?Math.min(groups.length,viewport.clientWidth>=950?3:2):groups.length;
      const width=48+cols*320+(cols-1)*64, labelMax=Math.min(520,width-32);
      const measured=measure([
        ...groups.map(group=>({id:'g:'+group.id,html:`<div class="ix-group-head" style="width:318px">${groupHead(group)}</div>`})),
        ...nodes.map(node=>({id:'n:'+node.id,html:nodeHTML(node,{x:0,y:0,w:standalone(g(node.group))?320:294})})),
        ...activeEdges().map((e,i)=>({id:'e:'+e.id,html:labelHTML(e,i,labelMax)}))
      ]);
      const top=32+Math.max(...activeEdges().map(e=>measured['e:'+e.id].h));
      let maxBottom=0, nextTop=top, rowBottom=top;
      groups.forEach((group,i)=>{
        if(i>0&&i%cols===0)nextTop=rowBottom+28;
        const items=nodes.filter(n=>n.group===group.id), x=24+(i%cols)*384, y=nextTop;
        if(standalone(group)){
          const node=items[0],h=measured['n:'+node.id].h;boxes[node.id]={x,y,w:320,h};groupBoxes[group.id]={x,y,w:320,h,standalone:true};maxBottom=Math.max(maxBottom,y+h);rowBottom=Math.max(rowBottom,y+h);return;
        }
        const head=measured['g:'+group.id].h;
        let nodeY=y+head+12;
        items.forEach(node=>{const h=measured['n:'+node.id].h;boxes[node.id]={x:x+13,y:nodeY,w:294,h};nodeY+=h+10;});
        const height=nodeY-y+4;
        groupBoxes[group.id]={x,y,w:320,h:height,head};maxBottom=Math.max(maxBottom,y+height);rowBottom=Math.max(rowBottom,y+height);
      });
      const height=maxBottom+24;
      const groupHTML=groups.map(group=>{const b=groupBoxes[group.id];if(b.standalone)return '';return `<div class="ix-group" style="left:${b.x}px;top:${b.y}px;width:${b.w}px;height:${b.h}px"><div class="ix-group-head" style="height:${b.head}px">${groupHead(group)}</div></div>`;}).join('');
      const paths=activeEdges().map((e,i)=>{
        const a=boxes[e.from],b=boxes[e.to]; if(!a||!b)return '';
        const same=n(e.from).group===n(e.to).group;
        let sx,tx,sy=a.y+a.h*(e.from === e.to ? .35 : .5),ty=b.y+b.h*(e.from === e.to ? .75 : .5),route,labelX,labelY;
        const label=measured['e:'+e.id],channel=16+label.h/2;
        if(compact){sx=a.x+a.w;tx=b.x+b.w;route=`M ${sx} ${sy} H ${width-14} V ${ty} H ${tx+4}`;labelX=width/2;labelY=channel;}
        else if(same){sx=a.x+a.w;tx=b.x+b.w;const rail=sx+10;route=`M ${sx} ${sy} H ${rail} V ${channel} H ${a.x+40} V ${channel+8} H ${rail+8} V ${ty} H ${tx+4}`;labelX=a.x+a.w/2;labelY=channel;}
        else {const right=b.x>a.x;sx=right?a.x+a.w:a.x;tx=right?b.x:b.x+b.w;const sign=right?1:-1,railA=sx+sign*18,railB=tx-sign*18;route=`M ${sx} ${sy} H ${railA} V ${channel} H ${railB} V ${ty} H ${tx-sign*4}`;labelX=(railA+railB)/2;labelY=channel;}
        labelX=Math.max(label.w/2+12,Math.min(width-label.w/2-12,labelX));
        return wire(e,route,labelX,labelY,label,i);
      }).join('');
      return {width,height,boxes,html:groupHTML+svg(paths,width,height)+nodes.map(node=>nodeHTML(node,boxes[node.id])).join(''),stepY:0};
    }
    function wire(e,path,x,y,label,i) {
      const selected=state.edge===e.id, uncertain=e.certainty==='unknown'||e.certainty==='reported';
      return `<g class="ix-wire ${selected?'ix-selected':''} ${uncertain?'ix-uncertain':''}" data-ix-wire="${esc(e.id)}"><path class="ix-wire-line" d="${path}" marker-end="url(#ix-arrow)"/><path class="ix-wire-hit" d="${path}" data-ix-edge="${esc(e.id)}"/><foreignObject x="${x-label.w/2}" y="${y-label.h/2}" width="${label.w}" height="${label.h+1}">${labelHTML(e,i,label.w)}</foreignObject></g>`;
    }
    function svg(paths,width,height) { return `<svg class="ix-wires" width="${width}" height="${height}" aria-label="Conexiones entre aplicaciones y datos"><defs><marker id="ix-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M 0 1 L 9 5 L 0 9 z" fill="#087f70"/></marker></defs>${paths}</svg>`; }
    function sequenceLayout() {
      const groups=state.flow.groups, col=312, width=48+groups.length*col, positions=Object.fromEntries(groups.map((g,i)=>[g.id,24+i*col+col/2]));
      const rows=state.flow.steps.flatMap((s,si)=>s.edges.map(id=>({edge:edge(id),step:si}))).filter(row=>row.edge);
      const header=group=>`<span>${esc(zones[group.zone]||group.zone)}</span><h4>${esc(group.title)}</h4><small>${esc(group.repo)}</small>`;
      const rowBox=(node,x,y,active=false)=>`<button class="ix-seq-node ${node.kind==='table'?'ix-table':''} ${active?'ix-active':''}" data-ix-node="${esc(node.id)}" aria-pressed="${state.node===node.id}" style="left:${x-120}px;top:${y}px;width:240px"><span>${esc(node.kind==='component'?'Aplicación':g(node.group).title)}</span><strong>${esc(node.title)}</strong></button>`;
      const measured=measure([
        ...groups.map(group=>({id:'g:'+group.id,html:`<div class="ix-seq-group" style="width:288px">${header(group)}</div>`})),
        ...state.flow.nodes.map(node=>({id:'n:'+node.id,html:rowBox(node,120,0)})),
        ...rows.map((r,i)=>({id:'e:'+i,html:labelHTML(r.edge,i,n(r.edge.from).group===n(r.edge.to).group?300:520)}))
      ]);
      const headerBottom=16+Math.max(...groups.map(group=>measured['g:'+group.id].h)), boxes={};
      let nextY=headerBottom+20,stepY=nextY;
      let html=groups.map(group=>`<div class="ix-seq-group" style="left:${positions[group.id]-144}px;top:16px;width:288px">${header(group)}</div>`).join('');
      let paths='';
      rows.forEach((row,i)=>{
        const e=row.edge,from=n(e.from),to=n(e.to),sx=positions[from.group],tx=positions[to.group],same=sx===tx;
        const sign=tx>sx?1:-1,active=row.step===state.step,label=measured['e:'+i],a=measured['n:'+from.id],b=measured['n:'+to.id];
        const y=nextY,nodeTop=y+label.h+12,rowH=Math.max(a.h,b.h);
        const ay=same?nodeTop:nodeTop+(rowH-a.h)/2,by=same?ay+a.h+16:nodeTop+(rowH-b.h)/2;
        const cy=ay+a.h/2,ty=by+b.h/2;
        const route=same?`M ${sx+124} ${cy} H ${sx+148} V ${ty} H ${tx+124}`:`M ${sx+sign*124} ${cy} H ${tx-sign*124}`;
        paths+=`<g data-ix-seq-step="${row.step}" class="${active?'ix-seq-active':'ix-seq-muted'}">${wire(e,route,same?sx:(sx+tx)/2,y+label.h/2,label,i)}</g>`;
        html+=`<span class="ix-seq-number" style="top:${cy-8}px">${row.step+1}</span>`+rowBox(from,sx,ay,active)+rowBox(to,tx,by,active);
        nextY=Math.max(ay+a.h,by+b.h)+24;
        if(active){boxes[e.id]={x:Math.min(sx,tx)-130,y,w:Math.abs(tx-sx)+260,h:nextY-y};stepY=y;}
      });
      const height=nextY;
      const lines=groups.map(group=>`<path class="ix-lifeline" d="M ${positions[group.id]} ${16+measured['g:'+group.id].h} V ${height-12}"/>`).join('');
      return {width,height,boxes,html:html+svg(lines+paths,width,height),stepY};
    }
    function renderDiagram() {
      if(!root.isConnected||!viewport.clientWidth)return;
      currentLayout=state.mode==='sequence'?sequenceLayout():componentLayout(); dimensions=currentLayout;
      surface.innerHTML=currentLayout.html; surface.style.width=dimensions.width+'px';surface.style.height=dimensions.height+'px';
      $('#ix-board-caption').textContent=state.mode==='sequence'?'Secuencia de interacciones · orden didáctico, sin transacción global':state.mode==='all'?'Aplicaciones y datos · conexión seleccionada':'Aplicaciones y datos de esta conexión';
      applyZoom(true);
    }
    function applyZoom(center=false) {
      if(!root.isConnected||!viewport.clientWidth)return;
      const available=Math.max(240,viewport.clientWidth-24);
      state.scale=state.zoom==='fit'?Math.min(1,available/dimensions.width):Number(state.zoom);
      surface.style.transform=`scale(${state.scale})`;size.style.width=dimensions.width*state.scale+'px';size.style.height=dimensions.height*state.scale+'px';
      viewport.style.setProperty('--ix-content-height',Math.ceil(dimensions.height*state.scale)+'px');
      $('#ix-scale').textContent=Math.round(state.scale*100)+' %';
      $$('[data-ix-zoom]').forEach(b=>{if(['fit','100'].includes(b.dataset.ixZoom))b.setAttribute('aria-pressed',String(b.dataset.ixZoom==='fit'?state.zoom==='fit':state.zoom===1));});
      if(center) centerStep();
    }
    function centerStep() {
      if(state.mode==='sequence') {
        const selected=currentLayout.boxes[state.edge]||Object.values(currentLayout.boxes)[0];
        viewport.scrollTop=state.step===0?0:Math.max(0,(selected?.y||currentLayout.stepY)*state.scale-80);
        viewport.scrollLeft=Math.max(0,((selected?.x||0)+(selected?.w||0)/2)*state.scale-viewport.clientWidth/2);
      } else if(state.mode==='all' && state.edge) {
        const e=edge(state.edge),a=currentLayout.boxes[e.from],b=currentLayout.boxes[e.to];
        const top=Math.min(a.y,b.y),bottom=Math.max(a.y+a.h,b.y+b.h),left=Math.min(a.x,b.x),right=Math.max(a.x+a.w,b.x+b.w);
        viewport.scrollTop=bottom*state.scale<=viewport.clientHeight?0:Math.max(0,(top+bottom)/2*state.scale-viewport.clientHeight/2);
        viewport.scrollLeft=Math.max(0,(left+right)/2*state.scale-viewport.clientWidth/2);
      } else {viewport.scrollTop=0;viewport.scrollLeft=Math.max(0,(dimensions.width*state.scale-viewport.clientWidth)/2);}
    }
    function implementationHTML(nodes=[],edges=[],visible=null) {
      if(!nodes.length&&!edges.length)return '';
      const originals=state.flow.nodes.flatMap(node=>node.implementationNodes||[]);
      const originalName=id=>originals.find(node=>node.id===id)?.title||id;
      const extraSources=(items,shown)=>items.filter(source=>!(shown||[]).some(other=>other.url===source.url));
      const units=nodes.map(node=>{
        const changedTitle=node.title!==visible?.title, changedSubtitle=node.subtitle!==visible?.subtitle;
        const changedDetail=node.detail!==visible?.detail;
        // For an aggregated app, sources remain attached to the original code unit.
        const refs=node.kind==='component'?node.sources||[]:extraSources(node.sources||[],visible?.sources);
        if(!changedTitle&&!changedSubtitle&&!changedDetail&&!refs.length)return '';
        return `<article><h4>${esc(changedTitle?node.title:'Detalle original')}</h4>${changedSubtitle&&node.subtitle?`<p class="ix-implementation-pair">${esc(node.subtitle)}</p>`:''}${changedDetail?`<p>${esc(node.detail)}</p>`:''}${refs.length?sources(refs):''}</article>`;
      }).filter(Boolean);
      const shownEdge=visible?.from&&visible?.to?visible:null;
      const calls=edges.map(e=>{
        const refs=extraSources(e.sources||[],shownEdge?.sources);
        return `<article><h4>${esc(e.label!==shownEdge?.label?e.label:'Origen y destino en código')}</h4><p class="ix-implementation-pair">${esc(originalName(e.from))} → ${esc(originalName(e.to))}</p>${e.detail!==shownEdge?.detail?`<p>${esc(e.detail)}</p>`:''}${e.effect&&e.effect!==shownEdge?.effect?`<p><strong>Efecto:</strong> ${esc(e.effect)}</p>`:''}${e.boundary!==shownEdge?.boundary?`<p><strong>Límite:</strong> ${esc(e.boundary)}</p>`:''}${refs.length?sources(refs):''}</article>`;
      });
      if(!units.length&&!calls.length)return '';
      return `<details class="ix-implementation"><summary>Implementación y código · ${units.length} piezas / ${calls.length} llamadas</summary><div>${units.join('')}${calls.join('')}</div></details>`;
    }
    function renderDetail() {
      if(state.node) {
        const node=n(state.node),group=g(node.group);
        const ids=new Set((node.implementationNodes||[]).map(n=>n.id));
        const internal=(state.flow.implementationEdges||[]).filter(e=>ids.has(e.from)||ids.has(e.to));
        $('#ix-detail').innerHTML=`<div><span class="eyebrow">${kind[node.kind]} / ${esc(group.title)}</span><h3>${esc(node.title)}</h3><p>${esc(node.detail)}</p><button class="btn secondary small" data-ix-return>Volver a la interacción</button></div><div class="ix-detail-meta"><dl><dt>Repositorio / propietario</dt><dd>${esc(group.repo)}</dd><dt>Zona y runtime</dt><dd>${esc(group.zone)} · ${esc(group.runtime)}</dd>${group.evidence?`<dt>Alcance de la ubicación</dt><dd>${esc(group.evidence)}</dd>`:''}</dl>${sources(node.sources||[])}</div>${implementationHTML(node.implementationNodes,internal,node)}`;
      } else {
        const e=edge(state.edge)||activeEdges()[0]; if(!e) return;
        $('#ix-detail').innerHTML=`<div><span class="eyebrow">${esc(certainty[e.certainty]||e.certainty)} · ${esc(e.protocol)}</span><h3>${esc(e.label)}</h3><div class="ix-pair"><button data-ix-node="${esc(e.from)}"><small>${esc(groupName(e.from))}</small><strong>${esc(nodeName(e.from))}</strong></button><span aria-hidden="true">→</span><button data-ix-node="${esc(e.to)}"><small>${esc(groupName(e.to))}</small><strong>${esc(nodeName(e.to))}</strong></button></div><p>${esc(e.detail)}</p></div><div class="ix-detail-meta"><dl><dt>Qué lee, escribe o provoca</dt><dd>${esc(e.effect)}</dd><dt>Límite de esta confirmación</dt><dd>${esc(e.boundary)}</dd></dl>${sources(e.sources||[])}</div>${implementationHTML([],e.implementationEdges,e)}`;
      }
    }
    function renderStep() {
      if(!step().edges.includes(state.edge))state.edge=step().edges[0];
      state.node=null;
      $('#ix-call').innerHTML=step().edges.map((id,i)=>`<option value="${esc(id)}" ${id===state.edge?'selected':''}>${i+1}. ${esc(edge(id).label)}</option>`).join('');
      $('#ix-counter').textContent=`PASO ${state.step+1} / ${state.flow.steps.length} · CONEXIÓN ${step().edges.indexOf(state.edge)+1} / ${step().edges.length}`;
      $('#ix-step-title').textContent=step().title;$('#ix-step-text').textContent=step().detail;
      $('#ix-limit').textContent=step().boundary||'';
      $('#ix-limit').hidden=!step().boundary;
      $('#ix-steps').innerHTML=state.flow.steps.map((s,i)=>`<button data-ix-step="${i}" aria-pressed="${i===state.step}" aria-label="Paso ${i+1}: ${esc(s.title)}"><span>${String(i+1).padStart(2,'0')}</span>${esc(s.title)}</button>`).join('');
      $('[data-ix-prev]').disabled=state.step===0&&state.edge===step().edges[0];$('[data-ix-next]').disabled=state.step===state.flow.steps.length-1&&state.edge===step().edges.at(-1);
      renderDiagram();renderDetail();
    }
    function renderFlow() {
      stop();state.step=0;state.edge=null;state.node=null;
      $('#ix-summary').textContent=state.flow.summary;
      $('#ix-flow-boundary').textContent=state.flow.boundary;
      $('#ix-scope').textContent=`${state.flow.mode==='current'?'Chile · código revisado':'Propuesta · por implementar'} · ${state.flow.groups.length} aplicaciones/bases · ${state.flow.nodes.length} piezas · ${state.flow.edges.length} relaciones`;
      $('#ix-relation-list').innerHTML=state.flow.edges.map((e,i)=>`<button data-ix-relation="${esc(e.id)}"><span>${String(i+1).padStart(2,'0')} · ${esc(e.protocol)}</span><strong>${esc(e.label)}</strong><small>${esc(nodeName(e.from))} → ${esc(nodeName(e.to))}</small></button>`).join('');
      renderStep();
    }
    function selectEdge(id) { const e=edge(id); if(!e)return;stop();state.node=null;state.edge=id;const i=state.flow.steps.findIndex(s=>s.edges.includes(id));if(i>=0&&!step().edges.includes(id)){state.step=i;renderStep();}else {renderStep();} $(state.mode==='sequence'?`.ix-surface [data-ix-seq-step="${state.step}"] button[data-ix-edge="${id}"]`:`.ix-surface button[data-ix-edge="${id}"]`)?.focus({preventScroll:true}); }
    function restoreExpanded() {
      if(!dialog)return;
      placeholder.replaceWith(root);dialog.remove();dialog=null;placeholder=null;
      $('[data-ix-expand]').textContent='Ampliar visor';
      const returnTarget=root.closest('[hidden]')?document.querySelector('[data-map-view][aria-selected="true"]'):$('[data-ix-expand]');
      returnTarget?.focus({preventScroll:true});applyZoom(true);
    }
    function expand() {
      if(dialog){dialog.close();return;}
      placeholder=document.createElement('div');root.before(placeholder);dialog=document.createElement('dialog');dialog.className='ix-expanded';dialog.setAttribute('aria-label','Visor de interacciones ampliado');document.body.append(dialog);dialog.append(root);
      dialog.addEventListener('close',restoreExpanded,{once:true});dialog.showModal();$('[data-ix-expand]').textContent='Cerrar visor ampliado';$('[data-ix-expand]').focus();applyZoom(true);
    }
    function advance(direction) {
      const next=step().edges.indexOf(state.edge)+direction;
      if(next>=0&&next<step().edges.length)state.edge=step().edges[next];
      else if(direction>0&&state.step<state.flow.steps.length-1){state.step++;state.edge=step().edges[0];}
      else if(direction<0&&state.step>0){state.step--;state.edge=step().edges.at(-1);}
      renderStep();
    }
    const onClick=e=>{
      const b=e.target.closest('button,[data-ix-edge]');if(!b||!root.contains(b))return;
      if(b.hasAttribute('data-ix-next')||b.hasAttribute('data-ix-prev')){stop();advance(b.hasAttribute('data-ix-next')?1:-1);}
      else if(b.hasAttribute('data-ix-step')){stop();state.step=Number(b.dataset.ixStep);renderStep();$(`[data-ix-step="${state.step}"]`).focus({preventScroll:true});}
      else if(b.hasAttribute('data-ix-mode')){stop();state.mode=b.dataset.ixMode;if(state.mode==='sequence'&&viewport.clientWidth<600)state.zoom=1;$$('[data-ix-mode]').forEach(x=>x.setAttribute('aria-pressed',String(x===b)));renderDiagram();}
      else if(b.hasAttribute('data-ix-zoom')){const z=b.dataset.ixZoom;state.zoom=z==='fit'?'fit':z==='100'?1:Math.max(.25,Math.min(1.75,state.scale+(z==='in'?.15:-.15)));applyZoom(true);}
      else if(b.hasAttribute('data-ix-node')){stop();state.node=b.dataset.ixNode;$$('[data-ix-node]').forEach(x=>x.setAttribute('aria-pressed',String(x.dataset.ixNode===state.node)));renderDetail();}
      else if(b.hasAttribute('data-ix-edge')||b.hasAttribute('data-ix-relation'))selectEdge(b.dataset.ixEdge||b.dataset.ixRelation);
      else if(b.hasAttribute('data-ix-return')){state.node=null;renderDetail();$$('[data-ix-node]').forEach(x=>x.setAttribute('aria-pressed','false'));}
      else if(b.hasAttribute('data-ix-center'))centerStep();
      else if(b.hasAttribute('data-ix-expand'))expand();
      else if(b.hasAttribute('data-ix-play')){
        if(state.running){stop();return;}if(reduced())return;
        if(state.step===state.flow.steps.length-1&&state.edge===step().edges.at(-1)){state.step=0;state.edge=null;renderStep();}
        state.running=true;root.classList.add('ix-playing');b.textContent='Pausar';b.setAttribute('aria-pressed','true');
        state.timer=setInterval(()=>{advance(1);if(state.step===state.flow.steps.length-1&&state.edge===step().edges.at(-1))stop();},6500);
      }
    };
    root.addEventListener('click',onClick);
    $('#ix-flow').addEventListener('change',e=>{state.flow=flows.find(f=>f.id===e.target.value);renderFlow();});
    $('#ix-call').addEventListener('change',e=>{stop();state.edge=e.target.value;renderStep();$('#ix-call').focus({preventScroll:true});});
    const motion=()=>{if(reduced())stop();$('[data-ix-play]').disabled=reduced();$('[data-ix-play]').title=reduced()?'Movimiento reducido activo; usa los pasos manuales':'Avanza una conexión cada 6,5 segundos';};
    const motionObserver=new MutationObserver(motion);motionObserver.observe(document.body,{attributes:true,attributeFilter:['class']});
    const media=matchMedia('(prefers-reduced-motion: reduce)');media.addEventListener('change',motion);
    const columnBand=()=>viewport.clientWidth>=950?3:viewport.clientWidth>=600?2:1;let wasCompact=columnBand();
    const observer=new ResizeObserver(()=>{cancelAnimationFrame(resizeFrame);resizeFrame=requestAnimationFrame(()=>{if(!viewport.clientWidth)return;const compact=columnBand();if(compact!==wasCompact){wasCompact=compact;renderDiagram();}else applyZoom(false);});});observer.observe(viewport);
    const onMapView=event=>{
      if(!isEcosystemViewer)return;
      if(event.detail.view!=='peticiones'){
        stop();
        if(dialog){dialog.removeEventListener('close',restoreExpanded);dialog.close();restoreExpanded();}
        return;
      }
      cancelAnimationFrame(resizeFrame);resizeFrame=requestAnimationFrame(()=>{wasCompact=columnBand();renderDiagram();});
    };
    document.addEventListener('pos:map-view',onMapView);
    const library=root.closest('details.journey-library');
    const onLibraryToggle=()=>{
      if(!library.open){stop();return;}
      cancelAnimationFrame(resizeFrame);
      resizeFrame=requestAnimationFrame(()=>{if(root.isConnected){wasCompact=columnBand();renderDiagram();}});
    };
    library?.addEventListener('toggle',onLibraryToggle);
    const onVisibility=()=>{if(document.hidden)stop();};document.addEventListener('visibilitychange',onVisibility);
    let drag=null;
    viewport.addEventListener('pointerdown',e=>{if(e.target.closest('button,a,[data-ix-edge]')||e.pointerType==='touch'||e.button!==0)return;drag={x:e.clientX,y:e.clientY,left:viewport.scrollLeft,top:viewport.scrollTop};viewport.setPointerCapture(e.pointerId);viewport.classList.add('ix-dragging');});
    viewport.addEventListener('pointermove',e=>{if(!drag)return;viewport.scrollLeft=drag.left-(e.clientX-drag.x);viewport.scrollTop=drag.top-(e.clientY-drag.y);});
    const release=()=>{drag=null;viewport.classList.remove('ix-dragging');};viewport.addEventListener('pointerup',release);viewport.addEventListener('pointercancel',release);
    root.addEventListener('focusin',e=>{if(e.target.closest('.ix-surface')) e.target.scrollIntoView({block:'nearest',inline:'nearest',behavior:'instant'});});
    dispose=()=>{stop();observer.disconnect();motionObserver.disconnect();cancelAnimationFrame(resizeFrame);library?.removeEventListener('toggle',onLibraryToggle);document.removeEventListener('pos:map-view',onMapView);document.removeEventListener('visibilitychange',onVisibility);media.removeEventListener('change',motion);if(dialog){dialog.removeEventListener('close',restoreExpanded);placeholder?.remove();dialog.remove();dialog=null;}};
    $$('[data-ix-mode]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.ixMode===state.mode)));
    renderFlow();motion();
  }
  window.POS_INTERACTIONS_UI={html,mount,destroy:()=>dispose()};
})();
