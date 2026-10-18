import {normalizeWorld,parseWorld,worldHTML,worldDocument} from './world-format.js';
// Pin the reviewed baseline across every await. DAV is trusted authoring;
// strong ETags and readback protect against conflicting edits, not invalid authors.
export async function publishWorld({world,baseline,currentBaseline,key,fetch:send=globalThis.fetch}){
 const snapshot=normalizeWorld(world),html=worldHTML(snapshot),url='https://dav-sane-guild-8399.onpagelove.com/worlds/'+snapshot.slug+'/definition.html';
 const options=()=>({headers:{Authorization:'Bearer '+key},cache:'no-store',redirect:'error',signal:AbortSignal.timeout(15000)});
 const unchanged=()=>{if(currentBaseline()!==baseline)throw Error('The workshop loaded a different shared revision. Reload published and review it before publishing again.');};
 unchanged();
 const read=await send(url,options());
 if(!read.ok)throw Error(read.status===401||read.status===403?'This key cannot publish to this host.':'Could not read the shared world ('+read.status+').');
 const etag=read.headers.get('ETag');if(!etag||!/^"[^"\r\n]+"$/.test(etag))throw Error('The host did not expose a strong ETag. Download your world and retry when the shared revision is available.');
 const latest=parseWorld(await read.text(),{expectedSlug:snapshot.slug});unchanged();
 if(worldHTML(latest)!==baseline)throw Error('The published world changed since you opened it. Download your draft, then Reload published to review the latest version.');
 const write=await send(url,{...options(),method:'PUT',headers:{Authorization:'Bearer '+key,'Content-Type':'text/html; charset=utf-8','If-Match':etag},body:worldDocument(snapshot)});
 if(write.status===412)throw Error('Someone changed this world while it was saving. Download your draft, then Reload published.');
 if(!write.ok)throw Error('Publish failed ('+write.status+'). Your working copy remains open.');
 const check=await send(url,options());
 if(!check.ok||worldHTML(parseWorld(await check.text(),{expectedSlug:snapshot.slug}))!==html)throw Error('The save was sent, but its readback could not be confirmed. Reload published before retrying.');
 // The write may have succeeded while a reload was pending. Keep that newer
 // local baseline and require a fresh review rather than silently replacing it.
 unchanged();return html;
}
