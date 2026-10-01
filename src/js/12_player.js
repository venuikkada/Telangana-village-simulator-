// ============================================================================
// Input, player controller, cameras, interactions
// ============================================================================
const Input = {
  keys: {}, pressedQ: new Set(), mdx: 0, mdy: 0, wheel: 0, dragging: false, joy: { x: 0, y: 0, active: false }, look: { dx: 0, dy: 0 }, work: false, run: false, brake: false, lastInputAt: 0, pinch: 0,
  init() {
    const typing = (e) => { const t = e.target; return t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable); };
    window.addEventListener('keydown', (e) => {
      if (typing(e)) return;
      if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Tab'].includes(e.code)) e.preventDefault();
      if (!this.keys[e.code]) this.pressedQ.add(e.code);
      this.keys[e.code] = true; this.lastInputAt = performance.now();
      Audio2.unlock();
    });
    window.addEventListener('keyup', (e) => { this.keys[e.code] = false; });
    window.addEventListener('blur', () => { this.keys = {}; });
    const cv = document.getElementById('gl');
    let lx = 0, ly = 0, pid = null;
    cv.addEventListener('pointerdown', (e) => {
      Audio2.unlock();
      if (e.pointerType === 'touch') return;
      pid = e.pointerId; lx = e.clientX; ly = e.clientY; this.dragging = true; cv.setPointerCapture(pid);
      if (e.button === 0 && Settings.v.clickWork && Player.canWorkHere()) this.mouseWork = true;
    });
    cv.addEventListener('pointermove', (e) => {
      if (e.pointerType === 'touch') return;
      if (document.pointerLockElement === cv) { this.mdx += e.movementX; this.mdy += e.movementY; return; }
      if (!this.dragging || e.pointerId !== pid) return;
      this.mdx += e.clientX - lx; this.mdy += e.clientY - ly; lx = e.clientX; ly = e.clientY;
    });
    const up = (e) => { if (e.pointerId === pid) { this.dragging = false; pid = null; this.mouseWork = false; } };
    cv.addEventListener('pointerup', up); cv.addEventListener('pointercancel', up);
    cv.addEventListener('wheel', (e) => { e.preventDefault(); this.wheel += Math.sign(e.deltaY); }, { passive: false });
    cv.addEventListener('contextmenu', (e) => e.preventDefault());
    // touch look on the canvas (right side), pinch zoom
    const touches = new Map();
    cv.addEventListener('touchstart', (e) => { Audio2.unlock(); for (const t of e.changedTouches) touches.set(t.identifier, { x: t.clientX, y: t.clientY }); if (touches.size === 2) { const a = [...touches.values()]; this.pinch = Math.hypot(a[0].x - a[1].x, a[0].y - a[1].y); } }, { passive: true });
    cv.addEventListener('touchmove', (e) => {
      e.preventDefault();
      if (touches.size >= 2) { for (const t of e.changedTouches) touches.set(t.identifier, { x: t.clientX, y: t.clientY }); const a = [...touches.values()]; const d = Math.hypot(a[0].x - a[1].x, a[0].y - a[1].y); if (this.pinch) this.wheel += (this.pinch - d) * 0.02; this.pinch = d; return; }
      for (const t of e.changedTouches) { const p = touches.get(t.identifier); if (!p) continue; this.look.dx += t.clientX - p.x; this.look.dy += t.clientY - p.y; touches.set(t.identifier, { x: t.clientX, y: t.clientY }); }
    }, { passive: false });
    const tend = (e) => { for (const t of e.changedTouches) touches.delete(t.identifier); if (touches.size < 2) this.pinch = 0; };
    cv.addEventListener('touchend', tend); cv.addEventListener('touchcancel', tend);
  },
  down(c) { return !!this.keys[c]; },
  pressed(c) { if (this.pressedQ.has(c)) { this.pressedQ.delete(c); return true; } return false; },
  axis() {
    let x = 0, y = 0;
    if (this.down('KeyW') || this.down('ArrowUp')) y += 1;
    if (this.down('KeyS') || this.down('ArrowDown')) y -= 1;
    if (this.down('KeyA') || this.down('ArrowLeft')) x -= 1;
    if (this.down('KeyD') || this.down('ArrowRight')) x += 1;
    if (this.joy.active) { x += this.joy.x; y += this.joy.y; }
    const l = Math.hypot(x, y); if (l > 1) { x /= l; y /= l; }
    return { x, y };
  },
  endFrame() { this.pressedQ.clear(); this.mdx = 0; this.mdy = 0; this.wheel = 0; this.look.dx = 0; this.look.dy = 0; },
};

