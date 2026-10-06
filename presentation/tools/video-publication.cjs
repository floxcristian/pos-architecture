'use strict';
const fs = require('node:fs');
const path = require('node:path');
const {createHash} = require('node:crypto');
const {Readable, Transform} = require('node:stream');
const {pipeline} = require('node:stream/promises');

/** Materialize the pinned release asset as a same-origin static video. */
async function publishVideo(root, output, {localSource = process.env.POS_VIDEO_SOURCE} = {}) {
  const spec = JSON.parse(fs.readFileSync(path.join(root, 'video/publication.json'), 'utf8'));
  if (!/^[a-z0-9-]+\.mp4$/.test(spec.file) || !/^[a-f0-9]{64}$/.test(spec.sha256) ||
      !Number.isSafeInteger(spec.bytes) || spec.bytes <= 0) throw new Error('Invalid video publication manifest');
  const url = new URL(spec.url);
  if (url.protocol !== 'https:' || url.hostname !== 'github.com' || url.search || url.hash ||
      url.username || url.password ||
      !url.pathname.startsWith('/floxcristian/pos-architecture/releases/download/') ||
      !url.pathname.endsWith('/' + spec.file)) throw new Error('Video must come from the public presentation release');

  const directory = path.join(output, 'media');
  fs.mkdirSync(directory, {recursive: true});
  const destination = path.join(directory, spec.file);
  const temporary = destination + '.partial';
  const digest = createHash('sha256');
  let bytes = 0;
  const verify = new Transform({transform(chunk, encoding, callback) {
    bytes += chunk.length;
    if (bytes > spec.bytes) return callback(new Error('Video exceeds its pinned size'));
    digest.update(chunk);
    callback(null, chunk);
  }});

  try {
    let source;
    if (localSource) {
      const absolute = path.resolve(localSource);
      if (!fs.statSync(absolute).isFile()) throw new Error('POS_VIDEO_SOURCE must be a regular file');
      source = fs.createReadStream(absolute);
    } else {
      console.log(`Downloading published video revision ${spec.revision} (${spec.bytes} bytes).`);
      const response = await fetch(spec.url, {signal: AbortSignal.timeout(300_000)});
      if (!response.ok || !response.body) throw new Error(`Video download failed: HTTP ${response.status}`);
      source = Readable.fromWeb(response.body);
    }
    await pipeline(source, verify, fs.createWriteStream(temporary, {flags: 'wx'}));
    if (bytes !== spec.bytes || digest.digest('hex') !== spec.sha256) throw new Error('Video integrity verification failed');
    fs.renameSync(temporary, destination);
    console.log(`Published /media/${spec.file}: SHA-256 verified.`);
  } catch (error) {
    fs.rmSync(temporary, {force: true});
    throw error;
  }
}

module.exports = {publishVideo};
