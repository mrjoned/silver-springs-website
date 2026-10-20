export function plainText(html = '') {
  const named = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ' };
  return html.replace(/<[^>]*>/g, ' ')
    .replace(/&(#x[\da-f]+|#\d+|amp|lt|gt|quot|apos|nbsp);/gi, (entity, key) => {
      if (key[0] !== '#') return named[key.toLowerCase()] || entity;
      const value = key[1].toLowerCase() === 'x' ? parseInt(key.slice(2), 16) : Number(key.slice(1));
      return value >= 0 && value <= 0x10ffff ? String.fromCodePoint(value) : entity;
    }).replace(/\s+/g, ' ').trim();
}

export function makePosts(entries) {
  return entries.filter(({ data }) => data.draft !== true).map(({ slug, data }) => {
    if (!/^[a-z0-9-]+$/.test(slug)) throw new Error(`Invalid announcement filename: ${slug}`);
    const published = Date.parse(data.date);
    if (!data.title?.trim() || !Number.isFinite(published) || !data.body?.trim()) {
      throw new Error(`Published announcement ${slug} needs a title, publication date, and body.`);
    }
    const date = new Date(published);
    const options = { timeZone: 'America/Chicago' };
    const text = plainText(data.body);
    return {
      ...data,
      id: data.id || slug,
      slug,
      published,
      topics: Array.isArray(data.topics) ? data.topics : [],
      excerpt: data.excerpt?.trim() || (text.length > 240 ? text.slice(0, 237).trimEnd() + '…' : text),
      path: `/changelog-and-faq/${slug}/`,
      year: new Intl.DateTimeFormat('en-US', { ...options, year: 'numeric' }).format(date),
      dateISO: new Intl.DateTimeFormat('en-CA', { ...options, year: 'numeric', month: '2-digit', day: '2-digit' }).format(date),
      dateLabel: new Intl.DateTimeFormat('en-US', { ...options, month: 'long', day: 'numeric', year: 'numeric' }).format(date),
      search: `${data.title} ${text}`
    };
  }).sort((a, b) => b.published - a.published || a.slug.localeCompare(b.slug));
}

export function makePhotos(entries) {
  return entries.filter(({ data }) => data.draft !== true).map(({ slug, data }) => {
    if (!data.title?.trim() || !data.alt?.trim() || !/^\/assets\//.test(data.image || '')) {
      throw new Error(`Published photo ${slug} needs a caption, image description, and local image.`);
    }
    const date = data.date || '';
    if (date && (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !Number.isFinite(Date.parse(date)))) {
      throw new Error(`Invalid photo date in ${slug}`);
    }
    return {
      id: slug,
      src: data.image,
      source: data.image,
      name: data.title,
      alt: data.alt,
      date,
      year: date ? date.slice(0, 4) : 'more',
      order: Number.isFinite(Number(data.order)) ? Number(data.order) : 0
    };
  }).sort((a, b) => a.order - b.order || b.date.localeCompare(a.date) || a.id.localeCompare(b.id));
}
