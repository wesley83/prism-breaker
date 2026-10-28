import * as T from './vendor/three.module.min.js';
// Fixed-size helpers: a launch guide, encounter rings and a bounded trail pool.
export class EngagementArt{
 constructor(parent,halo){
  this.group=new T.Group();parent.add(this.group);this.points=new Float32Array(6);const geometry=new T.BufferGeometry();geometry.setAttribute('position',new T.BufferAttribute(this.points,3));
  this.guide=new T.Line(geometry,new T.LineBasicMaterial({color:'#ffe3a0',transparent:true,opacity:.8,depthTest:false,toneMapped:false}));this.guide.renderOrder=5;this.group.add(this.guide);
  this.rings=new T.InstancedMesh(new T.TorusGeometry(.72,.035,5,32),new T.MeshBasicMaterial({transparent:true,opacity:.85,depthWrite:false,toneMapped:false}),8);this.rings.count=0;this.rings.frustumCulled=false;this.group.add(this.rings);this.dummy=new T.Object3D();this.color=new T.Color();
  this.trails=[];for(let i=0;i<18;i++){const sprite=new T.Sprite(new T.SpriteMaterial({map:halo,color:'#8edfff',transparent:true,opacity:0,depthWrite:false,depthTest:false,toneMapped:false}));sprite.visible=false;this.group.add(sprite);this.trails.push(sprite);}this.history=[];this.lastTrail='none';
 }
 reset(){this.history.length=0;for(const sprite of this.trails)sprite.visible=false;this.guide.visible=false;this.rings.count=0;}
 warm(parent){const ring=new T.InstancedMesh(this.rings.geometry,this.rings.material,1);this.dummy.position.set(0,0,2);this.dummy.scale.set(1,1,1);this.dummy.updateMatrix();ring.setMatrixAt(0,this.dummy.matrix);ring.setColorAt(0,this.color.set('#ffffff'));parent.add(ring,new T.Line(this.guide.geometry,this.guide.material),new T.Sprite(this.trails[0].material));}
 update(game,settings,trailColor){
  if(this.items!==game.bricks){this.reset();this.items=game.bricks;}
  const held=game.balls.find(b=>b.held&&b.aimable),g=game.engagement;this.guide.visible=!!held;
  if(held){const length=Math.hypot(held.holdVX,held.holdVY)||1;this.points.set([held.x,held.y,.6,held.x+held.holdVX/length*5,held.y+Math.abs(held.holdVY)/length*5,.6]);this.guide.geometry.attributes.position.needsUpdate=true;this.guide.geometry.computeBoundingSphere();}
  let count=0;for(const b of game.bricks){if(b.hp<=0||!b.encounterRole||count>=8)continue;this.dummy.position.set(b.x,b.y,.65);this.dummy.rotation.set(0,0,0);this.dummy.scale.set(b.w*.7,.75,1);this.dummy.updateMatrix();this.rings.setMatrixAt(count,this.dummy.matrix);this.color.set(b.encounterRole==='generator'?'#ffe3a0':b.protected?'#aab4c4':'#8ffff0');this.rings.setColorAt(count++,this.color);}
  this.rings.count=count;if(count){this.rings.instanceMatrix.needsUpdate=true;this.rings.instanceColor.needsUpdate=true;}
  const enabled=trailColor&&!settings.reducedMotion&&!settings.lowEffects&&game.state==='playing';
  if(!enabled){this.history.length=0;for(const sprite of this.trails)sprite.visible=false;return;}
  const ball=game.balls.find(b=>!b.held);if(ball)this.history.unshift({x:ball.x,y:ball.y});this.history.length=Math.min(this.history.length,18);
  for(let i=0;i<this.trails.length;i++){const sprite=this.trails[i],p=this.history[i];sprite.visible=!!p;if(!p)continue;sprite.material.color.set(trailColor);sprite.position.set(p.x,p.y,.25);sprite.scale.setScalar(.35*(1-i/20));sprite.material.opacity=.13*(1-i/18);}
 }
}
