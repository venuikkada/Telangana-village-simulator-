// ============================================================================
// Games: Holi colours on the villagers, kite fights in the sky, gully cricket,
// fishing at the lake and a daily lucky wheel. Each is a few taps with one big
// button (HIT, PULL, DIVE) and a cheer at the end.
// ============================================================================
const HOLI_COLS = ['#ff2e93', '#22c55e', '#facc15', '#3b82f6', '#a855f7', '#fb923c', '#ef4444'];
const FISH = [
  { id: 'rohu', en: 'Rohu', te: 'రోహు', w: [1, 3], p: 120, odds: 0.45 },
  { id: 'katla', en: 'Katla', te: 'బొచ్చె', w: [2, 5], p: 110, odds: 0.25 },
  { id: 'murrel', en: 'Murrel', te: 'కొర్రమీను', w: [1, 2.5], p: 300, odds: 0.17 },
  { id: 'prawn', en: 'Prawns', te: 'రొయ్యలు', w: [0.3, 0.8], p: 600, odds: 0.1 },
  { id: 'golden', en: 'Golden fish', te: 'బంగారు చేప', w: [0.5, 1], p: 2500, odds: 0.03 },
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
const _gv = new THREE.Vector3();

const Games = {
  mode: null,   // 'kite' | 'cricket' | 'fish'
  btn: null, onDown: null, onUp: null,
  st() { const f = Fun.st(); f.games = f.games || {}; const g = f.games; g.fish = g.fish || {}; g.kites = g.kites || 0; g.best = g.best || 0; return g; },
  // cricket and fishing hold you in place: the stick does not walk you away
  busy() { return this.mode === 'cricket' || this.mode === 'fish'; },
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
    if (this.mode === 'cricket') { const c = this.cr; return '🏏 ' + c.runs + ' ' + L('runs', 'పరుగులు') + ' · ' + L('ball', 'బంతి') + ' ' + Math.min(6, c.bn + 1) + '/6  ✕'; }
    if (this.mode === 'fish') return '🎣 ' + L('Fishing', 'చేపల వేట') + '  ✕';
    return '';
  },
  // take a mesh out of the scene and free its GPU buffers (the shared material stays)
  drop(o) {
    if (!o) return; G.scene.remove(o);
    o.traverse((m) => { if (m.geometry) m.geometry.dispose(); if (m.material && m.material !== MAT.std) m.material.dispose(); });
  },
  stop() {
    const m = this.mode; this.mode = null; this.action(null);
    if (m === 'kite' && this.kite) { const k = this.kite; Cam.aim = null; this.drop(k.mesh); this.drop(k.line); for (const r of k.rivals) this.drop(r.mesh); this.kite = null; }
    if (m === 'cricket' && this.cr) { const c = this.cr; this.drop(c.ball); this.drop(c.stumps); this.drop(c.bat); if (this.bowler) this.bowler.visible = false; Cam.intro = null; this.cr = null; }
    if (m === 'fish' && this.fs) { const f = this.fs; for (const o of [f.bob, f.line, f.rod, f.fish]) this.drop(o); this.fs = null; }
    if (Player.h) Player.h.gpose = null;
    Fun.chipUpdate();
  },
  update(dt) {
    if (!this.mode) return;
    if (UI.modalOpen()) return;
    if (Input.pressed('KeyF') && this.onDown) { this.onDown(); this.fkey = true; }
    if (this.fkey && !Input.down('KeyF')) { this.fkey = false; if (this.onUp) this.onUp(); }
    if (this.mode === 'kite') this.kiteUpdate(dt);
    else if (this.mode === 'cricket') this.cricketUpdate(dt);
    else if (this.mode === 'fish') this.fishUpdate(dt);
  },
  ribbon(icon, top, title, sub, kind = 'sun', ms = 2200) { Celebrate.ribbon({ kind, icon, top, title, sub: sub || '', ms }); },

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
  kiteMesh(c1, c2) {
    const g = new THREE.Group();
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array([0, 0.7, 0, -0.55, 0.08, 0, 0, -0.7, 0, 0, 0.7, 0, 0, -0.7, 0, 0.55, 0.08, 0]), 3));
    const body = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ color: c1, side: THREE.DoubleSide, fog: true }));
    const stripe = new THREE.Mesh(new THREE.PlaneGeometry(1.1, 0.12), new THREE.MeshBasicMaterial({ color: c2, side: THREE.DoubleSide }));
    stripe.position.set(0, 0.08, 0.01);
    const tail = new THREE.Mesh(new THREE.PlaneGeometry(0.14, 1.7), new THREE.MeshBasicMaterial({ color: c2, side: THREE.DoubleSide }));
    tail.position.y = -1.5;
    g.add(body, stripe, tail); g.scale.setScalar(1.7); g.userData.tail = tail;
    return g;
  },
  kiteStart() {
    if (Player.vehicle) { UI.toast(L('Get off the vehicle first.', 'ముందు వాహనం దిగండి.'), 'info'); return; }
    this.stop(); UI.close(); Fun.bar(false);
    // kites need open sky: step out to the nearest open ground if walls or trees are all around you
    const sp = this.kiteSpot(), P = Player;
    if (sp) { P.x = sp.x; P.z = sp.z; P.y = World.groundHeight(sp.x, sp.z); P.em = null; }
    this.mode = 'kite';
    const k = this.kite = { L: 4, t: 0, pos: new THREE.Vector3(), init: false, rivals: [], cut: 0, dive: false, elev: 0.6, hurt: 0, atkT: 9 };
    k.mesh = this.kiteMesh(pick(['#e84393', '#f2b52d', '#2d6ca6', '#2f7d3a', '#c0392b']), '#ffffff');
    k.line = new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(), new THREE.Vector3()]), new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.75 }));
    k.line.frustumCulled = false;
    G.scene.add(k.mesh, k.line);
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
    G.scene.add(r.mesh);
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
    k.mesh.userData.tail.rotation.z = Math.sin(k.t * 6) * 0.35;
    const pa = k.line.geometry.attributes.position; pa.setXYZ(0, ax, ay, az); pa.setXYZ(1, k.pos.x, k.pos.y, k.pos.z); pa.needsUpdate = true;
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
        r.mesh.lookAt(ax, ay, az); r.mesh.rotateZ(Math.sin(r.t * (r.atk !== null ? 9 : 2.7)) * 0.3); r.mesh.userData.tail.rotation.z = Math.sin(r.t * (r.atk !== null ? 14 : 5)) * 0.4;
        const d = r.pos.distanceTo(k.pos);
        if (k.dive && d < 3.4) this.kiteCut(r);
        else if (r.atk !== null && (d < 1.6 || r.atk > 4)) { if (d < 1.6 && !k.hurt) this.kiteLost(); this.kiteBack(r); }
        else if (Math.hypot(r.cx - P.x, r.cz - P.z) > 90) r.dead = true;   // you walked away: a new kite takes its place
      }
      r.mesh.position.copy(r.pos);
    }
    k.rivals = k.rivals.filter((r) => { if (r.dead) { this.drop(r.mesh); return false; } return true; });
  },
  // an attacker goes back to circling from wherever it is now
  kiteBack(r) { r.atk = null; r.cx = r.pos.x - Math.cos(r.t * r.w) * r.rad; r.cz = r.pos.z - Math.sin(r.t * r.w) * r.rad; r.cy = r.pos.y - Math.sin(r.t * 0.8) * 2; },
  kiteCut(r) {
    const k = this.kite; r.falling = true; r.atk = null; r.vy = 0; r.vx = (Math.random() - 0.5) * 4; r.vz = (Math.random() - 0.5) * 4;
    k.cut++; this.st().kites++;
    Money.add(150, 'fun'); Audio2.sfx('tada'); Celebrate.burst(innerWidth / 2, innerHeight * 0.3, 50, 0.8);
    this.ribbon('🪁', L('You cut a kite!', 'గాలిపటం తెంపారు!'), L('Kai po che!', 'కాయ్ పో చే!'), '+' + fmtINR(150));
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
        if (ok) return (this._pitch = { bx: cx - fx * 9, bz: cz - fz * 9, wx: cx + fx * 9, wz: cz + fz * 9, fx, fz, yaw });
      }
    }
    return null;
  },
  cricketStart() {
    if (Player.vehicle) Player.exitVehicle(true);
    if (Player.vehicle) return;
    const p = this.pitch(); if (!p) { UI.toast(L('No open ground for cricket here.', 'ఇక్కడ క్రికెట్‌కు ఖాళీ మైదానం లేదు.'), 'warn'); return; }
    this.stop(); UI.close(); Fun.bar(false);
    this.mode = 'cricket';
    const c = this.cr = { p, bn: 0, runs: 0, state: 'wait', t: -1.2, press: null, swing: 0, out: false };
    const P = Player; P.x = p.bx; P.z = p.bz; P.y = World.groundHeight(p.bx, p.bz); P.yaw = p.yaw; P.em = null;
    const rx = -Math.cos(p.yaw), rz = Math.sin(p.yaw); c.rx = rx; c.rz = rz;
    // ball, stumps behind you, and your bat
    c.ball = new THREE.Mesh(new THREE.SphereGeometry(0.12, 10, 8), new THREE.MeshStandardMaterial({ color: 0xc22b2b, roughness: 0.45 }));
    c.ball.castShadow = true;
    const sb = new GeoBuilder(), gy = P.y;
    for (const o of [-0.13, 0, 0.13]) sb.box(0.05, 0.72, 0.05, rx * o, gy + 0.36, rz * o, 0, C('#f4e9d0'));
    sb.box(0.32, 0.04, 0.05, 0, gy + 0.74, 0, p.yaw, C('#e2b81f'));
    c.stumps = new THREE.Mesh(sb.build(), MAT.std); c.stumps.position.set(p.bx - p.fx * 0.9, 0, p.bz - p.fz * 0.9);
    const bb = new GeoBuilder(); bb.box(0.13, 0.62, 0.05, 0, -0.42, 0, 0, C('#d9b47a')); bb.box(0.04, 0.3, 0.04, 0, 0.0, 0, 0, C('#2f3134'));
    c.bat = new THREE.Mesh(bb.build(), MAT.std); c.bat.castShadow = true;
    G.scene.add(c.ball, c.stumps, c.bat);
    if (!this.bowler) this.bowler = Humans.create(Humans.appearance({ gender: 'm', shirt: '#f4f4f0', lower: 'pants', pants: '#f4f4f0' }), p.wx, p.wz);
    const bw = this.bowler; if (bw) { bw.visible = true; bw.x = p.wx + p.fx * 6; bw.z = p.wz + p.fz * 6; bw.y = World.groundHeight(bw.x, bw.z); bw.yaw = p.yaw + Math.PI; bw.pose = 'idle'; bw.speed = 0; }
    // camera behind the batter, looking down the pitch
    Cam.intro = (dt, cam) => {
      const P2 = Player; cam.position.set(P2.x - p.fx * 4.4 + rx * 0.9, P2.y + 2.3, P2.z - p.fz * 4.4 + rz * 0.9);
      cam.lookAt(p.wx, World.groundHeight(p.wx, p.wz) + 0.9, p.wz); Cam.focus.set(P2.x, P2.y, P2.z);
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
    if (c.state === 'wait') {
      if (bw) { bw.pose = 'idle'; bw.speed = 0; }
      c.ball.visible = false;
      if (c.t >= 0) { c.state = 'runup'; c.t = 0; c.T = 0.85 + Math.random() * 0.3; c.press = null; }
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
      this.ballAt(s, c.ball.position);
      if (s > 1.25) this.cricketMiss();
    } else if (c.state === 'flight') {
      const v = c.vel; v.y -= 9.8 * dt; c.ball.position.addScaledVector(v, dt);
      const gy = World.groundHeight(c.ball.position.x, c.ball.position.z) + 0.12;
      if (c.ball.position.y < gy) { c.ball.position.y = gy; if (v.y < 0) { v.y *= -0.35; v.x *= 0.6; v.z *= 0.6; } }
      if (c.t > 2.6) this.cricketNext();
    } else if (c.state === 'done') { if (c.t > 1.6) this.cricketNext(); }
  },
  cricketHit(e) {
    const c = this.cr, p = c.p, q = Math.abs(e);
    const kind = q < 0.07 ? 6 : q < 0.14 ? 4 : q < 0.21 ? 2 : 1;
    c.runs += kind; c.state = 'flight'; c.t = 0;
    const ang = clamp(e * 4, -1.1, 1.1) + (Math.random() - 0.5) * 0.4;   // early pulls to one side, late to the other
    const dx = p.fx * Math.cos(ang) + c.rx * Math.sin(ang), dz = p.fz * Math.cos(ang) + c.rz * Math.sin(ang);
    const sp = kind === 6 ? 25 : kind === 4 ? 23 : kind === 2 ? 13 : 8, vy = kind === 6 ? 15 : kind === 4 ? 3 : 5;
    c.vel = new THREE.Vector3(dx * sp, vy, dz * sp);
    Audio2.sfx('bump');
    if (kind === 6) {
      this.ribbon('🏏', L('Out of the ground!', 'మైదానం బయటికి!'), L('SIX!', 'సిక్స్!'), '+' + kind, 'big', 1800); Celebrate.shower(90); Audio2.sfx('fanfare');
      for (const n of NPCs.list) if (!n.worker && n.h.visible && Math.hypot(n.h.x - p.bx, n.h.z - p.bz) < 45) n.react = { pose: 'bhangra', until: G.t + 4 };
    } else if (kind === 4) { this.ribbon('🏏', L('Lovely shot!', 'అద్భుతమైన షాట్!'), L('FOUR!', 'ఫోర్!'), '+4', 'sun', 1600); Celebrate.burst(innerWidth / 2, innerHeight * 0.35, 50, 0.7); Audio2.sfx('tada'); }
    else { this.ribbon('🏏', e < 0 ? L('A bit early', 'కొంచెం ముందుగా') : L('A bit late', 'కొంచెం ఆలస్యంగా'), kind === 2 ? L('2 runs', '2 పరుగులు') : L('1 run', '1 పరుగు'), '+' + kind, 'sun', 1400); }
    Fun.chipUpdate();
  },
  cricketMiss() {
    const c = this.cr; c.state = 'done'; c.t = 0;
    const bowled = Math.random() < 0.45;
    if (bowled) {
      c.out = true; c.stumps.rotation.x = -0.5; Audio2.sfx('bump');
      this.ribbon('😮', L('The stumps are down.', 'వికెట్లు పడిపోయాయి.'), L('Bowled!', 'బౌల్డ్!'), '', 'sun', 1600);
    } else UI.toast(c.press === null ? L('Missed! Tap Hit as the ball arrives.', 'తప్పింది! బంతి రాగానే కొట్టు నొక్కండి.') : L('Missed! Try to time it better.', 'తప్పింది! సమయం సరిగ్గా చూసి కొట్టండి.'), 'info');
  },
  cricketNext() {
    const c = this.cr; c.bn += 1;
    if (c.out || c.bn >= 6) { this.cricketEnd(); return; }
    c.state = 'wait'; c.t = -0.9; c.stumps.rotation.x = 0;
    Fun.chipUpdate();
  },
  cricketEnd() {
    const c = this.cr, g = this.st(), best = c.runs > g.best;
    if (best) g.best = c.runs;
    const prize = c.runs * 30;
    if (prize) { Money.add(prize, 'fun'); Celebrate.coins(innerWidth / 2, innerHeight * 0.4, prize, 6); }
    this.ribbon('🏏', L('Innings over', 'ఇన్నింగ్స్ ముగిసింది'), L(`${c.runs} runs`, `${c.runs} పరుగులు`) + (best ? '  ' + L('New best!', 'కొత్త రికార్డు!') : ''), prize ? '+' + fmtINR(prize) : '', c.runs >= 12 ? 'big' : 'sun', 3000);
    if (c.runs >= 12) Celebrate.shower(120);
    this.stop();
  },

  // ---------- fishing at the lake: wait for the float to dip, then pull ----------
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
    P.yaw = Math.atan2(dx, dz); P.em = null; Cam.yaw = P.yaw + Math.PI;   // look out over the water
    let d = 7; while (d < 22 && lakeSD(P.x + dx * d, P.z + dz * d) > -1.5) d += 1;
    const f = this.fs = { dx, dz, tx: P.x + dx * d, tz: P.z + dz * d, state: 'cast', t: 0, wait: 0, caught: null };
    f.bob = new THREE.Mesh(new THREE.SphereGeometry(0.16, 10, 8), new THREE.MeshBasicMaterial({ color: 0xff4d2e }));
    f.line = new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(), new THREE.Vector3()]), new THREE.LineBasicMaterial({ color: 0xf4f1ea, transparent: true, opacity: 0.8 }));
    f.line.frustumCulled = false;
    f.rod = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.03, 2.8, 6), new THREE.MeshStandardMaterial({ color: 0x8a5a2a }));
    f.fish = new THREE.Mesh(new THREE.SphereGeometry(0.22, 10, 6), new THREE.MeshStandardMaterial({ color: 0xb8c4cc, metalness: 0.4, roughness: 0.35 }));
    f.fish.scale.set(0.6, 0.6, 1.6); f.fish.visible = false;
    G.scene.add(f.bob, f.line, f.rod, f.fish);
    this.action('🎣 ' + L('Pull!', 'లాగు!'), () => this.fishPull(), null);
    UI.toastOnce('fishtip', L('Wait for the red float to dip under, then tap Pull quickly!', 'ఎరుపు బెండు నీటిలో మునిగినప్పుడు వెంటనే లాగు నొక్కండి!'), 'info');
    Fun.chipUpdate();
  },
  fishTip(out) { const P = Player, f = this.fs; return out.set(P.x + f.dx * 2.5, P.y + 2.6, P.z + f.dz * 2.5); },
  fishUpdate(dt) {
    const f = this.fs, P = Player;
    if (P.h) P.h.gpose = 'fish';
    f.t += dt;
    const wy = World.lake.position.y;
    // the rod from your hands out over the water
    const hx = P.x + f.dx * 0.35, hy = P.y + 1.05, hz = P.z + f.dz * 0.35, tip = this.fishTip(_v2);
    f.rod.position.set((hx + tip.x) / 2, (hy + tip.y) / 2, (hz + tip.z) / 2);
    _v3.set(tip.x - hx, tip.y - hy, tip.z - hz).normalize(); f.rod.quaternion.setFromUnitVectors(UP, _v3);
    if (f.state === 'cast') {
      const u = Math.min(1, f.t / 0.7);
      f.bob.position.set(lerp(tip.x, f.tx, u), lerp(tip.y, wy, u) + Math.sin(u * Math.PI) * 2, lerp(tip.z, f.tz, u));
      if (u >= 1) { f.state = 'wait'; f.t = 0; f.wait = 2 + Math.random() * 5; FX.emit('splash', f.tx, wy + 0.1, f.tz, 0, 1.5, 0); Audio2.sfx('step'); }
    } else if (f.state === 'wait') {
      f.bob.position.set(f.tx, wy + 0.04 + Math.sin(f.t * 2.4) * 0.03, f.tz);
      if (f.t > f.wait) { f.state = 'bite'; f.t = 0; Audio2.sfx('hint'); for (let k = 0; k < 6; k++) FX.emit('splash', f.tx + (Math.random() - 0.5) * 0.6, wy + 0.1, f.tz + (Math.random() - 0.5) * 0.6, 0, 1.2 + Math.random(), 0); }
    } else if (f.state === 'bite') {
      f.bob.position.set(f.tx, wy - 0.22 + Math.sin(f.t * 25) * 0.05, f.tz);
      if (f.t > 1.0) { f.state = 'recast'; f.t = 0; UI.toast(L('It got away! Pull as soon as the float dips.', 'తప్పించుకుంది! బెండు మునగగానే లాగండి.'), 'info'); }
    } else if (f.state === 'catch') {
      const u = Math.min(1, f.t / 0.8);
      f.fish.visible = true; f.fish.position.set(lerp(f.tx, tip.x, u), lerp(wy, tip.y - 0.6, u) + Math.sin(u * Math.PI) * 2.2, lerp(f.tz, tip.z, u));
      f.fish.rotation.set(Math.sin(f.t * 30) * 0.4, f.t * 3, 0);
      f.bob.position.copy(f.fish.position);
      if (f.t > 1.6) { f.fish.visible = false; f.state = 'recast'; f.t = 0; }
    } else if (f.state === 'recast') {
      f.bob.position.lerp(tip, Math.min(1, dt * 4));
      if (f.t > 0.8) { f.state = 'cast'; f.t = 0; }
    }
    const pa = f.line.geometry.attributes.position; pa.setXYZ(0, tip.x, tip.y, tip.z); pa.setXYZ(1, f.bob.position.x, f.bob.position.y, f.bob.position.z); pa.needsUpdate = true;
  },
  fishPull() {
    const f = this.fs; if (!f) return;
    if (f.state === 'wait') { f.state = 'recast'; f.t = 0; UI.toast(L('Too early! The fish swam away.', 'చాలా త్వరగా! చేప ఈదుకుంటూ వెళ్లిపోయింది.'), 'info'); return; }
    if (f.state !== 'bite') return;
    let r = Math.random(), fish = FISH[0];
    for (const q of FISH) { if (r < q.odds) { fish = q; break; } r -= q.odds; }
    const kg = +(fish.w[0] + Math.random() * (fish.w[1] - fish.w[0])).toFixed(1), pay = fish.id === 'golden' ? fish.p : Math.round(fish.p * kg);
    const g = this.st(); g.fish[fish.id] = (g.fish[fish.id] || 0) + 1;
    f.state = 'catch'; f.t = 0; f.fish.material.color.set(fish.id === 'golden' ? 0xffc21a : fish.id === 'prawn' ? 0xf0a080 : 0xb8c4cc);
    Money.add(pay, 'fun'); Audio2.sfx(fish.id === 'golden' ? 'fanfare' : 'coin');
    this.ribbon(fish.id === 'golden' ? '🌟' : '🐟', fish.id === 'golden' ? L('Golden fish!', 'బంగారు చేప!') : L('You caught a fish!', 'చేప పట్టారు!'), LN(fish) + ' · ' + kg + ' kg', '+' + fmtINR(pay), fish.id === 'golden' ? 'big' : 'sun', 2000);
    if (fish.id === 'golden') Celebrate.shower(120);
    Celebrate.coins(innerWidth / 2, innerHeight * 0.45, pay, 4);
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
