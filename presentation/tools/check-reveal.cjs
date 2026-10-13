/* Browser QA for the Reveal course. Mock lessons never call infrastructure. */
'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const path = require('node:path');
const { spawn } = require('node:child_process');

const root = path.resolve(__dirname, '..');
const port = Number(process.env.POS_REVEAL_QA_PORT || 4198);
const navigationOnly = process.argv.includes('--navigation-only');
const remote = process.argv.slice(2).find(argument => !argument.startsWith('--'));
const base = remote ? remote.replace(/\/$/, '') : `http://127.0.0.1:${port}`;
const entry = `${base}/presentation/pos-corporativo-reveal.html`;
const output = path.join(root, 'qa', 'reveal');
const report = { slides: 0, chapters: 0, labs: 0, scenarios: 0, steps: 0, quizzes: 0, viewports: [], checks: [], errors: [], external: [], failedRequests: [] };

function playwright() {
  for (const name of [process.env.PLAYWRIGHT_MODULE_PATH, path.resolve(root, '../video/node_modules/playwright'), 'playwright'].filter(Boolean)) {
    try { return require(name); } catch (error) { if (error.code !== 'MODULE_NOT_FOUND') throw error; }
  }
  throw new Error('Install the existing video Playwright dependency or set PLAYWRIGHT_MODULE_PATH.');
}

function observe(page) {
  page.on('pageerror', error => report.errors.push(error.message));
  page.on('console', message => { if (message.type() === 'error') report.errors.push(message.text()); });
  page.on('request', request => {
    const url = request.url();
    if (/^https?:/.test(url) && new URL(url).origin !== new URL(base).origin) report.external.push(url);
  });
  page.on('response', response => { if (response.status() >= 400) report.failedRequests.push(`${response.status()} ${response.url()}`); });
}

async function ready(page, suffix = '') {
  const response = await page.goto(entry + suffix);
  assert.equal(response.status(), 200);
  assert.match(response.headers()['content-security-policy'] || '', /script-src 'self'/);
  assert.match(response.headers()['content-security-policy'] || '', /connect-src 'self'/);
  await page.waitForFunction(() => document.body.dataset.ready === 'true' && window.POS_REVEAL_CONTENT && window.POS_REVEAL_LABS);
  assert.equal(await page.evaluate(() => Reveal.VERSION), '5.1.0');
}

async function go(page, slide) {
  await page.evaluate(({ id, h, v }) => POSCourse.getState().reading ? POSCourse.goTo(id) : Reveal.slide(h, v, -1), slide);
  await page.waitForFunction(id => POSCourse.getState().currentId === id, slide.id);
  // Reveal keeps the outgoing slide visible briefly unless motion is reduced.
  await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
}

async function noOverflow(page, reading = false) {
  const result = await page.evaluate(reading => {
    const slide = reading ? document.getElementById(POSCourse.getState().currentId) : Reveal.getCurrentSlide();
    const rect = slide.getBoundingClientRect();
    const tolerance = 3;
    const blocks = [...slide.querySelectorAll('.slide-head,.slide-body,.takeaway,.slide-source,.slide-body > *')].filter(el => {
      const css = getComputedStyle(el);
      return css.visibility !== 'hidden' && css.display !== 'none';
    });
    const outside = reading ? [] : blocks.filter(el => {
      const b = el.getBoundingClientRect();
      return b.left < rect.left - tolerance || b.right > rect.right + tolerance || b.top < rect.top - tolerance || b.bottom > rect.bottom + tolerance;
    }).map(el => ({ class: el.className, text: el.textContent.slice(0, 90) }));
    const body = slide.querySelector('.slide-body');
    const takeaway = slide.querySelector('.takeaway');
    const header = slide.querySelector('.slide-head');
    const bodyRect = body?.getBoundingClientRect();
    return {
      id: slide.id, documentWidth: document.documentElement.scrollWidth, window: innerWidth,
      slideWidth: slide.scrollWidth, clientWidth: slide.clientWidth, outside,
      bodyOverflow: !reading && body ? body.scrollHeight - body.clientHeight : 0,
      overlap: !reading && bodyRect && takeaway ? bodyRect.bottom - takeaway.getBoundingClientRect().top : 0,
      headerOverlap: !reading && bodyRect && header ? header.getBoundingClientRect().bottom - bodyRect.top : 0,
      headFont: parseFloat(getComputedStyle(slide.querySelector('h1,h2')).fontSize),
      sourceFont: slide.querySelector('.slide-source') ? parseFloat(getComputedStyle(slide.querySelector('.slide-source')).fontSize) : null
    };
  }, reading);
  assert.ok(result.documentWidth <= result.window + 1, `Document overflow: ${JSON.stringify(result)}`);
  assert.ok(result.slideWidth <= result.clientWidth + 2, `Slide overflow: ${JSON.stringify(result)}`);
  assert.deepEqual(result.outside, [], `Blocks outside slide: ${JSON.stringify(result)}`);
  assert.ok(result.bodyOverflow <= 3, `Body overflow: ${JSON.stringify(result)}`);
  assert.ok(result.overlap <= 3 && result.headerOverlap <= 3, `Overlapping regions: ${JSON.stringify(result)}`);
  assert.ok(result.headFont >= (reading ? 28 : 40), `Small heading: ${JSON.stringify(result)}`);
  assert.ok(result.sourceFont === null || result.sourceFont >= 12, `Small source: ${JSON.stringify(result)}`);
}

