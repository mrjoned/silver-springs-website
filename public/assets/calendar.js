'use strict';
const zone='America/Chicago';
const dateParts=new Intl.DateTimeFormat('en-US',{timeZone:zone,year:'numeric',month:'2-digit',day:'2-digit'});
const monthFormat=new Intl.DateTimeFormat('en-US',{month:'long',year:'numeric',timeZone:'UTC'});
const dayFormat=new Intl.DateTimeFormat('en-US',{weekday:'long',month:'long',day:'numeric',timeZone:'UTC'});
const shortDate=new Intl.DateTimeFormat('en-US',{month:'short',day:'numeric',timeZone:'UTC'});
const timeFormat=new Intl.DateTimeFormat('en-US',{timeZone:zone,month:'short',day:'numeric',hour:'numeric',minute:'2-digit'});
function localKey(date){const p=Object.fromEntries(dateParts.formatToParts(date).map(p=>[p.type,p.value]));return p.year+'-'+p.month+'-'+p.day}
function keyDate(key){return new Date(key+'T12:00:00Z')}
function addDays(key,n){const d=keyDate(key);d.setUTCDate(d.getUTCDate()+n);return d.toISOString().slice(0,10)}
const today=localKey(new Date());
let selected=today,month=today.slice(0,7),view='month',data=null,events=[],loading=false,requestVersion=0,lastAttempt=0;
const monthLabel=document.getElementById('calendar-month');
const days=document.getElementById('calendar-days');
const selectedLabel=document.getElementById('selected-day');
const dayEvents=document.getElementById('day-events');
const previous=document.getElementById('calendar-prev'),next=document.getElementById('calendar-next');
const status=document.getElementById('calendar-status');
const syncLabel=document.getElementById('calendar-sync');

