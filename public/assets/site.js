
const menu=document.querySelector('.menu'),nav=document.querySelector('#mainnav');
function closeMenu(){menu.setAttribute('aria-expanded','false');nav.classList.remove('open')}
menu.addEventListener('click',()=>{const open=menu.getAttribute('aria-expanded')!=='true';menu.setAttribute('aria-expanded',String(open));nav.classList.toggle('open',open)});
const groups=[...document.querySelectorAll('.navgroup')];
groups.forEach(g=>g.addEventListener('toggle',()=>{if(g.open)groups.forEach(other=>{if(other!==g)other.open=false})}));
document.addEventListener('click',e=>{if(!e.target.closest('.navgroup'))groups.forEach(g=>g.open=false)});
document.addEventListener('keydown',e=>{if(e.key==='Escape'){groups.forEach(g=>g.open=false);closeMenu()}});
nav.querySelectorAll('a').forEach(a=>a.addEventListener('click',()=>{closeMenu();groups.forEach(g=>g.open=false)}));
let timer;document.querySelectorAll('[data-copy]').forEach(b=>b.addEventListener('click',async()=>{const value=b.dataset.copy;try{await navigator.clipboard.writeText(value);const t=document.querySelector('#toast');t.textContent=value==='sssminecraft.com'?'Server IP copied — see you in Silver Springs!':value+' copied';t.hidden=false;clearTimeout(timer);timer=setTimeout(()=>t.hidden=true,3200)}catch{window.prompt('Copy '+value+':',value)}}));
const track=document.querySelector('.carousel-track');
if(track){const slides=[...track.children],dots=[...document.querySelectorAll('[data-slide]')],count=document.querySelector('.gallery-count');let active=0,frame;
function go(i){i=(i+slides.length)%slides.length;track.scrollTo({left:slides[i].offsetLeft-slides[0].offsetLeft,behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'})}
function sync(){active=slides.reduce((best,slide,i)=>Math.abs(slide.offsetLeft-slides[0].offsetLeft-track.scrollLeft)<Math.abs(slides[best].offsetLeft-slides[0].offsetLeft-track.scrollLeft)?i:best,0);dots.forEach((d,i)=>d.setAttribute('aria-current',String(i===active)));count.textContent=(active+1)+' / '+slides.length}
track.addEventListener('scroll',()=>{cancelAnimationFrame(frame);frame=requestAnimationFrame(sync)},{passive:true});document.querySelector('.gallery-prev').addEventListener('click',()=>go(active-1));document.querySelector('.gallery-next').addEventListener('click',()=>go(active+1));dots.forEach((d,i)=>d.addEventListener('click',()=>go(i)));track.addEventListener('keydown',e=>{if(e.key==='ArrowRight'||e.key==='ArrowLeft'){e.preventDefault();go(active+(e.key==='ArrowRight'?1:-1))}});window.addEventListener('resize',sync)}
