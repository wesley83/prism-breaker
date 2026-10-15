// Request browser fullscreen directly from the start tap. CSS still fills the
// available phone viewport when the browser or operating system declines it.
export function setupGameDisplay({isPlaying,onExit=()=>{},onError=()=>{},document:doc=globalThis.document,window:win=globalThis.window}){
 const root=doc.documentElement,button=doc.querySelector('#fullscreen'),pauseButton=doc.querySelector('#pause-fullscreen'),layoutButton=doc.querySelector('#pause-layout');
 let phoneFocus=false,previousFullscreen=!!doc.fullscreenElement,pending=false,requestEpoch=0;
 const phone=()=>win.matchMedia('(max-width: 650px)').matches||(win.matchMedia('(pointer: coarse)').matches&&win.matchMedia('(max-width: 1100px)').matches);
 const installedFullscreen=()=>win.matchMedia('(display-mode: fullscreen)').matches;
 const canRequest=()=>typeof root.requestFullscreen==='function'&&doc.fullscreenEnabled!==false;
 function refresh(){
  const nativeFullscreen=!!doc.fullscreenElement;
  root.classList.toggle('game-focus',isPlaying()&&(nativeFullscreen||phoneFocus));
  const label=pending?'Opening fullscreen…':nativeFullscreen?'Exit fullscreen':canRequest()?'Enter fullscreen':'Fullscreen unavailable';
  button.setAttribute('aria-label',label);button.title=label;
  button.disabled=pauseButton.disabled=pending||(!nativeFullscreen&&!canRequest());
  button.innerHTML='<svg class="icon" aria-hidden="true" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="'+(nativeFullscreen?'M4 9h5V4m6 0v5h5M4 15h5v5m6 0v-5h5':'M4 9V4h5m6 0h5v5M4 15v5h5m6 0h5v-5')+'"/></svg>';
  pauseButton.textContent=label;
  if(layoutButton){layoutButton.hidden=!phone()||!isPlaying()||nativeFullscreen;layoutButton.disabled=pending;layoutButton.textContent=phoneFocus?'Use standard layout':'Use screen-filling layout';}
 }
 function request(automatic=false){
  // Installed window mode and API fullscreen are independent. An explicit tap
  // can still request API fullscreen; automatic entry avoids redundant requests.
  if(pending||doc.fullscreenElement||(automatic&&installedFullscreen()))return;
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
 function enterForPlay(){if(!phone())return;phoneFocus=true;refresh();request(true);}
 function leave(){
  ++requestEpoch;phoneFocus=false;refresh();
  if(doc.fullscreenElement===root)try{Promise.resolve(doc.exitFullscreen()).catch(()=>{});}catch{}
 }
 function toggle(){
  if(pending)return;
  if(doc.fullscreenElement){try{Promise.resolve(doc.exitFullscreen()).catch(onError);}catch{onError();}return;}
  if(phone()&&isPlaying())phoneFocus=true;
  refresh();request();
 }
 function toggleLayout(){
  if(pending||doc.fullscreenElement||!phone()||!isPlaying())return;
  phoneFocus=!phoneFocus;refresh();if(!phoneFocus)onExit();
 }
 doc.addEventListener('fullscreenchange',()=>{
  const current=!!doc.fullscreenElement,exited=previousFullscreen&&!current;previousFullscreen=current;
  if(exited)phoneFocus=false;refresh();if(exited&&isPlaying())onExit();
 });
 win.addEventListener('resize',refresh);
 button.onclick=toggle;pauseButton.onclick=toggle;if(layoutButton)layoutButton.onclick=toggleLayout;refresh();return {enterForPlay,refresh,leave};
}
