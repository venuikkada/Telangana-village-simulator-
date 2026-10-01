// ============================================================================
// Bootstrap: world build, game state, simulation clock, main loop
// ============================================================================
function newGameState(o = {}) {
  const g = o.gender === 'f' ? 'f' : 'm';
  return {
    v: SAVE_VERSION, created: Date.now(),
    time: { min: 6 * 60 + 30 },                      // Day 1 of Vanakalam, 6:30 AM
    weather: { id: 'partly', left: 260, drought: false, forced: null },
    world: { groundwater: 64, lake: 58, powerCut: 0, wet: 0.2 },
    player: { name: o.name || (g === 'f' ? 'Radha' : 'Raju'), gender: g, health: 100, energy: 100, x: HOME.x + 10, z: HOME.z + 3, yaw: -0.86, inVeh: null },
    money: 50000,
    inv: { urea: 1 },
    storage: [], loans: [], pending: [], construction: [], workers: [], implements: [],
    flags: { autoBuy: false, boreFixed: false, insure: false, pestEvent: null, safety: false, visitedBank: false },
    rel: {}, relDay: {}, rank: 0,
    dairy: { n: 0 },
    stats: { earned: 0, spent: 0, cropIncome: 0, harvestQ: 0, milk: 0, sold: {} },
    up: {},
    village: { pop: 1460, biz: 22, landValue: 0 },
    houseLevel: 0,
    waypoint: null, fd: 0,
  };
}

function playerAppearance(g) {
  const a = Humans.appearance(g === 'f'
    ? { gender: 'f', saree: '#2e8b57', blouse: '#e2b81f', skin: '#94613f' }
    : { gender: 'm', shirt: '#f2efe6', lower: 'lungi', lungi: '#3a5a9a', turban: false, skin: '#94613f' });
  a.h = 1.0; a.w = 1.0; a.hair = C('#1c1612');
  if (g !== 'f') { a.towel = C('#b93a2c'); a.stache = true; }
  return a;
}

// snap the interpolated weather to the current weather (used when time is skipped)
function snapWeather() {
  const S = G.S; const T = WEATHER[S.weather.id];
  Object.assign(Weather.cur, { id: S.weather.id, cloud: T.cloud, rain: T.rain, wind: T.wind, fog: T.fog, haze: T.haze });
}

