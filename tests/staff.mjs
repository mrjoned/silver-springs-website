import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { renderStaff } from '../src/lib/staff.js';
const entries=readdirSync('src/content/staff').map(file=>({slug:file.replace('.json',''),data:JSON.parse(readFileSync('src/content/staff/'+file))}));
assert.equal(entries.length,9);
const rendered=renderStaff(entries);
assert.equal((rendered.cards.match(/class="staff-card"/g)||[]).length,9);
const sample={slug:'test',data:{name:'<Test>',role:'Moderator',image:'/assets/test.jpg',bio:'<p>Hello</p>',order:-1}};
const result=renderStaff([...entries,sample,{slug:'hidden',data:{draft:true}}]);
assert.ok(result.roster.includes('&lt;Test&gt;'));
assert.ok(!result.cards.includes('id="hidden"'));
assert.ok(!result.cards.slice(0,result.cards.indexOf('id="mr_simba"')).includes('<summary>Time on the team</summary>'));
assert.throws(()=>renderStaff([{slug:'bad',data:{name:'Missing fields'}}]));
const built=readFileSync('dist/staffoverview/index.html','utf8');
for(const {slug,data} of entries) { assert.ok(built.includes('id="'+slug+'"'));assert.ok(built.includes(data.bio)); }
assert.ok(!built.includes('<!--staff-'));
assert.ok(!readFileSync('dist/runecrafting-hub/tools/hub_encyclopedia.html','utf8').includes('same Airtable source'));
console.log('Staff migration, rendering, drafts, ordering, optional history, and built output passed.');
