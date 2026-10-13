/* Integrated browser QA. POSTs are intercepted; this suite never calls an LLM. */
'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const path = require('node:path');
const { servePublic } = require('./serve-public.cjs');

const root = path.resolve(__dirname, '..');
const output = path.join(root, 'qa', 'assistant');
const remote = process.argv.slice(2).find(argument => !argument.startsWith('--'));
const smoke = process.argv.includes('--smoke');
const report = { mode: smoke ? 'smoke' : 'full', target: null, checks: [], viewports: [], pageErrors: [], failedResources: [], external: [], blockedRealPosts: [], expectedApiStatuses: [] };
let entry, origin;
const selector = name => `[data-assistant-action="${name}"]`;

function playwright() {
  for (const name of [process.env.PLAYWRIGHT_MODULE_PATH, path.resolve(root, '../video/node_modules/playwright'), 'playwright'].filter(Boolean)) {
    try { return require(name); } catch (error) { if (error.code !== 'MODULE_NOT_FOUND') throw error; }
  }
  throw new Error('Use video/node_modules/playwright or set PLAYWRIGHT_MODULE_PATH.');
}

async function newPage(browser, viewport, fixture) {
  const page = await browser.newPage({ viewport, reducedMotion: 'reduce' });
  page.setDefaultTimeout(12000);
  page.on('pageerror', error => report.pageErrors.push(error.message));
  page.on('response', response => {
    if (response.status() < 400) return;
    if (new URL(response.url()).pathname === '/api/assistant') report.expectedApiStatuses.push(response.status());
    else report.failedResources.push(`${response.status()} ${response.url()}`);
  });
  await page.route('**/*', async route => {
    const request = route.request(), url = new URL(request.url());
    if (/^https?:/.test(url.protocol) && url.origin !== origin) {
      report.external.push(request.url()); return route.abort('blockedbyclient');
    }
    if (url.pathname !== '/api/assistant') return route.continue();
    if (fixture) return fixture(route);
    if (request.method() === 'POST') {
      report.blockedRealPosts.push(request.url());
      return route.fulfill({ status: 503, contentType: 'application/json', body: JSON.stringify({ error: 'qa_block', message: 'Real LLM calls are forbidden in browser QA.' }) });
    }
    return route.continue();
  });
  return page;
}

async function ready(page, suffix = '?lectura=0') {
  const response = await page.goto(entry + suffix);
  assert.equal(response.status(), 200, 'The presentation must load');
  assert.match(response.headers()['content-security-policy'] || '', /connect-src 'self'/, 'Assistant requests require same-origin CSP');
  await page.waitForFunction(() => document.body.dataset.ready === 'true' && window.POSAssistant && window.POSCourse);
}

async function go(page, id) {
  await page.evaluate(id => POSCourse.goTo(id, { instant: true }), id);
  await page.waitForFunction(id => POSCourse.getState().currentId === id, id);
}

async function open(page, available) {
  await page.locator('[data-assistant-toggle]').click();
  await page.waitForFunction(expected => POSAssistant.getState().open && POSAssistant.getState().available === expected, available);
}

async function send(page, text, shortcut = false) {
  await page.locator('#assistant-question').fill(text);
  if (shortcut) await page.locator('#assistant-question').press('Control+Enter');
  else await page.locator(selector('send')).click();
  await page.waitForFunction(() => !POSAssistant.getState().busy);
}

