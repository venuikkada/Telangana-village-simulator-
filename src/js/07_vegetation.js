// ============================================================================
// Vegetation: Telangana trees (palmyra, neem, banyan, tamarind, mango, eucalyptus),
// shrubs, granite boulder tors, grass ring
// ============================================================================
const TREE_KINDS = ['palm', 'neem', 'banyan', 'tamarind', 'mango', 'eucalyptus', 'datepalm', 'shrub', 'calotropis'];
const TREE_COLLIDE = { palm: 0.35, neem: 0.4, banyan: 1.3, tamarind: 0.55, mango: 0.4, eucalyptus: 0.25, datepalm: 0.3 };

function treeGeometry(kind, v) {
  const b = new GeoBuilder();
  const R = mulberry32(1000 + TREE_KINDS.indexOf(kind) * 17 + v * 3);
  const r = () => R();
  const leafCols = (base, n = 3) => Array.from({ length: n }, (_, i) => { const c = C(base).clone(); const k = 0.85 + r() * 0.3; c.r *= k; c.g *= k * (0.95 + r() * 0.1); c.b *= k; return c; });
  if (kind === 'palm') {
    const h = 9 + v * 2.2, lean = (r() - 0.5) * 0.9;
    let px = 0, py = 0;
    for (let i = 0; i < 6; i++) { const nx = lean * ((i + 1) / 6) * ((i + 1) / 6) * 2; b.beam(px, py, 0, nx, py + h / 6, 0, 0.27 - i * 0.018, C(i % 2 ? '#4b4239' : '#433a32'), PRIM.cyl6); px = nx; py += h / 6; }
    const lc = leafCols('#35562a', 4);
    const n = 18;
    for (let i = 0; i < n; i++) {
      const a = i / n * TAU + r() * 0.3, el = (r() - 0.35) * 1.1;
      const L = 1.7 + r() * 0.5;
      const dx = Math.cos(a) * Math.cos(el), dz = Math.sin(a) * Math.cos(el), dy = Math.sin(el);
      _v3.set(dx, dy, dz).normalize(); _q2.setFromUnitVectors(UP, _v3);
      const q3 = new THREE.Quaternion().setFromAxisAngle(_v3, r() * TAU); _q2.premultiply(q3);
      _v1.set(px + dx * L * 0.55, py + 0.2 + dy * L * 0.55, dz * L * 0.55); _v2.set(1.9, L, 0.07);
      b.add(PRIM.cone6, _mA.compose(_v1, _q2, _v2), lc[i % 4], 0.12);
    }
    for (let i = 0; i < 5; i++) { const a = r() * TAU; b.beam(px, py, 0, px + Math.cos(a) * 0.6, py - 1.6, Math.sin(a) * 0.6, 0.18, C('#7a6445'), PRIM.cone6); }
    for (let i = 0; i < 4; i++) b.sphere(0.22, px + (r() - 0.5) * 0.5, py - 0.3, (r() - 0.5) * 0.5, C('#1d1b17'), PRIM.ico0);
  } else if (kind === 'neem' || kind === 'tamarind' || kind === 'mango') {
    const tk = kind === 'neem' ? 0.26 : kind === 'tamarind' ? 0.46 : 0.34;
    const th = kind === 'neem' ? 3.4 : kind === 'tamarind' ? 3.8 : 2.2;
    const cy = kind === 'neem' ? 6.0 : kind === 'tamarind' ? 7.2 : 4.3;
    const base = kind === 'neem' ? '#4e7f30' : kind === 'tamarind' ? '#3a5a26' : '#2d5020';
    const nb = kind === 'neem' ? 8 : kind === 'tamarind' ? 11 : 9;
    const spread = kind === 'neem' ? 2.6 : kind === 'tamarind' ? 3.6 : 2.6;
    const rad = kind === 'neem' ? 1.9 : kind === 'tamarind' ? 2.4 : 2.1;
    const bark = C(kind === 'mango' ? '#4a3a2c' : '#55473a');
    b.beam(0, 0, 0, 0.2, th, 0.1, tk, bark, PRIM.cyl8);
    for (let i = 0; i < 3; i++) { const a = i / 3 * TAU + r(); b.beam(0.2, th * 0.85, 0.1, Math.cos(a) * spread * 0.6, cy - 0.6, Math.sin(a) * spread * 0.6, tk * 0.45, bark, PRIM.cyl6); }
    const lc = leafCols(base, 4);
    for (let i = 0; i < nb; i++) {
      const a = r() * TAU, d = r() * spread, rr = rad * (0.7 + r() * 0.5);
      b.sphere(rr, Math.cos(a) * d, cy + (r() - 0.3) * 1.6 - d * 0.25, Math.sin(a) * d, lc[i % 4], PRIM.ico1, 1, kind === 'mango' ? 0.8 : 0.85, 1);
    }
    if (kind === 'mango' && v === 1) for (let i = 0; i < 26; i++) { const a = r() * TAU, d = spread * 0.8 + r() * 1.2; b.sphere(0.12, Math.cos(a) * d, cy - 1.2 + r() * 1.5, Math.sin(a) * d, C(r() < 0.5 ? '#e9a22a' : '#d9c24a'), PRIM.ico0, 1, 1.4, 1); }
  } else if (kind === 'banyan') {
    const bark = C('#5c5046');
    b.beam(0, 0, 0, 0, 4.2, 0, 1.0, bark, PRIM.cyl8);
    for (let i = 0; i < 5; i++) { const a = i / 5 * TAU + r(); b.beam(0, 3.6, 0, Math.cos(a) * 5, 6.5, Math.sin(a) * 5, 0.38, bark, PRIM.cyl6); }
    const lc = leafCols('#335a25', 4);
    for (let i = 0; i < 16; i++) { const a = r() * TAU, d = 2 + r() * 7.5; b.sphere(2.6 + r() * 1.4, Math.cos(a) * d, 7.4 + r() * 1.8, Math.sin(a) * d, lc[i % 4], PRIM.ico1, 1.1, 0.62, 1.1); }
    for (let i = 0; i < 14; i++) { const a = r() * TAU, d = 3 + r() * 6; const x = Math.cos(a) * d, z = Math.sin(a) * d; b.beam(x, 6.6, z, x + (r() - 0.5) * 0.4, 0, z + (r() - 0.5) * 0.4, 0.06 + r() * 0.12, C('#6e6152'), PRIM.cyl6); }
  } else if (kind === 'eucalyptus') {
    const h = 12 + v * 3;
    b.beam(0, 0, 0, 0.3, h, 0.1, 0.17, C('#d6cfc0'), PRIM.cyl6);
    const lc = leafCols('#5d7d58', 3);
    for (let i = 0; i < 6; i++) b.sphere(0.9 + r() * 0.6, (r() - 0.5) * 1.8, h - 2.5 + r() * 3.2, (r() - 0.5) * 1.8, lc[i % 3], PRIM.ico0, 1, 1.5, 1);
  } else if (kind === 'datepalm') {
    const h = 2.2 + v * 1.4;
    b.beam(0, 0, 0, 0.15, h, 0, 0.22, C('#5a4a3a'), PRIM.cyl6);
    const lc = leafCols('#4a6a35', 3);
    for (let i = 0; i < 12; i++) {
      const a = i / 12 * TAU, el = 0.2 + r() * 0.9;
      _v3.set(Math.cos(a) * Math.cos(el), Math.sin(el), Math.sin(a) * Math.cos(el)).normalize(); _q2.setFromUnitVectors(UP, _v3);
      _v1.set(0.15 + _v3.x * 1.1, h + _v3.y * 1.1, _v3.z * 1.1); _v2.set(0.35, 2.4, 0.06);
      b.add(PRIM.cone6, _mA.compose(_v1, _q2, _v2), lc[i % 3], 0.1);
    }
  } else if (kind === 'shrub') {
    const lc = leafCols(v ? '#556f2c' : '#4a6a30', 3);
    for (let i = 0; i < 4; i++) b.sphere(0.45 + r() * 0.4, (r() - 0.5) * 1.1, 0.4 + r() * 0.3, (r() - 0.5) * 1.1, lc[i % 3], PRIM.ico0, 1, 0.8, 1);
    if (v) for (let i = 0; i < 6; i++) b.sphere(0.07, (r() - 0.5) * 1.3, 0.7 + r() * 0.4, (r() - 0.5) * 1.3, C(r() < 0.5 ? '#e8b92a' : '#e0607a'), PRIM.ico0);
  } else if (kind === 'calotropis') {
    for (let i = 0; i < 5; i++) b.beam(0, 0, 0, (r() - 0.5) * 1.2, 0.9 + r() * 0.6, (r() - 0.5) * 1.2, 0.05, C('#8a9a82'), PRIM.cyl6);
    for (let i = 0; i < 10; i++) b.sphere(0.25 + r() * 0.15, (r() - 0.5) * 1.3, 0.6 + r() * 0.8, (r() - 0.5) * 1.3, C('#8fa08a'), PRIM.ico0, 1, 0.5, 1);
    for (let i = 0; i < 5; i++) b.sphere(0.08, (r() - 0.5) * 1.2, 1.2 + r() * 0.4, (r() - 0.5) * 1.2, C('#c9b8e8'), PRIM.ico0);
  }
  const g = b.build();
  return g;
}

