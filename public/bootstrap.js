// Keep recovery independent of the application module graph. A missing engine
// must not leave an uncontrolled first visit on an endless preparation screen.
export function startupFailure(doc,reload){
 const find=id=>doc.querySelector(id);
 for(const button of doc.querySelectorAll('#play,#resume,#daily,.world-card,#worlds-menu,#scores-open,#help-open,#settings-open,#sound-toggle,#fullscreen,#install-game,#update-game,#retry-download,#check-updates,[data-pwa-update]'))button.disabled=true;
 if(find('#arena-status'))find('#arena-status').hidden=true;
 find('#stage')?.setAttribute('aria-busy','false');
 if(find('#error'))find('#error').hidden=false;
 if(find('#error-text'))find('#error-text').textContent='The game files could not load. Reconnect and reload the game. If an update is being published, try again in a moment.';
 if(find('#reload'))find('#reload').onclick=reload;
 if(find('#offline-status'))find('#offline-status').textContent='Game download unavailable';
 if(find('#offline-detail'))find('#offline-detail').textContent='Reconnect and reload to finish loading Prism Breaker.';
}
export async function startGame({document:doc=globalThis.document,load=()=>import('./app.js?v=32'),reload=()=>location.reload()}={}){
 try{await load();return true;}catch{startupFailure(doc,reload);return false;}
}
if(typeof document!=='undefined')startGame();
