// ============================================================================
// Fields: tile grid, ground canvas, instanced crops with growth shader, crop model
// ============================================================================
const CROP_VS_HEAD = `attribute float aPart; attribute float aRand; attribute vec2 aCtr; varying float vPart; varying float vRand; uniform float uGrowth;`;
const CROP_VS = `
  vPart = aPart; vRand = aRand;
  {
    float g = uGrowth;
    float hs = mix(0.12, 1.0, smoothstep(0.0, 0.82, g));
    float ws = mix(0.32, 1.0, smoothstep(0.0, 0.6, g));
    transformed.y *= hs;
    transformed.xz = aCtr + (transformed.xz - aCtr) * ws;
    vec3 ip = vec3(0.0);
    #ifdef USE_INSTANCING
      ip = instanceMatrix[3].xyz;
    #endif
    float sw = transformed.y * (0.05 + uWindStr * 0.22) * (0.55 + 0.45 * sin(uTime * 2.1 + ip.x * 0.33 + ip.z * 0.27 + aRand * 2.0));
    transformed.x += sw * (uWind.x * 2.2 + 0.25);
    transformed.z += sw * (uWind.y * 2.2 + 0.15);
  }
`;
const CROP_FS_HEAD = `varying float vPart; varying float vRand; uniform float uGrowth, uHealth, uRipe, uDry; uniform vec3 uLeafRipe, uFruitA, uFruitB;`;
const CROP_FS = `
  {
    float fruitVis = smoothstep(0.5, 0.85, uGrowth);
    if (vPart > 0.5 && vRand > fruitVis) discard;
    vec3 leaf = mix(diffuseColor.rgb, uLeafRipe, uRipe * 0.9);
    leaf = mix(leaf, vec3(0.42, 0.36, 0.2), uDry);
    leaf = mix(leaf, vec3(0.55, 0.48, 0.2), (1.0 - uHealth) * 0.65);
    vec3 fruit = mix(uFruitA, uFruitB, smoothstep(0.72, 1.0, uGrowth));
    diffuseColor.rgb = (vPart > 0.5 ? fruit : leaf) * (0.84 + 0.32 * vRand);
  }
`;

