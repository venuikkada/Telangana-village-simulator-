// ============================================================================
// Fun: dress up your farmer, funny moves (the villagers join in), an Explore
// mode that stops the clock, golden mangoes hidden all over the map, places
// to discover, and checkpoint races for any vehicle (or on foot).
// ============================================================================
const SKINS = ['#f1c9a5', '#d9a47c', '#b27a57', '#94613f', '#7a4b30', '#5c3920'];
const HAIRS = ['#15110e', '#4a2a17', '#d8d3cc', '#b5541c', '#e2b81f', '#2d6ca6', '#c0161b'];
const CLOTH = ['#f2efe6', '#c0392b', '#e07b22', '#e2b81f', '#2f7d3a', '#1f9e9a', '#2d6ca6', '#1f3f8a', '#6b3fa0', '#e84393', '#3b3f4a', '#1a1a1a'];
const HATS = ['#f4f1ea', '#e07b22', '#c0392b', '#2f7d3a', '#e84393', '#e2b81f', '#1f3f8a', '#ffd700'];

// ---------- the wardrobe ----------
const Wardrobe = {
  def(g) {
    return g === 'f'
      ? { skin: '#94613f', hair: '#15110e', hat: 'none', hatCol: '#f4f1ea', shades: false, bindi: true, top: '#e2b81f', lower: 'saree', lowerCol: '#2f7d3a', scarf: null, height: 1, build: 1 }
      : { skin: '#94613f', hair: '#15110e', hat: 'none', hatCol: '#f4f1ea', shades: false, stache: true, top: '#f2efe6', lower: 'lungi', lowerCol: '#2d6ca6', scarf: '#c0392b', height: 1, build: 1 };
  },
  // a look (colours and choices) -> what the character model draws
  app(g, look) {
    const o = Object.assign(this.def(g), look || {});
    const a = { gender: g, age: 'adult', skin: C(o.skin), hair: C(o.hair), h: o.height || 1, w: o.build || 1, shades: !!o.shades, hat: o.hat };
    a.turban = o.hat !== 'none' ? C(o.hatCol) : null;
    if (g === 'f') {
      a.lower = o.lower === 'pants' ? 'pants' : 'saree';
      a.blouse = C(o.top); a.shirt = a.blouse; a.bun = true; a.bindi = o.bindi !== false;
      if (a.lower === 'saree') { a.saree = C(o.lowerCol); a.skirtCol = a.saree; a.legs = a.skin; }
      else { a.legs = C(o.lowerCol); a.skirtCol = null; a.towel = o.scarf ? C(o.scarf) : null; a.saree = a.towel; }
    } else {
      const lw = o.lower === 'dhoti' ? 'lungi' : o.lower;
      a.shirt = C(o.top); a.lower = lw;
      a.legs = lw === 'pants' || lw === 'shorts' ? C(o.lowerCol) : a.skin;
      a.skirtCol = lw === 'lungi' ? C(o.lower === 'dhoti' ? '#f4f1ea' : o.lowerCol) : null;
      a.towel = o.scarf ? C(o.scarf) : null; a.stache = o.stache !== false;
    }
    return a;
  },
  apply() { const S = G.S; if (!S || !Player.h) return; Player.h.app = this.app(S.player.gender, S.player.look); Humans.applyColors(Player.h); },
  random(g) {
    const pk = (a) => a[(Math.random() * a.length) | 0];
    const o = this.def(g);
    Object.assign(o, { skin: pk(SKINS), hair: pk(HAIRS), hat: pk(['none', 'none', 'turban', 'cap']), hatCol: pk(HATS), shades: Math.random() < 0.4, top: pk(CLOTH), lowerCol: pk(CLOTH), height: pk([0.92, 1, 1.08]), build: pk([0.88, 1, 1.15]) });
    if (g === 'f') { o.lower = pk(['saree', 'saree', 'pants']); o.scarf = Math.random() < 0.5 ? pk(CLOTH) : null; o.bindi = Math.random() < 0.8; }
    else { o.lower = pk(['lungi', 'dhoti', 'pants', 'shorts']); o.scarf = Math.random() < 0.6 ? pk(CLOTH) : null; o.stache = Math.random() < 0.7; }
    return o;
  },
  // the dressing room: a panel at the side, the camera in front of your farmer
  open() {
    const S = G.S; if (!S) return;
    Fun.bar(false); if (Games.mode) Games.stop();
    let look = Object.assign(this.def(S.player.gender), S.player.look || {});
    const save = () => { S.player.look = JSON.parse(JSON.stringify(look)); this.apply(); };
    const sw = (list, cur, fn, none) => h('div', { class: 'swatches' },
      none ? h('button', { type: 'button', class: 'sw none' + (cur ? '' : ' on'), 'aria-label': L('None', 'ఏమీ లేదు'), onclick: () => { fn(null); save(); UI.rerender(); Audio2.sfx('click'); } }, '✕') : null,
      ...list.map((c) => h('button', { type: 'button', class: 'sw' + (c === cur ? ' on' : ''), style: { background: c }, 'aria-label': c, onclick: () => { fn(c); save(); UI.rerender(); Audio2.sfx('click'); } })));
    const seg = (opts, cur, fn) => Menu.seg(opts, cur, (x) => { fn(x); save(); });
    const onOff = (cur, fn) => seg([[true, L('On', 'ఆన్')], [false, L('Off', 'ఆఫ్')]], !!cur, fn);
    UI.sheet({ title: L('Your character', 'మీ పాత్ర'), narrow: true, kind: 'wardrobe', cls: 'side', onClose: () => this.close(), render: (b) => {
      const g = S.player.gender, row = Menu.grid(b);
      row(L('Farmer', 'రైతు'), seg([['m', L('Man', 'పురుషుడు')], ['f', L('Woman', 'స్త్రీ')]], g, (x) => { if (x !== S.player.gender) { S.player.gender = x; look = this.def(x); } }));
      row(L('Skin', 'చర్మం రంగు'), sw(SKINS, look.skin, (c) => { look.skin = c; }));
      row(L('Hair', 'జుట్టు'), sw(HAIRS, look.hair, (c) => { look.hair = c; }));
      row(L('Head', 'తలపై'), seg([['none', L('None', 'ఏమీ లేదు')], ['turban', L('Turban', 'తలపాగా')], ['cap', L('Cap', 'టోపీ')]], look.hat, (x) => { look.hat = x; }));
      if (look.hat !== 'none') row('', sw(HATS, look.hatCol, (c) => { look.hatCol = c; }));
      row(L('Sunglasses', 'కళ్లజోడు'), onOff(look.shades, (x) => { look.shades = x; }));
      if (g === 'f') row(L('Bindi', 'బొట్టు'), onOff(look.bindi !== false, (x) => { look.bindi = x; }));
      else row(L('Mustache', 'మీసం'), onOff(look.stache !== false, (x) => { look.stache = x; }));
      row(L('Top', 'పై దుస్తులు'), sw(CLOTH, look.top, (c) => { look.top = c; }));
      row(L('Bottom', 'కింది దుస్తులు'), seg(g === 'f' ? [['saree', L('Saree', 'చీర')], ['pants', L('Salwar', 'సల్వార్')]] : [['lungi', L('Lungi', 'లుంగీ')], ['dhoti', L('Dhoti', 'పంచె')], ['pants', L('Pants', 'ప్యాంటు')], ['shorts', L('Shorts', 'నిక్కరు')]], look.lower, (x) => { look.lower = x; }));
      if (look.lower !== 'dhoti') row('', sw(CLOTH, look.lowerCol, (c) => { look.lowerCol = c; }));
      if (g !== 'f' || look.lower === 'pants') row(g === 'f' ? L('Dupatta', 'దుపట్టా') : L('Towel', 'తువ్వాలు'), sw(CLOTH.slice(0, 10), look.scarf, (c) => { look.scarf = c; }, true));
      row(L('Height', 'ఎత్తు'), seg([[0.92, L('Short', 'పొట్టి')], [1, L('Normal', 'సాధారణం')], [1.08, L('Tall', 'పొడవు')]], look.height, (x) => { look.height = x; }));
      row(L('Build', 'శరీరం'), seg([[0.88, L('Slim', 'సన్నం')], [1, L('Normal', 'సాధారణం')], [1.15, L('Strong', 'బలంగా')]], look.build, (x) => { look.build = x; }));
      b.append(h('div', { class: 'row mfoot' },
        UI.btn('🎲 ' + L('Surprise me', 'ఏదైనా ఎంచు'), () => { look = this.random(S.player.gender); save(); Audio2.sfx('boing'); }, 'alt'),
        UI.btn(L('Done', 'పూర్తి'), () => UI.close(), 'acc')));
    } });
    document.getElementById('modal').classList.add('side');
    this.preview();
  },
  preview() {
    let t = 0;
    Cam.intro = (dt, cam) => {
      t += dt;
      const P = Player.h; if (!P) return;
      const port = innerHeight > innerWidth;
      const yaw = Player.yaw + Math.sin(t * 0.35) * 0.35, fx = Math.sin(yaw), fz = Math.cos(yaw);
      const rx = fz, rz = -fx;   // the camera's right, looking back at the farmer
      const hs = P.app.h || 1;
      cam.position.set(P.x + fx * 3.3, P.y + 1.35 * hs, P.z + fz * 3.3);
      if (port) cam.lookAt(P.x, P.y + 0.35 * hs, P.z); else cam.lookAt(P.x + rx * 0.95, P.y + 0.95 * hs, P.z + rz * 0.95);
      Cam.focus.set(P.x, P.y + 1, P.z);
    };
  },
  close() { Cam.intro = null; const m = document.getElementById('modal'); if (m) m.classList.remove('side'); },
};

