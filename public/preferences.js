// Stored preferences are untrusted input, including values from older versions.
export function normalizeSettings(value,{reducedMotion=false,lowEffects=false}={}){
 const result={music:.35,effects:.7,muted:false,interfaceTheme:'system',classicMode:false,reducedMotion:!!reducedMotion,lowEffects:!!lowEffects,paddleFinish:'original',ballTrail:'none'};
 if(!value||typeof value!=='object'||Array.isArray(value))return result;
 for(const key of ['music','effects'])if(typeof value[key]==='number'&&Number.isFinite(value[key]))result[key]=Math.max(0,Math.min(1,value[key]));
 for(const key of ['muted','classicMode','reducedMotion','lowEffects','playNotes'])if(typeof value[key]==='boolean')result[key]=value[key];
 if(['system','light','dark'].includes(value.interfaceTheme))result.interfaceTheme=value.interfaceTheme;
 for(const key of ['paddleFinish','ballTrail'])if(typeof value[key]==='string'&&/^[a-z-]{2,30}$/.test(value[key]))result[key]=value[key];
 return result;
}
export const storedProgress=(value,maximum)=>Number.isInteger(value)&&value>=0&&value<=maximum?value:0;
