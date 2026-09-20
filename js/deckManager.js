/**
 * DECK VIEW MANAGER
 * Renders Main Deck, Side Deck (shares copy limits with Main Deck), composition stats,
 * and Automated Extra Deck (Tokens).
 */

import { state, addCardToDeck, removeCardFromDeck, getDeckTotalCount, setDeckName, getActiveExtraDeckTokens } from './state.js';
import { getCardById, ELEMENTS } from './cardsData.js';
import { createCardElement, openCardInspector } from './cardInspector.js';
import { renderManaCurve } from './manaCurve.js';
import { playCardDrop, playCardRemove } from './sound.js';
import { showToast } from './app.js';

export function initDeckView() {
  const deckGrid = document.getElementById('deck-grid');
  const sideDeckGrid = document.getElementById('side-deck-grid');
  const extraDeckGrid = document.getElementById('extra-deck-grid');
  const deckNameInput = document.getElementById('deck-name-input');

  if (deckNameInput) {
    deckNameInput.value = state.deckName;
    deckNameInput.addEventListener('input', (e) => {
      setDeckName(e.target.value);
    });
  }

  setupDeckGridInteractions(deckGrid, 'main');
  setupDeckGridInteractions(sideDeckGrid, 'side');

  // Event Delegation on Extra Deck (Tokens - View only, click opens inspector)
  if (extraDeckGrid) {
    extraDeckGrid.addEventListener('click', (e) => {
      const cardWrapper = e.target.closest('.tcg-card-wrapper');
      if (cardWrapper && cardWrapper.dataset.cardId) {
        openCardInspector(cardWrapper.dataset.cardId);
      }
    });
  }
}

function setupDeckGridInteractions(gridEl, target) {
  if (!gridEl) return;

  gridEl.addEventListener('click', (e) => {
    const btn = e.target.closest('button');
    const cardWrapper = e.target.closest('.tcg-card-wrapper');
    if (!cardWrapper) return;

    const cardId = cardWrapper.dataset.cardId;
    if (!cardId) return;

    if (btn) {
      const action = btn.dataset.action;
      if (action === 'increment') {
        e.stopPropagation();
        const res = addCardToDeck(cardId, target);
        if (res.success) {
          playCardDrop();
        } else {
          showToast(res.reason, 'warning');
        }
      } else if (action === 'decrement') {
        e.stopPropagation();
        removeCardFromDeck(cardId, false, target);
        playCardRemove();
      } else if (action === 'inspect') {
        e.stopPropagation();
        openCardInspector(cardId);
      }
    } else {
      openCardInspector(cardId);
    }
  });

  gridEl.addEventListener('dblclick', (e) => {
    const cardWrapper = e.target.closest('.tcg-card-wrapper');
    if (cardWrapper && cardWrapper.dataset.cardId) {
      e.stopPropagation();
      removeCardFromDeck(cardWrapper.dataset.cardId, false, target);
      playCardRemove();
    }
  });
}

export function renderDeck() {
  const deckGrid = document.getElementById('deck-grid');
  const emptyState = document.getElementById('deck-empty-state');
  const totalCountElem = document.getElementById('deck-total-count');
  const statusBadge = document.getElementById('deck-status-badge');
  const countPill = document.getElementById('deck-count-pill');

  if (!deckGrid) return;

  const totalCount = getDeckTotalCount('main');

  // 1. Update Navbar Count and Legality Status
  if (totalCountElem) totalCountElem.textContent = totalCount;

  if (countPill && statusBadge) {
    countPill.classList.remove('is-valid', 'is-over');
    statusBadge.className = 'deck-status-badge';

    if (totalCount === state.maxDeckSize) {
      countPill.classList.add('is-valid');
      statusBadge.classList.add('is-ready');
      statusBadge.textContent = `Listo (${totalCount}/${state.maxDeckSize})`;
    } else if (totalCount > state.maxDeckSize) {
      countPill.classList.add('is-over');
      statusBadge.classList.add('is-overlimit');
      statusBadge.textContent = `Exceso (${totalCount}/${state.maxDeckSize})`;
    } else {
      statusBadge.classList.add('is-incomplete');
      statusBadge.textContent = `Incompleto (${totalCount}/${state.maxDeckSize})`;
    }
  }

  // 2. Render Main Deck Grid
  renderDeckGrid(deckGrid, state.deck, emptyState);

  // 3. Render Side Deck
  renderSideDeck();

  // 4. Render Automated Extra Deck (Tokens)
  const extraDeckGrid = document.getElementById('extra-deck-grid');
  const extraEmptyState = document.getElementById('extra-empty-state');
  const extraCountElem = document.getElementById('extra-tokens-count');
  const activeTokens = getActiveExtraDeckTokens();
  if (extraCountElem) extraCountElem.textContent = activeTokens.length;

  if (extraDeckGrid) {
    if (activeTokens.length === 0) {
      extraDeckGrid.innerHTML = '';
      if (extraEmptyState) extraEmptyState.style.display = 'flex';
    } else {
      if (extraEmptyState) extraEmptyState.style.display = 'none';
      extraDeckGrid.innerHTML = '';

      activeTokens.forEach(token => {
        const tokenElem = createCardElement(token, {
          isDeckItem: false,
          draggable: false
        });
        extraDeckGrid.appendChild(tokenElem);
      });
    }
  }

  // 5. Update Composition Breakdown
  updateDeckComposition();

  // 6. Update Mana Curve Chart
  renderManaCurve();
}

