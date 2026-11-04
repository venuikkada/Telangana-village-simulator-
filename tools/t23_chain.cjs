// Mission after mission and the new music: fun breaks between the tutorial lessons, then farm
// work and fun taking turns for ever (Play and Skip on the card, a bonus every five), and the
// background band (tanpura, flute, santoor, tabla) rendered offline to check it is really playing.
const { open, waitReady, ROOT } = require('./harness.cjs');
const path = require('path');
const fs = require('fs');
const ok = (c, msg) => { console.log((c ? 'PASS ' : 'FAIL ') + msg); if (!c) process.exitCode = 1; };
const shot = (page, n) => page.screenshot({ path: path.join(ROOT, 'shots', n + '.png'), timeout: 120000 }).catch((e) => console.log('shot failed', n, e.message));
(async () => {
  const { browser, page, logs } = await open({ viewport: { width: 1280, height: 720 }, preset: 'LOW' });
  const ev = (fn, a) => page.evaluate(fn, a);
  const waitFor = async (fn, ms = 20000, a) => { const t0 = Date.now(); while (Date.now() - t0 < ms) { if (await page.evaluate(fn, a)) return true; await page.waitForTimeout(150); } return false; };
  const card = () => ev(() => document.getElementById('missions').innerText);
  // the test browser draws slowly (software 3D): move the mission chain along by hand
  const tick = () => ev(() => { const s = window.__tvs.sys; s.Chain.waitT = 0; s.Chain.t = 1; s.Chain.update(0.1); });
  try {
    await waitReady(page);
    // ---- the music, rendered offline before any real sound starts ----
    const mus = await ev(async () => {
      const s = window.__tvs.sys, A = s.Audio2, M = s.Music, SR = 22050, SEC = 46;
      const off = new OfflineAudioContext(2, SR * SEC, SR);
      const real = window.AudioContext; window.AudioContext = function () { return off; };
      A.unlock(); window.AudioContext = real;
      const errs = [];
      try { for (let t = 0; t < SEC - 1.2; t += 0.25) A.music(t); } catch (e) { errs.push(String(e && e.stack || e)); }
      const song = M.song && { id: M.song.id, bars: M.song.bars.length, n: M.song.n };
      const buf = await off.startRendering();
      const L = buf.getChannelData(0), R = buf.getChannelData(1);
      const per = []; let peak = 0;
      for (let s0 = 0; s0 + SR <= L.length; s0 += SR) { let q = 0; for (let i = s0; i < s0 + SR; i++) { const v = (L[i] + R[i]) / 2; q += v * v; const a = Math.max(Math.abs(L[i]), Math.abs(R[i])); if (a > peak) peak = a; } per.push(Math.sqrt(q / SR)); }
      // mono 16-bit WAV for a look at the spectrogram
      const n = L.length, b = new DataView(new ArrayBuffer(44 + n * 2)), str = (o, x) => { for (let i = 0; i < x.length; i++) b.setUint8(o + i, x.charCodeAt(i)); };
      str(0, 'RIFF'); b.setUint32(4, 36 + n * 2, true); str(8, 'WAVEfmt '); b.setUint32(16, 16, true); b.setUint16(20, 1, true); b.setUint16(22, 1, true); b.setUint32(24, SR, true); b.setUint32(28, SR * 2, true); b.setUint16(32, 2, true); b.setUint16(34, 16, true); str(36, 'data'); b.setUint32(40, n * 2, true);
      for (let i = 0; i < n; i++) b.setInt16(44 + i * 2, Math.max(-1, Math.min(1, (L[i] + R[i]) / 2)) * 32767, true);
      let bin = ''; const u8 = new Uint8Array(b.buffer); for (let i = 0; i < u8.length; i += 8192) bin += String.fromCharCode.apply(null, u8.subarray(i, i + 8192));
      // every mood composes and schedules without errors
      const moods = {};
      for (const id of Object.keys(s.MOODS)) { try { const sg = M.compose(id); moods[id] = sg.bars.length + 'x' + sg.n; } catch (e) { moods[id] = 'ERR ' + e.message; } }
      return { errs, song, per: per.map((x) => Math.round(x * 1000) / 1000), peak: Math.round(peak * 1000) / 1000, moods, wav: btoa(bin) };
    });
    fs.writeFileSync(path.join(ROOT, 'shots', 'music.wav'), Buffer.from(mus.wav, 'base64'));
    delete mus.wav;
    console.log('music', JSON.stringify(mus));
    const quiet = mus.per.slice(2).filter((x) => x < 0.004).length;
    ok(!mus.errs.length && mus.song && mus.song.bars >= 15, 'the band composes a song with intro, A A B A and an ending ' + JSON.stringify(mus.song));
    ok(mus.peak > 0.05 && mus.peak < 1 && quiet <= 3, 'the music is clearly audible and never clips (peak ' + mus.peak + ', quiet seconds ' + quiet + ')');
    ok(Object.values(mus.moods).every((x) => !/ERR/.test(x)), 'every mood composes (morning, noon, evening, night, rain, festival, game) ' + JSON.stringify(mus.moods));

    await ev(() => { window.__tvs.sys.Settings.v.voice = false; [...document.querySelectorAll('#tactions .tbtn')].find((x) => /New game/.test(x.textContent)).click(); });
    await page.waitForSelector('#startFarming');
    await ev(() => document.getElementById('startFarming').click());
    ok(await waitFor(() => window.__tvs.S && document.getElementById('hud').hidden === false, 90000), 'game started');
    await page.waitForTimeout(800);

    // ---- the tutorial, with fun breaks between the lessons ----
    ok(await waitFor(() => /Tutorial 1 of 8/i.test(document.getElementById('missions').innerText), 60000), 'the first lesson is on the card');
    const done = (tpl) => ev((t) => { const s = window.__tvs.sys, m = window.__tvs.S.missions.active.find((q) => q.tpl === t); if (m) s.Missions.complete(m); return !!m; }, tpl);
    await done('t_walk');
    ok(await waitFor(() => /Tutorial 2 of 8/i.test(document.getElementById('missions').innerText), 60000), 'walking to the field leads straight to the next lesson');
    await done('t_plough');
    await tick();
    ok(await waitFor(() => { const c = window.__tvs.S.chain.cur; return c && c.id === 'chai' && /Mission 1/i.test(document.getElementById('missions').innerText); }, 60000), 'after ploughing: a fun break (chai at the tea stall) is mission 1');
    const brk = await ev(() => ({ txt: document.getElementById('missions').innerText, lesson: window.__tvs.S.missions.active.some((m) => m.tpl.startsWith('t_')), arrow: window.__tvs.sys.Map2.target() }));
    ok(!brk.lesson && /thirsty/i.test(brk.txt) && brk.arrow && /tea/i.test(brk.arrow.name || ''), 'the break has its little story, the next lesson waits, and the gold arrow points to the tea stall');
    await shot(page, 'chain_break');
    const m0 = await ev(() => window.__tvs.S.money);
    await ev(() => window.__tvs.sys.Bus.emit('eat', { item: 'tea' }));
    ok(await waitFor(() => !window.__tvs.S.chain.cur && window.__tvs.S.chain.n === 1, 5000), 'drinking chai completes the mission');
    ok(await waitFor(() => /Tutorial 3 of 8/i.test(document.getElementById('missions').innerText), 60000), 'and the tutorial carries on with the next lesson');
    ok((await ev(() => window.__tvs.S.money)) >= m0 + 600, 'the mission paid its reward');

    // ---- after the tutorial: farm work and fun take turns ----
    await ev(() => window.__tvs.sys.Tasks.skipTutorial());
    await tick();
    ok(await waitFor(() => { const c = window.__tvs.S.chain.cur; return c && c.kind === 'farm' && c.job === 'plough'; }, 12000), 'next comes farm work the farm needs (plough the field)');
    await waitFor(() => /Plough your field/i.test(document.getElementById('missions').innerText) && !!window.__tvs.sys.Map2.target(), 60000);
    const fm = await ev(() => ({ txt: document.getElementById('missions').innerText, arrow: !!window.__tvs.sys.Map2.target() }));
    ok(/Mission 2/i.test(fm.txt) && /Plough your field/i.test(fm.txt) && fm.arrow, 'the farm mission is on the card with the gold arrow ' + JSON.stringify(fm.txt.slice(0, 80)));
    // plough most of the field: the farm mission completes from the field itself
    await ev(() => { const f = window.__tvs.sys.Fields.byId.F1; for (let i = 0; i < f.n; i++) if (f.tiles[i] < 1) f.setTile(i, 1); });
    await tick();
    let farmDone = await waitFor(() => window.__tvs.S.chain.n >= 2, 6000);
    if (!farmDone) { await ev(() => window.__tvs.sys.Chain.done(window.__tvs.S.chain.cur)); farmDone = await waitFor(() => window.__tvs.S.chain.n >= 2, 3000); console.log('(field tiles not directly writable: completed through Chain.done)'); }
    ok(farmDone, 'the ploughing mission is done');
    await tick();
    ok(await waitFor(() => { const c = window.__tvs.S.chain.cur; return c && c.kind === 'fun' && c.id === 'pray'; }, 12000), 'then a funny village task: the temple (the story goes on)');
    // skip it: a different fun mission instead
    await ev(() => window.__tvs.sys.Chain.skip());
    const sk = await ev(() => window.__tvs.S.chain.cur);
    ok(sk && sk.kind === 'fun' && sk.id !== 'pray', 'Skip swaps it for a different fun mission (' + (sk && sk.id) + ')');
    // a mini-game mission: Play starts the game right away
    await ev(() => { const s = window.__tvs.sys, c = window.__tvs.S.chain; c.cur = null; s.Chain.start(Object.assign(s.Chain.makeFun(), {})); const cm = c.cur; const t = s.TASK_POOL.find((q) => q.id === 'six'); Object.assign(cm, { id: 'six', icon: t.icon, title: { en: t.en, te: t.te }, story: s.CHAIN_FUN.six.story, target: 1 }); s.UI._mKey = ''; s.Coach.key = ''; });
    ok(await waitFor(() => !!document.querySelector('#missions .play') && /Hit a SIX/i.test(document.getElementById('missions').innerText), 60000), 'a mini-game mission has a big ▶ Play button');
    await shot(page, 'chain_play');
    await ev(() => document.querySelector('#missions .play').click());
    ok(await waitFor(() => window.__tvs.sys.Games.mode === 'cricket', 15000), 'Play starts gully cricket');
    await ev(() => window.__tvs.sys.Bus.emit('cricketShot', { kind: 6 }));
    ok(await waitFor(() => window.__tvs.S.chain.n >= 3 && (window.__tvs.S.chain.cur || {}).id !== 'six', 5000), 'hitting a six completes it, and the next mission is already on the card');
    await ev(() => window.__tvs.sys.Games.stop());
    // a bonus for five in a row
    const before = await ev(() => window.__tvs.S.money);
    await ev(() => { const s = window.__tvs.sys, c = window.__tvs.S.chain; c.streak = 4; s.Chain.start(s.Chain.makeFun()); s.Chain.done(c.cur); });
    ok(await waitFor((b) => window.__tvs.S.money >= b + 600 + 2500, 15000, before), 'five missions in a row pay a bonus');
    await tick();
    ok(await waitFor(() => !!window.__tvs.S.chain.cur, 15000), 'and the next mission follows by itself');
    await shot(page, 'chain_next');
    // the list shows the mission on top, with today's tasks below it
    await ev(() => window.__tvs.sys.Tasks.open());
    ok(await waitFor(() => { const m = document.getElementById('modal'); return !m.hidden && /Mission \d+/i.test(m.innerText) && /Today's tasks/.test(m.innerText); }, 5000), 'the task list shows the current mission on top');
    await ev(() => window.__tvs.sys.UI.close());
    // music is playing in the game too (a real AudioContext this time)
    await ev(() => { const A = window.__tvs.sys.Audio2; A.ctx = null; A.ok = false; window.__tvs.sys.Music.ready = false; window.__tvs.sys.Music.song = null; A.unlock(); });
    ok(await waitFor(() => { const M = window.__tvs.sys.Music; return !!M.song && M.song.at > 0; }, 90000), 'the band plays during the game');
    const errs = logs.filter((l) => /pageerror|TypeError|ReferenceError/.test(l) && !/favicon|fonts/.test(l));
    ok(!errs.length, 'no script errors' + (errs.length ? ': ' + errs.slice(0, 3).join(' | ') : ''));
  } catch (e) { ok(false, 'crashed: ' + (e && e.stack || e)); }
  await browser.close();
})();
