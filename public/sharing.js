import qrcode from './vendor/qr.js?v=1';

export function platformProfile(nav=navigator){
 const platform=nav.userAgentData?.platform||nav.platform||'',agent=nav.userAgent||'';
 const ios=/iPhone|iPad|iPod/i.test(agent)||(/Mac/i.test(platform)&&nav.maxTouchPoints>1);
 const android=/Android/i.test(platform+' '+agent),mobile=ios||android||Boolean(nav.userAgentData?.mobile);
 const os=ios?'ios':android?'android':/Win/i.test(platform)?'windows':/Mac/i.test(platform)?'mac':/CrOS/i.test(agent)?'chromeos':'other';
 return {os,mobile,saveLabel:mobile?'Save scorecard':'Download scorecard',nativeHint:os==='ios'?'Choose Messages, AirDrop or another available app from the share sheet.':os==='android'?'Choose a messaging, email or other available app from the Android share menu.':os==='mac'?'Choose AirDrop, Messages, Mail or another available destination.':os==='windows'?'Choose an available destination in the Windows share menu.':'Choose an available destination from the share menu.'};
}
function canShare(data,nav=navigator){try{return typeof nav.share==='function'&&(typeof nav.canShare!=='function'||nav.canShare(data));}catch{return false;}}
function qrCanvas(url,size=180){
 const qr=qrcode(0,'M');qr.addData(url);qr.make();const modules=qr.getModuleCount(),cell=Math.max(1,Math.floor(size/(modules+8))),canvas=document.createElement('canvas');canvas.width=canvas.height=(modules+8)*cell;const ctx=canvas.getContext('2d');ctx.fillStyle='#fff';ctx.fillRect(0,0,canvas.width,canvas.height);ctx.fillStyle='#071218';
 for(let y=0;y<modules;y++)for(let x=0;x<modules;x++)if(qr.isDark(y,x))ctx.fillRect((x+4)*cell,(y+4)*cell,cell,cell);return canvas;
}
function loadImage(src){return new Promise(resolve=>{const image=new Image();image.onload=()=>resolve(image);image.onerror=()=>resolve(null);image.src=src;});}
function fitText(ctx,text,x,y,size,maxWidth,color='#f8fafc',weight=700){ctx.fillStyle=color;ctx.font=weight+' '+size+'px Arcade, Arial, sans-serif';while(ctx.measureText(text).width>maxWidth&&size>14){size--;ctx.font=weight+' '+size+'px Arcade, Arial, sans-serif';}ctx.fillText(text,x,y);}
function cover(ctx,image,x,y,w,h){if(!image)return;const scale=Math.max(w/image.width,h/image.height);ctx.save();ctx.beginPath();ctx.rect(x,y,w,h);ctx.clip();ctx.drawImage(image,x+(w-image.width*scale)/2,y+(h-image.height*scale)/2,image.width*scale,image.height*scale);ctx.restore();}
function duration(seconds){return Math.floor(seconds/60)+'m '+String(seconds%60).padStart(2,'0')+'s';}

