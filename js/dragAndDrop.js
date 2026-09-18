/**
 * DRAG AND DROP ENGINE
 * Native HTML5 Drag and Drop with visual dropzones, trash removal, and reordering.
 */

import { addCardToDeck, removeCardFromDeck, reorderDeck, canAddCardToDeck } from './state.js';
import { playCardPickup, playCardDrop, playCardRemove } from './sound.js';
import { showToast } from './app.js';
import { getCardById } from './cardsData.js';

let draggedData = null;

export function initDragAndDrop() {
  const deckDropzone = document.getElementById('deck-dropzone');
  const trashDropzone = document.getElementById('trash-dropzone');

  if (!deckDropzone || !trashDropzone) return;

  // Global Drag Start Listener (Delegated)
  document.addEventListener('dragstart', (e) => {
    const cardElem = e.target.closest('.tcg-card');
    if (!cardElem) return;

    const wrapper = cardElem.closest('.tcg-card-wrapper');
    if (!wrapper) return;

    const cardId = wrapper.dataset.cardId;
    const isDeckItem = wrapper.closest('.deck-grid') !== null;
    const isLibraryItem = wrapper.closest('.library-grid') !== null;

    if (!cardId) return;

    const source = isDeckItem ? 'deck' : (isLibraryItem ? 'library' : 'other');
    const index = isDeckItem ? parseInt(wrapper.dataset.deckIndex, 10) : -1;

    draggedData = { source, cardId, index };

    e.dataTransfer.effectAllowed = 'copyMove';
    e.dataTransfer.setData('application/json', JSON.stringify(draggedData));
    e.dataTransfer.setData('text/plain', cardId);

    // Styling
    cardElem.classList.add('is-dragging');
    playCardPickup();

    // If dragging from deck, activate trash dropzone
    if (isDeckItem) {
      trashDropzone.classList.add('is-active');
    }
  });

  // Global Drag End Listener
  document.addEventListener('dragend', (e) => {
    const cardElem = e.target.closest('.tcg-card');
    if (cardElem) cardElem.classList.remove('is-dragging');

    if (deckDropzone) deckDropzone.classList.remove('is-drag-over');
    if (trashDropzone) {
      trashDropzone.classList.remove('is-active');
      trashDropzone.classList.remove('is-drag-over');
    }

    draggedData = null;
  });

  // ==================== DECK DROPZONE HANDLERS ====================
  deckDropzone.addEventListener('dragenter', (e) => {
    e.preventDefault();
    if (draggedData) {
      deckDropzone.classList.add('is-drag-over');
    }
  });

  deckDropzone.addEventListener('dragover', (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = draggedData && draggedData.source === 'library' ? 'copy' : 'move';
  });

  deckDropzone.addEventListener('dragleave', (e) => {
    // Only remove if leaving outer boundary
    if (!deckDropzone.contains(e.relatedTarget)) {
      deckDropzone.classList.remove('is-drag-over');
    }
  });

  deckDropzone.addEventListener('drop', (e) => {
    e.preventDefault();
    deckDropzone.classList.remove('is-drag-over');

    let payload = draggedData;
    if (!payload) {
      try {
        const json = e.dataTransfer.getData('application/json');
        if (json) payload = JSON.parse(json);
      } catch {
        const textCardId = e.dataTransfer.getData('text/plain');
        if (textCardId) payload = { source: 'library', cardId: textCardId };
      }
    }

    if (!payload || !payload.cardId) return;

    if (payload.source === 'library') {
      // Add card from library to deck
      const check = canAddCardToDeck(payload.cardId);
      if (check.allowed) {
        addCardToDeck(payload.cardId);
        playCardDrop();
        const card = getCardById(payload.cardId);
        showToast(`Agregado: ${card ? card.name : 'Carta'} al mazo`, 'success');
      } else {
        showToast(check.reason, 'warning');
      }
    } else if (payload.source === 'deck') {
      // Reordering within deck: find if dropped over another deck card
      const targetCardWrapper = e.target.closest('.deck-grid .tcg-card-wrapper');
      if (targetCardWrapper && targetCardWrapper.dataset.deckIndex !== undefined) {
        const targetIndex = parseInt(targetCardWrapper.dataset.deckIndex, 10);
        if (payload.index !== -1 && targetIndex !== payload.index) {
          reorderDeck(payload.index, targetIndex);
          playCardDrop();
        }
      }
    }
  });

  // ==================== TRASH DROPZONE HANDLERS ====================
  trashDropzone.addEventListener('dragenter', (e) => {
    e.preventDefault();
    trashDropzone.classList.add('is-drag-over');
  });

  trashDropzone.addEventListener('dragover', (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  });

  trashDropzone.addEventListener('dragleave', (e) => {
    trashDropzone.classList.remove('is-drag-over');
  });

  trashDropzone.addEventListener('drop', (e) => {
    e.preventDefault();
    trashDropzone.classList.remove('is-drag-over');
    trashDropzone.classList.remove('is-active');

    let payload = draggedData;
    if (!payload) {
      try {
        const json = e.dataTransfer.getData('application/json');
        if (json) payload = JSON.parse(json);
      } catch {}
    }

    if (payload && payload.source === 'deck' && payload.cardId) {
      removeCardFromDeck(payload.cardId, true);
      playCardRemove();
      const card = getCardById(payload.cardId);
      showToast(`Removido: ${card ? card.name : 'Carta'} del mazo`, 'info');
    }
  });
}
