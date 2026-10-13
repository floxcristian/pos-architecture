'use strict';
const fs = require('node:fs');
const path = require('node:path');
const {createHash} = require('node:crypto');
const {Readable, Transform} = require('node:stream');
const {pipeline} = require('node:stream/promises');
const vm = require('node:vm');

const SHA = /^[a-f0-9]{64}$/;
const AUDIO_NAME = /^[a-z0-9][a-z0-9-]{0,100}\.mp3$/;
const MAX_ARCHIVE_BYTES = 512 * 1024 * 1024;
const hash = bytes => createHash('sha256').update(bytes).digest('hex');

function validateSpec(spec) {
  if (spec.schemaVersion !== 1 || !SHA.test(spec.contentHash) || !SHA.test(spec.sha256) ||
      !/^pos-narration-[a-f0-9]{16}\.zip$/.test(spec.file) ||
      !Number.isSafeInteger(spec.bytes) || spec.bytes < 22 || spec.bytes > MAX_ARCHIVE_BYTES ||
      !Number.isSafeInteger(spec.slides) || spec.slides < 1 || spec.slides > 500 ||
      !Number.isFinite(spec.duration) || spec.duration <= 0 ||
      !Number.isSafeInteger(spec.cues) || spec.cues < spec.slides || spec.cues > 10000 ||
      typeof spec.voice !== 'string' || !/^[a-zA-Z0-9-]+$/.test(spec.voice) ||
      !Array.isArray(spec.files) || spec.files.length !== spec.slides) throw new Error('Invalid narration publication manifest');
  const url = new URL(spec.url);
  const release = `pos-narration-${spec.contentHash.slice(0, 16)}`;
  if (url.protocol !== 'https:' || url.hostname !== 'github.com' || url.search || url.hash ||
      url.username || url.password ||
      url.pathname !== `/floxcristian/pos-architecture/releases/download/${release}/${spec.file}` ||
      spec.file !== release + '.zip') throw new Error('Narration must come from the pinned public presentation release');
  const names = new Set();
  let total = 0;
  for (const file of spec.files) {
    if (!AUDIO_NAME.test(file.file) || names.has(file.file) || !SHA.test(file.sha256) ||
        !Number.isSafeInteger(file.bytes) || file.bytes < 1) throw new Error('Invalid narration file allowlist');
    names.add(file.file);
    total += file.bytes;
  }
  if (total > spec.bytes || total > MAX_ARCHIVE_BYTES) throw new Error('Narration files exceed the pinned archive size');
  return spec;
}

function verifyNarrationSources(root, spec) {
  const context = {window: {}};
  for (const name of ['pos-reveal-content.js', 'pos-reveal-narration-content.js', 'pos-reveal-narration-audio.js']) {
    vm.runInNewContext(fs.readFileSync(path.join(root, 'presentation', name), 'utf8'), context, {timeout: 3000, filename: name});
  }
  const script = context.window.POS_REVEAL_NARRATION_CONTENT;
  const recordings = context.window.POS_REVEAL_NARRATION_AUDIO;
  const metadata = context.window.POS_REVEAL_NARRATION_AUDIO_META;
  const slides = context.window.POS_REVEAL_CONTENT?.slides;
  if (!script || !recordings || metadata?.contentHash !== spec.contentHash ||
      metadata?.slides !== spec.slides || metadata?.voice !== spec.voice ||
      !Number.isFinite(metadata.duration) || metadata.cues !== spec.cues ||
      !Array.isArray(slides) || slides.length !== spec.slides || slides.some(slide => !script[slide.id]) ||
      Object.keys(script).length !== spec.slides || Object.keys(recordings).length !== spec.slides) throw new Error('Narration script, audio and publication revisions differ');
  let duration = 0;
  let cueCount = 0;
  for (const file of spec.files) {
    const id = file.file.slice(0, -4);
    const recording = recordings[id];
    const cues = script[id];
    if (!recording || !Array.isArray(cues) || !Array.isArray(recording.cues) || !cues.length ||
        recording.src !== `/media/narration/${spec.contentHash}/${file.file}` || recording.sha256 !== file.sha256 ||
        recording.bytes !== file.bytes || !Number.isFinite(recording.duration) || recording.duration <= 0 ||
        recording.cues.length !== cues.length) throw new Error(`Narration recording does not match its publication: ${id}`);
    let previousEnd = 0;
    for (let index = 0; index < cues.length; index++) {
      const timing = recording.cues[index];
      if (timing.id !== cues[index].id || timing.textSha256 !== hash(Buffer.from(cues[index].text, 'utf8')) ||
          !Number.isFinite(timing.start) || !Number.isFinite(timing.end) || timing.start < previousEnd ||
          timing.end <= timing.start || timing.end > recording.duration + .15) throw new Error(`Narration cue text or timing is stale: ${id}/${cues[index].id}`);
      previousEnd = timing.end;
    }
    duration += recording.duration;
    cueCount += cues.length;
  }
  if (cueCount !== spec.cues || Math.abs(duration - spec.duration) > .01 || Math.abs(duration - metadata.duration) > .01) throw new Error('Narration totals do not match their recordings');
}

/** Accept only the deterministic, uncompressed, flat MP3 archive our compiler emits.
 * No paths, symlinks, encryption, data descriptors, ZIP64, or unlisted files.
 * Both the archive and every extracted file have independently pinned SHA-256.
 */
