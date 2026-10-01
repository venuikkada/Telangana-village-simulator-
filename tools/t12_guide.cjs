// Phone flow for the easy-play update: guide marker, minimap, full map, auto travel, Auto work.
const { open, waitReady, ROOT } = require('./harness.cjs');
const path = require('path');
const shot = (page, name) => page.screenshot({ path: path.join(ROOT, 'shots', name + '.png'), timeout: 120000 });
(async () => {
  const W = +(process.env.W || 915), H = +(process.env.H || 412), tag = process.env.TAG || 'land';
  const { browser, page, logs } = await open({ mobile: true, viewport: { width: W, height: H } });
  const ev = (fn, arg) => page.evaluate(fn, arg);
  try {
    await waitReady(page);
    await ev(() => { window.__tvs.sys.Settings.v.portraitOk = true; window.__tvs.sys.Game.start(null, { name: 'Raju' }); });
    await page.waitForTimeout(7000);
    await shot(page, `g_${tag}_start`);
    console.log('start', JSON.stringify(await ev(() => { const s = window.__tvs.sys; const n = document.getElementById('nav'); return { nav: !n.hidden, navText: n.textContent, missions: document.getElementById('missions').textContent.slice(0, 200), target: s.Map2.target() && s.Map2.target().name, arrow: s.UI && window.__tvs.scene.children.some((o) => o.renderOrder === 999 && o.visible), fps: s.Render.pr, cap: null }; })));
    // full map
    await ev(() => window.__tvs.sys.UI.map());
    await page.waitForTimeout(2500);
    await shot(page, `g_${tag}_map`);
    // tap the seed shop on the map
    const tapAt = await ev(() => { const s = window.__tvs.sys; const M = s.Map2; const pl = M.places().find((p) => p.id === 'seed'); const V = M.view; return { x: (pl.x - V.cx) * V.s + M.full.w / 2, y: (pl.z - V.cz) * V.s + M.full.h / 2 }; });
    await ev((p) => window.__tvs.sys.Map2.tap(p.x, p.y), tapAt);
    await page.waitForTimeout(1500);
    await shot(page, `g_${tag}_map_sel`);
    console.log('selected', JSON.stringify(await ev(() => ({ sel: document.querySelector('.mapsel').textContent.slice(0, 160), wp: window.__tvs.S.waypoint }))));
    // zoom and pan
    await ev(() => { const M = window.__tvs.sys.Map2; M.zoom(2.2); });
    await page.waitForTimeout(1200);
    await shot(page, `g_${tag}_map_zoom`);
    // take the auto there
    const before = await ev(() => ({ m: window.__tvs.S.money, x: window.__tvs.sys.Player.x, z: window.__tvs.sys.Player.z }));
    await ev(() => { document.querySelector('.mapsel .btn.acc').click(); });
    await page.waitForTimeout(3500);
    const after = await ev(() => ({ m: window.__tvs.S.money, x: window.__tvs.sys.Player.x, z: window.__tvs.sys.Player.z, wp: window.__tvs.S.waypoint, modal: !document.getElementById('modal').hidden }));
    console.log('travel', JSON.stringify({ before, after }));
    await page.waitForTimeout(3000);
    await shot(page, `g_${tag}_arrived`);
    // back to the field: Auto work with the Work button held
    await ev(() => { const s = window.__tvs.sys; const f = s.Fields.byId.F1; s.Player.x = f.x0 + 4; s.Player.z = f.z0 + 4; s.Player.y = s.World.groundHeight(s.Player.x, s.Player.z); s.Cam.focus.set(s.Player.x, s.Player.y + 1.4, s.Player.z); });
    await page.waitForTimeout(2000);
    await ev(() => { const s = window.__tvs.sys; s.Input.work = true; s.Input.joy.active = true; s.Input.joy.x = 0.3; s.Input.joy.y = 1; });
    for (let i = 0; i < 6; i++) {
      await page.waitForTimeout(2500);
      await ev((i) => { const s = window.__tvs.sys; const f = s.Fields.byId.F1; const P = s.Player; if (P.x > f.x1 - 3 || P.x < f.x0 + 3 || P.z > f.z1 - 3 || P.z < f.z0 + 3) { P.x = f.x0 + 4 + (i * 4.5) % (f.w - 8); P.z = f.z0 + 4; } }, i);
    }
    await shot(page, `g_${tag}_work`);
    const w1 = await ev(() => { const s = window.__tvs.sys; const f = s.Fields.byId.F1; return { ploughed: +(f.countMin(1) / f.n).toFixed(2), need: s.Player.need && s.Player.need.item, prompt: document.getElementById('prompt').textContent, pulse: document.getElementById('workpulse').textContent, energy: window.__tvs.S.player.energy.toFixed(1), tut: window.__tvs.S.missions.tut }; });
    console.log('work', JSON.stringify(w1));
    await ev(() => { const s = window.__tvs.sys; s.Input.work = false; s.Input.joy.active = false; s.Input.joy.x = 0; s.Input.joy.y = 0; });
    const info = await ev(() => ({ preset: window.__tvs.preset.id, pr: window.__tvs.sys.Render.pr, calls: window.__tvs.renderer.info.render.calls, tris: window.__tvs.renderer.info.render.triangles, programs: window.__tvs.renderer.info.programs.length, far: window.__tvs.camera.far }));
    console.log('render', JSON.stringify(info));
  } catch (e) { console.log('TEST ERROR', e.message); }
  console.log(logs.filter((l) => !l.startsWith('[log]') && !l.includes('GPU stall') && !l.includes('WebGL')).slice(0, 25).join('\n'));
  await browser.close();
})();
