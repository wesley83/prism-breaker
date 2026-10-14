import fs from 'node:fs/promises';
import {DOMParser} from 'linkedom';
import {parseWorld} from '../public/world-schema.js';
import {readWorldCatalog} from './read-world-catalog.mjs';
const {entries}=await readWorldCatalog();
// Documents are source. Missing source is an error, never recreated from an old bundle.
for(const {slug} of entries)parseWorld(await fs.readFile('public/worlds/'+slug+'/definition.html','utf8'),{Parser:DOMParser,expectedSlug:slug});
const includes=entries.map(({slug})=>'<p:include resource="/worlds/'+slug+'/definition.html" selector="#world"></p:include>').join('\n');
await fs.writeFile('public/worlds.html','<!doctype html><html lang="en" xmlns:p="https://pagelove.org/1.0"><head><meta charset="utf-8"><meta name="robots" content="noindex"><title>Prism Breaker structured worlds</title></head><body><main id="worlds">'+includes+'</main></body></html>');
console.log('Validated world sources and generated native composition.');