function extractVerifiedArchive(buffer, spec, directory) {
  validateSpec(spec);
  if (buffer.length !== spec.bytes || hash(buffer) !== spec.sha256) throw new Error('Narration archive integrity verification failed');
  const end = buffer.length - 22;
  if (buffer.readUInt32LE(end) !== 0x06054b50 || buffer.readUInt16LE(end + 20) !== 0 ||
      buffer.readUInt16LE(end + 4) !== 0 || buffer.readUInt16LE(end + 6) !== 0) throw new Error('Unsupported narration ZIP directory');
  const count = buffer.readUInt16LE(end + 10);
  const centralSize = buffer.readUInt32LE(end + 12);
  const centralOffset = buffer.readUInt32LE(end + 16);
  if (count !== spec.files.length || buffer.readUInt16LE(end + 8) !== count ||
      centralOffset + centralSize !== end) throw new Error('Narration ZIP directory does not match its allowlist');
  const allowed = new Map(spec.files.map(file => [file.file, file]));
  const verified = [];
  const spans = [];
  let position = centralOffset;
  for (let index = 0; index < count; index++) {
    if (position + 46 > end || buffer.readUInt32LE(position) !== 0x02014b50) throw new Error('Invalid narration ZIP entry');
    const flags = buffer.readUInt16LE(position + 8);
    const method = buffer.readUInt16LE(position + 10);
    const size = buffer.readUInt32LE(position + 24);
    const nameLength = buffer.readUInt16LE(position + 28);
    const extraLength = buffer.readUInt16LE(position + 30);
    const commentLength = buffer.readUInt16LE(position + 32);
    const mode = buffer.readUInt32LE(position + 38) >>> 16;
    const local = buffer.readUInt32LE(position + 42);
    const nameEnd = position + 46 + nameLength;
    const next = nameEnd + extraLength + commentLength;
    if (next > end || flags !== 0 || method !== 0 || buffer.readUInt32LE(position + 20) !== size ||
        buffer.readUInt16LE(position + 34) !== 0 || (mode & 0o170000) !== 0o100000) throw new Error('Unsupported narration ZIP entry attributes');
    const name = buffer.toString('utf8', position + 46, nameEnd);
    const expected = allowed.get(name);
    if (!AUDIO_NAME.test(name) || !expected || expected.bytes !== size) throw new Error('Narration ZIP entry is not allowlisted');
    allowed.delete(name);
    if (local + 30 > centralOffset || buffer.readUInt32LE(local) !== 0x04034b50 ||
        buffer.readUInt16LE(local + 6) !== 0 || buffer.readUInt16LE(local + 8) !== 0 ||
        buffer.readUInt32LE(local + 18) !== size || buffer.readUInt32LE(local + 22) !== size) throw new Error('Narration ZIP local entry differs from its directory');
    const localNameLength = buffer.readUInt16LE(local + 26);
    const localExtraLength = buffer.readUInt16LE(local + 28);
    const start = local + 30 + localNameLength + localExtraLength;
    if (start + size > centralOffset ||
        buffer.toString('utf8', local + 30, local + 30 + localNameLength) !== name) throw new Error('Narration ZIP local filename or bounds are invalid');
    const audio = buffer.subarray(start, start + size);
    if (hash(audio) !== expected.sha256) throw new Error(`Narration audio integrity verification failed: ${name}`);
    spans.push([local, start + size]);
    verified.push({name, audio});
    position = next;
  }
  if (position !== end || allowed.size) throw new Error('Narration ZIP is incomplete');
  spans.sort((a, b) => a[0] - b[0]);
  if (spans[0][0] !== 0 || spans.at(-1)[1] !== centralOffset ||
      spans.some((span, index) => index > 0 && span[0] !== spans[index - 1][1])) throw new Error('Narration ZIP has overlapping or unexpected payloads');
  fs.mkdirSync(directory, {recursive: true});
  // Write only after the entire archive passes validation.
  for (const {name, audio} of verified) fs.writeFileSync(path.join(directory, name), audio, {flag: 'wx'});
  return verified.length;
}

async function publishNarration(root, output, {localSource = process.env.POS_NARRATION_SOURCE} = {}) {
  const spec = validateSpec(JSON.parse(fs.readFileSync(path.join(root, 'presentation/narration-publication.json'), 'utf8')));
  verifyNarrationSources(root, spec);
  const media = path.join(output, 'media', 'narration');
  fs.mkdirSync(media, {recursive: true});
  const temporary = path.join(media, spec.file + '.partial');
  const digest = createHash('sha256');
  let bytes = 0;
  const verify = new Transform({transform(chunk, encoding, callback) {
    bytes += chunk.length;
    if (bytes > spec.bytes) return callback(new Error('Narration ZIP exceeds its pinned size'));
    digest.update(chunk);
    callback(null, chunk);
  }});
  try {
    let source;
    if (localSource) {
      const absolute = path.resolve(localSource);
      if (!fs.lstatSync(absolute).isFile()) throw new Error('POS_NARRATION_SOURCE must be a regular file');
      source = fs.createReadStream(absolute);
    } else {
      console.log(`Downloading narration ${spec.contentHash.slice(0, 16)} (${spec.bytes} bytes).`);
      const response = await fetch(spec.url, {signal: AbortSignal.timeout(300_000)});
      if (!response.ok || !response.body) throw new Error(`Narration download failed: HTTP ${response.status}`);
      source = Readable.fromWeb(response.body);
    }
    await pipeline(source, verify, fs.createWriteStream(temporary, {flags: 'wx'}));
    if (bytes !== spec.bytes || digest.digest('hex') !== spec.sha256) throw new Error('Narration download integrity verification failed');
    const directory = path.join(media, spec.contentHash);
    const count = extractVerifiedArchive(fs.readFileSync(temporary), spec, directory);
    console.log(`Published ${count} narrator MP3 files: archive and every file SHA-256 verified.`);
    return {count, directory};
  } finally {
    fs.rmSync(temporary, {force: true});
  }
}

module.exports = {publishNarration, extractVerifiedArchive, validateSpec, verifyNarrationSources};
