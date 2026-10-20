// This public adapter reuses the existing Netlify Airtable endpoint.
// Airtable credentials remain in the existing Netlify project.
const UPSTREAM = 'https://glistening-conkies-9b85d8.netlify.app/.netlify/functions/enchantments';

export async function onRequestGet() {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000);
  try {
    const response = await fetch(UPSTREAM, {
      headers: { Accept: 'application/json' },
      signal: controller.signal,
      cf: { cacheTtl: 300, cacheEverything: true }
    });
    if (!response.ok) throw new Error('Upstream unavailable');
    const data = await response.json();
    if (!Array.isArray(data.enchantments) || !Array.isArray(data.items)) {
      throw new Error('Invalid upstream data');
    }
    return Response.json({ ...data, _dataSource: 'live' }, {
      headers: { 'Cache-Control': 'public, max-age=60, s-maxage=300' }
    });
  } catch {
    // The client falls back to the bundled JSON if this endpoint is unavailable.
    return Response.json({ error: 'Live enchantment data is temporarily unavailable.' }, {
      status: 503,
      headers: { 'Cache-Control': 'no-store' }
    });
  } finally {
    clearTimeout(timeout);
  }
}
