// Extras: new-game difficulty, the first-time "How to play" card, the pet dog, trophies,
// the daily gift, photo mode with save/share, and easy-mode crop care.
const { open, waitReady, ROOT } = require('./harness.cjs');
const path = require('path');
const shot = (page, n) => page.screenshot({ path: path.join(ROOT, 'shots', n + '.png'), timeout: 120000 }).catch((e) => console.log('shot failed', n, e.message));
const ok = (c, msg) => console.log((c ? 'PASS ' : 'FAIL ') + msg);
(async () => {
  const vp = process.argv[2] === 'desk' ? { width: 1366, height: 768 } : { width: 915, height: 412 };
  const { browser, page, logs } = await open({ mobile: process.argv[2] !== 'desk', viewport: vp, popups: true });
  const ev = (fn, a) => page.evaluate(fn, a);
  const waitFor = async (fn, ms = 20000, a) => { const t0 = Date.now(); while (Date.now() - t0 < ms) { if (await page.evaluate(fn, a)) return true; await page.waitForTimeout(300); } return false; };
    try {
    await waitReady(page);
    await ev(() => { window.__tvs.sys.Settings.v.voice = false; });
    // 1) new game form: difficulty choice, Easy picked by default
    await page.waitForSelector('#tactions .tbtn', { timeout: 60000 });
    await ev(() => { const b = [...document.querySelectorAll('#tactions .tbtn')].find((x) => /New game|కొత్త ఆట/.test(x.textContent)); b.click(); });
    await page.waitForTimeout(500);
    const form = await ev(() => ({ dif: [...document.querySelectorAll('#newgame .dif button')].map((b) => b.textContent + (b.classList.contains('on') ? ' [on]' : '')) }));
    ok(form.dif.length === 2 && /\[on\]/.test(form.dif[0]), 'difficulty choice ' + JSON.stringify(form.dif));
    await shot(page, 'x_newgame');
    await ev(() => { const b = [...document.querySelectorAll('#newgame .tbtn')].pop(); b.click(); });
    await waitFor(() => window.__tvs.S && window.__tvs.sys.Extras && document.getElementById('hud').hidden === false, 30000);
    // 2) how to play shows once, by itself
    await waitFor(() => { const s = window.__tvs.sys.UI; return !document.getElementById('modal').hidden && s.sheetState && s.sheetState.kind === 'howto'; }, 30000);
    let st = await ev(() => ({ started: window.__tvs.G ? true : !!window.__tvs.sys.Game, easy: window.__tvs.S.easy, modal: !document.getElementById('modal').hidden, kind: window.__tvs.sys.UI.sheetState && window.__tvs.sys.UI.sheetState.kind }));
    ok(st.easy === true, 'new game is easy mode');
    ok(st.modal && st.kind === 'howto', 'how-to-play card opened: ' + st.kind);
    await shot(page, 'x_howto');
    await ev(() => document.querySelector('#modal .btn.acc.big').click());
    await page.waitForTimeout(400);
    st = await ev(() => ({ modal: !document.getElementById('modal').hidden, seen: window.__tvs.sys.Settings.v.seenHowTo }));
    ok(!st.modal && st.seen === true, 'how-to closed and remembered');
    // 3) pet: home menu offers a puppy; adopt; it follows; pat it
    const home = await ev(() => { const s = window.__tvs.sys; s.UI.homeMenu(); const t = document.getElementById('modal').textContent; s.UI.close(); return t; });
    ok(/puppy/.test(home), 'home menu offers a puppy');
    await ev(() => window.__tvs.sys.Pet.menu());
    await page.waitForTimeout(300);
    await shot(page, 'x_pet_menu');
    await ev(() => document.querySelector('#modal .btn.pet').click());
    await page.waitForTimeout(800);
    let pet = await ev(() => { const s = window.__tvs.sys; return { has: !!window.__tvs.S.pet, a: !!s.Pet.a, name: s.Pet.name() }; });
    ok(pet.has && pet.a && pet.name === 'Moti', 'adopted ' + JSON.stringify(pet));
    await ev(() => { const P = window.__tvs.sys.Player; P.x += 22; P.z += 6; });
    await waitFor(() => { const s = window.__tvs.sys; const P = s.Player.pos(); return Math.hypot(s.Pet.a.x - P.x, s.Pet.a.z - P.z) < 6; }, 20000);
    let d = await ev(() => { const s = window.__tvs.sys; const P = s.Player.pos(); return Math.hypot(s.Pet.a.x - P.x, s.Pet.a.z - P.z); });
    ok(d < 6, 'dog followed (distance ' + d.toFixed(1) + ' m)');
    await ev(() => { const P = window.__tvs.sys.Player; P.x -= 160; P.y = window.__tvs.sys.World.groundHeight(P.x, P.z); });
    await waitFor(() => { const s = window.__tvs.sys; const P = s.Player.pos(); return Math.hypot(s.Pet.a.x - P.x, s.Pet.a.z - P.z) < 8; }, 20000);
    d = await ev(() => { const s = window.__tvs.sys; const P = s.Player.pos(); return Math.hypot(s.Pet.a.x - P.x, s.Pet.a.z - P.z); });
    ok(d < 8, 'dog caught up after a long jump (distance ' + d.toFixed(1) + ' m)');
    await page.waitForTimeout(1500);
    const pat = await ev(() => { const s = window.__tvs.sys; s.Player.speed = 0; const a = s.Pet.a; s.Player.x = a.x + 1; s.Player.z = a.z + 0.5; window.__tvs.S.player.energy = 50; s.Interact.update(); const ids = s.Interact.current.map((o) => o.id); const o = s.Interact.current.find((x) => x.id === 'pat'); if (o) o.act(); return { ids, energy: window.__tvs.S.player.energy }; });
    ok(pat.ids.includes('pat') && pat.energy === 60, 'pat the dog ' + JSON.stringify(pat));
    await shot(page, 'x_pet');
    // 4) trophies: adopting the dog wins one; the office tab lists them all
    await waitFor(() => !!window.__tvs.S.trophies.pet, 30000);
    const tr = await ev(() => ({ got: Object.keys(window.__tvs.S.trophies) }));
    ok(tr.got.includes('pet'), 'trophy for the dog ' + JSON.stringify(tr.got));
    await ev(() => window.__tvs.sys.UI.office('trophies'));
    await page.waitForTimeout(400);
    const tt = await ev(() => ({ n: document.querySelectorAll('#modal .troph').length, won: document.querySelectorAll('#modal .troph:not(.locked)').length, tab: [...document.querySelectorAll('#modal .tabs button')].map((b) => b.textContent).find((t) => /Troph/.test(t)) }));
    ok(tt.n >= 20 && tt.won >= 1, 'trophy tab ' + JSON.stringify(tt));
    await shot(page, 'x_trophies');
    await ev(() => window.__tvs.sys.UI.close());
    // 5) daily gift: pops up after the tutorial; collect; streak from yesterday; closing still gives it
    const m0 = await ev(() => window.__tvs.S.money);
    await ev(() => { const S = window.__tvs.S; S.missions.tut = 99; S.daily.last = null; });
    await waitFor(() => { const s = window.__tvs.sys.UI; return !document.getElementById('modal').hidden && s.sheetState && s.sheetState.kind === 'gift'; }, 30000);
    st = await ev(() => ({ modal: !document.getElementById('modal').hidden, kind: window.__tvs.sys.UI.sheetState && window.__tvs.sys.UI.sheetState.kind, boxes: document.querySelectorAll('#modal .gift').length }));
    ok(st.modal && st.kind === 'gift' && st.boxes === 7, 'daily gift popped up ' + JSON.stringify(st));
    await shot(page, 'x_gift1');
    await ev(() => document.querySelector('#modal .btn.acc.big').click());
    await page.waitForTimeout(400);
    const g1 = await ev((m0) => ({ gain: Math.round(window.__tvs.S.money - m0), daily: window.__tvs.S.daily, due: window.__tvs.sys.DailyGift.due(), modal: !document.getElementById('modal').hidden }), m0);
    ok(g1.gain >= 1000 && !g1.due && !g1.modal && g1.daily.streak === 1, 'collected day 1 ' + JSON.stringify(g1));
    await ev(() => { const D = window.__tvs.S.daily; const y = new Date(); y.setDate(y.getDate() - 1); D.last = `${y.getFullYear()}-${String(y.getMonth() + 1).padStart(2, '0')}-${String(y.getDate()).padStart(2, '0')}`; D.streak = 3; });
    await waitFor(() => { const s = window.__tvs.sys.UI; return !document.getElementById('modal').hidden && s.sheetState && s.sheetState.kind === 'gift'; }, 30000);
    st = await ev(() => ({ kind: window.__tvs.sys.UI.sheetState && window.__tvs.sys.UI.sheetState.kind, now: (document.querySelector('#modal .gift.now small') || {}).textContent }));
    ok(st.kind === 'gift' && /4/.test(st.now), 'streak continues to day 4 ' + JSON.stringify(st));
    await shot(page, 'x_gift4');
    const m1 = await ev(() => window.__tvs.S.money);
    await ev(() => window.__tvs.sys.UI.close());
    const g4 = await ev((m1) => ({ gain: Math.round(window.__tvs.S.money - m1), streak: window.__tvs.S.daily.streak }), m1);
    ok(g4.gain >= 2500 && g4.streak === 4, 'closing the card still gives the gift ' + JSON.stringify(g4));
    // 6) photo mode: bar with Take photo; preview with the picture
    await page.waitForTimeout(500);
    await ev(() => window.__tvs.sys.UI.photo());
    await page.waitForTimeout(600);
    const pb = await ev(() => ({ bar: !document.getElementById('photobar').hidden, btns: [...document.querySelectorAll('#photobar .pb')].map((b) => b.textContent) }));
    ok(pb.bar && pb.btns.length === 2, 'photo bar ' + JSON.stringify(pb));
    await shot(page, 'x_photomode');
    await ev(() => document.querySelector('#photobar .pb.snap').click());
    await waitFor(() => { const i = document.querySelector('#modal img.shot'); return !!i && i.complete && i.naturalWidth > 0; }, 30000);
    const ph = await ev(() => { const img = document.querySelector('#modal img.shot'); return { kind: window.__tvs.sys.UI.sheetState && window.__tvs.sys.UI.sheetState.kind, w: img ? img.naturalWidth : 0, h: img ? img.naturalHeight : 0, photoMode: window.__tvs.sys.UI.photoMode, flag: !!window.__tvs.S.flags.photo, btns: [...document.querySelectorAll('#modal .row .btn')].map((b) => b.textContent) }; });
    ok(ph.kind === 'photo' && ph.w > 300 && !ph.photoMode && ph.flag, 'photo taken ' + JSON.stringify(ph));
    await shot(page, 'x_photo');
    await ev(() => window.__tvs.sys.UI.close());
    // 7) easy mode: weeds, water loss and pests grow about half as fast on your fields
    const ez = await ev(() => {
      const s = window.__tvs.sys, S = window.__tvs.S; const f = s.Fields.byId.F1; const W = { id: 'sunny', rain: 0, cloud: 0, wind: 0.2 };
      const keep = { weeds: f.weeds, water: f.water };
      const cm = f.countMin; f.countMin = () => 1;   // pretend the field is ploughed so weeds grow
      const run = (easy) => { S.easy = easy; f.weeds = 10; f.water = 80; f.simulate(10, W); return { weeds: f.weeds - 10, water: 80 - f.water }; };
      const e = run(true), n = run(false); S.easy = true; Object.assign(f, keep); f.countMin = cm;
      return { easy: e, normal: n };
    });
    ok(ez.easy.weeds < ez.normal.weeds * 0.6 && ez.easy.water <= ez.normal.water * 0.6 + 0.01, 'easy mode halves weeds/water loss ' + JSON.stringify(ez));
    // 8) the menu has difficulty + how to play
    await ev(() => window.__tvs.sys.UI.settings());
    await page.waitForTimeout(300);
    const menu = await ev(() => document.getElementById('modal').textContent);
    ok(/Difficulty/.test(menu) && /How to play/.test(menu), 'menu has difficulty and how to play');
    await shot(page, 'x_menu');
    await ev(() => window.__tvs.sys.UI.close());
  } catch (e) { console.log('TEST ERROR', e.message); }
  console.log(logs.filter((l) => /pageerror|\[error\]/i.test(l)).slice(0, 10).join('\n'));
  await browser.close();
})();
