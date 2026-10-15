import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {DOMParser} from 'linkedom';
import {sha256} from './immutable-release.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
export async function acceptancePlan(){
 const bytes=await fs.readFile(path.join(root,'review/acceptance-plan.html'));
 const doc=new DOMParser().parseFromString(bytes.toString(),'text/html');
 return {sha256:sha256(bytes),checks:[...doc.querySelectorAll('[itemtype="urn:PrismBreaker:AcceptanceCheck"]')].map(n=>({id:n.querySelector('[itemprop="id"]').content,title:n.querySelector('[itemprop="title"]').textContent,environment:n.querySelector('[itemprop="environment"]').content}))};
}
export function reviewStatus(plan,record,release){
 if(record.schema!==1||record.planSha256!==plan.sha256||record.release!==release)throw Error('Acceptance record belongs to a different plan/release');
 const ids=new Set(plan.checks.map(c=>c.id)),seen=new Set(),counts={pass:0,fail:0,'not-run':0,blocked:0};
 for(const c of record.checks){
  if(!ids.has(c.id)||seen.has(c.id)||!Object.hasOwn(counts,c.status))throw Error('Unknown, duplicate or invalid acceptance check');seen.add(c.id);
  if(c.status==='pass'||c.status==='fail'){
   if(c.observed!==true||!c.actor||/codex|agent|automation|bot/i.test(c.actor)||!c.environment||!Number.isFinite(Date.parse(c.observedAt))||!Array.isArray(c.evidence)||!c.evidence.length||!c.notes?.trim())throw Error('Observed human/device result requires named reviewer, actual environment, UTC date, notes and evidence');
   if(c.id.startsWith('android-')||c.id.startsWith('ios-'))if(c.physicalDevice!==true||!c.osVersion||!c.browserVersion)throw Error('Physical-device result requires actual hardware and OS/browser versions');
  }
  counts[c.status]++;
 }
 if(seen.size!==ids.size)throw Error('Missing acceptance checks');
 return {release,counts,complete:counts.pass===ids.size,limits:'Records assert observed outcomes; this validator does not attest hardware or independently verify a reviewer.'};
}
export async function pendingRecord(){
 const plan=await acceptancePlan(),worker=await fs.readFile(path.join(root,'public/sw.js'),'utf8'),release=worker.match(/const VERSION = "([a-f0-9]{20})"/)?.[1];
 if(!release)throw Error('Build the game first');
 return {schema:1,planSha256:plan.sha256,release,createdAt:new Date().toISOString(),checks:plan.checks.map(c=>({...c,status:'not-run',reason:'No physical devices or independent reviewer available, confirmed by Wesley October 15, 2026.'}))};
}
if(process.argv[1]&&import.meta.url===pathToFileURL(path.resolve(process.argv[1])).href){
 try{
  const record=await pendingRecord(),file=path.resolve(process.argv[3]||path.join(root,'.private/acceptance/'+record.release+'.json'));
  if(process.argv[2]==='init'){
   await fs.mkdir(path.dirname(file),{recursive:true});await fs.writeFile(file,JSON.stringify(record,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify({created:file,release:record.release,checks:record.checks.length,status:'not-run'}));
  }else if(process.argv[2]==='report')console.log(JSON.stringify(reviewStatus(await acceptancePlan(),JSON.parse(await fs.readFile(file,'utf8')),record.release)));
  else throw Error('Use init [private-record.json] or report [private-record.json]. Records are never uploaded automatically.');
 }catch(error){console.error(error.message);process.exitCode=1;}
}