async function layout(page, label) {
  const result = await page.evaluate(() => {
    const dialog = document.querySelector('#assistant-dialog'), rect = dialog.getBoundingClientRect();
    const visible = element => element.getClientRects().length && getComputedStyle(element).visibility !== 'hidden';
    return {
      width: innerWidth, height: innerHeight, documentWidth: document.documentElement.scrollWidth,
      dialog: { left: rect.left, right: rect.right, top: rect.top, bottom: rect.bottom, scrollWidth: dialog.scrollWidth, clientWidth: dialog.clientWidth },
      controls: [...document.querySelectorAll('#assistant-dialog button,#assistant-dialog a,#assistant-dialog textarea,.course-header button')].filter(visible).map(element => {
        const b = element.getBoundingClientRect();
        return { name: element.getAttribute('aria-label') || element.id || element.textContent, left: b.left, right: b.right, top: b.top, bottom: b.bottom, height: b.height, inDialog: dialog.contains(element) };
      })
    };
  });
  report.viewports.push({ label, ...result });
  await page.screenshot({ path: path.join(output, `${label}.png`) });
  assert.ok(result.documentWidth <= result.width + 1, `${label}: document overflow`);
  assert.ok(result.dialog.left >= -1 && result.dialog.right <= result.width + 1 && result.dialog.top >= -1 && result.dialog.bottom <= result.height + 1, `${label}: dialog bounds`);
  assert.ok(result.dialog.scrollWidth <= result.dialog.clientWidth + 1, `${label}: horizontal dialog overflow`);
  for (const control of result.controls) {
    assert.ok(control.height >= 43.9, `${label}: control smaller than 44px: ${control.name}`);
    assert.ok(control.left >= -1 && control.right <= result.width + 1, `${label}: horizontal control overflow: ${control.name}`);
    if (control.inDialog) assert.ok(control.top >= result.dialog.top - 1 && control.bottom <= result.dialog.bottom + 1, `${label}: control clipped vertically: ${control.name}`);
  }
}

async function modeButtons(page) {
  const target = await page.evaluate(() => POS_REVEAL_CONTENT.slides[2].id);
  await go(page, target);
  assert.equal(await page.locator('#reading-toggle').evaluate(button => button.tagName), 'BUTTON');
  assert.equal((await page.locator('#reading-toggle').innerText()).trim(), 'Leer');
  await Promise.all([page.waitForURL(url => url.searchParams.get('lectura') === '1'), page.locator('#reading-toggle').click()]);
  await page.waitForFunction(id => document.body.dataset.ready === 'true' && POSCourse.getState().reading && POSCourse.getState().currentId === id, target);
  assert.equal(new URL(page.url()).hash, `#/${target}`, 'Reading mode must retain slide hash');
  assert.equal(await page.locator('#reading-toggle').evaluate(button => button.tagName), 'BUTTON');
  assert.equal((await page.locator('#reading-toggle').innerText()).trim(), 'Presentar');
  await Promise.all([page.waitForURL(url => url.searchParams.get('lectura') === '0'), page.locator('#reading-toggle').click()]);
  await page.waitForFunction(id => document.body.dataset.ready === 'true' && !POSCourse.getState().reading && POSCourse.getState().currentId === id, target);
  assert.equal(new URL(page.url()).hash, `#/${target}`, 'Present mode must retain slide hash');
  report.checks.push('Leer/Presentar are native buttons and preserve the current slide across both reloads');
  return target;
}

async function realDisabled(browser, viewport) {
  const page = await newPage(browser, viewport);
  try {
    await ready(page, viewport.width < 700 ? '?lectura=1' : '?lectura=0');
    if (viewport.width === 1440) await modeButtons(page);
    const configurationResponse = page.waitForResponse(response => new URL(response.url()).pathname === '/api/assistant' && response.request().method() === 'GET');
    await open(page, false);
    const configuration = await configurationResponse;
    assert.equal(configuration.status(), 200, 'Real configuration endpoint must respond successfully');
    assert.equal((await configuration.json()).available, false, 'This smoke deployment is expected to have the provider disabled');
    assert.equal(await page.locator('#assistant-question').isDisabled(), true);
    assert.equal(await page.locator(selector('send')).isDisabled(), true);
    assert.match(await page.locator('#assistant-status').innerText(), /no está habilitado|no está disponible|no se pudo comprobar/i);
    assert.equal(await page.locator('.assistant-message-assistant').count(), 0, 'Unavailable assistant must not invent responses');
    const before = await page.evaluate(() => POSCourse.getState().currentId);
    await page.locator(selector('close')).focus();
    for (const key of ['ArrowRight', 'ArrowDown', 'ArrowLeft', 'ArrowUp', 'PageDown']) await page.keyboard.press(key);
    assert.equal(await page.evaluate(() => POSCourse.getState().currentId), before, 'Modal arrows must not navigate Reveal');
    await layout(page, `${viewport.width}-disabled${remote ? '-deployed' : ''}`);
    await page.keyboard.press('Escape');
    await page.waitForFunction(() => !POSAssistant.getState().open);
    assert.equal(await page.locator('[data-assistant-toggle]').evaluate(button => button === document.activeElement), true, 'Native Escape must restore trigger focus');
    report.checks.push(`${viewport.width}px real disabled config: honest status, no invented answer, modal keyboard isolation and restored focus`);
  } finally { await page.close(); }
}

