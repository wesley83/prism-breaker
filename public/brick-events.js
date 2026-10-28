import {BASE_TYPES} from './world-schema.js';
const customEvent=(name,detail,cancelable=false,EventType=CustomEvent)=>new EventType(name,{detail,bubbles:true,cancelable});
const tokens=brick=>['urn:Brick',BASE_TYPES[brick.kind],...(brick.moving?['urn:Brick:Moving']:[]),...(brick.customType?[brick.customType]:[])];
export class BrickBehaviors {
 constructor(){
  this.handlers=new Map();this.recipes=new Map();
  this.register(BASE_TYPES.switch,{onBreak:({game})=>this.openGates(game)});
  this.register(BASE_TYPES.explode,{onBreak:({game,brick})=>this.pulse(game,brick,game.engagement?.synergy==='fuse'?3.5:2.65)});
  this.effects=new Map([
   ['none',()=>{}],['bonus',({game},r)=>game.award(r.points??150)],
   ['pulse',({game,brick},r)=>this.pulse(game,brick,r.radius??2.65)],
   ['open-gates',({game})=>this.openGates(game)],
   ['slow-ball',({game},r)=>game.effects.slow=Math.max(game.effects.slow||0,r.duration??5)],
   ['power-up',({game,brick},r)=>game.drops.push({id:++game.uid,x:brick.x,y:brick.y,kind:r.power??'wide'})]
  ]);
 }
 register(type,handlers){
  if(!/^urn:Brick(?::[A-Za-z0-9-]+)*$/.test(type)||!handlers||typeof handlers!=='object'||Object.keys(handlers).some(key=>!['onStrike','onBreak'].includes(key)||typeof handlers[key]!=='function'))throw Error('Invalid brick handler');
  const entries=this.handlers.get(type)||[];entries.push(handlers);this.handlers.set(type,entries);
  return ()=>{const i=entries.indexOf(handlers);if(i>=0)entries.splice(i,1);};
 }
 configure(recipes=[]){this.recipes=new Map(recipes.map(recipe=>[recipe.type,recipe]));}
 dispatch(hook,detail,event){
  for(const type of tokens(detail.brick))for(const handler of [...(this.handlers.get(type)||[])]){
   try{const result=handler[hook]?.(detail,event);if(result?.then){result.catch?.(()=>{});throw Error('Brick handlers must be synchronous');}if(result===false&&event?.cancelable)event.preventDefault();}
   catch(error){if(event?.cancelable)event.preventDefault();detail.game.events.dispatchEvent(customEvent('brickbehaviorerror',{type,hook,message:error.message,brickId:detail.brick.id}));}
   if(event?.defaultPrevented)return;
  }
 }
 strike(game,brick,chain){
  const detail={game,brick,chain,hitpoints:brick.hp};const event=customEvent('strike',detail,true);
  game.events.dispatchEvent(event);if(event.defaultPrevented)return false;this.dispatch('onStrike',detail,event);return !event.defaultPrevented;
 }
 broken(game,brick,chain){
  const detail={game,brick,chain};game.events.dispatchEvent(customEvent('brickbreak',detail));
  this.dispatch('onBreak',detail);
  const recipe=this.recipes.get(brick.customType);if(recipe&&game.mode==='practice')this.effects.get(recipe.effect)?.(detail,recipe);
 }
 pulse(game,brick,radius){for(const other of game.bricks)if(other.hp>0&&Math.hypot(other.x-brick.x,other.y-brick.y)<radius)game.damage(other,true);}
 openGates(game){game.barriers=game.barriers.filter(b=>!b.gate);game.emit({type:'gate'});}
}
export function attachBrickDOM(game,worldElement){
 const forward=(event,name,cancelable=false)=>{
  const {brick}=event.detail,node=worldElement.querySelector('#f'+game.phase+'-brick-'+brick.id);if(!node)return;
  if(name==='damage'){node.dataset.remainingHitpoints=String(brick.hp);node.classList.toggle('destroyed',brick.hp===0);}
  const forwarded=customEvent(name,event.detail,cancelable,node.ownerDocument.defaultView?.CustomEvent||CustomEvent);node.dispatchEvent(forwarded);if(forwarded.defaultPrevented)event.preventDefault();
 };
 const onStrike=e=>forward(e,'strike',true),onDamage=e=>forward(e,'damage'),onBreak=e=>forward(e,'brickbreak');
 game.events.addEventListener('strike',onStrike);game.events.addEventListener('brickdamage',onDamage);game.events.addEventListener('brickbreak',onBreak);
 return ()=>{game.events.removeEventListener('strike',onStrike);game.events.removeEventListener('brickdamage',onDamage);game.events.removeEventListener('brickbreak',onBreak);};
}
