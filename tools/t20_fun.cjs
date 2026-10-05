// Fun update: new free rides (car, taxi, jeep, scooter, bicycle, go-kart, helicopter), funny moves with
// villagers joining in, the dressing room, Explore mode, golden mangoes, places and races.
const { open, waitReady, ROOT } = require('./harness.cjs');
const path = require('path');
const ok = (c, msg) => { console.log((c ? 'PASS ' : 'FAIL ') + msg); if (!c) process.exitCode = 1; };
const shot = (page, n) => page.screenshot({ path: path.join(ROOT, 'shots', n + '.png'), timeout: 120000 }).catch((e) => console.log('shot failed', n, e.message));
(async () => {
  const { browser, page, logs } = await open({ viewport: { width: 1280, height: 720 }, preset: 'LOW' });
  const ev = (fn, a) => page.evaluate(fn, a);
  const waitFor = async (fn, ms = 20000, a) => { const t0 = Date.now(); while (Date.now() - t0 < ms) { if (await page.evaluate(fn, a)) return true; await page.waitForTimeout(200); } return false; };
  try {
    await waitReady(page);
    ok(await ev(() => window.__tvs.sys.Settings.v.timeScale === 0.5), 'days run at half speed by default (more time to explore)');
    await ev(() => { window.__tvs.sys.Settings.v.voice = false; [...document.querySelectorAll('#tactions .tbtn')].find((x) => /New game/.test(x.textContent)).click(); });
    await page.waitForSelector('#startFarming');
    await ev(() => document.getElementById('startFarming').click());
    ok(await waitFor(() => window.__tvs.S && document.getElementById('hud').hidden === false, 90000), 'game started');
    await page.waitForTimeout(600);

    // ---- free rides ----
    const types = await ev(() => window.__tvs.sys.Vehicles.player.map((v) => v.type));
    ok(['car', 'taxi', 'jeep', 'scooter', 'cycle', 'kart', 'heli', 'racer', 'autorick', 'citybus', 'lorry'].every((t) => types.includes(t)), 'free rides parked: ' + types.join(', '));
    ok(await ev(() => window.__tvs.sys.Traffic.list.some((v) => v.type === 'npccar')), 'cars drive on the roads');
    const car = await ev(() => { const s = window.__tvs.sys; const v = s.Vehicles.player.find((q) => q.type === 'car'); s.Player.x = v.x + 1.5; s.Player.z = v.z; s.Player.enterVehicle(v); v.ghost = true; for (let i = 0; i < 120; i++) v.update(1 / 30, { throttle: 1, steer: 0 }); const sp = v.speed; v.ghost = false; s.Player.exitVehicle(true); return sp; });
    ok(car > 12, 'the car drives (' + car.toFixed(1) + ' m/s)');

    // ---- helicopter: take off, fly, refuse to drop you mid-air, land ----
    await ev(() => { const s = window.__tvs.sys; const v = s.Vehicles.player.find((q) => q.type === 'heli'); s.Player.x = v.x + 2; s.Player.z = v.z; s.Player.enterVehicle(v); });
    await page.keyboard.down('Space');
    ok(await waitFor(() => window.__tvs.sys.Player.vehicle.alt > 8, 90000), 'helicopter climbs with Space');
    await page.keyboard.up('Space');
    const z0 = await ev(() => { const v = window.__tvs.sys.Player.vehicle; return { x: v.x, z: v.z }; });
    await page.keyboard.down('KeyW'); await waitFor((p) => { const v = window.__tvs.sys.Player.vehicle; return Math.hypot(v.x - p.x, v.z - p.z) > 12; }, 30000, z0); await page.keyboard.up('KeyW');
    const fl = await ev((p) => { const v = window.__tvs.sys.Player.vehicle; return { moved: Math.hypot(v.x - p.x, v.z - p.z), alt: v.alt }; }, z0);
    ok(fl.moved > 10 && fl.alt > 6, 'helicopter flies forward and holds its height ' + JSON.stringify(fl));
    await shot(page, 'fun_heli');
    await ev(() => window.__tvs.sys.Player.exitVehicle());
    ok(await ev(() => !!window.__tvs.sys.Player.vehicle), 'no jumping out in the air');
    await page.keyboard.down('KeyC');
    ok(await waitFor(() => window.__tvs.sys.Player.vehicle.alt < 0.05, 30000), 'lands with C');
    await page.keyboard.up('KeyC');
    await ev(() => window.__tvs.sys.Player.exitVehicle());
    ok(await ev(() => !window.__tvs.sys.Player.vehicle), 'gets off after landing');

    // ---- funny moves, villagers join in ----
    await ev(() => { const s = window.__tvs.sys; const n = s.NPCs.list.find((q) => !q.worker && q.h.visible); s.Player.x = n.h.x + 3; s.Player.z = n.h.z; s.Player.y = s.World.groundHeight(s.Player.x, s.Player.z); });
    await page.keyboard.press('KeyT');
    ok(await waitFor(() => { const b = document.getElementById('funbar'); return b && !b.hidden && b.querySelectorAll('.fe').length === 16; }, 3000), 'Fun bar with 16 moves (T key)');
    await shot(page, 'fun_bar');
    await ev(() => [...document.querySelectorAll('#funbar .fe')].find((b) => /Dance/.test(b.textContent)).click());
    await waitFor(() => window.__tvs.sys.Player.h.pose === 'bhangra', 8000);
    const dn = await ev(() => { const s = window.__tvs.sys; return { em: s.Player.em && s.Player.em.id, pose: s.Player.h.pose, joined: s.NPCs.list.filter((n) => n.react && n.react.pose === 'bhangra').length }; });
    ok(dn.em === 'dance' && dn.pose === 'bhangra' && dn.joined >= 1, 'dancing, villagers join in ' + JSON.stringify(dn));
    await ev(() => window.__tvs.sys.Emote.play('sleep'));
    ok(await waitFor(() => window.__tvs.sys.Player.h.lie > 0.95, 15000), 'nap: lies down');
    await page.keyboard.down('KeyW'); await waitFor(() => !window.__tvs.sys.Player.em && window.__tvs.sys.Player.h.lie === 0, 8000); await page.keyboard.up('KeyW');
    ok(await ev(() => !window.__tvs.sys.Player.em && window.__tvs.sys.Player.h.lie === 0), 'walking ends the move');
    await ev(() => window.__tvs.sys.Emote.play('cartwheel'));
    ok(await waitFor(() => window.__tvs.sys.Player.h.roll > 1, 3000), 'cartwheel rolls');

    // ---- dressing room ----
    await ev(() => window.__tvs.sys.Wardrobe.open());
    ok(await ev(() => document.getElementById('modal').classList.contains('side') && !!window.__tvs.sys.Cam.intro), 'dressing room at the side, camera on the farmer');
    const before = await ev(() => window.__tvs.sys.Player.h.app.shirt.getHexString());
    await ev(() => { const rows = [...document.querySelectorAll('#modal .set > label')]; const top = rows.find((l) => l.textContent === 'Top'); top.nextElementSibling.querySelectorAll('.sw')[1].click(); });
    await ev(() => { const rows = [...document.querySelectorAll('#modal .set > label')]; const g = rows.find((l) => l.textContent === 'Sunglasses'); [...g.nextElementSibling.querySelectorAll('button')].find((b) => b.textContent === 'On').click(); });
    const after = await ev(() => ({ shirt: window.__tvs.sys.Player.h.app.shirt.getHexString(), shades: window.__tvs.sys.Player.h.app.shades, look: window.__tvs.S.player.look }));
    ok(before !== after.shirt && after.shades === true && after.look && after.look.shades === true, 'new top colour and sunglasses on the farmer ' + before + ' → ' + after.shirt);
    await page.waitForTimeout(500);
    await shot(page, 'fun_wardrobe');
    await ev(() => window.__tvs.sys.UI.close());
    ok(await ev(() => !window.__tvs.sys.Cam.intro && !document.getElementById('modal').classList.contains('side')), 'dressing room closes cleanly');

    // ---- explore mode stops the clock ----
    await ev(() => window.__tvs.sys.Fun.explore(true));
    const t1 = await ev(() => window.__tvs.S.time.min);
    await page.waitForTimeout(2500);
    const t2 = await ev(() => ({ min: window.__tvs.S.time.min, chip: document.getElementById('funchip').textContent }));
    ok(t2.min === t1 && /Explore mode/.test(t2.chip), 'explore mode: time stands still ' + t1 + ' / ' + t2.min);
    await ev(() => window.__tvs.sys.Fun.explore(false));
    ok(await waitFor((m) => window.__tvs.S.time.min > m, 15000, t1), 'time runs again after explore mode');

    // ---- golden mango and a new place ----
    const m0 = await ev(() => { const s = window.__tvs.sys, F = s.Fun; const sp = F.spots[0]; const money = window.__tvs.S.money; s.Player.x = sp.x; s.Player.z = sp.z; s.Player.y = s.World.groundHeight(sp.x, sp.z); return { n: F.spots.length, money }; });
    ok(m0.n === 30, '30 golden mangoes hidden');
    ok(await waitFor(() => window.__tvs.S.fun.mangoes.includes(0), 4000), 'picked up a golden mango');
    const pl = await ev(() => { const s = window.__tvs.sys; const f = window.__tvs.S.fun; const p = s.Map2.places().find((q) => !f.places[q.id]); s.Player.x = p.x + 5; s.Player.z = p.z; s.Player.y = s.World.groundHeight(p.x + 5, p.z); return p.id; });
    ok(await waitFor((id) => !!window.__tvs.S.fun.places[id], 20000, pl), 'discovered a place: ' + pl);

    // ---- a race, run through its checkpoints ----
    await ev(() => window.__tvs.sys.Fun.raceStart('village'));
    const rc = await ev(() => { const F = window.__tvs.sys.Fun; return { on: !!F.race, n: F.race && F.race.pts.length, guide: F.guide() }; });
    ok(rc.on && rc.n >= 3 && rc.guide && /Checkpoint/.test(rc.guide.name), 'race on with ' + rc.n + ' checkpoints, the gold arrow points at the next');
    await waitFor(() => window.__tvs.sys.Fun.race.go, 6000);
    await page.waitForTimeout(300);
    await shot(page, 'fun_race');
    for (let k = 0; k < 200 && await ev(() => !!window.__tvs.sys.Fun.race); k++) {
      await ev(() => { const s = window.__tvs.sys, r = s.Fun.race; if (!r) return; const p = r.pts[r.i]; s.Player.x = p.x; s.Player.z = p.z; s.Player.y = s.World.groundHeight(p.x, p.z); });
      await page.waitForTimeout(250);
    }
    ok(await waitFor(() => !window.__tvs.sys.Fun.race && !!window.__tvs.S.fun.best.village, 4000), 'race finished, best time saved ' + JSON.stringify(await ev(() => window.__tvs.S.fun.best)));
    await ev(() => window.__tvs.sys.Fun.open());
    const act = await ev(() => document.getElementById('modal').innerText);
    ok(/Golden mango hunt/.test(act) && /Places to discover/.test(act) && /Races/.test(act) && /Explore mode/.test(act), 'activities sheet');
    await shot(page, 'fun_activities');
    await ev(() => window.__tvs.sys.UI.close());
    const errs = logs.filter((l) => /pageerror|\[error\]/.test(l) && !/favicon|net::|Failed to load resource/.test(l));
    ok(errs.length === 0, 'no page errors ' + JSON.stringify(errs.slice(0, 3)));
  } catch (e) { console.log('FAIL exception', e.message); process.exitCode = 1; }
  await browser.close();
})();
