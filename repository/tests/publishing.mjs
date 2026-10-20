import assert from 'node:assert/strict';
import { makePosts, makePhotos } from '../src/lib/publishing.js';

const post = (slug, date, extra = {}) => ({ slug, data: {
  title: slug, date, body: '<p>Hello <strong>Silver Springs</strong> &amp; friends.</p>', ...extra
} });
const posts = makePosts([
  post('older', '2026-10-01T15:00:00-05:00'),
  post('newest', '2026-10-20T01:00:00-05:00'),
  { slug: 'unfinished', data: { draft: true } }
]);
assert.deepEqual(posts.map(p => p.slug), ['newest', 'older']);
assert.equal(posts[0].path, '/changelog-and-faq/newest/');
assert.equal(posts[0].excerpt, 'Hello Silver Springs & friends.');
assert.equal(posts[0].dateISO, '2026-10-20');
assert.equal(makePosts([post('midnight-utc', '2026-10-20T00:00:00Z')])[0].dateISO, '2026-10-19');
assert.equal(makePosts([post('stable-url', '2026-10-20T01:00:00-05:00', { title: 'Edited title' })])[0].path, '/changelog-and-faq/stable-url/');
assert.throws(() => makePosts([post('bad-date', 'not-a-date')]), /publication date/);
assert.throws(() => makePosts([post('bad/slug', '2026-10-20')]), /filename/);

const photo = (slug, extra = {}) => ({ slug, data: {
  title: slug, image: '/assets/gallery/photo-01.jpg', alt: 'A community build', ...extra
} });
const photos = makePhotos([
  photo('imported-1', { order: 1, date: '2023-08-13' }),
  photo('imported-2', { order: 2 }),
  photo('new-upload', { order: 0, date: '2026-10-20' }),
  { slug: 'unfinished-photo', data: { draft: true } }
]);
assert.deepEqual(photos.map(p => p.id), ['new-upload', 'imported-1', 'imported-2']);
assert.equal(photos[0].year, '2026');
assert.equal(photos[2].year, 'more');
assert.equal(photos[0].source, photos[0].src);
assert.throws(() => makePhotos([photo('missing-description', { alt: '' })]), /description/);
console.log('Publishing checks passed: draft exclusion, newest-post order, Chicago dates, stable URLs, automatic summaries, new-photo ordering, and year filters.');
