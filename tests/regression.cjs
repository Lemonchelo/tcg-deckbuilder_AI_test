const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const root = path.resolve(__dirname, '..');
const bundle = fs.readFileSync(path.join(root, 'js/bundle.js'), 'utf8');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const availableIds = new Set([...html.matchAll(/id="([^"]+)"/g), ...bundle.matchAll(/id="([^"]+)"/g)].map(m=>m[1]));
for (const match of bundle.matchAll(/getElementById\('([^']+)'\)/g)) assert(availableIds.has(match[1]), 'Missing DOM element: '+match[1]);
console.log('Standalone bundle: all literal DOM IDs exist in HTML or dynamic templates');
function checkState(source, label) {
  const ctx = vm.createContext({document:{addEventListener(){}}, localStorage:{getItem(){return null},setItem(){}}, console});
  const api = 'globalThis.api = { CARDS_DATA, state, importDeckFromJSON, importDeckFromText, exportDeckToJSON, exportDeckToText, getDeckTotalCount };';
  vm.runInContext(source.includes('(function()') ? source.replace(/\}\)\(\);\s*$/, api+'})();') : source+'\n'+api, ctx);
  const a=ctx.api;
  a.CARDS_DATA.push({id:'a',name:'Alpha',rarity:'Common',type:'Criatura',element:'marte'}, {id:'s',name:'Sello',rarity:null,type:'Sello',element:'marte'}, {id:'t',name:'Token',type:'Token',isToken:true,element:'marte'});
  const load=deck=>a.importDeckFromJSON(JSON.stringify({deck}));
  assert(load([{cardId:'a',count:2},{cardId:'a',count:2}]).success);
  assert.equal(a.state.deck.length,1);
  assert.equal(a.getDeckTotalCount(),4);
  for (const deck of [[{cardId:'a',count:3},{cardId:'a',count:2}], [{cardId:'s',count:40},{cardId:'a',count:1}], [{cardId:'a',count:0}], [{cardId:'a',count:1.5}], [{cardId:'missing',count:1}], [null], [{cardId:'t',count:1}]]) {
    assert.equal(load(deck).success,false, JSON.stringify(deck));
    assert.equal(a.getDeckTotalCount(),4,'Invalid input changed the deck');
  }
  assert.equal(a.importDeckFromText('not a deck').success,false);
  assert.equal(a.getDeckTotalCount(),4);
  assert(a.importDeckFromText(a.exportDeckToText()).success);
  assert.equal(a.getDeckTotalCount(),4);
  assert(a.importDeckFromJSON(a.exportDeckToJSON()).success);
  console.log(label+': import limits, duplicate aggregation, atomic failure and round-trips passed');
}
checkState(bundle,'Standalone bundle');
checkState(['cardsData.js','state.js'].map(p=>fs.readFileSync(path.join(root,'js',p),'utf8').replace(/^import .*;\r?\n/gm,'').replace(/^export /gm,'')).join('\n'),'Modules');

