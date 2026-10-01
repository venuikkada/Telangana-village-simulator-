const { open, waitReady, ROOT } = require('./harness.cjs');
const path = require('path');
(async () => {
  for (const [w, hgt, tag] of [[915, 412, 'land'], [412, 915, 'port']]) {
    const { browser, page, logs } = await open({ mobile: true, viewport: { width: w, height: hgt } });
    try {
      await waitReady(page);
      await page.waitForTimeout(1500);
      await page.screenshot({ path: path.join(ROOT, `shots/m_${tag}_title.png`), timeout: 120000 });
      await page.tap('#tactions button.pri');
      await page.waitForTimeout(400);
      await page.screenshot({ path: path.join(ROOT, `shots/m_${tag}_newgame.png`), timeout: 120000 });
      await page.tap('#newgame .tbtn.pri');
      await page.waitForFunction(() => window.__tvs.started, null, { timeout: 90000 });
      await page.waitForTimeout(6000);
      if (tag === 'port') { await page.screenshot({ path: path.join(ROOT, `shots/m_${tag}_rotate.png`), timeout: 120000 }); await page.tap('#rotateOk'); await page.waitForTimeout(1500); }
      // stand on the field so the field card shows
      await page.evaluate(() => { const s = window.__tvs.sys; const f = s.Fields.byId.F1; s.Player.x = f.x0 + 3; s.Player.z = f.z0 + 3; });
      await page.waitForTimeout(4000);
      await page.screenshot({ path: path.join(ROOT, `shots/m_${tag}_hud.png`), timeout: 120000 });
      await page.evaluate(() => { const s = window.__tvs.sys; const v = s.Vehicles.player.find((q) => q.type === 'bullock'); s.Player.x = v.x + 1; s.Player.z = v.z; s.Player.enterVehicle(v); });
      await page.waitForTimeout(4000);
      await page.screenshot({ path: path.join(ROOT, `shots/m_${tag}_drive.png`), timeout: 120000 });
      await page.evaluate(() => { window.__tvs.sys.Player.exitVehicle(true); });
      const info = await page.evaluate(() => ({ preset: window.__tvs.preset.id, pr: window.__tvs.sys.Render.pr, mobile: matchMedia('(pointer: coarse)').matches, touchHidden: document.getElementById('touch').hidden, heapMB: performance.memory ? Math.round(performance.memory.usedJSHeapSize / 1048576) : -1, geoms: window.__tvs.renderer.info.memory.geometries, tex: window.__tvs.renderer.info.memory.textures, calls: window.__tvs.renderer.info.render.calls, tris: window.__tvs.renderer.info.render.triangles }));
      console.log(tag, JSON.stringify(info));
      await page.tap('#bOffice');
      await page.waitForTimeout(800);
      await page.screenshot({ path: path.join(ROOT, `shots/m_${tag}_office.png`), timeout: 120000 });
    } catch (e) { console.log('TEST ERROR', tag, e.message); }
    console.log(logs.filter((l) => !l.startsWith('[log]') && !l.includes('GPU stall')).slice(0, 20).join('\n'));
    await browser.close();
  }
})();
