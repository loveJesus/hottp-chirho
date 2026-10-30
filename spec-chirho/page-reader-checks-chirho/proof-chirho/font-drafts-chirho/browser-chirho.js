// For God so loved the world, that he gave his only begotten Son, that whosoever believeth in him should not perish, but have everlasting life. — John 3:16 (KJV)
async (pageChirho,modeChirho,originChirho,passwordChirho,casesChirho=[])=>{
  if(!['http://127.0.0.1:5187','https://hottp-chirho.bible.systems','https://hottp-chirho.lovejesus.workers.dev'].includes(originChirho))throw new Error('Unexpected font proof origin');
  const localChirho=originChirho==='http://127.0.0.1:5187',checksChirho=[];
  if(modeChirho!=='verify-chirho'&&(!localChirho||passwordChirho!=='fixture-password-for-local-tests-only-chirho'))throw new Error('Confirmation/stale proof is disposable-local-only');
  const checkChirho=(conditionChirho,labelChirho)=>{if(!conditionChirho)throw new Error(labelChirho);checksChirho.push(labelChirho);};
  const eventsChirho=async()=>(await(await pageChirho.context().request.get(originChirho+'/api-chirho/events-chirho?limit-chirho=1000')).json()).eventsChirho;
  if(modeChirho==='stage-chirho'){
    await pageChirho.context().clearCookies();
    await pageChirho.goto(originChirho+'/volumes-chirho/5/pages-chirho/56');await pageChirho.getByLabel('Password',{exact:true}).fill(passwordChirho);await pageChirho.getByRole('button',{name:'Open reader',exact:true}).click();await pageChirho.waitForURL(originChirho+'/volumes-chirho/5/pages-chirho/56');
    await pageChirho.locator('.reading-line-chirho').filter({has:pageChirho.locator('[aria-label="Line 15"]')}).locator('.reading-token-chirho').nth(5).click();
    checkChirho((await pageChirho.locator('.inline-reading-chirho').inputValue())!=='כִּי־אָדָם לְעָמָל יוּלָּד','Local page starts with the raw font-code baseline');
    await pageChirho.locator('.inline-reading-chirho').fill('local retained draft chirho');checkChirho(await pageChirho.getByRole('button',{name:'Confirm & next →',exact:true}).isEnabled(),'Pre-update draft is confirmable against its raw source');
    return{mode_chirho:modeChirho,checks_chirho:checksChirho};
  }
  if(modeChirho==='stale-chirho'){
    const beforeChirho=await eventsChirho(),responseChirho=pageChirho.waitForResponse(responseChirho=>responseChirho.url().endsWith('/api-chirho/reading-confirmations-chirho')&&responseChirho.request().method()==='POST');
    await pageChirho.getByRole('button',{name:'Confirm & next →',exact:true}).click();checkChirho((await responseChirho).status()===409,'Stale raw-code tab refuses after the machine draft changes');
    checkChirho(await pageChirho.locator('.inline-reading-chirho').inputValue()==='local retained draft chirho','409 retains the local draft');checkChirho((await eventsChirho()).length===beforeChirho.length,'Stale confirmation creates no event');
    await pageChirho.waitForFunction(()=>!document.querySelector('.confirm-reading-chirho')?.disabled);await pageChirho.reload();checkChirho(await pageChirho.getByRole('button',{name:'Confirm & next →',exact:true}).isDisabled(),'Recovered stale draft stays held after reload');checkChirho(await pageChirho.locator('.inline-reading-chirho').inputValue()==='local retained draft chirho','Reload preserves the held draft');
    await pageChirho.getByRole('button',{name:'Discard draft',exact:true}).click();checkChirho(await pageChirho.locator('.inline-reading-chirho').inputValue()==='כִּי־אָדָם לְעָמָל יוּלָּד','Discard reveals the current decoded text, not a rebased draft');
    const savedPromiseChirho=pageChirho.waitForResponse(responseChirho=>responseChirho.url().endsWith('/api-chirho/reading-confirmations-chirho')&&responseChirho.request().method()==='POST');await pageChirho.getByRole('button',{name:'Confirm & next →',exact:true}).click();const savedChirho=await savedPromiseChirho;
    checkChirho(savedChirho.status()===200,'Fresh decoded text can be confirmed on the disposable fixture');const afterChirho=await eventsChirho();checkChirho(afterChirho.length===beforeChirho.length+1&&afterChirho.at(-1).reviewerChirho==='shared-reviewer-chirho','Local confirmation records one shared-account receipt');
    await pageChirho.waitForFunction(()=>document.querySelector('.reader-intro-chirho')?.textContent.includes('1 /')&&!document.querySelector('.confirm-reading-chirho')?.disabled);await pageChirho.reload();checkChirho((await pageChirho.locator('.reader-intro-chirho').innerText()).includes('1 /'),'Fresh local receipt remains recorded after reload');return{mode_chirho:modeChirho,checks_chirho:checksChirho,production_confirmations_chirho:0};
  }
  if(modeChirho!=='verify-chirho')throw new Error('Unknown font proof mode');
  const contextChirho=await pageChirho.context().browser().newContext({viewport:{width:1440,height:1000}}),viewerChirho=await contextChirho.newPage(),errorsChirho=[];viewerChirho.on('pageerror',errorChirho=>errorsChirho.push(errorChirho.message));
  try{
    for(const pathChirho of ['/api-chirho/events-chirho','/api-chirho/images-chirho?key-chirho=vol-5-chirho%2Fpage-0056-chirho%2Ffull-page-chirho.png'])checkChirho((await contextChirho.request.get(originChirho+pathChirho,{maxRedirects:0})).status()===401,'Unauthenticated content stays protected: '+pathChirho);
    await viewerChirho.goto(originChirho+'/volumes-chirho/5/pages-chirho/56');await viewerChirho.getByLabel('Password',{exact:true}).fill(passwordChirho);await viewerChirho.getByRole('button',{name:'Open reader',exact:true}).click();await viewerChirho.waitForURL(originChirho+'/volumes-chirho/5/pages-chirho/56');
    for(const caseChirho of casesChirho){
      const responseChirho=await viewerChirho.goto(`${originChirho}/volumes-chirho/5/pages-chirho/${caseChirho.page_chirho}`);checkChirho(responseChirho.status()===200&&responseChirho.headers()['cache-control']==='private, no-store',`5:${caseChirho.page_chirho} loads privately`);
      await viewerChirho.waitForFunction(()=>{const imageChirho=document.querySelector('img[alt="Scanned source page"]');return imageChirho?.complete&&imageChirho.naturalWidth>0;});
      checkChirho((await viewerChirho.locator('.reader-intro-chirho').innerText()).includes('0 /'),`5:${caseChirho.page_chirho} machine drafts are not human-confirmed`);
      const tokenChirho=viewerChirho.getByRole('button',{name:caseChirho.text_chirho,exact:true}).first();checkChirho(await tokenChirho.isVisible(),`5:${caseChirho.page_chirho} renders decoded Unicode`);await tokenChirho.click();
      checkChirho(await viewerChirho.locator('.inline-reading-chirho').inputValue()===caseChirho.text_chirho,`5:${caseChirho.page_chirho} decoded Unicode is editable`);checkChirho(await viewerChirho.getByRole('button',{name:'Confirm & next →',exact:true}).isEnabled(),`5:${caseChirho.page_chirho} supports normal source-match review`);
      const boxChirho=await viewerChirho.locator('.scan-box-chirho.chosen-chirho').evaluate(elementChirho=>({x_chirho:parseFloat(elementChirho.style.left),y_chirho:parseFloat(elementChirho.style.top),width_chirho:parseFloat(elementChirho.style.width),height_chirho:parseFloat(elementChirho.style.height)}));
      const imageChirho=await viewerChirho.getByAltText('Scanned source page',{exact:true}).evaluate(elementChirho=>({width_chirho:elementChirho.naturalWidth,height_chirho:elementChirho.naturalHeight}));
      checkChirho(['x_chirho','width_chirho'].every(keyChirho=>Math.abs(boxChirho[keyChirho]*imageChirho.width_chirho/100-caseChirho.box_chirho[keyChirho])<0.01)&&['y_chirho','height_chirho'].every(keyChirho=>Math.abs(boxChirho[keyChirho]*imageChirho.height_chirho/100-caseChirho.box_chirho[keyChirho])<0.01),`5:${caseChirho.page_chirho} keeps the original native-pixel scan box`);
    }
    await viewerChirho.setViewportSize({width:390,height:844});checkChirho(await viewerChirho.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'Decoded reading fits the mobile viewport');checkChirho(errorsChirho.length===0,'Zero font-proof browser errors');
    return{verified_at_chirho:new Date().toISOString(),origin_chirho:originChirho,checks_chirho:checksChirho,assertions_chirho:checksChirho.length,production_confirmations_chirho:0};
  }finally{await contextChirho.close();}
}
