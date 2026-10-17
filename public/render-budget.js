// Rendering cadence never changes the engine's fixed 1/120-second simulation step.
export class RenderClock{
 constructor(){this.deadline=0;this.last=null;this.fps=0;this.elapsed=0;}
 due(now,fps=60){
  const interval=1000/fps;
  if(this.fps!==fps){this.fps=fps;this.deadline=now;}
  if(now+.3<this.deadline)return false;
  this.elapsed=this.last===null?interval:now-this.last;this.last=now;
  // Advance the deadline, rather than discarding fractional refresh time each frame.
  this.deadline+=Math.max(1,Math.floor((now-this.deadline)/interval)+1)*interval;
  return true;
 }
 reset(){this.deadline=0;this.last=null;this.fps=0;}
}
export class RenderBudget{
 constructor(){this.scale=1;this.reset();this.last={fps:0,slowFrames:0,cpuMS:0};}
 reset(){this.time=0;this.frames=0;this.slow=0;this.cpu=0;this.headroom=0;}
 sample(frameMS,cpuMS,active=true){
  if(!active||!Number.isFinite(frameMS)||frameMS<=0||frameMS>1000){this.reset();return false;}
  // A healthy 60 FPS cadence on a 90 Hz display alternates 11.1/22.2 ms.
  this.time+=frameMS;this.cpu+=Math.max(0,cpuMS);this.frames++;if(frameMS>25)this.slow++;
  if(this.time<2000)return false;
  const mean=this.time/this.frames,ratio=this.slow/this.frames,previous=this.scale;
  this.last={fps:1000/mean,slowFrames:ratio,cpuMS:this.cpu/this.frames};
  if(mean>20||ratio>.2){this.scale=Math.max(.6,Math.round(this.scale*.85*100)/100);this.headroom=0;}
  else if(mean<18&&ratio<.04&&this.cpu/this.frames<8){this.headroom+=this.time;if(this.headroom>=8000){this.scale=Math.min(1,Math.round((this.scale+.05)*100)/100);this.headroom=0;}}
  else this.headroom=0;
  this.time=0;this.frames=0;this.slow=0;this.cpu=0;return previous!==this.scale;
 }
}
