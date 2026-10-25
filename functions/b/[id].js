export function onRequestGet({request,params}){
  if(!/^[a-f0-9]{24}$/.test(params.id))return new Response('Invalid build link.',{status:404});
  const url=new URL('/runecrafting-hub/tools/hub_build_planner.html',request.url);url.hash='shared='+params.id;
  return Response.redirect(url.href,302);
}
