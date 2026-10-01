const { open, waitReady, ROOT } = require('./harness.cjs');
const path = require('path');
(async () => {
  const { browser, page, logs } = await open({ preset: process.env.PRESET || 'LOW', viewport: { width: 800, height: 450 } });
  try {
    const r = await waitReady(page);
    console.log('ready', r);
    for (let i = 0; i < 6; i++) {
      await page.waitForTimeout(5000);
      const f = await Promise.race([page.evaluate(() => ({ frame: window.__tvs.frame, t: window.__tvs.t.toFixed(2), calls: window.__tvs.renderer.info.render.calls, tris: window.__tvs.renderer.info.render.triangles })), new Promise((r) => setTimeout(() => r('eval timeout'), 20000))]);
      console.log(i, JSON.stringify(f));
    }
    await page.screenshot({ path: path.join(ROOT, 'shots/title_low.png'), timeout: 120000 });
    console.log('shot ok');
  } catch (e) { console.log('TEST ERROR', e.message); }
  console.log(logs.slice(0, 40).join('\n'));
  await browser.close();
})();
