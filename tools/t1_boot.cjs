const { open, waitReady, ROOT } = require('./harness.cjs');
const path = require('path');
(async () => {
  const t0 = Date.now();
  const { browser, page, logs } = await open({ preset: process.env.PRESET || 'MEDIUM' });
  try {
    const r = await waitReady(page);
    console.log('ready', r, ((Date.now() - t0) / 1000).toFixed(1) + 's');
    await page.waitForTimeout(3000);
    await page.screenshot({ path: path.join(ROOT, 'shots/title.png') });
    const info = await page.evaluate(() => { const g = window.__tvs; return { fields: g.sys.Fields.list.length, avail: g.sys.Fields.list.filter((f) => f.avail).length, npcs: g.sys.NPCs.list.length, fauna: g.sys.Fauna.list.length, traffic: g.sys.Traffic.list.length, houses: g.sys.POI.houses.length, calls: g.renderer.info.render.calls, tris: g.renderer.info.render.triangles, geoms: g.renderer.info.memory.geometries, tex: g.renderer.info.memory.textures }; });
    console.log(JSON.stringify(info));
    // start new game
    await page.click('#tactions .tbtn:last-child, #tactions button:nth-child(1)');
    await page.waitForTimeout(500);
    const btns = await page.$$eval('#tactions button', (b) => b.map((x) => x.textContent));
    console.log('buttons', btns);
    const ng = await page.$('#newgame:not([hidden]) .tbtn.pri');
    if (ng) await ng.click(); else { await page.click('#tactions button'); await page.waitForTimeout(300); await page.click('#newgame .tbtn.pri'); }
    await page.waitForFunction(() => window.__tvs.started, null, { timeout: 60000 });
    await page.waitForTimeout(4000);
    await page.screenshot({ path: path.join(ROOT, 'shots/start.png') });
    const st = await page.evaluate(() => { const g = window.__tvs; const S = g.S; return { money: S.money, time: g.sys.Time.fmtClock(), missions: S.missions.active.map((m) => m.tpl), veh: g.sys.Vehicles.player.map((v) => v.type), p: [g.sys.Player.x, g.sys.Player.z], calls: g.renderer.info.render.calls, tris: g.renderer.info.render.triangles }; });
    console.log(JSON.stringify(st));
  } catch (e) { console.log('TEST ERROR', e.message); await page.screenshot({ path: path.join(ROOT, 'shots/error.png') }).catch(() => {}); }
  console.log(logs.slice(0, 60).join('\n'));
  await browser.close();
})();
