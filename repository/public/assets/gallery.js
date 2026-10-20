'use strict';
const tiles=[...document.querySelectorAll('[data-photo]')];
const filter=document.getElementById('photo-filter');
const count=document.getElementById('photo-count');
const dialog=document.getElementById('photo-viewer');
const image=document.getElementById('viewer-photo');
const caption=document.getElementById('viewer-caption');
const position=document.getElementById('viewer-position');
const original=document.getElementById('viewer-original');
const sources=new Map();
let shown=tiles,active=0,opener=null,previousOverflow='';

fetch('/gallery/photos.json').then(r=>{if(!r.ok)throw Error('Photo metadata unavailable');return r.json()}).then(photos=>photos.forEach(p=>sources.set(String(p.id),p.source))).catch(()=>{});

function show(index){
  active=(index+shown.length)%shown.length;
  const tile=shown[active],photo=tile.querySelector('img');
  image.src=photo.getAttribute('src');
  image.alt=photo.alt;
  caption.textContent=tile.querySelector('.photo-label>span').textContent;
  position.textContent=(active+1)+' / '+shown.length;
  original.href=sources.get(tile.dataset.photo)||photo.src;
}

tiles.forEach(tile=>tile.addEventListener('click',()=>{
  opener=tile;show(shown.indexOf(tile));previousOverflow=document.body.style.overflow;
  document.body.style.overflow='hidden';dialog.showModal();
}));
dialog.querySelector('.viewer-close').addEventListener('click',()=>dialog.close());
dialog.querySelector('.viewer-prev').addEventListener('click',()=>show(active-1));
dialog.querySelector('.viewer-next').addEventListener('click',()=>show(active+1));
dialog.addEventListener('keydown',e=>{
  if(e.key==='ArrowLeft'||e.key==='ArrowRight'){e.preventDefault();show(active+(e.key==='ArrowRight'?1:-1))}
});
dialog.addEventListener('click',e=>{
  if(e.target!==dialog)return;
  const bounds=dialog.getBoundingClientRect();
  if(e.clientX<bounds.left||e.clientX>bounds.right||e.clientY<bounds.top||e.clientY>bounds.bottom)dialog.close();
});
dialog.addEventListener('close',()=>{document.body.style.overflow=previousOverflow;if(opener)opener.focus()});
filter.addEventListener('change',()=>{
  tiles.forEach(tile=>tile.hidden=filter.value!=='all'&&tile.dataset.year!==filter.value);
  shown=tiles.filter(tile=>!tile.hidden);
  count.textContent=filter.value==='all'?'Showing all '+tiles.length+' photos':shown.length+' photos · '+filter.options[filter.selectedIndex].text;
});
let touchStart=null;
image.addEventListener('touchstart',e=>{touchStart={x:e.changedTouches[0].clientX,y:e.changedTouches[0].clientY}},{passive:true});
image.addEventListener('touchend',e=>{
  if(!touchStart)return;
  const dx=e.changedTouches[0].clientX-touchStart.x,dy=e.changedTouches[0].clientY-touchStart.y;
  if(Math.abs(dx)>65&&Math.abs(dx)>Math.abs(dy)*1.5)show(active+(dx<0?1:-1));
  touchStart=null;
},{passive:true});
