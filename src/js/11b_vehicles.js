// ============================================================================
// Vehicle runtime: physics, implements, cargo, traffic AI, field-work AI
// ============================================================================
const TRAFFIC_DEFS = {
  bus: { en: 'Village bus', te: 'పల్లె బస్సు', maxSpeed: 12, rev: 2, accel: 1.6, turn: 0.8, wheelBase: 6.8, fuelCap: 0, fuelUse: 0 },
  truck: { en: 'Lorry', te: 'లారీ', maxSpeed: 17, rev: 2, accel: 1.4, turn: 0.8, wheelBase: 4.8, fuelCap: 0, fuelUse: 0 },
  auto: { en: 'Auto', te: 'ఆటో', maxSpeed: 10, rev: 2, accel: 2.5, turn: 1.3, wheelBase: 1.7, fuelCap: 0, fuelUse: 0 },
  npcbike: { en: 'Motorcycle', te: 'బైక్', maxSpeed: 13, rev: 2, accel: 4, turn: 1.8, wheelBase: 1.35, fuelCap: 0, fuelUse: 0, model: 'bike' },
  npctractor: { en: 'Tractor', te: 'ట్రాక్టర్', maxSpeed: 7.5, rev: 2, accel: 2, turn: 1, wheelBase: 2.1, fuelCap: 0, fuelUse: 0, model: 'tractor35' },
  npccar: { en: 'Car', te: 'కారు', maxSpeed: 15, rev: 2, accel: 3, turn: 1.3, wheelBase: 2.4, fuelCap: 0, fuelUse: 0, model: 'car' },
};
const FOOTPRINT = {
  tractor35: [[0, 1.3, 0.9], [0, -0.5, 1.0]], tractor50: [[0, 1.4, 0.95], [0, -0.5, 1.05]], npctractor: [[0, 1.3, 0.9], [0, -0.5, 1.0]],
  harvester: [[0, 3.4, 2.2], [0, 1.0, 1.4], [0, -1.6, 1.4]], bus: [[0, 4, 1.3], [0, 1.4, 1.3], [0, -1.4, 1.3], [0, -4, 1.3]], truck: [[0, 3, 1.2], [0, 0.4, 1.2], [0, -2.4, 1.2]],
  pickup: [[0, 1.3, 1.0], [0, -1.3, 1.0]], moped: [[0, 0.4, 0.35], [0, -0.4, 0.35]], bike: [[0, 0.4, 0.35], [0, -0.4, 0.35]], npcbike: [[0, 0.4, 0.35], [0, -0.4, 0.35]], auto: [[0, 0.5, 0.75], [0, -0.6, 0.75]],
  bullock: [[0, 2.8, 0.95], [0, 0, 0.9]],
  car: [[0, 1.0, 0.85], [0, -1.0, 0.85]], taxi: [[0, 1.0, 0.85], [0, -1.0, 0.85]], npccar: [[0, 1.0, 0.85], [0, -1.0, 0.85]], jeep: [[0, 1.1, 0.9], [0, -1.1, 0.9]],
  scooter: [[0, 0.35, 0.35], [0, -0.35, 0.35]], cycle: [[0, 0.35, 0.3], [0, -0.35, 0.3]], kart: [[0, 0.4, 0.6], [0, -0.45, 0.6]], heli: [[0, 0.6, 1.4], [0, -2.6, 0.6]],
};
const IMPL_WORK_Z = { plough: -1.95, cultivator: -1.9, rotavator: -1.75, seeddrill: -1.85, spreader: -2.0, sprayer: -2.25, bplough: -0.6 };
const MOUNTED = ['plough', 'cultivator', 'rotavator', 'seeddrill', 'spreader', 'sprayer'];

