// ============================================================================
// Instanced humanoid + animal rigs with procedural animation
// ============================================================================
const HPART_DEFS = [
  ['torso', 1], ['head', 1], ['hair', 1], ['bun', 1], ['eye', 2], ['stache', 1], ['bindi', 1],
  ['uarm', 2], ['farm', 2], ['thigh', 2], ['shin', 2], ['foot', 2], ['skirt', 1], ['pallu', 1], ['turban', 1], ['item', 1],
];
function hpartGeom(id) {
  let g;
  switch (id) {
    case 'torso': g = new THREE.CylinderGeometry(0.44, 0.5, 1, 8); g.translate(0, 0.5, 0); g.scale(1, 1, 0.62); break;
    case 'head': g = new THREE.IcosahedronGeometry(0.5, 1); break;
    case 'hair': g = new THREE.SphereGeometry(0.5, 10, 6, 0, TAU, 0, Math.PI * 0.56); break;
    case 'bun': case 'eye': case 'bindi': g = new THREE.IcosahedronGeometry(0.5, 0); break;
    case 'stache': g = new THREE.BoxGeometry(1, 1, 1); break;
    case 'uarm': case 'farm': case 'thigh': case 'shin': g = new THREE.BoxGeometry(1, 1, 1); g.translate(0, -0.5, 0); break;
    case 'foot': g = new THREE.BoxGeometry(1, 1, 1); g.translate(0, -0.5, 0.3); break;
    case 'skirt': g = new THREE.CylinderGeometry(0.4, 0.5, 1, 12); g.translate(0, -0.5, 0); break;
    case 'pallu': g = new THREE.BoxGeometry(1, 1, 1); break;
    case 'turban': g = new THREE.CylinderGeometry(0.5, 0.46, 1, 10); break;
    case 'item': g = new THREE.SphereGeometry(0.5, 10, 7); break;
  }
  return g;
}

