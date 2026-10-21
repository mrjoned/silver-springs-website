import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';
import { onRequestGet, normalizeEvent } from '../functions/api/calendar.js';
const originalFetch=globalThis.fetch;
const originalCaches=globalThis.caches;
const event={id:'test',summary:'Rush Weekend',start:{date:'2026-10-24'},end:{date:'2026-10-27'}};
const context=(month='2026-10',secret='test-secret')=>({request:new Request('https://example.com/api/calendar?month='+month),env:{GOOGLE_CALENDAR_API_KEY:secret},waitUntil:p=>p});
try{
  let calls=0;
  globalThis.fetch=async url=>{
    calls++;
    assert.equal(url.hostname,'www.googleapis.com');
    assert.equal(decodeURIComponent(url.pathname),'/calendar/v3/calendars/silverspringsmrjoned@gmail.com/events');
    assert.equal(url.searchParams.get('singleEvents'),'true');
    assert.equal(url.searchParams.get('showDeleted'),'false');
    assert.equal(url.searchParams.get('timeZone'),'America/Chicago');
    assert.equal(url.searchParams.get('timeMin'),'2026-09-24T00:00:00.000Z');
    assert.equal(url.searchParams.get('timeMax'),'2026-11-08T00:00:00.000Z');
    return Response.json(url.searchParams.has('pageToken')?{items:[{...event,id:'cancelled',status:'cancelled'},{...event,id:'moved',summary:'World reset',start:{dateTime:'2026-10-28T00:00:00-05:00'},end:{dateTime:'2026-10-28T01:00:00-05:00'}}]}:{items:[event],nextPageToken:'second'});
  };
  let response=await onRequestGet(context());
  assert.equal(response.status,200);
  let payload=await response.json();
  assert.equal(calls,2);assert.equal(payload.events.length,2);
  assert.equal(payload.events[0].allDay,true);assert.equal(payload.events[1].category,'reset');
  assert.equal(JSON.stringify(payload).includes('test-secret'),false);
  assert.equal(response.headers.get('Cache-Control'),'public, max-age=0, s-maxage=300');
  assert.equal(normalizeEvent({...event,status:'cancelled'}),null);
  assert.equal(normalizeEvent({...event,end:{date:'invalid'}}),null);
  assert.equal(normalizeEvent({...event,end:{date:'2026-10-23'}}),null);
  assert.equal(normalizeEvent({...event,summary:'Build contest'}).category,'community');
  const before=calls;
  for(const month of ['2026-13','bad','2026-1','1999-12'])assert.equal((await onRequestGet(context(month))).status,400);
  assert.equal((await onRequestGet(context('2026-10',''))).status,503);assert.equal(calls,before);
  for(const upstream of [async()=>new Response('secret upstream error',{status:403}),async()=>Response.json({bad:true}),async()=>{throw Error('test-secret');}]){
    globalThis.fetch=upstream;response=await onRequestGet(context());assert.equal(response.status,503);assert.equal(response.headers.get('Cache-Control'),'no-store');assert.equal((await response.text()).includes('test-secret'),false);
  }
  // Refuse partial data instead of presenting a truncated calendar as complete.
  globalThis.fetch=async()=>Response.json({items:[],nextPageToken:'again'});
  assert.equal((await onRequestGet(context())).status,503);
  // Cache only successful public responses, under a credential-free canonical key.
  const cache=new Map();let writes=[];
  globalThis.caches={default:{match:async key=>cache.get(key.url)?.clone(),put:async(key,value)=>{assert.equal(key.url,'https://example.com/api/calendar?month=2026-10');cache.set(key.url,value);}}};
  globalThis.fetch=async()=>{calls++;return Response.json({items:[event]});};
  let ctx=context();ctx.waitUntil=p=>writes.push(p);
  await onRequestGet(ctx);await Promise.all(writes);const after=calls;
  assert.equal((await onRequestGet(context())).status,200);assert.equal(calls,after);
}finally{globalThis.fetch=originalFetch;if(originalCaches===undefined)delete globalThis.caches;else globalThis.caches=originalCaches;}