async function waitServer(server) {
  await new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('Preview startup timeout')), 10000);
    server.stdout.once('data', () => { clearTimeout(timer); resolve(); });
    server.once('exit', code => { clearTimeout(timer); reject(new Error(`Preview exited ${code}`)); });
  });
}

async function checkMotion(browser) {
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 }, reducedMotion: 'no-preference' });
  observe(page);
  try {
    await ready(page);
    const target = await page.evaluate(() => {
      const slide = POS_REVEAL_CONTENT.slides.find(item => item.lab === 'prices-events');
      const steps = POS_REVEAL_LABS[slide.lab].scenarios[0].steps;
      return { id: slide.id, step: steps.findIndex(step => step.links.length > 0) };
    });
    assert.ok(target.step >= 0);
    await page.evaluate(id => POSCourse.goTo(id), target.id);
    const lab = page.locator(`#${target.id} .lab[data-lab]`);
    for (let i = 0; i < target.step; i++) await lab.locator('[data-lab-action="next"]').click();
    const packet = lab.locator('.lab-route circle').first();
    assert.ok(await lab.locator('animateMotion').count() > 0);
    const position = () => packet.evaluate(el => { const r = el.getBoundingClientRect(); return { x: r.x, y: r.y }; });
    const before = await position();
    await page.waitForTimeout(350);
    const after = await position();
    assert.ok(Math.hypot(after.x - before.x, after.y - before.y) > 5, 'SVG packet must visibly move along its declared route');
    await page.screenshot({ path: path.join(output, 'motion-events.png') });
    // Starting playback paints a fresh route; pause while its 1.2 s packet is moving.
    await lab.locator('[data-lab-action="play"]').click();
    await page.waitForTimeout(150);
    const circleHandle = await packet.elementHandle();
    const matrix = () => circleHandle.evaluate(el => {
      const matrix = el.getCTM();
      const svg = el.ownerSVGElement;
      return { connected: el.isConnected, e: matrix.e, f: matrix.f, time: svg.getCurrentTime(), paused: svg.animationsPaused() };
    });
    await lab.locator('[data-lab-action="play"]').click();
    const frozenBefore = await matrix();
    assert.equal(frozenBefore.connected, true, 'Pause must preserve the existing SVG route');
    assert.equal(frozenBefore.paused, true, 'Pause must freeze SVG animations immediately');
    assert.ok(frozenBefore.time > 0 && frozenBefore.time < 1.2, 'Packet must be paused before its motion completes');
    await page.waitForTimeout(350);
    const frozenAfter = await matrix();
    assert.equal(frozenAfter.connected, true);
    assert.ok(Math.abs(frozenAfter.e - frozenBefore.e) < .01 && Math.abs(frozenAfter.f - frozenBefore.f) < .01, 'Paused packet matrix must remain constant');
    assert.ok(Math.abs(frozenAfter.time - frozenBefore.time) < .001, 'Paused SVG timeline must remain constant');
    assert.equal(await lab.locator('[data-lab-action="play"]').innerText(), 'Reproducir');
    await fs.writeFile(path.join(output, 'motion-report.json'), JSON.stringify({ before, after, frozenBefore, frozenAfter }, null, 2));
    report.checks.push('Normal motion: SVG packet advances along its route and pause freezes its existing matrix/timeline immediately');
  } finally { await page.close(); }
}

