// Three composed shots per world: establish, activate, reveal. Motion uses elapsed time.
export const clamp01=x=>Math.max(0,Math.min(1,x));
export const smooth=x=>{x=clamp01(x);return x*x*(3-2*x);};
export const CHAMPION_DURATION=16;
const names=['The garden awakens','A city above the clouds','Power to the skyline','The crystal cathedral','Fire becomes a star','Beyond the lens','The celestial migration','A door beyond the prism','The lost constellations','A bridge of living light','The forest keeps time','A doorway in the desert','Stillness inside the storm','The last departure','Through the impossible','All the light returns'];
const approaches=[[-17,3,24],[15,0,26],[-15,-1,28],[-16,2,25],[18,0,23],[-17,8,25],[18,5,28],[-19,0,28],[-16,1,25],[17,7,27],[-18,4,25],[18,1,29],[-17,0,27],[17,9,30],[-16,9,26],[19,3,32]];
export const CINEMATICS=names.map((name,i)=>({name,duration:i===15?21:i===7?18:16.5,shots:[
 {from:approaches[i],to:[approaches[i][0]*.6,6,22],target:[0,3,0],fov:48},
 {from:[i%2?9:-9,7,18],to:[i%2?-3:3,5,19],target:[0,4,0],fov:39},
 {from:[i%2?-6:6,9,34],to:[i%2?-2:2,8,37],target:[0,.5,0],fov:43}
]}));
export function shotFrame(shots,p,aspect,reduced=false){
 const shot=reduced?2:p<.28?0:p<.58?1:2,start=[0,.28,.58][shot],end=[.28,.58,1][shot],q=smooth((p-start)/(end-start)),s=shots[shot];
 const position=s.from.map((v,i)=>v+(s.to[i]-v)*q),target=[...s.target];
 if(aspect<.85){position[0]*=.68;position[2]*=Math.min(1.8,.85/Math.max(.32,aspect));target[1]-=shot===2?1.4:0;}
 const dissolve=Math.max(0,1-Math.abs(p-.28)/.017,1-Math.abs(p-.58)/.017);
 return {position,target,fov:s.fov,roll:0,shot,progress:p,titleAlpha:reduced?1:smooth((p-.61)/.07),fade:reduced?0:Math.max(1-smooth(p/.045),dissolve,smooth((p-.975)/.025))};
}
export function cameraFrame(level,seconds,aspect=1,reducedMotion=false){const scene=CINEMATICS[level]??CINEMATICS[0],p=reducedMotion?.82:clamp01(seconds/scene.duration);return shotFrame(scene.shots,p,aspect,reducedMotion);}
