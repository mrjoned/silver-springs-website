import { readdirSync, readFileSync, existsSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import { resolve } from 'node:path';

export const RUNE_NAMES = ['Aegis','Arcanum','Chills','Cinders','Echoes','Gusts','Kinesis','Moments','Mortus','Opulence','Sparks','Stones','Tides','Vitality','Void'];
export const SOURCES = ['Runecrafted','Mythical','Vanilla','Curse','Projects'];
export const SHOPS = ['badge','material','trial','boardwalk','village','reference'];
// Astro bundles this module into dist before prerendering. Resolve the source checkout from the build working directory.
const root = pathToFileURL(resolve(process.cwd())+'/');
const text = value => typeof value === 'string';
const assert = (ok,message) => { if (!ok) throw new Error('Catalog: '+message); };
function readEntries(folder,base) {
  const directory=new URL('src/content/'+folder+'/',base);
  return readdirSync(directory).filter(f=>f.endsWith('.json')).sort().map(file=>({...JSON.parse(readFileSync(new URL(file,directory),'utf8')),id:file.slice(0,-5)}));
}
function publishedEntries(rows,folder) {
  for(const e of rows)assert(typeof e.draft==='boolean',folder+'/'+e.id+' needs a Draft value');
  rows=rows.filter(e=>!e.draft).map(e=>structuredClone(e));
  const names=new Set();
  for(const e of rows){
    assert(text(e.name)&&e.name.trim(),folder+'/'+e.id+' needs a name');
    assert(!names.has(e.name.toLowerCase()),'duplicate '+folder+' name: '+e.name);names.add(e.name.toLowerCase());
    assert(text(e.description),e.name+' needs a description');
  }
  return rows;
}
export function parseCost(cost) {
  return cost.replace(/\s*\(Per Piece\)/i,'').replace(/Badges of Valor/gi,'Valor Badges').split(/\s*\+\s*/).map(part=>{
    const match=part.trim().replace(/(?<=\d),(?=\d)/g,'').match(/^(\d+)\s+(.+)$/);
    assert(match,'invalid purchase cost "'+cost+'"; use a quantity followed by a currency or material');
    const count=Number(match[1]);assert(Number.isSafeInteger(count),'cost quantity is too large');
    return {name:match[2].trim().replace(/^Valor Badge$/i,'Valor Badges'),count};
  });
}
export function loadGameCatalogs(base=root) {
  return makeGameCatalogs(readEntries('enchantments',base),readEntries('valor-items',base),existsSync(new URL('src/content/glossary/',base))?readEntries('glossary',base):[]);
}
export function makeGameCatalogs(enchantmentRows,valorRows,glossaryRows=[]) {
  const glossary=glossaryRows.filter(term=>{
    assert(typeof term.draft==='boolean','glossary/'+term.id+' needs a Draft value');
    return !term.draft;
  }).map(term=>({...term,name:term.name??''}));
  const termKeys=new Set();
  for(const term of glossary){
    assert(/^[a-z][a-z0-9-]*$/.test(term.key),'invalid glossary key');
    assert(!termKeys.has(term.key),'duplicate glossary key '+term.key);termKeys.add(term.key);
    assert(text(term.name),'glossary/'+term.key+' has an invalid display name');
    assert(text(term.description)&&term.description.trim(),term.key+' needs an explanation');
  }
  const enchantments=publishedEntries(enchantmentRows,'enchantments');
  for(const e of enchantments) {
    if(e.maxLevel===undefined||e.maxLevel==='')e.maxLevel=null;
    for(const key of ['items','incompatibleRunecrafted','incompatibleVanilla','runeTags','researchers'])if(e[key]===undefined||e[key]===null)e[key]=[];
    for(let i=1;i<=5;i++)if(e['rune'+i]===undefined||e['rune'+i]===null)e['rune'+i]='';
    assert(['free','once','per-level'].includes(e.costRule),e.name+' needs a rune cost rule');
    if(['Vanilla','Curse','Mythical'].includes(e.source))assert(e.costRule==='free',e.name+' must have no rune cost for its source');
    assert(SOURCES.includes(e.source),e.name+' has an invalid source');
    assert(text(e.category)&&e.category,e.name+' needs a category');
    assert(e.maxLevel===null||Number.isInteger(e.maxLevel)&&e.maxLevel>=1&&e.maxLevel<=10,e.name+' needs a max level from 1–10 (or blank for an unlevelled effect)');
    for(const field of ['items','incompatibleRunecrafted','incompatibleVanilla','runeTags','researchers']) assert(Array.isArray(e[field])&&e[field].every(text),e.name+' has an invalid '+field+' list');
    assert(e.items.length>0,e.name+' needs compatible equipment');
    for(let i=1;i<=5;i++) assert(e['rune'+i]===''||RUNE_NAMES.includes(e['rune'+i]),e.name+' has an invalid rune '+i);
    if(e.costRule!=='free')for(let i=1;i<=5;i++)assert(e['rune'+i],e.name+' needs all five recipe runes');
  }
  for(const e of enchantments){
    e.effects ??= [];
    assert(Array.isArray(e.effects),e.name+' has an invalid effects list');
    const keys=new Set();
    for(const effect of e.effects){
      assert(effect && /^[a-z][a-z0-9-]*$/.test(effect.key) && !keys.has(effect.key),e.name+' needs unique effect keys');keys.add(effect.key);
      assert(text(effect.label)&&effect.label.trim(),e.name+' effect needs a label');
      assert(Array.isArray(effect.levels)&&effect.levels.length>0,e.name+' effect needs level values');
      const levels=new Set();
      for(const row of effect.levels){
        assert(Number.isInteger(row.level)&&row.level>=1&&row.level<=(e.maxLevel||10)&&!levels.has(row.level),e.name+' effect has invalid or repeated levels');levels.add(row.level);
        assert(text(row.value)&&row.value.trim(),e.name+' effect needs a value');
      }
    }
  }
  enchantments.sort((a,b)=>a.name.localeCompare(b.name,'en'));
  const valor=publishedEntries(valorRows,'valor-items');
  const enchantmentIds=new Set(enchantments.map(e=>e.id));
  for(const e of valor) {
    for(const key of ['cost','skillRequirements','acquisition'])if(e[key]===undefined||e[key]===null)e[key]='';
    if(e.order===undefined||e.order===null)e.order=0;
    if(e.relatedEnchantments===undefined||e.relatedEnchantments===null)e.relatedEnchantments=[];
    if(Array.isArray(e.relatedEnchantments))e.relatedEnchantments=e.relatedEnchantments.map(ref=>typeof ref==='string'?ref.split('/').pop().replace(/\.json$/,''):ref);
    assert(text(e.category)&&e.category,e.name+' needs a category');
    assert(SHOPS.includes(e.shop),e.name+' needs a shop');
    assert(text(e.cost)&&text(e.skillRequirements)&&text(e.acquisition),e.name+' has an invalid cost, requirements, or acquisition');
    assert(Number.isFinite(e.order),e.name+' needs a display order');
    assert(Array.isArray(e.relatedEnchantments)&&e.relatedEnchantments.every(id=>enchantmentIds.has(id)),e.name+' links a missing or draft enchantment');
    if(e.category==='Additional Charms')assert(e.shop==='reference',e.name+' is an Additional Charm and must stay reference-only');
    if(e.shop!=='reference')parseCost(e.cost);
  }
  valor.sort((a,b)=>a.order-b.order||a.name.localeCompare(b.name,'en'));
  return { enchantments, valor, glossary };
}
export function enchantmentData(catalog=loadGameCatalogs()) {
  const enchantments=catalog.enchantments.map(e=>({
    id:e.id,name:e.name,effects:e.effects||[],runes:[1,2,3,4,5].map(i=>e['rune'+i]).filter(Boolean),items:e.items,maxLevel:e.maxLevel,
    incompatible:[...new Set([...e.incompatibleRunecrafted,...e.incompatibleVanilla])],description:e.description,
    source:e.source,category:e.category,costMode:e.costRule==='free'?'free':'runes',costRule:e.costRule
  }));
  return {enchantments,glossary:catalog.glossary||[],items:[...new Set(enchantments.flatMap(e=>e.items))].sort(),_dataSource:'repository'};
}
export function valorData(catalog=loadGameCatalogs()) {
  return catalog.valor.map(e=>({Id:e.id,Name:e.name,Category:e.category,Description:e.description,Cost:e.cost,'Skill Requirements':e.skillRequirements,'Acquisition (Non-Purchaseable)':e.acquisition,Shop:e.shop,RelatedEnchantments:e.relatedEnchantments.map(id=>catalog.enchantments.find(e=>e.id===id).name)}));
}
// JSON is embedded inside script elements; user-authored text must never close the script.
export const scriptJSON = value => JSON.stringify(value).replace(/</g,'\\u003c').replace(/>/g,'\\u003e').replace(/&/g,'\\u0026').replace(/\u2028/g,'\\u2028').replace(/\u2029/g,'\\u2029');
export function renderTool(name,catalog=loadGameCatalogs(),template) {
  assert(/^hub_(build_planner|comparison|encyclopedia|equipment_guide|rune_calculator)\.html$/.test(name),'unknown Hub tool');
  return (template??readFileSync(new URL('src/catalog-templates/'+name,root),'utf8')).replace('__SSS_ENCHANTMENT_DATA__',()=>scriptJSON(enchantmentData(catalog)));
}
export function renderValorShop(catalog=loadGameCatalogs(),template,legacyIds) {
  const legacy=legacyIds??JSON.parse(readFileSync(new URL('src/catalog-templates/valor-legacy-ids.json',root),'utf8'));
  return (template??readFileSync(new URL('src/catalog-templates/valor-shop.html',root),'utf8')).replace('__SSS_VALOR_DATA__',()=>scriptJSON(valorData(catalog))).replace('__SSS_LEGACY_IDS__',()=>scriptJSON(legacy));
}

const escapeHTML = value => String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const paragraphs = value => escapeHTML(value).replace(/\n/g,'<br>');
export function renderOverview(content,catalog=loadGameCatalogs()) {
  const count=category=>catalog.valor.filter(e=>e.category===category).length;
  const source=name=>catalog.enchantments.filter(e=>e.source===name).length;
  const reference=catalog.valor.filter(e=>e.category==='Additional Charms');
  const services=catalog.valor.filter(e=>e.category==='Service');
  const artifacts=catalog.valor.filter(e=>e.category==='Artifact');
  const prices=shop=>catalog.valor.filter(e=>e.shop===shop).map(e=>escapeHTML(e.name)+' — '+escapeHTML(e.cost)).join('; ')||'See the catalog for current availability.';
  const tokens={
    RUNECRAFTED_COUNT:source('Runecrafted'),MYTHICAL_COUNT:source('Mythical'),VALOR_COUNT:catalog.valor.length,
    RELIC_COUNT:count('Relic'),ARMOR_COUNT:count('Armor'),PURCHASE_CHARM_COUNT:catalog.valor.filter(e=>e.category==='Charm'&&e.shop!=='reference').length,
    CHARM_COUNT:count('Charm')+reference.length,ADDITIONAL_COUNT:reference.length,SERVICE_COUNT:services.length,ARTIFACT_COUNT:artifacts.length,
    PURCHASE_COUNT:catalog.valor.filter(e=>e.shop!=='reference').length,
    BOARDWALK_PRICES:prices('boardwalk'),VILLAGE_PRICES:prices('village'),
    ARTIFACT_ROWS:artifacts.map(e=>'<tr><th scope="row">'+escapeHTML(e.name)+'</th><td>'+escapeHTML(e.cost)+'</td></tr>').join(''),
    SERVICE_CARDS:services.map(e=>'<article class="card"><small>'+escapeHTML(e.cost)+'</small><h3>'+escapeHTML(e.name)+'</h3><p>'+paragraphs(e.description)+'</p></article>').join(''),
    ADDITIONAL_CARDS:reference.map(e=>'<article class="card"><small>REFERENCE ONLY</small><h3>'+escapeHTML(e.name)+'</h3><p>'+paragraphs(e.description)+'<br><br><strong>How to obtain:</strong> '+escapeHTML(e.acquisition)+(e.cost&&/^\d+\s+Boundary Shards?$/i.test(e.cost)?'<br><strong>Conversion requirement:</strong> '+escapeHTML(e.cost):'')+'</p></article>').join(''),
    BONUS_SLOT_INFO:catalog.valor.filter(e=>e.id==='reckqDpxJ1iWLf7Pu').map(e=>'<small>'+escapeHTML(e.cost)+'</small><h3>'+escapeHTML(e.name)+'</h3><p>'+paragraphs(e.description)+'</p>').join('')||'<h3>Charm slot upgrades</h3><p>Check the current catalog for availability.</p>'
  };
  return content.replace(/__SSS_([A-Z_]+)__/g,(match,key)=>{assert(key in tokens,'unknown guide token '+key);return tokens[key];});
}
