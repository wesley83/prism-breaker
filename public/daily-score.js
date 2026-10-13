export const DAILY_DURATION=12,DAILY_RECORD_DURATION=11;
export function dailyFrame(seconds,aspect,reduced=false,record=false){
 const duration=record?DAILY_RECORD_DURATION:DAILY_DURATION,p=Math.max(0,Math.min(1,(reduced?duration*.7:seconds)/duration)),ease=p*p*(3-2*p),angle=reduced?.05:Math.sin(p*Math.PI)*.32-.12,z=(aspect<.85?23/aspect:27)+(1-ease)*8;
 return {position:[Math.sin(angle)*z,4+(1-ease)*3,z*Math.cos(angle)],target:[0,2,0],fov:43-ease*3,roll:reduced?0:Math.sin(p*Math.PI*2)*.025,progress:p,titleAlpha:reduced?1:Math.max(0,Math.min(1,(p-.18)/.14)),fade:reduced?0:Math.max(0,1-p/.06)};
}
