#!/usr/bin/env node
'use strict';

// Maintenance tool only: the presentation and Vercel build use checked-in assets.
// The lock records immutable upstream commits, original byte lengths and SHA-256.
const fs = require('node:fs/promises');
const path = require('node:path');
const { createHash } = require('node:crypto');

const destination = path.resolve(__dirname, '../vendor/reveal');
const lockPath = path.resolve(__dirname, 'vendor/reveal.lock.json');
const allowedHosts = new Set(['raw.githubusercontent.com']);

function verify(file, bytes) {
  const actual = createHash('sha256').update(bytes).digest('hex');
  if (bytes.length !== file.bytes || actual !== file.sha256) {
    throw new Error(`Integrity mismatch: ${file.path}`);
  }
}

function targetPath(relative) {
  const target = path.resolve(destination, relative);
  if (!target.startsWith(`${destination}${path.sep}`)) {
    throw new Error(`Invalid vendor path: ${relative}`);
  }
  return target;
}

async function main() {
  const args = process.argv.slice(2);
  if (args.length > 1 || (args.length === 1 && args[0] !== '--check')) {
    throw new Error('Usage: node presentation/tools/vendor-reveal.cjs [--check]');
  }
  const lock = JSON.parse(await fs.readFile(lockPath, 'utf8'));
  if (args[0] === '--check') {
    for (const file of lock.files) {
      verify(file, await fs.readFile(targetPath(file.path)));
    }
    console.log(`Verified ${lock.files.length} upstream assets: ${lock.name} ${lock.version}.`);
    return;
  }

  const downloads = await Promise.all(lock.files.map(async (file) => {
    const url = new URL(file.source);
    if (url.protocol !== 'https:' || !allowedHosts.has(url.hostname)) {
      throw new Error(`Unexpected upstream source: ${file.source}`);
    }
    const response = await fetch(url, { redirect: 'error', signal: AbortSignal.timeout(30000) });
    if (!response.ok) throw new Error(`Download failed (${response.status}): ${file.path}`);
    const bytes = Buffer.from(await response.arrayBuffer());
    verify(file, bytes);
    return { file, bytes };
  }));

  // Verify the complete set before replacing any checked-in asset.
  for (const { file, bytes } of downloads) {
    const target = targetPath(file.path);
    await fs.mkdir(path.dirname(target), { recursive: true });
    await fs.writeFile(target, bytes);
  }
  console.log(`Downloaded and verified ${lock.files.length} upstream assets: ${lock.name} ${lock.version}.`);
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
