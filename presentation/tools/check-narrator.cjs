/* Browser QA for the recorded Spanish narrator. No real infrastructure is invoked. */
'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const path = require('node:path');
const vm = require('node:vm');
const { spawn } = require('node:child_process');
const { createHash } = require('node:crypto');

const root = path.resolve(__dirname, '..');
const port = Number(process.env.POS_NARRATOR_QA_PORT || 4201);
const remote = process.argv.slice(2).find(argument => !argument.startsWith('--'));
const smoke = process.argv.includes('--smoke');
const base = remote ? remote.replace(/\/$/, '') : `http://127.0.0.1:${port}`;
const entry = `${base}/presentation/pos-corporativo-reveal.html`;
const output = path.join(root, 'qa', 'narrator');
const report = { slides: 0, cues: 0, labSteps: 0, audioSeconds: 0, checks: [], viewports: [], errors: [], external: [], failedRequests: [] };
const action = name => `[data-narrator-action="${name}"]`;

function playwright() {
  for (const name of [process.env.PLAYWRIGHT_MODULE_PATH, path.resolve(root, '../video/node_modules/playwright'), 'playwright'].filter(Boolean)) {
    try { return require(name); } catch (error) { if (error.code !== 'MODULE_NOT_FOUND') throw error; }
  }
  throw new Error('Use the existing video Playwright dependency or set PLAYWRIGHT_MODULE_PATH.');
}

function observe(page) {
  page.on('pageerror', error => report.errors.push(error.message));
  page.on('console', message => { if (message.type() === 'error') report.errors.push(message.text()); });
  page.on('request', request => {
    if (/^https?:/.test(request.url()) && new URL(request.url()).origin !== new URL(base).origin) report.external.push(request.url());
  });
  page.on('response', response => { if (response.status() >= 400) report.failedRequests.push(`${response.status()} ${response.url()}`); });
}

const state = page => page.evaluate(() => POSNarrator.getState());
async function details(page, open) {
  const shown = await page.locator('#narrator-details').evaluate(element => element.matches(':popover-open'));
  if (shown !== open) await page.locator(action('details')).click();
  await page.waitForFunction(open => document.querySelector('#narrator-details').matches(':popover-open') === open && document.querySelector('[data-narrator-action="details"]').getAttribute('aria-expanded') === String(open), open);
  assert.equal(await page.locator('#narrator-details').isVisible(), open, 'Details visibility must match the native popover state');
}

const measureLayout = page => page.evaluate(() => {
  const box = element => {
    const { left, right, top, bottom, width, height } = element.getBoundingClientRect();
    return { left, right, top, bottom, width, height };
  };
  const visible = element => {
    const rect = element.getBoundingClientRect();
    return element.getClientRects().length > 0 && rect.width > 0 && rect.height > 0 && getComputedStyle(element).visibility !== 'hidden';
  };
  const bounds = elements => {
    const boxes = [...elements].filter(visible).map(box);
    return boxes.length ? { left: Math.min(...boxes.map(rect => rect.left)), right: Math.max(...boxes.map(rect => rect.right)), top: Math.min(...boxes.map(rect => rect.top)), bottom: Math.max(...boxes.map(rect => rect.bottom)) } : null;
  };
  const controls = [...document.querySelectorAll('#narrator-panel button,#narrator-panel select,#narrator-panel input')].filter(visible).map(element => ({ label: element.getAttribute('aria-label') || element.textContent, ...box(element) }));
  return {
    presentation: box(document.querySelector('#presentation')),
    scale: window.Reveal?.isReady() ? Reveal.getScale() : null,
    panel: box(document.querySelector('#narrator-panel')),
    footer: box(document.querySelector('.course-footer')),
    details: document.querySelector('#narrator-details').matches(':popover-open') ? box(document.querySelector('#narrator-details')) : null,
    navigation: bounds(document.querySelectorAll('.controls button:enabled,.reading-navigation button')),
    controls,
    width: innerWidth, height: innerHeight, documentWidth: document.documentElement.scrollWidth
  };
});

function unchangedPresentation(before, after, description) {
  for (const key of ['left', 'right', 'top', 'bottom', 'width', 'height']) {
    assert.ok(Math.abs(before.presentation[key] - after.presentation[key]) <= 1, `${description}: presentation ${key} changed from ${before.presentation[key]} to ${after.presentation[key]}`);
  }
  if (before.scale !== null) assert.ok(Math.abs(before.scale - after.scale) < .000001, `${description}: Reveal scale must not change`);
}

