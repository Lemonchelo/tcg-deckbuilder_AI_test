/**
 * REACTIVE STATE MANAGER & PERSISTENCE
 * Dynamic Rarity Limits: Common (4), Rare (3), Epic (2), Legendary (1).
 * Sellos: No rarity and unlimited copies (up to deck size of 40).
 * Automated Extra Deck (Tokens linked to active factions).
 */

import { CARDS_DATA, getCardById } from './cardsData.js';

const STORAGE_KEY = 'aetherium_tcg_active_deck';

export const RARITY_LIMITS = {
  Common: 4,
  Rare: 3,
  Epic: 2,
  Legendary: 1
};

export const state = {
  deckName: 'Mi Mazo de Batalla',
  deck: [], // Array of { cardId: string, count: number }
  maxDeckSize: 40,
  filters: {
    search: '',
    element: 'all',
    type: 'all',
    rarity: 'all',
    maxMana: 10,
    sort: 'cost-asc',
    cardScale: 1.0
  }
};

const listeners = {
  deck: [],
  filters: []
};

export function subscribeToDeck(callback) {
  listeners.deck.push(callback);
}

export function subscribeToFilters(callback) {
  listeners.filters.push(callback);
}

function notifyDeckChanged() {
  saveToLocalStorage();
  listeners.deck.forEach(cb => cb(state.deck, state));
}

function notifyFiltersChanged() {
  listeners.filters.forEach(cb => cb(state.filters, state));
}

function saveToLocalStorage() {
  try {
    const dataToSave = {
      deckName: state.deckName,
      deck: state.deck,
      cardScale: state.filters.cardScale
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(dataToSave));
  } catch (err) {}
}

export function loadInitialState() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed.deckName) state.deckName = parsed.deckName;
      if (Array.isArray(parsed.deck)) {
        state.deck = parsed.deck.filter(item => {
          const card = item && getCardById(item.cardId);
          // Tokens cannot be in the main deck, and cards must exist in CARDS_DATA
          return item && Number.isSafeInteger(item.count) && item.count > 0 && card && card.type !== 'Token' && !card.isToken;
        });
      }
      if (parsed.cardScale) {
        state.filters.cardScale = Math.max(0.75, Math.min(1.35, parsed.cardScale));
      }
    } else {
      preloadStarterDeck();
    }
  } catch (err) {
    preloadStarterDeck();
  }
}

function preloadStarterDeck() {
  state.deck = [];
}

// Deck Query Helpers
export function getDeckTotalCount() {
  return state.deck.reduce((sum, item) => sum + item.count, 0);
}

export function getCardCountInDeck(cardId) {
  const found = state.deck.find(item => item.cardId === cardId);
  return found ? found.count : 0;
}

/**
 * Dynamic Limit by Rarity:
 * Common -> 4
 * Rare -> 3
 * Epic -> 2
 * Legendary -> 1
 * Sello -> No limit (up to 40)
 */
export function getMaxAllowedCopies(cardId) {
  const card = getCardById(cardId);
  if (!card) return 4;
  if (card.type === 'Token' || card.isToken) return 0;
  if (card.type === 'Sello' || card.isSello || !card.rarity || card.rarity === 'None' || card.rarity === 'Sello') {
    return state.maxDeckSize;
  }
  return RARITY_LIMITS[card.rarity] || 4;
}

