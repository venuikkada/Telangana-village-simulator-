// Layout check on many screens: phones (Android, iPhone with and without Safari bars), tablets, desktops.
// For each: start a game, stand next to the field so the coach and cards show, screenshot,
// and report HUD pieces that overlap each other.
const { open, waitReady, ROOT } = require('./harness.cjs');
const path = require('path');
const IOS = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1';
const IPAD = 'Mozilla/5.0 (iPad; CPU OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1';
const ALL = {
  'iphone-safari': { viewport: { width: 844, height: 340 }, mobile: true, ua: IOS, dsf: 2 },
  'iphone-home': { viewport: { width: 844, height: 390 }, mobile: true, ua: IOS, dsf: 2 },
  'iphone-se': { viewport: { width: 667, height: 320 }, mobile: true, ua: IOS, dsf: 2 },
  'iphone-port': { viewport: { width: 390, height: 664 }, mobile: true, ua: IOS, dsf: 2 },
  'android-small': { viewport: { width: 640, height: 360 }, mobile: true },
  'android': { viewport: { width: 915, height: 412 }, mobile: true },
  'ipad': { viewport: { width: 1180, height: 820 }, mobile: true, ua: IPAD },
  'ipad-port': { viewport: { width: 820, height: 1180 }, mobile: true, ua: IPAD },
  'laptop': { viewport: { width: 1366, height: 768 } },
  'desktop': { viewport: { width: 1920, height: 1080 } },
};
(async () => {
  const names = (process.env.DEV || Object.keys(ALL).join(',')).split(',');
  for (const name of names) {
    const o = ALL[name]; if (!o) continue;
    const { browser, page, logs } = await open(Object.assign({ preset: 'LOW' }, o));
    try {
      await waitReady(page);
      await page.evaluate(() => { const s = window.__tvs.sys; s.Settings.v.portraitOk = true; s.Settings.v.voice = false; s.Game.start(null, { name: 'Raju' }); });
      await page.waitForTimeout(3500);
      // stand at the edge of the field: field card + coach + guide all visible
      await page.evaluate(() => { const s = window.__tvs.sys; const f = s.Fields.byId.F1; s.Player.x = f.x0 + 3; s.Player.z = f.z0 + 3; s.Player.y = s.World.groundHeight(s.Player.x, s.Player.z); s.Cam.focus.set(s.Player.x, s.Player.y + 1.4, s.Player.z); });
      await page.waitForTimeout(4500);
      await page.evaluate(() => { const s = window.__tvs.sys; if (s.Coach.step) s.Coach.show(s.Coach.step, false); });
      await page.waitForTimeout(600);
      await page.screenshot({ path: path.join(ROOT, `shots/dev_${name}.png`), timeout: 180000 });
      const r = await page.evaluate(() => {
        const ids = ['hud-tl', 'hud-tc', 'mapwrap', 'missions', 'hud-bl', 'coach', 'prompt', 'tools', 'hud-br', 'joy', 'tbtns', 'toasts'];
        const box = {};
        for (const id of ids) { const e = document.getElementById(id); if (!e || e.hidden || e.offsetParent === null && getComputedStyle(e).position !== 'fixed') continue; const b = e.getBoundingClientRect(); if (b.width < 2 || b.height < 2) continue; if (id === 'touch') continue; box[id] = [Math.round(b.left), Math.round(b.top), Math.round(b.right), Math.round(b.bottom)]; }
        const W = innerWidth, H = innerHeight; const bad = [];
        const keys = Object.keys(box);
        for (let i = 0; i < keys.length; i++) for (let j = i + 1; j < keys.length; j++) {
          const a = box[keys[i]], b = box[keys[j]];
          const ox = Math.min(a[2], b[2]) - Math.max(a[0], b[0]), oy = Math.min(a[3], b[3]) - Math.max(a[1], b[1]);
          if (ox > 2 && oy > 2) bad.push(`${keys[i]}×${keys[j]} ${ox}x${oy}`);
        }
        for (const k of keys) { const a = box[k]; if (a[0] < -1 || a[1] < -1 || a[2] > W + 1 || a[3] > H + 1) bad.push(`${k} off-screen ${a}`); }
        const coach = document.getElementById('coach');
        return { W, H, touch: document.documentElement.classList.contains('touch'), a2hs: !document.getElementById('a2hs').hidden, coach: coach.hidden ? '(hidden)' : coach.textContent, card: document.getElementById('missions').textContent.slice(0, 120), bad, box };
      });
      console.log(`\n[${name}] ${r.W}x${r.H} touch=${r.touch} coach="${r.coach}"`);
      console.log('  card:', r.card);
      console.log(r.bad.length ? '  OVERLAP: ' + r.bad.join(' | ') : '  layout ok');
    } catch (e) { console.log(`[${name}] TEST ERROR`, e.message); }
    const errs = logs.filter((l) => /pageerror|\[error\]/i.test(l) && !l.includes('GPU stall'));
    if (errs.length) console.log('  errors:', errs.slice(0, 5).join('\n'));
    await browser.close();
  }
})();
