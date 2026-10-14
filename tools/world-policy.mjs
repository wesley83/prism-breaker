import fs from 'node:fs/promises';
import {readWorldCatalog} from './read-world-catalog.mjs';
export async function worldPolicy({paths}={}){
 const {entries}=await readWorldCatalog();
 const resources=paths||entries.map(w=>'/worlds/'+w.slug+'/definition.html');
 const source=(await fs.readFile('public/world-schema.js','utf8')).replace(/\bexport /g,'');
 const guard=source+'\n'+[
  'export default function(ctx){',
  " const reject=(status,message)=>{throw {schema_url:'https://pagelove.org/HTTPResponse',status,body:message};};",
  " if(ctx.request.method!=='PUT')reject(405,'Worlds require a complete conditional PUT.');",
  " const headers=ctx.request.headers||{},get=name=>headers[name]??headers[name.toLowerCase()]??headers.get?.(name);",
  " if(get('Range'))reject(422,'Partial world writes are not supported.');",
  " if(!get('If-Match')&&get('If-None-Match')!=='*')reject(428,'A world revision condition is required.');",
  " const body=String(ctx.request.body||'');if(body.length>1000000)reject(413,'World document is too large.');",
  ' try{const world=parseWorld(body);',
  ' const allowed='+JSON.stringify(resources)+";if(!allowed.includes(ctx.request.path))reject(422,'Unknown world resource.');",
  paths?'':" if(ctx.request.path!=='/worlds/'+world.slug+'/definition.html')reject(422,'World identity does not match its path.');",
  " if(body.trim()!==worldDocument(world))reject(422,'Publish canonical validated world HTML.');",
  " }catch(error){if(error.schema_url)throw error;reject(422,'Invalid world definition.');}",
  ' return true;',
  '}'
 ].join('\n');
 const html='<!doctype html><html lang="en"><head><meta charset="utf-8"><title>World write policy</title></head><body><h1>World write policy</h1><p>Owner authorization, complete validation and conditional replacement.</p><div hidden itemscope itemtype="https://pagelove.org/Trigger">'+resources.map(resource=>'<meta itemprop="resource" content="'+resource+'">').join('')+['PUT','POST','PATCH','DELETE'].map(method=>'<meta itemprop="method" content="'+method+'">').join('')+'<div itemprop="action" itemscope itemtype="https://pagelove.org/JavaScript/Module"><script type="module" itemprop="source">'+guard.replace(/<\/script/gi,'<\\/script')+'</script></div></div></body></html>';
 return {html,guard};
}
