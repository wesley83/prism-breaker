import {PWA_RELEASE} from './pwa-release.js';

// Installation is optional: a completely downloaded game also works offline in a tab.
export function setupOfflinePlay({isSafeToUpdate,openHelp,beforeUpdate=()=>{}}){
 // The document identity must win over a separately HTTP-cached module.
 const marker=document.querySelector('meta[name="prism-release"]')?.content;
 const pageRelease=/^[a-f0-9]{20}$/.test(marker||'')?marker:PWA_RELEASE;
 const status=document.querySelector('#offline-status'),detail=document.querySelector('#offline-detail'),install=document.querySelector('#install-game'),update=document.querySelector('#update-game'),retry=document.querySelector('#retry-download');
 const updateButtons=[update,...document.querySelectorAll('[data-pwa-update]')],notice=document.querySelector('#update-notice'),pauseNotice=document.querySelector('#pause-update-notice'),checkButton=document.querySelector('#check-updates'),checkStatus=document.querySelector('#settings-update-status');
 let registration,prompt,ready=false,failed=false,applying=false,newVersion=false,lastCheck=0,unavailable='',repairing=null,updateError='',activationTimer=null,reloadReady=false,reloading=false,inspection=0,installed=false,checking=false,checked=false,checkError='',checkRequest=null;
 const standalone=()=>matchMedia('(display-mode: standalone)').matches||matchMedia('(display-mode: fullscreen)').matches||navigator.standalone===true;
 function render(){
  if(applying&&reloadReady&&isSafeToUpdate()&&!reloading){reloading=true;location.reload();}
  for(const button of updateButtons){button.hidden=!newVersion||!!unavailable;button.disabled=applying||!isSafeToUpdate();button.textContent=isSafeToUpdate()?'Update game':'Update after this run';}
  if(notice)notice.hidden=!newVersion||!isSafeToUpdate()||!!unavailable;
  if(pauseNotice)pauseNotice.hidden=!newVersion||!!unavailable;
  if(checkButton){checkButton.disabled=checking||applying||!!unavailable;checkButton.textContent=checking?'Checking…':'Check for updates';}
  if(checkStatus)checkStatus.textContent=unavailable?'Update checks are unavailable in this preview or browser.':applying?'Applying the update…':checking?'Checking for updates…':newVersion?(isSafeToUpdate()?'An update is ready to install.':'An update is ready. Return to the start screen to apply it.'):checkError||(failed?'The game download could not finish. Reconnect and check again.':['installing','installed'].includes(registration?.installing?.state)?'Downloading the update…':checked?'You’re up to date.':'Updates are checked automatically while the game is open.');
  if(unavailable){status.textContent=unavailable==='preview'?'Preview mode':'Offline play is unavailable in this browser.';detail.textContent=unavailable==='preview'?'Offline downloads are disabled in previews.':'Open the game in a current browser over HTTPS.';install.hidden=true;retry.hidden=true;return;}
  install.hidden=installed||standalone();
  status.textContent=ready?(navigator.onLine?'Ready to play offline':'Offline · ready to play'):failed?'Offline download unavailable':'Preparing offline play…';
  detail.textContent=applying?(reloadReady&&!isSafeToUpdate()?'Update ready. Return to the start screen to finish.':'Applying the update…'):updateError|| (newVersion?'An update is ready. Apply it from the start screen.':failed?'Reconnect and retry to finish downloading the game.':ready?'All sixteen worlds, music and cutscenes are saved.':'Keep this page open while the complete game downloads.');
  retry.hidden=!failed;retry.disabled=applying;
 }
 function requestStatus(worker,message={type:'GET_STATUS'}){return new Promise((resolve,reject)=>{
  if(!worker)return reject(Error('No offline worker'));
  const channel=new MessageChannel(),timer=setTimeout(()=>{channel.port1.close();reject(Error('Offline worker did not respond'));},message.type==='REPAIR_CACHE'?90000:6000);
  channel.port1.onmessage=e=>{clearTimeout(timer);channel.port1.close();resolve(e.data);};
  try{worker.postMessage(message,[channel.port2]);}catch(error){clearTimeout(timer);channel.port1.close();reject(error);}
 });}
 function repair(worker){
  if(repairing?.worker===worker)return repairing.promise;
  const attempt={worker};
  attempt.promise=requestStatus(worker,{type:'REPAIR_CACHE',version:pageRelease}).finally(()=>{if(repairing===attempt)repairing=null;});
  repairing=attempt;return attempt.promise;
 }
 async function inspect({forceRepair=false}={}){
  const controller=navigator.serviceWorker.controller,revision=++inspection;
  try{
   const worker=controller||registration?.active,info=await requestStatus(worker,{type:'CLIENT_VERSION',version:pageRelease});
   if(revision!==inspection)return;
   ready=info.ready===true;newVersion=!!registration?.waiting||!!(info.version&&info.version!==pageRelease);failed=!ready;
   if(!ready&&info.version===pageRelease&&(navigator.onLine||forceRepair)){
    failed=false;render();const repaired=await repair(worker);if(revision!==inspection)return;
    ready=repaired.ready===true;failed=!ready;
   }
  }catch{if(revision!==inspection)return;if(registration?.active&&!ready)failed=true;}
  if(revision!==inspection)return;
  if(registration?.waiting)newVersion=true;render();
 }
 function watch(worker){if(!worker)return;worker.addEventListener('statechange',()=>{if(worker.state==='installed'||worker.state==='activated')inspect();else if(worker.state==='redundant'){failed=true;render();}});}
 async function start(forceRepair=false){
  if(!('serviceWorker' in navigator)||!isSecureContext){unavailable='unsupported';render();return;}
  // Local cinematic fixtures must never register or alter the production-scope worker.
  if(location.pathname.startsWith('/__qa/')){unavailable='preview';render();return;}
  try{registration=await navigator.serviceWorker.register('/sw.js',{scope:'/',updateViaCache:'none'});lastCheck=Date.now();watch(registration.installing);registration.addEventListener('updatefound',()=>{failed=false;render();watch(registration.installing);});await inspect({forceRepair});}
  catch{failed=true;render();}
 }
 window.addEventListener('beforeinstallprompt',e=>{e.preventDefault();prompt=e;render();});
 window.addEventListener('appinstalled',()=>{prompt=null;installed=true;render();});
 install.onclick=async()=>{
  if(prompt){const invitation=prompt;prompt=null;try{await invitation.prompt();await invitation.userChoice;}catch{openHelp();}}
  else openHelp();
  // A denied persistence request is harmless; normal browser storage still works.
  navigator.storage?.persist?.().catch(()=>{});
 };
 const applyUpdate=async()=>{
  if(!newVersion||unavailable||!isSafeToUpdate()||applying)return;
  applying=true;updateError='';reloadReady=false;render();
  const failedActivation=()=>{clearTimeout(activationTimer);activationTimer=null;applying=false;reloadReady=false;updateError='The update could not finish. Try Update game again.';render();};
  try{
   await beforeUpdate();
   if(!isSafeToUpdate()){applying=false;render();return;}
   const waiting=registration?.waiting;
   if(waiting){activationTimer=setTimeout(failedActivation,12000);waiting.postMessage({type:'SKIP_WAITING'});}
   else{reloadReady=true;render();}
  }catch{failedActivation();}
 };
 for(const button of updateButtons)button.onclick=applyUpdate;
 retry.onclick=async()=>{failed=false;render();if(!registration)return start(true);try{await registration.update();await inspect({forceRepair:true});}catch{failed=true;render();}};
 navigator.serviceWorker?.addEventListener('message',event=>{if(event.data?.type==='PWA_VERSION_REQUEST')event.ports[0]?.postMessage({version:pageRelease});});
 navigator.serviceWorker?.addEventListener('controllerchange',()=>{++inspection;if(applying){clearTimeout(activationTimer);activationTimer=null;reloadReady=true;render();}else inspect();});
 async function checkForUpdates(){
  if(checkRequest)return checkRequest;
  if(unavailable)return;
  checking=true;checkError='';render();
  const request=(async()=>{
   try{if(!registration)await startup;if(!registration)throw Error('Registration unavailable');lastCheck=Date.now();await registration.update();checked=true;await inspect();}
   catch{checkError='Could not check for updates. Reconnect and try again.';}
   finally{checking=false;render();}
  })();
  checkRequest=request;try{await request;}finally{if(checkRequest===request)checkRequest=null;}
 }
 if(checkButton)checkButton.onclick=checkForUpdates;
 const check=()=>{if(document.hidden)return;render();if(registration){inspect();if(navigator.onLine&&Date.now()-lastCheck>=60000)checkForUpdates();}};
 window.addEventListener('online',check);window.addEventListener('focus',check);window.addEventListener('offline',render);document.addEventListener('visibilitychange',()=>{if(!document.hidden)check();});
 setInterval(check,60000);
 document.addEventListener('fullscreenchange',render);
 render();const startup=start();return {refresh:()=>{render();if(isSafeToUpdate())check();},checkForUpdates};
}
