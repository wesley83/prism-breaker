import fs from 'node:fs/promises';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {pathToFileURL} from 'node:url';
import {DOMParser} from 'linkedom';
import {ROOT,filesUnder} from './repository-check.mjs';
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
export async function runtimeIdentity(root=ROOT){const inputs=await Promise.all((await filesUnder(root,'public')).map(async file=>[file,sha(await fs.readFile(path.join(root,file)))]));return {runtimeDigest:sha(JSON.stringify(inputs)),inputs};}
export function validateRequirements(plan,record,identity){
 const doc=new DOMParser().parseFromString(plan,'text/html'),root=doc.querySelector('#requirements[data-version="1"]');if(!root)throw Error('Missing requirement inventory');
 const rows=[...root.querySelectorAll('[itemtype="urn:PrismBreaker:Requirement"]')],ids=new Set();if(!rows.length)throw Error('Empty requirement inventory');
 for(const row of rows){if(!row.id||ids.has(row.id)||!['browser','suite','artifact'].includes(row.dataset.kind))throw Error('Invalid/duplicate requirement');ids.add(row.id);
  if(row.dataset.kind==='browser'){
   if(record?.schema!==1||record.runtimeDigest!==identity.runtimeDigest||record.planSha256!==sha(plan)||!record.environment||!Number.isFinite(Date.parse(record.utc)))throw Error('Missing or stale browser acceptance evidence');
   if(record.cases?.[row.id]?.passed!==true||record.failure||record.performanceFailure)throw Error('Missing or failed required evidence: '+row.id);
  }
 }
 return {requirements:rows.length,browser:rows.filter(row=>row.dataset.kind==='browser').map(row=>row.id)};
}
export async function checkRequirements({root=ROOT}={}){
 const plan=await fs.readFile(path.join(root,'review/requirements.html'),'utf8'),doc=new DOMParser().parseFromString(plan,'text/html');
 for(const meta of doc.querySelectorAll('[itemprop="artifact"]')){const name=meta.getAttribute('content');if(!name||name.includes('..')||path.isAbsolute(name))throw Error('Invalid requirement artifact');await fs.access(path.join(root,name)).catch(()=>{throw Error('Missing required artifact: '+name);});}
 const identity=await runtimeIdentity(root);let record;try{record=JSON.parse(await fs.readFile(path.join(root,'review/evidence/handbook-browser.json'),'utf8'));}catch{}
 const result=validateRequirements(plan,record,identity);if(result.browser.length){const fixture=Buffer.concat([await fs.readFile(path.join(root,'tools/handbook-browser-fixture.mjs')),await fs.readFile(path.join(root,'tools/visual-audit.mjs'))]);if(record?.fixtureSha256!==sha(fixture))throw Error('Browser evidence belongs to an older fixture');}
 return {...result,runtimeDigest:identity.runtimeDigest,receiptSha256:record?sha(JSON.stringify(record)):null,limits:record?.limits??[]};
}
if(process.argv[1]&&import.meta.url===pathToFileURL(path.resolve(process.argv[1])).href){try{console.log(JSON.stringify(await checkRequirements()));}catch(error){console.error(error.message);process.exitCode=1;}}
