// Tasks, compulsory rest and the new fun: today's tasks instead of "go to the field" nagging,
// a 3-5 hour rest after a long stretch of work, the runaway rooster, a cannonball into the
// lake, the naughty monkey, and the better-looking cricket, kite and fishing scenes.
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
    await page.waitForTimeout(800);

    // ---- tasks instead of nagging ----
    ok(await waitFor(() => /Tutorial 1 of 8/i.test(document.getElementById('missions').innerText) && !!document.querySelector('#missions .tmin'), 60000), 'the tutorial card has a skip button');
    await ev(() => document.querySelector('#missions .tmin').click());
    // (the mission chain has its own test, t23: here it is paused so the card shows today's tasks)
    await ev(() => { const s = window.__tvs.sys; s.Chain.update = () => {}; window.__tvs.S.chain.cur = null; s.UI._mKey = ''; s.Coach.key = ''; });
    ok(await waitFor(() => /Today's tasks · 0\/5/i.test(document.getElementById('missions').innerText), 8000), 'after skipping: the corner card shows today\'s tasks');
    const card = await ev(() => ({ txt: document.getElementById('missions').innerText, arrow: !!window.__tvs.sys.Map2.target(), rows: document.querySelectorAll('#missions .trow').length }));
    ok(!/Go to your field|Hold Work/.test(card.txt) && !card.arrow && card.rows >= 2, 'no "go to your field and work" and no arrow pushed on you ' + JSON.stringify({ rows: card.rows, arrow: card.arrow }));
    await ev(() => document.getElementById('missions').click());
    ok(await waitFor(() => { const m = document.getElementById('modal'); return !m.hidden && /Today's tasks/.test(m.innerText) && m.querySelectorAll('.act.task').length === 5; }, 5000), 'tapping the card opens the list of 5 tasks');
    const sw = await ev(() => { const s = window.__tvs.sys, before = s.Tasks.st().list.map((e) => e.id).join(); const b = [...document.querySelectorAll('#modal .act.task button')].find((x) => /Swap/.test(x.textContent)); b.click(); return { before, after: s.Tasks.st().list.map((e) => e.id).join(), swaps: s.Tasks.st().swaps }; });
    ok(sw.before !== sw.after && sw.swaps === 0, 'one free swap a day ' + JSON.stringify(sw));
    ok(await ev(() => /Farm goals/i.test(document.getElementById('modal').innerText) && [...document.querySelectorAll('#modal button')].some((b) => /Guide me/.test(b.textContent))), 'farm goals are listed with "Guide me"');
    await shot(page, 'tasks_list');
    // Guide me puts the gold arrow on that goal; stopping takes it away
    await ev(() => [...document.querySelectorAll('#modal button')].find((b) => /Guide me/.test(b.textContent)).click());
    ok(await waitFor(() => /Guiding you/i.test(document.getElementById('missions').innerText) && document.getElementById('modal').hidden, 15000), 'Guide me: the card guides that goal step by step');
    await ev(() => document.querySelector('#missions .tmin').click());
    ok(await waitFor(() => /Today's tasks/i.test(document.getElementById('missions').innerText), 15000), 'stop guiding: back to the tasks');
    // a task done through the game itself
    const m0 = await ev(() => window.__tvs.S.money);
    await ev(() => { const S = window.__tvs.S; S.tasks.list = ['selfie', 'chai', 'pray', 'six', 'place'].map((id) => ({ id, prog: 0, done: false })); window.__tvs.sys.UI._mKey = ''; window.__tvs.sys.Emote.play('selfie'); });
    ok(await waitFor(() => window.__tvs.S.tasks.list[0].done && /1\/5/.test(document.getElementById('missions').innerText), 25000), 'taking a selfie ticks off the selfie task');
    const paid = await ev((m0) => window.__tvs.S.money - m0, m0);
    ok(paid >= 300, 'task reward paid: +' + paid);
    await ev(() => { const s = window.__tvs.sys, T = s.Tasks.st(); for (const e of T.list) if (!e.done) s.Tasks.done(e, s.TASK_POOL.find((q) => q.id === e.id)); });
    ok(await ev(() => window.__tvs.S.tasks.bonus === true), 'all five done: the bonus is paid');
    ok(await waitFor(() => /All done/i.test(document.getElementById('missions').innerText), 20000), 'the card says all done');
    await ev(() => { window.__tvs.sys.Settings.v.taskMini = true; window.__tvs.sys.UI._mKey = ''; });
    ok(await waitFor(() => document.querySelectorAll('#missions .trow').length === 0, 20000), 'the card can be folded away');
    await ev(() => { window.__tvs.sys.Settings.v.taskMini = false; window.__tvs.sys.UI._mKey = ''; });

    // ---- compulsory rest ----
    await ev(() => { const s = window.__tvs.sys, S = window.__tvs.S; S.player.workMin = s.Rest.limit() - 0.2; s.Rest.lastWork = window.__tvs.t; });
    ok(await waitFor(() => { const s = window.__tvs.sys; s.Rest.lastWork = window.__tvs.t; return window.__tvs.S.player.mustRest; }, 30000), 'after hours of work the farmer must rest');
    const rh = await ev(() => window.__tvs.S.player.restH);
    ok(rh >= 3 && rh <= 5, 'the rest is 3 to 5 hours: ' + rh);
    ok(await waitFor(() => /Time to rest/i.test(document.getElementById('missions').innerText), 5000), 'the card shows the rest with a Rest now button');
    await shot(page, 'tasks_rest');
    // no work until you rest
    await ev(() => { const s = window.__tvs.sys, f = s.Fields.byId.F1; s.Player.x = f.x; s.Player.z = f.z; });
    await page.keyboard.down('KeyF'); await page.waitForTimeout(1200);
    const wk = await ev(() => window.__tvs.sys.Player.working);
    await page.keyboard.up('KeyF');
    ok(wk === false && await waitFor(() => /Too tired to work/i.test(document.body.innerText), 5000), 'holding Work does nothing but say "too tired"');
    const t0 = await ev(() => window.__tvs.S.time.min);
    await page.keyboard.press('KeyR');
    ok(await waitFor(() => !window.__tvs.S.player.mustRest && !window.__tvs.sys.Rest.busy, 40000), 'R rests');
    const rs = await ev((t0) => ({ hrs: (window.__tvs.S.time.min - t0) / 60, work: window.__tvs.S.player.workMin, en: window.__tvs.S.player.energy }), t0);
    ok(rs.hrs >= rh - 0.05 && rs.work === 0, 'hours passed and the tiredness is gone ' + JSON.stringify(rs));

    // ---- the runaway rooster ----
    await ev(() => window.__tvs.sys.Games.roosterStart());
    ok(await ev(() => window.__tvs.sys.Games.mode === 'rooster' && window.__tvs.sys.Games.rc.a.visible && /Catch/.test(document.getElementById('gamebtn').textContent)), 'a rooster runs off: Catch button');
    await page.waitForTimeout(800);
    await shot(page, 'fun_rooster');
    const far = await ev(() => { const G = window.__tvs.sys.Games; const b = document.getElementById('gamebtn'); b.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, pointerId: 3 })); b.dispatchEvent(new PointerEvent('pointerup', { bubbles: true, pointerId: 3 })); return G.mode; });
    ok(far === 'rooster' || await ev(() => (window.__tvs.S.fun.games.roosters || 0) === 1), 'grabbing from far away misses');
    ok(await waitFor(() => { const s = window.__tvs.sys, G = s.Games; if (G.mode !== 'rooster') return true; const a = G.rc.a; s.Player.x = a.x + 0.5; s.Player.z = a.z; G.rc.miss = 0; G.roosterTry(); return G.mode !== 'rooster'; }, 20000), 'caught when close');
    ok(await ev(() => window.__tvs.S.fun.games.roosters === 1 && !window.__tvs.sys.Games.rooster.visible), 'rooster counted and put away');

    // ---- cannonball into the lake ----
    await ev(() => { const s = window.__tvs.sys, g = s.POI.ghat; s.Player.x = g.x; s.Player.z = g.z; s.Player.y = s.World.groundHeight(g.x, g.z); s.Games.jumpStart(); });
    ok(await ev(() => window.__tvs.sys.Games.mode === 'jump'), 'at the ghat: jump');
    ok(await waitFor(() => { const j = window.__tvs.sys.Games.jp; return j && j.ph === 'air' && j.t > 0.45; }, 40000), 'up in the air');
    await shot(page, 'fun_jump_air');
    ok(await waitFor(() => { const j = window.__tvs.sys.Games.jp; return j && j.ph === 'swim' && j.t > 0.4; }, 40000), 'splash, then swimming');
    const sw2 = await ev(() => { const s = window.__tvs.sys; return { y: s.Player.y, wy: s.World.lake.position.y, pose: s.Player.h.pose }; });
    ok(sw2.y < sw2.wy && sw2.pose === 'swim', 'in the water, swimming ' + JSON.stringify(sw2));
    await shot(page, 'fun_jump_swim');
    ok(await waitFor(() => !window.__tvs.sys.Games.mode, 60000), 'climbs out');
    const out = await ev(() => { const s = window.__tvs.sys; return { splash: window.__tvs.S.fun.games.splash, wet: s.Games.drip > 0, land: s.Player.y >= s.World.groundHeight(s.Player.x, s.Player.z) - 0.05 }; });
    ok(out.splash === 1 && out.land, 'back on the steps, dripping wet ' + JSON.stringify(out));

    // ---- the naughty monkey takes your cap ----
    await ev(() => { const s = window.__tvs.sys, S = window.__tvs.S; S.player.look = Object.assign({}, S.player.look, { hat: 'cap', hatCol: '#c0392b' }); s.Wardrobe.apply();
      const t = (s.Veg.lists.neem || s.Veg.lists.banyan || [])[0]; s.Player.x = t.x + 14; s.Player.z = t.z; s.Player.y = s.World.groundHeight(s.Player.x, s.Player.z); s.Games.monkeyStart(false); });
    ok(await ev(() => window.__tvs.sys.Games.mode === 'monkey'), 'a monkey comes down from the tree');
    ok(await waitFor(() => { const m = window.__tvs.sys.Games.mk; return m && (m.ph === 'flee' || m.ph === 'climb' || m.ph === 'tease'); }, 60000), 'it grabs your cap and runs');
    ok(await ev(() => window.__tvs.S.player.look.hat === 'none' && !!window.__tvs.S.waypoint), 'cap gone from your head; the gold arrow points at the monkey');
    ok(await waitFor(() => { const m = window.__tvs.sys.Games.mk; return m && m.ph === 'tease'; }, 60000), 'it sits in a tree, teasing');
    await ev(() => { const s = window.__tvs.sys, a = s.Games.mk.a; s.Player.x = a.x + 4; s.Player.z = a.z; s.Player.y = s.World.groundHeight(s.Player.x, s.Player.z); });
    ok(await waitFor(() => { const b = document.getElementById('gamebtn'); return b && !b.hidden && /banana/i.test(b.textContent); }, 15000), 'close by: Throw a banana');
    await shot(page, 'fun_monkey');
    await ev(() => { const b = document.getElementById('gamebtn'); b.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, pointerId: 4 })); b.dispatchEvent(new PointerEvent('pointerup', { bubbles: true, pointerId: 4 })); });
    ok(await waitFor(() => (window.__tvs.S.fun.games.monkeys || 0) === 1, 30000), 'the monkey swaps your cap for the banana');
    ok(await ev(() => window.__tvs.S.player.look.hat === 'cap'), 'cap back on your head');
    ok(await waitFor(() => !window.__tvs.sys.Games.mode, 120000), 'the monkey wanders off');

    // ---- the new look of the old games ----
    await ev(() => window.__tvs.sys.Games.cricketStart());
    ok(await ev(() => { const G = window.__tvs.sys.Games; return G.mode === 'cricket' && G.cr.field.children.length >= 2 && G.kids.filter((k) => k.h.visible).length >= 5; }), 'cricket ground: pitch, creases, flags and fielders');
    ok(await waitFor(() => { const c = window.__tvs.sys.Games.cr; if (!c) return false; if (c.state === 'wait' && c.t < 0) c.t = 0; if (c.state === 'runup') c.t = Math.max(c.t, 1.2); return c.state === 'ball'; }, 40000), 'the ball is bowled');
    await shot(page, 'look_cricket');
    await ev(() => { const c = window.__tvs.sys.Games.cr; c.press = c.T; });
    ok(await waitFor(() => { const c = window.__tvs.sys.Games.cr; return c && c.state === 'flight' && c.t > 0.5; }, 20000), 'SIX: the camera follows the ball');
    await shot(page, 'look_cricket_six');
    ok(await ev(() => /6 ○ ○ ○ ○ ○/.test(document.getElementById('funchip').textContent)), 'scoreboard in the chip: ' + await ev(() => document.getElementById('funchip').textContent));
    await ev(() => window.__tvs.sys.Games.stop());
    await ev(() => window.__tvs.sys.Games.kiteStart());
    ok(await waitFor(() => { const k = window.__tvs.sys.Games.kite; return k && k.L > 25 && k.sky.length === 9; }, 120000), 'kites: yours, rivals and a sky full of kites');
    await shot(page, 'look_kite');
    await ev(() => window.__tvs.sys.Games.stop());
    await ev(() => { const s = window.__tvs.sys, g = s.POI.ghat; s.Player.x = g.x; s.Player.z = g.z; s.Player.y = s.World.groundHeight(g.x, g.z); s.Games.fishStart(); });
    ok(await waitFor(() => { const f = window.__tvs.sys.Games.fs; return f && f.state === 'wait'; }, 30000), 'fishing: rod, float and basket');
    await page.waitForTimeout(1500);
    await shot(page, 'look_fish');
    ok(await waitFor(() => { const f = window.__tvs.sys.Games.fs; if (f.state === 'wait') f.t = Math.max(f.t, f.wait); if (f.state === 'bite') { f.t = -6; window.__tvs.sys.Games.fishPull(); } return f.state === 'catch' && f.t > 0.4; }, 30000), 'a fish jumps out');
    await shot(page, 'look_fish_catch');
    ok(await waitFor(() => window.__tvs.sys.Games.fs.inBasket.length === 1, 20000), 'into the basket');
    await ev(() => window.__tvs.sys.Games.stop());

    const errs = logs.filter((l) => /pageerror|\[error\]/.test(l) && !/favicon|net::|Failed to load resource/.test(l));
    ok(errs.length === 0, 'no page errors ' + JSON.stringify(errs.slice(0, 3)));
  } catch (e) { console.log('FAIL exception', e.message); process.exitCode = 1; }
  await browser.close();
})();
