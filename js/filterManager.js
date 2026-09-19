/**
 * FILTER & LIBRARY MANAGER
 * Controls search, planetary buttons, type pills, zoom slider, mana slider, and library rendering.
 */

import { CARDS_DATA } from './cardsData.js';
import { state, setCardScale, setFilter, resetFilters, addCardToDeck, canAddCardToDeck, getCardCountInDeck, getMaxAllowedCopies } from './state.js';
import { createCardElement, openCardInspector } from './cardInspector.js';
import { playClick, playCardDrop } from './sound.js';
import { showToast } from './app.js';

export function initFilters() {
  // 1. Search Input
  const searchInput = document.getElementById('filter-search');
  const clearSearchBtn = document.getElementById('btn-clear-search');

  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      const val = e.target.value;
      setFilter('search', val);
      if (clearSearchBtn) {
        clearSearchBtn.style.display = val ? 'block' : 'none';
      }
    });
  }

  if (clearSearchBtn) {
    clearSearchBtn.addEventListener('click', () => {
      if (searchInput) searchInput.value = '';
      clearSearchBtn.style.display = 'none';
      setFilter('search', '');
    });
  }

  // 2. Card Size Zoom Slider
  const scaleSlider = document.getElementById('card-scale-slider');
  const scaleValueText = document.getElementById('card-scale-value');

  if (scaleSlider) {
    scaleSlider.value = state.filters.cardScale || 1.0;
    if (scaleValueText) {
      scaleValueText.textContent = `${Math.round(scaleSlider.value * 100)}%`;
    }

    scaleSlider.addEventListener('input', (e) => {
      const scale = parseFloat(e.target.value);
      setCardScale(scale);
      if (scaleValueText) {
        scaleValueText.textContent = `${Math.round(scale * 100)}%`;
      }
      applyCardScale(scale);
    });
  }

  // 3. Planetary Filter Buttons
  const elementButtons = document.querySelectorAll('#element-filters .element-btn');
  elementButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      elementButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      playClick();
      setFilter('element', btn.dataset.element);
    });
  });

  // 4. Type Filter Buttons
  const typeButtons = document.querySelectorAll('#type-filters .pill-filter-btn');
  typeButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      typeButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      playClick();
      setFilter('type', btn.dataset.type);
    });
  });

  // 5. Rarity Filter Select
  const raritySelect = document.getElementById('rarity-filter');
  if (raritySelect) {
    raritySelect.addEventListener('change', (e) => {
      playClick();
      setFilter('rarity', e.target.value);
    });
  }

  // 6. Mana Cost Slider
  const manaSlider = document.getElementById('mana-cost-slider');
  const manaSliderVal = document.getElementById('mana-slider-val');
  if (manaSlider) {
    manaSlider.addEventListener('input', (e) => {
      const val = parseInt(e.target.value, 10);
      if (manaSliderVal) {
        manaSliderVal.textContent = val >= 10 ? 'Todos (10+)' : `≤ ${val} Maná`;
      }
      setFilter('maxMana', val);
    });
  }

  // 7. Sort Select
  const sortSelect = document.getElementById('sort-select');
  if (sortSelect) {
    sortSelect.addEventListener('change', (e) => {
      playClick();
      setFilter('sort', e.target.value);
    });
  }

  // 8. Reset Filters Buttons
  const resetBtn = document.getElementById('btn-reset-filters');
  const clearFiltersEmptyBtn = document.getElementById('btn-clear-filters-empty');

  const handleReset = () => {
    playClick();
    resetFilters();
    if (searchInput) searchInput.value = '';
    if (clearSearchBtn) clearSearchBtn.style.display = 'none';
    if (raritySelect) raritySelect.value = 'all';
    if (manaSlider) {
      manaSlider.value = 10;
      if (manaSliderVal) manaSliderVal.textContent = 'Todos (10+)';
    }
    if (sortSelect) sortSelect.value = 'cost-asc';

    elementButtons.forEach(b => b.classList.toggle('active', b.dataset.element === 'all'));
    typeButtons.forEach(b => b.classList.toggle('active', b.dataset.type === 'all'));
  };

  if (resetBtn) resetBtn.addEventListener('click', handleReset);
  if (clearFiltersEmptyBtn) clearFiltersEmptyBtn.addEventListener('click', handleReset);

  // 9. Library Grid Item Click
  const libraryGrid = document.getElementById('library-grid');
  if (libraryGrid) {
    libraryGrid.addEventListener('click', (e) => {
      const cardWrapper = e.target.closest('.tcg-card-wrapper');
      if (!cardWrapper) return;

      const cardId = cardWrapper.dataset.cardId;
      if (!cardId) return;

      const check = canAddCardToDeck(cardId);
      if (check.allowed) {
        addCardToDeck(cardId);
        playCardDrop();
        const card = CARDS_DATA.find(c => c.id === cardId);
        showToast(`Agregado: ${card ? card.name : 'Carta'} al mazo`, 'success');
      } else {
        showToast(check.reason, 'warning');
      }
    });

    libraryGrid.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      const cardWrapper = e.target.closest('.tcg-card-wrapper');
      if (cardWrapper && cardWrapper.dataset.cardId) {
        openCardInspector(cardWrapper.dataset.cardId);
      }
    });
  }

  applyCardScale(state.filters.cardScale || 1.0);
}

function applyCardScale(scale) {
  const libraryGrid = document.getElementById('library-grid');
  if (libraryGrid) {
    libraryGrid.style.setProperty('--grid-scale', scale);
  }
}

const RARITY_WEIGHT = {
  Legendary: 4,
  Epic: 3,
  Rare: 2,
  Common: 1
};

