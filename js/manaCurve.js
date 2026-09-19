/**
 * MANA CURVE HISTOGRAM & ANALYTICS
 * Accounts for Spell/Creature mana costs and Sello resource cards.
 */

import { state, setFilter } from './state.js';
import { getCardById } from './cardsData.js';
import { playClick } from './sound.js';

export function renderManaCurve() {
  const container = document.getElementById('mana-curve-bars');
  const avgDisplay = document.getElementById('avg-mana-display');
  if (!container) return;

  // Costs: Sello, 1, 2, 3, 4, 5, 6, 7+
  let selloCount = 0;
  const buckets = [0, 0, 0, 0, 0, 0, 0, 0]; // 0, 1, 2, 3, 4, 5, 6, 7+
  let nonSelloCardsSum = 0;
  let nonSelloManaSum = 0;

  state.deck.forEach(item => {
    const card = getCardById(item.cardId);
    if (!card) return;

    if (card.type === 'Sello' || card.isSello) {
      selloCount += item.count;
    } else {
      const cost = Math.max(0, card.cost);
      const bucketIndex = cost >= 7 ? 7 : cost;
      buckets[bucketIndex] += item.count;
      nonSelloCardsSum += item.count;
      nonSelloManaSum += (card.cost * item.count);
    }
  });

  // Calculate Average Mana Cost (excluding Sellos/Lands for accurate spell curve)
  const avgCost = nonSelloCardsSum > 0 ? (nonSelloManaSum / nonSelloCardsSum).toFixed(1) : '0.0';
  if (avgDisplay) {
    avgDisplay.innerHTML = `Coste Medio: <strong>${avgCost}</strong> &bull; <span style="color:#10b981;">Sellos: ${selloCount}</span>`;
  }

  // Find maximum count for scaling bar heights
  const maxCount = Math.max(...buckets, selloCount, 1);
  container.innerHTML = '';

  // 1. Sello Bar (First column)
  const selloCol = document.createElement('div');
  selloCol.className = 'mana-bar-col';
  selloCol.title = `Sellos (Recursos): ${selloCount} cartas. Clic para filtrar Sellos.`;
  const selloHeightPercent = selloCount > 0 ? Math.max(14, Math.round((selloCount / maxCount) * 100)) : 0;
  selloCol.innerHTML = `
    <div class="mana-bar-track">
      ${selloCount > 0 ? `<span class="mana-bar-count">${selloCount}</span>` : ''}
      <div class="mana-bar-fill" style="height: ${selloHeightPercent}%; background: linear-gradient(180deg, #34d399, #059669); box-shadow: 0 0 8px rgba(16,185,129,0.5);"></div>
    </div>
    <span class="mana-bar-label" style="color: #34d399; font-weight: 700;">💎S</span>
  `;
  selloCol.addEventListener('click', () => {
    playClick();
    setFilter('type', 'Sello');
  });
  container.appendChild(selloCol);

  // 2. Cost Bars 1 to 7+
  const labels = ['0', '1', '2', '3', '4', '5', '6', '7+'];
  for (let idx = 0; idx <= 7; idx++) {
    const count = buckets[idx];
    const heightPercent = count > 0 ? Math.max(14, Math.round((count / maxCount) * 100)) : 0;
    
    const col = document.createElement('div');
    col.className = 'mana-bar-col';
    col.title = `Coste ${labels[idx]}: ${count} carta(s). Clic para filtrar.`;

    col.innerHTML = `
      <div class="mana-bar-track">
        ${count > 0 ? `<span class="mana-bar-count">${count}</span>` : ''}
        <div class="mana-bar-fill" style="height: ${heightPercent}%;"></div>
      </div>
      <span class="mana-bar-label">${labels[idx]}</span>
    `;

    col.addEventListener('click', () => {
      playClick();
      const targetCost = idx >= 7 ? 10 : idx;
      const slider = document.getElementById('mana-cost-slider');
      const display = document.getElementById('mana-slider-val');
      if (slider) slider.value = targetCost;
      if (display) display.textContent = targetCost >= 10 ? 'Todos (10+)' : `≤ ${targetCost} Maná`;
      setFilter('maxMana', targetCost);
    });

    container.appendChild(col);
  }
}
