import { makePhotos } from './publishing.js';
const files = import.meta.glob('../content/photos/*.json', { eager: true, import: 'default' });
export const photos = makePhotos(Object.entries(files).map(([path, data]) => ({
  slug: path.split('/').pop().replace(/\.json$/, ''), data
})));