class Vehicle {
  constructor(type, st = {}) {
    this.type = type;
    this.def = VEHICLES[type] || TRAFFIC_DEFS[type];
    this.id = st.id || ('v' + (Vehicles.nextId++));
    const modelType = this.def.model || type;
    if (type === 'bullock') this.group = this.buildBullock(); else this.group = buildVehicleModel(modelType, st);
    this.ud = this.group.userData;
    this.x = st.x || 0; this.z = st.z || 0; this.yaw = st.yaw || 0; this.y = World.groundHeight(this.x, this.z);
    this.speed = 0; this.steer = 0; this.pitch = 0; this.roll = 0; this.lean = 0;
    this.fuel = st.fuel !== undefined ? st.fuel : this.def.fuelCap; this.cond = st.cond !== undefined ? st.cond : 100;
    this.cargo = st.cargo || []; this.impl = null; this.implG = null; this.lowered = false; this.lights = false;
    this.owned = !!st.owned; this.rentUntil = st.rentUntil || 0; this.tank = st.tank || 0;
    this.sowCrop = st.sowCrop || null; this.chem = st.chem || 'pesticide'; this.fert = st.fert || 'urea';
    this.tYaw = this.yaw; this.wheelAng = 0; this.implAnim = 0; this.throttle = 0; this.rpm = 0; this.traffic = !!st.traffic;
    this.fp = FOOTPRINT[type] || [[0, 0, 1]];
    G.scene.add(this.group);
    if (st.impl) this.attach(st.impl);
    this.place();
  }
  buildBullock() {
    const g = new THREE.Group();
    const b = new GeoBuilder();
    b.box(1.9, 0.14, 0.16, 0, 1.28, 2.45, 0, C('#6b4a32'));
    for (const sx of [-0.62, 0.62]) b.box(0.06, 0.4, 0.06, sx, 1.1, 2.45, 0, C('#5a3e2a'));
    const m = new THREE.Mesh(b.build(), MAT.std); m.castShadow = true; g.add(m);
    this.bulls = [Animals.create('bullock', 0, 0, { col: '#ede8de' }), Animals.create('bullock', 0, 0, { col: '#e4dccd' })];
    for (const a of this.bulls) if (a) { a.mode = 'vehicle'; Fauna.list.push(a); }
    g.userData = { wheels: [], seat: { x: 0, y: 1.25, z: 0.6 }, pose: 'cart', cam: 7.5, lightMat: new THREE.MeshStandardMaterial() };
    return g;
  }
  get cargoCap() { return (this.def.cargo || 0) + (this.impl && IMPLEMENTS[this.impl].cargo ? IMPLEMENTS[this.impl].cargo : 0); }
  get cargoQty() { let s = 0; for (const c of this.cargo) s += c.qty; return s; }
  label() { return LN(this.def); }
  attach(impl) {
    this.detach();
    this.impl = impl; if (!impl) return;
    const g = buildImplementModel(impl);
    this.implG = g;
    if (MOUNTED.includes(impl) || impl === 'bplough' || impl === 'bcart') { this.group.add(g); g.position.set(0, 0, this.type === 'bullock' ? 0 : -1.05); this.towed = false; }
    else { G.scene.add(g); this.towed = true; this.tYaw = this.yaw; }
    this.lowered = false;
    if (this.type === 'bullock') this.ud.pose = impl === 'bplough' ? 'walkbehind' : 'cart';
  }
  detach() {
    if (this.implG) { if (this.implG.parent) this.implG.parent.remove(this.implG); this.implG.traverse((o) => { if (o.geometry && o.geometry !== WheelGeo) {} }); }
    this.implG = null; this.impl = null; this.lowered = false; this.towed = false;
  }
  hitchWorld(out) { const c = Math.cos(this.yaw), s = Math.sin(this.yaw); const hz = this.type === 'bullock' ? -1.2 : -1.25; out.x = this.x + s * hz; out.z = this.z + c * hz; return out; }
  forward() { return { x: Math.sin(this.yaw), z: Math.cos(this.yaw) }; }
  place() {
    const c = Math.cos(this.yaw), s = Math.sin(this.yaw);
    // terrain tilt
    const L = this.type === 'harvester' ? 3.2 : this.type === 'bus' || this.type === 'truck' ? 4 : 1.2;
    const Wd = 0.8;
    const hf = World.groundHeight(this.x + s * L, this.z + c * L), hb = World.groundHeight(this.x - s * L, this.z - c * L);
    const hl = World.groundHeight(this.x + c * Wd, this.z - s * Wd), hr = World.groundHeight(this.x - c * Wd, this.z + s * Wd);
    const tp = Math.atan2(hb - hf, 2 * L), tr = Math.atan2(hr - hl, 2 * Wd);
    this.pitch = damp(this.pitch, tp, 8, G.dt || 0.016); this.roll = damp(this.roll, tr, 8, G.dt || 0.016);
    this.y = (hf + hb + hl + hr) / 4;
    this.group.position.set(this.x, this.y, this.z);
    this.group.rotation.set(this.pitch, this.yaw, this.roll + this.lean, 'YXZ');
    // wheels
    for (const w of this.ud.wheels) { w.m.rotation.x = this.wheelAng * (0.66 / w.r); if (w.steer) w.piv.rotation.y = this.type === 'harvester' ? -this.steer : this.steer; }
    if (this.bulls) {
      this.bulls.forEach((a, k) => {
        if (!a) return;
        const lx = k === 0 ? -0.62 : 0.62, lz = 3.05;
        a.x = this.x + lx * c + lz * s; a.z = this.z - lx * s + lz * c; a.y = World.groundHeight(a.x, a.z); a.yaw = this.yaw; a.speed = Math.abs(this.speed) * 1.1; a.pose = 'stand';
      });
    }
    // implement animation
    if (this.implG) {
      const I = this.impl;
      const target = this.lowered ? 1 : 0;
      this.implAnim = damp(this.implAnim, target, 5, G.dt || 0.016);
      if (!this.towed) {
        this.implG.position.y = (1 - this.implAnim) * (this.type === 'bullock' ? 0.15 : 0.4);
        this.implG.rotation.x = -(1 - this.implAnim) * 0.08;
        if (this.implG.userData.booms) for (const b of this.implG.userData.booms) b.piv.rotation.y = b.sx * (1 - this.implAnim) * 1.45;
        if (this.implG.userData.rotor) { const r = this.implG.userData.rotor; if (this.lowered && Math.abs(this.speed) > 0.1) { if (this.implG.userData.rotAxis === 'y') r.rotation.y += 0.5; else r.rotation.x -= 0.4; } }
        for (const w of this.implG.userData.wheels) w.m.rotation.x = this.wheelAng * (0.66 / w.r);
      } else {
        const h = this.hitchWorld({});
        const ct = Math.cos(this.tYaw), st = Math.sin(this.tYaw);
        const ax = h.x - st * 2.6, az = h.z - ct * 2.6;
        const ty = (World.groundHeight(h.x, h.z) + World.groundHeight(ax, az)) / 2;
        this.implG.position.set(h.x, ty, h.z);
        this.implG.rotation.set(Math.atan2(World.groundHeight(ax, az) - World.groundHeight(h.x, h.z), 2.6) * -1, this.tYaw, 0, 'YXZ');
        for (const w of this.implG.userData.wheels) w.m.rotation.x = this.wheelAng * (0.66 / w.r);
      }
      const hp = this.implG.userData.heap;
      if (hp) { const q = this.cargoQty, cap = this.cargoCap || 1; hp.visible = q > 0.05; if (q > 0.05) { const k = Math.pow(q / cap, 0.5); const sc = this.implG.userData.heapScale; hp.scale.set(sc[0], sc[1] * k + 0.05, sc[2]); hp.material.color.set(PRODUCE[this.cargo[0].crop].heap); } }
    }
  }
  update(dt, inp) {
    const d = this.def;
    const surf = World.surfaceAt(this.x, this.z);
    const wet = U.uWet.value;
    const roadsCC = G.S && G.S.village.roads;
    let smul = surf === 'asphalt' || surf === 'concrete' ? 1 : surf === 'dirt' ? (roadsCC ? 1 : 0.9 - wet * 0.25) : surf === 'field' ? 0.88 - wet * 0.2 : surf === 'water' ? 0.3 : 0.82 - wet * 0.2;
    if (this.type === 'bullock' || this.type === 'harvester') smul = Math.max(smul, 0.85);
    const mine = this === Player.vehicle;   // the player's own ride: quicker and snappier than traffic
    let maxSp = d.maxSpeed * smul * (mine && this.type !== 'bullock' ? 1.35 : 1);
    if (this.lowered && this.impl && IMPLEMENTS[this.impl].op) maxSp = Math.min(maxSp, IMPLEMENTS[this.impl].maxSpeed);
    if (this.type === 'harvester' && this.lowered) maxSp = Math.min(maxSp, 4.2);
    if (this.cond < 30) maxSp *= 0.7;
    const noFuel = d.fuelCap > 0 && this.fuel <= 0;
    if (noFuel) maxSp = 0;
    const load = this.cargoQty / Math.max(1, this.cargoCap); maxSp *= 1 - load * 0.15;
    const acc = d.accel * (1 - load * 0.3) * (mine ? 1.8 : 1);
    const th = inp.throttle || 0;
    if (th > 0) { if (this.speed < -0.2) this.speed += acc * 3 * dt; else if (this.speed < maxSp) this.speed += acc * th * dt * (1 - 0.6 * this.speed / Math.max(0.1, maxSp)); }
    else if (th < 0) { if (this.speed > 0.2) this.speed -= acc * 3 * dt; else this.speed = Math.max(-(d.rev || 2), this.speed - acc * 0.7 * dt); }
    else this.speed = damp(this.speed, 0, surf === 'field' ? 2.2 : 1.1, dt);
    if (this.speed > maxSp) this.speed = damp(this.speed, maxSp, 3, dt);
    if (inp.brake) this.speed = damp(this.speed, 0, 5, dt);
    this.throttle = th;
    const spd = Math.abs(this.speed);
    const maxSteer = (d.two ? 0.5 : 0.62) * (1 - Math.min(0.55, spd / (d.maxSpeed * 1.6)));
    this.steer = damp(this.steer, (inp.steer || 0) * maxSteer, mine ? 11 : 6, dt);
    let yawRate = this.speed / d.wheelBase * Math.tan(this.steer) * (d.turn || 1) * (this.job ? 2.6 : 1);
    // your own ride turns like an arcade racer: sharp at low speed, steady and controllable when fast
    if (mine) { const maxYaw = (d.two ? 2.5 : 1.9) / (1 + spd * 0.055); yawRate = clamp(yawRate, -maxYaw, maxYaw); }
    this.yaw += yawRate * dt;
    if (d.two) this.lean = damp(this.lean, -clamp(yawRate * spd * 0.06, -0.45, 0.45), 6, dt);
    // move with collision
    const nx = this.x + Math.sin(this.yaw) * this.speed * dt, nz = this.z + Math.cos(this.yaw) * this.speed * dt;
    const px = this.x, pz = this.z;
    this.x = nx; this.z = nz;
    const hit = this.collide();
    if (hit) {
      const impact = spd;
      if (impact > 3.5 && !this.traffic) { this.cond = Math.max(0, this.cond - impact * 0.8); Audio2.sfx('bump'); UI.toastOnce('crash', L('Careful! The vehicle was damaged.', 'జాగ్రత్త! వాహనం దెబ్బతింది.'), 'warn'); if (this === Player.vehicle && impact > 8) Player.hurt(impact * 0.6, 'crash'); }
      this.speed *= -0.15;
    }
    // world bounds
    if (Math.abs(this.x) > PLAY_HALF || Math.abs(this.z) > PLAY_HALF) { this.x = clamp(this.x, -PLAY_HALF, PLAY_HALF); this.z = clamp(this.z, -PLAY_HALF, PLAY_HALF); this.speed = 0; }
    this.wheelAng += this.speed * dt / 0.66;
    // towed implement kinematics
    if (this.towed) { const Lt = 2.6; this.tYaw += (this.speed / Lt) * Math.sin(angleDiff(this.tYaw, this.yaw)) * dt; }
    // fuel & wear
    if (d.fuelCap > 0) {
      const gh = dt * Time.scale / GAME_SEC_PER_HOUR;
      this.fuel = Math.max(0, this.fuel - d.fuelUse * gh * (0.25 + 0.75 * Math.abs(th)) * (this.lowered ? 1.35 : 1));
      if (this.fuel <= 0 && !this._fuelWarned && this === Player.vehicle) { this._fuelWarned = true; UI.toast(L('Out of diesel! Buy a diesel can at the kirana or refuel at the petrol bunk.', 'డీజిల్ అయిపోయింది! కిరాణంలో డీజిల్ క్యాన్ కొనండి లేదా పెట్రోల్ బంక్‌లో నింపించండి.'), 'bad'); }
      if (this.fuel > 0) this._fuelWarned = false;
      this.cond = Math.max(0, this.cond - gh * 0.05 * (G.S && G.S.up.garage ? 0.5 : 1) * (this.lowered ? 1.5 : 1));
    }
    this.rpm = damp(this.rpm, noFuel ? 0 : 0.25 + Math.abs(th) * 0.55 + spd / d.maxSpeed * 0.3 + (this.lowered ? 0.12 : 0), 4, dt);
    // implement work
    if (this.lowered) this.work(dt);
    // lights
    this.ud.lightMat.emissiveIntensity = this.lights ? 3 : 0;
    this.place();
    this.fx(dt, surf);
  }
  collide() {
    if (this.ghost) return false; // AI field machines pass through edge trees and pump houses
    const c = Math.cos(this.yaw), s = Math.sin(this.yaw);
    let hit = false; let sx = 0, sz = 0, n = 0;
    for (const [lx, lz, r] of this.fp) {
      const p = { x: this.x + lx * c + lz * s, z: this.z - lx * s + lz * c };
      const ox = p.x, oz = p.z;
      if (World.collideCircle(p, r)) { hit = true; sx += p.x - ox; sz += p.z - oz; n++; }
      // other vehicles
      for (const v of Vehicles.all) {
        if (v === this || !v.group.visible) continue;
        if (Math.abs(v.x - p.x) > 12 || Math.abs(v.z - p.z) > 12) continue;
        const vc = Math.cos(v.yaw), vs = Math.sin(v.yaw);
        for (const [mx, mz, mr] of v.fp) {
          const qx = v.x + mx * vc + mz * vs, qz = v.z - mx * vs + mz * vc;
          const dx = p.x - qx, dz = p.z - qz, dd = Math.hypot(dx, dz);
          if (dd < r + mr && dd > 1e-4) { hit = true; const push = (r + mr - dd); sx += dx / dd * push; sz += dz / dd * push; n++; }
        }
      }
    }
    if (hit) { this.x += sx / Math.max(1, n); this.z += sz / Math.max(1, n); }
    return hit;
  }
  implWorkPoint() {
    const I = this.impl; const c = Math.cos(this.yaw), s = Math.sin(this.yaw);
    if (this.type === 'harvester') return { x: this.x + s * 3.7, z: this.z + c * 3.7, rx: c, rz: -s, w: this.def.header };
    if (this.towed) { const h = this.hitchWorld({}); const ct = Math.cos(this.tYaw), st = Math.sin(this.tYaw); return { x: h.x - st * 4.2, z: h.z - ct * 4.2, rx: ct, rz: -st, w: IMPLEMENTS[I].width }; }
    const zz = (this.type === 'bullock' ? 0 : -1.05) + (IMPL_WORK_Z[I] || -1.9) + (this.type === 'bullock' ? 0 : 1.05);
    return { x: this.x + s * zz, z: this.z + c * zz, rx: c, rz: -s, w: IMPLEMENTS[I].width };
  }
  work(dt) {
    const op = this.type === 'harvester' ? 'harvest' : this.impl ? IMPLEMENTS[this.impl].op : null;
    if (!op || this.speed < 0.25) return;
    const P = this.implWorkPoint();
    const opts = { crop: this.sowCrop, item: op === 'spray' ? this.chem : op === 'fertilize' ? this.fert : null, byPlayer: this === Player.vehicle, free: this.aiFree };
    let n = 0, fieldHit = null;
    for (let s = -P.w / 2 + 0.3; s <= P.w / 2 - 0.3 + 1e-3; s += 0.7) {
      const x = P.x + P.rx * s, z = P.z + P.rz * s;
      const f = fieldAt(x, z); if (!f) continue;
      if (!f.isPlayer && !(this.job && this.job.field === f)) { if (this === Player.vehicle) UI.toastOnce('notyours', L('This field is not yours. Buy or lease it first.', 'ఈ పొలం మీది కాదు. ముందు కొనండి లేదా కౌలుకు తీసుకోండి.'), 'warn'); continue; }
      const i = f.tileAt(x, z); if (i < 0) continue;
      if (op === 'water') { if (this.tank <= 0) { if (this === Player.vehicle) UI.toastOnce('tankEmpty', L('Tanker is empty. Fill it at the lake, canal or a borewell.', 'ట్యాంకర్ ఖాళీ. చెరువు, కాలువ లేదా బోరు దగ్గర నింపండి.'), 'warn'); this.lowered = false; return; } }
      if (op === 'sow' && !opts.crop) { if (this === Player.vehicle) { this.lowered = false; UI.chooseCrop(f, (crop) => { this.sowCrop = crop; this.lowered = true; }); } return; }
      if (f.apply(op, i, opts)) { n++; fieldHit = f; if (op === 'water') this.tank = Math.max(0, this.tank - 0.45); }
      else if ((op === 'sow' || op === 'spray' || op === 'fertilize') && !opts.free && opts.item !== null) {
        const need = op === 'sow' ? 'seed_' + opts.crop : opts.item;
        if (Inv.count(need) <= 0.0001) { if (this === Player.vehicle) { UI.toastOnce('outof' + need, L(`Out of ${Inv.name(need)}. Buy more at Srinu's shop.`, `${Inv.name(need)} అయిపోయింది. శ్రీను దుకాణంలో కొనండి.`), 'warn'); } this.lowered = false; return; }
      }
    }
    if (n > 0) { Bus.emit('work', { op, field: fieldHit, n, by: this === Player.vehicle ? 'player' : 'ai', crop: fieldHit.crop }); if (op === 'harvest') FX.chaff(this); }
  }
  fx(dt, surf) {
    const spd = Math.abs(this.speed);
    const P = G.preset.particles;
    if (spd > 1.2 && (surf === 'dirt' || surf === 'field' || surf === 'grass') && frand() < spd * 0.12 * P) {
      const wet = U.uWet.value > 0.35;
      const c = Math.cos(this.yaw), s = Math.sin(this.yaw);
      const back = this.fp[this.fp.length - 1][1] - 0.8;
      FX.emit(wet ? 'mud' : 'dust', this.x + s * back + (frand() - 0.5) * 1.6, this.y + 0.3, this.z + c * back + (frand() - 0.5) * 1.6, -s * spd * 0.2, 0.4 + frand() * 0.4, -c * spd * 0.2);
    }
    if ((this.type === 'tractor35' || this.type === 'tractor50' || this.type === 'npctractor' || this.type === 'harvester' || this.type === 'truck') && frand() < (0.1 + this.throttle * 0.35) * P) {
      const c = Math.cos(this.yaw), s = Math.sin(this.yaw);
      const [ex, ey, ez] = this.type === 'harvester' ? [1.25, 3.4, -1.0] : this.type === 'truck' ? [0.9, 3.0, 2.2] : [-0.26, 2.4, 1.45];
      FX.emit('smoke', this.x + ex * c + ez * s, this.y + ey, this.z - ex * s + ez * c, 0, 1.2, 0);
    }
    if (this.lowered && this.impl === 'sprayer' && spd > 0.3 && frand() < 0.8 * P) { const Pp = this.implWorkPoint(); for (let k = 0; k < 2; k++) { const sd = (frand() - 0.5) * Pp.w; FX.emit('spray', Pp.x + Pp.rx * sd, this.y + 1.1, Pp.z + Pp.rz * sd, 0, -0.5, 0); } }
    if (this.lowered && this.impl === 'tanker' && spd > 0.3 && this.tank > 0 && frand() < 0.8 * P) { const Pp = this.implWorkPoint(); FX.emit('water', Pp.x, this.y + 0.7, Pp.z, (frand() - 0.5), -0.5, (frand() - 0.5)); }
    if (this.lowered && this.impl === 'spreader' && spd > 0.3 && frand() < 0.6 * P) { const Pp = this.implWorkPoint(); const a = frand() * TAU; FX.emit('grain', Pp.x, this.y + 0.5, Pp.z, Math.cos(a) * 3, 0.6, Math.sin(a) * 3); }
    if (this.lowered && (this.impl === 'plough' || this.impl === 'rotavator' || this.impl === 'cultivator' || this.impl === 'bplough') && spd > 0.3 && frand() < 0.5 * P && U.uWet.value < 0.5) { const Pp = this.implWorkPoint(); FX.emit('dust', Pp.x + Pp.rx * (frand() - 0.5) * Pp.w, this.y + 0.2, Pp.z + Pp.rz * (frand() - 0.5) * Pp.w, 0, 0.5, 0); }
  }
  serialize() { return { id: this.id, type: this.type, x: +this.x.toFixed(2), z: +this.z.toFixed(2), yaw: +this.yaw.toFixed(3), fuel: +this.fuel.toFixed(2), cond: +this.cond.toFixed(1), cargo: this.cargo, impl: this.impl, tank: this.tank, rentUntil: this.rentUntil, owned: this.owned, sowCrop: this.sowCrop, chem: this.chem, fert: this.fert }; }
  destroy() {
    if (this.implG && this.implG.parent) this.implG.parent.remove(this.implG);
    G.scene.remove(this.group);
    if (this.bulls) for (const a of this.bulls) if (a) { a.visible = false; a.mode = 'vehicle'; }
  }
}

