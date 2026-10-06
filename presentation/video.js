/* Native playback, chapter navigation and shareable timestamps. No requests or dependencies. */
'use strict';
(() => {
  const film = document.getElementById('film');
  const buttons = [...document.querySelectorAll('.chapters button[data-time]')];
  const currentChapter = document.getElementById('current-chapter');
  const includeTime = document.getElementById('include-time');
  const shareTime = document.getElementById('share-time');
  const status = document.getElementById('share-status');
  const fallback = document.getElementById('copy-fallback');
  const shareUrlInput = document.getElementById('share-url');
  let active = -1;

  const timestamp = seconds => {
    const total = Math.max(0, Math.floor(Number.isFinite(seconds) ? seconds : 0));
    return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
  };
  function readTime() {
    const raw = new URL(window.location.href).searchParams.get('t');
    if (!raw || !/^\d+(?:\.\d+)?$/.test(raw)) return 0;
    const value = Number(raw);
    return Number.isFinite(value) ? value : 0;
  }
  function boundedTime(value) {
    return Math.min(Math.max(0, value), Math.max(0, film.duration - .1));
  }
  function updateChapter() {
    let next = 0;
    buttons.forEach((button, index) => { if (film.currentTime + .01 >= Number(button.dataset.time)) next = index; });
    if (next !== active) {
      active = next;
      buttons.forEach((button, index) => {
        if (index === active) button.setAttribute('aria-current', 'true');
        else button.removeAttribute('aria-current');
      });
      currentChapter.textContent = buttons[active].querySelector('strong').textContent;
    }
    shareTime.textContent = timestamp(film.currentTime);
  }
  function applyUrlTime() {
    if (!Number.isFinite(film.duration)) return;
    const requested = readTime();
    film.currentTime = boundedTime(requested);
    includeTime.checked = requested > 0;
    updateChapter();
  }
  buttons.forEach(button => {
    button.setAttribute('aria-label', `Ir a ${button.querySelector('strong').textContent}, ${button.querySelector('span').textContent}`);
    button.addEventListener('click', () => {
      if (!Number.isFinite(film.duration)) return;
      film.currentTime = boundedTime(Number(button.dataset.time));
      updateChapter();
      film.play().catch(() => { /* Native controls remain available if playback is blocked. */ });
      film.focus({ preventScroll:true });
      const bounds = film.getBoundingClientRect();
      if (bounds.top < 0 || bounds.bottom > window.innerHeight) film.scrollIntoView({ block:'center', behavior:'instant' });
    });
  });
  film.addEventListener('loadedmetadata', () => {
    buttons.forEach(button => { button.disabled = false; });
    applyUrlTime();
  });
  film.addEventListener('timeupdate', updateChapter);
  film.addEventListener('seeked', updateChapter);
  const showMediaError = () => { document.getElementById('media-error').hidden = false; };
  film.addEventListener('error', showMediaError);
  film.querySelector('source').addEventListener('error', showMediaError);
  window.addEventListener('popstate', applyUrlTime);

  document.getElementById('copy-link').addEventListener('click', async () => {
    const url = new URL('/video', window.location.protocol === 'file:' ? 'https://presentation-gamma-rust.vercel.app' : window.location.origin);
    const seconds = Math.floor(film.currentTime || 0);
    const withTime = includeTime.checked;
    if (withTime) url.searchParams.set('t', String(seconds));
    fallback.hidden = true;
    try {
      if (!navigator.clipboard?.writeText) throw new Error('Clipboard unavailable');
      await navigator.clipboard.writeText(url.href);
      status.textContent = withTime ? `Enlace copiado desde ${timestamp(seconds)}.` : 'Enlace al video completo copiado.';
    } catch {
      fallback.hidden = false;
      shareUrlInput.value = url.href;
      shareUrlInput.focus();
      shareUrlInput.select();
      status.textContent = 'Seleccionamos el enlace para que puedas copiarlo.';
    }
  });
  updateChapter();
  if (film.readyState >= 1 && Number.isFinite(film.duration)) {
    buttons.forEach(button => { button.disabled = false; });
    applyUrlTime();
  }
})();
