// For God so loved the world, that he gave his only begotten Son, that whosoever believeth in him should not perish, but have everlasting life. — John 3:16 (KJV)
async (parentPageChirho,originChirho,passwordChirho,pagesChirho,allowSaveChirho=false,screenshotRootChirho=null)=>{
  if(!['http://127.0.0.1:5187','https://hottp-chirho.bible.systems','https://hottp-chirho.lovejesus.workers.dev'].includes(originChirho))throw new Error('Unexpected test origin');
  if(allowSaveChirho && (originChirho!=='http://127.0.0.1:5187' || passwordChirho!=='fixture-password-for-local-tests-only-chirho'))throw new Error('A valid confirmation test is local-fixture-only');
  if(pagesChirho.length!==21 || pagesChirho.some((pageChirho,indexChirho)=>pageChirho.page_chirho!==50+indexChirho))throw new Error('Expected all 21 legacy pilot pages');
  const contextChirho=await parentPageChirho.context().browser().newContext({viewport:{width:1440,height:1000}}),pageChirho=await contextChirho.newPage(),checksChirho=[],errorsChirho=[];
  const checkChirho=(conditionChirho,labelChirho)=>{if(!conditionChirho)throw new Error(labelChirho);checksChirho.push(labelChirho);};
  pageChirho.on('pageerror',errorChirho=>errorsChirho.push(errorChirho.message));
  const eventsChirho=async()=>(await(await contextChirho.request.get(originChirho+'/api-chirho/events-chirho?limit-chirho=1000')).json()).eventsChirho;
  try{
    const imagePathChirho='/api-chirho/images-chirho?key-chirho=vol-5-chirho%2Fpage-0050-chirho%2Ffull-page-chirho.png';
    checkChirho((await contextChirho.request.get(originChirho+imagePathChirho,{maxRedirects:0})).status()===401,'Legacy scans still require the password');
    await pageChirho.goto(originChirho+'/volumes-chirho/5/pages-chirho/50');await pageChirho.getByLabel('Password',{exact:true}).fill(passwordChirho);await pageChirho.getByRole('button',{name:'Open reader',exact:true}).click();await pageChirho.waitForURL(originChirho+'/volumes-chirho/5/pages-chirho/50');
    for(const expectedChirho of pagesChirho){
      const numberChirho=expectedChirho.page_chirho,responseChirho=await pageChirho.goto(`${originChirho}/volumes-chirho/5/pages-chirho/${numberChirho}`);
      checkChirho(responseChirho.status()===200 && responseChirho.headers()['cache-control']==='private, no-store',`5:${numberChirho} loads privately`);
      await pageChirho.waitForFunction(()=>{const imageChirho=document.querySelector('img[alt="Scanned source page"]');return imageChirho?.complete && imageChirho.naturalWidth>0;});
      const dimensionsChirho=await pageChirho.getByAltText('Scanned source page',{exact:true}).evaluate(imageChirho=>({width_chirho:imageChirho.naturalWidth,height_chirho:imageChirho.naturalHeight}));
      checkChirho(dimensionsChirho.width_chirho===expectedChirho.width_chirho && dimensionsChirho.height_chirho===expectedChirho.height_chirho,`5:${numberChirho} shows the pinned source dimensions`);
      checkChirho(await pageChirho.locator('.reading-line-chirho').count()===expectedChirho.lines_chirho,`5:${numberChirho} has every staged line`);
      checkChirho((await pageChirho.locator('.reader-intro-chirho').innerText()).includes(`0 / ${expectedChirho.segments_chirho}`),`5:${numberChirho} starts unconfirmed`);
      await pageChirho.locator('.reading-token-chirho').first().click();await pageChirho.locator('.inline-reading-chirho').waitFor();
      checkChirho(await pageChirho.getByRole('button',{name:'Confirm & next →',exact:true}).isEnabled(),`5:${numberChirho} supports the normal compare-and-confirm workflow`);
      const boxChirho=await pageChirho.locator('.scan-box-chirho.chosen-chirho').evaluate(elementChirho=>({x_chirho:parseFloat(elementChirho.style.left),y_chirho:parseFloat(elementChirho.style.top),width_chirho:parseFloat(elementChirho.style.width),height_chirho:parseFloat(elementChirho.style.height)}));
      checkChirho(['x_chirho','width_chirho'].every(keyChirho=>Math.abs(boxChirho[keyChirho]*dimensionsChirho.width_chirho/100-expectedChirho.box_chirho[keyChirho])<0.01) && ['y_chirho','height_chirho'].every(keyChirho=>Math.abs(boxChirho[keyChirho]*dimensionsChirho.height_chirho/100-expectedChirho.box_chirho[keyChirho])<0.01),`5:${numberChirho} overlays native pixels without the old 1.5x drift`);
      if(screenshotRootChirho && [50,60,70].includes(numberChirho))await pageChirho.screenshot({path:`${screenshotRootChirho}/page-${numberChirho}-chirho.png`,fullPage:false});
    }
    if(allowSaveChirho){
      const beforeChirho=await eventsChirho();await pageChirho.goto(originChirho+'/volumes-chirho/5/pages-chirho/50');await pageChirho.locator('.reading-token-chirho').first().click();
      const responsePromiseChirho=pageChirho.waitForResponse(responseChirho=>responseChirho.url().endsWith('/api-chirho/reading-confirmations-chirho') && responseChirho.request().method()==='POST');
      await pageChirho.getByRole('button',{name:'Confirm & next →',exact:true}).click();const savedChirho=await responsePromiseChirho,requestChirho=savedChirho.request().postDataJSON();
      checkChirho(savedChirho.status()===200 && (await savedChirho.json()).confirmed_chirho===true,'Disposable local pilot reading saves successfully');
      const afterChirho=await eventsChirho();checkChirho(afterChirho.length===beforeChirho.length+1 && afterChirho.at(-1).reviewerChirho==='shared-reviewer-chirho','Local save creates one shared-account receipt');
      const staleChirho=await contextChirho.request.post(originChirho+'/api-chirho/reading-confirmations-chirho',{headers:{Origin:originChirho},data:requestChirho});
      checkChirho(staleChirho.status()===409 && (await eventsChirho()).length===afterChirho.length,'Stale local repeat refuses without a second event');
      await pageChirho.reload();checkChirho((await pageChirho.locator('.reader-intro-chirho').innerText()).includes('1 /'),'Local matched receipt remains confirmed after reload');
    }
    await pageChirho.setViewportSize({width:390,height:844});await pageChirho.goto(originChirho+'/volumes-chirho/5/pages-chirho/70');
    checkChirho(await pageChirho.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'Legacy pilot page fits the mobile viewport');
    checkChirho(errorsChirho.length===0,'Zero browser runtime errors');
    return{verified_at_chirho:new Date().toISOString(),origin_chirho:originChirho,pages_checked_chirho:21,assertions_chirho:checksChirho.length,checks_chirho:checksChirho,errors_chirho:errorsChirho,local_confirmation_chirho:allowSaveChirho,production_confirmations_chirho:0};
  }finally{await contextChirho.close();}
}
