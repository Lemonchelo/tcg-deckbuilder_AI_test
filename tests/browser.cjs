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
 console.log('Upload submitted');
 try { await page.waitForFunction(()=>document.querySelector('#total-card-count').textContent==='445',null,{timeout:60000}); }
 catch(error) { console.log(await page.locator('body').innerText()); console.log(errors); throw error; }
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
 assert.equal(await page.locator('#total-card-count').textContent(),'445');
 await page.locator('#btn-confirm-import-close').click();
 await page.reload({waitUntil:'domcontentloaded'});
 await page.waitForFunction(()=>document.querySelector('#total-card-count').textContent==='445');
 assert.equal(await page.locator('#deck-total-count').textContent(),'1');
 await page.locator('#library-grid .tcg-card-wrapper').nth(1).dragTo(page.locator('#deck-dropzone'));
 assert.equal(await page.locator('#deck-total-count').textContent(),'2','dragging a library card to the deck still adds it');
 await page.locator('#library-grid .tcg-card-wrapper').first().click();
 await page.waitForFunction(()=>getComputedStyle(document.querySelector('#modal-card-inspector')).opacity==='1');
 if (process.env.SCREENSHOT_PATH) await page.screenshot({path:process.env.SCREENSHOT_PATH});
 await page.keyboard.press('Escape');
 const seal=await page.evaluate(()=>new Promise((resolve,reject)=>{
   const request=indexedDB.open('AetheriumTCG_CustomCardsDB',2);
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
   const request=indexedDB.open('AetheriumTCG_CustomCardsDB',2);
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
 assert.deepEqual(errors,[]);
 console.log('Browser file://: 464 imports, 445 non-token cards, all 3 close methods, click inspects / right click and drag add, main/side/extra decks fit the window without scrolling, node reuse, duplicate prevention, reload persistence and no JS errors passed.');
 } finally {await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1});