const TOOLS = [
  { id: 'auto', en: 'Auto', te: 'ఆటో', key: '1' },
  { id: 'hoe', en: 'Hoe', te: 'పార', key: '2', op: 'hoe' },
  { id: 'seeds', en: 'Seeds', te: 'విత్తనాలు', key: '3', op: 'sow' },
  { id: 'fert', en: 'Fertilizer', te: 'ఎరువు', key: '4', op: 'fertilize' },
  { id: 'sprayer', en: 'Sprayer', te: 'స్ప్రేయర్', key: '5', op: 'spray' },
  { id: 'sickle', en: 'Sickle', te: 'కొడవలి', key: '6', op: 'harvest' },
];

// "tap Buy seeds" on phones, "press E for Buy seeds" on PC
function buyHint(item) {
  const nm = item === 'seed' ? L('Buy seeds', 'విత్తనాలు కొనండి') : item === 'pesticide' ? L('Buy pesticide', 'పురుగుమందు కొనండి') : L('Buy fertilizer', 'ఎరువు కొనండి');
  return isMobile ? L(`tap “${nm}”.`, `“${nm}” నొక్కండి.`) : L(`press E for “${nm}”.`, `“${nm}” కోసం E నొక్కండి.`);
}

const Player = {
  h: null, x: HOME.x + 10, z: HOME.z + 2, y: 0, yaw: -Math.PI / 2, vy: 0, onGround: true, speed: 0, vehicle: null, tool: 'auto', working: false, workT: 0, need: null, axis: { x: 0, y: 0 },
  opt: { seeds: 'paddy', fert: 'urea', sprayer: 'pesticide' },
  init(app) {
    this.h = Humans.create(app, this.x, this.z);
    this.h.isPlayer = true;
  },
  pos() { return this.vehicle ? { x: this.vehicle.x, z: this.vehicle.z, y: this.vehicle.y } : { x: this.x, z: this.z, y: this.y }; },
  hurt(amt, why) {
    const S = G.S; S.player.health = Math.max(1, S.player.health - amt);
    if (why === 'spray' && !this._sprayWarned) { this._sprayWarned = true; UI.toast(L('Spraying without a mask hurts your health. Buy a safety kit at Srinu\'s shop.', 'మాస్క్ లేకుండా పిచికారీ చేస్తే ఆరోగ్యం పాడవుతుంది. శ్రీను దుకాణంలో రక్షణ కిట్ కొనండి.'), 'warn'); }
    if (S.player.health < 20 && !this._lowWarned) { this._lowWarned = true; UI.toast(L('Your health is low. Visit the doctor at the PHC or rest at home.', 'మీ ఆరోగ్యం తగ్గింది. PHCలో డాక్టర్‌ను కలవండి లేదా ఇంట్లో విశ్రాంతి తీసుకోండి.'), 'bad'); }
    if (S.player.health > 40) this._lowWarned = false;
  },
  canWorkHere() { const f = fieldAt(this.x, this.z); return !this.vehicle && f && f.isPlayer; },
  enterVehicle(v) {
    if (v.job) { UI.toast(L('A worker is using this vehicle.', 'ఒక కూలీ ఈ వాహనాన్ని వాడుతున్నారు.'), 'warn'); return; }
    this.vehicle = v; this.h.visible = v.ud.pose !== 'hidden';
    Cam.onEnterVehicle(v);
    Audio2.engineFor(v);
    Bus.emit('enterVehicle', { v });
    if (Sky.night > 0.5 && v.def.fuelCap >= 0) v.lights = true;
  },
  exitVehicle(force = false) {
    const v = this.vehicle; if (!v) return;
    if (!force && Math.abs(v.speed) > 2.5) { UI.toastOnce('slowdown', L('Slow down before getting off.', 'దిగే ముందు వేగం తగ్గించండి.'), 'warn'); return; }
    const c = Math.cos(v.yaw), s = Math.sin(v.yaw);
    const side = v.type === 'bus' || v.type === 'harvester' ? 2.4 : v.type === 'bullock' ? 1.6 : 1.4;
    const p = { x: v.x - c * side, z: v.z + s * side };
    World.collideCircle(p, 0.35);
    this.x = p.x; this.z = p.z; this.y = World.groundHeight(p.x, p.z); this.yaw = v.yaw;
    v.lowered = false; v.lights = false;
    this.vehicle = null; this.h.visible = true;
    Cam.onExitVehicle();
    Audio2.engineFor(null);
  },
  update(dt) {
    const S = G.S; const P = S.player;
    if (UI.modalOpen()) { this.h.speed = 0; if (!this.vehicle) { this.h.pose = 'idle'; this.h.x = this.x; this.h.y = this.y; this.h.z = this.z; } else this.vehicle.update(dt, { throttle: 0, steer: 0, brake: true }); return; }
    const ax = Input.axis();
    if (this.vehicle) { this.updateVehicle(dt, ax); return; }
    // tools
    for (const t of TOOLS) if (Input.pressed('Digit' + t.key)) this.setTool(t.id);
    if (Input.pressed('KeyQ')) this.cycleOpt();
    const wantWork = Input.down('KeyF') || Input.work || Input.mouseWork;
    const f = fieldAt(this.x, this.z);
    this.working = wantWork && P.energy > 1 && !!f;
    this.axis.x = ax.x; this.axis.y = ax.y;
    // movement
    const camYaw = Cam.yaw;
    const fx = -Math.sin(camYaw), fz = -Math.cos(camYaw);
    const rx = -fz, rz = fx;
    let mx = fx * ax.y + rx * ax.x, mz = fz * ax.y + rz * ax.x;
    const ml = Math.hypot(mx, mz);
    const running = (Input.down('ShiftLeft') || Input.down('ShiftRight') || Input.run) && P.energy > 3;
    const tired = P.energy < 3 ? 0.75 : 1;
    const maxSp = (running ? 7.6 : 4.6) * tired * (U.uWet.value > 0.5 && f ? 0.92 : 1);
    const target = ml > 0.05 ? maxSp * Math.min(1, ml / 0.9) : 0;
    this.speed = damp(this.speed, Math.min(target, maxSp), target > this.speed ? 16 : 20, dt);
    if (ml > 0.05) { mx /= ml; mz /= ml; if (Cam.mode === 'first') this.yaw = Math.atan2(-Math.sin(camYaw) , -Math.cos(camYaw)); else this.yaw = dampAngle(this.yaw, Math.atan2(mx, mz), 22, dt); this.mvx = mx; this.mvz = mz; }
    else if (Cam.mode === 'first') this.yaw = Math.atan2(-Math.sin(camYaw), -Math.cos(camYaw));
    if (this.speed > 0.01) { this.x += (this.mvx || 0) * this.speed * dt; this.z += (this.mvz || 0) * this.speed * dt; }
    // collisions: buildings, vehicles, lake, bounds
    const q = { x: this.x, z: this.z };
    World.collideCircle(q, 0.32);
    for (const v of Vehicles.all) {
      if (Math.abs(v.x - q.x) > 10 || Math.abs(v.z - q.z) > 10) continue;
      const c = Math.cos(v.yaw), s = Math.sin(v.yaw);
      for (const [lx, lz, r] of v.fp) { const cx = v.x + lx * c + lz * s, cz = v.z - lx * s + lz * c; const dx = q.x - cx, dz = q.z - cz, d = Math.hypot(dx, dz); if (d < r + 0.3 && d > 1e-4) { q.x = cx + dx / d * (r + 0.3); q.z = cz + dz / d * (r + 0.3); if (Math.abs(v.speed) > 3 && v !== this.vehicle) { this.hurt(Math.abs(v.speed) * 1.5, 'hit'); } } }
    }
    const ld = lakeSD(q.x, q.z); if (ld < -9) { const a = Math.atan2(q.z - LAKE.z, q.x - LAKE.x); const rr = lakeRadius(a) - 9; q.x = LAKE.x + Math.cos(a) * rr; q.z = LAKE.z + Math.sin(a) * rr; }
    q.x = clamp(q.x, -PLAY_HALF, PLAY_HALF); q.z = clamp(q.z, -PLAY_HALF, PLAY_HALF);
    this.x = q.x; this.z = q.z;
    // vertical
    const gy = World.groundHeight(this.x, this.z) + (f ? 0.03 : 0);
    if (Input.pressed('Space') && this.onGround) { this.vy = 5.4; this.onGround = false; Audio2.sfx('jump'); }
    this.vy -= 12 * dt; this.y += this.vy * dt;
    if (this.y <= gy) { this.y = gy; this.vy = 0; this.onGround = true; }
    // work
    if (this.working) {
      this.workT -= dt;
      if (this.workT <= 0) { this.workT = 0.1; this.doWork(f); }
      P.energy = Math.max(0, P.energy - dt * 0.03);
    }
    P.energy = Math.max(0, P.energy - dt * (0.006 + (running && this.speed > 1 ? 0.02 : 0)) * (Weather.cur.id === 'heatwave' ? 1.5 : 1));
    // heat stress outdoors at midday
    const hr = Time.hour();
    if (Weather.cur.id === 'heatwave' && hr > 11.5 && hr < 16 && !this.inShade()) { P.health = Math.max(1, P.health - dt * 0.03); if (!this._heatWarned) { this._heatWarned = true; UI.toast(L('Heat wave! Rest in the shade or drink buttermilk at the tea stall.', 'వడగాలులు! నీడలో విశ్రాంతి తీసుకోండి లేదా టీ స్టాల్‌లో మజ్జిగ తాగండి.'), 'warn'); } }
    if (P.energy > 50 && P.health < 100) P.health = Math.min(100, P.health + dt * 0.012);
    // animation
    const h = this.h;
    h.x = this.x; h.y = this.y; h.z = this.z; h.yaw = this.yaw; h.speed = this.working ? (this.speed > 0.2 ? this.speed : 0) : this.speed;
    h.pose = this.working && this.speed < 0.6 ? 'work' : 'walk';
    h.visible = Cam.mode !== 'first';
    Stats.walk += this.speed * dt;
  },
  inShade() { for (const s of POI.shade) if (Math.hypot(s.x - this.x, s.z - this.z) < 10) return true; for (const sh of POI.shelters) if (Math.hypot(sh.x - this.x, sh.z - this.z) < 4) return true; return false; },
  setTool(id) { this.tool = id; UI.refreshTools(); Audio2.sfx('click'); },
  cycleOpt() {
    if (this.tool === 'seeds') { const have = CROP_IDS.filter((c) => Inv.count('seed_' + c) > 0.01); const list = have.length ? have : CROP_IDS; const i = list.indexOf(this.opt.seeds); this.opt.seeds = list[(i + 1) % list.length]; }
    else if (this.tool === 'fert') { const list = ['urea', 'dap', 'complex', 'organic']; this.opt.fert = list[(list.indexOf(this.opt.fert) + 1) % list.length]; }
    else if (this.tool === 'sprayer') { this.opt.sprayer = this.opt.sprayer === 'pesticide' ? 'herbicide' : 'pesticide'; }
    UI.refreshTools(); Audio2.sfx('click');
  },
  // pick the job for the Auto tool from the tile in front of the player
  autoCrop(f) {
    const has = (c) => Inv.count('seed_' + c) > 0.0001;
    if (f.crop && f.sownTiles > 0) return has(f.crop) ? f.crop : null;
    if (f.plannedCrop && has(f.plannedCrop)) return f.plannedCrop;
    if (has(this.opt.seeds)) return this.opt.seeds;
    let best = null, bn = 0; for (const c of CROP_IDS) { const n = Inv.count('seed_' + c); if (n > bn + 1e-6) { bn = n; best = c; } }
    return best;
  },
  autoFert() { for (const k of [this.opt.fert, 'urea', 'dap', 'complex', 'organic']) if (Inv.count(k) > 0.0001) return k; return null; },
  autoJob(f, x, z) {
    const i = f.tileAt(x, z); const t = i >= 0 ? f.tiles[i] : -1;
    const cd = f.crop && f.sownTiles > 0 ? CROPS[f.crop] : null;
    if (cd) {
      const tut = (t2) => G.S.missions.active.some((m) => m.tpl === t2);
      // keep the crop watered without a trip to the pump (the tutorial asks for a full field)
      if (cd.wLo && f.water < Math.max(cd.wLo + 6, tut('t_water') ? 64 : 0)) {
        if (f.borewell && !f.pump) { f.pump = true; UI.toastOnce('autopump' + f.id, L('Pump switched on: the field needs water.', 'పొలానికి నీరు కావాలి: మోటార్ వేశాం.'), 'info'); Bus.emit('pump', { field: f, on: true }); }
        else if (f.canal && !f.gate && Weather.canalFlowing()) { f.gate = true; UI.toastOnce('autogate' + f.id, L('Canal gate opened: the field needs water.', 'పొలానికి నీరు కావాలి: కాలువ తూము తెరిచాం.'), 'info'); Bus.emit('pump', { field: f, on: true }); }
      }
      if (f.growth >= 0.97) return { op: 'harvest', r: 3.4 };
      // once a job starts, finish it across the whole field instead of stopping right at the threshold
      const mode = f.autoMode;
      if (f.outbreak || f.pests > 10 || (mode === 'spray' && f.pests > 2)) { f.autoMode = 'spray'; return Inv.count('pesticide') > 0.0001 ? { op: 'spray', item: 'pesticide', r: 3.8 } : { need: 'pesticide' }; }
      if (f.weeds > 16 || (mode === 'weed' && f.weeds > 4)) { f.autoMode = 'weed'; return { op: 'weed', r: 3.4 }; }
      if ((f.nut < 40 || (mode === 'fert' && f.nut < 68) || (tut('t_fert') && f.nut < 80)) && f.growth < 0.9) { f.autoMode = 'fert'; const it = this.autoFert(); return it ? { op: 'fertilize', item: it, r: 3.6 } : { need: 'urea' }; }
      f.autoMode = null;
      if (t >= 0 && t < 3) { const crop = this.autoCrop(f); return crop ? { op: 'sow', crop, r: 3.6 } : { op: 'prep', r: 3.2 }; }
      return { idle: true };
    }
    // bare field: sowing also ploughs, so with seeds in hand do both in one pass
    const crop = this.autoCrop(f);
    if (crop) return { op: 'sow', crop, r: 3.6 };
    return { op: 'prep', r: 3.2, noSeed: true };
  },
  doWork(f) {
    if (!f) return;
    if (!f.isPlayer) { UI.toastOnce('notyours', L('This field is not yours. Buy or lease it first.', 'ఈ పొలం మీది కాదు. ముందు కొనండి లేదా కౌలుకు తీసుకోండి.'), 'warn'); return; }
    const fx = this.x + Math.sin(this.yaw) * 0.6, fz = this.z + Math.cos(this.yaw) * 0.6;
    let job = null;
    if (this.tool === 'auto') {
      job = this.autoJob(f, fx, fz);
      if (!job) return;
      if (job.need) { this.need = { item: job.need, field: f, t: performance.now() }; UI.toastOnce('need' + job.need, (job.need === 'seed' ? L('No seeds: ', 'విత్తనాలు లేవు: ') : job.need === 'pesticide' ? L('Pests on your crop! ', 'పంటకు పురుగులు! ') : L('Your crop is hungry: ', 'పంటకు ఎరువు కావాలి: ')) + buyHint(job.need), 'warn'); return; }
      if (job.idle) { this.need = { item: 'wait', field: f, t: performance.now() }; UI.toastOnce('growing' + f.id, L(`${LN(CROPS[f.crop])} is growing well (${Math.round(f.growth * 100)}%). `, `${LN(CROPS[f.crop])} బాగా పెరుగుతోంది (${Math.round(f.growth * 100)}%). `) + (isMobile ? L('Tap “Rest” to let it grow.', '\'విశ్రాంతి\' నొక్కితే పంట పెరుగుతుంది.') : L('Press E to rest while it grows.', 'పంట పెరిగే వరకు విశ్రాంతికి E నొక్కండి.')), 'info'); return; }
      this.need = null;
    }
    const tool = this.tool;
    const R = job ? job.r : tool === 'seeds' || tool === 'fert' ? 3.4 : tool === 'sprayer' ? 3.6 : 2.8;
    let n = 0; let op = null; let lastIssue = null;
    const R2 = R * R + 0.1;
    for (let dz = -R; dz <= R + 1e-6; dz += TILE) for (let dx = -R; dx <= R + 1e-6; dx += TILE) {
      if (dx * dx + dz * dz > R2) continue;
      const i = f.tileAt(fx + dx, fz + dz); if (i < 0) continue;
      const t = f.tiles[i];
      let ok = false;
      if (job) {
        switch (job.op) {
          case 'prep': if (t < 2) { ok = f.apply('rotavate', i); if (f.weeds > 3) f.apply('weed', i); } op = 'plough'; break;
          case 'sow': if (t === 0) { f.apply('rotavate', i); } ok = f.apply('sow', i, { crop: job.crop }); op = 'sow'; break;
          case 'harvest': ok = f.apply('harvest', i, { byPlayer: true }); op = 'harvest'; break;
          case 'spray': ok = f.apply('spray', i, { item: job.item, byPlayer: true }); op = 'spray'; break;
          case 'weed': ok = f.apply('weed', i); op = 'weed'; break;
          case 'fertilize': ok = f.apply('fertilize', i, { item: job.item }); op = 'fertilize'; break;
        }
      } else switch (tool) {
        case 'hoe':
          if (t === 0) { ok = f.apply('plough', i); op = 'plough'; }
          else if (t === 1) { ok = f.apply('cultivate', i); if (f.weeds > 3) f.apply('weed', i); op = 'cultivate'; }
          else if (f.weeds > 3) { ok = f.apply('weed', i); op = 'weed'; }
          break;
        case 'seeds': { const c = this.opt.seeds; if (Inv.count('seed_' + c) <= 0.0001) { lastIssue = 'seed'; break; } ok = f.apply('sow', i, { crop: c }); op = 'sow'; if (!ok && f.crop && f.crop !== c && f.sownTiles > 0) lastIssue = 'mix'; break; }
        case 'fert': { if (Inv.count(this.opt.fert) <= 0.0001) { lastIssue = 'fert'; break; } ok = f.apply('fertilize', i, { item: this.opt.fert }); op = 'fertilize'; break; }
        case 'sprayer': { if (Inv.count(this.opt.sprayer) <= 0.0001) { lastIssue = 'chem'; break; } ok = f.apply('spray', i, { item: this.opt.sprayer, byPlayer: true }); op = 'spray'; break; }
        case 'sickle': ok = f.apply('harvest', i, { byPlayer: true }); op = 'harvest'; break;
      }
      if (ok) n++;
    }
    // every tile was already done recently (fertilizer and sprays need a gap): the job is finished
    if (job && n === 0 && (job.op === 'fertilize' || job.op === 'weed' || job.op === 'spray')) f.autoMode = null;
    // Auto on a bare field without seeds: plough what is left, then ask for seeds
    if (job && job.noSeed && (n === 0 || f.countMin(2) / f.n > 0.6)) {
      this.need = { item: 'seed', field: f, t: performance.now() };
      if (n === 0) UI.toastOnce('needseed', f.countMin(2) / f.n > 0.6 ? L('Field ploughed! Now ', 'దుక్కి అయింది! ఇప్పుడు ') + buyHint('seed') : L('Want to sow? ', 'విత్తాలా? ') + buyHint('seed') + L(' Sowing ploughs the rest too.', ' విత్తేటప్పుడు మిగతాది కూడా దున్నుతుంది.'), 'warn');
    }
    if (n > 0) {
      Bus.emit('work', { op, field: f, n, by: 'player', crop: f.crop });
      const P = this.y;
      if (op === 'spray') for (let k = 0; k < 4; k++) FX.emit('spray', fx + (frand() - 0.5) * R * 1.6, P + 0.9, fz + (frand() - 0.5) * R * 1.6, 0, -0.3, 0);
      if (op === 'plough' || op === 'weed' || op === 'cultivate') for (let k = 0; k < 3; k++) FX.emit('dust', fx + (frand() - 0.5) * R, P + 0.2, fz + (frand() - 0.5) * R, 0, 0.5, 0);
      if (op === 'sow' || op === 'fertilize') for (let k = 0; k < 3; k++) FX.emit('grain', fx, P + 1.0, fz, (frand() - 0.5) * 3, 1, (frand() - 0.5) * 3);
      if (op === 'harvest') for (let k = 0; k < 3; k++) FX.emit('chaff', fx + (frand() - 0.5) * R, P + 0.6, fz + (frand() - 0.5) * R, 0, 0.6, 0);
      Audio2.work(op);
      UI.workPulse(op, n);
    } else if (lastIssue) {
      const msg = { seed: L(`No ${LN(CROPS[this.opt.seeds])} seeds: `, `${LN(CROPS[this.opt.seeds])} విత్తనాలు లేవు: `) + buyHint('seed'), mix: L('This field already has another crop.', 'ఈ పొలంలో ఇప్పటికే వేరే పంట ఉంది.'), fert: L(`No ${LN(ITEMS[this.opt.fert])} left: `, `${LN(ITEMS[this.opt.fert])} లేదు: `) + buyHint('urea'), chem: L(`No ${LN(ITEMS[this.opt.sprayer])}: `, `${LN(ITEMS[this.opt.sprayer])} లేదు: `) + buyHint('pesticide') }[lastIssue];
      this.need = { item: lastIssue === 'seed' ? 'seed' : lastIssue === 'fert' ? 'urea' : lastIssue === 'chem' ? 'pesticide' : null, field: f, t: performance.now() };
      if (!this.need.item) this.need = null;
      UI.toastOnce('work' + lastIssue, msg, 'warn');
    }
  },
  updateVehicle(dt, ax) {
    const v = this.vehicle;
    const inp = { throttle: ax.y, steer: -ax.x, brake: Input.down('Space') || Input.brake };
    if (Input.pressed('KeyG') || Input.implToggle) { Input.implToggle = false; this.toggleImplement(); }
    if (Input.pressed('KeyL')) { v.lights = !v.lights; Audio2.sfx('click'); }
    if (Input.pressed('KeyH') || Input.horn) { Input.horn = false; Audio2.horn(v); Bus.emit('horn', {}); }
    v.update(dt, inp);
    // rider pose
    const h = this.h; const s = v.ud.seat; const c = Math.cos(v.yaw), sn = Math.sin(v.yaw);
    if (v.ud.pose === 'walkbehind') {
      h.x = v.x - sn * 1.7; h.z = v.z - c * 1.7; h.y = World.groundHeight(h.x, h.z); h.yaw = v.yaw; h.speed = Math.abs(v.speed); h.pose = 'walk';
      h.visible = Cam.mode !== 'first';
    } else {
      _v1.set(s.x, s.y, s.z).applyEuler(v.group.rotation);
      h.x = v.x + _v1.x; h.y = v.y + _v1.y - 0.02; h.z = v.z + _v1.z; h.yaw = v.yaw; h.speed = 0; h.pose = v.ud.pose;
      h.visible = Cam.mode !== 'first';
    }
    this.x = v.x; this.z = v.z; this.y = v.y;
    Stats.drive += Math.abs(v.speed) * dt;
  },
  toggleImplement() {
    const v = this.vehicle; if (!v) return;
    if (v.type === 'harvester') { v.lowered = !v.lowered; UI.toast(v.lowered ? L('Header lowered — drive over ripe crop to harvest.', 'హెడర్ దించారు — పండిన పంట మీదుగా నడిపి కోయండి.') : L('Header raised.', 'హెడర్ ఎత్తారు.'), 'info'); Audio2.sfx('hydraulic'); return; }
    if (!v.impl || !IMPLEMENTS[v.impl].op) { UI.toastOnce('noimpl', L('No working implement attached. Attach one at your farm (E near the tractor).', 'పనిచేసే పనిముట్టు లేదు. మీ ఇంటి దగ్గర అటాచ్ చేయండి.'), 'warn'); return; }
    if (!v.lowered) {
      const I = IMPLEMENTS[v.impl];
      if (I.op === 'sow' && !v.sowCrop) { UI.chooseCrop(fieldAt(v.x, v.z), (crop) => { v.sowCrop = crop; v.lowered = true; Audio2.sfx('hydraulic'); }); return; }
      if (I.op === 'spray') { UI.chooseFrom(L('Load the sprayer with', 'స్ప్రేయర్‌లో నింపండి'), ['pesticide', 'herbicide'].map((k) => ({ id: k, label: `${LN(ITEMS[k])} (${fmt1(Inv.count(k))} L)` })), (k) => { v.chem = k; v.lowered = true; Audio2.sfx('hydraulic'); }); return; }
      if (I.op === 'fertilize') { UI.chooseFrom(L('Load the spreader with', 'స్ప్రెడర్‌లో నింపండి'), ['urea', 'dap', 'complex', 'organic'].map((k) => ({ id: k, label: `${LN(ITEMS[k])} (${fmt1(Inv.count(k))})` })), (k) => { v.fert = k; v.lowered = true; Audio2.sfx('hydraulic'); }); return; }
    }
    v.lowered = !v.lowered; Audio2.sfx('hydraulic');
  },
};

