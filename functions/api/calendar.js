// Public calendar only. The API key is a Cloudflare secret, never a browser value.
const CALENDAR_ID = 'silverspringsmrjoned@gmail.com';
const ZONE = 'America/Chicago';
function failure(message, status = 503) {
  return Response.json({ error: message }, { status, headers: { 'Cache-Control': 'no-store' } });
}
export function normalizeEvent(event) {
  if (event.status === 'cancelled') return null;
  const allDay = Boolean(event.start?.date);
  const start = allDay ? event.start.date : event.start?.dateTime;
  const end = allDay ? event.end?.date : event.end?.dateTime;
  if (!start || !end || !Number.isFinite(Date.parse(start)) || !Number.isFinite(Date.parse(end)) || Date.parse(end) <= Date.parse(start)) return null;
  const title = event.summary || 'Busy';
  return {
    id: event.id, title, start, end, allDay,
    description: event.description || '', location: event.location || '',
    category: /rush/i.test(title) ? 'rush' : /reset/i.test(title) ? 'reset' : 'community'
  };
}
export async function onRequestGet(context) {
  const requestUrl = new URL(context.request.url);
  const month = requestUrl.searchParams.get('month');
  if (!/^(20\d{2})-(0[1-9]|1[0-2])$/.test(month || '')) return failure('Choose a month between 2000-01 and 2099-12.', 400);
  if (!context.env.GOOGLE_CALENDAR_API_KEY) return failure('Live calendar is not configured yet. Use Live calendar.');
  // Canonical cache key excludes arbitrary query parameters and all credentials.
  const cacheKey = new Request(requestUrl.origin + '/api/calendar?month=' + month);
  const cache = globalThis.caches?.default;
  const hit = cache ? await cache.match(cacheKey) : null;
  if (hit) return hit;
  const [year, number] = month.split('-').map(Number);
  // Include adjoining days shown in the month grid. UTC padding also covers Chicago DST.
  const timeMin = new Date(Date.UTC(year, number - 1, -6)).toISOString();
  const timeMax = new Date(Date.UTC(year, number, 8)).toISOString();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 12000);
  try {
    const events = [];
    let pageToken;
    for (let page = 0; page < 10; page++) {
      const url = new URL('https://www.googleapis.com/calendar/v3/calendars/' + encodeURIComponent(CALENDAR_ID) + '/events');
      url.search = new URLSearchParams({ key: context.env.GOOGLE_CALENDAR_API_KEY, timeMin, timeMax, singleEvents: 'true', showDeleted: 'false', orderBy: 'startTime', timeZone: ZONE, maxResults: '2500', ...(pageToken ? { pageToken } : {}) }).toString();
      const upstream = await fetch(url, { signal: controller.signal, headers: { Accept: 'application/json' } });
      if (!upstream.ok) throw new Error('Calendar unavailable');
      const payload = await upstream.json();
      if (!Array.isArray(payload.items)) throw new Error('Invalid calendar response');
      for (const item of payload.items) { const event = normalizeEvent(item); if (event) events.push(event); }
      pageToken = payload.nextPageToken;
      if (!pageToken) break;
    }
    if (pageToken) throw new Error('Incomplete calendar response');
    const response = Response.json({ source: 'google', month, timeZone: ZONE, fetchedAt: new Date().toISOString(), events }, {
      headers: { 'Cache-Control': 'public, max-age=0, s-maxage=300', 'X-Content-Type-Options': 'nosniff' }
    });
    if (cache) context.waitUntil(cache.put(cacheKey, response.clone()));
    return response;
  } catch {
    // Do not return upstream errors or log their URLs: they may contain the key.
    return failure('Live calendar is temporarily unavailable. Use Live calendar to check the schedule.');
  } finally { clearTimeout(timeout); }
}
