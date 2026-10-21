/* Read the generated reference snapshot; canonical sources belong to pos-platform. */
'use strict';
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const {createHash} = require('node:crypto');
const ROOT = path.resolve(__dirname, '../..');
const SNAPSHOT = 'presentation/documentation.snapshot.json';
const ORIGIN = 'https://pos-platform-tau.vercel.app';
function validateDocumentation(snapshot) {
  if (snapshot.schemaVersion !== 1 || snapshot.repository !== 'https://github.com/floxcristian/pos-platform' || !/^[a-f0-9]{40}$/.test(snapshot.revision) || snapshot.dirty !== false) throw new Error('Documentation snapshot must identify a clean pos-platform revision.');
  if (snapshot.links?.docsOrigin !== ORIGIN || snapshot.links?.siteBase !== '/guide/') throw new Error('Unexpected documentation destination.');
  for (const [name, entry] of Object.entries(snapshot.files)) {
    if (!/^(docs\/|apps\/pos-docs\/src\/data\/|tools\/diagrams\/models\/)/.test(name) || typeof entry.content !== 'string' || createHash('sha256').update(entry.content).digest('hex') !== entry.sha256) throw new Error(`Invalid snapshot file: ${name}`);
  }
  for (const name of ['docs/propuesta-arquitectura.md', 'apps/pos-docs/src/data/monorepo-catalog.json', 'tools/diagrams/models/c4-data.js', 'tools/diagrams/models/dynamic-data.cjs', 'tools/diagrams/models/c4-layouts.json']) {
    if (!snapshot.files[name]) throw new Error(`Missing documentation input: ${name}`);
  }
  return snapshot;
}
function loadDocumentation(root = ROOT) {
  return validateDocumentation(JSON.parse(fs.readFileSync(path.join(root, SNAPSHOT), 'utf8')));
}
function resolveDocumentationLink(source, fragment = '', snapshot = loadDocumentation()) {
  const normalized = path.posix.normalize(source.replaceAll('\\', '/').replace(/^\//, ''));
  const route = snapshot.links.routesBySource[normalized] || snapshot.links.sourceAliases?.[normalized.replace(/\/$/, '')];
  if (!route) return null;
  const hash = fragment.replace(/^#/, '');
  const destination = snapshot.links.anchorsBySource[normalized]?.[decodeURIComponent(hash)] || route;
  return `${ORIGIN}/guide/${destination}/${hash ? '#' + hash : ''}`;
}
function synchronizeDerivatives({root = ROOT, check = true, snapshot = loadDocumentation(root)} = {}) {
  const catalog = JSON.parse(snapshot.files['apps/pos-docs/src/data/monorepo-catalog.json'].content);
  const rows = entries => {
    const result = [];
    for (let i = 0; i < entries.length; i += 2) result.push('  ' + entries.slice(i, i + 2).map(name => (name + '/').padEnd(24)).join('').trimEnd());
    return result;
  };
  // This slide describes operational applications; the static documentation app has its own lifecycle.
  const compact = ['apps/', ...rows(catalog.applications.map(app => app.name)), 'libs/',
    `  backend/          # ${catalog.libraries.filter(lib => lib.kind === 'backend-context').length} contextos de negocio`,
    ...rows(catalog.libraries.filter(lib => lib.kind !== 'backend-context').map(lib => lib.path))].join('\n');
  const expected = new Map();
  for (const file of ['presentation/architecture-content.js', 'presentation/pos-reveal-content.js']) {
    const current = fs.readFileSync(path.join(root, file), 'utf8');
    const start = '/* monorepo:compact:start */'; const end = '/* monorepo:compact:end */';
    if (current.split(start).length !== 2 || current.split(end).length !== 2) throw new Error(`Missing generated catalog block: ${file}`);
    const from = current.indexOf(start) + start.length; const to = current.indexOf(end, from);
    expected.set(file, current.slice(0, from) + ' ' + JSON.stringify(compact) + ' ' + current.slice(to));
  }
  const provenance = `/* Generated from pos-platform ${snapshot.revision}. Update with tools/sync-documentation.cjs; do not edit this copy. */\n`;
  expected.set('presentation/c4-data.js', provenance + snapshot.files['tools/diagrams/models/c4-data.js'].content);
  for (const [file, entry] of Object.entries(snapshot.files)) {
    if (file.startsWith('docs/diagramas-excalidraw/previews/')) expected.set('presentation/architecture-diagrams/' + path.posix.basename(file), entry.content);
  }
  const layout = JSON.parse(snapshot.files['tools/diagrams/models/c4-layouts.json'].content);
  const currentDiagrams = fs.readFileSync(path.join(root, 'presentation/diagrams.js'), 'utf8');
  const context = vm.createContext({window: {}}, {codeGeneration: {strings: false, wasm: false}});
  vm.runInContext(currentDiagrams, context, {timeout: 1500});
  for (const [id, value] of Object.entries(layout)) {
    if (!id.startsWith('c4-')) throw new Error(`Unexpected imported diagram: ${id}`);
    context.window.POS_DIAGRAMS[id] = value;
    expected.set(`presentation/diagrams/${id}.mmd`, `%% Generated from pos-platform ${snapshot.revision}; edit the canonical diagram there.\n` + value.source.trim() + '\n');
  }
  expected.set('presentation/diagrams.js', '/* Historical diagrams plus C4 derivatives from the pinned documentation snapshot. */\nwindow.POS_DIAGRAMS = ' + JSON.stringify(context.window.POS_DIAGRAMS, null, 2) + ';\n');
  const stale = [];
  for (const [file, content] of expected) {
    const target = path.join(root, file);
    if (fs.existsSync(target) && fs.readFileSync(target, 'utf8').replaceAll('\r\n', '\n') === content.replaceAll('\r\n', '\n')) continue;
    stale.push(file);
    if (!check) { fs.mkdirSync(path.dirname(target), {recursive: true}); fs.writeFileSync(target, content); }
  }
  if (check && stale.length) throw new Error(`Documentation derivatives differ from the pinned snapshot: ${stale.join(', ')}. Update from a clean canonical build artifact with tools/sync-documentation.cjs --artifact.`);
  return {revision: snapshot.revision, changed: stale};
}
module.exports = {SNAPSHOT, ORIGIN, validateDocumentation, loadDocumentation, resolveDocumentationLink, synchronizeDerivatives};