// ---------- crop geometry ----------
function cropGeometry(crop, detail) {
  const P = [], N = [], Cl = [], Pa = [], Rn = [], Ct = [];
  const R = mulberry32(55 + CROP_IDS.indexOf(crop) * 13 + detail);
  const r = () => R();
  const tri = (a, b, c, col, part, rnd, cx, cz) => {
    const ux = b[0] - a[0], uy = b[1] - a[1], uz = b[2] - a[2], vx = c[0] - a[0], vy = c[1] - a[1], vz = c[2] - a[2];
    let nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx; const l = Math.hypot(nx, ny, nz) || 1; nx /= l; ny /= l; nz /= l;
    if (ny < 0) { nx = -nx; ny = -ny; nz = -nz; }
    for (const p of [a, b, c]) { P.push(p[0], p[1], p[2]); N.push(nx, ny * 0.6 + 0.4, nz); Cl.push(col.r, col.g, col.b); Pa.push(part); Rn.push(rnd); Ct.push(cx, cz); }
  };
  const prim = (pr, m, col, part, rnd, cx, cz) => {
    const tmp = new THREE.Vector3(); const nm = new THREE.Matrix3().getNormalMatrix(m);
    for (let i = 0; i < pr.count; i++) {
      tmp.set(pr.pos[i * 3], pr.pos[i * 3 + 1], pr.pos[i * 3 + 2]).applyMatrix4(m); P.push(tmp.x, tmp.y, tmp.z);
      tmp.set(pr.nor[i * 3], pr.nor[i * 3 + 1], pr.nor[i * 3 + 2]).applyMatrix3(nm).normalize(); N.push(tmp.x, tmp.y, tmp.z);
      Cl.push(col.r, col.g, col.b); Pa.push(part); Rn.push(rnd); Ct.push(cx, cz);
    }
  };
  const M = (x, y, z, sx, sy, sz, ry = 0, rx = 0, rz = 0) => new THREE.Matrix4().compose(new THREE.Vector3(x, y, z), new THREE.Quaternion().setFromEuler(new THREE.Euler(rx, ry, rz, 'YXZ')), new THREE.Vector3(sx, sy, sz));
  const cd = CROPS[crop];
  const leaf = C(cd.leaf), fruit = C('#ffffff');
  const shade = (c, k) => new THREE.Color(c.r * k, c.g * k, c.b * k);
  const blade = (bx, bz, h, lean, a, w, col, part = 0, rnd = r()) => {
    const dx = Math.cos(a), dz = Math.sin(a), px = -dz * w, pz = dx * w;
    tri([bx - px, 0, bz - pz], [bx + px, 0, bz + pz], [bx + dx * lean, h, bz + dz * lean], col, part, rnd, bx, bz);
  };
  if (crop === 'paddy') {
    const n = [2, 3, 4][detail], nb = [4, 5, 6][detail];
    for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) {
      const cx = (i + 0.5) / n * 2 - 1 + (r() - 0.5) * 0.15, cz = (j + 0.5) / n * 2 - 1 + (r() - 0.5) * 0.15;
      for (let k = 0; k < nb; k++) { const a = r() * TAU, h = 0.7 + r() * 0.3; blade(cx + Math.cos(a) * 0.03, cz + Math.sin(a) * 0.03, h, 0.12 + r() * 0.2, a, 0.022, shade(leaf, 0.85 + r() * 0.3)); }
      for (let k = 0; k < 2; k++) { const a = r() * TAU; const rr = r(); const tx = cx + Math.cos(a) * 0.18, tz = cz + Math.sin(a) * 0.18;
        tri([cx + Math.cos(a) * 0.05, 0.78, cz + Math.sin(a) * 0.05], [tx + Math.cos(a + 1.6) * 0.03, 0.72, tz + Math.sin(a + 1.6) * 0.03], [tx + Math.cos(a) * 0.12, 0.52, tz + Math.sin(a) * 0.12], fruit, 1, rr, cx, cz);
        tri([cx + Math.cos(a) * 0.05, 0.78, cz + Math.sin(a) * 0.05], [tx + Math.cos(a) * 0.12, 0.52, tz + Math.sin(a) * 0.12], [tx - Math.cos(a + 1.6) * 0.03, 0.72, tz - Math.sin(a + 1.6) * 0.03], fruit, 1, rr, cx, cz); }
    }
  } else if (crop === 'cotton' || crop === 'chilli' || crop === 'groundnut' || crop === 'tomato') {
    const cfg = {
      cotton: { n: [1, 2, 2][detail], h: 1.05, blobs: 3, br: 0.3, fr: [3, 5, 7][detail], fs: 0.09, fy: [0.5, 1.0] },
      chilli: { n: [1, 2, 2][detail], h: 0.62, blobs: 3, br: 0.24, fr: [4, 6, 8][detail], fs: 0.055, fy: [0.25, 0.6] },
      groundnut: { n: [2, 3, 3][detail], h: 0.32, blobs: 2, br: 0.22, fr: [2, 3, 4][detail], fs: 0.04, fy: [0.2, 0.32] },
      tomato: { n: [1, 2, 2][detail], h: 0.85, blobs: 3, br: 0.27, fr: [3, 4, 6][detail], fs: 0.075, fy: [0.3, 0.7] },
    }[crop];
    for (let i = 0; i < cfg.n; i++) for (let j = 0; j < cfg.n; j++) {
      const cx = (i + 0.5) / cfg.n * 2 - 1 + (r() - 0.5) * 0.2, cz = (j + 0.5) / cfg.n * 2 - 1 + (r() - 0.5) * 0.2;
      if (crop === 'tomato') prim(PRIM.box, M(cx + 0.12, cfg.h * 0.55, cz, 0.03, cfg.h * 1.1, 0.03), C('#8a6a45'), 0, r(), cx, cz);
      prim(PRIM.box, M(cx, cfg.h * 0.3, cz, 0.04, cfg.h * 0.6, 0.04), shade(leaf, 0.7), 0, r(), cx, cz);
      for (let k = 0; k < cfg.blobs; k++) {
        const a = r() * TAU, d = r() * cfg.br * 0.6;
        prim(detail ? PRIM.ico0 : PRIM.oct, M(cx + Math.cos(a) * d, cfg.h * (0.45 + r() * 0.45), cz + Math.sin(a) * d, cfg.br * 2 * (0.8 + r() * 0.4), cfg.br * 1.6 * (0.8 + r() * 0.4), cfg.br * 2 * (0.8 + r() * 0.4), r() * TAU), shade(leaf, 0.8 + r() * 0.35), 0, r(), cx, cz);
      }
      for (let k = 0; k < cfg.fr; k++) {
        const a = r() * TAU, d = cfg.br * (0.6 + r() * 0.7);
        const y = cfg.h * lerp(cfg.fy[0], cfg.fy[1], r());
        const s = cfg.fs * (0.8 + r() * 0.5);
        prim(crop === 'chilli' ? PRIM.cone6 : PRIM.ico0, M(cx + Math.cos(a) * d, y, cz + Math.sin(a) * d, s * 1.6, crop === 'chilli' ? s * 3.5 : s * 1.8, s * 1.6, r() * TAU, crop === 'chilli' ? Math.PI : 0), fruit, 1, r(), cx, cz);
      }
    }
  } else if (crop === 'maize') {
    const n = [1, 2, 2][detail];
    for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) {
      const cx = (i + 0.5) / n * 2 - 1 + (r() - 0.5) * 0.15, cz = (j + 0.5) / n * 2 - 1 + (r() - 0.5) * 0.15;
      const h = 1.9 + r() * 0.4;
      prim(PRIM.cyl6, M(cx, h / 2, cz, 0.05, h, 0.05), shade(leaf, 0.8), 0, r(), cx, cz);
      const nl = [4, 6, 7][detail];
      for (let k = 0; k < nl; k++) {
        const a = k * 2.4 + r() * 0.5, y = 0.35 + k / nl * (h - 0.6), L = 0.55 + r() * 0.2;
        const dx = Math.cos(a), dz = Math.sin(a);
        const mid = [cx + dx * L * 0.6, y + 0.22, cz + dz * L * 0.6];
        const tip = [cx + dx * L, y - 0.05, cz + dz * L];
        const px = -dz * 0.06, pz = dx * 0.06;
        const col = shade(leaf, 0.85 + r() * 0.3);
        tri([cx, y, cz], [mid[0] + px, mid[1], mid[2] + pz], [mid[0] - px, mid[1], mid[2] - pz], col, 0, r(), cx, cz);
        tri([mid[0] + px, mid[1], mid[2] + pz], tip, [mid[0] - px, mid[1], mid[2] - pz], col, 0, r(), cx, cz);
      }
      for (let k = 0; k < 3; k++) blade(cx, cz, 0.35, 0.12, r() * TAU, 0.015, C('#c9b86a'), 0, r());
      prim(PRIM.cyl6, M(cx, h + 0.15, cz, 0.02, 0.3, 0.02), C('#c9b86a'), 0, r(), cx, cz);
      const cobRnd = r() * 0.6;
      prim(PRIM.ico0, M(cx + 0.09, h * 0.52, cz, 0.1, 0.3, 0.1, 0, 0, 0.35), fruit, 1, cobRnd, cx, cz);
      if (detail > 0) prim(PRIM.ico0, M(cx - 0.08, h * 0.45, cz + 0.05, 0.09, 0.26, 0.09, 0, 0, -0.35), fruit, 1, cobRnd + 0.3, cx, cz);
    }
  } else if (crop === 'turmeric') {
    const n = [1, 2, 2][detail];
    for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) {
      const cx = (i + 0.5) / n * 2 - 1 + (r() - 0.5) * 0.2, cz = (j + 0.5) / n * 2 - 1 + (r() - 0.5) * 0.2;
      const nl = [4, 6, 7][detail];
      for (let k = 0; k < nl; k++) {
        const a = k / nl * TAU + r() * 0.4, h = 0.75 + r() * 0.35, L = 0.35;
        const dx = Math.cos(a), dz = Math.sin(a), px = -dz * 0.1, pz = dx * 0.1;
        const col = shade(leaf, 0.85 + r() * 0.3);
        const base = [cx + dx * 0.03, 0.1, cz + dz * 0.03], mid = [cx + dx * L * 0.5, h * 0.75, cz + dz * L * 0.5], tip = [cx + dx * L, h, cz + dz * L];
        tri(base, [mid[0] + px, mid[1], mid[2] + pz], [mid[0] - px, mid[1], mid[2] - pz], col, 0, r(), cx, cz);
        tri([mid[0] + px, mid[1], mid[2] + pz], tip, [mid[0] - px, mid[1], mid[2] - pz], col, 0, r(), cx, cz);
      }
      prim(PRIM.cone6, M(cx, 0.9, cz, 0.08, 0.18, 0.08), fruit, 1, r(), cx, cz);
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3));
  g.setAttribute('normal', new THREE.Float32BufferAttribute(N, 3));
  g.setAttribute('color', new THREE.Float32BufferAttribute(Cl, 3));
  g.setAttribute('aPart', new THREE.Float32BufferAttribute(Pa, 1));
  g.setAttribute('aRand', new THREE.Float32BufferAttribute(Rn, 1));
  g.setAttribute('aCtr', new THREE.Float32BufferAttribute(Ct, 2));
  g.computeBoundingSphere();
  return g;
}

