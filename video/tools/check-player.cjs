/* Functional QA of the delivered file:// player. Does not edit the package. */
'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const path = require('node:path');
const { pathToFileURL } = require('node:url');

const root = path.resolve(__dirname, '..');
const output = path.join(root, 'output');
const qa = path.join(root, 'work/qa');
const reportPath = path.join(qa, 'player-report.json');
const viewports = [
  { name: 'desktop', width: 1440, height: 1000, mobile: false },
  { name: 'tablet', width: 768, height: 1024, mobile: true },
  { name: 'mobile', width: 375, height: 812, mobile: true },
];

function playwright() {
  const bundled = path.join(require('node:os').homedir(), '.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
  for (const candidate of [process.env.PLAYWRIGHT_MODULE_PATH, 'playwright', bundled].filter(Boolean)) {
    try { return require(candidate); }
    catch (error) { if (error.code !== 'MODULE_NOT_FOUND') throw error; }
  }
  throw new Error('Playwright is unavailable. Set PLAYWRIGHT_MODULE_PATH to an existing installation; this check never downloads dependencies.');
}

async function readJSON(file) {
  return JSON.parse((await fs.readFile(file, 'utf8')).replace(/^\uFEFF/, ''));
}

async function main() {
  await fs.mkdir(qa, { recursive: true });
  const report = {
    generatedAt: new Date().toISOString(), status: 'RUNNING', transport: 'file://',
    scope: 'Browser metadata, chapter navigation, muted playback and responsive layout. No claim of human listening.',
    checks: [], failures: [], viewports: [], screenshots: [],
  };
  let browser;
  try {
    const delivery = await readJSON(path.join(root,'content/delivery.json'));
    const required = ['index.html', delivery.video, 'portada.jpg'];
    const missing = [];
    for (const name of required) {
      if (!(await fs.stat(path.join(output, name)).catch(() => null))?.isFile()) missing.push(name);
    }
    if (missing.length) {
      report.status = 'INCOMPLETE';
      report.missingFiles = missing;
      process.exitCode = 2;
      console.log(`INCOMPLETE: waiting for ${missing.join(', ')}`);
      return;
    }
    const timeline = await readJSON(path.join(root, 'work/timeline.json'));
    const expectedDuration = timeline.scenes.reduce((sum,scene)=>sum+scene.frames/timeline.fps,0);
    assert.equal(timeline.chapters.length, 14);
    assert.ok(Math.abs(timeline.duration - expectedDuration) < .15, 'Timeline differs from expected film duration');
    const { chromium } = playwright();
    browser = await chromium.launch({ headless: true });
    report.browser = await browser.version();

    for (const viewport of viewports) {
      const context = await browser.newContext({
        viewport: { width: viewport.width, height: viewport.height }, deviceScaleFactor: 1,
        isMobile: viewport.mobile, hasTouch: viewport.mobile, reducedMotion: 'reduce',
      });
      const page = await context.newPage();
      page.setDefaultTimeout(15000);
      const pageErrors = [], consoleErrors = [], externalRequests = [], failedRequests = [];
      const state = { ...viewport, seeks: [], errors: pageErrors, consoleErrors, externalRequests, failedRequests };
      report.viewports.push(state);
      page.on('pageerror', error => pageErrors.push(error.message));
      page.on('console', message => { if (message.type() === 'error') consoleErrors.push(message.text()); });
      page.on('request', request => {
        if (!/^(file|data|blob):/.test(request.url())) externalRequests.push(request.url());
      });
      page.on('requestfailed', request => {
        const error = request.failure()?.errorText || 'Unknown request failure';
        // Seeking can intentionally cancel an earlier media range request.
        if (!error.includes('ERR_ABORTED')) failedRequests.push({ url: request.url(), error });
      });
      await context.route(/^https?:\/\//, route => route.abort());

      const check = async (name, action) => {
        const label = `${viewport.name}: ${name}`;
        try {
          await action();
          report.checks.push(label);
          console.log(`PASS ${label}`);
          return true;
        } catch (error) {
          report.failures.push({ check: label, error: error.stack || String(error) });
          console.error(`FAIL ${label}: ${error.message}`);
          const screenshot = `player-${viewport.name}-failure-${report.failures.length}.png`;
          await page.screenshot({ path: path.join(qa, screenshot), fullPage: true }).then(() => report.screenshots.push(screenshot)).catch(() => {});
          return false;
        }
      };

      try {
        await page.goto(pathToFileURL(path.join(output, 'index.html')).href, { waitUntil: 'domcontentloaded' });
        const film = page.locator('#film');
        const buttons = page.locator('aside button[data-time]');
        state.codecSupport = await film.evaluate(video => video.canPlayType('video/mp4; codecs="avc1.42E01E, mp4a.40.2"'));
        const loaded = await check('local metadata and video format', async () => {
          await page.waitForFunction(() => {
            const video = document.getElementById('film');
            return video.error || (video.readyState >= 1 && Number.isFinite(video.duration));
          }, null, { timeout: 30000 });
          state.metadata = await film.evaluate(video => ({
            width: video.videoWidth, height: video.videoHeight, duration: video.duration,
            source: video.currentSrc, controls: video.controls,
            error: video.error ? { code: video.error.code, message: video.error.message } : null,
          }));
          assert.equal(state.metadata.error, null, JSON.stringify(state.metadata.error));
          assert.equal(state.metadata.width, 1920);
          assert.equal(state.metadata.height, 1080);
          assert.ok(Math.abs(state.metadata.duration - expectedDuration) < .15, `Unexpected duration: ${state.metadata.duration}`);
          assert.ok(state.metadata.source.startsWith('file:') && state.metadata.source.endsWith('/'+delivery.video));
          assert.equal(state.metadata.controls, true);
          await film.evaluate(video => { video.muted = true; });
        });

        await check('fourteen usable chapter buttons', async () => {
          assert.equal(await buttons.count(), 14);
          for (let index = 0; index < 14; index++) {
            const button = buttons.nth(index), chapter = timeline.chapters[index];
            assert.equal((await button.locator('strong').textContent()).trim(), chapter.title);
            assert.ok(Math.abs(Number(await button.getAttribute('data-time')) - chapter.start) <= .00051);
            assert.equal(await button.getAttribute('aria-label'), `Ir a ${chapter.title}`);
            assert.equal(await button.isEnabled(), true);
          }
        });

        if (loaded) {
          for (const index of [0, 7, 13]) {
            await check(`chapter ${index + 1} seek and muted playback`, async () => {
              const chapter = timeline.chapters[index];
              await film.evaluate(video => { video.pause(); video.muted = true; });
              await buttons.nth(index).click();
              await page.waitForFunction(({ start, index }) => {
                const video = document.getElementById('film');
                const current = document.querySelectorAll('aside button[data-time]')[index];
                return !video.error && !video.seeking && !video.paused && video.readyState >= 2
                  && Math.abs(video.currentTime - start) < 2 && current.getAttribute('aria-current') === 'true';
              }, { start: chapter.start, index });
              assert.equal(await film.evaluate(video => document.activeElement === video), true, 'Chapter click did not focus the video');
              const initialTime = await film.evaluate(video => video.currentTime);
              await page.waitForFunction(start => {
                const video = document.getElementById('film');
                return !video.paused && video.currentTime > start + .35;
              }, initialTime);
              const playback = await film.evaluate(video => {
                video.pause();
                const quality = video.getVideoPlaybackQuality?.();
                return { time: video.currentTime, muted: video.muted, decodedFrames: quality?.totalVideoFrames ?? video.webkitDecodedFrameCount ?? null, mediaError: video.error?.message || null };
              });
              assert.equal(playback.muted, true);
              assert.equal(playback.mediaError, null);
              assert.ok(playback.time >= chapter.start && playback.time < chapter.start + 4, 'Seek did not land near the chapter start');
              if (playback.decodedFrames !== null) assert.ok(playback.decodedFrames > 0, 'No video frame decoded');
              assert.equal(await page.locator('#now').textContent(), `Capítulo actual: ${chapter.title}`);
              assert.equal(await page.locator('aside button[aria-current="true"]').count(), 1);
              state.seeks.push({ chapter: index + 1, target: chapter.start, ...playback });
              // The chapter action and advancing playback are verified above.
              // Inspect a settled frame as well, after the film's nine-second reveal.
              const captureTime = chapter.start + 9;
              await film.evaluate((video, time) => { video.currentTime = time; }, captureTime);
              await page.waitForFunction(time => {
                const video = document.getElementById('film');
                return !video.seeking && video.readyState >= 2 && Math.abs(video.currentTime - time) < .1;
              }, captureTime);
              await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
              state.seeks.at(-1).screenshotTime = captureTime;
              const screenshot = `player-${viewport.name}-chapter-${String(index + 1).padStart(2, '0')}.png`;
              await film.screenshot({ path: path.join(qa, screenshot) });
              report.screenshots.push(screenshot);
            });
          }
        }

        await check('responsive layout and local assets', async () => {
          state.layout = await page.evaluate(() => ({
            viewport: innerWidth, document: document.documentElement.scrollWidth, body: document.body.scrollWidth,
            video: (() => { const b = document.getElementById('film').getBoundingClientRect(); return { left: b.left, right: b.right, width: b.width, height: b.height }; })(),
            overflowing: [...document.querySelectorAll('header,main,footer,.grid,section,aside,button,a')].filter(element => {
              const b = element.getBoundingClientRect();
              return b.width > 0 && (b.left < -1 || b.right > innerWidth + 1);
            }).map(element => ({ tag: element.tagName, text: element.textContent.trim().slice(0, 90) })),
          }));
          assert.ok(state.layout.document <= viewport.width + 1 && state.layout.body <= viewport.width + 1, JSON.stringify(state.layout));
          assert.deepEqual(state.layout.overflowing, []);
          assert.ok(state.layout.video.width > 200 && state.layout.video.right <= viewport.width + 1);
          for (const link of await page.locator('.download a').all()) {
            const href = await link.getAttribute('href');
            assert.ok(href && !href.includes('..') && !href.includes(':'), `Unexpected download URL: ${href}`);
            assert.ok((await fs.stat(path.join(output, href))).isFile(), `Missing download: ${href}`);
          }
          await page.evaluate(() => window.scrollTo(0, 0));
          const screenshot = `player-${viewport.name}-full.png`;
          await page.screenshot({ path: path.join(qa, screenshot), fullPage: true });
          report.screenshots.push(screenshot);
        });
        await check('no browser errors or external requests', async () => {
          assert.deepEqual(pageErrors, []);
          assert.deepEqual(consoleErrors, []);
          assert.deepEqual(externalRequests, []);
          assert.deepEqual(failedRequests, []);
        });
      } finally {
        await context.close();
      }
    }
    report.status = report.failures.length ? 'FAIL' : 'PASS';
    if (report.failures.length) process.exitCode = 1;
  } catch (error) {
    report.status = 'FAIL';
    report.failures.push({ check: 'setup or execution', error: error.stack || String(error) });
    process.exitCode = 1;
    console.error(error.message);
  } finally {
    if (browser) await browser.close();
    await fs.writeFile(reportPath, JSON.stringify(report, null, 2) + '\n');
    console.log(`${report.status}: ${reportPath}`);
  }
}

main().catch(error => { console.error(error); process.exitCode = 1; });
