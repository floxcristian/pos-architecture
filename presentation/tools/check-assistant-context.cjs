/* Retrieval checks: coverage, provenance, useful answers and strict payload bounds. */
'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const {validateCorpus, splitText, INPUTS} = require('./build-assistant-context.cjs');
const corpus = require('../../server/assistant/corpus.json');
const {getContext, hasSlide} = require('../../server/assistant/context.cjs');
const root = path.resolve(__dirname, '../..');
const sourceMap = new Map(corpus.chunks.map(chunk => [chunk.sourceId, {id: chunk.sourceId, title: chunk.title, url: chunk.url}]));

validateCorpus(corpus);
assert.equal(corpus.slideIds.length, 79);
assert.ok(corpus.slideIds.every(id => !/^(pregunta-|ejercicio-|estructura-ejercicio-)/.test(id)), 'Removed assessment slides must not be offered as assistant sources');
assert.equal(corpus.chunks.filter(chunk => /:lab:.*:step:/.test(chunk.id)).length, 97);
assert.deepEqual(corpus.inputs.map(input => input.file), INPUTS, 'The public source allowlist must remain explicit');
for (const input of corpus.inputs) {
  const hash = crypto.createHash('sha256').update(fs.readFileSync(path.join(root, input.file), 'utf8')).digest('hex');
  assert.equal(input.sha256, hash, `Stale assistant corpus; rebuild after changing ${input.file}`);
}
assert(corpus.chunks.every(chunk => chunk.text.length <= 5000));
assert(splitText('a'.repeat(15001)).every(part => part.length <= 5000));
assert.equal(splitText('a'.repeat(15001)).join('').length, 15001, 'Splitting must not lose non-whitespace data');
assert.throws(() => validateCorpus({...corpus, chunks: [...corpus.chunks, corpus.chunks[0]]}), /Duplicate/);
assert.throws(() => validateCorpus({...corpus, chunks: [{...corpus.chunks[0], url: 'https://outside.example'}, ...corpus.chunks.slice(1)]}), /Unknown slide/);
assert.throws(() => validateCorpus({...corpus, slideIds: [...corpus.slideIds, corpus.slideIds[0]]}), /Expected nonempty unique course slide IDs/);
assert.throws(() => validateCorpus({...corpus, slideIds: []}), /Expected nonempty unique course slide IDs/);

function checkResult(question, slideId, history) {
  const result = getContext(question, slideId, history);
  assert.equal(typeof result.context, 'string');
  assert(result.context.length > 200 && result.context.length <= 18000, 'Context must be useful and bounded');
  assert(result.sources.length > 0 && result.sources.length <= 8, 'At most eight real sources');
  assert.equal(new Set(result.sources.map(source => source.id)).size, result.sources.length);
  for (const source of result.sources) {
    assert.deepEqual(source, sourceMap.get(source.id), 'Citations must resolve to the exact indexed source');
    assert(result.context.includes(`[${source.id}]`), 'A cited source must actually have an excerpt in context');
  }
  assert(result.sources.some(source => source.id === 'propuesta-arquitectura'), 'Include the proposal authority');
  assert(result.context.includes('no acredita una implementación productiva'), 'Keep the proposal status explicit');
  if (hasSlide(slideId)) {
    assert.equal(result.sources[0].id, slideId, 'Current slide is the first available source');
    assert(result.context.includes('Lámina actual'), 'Include an excerpt of the current slide');
  }
  return result;
}

const current = 'un-producto-varios-paises';
const acl = checkResult('¿Para qué sirve ACL?', current);
assert(acl.sources.some(source => source.id === 'acl-traduce-significado'));
assert.match(acl.context, /anticorrupci[oó]n/i);
assert.match(acl.context, /significados?|sem[aá]ntica/i);

const messaging = checkResult('BullMQ vs RabbitMQ', current);
assert(messaging.sources.some(source => source.id === 'elegir-mensajeria'));
assert(messaging.sources.some(source => source.id === 'laboratorio-bullmq'));
assert(messaging.sources.some(source => source.id === 'laboratorio-rabbitmq'));
assert.match(messaging.context, /reintentos?|backoff/i);
assert.match(messaging.context, /ACK|confirm/i);

const prices = checkResult('¿Se pueden activar precios incompletos?', current);
assert(prices.sources.some(source => source.id === 'fallos-de-precios' || source.id === 'laboratorio-snapshot-precios'));
assert.match(prices.context, /incomplet[ao]|parcial/i);
assert.match(prices.context, /versi[oó]n activa|activaci[oó]n at[oó]mica/i);

const country = checkResult('¿Qué cambia con Perú?', current);
assert(country.sources.some(source => source.id === 'incorporar-pais'));
assert.match(country.context, /custom/i);
assert.match(country.context, /homolog|fiscal/i);
assert.deepEqual(getContext('que cambia con Peru', current), getContext('qué cambia con Perú', current), 'Accent normalization must preserve retrieval');

for (const slideId of corpus.slideIds) checkResult('Explícame esta lámina', slideId);
assert.equal(hasSlide('../../.env'), false);
assert.equal(hasSlide(null), false);
assert.equal(hasSlide({id: current}), false);
checkResult('', 'not-a-slide', null);
checkResult('(a+)+ [.*] '.repeat(1500), current, 'invalid history');
const privateValue = 'PRIVATE_CANARY_9fe434d09ee';
const followUp = checkResult('¿Y los errores?', 'laboratorio-bullmq', [{role: 'user', content: `BullMQ y reintentos. ${privateValue}`}, {role: 'assistant', content: 'Esto no es una fuente de autoridad.'}]);
assert(!followUp.context.includes(privateValue), 'Do not serialize conversation or query text into evidence');
assert(!followUp.context.includes('Esto no es una fuente de autoridad.'), 'Assistant responses are not reference material');
console.log(`Assistant context checks passed: ${corpus.slideIds.length} proposal slides, 97 lab steps, ${corpus.chunks.length} chunks, no assessment sources, source integrity, query relevance and bounded retrieval.`);