// low-poly stand-in drawn beyond the detail distance (about a tenth of the triangles)
function treeLodGeometry(kind, v) {
  const b = new GeoBuilder();
  const R = mulberry32(1000 + TREE_KINDS.indexOf(kind) * 17 + v * 3);
  const shade = (hex, k) => C(hex).clone().multiplyScalar(k);
  const frond = (x, y, z, a, el, L, w, c) => {
    const dx = Math.cos(a) * Math.cos(el), dz = Math.sin(a) * Math.cos(el), dy = Math.sin(el);
    _v3.set(dx, dy, dz).normalize(); _q2.setFromUnitVectors(UP, _v3);
    _v1.set(x + dx * L * 0.55, y + dy * L * 0.55, z + dz * L * 0.55); _v2.set(w, L, 0.08);
    b.add(PRIM.cone4, _mA.compose(_v1, _q2, _v2), c, 0.1);
  };
  if (kind === 'palm') {
    const h = 9 + v * 2.2, lean = (R() - 0.5) * 0.9;
    const mx = lean * 0.5, tx = lean * 2;
    b.beam(0, 0, 0, mx, h * 0.5, 0, 0.26, C('#4b4239'), PRIM.cyl4);
    b.beam(mx, h * 0.5, 0, tx, h, 0, 0.21, C('#433a32'), PRIM.cyl4);
    for (let i = 0; i < 7; i++) frond(tx, h + 0.2, 0, i / 7 * TAU + 0.3, i % 2 ? 0.25 : -0.2, 2.0, 2.0, shade('#35562a', i % 2 ? 1 : 1.12));
  } else if (kind === 'neem' || kind === 'tamarind' || kind === 'mango') {
    const tk = kind === 'neem' ? 0.26 : kind === 'tamarind' ? 0.46 : 0.34;
    const th = kind === 'neem' ? 3.4 : kind === 'tamarind' ? 3.8 : 2.2;
    const cy = kind === 'neem' ? 6.0 : kind === 'tamarind' ? 7.2 : 4.3;
    const base = kind === 'neem' ? '#4e7f30' : kind === 'tamarind' ? '#3a5a26' : '#2d5020';
    const spread = kind === 'neem' ? 2.6 : kind === 'tamarind' ? 3.6 : 2.6;
    const rad = kind === 'neem' ? 1.9 : kind === 'tamarind' ? 2.4 : 2.1;
    const fl = kind === 'mango' ? 0.8 : 0.85;
    b.beam(0, 0, 0, 0.2, th + 0.8, 0.1, tk, C(kind === 'mango' ? '#4a3a2c' : '#55473a'), PRIM.cyl4);
    b.sphere(rad * 1.3, 0, cy + 0.3, 0, shade(base, 1.05), PRIM.ico0, 1, fl, 1);
    const n = kind === 'tamarind' ? 4 : 3;
    for (let i = 0; i < n; i++) { const a = i / n * TAU + 0.5 + R(); b.sphere(rad * 1.05, Math.cos(a) * spread * 0.62, cy - 0.3, Math.sin(a) * spread * 0.62, shade(base, i % 2 ? 0.88 : 0.97), PRIM.ico0, 1, fl, 1); }
  } else if (kind === 'banyan') {
    b.beam(0, 0, 0, 0, 5, 0, 1.0, C('#5c5046'), PRIM.cyl4);
    for (let i = 0; i < 6; i++) { const a = i / 6 * TAU, d = i ? 5.2 : 0; b.sphere(3.6, Math.cos(a) * d, 7.8, Math.sin(a) * d, shade('#335a25', i % 2 ? 0.92 : 1.04), PRIM.ico0, 1.1, 0.62, 1.1); }
  } else if (kind === 'eucalyptus') {
    const h = 12 + v * 3;
    b.beam(0, 0, 0, 0.3, h, 0.1, 0.17, C('#d6cfc0'), PRIM.cyl4);
    b.sphere(1.3, 0.25, h - 1.0, 0.1, C('#5d7d58'), PRIM.ico0, 1, 1.6, 1);
    b.sphere(1.0, 0.1, h - 3.0, 0.3, shade('#5d7d58', 0.9), PRIM.ico0, 1, 1.5, 1);
  } else if (kind === 'datepalm') {
    const h = 2.2 + v * 1.4;
    b.beam(0, 0, 0, 0.15, h, 0, 0.22, C('#5a4a3a'), PRIM.cyl4);
    for (let i = 0; i < 6; i++) frond(0.15, h, 0, i / 6 * TAU, 0.55, 2.2, 0.4, shade('#4a6a35', i % 2 ? 1 : 1.1));
  } else if (kind === 'shrub') {
    b.sphere(0.6, -0.2, 0.5, 0.1, C(v ? '#556f2c' : '#4a6a30'), PRIM.ico0, 1, 0.8, 1);
    b.sphere(0.5, 0.3, 0.45, -0.2, shade(v ? '#556f2c' : '#4a6a30', 0.9), PRIM.ico0, 1, 0.8, 1);
  } else if (kind === 'calotropis') {
    b.sphere(0.55, -0.2, 0.9, 0, C('#8fa08a'), PRIM.ico0, 1, 0.7, 1);
    b.sphere(0.45, 0.3, 1.0, 0.2, shade('#8fa08a', 0.92), PRIM.ico0, 1, 0.7, 1);
  }
  return b.build();
}
const TREE_NEAR = { LOW: 55, MEDIUM: 85, HIGH: 130, ULTRA: 200, CINEMATIC: 260 };
const _vegFw = new THREE.Vector3();