const Humans = {
  max: 120, list: [], parts: {}, n: 0,
  init() {
    for (const [id, mult] of HPART_DEFS) {
      const m = new THREE.InstancedMesh(hpartGeom(id), MAT.char, this.max * mult);
      m.frustumCulled = false; m.castShadow = true; m.receiveShadow = true;
      m.count = 0;
      m.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
      this.parts[id] = { mesh: m, mult };
      G.scene.add(m);
    }
    this.zero = new THREE.Matrix4().makeScale(0, 0, 0);
  },
  appearance(o = {}) {
    const g = o.gender || (frand() < 0.5 ? 'm' : 'f');
    const age = o.age || 'adult';
    const a = { gender: g, age, skin: C(o.skin || pick(PALETTE.skin)), hair: C(age === 'elder' && frand() < 0.6 ? '#d8d3cc' : pick(PALETTE.hair.slice(0, 3))) };
    a.h = age === 'child' ? 0.62 + frand() * 0.12 : age === 'elder' ? 0.92 + frand() * 0.06 : 0.96 + frand() * 0.1;
    a.w = age === 'child' ? 0.9 : 0.92 + frand() * 0.2;
    if (g === 'm') {
      a.shirt = C(o.shirt || pick(PALETTE.shirtM));
      const lungi = o.lower || (age === 'child' ? 'shorts' : frand() < (age === 'elder' ? 0.8 : 0.45) ? 'lungi' : 'pants');
      a.lower = lungi;
      a.legs = lungi === 'pants' ? C(o.pants || pick(PALETTE.pants)) : lungi === 'shorts' ? C('#2c3550') : a.skin;
      a.skirtCol = lungi === 'lungi' ? C(o.lungi || pick(PALETTE.lungi)) : null;
      a.towel = age !== 'child' && frand() < 0.45 ? C(pick(PALETTE.towel)) : null;
      a.turban = o.turban !== undefined ? (o.turban ? C(pick(PALETTE.turban)) : null) : (age === 'elder' && frand() < 0.5 ? C(pick(PALETTE.turban)) : null);
      a.stache = age !== 'child' && frand() < 0.8;
      if (o.uniform) { a.shirt = C('#f4f4f0'); a.legs = C('#2c3550'); a.lower = 'shorts'; a.skirtCol = null; a.towel = null; }
    } else {
      a.saree = C(o.saree || pick(PALETTE.saree)); a.blouse = C(o.blouse || pick(PALETTE.blouse));
      a.lower = age === 'child' ? 'frock' : 'saree';
      a.shirt = age === 'child' ? a.saree : a.blouse;
      a.legs = a.skin; a.skirtCol = a.saree;
      a.bun = true; a.bindi = age !== 'child';
      if (o.uniform) { a.shirt = C('#f4f4f0'); a.skirtCol = C('#2c3550'); a.saree = a.skirtCol; }
    }
    return a;
  },
  create(app, x = 0, z = 0) {
    if (this.n >= this.max) return null;
    const h = { idx: this.n++, app, x, y: 0, z, yaw: 0, pose: 'idle', speed: 0, phase: frand() * TAU, visible: true, lean: 0, headYaw: 0, t: frand() * 10, anim: 0, carry: null, seatDrop: 0 };
    this.list.push(h);
    this.applyColors(h);
    for (const id in this.parts) this.parts[id].mesh.count = this.n * this.parts[id].mult;
    return h;
  },
  applyColors(h) {
    const a = h.app; const i = h.idx;
    const set = (id, k, c) => { const p = this.parts[id]; p.mesh.setColorAt(i * p.mult + k, c); p.mesh.instanceColor.needsUpdate = true; };
    set('torso', 0, a.shirt); set('head', 0, a.skin); set('hair', 0, a.hair); set('bun', 0, a.hair);
    set('eye', 0, C('#15100d')); set('eye', 1, C('#15100d')); set('stache', 0, a.hair); set('bindi', 0, C('#c0161b'));
    for (const k of [0, 1]) { set('uarm', k, a.gender === 'f' ? a.skin : a.shirt); set('farm', k, a.skin); set('thigh', k, a.lower === 'pants' ? a.legs : a.lower === 'shorts' ? a.legs : a.skin); set('shin', k, a.lower === 'pants' ? a.legs : a.skin); set('foot', k, C('#3a2a20')); }
    set('skirt', 0, a.skirtCol || a.shirt); set('pallu', 0, a.gender === 'f' ? (a.saree || a.shirt) : (a.towel || a.shirt)); set('turban', 0, a.turban || a.hair);
    set('item', 0, C('#b8862a'));
  },
  _M: [new THREE.Matrix4(), new THREE.Matrix4(), new THREE.Matrix4(), new THREE.Matrix4(), new THREE.Matrix4(), new THREE.Matrix4()],
  _T: new THREE.Matrix4(), _R: new THREE.Matrix4(), _S: new THREE.Matrix4(), _q: new THREE.Quaternion(), _p: new THREE.Vector3(), _s: new THREE.Vector3(),
  put(id, k, idx, m) { const p = this.parts[id]; p.mesh.setMatrixAt(idx * p.mult + k, m); },
  // child = parent * T(x,y,z) * R(rx, ry, rz)
  joint(out, parent, x, y, z, rx, ry = 0, rz = 0) {
    this._T.makeTranslation(x, y, z); out.multiplyMatrices(parent, this._T);
    if (rx || ry || rz) { _e1.set(rx, ry, rz, 'YXZ'); this._R.makeRotationFromEuler(_e1); out.multiply(this._R); }
    return out;
  },
  scaled(out, parent, sx, sy, sz, ox = 0, oy = 0, oz = 0) { out.copy(parent); if (ox || oy || oz) { this._T.makeTranslation(ox, oy, oz); out.multiply(this._T); } this._S.makeScale(sx, sy, sz); out.multiply(this._S); return out; },
  hide(h) { const i = h.idx; for (const id in this.parts) { const p = this.parts[id]; for (let k = 0; k < p.mult; k++) p.mesh.setMatrixAt(i * p.mult + k, this.zero); } },
  pose(h, dt) {
    const a = h.app;
    if (!h.visible) { if (!h._hidden) { this.hide(h); h._hidden = true; } return; }
    h._hidden = false;
    const [root, tor, tmp, jA, jB, jC] = this._M;
    const hs = a.h, ws = a.w;
    // gait params
    const sp = h.speed;
    const run = clamp01((sp - 2.6) / 2.5);
    const walkAmp = clamp01(sp / 1.4);
    if (sp > 0.05) h.phase += dt * (sp * (2.9 - run * 0.9) / hs + 0.5);
    h.t += dt;
    const ph = h.phase;
    let thL = 0, thR = 0, knL = 0, knR = 0, arL = 0, arR = 0, elL = -0.2, elR = -0.2, lean = 0, bob = 0, armOutL = 0.08, armOutR = -0.08, headP = 0, headY = h.headYaw || 0, pelvis = 0.93, sitting = false;
    switch (h.pose) {
      case 'walk': case 'run': case 'idle': default: {
        const amp = 0.5 + run * 0.35;
        thL = Math.sin(ph) * amp * walkAmp; thR = -thL;
        knL = Math.max(0, Math.sin(ph - 1.3)) * (0.7 + run * 0.6) * walkAmp; knR = Math.max(0, Math.sin(ph + Math.PI - 1.3)) * (0.7 + run * 0.6) * walkAmp;
        arL = -Math.sin(ph) * (0.45 + run * 0.4) * walkAmp; arR = -arL;
        elL = -0.25 - run * 0.9 - Math.max(0, Math.sin(ph)) * 0.2 * walkAmp; elR = -0.25 - run * 0.9 - Math.max(0, -Math.sin(ph)) * 0.2 * walkAmp;
        lean = run * 0.18 + walkAmp * 0.03;
        bob = Math.abs(Math.cos(ph)) * 0.035 * walkAmp + run * 0.02;
        if (sp < 0.05) { const br = Math.sin(h.t * 1.7) * 0.012; bob = br; arL = 0.04 + br; arR = -0.02 - br; }
        if (h.carry === 'pot') { arR = -2.9; elR = -0.4; armOutR = -0.35; }
        if (h.carry === 'stick') { arR = -0.5; elR = -0.9; }
        break;
      }
      case 'work': {
        const w = h.t * 3.2;
        lean = 0.95 + Math.sin(w) * 0.08;
        thL = -0.5; thR = -0.35; knL = 0.55; knR = 0.4; pelvis = 0.83;
        arL = -1.3 + Math.sin(w) * 0.45; arR = -1.1 - Math.sin(w) * 0.45; elL = -0.3; elR = -0.4;
        headP = -0.35;
        break;
      }
      case 'squat': { lean = 0.4; thL = thR = -1.9; knL = knR = 2.3; pelvis = 0.42; arL = -0.9 + Math.sin(h.t * 2.4) * 0.3; arR = -1.0; elL = elR = -0.6; headP = -0.3; break; }
      case 'sit': case 'drive': case 'ride': case 'cart': {
        sitting = true; pelvis = h.pose === 'ride' ? 0.0 : 0.0;
        thL = thR = h.pose === 'ride' ? -1.25 : -1.5; knL = knR = h.pose === 'ride' ? 1.35 : 1.5;
        if (h.pose === 'ride') { armOutL = 0.35; armOutR = -0.35; }
        if (h.pose === 'drive' || h.pose === 'ride') { arL = arR = -0.95; elL = elR = -0.5; lean = 0.12; }
        else if (h.pose === 'cart') { arL = arR = -0.7; elL = elR = -0.8; lean = 0.1; }
        else { arL = 0.15 + Math.sin(h.t * 0.9) * 0.05; arR = -0.2; elL = -0.6; elR = -0.9 + Math.sin(h.t * 1.3) * 0.2; lean = 0.05; }
        break;
      }
      case 'talk': { arR = -0.5 + Math.sin(h.t * 3) * 0.35; elR = -1.0; arL = 0.05; headP = Math.sin(h.t * 2) * 0.06; break; }
      case 'dance': { // Bathukamma circle: step-clap
        const w = h.t * 3.4;
        thL = Math.sin(w) * 0.3; thR = -thL; knL = Math.max(0, Math.sin(w)) * 0.5; knR = Math.max(0, -Math.sin(w)) * 0.5;
        const clap = Math.sin(w * 2) * 0.5 + 0.5;
        arL = arR = -1.2; armOutL = 0.25 + clap * 0.45; armOutR = -0.25 - clap * 0.45; elL = elR = -1.0;
        lean = 0.12 + Math.sin(w) * 0.05; bob = Math.abs(Math.sin(w)) * 0.05;
        break;
      }
      case 'wave': { arR = -2.6 + Math.sin(h.t * 8) * 0.3; elR = -0.3; armOutR = -0.3; break; }
      // ---- fun moves (Fun button) ----
      case 'namaste': { arL = arR = -0.45; armOutL = -0.42; armOutR = 0.42; elL = elR = -1.95; headP = 0.12; break; }
      case 'clap': { const c = Math.max(0, Math.sin(h.t * 13)); arL = arR = -1.2; elL = elR = -0.45; armOutL = -0.12 + c * 0.42; armOutR = -armOutL; bob = Math.abs(Math.sin(h.t * 6.5)) * 0.015; break; }
      case 'laugh': { const q = Math.sin(h.t * 20); lean = -0.2 + q * 0.03; headP = -0.35 + q * 0.06; arL = arR = -0.35; armOutL = -0.25; armOutR = 0.25; elL = elR = -1.7; bob = Math.abs(q) * 0.02; break; }
      case 'flex': { const q = Math.sin(h.t * 3) * 0.08; armOutL = 1.45 + q; armOutR = -1.45 - q; arL = arR = 0; elL = elR = -1.7; lean = -0.05; headY = Math.sin(h.t * 1.5) * 0.4; break; }
      case 'bhangra': {
        const w = h.t * 6.5, up = Math.max(0, Math.sin(w)), up2 = Math.max(0, -Math.sin(w));
        arL = arR = -2.75; armOutL = 0.45 + Math.sin(w * 2) * 0.12; armOutR = -armOutL; elL = elR = -0.35;
        thL = -up * 0.9; knL = up * 1.5; thR = -up2 * 0.9; knR = up2 * 1.5; bob = Math.abs(Math.sin(w)) * 0.07; headY = Math.sin(w) * 0.25;
        break;
      }
      case 'yoga': { const q = (Math.sin(h.t * 0.9) + 1) / 2; arL = arR = -3.0 + q * 0.2; armOutL = 0.05; armOutR = -0.05; elL = elR = 0; lean = q * 1.25; headP = q * 0.4; break; }
      case 'facepalm': { arR = -1.75; elR = -2.3; armOutR = 0.32; arL = 0.1; headP = 0.25; headY = Math.sin(h.t * 2.2) * 0.25; break; }
      case 'chicken': {
        const f = Math.abs(Math.sin(h.t * 11)), w = h.t * 7;
        arL = arR = 0.15; elL = elR = -2.7; armOutL = 0.25 + f * 0.6; armOutR = -armOutL;
        knL = Math.max(0, Math.sin(w)) * 0.6; knR = Math.max(0, -Math.sin(w)) * 0.6; headP = Math.sin(h.t * 9) * 0.25; lean = 0.15; bob = Math.abs(Math.sin(w)) * 0.03;
        break;
      }
      case 'selfie': { arR = -1.95; elR = -0.25; armOutR = 0.15; arL = -0.1; headY = 0.25; headP = -0.1; lean = -0.05; break; }
      case 'star': { armOutL = 1.5; armOutR = -1.5; arL = arR = 0; elL = elR = 0; thL = -0.25; thR = 0.25; break; }
      case 'joy': { arL = arR = -2.9; armOutL = 0.35; armOutR = -0.35; elL = elR = -0.1; break; }
      case 'groundsit': { sitting = true; thL = thR = -1.5; knL = knR = 2.5; arL = arR = -0.5; elL = elR = -0.6; armOutL = 0.2; armOutR = -0.2; lean = 0.05; break; }
      case 'sleep': { arL = arR = 0.05; armOutL = 0.15; armOutR = -0.15; elL = elR = -0.1; break; }
    }
    // root; lying down (nap), cartwheels and spins turn the whole body
    if (h.lie || h.roll || h.spin) {
      _e1.set(-(h.lie || 0) * Math.PI / 2, h.yaw + (h.spin || 0), h.roll || 0, 'YXZ'); this._q.setFromEuler(_e1);
      const piv = (h.roll ? 0.9 : 0.12) * hs;
      this._p.set(0, piv, 0).applyQuaternion(this._q);
      this._p.set(h.x - this._p.x, h.y + piv - this._p.y + (h.lie || 0) * 0.16 * hs + bob * hs, h.z - this._p.z);
    } else { this._q.setFromAxisAngle(UP, h.yaw); this._p.set(h.x, h.y + bob * hs, h.z); }
    this._s.set(hs, hs, hs);
    root.compose(this._p, this._q, this._s);
    const i = h.idx;
    // torso frame
    const pY = sitting ? 0.0 : pelvis;
    this.joint(tor, root, 0, pY, 0, lean, 0, 0);
    this.put('torso', 0, i, this.scaled(tmp, tor, 0.4 * ws, 0.56, 0.28 * ws));
    // skirt (lungi/saree/frock)
    const skirtLen = a.lower === 'saree' ? 0.86 : a.lower === 'lungi' ? 0.55 : a.lower === 'frock' ? 0.36 : 0;
    if (skirtLen > 0 && !sitting) this.put('skirt', 0, i, this.scaled(tmp, this.joint(jA, root, 0, pY + 0.06, 0, lean * 0.3 + (thL + thR) * 0.1), a.lower === 'saree' ? 0.42 * ws : 0.4 * ws, skirtLen, a.lower === 'saree' ? 0.36 * ws : 0.33 * ws));
    else if (skirtLen > 0) this.put('skirt', 0, i, this.scaled(tmp, this.joint(jA, root, 0, pY + 0.12, 0.12, -1.35), 0.42 * ws, Math.min(0.5, skirtLen), 0.36 * ws));
    else this.put('skirt', 0, i, this.zero);
    // pallu / towel across chest
    if (a.gender === 'f' && a.lower === 'saree') this.put('pallu', 0, i, this.scaled(tmp, this.joint(jA, tor, 0.02, 0.33, 0.1, 0, 0, 0.62), 0.12, 0.72, 0.03));
    else if (a.towel) this.put('pallu', 0, i, this.scaled(tmp, this.joint(jA, tor, -0.12 * ws, 0.44, 0, 0, 0, 0.1), 0.13, 0.26, 0.3 * ws));
    else this.put('pallu', 0, i, this.zero);
    // head
    this.joint(jA, tor, 0, 0.56 + 0.13, 0, headP, headY, 0);
    this.put('head', 0, i, this.scaled(tmp, jA, 0.22, 0.26, 0.23));
    this.put('hair', 0, i, this.scaled(tmp, jA, 0.24, 0.27, 0.25, 0, 0.01, -0.012));
    this.put('bun', 0, i, a.bun ? this.scaled(tmp, jA, 0.12, 0.12, 0.1, 0, 0.0, -0.13) : this.zero);
    // eyes, or sunglasses
    if (a.shades) { this.put('eye', 0, i, this.scaled(tmp, jA, 0.085, 0.05, 0.025, -0.055, 0.025, 0.108)); this.put('eye', 1, i, this.scaled(tmp, jA, 0.085, 0.05, 0.025, 0.055, 0.025, 0.108)); }
    else { this.put('eye', 0, i, this.scaled(tmp, jA, 0.035, 0.035, 0.02, -0.05, 0.02, 0.105)); this.put('eye', 1, i, this.scaled(tmp, jA, 0.035, 0.035, 0.02, 0.05, 0.02, 0.105)); }
    this.put('stache', 0, i, a.stache ? this.scaled(tmp, jA, 0.09, 0.022, 0.03, 0, -0.045, 0.105) : this.zero);
    this.put('bindi', 0, i, a.bindi ? this.scaled(tmp, jA, 0.022, 0.022, 0.012, 0, 0.065, 0.113) : this.zero);
    this.put('turban', 0, i, !a.turban ? this.zero : a.hat === 'cap' ? this.scaled(tmp, jA, 0.25, 0.075, 0.2, 0, 0.15, -0.01) : this.scaled(tmp, jA, 0.27, 0.1, 0.27, 0, 0.1, -0.005));
    this.put('item', 0, i, h.carry === 'pot' ? this.scaled(tmp, jA, 0.34, 0.3, 0.34, 0, 0.3, 0) : this.zero);
    // arms
    for (const [k, sx, ar, el, out] of [[0, -1, arL, elL, armOutL], [1, 1, arR, elR, armOutR]]) {
      this.joint(jB, tor, sx * 0.21 * ws, 0.52, 0, ar, 0, -out);
      this.put('uarm', k, i, this.scaled(tmp, jB, 0.085, 0.3, 0.085));
      this.joint(jC, jB, 0, -0.3, 0, el, 0, 0);
      this.put('farm', k, i, this.scaled(tmp, jC, 0.075, 0.3, 0.075));
    }
    // legs
    const hipY = sitting ? 0.0 : pY;
    for (const [k, sx, th, kn] of [[0, -1, thL, knL], [1, 1, thR, knR]]) {
      this.joint(jB, root, sx * 0.1 * ws, hipY, 0, sitting ? th : th, 0, 0);
      this.put('thigh', k, i, this.scaled(tmp, jB, 0.13 * ws, 0.45, 0.14 * ws));
      this.joint(jC, jB, 0, -0.45, 0, kn, 0, 0);
      this.put('shin', k, i, this.scaled(tmp, jC, 0.11, 0.45, 0.11));
      this.joint(jA, jC, 0, -0.45, 0, sitting ? -0.1 : -kn * 0.3, 0, 0);
      this.put('foot', k, i, this.scaled(tmp, jA, 0.1, 0.06, 0.22));
    }
  },
  update(dt, cam) {
    const hideD = Math.min(260, G.preset.drawDist * 0.62), farD = Math.min(140, G.preset.drawDist * 0.42);
    for (const h of this.list) {
      if (h.visible) {
        const d = Math.hypot(h.x - cam.x, h.z - cam.z);
        h.far = d > farD;
        if (d > hideD) { if (!h._hidden) { this.hide(h); h._hidden = true; } continue; }
        if (h.far && (G.frame + h.idx) % 4 !== 0) continue;
      }
      this.pose(h, h.far ? dt * 4 : dt);
    }
    for (const id in this.parts) uploadInstances(this.parts[id].mesh);
  },
};
// send only the used part of an instance buffer to the GPU
function uploadInstances(m) { const im = m.instanceMatrix; im.clearUpdateRanges(); im.addUpdateRange(0, Math.max(1, m.count) * 16); im.needsUpdate = true; }

