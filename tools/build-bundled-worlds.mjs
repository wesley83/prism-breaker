import fs from 'node:fs/promises';
import {DOMParser} from 'linkedom';
import {createHash} from 'node:crypto';
import {parseWorld,worldHTML} from '../public/world-schema.js';
import {readWorldCatalog} from './read-world-catalog.mjs';
import {ENGAGEMENT_REVISION} from '../public/engagement-data.js';
const hash=value=>createHash('sha256').update(value).digest('hex');
const {ruleset,entries}=await readWorldCatalog(),worlds=[];
for(const entry of entries){
 const world=parseWorld(await fs.readFile('public/worlds/'+entry.slug+'/definition.html','utf8'),{expectedSlug:entry.slug,Parser:DOMParser});
 if(world.id!==entry.id)throw Error('Catalog identity mismatch');
 if(world.types.length||world.formations.some(f=>f.bricks.some(b=>b.customType)))throw Error('Custom recipes belong to shared Practice, not the official snapshot: '+entry.slug);
 worlds.push({...world,...entry,revision:hash(worldHTML(world))});
}
const revision=hash(JSON.stringify({ruleset,engagement:ENGAGEMENT_REVISION,worlds:worlds.map(w=>({id:w.id,formations:w.formations.map(({phase,bricks,barriers,portals})=>({phase,bricks,barriers,portals}))}))}));
await fs.writeFile('public/bundled-worlds.js','// Generated from world-catalog.html and world definitions. Do not edit.\nexport const RULESET_REVISION='+JSON.stringify(revision)+';\nexport const BUNDLED_WORLDS='+JSON.stringify(worlds)+';\nexport const BUNDLED_FORMATIONS=BUNDLED_WORLDS.map(w=>w.formations.map(({bricks,barriers,portals})=>({bricks,barriers,portals})));\n');
console.log('Built '+worlds.length+' complete worlds from HTML. Ruleset '+revision);
