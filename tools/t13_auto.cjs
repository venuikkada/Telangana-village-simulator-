// Whole first season with only the Auto tool, quick delivery and "Rest": the path a child would take.
const { open, waitReady, ROOT } = require('./harness.cjs');
const path = require('path');
(async () => {
  const { browser, page, logs } = await open({ mobile: true, viewport: { width: 915, height: 412 } });
  const ev = async (label, fn, arg) => { const r = await page.evaluate(fn, arg); console.log(label.padEnd(12), JSON.stringify(r)); return r; };
  const state = () => { const g = window.__tvs, s = g.sys; const f = s.Fields.byId.F1; return { money: Math.round(g.S.money), tut: g.S.missions.tut, active: g.S.missions.active.filter((m) => m.tpl.startsWith('t_')).map((m) => m.tpl + ':' + (+m.prog).toFixed(2)), crop: f.crop, growth: +f.growth.toFixed(2), water: Math.round(f.water), nut: Math.round(f.nut), weeds: Math.round(f.weeds), pests: Math.round(f.pests), ploughed: +(f.countMin(2) / f.n).toFixed(2), sown: +(f.countMin(3) / f.n).toFixed(2), need: s.Player.need && s.Player.need.item, pump: f.pump, heap: f.heap && +f.heap.qty.toFixed(1), day: s.Time.day(), hour: +s.Time.hour().toFixed(1) }; };
  try {
    await waitReady(page);
    await page.evaluate(() => { window.__tvs.sys.Game.start(null, { name: 'Raju' }); });
    await page.waitForTimeout(3000);
    // walk onto the field (tutorial step 1)
    await page.evaluate(() => { const s = window.__tvs.sys; const f = s.Fields.byId.F1; s.Player.x = f.x0 + 3; s.Player.z = f.z0 + 3; });
    await page.waitForTimeout(2500);
    await ev('arrive', state);
    // one pass with Work held over the whole field: Auto ploughs
    const pass = () => { const s = window.__tvs.sys; const f = s.Fields.byId.F1; s.Player.tool = 'auto'; let n = 0; for (let z = f.z0 + 1; z < f.z1; z += 2.5) for (let x = f.x0 + 1; x < f.x1; x += 2.5) { s.Player.x = x; s.Player.z = z; s.Player.yaw = 0; s.Player.doWork(f); n++; } s.Missions.update(); return n; };
    await page.evaluate(pass); await page.evaluate(pass);
    await ev('ploughed', state);
    // the quick-delivery prompt: buy the first (best) crop
    await ev('quickbuy', () => { const s = window.__tvs.sys; const nd = s.Player.need; if (!nd) return 'no need'; s.UI.quickBuy(nd); const b = document.querySelector('#modal .opts .btn.acc'); const label = b && b.textContent; b && b.click(); return label; });
    await page.evaluate(pass); await page.evaluate(pass);
    await ev('sown', state);
    // watering: hold Work on the crop, the pump starts; let time pass
    await page.evaluate(pass);
    await ev('pump on', state);
    await page.evaluate(() => { window.__tvs.sys.Sim.advance(240); window.__tvs.sys.Missions.update(); });
    await ev('watered', state);
    // feed the crop (buy fertilizer if asked)
    await page.evaluate(pass);
    await ev('fert', async () => { const s = window.__tvs.sys; const nd = s.Player.need; return nd ? nd.item : null; });
    await page.evaluate(() => { const s = window.__tvs.sys; const nd = s.Player.need; if (nd && nd.item === 'urea') { s.UI.quickBuy(nd); const b = document.querySelector('#modal .opts .btn.acc'); b && b.click(); } });
    await page.evaluate(pass); await page.evaluate(pass);
    await ev('fed', state);
    // rest until the crop needs us, do the job, repeat until harvest
    for (let i = 0; i < 12; i++) {
      const st = await page.evaluate(() => { const s = window.__tvs.sys; const f = s.Fields.byId.F1; return { g: f.growth, heap: !!f.heap, crop: f.crop }; });
      if (!st.crop || st.heap) break;
      await page.evaluate(() => { window.__tvs.sys.Services.waitForCrop(window.__tvs.sys.Fields.byId.F1); });
      await page.waitForTimeout(1200);
      await page.evaluate(pass);
      await page.evaluate(() => { const s = window.__tvs.sys; const nd = s.Player.need; if (nd && nd.item !== 'wait' && nd.item !== 'seed') { s.UI.quickBuy(nd); const b = document.querySelector('#modal .opts .btn.acc'); b && b.click(); s.Player.doWork(s.Fields.byId.F1); } });
      await page.evaluate(pass);
      await ev('rest ' + i, state);
    }
    await ev('toasts', () => [...document.querySelectorAll('#toasts .toast')].map((t) => t.textContent).slice(-3));
    // sell the heap to the trader
    await ev('sell', () => { const s = window.__tvs.sys; const f = s.Fields.byId.F1; if (!f.heap) return 'no heap'; s.UI.heapMenu(f); const b = document.querySelector('#modal .btn.acc'); const t = b && b.textContent; b && b.click(); s.Missions.update(); return t; });
    await ev('end', state);
    await page.screenshot({ path: path.join(ROOT, 'shots/auto_end.png'), timeout: 120000 });
  } catch (e) { console.log('TEST ERROR', e.message); }
  console.log(logs.filter((l) => /error|warn/i.test(l) && !l.includes('GPU stall') && !l.includes('WebGL')).slice(0, 20).join('\n'));
  await browser.close();
})();