function makeCropMaterial(fu) {
  const m = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.82, metalness: 0, side: THREE.DoubleSide });
  patchMaterial(m, 'std', {
    key: 'crop', noWet: true,
    uniforms: fu,
    vsHead: CROP_VS_HEAD, vsBegin: CROP_VS,
    fsHead: CROP_FS_HEAD, color: CROP_FS,
  });
  return m;
}
function makeCropDepthMaterial(fu) {
  const m = new THREE.MeshDepthMaterial({ depthPacking: THREE.RGBADepthPacking });
  m.onBeforeCompile = (sh) => {
    Object.assign(sh.uniforms, U, fu);
    sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\n' + GLSL_NOISE + CROP_VS_HEAD).replace('#include <begin_vertex>', '#include <begin_vertex>\n' + CROP_VS);
  };
  m.customProgramCacheKey = () => 'tvs-cropdepth';
  return m;
}

// ---------- Field class ----------
const SOIL_COL = { red: ['#8e4527', '#7c3b22', '#a4582f'], black: ['#2f2823', '#3a312a', '#46392f'] };
// average colours of the field textures, for the far-away field quads
const FAR_COL = { r0: col('#8f5d3d'), r0s: col('#9a7550'), b0: col('#473c33'), b0s: col('#5a5040'), r1: col('#86452a'), b1: col('#3e352d'), r2: col('#7f3d22'), b2: col('#2b2520'), weed: col('#5f8f36') };
const _farC = new THREE.Color(), _farC2 = new THREE.Color(), _farC3 = new THREE.Color();
class Field {
  constructor(r) {
    Object.assign(this, r);
    this.tx = Math.round(this.w / TILE); this.tz = Math.round(this.d / TILE); this.n = this.tx * this.tz;
    this.tiles = new Uint8Array(this.n);
    this.stamp = { fert: new Float32Array(this.n).fill(-1e9), spray: new Float32Array(this.n).fill(-1e9), weed: new Float32Array(this.n).fill(-1e9), water: new Float32Array(this.n).fill(-1e9) };
    this.owner = 'npc'; this.avail = null; this.leaseUntil = 0;
    this.crop = null; this.growth = 0; this.water = 45; this.nut = 45; this.weeds = 6; this.pests = 0; this.health = 100; this.soilHealth = 70;
    this.outbreak = false; this.overHrs = 0; this.poorPrep = 0; this.damage = 0; this.sownTiles = 0; this.insured = false;
    this.pump = false; this.gate = false; this.borewell = false;
    this.heap = null; this.plannedCrop = null; this.npcPhase = 'fallow'; this.npcTimer = 0; this.npcCrop = null;
    this.dirty = new Set(); this.allDirty = true; this.cropDirty = true; this.wasStubble = true;
    this.fu = {
      uGrowth: { value: 0 }, uHealth: { value: 1 }, uRipe: { value: 0 }, uDry: { value: 0 },
      uLeafRipe: { value: new THREE.Color() }, uFruitA: { value: new THREE.Color() }, uFruitB: { value: new THREE.Color() },
    };
  }
  tileAt(x, z) { const ix = Math.floor((x - this.x0) / TILE), iz = Math.floor((z - this.z0) / TILE); if (ix < 0 || iz < 0 || ix >= this.tx || iz >= this.tz) return -1; return iz * this.tx + ix; }
  tileCenter(i) { const ix = i % this.tx, iz = Math.floor(i / this.tx); return { x: this.x0 + ix * TILE + TILE / 2, z: this.z0 + iz * TILE + TILE / 2 }; }
  count(state) { let c = 0; for (let i = 0; i < this.n; i++) if (this.tiles[i] === state) c++; return c; }
  countMin(state) { let c = 0; for (let i = 0; i < this.n; i++) if (this.tiles[i] >= state) c++; return c; }
  get isPlayer() { return this.owner === 'player' || this.owner === 'lease'; }
  stageName() { if (!this.crop) return null; let s = STAGES[0]; for (const st of STAGES) if (this.growth >= st.at - 1e-6) s = st; return s; }
  setTile(i, v) { if (this.tiles[i] === v) return; const was = this.tiles[i]; this.tiles[i] = v; this.dirty.add(i); this.ver = (this.ver || 0) + 1; if (was === 3 || v === 3) this.cropDirty = true; }
  // ---- farming operation on a tile; returns true if something changed
  apply(op, i, o = {}) {
    const t = this.tiles[i]; const now = Time.totalHours();
    switch (op) {
      case 'plough': if (t === 0) { this.setTile(i, 1); return true; } return false;
      case 'cultivate': if (t === 0 || t === 1) { this.setTile(i, t + 1); return true; } return false;
      case 'rotavate': if (t === 0 || t === 1) { this.setTile(i, 2); return true; } return false;
      case 'sow': {
        if (t !== 1 && t !== 2) return false;
        const crop = o.crop; if (!crop) return false;
        if (this.crop && this.crop !== crop && this.sownTiles > 0) return false;
        if (!o.free && !Inv.take('seed_' + crop, 1 / (this.acres > 0 ? this.n / this.acres : 144))) return false;
        if (!this.crop || this.sownTiles === 0) this.startCrop(crop);
        if (t === 1) this.poorPrep++;
        this.setTile(i, 3); this.sownTiles++;
        return true;
      }
      case 'fertilize': {
        if (t === 0 || now - this.stamp.fert[i] < 10) return false;
        const it = ITEMS[o.item]; if (!it) return false;
        const perTile = 1 / (this.n / Math.max(0.1, this.acres));
        if (!o.free && !Inv.take(o.item, perTile)) return false;
        this.stamp.fert[i] = now;
        if (G.S && this.isPlayer) G.S._lastFert = o.item;
        this.nut = Math.min(100, this.nut + it.nut / this.n);
        if (it.soil) this.soilHealth = Math.min(100, this.soilHealth + it.soil / this.n);
        return true;
      }
      case 'spray': case 'weed': {
        const key = op === 'weed' ? 'weed' : 'spray';
        if (now - this.stamp[key][i] < 8) return false;
        if (op === 'spray') {
          if (t !== 3 && o.item === 'pesticide') return false;
          if (!o.free && !Inv.take(o.item, 1 / (this.n / Math.max(0.1, this.acres)))) return false;
        } else if (t < 1) return false;
        this.stamp[key][i] = now;
        const base = Math.max(1, op === 'spray' && o.item === 'pesticide' ? this.sownTiles : this.countMin(1));
        if (op === 'spray' && o.item === 'pesticide') { this.pests = Math.max(0, this.pests - 95 / base); if (this.pests < 12) this.outbreak = false; }
        else this.weeds = Math.max(0, this.weeds - (op === 'weed' ? 80 : 95) / base);
        if (op === 'spray' && !G.S.flags.safety && !o.free && o.byPlayer) Player.hurt(0.05, 'spray');
        return true;
      }
      case 'water': {
        if (now - this.stamp.water[i] < 3) return false;
        this.stamp.water[i] = now; this.water = Math.min(100, this.water + 70 / this.n); return true;
      }
      case 'harvest': {
        if (t !== 3 || this.growth < 0.97 || !this.crop) return false;
        if (this.heap && this.heap.crop !== this.crop && this.heap.qty > 0.05) { if (o.byPlayer) UI.toastOnce('heapblock', L('Clear the old heap at this field first.', 'ముందు ఈ పొలం దగ్గర ఉన్న పాత కుప్పను తరలించండి.'), 'warn'); return false; }
        const q = this.yieldPerTile();
        if (!this.heap) this.heap = { crop: this.crop, qty: 0, q: 0 };
        const tot = this.heap.qty + q.qty; this.heap.q = tot > 0 ? (this.heap.q * this.heap.qty + q.quality * q.qty) / tot : q.quality; this.heap.qty = tot;
        this.heap.crop = this.crop;
        this.setTile(i, 0); this.sownTiles = Math.max(0, this.sownTiles - 1);
        this.heapDirty = true;
        if (this.isPlayer) { G.S.stats.harvestQ = (G.S.stats.harvestQ || 0) + q.qty; Bus.emit('harvestTile', { field: this, crop: this.crop, qty: q.qty }); }
        if (this.sownTiles === 0) this.endCrop();
        return true;
      }
    }
    return false;
  }
  startCrop(crop) {
    this.crop = crop; this.growth = 0; this.health = 100; this.overHrs = 0; this.poorPrep = 0; this.damage = 0; this.outbreak = false; this.pests = 0;
    this.sownAt = Time.totalHours();
    const cd = CROPS[crop];
    this.fu.uLeafRipe.value.set(cd.ripe); this.fu.uFruitA.value.set(cd.fruit); this.fu.uFruitB.value.set(cd.fruitRipe);
    this.meshDirty = true;
    if (this.isPlayer) Bus.emit('sowStart', { field: this, crop });
  }
  endCrop() {
    const c = this.crop;
    this.crop = null; this.growth = 0; this.sownTiles = 0; this.outbreak = false; this.pests = 0; this.cropDirty = true;
    this.nut = Math.max(10, this.nut - 8);
    if (this.isPlayer) Bus.emit('fieldHarvested', { field: this, crop: c });
  }
  yieldPerTile() {
    const cd = CROPS[this.crop];
    const hf = Math.pow(clamp01(this.health / 100), 1.25);
    const soil = cd.soil[this.soil] || 1;
    const season = cd.season[Time.season()] || 1;
    const prep = this.sownTiles + this.poorPrep > 0 ? 1 - 0.15 * (this.poorPrep / Math.max(1, this.countMin(3) + this.poorPrep)) : 1;
    const sh = 0.88 + 0.12 * (this.soilHealth / 100);
    const gh = this.greenhouse && this.crop === 'tomato' ? 1.4 : 1;
    const perTile = cd.yield * this.acres / this.n;
    const qty = perTile * hf * soil * season * prep * sh * gh * (0.94 + frand() * 0.1);
    const quality = this.health >= 85 ? 1.05 : this.health >= 60 ? 1.0 : this.health >= 35 ? 0.88 : 0.75;
    return { qty, quality };
  }
  // ---- per game-minute simulation ----
  simulate(hrs, W) {
    const cd = this.crop ? CROPS[this.crop] : null;
    const temp = Weather.temp;
    const heat = W.id === 'heatwave' ? 1.7 : 1;
    const evapK = (0.55 + Math.max(0, temp - 26) * 0.045) * heat * (1 + W.wind * 0.25) * (1 - W.cloud * 0.35);
    // easy mode: the player's crops dry out, get weedy and catch pests about half as fast
    const ez = this.isPlayer && G.S && G.S.easy ? 0.5 : 1;
    if (this.greenhouse) { this.water -= (cd ? cd.water * 0.7 : 0.4) * hrs * ez; }
    else {
      this.water -= (cd && this.sownTiles > 0 ? cd.water * evapK : 0.5 * evapK) * hrs * ez;
      this.water += W.rain * 15 * hrs;
    }
    // irrigation
    if (this.pump && this.borewell) {
      const powerOk = !Weather.powerCut || G.S.up.solarPump;
      const gw = G.S.world.groundwater / 100;
      if (powerOk && (gw > 0.08 || G.S.up.farmPond)) {
        const rate = 34 / Math.pow(Math.max(0.5, this.acres), 0.8) * (G.S.up.waterTank ? 1.25 : 1) * (G.S.up.solarPump ? 1.2 : 1) * Math.max(0.35, gw);
        this.water += rate * hrs; G.S.world.groundwater = Math.max(0, G.S.world.groundwater - 0.35 * hrs * (G.S.up.farmPond ? 0.5 : 1));
        Stats.pumpHrs += hrs;
      }
      if (this.water >= 99) { this.pump = false; if (this.isPlayer) UI.toast(L(`${this.label()}: pump switched off, field is full.`, `${this.label()}: పొలం నిండింది, మోటార్ ఆపేశాం.`), 'info'); }
    }
    if (this.gate && this.canal) {
      if (Weather.canalFlowing()) this.water += 42 / Math.pow(Math.max(0.5, this.acres), 0.8) * hrs;
      if (this.water >= 99) this.gate = false;
    }
    this.water = clamp(this.water, 0, 100);
    if (this.countMin(1) > 0 || this.crop) this.weeds = Math.min(100, this.weeds + (0.36 + W.rain * 0.6 + (this.nut > 60 ? 0.15 : 0)) * hrs * (this.greenhouse ? 0.3 : 1) * ez);
    if (!cd || this.sownTiles === 0) { this.nut = Math.min(55, this.nut + 0.05 * hrs); return; }
    // nutrients
    if (this.growth < 1) this.nut = Math.max(0, this.nut - cd.nut * 0.5 * hrs);
    // pests
    if (!this.outbreak && this.growth > 0.12 && this.growth < 1) {
      const hum = W.rain > 0.2 ? 1.8 : W.cloud > 0.6 ? 1.3 : 1;
      const p = 0.0052 * cd.pest * hum * (1 + this.weeds / 90) * hrs * (this.greenhouse ? 0.3 : 1) * (G.S.flags.pestEvent === this.crop ? 3 : 1) * (ez < 1 ? 0.4 : 1);
      if (frand() < p) { this.outbreak = true; if (this.isPlayer) { UI.toast(L(`${LN(cd.pestName)} attack in ${this.label()}! Spray pesticide soon.`, `${this.label()}లో ${LN(cd.pestName)} దాడి! త్వరగా పురుగుమందు పిచికారీ చేయండి.`), 'bad'); Audio2.sfx('alert'); Bus.emit('pestOutbreak', { field: this }); } }
    }
    if (this.outbreak) this.pests = Math.min(100, this.pests + 2.6 * hrs * cd.pest);
    else this.pests = Math.max(0, this.pests - 0.4 * hrs);
    // growth
    let fw;
    if (this.water < cd.wLo) fw = lerp(0.12, 1, this.water / cd.wLo);
    else if (this.water > cd.wHi && this.crop !== 'paddy') fw = lerp(1, 0.55, (this.water - cd.wHi) / (101 - cd.wHi));
    else fw = 1;
    const fn = 0.45 + 0.55 * smoothstep(4, 40, this.nut);
    const fwe = 1 - this.weeds / 220, fp = 1 - this.pests / 260;
    const ft = W.id === 'heatwave' && !this.greenhouse ? 0.82 : 1;
    const fs = cd.season[Time.season()] || 1;
    if (this.growth < 1) {
      this.growth = Math.min(1, this.growth + hrs / (cd.days * 24) * fw * fn * fwe * fp * ft * (0.6 + 0.4 * fs));
      if (this.growth >= 1 && this.isPlayer) { UI.toast(L(`${this.label()}: ${LN(cd)} is ready to harvest!`, `${this.label()}: ${LN(cd)} కోతకు సిద్ధం!`), 'good'); Audio2.sfx('ready'); Bus.emit('cropReady', { field: this }); }
    } else {
      this.overHrs += hrs;
    }
    // health
    let target = 100;
    if (this.water < cd.wLo) target -= (1 - this.water / cd.wLo) * 70;
    if (this.crop !== 'paddy' && this.water > cd.wHi) target -= (this.water - cd.wHi) * 1.1;
    target -= Math.max(0, this.weeds - 28) * 0.65;
    target -= Math.max(0, this.pests - 14) * 0.95;
    if (this.nut < 18) target -= (18 - this.nut) * 1.3;
    if (W.id === 'heatwave' && !this.greenhouse) target -= 9;
    if (this.overHrs > 30) target -= Math.min(40, (this.overHrs - 30) * 0.8 * ez);
    target -= this.damage;
    target = clamp(target, ez < 1 ? 45 : 0, 100);   // easy mode: a neglected crop still gives a fair harvest
    this.health += (target < this.health ? -1.7 : 1.2) * hrs * (target < this.health ? Math.min(1, (this.health - target) / 25 + 0.15) : 1);
    this.health = clamp(this.health, 0, 100);
    // storm damage near maturity
    if (!this.greenhouse && W.rain > 0.7 && this.growth > 0.7) {
      const k = this.crop === 'cotton' ? 1.3 : this.crop === 'paddy' || this.crop === 'maize' ? 0.8 : 0.6;
      this.damage = Math.min(35, this.damage + k * W.rain * hrs * (W.id === 'storm' ? 1.6 : 1));
      this.damagedByWeather = true;
    }
  }
  label() { if (this.id === 'GH') return L('Polyhouse plot', 'పాలీహౌస్ పొలం'); return (this.village === 'seethampet' ? L('Seethampet ', 'సీతంపేట ') : '') + L('Field ', 'పొలం ') + this.id.slice(1); }
  get landPrice() { const lv = 1 + (G.S ? G.S.village.landValue : 0); return Math.round(this.acres * 300000 * lv * (this.soil === 'black' ? 1.06 : 1) * (this.canal ? 1.08 : 1) * (this.borewell ? 1.05 : 1) / 1000) * 1000; }
  get leasePrice() { return Math.round(this.acres * 12000 * (1 + (G.S ? G.S.village.landValue * 0.5 : 0)) / 100) * 100; }
}