function compactLayout(layout) {
  assert.ok(layout.documentWidth <= layout.width + 1, 'Narrator must not create horizontal overflow');
  assert.ok(layout.panel.left >= -1 && layout.panel.right <= layout.width + 1, 'Compact player must fit horizontally');
  assert.ok(layout.panel.top >= layout.footer.top - 1 && layout.panel.bottom <= layout.footer.bottom + 1, 'Compact player must use the existing footer height');
  assert.ok(layout.presentation.bottom <= layout.footer.top + 2, 'Player must not cover the presentation');
  assert.ok(layout.navigation, 'Slide navigation must remain available with the narrator open');
  assert.ok(layout.navigation.top >= layout.footer.top - 1 && layout.navigation.bottom <= layout.height + 1, 'Slide navigation must remain inside the footer');
  assert.ok(layout.panel.right <= layout.navigation.left + 1, 'Compact player must not overlap slide navigation');
  for (const control of layout.controls) assert.ok(control.left >= -1 && control.right <= layout.width + 1 && control.top >= -1 && control.bottom <= layout.height + 1, `Narrator control outside viewport: ${JSON.stringify(control)}`);
  if (layout.details) {
    assert.ok(layout.details.left >= -1 && layout.details.right <= layout.width + 1 && layout.details.top >= -1 && layout.details.bottom <= layout.footer.top + 2, 'Details popover must fit above the footer without covering navigation');
  }
}

async function ready(page, suffix = '') {
  const response = await page.goto(entry + suffix);
  assert.equal(response.status(), 200);
  assert.match(response.headers()['content-security-policy'] || '', /media-src 'self'/);
  assert.match(response.headers()['content-security-policy'] || '', /connect-src 'self'/);
  await page.waitForFunction(() => document.body.dataset.ready === 'true' && window.POSNarrator && window.POS_REVEAL_NARRATION_CONTENT && window.POS_REVEAL_NARRATION_AUDIO);
}

async function goto(page, id) {
  await page.evaluate(id => POSCourse.goTo(id), id);
  await page.waitForFunction(id => POSCourse.getState().currentId === id, id);
  await page.waitForFunction(id => !POSNarrator.getState().open || POSNarrator.getState().slideId === id, id);
}

async function mediaReady(page) {
  await page.waitForFunction(() => {
    const audio = document.querySelector('#narrator-audio');
    return audio && audio.readyState >= 1 && Number.isFinite(audio.duration) && audio.duration > 0;
  }, null, { timeout: 30000 });
}

async function paused(page) {
  await page.evaluate(() => POSNarrator.pause());
  assert.notEqual((await state(page)).status, 'playing');
  assert.equal(await page.locator('#narrator-audio').evaluate(audio => audio.paused), true);
}

async function seek(page, index) {
  await page.evaluate(index => POSNarrator.seekCue(index), index);
  try { await page.waitForFunction(index => POSNarrator.getState().cueIndex === index, index); }
  catch (error) { throw new Error(`Cue ${index} was not retained: ${JSON.stringify(await state(page))}`, { cause: error }); }
  await page.evaluate(() => new Promise(resolve => requestAnimationFrame(resolve)));
}

function validateManifest(data) {
  const expectedSlides = data.content.slides.map(slide => slide.id);
  assert.ok(expectedSlides.length > 0 && new Set(expectedSlides).size === expectedSlides.length, 'The proposal must contain unique slides');
  assert.ok(data.content.slides.every(slide => slide.kind !== 'quiz'), 'Narration must not include assessment slides');
  assert.deepEqual(Object.keys(data.narration).sort(), [...expectedSlides].sort(), 'Every slide must have one narration script');
  assert.deepEqual(Object.keys(data.audio).sort(), [...expectedSlides].sort(), 'Every slide must have recorded audio');
  const labStates = new Set();
  for (const slide of data.content.slides) {
    const cues = data.narration[slide.id];
    const audio = data.audio[slide.id];
    assert.ok(Array.isArray(cues) && cues.length > 0, `Missing cues for ${slide.id}`);
    assert.ok(audio.duration > 0, `Invalid duration for ${slide.id}`);
    assert.match(audio.sha256, /^[a-f0-9]{64}$/i, `Missing SHA-256 for ${slide.id}`);
    assert.ok(Number.isInteger(audio.bytes) && audio.bytes > 0, `Missing byte count for ${slide.id}`);
    assert.equal(new URL(audio.src, entry).origin, new URL(base).origin, `Audio must be same origin: ${slide.id}`);
    assert.match(new URL(audio.src, entry).pathname, /\.mp3$/i);
    assert.deepEqual(audio.cues.map(cue => cue.id), cues.map(cue => cue.id), `Audio/text cue order differs for ${slide.id}`);
    assert.equal(new Set(cues.map(cue => cue.id)).size, cues.length, `Duplicate cue IDs in ${slide.id}`);
    let end = 0;
    cues.forEach((cue, index) => {
      assert.ok(typeof cue.text === 'string' && cue.text.trim().length > 10, `Empty narration in ${slide.id}/${cue.id}`);
      const timing = audio.cues[index];
      assert.equal(timing.textSha256, createHash('sha256').update(cue.text, 'utf8').digest('hex'), `Audio was generated from different text: ${slide.id}/${cue.id}`);
      assert.ok(Number.isFinite(timing.start) && Number.isFinite(timing.end), `Invalid timing ${slide.id}/${cue.id}`);
      assert.ok(timing.start >= end - .01 && timing.end > timing.start && timing.end <= audio.duration + .15, `Overlapping/out-of-bounds timing ${slide.id}/${cue.id}`);
      end = timing.end;
      if (cue.lab) {
        const scenario = data.labs[slide.lab]?.scenarios[cue.lab.scenario];
        assert.ok(scenario?.steps[cue.lab.step], `Invalid lab state in ${slide.id}/${cue.id}`);
        labStates.add(`${slide.id}/${cue.lab.scenario}/${cue.lab.step}`);
      }
    });
    report.audioSeconds += audio.duration;
  }
  const expectedLabs = new Set(data.content.slides.filter(slide => slide.lab).flatMap(slide => data.labs[slide.lab].scenarios.flatMap((scenario, s) => scenario.steps.map((_, n) => `${slide.id}/${s}/${n}`))));
  assert.equal(expectedLabs.size, 97, 'Retain all proposal simulation states');
  assert.deepEqual(labStates, expectedLabs, 'Narration must cover every scenario and every explicit laboratory state');
  report.labSteps = labStates.size;
  report.slides = expectedSlides.length;
  report.cues = Object.values(data.narration).reduce((sum, cues) => sum + cues.length, 0);
  report.checks.push('Manifest: complete slide coverage, unique ordered cues, monotonic timings, same-origin assets and every laboratory state');
}

