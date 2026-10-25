const json=(data,status=200)=>new Response(JSON.stringify(data),{status,headers:{'Content-Type':'application/json','Cache-Control':'no-store'}});
export function validateBuild(data){
  if(data?.version!==1||!Array.isArray(data.items)||!data.items.length||data.items.length>30)throw Error('Choose between 1 and 30 equipment pieces.');
  return {version:1,items:data.items.map(item=>{
    if(typeof item.type!=='string'||item.type.length>80||!Array.isArray(item.enchants)||item.enchants.length>60)throw Error('Invalid equipment.');
    const enchants=item.enchants.map(e=>{if(typeof e.name!=='string'||e.name.length>150||!Number.isInteger(e.level)||e.level<1||e.level>100)throw Error('Invalid enchantment.');return {name:e.name,level:e.level};});
    const gems=item.gems??[];if(!Array.isArray(gems)||gems.length>4||gems.some(g=>typeof g!=='string'||g.length>80))throw Error('Invalid gems.');
    const result={type:item.type,enchants,gems};
    for(const key of ['armorBase','toughnessBase','preservation','fortitude']){const value=item[key]??'';if(value!==''&&(typeof value!=='number'||!Number.isFinite(value)||value<0||value>100))throw Error('Invalid armor values.');result[key]=value;}
    return result;
  })};
}
export async function onRequestPost({request,env}){
  if(!env.BUILDS_DB)return json({error:'Build sharing is not configured yet.'},503);
  if(request.headers.get('Origin')!==new URL(request.url).origin)return json({error:'Please share from the website.'},403);
  if(!request.headers.get('Content-Type')?.includes('application/json'))return json({error:'Expected JSON.'},415);
  try{
    const reader=request.body?.getReader();if(!reader)return json({error:'Missing build.'},400);
    const chunks=[];let size=0;while(true){const {done,value}=await reader.read();if(done)break;size+=value.length;if(size>32768){await reader.cancel();return json({error:'This build is too large to share.'},413);}chunks.push(value);}
    const bytes=new Uint8Array(size);let offset=0;for(const chunk of chunks){bytes.set(chunk,offset);offset+=chunk.length;}
    let build;try{build=validateBuild(JSON.parse(new TextDecoder().decode(bytes)));}catch(e){return json({error:e.message},400);}
    const payload=JSON.stringify(build);
    const hash=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(payload))),b=>b.toString(16).padStart(2,'0')).join('');
    // Identical snapshots reuse one link and one database row.
    const id=hash.slice(0,24);
    await env.BUILDS_DB.prepare('INSERT OR IGNORE INTO shared_builds (id,fingerprint,payload) VALUES (?,?,?)').bind(id,hash,payload).run();
    return json({url:new URL('/b/'+id,request.url).href},201);
  }catch(e){console.error('Build sharing failed',e);return json({error:'Build sharing is temporarily unavailable. Please try again.'},503);}
}
