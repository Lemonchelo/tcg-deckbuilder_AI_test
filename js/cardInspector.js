/**
 * 3D HOLOGRAPHIC TILT & FULL-CARD RENDERING / INSPECTOR
 */

import { getCardById, ELEMENTS } from './cardsData.js';
import { addCardToDeck, canAddCardToDeck, getCardCountInDeck, getMaxAllowedCopies } from './state.js';
import { playClick, playCardDrop } from './sound.js';

/**
 * Generate standard HTML for a Full TCG Card
 */
export function createCardElement(card, options = {}) {
  const {
    isDeckItem = false,
    deckCount = 0,
    isMaxInDeck = false,
    isHandItem = false,
    draggable = true
  } = options;

  const wrapper = document.createElement('div');
  wrapper.className = `tcg-card-wrapper ${isHandItem ? 'hand-card-wrapper' : ''}`;
  wrapper.dataset.cardId = card.id;

  const maxCopies = getMaxAllowedCopies(card.id);
  const isSello = card.type === 'Sello' || card.isSello || !card.rarity;

  let inDeckBadgeHtml = '';
  if (!isDeckItem && !isHandItem) {
    const currentInDeck = getCardCountInDeck(card.id);
    if (currentInDeck > 0) {
      const badgeText = isSello ? `x${currentInDeck}` : `${currentInDeck}/${maxCopies}`;
      inDeckBadgeHtml = `
        <div class="library-card-in-deck-badge ${!isSello && currentInDeck >= maxCopies ? 'is-max' : ''}" title="${currentInDeck} ${isSello ? 'copias' : `de ${maxCopies} copias`} en el mazo">
          ${badgeText}
        </div>
      `;
    }
  }

  let deckQtyBadgeHtml = '';
  let deckOverlayHtml = '';
  if (isDeckItem) {
    deckQtyBadgeHtml = `
      <div class="deck-card-qty-badge ${!isSello && deckCount >= maxCopies ? 'is-max' : ''}">
        x${deckCount}
      </div>
    `;

    deckOverlayHtml = `
      <div class="deck-card-actions-overlay">
        <div class="deck-action-row">
          <button class="btn-card-ctrl btn-remove" data-action="decrement" title="Quitar 1 copia">-</button>
          <button class="btn-card-ctrl btn-add" data-action="increment" title="Agregar otra copia" ${!isSello && deckCount >= maxCopies ? 'disabled' : ''}>+</button>
        </div>
        <button class="btn-card-inspect" data-action="inspect" title="Ver detalles en 3D">🔍 Inspeccionar</button>
      </div>
    `;
  }

  // Full-bleed Card Graphic (100% of card)
  const cardGraphic = card.imageUrl 
    ? `<img src="${card.imageUrl}" alt="${card.name}" class="full-card-image" loading="lazy">` 
    : (card.artSvg || '');

  wrapper.innerHTML = `
    <div class="tcg-card ${isMaxInDeck ? 'is-max-in-deck' : ''}" 
         data-element="${card.element || 'neutral'}" 
         data-rarity="${card.rarity || 'none'}"
         draggable="${draggable}"
         tabindex="0"
         role="button"
         aria-label="${card.name}, ${card.element}, Coste ${card.cost}">
      
      <!-- Full Card Graphic -->
      ${cardGraphic}

      <!-- Holographic Foil Overlay -->
      <div class="card-foil-sheen"></div>

      <!-- Dynamic HUD Badges / Overlays -->
      ${inDeckBadgeHtml}
      ${deckQtyBadgeHtml}
      ${deckOverlayHtml}
      
      <!-- Mulligan Tag if in test hand -->
      ${isHandItem ? '<div class="mulligan-tag">DESCARTAR</div>' : ''}
    </div>
  `;

  // Attach 3D Tilt Event Handlers
  attach3DTiltEffect(wrapper);

  return wrapper;
}

/**
 * 3D Perspective Tilt on Mouse Movement
 */
