import {Game,isValidSnapshot} from '../public/engine.js';
const MAX_EVENTS=512,MAX_BYTES=1000000,MAX_TICKS=72000;
const state=game=>({score:game.score,lives:game.lives,state:game.state,phase:game.phase,launchCount:game.launchCount,randomDraws:game.randomDraws,target:game.target,bricks:game.bricks.map(b=>[b.id,b.hp,b.x,b.y]),balls:game.balls.map(b=>[b.x,b.y,b.vx,b.vy,b.held])});
function check(type,value){if(type==='move'&&Number.isFinite(value)&&Math.abs(value)<=20)return;if(type==='launch'&&value===null)return;if(type==='step'&&Number.isInteger(value)&&value>0&&value<=120)return;throw Error('Invalid trace command');}
const act=(game,type,value)=>{if(type==='move')game.move(value);else if(type==='launch')game.launch();else for(let i=0;i<value;i++)game.tick(1/120);};
export class RunTrace{
 constructor(game){if(game.state!=='ready')throw Error('Begin a trace at a ready checkpoint');this.game=game;this.record={schema:1,ruleset:game.snapshot().ruleset,initial:game.snapshot(),events:[]};this.tick=0;this.stopped=false;}
 command(type,value=null){check(type,value);if(this.stopped||this.record.events.length>=MAX_EVENTS||this.tick+(type==='step'?value:0)>MAX_TICKS){this.stopped=true;throw Error('Trace budget reached; recording is incomplete');}act(this.game,type,value);if(type==='step')this.tick+=value;this.record.events.push({tick:this.tick,type,value,expected:state(this.game)});return this.game;}
 export(){if(this.stopped)throw Error('Incomplete trace cannot be exported as complete');const text=JSON.stringify(this.record);if(text.length>MAX_BYTES)throw Error('Trace export exceeds byte budget');return text;}
}
export function replayTrace(text){
 if(typeof text!=='string'||text.length>MAX_BYTES)throw Error('Trace byte budget exceeded');const record=JSON.parse(text);
 if(record.schema!==1||!isValidSnapshot(record.initial)||record.ruleset!==record.initial.ruleset||!Array.isArray(record.events)||record.events.length>MAX_EVENTS)throw Error('Unsupported trace');
 let tick=0;for(const event of record.events){check(event.type,event.value);if(event.type==='step')tick+=event.value;if(event.tick!==tick||tick>MAX_TICKS||!event.expected||typeof event.expected!=='object')throw Error('Invalid trace order or budget');}
 const game=new Game();if(!game.restore(record.initial))throw Error('Incompatible trace checkpoint');
 for(let index=0;index<record.events.length;index++){const event=record.events[index];act(game,event.type,event.value);const actual=state(game);if(JSON.stringify(actual)!==JSON.stringify(event.expected))return {matched:false,index,tick:event.tick,expected:event.expected,actual};}
 return {matched:true,events:record.events.length,ticks:tick};
}
