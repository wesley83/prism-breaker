import fs from 'node:fs/promises';
import path from 'node:path';
// Preview documents must opt into current network modules before importing them.
// Registering no worker is insufficient when an older worker already controls the origin.
export async function writeQaBootstrap(directory){
 await fs.writeFile(path.join(directory,'network-bootstrap.js'),`try{
const controller=navigator.serviceWorker?.controller;
if(controller)await new Promise((resolve,reject)=>{const channel=new MessageChannel(),timer=setTimeout(()=>reject(Error('Preview worker handshake timed out')),5000);channel.port1.onmessage=()=>{clearTimeout(timer);channel.port1.close();resolve();};controller.postMessage({type:'CLIENT_VERSION',version:'network'},[channel.port2]);});
const entry=document.querySelector('script[data-qa-entry]')?.dataset.qaEntry;if(!entry?.startsWith('/__qa/'))throw Error('Invalid local preview entry');await import(entry);
}catch(error){const output=document.createElement('pre');output.id='qa-bootstrap-error';output.textContent='Local preview could not load: '+error.message;document.body.append(output);}
`);
}