function node(tag,className,text){const n=document.createElement(tag);if(className)n.className=className;if(text!==undefined)n.textContent=text;return n}
function onDay(key){return events.filter(e=>e.first<=key&&key<=e.last)}
function range(e){
  if(e.allDay){const last=addDays(e.end,-1);return e.start===last?shortDate.format(keyDate(e.start))+' · All day':shortDate.format(keyDate(e.start))+' – '+shortDate.format(keyDate(last))+' · All day'}
  return timeFormat.format(new Date(e.start))+' – '+timeFormat.format(new Date(e.end));
}
function details(e,agenda=false){
  const article=node('article',agenda?'agenda-row':'event-detail');
  const body=node('div');
  if(agenda)article.append(node('div','agenda-date',range(e)));
  else body.append(node('span','event-tag',e.category==='rush'?'Rush Weekend':e.category==='reset'?'World reset':'Community event'));
  body.append(node('h4','',e.title));
  if(!agenda)body.append(node('p','event-when',range(e)));
  if(e.description){
    const parsed=new DOMParser().parseFromString(e.description,'text/html');
    parsed.querySelectorAll('script,style').forEach(n=>n.remove());
    parsed.querySelectorAll('br').forEach(n=>n.replaceWith('\n'));
    const text=parsed.body.textContent.trim();
    if(text)body.append(node('p','',text));
    const links=new Set([...(text.match(/https?:\/\/[^\s<>"']+/g)||[]),...Array.from(parsed.querySelectorAll('a[href]'),a=>a.getAttribute('href'))]);
    for(const url of links){
      try{const target=new URL(url);if(!['http:','https:'].includes(target.protocol))continue;}catch{continue;}
      const a=node('a','','Event details →');a.href=url.includes('/changelog-and-faq/rush-weekends')?'/content-overview/#sscc/vanilla/events':url;body.append(a);
    }
  }
  if(e.location)body.append(node('p','',e.location));
  article.append(body);return article;
}

function renderDay(){
  selectedLabel.textContent=dayFormat.format(keyDate(selected));
  dayEvents.replaceChildren();const found=onDay(selected);
  if(!found.length){dayEvents.append(node('p','bodytext','No scheduled events for this day. Check Discord for other community activities.'));return}
  found.forEach(e=>dayEvents.append(details(e)));
}

function selectDay(key){
  selected=key;
  if(key.slice(0,7)!==month){month=key.slice(0,7);loadSchedule();return}
  days.querySelectorAll('[data-date]').forEach(b=>{const current=b.dataset.date===selected;b.classList.toggle('selected',current);b.setAttribute('aria-pressed',String(current))});renderDay();
}

function render(){
  const first=month+'-01',date=keyDate(first),monthEnd=new Date(Date.UTC(date.getUTCFullYear(),date.getUTCMonth()+1,0,12)).toISOString().slice(0,10);
  const title=monthFormat.format(date);monthLabel.textContent=title;
  document.getElementById('month-caption').textContent=title+' event calendar';
  document.getElementById('agenda-heading').textContent=title;
  previous.disabled=month<='2000-01';next.disabled=month>='2099-12';
  const firstCell=addDays(first,-date.getUTCDay());
  const rows=Math.ceil((date.getUTCDay()+Number(monthEnd.slice(-2)))/7);
  days.replaceChildren();
  for(let row=0;row<rows;row++){
    const tr=node('tr');
    for(let col=0;col<7;col++){
      const key=addDays(firstCell,row*7+col),td=node('td'),button=node('button','day-button');
      const found=onDay(key);button.dataset.date=key;button.type='button';
      button.classList.toggle('outside',key.slice(0,7)!==month);button.classList.toggle('selected',key===selected);button.classList.toggle('today',key===today);
      button.setAttribute('aria-pressed',String(key===selected));
      if(key===today)button.setAttribute('aria-current','date');
      button.setAttribute('aria-label',dayFormat.format(keyDate(key))+': '+(found.length?found.map(e=>e.title).join(', '):'No scheduled events'));
      button.append(node('span','day-number',String(Number(key.slice(-2)))));
      found.slice(0,2).forEach(e=>button.append(node('span','event-chip '+e.category,e.title)));
      if(found.length>2)button.append(node('span','event-more','+'+(found.length-2)+' more'));
      button.disabled=key.slice(0,7)<'2000-01'||key.slice(0,7)>'2099-12';
      button.addEventListener('click',()=>selectDay(key));td.append(button);tr.append(td);
    }
    days.append(tr);
  }
  renderDay();
  const agenda=document.getElementById('agenda-events');agenda.replaceChildren();
  const monthEvents=events.filter(e=>e.first<=monthEnd&&e.last>=first);
  if(!monthEvents.length)agenda.append(node('p','bodytext','No events are scheduled for this month. Check Discord for other community activities.'));
  monthEvents.forEach(e=>agenda.append(details(e,true)));

}

function moveMonth(delta){
  const d=keyDate(month+'-01');d.setUTCMonth(d.getUTCMonth()+delta);const key=d.toISOString().slice(0,7);
  if(key<'2000-01'||key>'2099-12')return;
  month=key;selected=month+'-01';loadSchedule();
}
previous.addEventListener('click',()=>moveMonth(-1));next.addEventListener('click',()=>moveMonth(1));
document.getElementById('calendar-today').addEventListener('click',()=>{
  selected=localKey(new Date());month=selected.slice(0,7);loadSchedule();
});
function setView(value){
  view=value;
  document.querySelectorAll('[data-view]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.view===view)));
  for(const name of ['month','agenda','live'])document.getElementById('view-'+name).hidden=name!==view;
  document.querySelector('.month-controls').hidden=view==='live';
  if(view==='live'){
    const frame=document.getElementById('live-calendar');
    if(!frame.hasAttribute('src'))frame.src=frame.dataset.src+(matchMedia('(max-width:600px)').matches?'&mode=AGENDA':'');
  }
}
document.querySelectorAll('[data-view]').forEach(b=>b.addEventListener('click',()=>setView(b.dataset.view)));

async function loadSchedule(){
  const version=++requestVersion,requestedMonth=month;
  lastAttempt=Date.now();loading=true;
  if(data?.month!==month){
    data=null;events=[];render();
    dayEvents.replaceChildren(node('p','bodytext','Loading scheduled events…'));
    document.getElementById('agenda-events').replaceChildren(node('p','bodytext','Loading scheduled events…'));
  }
  status.textContent='Refreshing Google Calendar…';
  status.classList.remove('calendar-error');syncLabel.textContent='Syncing with Google Calendar';
  const controller=new AbortController(),timeout=setTimeout(()=>controller.abort(),15000);
  try{
    const response=await fetch('/api/calendar?month='+requestedMonth,{signal:controller.signal});
    if(!response.ok)throw Error('Calendar unavailable');
    const result=await response.json();
    if(result.source!=='google'||result.month!==requestedMonth||!Array.isArray(result.events))throw Error('Invalid calendar response');
    if(version!==requestVersion)return;
    const prepared=result.events.map(e=>({...e,first:e.allDay?e.start:localKey(new Date(e.start)),last:e.allDay?addDays(e.end,-1):localKey(new Date(new Date(e.end).getTime()-1))}));
    data=result;events=prepared;render();
    status.textContent='Synced with Google Calendar · Updates refresh automatically every five minutes.';
    syncLabel.textContent='Live Google Calendar · Checked '+new Date().toLocaleTimeString('en-US',{timeZone:zone,hour:'numeric',minute:'2-digit'});
  }catch{
    if(version!==requestVersion)return;
    status.classList.add('calendar-error');
    if(data?.month===month){
      status.textContent='Calendar refresh failed. Showing the last loaded events; check Live calendar for updates.';
      syncLabel.textContent='Previously loaded schedule · Refresh unavailable';
    }else{
      status.textContent='The schedule could not load. Use Live calendar to see the current schedule.';
      syncLabel.textContent='Calendar sync unavailable';
      dayEvents.replaceChildren(node('p','bodytext','Schedule unavailable. Use Live calendar.'));
      document.getElementById('agenda-events').replaceChildren(node('p','bodytext','Schedule unavailable. Use Live calendar.'));
      setView('live');
    }
  }finally{clearTimeout(timeout);if(version===requestVersion)loading=false;}
}
loadSchedule();
setInterval(()=>{if(!document.hidden&&!loading)loadSchedule();},300000);
document.addEventListener('visibilitychange',()=>{if(!document.hidden&&!loading&&Date.now()-lastAttempt>=300000)loadSchedule();});
