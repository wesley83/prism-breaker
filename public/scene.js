import * as T from './vendor/three.module.min.js';
import {WORLDS,POWERS,rng} from './levels.js';
import {Cinematic} from './cinematics.js';
import {Champion} from './champion.js';
import {DailyEnding} from './daily-ending.js';
import {EffectComposer,RenderPass,UnrealBloomPass,OutputPass,ShaderPass} from './postprocessing.js';
export class Stage {
 constructor(canvas,settings){
   this.canvas=canvas;this.settings=settings;this.renderer=new T.WebGLRenderer({canvas,antialias:true,alpha:false,powerPreference:'high-performance'});
   this.renderer.setPixelRatio(Math.min(devicePixelRatio,settings.lowEffects?1:1.8));this.renderer.outputColorSpace=T.SRGBColorSpace;this.renderer.toneMapping=T.ACESFilmicToneMapping;this.renderer.toneMappingExposure=1;
   this.scene=new T.Scene();this.camera=new T.PerspectiveCamera(42,1,.1,200);this.camera.position.set(0,-8,43);this.camera.lookAt(0,0,0);
   this.scene.add(new T.AmbientLight(0xffffff,1.2));const light=new T.DirectionalLight(0xffffff,2);light.position.set(-10,15,20);this.scene.add(light);
   this.glow=new T.PointLight(0x99ffc9,40,50);this.glow.position.set(0,5,7);this.scene.add(this.glow);
   this.world=new T.Group();this.scene.add(this.world);this.board=new T.Group();this.world.add(this.board);this.scenery=new T.Group();this.scene.add(this.scenery);
   this.dynamic=new T.Group();this.board.add(this.dynamic);this.cutGroup=new T.Group();this.scene.add(this.cutGroup);this.cutGroup.visible=false;
   this.box=new T.BoxGeometry(1,1,1);this.sphere=new T.SphereGeometry(1,14,10);this.octa=new T.OctahedronGeometry(1);this.bricks=new Map();this.balls=new Map();this.drops=new Map();this.shots=new Map();this.barriers=new Map();this.particles=[];this.decor=[];this.materials=[];
   this.haloTexture=this.makeHalo();this.powerGem=new T.IcosahedronGeometry(.46,1);this.powerOrb=new T.DodecahedronGeometry(.44);this.powerDiamond=new T.OctahedronGeometry(.5);this.powerRing=new T.TorusGeometry(.6,.045,8,32);this.powerDisc=new T.CircleGeometry(.34,24);const heart=new T.Shape();heart.moveTo(0,.1);heart.bezierCurveTo(0,.7,-.75,.65,-.75,.12);heart.bezierCurveTo(-.75,-.25,-.3,-.55,0,-.8);heart.bezierCurveTo(.3,-.55,.75,-.25,.75,.12);heart.bezierCurveTo(.75,.65,0,.7,0,.1);this.powerHeart=new T.ExtrudeGeometry(heart,{depth:.26,bevelEnabled:true,bevelThickness:.06,bevelSize:.06,bevelSegments:3,steps:1,curveSegments:12});this.powerHeart.center();this.powerHeart.scale(.55,.55,.55);this.makeBoard();this.resize();this.current=-1;this.ray=new T.Raycaster();this.plane=new T.Plane(new T.Vector3(0,0,1),0);this.point=new T.Vector3();
 }
 makeHalo(){const c=document.createElement('canvas');c.width=c.height=128;const ctx=c.getContext('2d'),g=ctx.createRadialGradient(64,64,0,64,64,64);g.addColorStop(0,'rgba(255,255,255,1)');g.addColorStop(.15,'rgba(255,255,255,.65)');g.addColorStop(.42,'rgba(255,255,255,.13)');g.addColorStop(1,'rgba(255,255,255,0)');ctx.fillStyle=g;ctx.fillRect(0,0,128,128);return new T.CanvasTexture(c);}
 ensureFX(){if(this.composer||this.settings.lowEffects||this.fxUnavailable)return;try{this.composer=new EffectComposer(this.renderer);this.composer.setPixelRatio(Math.min(1.15,this.renderer.getPixelRatio()));this.composer.addPass(new RenderPass(this.scene,this.camera));this.bloom=new UnrealBloomPass(new T.Vector2(this.width,this.height),.7,.5,1.25);this.composer.addPass(this.bloom);this.lens=new ShaderPass({uniforms:{tDiffuse:{value:null},vignette:{value:0},fade:{value:0},split:{value:0}},vertexShader:'varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}',fragmentShader:'uniform sampler2D tDiffuse;uniform float vignette;uniform float fade;uniform float split;varying vec2 vUv;void main(){vec2 d=vUv-0.5;vec2 offset=d*dot(d,d)*split;vec4 c=texture2D(tDiffuse,vUv);c.r=texture2D(tDiffuse,vUv+offset).r;c.b=texture2D(tDiffuse,vUv-offset).b;c.rgb*=1.0-vignette*smoothstep(0.1,0.7,length(d));c.rgb*=1.0-fade;gl_FragColor=c;}'});this.composer.addPass(this.lens);this.composer.addPass(new OutputPass());this.composer.setSize(this.width,this.height);}catch{this.composer?.dispose();this.composer=null;this.fxUnavailable=true;}}
 draw(dt,cinematic=false,fade=0,glowing=false){if(cinematic||glowing)this.ensureFX();if(this.composer&&!this.settings.lowEffects){this.bloom.strength=cinematic?.58:.5;this.bloom.threshold=cinematic?1.4:1.25;this.bloom.radius=cinematic?.68:.35;this.lens.uniforms.vignette.value=cinematic?.42:.08;this.lens.uniforms.fade.value=fade;this.lens.uniforms.split.value=cinematic&&!this.settings.reducedMotion?.009:0;this.composer.render(dt);}else this.renderer.render(this.scene,this.camera);}
 makePower(kind){const power=POWERS[kind],group=new T.Group(),rig=new T.Group();group.scale.setScalar(1.18);group.add(rig);group.userData.rig=rig;const bodyMaterial=new T.MeshPhysicalMaterial({color:power.color,metalness:.35,roughness:.18,clearcoat:this.settings.lowEffects?0:1,emissive:power.color,emissiveIntensity:.6});const geometry=kind==='life'?this.powerHeart:kind==='pierce'||kind==='laser'?this.powerDiamond:kind==='shield'||kind==='multi'?this.powerOrb:this.powerGem;const body=new T.Mesh(geometry,bodyMaterial);body.scale.z=1.2;if(kind==='wide')body.scale.set(1.35,.7,1.1);if(kind==='laser')body.scale.set(.7,1.3,1);rig.add(body);if(kind==='multi')for(let i=0;i<3;i++){const orb=new T.Mesh(this.powerGem,bodyMaterial);orb.scale.setScalar(.34);orb.position.set(Math.cos(i*2.09)*.45,Math.sin(i*2.09)*.45,.2);rig.add(orb);}
  const core=new T.Mesh(this.sphere,new T.MeshBasicMaterial({color:new T.Color(power.color).multiplyScalar(3.5)}));core.scale.setScalar(.22);rig.add(core);
  for(let i=0;i<(this.settings.lowEffects?1:2);i++){const ring=new T.Mesh(this.powerRing,new T.MeshBasicMaterial({color:new T.Color(power.color).multiplyScalar(2.2)}));ring.rotation.set(i?1.05:.45,i?.4:0,0);rig.add(ring);}
  const label=this.label(power.symbol,'#f0ffe9',true);label.scale.set(.85,.55,1);label.position.z=.58;group.add(label);
  const glow=new T.Sprite(new T.SpriteMaterial({map:this.haloTexture,color:power.color,transparent:true,opacity:.55,depthWrite:false,blending:T.AdditiveBlending,toneMapped:false}));glow.scale.set(2.6,2.6,1);group.add(glow);group.userData.glow=glow;
  if(!this.settings.lowEffects)for(let i=0;i<3;i++){const trail=new T.Sprite(new T.SpriteMaterial({map:this.haloTexture,color:power.color,transparent:true,opacity:.14/(i+1),depthWrite:false,blending:T.AdditiveBlending,toneMapped:false}));trail.position.set(0,.5+i*.38,-.12);trail.scale.setScalar(1-i*.17);group.add(trail);}return group;
 }
 material(color,emission=.15){const m=new T.MeshStandardMaterial({color,roughness:.28,metalness:.24,emissive:color,emissiveIntensity:emission});this.materials.push(m);return m;}
 cube(w,h,d,color,x=0,y=0,z=0,parent=this.board){const mesh=new T.Mesh(this.box,this.material(color));mesh.scale.set(w,h,d);mesh.position.set(x,y,z);parent.add(mesh);return mesh;}
 makeBoard(){
   this.floor=this.cube(20.4,25,.35,'#102a29',0,-.5,-.9);this.frame=[];
   for(const x of [-10.4,10.4]){this.frame.push(this.cube(.25,25.4,.6,'#49766b',x,-.5,-.3));this.cube(.7,26,.65,'#112a28',x,-.5,-.7);}
   this.frame.push(this.cube(21,.25,.6,'#49766b',0,12.25,-.3));this.cube(21,.6,.6,'#112a28',0,-13,-.6);
   const pts=[];for(let x=-10;x<=10;x+=2)pts.push(x,-13,-.69,x,12,-.69);for(let y=-12;y<=12;y+=2)pts.push(-10,y,-.69,10,y,-.69);
   const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(pts,3));this.grid=new T.LineSegments(geo,new T.LineBasicMaterial({color:0x70b8a3,transparent:true,opacity:.065}));this.board.add(this.grid);
   this.paddle=this.cube(3.3,.34,.55,'#e7ffcd',0,-10.6,.1);this.paddleLight=this.cube(2.7,.065,.06,'#b5ff6c',0,-10.82,.44);
   this.shield=this.cube(19.8,.06,.2,'#6af6d2',0,-12,.1);this.shield.visible=false;
   this.prism=new T.Mesh(new T.OctahedronGeometry(2),this.material('#b5ff6c',.8));this.cutGroup.add(this.prism);
   this.rings=[];for(let i=0;i<3;i++){const r=new T.Mesh(new T.TorusGeometry(3.6+i*.55,.025,8,80),this.material('#b5ff6c',.7));r.rotation.x=i*.7;r.rotation.y=i*.9;this.cutGroup.add(r);this.rings.push(r);}
   this.shards=[];for(let i=0;i<24;i++){const m=new T.Mesh(this.octa,this.material(WORLDS[0].colors[i%4],.6));m.scale.set(.12,.36,.12);this.cutGroup.add(m);this.shards.push(m);}
 }
 clearGroup(group){for(const child of [...group.children]){group.remove(child);if(child.userData.ownedGeometry)child.geometry.dispose();if(child.userData.ownedMaterial)child.material.dispose();}}
 setWorld(index){
   this.current=index;const w=WORLDS[index];this.scene.background=new T.Color(w.sky);this.scene.fog=new T.FogExp2(w.sky,.011);this.floor.material.color.set(w.sky);this.floor.material.emissive.set(w.sky);this.glow.color.set(w.accent);this.frame.forEach(m=>{m.material.color.set(w.accent);m.material.emissive.set(w.accent);});this.prism.material.color.set(w.accent);this.prism.material.emissive.set(w.accent);this.rings.forEach(m=>{m.material.color.set(w.accent);m.material.emissive.set(w.accent);});
   for(const d of this.decor){if(d.geometry!==this.box&&d.geometry!==this.octa&&d.geometry!==this.sphere)d.geometry.dispose();d.material.dispose();}this.clearGroup(this.scenery);this.decor=[];const rand=rng(338+index);
   for(let i=0;i<46;i++){
     let geometry=this.octa;let scale=.6+rand()*1.4;
     if(index===0)geometry=i%3===0?this.sphere:new T.ConeGeometry(.8,2.8,5);
     if(index===1)geometry=this.sphere;
     if(index===2||index===4||index===7)geometry=this.box;
     if(index===6)geometry=i%2?new T.TorusGeometry(1,.2,8,16):this.sphere;
     const material=new T.MeshStandardMaterial({color:w.colors[i%4],roughness:.48,metalness:.1,emissive:w.colors[i%4],emissiveIntensity:.13});
     const mesh=new T.Mesh(geometry,material);const side=i%2?-1:1;mesh.position.set(side*(12+rand()*13),-17+rand()*36,-3-rand()*11);mesh.scale.setScalar(scale);
     if(index===2||index===4||index===7)mesh.scale.set(scale*.8,scale*(2+rand()*4),scale);
     if(index===1)mesh.scale.set(scale*2,scale*.8,scale);
     if(index===3||index===5)mesh.scale.y*=2.5;
     mesh.rotation.set(rand()*.3,rand(),rand()*.3);mesh.userData.baseY=mesh.position.y;mesh.userData.phase=rand()*6.28;mesh.material.transparent=true;mesh.material.opacity=.65;this.scenery.add(mesh);this.decor.push(mesh);
   }
   if(this.stars){this.scene.remove(this.stars);this.stars.geometry.dispose();this.stars.material.dispose();}
   const stars=[];for(let i=0;i<150;i++)stars.push((rand()-.5)*90,(rand()-.5)*70,-10-rand()*35);
   const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(stars,3));this.stars=new T.Points(g,new T.PointsMaterial({color:w.accent,size:.07,transparent:true,opacity:.6}));this.scene.add(this.stars);
 }
 label(text,color='#fff',outlined=false){const c=document.createElement('canvas');c.width=128;c.height=64;const ctx=c.getContext('2d');ctx.fillStyle=color;ctx.font='bold 48px system-ui';ctx.textAlign='center';ctx.textBaseline='middle';if(outlined){ctx.strokeStyle='#14252a';ctx.lineWidth=7;ctx.strokeText(text,64,32);}ctx.fillText(text,64,32);const texture=new T.CanvasTexture(c);const mat=new T.SpriteMaterial({map:texture,transparent:true,depthTest:false});const s=new T.Sprite(mat);s.scale.set(.9,.45,1);s.userData.texture=texture;return s;}
 disposeObject(m){m.traverse(c=>{if(c.userData.texture)c.userData.texture.dispose();if(c.material)c.material.dispose();});this.dynamic.remove(m);}
 syncMap(map,items,create,update){const ids=new Set();for(const item of items){ids.add(item.id);let m=map.get(item.id);if(!m){m=create(item);map.set(item.id,m);this.dynamic.add(m);}update(m,item);}for(const [id,m]of map)if(!ids.has(id)){this.disposeObject(m);map.delete(id);}}
 reset(){for(const map of [this.bricks,this.balls,this.drops,this.shots,this.barriers]){for(const m of map.values())this.disposeObject(m);map.clear();}for(const m of this.portalMeshes||[]){this.board.remove(m);m.geometry.dispose();m.material.dispose();}this.portalMeshes=[];for(const p of this.particles){this.board.remove(p.mesh);p.mesh.material.dispose();}this.particles=[];}
 particle(x,y,color,n=12){if(this.settings.reducedMotion)return;if(this.settings.lowEffects)n=4;for(let i=0;i<n;i++){
   const mesh=new T.Mesh(this.octa,new T.MeshBasicMaterial({color,transparent:true}));mesh.scale.setScalar(.04+Math.random()*.13);mesh.position.set(x,y,.4);this.board.add(mesh);this.particles.push({mesh,vx:(Math.random()-.5)*10,vy:(Math.random()-.5)*10,vz:Math.random()*5,life:.6+Math.random()*.25,total:.85});
 }}
 event(e){if(e.type==='break')this.particle(e.x,e.y,e.color,e.kind==='explode'?26:12);if(e.type==='paddle'||e.type==='portal')this.particle(e.x,e.y,WORLDS[this.current<0?0:this.current].accent,5);}
 resize(){const r=this.canvas.parentElement.getBoundingClientRect();this.renderer.setSize(r.width,r.height,false);this.camera.aspect=r.width/r.height;this.camera.updateProjectionMatrix();this.width=r.width;this.height=r.height;if(this.composer){this.composer.setPixelRatio(Math.min(1.15,this.renderer.getPixelRatio()));this.composer.setSize(r.width,r.height);}}
 screenX(clientX,clientY){const r=this.canvas.getBoundingClientRect();this.ray.setFromCamera(new T.Vector2((clientX-r.left)/r.width*2-1,-(clientY-r.top)/r.height*2+1),this.camera);this.ray.ray.intersectPlane(this.plane,this.point);return this.point.x-this.world.position.x;}
 render(game,dt,time,mode='game',cut=0){
   if(this.current!==game.level){this.setWorld(game.level);this.reset();}
   const isHome=mode==='home',isChampion=mode==='champion',isCut=mode==='cut'||isChampion;
   const narrow=this.width<600;const desiredZ=narrow?Math.max(43,24/(this.camera.aspect*.75)):43;
   const isDaily=isCut&&game.mode==='daily';this.scene.background.set(isDaily?'#051925':WORLDS[game.level].sky);this.scene.fog.color.set(isDaily?'#051925':WORLDS[game.level].sky);
   this.renderer.toneMappingExposure=isCut?.85:1;this.board.visible=!isCut;this.scenery.visible=!isCut;if(this.stars)this.stars.visible=!isCut;this.cutGroup.visible=false;if(this.cinematic)this.cinematic.group.visible=isCut&&!isChampion&&!isDaily;if(this.champion)this.champion.group.visible=isChampion&&!isDaily;if(this.dailyEnding)this.dailyEnding.group.visible=isDaily;
   if(isCut){let frame;if(isDaily){if(!this.dailyEnding)this.dailyEnding=new DailyEnding(this.scene,this.haloTexture);frame=this.dailyEnding.render(cut,this.camera.aspect,this.settings,isChampion,game.seed);}else if(isChampion){if(!this.champion)this.champion=new Champion(this.scene,this.haloTexture);frame=this.champion.render(cut,this.camera.aspect,this.settings);}else{if(!this.cinematic)this.cinematic=new Cinematic(this.scene,this.haloTexture);frame=this.cinematic.render(game.level,cut,this.camera.aspect,this.settings);}this.camera.position.set(...frame.position);this.camera.up.set(Math.sin(frame.roll),Math.cos(frame.roll),0);this.camera.fov=frame.fov;this.camera.lookAt(...frame.target);this.camera.updateProjectionMatrix();this.wasCut=true;this.draw(dt,true,frame.fade);return;}
   if(this.wasCut){this.camera.position.set(0,-7,desiredZ);this.wasCut=false;}this.camera.position.x=0;this.camera.up.set(0,1,0);this.camera.fov=42;
   this.camera.position.z=this.settings.reducedMotion?desiredZ:this.camera.position.z+(desiredZ-this.camera.position.z)*Math.min(1,dt*5);
   this.camera.position.y=-7;this.camera.lookAt(0,0,0);this.camera.updateProjectionMatrix();
   const homeX=narrow?0:7.4;this.world.position.x=this.settings.reducedMotion?(isHome?homeX:0):this.world.position.x+((isHome?homeX:0)-this.world.position.x)*Math.min(1,dt*4);
   for(const d of this.decor)if(!this.settings.reducedMotion){d.position.y=d.userData.baseY+Math.sin(time*.35+d.userData.phase)*.35;if(game.level!==2&&game.level!==4)d.rotation.y+=dt*.1;}
   this.syncMap(this.bricks,game.bricks.filter(b=>b.hp>0),b=>{
     const m=new T.Group();const block=new T.Mesh(this.box,new T.MeshStandardMaterial({color:b.color,emissive:b.color,emissiveIntensity:.25,roughness:.23,metalness:.25}));block.scale.set(b.w,b.h,.62);m.add(block);
     const shine=new T.Mesh(this.box,new T.MeshBasicMaterial({color:b.color,toneMapped:false}));shine.scale.set(b.w*.94,b.h*.76,.02);shine.position.set(0,0,.32);m.add(shine);
     if(b.kind!=='normal'){const text=this.label(b.kind==='armor'?'II':b.kind==='switch'?'◇':'✦','#12232d');text.position.z=.4;m.add(text);}return m;
   },(m,b)=>{m.position.set(b.x,b.y,0);m.children[0].material.emissiveIntensity=b.hp<b.maxHp?.04:.25;m.scale.setScalar(b.hp<b.maxHp?.95:1);});
   this.syncMap(this.balls,game.balls,b=>{const m=new T.Mesh(this.sphere,new T.MeshBasicMaterial({color:'#ffffff'}));m.scale.setScalar(b.r);return m;},(m,b)=>{m.position.set(b.x,b.y,.42);m.material.color.set(game.effects.pierce?'#d4b6ff':'#ffffff');});
   this.syncMap(this.drops,game.drops,d=>this.makePower(d.kind),(m,d)=>{const t=this.settings.reducedMotion?0:time;m.position.set(d.x,d.y,.6);m.userData.rig.rotation.set(.3+Math.sin(t*1.7+d.id)*.2,t*.9+d.id,Math.sin(t*2+d.id)*.15);m.userData.glow.material.opacity=.48+Math.sin(t*3+d.id)*.08;});
   this.syncMap(this.shots,game.shots,()=>{const m=new T.Mesh(this.box,new T.MeshBasicMaterial({color:'#ffbdcc'}));m.scale.set(.08,.6,.12);return m;},(m,s)=>m.position.set(s.x,s.y,.3));
   this.syncMap(this.barriers,game.barriers,o=>{const m=new T.Mesh(this.box,new T.MeshStandardMaterial({color:WORLDS[game.level].accent,emissive:WORLDS[game.level].accent,emissiveIntensity:.45,metalness:.8,roughness:.2}));m.scale.set(o.w,o.h,.55);return m;},(m,o)=>m.position.set(o.x,o.y,.1));
   if(!this.portalMeshes?.length&&game.portals.length){this.portalMeshes=game.portals.map((p,i)=>{const m=new T.Mesh(new T.TorusGeometry(.7,.08,10,32),new T.MeshBasicMaterial({color:i?'#ec99ff':'#6ffff0'}));m.position.set(p.x,p.y,.2);this.board.add(m);return m;});}
   this.paddle.position.x=game.paddle.x;this.paddle.scale.x=game.paddle.w;this.paddleLight.position.x=game.paddle.x;this.paddleLight.scale.x=game.paddle.w*.8;this.paddleLight.material.color.set(game.effects.laser?'#ff718a':game.effects.sticky?'#ffd77c':WORLDS[game.level].accent);this.shield.visible=game.shield;
   for(const p of this.particles){p.life-=dt;p.mesh.position.x+=p.vx*dt;p.mesh.position.y+=p.vy*dt;p.mesh.position.z+=p.vz*dt;p.vz-=dt*8;p.mesh.rotation.x+=dt*5;p.mesh.material.opacity=Math.max(0,p.life/p.total);}
   this.particles=this.particles.filter(p=>{if(p.life>0)return true;this.board.remove(p.mesh);p.mesh.material.dispose();return false;});
   this.draw(dt,false,0,game.drops.length>0);
 }
}