function fixtures() {
  const state = { mode: 'success', posts: [], pending: null, sourceId: null, number: 0 };
  const handle = async route => {
    if (route.request().method() === 'GET') return route.fulfill({ json: { available: true } });
    state.posts.push(route.request().postDataJSON());
    if (state.mode === 'hold') {
      await new Promise(resolve => { state.pending = resolve; });
      try { return await route.fulfill({ json: { answer: 'RESPUESTA TARDÍA DESCARTADA', sources: [] } }); } catch { return; }
    }
    if (typeof state.mode === 'number') return route.fulfill({ status: state.mode, headers: state.mode === 429 ? { 'Retry-After': '30' } : {}, json: { error: 'qa_fixture', message: 'Controlled HTTP test fixture' } });
    if (state.mode === 'long') return route.fulfill({ json: { answer: `Respuesta ${++state.number}. ${'Una explicación de la propuesta. '.repeat(85)}`, sources: [] } });
    return route.fulfill({ json: {
      answer: '**Explicación de prueba**\n\n<script>window.assistantXss=true</script>\n<img src=x onerror="window.assistantXss=true">\n\n```js\nconst ejemplo = 1;\n```\n\n- Primero, persistir.\n- Después, sincronizar.',
      sources: [
        { id: state.sourceId, title: 'TÍTULO INYECTADO', url: 'javascript:alert(1)' },
        { id: 'glosario', title: 'OTRO TÍTULO INYECTADO', url: '/presentation/pos-corporativo-reveal.html' },
        { id: 'glosario', url: 'https://example.com/presentation/pos-corporativo-reveal.html' },
        { id: 'document-proposal', title: 'OTRO TÍTULO INYECTADO', url: '/docs/propuesta-arquitectura.md' },
        { id: 'document-section', url: '/docs/propuesta-arquitectura.md#decision-local' },
        { id: 'invalid', url: 'https://example.com/docs/propuesta-arquitectura.md' },
        { id: 'invalid', url: '//example.com' },
        { id: 'invalid', url: '/docs/propuesta-arquitectura.md?redirect=evil' },
        { id: 'invalid', url: '/docs/propuesta-arquitectura.md#<script>' }
      ]
    } });
  };
  return { state, handle };
}