async function checkNavigation(page, slides) {
  const currentId = () => page.evaluate(() => Reveal.getCurrentSlide().id);
  const checkDirections = async index => {
    for (const [action, offset] of [['previous', -1], ['next', 1]]) {
      const target = slides[index + offset];
      const direction = target?.h === slides[index].h ? (offset > 0 ? 'down' : 'up') : (offset > 0 ? 'right' : 'left');
      const button = page.locator(`[data-ui="${action}"]`);
      assert.equal(await button.getAttribute('data-direction'), direction, `${action} must show the destination direction on ${slides[index].id}`);
      assert.equal(await button.isDisabled(), !target);
      assert.equal(await button.locator('svg.navigation-arrow').getAttribute('aria-hidden'), 'true');
      assert.ok(await button.getAttribute('aria-label'), `${action} must expose its destination to screen readers`);
    }
  };
  await go(page, slides[0]);
  await checkDirections(0);
  await page.locator('#presentation').focus();
  for (let index = 1; index < slides.length; index++) {
    await page.keyboard.press('ArrowRight');
    assert.equal(await currentId(), slides[index].id, `Right must advance exactly one slide at ${index}`);
    await checkDirections(index);
  }
  await page.keyboard.press('ArrowRight');
  assert.equal(await currentId(), slides.at(-1).id, 'Right at the end must stay at the end');
  for (let index = slides.length - 2; index >= 0; index--) {
    await page.keyboard.press('ArrowLeft');
    assert.equal(await currentId(), slides[index].id, `Left must return exactly one slide at ${index}`);
  }
  await page.keyboard.press('ArrowLeft');
  assert.equal(await currentId(), slides[0].id, 'Left at the start must stay at the start');
  await page.locator('[data-ui="next"]').click();
  assert.equal(await currentId(), slides[1].id);
  await page.keyboard.press('ArrowRight');
  assert.equal(await currentId(), slides[2].id, 'Right must still work after a button receives focus');
  await page.keyboard.press('Enter');
  assert.equal(await currentId(), slides[3].id, 'Enter must activate the focused Next button once');
  await page.keyboard.press('Space');
  assert.equal(await currentId(), slides[4].id, 'Space must activate the focused Next button once');
  await page.keyboard.press('PageDown');
  assert.equal(await currentId(), slides[5].id);
  await page.keyboard.press('PageUp');
  assert.equal(await currentId(), slides[4].id);
  await page.locator(`#${slides[4].id} .slide-source a`).focus();
  await page.keyboard.press('ArrowRight');
  assert.equal(await currentId(), slides[5].id, 'Right must still work when a link has focus');

  await go(page, slides[1]);
  await page.locator('[data-ui="next"]').focus();
  await page.keyboard.press('ArrowDown');
  assert.equal(await currentId(), slides[2].id, 'Down must advance one slide inside the chapter after button focus');
  await page.keyboard.press('ArrowUp');
  assert.equal(await currentId(), slides[1].id, 'Up must return one slide inside the chapter after button focus');
  await go(page, slides[4]);
  await page.locator(`#${slides[4].id} .slide-source a`).focus();
  await page.keyboard.press('ArrowDown');
  assert.equal(await currentId(), slides[5].id, 'Down must remain available when a link has focus');
  await page.keyboard.press('ArrowUp');
  assert.equal(await currentId(), slides[4].id);

  for (let index = 0; index < slides.length; index++) {
    const atStart = index === 0 || slides[index - 1].h !== slides[index].h;
    const atEnd = index === slides.length - 1 || slides[index + 1].h !== slides[index].h;
    if (!atStart && !atEnd) continue;
    await go(page, slides[index]);
    await page.locator('#presentation').focus();
    for (const key of [...(atStart ? ['ArrowUp'] : []), ...(atEnd ? ['ArrowDown'] : [])]) {
      await page.keyboard.press(key);
      assert.equal(await currentId(), slides[index].id, `${key} must stop at the chapter boundary on ${slides[index].id}`);
    }
  }

  const fragmentId = await page.evaluate(() => Reveal.getSlides().find(slide => slide.querySelector('pre .fragment'))?.id);
  assert.ok(fragmentId, 'The course must retain a real code-highlight fragment example');
  const fragmentIndex = slides.findIndex(slide => slide.id === fragmentId);
  await go(page, slides[fragmentIndex]);
  await page.locator('#presentation').focus();
  const fragmentBefore = await page.evaluate(() => Reveal.getIndices().f ?? -1);
  await page.keyboard.press('Space');
  assert.equal(await currentId(), fragmentId, 'Space may reveal a code highlight without changing the slide');
  assert.ok(await page.evaluate(before => (Reveal.getIndices().f ?? -1) > before, fragmentBefore));
  await go(page, slides[fragmentIndex]);
  await page.keyboard.press('ArrowRight');
  assert.equal(await currentId(), slides[fragmentIndex + 1].id, 'Right skips remaining fragments and advances one slide');
  await page.keyboard.press('ArrowLeft');
  assert.equal(await currentId(), fragmentId);
  await page.locator('[data-ui="next"]').click();
  assert.equal(await currentId(), slides[fragmentIndex + 1].id, 'Next button shares the fragment-skipping navigation contract');
  assert.equal(slides[fragmentIndex].h, slides[fragmentIndex + 1].h, 'The fragment fixture must have a following slide inside its chapter');
  await go(page, slides[fragmentIndex]);
  await page.locator('#presentation').focus();
  await page.keyboard.press('ArrowDown');
  assert.equal(await currentId(), slides[fragmentIndex + 1].id, 'Down skips remaining fragments and advances one slide');
  await page.keyboard.press('ArrowUp');
  assert.equal(await currentId(), fragmentId, 'Up returns one complete slide');

  await page.locator('[data-ui="index"]').click();
  const beforeDialog = await currentId();
  for (const key of ['ArrowRight', 'ArrowLeft', 'ArrowDown', 'ArrowUp']) {
    await page.keyboard.press(key);
    assert.equal(await currentId(), beforeDialog, 'Dialog focus must isolate deck navigation');
  }
  await page.keyboard.press('Escape');
  for (const widget of ['input', 'slider']) {
    await page.evaluate(kind => {
      const element = document.createElement(kind === 'input' ? 'input' : 'div');
      element.id = 'qa-navigation-widget';
      element.style.cssText = 'position:fixed;top:0;left:0;z-index:9999';
      if (kind === 'slider') { element.setAttribute('role', 'slider'); element.tabIndex = 0; }
      document.body.append(element); element.focus();
    }, widget);
    for (const key of ['ArrowRight', 'ArrowLeft', 'ArrowDown', 'ArrowUp', 'PageDown', 'PageUp']) {
      await page.keyboard.press(key);
      assert.equal(await currentId(), beforeDialog, `${widget} must own ${key} without Reveal intercepting it`);
    }
    await page.locator('#qa-navigation-widget').evaluate(element => element.remove());
  }
  assert.equal(await page.evaluate(() => Reveal.getConfig().transition), 'none');
  assert.ok(await page.evaluate(() => document.getAnimations().filter(animation => animation.effect?.target?.closest?.('.slides')).length === 0), 'Reduced motion must not create slide animations');
  report.checks.push('87 exact Right advances + 87 exact Left returns; directional footer on all slides; Up/Down within chapters and all chapter boundaries; Next/Right/Enter/Space; fragments; Page keys; link focus; dialog/input/slider isolation; reduced motion');
  console.log('Navigation regression: all 174 exact slide moves, native controls, fragments and focus guards PASS.');
}