function checkSideDeckAndBanlist(source, label) {
  const ctx = vm.createContext({document:{addEventListener(){}}, localStorage:{getItem(){return null},setItem(){}}, console});
  const api = 'globalThis.api = { CARDS_DATA, state, importDeckFromJSON, exportDeckToJSON, getDeckTotalCount, addCardToDeck, removeCardFromDeck, canAddCardToDeck, getMaxAllowedCopies, getCombinedCardCount, setBanlistLimit, clearBanlistLimit, getBanlistLimit };';
  vm.runInContext(source.includes('(function()') ? source.replace(/\}\)\(\);\s*$/, api+'})();') : source+'\n'+api, ctx);
  const a = ctx.api;
  a.CARDS_DATA.push({id:'a',name:'Alpha',rarity:'Common',type:'Criatura',element:'marte'}, {id:'l',name:'Legend',rarity:'Legendary',type:'Criatura',element:'marte'});

  // Shared copy limit between Main Deck and Side Deck: Alpha (Common, limit 4)
  assert(a.addCardToDeck('a', 'main').success); // main: 1
  assert(a.addCardToDeck('a', 'main').success); // main: 2
  assert(a.addCardToDeck('a', 'side').success); // side: 1 (combined 3)
  assert.equal(a.getCombinedCardCount('a'), 3);
  assert(a.addCardToDeck('a', 'side').success); // side: 2 (combined 4, at limit)
  assert.equal(a.canAddCardToDeck('a', 'main').allowed, false, 'Shared limit should block a 5th combined copy from either deck');
  assert.equal(a.canAddCardToDeck('a', 'side').allowed, false);

  // Side Deck has its own 15-card size ceiling, independent of the Main Deck's 40
  assert.equal(a.state.maxSideDeckSize, 15);

  // Banlist overrides the rarity-based limit and is shared between Main + Side Deck
  assert.equal(a.getMaxAllowedCopies('l'), 1); // Legendary default
  assert(a.setBanlistLimit('l', 8).success);
  assert.equal(a.getMaxAllowedCopies('l'), 8);
  assert(a.addCardToDeck('l', 'main').success);
  for (let i = 0; i < 6; i++) a.addCardToDeck('l', 'side'); // side: up to 7 total combined
  assert.equal(a.getCombinedCardCount('l'), 7);
  assert(a.canAddCardToDeck('l', 'main').allowed); // 8th copy still allowed under banlist override
  assert(a.addCardToDeck('l', 'main').success);
  assert.equal(a.canAddCardToDeck('l', 'main').allowed, false, 'Banlist limit of 8 should now block further copies');

  // Clearing the banlist entry restores the rarity default
  a.clearBanlistLimit('l');
  assert.equal(a.getBanlistLimit('l'), undefined);
  assert.equal(a.getMaxAllowedCopies('l'), 1);

  // Export/import round-trip preserves both Main Deck and Side Deck contents
  a.state.deck = [{cardId:'a', count:2}];
  a.state.sideDeck = [{cardId:'a', count:2}];
  const json = a.exportDeckToJSON();
  const parsed = JSON.parse(json);
  assert(Array.isArray(parsed.sideDeck) && parsed.sideDeck.length === 1, 'exportDeckToJSON should include sideDeck');
  a.state.deck = [];
  a.state.sideDeck = [];
  const res = a.importDeckFromJSON(json);
  assert(res.success);
  assert.equal(a.getDeckTotalCount('main'), 2);
  assert.equal(a.getDeckTotalCount('side'), 2);

  // Import rejects a combined main+side quantity that exceeds the shared per-card limit
  const overLimit = a.importDeckFromJSON(JSON.stringify({ deck: [{cardId:'a', count:3}], sideDeck: [{cardId:'a', count:2}] }));
  assert.equal(overLimit.success, false, 'Combined main+side quantity over the shared limit must be rejected');

  console.log(label+': side deck shared limits, banlist overrides and export/import round-trips passed');
}
checkSideDeckAndBanlist(bundle, 'Standalone bundle');
checkSideDeckAndBanlist(['cardsData.js','state.js'].map(p=>fs.readFileSync(path.join(root,'js',p),'utf8').replace(/^import .*;\r?\n/gm,'').replace(/^export /gm,'')).join('\n'), 'Modules');

