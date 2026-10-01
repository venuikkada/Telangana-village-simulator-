// ============================================================================
// World layout, terrain, roads, water, occupancy grid, colliders
// ============================================================================
const WORLD_HALF = 900;          // terrain extends to +-900 m
const PLAY_HALF = 700;           // player boundary
const VILLAGE = { x: 0, z: 0, r: 150 };
const SEETHA = { x: -430, z: 430, r: 70 };
const TOWN = { x: 555, z: -125, r: 95 };
const YARD = { x: 452, z: 150, w: 110, d: 80 };
const HOME = { x: -130, z: 56 };           // player's house
const HOMESTEAD = { x0: -200, x1: -92, z0: 26, z1: 80 };
const ORCHARD = { x0: 212, x1: 292, z0: 225, z1: 295 };
const LAKE = { x: -272, z: -252, r: 118, floor: -4.2, full: 0.15, low: -2.6 };
const HILLS = [
  { x: -40, z: -575, r: 150, h: 34 }, { x: 170, z: -522, r: 105, h: 31, shrine: true }, { x: 350, z: -615, r: 150, h: 44 }, { x: -330, z: -615, r: 170, h: 40 },
  { x: -650, z: -170, r: 150, h: 36 }, { x: -655, z: 230, r: 165, h: 42 }, { x: 270, z: 650, r: 150, h: 30 }, { x: -130, z: 665, r: 160, h: 36 },
  { x: -530, z: -430, r: 120, h: 28 },
  { x: 222, z: 172, r: 24, h: 4.5, tor: true }, { x: -238, z: 182, r: 20, h: 4, tor: true }, { x: 345, z: -318, r: 28, h: 6, tor: true }, { x: -90, z: 430, r: 26, h: 5, tor: true },
];
function lakeRadius(a) { return LAKE.r + 18 * Math.sin(3 * a + 1.2) + 11 * Math.sin(5 * a + 0.4) + 6 * Math.sin(9 * a + 2.0); }
function lakeSD(x, z) { const dx = x - LAKE.x, dz = z - LAKE.z; return Math.hypot(dx, dz) - lakeRadius(Math.atan2(dz, dx)); }

// Roads: kind -> hwy (4 lane), main (tar), village (lane, CC-upgradable), track (earth)
const ROADS = [
  { id: 'hwy', kind: 'hwy', w: 17, pts: [[640, -900], [640, -300], [640, 300], [640, 900]] },
  { id: 'main', kind: 'main', w: 7, pts: [[-600, 42], [-470, 30], [-330, 18], [-200, 8], [-100, 3], [0, 0], [120, -4], [260, -8], [400, -2], [520, 4], [631, 6]] },
  { id: 'ns', kind: 'village', w: 6, pts: [[4, -440], [-4, -330], [2, -220], [5, -120], [0, 0], [-5, 110], [5, 220], [0, 330], [-4, 400]] },
  { id: 'seetha', kind: 'track', w: 5, pts: [[-200, 8], [-228, 90], [-282, 190], [-338, 290], [-392, 362], [-430, 425]] },
  { id: 'yard', kind: 'main', w: 7, pts: [[400, -2], [406, 50], [420, 104]] },
  { id: 'town', kind: 'main', w: 8, pts: [[631, -125], [580, -125], [535, -125], [490, -128]] },
  { id: 'town2', kind: 'village', w: 6, pts: [[555, -125], [555, -60], [560, -10], [560, 3]] },
  { id: 'lakeRd', kind: 'track', w: 4.5, pts: [[-100, 3], [-122, -55], [-150, -118], [-168, -160]] },
  { id: 'east', kind: 'track', w: 4.5, pts: [[120, -4], [135, 70], [168, 150], [205, 222], [250, 222]] },
  { id: 'north', kind: 'track', w: 4.5, pts: [[2, -220], [110, -205], [230, -212], [320, -262]] },
  { id: 'west', kind: 'track', w: 4.5, pts: [[-100, 3], [-100, 30], [-96, 82], [-120, 140], [-168, 200], [-200, 262]] },
  { id: 'south', kind: 'track', w: 4.5, pts: [[-5, 110], [-80, 130], [-100, 150]] },
  { id: 'shrine', kind: 'track', w: 3.5, pts: [[4, -440], [60, -470], [120, -490], [150, -505]] },
  { id: 'lane1', kind: 'village', w: 4.5, pts: [[-98, 3], [-92, -40], [-58, -72], [0, -84]] },
  { id: 'lane2', kind: 'village', w: 4.5, pts: [[0, -84], [60, -76], [96, -44], [102, -4]] },
  { id: 'lane3', kind: 'village', w: 4.5, pts: [[-5, 60], [-60, 58], [-96, 50]] },
  { id: 'lane4', kind: 'village', w: 4.5, pts: [[5, 55], [60, 60], [98, 40], [118, -3]] },
  { id: 'seethaLane', kind: 'village', w: 4.5, pts: [[-470, 400], [-430, 425], [-390, 452], [-360, 470]] },
];
const CANAL = { pts: [[-160, -166], [-120, -142], [-60, -128], [0, -134], [80, -142], [160, -154], [250, -152], [330, -142], [390, -122]], w: 3.2 };
const FLAT_ZONES = [
  { x: VILLAGE.x, z: VILLAGE.z, r: 175, blend: 70 },
  { x: SEETHA.x, z: SEETHA.z, r: 90, blend: 50 },
  { x: TOWN.x, z: TOWN.z, r: 120, blend: 60 },
  { x: YARD.x, z: YARD.z, r: 80, blend: 50 },
  { x: HOME.x, z: HOME.z, r: 70, blend: 40 },
];

const World = {
  seg: 256, half: WORLD_HALF, fields: [], fieldGrid: new Map(), colliders: [], colGrid: new Map(),
  roadSegs: [], roadGrid: new Map(), heights: null, occ: null, occRes: 2, occN: 0,
  chunks: new Map(), CH: 128,
};