const Vehicles = {
  nextId: 1, all: [], player: [], traffic: [],
  spawnOwned(st) { const v = new Vehicle(st.type, Object.assign({ owned: true }, st)); this.all.push(v); this.player.push(v); return v; },
  removeOwned(v) { v.destroy(); this.all.splice(this.all.indexOf(v), 1); this.player.splice(this.player.indexOf(v), 1); if (Player.vehicle === v) Player.exitVehicle(true); },
  nearestOwned(x, z, r = 4.5) { let best = null, bd = r; for (const v of this.player) { const d = Math.hypot(v.x - x, v.z - z) - (v.type === 'harvester' ? 2 : v.type === 'bullock' ? 1 : 0.5); if (d < bd) { bd = d; best = v; } } return best; },
  // hide vehicles that are too far away to see (saves draw calls on phones)
  cull(v, d) {
    const vis = d < G.preset.drawDist * 0.78 || v === Player.vehicle;
    if (v.group.visible !== vis) { v.group.visible = vis; if (v.implG && v.towed) v.implG.visible = vis; }
    return vis;
  },
  update(dt) {
    const P0 = Player.pos();
    for (const v of this.player) {
      this.cull(v, Math.hypot(v.x - P0.x, v.z - P0.z));
      if (v === Player.vehicle) continue;
      if (v.job) { v.job.update(dt); continue; }
      if (Math.abs(v.speed) > 0.01) v.update(dt, { throttle: 0, steer: 0, brake: true });
      else if (v.bulls) { for (const a of v.bulls) if (a) { a.speed = 0; a.pose = Sky.night > 0.7 ? 'lie' : 'stand'; } }
    }
    Traffic.update(dt);
  },
  save() { return this.player.map((v) => v.serialize()); },
  // nearest spot around (x, z) clear of vehicles and buildings, for deliveries and rentals
  freeSpot(x, z, rad = 2.4) {
    for (let ring = 0; ring < 7; ring++) {
      const n = Math.max(1, ring * 6);
      for (let k = 0; k < n; k++) {
        const a = (k / n) * TAU + ring * 0.7, px = x + Math.cos(a) * ring * 3.5, pz = z + Math.sin(a) * ring * 3.5;
        if (this.all.some((v) => Math.hypot(v.x - px, v.z - pz) < rad + 2.6)) continue;
        if (World.collideCircle({ x: px, z: pz }, rad)) continue;
        if (fieldAt(px, pz)) continue;
        return { x: px, z: pz };
      }
    }
    return { x, z };
  },
};

