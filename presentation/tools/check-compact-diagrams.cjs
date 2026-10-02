/* Content-sized interaction diagrams: local Playwright checks, no corporate calls.
 * Run: node presentation/tools/check-compact-diagrams.cjs
 * Optional: --measure-only records geometry without enforcing density thresholds.
 * Baseline is a separate captured file; this test never overwrites it.
 */
'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const path = require('node:path');
const crypto = require('node:crypto');
const { spawn } = require('node:child_process');
const root = path.resolve(__dirname, '..');
const qa = path.join(root, 'qa');
const measureOnly = process.argv.includes('--measure-only');
const port = Number(process.env.POS_COMPACT_QA_PORT || 4194);
const base = `http://127.0.0.1:${port}`;
const expected = ['sale', 'sync', 'masters', 'customer', 'printing', 'credit', 'proposed-sale', 'proposed-erp'].sort();
function playwright() {
  for (const name of [process.env.PLAYWRIGHT_MODULE_PATH, 'playwright', require('node:path').join(require('node:os').homedir(), '.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright')].filter(Boolean)) {
    try { return require(name); } catch (error) { if (error.code !== 'MODULE_NOT_FOUND') throw error; }
  }
  throw Error('Existing Playwright required. Set PLAYWRIGHT_MODULE_PATH; no install is performed.');
}