async function fullConversation(browser) {
  const fixture = fixtures(), page = await newPage(browser, { width: 1440, height: 1000 }, fixture.handle);
  try {
    await ready(page);
    const slides = await page.evaluate(() => POS_REVEAL_CONTENT.slides.map(slide => ({ id: slide.id, title: slide.title })));
    const current = slides[1], source = slides[3]; fixture.state.sourceId = source.id;
    await go(page, current.id);
    await page.locator('[data-narrator-toggle]').click();
    await page.waitForFunction(() => POSNarrator.getState().status === 'playing', null, { timeout: 30000 });
    await open(page, true);
    assert.equal(await page.evaluate(() => POSNarrator.getState().status), 'paused', 'Opening assistant must pause active narration');
    assert.equal(await page.locator('#narrator-audio').evaluate(audio => audio.paused), true);
    assert.equal((await page.locator('#assistant-context-title').innerText()).trim(), current.title);
    await send(page, '¿Por qué existe este límite de responsabilidad?', true);
    assert.deepEqual(fixture.state.posts[0], { question: '¿Por qué existe este límite de responsabilidad?', slideId: current.id, history: [] });
    assert.equal(await page.locator('.assistant-message-assistant').count(), 1);
    assert.equal(await page.evaluate(() => window.assistantXss), undefined);
    assert.equal(await page.locator('.assistant-message-assistant script,.assistant-message-assistant img').count(), 0);
    assert.equal(await page.locator('.assistant-message-assistant pre code').count(), 1);
    assert.equal(await page.locator('.assistant-sources [data-assistant-slide]').innerText(), source.title);
    assert.equal(await page.locator('.assistant-sources [data-assistant-action="glossary"]').innerText(), 'Glosario de arquitectura');
    const links = await page.locator('.assistant-sources a').evaluateAll(nodes => nodes.map(link => ({ href: link.getAttribute('href'), title: link.textContent, target: link.target, rel: link.rel })));
    assert.equal(links.length, 2, 'Only explicit proposal document paths may be rendered');
    for (const link of links) { assert.equal(link.title, 'Propuesta de arquitectura'); assert.equal(link.target, '_blank'); assert.match(link.rel, /noopener/); assert.match(link.href, /^\/docs\/propuesta-arquitectura\.md(?:#[a-z0-9-]+)?$/); }
    const before = await page.evaluate(() => POSCourse.getState().currentId);
    await page.locator('#assistant-question').focus();
    for (const key of ['ArrowRight', 'ArrowLeft', 'ArrowDown', 'ArrowUp']) await page.keyboard.press(key);
    assert.equal(await page.evaluate(() => POSCourse.getState().currentId), before);
    await layout(page, '1440-answer');
    await page.locator('.assistant-sources [data-assistant-action="glossary"]').click();
    await page.waitForFunction(() => !POSAssistant.getState().open && document.querySelector('#course-dialog').open);
    await page.keyboard.press('Escape');
    await page.waitForFunction(() => !document.querySelector('#course-dialog').open);
    assert.equal(await page.locator('[data-assistant-toggle]').evaluate(button => button === document.activeElement), true, 'Closing glossary source must return focus to assistant');
    await open(page, true);
    await page.locator('.assistant-sources [data-assistant-slide]').click();
    await page.waitForFunction(id => !POSAssistant.getState().open && POSCourse.getState().currentId === id, source.id);
    await open(page, true);
    assert.equal(await page.locator('#assistant-context-title').innerText(), source.title);
    assert.equal(await page.locator('.assistant-message-assistant').count(), 1, 'Reopening must preserve conversation');
    await send(page, '¿Cómo se aplica al siguiente componente?');
    assert.equal(fixture.state.posts.at(-1).slideId, source.id);
    assert.equal(fixture.state.posts.at(-1).history.length, 2);
    report.checks.push('Real narration pauses; contextual question via Ctrl+Enter; safe text/code rendering; validated source URLs; source navigation and updated context preserve conversation');

    fixture.state.mode = 'long';
    for (let n = 0; n < 8; n++) await send(page, `Pregunta de seguimiento ${n + 1}`);
    for (const body of fixture.state.posts) {
      assert.ok(body.history.length <= 12 && body.history.length % 2 === 0);
      assert.ok(body.history.reduce((total, item) => total + item.content.length, 0) <= 12000);
      body.history.forEach((item, index) => assert.equal(item.role, index % 2 ? 'assistant' : 'user'));
    }
    assert.ok(fixture.state.posts.at(-1).history.length > 0 && fixture.state.posts.at(-1).history.length < 12, 'Long responses must be bounded by total characters, not only pairs');
    report.checks.push('Conversation payloads contain only complete recent pairs, at most six pairs and 12,000 characters');

    await page.locator(selector('clear')).click();
    assert.equal(await page.locator('.assistant-message').count(), 0);
    for (const code of [403, 429, 503, 500]) {
      fixture.state.mode = code;
      await send(page, `Consulta HTTP ${code}`);
      assert.equal(await page.locator('#assistant-status').getAttribute('data-kind'), 'error');
      assert.equal(await page.evaluate(() => POSAssistant.getState().history.length), 0);
      assert.equal(await page.locator('.assistant-message-assistant').count(), 0);
      if (code === 429) assert.match(await page.locator('#assistant-status').innerText(), /30 segundos/);
      assert.equal(await page.locator('#assistant-question').inputValue(), `Consulta HTTP ${code}`);
    }
    report.checks.push('403, 429/Retry-After, 503 and 500 report Spanish errors, retain the question, and never add fake responses to history');

    fixture.state.mode = 'hold';
    await page.locator('#assistant-question').fill('Consulta que será cancelada');
    await page.locator(selector('send')).click();
    await page.waitForFunction(() => POSAssistant.getState().busy);
    for (let attempt = 0; !fixture.state.pending && attempt < 100; attempt++) await new Promise(resolve => setTimeout(resolve, 20));
    assert.equal(typeof fixture.state.pending, 'function', 'Canceled request must reach the deliberately delayed fixture');
    await page.locator(selector('stop')).click();
    assert.equal(await page.evaluate(() => POSAssistant.getState().busy), false);
    fixture.state.mode = 'success';
    await send(page, 'Consulta vigente después de cancelar');
    fixture.state.pending?.();
    await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
    assert.equal(await page.locator('.assistant-message-assistant').count(), 1);
    assert.equal(await page.locator('#assistant-conversation').getByText('RESPUESTA TARDÍA DESCARTADA', { exact: true }).count(), 0);
    assert.equal(await page.evaluate(() => POSAssistant.getState().history.length), 2);
    fixture.state.mode = 'hold'; fixture.state.pending = null;
    await page.locator('#assistant-question').fill('Consulta que cambia de contexto');
    await page.locator(selector('send')).click();
    for (let attempt = 0; !fixture.state.pending && attempt < 100; attempt++) await new Promise(resolve => setTimeout(resolve, 20));
    assert.equal(typeof fixture.state.pending, 'function');
    await go(page, slides[4].id);
    assert.equal(await page.evaluate(() => POSAssistant.getState().busy), false, 'Browser/history slide navigation must stop the old-context request');
    assert.equal(await page.locator('#assistant-context-title').innerText(), slides[4].title);
    fixture.state.pending();
    await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
    assert.equal(await page.locator('.assistant-message-assistant').count(), 1);
    assert.equal(await page.evaluate(() => POSAssistant.getState().history.length), 2, 'Aborted old-context request must not enter conversation history');
    await page.keyboard.press('Escape');
    await page.waitForFunction(() => !POSAssistant.getState().open);
    assert.equal(await page.locator('[data-assistant-toggle]').evaluate(button => button === document.activeElement), true);
    assert.equal(await page.evaluate(() => POSNarrator.getState().status), 'paused', 'Narration must not resume automatically after closing assistant');
    report.checks.push('Stop and slide navigation cancel pending requests; delayed or old-context responses cannot replace a newer answer; Escape restores focus without resuming narration');
  } finally { fixture.state.pending?.(); await page.close(); }
}

async function mobileConversation(browser) {
  const fixture = fixtures(), page = await newPage(browser, { width: 375, height: 812 }, fixture.handle);
  try {
    await ready(page, '?lectura=1');
    fixture.state.sourceId = await page.evaluate(() => POS_REVEAL_CONTENT.slides[1].id);
    await open(page, true);
    await send(page, 'Explícame cómo funcionaría en una tienda.');
    await layout(page, '375-answer');
    await page.locator(selector('close')).click();
    report.checks.push('375px reading-mode conversation: response, sources and composer fit; controls remain at least 44px');
  } finally { await page.close(); }
}

async function run() {
  await fs.mkdir(output, { recursive: true });
  let server, browser;
  try {
    if (remote) {
      const target = new URL(remote);
      entry = target.pathname === '/' ? `${target.origin}/presentation/pos-corporativo-reveal.html` : `${target.origin}${target.pathname}`;
    } else {
      server = await servePublic(0);
      entry = `http://127.0.0.1:${server.address().port}/presentation/pos-corporativo-reveal.html`;
    }
    origin = new URL(entry).origin; report.target = entry;
    browser = await playwright().chromium.launch();
    await realDisabled(browser, { width: 1440, height: 1000 });
    await realDisabled(browser, { width: 375, height: 812 });
    if (!smoke) await realDisabled(browser, { width: 320, height: 812 });
    if (!smoke) { await fullConversation(browser); await mobileConversation(browser); }
    assert.deepEqual(report.pageErrors, []);
    assert.deepEqual(report.failedResources, []);
    assert.deepEqual(report.external, []);
    assert.deepEqual(report.blockedRealPosts, [], 'No unmocked POST may be attempted');
    report.checks.push('No JavaScript errors, failed static resources, third-party connections or real provider POSTs');
    console.log(JSON.stringify(report, null, 2));
  } catch (error) {
    report.failure = error.stack;
    throw error;
  } finally {
    await fs.writeFile(path.join(output, `${remote ? 'deployed-' : ''}${smoke ? 'smoke-' : ''}report.json`), JSON.stringify(report, null, 2));
    await browser?.close();
    if (server) { server.closeAllConnections?.(); await new Promise(resolve => server.close(resolve)); }
  }
}

if (require.main === module) run().catch(error => { console.error(error); process.exitCode = 1; });
module.exports = { run };