function checkSavedDecks(source, label) {
  const store = new Map();
  let failWrites = false, failReads = false;
  const storage = {
    getItem(key) { if (failReads) throw new Error('blocked'); return store.has(key) ? store.get(key) : null; },
    setItem(key, value) { if (failWrites) throw new Error('quota'); store.set(key, String(value)); }
  };
  const ctx = vm.createContext({document:{addEventListener(){}}, localStorage:storage, console});
  const api = 'globalThis.api = { CARDS_DATA, state, importDeckFromJSON, exportDeckToJSON, getDeckTotalCount, addCardToDeck, clearDeck, setBanlistLimit, clearBanlistLimit, listSavedDecks, saveCurrentDeck, deleteSavedDeck, loadSavedDeck, isCurrentDeckSaved };';
  vm.runInContext(source.includes('(function()') ? source.replace(/\}\)\(\);\s*$/, api+'})();') : source+'\n'+api, ctx);
  const a = ctx.api;
  a.CARDS_DATA.push({id:'a',name:'Alpha',rarity:'Common',type:'Criatura',element:'marte'}, {id:'b',name:'Beta',rarity:'Rare',type:'Criatura',element:'neptuno'});
  const SAVED_KEY = 'aetherium_tcg_saved_decks';
  const decks = () => { const r = a.listSavedDecks(); assert(r.success, r.reason); return r.decks; };

  // Nothing to save, invalid names
  assert.equal(decks().length, 0);
  assert.equal(a.saveCurrentDeck('Vacio').success, false, 'an empty deck is not saved');
  assert(a.importDeckFromJSON(JSON.stringify({deckName:'Original', deck:[{cardId:'a',count:2}], sideDeck:[{cardId:'b',count:1}]})).success);
  assert.equal(a.saveCurrentDeck('').success, false);
  assert.equal(a.saveCurrentDeck('   ').success, false);
  assert.equal(decks().length, 0);

  // Save: stores main + side, renames the active deck, appears in the list
  const saved = a.saveCurrentDeck('Mazo A');
  assert(saved.success && !saved.overwritten);
  assert.equal(a.state.deckName, 'Mazo A');
  assert.equal(decks().length, 1);
  assert.equal(JSON.stringify(decks()[0].data.deck.map(i => [i.cardId, i.count])), '[["a",2]]');
  assert.equal(JSON.stringify(decks()[0].data.sideDeck.map(i => [i.cardId, i.count])), '[["b",1]]');
  assert(a.isCurrentDeckSaved());
  const long = a.saveCurrentDeck('X'.repeat(50));
  assert(long.success);
  assert.equal(decks().find(d => d.id === long.id).name.length, 32, 'names are limited to 32 characters');
  assert(a.deleteSavedDeck(long.id).success);

  // Duplicate names (case-insensitive) need an explicit overwrite
  const dup = a.saveCurrentDeck('mazo a');
  assert.equal(dup.success, false); assert.equal(dup.exists, true);
  assert.equal(decks().length, 1);
  a.addCardToDeck('a', 'main');
  assert.equal(a.isCurrentDeckSaved(), false, 'edited deck no longer matches a saved deck');
  const over = a.saveCurrentDeck('mazo a', {overwrite:true});
  assert(over.success && over.overwritten); assert.equal(over.id, saved.id);
  assert.equal(decks().length, 1);
  assert.equal(decks()[0].data.deck[0].count, 3);
  assert(a.isCurrentDeckSaved());

  // A second saved deck; the list is ordered newest first
  a.clearDeck();
  assert(a.importDeckFromJSON(JSON.stringify({deck:[{cardId:'b',count:3}]})).success);
  const second = a.saveCurrentDeck('Mazo B');
  assert(second.success);
  assert.equal(decks().length, 2);

  // Load restores main, side and name; export/import of the same deck still round-trips
  a.clearDeck();
  const loaded = a.loadSavedDeck(saved.id);
  assert(loaded.success); assert.equal(loaded.name, 'mazo a');
  assert.equal(a.getDeckTotalCount('main'), 3); assert.equal(a.getDeckTotalCount('side'), 1);
  assert.equal(a.state.deckName, 'mazo a');
  assert(a.importDeckFromJSON(a.exportDeckToJSON()).success);
  assert.equal(a.getDeckTotalCount('main'), 3);

  // A load that fails validation never changes the current deck
  a.clearDeck();
  assert(a.importDeckFromJSON(JSON.stringify({deckName:'Actual', deck:[{cardId:'b',count:1}]})).success);
  const snapshot = JSON.stringify([a.state.deck, a.state.sideDeck, a.state.deckName]);
  assert(a.setBanlistLimit('a', 1).success);
  const blocked = a.loadSavedDeck(saved.id);
  assert.equal(blocked.success, false, 'the banlist is applied when loading a saved deck');
  assert.equal(JSON.stringify([a.state.deck, a.state.sideDeck, a.state.deckName]), snapshot);
  a.clearBanlistLimit('a');
  assert.equal(a.loadSavedDeck('missing-id').success, false);
  const removedIndex = a.CARDS_DATA.findIndex(c => c.id === 'a');
  const [removedCard] = a.CARDS_DATA.splice(removedIndex, 1);
  assert.equal(a.loadSavedDeck(saved.id).success, false, 'saved decks with cards missing from the library are rejected');
  assert.equal(JSON.stringify([a.state.deck, a.state.sideDeck, a.state.deckName]), snapshot);
  a.CARDS_DATA.push(removedCard);

  // Delete
  assert(a.deleteSavedDeck(second.id).success);
  assert.equal(a.deleteSavedDeck(second.id).success, false);
  assert.equal(decks().length, 1);

  // Storage failures are reported and never destroy or rename anything
  failWrites = true;
  a.addCardToDeck('b', 'main');
  const beforeName = a.state.deckName;
  const failedSave = a.saveCurrentDeck('Nuevo');
  assert.equal(failedSave.success, false); assert(failedSave.reason);
  assert.equal(a.state.deckName, beforeName, 'a failed save must not rename the deck');
  assert.equal(a.deleteSavedDeck(saved.id).success, false);
  failWrites = false;
  assert.equal(decks().length, 1);
  failReads = true;
  assert.equal(a.listSavedDecks().success, false);
  failReads = false;

  // Corrupt saved data is reported and left untouched
  store.set(SAVED_KEY, '{not json');
  assert.equal(a.listSavedDecks().success, false);
  assert.equal(a.saveCurrentDeck('Otro').success, false);
  assert.equal(store.get(SAVED_KEY), '{not json', 'corrupt data is never overwritten');
  assert.equal(a.loadSavedDeck(saved.id).success, false);
  assert.equal(a.deleteSavedDeck(saved.id).success, false);
  console.log(label + ': saved decks (save, overwrite, load, delete, atomic failures and storage errors) passed');
}
checkSavedDecks(bundle, 'Standalone bundle');
checkSavedDecks(['cardsData.js','state.js'].map(p=>fs.readFileSync(path.join(root,'js',p),'utf8').replace(/^import .*;\r?\n/gm,'').replace(/^export /gm,'')).join('\n'), 'Modules');