// ---------------- animals ----------------
const APART_DEFS = [['body', 1], ['neck', 1], ['head', 1], ['snout', 1], ['ear', 2], ['horn', 2], ['hump', 1], ['leg', 4], ['tail', 1], ['comb', 1]];
function apartGeom(id) {
  let g;
  switch (id) {
    case 'body': case 'head': case 'hump': g = new THREE.IcosahedronGeometry(0.5, 1); break;
    case 'neck': g = new THREE.BoxGeometry(1, 1, 1); g.translate(0, 0.5, 0); break;
    case 'snout': g = new THREE.BoxGeometry(1, 1, 1); g.translate(0, 0, 0.5); break;
    case 'ear': g = new THREE.BoxGeometry(1, 1, 1); g.translate(0, 0.5, 0); break;
    case 'horn': g = new THREE.ConeGeometry(0.5, 1, 6); g.translate(0, 0.5, 0); break;
    case 'leg': case 'tail': g = new THREE.BoxGeometry(1, 1, 1); g.translate(0, -0.5, 0); break;
    case 'comb': g = new THREE.BoxGeometry(1, 1, 1); break;
  }
  return g;
}
const SPECIES = {
  cow: { L: 1.7, H: 1.25, W: 0.62, leg: 0.72, neck: 0.5, head: [0.3, 0.32, 0.45], snout: [0.2, 0.18, 0.2], ear: [0.18, 0.08, 0.02], horn: [0.06, 0.26], hump: [0.36, 0.3, 0.4], tail: 0.75, cols: ['#ece7dd', '#e3dccf', '#d9cdb8'], speed: 1.0, sound: 'moo' },
  bullock: { L: 1.9, H: 1.35, W: 0.68, leg: 0.78, neck: 0.55, head: [0.32, 0.34, 0.48], snout: [0.22, 0.2, 0.2], ear: [0.18, 0.08, 0.02], horn: [0.07, 0.45], hump: [0.44, 0.4, 0.5], tail: 0.8, cols: ['#ede8de', '#d9d0c0'], speed: 1.1, sound: 'moo', painted: true },
  buffalo: { L: 1.95, H: 1.28, W: 0.78, leg: 0.66, neck: 0.45, head: [0.34, 0.34, 0.52], snout: [0.24, 0.2, 0.2], ear: [0.2, 0.08, 0.02], horn: [0.09, 0.55], hump: null, tail: 0.7, cols: ['#2a2624', '#322c29', '#252120'], speed: 0.8, sound: 'moo', curvedHorns: true },
  goat: { L: 0.78, H: 0.66, W: 0.32, leg: 0.42, neck: 0.3, head: [0.16, 0.2, 0.28], snout: [0.1, 0.1, 0.1], ear: [0.12, 0.05, 0.02], horn: [0.03, 0.14], hump: null, tail: 0.18, cols: ['#6b4a32', '#2a2522', '#e8e2d6', '#8a6a4a'], speed: 1.3, sound: 'bleat', earsDown: true },
  sheep: { L: 0.85, H: 0.7, W: 0.46, leg: 0.4, neck: 0.25, head: [0.16, 0.2, 0.28], snout: [0.1, 0.1, 0.1], ear: [0.12, 0.05, 0.02], horn: null, hump: null, tail: 0.15, cols: ['#2e2a28', '#4a4440', '#d8d2c8', '#3a3431'], speed: 1.2, sound: 'bleat', wool: true, earsDown: true },
  dog: { L: 0.72, H: 0.58, W: 0.26, leg: 0.4, neck: 0.25, head: [0.16, 0.17, 0.22], snout: [0.1, 0.09, 0.14], ear: [0.08, 0.1, 0.02], horn: null, hump: null, tail: 0.3, cols: ['#b58352', '#c79a64', '#8a5a34', '#2a2420', '#d8c6a8'], speed: 2.2, sound: 'bark', tailUp: true },
  cat: { L: 0.42, H: 0.3, W: 0.16, leg: 0.2, neck: 0.12, head: [0.12, 0.11, 0.12], snout: [0.05, 0.04, 0.04], ear: [0.05, 0.06, 0.01], horn: null, hump: null, tail: 0.3, cols: ['#d8a060', '#3a3a3a', '#8a8a8a', '#e8e0d0'], speed: 1.4, sound: 'meow', tailUp: true },
  chicken: { L: 0.3, H: 0.32, W: 0.2, leg: 0.14, neck: 0.1, head: [0.09, 0.1, 0.1], snout: [0.03, 0.03, 0.05], ear: null, horn: null, hump: null, tail: 0.14, cols: ['#b85a2a', '#f0e8dc', '#6b3a1e', '#2a2420'], speed: 1.2, sound: 'cluck', biped: true, comb: true },
};
const Animals = {
  max: 200, list: [], parts: {}, n: 0,
  init() {
    for (const [id, mult] of APART_DEFS) {
      const m = new THREE.InstancedMesh(apartGeom(id), MAT.animal, this.max * mult);
      m.frustumCulled = false; m.castShadow = true; m.receiveShadow = true; m.count = 0;
      m.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
      this.parts[id] = { mesh: m, mult };
      G.scene.add(m);
    }
    this.zero = new THREE.Matrix4().makeScale(0, 0, 0);
  },
  create(sp, x, z, o = {}) {
    if (this.n >= this.max) return null;
    const S = SPECIES[sp];
    const a = { idx: this.n++, sp, S, x, z, y: 0, yaw: frand() * TAU, speed: 0, phase: frand() * TAU, pose: 'stand', t: frand() * 10, s: (o.s || 1) * (0.9 + frand() * 0.2), visible: true, col: C(o.col || pick(S.cols)), headDown: 0, tailWag: 0 };
    this.list.push(a);
    const set = (id, k, c) => { const p = this.parts[id]; p.mesh.setColorAt(a.idx * p.mult + k, c); };
    const dk = new THREE.Color(a.col.r * 0.8, a.col.g * 0.8, a.col.b * 0.8);
    set('body', 0, S.wool ? new THREE.Color(Math.min(1, a.col.r * 1.1), Math.min(1, a.col.g * 1.1), Math.min(1, a.col.b * 1.1)) : a.col); set('neck', 0, a.col); set('head', 0, sp === 'sheep' || sp === 'goat' ? dk : a.col); set('snout', 0, sp === 'chicken' ? C('#e0a020') : sp === 'buffalo' ? C('#1a1716') : C('#3a2e2a'));
    set('hump', 0, a.col); set('tail', 0, dk); set('comb', 0, C('#d32f2f'));
    const hornC = S.painted ? C(pick(['#d63b3b', '#2d6ca6', '#e2b81f', '#e07b22'])) : sp === 'buffalo' ? C('#3a3634') : C('#8a8278');
    for (const k of [0, 1]) { set('ear', k, dk); set('horn', k, hornC); }
    for (let k = 0; k < 4; k++) set('leg', k, sp === 'chicken' ? C('#e0a020') : k < 2 ? a.col : dk);
    for (const id in this.parts) { const p = this.parts[id]; p.mesh.count = this.n * p.mult; if (p.mesh.instanceColor) p.mesh.instanceColor.needsUpdate = true; }
    return a;
  },
  _M: [new THREE.Matrix4(), new THREE.Matrix4(), new THREE.Matrix4(), new THREE.Matrix4(), new THREE.Matrix4()],
  put(id, k, idx, m) { const p = this.parts[id]; p.mesh.setMatrixAt(idx * p.mult + k, m); },
  pose(a, dt) {
    const S = a.S, i = a.idx; const [root, body, tmp, j] = this._M;
    const H = Humans;
    a.t += dt;
    if (a.speed > 0.03) a.phase += dt * a.speed * (S.biped ? 9 : 5.5) / (S.L * a.s);
    const walk = clamp01(a.speed / (S.speed * 0.8));
    const lying = a.pose === 'lie';
    const legH = lying ? S.leg * 0.25 : S.leg;
    const bodyY = legH + S.W * 0.35 + (a.pose === 'lie' ? -0.02 : 0);
    H._q.setFromAxisAngle(UP, a.yaw); H._p.set(a.x, a.y, a.z); H._s.set(a.s, a.s, a.s);
    root.compose(H._p, H._q, H._s);
    const bob = Math.abs(Math.sin(a.phase)) * 0.03 * walk;
    H.joint(body, root, 0, bodyY + bob, 0, 0, 0, 0);
    this.put('body', 0, i, H.scaled(tmp, body, S.W * (S.wool ? 1.25 : 1), S.H - S.leg + (S.wool ? 0.1 : 0), S.L));
    // hump
    this.put('hump', 0, i, S.hump ? H.scaled(tmp, body, S.hump[0], S.hump[1], S.hump[2], 0, (S.H - S.leg) * 0.42, S.L * 0.28) : this.zero);
    // neck + head
    const graze = a.pose === 'graze' ? 1 : 0;
    const nod = Math.sin(a.phase * 2) * 0.08 * walk + Math.sin(a.t * 3) * 0.1 * graze;
    const neckAng = (S.biped ? -0.2 : 0.55) + graze * 1.35 + nod - (a.alert ? 0.4 : 0);
    H.joint(j, body, 0, (S.H - S.leg) * 0.15, S.L * 0.42, neckAng, a.headYaw || 0, 0);
    this.put('neck', 0, i, H.scaled(tmp, j, S.W * 0.42, S.neck, S.W * 0.42));
    H.joint(j, j, 0, S.neck, 0, 0.6 - graze * 0.4, 0, 0);
    this.put('head', 0, i, H.scaled(tmp, j, S.head[0], S.head[1], S.head[2], 0, 0, S.head[2] * 0.25));
    this.put('snout', 0, i, H.scaled(tmp, j, S.snout[0], S.snout[1], S.snout[2], 0, -S.head[1] * 0.15, S.head[2] * 0.62));
    this.put('comb', 0, i, S.comb ? H.scaled(tmp, j, 0.02, 0.06, 0.07, 0, S.head[1] * 0.55, 0.02) : this.zero);
    for (const [k, sx] of [[0, -1], [1, 1]]) {
      if (S.ear) { const m2 = this._M[4].copy(j); H.joint(m2, m2, sx * S.head[0] * 0.45, S.head[1] * 0.2, 0, 0, 0, sx * (S.earsDown ? 2.2 : 1.1)); this.put('ear', k, i, H.scaled(tmp, m2, S.ear[0], S.ear[1] * 2, S.ear[2] * 2 + 0.03)); } else this.put('ear', k, i, this.zero);
      if (S.horn) { const m2 = this._M[4].copy(j); H.joint(m2, m2, sx * S.head[0] * 0.35, S.head[1] * 0.4, -0.02, S.curvedHorns ? -1.2 : -0.2, 0, sx * (S.curvedHorns ? 1.3 : 0.5)); this.put('horn', k, i, H.scaled(tmp, m2, S.horn[0] * 2, S.horn[1], S.horn[0] * 2)); } else this.put('horn', k, i, this.zero);
    }
    // legs
    const legs = S.biped ? [[0, -1, 0.0], [1, 1, 0.0]] : [[0, -1, 0.36], [1, 1, 0.36], [2, -1, -0.36], [3, 1, -0.36]];
    for (let k = 0; k < 4; k++) {
      const L = legs[k];
      if (!L) { this.put('leg', k, i, this.zero); continue; }
      const phaseOff = S.biped ? (k === 0 ? 0 : Math.PI) : (k === 0 || k === 3 ? 0 : Math.PI);
      const sw = lying ? -1.5 : Math.sin(a.phase + phaseOff) * 0.5 * walk;
      H.joint(j, root, L[1] * S.W * 0.28, bodyY - (S.H - S.leg) * 0.1 + bob, L[2] * S.L, sw, 0, 0);
      this.put('leg', k, i, H.scaled(tmp, j, S.W * (S.biped ? 0.1 : 0.2), legH + (S.H - S.leg) * 0.1, S.W * (S.biped ? 0.1 : 0.2)));
    }
    // tail
    const wag = S.tailUp ? Math.sin(a.t * (a.happy ? 14 : 5)) * 0.4 : Math.sin(a.t * 1.3) * 0.15;
    H.joint(j, body, 0, (S.H - S.leg) * 0.2, -S.L * 0.48, S.tailUp ? -2.4 : 0.35, 0, wag);
    this.put('tail', 0, i, H.scaled(tmp, j, S.W * 0.1, S.tail, S.W * 0.1));
  },
  hide(a) { const i = a.idx; for (const id in this.parts) { const p = this.parts[id]; for (let k = 0; k < p.mult; k++) p.mesh.setMatrixAt(i * p.mult + k, this.zero); } },
  update(dt, cam) {
    const hideD = Math.min(220, G.preset.drawDist * 0.55);
    for (const a of this.list) {
      if (!a.visible) { if (!a._hidden) { this.hide(a); a._hidden = true; } continue; }
      const d = Math.hypot(a.x - cam.x, a.z - cam.z);
      if (d > hideD) { if (!a._hidden) { this.hide(a); a._hidden = true; } continue; }
      a._hidden = false;
      if (d > 110 && (G.frame + a.idx) % 4 !== 0) continue;
      this.pose(a, d > 110 ? dt * 4 : dt);
    }
    for (const id in this.parts) uploadInstances(this.parts[id].mesh);
  },
};