export function canAddCardToDeck(cardId) {
  const card = getCardById(cardId);
  if (!card) return { allowed: false, reason: 'Carta no encontrada' };

  // Tokens cannot be manually added to the main deck
  if (card.type === 'Token' || card.isToken) {
    return { 
      allowed: false, 
      reason: 'Las cartas Token pertenecen al Mazo Extra y se agregan automáticamente según las facciones del mazo.' 
    };
  }

  const totalCount = getDeckTotalCount();
  if (totalCount >= state.maxDeckSize) {
    return { allowed: false, reason: 'El mazo principal ya tiene 40 cartas (tamaño máximo).' };
  }

  const currentCount = getCardCountInDeck(cardId);
  const maxAllowed = getMaxAllowedCopies(cardId);

  if (currentCount >= maxAllowed) {
    if (card.type === 'Sello' || card.isSello || !card.rarity) {
      return { 
        allowed: false, 
        reason: 'El mazo ya alcanzó el límite de 40 cartas.' 
      };
    }
    const rarityLabel = card.rarity === 'Legendary' ? 'Legendarias (máx. 1)' :
      card.rarity === 'Epic' ? 'Épicas (máx. 2)' :
      card.rarity === 'Rare' ? 'Raras (máx. 3)' : 'Comunes (máx. 4)';

    return { 
      allowed: false, 
      reason: `Límite alcanzado para cartas ${rarityLabel}` 
    };
  }

  return { allowed: true };
}

// Deck Action Mutators
export function addCardToDeck(cardId) {
  const check = canAddCardToDeck(cardId);
  if (!check.allowed) {
    return { success: false, reason: check.reason };
  }

  const existingIndex = state.deck.findIndex(item => item.cardId === cardId);
  if (existingIndex !== -1) {
    state.deck[existingIndex].count += 1;
  } else {
    state.deck.push({ cardId, count: 1 });
  }

  notifyDeckChanged();
  return { success: true };
}

export function removeCardFromDeck(cardId, removeAll = false) {
  const existingIndex = state.deck.findIndex(item => item.cardId === cardId);
  if (existingIndex === -1) return;

  if (removeAll || state.deck[existingIndex].count <= 1) {
    state.deck.splice(existingIndex, 1);
  } else {
    state.deck[existingIndex].count -= 1;
  }

  notifyDeckChanged();
}

export function reorderDeck(fromIndex, toIndex) {
  if (fromIndex < 0 || fromIndex >= state.deck.length || toIndex < 0 || toIndex >= state.deck.length) return;
  const [movedItem] = state.deck.splice(fromIndex, 1);
  state.deck.splice(toIndex, 0, movedItem);
  notifyDeckChanged();
}

export function clearDeck() {
  state.deck = [];
  notifyDeckChanged();
}

export function setDeckName(name) {
  state.deckName = name.trim() || 'Mi Mazo de Batalla';
  saveToLocalStorage();
}

// ==================== EXTRA DECK & AUTOMATED TOKENS ====================

/**
 * Returns a Set of planet/faction keys currently present in the main deck
 */
export function getActiveFactionsInDeck() {
  const factions = new Set();
  state.deck.forEach(item => {
    const card = getCardById(item.cardId);
    if (card && card.element && card.element !== 'neutral') {
      factions.add(card.element.toLowerCase());
    }
  });
  return factions;
}

/**
 * Automatically computes the Extra Deck (Tokens) based on active factions in main deck
 */
export function getActiveExtraDeckTokens() {
  const activeFactions = getActiveFactionsInDeck();
  if (activeFactions.size === 0) return [];

  return CARDS_DATA.filter(card => {
    return (card.type === 'Token' || card.isToken) && activeFactions.has(card.element.toLowerCase());
  });
}

// Filter Action Mutators
export function setFilter(key, value) {
  state.filters[key] = value;
  notifyFiltersChanged();
}

export function resetFilters() {
  state.filters.search = '';
  state.filters.element = 'all';
  state.filters.type = 'all';
  state.filters.rarity = 'all';
  state.filters.maxMana = 10;
  state.filters.sort = 'cost-asc';
  notifyFiltersChanged();
}

// ==================== EXPORT & IMPORT UTILITIES ====================