// ---------- Fields manager ----------
const Fields = {
  list: [], byId: {}, geoms: {}, T: 8,
  init() {
    this.list = World.fields.map((r) => new Field(r));
    for (const f of this.list) this.byId[f.id] = f;
    // from now on every spatial lookup (fieldAt / fieldNear) returns the live Field objects
    for (const arr of World.fieldGrid.values()) for (let i = 0; i < arr.length; i++) arr[i] = this.list[arr[i].idx];
    World.fields = this.list;
    this.detail = G.preset.cropDetail;
    for (const c of CROP_IDS) this.geoms[c] = [0, 1, 2].map((d) => cropGeometry(c, d));
    for (const f of this.list) this.buildField(f);
    this.buildFar();
  },
  // Distant fields: one merged mesh of flat coloured quads (one draw call for all of them).
  // Nearby fields use their own detailed ground texture instead.
  buildFar() {
    const n = this.list.length;
    const pos = new Float32Array(n * 12), nor = new Float32Array(n * 12), colA = new Float32Array(n * 12), idx = new Uint32Array(n * 6);
    this.list.forEach((f, k) => {
      const o = k * 4;
      for (let j = 0; j < 4; j++) { nor[(o + j) * 3 + 1] = 1; }
      idx.set([o, o + 3, o + 2, o, o + 2, o + 1], k * 6);
      f.farK = k; f.farOn = true; f.farSig = '';
    });
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('normal', new THREE.BufferAttribute(nor, 3)); g.setAttribute('color', new THREE.BufferAttribute(colA, 3));
    g.setIndex(new THREE.BufferAttribute(idx, 1));
    g.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 0, 0), WORLD_HALF * 1.5);
    this.farMat = patchMaterial(new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.95, metalness: 0 }), 'std', { key: 'fieldfar' });
    this.farMesh = new THREE.Mesh(g, this.farMat); this.farMesh.receiveShadow = true; this.farMesh.matrixAutoUpdate = false; this.farMesh.name = 'fieldsFar';
    G.scene.add(this.farMesh);
    for (const f of this.list) { this.farQuad(f, true); this.farColor(f); }
    this.farT = 0;
  },
  farQuad(f, on) {
    const p = this.farMesh.geometry.attributes.position; const o = f.farK * 4; const y = f.y + 0.02;
    const pts = on ? [[f.x0, f.z0], [f.x1, f.z0], [f.x1, f.z1], [f.x0, f.z1]] : [[f.x, f.z], [f.x, f.z], [f.x, f.z], [f.x, f.z]];
    for (let j = 0; j < 4; j++) p.setXYZ(o + j, pts[j][0], on ? y : y - 30, pts[j][1]);
    p.needsUpdate = true; f.farOn = on;
  },
  farColor(f) {
    const sig = (f.ver || 0) + '|' + f.crop + '|' + Math.round(f.growth * 12) + '|' + Math.round(f.weeds / 15) + '|' + f.wasStubble;
    if (sig === f.farSig) return false;
    f.farSig = sig;
    let c0 = 0, c1 = 0, c2 = 0, c3 = 0; const t = f.tiles;
    for (let i = 0; i < t.length; i++) { const v = t[i]; if (v === 0) c0++; else if (v === 1) c1++; else if (v === 2) c2++; else c3++; }
    const red = f.soil === 'red', n = Math.max(1, t.length);
    const k0 = FAR_COL[red ? (f.wasStubble ? 'r0s' : 'r0') : (f.wasStubble ? 'b0s' : 'b0')], k1 = FAR_COL[red ? 'r1' : 'b1'], k2 = FAR_COL[red ? 'r2' : 'b2'];
    const cd = f.crop ? CROPS[f.crop] : null;
    const cc = _farC.copy(k1);
    if (cd && c3) { const crop = _farC2.set(cd.leaf).lerp(_farC3.set(cd.ripe), smoothstep(0.78, 1, f.growth)); cc.lerp(crop, clamp(0.15 + f.growth * 1.4, 0, 0.92)); }
    const r = (k0.r * c0 + k1.r * c1 + k2.r * c2 + cc.r * c3) / n, g = (k0.g * c0 + k1.g * c1 + k2.g * c2 + cc.g * c3) / n, b = (k0.b * c0 + k1.b * c1 + k2.b * c2 + cc.b * c3) / n;
    const w = clamp01((f.weeds - 20) / 100) * 0.35;
    const col = this.farMesh.geometry.attributes.color; const o = f.farK * 4;
    for (let j = 0; j < 4; j++) col.setXYZ(o + j, lerp(r, FAR_COL.weed.r, w), lerp(g, FAR_COL.weed.g, w), lerp(b, FAR_COL.weed.b, w));
    col.needsUpdate = true;
    return true;
  },
  buildField(f) {
    // ground canvas
    const T = this.T;
    const cv = document.createElement('canvas'); cv.width = f.tx * T; cv.height = f.tz * T;
    f.ctx = cv.getContext('2d'); f.canvas = cv;
    f.tex = new THREE.CanvasTexture(cv); f.tex.colorSpace = THREE.SRGBColorSpace; f.tex.anisotropy = 4;
    f.tex.magFilter = THREE.LinearFilter; f.tex.minFilter = THREE.LinearMipmapLinearFilter;
    f.mat = patchMaterial(new THREE.MeshStandardMaterial({ map: f.tex, roughness: 0.95, metalness: 0 }), 'std', { key: 'fieldground' });
    const g = new THREE.PlaneGeometry(f.w, f.d, 1, 1); g.rotateX(-Math.PI / 2);
    f.ground = new THREE.Mesh(g, f.mat);
    f.ground.position.set(f.x, f.y + 0.02, f.z);
    f.ground.receiveShadow = true; f.ground.matrixAutoUpdate = false; f.ground.updateMatrix();
    G.scene.add(f.ground);
    // bunds (static chunk geometry)
    const b = Chunks.get(f.x, f.z, 'std');
    const bc = C(f.soil === 'red' ? '#7d5a3a' : '#4a4034');
    const y = f.y + 0.08;
    b.box(f.w + 1.4, 0.34, 0.7, f.x, y, f.z0 - 0.35, 0, bc); b.box(f.w + 1.4, 0.34, 0.7, f.x, y, f.z1 + 0.35, 0, bc);
    b.box(0.7, 0.34, f.d, f.x0 - 0.35, y, f.z, 0, bc); b.box(0.7, 0.34, f.d, f.x1 + 0.35, y, f.z, 0, bc);
    World.occRect(f.x0, f.z0, f.x1 - 0.01, f.z1 - 0.01, OCC.FIELD);
    // crop instanced mesh
    f.cropMat = makeCropMaterial(f.fu); f.cropDepth = makeCropDepthMaterial(f.fu);
    f.heapSpot = this.heapSpot(f);
    f.allDirty = true;
  },
  heapSpot(f) {
    // edge point nearest to any road, placed 3 m outside the field
    let best = null, bd = 1e9;
    const cands = [];
    for (let t = 0.15; t <= 0.85; t += 0.35) { cands.push([lerp(f.x0, f.x1, t), f.z0 - 3.2]); cands.push([lerp(f.x0, f.x1, t), f.z1 + 3.2]); cands.push([f.x0 - 3.2, lerp(f.z0, f.z1, t)]); cands.push([f.x1 + 3.2, lerp(f.z0, f.z1, t)]); }
    for (const [x, z] of cands) {
      if (fieldAt(x, z)) continue;
      let d = 1e9; for (const r of ROADS) { const dd = distToPolyline(x, z, r.pts); if (dd < d) d = dd; }
      if (d < bd) { bd = d; best = { x, z }; }
    }
    return best || { x: f.x0 - 3, z: f.z0 - 3 };
  },
  ensureCropMesh(f) {
    const need = f.sownTiles > 0 || f.countMin(3) > 0;
    const det = this.detail;
    if (!f.crop) { if (f.cropMesh) f.cropMesh.visible = false; return; }
    const geom = this.geoms[f.crop][det];
    if (!f.cropMesh || f.cropMesh.userData.crop !== f.crop || f.cropMesh.userData.det !== det) {
      if (f.cropMesh) { G.scene.remove(f.cropMesh); f.cropMesh.dispose(); }
      const m = new THREE.InstancedMesh(geom, f.cropMat, f.n);
      m.customDepthMaterial = f.cropDepth;
      m.castShadow = G.preset.shadows && G.preset.cropDetail > 0; m.receiveShadow = true;
      m.userData = { crop: f.crop, det };
      m.count = 0;
      G.scene.add(m); f.cropMesh = m; f.cropDirty = true;
    }
    if (f.cropDirty) {
      const m = f.cropMesh; let k = 0;
      const dummy = this._d || (this._d = new THREE.Object3D());
      const rowCrop = f.crop === 'maize' || f.crop === 'cotton' || f.crop === 'chilli' || f.crop === 'tomato';
      for (let i = 0; i < f.n; i++) {
        if (f.tiles[i] !== 3) continue;
        const c = f.tileCenter(i);
        dummy.position.set(c.x, f.y + 0.03, c.z);
        dummy.rotation.set(0, rowCrop ? (hash2(i, f.idx) < 0.5 ? 0 : Math.PI) : hash2(i, f.idx) * TAU, 0);
        const s = 0.92 + hash2(f.idx, i) * 0.16; dummy.scale.set(1, s, 1); dummy.updateMatrix();
        m.setMatrixAt(k++, dummy.matrix);
      }
      m.count = k; m.instanceMatrix.needsUpdate = true;
      m.computeBoundingSphere();
      f.cropDirty = false;
    }
    f.cropMesh.visible = need;
  },
  drawTile(f, i) {
    const T = this.T, ctx = f.ctx; const ix = i % f.tx, iz = Math.floor(i / f.tx); const px = ix * T, py = iz * T;
    const s = f.tiles[i]; const sc = SOIL_COL[f.soil];
    const h1 = hash2(i, f.idx * 7 + 1), h2 = hash2(i * 3, f.idx + 5);
    if (s === 0) {
      ctx.fillStyle = f.soil === 'red' ? (h1 < 0.5 ? '#94603f' : '#8a583a') : (h1 < 0.5 ? '#4a3f35' : '#433a31'); ctx.fillRect(px, py, T, T);
      ctx.fillStyle = f.wasStubble ? 'rgba(196,168,104,0.75)' : 'rgba(110,140,70,0.7)';
      for (let k = 0; k < 4; k++) { const sx = px + hash2(i, k) * T, sy = py + hash2(k, i) * T; ctx.fillRect(sx, sy, 1, 2 + (k % 2)); }
    } else if (s === 1) {
      ctx.fillStyle = sc[1]; ctx.fillRect(px, py, T, T);
      ctx.fillStyle = f.soil === 'red' ? 'rgba(170,98,58,0.9)' : 'rgba(92,78,64,0.9)';
      for (let k = 0; k < T; k += 3) ctx.fillRect(px, py + k, T, 1);
    } else {
      ctx.fillStyle = sc[s === 2 ? 0 : 1]; ctx.fillRect(px, py, T, T);
      ctx.fillStyle = f.soil === 'red' ? 'rgba(60,24,12,0.35)' : 'rgba(10,8,6,0.35)';
      for (let k = 1; k < T; k += 4) ctx.fillRect(px, py + k, T, 1);
      if (s === 3) { ctx.fillStyle = 'rgba(74,110,40,0.55)'; for (let k = 2; k < T; k += 4) ctx.fillRect(px + (h2 * 2 | 0), py + k, T - 1, 1); }
    }
    if (f.weeds > 22 && s >= 1) {
      const n = Math.floor((f.weeds - 22) / 12);
      ctx.fillStyle = 'rgba(98,150,52,0.95)';
      for (let k = 0; k < n; k++) { const sx = px + hash2(i + k, 11) * (T - 1), sy = py + hash2(k * 5, i) * (T - 1); ctx.fillRect(sx, sy, 1.5, 1.5); }
    }
  },
  redraw(f) {
    if (f.allDirty) { for (let i = 0; i < f.n; i++) this.drawTile(f, i); f.allDirty = false; f.dirty.clear(); f.tex.needsUpdate = true; f.lastWeedsDrawn = f.weeds; return; }
    if (f.dirty.size) { for (const i of f.dirty) this.drawTile(f, i); f.dirty.clear(); f.tex.needsUpdate = true; }
    if (Math.abs((f.lastWeedsDrawn || 0) - f.weeds) > 10) { f.allDirty = true; }
  },
  updateVisuals(cam) {
    const P = G.preset; const D = P.cropDist;
    const NEARF = P.lite ? 110 : P.id === 'MEDIUM' ? 180 : 320;
    let budget = isMobile ? 1 : 3;
    this.farT -= G.dt || 0.016; const recolor = this.farT <= 0; if (recolor) this.farT = 1.5;
    const signD = P.lite ? 120 : 220;
    for (const f of this.list) {
      const d = Math.max(0, Math.hypot(f.x - cam.x, f.z - cam.z) - Math.hypot(f.w, f.d) / 2);
      const near = d < NEARF;
      f.ground.visible = near;
      if (near === f.farOn) this.farQuad(f, !near);
      if (!near && recolor) this.farColor(f);
      const sg = Farm.signs[f.id]; if (sg) sg.visible = d < signD;
      if (near && (f.dirty.size || f.allDirty)) { if (budget > 0 || d < 12) { this.redraw(f); budget--; } }
      // crop uniforms
      const fu = f.fu;
      fu.uGrowth.value = f.growth; fu.uHealth.value = f.health / 100; fu.uRipe.value = smoothstep(0.78, 1.0, f.growth); fu.uDry.value = clamp01((f.overHrs - 24) / 60) + (f.water < 12 ? 0.3 : 0);
      if (d < D) { this.ensureCropMesh(f); }
      else if (f.cropMesh) f.cropMesh.visible = false;
      // wetness tint on ground
      const wetK = f.water / 100 * 0.35 + U.uWet.value * 0.25;
      f.mat.color.setRGB(1 - wetK, 1 - wetK * 0.95, 1 - wetK * 0.9);
      // paddy flooding water sheet
      const flood = f.crop === 'paddy' && f.water > 58 && f.growth < 0.9 && d < D + 80;
      if (flood) {
        if (!f.flood) { const g = new THREE.PlaneGeometry(f.w - 0.2, f.d - 0.2); g.rotateX(-Math.PI / 2); const mm = World.makeWaterMaterial({ deep: '#3b4f45', shallow: '#56634d', alpha: 0.75 }); f.flood = new THREE.Mesh(g, mm); f.flood.position.set(f.x, f.y + 0.1, f.z); f.flood.renderOrder = 1; G.scene.add(f.flood); }
        f.flood.visible = true; f.flood.material.uniforms.uAlpha.value = clamp01((f.water - 58) / 20) * 0.72;
      } else if (f.flood) f.flood.visible = false;
      // heap visual
      if (f.heapDirty || (f.heap && !f.heapMesh) || (!f.heap && f.heapMesh)) this.updateHeap(f);
    }
  },
  updateHeap(f) {
    f.heapDirty = false;
    if (!f.heap || f.heap.qty < 0.05) { f.heap = null; if (f.heapMesh) { G.scene.remove(f.heapMesh); f.heapMesh = null; } return; }
    if (!f.heapMesh) {
      const m = new THREE.Mesh(this.heapGeom || (this.heapGeom = (() => { const g = new THREE.SphereGeometry(1, 14, 7, 0, TAU, 0, Math.PI / 2); return g; })()), new THREE.MeshStandardMaterial({ roughness: 0.95 }));
      m.castShadow = true; m.receiveShadow = true; G.scene.add(m); f.heapMesh = m;
    }
    const s = clamp(Math.cbrt(f.heap.qty) * 0.75, 0.5, 3.4);
    f.heapMesh.material.color.set(PRODUCE[f.heap.crop].heap);
    f.heapMesh.scale.set(s * 1.3, s * 0.62, s * 1.1);
    f.heapMesh.position.set(f.heapSpot.x, World.groundHeight(f.heapSpot.x, f.heapSpot.z) - 0.05, f.heapSpot.z);
  },
  setDetail(det) { this.detail = det; for (const f of this.list) f.cropDirty = true; },
  // game-time step for all fields
  simulate(hrs) {
    const W = Weather.cur;
    for (const f of this.list) {
      if (f.isPlayer) f.simulate(hrs, W);
      else if (f.owner !== 'none' && !f.avail) this.npcTick(f, hrs, W);
    }
    // rain wets heaps in the open
    if (W.rain > 0.25) for (const f of this.list) if (f.heap && f.isPlayer) { f.heap.q = Math.max(0.6, f.heap.q - 0.02 * W.rain * hrs); }
  },
  // ---- NPC farming cycle (cheap, visual) ----
  npcTick(f, hrs, W) {
    f.npcTimer -= hrs;
    const h = Time.hour(); const work = h > 6.5 && h < 17.5 && W.rain < 0.5;
    switch (f.npcPhase) {
      case 'fallow':
        if (f.npcTimer <= 0 && work) { f.npcPhase = 'plough'; }
        break;
      case 'plough': case 'sow': case 'harvest': {
        if (!work) break;
        const per = Math.max(1, Math.round(f.n * 0.16 * hrs));
        let done = 0, left = false;
        for (let i = 0; i < f.n && done < per; i++) {
          const t = f.tiles[i];
          if (f.npcPhase === 'plough' && t < 2) { f.setTile(i, 2); done++; }
          else if (f.npcPhase === 'sow' && t === 2) { f.setTile(i, 3); f.sownTiles++; done++; }
          else if (f.npcPhase === 'harvest' && t === 3) { f.setTile(i, 0); f.sownTiles--; done++; }
        }
        for (let i = 0; i < f.n; i++) { const t = f.tiles[i]; if ((f.npcPhase === 'plough' && t < 2) || (f.npcPhase === 'sow' && t === 2) || (f.npcPhase === 'harvest' && t === 3)) { left = true; break; } }
        f.npcWorking = true;
        if (f.npcPhase === 'sow' && !f.crop) { f.crop = f.npcCrop || this.npcChooseCrop(f); f.growth = 0.02; f.health = 90 + frand() * 10; const cd = CROPS[f.crop]; f.fu.uLeafRipe.value.set(cd.ripe); f.fu.uFruitA.value.set(cd.fruit); f.fu.uFruitB.value.set(cd.fruitRipe); }
        if (!left) {
          f.npcWorking = false;
          if (f.npcPhase === 'plough') f.npcPhase = 'sow';
          else if (f.npcPhase === 'sow') f.npcPhase = 'grow';
          else { f.npcPhase = 'fallow'; f.crop = null; f.sownTiles = 0; f.cropDirty = true; f.wasStubble = true; f.allDirty = true; f.npcTimer = 6 + frand() * 40; }
        }
        break;
      }
      case 'grow':
        if (f.crop) {
          const cd = CROPS[f.crop];
          f.growth = Math.min(1, f.growth + hrs / (cd.days * 24) * (0.85 + (W.rain > 0 ? 0.1 : 0)));
          if (f.growth >= 1) { f.npcTimer = f.npcTimer > 0 ? f.npcTimer : 4 + frand() * 18; if (f.npcTimer - hrs <= 0) f.npcPhase = 'harvest'; }
          f.water = f.crop === 'paddy' ? 80 : 55;
        } else f.npcPhase = 'fallow';
        break;
    }
  },
  npcChooseCrop(f) {
    const s = Time.season();
    const opts = s === 0 ? (f.soil === 'black' ? ['cotton', 'cotton', 'paddy', 'maize', 'turmeric'] : ['paddy', 'maize', 'groundnut', 'chilli', 'cotton'])
      : s === 1 ? (f.soil === 'black' ? ['paddy', 'maize', 'chilli', 'cotton'] : ['groundnut', 'chilli', 'maize', 'tomato', 'paddy'])
        : ['groundnut', 'maize', 'tomato', 'paddy'];
    return opts[Math.floor(frand() * opts.length)];
  },
  randomizeNPC() {
    for (const f of this.list) {
      if (f.isPlayer || f.owner === 'none') continue;
      const r = hash2(f.idx, 91);
      f.wasStubble = hash2(f.idx, 13) < 0.7;
      if (r < 0.62) {
        f.crop = f.npcCrop = this.npcChooseCrop(f); f.npcPhase = 'grow'; f.growth = 0.08 + hash2(f.idx, 5) * 0.88; f.health = 85 + hash2(f.idx, 8) * 15;
        const cd = CROPS[f.crop]; f.fu.uLeafRipe.value.set(cd.ripe); f.fu.uFruitA.value.set(cd.fruit); f.fu.uFruitB.value.set(cd.fruitRipe);
        for (let i = 0; i < f.n; i++) f.tiles[i] = 3; f.sownTiles = f.n;
      } else if (r < 0.75) { f.npcPhase = 'fallow'; for (let i = 0; i < f.n; i++) f.tiles[i] = 2; f.npcTimer = frand() * 20; f.npcPhase = 'sow'; }
      else { f.npcPhase = 'fallow'; f.npcTimer = frand() * 30; }
      f.allDirty = true; f.cropDirty = true;
    }
  },
  playerFields() { return this.list.filter((f) => f.isPlayer); },
  nearest(x, z, pred) { let best = null, bd = 1e9; for (const f of this.list) { if (pred && !pred(f)) continue; const d = Math.hypot(f.x - x, f.z - z); if (d < bd) { bd = d; best = f; } } return best; },
  // serialisation of player-relevant fields
  save() {
    const out = {};
    for (const f of this.list) {
      if (!f.isPlayer && !f.avail && !f.borewell && !f.heap) continue;
      out[f.id] = { o: f.owner, a: f.avail, lu: f.leaseUntil, c: f.crop, g: +f.growth.toFixed(4), w: +f.water.toFixed(1), nu: +f.nut.toFixed(1), we: +f.weeds.toFixed(1), p: +f.pests.toFixed(1), h: +f.health.toFixed(1), sh: +f.soilHealth.toFixed(1), ob: f.outbreak, oh: +f.overHrs.toFixed(1), pp: f.poorPrep, dm: +f.damage.toFixed(1), st: f.sownTiles, ins: f.insured, pu: f.pump, ga: f.gate, bw: f.borewell, gh: !!f.greenhouse, hp: f.heap, pc: f.plannedCrop, t: f.isPlayer ? Array.from(f.tiles).join('') : null, sa: f.sownAt || 0 };
    }
    return out;
  },
  load(data) {
    for (const id in data) {
      const f = this.byId[id]; if (!f) continue; const d = data[id];
      f.owner = d.o; f.avail = d.a; f.leaseUntil = d.lu || 0; f.crop = d.c; f.growth = d.g; f.water = d.w; f.nut = d.nu; f.weeds = d.we; f.pests = d.p; f.health = d.h; f.soilHealth = d.sh;
      f.outbreak = d.ob; f.overHrs = d.oh; f.poorPrep = d.pp; f.damage = d.dm; f.sownTiles = d.st; f.insured = d.ins; f.pump = d.pu; f.gate = d.ga; f.borewell = d.bw; f.greenhouse = d.gh; f.heap = d.hp; f.plannedCrop = d.pc; f.sownAt = d.sa;
      if (d.t) { for (let i = 0; i < f.n && i < d.t.length; i++) f.tiles[i] = d.t.charCodeAt(i) - 48; }
      if (f.crop) { const cd = CROPS[f.crop]; f.fu.uLeafRipe.value.set(cd.ripe); f.fu.uFruitA.value.set(cd.fruit); f.fu.uFruitB.value.set(cd.fruitRipe); }
      f.allDirty = true; f.cropDirty = true; f.heapDirty = true;
      if (f.isPlayer) { f.npcPhase = 'player'; }
    }
  },
};
