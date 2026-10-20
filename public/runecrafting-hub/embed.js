
(function(){
  const frame=document.getElementById('preview-hub');
  const origin=window.location.origin;
  let requested=window.location.hash;
  function requestHeight(){frame.contentWindow.postMessage({type:'sss-runecrafting-hub:request-height',version:1},origin)}
  frame.src='/runecrafting-hub/tools/index.html'+requested;
  window.addEventListener('message',event=>{
    if(event.source!==frame.contentWindow||event.origin!==origin)return;
    const d=event.data;
    if(!d||d.type!=='sss-runecrafting-hub:resize'||d.version!==1||typeof d.height!=='number'||!Number.isFinite(d.height)||d.height<200||d.height>100000)return;
    frame.style.height=Math.ceil(d.height)+'px';
  });
  frame.addEventListener('load',()=>{
    requestHeight();
    frame.contentWindow.addEventListener('hashchange',()=>{
      requested=frame.contentWindow.location.hash;
      history.replaceState(null,'',window.location.pathname+window.location.search+requested);
    });
  });
  window.addEventListener('hashchange',()=>{
    if(window.location.hash===requested)return;
    requested=window.location.hash;
    frame.contentWindow.location.hash=requested;
  });
})();
