// For God so loved the world, that he gave his only begotten Son, that whosoever believeth in him should not perish, but have everlasting life. — John 3:16 (KJV)
async (parentPageChirho, passwordChirho, samplesChirho = [[1,1],[1,400],[1,812],[2,1],[2,600],[2,1106],[3,1],[3,1061],[3,1418],[4,1],[4,500],[4,990],[5,1],[5,500],[5,1009]], screenshotRootChirho = null) => {
  if (!passwordChirho) throw new Error('Runtime password required');
  const checksChirho = [], pagesChirho = [], errorsChirho = [];
  const checkChirho = (conditionChirho, labelChirho) => { if (!conditionChirho) throw new Error(labelChirho); checksChirho.push(labelChirho); };
  const contextChirho = await parentPageChirho.context().browser().newContext({viewport:{width:1440,height:1000}});
  const pageChirho = await contextChirho.newPage();
  pageChirho.on('pageerror', errorChirho => errorsChirho.push(errorChirho.message));
  const originChirho = 'https://hottp-chirho.bible.systems';
  try {
    const directChirho = await contextChirho.request.get(originChirho + '/api-chirho/images-chirho?key-chirho=vol-1-chirho%2Fpage-0001-chirho%2Ffull-page-chirho.png', {maxRedirects:0});
    checkChirho(directChirho.status() === 401, 'New corpus images require the password');
    await pageChirho.goto(originChirho + '/');
    await pageChirho.getByLabel('Password',{exact:true}).fill(passwordChirho);
    await pageChirho.getByRole('button',{name:'Open reader',exact:true}).click();
    await pageChirho.waitForURL(originChirho + '/');
    const homeCountsChirho = await pageChirho.locator('.volume-card-chirho .stat-value-chirho').allTextContents();
    // A bounded smoke can run while publication progresses. The final run
    // includes all 15 samples and proves the full five-volume dashboard.
    if (samplesChirho.length === 15) checkChirho(JSON.stringify(homeCountsChirho.filter((valueChirho,indexChirho)=>indexChirho%2===0).map(Number)) === JSON.stringify([812,1106,1418,990,1009]), 'Dashboard shows all 5335 pages in five volumes');
    for (const [volumeChirho, numberChirho] of samplesChirho) {
      const responseChirho = await pageChirho.goto(`${originChirho}/volumes-chirho/${volumeChirho}/pages-chirho/${numberChirho}`);
      checkChirho(responseChirho.status() === 200 && responseChirho.headers()['cache-control'] === 'private, no-store', `Page ${volumeChirho}:${numberChirho} loads privately`);
      await pageChirho.getByRole('heading',{name:`Page ${numberChirho}`,exact:true}).waitFor();
      const imageChirho = pageChirho.getByAltText('Scanned source page',{exact:true});
      await imageChirho.waitFor();
      await pageChirho.waitForFunction(() => { const imageChirho = document.querySelector('img[alt="Scanned source page"]'); return imageChirho?.complete && imageChirho.naturalWidth > 0; });
      const dimensionsChirho = await imageChirho.evaluate(elementChirho => ({width_chirho:elementChirho.naturalWidth,height_chirho:elementChirho.naturalHeight}));
      checkChirho(dimensionsChirho.width_chirho > 0 && dimensionsChirho.height_chirho > 0, `Scan ${volumeChirho}:${numberChirho} decoded`);
      const linesChirho = await pageChirho.locator('.reading-line-chirho').count();
      checkChirho((await pageChirho.locator('.reader-intro-chirho').innerText()).includes('0 /'), `New page ${volumeChirho}:${numberChirho} is not human-confirmed`);
      if (await pageChirho.locator('.reading-token-chirho').count()) {
        await pageChirho.locator('.reading-token-chirho').first().click();
        await pageChirho.locator('.inline-reading-chirho').waitFor();
        checkChirho(!(await pageChirho.locator('.review-evidence-chirho').innerText()).includes('Human-confirmed'), `Selection ${volumeChirho}:${numberChirho} remains unverified`);
        // Selection and focus only. Never click Confirm, edit text or mutate
        // production to prove the upload; source-match saves are tested locally.
      }
      pagesChirho.push({volume_chirho:volumeChirho,page_chirho:numberChirho,lines_chirho:linesChirho,...dimensionsChirho});
      if (screenshotRootChirho && numberChirho === samplesChirho.filter(sampleChirho => sampleChirho[0] === volumeChirho)[1]?.[1]) {
        await pageChirho.screenshot({path:`${screenshotRootChirho}/volume-${volumeChirho}-page-${numberChirho}-chirho.png`,fullPage:false});
      }
    }
    if (samplesChirho.length === 15) {
      await pageChirho.setViewportSize({width:390,height:844});
      await pageChirho.goto(originChirho + '/volumes-chirho/5/pages-chirho/500');
      checkChirho(await pageChirho.evaluate(()=>document.documentElement.scrollWidth <= innerWidth + 1), 'Loaded vol-5 page fits mobile viewport');
      const jumpChirho = await contextChirho.request.get(originChirho + '/find-chirho?q-chirho=3%3A1061',{maxRedirects:0});
      checkChirho([302,303,307,308].includes(jumpChirho.status()) && jumpChirho.headers().location === '/volumes-chirho/3/pages-chirho/1061', 'PDF-page jump resolves a newly loaded page');
      const windowChirho = await contextChirho.request.get(originChirho + '/volumes-chirho/3?from-chirho=1000');
      checkChirho(windowChirho.status() === 200 && (await windowChirho.text()).includes('/pages-chirho/1000'), 'Deep catalog window loads after full corpus ingestion');
      const exportChirho = await contextChirho.request.get(originChirho + '/api-chirho/export-chirho?volume-chirho=3&from-chirho=1061&to-chirho=1061');
      checkChirho(exportChirho.status() === 200 && (await exportChirho.text()).includes('unverified-export-chirho'), 'New page exports only as a scoped unverified reading');
    }
    const secondOriginChirho = 'https://hottp-chirho.lovejesus.workers.dev';
    const blockedChirho = await contextChirho.request.get(secondOriginChirho + '/api-chirho/images-chirho?key-chirho=vol-5-chirho%2Fpage-0500-chirho%2Ffull-page-chirho.png',{maxRedirects:0});
    checkChirho(blockedChirho.status() === 401, 'workers.dev does not bypass the password');
    checkChirho(errorsChirho.length === 0, 'Zero browser runtime errors');
    return {verified_at_chirho:new Date().toISOString(),assertions_chirho:checksChirho.length,checks_chirho:checksChirho,pages_chirho:pagesChirho,errors_chirho:errorsChirho,successful_content_writes_chirho:0};
  } finally { await contextChirho.close(); }
}
