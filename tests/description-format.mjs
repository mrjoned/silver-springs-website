import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import { loadGameCatalogs } from '../src/lib/game-catalogs.js';
const context=vm.createContext({URL});
vm.runInContext('globalThis.window=globalThis;',context);
vm.runInContext(readFileSync('public/vendor/marked-17.0.5.umd.js','utf8'),context);
vm.runInContext(readFileSync('public/assets/description-format.js','utf8'),context);
const format=context.SSSDescriptions.format;
assert.match(format('Each attack _revs the chainsaw_, then you _berserk_.'),/<em>revs the chainsaw<\/em>/);
assert.match(format('**Bold** and *italic* and __strong__ and `code_under_score`.'),/<strong>Bold<\/strong>/);
assert.match(format('**Bold** and *italic* and __strong__ and `code_under_score`.'),/<em>italic<\/em>/);
assert.match(format('**Bold** and *italic* and __strong__ and `code_under_score`.'),/<code>code_under_score<\/code>/);
assert.match(format('> **Runecrafting Bonus**: More power.'),/<blockquote><p><strong>Runecrafting Bonus<\/strong>/);
assert.match(format('- One\n- Two'),/<ul><li>/);
assert.match(format('1. One\n2. Two'),/<ol start="1"><li>/);
assert.match(format('Line one\nLine two'),/<br>/);
assert.match(format('first_last_name'),/first_last_name/);
assert.match(format('A & B < C'),/A &amp; B &lt; C/);
assert.match(format('[Details](https://example.com/test)'),/href="https:\/\/example.com\/test"/);
for(const input of [
 '<script>alert(1)</script>', '<img src=x onerror="alert(1)">', '<svg onload=alert(1)>',
 '[Bad](javascript:alert%281%29)', '[Bad](data:text/html,evil)', '[Bad](jav&#x61;script:evil)',
 '![Bad](https://example.com/track.png)', '<a href="javascript:evil">bad</a>'
]){
 const result=format(input);
 assert(!/<(?:script|img|svg|iframe|style)\b/i.test(result),input);
 assert(!/href="(?:javascript|data):/i.test(result),input);
 assert(!/\son(?:error|load)=/i.test(result.replace(/&lt;.*?&gt;/g,'')),input);
}
assert.match(format('<p><strong>Bold</strong>, <em>italic</em>, <u>underlined</u></p>'), /<u>underlined<\/u>/);
assert(!format('<u onclick=evil()>bad</u>').includes('<u onclick'));
const {enchantments,valor}=loadGameCatalogs();
for(const row of [...enchantments,...valor])assert.equal(typeof format(row.description),'string');
const chainsaw=enchantments.find(e=>e.name==='Chainsaw');
assert.match(format(chainsaw.description),/<em>revs the chainsaw<\/em>/);
assert.match(format(chainsaw.description),/<em>berserk<\/em>/);
console.log('Description formatting passed: full catalog, emphasis, bold, code, lists, line breaks, quotes, links, and hostile markup.');

for (const color of ['red','gold','yellow','green','aqua','blue','purple','pink','gray','white']) {
 assert.match(format(`<p>[${color}]colored text[/${color}]</p>`), new RegExp(`<span class="sss-color-${color}">colored text</span>`));
}
assert.match(format('<p>[red]<strong>Fire</strong> and <em>burning</em>[/red]</p>'), /<span class="sss-color-red"><strong>Fire<\/strong> and <em>burning<\/em><\/span>/);
assert.match(format('[aqua]**Freezing**[/aqua]'), /sss-color-aqua/);
assert.match(format('<p>[red]fire [gold]burst[/gold][/red]</p>'), /sss-color-red.*sss-color-gold/);
assert.match(format('[RED]Fire[/RED]'), /sss-color-red/);
assert(!format('`[red]code[/red]`').includes('sss-color'));
assert(!format('<pre><code>[red]code[/red]</code></pre>').includes('sss-color'));
assert(!format('[red]unclosed').includes('sss-color'));
assert(!format('[red]mismatch[/blue]').includes('sss-color'));
assert(!format('<p>[red]one</p><p>two[/red]</p>').includes('sss-color'));
assert(!format('[custom]unknown[/custom]').includes('sss-color'));
assert(!format('[Link](https://example.com/[red]x[/red])').includes('sss-color'));
console.log('Color tags passed: ten colors, rich text, nesting, code, links and malformed tags.');

const effects={effects:[{key:'speed',label:'Speed bonus',levels:[{level:2,value:'80%'},{level:1,value:'40%'}]}]};
const glossary=[{key:'freezing',name:'Freezing',description:'A shared explanation.',draft:false}];
const tip=format('<p>[effect:speed][gold]<strong>+40–80% speed</strong>[/gold][/effect]</p>',effects,glossary);
assert.match(tip,/tabindex="0" role="button"/);
assert.match(tip,/Level I: 40%\nLevel II: 80%/);
assert.match(tip,/sss-color-gold/);
assert(!tip.includes('[effect:'));
assert.match(format('[term:freezing]freezing[/term]',{},glossary),/A shared explanation/);
assert(!format('[term:freezing]freezing[/term]',{},[{...glossary[0],draft:true}]).includes('data-explanation'));
assert(!format('[effect:speed]speed[/effect]',{}).includes('data-explanation'));
assert.match(format('[effect:speed]speed[/effect]',effects),/40%/);
assert(!format('`[effect:speed]speed[/effect]`',effects).includes('data-explanation'));
assert(!format('<p>[effect:speed]one</p><p>two[/effect]</p>',effects).includes('data-explanation'));
const unsafe=format('[term:x]X[/term]',{},[{key:'x',name:'X',description:'" onmouseover="evil <script>alert(1)</script>'}]);
assert(unsafe.includes('&quot; onmouseover=&quot;'));
assert(!unsafe.includes('<script>'));
const {makeGameCatalogs,enchantmentData}=await import('../src/lib/game-catalogs.js');
const current=loadGameCatalogs();
const one=structuredClone(current.enchantments[0]);one.maxLevel=2;one.effects=effects.effects;
const built=makeGameCatalogs([one],[],[{...glossary[0],id:'freezing'}]);
assert.equal(enchantmentData(built).enchantments[0].effects[0].key,'speed');
assert.equal(enchantmentData(built).glossary[0].key,'freezing');
const invalid=structuredClone(one);invalid.effects[0].levels.push({level:2,value:'100%'});
assert.throws(()=>makeGameCatalogs([invalid],[]),/invalid or repeated levels/);
assert.throws(()=>makeGameCatalogs([one],[],[...glossary,...glossary]),/duplicate/);
console.log('Glossary and level effects passed: context, colors, keyboard markup, escaping, drafts, and validation.');
