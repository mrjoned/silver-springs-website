import metadata from '../data/posts.json';

const bodies = import.meta.glob('../content/posts/*.html', {
  eager: true,
  query: '?raw',
  import: 'default'
});

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

function plainText(html) {
  const named = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ' };
  return html.replace(/<[^>]*>/g, ' ')
    .replace(/&(#x[\da-f]+|#\d+|amp|lt|gt|quot|apos|nbsp);/gi, (entity, key) => {
      if (key[0] !== '#') return named[key.toLowerCase()] || entity;
      const value = key[1].toLowerCase() === 'x' ? parseInt(key.slice(2), 16) : Number(key.slice(1));
      return value >= 0 && value <= 0x10ffff ? String.fromCodePoint(value) : entity;
    }).replace(/\s+/g, ' ').trim();
}

export const posts = metadata.map((entry) => {
  const body = bodies[`../content/posts/${entry.slug}.html`];
  if (typeof body !== 'string') throw new Error(`Missing article body: ${entry.slug}`);
  const date = new Date(entry.published);
  const dateISO = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Chicago', year: 'numeric', month: '2-digit', day: '2-digit' }).format(date);
  const dateLabel = new Intl.DateTimeFormat('en-US', { timeZone: 'America/Chicago', month: 'long', day: 'numeric', year: 'numeric' }).format(date);
  return {
    ...entry,
    body,
    path: `/changelog-and-faq/${entry.slug}/`,
    year: String(new Intl.DateTimeFormat('en-US', { timeZone: 'America/Chicago', year: 'numeric' }).format(date)),
    dateISO,
    dateLabel,
    search: `${entry.title} ${plainText(body)}`
  };
}).sort((a, b) => b.published - a.published);

export const searchIndex = posts.map(({ id, title, excerpt, search, year, topics, published, path }) => ({
  id, title, excerpt, search, year, topics, published, path
}));
