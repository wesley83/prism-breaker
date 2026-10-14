// Saved world data chooses bounded recipes. Executable extensions are registered
// by trusted application code; no eval or imported URLs from a world document.
const customEvent=(name,detail,cancelable=false,EventType=CustomEvent)=>new EventType(name,{detail,bubbles:true,cancelable});
export class BrickBehaviors {
 constructor(){this.handlers=new Map();this.recipes=new Map();}
 register(type,handlers){if(typeof type!=='string'||!handlers||typeof handlers!=='object')throw Error('Invalid brick handler');this.handlers.set(type,handlers);return ()=>this.handlers.delete(type);}
 configure(recipes=[]){this.recipes=new Map(recipes.map(recipe=>[recipe.type,recipe]));}
 strike(game,brick,chain){const detail={game,brick,chain,hitpoints:brick.hp};const event=customEvent('strike',detail,true);game.events.dispatchEvent(event);if(event.defaultPrevented)return false;this.handlers.get(brick.customType)?.onStrike?.(detail);return true;}
 broken(game,brick,chain){
  const detail={game,brick,chain};game.events.dispatchEvent(customEvent('brickbreak',detail));
  // Base specializations remain composable with a custom recipe.
  if(brick.kind==='switch')this.openGates(game);
  if(brick.kind==='explode')this.pulse(game,brick,2.65);
  this.handlers.get(brick.customType)?.onBreak?.(detail);
  const recipe=this.recipes.get(brick.customType);if(!recipe||game.mode!=='practice')return;
  if(recipe.effect==='bonus')game.award(recipe.points??150);
  else if(recipe.effect==='pulse')this.pulse(game,brick,recipe.radius??2.65);
  else if(recipe.effect==='open-gates')this.openGates(game);
  else if(recipe.effect==='slow-ball')game.effects.slow=Math.max(game.effects.slow||0,recipe.duration??5);
  else if(recipe.effect==='power-up')game.drops.push({id:++game.uid,x:brick.x,y:brick.y,kind:recipe.power??'wide'});
 }
 pulse(game,brick,radius){for(const other of game.bricks)if(other.hp>0&&Math.hypot(other.x-brick.x,other.y-brick.y)<radius)game.damage(other,true);}
 openGates(game){game.barriers=game.barriers.filter(b=>!b.gate);game.emit({type:'gate'});}
}

export function attachBrickDOM(game,worldElement){
 const onStrike=event=>{
  const {brick}=event.detail,node=worldElement.querySelector('#f'+game.phase+'-brick-'+brick.id);if(!node)return;
  const strike=customEvent('strike',event.detail,true,node.ownerDocument.defaultView?.CustomEvent||CustomEvent);node.dispatchEvent(strike);if(strike.defaultPrevented)event.preventDefault();
 };
 const onDamage=event=>{
  const {brick}=event.detail,node=worldElement.querySelector('#f'+game.phase+'-brick-'+brick.id);if(!node)return;
  node.dataset.remainingHitpoints=String(brick.hp);node.classList.toggle('destroyed',brick.hp===0);
  node.dispatchEvent(customEvent('damage',event.detail,false,node.ownerDocument.defaultView?.CustomEvent||CustomEvent));
 };
 game.events.addEventListener('strike',onStrike);game.events.addEventListener('brickdamage',onDamage);
 return ()=>{game.events.removeEventListener('strike',onStrike);game.events.removeEventListener('brickdamage',onDamage);};
}
