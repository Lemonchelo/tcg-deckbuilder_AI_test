/**
 * 3D HOLOGRAPHIC TILT & FULL-CARD RENDERING / INSPECTOR
 */

import { getCardById, ELEMENTS, escapeHtml } from './cardsData.js';
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
    ? `<img src="${escapeHtml(card.imageUrl)}" alt="${escapeHtml(card.name)}" class="full-card-image" loading="lazy">`
    : (card.artSvg || '');

  wrapper.innerHTML = `
    <div class="tcg-card ${isMaxInDeck ? 'is-max-in-deck' : ''}" 
         data-element="${card.element || 'neutral'}" 
         data-rarity="${card.rarity || 'none'}"
         draggable="${draggable}"
         tabindex="0"
         role="button"
         aria-label="${escapeHtml(card.name)}, ${escapeHtml(card.element)}, Coste ${card.cost}">
      
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
  let frame = 0, latest;
  const reset = () => {
    cancelAnimationFrame(frame); frame = 0;
    card.style.transform = '';
  };
  wrapper.addEventListener('mousemove', e => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    latest = e;
    if (frame) return;
    frame = requestAnimationFrame(() => {
      frame = 0;
      const bounds = wrapper.getBoundingClientRect();
      const x = (latest.clientX - bounds.left) / bounds.width;
      const y = (latest.clientY - bounds.top) / bounds.height;
      card.style.transform = `perspective(1000px) rotateX(${(0.5-y)*16}deg) rotateY(${(x-0.5)*16}deg) translateY(-3px)`;
      card.style.setProperty('--foil-x', `${x*100}%`);
      card.style.setProperty('--foil-y', `${y*100}%`);
    });
  });
  wrapper.addEventListener('mouseleave', reset);
  wrapper.addEventListener('dragstart', reset);
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
    : `<span class="inspector-badge" style="background: rgba(255,255,255,0.06); color: #fbbf24; border: 1px solid #fbbf24;">💎 ${escapeHtml(card.rarity)}</span>`;

  const addBtnText = isSello
    ? `<span>+</span> Agregar al Mazo (x${currentInDeck})`
    : `<span>+</span> Agregar al Mazo (${currentInDeck}/${maxCopies})`;

  content.innerHTML = `
    <div class="inspector-card-col" id="inspector-card-container">
      <!-- Full Card injected below -->
    </div>
    <div class="inspector-details-col">
      <div class="inspector-name">${escapeHtml(card.name)}</div>
      <div class="inspector-meta-row">
        <span class="inspector-badge" style="background: ${elementInfo.glow}; color: #ffffff; border: 1px solid ${elementInfo.color};">
          ${elementInfo.icon} ${elementInfo.name}
        </span>
        <span class="inspector-badge" style="background: rgba(255,255,255,0.06); color: var(--text-secondary); border: 1px solid var(--border-medium);">
          ${escapeHtml(card.type)}
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
        <p>${escapeHtml(card.description)}</p>
      </div>

      <div class="inspector-flavor">
        ${escapeHtml(card.flavor)}
      </div>

      <div class="inspector-actions">
        <button id="btn-inspector-add" class="btn btn-primary" ${!canAddCardToDeck(card.id).allowed ? 'disabled' : ''}>
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

  if (!modal.classList.contains('is-open')) modal.returnFocus = document.activeElement;
  modal.classList.add('is-open');
  document.getElementById('btn-close-inspector')?.focus();
}

export function closeCardInspector() {
  const modal = document.getElementById('modal-card-inspector');
  if (modal) { modal.classList.remove('is-open'); modal.returnFocus?.focus(); }
}

export function initCardInspector() {
  const modal = document.getElementById('modal-card-inspector');
  const close = document.getElementById('btn-close-inspector');
  close?.addEventListener('click', closeCardInspector);
  modal?.addEventListener('click', event => {
    if (event.target === modal) closeCardInspector();
  });
  document.addEventListener('keydown', event => {
    if (event.key === 'Tab' && modal?.classList.contains('is-open')) {
      const controls = [...modal.querySelectorAll('button:not(:disabled), [tabindex="0"]')];
      const index = controls.indexOf(document.activeElement);
      if (event.shiftKey && index <= 0) { event.preventDefault(); controls.at(-1)?.focus(); }
      else if (!event.shiftKey && (index < 0 || index === controls.length-1)) { event.preventDefault(); controls[0]?.focus(); }
    }
    if (event.key === 'Escape' && modal?.classList.contains('is-open')) {
      event.preventDefault(); closeCardInspector();
    }
  });
}
