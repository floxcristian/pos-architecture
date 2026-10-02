/* Keep the five guided data journeys identical to their reviewed document. */
'use strict';
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const source = fs.readFileSync(path.join(root, 'docs/recorridos-datos-tablas.md'), 'utf8');
const blocks = [...source.matchAll(/```mermaid\s*\r?\n([\s\S]*?)```/g)].map(match => match[1].trim()+'\n');
const names = ['dataflow-sale','dataflow-upload','dataflow-masters','dataflow-customer','dataflow-credit'];
if (blocks.length !== names.length) throw new Error('Expected exactly five data journeys D01–D05; review extraction before copying.');
names.forEach((name,index) => fs.writeFileSync(path.join(root, 'presentation/diagrams', name+'.mmd'), blocks[index]));
console.log('Copied D01–D05 to presentation/diagrams/ from their reviewed document.');
