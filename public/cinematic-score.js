export const CINEMATICS=[
 {name:'The garden awakens',duration:13,points:[[-7,5,13],[8,7,20],[12,10,31],[3,16,34],[0,8,29]],fov:[38,48,42,35,38]},
 {name:'Above the carnival',duration:14,points:[[0,-1,14],[-11,5,23],[7,12,29],[13,9,30],[0,7,29]],fov:[40,48,43,36,38]},
 {name:'Power to the skyline',duration:13.5,points:[[-5,-1,15],[0,3,24],[14,8,27],[10,16,35],[0,7,29]],fov:[42,48,42,36,38]},
 {name:'A passage of light',duration:14,points:[[-7,3,12],[8,5,21],[-12,10,28],[0,12,32],[0,7,29]],fov:[36,48,40,34,38]},
 {name:'The last ember',duration:13,points:[[8,-2,16],[-11,3,22],[-12,9,29],[10,14,31],[0,7,29]],fov:[40,48,44,34,38]},
 {name:'Beyond the lens',duration:14.5,points:[[-8,5,13],[12,9,24],[13,17,29],[-10,15,32],[0,7,29]],fov:[35,46,42,34,38]},
 {name:'An ocean of stars',duration:15,points:[[0,2,13],[-12,9,22],[12,13,32],[4,19,36],[0,7,29]],fov:[42,52,43,35,38]},
 {name:'Every color comes home',duration:17,points:[[7,3,13],[-11,6,23],[12,13,32],[0,19,39],[0,8,33]],fov:[36,50,44,34,38]}
];
export const clamp01=x=>Math.max(0,Math.min(1,x));
export const smooth=x=>{x=clamp01(x);return x*x*(3-2*x);};
function curve(points,p){const position=clamp01(p)*(points.length-1),i=Math.min(points.length-2,Math.floor(position)),t=position-i;return [0,1,2].map(axis=>{const a=points[Math.max(0,i-1)][axis],b=points[i][axis],c=points[i+1][axis],d=points[Math.min(points.length-1,i+2)][axis];return .5*((2*b)+(-a+c)*t+(2*a-5*b+4*c-d)*t*t+(-a+3*b-3*c+d)*t*t*t);});}
export function cameraFrame(level,seconds,aspect=1,reducedMotion=false){const scene=CINEMATICS[level],p=reducedMotion?.74:clamp01(seconds/scene.duration),position=curve(scene.points,p);if(aspect<.85){position[0]*=.7;position[2]*=Math.min(1.65,.85/aspect);}const slot=p*4,index=Math.min(3,Math.floor(slot)),fov=scene.fov[index]+(scene.fov[index+1]-scene.fov[index])*smooth(slot-index);return {position,target:[0,3.2,0],fov,roll:reducedMotion?0:Math.sin(p*Math.PI*2+level)*.055,progress:p,titleAlpha:reducedMotion?1:smooth((p-.54)/.12),fade:reducedMotion?0:Math.max(1-smooth(p/.065),smooth((p-.95)/.05))};}