async function checkCue(page, slide, cue, index, data) {
  await seek(page, index);
  assert.equal((await page.locator('#narrator-caption').textContent()).trim(), cue.text.trim(), `${slide.id}/${cue.id}: caption`);
  const result = await page.evaluate(({ id, cue }) => {
    const section = document.getElementById(id);
    const isFocused = element => element.classList.contains('narrator-focus') || !!element.closest('.narrator-focus');
    const matches = cue.focus?.selector ? [...section.querySelectorAll(cue.focus.selector)] : [];
    const nodes = (cue.focus?.nodes || []).map(id => ({ id, matches: [...section.querySelectorAll(`[data-node="${id}"]`)].map(isFocused) }));
    const edges = (cue.focus?.edges || []).map(id => ({ id, matches: [...section.querySelectorAll(`[data-edge="${id}"]`)].map(isFocused) }));
    return {
      selectorCount: matches.length, selectorFocused: matches.every(isFocused), nodes, edges,
      outside: [...document.querySelectorAll('.narrator-focus')].filter(element => !section.contains(element)).map(element => element.tagName),
      lab: POSCourse.getState().labs[id],
      codeVisible: [...section.querySelectorAll('pre')].some(element => getComputedStyle(element).visibility !== 'hidden' && element.getBoundingClientRect().height > 0)
    };
  }, { id: slide.id, cue });
  assert.deepEqual(result.outside, [], `${slide.id}/${cue.id}: stale highlights on another slide`);
  if (cue.focus?.selector) {
    assert.ok(result.selectorCount > 0, `${slide.id}/${cue.id}: selector does not exist: ${cue.focus.selector}`);
    assert.ok(result.selectorFocused, `${slide.id}/${cue.id}: selector not highlighted`);
  }
  for (const target of [...result.nodes, ...result.edges]) {
    assert.ok(target.matches.length > 0 && target.matches.some(Boolean), `${slide.id}/${cue.id}: missing highlight ${target.id}`);
  }
  if (cue.lab) {
    assert.deepEqual(result.lab, { scenario: cue.lab.scenario, step: cue.lab.step }, `${slide.id}/${cue.id}: incorrect visible lab state`);
    const step = data.labs[slide.lab].scenarios[cue.lab.scenario].steps[cue.lab.step];
    assert.equal(await page.locator(`#${slide.id} .lab-step-title`).innerText(), step.title);
    assert.equal(await page.locator(`#${slide.id} .lab-step-text`).innerText(), step.text);
    assert.deepEqual(new Set(await page.locator(`#${slide.id} .lab-node.active`).evaluateAll(nodes => nodes.map(node => node.dataset.node))), new Set(step.active));
  }
  if (slide.kind === 'code' || slide.kind === 'tree') assert.ok(result.codeVisible, `${slide.id}: code must remain visible during narration`);
  const timing = data.audio[slide.id].cues[index];
  assert.ok(Math.abs((await state(page)).currentTime - timing.start) < .35, `${slide.id}/${cue.id}: seek does not target the recorded cue`);
}

