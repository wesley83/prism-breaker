// A lost drawing context must freeze simulation as well as rendering.
export function setupGraphicsRecovery(canvas,{pause=()=>{},restore=async()=>{},onStatus=()=>{}}={}){
 let blocked=false,generation=0,disposed=false;
 const lost=event=>{event.preventDefault();if(disposed)return;blocked=true;++generation;pause();onStatus('lost');};
 const restored=async()=>{
  if(disposed||!blocked)return;const ticket=++generation;onStatus('recovering');
  try{await restore();if(disposed||ticket!==generation)return;blocked=false;onStatus('ready');}
  catch{if(!disposed&&ticket===generation)onStatus('failed');}
 };
 canvas.addEventListener('webglcontextlost',lost);canvas.addEventListener('webglcontextrestored',restored);
 return {get blocked(){return blocked;},dispose(){disposed=true;++generation;canvas.removeEventListener('webglcontextlost',lost);canvas.removeEventListener('webglcontextrestored',restored);}};
}
