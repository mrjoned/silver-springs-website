const cacheHeaders = { 'Cache-Control': 'public, max-age=0, s-maxage=60', 'X-Content-Type-Options': 'nosniff' };
const fail = (message, status = 503) => Response.json({ error: message }, { status, headers: { 'Cache-Control': 'no-store' } });
export async function onRequestGet({ request, env }) {
  const channels = [...new Set(new URL(request.url).searchParams.getAll('channels').flatMap(value => value.split(',').map(name => name.trim().toLowerCase()).filter(name => /^[a-z0-9_]{1,25}$/.test(name))))].slice(0, 100);
  if (!channels.length) return Response.json({ streams: [] }, { headers: cacheHeaders });
  if (!env.TWITCH_CLIENT_ID || !env.TWITCH_CLIENT_SECRET) return fail('Live stream status is not configured.');
  const cache = globalThis.caches?.default;
  const cacheKey = new Request(new URL(request.url).origin + '/api/streamers?channels=' + channels.join(','));
  const hit = cache ? await cache.match(cacheKey) : null;
  if (hit) return hit;
  try {
    const tokenResponse = await fetch('https://id.twitch.tv/oauth2/token', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams({ client_id: env.TWITCH_CLIENT_ID, client_secret: env.TWITCH_CLIENT_SECRET, grant_type: 'client_credentials' }) });
    if (!tokenResponse.ok) throw new Error('token');
    const token = await tokenResponse.json();
    const query = channels.map(channel => `user_login=${encodeURIComponent(channel)}`).join('&');
    const streamResponse = await fetch('https://api.twitch.tv/helix/streams?' + query, { headers: { Authorization: `Bearer ${token.access_token}`, 'Client-Id': env.TWITCH_CLIENT_ID, Accept: 'application/json' } });
    if (!streamResponse.ok) throw new Error('streams');
    const payload = await streamResponse.json();
    const response = Response.json({ streams: Array.isArray(payload.data) ? payload.data.map(stream => ({ user_login: stream.user_login, user_name: stream.user_name, title: stream.title || '' })) : [] }, { headers: cacheHeaders });
    if (cache) await cache.put(cacheKey, response.clone());
    return response;
  } catch { return fail('Live stream status is temporarily unavailable.'); }
}
