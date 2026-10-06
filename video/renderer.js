/* Deterministic 1920×1080 motion graphics. Each exported frame is a pure pose. */
'use strict';
(() => {
  const WIDTH = 1920;
  const HEIGHT = 1080;
  const root = document.getElementById('scene-root');
  const imageCache = new Map();
  let currentKey = '';
  let currentScene = null;
  let currentFlow = null;
  let currentDiagram = null;
  let sceneReady = Promise.resolve();
  let revision = 0;
  const clamp = (n, low = 0, high = 1) => Math.max(low, Math.min(high, Number(n) || 0));
  const ease = value => { const t = clamp(value); return 1 - (1 - t) ** 3; };
  const interval = (progress, start, end) => clamp((progress - start) / (end - start));
  const esc = value => String(value ?? '').replace(/[&<>"']/g, ch => ({'&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;'}[ch]));
  const list = value => Array.isArray(value) ? value : [];
  const numbered = value => String(Math.max(1, Number(value) || 1)).padStart(2, '0');
  const textList = value => list(value).map(item => typeof item === 'string' ? item : item.text ?? item.label ?? String(item));
  const bulletList = (values, className = '', offset = .14) => `<ul class="bullet-list ${className}">${textList(values).map((item, i) => `<li class="bullet motion-item" data-enter="${offset + i * .04}">${esc(item)}</li>`).join('')}</ul>`;
  const blankScene = {id:'renderer-preview', chapter:1, kind:'title', kicker:'Vista previa del renderer', title:'Arquitectura del POS corporativo', bullets:['Un modelo compartido de caja a país.', 'Escenas listas para narración y exportación.'], takeaway:'Las simulaciones explican contratos; no ejecutan servicios reales.'};

  function loadImage(src) {
    if (!imageCache.has(src)) {
      imageCache.set(src, new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = async () => { try { await img.decode(); } catch { /* onload already confirms the decoded resource. */ } resolve(img); };
        img.onerror = () => reject(new Error(`No se pudo cargar el diagrama: ${src}`));
        img.src = src;
      }));
    }
    return imageCache.get(src);
  }

  function sceneTitle(scene) {
    return `<header class="scene-heading motion-item" data-enter="0"><p class="scene-kicker">${esc(scene.kicker || 'Arquitectura POS')}</p><h1 class="scene-title">${esc(scene.title)}</h1></header>`;
  }

  function titleMarkup(scene, metadata) {
    const bullets = textList(scene.bullets);
    return `<div class="title-layout"><div class="title-statements">${bullets.map((item,i) => `<div class="title-statement motion-item" data-enter="${.14 + i * .055}"><span class="statement-index">${numbered(i + 1)}</span><p>${esc(item)}</p></div>`).join('') || `<p class="title-empty motion-item" data-enter=".16">${esc(scene.takeaway || '')}</p>`}</div><div class="title-figure motion-item" data-enter=".09"><span class="title-figure-number">${numbered(metadata.chapterNumber || scene.chapter)}</span><span class="title-figure-label">Capítulo</span></div></div>`;
  }

  function flowMarkup(scene) {
    const nodes = list(scene.nodes);
    const active = new Set(list(scene.active));
    return `<div class="flow-layout ${list(scene.bullets).length ? 'with-bullets' : ''}"><div class="flow-graph"><svg class="flow-svg" aria-hidden="true"><defs><marker id="edge-end" viewBox="0 0 12 12" refX="10" refY="6" markerWidth="10" markerHeight="10" orient="auto-start-reverse"><path d="M 1 1 L 10 6 L 1 11" fill="none" stroke="#789bc9" stroke-width="2"/></marker><marker id="edge-end-active" viewBox="0 0 12 12" refX="10" refY="6" markerWidth="9" markerHeight="9" orient="auto-start-reverse"><path d="M 1 1 L 10 6 L 1 11" fill="none" stroke="#a9caff" stroke-width="2"/></marker></defs><g class="edge-layer"></g></svg><div class="flow-nodes">${nodes.map((node,i) => `<section class="flow-node motion-item ${active.has(node.id) ? 'is-active' : ''}" data-node-id="${esc(node.id)}" data-enter="${.08 + i * .035}"><span class="flow-node-index">${numbered(i + 1)}</span><h2>${esc(node.label)}</h2>${node.detail ? `<p>${esc(node.detail)}</p>` : ''}<span class="flow-node-arrival" aria-hidden="true"></span></section>`).join('')}</div></div>${bulletList(scene.bullets, 'flow-bullets', .35)}</div>`;
  }

  function codeMarkup(scene) {
    const highlighted = new Set(list(scene.highlightLines));
    return `<div class="code-layout"><figure class="code-panel motion-item" data-enter=".08"><figcaption class="code-caption"><span>Ejemplo educativo</span><span>${esc(scene.language || 'Fragmento didáctico')}</span></figcaption><pre class="video-code"><code>${String(scene.code || '').split('\n').map((line,i) => `<span class="video-code-line ${highlighted.has(i+1) ? 'is-highlight' : ''}" data-code-line="${i+1}"><span class="video-line-number">${i+1}</span><span class="video-code-text">${esc(line) || ' '}</span></span>`).join('')}</code></pre></figure>${bulletList(scene.bullets, 'code-bullets', .17)}</div>`;
  }

  function compareMarkup(scene) {
    return `<div class="compare-layout">${list(scene.columns).map((column,i) => `<section class="compare-column motion-item" data-enter="${.09 + i * .055}"><h2>${esc(column.title)}</h2>${bulletList(column.items, '', .16 + i * .045)}</section>`).join('')}</div>`;
  }

  function diagramMarkup(scene) {
    if (list(scene.diagramTour?.cues).length) {
      return `<div class="diagram-layout diagram-tour-layout"><figure class="video-diagram"><div class="diagram-window"><img alt="${esc(scene.title)}" draggable="false"><span class="tour-highlight" aria-hidden="true"></span></div></figure><aside class="diagram-tour-guide"><div class="tour-step-heading"><span class="tour-step-counter"></span><span class="tour-step-state">Recorrido guiado</span></div><h2 class="tour-cue-label"></h2><p class="tour-cue-description"></p><figure class="tour-minimap"><figcaption><span>Ubicación en el mapa</span><span class="tour-map-key" aria-hidden="true"></span></figcaption><div class="tour-map-canvas"><div class="tour-map-window"><img alt="Mapa completo para ubicar el detalle mostrado" draggable="false"><span class="tour-map-viewport" aria-hidden="true"></span></div></div></figure></aside><p class="diagram-credit"><span>Mapa completo y editables en POS Atlas</span><span class="tour-step-dots" aria-hidden="true"></span></p></div>`;
    }
    const bullets = list(scene.bullets);
    return `<div class="diagram-layout ${bullets.length ? '' : 'without-bullets'}"><figure class="video-diagram motion-item" data-enter=".06"><div class="diagram-window"><img alt="${esc(scene.title)}" draggable="false"></div></figure>${bullets.length ? bulletList(bullets, 'diagram-bullets', .18) : ''}<p class="diagram-credit motion-item" data-enter=".18">${scene.focusLabel ? `<strong class="diagram-focus-label">${esc(scene.focusLabel)}</strong>` : ''}<span>Mapa completo y editables en POS Atlas</span></p></div>`;
  }

  function checklistMarkup(scene) {
    return `<ol class="checklist-layout">${textList(scene.bullets).map((item,i) => `<li class="checklist-item motion-item" data-enter="${.1 + i * .055}"><span class="checklist-number">${numbered(i + 1)}</span><p>${esc(item)}</p></li>`).join('')}</ol>`;
  }

  function questionMarkup(scene) {
    const question = scene.question || scene.title;
    return `<div class="question-layout"><p class="question-prompt motion-item" data-enter=".06">${esc(question)}</p><section class="question-answer motion-item" data-enter=".34"><p class="answer-label">La idea que conviene recordar</p>${scene.answer ? `<p class="answer-text">${esc(scene.answer)}</p>` : ''}${bulletList(scene.bullets, '', .37)}</section></div>`;
  }

  function diagramSource(scene) {
    const name = String(scene.diagram || '').replace(/\.svg$/i, '');
    if (!/^(0[1-7])-[a-z0-9-]+$/i.test(name)) throw new Error(`Nombre de diagrama no válido: ${name}`);
    if (!list(scene.diagramTour?.cues).length && (!scene.focus || scene.focusSpace === 'preview') && /^0[1-5]-/.test(name)) return `../presentation/architecture-diagrams/${name}.svg`;
    return `../docs/diagramas-excalidraw/${name}.svg`;
  }

  function normalizeFocus(raw) {
    if (!raw) return {x:0, y:0, w:1, h:1};
    const x = clamp(raw.x, 0, .999), y = clamp(raw.y, 0, .999);
    const w = clamp(raw.w, .001, 1 - x), h = clamp(raw.h, .001, 1 - y);
    return {x, y, w, h};
  }

  function prepareTour(scene) {
    const cues = list(scene.diagramTour?.cues).map((cue, index) => {
      const start = Number(cue.start), end = Number(cue.end);
      if (!cue.focus || !Number.isFinite(start) || !Number.isFinite(end) || start < 0 || end <= start) throw new Error(`Cue ${scene.id}/${cue.id || index}: foco o intervalo no válido.`);
      return {...cue, start, end, focus:normalizeFocus(cue.focus), highlight:cue.highlight ? normalizeFocus(cue.highlight) : null};
    }).sort((a, b) => a.start - b.start);
    cues.forEach((cue, index) => {
      if (index && cue.start < cues[index - 1].end) throw new Error(`Cues solapados en ${scene.id}: ${cues[index - 1].id} / ${cue.id}.`);
    });
    return cues;
  }

  async function prepareDiagram(scene, buildRevision) {
    const src = diagramSource(scene);
    const resource = await loadImage(src);
    if (revision !== buildRevision) return;
    const frame = root.querySelector('.video-diagram');
    const img = frame.querySelector('img');
    img.src = src;
    await img.decode();
    const focus = normalizeFocus(scene.focus);
    currentDiagram = {frame, img, window:frame.querySelector('.diagram-window'), source:src, width:resource.naturalWidth, height:resource.naturalHeight, focus, overview:scene.overviewFocus ? normalizeFocus(scene.overviewFocus) : focus};
    if (list(scene.diagramTour?.cues).length) {
      const cues = prepareTour(scene);
      const guide = root.querySelector('.diagram-tour-guide');
      const map = guide.querySelector('.tour-map-canvas');
      const mapImage = map.querySelector('img');
      mapImage.src = src;
      await mapImage.decode();
      const allFocus = [currentDiagram.overview, ...cues.map(cue => cue.focus)];
      const x = Math.min(...allFocus.map(rect => rect.x)), y = Math.min(...allFocus.map(rect => rect.y));
      const mapFocus = {x, y, w:Math.max(...allFocus.map(rect => rect.x + rect.w)) - x, h:Math.max(...allFocus.map(rect => rect.y + rect.h)) - y};
      const dots = root.querySelector('.tour-step-dots');
      dots.innerHTML = cues.map(() => '<span></span>').join('');
      currentDiagram.tour = {cues, mapFocus, guide, map, mapImage, mapWindow:map.querySelector('.tour-map-window'), mapViewport:map.querySelector('.tour-map-viewport'), highlight:frame.querySelector('.tour-highlight'), counter:guide.querySelector('.tour-step-counter'), label:guide.querySelector('.tour-cue-label'), description:guide.querySelector('.tour-cue-description'), dots:[...dots.children]};
    }
  }

  function buildFlow(scene) {
    const graph = root.querySelector('.flow-graph');
    const svg = graph.querySelector('svg');
    const layer = svg.querySelector('.edge-layer');
    const width = graph.clientWidth;
    const height = graph.clientHeight;
    const nodes = list(scene.nodes);
    const n = Math.max(nodes.length, 1);
    const nodeWidth = Math.min(360, (width - (n - 1) * 60) / n);
    const gap = n > 1 ? (width - n * nodeWidth) / (n - 1) : 0;
    const nodeHeight = scene.bullets?.length ? 210 : 235;
    const offset = n === 1 ? (width - nodeWidth) / 2 : 0;
    const positions = new Map();
    const nodeEls = [...root.querySelectorAll('.flow-node')];
    svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
    nodeEls.forEach((el,i) => {
      const x = offset + i * (nodeWidth + gap);
      Object.assign(el.style, {left:`${x}px`, top:'8px', width:`${nodeWidth}px`, height:`${nodeHeight}px`});
      positions.set(nodes[i].id, {x:x + nodeWidth / 2, y:8 + nodeHeight, index:i});
    });
    const highlights = new Set(list(scene.highlightEdges));
    const ns = 'http://www.w3.org/2000/svg';
    const paths = [];
    list(scene.edges).forEach((edge,i) => {
      const from = positions.get(edge.from), to = positions.get(edge.to);
      if (!from || !to) return;
      const group = document.createElementNS(ns, 'g');
      const path = document.createElementNS(ns, 'path');
      const distance = Math.abs(from.index - to.index);
      const bend = nodeHeight + 50 + Math.min(distance - 1, 2) * 55;
      const isLoop = from.index === to.index;
      const d = isLoop
        ? `M ${from.x - 35} ${from.y} C ${from.x - 85} ${bend + 48}, ${from.x + 85} ${bend + 48}, ${from.x + 35} ${from.y}`
        : `M ${from.x} ${from.y} C ${from.x} ${bend}, ${from.x} ${bend}, ${from.x + Math.sign(to.x-from.x) * 36} ${bend} L ${to.x - Math.sign(to.x-from.x) * 36} ${bend} C ${to.x} ${bend}, ${to.x} ${bend}, ${to.x} ${to.y}`;
      const highlight = highlights.has(i);
      path.setAttribute('d', d);
      path.setAttribute('class', `flow-edge${highlight ? ' is-highlight' : ''}`);
      path.setAttribute('marker-end', highlight ? 'url(#edge-end-active)' : 'url(#edge-end)');
      group.append(path);
      let label = null;
      if (edge.label) {
        label = document.createElementNS(ns, 'foreignObject');
        const labelWidth = Math.min(420, Math.max(Math.abs(to.x - from.x) - 14, 230));
        label.setAttribute('x', (from.x + to.x - labelWidth) / 2);
        label.setAttribute('y', bend + 12);
        label.setAttribute('width', labelWidth);
        label.setAttribute('height', 82);
        label.innerHTML = `<div xmlns="http://www.w3.org/1999/xhtml" class="flow-edge-label"><span>${esc(edge.label)}</span></div>`;
        group.append(label);
      }
      const packet = document.createElementNS(ns, 'circle');
      packet.setAttribute('r', '8'); packet.setAttribute('class', 'flow-packet'); packet.style.opacity = '0';
      if (highlight) group.append(packet);
      layer.append(group);
      paths.push({path, packet, label, group, highlight, length:path.getTotalLength(), index:i, target:nodeEls[to.index]});
    });
    currentFlow = {paths, nodeEls};
  }

  async function build(scene, metadata) {
    const buildRevision = ++revision;
    currentFlow = null;
    currentDiagram = null;
    const kind = ['title','flow','code','compare','diagram','checklist','question'].includes(scene.kind) ? scene.kind : 'checklist';
    const builders = {title:() => titleMarkup(scene, metadata), flow:() => flowMarkup(scene), code:() => codeMarkup(scene), compare:() => compareMarkup(scene), diagram:() => diagramMarkup(scene), checklist:() => checklistMarkup(scene), question:() => questionMarkup(scene)};
    const takeaway = scene.takeaway && !(kind === 'title' && !list(scene.bullets).length) ? scene.takeaway : '';
    root.innerHTML = `<article class="scene scene-${kind}-kind">${sceneTitle(scene)}<div class="scene-content ${takeaway ? 'has-takeaway' : ''}">${builders[kind]()}</div>${takeaway ? `<p class="scene-takeaway motion-item" data-enter=".51">${esc(takeaway)}</p>` : ''}</article>`;
    await document.fonts.ready;
    if (revision !== buildRevision) return;
    fitHeading();
    if (kind === 'flow') buildFlow(scene);
    if (kind === 'diagram') await prepareDiagram(scene, buildRevision);
  }

  function fitHeading() {
    const title = root.querySelector('.scene-title');
    const heading = root.querySelector('.scene-heading');
    let size = parseFloat(getComputedStyle(title).fontSize);
    const maxHeight = currentScene?.kind === 'title' ? 175 : 142;
    while ((title.scrollHeight > maxHeight || title.scrollWidth > title.clientWidth + 1) && size > 50) {
      size -= 1;
      title.style.fontSize = `${size}px`;
    }
    heading.dataset.fontSize = String(size);
  }

  function poseFlow(progress) {
    if (!currentFlow) return;
    currentFlow.nodeEls.forEach(el => {el.querySelector('.flow-node-arrival').style.opacity = '0';});
    currentFlow.paths.forEach((edge,i) => {
      const reveal = ease(interval(progress, .16 + i * .018, .31 + i * .018));
      edge.path.style.strokeDasharray = `${edge.length}`;
      edge.path.style.strokeDashoffset = `${edge.length * (1 - reveal)}`;
      edge.path.style.opacity = String(reveal);
      if (edge.label) edge.label.style.opacity = String(ease(interval(progress, .21 + i * .02, .35 + i * .02)));
      if (!edge.highlight) return;
      const start = .30 + i * .05;
      const end = Math.min(.87, start + .33);
      const travel = interval(progress, start, end);
      const visible = progress >= start && progress < end;
      const point = edge.path.getPointAtLength(edge.length * travel);
      edge.packet.setAttribute('cx', point.x); edge.packet.setAttribute('cy', point.y);
      edge.packet.style.opacity = visible ? '1' : '0';
      const arrival = interval(progress, end, Math.min(.99, end + .12));
      edge.target.querySelector('.flow-node-arrival').style.opacity = progress >= end ? String((1 - arrival) * .85) : '0';
    });
  }

  function applyDiagramCamera(focus) {
    const {frame, img, window:crop, width, height} = currentDiagram;
    const pad = 18;
    const scale = Math.min((frame.clientWidth - pad * 2) / (width * focus.w), (frame.clientHeight - pad * 2) / (height * focus.h));
    const cropWidth = width * focus.w * scale;
    const cropHeight = height * focus.h * scale;
    Object.assign(crop.style, {width:`${cropWidth}px`, height:`${cropHeight}px`, left:`${(frame.clientWidth-cropWidth)/2}px`, top:`${(frame.clientHeight-cropHeight)/2}px`});
    Object.assign(img.style, {width:`${width * scale}px`, height:`${height * scale}px`, left:`${-width*focus.x*scale}px`, top:`${-height*focus.y*scale}px`});
    currentDiagram.scale = scale;
    currentDiagram.cameraFocus = focus;
  }

  function poseDiagramTour(metadata) {
    const {tour, width, height, overview} = currentDiagram;
    const time = Math.max(0, Number(metadata.timeSeconds) || 0);
    const {cues} = tour;
    let index = -1;
    for (let i = 0; i < cues.length && cues[i].start <= time; i++) index = i;
    const cue = cues[index] || null;
    const next = cues[index + 1] || null;
    let focus = cue?.focus || overview;
    let transition = null;
    if (next) {
      // Camera arrives before the first word of each cue, then holds for reading.
      const transitionStart = Math.max(cue?.start ?? 0, next.start - .5);
      if (time >= transitionStart && next.start > transitionStart) {
        const amount = interval(time, transitionStart, next.start);
        const smooth = amount * amount * (3 - 2 * amount);
        focus = Object.fromEntries(['x','y','w','h'].map(key => [key, focus[key] + (next.focus[key] - focus[key]) * smooth]));
        transition = {to:next.id, start:transitionStart, end:next.start, progress:amount};
      }
    }
    applyDiagramCamera(focus);
    tour.counter.textContent = cue ? `Vista ${numbered(index + 1)} / ${numbered(cues.length)}` : 'Vista general';
    tour.label.textContent = cue?.label || 'El mapa antes del detalle';
    tour.description.textContent = cue?.description || 'El recuadro azul ubica el detalle que acompaña cada explicación.';
    tour.guide.dataset.cue = cue?.id || '';
    tour.dots.forEach((dot, i) => {dot.className = i === index ? 'is-current' : i < index ? 'is-complete' : '';});
    const region = cue?.highlight;
    tour.highlight.style.display = region ? 'block' : 'none';
    if (region) {
      const scale = currentDiagram.scale;
      Object.assign(tour.highlight.style, {left:`${(region.x - focus.x) * width * scale}px`, top:`${(region.y - focus.y) * height * scale}px`, width:`${region.w * width * scale}px`, height:`${region.h * height * scale}px`, opacity:String(transition ? 1 - transition.progress : 1)});
    }
    const mapFocus = tour.mapFocus;
    const mapScale = Math.min((tour.map.clientWidth - 16) / (width * mapFocus.w), (tour.map.clientHeight - 16) / (height * mapFocus.h));
    const mapWidth = width * mapFocus.w * mapScale, mapHeight = height * mapFocus.h * mapScale;
    Object.assign(tour.mapWindow.style, {width:`${mapWidth}px`, height:`${mapHeight}px`, left:`${(tour.map.clientWidth - mapWidth) / 2}px`, top:`${(tour.map.clientHeight - mapHeight) / 2}px`});
    Object.assign(tour.mapImage.style, {width:`${width * mapScale}px`, height:`${height * mapScale}px`, left:`${-mapFocus.x * width * mapScale}px`, top:`${-mapFocus.y * height * mapScale}px`});
    Object.assign(tour.mapViewport.style, {left:`${(focus.x - mapFocus.x) * width * mapScale}px`, top:`${(focus.y - mapFocus.y) * height * mapScale}px`, width:`${focus.w * width * mapScale}px`, height:`${focus.h * height * mapScale}px`});
    currentDiagram.tourInspection = {timeSeconds:time, timeProvided:Number.isFinite(metadata.timeSeconds), cueId:cue?.id || null, cueIndex:index, cueCount:cues.length, cueStart:cue?.start ?? null, cueEnd:cue?.end ?? null, phase:!cue ? 'overview' : time < cue.end ? 'speaking' : 'hold', label:cue?.label || null, phrase:cue?.phrase || null, targets:list(cue?.targets), focus:{...focus}, targetFocus:cue?.focus || overview, highlight:region || null, transition, nextCueId:next?.id || null, mapFocus:{...mapFocus}, scale:currentDiagram.scale};
  }

  function poseDiagram(progress, metadata) {
    if (!currentDiagram) return;
    if (currentDiagram.tour) { poseDiagramTour(metadata); return; }
    const {focus:target, overview} = currentDiagram;
    const move = ease(interval(progress, .22, .68));
    const focus = Object.fromEntries(['x','y','w','h'].map(key => [key, overview[key] + (target[key] - overview[key]) * move]));
    applyDiagramCamera(focus);
    const label = root.querySelector('.diagram-focus-label');
    if (label) label.style.opacity = String(ease(interval(progress, .56, .72)));
  }

  function pose(progress, metadata) {
    root.querySelectorAll('[data-enter]').forEach(el => {
      const enter = Number(el.dataset.enter);
      const amount = ease(interval(progress, enter, enter + .13));
      el.style.opacity = amount === 1 ? '' : String(amount);
      el.style.transform = amount === 1 ? 'none' : `translateY(${(1 - amount) * 22}px)`;
    });
    const chapter = metadata.chapterTitle || currentScene.chapterTitle || (typeof currentScene.chapter === 'string' ? currentScene.chapter : 'Arquitectura POS');
    document.getElementById('chapter-rail').innerHTML = `<span class="chapter-index">${numbered(metadata.chapterNumber || currentScene.chapter)}${metadata.totalChapters ? ` / ${numbered(metadata.totalChapters)}` : ''}</span> · ${esc(chapter)}`;
    const sceneNumber = Math.max(1, Number(metadata.sceneNumber) || 1);
    const totalScenes = Math.max(sceneNumber, Number(metadata.totalScenes) || 1);
    document.getElementById('scene-rail').textContent = `${numbered(sceneNumber)} / ${numbered(totalScenes)}`;
    document.getElementById('subtitle').textContent = metadata.subtitle || '';
    document.getElementById('film-progress-fill').style.width = `${(sceneNumber - 1 + progress) / totalScenes * 100}%`;
    poseFlow(progress);
    poseDiagram(progress, metadata);
  }

  /**
   * The only export entry point. Await before a 1920×1080 screenshot.
   * Same scene + progress + metadata always yields the same final layout and pose.
   * Tours use metadata.timeSeconds (scene-local seconds, including the voice lead).
   * Progress still controls the original entrance pose; it is not the tour clock.
   * No timers, network APIs, workers, or queue libraries are executed.
   */
  window.renderVideoScene = async (scene, progress = 1, metadata = {}) => {
    if (!scene || typeof scene !== 'object') throw new TypeError('scene debe ser un objeto.');
    const key = JSON.stringify([scene, metadata.chapterNumber]);
    const value = clamp(progress);
    currentScene = scene;
    if (key !== currentKey) {
      currentKey = key;
      sceneReady = build(scene, metadata);
    }
    await sceneReady;
    pose(value, metadata);
    return {width:WIDTH, height:HEIGHT, id:scene.id || '', kind:scene.kind || 'checklist', progress:value, diagramSource:currentDiagram?.source || null, diagramScale:currentDiagram?.scale || null, diagramTour:currentDiagram?.tourInspection || null};
  };

  window.inspectVideoScene = () => {
    const content = root.querySelector('.scene-content');
    const bounds = content?.getBoundingClientRect();
    const problems = [];
    const checks = [...root.querySelectorAll('.scene-title,.title-statement,.checklist-item,.compare-column,.code-panel,.code-bullets,.diagram-bullets,.diagram-tour-guide,.tour-cue-label,.tour-cue-description,.tour-minimap,.question-prompt,.question-answer,.flow-node,.flow-bullets,.scene-takeaway')];
    checks.forEach(el => {
      const r = el.getBoundingClientRect();
      if (r.left < 80 || r.right > 1840 || r.top < 150 || r.bottom > 929) problems.push({type:'outside-safe-area',element:el.className,rect:{x:r.x,y:r.y,w:r.width,h:r.height}});
      const looseText = el.matches('.scene-title,.question-prompt');
      if (el.scrollWidth > el.clientWidth + 2 || (!looseText && el.scrollHeight > el.clientHeight + 2)) problems.push({type:'content-overflow',element:el.className,scroll:[el.scrollWidth,el.scrollHeight],client:[el.clientWidth,el.clientHeight]});
    });
    const labels = [...root.querySelectorAll('.flow-edge-label > span')].map(el => ({text:el.textContent, bounds:el.getBoundingClientRect()}));
    labels.forEach((a,i) => labels.slice(i+1).forEach(b => {
      const width = Math.min(a.bounds.right,b.bounds.right)-Math.max(a.bounds.left,b.bounds.left);
      const height = Math.min(a.bounds.bottom,b.bounds.bottom)-Math.max(a.bounds.top,b.bounds.top);
      if (width > 1 && height > 1) problems.push({type:'overlapping-edge-labels',labels:[a.text,b.text],overlap:[width,height]});
    }));
    if (currentDiagram?.tour) {
      const credit = root.querySelector('.diagram-credit').getBoundingClientRect();
      for (const el of [currentDiagram.frame, currentDiagram.tour.guide, currentDiagram.tour.guide.querySelector('.tour-minimap')]) {
        const r = el.getBoundingClientRect();
        if (r.bottom > credit.top - 4) problems.push({type:'diagram-credit-overlap',element:el.className,bottom:r.bottom,creditTop:credit.top});
      }
    }
    return {id:currentScene?.id, problems, contentBounds:bounds ? {x:bounds.x,y:bounds.y,w:bounds.width,h:bounds.height} : null, diagramTour:currentDiagram?.tourInspection || null};
  };
  window.videoRendererReady = window.renderVideoScene(blankScene, 1, {chapterNumber:1,chapterTitle:'Vista previa',sceneNumber:1,totalScenes:1});
})();