// Exercise the actual browser controller with a small DOM fixture.
class Element{
  constructor(){this.children=[];this.dataset={};this.handlers={};this.attributes={};this.textContent='';this.hidden=false;this.classes=new Set();this.classList={add:v=>this.classes.add(v),remove:v=>this.classes.delete(v),toggle:(v,on)=>on?this.classes.add(v):this.classes.delete(v)};}
  append(...children){this.children.push(...children);}
  replaceChildren(...children){this.children=children;}
  setAttribute(k,v){this.attributes[k]=v;}
  hasAttribute(k){return k in this.attributes;}
  addEventListener(k,f){this.handlers[k]=f;}
  querySelectorAll(){return [];}
}
const elements=new Map(),get=id=>{if(!elements.has(id))elements.set(id,new Element());return elements.get(id);};
const views=['month','agenda','live'].map(view=>{const e=new Element();e.dataset.view=view;return e;});
const document={hidden:false,handlers:{},getElementById:get,createElement:()=>new Element(),querySelector:()=>get('controls'),querySelectorAll:()=>views,addEventListener(k,f){this.handlers[k]=f;}};
get('live-calendar').dataset.src='https://calendar.google.com/calendar/embed?src=public';
let pending=[],refresh;
const sandbox=vm.createContext({document,Date,Intl,URL,AbortController,setTimeout,clearTimeout,setInterval:f=>{refresh=f;},matchMedia:()=>({matches:false}),fetch:url=>new Promise((resolve,reject)=>pending.push({url,resolve,reject}))});
vm.runInContext(await readFile(new URL('../public/assets/calendar.js',import.meta.url),'utf8'),sandbox);
const flush=()=>new Promise(resolve=>setImmediate(resolve));
const monthOf=p=>new URL(p.url,'https://example.com').searchParams.get('month');
function answer(p,events=[]){p.resolve(Response.json({source:'google',month:monthOf(p),events}));}
assert.equal(pending.length,1);assert.match(pending[0].url,/^\/api\/calendar\?month=/);
const initial=pending.shift();const initialMonth=monthOf(initial);
answer(initial,[{id:'test',title:'Sample',start:initialMonth+'-02',end:initialMonth+'-03',allDay:true,category:'community'}]);await flush();
assert.match(get('calendar-status').textContent,/Synced/);
assert.equal(vm.runInContext('onDay(month+"-02").length',sandbox),1);
assert.equal(vm.runInContext('onDay(month+"-03").length',sandbox),0); // exclusive all-day end
refresh();answer(pending.shift(),[]);await flush();assert.equal(vm.runInContext('events.length',sandbox),0); // deletion clears events
refresh();pending.shift().reject(Error('offline'));await flush();assert.match(get('calendar-status').textContent,/last loaded/);
get('calendar-next').handlers.click();let older=pending.shift();
get('calendar-next').handlers.click();let latest=pending.shift();
answer(latest,[]);await flush();const current=get('calendar-month').textContent;
answer(older,[{title:'Stale'}]);await flush();assert.equal(get('calendar-month').textContent,current);assert.equal(vm.runInContext('events.length',sandbox),0);
get('calendar-next').handlers.click();pending.shift().reject(Error('offline'));await flush();assert.equal(get('view-live').hidden,false);assert.match(get('calendar-status').textContent,/could not load/);
refresh();answer(pending.shift(),[]);await flush();assert.match(get('calendar-status').textContent,/Synced/);
views[0].handlers.click();assert.equal(get('view-month').hidden,false);
vm.runInContext("events=[{first:localKey(new Date('2026-11-01T06:30:00Z')),last:localKey(new Date('2026-11-01T07:30:00Z'))}]",sandbox);
assert.equal(vm.runInContext("onDay('2026-11-01').length",sandbox),1); // Chicago DST transition
vm.runInContext("events=[{first:localKey(new Date('2026-10-25T04:00:00Z')),last:localKey(new Date(new Date('2026-10-25T05:00:00Z').getTime()-1))}]",sandbox);
assert.equal(vm.runInContext("onDay('2026-10-24').length",sandbox),1);
assert.equal(vm.runInContext("onDay('2026-10-25').length",sandbox),0); // ends exactly at Chicago midnight
console.log('Calendar checks passed: pagination, recurrence request, cancellations, dates, secrets, cache, failures, refresh, deletion, navigation races, and fallback.');
