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
