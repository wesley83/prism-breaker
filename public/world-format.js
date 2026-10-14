// Compatibility adapters; build tools import world-schema directly.
import {BUNDLED_WORLDS} from './bundled-worlds.js';
import {parseWorld as parseDocument,normalizeWorld as normalizeDocument,worldHTML,worldDocument,validateWorld,THEMES} from './world-schema.js';
export {worldHTML,worldDocument,validateWorld,THEMES};
export {BASE_TYPES,EFFECTS} from './world-schema.js';
export const WORLD_SLUGS=BUNDLED_WORLDS.map(w=>w.slug);
export const worldSlug=index=>BUNDLED_WORLDS[index]?.slug;
export function originalWorld(index){if(!BUNDLED_WORLDS[index])throw Error('Unknown world');const {revision,legacyIndex,...world}=BUNDLED_WORLDS[index];return structuredClone(world);}
function attachIdentity(world){const index=WORLD_SLUGS.indexOf(world.slug);if(index<0||BUNDLED_WORLDS[index].id!==world.id)throw Error('Unknown world identity');return {...world,index};}
export function normalizeWorld(input){
 let world=structuredClone(input);
 if(world.schemaVersion===undefined){const original=BUNDLED_WORLDS.find(w=>w.slug===world.slug);if(!original||world.index!==undefined&&world.index!==original.legacyIndex)throw Error('Legacy world identity does not match its path');world={...structuredClone(original),...world,schemaVersion:2,id:original.id};}
 delete world.revision;delete world.legacyIndex;delete world.root;return attachIdentity(normalizeDocument(world));
}
export function parseWorld(input,options={}){
 const Parser=options.Parser||globalThis.DOMParser;
 if(typeof input==='string'&&input.length>1000000)throw Error('World file is too large');
 const root=typeof input==='string'?new Parser().parseFromString(input,'text/html').querySelector('#world'):input?.cloneNode(true);
 if(!root)throw Error('No structured world found');
 if(!root.querySelector(':scope > meta[itemprop="schemaVersion"]')){
  const slug=root.querySelector(':scope > meta[itemprop="slug"]')?.getAttribute('content'),original=BUNDLED_WORLDS.find(w=>w.slug===slug);
  if(!original)throw Error('Unknown legacy world');
  const legacy=root.querySelector(':scope > meta[itemprop="index"]');if(legacy&&Number(legacy.getAttribute('content'))!==original.legacyIndex)throw Error('Legacy world identity does not match its path');legacy?.remove();
  for(const key of ['schemaVersion','id','tag','story','mechanic','shape','music','sky','accent','colors']){const meta=root.ownerDocument.createElement('meta');meta.setAttribute('itemprop',key);meta.setAttribute('content',key==='colors'?original.colors.join(' '):String(original[key]));root.append(meta);}
 }
 return attachIdentity(parseDocument(root,options));
}
export function formationCatalog(world){const valid=normalizeWorld(world);return new Map(valid.formations.map(f=>[valid.index+':'+f.phase,{...structuredClone(f),types:structuredClone(valid.types),world:valid}]));}
