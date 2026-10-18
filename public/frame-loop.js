// One failed callback must not silently strand the canvas or repeatedly throw.
export function startFrameLoop(step,{onError=()=>{},request=globalThis.requestAnimationFrame,cancel=globalThis.cancelAnimationFrame}={}){
 let failed=false,disposed=false,id;
 const frame=now=>{
  if(disposed)return;
  try{if(!failed)step(now);}catch(error){failed=true;try{onError(error);}catch(reportError){console.error('Frame recovery failed:',reportError);}}
  finally{if(!disposed)id=request(frame);}
 };
 id=request(frame);
 return {get failed(){return failed;},resume(){if(!disposed)failed=false;},dispose(){disposed=true;cancel(id);}};
}