// ---------------- camera ----------------
const Cam = {
  mode: 'third', yaw: Math.PI / 2, pitch: 0.32, dist: 6, tDist: 6, focus: new THREE.Vector3(), lastManual: 0, intro: null, photo: false,
  onEnterVehicle(v) { this.tDist = v.ud.cam; },
  onExitVehicle() { this.tDist = 6; },
  toggle() { this.mode = this.mode === 'third' ? 'first' : 'third'; UI.toast(this.mode === 'first' ? L('First-person view', 'ఫస్ట్-పర్సన్ వ్యూ') : L('Third-person view', 'థర్డ్-పర్సన్ వ్యూ'), 'info'); },
  update(dt) {
    const cam = G.camera;
    if (this.intro) { this.intro(dt, cam); return; }
    const sens = Settings.v.sens;
    const dx = Input.mdx + Input.look.dx * 1.3, dy = Input.mdy + Input.look.dy * 1.3;
    if (dx || dy) { this.yaw -= dx * 0.0042 * sens; this.pitch += dy * 0.0035 * sens * (Settings.v.invertY ? -1 : 1); this.lastManual = performance.now(); }
    if (Input.wheel) { this.tDist = clamp(this.tDist + Input.wheel * 0.9, 2.2, Player.vehicle ? 26 : 16); }
    if (Input.pressed('KeyV')) this.toggle();
    this.dist = damp(this.dist, this.tDist, 6, dt);
    const v = Player.vehicle;
    if (this.mode === 'first') {
      this.pitch = clamp(this.pitch, -1.3, 1.25);
      let ex, ey, ez;
      if (v) { const s = v.ud.seat; _v1.set(s.x, s.y + 0.72, s.z + 0.12).applyEuler(v.group.rotation); ex = v.x + _v1.x; ey = v.y + _v1.y; ez = v.z + _v1.z; if (performance.now() - this.lastManual > 1500) this.yaw = dampAngle(this.yaw, v.yaw + Math.PI, 3, dt); }
      else { ex = Player.x; ey = Player.y + 1.58 * Player.h.app.h; ez = Player.z; }
      cam.position.set(ex, ey, ez);
      const fx = -Math.sin(this.yaw) * Math.cos(this.pitch), fy = -Math.sin(this.pitch), fz = -Math.cos(this.yaw) * Math.cos(this.pitch);
      cam.lookAt(ex + fx, ey + fy, ez + fz);
      this.focus.set(ex, ey, ez);
      return;
    }
    // a touch wider view at speed: sprinting or driving fast feels fast
    const spd = v ? Math.abs(v.speed) : Player.speed;
    const fovT = 58 + (v ? clamp((spd - 6) / 18, 0, 1) * 9 : clamp((spd - 5) / 2.6, 0, 1) * 5);
    if (Math.abs(cam.fov - fovT) > 0.05) { cam.fov = damp(cam.fov, fovT, 3, dt); cam.updateProjectionMatrix(); }
    // third person
    this.pitch = clamp(this.pitch, -0.2, 1.35);
    let tx, ty, tz;
    if (v) {
      tx = v.x; ty = v.y + (v.type === 'harvester' ? 3.2 : v.type === 'bus' || v.type === 'truck' ? 2.5 : 1.6); tz = v.z;
      if (performance.now() - this.lastManual > 1600 && Math.abs(v.speed) > 0.6) this.yaw = dampAngle(this.yaw, v.yaw + (v.speed < 0 ? 0 : Math.PI), 2.2, dt);
    } else {
      tx = Player.x; ty = Player.y + 1.45; tz = Player.z;
      // swing the camera behind the player while they walk forward (no spiralling when strafing)
      const a = Player.axis;
      if (Settings.v.camFollow !== false && performance.now() - this.lastManual > 700 && Player.speed > 1.5 && a.y > 0.55 && Math.abs(a.x) < 0.6) {
        const behind = Player.yaw + Math.PI;
        if (Math.abs(angleDiff(this.yaw, behind)) < 2.2) this.yaw = dampAngle(this.yaw, behind, 2.4, dt);
      }
    }
    this.focus.x = damp(this.focus.x, tx, 14, dt); this.focus.y = damp(this.focus.y, ty, 10, dt); this.focus.z = damp(this.focus.z, tz, 14, dt);
    if (Math.hypot(this.focus.x - tx, this.focus.z - tz) > 12) this.focus.set(tx, ty, tz);
    const d = this.dist;
    let cx = this.focus.x + Math.sin(this.yaw) * Math.cos(this.pitch) * d;
    let cz = this.focus.z + Math.cos(this.yaw) * Math.cos(this.pitch) * d;
    let cy = this.focus.y + Math.sin(this.pitch) * d;
    const gy = World.groundHeight(cx, cz) + 0.5;
    if (cy < gy) cy = gy;
    cam.position.set(cx, cy, cz);
    cam.lookAt(this.focus.x, this.focus.y, this.focus.z);
  },
};