async function checkNavigationViewports(browser) {
  const page = await browser.newPage({ reducedMotion: 'reduce' });
  observe(page);
  try {
    for (const viewport of [{ width: 1440, height: 1000 }, { width: 768, height: 1024 }, { width: 375, height: 812 }]) {
      await page.setViewportSize(viewport);
      await ready(page, '?lectura=0');
      await page.locator('[data-ui="next"]').click();
      const layout = await page.locator('.course-footer').evaluate(footer => {
        const toBox = element => { const { left, right, top, bottom, width, height } = element.getBoundingClientRect(); return { left, right, top, bottom, width, height }; };
        return {
          viewport: { width: innerWidth, height: innerHeight }, footer: toBox(footer),
          info: toBox(footer.querySelector(':scope > div')), nav: toBox(footer.querySelector('nav')),
          buttons: [...footer.querySelectorAll('button')].map(button => ({ ...toBox(button), icon: toBox(button.querySelector('svg.navigation-arrow')) }))
        };
      });
      assert.ok(layout.info.right <= layout.nav.left + 1, `Footer text must not overlap navigation at ${viewport.width}: ${JSON.stringify(layout)}`);
      for (const button of layout.buttons) {
        assert.ok(button.left >= 0 && button.right <= viewport.width + 1 && button.top >= layout.footer.top && button.bottom <= viewport.height + 1, `Footer button outside viewport at ${viewport.width}`);
        assert.ok(button.icon.width >= 16 && button.icon.height >= 16, `Navigation arrow must remain visible at ${viewport.width}`);
      }
      await page.screenshot({ path: path.join(output, `navigation-${viewport.width}.png`) });
      if (viewport.width >= 1000) continue;
      await ready(page, '?lectura=1');
      const main = page.locator('#presentation');
      await main.evaluate(element => { element.style.scrollBehavior = 'auto'; element.scrollTop = 300; });
      await main.focus();
      const before = await main.evaluate(element => element.scrollTop);
      await page.keyboard.press('ArrowDown');
      await page.waitForTimeout(250);
      const afterDown = await main.evaluate(element => element.scrollTop);
      assert.ok(afterDown > before && afterDown - before < 150, `Down must scroll natively without jumping slides in reading mode at ${viewport.width}: ${before} → ${afterDown}`);
      await page.keyboard.press('ArrowUp');
      await page.waitForTimeout(250);
      const afterUp = await main.evaluate(element => element.scrollTop);
      assert.ok(afterUp < afterDown && afterDown - afterUp < 150, `Up must scroll natively in reading mode at ${viewport.width}: ${afterDown} → ${afterUp}`);
      assert.equal(await page.locator('[data-ui="next"]').getAttribute('data-direction'), 'down');
      await page.screenshot({ path: path.join(output, `navigation-${viewport.width}-reading.png`) });
    }
    report.checks.push('Directional footer fits 1440/768/375; native Up/Down reading scroll preserved at 768/375');
    console.log('Navigation layout: footer 1440/768/375 and native reading scroll 768/375 PASS.');
  } finally { await page.close(); }
}