// ---------- funny moves ----------
const EMOTES = [
  { id: 'wave', icon: '👋', en: 'Wave', te: 'చేయి ఊపు', pose: 'wave', dur: 3, react: 'wave' },
  { id: 'namaste', icon: '🙏', en: 'Namaste', te: 'నమస్తే', pose: 'namaste', dur: 3, react: 'namaste' },
  { id: 'dance', icon: '💃', en: 'Dance', te: 'డాన్స్', pose: 'bhangra', loop: true, react: 'bhangra', beat: true },
  { id: 'folk', icon: '🪘', en: 'Folk dance', te: 'జానపద నృత్యం', pose: 'dance', loop: true, react: 'dance', beat: true },
  { id: 'clap', icon: '👏', en: 'Clap', te: 'చప్పట్లు', pose: 'clap', dur: 3, react: 'clap', sfx: 'clap' },
  { id: 'laugh', icon: '😂', en: 'Laugh', te: 'నవ్వు', pose: 'laugh', dur: 3.5, react: 'laugh', sfx: 'laugh' },
  { id: 'flex', icon: '💪', en: 'Show muscles', te: 'కండలు చూపు', pose: 'flex', dur: 3.5, react: 'clap', sfx: 'boing' },
  { id: 'chicken', icon: '🐔', en: 'Chicken dance', te: 'కోడి డాన్స్', pose: 'chicken', loop: true, react: 'laugh', sfx: 'cluck' },
  { id: 'cartwheel', icon: '🤸', en: 'Cartwheel', te: 'పల్టీ', pose: 'star', dur: 1.2, roll: true, react: 'clap', sfx: 'whoosh' },
  { id: 'spin', icon: '🌀', en: 'Spin', te: 'గిర్రున తిరుగు', pose: 'star', dur: 2.2, spin: true, react: 'laugh', sfx: 'whoosh' },
  { id: 'joy', icon: '🎉', en: 'Jump for joy', te: 'ఆనందంతో ఎగురు', pose: 'joy', dur: 2.4, hop: true, react: 'clap', sfx: 'tada' },
  { id: 'yoga', icon: '🧘', en: 'Yoga', te: 'యోగా', pose: 'yoga', loop: true },
  { id: 'selfie', icon: '🤳', en: 'Selfie', te: 'సెల్ఫీ', pose: 'selfie', dur: 2.5, snap: true },
  { id: 'facepalm', icon: '🤦', en: 'Facepalm', te: 'అయ్యో!', pose: 'facepalm', dur: 2.5, react: 'laugh' },
  { id: 'sit', icon: '🧎', en: 'Sit down', te: 'కూర్చో', pose: 'groundsit', loop: true, sitY: 0.12 },
  { id: 'sleep', icon: '😴', en: 'Nap', te: 'కునుకు', pose: 'sleep', loop: true, lie: true, sfx: 'snore' },
  { id: 'holi', icon: '🎨', en: 'Holi colours', te: 'హోలీ రంగులు', pose: 'joy', dur: 1.8, holi: true },
];
const Emote = {
  beatT: 0,
  byId(id) { return EMOTES.find((e) => e.id === id); },
  play(id) {
    if (!G.started) return;
    if (Player.vehicle) { UI.toastOnce('emoteveh', L('Get off the vehicle first.', 'ముందు వాహనం దిగండి.'), 'info'); return; }
    const E = this.byId(id); if (!E) return;
    if (Games.busy()) Games.stop();   // cricket and fishing hold you still: a move ends them
    Player.em = { id, t: 0, hop: 0, snapped: false };
    if (E.sfx) Audio2.sfx(E.sfx);
    if (E.holi) Games.holi();
    this.beatT = 0;
    // the villagers around you join in, wave back or laugh along
    if (E.react) {
      const P = Player.pos(); let n = 0;
      for (const npc of NPCs.list) {
        if (npc.worker || npc.talking || !npc.h.visible) continue;
        if (Math.hypot(npc.h.x - P.x, npc.h.z - P.z) > 14) continue;
        npc.react = { pose: E.react, until: G.t + (E.loop ? 9 : 3.5) + Math.random() };
        if (++n >= 6) break;
      }
      if (n && E.beat) UI.toastOnce('joined', L('The villagers are dancing with you!', 'ఊరి వాళ్లు మీతో కలిసి డాన్స్ చేస్తున్నారు!'), 'good');
    }
    Fun.bar(false);
    Bus.emit('emote', { id });
  },
  // the drum beat while you dance
  update(dt) {
    const em = Player.em; if (!em) return;
    const E = this.byId(em.id); if (!E || !E.beat) return;
    this.beatT -= dt; if (this.beatT <= 0) { this.beatT = 0.46; Audio2.sfx('dhol'); }
  },
};

