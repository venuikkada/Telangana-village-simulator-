const { open, waitReady, ROOT } = require('./harness.cjs');
const path = require('path');
(async () => {
  const { browser, page, logs } = await open({ preset: 'LOW', viewport: { width: 800, height: 450 } });
  try {
    await waitReady(page);
    await page.evaluate(() => window.__tvs.sys.Game.start(null, { name: 'T' }));
    await page.waitForTimeout(2000);
    const r = await page.evaluate(() => { const s = window.__tvs.sys; const v = s.Vehicles.player.find((q) => q.type === 'bullock'); const A = s.Animals; return { bulls: v.bulls.map((a) => a && ({ x: a.x.toFixed(1), z: a.z.toFixed(1), y: a.y.toFixed(2), vis: a.visible, mode: a.mode, idx: a.idx, sp: a.sp || (a.S && a.S.name) })), vx: v.x, vz: v.z, animals: A.list.length, max: A.max, faunaN: s.Fauna.list.length, partsCount: Object.fromEntries(Object.entries(A.parts).map(([k, p]) => [k, p.mesh.count])) }; });
    console.log(JSON.stringify(r, null, 1));
    // put the camera near the cart
    await page.evaluate(() => { const s = window.__tvs.sys; const v = s.Vehicles.player.find((q) => q.type === 'bullock'); s.Player.x = v.x + 4; s.Player.z = v.z + 4; s.Cam.yaw = Math.PI * 0.25; s.Cam.tDist = 7; });
    await page.waitForTimeout(5000);
    await page.screenshot({ path: path.join(ROOT, 'shots/probe_cart.png'), timeout: 120000 });
  } catch (e) { console.log('TEST ERROR', e.message); }
  console.log(logs.filter((l) => !l.startsWith('[log]') && !l.includes('GPU stall')).slice(0, 20).join('\n'));
  await browser.close();
})();
