import assert from 'node:assert/strict';
import { renderStreamers } from '../src/lib/streamers.js';

const result = renderStreamers([
  { slug: 'second', data: { name: 'Second', platform: 'twitch', channel: 'second', bio: 'Later', image: '/second.png', order: 2 } },
  { slug: 'draft', data: { name: 'Hidden', platform: 'twitch', channel: 'hidden', bio: 'Hidden', image: '/hidden.png', draft: true, order: 0 } },
  { slug: 'first', data: { name: 'First & Co.', platform: 'twitch', channel: 'first', bio: 'A <strong>short</strong> bio.', image: '/first.png', order: 1 } }
]);

assert.deepEqual(result.streamers.map(streamer => streamer.slug), ['first', 'second']);
assert.match(result.html, /First &amp; Co\./);
assert.doesNotMatch(result.html, /Hidden/);
assert.match(result.html, /data-channel="first"/);
assert.match(result.html, /A <strong>short<\/strong> bio\./);

assert.match(renderStreamers([]).html, /Community streamers will appear here/);
console.log('Streamer rendering checks passed.');
