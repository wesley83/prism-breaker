import {DOMParser} from 'linkedom';
import {sha256} from './immutable-release.mjs';
export function liveEntryIssues({html,manifestBytes,version,assets,homeStatus,manifestStatus}){
 const issues=[],doc=new DOMParser().parseFromString(html,'text/html'),immutable=assets.some(a=>a.url);
 if(homeStatus!==200)issues.push('Home unavailable');
 if(doc.querySelector('meta[name="prism-release"]')?.content!==version)issues.push('Home release mismatch');
 if(doc.querySelector('link[rel="manifest"]')?.getAttribute('href')!=='/manifest.webmanifest')issues.push('Manifest link missing');
 if(manifestStatus!==200)issues.push('Manifest unavailable');
 let manifest;try{manifest=JSON.parse(manifestBytes.toString());}catch{issues.push('Invalid manifest');}
 if(manifest&&(manifest.id!=='/'||manifest.scope!=='/'||manifest.display!=='fullscreen'))issues.push('Installed identity/fullscreen mismatch');
 if(immutable){
  const prefix='/releases/'+version+'/';
  if(!assets.every(a=>a.url===prefix+a.path.slice(1)))issues.push('Mixed inventory URLs');
  const references=[...doc.querySelectorAll('script[src],link[rel="stylesheet"]')];
  if(!references.length||references.some(n=>!(n.getAttribute('src')||n.getAttribute('href')).startsWith(prefix)))issues.push('Mixed entry dependencies');
  const expected=assets.find(a=>a.path==='/manifest.webmanifest');
  if(!expected||sha256(manifestBytes)!==expected.sha256)issues.push('Root manifest differs from release');
 }
 return issues;
}
