import test from 'node:test';import assert from 'node:assert/strict';import {DOMParser} from 'linkedom';
import fs from 'node:fs/promises';
import {WORLD_SLUGS,originalWorld,normalizeWorld,parseWorld,worldDocument,formationCatalog} from '../public/world-format.js';

test('all twenty formations survive a microdata HTML round trip',()=>{
 let count=0;for(let i=0;i<WORLD_SLUGS.length;i++){const original=normalizeWorld(originalWorld(i)),restored=parseWorld(worldDocument(original),{Parser:DOMParser,expectedSlug:WORLD_SLUGS[i]});assert.deepEqual(restored,original);count+=restored.formations.length;assert.equal(formationCatalog(restored).size,restored.formations.length);}assert.equal(count,20);
});
test('checked-in HTML geometry agrees with the generated official offline snapshot',async()=>{
 for(let i=0;i<WORLD_SLUGS.length;i++){const source=parseWorld(await fs.readFile(new URL('../public/worlds/'+WORLD_SLUGS[i]+'/definition.html',import.meta.url),'utf8'),{Parser:DOMParser,expectedSlug:WORLD_SLUGS[i]});assert.deepEqual(source.formations,normalizeWorld(originalWorld(i)).formations);}
});
test('custom types compose with armored moving bricks and retain their bounded recipe',()=>{
 const w=normalizeWorld(originalWorld(0)),b=w.formations[0].bricks[0];w.types.push({type:'urn:Brick:Custom:solar',name:'Solar flare',base:'armor',effect:'pulse',radius:3,points:150,duration:5,power:'wide'});Object.assign(b,{kind:'armor',maxHp:3,hp:3,moving:true,customType:w.types[0].type});assert.deepEqual(parseWorld(worldDocument(w),{Parser:DOMParser}),w);
});
test('basic Brick items inherit row coordinates and infer armor from hitpoints',()=>{
 let html=worldDocument(originalWorld(0));html=html.replace('itemtype="urn:Brick urn:Brick:Normal"','itemtype="urn:Brick"').replace('<meta itemprop="x" content="-5.79"><meta itemprop="y" content="9"><meta itemprop="width"','<meta itemprop="width"').replace('itemprop="hitpoints" content="1"','itemprop="hitpoints" content="2"');
 const b=parseWorld(html,{Parser:DOMParser}).formations[0].bricks[0];assert.equal(b.x,-5.79);assert.equal(b.y,9);assert.equal(b.kind,'armor');assert.equal(b.maxHp,2);
});
test('malformed identities, brick references, geometry and recipes are rejected',()=>{
 const w=originalWorld(0),html=worldDocument(w);
 assert.throws(()=>parseWorld(html,{Parser:DOMParser,expectedSlug:WORLD_SLUGS[1]}),/another world/);
 assert.throws(()=>parseWorld(html.replace('content="f0-row-0"','content="missing"'),{Parser:DOMParser}),/missing row/);
 const bad=structuredClone(w);bad.formations[0].bricks[0].x=12;assert.throws(()=>worldDocument(bad),/brick x/);
 bad.formations[0].bricks[0].x=0;bad.types=[{type:'urn:Brick:Custom:bad',name:'Bad',base:'normal',effect:'eval'}];assert.throws(()=>worldDocument(bad),/behavior/);
});
test('imported markup is rebuilt from records and cannot carry script or composition directives',()=>{
 const html=worldDocument(originalWorld(0)).replace('</section>','<script>globalThis.evil=true</script><p:include resource="/private" selector="body"></p:include></section>');const safe=worldDocument(parseWorld(html,{Parser:DOMParser}));assert.ok(!safe.includes('<script'));assert.ok(!safe.includes('p:include'));assert.ok(!safe.includes('/private'));
});