export function renderLibrary() {
  const libraryGrid = document.getElementById('library-grid');
  const emptyState = document.getElementById('library-empty');
  const filteredCountElem = document.getElementById('filtered-card-count');
  const totalCountElem = document.getElementById('total-card-count');

  if (!libraryGrid) return;

  const { search, element, type, rarity, maxMana, sort } = state.filters;

  // Filter Cards (Exclude Token cards from main library grid unless explicitly filtered by type)
  let filtered = CARDS_DATA.filter(card => {
    // Tokens belong to the extra deck and are generated automatically
    if ((card.type === 'Token' || card.isToken) && type !== 'Token') {
      return false;
    }

    // Search Query
    if (search.trim()) {
      const query = search.toLowerCase();
      const matchName = card.name.toLowerCase().includes(query);
      const matchDesc = card.description && card.description.toLowerCase().includes(query);
      const matchFlavor = card.flavor && card.flavor.toLowerCase().includes(query);
      if (!matchName && !matchDesc && !matchFlavor) return false;
    }

    // Element Filter
    if (element !== 'all' && card.element !== element) {
      return false;
    }

    // Type Filter
    if (type !== 'all' && card.type !== type) {
      return false;
    }

    // Rarity Filter (Sellos are shown on 'all')
    if (rarity !== 'all') {
      if (card.type === 'Sello' || card.isSello || !card.rarity) {
        return false;
      }
      if (card.rarity !== rarity) {
        return false;
      }
    }

    // Mana Cost Filter (Sellos are cost 0)
    if (maxMana < 10 && card.cost > maxMana) {
      return false;
    }

    return true;
  });

  // Sort Cards
  filtered.sort((a, b) => {
    switch (sort) {
      case 'cost-asc':
        return a.cost - b.cost || a.name.localeCompare(b.name);
      case 'cost-desc':
        return b.cost - a.cost || a.name.localeCompare(b.name);
      case 'name-asc':
        return a.name.localeCompare(b.name);
      case 'name-desc':
        return b.name.localeCompare(a.name);
      case 'rarity-desc':
        return (RARITY_WEIGHT[b.rarity] || 0) - (RARITY_WEIGHT[a.rarity] || 0) || a.cost - b.cost;
      case 'attack-desc':
        return (b.attack || 0) - (a.attack || 0) || a.cost - b.cost;
      case 'health-desc':
        return (b.health || 0) - (a.health || 0) || a.cost - b.cost;
      default:
        return 0;
    }
  });

  const nonTokenTotal = CARDS_DATA.filter(c => c.type !== 'Token' && !c.isToken).length;
  if (totalCountElem) totalCountElem.textContent = nonTokenTotal;
  if (filteredCountElem) filteredCountElem.textContent = filtered.length;

  // Render to DOM
  if (CARDS_DATA.length === 0) {
    if (emptyState) emptyState.style.display = 'none';
    libraryGrid.innerHTML = `
      <div class="library-empty-collection">
        <div class="empty-icon-shield">📂</div>
        <h3>Tu colección está vacía</h3>
        <p>Aún no has agregado cartas a tu biblioteca.</p>
        <p class="empty-subtext">Puedes importar imágenes o carpetas de cartas con los formatos:<br>
          <code>Nombre_Tipo_Rareza_Faccion_ATK_DEF_Coste.png</code><br>
          <code>Sello_Faccion.png</code> (Sin límite / recurso)<br>
          <code>Token_Nombre_Faccion.png</code> (Mazo Extra automático)
        </p>
        <button id="btn-import-from-empty" class="btn btn-primary" style="margin-top: 16px;">
          <span>📁</span> Abrir Importador de Cartas
        </button>
      </div>
    `;

    const importFromEmptyBtn = document.getElementById('btn-import-from-empty');
    if (importFromEmptyBtn) {
      importFromEmptyBtn.addEventListener('click', () => {
        const modal = document.getElementById('modal-import-images');
        if (modal) modal.classList.add('is-open');
      });
    }
  } else if (filtered.length === 0) {
    libraryGrid.innerHTML = '';
    if (emptyState) emptyState.style.display = 'flex';
  } else {
    if (emptyState) emptyState.style.display = 'none';
    const previous = new Map([...libraryGrid.querySelectorAll('.tcg-card-wrapper')].map(node => [node.dataset.cardId, node]));
    const fragment = document.createDocumentFragment();

    filtered.forEach(card => {
      const currentInDeck = getCardCountInDeck(card.id);
      const maxAllowed = getMaxAllowedCopies(card.id);
      const isSello = card.type === 'Sello' || card.isSello || !card.rarity;
      const isMaxInDeck = !isSello && currentInDeck >= maxAllowed;

      const cardElem = previous.get(card.id) || createCardElement(card, {
        isDeckItem: false,
        isMaxInDeck,
        draggable: card.type !== 'Token' && !card.isToken
      });
      const face = cardElem.querySelector('.tcg-card');
      face.classList.toggle('is-max-in-deck', isMaxInDeck);
      let badge = face.querySelector('.library-card-in-deck-badge');
      if (currentInDeck > 0) {
        if (!badge) { badge = document.createElement('div'); face.appendChild(badge); }
        badge.className = 'library-card-in-deck-badge' + (isMaxInDeck ? ' is-max' : '');
        badge.textContent = isSello ? `x${currentInDeck}` : `${currentInDeck}/${maxAllowed}`;
        badge.title = `${currentInDeck} copias en el mazo`;
      } else if (badge) badge.remove();
      fragment.appendChild(cardElem);
    });
    libraryGrid.replaceChildren(fragment);
  }
}