// ---------------------------------------------------------------------------
// Simulation clock (game minutes)
// ---------------------------------------------------------------------------
const Sim = {
  acc: 0, STEP: 5, skipping: false,
  tick(dt) {
    const dm = dt * (60 / GAME_SEC_PER_HOUR) * Time.scale;
    this.clock(dm, false);
  },
  clock(dm, force) {
    const S = G.S;
    const t0 = S.time.min, t1 = t0 + dm;
    S.time.min = t1;
    Weather.tick(dm);
    this.acc += dm;
    if (this.acc >= this.STEP || (force && this.acc > 0)) {
      const hrs = this.acc / 60; this.acc = 0;
      Fields.simulate(hrs);
      Storage.spoil(hrs);
      Finance.pendingTick();
      Services.rentalTick();
    }
    const h0 = Math.floor(t0 / 60), h1 = Math.floor(t1 / 60);
    for (let hh = h0 + 1; hh <= h1; hh++) this.onHour(hh);
  },
  onHour(hh) {
    const hod = hh % 24, day = Math.floor(hh / 24) + 1;
    Market.hourTick();
    Farm.constructionTick();
    if (hod === 6 || hod === 18) Farm.dairyTick();
    if (hod === 0) this.onDay(day);
    if (hod === 6) this.onMorning(day);
    Progress.check();
    Missions.ensure();
    UI.dirty = true;
  },
  onDay(day) {
    Finance.dayTick();
    const doy = (day - 1) % DAYS_PER_YEAR;
    if (doy % DAYS_PER_SEASON === 0) Weather.seasonStart();
    else Farm.checkLeases();
  },
  onMorning() {
    const fest = Time.festivalToday();
    if (fest) UI.toast(L(`Today is ${fest.en}! ${fest.desc.en}`, `ఈ రోజు ${fest.te}! ${fest.desc.te}`), 'season');
    if (Time.weekday() === SANTHA_WEEKDAY) UI.toast(L('Sunday santha today: the weekly market is on at the village ground until 2 PM.', 'ఈ రోజు ఆదివారం సంత: మధ్యాహ్నం 2 వరకు గ్రామ మైదానంలో వారపు సంత.'), 'season');
    if (!this.skipping) SaveSys.save(false);
  },
  // jump forward in big steps (sleep, bus rides)
  advance(min) {
    if (!G.S || min <= 0) return;
    this.skipping = true;
    try {
      let left = min;
      while (left > 0.001) {
        const d = Math.min(10, left);
        snapWeather();
        this.clock(d, true);
        const hr = Time.hour();
        if (hr > 6.8 && hr < 18.2 && Weather.cur.rain < 0.45) Workers.skip(d / 60);
        left -= d;
      }
      snapWeather();
      NPCs.resync();
      for (const n of Workers.list) { n.ti = -1; n.tt = 0; }
    } finally { this.skipping = false; }
    UI.dirty = true;
  },
  sleep(night) {
    if (Player.vehicle) return;
    const cur = G.S.time.min % 1440;
    let mins = night ? (6.5 * 60 - cur + 1440) % 1440 : 120;
    if (night && mins < 30) mins += 0;
    if (mins <= 0) mins = 120;
    UI.fade(() => {
      this.advance(mins);
      const P = G.S.player; const rest = HOUSE_LEVELS[G.S.houseLevel].rest;
      if (night) { P.energy = 100; P.health = Math.min(100, P.health + 25 * rest); }
      else { P.energy = Math.min(100, P.energy + 30 * rest); P.health = Math.min(100, P.health + 6 * rest); }
      UI.toast(night ? L(`Good morning! ${Time.fmtDate()}`, `శుభోదయం! ${Time.fmtDate()}`) : L('You feel rested.', 'విశ్రాంతి తీసుకున్నారు.'), 'good');
      Audio2.sfx(night ? 'rooster' : 'click');
      SaveSys.save(false);
      Bus.emit('sleep', { night });
    }, night ? L('Sleeping…', 'నిద్రపోతున్నారు…') : L('Resting…', 'విశ్రాంతి తీసుకుంటున్నారు…'));
  },
};

