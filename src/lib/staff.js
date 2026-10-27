const escape = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
// Biographies and history are editor-authored rich text, like announcement bodies.
export function renderStaff(entries) {
 const staff=entries.filter(e=>e.data.draft!==true).map(({slug,data})=>{
  if(!/^[a-z0-9_-]+$/.test(slug)||!data.name?.trim()||!data.role?.trim()||!data.bio?.trim()||!/^\/assets\//.test(data.image||'')) throw Error(`Staff ${slug} needs a name, role, biography, and local image.`);
  return {...data,slug};
 }).sort((a,b)=>(Number(a.order)||0)-(Number(b.order)||0)||a.name.localeCompare(b.name));
 return {
 roster:`<nav class="roster" aria-label="Staff directory">${staff.map(s=>`<a href="#${escape(s.slug)}">${escape(s.name)}</a>`).join('')}</nav>`,
 cards:`<div class="staff-grid">${staff.map(s=>`<article class="staff-card" id="${escape(s.slug)}"><div class="staff-heading"><img class="portrait" src="${escape(s.image)}" alt="${escape(s.imageAlt||s.name+'’s Minecraft character')}" loading="lazy"><div><div class="eyebrow">${escape(s.role)}</div><h2>${escape(s.name)}</h2></div></div><div class="bio">${s.bio}</div>${s.history?.trim()?`<details><summary>Time on the team</summary>${s.history}</details>`:''}</article>`).join('')}</div>`
 };
}
