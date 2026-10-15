// Hold the final readable composition before its outgoing fade. Navigation is explicit.
export function advanceScene(seconds,delta,duration,paused=false){
 const end=duration*.94;
 return Math.min(end,Math.max(0,seconds)+(paused?0:Math.max(0,delta)));
}