// ---------------------------------------------------------------------------
// Game: world build, title, starting / continuing
// ---------------------------------------------------------------------------
const Game = {
  pickPreset() {
    const saved = Settings.v.preset; if (saved && PRESETS[saved]) return saved;
    if (isMobile) { const mem = navigator.deviceMemory || 4, cores = navigator.hardwareConcurrency || 4; return mem >= 6 && cores >= 8 ? 'MEDIUM' : 'LOW'; }
    return 'HIGH';
  },
  setPreset(p) {
    if (!PRESETS[p]) return;
    Render.applyPreset(p);
    if (!G.ready) return;
    const P = G.preset;
    Veg.onPreset(P);
    Fields.setDetail(P.cropDetail);
    for (const f of Fields.list) if (f.cropMesh) f.cropMesh.castShadow = P.shadows && P.cropDetail > 0;
    const lb = document.getElementById('letterbox'); if (lb) lb.hidden = !(UI.photoMode || P.letterbox);
  },
  async build() {
    const steps = [];
    const step = (w, en, te, fn) => steps.push({ w, en, te, fn });
    step(1, 'Shaping the land', 'నేలను తీర్చిదిద్దుతున్నాం', () => { Sky.init(); layoutFields(); World.buildTerrain(isMobile ? 224 : 256); World.initOcc(); });
    step(1, 'Laying roads and canals', 'రోడ్లు, కాలువలు వేస్తున్నాం', () => { World.buildRoads(); World.buildWater(); Atlas.init(); });
    step(3, 'Building Ramapuram', 'రామాపురం నిర్మిస్తున్నాం', () => { World.buildVillage(); Village.reserveSpots(); });
    step(2, 'Marking out the fields', 'పొలాల గట్లు వేస్తున్నాం', () => { Fields.init(); this.setupFields(); });
    step(2, 'Planting trees', 'చెట్లు నాటుతున్నాం', () => { RNG = mulberry32(777); Veg.scatter(); scatterBoulders(); Veg.build(); });
    step(1, 'Finishing the skyline', 'ఆకాశరేఖ పూర్తి చేస్తున్నాం', () => { buildSkyline(); Chunks.finalize(); });
    step(1, 'Lighting the sky', 'ఆకాశం వెలిగిస్తున్నాం', () => { Weather.init(); Market.init(); PLights.init(); });
    step(2, 'Waking up the village', 'గ్రామం నిద్ర లేస్తోంది', () => { Humans.init(); Animals.init(); Birds.init(); FX.init(); Graph.build(); NPCs.spawn(); Fauna.spawn(); Traffic.spawn(); });
    step(1, 'Drawing the map', 'మ్యాప్ గీస్తున్నాం', () => { Map2.build(); UI.init(); Services.registerInteractions(); });
    const total = steps.reduce((s, x) => s + x.w, 0); let done = 0;
    for (const s of steps) {
      UI.loading(0.08 + 0.9 * done / total, L(s.en + '…', s.te + '…'));
      await nextFrame(); await nextFrame();
      s.fn();
      done += s.w;
    }
    UI.loading(1, L('Ready', 'సిద్ధం'));
  },
  async toggleFullscreen() {
    try {
      if (document.fullscreenElement) { await document.exitFullscreen(); return; }
      await document.documentElement.requestFullscreen({ navigationUI: 'hide' });
      if (isMobile && screen.orientation && screen.orientation.lock) screen.orientation.lock('landscape').catch(() => {});
    } catch (e) { UI.toast(L('Full screen is not available here.', 'ఇక్కడ ఫుల్ స్క్రీన్ అందుబాటులో లేదు.'), 'warn'); }
  },
  wake: null,
  async keepAwake() {
    if (!isMobile || !G.started || document.hidden || this.wake) return;
    try { this.wake = await navigator.wakeLock.request('screen'); this.wake.addEventListener('release', () => { this.wake = null; }); } catch (e) { this.wake = null; }
  },
  rotateHint() {
    const el = document.getElementById('rotate'); if (!el) return;
    const portrait = isMobile && matchMedia('(orientation: portrait)').matches;
    el.hidden = !(G.started && portrait && !Settings.v.portraitOk);
  },
  // land ownership at the start of a new game (also the title backdrop)
  setupFields() {
    const F1 = Fields.byId.F1;
    F1.owner = 'player'; F1.npcPhase = 'player'; F1.borewell = true; F1.water = 38; F1.nut = 42; F1.weeds = 10;
    const GH = Fields.byId.GH;
    if (GH) { GH.owner = 'none'; GH.npcPhase = 'none'; GH.wasStubble = false; GH.weeds = 0; }
    const cands = Fields.list.filter((f) => f.id !== 'F1' && f.id !== 'GH');
    const near = cands.slice().sort((a, b) => Math.hypot(a.x - HOME.x, a.z - HOME.z) - Math.hypot(b.x - HOME.x, b.z - HOME.z));
    const mark = (f, kind) => { if (f && !f.avail) f.avail = kind; };
    mark(near[0], 'both'); mark(near[1], 'lease'); mark(near[3], 'sale'); mark(near[5], 'lease');
    let k = 0;
    for (const f of cands) {
      if (f.avail) continue;
      if (f.village === 'seethampet') { if (hash2(f.idx, 79) < 0.34) f.avail = hash2(f.idx, 81) < 0.5 ? 'sale' : 'both'; continue; }
      if (hash2(f.idx, 77) < 0.11) f.avail = (k++ % 3 === 0) ? 'sale' : (k % 3 === 1 ? 'lease' : 'both');
    }
    if (!cands.some((f) => f.village === 'seethampet' && f.avail)) { const s = cands.find((f) => f.village === 'seethampet'); if (s) s.avail = 'sale'; }
    Fields.randomizeNPC();
    for (const f of Fields.list) {
      if (f.avail || f.owner === 'none' || f.isPlayer) {
        f.crop = null; f.growth = 0; f.sownTiles = 0; f.tiles.fill(0); f.wasStubble = f.owner !== 'none'; f.allDirty = true; f.cropDirty = true;
        if (f.avail) f.npcPhase = 'fallow';
      }
    }
  },
  // NPC farmers must not tend fields that the player owns or that are on the market
  reassignFarmers() {
    const ok = (f) => f && !f.isPlayer && !f.avail && f.owner !== 'none';
    const free = Fields.list.filter(ok);
    for (const f of Fields.list) f.taken = false;
    for (const n of NPCs.list) if (ok(n.field)) n.field.taken = true;
    for (const n of NPCs.list) {
      if (!n.field || ok(n.field)) continue;
      let best = null, bd = 1e9;
      for (const f of free) { const d = Math.hypot(f.x - n.home.x, f.z - n.home.z) + (f.taken ? 300 : 0); if (d < bd) { bd = d; best = f; } }
      n.field = best; if (best) best.taken = true;
    }
  },
  titleState() {
    const S = newGameState({ name: 'Raju' });
    S.time.min = 17.35 * 60; S.weather = { id: 'partly', left: 9999, drought: false, forced: null }; S.world.wet = 0.05;
    return S;
  },
  titleCam() {
    let a = 0.35;
    Cam.intro = (dt, cam) => {
      a += dt * 0.022;
      const cx = -30, cz = 20, r = 150;
      const x = cx + Math.cos(a) * r, z = cz + Math.sin(a) * r;
      const y = Math.max(World.groundHeight(x, z) + 30, 34) + Math.sin(a * 1.7) * 5;
      cam.position.set(x, y, z);
      cam.lookAt(cx + Math.cos(a + 1.1) * 40, 6, cz + Math.sin(a + 1.1) * 40);
      Cam.focus.set(cx + Math.cos(a + 1.1) * 40, 2, cz + Math.sin(a + 1.1) * 40);
    };
  },
  saveInfo(d) {
    if (!d) return '';
    const day = d.day || 1; const s = SEASONS[Math.floor(((day - 1) % DAYS_PER_YEAR) / DAYS_PER_SEASON)];
    return L(`${d.name} · Day ${((day - 1) % DAYS_PER_SEASON) + 1} of ${s.short.en} · ${fmtShortINR(d.money || 0)}`, `${d.name} · ${s.short.te} ${((day - 1) % DAYS_PER_SEASON) + 1}వ రోజు · ${fmtShortINR(d.money || 0)}`);
  },
  showTitle() {
    if (G.started) return;
    const best = SaveSys.best();
    UI.showTitle(!!best, () => this.fadeStart(SaveSys.best()), (o) => this.fadeStart(null, o), () => this.saveInfo(SaveSys.best()));
  },
  fadeStart(data, o) {
    if (this._starting) return; this._starting = true;
    UI.fade(() => {
      try { this.start(data, o); }
      catch (e) { console.error(e); this._starting = false; showFatal(e); }
    }, data ? L('Opening your farm…', 'మీ పొలానికి వెళ్తున్నాం…') : L('A new season begins…', 'కొత్త సీజన్ మొదలవుతోంది…'));
  },
  migrate(st) {
    const d = newGameState({ name: st.player && st.player.name, gender: st.player && st.player.gender });
    for (const k in d) if (st[k] === undefined || st[k] === null && d[k] !== null) st[k] = d[k];
    for (const k of ['flags', 'stats', 'village', 'world', 'player', 'weather', 'dairy']) for (const kk in d[k]) if (st[k][kk] === undefined) st[k][kk] = d[k][kk];
    if (!st.stats.sold) st.stats.sold = {};
    return st;
  },
  start(data, o) {
    if (G.started) return;
    const S = data ? this.migrate(JSON.parse(JSON.stringify(data.state))) : newGameState(o || {});
    G.S = S;
    Time.scale = Settings.v.timeScale || 1;
    Market.init();
    if (data) Fields.load(data.fields || {});
    // vehicles
    if (data) {
      let maxId = 0;
      for (const st of [...(data.vehicles || []), ...(data.rented || [])]) { try { Vehicles.spawnOwned(st); const n = parseInt(String(st.id).replace(/\D/g, ''), 10); if (n > maxId) maxId = n; } catch (e) { console.warn('vehicle', e); } }
      Vehicles.nextId = Math.max(Vehicles.nextId, maxId + 1);
      if (!Vehicles.player.some((v) => v.type === 'bullock')) Vehicles.spawnOwned({ type: 'bullock', x: -110, z: 66, yaw: Math.PI, impl: 'bcart' });
    } else {
      Vehicles.spawnOwned({ type: 'bullock', x: -110, z: 66, yaw: Math.PI, impl: 'bcart' });
      Vehicles.spawnOwned({ type: 'moped', x: -114.5, z: 47.5, yaw: Math.PI / 2 });
    }
    // player
    Player.init(playerAppearance(S.player.gender));
    Player.x = S.player.x; Player.z = S.player.z; Player.yaw = S.player.yaw || 0;
    Player.y = World.groundHeight(Player.x, Player.z);
    // farm, village, workers, missions
    Farm.init();
    Village.applyAll();
    Workers.init();
    Missions.init();
    this.reassignFarmers();
    Bus.on('landBought', () => this.reassignFarmers()); Bus.on('landLeased', () => this.reassignFarmers());
    snapWeather();
    Weather.temp = SEASONS[Time.season()].temp[0] + 4;
    Sky.lastEnvElev = -999;
    NPCs.resync();
    // camera
    Cam.intro = null; Cam.mode = 'third'; Cam.yaw = Player.yaw + Math.PI; Cam.pitch = 0.3; Cam.dist = Cam.tDist = 6;
    Cam.focus.set(Player.x, Player.y + 1.45, Player.z);
    if (S.player.inVeh) { const v = Vehicles.player.find((q) => q.id === S.player.inVeh); if (v) Player.enterVehicle(v); }
    // UI
    document.getElementById('title').hidden = true;
    document.getElementById('loading').hidden = true;
    document.getElementById('hud').hidden = false;
    document.getElementById('touch').hidden = !isMobile;
    G.started = true; G.paused = false;
    UI.applyLang(); UI.dirty = true; UI.refreshTools();
    Progress.check();
    Missions.ensure();
    if (data) {
      UI.toast(L(`Welcome back, ${S.player.name}. ${Time.fmtDate()}`, `మళ్లీ స్వాగతం, ${S.player.name}. ${Time.fmtDate()}`), 'good');
    } else {
      UI.banner(L('Ramapuram · Vanakalam', 'రామాపురం · వానాకాలం'), L(`Welcome, ${S.player.name}`, `స్వాగతం, ${S.player.name}`), L('₹50,000, one acre of red soil and a pair of bullocks. Let\'s grow.', '₹50,000, ఒక ఎకరం ఎర్ర నేల, ఒక ఎడ్ల జత. ఎదుగుదాం.'), 5200);
      setTimeout(() => UI.toast(isMobile ? L('Tip: follow the gold beacon. Tap the mission card for details, and Menu → Controls for help.', 'చిట్కా: బంగారు రంగు గుర్తును అనుసరించండి. వివరాల కోసం లక్ష్యాల కార్డును, సహాయం కోసం మెనూ → నియంత్రణలు నొక్కండి.') : L('Tip: follow the gold beacon and the mission list on the right. Press F1 for controls.', 'చిట్కా: బంగారు రంగు గుర్తును, కుడివైపు లక్ష్యాల జాబితాను అనుసరించండి. నియంత్రణల కోసం F1.'), 'info'), 5600);
      SaveSys.save(false);
    }
    document.getElementById('gl').focus();
    this.keepAwake();
    this.rotateHint();
  },
};

