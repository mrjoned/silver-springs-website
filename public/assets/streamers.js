(() => {
  const cards = [...document.querySelectorAll('[data-streamer]')];
  if (!cards.length) return;
  const live = async () => {
    const twitch = cards.filter(card => card.dataset.platform === 'twitch');
    if (!twitch.length) return;
    try {
      const names = twitch.map(card => card.dataset.channel).join(',');
      const response = await fetch('/api/streamers?channels=' + encodeURIComponent(names), { headers: { Accept: 'application/json' } });
      if (!response.ok) return;
      const payload = await response.json();
      const active = new Map((payload.streams || []).map(stream => [stream.user_login.toLowerCase(), stream]));
      twitch.forEach(card => {
        const stream = active.get(card.dataset.channel.toLowerCase());
        const panel = card.querySelector('.streamer-live');
        const player = card.querySelector('.streamer-player');
        if (!panel || !player) return;
        if (!stream) {
          panel.hidden = true;
          player.replaceChildren();
          return;
        }
        panel.hidden = false;
        if (player.childElementCount) return;
        player.innerHTML = `<iframe loading="lazy" title="Live stream from ${stream.user_name.replace(/[<>&\"']/g, '')}" src="https://player.twitch.tv/?channel=${encodeURIComponent(stream.user_login)}&parent=www.silverspringssurvival.com&parent=silverspringssurvival.com&autoplay=false&muted=false" allowfullscreen></iframe><p>${stream.title.replace(/[<>&\"']/g, '')}</p>`;
      });
    } catch { /* Profile cards remain useful if the status check is unavailable. */ }
  };
  live();
  setInterval(live, 120000);
})();
