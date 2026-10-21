'use strict';
const fs = require('node:fs');
const path = require('node:path');
const {SNAPSHOT, validateDocumentation, synchronizeDerivatives} = require('../presentation/tools/documentation.cjs');
const args = process.argv.slice(2);
const root = path.resolve(__dirname, '..');
if (args.length === 1 && args[0] === '--check') {
  console.log(synchronizeDerivatives({root, check: true}));
} else if (args.length === 2 && args[0] === '--artifact') {
  const snapshot = validateDocumentation(JSON.parse(fs.readFileSync(path.resolve(args[1]), 'utf8')));
  fs.writeFileSync(path.join(root, SNAPSHOT), JSON.stringify(snapshot, null, 2) + '\n');
  console.log(synchronizeDerivatives({root, check: false, snapshot}));
} else {
  throw new Error('Usage: node tools/sync-documentation.cjs --check | --artifact <clean-pos-platform-build/documentation.snapshot.json>');
}