// ---------------- heights ----------------
function naturalHeight(x, z) {
  let h = NZ.fbm(x * 0.0022, z * 0.0022, 3) * 3.2 + NZ2.noise(x * 0.009, z * 0.009) * 0.55;
  for (let i = 0; i < HILLS.length; i++) {
    const hl = HILLS[i];
    const dx = x - hl.x, dz = z - hl.z; const d2 = dx * dx + dz * dz;
    if (d2 < hl.r * hl.r) {
      const t = 1 - Math.sqrt(d2) / hl.r; const s = t * t * (3 - 2 * t);
      h += hl.h * s * (0.72 + 0.4 * NZ2.noise(x * 0.018 + i * 7, z * 0.018));
    }
  }
  const e = Math.max(Math.abs(x), Math.abs(z));
  if (e > 690) { const k = (e - 690) / 210; h += k * k * (x > 600 ? 26 : 70) * (0.75 + 0.35 * NZ.noise(x * 0.008, z * 0.008)); }
  const ld = lakeSD(x, z);
  if (ld < 22) { const bed = LAKE.floor + (ld < -60 ? 0 : (ld + 60) / 60 * 1.4); h = lerp(h, Math.min(h, bed), smoothstep(22, -18, ld)); }
  return h;
}
function zoneHeight(x, z) {
  let h = naturalHeight(x, z);
  for (const zn of FLAT_ZONES) {
    const d = Math.hypot(x - zn.x, z - zn.z);
    if (d < zn.r + zn.blend) {
      if (zn.y === undefined) zn.y = naturalHeightSmooth(zn.x, zn.z);
      const w = 1 - smoothstep(zn.r, zn.r + zn.blend, d);
      h = lerp(h, zn.y + NZ2.noise(x * 0.05, z * 0.05) * 0.08, w);
    }
  }
  // highway corridor smoothing
  const hd = Math.abs(x - 640);
  if (hd < 40) { const w = 1 - smoothstep(14, 40, hd); h = lerp(h, 0.6 + NZ.noise(640 * 0.0022, z * 0.0022) * 1.2, w); }
  return h;
}
function naturalHeightSmooth(x, z) { return NZ.fbm(x * 0.0022, z * 0.0022, 3) * 3.2; }
function heightAt(x, z) {
  let h = zoneHeight(x, z);
  const f = fieldNear(x, z, 20);
  if (f) {
    const dx = Math.max(f.x0 - x, 0, x - f.x1), dz = Math.max(f.z0 - z, 0, z - f.z1);
    const d = Math.hypot(dx, dz);
    const w = 1 - smoothstep(9, 19, d);
    h = lerp(h, f.y - 0.07, w);
  }
  return h;
}
function fieldNear(x, z, margin) {
  const k = ((Math.floor(x / 64)) * 73856093) ^ ((Math.floor(z / 64)) * 19349663);
  const arr = World.fieldGrid.get(k); if (!arr) return null;
  let best = null, bd = 1e9;
  for (const f of arr) {
    const dx = Math.max(f.x0 - x, 0, x - f.x1), dz = Math.max(f.z0 - z, 0, z - f.z1);
    const d = dx + dz; if (d < margin && d < bd) { bd = d; best = f; }
  }
  return best;
}
function fieldAt(x, z) {
  const k = ((Math.floor(x / 64)) * 73856093) ^ ((Math.floor(z / 64)) * 19349663);
  const arr = World.fieldGrid.get(k); if (!arr) return null;
  for (const f of arr) if (x >= f.x0 && x < f.x1 && z >= f.z0 && z < f.z1) return f;
  return null;
}

