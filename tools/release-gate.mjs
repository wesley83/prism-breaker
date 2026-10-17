import fs from 'node:fs/promises';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {spawnSync} from 'node:child_process';
import {pathToFileURL} from 'node:url';
import {buildPwa} from './build-pwa.mjs';
import {ROOT,filesUnder,checkRepository} from './repository-check.mjs';
import {checkRequirements} from './requirements-check.mjs';
const sha=b=>createHash('sha256').update(b).digest('hex');
export const RECEIPT='test-results/release-gate.json';
function git(root,args){const r=spawnSync('git',['-c','safe.directory='+root.replaceAll('\\','/'),...args],{cwd:root,encoding:'utf8'});if(r.status!==0)throw Error('Release gate needs a readable Git checkout');return r.stdout.trim();}
export async function sourceIdentity(root=ROOT){
 const actualRoot=path.resolve(git(root,['rev-parse','--show-toplevel'])),expectedRoot=path.resolve(root),sameRoot=process.platform==='win32'?actualRoot.toLowerCase()===expectedRoot.toLowerCase():actualRoot===expectedRoot;
 if(!sameRoot)throw Error('Run release checks from the Prism Breaker Git checkout, not its outer authoring mirror or a parent repository.');
 const top=await fs.readdir(root),controls=top.filter(n=>n.endsWith('.md')||['.gitattributes','.gitignore','bunfig.toml'].includes(n));
 const files=[...await filesUnder(root,'public'),...await filesUnder(root,'tools'),...await filesUnder(root,'tests'),...await filesUnder(root,'review'),...await filesUnder(root,'.github'),...controls,'package.json','bun.lock'].sort();
 const hashes=[];for(const file of files)hashes.push([file,sha(await fs.readFile(path.join(root,file)))]);
 return {commit:git(root,['rev-parse','HEAD']),digest:sha(JSON.stringify(hashes)),files:hashes.length,dirty:!!git(root,['status','--porcelain','--untracked-files=all','--','public','tools','tests','review','.github',...controls,'package.json','bun.lock'])};
}
export function validateReceipt(receipt,{identity,release,now=Date.now()}){
 if(identity.dirty)throw Error('Commit release inputs before approval or deployment.');
 if(receipt?.schema!==1||receipt.passed!==true||receipt.identity?.commit!==identity.commit||receipt.identity?.digest!==identity.digest||receipt.release!==release)throw Error('Missing or stale release evidence. Run bun run release:check after committing the exact source.');
 const age=now-Date.parse(receipt.completedAt);if(!Number.isFinite(age)||age<0||age>86400000)throw Error('Release evidence expired. Run bun run release:check.');
 if(!receipt.checks?.suite||!receipt.checks?.pwa||!receipt.checks?.repository||!receipt.checks?.requirements)throw Error('Incomplete release checks');return true;
}
export async function assertReleaseGate({root=ROOT,now=Date.now()}={}){
 const pwa=await buildPwa({root,check:true}),identity=await sourceIdentity(root);await checkRequirements({root});
 const receipt=JSON.parse(await fs.readFile(path.join(root,RECEIPT),'utf8').catch(()=>'{"passed":false}'));
 validateReceipt(receipt,{identity,release:pwa.version,now});return {commit:identity.commit,sourceDigest:identity.digest,release:pwa.version,completedAt:receipt.completedAt};
}
export async function runReleaseGate({root=ROOT,runSuite}={}){
 // Invalidate prior approval first, including when the next suite/build fails.
 await fs.mkdir(path.join(root,'test-results'),{recursive:true});await fs.writeFile(path.join(root,RECEIPT),JSON.stringify({schema:1,passed:false}));
 const before=await sourceIdentity(root),pwa=await buildPwa({root,check:true}),repository=await checkRepository({root});
 if(before.dirty)throw Error('Commit release inputs before generating approval.');
 const result=runSuite?await runSuite():spawnSync(process.execPath,['test','./tests'],{cwd:root,encoding:'utf8',timeout:120000,maxBuffer:16*1024*1024});
 await fs.writeFile(path.join(root,'test-results/release-tests.txt'),String(result.stdout||'')+String(result.stderr||''));
 if(result.status!==0)throw Error('Behavioral suite failed; no release approved. See test-results/release-tests.txt');
 const requirements=await checkRequirements({root}),after=await sourceIdentity(root);if(JSON.stringify(before)!==JSON.stringify(after))throw Error('Source changed during release checks; rerun.');
 const receipt={schema:1,passed:true,completedAt:new Date().toISOString(),identity:after,release:pwa.version,checks:{suite:true,pwa:true,repository:true,requirements:true},repository,requirements,limits:['Automated local evidence only; physical devices, independent review and platform contracts require separate acceptance records.']};
 await fs.writeFile(path.join(root,RECEIPT),JSON.stringify(receipt,null,2)+'\n');return receipt;
}
if(process.argv[1]&&import.meta.url===pathToFileURL(path.resolve(process.argv[1])).href){try{console.log(JSON.stringify(await runReleaseGate()));}catch(e){console.error(e.message);process.exitCode=1;}}
