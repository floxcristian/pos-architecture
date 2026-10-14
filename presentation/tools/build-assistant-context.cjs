/* Build a public, allowlisted proposal corpus. Never read research repos or credentials. */
'use strict';
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const crypto = require('node:crypto');

const INPUTS = Object.freeze([
  'presentation/pos-reveal-content.js',
  'presentation/pos-reveal-narration-content.js',
  'presentation/pos-reveal-labs.js',
  'docs/propuesta-arquitectura.md'
]);
const COURSE_URL = '/presentation/pos-corporativo-reveal.html';
const PROPOSAL_URL = '/docs/propuesta-arquitectura.md';
const MAX_CHUNK = 5000;

function clean(value) {
  return String(value ?? '').replace(/\r\n?/g, '\n')
    .replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g, '')
    .replace(/<\/?(?:script|style|div|span|p|br|strong|em|section|article|h[1-6])\b[^>]*>/gi, '')
    .replace(/[ \t]+\n/g, '\n').trim();
}

function splitText(value, limit = MAX_CHUNK) {
  let remaining = clean(value);
  const parts = [];
  while (remaining.length > limit) {
    // Preserve complete paragraphs or sentences where possible, while bounding every chunk.
    let boundary = remaining.lastIndexOf('\n\n', limit);
    if (boundary < limit / 2) boundary = remaining.lastIndexOf('. ', limit);
    if (boundary < limit / 2) boundary = remaining.lastIndexOf(' ', limit);
    if (boundary < limit / 2) boundary = limit;
    else if (remaining.slice(boundary, boundary + 2) === '. ') boundary++;
    parts.push(remaining.slice(0, boundary).trim());
    remaining = remaining.slice(boundary).trim();
  }
  if (remaining) parts.push(remaining);
  return parts;
}

function strings(value) {
  if (typeof value === 'string') return [clean(value)];
  if (Array.isArray(value)) return value.flatMap(strings);
  if (!value || typeof value !== 'object') return [];
  const fields = new Set(['title', 'text', 'label', 'items', 'kicker', 'meaning', 'description', 'explanation', 'detail', 'value', 'source']);
  return Object.entries(value).flatMap(([key, item]) => fields.has(key) ? strings(item) : []);
}

function validateCorpus(corpus) {
  if (corpus.version !== 1 || !Array.isArray(corpus.slideIds) || !corpus.slideIds.length ||
      corpus.slideIds.some(id => typeof id !== 'string' || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(id)) ||
      new Set(corpus.slideIds).size !== corpus.slideIds.length) throw new Error('Expected nonempty unique course slide IDs');
  const ids = new Set();
  const knownSlides = new Set(corpus.slideIds);
  const sources = new Map();
  for (const chunk of corpus.chunks) {
    if (!chunk.id || ids.has(chunk.id)) throw new Error(`Duplicate or missing chunk ID: ${chunk.id}`);
    ids.add(chunk.id);
    if (!chunk.sourceId || !chunk.title || !chunk.text || chunk.text.length > MAX_CHUNK) throw new Error(`Invalid chunk: ${chunk.id}`);
    if (chunk.slideId && (!knownSlides.has(chunk.slideId) || chunk.sourceId !== chunk.slideId || chunk.url !== `${COURSE_URL}#/${chunk.slideId}`)) throw new Error(`Unknown slide source: ${chunk.id}`);
    if (!chunk.slideId && !((chunk.sourceId === 'propuesta-arquitectura' && chunk.url === PROPOSAL_URL) || (chunk.sourceId === 'glosario' && chunk.url === COURSE_URL))) throw new Error(`Source outside public allowlist: ${chunk.id}`);
    const prior = sources.get(chunk.sourceId);
    if (prior && (prior.title !== chunk.title || prior.url !== chunk.url)) throw new Error(`Inconsistent source metadata: ${chunk.sourceId}`);
    sources.set(chunk.sourceId, {title: chunk.title, url: chunk.url});
  }
  for (const id of corpus.slideIds) {
    if (!ids.has(`${id}:slide:1`) || !ids.has(`${id}:narration:1`)) throw new Error(`Missing slide or narration coverage: ${id}`);
  }
  const all = corpus.chunks.map(chunk => chunk.text).join('\n');
  for (const expected of ['PostgreSQL', 'BullMQ', 'RabbitMQ', 'ACL', 'Perú', 'fuente de decisión', 'recibido', 'contabilizado']) {
    if (!all.toLocaleLowerCase('es').includes(expected.toLocaleLowerCase('es'))) throw new Error(`Missing architecture evidence: ${expected}`);
  }
  if (corpus.chunks.filter(chunk => /:lab:.*:step:/.test(chunk.id)).length !== 97) throw new Error('Expected all 97 laboratory steps');
  return corpus;
}

