/*
 * Prerender the tutorial's Mermaid sources. No dependency is loaded by the
 * final file:// tutorial: diagrams.js contains the complete inline SVGs.
 *
 * Run from any directory:
 *   node presentation/tools/render-diagrams.cjs
 * Override Playwright resolution with PLAYWRIGHT_MODULE_PATH when needed.
 * Mermaid 11.12.0 is vendored at presentation/tools/vendor/mermaid.min.js (MIT license).
 */
'use strict';

const fs = require('node:fs/promises');
const path = require('node:path');
// The technical views have one source of truth in the reviewed document.
require('./sync-technical-diagrams.cjs');
require('./sync-dataflow-diagrams.cjs');
require('./sync-operation-diagrams.cjs');

const root = path.resolve(__dirname, '../..');
const presentationDir = path.join(root, 'presentation');
const vendorPath = path.join(__dirname, 'vendor/mermaid.min.js');
const bundledPlaywright = require('node:path').join(require('node:os').homedir(), '.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const diagrams = {
  current: ['ui', 'backend', 'localdb', 'sync', 'bus', 'axapi', 'ax', 'pricing', 'fiscal'],
  sale: ['ui', 'backend', 'localdb', 'fiscal', 'sync', 'bus', 'ax'],
  masters: ['ax', 'mpos', 'bus', 'readapi', 'sync', 'localdb'],
  customer: ['ui', 'backend', 'clientapi', 'localdb'],
  proposed: ['ui', 'edge', 'edgedb', 'offers', 'outbox', 'inbox', 'platform', 'acl', 'erp'],
  migration: ['platform', 'acl', 'ax', 'erpnext'],
  providers: ['edge', 'ports', 'capabilities', 'paymentadapter', 'fiscaladapter', 'printadapter', 'deviceagent'],
  ai: ['aievidence', 'aipolicies', 'aigateway', 'aimodel', 'ailocal', 'aireview', 'aicore'],
  rfid: ['capabilities', 'rfidreader', 'rfidsession', 'rfidmapping', 'rfidreview', 'edge', 'inventoryowner'],
  'technical-deployment': null,
  'technical-sale': null,
  'technical-sync': null,
  'technical-continuity': null,
  'technical-erp-state': null,
  'dataflow-sale': null,
  'dataflow-upload': null,
  'dataflow-masters': null,
  'dataflow-customer': null,
  'dataflow-credit': null,
  'operation-session-current': null,
  'operation-session-proposed': null,
  'operation-price-current': null,
  'operation-price-proposed': null,
  'operation-print-current': null,
  'operation-print-proposed': null,
  'operation-delivery-current': null,
  'operation-delivery-proposed': null,
};

function loadPlaywright() {
  const candidates = [process.env.PLAYWRIGHT_MODULE_PATH, 'playwright', bundledPlaywright].filter(Boolean);
  for (const candidate of candidates) {
    try {
      return require(candidate);
    } catch (error) {
      if (error.code !== 'MODULE_NOT_FOUND') throw error;
    }
  }
  throw new Error('Playwright is required to rebuild. Set PLAYWRIGHT_MODULE_PATH to its installed module directory.');
}

