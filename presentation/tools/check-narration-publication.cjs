'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const {createHash} = require('node:crypto');
const {extractVerifiedArchive, validateSpec, verifyNarrationSources} = require('./narration-publication.cjs');

const sha = value => createHash('sha256').update(value).digest('hex');
const contentHash = 'a'.repeat(64);
const file = 'pos-narration-' + contentHash.slice(0, 16) + '.zip';
function fixture({name = 'slide-a.mp3', mode = 0o100644, method = 0, flags = 0, audio = Buffer.from('verified audio fixture')} = {}) {
  const filename = Buffer.from(name);
  const local = Buffer.alloc(30);
  local.writeUInt32LE(0x04034b50, 0);
  local.writeUInt16LE(20, 4);
  local.writeUInt16LE(flags, 6);
  local.writeUInt16LE(method, 8);
  local.writeUInt32LE(audio.length, 18);
  local.writeUInt32LE(audio.length, 22);
  local.writeUInt16LE(filename.length, 26);
  const central = Buffer.alloc(46);
  central.writeUInt32LE(0x02014b50, 0);
  central.writeUInt16LE(20, 6);
  central.writeUInt16LE(flags, 8);
  central.writeUInt16LE(method, 10);
  central.writeUInt32LE(audio.length, 20);
  central.writeUInt32LE(audio.length, 24);
  central.writeUInt16LE(filename.length, 28);
  central.writeUInt32LE((mode << 16) >>> 0, 38);
  const end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50, 0);
  end.writeUInt16LE(1, 8);
  end.writeUInt16LE(1, 10);
  end.writeUInt32LE(central.length + filename.length, 12);
  end.writeUInt32LE(local.length + filename.length + audio.length, 16);
  const archive = Buffer.concat([local, filename, audio, central, filename, end]);
  const spec = {schemaVersion: 1, contentHash, file, slides: 1, cues: 1, duration: 1, voice: 'es-CL-LorenzoNeural',
    url: `https://github.com/floxcristian/pos-architecture/releases/download/pos-narration-${contentHash.slice(0, 16)}/${file}`,
    bytes: archive.length, sha256: sha(archive), files: [{file: name, bytes: audio.length, sha256: sha(audio)}]};
  return {archive, spec, audio};
}

const temporaryRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'pos-narration-verification-'));
let checks = 0;
function reject(name, configure) {
  const item = configure();
  const destination = path.join(temporaryRoot, name);
  assert.throws(() => extractVerifiedArchive(item.archive, item.spec, destination), name);
  assert.equal(fs.existsSync(destination), false, 'Invalid archive must not write any audio');
  checks++;
}
try {
  const valid = fixture();
  const destination = path.join(temporaryRoot, 'valid');
  assert.equal(extractVerifiedArchive(valid.archive, valid.spec, destination), 1);
  assert.deepEqual(fs.readFileSync(path.join(destination, 'slide-a.mp3')), valid.audio);
  checks++;
  reject('archive-hash', () => {const f = fixture(); f.archive[35] ^= 1; return f;});
  reject('audio-hash', () => {const f = fixture(); f.spec.files[0].sha256 = '0'.repeat(64); return f;});
  reject('traversal', () => fixture({name: '../a.mp3'}));
  reject('nested-path', () => fixture({name: 'path/a.mp3'}));
  reject('symlink', () => fixture({mode: 0o120777}));
  reject('compression', () => fixture({method: 8}));
  reject('encryption', () => fixture({flags: 1}));
  reject('data-descriptor', () => fixture({flags: 8}));
  reject('unknown-file', () => {const f = fixture(); f.spec.files[0].file = 'slide-b.mp3'; return f;});
  reject('local-name-mismatch', () => {const f = fixture(); f.archive[30] = 'z'.charCodeAt(0); f.spec.sha256 = sha(f.archive); return f;});
  reject('out-of-range-local-header', () => {const f = fixture(); const central = f.archive.readUInt32LE(f.archive.length - 6); f.archive.writeUInt32LE(0xffffffff, central + 42); f.spec.sha256 = sha(f.archive); return f;});
  reject('duplicate-allowlist', () => {const f = fixture(); f.spec.files.push({...f.spec.files[0]}); f.spec.slides++; return f;});
  reject('unexpected-trailing-bytes', () => {const f = fixture(); f.archive = Buffer.concat([f.archive, Buffer.from('extra')]); f.spec.bytes = f.archive.length; f.spec.sha256 = sha(f.archive); return f;});
  assert.throws(() => validateSpec({...valid.spec, url: valid.spec.url.replace('github.com', 'example.com')}));
  checks++;
  const sourceRoot = path.join(temporaryRoot, 'source-check');
  const presentation = path.join(sourceRoot, 'presentation');
  fs.mkdirSync(presentation, {recursive: true});
  const text = 'Una explicación pública.';
  const writeData = (name, global, value) => fs.writeFileSync(path.join(presentation, name), `window.${global} = ${JSON.stringify(value)};\n`);
  writeData('pos-reveal-content.js', 'POS_REVEAL_CONTENT', {slides: [{id: 'slide-a'}]});
  writeData('pos-reveal-narration-content.js', 'POS_REVEAL_NARRATION_CONTENT', {'slide-a': [{id: 'intro', text}]});
  const recording = {'slide-a': {src: `/media/narration/${contentHash}/slide-a.mp3`, duration: 1,
    bytes: valid.spec.files[0].bytes, sha256: valid.spec.files[0].sha256,
    cues: [{id: 'intro', start: 0, end: 1, textSha256: sha(Buffer.from(text))}]}};
  const metadata = {contentHash, slides: 1, cues: 1, duration: 1, voice: valid.spec.voice};
  writeData('pos-reveal-narration-audio.js', 'POS_REVEAL_NARRATION_AUDIO', recording);
  fs.appendFileSync(path.join(presentation, 'pos-reveal-narration-audio.js'), `window.POS_REVEAL_NARRATION_AUDIO_META = ${JSON.stringify(metadata)};\n`);
  verifyNarrationSources(sourceRoot, valid.spec);
  checks++;
  writeData('pos-reveal-narration-content.js', 'POS_REVEAL_NARRATION_CONTENT', {'slide-a': [{id: 'intro', text: 'El texto cambió después de grabar.'}]});
  assert.throws(() => verifyNarrationSources(sourceRoot, valid.spec), /cue text or timing is stale/);
  checks++;
  writeData('pos-reveal-narration-content.js', 'POS_REVEAL_NARRATION_CONTENT', {'slide-a': [{id: 'intro', text}]});
  writeData('pos-reveal-content.js', 'POS_REVEAL_CONTENT', {slides: [{id: 'slide-b'}]});
  assert.throws(() => verifyNarrationSources(sourceRoot, valid.spec), /revisions differ/);
  checks++;
  console.log(`Narration publication: ${checks} integrity, archive-boundary and allowlist checks passed.`);
} finally {
  const resolved = path.resolve(temporaryRoot);
  if (path.dirname(resolved) !== path.resolve(os.tmpdir()) || !path.basename(resolved).startsWith('pos-narration-verification-')) throw new Error('Invalid temporary cleanup target');
  fs.rmSync(resolved, {recursive: true, force: true});
}