// ---------------------------------------------------------------------------
// Player lantern at night and real headlights on the player's vehicle
// ---------------------------------------------------------------------------
const PLights = {
  init() {
    this.lamp = new THREE.PointLight(0xffd29a, 0, 18, 1.5); this.lamp.castShadow = false; G.scene.add(this.lamp);
    this.head = new THREE.SpotLight(0xfff0d0, 0, 80, 0.5, 0.5, 1.2); this.head.castShadow = false; G.scene.add(this.head); G.scene.add(this.head.target);
  },
  update() {
    if (!this.lamp) return;
    const night = Sky.night; const v = Player.vehicle;
    if (G.started && v && v.lights) {
      const c = Math.cos(v.yaw), s = Math.sin(v.yaw); const fwd = v.type === 'harvester' ? 3.6 : v.type === 'bullock' ? 2.6 : 2.0;
      this.head.position.set(v.x + s * fwd, v.y + (v.type === 'harvester' ? 3.6 : 1.4), v.z + c * fwd);
      this.head.target.position.set(v.x + s * 26, v.y - 1.5, v.z + c * 26); this.head.target.updateMatrixWorld();
      this.head.intensity = 34 * (0.25 + night);
    } else this.head.intensity = 0;
    if (G.started && night > 0.15) {
      const p = Player.pos();
      this.lamp.position.set(p.x, p.y + (v ? 3.2 : 2.3), p.z);
      this.lamp.intensity = 2.2 * night * (v && v.lights ? 0.5 : 1);
    } else this.lamp.intensity = 0;
  },
};