function checkPoolParser(source, label) {
  const ctx = vm.createContext({ document:{addEventListener(){}}, localStorage:{getItem(){return null},setItem(){}}, console });
  const api = 'globalThis.api = { CARDS_DATA, parsePoolCardFromPath };';
  vm.runInContext(source.includes('(function()') ? source.replace(/\}\)\(\);\s*$/, api+'})();') : source+'\n'+api, ctx);
  const a = ctx.api;
  const parse = a.parsePoolCardFromPath;

  // Standard card: type/rarity/element/stats/cost come from the filename
  const c1a = parse('SET-1/Alazul_Criatura_Epica_Neptuno_1_4_4.webp', 'data:a');
  assert.equal(c1a.name, 'Alazul');
  assert.equal(c1a.type, 'Criatura'); assert.equal(c1a.rarity, 'Epic'); assert.equal(c1a.element, 'neptuno');
  assert.equal(c1a.attack, 1); assert.equal(c1a.health, 4); assert.equal(c1a.cost, 4);
  assert.equal(c1a.source, 'SET-1/Alazul_Criatura_Epica_Neptuno_1_4_4.webp');
  assert.equal(c1a.isPool, true);
  assert(c1a.id.startsWith('pool_'));

  // Same path always yields the same id (stable across scans / restarts)
  const c1b = parse('SET-1/Alazul_Criatura_Epica_Neptuno_1_4_4.webp', 'data:b');
  assert.equal(c1a.id, c1b.id, 'the same path must produce the same id');
  // A different path (even a different set) yields a different id
  const c1c = parse('SET-2/Alazul_Criatura_Epica_Neptuno_1_4_4.webp', 'data:a');
  assert.notEqual(c1a.id, c1c.id);

  // Sello and Token formats
  const seal = parse('SET-3/Sello_Marte.webp', 'data:s');
  assert.equal(seal.type, 'Sello'); assert.equal(seal.rarity, null); assert.equal(seal.element, 'marte'); assert.equal(seal.cost, 0);
  const token = parse('SET-3/Token_GuerreroMarciano_Marte.webp', 'data:t');
  assert.equal(token.type, 'Token'); assert.equal(token.isToken, true); assert.equal(token.name, 'Guerrero Marciano');

  // catalogo-original.json enriches description/flavor but never overrides the filename-derived rules
  const enriched = parse('SET-6/¡Cuiden-el-nido!_HechizoLento_Epica_Tierra_0_0_4.webp', 'data:e',
    { name: '¡Cuiden el nido!', description: 'Texto real de la carta.', lore: 'Frase de ambientación real.' });
  assert.equal(enriched.name, '¡Cuiden el nido!');
  assert.equal(enriched.description, 'Texto real de la carta.');
  assert.equal(enriched.flavor, 'Frase de ambientación real.');
  assert.equal(enriched.type, 'HechizoLento', 'catalog data must not override the type the filename encodes');
  assert.equal(enriched.rarity, 'Epic');
  assert.equal(enriched.element, 'tierra');

  // Without a catalog match, generic text is used and nothing throws
  const plain = parse('SET-1/Comerciante-de-Bambu_Criatura_Epica_Jupiter_3_3_3.webp', 'data:p');
  assert(plain.description.length > 0); assert(plain.flavor.length > 0);

  console.log(label + ": pool filename parser (stable ids, seal/token formats, catalog enrichment) passed");
}
checkPoolParser(bundle, 'Standalone bundle');
checkPoolParser(['cardsData.js','poolManager.js'].map(p=>fs.readFileSync(path.join(root,'js',p),'utf8').replace(/^import .*;\r?\n/gm,'').replace(/^export /gm,'')).join('\n'), 'Modules');
