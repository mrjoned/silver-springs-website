import assert from 'node:assert/strict';
import { readFileSync, writeFileSync, unlinkSync, existsSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
const tools=['hub_build_planner','hub_comparison','hub_encyclopedia','hub_equipment_guide','hub_rune_calculator'];
const build=()=>{try{execFileSync(process.execPath,['node_modules/astro/bin/astro.mjs','build','--force'],{stdio:'pipe'});}catch(e){throw Error(e.stdout?.toString()+'\n'+e.stderr?.toString());}};
const read=p=>readFileSync(p,'utf8');
const enchant={name:'Fixture',source:'Runecrafted',category:'Damage',description:'Fixture',draft:false,maxLevel:2,items:['Swords'],costRule:'per-level',rune1:'Aegis',rune2:'Aegis',rune3:'Chills',rune4:'Chills',rune5:'Void',incompatibleRunecrafted:[],incompatibleVanilla:[],runeTags:[],researchers:[]};
const fixtures=[
 ['src/content/glossary/catalog-integration-term.json',{key:'catalog-integration-term',name:'Catalog integration term',description:'Published glossary explanation.',draft:false}],
 ['src/content/glossary/catalog-integration-hidden.json',{key:'catalog-integration-hidden',name:'Hidden glossary term',draft:true}],
 ['src/content/enchantments/catalog-integration-new.json',{...enchant,sourceRecordId:'',name:'Catalog integration enchantment',draft:false,description:'A temporary effect from the CMS catalog.'}],
 ['src/content/enchantments/catalog-integration-draft.json',{name:'Hidden catalog integration enchantment',draft:true}],
 ['src/content/valor-items/catalog-integration-new.json',{sourceRecordId:'',name:'Catalog integration artifact',category:'Artifact',description:'A temporary artifact from the CMS catalog.',cost:'2 Sticks + 3 Rune of Echoes',skillRequirements:'N/A',acquisition:'Test only',shop:'material',order:999,draft:false,relatedEnchantments:['src/content/enchantments/catalog-integration-new.json']}],
 ['src/content/valor-items/catalog-integration-draft.json',{name:'Hidden catalog integration artifact',draft:true}]
];
// Recover only our own known fixtures if a previous interrupted test left them behind.
for(const [path,value] of fixtures)if(existsSync(path)){
 const previous=JSON.parse(read(path));
 assert.equal(previous.name,value.name,'Refusing to replace an unrelated file at '+path);
 unlinkSync(path);
}
let created=[];
try{
 for(const [path,value]of fixtures){writeFileSync(path,JSON.stringify(value),{flag:'wx'});created.push(path);}
 build();
 const payload=JSON.parse(read('dist/api/enchantments'));
 assert(payload.glossary.some(t=>t.key==='catalog-integration-term'&&t.description==='Published glossary explanation.'));
 assert(!payload.glossary.some(t=>t.key==='catalog-integration-hidden'));
 assert(payload.enchantments.some(e=>e.name==='Catalog integration enchantment'));
 assert(!payload.enchantments.some(e=>e.name==='Hidden catalog integration enchantment'));
 assert.deepEqual(JSON.parse(read('dist/runecrafting-hub/tools/enchantments.json')),payload);
 for(const tool of tools){const html=read('dist/runecrafting-hub/tools/'+tool+'.html');assert(html.includes('Published glossary explanation.'));assert(!html.includes('Hidden glossary term'));assert(html.includes('Catalog integration enchantment'));assert(!html.includes('Hidden catalog integration enchantment'));assert(!html.includes('__SSS_'));}
 const shop=read('dist/valor-shop/index.html');assert(shop.includes('Catalog integration artifact'));assert(shop.includes('2 Sticks + 3 Rune of Echoes'));assert(!shop.includes('Hidden catalog integration artifact'));
 const overview=read('dist/content-overview/index.html');assert(overview.includes('Catalog integration artifact'));assert(overview.includes('2 Sticks + 3 Rune of Echoes'));assert(!overview.includes('__SSS_'));assert(!overview.includes('srcdoc='));
 const routes=JSON.parse(read('dist/_routes.json'));assert(routes.include.includes('/api/calendar'));assert(!routes.include.some(p=>p.includes('enchantments')));
 assert(read('dist/_headers').includes('Content-Type: application/json'));
 // Edit a published file without cleaning the build cache, then check every consumer again.
 const edited={...fixtures[4][1],cost:'9 Rune of Echoes',description:'Edited artifact effect.'};
 writeFileSync(fixtures[4][0],JSON.stringify(edited));
 writeFileSync(fixtures[0][0],JSON.stringify({...fixtures[0][1],description:'Edited glossary explanation.'}));
 build();
 assert(read('dist/api/enchantments').includes('Edited glossary explanation.'));
 for(const tool of tools)assert(read('dist/runecrafting-hub/tools/'+tool+'.html').includes('Edited glossary explanation.'));
 assert(read('dist/valor-shop/index.html').includes('9 Rune of Echoes'));
 assert(read('dist/content-overview/index.html').includes('9 Rune of Echoes'));
 assert(read('dist/valor-shop/index.html').includes('Edited artifact effect.'));
 console.log('Catalog build passed: new entries, edits, recipes, draft exclusion, all five tools, guide information, shop, and static API agree.');
}finally{
 for(const path of created){unlinkSync(path);assert(!existsSync(path),"fixture was not removed "+path);}

 build();
 assert(!read('dist/api/enchantments').includes('catalog-integration-term'));
 assert(!read('dist/api/enchantments').includes('Catalog integration enchantment'));
 assert(!read('dist/valor-shop/index.html').includes('Catalog integration artifact'));
}
