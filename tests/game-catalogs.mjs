import assert from 'node:assert/strict';
import { readFileSync, mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { pathToFileURL } from 'node:url';
import { join } from 'node:path';
import vm from 'node:vm';
import { loadGameCatalogs, enchantmentData, valorData, renderTool, renderValorShop, renderOverview, parseCost } from '../src/lib/game-catalogs.js';
const catalog=loadGameCatalogs(), data=enchantmentData(catalog);
// Fixed fixtures exercise arithmetic without requiring future CMS entries/prices to stay unchanged.
const fixtureRows=[
 ['Atlas','Relic','4 Valor Badges','badge'],['Bread Bowl','Charm','40,000 Silver','village'],['Protein Powder','Charm','40,000 Silver','village'],
 ['Balloon Animal','Charm','1250 Boardwalk Tickets','boardwalk'],['Abyssal','Armor','6 Valor Badges (Per Piece)','badge'],
 ['G.A.M.M.A.','Relic','12 Badges of Valor','badge'],['Revert Transmog','Service','0 Valor Badges','badge'],
 ['Runic Tome','Relic','250 Cultist Raid Trial Points','trial'],['Chamomile Tea','Charm','150 Greenhouse Trial Points','trial'],
 ['Checkered Flag','Additional Charms','Your Sanity','reference'],['Corrupted Footage','Additional Charms','1 Boundary Shard','reference'],
 ['Particle Wand','Artifact',"1 Stick + 1 Dragon's Breath",'material']
];
const fixtureCatalog={enchantments:[],valor:fixtureRows.map(([name,category,cost,shop],i)=>({id:'fixture-'+i,name,category,cost,shop,description:'Fixture',skillRequirements:'N/A',acquisition:'',relatedEnchantments:[]}))};
const valor=valorData(fixtureCatalog);
assert(data.enchantments.length>0&&valor.length>0);
for(const e of data.enchantments){if(e.costMode!=='free')assert.equal(e.runes.length,5);}
const byName=name=>valor.find(e=>e.Name===name);
const legacy=valor.map(e=>e.Id);
const legacyIndex=name=>legacy.indexOf(byName(name).Id);
const store=new Map();const storage={getItem:k=>store.get(k)??null,setItem:(k,v)=>store.set(k,v)};
const ctx=vm.createContext({window:{localStorage:storage}});
vm.runInContext(readFileSync('public/assets/valor-cart-storage.js','utf8'),ctx);
const helper=ctx.window.SSSValorStorage;
const canPurchase=item=>item.Shop!=='reference';
store.set('valor-shop-cart-v1',JSON.stringify({[legacyIndex('Atlas')]:2,[legacyIndex('Bread Bowl')]:1,[legacyIndex('Checkered Flag')]:4,'-1':3,'bad':4}));
store.set('valor-shop-purchased-v1',JSON.stringify({[legacyIndex('Atlas')]:true}));
let saved=helper.load(valor,legacy,canPurchase,storage);
assert.equal(saved.cart[valor.indexOf(byName('Atlas'))],2);assert.equal(saved.purchased[valor.indexOf(byName('Atlas'))],true);
assert.equal(saved.cart[valor.indexOf(byName('Checkered Flag'))],undefined);
helper.save(valor,saved.cart,saved.purchased,storage);
assert.equal(JSON.parse(store.get('valor-shop-cart-v2'))[byName('Atlas').Id],2);
const reordered=[{Id:'new-first',Shop:'badge'},...valor.toReversed()];
saved=helper.load(reordered,legacy,canPurchase,storage);
assert.equal(saved.cart[reordered.findIndex(e=>e.Id===byName('Atlas').Id)],2);
helper.save(reordered,{}, {},storage);assert.equal(Object.keys(helper.load(valor,legacy,canPurchase,storage).cart).length,0); // no resurrection from v1
const blocked={getItem(){throw Error('blocked');},setItem(){throw Error('blocked');}};
assert.doesNotThrow(()=>helper.load(valor,legacy,canPurchase,blocked));assert.doesNotThrow(()=>helper.save(valor,{}, {},blocked));

// Exercise the cart's real price and merchant logic without mounting its DOM.
const html=renderValorShop(fixtureCatalog);
const script=[...html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/g)].at(-1)[1];
const cartCtx=vm.createContext({window:{SSSValorStorage:{load:()=>({cart:{},purchased:{}}),save(){}}}});
vm.runInContext(script.slice(0,script.indexOf('const cats='))+`;globalThis.cartTest={ITEMS,parseCost,shopLocation,canPurchase,costsForEntries};`,cartCtx);
const api=cartCtx.cartTest;
function totals(names){return Object.fromEntries(api.costsForEntries(names.map(([name,n])=>[api.ITEMS.findIndex(e=>e.Name===name),n])));}
assert.equal(totals([['Bread Bowl',2],['Protein Powder',1]]).Silver,120000);
assert.equal(totals([['Balloon Animal',2]])['Boardwalk Tickets'],2500);
assert.equal(totals([['Atlas',2]])['Valor Badges'],8);
assert.equal(totals([['Abyssal',3]])['Valor Badges'],18);
assert.equal(totals([['G.A.M.M.A.',1]])['Valor Badges'],12);
assert.equal(totals([['Revert Transmog',1]])['Valor Badges'],0);
assert.equal(totals([['Runic Tome',1],['Chamomile Tea',1]])['Cultist Raid Trial Points'],250);
assert.equal(totals([['Runic Tome',1],['Chamomile Tea',1]])['Greenhouse Trial Points'],150);
assert.deepEqual(totals([['Checkered Flag',1],['Corrupted Footage',1]]),{});
assert.equal(totals([['Particle Wand',2]])["Dragon's Breath"],2);
for(const item of valor.filter(canPurchase))assert.deepEqual(JSON.parse(JSON.stringify(api.parseCost(item.Cost))),parseCost(item.Cost));