async function drawScorecard(model,profile){
 const portrait=profile.mobile,w=portrait?1080:1200,h=portrait?1350:630,pad=portrait?64:60;
 const [scene,mark]=await Promise.all([loadImage('/assets/world-preview-'+String(model.world||8).padStart(2,'0')+'.png'),loadImage('/assets/prism-icon-192.png')]);
 try{await document.fonts.load('700 24px Arcade');}catch{/* System font keeps the scorecard available. */}
 const canvas=document.createElement('canvas');canvas.width=w;canvas.height=h;const ctx=canvas.getContext('2d');if(!ctx)throw Error('Scorecard drawing unavailable');ctx.fillStyle='#071218';ctx.fillRect(0,0,w,h);
 if(portrait){cover(ctx,scene,0,100,w,540);const fade=ctx.createLinearGradient(0,100,0,640);fade.addColorStop(0,'#07121866');fade.addColorStop(.55,'#07121822');fade.addColorStop(1,'#071218');ctx.fillStyle=fade;ctx.fillRect(0,100,w,540);}
 else{cover(ctx,scene,520,0,680,h);const fade=ctx.createLinearGradient(380,0,w,0);fade.addColorStop(0,'#071218');fade.addColorStop(.55,'#07121888');fade.addColorStop(1,'#07121844');ctx.fillStyle=fade;ctx.fillRect(380,0,w-380,h);}
 fitText(ctx,'PRISM BREAKER',pad,portrait?70:62,portrait?30:26,w-220,'#b5ff6c');if(mark)ctx.drawImage(mark,w-pad-64,portrait?24:20,64,64);
 const headingY=portrait?552:128,nameY=portrait?630:189,scoreY=portrait?807:310;
 fitText(ctx,model.badge,pad,headingY,portrait?26:18,w-pad*2,'#cce6f1');
 fitText(ctx,model.player||'Be the first champion',pad,nameY,portrait?60:44,portrait?w-pad*2:780);
 fitText(ctx,model.score===null?'SET THE RECORD':Number(model.score).toLocaleString(),pad,scoreY,model.score===null?(portrait?62:55):(portrait?158:118),portrait?w-pad*2:850,'#ffe2a0');
 fitText(ctx,model.boardLabel,pad,portrait?887:363,portrait?34:26,w-pad*2,'#e5edf4',500);
 const details=[model.world?'World '+String(model.world).padStart(2,'0'):null,model.seconds?duration(model.seconds):null,model.rank?'Rank #'+model.rank:null].filter(Boolean).join('   ·   ');
 fitText(ctx,details,pad,portrait?986:411,portrait?26:21,portrait?w-pad*2:850,'#d0dde3',500);
 if(model.kind!=='result'&&model.day&&model.day!=='all')fitText(ctx,model.day+' UTC',pad,portrait?936:451,portrait?24:20,w-pad*2,'#d0dde3',500);
 if(model.kind==='result')fitText(ctx,'Speed +'+model.speed.toLocaleString()+'   ·   Power-ups +'+model.pickups.toLocaleString(),pad,portrait?1044:451,portrait?25:20,w-pad*2,'#d0dde3',500);
 if(model.kind==='result'&&model.day&&model.day!=='all')fitText(ctx,model.day+' UTC',pad,portrait?936:486,portrait?24:18,w-pad*2,'#d0dde3',500);
 const qr=qrCanvas(model.url,portrait?164:144),qx=w-pad-qr.width,qy=h-pad-qr.height;ctx.drawImage(qr,qx,qy);
 fitText(ctx,model.kind==='result'?'CAN YOU BEAT IT?':'YOUR NEXT CHALLENGE',pad,h-(portrait?161:112),portrait?34:27,qx-pad-24);
 fitText(ctx,'Play Prism Breaker',pad,h-(portrait?108:69),portrait?27:22,qx-pad-24,'#cce6f1',500);
 fitText(ctx,new URL(model.url).hostname,pad,h-(portrait?64:34),portrait?21:17,qx-pad-24,'#b2c9d0',500);
 return new Promise((resolve,reject)=>canvas.toBlob(blob=>blob?resolve(blob):reject(Error('Scorecard image unavailable')),'image/png'));
}

