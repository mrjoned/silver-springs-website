// Both URLs are now static outputs from the same repository catalog.
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';
const loader=await readFile(new URL('../public/assets/hub-data.js',import.meta.url),'utf8');
const example={enchantments:[{name:'Sample'}],items:['Helmet']};
function client(fetcher){const context=vm.createContext({window:{fetch:fetcher},Response});vm.runInContext(loader,context);return context.window.SSSHubData;}
let calls=[];
let api=client(async url=>{calls.push(url);return Response.json(example);});
assert.equal((await (await api.fetch()).json())._dataSource,'repository');assert.deepEqual(calls,['/api/enchantments']);
for(const bad of [()=>new Response('Unavailable',{status:503}),()=>{throw Error('offline');},()=>Response.json({invalid:true})]){
  calls=[];api=client(async url=>{calls.push(url);if(url==='/api/enchantments')return bad();return Response.json(example);});
  assert.equal((await (await api.fetch()).json()).enchantments[0].name,'Sample');
  assert.deepEqual(calls,['/api/enchantments','/runecrafting-hub/tools/enchantments.json']);
}
api=client(async()=>new Response('Unavailable',{status:503}));await assert.rejects(api.fetch(),/catalog unavailable/);
console.log('Catalog loader passed: primary static output, alternate output, malformed response, and offline handling.');
