// Menu tabs like the big mobile games: Basic, Graphics (quality names, frame rate, style,
// brightness), Controls (layout editor, button size, floating stick, vehicle stick, auto run,
// vibration), Sensitivity (vehicle camera, gyroscope), Audio and Account.
const { open, waitReady, ROOT } = require('./harness.cjs');
const path = require('path');
const ok = (c, msg) => { console.log((c ? 'PASS ' : 'FAIL ') + msg); if (!c) process.exitCode = 1; };
const shot = (page, n) => page.screenshot({ path: path.join(ROOT, 'shots', n + '.png'), timeout: 120000 }).catch((e) => console.log('shot failed', n, e.message));
(async () => {
  const { browser, page, logs } = await open({ mobile: true, viewport: { width: 915, height: 412 }, preset: 'LOW' });
  const ev = (fn, a) => page.evaluate(fn, a);
  const waitFor = async (fn, ms = 20000, a) => { const t0 = Date.now(); while (Date.now() - t0 < ms) { if (await page.evaluate(fn, a)) return true; await page.waitForTimeout(250); } return false; };
  const tab = async (name) => { await ev((n) => [...document.querySelectorAll('#modal .tabs button')].find((b) => b.textContent === n).click(), name); await page.waitForTimeout(250); };
  const segClick = async (label, opt) => ev(([l, o]) => { const g = [...document.querySelectorAll('#modal .set > label')].find((x) => x.textContent === l); const s = g.nextElementSibling; [...s.querySelectorAll('button')].find((b) => b.textContent === o).click(); }, [label, opt]);
  try {
    await waitReady(page);
    await ev(() => { const s = window.__tvs.sys; s.Settings.v.voice = false; });
    await ev(() => [...document.querySelectorAll('#tactions .tbtn')].find((x) => /New game/.test(x.textContent)).click());
    await page.waitForSelector('#startFarming');
    await ev(() => document.getElementById('startFarming').click());
    ok(await waitFor(() => window.__tvs.S && document.getElementById('hud').hidden === false, 90000), 'game started');
    await page.waitForTimeout(800);

    // ---- the menu has six tabs ----
    await ev(() => window.__tvs.sys.UI.settings());
    const tabs = await ev(() => [...document.querySelectorAll('#modal .tabs button')].map((b) => b.textContent));
    ok(tabs.join('|') === 'Basic|Graphics|Controls|Sensitivity|Audio|Account', 'tabs: ' + tabs.join(', '));
    await shot(page, 'menu_basic');

    // ---- graphics ----
    await tab('Graphics');
    const g = await ev(() => document.getElementById('modal').innerText);
    ok(/Smooth/.test(g) && /Balanced/.test(g) && /Ultra HD/.test(g) && /120/.test(g) && /Movie/.test(g) && /Brightness/.test(g), 'graphics tab has quality names, frame rates, styles, brightness');
    await segClick('Style', 'Colorful');
    ok(/saturate\(1\.35\)/.test(await ev(() => document.getElementById('gl').style.filter)), 'style Colorful colours the 3D view');
    await segClick('Style', 'Classic');   // the software renderer in tests is slow with a filter
    await segClick('Frame rate', '30');
    await page.waitForTimeout(400);
    ok(await ev(() => window.__tvs.sys.Settings.v.fpsMode === '30'), 'frame rate 30 chosen');
    const e1 = await ev(() => window.__tvs.renderer.toneMappingExposure);
    await ev(() => { window.__tvs.sys.Settings.v.bright = 1.3; });
    await waitFor((e) => window.__tvs.renderer.toneMappingExposure / e > 1.2, 8000, e1);
    const e2 = await ev(() => window.__tvs.renderer.toneMappingExposure);
    await ev(() => { window.__tvs.sys.Settings.v.bright = 1; });
    ok(e2 / e1 > 1.2 && e2 / e1 < 1.4, 'brightness raises exposure ' + (e2 / e1).toFixed(2) + 'x');
    await segClick('Frame rate', 'Auto');
    await shot(page, 'menu_graphics');

    // ---- controls ----
    await tab('Controls');
    const c = await ev(() => document.getElementById('modal').innerText);
    ok(/Customize layout/.test(c) && /Button size/.test(c) && /Floating/.test(c) && /Vehicle controls/.test(c) && /Auto run/.test(c), 'controls tab has layout editor, size, joystick, vehicle, auto run');
    await shot(page, 'menu_controls');
    await ev(() => { const v = window.__tvs.sys.Settings.v; v.btnSize = 1.2; window.__tvs.sys.Settings.save(); window.__tvs.sys.Hud.apply(); });
    ok(await ev(() => document.getElementById('tbWork').dataset.s === '1.2'), 'button size slider scales the buttons');
    await ev(() => { const v = window.__tvs.sys.Settings.v; v.btnSize = 1; window.__tvs.sys.Hud.apply(); });

    // layout editor: drag Work somewhere else, make it bigger, save
    await ev(() => [...document.querySelectorAll('#modal .btn.big')].find((b) => /Customize layout/.test(b.textContent)).click());
    ok(await waitFor(() => !!document.getElementById('hudedit'), 5000), 'layout editor opened');
    const before = await ev(() => { const r = document.getElementById('tbWork').getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; });
    await page.mouse.move(before.x, before.y); await page.mouse.down(); await page.mouse.move(before.x - 120, before.y - 40, { steps: 6 }); await page.mouse.up();
    await page.waitForTimeout(200);
    const after = await ev(() => { const r = document.getElementById('tbWork').getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; });
    ok(Math.abs(after.x - (before.x - 120)) < 3 && Math.abs(after.y - (before.y - 40)) < 3, `Work dragged ${JSON.stringify(before)} → ${JSON.stringify(after)}`);
    ok(/Size/.test(await ev(() => document.querySelector('#hudedit .hepanel').innerText)), 'selected button shows size and transparency');
    await ev(() => { const i = document.querySelector('#hudedit .hes input'); i.value = '1.4'; i.dispatchEvent(new Event('input')); });
    await shot(page, 'menu_editor');
    await ev(() => [...document.querySelectorAll('#hudedit .hepanel button')].find((b) => b.textContent === 'Save').click());
    await page.waitForTimeout(300);
    const saved = await ev(() => JSON.stringify(window.__tvs.sys.Settings.v.hud));
    const gone = await ev(() => !document.getElementById('hudedit'));
    ok(/tbWork/.test(saved) && /"s":1.4/.test(saved) && gone, 'layout saved: ' + saved);
    // the moved button still works where it now is
    const w = await ev(() => { const r = document.getElementById('tbWork').getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; });
    const cdp = await page.context().newCDPSession(page);
    const touch = (type, pts) => cdp.send('Input.dispatchTouchEvent', { type, touchPoints: pts.map((p) => ({ x: p[0], y: p[1], id: p[2] || 0, radiusX: 4, radiusY: 4, force: 1 })) });
    await touch('touchStart', [[w.x, w.y, 1]]); await page.waitForTimeout(150);
    ok(await ev(() => window.__tvs.sys.Input.work === true), 'moved Work button still works');
    await touch('touchEnd', []); await page.waitForTimeout(100);

    // floating joystick: a thumb on the lower left of the 3D view walks
    await ev(() => { const s = window.__tvs.sys; s.Settings.v.joyMode = 'float'; s.UI.close(); });
    const p0 = await ev(() => { const P = window.__tvs.sys.Player; return { x: P.x, z: P.z }; });
    const home = await ev(() => { const r = document.getElementById('joy').getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; });
    await touch('touchStart', [[300, 250, 2]]); await page.waitForTimeout(80);
    const jc = await ev(() => { const r = document.getElementById('joy').getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2, active: window.__tvs.sys.Input.joy.active }; });
    ok(jc.active && Math.abs(jc.x - 300) < 3 && Math.abs(jc.y - 250) < 3, 'floating stick jumped under the thumb ' + JSON.stringify(jc));
    for (let i = 1; i <= 6; i++) { await touch('touchMove', [[300, 250 - i * 8, 2]]); await page.waitForTimeout(60); }
    await page.waitForTimeout(1200);
    const p1 = await ev(() => { const P = window.__tvs.sys.Player; return { x: P.x, z: P.z }; });
    await touch('touchEnd', []); await page.waitForTimeout(150);
    ok(Math.hypot(p1.x - p0.x, p1.z - p0.z) > 1, 'walked with the floating stick: ' + Math.hypot(p1.x - p0.x, p1.z - p0.z).toFixed(1) + ' m');
    const back = await ev(() => { const r = document.getElementById('joy').getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2, active: window.__tvs.sys.Input.joy.active }; });
    ok(!back.active && Math.abs(back.x - home.x) < 3 && Math.abs(back.y - home.y) < 3, 'stick went home after letting go');

    // vehicle with the stick instead of buttons
    await ev(() => { const s = window.__tvs.sys; s.Settings.v.vehCtl = 'stick'; const v = s.Vehicles.player.find((q) => q.type === 'bullock'); s.Player.x = v.x + 1; s.Player.z = v.z; s.Player.enterVehicle(v); s.UI.updateTouchLabels(); });
    await page.waitForTimeout(400);
    const vs = await ev(() => ({ dpad: document.getElementById('dpad').hidden, joy: document.getElementById('joy').style.visibility }));
    ok(vs.dpad === true && vs.joy !== 'hidden', 'vehicle uses the stick when chosen ' + JSON.stringify(vs));
    await ev(() => { const s = window.__tvs.sys; s.Settings.v.vehCtl = 'buttons'; s.UI.touchMode(true); });
    const vb = await ev(() => ({ dpad: document.getElementById('dpad').hidden, joy: document.getElementById('joy').style.visibility }));
    ok(vb.dpad === false && vb.joy === 'hidden', 'vehicle buttons back ' + JSON.stringify(vb));
    await ev(() => { const s = window.__tvs.sys; s.Player.exitVehicle(true); s.UI.updateTouchLabels(); });

    // ---- sensitivity: gyroscope turns the camera ----
    // headless test pages are not https, where phones expose motion sensors: stand one in
    await ev(() => { if (typeof window.DeviceMotionEvent === 'undefined') window.DeviceMotionEvent = function DeviceMotionEvent() {}; });
    await ev(() => window.__tvs.sys.UI.settings('sens'));
    await page.waitForTimeout(200);
    const st = await ev(() => document.getElementById('modal').innerText);
    ok(/Camera \(vehicle\)/.test(st) && /Gyroscope/.test(st), 'sensitivity tab has vehicle camera and gyroscope');
    if (!/Gyroscope/.test(st)) console.log('sens tab text:', st.slice(0, 400), await ev(() => JSON.stringify({ tab: window.__tvs.sys.UI.sheetState && window.__tvs.sys.UI.sheetState.tab, kind: window.__tvs.sys.UI.sheetState && window.__tvs.sys.UI.sheetState.kind, gyro: window.__tvs.sys.Gyro.has() })), logs.slice(-5).join('\n'));
    await segClick('Gyroscope', 'On');
    ok(await waitFor(() => window.__tvs.sys.Gyro.on && window.__tvs.sys.Settings.v.gyro === true, 3000), 'gyroscope on');
    await shot(page, 'menu_sens');
    await ev(() => window.__tvs.sys.UI.close());
    const y0 = await ev(() => window.__tvs.sys.Cam.yaw);
    await ev(() => { for (let i = 0; i < 30; i++) window.dispatchEvent(Object.assign(new Event('devicemotion'), { rotationRate: { alpha: 0, beta: 40, gamma: 40 }, interval: 16 })); });
    await waitFor((y) => Math.abs(window.__tvs.sys.Cam.yaw - y) > 0.2, 6000, y0);
    const y1 = await ev(() => window.__tvs.sys.Cam.yaw);
    ok(Math.abs(y1 - y0) > 0.2, 'turning the phone turns the camera: ' + (y1 - y0).toFixed(2) + ' rad');

    // ---- audio and account tabs ----
    await ev(() => window.__tvs.sys.UI.settings('audio'));
    ok(/Master volume/.test(await ev(() => document.getElementById('modal').innerText)), 'audio tab');
    await tab('Account');
    await page.waitForTimeout(500);
    const at = await ev(() => document.getElementById('modal').innerText);
    ok(/Create account|game website/.test(at), 'account tab shows sign in (or the website link where there is no account server)');
    if (!/Create account/.test(at)) console.log('account tab text:', at.slice(0, 500), logs.slice(-6).join('\n'));
    await ev(() => window.__tvs.sys.UI.close());
    // vibration off is respected
    await ev(() => { window.__buzz = 0; navigator.vibrate = () => { window.__buzz++; return true; }; const s = window.__tvs.sys; s.Settings.v.vibrate = false; s.Celebrate.buzz([10]); s.Settings.v.vibrate = true; s.Celebrate.buzz([10]); });
    ok(await ev(() => window.__buzz === 1), 'vibration switch works');
    const errs = logs.filter((l) => /pageerror|\[error\]/.test(l) && !/favicon|net::|Failed to load resource/.test(l));
    ok(errs.length === 0, 'no page errors ' + JSON.stringify(errs.slice(0, 3)));
  } catch (e) { console.log('FAIL exception', e.message); process.exitCode = 1; }
  await browser.close();
})();
