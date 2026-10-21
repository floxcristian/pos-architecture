import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const catalog = JSON.parse(fs.readFileSync(path.join(root, 'docs-site/src/data/monorepo-catalog.json'), 'utf8'));
let check = false;
let workspace;
const args = process.argv.slice(2);
for (let index = 0; index < args.length; index++) {
  if (args[index] === '--check') check = true;
  else if (args[index] === '--workspace' && args[index + 1] && !args[index + 1].startsWith('--')) workspace = path.resolve(args[++index]);
  else throw new Error('Usage: node tools/sync-monorepo-catalog.mjs [--check] [--workspace <product-checkout>]');
}
if (catalog.schemaVersion !== 1 || !catalog.reviewedOn || !catalog.evidence) throw new Error('Invalid monorepo catalog metadata');
for (const [entries, key] of [[catalog.applications, 'name'], [catalog.libraries, 'path']]) {
  const names = entries.map(entry => entry[key]);
  if (new Set(names).size !== names.length || names.some(name => !/^[a-z][a-z0-9/-]+$/.test(name))) throw new Error('Invalid or duplicate catalog path');
}
if (workspace) {
  // Optional evidence check reads project files; it never builds/runs the product.
  const applicationDirectory = path.join(workspace, 'apps');
  const actual = fs.readdirSync(applicationDirectory, {withFileTypes: true})
    .filter(entry => entry.isDirectory() && fs.existsSync(path.join(applicationDirectory, entry.name, 'project.json')))
    .map(entry => {
      const project = JSON.parse(fs.readFileSync(path.join(applicationDirectory, entry.name, 'project.json'), 'utf8'));
      if (project.name !== entry.name || project.projectType !== 'application') throw new Error(`Unexpected application identity: ${entry.name}`);
      return project.name;
    }).sort();
  const expected = catalog.applications.map(app => app.name).sort();
  if (JSON.stringify(actual) !== JSON.stringify(expected)) throw new Error(`Catalog apps differ from reviewed workspace: expected ${expected.join(', ')}, found ${actual.join(', ')}`);
  for (const library of catalog.libraries) {
    const directory = path.join(workspace, 'libs', library.path);
    if (!fs.statSync(directory).isDirectory()) throw new Error(`Missing library directory: ${library.path}`);
    if (library.kind !== 'frontend' || library.path !== 'features') {
      const project = JSON.parse(fs.readFileSync(path.join(directory, 'project.json'), 'utf8'));
      if (project.projectType !== 'library') throw new Error(`Expected library project: ${library.path}`);
    }
  }
  const backendContexts = fs.readdirSync(path.join(workspace, 'libs/backend'), {withFileTypes: true}).filter(entry => entry.isDirectory()).map(entry => `backend/${entry.name}`).sort();
  const expectedContexts = catalog.libraries.filter(library => library.kind === 'backend-context').map(library => library.path).sort();
  if (JSON.stringify(backendContexts) !== JSON.stringify(expectedContexts)) throw new Error('Catalog backend contexts differ from reviewed workspace');
  console.log(`Workspace evidence checked: ${actual.length} application project files and ${catalog.libraries.length} library locations.`);
}

const applicationRows = catalog.applications.map(app => `  ${(app.name + '/').padEnd(23)} # ${app.description}`);
const libraryRows = catalog.libraries.map(lib => `  ${(lib.path + '/').padEnd(23)} # ${lib.description}`);
const full = ['apps/', ...applicationRows, 'libs/', ...libraryRows].join('\n');
const compactRows = entries => {
  const rows = [];
  for (let index = 0; index < entries.length; index += 2) rows.push('  ' + entries.slice(index, index + 2).map(name => (name + '/').padEnd(24)).join('').trimEnd());
  return rows;
};
const compact = ['apps/', ...compactRows(catalog.applications.map(app => app.name)), 'libs/',
  `  backend/          # ${catalog.libraries.filter(library => library.kind === 'backend-context').length} contextos de negocio`,
  ...compactRows(catalog.libraries.filter(lib => lib.kind !== 'backend-context').map(lib => lib.path))].join('\n');
const appsTable = [
  '| Aplicación | Lugar previsto | Responsabilidad | Estado revisado |',
  '| --- | --- | --- | --- |',
  ...catalog.applications.map(app => `| \`${app.name}\` | ${app.location} | ${app.description} | ${app.state} |`),
].join('\n');
const targets = [
  { file: 'docs/opciones-tecnologicas.md', marker: 'full', value: '```text\n' + full + '\n```', style: 'markdown' },
  { file: 'docs/opciones-tecnologicas.md', marker: 'applications', value: appsTable, style: 'markdown' },
  { file: 'presentation/architecture-content.js', marker: 'compact', value: JSON.stringify(compact), style: 'javascript' },
  { file: 'presentation/pos-reveal-content.js', marker: 'compact', value: JSON.stringify(compact), style: 'javascript' },
];
const changes = new Map();
for (const target of targets) {
  const file = path.join(root, target.file);
  const source = changes.get(file) ?? fs.readFileSync(file, 'utf8');
  const start = target.style === 'markdown' ? `<!-- monorepo:${target.marker}:start -->` : `/* monorepo:${target.marker}:start */`;
  const end = target.style === 'markdown' ? `<!-- monorepo:${target.marker}:end -->` : `/* monorepo:${target.marker}:end */`;
  if (source.split(start).length !== 2 || source.split(end).length !== 2) throw new Error(`Expected exactly one ${target.marker} catalog block in ${target.file}`);
  const begin = source.indexOf(start) + start.length;
  const finish = source.indexOf(end, begin);
  if (finish < begin) throw new Error(`Invalid catalog block order: ${target.file}`);
  const gap = target.style === 'markdown' ? '\n' : ' ';
  changes.set(file, source.slice(0, begin) + gap + target.value + gap + source.slice(finish));
}
const stale = [];
for (const [file, expected] of changes) {
  const current = fs.readFileSync(file, 'utf8');
  if (current.replaceAll('\r\n', '\n') === expected.replaceAll('\r\n', '\n')) continue;
  stale.push(path.relative(root, file));
  if (!check) fs.writeFileSync(file, expected);
}
if (check && stale.length) throw new Error(`Monorepo catalog is out of sync: ${stale.join(', ')}. Run node tools/sync-monorepo-catalog.mjs and review the generated changes.`);
console.log(`Monorepo catalog: ${catalog.applications.length} apps, ${catalog.libraries.length} libraries; ${check ? 'all generated views consistent' : `${stale.length} source files updated`}.`);