// Existing level, compatibility, and gem logic stays in the templates. Verify the selected cost rule reaches each actual helper.
for(const name of ['hub_build_planner.html','hub_comparison.html','hub_encyclopedia.html','hub_equipment_guide.html','hub_rune_calculator.html']){
 const html=renderTool(name,catalog);
 assert(!html.includes('__SSS_'));
 for(const match of html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/g))new vm.Script(match[1]);
 assert(html.includes('"costRule":"once"'));
 if(name==='hub_build_planner.html'){
   const fixed=html.match(/const hasFixedRomanLevel = ([^;]+);/)[1];
   const multiplier=html.match(/function runeMultiplier\(e, entry\) \{([^}]+)\}/)[1];
   const run=vm.runInNewContext('(function(e,entry){const hasFixedRomanLevel='+fixed+';'+multiplier+'})');
   assert.equal(run({costRule:'once'},{level:5}),1);assert.equal(run({costRule:'per-level'},{level:3}),3);
 }
 if(['hub_rune_calculator.html','hub_comparison.html'].includes(name)){
   const body=html.match(/function upgrade\(e\)\{([^}]+)\}/)[1];const upgrade=new Function('e',body);
   assert(upgrade({costRule:'once',name:'Future fixed upgrade'}));assert(!upgrade({costRule:'per-level',name:'Unbreaking IV'}));
 }
}
// Hostile authored text remains data, never markup or executable script.
const hostile=structuredClone(catalog);hostile.enchantments[0].description='</script><script>evil()</script>&';
assert(!renderTool('hub_build_planner.html',hostile).includes('<script>evil()'));
hostile.valor[0].description='<img src=x onerror=evil()> $&';
assert(!renderValorShop(hostile).includes('<img src=x'));
// The page resolves the separately rendered Tome table before catalog tokens.
const overview=renderOverview(readFileSync('src/content/pages/content-overview.html','utf8').replace('__SSS_TOME_SPELL_TABLE__',''),catalog);
assert(!overview.includes('__SSS_'));assert(!overview.includes('srcdoc='));assert(overview.includes('src="/valor-shop/"'));
// Validation is independent of fixed record counts and supports drafts with incomplete fields.
const fixture=mkdtempSync(join(tmpdir(),'sss-catalog-test-'));
try{
 for(const name of ['enchantments','valor-items'])mkdirSync(join(fixture,'src/content',name),{recursive:true});
 const enc={...catalog.enchantments[0],name:'Fixture',draft:false};
 const val={...catalog.valor[0],name:'Fixture item',draft:false,relatedEnchantments:['src/content/enchantments/fixture.json']};
 const put=(folder,name,value)=>writeFileSync(join(fixture,'src/content',folder,name+'.json'),JSON.stringify(value));
 put('enchantments','fixture',enc);put('valor-items','fixture-item',val);put('enchantments','hidden',{draft:true});
 const base=pathToFileURL(fixture+'/');assert.equal(loadGameCatalogs(base).valor.length,1);
 put('enchantments','fixture',{...enc,rune1:'Not a rune'});assert.throws(()=>loadGameCatalogs(base),/invalid rune/);
 put('enchantments','fixture',enc);put('valor-items','fixture-item',{...val,relatedEnchantments:['missing']});assert.throws(()=>loadGameCatalogs(base),/missing or draft/);
 put('valor-items','fixture-item',{...val,relatedEnchantments:[],category:'Additional Charms',shop:'badge'});assert.throws(()=>loadGameCatalogs(base),/reference-only/);
 put('valor-items','fixture-item',{...val,cost:'some badges'});assert.throws(()=>loadGameCatalogs(base),/invalid purchase cost/);
}finally{rmSync(fixture,{recursive:true,force:true});}
console.log('Game catalog checks passed: cart migration/reordering, all currencies, reference-only exclusions, cost rules, draft validation, cross references, and safe rendering.');