function renderDeckGrid(gridEl, deckArr, emptyStateEl) {
  if (!gridEl) return;
  if (deckArr.length === 0) {
    gridEl.innerHTML = '';
    if (emptyStateEl) emptyStateEl.style.display = 'flex';
  } else {
    if (emptyStateEl) emptyStateEl.style.display = 'none';
    gridEl.innerHTML = '';

    deckArr.forEach((item, index) => {
      const card = getCardById(item.cardId);
      if (!card) return;

      const cardElem = createCardElement(card, {
        isDeckItem: true,
        deckCount: item.count,
        draggable: true
      });
      cardElem.dataset.deckIndex = index;
      gridEl.appendChild(cardElem);
    });
  }
}

function renderSideDeck() {
  const sideDeckGrid = document.getElementById('side-deck-grid');
  const sideEmptyState = document.getElementById('side-deck-empty-state');
  const sideTotalElem = document.getElementById('side-deck-total-count');
  const sideCountPill = document.getElementById('side-deck-count-pill');

  const sideTotal = getDeckTotalCount('side');
  if (sideTotalElem) sideTotalElem.textContent = sideTotal;
  if (sideCountPill) {
    sideCountPill.classList.toggle('is-over', sideTotal > state.maxSideDeckSize);
    sideCountPill.classList.toggle('is-valid', sideTotal === state.maxSideDeckSize);
  }

  if (!sideDeckGrid) return;
  renderDeckGrid(sideDeckGrid, state.sideDeck, sideEmptyState);
}

function updateDeckComposition() {
  const creaturesPill = document.getElementById('pill-creatures');
  const fastSpellsPill = document.getElementById('pill-fast-spells');
  const slowSpellsPill = document.getElementById('pill-slow-spells');
  const structuresPill = document.getElementById('pill-structures');
  const artifactsPill = document.getElementById('pill-artifacts');
  const sellosPill = document.getElementById('pill-sellos');
  const terrainsPill = document.getElementById('pill-terrains');
  const elementDotsContainer = document.getElementById('element-distribution-dots');

  let typeCounts = {
    Criatura: 0,
    HechizoRapido: 0,
    HechizoLento: 0,
    Estructura: 0,
    Artefacto: 0,
    Sello: 0,
    Terreno: 0
  };

  let elementCounts = {
    marte: 0, neptuno: 0, jupiter: 0, tierra: 0, saturno: 0, mercurio: 0, urano: 0, pluton: 0, neutral: 0
  };

  state.deck.forEach(item => {
    const card = getCardById(item.cardId);
    if (!card) return;
    if (typeCounts[card.type] !== undefined) typeCounts[card.type] += item.count;
    if (elementCounts[card.element] !== undefined) elementCounts[card.element] += item.count;
  });

  if (creaturesPill) creaturesPill.textContent = `Criaturas: ${typeCounts.Criatura}`;
  if (fastSpellsPill) fastSpellsPill.textContent = `H. Rápido: ${typeCounts.HechizoRapido}`;
  if (slowSpellsPill) slowSpellsPill.textContent = `H. Lento: ${typeCounts.HechizoLento}`;
  if (structuresPill) structuresPill.textContent = `Estructuras: ${typeCounts.Estructura}`;
  if (artifactsPill) artifactsPill.textContent = `Artefactos: ${typeCounts.Artefacto}`;
  if (sellosPill) sellosPill.textContent = `Sellos: ${typeCounts.Sello}`;
  if (terrainsPill) terrainsPill.textContent = `Terrenos: ${typeCounts.Terreno}`;

  if (elementDotsContainer) {
    elementDotsContainer.innerHTML = '';
    for (const [elemKey, count] of Object.entries(elementCounts)) {
      if (count > 0 && elemKey !== 'neutral') {
        const info = ELEMENTS[elemKey];
        const dotDiv = document.createElement('div');
        dotDiv.className = 'elem-dot-item';
        dotDiv.title = `${info ? info.name : elemKey}: ${count} cartas en el mazo`;
        dotDiv.innerHTML = `
          <span class="elem-dot ${elemKey}"></span>
          <span>${count}</span>
        `;
        elementDotsContainer.appendChild(dotDiv);
      }
    }
  }
}
