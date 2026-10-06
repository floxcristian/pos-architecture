'use strict';

const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const path = require('node:path');
const os = require('node:os');
const {createHash} = require('node:crypto');
const {publishVideo} = require('./video-publication.cjs');

async function fixture(t, overrides = {}) {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'pos-video-publication-'));
  t.after(() => fs.rm(root, {recursive:true, force:true}));
  const bytes = Buffer.from('A pinned video release fixture.\n');
  const spec = {
    revision:2,
    file:'pos-video-v2.mp4',
    url:'https://github.com/floxcristian/pos-architecture/releases/download/pos-video-v2/pos-video-v2.mp4',
    bytes:bytes.length,
    sha256:createHash('sha256').update(bytes).digest('hex'),
    ...overrides,
  };
  const localSource = path.join(root, 'source.mp4');
  const output = path.join(root, 'public');
  const destination = path.join(output, 'media', spec.file);
  await fs.mkdir(path.join(root, 'video'));
  await fs.writeFile(path.join(root, 'video/publication.json'), JSON.stringify(spec));
  await fs.writeFile(localSource, bytes);
  return {root, bytes, spec, localSource, output, destination};
}

async function absent(file) {
  await assert.rejects(fs.stat(file), {code:'ENOENT'});
}

test('publishes the exact verified bytes and leaves no partial asset', async t => {
  const f = await fixture(t);
  await publishVideo(f.root, f.output, {localSource:f.localSource});
  assert.deepEqual(await fs.readFile(f.destination), f.bytes);
  await absent(f.destination + '.partial');
  assert.deepEqual(await fs.readdir(path.dirname(f.destination)), [f.spec.file]);
});

for (const failure of ['hash mismatch', 'truncation', 'oversize']) {
  test(`rejects ${failure}; neither final nor partial asset is publishable`, async t => {
    const f = await fixture(t, failure === 'hash mismatch' ? {sha256:'0'.repeat(64)} : {});
    if (failure === 'truncation') await fs.writeFile(f.localSource, f.bytes.subarray(0, -1));
    if (failure === 'oversize') await fs.appendFile(f.localSource, '!');
    await assert.rejects(publishVideo(f.root, f.output, {localSource:f.localSource}), /integrity verification|exceeds its pinned size/);
    await absent(f.destination);
    await absent(f.destination + '.partial');
  });
}

test('a failed update does not replace an already verified destination', async t => {
  const f = await fixture(t);
  await publishVideo(f.root, f.output, {localSource:f.localSource});
  await fs.writeFile(f.localSource, Buffer.alloc(f.bytes.length));
  await assert.rejects(publishVideo(f.root, f.output, {localSource:f.localSource}), /integrity verification/);
  assert.deepEqual(await fs.readFile(f.destination), f.bytes);
  await absent(f.destination + '.partial');
});

test('refuses traversal, unpinned hashes and invalid sizes before creating output', async t => {
  for (const overrides of [
    {file:'../outside.mp4'}, {file:'..\\outside.mp4'}, {file:'/outside.mp4'},
    {file:'video.mp4.partial'}, {sha256:'invalid'}, {bytes:0}, {bytes:1.5},
  ]) {
    const f = await fixture(t, overrides);
    await assert.rejects(publishVideo(f.root, f.output, {localSource:f.localSource}), /Invalid video publication manifest/);
    await absent(f.output);
  }
});

test('accepts only the pinned GitHub presentation release URL, even with local input', async t => {
  for (const url of [
    'http://github.com/floxcristian/pos-architecture/releases/download/v2/pos-video-v2.mp4',
    'https://example.test/floxcristian/pos-architecture/releases/download/v2/pos-video-v2.mp4',
    'https://github.com/other/repository/releases/download/v2/pos-video-v2.mp4',
    'https://github.com/floxcristian/pos-architecture/releases/download/v2/other.mp4',
    'https://github.com/floxcristian/pos-architecture/releases/download/v2/pos-video-v2.mp4?token=example',
    'https://github.com/floxcristian/pos-architecture/releases/download/v2/pos-video-v2.mp4#hash',
    'https://user:password@github.com/floxcristian/pos-architecture/releases/download/v2/pos-video-v2.mp4',
  ]) {
    const f = await fixture(t, {url});
    await assert.rejects(publishVideo(f.root, f.output, {localSource:f.localSource}), /Video must come from the public presentation release/);
    await absent(f.output);
  }
});

test('missing source and directory input fail without leaving media files', async t => {
  const f = await fixture(t);
  for (const localSource of [path.join(f.root, 'missing.mp4'), f.root]) {
    await assert.rejects(publishVideo(f.root, f.output, {localSource}));
    await absent(f.destination);
    await absent(f.destination + '.partial');
  }
});

test('the network path verifies streamed bytes instead of trusting HTTP success', async t => {
  const f = await fixture(t);
  const originalFetch = globalThis.fetch;
  t.after(() => { globalThis.fetch = originalFetch; });
  const requests = [];
  globalThis.fetch = async (url, options) => {
    requests.push({url, signal:options.signal});
    return new Response(f.bytes);
  };
  await publishVideo(f.root, f.output, {localSource:null});
  assert.equal(requests[0].url, f.spec.url);
  assert.ok(requests[0].signal instanceof AbortSignal);
  assert.deepEqual(await fs.readFile(f.destination), f.bytes);

  globalThis.fetch = async () => new Response(Buffer.alloc(f.bytes.length));
  await assert.rejects(publishVideo(f.root, f.output, {localSource:null}), /integrity verification/);
  assert.deepEqual(await fs.readFile(f.destination), f.bytes);
  await absent(f.destination + '.partial');
});

test('HTTP errors never become public videos', async t => {
  const f = await fixture(t);
  const originalFetch = globalThis.fetch;
  t.after(() => { globalThis.fetch = originalFetch; });
  globalThis.fetch = async () => new Response('Not found', {status:404});
  await assert.rejects(publishVideo(f.root, f.output, {localSource:null}), /HTTP 404/);
  await absent(f.destination);
  await absent(f.destination + '.partial');
});
