// ============================================================================
// Menu: settings in tabs like the big mobile games — Basic, Graphics, Controls,
// Sensitivity, Audio, Account. Plus what those tabs switch: graphics styles and
// brightness, a button layout editor (drag, resize and fade every button),
// a floating joystick, buttons or stick for vehicles, a gyroscope camera,
// vibration and the minimap.
// ============================================================================

// ---------- graphics style (a colour filter on the 3D view) ----------
const STYLES = {
  classic: '',
  colorful: 'saturate(1.35) contrast(1.06)',
  realistic: 'saturate(0.86) contrast(1.1) brightness(0.97)',
  soft: 'saturate(0.9) contrast(0.9) brightness(1.05)',
  movie: 'sepia(0.2) saturate(1.15) contrast(1.12) brightness(0.96)',
};
const Look = {
  apply() {
    const cv = document.getElementById('gl'); if (cv) cv.style.filter = STYLES[Settings.v.style] || '';
    const mm = document.getElementById('mapwrap'); if (mm) mm.style.display = Settings.v.minimap === false ? 'none' : '';
  },
};

// ---------- the touch buttons: where each one sits, how big and how solid ----------
const HUD_ITEMS = [
  { id: 'joy', foot: 1, en: 'Walk stick', te: 'నడక స్టిక్' },
  { id: 'tbWork', foot: 1, en: 'Work', te: 'పని' },
  { id: 'tbRun', foot: 1, en: 'Run', te: 'పరుగు' },
  { id: 'tbE', foot: 1, veh: 1, en: 'Use', te: 'వాడు' },
  { id: 'tbJump', foot: 1, veh: 1, en: 'Jump / Brake', te: 'దూకు / బ్రేక్' },
  { id: 'tbV', foot: 1, veh: 1, en: 'View', te: 'వ్యూ' },
  { id: 'tbG', foot: 1, veh: 1, en: 'Type / Horn', te: 'రకం / హారన్' },
  { id: 'dL', veh: 1, en: 'Steer left', te: 'ఎడమకు తిప్పు' },
  { id: 'dR', veh: 1, en: 'Steer right', te: 'కుడికి తిప్పు' },
  { id: 'dU', veh: 1, en: 'Accelerate', te: 'వేగం పెంచు' },
  { id: 'dD', veh: 1, en: 'Brake / reverse', te: 'బ్రేక్ / వెనక్కి' },
];
const Hud = {
  fx: 0, fy: 0,   // floating joystick: how far the thumb landed from the stick's home
  split: typeof CSS !== 'undefined' && !!CSS.supports && CSS.supports('translate', '1px 1px'),
  orient() { return innerWidth >= innerHeight ? 'land' : 'port'; },
  layout() { const a = Settings.v.hud; return (a && a[this.orient()]) || {}; },
  place(el, x, y, s) {
    if (this.split) { el.style.translate = x || y ? x + 'px ' + y + 'px' : ''; el.style.scale = s !== 1 ? String(s) : ''; }
    else el.style.transform = x || y || s !== 1 ? `translate(${x}px, ${y}px) scale(${s})` : '';
  },
  apply(lay) {
    lay = lay || this.layout();
    const gs = Settings.v.btnSize || 1, ga = Settings.v.btnAlpha == null ? 1 : Settings.v.btnAlpha;
    for (const it of HUD_ITEMS) {
      const el = document.getElementById(it.id); if (!el) continue;
      const c = lay[it.id] || {}, joy = it.id === 'joy';
      const x = (c.x || 0) + (joy ? this.fx : 0), y = (c.y || 0) + (joy ? this.fy : 0), s = clamp((c.s || 1) * gs, 0.4, 2.2);
      this.place(el, x, y, s);
      el.style.setProperty('--ho', String(clamp((c.o == null ? 1 : c.o) * ga, 0.15, 1)));
      el.dataset.s = String(s);
      // the auto-run runner rides above the stick
      if (joy) { const ar = document.getElementById('autorun'); if (ar) this.place(ar, x, y - (s - 1) * 66, 1); }
    }
  },
};