async function checkSlideTransitions(browser) {
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 }, reducedMotion: 'no-preference' });
  observe(page);
  try {
    await ready(page);
    const slides = await page.evaluate(() => Reveal.getSlides().map(slide => ({ id: slide.id, ...Reveal.getIndices(slide) })));
    const boundary = slides.findIndex((slide, index) => index > 0 && slide.h !== slides[index - 1].h);
    assert.ok(boundary > 0);
    const transitions = [];
    for (const [label, from, to] of [
      ['within-forward', slides[0], slides[1]], ['within-backward', slides[1], slides[0]],
      ['chapter-forward', slides[boundary - 1], slides[boundary]], ['chapter-backward', slides[boundary], slides[boundary - 1]]
    ]) {
      await go(page, from);
      await page.waitForTimeout(500);
      const result = await page.evaluate(async ({ from, to }) => {
        const sourceSlide = document.getElementById(from.id);
        const motionElement = from.h === to.h ? sourceSlide : sourceSlide.parentElement;
        const measure = () => ({ transform: getComputedStyle(motionElement).transform, display: getComputedStyle(sourceSlide).display });
        const initial = measure();
        const events = [];
        let handler;
        const ended = new Promise((resolve, reject) => {
          const timeout = setTimeout(() => { motionElement.removeEventListener('transitionend', handler); reject(new Error('No transform transitionend for ' + from.id + ' → ' + to.id)); }, 1800);
          handler = event => {
            if (event.target === motionElement && event.propertyName === 'transform') {
              events.push({ property: event.propertyName, elapsed: event.elapsedTime });
              clearTimeout(timeout); motionElement.removeEventListener('transitionend', handler); resolve();
            }
          };
          motionElement.addEventListener('transitionend', handler);
        });
        Reveal.slide(to.h, to.v, -1);
        await new Promise(resolve => setTimeout(resolve, 70));
        const intermediate = measure();
        await ended;
        return { initial, intermediate, final: measure(), events, currentId: Reveal.getCurrentSlide().id };
      }, { from, to });
      assert.equal(result.currentId, to.id);
      assert.notEqual(result.intermediate.display, 'none', `${label}: outgoing slide must survive its transition`);
      assert.notEqual(result.intermediate.transform, result.initial.transform, `${label}: transform must move away from its start`);
      assert.notEqual(result.intermediate.transform, result.final.transform, `${label}: sample must capture an intermediate transform`);
      assert.ok(result.events.some(event => event.elapsed > 0));
      transitions.push({ label, from: from.id, to: to.id, ...result });
    }
    await fs.writeFile(path.join(output, 'slide-transitions.json'), JSON.stringify(transitions, null, 2));
    report.checks.push('Real slide transitions within/across chapters in both directions: outgoing layout preserved, intermediate transforms and transitionend');
    console.log('Transition regression: intra-chapter and cross-chapter motion in both directions PASS.');
  } finally { await page.close(); }
}