async function controls(page, data) {
  assert.equal((await state(page)).open, false, 'Narration must not open or play on page load');
  assert.equal(await page.locator('#narrator-audio').evaluateAll(elements => elements.every(audio => audio.paused)), true);
  const closedLayout = await measureLayout(page);
  await page.locator('[data-narrator-toggle]').click();
  await page.waitForFunction(() => POSNarrator.getState().status === 'playing');
  await mediaReady(page);
  assert.equal((await state(page)).open, true);
  unchangedPresentation(closedLayout, await measureLayout(page), 'Opening narrator');
  assert.equal(await page.locator('#narrator-details').evaluate(element => element.matches(':popover-open')), false, 'Options and transcript must initially remain collapsed');
  assert.equal(await page.locator('#narrator-details').isVisible(), false, 'Closed details must not be rendered by presentation reset styles');
  await page.waitForFunction(() => POSNarrator.getState().currentTime > .15);
  await page.evaluate(() => { window.__detailsAudio = document.querySelector('#narrator-audio'); });
  const beforeDetails = await state(page);
  await details(page, true);
  unchangedPresentation(closedLayout, await measureLayout(page), 'Opening narrator details');
  await page.waitForFunction(time => POSNarrator.getState().currentTime > time + .1, beforeDetails.currentTime);
  assert.equal((await state(page)).status, 'playing', 'Opening details must not pause narration');
  await details(page, false);
  const afterDetails = await state(page);
  assert.equal(afterDetails.status, 'playing', 'Closing details must not pause narration');
  assert.ok(afterDetails.currentTime >= beforeDetails.currentTime, 'Toggling details must not restart the recording');
  assert.equal(await page.evaluate(() => document.querySelector('#narrator-audio') === window.__detailsAudio), true, 'Toggling details must retain the audio element');
  await page.evaluate(() => { delete window.__detailsAudio; });
  unchangedPresentation(closedLayout, await measureLayout(page), 'Closing narrator details');
  await page.locator(action('play')).click();
  const before = await state(page);
  assert.equal(before.status, 'paused');
  await page.waitForTimeout(250);
  assert.ok(Math.abs((await state(page)).currentTime - before.currentTime) < .08, 'Pause must retain the exact playback position');
  await page.locator(action('play')).click();
  await page.waitForFunction(time => POSNarrator.getState().currentTime > time + .12, before.currentTime);
  await paused(page);
  await details(page, true);
  const rate = await page.locator('#narrator-rate').evaluate(select => [...select.options].map(option => option.value).find(value => Number(value) > 1));
  assert.ok(rate, 'Narrator must provide a faster playback option');
  await page.locator('#narrator-rate').selectOption(rate);
  assert.equal((await state(page)).rate, Number(rate));
  assert.equal(await page.locator('#narrator-audio').evaluate(audio => audio.playbackRate), Number(rate));
  await page.locator('#narrator-rate').selectOption('1');
  const initial = data.content.slides[0];
  await checkCue(page, initial, data.narration[initial.id][1], 1, data);
  await page.locator(action('previous')).click();
  assert.equal((await state(page)).cueIndex, 0);
  await page.locator(action('next')).click();
  assert.equal((await state(page)).cueIndex, 1);
  await page.locator(action('restart')).click();
  await paused(page);
  assert.equal((await state(page)).cueIndex, 0);
  assert.ok((await state(page)).currentTime < .4);
  await details(page, false);
  report.checks.push('Real audio starts only after gesture; pause/resume preserves position; rate, cue navigation and restart work');
  report.checks.push('Details and transcript are optional; opening/closing them preserves playback position, audio identity and presentation size/scale');

  await page.evaluate(() => { window.__oldNarratorAudio = document.querySelector('#narrator-audio'); });
  await goto(page, data.content.slides[1].id);
  await mediaReady(page);
  assert.equal(await page.locator('#narrator-audio').evaluate(audio => audio.paused), true, 'Manual slide changes must not autoplay');
  const newState = await state(page);
  await page.evaluate(() => {
    for (const type of ['ended', 'error', 'timeupdate', 'loadedmetadata']) window.__oldNarratorAudio.dispatchEvent(new Event(type));
  });
  const afterStale = await state(page);
  assert.equal(afterStale.slideId, newState.slideId);
  assert.equal(afterStale.cueIndex, newState.cueIndex);
  assert.equal(afterStale.status, newState.status, 'Detached audio callbacks must not mutate the current narrator');
  await page.locator(action('play')).click();
  await page.waitForFunction(() => POSNarrator.getState().status === 'playing');
  await page.evaluate(() => {
    Object.defineProperty(document, 'hidden', { configurable: true, get: () => true });
    document.dispatchEvent(new Event('visibilitychange'));
  });
  assert.equal((await state(page)).status, 'paused');
  await page.evaluate(() => { delete document.hidden; document.dispatchEvent(new Event('visibilitychange')); });
  assert.equal((await state(page)).status, 'paused', 'Returning to the tab must not unexpectedly resume speech');
  await page.locator(action('play')).click();
  await page.waitForFunction(() => POSNarrator.getState().status === 'playing');
  await page.locator('[data-ui="notes"]').click();
  assert.equal((await state(page)).status, 'paused', 'Opening explanatory tools must pause narration');
  await page.keyboard.press('Escape');
  report.checks.push('Manual navigation, tab hiding and tools pause narration; callbacks from detached audio cannot change a newer slide');
}

