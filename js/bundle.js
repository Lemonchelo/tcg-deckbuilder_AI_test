/**
 * AETHERIUM TCG DECKBUILDER STUDIO - STANDALONE BUNDLE
 * Zero-dependency standalone application bundle.
 * Fully supports direct local execution via file:/// double-click on Windows.
 * 
 * Rules:
 * - 40 Cards Main Deck
 * - Dynamic Rarity Limits: Common (4), Rare (3), Epic (2), Legendary (1)
 * - Sellos: No rarity, no limit (up to 40)
 * - Automated Token Extra Deck
 * - Card Types: Criatura, HechizoRapido, HechizoLento, Estructura, Artefacto, Sello, Terreno, Token
 * - Solar System Factions (no Venus, no Sun)
 */

(function() {
  'use strict';

  // ==========================================================================
  // 1. CARDS DATA & CONSTANTS
  // ==========================================================================
  const ELEMENTS = {
    marte: { name: 'Marte', icon: '🔴', color: '#ef4444', glow: 'rgba(239, 68, 68, 0.45)' },
    neptuno: { name: 'Neptuno', icon: '🔵', color: '#38bdf8', glow: 'rgba(56, 189, 248, 0.45)' },
    jupiter: { name: 'Júpiter', icon: '🟠', color: '#f59e0b', glow: 'rgba(245, 158, 11, 0.45)' },
    tierra: { name: 'Tierra', icon: '🟢', color: '#10b981', glow: 'rgba(16, 185, 129, 0.45)' },
    saturno: { name: 'Saturno', icon: '🪐', color: '#a855f7', glow: 'rgba(168, 85, 247, 0.45)' },
    mercurio: { name: 'Mercurio', icon: '⚪', color: '#cbd5e1', glow: 'rgba(203, 213, 225, 0.45)' },
    urano: { name: 'Urano', icon: '💠', color: '#06b6d4', glow: 'rgba(6, 182, 212, 0.45)' },
    pluton: { name: 'Plutón', icon: '🌌', color: '#ec4899', glow: 'rgba(236, 72, 153, 0.45)' },
    neutral: { name: 'Arcano', icon: '🔮', color: '#94a3b8', glow: 'rgba(148, 163, 184, 0.3)' }
  };

  const CARD_TYPES = [
    { id: 'all', label: 'Todos' },
    { id: 'Criatura', label: 'Criatura' },
    { id: 'HechizoRapido', label: 'Hechizo Rápido' },
    { id: 'HechizoLento', label: 'Hechizo Lento' },
    { id: 'Estructura', label: 'Estructura' },
    { id: 'Artefacto', label: 'Artefacto' },
    { id: 'Sello', label: 'Sello (Recurso)' },
    { id: 'Terreno', label: 'Terreno' }
  ];

  function makeFullCardSvg(name, planetKey, type, rarity, cost, atk, def, desc, bgGrad1, bgGrad2, accentColor) {
    const elem = ELEMENTS[planetKey] || ELEMENTS.neutral;
    const isCreatureOrToken = (atk !== null && def !== null);
    const isSello = type === 'Sello';

    return `<svg viewBox="0 0 250 350" xmlns="http://www.w3.org/2000/svg" class="full-card-svg">
      <defs>
        <linearGradient id="bg_${name.replace(/\s+/g, '')}" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="${bgGrad1 || '#1e293b'}" />
          <stop offset="50%" stop-color="#0a0f1d" />
          <stop offset="100%" stop-color="${bgGrad2 || '#0f172a'}" />
        </linearGradient>
        <radialGradient id="gem_${name.replace(/\s+/g, '')}" cx="30%" cy="30%" r="70%">
          <stop offset="0%" stop-color="#ffffff" />
          <stop offset="40%" stop-color="${accentColor || '#38bdf8'}" />
          <stop offset="100%" stop-color="#090d18" />
        </radialGradient>
        <filter id="glow_${name.replace(/\s+/g, '')}">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>

      <!-- Outer Card Frame -->
      <rect width="250" height="350" rx="14" fill="url(#bg_${name.replace(/\s+/g, '')})" stroke="${accentColor || '#38bdf8'}" stroke-width="${isSello ? 4.5 : 3.5}"/>
      <rect x="8" y="8" width="234" height="334" rx="10" fill="none" stroke="rgba(255,255,255,0.15)" stroke-width="1"/>

      <!-- Top Header Banner -->
      <rect x="12" y="14" width="226" height="34" rx="6" fill="rgba(8,12,24,0.85)" stroke="${accentColor || '#38bdf8'}" stroke-width="1.5"/>
      
      <!-- Cost / Sello Icon -->
      <circle cx="30" cy="31" r="15" fill="url(#gem_${name.replace(/\s+/g, '')})" stroke="#ffffff" stroke-width="2" filter="url(#glow_${name.replace(/\s+/g, '')})"/>
      <text x="30" y="36" font-family="'JetBrains Mono', monospace" font-size="${isSello ? '11' : '14'}" font-weight="900" fill="#ffffff" text-anchor="middle">${isSello ? '💎' : cost}</text>

      <!-- Card Title -->
      <text x="125" y="36" font-family="'Cinzel', serif" font-size="11.5" font-weight="800" fill="#ffffff" text-anchor="middle">${name}</text>

      <!-- Planet Symbol -->
      <text x="222" y="36" font-size="14" text-anchor="middle">${elem.icon}</text>

      <!-- Central Art Window -->
      <rect x="16" y="54" width="218" height="155" rx="8" fill="#060913" stroke="rgba(255,255,255,0.2)" stroke-width="1"/>
      <circle cx="125" cy="130" r="50" fill="${accentColor || '#38bdf8'}" opacity="0.25" filter="url(#glow_${name.replace(/\s+/g, '')})"/>
      
      ${isSello ? `
        <circle cx="125" cy="130" r="40" fill="none" stroke="${accentColor || '#38bdf8'}" stroke-width="4" stroke-dasharray="8 4"/>
        <polygon points="125,95 155,145 95,145" fill="${accentColor || '#38bdf8'}" opacity="0.8"/>
        <circle cx="125" cy="130" r="16" fill="#ffffff"/>
      ` : `
        <polygon points="125,75 165,130 145,175 105,175 85,130" fill="${accentColor || '#38bdf8'}" opacity="0.8"/>
        <circle cx="125" cy="130" r="24" fill="#ffffff" opacity="0.9"/>
        <circle cx="125" cy="130" r="14" fill="#0a0f1d"/>
      `}

      <!-- Ribbon -->
      <rect x="16" y="213" width="218" height="20" rx="4" fill="rgba(12,18,34,0.95)" stroke="rgba(255,255,255,0.12)" stroke-width="1"/>
      <text x="26" y="227" font-family="'Outfit', sans-serif" font-size="9.5" font-weight="700" fill="${accentColor || '#38bdf8'}" text-transform="uppercase">${elem.name} • ${type}</text>
      <text x="224" y="227" font-family="'Outfit', sans-serif" font-size="9.5" font-weight="700" fill="#fbbf24" text-anchor="end">${rarity || ''}</text>

      <!-- Ability Box -->
      <rect x="16" y="238" width="218" height="66" rx="6" fill="rgba(8,12,24,0.92)" stroke="rgba(255,255,255,0.1)" stroke-width="1"/>
      <foreignObject x="22" y="242" width="206" height="58">
        <div xmlns="http://www.w3.org/1999/xhtml" style="font-family: 'Outfit', sans-serif; font-size: 10px; line-height: 1.35; color: #e2e8f0; text-align: center; display: flex; align-items: center; justify-content: center; height: 100%;">
          ${desc || ''}
        </div>
      </foreignObject>

      ${isCreatureOrToken ? `
        <polygon points="32,298 48,312 48,332 32,342 16,332 16,312" fill="#dc2626" stroke="#f87171" stroke-width="1.5"/>
        <text x="32" y="326" font-family="'JetBrains Mono', monospace" font-size="13" font-weight="900" fill="#ffffff" text-anchor="middle">${atk}</text>

        <polygon points="218,298 234,312 234,332 218,342 202,332 202,312" fill="#16a34a" stroke="#4ade80" stroke-width="1.5"/>
        <text x="218" y="326" font-family="'JetBrains Mono', monospace" font-size="13" font-weight="900" fill="#ffffff" text-anchor="middle">${def}</text>
      ` : ''}
    </svg>`;
  }

  // Master Card Array (Starts clean and empty)
  const CARDS_DATA = [];

  function getCardById(id) {
    return CARDS_DATA.find(c => c.id === id);
  }

  // ==========================================================================
  // 2. CUSTOM CARDS IMPORT ENGINE & INDEXED-DB
  // ==========================================================================
  const DB_NAME = 'AetheriumTCG_CustomCardsDB';
  const STORE_NAME = 'custom_cards';
  let dbInstance = null;

  function initIndexedDB() {
    return new Promise((resolve) => {
      try {
        const request = indexedDB.open(DB_NAME, 2);
        request.onupgradeneeded = (e) => {
          const db = e.target.result;
          if (!db.objectStoreNames.contains(STORE_NAME)) {
            db.createObjectStore(STORE_NAME, { keyPath: 'id' });
          }
        };
        request.onsuccess = (e) => {
          dbInstance = e.target.result;
          loadSavedCustomCards().then(resolve);
        };
        request.onerror = () => resolve([]);
      } catch (e) {
        resolve([]);
      }
    });
  }

  function saveCustomCardToDB(card) {
    if (!dbInstance) return Promise.resolve();
    return new Promise((resolve) => {
      try {
        const tx = dbInstance.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        store.put(card);
        tx.oncomplete = () => resolve();
        tx.onerror = () => resolve();
      } catch (e) {
        resolve();
      }
    });
  }

  function loadSavedCustomCards() {
    if (!dbInstance) return Promise.resolve([]);
    return new Promise((resolve) => {
      try {
        const tx = dbInstance.transaction(STORE_NAME, 'readonly');
        const store = tx.objectStore(STORE_NAME);
        const request = store.getAll();
        request.onsuccess = () => {
          const cards = request.result || [];
          cards.forEach(card => {
            if (!CARDS_DATA.some(c => c.id === card.id)) {
              CARDS_DATA.push(card);
            }
          });
          resolve(cards);
        };
        request.onerror = () => resolve([]);
      } catch (e) {
        resolve([]);
      }
    });
  }

  function clearCustomCardsDB() {
    if (!dbInstance) return Promise.resolve();
    return new Promise((resolve) => {
      try {
        const tx = dbInstance.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        store.clear();
        tx.oncomplete = () => resolve();
        tx.onerror = () => resolve();
      } catch (e) {
        resolve();
      }
    });
  }

  const TYPE_MAP = {
    criatura: 'Criatura', creature: 'Criatura', monstruo: 'Criatura', unidad: 'Criatura',
    hechizorapido: 'HechizoRapido', hechizo_rapido: 'HechizoRapido', fastspell: 'HechizoRapido', instant: 'HechizoRapido', rapido: 'HechizoRapido',
    hechizolento: 'HechizoLento', hechizo_lento: 'HechizoLento', slowspell: 'HechizoLento', sorcery: 'HechizoLento', hechizo: 'HechizoLento', lento: 'HechizoLento', spell: 'HechizoLento',
    estructura: 'Estructura', structure: 'Estructura', landmark: 'Estructura', monumento: 'Estructura',
    artefacto: 'Artefacto', artifact: 'Artefacto', reliquia: 'Artefacto', objeto: 'Artefacto',
    sello: 'Sello', seal: 'Sello', tierra_mana: 'Sello', land: 'Sello', mana: 'Sello',
    terreno: 'Terreno', field: 'Terreno', campo: 'Terreno', habitat: 'Terreno',
    token: 'Token', ficha: 'Token'
  };

  const RARITY_MAP = {
    comun: 'Common', común: 'Common', common: 'Common',
    rara: 'Rare', rare: 'Rare',
    epica: 'Epic', épica: 'Epic', epic: 'Epic',
    legendaria: 'Legendary', legendary: 'Legendary', mitica: 'Legendary', mítica: 'Legendary'
  };

  const ELEMENT_MAP = {
    marte: 'marte', mars: 'marte', fuego: 'marte', rojo: 'marte', red: 'marte',
    neptuno: 'neptuno', neptune: 'neptuno', agua: 'neptuno', azul: 'neptuno', blue: 'neptuno', water: 'neptuno',
    jupiter: 'jupiter', júpiter: 'jupiter', oro: 'jupiter', dorado: 'jupiter', gold: 'jupiter', ambar: 'jupiter',
    tierra: 'tierra', earth: 'tierra', terra: 'tierra', verde: 'tierra', green: 'tierra', naturaleza: 'tierra',
    saturno: 'saturno', saturn: 'saturno', morado: 'saturno', violeta: 'saturno', purple: 'saturno',
    mercurio: 'mercurio', mercury: 'mercurio', plata: 'mercurio', plateado: 'mercurio', silver: 'mercurio', gris: 'mercurio',
    urano: 'urano', uranus: 'urano', cian: 'urano', celeste: 'urano', cyan: 'urano', hielo: 'urano',
    pluton: 'pluton', plutón: 'pluton', pluto: 'pluton', vacio: 'pluton', vacío: 'pluton', sombra: 'pluton', negro: 'pluton',
    arcano: 'neutral', neutral: 'neutral', incoloro: 'neutral', colorless: 'neutral'
  };

  function cleanCardName(rawName) {
    return rawName
      .replace(/[-_]/g, ' ')
      .replace(/([a-z])([A-Z])/g, '$1 $2')
      .trim();
  }

  function parseCardFilename(filename, dataUrl) {
    const base = filename.substring(0, filename.lastIndexOf('.')) || filename;
    const parts = base.split('_');
    const firstPart = parts[0].toLowerCase().trim();

    // 1. PATTERN: Sello_Faccion
    if (firstPart === 'sello') {
      const planetKey = parts.length > 2 ? parts[2].toLowerCase().trim() : (parts[1] || 'marte').toLowerCase().trim();
      const element = ELEMENT_MAP[planetKey] || 'neutral';
      const name = parts.length > 2 ? `Sello de ${cleanCardName(parts[1])}` : `Sello de ${cleanCardName(planetKey)}`;
      const id = 'sello_' + element + '_' + Math.random().toString(36).substring(2, 7);

      return {
        id,
        name,
        element,
        type: 'Sello',
        rarity: null, // Sellos have NO rarity!
        cost: 0,
        attack: null,
        health: null,
        description: `Sello elemental de ${element.toUpperCase()}. Genera 1 punto de maná de ${element.toUpperCase()}.`,
        flavor: `"La resonancia cósmica de ${element} fluye a través de este sello sagrado."`,
        imageUrl: dataUrl,
        isCustom: true,
        isSello: true
      };
    }

    // 2. PATTERN: Token_Nombre_Faccion
    if (firstPart === 'token') {
      const planetKey = parts.length > 2 ? parts[2].toLowerCase().trim() : (parts[1] || 'marte').toLowerCase().trim();
      const element = ELEMENT_MAP[planetKey] || 'neutral';
      const tokenName = parts.length > 2 ? cleanCardName(parts[1]) : `Token de ${cleanCardName(planetKey)}`;
      const id = 'token_' + element + '_' + Math.random().toString(36).substring(2, 7);

      return {
        id,
        name: tokenName,
        element,
        type: 'Token',
        rarity: 'Common',
        cost: 0,
        attack: 1,
        health: 1,
        description: `Token de Facción (${element.toUpperCase()}). Se invoca automáticamente en el Mazo Extra cuando tu mazo contiene cartas de ${element.toUpperCase()}.`,
        flavor: `"Ficha elemental invocada por la presencia de ${element}."`,
        imageUrl: dataUrl,
        isCustom: true,
        isToken: true
      };
    }

    // 3. PATTERN: Standard Nombre_Tipo_Rareza_Faccion_ATK_DEF_Coste
    const name = cleanCardName(parts[0] || 'Carta Personalizada');
    const rawType = (parts[1] || 'Criatura').toLowerCase().replace(/\s+/g, '').trim();
    const rawRarity = (parts[2] || 'Comun').toLowerCase().trim();
    const rawColor = (parts[3] || 'Neutral').toLowerCase().trim();
    const rawAtk = parts[4];
    const rawDef = parts[5];
    const rawCost = parts[6] || parts[parts.length - 1];

    const type = TYPE_MAP[rawType] || 'Criatura';
    let rarity = RARITY_MAP[rawRarity] || 'Common';
    const element = ELEMENT_MAP[rawColor] || 'neutral';
    const isSello = type === 'Sello';

    if (isSello) {
      rarity = null; // Sellos have NO rarity!
    }

    let attack = null;
    let health = null;
    if (type === 'Criatura') {
      const pAtk = parseInt(rawAtk, 10);
      const pDef = parseInt(rawDef, 10);
      attack = isNaN(pAtk) ? 1 : Math.max(0, pAtk);
      health = isNaN(pDef) ? 1 : Math.max(1, pDef);
    }

    let cost = 0;
    if (isSello) {
      cost = 0;
    } else if (rawCost !== undefined) {
      const match = String(rawCost).match(/\d+/);
      if (match) cost = parseInt(match[0], 10);
    }

    const id = 'custom_' + Math.random().toString(36).substring(2, 9) + '_' + Date.now().toString(36);

    return {
      id,
      name,
      element,
      type,
      rarity,
      cost: Math.max(0, Math.min(20, cost)),
      attack,
      health,
      description: `Carta de tipo ${type} alineada con el planeta ${element.toUpperCase()}.`,
      flavor: `"${name} se manifiesta desde los archivos cósmicos locales."`,
      imageUrl: dataUrl,
      isCustom: true,
      isToken: type === 'Token',
      isSello: isSello
    };
  }

  async function processImageFiles(files, onProgress) {
    const imageFiles = Array.from(files).filter(f => f.type.startsWith('image/'));
    const importedCards = [];

    for (let i = 0; i < imageFiles.length; i++) {
      const file = imageFiles[i];
      const dataUrl = await readFileAsDataURL(file);
      const card = parseCardFilename(file.name, dataUrl);

      await saveCustomCardToDB(card);
      CARDS_DATA.push(card);
      importedCards.push(card);

      if (onProgress) {
        onProgress(i + 1, imageFiles.length, card);
      }
    }

    return importedCards;
  }

  function readFileAsDataURL(file) {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target.result);
      reader.onerror = () => resolve('');
      reader.readAsDataURL(file);
    });
  }

  // ==========================================================================
  // 3. REACTIVE STATE & DECK RULES
  // ==========================================================================
  const STORAGE_KEY = 'aetherium_tcg_active_deck';

  const RARITY_LIMITS = {
    Common: 4,
    Rare: 3,
    Epic: 2,
    Legendary: 1
  };

  const state = {
    deckName: 'Mi Mazo de Batalla',
    deck: [],
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

  function subscribeToDeck(callback) {
    listeners.deck.push(callback);
  }

  function subscribeToFilters(callback) {
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

  function loadInitialState() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.deckName) state.deckName = parsed.deckName;
        if (Array.isArray(parsed.deck)) {
          state.deck = parsed.deck.filter(item => {
            const card = getCardById(item.cardId);
            return card && card.type !== 'Token' && !card.isToken;
          });
        }
        if (parsed.cardScale) {
          state.filters.cardScale = Math.max(0.75, Math.min(1.35, parsed.cardScale));
        }
      } else {
        state.deck = [];
      }
    } catch (err) {
      state.deck = [];
    }
  }

  function getDeckTotalCount() {
    return state.deck.reduce((sum, item) => sum + item.count, 0);
  }

  function getCardCountInDeck(cardId) {
    const found = state.deck.find(item => item.cardId === cardId);
    return found ? found.count : 0;
  }

  function getMaxAllowedCopies(cardId) {
    const card = getCardById(cardId);
    if (!card) return 4;
    if (card.type === 'Token' || card.isToken) return 0;
    if (card.type === 'Sello' || card.isSello || !card.rarity || card.rarity === 'None' || card.rarity === 'Sello') {
      return state.maxDeckSize;
    }
    return RARITY_LIMITS[card.rarity] || 4;
  }

  function canAddCardToDeck(cardId) {
    const card = getCardById(cardId);
    if (!card) return { allowed: false, reason: 'Carta no encontrada' };

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

  function addCardToDeck(cardId) {
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

  function removeCardFromDeck(cardId, removeAll = false) {
    const existingIndex = state.deck.findIndex(item => item.cardId === cardId);
    if (existingIndex === -1) return;

    if (removeAll || state.deck[existingIndex].count <= 1) {
      state.deck.splice(existingIndex, 1);
    } else {
      state.deck[existingIndex].count -= 1;
    }

    notifyDeckChanged();
  }

  function reorderDeck(fromIndex, toIndex) {
    if (fromIndex < 0 || fromIndex >= state.deck.length || toIndex < 0 || toIndex >= state.deck.length) return;
    const [movedItem] = state.deck.splice(fromIndex, 1);
    state.deck.splice(toIndex, 0, movedItem);
    notifyDeckChanged();
  }

  function clearDeck() {
    state.deck = [];
    notifyDeckChanged();
  }

  function setDeckName(name) {
    state.deckName = name.trim() || 'Mi Mazo de Batalla';
    saveToLocalStorage();
  }

  function getActiveFactionsInDeck() {
    const factions = new Set();
    state.deck.forEach(item => {
      const card = getCardById(item.cardId);
      if (card && card.element && card.element !== 'neutral') {
        factions.add(card.element.toLowerCase());
      }
    });
    return factions;
  }

  function getActiveExtraDeckTokens() {
    const activeFactions = getActiveFactionsInDeck();
    if (activeFactions.size === 0) return [];

    return CARDS_DATA.filter(card => {
      return (card.type === 'Token' || card.isToken) && activeFactions.has(card.element.toLowerCase());
    });
  }

  function setFilter(key, value) {
    state.filters[key] = value;
    notifyFiltersChanged();
  }

  function resetFilters() {
    state.filters.search = '';
    state.filters.element = 'all';
    state.filters.type = 'all';
    state.filters.rarity = 'all';
    state.filters.maxMana = 10;
    state.filters.sort = 'cost-asc';
    notifyFiltersChanged();
  }

  function exportDeckToText() {
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

  function exportDeckToJSON() {
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

  function importDeckFromJSON(jsonString) {
    try {
      const data = JSON.parse(jsonString);
      if (!data.deck || !Array.isArray(data.deck)) {
        throw new Error('Formato JSON inválido. Debe contener un array "deck".');
      }

      const newDeck = [];
      let importedCount = 0;

      data.deck.forEach(item => {
        let card = getCardById(item.cardId);
        if (!card && item.name) {
          card = CARDS_DATA.find(c => c.name.toLowerCase() === item.name.toLowerCase());
        }

        if (card && card.type !== 'Token' && !card.isToken) {
          const maxAllowed = getMaxAllowedCopies(card.id);
          const count = Math.min(Math.max(1, parseInt(item.count, 10) || 1), maxAllowed);
          newDeck.push({ cardId: card.id, count });
          importedCount += count;
        }
      });

      if (data.deckName) state.deckName = data.deckName;
      state.deck = newDeck;
      notifyDeckChanged();
      return { success: true, count: importedCount };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }

  function importDeckFromText(textString) {
    try {
      const lines = textString.split('\n');
      const newDeck = [];
      let importedCount = 0;

      lines.forEach(line => {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('//') || trimmed.startsWith('#')) {
          if (trimmed.startsWith('// Deck:')) {
            state.deckName = trimmed.replace('// Deck:', '').trim();
          }
          return;
        }

        const match = trimmed.match(/^(\d+)[xX]?\s+(.+)$/);
        if (match) {
          const qty = parseInt(match[1], 10);
          let rawName = match[2].trim();
          rawName = rawName.replace(/\[.*?\]/g, '').replace(/\(.*?\)/g, '').trim();

          const card = CARDS_DATA.find(c => c.name.toLowerCase() === rawName.toLowerCase() || c.id === rawName);
          if (card && card.type !== 'Token' && !card.isToken) {
            const maxAllowed = getMaxAllowedCopies(card.id);
            const count = Math.min(qty, maxAllowed);
            newDeck.push({ cardId: card.id, count });
            importedCount += count;
          }
        }
      });

      state.deck = newDeck;
      notifyDeckChanged();
      return { success: true, count: importedCount };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }

  // ==========================================================================
  // 4. SOUND SYNTHESIS
  // ==========================================================================
  let audioCtx = null;
  let soundEnabled = true;

  function getAudioContext() {
    if (!audioCtx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (AudioContext) audioCtx = new AudioContext();
    }
    if (audioCtx && audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
    return audioCtx;
  }

  function isSoundEnabled() { return soundEnabled; }
  function toggleSound() { soundEnabled = !soundEnabled; return soundEnabled; }

  function playTone(freq, type = 'sine', duration = 0.08, gainVal = 0.1) {
    if (!soundEnabled) return;
    try {
      const ctx = getAudioContext();
      if (!ctx) return;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      gain.gain.setValueAtTime(gainVal, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + duration);
    } catch (e) {}
  }

  function playCardPickup() { playTone(520, 'sine', 0.05, 0.08); }
  function playCardDrop() { playTone(380, 'triangle', 0.09, 0.12); }
  function playCardRemove() { playTone(240, 'sawtooth', 0.08, 0.09); }
  function playClick() { playTone(780, 'sine', 0.03, 0.05); }
  function playShuffle() {
    if (!soundEnabled) return;
    for (let i = 0; i < 4; i++) {
      setTimeout(() => playTone(300 + Math.random() * 300, 'triangle', 0.04, 0.06), i * 45);
    }
  }

  // ==========================================================================
  // 5. 3D CARD COMPONENT & INSPECTOR
  // ==========================================================================
  function createCardElement(card, options = {}) {
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
        ${cardGraphic}
        <div class="card-foil-sheen"></div>
        ${inDeckBadgeHtml}
        ${deckQtyBadgeHtml}
        ${deckOverlayHtml}
        ${isHandItem ? '<div class="mulligan-tag">DESCARTAR</div>' : ''}
      </div>
    `;

    attach3DTiltEffect(wrapper);
    return wrapper;
  }

  function attach3DTiltEffect(wrapper) {
    const card = wrapper.querySelector('.tcg-card');
    if (!card) return;

    let bounds;

    function onMouseEnter() { bounds = card.getBoundingClientRect(); }
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

  function openCardInspector(cardId) {
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
      <div class="inspector-card-col" id="inspector-card-container"></div>
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

    const cardElem = createCardElement(card, { draggable: false });
    content.querySelector('#inspector-card-container').appendChild(cardElem);

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

  function closeCardInspector() {
    const modal = document.getElementById('modal-card-inspector');
    if (modal) modal.classList.remove('is-open');
  }

  // ==========================================================================
  // 6. MANA CURVE & SELLO ANALYTICS
  // ==========================================================================
  function renderManaCurve() {
    const container = document.getElementById('mana-curve-bars');
    const avgDisplay = document.getElementById('avg-mana-display');
    if (!container) return;

    let selloCount = 0;
    const buckets = [0, 0, 0, 0, 0, 0, 0, 0];
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

    const avgCost = nonSelloCardsSum > 0 ? (nonSelloManaSum / nonSelloCardsSum).toFixed(1) : '0.0';
    if (avgDisplay) {
      avgDisplay.innerHTML = `Coste Medio: <strong>${avgCost}</strong> &bull; <span style="color:#10b981;">Sellos: ${selloCount}</span>`;
    }

    const maxCount = Math.max(...buckets, selloCount, 1);
    container.innerHTML = '';

    // Sello Bar
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

    // Cost Bars 1 to 7+
    const labels = ['0', '1', '2', '3', '4', '5', '6', '7+'];
    for (let idx = 1; idx <= 7; idx++) {
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

  // ==========================================================================
  // 7. DECK VIEW & COMPOSITION
  // ==========================================================================
  function initDeckView() {
    const deckGrid = document.getElementById('deck-grid');
    const extraDeckGrid = document.getElementById('extra-deck-grid');
    const deckNameInput = document.getElementById('deck-name-input');

    if (deckNameInput) {
      deckNameInput.value = state.deckName;
      deckNameInput.addEventListener('input', (e) => {
        setDeckName(e.target.value);
      });
    }

    if (deckGrid) {
      deckGrid.addEventListener('click', (e) => {
        const btn = e.target.closest('button');
        const cardWrapper = e.target.closest('.tcg-card-wrapper');
        if (!cardWrapper) return;

        const cardId = cardWrapper.dataset.cardId;
        if (!cardId) return;

        if (btn) {
          const action = btn.dataset.action;
          if (action === 'increment') {
            e.stopPropagation();
            const res = addCardToDeck(cardId);
            if (res.success) {
              playCardDrop();
            } else {
              showToast(res.reason, 'warning');
            }
          } else if (action === 'decrement') {
            e.stopPropagation();
            removeCardFromDeck(cardId, false);
            playCardRemove();
          } else if (action === 'inspect') {
            e.stopPropagation();
            openCardInspector(cardId);
          }
        } else {
          openCardInspector(cardId);
        }
      });

      deckGrid.addEventListener('dblclick', (e) => {
        const cardWrapper = e.target.closest('.tcg-card-wrapper');
        if (cardWrapper && cardWrapper.dataset.cardId) {
          e.stopPropagation();
          removeCardFromDeck(cardWrapper.dataset.cardId, false);
          playCardRemove();
        }
      });
    }

    if (extraDeckGrid) {
      extraDeckGrid.addEventListener('click', (e) => {
        const cardWrapper = e.target.closest('.tcg-card-wrapper');
        if (cardWrapper && cardWrapper.dataset.cardId) {
          openCardInspector(cardWrapper.dataset.cardId);
        }
      });
    }
  }

  function renderDeck() {
    const deckGrid = document.getElementById('deck-grid');
    const extraDeckGrid = document.getElementById('extra-deck-grid');
    const emptyState = document.getElementById('deck-empty-state');
    const extraEmptyState = document.getElementById('extra-empty-state');
    const totalCountElem = document.getElementById('deck-total-count');
    const extraCountElem = document.getElementById('extra-tokens-count');
    const statusBadge = document.getElementById('deck-status-badge');
    const countPill = document.getElementById('deck-count-pill');

    if (!deckGrid) return;

    const totalCount = getDeckTotalCount();

    if (totalCountElem) totalCountElem.textContent = totalCount;

    if (countPill && statusBadge) {
      countPill.classList.remove('is-valid', 'is-over');
      statusBadge.className = 'deck-status-badge';

      if (totalCount === 40) {
        countPill.classList.add('is-valid');
        statusBadge.classList.add('is-ready');
        statusBadge.textContent = 'Listo (40/40)';
      } else if (totalCount > 40) {
        countPill.classList.add('is-over');
        statusBadge.classList.add('is-overlimit');
        statusBadge.textContent = `Exceso (${totalCount}/40)`;
      } else {
        statusBadge.classList.add('is-incomplete');
        statusBadge.textContent = `Incompleto (${totalCount}/40)`;
      }
    }

    if (state.deck.length === 0) {
      deckGrid.innerHTML = '';
      if (emptyState) emptyState.style.display = 'flex';
    } else {
      if (emptyState) emptyState.style.display = 'none';
      deckGrid.innerHTML = '';

      state.deck.forEach((item, index) => {
        const card = getCardById(item.cardId);
        if (!card) return;

        const cardElem = createCardElement(card, {
          isDeckItem: true,
          deckCount: item.count,
          draggable: true
        });
        cardElem.dataset.deckIndex = index;
        deckGrid.appendChild(cardElem);
      });
    }

    const activeTokens = getActiveExtraDeckTokens();
    if (extraCountElem) extraCountElem.textContent = activeTokens.length;

    if (extraDeckGrid) {
      if (activeTokens.length === 0) {
        extraDeckGrid.innerHTML = '';
        if (extraEmptyState) extraEmptyState.style.display = 'block';
      } else {
        if (extraEmptyState) extraEmptyState.style.display = 'none';
        extraDeckGrid.innerHTML = '';

        activeTokens.forEach(token => {
          const cardElem = createCardElement(token, {
            isDeckItem: false,
            draggable: false
          });
          extraDeckGrid.appendChild(cardElem);
        });
      }
    }

    updateDeckCompositionStats();
    renderManaCurve();
  }

  function updateDeckCompositionStats() {
    let creatures = 0, fastSpells = 0, slowSpells = 0, structures = 0, artifacts = 0, sellos = 0, terrains = 0;
    const planetCounts = {};

    state.deck.forEach(item => {
      const card = getCardById(item.cardId);
      if (!card) return;

      const count = item.count;
      switch (card.type) {
        case 'Criatura': creatures += count; break;
        case 'HechizoRapido': fastSpells += count; break;
        case 'HechizoLento': slowSpells += count; break;
        case 'Estructura': structures += count; break;
        case 'Artefacto': artifacts += count; break;
        case 'Sello': sellos += count; break;
        case 'Terreno': terrains += count; break;
      }

      if (card.element && card.element !== 'neutral') {
        planetCounts[card.element] = (planetCounts[card.element] || 0) + count;
      }
    });

    const setPill = (id, count) => {
      const el = document.getElementById(id);
      if (el) el.textContent = `${el.textContent.split(':')[0]}: ${count}`;
    };

    setPill('pill-creatures', creatures);
    setPill('pill-fast-spells', fastSpells);
    setPill('pill-slow-spells', slowSpells);
    setPill('pill-structures', structures);
    setPill('pill-artifacts', artifacts);
    setPill('pill-sellos', sellos);
    setPill('pill-terrains', terrains);

    const dotsContainer = document.getElementById('element-distribution-dots');
    if (dotsContainer) {
      dotsContainer.innerHTML = '';
      Object.keys(planetCounts).forEach(planetKey => {
        const count = planetCounts[planetKey];
        const info = ELEMENTS[planetKey] || ELEMENTS.neutral;
        const badge = document.createElement('span');
        badge.className = 'planet-dot-badge';
        badge.style.background = info.glow;
        badge.style.borderColor = info.color;
        badge.innerHTML = `${info.icon} ${info.name}: <strong>${count}</strong>`;
        dotsContainer.appendChild(badge);
      });
    }
  }

  // ==========================================================================
  // 8. FILTER & LIBRARY MANAGER
  // ==========================================================================
  function initFilters() {
    const searchInput = document.getElementById('filter-search');
    const clearSearchBtn = document.getElementById('btn-clear-search');

    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        const val = e.target.value;
        setFilter('search', val);
        if (clearSearchBtn) clearSearchBtn.style.display = val ? 'block' : 'none';
      });
    }

    if (clearSearchBtn) {
      clearSearchBtn.addEventListener('click', () => {
        if (searchInput) searchInput.value = '';
        clearSearchBtn.style.display = 'none';
        setFilter('search', '');
      });
    }

    const scaleSlider = document.getElementById('card-scale-slider');
    const scaleValueText = document.getElementById('card-scale-value');

    if (scaleSlider) {
      scaleSlider.value = state.filters.cardScale || 1.0;
      if (scaleValueText) scaleValueText.textContent = `${Math.round(scaleSlider.value * 100)}%`;

      scaleSlider.addEventListener('input', (e) => {
        const scale = parseFloat(e.target.value);
        setFilter('cardScale', scale);
        if (scaleValueText) scaleValueText.textContent = `${Math.round(scale * 100)}%`;
        applyCardScale(scale);
      });
    }

    const elementButtons = document.querySelectorAll('#element-filters .element-btn');
    elementButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        elementButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        playClick();
        setFilter('element', btn.dataset.element);
      });
    });

    const typeButtons = document.querySelectorAll('#type-filters .pill-filter-btn');
    typeButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        typeButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        playClick();
        setFilter('type', btn.dataset.type);
      });
    });

    const raritySelect = document.getElementById('rarity-filter');
    if (raritySelect) {
      raritySelect.addEventListener('change', (e) => {
        playClick();
        setFilter('rarity', e.target.value);
      });
    }

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

    const sortSelect = document.getElementById('sort-select');
    if (sortSelect) {
      sortSelect.addEventListener('change', (e) => {
        playClick();
        setFilter('sort', e.target.value);
      });
    }

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

  function renderLibrary() {
    const libraryGrid = document.getElementById('library-grid');
    const emptyState = document.getElementById('library-empty');
    const filteredCountElem = document.getElementById('filtered-card-count');
    const totalCountElem = document.getElementById('total-card-count');

    if (!libraryGrid) return;

    const { search, element, type, rarity, maxMana, sort } = state.filters;

    let filtered = CARDS_DATA.filter(card => {
      if ((card.type === 'Token' || card.isToken) && type !== 'Token') {
        return false;
      }

      if (search.trim()) {
        const query = search.toLowerCase();
        const matchName = card.name.toLowerCase().includes(query);
        const matchDesc = card.description && card.description.toLowerCase().includes(query);
        const matchFlavor = card.flavor && card.flavor.toLowerCase().includes(query);
        if (!matchName && !matchDesc && !matchFlavor) return false;
      }

      if (element !== 'all' && card.element !== element) return false;
      if (type !== 'all' && card.type !== type) return false;

      if (rarity !== 'all') {
        if (card.type === 'Sello' || card.isSello || !card.rarity) return false;
        if (card.rarity !== rarity) return false;
      }

      if (maxMana < 10 && card.cost > maxMana) return false;

      return true;
    });

    filtered.sort((a, b) => {
      switch (sort) {
        case 'cost-asc': return a.cost - b.cost || a.name.localeCompare(b.name);
        case 'cost-desc': return b.cost - a.cost || a.name.localeCompare(b.name);
        case 'name-asc': return a.name.localeCompare(b.name);
        case 'name-desc': return b.name.localeCompare(a.name);
        case 'rarity-desc': return (RARITY_WEIGHT[b.rarity] || 0) - (RARITY_WEIGHT[a.rarity] || 0) || a.cost - b.cost;
        case 'attack-desc': return (b.attack || 0) - (a.attack || 0) || a.cost - b.cost;
        case 'health-desc': return (b.health || 0) - (a.health || 0) || a.cost - b.cost;
        default: return 0;
      }
    });

    const nonTokenTotal = CARDS_DATA.filter(c => c.type !== 'Token' && !c.isToken).length;
    if (totalCountElem) totalCountElem.textContent = nonTokenTotal;
    if (filteredCountElem) filteredCountElem.textContent = filtered.length;

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
      libraryGrid.innerHTML = '';

      filtered.forEach(card => {
        const currentInDeck = getCardCountInDeck(card.id);
        const maxAllowed = getMaxAllowedCopies(card.id);
        const isSello = card.type === 'Sello' || card.isSello || !card.rarity;
        const isMaxInDeck = !isSello && currentInDeck >= maxAllowed;

        const cardElem = createCardElement(card, {
          isDeckItem: false,
          isMaxInDeck,
          draggable: card.type !== 'Token' && !card.isToken
        });
        libraryGrid.appendChild(cardElem);
      });
    }
  }

  // ==========================================================================
  // 9. DRAG AND DROP ENGINE
  // ==========================================================================
  let draggedData = null;

  function initDragAndDrop() {
    const deckDropzone = document.getElementById('deck-dropzone');
    const trashDropzone = document.getElementById('trash-dropzone');

    if (!deckDropzone || !trashDropzone) return;

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

      cardElem.classList.add('is-dragging');
      playCardPickup();

      if (isDeckItem) trashDropzone.classList.add('is-active');
    });

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

    deckDropzone.addEventListener('dragenter', (e) => {
      e.preventDefault();
      if (draggedData) deckDropzone.classList.add('is-drag-over');
    });

    deckDropzone.addEventListener('dragover', (e) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = draggedData && draggedData.source === 'library' ? 'copy' : 'move';
    });

    deckDropzone.addEventListener('dragleave', (e) => {
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

    trashDropzone.addEventListener('dragenter', (e) => {
      e.preventDefault();
      trashDropzone.classList.add('is-drag-over');
    });

    trashDropzone.addEventListener('dragover', (e) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
    });

    trashDropzone.addEventListener('dragleave', () => {
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
        removeCardFromDeck(payload.cardId, false);
        playCardRemove();
        const card = getCardById(payload.cardId);
        showToast(`Removida 1 copia de ${card ? card.name : 'Carta'}`, 'info');
      }
    });
  }

  // ==========================================================================
  // 10. SAMPLE HAND SIMULATOR (MULLIGAN)
  // ==========================================================================
  let currentHand = [];
  let remainingDeck = [];

  function shuffleArray(array) {
    const arr = [...array];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

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

  function initTestHandModal() {
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

    if (mulliganBtn) mulliganBtn.addEventListener('click', executeMulligan);
    if (drawOneBtn) drawOneBtn.addEventListener('click', drawOneCard);
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
    const container = document.getElementById('test-hand-cards-grid');
    const remainingCountElem = document.getElementById('test-hand-remaining-count');
    if (!container) return;

    if (remainingCountElem) remainingCountElem.textContent = remainingDeck.length;
    container.innerHTML = '';

    currentHand.forEach((item, index) => {
      const cardWrapper = createCardElement(item.card, {
        isHandItem: true,
        draggable: false
      });

      if (item.selectedForMulligan) cardWrapper.classList.add('selected-for-mulligan');

      cardWrapper.addEventListener('click', () => {
        playClick();
        item.selectedForMulligan = !item.selectedForMulligan;
        cardWrapper.classList.toggle('selected-for-mulligan', item.selectedForMulligan);
      });

      container.appendChild(cardWrapper);
    });
  }

  // ==========================================================================
  // 11. BOOTSTRAP, MODALS & GLOBAL APPLICATION
  // ==========================================================================
  function showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const icons = { success: '✨', warning: '⚠️', danger: '🛑', info: 'ℹ️' };
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `
      <span class="toast-icon">${icons[type] || '✨'}</span>
      <span class="toast-text">${message}</span>
    `;

    container.appendChild(toast);
    setTimeout(() => {
      toast.classList.add('hide');
      setTimeout(() => toast.remove(), 300);
    }, 2800);
  }

  function initSoundButton() {
    const btn = document.getElementById('btn-sound-toggle');
    const icon = document.getElementById('sound-icon');
    const updateIcon = () => {
      if (icon) icon.textContent = isSoundEnabled() ? '🔊' : '🔇';
    };

    updateIcon();
    if (btn) {
      btn.addEventListener('click', () => {
        const enabled = toggleSound();
        updateIcon();
        showToast(enabled ? 'Efectos de sonido activados' : 'Efectos de sonido silenciados', 'info');
      });
    }
  }

  function initClearDeckButton() {
    const btn = document.getElementById('btn-clear-deck');
    if (btn) {
      btn.addEventListener('click', () => {
        if (state.deck.length === 0) {
          showToast('El mazo ya está vacío.', 'info');
          return;
        }
        if (confirm('¿Estás seguro de que deseas vaciar todas las cartas del mazo?')) {
          clearDeck();
          playCardRemove();
          showToast('Se ha vaciado el mazo por completo.', 'info');
        }
      });
    }
  }

  function initExportImportModal() {
    const modal = document.getElementById('modal-export-import');
    const openBtn = document.getElementById('btn-export-deck');
    const closeBtn = document.getElementById('btn-close-export');
    const copyBtn = document.getElementById('btn-copy-clipboard');
    const applyBtn = document.getElementById('btn-import-apply');

    const textArea = document.getElementById('export-text-area');
    const jsonArea = document.getElementById('export-json-area');
    const tabButtons = modal ? modal.querySelectorAll('.tab-btn') : [];

    let currentTab = 'tab-text-deck';

    tabButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        tabButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentTab = btn.dataset.tab;

        const tabText = document.getElementById('tab-text-deck');
        const tabJson = document.getElementById('tab-json-deck');

        if (currentTab === 'tab-text-deck') {
          if (tabText) tabText.classList.add('active');
          if (tabJson) tabJson.classList.remove('active');
        } else {
          if (tabText) tabText.classList.remove('active');
          if (tabJson) tabJson.classList.add('active');
        }
        playClick();
      });
    });

    if (openBtn) {
      openBtn.addEventListener('click', () => {
        playClick();
        if (textArea) textArea.value = exportDeckToText();
        if (jsonArea) jsonArea.value = exportDeckToJSON();
        if (modal) modal.classList.add('is-open');
      });
    }

    if (closeBtn && modal) {
      closeBtn.addEventListener('click', () => modal.classList.remove('is-open'));
      modal.addEventListener('click', (e) => {
        if (e.target === modal) modal.classList.remove('is-open');
      });
    }

    if (copyBtn) {
      copyBtn.addEventListener('click', async () => {
        playClick();
        const contentToCopy = currentTab === 'tab-text-deck' ? (textArea ? textArea.value : '') : (jsonArea ? jsonArea.value : '');
        try {
          await navigator.clipboard.writeText(contentToCopy);
          showToast('¡Copiado al portapapeles con éxito!', 'success');
        } catch {
          showToast('Por favor selecciona y copia manualmente.', 'warning');
        }
      });
    }

    if (applyBtn) {
      applyBtn.addEventListener('click', () => {
        playClick();
        let res;
        if (currentTab === 'tab-text-deck') {
          res = importDeckFromText(textArea ? textArea.value : '');
        } else {
          res = importDeckFromJSON(jsonArea ? jsonArea.value : '');
        }

        if (res.success) {
          showToast(`¡Mazo importado con éxito (${res.count} cartas cargadas)!`, 'success');
          if (modal) modal.classList.remove('is-open');
        } else {
          showToast(`Error al importar: ${res.error || 'Formato no reconocido'}`, 'danger');
        }
      });
    }
  }

  function initCardImporterModal() {
    const modal = document.getElementById('modal-import-images');
    const openBtn = document.getElementById('btn-import-folder');
    const closeBtn = document.getElementById('btn-close-import-images');
    const confirmCloseBtn = document.getElementById('btn-confirm-import-close');
    const dropArea = document.getElementById('import-drop-area');
    const inputFolder = document.getElementById('input-import-folder');
    const inputFiles = document.getElementById('input-import-files');
    const selectFolderBtn = document.getElementById('btn-select-folder');
    const selectFilesBtn = document.getElementById('btn-select-files');
    const clearDbBtn = document.getElementById('btn-clear-custom-cards');
    const progressBox = document.getElementById('import-progress-box');
    const progressFill = document.getElementById('import-progress-fill');
    const progressText = document.getElementById('import-progress-text');
    const resultsSummary = document.getElementById('import-results-summary');
    const cardsPreview = document.getElementById('import-cards-preview');

    const closeModal = () => { if (modal) modal.classList.remove('is-open'); };

    if (openBtn) {
      openBtn.addEventListener('click', () => {
        playClick();
        if (modal) modal.classList.add('is-open');
      });
    }

    if (closeBtn) closeBtn.addEventListener('click', closeModal);
    if (confirmCloseBtn) confirmCloseBtn.addEventListener('click', closeModal);
    if (modal) {
      modal.addEventListener('click', (e) => {
        if (e.target === modal) closeModal();
      });
    }

    if (selectFolderBtn && inputFolder) {
      selectFolderBtn.addEventListener('click', () => inputFolder.click());
    }

    if (selectFilesBtn && inputFiles) {
      selectFilesBtn.addEventListener('click', () => inputFiles.click());
    }

    const handleFiles = async (files) => {
      if (!files || files.length === 0) return;

      if (progressBox) progressBox.style.display = 'flex';
      if (resultsSummary) resultsSummary.style.display = 'none';
      if (cardsPreview) cardsPreview.innerHTML = '';

      const imported = await processImageFiles(files, (curr, total, card) => {
        const pct = Math.round((curr / total) * 100);
        if (progressFill) progressFill.style.width = `${pct}%`;
        if (progressText) progressText.textContent = `Procesando: ${curr}/${total}${card ? ' (' + card.name + ')' : ''}`;
      });

      if (progressBox) progressBox.style.display = 'none';

      if (imported.length > 0) {
        playCardDrop();
        showToast(`¡Se importaron ${imported.length} cartas al catálogo!`, 'success');

        if (resultsSummary && cardsPreview) {
          resultsSummary.style.display = 'block';
          imported.forEach(c => {
            const chip = document.createElement('div');
            chip.className = 'preview-chip';
            chip.innerHTML = `
              <span class="preview-chip-name" title="${c.name}">${c.name}</span>
              <span class="preview-chip-meta">${c.type} • ${c.cost}💧</span>
            `;
            cardsPreview.appendChild(chip);
          });
        }

        renderLibrary();
        renderDeck();
      } else {
        showToast('No se encontraron imágenes válidas en la selección.', 'warning');
      }
    };

    if (inputFolder) {
      inputFolder.addEventListener('change', (e) => {
        handleFiles(e.target.files);
        inputFolder.value = '';
      });
    }

    if (inputFiles) {
      inputFiles.addEventListener('change', (e) => {
        handleFiles(e.target.files);
        inputFiles.value = '';
      });
    }

    if (dropArea) {
      dropArea.addEventListener('dragenter', (e) => {
        e.preventDefault();
        dropArea.classList.add('is-drag-over');
      });

      dropArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'copy';
      });

      dropArea.addEventListener('dragleave', (e) => {
        if (!dropArea.contains(e.relatedTarget)) {
          dropArea.classList.remove('is-drag-over');
        }
      });

      dropArea.addEventListener('drop', (e) => {
        e.preventDefault();
        dropArea.classList.remove('is-drag-over');
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
          handleFiles(e.dataTransfer.files);
        }
      });
    }

    if (clearDbBtn) {
      clearDbBtn.addEventListener('click', async () => {
        if (confirm('¿Estás seguro de que deseas eliminar todas las cartas personalizadas importadas?')) {
          await clearCustomCardsDB();
          CARDS_DATA.length = 0;
          clearDeck();
          renderLibrary();
          renderDeck();
          if (resultsSummary) resultsSummary.style.display = 'none';
          showToast('Se eliminaron todas las cartas importadas de la memoria local.', 'info');
        }
      });
    }
  }

  // ==========================================================================
  // INITIALIZATION ON DOM READY
  // ==========================================================================
  document.addEventListener('DOMContentLoaded', async () => {
    // 1. Initialize IndexedDB and load saved custom cards
    await initIndexedDB();

    // 2. Load Active Deck State
    loadInitialState();

    // 3. Initialize UI Subsystems
    initDeckView();
    initFilters();
    initDragAndDrop();
    initTestHandModal();
    initSoundButton();
    initClearDeckButton();
    initExportImportModal();
    initCardImporterModal();

    // 4. Bind Subscriptions
    subscribeToDeck(() => {
      renderDeck();
      renderLibrary();
    });

    subscribeToFilters(() => {
      renderLibrary();
    });

    // 5. Initial Render
    renderLibrary();
    renderDeck();
  });

})();