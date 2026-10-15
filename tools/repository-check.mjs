import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';
export const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
export async function filesUnder(root,folder){
 const result=[];for(const entry of await fs.readdir(path.join(root,folder),{withFileTypes:true}).catch(e=>{if(e.code==='ENOENT')return [];throw e;})){
  const name=path.posix.join(folder,entry.name);if(entry.isDirectory())result.push(...await filesUnder(root,name));else if(entry.isFile())result.push(name);else throw Error('Unsupported repository entry: '+name);
 }return result.sort();
}
// Bounded detection of credential formats used here; not an exhaustive secret scanner.
const credentials=[/\bpk_[a-f0-9]{32,}\b/i,/\bgh[pousr]_[A-Za-z0-9]{30,}\b/,/\bgithub_pat_[A-Za-z0-9_]{40,}\b/,/-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/];
export async function checkRepository({root=ROOT}={}){
 const docs=(await fs.readdir(root)).filter(n=>n.endsWith('.md')),issues=[],links=[];
 for(const file of docs){const text=await fs.readFile(path.join(root,file),'utf8');
  for(const m of text.matchAll(/\]\((<[^>]+>|[^\s)]+)(?:\s+"[^"]*")?\)/g)){
   const value=m[1].replace(/^<|>$/g,'');if(/^(?:[a-z][a-z0-9+.-]*:|#)/i.test(value))continue;
   let target;try{target=decodeURIComponent(value.split(/[?#]/)[0]);}catch{issues.push(file+': malformed link');continue;}
   let exists=true;try{await fs.access(path.resolve(root,path.dirname(file),target));}catch{exists=false;}
   links.push({file,target,exists});if(!exists)issues.push(file+': missing '+target);
  }
 }
 const sources=[...await filesUnder(root,'public'),...await filesUnder(root,'tools'),...await filesUnder(root,'tests'),...await filesUnder(root,'review'),...await filesUnder(root,'.github'),...(await filesUnder(root,'audit')).filter(n=>/\.(?:md|json|patch|txt)$/.test(n)),...docs,'package.json','bun.lock'];
 for(const file of sources){const text=await fs.readFile(path.join(root,file),'utf8');if(credentials.some(pattern=>pattern.test(text)))issues.push(file+': credential pattern found (value suppressed)');}
 for(const file of sources.filter(n=>n.startsWith('public/')&&n.endsWith('.js')&&!n.startsWith('public/vendor/'))){
  const text=await fs.readFile(path.join(root,file),'utf8');
  for(const m of text.matchAll(/(?:\bfrom\s*|\bimport\s*(?:\(\s*)?)['"]([^'"]+)['"]/g)){
   if(!m[1].startsWith('.'))continue;try{await fs.access(path.resolve(root,path.dirname(file),m[1].split('?')[0]));}catch{issues.push(file+': missing module '+m[1]);}
  }
 }
 if(issues.length)throw Error('Repository checks failed:\n'+issues.join('\n'));
 return {documents:docs.length,localLinks:links.length,scannedFiles:sources.length,secretScan:'limited high-confidence credential patterns'};
}
if(process.argv[1]&&import.meta.url===pathToFileURL(path.resolve(process.argv[1])).href){try{console.log(JSON.stringify(await checkRepository()));}catch(e){console.error(e.message);process.exitCode=1;}}
