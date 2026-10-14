(async()=>{
 const controller=navigator.serviceWorker?.controller;
 if(controller)await new Promise((resolve,reject)=>{
  const channel=new MessageChannel(),timer=setTimeout(()=>reject(Error('The installed game did not respond.')),5000);
  channel.port1.onmessage=()=>{clearTimeout(timer);channel.port1.close();resolve();};
  controller.postMessage({type:'CLIENT_VERSION',version:'network'},[channel.port2]);
 });
 const stylesheet=document.createElement('link');stylesheet.rel='stylesheet';stylesheet.href='/editor.css?v=__EDITOR_STYLE__';document.head.append(stylesheet);
 await import('/editor.js?v=__EDITOR_CODE__');
})().catch(error=>{console.error('Workshop startup:',error);document.querySelector('#editor-status').textContent='The workshop could not load. Return to the start screen, apply Update game, then reopen the workshop.';});