async function checkAdvance(page, data) {
  const first = data.content.slides[0], second = data.content.slides[1];
  await goto(page, first.id);
  await mediaReady(page);
  await details(page, true);
  await page.locator('#narrator-auto').uncheck();
  await details(page, false);
  assert.equal((await state(page)).autoAdvance, false);
  await page.evaluate(() => { const audio = document.querySelector('#narrator-audio'); audio.currentTime = audio.duration - .25; });
  await page.locator(action('play')).click();
  await page.waitForFunction(() => POSNarrator.getState().status === 'ended', null, { timeout: 10000 });
  assert.equal((await state(page)).slideId, first.id);
  await details(page, true);
  await page.locator('#narrator-auto').check();
  await details(page, false);
  await seek(page, data.narration[first.id].length - 1);
  await page.evaluate(() => { const audio = document.querySelector('#narrator-audio'); audio.currentTime = audio.duration - .25; });
  await page.locator(action('play')).click();
  await page.waitForFunction(id => POSNarrator.getState().slideId === id && POSNarrator.getState().status === 'playing', second.id, { timeout: 15000 });
  await paused(page);
  await details(page, true);
  await page.locator('#narrator-auto').uncheck();
  await details(page, false);
  report.checks.push('Natural media end respects the auto-advance preference; enabled mode advances to exactly the next slide');
}

async function checkPlayRejection(page) {
  await paused(page);
  await page.evaluate(() => {
    window.__narratorNativePlay = HTMLMediaElement.prototype.play;
    HTMLMediaElement.prototype.play = function () {
      HTMLMediaElement.prototype.play = window.__narratorNativePlay;
      return Promise.reject(new DOMException('QA: user gesture required', 'NotAllowedError'));
    };
  });
  try {
    await page.locator(action('play')).click();
    await page.waitForFunction(() => POSNarrator.getState().status === 'error');
    assert.equal(await page.locator('#narrator-audio').evaluate(audio => audio.paused), true);
    assert.equal((await page.locator(`${action('play')} .narrator-play-label`).textContent()).trim(), 'Reintentar');
    assert.equal(await page.locator(action('play')).getAttribute('aria-label'), 'Reintentar narración');
    await page.locator(action('play')).click();
    await page.waitForFunction(() => POSNarrator.getState().status === 'playing');
    await mediaReady(page);
    assert.equal(await page.locator('#narrator-audio').evaluate(audio => audio.paused), false);
    await paused(page);
  } finally {
    await page.evaluate(() => {
      if (window.__narratorNativePlay) HTMLMediaElement.prototype.play = window.__narratorNativePlay;
      delete window.__narratorNativePlay;
    });
  }
  report.checks.push('A rejected media.play() shows a retry state; a fresh gesture retries real playback successfully');
}

async function auditAllCues(page, data) {
  const proposalNarration = new Set(['ruta-de-aprendizaje', 'estado-de-las-decisiones', 'espejo-de-precios', 'incorporar-pais', 'arbol-nx', 'criterios-del-piloto']);
  const samples = smoke ? data.content.slides.filter((slide, index) => index === 0 || slide.kind === 'diagram' || slide.lab === 'architecture-patterns' || slide.id === 'fachada-e-interfaz-en-codigo' || proposalNarration.has(slide.id)) : data.content.slides;
  for (const slide of samples) {
    await goto(page, slide.id);
    await mediaReady(page);
    await paused(page);
    const duration = await page.locator('#narrator-audio').evaluate(audio => audio.duration);
    assert.ok(Math.abs(duration - data.audio[slide.id].duration) < .3, `${slide.id}: declared duration differs from the actual MP3`);
    for (const [index, cue] of data.narration[slide.id].entries()) await checkCue(page, slide, cue, index, data);
  }
  report.checks.push(`${samples.length} slides: recorded media decodes, exact cue seeking, matching captions, diagrams, code and laboratory states`);
}

