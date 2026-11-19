(function () {
  'use strict';
  const hub = document.querySelector('.community-hub');
  if (!hub) return;
  let activePlayer;
  const tabs = [...hub.querySelectorAll('[role="tab"]')];
  const panels = [...hub.querySelectorAll('[role="tabpanel"]')];
  const keys = ['gallery', 'maps', 'videos'];
  const panelIds = { gallery: 'community-gallery', maps: 'community-maps', videos: 'community-videos' };
  const aliases = { gallery: 'gallery', 'community-gallery': 'gallery', maps: 'maps', 'community-maps': 'maps', videos: 'videos', 'community-videos': 'videos' };

  function activate(key, updateHistory) {
    if (!keys.includes(key)) return;
    if (key !== 'videos') closeVideo();
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

  function closeVideo(restoreFocus = false) {
    if (!activePlayer) return;
    const { button, preview, player, observer } = activePlayer;
    observer?.disconnect();
    player.remove();
    preview.hidden = false;
    activePlayer = undefined;
    if (restoreFocus) button.focus();
  }

  function playVideo(button) {
    const media = button.closest('.video-media');
    const preview = button.closest('.video-preview');
    const { videoPlatform, videoId } = button.dataset;
    const twitch = videoPlatform === 'twitch';
    if (twitch && media.clientWidth < 400) return;

    closeVideo();
    const embed = twitch
      ? new URL('https://clips.twitch.tv/embed')
      : new URL(`https://www.youtube-nocookie.com/embed/${videoId}`);
    if (twitch) {
      embed.searchParams.set('clip', videoId);
      embed.searchParams.set('parent', location.hostname);
    }
    embed.searchParams.set('autoplay', twitch ? 'true' : '1');

    const player = document.createElement('div');
    const frame = document.createElement('iframe');
    frame.className = twitch ? 'video-twitch-frame' : 'video-frame';
    frame.title = button.getAttribute('aria-label');
    frame.referrerPolicy = 'strict-origin-when-cross-origin';
    frame.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share';
    frame.allowFullscreen = true;
    frame.src = embed.href;

    const close = document.createElement('button');
    close.type = 'button';
    close.className = 'btn video-player-close';
    close.textContent = 'Close player';
    close.addEventListener('click', () => closeVideo(true));
    player.append(frame, close);
    preview.hidden = true;
    media.append(player);

    const observer = twitch ? new ResizeObserver(([entry]) => {
      if (entry.contentRect.width < 400) closeVideo();
    }) : undefined;
    activePlayer = { button, preview, player, observer };
    observer?.observe(media);
    frame.focus();
  }

  const grid = document.getElementById('video-grid');
  if (!grid) return;

  const cards = [...grid.querySelectorAll('[data-video-category]')];
  const filters = [...hub.querySelectorAll('[data-video-filter]')];
  const sort = document.getElementById('video-sort');
  const count = document.getElementById('video-count');
  const empty = document.getElementById('video-filter-empty');
  const pages = document.getElementById('video-pages');
  const pageNumber = document.getElementById('video-page-number');
  const previous = document.getElementById('video-previous');
  const next = document.getElementById('video-next');
  const pageSize = 12;
  let category = 'all';
  let page = 1;

  const videoDate = (card) => {
    const date = card.dataset.videoDate;
    return date == null || date === '' ? null : Number(date);
  };
  const oldestFirst = [...cards].sort((a, b) => {
    const first = videoDate(a);
    const second = videoDate(b);
    if (first === null) return second === null ? 0 : 1;
    if (second === null) return -1;
    return first - second;
  });

  function renderVideos() {
    closeVideo();
    const sorted = sort.value === 'oldest' ? oldestFirst : cards;
    const matches = sorted.filter((card) => category === 'all' || card.dataset.videoCategory === category);
    const totalPages = Math.ceil(matches.length / pageSize);
    const start = (page - 1) * pageSize;
    const visible = matches.slice(start, start + pageSize);
    const showing = new Set(visible);
    cards.forEach((card) => { card.hidden = !showing.has(card); });
    visible.forEach((card, index) => {
      if (grid.children[index] !== card) grid.insertBefore(card, grid.children[index]);
    });

    count.textContent = matches.length > 0
      ? `Showing ${start + 1}–${start + visible.length} of ${matches.length} ${matches.length === 1 ? 'video' : 'videos'}`
      : '0 videos';
    empty.hidden = matches.length > 0;
    pages.hidden = totalPages < 2;
    pageNumber.textContent = `Page ${page} of ${totalPages}`;
    previous.disabled = page <= 1;
    next.disabled = page >= totalPages;
  }

  filters.forEach((filter) => {
    filter.addEventListener('click', () => {
      if (category === filter.dataset.videoFilter) return;
      category = filter.dataset.videoFilter;
      filters.forEach((button) => button.setAttribute('aria-pressed', String(button === filter)));
      page = 1;
      renderVideos();
    });
  });
  sort.addEventListener('change', () => {
    page = 1;
    renderVideos();
  });

  function turnPage(step) {
    page += step;
    renderVideos();
    grid.focus({ preventScroll: true });
    grid.scrollIntoView({ block: 'start' });
  }
  previous.addEventListener('click', () => turnPage(-1));
  next.addEventListener('click', () => turnPage(1));

  grid.querySelectorAll('.video-play').forEach((button) => {
    button.hidden = false;
    button.addEventListener('click', () => playVideo(button));
  });
  renderVideos();
  document.getElementById('video-controls').hidden = false;
})();
