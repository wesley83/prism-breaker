import fs from 'node:fs/promises';
import {DOMParser} from 'linkedom';
export async function readWorldCatalog(){
 const doc=new DOMParser().parseFromString(await fs.readFile('public/world-catalog.html','utf8'),'text/html');
 const root=doc.querySelector('#world-catalog[itemtype="urn:WorldCatalog"]');
 if(!root||root.querySelector('meta[itemprop="schemaVersion"]')?.content!=='2')throw Error('Unsupported world catalog');
 const ruleset=root.querySelector('meta[itemprop="ruleset"]')?.content;
 if(!/^[a-z0-9-]{1,64}$/.test(ruleset))throw Error('Invalid ruleset identity');
 const entries=[...root.querySelectorAll('[itemprop="world"]')].map((el,index)=>{
  const get=key=>el.querySelector('[itemprop="'+key+'"]')?.getAttribute('content');
  const id=get('id'),slug=get('slug'),legacyIndex=Number(get('legacyIndex'));
  if(!/^[a-z][a-z0-9-]{0,63}$/.test(id)||id!==slug||!Number.isSafeInteger(legacyIndex)||legacyIndex<0||el.querySelector('a[itemprop="definition"]')?.getAttribute('href')!=='/worlds/'+slug+'/definition.html')throw Error('Invalid world reference');
  return {id,slug,index,legacyIndex};
 });
 if(!entries.length||entries.length>64||new Set(entries.map(e=>e.id)).size!==entries.length||new Set(entries.map(e=>e.legacyIndex)).size!==entries.length)throw Error('Invalid or duplicate catalog identities');
 return {ruleset,entries};
}