// ---------- layout editor: drag a button, tap it to size or fade it ----------
const HudEdit = {
  on: false, lay: null, sel: null, mode: 'foot', drag: null, el: null,
  items() { return HUD_ITEMS.filter((i) => (this.mode === 'veh' ? i.veh : i.foot)); },
  open() {
    if (this.on) return;
    UI.close();
    this.on = true; this.sel = null; this.drag = null;
    this.lay = JSON.parse(JSON.stringify(Hud.layout()));
    this.mode = Player.vehicle ? 'veh' : 'foot';
    document.documentElement.classList.add('hudedit');
    const ov = h('div', { id: 'hudedit', role: 'dialog', 'aria-label': L('Customize controls', 'నియంత్రణలు మార్చండి') });
    ov.addEventListener('pointerdown', (e) => this.down(e));
    ov.addEventListener('pointermove', (e) => this.move(e));
    const up = (e) => { if (this.drag && e.pointerId === this.drag.pid) this.drag = null; };
    ov.addEventListener('pointerup', up); ov.addEventListener('pointercancel', up);
    (document.getElementById('app') || document.body).appendChild(ov);
    this.el = ov;
    this.show(); this.panel();
  },
  show() {
    const root = document.documentElement;
    root.classList.toggle('he-veh', this.mode === 'veh'); root.classList.toggle('he-foot', this.mode !== 'veh');
    const dp = document.getElementById('dpad'); if (dp) dp.hidden = this.mode !== 'veh';
    this.mark();
  },
  mark() {
    const set = new Set(this.items().map((i) => i.id));
    for (const it of HUD_ITEMS) { const el = document.getElementById(it.id); if (!el) continue; el.classList.toggle('heitem', set.has(it.id)); el.classList.toggle('hesel', it.id === this.sel); }
  },
  hit(x, y) {
    const list = this.items().slice().reverse();   // buttons sit above the stick
    for (const it of list) { const el = document.getElementById(it.id); if (!el) continue; const r = el.getBoundingClientRect(); if (r.width && x >= r.left - 8 && x <= r.right + 8 && y >= r.top - 8 && y <= r.bottom + 8) return it.id; }
    return null;
  },
  down(e) {
    if (e.target.closest && e.target.closest('.hepanel')) return;
    e.preventDefault();
    const id = this.hit(e.clientX, e.clientY);
    if (!id) { if (this.sel) { this.sel = null; this.mark(); this.panel(); } return; }
    const c = this.lay[id] || (this.lay[id] = {});
    this.drag = { id, pid: e.pointerId, sx: e.clientX, sy: e.clientY, x0: c.x || 0, y0: c.y || 0 };
    try { this.el.setPointerCapture(e.pointerId); } catch (er) { /* fine without */ }
    if (this.sel !== id) { this.sel = id; this.mark(); this.panel(); Audio2.sfx('click'); }
  },
  move(e) {
    const d = this.drag; if (!d || e.pointerId !== d.pid) return;
    const c = this.lay[d.id];
    c.x = Math.round(d.x0 + e.clientX - d.sx); c.y = Math.round(d.y0 + e.clientY - d.sy);
    Hud.apply(this.lay);
    // never off the screen
    const r = document.getElementById(d.id).getBoundingClientRect();
    const fx = r.left < 0 ? -r.left : r.right > innerWidth ? innerWidth - r.right : 0;
    const fy = r.top < 0 ? -r.top : r.bottom > innerHeight ? innerHeight - r.bottom : 0;
    if (fx || fy) { c.x += Math.round(fx); c.y += Math.round(fy); Hud.apply(this.lay); }
  },
  set(key, v) { const c = this.lay[this.sel] || (this.lay[this.sel] = {}); c[key] = v; Hud.apply(this.lay); },
  panel() {
    let p = this.el.querySelector('.hepanel');
    if (!p) { p = h('div', { class: 'hepanel' }); this.el.appendChild(p); }
    p.innerHTML = '';
    const it = HUD_ITEMS.find((x) => x.id === this.sel), c = it ? this.lay[it.id] || {} : null;
    const btn = (label, fn, cls) => h('button', { type: 'button', class: 'btn sm ' + cls, onclick: () => { Audio2.sfx('click'); fn(); } }, label);
    const slider = (label, key, min, max) => h('label', { class: 'hes' }, h('span', null, label), h('input', { type: 'range', min, max, step: 0.05, value: c[key] == null ? 1 : c[key], oninput: (e) => this.set(key, +e.target.value) }));
    p.append(
      h('div', { class: 'hehead' }, h('b', null, L('Customize controls', 'నియంత్రణలు మార్చండి')),
        h('div', { class: 'seg' }, ...[['foot', L('On foot', 'నడకలో')], ['veh', L('Vehicle', 'వాహనం')]].map(([m, lab]) => h('button', { type: 'button', class: this.mode === m ? 'on' : '', onclick: () => { this.mode = m; this.sel = null; this.show(); this.panel(); } }, lab)))),
      it ? h('div', { class: 'herow' }, h('b', null, LN(it)), slider(L('Size', 'పరిమాణం'), 's', 0.6, 1.6), slider(L('Transparency', 'పారదర్శకత'), 'o', 0.2, 1))
        : h('p', { class: 'hehint' }, L('Drag a button to move it. Tap a button to change its size.', 'బటన్‌ను కదపడానికి లాగండి. పరిమాణం మార్చడానికి బటన్‌ను నొక్కండి.')),
      h('div', { class: 'row' },
        btn(L('Reset', 'రీసెట్'), () => { this.lay = {}; this.sel = null; Hud.apply(this.lay); this.mark(); this.panel(); }, 'alt'),
        btn(L('Cancel', 'రద్దు'), () => this.close(false), 'alt'),
        btn(L('Save', 'సేవ్'), () => this.close(true), 'acc')));
  },
  close(save) {
    if (save) {
      const all = Object.assign({}, Settings.v.hud); all[Hud.orient()] = this.lay; Settings.v.hud = all; Settings.save();
      UI.toast(L('Button layout saved', 'బటన్ల అమరిక సేవ్ అయింది'), 'good');
    }
    this.on = false; this.drag = null; this.sel = null;
    if (this.el) this.el.remove(); this.el = null;
    document.documentElement.classList.remove('hudedit', 'he-veh', 'he-foot');
    for (const it of HUD_ITEMS) { const el = document.getElementById(it.id); if (el) el.classList.remove('heitem', 'hesel'); }
    Hud.apply(); UI.touchMode(true);
  },
};

