import {normalizeWorld,parseWorld,worldHTML} from './world-format.js';
const freeze=value=>{if(value&&typeof value==='object'){for(const child of Object.values(value))freeze(child);Object.freeze(value);}return value;};
// Identity keys are scoped to a parent. Moving an existing brick retains its node.
function key(node,index){
 if(node.nodeType!==1)return 'text:'+index;
 const prop=node.getAttribute('itemprop')||'',id=node.id;
 if(id)return 'id:'+id;
 if(node.tagName==='META')return 'meta:'+prop;
 if(prop==='brickType')return 'type:'+node.querySelector('meta[itemprop="type"]')?.getAttribute('content');
 if(prop==='barrier')return 'barrier:'+node.querySelector('meta[itemprop="id"]')?.getAttribute('content');
 return node.tagName+':'+prop+':'+index;
}
function reconcile(target,source){
 // Preserve presentation attributes; persistence only reads declared domain fields.
 for(const name of ['id','itemprop','itemtype','itemscope','content']){if(source.hasAttribute(name))target.setAttribute(name,source.getAttribute(name));else target.removeAttribute(name);}
 const previous=new Map([...target.childNodes].filter(n=>n.nodeType!==1||!n.hasAttribute('data-editor-decoration')).map((n,i)=>[key(n,i),n]));
 let cursor=target.firstChild;
 [...source.childNodes].forEach((node,index)=>{
  const identity=key(node,index);let next=previous.get(identity);previous.delete(identity);
  if(!next||next.nodeType!==node.nodeType||next.nodeName!==node.nodeName)next=node.cloneNode(true);
  else if(node.nodeType===1)reconcile(next,node);else next.textContent=node.textContent;
  if(next!==cursor)target.insertBefore(next,cursor);cursor=next.nextSibling;
 });
 for(const node of previous.values())node.remove();
}
export class WorldWorkingDocument{
 constructor(container){this.container=container;this.root=null;this.generation=0;}
 replace(value){
  const valid=normalizeWorld(value),template=this.container.ownerDocument.createElement('template');template.innerHTML=worldHTML(valid);
  const incoming=template.content.firstElementChild;
  if(this.root){if(this.root.querySelector('meta[itemprop="id"]').getAttribute('content')!==valid.id)throw Error('A working document cannot change world identity');reconcile(this.root,incoming);}
  else{this.root=incoming;this.container.prepend(this.root);}
  this.generation++;return this.project();
 }
 read(){if(!this.root)throw Error('No working world');return parseWorld(this.root);}
 project(){return freeze(this.read());}
 serialize(){return worldHTML(this.read());}
 restore(html){const template=this.container.ownerDocument.createElement('template');template.innerHTML=html;return this.replace(parseWorld(template.content.querySelector('#world')));}
 command(change){const draft=this.read();const result=change(draft);if(result?.then)throw Error('Document commands must be synchronous');this.replace(draft);return result;}
}
