/**
 * BANLIST MANAGER
 * Lets the user define a persistent custom copy limit per card, overriding the
 * rarity-based default. Applies across Main Deck + Side Deck.
 */

import { CARDS_DATA, escapeHtml } from './cardsData.js';
import { state, RARITY_LIMITS, getBanlistLimit, setBanlistLimit, clearBanlistLimit, subscribeToBanlist } from './state.js';
import { playClick } from './sound.js';
import { showToast } from './app.js';

function defaultLimitFor(card) {
  const isSello = card.type === 'Sello' || card.isSello || !card.rarity;
  if (isSello) return state.maxDeckSize;
  return RARITY_LIMITS[card.rarity] || 4;
}

export function initBanlistModal() {
  const modal = document.getElementById('modal-banlist');
  const openBtn = document.getElementById('btn-banlist');
  const closeBtn = document.getElementById('btn-close-banlist');
  const closeFooterBtn = document.getElementById('btn-close-banlist-footer');
  const searchInput = document.getElementById('banlist-search');
  const searchResults = document.getElementById('banlist-search-results');
  const activeList = document.getElementById('banlist-active-list');
  const emptyMsg = document.getElementById('banlist-empty-msg');

  const closeModal = () => modal?.classList.remove('is-open');

  function renderSearchResults(query) {
    if (!searchResults) return;
    const q = query.trim().toLowerCase();
    if (!q) { searchResults.innerHTML = ''; return; }

    const matches = CARDS_DATA
      .filter(c => c.type !== 'Token' && !c.isToken && c.name.toLowerCase().includes(q))
      .slice(0, 15);

    if (matches.length === 0) {
      searchResults.innerHTML = `<div class="banlist-no-results">No se encontraron cartas.</div>`;
      return;
    }

    searchResults.innerHTML = matches.map(card => {
      const base = defaultLimitFor(card);
      const current = getBanlistLimit(card.id);
      return `
        <div class="banlist-row" data-card-id="${escapeHtml(card.id)}">
          <span class="banlist-row-name" title="${escapeHtml(card.name)}">${escapeHtml(card.name)}</span>
          <span class="banlist-row-default">Límite base: ${base}</span>
          <input type="number" min="0" max="${state.maxDeckSize}" step="1" class="banlist-limit-input" value="${current !== undefined ? current : base}">
          <button class="btn btn-secondary btn-sm" data-action="apply">Aplicar</button>
          ${current !== undefined ? `<button class="btn btn-danger btn-sm" data-action="clear">Quitar</button>` : ''}
        </div>
      `;
    }).join('');
  }

  function renderActiveList() {
    if (!activeList) return;
    const entries = Object.entries(state.banlist);
    if (entries.length === 0) {
      activeList.innerHTML = '';
      if (emptyMsg) emptyMsg.style.display = 'block';
      return;
    }
    if (emptyMsg) emptyMsg.style.display = 'none';
    activeList.innerHTML = entries.map(([cardId, limit]) => {
      const card = CARDS_DATA.find(c => c.id === cardId);
      const name = card ? card.name : cardId;
      return `
        <div class="banlist-active-row" data-card-id="${escapeHtml(cardId)}">
          <span class="banlist-row-name" title="${escapeHtml(name)}">${escapeHtml(name)}</span>
          <span class="banlist-row-limit">🚫 Límite: ${limit}</span>
          <button class="btn btn-danger btn-sm" data-action="clear">Quitar</button>
        </div>
      `;
    }).join('');
  }

  if (openBtn) {
    openBtn.addEventListener('click', () => {
      playClick();
      if (searchInput) searchInput.value = '';
      renderSearchResults('');
      renderActiveList();
      modal?.classList.add('is-open');
      searchInput?.focus();
    });
  }

  if (closeBtn) closeBtn.addEventListener('click', closeModal);
  if (closeFooterBtn) closeFooterBtn.addEventListener('click', closeModal);
  if (modal) {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) closeModal();
    });
  }
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal?.classList.contains('is-open')) closeModal();
  });

  if (searchInput) {
    searchInput.addEventListener('input', (e) => renderSearchResults(e.target.value));
  }

  function handleRowAction(container, rowSelector) {
    container.addEventListener('click', (e) => {
      const btn = e.target.closest('button');
      if (!btn) return;
      const row = e.target.closest(rowSelector);
      if (!row) return;
      const cardId = row.dataset.cardId;
      const card = CARDS_DATA.find(c => c.id === cardId);
      const cardName = card ? card.name : cardId;

      if (btn.dataset.action === 'apply') {
        const input = row.querySelector('.banlist-limit-input');
        const res = setBanlistLimit(cardId, input ? input.value : NaN);
        if (res.success) {
          showToast(`Límite de banlist actualizado para ${cardName}`, 'success');
        } else {
          showToast(res.reason, 'warning');
        }
      } else if (btn.dataset.action === 'clear') {
        clearBanlistLimit(cardId);
        showToast(`Restricción eliminada para ${cardName}`, 'info');
      }

      renderSearchResults(searchInput ? searchInput.value : '');
      renderActiveList();
    });
  }

  if (searchResults) handleRowAction(searchResults, '.banlist-row');
  if (activeList) handleRowAction(activeList, '.banlist-active-row');

  // Keep the modal in sync if the banlist changes elsewhere while it's open
  subscribeToBanlist(() => {
    if (modal?.classList.contains('is-open')) {
      renderSearchResults(searchInput ? searchInput.value : '');
      renderActiveList();
    }
  });
}