// ---------- gyroscope: turn and tilt the phone to look around ----------
const Gyro = {
  on: false, yaw: 0, pitch: 0,
  has() { return isMobile && typeof DeviceMotionEvent !== 'undefined'; },
  asks() { return typeof DeviceMotionEvent !== 'undefined' && typeof DeviceMotionEvent.requestPermission === 'function'; },
  // iPhones ask the player first, and only from a tap
  async enable(fromTap) {
    if (!this.has()) return false;
    if (this.asks()) {
      if (!fromTap) return false;
      try { if ((await DeviceMotionEvent.requestPermission()) !== 'granted') return false; } catch (e) { return false; }
    }
    if (!this.on) { window.addEventListener('devicemotion', Gyro.onMotion); this.on = true; }
    return true;
  },
  disable() { window.removeEventListener('devicemotion', Gyro.onMotion); this.on = false; this.yaw = 0; this.pitch = 0; },
  onMotion(e) { Gyro.feed(e); },
  feed(e) {
    const r = e.rotationRate; if (!r) return;
    let dt = e.interval || 16; if (dt > 1) dt /= 1000;   // milliseconds (seconds on old iPhones)
    dt = Math.min(0.1, dt);
    const ang = screen.orientation && typeof screen.orientation.angle === 'number' ? screen.orientation.angle : (window.orientation || 0);
    const dz = (v) => (Math.abs(v || 0) < 1.2 ? 0 : v);   // ignore the hand's tiny shake (degrees a second)
    const b = dz(r.beta), g = dz(r.gamma);
    let yaw, pitch;
    if (ang === 90) { yaw = b; pitch = g; } else if (ang === 270 || ang === -90) { yaw = -b; pitch = -g; } else if (ang === 180) { yaw = -g; pitch = b; } else { yaw = g; pitch = -b; }
    const k = (Math.PI / 180) * dt;
    this.yaw += yaw * k; this.pitch += pitch * k;
  },
  take() { const y = this.yaw, p = this.pitch; this.yaw = 0; this.pitch = 0; return [y, p]; },
};