// ---------------------------------------------------------------------------
// Main loop
// ---------------------------------------------------------------------------
const Loop = { last: 0, missionT: 0, fpsT: 0, fpsN: 0, touchT: 0 };
function frame(now) {
  requestAnimationFrame(frame);
  if (!G.ready) return;
  // phones: cap at 30 FPS unless the player asked for 60 (saves battery and heat)
  const cap = isMobile && !Settings.v.fps60 ? 1000 / 30 : 0;
  if (cap && Loop.last && now - Loop.last < cap - 3) return;
  let dt = (now - (Loop.last || now)) / 1000; Loop.last = now;
  if (!(dt > 0)) dt = 0.001; if (dt > 0.1) dt = 0.1;
  G.dt = dt; G.t += dt; G.frame++; U.uTime.value = G.t;
  Render.track(dt * 1000);
  const cam = G.camera;
  try {
    if (G.started) {
      const modal = UI.modalOpen();
      if (!modal) Sim.tick(dt);
      Player.update(dt);
      if (!modal) Interact.update();
    }
    Vehicles.update(dt);
    if (G.started) { Services.updateSvc(dt); Workers.update(dt); }
    NPCs.update(dt);
    Fauna.update(dt);
    Cam.update(dt);
    Humans.update(dt, cam.position);
    Animals.update(dt, cam.position);
    Birds.update(dt);
    FX.update(dt);
    Weather.update(dt);
    Sky.update(dt);
    Sky.placeShadow(Cam.focus);
    Fields.updateVisuals(cam.position);
    Veg.updateVisibility(cam.position);
    Veg.updateGrass(cam.position);
    Chunks.updateVisibility(cam.position);
    Village.update();
    PLights.update();
    if (G.started) {
      Loop.missionT -= dt; if (Loop.missionT <= 0) { Loop.missionT = 0.5; Missions.update(); }
      UI.update(dt);
      Loop.touchT -= dt; if (isMobile && Loop.touchT <= 0) { Loop.touchT = 0.25; UI.updateTouchLabels(); }
      SaveSys.tick(dt);
    }
    Audio2.update(dt);
  } catch (e) {
    Loop.errN = (Loop.errN || 0) + 1;
    if (Loop.errN <= 5) console.error('frame error', e && e.stack ? e.stack : e);
  }
  Render.render();
  Input.endFrame();
  // fps readout
  Loop.fpsN++; Loop.fpsT += dt;
  if (Loop.fpsT > 0.5) { const el = document.getElementById('fps'); if (el && !el.hidden) el.textContent = `${Math.round(Loop.fpsN / Loop.fpsT)} FPS · ${G.preset.id} · ${Math.round(Render.pr * 100)}%`; Loop.fpsN = 0; Loop.fpsT = 0; }
}