// ---------- activities ----------
const RACES = [
  { id: 'village', en: 'Village loop', te: 'ఊరి చుట్టు', stops: ['busV', 'temple', 'panchayat', 'phc', 'busV'] },
  { id: 'lake', en: 'Lake and hill ride', te: 'చెరువు, గుట్ట సవారీ', stops: ['home', 'ghat', 'shrine'] },
  { id: 'highway', en: 'Highway dash', te: 'హైవే పరుగు', stops: ['busV', 'petrol', 'dhaba'] },
];
const MANGO_COUNT = 30;
const Fun = {
  ready: false, spots: [], mesh: null, race: null, rings: [], chip: null, _o: null,
  st() { const S = G.S; S.fun = S.fun || {}; const f = S.fun; f.mangoes = f.mangoes || []; f.places = f.places || {}; f.best = f.best || {}; return f; },
  start() {
    const f = this.st();
    this.spots = this.mangoSpots();
    // golden mangoes: one instanced draw, bobbing and turning
    const g = new THREE.IcosahedronGeometry(0.34, 1); g.scale(1, 1.25, 1);
    const mat = new THREE.MeshStandardMaterial({ color: 0xffcf33, emissive: 0xff9a00, emissiveIntensity: 0.65, roughness: 0.35, metalness: 0.25 });
    this.mesh = new THREE.InstancedMesh(g, mat, MANGO_COUNT); this.mesh.frustumCulled = false; this.mesh.castShadow = true;
    G.scene.add(this.mesh); this._o = new THREE.Object3D();
    // places right around your house count as known
    for (const p of Map2.places()) if (Math.hypot(p.x - HOME.x, p.z - HOME.z) < 80) f.places[p.id] = true;
    this.ready = true;
  },
  mangoSpots() {
    let seed = 20261005;
    const rnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
    const ok = (x, z) => Math.abs(x) < PLAY_HALF - 30 && Math.abs(z) < PLAY_HALF - 30 && lakeSD(x, z) > 3 && !World.collideCircle({ x, z }, 1.2);
    const out = [];
    for (const p of Map2.places()) for (let k = 0; k < 6; k++) { const a = rnd() * TAU, r = 14 + rnd() * 22, x = p.x + Math.cos(a) * r, z = p.z + Math.sin(a) * r; if (ok(x, z)) { out.push({ x, z }); break; } }
    for (let tries = 0; out.length < MANGO_COUNT && tries < 4000; tries++) { const x = (rnd() - 0.5) * 2 * (PLAY_HALF - 60), z = (rnd() - 0.5) * 2 * (PLAY_HALF - 60); if (ok(x, z) && out.every((q) => Math.hypot(q.x - x, q.z - z) > 60)) out.push({ x, z }); }
    return out.slice(0, MANGO_COUNT);
  },
  explore(on) {
    const S = G.S; S.explore = !!on;
    UI.toast(on ? L('Explore mode: the clock stops and you do not get tired. Go anywhere!', 'అన్వేషణ మోడ్: గడియారం ఆగుతుంది, అలసట ఉండదు. ఎక్కడికైనా వెళ్లండి!') : L('Explore mode off: the day goes on.', 'అన్వేషణ మోడ్ ఆఫ్: రోజు కొనసాగుతుంది.'), 'info');
    this.chipUpdate(); UI.rerender();
  },
  // gold arrow and minimap: the next race checkpoint
  guide() { const r = this.race; if (!r || r.i >= r.pts.length) return null; const p = r.pts[r.i]; return { x: p.x, z: p.z, name: L('Checkpoint', 'చెక్‌పాయింట్') + ' ' + (r.i + 1) + '/' + r.pts.length }; },
  update(dt) {
    if (!this.ready || !G.started) return;
    Emote.update(dt);
    const f = this.st(), P = Player.pos(), v = Player.vehicle, m = this.mesh, o = this._o;
    // mangoes
    const got = new Set(f.mangoes);
    for (let i = 0; i < this.spots.length; i++) {
      const s = this.spots[i];
      if (got.has(i)) { o.position.set(0, -999, 0); o.scale.setScalar(0); }
      else {
        const gy = World.groundHeight(s.x, s.z);
        o.position.set(s.x, gy + 1.1 + Math.sin(G.t * 2 + i) * 0.15, s.z); o.rotation.set(0.25, G.t * 1.6 + i, 0); o.scale.setScalar(1);
        const py = v ? v.y : Player.y;
        if (Math.hypot(s.x - P.x, s.z - P.z) < (v ? 3.6 : 1.9) && Math.abs(py - gy) < 6) this.collect(i);
      }
      o.updateMatrix(); m.setMatrixAt(i, o.matrix);
    }
    m.instanceMatrix.needsUpdate = true;
    // places
    this.placeT = (this.placeT || 0) - dt;
    if (this.placeT <= 0) {
      this.placeT = 0.5;
      for (const p of Map2.places()) if (!f.places[p.id] && Math.hypot(p.x - P.x, p.z - P.z) < 22) this.discover(p);
    }
    this.raceUpdate(dt);
    this.chipT = (this.chipT || 0) - dt; if (this.chipT <= 0) { this.chipT = 0.1; this.chipUpdate(); }
  },
  collect(i) {
    const f = this.st(); if (f.mangoes.includes(i)) return;
    f.mangoes.push(i);
    const n = f.mangoes.length, all = n >= this.spots.length;
    Money.add(500, 'fun'); Audio2.sfx('coin');
    Celebrate.burst(innerWidth / 2, innerHeight * 0.45, 40, 0.7); Celebrate.coins(innerWidth / 2, innerHeight * 0.45, 500, 5);
    Celebrate.ribbon({ kind: 'sun', icon: '🥭', top: L('Golden mango!', 'బంగారు మామిడి!'), title: n + ' / ' + this.spots.length, sub: '+' + fmtINR(500), ms: 2200 });
    if (all) { Money.add(10000, 'fun'); Celebrate.shower(170); Celebrate.ribbon({ kind: 'big', icon: '🏆', top: L('All golden mangoes found!', 'అన్ని బంగారు మామిడి పండ్లు దొరికాయి!'), title: L('Mango master', 'మామిడి మాస్టర్'), sub: '+' + fmtINR(10000), ms: 3600 }); Audio2.sfx('fanfare'); }
    if (G.S.waypoint && G.S.waypoint.mango === i) G.S.waypoint = null;
  },
  discover(p) {
    const f = this.st(); f.places[p.id] = true;
    Money.add(200, 'fun');
    const n = Object.keys(f.places).length, all = Map2.places().length;
    Celebrate.ribbon({ kind: 'sun', icon: '📍', top: L('Place discovered', 'కొత్త ప్రదేశం'), title: Map2.placeName(p), sub: n + ' / ' + all + '  +' + fmtINR(200), ms: 2400 });
    Audio2.sfx('step');
  },
  nearestMango() {
    const f = this.st(), P = Player.pos(); let best = -1, bd = 1e9;
    this.spots.forEach((s, i) => { if (f.mangoes.includes(i)) return; const d = Math.hypot(s.x - P.x, s.z - P.z); if (d < bd) { bd = d; best = i; } });
    if (best < 0) return;
    const s = this.spots[best]; G.S.waypoint = { x: s.x, z: s.z, name: L('Golden mango', 'బంగారు మామిడి'), mango: best };
    UI.close(); UI.toast(L('Follow the gold arrow to the nearest golden mango.', 'దగ్గరి బంగారు మామిడి కోసం బంగారు బాణాన్ని అనుసరించండి.'), 'info');
  },
  // ---- races ----
  track(R) {
    if (R.pts) return R.pts;
    const places = Map2.places(), at = (id) => places.find((q) => q.id === id);
    const line = [];
    for (let k = 0; k + 1 < R.stops.length; k++) {
      const a = at(R.stops[k]), b = at(R.stops[k + 1]); if (!a || !b) return null;
      const path = Graph.path(a.x, a.z, b.x, b.z, 0); if (!path || !path.length) return null;
      if (!line.length) line.push({ x: a.x, z: a.z });
      for (const p of path) line.push({ x: p.x, z: p.z });
      line.push({ x: b.x, z: b.z });
    }
    // a checkpoint every ~70 m along the road
    const pts = []; let acc = 0, len = 0;
    for (let i = 1; i < line.length; i++) { const d = Math.hypot(line[i].x - line[i - 1].x, line[i].z - line[i - 1].z); acc += d; len += d; if (acc >= 70 || i === line.length - 1) { pts.push({ x: line[i].x, z: line[i].z }); acc = 0; } }
    R.start = line[0]; R.len = len; R.pts = pts;
    return pts;
  },
  raceStart(id) {
    const R = RACES.find((r) => r.id === id); if (!R) return;
    const pts = this.track(R); if (!pts || pts.length < 2) { UI.toast(L('This race is not ready yet.', 'ఈ పందెం ఇంకా సిద్ధం కాలేదు.'), 'warn'); return; }
    UI.close(); this.bar(false);
    // to the start line, facing the first checkpoint
    const s = R.start, yaw = Math.atan2(pts[0].x - s.x, pts[0].z - s.z), v = Player.vehicle;
    if (v) { v.x = s.x; v.z = s.z; v.yaw = yaw; v.speed = 0; if (v.def.fly) v.alt = Math.max(v.alt || 0, 0); else v.place(); }
    else { Player.x = s.x; Player.z = s.z; Player.y = World.groundHeight(s.x, s.z); Player.yaw = yaw; }
    Cam.yaw = yaw + Math.PI;
    this.race = { R, pts, i: 0, t: -3, go: false };
    this.rings.forEach((r) => (r.visible = false));
    Audio2.sfx('click');
  },
  raceQuit() { this.race = null; this.rings.forEach((r) => (r.visible = false)); this.chipUpdate(); },
  ring(k) {
    if (!this.rings[k]) {
      const mat = new THREE.MeshStandardMaterial({ color: k === 0 ? 0xffc21a : 0xffffff, emissive: k === 0 ? 0xff9a00 : 0x888888, emissiveIntensity: k === 0 ? 0.8 : 0.3, transparent: k > 0, opacity: k === 0 ? 1 : 0.55 });
      const r = new THREE.Mesh(new THREE.TorusGeometry(4.2, 0.32, 8, 32), mat); G.scene.add(r); this.rings[k] = r;
    }
    return this.rings[k];
  },
  raceUpdate(dt) {
    const r = this.race; if (!r) return;
    const prevT = r.t; r.t += dt;
    if (r.t < 0) { if (Math.ceil(r.t) !== Math.ceil(prevT)) Audio2.sfx('step'); }
    else if (!r.go) { r.go = true; Audio2.sfx('tada'); }
    // the next three rings stand across the road
    for (let k = 0; k < 3; k++) {
      const p = r.pts[r.i + k], ring = this.ring(k);
      if (!p) { ring.visible = false; continue; }
      const prev = r.pts[r.i + k - 1] || r.R.start;
      ring.visible = true; ring.position.set(p.x, World.groundHeight(p.x, p.z) + 3.4, p.z); ring.rotation.set(0, Math.atan2(p.x - prev.x, p.z - prev.z), 0);
    }
    if (!r.go) return;
    const P = Player.pos(), p = r.pts[r.i];
    if (Math.hypot(p.x - P.x, p.z - P.z) < 8) {
      r.i++; Audio2.sfx('coin');
      if (r.i >= r.pts.length) this.raceFinish();
    }
  },
  raceFinish() {
    const r = this.race, f = this.st(), t = r.t, R = r.R;
    const speed = R.len / Math.max(1, t);
    const medal = speed >= 15 ? 'gold' : speed >= 10 ? 'silver' : speed >= 5 ? 'bronze' : null;
    const prize = { gold: 3000, silver: 2000, bronze: 1000 }[medal] || 300;
    const best = f.best[R.id], isBest = !best || t < best.t;
    if (isBest) f.best[R.id] = { t: +t.toFixed(1), medal };
    Money.add(prize, 'fun');
    Celebrate.burst(innerWidth / 2, innerHeight * 0.35, 90, 1); Celebrate.coins(innerWidth / 2, innerHeight * 0.35, prize, 8);
    Celebrate.ribbon({ kind: medal ? 'big' : 'sun', icon: medal === 'gold' ? '🥇' : medal === 'silver' ? '🥈' : medal === 'bronze' ? '🥉' : '🏁', top: LN(R), title: this.fmtT(t) + (isBest ? '  ' + L('New best!', 'కొత్త రికార్డు!') : ''), sub: '+' + fmtINR(prize), ms: 3600 });
    Audio2.sfx('fanfare');
    this.raceQuit();
  },
  fmtT(t) { const m = Math.floor(t / 60), s = t - m * 60; return m + ':' + (s < 10 ? '0' : '') + s.toFixed(1); },
  // the small strip under the clock: race timer, or "Explore mode"
  chipUpdate() {
    let c = this.chip;
    if (!c) { const box = UI.el('hud-tc'); if (!box) return; c = this.chip = h('button', { id: 'funchip', type: 'button', onclick: () => { if (Games.mode) Games.stop(); else if (this.race) this.raceQuit(); else if (G.S.explore) this.explore(false); } }); box.appendChild(c); }
    const r = this.race, S = G.S;
    const gt = Games.chipText();
    const txt = gt || (r ? (r.t < 0 ? '🏁 ' + Math.ceil(-r.t) + '…' : '🏁 ' + this.fmtT(r.t) + ' · ' + Math.min(r.i + 1, r.pts.length) + '/' + r.pts.length + '  ✕') : S && S.explore ? '🧭 ' + L('Explore mode · time paused', 'అన్వేషణ మోడ్ · సమయం ఆగింది') + '  ✕' : '');
    c.hidden = !txt; if (c._t !== txt) { c._t = txt; c.textContent = txt; }
  },
  // the Fun button: funny moves, and the way to the wardrobe and activities
  bar(show) {
    let b = document.getElementById('funbar');
    if (show === undefined) show = !b || b.hidden;
    if (!show) { if (b) b.hidden = true; return; }
    if (!b) { b = h('div', { id: 'funbar', class: 'card' }); (UI.el('hud') || document.body).appendChild(b); }
    b.innerHTML = '';
    b.append(h('div', { class: 'fgrid' }, ...EMOTES.map((E) => h('button', { type: 'button', class: 'fe', onclick: () => { Audio2.unlock(); Emote.play(E.id); } }, h('i', null, E.icon), h('span', null, LN(E))))),
      h('div', { class: 'fgames' }, ...[['🪁', L('Fly a kite', 'గాలిపటం'), () => Games.kiteStart()], ['🏏', L('Cricket', 'క్రికెట్'), () => Games.cricketStart()], ['🎣', L('Fishing', 'చేపల వేట'), () => Games.fishStart()], ['🎡', L('Lucky wheel', 'లక్కీ చక్రం'), () => Games.wheel()]].map(([ic, lab, fn]) =>
        h('button', { type: 'button', class: 'fe fg' + (ic === '🎡' && Games.canSpin() ? ' dot' : ''), onclick: () => { Audio2.unlock(); Audio2.sfx('click'); fn(); } }, h('i', null, ic), h('span', null, lab)))),
      h('div', { class: 'row' },
        h('button', { type: 'button', class: 'btn acc sm', onclick: () => { Audio2.sfx('click'); Wardrobe.open(); } }, '👕 ' + L('Dress up', 'దుస్తులు మార్చు')),
        h('button', { type: 'button', class: 'btn alt sm', onclick: () => { Audio2.sfx('click'); this.open(); } }, '🎯 ' + L('Activities', 'ఆటలు')),
        h('button', { type: 'button', class: 'btn alt sm', onclick: () => { this.bar(false); } }, '✕')));
    b.hidden = false;
  },
  // Fun & activities: explore mode, golden mangoes, places, races
  open() {
    this.bar(false);
    UI.sheet({ title: L('Fun & activities', 'సరదా ఆటలు'), narrow: true, kind: 'fun', render: (b) => {
      const f = this.st(), S = G.S;
      b.append(h('div', { class: 'act' }, h('b', null, '🧭 ' + L('Explore mode', 'అన్వేషణ మోడ్')), h('p', null, L('Stops the clock and tiredness so you can roam the whole map: free cars, jeeps, bikes and the helicopter are parked near your house.', 'గడియారం, అలసట ఆగుతాయి, మొత్తం మ్యాప్ తిరగొచ్చు: ఉచిత కార్లు, జీపులు, బైకులు, హెలికాప్టర్ మీ ఇంటి దగ్గర ఉన్నాయి.')),
        Menu.seg([[true, L('On', 'ఆన్')], [false, L('Off', 'ఆఫ్')]], !!S.explore, (x) => this.explore(x))));
      b.append(h('div', { class: 'act' }, h('b', null, '🥭 ' + L('Golden mango hunt', 'బంగారు మామిడి వేట')), h('p', null, L(`${f.mangoes.length} of ${this.spots.length} found. Each one is worth ₹500, and all of them a big prize.`, `${this.spots.length}లో ${f.mangoes.length} దొరికాయి. ఒక్కొక్కటి ₹500, అన్నీ దొరికితే పెద్ద బహుమతి.`)),
        f.mangoes.length < this.spots.length ? UI.btn(L('Show me the nearest', 'దగ్గరిది చూపించు'), () => this.nearestMango(), 'alt sm') : null));
      const pl = Map2.places(), known = pl.filter((p) => f.places[p.id]).length;
      b.append(h('div', { class: 'act' }, h('b', null, '📍 ' + L('Places to discover', 'చూడాల్సిన ప్రదేశాలు')), h('p', null, L(`${known} of ${pl.length} discovered. Visit a place to discover it.`, `${pl.length}లో ${known} చూశారు. చూడటానికి ఆ ప్రదేశానికి వెళ్లండి.`)),
        h('div', { class: 'plist' }, ...pl.map((p) => h('span', { class: f.places[p.id] ? 'on' : '' }, (f.places[p.id] ? '✓ ' : '• ') + Map2.placeName(p))))));
      b.append(h('div', { class: 'act' }, h('b', null, '🏁 ' + L('Races', 'పందేలు')), h('p', null, L('Drive through the rings as fast as you can, in any vehicle or on foot. Faster = better medal.', 'ఏ వాహనంలోనైనా లేదా కాలినడకన రింగుల గుండా వీలైనంత వేగంగా వెళ్లండి. వేగం ఎక్కువైతే మంచి పతకం.')),
        ...RACES.map((R) => { const bt = f.best[R.id]; return h('div', { class: 'row race' }, h('span', null, LN(R) + (bt ? ' · ' + this.fmtT(bt.t) + (bt.medal ? ' ' + { gold: '🥇', silver: '🥈', bronze: '🥉' }[bt.medal] : '') : '')), UI.btn(L('Start', 'మొదలు'), () => this.raceStart(R.id), 'acc sm')); })));
      const gs = Games.st(), fishN = Object.values(gs.fish).reduce((s, n) => s + n, 0);
      b.append(h('div', { class: 'act' }, h('b', null, '🎮 ' + L('Games', 'ఆటలు')),
        ...[['🪁', L('Kite fights', 'గాలిపటాల పోటీ'), L(`${gs.kites} kites cut`, `${gs.kites} గాలిపటాలు తెంపారు`), () => Games.kiteStart()],
          ['🏏', L('Gully cricket', 'వీధి క్రికెట్'), L(`Best: ${gs.best} runs`, `ఉత్తమం: ${gs.best} పరుగులు`), () => Games.cricketStart()],
          ['🎣', L('Fishing', 'చేపల వేట'), L(`${fishN} fish caught`, `${fishN} చేపలు పట్టారు`), () => Games.fishStart()],
          ['🎡', L('Lucky wheel', 'లక్కీ చక్రం'), Games.canSpin() ? L('Free spin ready!', 'ఉచిత స్పిన్ సిద్ధం!') : L('Next free spin tomorrow', 'తదుపరి ఉచిత స్పిన్ రేపు'), () => Games.wheel()],
          ['🎨', L('Holi colours', 'హోలీ రంగులు'), L('Colour the villagers near you', 'దగ్గరి గ్రామస్తులకు రంగులు చల్లండి'), () => { UI.close(); Emote.play('holi'); }]]
          .map(([ic, name, stat, fn]) => h('div', { class: 'row race' }, h('span', null, ic + ' ' + name + ' · ' + stat), UI.btn(L('Play', 'ఆడు'), fn, 'acc sm')))));
      b.append(h('div', { class: 'row mfoot' }, UI.btn('👕 ' + L('Dress up', 'దుస్తులు మార్చు'), () => Wardrobe.open(), 'alt')));
    } });
  },
};
