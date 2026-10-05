// More fun: Holi colours, kite fights, gully cricket, fishing at the lake and the daily lucky wheel.
const { open, waitReady, ROOT } = require('./harness.cjs');
const path = require('path');
const ok = (c, msg) => { console.log((c ? 'PASS ' : 'FAIL ') + msg); if (!c) process.exitCode = 1; };
const shot = (page, n) => page.screenshot({ path: path.join(ROOT, 'shots', n + '.png'), timeout: 120000 }).catch((e) => console.log('shot failed', n, e.message));
(async () => {
  const { browser, page, logs } = await open({ viewport: { width: 1280, height: 720 }, preset: 'LOW' });
  const ev = (fn, a) => page.evaluate(fn, a);
  const waitFor = async (fn, ms = 20000, a) => { const t0 = Date.now(); while (Date.now() - t0 < ms) { if (await page.evaluate(fn, a)) return true; await page.waitForTimeout(150); } return false; };
  try {
    await waitReady(page);
    await ev(() => { window.__tvs.sys.Settings.v.voice = false; [...document.querySelectorAll('#tactions .tbtn')].find((x) => /New game/.test(x.textContent)).click(); });
    await page.waitForSelector('#startFarming');
    await ev(() => document.getElementById('startFarming').click());
    ok(await waitFor(() => window.__tvs.S && document.getElementById('hud').hidden === false, 90000), 'game started');
    await page.waitForTimeout(600);

    // ---- the Fun bar has the games, with a dot on the free spin ----
    await page.keyboard.press('KeyT');
    ok(await waitFor(() => { const b = document.getElementById('funbar'); return b && !b.hidden && b.querySelectorAll('.fe.fg').length === 4; }, 3000), 'Fun bar shows 4 games');
    ok(await ev(() => /Lucky wheel/.test(document.querySelector('#funbar .fe.fg.dot').textContent)), 'free spin marked with a dot');

    // ---- Holi: villagers near you turn colourful and dance ----
    const holi = await ev(() => {
      const s = window.__tvs.sys, n = s.NPCs.list.find((q) => !q.worker && q.h.visible);
      s.Player.x = n.h.x + 2.5; s.Player.z = n.h.z; s.Player.y = s.World.groundHeight(s.Player.x, s.Player.z);
      const before = n.h.app.shirt.getHex();
      [...document.querySelectorAll('#funbar .fe')].find((b) => /Holi/.test(b.textContent)).click();
      return { before, after: n.h.app.shirt.getHex(), react: n.react && n.react.pose, me: s.Player.em && s.Player.em.id };
    });
    ok(holi.react === 'bhangra' && holi.me === 'holi', 'Holi: the villager next to you dances ' + JSON.stringify(holi));
    ok(await waitFor(() => /Happy Holi/i.test(document.body.innerText), 8000), 'Happy Holi! ribbon');
    await page.waitForTimeout(400);
    await shot(page, 'games_holi');

    // ---- kite fights ----
    const m0 = await ev(() => window.__tvs.S.money);
    await page.keyboard.press('KeyT');
    await waitFor(() => { const b = document.getElementById('funbar'); return b && !b.hidden; }, 3000);
    await ev(() => [...document.querySelectorAll('#funbar .fe.fg')].find((b) => /kite/i.test(b.textContent)).click());
    const k0 = await ev(() => { const s = window.__tvs.sys, b = document.getElementById('gamebtn'); return { mode: s.Games.mode, btn: b && !b.hidden && b.textContent, aim: !!s.Cam.aim, bar: document.getElementById('funbar').hidden, open: s.Games.openSky(s.Player.x, s.Player.z) }; });
    ok(k0.mode === 'kite' && /Dive/.test(k0.btn) && k0.aim && k0.bar && k0.open, 'kite flying from open ground: Dive button, camera looks up ' + JSON.stringify(k0));
    ok(await waitFor(() => { const k = window.__tvs.sys.Games.kite; return k && k.rivals.length === 3 && k.L > 25; }, 120000), 'the kite climbs and 3 other kites fly nearby');
    const inView = await ev(() => {
      const s = window.__tvs.sys, k = s.Games.kite;
      const v = k.pos.clone().project(window.__tvs.camera), p = new s.THREE.Vector3(s.Player.x, s.Player.y + 1, s.Player.z).project(window.__tvs.camera);
      return { kite: [+v.x.toFixed(2), +v.y.toFixed(2), +v.z.toFixed(3)], me: [+p.x.toFixed(2), +p.y.toFixed(2)] };
    });
    ok(Math.abs(inView.kite[0]) < 1 && Math.abs(inView.kite[1]) < 1 && inView.kite[2] < 1 && Math.abs(inView.me[1]) < 1, 'you and your kite are both on screen ' + JSON.stringify(inView));
    await shot(page, 'games_kite');
    // hold F (dive) and steer onto another kite
    await page.keyboard.down('KeyF');
    ok(await waitFor(() => { const k = window.__tvs.sys.Games.kite; if (!k) return false; const r = k.cut === 0 && k.rivals.find((q) => !q.falling); if (r) { r.rad = 0; r.cx = k.pos.x; r.cz = k.pos.z; r.cy = k.pos.y - Math.sin(r.t * 0.8) * 2; } return k.cut >= 1; }, 30000), 'diving onto a kite cuts it');
    await page.keyboard.up('KeyF');
    await waitFor(() => !window.__tvs.sys.Games.kite.dive, 5000);
    const kc = await ev((m0) => { const s = window.__tvs.sys; return { kites: s.Games.st().kites, money: window.__tvs.S.money - m0, dive: s.Games.kite.dive, chip: document.getElementById('funchip').textContent }; }, m0);
    ok(kc.kites === 1 && kc.money >= 150 && !kc.dive && /Kites cut: 1/.test(kc.chip), 'kite cut: +₹150, counted, chip shows it ' + JSON.stringify(kc));
    ok(await waitFor(() => /Kai po che/i.test(document.body.innerText), 8000), 'Kai po che! ribbon');
    // a kite touching yours when you are not diving cuts your string
    ok(await ev(() => { const k = window.__tvs.sys.Games.kite, r = k.rivals.find((q) => !q.falling); if (!r) return false; r.rad = 0; r.cx = k.pos.x; r.cz = k.pos.z; r.cy = k.pos.y; return true; }), 'a rival drifts right through your kite');
    await page.waitForTimeout(1500);
    ok(await ev(() => window.__tvs.sys.Games.kite.hurt === 0), '...and nothing happens when it is just drifting');
    await ev(() => { const k = window.__tvs.sys.Games.kite; for (const r of k.rivals) { r.rad = 4; r.cx = k.pos.x + 14; r.cz = k.pos.z + 14; r.cy = k.pos.y - 8; } });
    ok(await waitFor(() => { const k = window.__tvs.sys.Games.kite; if (k.L > 20 && !k.rivals.some((q) => q.atk !== null)) k.atkT = 0; return k.rivals.some((q) => q.atk !== null); }, 30000), 'now and then a kite swoops at yours');
    ok(await waitFor(() => window.__tvs.sys.Games.kite.hurt > 0, 30000), 'if you do not dive in time it cuts your string');
    await ev(() => document.getElementById('funchip').click());
    const ks = await ev(() => { const s = window.__tvs.sys, b = document.getElementById('gamebtn'); return { mode: s.Games.mode, kite: s.Games.kite, aim: s.Cam.aim, btn: b.hidden, chip: document.getElementById('funchip').hidden }; });
    ok(ks.mode === null && ks.kite === null && ks.aim === null && ks.btn && ks.chip, 'tapping the chip ends the game cleanly ' + JSON.stringify(ks));

    // ---- gully cricket ----
    const m1 = await ev(() => window.__tvs.S.money);
    await ev(() => window.__tvs.sys.Games.cricketStart());
    const c0 = await ev(() => { const s = window.__tvs.sys, G = s.Games, c = G.cr; return c && { mode: G.mode, intro: !!s.Cam.intro, bowler: !!(G.bowler && G.bowler.visible), at: Math.hypot(s.Player.x - c.p.bx, s.Player.z - c.p.bz), btn: document.getElementById('gamebtn').textContent }; });
    ok(c0 && c0.mode === 'cricket' && c0.intro && c0.bowler && c0.at < 0.01 && /Hit/.test(c0.btn), 'cricket: batting at the crease with a bowler ' + JSON.stringify(c0));
    // you cannot walk away while batting
    const pz = await ev(() => ({ x: window.__tvs.sys.Player.x, z: window.__tvs.sys.Player.z }));
    await page.keyboard.down('KeyW'); await page.waitForTimeout(700); await page.keyboard.up('KeyW');
    ok(await ev((p) => Math.hypot(window.__tvs.sys.Player.x - p.x, window.__tvs.sys.Player.z - p.z) < 0.01, pz), 'the stick does not walk you off the crease');
    const plan = [0, -0.1, 0.17, 0.25, 0, null];   // seconds early/late: SIX, FOUR, 2, 1, SIX, miss
    let pressed = false, shotDone = false;
    for (let i = 0; i < 6; i++) {
      const got = await waitFor((i) => { const c = window.__tvs.sys.Games.cr; if (!c || c.bn !== i) return false; if (c.state === 'wait' && c.t < 0) c.t = 0; if (c.state === 'runup') c.t = Math.max(c.t, 1.25); return c.state === 'ball'; }, 40000, i);
      if (!got) { ok(false, 'ball ' + (i + 1) + ' was not bowled'); break; }
      if (i === 0) {
        pressed = await ev(() => { const b = document.getElementById('gamebtn'); b.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, pointerId: 7 })); b.dispatchEvent(new PointerEvent('pointerup', { bubbles: true, pointerId: 7 })); return window.__tvs.sys.Games.cr.press !== null; });
      }
      await ev((e) => { const c = window.__tvs.sys.Games.cr; c.press = e === null ? null : c.T + e; }, plan[i]);
      if (i === 0) { await waitFor(() => /SIX/i.test(document.body.innerText), 8000); await page.waitForTimeout(250); await shot(page, 'games_cricket'); shotDone = true; }
      await waitFor((i) => { const c = window.__tvs.sys.Games.cr; if (!c) return true; if (c.state === 'flight' && c.t < 2.5) c.t = 2.5; if (c.state === 'done' && c.t < 1.5) c.t = 1.5; return c.bn > i; }, 40000, i);
    }
    ok(pressed && shotDone, 'the Hit button swings the bat');
    const ce = await ev((m1) => { const s = window.__tvs.sys; return { mode: s.Games.mode, best: s.Games.st().best, money: window.__tvs.S.money - m1, intro: !!s.Cam.intro, bowler: s.Games.bowler.visible, ball: s.Games.cr }; }, m1);
    ok(ce.mode === null && ce.best === 19 && ce.money >= 570 && !ce.intro && !ce.bowler && ce.ball === null, 'innings over: 19 runs saved as best, ₹30 a run, camera back ' + JSON.stringify(ce));
    ok(await waitFor(() => /Innings over/i.test(document.body.innerText), 10000), 'Innings over ribbon');

    // ---- fishing: far away it points you to the lake ----
    const f0 = await ev(() => { const s = window.__tvs.sys; const v = s.Vehicles.player[0]; s.Player.x = v.x + 2; s.Player.z = v.z; s.Games.fishStart(); return { mode: s.Games.mode, wp: window.__tvs.S.waypoint && window.__tvs.S.waypoint.name }; });
    ok(f0.mode === null && /ghat/i.test(f0.wp || ''), 'away from the lake: a gold arrow to the ghat ' + JSON.stringify(f0));
    const m2 = await ev(() => window.__tvs.S.money);
    await ev(() => { const s = window.__tvs.sys, g = s.POI.ghat; s.Player.x = g.x; s.Player.z = g.z; s.Player.y = s.World.groundHeight(g.x, g.z); s.Games.fishStart(); });
    const fs0 = await ev(() => { const s = window.__tvs.sys, f = s.Games.fs; return f && { mode: s.Games.mode, btn: document.getElementById('gamebtn').textContent, d: Math.hypot(f.tx - s.Player.x, f.tz - s.Player.z) }; });
    ok(fs0 && fs0.mode === 'fish' && /Pull/.test(fs0.btn) && fs0.d >= 7, 'fishing: the line is cast into the lake ' + JSON.stringify(fs0));
    ok(await waitFor(() => { const f = window.__tvs.sys.Games.fs; return f && f.state === 'wait'; }, 20000), 'the float lands in the water');
    await ev(() => window.__tvs.sys.Games.fishPull());
    ok(await ev(() => window.__tvs.sys.Games.fs.state === 'recast'), 'pulling too early scares the fish');
    ok(await waitFor(() => { const f = window.__tvs.sys.Games.fs; if (f.state === 'wait') f.t = Math.max(f.t, f.wait); if (f.state === 'bite') f.t = -6; return f.state === 'bite'; }, 20000), 'a fish bites (the float dips)');
    await page.keyboard.press('KeyF');
    ok(await waitFor(() => window.__tvs.sys.Games.fs.state === 'catch', 8000), 'F pulls the fish out');
    await shot(page, 'games_fish');
    const fc = await ev((m2) => { const s = window.__tvs.sys, g = s.Games.st(); return { n: Object.values(g.fish).reduce((a, b) => a + b, 0), money: window.__tvs.S.money - m2 }; }, m2);
    ok(fc.n === 1 && fc.money > 0, 'fish counted and sold ' + JSON.stringify(fc));
    await ev(() => window.__tvs.sys.Emote.play('wave'));
    ok(await ev(() => !window.__tvs.sys.Games.mode && !window.__tvs.sys.Games.fs), 'a funny move puts the rod away');

    // ---- the lucky wheel ----
    const before = await ev(() => { const S = window.__tvs.S; return { money: S.money, inv: JSON.stringify(S.inv), hat: S.player.look && S.player.look.hat, wp: !!S.waypoint }; });
    await ev(() => { window.__tvs.S.waypoint = null; const G = window.__tvs.sys.Games, o = G.spin; G.spin = function (cv, done, fast) { const k = o.call(this, cv, done, fast); window.__k = k; return k; }; G.wheel(); });
    ok(await ev(() => !!document.querySelector('#modal .wheelcv') && /Spin/.test(document.querySelector('#modal .btn.acc').textContent)), 'wheel sheet with a Spin button');
    await shot(page, 'games_wheel');
    await ev(() => document.querySelector('#modal .btn.acc').click());
    ok(await waitFor(() => /You won/i.test(document.body.innerText), 20000), 'the wheel spins and you win');
    const won = await ev(() => { const G = window.__tvs.sys.Games, S = window.__tvs.S, seg = ((Math.round(-G.wdeg / 45) % 8) + 8) % 8; return { k: window.__k, seg, can: G.canSpin(), money: S.money, inv: JSON.stringify(S.inv), hat: S.player.look && S.player.look.hat, wp: !!S.waypoint }; });
    const got = won.money > before.money || won.inv !== before.inv || won.hat === 'turban' || won.wp;
    ok(won.k === won.seg, 'the pointer stops on the prize you get ' + JSON.stringify({ k: won.k, seg: won.seg }));
    ok(got && !won.can, 'prize given, next spin tomorrow ' + JSON.stringify(won));
    await ev(() => window.__tvs.sys.Games.wheel());
    ok(await ev(() => { const b = document.querySelector('#modal .btn.acc'); return b.disabled && /tomorrow/.test(b.textContent); }), 'only one free spin a day');
    await ev(() => window.__tvs.sys.UI.close());

    // ---- the activities sheet lists the games with your records ----
    await ev(() => window.__tvs.sys.Fun.open());
    const act = await ev(() => document.getElementById('modal').innerText);
    ok(/Kite fights · 1 kites cut/.test(act) && /Best: 19 runs/.test(act) && /1 fish caught/.test(act) && /Next free spin tomorrow/.test(act) && /Holi colours/.test(act), 'activities sheet lists the games and records');
    await ev(() => window.__tvs.sys.UI.close());
    // records are kept in the save
    ok(await ev(() => { const g = window.__tvs.S.fun.games; return g.kites === 1 && g.best === 19 && !!g.spin; }), 'records live in the saved game');
    const errs = logs.filter((l) => /pageerror|\[error\]/.test(l) && !/favicon|net::|Failed to load resource/.test(l));
    ok(errs.length === 0, 'no page errors ' + JSON.stringify(errs.slice(0, 3)));
  } catch (e) { console.log('FAIL exception', e.message); process.exitCode = 1; }
  await browser.close();
})();
