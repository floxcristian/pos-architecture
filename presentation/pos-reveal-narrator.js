/* Recorded narration, synchronized to authored visual cues. No audio is requested
 * before the visitor activates the narrator. The course remains usable without it. */
(() => {
  'use strict';
  const $ = selector => document.querySelector(selector);
  const panel = $('#narrator-panel');
  const toggle = $('[data-narrator-toggle]');
  const button = action => $(`[data-narrator-action="${action}"]`);
  const progress = $('#narrator-progress');
  const caption = $('#narrator-caption');
  const scripts = window.POS_REVEAL_NARRATION_CONTENT;
  const recordings = window.POS_REVEAL_NARRATION_AUDIO;
  const slides = window.POS_REVEAL_CONTENT.slides;
  const state = { open: false, status: 'idle', slideId: null, cueIndex: 0, autoAdvance: true, rate: 1 };
  let audio = null, recording = null, cues = [], listeners = null;
  let request = 0, desiredPlaying = false, expectedSlideId = null;
  let pendingTime = null, scrubResume = null, needsVisual = false, internalNavigation = false;
  const time = value => `${Math.floor(Math.max(0, value || 0) / 60)}:${String(Math.floor(Math.max(0, value || 0) % 60)).padStart(2, '0')}`;
  const elapsed = () => pendingTime ?? audio?.currentTime ?? 0;
  const getState = () => ({ ...state, currentTime: elapsed() });
  function cueAt(seconds) {
    let index = 0;
    for (let i = 1; i < (recording?.cues.length || 0); i++) {
      if (seconds + .015 >= recording.cues[i].start) index = i;
      else break;
    }
    return index;
  }

  function layout() {
    if (state.open) document.body.style.setProperty('--narrator-height', `${Math.ceil(panel.getBoundingClientRect().height)}px`);
    else document.body.style.removeProperty('--narrator-height');
    if (window.Reveal?.isReady()) window.Reveal.layout();
  }
  new ResizeObserver(layout).observe(panel);

  function render() {
    const active = state.status === 'playing' || state.status === 'loading';
    button('play').textContent = active ? 'Pausar' : state.status === 'error' ? 'Reintentar' : state.status === 'ended' ? 'Repetir' : 'Reproducir';
    button('play').setAttribute('aria-label', `${button('play').textContent} narración`);
    button('previous').disabled = state.cueIndex === 0 || !cues.length;
    button('next').disabled = state.cueIndex >= cues.length - 1;
    button('restart').disabled = !cues.length;
    progress.disabled = !recording;
    const labels = { idle: 'Listo para explicar esta lámina', loading: 'Cargando narración…', playing: 'Narrando', paused: 'En pausa', ended: 'Lámina completada', error: 'No se pudo reproducir. Pulsa Reintentar.' };
    const status = `${labels[state.status]}${state.slideId ? ` · ${slides.find(slide => slide.id === state.slideId)?.title || ''}` : ''}`;
    if ($('#narrator-status').textContent !== status) $('#narrator-status').textContent = status;
    $('#narrator-position').textContent = `Fragmento ${state.cueIndex + 1} de ${cues.length}`;
    $('#narrator-time').textContent = `${time(elapsed())} / ${time(recording?.duration)}`;
    progress.setAttribute('aria-valuetext', `${time(elapsed())} de ${time(recording?.duration)}`);
    if (scrubResume === null) progress.value = elapsed();
  }

  function applyCue(index, force = false) {
    if (!cues[index]) return;
    if (force || index !== state.cueIndex || needsVisual) {
      state.cueIndex = index;
      window.POSCourse.applyNarrationCue(cues[index]);
      caption.textContent = cues[index].text;
      caption.scrollTop = 0;
      needsVisual = false;
    }
    render();
  }

  function fail() {
    desiredPlaying = false;
    request++;
    audio?.pause();
    state.status = 'error';
    render();
  }

  function pause() {
    desiredPlaying = false;
    request++;
    audio?.pause();
    window.POSCourse?.stop();
    if (state.open && state.status !== 'error' && state.status !== 'ended') state.status = 'paused';
    render();
  }

  function releaseAudio() {
    request++;
    desiredPlaying = false;
    listeners?.abort();
    listeners = null;
    if (audio) {
      audio.pause();
      audio.removeAttribute('src');
      audio.load();
      audio.remove();
    }
    audio = null;
    pendingTime = null;
    scrubResume = null;
  }

  function validRecording(id) {
    const text = scripts?.[id], media = recordings?.[id];
    return text?.length && media?.duration > 0 && media.cues?.length === text.length &&
      media.cues.every((cue, index) => cue.id === text[index].id && cue.start >= 0 && cue.end > cue.start && cue.end <= media.duration + .15) &&
      new URL(media.src, location.href).origin === location.origin;
  }

  function prepareSlide(id, startCue = 0) {
    releaseAudio();
    window.POSCourse.stop();
    window.POSCourse.clearNarrationCue();
    state.slideId = id;
    state.cueIndex = startCue;
    state.status = 'paused';
    recording = recordings?.[id] || null;
    cues = scripts?.[id] || [];
    if (!validRecording(id)) { fail(); return; }
    audio = document.createElement('audio');
    audio.id = 'narrator-audio';
    audio.preload = 'metadata';
    audio.hidden = true;
    audio.playbackRate = state.rate;
    audio.src = recording.src;
    document.body.append(audio);
    const currentAudio = audio;
    listeners = new AbortController();
    const listen = (event, handler) => currentAudio.addEventListener(event, () => {
      if (audio === currentAudio && state.open) handler();
    }, { signal: listeners.signal });
    pendingTime = recording.cues[startCue].start;
    progress.max = recording.duration;
    listen('loadedmetadata', () => {
      if (pendingTime !== null) { currentAudio.currentTime = pendingTime; pendingTime = null; }
      render();
    });
    listen('timeupdate', () => {
      if (pendingTime !== null) return;
      const index = cueAt(currentAudio.currentTime);
      // A visitor may be examining another laboratory state while paused.
      if (desiredPlaying && index !== state.cueIndex) applyCue(index);
      else render();
    });
    listen('playing', () => {
      if (!desiredPlaying) { currentAudio.pause(); return; }
      state.status = 'playing'; render();
    });
    listen('waiting', () => { if (desiredPlaying) { state.status = 'loading'; render(); } });
    listen('pause', () => {
      if (currentAudio.paused && desiredPlaying && !currentAudio.ended) pause();
    });
    listen('error', fail);
    listen('ended', () => {
      desiredPlaying = false;
      state.status = 'ended'; render();
      const next = slides[slides.findIndex(slide => slide.id === state.slideId) + 1];
      if (!state.autoAdvance || !next || document.hidden) return;
      expectedSlideId = next.id;
      internalNavigation = true;
      window.POSCourse.goTo(next.id, { instant: true });
      // Fragment events caused by Reveal changing slides are not user input.
      requestAnimationFrame(() => { internalNavigation = false; });
    });
    applyCue(startCue, true);
    currentAudio.load();
  }

  async function play() {
    if (!state.open || document.hidden) return;
    if (state.status === 'error') prepareSlide(state.slideId, state.cueIndex);
    if (!audio || state.status === 'error') return;
    if (state.status === 'ended') seekCue(0);
    const index = cueAt(elapsed());
    if (needsVisual || index !== state.cueIndex) applyCue(index, true);
    desiredPlaying = true;
    state.status = 'loading'; render();
    const ownRequest = ++request, currentAudio = audio;
    try {
      await currentAudio.play();
      if (request !== ownRequest || audio !== currentAudio || !desiredPlaying || !state.open) return;
      state.status = 'playing'; render();
    } catch (_) {
      if (request !== ownRequest || audio !== currentAudio) return;
      fail();
    }
  }

  function seekTo(seconds) {
    if (!audio || !recording) return;
    const target = Math.max(0, Math.min(seconds, recording.duration));
    if (audio.readyState >= 1) { pendingTime = null; audio.currentTime = target; }
    else pendingTime = target;
    if (state.status === 'ended') state.status = 'paused';
    applyCue(cueAt(target), true);
  }

  function seekCue(index) {
    if (!recording || !Number.isInteger(index) || index < 0 || index >= cues.length) return;
    seekTo(recording.cues[index].start);
  }

  function open() {
    if (state.open || !window.POSCourse || document.body.dataset.ready !== 'true') return;
    state.open = true;
    panel.hidden = false;
    toggle.setAttribute('aria-pressed', 'true');
    document.body.classList.add('narrator-open');
    layout();
    prepareSlide(window.POSCourse.getState().currentId);
    button('play').focus({ preventScroll: true });
    play();
  }

  function close() {
    if (!state.open) return;
    releaseAudio();
    window.POSCourse.clearNarrationCue();
    state.open = false;
    state.status = 'idle';
    expectedSlideId = null;
    panel.hidden = true;
    toggle.setAttribute('aria-pressed', 'false');
    document.body.classList.remove('narrator-open');
    layout();
    toggle.focus({ preventScroll: true });
  }

  toggle.addEventListener('click', () => state.open ? close() : open());
  panel.addEventListener('keydown', event => {
    if (event.key === 'Escape') { event.preventDefault(); event.stopPropagation(); close(); }
  });
  panel.addEventListener('click', event => {
    const action = event.target.closest('[data-narrator-action]')?.dataset.narratorAction;
    if (action === 'play') desiredPlaying ? pause() : play();
    if (action === 'previous') seekCue(state.cueIndex - 1);
    if (action === 'next') seekCue(state.cueIndex + 1);
    if (action === 'restart') { seekCue(0); play(); }
    if (action === 'close') close();
  });
  $('#narrator-rate').addEventListener('change', event => {
    state.rate = Number(event.target.value);
    if (audio) audio.playbackRate = state.rate;
  });
  $('#narrator-auto').addEventListener('change', event => { state.autoAdvance = event.target.checked; });
  progress.addEventListener('input', () => {
    if (scrubResume === null) { scrubResume = desiredPlaying; pause(); }
    seekTo(Number(progress.value));
  });
  progress.addEventListener('change', () => {
    const resume = scrubResume;
    scrubResume = null;
    render();
    if (resume) play();
  });
  document.addEventListener('poscourse:slidechange', event => {
    if (!state.open) return;
    const autoPlay = event.detail.id === expectedSlideId;
    expectedSlideId = null;
    prepareSlide(event.detail.id);
    if (autoPlay) play();
  });
  document.addEventListener('poscourse:interaction', event => {
    if (!state.open || internalNavigation) return;
    pause();
    if (['laboratory', 'fragment'].includes(event.detail.kind)) {
      window.POSCourse.clearNarrationCue(); needsVisual = true;
    }
    if (event.detail.kind === 'reading-scroll') needsVisual = true;
  });
  document.addEventListener('visibilitychange', () => { if (document.hidden && state.open) pause(); });
  window.addEventListener('pagehide', pause);
  for (const event of ['wheel', 'touchmove', 'pointerdown']) document.querySelector('main').addEventListener(event, () => {
    if (state.open && window.POSCourse.getState().reading) { pause(); needsVisual = true; }
  }, { passive: true });
  window.POSNarrator = { open, close, play, pause, seekCue, getState };
})();
