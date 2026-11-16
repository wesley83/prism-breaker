// Request browser fullscreen directly from button gestures. CSS still fills the
// available phone viewport when the browser or operating system declines it.
export function setupGameDisplay({isPlaying,onExit=()=>{},onError=()=>{},document:doc=globalThis.document,window:win=globalThis.window}){
 const root=doc.documentElement,button=doc.querySelector('#fullscreen'),pauseButton=doc.querySelector('#pause-fullscreen'),layoutButton=doc.querySelector('#pause-layout');
 let previousFullscreen=!!doc.fullscreenElement,pending=false,requestEpoch=0,buttonFullscreen=false,autoSuppressed=false;
 const phone=()=>win.matchMedia('(max-width: 650px)').matches||(win.matchMedia('(pointer: coarse)').matches&&win.matchMedia('(max-width: 1100px)').matches);
 const installedFullscreen=()=>win.matchMedia('(display-mode: fullscreen)').matches;
 const installed=()=>installedFullscreen()||win.matchMedia('(display-mode: standalone)').matches||win.matchMedia('(display-mode: minimal-ui)').matches||win.navigator?.standalone===true;
 const canRequest=()=>typeof root.requestFullscreen==='function'&&doc.fullscreenEnabled!==false;
 function refresh(){
  const nativeFullscreen=!!doc.fullscreenElement;
  // Gameplay layout is independent of the browser's fullscreen permission.
  const mobilePlay=isPlaying()&&phone();
  root.classList.toggle('game-focus',isPlaying()&&(nativeFullscreen||mobilePlay));
  root.classList.toggle('play-locked',mobilePlay);
  const label=pending?'Opening fullscreen…':nativeFullscreen?'Exit fullscreen':canRequest()?'Enter fullscreen':'Fullscreen unavailable';
  button.setAttribute('aria-label',label);button.title=label;
  button.disabled=pauseButton.disabled=pending||(!nativeFullscreen&&!canRequest());
  button.innerHTML='<svg class="icon" aria-hidden="true" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="'+(nativeFullscreen?'M4 9h5V4m6 0v5h5M4 15h5v5m6 0v-5h5':'M4 9V4h5m6 0h5v5M4 15v5h5m6 0h5v-5')+'"/></svg>';
  pauseButton.textContent=label;
  if(layoutButton)layoutButton.hidden=true;
 }
 function request(automatic=false,fromButton=false){
  // Installed window mode and API fullscreen are independent. An explicit tap
  // can still request API fullscreen; automatic entry avoids redundant requests.
  if(pending||doc.fullscreenElement||(automatic&&!fromButton&&installedFullscreen()))return;
  if(!canRequest()){if(!automatic)onError();refresh();return;}
  const epoch=++requestEpoch;pending=true;refresh();
  const failed=()=>{if(epoch===requestEpoch&&!automatic)onError();};
  try{
   // Browsers may ignore this optional hint; success is observed through the API.
   Promise.resolve(root.requestFullscreen({navigationUI:'hide'})).then(()=>{
    if(epoch!==requestEpoch&&doc.fullscreenElement===root)return doc.exitFullscreen();
   }).catch(failed).finally(()=>{pending=false;refresh();});
  }catch{pending=false;failed();refresh();}
 }
 function enterForPlay(){autoSuppressed=false;if(!phone())return;refresh();request(true);}
 function leave(){
  // A button-entered session stays immersive while navigating back home.
  if(buttonFullscreen){refresh();return;}
  ++requestEpoch;refresh();
  if(doc.fullscreenElement===root)try{Promise.resolve(doc.exitFullscreen()).catch(()=>{});}catch{}
 }
 function toggle(){
  if(pending)return;
  if(doc.fullscreenElement){autoSuppressed=true;buttonFullscreen=false;try{Promise.resolve(doc.exitFullscreen()).catch(onError);}catch{onError();}return;}
  autoSuppressed=false;
  refresh();request();
 }
 // Bubble after the ordinary action, in the same activation task. Do not consume
 // the gesture needed by native sharing, clipboard, downloads or installation.
 doc.addEventListener('click',event=>{
  if(!event.isTrusted||event.defaultPrevented||autoSuppressed||(!phone()&&!installed()))return;
  const control=event.target?.closest?.('button');
  if(!control||control.disabled||control.getAttribute('aria-disabled')==='true'||control===button||control===pauseButton||control===layoutButton||control.closest('[data-fullscreen-skip]'))return;
  buttonFullscreen=true;refresh();request(true,true);
 });
 doc.addEventListener('fullscreenchange',()=>{
  const current=!!doc.fullscreenElement,exited=previousFullscreen&&!current;previousFullscreen=current;
  if(exited){buttonFullscreen=false;autoSuppressed=true;}refresh();if(exited&&isPlaying())onExit();
 });
 win.addEventListener('resize',refresh);
 button.onclick=toggle;pauseButton.onclick=toggle;refresh();return {enterForPlay,refresh,leave};
}
