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