// ---------------- field layout ----------------
function distToPolyline(x, z, pts) {
  let best = 1e9;
  for (let i = 0; i < pts.length - 1; i++) {
    const ax = pts[i][0], az = pts[i][1], bx = pts[i + 1][0], bz = pts[i + 1][1];
    const vx = bx - ax, vz = bz - az; const l2 = vx * vx + vz * vz;
    let t = l2 > 0 ? ((x - ax) * vx + (z - az) * vz) / l2 : 0; t = clamp01(t);
    const d = Math.hypot(x - (ax + vx * t), z - (az + vz * t)); if (d < best) best = d;
  }
  return best;
}
function rectClearOf(x0, z0, x1, z1) {
  const cx = (x0 + x1) / 2, cz = (z0 + z1) / 2, hw = (x1 - x0) / 2, hd = (z1 - z0) / 2;
  const diag = Math.hypot(hw, hd);
  // roads & canal: sample rect perimeter + interior grid
  const samples = [];
  for (let i = 0; i <= 4; i++) for (let j = 0; j <= 4; j++) samples.push([x0 + (x1 - x0) * i / 4, z0 + (z1 - z0) * j / 4]);
  for (const r of ROADS) {
    if (distToPolyline(cx, cz, r.pts) > diag + r.w + 20) continue;
    for (const s of samples) if (distToPolyline(s[0], s[1], r.pts) < r.w / 2 + 5) return false;
  }
  if (distToPolyline(cx, cz, CANAL.pts) < diag + 12) for (const s of samples) if (distToPolyline(s[0], s[1], CANAL.pts) < 6) return false;
  for (const s of samples) if (lakeSD(s[0], s[1]) < 14) return false;
  for (const hl of HILLS) if (Math.hypot(cx - hl.x, cz - hl.z) < hl.r * (hl.tor ? 1.25 : 0.95) + diag * 0.7) return false;
  const inZone = (zx, zz, r) => Math.hypot(cx - zx, cz - zz) < r + diag * 0.6;
  if (inZone(VILLAGE.x, VILLAGE.z, 158)) return false;
  if (inZone(SEETHA.x, SEETHA.z, 72)) return false;
  if (inZone(TOWN.x, TOWN.z, 130)) return false;
  if (x1 > YARD.x - YARD.w / 2 - 12 && x0 < YARD.x + YARD.w / 2 + 12 && z1 > YARD.z - YARD.d / 2 - 12 && z0 < YARD.z + YARD.d / 2 + 12) return false;
  if (x1 > HOMESTEAD.x0 - 4 && x0 < HOMESTEAD.x1 + 4 && z1 > HOMESTEAD.z0 - 4 && z0 < HOMESTEAD.z1 + 4) return false;
  if (x1 > ORCHARD.x0 - 6 && x0 < ORCHARD.x1 + 6 && z1 > ORCHARD.z0 - 6 && z0 < ORCHARD.z1 + 6) return false;
  if (Math.abs(cx) > 600 || Math.abs(cz) > 600) return false;
  return true;
}
function layoutFields() {
  const R = mulberry32(4242);
  const pk = (a) => a[Math.floor(R() * a.length)];
  const rects = [];
  // player's first field (fixed): 1 acre, 24 x 24 m, right beside the homestead
  rects.push({ x0: -176, z0: 84, x1: -152, z1: 108, fixed: 'F1' });
  // polyhouse plot (1 acre) north of F1; becomes farmable once the polyhouse is built
  rects.push({ x0: -176, z0: 112, x1: -152, z1: 136, fixed: 'GH' });
  const zones = [
    { x0: -440, x1: -206, z0: 40, z1: 340, village: 'ramapuram' },
    { x0: -196, x1: 110, z0: 116, z1: 380, village: 'ramapuram' },
    { x0: 132, x1: 430, z0: 28, z1: 380, village: 'ramapuram' },
    { x0: -150, x1: 400, z0: -350, z1: -60, village: 'ramapuram' },
    { x0: -470, x1: -180, z0: -80, z1: 26, village: 'ramapuram' },
    { x0: -590, x1: -330, z0: 360, z1: 590, village: 'seethampet' },
    { x0: 420, x1: 600, z0: 210, z1: 420, village: 'ramapuram' },
  ];
  for (const zn of zones) {
    let z = zn.z0;
    while (z + 22 < zn.z1) {
      const d = pk([24, 28, 32, 36, 40, 44]);
      let x = zn.x0 + R() * 6;
      while (x + 22 < zn.x1) {
        const w = pk([24, 28, 32, 36, 40, 48, 54]);
        const x1 = Math.min(x + w, zn.x1), z1 = Math.min(z + d, zn.z1);
        const ww = Math.floor((x1 - x) / 2) * 2, dd = Math.floor((z1 - z) / 2) * 2;
        if (ww >= 22 && dd >= 22) {
          const r = { x0: x, z0: z, x1: x + ww, z1: z + dd, village: zn.village };
          let overlaps = false;
          for (const o of rects) if (r.x0 < o.x1 + 3 && r.x1 > o.x0 - 3 && r.z0 < o.z1 + 3 && r.z1 > o.z0 - 3) { overlaps = true; break; }
          if (!overlaps && rectClearOf(r.x0, r.z0, r.x1, r.z1)) rects.push(r);
        }
        x += w + 3 + R() * 3;
      }
      z += d + 3 + R() * 3;
    }
  }
  // build field records
  World.fields = rects.map((r, i) => {
    const cx = (r.x0 + r.x1) / 2, cz = (r.z0 + r.z1) / 2;
    const w = r.x1 - r.x0, d = r.z1 - r.z0;
    const soilN = NZ.fbm(cx * 0.004 + 50, cz * 0.004, 2) + (cx > 60 ? 0.25 : -0.1) + (cz < -60 ? 0.2 : 0);
    return {
      idx: i, id: r.fixed || ('F' + (i + 1)), x0: r.x0, z0: r.z0, x1: r.x1, z1: r.z1, x: cx, z: cz, w, d,
      acres: Math.round((w * d / ACRE_M2) * 10) / 10, y: zoneHeight(cx, cz), soil: soilN > 0.12 ? 'black' : 'red',
      village: r.village || 'ramapuram', canal: distToPolyline(cx, cz, CANAL.pts) < Math.hypot(w, d) / 2 + 14,
    };
  });
  World.fields[0].id = 'F1'; World.fields[0].soil = 'red';
  let num = 2;
  World.fields.forEach((f, i) => { if (i > 0 && !rects[i].fixed) f.id = 'F' + (num++); });
  const gh = World.fields.find((f) => f.id === 'GH'); if (gh) { gh.soil = 'red'; gh.canal = false; }
  // grid
  for (const f of World.fields) {
    for (let gx = Math.floor((f.x0 - 24) / 64); gx <= Math.floor((f.x1 + 24) / 64); gx++)
      for (let gz = Math.floor((f.z0 - 24) / 64); gz <= Math.floor((f.z1 + 24) / 64); gz++) {
        const k = (gx * 73856093) ^ (gz * 19349663);
        let a = World.fieldGrid.get(k); if (!a) World.fieldGrid.set(k, (a = [])); a.push(f);
      }
  }
}

