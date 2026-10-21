// One-time migration audit. Future intentional CMS edits are expected to differ from this historical export.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { loadGameCatalogs } from '../src/lib/game-catalogs.js';
const baseline=JSON.parse(readFileSync('catalog-import/source-export.json','utf8')).tables;
const catalog=loadGameCatalogs();
assert.equal(catalog.enchantments.length,baseline.enchantments.length);
assert.equal(catalog.valor.length,baseline.valor.length);
const fields={
  'Enchantment Names':'name','Source':'source','Category':'category','What it do':'description','Item Types':'items',
  'Incompatible with (Runecrafted):':'incompatibleRunecrafted','Incompatible with (Vanilla):':'incompatibleVanilla',
  'Discoverer':'discoverer','Researchers':'researchers','Discovered Date':'discoveredDate','Discovered by:':'discoveredBy','Runes':'runeTags',
  ...Object.fromEntries([1,2,3,4,5].map(i=>['Rune '+i,'rune'+i]))
};
const valorFields={'Name':'name','Category':'category','Description':'description','Cost':'cost','Skill Requirements':'skillRequirements','Acquisition (Non-Purchaseable)':'acquisition'};
for(const [type,map] of [['enchantments',fields],['valor',valorFields]])for(const row of baseline[type]){
  const current=catalog[type].find(e=>e.id===row.id);assert(current,row.id);
  assert.equal(current.sourceRecordId,row.id);
  for(const [original,key] of Object.entries(map))if(original in row)assert.deepEqual(current[key],row[original],row.id+' '+original);
  if(type==='enchantments')assert.equal(current.maxLevel,row['Max Level']?Number(row['Max Level']):null);
}
console.log(`Migration audit passed: every original field preserved across ${catalog.enchantments.length} enchantments and ${catalog.valor.length} Valor entries.`);
