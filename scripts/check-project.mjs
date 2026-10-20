import { readdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = fileURLToPath(new URL('../', import.meta.url));
async function walk(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const results = [];
  for (const entry of entries) {
    const full = path.join(directory, entry.name);
    if (entry.isDirectory()) results.push(...await walk(full));
    else results.push(full);
  }
  return results;
}
const allowed = path.join(root, 'public/runecrafting-hub/tools') + path.sep;
const conflicts = (await walk(path.join(root, 'public')))
  .filter((file) => file.endsWith('.html') && !file.startsWith(allowed));
if (conflicts.length) {
  throw new Error('Old static page HTML remains in public/. Replace the old public folder with the Astro package’s public folder. Astro pages belong in src/pages/. Conflicts: ' + conflicts.map((file) => path.relative(root, file)).join(', '));
}
console.log('Astro source layout verified; no stale static page conflicts.');
