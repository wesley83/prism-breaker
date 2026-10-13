// Request browser fullscreen directly from the start tap. CSS still fills the
// available phone viewport when the browser or operating system declines it.
export function setupGameDisplay({isPlaying,onExit=()=>{},onError=()=>{},document:doc=globalThis.document,window:win=globalThis.window}){
 const root=doc.documentElement,button=doc.querySelector('#fullscreen'),pauseButton=doc.querySelector('#pause-fullscreen');
 let phoneFocus=false,previousFullscreen=!!doc.fullscreenElement;
 const phone=()=>win.matchMedia('(max-width: 650px)').matches||(win.matchMedia('(pointer: coarse)').matches&&win.matchMedia('(max-width: 1100px)').matches);
 const installedFullscreen=()=>win.matchMedia('(display-mode: fullscreen)').matches;
 function refresh(){
  const expanded=!!doc.fullscreenElement||phoneFocus;
  root.classList.toggle('game-focus',isPlaying()&&expanded);
  button.setAttribute('aria-label',expanded?'Exit fullscreen view':'Enter fullscreen');button.title=expanded?'Exit fullscreen view':'Fullscreen';
  button.innerHTML='<svg class="icon" aria-hidden="true" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="'+(expanded?'M4 9h5V4m6 0v5h5M4 15h5v5m6 0v-5h5':'M4 9V4h5m6 0h5v5M4 15v5h5m6 0h5v-5')+'"/></svg>';
  pauseButton.textContent=expanded?'Exit fullscreen view':'Enter fullscreen';
 }
 function request(automatic=false){
  if(doc.fullscreenElement||installedFullscreen())return;
  if(!root.requestFullscreen||doc.fullscreenEnabled===false){if(!automatic&&!phone())onError();return;}
  try{Promise.resolve(root.requestFullscreen({navigationUI:'hide'})).catch(()=>{if(!automatic)onError();});}catch{if(!automatic)onError();}
 }
 function enterForPlay(){if(!phone())return;phoneFocus=true;refresh();request(true);}
 function leave(){
  phoneFocus=false;refresh();
  if(doc.fullscreenElement===root)try{Promise.resolve(doc.exitFullscreen()).catch(()=>{});}catch{}
 }
 function toggle(){
  if(doc.fullscreenElement){try{Promise.resolve(doc.exitFullscreen()).catch(onError);}catch{onError();}return;}
  if(phoneFocus){phoneFocus=false;refresh();onExit();return;}
  if(phone()&&isPlaying())phoneFocus=true;
  refresh();request();
 }
 doc.addEventListener('fullscreenchange',()=>{
  const current=!!doc.fullscreenElement,exited=previousFullscreen&&!current;previousFullscreen=current;
  if(exited)phoneFocus=false;refresh();if(exited&&isPlaying())onExit();
 });
 win.addEventListener('resize',refresh);
 button.onclick=toggle;pauseButton.onclick=toggle;refresh();return {enterForPlay,refresh,leave};
}