// ---------------- traffic AI ----------------
const Traffic = {
  list: [],
  spawn() {
    const main = ROADS.find((r) => r.id === 'main'), town = ROADS.find((r) => r.id === 'town'), seetha = ROADS.find((r) => r.id === 'seetha');
    // bus route: town stand -> highway -> village stop -> Seethampet and back
    const pts = [];
    const pushR = (r, rev = false, from = 0, to = 1) => { const S = r.samples; const a = Math.floor(from * (S.length - 1)), b = Math.floor(to * (S.length - 1)); const arr = S.slice(Math.min(a, b), Math.max(a, b) + 1); if (rev) arr.reverse(); for (const p of arr) pts.push({ x: p.x, z: p.z, w: r.w }); };
    pts.push({ x: 600, z: -126, w: 8 });
    pushR(town, true, 0, 0.2);
    for (let z = -118; z <= 0; z += 6) pts.push({ x: 640, z, w: 16 });
    pushR(main, true);
    const iS = pts.findIndex((p) => Math.abs(p.x + 200) < 4 && Math.abs(p.z - 8) < 6);
    const cut = iS > 0 ? iS : pts.length;
    const route = pts.slice(0, cut + 1); const sr = seetha.samples.map((p) => ({ x: p.x, z: p.z, w: seetha.w })); route.push(...sr);
    this.busRoute = route;
    const stops = [{ i: 0, t: 45, name: 'town' }, { i: this.nearestIdx(route, POI.busStop.stop.x, POI.busStop.stop.z), t: 35, name: 'village' }, { i: route.length - 1, t: 30, name: 'seetha' }];
    this.add('bus', route, { stops, speed: 10.5 });
    // lorries on the highway (both directions)
    const south = [], north = [];
    for (let z = -890; z <= 890; z += 20) { south.push({ x: 646.2, z, w: 4 }); north.push({ x: 633.8, z: -z, w: 4 }); }
    for (let k = 0; k < 5; k++) { this.add('truck', south, { loop: 'teleport', start: k / 5, speed: 13 + frand() * 3, noOffset: true }); this.add('truck', north, { loop: 'teleport', start: k / 5 + 0.1, speed: 13 + frand() * 3, noOffset: true }); }
    // motorcycles & autos: random trips
    for (let k = 0; k < Math.round(7 * G.preset.npc); k++) this.add('npcbike', null, { trips: true, speed: 9 + frand() * 3 });
    for (let k = 0; k < 3; k++) this.add('auto', null, { trips: true, speed: 8, townBias: true });
    for (let k = 0; k < 2; k++) this.add('npctractor', null, { trips: true, speed: 6.5, impl: 'trailer' });
  },
  nearestIdx(route, x, z) { let bi = 0, bd = 1e9; route.forEach((p, i) => { const d = Math.hypot(p.x - x, p.z - z); if (d < bd) { bd = d; bi = i; } }); return bi; },
  add(type, route, o) {
    const v = new Vehicle(type, { traffic: true, impl: o.impl });
    v.traffic = true; v.route = route; v.ri = 0; v.dir = 1; v.o = o; v.wait = 0; v.honkT = 0; v.cruise = o.speed;
    if (route) { const i = Math.floor((o.start || 0) * (route.length - 1)); v.ri = i; v.x = route[i].x; v.z = route[i].z; const n = route[Math.min(route.length - 1, i + 1)]; v.yaw = Math.atan2(n.x - v.x, n.z - v.z); }
    else this.newTrip(v, true);
    if (v.cargo && o.impl === 'trailer') v.cargo = [{ crop: pick(['paddy', 'maize', 'cotton']), qty: 20 + frand() * 15, q: 1 }];
    v.place();
    this.list.push(v); Vehicles.all.push(v);
    if (type === 'bus') this.bus = v;
    return v;
  },
  newTrip(v, teleport = false) {
    const N = Graph.nodes; if (!N.length) return;
    const pickNode = () => { const t = frand(); if (v.o.townBias && t < 0.6) return Graph.nearest(560 + (frand() - 0.5) * 60, -125); if (t < 0.55) return Graph.nearest((frand() - 0.5) * 240, (frand() - 0.5) * 240); if (t < 0.75) return Graph.nearest(SEETHA.x, SEETHA.z); if (t < 0.9) return Graph.nearest(430, 104); return Math.floor(frand() * N.length); };
    const a = teleport ? pickNode() : Graph.nearest(v.x, v.z), b = pickNode();
    if (teleport) { v.x = N[a].x; v.z = N[a].z; }
    const path = Graph.path(v.x, v.z, N[b].x, N[b].z, 0);
    const route = [{ x: v.x, z: v.z, w: 5 }];
    for (const p of path) route.push({ x: p.x, z: p.z, w: 5 });
    v.route = route; v.ri = 0; v.dir = 1;
  },
  update(dt) {
    const P = Player.pos(); const pv = Player.vehicle;
    for (const v of this.list) {
      const dP = Math.hypot(v.x - P.x, v.z - P.z); const far = dP > 320;
      const vis = Vehicles.cull(v, dP);
      if (v.wait > 0) { v.wait -= dt; v.update(dt, { throttle: 0, brake: true }); continue; }
      const R = v.route; if (!R || !R.length) { this.newTrip(v); continue; }
      let tgt = R[Math.max(0, Math.min(R.length - 1, v.ri))];
      // lane offset (keep left)
      const nxt = R[Math.max(0, Math.min(R.length - 1, v.ri + v.dir))];
      let dx = nxt.x - tgt.x, dz = nxt.z - tgt.z; const l = Math.hypot(dx, dz) || 1; dx /= l; dz /= l;
      const off = v.o.noOffset ? 0 : Math.min((tgt.w || 5) >= 12 ? 4.2 : 2.2, (tgt.w || 5) / 4 + 0.3);
      const tx = tgt.x + dz * off, tz = tgt.z - dx * off;
      const ddx = tx - v.x, ddz = tz - v.z; const dist = Math.hypot(ddx, ddz);
      if (dist < 4.5) {
        // stops
        if (v.o.stops) { const st = v.o.stops.find((s) => s.i === v.ri); if (st && !v.justStopped) { v.wait = st.t; v.justStopped = true; Bus.emit('busStop', { v, stop: st }); if (!far) Audio2.at('horn', v.x, v.z); continue; } }
        v.justStopped = false;
        v.ri += v.dir;
        if (v.ri >= R.length || v.ri < 0) {
          if (v.o.loop === 'teleport') { v.ri = 0; v.x = R[0].x; v.z = R[0].z; v.yaw = Math.atan2(R[1].x - R[0].x, R[1].z - R[0].z); v.speed = v.cruise * 0.7; }
          else if (v.o.trips) { this.newTrip(v); }
          else { v.dir *= -1; v.ri = clamp(v.ri + v.dir * 2, 0, R.length - 1); }
        }
        continue;
      }
      if (far) { // cheap kinematic move
        const sp = v.cruise * 0.9; const k = Math.min(1, sp * dt / dist);
        v.x += ddx * k; v.z += ddz * k; v.yaw = Math.atan2(ddx, ddz); v.speed = sp; v.wheelAng += sp * dt / 0.66; if (vis) v.place(); continue;
      }
      const desired = Math.atan2(ddx, ddz);
      const err = angleDiff(v.yaw, desired);
      let target = v.cruise * clamp(1 - Math.abs(err) * 0.9, 0.3, 1);
      // obstacle check ahead
      const fx = Math.sin(v.yaw), fz = Math.cos(v.yaw);
      const look = 7 + Math.abs(v.speed) * 1.3;
      const obst = (ox, oz, rad) => { const rx = ox - v.x, rz = oz - v.z; const along = rx * fx + rz * fz; if (along < 0 || along > look) return false; const lat = Math.abs(rx * fz - rz * fx); return lat < rad; };
      let blocked = false;
      if (obst(P.x, P.z, 1.8)) blocked = true;
      if (!blocked) for (const o of Vehicles.all) { if (o === v) continue; if (Math.abs(o.x - v.x) > 25 || Math.abs(o.z - v.z) > 25) continue; if (obst(o.x, o.z, 1.9) && Math.abs(angleDiff(o.yaw, v.yaw)) < 2.2) { blocked = true; break; } }
      if (!blocked) for (const n of NPCs.list) { if (!n.h.visible) continue; if (Math.abs(n.h.x - v.x) > 14 || Math.abs(n.h.z - v.z) > 14) continue; if (obst(n.h.x, n.h.z, 1.3)) { blocked = true; break; } }
      if (blocked) { target = 0; v.honkT += dt; if (v.honkT > 2.2) { v.honkT = -3; Audio2.at('horn', v.x, v.z); } } else v.honkT = Math.max(0, v.honkT - dt);
      const th = v.speed < target - 0.3 ? 1 : v.speed > target + 0.5 ? -0.6 : 0;
      v.update(dt, { throttle: th, steer: clamp(err * 1.6, -1, 1), brake: blocked });
    }
  },
};

