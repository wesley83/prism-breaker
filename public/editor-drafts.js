import {OfflineStore} from './offline.js';
// Drafts are versioned operational snapshots; the working HTML remains editable authority.
export class EditorDrafts extends OfflineStore{
 read(slug){return this.transaction('metadata','readonly',(store,done)=>{store.get('editor-draft:'+slug).onsuccess=event=>done(event.target.result??null);});}
 write(slug,snapshot,expectedRevision){
  if(typeof snapshot.html!=='string'||snapshot.html.length>1000000||typeof snapshot.baseHTML!=='string'||snapshot.baseHTML.length>1000000)throw Error('Invalid draft snapshot');
  return this.transaction('metadata','readwrite',(store,done)=>{store.get('editor-draft:'+slug).onsuccess=event=>{
   const previous=event.target.result;if((previous?.revision??null)!==expectedRevision){done({saved:false,conflict:true});return;}
   const value={...snapshot,revision:crypto.randomUUID(),savedAt:Date.now()};store.put(value,'editor-draft:'+slug);done({saved:true,revision:value.revision});
  };});
 }
}
export const editorDrafts=new EditorDrafts();
