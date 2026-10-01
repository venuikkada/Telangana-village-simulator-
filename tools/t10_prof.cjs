// CPU profile of one game frame, per system, on the phone setup (Low preset).
// Usage: node tools/t10_prof.cjs   (PRESET=MEDIUM to compare)
const { open, waitReady } = require('./harness.cjs');
(async () => {
  const mobile = process.env.DESK ? false : true;
  const { browser, page, logs } = await open({ preset: process.env.PRESET || 'LOW', mobile, viewport: mobile ? { width: 915, height: 412 } : { width: 1280, height: 720 } });
  try {
    await waitReady(page);
    await page.evaluate(() => { const s = window.__tvs.sys; s.Game.start(null, { name: 'Raju' }); });
    await page.waitForTimeout(3000);
    await page.evaluate(() => {
      const s = window.__tvs.sys; const T = (window.__prof = { n: 0, acc: {}, max: {} });
      const wrap = (name, obj, fn) => {
        const orig = obj[fn]; if (typeof orig !== 'function') return;
        obj[fn] = function (...a) { const t = performance.now(); const r = orig.apply(this, a); const d = performance.now() - t; T.acc[name] = (T.acc[name] || 0) + d; T.max[name] = Math.max(T.max[name] || 0, d); return r; };
      };
      const list = [['Sim.tick', s.Sim, 'tick'], ['Player.update', s.Player, 'update'], ['Interact.update', s.Interact, 'update'], ['Vehicles.update', s.Vehicles, 'update'], ['Workers.update', s.Workers, 'update'], ['NPCs.update', s.NPCs, 'update'], ['Fauna.update', s.Fauna, 'update'], ['Cam.update', s.Cam, 'update'], ['Humans.update', s.Humans, 'update'], ['Animals.update', s.Animals, 'update'], ['FX.update', s.FX, 'update'], ['Weather.update', s.Weather, 'update'], ['Sky.update', s.Sky, 'update'], ['Fields.updateVisuals', s.Fields, 'updateVisuals'], ['Veg.updateVisibility', s.Veg, 'updateVisibility'], ['Chunks.updateVisibility', s.Chunks, 'updateVisibility'], ['Village.update', s.Village, 'update'], ['Missions.update', s.Missions, 'update'], ['UI.update', s.UI, 'update'], ['UI.updateTouchLabels', s.UI, 'updateTouchLabels'], ['Map2.drawMini', s.Map2, 'drawMini'], ['Audio2.update', s.Audio2, 'update'], ['Render.render', s.Render, 'render']];
      for (const [n, o, f] of list) wrap(n, o, f);
      const raf = window.requestAnimationFrame.bind(window);
      let last = performance.now();
      const tick = () => { T.n++; last = performance.now(); raf(tick); }; raf(tick); void last;
    });
    const where = [['farm', null], ['village', { x: 8, z: 4 }]];
    for (const [label, pos] of where) {
      if (pos) await page.evaluate((p) => { const s = window.__tvs.sys; s.Player.x = p.x; s.Player.z = p.z; s.Player.y = s.World.groundHeight(p.x, p.z); s.Cam.focus.set(p.x, s.Player.y + 1.4, p.z); }, pos);
      await page.waitForTimeout(4000);
      await page.evaluate(() => { const T = window.__prof; T.n = 0; T.acc = {}; T.max = {}; });
      await page.waitForTimeout(25000);
      const r = await page.evaluate(() => {
        const g = window.__tvs; const T = window.__prof; const n = Math.max(1, T.n);
        const rows = Object.keys(T.acc).map((k) => [k, T.acc[k] / n, T.max[k]]).sort((a, b) => b[1] - a[1]);
        const total = rows.filter((r) => r[0] !== 'Render.render').reduce((s, r) => s + r[1], 0);
        const info = g.renderer.info.render; const mem = g.renderer.info.memory;
        let meshes = 0, inst = 0, visible = 0; g.scene.traverse((o) => { if (o.isMesh) { meshes++; if (o.isInstancedMesh) inst++; } }); g.scene.traverseVisible((o) => { if (o.isMesh) visible++; });
        return { frames: T.n, totalUpdateMs: total.toFixed(2), rows: rows.map((r) => `${r[0].padEnd(26)} avg ${r[1].toFixed(2).padStart(7)} ms   max ${r[2].toFixed(1).padStart(7)} ms`), calls: info.calls, tris: info.triangles, programs: g.renderer.info.programs.length, geos: mem.geometries, tex: mem.textures, meshes, inst, visible, npcs: g.sys.NPCs.list.length, pr: g.sys.Render.pr };
      });
      console.log(`\n=== ${label} === frames ${r.frames}, update total ${r.totalUpdateMs} ms/frame, draw calls ${r.calls}, triangles ${r.tris}, programs ${r.programs}, meshes ${r.meshes} (inst ${r.inst}, visible ${r.visible}), NPCs ${r.npcs}, pr ${r.pr}`);
      console.log(r.rows.join('\n'));
    }
  } catch (e) { console.log('TEST ERROR', e.message); }
  const errs = logs.filter((l) => /error/i.test(l));
  console.log(errs.slice(0, 20).join('\n'));
  await browser.close();
})();
