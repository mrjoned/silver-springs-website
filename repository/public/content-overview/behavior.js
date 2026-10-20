(function () {
  'use strict';
  function mount() {
    const root = document.getElementById('ss-custom-content');
    if (!root || root.dataset.ssccReady === 'true') return;
    root.dataset.ssccReady = 'true';
    const $ = selector => root.querySelector(selector);
    const $$ = selector => Array.from(root.querySelectorAll(selector));
    const pages = $$('[data-page]');
    const featureSearch = $('#sscc-feature-search');
    const features = $$('[data-feature]');
    const nav = $('.sscc-navigation');
    const originalTitle = document.title;
    let current = '', toastTimer;
    function headerOffset() {
      const header = document.querySelector('#header') || document.querySelector('header');
      if (!header || root.contains(header)) return 0;
      const position = window.getComputedStyle(header).position;
      return position === 'fixed' || position === 'sticky' ? Math.max(0, header.getBoundingClientRect().bottom) : 0;
    }
    function measure() {
      root.style.setProperty('--sscc-host-header', headerOffset() + 'px');
      root.style.setProperty('--sscc-navigation-height', Math.ceil(nav.getBoundingClientRect().height) + 'px');
    }
    function scrollToElement(target) {
      measure();
      const offset = headerOffset() + nav.getBoundingClientRect().height + 16;
      const top = window.scrollY + target.getBoundingClientRect().top - offset;
      const reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      window.scrollTo({top:Math.max(0, top), behavior:reduced ? 'auto' : 'smooth'});
    }
    function filterFeatures() {
      const q = featureSearch.value.toLowerCase().trim();
      let count = 0;
      features.forEach(item => { item.hidden = !item.textContent.toLowerCase().includes(q); if (!item.hidden) count++; });
      const groups = Array.from(new Set(features.map(item => item.closest('section'))));
      groups.forEach(group => { group.hidden = !!q && !Array.from(group.querySelectorAll('[data-feature]')).some(item => !item.hidden); });
      $('#sscc-feature-results').textContent = count ? count + (count === 1 ? ' feature' : ' features') + (q ? (count === 1 ? ' matches your search' : ' match your search') : ' to explore') : 'No matching features. Try another word.';
    }
    function route(shouldScroll) {
      const ownHash = window.location.hash.startsWith('#sscc/');
      const parts = ownHash ? window.location.hash.slice(6).split('/') : [];
      const requested = parts[0] || 'overview';
      const key = pages.some(page => page.dataset.page === requested) ? requested : 'overview';
      const changed = key !== current;
      current = key;
      pages.forEach(page => { page.hidden = page.dataset.page !== key; });
      $$('[data-nav]').forEach(link => { if (link.dataset.nav === key) link.setAttribute('aria-current','page'); else link.removeAttribute('aria-current'); });
      const page = pages.find(item => item.dataset.page === key);
      document.title = key === 'overview' ? originalTitle : page.querySelector('h1').textContent + ' | ' + originalTitle;
      const section = parts[1];
      const target = section ? $('#sscc-' + key + '-' + section.replace(/[^a-z0-9_-]/gi,'')) : page;
      if (target && target.hidden && key === 'vanilla') { featureSearch.value=''; filterFeatures(); }
      if (shouldScroll && ownHash && target) requestAnimationFrame(() => scrollToElement(target));
      if (changed && shouldScroll && ownHash) page.querySelector('h1').focus({preventScroll:true});
    }
    featureSearch.addEventListener('input', filterFeatures);
    $('#sscc-rune-search').addEventListener('input', event => {
      const q = event.target.value.toLowerCase().trim(); let count = 0;
      $$('[data-rune]').forEach(row => { row.hidden = !row.textContent.toLowerCase().includes(q); if (!row.hidden) count++; });
      $('#sscc-rune-empty').hidden = count > 0;
    });
    root.addEventListener('click', async event => {
      const copy = event.target.closest('[data-copy]');
      if (copy && root.contains(copy)) {
        try {
          await navigator.clipboard.writeText(copy.dataset.copy);
          const toast = $('#sscc-toast'); toast.textContent = 'Copied ' + copy.dataset.copy; toast.hidden = false;
          clearTimeout(toastTimer); toastTimer = setTimeout(() => { toast.hidden = true; }, 1800);
        } catch (_) { window.prompt('Copy this:',copy.dataset.copy); }
        return;
      }
      const link = event.target.closest('a[href^="#sscc/"]');
      if (link && root.contains(link) && link.getAttribute('href') === window.location.hash) { event.preventDefault(); route(true); }
    });
    window.addEventListener('hashchange', () => { if (root.isConnected) route(true); });
    window.addEventListener('resize', () => { if (root.isConnected) measure(); });
    if (window.ResizeObserver) new ResizeObserver(() => { if (root.isConnected) measure(); }).observe(nav);
    filterFeatures(); measure(); route(window.location.hash.startsWith('#sscc/'));
    const loading = $('[data-sscc-loading]'); if (loading) loading.hidden = true;
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded',mount,{once:true});
  else mount();
})();