export function exportDeckToText() {
  const total = getDeckTotalCount();
  const extraTokens = getActiveExtraDeckTokens();
  let text = `// Deck: ${state.deckName}\n`;
  text += `// Main Deck (${total}/40 cartas):\n`;

  state.deck.forEach(item => {
    const card = getCardById(item.cardId);
    if (card) {
      const typeStr = card.type === 'Sello' ? '[Sello]' : `[${card.rarity || 'Sin Rareza'}]`;
      text += `${item.count}x ${card.name} ${typeStr} (${card.element.toUpperCase()})\n`;
    }
  });

  if (extraTokens.length > 0) {
    text += `\n// Extra Deck (Tokens Automáticos):\n`;
    extraTokens.forEach(token => {
      text += `1x ${token.name} [Token] (${token.element.toUpperCase()})\n`;
    });
  }

  return text;
}

export function exportDeckToJSON() {
  const exportObject = {
    format: 'aetherium-tcg-v1',
    deckName: state.deckName,
    createdAt: new Date().toISOString(),
    deck: state.deck.map(item => {
      const card = getCardById(item.cardId);
      return {
        cardId: item.cardId,
        name: card ? card.name : 'Unknown Card',
        count: item.count
      };
    })
  };
  return JSON.stringify(exportObject, null, 2);
}

export function importDeckFromJSON(jsonString) {
  try {
    const data = JSON.parse(jsonString);
    if (!data || !Array.isArray(data.deck)) throw new Error('Formato JSON inválido: falta el array deck.');
    const counts = new Map();
    for (const item of data.deck) {
      if (!item || !Number.isSafeInteger(item.count) || item.count <= 0) throw new Error('Cada cantidad debe ser un entero positivo.');
      const card = getCardById(item.cardId) || (typeof item.name === 'string' && CARDS_DATA.find(c => c.name.toLowerCase() === item.name.toLowerCase()));
      if (!card) throw new Error('Carta no encontrada: ' + (item.name || item.cardId || '(sin nombre)'));
      if (card.isToken || card.type === 'Token') throw new Error('Los tokens no pertenecen al mazo principal.');
      const count = (counts.get(card.id) || 0) + item.count;
      if (count > getMaxAllowedCopies(card.id)) throw new Error('Límite de copias excedido: ' + card.name);
      counts.set(card.id, count);
    }
    const total = [...counts.values()].reduce((a,b) => a+b, 0);
    if (total > state.maxDeckSize) throw new Error('El mazo no puede superar las 40 cartas.');
    if (data.deckName !== undefined && typeof data.deckName !== 'string') throw new Error('Nombre de mazo inválido.');
    state.deck = [...counts].map(([cardId,count]) => ({cardId,count}));
    if (data.deckName !== undefined) state.deckName = data.deckName.trim().slice(0,32) || 'Mi Mazo de Batalla';
    notifyDeckChanged();
    return {success:true, count:total};
  } catch (err) {
    return {success:false, error:err.message, reason:err.message};
  }
}

export function importDeckFromText(textString) {
  try {
    const data = {deck: []};
    let extra = false;
    for (const line of textString.split('\n')) {
      const value = line.trim();
      if (!value) continue;
      if (value.startsWith('// Extra Deck')) { extra = true; continue; }
      if (value.startsWith('// Deck:')) data.deckName = value.slice(8).trim();
      if (value.startsWith('//') || value.startsWith('#') || extra) continue;
      const match = value.match(/^(\d+)[xX]?\s+(.+)$/);
      if (!match) throw new Error('Línea inválida: ' + value);
      const name = match[2].replace(/\s+\[[^\]]*\]\s+\([^)]*\)$/, '').trim();
      data.deck.push({name, cardId:name, count:Number(match[1])});
    }
    if (!data.deck.length) throw new Error('No se encontraron cartas en el texto.');
    return importDeckFromJSON(JSON.stringify(data));
  } catch (err) {
    return {success:false, error:err.message, reason:err.message};
  }
}

export function setCardScale(scale) {
  state.filters.cardScale = Math.max(0.75, Math.min(1.35, scale));
  saveToLocalStorage();
}
