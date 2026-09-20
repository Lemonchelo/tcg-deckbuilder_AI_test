/**
 * DRAG AND DROP ENGINE
 * Native HTML5 Drag and Drop with visual dropzones and reordering.
 * Cards are removed from a deck by dragging them onto the Card Library display
 * (no separate trash bar is needed).
 */

import { addCardToDeck, removeCardFromDeck, reorderDeck, canAddCardToDeck } from './state.js';
import { playCardPickup, playCardDrop, playCardRemove } from './sound.js';
import { showToast } from './app.js';
import { getCardById } from './cardsData.js';

let draggedData = null;

function parsePayload(e) {
  let payload = draggedData;
  if (!payload) {
    try {
      const json = e.dataTransfer.getData('application/json');
      if (json) payload = JSON.parse(json);
    } catch {
      const textCardId = e.dataTransfer.getData('text/plain');
      if (textCardId) payload = { source: 'library', cardId: textCardId, index: -1 };
    }
  }
  return payload;
}

function setupDeckDropzone(dropzoneEl, gridSelector, target) {
  if (!dropzoneEl) return;

  dropzoneEl.addEventListener('dragenter', (e) => {
    e.preventDefault();
    if (draggedData) dropzoneEl.classList.add('is-drag-over');
  });

  dropzoneEl.addEventListener('dragover', (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = draggedData && draggedData.source === 'library' ? 'copy' : 'move';
  });

  dropzoneEl.addEventListener('dragleave', (e) => {
    if (!dropzoneEl.contains(e.relatedTarget)) {
      dropzoneEl.classList.remove('is-drag-over');
    }
  });

  dropzoneEl.addEventListener('drop', (e) => {
    e.preventDefault();
    dropzoneEl.classList.remove('is-drag-over');

    const payload = parsePayload(e);
    if (!payload || !payload.cardId) return;

    if (payload.source === 'library') {
      const check = canAddCardToDeck(payload.cardId, target);
      if (check.allowed) {
        addCardToDeck(payload.cardId, target);
        playCardDrop();
        const card = getCardById(payload.cardId);
        showToast(`Agregado: ${card ? card.name : 'Carta'} al ${target === 'side' ? 'Side Deck' : 'mazo'}`, 'success');
      } else {
        showToast(check.reason, 'warning');
      }
    } else if (payload.source === target) {
      // Reordering within the same deck: find if dropped over another card of that deck
      const targetCardWrapper = e.target.closest(`${gridSelector} .tcg-card-wrapper`);
      if (targetCardWrapper && targetCardWrapper.dataset.deckIndex !== undefined) {
        const targetIndex = parseInt(targetCardWrapper.dataset.deckIndex, 10);
        if (payload.index !== -1 && targetIndex !== payload.index) {
          reorderDeck(payload.index, targetIndex, target);
          playCardDrop();
        }
      }
    }
  });
}

export function initDragAndDrop() {
  const deckDropzone = document.getElementById('deck-dropzone');
  const sideDeckDropzone = document.getElementById('side-deck-dropzone');
  const libraryGrid = document.getElementById('library-grid');

  // Global Drag Start Listener (Delegated)
  document.addEventListener('dragstart', (e) => {
    const cardElem = e.target.closest('.tcg-card');
    if (!cardElem) return;

    const wrapper = cardElem.closest('.tcg-card-wrapper');
    if (!wrapper) return;

    const cardId = wrapper.dataset.cardId;
    if (!cardId) return;

    const isMainItem = wrapper.closest('#deck-grid') !== null;
    const isSideItem = wrapper.closest('#side-deck-grid') !== null;
    const isLibraryItem = wrapper.closest('#library-grid') !== null;

    const source = isMainItem ? 'main' : (isSideItem ? 'side' : (isLibraryItem ? 'library' : 'other'));
    const index = (isMainItem || isSideItem) ? parseInt(wrapper.dataset.deckIndex, 10) : -1;

    draggedData = { source, cardId, index };

    e.dataTransfer.effectAllowed = 'copyMove';
    e.dataTransfer.setData('application/json', JSON.stringify(draggedData));
    e.dataTransfer.setData('text/plain', cardId);

    // Styling
    cardElem.classList.add('is-dragging');
    playCardPickup();

    // Dragging a deck card highlights the library as the drop-to-remove target
    if ((isMainItem || isSideItem) && libraryGrid) {
      libraryGrid.classList.add('is-remove-target');
    }
  });

  // Global Drag End Listener
  document.addEventListener('dragend', (e) => {
    const cardElem = e.target.closest('.tcg-card');
    if (cardElem) cardElem.classList.remove('is-dragging');

    if (deckDropzone) deckDropzone.classList.remove('is-drag-over');
    if (sideDeckDropzone) sideDeckDropzone.classList.remove('is-drag-over');
    if (libraryGrid) {
      libraryGrid.classList.remove('is-remove-target');
      libraryGrid.classList.remove('is-drag-over');
    }

    draggedData = null;
  });

  // ==================== MAIN & SIDE DECK DROPZONES ====================
  setupDeckDropzone(deckDropzone, '#deck-grid', 'main');
  setupDeckDropzone(sideDeckDropzone, '#side-deck-grid', 'side');

  // ==================== CARD LIBRARY AS REMOVAL TARGET ====================
  if (libraryGrid) {
    libraryGrid.addEventListener('dragenter', (e) => {
      if (draggedData && (draggedData.source === 'main' || draggedData.source === 'side')) {
        e.preventDefault();
        libraryGrid.classList.add('is-drag-over');
      }
    });

    libraryGrid.addEventListener('dragover', (e) => {
      if (draggedData && (draggedData.source === 'main' || draggedData.source === 'side')) {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
      }
    });

    libraryGrid.addEventListener('dragleave', (e) => {
      if (!libraryGrid.contains(e.relatedTarget)) {
        libraryGrid.classList.remove('is-drag-over');
      }
    });

    libraryGrid.addEventListener('drop', (e) => {
      const payload = parsePayload(e);
      libraryGrid.classList.remove('is-drag-over');

      if (payload && (payload.source === 'main' || payload.source === 'side') && payload.cardId) {
        e.preventDefault();
        removeCardFromDeck(payload.cardId, true, payload.source);
        playCardRemove();
        const card = getCardById(payload.cardId);
        showToast(`Removido: ${card ? card.name : 'Carta'} del ${payload.source === 'side' ? 'Side Deck' : 'mazo'}`, 'info');
      }
    });
  }
}
