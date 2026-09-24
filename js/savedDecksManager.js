/**
 * SAVED DECKS MANAGER
 * Modal to save the current deck (main + side) in the browser, and to load or delete
 * saved decks. Export / Import (text and JSON) stays available in its own modal.
 */

import { escapeHtml } from './cardsData.js';
import { state, getDeckTotalCount, listSavedDecks, saveCurrentDeck, deleteSavedDeck, loadSavedDeck, isCurrentDeckSaved } from './state.js';
import { playClick, playCardDrop } from './sound.js';
import { showToast } from './app.js';

export function initSavedDecksModal() {
  const modal = document.getElementById('modal-saved-decks');
  const openBtn = document.getElementById('btn-saved-decks');
  const closeBtn = document.getElementById('btn-close-saved-decks');
  const closeFooterBtn = document.getElementById('btn-close-saved-decks-footer');
  const nameInput = document.getElementById('saved-deck-name-input');
  const saveBtn = document.getElementById('btn-save-deck');
  const currentInfo = document.getElementById('saved-decks-current-info');
  const listEl = document.getElementById('saved-decks-list');
  const emptyMsg = document.getElementById('saved-decks-empty-msg');
  const errorMsg = document.getElementById('saved-decks-error');

  const closeModal = () => modal?.classList.remove('is-open');
  const countOf = list => (Array.isArray(list) ? list : [])
    .reduce((sum, item) => sum + (Number.isSafeInteger(item.count) ? item.count : 0), 0);

  function formatDate(timestamp) {
    try {
      return new Date(timestamp).toLocaleString('es-AR', { dateStyle: 'short', timeStyle: 'short' });
    } catch (err) {
      return '';
    }
  }

  function syncDeckNameInput() {
    const input = document.getElementById('deck-name-input');
    if (input) input.value = state.deckName;
  }

  function renderCurrentInfo() {
    if (!currentInfo) return;
    currentInfo.textContent = `Mazo actual: ${getDeckTotalCount('main')} cartas en el principal y ${getDeckTotalCount('side')} en el side deck.`;
  }

  function renderList() {
    if (!listEl) return;
    const result = listSavedDecks();

    if (!result.success) {
      listEl.innerHTML = '';
      if (emptyMsg) emptyMsg.style.display = 'none';
      if (errorMsg) {
        errorMsg.textContent = result.reason;
        errorMsg.style.display = 'block';
      }
      return;
    }

    if (errorMsg) errorMsg.style.display = 'none';
    if (emptyMsg) emptyMsg.style.display = result.decks.length === 0 ? 'block' : 'none';

    listEl.innerHTML = result.decks.map(deck => `
      <div class="saved-deck-row" data-deck-id="${escapeHtml(deck.id)}">
        <div class="saved-deck-info">
          <span class="saved-deck-name" title="${escapeHtml(deck.name)}">${escapeHtml(deck.name)}</span>
          <span class="saved-deck-meta">${countOf(deck.data.deck)} cartas &middot; Side ${countOf(deck.data.sideDeck)} &middot; ${escapeHtml(formatDate(deck.savedAt))}</span>
        </div>
        <button class="btn btn-primary btn-sm" data-action="load">Cargar</button>
        <button class="btn btn-danger btn-sm" data-action="delete">Eliminar</button>
      </div>
    `).join('');
  }

  function saveDeck() {
    let result = saveCurrentDeck(nameInput ? nameInput.value : '');
    if (!result.success && result.exists) {
      if (!confirm('Ya existe un mazo guardado con ese nombre. ¿Quieres sobrescribirlo?')) return;
      result = saveCurrentDeck(nameInput ? nameInput.value : '', { overwrite: true });
    }

    if (result.success) {
      playCardDrop();
      syncDeckNameInput();
      showToast(result.overwritten ? `Mazo «${state.deckName}» sobrescrito.` : `Mazo «${state.deckName}» guardado en este navegador.`, 'success');
      renderCurrentInfo();
      renderList();
    } else {
      showToast(result.reason, 'warning');
    }
  }

  function loadDeck(id, name) {
    const hasCards = state.deck.length > 0 || state.sideDeck.length > 0;
    if (hasCards && !isCurrentDeckSaved() &&
        !confirm(`El mazo actual no está guardado y se reemplazará por «${name}». ¿Quieres continuar?`)) {
      return;
    }

    const result = loadSavedDeck(id);
    if (result.success) {
      playCardDrop();
      syncDeckNameInput();
      const sideText = result.sideCount ? ` + ${result.sideCount} en el side deck` : '';
      showToast(`Mazo «${name}» cargado (${result.count} cartas${sideText}).`, 'success');
      closeModal();
    } else {
      showToast(result.reason || 'No se pudo cargar el mazo.', 'danger');
    }
  }

  function deleteDeck(id, name) {
    if (!confirm(`¿Eliminar el mazo guardado «${name}»? Esta acción no se puede deshacer.`)) return;
    const result = deleteSavedDeck(id);
    if (result.success) {
      showToast(`Mazo guardado «${name}» eliminado.`, 'info');
    } else {
      showToast(result.reason, 'warning');
    }
    renderList();
  }

  if (openBtn) {
    openBtn.addEventListener('click', () => {
      playClick();
      if (nameInput) nameInput.value = state.deckName;
      renderCurrentInfo();
      renderList();
      modal?.classList.add('is-open');
      if (nameInput) {
        nameInput.focus();
        nameInput.select();
      }
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

  if (saveBtn) saveBtn.addEventListener('click', saveDeck);
  if (nameInput) {
    nameInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') saveDeck();
    });
  }

  if (listEl) {
    listEl.addEventListener('click', (e) => {
      const btn = e.target.closest('button');
      const row = e.target.closest('.saved-deck-row');
      if (!btn || !row) return;

      const id = row.dataset.deckId;
      const listed = listSavedDecks();
      const entry = listed.success ? listed.decks.find(deck => deck.id === id) : null;
      if (!entry) {
        showToast('El mazo guardado ya no existe.', 'warning');
        renderList();
        return;
      }

      if (btn.dataset.action === 'load') loadDeck(id, entry.name);
      else if (btn.dataset.action === 'delete') deleteDeck(id, entry.name);
    });
  }
}