// ---------- the menu ----------
const PRESET_NAMES = () => ({ LOW: L('Smooth', 'స్మూత్'), MEDIUM: L('Balanced', 'బ్యాలెన్స్‌డ్'), HIGH: L('HD', 'HD'), ULTRA: L('Ultra HD', 'అల్ట్రా HD'), CINEMATIC: L('Cinematic', 'సినిమాటిక్') });
const Menu = {
  tab: 'basic',
  boot() {
    // days used to fly by: new and old players start at half speed (more time to explore)
    if (!Settings.v.ts2) { Settings.v.ts2 = true; if ((Settings.v.timeScale || 1) === 1) Settings.v.timeScale = 0.5; Settings.save(); }
    Hud.apply(); Look.apply();
    if (Settings.v.gyro) {
      Gyro.enable(false);
      // iPhones: ask again on the first tap of this visit
      document.addEventListener('touchend', () => { if (Settings.v.gyro && !Gyro.on) Gyro.enable(true); }, { once: true, passive: true });
    }
  },
  open(tab) {
    if (typeof tab === 'string') this.tab = tab;
    const tabs = [
      { id: 'basic', label: () => L('Basic', 'ప్రాథమికం'), render: (b) => this.basic(b) },
      { id: 'graphics', label: () => L('Graphics', 'గ్రాఫిక్స్'), render: (b) => this.graphics(b) },
      { id: 'controls', label: () => L('Controls', 'నియంత్రణలు'), render: (b) => this.controls(b) },
      { id: 'sens', label: () => L('Sensitivity', 'సెన్సిటివిటీ'), render: (b) => this.sens(b) },
      { id: 'audio', label: () => L('Audio', 'ఆడియో'), render: (b) => this.audio(b) },
      { id: 'account', label: () => L('Account', 'ఖాతా'), render: (b) => this.account(b) },
    ];
    UI.sheet({ title: L('Menu', 'మెనూ'), kind: 'settings', narrow: true, cls: 'menu', tabs, tab: this.tab });
  },
  // a grid of label + control rows
  grid(b) { const g = h('div', { class: 'set' }); b.appendChild(g); return (label, ctrl, hint) => { g.append(h('label', null, label), ctrl); if (hint) g.append(h('p', { class: 'mhint' }, hint)); }; },
  seg(opts, cur, fn) {
    const s = h('div', { class: 'seg' });
    for (const [id, lab] of opts) s.appendChild(h('button', { type: 'button', class: id === cur ? 'on' : '', onclick: () => { Audio2.sfx('click'); fn(id); UI.rerender(); } }, lab));
    return s;
  },
  slider(key, min, max, step, after) {
    const v = Settings.v;
    return h('input', { type: 'range', id: 'set_' + key, min, max, step, value: v[key] == null ? 1 : v[key], oninput: (e) => { v[key] = +e.target.value; Settings.save(); if (after) after(); } });
  },
  chk(key, label, after) {
    const v = Settings.v;
    return h('label', { class: 'row' }, h('input', { type: 'checkbox', id: 'chk_' + key, checked: v[key] ? true : null, onchange: (e) => { v[key] = e.target.checked; Settings.save(); UI._mKey = ''; UI.dirty = true; if (after) after(); } }), label);
  },
  onOff(key, after, def = true) { const v = Settings.v; const cur = v[key] == null ? def : !!v[key]; return this.seg([[true, L('On', 'ఆన్')], [false, L('Off', 'ఆఫ్')]], cur, (x) => { v[key] = x; Settings.save(); if (after) after(x); }); },

  basic(b) {
    this.tab = 'basic';
    const v = Settings.v, row = this.grid(b);
    row(L('Language', 'భాష'), Lang.picker('', () => UI.rerender()));
    if (G.started) row(L('Difficulty', 'కష్టం'), this.seg([[true, L('Easy', 'సులభం')], [false, L('Normal', 'సాధారణం')]], !!G.S.easy, (x) => { G.S.easy = x; UI.toast(x ? L('Easy mode: crops forgive mistakes and you tire slowly.', 'సులభ మోడ్: పంటలు తప్పులను క్షమిస్తాయి, మీరు నెమ్మదిగా అలసిపోతారు.') : L('Normal mode: real farming.', 'సాధారణ మోడ్: నిజమైన వ్యవసాయం.'), 'info'); }));
    row(L('Game speed', 'ఆట వేగం'), this.seg([[0.25, '¼×'], [0.5, '½×'], [1, '1×'], [2, '2×'], [4, '4×'], [8, '8×']], v.timeScale, (t) => { v.timeScale = t; Time.scale = t; Settings.save(); }), L('Slower days give you more time to explore.', 'నెమ్మదిగా సాగే రోజులు అన్వేషణకు ఎక్కువ సమయం ఇస్తాయి.'));
    if (G.started) {
      row(L('Explore mode', 'అన్వేషణ మోడ్'), this.seg([[true, L('On', 'ఆన్')], [false, L('Off', 'ఆఫ్')]], !!G.S.explore, (x) => Fun.explore(x)), L('Stops the clock so you can roam as long as you like.', 'గడియారం ఆగుతుంది, ఎంతసేపైనా తిరగొచ్చు.'));
      row(L('Your character', 'మీ పాత్ర'), UI.btn('👕 ' + L('Dress up', 'దుస్తులు మార్చు'), () => Wardrobe.open(), 'acc sm'));
    }
    row(L('Minimap', 'చిన్న మ్యాప్'), this.onOff('minimap', () => Look.apply()));
    row(L('Helpers', 'సహాయకాలు'), h('div', { class: 'row' }, this.chk('helper', L('“Do it for me” button', '“నా బదులు చేయి” బటన్'), () => { if (!v.helper) Auto.stop(false); }), isMobile ? this.chk('tapWalk', L('Tap the ground to walk', 'నేలపై నొక్కితే నడక')) : null));
    if (document.fullscreenEnabled) row(L('Screen', 'స్క్రీన్'), UI.btn(document.fullscreenElement ? L('Exit full screen', 'ఫుల్ స్క్రీన్ ఆపు') : L('Full screen', 'ఫుల్ స్క్రీన్'), () => Game.toggleFullscreen(), 'alt sm'));
    b.appendChild(h('div', { class: 'row mfoot' },
      UI.btn(L('Save game', 'ఆట సేవ్'), () => SaveSys.save(true), 'acc'),
      UI.btn(L('How to play', 'ఎలా ఆడాలి'), () => HowTo.show(), 'alt'),
      UI.btn(L('Invite friends', 'స్నేహితులను ఆహ్వానించండి'), () => Photo.invite(), 'alt'),
      UI.btn(L('Main menu', 'ముఖ్య మెనూ'), () => { SaveSys.save(false); Account.settle(4000).then(() => location.reload()); }, 'alt')));
    b.appendChild(h('p', { class: 'empty' }, SaveSys.status()));
    if (SaveSys.cloudState === 'askable') b.appendChild(UI.btn(L('Turn on cloud save', 'క్లౌడ్ సేవ్ ఆన్ చేయండి'), () => SaveSys.enableCloud(), 'alt sm'));
  },
  graphics(b) {
    this.tab = 'graphics';
    const v = Settings.v, row = this.grid(b), names = PRESET_NAMES();
    row(L('Graphics quality', 'గ్రాఫిక్స్ నాణ్యత'), this.seg(PRESET_ORDER.map((p) => [p, names[p]]), v.preset || G.preset.id, (p) => { v.preset = p; Settings.save(); Game.setPreset(p); }));
    const fr = isMobile ? [['auto', L('Auto', 'ఆటో')], ['30', '30'], ['40', '40'], ['60', '60'], ['90', '90'], ['120', '120']] : [['auto', L('Max', 'గరిష్ఠం')], ['30', '30'], ['60', '60'], ['120', '120']];
    row(L('Frame rate', 'ఫ్రేమ్ రేట్'), this.seg(fr, fpsMode(), (m) => { v.fpsMode = m; Loop.capFps = 0; Settings.save(); }), L('90 and 120 need a phone with a fast screen. Higher frame rates use more battery.', '90, 120 కోసం వేగవంతమైన స్క్రీన్ ఉన్న ఫోన్ కావాలి. ఎక్కువ ఫ్రేమ్ రేట్ ఎక్కువ బ్యాటరీ వాడుతుంది.'));
    row(L('Style', 'శైలి'), this.seg([['classic', L('Classic', 'క్లాసిక్')], ['colorful', L('Colorful', 'రంగులమయం')], ['realistic', L('Realistic', 'సహజం')], ['soft', L('Soft', 'మృదువు')], ['movie', L('Movie', 'సినిమా')]], v.style || 'classic', (s) => { v.style = s; Settings.save(); Look.apply(); }));
    row(L('Brightness', 'ప్రకాశం'), this.slider('bright', 0.7, 1.4, 0.05));
    row(L('Show FPS', 'FPS చూపు'), this.onOff('fps', null, false));
  },
  controls(b) {
    this.tab = 'controls';
    const v = Settings.v, row = this.grid(b);
    if (isMobile) {
      b.insertBefore(h('div', { class: 'mbig' }, h('button', { type: 'button', class: 'btn acc big', onclick: () => { Audio2.sfx('click'); if (G.started) HudEdit.open(); } , disabled: !G.started }, '✥ ' + L('Customize layout', 'బటన్ల అమరిక మార్చండి')),
        h('p', { class: 'mhint' }, G.started ? L('Drag every button to where your thumbs like it, and make it bigger or smaller.', 'ప్రతి బటన్‌ను మీ బొటనవేళ్లకు అనువైన చోటికి లాగండి, పెద్దగా లేదా చిన్నగా చేయండి.') : L('Start or continue a game to arrange the buttons.', 'బటన్లు అమర్చడానికి ఆట మొదలుపెట్టండి లేదా కొనసాగించండి.'))), b.firstChild);
      row(L('Button size', 'బటన్ పరిమాణం'), this.slider('btnSize', 0.7, 1.4, 0.05, () => Hud.apply()));
      row(L('Button transparency', 'బటన్ పారదర్శకత'), this.slider('btnAlpha', 0.3, 1, 0.05, () => Hud.apply()));
      row(L('Joystick', 'జాయ్‌స్టిక్'), this.seg([['fixed', L('Fixed', 'స్థిరం')], ['float', L('Floating', 'కదిలే')]], v.joyMode || 'fixed', (m) => { v.joyMode = m; Settings.save(); }), L('Floating: put your thumb anywhere on the left side to walk.', 'కదిలే: నడవడానికి బొటనవేలిని ఎడమవైపు ఎక్కడైనా పెట్టండి.'));
      row(L('Vehicle controls', 'వాహన నియంత్రణ'), this.seg([['buttons', L('Buttons', 'బటన్లు')], ['stick', L('Joystick', 'జాయ్‌స్టిక్')]], v.vehCtl || 'buttons', (m) => { v.vehCtl = m; Settings.save(); UI.touchMode(true); }));
      row(L('Auto run', 'ఆటో పరుగు'), this.onOff('autoRunOn', (x) => { if (!x && Input.autoRun) UI.autoRun(false); }));
      if (navigator.vibrate) row(L('Vibration', 'వైబ్రేషన్'), this.onOff('vibrate'));
    } else {
      row(L('Options', 'ఎంపికలు'), h('div', { class: 'row' }, this.chk('clickWork', L('Hold left mouse to work', 'ఎడమ మౌస్‌తో పని'))));
    }
    b.appendChild(h('div', { class: 'row mfoot' }, UI.btn(L('All controls', 'అన్ని నియంత్రణలు'), () => UI.help(), 'alt')));
  },
  sens(b) {
    this.tab = 'sens';
    const v = Settings.v, row = this.grid(b);
    row(L('Camera (on foot)', 'కెమెరా (నడకలో)'), this.slider('sens', 0.3, 2.5, 0.1));
    row(L('Camera (vehicle)', 'కెమెరా (వాహనంలో)'), this.slider('sensVeh', 0.3, 2.5, 0.1));
    row(L('Options', 'ఎంపికలు'), h('div', { class: 'row' }, this.chk('invertY', L('Invert camera Y', 'కెమెరా Y తిప్పు')), this.chk('camFollow', L('Camera follows you', 'కెమెరా మిమ్మల్ని అనుసరిస్తుంది'))));
    if (Gyro.has()) {
      row(L('Gyroscope', 'గైరోస్కోప్'), this.seg([[true, L('On', 'ఆన్')], [false, L('Off', 'ఆఫ్')]], !!v.gyro, (x) => {
        if (!x) { v.gyro = false; Settings.save(); Gyro.disable(); return; }
        Gyro.enable(true).then((ok) => { v.gyro = ok; Settings.save(); if (!ok) UI.toast(L('This phone has no gyroscope, or it is blocked.', 'ఈ ఫోన్‌లో గైరోస్కోప్ లేదు, లేదా అది ఆపివేయబడింది.'), 'warn'); UI.rerender(); });
      }), L('Turn and tilt your phone to look around.', 'చుట్టూ చూడటానికి ఫోన్‌ను తిప్పండి, వంచండి.'));
      if (v.gyro) row(L('Gyroscope sensitivity', 'గైరోస్కోప్ సెన్సిటివిటీ'), this.slider('gyroSens', 0.3, 3, 0.1));
    }
  },
  audio(b) {
    this.tab = 'audio';
    const v = Settings.v, row = this.grid(b);
    const vol = (key) => this.slider(key, 0, 1, 0.05, () => Audio2.applyVolumes());
    row(L('Master volume', 'మొత్తం శబ్దం'), vol('vol')); row(L('Music', 'సంగీతం'), vol('music')); row(L('Ambience', 'పరిసర శబ్దాలు'), vol('amb')); row(L('Effects', 'ఎఫెక్ట్స్'), vol('sfx'));
    row(L('Voice guide', 'వాయిస్ గైడ్'), this.seg([[true, L('On', 'ఆన్')], [false, L('Off', 'ఆఫ్')]], !!v.voice, (x) => { v.voice = x; Settings.save(); if (x && Coach.step) Coach.say(Coach.step.text); else if (window.speechSynthesis) speechSynthesis.cancel(); }));
  },
  account(b) {
    this.tab = 'account';
    Account.check();
    Account.render(b);
  },
};