export class SharePreview {
 constructor(dialog){
  this.dialog=dialog;this.find=s=>dialog.querySelector(s);this.token=0;this.previewUrl=null;this.nativePending=false;
  this.find('#share-invitation').onclick=()=>this.nativeShare(false);this.find('#share-image').onclick=()=>this.nativeShare(true);this.find('#copy-invitation').onclick=()=>this.copy();this.find('#save-scorecard').onclick=()=>this.download();
  dialog.addEventListener('close',()=>{this.token++;this.release();});
 }
 release(){if(this.previewUrl)URL.revokeObjectURL(this.previewUrl);this.previewUrl=null;this.file=null;this.blob=null;}
 async open(model,profile=platformProfile()){
  this.release();const token=++this.token;this.model={...model};this.profile=profile;const native=canShare(this.shareData());
  this.dialog.dataset.platform=profile.os;this.find('#share-preview-title').textContent=model.kind==='result'?'Share your score.':'Invite a challenger.';this.find('#share-preview-message').textContent=model.text;
  this.find('#share-platform-hint').textContent=native?profile.nativeHint:'Copy your invitation to paste into an app, or save the scorecard.';
  this.find('#share-invitation').hidden=!native;this.find('#share-invitation').disabled=this.nativePending;this.find('#share-image').hidden=true;this.find('#share-image').disabled=this.nativePending;
  this.find('#copy-invitation').classList.toggle('primary',!native);this.find('#copy-invitation').classList.toggle('secondary',native);
  this.find('#save-scorecard-label').textContent=profile.saveLabel;this.find('#save-scorecard').disabled=true;this.find('#share-preview-status').textContent='Preparing your scorecard…';this.find('#share-manual-copy').hidden=true;
  this.find('#scorecard-preview').hidden=true;this.find('#scorecard-preview').removeAttribute('src');this.find('#scorecard-placeholder').hidden=false;
  this.find('.scorecard-frame').hidden=false;
  this.find('#share-qr-block').hidden=profile.mobile;
  if(!profile.mobile){try{this.find('#share-qr').src=qrCanvas(model.url).toDataURL('image/png');}catch{this.find('#share-qr-block').hidden=true;}}
  if(!this.dialog.open)this.dialog.showModal();
  try{const blob=await drawScorecard(model,profile);if(token!==this.token)return;this.blob=blob;this.filename='prism-breaker-'+(model.kind==='result'?'score-':'leaderboard-')+model.mode+(model.score!==null?'-'+model.score:'')+'.png';this.file=typeof File==='function'?new File([blob],this.filename,{type:'image/png'}):null;
   this.previewUrl=URL.createObjectURL(blob);const preview=this.find('#scorecard-preview');preview.src=this.previewUrl;preview.alt=model.score===null?'Prism Breaker invitation to set the first record':model.player+' · '+Number(model.score).toLocaleString()+' points · '+model.boardLabel;preview.hidden=false;this.find('#scorecard-placeholder').hidden=true;this.find('#save-scorecard').disabled=false;
   this.find('#share-image').hidden=!(this.file&&typeof navigator.canShare==='function'&&canShare({files:[this.file]}));this.find('#share-preview-status').textContent='';
  }catch{if(token!==this.token)return;this.find('.scorecard-frame').hidden=true;this.find('#share-preview-status').textContent='The scorecard could not be prepared. Your invitation is ready to share or copy.';}
 }
 shareData(){return {title:this.model.title,text:this.model.text,url:this.model.url};}
 async nativeShare(image){
  const button=this.find(image?'#share-image':'#share-invitation'),token=this.token;if(this.nativePending||(image&&!this.file))return;this.nativePending=true;this.find('#share-invitation').disabled=true;this.find('#share-image').disabled=true;
  try{await navigator.share(image?{files:[this.file],title:this.model.title}:this.shareData());if(token===this.token)this.find('#share-preview-status').textContent='Share menu opened.';}
  catch(error){if(token!==this.token)return;this.find('#share-preview-status').textContent=error.name==='AbortError'?'Sharing canceled. You can still copy the invitation or save the scorecard.':'Sharing is unavailable here. Copy the invitation or save the scorecard.';if(error.name!=='AbortError'){button.hidden=true;if(!image){this.find('#copy-invitation').classList.add('primary');this.find('#copy-invitation').classList.remove('secondary');}}}
  finally{this.nativePending=false;this.find('#share-invitation').disabled=false;this.find('#share-image').disabled=false;}
 }
 async copy(){
  const text=this.model.text+'\n'+this.model.url,token=this.token;
  try{if(!navigator.clipboard?.writeText)throw Error('Clipboard unavailable');await navigator.clipboard.writeText(text);if(token===this.token){this.find('#share-preview-status').textContent='Invitation copied. Paste it into your message.';this.find('#share-manual-copy').hidden=true;}}
  catch{if(token!==this.token)return;this.find('#share-copy-text').value=text;this.find('#share-manual-copy').hidden=false;this.find('#share-copy-text').focus();this.find('#share-copy-text').select();this.find('#share-preview-status').textContent='Select and copy the invitation below.';}
 }
 download(){if(!this.blob)return;const url=URL.createObjectURL(this.blob),link=document.createElement('a');link.href=url;link.download=this.filename;document.body.append(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),60000);this.find('#share-preview-status').textContent=this.profile.mobile?'Your PNG download has started. You can also use Share scorecard where available.':'Your PNG scorecard download has started.';}
}
