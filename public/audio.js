import {TRACKS,musicEvents,noteHz} from './music.js';
import {VICTORY_TRACKS,victoryEvents} from './victory-music.js';
export class Sound{
 constructor(settings){this.settings=settings;this.next=0;this.step=0;this.level=-1;this.voices=new Set();this.active=false;this.lastGain='';}
 setup(ctx){
  this.ctx=ctx;this.master=ctx.createGain();this.master.gain.value=.5;const limiter=ctx.createDynamicsCompressor();limiter.threshold.value=-14;limiter.knee.value=12;limiter.ratio.value=4;limiter.attack.value=.005;limiter.release.value=.18;this.master.connect(limiter);limiter.connect(ctx.destination);
  this.musicBus=ctx.createGain();this.effectsBus=ctx.createGain();this.musicBus.connect(this.master);this.effectsBus.connect(this.master);this.musicInput=ctx.createGain();this.musicInput.gain.value=1.5;this.musicInput.connect(this.musicBus);
  const reverb=ctx.createConvolver(),wet=ctx.createGain();wet.gain.value=.22;const impulse=ctx.createBuffer(2,Math.floor(ctx.sampleRate*1.35),ctx.sampleRate);let seed=8399;
  for(let ch=0;ch<2;ch++){const data=impulse.getChannelData(ch);for(let i=0;i<data.length;i++){seed=(Math.imul(seed,1664525)+1013904223)>>>0;data[i]=(seed/4294967296*2-1)*Math.exp(-i/ctx.sampleRate*5);}}
  reverb.buffer=impulse;this.musicInput.connect(reverb);reverb.connect(wet);wet.connect(this.musicBus);
  this.noiseBuffer=ctx.createBuffer(1,ctx.sampleRate,ctx.sampleRate);const noise=this.noiseBuffer.getChannelData(0);for(let i=0;i<noise.length;i++){seed=(Math.imul(seed,1664525)+1013904223)>>>0;noise[i]=seed/4294967296*2-1;}
  this.musicBus.gain.value=0;this.effectsBus.gain.value=this.settings.muted?0:this.settings.effects;
 }
 async unlock(){try{if(!this.ctx){try{this.setup(new (window.AudioContext||window.webkitAudioContext)());}catch(error){this.disable(error);return;}}await this.ctx.resume();}catch{/* A later player gesture can retry resuming suspended audio. */}}
 disable(error){
  const ctx=this.ctx;this.ctx=null;this.musicBus=this.effectsBus=this.musicInput=this.master=null;this.active=false;this.lastGain='';this.trackKey=null;this.next=0;this.voices.clear();
  try{ctx?.close()?.catch(()=>{});}catch{}
  if(!this.warned){this.warned=true;console.warn('Audio unavailable; gameplay continues.',error);}
 }
 syncGain(){if(!this.ctx)return;const music=this.active&&!this.settings.muted?this.settings.music:0,effects=this.settings.muted?0:this.settings.effects,signature=music+'|'+effects;if(signature===this.lastGain)return;this.lastGain=signature;this.musicBus.gain.setTargetAtTime(music,this.ctx.currentTime,.06);this.effectsBus.gain.setTargetAtTime(effects,this.ctx.currentTime,.03);}
 tone(freq,duration=.12,type='sine',volume=.1,delay=0,music=false,end,pan=0,at,attack=.008){
  if(!this.ctx||(!this.offline&&this.ctx.state!=='running'))return;
  const t=at??this.ctx.currentTime+delay,osc=this.ctx.createOscillator(),gain=this.ctx.createGain(),panner=this.ctx.createStereoPanner();osc.type=type;osc.frequency.setValueAtTime(Math.max(20,freq),t);if(end)osc.frequency.exponentialRampToValueAtTime(Math.max(20,end),t+duration);
  gain.gain.setValueAtTime(.0001,t);gain.gain.exponentialRampToValueAtTime(Math.max(.0002,volume),t+Math.min(attack,duration*.35));gain.gain.exponentialRampToValueAtTime(.0001,t+duration);panner.pan.value=pan;osc.connect(gain);gain.connect(panner);panner.connect(music?this.musicInput:this.effectsBus);osc.start(t);osc.stop(t+duration+.025);
  const voice={source:osc,gain,panner,music};this.voices.add(voice);osc.onended=()=>{osc.disconnect();gain.disconnect();panner.disconnect();this.voices.delete(voice);};
 }
 noise(duration,volume,frequency,at,pan=0){const ctx=this.ctx,source=ctx.createBufferSource(),filter=ctx.createBiquadFilter(),gain=ctx.createGain(),panner=ctx.createStereoPanner();source.buffer=this.noiseBuffer;filter.type='highpass';filter.frequency.value=frequency;gain.gain.setValueAtTime(Math.max(.0002,volume),at);gain.gain.exponentialRampToValueAtTime(.0001,at+duration);panner.pan.value=pan;source.connect(filter);filter.connect(gain);gain.connect(panner);panner.connect(this.musicInput);source.start(at);source.stop(at+duration+.02);const voice={source,gain,panner,music:true};this.voices.add(voice);source.onended=()=>{source.disconnect();filter.disconnect();gain.disconnect();panner.disconnect();this.voices.delete(voice);};}
 play(event,at){const {instrument:i,note,duration:d,volume:v,pan}=event,f=noteHz(note);at+=event.delay;
  if(i==='kick'){this.tone(130,d,'sine',v,0,true,36,0,at);return;}
  if(['hat','snare','brush','clank'].includes(i)){this.noise(d,v,i==='hat'?7200:i==='brush'?2700:1400,at,pan);if(i==='snare')this.tone(180,.1,'triangle',v*.35,0,true,90,pan,at);if(i==='clank')this.tone(420,.18,'sine',v*.6,0,true,250,pan,at);return;}
  const wave=i==='acid'?'sawtooth':i==='chip'?'triangle':i==='metal'?'triangle':'sine';
  if(i==='pad'||i==='air'||i==='choir'){this.tone(f*.997,d,'triangle',v*.6,0,true,undefined,pan,at,.2);this.tone(f*1.003,d,'sine',v*.4,0,true,undefined,-pan,at,.2);return;}
  this.tone(f,d,wave,v,0,true,undefined,pan,at,i==='anthem'?.08:.008);
  if(['bell','glass','metal','marimba','anthem'].includes(i))this.tone(f*(i==='metal'?2.76:i==='glass'?3.01:2),d*(i==='marimba'?.4:.7),'sine',v*(i==='metal'?.35:.22),0,true,undefined,-pan,at);
 }
 scheduleStep(level,step,at,cinematic=false,victory=null){for(const event of victory?victoryEvents(victory,step):musicEvents(level,step,cinematic))this.play(event,at);}
 stopMusic(){if(!this.ctx)return;const now=this.ctx.currentTime;for(const voice of this.voices)if(voice.music){try{voice.gain.cancelScheduledValues(now);voice.gain.setTargetAtTime(.0001,now,.012);voice.source.stop(now+.045);}catch{}}}
 event(e){try{this.playEvent(e);}catch(error){this.disable(error);}}
 playEvent(e){
  this.syncGain();if(this.settings.muted||this.settings.effects<=0)return;
  if(e.type==='combo')[523,659,784].slice(0,Math.min(3,e.multiplier)).forEach((f,i)=>this.tone(f,.12,'sine',.06,i*.035));
  if(e.type==='precision-ready'||e.type==='precision-catch')[659,880].forEach((f,i)=>this.tone(f,.15,'sine',.08,i*.07));
  if(e.type==='synergy')[392,587,784].forEach((f,i)=>this.tone(f,.2,'triangle',.06,i*.06));
  if(e.type==='paddle')this.tone(240,.1,'sine',.23,0,false,460);
  if(e.type==='wall')this.tone(145,.045,'sine',.08);
  if(e.type==='hit')this.tone(330,.07,'triangle',.11);
  if(e.type==='break'){this.tone(650+(this.step%6)*80,.1,'triangle',.16);if(e.kind==='explode')this.tone(105,.3,'sawtooth',.06,0,false,35);}
  if(e.type==='power'||e.type==='save'||e.type==='gate')[523,659,784].forEach((f,i)=>this.tone(f,.18,'sine',.15,i*.07));
  if(e.type==='laser')this.tone(720,.085,'triangle',.07,0,false,180);
  if(e.type==='life'||e.type==='over')[350,277,196].forEach((f,i)=>this.tone(f,.25,'triangle',.13,i*.12));
  if(e.type==='clear'||e.type==='phase')[392,523,659,784,1046].forEach((f,i)=>this.tone(f,.45,'sine',.14,i*.11));
  if(e.type==='portal')this.tone(300,.25,'sine',.12,0,false,1200);
  if(e.type==='medal'){const notes=[523,659,784,1046];this.tone(notes[Math.min(3,e.index||0)],.5,'triangle',.12);this.tone(notes[Math.min(3,e.index||0)]*2,.65,'sine',.06,.04);if(e.complete)[523,659,784,1046].forEach((f,i)=>this.tone(f,.9,'triangle',.07,.12+i*.09));}
  if(e.type==='champion'){[523,659,784,1046,1318,1568,2093].forEach((f,i)=>this.tone(f,.7,'triangle',.1,i*.14));[262,330,392].forEach(f=>this.tone(f,1.6,'sine',.09,1.05));}
  if(e.type==='launch')this.tone(380,.16,'sine',.09,0,false,650);
 }
 update(...args){try{this.updateMusic(...args);}catch(error){this.disable(error);}}
 updateMusic(active,level,cinematic=false,victory=null){
  if(!this.ctx)return;const trackKey=victory?'victory:'+victory:'level:'+level;if(this.trackKey!==trackKey){this.stopMusic();this.trackKey=trackKey;this.level=level;this.victory=victory;this.step=0;this.next=0;}
  const audible=active&&!this.settings.muted&&this.settings.music>0;
  if(this.active&&!audible)this.stopMusic();this.active=audible;this.syncGain();
  if(!audible||this.ctx.state!=='running'){this.next=0;return;}
  const track=victory?VICTORY_TRACKS[victory]:TRACKS[level],tick=60/track.bpm/4;if(!this.next||this.next<this.ctx.currentTime-.2)this.next=this.ctx.currentTime+.015;
  while(this.next<this.ctx.currentTime+.12){this.scheduleStep(level,this.step++,this.next,cinematic,victory);this.next+=tick;}
 }
}