async function main() {
  await fs.mkdir(qa, { recursive: true });
  const report = { date: new Date().toISOString(), mode: measureOnly ? 'measurement' : 'regression', assets: {}, views: [], problems: [], external: [], pageErrors: [], comparisons: [] };
  for (const file of ['interactions-ui.js', 'interactions.css', 'interactions-view-data.js']) report.assets[file] = crypto.createHash('sha256').update(await fs.readFile(path.join(root, file))).digest('hex');
  let baseline;
  try { baseline = JSON.parse(await fs.readFile(path.join(qa, 'compact-diagrams-baseline.json'), 'utf8')); } catch (e) { if (e.code !== 'ENOENT') throw e; }
  const server = spawn(process.execPath, [path.join(root, 'server.cjs')], { env: { ...process.env, POS_ATLAS_PORT: String(port) }, windowsHide: true, stdio: ['ignore', 'pipe', 'pipe'] });
  let browser;
  try {
    await new Promise((resolve, reject) => {
      const timer = setTimeout(() => reject(Error('Local server timeout')), 8000);
      server.stdout.once('data', () => { clearTimeout(timer); resolve(); });
      server.once('exit', code => { clearTimeout(timer); reject(Error('Local server exit: ' + code)); });
    });
    browser = await playwright().chromium.launch({ headless: true });
    const page = await browser.newPage({ reducedMotion: 'reduce' });
    page.on('pageerror', error => report.pageErrors.push(error.message));
    await page.route('**/*', route => {
      const url = route.request().url();
      if (url.startsWith(base + '/') || url.startsWith('data:') || url.startsWith('blob:')) return route.continue();
      report.external.push(url); return route.abort();
    });
    await page.goto(base + '/#mapa');
    const flows = await page.evaluate(() => window.POS_INTERACTIONS_VIEW.all());
    assert.deepEqual(flows.map(f => f.id).sort(), expected);

    async function measure(flow, mode, width, selection = 'first') {
      const result = await page.evaluate(({ flow, mode, width, selection }) => {
        const norm = text => String(text).replace(/\s+/g, ' ').trim();
        const round = n => Math.round(n * 10) / 10;
        const viewport = document.querySelector('.ix-viewport');
        const surface = document.querySelector('.ix-surface');
        const problems = [];
        const rect = element => { const r = element.getBoundingClientRect(); return { left: r.left, top: r.top, right: r.right, bottom: r.bottom, w: r.width, h: r.height }; };
        const intersects = (a, b) => Math.min(a.right, b.right) - Math.max(a.left, b.left) > 1.5 && Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top) > 1.5;
        const inside = (a, b, tolerance = 2) => a.left >= b.left - tolerance && a.right <= b.right + tolerance && a.top >= b.top - tolerance && a.bottom <= b.bottom + tolerance;
        const fitNaturalHeight = element => {
          const clone = element.cloneNode(true);
          clone.removeAttribute('id');
          clone.style.cssText += `;position:absolute!important;left:-100000px!important;top:-100000px!important;right:auto!important;bottom:auto!important;width:${element.offsetWidth}px!important;height:auto!important;min-height:0!important;max-height:none!important;visibility:hidden!important;transform:none!important;`;
          element.parentElement.append(clone);
          const h = clone.offsetHeight;
          clone.remove();
          return h;
        };
        if (document.documentElement.scrollWidth > innerWidth + 1) problems.push('document horizontal overflow');
        if (viewport.getBoundingClientRect().width > innerWidth + 1) problems.push('viewport exceeds browser width');
        const elements = [...surface.querySelectorAll('.ix-node,.ix-group-head,.ix-seq-node,.ix-seq-group,.ix-edge-label')];
        for (const element of surface.querySelectorAll('.ix-node strong,.ix-node-subtitle,.ix-group-head,.ix-seq-node strong,.ix-seq-group')) {
          const names = element.textContent.match(/\b(?:[A-Za-z_$][\w$]*(?:Controller|Services?|Repository|Mediator)|Class[A-Z]\w*|(?:SEQ|TP|MS|MP)_[A-Za-z0-9_]+)\b/g);
          if (names) problems.push('implementation identifier on canvas: ' + names.join(', '));
        }
        const sizes = elements.map(element => {
          const category = element.classList.contains('ix-edge-label') ? 'label' : element.matches('.ix-group-head,.ix-seq-group') ? 'header' : 'node';
          const naturalHeight = fitNaturalHeight(element);
          const value = { category, id: element.dataset.ixNode || element.dataset.ixEdge || '', text: norm(element.innerText), width: element.offsetWidth, height: element.offsetHeight, naturalHeight, excessHeight: element.offsetHeight - naturalHeight };
          if (element.scrollHeight > element.clientHeight + 3 || element.scrollWidth > element.clientWidth + 3) problems.push(`${category} ${value.id}: clipped/overflowing text`);
          for (const child of element.querySelectorAll('strong,span,small,h4,p,em')) {
            if (!child.textContent.trim()) continue;
            const range = document.createRange(); range.selectNodeContents(child);
            if ([...range.getClientRects()].some(r => !inside(r, element.getBoundingClientRect(), 3))) problems.push(`${category} ${value.id}: text fragment outside box`);
          }
          if (category === 'label') {
            const edge = flow.edges.find(e => e.id === element.dataset.ixEdge);
            if (!edge || norm(element.querySelector('strong')?.textContent) !== norm(edge.label)) problems.push(`label ${value.id}: full label not preserved`);
            const foreign = element.closest('foreignObject');
            if (foreign && !inside(rect(element), rect(foreign), 2)) problems.push(`label ${value.id}: clipped by SVG foreignObject`);
            if (parseFloat(getComputedStyle(element.querySelector('strong')).fontSize) < 12) problems.push(`label ${value.id}: font below 12px at natural scale`);
          } else if (category === 'node') {
            const node = flow.nodes.find(n => n.id === element.dataset.ixNode);
            if (!node || !value.text.includes(norm(node.title))) problems.push(`node ${value.id}: full title not preserved`);
          }
          return value;
        });
        const nodes = [...surface.querySelectorAll('.ix-node,.ix-seq-node')];
        const headers = [...surface.querySelectorAll('.ix-group-head,.ix-seq-group')];
        const labels = [...surface.querySelectorAll('.ix-edge-label')];
        const nr = nodes.map(n => ({ id: n.dataset.ixNode, r: rect(n) }));
        for (let i = 0; i < nr.length; i++) for (let j = i + 1; j < nr.length; j++) if (intersects(nr[i].r, nr[j].r)) problems.push(`node overlap ${nr[i].id}/${nr[j].id}`);
        for (const label of labels) {
          const lr = rect(label);
          for (const n of nr) if (intersects(lr, n.r)) problems.push(`label/node overlap ${label.dataset.ixEdge}/${n.id}`);
          for (const header of headers) if (intersects(lr, rect(header))) problems.push(`label/header overlap ${label.dataset.ixEdge}`);
        }
        for (let i = 0; i < labels.length; i++) for (let j = i + 1; j < labels.length; j++) if (intersects(rect(labels[i]), rect(labels[j]))) problems.push(`label overlap ${labels[i].dataset.ixEdge}/${labels[j].dataset.ixEdge}`);
        const paths = [...surface.querySelectorAll('.ix-wire-line')];
        for (const line of paths) {
          const id = line.closest('[data-ix-wire]')?.dataset.ixWire;
          const edge = flow.edges.find(e => e.id === id);
          const d = line.getAttribute('d');
          if (!edge || /NaN|undefined|Infinity/.test(d)) { problems.push(`invalid path ${id}`); continue; }
          const length = line.getTotalLength();
          if (!(length > 0)) problems.push(`empty path ${id}`);
          const bounds = line.getBBox(), svg = line.ownerSVGElement;
          if (bounds.x < -1 || bounds.y < -1 || bounds.x + bounds.width > Number(svg.getAttribute('width')) + 1 || bounds.y + bounds.height > Number(svg.getAttribute('height')) + 1) problems.push(`path outside canvas ${id}`);
          for (const [side, distance, nodeId] of [['source', 0, edge.from], ['target', length, edge.to]]) {
            const point = line.getPointAtLength(distance), matrix = line.getScreenCTM();
            const p = new DOMPoint(point.x, point.y).matrixTransform(matrix);
            const candidates = nr.filter(n => n.id === nodeId);
            const distanceToBox = r => Math.hypot(Math.max(r.left - p.x, 0, p.x - r.right), Math.max(r.top - p.y, 0, p.y - r.bottom));
            if (!candidates.length || Math.min(...candidates.map(n => distanceToBox(n.r))) > 16 * Math.abs(matrix.a) + 1) problems.push(`${id}: ${side} misses ${nodeId}`);
          }
        }
        const kinds = [...new Set(flow.nodes.map(n => n.kind))];
        const minContentTop = Math.min(...elements.map(e => e.offsetTop));
        return { flow: flow.id, mode, width, selection, surface: { w: surface.offsetWidth, h: surface.offsetHeight }, viewport: { w: viewport.clientWidth, h: viewport.clientHeight }, kinds, paths: paths.length, nodes: nodes.length, minContentTop: round(minContentTop), sizes, problems: [...new Set(problems)] };
      }, { flow, mode, width, selection });
      report.views.push(result);
      const tag = `${flow.id}/${mode}/${width}/${selection}`;
      for (const problem of result.problems) report.problems.push(tag + ': ' + problem);
      if (!measureOnly) {
        for (const box of result.sizes) {
          // A small minimum target or padding is allowed; large fixed dead space is not.
          const tolerance = box.category === 'header' ? 32 : box.category === 'node' ? 24 : 20;
          if (box.excessHeight > tolerance) report.problems.push(`${tag}: ${box.category} ${box.id} has ${box.excessHeight}px excess height (natural ${box.naturalHeight}px)`);
        }
      }
      return result;
    }

    for (const width of [1440, 390]) {
      await page.setViewportSize({ width, height: width === 1440 ? 1000 : 844 });
      for (const flow of flows) {
        await page.goto(base + '/#' + (flow.mode === 'proposed' ? 'propuesta' : 'mapa'));
        if (!await page.locator('#interaction-library').evaluate(el => el.open)) await page.locator('#interaction-library > summary').click();
        await page.locator('#ix-flow').selectOption(flow.id);
        await page.locator('[data-ix-step="0"]').click();
        for (const mode of ['step', 'all', 'sequence']) {
          await page.locator(`[data-ix-mode="${mode}"]`).click();
          await page.locator('[data-ix-zoom="100"]').click();
          const result = await measure(flow, mode, width);
          if (mode === 'all') assert.equal(result.nodes, flow.nodes.length, flow.id + ' all node count');
          if (mode === 'sequence') assert.equal(result.paths, flow.steps.reduce((sum, step) => sum + step.edges.length, 0), flow.id + ' sequence rows');
          if (flow.id === 'sale') {
            const old = baseline?.views.find(v => v.width === width && v.mode === mode);
            if (old) {
              const comparison = { width, mode, before: old.surface, after: result.surface, heightRatio: Number((result.surface.h / old.surface.h).toFixed(3)), areaRatio: Number((result.surface.w * result.surface.h / (old.surface.w * old.surface.h)).toFixed(3)) };
              report.comparisons.push(comparison);
              if (!measureOnly && comparison.heightRatio > .91) report.problems.push(`sale/${mode}/${width}: canvas height has not decreased by at least 9% from baseline`);
            }
            const get = result.sizes.find(x => x.category === 'label' && x.text.includes('GET /Productos/:id'));
            if (!measureOnly && get && (get.width > 400 || get.height > 64)) report.problems.push(`sale/${mode}/${width}: short GET label still oversized (${get.width}x${get.height})`);
          }
        }
        // Exercise the most demanding label in isolation as well as in the full sequence.
        const longest = [...flow.edges].sort((a, b) => b.label.length - a.label.length)[0];
        const stepIndex = flow.steps.findIndex(step => step.edges.includes(longest.id));
        await page.locator('[data-ix-mode="step"]').click();
        await page.locator(`[data-ix-step="${stepIndex}"]`).click();
        await page.locator('#ix-call').selectOption(longest.id);
        await page.locator('[data-ix-zoom="100"]').click();
        await measure(flow, 'step', width, 'longest-label');
        assert.equal(await page.locator('#ix-detail h3').innerText(), longest.label, 'Detail retains exact label');
        for (const id of new Set([longest.from, longest.to])) assert.equal(await page.locator(`.ix-surface [data-ix-node="${id}"]`).count(), 1);
        await page.locator('[data-ix-zoom="fit"]').click();
        assert.equal(await page.locator('[data-ix-zoom="fit"]').getAttribute('aria-pressed'), 'true');
      }
    }
    report.problems = [...new Set(report.problems)];
    assert.deepEqual(report.pageErrors, []);
    assert.deepEqual(report.external, []);
    if (!measureOnly) assert.deepEqual(report.problems, [], 'Compact geometry regressions; see qa/compact-diagrams-report.json');
    report.status = measureOnly ? 'MEASURED' : 'PASS';
    console.log(JSON.stringify({ status: report.status, views: report.views.length, problems: report.problems.length, comparisons: report.comparisons }, null, 2));
  } catch (error) {
    report.status = 'FAIL'; report.failure = error.stack; throw error;
  } finally {
    await fs.writeFile(path.join(qa, 'compact-diagrams-report.json'), JSON.stringify(report, null, 2) + '\n');
    if (browser) await browser.close();
    server.kill();
  }
}
main().catch(error => { console.error(error); process.exitCode = 1; });
