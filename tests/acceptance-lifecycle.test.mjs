import test from 'node:test';
import assert from 'node:assert/strict';
import {activeScores,rankedScores,scoreAgeBand,topFinish,SCORE_LIFETIME,utcDay} from '../public/leaderboard.js';
import {WORLDS,RULESET_REVISION,dailyWorld,daySeed} from '../public/levels.js';
import {Game} from '../public/engine.js';

const midnight=Date.parse('2026-10-15T00:00:00Z');
const row=(extra={})=>({runKey:'sample',player:'QA',score:100,level:1,seconds:60,mode:'daily',day:'2026-10-14',ruleset:RULESET_REVISION,expiresAt:midnight+SCORE_LIFETIME,...extra});
test('UTC midnight swaps daily boards without affecting Adventure or an ongoing run identity',()=>{
 const rows=[row(),row({runKey:'next',day:'2026-10-15',score:200}),row({runKey:'adventure',mode:'campaign',day:'all'})];
 assert.equal(utcDay(midnight-1),'2026-10-14');assert.equal(utcDay(midnight),'2026-10-15');
 assert.deepEqual(rankedScores(rows,'daily',utcDay(midnight-1),midnight-1).map(r=>r.runKey),['sample']);
 assert.deepEqual(rankedScores(rows,'daily',utcDay(midnight),midnight).map(r=>r.runKey),['next']);
 assert.equal(rankedScores(rows,'campaign',utcDay(midnight),midnight).length,1);
 assert.equal(topFinish({id:'old',mode:'daily',day:'2026-10-14',score:10000},rows,utcDay(midnight),midnight),false);
 for(const day of ['2026-10-14','2026-10-15','2026-12-31','2027-01-01']){
   const a=new Game(),b=new Game();a.start('daily',dailyWorld(day),daySeed(day));b.start('daily',dailyWorld(day),daySeed(day));
   assert.deepEqual(a.bricks,b.bricks);assert.equal(a.freshLaunchAngle(),b.freshLaunchAngle());assert.ok(a.level>=0&&a.level<WORLDS.length);
 }
});
test('five-day expiry removes records exactly at the boundary and server expiry takes precedence',()=>{
 const submitted=midnight-SCORE_LIFETIME,record=row({expiresAt:midnight,submittedAt:new Date(submitted).toISOString(),mode:'campaign',day:'all'});
 assert.equal(activeScores([record],midnight-1).length,1);
 assert.equal(activeScores([record],midnight).length,0);
 assert.equal(activeScores([record],midnight+1).length,0);
 assert.equal(activeScores([{...record,submittedAt:new Date(midnight).toISOString()}],midnight).length,0);
 const legacy={...record};delete legacy.expiresAt;assert.equal(activeScores([legacy],midnight).length,0);
 assert.equal(rankedScores([record],'campaign','all',midnight).length,0);
 assert.equal(topFinish({id:'new',mode:'campaign',score:1},[record],'all',midnight),true);
});
test('Adventure age outlines follow the exact 48-hour and 96-hour boundaries',()=>{
 const record=row({expiresAt:midnight+SCORE_LIFETIME});
 for(const [hours,extra,band]of [[48,0,'green'],[48,1,'yellow'],[96,0,'yellow'],[96,1,'red']])assert.equal(scoreAgeBand(record,midnight+hours*3600000+extra),band);
});
