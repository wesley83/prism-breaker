// Hold the final readable composition before its outgoing fade. Navigation is explicit.
export function advanceScene(seconds,delta,duration,paused=false){
 const end=duration*.94;
 return Math.min(end,Math.max(0,seconds)+(paused?0:Math.max(0,delta)));
}
export function scenePlaybackStatus(seconds,duration,{reducedMotion=false,paused=false}={}){
 if(reducedMotion)return {hint:'Reduced motion is on.',action:'Play animation'};
 if(paused)return {hint:'Scene paused. Press P to resume.',action:''};
 if(seconds>=duration*.94-1e-6)return {hint:'Scene complete. Continue when ready.',action:'Replay scene'};
 return {hint:'Continue when you’re ready.',action:''};
}