function showFatal(e) {
  const box = document.getElementById('loading'); if (!box) return;
  box.hidden = false;
  const m = document.getElementById('lmsg');
  const webgl = /WebGL|context/i.test(String(e && e.message));
  if (m) m.textContent = webgl
    ? L('This browser could not start 3D graphics (WebGL). Try the latest Chrome, Edge or Firefox with hardware acceleration turned on.', 'ఈ బ్రౌజర్‌లో 3D గ్రాఫిక్స్ (WebGL) ప్రారంభం కాలేదు. హార్డ్‌వేర్ యాక్సిలరేషన్ ఆన్ చేసి తాజా Chrome/Edge/Firefox వాడండి.')
    : L('Something went wrong while loading: ', 'లోడ్ చేస్తుండగా సమస్య వచ్చింది: ') + (e && e.message ? e.message : String(e));
}

async function boot(hot) {
  try {
    Settings.load(); LANG = Settings.v.lang || 'en'; Time.scale = Settings.v.timeScale || 1;
    UI.el = (id) => document.getElementById(id);
    UI.applyLang();
    UI.loading(0.03, L('Loading fonts…', 'అక్షరాలు లోడ్ అవుతున్నాయి…'));
    try { await Promise.race([Promise.all(['700 40px "Baloo Tammudu 2"', '700 26px "Hind Guntur"', '600 26px "Hind Guntur"'].map((f) => document.fonts.load(f, 'అఆ Aa'))), sleepMs(2500)]); } catch (e) { /* fallback fonts */ }
    initPrims(); buildMaterials();
    Render.init(document.getElementById('gl'));
    Render.applyPreset(Game.pickPreset());
    G.S = Game.titleState();
    Input.init();
    await Game.build();
    G.ready = true;
    Sky.update(0.016); Weather.update(0.016);
    Game.titleCam();
    requestAnimationFrame(frame);
    window.addEventListener('visibilitychange', () => { if (document.hidden) SaveSys.quickLocal(); else Game.keepAwake(); });
    try { matchMedia('(orientation: portrait)').addEventListener('change', () => { Game.rotateHint(); Render.resize(); }); } catch (e) { /* old browsers */ }
    const rok = document.getElementById('rotateOk'); if (rok) rok.onclick = () => { Settings.v.portraitOk = true; Settings.save(); Game.rotateHint(); };
    window.addEventListener('pagehide', () => SaveSys.quickLocal());
    if (hot && SaveSys.valid(hot.save)) { document.getElementById('loading').hidden = true; Game.fadeStart(hot.save); return; }
    document.getElementById('loading').hidden = true;
    Game.showTitle();
    SaveSys.initCloud().then((d) => { if (d && !G.started) Game.showTitle(); });
  } catch (e) {
    console.error(e);
    showFatal(e);
  }
}

// debug / test handle
G.sys = { THREE, World, Fields, Farm, Village, Workers, Services, Progress, Missions, Market, Storage, Finance, Inv, Money, Weather, Time, Sky, Render, Player, Cam, Interact, Input, Vehicles, Traffic, NPCs, Fauna, Humans, Animals, Veg, Chunks, UI, Map2, Audio2, Sim, Game, SaveSys, Settings, POI, Graph, FX, Dialog, Rel, Bus, CROPS, ITEMS, PRESETS };

window.claude?.hot?.snapshot?.(() => (G.started ? { save: SaveSys.serialize() } : {}));
if (window.claude?.hot?.ready) window.claude.hot.ready((d) => boot(d || {}));
else boot(window.claude?.hot?.data ?? {});
