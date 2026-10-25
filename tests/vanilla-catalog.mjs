import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {loadGameCatalogs,enchantmentData,renderTool} from '../src/lib/game-catalogs.js';
const catalog=loadGameCatalogs(),data=enchantmentData(catalog);
const get=name=>{const e=data.enchantments.find(e=>e.name===name);assert(e,`Missing ${name}`);return e;};
assert.equal(data.enchantments.filter(e=>e.source==='Vanilla').length,32);
assert.equal(data.enchantments.filter(e=>e.source==='Enhanced Vanilla').length,9);
assert.equal(get('Curse of Binding').source,'Curse');
assert.equal(get('Unbreaking IV').source,'Runecrafted');
assert.equal(get('Unbreaking IV').runes.length,5);
for(const e of data.enchantments.filter(e=>['Vanilla','Enhanced Vanilla'].includes(e.source))){assert.equal(e.costMode,'free');assert.equal(e.runes.length,0);}
assert.equal(get('Lunge').maxLevel,3);assert.deepEqual(get('Lunge').items,['Spears']);
assert(get('Sharpness').items.includes('Spears'));
assert(!get('Sharpness').items.includes('Maces'));
assert.equal(get('Protection').maxLevel,4);
const source=fs.readFileSync('src/catalog-templates/hub_build_planner.html','utf8');
const context={};vm.createContext(context);
vm.runInContext(source.slice(source.indexOf('  const groupConflict ='),source.indexOf('  // Display direct incompatibility'))+'\nthis.conflict=namesConflict;',context);
for(const [a,b] of [['Infinity','Mending'],['Fortune','Silk Touch'],['Sharpness','Smite'],['Piercing','Multishot'],['Depth Strider','Frost Walker'],['Density','Breach'],['Unbreaking','Unbreaking IV'],['Fire Aspect','Fire Aspect III'],['Fire Protection V','Blast Protection V'],['Protection','Fire Protection V']]){
 assert(context.conflict(get(a),get(b)),`${a} should conflict with ${b}`);
 assert(context.conflict(get(b),get(a)),`${b} should conflict with ${a}`);
}
assert(!context.conflict(get('Channeling'),get('Riptide')),'Preserve server Riptide/Channeling exception');
assert(!context.conflict(get('Mending'),get('Lunge')));
for(const tool of ['build_planner','comparison','encyclopedia','equipment_guide','rune_calculator']){
 const html=renderTool(`hub_${tool}.html`,catalog);
 assert(html.includes('Enhanced Vanilla'));assert(html.includes('vanilla-lunge'));
}
console.log('Vanilla catalog: source migration, free costs, equipment, levels, upgrade conflicts, server exception and five tools passed.');