// ---------------- flying birds (egrets, crows, parakeets) ----------------
const Birds = {
  flocks: [], mesh: null, n: 0,
  init() {
    const body = new THREE.ConeGeometry(0.12, 0.5, 5); body.rotateX(Math.PI / 2);
    const wing = new THREE.BoxGeometry(0.55, 0.02, 0.22); wing.translate(0.275, 0, 0);
    this.max = 90;
    this.bodyM = new THREE.InstancedMesh(body, MAT.animal, this.max);
    this.wingM = new THREE.InstancedMesh(wing, MAT.animal, this.max * 2);
    for (const m of [this.bodyM, this.wingM]) { m.frustumCulled = false; m.castShadow = true; m.count = 0; G.scene.add(m); }
    const kinds = [['#f4f4ee', 14, 'egret'], ['#1e1e22', 12, 'crow'], ['#3fa34d', 8, 'parakeet'], ['#f4f4ee', 10, 'egret'], ['#1e1e22', 10, 'crow'], ['#6b5a4a', 12, 'myna']];
    let idx = 0;
    for (const [c, n, kind] of kinds) {
      const f = { cx: (frand() - 0.5) * 900, cz: (frand() - 0.5) * 900, r: 40 + frand() * 90, h: 18 + frand() * 25, sp: 0.12 + frand() * 0.1, a: frand() * TAU, birds: [], kind, tx: 0, tz: 0, timer: 0 };
      for (let i = 0; i < n && idx < this.max; i++, idx++) {
        f.birds.push({ i: idx, ox: (frand() - 0.5) * 12, oy: (frand() - 0.5) * 4, oz: (frand() - 0.5) * 12, ph: frand() * TAU });
        this.bodyM.setColorAt(idx, C(c)); this.wingM.setColorAt(idx * 2, C(c)); this.wingM.setColorAt(idx * 2 + 1, C(c));
      }
      this.flocks.push(f);
    }
    this.n = idx; this.bodyM.count = idx; this.wingM.count = idx * 2;
    this.bodyM.instanceColor.needsUpdate = true; this.wingM.instanceColor.needsUpdate = true;
  },
  update(dt) {
    const night = Sky.night > 0.6;
    const m = _m1, w = _m2, q = _q1, p = _v1, s = _v2.set(1, 1, 1);
    for (const f of this.flocks) {
      f.timer -= dt;
      if (f.timer <= 0) { f.timer = 20 + frand() * 40; f.cx = clamp(f.cx + (frand() - 0.5) * 400, -650, 650); f.cz = clamp(f.cz + (frand() - 0.5) * 400, -650, 650); }
      f.a += dt * f.sp * (night ? 0.3 : 1);
      const px = f.cx + Math.cos(f.a) * f.r, pz = f.cz + Math.sin(f.a) * f.r;
      f.tx = f.tx ? damp(f.tx, px, 0.3, dt) : px; f.tz = f.tz ? damp(f.tz, pz, 0.3, dt) : pz;
      const yaw = Math.atan2(-Math.sin(f.a), Math.cos(f.a));
      for (const b of f.birds) {
        const flap = Math.sin(G.t * (f.kind === 'egret' ? 7 : 11) + b.ph) * 0.7;
        const gy = World.groundHeight(f.tx + b.ox, f.tz + b.oz);
        p.set(f.tx + b.ox, (night ? -50 : gy + f.h + b.oy + Math.sin(G.t * 0.5 + b.ph) * 1.5), f.tz + b.oz);
        q.setFromEuler(_e1.set(0, yaw, 0, 'YXZ'));
        m.compose(p, q, s); this.bodyM.setMatrixAt(b.i, m);
        for (const sg of [1, -1]) {
          _q2.setFromEuler(_e1.set(0, sg > 0 ? 0 : Math.PI, flap, 'YXZ'));
          w.compose(p, q, s); _m3.makeRotationFromQuaternion(_q2); w.multiply(_m3);
          this.wingM.setMatrixAt(b.i * 2 + (sg > 0 ? 0 : 1), w);
        }
      }
    }
    this.bodyM.instanceMatrix.needsUpdate = true; this.wingM.instanceMatrix.needsUpdate = true;
  },
};
