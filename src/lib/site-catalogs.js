// Import every entry and template through Vite so additions, edits, and removals invalidate Astro's build cache.
import { makeGameCatalogs, enchantmentData as data, renderTool as tool, renderValorShop as shop, renderOverview as overview } from './game-catalogs.js';
import legacyIds from '../catalog-templates/valor-legacy-ids.json';
const enchantments=import.meta.glob('../content/enchantments/*.json',{eager:true,import:'default'});
const valor=import.meta.glob('../content/valor-items/*.json',{eager:true,import:'default'});
const templates=import.meta.glob('../catalog-templates/*.html',{eager:true,query:'?raw',import:'default'});
const entries=files=>Object.entries(files).map(([path,value])=>({...value,id:path.split('/').pop().replace(/\.json$/,'')}));
const catalog=makeGameCatalogs(entries(enchantments),entries(valor));
export const enchantmentData=()=>data(catalog);
export const renderTool=name=>tool(name,catalog,templates['../catalog-templates/'+name]);
export const renderValorShop=()=>shop(catalog,templates['../catalog-templates/valor-shop.html'],legacyIds);
export const renderOverview=content=>overview(content,catalog);