async function main() {
  const { chromium } = loadPlaywright();
  const browser = await chromium.launch({ headless: true });
  const output = {};
  try {
    const page = await browser.newPage({ viewport: { width: 1100, height: 1100 } });
    await page.setContent('<!doctype html><html lang="es"><head><meta charset="utf-8"></head><body></body></html>');
    await page.addScriptTag({ path: vendorPath });
    await page.evaluate(() => {
      window.POS_MERMAID_CONFIG = {
        startOnLoad: false,
        securityLevel: 'strict',
        htmlLabels: false,
        theme: 'base',
        deterministicIds: true,
        deterministicIDSeed: 'pos-enterprise-tutorial',
        fontFamily: 'Arial, sans-serif',
        fontSize: 20,
        flowchart: {
          htmlLabels: false,
          useMaxWidth: false,
          curve: 'basis',
          padding: 12,
          nodeSpacing: 24,
          rankSpacing: 28,
          diagramPadding: 16,
          wrappingWidth: 220,
          subGraphTitleMargin: { top: 10, bottom: 24 },
        },
        themeVariables: {
          fontFamily: 'Arial, sans-serif',
          fontSize: '20px',
          background: '#ffffff',
          primaryColor: '#edf4f1',
          primaryBorderColor: '#96b8af',
          primaryTextColor: '#17302d',
          secondaryColor: '#ffffff',
          tertiaryColor: '#ffffff',
          lineColor: '#527a70',
          textColor: '#17302d',
          edgeLabelBackground: '#ffffff',
          clusterBkg: '#ffffff',
          clusterBorder: '#c6d8d1',
        },
        themeCSS: '.node rect,.node polygon,.node path{stroke-width:1.6px}.edgeLabel text{font-size:18px}.cluster-label text{font-size:20px;font-weight:600}.node:focus{outline:none}.node:focus rect,.node:focus path,.node:focus polygon{stroke:#b05f30;stroke-width:3px}',
      };
      window.mermaid.initialize(window.POS_MERMAID_CONFIG);
    });

    for (const [key, expectedNodes] of Object.entries(diagrams)) {
      const source = await fs.readFile(path.join(presentationDir, 'diagrams', `${key}.mmd`), 'utf8');
      const result = await page.evaluate(async ({ key, source, interactive }) => {
        const base=window.POS_MERMAID_CONFIG;
        window.mermaid.initialize(key.startsWith('dataflow-')
          ? {...base,flowchart:{...base.flowchart,wrappingWidth:320,nodeSpacing:35,rankSpacing:45,subGraphTitleMargin:{top:65,bottom:55}}}
          : base);
        const rendered = await window.mermaid.render(`pos-${key}`, source);
        const parsed = new DOMParser().parseFromString(rendered.svg, 'image/svg+xml');
        const svg = parsed.documentElement;
        if (svg.localName !== 'svg') throw new Error(`Invalid SVG for ${key}: ${parsed.documentElement.textContent.slice(0, 600)}`);
        svg.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
        svg.setAttribute('class', 'pos-diagram-svg');
        const naturalWidth = Number(svg.getAttribute('viewBox').split(/\s+/)[2]);
        svg.setAttribute('style', `display:block;width:100%;max-width:${Math.min(900, Math.ceil(naturalWidth))}px;height:auto;margin-inline:auto;`);
        svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');
        svg.setAttribute('role', 'group');
        svg.removeAttribute('width');
        svg.removeAttribute('height');
        if (key.startsWith('dataflow-')) {
          // Mermaid centers cluster titles where incoming edge labels can overlap.
          // The reserved top band keeps a left-aligned title separate from arrows.
          for (const cluster of svg.querySelectorAll('g.cluster')) {
            const boundary=cluster.querySelector('rect');
            const label=cluster.querySelector('.cluster-label');
            if(boundary&&label)label.setAttribute('transform',`translate(${Number(boundary.getAttribute('x'))+15}, ${Number(boundary.getAttribute('y'))+10})`);
          }
        }
        const nodes = [];
        for (const node of interactive ? svg.querySelectorAll('g.node') : []) {
          const match = /^flowchart-(.+)-\d+$/.exec(node.id);
          if (!match) throw new Error(`Unrecognized Mermaid node ID: ${node.id}`);
          const nodeId = match[1];
          node.setAttribute('data-node', nodeId);
          node.setAttribute('tabindex', '0');
          node.setAttribute('role', 'button');
          const spans = Array.from(node.querySelectorAll('text tspan')).filter(span => !span.querySelector('tspan'));
          const label = (spans.length ? spans : Array.from(node.querySelectorAll('text'))).map(text => text.textContent).join(' ').replace(/\s+/g, ' ').trim();
          node.setAttribute('aria-label', `Ver detalle: ${label || nodeId}`);
          nodes.push(nodeId);
        }
        for (const element of svg.querySelectorAll('.edgePaths,.edgeLabels')) element.setAttribute('aria-hidden', 'true');
        if (svg.querySelector('foreignObject')) throw new Error('Portable SVG must not contain foreignObject.');
        return { svg: new XMLSerializer().serializeToString(svg), nodes, viewBox: svg.getAttribute('viewBox') };
      }, { key, source, interactive: expectedNodes !== null });
      if (expectedNodes && (result.nodes.length !== expectedNodes.length || expectedNodes.some(id => !result.nodes.includes(id)))) {
        throw new Error(`${key}: node contract mismatch: ${result.nodes.join(', ')}`);
      }
      output[key] = { svg: result.svg, source, nodes: expectedNodes || [] };
      console.log(`${key}: ${result.nodes.length} nodes; viewBox ${result.viewBox}`);
    }

    const generated = '/* Generated from diagrams/*.mmd by tools/render-diagrams.cjs. Mermaid 11.12.0; offline SVG, no runtime dependency. */\nwindow.POS_DIAGRAMS = ' + JSON.stringify(output, null, 2) + ';\n';
    await fs.writeFile(path.join(presentationDir, 'diagrams.js'), generated, 'utf8');
    console.log('Wrote presentation/diagrams.js');
  } finally {
    await browser.close();
  }
}

main().catch(error => {
  console.error(error.stack || error.message);
  process.exitCode = 1;
});
