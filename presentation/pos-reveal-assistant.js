/* Contextual questions use the server endpoint. No provider credentials or
 * model-produced HTML are accepted by this client. Conversations stay in memory. */
(() => {
  'use strict';
  const toggle = document.querySelector('[data-assistant-toggle]');
  const slides = window.POS_REVEAL_CONTENT?.slides || [];
  if (!toggle || !slides.length) return;
  const slideById = new Map(slides.map(slide => [slide.id, slide]));
  const dialog = document.createElement('dialog');
  dialog.id = 'assistant-dialog';
  dialog.className = 'assistant-dialog';
  dialog.setAttribute('aria-labelledby', 'assistant-title');
  dialog.innerHTML = `
    <header class="assistant-header">
      <div><p class="eyebrow">POS Platform · Arquitectura</p><h2 id="assistant-title">Asistente de la propuesta</h2></div>
      <button type="button" data-assistant-action="close" aria-label="Cerrar asistente">Cerrar</button>
    </header>
    <div class="assistant-context"><span>Contexto de tu próxima pregunta</span><strong id="assistant-context-title"></strong></div>
    <div id="assistant-conversation" class="assistant-conversation" role="log" aria-label="Conversación con el asistente" aria-live="polite" aria-relevant="additions" tabindex="0">
      <div class="assistant-welcome"><h3>Resuelve una duda sin salir de la propuesta</h3><p>Consulta el alcance, la justificación y el funcionamiento previsto de esta parte de POS Platform, incluidos sus fallos y recuperación.</p><div class="assistant-suggestions" aria-label="Ejemplos de preguntas"><button type="button" data-assistant-question="Explica qué se propone en esta lámina para POS Platform, por qué y qué queda pendiente de validar.">Revisar la propuesta</button><button type="button" data-assistant-question="Dame un ejemplo concreto de esta parte de la propuesta y explica por qué se diseñó así.">Ver un ejemplo</button><button type="button" data-assistant-question="¿Qué puede fallar en esta parte de la propuesta y cómo se recupera el sistema?">Explorar fallos</button></div></div>
    </div>
    <form id="assistant-form" class="assistant-composer">
      <div class="assistant-availability"><p id="assistant-status" role="status" aria-live="polite">Comprobando disponibilidad…</p><button type="button" data-assistant-action="retry-config" hidden>Reintentar conexión</button></div>
      <label for="assistant-question">Tu pregunta</label>
      <textarea id="assistant-question" name="question" rows="3" maxlength="2000" placeholder="Por ejemplo: ¿en qué casos se propone BullMQ o RabbitMQ?" aria-describedby="assistant-privacy assistant-input-help" required disabled></textarea>
      <div class="assistant-compose-actions"><span id="assistant-input-help">Ctrl + Enter para enviar · <span id="assistant-character-count">0</span>/2000</span><div><button type="button" data-assistant-action="clear" disabled>Vaciar conversación</button><button type="button" data-assistant-action="stop" hidden>Detener</button><button type="submit" class="primary" data-assistant-action="send" disabled>Enviar pregunta</button></div></div>
      <p id="assistant-privacy" class="assistant-privacy">Usa el contenido de la propuesta y la lámina actual. Puede equivocarse. Al enviar, compartes la pregunta con el proveedor de IA.</p>
    </form>`;
  document.body.append(dialog);
  const $ = selector => dialog.querySelector(selector);
  const action = name => $(`[data-assistant-action="${name}"]`);
  const form = $('#assistant-form'), input = $('#assistant-question');
  const conversation = $('#assistant-conversation'), status = $('#assistant-status');
  const state = { available: null, busy: false, slideId: slides[0].id };
  let opener = null, completed = [], request = null, configRequest = null, serial = 0, pendingMessage = null;
  class AssistantResponseError extends Error {}

  function context() {
    const current = window.POSCourse?.getState().currentId;
    state.slideId = slideById.has(current) ? current : slides[0].id;
    $('#assistant-context-title').textContent = slideById.get(state.slideId).title;
  }

  function setStatus(message, kind = '') {
    status.textContent = message;
    status.dataset.kind = kind;
  }

  function renderControls() {
    input.disabled = state.available !== true || state.busy;
    action('send').disabled = input.disabled || !input.value.trim();
    action('send').hidden = state.busy;
    action('stop').hidden = !state.busy;
    action('clear').disabled = state.busy || !conversation.querySelector('.assistant-message');
    action('retry-config').hidden = state.available !== false;
    dialog.querySelectorAll('[data-assistant-question]').forEach(button => { button.disabled = input.disabled; });
    $('#assistant-character-count').textContent = String(input.value.length);
    form.setAttribute('aria-busy', String(state.busy));
  }

  function scrollConversation() { conversation.scrollTop = conversation.scrollHeight; }

  function inlineText(parent, value) {
    const pattern = /(\*\*([^*\n]+)\*\*|`([^`\n]+)`)/g;
    let start = 0, match;
    while ((match = pattern.exec(value))) {
      parent.append(document.createTextNode(value.slice(start, match.index)));
      const node = document.createElement(match[2] ? 'strong' : 'code');
      node.textContent = match[2] || match[3];
      parent.append(node);
      start = match.index + match[0].length;
    }
    parent.append(document.createTextNode(value.slice(start)));
  }

  // Only text nodes and a small fixed set of elements are produced from model text.
  function answerText(container, text) {
    let code = null, list = null, paragraph = null;
    text.replace(/\r\n?/g, '\n').split('\n').forEach(line => {
      if (/^\s*```/.test(line)) {
        list = null; paragraph = null;
        if (code) code = null;
        else {
          const pre = document.createElement('pre');
          pre.tabIndex = 0;
          code = document.createElement('code');
          pre.append(code); container.append(pre);
        }
        return;
      }
      if (code) { code.append(document.createTextNode(`${line}\n`)); return; }
      if (!line.trim()) { list = null; paragraph = null; return; }
      const item = line.match(/^\s*(?:[-*]|\d+[.)])\s+(.+)$/);
      if (item) {
        paragraph = null;
        if (!list) { list = document.createElement('ul'); container.append(list); }
        const li = document.createElement('li'); inlineText(li, item[1]); list.append(li); return;
      }
      list = null;
      const heading = line.match(/^#{1,6}\s+(.+)$/);
      if (heading) {
        paragraph = null;
        const p = document.createElement('p'), strong = document.createElement('strong');
        inlineText(strong, heading[1]); p.append(strong); container.append(p); return;
      }
      if (!paragraph) { paragraph = document.createElement('p'); container.append(paragraph); }
      else paragraph.append(document.createTextNode(' '));
      inlineText(paragraph, line);
    });
  }

  function message(role, text, sources = []) {
    $('.assistant-welcome')?.remove();
    $('.assistant-empty')?.remove();
    const article = document.createElement('article');
    article.className = `assistant-message assistant-message-${role}`;
    const label = document.createElement('h3'); label.textContent = role === 'user' ? 'Tú' : 'Asistente';
    article.append(label);
    const body = document.createElement('div'); body.className = 'assistant-message-body';
    if (role === 'assistant') answerText(body, text);
    else { const p = document.createElement('p'); p.textContent = text; body.append(p); }
    article.append(body);
    const valid = [], seen = new Set();
    sources.forEach(source => {
      let entry;
      if (slideById.has(source?.id)) entry = { kind: 'slide', id: source.id, title: slideById.get(source.id).title, key: `slide:${source.id}` };
      else if (source?.id === 'glosario' && source.url === '/presentation/pos-corporativo-reveal.html') entry = { kind: 'glossary', title: 'Glosario de arquitectura', key: 'glossary' };
      else if (typeof source?.url === 'string' && (source.url === '/guide/proposal/product/' || /^\/docs\/propuesta-arquitectura\.md(?:#[a-z0-9][a-z0-9-]{0,119})?$/.test(source.url))) {
        entry = { kind: 'document', url: source.url, title: 'Propuesta de arquitectura', key: `document:${source.url}` };
      }
      if (entry && !seen.has(entry.key) && valid.length < 6) { seen.add(entry.key); valid.push(entry); }
    });
    if (valid.length) {
      const nav = document.createElement('nav'); nav.className = 'assistant-sources'; nav.setAttribute('aria-label', 'Fuentes de la propuesta');
      const heading = document.createElement('span'); heading.textContent = 'Consulta las fuentes'; nav.append(heading);
      valid.forEach(source => {
        if (source.kind === 'slide') {
          const button = document.createElement('button'); button.type = 'button'; button.dataset.assistantSlide = source.id;
          button.textContent = source.title;
          button.setAttribute('aria-label', `Ir a la lámina: ${source.title}`); nav.append(button);
        } else if (source.kind === 'glossary') {
          const button = document.createElement('button'); button.type = 'button'; button.dataset.assistantAction = 'glossary';
          button.textContent = source.title; nav.append(button);
        } else {
          const link = document.createElement('a'); link.href = source.url; link.target = '_blank'; link.rel = 'noopener noreferrer';
          link.textContent = source.title; link.setAttribute('aria-label', `${source.title} (abre en otra pestaña)`); nav.append(link);
        }
      });
      article.append(nav);
    }
    conversation.append(article);
    while (conversation.querySelectorAll('.assistant-message').length > 48) conversation.querySelector('.assistant-message').remove();
    scrollConversation();
    return article;
  }

  function notePending(text) {
    if (!pendingMessage) return;
    const note = document.createElement('p'); note.className = 'assistant-message-note'; note.textContent = text;
    pendingMessage.append(note); pendingMessage = null;
    scrollConversation();
  }

  function boundedHistory() {
    const result = [];
    let size = 0;
    for (const pair of completed.slice(-6).reverse()) {
      const length = pair[0].content.length + pair[1].content.length;
      if (size + length > 12000) break;
      result.unshift(...pair); size += length;
    }
    return result;
  }

  async function checkAvailability() {
    configRequest?.abort();
    const controller = new AbortController(); configRequest = controller;
    state.available = null; setStatus('Comprobando disponibilidad…'); renderControls();
    const timer = setTimeout(() => controller.abort(), 10000);
    try {
      const response = await fetch('/api/assistant?config=1', { signal: controller.signal, credentials: 'same-origin', cache: 'no-store', headers: { Accept: 'application/json' } });
      if (!response.ok) throw new Error('configuration-unavailable');
      const data = await response.json();
      if (controller !== configRequest || !dialog.open) return;
      state.available = data.available === true;
      setStatus(state.available ? 'Listo para responder sobre la propuesta.' : 'El asistente todavía no está habilitado en este despliegue. La presentación y el narrador siguen disponibles.', state.available ? '' : 'warning');
      renderControls();
      if (state.available && document.activeElement === action('close')) input.focus();
    } catch {
      if (controller !== configRequest || !dialog.open) return;
      state.available = false;
      setStatus('No se pudo comprobar la conexión del asistente. Puedes reintentar en unos segundos.', 'warning');
      renderControls();
    } finally { clearTimeout(timer); if (controller === configRequest) configRequest = null; }
  }

  function failureMessage(response) {
    if (response.status === 401 || response.status === 403) return 'Este despliegue no permite enviar la consulta. No se generó una respuesta.';
    if (response.status === 429) {
      const seconds = Number(response.headers.get('Retry-After'));
      return Number.isFinite(seconds) && seconds > 0 && seconds <= 3600 ? `Se alcanzó el límite de consultas. Reintenta en ${Math.ceil(seconds)} segundos.` : 'Se alcanzó el límite de consultas. Espera un momento antes de reintentar.';
    }
    if (response.status === 503) return 'El asistente no está disponible en este momento. Inténtalo más tarde.';
    if (response.status === 400 || response.status === 413) return 'No se pudo procesar la pregunta. Acórtala y vuelve a enviarla.';
    return 'No se pudo obtener una respuesta. Puedes volver a enviar tu pregunta.';
  }

  async function send() {
    const question = input.value.trim();
    if (state.busy || state.available !== true || !question || question.length > 2000 || !dialog.open) return;
    context();
    const sequence = ++serial, controller = new AbortController(); request = controller;
    let timedOut = false;
    const timer = setTimeout(() => { timedOut = true; controller.abort(); }, 60000);
    state.busy = true;
    pendingMessage = message('user', question);
    setStatus('Preparando una respuesta…'); renderControls(); action('stop').focus();
    try {
      const response = await fetch('/api/assistant', {
        method: 'POST', signal: controller.signal, credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ question, slideId: state.slideId, history: boundedHistory() })
      });
      if (sequence !== serial || request !== controller || !dialog.open) return;
      if (!response.ok) throw new AssistantResponseError(failureMessage(response));
      const data = await response.json();
      if (sequence !== serial || request !== controller || !dialog.open) return;
      if (typeof data?.answer !== 'string' || !data.answer.trim() || data.answer.length > 30000) throw new AssistantResponseError('El asistente devolvió una respuesta incompleta. Vuelve a intentarlo.');
      pendingMessage = null;
      message('assistant', data.answer, Array.isArray(data.sources) ? data.sources : []);
      completed.push([{ role: 'user', content: question }, { role: 'assistant', content: data.answer }]);
      completed = completed.slice(-6);
      input.value = '';
      setStatus('Respuesta lista. Puedes hacer una pregunta de seguimiento.');
    } catch (error) {
      if (sequence !== serial || request !== controller || !dialog.open) return;
      const explanation = timedOut ? 'La respuesta está tardando demasiado. La consulta se detuvo; puedes reintentarlo.' : error instanceof AssistantResponseError ? error.message : error instanceof TypeError ? 'Se perdió la conexión con el asistente. Revisa tu conexión y vuelve a intentar.' : 'No se pudo leer la respuesta del asistente. Puedes volver a enviar tu pregunta.';
      notePending('No se recibió una respuesta. La pregunta sigue disponible para reintentar.');
      setStatus(explanation, 'error');
    } finally {
      clearTimeout(timer);
      if (sequence === serial && request === controller) {
        request = null; state.busy = false; renderControls();
        if (dialog.open) input.focus();
      }
    }
  }

  function stop() {
    if (!state.busy) return;
    serial++; request?.abort(); request = null; state.busy = false;
    notePending('Consulta detenida. Puedes editar la pregunta o enviarla de nuevo.');
    setStatus('Consulta detenida.'); renderControls();
    if (dialog.open) input.focus();
  }

  function open() {
    if (dialog.open) return;
    opener = document.activeElement;
    document.dispatchEvent(new CustomEvent('poscourse:interaction', { detail: { kind: 'dialog' } }));
    window.POSCourse?.stop();
    context(); dialog.showModal(); toggle.setAttribute('aria-expanded', 'true');
    renderControls();
    if (state.available !== true) checkAvailability();
    else input.focus();
  }

  function close() { if (dialog.open) dialog.close(); }
  function clear() {
    if (state.busy) return;
    completed = []; pendingMessage = null; conversation.replaceChildren();
    const empty = document.createElement('p'); empty.className = 'assistant-empty'; empty.textContent = 'Conversación vacía. Puedes comenzar con una nueva pregunta.'; conversation.append(empty);
    setStatus(state.available ? 'Listo para una nueva conversación.' : 'El asistente no está disponible. Puedes reintentar la conexión.'); renderControls();
    if (!input.disabled) input.focus();
  }

  toggle.setAttribute('aria-controls', dialog.id);
  toggle.setAttribute('aria-expanded', 'false');
  toggle.addEventListener('click', open);
  form.addEventListener('submit', event => { event.preventDefault(); send(); });
  input.addEventListener('input', renderControls);
  dialog.addEventListener('keydown', event => {
    if (event.key === 'Enter' && (event.ctrlKey || event.metaKey) && event.target === input) { event.preventDefault(); send(); }
  });
  dialog.addEventListener('click', event => {
    const button = event.target.closest('button');
    if (!button) return;
    const name = button.dataset.assistantAction;
    if (name === 'close') close();
    else if (name === 'stop') stop();
    else if (name === 'clear') clear();
    else if (name === 'retry-config') checkAvailability();
    else if (name === 'glossary') {
      close(); document.querySelector('[data-ui="glossary"]')?.click();
      const courseDialog = document.querySelector('#course-dialog');
      if (courseDialog?.open) courseDialog.addEventListener('close', () => toggle.focus({ preventScroll: true }), { once: true });
    }
    else if (button.dataset.assistantQuestion && !input.disabled) { input.value = button.dataset.assistantQuestion; renderControls(); input.focus(); }
    else if (slideById.has(button.dataset.assistantSlide)) { close(); window.POSCourse?.goTo(button.dataset.assistantSlide); }
  });
  dialog.addEventListener('close', () => {
    stop(); configRequest?.abort(); configRequest = null;
    toggle.setAttribute('aria-expanded', 'false');
    if (opener?.isConnected) opener.focus({ preventScroll: true });
    else toggle.focus({ preventScroll: true });
  });
  document.addEventListener('poscourse:slidechange', () => { if (state.busy) stop(); context(); });
  window.addEventListener('pagehide', () => { stop(); configRequest?.abort(); });
  window.POSAssistant = { open, close, stop, clear, send, getState: () => ({ open: dialog.open, ...state, history: boundedHistory() }) };
})();
