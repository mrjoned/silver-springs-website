(function(){
  'use strict';
  const data=JSON.parse(document.getElementById('news-data').textContent);
  const cards=new Map([...document.querySelectorAll('[data-post]')].map(c=>[c.dataset.post,c]));
  const list=document.getElementById('news-posts');
  const search=document.getElementById('news-search'),year=document.getElementById('news-year'),sort=document.getElementById('news-sort');
  const buttons=[...document.querySelectorAll('[data-topic]')];
  const results=document.getElementById('news-results'),more=document.getElementById('news-more');
  const clear=document.getElementById('clear-news-filters');
  let topic='all',limit=12;
  function readURL(){
    const params=new URLSearchParams(location.search);topic=params.get('topic')||'all';
    if(!buttons.some(b=>b.dataset.topic===topic))topic='all';
    search.value=params.get('q')||'';
    year.value=params.get('year')||'all';if(!year.value)year.value='all';
    sort.value=params.get('sort')==='oldest'?'oldest':'newest';
  }
  function render(updateURL=true){
    const words=search.value.toLowerCase().trim().split(/\s+/).filter(Boolean);
    const filtered=data.filter(p=>(topic==='all'||p.topics.includes(topic))&&(year.value==='all'||p.year===year.value)&&words.every(w=>p.search.toLowerCase().includes(w)));
    if(sort.value==='oldest')filtered.reverse();
    cards.forEach(c=>c.hidden=true);
    const fragment=document.createDocumentFragment();
    filtered.forEach((p,i)=>{const card=cards.get(p.id);card.hidden=i>=limit;fragment.append(card)});
    list.append(fragment);
    const count=Math.min(limit,filtered.length);
    results.textContent=filtered.length?'Showing '+count+' of '+filtered.length+' '+(filtered.length===1?'post':'posts'):'No matching posts';
    more.hidden=count>=filtered.length;
    more.textContent='Show more posts ↓';
    clear.hidden=topic==='all'&&year.value==='all'&&!search.value;
    document.getElementById('news-empty').hidden=filtered.length>0;
    document.getElementById('news-highlights').hidden=topic!=='all'||year.value!=='all'||Boolean(search.value);
    buttons.forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.topic===topic)));
    if(updateURL){
      const params=new URLSearchParams();
      if(topic!=='all')params.set('topic',topic);
      if(search.value)params.set('q',search.value);
      if(year.value!=='all')params.set('year',year.value);
      if(sort.value!=='newest')params.set('sort',sort.value);
      history.replaceState(null,'',location.pathname+(params.size?'?'+params.toString():'')+location.hash);
    }
  }
  search.addEventListener('input',()=>{limit=12;render()});
  [year,sort].forEach(el=>el.addEventListener('change',()=>{limit=12;render()}));
  buttons.forEach(b=>b.addEventListener('click',()=>{topic=b.dataset.topic;limit=12;render()}));
  clear.addEventListener('click',()=>{topic='all';year.value='all';search.value='';limit=12;render();search.focus()});
  more.addEventListener('click',()=>{limit+=12;render(false)});
  window.addEventListener('popstate',()=>{readURL();limit=12;render(false)});
  readURL();render(false);
})();
