const escape = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const cell = value => value?.trim() ? escape(value.trim()).replace(/\n/g, '<br>') : 'Check <code>/rune</code> in-game.';

export function renderTomeSpells(entries) {
  const spells = entries.filter(entry => entry.draft !== true);
  for (const entry of spells) {
    if (!entry.rune?.trim()) throw new Error('Published Tome spell needs a rune name.');
  }
  spells.sort((a, b) => a.rune.localeCompare(b.rune));
  return `<div class="tablewrap" tabindex="0" role="region" aria-label="Runic Tome spells"><table><caption>Runic Tome spells</caption><thead><tr><th scope="col">Rune</th><th scope="col">Standard spell</th><th scope="col">Corrupted spell</th></tr></thead><tbody>${spells.map(entry => `<tr><th scope="row">${escape(entry.rune)}</th><td>${cell(entry.standardSpell)}</td><td>${cell(entry.corruptedSpell)}</td></tr>`).join('')}</tbody></table></div>`;
}
