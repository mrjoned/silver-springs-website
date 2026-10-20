(function(){
  'use strict';
  const stage=document.getElementById('map-stage');
  const button=document.getElementById('map-fullscreen');
  const frame=document.getElementById('server-map');
  const loading=document.getElementById('map-loading');
  let originalOverflow='';
  function expanded(){return document.fullscreenElement===stage||stage.classList.contains('map-expanded')}
  function sync(){const active=expanded();button.textContent=active?'⛶ Exit full screen':'⛶ Full screen';button.setAttribute('aria-pressed',String(active))}
  function expandFallback(){originalOverflow=document.body.style.overflow;document.body.style.overflow='hidden';stage.classList.add('map-expanded');sync()}
  function closeFallback(){stage.classList.remove('map-expanded');document.body.style.overflow=originalOverflow;sync();button.focus()}
  button.addEventListener('click',async()=>{
    if(document.fullscreenElement===stage){await document.exitFullscreen();return}
    if(stage.classList.contains('map-expanded')){closeFallback();return}
    if(stage.requestFullscreen){try{await stage.requestFullscreen();return}catch{}}
    expandFallback();
  });
  document.addEventListener('fullscreenchange',sync);
  document.addEventListener('keydown',e=>{if(e.key==='Escape'&&stage.classList.contains('map-expanded'))closeFallback()});
  frame.addEventListener('load',()=>{loading.hidden=true});
  window.addEventListener('load',()=>{loading.hidden=true},{once:true});
  // A cross-origin frame cannot reliably report tile/network errors. Keep the
  // direct-open link available instead of declaring the server online/offline.
  window.setTimeout(()=>{if(!loading.hidden)loading.textContent='Map taking a moment? Use “Open map directly” above.'},15000);
})();
