// Authored templates/symbols in index.html own the medal presentation.
export const MEDALS={restored:'Restored',swift:'Swift',flawless:'Flawless',skill:'Skilled'};
export function medalToken(kind,{earned=true,fresh=false,document:doc=document}={}){
 const node=doc.querySelector('#medal-template').content.firstElementChild.cloneNode(true);
 node.dataset.medal=kind;node.dataset.earned=String(earned);node.classList.toggle('new-medal',fresh);
 node.querySelector('use').setAttribute('href','#medal-'+kind);
 node.querySelector('.medal-name').textContent=MEDALS[kind];
 node.querySelector('.medal-state').textContent=fresh?'NEW':earned?'Earned':'Not yet earned';
 return node;
}
