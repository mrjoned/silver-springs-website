import { makePosts } from './publishing.js';

export const topics = [
  { id: 'gameplay', label: 'Gameplay' },
  { id: 'runecrafting', label: 'Runecrafting' },
  { id: 'valor-shop', label: 'Valor Shop' },
  { id: 'event', label: 'Events' },
  { id: 'build-contest', label: 'Build Contests' },
  { id: 'weekend-rush', label: 'Rush Weekends' },
  { id: 'faq', label: 'FAQ' },
  { id: 'miscellaneous', label: 'Miscellaneous' }
];
export const topicLabel = (id) => topics.find((topic) => topic.id === id)?.label || id;


const files = import.meta.glob('../content/announcements/*.json', { eager: true, import: 'default' });
export const posts = makePosts(Object.entries(files).map(([path, data]) => ({
  slug: path.split('/').pop().replace(/\.json$/, ''), data
})));

export const searchIndex = posts.map(({ id, title, excerpt, search, year, topics, published, path }) => ({
  id, title, excerpt, search, year, topics, published, path
}));