// ---------------- AI field work (hired driver / harvester service) ----------------
class FieldJob {
  constructor(v, field, op, o = {}) {
    this.v = v; this.field = field; this.op = op; this.o = o; v.job = this; this.i = 0; this.done = false; this.stuckT = 0; this.t = 0;
    v.aiFree = !!o.free;
    const I = op === 'harvest' ? { width: v.def.header || 4.4 } : IMPLEMENTS[v.impl];
    const step = Math.max(1.6, I.width * 0.92);
    const pts = [];
    const f = field; let k = 0;
    for (let z = f.z0 + step / 2; z < f.z1; z += step, k++) {
      const a = { x: f.x0 - 3.5, z }, b = { x: f.x1 + 3.5, z };
      if (k % 2) pts.push(b, a); else pts.push(a, b);
    }
    this.pts = pts;
    if (o.direct) {
      // contractor arrives at the field edge, lined up with the first pass
      v.x = pts[0].x; v.z = pts[0].z; v.yaw = Math.atan2(pts[1].x - pts[0].x, pts[1].z - pts[0].z); v.speed = 0; v.place();
      this.approach = []; this.phase = 'work'; this.ai = 0; this.i = 1;
    } else {
      // approach from current position
      this.approach = Math.hypot(v.x - pts[0].x, v.z - pts[0].z) < 30 ? [] : Graph.path(v.x, v.z, pts[0].x, pts[0].z, 0);
      this.approach.push({ x: pts[0].x, z: pts[0].z });
      this.phase = 'approach'; this.ai = 0;
    }
  }
  update(dt) {
    const v = this.v; this.t += dt;
    let tgt;
    if (this.phase === 'approach') { tgt = this.approach[this.ai]; if (!tgt || Math.hypot(tgt.x - v.x, tgt.z - v.z) < 4) { this.ai++; if (this.ai >= this.approach.length) this.phase = 'work'; return; } }
    else if (this.phase === 'work') {
      tgt = this.pts[this.i];
      if (!tgt) { this.finish(); return; }
      if (Math.hypot(tgt.x - v.x, tgt.z - v.z) < 3.5) { this.i++; return; }
    } else return;
    v.ghost = this.phase === 'work' || this.stuckN > 0;
    const desired = Math.atan2(tgt.x - v.x, tgt.z - v.z);
    const err = angleDiff(v.yaw, desired);
    const inField = v.x > this.field.x0 - 1 && v.x < this.field.x1 + 1 && v.z > this.field.z0 && v.z < this.field.z1;
    v.lowered = this.phase === 'work' && inField && Math.abs(err) < 0.5;
    const target = this.phase === 'approach' ? 6 : (v.lowered ? 2.8 : 1.6);
    const th = v.speed < target ? 1 : 0;
    v.update(dt, { throttle: Math.abs(err) > 1.4 ? 0.4 : th, steer: clamp(err * 2, -1, 1) });
    if (Math.abs(v.speed) < 0.3) { this.stuckT += dt; if (this.stuckT > 5) { this.stuckN = (this.stuckN || 0) + 1; if (this.phase === 'approach') this.ai++; else this.i++; this.stuckT = 0; v.speed = -1; } } else this.stuckT = 0;
    if (this.t > 300) this.finish();
  }
  finish() {
    const v = this.v; const f = this.field;
    // operator finishes the edges by hand
    for (let i = 0; i < f.n; i++) {
      if (this.op === 'harvest') { if (f.tiles[i] === 3) f.apply('harvest', i, { free: true }); }
      else f.apply(this.op, i, { free: v.aiFree, crop: v.sowCrop, item: this.op === 'spray' ? v.chem : this.op === 'fertilize' ? v.fert : null });
    }
    v.lowered = false; v.job = null; v.aiFree = false; v.ghost = false; this.done = true;
    if (this.o.onDone) this.o.onDone();
  }
}