// ---------------- interactions ----------------
const Interact = {
  list: [], current: [], promptKey: '',
  add(o) { o.r = o.r || 3; this.list.push(o); return o; },
  remove(id) { this.list = this.list.filter((o) => o.id !== id); },
  gather() {
    const P = Player.pos(); const out = [];
    const inV = !!Player.vehicle;
    for (const o of this.list) {
      if (Math.abs(o.x - P.x) > o.r + 6 || Math.abs(o.z - P.z) > o.r + 6) continue;
      const d = Math.hypot(o.x - P.x, o.z - P.z);
      if (d > o.r + (inV ? 3 : 0)) continue;
      if (o.can && !o.can()) continue;
      if (o.foot && inV) continue;
      if (o.vehicle && !inV) continue;
      out.push({ d, o });
    }
    if (!inV) {
      const nd = Player.need;
      if (nd && performance.now() - nd.t < 25000) {
        if (nd.item === 'wait') { if (nd.field && nd.field.crop && fieldAt(P.x, P.z) === nd.field) out.push({ d: 0.1, o: { id: 'rest', label: () => L('Rest until the crop needs you', 'పంటకు పని వచ్చే వరకు విశ్రాంతి'), act: () => Services.waitForCrop(nd.field), prio: 6 } }); }
        else out.push({ d: 0.1, o: { id: 'quickbuy', label: () => nd.item === 'seed' ? L('Buy seeds (delivered here)', 'విత్తనాలు కొనండి (ఇక్కడికే)') : nd.item === 'pesticide' ? L('Buy pesticide (delivered here)', 'పురుగుమందు కొనండి (ఇక్కడికే)') : L('Buy fertilizer (delivered here)', 'ఎరువు కొనండి (ఇక్కడికే)'), act: () => UI.quickBuy(nd), prio: 6 } });
      }
      const n = NPCs.nearestTo(P.x, P.z, 2.4);
      if (n && !n.worker) out.push({ d: 1, o: { id: 'npc', label: () => L('Talk to ', 'మాట్లాడండి: ') + LN(n.name), act: () => Dialog.open(n), prio: 2 } });
      const v = Vehicles.nearestOwned(P.x, P.z, 4.2);
      if (v) {
        out.push({ d: 0.5, o: { id: 'drive', label: () => (v.type === 'bullock' ? L('Drive bullocks', 'ఎడ్లను తోలండి') : L('Drive ', 'నడపండి: ') + v.label()), act: () => Player.enterVehicle(v), prio: 3 } });
        if (v.type === 'tractor35' || v.type === 'tractor50' || v.type === 'bullock') out.push({ d: 0.6, o: { id: 'implement', label: () => L('Change implement', 'పనిముట్టు మార్చండి'), act: () => UI.implementMenu(v), prio: 1 } });
      }
    } else {
      out.push({ d: 99, o: { id: 'exit', label: () => L('Get off', 'దిగండి'), act: () => Player.exitVehicle(), prio: -1 } });
    }
    out.sort((a, b) => (b.o.prio || 0) - (a.o.prio || 0) || a.d - b.d);
    return out.map((e) => e.o);
  },
  update() {
    const g = this.gather();
    this.current = g;
    const key = g.map((o) => o.id).join('|') + LANG;
    if (key !== this.promptKey) { this.promptKey = key; UI.setPrompt(g); }
    if (Input.pressed('KeyE') || Input.interactTap) { Input.interactTap = false; this.trigger(); }
  },
  trigger() {
    const g = this.current;
    if (!g.length) return;
    const real = g.filter((o) => o.id !== 'exit');
    if (Player.vehicle && real.length === 0) { Player.exitVehicle(); return; }
    if (g.length === 1 || (!Player.vehicle && real.length === 1)) { real.length ? real[0].act() : g[0].act(); Audio2.sfx('click'); return; }
    UI.actionMenu(g);
  },
};