function buildAssistantContext(options = {}) {
  const root = path.resolve(options.root || path.join(__dirname, '../..'));
  const inputs = Object.fromEntries(INPUTS.map(relative => {
    const absolute = path.join(root, relative);
    if (!fs.lstatSync(absolute).isFile()) throw new Error(`Corpus input must be a regular file: ${relative}`);
    return [relative, fs.readFileSync(absolute, 'utf8')];
  }));
  const sandbox = vm.createContext({window: Object.create(null)}, {codeGeneration: {strings: false, wasm: false}});
  for (const relative of INPUTS.filter(file => file.endsWith('.js'))) vm.runInContext(inputs[relative], sandbox, {filename: relative, timeout: 1500});
  const course = sandbox.window.POS_REVEAL_CONTENT;
  const narration = sandbox.window.POS_REVEAL_NARRATION_CONTENT;
  const labs = sandbox.window.POS_REVEAL_LABS;
  const chunks = [];
  const add = (baseId, source, value) => splitText(value).forEach((text, index) => chunks.push({id: `${baseId}:${index + 1}`, ...source, text}));

  for (const slide of course.slides) {
    const source = {sourceId: slide.id, title: clean(slide.title), url: `${COURSE_URL}#/${slide.id}`, slideId: slide.id};
    const parts = [slide.title, slide.lead, ...strings(slide.items), ...strings(slide.columns), ...strings(slide.steps), ...strings(slide.aside), ...strings(slide.code), slide.takeaway, ...(slide.notes || [])];
    add(`${slide.id}:slide`, source, parts.filter(Boolean).map(clean).join('\n\n'));
    if (!Array.isArray(narration[slide.id]) || !narration[slide.id].length) throw new Error(`Missing narration: ${slide.id}`);
    add(`${slide.id}:narration`, source, narration[slide.id].map(cue => cue.text).join('\n\n'));
    if (!slide.lab) continue;
    const lab = labs[slide.lab];
    if (!lab) throw new Error(`Missing laboratory: ${slide.lab}`);
    for (const [scenarioIndex, scenario] of lab.scenarios.entries()) {
      const prefix = `${lab.title}\nEscenario ${scenarioIndex + 1}: ${scenario.label}`;
      add(`${slide.id}:lab:${scenario.id}:overview`, source, `${prefix}\n\n${scenario.steps.map((step, index) => `${index + 1}. ${step.title}: ${step.text}`).join('\n')}`);
      for (const [stepIndex, step] of scenario.steps.entries()) {
        add(`${slide.id}:lab:${scenario.id}:step:${stepIndex + 1}`, source,
          `${prefix}\nPaso ${stepIndex + 1} de ${scenario.steps.length}: ${step.title}\n\n${step.text}\n\n${strings(step.values).join(' · ')}${step.code ? `\n\nCódigo de referencia de la propuesta:\n${step.code}` : ''}${step.log ? `\n\nTraza sintética: ${step.log}` : ''}`);
      }
    }
  }
  for (const [index, term] of course.glossary.entries()) add(`glosario:${index + 1}`, {sourceId: 'glosario', title: 'Glosario de arquitectura de POS Platform', url: COURSE_URL}, `${term.term}\n\n${term.meaning}`);

  // The document is the decision authority; slides and simulations develop the proposal.
  const sections = inputs['docs/propuesta-arquitectura.md'].split(/(?=^#{1,4} )/m).filter(section => section.trim());
  const proposalSource = {sourceId: 'propuesta-arquitectura', title: 'Propuesta de arquitectura vigente y decisiones', url: PROPOSAL_URL};
  sections.forEach((section, index) => add(`propuesta-arquitectura:section:${index + 1}`, proposalSource, section));
  const corpus = validateCorpus({
    version: 1,
    inputs: INPUTS.map(file => ({file, sha256: crypto.createHash('sha256').update(inputs[file]).digest('hex')})),
    slideIds: course.slides.map(slide => slide.id),
    chunks
  });
  const output = path.join(root, 'server/assistant/corpus.json');
  fs.mkdirSync(path.dirname(output), {recursive: true});
  fs.writeFileSync(output, JSON.stringify(corpus, null, 2) + '\n', 'utf8');
  console.log(`Assistant corpus: ${corpus.slideIds.length} slides, 97 laboratory steps, ${chunks.length} bounded chunks.`);
  return corpus;
}

module.exports = {buildAssistantContext, validateCorpus, splitText, INPUTS};
if (require.main === module) buildAssistantContext();
