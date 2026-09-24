/**
 * 3D HOLOGRAPHIC TILT & FULL-CARD RENDERING / INSPECTOR
 */

import { getCardById, ELEMENTS, escapeHtml } from './cardsData.js';
import { addCardToDeck, canAddCardToDeck, getCardCountInDeck, getCombinedCardCount, getMaxAllowedCopies, getBanlistLimit, isCardBanlisted } from './state.js';
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
    draggable = true,
    deckTarget = 'main' // 'main' | 'side' — which deck this item belongs to, used by the move button
  } = options;

  const wrapper = document.createElement('div');
  wrapper.className = `tcg-card-wrapper ${isHandItem ? 'hand-card-wrapper' : ''}`;
  wrapper.dataset.cardId = card.id;

  const maxCopies = getMaxAllowedCopies(card.id);
  const isSello = card.type === 'Sello' || card.isSello || !card.rarity;
  const banlisted = isCardBanlisted(card.id);
  const combined = getCombinedCardCount(card.id);

  let inDeckBadgeHtml = '';
  if (!isDeckItem && !isHandItem) {
    if (combined > 0) {
      const badgeText = isSello && !banlisted ? `x${combined}` : `${combined}/${maxCopies}`;
      inDeckBadgeHtml = `
        <div class="library-card-in-deck-badge ${!isSello && combined >= maxCopies ? 'is-max' : ''}" title="${combined} ${isSello && !banlisted ? 'copias' : `de ${maxCopies} copias`} entre Mazo Principal y Side Deck">
          ${badgeText}
        </div>
      `;
    }
  }

  let banlistBadgeHtml = '';
  if (banlisted && !isHandItem) {
    banlistBadgeHtml = `<div class="card-banlist-badge" title="Restricción de Banlist: máximo ${maxCopies} copias entre Mazo Principal y Side Deck">🚫 ${maxCopies}</div>`;
  }

  let deckQtyBadgeHtml = '';
  let deckOverlayHtml = '';
  if (isDeckItem) {
    const atSharedMax = !isSello && combined >= maxCopies;
    deckQtyBadgeHtml = `
      <div class="deck-card-qty-badge ${atSharedMax ? 'is-max' : ''}">
        x${deckCount}
      </div>
    `;

    const moveLabel = deckTarget === 'side' ? '⇤ 1 copia al Mazo' : '1 copia al Side ⇥';
    const moveTitle = deckTarget === 'side' ? 'Mover 1 copia al Mazo Principal' : 'Mover 1 copia al Side Deck';
    deckOverlayHtml = `
      <div class="deck-card-actions-overlay">
        <div class="deck-action-row">
          <button class="btn-card-ctrl btn-remove" data-action="decrement" title="Quitar 1 copia">-</button>
          <button class="btn-card-ctrl btn-add" data-action="increment" title="Agregar otra copia" ${atSharedMax ? 'disabled' : ''}>+</button>
        </div>
        <button class="btn-card-inspect" data-action="inspect" title="Ver detalles en grande">🔍 Inspeccionar</button>
        <button class="btn-card-inspect btn-card-move" data-action="move" title="${moveTitle}">${moveLabel}</button>
      </div>
    `;
  }

  // Full-bleed Card Graphic (100% of card)
  const cardGraphic = card.imageUrl 
    ? `<img src="${escapeHtml(card.imageUrl)}" alt="${escapeHtml(card.name)}" class="full-card-image" loading="lazy">`
    : (card.artSvg || '');

  wrapper.innerHTML = `
    <div class="tcg-card ${isMaxInDeck ? 'is-max-in-deck' : ''} ${banlisted ? 'is-banlisted' : ''}"
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
      ${banlistBadgeHtml}
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
 * Open Card Inspector Modal (Full 3D HD View, enlarged)
 */
export function openCardInspector(cardId) {
  const card = getCardById(cardId);
  if (!card) return;

  const modal = document.getElementById('modal-card-inspector');
  const content = document.getElementById('inspector-content');
  if (!modal || !content) return;

  playClick();

  const elementInfo = ELEMENTS[card.element] || ELEMENTS.neutral;
  const currentInMain = getCardCountInDeck(card.id, 'main');
  const currentCombined = getCombinedCardCount(card.id);
  const maxCopies = getMaxAllowedCopies(card.id);
  const isSello = card.type === 'Sello' || card.isSello || !card.rarity;
  const banlistLimit = getBanlistLimit(card.id);
  const banlisted = banlistLimit !== undefined;

  const rarityBadgeHtml = banlisted
    ? `<span class="inspector-badge" style="background: rgba(248,113,113,0.15); color: #f87171; border: 1px solid #ef4444;">🚫 Banlist: máx. ${banlistLimit}</span>`
    : (isSello
      ? `<span class="inspector-badge" style="background: rgba(52,211,153,0.15); color: #34d399; border: 1px solid #10b981;">🏛️ Sello (Sin Límite)</span>`
      : `<span class="inspector-badge" style="background: rgba(255,255,255,0.06); color: #fbbf24; border: 1px solid #fbbf24;">💎 ${escapeHtml(card.rarity)}</span>`);

  const addBtnText = isSello && !banlisted
    ? `<span>+</span> Agregar al Mazo (x${currentInMain})`
    : `<span>+</span> Agregar al Mazo (${currentCombined}/${maxCopies})`;

  content.innerHTML = `
    <div class="inspector-card-col" id="inspector-card-container">
      <!-- Full Card injected below -->
      <span class="inspector-zoom-hint">🔍 Clic en la carta para verla en pantalla completa</span>
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
        <button id="btn-inspector-add" class="btn btn-primary" ${!canAddCardToDeck(card.id, 'main').allowed ? 'disabled' : ''}>
          ${addBtnText}
        </button>
      </div>
    </div>
  `;

  // Inject Full 3D Card (enlarged)
  const cardElem = createCardElement(card, { draggable: false });
  const cardContainer = content.querySelector('#inspector-card-container');
  cardContainer.insertBefore(cardElem, cardContainer.firstChild);

  // Clicking the card opens an even bigger, fullscreen zoom view
  const inspectFace = cardElem.querySelector('.tcg-card');
  if (inspectFace) {
    inspectFace.classList.add('is-zoomable');
    inspectFace.addEventListener('click', (e) => {
      e.stopPropagation();
      openCardFullscreen(card);
    });
  }

  // Bind Add Button
  const addBtn = content.querySelector('#btn-inspector-add');
  if (addBtn) {
    addBtn.addEventListener('click', () => {
      const result = addCardToDeck(card.id, 'main');
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

/**
 * Fullscreen zoom view of a single card (occupies the whole viewport),
 * reached by clicking the card inside the inspector.
 */
export function openCardFullscreen(card) {
  const modal = document.getElementById('modal-card-fullscreen');
  const container = document.getElementById('fullscreen-card-container');
  if (!modal || !container) return;

  container.innerHTML = '';
  const cardElem = createCardElement(card, { draggable: false });
  const face = cardElem.querySelector('.tcg-card');
  if (face) {
    face.classList.add('is-fullscreen-face');
    cardElem.addEventListener('click', () => closeCardFullscreen());
  }
  container.appendChild(cardElem);

  if (!modal.classList.contains('is-open')) modal.returnFocus = document.activeElement;
  modal.classList.add('is-open');
  document.getElementById('btn-close-fullscreen-card')?.focus();
}

export function closeCardFullscreen() {
  const modal = document.getElementById('modal-card-fullscreen');
  if (modal) { modal.classList.remove('is-open'); modal.returnFocus?.focus(); }
}

export function initCardInspector() {
  const modal = document.getElementById('modal-card-inspector');
  const close = document.getElementById('btn-close-inspector');
  close?.addEventListener('click', closeCardInspector);
  modal?.addEventListener('click', event => {
    if (event.target === modal) closeCardInspector();
  });

  const fsModal = document.getElementById('modal-card-fullscreen');
  const fsClose = document.getElementById('btn-close-fullscreen-card');
  fsClose?.addEventListener('click', closeCardFullscreen);
  fsModal?.addEventListener('click', event => {
    if (event.target === fsModal) closeCardFullscreen();
  });

  document.addEventListener('keydown', event => {
    if (event.key === 'Tab' && modal?.classList.contains('is-open')) {
      const controls = [...modal.querySelectorAll('button:not(:disabled), [tabindex="0"]')];
      const index = controls.indexOf(document.activeElement);
      if (event.shiftKey && index <= 0) { event.preventDefault(); controls.at(-1)?.focus(); }
      else if (!event.shiftKey && (index < 0 || index === controls.length-1)) { event.preventDefault(); controls[0]?.focus(); }
    }
    if (event.key === 'Escape') {
      if (fsModal?.classList.contains('is-open')) { event.preventDefault(); closeCardFullscreen(); return; }
      if (modal?.classList.contains('is-open')) { event.preventDefault(); closeCardInspector(); }
    }
  });
}
