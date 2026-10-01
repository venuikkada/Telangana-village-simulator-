const { open, waitReady, ROOT } = require('./harness.cjs');
const path = require('path');
(async () => {
  const { browser, page, logs } = await open({ preset: 'HIGH', viewport: { width: 1280, height: 720 } });
  try {
    await waitReady(page);
    await page.waitForTimeout(1500);
    await page.screenshot({ path: path.join(ROOT, 'shots/d_title.png'), timeout: 180000 });
    await page.evaluate(() => window.__tvs.sys.Game.start(null, { name: 'Venu' }));
    await page.evaluate(() => { const g = window.__tvs, s = g.sys; g.S.time.min = 9.2 * 60; const f = s.Fields.byId.F1; s.Player.x = f.x0 - 4; s.Player.z = f.z1 - 6; s.Player.yaw = Math.PI / 2 + 0.4; s.Cam.yaw = s.Player.yaw + Math.PI; s.Cam.pitch = 0.28; s.Cam.focus.set(s.Player.x, 1.5, s.Player.z); for (let i = 0; i < f.n; i++) f.tiles[i] = i % 7 < 4 ? 3 : 1; f.sownTiles = f.count(3); f.crop = 'paddy'; f.growth = 0.55; f.water = 80; f.cropDirty = true; f.allDirty = true; f.fu.uLeafRipe.value.set('#cfa84a'); });
    await page.waitForTimeout(6000);
    await page.screenshot({ path: path.join(ROOT, 'shots/d_play.png'), timeout: 180000 });
    await page.evaluate(() => window.__tvs.sys.UI.office());
    await page.waitForTimeout(1500);
    await page.screenshot({ path: path.join(ROOT, 'shots/d_office.png'), timeout: 180000 });
    await page.evaluate(() => { const s = window.__tvs.sys; s.UI.close(); s.UI.map(); });
    await page.waitForTimeout(1500);
    await page.screenshot({ path: path.join(ROOT, 'shots/d_map.png'), timeout: 180000 });
  } catch (e) { console.log('TEST ERROR', e.message); }
  console.log(logs.filter((l) => !l.startsWith('[log]') && !l.includes('GPU stall')).slice(0, 20).join('\n'));
  await browser.close();
})();
