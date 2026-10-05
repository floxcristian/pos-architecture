/* Behavioral QA for the proposed C4 explorer. Uses only the local preview server. */
'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const { spawn } = require('node:child_process');

const root = path.resolve(__dirname, '..');
const snapshots = path.join(root, 'qa');
const port = 4184;
const base = `http://127.0.0.1:${port}`;
const expectedViews = ['context', 'containers', 'backend', 'sync', 'deployment'];

function playwright() {
  const bundled = path.join(require('node:os').homedir(), '.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
  for (const candidate of [process.env.PLAYWRIGHT_MODULE_PATH, 'playwright', bundled].filter(Boolean)) {
    try { return require(candidate); }
    catch (error) { if (error.code !== 'MODULE_NOT_FOUND') throw error; }
  }
  throw new Error('Playwright is required for QA. Set PLAYWRIGHT_MODULE_PATH if no local or bundled module is available. The presentation needs no dependency.');
}

function startServer() {
  const server = spawn(process.execPath, [path.join(root, 'server.cjs')], {
    env: { ...process.env, POS_ATLAS_PORT: String(port) },
    windowsHide: true,
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  let output = '';
  server.stderr.on('data', chunk => { output += chunk; });
  const ready = new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error(`Preview server timeout: ${output}`)), 8000);
    server.stdout.on('data', chunk => {
      output += chunk;
      if (output.includes(base)) { clearTimeout(timeout); resolve(); }
    });
    server.once('error', error => { clearTimeout(timeout); reject(error); });
    server.once('exit', code => { clearTimeout(timeout); reject(new Error(`Preview server exited (${code}): ${output}`)); });
  });
  return { server, ready };
}

async function stopServer(server) {
  if (server.exitCode !== null || server.signalCode !== null) return;
  await new Promise(resolve => {
    const timeout = setTimeout(resolve, 3000);
    server.once('exit', () => { clearTimeout(timeout); resolve(); });
    server.kill();
  });
}

