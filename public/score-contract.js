import {LEGACY_RULESET_REVISION} from './world-identity.js';
export function sameScorePayload(row,run,player){
 return (row.runKey??row.id)===run.id&&row.player===player&&Number(row.score)===run.score&&Number(row.level)===run.level&&row.mode===run.mode&&row.day===run.day&&Number(row.seconds)===run.seconds&&(row.ruleset||LEGACY_RULESET_REVISION)===(run.ruleset||LEGACY_RULESET_REVISION);
}
export function scoreConflict(){return Object.assign(new Error('This run already has different saved details. Its original entry has been kept.'),{permanent:true,code:'score-conflict'});}
export function retryAfterMS(value,now=Date.now()){
 if(!value)return 0;const seconds=Number(value),delay=Number.isFinite(seconds)?seconds*1000:Date.parse(value)-now;
 return Number.isFinite(delay)?Math.max(0,Math.min(86400000,delay)):0;
}
