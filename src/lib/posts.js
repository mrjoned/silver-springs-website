import { makePosts } from './publishing.js';

const topicFiles = import.meta.glob('../content/announcement-topics/*.json', { eager: true, import: 'default' });
export const topics = Object.entries(topicFiles)
  .map(([path, data]) => ({ id: path.split('/').pop().replace(/\.json$/, ''), ...data }))
  .filter((topic) => topic.draft !== true && topic.id && topic.label)
  .sort((a, b) => (Number(a.order) || 0) - (Number(b.order) || 0) || a.label.localeCompare(b.label));
export const topicLabel = (id) => topics.find((topic) => topic.id === id)?.label || id;


const files = import.meta.glob('../content/announcements/*.json', { eager: true, import: 'default' });
export const posts = makePosts(Object.entries(files).map(([path, data]) => ({
  slug: path.split('/').pop().replace(/\.json$/, ''), data
})));

export const searchIndex = posts.map(({ id, title, excerpt, search, year, topics, published, path }) => ({
  id, title, excerpt, search, year, topics, published, path
}));