async function run() {
  await fs.mkdir(output, { recursive: true });
  const server = remote ? null : spawn(process.execPath, [path.join(root, 'server.cjs')], {
    env: { ...process.env, POS_ATLAS_PORT: String(port) }, windowsHide: true, stdio: ['ignore', 'pipe', 'pipe']
  });
  let browser;
  try {
    if (server) await waitServer(server);
    browser = await playwright().chromium.launch();
    const page = await browser.newPage({ viewport: { width: 1440, height: 1000 }, reducedMotion: 'reduce' });
    observe(page);
    await ready(page);
    const data = await page.evaluate(() => ({
      config: { width: Reveal.getConfig().width, height: Reveal.getConfig().height },
      content: window.POS_REVEAL_CONTENT,
      labs: window.POS_REVEAL_LABS,
      slides: Reveal.getSlides().map(slide => ({ id: slide.id, ...Reveal.getIndices(slide), title: slide.querySelector('h1,h2')?.textContent, lab: slide.querySelector('.lab')?.dataset.lab })),
      chapters: document.querySelectorAll('.slides > section').length
    }));
    assert.deepEqual(data.config, { width: 1280, height: 780 });
    assert.equal(data.slides.length, 88);
    assert.equal(data.chapters, 8);
    assert.equal(new Set(data.slides.map(slide => slide.id)).size, 88);
    assert.ok(data.slides.every(slide => slide.id && slide.title));
    assert.equal(Object.keys(data.labs).length, 7);
    report.chapters = data.chapters;
    const contentSlides = data.content.slides || data.content.chapters?.flatMap(chapter => chapter.slides) || [];
    assert.equal(contentSlides.length, 88);
    assert.deepEqual(data.slides.map(slide => slide.id), contentSlides.map(slide => slide.id), "Rendered chapters must preserve the declared learning sequence");
    await checkNavigation(page, data.slides);
    await checkSlideTransitions(browser);
    await checkNavigationViewports(browser);
    if (navigationOnly) {
      report.slides = data.slides.length;
      assert.deepEqual(report.errors, []);
      assert.deepEqual(report.external, []);
      assert.deepEqual(report.failedRequests, []);
      console.log(JSON.stringify(report, null, 2));
      return;
    }
    const sample = new Set(data.slides.filter((slide, index) => index % 4 === 0).map(slide => slide.id));
    const layoutFailures = [];
    for (const slide of data.slides) {
      await go(page, slide);
      try { await noOverflow(page); } catch (error) { layoutFailures.push(error.message); }
      assert.equal(await page.locator(`#${slide.id} .slide-head`).count(), 1);
      assert.equal(await page.locator(`#${slide.id} .takeaway`).count(), 1);
      assert.equal(await page.locator(`#${slide.id} .slide-source`).count(), 1);
      for (const image of await page.locator(`#${slide.id} img`).all()) {
        await image.evaluate(el => el.decode());
        assert.ok(await image.evaluate(el => el.naturalWidth > 0));
      }
      if (sample.has(slide.id)) await page.screenshot({ path: path.join(output, `${slide.id}.png`) });
      report.slides++;
    }
    assert.deepEqual(layoutFailures, [], 'Desktop layout failures:\n' + layoutFailures.join('\n'));
    console.log('All 88 slides: IDs, regions, readable heading sizes and 1280 × 780 bounds PASS.');

    const labSlides = data.slides.filter(slide => slide.lab);
    assert.equal(labSlides.length, 7);
    const labLayoutFailures = [];
    for (const slide of labSlides) {
      await go(page, slide);
      const labData = data.labs[slide.lab];
      assert.ok(labData, `Missing lab data: ${slide.lab}`);
      const lab = page.locator(`#${slide.id} .lab`);
      for (let s = 0; s < labData.scenarios.length; s++) {
        const scenario = labData.scenarios[s];
        const scenarioButton = lab.locator('[data-scenario]').nth(s);
        assert.equal(await scenarioButton.innerText(), scenario.label);
        await scenarioButton.click();
        assert.equal(await scenarioButton.getAttribute('aria-pressed'), 'true');
        for (let n = 0; n < scenario.steps.length; n++) {
          const step = scenario.steps[n];
          assert.equal(await lab.locator('.lab-step-title').innerText(), step.title);
          assert.equal(await lab.locator('.lab-step-text').innerText(), step.text);
          assert.equal(await lab.locator('.lab-log').innerText(), step.log);
          assert.equal(await lab.locator('.lab-node.active').count(), step.active.length);
          const activeLabels = await lab.locator('.lab-node.active h3').allTextContents();
          assert.deepEqual(new Set(activeLabels), new Set(step.active.map(id => labData.nodes.find(node => node.id === id)?.label)));
          for (const value of step.values) {
            assert.ok((await lab.locator('.lab-values').innerText()).includes(value.label));
            assert.ok((await lab.locator('.lab-values').innerText()).includes(value.value));
          }
          assert.match(await lab.locator('output').innerText(), new RegExp(`\\b${n + 1}\\s*(?:/|de)\\s*${scenario.steps.length}\\b`));
          assert.equal(await lab.locator('[data-lab-action="prev"]').isDisabled(), n === 0);
          assert.equal(await lab.locator('[data-lab-action="next"]').isDisabled(), n === scenario.steps.length - 1);
          try { await noOverflow(page); } catch (error) { labLayoutFailures.push(`${slide.lab}/${scenario.id}/${n + 1}: ${error.message}`); }
          report.steps++;
          if (n < scenario.steps.length - 1) await lab.locator('[data-lab-action="next"]').click();
        }
        await lab.locator('[data-lab-action="prev"]').click();
        assert.equal(await lab.locator('.lab-step-title').innerText(), scenario.steps.at(-2).title);
        await lab.locator('[data-lab-action="reset"]').click();
        assert.equal(await lab.locator('.lab-step-title').innerText(), scenario.steps[0].title);
        report.scenarios++;
      }
      report.labs++;
    }
    assert.deepEqual(labLayoutFailures, [], 'Lab layout failures:\n' + labLayoutFailures.join('\n'));
    console.log(`Labs: ${report.scenarios} scenarios / ${report.steps} explicit states PASS.`);

    const firstLab = labSlides[0];
    await go(page, firstLab);
    const liveLab = page.locator(`#${firstLab.id} .lab`);
    await liveLab.locator('[data-scenario]').first().click();
    await liveLab.locator('[data-lab-action="play"]').click();
    await page.waitForFunction(id => document.querySelector(`#${id} .lab-step-title`).textContent !== window.POS_REVEAL_LABS[document.querySelector(`#${id} .lab`).dataset.lab].scenarios[0].steps[0].title, firstLab.id, { timeout: 11000 });
    await liveLab.locator('[data-lab-action="play"]').click();
    const paused = await liveLab.locator('.lab-step-title').innerText();
    await page.waitForTimeout(9500);
    assert.equal(await liveLab.locator('.lab-step-title').innerText(), paused);
    await liveLab.locator('[data-lab-action="play"]').click();
    await go(page, data.slides[0]);
    await page.waitForTimeout(9500);
    await go(page, firstLab);
    assert.equal(await liveLab.locator('.lab-step-title').innerText(), paused);
    assert.equal(await page.evaluate(() => POSCourse.getState().playingId), null);
    assert.equal(await liveLab.locator('[data-lab-action="play"]').innerText(), 'Reproducir');
    assert.ok(await liveLab.locator('.packet').evaluateAll(elements => elements.every(el => getComputedStyle(el).animationName === 'none')));
    assert.equal(await liveLab.locator('animateMotion').count(), 0);
    report.checks.push('Autoplay advance, pause, leave cleanup, reset and reduced-motion packets');

    for (const slide of data.slides) {
      await go(page, slide);
      const answers = page.locator(`#${slide.id} .quiz-options button[data-answer]`);
      if (!(await answers.count())) continue;
      let success = false;
      for (const answer of await answers.all()) {
        await answer.click();
        assert.equal(await answer.getAttribute('aria-pressed'), 'true');
        assert.ok((await page.locator(`#${slide.id} .quiz-feedback`).innerText()).trim().length > 30);
        success ||= (await page.locator(`#${slide.id} .quiz-feedback.success`).count()) === 1;
        await noOverflow(page);
      }
      assert.ok(success, `Quiz has no successful answer: ${slide.id}`);
      report.quizzes++;
    }
    assert.ok(report.quizzes > 0);

    await go(page, data.slides[7]);
    for (const [action, title] of [['index', /recorrido|Índice/i], ['notes', /.+/], ['glossary', /Términos|Glosario/i]]) {
      await page.locator(`[data-ui="${action}"]`).click();
      assert.equal(await page.locator('dialog[open]').count(), 1);
      assert.match(await page.locator('#dialog-title').innerText(), title);
      assert.ok((await page.locator('#dialog-body').innerText()).trim().length > 60);
      await page.keyboard.press('Escape');
      assert.equal(await page.locator('dialog[open]').count(), 0);
      assert.equal(await page.locator(`[data-ui="${action}"]`).evaluate(el => el === document.activeElement), true);
    }
    const hash = await page.evaluate(() => location.hash);
    await page.reload(); await page.waitForFunction(() => document.body.dataset.ready === 'true');
    assert.equal(await page.evaluate(() => Reveal.getCurrentSlide().id), data.slides[7].id);
    assert.equal(await page.evaluate(() => location.hash), hash);
    await go(page, data.slides[0]); await page.locator('#presentation').focus();
    await page.keyboard.press('ArrowRight');
    await page.waitForFunction(id => Reveal.getCurrentSlide().id !== id, data.slides[0].id);
    await page.keyboard.press('ArrowLeft');
    await page.waitForFunction(id => Reveal.getCurrentSlide().id === id, data.slides[0].id);
    await go(page, data.slides[5]);
    await page.waitForFunction(id => location.hash.endsWith('/' + id), data.slides[5].id);
    await go(page, data.slides[7]);
    await page.waitForFunction(id => location.hash.endsWith('/' + id), data.slides[7].id);
    await page.goBack();
    await page.waitForFunction(id => Reveal.getCurrentSlide().id === id, data.slides[5].id);
    report.checks.push('Quizzes, modal tools, focus restoration, hash reload, browser history and keyboard navigation');

    const links = await page.locator('a[href]').evaluateAll(elements => [...new Set(elements.map(el => el.href).filter(href => /^https?:/.test(href)))]);
    for (const link of links.filter(link => new URL(link).origin === new URL(base).origin)) {
      const response = await page.request.get(link);
      assert.equal(response.status(), 200, `Broken internal link: ${link}`);
    }
    report.checks.push('Internal navigation and downloadable source links resolve');

    const responsiveFailures = [];
    for (const viewport of [{ width: 1920, height: 1080 }, { width: 768, height: 1024 }, { width: 375, height: 812 }]) {
      await page.setViewportSize(viewport);
      const reading = viewport.width < 1000;
      await ready(page, reading ? '?lectura=1' : '');
      if (reading) assert.ok(await page.locator('body').evaluate(el => el.classList.contains('reading-mode')));
      for (const slide of data.slides) {
        await go(page, slide);
        try { await noOverflow(page, reading); } catch (error) { responsiveFailures.push(`${viewport.width}: ${error.message}`); }
      }
      await go(page, firstLab);
      await page.screenshot({ path: path.join(output, `viewport-${viewport.width}${reading ? '-reading' : ''}.png`) });
      report.viewports.push({ ...viewport, reading });
    }
    assert.deepEqual(responsiveFailures, [], 'Responsive layout failures:\n' + responsiveFailures.join('\n'));
    await checkMotion(browser);
    assert.deepEqual(report.errors, []);
    assert.deepEqual(report.external, []);
    assert.deepEqual(report.failedRequests, []);
    report.checks.push('Desktop 1440/1920 and reading 768/375: all slides; no external requests or browser/CSP errors');
    console.log(JSON.stringify(report, null, 2));
  } catch (error) {
    report.failure = error.stack;
    throw error;
  } finally {
    const reportName = navigationOnly ? `${remote ? 'deployed-' : ''}navigation-report.json` : remote ? 'deployed-report.json' : 'report.json';
    await fs.writeFile(path.join(output, reportName), JSON.stringify(report, null, 2));
    await browser?.close();
    server?.kill();
  }
}

module.exports = { checkMotion, checkNavigation, checkNavigationViewports, checkSlideTransitions };
if (require.main === module) run().catch(error => { console.error(error); process.exitCode = 1; });
