/**
 * SAMPLE HAND SIMULATOR (MULLIGAN TESTER)
 */

import { state, getDeckTotalCount } from './state.js';
import { getCardById } from './cardsData.js';
import { createCardElement } from './cardInspector.js';
import { playShuffle, playCardDrop, playClick } from './sound.js';
import { showToast } from './app.js';

let currentHand = [];
let remainingDeck = [];
let hasMulliganed = false;

/**
 * Fisher-Yates Shuffle Algorithm
 */
function shuffleArray(array) {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/**
 * Build a flat array of cards from deck state
 */
function buildFullDeckArray() {
  const fullList = [];
  state.deck.forEach(item => {
    const card = getCardById(item.cardId);
    if (card) {
      for (let i = 0; i < item.count; i++) {
        fullList.push(card);
      }
    }
  });
  return fullList;
}

export function initTestHandModal() {
  const modal = document.getElementById('modal-test-hand');
  const openBtn = document.getElementById('btn-test-hand');
  const closeBtn = document.getElementById('btn-close-test-hand');
  const mulliganBtn = document.getElementById('btn-mulligan');
  const drawOneBtn = document.getElementById('btn-draw-one');
  const resetBtn = document.getElementById('btn-reset-hand');

  if (openBtn) {
    openBtn.addEventListener('click', () => {
      const totalCount = getDeckTotalCount();
      if (totalCount < 5) {
        showToast('Necesitas al menos 5 cartas en el mazo para simular una mano inicial.', 'warning');
        return;
      }
      playShuffle();
      startNewHand();
      if (modal) modal.classList.add('is-open');
    });
  }

  if (closeBtn && modal) {
    closeBtn.addEventListener('click', () => modal.classList.remove('is-open'));
    modal.addEventListener('click', (e) => {
      if (e.target === modal) modal.classList.remove('is-open');
    });
  }

  if (mulliganBtn) {
    mulliganBtn.addEventListener('click', executeMulligan);
  }

  if (drawOneBtn) {
    drawOneBtn.addEventListener('click', drawOneCard);
  }

  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      playShuffle();
      startNewHand();
    });
  }
}

function startNewHand() {
  const fullDeck = buildFullDeckArray();
  const shuffled = shuffleArray(fullDeck);

  currentHand = shuffled.slice(0, 5).map(card => ({ card, selectedForMulligan: false }));
  remainingDeck = shuffled.slice(5);
  hasMulliganed = false;

  renderHand();
}

function executeMulligan() {
  const selectedIndexes = [];
  currentHand.forEach((item, idx) => {
    if (item.selectedForMulligan) selectedIndexes.push(idx);
  });

  if (selectedIndexes.length === 0) {
    showToast('Selecciona al menos 1 carta haciendo clic en ella para redibujarla.', 'info');
    return;
  }

  playShuffle();

  // Return selected cards to remaining deck and draw new ones
  const discarded = [];
  selectedIndexes.forEach(idx => {
    discarded.push(currentHand[idx].card);
  });

  remainingDeck.push(...discarded);
  remainingDeck = shuffleArray(remainingDeck);

  selectedIndexes.forEach(idx => {
    if (remainingDeck.length > 0) {
      currentHand[idx] = { card: remainingDeck.shift(), selectedForMulligan: false };
    }
  });

  hasMulliganed = true;
  showToast(`Mulligan completado: ${selectedIndexes.length} carta(s) reemplazada(s).`, 'success');
  renderHand();
}

function drawOneCard() {
  if (remainingDeck.length === 0) {
    showToast('¡No quedan más cartas en el mazo para robar!', 'warning');
    return;
  }

  playCardDrop();
  const newCard = remainingDeck.shift();
  currentHand.push({ card: newCard, selectedForMulligan: false });
  renderHand();
}

function renderHand() {
  const cardsContainer = document.getElementById('test-hand-cards');
  const statsContainer = document.getElementById('test-hand-stats');
  const avgManaSpan = document.getElementById('hand-avg-mana');

  if (!cardsContainer) return;
  cardsContainer.innerHTML = '';

  let manaSum = 0;
  currentHand.forEach((item, index) => {
    manaSum += item.card.cost;

    const cardElem = createCardElement(item.card, {
      isHandItem: true,
      draggable: false
    });

    if (item.selectedForMulligan) {
      cardElem.classList.add('is-selected-mulligan');
    }

    // Toggle selection on click
    cardElem.addEventListener('click', () => {
      playClick();
      item.selectedForMulligan = !item.selectedForMulligan;
      cardElem.classList.toggle('is-selected-mulligan', item.selectedForMulligan);
    });

    cardsContainer.appendChild(cardElem);
  });

  const avgCost = currentHand.length > 0 ? (manaSum / currentHand.length).toFixed(1) : '0.0';
  if (avgManaSpan) avgManaSpan.textContent = `Coste promedio en mano: ${avgCost}`;
  if (statsContainer) {
    statsContainer.innerHTML = `
      <span>Mano actual: <strong>${currentHand.length}</strong> cartas</span> &bull; 
      <span>Restantes en mazo: <strong>${remainingDeck.length}</strong></span> &bull; 
      <span>Coste medio: <strong>${avgCost}</strong></span>
    `;
  }
}
