export async function onRequestGet({params,env}){
  const headers={'Content-Type':'application/json','Cache-Control':'no-store'};
  if(!/^[a-f0-9]{24}$/.test(params.id))return new Response(JSON.stringify({error:'Invalid build link.'}),{status:400,headers});
  try{const row=await env.BUILDS_DB.prepare('SELECT payload FROM shared_builds WHERE id=?').bind(params.id).first();return new Response(row?row.payload:JSON.stringify({error:'This build could not be found.'}),{status:row?200:404,headers});}
  catch{return new Response(JSON.stringify({error:'Build sharing is temporarily unavailable.'}),{status:503,headers});}
}
