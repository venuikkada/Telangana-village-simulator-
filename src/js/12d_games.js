// ============================================================================
// Games: Holi colours on the villagers, kite fights in the sky, gully cricket,
// fishing at the lake, a runaway rooster, a cannonball into the lake, a naughty
// monkey and a daily lucky wheel. Each is a few taps with one big button (HIT,
// PULL, DIVE, CATCH) and a cheer at the end.
// ============================================================================
const HOLI_COLS = ['#ff2e93', '#22c55e', '#facc15', '#3b82f6', '#a855f7', '#fb923c', '#ef4444'];
const FISH = [
  { id: 'rohu', en: 'Rohu', te: 'రోహు', w: [1, 3], p: 120, odds: 0.45, col: '#c3ccd2', fin: '#d0645a' },
  { id: 'katla', en: 'Katla', te: 'బొచ్చె', w: [2, 5], p: 110, odds: 0.25, col: '#8e9aa2', fin: '#6a757c' },
  { id: 'murrel', en: 'Murrel', te: 'కొర్రమీను', w: [1, 2.5], p: 300, odds: 0.17, col: '#55603d', fin: '#3a4229' },
  { id: 'prawn', en: 'Prawns', te: 'రొయ్యలు', w: [0.3, 0.8], p: 600, odds: 0.1, col: '#f0a080', fin: '#e0704f' },
  { id: 'golden', en: 'Golden fish', te: 'బంగారు చేప', w: [0.5, 1], p: 2500, odds: 0.03, col: '#ffc21a', fin: '#ffe066' },
];
const WHEEL = [
  { en: '₹500', te: '₹500', money: 500, col: '#f2b52d', w: 22 },
  { en: 'Seeds', te: 'విత్తనాలు', seeds: 20, col: '#2f7d3a', w: 16 },
  { en: '₹1,000', te: '₹1,000', money: 1000, col: '#e07b22', w: 18 },
  { en: 'Fertilizer', te: 'ఎరువు', items: { urea: 2, dap: 1 }, col: '#1f9e9a', w: 14 },
  { en: '₹2,000', te: '₹2,000', money: 2000, col: '#c0392b', w: 10 },
  { en: 'Golden turban', te: 'బంగారు తలపాగా', turban: true, col: '#d4a514', w: 8 },
  { en: '₹5,000', te: '₹5,000', money: 5000, col: '#6b3fa0', w: 4 },
  { en: 'Mango map', te: 'మామిడి మ్యాప్', mango: true, col: '#e84393', w: 8 },
];
const _gv = new THREE.Vector3(), _gw = new THREE.Vector3(), _ga = new THREE.Vector3(), _gb = new THREE.Vector3(), _gc = new THREE.Vector3();