// ---------------- terrain mesh ----------------
World.buildTerrain = function (seg) {
  const N = seg + 1, half = WORLD_HALF, step = (2 * half) / seg;
  this.seg = seg; this.step = step;
  const H = new Float32Array(N * N);
  const pos = new Float32Array(N * N * 3), colA = new Float32Array(N * N * 4);
  for (let j = 0; j < N; j++) {
    const z = -half + j * step;
    for (let i = 0; i < N; i++) {
      const x = -half + i * step;
      const h = heightAt(x, z);
      const k = j * N + i;
      H[k] = h;
      pos[k * 3] = x; pos[k * 3 + 1] = h; pos[k * 3 + 2] = z;
    }
  }
  this.heights = H; this.N = N;
  // slopes & weights
  for (let j = 0; j < N; j++) {
    for (let i = 0; i < N; i++) {
      const k = j * N + i;
      const x = -half + i * step, z = -half + j * step;
      const hL = H[j * N + Math.max(0, i - 1)], hR = H[j * N + Math.min(N - 1, i + 1)], hD = H[Math.max(0, j - 1) * N + i], hU = H[Math.min(N - 1, j + 1) * N + i];
      const slope = Math.hypot(hR - hL, hU - hD) / (2 * step);
      const h = H[k];
      let grass = 0.45 + NZ.fbm(x * 0.012 + 9, z * 0.012, 3) * 0.9;
      let red = clamp01(0.55 + NZ.fbm(x * 0.004 + 50, z * 0.004, 2) * -1.6 + (x > 60 ? -0.35 : 0.1) + (z < -60 ? -0.25 : 0));
      let rock = clamp01((slope - 0.22) * 3.2) + (h > 9 ? clamp01((h - 9) / 10) * 0.55 : 0);
      let dirt = 0;
      for (const zn of FLAT_ZONES) { const d = Math.hypot(x - zn.x, z - zn.z); dirt = Math.max(dirt, 1 - smoothstep(zn.r * 0.55, zn.r * 0.95, d)); }
      if (x > HOMESTEAD.x0 && x < HOMESTEAD.x1 && z > HOMESTEAD.z0 && z < HOMESTEAD.z1) dirt = Math.max(dirt, 0.7);
      const ld = lakeSD(x, z);
      if (ld < 12 && ld > -30) { grass = Math.max(grass, 0.2 + smoothstep(-30, 5, ld) * 0.6); dirt *= 0.4; }
      if (ld < -8) { grass = 0; red = 0.2; }
      for (const hl of HILLS) if (hl.tor && Math.hypot(x - hl.x, z - hl.z) < hl.r * 0.9) rock = Math.max(rock, 0.65);
      if (Math.max(Math.abs(x), Math.abs(z)) > 700) grass = Math.min(1, grass + 0.25);
      colA[k * 4] = clamp01(grass); colA[k * 4 + 1] = red; colA[k * 4 + 2] = clamp01(rock); colA[k * 4 + 3] = clamp01(dirt);
    }
  }
  const idx = new Uint32Array(seg * seg * 6);
  let p = 0;
  for (let j = 0; j < seg; j++) for (let i = 0; i < seg; i++) {
    const a = j * N + i, b = (j + 1) * N + i, c = (j + 1) * N + i + 1, d = j * N + i + 1;
    // triangles: (a,b,d) & (b,c,d)  -> diagonal b-d
    idx[p++] = a; idx[p++] = b; idx[p++] = d; idx[p++] = b; idx[p++] = c; idx[p++] = d;
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  g.setAttribute('color', new THREE.BufferAttribute(colA, 4));
  g.setIndex(new THREE.BufferAttribute(idx, 1));
  g.computeVertexNormals();
  // Split into square tiles that share the vertex buffers, so the camera only draws the tiles it can see.
  for (const t of this.terrainTiles || []) G.scene.remove(t);
  this.terrainTiles = [];
  const T = isMobile ? 6 : 4, per = Math.ceil(seg / T);
  for (let ty = 0; ty < T; ty++) for (let tx = 0; tx < T; tx++) {
    const i0 = tx * per, i1 = Math.min(seg, i0 + per), j0 = ty * per, j1 = Math.min(seg, j0 + per);
    if (i1 <= i0 || j1 <= j0) continue;
    const ti = new Uint32Array((i1 - i0) * (j1 - j0) * 6); let q = 0, hmin = 1e9, hmax = -1e9;
    for (let j = j0; j < j1; j++) for (let i = i0; i < i1; i++) {
      const a = j * N + i, b = (j + 1) * N + i, c = (j + 1) * N + i + 1, d = j * N + i + 1;
      ti[q++] = a; ti[q++] = b; ti[q++] = d; ti[q++] = b; ti[q++] = c; ti[q++] = d;
      const ha = H[a]; if (ha < hmin) hmin = ha; if (ha > hmax) hmax = ha;
    }
    const tg = new THREE.BufferGeometry();
    tg.setAttribute('position', g.attributes.position); tg.setAttribute('normal', g.attributes.normal); tg.setAttribute('color', g.attributes.color);
    tg.setIndex(new THREE.BufferAttribute(ti, 1));
    const cx = -half + (i0 + i1) / 2 * step, cz = -half + (j0 + j1) / 2 * step;
    tg.boundingSphere = new THREE.Sphere(new THREE.Vector3(cx, (hmin + hmax) / 2, cz), Math.hypot((i1 - i0) * step / 2, (j1 - j0) * step / 2, (hmax - hmin) / 2 + 3));
    const m = new THREE.Mesh(tg, MAT.terrain);
    m.receiveShadow = true; m.castShadow = false; m.name = 'terrain'; m.matrixAutoUpdate = false;
    G.scene.add(m); this.terrainTiles.push(m);
  }
  this.terrainMesh = { geometry: g };   // full geometry: colour weights for grass and the map
};
// exact height on terrain mesh surface
World.groundHeight = function (x, z) {
  const N = this.N, step = this.step, half = WORLD_HALF;
  if (!this.heights) return heightAt(x, z);
  let fx = (x + half) / step, fz = (z + half) / step;
  fx = clamp(fx, 0, N - 1.001); fz = clamp(fz, 0, N - 1.001);
  const i = Math.floor(fx), j = Math.floor(fz); const u = fx - i, v = fz - j;
  const H = this.heights;
  const h00 = H[j * N + i], h10 = H[j * N + i + 1], h01 = H[(j + 1) * N + i], h11 = H[(j + 1) * N + i + 1];
  // diagonal from (i, j+1) to (i+1, j): u + v <= 1 -> triangle (00,01,10)
  if (u + v <= 1) return h00 + (h10 - h00) * u + (h01 - h00) * v;
  return h11 + (h01 - h11) * (1 - u) + (h10 - h11) * (1 - v);
};
World.normalAt = function (x, z, out) {
  const e = 1.2;
  const hx = this.groundHeight(x + e, z) - this.groundHeight(x - e, z);
  const hz = this.groundHeight(x, z + e) - this.groundHeight(x, z - e);
  return out.set(-hx, 2 * e, -hz).normalize();
};

// ---------------- occupancy grid (2 m cells) ----------------
const OCC = { FREE: 0, ROAD: 1, FIELD: 2, BUILD: 3, WATER: 4, VILLAGE: 5, ROCK: 6, BUND: 7, CANAL: 8, KEEP: 9 };
World.initOcc = function () {
  const res = this.occRes; const n = Math.ceil((2 * PLAY_HALF + 200) / res); this.occN = n; this.occOff = PLAY_HALF + 100;
  this.occ = new Uint8Array(n * n);
};
World.occIdx = function (x, z) { const i = Math.floor((x + this.occOff) / this.occRes), j = Math.floor((z + this.occOff) / this.occRes); if (i < 0 || j < 0 || i >= this.occN || j >= this.occN) return -1; return j * this.occN + i; };
World.occGet = function (x, z) { const k = this.occIdx(x, z); return k < 0 ? OCC.KEEP : this.occ[k]; };
World.occSet = function (x, z, v) { const k = this.occIdx(x, z); if (k >= 0) this.occ[k] = v; };
World.occRect = function (x0, z0, x1, z1, v, onlyIfFree = false) {
  for (let z = z0; z <= z1; z += this.occRes) for (let x = x0; x <= x1; x += this.occRes) { const k = this.occIdx(x, z); if (k >= 0 && (!onlyIfFree || this.occ[k] === 0)) this.occ[k] = v; }
};
World.occOBB = function (cx, cz, hw, hd, rot, v, pad = 0) {
  const c = Math.cos(rot), s = Math.sin(rot); const R = Math.hypot(hw, hd) + pad;
  for (let z = cz - R; z <= cz + R; z += this.occRes) for (let x = cx - R; x <= cx + R; x += this.occRes) {
    const dx = x - cx, dz = z - cz; const lx = dx * c - dz * s, lz = dx * s + dz * c;
    if (Math.abs(lx) <= hw + pad && Math.abs(lz) <= hd + pad) this.occSet(x, z, v);
  }
};

// ---------------- colliders (oriented boxes) ----------------
World.addCollider = function (x, z, hw, hd, rot = 0, h = 3, kind = 'b') {
  const c = { x, z, hw, hd, rot, h, kind, cos: Math.cos(rot), sin: Math.sin(rot), r: Math.hypot(hw, hd) };
  this.colliders.push(c);
  const R = c.r;
  for (let gx = Math.floor((x - R) / 16); gx <= Math.floor((x + R) / 16); gx++)
    for (let gz = Math.floor((z - R) / 16); gz <= Math.floor((z + R) / 16); gz++) {
      const k = (gx * 73856093) ^ (gz * 19349663);
      let a = this.colGrid.get(k); if (!a) this.colGrid.set(k, (a = [])); a.push(c);
    }
  return c;
};
World.removeCollider = function (c) {
  const i = this.colliders.indexOf(c); if (i >= 0) this.colliders.splice(i, 1);
  for (const a of this.colGrid.values()) { const j = a.indexOf(c); if (j >= 0) a.splice(j, 1); }
};
// push a circle out of colliders; returns true if collided. out: {x,z}
World.collideCircle = function (p, r, out) {
  let hit = false;
  const k = (Math.floor(p.x / 16) * 73856093) ^ (Math.floor(p.z / 16) * 19349663);
  const cands = this.colGrid.get(k);
  if (!cands) return false;
  for (let iter = 0; iter < 2; iter++) {
    for (const c of cands) {
      const dx = p.x - c.x, dz = p.z - c.z;
      if (dx * dx + dz * dz > (c.r + r) * (c.r + r)) continue;
      // local coords
      const lx = dx * c.cos - dz * c.sin, lz = dx * c.sin + dz * c.cos;
      const qx = clamp(lx, -c.hw, c.hw), qz = clamp(lz, -c.hd, c.hd);
      let ex = lx - qx, ez = lz - qz; let d = Math.hypot(ex, ez);
      if (d < r) {
        hit = true;
        if (d < 1e-5) { // inside: push along smallest axis
          const px = c.hw - Math.abs(lx), pz = c.hd - Math.abs(lz);
          if (px < pz) { ex = Math.sign(lx) || 1; ez = 0; d = 0; const push = px + r; const wlx = ex * push, wlz = 0; p.x += wlx * c.cos + wlz * c.sin; p.z += -wlx * c.sin + wlz * c.cos; }
          else { ez = Math.sign(lz) || 1; ex = 0; const push = pz + r; const wlx = 0, wlz = ez * push; p.x += wlx * c.cos + wlz * c.sin; p.z += -wlx * c.sin + wlz * c.cos; }
        } else {
          const push = (r - d) / d; const wlx = ex * push, wlz = ez * push;
          p.x += wlx * c.cos + wlz * c.sin; p.z += -wlx * c.sin + wlz * c.cos;
        }
      }
    }
  }
  if (out) { out.x = p.x; out.z = p.z; }
  return hit;
};

// ---------------- roads ----------------
function smoothPath(pts, spacing) {
  const v = pts.map((p) => new THREE.Vector3(p[0], 0, p[1]));
  if (v.length === 2) {
    const out = []; const L = v[0].distanceTo(v[1]); const n = Math.max(2, Math.ceil(L / spacing));
    for (let i = 0; i <= n; i++) out.push(new THREE.Vector3().lerpVectors(v[0], v[1], i / n));
    return out;
  }
  const curve = new THREE.CatmullRomCurve3(v, false, 'centripetal', 0.5);
  const L = curve.getLength(); const n = Math.max(2, Math.ceil(L / spacing));
  return curve.getSpacedPoints(n);
}
const ROAD_STYLE = {
  hwy: { c: '#4a4a4c', edge: '#8a7d6a', sh: 1.6, y: 0.1 },
  main: { c: '#56534f', edge: '#9a8467', sh: 1.1, y: 0.09 },
  village: { c: '#a07d58', edge: '#a88a66', sh: 0.8, y: 0.08, cc: '#a9a59c' },
  track: { c: '#94704f', edge: '#8f7658', sh: 0.8, y: 0.075 },
};
World.buildRoads = function () {
  // all roads go into two merged meshes (village lanes separately, so they can be recoloured as CC roads)
  const groups = { village: { pos: [], colr: [], idx: [], roads: [] }, other: { pos: [], colr: [], idx: [], roads: [] } };
  for (const r of ROADS) {
    const st = ROAD_STYLE[r.kind];
    const P = smoothPath(r.pts, 3);
    r.samples = P;
    const G2 = groups[r.kind === 'village' ? 'village' : 'other']; G2.roads.push(r);
    const { pos, colr, idx } = G2; const base = pos.length / 3;
    const cMain = col(st.c), cEdge = col(st.edge);
    const offs = [-r.w / 2 - st.sh, -r.w / 2, r.w / 2, r.w / 2 + st.sh];
    for (let i = 0; i < P.length; i++) {
      const a = P[Math.max(0, i - 1)], b = P[Math.min(P.length - 1, i + 1)];
      const tx = b.x - a.x, tz = b.z - a.z; const tl = Math.hypot(tx, tz) || 1;
      const nx = -tz / tl, nz = tx / tl;
      for (let k = 0; k < 4; k++) {
        const x = P[i].x + nx * offs[k], z = P[i].z + nz * offs[k];
        const y = this.groundHeight(x, z) + (k === 0 || k === 3 ? st.y - 0.03 : st.y);
        pos.push(x, y, z);
        const cc = k === 0 || k === 3 ? cEdge : cMain;
        const j = 0.93 + hash2(i * 7 + k, r.w * 13) * 0.12;
        colr.push(cc.r * j, cc.g * j, cc.b * j);
      }
      if (i > 0) {
        const b0 = base + (i - 1) * 4, b1 = base + i * 4;
        for (let k = 0; k < 3; k++) { idx.push(b0 + k, b1 + k, b0 + k + 1, b1 + k, b1 + k + 1, b0 + k + 1); }
      }
      // segments for lookup
      if (i > 0) {
        const s = { ax: P[i - 1].x, az: P[i - 1].z, bx: P[i].x, bz: P[i].z, w: r.w, kind: r.kind, road: r };
        this.roadSegs.push(s);
        const gx0 = Math.floor(Math.min(s.ax, s.bx) / 32) - 1, gx1 = Math.floor(Math.max(s.ax, s.bx) / 32) + 1;
        const gz0 = Math.floor(Math.min(s.az, s.bz) / 32) - 1, gz1 = Math.floor(Math.max(s.az, s.bz) / 32) + 1;
        for (let gx = gx0; gx <= gx1; gx++) for (let gz = gz0; gz <= gz1; gz++) {
          const kk = (gx * 73856093) ^ (gz * 19349663);
          let arr = this.roadGrid.get(kk); if (!arr) this.roadGrid.set(kk, (arr = [])); arr.push(s);
        }
      }
      // occupancy
      for (let o = -r.w / 2 - 1; o <= r.w / 2 + 1; o += 1.5) this.occSet(P[i].x + nx * o, P[i].z + nz * o, OCC.ROAD);
    }
  }
  for (const key of ['other', 'village']) {
    const G2 = groups[key]; if (!G2.pos.length) continue;
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(G2.pos, 3));
    g.setAttribute('color', new THREE.Float32BufferAttribute(G2.colr, 3));
    g.setIndex(G2.idx); g.computeVertexNormals();
    const m = new THREE.Mesh(g, MAT.road);
    m.receiveShadow = true; m.name = 'roads:' + key; m.userData.roads = G2.roads;
    if (key === 'village') this.villageRoadMeshes = [m];
    G.scene.add(m);
  }
  this.buildHighwayMarkings();
};
World.setCCRoads = function (on) {
  (this.villageRoadMeshes || []).forEach((m) => {
    const c = m.geometry.attributes.color;
    const st = ROAD_STYLE.village; const main = col(on ? st.cc : st.c), edge = col(on ? '#8f8a80' : st.edge);
    for (let i = 0; i < c.count; i++) { const k = i % 4; const cc = k === 0 || k === 3 ? edge : main; const j = 0.94 + hash2(i, 5) * 0.1; c.setXYZ(i, cc.r * j, cc.g * j, cc.b * j); }
    c.needsUpdate = true;
    for (const r of m.userData.roads) r.kind = on ? 'cc' : 'village';
  });
  for (const s of this.roadSegs) if (s.road.kind === 'cc' || (s.kind === 'village' && on)) s.kind = on ? 'cc' : 'village';
};
World.buildHighwayMarkings = function () {
  const pos = [], colr = [];
  const white = col('#e8e6df'), yellow = col('#d9b43a');
  const addQuad = (x0, z0, x1, z1, w, c) => {
    const tx = x1 - x0, tz = z1 - z0, l = Math.hypot(tx, tz); const nx = -tz / l * w / 2, nz = tx / l * w / 2;
    const y0 = this.groundHeight(x0, z0) + 0.13, y1 = this.groundHeight(x1, z1) + 0.13;
    const v = [[x0 - nx, y0, z0 - nz], [x1 - nx, y1, z1 - nz], [x1 + nx, y1, z1 + nz], [x0 + nx, y0, z0 + nz]];
    for (const t of [0, 1, 2, 0, 2, 3]) { pos.push(...v[t]); colr.push(c.r, c.g, c.b); }
  };
  // highway: median + lane dashes
  for (let z = -890; z < 890; z += 12) {
    addQuad(640 - 4.2, z, 640 - 4.2, z + 5, 0.18, white);
    addQuad(640 + 4.2, z, 640 + 4.2, z + 5, 0.18, white);
  }
  for (let z = -890; z < 890; z += 20) { addQuad(640 - 8.1, z, 640 - 8.1, z + 20, 0.16, yellow); addQuad(640 + 8.1, z, 640 + 8.1, z + 20, 0.16, yellow); }
  // main road centre dashes
  const main = ROADS.find((r) => r.id === 'main');
  const P = main.samples;
  for (let i = 0; i < P.length - 2; i += 4) addQuad(P[i].x, P[i].z, P[i + 1].x, P[i + 1].z, 0.14, white);
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('color', new THREE.Float32BufferAttribute(colr, 3));
  g.computeVertexNormals();
  const m = new THREE.Mesh(g, MAT.road); m.receiveShadow = true;
  G.scene.add(m);
};
World.roadAt = function (x, z) {
  const k = (Math.floor(x / 32) * 73856093) ^ (Math.floor(z / 32) * 19349663);
  const arr = this.roadGrid.get(k); if (!arr) return null;
  let best = null, bd = 1e9;
  for (const s of arr) {
    const vx = s.bx - s.ax, vz = s.bz - s.az; const l2 = vx * vx + vz * vz;
    const t = clamp01(((x - s.ax) * vx + (z - s.az) * vz) / (l2 || 1));
    const d = Math.hypot(x - (s.ax + vx * t), z - (s.az + vz * t));
    if (d < s.w / 2 + 0.6 && d < bd) { bd = d; best = s; }
  }
  return best;
};
World.surfaceAt = function (x, z) {
  const r = this.roadAt(x, z);
  if (r) return r.kind === 'hwy' || r.kind === 'main' ? 'asphalt' : r.kind === 'cc' ? 'concrete' : 'dirt';
  if (fieldAt(x, z)) return 'field';
  const o = this.occGet(x, z);
  if (o === OCC.WATER) return 'water';
  if (o === OCC.VILLAGE) return 'dirt';
  return 'grass';
};

