// One accepted contact owns paddle steering. Additional contacts cannot release it.
export function setupPaddleInput(surface,{enabled,move,launch,neutral=()=>{},win=globalThis.window,doc=globalThis.document}){
 let owner=null;
 const cancel=()=>{const old=owner;owner=null;try{if(old!==null&&surface.hasPointerCapture?.(old))surface.releasePointerCapture(old);}catch{}neutral();};
 const down=event=>{if(!enabled()||owner!==null||event.button!==0)return;owner=event.pointerId;try{surface.setPointerCapture(owner);}catch{cancel();return;}move(event);launch(event);};
 const motion=event=>{if(!enabled()){cancel();return;}if(owner!==null){if(event.pointerId!==owner)return;if(event.pointerType==='mouse'&&(event.buttons&1)===0){cancel();return;}move(event);}
  else if(event.pointerType==='mouse'&&event.buttons===0)move(event);
 };
 const up=event=>{if(event.pointerId===owner)cancel();};
 const visibility=()=>{if(doc.hidden)cancel();};
 const bindings=[[surface,'pointerdown',down],[surface,'pointermove',motion],[surface,'pointerup',up],[surface,'pointercancel',up],[surface,'lostpointercapture',up],[win,'blur',cancel],[win,'resize',cancel],[doc,'visibilitychange',visibility]];
 for(const [target,type,handler]of bindings)target?.addEventListener(type,handler);
 return {cancel,get owner(){return owner;},dispose(){cancel();for(const [target,type,handler]of bindings)target?.removeEventListener(type,handler);}};
}
