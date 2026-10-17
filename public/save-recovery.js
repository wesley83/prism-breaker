// A write is confirmed only after storage accepts it. Callers own navigation.
export function writeJSON(storage,key,value){
 try{storage.setItem(key,JSON.stringify(value));return {saved:true};}
 catch(error){return {saved:false,error};}
}
export function downloadRecovery(value,name,type='application/json'){
 const body=typeof value==='string'?value:JSON.stringify(value,null,2),url=URL.createObjectURL(new Blob([body],{type}));
 const link=document.createElement('a');link.href=url;link.download=name;link.click();setTimeout(()=>URL.revokeObjectURL(url),10000);
}
export function createSaveRecovery(doc=document){
 const dialog=doc.createElement('dialog');dialog.id='save-recovery-dialog';dialog.setAttribute('aria-labelledby','save-recovery-title');
 dialog.innerHTML='<h2 id="save-recovery-title">Keep your changes safe.</h2><p>The latest changes could not be saved. Retry saving, download a recovery copy, or deliberately leave without saving.</p><p role="status" id="save-recovery-status"></p><button type="button" data-recovery="retry" class="button primary">Retry saving</button><button type="button" data-recovery="download" class="button secondary">Download recovery copy</button><button type="button" data-recovery="stay" class="button secondary" autofocus>Keep working</button><button type="button" data-recovery="discard" class="button secondary">Leave without saving</button>';
 doc.body.append(dialog);let active=null;
 const finish=allowed=>{const operation=active;active=null;if(dialog.open)dialog.close();operation?.resolve(allowed);};
 dialog.addEventListener('cancel',event=>{event.preventDefault();finish(false);});dialog.addEventListener('close',()=>{if(!dialog.open&&active)finish(false);});
 dialog.addEventListener('click',async event=>{const action=event.target.closest('[data-recovery]')?.dataset.recovery;if(!active||!action||active.busy)return;
  if(action==='stay'||action==='discard'){finish(action==='discard');return;}
  const operation=active;operation.busy=true;for(const button of dialog.querySelectorAll('button'))button.disabled=true;
  try{if(action==='download'){await operation.download();if(active===operation)dialog.querySelector('[role=status]').textContent='Recovery download requested. Keep this dialog open until you choose your next action.';}
   else {const saved=await operation.save();if(active===operation){if(saved)finish(true);else dialog.querySelector('[role=status]').textContent='Saving is still unavailable. Your working copy remains open.';}}
  }catch{if(active===operation)dialog.querySelector('[role=status]').textContent='That action could not finish. Your working copy remains open.';}
  finally{operation.busy=false;for(const button of dialog.querySelectorAll('button'))button.disabled=false;}
 });
 return ({save,download})=>{if(active)return active.promise;const promise=new Promise(resolve=>{active={save,download,resolve};});active.promise=promise;dialog.querySelector('[role=status]').textContent='';dialog.showModal();return promise;};
}
