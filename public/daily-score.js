import {shotFrame,clamp01} from './cinematic-score.js';
export const DAILY_DURATION=16,DAILY_RECORD_DURATION=18;
export function dailyFrame(seconds,aspect,reduced=false,record=false){
 const duration=record?DAILY_RECORD_DURATION:DAILY_DURATION,p=reduced?.82:clamp01(seconds/duration);
 return shotFrame([{from:[-13,3,24],to:[-8,7,23],target:[0,4,0],fov:46},{from:[7,6,20],to:[2,6,23],target:[0,record?6:4,0],fov:39},{from:[3,8,35],to:[0,8,37],target:[0,.5,0],fov:43}],p,aspect,reduced);
}