async function main() {
  const { chromium } = playwright();
  const { server, ready } = startServer();
  const checks = [], failures = [], errors = [], external = [], geometry = [];
  let browser, page;
  try {
    await ready;
    await fs.mkdir(snapshots, { recursive: true });
    browser = await chromium.launch({ headless: true });
    page = await browser.newPage({ viewport: { width: 1440, height: 1000 }, reducedMotion: 'reduce' });
    page.setDefaultTimeout(6000);
    page.on('pageerror', error => errors.push(error.message));
    page.on('request', request => {
      const url = request.url();
      if (!url.startsWith(`${base}/`) && !url.startsWith('data:')) external.push(url);
    });

    const run = async (name, test) => {
      try {
        await test();
        checks.push(name);
        console.log(`PASS: ${name}`);
      } catch (error) {
        failures.push({ check: name, error: error.stack || String(error) });
        console.error(`FAIL: ${name}: ${error.message}`);
        await page.screenshot({ path: path.join(snapshots, `c4-failure-${failures.length}.png`), fullPage: true }).catch(() => {});
        // Continue independent checks, but retain every failure and fail the process below.
        if (await page.locator('#modal').evaluate(element => element.open).catch(() => false)) await page.keyboard.press('Escape');
      }
    };
    const open = async () => {
      await page.goto(`${base}/#propuesta?vista=arquitectura`);
      await page.locator('#c4-view-select').waitFor();
    };
    const select = async id => {
      await page.locator('#c4-view-select').selectOption(id);
      await page.locator('#c4-canvas svg').waitFor();
      assert.equal(await page.locator('#c4-view-select').inputValue(), id);
    };
    const action = name => page.locator(`[data-c4-action="${name}"]`);
    const expandAlternative = async () => {
      if (!await page.locator('.c4-alternative').evaluate(element => element.open)) {
        await page.locator('.c4-alternative > summary').click();
      }
      assert.equal(await page.locator('.c4-alternative').evaluate(element => element.open), true);
    };
    const assertNoDocumentOverflow = async context => {
      const dimensions = await page.evaluate(() => ({ width: innerWidth, scroll: document.documentElement.scrollWidth }));
      assert.ok(dimensions.scroll <= dimensions.width + 1, `${context}: document overflow ${dimensions.scroll}px > ${dimensions.width}px`);
    };
    const assertNoRawSource = async () => {
      assert.equal(await page.locator('#c4-explorer a[href$=".mmd"]').count(), 0, 'Mermaid maintenance source must not be linked from the user interface');
      const visibleCode = await page.locator('#chapter-panel-arquitectura pre:visible, #chapter-panel-arquitectura code:visible, #chapter-panel-arquitectura textarea:visible').allTextContents();
      assert.ok(visibleCode.every(text => !/flowchart\s+(TB|TD|LR)|C4(Context|Container|Component|Deployment)|classDef\s/.test(text)), 'Raw Mermaid source must not be displayed');
      assert.equal(await page.locator('#c4-explorer .mermaid:visible').count(), 0, 'The user should see compiled SVG, not a Mermaid source block');
    };
    const assertDetail = async (id, node) => {
      assert.equal(await page.locator('#c4-detail-heading').innerText(), node.name);
      assert.match(await page.locator('#c4-detail').innerText(), /Propiedad de datos/);
      assert.match(await page.locator('#c4-detail').innerText(), /Sin conexión o ante fallos/);
      assert.ok((await page.locator('#c4-detail').innerText()).includes(node.technology));
      assert.equal(await page.locator('#c4-detail .source-list a').count(), node.sources.length);
      assert.equal(await page.locator(`#c4-canvas [data-c4-node="${id}"]`).getAttribute('aria-pressed'), 'true');
    };
    const assertNodeStroke = async (target, color, width) => {
      const stroke = await target.evaluate(element => {
        const shape = element.querySelector(':scope > rect, :scope > path, :scope > polygon, :scope > circle, :scope > ellipse')
          || element.querySelector(':scope > .outer-path > path');
        if (!shape) return null;
        const style = getComputedStyle(shape);
        return { color: style.stroke, width: parseFloat(style.strokeWidth) };
      });
      assert.deepEqual(stroke, { color, width }, 'Visible node stroke must preserve selection/focus against Mermaid styles');
    };

    await open();
    const model = await page.evaluate(() => window.POS_C4);
    assert.ok(model?.nodes && Array.isArray(model.views), 'The C4 model must load');

    await run('Five views, compiled SVGs and model relationships', async () => {
      assert.deepEqual(model.views.map(view => view.id), expectedViews);
      assert.deepEqual(await page.locator('#c4-view-select option').evaluateAll(options => options.map(option => option.value)), expectedViews);
      for (const view of model.views) {
        await select(view.id);
        assert.equal(await page.locator('#c4-canvas svg').count(), 1);
        assert.equal(await page.locator('#c4-canvas .c4-unavailable').count(), 0);
        const expectedNodes = view.nodeIds.filter(id => id !== 'legend');
        const renderedNodes = await page.locator('#c4-canvas [data-c4-node]').evaluateAll(nodes => nodes.map(node => node.dataset.c4Node));
        assert.deepEqual(renderedNodes.sort(), [...expectedNodes].sort(), `${view.id}: SVG nodes must match the model`);
        await page.waitForFunction(() => {
          const selected = document.querySelector('#c4-canvas [data-c4-node][aria-pressed="true"]');
          const viewport = document.querySelector('#c4-viewport');
          if (!selected || !viewport) return false;
          const node = selected.getBoundingClientRect(), frame = viewport.getBoundingClientRect();
          return Math.min(node.right, frame.right) - Math.max(node.left, frame.left) > 30
            && Math.min(node.bottom, frame.bottom) - Math.max(node.top, frame.top) > 30;
        }, undefined, { timeout: 6000 });
        assert.ok((await page.locator('#c4-view-heading').innerText()).includes(view.scope));
        for (const relation of view.relationships) {
          assert.ok(expectedNodes.includes(relation.from) && expectedNodes.includes(relation.to), `${view.id}: unknown relationship endpoint`);
          assert.ok(relation.label.trim(), `${view.id}: relationship needs a label`);
        }
        await assertNoRawSource();
      }
    });

    for (const view of model.views) {
      await run(`${view.id}: native SVG geometry has no label collisions`, async () => {
        const svg = await page.evaluate(key => window.POS_DIAGRAMS[key].svg, view.key);
        const exportPage = await browser.newPage({ viewport: { width: 1440, height: 1000 }, offline: true, reducedMotion: 'reduce' });
        exportPage.on('pageerror', error => errors.push(`export ${view.id}: ${error.message}`));
        exportPage.on('request', request => {
          if (!request.url().startsWith('data:')) external.push(request.url());
        });
        await exportPage.route('**/*', route => route.request().url().startsWith('data:') ? route.continue() : route.abort());
        try {
          await exportPage.setContent(`<!doctype html><html lang="es"><head><meta charset="utf-8"><style>html,body{margin:0;background:white;font-family:Arial,sans-serif}body{padding:20px;width:max-content}svg{display:block;overflow:visible}</style></head><body>${svg}</body></html>`);
          const dimensions = await exportPage.locator('svg').evaluate(element => {
            const { width, height } = element.viewBox.baseVal;
            element.style.width = `${width}px`;
            element.style.height = `${height}px`;
            element.style.maxWidth = 'none';
            return { width, height };
          });
          assert.ok(dimensions.width > 0 && dimensions.height > 0, `${view.id}: valid native SVG dimensions are required`);
          await exportPage.setViewportSize({ width: Math.ceil(dimensions.width) + 40, height: Math.ceil(dimensions.height) + 40 });
          await exportPage.evaluate(async () => {
            await document.fonts.ready;
            await new Promise(resolve => requestAnimationFrame(resolve));
          });
          const measured = await exportPage.evaluate(() => {
            const boxes = selector => [...document.querySelectorAll(selector)].map((element, index) => {
              const box = element.getBoundingClientRect();
              return {
                id: element.id || `${selector} #${index + 1}`,
                text: element.textContent.replace(/\s+/g, ' ').trim(),
                left: box.left, right: box.right, top: box.top, bottom: box.bottom,
                width: box.width, height: box.height,
              };
            }).filter(box => box.width > 0 && box.height > 0 && box.text);
            const labels = boxes('.edgeLabels > .edgeLabel');
            const nodes = boxes('.nodes > .node');
            const titles = boxes('g.cluster .cluster-label');
            const collisions = [];
            const compare = (first, second, kind) => {
              const width = Math.min(first.right, second.right) - Math.max(first.left, second.left);
              const height = Math.min(first.bottom, second.bottom) - Math.max(first.top, second.top);
              if (width > 2 && height > 2) collisions.push({
                kind,
                first: { id: first.id, text: first.text },
                second: { id: second.id, text: second.text },
                overlap: { width: Math.round(width * 100) / 100, height: Math.round(height * 100) / 100 },
              });
            };
            for (const [index, label] of labels.entries()) {
              for (const node of nodes) compare(label, node, 'edge-label / node');
              for (const other of labels.slice(index + 1)) compare(label, other, 'edge-label / edge-label');
            }
            for (const title of titles) {
              for (const node of nodes) compare(title, node, 'cluster-title / node');
              for (const label of labels) compare(title, label, 'cluster-title / edge-label');
            }
            return { nodes: nodes.length, edgeLabels: labels.length, clusterTitles: titles.length, tolerance: 2, collisions };
          });
          geometry.push({ view: view.id, dimensions, ...measured });
          await exportPage.screenshot({ path: path.join(snapshots, `c4-export-${view.id}.png`), fullPage: true });
          assert.equal(measured.nodes, view.nodeIds.length, `${view.id}: measure every node, including the legend`);
          assert.equal(measured.edgeLabels, view.relationships.length, `${view.id}: measure every directed relationship label`);
          assert.deepEqual(measured.collisions, [], `${view.id}: native SVG label collisions (2px tolerance)`);
        } finally { await exportPage.close(); }
      });

      await run(`${view.id}: every SVG node opens its detail by keyboard`, async () => {
        await open();
        await select(view.id);
        const hash = new URL(page.url()).hash;
        for (const [index, id] of view.nodeIds.filter(id => id !== 'legend').entries()) {
          const target = page.locator(`#c4-canvas [data-c4-node="${id}"]`);
          assert.equal(await target.getAttribute('role'), 'button');
          assert.equal(await target.getAttribute('tabindex'), '0');
          assert.ok((await target.getAttribute('aria-label')).includes(model.nodes[id].name));
          await page.keyboard.press('Tab');
          await target.focus();
          await page.keyboard.press(index % 2 ? 'Space' : 'Enter');
          await assertDetail(id, model.nodes[id]);
          assert.equal(await target.evaluate(element => element === document.activeElement), true, `${view.id}/${id}: selection must retain keyboard focus`);
          await assertNodeStroke(target, 'rgb(8, 107, 96)', 5);
          await page.locator('#c4-view-select').focus();
          await assertNodeStroke(target, 'rgb(168, 101, 22)', 3);
          assert.equal(new URL(page.url()).hash, hash);
        }
      });

      await run(`${view.id}: alternative element list and directed relationships`, async () => {
        await open();
        await select(view.id);
        await expandAlternative();
        const ids = view.nodeIds.filter(id => id !== 'legend');
        assert.equal(await page.locator('.c4-element-list button').count(), ids.length);
        for (const id of ids) {
          await page.locator(`.c4-element-list [data-c4-node="${id}"]`).focus();
          await page.keyboard.press('Enter');
          await assertDetail(id, model.nodes[id]);
        }
        const relations = await page.locator('.c4-relationship-list li').allTextContents();
        assert.equal(relations.length, view.relationships.length);
        for (const [index, relation] of view.relationships.entries()) {
          assert.ok(relations[index].includes(model.nodes[relation.from].name));
          assert.ok(relations[index].includes(model.nodes[relation.to].name));
          assert.ok(relations[index].includes(relation.label));
        }
        await assertNoDocumentOverflow(`${view.id}, expanded alternative`);
      });

      await run(`${view.id}: modal opens, receives focus, closes and restores focus`, async () => {
        await open();
        await select(view.id);
        const id = view.nodeIds.find(nodeId => nodeId !== 'legend');
        await page.locator(`#c4-canvas [data-c4-node="${id}"]`).focus();
        await page.keyboard.press('Enter');
        const trigger = action('detail');
        for (const close of ['Escape', 'button']) {
          await trigger.focus();
          await page.keyboard.press('Enter');
          assert.equal(await page.locator('#modal').evaluate(element => element.open), true);
          assert.equal(await page.locator('#modal-title').innerText(), model.nodes[id].name);
          assert.ok((await page.locator('#modal-body').innerText()).includes(model.nodes[id].ownership));
          assert.equal(await page.locator('#c4-detail-heading').count(), 1, 'Modal must not duplicate the inline detail ID');
          assert.equal(await page.locator('#modal').evaluate(element => element.contains(document.activeElement)), true, 'Focus must enter the modal');
          await page.locator('#modal [data-action="close-modal"]').focus();
          await page.keyboard.press('Tab');
          assert.equal(await page.locator('#modal').evaluate(element => element.contains(document.activeElement)), true, 'Tab from Close must reach the dialog content');
          await page.keyboard.press('Shift+Tab');
          assert.equal(await page.locator('#modal [data-action="close-modal"]').evaluate(element => element === document.activeElement), true, 'Reverse Tab must return to Close');
          if (close === 'Escape') await page.keyboard.press('Escape');
          else await page.locator('#modal [data-action="close-modal"]').click();
          assert.equal(await page.locator('#modal').evaluate(element => element.open), false);
          assert.equal(await trigger.evaluate(element => element === document.activeElement), true, `${view.id}: closing via ${close} must restore the invoking button`);
        }
      });
    }

    await run('Zoom, keyboard/button/drag pan and chapter isolation', async () => {
      await open();
      await select('containers');
      const viewport = page.locator('#c4-viewport');
      const hash = new URL(page.url()).hash;
      await action('actual').click();
      assert.equal(await page.locator('#c4-zoom-label').innerText(), '100 %');
      assert.equal(await action('actual').getAttribute('aria-pressed'), 'true');
      const actualWidth = await page.locator('#c4-canvas svg').evaluate(element => element.getBoundingClientRect().width);
      await action('in').click();
      assert.equal(await page.locator('#c4-zoom-label').innerText(), '115 %');
      assert.ok(await page.locator('#c4-canvas svg').evaluate(element => element.getBoundingClientRect().width) > actualWidth);
      await action('out').click();
      assert.equal(await page.locator('#c4-zoom-label').innerText(), '100 %');
      await action('fit').click();
      assert.match(await page.locator('#c4-zoom-label').innerText(), /ajustado/);
      assert.equal(await action('fit').getAttribute('aria-pressed'), 'true');
      const fit = await viewport.evaluate(element => ({ width: element.clientWidth, scroll: element.scrollWidth, height: element.clientHeight, scrollHeight: element.scrollHeight }));
      assert.ok(fit.scroll <= fit.width + 2 && fit.scrollHeight <= fit.height + 2, 'Fit must contain the entire map inside its viewport');
      await action('actual').click();
      await viewport.evaluate(element => element.scrollTo(0, 0));
      const capacity = await viewport.evaluate(element => ({ x: element.scrollWidth - element.clientWidth, y: element.scrollHeight - element.clientHeight }));
      assert.ok(capacity.x > 0 || capacity.y > 0, 'At 100%, the containers map must provide internal scrolling');
      const horizontal = capacity.x > 0;
      await viewport.focus();
      await page.keyboard.press(horizontal ? 'ArrowRight' : 'ArrowDown');
      assert.ok(await viewport.evaluate((element, horizontal) => horizontal ? element.scrollLeft > 0 : element.scrollTop > 0, horizontal));
      await page.locator(`[data-c4-pan="${horizontal ? 'left' : 'up'}"]`).click();
      assert.equal(await viewport.evaluate((element, horizontal) => horizontal ? element.scrollLeft : element.scrollTop, horizontal), 0);
      await viewport.scrollIntoViewIfNeeded();
      const start = await viewport.evaluate(element => {
        const box = element.getBoundingClientRect();
        for (const y of [8, 15, 30, 60]) for (const x of [8, 15, 30, 60]) {
          const point = { x: box.left + x, y: box.top + y };
          const hit = document.elementFromPoint(point.x, point.y);
          if (hit && element.contains(hit) && !hit.closest('[data-c4-node]')) return point;
        }
        return null;
      });
      assert.ok(start, 'The diagram needs a draggable background');
      await page.mouse.move(start.x, start.y);
      await page.mouse.down();
      await page.mouse.move(start.x - (horizontal ? 120 : 0), start.y - (horizontal ? 0 : 120), { steps: 5 });
      await page.mouse.up();
      assert.ok(await viewport.evaluate((element, horizontal) => horizontal ? element.scrollLeft > 0 : element.scrollTop > 0, horizontal), 'Dragging the background must pan the map');
      assert.equal(new URL(page.url()).hash, hash, 'Map controls must not navigate chapters');
      await assertNoDocumentOverflow('100% map with pan');
    });

    await run('Chapter tab keyboard navigation and explorer remount retain usable state', async () => {
      await open();
      await select('backend');
      await page.locator('#c4-canvas [data-c4-node="sales"]').focus();
      await page.keyboard.press('Enter');
      await action('in').click();
      await page.locator('[data-chapter-view="arquitectura"]').focus();
      await page.keyboard.press('ArrowRight');
      assert.equal(await page.locator('[data-chapter-view="cambios"]').getAttribute('aria-selected'), 'true');
      assert.equal(await page.locator('#chapter-panel-arquitectura').isVisible(), false);
      await page.keyboard.press('Home');
      assert.equal(await page.locator('[data-chapter-view="arquitectura"]').getAttribute('aria-selected'), 'true');
      assert.equal(await page.locator('#c4-view-select').inputValue(), 'backend');
      await assertDetail('sales', model.nodes.sales);
      assert.equal(await page.locator('#c4-zoom-label').innerText(), '115 %');
      await page.locator('[data-chapter="venta"]').click();
      await page.locator('[data-chapter-view="recorrido"]').waitFor();
      assert.equal(await page.locator('#c4-explorer').count(), 0);
      await page.locator('[data-chapter="propuesta"]').click();
      await page.locator('#c4-canvas svg').waitFor();
      assert.equal(await page.locator('#c4-explorer').count(), 1);
      assert.equal(await page.locator('#c4-view-select').inputValue(), 'backend');
      await assertDetail('sales', model.nodes.sales);
      await action('actual').click();
      await action('in').click();
      assert.equal(await page.locator('#c4-zoom-label').innerText(), '115 %', 'Remount must not leave duplicate click listeners');
    });

    for (const width of [375, 768, 1440]) {
      for (const view of model.views) {
        await run(`${view.id}: responsive ${width}px, internal map scrolling and screenshot`, async () => {
          await page.setViewportSize({ width, height: width === 375 ? 844 : 1000 });
          await open();
          await select(view.id);
          await action('actual').click();
          await assertNoDocumentOverflow(`${view.id} ${width}px at 100%`);
          const viewport = page.locator('#c4-viewport');
          assert.equal(await viewport.evaluate(element => getComputedStyle(element).overflowX), 'auto');
          const hash = new URL(page.url()).hash;
          await viewport.focus();
          await page.keyboard.press('ArrowRight');
          await page.keyboard.press('ArrowDown');
          assert.equal(new URL(page.url()).hash, hash, 'Responsive map pan must not navigate');
          await action('fit').click();
          await expandAlternative();
          await assertNoDocumentOverflow(`${view.id} ${width}px fitted and expanded`);
          await assertNoRawSource();
          await page.locator('.chapter-title').focus();
          await page.evaluate(() => window.scrollTo(0, 0));
          await page.screenshot({ path: path.join(snapshots, `c4-${view.id}-${width}.png`), fullPage: true });
        });
      }
    }

    await run('All five C4 views work from file:// with network disabled', async () => {
      const filePage = await browser.newPage({ viewport: { width: 1440, height: 1000 }, offline: true, reducedMotion: 'reduce' });
      filePage.setDefaultTimeout(6000);
      filePage.on('pageerror', error => errors.push(`file://: ${error.message}`));
      filePage.on('request', request => {
        if (!request.url().startsWith('file:') && !request.url().startsWith('data:')) external.push(request.url());
      });
      await filePage.route('**/*', route => route.request().url().startsWith('file:') || route.request().url().startsWith('data:') ? route.continue() : route.abort());
      try {
        await filePage.goto(`${pathToFileURL(path.join(root, 'index.html')).href}#propuesta?vista=arquitectura`);
        for (const view of model.views) {
          await filePage.locator('#c4-view-select').selectOption(view.id);
          await filePage.locator('#c4-canvas svg').waitFor();
          assert.equal(await filePage.locator('#c4-canvas [data-c4-node]').count(), view.nodeIds.filter(id => id !== 'legend').length);
          const id = view.nodeIds.find(nodeId => nodeId !== 'legend');
          await filePage.locator(`#c4-canvas [data-c4-node="${id}"]`).focus();
          await filePage.keyboard.press('Enter');
          assert.equal(await filePage.locator('#c4-detail-heading').innerText(), model.nodes[id].name);
          await filePage.locator('[data-c4-action="detail"]').focus();
          await filePage.keyboard.press('Enter');
          assert.equal(await filePage.locator('#modal-title').innerText(), model.nodes[id].name);
          await filePage.keyboard.press('Escape');
          assert.equal(await filePage.locator('[data-c4-action="detail"]').evaluate(element => element === document.activeElement), true);
          assert.equal(await filePage.locator('#c4-explorer a[href$=".mmd"]').count(), 0);
        }
      } finally { await filePage.close(); }
    });

    await run('No JavaScript errors or external requests', async () => {
      assert.deepEqual(errors, []);
      assert.deepEqual(external, []);
    });
    const report = { date: new Date().toISOString(), engine: 'Playwright / Chromium', port, checks, geometry, failures, errors, external };
    await fs.writeFile(path.join(snapshots, 'c4-report.json'), `${JSON.stringify(report, null, 2)}\n`);
    assert.equal(failures.length, 0, `${failures.length} C4 check(s) failed. See presentation/qa/c4-report.json.`);
    console.log(`PASS: ${checks.length} C4 checks. Screenshots: presentation/qa/c4-*.png`);
  } finally {
    try { if (browser) await browser.close(); }
    finally { await stopServer(server); }
  }
}

main().catch(error => { console.error(error); process.exitCode = 1; });
