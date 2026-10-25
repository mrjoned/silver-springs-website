export const RUSHES = ['River Rush','Lucky Rush','Gold Rush','Parkour Rush','Void Rush','Ominous Rush','Experience Rush','Lunch Rush','Rune Rush'];
const DAY=86400000, WEEK=7*DAY;
// Parkour Rush starts Saturday October 24, 2026 at 02:00 America/Chicago.
const ANCHOR=Date.UTC(2026,9,24);
const central=new Intl.DateTimeFormat('en-US',{timeZone:'America/Chicago',year:'numeric',month:'numeric',day:'numeric',hour:'numeric',minute:'numeric',second:'numeric',hourCycle:'h23'});
function parts(ms){return Object.fromEntries(central.formatToParts(new Date(ms)).filter(p=>p.type!=='literal').map(p=>[p.type,Number(p.value)]));}
// Convert a Central wall-clock date to an instant, accounting for DST.
function atTwo(calendarDay){const desired=calendarDay+2*3600000;let instant=desired;for(let i=0;i<4;i++){const p=parts(instant);const actual=Date.UTC(p.year,p.month-1,p.day,p.hour,p.minute,p.second);const delta=desired-actual;if(!delta)break;instant+=delta;}return instant;}
export function rushAt(now=Date.now()){
 const p=parts(now),today=Date.UTC(p.year,p.month-1,p.day);
 let week=Math.floor((today-ANCHOR)/WEEK),day=ANCHOR+week*WEEK;
 let start=atTwo(day),end=atTwo(day+2*DAY);
 if(now>=end){week++;day+=WEEK;start=atTwo(day);end=atTwo(day+2*DAY);}
 const active=now>=start&&now<end;
 return {name:RUSHES[((week+3)%RUSHES.length+RUSHES.length)%RUSHES.length],active,start,end,target:active?end:start};
}
export function countdown(ms){const total=Math.max(0,Math.ceil(ms/1000)),days=Math.floor(total/86400),hours=Math.floor(total%86400/3600),minutes=Math.floor(total%3600/60),seconds=total%60;return (days?`${days}d `:'')+`${hours}h ${minutes}m ${seconds}s`;}
