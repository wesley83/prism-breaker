import fs from 'node:fs/promises';
import {DOMParser} from 'linkedom';
import {WORLD_SLUGS,parseWorld} from '../public/world-format.js';
const formations=[];
for(const slug of WORLD_SLUGS){
 const world=parseWorld(await fs.readFile('public/worlds/'+slug+'/definition.html','utf8'),{expectedSlug:slug,Parser:DOMParser});
 if(world.types.length||world.formations.some(f=>f.bricks.some(b=>b.customType)))throw Error('Custom recipe types belong to shared Practice, not the official release snapshot: '+slug);
 formations.push(world.formations.map(({bricks,barriers,portals})=>({bricks,barriers,portals})));
}
await fs.writeFile('public/bundled-worlds.js','// Generated from the checked-in microdata world documents. Do not edit by hand.\nexport const BUNDLED_FORMATIONS = '+JSON.stringify(formations)+';\n');
console.log('Built the official offline formations from HTML world documents.');
