(function () {
  'use strict';
  const hub = document.querySelector('.community-hub');
  if (!hub) return;
  const tabs = [...hub.querySelectorAll('[role="tab"]')];
  const panels = [...hub.querySelectorAll('[role="tabpanel"]')];
  const keys = ['gallery', 'maps', 'videos'];
  const panelIds = { gallery: 'community-gallery', maps: 'community-maps', videos: 'community-videos' };
  const aliases = { gallery: 'gallery', 'community-gallery': 'gallery', maps: 'maps', 'community-maps': 'maps', videos: 'videos', 'community-videos': 'videos' };

  function activate(key, updateHistory) {
    if (!keys.includes(key)) return;
    tabs.forEach((tab, index) => {
      const selected = keys[index] === key;
      tab.setAttribute('aria-selected', String(selected));
      tab.tabIndex = selected ? 0 : -1;
    });
    panels.forEach((panel) => { panel.hidden = panel.id !== panelIds[key]; });
    if (updateHistory) history.pushState(null, '', '#' + key);
  }
  const hash = decodeURIComponent(location.hash.slice(1));
  activate(aliases[hash] || hub.dataset.initialTab || 'gallery', false);

  tabs.forEach((tab, index) => {
    tab.addEventListener('click', (event) => { event.preventDefault(); activate(keys[index], true); });
    tab.addEventListener('keydown', (event) => {
      let next = null;
      if (event.key === 'ArrowRight') next = (index + 1) % tabs.length;
      if (event.key === 'ArrowLeft') next = (index + tabs.length - 1) % tabs.length;
      if (event.key === 'Home') next = 0;
      if (event.key === 'End') next = tabs.length - 1;
      if (next !== null) { event.preventDefault(); tabs[next].focus(); activate(keys[next], true); }
    });
  });

  function restoreFromHistory() {
    const key = aliases[decodeURIComponent(location.hash.slice(1))];
    activate(key || hub.dataset.initialTab || 'gallery', false);
  }
  addEventListener('popstate', restoreFromHistory);
  addEventListener('hashchange', restoreFromHistory);

  const filter = document.getElementById('video-filter');
  const cards = [...document.querySelectorAll('[data-video-category]')];
  const sort = document.getElementById('video-sort');
  const grid = document.getElementById('video-grid');
  function sortVideos() {
    if (!sort || !grid) return;
    const dated = cards.map((card, index) => {
      const value = card.getAttribute('data-video-date');
      const date = value === null || value === '' ? NaN : Number(value);
      return { card, index, date };
    });
    dated.sort((a, b) => {
      const aMissing = !Number.isFinite(a.date);
      const bMissing = !Number.isFinite(b.date);
      if (aMissing !== bMissing) return aMissing ? 1 : -1;
      if (aMissing) return a.index - b.index;
      return (sort.value === 'oldest' ? a.date - b.date : b.date - a.date) || a.index - b.index;
    });
    // Keep DOM order aligned with the visible order for keyboard navigation.
    dated.forEach(({ card }, index) => {
      if (grid.children[index] !== card) grid.insertBefore(card, grid.children[index] || null);
    });
  }
  if (sort) sort.addEventListener('change', sortVideos);
  const count = document.getElementById('video-count');
  const empty = document.getElementById('video-filter-empty');
  if (filter) filter.addEventListener('change', () => {
    let shown = 0;
    cards.forEach((card) => {
      const visible = filter.value === 'all' || card.dataset.videoCategory === filter.value;
      card.hidden = !visible;
      if (visible) shown += 1;
    });
    if (count) count.textContent = shown + (shown === 1 ? ' video' : ' videos');
    if (empty) empty.hidden = shown !== 0;
  });

  const twitchClips = hub.querySelectorAll('[data-twitch-clip]');
  if (!twitchClips.length) return;

  const clipObserver = new ResizeObserver((entries) => {
    for (const { target, contentRect } of entries) {
      const frame = target.querySelector('iframe');
      const preview = target.querySelector('[data-twitch-preview]');
      const fits = contentRect.width >= 400;
      if (fits === !frame.hidden) continue;

      if (fits) {
        const embed = new URL('https://clips.twitch.tv/embed');
        embed.searchParams.set('clip', target.dataset.twitchClip);
        embed.searchParams.set('parent', location.hostname);
        embed.searchParams.set('autoplay', 'false');
        frame.src = embed.href;
      } else {
        frame.removeAttribute('src');
      }
      frame.hidden = !fits;
      preview.hidden = fits;
    }
  });
  twitchClips.forEach((clip) => clipObserver.observe(clip));
})();
