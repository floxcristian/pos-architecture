/* Repository ownership/dependency map. Connections describe source evidence, never live traffic. */
(() => {
  'use strict';
  const esc = v => String(v ?? '').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const certainty = {code:'Código en los extremos',compatible:'Contratos compatibles · binding pendiente',reported:'Informado · por confirmar',reference:'Referencia / plataforma'};
  const role = {runtime:'Operación POS',platform:'Plataforma corporativa'};
  const sourceHTML = items => `<ul class="repo-sources">${items.map(s=>`<li><a href="${esc(s.url)}" target="_blank" rel="noopener">${esc(s.label)} ↗</a></li>`).join('')}</ul>`;
  function repositoryDetail(r) {
    const reuse=r.role==='platform'?window.POS_CONTENT.reuse.find(x=>x.name===r.id):null;
    return `<span class="status-badge ${r.role==='runtime'?'code':'proposed'}">${role[r.role]}</span>${reuse?`<h3>Uso propuesto y límites</h3><p>${esc(reuse.use)}</p><p>${esc(reuse.limit)}</p><p class="small-note">${esc(reuse.status)}</p><h3>Qué contiene el repositorio</h3>`:''}<p>${esc(r.summary)}</p><h3>Unidades dentro del repositorio</h3><dl class="repo-units">${r.units.map(u=>`<dt>${esc(u.name)}</dt><dd>${esc(u.runtime)} · ${esc(u.zone)}</dd>`).join('')}</dl><p class="notice">${esc(r.boundary)}</p><h3>Fuentes</h3>${sourceHTML(r.sources)}`;
  }
  function openRepository(root,button,r,openModal) {
    openModal(r.name,repositoryDetail(r));const modal=document.querySelector('#modal');
    const returnFocus=()=>{const focused=document.activeElement;if(root.isConnected&&!modal.open&&(!focused||focused===document.body||focused===button||modal.contains(focused)||!focused.isConnected))root.querySelector(`[data-repository="${r.id}"]`)?.focus({preventScroll:true});};
    const cancel=e=>{e.preventDefault();modal.close();returnFocus();};modal.addEventListener('cancel',cancel,{once:true});modal.addEventListener('close',()=>{modal.removeEventListener('cancel',cancel);returnFocus();},{once:true});
  }
  function platformHTML() {
    const data=window.POS_REPOSITORIES;if(!data)return '';
    const connection=data.connections.find(c=>c.id==='repo-core-ci');
    return `<section class="repo-platform-module" aria-labelledby="repo-platform-title"><span class="eyebrow">REUTILIZACIÓN CORPORATIVA / PROPUESTA</span><h2 id="repo-platform-title">Reutilizar core y devops-platform.</h2><p>Adopción selectiva, con adaptación y pruebas. Las ventas habilitadas offline deben continuar sin conexión a los servicios centrales.</p><div class="repo-platform-cards">${data.repositories.filter(r=>r.role==='platform').map(r=>{const reuse=window.POS_CONTENT.reuse.find(x=>x.name===r.id);return `<button data-repository="${esc(r.id)}" aria-haspopup="dialog"><strong>${esc(r.name)}</strong><span>${esc(reuse?.use||r.summary)}</span><small>Ver alcance, componentes y fuentes ↗</small></button>`;}).join('')}</div>${connection?`<details class="repo-platform-connection"><summary>Cómo core usa las automatizaciones de devops-platform</summary><p>${esc(connection.detail)}</p>${sourceHTML(connection.sources)}</details>`:''}<p class="small-note"><a href="../docs/propuesta-arquitectura.md#reutilización-de-core-y-devops-platform" target="_blank" rel="noopener">Qué reutilizar y qué necesita desarrollo propio ↗</a></p></section>`;
  }
  function html() {
    return `<section class="repo-module" aria-labelledby="repo-title"><div class="repo-heading"><div><span class="eyebrow">LOS REPOSITORIOS Y SU PAPEL</span><h2 id="repo-title">El nombre del código, en el mapa.</h2><p>Un repositorio puede contener varias aplicaciones. Selecciona una conexión para ver qué unidades interactúan y qué evidencia las vincula.</p></div><a class="btn secondary" href="../docs/mapa-repositorios-y-conexiones.md" target="_blank" rel="noopener">Leer análisis ↗</a></div><div class="repo-controls"><label for="repo-connection">Conexión</label><select id="repo-connection"></select><label class="repo-toggle"><input type="checkbox" id="repo-all" checked> Ver todas las conexiones</label></div><div class="repo-map-caption"><strong>Operación actual · seis repositorios</strong></div><div class="repo-viewport" tabindex="0" role="region" aria-label="Mapa de repositorios; usa las flechas para desplazar"><div class="repo-map-size"><div class="repo-map"></div></div></div><div class="repo-connection-detail" id="repo-connection-detail" aria-live="polite"></div><p class="repo-limit">Las flechas representan consumo de APIs, datos o artefactos, según su ficha. No prueban despliegue ni tráfico: el concentrador de 2023 se contrasta con otros snapshots de 2026. Broker, PostgreSQL, AX y proveedores externos tienen sus propias fronteras; el detalle por componente se explora más abajo.</p></section>`;
  }
  let dispose=()=>{};
  function mount({openModal}) {
    dispose();
    const platform=document.querySelector('.repo-platform-module');
    platform?.addEventListener('click',e=>{const button=e.target.closest('[data-repository]');if(button){const r=window.POS_REPOSITORIES.repositories.find(r=>r.id===button.dataset.repository);openRepository(platform,button,r,openModal);}});
    const root=document.querySelector('.repo-module'), data=window.POS_REPOSITORIES;if(!root||!data)return;
    const $=s=>root.querySelector(s),$$=s=>[...root.querySelectorAll(s)];
    const runtime=data.repositories.filter(r=>r.role==='runtime'),positions=Object.fromEntries(runtime.map(r=>[r.id,{}]));
    let width=1240,height=0,compact=false,badgeSize=44,lastViewportWidth=0,rowBottom=0;const box={w:320};
    function layout(){
      const available=$('.repo-viewport').clientWidth;lastViewportWidth=available;compact=available<800;width=compact?400:1240;
      const scale=Math.min(1,(available-16)/width);badgeSize=44/scale;
      const cards=$$('.repo-node'),heights=cards.map(el=>el.offsetHeight);rowBottom=62+Math.max(...heights.slice(0,3));
      let nextY=28;
      runtime.forEach((r,i)=>{const p=positions[r.id]={x:compact?16:40+(i%3)*420,y:compact?nextY:(i<3?62:rowBottom+116),h:heights[i]};nextY=p.y+p.h+40;cards[i].style.left=p.x+'px';cards[i].style.top=p.y+'px';});
      height=Math.max(...Object.values(positions).map(p=>p.y+p.h))+28;
    }
    const find=id=>data.repositories.find(r=>r.id===id), actual=data.connections.filter(c=>positions[c.from]&&positions[c.to]);
    let selected=actual.find(c=>c.from==='mountain-sync-sucursal'&&c.to==='mountain-concentrador')?.id||actual[0]?.id;
    function route(c,i) {
      const a=positions[c.from],b=positions[c.to],sameRow=a.y===b.y,sameCol=a.x===b.x;
      let path,mx,my;
      if(compact){const sx=a.x+box.w,tx=b.x+box.w,sy=a.y+a.h/2,ty=b.y+b.h/2,rail=width-25-(i%3)*6;mx=width-32;my=(sy+ty)/2;path=`M ${sx} ${sy} H ${rail} V ${ty} H ${tx+5}`;}
      else if(sameRow){const right=b.x>a.x,sx=right?a.x+box.w:a.x,tx=right?b.x:b.x+box.w,ay=a.y+Math.min(a.h,b.h)*(.3+(i%3)*.3),by=ay;mx=(sx+tx)/2;my=ay;if(Math.abs(a.x-b.x)>420){const lane=28,sign=right?1:-1;my=lane;path=`M ${sx} ${ay} H ${sx+sign*26} V ${lane} H ${tx-sign*26} V ${by} H ${tx-sign*5}`;}else path=`M ${sx} ${ay} H ${mx} V ${by} H ${tx+(right?-5:5)}`;}
      else if(sameCol){const down=b.y>a.y,sx=a.x+115+(i%3)*44,sy=down?a.y+a.h:a.y,ty=down?b.y:b.y+b.h;mx=sx;my=(sy+ty)/2;path=`M ${sx} ${sy} V ${ty+(down?-5:5)}`;}
      else {const down=b.y>a.y,sx=a.x+70+(i%4)*52,tx=b.x+70+(i%4)*52,sy=down?a.y+a.h:a.y,ty=down?b.y:b.y+b.h,rail=rowBottom+28+(i%4)*20;mx=(sx+tx)/2;my=rail;path=`M ${sx} ${sy} V ${rail} H ${tx} V ${ty+(down?-5:5)}`;}
      return {path,mx,my};
    }
    function render() {
      const focused=root.contains(document.activeElement)?document.activeElement:null,focusRepo=focused?.dataset.repository,focusEdge=focused?.dataset.repoEdge;
      const connection=data.connections.find(c=>c.id===selected),active=new Set(connection?[connection.from,connection.to]:[]),showAll=$('#repo-all').checked;
      $('.repo-map').innerHTML=runtime.map(r=>`<button class="repo-node ${active.has(r.id)?'repo-active':''}" data-repository="${esc(r.id)}" style="width:${box.w}px"><span>REPOSITORIO</span><strong>${esc(r.name)}</strong><ul>${(r.diagramUnits||r.units.map(u=>u.name)).slice(0,3).map(name=>`<li>${esc(name)}</li>`).join('')}</ul><small>${(r.diagramUnits||r.units).length>3?`+ ${(r.diagramUnits||r.units).length-3} unidades · `:''}Inspeccionar componentes y fuentes ↗</small></button>`).join('');
      layout();
      const routes=actual.map((c,i)=>{const p=route(c,i),a=positions[c.from],b=positions[c.to];return {...p,low:Math.min(a.y+a.h/2,b.y+b.h/2)+badgeSize/2,high:Math.max(a.y+a.h/2,b.y+b.h/2)-badgeSize/2};});
      if(compact){const labelRows=[],distance=badgeSize+8;[...routes].sort((a,b)=>(a.high-a.low)-(b.high-b.low)).forEach(p=>{const candidates=[p.my];for(let shift=4;shift<height;shift+=4)candidates.push(p.my+shift,p.my-shift);p.my=candidates.find(y=>y>=p.low&&y<=p.high&&labelRows.every(other=>Math.abs(other-y)>=distance))??p.my;labelRows.push(p.my);});}
      const paths=actual.map((c,i)=>{const p=routes[i],on=c.id===selected;
        if(!showAll&&c.id!==selected)return '';return `<g class="repo-wire ${on?'repo-selected':''} ${c.certainty==='code'?'':'repo-unconfirmed'}"><path d="${p.path}" marker-end="url(#repo-arrow)"/><path class="repo-hit" d="${p.path}" data-repo-edge="${esc(c.id)}"/><foreignObject x="${p.mx-badgeSize/2}" y="${p.my-badgeSize/2}" width="${badgeSize}" height="${badgeSize}"><button xmlns="http://www.w3.org/1999/xhtml" class="repo-edge-number" data-repo-edge="${esc(c.id)}" aria-label="Conexión ${i+1}: ${esc(c.label)}" aria-pressed="${on}">${i+1}</button></foreignObject></g>`;}).join('');
      $('.repo-map').insertAdjacentHTML('afterbegin',`<svg class="repo-wires" width="${width}" height="${height}" aria-label="Dependencias entre repositorios"><defs><marker id="repo-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0 1 L9 5 L0 9Z" fill="#087f70"/></marker></defs>${paths}</svg>`);
      // Paint every control above every wire, including overlapping mobile rails.
      $$('.repo-wires foreignObject').forEach(label=>label.ownerSVGElement.append(label));
      if(connection)$('#repo-connection-detail').innerHTML=`<div><span class="eyebrow">${certainty[connection.certainty]||esc(connection.certainty)}</span><h3>${esc(find(connection.from)?.name||connection.from)} <span>→</span> ${esc(find(connection.to)?.name||connection.to)}</h3><strong>${esc(connection.label)}</strong><p>${esc(connection.detail)}</p></div><details><summary>Evidencia de la conexión</summary>${sourceHTML(connection.sources)}</details>`;
      resize();
      if(focusRepo)$(`[data-repository="${focusRepo}"]`)?.focus({preventScroll:true});else if(focusEdge)$(`button[data-repo-edge="${focusEdge}"]`)?.focus({preventScroll:true});
    }
    function resize() {
      const vp=$('.repo-viewport'),scale=Math.min(1,(vp.clientWidth-16)/width);
      $('.repo-map').style.cssText=`width:${width}px;height:${height}px;transform:scale(${scale});transform-origin:top left`;
      $('.repo-map-size').style.cssText=`width:${width*scale}px;height:${height*scale}px`;
    }
    $('#repo-connection').innerHTML=actual.map((c,i)=>`<option value="${esc(c.id)}" ${c.id===selected?'selected':''}>${i+1}. ${esc(c.from)} → ${esc(c.to)} · ${esc(c.label)}</option>`).join('');
    $('#repo-connection').addEventListener('change',e=>{selected=e.target.value;render();});$('#repo-all').addEventListener('change',render);
    root.addEventListener('click',e=>{
      const repo=e.target.closest('[data-repository]');if(repo){
        openRepository(root,repo,find(repo.dataset.repository),openModal);return;
      }
      const edge=e.target.closest('[data-repo-edge]');if(edge){selected=edge.dataset.repoEdge;$('#repo-connection').value=selected;render();$(`button[data-repo-edge="${selected}"]`)?.focus({preventScroll:true});return;}
    });
    const observer=new ResizeObserver(()=>{if(Math.abs(lastViewportWidth-$('.repo-viewport').clientWidth)>.5)render();else resize();});observer.observe($('.repo-viewport'));dispose=()=>observer.disconnect();render();
  }
  window.POS_REPOSITORIES_UI={html,platformHTML,mount};
})();
