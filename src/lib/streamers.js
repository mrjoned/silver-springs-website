const escape = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

export function renderStreamers(entries) {
  const streamers = entries.filter(({ data }) => data.draft !== true).map(({ slug, data }) => {
    if (!/^[a-z0-9_-]+$/.test(slug) || !data.name?.trim() || !data.channel?.trim() || !data.platform || !data.bio?.trim()) {
      throw new Error(`Streamer ${slug} needs a name, platform, channel, and bio.`);
    }
    if (data.platform !== 'twitch') throw new Error(`Streamer ${slug} has an unsupported platform.`);
    return { ...data, slug };
  }).sort((a, b) => (Number(a.order) || 0) - (Number(b.order) || 0) || a.name.localeCompare(b.name));
  const cards = streamers.map(s => `<article class="streamer-card" data-platform="${escape(s.platform)}" data-channel="${escape(s.channel)}" data-streamer="${escape(s.slug)}"><div class="streamer-profile"><img src="${escape(s.image)}" alt="${escape(s.imageAlt || `${s.name} profile image`)}" loading="lazy"><div><div class="eyebrow">${escape(s.platform === 'twitch' ? 'Twitch streamer' : 'YouTube creator')}</div><h2>${escape(s.name)}</h2><p>${s.bio}</p><a class="textlink" href="${escape(s.url || (s.platform === 'twitch' ? `https://twitch.tv/${s.channel}` : `https://youtube.com/@${s.channel}`))}" target="_blank" rel="noopener">Visit channel ↗</a></div></div><div class="streamer-live" hidden><div class="streamer-live-label"><span class="live-dot"></span>Live now</div><div class="streamer-player"></div></div></article>`).join('');
  return { streamers, html: cards || '<p class="empty-streamers">Community streamers will appear here as profiles are added.</p>' };
}