const Games = {
  mode: null,   // 'kite' | 'cricket' | 'fish' | 'rooster' | 'jump' | 'monkey'
  btn: null, onDown: null, onUp: null, rings: [], drip: 0, monkeyT: 30,
  st() { const f = Fun.st(); f.games = f.games || {}; const g = f.games; g.fish = g.fish || {}; g.kites = g.kites || 0; g.best = g.best || 0; return g; },
  // cricket, fishing and the lake jump hold you in place: the stick does not walk you away
  busy() { return this.mode === 'cricket' || this.mode === 'fish' || this.mode === 'jump'; },
  // the one big button every game uses; F on a computer
  action(label, down, up) {
    let b = this.btn;
    if (!b) {
      b = this.btn = h('button', { id: 'gamebtn', type: 'button' });
      b.addEventListener('pointerdown', (e) => { e.preventDefault(); try { b.setPointerCapture(e.pointerId); } catch (er) { /* fine */ } Audio2.unlock(); b.classList.add('on'); if (this.onDown) this.onDown(); });
      const rel = () => { if (!b.classList.contains('on')) return; b.classList.remove('on'); if (this.onUp) this.onUp(); };
      b.addEventListener('pointerup', rel); b.addEventListener('pointercancel', rel);
      (UI.el('hud') || document.body).appendChild(b);
      addEventListener('resize', () => setTimeout(() => this.place(), 150));
    }
    this.onDown = down || null; this.onUp = up || null;
    b.textContent = label || ''; b.hidden = !label;
    this.place();
    if (isMobile) UI.updateTouchLabels();   // the Work button steps aside while you play
  },
  // on a phone the game button sits where the Work button is, under your right thumb; on a
  // computer it waits in the bottom-left corner, out of the way of the action
  place() {
    const b = this.btn; if (!b || b.hidden) return;
    b.classList.toggle('desk', !isMobile); b.classList.remove('atwork'); b.style.left = b.style.top = '';
    if (!isMobile) return;
    const w = UI.el('tbWork'), r = w && w.getBoundingClientRect(), hr = b.parentElement.getBoundingClientRect();
    if (!r || !r.width) return;
    b.classList.add('atwork'); b.style.left = (r.left + r.width / 2 - hr.left) + 'px'; b.style.top = (r.top + r.height / 2 - hr.top) + 'px';
  },
  chipText() {
    if (this.mode === 'kite') return '🪁 ' + L('Kites cut', 'తెంపిన గాలిపటాలు') + ': ' + this.kite.cut + '  ✕';
    if (this.mode === 'cricket') { const c = this.cr; const balls = []; for (let i = 0; i < 6; i++) balls.push(c.log[i] !== undefined ? String(c.log[i]) : '○'); return '🏏 ' + c.runs + ' ' + L('runs', 'పరుగులు') + ' · ' + balls.join(' ') + '  ✕'; }
    if (this.mode === 'fish') return '🎣 ' + L('Fishing', 'చేపల వేట') + (this.fs && this.fs.n ? ' · 🐟 ' + this.fs.n : '') + '  ✕';
    if (this.mode === 'rooster' && this.rc) return '🐓 ' + Math.max(0, Math.ceil(this.rc.limit - this.rc.t)) + 's  ✕';
    if (this.mode === 'jump') return '💦 ' + L('Lake jump', 'చెరువులో దూకు') + '  ✕';
    if (this.mode === 'monkey') return '🐒 ' + L('Naughty monkey', 'అల్లరి కోతి') + '  ✕';
    return '';
  },
  // take a mesh out of the scene and free its GPU buffers (the shared material stays)
  drop(o) {
    if (!o) return; G.scene.remove(o); if (o.parent) o.parent.remove(o);
    o.traverse((m) => { if (m.geometry) m.geometry.dispose(); if (m.material && m.material !== MAT.std) m.material.dispose(); });
  },
  stop() {
    const m = this.mode; this.mode = null; this.action(null);
    if (m === 'kite' && this.kite) { const k = this.kite; Cam.aim = null; this.drop(k.mesh); this.drop(k.line); for (const r of k.rivals) { this.drop(r.mesh); this.drop(r.str); } for (const s of k.sky) { this.drop(s.mesh); this.drop(s.str); } this.kite = null; }
    if (m === 'cricket' && this.cr) {
      const c = this.cr; for (const o of [c.ball, c.stumps, c.bat, c.field, c.trail]) this.drop(o);
      if (this.bowler) this.bowler.visible = false;
      for (const k of this.kids || []) k.h.visible = false;
      Cam.intro = null; this.cr = null;
    }
    if (m === 'fish' && this.fs) { const f = this.fs; for (const o of [f.bob, f.line, f.rod, f.fish, f.basket]) this.drop(o); this.fs = null; }
    if (m === 'rooster' && this.rc) { this.rc.a.visible = false; this.rc = null; }
    if (m === 'jump' && this.jp) { const j = this.jp, P = Player; if (j.ph !== 'done') { P.x = j.x0; P.z = j.z0; P.y = World.groundHeight(j.x0, j.z0); } this.jp = null; }
    if (m === 'monkey' && this.mk) this.monkeyEnd();
    if (Player.h) Player.h.gpose = null;
    Fun.chipUpdate();
  },
  update(dt) {
    this.ringUpdate(dt);
    if (this.drip > 0) { this.drip -= dt; if (Math.random() < 0.5) FX.emit('water', Player.x + (Math.random() - 0.5) * 0.4, Player.y + 0.6 + Math.random() * 0.9, Player.z + (Math.random() - 0.5) * 0.4, 0, -0.5, 0); }
    if (!this.mode) { this.monkeyMaybe(dt); return; }
    if (UI.modalOpen()) return;
    if (Input.pressed('KeyF') && this.onDown) { this.onDown(); this.fkey = true; }
    if (this.fkey && !Input.down('KeyF')) { this.fkey = false; if (this.onUp) this.onUp(); }
    if (this.mode === 'kite') this.kiteUpdate(dt);
    else if (this.mode === 'cricket') this.cricketUpdate(dt);
    else if (this.mode === 'fish') this.fishUpdate(dt);
    else if (this.mode === 'rooster') this.roosterUpdate(dt);
    else if (this.mode === 'monkey') this.monkeyUpdate(dt);
  },
  ribbon(icon, top, title, sub, kind = 'sun', ms = 2200) { Celebrate.ribbon({ kind, icon, top, title, sub: sub || '', ms }); },

  // ---------- small helpers: a string that sags, ripples on the water, feathers ----------
  curve(n, color, opacity = 1) {
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(n * 3), 3));
    const l = new THREE.Line(g, new THREE.LineBasicMaterial({ color, transparent: opacity < 1, opacity })); l.frustumCulled = false; return l;
  },
  sag(line, ax, ay, az, bx, by, bz, sag) {
    const pa = line.geometry.attributes.position, n = pa.count;
    for (let i = 0; i < n; i++) { const u = i / (n - 1); pa.setXYZ(i, ax + (bx - ax) * u, ay + (by - ay) * u - Math.sin(u * Math.PI) * sag, az + (bz - az) * u); }
    pa.needsUpdate = true;
  },
  ripple(x, y, z, size = 1, life = 1.2) {
    let r = this.rings.find((q) => q.t >= q.life);
    if (!r) {
      if (this.rings.length >= 10) return;
      const m = new THREE.Mesh(new THREE.RingGeometry(0.86, 1, 36), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0, depthWrite: false, side: THREE.DoubleSide }));
      m.rotation.x = -Math.PI / 2; m.renderOrder = 3; G.scene.add(m);
      r = { m, t: 0, life: 0 }; this.rings.push(r);
    }
    r.t = 0; r.life = life; r.size = size; r.m.visible = true; r.m.position.set(x, y + 0.03, z);
  },
  ringUpdate(dt) {
    for (const r of this.rings) {
      if (r.t >= r.life) { r.m.visible = false; continue; }
      r.t += dt; const u = Math.min(1, r.t / r.life);
      r.m.scale.setScalar(0.15 + u * r.size * 1.6); r.m.material.opacity = 0.55 * (1 - u);
    }
  },
  feathers(x, y, z, n, cols = [[0.95, 0.92, 0.86], [0.66, 0.15, 0.11], [0.45, 0.25, 0.12]]) {
    for (let i = 0; i < n; i++) FX.emit('feather', x, y, z, (Math.random() - 0.5) * 3, 1 + Math.random() * 2, (Math.random() - 0.5) * 3, pick(cols));
  },

  // ---------- Holi: throw colour powder; everyone near you turns colourful ----------
  holi() {
    const P = Player, fx = Math.sin(P.yaw), fz = Math.cos(P.yaw);
    const puff = (x, y, z, n, spread, fwd) => {
      for (let i = 0; i < n; i++) {
        const c = C(pick(HOLI_COLS)), a = (Math.random() - 0.5) * spread, sp = fwd ? 4 + Math.random() * 6 : 1 + Math.random() * 2.5;
        const dx = fwd ? fx * Math.cos(a) + fz * Math.sin(a) : Math.cos(a * 4), dz = fwd ? fz * Math.cos(a) - fx * Math.sin(a) : Math.sin(a * 4);
        FX.emit('gulal', x, y, z, dx * sp, 1.2 + Math.random() * 2.5, dz * sp, [c.r, c.g, c.b]);
      }
    };
    puff(P.x + fx * 0.6, P.y + 1.5, P.z + fz * 0.6, 80, 1.8, true);
    let n = 0;
    for (const q of NPCs.list) {
      if (q.worker || !q.h.visible || Math.hypot(q.h.x - P.x, q.h.z - P.z) > 9) continue;
      const a = q.h.app; a.shirt = C(pick(HOLI_COLS)); if (a.skirtCol) { a.skirtCol = C(pick(HOLI_COLS)); if (a.saree) a.saree = a.skirtCol; } if (a.towel) a.towel = C(pick(HOLI_COLS));
      Humans.applyColors(q.h); puff(q.h.x, q.h.y + 1.3, q.h.z, 14, TAU, false);
      q.react = { pose: 'bhangra', until: G.t + 6 };
      n++;
    }
    const me = P.h.app; me.shirt = C(pick(HOLI_COLS)); Humans.applyColors(P.h);
    Audio2.sfx('whoosh'); setTimeout(() => Audio2.sfx('laugh'), 500);
    this.ribbon('🎨', L('Bura na mano, Holi hai!', 'బురా న మానో, హోలీ హై!'), L('Happy Holi!', 'హ్యాపీ హోలీ!'), n ? L(`${n} villagers coloured`, `${n} మంది గ్రామస్తులకు రంగులు`) : L('Splash! Find villagers to colour.', 'రంగులు! గ్రామస్తుల దగ్గరికి వెళ్లండి.'));
    Bus.emit('holi', { n });
  },

  // ---------- kites: aim with the camera, hold Dive to swoop and cut the other kites ----------
  // a patang: four paper panels in two colours, a bamboo spine and bow, a tail flap and a tassel
  kiteMesh(c1, c2, scale = 1.7) {
    const g = new THREE.Group(), A = C(c1), B = C(c2);
    const T = [0, 0.78], Lf = [-0.62, 0.12], Bt = [0, -0.62], R = [0.62, 0.12], M = [0, 0.12];
    const pos = [], col = [];
    for (const [p, q, r, c] of [[T, Lf, M, A], [T, M, R, B], [Lf, Bt, M, B], [M, Bt, R, A]]) for (const v of [p, q, r]) { pos.push(v[0], v[1], 0); col.push(c.r, c.g, c.b); }
    const pg = new THREE.BufferGeometry(); pg.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); pg.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
    g.add(new THREE.Mesh(pg, new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.DoubleSide })));
    const fg = new THREE.BufferGeometry(); fg.setAttribute('position', new THREE.Float32BufferAttribute([0, -0.56, 0.004, -0.17, -0.84, 0.004, 0.17, -0.84, 0.004], 3));
    g.add(new THREE.Mesh(fg, new THREE.MeshBasicMaterial({ color: A, side: THREE.DoubleSide })));
    const stick = new THREE.MeshBasicMaterial({ color: 0x6b4a22 });
    const spine = new THREE.Mesh(new THREE.BoxGeometry(0.024, 1.4, 0.02), stick); spine.position.set(0, 0.08, 0.012); g.add(spine);
    g.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.QuadraticBezierCurve3(new THREE.Vector3(-0.62, 0.12, 0.014), new THREE.Vector3(0, 0.5, 0.014), new THREE.Vector3(0.62, 0.12, 0.014)), 10, 0.012, 4, false), stick));
    const segs = []; let parent = g;
    for (let i = 0; i < 6; i++) {
      const s = new THREE.Group(); s.position.y = i ? -0.24 : -0.84; parent.add(s);
      const rb = new THREE.Mesh(new THREE.PlaneGeometry(i === 5 ? 0.2 : 0.09, 0.22), new THREE.MeshBasicMaterial({ color: i % 2 ? 0xffffff : B, side: THREE.DoubleSide })); rb.position.y = -0.11; s.add(rb);
      segs.push(s); parent = s;
    }
    g.userData.tail = segs; g.scale.setScalar(scale);
    return g;
  },
  kiteWave(mesh, t, k = 1) { const s = mesh.userData.tail; for (let i = 0; i < s.length; i++) { s[i].rotation.z = Math.sin(t * 6 * k - i * 0.9) * 0.32; s[i].rotation.x = Math.sin(t * 4.3 * k - i * 0.7) * 0.18; } },
  kiteStart() {
    if (Player.vehicle) { UI.toast(L('Get off the vehicle first.', 'ముందు వాహనం దిగండి.'), 'info'); return; }
    this.stop(); UI.close(); Fun.bar(false);
    // kites need open sky: step out to the nearest open ground if walls or trees are all around you
    const sp = this.kiteSpot(), P = Player;
    if (sp) { P.x = sp.x; P.z = sp.z; P.y = World.groundHeight(sp.x, sp.z); P.em = null; }
    this.mode = 'kite';
    const k = this.kite = { L: 4, t: 0, pos: new THREE.Vector3(), init: false, rivals: [], sky: [], cut: 0, dive: false, elev: 0.6, hurt: 0, atkT: 9 };
    k.mesh = this.kiteMesh(pick(['#e84393', '#f2b52d', '#2d6ca6', '#2f7d3a', '#c0392b']), pick(['#ffffff', '#1a1a1a', '#facc15']));
    k.line = this.curve(20, 0xff9ec4, 0.95);   // the manja
    G.scene.add(k.mesh, k.line);
    // a sky full of kites far away, like Sankranti
    const gy = World.groundHeight(P.x, P.z);
    for (let i = 0; i < 9; i++) {
      const a = Math.random() * TAU, d = 55 + Math.random() * 70;
      const s = { x: P.x + Math.cos(a) * d, y: gy + 24 + Math.random() * 26, z: P.z + Math.sin(a) * d, ph: Math.random() * 10, a };
      s.mesh = this.kiteMesh(pick(HOLI_COLS), pick(['#ffffff', '#1a1a1a', '#facc15', '#2d6ca6']), 1.3);
      s.str = this.curve(2, 0xffffff, 0.3);
      const ax = s.x + Math.cos(a) * 45, az = s.z + Math.sin(a) * 45; s.ax = ax; s.az = az; s.ay = World.groundHeight(ax, az) + 1.4;
      G.scene.add(s.mesh, s.str); k.sky.push(s);
    }
    Cam.aim = k.pos;   // the camera stays low and looks up so you see you and your kite
    this.action('🪁 ' + L('Dive', 'డైవ్'), () => { k.dive = true; }, () => { k.dive = false; });
    UI.toastOnce('kitetip', isMobile ? L('Turn the camera to steer your kite. Hold Dive to swoop onto another kite and cut it!', 'గాలిపటాన్ని తిప్పడానికి కెమెరా తిప్పండి. ఇంకో గాలిపటాన్ని తెంపడానికి డైవ్ పట్టుకోండి!')
      : L('Drag with the mouse to steer your kite. Hold F (or Dive) to swoop onto another kite and cut it!', 'మౌస్‌తో లాగి గాలిపటాన్ని తిప్పండి. ఇంకో గాలిపటాన్ని తెంపడానికి F (లేదా డైవ్) పట్టుకోండి!'), 'info');
    Fun.chipUpdate();
  },
  openSky(x, z) {
    for (const r of [0, 4, 8]) for (let i = 0; i < (r ? 8 : 1); i++) {
      const a = (i / 8) * TAU, q = { x: x + Math.cos(a) * r, z: z + Math.sin(a) * r }, o = World.occGet(q.x, q.z);
      if (o === OCC.BUILD || o === OCC.WATER || (!r && o === OCC.ROAD) || lakeSD(q.x, q.z) < 1 || World.collideCircle(q, 1.6)) return false;
    }
    return true;
  },
  kiteSpot() {
    const P = Player;
    if (this.openSky(P.x, P.z)) return null;
    for (let r = 6; r <= 72; r += 6) for (let k = 0, n = Math.max(6, Math.round(r / 2)); k < n; k++) {
      const a = (k / n) * TAU, x = P.x + Math.cos(a) * r, z = P.z + Math.sin(a) * r;
      if (this.openSky(x, z)) return { x, z };
    }
    const p = this.pitch(); return p ? { x: (p.bx + p.wx) / 2, z: (p.bz + p.wz) / 2 } : null;
  },
  kiteRival() {
    // in front of you (where the camera looks) and a little below your kite, so a dive reaches them
    const P = Player.pos(), a = Math.atan2(-Math.cos(Cam.yaw), -Math.sin(Cam.yaw)) + (Math.random() - 0.5) * 2.2, d = 18 + Math.random() * 14;
    const r = { t: Math.random() * 10, cx: P.x + Math.cos(a) * d, cz: P.z + Math.sin(a) * d, cy: World.groundHeight(P.x, P.z) + 11 + Math.random() * 10, rad: 3 + Math.random() * 4, w: 0.25 + Math.random() * 0.25, pos: new THREE.Vector3(), atk: null };
    r.mesh = this.kiteMesh(pick(['#6b3fa0', '#e07b22', '#1f9e9a', '#ff2e93', '#22c55e', '#facc15']), pick(['#1a1a1a', '#ffffff', '#c0392b']));
    r.cols = [r.mesh.children[0].geometry.attributes.color.getX(0), r.mesh.children[0].geometry.attributes.color.getY(0), r.mesh.children[0].geometry.attributes.color.getZ(0)];
    // its flyer stands far behind it: the string runs down to them
    r.ax = r.cx + Math.cos(a) * 50; r.az = r.cz + Math.sin(a) * 50; r.ay = World.groundHeight(r.ax, r.az) + 1.4;
    r.str = this.curve(10, 0xffffff, 0.45);
    G.scene.add(r.mesh, r.str);
    return r;
  },
  kiteUpdate(dt) {
    const k = this.kite, P = Player;
    if (P.vehicle) { this.stop(); return; }
    k.t += dt; k.L = Math.min(36, k.L + dt * 7); k.hurt = Math.max(0, k.hurt - dt);
    // the kite flies where the camera looks; Dive pulls it down in a swoop
    const fx = -Math.sin(Cam.yaw), fz = -Math.cos(Cam.yaw), rx = -fz, rz = fx;
    k.elev = damp(k.elev, k.dive ? 0.22 : 0.62 + Math.sin(k.t * 0.6) * 0.06, k.dive ? 2.4 : 1.1, dt);   // low enough to stay clear of the clock on a phone
    const sway = Math.sin(k.t * 1.3) * 2.5 + Math.sin(k.t * 0.37) * 3.5;
    const ax = P.x, ay = P.y + 1.5, az = P.z;
    _gv.set(ax + fx * Math.cos(k.elev) * k.L + rx * sway, ay + Math.sin(k.elev) * k.L + 1, az + fz * Math.cos(k.elev) * k.L + rz * sway);
    if (!k.init) { k.pos.copy(_gv); k.init = true; } else k.pos.lerp(_gv, 1 - Math.exp(-dt * (k.dive ? 3.6 : 1.8)));
    k.mesh.position.copy(k.pos); k.mesh.lookAt(ax, ay, az); k.mesh.rotateZ(Math.sin(k.t * 3.1) * 0.25);
    this.kiteWave(k.mesh, k.t, k.dive ? 1.8 : 1);
    // the string from your hands sags a little, less when you pull it tight in a dive
    this.sag(k.line, ax + fx * 0.3, ay - 0.15, az + fz * 0.3, k.pos.x, k.pos.y, k.pos.z, k.dive ? 0.25 : 0.04 * k.L);
    for (const s of k.sky) {
      s.mesh.position.set(s.x + Math.sin(k.t * 0.5 + s.ph) * 2, s.y + Math.sin(k.t * 0.8 + s.ph) * 1.4, s.z + Math.cos(k.t * 0.4 + s.ph) * 2);
      s.mesh.lookAt(s.ax, s.ay, s.az); s.mesh.rotateZ(Math.sin(k.t * 2.4 + s.ph) * 0.25); this.kiteWave(s.mesh, k.t + s.ph);
      const pa = s.str.geometry.attributes.position; pa.setXYZ(0, s.ax, s.ay, s.az); pa.setXYZ(1, s.mesh.position.x, s.mesh.position.y, s.mesh.position.z); pa.needsUpdate = true;
    }
    // the other kites drift in lazy circles: dive onto one to cut it. Now and then one swoops at
    // yours, and if it gets there before you dive, it cuts your string.
    while (k.rivals.length < 3) k.rivals.push(this.kiteRival());
    k.atkT -= dt;
    if (k.atkT <= 0) {
      k.atkT = 11 + Math.random() * 9;
      const r = k.rivals.find((q) => !q.falling && q.atk === null && q.pos.distanceTo(k.pos) < 50);
      if (r && !k.hurt && k.L > 20) {
        r.atk = 0; r.from = r.pos.clone(); Audio2.sfx('whoosh');
        UI.toastOnce('kiteatk', L('A kite is coming for yours! Hold Dive to cut it first.', 'ఒక గాలిపటం మీ గాలిపటం మీదికి వస్తోంది! ముందే తెంపడానికి డైవ్ పట్టుకోండి.'), 'warn');
      }
    }
    for (const r of k.rivals) {
      r.t += dt;
      if (r.falling) {
        r.vy -= 2.2 * dt; r.pos.x += r.vx * dt; r.pos.y += r.vy * dt; r.pos.z += r.vz * dt; r.mesh.rotation.z += dt * 5; r.mesh.rotation.x += dt * 2.5;
        if (r.pos.y < World.groundHeight(r.pos.x, r.pos.z) + 0.3) r.dead = true;
      } else {
        if (r.atk !== null) { r.atk += dt; const u = Math.min(1, r.atk / 2.6); r.pos.lerpVectors(r.from, k.pos, u * u * (3 - 2 * u)); }
        else r.pos.set(r.cx + Math.cos(r.t * r.w) * r.rad, r.cy + Math.sin(r.t * 0.8) * 2, r.cz + Math.sin(r.t * r.w) * r.rad);
        r.mesh.lookAt(r.ax, r.ay, r.az); r.mesh.rotateZ(Math.sin(r.t * (r.atk !== null ? 9 : 2.7)) * 0.3);
        this.kiteWave(r.mesh, r.t, r.atk !== null ? 2 : 1);
        this.sag(r.str, r.ax, r.ay, r.az, r.pos.x, r.pos.y, r.pos.z, 1.2);
        const d = r.pos.distanceTo(k.pos);
        if (k.dive && d < 3.4) this.kiteCut(r);
        else if (r.atk !== null && (d < 1.6 || r.atk > 4)) { if (d < 1.6 && !k.hurt) this.kiteLost(); this.kiteBack(r); }
        else if (Math.hypot(r.cx - P.x, r.cz - P.z) > 90) r.dead = true;   // you walked away: a new kite takes its place
      }
      r.mesh.position.copy(r.pos);
    }
    k.rivals = k.rivals.filter((r) => { if (r.dead) { this.drop(r.mesh); this.drop(r.str); return false; } return true; });
  },
  // an attacker goes back to circling from wherever it is now
  kiteBack(r) { r.atk = null; r.cx = r.pos.x - Math.cos(r.t * r.w) * r.rad; r.cz = r.pos.z - Math.sin(r.t * r.w) * r.rad; r.cy = r.pos.y - Math.sin(r.t * 0.8) * 2; },
  kiteCut(r) {
    const k = this.kite; r.falling = true; r.atk = null; r.vy = 0; r.vx = (Math.random() - 0.5) * 4; r.vz = (Math.random() - 0.5) * 4;
    r.str.visible = false;
    for (let i = 0; i < 26; i++) FX.emit('paper', r.pos.x, r.pos.y, r.pos.z, (Math.random() - 0.5) * 5, Math.random() * 2.5, (Math.random() - 0.5) * 5, i % 3 ? r.cols : [1, 1, 1]);
    k.cut++; this.st().kites++;
    Money.add(150, 'fun'); Audio2.sfx('tada'); Celebrate.burst(innerWidth / 2, innerHeight * 0.3, 50, 0.8);
    this.ribbon('🪁', L('You cut a kite!', 'గాలిపటం తెంపారు!'), L('Kai po che!', 'కాయ్ పో చే!'), '+' + fmtINR(150));
    Bus.emit('kiteCut', {});
    Fun.chipUpdate();
  },
  kiteLost() {
    const k = this.kite; k.L = 4; k.init = false; k.hurt = 2.5;
    Audio2.sfx('bump');
    UI.toast(L('Oh no! Your kite was cut. Here is a new one: dive when a kite comes at you.', 'అయ్యో! మీ గాలిపటం తెగింది. ఇదిగో కొత్తది: ఏదైనా గాలిపటం మీదికి వచ్చినప్పుడు డైవ్ చేయండి.'), 'warn');
  },

  // ---------- gully cricket: six balls, time your shot ----------
  pitch() {
    if (this._pitch) return this._pitch;
    const bases = [POI.santha, POI.school, { x: HOME.x + 40, z: HOME.z + 40 }].filter(Boolean);
    for (const b of bases) for (let r = 0; r <= 72; r += 6) for (let k = 0; k < Math.max(1, r / 3); k++) {
      const a = (k / Math.max(1, r / 3)) * TAU, cx = b.x + Math.cos(a) * r, cz = b.z + Math.sin(a) * r;
      for (const yaw of [0, Math.PI / 2, Math.PI / 4, -Math.PI / 4]) {
        const fx = Math.sin(yaw), fz = Math.cos(yaw), h0 = World.groundHeight(cx, cz); let ok = true;
        for (let s = -13; s <= 13 && ok; s += 2.6) {
          const x = cx + fx * s, z = cz + fz * s, o = World.occGet(x, z);
          if ((o !== OCC.FREE && o !== OCC.VILLAGE && o !== OCC.KEEP) || fieldAt(x, z) || lakeSD(x, z) < 4 || World.collideCircle({ x, z }, 2.2) || Math.abs(World.groundHeight(x, z) - h0) > 0.9) ok = false;
        }
        if (ok) return (this._pitch = { bx: cx - fx * 9, bz: cz - fz * 9, wx: cx + fx * 9, wz: cz + fz * 9, fx, fz, yaw, cx, cz });
      }
    }
    return null;
  },
  // pitch-local (across, along) to world; `along` runs from the batter (-9) to the bowler (+9)
  lw(p, lx, lz) { const cs = Math.cos(p.yaw), sn = Math.sin(p.yaw); return { x: p.cx + cs * lx + sn * lz, z: p.cz - sn * lx + cs * lz }; },
  // the ground: a rolled strip with chalk creases, the far stumps and a ring of boundary flags
  cricketField(p) {
    const grp = new THREE.Group();
    const sg = new THREE.PlaneGeometry(2.9, 23, 1, 23); sg.rotateX(-Math.PI / 2);
    const pa = sg.attributes.position;
    for (let i = 0; i < pa.count; i++) { const w = this.lw(p, pa.getX(i), pa.getZ(i)); pa.setXYZ(i, w.x, World.groundHeight(w.x, w.z) + 0.04, w.z); }
    sg.computeVertexNormals();
    const strip = new THREE.Mesh(sg, new THREE.MeshStandardMaterial({ color: 0xd2b97f, roughness: 1 })); strip.receiveShadow = true; grp.add(strip);
    const gb = new GeoBuilder(), white = C('#fbf8f0');
    gb.setBase(p.cx, 0, p.cz, p.yaw);
    const at = (lx, lz) => { const w = this.lw(p, lx, lz); return World.groundHeight(w.x, w.z); };
    for (const e of [-1, 1]) {
      const zs = e < 0 ? -9.9 : 10.2;   // the stumps line at each end
      gb.box(2.64, 0.012, 0.06, 0, at(0, zs) + 0.05, zs, 0, white);
      const zp = zs - e * 1.22; gb.box(3.2, 0.012, 0.06, 0, at(0, zp) + 0.05, zp, 0, white);   // popping crease
      for (const sx of [-1.32, 1.32]) gb.box(0.06, 0.012, 2.44, sx, at(sx, zs) + 0.05, zs, 0, white);   // return creases
    }
    // the bowler's stumps and bails
    const wood = C('#efe2bf'), band = C('#c0392b');
    for (const sx of [-0.11, 0, 0.11]) { gb.boxB(0.045, 0.71, 0.045, sx, at(sx, 10.2), 10.2, 0, wood); gb.box(0.05, 0.05, 0.05, sx, at(sx, 10.2) + 0.5, 10.2, 0, band); }
    for (const sx of [-0.055, 0.055]) gb.box(0.11, 0.022, 0.03, sx, at(0, 10.2) + 0.72, 10.2, 0, wood);
    // boundary flags on a big circle
    for (let i = 0; i < 18; i++) {
      const a = (i / 18) * TAU, lx = Math.cos(a) * 28, lz = Math.sin(a) * 28, w = this.lw(p, lx, lz);
      if (World.collideCircle({ x: w.x, z: w.z }, 0.6) || lakeSD(w.x, w.z) < 1) continue;
      const y = World.groundHeight(w.x, w.z);
      gb.cyl(0.03, 1.2, lx, y, lz, C('#f4f1ea'), 6);
      gb.box(0.02, 0.26, 0.36, lx, y + 1.06, lz + 0.18, 0, i % 2 ? C('#e2b81f') : C('#c0392b'));
    }
    gb.clearBase();
    const marks = new THREE.Mesh(gb.build(), MAT.std); marks.castShadow = true; marks.receiveShadow = true; grp.add(marks);
    return grp;
  },
  // village kids as fielders and a wicket-keeper, made once and reused
  team(p) {
    if (!this.kids) {
      this.kids = [];
      for (let i = 0; i < 6; i++) { const h0 = Humans.create(Humans.appearance({ age: 'child', gender: i % 3 === 2 ? 'f' : 'm' }), p.cx, p.cz); if (h0) this.kids.push({ h: h0 }); }
    }
    const spots = [[0, -12.4], [9, -7], [11, 2], [-6, 7.5], [-11, -1], [-7, -14]];   // keeper, point, cover, mid-on, mid-wicket, fine leg
    this.kids.forEach((k, i) => {
      const s = spots[i % spots.length], w = this.lw(p, s[0], s[1]);
      k.home = w; k.tx = w.x; k.tz = w.z; k.keeper = i === 0;
      const h0 = k.h; h0.visible = true; h0.x = w.x; h0.z = w.z; h0.y = World.groundHeight(w.x, w.z); h0.speed = 0; h0.pose = k.keeper ? 'bat' : 'idle';
      h0.yaw = Math.atan2(p.bx - w.x, p.bz - w.z);
    });
  },
  teamUpdate(dt) {
    const c = this.cr, p = c.p;
    for (const k of this.kids || []) {
      const h0 = k.h, dx = k.tx - h0.x, dz = k.tz - h0.z, d = Math.hypot(dx, dz);
      if (d > 0.4) { const sp = Math.min(d / dt, k.run ? 6.2 : 2.4); h0.x += dx / d * sp * dt; h0.z += dz / d * sp * dt; h0.yaw = dampAngle(h0.yaw, Math.atan2(dx, dz), 10, dt); h0.pose = 'walk'; h0.speed = sp; }
      else { h0.speed = 0; h0.pose = c.cheer > 0 ? 'joy' : k.keeper ? 'bat' : 'idle'; if (c.cheer <= 0) h0.yaw = dampAngle(h0.yaw, Math.atan2(p.bx - h0.x, p.bz - h0.z), 4, dt); }
      h0.y = World.groundHeight(h0.x, h0.z);
    }
    if (c.cheer > 0) c.cheer -= dt;
  },
  cricketStart() {
    if (Player.vehicle) Player.exitVehicle(true);
    if (Player.vehicle) return;
    const p = this.pitch(); if (!p) { UI.toast(L('No open ground for cricket here.', 'ఇక్కడ క్రికెట్‌కు ఖాళీ మైదానం లేదు.'), 'warn'); return; }
    this.stop(); UI.close(); Fun.bar(false);
    this.mode = 'cricket';
    const c = this.cr = { p, bn: 0, runs: 0, state: 'wait', t: -1.2, press: null, swing: 0, out: false, log: [], hist: [], cheer: 0, bails: null };
    const P = Player; P.x = p.bx; P.z = p.bz; P.y = World.groundHeight(p.bx, p.bz); P.yaw = p.yaw; P.em = null;
    const rx = -Math.cos(p.yaw), rz = Math.sin(p.yaw); c.rx = rx; c.rz = rz;
    c.field = this.cricketField(p);
    // a red ball with a white seam
    c.ball = new THREE.Mesh(new THREE.SphereGeometry(0.11, 14, 10), new THREE.MeshStandardMaterial({ color: 0xb3201f, roughness: 0.4 }));
    const seam = new THREE.Mesh(new THREE.TorusGeometry(0.111, 0.008, 4, 24), new THREE.MeshBasicMaterial({ color: 0xf6f0e0 })); c.ball.add(seam);
    c.ball.castShadow = true;
    c.trail = this.curve(12, 0xffffff, 0.5); c.trail.visible = false;
    // your stumps, with bails that fly when you are bowled
    const sw = this.lw(p, 0, -9.9), sy = World.groundHeight(sw.x, sw.z);
    c.stumps = new THREE.Group(); c.stumps.position.set(sw.x, sy, sw.z); c.stumps.rotation.y = p.yaw;
    const sb = new GeoBuilder();
    for (const sx of [-0.11, 0, 0.11]) { sb.boxB(0.045, 0.71, 0.045, sx, 0, 0, 0, C('#efe2bf')); sb.box(0.05, 0.05, 0.05, sx, 0.5, 0, 0, C('#c0392b')); }
    c.stumpMesh = new THREE.Mesh(sb.build(), MAT.std); c.stumpMesh.castShadow = true; c.stumps.add(c.stumpMesh);
    c.bails = [-0.055, 0.055].map((sx) => { const b = new THREE.Mesh(new THREE.BoxGeometry(0.11, 0.022, 0.03), new THREE.MeshStandardMaterial({ color: 0xefe2bf })); b.position.set(sx, 0.72, 0); c.stumps.add(b); return { m: b, x0: sx }; });
    // the bat: a willow blade with a dark grip
    const bb = new GeoBuilder();
    bb.box(0.115, 0.56, 0.04, 0, -0.44, 0, 0, C('#e6c98f')); bb.box(0.06, 0.48, 0.025, 0, -0.42, -0.028, 0, C('#d4b479'));
    bb.box(0.1, 0.05, 0.045, 0, -0.2, 0, 0, C('#c0392b')); bb.box(0.04, 0.3, 0.04, 0, 0.0, 0, 0, C('#1d1f22'));
    c.bat = new THREE.Mesh(bb.build(), MAT.std); c.bat.castShadow = true;
    G.scene.add(c.field, c.ball, c.stumps, c.bat, c.trail);
    if (!this.bowler) this.bowler = Humans.create(Humans.appearance({ gender: 'm', shirt: '#f4f4f0', lower: 'pants', pants: '#f4f4f0' }), p.wx, p.wz);
    const bw = this.bowler; if (bw) { bw.visible = true; bw.x = p.wx + p.fx * 6; bw.z = p.wz + p.fz * 6; bw.y = World.groundHeight(bw.x, bw.z); bw.yaw = p.yaw + Math.PI; bw.pose = 'idle'; bw.speed = 0; }
    this.team(p);
    // camera behind the batter looking down the pitch; it follows the ball when you hit it
    const home = () => _gb.set(Player.x - p.fx * 4.6 + rx * 1.0, Player.y + 2.2, Player.z - p.fz * 4.6 + rz * 1.0);
    c.cam = home().clone(); c.look = new THREE.Vector3(p.wx, World.groundHeight(p.wx, p.wz) + 0.9, p.wz);
    Cam.intro = (dt, cam) => {
      const k = 1 - Math.exp(-dt * 3.2);
      if (c.state === 'flight' && c.ball.visible) {
        _ga.copy(c.ball.position); c.look.lerp(_ga, 1 - Math.exp(-dt * 7));
        c.cam.lerp(_gb.set(Player.x - p.fx * 6 + rx * 2.4, Player.y + 3.6, Player.z - p.fz * 6 + rz * 2.4), k);
      } else {
        c.look.lerp(_ga.set(p.wx, World.groundHeight(p.wx, p.wz) + 0.9, p.wz), 1 - Math.exp(-dt * 4));
        c.cam.lerp(home(), k);
      }
      cam.position.copy(c.cam); cam.lookAt(c.look); Cam.focus.set(Player.x, Player.y, Player.z);
    };
    this.action('🏏 ' + L('Hit!', 'కొట్టు!'), () => { if (c.state === 'ball' && c.press === null) { c.press = c.t; c.swing = 0.001; Audio2.sfx('whoosh'); } }, null);
    UI.toastOnce('crickettip', L('Tap Hit just as the ball reaches you. Perfect timing = SIX!', 'బంతి మీ దగ్గరికి వచ్చిన క్షణంలో కొట్టు నొక్కండి. సరైన సమయం = సిక్స్!'), 'info');
    Fun.chipUpdate();
  },
  // the ball from the bowler's hand, bouncing once, to your bat (s = 0..1), then on to the stumps
  ballAt(s, out) {
    const c = this.cr, p = c.p;
    const rel = { x: p.wx, y: World.groundHeight(p.wx, p.wz) + 2.1, z: p.wz };
    const bat = { x: p.bx + p.fx * 0.35 + c.rx * 0.3, y: World.groundHeight(p.bx, p.bz) + 0.7, z: p.bz + p.fz * 0.35 + c.rz * 0.3 };
    const bnc = { x: p.bx + p.fx * 3.6, z: p.bz + p.fz * 3.6 }; const by = World.groundHeight(bnc.x, bnc.z) + 0.07;
    if (s < 0.78) { const u = s / 0.78; out.set(lerp(rel.x, bnc.x, u), lerp(rel.y, by, u) + Math.sin(u * Math.PI) * 0.6, lerp(rel.z, bnc.z, u)); }
    else if (s <= 1) { const u = (s - 0.78) / 0.22; out.set(lerp(bnc.x, bat.x, u), by + (bat.y - by) * Math.sin(u * Math.PI / 2), lerp(bnc.z, bat.z, u)); }
    else { const u = Math.min(1, (s - 1) / 0.25); out.set(lerp(bat.x, c.stumps.position.x, u), lerp(bat.y, World.groundHeight(p.bx, p.bz) + 0.4, u), lerp(bat.z, c.stumps.position.z, u)); }
    return out;
  },
  trailUpdate() {
    const c = this.cr, hst = c.hist;
    if (!c.ball.visible) { hst.length = 0; c.trail.visible = false; return; }
    hst.push(c.ball.position.clone()); if (hst.length > 12) hst.shift();
    const pa = c.trail.geometry.attributes.position;
    for (let i = 0; i < 12; i++) { const q = hst[Math.max(0, hst.length - 12 + i)] || hst[0]; pa.setXYZ(i, q.x, q.y, q.z); }
    pa.needsUpdate = true; c.trail.visible = hst.length > 2;
  },
  cricketUpdate(dt) {
    const c = this.cr, p = c.p, P = Player, bw = this.bowler;
    P.x = p.bx; P.z = p.bz; P.yaw = p.yaw;
    if (P.h) P.h.gpose = 'bat';
    c.t += dt;
    // the bat: ready by your side, then a quick swing
    if (c.swing > 0) c.swing = Math.min(1, c.swing + dt * 4.5);
    const sw = c.swing > 0 ? Math.sin(Math.min(1, c.swing) * Math.PI) : 0;
    c.bat.position.set(P.x + c.rx * 0.38 + p.fx * 0.15, P.y + 1.0, P.z + c.rz * 0.38 + p.fz * 0.15);
    c.bat.rotation.set(0, 0, 0); c.bat.rotation.order = 'YXZ'; c.bat.rotation.y = p.yaw - sw * 2.2; c.bat.rotation.x = -0.35 - sw * 1.1;
    if (c.swing >= 1) c.swing = 0;
    // flying bails after a bowled
    if (c.bailT > 0) {
      c.bailT -= dt;
      for (const b of c.bails) { b.vy -= 9.8 * dt; b.m.position.x += b.vx * dt; b.m.position.y = Math.max(0.02, b.m.position.y + b.vy * dt); b.m.position.z += b.vz * dt; if (b.m.position.y > 0.02) { b.m.rotation.x += dt * 12; b.m.rotation.z += dt * 7; } }
    }
    this.teamUpdate(dt);
    if (c.state === 'wait') {
      if (bw) { bw.pose = 'idle'; bw.speed = 0; }
      c.ball.visible = false;
      if (c.t >= 0) { c.state = 'runup'; c.t = 0; c.T = 0.85 + Math.random() * 0.3; c.press = null; c.bounced = false; }
    } else if (c.state === 'runup') {
      const u = Math.min(1, c.t / 1.3);
      if (bw) { bw.x = lerp(p.wx + p.fx * 6, p.wx, u); bw.z = lerp(p.wz + p.fz * 6, p.wz, u); bw.y = World.groundHeight(bw.x, bw.z); bw.pose = 'walk'; bw.speed = 5; bw.yaw = p.yaw + Math.PI; }
      if (u >= 1) { c.state = 'ball'; c.t = 0; if (bw) { bw.pose = 'wave'; bw.speed = 0; } Audio2.sfx('click'); }
    } else if (c.state === 'ball') {
      c.ball.visible = true;
      const s = c.t / c.T;
      if (c.press !== null && s >= 0.7) {
        const e = c.press - c.T;   // seconds early (-) or late (+)
        if (Math.abs(e) < 0.3) { this.cricketHit(e); return; }
      }
      this.ballAt(s, c.ball.position); c.ball.rotation.x -= dt * 20;
      if (!c.bounced && s >= 0.78) { c.bounced = true; const q = c.ball.position; for (let i = 0; i < 5; i++) FX.emit('dust', q.x, q.y, q.z, (Math.random() - 0.5), 0.4, (Math.random() - 0.5)); }
      if (s > 1.25) this.cricketMiss();
    } else if (c.state === 'flight') {
      const v = c.vel; v.y -= 9.8 * dt; c.ball.position.addScaledVector(v, dt); c.ball.rotation.x += dt * 25;
      const gy = World.groundHeight(c.ball.position.x, c.ball.position.z) + 0.12;
      if (c.ball.position.y < gy) { c.ball.position.y = gy; if (v.y < -1.5) { const q = c.ball.position; for (let i = 0; i < 6; i++) FX.emit('dust', q.x, q.y, q.z, (Math.random() - 0.5) * 2, 0.6, (Math.random() - 0.5) * 2); } if (v.y < 0) { v.y *= -0.35; v.x *= 0.6; v.z *= 0.6; } }
      if (c.t > 2.6) this.cricketNext();
    } else if (c.state === 'done') { if (c.t > 1.6) this.cricketNext(); }
    if (this.cr) this.trailUpdate();   // the innings may have just ended
  },
  cricketHit(e) {
    const c = this.cr, p = c.p, q = Math.abs(e);
    const kind = q < 0.07 ? 6 : q < 0.14 ? 4 : q < 0.21 ? 2 : 1;
    c.runs += kind; c.log.push(kind); c.state = 'flight'; c.t = 0;
    const ang = clamp(e * 4, -1.1, 1.1) + (Math.random() - 0.5) * 0.4;   // early pulls to one side, late to the other
    const dx = p.fx * Math.cos(ang) + c.rx * Math.sin(ang), dz = p.fz * Math.cos(ang) + c.rz * Math.sin(ang);
    const sp = kind === 6 ? 25 : kind === 4 ? 23 : kind === 2 ? 13 : 8, vy = kind === 6 ? 15 : kind === 4 ? 3 : 5;
    c.vel = new THREE.Vector3(dx * sp, vy, dz * sp);
    // the nearest fielder runs after it (a six goes over everyone's head)
    const land = { x: c.ball.position.x + dx * sp * 1.1, z: c.ball.position.z + dz * sp * 1.1 };
    let best = null, bd = 1e9; for (const k of this.kids || []) { k.run = false; if (k.keeper) continue; const d = Math.hypot(k.h.x - land.x, k.h.z - land.z); if (d < bd) { bd = d; best = k; } }
    if (best && kind < 6) { best.tx = land.x; best.tz = land.z; best.run = true; }
    Audio2.sfx('bump');
    if (kind === 6) {
      c.cheer = 3.5;
      this.ribbon('🏏', L('Out of the ground!', 'మైదానం బయటికి!'), L('SIX!', 'సిక్స్!'), '+' + kind, 'big', 1800); Celebrate.shower(90); Audio2.sfx('fanfare');
      for (const n of NPCs.list) if (!n.worker && n.h.visible && Math.hypot(n.h.x - p.bx, n.h.z - p.bz) < 45) n.react = { pose: 'bhangra', until: G.t + 4 };
    } else if (kind === 4) { c.cheer = 1.5; this.ribbon('🏏', L('Lovely shot!', 'అద్భుతమైన షాట్!'), L('FOUR!', 'ఫోర్!'), '+4', 'sun', 1600); Celebrate.burst(innerWidth / 2, innerHeight * 0.35, 50, 0.7); Audio2.sfx('tada'); }
    else { this.ribbon('🏏', e < 0 ? L('A bit early', 'కొంచెం ముందుగా') : L('A bit late', 'కొంచెం ఆలస్యంగా'), kind === 2 ? L('2 runs', '2 పరుగులు') : L('1 run', '1 పరుగు'), '+' + kind, 'sun', 1400); }
    Bus.emit('cricketShot', { kind });
    Fun.chipUpdate();
  },
  cricketMiss() {
    const c = this.cr; c.state = 'done'; c.t = 0;
    const bowled = Math.random() < 0.45;
    if (bowled) {
      c.out = true; c.log.push('W'); c.stumpMesh.rotation.x = -0.5; Audio2.sfx('bump');
      c.bailT = 1.6; for (const b of c.bails) { b.vx = (Math.random() - 0.5) * 2; b.vy = 3 + Math.random() * 2; b.vz = -1.5 - Math.random() * 2; }
      const kp = this.kids && this.kids[0]; if (kp) c.cheer = 2;
      this.ribbon('😮', L('The stumps are down.', 'వికెట్లు పడిపోయాయి.'), L('Bowled!', 'బౌల్డ్!'), '', 'sun', 1600);
    } else { c.log.push('•'); UI.toast(c.press === null ? L('Missed! Tap Hit as the ball arrives.', 'తప్పింది! బంతి రాగానే కొట్టు నొక్కండి.') : L('Missed! Try to time it better.', 'తప్పింది! సమయం సరిగ్గా చూసి కొట్టండి.'), 'info'); }
    Fun.chipUpdate();
  },
  cricketNext() {
    const c = this.cr; c.bn += 1;
    if (c.out || c.bn >= 6) { this.cricketEnd(); return; }
    c.state = 'wait'; c.t = -0.9; c.stumpMesh.rotation.x = 0;
    for (const k of this.kids || []) { k.run = false; k.tx = k.home.x; k.tz = k.home.z; }
    Fun.chipUpdate();
  },
  cricketEnd() {
    const c = this.cr, g = this.st(), best = c.runs > g.best;
    if (best) g.best = c.runs;
    const prize = c.runs * 30;
    if (prize) { Money.add(prize, 'fun'); Celebrate.coins(innerWidth / 2, innerHeight * 0.4, prize, 6); }
    this.ribbon('🏏', L('Innings over', 'ఇన్నింగ్స్ ముగిసింది'), L(`${c.runs} runs`, `${c.runs} పరుగులు`) + (best ? '  ' + L('New best!', 'కొత్త రికార్డు!') : ''), prize ? '+' + fmtINR(prize) : '', c.runs >= 12 ? 'big' : 'sun', 3000);
    if (c.runs >= 12) Celebrate.shower(120);
    Bus.emit('cricketEnd', { runs: c.runs });
    this.stop();
  },

  // ---------- fishing at the lake: wait for the float to dip, then pull ----------
  fishMesh(fish, s = 1) {
    const g = new THREE.Group(), gold = fish.id === 'golden';
    const body = new THREE.MeshStandardMaterial({ color: fish.col, roughness: 0.32, metalness: gold ? 0.65 : 0.3, emissive: gold ? 0x5a3c00 : 0x000000 });
    const fin = new THREE.MeshStandardMaterial({ color: fish.fin, roughness: 0.6, side: THREE.DoubleSide });
    const b = new THREE.Mesh(new THREE.SphereGeometry(0.2, 14, 10), body); b.scale.set(0.55, 0.75, 1.5); g.add(b);
    const tri = (pts) => { const q = new THREE.BufferGeometry(); q.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3)); q.computeVertexNormals(); return new THREE.Mesh(q, fin); };
    const tail = tri([0, 0, -0.26, 0, 0.17, -0.46, 0, -0.17, -0.46]); g.add(tail);
    g.add(tri([0, 0.13, 0.12, 0, 0.13, -0.15, 0, 0.25, -0.07]));
    const eye = new THREE.MeshBasicMaterial({ color: 0x111111 });
    for (const sx of [-1, 1]) { const e = new THREE.Mesh(new THREE.SphereGeometry(0.022, 6, 4), eye); e.position.set(sx * 0.1, 0.04, 0.2); g.add(e); }
    g.userData.tail = tail; g.scale.setScalar(s);
    return g;
  },
  fishStart() {
    if (Player.vehicle) Player.exitVehicle(true);
    if (Player.vehicle) return;
    const P = Player;
    if (lakeSD(P.x, P.z) > 12) {
      G.S.waypoint = { x: POI.ghat.x, z: POI.ghat.z, name: L('Lake ghat', 'చెరువు ఘాట్') };
      UI.close(); Fun.bar(false); UI.toast(L('Fishing is at the lake. Follow the gold arrow to the ghat.', 'చేపల వేట చెరువులో. బంగారు బాణాన్ని అనుసరించి ఘాట్‌కు వెళ్లండి.'), 'info'); return;
    }
    this.stop(); UI.close(); Fun.bar(false);
    this.mode = 'fish';
    const a = Math.atan2(LAKE.z - P.z, LAKE.x - P.x), dx = Math.cos(a), dz = Math.sin(a);
    P.yaw = Math.atan2(dx, dz); P.em = null; Cam.yaw = P.yaw + Math.PI + 0.55;   // over your shoulder: the rod, the line and the water
    let d = 7; while (d < 22 && lakeSD(P.x + dx * d, P.z + dz * d) > -1.5) d += 1;
    const f = this.fs = { dx, dz, tx: P.x + dx * d, tz: P.z + dz * d, state: 'cast', t: 0, wait: 0, caught: null, tip: new THREE.Vector3(), n: 0, rip: 0, inBasket: [] };
    // a red-and-white float with a little antenna
    f.bob = new THREE.Group();
    const red = new THREE.MeshStandardMaterial({ color: 0xff3b1f, roughness: 0.5 });
    f.bob.add(new THREE.Mesh(new THREE.SphereGeometry(0.14, 12, 6, 0, TAU, 0, Math.PI / 2), red), new THREE.Mesh(new THREE.SphereGeometry(0.14, 12, 6, 0, TAU, Math.PI / 2, Math.PI / 2), new THREE.MeshStandardMaterial({ color: 0xf6f3ea, roughness: 0.5 })));
    const ant = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.24, 4), red); ant.position.y = 0.22; f.bob.add(ant);
    f.line = this.curve(16, 0xf4f1ea, 0.85);
    // a bamboo rod in segments so it can bend, a cork grip and a reel
    f.rod = new THREE.Group(); f.seg = [];
    const sg = new THREE.CylinderGeometry(1, 1, 1, 6), cane = new THREE.MeshStandardMaterial({ color: 0x8a5a2a, roughness: 0.6 }), cork = new THREE.MeshStandardMaterial({ color: 0xc9a46b, roughness: 0.9 });
    for (let i = 0; i < 6; i++) { const m = new THREE.Mesh(sg, i === 0 ? cork : cane); m.castShadow = true; f.rod.add(m); f.seg.push(m); }
    f.reel = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.055, 0.05, 12), new THREE.MeshStandardMaterial({ color: 0x2a2d31, metalness: 0.6, roughness: 0.4 })); f.rod.add(f.reel);
    f.fish = new THREE.Group(); f.fish.visible = false;
    // a woven basket by your feet that fills up
    const bk = f.basket = new THREE.Group(), wick = new THREE.MeshStandardMaterial({ color: 0x9a6b35, roughness: 1, side: THREE.DoubleSide });
    const wall = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.22, 0.32, 14, 1, true), wick); wall.position.y = 0.16;
    const base = new THREE.Mesh(new THREE.CircleGeometry(0.22, 14), wick); base.rotation.x = -Math.PI / 2; base.position.y = 0.02;
    const rim = new THREE.Mesh(new THREE.TorusGeometry(0.3, 0.025, 4, 18), wick); rim.rotation.x = Math.PI / 2; rim.position.y = 0.32;
    bk.add(wall, base, rim);
    const bx = P.x - dx * 0.2 + dz * 0.75, bz = P.z - dz * 0.2 - dx * 0.75; bk.position.set(bx, World.groundHeight(bx, bz), bz);
    G.scene.add(f.bob, f.line, f.rod, f.fish, f.basket);
    this.action('🎣 ' + L('Pull!', 'లాగు!'), () => this.fishPull(), null);
    UI.toastOnce('fishtip', L('Wait for the red float to dip under, then tap Pull quickly!', 'ఎరుపు బెండు నీటిలో మునిగినప్పుడు వెంటనే లాగు నొక్కండి!'), 'info');
    Fun.chipUpdate();
  },
  // the rod from your hands out over the water, bending when a fish pulls
  rodUpdate(bend) {
    const f = this.fs, P = Player, n = f.seg.length;
    const H = _ga.set(P.x + f.dx * 0.32, P.y + 1.02, P.z + f.dz * 0.32);
    const T = _gb.set(P.x + f.dx * 2.7, P.y + 2.75 - bend * 1.15, P.z + f.dz * 2.7);
    const M = _gc.set((H.x + T.x) / 2, (H.y + T.y) / 2 + 0.22 + bend * 0.45, (H.z + T.z) / 2);
    const at = (u, out) => { const a = (1 - u) * (1 - u), b = 2 * (1 - u) * u, c = u * u; return out.set(a * H.x + b * M.x + c * T.x, a * H.y + b * M.y + c * T.y, a * H.z + b * M.z + c * T.z); };
    for (let i = 0; i < n; i++) {
      const p0 = at(i / n, _gv), p1 = at((i + 1) / n, _gw);
      const m = f.seg[i], len = p0.distanceTo(p1), r = i === 0 ? 0.034 : lerp(0.024, 0.007, i / (n - 1));
      m.position.set((p0.x + p1.x) / 2, (p0.y + p1.y) / 2, (p0.z + p1.z) / 2);
      _gw.sub(p0).normalize(); m.quaternion.setFromUnitVectors(UP, _gw); m.scale.set(r, len, r);
    }
    at(0.1, f.reel.position); f.reel.position.y -= 0.06; f.reel.quaternion.setFromUnitVectors(UP, _gv.set(-f.dz, 0, f.dx));
    return f.tip.copy(T);
  },
  fishUpdate(dt) {
    const f = this.fs, P = Player;
    if (P.h) P.h.gpose = 'fish';
    f.t += dt;
    const wy = World.lake.position.y;
    const bend = f.state === 'bite' ? 0.32 + Math.sin(f.t * 25) * 0.08 : f.state === 'catch' ? Math.max(0, 0.55 - f.t * 0.6) : f.state === 'wait' ? 0.05 + Math.sin(f.t * 1.7) * 0.01 : 0.08;
    const tip = this.rodUpdate(bend);
    let sag = 0.3;
    if (f.state === 'cast') {
      const u = Math.min(1, f.t / 0.7);
      f.bob.position.set(lerp(tip.x, f.tx, u), lerp(tip.y, wy, u) + Math.sin(u * Math.PI) * 2, lerp(tip.z, f.tz, u));
      sag = 0.15;
      if (u >= 1) { f.state = 'wait'; f.t = 0; f.wait = 2 + Math.random() * 5; FX.emit('splash', f.tx, wy + 0.1, f.tz, 0, 1.5, 0); this.ripple(f.tx, wy, f.tz, 1.2, 1.4); Audio2.sfx('step'); }
    } else if (f.state === 'wait') {
      f.bob.position.set(f.tx, wy + 0.04 + Math.sin(f.t * 2.4) * 0.03, f.tz); sag = 0.5;
      f.rip -= dt; if (f.rip <= 0) { f.rip = 1.8; this.ripple(f.tx, wy, f.tz, 0.6, 1.6); }
      if (f.t > f.wait) {
        f.state = 'bite'; f.t = 0; Audio2.sfx('hint');
        for (let k = 0; k < 6; k++) FX.emit('splash', f.tx + (Math.random() - 0.5) * 0.6, wy + 0.1, f.tz + (Math.random() - 0.5) * 0.6, 0, 1.2 + Math.random(), 0);
        this.ripple(f.tx, wy, f.tz, 1.4, 0.9); this.ripple(f.tx, wy, f.tz, 0.8, 0.7);
      }
    } else if (f.state === 'bite') {
      f.bob.position.set(f.tx, wy - 0.22 + Math.sin(f.t * 25) * 0.05, f.tz); sag = 0.03;
      f.rip -= dt; if (f.rip <= 0) { f.rip = 0.3; this.ripple(f.tx, wy, f.tz, 0.9, 0.6); }
      if (f.t > 1.0) { f.state = 'recast'; f.t = 0; UI.toast(L('It got away! Pull as soon as the float dips.', 'తప్పించుకుంది! బెండు మునగగానే లాగండి.'), 'info'); }
    } else if (f.state === 'catch') {
      // the fish jumps out of the water to you, wriggling, then drops into the basket
      const bp = f.basket.position;
      if (f.t < 0.8) {
        const u = f.t / 0.8;
        f.fish.position.set(lerp(f.tx, tip.x, u), lerp(wy, tip.y - 0.7, u) + Math.sin(u * Math.PI) * 2.2, lerp(f.tz, tip.z, u));
        f.bob.position.copy(f.fish.position); sag = 0.02;
      } else {
        const u = Math.min(1, (f.t - 0.8) / 0.55);
        f.fish.position.set(lerp(tip.x, bp.x, u), lerp(tip.y - 0.7, bp.y + 0.3, u) + Math.sin(u * Math.PI) * 0.5, lerp(tip.z, bp.z, u));
        f.bob.position.lerp(tip, Math.min(1, dt * 5)); sag = 0.4;
      }
      f.fish.rotation.set(Math.sin(f.t * 30) * 0.35, f.t * 3, Math.sin(f.t * 22) * 0.3);
      if (f.fish.userData.tail) f.fish.userData.tail.rotation.y = Math.sin(f.t * 40) * 0.6;
      if (f.t > 1.35) { this.basketAdd(f.caught); f.fish.visible = false; f.state = 'recast'; f.t = 0; }
    } else if (f.state === 'recast') {
      f.bob.position.lerp(tip, Math.min(1, dt * 4)); sag = 0.3;
      if (f.t > 0.8) { f.state = 'cast'; f.t = 0; }
    }
    this.sag(f.line, tip.x, tip.y, tip.z, f.bob.position.x, f.bob.position.y + 0.2, f.bob.position.z, sag);
  },
  basketAdd(fish) {
    const f = this.fs; if (!fish) return;
    if (f.inBasket.length >= 5) return;
    const m = this.fishMesh(fish, 0.42), a = f.inBasket.length * 1.3;
    m.position.set(Math.cos(a) * 0.08, 0.22 + f.inBasket.length * 0.04, Math.sin(a) * 0.08); m.rotation.set(0.2, a * 2, Math.PI / 2 * (f.inBasket.length % 2 ? 1 : -1) * 0.3);
    f.basket.add(m); f.inBasket.push(m);
    Audio2.sfx('step');
  },
  fishPull() {
    const f = this.fs; if (!f) return;
    if (f.state === 'wait') { f.state = 'recast'; f.t = 0; UI.toast(L('Too early! The fish swam away.', 'చాలా త్వరగా! చేప ఈదుకుంటూ వెళ్లిపోయింది.'), 'info'); return; }
    if (f.state !== 'bite') return;
    let r = Math.random(), fish = FISH[0];
    for (const q of FISH) { if (r < q.odds) { fish = q; break; } r -= q.odds; }
    const kg = +(fish.w[0] + Math.random() * (fish.w[1] - fish.w[0])).toFixed(1), pay = fish.id === 'golden' ? fish.p : Math.round(fish.p * kg);
    const g = this.st(); g.fish[fish.id] = (g.fish[fish.id] || 0) + 1;
    f.state = 'catch'; f.t = 0; f.caught = fish; f.n++;
    // swap in a fish of the right kind and colour
    this.drop(f.fish); f.fish = this.fishMesh(fish, 1 + Math.min(1, kg / 4) * 0.4); G.scene.add(f.fish);
    const wy = World.lake.position.y; for (let k = 0; k < 14; k++) FX.emit('water', f.tx, wy + 0.1, f.tz, (Math.random() - 0.5) * 2, 2 + Math.random() * 3, (Math.random() - 0.5) * 2);
    this.ripple(f.tx, wy, f.tz, 1.8, 1.0);
    Money.add(pay, 'fun'); Audio2.sfx(fish.id === 'golden' ? 'fanfare' : 'coin'); Audio2.sfx('splash');
    this.ribbon(fish.id === 'golden' ? '🌟' : '🐟', fish.id === 'golden' ? L('Golden fish!', 'బంగారు చేప!') : L('You caught a fish!', 'చేప పట్టారు!'), LN(fish) + ' · ' + kg + ' kg', '+' + fmtINR(pay), fish.id === 'golden' ? 'big' : 'sun', 2000);
    if (fish.id === 'golden') Celebrate.shower(120);
    Celebrate.coins(innerWidth / 2, innerHeight * 0.45, pay, 4);
    Bus.emit('fishCaught', { id: fish.id, kg });
    Fun.chipUpdate();
  },

  // ---------- the runaway rooster: chase it and grab it ----------
  roosterStart() {
    if (Player.vehicle) Player.exitVehicle(true);
    if (Player.vehicle) return;
    this.stop(); UI.close(); Fun.bar(false);
    const P = Player;
    const sp = this.kiteSpot(); if (sp) { P.x = sp.x; P.z = sp.z; P.y = World.groundHeight(sp.x, sp.z); P.em = null; }   // open ground for a proper chase
    const fx = -Math.sin(Cam.yaw), fz = -Math.cos(Cam.yaw), x = P.x + fx * 5, z = P.z + fz * 5;
    let a = this.rooster; if (!a) a = this.rooster = Animals.create('chicken', x, z, { col: '#a8261c', s: 2.1 });
    if (!a) return;
    this.mode = 'rooster';
    a.visible = true; a.x = x; a.z = z; a.y = World.groundHeight(x, z); a.yaw = Math.atan2(fx, fz); a.speed = 0; a.pose = 'stand';
    this.rc = { a, t: 0, limit: 60, cx: P.x, cz: P.z, hopT: 0.4, hop: 0, wig: Math.random() * 10, miss: 0 };
    this.feathers(x, a.y + 0.5, z, 10);
    this.action('🐓 ' + L('Catch!', 'పట్టుకో!'), () => this.roosterTry(), null);
    Audio2.sfx('rooster');
    UI.toastOnce('roostertip', L('The rooster ran away! Run after it and tap Catch when you are close.', 'కోడిపుంజు పారిపోయింది! దాని వెంట పరుగెత్తి దగ్గరికి వచ్చాక పట్టుకో నొక్కండి.'), 'info');
    Fun.chipUpdate();
  },
  roosterUpdate(dt) {
    const r = this.rc, a = r.a, P = Player;
    if (P.vehicle) { this.stop(); return; }
    r.t += dt; r.miss = Math.max(0, r.miss - dt);
    if (Math.floor(r.t) !== Math.floor(r.t - dt)) Fun.chipUpdate();
    if (r.t > r.limit) { UI.toast(L('The rooster got away! Try again.', 'కోడిపుంజు తప్పించుకుంది! మళ్ళీ ప్రయత్నించండి.'), 'info'); this.stop(); return; }
    const dx = a.x - P.x, dz = a.z - P.z, d = Math.hypot(dx, dz) || 1;
    // it runs from you, zig-zagging; it turns back before it leaves the ground
    let vx, vz;
    if (d < 8) { vx = dx / d; vz = dz / d; const zz = Math.sin(r.t * 3.1 + r.wig) * 0.9; const px = -vz, pz = vx; vx += px * zz; vz += pz * zz; }
    else { vx = Math.sin(r.t * 0.7 + r.wig) * 0.3; vz = Math.cos(r.t * 0.6) * 0.3; }
    const hx = a.x - r.cx, hz = a.z - r.cz, hd = Math.hypot(hx, hz); if (hd > 18) { vx -= hx / hd * 1.6; vz -= hz / hd * 1.6; }
    const vl = Math.hypot(vx, vz) || 1, sp = d < 8 ? 4.4 + (d < 3 ? 1.1 : 0) : 0.6;
    const q = { x: a.x + vx / vl * sp * dt, z: a.z + vz / vl * sp * dt }; World.collideCircle(q, 0.35);
    if (lakeSD(q.x, q.z) > 0.5) { a.x = q.x; a.z = q.z; }
    a.speed = damp(a.speed, sp, 6, dt); a.yaw = dampAngle(a.yaw, Math.atan2(vx, vz), 10, dt);
    // now and then a panicked flap and hop
    r.hopT -= dt; if (r.hopT <= 0 && d < 6) { r.hopT = 1.1 + Math.random() * 1.6; r.hop = 0.001; this.feathers(a.x, a.y + 0.4, a.z, 5); Audio2.sfx('cluck'); }
    if (r.hop > 0) { r.hop += dt * 2.6; if (r.hop >= 1) r.hop = 0; }
    a.y = World.groundHeight(a.x, a.z) + (r.hop > 0 ? Math.sin(r.hop * Math.PI) * 0.7 : 0);
  },
  roosterTry() {
    const r = this.rc; if (!r || r.miss > 0) return;
    const a = r.a, d = Math.hypot(a.x - Player.x, a.z - Player.z);
    if (d < 1.8) { this.roosterCaught(); return; }
    r.miss = 0.7; Audio2.sfx('boing');
    UI.toast(d < 4 ? L('So close! Get a little nearer.', 'దాదాపు! ఇంకొంచెం దగ్గరికి వెళ్ళండి.') : L('Too far! Run after it.', 'చాలా దూరం! దాని వెంట పరుగెత్తండి.'), 'info');
  },
  roosterCaught() {
    const r = this.rc, a = r.a;
    this.feathers(a.x, a.y + 0.4, a.z, 30);
    Audio2.sfx('rooster'); setTimeout(() => Audio2.sfx('laugh'), 400);
    const g = this.st(); g.roosters = (g.roosters || 0) + 1;
    Money.add(400, 'fun'); Celebrate.coins(innerWidth / 2, innerHeight * 0.45, 400, 4); Celebrate.burst(innerWidth / 2, innerHeight * 0.35, 40, 0.7);
    this.ribbon('🐓', L('Got it!', 'పట్టేశారు!'), L('Kokkoroko!', 'కొక్కొరొకో!'), '+' + fmtINR(400), 'big', 2200);
    for (const n of NPCs.list) if (!n.worker && n.h.visible && Math.hypot(n.h.x - a.x, n.h.z - a.z) < 20) n.react = { pose: 'laugh', until: G.t + 3 };
    Bus.emit('rooster', {});
    this.stop();
  },

  // ---------- a cannonball into the lake ----------
  jumpStart() {
    if (Player.vehicle) Player.exitVehicle(true);
    if (Player.vehicle) return;
    const P = Player;
    if (lakeSD(P.x, P.z) > 14) {
      G.S.waypoint = { x: POI.ghat.x, z: POI.ghat.z, name: L('Lake ghat', 'చెరువు ఘాట్') };
      UI.close(); Fun.bar(false); UI.toast(L('Go to the lake ghat to jump in. Follow the gold arrow.', 'చెరువులో దూకడానికి ఘాట్‌కు వెళ్ళండి. బంగారు బాణాన్ని అనుసరించండి.'), 'info'); return;
    }
    this.stop(); UI.close(); Fun.bar(false);
    const a = Math.atan2(LAKE.z - P.z, LAKE.x - P.x), dx = Math.cos(a), dz = Math.sin(a);
    let ds = 0; while (ds < 16 && lakeSD(P.x + dx * ds, P.z + dz * ds) > 0) ds += 0.25;   // the water's edge
    let dw = ds + 2.5; while (dw < ds + 12 && lakeSD(P.x + dx * dw, P.z + dz * dw) > -2.2) dw += 0.5;   // deep enough to jump into
    const run = Math.max(0, ds - 0.8);
    this.mode = 'jump';
    this.jp = { t: 0, ph: 'run', x0: P.x, z0: P.z, dx, dz, yaw: Math.atan2(dx, dz), run, rt: Math.max(0.35, run / 6.5), ex: P.x + dx * run, ez: P.z + dz * run, tx: P.x + dx * dw, tz: P.z + dz * dw, wy: World.lake.position.y };
    P.em = null; Cam.yaw = this.jp.yaw + Math.PI + 0.6;
    Audio2.sfx('whoosh');
    Fun.chipUpdate();
  },
  // runs from Player.update while jumping: it moves the farmer itself
  jumpStep(dt) {
    const j = this.jp, P = Player, h = P.h; if (!j) return;
    j.t += dt; h.lie = 0; h.spin = 0; h.roll = 0; h.speed = 0; h.gpose = null; P.yaw = j.yaw;
    if (j.ph === 'run') {
      const u = Math.min(1, j.t / j.rt);
      P.x = lerp(j.x0, j.ex, u); P.z = lerp(j.z0, j.ez, u); P.y = World.groundHeight(P.x, P.z); h.pose = 'walk'; h.speed = j.run > 0.2 ? 6.5 : 0;
      if (u >= 1) { j.ph = 'air'; j.t = 0; j.ay = P.y; Audio2.sfx('jump'); }
    } else if (j.ph === 'air') {   // up, tucked in, and a spin
      const u = Math.min(1, j.t / 0.95);
      P.x = lerp(j.ex, j.tx, u); P.z = lerp(j.ez, j.tz, u); P.y = lerp(j.ay + 0.3, j.wy - 0.9, u) + Math.sin(u * Math.PI) * 3.2;
      h.pose = 'tuck'; h.roll = u * TAU * 1.5;
      if (u >= 1) { j.ph = 'splash'; j.t = 0; this.jumpSplash(); }
    } else if (j.ph === 'splash') {   // under for a moment, then up for air
      const u = Math.min(1, j.t / 0.7); P.y = j.wy - 1.75 + u * 0.5; h.pose = 'tuck';
      if (u >= 1) { j.ph = 'swim'; j.t = 0; j.rip = 0; }
    } else if (j.ph === 'swim') {   // paddle back to the steps
      const u = Math.min(1, j.t / 3.2), sx = j.ex - j.dx * 0.2, sz = j.ez - j.dz * 0.2;
      P.x = lerp(j.tx, sx + j.dx * 1.4, u); P.z = lerp(j.tz, sz + j.dz * 1.4, u); P.y = j.wy - 1.25 + Math.sin(j.t * 3) * 0.05;
      P.yaw = j.yaw + Math.PI; h.pose = 'swim';
      j.rip -= dt; if (j.rip <= 0) { j.rip = 0.55; this.ripple(P.x, j.wy, P.z, 1.1, 1.2); FX.emit('splash', P.x, j.wy + 0.1, P.z, 0, 1, 0); }
      if (u >= 1) { j.ph = 'out'; j.t = 0; j.ox = P.x; j.oz = P.z; }
    } else if (j.ph === 'out') {   // climb out, dripping
      const u = Math.min(1, j.t / 0.7);
      P.x = lerp(j.ox, j.ex, u); P.z = lerp(j.oz, j.ez, u); P.y = lerp(j.wy - 1.1, World.groundHeight(j.ex, j.ez), u); P.yaw = j.yaw + Math.PI;
      h.pose = 'walk'; h.speed = 2;
      if (u >= 1) { j.ph = 'done'; this.jumpDone(); return; }
    }
    h.x = P.x; h.y = P.y; h.z = P.z; h.yaw = P.yaw;
  },
  jumpSplash() {
    const j = this.jp, P = Player;
    for (let i = 0; i < 60; i++) { const a = Math.random() * TAU, s = 1 + Math.random() * 3.5; FX.emit('water', P.x, j.wy + 0.2, P.z, Math.cos(a) * s, 4 + Math.random() * 6, Math.sin(a) * s); }
    for (let i = 0; i < 10; i++) FX.emit('spray', P.x + (Math.random() - 0.5), j.wy + 0.4, P.z + (Math.random() - 0.5), (Math.random() - 0.5) * 2, 2 + Math.random() * 2, (Math.random() - 0.5) * 2);
    this.ripple(P.x, j.wy, P.z, 3, 1.6); this.ripple(P.x, j.wy, P.z, 2, 1.2); this.ripple(P.x, j.wy, P.z, 1.2, 0.9);
    Audio2.sfx('splash');
    for (const n of NPCs.list) if (!n.worker && n.h.visible && Math.hypot(n.h.x - P.x, n.h.z - P.z) < 30) n.react = { pose: Math.random() < 0.5 ? 'clap' : 'laugh', until: G.t + 4 };
  },
  jumpDone() {
    const g = this.st(), first = g.splashDay !== Time.day();
    g.splashDay = Time.day(); g.splash = (g.splash || 0) + 1;
    const P = G.S.player; P.energy = Math.min(100, P.energy + 15);
    if (first) { Money.add(300, 'fun'); Celebrate.coins(innerWidth / 2, innerHeight * 0.45, 300, 3); }
    this.ribbon('💦', L('Cannonball!', 'దబ్బున దూకారు!'), L('What a splash!', 'ఎంత పెద్ద చిందు!'), (first ? '+' + fmtINR(300) + ' · ' : '') + L('Energy', 'శక్తి') + ' +15', 'big', 2400);
    setTimeout(() => Audio2.sfx('laugh'), 300);
    this.drip = 4;
    Bus.emit('splash', {});
    this.stop();
  },

  // ---------- the naughty monkey: it grabs your cap (or your lunch box) and runs up a tree ----------
  monkeyTree(x, z, dmin, dmax) {
    let best = null, bd = 1e9;
    for (const k of ['neem', 'banyan', 'tamarind', 'mango']) for (const t of Veg.lists[k] || []) { const d = Math.hypot(t.x - x, t.z - z); if (d > dmin && d < dmax && d < bd) { bd = d; best = t; } }
    return best;
  },
  // once a day or so, when you walk about the village near the big trees
  monkeyMaybe(dt) {
    this.monkeyT -= dt; if (this.monkeyT > 0) return;
    this.monkeyT = 25;
    const S = G.S; if (!G.started || !S || UI.modalOpen() || Player.vehicle || Rest.busy || S.player.mustRest) return;
    if (S.missions.tut < TUTORIAL.length) return;
    const g = this.st(); if (g.monkeyDay === Time.day()) return;
    const hr = Time.hour(); if (hr < 8 || hr > 17) return;
    if (Math.random() < 0.12 && this.monkeyTree(Player.x, Player.z, 8, 30)) this.monkeyStart(true);
  },
  monkeyStart(auto) {
    const P = Player;
    if (P.vehicle) { if (auto) return false; Player.exitVehicle(true); if (P.vehicle) return false; }
    const from = this.monkeyTree(P.x, P.z, 6, 45);
    if (!from) { if (!auto) UI.toast(L('No monkeys around here. Try near the big village trees.', 'ఇక్కడ కోతులు లేవు. గ్రామంలోని పెద్ద చెట్ల దగ్గర ప్రయత్నించండి.'), 'info'); return false; }
    let a = this.monkey; if (!a) a = this.monkey = Animals.create('monkey', from.x, from.z, { s: 1.35 });
    if (!a) return false;
    this.stop(); UI.close(); Fun.bar(false);
    this.mode = 'monkey';
    const S = G.S, look = S.player.look || {}, hat = !!look.hat && look.hat !== 'none';
    this.st().monkeyDay = Time.day();
    a.visible = true; a.x = from.x; a.z = from.z; a.y = World.groundHeight(from.x, from.z) + 3; a.speed = 0; a.pose = 'stand';
    const m = this.mk = { a, ph: 'down', t: 0, item: hat ? 'hat' : 'tiffin', hat: hat ? look.hat : null, from, near: null, back: false };
    // the thing it steals
    const gb = new GeoBuilder();
    if (hat) { gb.sphere(0.19, 0, 0.06, 0, C(look.hatCol || '#f4f1ea'), PRIM.ico1, 1.15, 0.55, 1.15); }
    else { for (let i = 0; i < 3; i++) gb.cyl(0.1, 0.08, 0, i * 0.085, 0, C('#d5dade'), 12); gb.box(0.03, 0.3, 0.03, 0.1, 0.12, 0, 0, C('#b9bec2')); gb.box(0.03, 0.3, 0.03, -0.1, 0.12, 0, 0, C('#b9bec2')); gb.box(0.23, 0.03, 0.03, 0, 0.28, 0, 0, C('#b9bec2')); }
    m.mesh = new THREE.Mesh(gb.build(), MAT.std); m.mesh.visible = false; m.mesh.castShadow = true; G.scene.add(m.mesh);
    Audio2.sfx('monkey');
    Fun.chipUpdate();
    return true;
  },
  monkeyUpdate(dt) {
    const m = this.mk, a = m.a, P = Player; m.t += dt;
    const go = (tx, tz, sp) => { const dx = tx - a.x, dz = tz - a.z, d = Math.hypot(dx, dz); if (d > 0.05) { const s = Math.min(d, sp * dt); a.x += dx / d * s; a.z += dz / d * s; a.yaw = Math.atan2(dx, dz); } a.speed = d > 0.3 ? sp : 0; return d; };
    const gy = World.groundHeight(a.x, a.z);
    if (m.ph === 'down') {   // climbs down its tree
      a.y = Math.max(gy, a.y - dt * 3.5); a.speed = 1.5;
      if (a.y <= gy + 0.01) { m.ph = 'come'; m.t = 0; }
    } else if (m.ph === 'come') {   // and runs straight at you
      const d = go(P.x, P.z, 6.5); a.y = gy + Math.abs(Math.sin(m.t * 9)) * 0.14;
      if (d < 0.9) { m.ph = 'grab'; m.t = 0; this.monkeyGrab(); }
      else if (m.t > 9) { this.stop(); return; }   // you ran off: it gives up
    } else if (m.ph === 'grab') {
      a.speed = 0; a.y = gy + Math.abs(Math.sin(m.t * 14)) * 0.3;
      if (m.t > 0.5) { m.ph = 'flee'; m.t = 0; m.tree = this.monkeyTree(a.x, a.z, 12, 50) || m.from; G.S.waypoint = { x: m.tree.x, z: m.tree.z, name: L('Naughty monkey', 'అల్లరి కోతి'), monkey: true }; }
    } else if (m.ph === 'flee') {   // off to a tree, looking back to tease you
      const d = go(m.tree.x, m.tree.z, 7.5); a.y = gy + Math.abs(Math.sin(m.t * 10)) * 0.15;
      if (d < 0.6) { m.ph = 'climb'; m.t = 0; m.top = gy + 3.2 * (m.tree.s || 1); }
    } else if (m.ph === 'climb') {
      const u = Math.min(1, m.t / 1.1); a.y = lerp(gy, m.top, u); a.speed = 2;
      if (u >= 1) { m.ph = 'tease'; m.t = 0; m.chat = 0; }
    } else if (m.ph === 'tease') {   // sits on a branch with your things, chattering
      a.speed = 0; a.y = m.top + Math.abs(Math.sin(m.t * 4)) * 0.12; a.yaw = Math.atan2(P.x - a.x, P.z - a.z);
      m.chat -= dt; if (m.chat <= 0) { m.chat = 2.6 + Math.random() * 2; Audio2.sfx('monkey'); }
      const near = Math.hypot(P.x - a.x, P.z - a.z) < 10;
      if (near !== m.near) {
        m.near = near;
        this.action(near ? '🍌 ' + L('Throw a banana', 'అరటిపండు విసురు') : null, () => this.monkeyThrow(), null);
        if (near) UI.toastOnce('monkeytip', L('Throw it a banana: the monkey will swap your things for it!', 'అరటిపండు విసరండి: దానికి బదులుగా కోతి మీ వస్తువు ఇచ్చేస్తుంది!'), 'info');
      }
    } else if (m.ph === 'banana') {   // the banana flies up
      const u = Math.min(1, m.t / 0.7), b = m.banana;
      b.position.set(lerp(m.bx, a.x, u), lerp(m.by, a.y + 0.4, u) + Math.sin(u * Math.PI) * 1.6, lerp(m.bz, a.z, u)); b.rotation.z += dt * 14;
      if (u >= 1) { this.drop(b); m.banana = null; m.ph = 'drop'; m.t = 0; Audio2.sfx('monkey'); m.dx0 = a.x; m.dy0 = a.y + 0.6; m.dz0 = a.z; }
    } else if (m.ph === 'drop') {   // your things fall back down to you
      const u = Math.min(1, m.t / 0.8);
      m.mesh.position.set(lerp(m.dx0, P.x, u), lerp(m.dy0, P.y + 1.2, u) + Math.sin(u * Math.PI) * 0.8, lerp(m.dz0, P.z, u)); m.mesh.rotation.x += dt * 8;
      a.y = m.top + Math.abs(Math.sin(m.t * 6)) * 0.05;
      if (u >= 1) { this.monkeyReturn(); m.ph = 'leave'; m.t = 0; }
    } else if (m.ph === 'leave') {   // happy with its banana, it climbs down and wanders off
      if (a.y > gy + 0.01) { a.y = Math.max(gy, a.y - dt * 3); a.speed = 1.5; }
      else { const away = m.away || (m.away = { x: a.x + (a.x - P.x) * 3 + 10, z: a.z + (a.z - P.z) * 3 + 10 }); go(away.x, away.z, 5); }
      if (m.t > 4) { this.stop(); return; }
    }
    // the camera looks up at it while it has your things (unless you are turning the camera yourself)
    const watch = m.ph === 'flee' || m.ph === 'climb' || m.ph === 'tease' || m.ph === 'banana' || m.ph === 'drop';
    Cam.aim = watch ? a : null;
    if (watch && performance.now() - Cam.lastManual > 1500) Cam.yaw = dampAngle(Cam.yaw, Math.atan2(-(a.x - P.x), -(a.z - P.z)), 2.2, dt);
    // your things ride along on the monkey
    if (m.mesh.visible && m.ph !== 'drop') { m.mesh.position.set(a.x, a.y + (m.item === 'hat' ? 0.62 : 0.45), a.z); m.mesh.rotation.set(0, a.yaw, 0); }
  },
  monkeyGrab() {
    const m = this.mk, S = G.S;
    if (m.item === 'hat') { S.player.look = Object.assign({}, S.player.look, { hat: 'none' }); Wardrobe.apply(); }
    m.mesh.visible = true;
    Audio2.sfx('monkey'); setTimeout(() => Audio2.sfx('laugh'), 350);
    this.feathers(Player.x, Player.y + 1.6, Player.z, 6, [[0.55, 0.47, 0.38]]);
    UI.toast(m.item === 'hat' ? L('A monkey snatched your cap! Follow it and give it a banana.', 'ఒక కోతి మీ టోపీ ఎత్తుకెళ్ళింది! దాని వెంట వెళ్ళి అరటిపండు ఇవ్వండి.') : L('A monkey snatched your lunch box! Follow it and give it a banana.', 'ఒక కోతి మీ టిఫిన్ బాక్సు ఎత్తుకెళ్ళింది! దాని వెంట వెళ్ళి అరటిపండు ఇవ్వండి.'), 'warn');
    for (const n of NPCs.list) if (!n.worker && n.h.visible && Math.hypot(n.h.x - Player.x, n.h.z - Player.z) < 18) n.react = { pose: 'laugh', until: G.t + 3 };
  },
  monkeyThrow() {
    const m = this.mk; if (!m || m.ph !== 'tease') return;
    const P = Player; m.ph = 'banana'; m.t = 0; this.action(null);
    const b = m.banana = new THREE.Mesh(new THREE.TorusGeometry(0.13, 0.035, 6, 12, Math.PI * 0.8), new THREE.MeshStandardMaterial({ color: 0xf5d03b, roughness: 0.6 }));
    m.bx = P.x; m.by = P.y + 1.5; m.bz = P.z; b.position.set(m.bx, m.by, m.bz); G.scene.add(b);
    Audio2.sfx('whoosh');
  },
  monkeyReturn() {
    const m = this.mk, S = G.S; if (m.back) return;
    m.back = true; m.mesh.visible = false;
    if (m.item === 'hat' && m.hat) { S.player.look = Object.assign({}, S.player.look, { hat: m.hat }); Wardrobe.apply(); }
    if (S.waypoint && S.waypoint.monkey) S.waypoint = null;
    const g = this.st(); g.monkeys = (g.monkeys || 0) + 1;
    Money.add(300, 'fun'); Celebrate.coins(innerWidth / 2, innerHeight * 0.45, 300, 3);
    this.ribbon('🐒', L('Thank you, monkey!', 'థాంక్యూ కోతి!'), m.item === 'hat' ? L('You got your cap back', 'మీ టోపీ తిరిగి వచ్చింది') : L('You got your lunch box back', 'మీ టిఫిన్ బాక్సు తిరిగి వచ్చింది'), '+' + fmtINR(300), 'big', 2400);
    Audio2.sfx('tada');
    Bus.emit('monkey', {});
  },
  // the game ended early (another game, a vehicle...): you always get your things back
  monkeyEnd() {
    const m = this.mk, S = G.S;
    if (!m.back && m.item === 'hat' && m.hat && m.mesh.visible) { S.player.look = Object.assign({}, S.player.look, { hat: m.hat }); Wardrobe.apply(); }
    if (S.waypoint && S.waypoint.monkey) S.waypoint = null;
    if (m.banana) this.drop(m.banana);
    if (Cam.aim === m.a) Cam.aim = null;
    this.drop(m.mesh); m.a.visible = false; this.mk = null;
  },

  // ---------- the lucky wheel: one free spin a day ----------
  canSpin() { return this.st().spin !== ymd(new Date()); },
  wheel() {
    Fun.bar(false);
    let spinning = false;
    UI.sheet({ title: L('Lucky wheel', 'లక్కీ చక్రం'), sub: L('One free spin every day', 'ప్రతి రోజు ఒక ఉచిత స్పిన్'), narrow: true, kind: 'wheel', render: (b) => {
      const cv = h('canvas', { width: 520, height: 520, class: 'wheelcv' }); this.drawWheel(cv); cv.style.transform = `rotate(${this.wdeg || 0}deg)`;
      const can = this.canSpin();
      const go = h('button', { type: 'button', class: 'btn acc big wheelgo', disabled: !can || spinning ? true : null, onclick: () => {
        if (spinning || !this.canSpin()) return; spinning = true; go.disabled = true; Audio2.unlock();
        this.spin(cv, (seg) => { spinning = false; this.prize(seg); });
      } }, can ? '🎡 ' + L('Spin!', 'తిప్పండి!') : L('Come back tomorrow for another free spin', 'మరో ఉచిత స్పిన్ కోసం రేపు రండి'));
      b.append(h('div', { class: 'wheelbox' }, h('i', { class: 'wheelptr', 'aria-hidden': 'true' }, '▼'), cv), go);
    } });
  },
  drawWheel(cv) {
    const x = cv.getContext('2d'), R = cv.width / 2, n = WHEEL.length;
    x.clearRect(0, 0, cv.width, cv.height);
    WHEEL.forEach((s, i) => {
      const a0 = -Math.PI / 2 + (i / n) * TAU - Math.PI / n, a1 = a0 + TAU / n;
      x.beginPath(); x.moveTo(R, R); x.arc(R, R, R - 6, a0, a1); x.closePath(); x.fillStyle = s.col; x.fill(); x.lineWidth = 4; x.strokeStyle = '#fff8e6'; x.stroke();
      x.save(); x.translate(R, R); x.rotate(a0 + Math.PI / n); x.fillStyle = '#fff'; x.font = '700 30px ' + getComputedStyle(document.body).fontFamily; x.textAlign = 'right'; x.textBaseline = 'middle';
      x.fillText(LN(s), R - 24, 0); x.restore();
    });
    x.beginPath(); x.arc(R, R, 34, 0, TAU); x.fillStyle = '#fff8e6'; x.fill(); x.font = '34px system-ui'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText('🎡', R, R + 2);
  },
  spin(cv, done, fast) {
    // no mango map once every golden mango is found
    const left = Fun.spots.length > Fun.st().mangoes.length, wt = (q) => (q.mango && !left ? 0 : q.w);
    const tot = WHEEL.reduce((s, q) => s + wt(q), 0); let r = Math.random() * tot, k = 0;
    for (; k < WHEEL.length - 1; k++) { if (r < wt(WHEEL[k])) break; r -= wt(WHEEL[k]); }
    this.st().spin = ymd(new Date());
    Bus.emit('wheelSpin', {});
    // land segment k under the pointer at the top, after a few full turns
    const n = WHEEL.length, end = 360 * 5 - (k / n) * 360 + (Math.random() - 0.5) * (300 / n), ms = fast ? 50 : 3800, t0 = performance.now();
    let lastSeg = -1;
    const step = (t) => {
      const u = Math.min(1, (t - t0) / ms), e = 1 - Math.pow(1 - u, 4), deg = end * e;
      cv.style.transform = `rotate(${deg}deg)`;
      const seg = Math.floor(((deg % 360) / 360) * n + 0.5); if (seg !== lastSeg) { lastSeg = seg; if (!fast) Audio2.sfx('click'); }
      if (u < 1) requestAnimationFrame(step); else { this.wdeg = deg % 360; done(WHEEL[k]); }
    };
    requestAnimationFrame(step);
    return k;
  },
  prize(s) {
    if (s.money) { Money.add(s.money, 'fun'); Celebrate.coins(innerWidth / 2, innerHeight * 0.5, s.money, 8); }
    if (s.items) for (const k in s.items) Inv.add(k, s.items[k]);
    if (s.seeds) Inv.add('seed_' + DailyGift.seedCrop(), s.seeds);
    if (s.turban) { const S = G.S; S.player.look = Object.assign(Wardrobe.def(S.player.gender), S.player.look || {}, { hat: 'turban', hatCol: '#ffd700' }); Wardrobe.apply(); }
    Celebrate.burst(innerWidth / 2, innerHeight * 0.4, 80, 0.9); Audio2.sfx('tada');
    this.ribbon('🎡', L('You won', 'మీరు గెలిచారు'), LN(s), s.turban ? L('Look at your new turban!', 'మీ కొత్త తలపాగా చూడండి!') : s.mango ? L('Follow the gold arrow!', 'బంగారు బాణాన్ని అనుసరించండి!') : '', 'big', 2800);
    if (s.mango) Fun.nearestMango(); else UI.rerender();
  },
};