export function attach3DTiltEffect(wrapper) {
  const card = wrapper.querySelector('.tcg-card');
  if (!card) return;

  let bounds;

  function onMouseEnter() {
    bounds = card.getBoundingClientRect();
  }

  function onMouseMove(e) {
    if (!bounds) bounds = card.getBoundingClientRect();
    const mouseX = e.clientX - bounds.left;
    const mouseY = e.clientY - bounds.top;

    const leftX = mouseX - bounds.width / 2;
    const topY = mouseY - bounds.height / 2;

    const rx = -(topY / (bounds.height / 2)) * 14;
    const ry = (leftX / (bounds.width / 2)) * 14;

    const foilX = (mouseX / bounds.width) * 100;
    const foilY = (mouseY / bounds.height) * 100;

    card.style.transform = `perspective(1000px) rotateX(${rx.toFixed(2)}deg) rotateY(${ry.toFixed(2)}deg) translateY(-4px)`;
    card.style.setProperty('--foil-x', `${foilX.toFixed(1)}%`);
    card.style.setProperty('--foil-y', `${foilY.toFixed(1)}%`);
  }

  function onMouseLeave() {
    card.style.transform = '';
    bounds = null;
  }

  wrapper.addEventListener('mouseenter', onMouseEnter);
  wrapper.addEventListener('mousemove', onMouseMove);
  wrapper.addEventListener('mouseleave', onMouseLeave);
}

/**
 * Open Card Inspector Modal (Full 3D HD View)
 */
export function openCardInspector(cardId) {
  const card = getCardById(cardId);
  if (!card) return;

  const modal = document.getElementById('modal-card-inspector');
  const content = document.getElementById('inspector-content');
  if (!modal || !content) return;

  playClick();

  const elementInfo = ELEMENTS[card.element] || ELEMENTS.neutral;
  const currentInDeck = getCardCountInDeck(card.id);
  const maxCopies = getMaxAllowedCopies(card.id);
  const isSello = card.type === 'Sello' || card.isSello || !card.rarity;

  const rarityBadgeHtml = isSello
    ? `<span class="inspector-badge" style="background: rgba(52,211,153,0.15); color: #34d399; border: 1px solid #10b981;">🏛️ Sello (Sin Límite)</span>`
    : `<span class="inspector-badge" style="background: rgba(255,255,255,0.06); color: #fbbf24; border: 1px solid #fbbf24;">💎 ${card.rarity}</span>`;

  const addBtnText = isSello
    ? `<span>+</span> Agregar al Mazo (x${currentInDeck})`
    : `<span>+</span> Agregar al Mazo (${currentInDeck}/${maxCopies})`;

  content.innerHTML = `
    <div class="inspector-card-col" id="inspector-card-container">
      <!-- Full Card injected below -->
    </div>
    <div class="inspector-details-col">
      <div class="inspector-name">${card.name}</div>
      <div class="inspector-meta-row">
        <span class="inspector-badge" style="background: ${elementInfo.glow}; color: #ffffff; border: 1px solid ${elementInfo.color};">
          ${elementInfo.icon} ${elementInfo.name}
        </span>
        <span class="inspector-badge" style="background: rgba(255,255,255,0.06); color: var(--text-secondary); border: 1px solid var(--border-medium);">
          ${card.type}
        </span>
        ${rarityBadgeHtml}
        <span class="inspector-badge" style="background: rgba(56,189,248,0.15); color: #38bdf8; border: 1px solid #38bdf8;">
          💧 Coste: ${card.cost}
        </span>
        ${card.attack !== null ? `
          <span class="inspector-badge" style="background: rgba(239,68,68,0.2); color: #f87171; border: 1px solid #ef4444;">
            ⚔️ ${card.attack}
          </span>
          <span class="inspector-badge" style="background: rgba(16,185,129,0.2); color: #34d399; border: 1px solid #10b981;">
            ❤️ ${card.health}
          </span>
        ` : ''}
      </div>

      <div class="inspector-desc-box">
        <p>${card.description}</p>
      </div>

      <div class="inspector-flavor">
        ${card.flavor}
      </div>

      <div class="inspector-actions">
        <button id="btn-inspector-add" class="btn btn-primary" ${!isSello && currentInDeck >= maxCopies ? 'disabled' : ''}>
          ${addBtnText}
        </button>
      </div>
    </div>
  `;

  // Inject Full 3D Card
  const cardElem = createCardElement(card, { draggable: false });
  content.querySelector('#inspector-card-container').appendChild(cardElem);

  // Bind Add Button
  const addBtn = content.querySelector('#btn-inspector-add');
  if (addBtn) {
    addBtn.addEventListener('click', () => {
      const result = addCardToDeck(card.id);
      if (result.success) {
        playCardDrop();
        openCardInspector(card.id);
      }
    });
  }

  modal.classList.add('is-open');
}

export function closeCardInspector() {
  const modal = document.getElementById('modal-card-inspector');
  if (modal) modal.classList.remove('is-open');
}

document.addEventListener('DOMContentLoaded', () => {
  const closeBtn = document.getElementById('btn-close-inspector');
  const modal = document.getElementById('modal-card-inspector');
  if (closeBtn) closeBtn.addEventListener('click', closeCardInspector);
  if (modal) {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) closeCardInspector();
    });
  }
});
