// Run with: node tests/data-connection.mjs
// No credentials, services, or installed packages are required by these checks.
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';

const source = await readFile(new URL('../functions/api/enchantments.js', import.meta.url), 'utf8');
const { onRequestGet } = await import('data:text/javascript;base64,' + Buffer.from(source).toString('base64'));
const originalFetch = globalThis.fetch;
const example = { enchantments: [{ name: 'Sample', items: ['Helmet'] }], items: ['Helmet'] };
let checks = 0;
try {
  globalThis.fetch = async (url, options) => {
    assert.equal(url, 'https://glistening-conkies-9b85d8.netlify.app/.netlify/functions/enchantments');
    assert.equal(options.headers.Accept, 'application/json');
    return Response.json(example);
  };
  let response = await onRequestGet();
  assert.equal(response.status, 200);
  assert.equal(response.headers.get('Cache-Control'), 'public, max-age=60, s-maxage=300');
  assert.deepEqual(await response.json(), { ...example, _dataSource: 'live' });
  checks++;

  for (const upstream of [
    async () => new Response('Unavailable', { status: 503 }),
    async () => Response.json({ unexpected: 'payload' }),
    async () => { throw new Error('Network unavailable'); }
  ]) {
    globalThis.fetch = upstream;
    response = await onRequestGet();
    assert.equal(response.status, 503);
    assert.equal(response.headers.get('Cache-Control'), 'no-store');
    assert.equal(typeof (await response.json()).error, 'string');
    checks++;
  }
} finally {
  globalThis.fetch = originalFetch;
}

const loader = await readFile(new URL('../public/assets/hub-data.js', import.meta.url), 'utf8');
function client(fetcher) {
  const context = vm.createContext({ window: { fetch: fetcher }, Response });
  vm.runInContext(loader, context);
  return context.window.SSSHubData;
}
let calls = [];
let api = client(async url => { calls.push(url); return Response.json({ ...example, _dataSource: 'live' }); });
assert.equal((await (await api.fetch()).json())._dataSource, 'live');
assert.deepEqual(calls, ['/api/enchantments']);
checks++;

for (const failWithNetwork of [false, true]) {
  calls = [];
  api = client(async url => {
    calls.push(url);
    if (url === '/api/enchantments') {
      if (failWithNetwork) throw new Error('Offline');
      return new Response('Unavailable', { status: 503 });
    }
    return Response.json(example);
  });
  const result = await (await api.fetch()).json();
  assert.equal(result._dataSource, 'snapshot');
  assert.equal(result.enchantments[0].name, 'Sample');
  assert.deepEqual(calls, ['/api/enchantments', '/runecrafting-hub/tools/enchantments.json']);
  checks++;
}
api = client(async () => new Response('Unavailable', { status: 503 }));
await assert.rejects(api.fetch(), /Reference data unavailable/);
checks++;
console.log(`Passed ${checks} data-connection checks: live data, invalid/upstream failures, snapshot fallback, and offline behavior.`);
