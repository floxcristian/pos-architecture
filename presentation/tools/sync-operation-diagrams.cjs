/* Canonical operational comparisons: current/proposed, O01 through O04. */
'use strict';
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'../..');
const source=fs.readFileSync(path.join(root,'docs/operacion-caja-y-evolucion.md'),'utf8');
const blocks=[...source.matchAll(/```mermaid\s*\r?\n([\s\S]*?)```/g)].map(m=>m[1].trim()+'\n');
const names=['session','price','print','delivery'].flatMap(name=>['current','proposed'].map(mode=>`operation-${name}-${mode}`));
if(blocks.length!==names.length)throw new Error('Expected eight operational diagrams O01–O04, current then proposed.');
names.forEach((name,i)=>fs.writeFileSync(path.join(root,'presentation/diagrams',name+'.mmd'),blocks[i]));
console.log('Copied eight operational diagrams from their reviewed document.');
