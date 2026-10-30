import {THEMES} from './world-schema.js';
import * as T from './vendor/three.module.min.js';
import {WORLDS,POWERS,rng} from './levels.js';
import {brickMark,drawBrickMarker,updateBrickMarker} from './brick-labels.js?v=2';
import {crystalResources} from './crystal-bricks.js';
import {BrickBatch} from './brick-batch.js';
import {ParticleBatch} from './particle-batch.js';
import {SceneryBatch} from './scenery-batch.js';
import {RenderBudget} from './render-budget.js';
import {makePaddle,updatePaddle} from './paddle-art.js';
import {EngagementArt} from './engagement-art.js';
import {ENGAGEMENT} from './engagement-data.js';
import {Cinematic} from './cinematics.js';
import {MasteryCeremony} from './mastery-ceremony.js';
import {Champion} from './champion.js';
import {DailyEnding} from './daily-ending.js';
import {EffectComposer,RenderPass,UnrealBloomPass,OutputPass,ShaderPass} from './postprocessing.js';
export class Stage {
 constructor(canvas,settings){
   this.canvas=canvas;this.settings=settings;this.renderer=new T.WebGLRenderer({canvas,antialias:true,alpha:false,powerPreference:'high-performance'});
   this.budget=new RenderBudget();this.renderer.info.autoReset=false;this.renderer.setPixelRatio(Math.min(devicePixelRatio,settings.lowEffects?1:1.25));this.renderer.outputColorSpace=T.SRGBColorSpace;this.renderer.toneMapping=T.ACESFilmicToneMapping;this.renderer.toneMappingExposure=1;
   this.scene=new T.Scene();this.camera=new T.PerspectiveCamera(42,1,.1,200);this.camera.position.set(0,-8,43);this.camera.lookAt(0,0,0);
   this.scene.add(new T.AmbientLight(0xffffff,1.2));const light=new T.DirectionalLight(0xffffff,2);light.position.set(-10,15,20);this.scene.add(light);
   this.glow=new T.PointLight(0x99ffc9,40,50);this.glow.position.set(0,5,7);this.scene.add(this.glow);
   this.world=new T.Group();this.scene.add(this.world);this.board=new T.Group();this.world.add(this.board);this.scenery=new T.Group();this.scene.add(this.scenery);
   this.dynamic=new T.Group();this.board.add(this.dynamic);this.cutGroup=new T.Group();this.scene.add(this.cutGroup);this.cutGroup.visible=false;
   this.box=new T.BoxGeometry(1,1,1);this.sphere=new T.SphereGeometry(1,14,10);this.octa=new T.OctahedronGeometry(1);this.bricks=new Map();this.balls=new Map();this.drops=new Map();this.shots=new Map();this.barriers=new Map();this.syncToken=0;this.pointer=new T.Vector2();this.decor=[];this.materials=[];
   this.haloTexture=this.makeHalo();this.powerGem=new T.IcosahedronGeometry(.46,1);this.powerOrb=new T.DodecahedronGeometry(.44);this.powerDiamond=new T.OctahedronGeometry(.5);this.powerRing=new T.TorusGeometry(.6,.045,8,32);this.powerDisc=new T.CircleGeometry(.34,24);const heart=new T.Shape();heart.moveTo(0,.1);heart.bezierCurveTo(0,.7,-.75,.65,-.75,.12);heart.bezierCurveTo(-.75,-.25,-.3,-.55,0,-.8);heart.bezierCurveTo(.3,-.55,.75,-.25,.75,.12);heart.bezierCurveTo(.75,.65,0,.7,0,.1);this.powerHeart=new T.ExtrudeGeometry(heart,{depth:.26,bevelEnabled:true,bevelThickness:.06,bevelSize:.06,bevelSegments:3,steps:1,curveSegments:12});this.powerHeart.center();this.powerHeart.scale(.55,.55,.55);this.makeBoard();this.resize();this.current=-1;this.ray=new T.Raycaster();this.plane=new T.Plane(new T.Vector3(0,0,1),0);this.point=new T.Vector3();
 }
 async prepareCut(game,mode='cut'){
  if(mode==='award'){this.masteryCeremony??=new MasteryCeremony(this.scene,this.haloTexture,this.crystals.environment);this.masteryCeremony.render(0,this.camera.aspect,this.settings,this.awardTier,this.awardMedal);}
  else if(game.mode==='daily'){this.dailyEnding??=new DailyEnding(this.scene,this.haloTexture,this.crystals.environment);this.dailyEnding.render(0,this.camera.aspect,this.settings,mode==='champion',game.seed);}
  else if(mode==='champion'){this.champion??=new Champion(this.scene,this.haloTexture,this.crystals.environment);this.champion.render(0,this.camera.aspect,this.settings);}
  else{this.cinematic??=new Cinematic(this.scene,this.haloTexture,this.crystals.environment);this.cinematic.render(THEMES.indexOf(game.world.shape),0,this.camera.aspect,this.settings,game.world);}
  // Compile while controls are paused; Three.js async polling can outlive a lost context.
   this.renderer.compile(this.scene,this.camera);
 }
 async prepare(game){
  this.engagementArt??=new EngagementArt(this.board,this.haloTexture);
  // Keep compilation, texture uploads and bloom allocation out of the first brick hit.
  const mode=this.settings.lowEffects?'low':'full';this.powerPools??=new Map();
  if(this.preparedModes?.has(mode))return;
  this.render(game,0,0,'home');this.preparing=true;this.canvas.style.visibility='hidden';
  const warm=new T.Group();this.scene.add(warm);
  try{
   let i=0;
   for(const kind of Object.keys(POWERS)){
    const key=mode+':'+kind,pool=this.powerPools.get(key)||[];this.powerPools.set(key,pool);
    while(pool.length<2){const power=this.makePower(kind);power.userData.poolKey=key;pool.push(power);}
    for(const power of pool){power.position.set((i%4-1.5)*3,Math.floor(i/4)*3-6,2);warm.add(power);i++;}
   }
   for(const paddle of [this.paddle,this.classicPaddle])paddle.traverse(object=>{if(object.isMesh||object.isSprite){const sample=object.isSprite?new T.Sprite(object.material):new T.Mesh(object.geometry,object.material);sample.position.set(0,-8,2);warm.add(sample);}});
   // Upload reusable fragments before play, including their transparent material variant.
   this.particleBatch.warm(warm);this.brickBatch.warm(warm);this.engagementArt.warm(warm);
   // Compile while controls are paused; Three.js async polling can outlive a lost context.
   this.renderer.compile(this.scene,this.camera);
   this.renderer.initTexture(this.haloTexture);this.renderer.initTexture(this.brickBatch.atlas);
   warm.traverse(object=>{if(object.userData.texture)this.renderer.initTexture(object.userData.texture);});
   this.ensureFX();this.draw(0,false,0,true);
   await new Promise(resolve=>requestAnimationFrame(resolve));
   this.draw(0,false,0,true);
   this.preparedModes??=new Set();this.preparedModes.add(mode);
  }finally{
   this.scene.remove(warm);warm.traverse(object=>{if(object.isInstancedMesh)object.dispose();});warm.clear();this.preparing=false;
   try{this.render(game,0,0,'home');}finally{this.canvas.style.visibility='';}
  }
 }
 acquirePower(kind){const key=(this.settings.lowEffects?'low':'full')+':'+kind,pool=this.powerPools?.get(key);const power=pool?.pop()||this.makePower(kind);power.userData.poolKey=key;return power;}
 makeHalo(){const c=document.createElement('canvas');c.width=c.height=128;const ctx=c.getContext('2d'),g=ctx.createRadialGradient(64,64,0,64,64,64);g.addColorStop(0,'rgba(255,255,255,1)');g.addColorStop(.15,'rgba(255,255,255,.65)');g.addColorStop(.42,'rgba(255,255,255,.13)');g.addColorStop(1,'rgba(255,255,255,0)');ctx.fillStyle=g;ctx.fillRect(0,0,128,128);return new T.CanvasTexture(c);}
 ensureFX(){if(this.composer||this.settings.lowEffects||this.fxUnavailable)return;try{this.composer=new EffectComposer(this.renderer);this.effectPixelRatio=Math.min(1,this.renderer.getPixelRatio());this.composer.setPixelRatio(this.effectPixelRatio);this.composer.addPass(new RenderPass(this.scene,this.camera));this.bloom=new UnrealBloomPass(new T.Vector2(this.width,this.height),.7,.5,1.25);this.composer.addPass(this.bloom);this.lens=new ShaderPass({uniforms:{tDiffuse:{value:null},vignette:{value:0},fade:{value:0},split:{value:0}},vertexShader:'varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}',fragmentShader:'uniform sampler2D tDiffuse;uniform float vignette;uniform float fade;uniform float split;varying vec2 vUv;void main(){vec2 d=vUv-0.5;vec2 offset=d*dot(d,d)*split;vec4 c=texture2D(tDiffuse,vUv);c.r=texture2D(tDiffuse,vUv+offset).r;c.b=texture2D(tDiffuse,vUv-offset).b;c.rgb*=1.0-vignette*smoothstep(0.1,0.7,length(d));c.rgb*=1.0-fade;gl_FragColor=c;}'});this.composer.addPass(this.lens);this.composer.addPass(new OutputPass());this.composer.setSize(this.width,this.height);}catch{this.composer?.dispose();this.composer=null;this.fxUnavailable=true;}}
 draw(dt,cinematic=false,fade=0,glowing=false){this.canvas.style.opacity=(this.settings.lowEffects||this.fxUnavailable)&&cinematic?String(1-fade):'1';if(cinematic||glowing)this.ensureFX();this.renderer.info.autoReset=false;this.renderer.info.reset();if(this.composer&&!this.settings.lowEffects&&(cinematic||glowing)){this.bloom.strength=cinematic?.58:.5;this.bloom.threshold=cinematic?1.4:1.25;this.bloom.radius=cinematic?.68:.35;this.lens.uniforms.vignette.value=cinematic?.42:.08;this.lens.uniforms.fade.value=fade;this.lens.uniforms.split.value=cinematic&&!this.settings.reducedMotion?.009:0;this.composer.render(dt);}else this.renderer.render(this.scene,this.camera);}
 makePower(kind){const power=POWERS[kind],group=new T.Group(),rig=new T.Group();group.scale.setScalar(1.18);group.add(rig);group.userData.rig=rig;const bodyMaterial=new T.MeshPhysicalMaterial({color:power.color,metalness:.35,roughness:.18,clearcoat:this.settings.lowEffects?0:1,emissive:power.color,emissiveIntensity:.6});const geometry=kind==='life'?this.powerHeart:kind==='pierce'||kind==='laser'?this.powerDiamond:kind==='shield'||kind==='multi'?this.powerOrb:this.powerGem;const body=new T.Mesh(geometry,bodyMaterial);body.scale.z=1.2;if(kind==='wide')body.scale.set(1.35,.7,1.1);if(kind==='laser')body.scale.set(.7,1.3,1);rig.add(body);if(kind==='multi')for(let i=0;i<3;i++){const orb=new T.Mesh(this.powerGem,bodyMaterial);orb.scale.setScalar(.34);orb.position.set(Math.cos(i*2.09)*.45,Math.sin(i*2.09)*.45,.2);rig.add(orb);}
  const core=new T.Mesh(this.sphere,new T.MeshBasicMaterial({color:new T.Color(power.color).multiplyScalar(3.5)}));core.scale.setScalar(.22);rig.add(core);
  for(let i=0;i<(this.settings.lowEffects?1:2);i++){const ring=new T.Mesh(this.powerRing,new T.MeshBasicMaterial({color:new T.Color(power.color).multiplyScalar(2.2)}));ring.rotation.set(i?1.05:.45,i?.4:0,0);rig.add(ring);}
  this.powerLabels??=new Map();let labelTexture=this.powerLabels.get(kind),label;
  if(labelTexture){label=new T.Sprite(new T.SpriteMaterial({map:labelTexture,transparent:true,depthTest:false}));}
  else{label=this.label(power.symbol,'#f0ffe9',true);labelTexture=label.userData.texture;this.powerLabels.set(kind,labelTexture);}
  label.userData.texture=labelTexture;label.userData.sharedTexture=true;label.scale.set(.85,.55,1);label.position.z=.58;group.add(label);
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
   this.crystals??=crystalResources();this.brickBatch=new BrickBatch(this.crystals);this.board.add(this.brickBatch.group);this.particleBatch=new ParticleBatch(this.octa);this.board.add(this.particleBatch.mesh);this.paddle=makePaddle(this.haloTexture,this.crystals.environment);this.board.add(this.paddle);
   this.classicPaddle=new T.Group();this.board.add(this.classicPaddle);
   this.classicPaddleBody=this.cube(3.3,.34,.55,'#e7ffcd',0,0,0,this.classicPaddle);
   this.classicPaddleLight=this.cube(2.7,.065,.06,'#b5ff6c',0,-.22,.34,this.classicPaddle);
   this.classicPaddle.visible=!!this.settings.classicMode;this.paddle.visible=!this.classicPaddle.visible;
   this.shield=this.cube(19.8,.06,.2,'#6af6d2',0,-12,.1);this.shield.visible=false;
   this.prism=new T.Mesh(new T.OctahedronGeometry(2),this.material('#b5ff6c',.8));this.cutGroup.add(this.prism);
   this.rings=[];for(let i=0;i<3;i++){const r=new T.Mesh(new T.TorusGeometry(3.6+i*.55,.025,8,80),this.material('#b5ff6c',.7));r.rotation.x=i*.7;r.rotation.y=i*.9;this.cutGroup.add(r);this.rings.push(r);}
   this.shards=[];for(let i=0;i<24;i++){const m=new T.Mesh(this.octa,this.material(WORLDS[0].colors[i%4],.6));m.scale.set(.12,.36,.12);this.cutGroup.add(m);this.shards.push(m);}
 }
 clearGroup(group){for(const child of [...group.children]){group.remove(child);if(child.userData.ownedGeometry)child.geometry.dispose();if(child.userData.ownedMaterial)child.material.dispose();}}
 setWorld(index,definition=WORLDS[index]){
   this.current=index;this.currentDefinition=definition;this.backgroundKey=null;const w=definition;index=THEMES.indexOf(w.shape);this.scene.background=new T.Color(w.sky);this.scene.fog=new T.FogExp2(w.sky,.011);this.floor.material.color.set(w.sky);this.floor.material.emissive.set(w.sky);this.glow.color.set(w.accent);this.frame.forEach(m=>{m.material.color.set(w.accent);m.material.emissive.set(w.accent);});this.prism.material.color.set(w.accent);this.prism.material.emissive.set(w.accent);this.rings.forEach(m=>{m.material.color.set(w.accent);m.material.emissive.set(w.accent);});
   this.sceneryBatch?.dispose();this.clearGroup(this.scenery);this.sceneryLow=!!this.settings.lowEffects;
   this.sceneryBatch=new SceneryBatch(index,w,{box:this.box,sphere:this.sphere,octa:this.octa},this.sceneryLow);this.scenery.add(this.sceneryBatch.group);const rand=rng(338+index);
   if(this.stars){this.scene.remove(this.stars);this.stars.geometry.dispose();this.stars.material.dispose();}
   const stars=[];for(let i=0;i<150;i++)stars.push((rand()-.5)*90,(rand()-.5)*70,-10-rand()*35);
   const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(stars,3));this.stars=new T.Points(g,new T.PointsMaterial({color:w.accent,size:.07,transparent:true,opacity:.6}));this.scene.add(this.stars);
 }
 label(text,color='#fff',outlined=false){const c=document.createElement('canvas');c.width=128;c.height=64;const ctx=c.getContext('2d');ctx.fillStyle=color;ctx.font='bold 48px system-ui';ctx.textAlign='center';ctx.textBaseline='middle';if(outlined){ctx.strokeStyle='#14252a';ctx.lineWidth=7;ctx.strokeText(text,64,32);}ctx.fillText(text,64,32);const texture=new T.CanvasTexture(c);const mat=new T.SpriteMaterial({map:texture,transparent:true,depthTest:false});const s=new T.Sprite(mat);s.scale.set(.9,.45,1);s.userData.texture=texture;return s;}
 brickMarkerTexture(mark){this.brickMarkerTextures??=new Map();if(!this.brickMarkerTextures.has(mark)){const canvas=document.createElement('canvas');canvas.width=canvas.height=128;drawBrickMarker(canvas.getContext('2d'),mark);const texture=new T.CanvasTexture(canvas);texture.colorSpace=T.SRGBColorSpace;this.brickMarkerTextures.set(mark,texture);}return this.brickMarkerTextures.get(mark);}
 brickMarkerBase(){return this.brickMarkerMaterial??=new T.SpriteMaterial({map:this.brickMarkerTexture('2'),transparent:true,depthTest:false,fog:false,toneMapped:false});}
 makeBrickMarker(brick){const mark=brickMark(brick);if(mark===null)return null;const texture=this.brickMarkerTexture(mark),material=this.brickMarkerBase().clone();material.map=texture;const sprite=new T.Sprite(material);sprite.scale.set(.67,.67,1);sprite.position.z=.48;sprite.renderOrder=3;sprite.userData.texture=texture;sprite.userData.sharedTexture=true;sprite.userData.brickMark=mark;return sprite;}
 classicBrickMaterial(){return this.classicBrickBase??=new T.MeshStandardMaterial({color:'#fff',emissive:'#fff',emissiveIntensity:.25,roughness:.23,metalness:.25});}
 classicShineMaterial(){return this.classicShineBase??=new T.MeshBasicMaterial({color:'#fff',toneMapped:false});}
 makeClassicBrick(brick){
  const group=new T.Group(),material=this.classicBrickMaterial().clone();material.color.set(brick.color);material.emissive.set(brick.color);
  const body=new T.Mesh(this.box,material);body.scale.set(brick.w,brick.h,.62);group.add(body);
  const face=new T.Mesh(this.box,this.classicShineMaterial().clone());face.material.color.set(brick.color);face.scale.set(brick.w*.94,brick.h*.76,.02);face.position.z=.32;group.add(face);return group;
 }
 syncAppearance(){
  const classic=!!this.settings.classicMode;if(classic===this.classicAppearance)return;
  for(const mesh of this.bricks.values())this.disposeObject(mesh);this.bricks.clear();this.classicAppearance=classic;
  this.classicPaddle.visible=classic;this.paddle.visible=!classic;
 }
 disposeObject(m){this.dynamic.remove(m);if(m.userData.poolKey){const pool=this.powerPools.get(m.userData.poolKey);if(pool&&pool.length<8){pool.push(m);return;}}m.traverse(c=>{if(c.userData.texture&&!c.userData.sharedTexture)c.userData.texture.dispose();if(c.material)c.material.dispose();});}
 syncMap(map,items,create,update,liveBricks=false){const token=++this.syncToken;for(const item of items){if(liveBricks&&item.hp<=0)continue;let m=map.get(item.id);if(!m){m=create(item);map.set(item.id,m);this.dynamic.add(m);}m.userData.syncToken=token;update(m,item);}for(const [id,m]of map)if(m.userData.syncToken!==token){this.disposeObject(m);map.delete(id);}}
 reset(){for(const map of [this.bricks,this.balls,this.drops,this.shots,this.barriers]){for(const m of map.values())this.disposeObject(m);map.clear();}for(const m of this.portalMeshes||[]){this.board.remove(m);m.geometry.dispose();m.material.dispose();}this.portalMeshes=[];this.brickBatch.clear();this.particleBatch.clear();}
 particle(x,y,color,n=12){if(this.settings.reducedMotion)return;this.particleBatch.setLow(this.settings.lowEffects);this.particleBatch.emit(x,y,color,this.settings.lowEffects?4:n);}
 event(e){if(e.type==='break')this.particle(e.x,e.y,e.color,e.kind==='explode'?26:12);if(e.type==='combo')this.particle(e.x,e.y,e.color,18);if(e.type==='paddle'||e.type==='portal')this.particle(e.x,e.y,(this.currentDefinition||WORLDS[0]).accent,5);}
 resolutionRatio(){const ceiling=Math.min(devicePixelRatio,this.settings.lowEffects?1:1.25),floor=Math.min(ceiling,this.settings.lowEffects?.65:.75);return Math.max(floor,Math.round(ceiling*this.budget.scale*100)/100);}
 configureQuality(){this.budget.scale=1;this.budget.reset();this.resize();}
 observeFrame(frameMS,active){if(this.budget.sample(frameMS,this.lastRenderMS||0,active))this.resize();}
 performanceInfo(){return {...this.budget.last,cpuRenderMS:this.lastRenderMS||0,drawCalls:this.renderer.info.render.calls,triangles:this.renderer.info.render.triangles,pixelRatio:this.renderer.getPixelRatio(),particles:this.particleBatch.count,bricks:this.brickBatch.records.size,sceneryDraws:this.sceneryBatch?.batches.length||0};}
 resize(){const r=this.canvas.getBoundingClientRect();if(!r.width||!r.height)return;const ratio=this.resolutionRatio(),sizeChanged=r.width!==this.width||r.height!==this.height;
  if(this.renderer.getPixelRatio()!==ratio)this.renderer.setPixelRatio(ratio);if(sizeChanged)this.renderer.setSize(r.width,r.height,false);
  this.camera.aspect=r.width/r.height;this.camera.updateProjectionMatrix();this.width=r.width;this.height=r.height;
  if(this.composer){const effectRatio=Math.min(1,ratio);if(this.effectPixelRatio!==effectRatio){this.effectPixelRatio=effectRatio;this.composer.setPixelRatio(effectRatio);}if(sizeChanged)this.composer.setSize(r.width,r.height);}
 }
 screenX(clientX,clientY){const r=this.canvas.getBoundingClientRect();this.pointer.set((clientX-r.left)/r.width*2-1,-(clientY-r.top)/r.height*2+1);this.ray.setFromCamera(this.pointer,this.camera);this.ray.ray.intersectPlane(this.plane,this.point);return this.point.x-this.world.position.x;}
 render(game,dt,time,mode='game',cut=0){if(this.preparing)return;const start=performance.now();this.renderScene(game,dt,time,mode,cut);this.lastRenderMS=performance.now()-start;}
 renderScene(game,dt,time,mode='game',cut=0){
   if(this.preparing)return;
   if(this.current!==game.level||this.currentDefinition!==game.world||this.sceneryLow!==!!this.settings.lowEffects){this.setWorld(game.level,game.world);this.reset();}
   this.syncAppearance();
   const isHome=mode==='home',isChampion=mode==='champion',isAward=mode==='award',isCut=mode==='cut'||isChampion||isAward;
   const narrow=this.width<600;const desiredZ=narrow?Math.max(43,24/(this.camera.aspect*.75)):43;
   const isDaily=isCut&&!isAward&&game.mode==='daily',background=isAward?'#06131d':isDaily?'#051925':game.world.sky;if(this.backgroundKey!==background){this.scene.background.set(background);this.scene.fog.color.set(background);this.backgroundKey=background;}
   this.renderer.toneMappingExposure=isCut?.85:1;this.board.visible=!isCut;this.scenery.visible=!isCut;if(this.stars)this.stars.visible=!isCut;this.cutGroup.visible=false;if(this.cinematic)this.cinematic.group.visible=isCut&&!isChampion&&!isDaily&&!isAward;if(this.champion)this.champion.group.visible=isChampion&&!isDaily;if(this.dailyEnding)this.dailyEnding.group.visible=isDaily;if(this.masteryCeremony)this.masteryCeremony.group.visible=isAward;
   if(isCut){let frame;if(isAward){this.masteryCeremony??=new MasteryCeremony(this.scene,this.haloTexture,this.crystals.environment);frame=this.masteryCeremony.render(cut,this.camera.aspect,this.settings,this.awardTier,this.awardMedal);}else if(isDaily){if(!this.dailyEnding)this.dailyEnding=new DailyEnding(this.scene,this.haloTexture,this.crystals.environment);frame=this.dailyEnding.render(cut,this.camera.aspect,this.settings,isChampion,game.seed);}else if(isChampion){if(!this.champion)this.champion=new Champion(this.scene,this.haloTexture,this.crystals.environment);frame=this.champion.render(cut,this.camera.aspect,this.settings);}else{if(!this.cinematic)this.cinematic=new Cinematic(this.scene,this.haloTexture,this.crystals.environment);frame=this.cinematic.render(THEMES.indexOf(game.world.shape),cut,this.camera.aspect,this.settings,game.world);}this.camera.position.set(...frame.position);this.camera.up.set(Math.sin(frame.roll),Math.cos(frame.roll),0);this.camera.fov=frame.fov;this.camera.lookAt(...frame.target);this.camera.updateProjectionMatrix();this.wasCut=true;this.draw(dt,true,frame.fade);return;}
   if(this.wasCut){this.camera.position.set(0,-7,desiredZ);this.wasCut=false;}this.camera.position.x=0;this.camera.up.set(0,1,0);if(this.camera.fov!==42){this.camera.fov=42;this.camera.updateProjectionMatrix();}
   this.camera.position.z=this.settings.reducedMotion?desiredZ:this.camera.position.z+(desiredZ-this.camera.position.z)*Math.min(1,dt*5);
   this.camera.position.y=-7;this.camera.lookAt(0,0,0);
   const homeX=narrow?0:7.4;this.world.position.x=this.settings.reducedMotion?(isHome?homeX:0):this.world.position.x+((isHome?homeX:0)-this.world.position.x)*Math.min(1,dt*4);
   this.sceneryBatch.update(dt,time,this.settings.reducedMotion);
   this.brickBatch.sync(game.bricks,this.classicAppearance,this.settings.lowEffects);
   this.engagementArt??=new EngagementArt(this.board,this.haloTexture);this.engagementArt.group.visible=!isHome;
   if(!isHome){const trail=ENGAGEMENT.cosmetics.find(c=>c.id===this.settings.ballTrail&&c.kind==='trail');this.engagementArt.update(game,this.settings,trail?.id==='none'?null:trail?.color);}
   this.syncMap(this.balls,game.balls,b=>{const m=new T.Mesh(this.sphere,new T.MeshBasicMaterial({color:'#ffffff'}));m.scale.setScalar(b.r);return m;},(m,b)=>{m.position.set(b.x,b.y,.42);m.material.color.set(game.engagement.enabled?'#ffffff':game.effects.pierce?'#d4b6ff':'#ffffff');});
   this.syncMap(this.drops,game.drops,d=>this.acquirePower(d.kind),(m,d)=>{const t=this.settings.reducedMotion?0:time;m.position.set(d.x,d.y,.6);m.userData.rig.rotation.set(.3+Math.sin(t*1.7+d.id)*.2,t*.9+d.id,Math.sin(t*2+d.id)*.15);m.userData.glow.material.opacity=.48+Math.sin(t*3+d.id)*.08;});
   this.syncMap(this.shots,game.shots,()=>{const m=new T.Mesh(this.box,new T.MeshBasicMaterial({color:'#ffbdcc'}));m.scale.set(.08,.6,.12);return m;},(m,s)=>m.position.set(s.x,s.y,.3));
   this.syncMap(this.barriers,game.barriers,o=>{const m=new T.Mesh(this.box,new T.MeshStandardMaterial({color:game.world.accent,emissive:game.world.accent,emissiveIntensity:.45,metalness:.8,roughness:.2}));m.scale.set(o.w,o.h,.55);return m;},(m,o)=>m.position.set(o.x,o.y,.1));
   if(!this.portalMeshes?.length&&game.portals.length){this.portalMeshes=game.portals.map((p,i)=>{const m=new T.Mesh(new T.TorusGeometry(.7,.08,10,32),new T.MeshBasicMaterial({color:i?'#ec99ff':'#6ffff0'}));m.position.set(p.x,p.y,.2);this.board.add(m);return m;});}
   if(this.classicAppearance){this.classicPaddle.position.set(game.paddle.x,-10.6,.1);this.classicPaddleBody.scale.x=game.paddle.w;this.classicPaddleLight.scale.x=game.paddle.w*.8;this.classicPaddleLight.material.color.set(game.effects.laser?'#ff718a':game.effects.sticky?'#ffd77c':game.world.accent);}else updatePaddle(this.paddle,game.paddle,game.effects,this.settings.lowEffects,ENGAGEMENT.cosmetics.find(c=>c.kind==='finish'&&c.id===this.settings.paddleFinish)?.color);this.shield.visible=game.shield;
   this.particleBatch.setLow(this.settings.lowEffects);this.particleBatch.update(dt);
   this.draw(dt,false);

 }
}