const Veg = {
  REGION: 320, lists: {}, meshes: [], fixed: [],
  add(kind, x, z, s = 1, rot = null) {
    (this.lists[kind] || (this.lists[kind] = [])).push({ x, z, s, r: rot === null ? RNG() * TAU : rot, v: RNG() < 0.5 ? 0 : 1, c: 0.86 + RNG() * 0.26 });
    const cr = TREE_COLLIDE[kind];
    if (cr) World.addCollider(x, z, cr * s, cr * s, 0, 6, 'tree');
    World.occSet(x, z, OCC.KEEP);
  },
  canPlace(x, z, spacing = 2) {
    if (Math.abs(x) > WORLD_HALF - 20 || Math.abs(z) > WORLD_HALF - 20) return false;
    const o = World.occGet(x, z);
    if (o !== OCC.FREE && o !== OCC.VILLAGE && o !== OCC.ROCK) return false;
    if (fieldAt(x, z)) return false;
    if (spacing > 2) { for (const [dx, dz] of [[spacing, 0], [-spacing, 0], [0, spacing], [0, -spacing]]) { const q = World.occGet(x + dx, z + dz); if (q === OCC.BUILD || q === OCC.ROAD || q === OCC.WATER) return false; } }
    return true;
  },
  scatter() {
    const R = RNG;
    // fixed landmark trees handled by village builder via Veg.add
    // palms along field edges
    for (const f of World.fields) {
      if (R() < 0.55) {
        const edge = Math.floor(R() * 4); const n = Math.floor(f.w / 14) + 1;
        for (let i = 0; i < n; i++) {
          const t = (i + 0.5 + (R() - 0.5) * 0.5) / n;
          let x, z;
          if (edge === 0) { x = lerp(f.x0, f.x1, t); z = f.z0 - 1.6; } else if (edge === 1) { x = lerp(f.x0, f.x1, t); z = f.z1 + 1.6; } else if (edge === 2) { x = f.x0 - 1.6; z = lerp(f.z0, f.z1, t); } else { x = f.x1 + 1.6; z = lerp(f.z0, f.z1, t); }
          if (R() < 0.65 && this.canPlace(x, z)) this.add(R() < 0.8 ? 'palm' : 'neem', x, z, 0.8 + R() * 0.45);
        }
      }
      if (R() < 0.18) { // eucalyptus row
        const n = Math.floor(f.d / 5);
        for (let i = 0; i < n; i++) { const x = f.x1 + 1.6, z = f.z0 + 2 + i * 5; if (this.canPlace(x, z)) this.add('eucalyptus', x, z, 0.85 + R() * 0.3); }
      }
      if (R() < 0.5) { const x = R() < 0.5 ? f.x0 - 1.5 : f.x1 + 1.5, z = lerp(f.z0, f.z1, R()); if (this.canPlace(x, z)) this.add('shrub', x, z, 0.8 + R() * 0.6); }
    }
    // orchard grid
    for (let x = ORCHARD.x0 + 5; x < ORCHARD.x1 - 3; x += 9) for (let z = ORCHARD.z0 + 5; z < ORCHARD.z1 - 3; z += 9) this.add('mango', x + (R() - 0.5) * 1.2, z + (R() - 0.5) * 1.2, 0.9 + R() * 0.25);
    World.occRect(ORCHARD.x0, ORCHARD.z0, ORCHARD.x1, ORCHARD.z1, OCC.KEEP);
    // road avenues (neem / tamarind)
    for (const r of ROADS) {
      if (r.kind === 'hwy' || r.kind === 'village') continue;
      const P = r.samples; let acc = 0;
      for (let i = 1; i < P.length; i++) {
        acc += 3; if (acc < 16 + R() * 18) continue; acc = 0;
        const a = P[i - 1], c = P[i]; const tx = c.x - a.x, tz = c.z - a.z, tl = Math.hypot(tx, tz) || 1;
        const side = R() < 0.5 ? -1 : 1; const off = r.w / 2 + 3.5 + R() * 2;
        const x = c.x - tz / tl * off * side, z = c.z + tx / tl * off * side;
        if (this.canPlace(x, z, 3)) this.add(R() < 0.7 ? 'neem' : 'tamarind', x, z, 0.8 + R() * 0.4);
      }
    }
    // highway median shrubs (oleander) & eucalyptus
    for (let z = -880; z < 880; z += 7) { this.lists.shrub = this.lists.shrub || []; this.lists.shrub.push({ x: 640 + (R() - 0.5) * 0.4, z, s: 0.7 + R() * 0.2, r: R() * TAU, v: 1, c: 1 }); }
    for (let z = -860; z < 860; z += 22) for (const s of [-1, 1]) { const x = 640 + s * (15 + R() * 4); if (this.canPlace(x, z)) this.add(R() < 0.6 ? 'eucalyptus' : 'neem', x, z, 0.8 + R() * 0.3); }
    // lake shore
    for (let i = 0; i < 90; i++) {
      const a = R() * TAU; const rr = lakeRadius(a) + 8 + R() * 18;
      const x = LAKE.x + Math.cos(a) * rr, z = LAKE.z + Math.sin(a) * rr;
      if (this.canPlace(x, z)) this.add(R() < 0.5 ? 'palm' : R() < 0.5 ? 'datepalm' : 'shrub', x, z, 0.8 + R() * 0.5);
    }
    // canal side date palms
    for (let i = 0; i < CANAL.samples.length; i += 5) { if (R() < 0.45) { const p = CANAL.samples[i]; const x = p.x + (R() < 0.5 ? -4 : 4), z = p.z + (R() - 0.5) * 3; if (this.canPlace(x, z)) this.add(R() < 0.6 ? 'datepalm' : 'palm', x, z, 0.8 + R() * 0.4); } }
    // village trees
    for (let i = 0; i < 260; i++) {
      const a = R() * TAU, d = Math.sqrt(R()) * 165; const x = VILLAGE.x + Math.cos(a) * d, z = VILLAGE.z + Math.sin(a) * d;
      if (this.canPlace(x, z, 3)) this.add(pick(['neem', 'neem', 'tamarind', 'mango', 'palm', 'shrub']), x, z, 0.8 + R() * 0.4);
    }
    for (let i = 0; i < 60; i++) {
      const a = R() * TAU, d = Math.sqrt(R()) * 85; const x = SEETHA.x + Math.cos(a) * d, z = SEETHA.z + Math.sin(a) * d;
      if (this.canPlace(x, z, 3)) this.add(pick(['neem', 'tamarind', 'palm', 'palm', 'shrub']), x, z, 0.8 + R() * 0.4);
    }
    // wild scatter (grassland, hills, edges)
    for (let i = 0; i < 5200; i++) {
      const x = (R() - 0.5) * 2 * (WORLD_HALF - 30), z = (R() - 0.5) * 2 * (WORLD_HALF - 30);
      if (!this.canPlace(x, z)) continue;
      const h = World.groundHeight(x, z);
      const hilly = h > 5 || Math.max(Math.abs(x), Math.abs(z)) > 700;
      const pr = hilly ? 0.5 : 0.22;
      if (R() > pr) continue;
      const k = hilly ? pick(['shrub', 'shrub', 'calotropis', 'neem', 'palm', 'datepalm']) : pick(['palm', 'palm', 'shrub', 'calotropis', 'neem', 'tamarind', 'eucalyptus']);
      this.add(k, x, z, 0.75 + R() * 0.5);
    }
  },
  // One instanced mesh per kind and variant for nearby trees and one for the low-poly ones.
  // updateVisibility() refills them from the camera position, so only trees in view are drawn.
  build() {
    this.geoms = {}; this.lodGeoms = {};
    for (const k of TREE_KINDS) { this.geoms[k] = [treeGeometry(k, 0), treeGeometry(k, 1)]; this.lodGeoms[k] = [treeLodGeometry(k, 0), treeLodGeometry(k, 1)]; }
    const dummy = new THREE.Object3D(); const colr = new THREE.Color();
    this.sets = []; this.meshes = [];
    for (const kind in this.lists) for (const v of [0, 1]) {
      const arr = this.lists[kind].filter((t) => t.v === v); if (!arr.length) continue;
      // shuffle so the quality preset can trim the list from the end
      for (let i = arr.length - 1; i > 0; i--) { const j = Math.floor(hash2(i, arr.length) * (i + 1)); [arr[i], arr[j]] = [arr[j], arr[i]]; }
      const n = arr.length; const small = kind === 'shrub' || kind === 'calotropis';
      const S = { kind, v, small, n, fixed: kind === 'banyan', xs: new Float32Array(n), zs: new Float32Array(n), mats: new Float32Array(n * 16), cols: new Float32Array(n * 3) };
      arr.forEach((t, i) => {
        dummy.position.set(t.x, World.groundHeight(t.x, t.z) - 0.15, t.z); dummy.rotation.set(0, t.r, 0); dummy.scale.setScalar(t.s); dummy.updateMatrix();
        dummy.matrix.toArray(S.mats, i * 16);
        colr.setRGB(t.c, t.c * (0.97 + hash2(i, 3) * 0.06), t.c * 0.95);
        S.cols[i * 3] = colr.r; S.cols[i * 3 + 1] = colr.g; S.cols[i * 3 + 2] = colr.b;
        S.xs[i] = t.x; S.zs[i] = t.z;
      });
      const mat = kind === 'palm' || kind === 'datepalm' ? MAT.foliageDS : MAT.foliage;
      const mk = (geo, shadow, lod) => {
        const m = new THREE.InstancedMesh(geo, mat, n);
        m.instanceMatrix.setUsage(THREE.DynamicDrawUsage); m.setColorAt(0, colr); m.instanceColor.setUsage(THREE.DynamicDrawUsage);
        m.count = 0; m.visible = false; m.frustumCulled = false; m.castShadow = shadow; m.receiveShadow = true;
        m.name = kind + (lod ? ':lod' : ''); m.userData = { kind, small, lod };
        G.scene.add(m); this.meshes.push(m); return m;
      };
      S.near = mk(this.geoms[kind][v], !small, false);
      S.far = mk(this.lodGeoms[kind][v], false, true);
      this.sets.push(S);
    }
    this.dirty = true;
    this.buildGrass();
  },
  onPreset(P) {
    this.dirty = true;
    if (this.grass) { this.grass.visible = P.grass > 0; this.grassCount = Math.floor(this.grassMax * P.grass); this.lastGrass = null; }
  },
  updateVisibility(cam) {
    if (!this.sets) return;
    const P = G.preset; const camera = G.camera;
    _vegFw.set(0, 0, -1).applyQuaternion(camera.quaternion);
    let fx = _vegFw.x, fz = _vegFw.z; const fl = Math.hypot(fx, fz); const look = fl > 0.25; if (look) { fx /= fl; fz /= fl; }
    const yaw = Math.atan2(fx, fz);
    const L = this.lu;
    if (!this.dirty && L && Math.hypot(cam.x - L.x, cam.z - L.z) < 8 && Math.abs(angleDiff(yaw, L.yaw)) < 0.2 && L.aspect === camera.aspect) return;
    this.lu = { x: cam.x, z: cam.z, yaw, aspect: camera.aspect }; this.dirty = false;
    const D = P.drawDist * (P.lite ? 0.8 : 0.95), NEAR = TREE_NEAR[P.id] || 90;
    const halfH = Math.atan(Math.tan(camera.fov * Math.PI / 360) * camera.aspect);
    const cosLim = Math.cos(Math.min(Math.PI, halfH + 0.45));
    const keep2 = Math.max(30, P.shadows ? P.shadowRange : 0) ** 2;   // never cull trees whose shadows can fall into view
    const cx = cam.x, cz = cam.z;
    for (const S of this.sets) {
      const dens = S.fixed ? 1 : S.small ? P.trees * 0.9 : Math.max(0.6, P.trees);
      const act = Math.max(1, Math.round(S.n * dens));
      const Dk = S.small ? D * 0.45 : S.fixed ? D * 1.2 : D, D2 = Dk * Dk, N2 = (S.small ? NEAR * 0.6 : NEAR) ** 2;
      const nm = S.near.instanceMatrix.array, fm = S.far.instanceMatrix.array, nc = S.near.instanceColor.array, fc = S.far.instanceColor.array;
      const xs = S.xs, zs = S.zs, mats = S.mats, cols = S.cols;
      let nn = 0, nf = 0;
      for (let i = 0; i < act; i++) {
        const dx = xs[i] - cx, dz = zs[i] - cz, d2 = dx * dx + dz * dz;
        if (d2 > D2) continue;
        if (look && d2 > keep2 && dx * fx + dz * fz < Math.sqrt(d2) * cosLim) continue;
        const near = d2 < N2;
        const o = near ? nn++ : nf++;
        const dm = near ? nm : fm, dc = near ? nc : fc;
        const s16 = i * 16, d16 = o * 16;
        for (let k = 0; k < 16; k++) dm[d16 + k] = mats[s16 + k];
        dc[o * 3] = cols[i * 3]; dc[o * 3 + 1] = cols[i * 3 + 1]; dc[o * 3 + 2] = cols[i * 3 + 2];
      }
      this.fill(S.near, nn); this.fill(S.far, nf);
    }
  },
  fill(m, n) {
    m.count = n; m.visible = n > 0; if (!n) return;
    const im = m.instanceMatrix, ic = m.instanceColor;
    im.clearUpdateRanges(); im.addUpdateRange(0, n * 16); im.needsUpdate = true;
    ic.clearUpdateRanges(); ic.addUpdateRange(0, n * 3); ic.needsUpdate = true;
  },
  // ---- grass ring around camera ----
  buildGrass() {
    const b = new GeoBuilder();
    const base = C('#3f5f24'), tip = C('#9ab65a');
    for (let i = 0; i < 7; i++) {
      const a = i / 7 * TAU + hash2(i, 9), r = 0.12 + hash2(i, 4) * 0.12, h = 0.35 + hash2(i, 7) * 0.35;
      const x = Math.cos(a) * r, z = Math.sin(a) * r, lx = Math.cos(a) * 0.12 + (hash2(i, 2) - 0.5) * 0.15, lz = Math.sin(a) * 0.12;
      const px = -Math.sin(a) * 0.035, pz = Math.cos(a) * 0.035;
      const v = [x - px, 0, z - pz, x + px, 0, z + pz, x + lx, h, z + lz];
      const n0 = b.n; b.grow(3);
      for (let k = 0; k < 3; k++) { b.pos[(n0 + k) * 3] = v[k * 3]; b.pos[(n0 + k) * 3 + 1] = v[k * 3 + 1]; b.pos[(n0 + k) * 3 + 2] = v[k * 3 + 2]; b.nor[(n0 + k) * 3] = 0; b.nor[(n0 + k) * 3 + 1] = 1; b.nor[(n0 + k) * 3 + 2] = 0; const c = k === 2 ? tip : base; b.col[(n0 + k) * 3] = c.r; b.col[(n0 + k) * 3 + 1] = c.g; b.col[(n0 + k) * 3 + 2] = c.b; }
      b.n += 3;
    }
    this.grassMax = isMobile ? 3500 : 7000;
    const m = new THREE.InstancedMesh(b.build(), MAT.grass, this.grassMax);
    m.frustumCulled = false; m.receiveShadow = true; m.castShadow = false;
    m.count = 0;
    this.grass = m; G.scene.add(m);
    this.grassCount = Math.floor(this.grassMax * G.preset.grass);
    this.lastGrass = null;
    m.visible = G.preset.grass > 0;
  },
  updateGrass(cam) {
    if (!this.grass || !this.grass.visible) return;
    const cx = cam.x, cz = cam.z;
    if (this.lastGrass && Math.hypot(cx - this.lastGrass.x, cz - this.lastGrass.z) < 7) return;
    this.lastGrass = { x: cx, z: cz };
    const R = 46, cell = 1.05; const m = this.grass; const dummy = this._d || (this._d = new THREE.Object3D());
    const colr = new THREE.Color(); let n = 0; const max = this.grassCount;
    const gx0 = Math.floor((cx - R) / cell), gx1 = Math.floor((cx + R) / cell), gz0 = Math.floor((cz - R) / cell), gz1 = Math.floor((cz + R) / cell);
    const N = World.N, step = World.step, half = WORLD_HALF;
    const colAttr = World.terrainMesh.geometry.attributes.color.array;
    const cand = [];
    for (let gz = gz0; gz <= gz1; gz++) for (let gx = gx0; gx <= gx1; gx++) {
      const hx = hash2(gx, gz), hz = hash2(gz + 7, gx - 3);
      const x = (gx + hx) * cell, z = (gz + hz) * cell;
      const d2 = (x - cx) * (x - cx) + (z - cz) * (z - cz); if (d2 > R * R) continue;
      const o = World.occGet(x, z); if (o !== OCC.FREE && o !== OCC.KEEP && o !== OCC.VILLAGE) continue;
      if (fieldAt(x, z)) continue;
      const i = clamp(Math.round((x + half) / step), 0, N - 1), j = clamp(Math.round((z + half) / step), 0, N - 1);
      const k = (j * N + i) * 4; const gw = colAttr[k], rock = colAttr[k + 2], dirt = colAttr[k + 3];
      const dens = gw - dirt * 0.8 - rock * 0.9 + (hash2(gx * 3, gz) - 0.5) * 0.4;
      if (dens < 0.35) continue;
      cand.push([d2, x, z, gx, gz]);
    }
    cand.sort((a, b) => a[0] - b[0]);
    for (const c of cand) {
      if (n >= max) break;
      const [, x, z, gx, gz] = c;
      const y = World.groundHeight(x, z);
      dummy.position.set(x, y - 0.02, z); dummy.rotation.set(0, hash2(gx, gz * 5) * TAU, 0);
      const s = 0.55 + hash2(gz, gx * 3) * 0.45; dummy.scale.set(s, s * (0.55 + hash2(gx + 1, gz) * 0.45), s); dummy.updateMatrix();
      m.setMatrixAt(n, dummy.matrix);
      const fl = hash2(gx * 7, gz * 11);
      if (fl > 0.965) colr.set(fl > 0.99 ? '#f2e6ff' : fl > 0.978 ? '#ffd23a' : '#e56b8a'); else { const k = 0.8 + hash2(gx, gz * 2) * 0.4; colr.setRGB(k, k, k * 0.9); }
      m.setColorAt(n, colr);
      n++;
    }
    m.count = n; m.instanceMatrix.needsUpdate = true; if (m.instanceColor) m.instanceColor.needsUpdate = true;
  },
};

