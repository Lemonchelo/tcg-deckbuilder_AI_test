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
