import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs/promises';import {spawnSync} from 'node:child_process';import {DOMParser} from 'linkedom';import {ROOT} from '../tools/repository-check.mjs';
test('R14 generated previews opt into current network assets before loading their application graph',async()=>{
 for(const tool of ['tools/make-qa.mjs','tools/review-browser-fixture.mjs']){const result=spawnSync(process.execPath,[tool],{cwd:ROOT,encoding:'utf8'});assert.equal(result.status,0,result.stderr);}
 for(const [name,entry]of [['index.html','/__qa/app.js'],['acceptance.html','/__qa/acceptance-app.js'],['reviews.html','/__qa/review-app.js']]){
  const html=await fs.readFile(new URL('../test-results/fixture/'+name,import.meta.url),'utf8'),doc=new DOMParser().parseFromString(html,'text/html'),script=doc.querySelector('script[data-qa-entry]');assert.ok(script);assert.equal(script.getAttribute('src'),'/__qa/network-bootstrap.js');assert.equal(script.getAttribute('data-qa-entry'),entry);
 }
 const bootstrap=await fs.readFile(new URL('../test-results/fixture/network-bootstrap.js',import.meta.url),'utf8');assert.ok(bootstrap.indexOf("version:'network'")<bootstrap.indexOf('await import(entry)'));
});