// ---------------- particles ----------------
const FX = {
  max: 3000, n: 0, parts: [],
  init() {
    const g = new THREE.BufferGeometry();
    this.pos = new Float32Array(this.max * 3); this.col = new Float32Array(this.max * 4); this.size = new Float32Array(this.max);
    g.setAttribute('position', new THREE.BufferAttribute(this.pos, 3).setUsage(THREE.DynamicDrawUsage));
    g.setAttribute('aCol', new THREE.BufferAttribute(this.col, 4).setUsage(THREE.DynamicDrawUsage));
    g.setAttribute('aSize', new THREE.BufferAttribute(this.size, 1).setUsage(THREE.DynamicDrawUsage));
    g.setDrawRange(0, 0);
    const m = new THREE.ShaderMaterial({
      uniforms: Object.assign(THREE.UniformsUtils.clone(THREE.UniformsLib.fog), { uScale: { value: 400 } }),
      vertexShader: `attribute vec4 aCol; attribute float aSize; varying vec4 vCol; varying float vFogDepth; uniform float uScale;
        void main(){ vCol = aCol; vec4 mv = modelViewMatrix * vec4(position, 1.0); vFogDepth = -mv.z; gl_PointSize = aSize * uScale / max(0.5, -mv.z); gl_Position = projectionMatrix * mv; }`,
      fragmentShader: `varying vec4 vCol; varying float vFogDepth; uniform vec3 fogColor; uniform float fogDensity;
        void main(){ vec2 q = gl_PointCoord - 0.5; float d = dot(q,q); if (d > 0.25) discard; float a = vCol.a * smoothstep(0.25, 0.05, d);
          vec3 c = vCol.rgb; float ff = 1.0 - exp(-fogDensity*fogDensity*vFogDepth*vFogDepth); c = mix(c, fogColor, ff);
          gl_FragColor = vec4(c, a);
          #include <tonemapping_fragment>
          #include <colorspace_fragment>
        }`,
      transparent: true, depthWrite: false, fog: true,
    });
    this.mat = m;
    this.points = new THREE.Points(g, m); this.points.frustumCulled = false; this.points.renderOrder = 5;
    G.scene.add(this.points);
    this.geom = g;
  },
  TYPES: {
    dust: { c: [0.55, 0.45, 0.32], a: 0.5, s0: 0.6, s1: 3.2, life: 2.2, g: -0.1, drag: 1.2 },
    mud: { c: [0.2, 0.14, 0.08], a: 0.9, s0: 0.18, s1: 0.1, life: 0.9, g: 9, drag: 0.5 },
    smoke: { c: [0.16, 0.16, 0.17], a: 0.45, s0: 0.35, s1: 2.4, life: 2.6, g: -0.4, drag: 0.8 },
    chimney: { c: [0.55, 0.55, 0.58], a: 0.28, s0: 0.5, s1: 3.5, life: 7, g: -0.25, drag: 0.4 },
    spray: { c: [0.85, 0.9, 0.95], a: 0.35, s0: 0.25, s1: 1.1, life: 0.8, g: 1.5, drag: 1.5 },
    water: { c: [0.55, 0.7, 0.85], a: 0.7, s0: 0.12, s1: 0.18, life: 0.7, g: 9, drag: 0.2 },
    grain: { c: [0.9, 0.9, 0.85], a: 0.9, s0: 0.06, s1: 0.06, life: 0.6, g: 9, drag: 0.1 },
    chaff: { c: [0.85, 0.72, 0.4], a: 0.55, s0: 0.3, s1: 1.6, life: 2.5, g: -0.1, drag: 0.9 },
    petal: { c: [0.95, 0.5, 0.6], a: 0.95, s0: 0.1, s1: 0.1, life: 5, g: 0.6, drag: 1.4 },
    firefly: { c: [0.9, 1.0, 0.45], a: 1.0, s0: 0.1, s1: 0.1, life: 4, g: 0, drag: 0.6, glow: true },
    splash: { c: [0.8, 0.85, 0.9], a: 0.6, s0: 0.1, s1: 0.4, life: 0.35, g: 3, drag: 0 },
    spark: { c: [1.0, 0.8, 0.4], a: 1.0, s0: 0.2, s1: 0.05, life: 0.8, g: 2, drag: 0.5, glow: true },
  },
  emit(type, x, y, z, vx = 0, vy = 0, vz = 0, col = null) {
    if (this.parts.length >= this.max) return;
    const T = this.TYPES[type];
    this.parts.push({ T, x, y, z, vx, vy, vz, t: 0, life: T.life * (0.8 + frand() * 0.4), c: col || T.c, ph: frand() * TAU });
  },
  chaff(v) { if (frand() < 0.5 * G.preset.particles) { const c = Math.cos(v.yaw), s = Math.sin(v.yaw); this.emit('chaff', v.x - s * 3, v.y + 1.6, v.z - c * 3, -s * 2 + (frand() - 0.5), 0.5, -c * 2 + (frand() - 0.5)); } },
  update(dt) {
    const P = this.parts; let n = 0;
    const glowK = 1 + U.uGlow.value * 3;
    for (let i = 0; i < P.length; i++) {
      const p = P[i]; p.t += dt;
      if (p.t >= p.life) continue;
      const T = p.T;
      p.vx -= p.vx * T.drag * dt; p.vz -= p.vz * T.drag * dt; p.vy -= (p.vy * T.drag + T.g) * dt;
      p.x += p.vx * dt; p.y += p.vy * dt; p.z += p.vz * dt;
      if (T === this.TYPES.firefly) { p.x += Math.sin(p.t * 1.3 + p.ph) * dt * 0.6; p.z += Math.cos(p.t * 1.1 + p.ph) * dt * 0.6; }
      if (T === this.TYPES.petal) { p.x += Math.sin(p.t * 2 + p.ph) * dt * 0.8; }
      const k = p.t / p.life;
      const o = n * 3; this.pos[o] = p.x; this.pos[o + 1] = p.y; this.pos[o + 2] = p.z;
      const a = T.a * (k < 0.15 ? k / 0.15 : 1 - (k - 0.15) / 0.85) * (T === this.TYPES.firefly ? (0.5 + 0.5 * Math.sin(p.t * 5 + p.ph)) : 1);
      const lm = T.glow ? glowK * 2 : 0.35 + Sky.daylight * 0.75;
      this.col[n * 4] = p.c[0] * lm; this.col[n * 4 + 1] = p.c[1] * lm; this.col[n * 4 + 2] = p.c[2] * lm; this.col[n * 4 + 3] = a;
      this.size[n] = lerp(T.s0, T.s1, k);
      P[n] = p; n++;
    }
    P.length = n;
    this.geom.setDrawRange(0, n);
    this.geom.attributes.position.needsUpdate = true; this.geom.attributes.aCol.needsUpdate = true; this.geom.attributes.aSize.needsUpdate = true;
    this.mat.uniforms.uScale.value = window.innerHeight * Render.pr * 0.55;
  },
};
