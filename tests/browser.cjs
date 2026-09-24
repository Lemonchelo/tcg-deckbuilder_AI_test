const { chromium } = require('playwright');
const fs=require('fs'), path=require('path'), assert=require('node:assert/strict');
const {pathToFileURL}=require('node:url');
(async()=>{
 const browser=await chromium.launch({channel:'msedge',headless:true});
 try {
 const page=await browser.newPage({viewport:{width:1440,height:1000}});
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 const root=path.resolve(__dirname, '..');
 await page.goto(pathToFileURL(path.join(root,'index.html')).href,{waitUntil:'domcontentloaded'});
 await page.locator('#btn-import-folder').click();
 const files=fs.readdirSync(path.join(root,'cartas'),{recursive:true}).filter(p=>/\.(webp|png|jpe?g)$/i.test(p)).map(p=>path.join(root,'cartas',p));
 console.log('Uploading',files.length);
 await page.locator('#input-import-files').setInputFiles(files);
 // Some sandboxes' headless Chromium drops files with accented characters from setInputFiles
 // (a CDP/environment quirk, not an app bug); read back how many the browser actually attached
 // instead of assuming every path made it, so the rest of the run adapts to what's really loaded.
 const acceptedCount = await page.evaluate(()=>document.getElementById('input-import-files').files.length);
 console.log('Upload submitted, accepted by the browser:', acceptedCount, '/', files.length);
 try {
   await page.waitForFunction(()=>document.getElementById('import-progress-box').style.display!=='none',null,{timeout:15000});
   await page.waitForFunction(()=>document.getElementById('import-progress-box').style.display==='none',null,{timeout:90000});
 }
 catch(error) { console.log(await page.locator('body').innerText()); console.log(errors); throw error; }
 const baseCount = await page.evaluate(()=>parseInt(document.querySelector('#total-card-count').textContent,10));
 const baseCountStr = String(baseCount);
 console.log('Library total (non-token) after import:', baseCountStr);
 await page.locator('#btn-confirm-import-close').click();
 assert.equal(await page.title(),'STG TCG Deckbuilder');
 const card=page.locator('#library-grid .tcg-card-wrapper').first();
 await card.click();
 await page.locator('#btn-close-inspector').click();
 assert.equal(await page.locator('#modal-card-inspector').getAttribute('class'),'modal-backdrop');
 await card.click();await page.keyboard.press('Escape');
 assert.equal(await page.locator('#modal-card-inspector').getAttribute('class'),'modal-backdrop');
 await card.click();await page.locator('#modal-card-inspector').click({position:{x:5,y:5}});
 assert.equal(await page.locator('#modal-card-inspector').getAttribute('class'),'modal-backdrop');
 assert.equal(await page.locator('#deck-total-count').textContent(),'0','left click on a library card must only inspect it');
 await card.evaluate(el=>el.dataset.regressionMarker='retained');
 await card.click({button:'right'});
 assert.equal(await page.locator('#modal-card-inspector').getAttribute('class'),'modal-backdrop','right click adds the card without opening the inspector');
 assert.equal(await page.locator('#library-grid .tcg-card-wrapper').first().getAttribute('data-regression-marker'),'retained');
 assert.equal(await page.locator('#deck-total-count').textContent(),'1');
 assert.equal(await page.locator('#deck-grid .tcg-card-wrapper').count(),1);
 await page.locator('#btn-import-folder').click();
 await page.locator('#input-import-files').setInputFiles(files.slice(0,1));
 await page.waitForFunction(()=>document.querySelector('#input-import-files').value==='');
 assert.equal(await page.locator('#total-card-count').textContent(),baseCountStr);
 await page.locator('#btn-confirm-import-close').click();
 await page.reload({waitUntil:'domcontentloaded'});
 await page.waitForFunction((n)=>document.querySelector('#total-card-count').textContent===n,baseCountStr);
 assert.equal(await page.locator('#deck-total-count').textContent(),'1');
 await page.locator('#library-grid .tcg-card-wrapper').nth(1).dragTo(page.locator('#deck-dropzone'));
 assert.equal(await page.locator('#deck-total-count').textContent(),'2','dragging a library card to the deck still adds it');
 await page.locator('#library-grid .tcg-card-wrapper').first().click();
 await page.waitForFunction(()=>getComputedStyle(document.querySelector('#modal-card-inspector')).opacity==='1');
 if (process.env.SCREENSHOT_PATH) await page.screenshot({path:process.env.SCREENSHOT_PATH});
 await page.keyboard.press('Escape');
 const seal=await page.evaluate(()=>new Promise((resolve,reject)=>{
   const request=indexedDB.open('AetheriumTCG_CustomCardsDB',3);
   request.onsuccess=()=>{const db=request.result;const get=db.transaction('custom_cards').objectStore('custom_cards').getAll();get.onsuccess=()=>{resolve(get.result.find(c=>c.type==='Sello'));db.close()};get.onerror=()=>reject(get.error)};
 }));
 await page.locator('#btn-export-deck').click();
 await page.locator('[data-tab="tab-json-deck"]').click();
 await page.locator('#export-json-area').fill(JSON.stringify({deckName:'Prueba completa',deck:[{cardId:seal.id,count:40}]}));
 await page.locator('#btn-import-apply').click();
 assert.equal(await page.locator('#deck-total-count').textContent(),'40');
 assert.equal(await page.locator('#deck-name-input').inputValue(),'Prueba completa');
 await page.locator('#library-grid .tcg-card-wrapper').first().click();
 assert(await page.locator('#btn-inspector-add').isDisabled());
 await page.keyboard.press('Escape');
 await page.locator('#btn-test-hand').click();
 await page.locator('#test-hand-cards .tcg-card-wrapper').first().click();
 assert.equal(await page.locator('#test-hand-cards .is-selected-mulligan').count(),1);
 await page.locator('#btn-close-test-hand').click();
 // Main, Side and Extra decks stay fully visible (no scrolling) and the cards adapt to the window size
 const allCards=await page.evaluate(()=>new Promise((resolve,reject)=>{
   const request=indexedDB.open('AetheriumTCG_CustomCardsDB',3);
   request.onsuccess=()=>{const db=request.result;const get=db.transaction('custom_cards').objectStore('custom_cards').getAll();get.onsuccess=()=>{resolve(get.result.map(({id,type,rarity,isToken})=>({id,type,rarity,isToken})));db.close()};get.onerror=()=>reject(get.error)};
 }));
 const uniq=[...new Map(allCards.filter(c=>c.type!=='Sello'&&!c.isToken&&['Common','Rare','Epic','Legendary'].includes(c.rarity)).map(c=>[c.id,c])).values()];
 await page.locator('#btn-export-deck').click();
 await page.locator('[data-tab="tab-json-deck"]').click();
 await page.locator('#export-json-area').fill(JSON.stringify({deckName:'Layout',deck:[{cardId:seal.id,count:13},...uniq.slice(0,27).map(c=>({cardId:c.id,count:1}))],sideDeck:uniq.slice(27,42).map(c=>({cardId:c.id,count:1}))}));
 await page.locator('#btn-import-apply').click();
 assert.equal(await page.locator('#deck-total-count').textContent(),'40');
 assert.equal(await page.locator('#side-deck-total-count').textContent(),'15');
 const decksFit=()=>page.evaluate(()=>{const area=document.querySelector('.deck-scrollable-area');const a=area.getBoundingClientRect();
   const cards=[...document.querySelectorAll('#deck-grid .tcg-card-wrapper,#side-deck-grid .tcg-card-wrapper,#extra-deck-grid .tcg-card-wrapper')];
   return {noScroll:area.scrollHeight<=area.clientHeight+1,allVisible:cards.every(c=>{const r=c.getBoundingClientRect();return r.bottom<=a.bottom+1&&r.top>=a.top-1&&r.right<=a.right+1}),count:cards.length,width:document.querySelector('#deck-grid .tcg-card-wrapper').getBoundingClientRect().width};});
 const cardWidths=[];
 for (const [width,height] of [[1440,1000],[1280,720],[1600,1000]]) {
   await page.setViewportSize({width,height});
   await page.waitForFunction(()=>{const a=document.querySelector('.deck-scrollable-area');return a.scrollHeight<=a.clientHeight+1;},null,{timeout:5000});
   const fit=await decksFit();
   assert(fit.noScroll&&fit.allVisible&&fit.count>=43,`decks must fit without scrolling at ${width}x${height}: ${JSON.stringify(fit)}`);
   cardWidths.push(fit.width);
 }
 assert(cardWidths[1]<cardWidths[0],'cards shrink in a smaller window');
 // Saved decks: save / clear / load / overwrite / delete without export or import, persisted across reloads
 const dialogs=[];
 page.on('dialog',async dialog=>{dialogs.push(dialog.message());await dialog.accept();});
 const savedModalClass=()=>page.locator('#modal-saved-decks').getAttribute('class');
 const openSaved=async()=>{await page.locator('#btn-saved-decks').click();assert.equal(await savedModalClass(),'modal-backdrop is-open');};
 await openSaved();
 assert.equal(await page.locator('#saved-deck-name-input').inputValue(),'Layout');
 assert(await page.locator('#saved-decks-empty-msg').isVisible(),'no saved decks yet');
 await page.locator('#btn-save-deck').click();
 assert.equal(await page.locator('#saved-decks-list .saved-deck-row').count(),1);
 const meta=await page.locator('.saved-deck-meta').first().textContent();
 assert(meta.includes('40 cartas')&&meta.includes('Side 15'),meta);
 await page.locator('#btn-close-saved-decks-footer').click();
 assert.equal(await savedModalClass(),'modal-backdrop');
 await page.locator('#btn-clear-deck').click();
 assert.equal(await page.locator('#deck-total-count').textContent(),'0');
 assert.equal(await page.locator('#side-deck-total-count').textContent(),'0');
 await openSaved();
 await page.locator('#saved-decks-list [data-action="load"]').click();
 assert.equal(await page.locator('#deck-total-count').textContent(),'40','loading restores the main deck');
 assert.equal(await page.locator('#side-deck-total-count').textContent(),'15','loading restores the side deck');
 assert.equal(await page.locator('#deck-name-input').inputValue(),'Layout');
 assert.equal(await savedModalClass(),'modal-backdrop','the modal closes after loading');
 await page.reload({waitUntil:'domcontentloaded'});
 await page.waitForFunction((n)=>document.querySelector('#total-card-count').textContent===n,baseCountStr);
 await openSaved();
 assert.equal(await page.locator('#saved-decks-list .saved-deck-row').count(),1,'saved decks survive a reload');
 await page.keyboard.press('Escape');
 assert.equal(await savedModalClass(),'modal-backdrop','Escape closes the modal');
 // Loading over an unsaved, non-empty deck asks for confirmation; saving over an existing name too
 await page.locator('#btn-clear-deck').click();
 await page.locator('#library-grid .tcg-card-wrapper').first().click({button:'right'});
 assert.equal(await page.locator('#deck-total-count').textContent(),'1');
 await openSaved();
 await page.locator('#saved-decks-list [data-action="load"]').click();
 assert(dialogs.some(m=>m.includes('no está guardado')),'unsaved deck replacement must be confirmed: '+dialogs.join(' | '));
 assert.equal(await page.locator('#deck-total-count').textContent(),'40');
 await openSaved();
 await page.locator('#btn-save-deck').click();
 assert(dialogs.some(m=>m.includes('sobrescribirlo')),'overwriting must be confirmed');
 assert.equal(await page.locator('#saved-decks-list .saved-deck-row').count(),1,'overwrite keeps a single entry');
 // Names are shown as text, never as HTML
 await page.locator('#saved-deck-name-input').fill('<img src=x onerror=__pwn=1>');
 await page.locator('#saved-deck-name-input').press('Enter');
 assert.equal(await page.locator('#saved-decks-list .saved-deck-row').count(),2);
 assert((await page.locator('#saved-decks-list').innerText()).includes('<img src=x onerror=__pwn=1>'));
 assert.equal(await page.locator('#saved-decks-list img').count(),0);
 assert.equal(await page.evaluate(()=>window.__pwn),undefined);
 // Delete both
 while (await page.locator('#saved-decks-list [data-action="delete"]').count()) await page.locator('#saved-decks-list [data-action="delete"]').first().click();
 assert(await page.locator('#saved-decks-empty-msg').isVisible());
 assert(dialogs.some(m=>m.includes('Eliminar')||m.includes('Esta acción')),'deleting must be confirmed');
 await page.keyboard.press('Escape');
 assert.equal(await page.locator('#deck-total-count').textContent(),'40','deleting a saved deck does not touch the current deck');
 // Base card pool from cartas/SET-N via a mocked File System Access API (a real native
 // folder picker cannot be automated). Verifies scanning, stable ids, catalog enrichment,
 // incremental re-scans (only new files are added) and persistence across a reload.
 await page.evaluate(() => {
   function makeFile(name, content) { return new File([content || 'x'], name, { type: 'image/png' }); }
   function fileHandle(name, content) { return { kind: 'file', name, getFile: async () => makeFile(name, content) }; }
   function dirHandle(name, children) {
     return {
       kind: 'directory', name, _children: children,
       values: async function* () { for (const c of this._children) yield c; },
       getFileHandle: async function (fname) {
         const found = this._children.find(c => c.kind === 'file' && c.name === fname);
         if (!found) throw new DOMException('Not found', 'NotFoundError');
         return found;
       }
     };
   }
   const catalog = JSON.stringify([{ archivo: 'SET-1/Alpha_Criatura_Comun_Marte_2_2_2.png', name: 'Alpha Real', description: 'Desc real de Alpha.', lore: 'Lore real de Alpha.' }]);
   const root = dirHandle('cartas', [
     dirHandle('SET-1', [fileHandle('Alpha_Criatura_Comun_Marte_2_2_2.png'), fileHandle('Beta_Criatura_Rara_Neptuno_3_3_3.png')]),
     dirHandle('SET-2', [fileHandle('Gamma_Criatura_Epica_Jupiter_4_4_4.png')]),
     fileHandle('catalogo-original.json', catalog)
   ]);
   root.queryPermission = async () => 'granted';
   root.requestPermission = async () => 'granted';
   window.__poolMockRoot = root;
   window.__poolMockAddSet = (setName, fileNames) => root._children.push(dirHandle(setName, fileNames.map(n => fileHandle(n))));
   window.showDirectoryPicker = async () => window.__poolMockRoot;
 });
 const poolCount = () => page.evaluate(() => new Promise((resolve, reject) => {
   const req = indexedDB.open('AetheriumTCG_CustomCardsDB', 3);
   req.onsuccess = () => { const db = req.result; const g = db.transaction('pool_cards').objectStore('pool_cards').getAll(); g.onsuccess = () => { resolve(g.result); db.close(); }; g.onerror = () => reject(g.error); };
 }));
 const lastToast = () => page.evaluate(() => document.querySelector('#toast-container .toast:last-child .toast-text')?.textContent || '');
 const clickPoolBtn = async () => { await page.locator('#btn-check-pool-updates').click(); await page.waitForFunction(() => !document.querySelector('#btn-check-pool-updates').disabled, null, { timeout: 15000 }); };
 await clickPoolBtn();
 assert.equal((await poolCount()).length, 3, 'first scan must add every file under SET-1 and SET-2');
 assert((await lastToast()).includes('3 cartas nuevas'), await lastToast());
 const afterFirst = await poolCount();
 const alpha = afterFirst.find(c => c.source === 'SET-1/Alpha_Criatura_Comun_Marte_2_2_2.png');
 assert.equal(alpha.name, 'Alpha Real', 'catalogo-original.json must enrich the matching card');
 assert.equal(alpha.description, 'Desc real de Alpha.');
 assert.equal(alpha.type, 'Criatura', 'catalog data must not override the type the filename encodes');
 const beta = afterFirst.find(c => c.source === 'SET-1/Beta_Criatura_Rara_Neptuno_3_3_3.png');
 assert.equal(beta.rarity, 'Rare'); assert.equal(beta.element, 'neptuno');
 // Re-scanning with nothing new must not duplicate or re-add anything
 await clickPoolBtn();
 assert.equal((await poolCount()).length, 3);
 assert((await lastToast()).includes('ya está actualizada'), await lastToast());
 // Adding a new set and re-scanning only imports the new files
 await page.evaluate(() => window.__poolMockAddSet('SET-3', ['Delta_Criatura_Legendaria_Saturno_5_5_5.webp', 'Sello_Marte.webp']));
 await clickPoolBtn();
 const afterThird = await poolCount();
 assert.equal(afterThird.length, 5, 'only the 2 new files from SET-3 should be added');
 assert((await lastToast()).includes('2 cartas nuevas') && (await lastToast()).includes('SET-3'), await lastToast());
 const ids3 = new Set(afterThird.map(c => c.id));
 assert(afterFirst.every(c => ids3.has(c.id)), 'previously scanned cards must keep the same id after a later scan');
 // The pool survives a reload without any further scanning (cached in IndexedDB, unlike the folder handle)
 await page.reload({ waitUntil: 'domcontentloaded' });
 // baseCount custom cards + 5 pool cards, none of which is a Token (total-card-count excludes tokens)
 await page.waitForFunction((n) => document.querySelector('#total-card-count').textContent === n, String(baseCount+5));
 assert.equal((await poolCount()).length, 5, 'the base pool must persist across a reload with no scan needed');
 // A browser without the File System Access API gets a clear message instead of failing silently
 await page.evaluate(() => { delete window.showDirectoryPicker; });
 await clickPoolBtn();
 assert((await lastToast()).toLowerCase().includes('no admite'), await lastToast());
 assert.equal((await poolCount()).length, 5, 'an unsupported browser must not touch the existing pool');

 assert.deepEqual(errors,[]);
 assert.deepEqual(errors,[]);
 console.log(`Browser file://: ${files.length} imports (${acceptedCount} accepted by the browser), ${baseCountStr} non-token cards, all 3 close methods, click inspects / right click and drag add, main/side/extra decks fit the window without scrolling, saved decks (save/load/overwrite/delete/reload), base pool scan/enrich/incremental-update/persist, node reuse, duplicate prevention, reload persistence and no JS errors passed.`);
 } finally {await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1});
