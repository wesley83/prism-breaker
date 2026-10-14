import fs from 'node:fs/promises';
import {WORLD_SLUGS,originalWorld,worldDocument} from '../public/world-format.js';

// Existing resources are authorable data, never silently reset by a normal build.
for(let i=0;i<WORLD_SLUGS.length;i++){
 const dir='public/worlds/'+WORLD_SLUGS[i];await fs.mkdir(dir,{recursive:true});
 try{await fs.writeFile(dir+'/definition.html',worldDocument(originalWorld(i)).replaceAll('><','>\n<'),{flag:'wx'});}catch(e){if(e.code!=='EEXIST')throw e;}
}
const includes=WORLD_SLUGS.map(slug=>'<p:include resource="/worlds/'+slug+'/definition.html" selector="#world"></p:include>').join('\n');
await fs.writeFile('public/worlds.html','<!doctype html><html lang="en" xmlns:p="https://pagelove.org/1.0"><head><meta charset="utf-8"><meta name="robots" content="noindex"><title>Prism Breaker structured worlds</title></head><body><main id="worlds">'+includes+'</main></body></html>');
console.log('Prepared 16 structured world resources; existing definitions preserved.');
