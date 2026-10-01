// "Do it for me": play the whole tutorial pressing only the Do-it button (and the top choice
// in any sheet that opens). Also checks tap-to-walk.
const { open, waitReady, ROOT } = require('./harness.cjs');
const path = require('path');
(async () => {
  const { browser, page, logs } = await open({ mobile: true, viewport: { width: 915, height: 412 }, preset: 'LOW' });
  try {
    await waitReady(page);
    await page.evaluate(() => { const s = window.__tvs.sys; s.Settings.v.voice = false; s.Game.start(null, { name: 'Raju' }); });
    await page.waitForTimeout(3000);
    // tap-to-walk: tap the middle of the screen a bit below the horizon
    const before = await page.evaluate(() => ({ x: window.__tvs.sys.Player.x, z: window.__tvs.sys.Player.z }));
    // tap a spot on the ground 12 m in front of the camera's view of the farmer
    await page.evaluate(() => { const s = window.__tvs.sys; const P = s.Player; const x = P.x - Math.sin(s.Cam.yaw) * 12, z = P.z - Math.cos(s.Cam.yaw) * 12; const v = new s.THREE.Vector3(x, s.World.groundHeight(x, z), z).project(window.__tvs.camera); s.Auto.tapWalk((v.x + 1) / 2 * innerWidth, (1 - v.y) / 2 * innerHeight); });
    await page.waitForTimeout(6000);
    const after = await page.evaluate(() => ({ x: window.__tvs.sys.Player.x, z: window.__tvs.sys.Player.z, on: window.__tvs.sys.Auto.on }));
    console.log('tap-walk', JSON.stringify({ before, after, moved: Math.hypot(after.x - before.x, after.z - before.z).toFixed(1) }));
    await page.evaluate(() => window.__tvs.sys.Auto.stop(true));
    let taps = 0; const log = []; const t0 = Date.now();
    while (Date.now() - t0 < 14 * 60000) {
      const st = await page.evaluate(() => { const s = window.__tvs.sys; s.Coach.update(); const c = s.Coach.step; return { tut: window.__tvs.S.missions.tut, auto: s.Auto.on, modal: !document.getElementById('modal').hidden, text: c ? c.text : null, m: c ? c.m.tpl : null }; });
      if (st.tut >= 8) { log.push('TUTORIAL DONE'); console.log('TUTORIAL DONE'); break; }
      if (st.modal) { await page.evaluate(() => { const m = document.getElementById('modal'); const b = m.querySelector('.btn.acc') || m.querySelector('.opts .btn'); if (b) b.click(); else window.__tvs.sys.UI.close(); }); await page.waitForTimeout(800); continue; }
      if (st.auto) { await page.waitForTimeout(1500); continue; }
      const key = st.m + ': ' + st.text; if (log[log.length - 1] !== key) { log.push(key); console.log(`[${Math.round((Date.now() - t0) / 1000)}s] ${key}`); }
      await page.evaluate(() => window.__tvs.sys.Auto.doStep()); taps++;
      await page.waitForTimeout(1800);
    }
    console.log(JSON.stringify(await page.evaluate((taps) => ({ taps, money: Math.round(window.__tvs.S.money), tut: window.__tvs.S.missions.tut, day: window.__tvs.sys.Time.day() }), taps)), 'real seconds', Math.round((Date.now() - t0) / 1000));
    await page.screenshot({ path: path.join(ROOT, 'shots/doit_end.png'), timeout: 120000 });
  } catch (e) { console.log('TEST ERROR', e.message); }
  console.log(logs.filter((l) => /pageerror|\[error\]/i.test(l)).slice(0, 10).join('\n'));
  await browser.close();
})();
