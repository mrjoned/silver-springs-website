// All-day calendar dates use the calendar's timezone, not UTC or the visitor's zone.
export function eventInstant(value, allDay, zone = 'America/Chicago') {
  if (!allDay) return Date.parse(value);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value || '')) return NaN;
  const desired = Date.parse(value + 'T00:00:00Z');
  const format = new Intl.DateTimeFormat('en-US', {timeZone: zone, year:'numeric', month:'numeric', day:'numeric', hour:'numeric', minute:'numeric', second:'numeric', hourCycle:'h23'});
  let instant = desired;
  for (let i=0; i<4; i++) {
    const p = Object.fromEntries(format.formatToParts(new Date(instant)).filter(p=>p.type!=='literal').map(p=>[p.type,Number(p.value)]));
    const delta = desired - Date.UTC(p.year,p.month-1,p.day,p.hour,p.minute,p.second);
    if (!delta) break;
    instant += delta;
  }
  return instant;
}
export function activeEvents(events, now = Date.now(), zone = 'America/Chicago') {
  return events.filter(e=>e.category==='community' && !/rush|reset/i.test(e.title || ''))
    .map(e=>({...e,startMs:eventInstant(e.start,e.allDay,zone),endMs:eventInstant(e.end,e.allDay,zone)}))
    .filter(e=>e.startMs<=now && now<e.endMs)
    .sort((a,b)=>a.endMs-b.endMs || a.title.localeCompare(b.title));
}