// ---------------- water ----------------
const WATER_VS = /* glsl */`varying vec3 vW; varying float vFogD; void main(){ vec4 wp = modelMatrix*vec4(position,1.0); vW = wp.xyz; vec4 mv = viewMatrix*wp; vFogD = -mv.z; gl_Position = projectionMatrix*mv; }`;
const WATER_FS = /* glsl */`
uniform vec3 uSkyTop, uSkyHor, uSunDir, uSunCol, uDeep, uShallow;
uniform float uTime, uRain, uSunVis, uLevel, uUseDepth, uFlow, uAlpha, uGlowNight;
uniform sampler2D tDepth; uniform vec4 uDepthRect;
uniform vec3 fogColor; uniform float fogDensity;
varying vec3 vW; varying float vFogD;
float wh(vec2 p){ p = fract(p*vec2(123.34, 456.21)); p += dot(p, p+45.32); return fract(p.x*p.y); }
float wn(vec2 p){ vec2 i=floor(p); vec2 f=fract(p); vec2 u=f*f*(3.0-2.0*f); return mix(mix(wh(i),wh(i+vec2(1.0,0.0)),u.x), mix(wh(i+vec2(0.0,1.0)),wh(i+vec2(1.0,1.0)),u.x), u.y); }
float hgt(vec2 p){
  vec2 fl = vec2(uFlow*uTime*0.8, 0.0);
  float h = sin(p.x*0.35 + uTime*1.1)*0.08 + sin(p.y*0.29 - uTime*0.9 + p.x*0.1)*0.07;
  h += (wn(p*0.9 + fl + uTime*0.25) - 0.5)*0.22 + (wn(p*2.3 - fl*1.3 - uTime*0.35) - 0.5)*0.1;
  h += uRain * (wn(p*7.0 + floor(uTime*9.0)*3.1) - 0.5) * 0.12;
  return h;
}
void main(){
  vec2 p = vW.xz;
#ifdef TVS_LITE
  // phones: analytic slope of the swell plus one ripple lookup
  float sa = p.x*0.35 + uTime*1.1, sb = p.y*0.29 - uTime*0.9 + p.x*0.1;
  float rip = wn(p*2.3 - uTime*0.35) - 0.5;
  vec3 n = normalize(vec3(-(cos(sa)*0.028 + cos(sb)*0.007 + rip*0.09)*1.3, 1.0, -(cos(sb)*0.0203 + rip*0.07)*1.3));
#else
  float e = 0.15;
  float h0 = hgt(p), hx = hgt(p + vec2(e, 0.0)), hz = hgt(p + vec2(0.0, e));
  vec3 n = normalize(vec3((h0 - hx) * 1.3, e, (h0 - hz) * 1.3));
#endif
  vec3 V = normalize(cameraPosition - vW);
  float ndv = max(dot(n, V), 0.0);
  float fres = 0.03 + 0.97 * pow(1.0 - ndv, 5.0);
  vec3 R = reflect(-V, n);
  vec3 sky = mix(uSkyHor, uSkyTop, pow(clamp(R.y, 0.0, 1.0), 0.5));
  float depth = 2.5;
  if (uUseDepth > 0.5) { vec2 uv = (p - uDepthRect.xy) / uDepthRect.zw; depth = uLevel - texture2D(tDepth, uv).r; }
  vec3 water = mix(uShallow, uDeep, smoothstep(0.0, 2.6, depth));
  vec3 c = mix(water, sky, clamp(fres * 0.9, 0.0, 1.0));
  float spec = pow(max(dot(R, uSunDir), 0.0), 220.0) * 7.0 * uSunVis + pow(max(dot(R, uSunDir), 0.0), 18.0) * 0.12 * uSunVis;
  c += uSunCol * spec;
  float a = uAlpha * smoothstep(0.0, 0.45, depth);
  float foam = smoothstep(0.35, 0.0, depth) * (0.55 + 0.45 * sin(uTime * 1.7 + p.x * 0.6 + p.y * 0.4));
  c = mix(c, vec3(0.75, 0.74, 0.7) * (0.3 + uSunVis * 0.5), foam * 0.35 * uUseDepth);
  float ff = 1.0 - exp(-fogDensity * fogDensity * vFogD * vFogD);
  c = mix(c, fogColor, ff);
  gl_FragColor = vec4(c, clamp(a, 0.0, 1.0));
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}`;
World.makeWaterMaterial = function (opts = {}) {
  const u = Object.assign(THREE.UniformsUtils.clone(THREE.UniformsLib.fog), {
    uSkyTop: Sky.uni.uTop, uSkyHor: Sky.uni.uHorizon, uSunDir: Sky.uni.uSunDir, uSunCol: Sky.uni.uSunCol, uSunVis: Sky.uni.uSunVis,
    uDeep: { value: col(opts.deep || '#1d3b3a') }, uShallow: { value: col(opts.shallow || '#4d6a52') },
    uTime: U.uTime, uRain: U.uRain, uLevel: { value: 0 }, uUseDepth: { value: opts.depthTex ? 1 : 0 }, uFlow: { value: opts.flow || 0 }, uAlpha: { value: opts.alpha === undefined ? 0.94 : opts.alpha },
    tDepth: { value: opts.depthTex || null }, uDepthRect: { value: opts.rect || new THREE.Vector4(0, 0, 1, 1) }, uGlowNight: U.uGlow,
  });
  return liteDefine(new THREE.ShaderMaterial({ uniforms: u, vertexShader: WATER_VS, fragmentShader: WATER_FS, transparent: true, depthWrite: false, fog: true }));
};
World.buildWater = function () {
  // lake depth texture (terrain height under the lake)
  const R = 190, res = 128;
  const x0 = LAKE.x - R, z0 = LAKE.z - R;
  const data = new Float32Array(res * res);
  for (let j = 0; j < res; j++) for (let i = 0; i < res; i++) data[j * res + i] = this.groundHeight(x0 + (i + 0.5) / res * 2 * R, z0 + (j + 0.5) / res * 2 * R);
  const tex = new THREE.DataTexture(data, res, res, THREE.RedFormat, THREE.FloatType);
  tex.minFilter = THREE.LinearFilter; tex.magFilter = THREE.LinearFilter; tex.needsUpdate = true;
  this.lakeMat = this.makeWaterMaterial({ depthTex: tex, rect: new THREE.Vector4(x0, z0, 2 * R, 2 * R), deep: '#173a3c', shallow: '#5b7456' });
  // float textures may not be filterable on some devices; fall back to nearest
  if (!G.renderer.extensions.has('OES_texture_float_linear')) { tex.minFilter = THREE.NearestFilter; tex.magFilter = THREE.NearestFilter; }
  const lg = new THREE.CircleGeometry(R - 4, 72); lg.rotateX(-Math.PI / 2);
  this.lake = new THREE.Mesh(lg, this.lakeMat);
  this.lake.position.set(LAKE.x, LAKE.full, LAKE.z);
  this.lake.renderOrder = 2;
  G.scene.add(this.lake);
  for (let z = LAKE.z - 170; z < LAKE.z + 170; z += 2) for (let x = LAKE.x - 170; x < LAKE.x + 170; x += 2) if (lakeSD(x, z) < -2) this.occSet(x, z, OCC.WATER);
  // canal (lined, raised banks) — built as geometry here, water ribbon separately
  const P = smoothPath(CANAL.pts, 3);
  CANAL.samples = P;
  const wpos = [], widx = [];
  const B = new GeoBuilder();
  const wallC = col('#9d968a');
  for (let i = 0; i < P.length; i++) {
    const a = P[Math.max(0, i - 1)], b = P[Math.min(P.length - 1, i + 1)];
    const tx = b.x - a.x, tz = b.z - a.z, tl = Math.hypot(tx, tz) || 1; const nx = -tz / tl, nz = tx / tl;
    const onRoad = this.roadAt(P[i].x, P[i].z) || this.roadAt(P[i].x + nx * 3, P[i].z + nz * 3) || this.roadAt(P[i].x - nx * 3, P[i].z - nz * 3);
    const gy = this.groundHeight(P[i].x, P[i].z);
    for (const sgn of [-1, 1]) {
      const x = P[i].x + nx * (CANAL.w / 2) * sgn, z = P[i].z + nz * (CANAL.w / 2) * sgn;
      wpos.push(x, gy + 0.28, z);
    }
    if (i > 0) { const b0 = (i - 1) * 2, b1 = i * 2; widx.push(b0, b1, b0 + 1, b1, b1 + 1, b0 + 1); }
    if (i > 0 && !onRoad) {
      const ang = Math.atan2(tx, tz);
      for (const sgn of [-1, 1]) {
        const cx = (P[i].x + P[i - 1].x) / 2 + nx * (CANAL.w / 2 + 0.2) * sgn, cz = (P[i].z + P[i - 1].z) / 2 + nz * (CANAL.w / 2 + 0.2) * sgn;
        B.box(0.4, 0.8, 3.1, cx, gy + 0.05, cz, ang, wallC);
      }
      B.box(CANAL.w, 0.1, 3.1, (P[i].x + P[i - 1].x) / 2, gy + 0.02, (P[i].z + P[i - 1].z) / 2, ang, col('#6f6a60'));
    }
    for (let o = -CANAL.w / 2 - 0.5; o <= CANAL.w / 2 + 0.5; o += 1) this.occSet(P[i].x + nx * o, P[i].z + nz * o, OCC.CANAL);
  }
  const cm = new THREE.Mesh(B.build(), MAT.std); cm.receiveShadow = true; cm.castShadow = true; G.scene.add(cm);
  const wg = new THREE.BufferGeometry(); wg.setAttribute('position', new THREE.Float32BufferAttribute(wpos, 3)); wg.setIndex(widx);
  this.canalMat = this.makeWaterMaterial({ flow: 1, deep: '#2c4a3f', shallow: '#48624e', alpha: 0.9 });
  this.canalWater = new THREE.Mesh(wg, this.canalMat); this.canalWater.renderOrder = 2;
  G.scene.add(this.canalWater);
  this.smallWaterMat = this.makeWaterMaterial({ deep: '#24403a', shallow: '#3e5a48', alpha: 0.92 });
};
World.setLakeLevel = function (t) { // t: 0 empty .. 1 full
  const y = lerp(LAKE.low, LAKE.full, clamp01(t));
  this.lake.position.y = y; this.lakeMat.uniforms.uLevel.value = y;
};
