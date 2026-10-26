const escape = value => String(value ?? '').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const prose = value => escape(value).replace(/\n/g,'<br>');

export function renderTrials(entries) {
  const trials=entries.filter(e=>e.draft!==true).map(e=>({...e,classes:e.classes||[]}));
  const names=new Set();
  for(const trial of trials){
    for(const field of ['name','entryCost','length','playerLimit','rewards','equipment']){
      if(typeof trial[field]!=='string'||!trial[field].trim())throw new Error('Trial '+(trial.name||'entry')+' needs '+field);
    }
    if(names.has(trial.name.toLowerCase()))throw new Error('Duplicate Trial: '+trial.name);
    names.add(trial.name.toLowerCase());
    if(!Array.isArray(trial.classes)||trial.classes.some(c=>!c||typeof c.name!=='string'||!c.name.trim()||typeof c.description!=='string'||!c.description.trim()))throw new Error('Trial '+trial.name+' needs a name and description for each class');
    if(trial.order!=null&&!Number.isFinite(trial.order))throw new Error('Trial '+trial.name+' needs a numeric display order');
  }
  trials.sort((a,b)=>(a.order||0)-(b.order||0)||a.name.localeCompare(b.name));
  const equipment=t=>t.classes.length===1?t.classes[0].name:t.classes.length?t.classes.length+' classes':t.equipment;
  const table=trials.length?`<div class="tablewrap" tabindex="0" role="region" aria-label="Trial comparison"><table><caption>Compare the arenas before joining.</caption><thead><tr><th scope="col">Trial</th><th scope="col">Entry cost</th><th scope="col">Length</th><th scope="col">Classes / equipment</th><th scope="col">Player limit</th><th scope="col">Win rewards</th></tr></thead><tbody>${trials.map(t=>`<tr><th scope="row">${escape(t.name)}</th><td>${escape(t.entryCost)}</td><td>${escape(t.length)}</td><td>${escape(equipment(t))}</td><td>${escape(t.playerLimit)}</td><td>${escape(t.rewards)}</td></tr>`).join('')}</tbody></table></div>`:'<p>No Trials are currently listed.</p>';
  const classes=trials.map(t=>`<details><summary>${escape(t.name)} · ${escape(equipment(t))}</summary>${t.equipmentNotes?'<p>'+prose(t.equipmentNotes)+'</p>':''}${t.classes.length?'<p>'+t.classes.map(c=>'<strong>'+escape(c.name)+':</strong> '+prose(c.description)).join('<br>')+'</p>':''}</details>`).join('');
  return {table,classes};
}
