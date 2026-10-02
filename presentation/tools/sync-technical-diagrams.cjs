/* Copy the five selected Mermaid views from the reviewed architecture document. */
'use strict';
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'../..');
const source=fs.readFileSync(path.join(root,'docs/vistas-arquitectura-y-flujos.md'),'utf8');
const blocks=[...source.matchAll(/```mermaid\s*\r?\n([\s\S]*?)```/g)].map(m=>m[1].trim()+'\n');
const names=['technical-deployment','technical-sale','technical-sync','technical-continuity','technical-erp-state'];
if(blocks.length!==6)throw new Error('Expected exactly six documented views V01–V06; review the extraction before copying.');
names.forEach((name,index)=>fs.writeFileSync(path.join(root,'presentation/diagrams',name+'.mmd'),blocks[index]));
console.log('Copied V01–V05 to presentation/diagrams/. V06 remains linked in the ERP cutover case.');
