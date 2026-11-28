const lockStyle = '#ss-custom-content .release-tab-locked{display:inline-flex;align-items:center;gap:.4rem;padding:.44rem .75rem;white-space:nowrap;color:var(--muted);font-weight:700;}';
const overviewTab = /<a\b[^>]*data-nav="overview"[^>]*>[\s\S]*?<\/a>/;
const panelContainer = '<div class="sscc-main">';

function escapeText(value) {
  return value.replace(/[&<>"']/g, character => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  })[character]);
}

export function renderContentRelease(content, release) {
  if (release.state === 'draft') return { content };
  if (!overviewTab.test(content) || !content.includes(panelContainer)) {
    throw new Error('Custom Content release placement is missing.');
  }

  if (release.state === 'coming-soon') {
    const teaser = '<span class="release-tab-locked" aria-disabled="true"><span aria-hidden="true">🔒</span> Coming Soon</span>';
    return { content: content.replace(overviewTab, tab => tab + teaser), style: lockStyle };
  }

  const { state, slug, label, panel, style, script } = release;
  if (state !== 'live' || typeof slug !== 'string' || !/^[a-z]+(?:-[a-z]+)*$/.test(slug) ||
      typeof label !== 'string' || !label.trim() ||
      typeof panel !== 'string' || !panel.includes(`data-page="${slug}"`) ||
      typeof style !== 'string' || /<\/style/i.test(style) ||
      typeof script !== 'string' || /<\/script/i.test(script)) {
    throw new Error('Invalid Custom Content release. Use the file exported by the release editor.');
  }

  const tab = `<a href="#sscc/${slug}" data-nav="${slug}">${escapeText(label)}</a>`;
  return {
    content: content.replace(overviewTab, overview => overview + tab)
      .replace(panelContainer, container => container + panel),
    style,
    script,
  };
}
