// One accepted contact owns paddle steering. Additional contacts cannot release it.
export function setupPaddleInput(surface,{enabled,move,launch,neutral=()=>{},interrupted=()=>{},accept=event=>!event.target?.closest?.('button,a,input,select,textarea,label,summary,[role="button"],[contenteditable],dialog,[data-paddle-ignore]'),hover=()=>true,win=globalThis.window,doc=globalThis.document}){
 let owner=null;
 const cancel=()=>{const old=owner;owner=null;try{if(old!==null&&surface.hasPointerCapture?.(old))surface.releasePointerCapture(old);}catch{}neutral();};
 const interrupt=()=>{const active=owner!==null;cancel();if(active)interrupted();};
 const down=event=>{if(!enabled()||owner!==null||event.button!==0||!accept(event))return;owner=event.pointerId;try{surface.setPointerCapture(owner);}catch{interrupt();return;}move(event);launch(event);};
 const motion=event=>{if(!enabled()){cancel();return;}if(owner!==null){if(event.pointerId!==owner)return;if(event.pointerType==='mouse'&&(event.buttons&1)===0){cancel();return;}move(event);}
  else if(event.pointerType==='mouse'&&event.buttons===0&&accept(event)&&hover(event))move(event);
 };
 const up=event=>{if(event.pointerId===owner)cancel();};
 const lost=event=>{if(event.pointerId===owner)interrupt();};
 const visibility=()=>{if(doc.hidden)interrupt();};
 // Browser toolbar/viewport resizes do not invalidate pointer capture. Genuine
 // cancellation pauses play; a fresh contact is required after resuming.
 const bindings=[[surface,'pointerdown',down],[surface,'pointermove',motion],[surface,'pointerup',up],[surface,'pointercancel',lost],[surface,'lostpointercapture',lost],[win,'blur',interrupt],[win,'orientationchange',interrupt],[win.screen?.orientation,'change',interrupt],[doc,'visibilitychange',visibility]];
 for(const [target,type,handler]of bindings)target?.addEventListener(type,handler);
 return {cancel,get owner(){return owner;},dispose(){cancel();for(const [target,type,handler]of bindings)target?.removeEventListener(type,handler);}};
}
