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
  current: ['ui', 'backend', 'localdb', 'sync', 'bus', 'axapi', 'ax', 'pricing', 'fiscal', 'payments', 'mongo'],
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
        if (key === 'current') {
          // Keep the overview compact. Reuse Mermaid's actual nodes and labels,
          // but place them in three columns instead of shrinking a wide graph.
          const ns = 'http://www.w3.org/2000/svg';
          const make = (tag, attrs={}, label) => {
            const el=document.createElementNS(ns,tag);
            for(const [name,value] of Object.entries(attrs))el.setAttribute(name,String(value));
            if(label!==undefined)el.textContent=label;
            return el;
          };
          const positions={ui:[160,100],backend:[160,220],localdb:[160,385],sync:[160,550],pricing:[490,95],fiscal:[490,210],payments:[490,355],mongo:[490,465],ax:[815,100],axapi:[815,325],bus:[815,550]};
          const nodeElements=[...svg.querySelectorAll('g[data-node]')];
          const svgSourceEdges=[...svg.querySelectorAll('.flowchart-link')].map(edge=>edge.id);
          const drawnEdges=new Set();
          if(nodeElements.length!==Object.keys(positions).length)throw new Error('Update the overview layout when adding nodes.');
          document.body.appendChild(svg);
          const bounds={};
          for(const node of nodeElements){
            const id=node.dataset.node,position=positions[id];
            if(!position)throw new Error(`Overview position missing: ${id}`);
            const box=node.getBBox();
            bounds[id]={x:position[0]+box.x,y:position[1]+box.y,w:box.width,h:box.height,cx:position[0],cy:position[1]};
            node.setAttribute('transform',`translate(${position.join(',')})`);
          }
          svg.remove();
          svg.querySelector('g').remove();
          svg.setAttribute('viewBox','0 0 980 625');
          const canvas=make('g');svg.appendChild(canvas);
          for(const [x,w,label] of [[8,304,'Sucursal'],[345,290,'Servicios de caja'],[662,310,'Integración central']]){
            canvas.appendChild(make('rect',{x,y:8,width:w,height:608,rx:10,fill:'#ffffff',stroke:'#c6d8d1'}));
            canvas.appendChild(make('text',{x:x+16,y:36,fill:'#17302d','font-size':20,'font-weight':600},label));
          }
          const marker=make('marker',{id:'current-arrow',viewBox:'0 0 10 10',refX:9,refY:5,markerWidth:7,markerHeight:7,orient:'auto-start-reverse'});
          marker.appendChild(make('path',{d:'M 0 0 L 10 5 L 0 10 z',fill:'#527a70'}));
          const defs=make('defs');defs.appendChild(marker);svg.appendChild(defs);
          const edges=make('g',{'aria-hidden':'true'});canvas.appendChild(edges);
          const port=(id,side,offset=0)=>{const b=bounds[id];return side==='top'?[b.cx,b.y]:side==='bottom'?[b.cx,b.y+b.h]:side==='left'?[b.x,b.cy+offset]:[b.x+b.w,b.cy+offset];};
          const route=(from,to,points,both=false,dashed=false)=>{
            // The source graph remains the connection contract for this layout.
            const edgeId=svgSourceEdges.find(id=>id.startsWith(`L_${from}_${to}_`)||id.startsWith(`L_${to}_${from}_`));
            if(!edgeId)throw new Error(`Overview connection missing in Mermaid: ${from} / ${to}`);
            drawnEdges.add(edgeId);
            edges.appendChild(make('path',{d:points.map((p,i)=>`${i?'L':'M'} ${p.join(' ')}`).join(' '),fill:'none',stroke:'#527a70','stroke-width':1.8,'marker-end':'url(#current-arrow)',...(both?{'marker-start':'url(#current-arrow)'}:{}),...(dashed?{'stroke-dasharray':'6 5'}:{})}));
          };
          for(const [a,b,both] of [['ui','backend',false],['backend','localdb',true],['ax','axapi',true],['axapi','bus',true],['payments','mongo',false]])route(a,b,[port(a,'bottom'),port(b,'top')],both);
          route('sync','localdb',[port('sync','top'),port('localdb','bottom')],true);
          route('sync','bus',[port('sync','right'),port('bus','left')],true);
          for(const [to,x,offset,dashed] of [['pricing',324,-18,false],['fiscal',336,0,false],['payments',324,18,true]]){
            const a=port('backend','right',offset),b=port(to,'left');route('backend',to,[a,[x,a[1]],[x,b[1]],b],false,dashed);
          }
          const a=port('payments','left',18),b=port('localdb','right');route('payments','localdb',[a,[350,a[1]],[350,b[1]],b]);
          if(drawnEdges.size!==svgSourceEdges.length)throw new Error('Update the overview layout when adding connections.');
          for(const [x,y,label] of [[349,294,'HTTP'],[326,374,'SQL']])edges.appendChild(make('text',{x,y,'text-anchor':'middle','font-size':16,fill:'#355d48',stroke:'#fff','stroke-width':5,'paint-order':'stroke'},label));
          for(const node of nodeElements)canvas.appendChild(node);
        }
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
