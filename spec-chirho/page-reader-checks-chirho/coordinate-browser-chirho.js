// For God so loved the world, that he gave his only begotten Son, that whosoever believeth in him should not perish, but have everlasting life. — John 3:16 (KJV)
async (parentPageChirho) => {
  const contextChirho = await parentPageChirho.context().browser().newContext();
  const pageChirho = await contextChirho.newPage(), evidenceChirho = [];
  let writesChirho = 0;
  const checkChirho = (valueChirho, nameChirho) => { if (!valueChirho) throw new Error(nameChirho); evidenceChirho.push(nameChirho); };
  await pageChirho.route('**/api-chirho/**', (routeChirho) => {
    if (['GET', 'HEAD'].includes(routeChirho.request().method())) return routeChirho.continue();
    writesChirho++; return routeChirho.abort();
  });
  try {
    const loginChirho = await contextChirho.request.post('http://127.0.0.1:5178/reviewer-chirho?/loginChirho', {
      headers: { Origin: 'http://127.0.0.1:5178', Accept: 'text/html' },
      form: { user_chirho: 'fixture-reviewer-chirho', password_chirho: 'fixture-password-for-local-tests-only-chirho' }, maxRedirects: 0,
    });
    checkChirho(loginChirho.status() === 303, 'isolated local reviewer session is available');
    await pageChirho.setViewportSize({ width: 1440, height: 1000 });
    await pageChirho.goto('http://127.0.0.1:5178/volumes-chirho/5/pages-chirho/148');
    await pageChirho.waitForFunction(() => document.querySelectorAll('.scan-box-chirho').length > 0);
    checkChirho(await pageChirho.locator('.scan-box-chirho').evaluateAll((boxesChirho) => boxesChirho.every((boxChirho) => parseFloat(boxChirho.style.left) + parseFloat(boxChirho.style.width) <= 100.000001 && parseFloat(boxChirho.style.top) + parseFloat(boxChirho.style.height) <= 100.000001)), 'every rendered vol-5 box fits inside the calibrated image');
    await pageChirho.getByRole('button', { name: 'מְלִיצַי רֵעָי', exact: true }).and(pageChirho.locator('[title$="line 25"]')).click();
    const dimensionsChirho = await pageChirho.locator('.focus-crop-chirho svg image').evaluate((imageChirho) => ({ widthChirho: Number(imageChirho.getAttribute('width')), heightChirho: Number(imageChirho.getAttribute('height')) }));
    checkChirho(Math.abs(dimensionsChirho.widthChirho - 892 * 300 / 72) < .0001 && Math.abs(dimensionsChirho.heightChirho - 1263 * 300 / 72) < .0001, 'magnifier maps PNG into raw stored coordinate space');
    const selectedChirho = pageChirho.locator('.scan-box-chirho[aria-pressed="true"]');
    checkChirho(Math.abs(parseFloat(await selectedChirho.evaluate((boxChirho) => boxChirho.style.top)) - 63.87) < 1, 'line-25 overlay is near 64 percent height, not the bottom margin');
    await pageChirho.screenshot({ path: '/Users/hallelujah/dev-chirho/friends-chirho/andrewbeth-chirho/hottp-chirho/workspace-chirho/reviewer-ui-chirho/26-09-19-vol5-calibrated-chirho.png', fullPage: true });
    await pageChirho.getByRole('button', { name: 'Adjust box', exact: true }).click();
    await pageChirho.locator('.scan-box-chirho.repair-chirho[aria-pressed="true"]').hover();
    const beforeChirho = await selectedChirho.boundingBox();
    const oldStyleChirho = await selectedChirho.getAttribute('style');
    await pageChirho.mouse.move(beforeChirho.x + beforeChirho.width / 2, beforeChirho.y + beforeChirho.height / 2);
    await pageChirho.mouse.down(); await pageChirho.mouse.move(beforeChirho.x + beforeChirho.width / 2 + 8, beforeChirho.y + beforeChirho.height / 2 + 5, { steps: 3 }); await pageChirho.mouse.up();
    await pageChirho.waitForFunction((styleChirho) => document.querySelector('.scan-box-chirho[aria-pressed="true"]')?.getAttribute('style') !== styleChirho, oldStyleChirho);
    const afterChirho = await selectedChirho.boundingBox();
    checkChirho(Math.abs(afterChirho.x - beforeChirho.x - 8) < 1 && Math.abs(afterChirho.y - beforeChirho.y - 5) < 1, 'pointer movement round-trips correctly in both calibrated axes');
    const downloadChirho = pageChirho.waitForEvent('download');
    await pageChirho.getByRole('button', { name: 'Export box-repair draft' }).click();
    let bodyChirho = ''; for await (const chunkChirho of await (await downloadChirho).createReadStream()) bodyChirho += chunkChirho.toString();
    const repairChirho = JSON.parse(bodyChirho).repairs_chirho[0];
    checkChirho(repairChirho.original_box_chirho.yChirho > 3300 && repairChirho.proposed_box_chirho.yChirho > 3300, 'repair export preserves stored units, not scaled display pixels');
    checkChirho(await pageChirho.getByRole('button', { name: 'Confirm & next' }).isDisabled(), 'calibrated box draft still holds confirmation');
    await pageChirho.getByRole('button', { name: 'Discard draft', exact: true }).click();
    await pageChirho.goto('http://127.0.0.1:5178/volumes-chirho/5/pages-chirho/148/scanlines-chirho');
    checkChirho(pageChirho.url().endsWith('/148'), 'vol-5 bad line-image view redirects to full-page reader');
    await pageChirho.goto('http://127.0.0.1:5178/volumes-chirho/5/pages-chirho/148?view-chirho=tools-chirho');
    checkChirho(await pageChirho.locator('.reader-chirho').count() === 1 && await pageChirho.locator('.legacy-page-editor-chirho').count() === 0, 'vol-5 legacy tools cannot surface incorrect line crops');
    // This copied emulator has the page PNG but no word snapshot for 2:151,
    // exercising the real segment fallback, whose folio padding is clipped.
    await pageChirho.goto('http://127.0.0.1:5178/volumes-chirho/2/pages-chirho/151');
    await pageChirho.getByRole('button', { name: '58', exact: true }).click();
    await pageChirho.getByRole('alert').filter({ hasText: 'box extends past the image edge' }).waitFor();
    checkChirho(await pageChirho.getByRole('button', { name: 'Confirm & next' }).isDisabled() && await pageChirho.locator('.focus-crop-chirho svg').count() === 0, 'clipped folio is held without displaying a misleading crop');
    await pageChirho.locator('.reading-token-chirho').first().click();
    await pageChirho.waitForFunction(() => !document.querySelector('.confirm-reading-chirho')?.disabled);
    checkChirho(await pageChirho.locator('.focus-crop-chirho svg').count() === 1, 'ordinary reading on the same folio page remains confirmable');
    checkChirho(writesChirho === 0, 'calibration, drag and export issue no server writes');
    return { assertionsChirho: evidenceChirho.length, evidenceChirho, writesChirho };
  } catch (caughtChirho) { throw new Error(`${caughtChirho.message}; passed: ${JSON.stringify(evidenceChirho)}`); }
  finally { await contextChirho.close(); }
}
