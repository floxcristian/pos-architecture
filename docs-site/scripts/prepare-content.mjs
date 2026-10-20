import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { generatedPages, generatedDirectories, labLinks, siteBase, sourceRouteAliases } from '../content-map.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const output = path.join(root, 'docs-site/src/content/docs');
const sourceCache = new Map();
const warnings = new Set();
const routeBySource = new Map();
const anchorBySource = new Map();

function slug(text) {
  return text.toLowerCase().replace(/<[^>]*>/g, '').replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(/[^\p{L}\p{N}\p{M}_\- ]/gu, '').replace(/ /g, '-');
}

function readSource(source) {
  if (sourceCache.has(source)) return sourceCache.get(source);
  const absolute = path.resolve(root, source);
  if (!absolute.startsWith(root + path.sep)) throw new Error(`Source outside repository: ${source}`);
  const text = fs.readFileSync(absolute, 'utf8').replace(/\r\n/g, '\n');
  const lines = text.split('\n');
  const headings = [];
  const usedSlugs = new Map();
  let fence = null;
  lines.forEach((line, index) => {
    const marker = line.match(/^\s*(`{3,}|~{3,})/);
    if (marker) {
      if (!fence) fence = marker[1][0];
      else if (fence === marker[1][0]) fence = null;
      return;
    }
    if (fence) return;
    const match = line.match(/^(#{1,6})\s+(.+?)\s*#*$/);
    if (!match) return;
    const base = slug(match[2]);
    const occurrence = usedSlugs.get(base) || 0;
    usedSlugs.set(base, occurrence + 1);
    headings.push({ index, level: match[1].length, text: match[2], id: base + (occurrence ? `-${occurrence}` : '') });
  });
  const data = { text, lines, headings };
  sourceCache.set(source, data);
  return data;
}

function bounds(page) {
  const source = readSource(page.source);
  const locate = (heading, fallback) => {
    if (!heading) return fallback;
    const found = source.headings.find(item => item.text === heading);
    if (!found) throw new Error(`Missing source heading: ${page.source}: ${heading}`);
    return found.index;
  };
  return { start: locate(page.range?.from, 0), end: locate(page.range?.to, source.lines.length) };
}

// Resolve a document's original anchors before splitting it across routes.
for (const page of generatedPages) {
  const source = readSource(page.source);
  const { start, end } = bounds(page);
  if (!routeBySource.has(page.source)) routeBySource.set(page.source, page.route);
  if (!anchorBySource.has(page.source)) anchorBySource.set(page.source, new Map());
  for (const heading of source.headings.filter(item => item.index >= start && item.index < end)) {
    anchorBySource.get(page.source).set(heading.id, page.route);
  }
  for (const match of source.lines.slice(start, end).join('\n').matchAll(/\bid=["']([^"']+)["']/g)) {
    anchorBySource.get(page.source).set(match[1], page.route);
  }
}

/** Resolve an existing documentation source and optional fragment to its canonical page. */
export function resolveDocLink(source, fragment = '') {
  const normalized = path.posix.normalize(source.replace(/\\/g, '/').replace(/^\//, ''));
  const route = routeBySource.get(normalized) || sourceRouteAliases[normalized.replace(/\/$/, '')];
  if (!route) return null;
  const rawFragment = fragment.replace(/^#/, '');
  const decoded = decodeURIComponent(rawFragment);
  const targetRoute = anchorBySource.get(normalized)?.get(decoded) || route;
  return `${siteBase}${targetRoute}/${rawFragment ? `#${rawFragment}` : ''}`;
}

// No proposal paragraph may disappear or be duplicated when a section is moved.
const proposalPages = generatedPages.filter(page => page.source === 'docs/propuesta-arquitectura.md');
const coverage = new Uint8Array(readSource('docs/propuesta-arquitectura.md').lines.length);
for (const page of proposalPages) {
  const { start, end } = bounds(page);
  for (let index = start; index < end; index += 1) coverage[index] += 1;
}
if (coverage.some(count => count !== 1)) throw new Error('Proposal ranges must cover each source line exactly once.');

function rewriteTarget(rawTarget, source) {
  const target = rawTarget.replace(/^<|>$/g, '');
  if (/^(?:[a-z][a-z\d+.-]*:|\/\/)/i.test(target) || target.startsWith(siteBase)) return rawTarget;
  const hashIndex = target.indexOf('#');
  const hash = hashIndex < 0 ? '' : target.slice(hashIndex + 1);
  const beforeHash = hashIndex < 0 ? target : target.slice(0, hashIndex);
  const queryIndex = beforeHash.indexOf('?');
  const query = queryIndex < 0 ? '' : beforeHash.slice(queryIndex);
  const targetPath = queryIndex < 0 ? beforeHash : beforeHash.slice(0, queryIndex);
  let decodedPath;
  let decodedHash;
  try { decodedPath = decodeURIComponent(targetPath); decodedHash = decodeURIComponent(hash); }
  catch { warnings.add(`Invalid URL encoding in ${source}: ${target}`); return rawTarget; }
  const relative = decodedPath
    ? path.posix.normalize(decodedPath.startsWith('/') ? decodedPath.slice(1) : path.posix.join(path.posix.dirname(source), decodedPath))
    : source;
  const route = routeBySource.get(relative) || sourceRouteAliases[relative.replace(/\/$/, '')];
  if (route) {
    const anchorRoute = decodedHash && anchorBySource.get(relative)?.get(decodedHash);
    if (decodedHash && !anchorRoute) warnings.add(`Original anchor not found: ${source} -> ${relative}#${decodedHash}`);
    return `${siteBase}${anchorRoute || route}/${query}${hash ? `#${hash}` : ''}`;
  }
  if (relative.startsWith('../')) throw new Error(`Link escapes repository: ${source} -> ${target}`);
  if (!fs.existsSync(path.join(root, relative))) warnings.add(`Original file not found: ${source} -> ${relative}`);
  return '/' + relative.split('/').map(segment => encodeURIComponent(segment)).join('/') + query + (hash ? `#${hash}` : '');
}

function rewriteLinks(text, source) {
  let fence = null;
  return text.split('\n').map(line => {
    const marker = line.match(/^\s*(`{3,}|~{3,})/);
    if (marker) {
      if (!fence) fence = marker[1][0];
      else if (fence === marker[1][0]) fence = null;
      return line;
    }
    if (fence) return line;
    return line.replace(/(!?\[[^\]]*\]\()(<[^>]+>|[^)\s]+)([^)]*\))/g,
      (_, start, target, end) => start + rewriteTarget(target, source) + end)
      .replace(/^(\s*\[[^\]]+\]:\s*)(<[^>]+>|\S+)/, (_, prefix, target) => prefix + rewriteTarget(target, source));
  }).join('\n');
}

export function prepareContent() {
  const generatedFiles = new Set();
  for (const page of generatedPages) {
    const source = readSource(page.source);
    const { start, end } = bounds(page);
    let body = source.lines.slice(start, end).join('\n').trim();
    // The page title belongs to Starlight. Retain the source anchor without another H1.
    const firstHeading = source.headings.find(heading => heading.index === start);
    if (firstHeading) body = body.replace(/^#{1,6}\s+[^\n]+\n?/, `<span id="${firstHeading.id}"></span>\n`);
    body = rewriteLinks(body, page.source);
    const extension = page.flow ? '.mdx' : '.md';
    const sourceLabel = page.kind === 'evidence' ? 'Evidencia y alcance de la revisión' : page.kind === 'research' ? 'Análisis que sustenta la propuesta' : 'Fuente del contenido';
    let imports = '';
    let enhanced = '';
    if (page.flow) {
      imports = "import FlowPlayer from '../../../components/FlowPlayer.astro';\n\n";
      const title = page.flow === 'sale' ? 'Venta confirmada en sucursal' : 'Publicación y activación de precios';
      enhanced = `<FlowPlayer scenario="${page.flow}" title="${title}" />\n\n`;
    }
    const labs = page.labs?.length ? '\n\n## Escenarios interactivos\n\n' + page.labs.map(id => `- [${labLinks[id]}](/presentation/pos-corporativo-reveal.html?lectura=0#/${id})`).join('\n') + '\n\nLas simulaciones ilustran el diseño propuesto; no ejecutan operaciones ni demuestran garantías del producto.\n' : '';
    const frontmatter = `---\ntitle: ${JSON.stringify(page.title)}\ndescription: ${JSON.stringify(page.description)}\neditUrl: false\n---\n\n`;
    const sourceReference = page.sourceDownload === false || page.source.startsWith('docs-site/') ? `\`${page.source}\`` : `[${page.source}](/${page.source})`;
    const footer = `\n\n---\n\n${sourceLabel}: ${sourceReference}${page.range?.from ? ` · sección «${page.range.from}»` : ''}.\n`;
    const destination = path.join(output, page.route + extension);
    fs.mkdirSync(path.dirname(destination), { recursive: true });
    fs.writeFileSync(destination, frontmatter + imports + enhanced + body + labs + footer, 'utf8');
    generatedFiles.add(destination);
  }

  // Remove stale generated Markdown only, never source documents or authored pages.
  for (const directory of generatedDirectories) {
    const absolute = path.resolve(output, directory);
    if (path.dirname(absolute) !== output || !fs.existsSync(absolute)) continue;
    for (const filename of fs.readdirSync(absolute)) {
      const candidate = path.join(absolute, filename);
      if (/\.mdx?$/.test(filename) && fs.lstatSync(candidate).isFile() && !generatedFiles.has(candidate)) fs.unlinkSync(candidate);
    }
  }

  const allDocs = [];
  function collect(directory) {
    for (const entry of fs.readdirSync(path.join(root, directory), { withFileTypes: true })) {
      const relative = path.posix.join(directory, entry.name);
      if (entry.isDirectory()) collect(relative);
      else if (entry.isFile() && entry.name.endsWith('.md')) allDocs.push(relative);
    }
  }
  collect('docs');
  const missing = allDocs.filter(source => !routeBySource.has(source));
  if (missing.length) throw new Error(`Documents without an editorial route: ${missing.join(', ')}`);
  console.log(`Starlight content: ${generatedFiles.size} pages, ${allDocs.length}/${allDocs.length} source documents indexed, proposal lines covered exactly once.`);
  for (const warning of warnings) console.warn(`[content] ${warning}`);
  console.log(`Original source link warnings: ${warnings.size}`);
  return { pages: generatedFiles.size, sources: allDocs.length, warnings: [...warnings] };
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) prepareContent();