async function checkManualInteractions(page, data) {
  const lab = data.content.slides.find(slide => slide.lab === 'architecture-patterns');
  await goto(page, lab.id); await mediaReady(page); await seek(page, 0);
  await page.locator(action('play')).click();
  await page.waitForFunction(() => POSNarrator.getState().status === 'playing');
  await page.locator(`#${lab.id} [data-scenario]`).first().click();
  assert.equal((await state(page)).status, 'paused', 'Manual lab changes must pause the narrator');
  const selected = await page.evaluate(id => POSCourse.getState().labs[id], lab.id);
  const laterCue = data.narration[lab.id].findIndex(cue => cue.lab?.scenario === 0 && cue.lab.step > 0);
  assert.ok(laterCue >= 0);
  await page.evaluate(time => {
    const audio = document.querySelector('#narrator-audio');
    audio.currentTime = time;
    audio.dispatchEvent(new Event('timeupdate'));
  }, data.audio[lab.id].cues[laterCue].start);
  assert.deepEqual(await page.evaluate(id => POSCourse.getState().labs[id], lab.id), selected, 'A queued timeupdate after pausing must not overwrite a manually selected laboratory state');
  await page.locator(action('play')).click();
  await page.waitForFunction(() => POSNarrator.getState().status === 'playing');
  assert.equal((await state(page)).cueIndex, laterCue, 'Resume must restore the cue at the retained media position');
  await paused(page);
  await page.screenshot({ path: path.join(output, 'desktop-lab.png') });

  const codeId = await page.locator('.course-slide').evaluateAll(slides => slides.find(slide => slide.querySelector('pre .fragment'))?.id);
  const code = data.content.slides.find(slide => slide.id === codeId);
  assert.ok(code, 'Keep a code example with real Reveal fragments as a regression fixture');
  await goto(page, code.id); await mediaReady(page); await seek(page, 0);
  assert.equal(await page.evaluate(() => Reveal.availableFragments().next), true, 'The narration fixture must have a pending code fragment');
  await page.locator(action('play')).click();
  await page.waitForFunction(() => POSNarrator.getState().status === 'playing');
  await page.locator('#presentation').focus();
  await page.keyboard.press('Space');
  assert.equal(await page.evaluate(() => POSCourse.getState().currentId), code.id, 'Space must still advance a code fragment inside its slide');
  assert.equal((await state(page)).status, 'paused', 'Manual code-fragment navigation must pause narration');
  report.checks.push('Manual laboratory and code-fragment interaction pause speech while preserving the proposal controls');
}

