import assert from 'node:assert/strict';
import { writeFile, readFile, rm, access } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { rmSync } from 'node:fs';

const root = new URL('../', import.meta.url);
const fixtures = [
  ['src/content/announcements/cms-publishing-check.json', {
    title: 'CMS publishing build check', date: '2099-01-01T12:00:00-06:00',
    body: '<p>A temporary publishing integration check.</p>', draft: false, topics: ['gameplay']
  }],
  ['src/content/announcements/cms-hidden-draft-check.json', { title: 'CMS hidden draft check', draft: true }],
  ['src/content/photos/cms-gallery-check.json', {
    title: 'CMS gallery build check', image: '/assets/gallery/photo-01.jpg',
    alt: 'A temporary gallery integration check', date: '2026-10-20', draft: false, order: 0
  }]
];
function build() {
  rmSync(new URL('dist/', root), { recursive: true, force: true });
  try { execFileSync(process.execPath, ['node_modules/astro/bin/astro.mjs', 'build', '--force'], { cwd: root, stdio: 'pipe' }); }
  catch (error) { throw new Error([error.stdout?.toString(), error.stderr?.toString()].filter(Boolean).join('\n') || error.message); }
}
const created = [];
try {
  for (const [path, data] of fixtures) {
    await writeFile(new URL(path, root), JSON.stringify(data), { flag: 'wx' });
    created.push(path);
  }
  build();
  const home = await readFile(new URL('dist/index.html', root), 'utf8');
  const archive = await readFile(new URL('dist/changelog-and-faq/index.html', root), 'utf8');
  assert(home.includes('CMS publishing build check'));
  assert(archive.includes('CMS publishing build check'));
  assert(!home.includes('CMS hidden draft check') && !archive.includes('CMS hidden draft check'));
  await access(new URL('dist/changelog-and-faq/cms-publishing-check/index.html', root));
  await assert.rejects(access(new URL('dist/changelog-and-faq/cms-hidden-draft-check/index.html', root)));
  const gallery = await readFile(new URL('dist/gallery/index.html', root), 'utf8');
  const photos = JSON.parse(await readFile(new URL('dist/gallery/photos.json', root), 'utf8'));
  assert(gallery.includes('CMS gallery build check'));
  assert(gallery.includes('Showing all 46 photos'));
  assert(gallery.includes('value="2026"'));
  assert.equal(photos[0].name, 'CMS gallery build check');
  console.log('Build integration passed: a new post updates homepage/archive/routes, drafts stay hidden, and a new photo updates the grid/count/year filter/viewer metadata.');
} finally {
  for (const path of created) await rm(new URL(path, root));
  build();
  await assert.rejects(access(new URL('dist/changelog-and-faq/cms-publishing-check/index.html', root)));
}