// ---------------- boulders (granite tors) ----------------
function addBoulder(x, z, s, stack = 0, yOff = 0) {
  const b = Chunks.get(x, z, 'std');
  const y = World.groundHeight(x, z) + yOff;
  const c = C(pick(['#8f877e', '#9c9389', '#a39a8f', '#877f78', '#a8988a']));
  const sx = s * (0.8 + RNG() * 0.5), sy = s * (0.6 + RNG() * 0.4), sz = s * (0.8 + RNG() * 0.5);
  b.add(RNG() < 0.5 ? PRIM.dodec : PRIM.ico1, b.mat(x, y + sy * 0.38, z, sx, sy, sz, RNG() * TAU, (RNG() - 0.5) * 0.4, (RNG() - 0.5) * 0.4), c, 0.12);
  if (RNG() < 0.4) b.add(PRIM.ico0, b.mat(x + sx * 0.2, y + sy * 0.55, z, sx * 0.5, sy * 0.2, sz * 0.5, RNG() * TAU), C('#6f7a55'), 0.2);
  if (stack > 0) { const s2 = s * (0.55 + RNG() * 0.25); const yy = yOff + sy * 0.72; addBoulder(x + (RNG() - 0.5) * s * 0.3, z + (RNG() - 0.5) * s * 0.3, s2, stack - 1, yy); }
  if (yOff === 0 && s > 1.4) World.addCollider(x, z, sx * 0.42, sz * 0.42, 0, sy, 'rock');
  if (yOff === 0) World.occOBB(x, z, sx * 0.5, sz * 0.5, 0, OCC.ROCK);
}
function scatterBoulders() {
  const R = RNG;
  for (const hl of HILLS) {
    const n = hl.tor ? 26 : Math.floor(hl.r * 0.9);
    for (let i = 0; i < n; i++) {
      const a = R() * TAU, d = Math.sqrt(R()) * hl.r * (hl.tor ? 0.9 : 0.85);
      const x = hl.x + Math.cos(a) * d, z = hl.z + Math.sin(a) * d;
      if (Math.abs(x) > WORLD_HALF - 10 || Math.abs(z) > WORLD_HALF - 10) continue;
      const o = World.occGet(x, z); if (o === OCC.ROAD || o === OCC.BUILD) continue;
      const near = 1 - d / hl.r;
      addBoulder(x, z, (hl.tor ? 1.6 : 1.2) + R() * (hl.tor ? 3.2 : 2.6) * (0.5 + near), R() < (hl.tor ? 0.45 : 0.25) ? (R() < 0.5 ? 1 : 2) : 0);
    }
  }
  // scattered rocks in grassland
  for (let i = 0; i < 160; i++) {
    const x = (R() - 0.5) * 1300, z = (R() - 0.5) * 1300;
    const o = World.occGet(x, z); if (o !== OCC.FREE) continue; if (fieldAt(x, z)) continue;
    if (Math.hypot(x, z) < 180) continue;
    addBoulder(x, z, 0.6 + R() * 1.6, R() < 0.15 ? 1 : 0);
  }
}