async function mobile(browser, data) {
  const page = await browser.newPage({ viewport: { width: 375, height: 812 }, reducedMotion: 'reduce' });
  observe(page);
  try {
    await ready(page, '?lectura=1');
    const closedLayout = await measureLayout(page);
    await page.locator('[data-narrator-toggle]').click();
    await mediaReady(page);
    await page.waitForFunction(() => POSNarrator.getState().status === 'playing');
    unchangedPresentation(closedLayout, await measureLayout(page), 'Mobile opening narrator');
    compactLayout(await measureLayout(page));
    await details(page, true);
    unchangedPresentation(closedLayout, await measureLayout(page), 'Mobile opening transcript');
    compactLayout(await measureLayout(page));
    await page.locator('#narrator-caption').focus();
    const captionSlide = await page.evaluate(() => POSCourse.getState().currentId);
    await page.keyboard.press('ArrowDown');
    assert.equal((await state(page)).status, 'playing', 'Scrolling the transcript must not pause narration');
    assert.equal(await page.evaluate(() => POSCourse.getState().currentId), captionSlide, 'Transcript keys must not navigate Reveal slides');
    await page.keyboard.press('Escape');
    // Native popover toggle events update aria-expanded in a subsequent task.
    await page.waitForFunction(() => !document.querySelector('#narrator-details').matches(':popover-open') && document.querySelector('[data-narrator-action="details"]').getAttribute('aria-expanded') === 'false');
    assert.equal((await state(page)).status, 'playing', 'Closing the transcript with Escape must retain playback');
    assert.equal((await state(page)).open, true, 'First Escape must close only the details');
    assert.equal(await page.locator(action('details')).getAttribute('aria-expanded'), 'false');
    assert.equal(await page.locator(action('details')).evaluate(button => button === document.activeElement), true, 'Closing details must restore focus to their toggle');
    await page.locator('#presentation').focus();
    await page.keyboard.press('Home');
    assert.equal((await state(page)).status, 'paused', 'Manual reading-mode scrolling must pause narration');
    await paused(page);
    const results = [];
    for (const slide of [data.content.slides[0], data.content.slides.find(slide => slide.kind === 'diagram'), data.content.slides.find(slide => slide.lab === 'architecture-patterns')]) {
      await goto(page, slide.id);
      await mediaReady(page);
      let cueIndex = data.narration[slide.id].findIndex(cue => cue.focus?.edges?.length || cue.lab?.step > 0);
      if (cueIndex < 0) cueIndex = data.narration[slide.id].findIndex(cue => cue.focus || cue.lab);
      if (cueIndex >= 0) await seek(page, cueIndex);
      const bounds = await measureLayout(page);
      const focusVisible = await page.evaluate(() => {
        const presentation = document.querySelector('#presentation').getBoundingClientRect();
        const slide = document.getElementById(POSCourse.getState().currentId);
        const targets = [...slide.querySelectorAll('.narrator-focus')].filter(element => element.getClientRects().length);
        if (!targets.length && slide.querySelector('.lab-step-title')) targets.push(slide.querySelector('.lab-step-title'));
        return targets.some(element => { const rect = element.getBoundingClientRect(); return rect.bottom > presentation.top && rect.top < presentation.bottom; });
      });
      unchangedPresentation(closedLayout, bounds, 'Mobile narrated slide');
      compactLayout(bounds);
      assert.ok(focusVisible, 'Narrated reading-mode diagram relationship or laboratory step must scroll into view');
      results.push({ slide: slide.id, ...bounds, focusVisible });
      await page.screenshot({ path: path.join(output, `mobile-${slide.id}.png`) });
    }
    const manualSlide = await page.evaluate(() => POSCourse.getState().currentId);
    await page.locator(action('play')).click();
    await page.waitForFunction(() => POSNarrator.getState().status === 'playing');
    await page.locator('.reading-navigation [data-ui="next"]').click();
    await page.waitForFunction(id => POSCourse.getState().currentId !== id, manualSlide);
    assert.equal((await state(page)).status, 'paused', 'Reading navigation must remain available and pause narration after a manual slide change');
    await details(page, true);
    await page.locator('#narrator-caption').focus();
    await page.keyboard.press('Escape');
    await page.waitForFunction(() => !document.querySelector('#narrator-details').matches(':popover-open') && document.querySelector('[data-narrator-action="details"]').getAttribute('aria-expanded') === 'false');
    assert.equal((await state(page)).open, true, 'Closing the transcript must not close the player');
    assert.equal(await page.locator(action('details')).evaluate(button => button === document.activeElement), true);
    await page.keyboard.press('Escape');
    assert.equal((await state(page)).open, false);
    assert.equal(await page.locator('[data-narrator-toggle]').evaluate(button => button === document.activeElement), true, 'Escape must restore focus to the narrator toggle');
    assert.equal(await page.locator('#narrator-audio').evaluateAll(elements => elements.every(audio => audio.paused)), true);
    unchangedPresentation(closedLayout, await measureLayout(page), 'Mobile closing narrator');
    report.viewports.push({ width: 375, height: 812, reading: true, samples: results });
    report.checks.push('375px reading mode: compact footer, optional transcript fits, slide area unchanged, reading navigation remains available, layered Escape restores focus and stops audio only on narrator close');
  } finally { await page.close(); }
}

async function nativeNavigationLayout(browser) {
  const page = await browser.newPage({ reducedMotion: 'reduce' });
  observe(page);
  try {
    for (const viewport of [{ width: 1440, height: 1000 }, { width: 768, height: 1024 }, { width: 375, height: 812 }]) {
      await page.setViewportSize(viewport);
      await ready(page, '?lectura=0');
      await page.evaluate(() => {
        const slide = Reveal.getSlides().find(element => { const { h, v } = Reveal.getIndices(element); return h > 0 && h < Reveal.getHorizontalSlides().length - 1 && v > 0 && v < element.parentElement.children.length - 1 && !element.querySelector('.fragment'); });
        POSCourse.goTo(slide.id);
      });
      assert.equal(await page.locator('.controls button:enabled').count(), 4, 'Narration layout must exercise the full native arrow cluster');
      const closedLayout = await measureLayout(page);
      await page.locator('[data-narrator-toggle]').click();
      await mediaReady(page);
      await page.waitForFunction(() => POSNarrator.getState().status === 'playing');
      await paused(page);
      const layout = await measureLayout(page);
      unchangedPresentation(closedLayout, layout, 'Presentation opening narrator');
      compactLayout(layout);
      await page.screenshot({ path: path.join(output, `native-navigation-${viewport.width}.png`) });
      await details(page, true);
      const expanded = await measureLayout(page);
      unchangedPresentation(closedLayout, expanded, 'Presentation opening narrator details');
      compactLayout(expanded);
      await page.screenshot({ path: path.join(output, `narrator-details-${viewport.width}.png`) });
      const focusedSlide = await page.evaluate(() => POSCourse.getState().currentId);
      await page.locator(action('restart')).focus();
      await page.keyboard.press('ArrowRight');
      await page.locator('#narrator-caption').focus();
      await page.keyboard.press('ArrowDown');
      assert.equal(await page.evaluate(() => POSCourse.getState().currentId), focusedSlide, 'Keys in narrator controls and transcript must not navigate slides');
      await details(page, false);
      unchangedPresentation(closedLayout, await measureLayout(page), 'Presentation closing narrator details');
      const before = await page.evaluate(() => POSCourse.getState().currentId);
      await page.locator(action('play')).click();
      await page.waitForFunction(() => POSNarrator.getState().status === 'playing');
      await page.locator('.controls .navigate-down').click();
      await page.waitForFunction(id => POSCourse.getState().currentId !== id, before);
      assert.equal((await state(page)).status, 'paused', 'Native arrows must pause narration on manual slide changes');
      const navigated = await measureLayout(page);
      unchangedPresentation(closedLayout, navigated, 'Presentation navigation with narrator');
      compactLayout(navigated);
      await page.locator(action('close')).click();
      const closed = await measureLayout(page);
      unchangedPresentation(closedLayout, closed, 'Presentation closing narrator');
      assert.ok(closed.presentation.bottom <= closed.footer.top + 2, 'Closing the narrator must preserve the reserved arrow footer');
      report.viewports.push({ ...viewport, reading: false, nativeNavigation: layout });
    }
    report.checks.push('Native Reveal arrows with actual narrator media at 1440/768/375: player shares existing footer without overlapping arrows; details fit above navigation; slide height and scale remain identical; manual arrows pause audio');
  } finally { await page.close(); }
}

async function run() {
  await fs.mkdir(output, { recursive: true });
  const server = remote ? null : spawn(process.execPath, [path.join(root, 'tools/serve-public.cjs')], { env: { ...process.env, POS_PUBLIC_PORT: String(port) }, windowsHide: true, stdio: ['ignore', 'pipe', 'pipe'] });
  let browser;
  try {
    if (server) await new Promise((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error('Preview startup timeout')), 10000);
      server.stdout.once('data', () => { clearTimeout(timer); resolve(); });
      server.once('exit', code => { clearTimeout(timer); reject(new Error(`Preview exited ${code}`)); });
    });
    browser = await playwright().chromium.launch();
    const page = await browser.newPage({ viewport: { width: 1440, height: 1000 }, reducedMotion: 'reduce' });
    observe(page);
    await ready(page);
    const data = await page.evaluate(() => ({ content: POS_REVEAL_CONTENT, labs: POS_REVEAL_LABS, narration: POS_REVEAL_NARRATION_CONTENT, audio: POS_REVEAL_NARRATION_AUDIO }));
    const sourceContext = { window: {} };
    vm.runInNewContext(await fs.readFile(path.join(root, 'pos-reveal-content.js'), 'utf8'), sourceContext, { timeout: 1500 });
    assert.deepEqual(data.content.slides.map(slide => slide.id), Array.from(sourceContext.window.POS_REVEAL_CONTENT.slides, slide => slide.id), 'Narrated presentation must match the current proposal source');
    validateManifest(data);
    const audioURL = new URL(Object.values(data.audio)[0].src, entry).href;
    const range = await page.request.get(audioURL, { headers: { Range: 'bytes=0-127' } });
    assert.equal(range.status(), 206, 'Static hosting must support audio range seeking');
    assert.match(range.headers()['content-type'], /^audio\/mpeg/);
    assert.match(range.headers()['content-range'], /^bytes 0-127\/\d+$/);
    assert.equal((await range.body()).length, 128);
    report.checks.push('Audio hosting: same-origin MP3 with byte-range 206 and correct MIME type');
    await controls(page, data);
    await checkPlayRejection(page);
    await checkAdvance(page, data);
    await auditAllCues(page, data);
    await checkManualInteractions(page, data);
    await mobile(browser, data);
    await nativeNavigationLayout(browser);
    await page.locator(action('close')).click();
    assert.equal((await state(page)).open, false);
    assert.equal(await page.locator('#narrator-audio').evaluateAll(elements => elements.every(audio => audio.paused)), true);
    assert.deepEqual(report.errors, []);
    assert.deepEqual(report.external, []);
    assert.deepEqual(report.failedRequests, []);
    report.checks.push('No browser errors, failed resources, external calls or audio after closing');
    console.log(JSON.stringify(report, null, 2));
  } catch (error) {
    report.failure = error.stack;
    throw error;
  } finally {
    await fs.writeFile(path.join(output, `${remote ? 'deployed-' : ''}${smoke ? 'smoke-' : ''}report.json`), JSON.stringify(report, null, 2));
    await browser?.close();
    server?.kill();
  }
}

if (require.main === module) run().catch(error => { console.error(error); process.exitCode = 1; });
module.exports = { validateManifest, controls, checkAdvance, checkPlayRejection, auditAllCues, checkManualInteractions, mobile, nativeNavigationLayout };
