// ============================================================================
// Building & prop generators (merged into world chunks)
// ============================================================================
const WALLS = ['#e8b4c0', '#b7d4e6', '#cde2ae', '#f0e09c', '#d6c6ea', '#f2eee4', '#f0c49c', '#a6d6ce', '#f4d6d0', '#c9dbe9', '#f6e7b8'];
const TRIMS = ['#8e3b46', '#2f5d8a', '#4f7a2e', '#b0772a', '#5b3f8a', '#b5462b', '#1f6f6a', '#6a2c5a'];
const DOORS = ['#2f5d4a', '#3a4f7a', '#6b3a26', '#7a2f2f', '#1f5f7a', '#4a3a2a'];
const TILE_A = '#a9442b', TILE_B = '#bd5635', STRAW = '#a98a54', SLAB = '#cbc3b5', STONE = '#8e877c';
function darker(c, k = 0.72) { return new THREE.Color(c.r * k, c.g * k, c.b * k); }

function B5(x, z, ry, y) {
  const b = { s: Chunks.get(x, z, 'std'), m: Chunks.get(x, z, 'metal'), g: Chunks.get(x, z, 'glow'), ds: Chunks.get(x, z, 'stdDS'), p: Chunks.get(x, z, 'paint') };
  for (const k in b) b[k].setBase(x, y, z, ry);
  return b;
}
function endB(b) { for (const k in b) b[k].clearBase(); }
// local -> world helper
function lw(x, z, ry, lx, lz) { const c = Math.cos(ry), s = Math.sin(ry); return [x + lx * c + lz * s, z - lx * s + lz * c]; }

function addWindow(b, x, y, z, rot, trim, w = 0.9, h = 1.0, litP = 0.55) {
  const nx = Math.sin(rot), nz = Math.cos(rot), tx = Math.cos(rot), tz = -Math.sin(rot);
  const lit = frand() < litP;
  b.g.box(w, h, 0.06, x + nx * 0.03, y + h / 2, z + nz * 0.03, rot, lit ? C(frand() < 0.25 ? '#dfe8ff' : '#ffcf8a') : C('#000000'));
  b.s.box(w + 0.2, 0.1, 0.12, x + nx * 0.05, y - 0.05, z + nz * 0.05, rot, trim);
  b.s.box(w + 0.2, 0.1, 0.12, x + nx * 0.05, y + h + 0.05, z + nz * 0.05, rot, trim);
  for (let i = -1; i <= 1; i++) b.m.box(0.03, h, 0.03, x + tx * i * w * 0.28 + nx * 0.08, y + h / 2, z + tz * i * w * 0.28 + nz * 0.08, rot, C('#2a2a2e'));
  b.s.box(w + 0.45, 0.07, 0.5, x + nx * 0.25, y + h + 0.28, z + nz * 0.25, rot, trim);
}
function addDoor(b, x, y, z, rot, trim, col, w = 1.0, h = 2.1) {
  const nx = Math.sin(rot), nz = Math.cos(rot), tx = Math.cos(rot), tz = -Math.sin(rot);
  b.p.box(w, h, 0.08, x + nx * 0.03, y + h / 2, z + nz * 0.03, rot, col);
  b.s.box(w + 0.32, 0.14, 0.14, x + nx * 0.06, y + h + 0.07, z + nz * 0.06, rot, trim);
  b.s.box(0.14, h, 0.14, x + tx * (w / 2 + 0.08) + nx * 0.06, y + h / 2, z + tz * (w / 2 + 0.08) + nz * 0.06, rot, trim);
  b.s.box(0.14, h, 0.14, x - tx * (w / 2 + 0.08) + nx * 0.06, y + h / 2, z - tz * (w / 2 + 0.08) + nz * 0.06, rot, trim);
}
// gable tile roof with ridge along local x
function tileRoof(b, w, d, yEave, rise, colA = TILE_A, colB = TILE_B, over = 0.5) {
  const run = d / 2 + over, Ls = Math.hypot(run, rise), a = Math.atan2(rise, run), strips = 5;
  for (const sg of [1, -1]) for (let k = 0; k < strips; k++) {
    const s = (k + 0.5) / strips * Ls;
    const zz = sg * (run - s * Math.cos(a)), yy = yEave + s * Math.sin(a);
    b.s.box(w + over * 2, 0.1, Ls / strips + 0.03, 0, yy, zz, 0, C(k % 2 ? colA : colB), sg * a, 0, 0.1);
  }
  b.s.box(w + over * 2 + 0.1, 0.18, 0.3, 0, yEave + rise + 0.03, 0, 0, C('#7c3322'));
}
function thatchRoof(b, w, d, yEave, rise, pyramid = false) {
  if (pyramid) { b.s.pyramid(w + 1.3, rise, d + 1.3, 0, yEave - 0.25, 0, 0, C(STRAW)); b.s.pyramid(w + 1.0, rise * 0.25, d + 1.0, 0, yEave - 0.35, 0, 0, C('#8f7442')); return; }
  const run = d / 2 + 0.7, Ls = Math.hypot(run, rise), a = Math.atan2(rise, run);
  for (const sg of [1, -1]) b.s.box(w + 1.2, 0.34, Ls, 0, yEave + rise / 2 - 0.1, sg * run / 2, 0, C(STRAW), sg * a, 0, 0.12);
  b.s.box(w + 1.3, 0.3, 0.5, 0, yEave + rise - 0.02, 0, 0, C('#8f7442'));
}
function flatRoof(b, w, d, y, wall, trim, extras = true) {
  b.s.boxB(w + 0.6, 0.18, d + 0.6, 0, y, 0, 0, C(SLAB));
  const py = y + 0.18;
  b.s.boxB(w + 0.6, 0.55, 0.14, 0, py, d / 2 + 0.23, 0, wall); b.s.boxB(w + 0.6, 0.55, 0.14, 0, py, -d / 2 - 0.23, 0, wall);
  b.s.boxB(0.14, 0.55, d + 0.32, w / 2 + 0.23, py, 0, 0, wall); b.s.boxB(0.14, 0.55, d + 0.32, -w / 2 - 0.23, py, 0, 0, wall);
  b.s.boxB(w + 0.7, 0.08, 0.22, 0, py + 0.55, d / 2 + 0.23, 0, trim); b.s.boxB(w + 0.7, 0.08, 0.22, 0, py + 0.55, -d / 2 - 0.23, 0, trim);
  if (!extras) return py;
  if (frand() < 0.8) { b.s.cyl(0.55, 1.1, -w / 2 + 1.0, py, -d / 2 + 1.0, C('#1c1c1e'), 12); b.s.cyl(0.2, 0.12, -w / 2 + 1.0, py + 1.1, -d / 2 + 1.0, C('#2a2a2c'), 8); }
  if (frand() < 0.3) { b.s.boxB(2.0, 2.2, 2.2, w / 2 - 1.3, py, -d / 2 + 1.4, 0, wall); b.s.boxB(2.4, 0.14, 2.6, w / 2 - 1.3, py + 2.2, -d / 2 + 1.4, 0, C(SLAB)); }
  if (frand() < 0.35) { b.m.cylC(0.35, 0.05, w / 2 - 0.8, py + 0.9, d / 2 - 0.6, C('#d8d8d8'), 12, 0, -0.6); }
  return py;
}

// ---------- generic village house ----------
function buildHouse(x, z, ry, o = {}) {
  const w = o.w || rrange(6, 8.8), d = o.d || rrange(5.5, 7.2);
  const y = World.groundHeight(x, z);
  const b = B5(x, z, ry, y);
  const ph = o.plinth ?? rrange(0.35, 0.6), hgt = o.h ?? rrange(2.9, 3.25);
  const wall = C(o.wall || pick(WALLS)), trim = C(o.trim || pick(TRIMS)), plinthC = C(pick(['#8c847a', '#9a7f6a', '#7d756d', '#a0643f']));
  const roof = o.roof || pick(['flat', 'flat', 'flat', 'flat', 'tile', 'tile', 'thatch']);
  const floors = o.floors || (roof === 'flat' && frand() < 0.15 ? 2 : 1);
  const verandah = o.verandah ?? (frand() < 0.55);
  b.s.boxB(w + 0.5, ph + 0.6, d + 0.5, 0, -0.6, 0, 0, plinthC);
  b.s.boxB(w, hgt * floors, d, 0, ph, 0, 0, wall);
  b.s.boxB(w + 0.04, 0.5, d + 0.04, 0, ph, 0, 0, darker(trim, 0.85));
  const doorX = o.doorX ?? (frand() < 0.5 ? -w * 0.2 : w * 0.2);
  addDoor(b, doorX, ph, d / 2, 0, trim, C(pick(DOORS)));
  addWindow(b, doorX < 0 ? w * 0.22 : -w * 0.22, ph + 0.95, d / 2, 0, trim);
  addWindow(b, w / 2, ph + 0.95, 0, Math.PI / 2, trim);
  if (w > 7.2) addWindow(b, -w / 2, ph + 0.95, -d * 0.1, -Math.PI / 2, trim);
  addWindow(b, doorX * -0.2, ph + 0.95, -d / 2, Math.PI, trim, 0.8, 0.9, 0.3);
  for (let f = 1; f < floors; f++) {
    const fy = ph + hgt * f;
    b.s.boxB(w + 0.08, 0.18, d + 0.08, 0, fy - 0.1, 0, 0, trim);
    addWindow(b, -w * 0.22, fy + 0.9, d / 2, 0, trim); addWindow(b, w * 0.22, fy + 0.9, d / 2, 0, trim);
    b.s.boxB(w * 0.7, 0.12, 1.1, 0, fy, d / 2 + 0.55, 0, C(SLAB));
    b.m.boxB(w * 0.7, 0.9, 0.05, 0, fy + 0.1, d / 2 + 1.08, 0, C('#3a3a40'));
  }
  const top = ph + hgt * floors;
  if (roof === 'flat') flatRoof(b, w, d, top, wall, trim);
  else if (roof === 'tile') { b.s.prism(w, d * 0.3, d, 0, top, 0, 0, wall); tileRoof(b, w, d, top - 0.12, d * 0.3 + 0.12); }
  else { b.s.prism(w, d * 0.35, d, 0, top, 0, 0, wall); thatchRoof(b, w, d, top, d * 0.38); }
  if (verandah) {
    const vd = 2.3;
    b.s.boxB(w + 0.5, ph + 0.6, vd, 0, -0.6, d / 2 + vd / 2 + 0.2, 0, plinthC);
    const pc = C(pick(['#e9e2d2', '#c8b89a', '#6b4a32']));
    const np = w > 7 ? 3 : 2;
    for (let i = 0; i < np; i++) { const px = -w / 2 + 0.3 + i * (w - 0.6) / (np - 1); b.s.boxB(0.22, 2.35, 0.22, px, ph, d / 2 + vd + 0.05, 0, pc); }
    const sheet = frand() < 0.5;
    const rr = Math.atan2(0.45, vd + 0.4);
    (sheet ? b.m : b.s).box(w + 0.7, 0.07, vd + 0.6, 0, ph + 2.5, d / 2 + (vd + 0.6) / 2, 0, sheet ? C(pick(['#8f969b', '#6d7a80', '#9b6b4a'])) : C(TILE_A), rr);
    // arugu seats either side of the door
    b.s.boxB(1.0, 0.45, 0.8, doorX - 1.3, ph, d / 2 + 0.5, 0, plinthC);
  }
  b.s.boxB(1.4, ph * 0.55, 0.55, doorX, 0, d / 2 + (verandah ? 2.75 : 0.5), 0, plinthC);
  // yard extras
  const ex = o.extras ?? true;
  if (ex) {
    if (frand() < 0.45) { b.s.boxB(0.6, 0.85, 0.6, doorX + 1.2, 0, d / 2 + 4.2, 0, C(pick(['#d9b04a', '#c9543c', '#e8e2d6']))); b.s.sphere(0.35, doorX + 1.2, 1.15, d / 2 + 4.2, C('#3f7d2c'), PRIM.ico0); }
    if (frand() < 0.3) { b.s.sphere(1.5, -w / 2 - 2.8, 0.9, -d * 0.2, C('#b99552'), PRIM.hemi, 1, 1.5, 1); b.s.cone(0.4, 0.6, -w / 2 - 2.8, 2.9, -d * 0.2, C('#9a7a3f'), 6); }
    if (frand() < 0.25) { b.s.cyl(0.35, 0.9, w / 2 + 0.8, 0, d / 2 - 0.5, C(pick(['#2b5fa8', '#3a86c8', '#1f3f7a'])), 8); }
    if (frand() < 0.3) { // clothesline with sarees drying
      const cx = w / 2 + 2.2;
      b.s.boxB(0.08, 2.1, 0.08, cx, 0, -1.8, 0, C('#6b5a48')); b.s.boxB(0.08, 2.1, 0.08, cx, 0, 1.8, 0, C('#6b5a48'));
      for (let i = 0; i < 3; i++) b.ds.box(0.02, 1.1, 0.9, cx, 1.45, -1.2 + i * 1.2, 0, C(pick(PALETTE.saree)));
    }
    if (frand() < 0.35 && verandah) { // charpai cot
      b.s.boxB(0.9, 0.08, 1.9, doorX + (doorX < 0 ? 2.0 : -2.0), ph + 0.35, d / 2 + 1.2, 0, C('#c8b48a'));
      b.s.boxB(1.0, 0.1, 2.0, doorX + (doorX < 0 ? 2.0 : -2.0), ph + 0.3, d / 2 + 1.2, 0, C('#6b4a32'));
    }
  }
  endB(b);
  World.addCollider(x, z, w / 2 + 0.3, d / 2 + 0.3, ry, top + 1);
  if (verandah) { const [vx, vz] = lw(x, z, ry, 0, d / 2 + 1.25); World.addCollider(vx, vz, w / 2 + 0.25, 0.2, ry, 1); }
  World.occOBB(x, z, w / 2 + 1.5, d / 2 + (verandah ? 3.5 : 1.5), ry, OCC.BUILD);
  const [fx, fz] = lw(x, z, ry, doorX, d / 2 + (verandah ? 4.2 : 2.3));
  if (frand() < 0.65) addDecal(fx, fz, 2.3, Math.floor(frand() * 3), ry);
  const [dx, dz] = lw(x, z, ry, doorX, d / 2 + (verandah ? 3.2 : 1.2));
  return { x, z, ry, w, d, door: { x: dx, z: dz }, top, chimney: lw(x, z, ry, -w * 0.3, -d * 0.2) };
}

// small thatched hut / cattle shed
function buildCattleShed(x, z, ry, w = 6, d = 4) {
  const y = World.groundHeight(x, z); const b = B5(x, z, ry, y);
  for (const px of [-w / 2, w / 2]) for (const pz of [-d / 2, d / 2]) b.s.boxB(0.18, 2.3, 0.18, px, 0, pz, 0, C('#5a4432'));
  thatchRoof(b, w, d, 2.3, 1.2);
  b.s.boxB(w, 0.4, 0.8, 0, 0, -d / 2 + 0.4, 0, C('#7d756d'));
  endB(b);
  World.addCollider(x, z, w / 2, d / 2, ry, 3, 'shed');
}

// ---------- temple ----------
function buildTemple(x, z, ry) {
  const y = World.groundHeight(x, z); const b = B5(x, z, ry, y);
  const S = 24;
  const red = C('#b8432f'), white = C('#f3ece0'), saff = C('#e07b22'), cream = C('#efe3c4'), gold = C('#d4a62a');
  // striped compound wall
  const seg = 1.2;
  for (let side = 0; side < 4; side++) {
    for (let i = 0; i < S / seg; i++) {
      const t = -S / 2 + (i + 0.5) * seg;
      if (side === 0 && Math.abs(t) < 2.2) continue; // gate
      const c = i % 2 ? red : white;
      if (side === 0) b.s.boxB(seg, 1.9, 0.35, t, 0, S / 2, 0, c);
      if (side === 1) b.s.boxB(seg, 1.9, 0.35, t, 0, -S / 2, 0, c);
      if (side === 2) b.s.boxB(0.35, 1.9, seg, S / 2, 0, t, 0, c);
      if (side === 3) b.s.boxB(0.35, 1.9, seg, -S / 2, 0, t, 0, c);
    }
  }
  // gateway gopuram
  for (const sx of [-2.4, 2.4]) b.s.boxB(0.9, 3.6, 0.9, sx, 0, S / 2, 0, cream);
  b.s.boxB(5.8, 0.5, 1.4, 0, 3.6, S / 2, 0, saff);
  let gy = 4.1;
  [[5.2, 1.1, 1.5, cream], [4.3, 0.9, 1.2, saff], [3.3, 0.8, 1.0, cream], [2.2, 0.6, 0.8, saff]].forEach(([w, h, d, c]) => { b.s.boxB(w, h, d, 0, gy, S / 2, 0, c); gy += h; });
  for (const kx of [-0.7, 0, 0.7]) b.p.cone(0.14, 0.55, kx, gy, S / 2, gold, 8);
  // platform + mandapam + sanctum
  b.s.boxB(11, 1.0, 13, 0, 0, -1.5, 0, C(STONE));
  b.s.boxB(4.5, 0.5, 1.2, 0, 0, 5.6, 0, C(STONE));
  b.s.boxB(4.5, 0.25, 0.6, 0, 0, 6.3, 0, C(STONE));
  for (let i = 0; i < 4; i++) for (const sx of [-3.6, 3.6]) b.s.boxB(0.38, 3.2, 0.38, sx * (i % 2 ? 1 : 0.5) , 1.0, 3.6 - Math.floor(i / 2) * 3.4, 0, C('#e6dccb'));
  b.s.boxB(9.2, 0.3, 7.6, 0, 4.2, 2.0, 0, cream);
  b.s.boxB(9.4, 0.25, 7.8, 0, 4.5, 2.0, 0, saff);
  b.s.boxB(5.6, 4.2, 5.6, 0, 1.0, -4.3, 0, white);
  b.s.boxB(5.7, 0.35, 5.7, 0, 1.0, -4.3, 0, red);
  b.p.boxB(1.2, 2.3, 0.1, 0, 1.0, -1.45, 0, C('#6b3a26'));
  let vy = 5.2;
  [[5.6, 1.0, cream], [4.7, 0.95, saff], [3.9, 0.9, cream], [3.1, 0.85, saff], [2.4, 0.8, cream]].forEach(([w, h, c]) => { b.s.boxB(w, h, w, 0, vy, -4.3, 0, c); vy += h; });
  b.s.sphere(1.2, 0, vy + 0.2, -4.3, cream, PRIM.hemi, 1, 1.1, 1);
  b.p.cone(0.25, 1.1, 0, vy + 0.7, -4.3, gold, 8);
  b.s.boxB(0.06, 3.0, 0.06, 1.2, vy, -4.3, 0, C('#6b4a32'));
  b.ds.quad(1.2, 0.8, 1.8, vy + 2.5, -4.3, 0, saff);
  // dhwaja stambham + lamp pillar
  b.s.boxB(1.4, 0.7, 1.4, 0, 0, 9.2, 0, C(STONE));
  b.p.cyl(0.17, 8, 0, 0.7, 9.2, gold, 8);
  for (let i = 0; i < 3; i++) b.p.boxB(0.9, 0.1, 0.1, 0, 5.8 + i * 0.6, 9.2, 0, gold);
  b.s.boxB(0.5, 2.2, 0.5, -3.5, 0, 9.6, 0, C(STONE));
  b.g.box(0.5, 0.35, 0.5, -3.5, 2.4, 9.6, 0, C('#ffb347'));
  // bells
  for (const bx of [-1.3, 1.3]) b.p.cone(0.18, 0.35, bx, 3.0, 5.5, gold, 8);
  // small grama devatha shrine (Pochamma) at corner
  b.s.boxB(1.6, 1.6, 1.6, -8.6, 0, -8.6, 0, C('#f3ece0'));
  b.s.pyramid(2.0, 0.9, 2.0, -8.6, 1.6, -8.6, 0, C('#e07b22'));
  b.s.sphere(0.35, -8.6, 0.5, -7.75, C('#e0601f'), PRIM.ico0);
  endB(b);
  // colliders: walls (leaving gate), platform
  const cs = Math.cos(ry), sn = Math.sin(ry);
  const addL = (lx, lz, hw, hd) => { const [wx, wz] = lw(x, z, ry, lx, lz); World.addCollider(wx, wz, hw, hd, ry, 2); };
  addL(-(S / 4 + 1.1), S / 2, S / 4 - 1.1, 0.2); addL(S / 4 + 1.1, S / 2, S / 4 - 1.1, 0.2);
  addL(0, -S / 2, S / 2, 0.2); addL(S / 2, 0, 0.2, S / 2); addL(-S / 2, 0, 0.2, S / 2);
  addL(0, -1.5, 5.5, 6.5);
  addL(0, 9.2, 0.7, 0.7);
  World.occOBB(x, z, S / 2 + 1, S / 2 + 1, ry, OCC.BUILD);
  const [sx, sz] = lw(x, z, ry, 0, S / 2 + 0.5);
  addSign(...(() => { const [px, pz] = lw(x, z, ry, 0, S / 2 + 0.75); return [px, y + 3.15, pz]; })(), ry, 4.6, 1.15, Atlas.sign('శ్రీ ఆంజనేయ స్వామి దేవాలయం', 'Sri Anjaneya Swamy Temple', { bg: '#f7d27a', fg: '#7a1f12', border: '#b8432f' }));
  const [ix, iz] = lw(x, z, ry, 0, 6.8);
  return { gate: { x: sx, z: sz }, inner: { x: ix, z: iz }, y };
}

// ---------- school ----------
function buildSchool(x, z, ry) {
  const y = World.groundHeight(x, z); const b = B5(x, z, ry, y);
  const wall = C('#f2dfab'), trim = C('#2f6d4f'), ph = 0.6, hgt = 3.4;
  const W = 28, D = 7;
  b.s.boxB(W + 0.6, ph + 0.5, D + 3.4, 0, -0.5, 1.2, 0, C(STONE));
  b.s.boxB(W, hgt, D, 0, ph, -1, 0, wall);
  b.s.boxB(W + 0.05, 0.6, D + 0.05, 0, ph, -1, 0, trim);
  for (let i = 0; i < 5; i++) {
    const cx = -W / 2 + 3 + i * (W - 6) / 4;
    addDoor(b, cx - 1.1, ph, D / 2 - 1, 0, trim, C('#2f6d4f'));
    addWindow(b, cx + 1.0, ph + 1.0, D / 2 - 1, 0, trim, 1.2, 1.1, 0.1);
  }
  for (let i = 0; i < 8; i++) b.s.boxB(0.28, hgt, 0.28, -W / 2 + 0.4 + i * (W - 0.8) / 7, ph, D / 2 + 1.9, 0, C('#f4efe4'));
  flatRoof(b, W, D + 3.6, ph + hgt, wall, trim, false);
  b.s.boxB(W + 0.6, 0.18, 3.2, 0, ph + hgt - 0.02, D / 2 + 0.6, 0, C(SLAB));
  // side wing
  b.s.boxB(8, hgt, 9, W / 2 + 4.5, ph, 3, 0, wall);
  b.s.boxB(8.4, 0.2, 9.4, W / 2 + 4.5, ph + hgt, 3, 0, C(SLAB));
  addDoor(b, W / 2 + 1.0, ph, 7.5, 0, trim, C('#2f6d4f'));
  addWindow(b, W / 2 + 5.5, ph + 1.0, 7.5, 0, trim, 1.2, 1.1, 0.1);
  // flag pole with the national flag
  const fx = -W / 2 + 4, fz = 12;
  b.s.boxB(1.6, 0.5, 1.6, fx, 0, fz, 0, C('#e8e2d6'));
  b.m.cyl(0.06, 7.5, fx, 0.5, fz, C('#d8d8d8'), 6);
  b.ds.box(1.5, 0.28, 0.02, fx + 0.8, 7.35, fz, 0, C('#ff9933'));
  b.ds.box(1.5, 0.28, 0.02, fx + 0.8, 7.07, fz, 0, C('#ffffff'));
  b.ds.box(1.5, 0.28, 0.02, fx + 0.8, 6.79, fz, 0, C('#138808'));
  b.ds.box(0.18, 0.18, 0.03, fx + 0.8, 7.07, fz, 0, C('#000080'));
  // compound wall
  const cw = C('#e6ddc9');
  b.s.boxB(W + 20, 1.4, 0.3, 2, 0, -8, 0, cw);
  b.s.boxB(0.3, 1.4, 30, -W / 2 - 8, 0, 7, 0, cw); b.s.boxB(0.3, 1.4, 30, W / 2 + 12, 0, 7, 0, cw);
  b.s.boxB((W + 20) / 2 - 3, 1.4, 0.3, -((W + 20) / 4 + 1.5) + 2, 0, 22, 0, cw); b.s.boxB((W + 20) / 2 - 3, 1.4, 0.3, ((W + 20) / 4 + 1.5) + 2, 0, 22, 0, cw);
  // kitchen shed
  b.s.boxB(4, 2.4, 3, -W / 2 - 4, 0, 16, 0, C('#d8c7a4'));
  b.m.box(4.6, 0.08, 3.6, -W / 2 - 4, 2.55, 16, 0, C('#8f969b'), 0.12);
  // swing & slide (playground)
  for (const sx of [6, 9]) b.m.boxB(0.1, 2.6, 0.1, sx, 0, 15, 0, C('#c0392b'));
  b.m.box(3.2, 0.1, 0.1, 7.5, 2.6, 15, 0, C('#c0392b'));
  endB(b);
  const add = (lx, lz, hw, hd) => { const [wx, wz] = lw(x, z, ry, lx, lz); World.addCollider(wx, wz, hw, hd, ry, 4); };
  add(0, -1, W / 2, D / 2 + 0.3); add(W / 2 + 4.5, 3, 4.1, 4.6); add(-W / 2 - 4, 16, 2.1, 1.6);
  add(2, -8, (W + 20) / 2, 0.2); add(-W / 2 - 8, 7, 0.2, 15); add(W / 2 + 12, 7, 0.2, 15);
  add(-((W + 20) / 4 + 1.5) + 2, 22, (W + 20) / 4 - 1.5, 0.2); add(((W + 20) / 4 + 1.5) + 2, 22, (W + 20) / 4 - 1.5, 0.2);
  World.occOBB(...lw(x, z, ry, 2, 7), W / 2 + 12, 16, ry, OCC.BUILD);
  const [sx2, sz2] = lw(x, z, ry, 2, 22.4);
  addSign(sx2, y + 2.6, sz2, ry, 5.2, 1.3, Atlas.sign('ప్రభుత్వ ప్రాథమిక పాఠశాల', 'Govt. Primary School, Ramapuram', { bg: '#eef3e2', fg: '#1f5a3a', border: '#2f6d4f' }), '#2f6d4f', 1, 1.8);
  return { yard: lw(x, z, ry, 6, 12), gate: lw(x, z, ry, 2, 23.5), classes: lw(x, z, ry, 0, 4) };
}

// ---------- panchayat office + rachabanda ----------
function buildPanchayat(x, z, ry) {
  const y = World.groundHeight(x, z); const b = B5(x, z, ry, y);
  const wall = C('#f3f0e8'), trim = C('#2e7d4f');
  b.s.boxB(13, 1.0, 11, 0, -0.5, 1, 0, C(STONE));
  b.s.boxB(12, 3.4, 8, 0, 0.5, 0, 0, wall);
  b.s.boxB(12.05, 0.55, 8.05, 0, 0.5, 0, 0, trim);
  addDoor(b, 0, 0.5, 4, 0, trim, C('#6b3a26'), 1.4, 2.3);
  addWindow(b, -3.8, 1.5, 4, 0, trim, 1.3, 1.1); addWindow(b, 3.8, 1.5, 4, 0, trim, 1.3, 1.1);
  addWindow(b, 6, 1.5, 0, Math.PI / 2, trim); addWindow(b, -6, 1.5, 0, -Math.PI / 2, trim);
  for (let i = 0; i < 4; i++) b.s.boxB(0.3, 3.3, 0.3, -5.6 + i * 3.73, 0.5, 6.3, 0, C('#f4efe4'));
  flatRoof(b, 12, 8, 3.9, wall, trim, false);
  b.s.boxB(12.6, 0.18, 2.8, 0, 3.8, 5.2, 0, C(SLAB));
  b.p.boxB(2.2, 1.4, 0.1, -5, 1.2, 6.7, 0, C('#1f3f2f'));
  b.m.cyl(0.05, 6.5, 5.5, 0, 7.5, C('#d8d8d8'), 6);
  endB(b);
  World.addCollider(x, z, 6.4, 4.4, ry, 4.5);
  World.occOBB(...lw(x, z, ry, 0, 1), 7.5, 6.5, ry, OCC.BUILD);
  const [sx, sz] = lw(x, z, ry, 0, 4.2);
  addSign(sx, y + 4.65, sz, ry, 6.2, 1.3, Atlas.sign('గ్రామ పంచాయతీ కార్యాలయం', 'Gram Panchayat Office, Ramapuram', { bg: '#f3f0e8', fg: '#1d5c3a', border: '#2e7d4f' }));
  return { door: lw(x, z, ry, 0, 7.2), y };
}
function buildRachabanda(x, z) {
  const y = World.groundHeight(x, z); const b = B5(x, z, 0, y);
  b.s.cyl(4.6, 0.6, 0, -0.1, 0, C('#8e877c'), 16);
  b.s.cyl(4.75, 0.12, 0, 0.5, 0, C('#a39b8f'), 16);
  endB(b);
  World.addCollider(x, z, 3.2, 3.2, 0, 1, 'platform');
  World.occOBB(x, z, 5, 5, 0, OCC.BUILD);
  const seats = []; for (let i = 0; i < 10; i++) { const a = i / 10 * TAU; seats.push({ x: x + Math.cos(a) * 4.3, z: z + Math.sin(a) * 4.3, ry: Math.atan2(Math.cos(a), Math.sin(a)), y: y + 0.55 }); }
  return { seats };
}

// ---------- shops ----------
function buildShop(x, z, ry, o) {
  const y = World.groundHeight(x, z); const b = B5(x, z, ry, y);
  const w = o.w || 6, d = o.d || 6, h = o.h || 3.2;
  const wall = C(o.wall || '#e7d8b8'), trim = C(o.trim || '#8e3b46');
  b.s.boxB(w + 0.4, 0.8, d + 0.4, 0, -0.5, 0, 0, C(STONE));
  b.s.boxB(w, h, d, 0, 0.3, 0, 0, wall);
  b.s.boxB(w - 0.6, 2.5, 0.12, 0, 0.3, d / 2 - 0.4, 0, C('#2a2622'));
  b.m.cylC(0.25, w - 0.5, 0, 2.95, d / 2 + 0.05, C('#8e959a'), 12, 0, 0, Math.PI / 2);
  b.s.boxB(w - 1.2, 0.95, 0.6, 0, 0.3, d / 2 - 0.2, 0, C('#6b4a32'));
  flatRoof(b, w, d, h + 0.3, wall, trim, false);
  b.m.box(w + 0.8, 0.07, 1.8, 0, h - 0.35, d / 2 + 0.8, 0, C(o.awning || '#2d6ca6'), 0.18);
  if (o.goods) o.goods(b, w, d);
  endB(b);
  World.addCollider(x, z, w / 2 + 0.2, d / 2 + 0.2, ry, 4);
  World.occOBB(x, z, w / 2 + 1, d / 2 + 2, ry, OCC.BUILD);
  const [sx, sz] = lw(x, z, ry, 0, d / 2 + 0.12);
  if (o.sign) addSign(sx, y + h + 0.95, sz, ry, Math.min(w + 0.4, 6.4), 1.2, o.sign, o.board || '#3b2b22');
  return { counter: lw(x, z, ry, 0, d / 2 + 1.5), inside: lw(x, z, ry, 0, d / 2 - 1.2), y };
}
function buildTeaStall(x, z, ry) {
  const y = World.groundHeight(x, z); const b = B5(x, z, ry, y);
  const wall = C('#8fc4c9');
  b.s.boxB(5.4, 0.35, 4.2, 0, 0, 0, 0, C(STONE));
  b.s.boxB(4.8, 2.8, 0.2, 0, 0.35, -1.9, 0, wall); b.s.boxB(0.2, 2.8, 3.8, -2.3, 0.35, 0, 0, wall); b.s.boxB(0.2, 2.8, 3.8, 2.3, 0.35, 0, 0, wall);
  b.m.box(6.2, 0.07, 6.0, 0, 3.25, 0.6, 0, C('#7c8a8f'), 0.12);
  b.s.boxB(4.4, 1.0, 0.7, 0, 0.35, 1.3, 0, C('#6b4a32'));
  b.m.cyl(0.28, 0.45, -1.3, 1.35, 1.3, C('#c9ccd0'), 12); b.s.cyl(0.35, 0.3, -1.3, 1.35, 1.3, C('#2a2a2a'), 8);
  for (let i = 0; i < 5; i++) b.m.cyl(0.13, 0.32, 0.2 + i * 0.36, 1.35, 1.35, C(pick(['#e8c257', '#e07b22', '#f4efe4', '#b93a2c'])), 8);
  for (let i = 0; i < 3; i++) { b.s.box(0.35, 0.6, 0.35, 1.6 - i * 0.5, 2.6, 1.8, 0, C('#e6c02e')); }
  for (let i = 0; i < 6; i++) b.s.box(0.18, 0.28, 0.03, -1.8 + i * 0.35, 2.75, 1.95, 0, C(pick(['#d63b3b', '#f0b429', '#2d6ca6', '#37b24d'])));
  // benches & chairs
  b.s.boxB(2.4, 0.45, 0.45, -2.2, 0, 4.0, 0, C('#6b4a32')); b.s.boxB(2.4, 0.45, 0.45, 1.8, 0, 4.6, 0.2, C('#6b4a32'));
  for (let i = 0; i < 3; i++) { const c = C(pick(['#d63b3b', '#2d6ca6', '#e2b81f'])); b.p.boxB(0.45, 0.42, 0.45, 3.6 + i * 0.1, 0, 2.2 + i * 0.8, 0, c); b.p.boxB(0.45, 0.45, 0.06, 3.6 + i * 0.1, 0.42, 2.0 + i * 0.8, 0, c); }
  endB(b);
  World.addCollider(...lw(x, z, ry, 0, -0.3), 2.5, 1.7, ry, 3);
  World.occOBB(x, z, 4, 4.5, ry, OCC.BUILD);
  const [sx, sz] = lw(x, z, ry, 0, 3.55);
  addSign(sx, y + 3.7, sz, ry, 4.6, 1.1, Atlas.sign('యాదమ్మ టీ స్టాల్', 'Yadamma Tea Stall', { bg: '#ffe9a8', fg: '#8a2c1a', border: '#d9531e' }));
  const seats = [
    { ...pt(lw(x, z, ry, -2.8, 4.0)), ry: ry + Math.PI, y: y + 0.45 }, { ...pt(lw(x, z, ry, -1.6, 4.0)), ry: ry + Math.PI, y: y + 0.45 },
    { ...pt(lw(x, z, ry, 1.2, 4.6)), ry: ry + Math.PI, y: y + 0.45 }, { ...pt(lw(x, z, ry, 2.4, 4.6)), ry: ry + Math.PI, y: y + 0.45 },
    { ...pt(lw(x, z, ry, 3.7, 2.3)), ry: ry - Math.PI / 2, y: y + 0.42 }, { ...pt(lw(x, z, ry, 3.8, 3.1)), ry: ry - Math.PI / 2, y: y + 0.42 },
  ];
  return { counter: pt(lw(x, z, ry, 0, 2.6)), owner: pt(lw(x, z, ry, 0, 0.3)), seats, y };
}
function pt(a) { return { x: a[0], z: a[1] }; }

function buildWorkshop(x, z, ry) {
  const y = World.groundHeight(x, z); const b = B5(x, z, ry, y);
  const W = 13, D = 8;
  b.s.boxB(W + 2, 0.15, D + 4, 0, -0.05, 1, 0, C('#6d6a64'));
  b.s.boxB(W, 3.8, 0.25, 0, 0, -D / 2, 0, C('#d8c9a8'));
  for (const px of [-W / 2, 0, W / 2]) b.m.boxB(0.2, 4.2, 0.2, px, 0, D / 2, 0, C('#46525a'));
  for (const px of [-W / 2, W / 2]) b.m.boxB(0.2, 4.2, 0.2, px, 0, -D / 2 + 0.2, 0, C('#46525a'));
  b.m.box(W + 1.2, 0.08, D + 1.6, 0, 4.3, 0, 0, C('#8f969b'), -0.08);
  // tyres, drums, bench
  for (let i = 0; i < 4; i++) b.s.cylC(0.62, 0.36, -W / 2 + 1.2, 0.2 + i * 0.37, -D / 2 + 1.1, C('#1e1e20'), 12);
  for (let i = 0; i < 3; i++) b.m.cyl(0.32, 0.95, W / 2 - 1 - i * 0.75, 0, -D / 2 + 0.8, C(pick(['#2b5fa8', '#b93a2c', '#2f7d3a'])), 12);
  b.s.boxB(3, 0.9, 0.8, 2, 0, -D / 2 + 0.6, 0, C('#6b4a32'));
  // a tractor chassis on stands
  buildTractorModel(b, { x: -1.5, y: 0.25, z: 0.5, ry: 0.3, color: '#b8321f', noWheels: true });
  for (const [sx, sz] of [[-0.9, -0.3], [-2.1, 1.2]]) b.s.boxB(0.4, 0.5, 0.4, sx, 0, sz, 0, C('#46525a'));
  endB(b);
  World.addCollider(...lw(x, z, ry, 0, -D / 2), W / 2 + 0.2, 0.3, ry, 4);
  World.occOBB(x, z, W / 2 + 1, D / 2 + 3, ry, OCC.BUILD);
  const [sx, sz] = lw(x, z, ry, 0, D / 2 + 0.25);
  addSign(sx, y + 4.95, sz, ry, 6.4, 1.3, Atlas.sign('భాస్కర్ ట్రాక్టర్ వర్క్‌షాప్', 'Bhaskar Tractor Workshop · Hire & Sales', { bg: '#20364a', fg: '#ffd166', border: '#ffd166', fg2: '#f4efe4' }));
  return { counter: pt(lw(x, z, ry, 3, D / 2 + 1.5)), bay: pt(lw(x, z, ry, -1.5, 1.5)), spawn: pt(lw(x, z, ry, 4, D / 2 + 6)), y };
}
function buildBusStop(x, z, ry) {
  const y = World.groundHeight(x, z); const b = B5(x, z, ry, y);
  b.s.boxB(6, 0.25, 2.8, 0, 0, 0, 0, C('#8e877c'));
  b.s.boxB(5.6, 2.7, 0.25, 0, 0.25, -1.2, 0, C('#e8ddc6'));
  b.s.boxB(0.25, 2.7, 2.2, -2.7, 0.25, -0.2, 0, C('#e8ddc6')); b.s.boxB(0.25, 2.7, 2.2, 2.7, 0.25, -0.2, 0, C('#e8ddc6'));
  b.s.boxB(6.2, 0.18, 3.0, 0, 2.95, -0.1, 0, C('#b8432f'));
  b.s.boxB(4.6, 0.45, 0.5, 0, 0.25, -0.8, 0, C('#8e877c'));
  endB(b);
  World.addCollider(...lw(x, z, ry, 0, -1.2), 2.9, 0.2, ry, 3);
  World.occOBB(x, z, 3.5, 2, ry, OCC.BUILD);
  const [sx, sz] = lw(x, z, ry, 0, -1.05);
  addSign(sx, y + 2.2, sz, ry, 3.6, 0.9, Atlas.sign('బస్ స్టాప్ · రామాపురం', 'Bus Stop · Ramapuram', { bg: '#fff3d6', fg: '#b8432f', border: '#b8432f' }));
  const seats = [0, 1, 2, 3].map((i) => ({ ...pt(lw(x, z, ry, -1.6 + i * 1.05, -0.75)), ry, y: y + 0.7 }));
  return { stop: pt(lw(x, z, ry, 0, 2.6)), seats, y };
}
function buildWaterTower(x, z, big = false, label = 'రామాపురం') {
  const y = World.groundHeight(x, z); const b = B5(x, z, 0, y);
  const R = big ? 3.2 : 2.5, H = big ? 15 : 11, TR = big ? 5 : 3.8, TH = big ? 5 : 3.6;
  const n = 6;
  for (let i = 0; i < n; i++) { const a = i / n * TAU; b.s.cyl(0.28, H, Math.cos(a) * R, 0, Math.sin(a) * R, C('#cfc7ba'), 8); }
  for (let k = 1; k <= 3; k++) for (let i = 0; i < n; i++) {
    const a0 = i / n * TAU, a1 = (i + 1) / n * TAU; const yy = H * k / 4;
    b.s.beam(Math.cos(a0) * R, yy, Math.sin(a0) * R, Math.cos(a1) * R, yy, Math.sin(a1) * R, 0.12, C('#cfc7ba'));
  }
  b.s.cyl(TR, 0.4, 0, H, 0, C('#cfc7ba'), 16);
  b.s.cyl(TR - 0.1, TH, 0, H + 0.4, 0, C('#efe8dc'), 16);
  b.s.cyl(TR, 0.5, 0, H + 0.4 + TH * 0.45, 0, C('#2f5d8a'), 16);
  b.s.cone(TR + 0.2, 1.2, 0, H + 0.4 + TH, 0, C('#cfc7ba'), 16);
  endB(b);
  World.addCollider(x, z, R + 0.3, R + 0.3, 0, 3, 'pillars');
  World.occOBB(x, z, R + 1.5, R + 1.5, 0, OCC.BUILD);
  addSign(x, y + H + 0.4 + TH * 0.45 + 0.25, z + TR + 0.02, 0, TR * 1.2, TR * 0.3, Atlas.sign(label, null, { bg: '#2f5d8a', fg: '#ffffff', border: '#2f5d8a' }));
}
function buildArch(x, z, ry, te, en) {
  const y = World.groundHeight(x, z); const b = B5(x, z, ry, y);
  const span = 10;
  for (const s of [-1, 1]) { b.s.boxB(1.2, 5.4, 1.2, s * span / 2, 0, 0, 0, C('#e8ddc6')); b.s.boxB(1.5, 0.6, 1.5, s * span / 2, 5.4, 0, 0, C('#b8432f')); b.s.sphere(0.45, s * span / 2, 6.35, 0, C('#e07b22'), PRIM.hemi); }
  b.s.boxB(span + 1.6, 1.4, 0.6, 0, 4.5, 0, 0, C('#b8432f'));
  endB(b);
  for (const s of [-1, 1]) { const [px, pz] = lw(x, z, ry, s * span / 2, 0); World.addCollider(px, pz, 0.7, 0.7, ry, 6); }
  for (const s of [1, -1]) { const [sx, sz] = lw(x, z, ry, 0, 0.31 * s); addSign(sx, y + 5.2, sz, s > 0 ? ry : ry + Math.PI, span - 0.4, 1.1, Atlas.sign(te, en, { bg: '#fff1c9', fg: '#8a2c1a', border: '#e07b22' })); }
}
function buildPumpHouse(x, z, ry) {
  const y = World.groundHeight(x, z); const b = B5(x, z, ry, y);
  b.s.boxB(2.0, 2.0, 2.0, 0, 0, 0, 0, C('#a0643f'));
  b.m.box(2.5, 0.06, 2.6, 0, 2.1, 0, 0, C('#8f969b'), 0.1);
  b.p.boxB(0.8, 1.6, 0.06, 0, 0, 1.02, 0, C('#2f5d8a'));
  b.m.beam(0.7, 0.9, 1.0, 0.7, 0.9, 1.9, 0.09, C('#3a6ea5'), PRIM.cyl8);
  b.s.boxB(1.8, 0.5, 1.2, 0.7, 0, 2.5, 0, C('#8e877c'));
  endB(b);
  World.addCollider(x, z, 1.1, 1.1, ry, 2.5);
  World.occOBB(x, z, 1.6, 2.6, ry, OCC.BUILD);
  return { spout: pt(lw(x, z, ry, 0.7, 1.95)), y: y + 0.9 };
}
function buildPoleLine(pts, side = 1, gap = 38, off = 6) {
  const P = smoothPath(pts, 3);
  const poles = []; let acc = gap;
  for (let i = 1; i < P.length; i++) {
    acc += P[i].distanceTo(P[i - 1]);
    if (acc >= gap) {
      acc = 0;
      const a = P[Math.max(0, i - 1)], c = P[Math.min(P.length - 1, i + 1)];
      const tx = c.x - a.x, tz = c.z - a.z, tl = Math.hypot(tx, tz) || 1;
      const x = P[i].x - tz / tl * off * side, z = P[i].z + tx / tl * off * side;
      if (World.occGet(x, z) === OCC.BUILD || World.occGet(x, z) === OCC.ROAD || fieldAt(x, z)) continue;
      poles.push({ x, z, y: World.groundHeight(x, z), ry: Math.atan2(tx, tz) });
    }
  }
  const lines = [];
  for (let i = 0; i < poles.length; i++) {
    const p = poles[i];
    const b = Chunks.get(p.x, p.z, 'std');
    b.add(PRIM.frustum8, b.mat(p.x, p.y + 4.5, p.z, 0.3, 9, 0.3, p.ry), C('#b5aea3'));
    b.box(1.8, 0.12, 0.12, p.x, p.y + 8.6, p.z, p.ry + Math.PI / 2, C('#6b6660'));
    if (i > 0) {
      const q = poles[i - 1]; if (Math.hypot(p.x - q.x, p.z - q.z) > gap * 2.2) continue;
      for (const o of [-0.8, 0, 0.8]) {
        const ax = q.x + Math.cos(q.ry) * o, az = q.z - Math.sin(q.ry) * o, bx = p.x + Math.cos(p.ry) * o, bz = p.z - Math.sin(p.ry) * o;
        const ay = q.y + 8.7, by = p.y + 8.7; const n = 8;
        for (let k = 0; k < n; k++) {
          const t0 = k / n, t1 = (k + 1) / n; const s0 = 4 * t0 * (1 - t0) * 0.9, s1 = 4 * t1 * (1 - t1) * 0.9;
          lines.push(lerp(ax, bx, t0), lerp(ay, by, t0) - s0, lerp(az, bz, t0), lerp(ax, bx, t1), lerp(ay, by, t1) - s1, lerp(az, bz, t1));
        }
      }
    }
    World.addCollider(p.x, p.z, 0.2, 0.2, 0, 9, 'pole');
  }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(lines, 3));
  const ls = new THREE.LineSegments(g, World.wireMat || (World.wireMat = new THREE.LineBasicMaterial({ color: 0x222222 })));
  G.scene.add(ls);
  return poles;
}
function buildTransformer(x, z, ry) {
  const y = World.groundHeight(x, z); const b = B5(x, z, ry, y);
  for (const s of [-1, 1]) b.s.add(PRIM.frustum8, b.s.mat(s * 1.2, 4.5, 0, 0.3, 9, 0.3), C('#b5aea3'));
  b.m.boxB(2.8, 0.15, 1.0, 0, 3.0, 0, 0, C('#5a5a5a'));
  b.m.boxB(1.1, 1.3, 0.8, 0, 3.15, 0, 0, C('#6d7a6a'));
  for (let i = 0; i < 5; i++) b.m.boxB(0.05, 1.0, 0.9, -0.45 + i * 0.22, 3.25, 0, 0, C('#5d6a5a'));
  for (let i = -1; i <= 1; i++) b.m.cyl(0.07, 0.4, i * 0.3, 4.45, 0, C('#8a5a3a'), 6);
  b.s.boxB(3.4, 1.4, 1.6, 0, 0, 0, 0, C('#8e877c'));
  endB(b);
  World.addCollider(x, z, 1.8, 0.9, ry, 3);
}
function buildHayStack(b, x, y, z, s = 1) {
  b.sphere(1.6 * s, x, y + 1.0 * s, z, C('#c29a52'), PRIM.hemi, 1, 1.7, 1);
  b.cone(0.5 * s, 0.9 * s, x, y + 2.55 * s, z, C('#a8843f'), 6);
}

// ---------- market yard ----------
function buildMarketYard() {
  const { x, z, w, d } = YARD;
  const y = World.groundHeight(x, z); const b = B5(x, z, 0, y);
  const wall = C('#e3d6be'), trim = C('#2f5d8a');
  // compound wall with north gate at local x=-28
  const seg = (ax, az, bx, bz) => { const L = Math.hypot(bx - ax, bz - az); b.s.boxB(Math.abs(bx - ax) + 0.3, 2.0, Math.abs(bz - az) + 0.3, (ax + bx) / 2, 0, (az + bz) / 2, 0, wall); };
  seg(-w / 2, -d / 2, -35, -d / 2); seg(-21, -d / 2, w / 2, -d / 2);
  seg(-w / 2, d / 2, w / 2, d / 2); seg(-w / 2, -d / 2, -w / 2, d / 2); seg(w / 2, -d / 2, w / 2, d / 2);
  b.s.boxB(1.6, 6.5, 1.6, -35, 0, -d / 2, 0, C('#e8ddc6')); b.s.boxB(1.6, 6.5, 1.6, -21, 0, -d / 2, 0, C('#e8ddc6'));
  b.s.boxB(15.6, 1.6, 0.8, -28, 5.2, -d / 2, 0, C('#2f5d8a'));
  // concrete floor
  b.s.boxB(w - 1, 0.12, d - 1, 0, -0.04, 0, 0, C('#8f8a80'));
  // two big sheds
  const sheds = [[-18, 6], [26, 6]];
  for (const [sx, sz] of sheds) {
    for (let i = 0; i < 6; i++) for (const zz of [-9, 9]) b.m.boxB(0.35, 7.5, 0.35, sx - 17.5 + i * 7, 0, sz + zz, 0, C('#5d6a72'));
    const run = 10.5, rise = 2.4, a = Math.atan2(rise, run), L = Math.hypot(run, rise);
    for (const sg of [1, -1]) b.m.box(38, 0.12, L, sx, 7.5 + rise / 2, sz + sg * run / 2, 0, C('#9aa3a8'), sg * a);
    b.m.box(38.4, 0.3, 0.4, sx, 7.5 + rise, sz, 0, C('#7d878d'));
  }
  // weighbridge & office
  b.m.boxB(12, 0.25, 3.6, -28, 0, -d / 2 + 10, 0, C('#6f7780'));
  b.s.boxB(3.4, 2.8, 3.2, -38, 0, -d / 2 + 10, 0, C('#f3ece0'));
  addWindow(b, -36.3, 1.0, -d / 2 + 10, Math.PI / 2, trim, 1.3, 1.0, 0.8);
  b.s.boxB(14, 3.6, 7, 36, 0, -d / 2 + 6, 0, C('#f3ece0'));
  b.s.boxB(14.4, 0.25, 7.4, 36, 3.6, -d / 2 + 6, 0, C(SLAB));
  addDoor(b, 36, 0, -d / 2 + 9.5, 0, trim, C('#2f5d8a'));
  addWindow(b, 32, 1.0, -d / 2 + 9.5, 0, trim, 1.4, 1.1); addWindow(b, 40, 1.0, -d / 2 + 9.5, 0, trim, 1.4, 1.1);
  // produce heaps & bags (static decor)
  const heapC = ['#d6ad55', '#f4f1ea', '#e9b43a', '#b3261e', '#e3a01b'];
  for (let i = 0; i < 10; i++) {
    const [sx, sz] = sheds[i % 2]; const hx = sx - 14 + (i >> 1) * 7, hz = sz + (i % 3 - 1) * 5;
    b.s.sphere(2.2, hx, 0, hz, C(heapC[i % heapC.length]), PRIM.hemi, 1.3, 0.55, 1);
  }
  for (let i = 0; i < 26; i++) { const [sx, sz] = sheds[i % 2]; b.s.boxB(0.9, 0.45, 0.6, sx + 8 + (i % 4) * 0.95, Math.floor(i / 8) * 0.46, sz - 7 + (i % 3) * 0.2, 0.1 * (i % 3), C(pick(['#d8c9a0', '#cdbb8a', '#e2d6b4']))); }
  endB(b);
  const add = (lx, lz, hw, hd) => World.addCollider(x + lx, z + lz, hw, hd, 0, 3);
  add(-w / 2 + (-35 + w / 2) / 2, -d / 2, (-35 + w / 2) / 2 + 0.2, 0.3); add((-21 + w / 2) / 2, -d / 2, (w / 2 + 21) / 2, 0.3);
  add(0, d / 2, w / 2, 0.3); add(-w / 2, 0, 0.3, d / 2); add(w / 2, 0, 0.3, d / 2);
  add(-35, -d / 2, 0.8, 0.8); add(-21, -d / 2, 0.8, 0.8);
  add(-38, -d / 2 + 10, 1.7, 1.6); add(36, -d / 2 + 6, 7, 3.5);
  for (const [sx, sz] of sheds) for (let i = 0; i < 6; i++) for (const zz of [-9, 9]) add(sx - 17.5 + i * 7, sz + zz, 0.2, 0.2);
  World.occRect(x - w / 2, z - d / 2, x + w / 2, z + d / 2, OCC.BUILD);
  addSign(x - 28, y + 5.2, z - d / 2 - 0.42, Math.PI, 14.8, 1.45, Atlas.sign('వ్యవసాయ మార్కెట్ యార్డ్ · నగరం', 'Agricultural Market Yard · Nagaram', { bg: '#2f5d8a', fg: '#ffffff', border: '#ffd166', fg2: '#ffd166' }));
  addSign(x + 36, y + 4.3, z - d / 2 + 2.45, Math.PI, 6.4, 1.1, Atlas.sign('ప్రభుత్వ కొనుగోలు కేంద్రం', 'Govt. Procurement Centre (MSP)', { bg: '#f3f0e8', fg: '#1d5c3a', border: '#2e7d4f' }));
  return { weigh: { x: x - 28, z: z - d / 2 + 10 }, office: { x: x + 36, z: z - d / 2 + 11 }, gate: { x: x - 28, z: z - d / 2 - 4 }, y };
}

// ---------- town building ----------
function buildTownBlock(x, z, ry, o) {
  const y = World.groundHeight(x, z); const b = B5(x, z, ry, y);
  const w = o.w || 9, d = o.d || 10, fl = o.floors || 2, fh = 3.3;
  const wall = C(o.wall || pick(['#e8d8b0', '#d9c8a8', '#c9d6de', '#e6c6b6', '#d6d9b8', '#f0e6d2'])), trim = C(o.trim || pick(TRIMS));
  b.s.boxB(w + 0.3, 0.6, d + 0.3, 0, -0.3, 0, 0, C(STONE));
  b.s.boxB(w, fh * fl, d, 0, 0.3, 0, 0, wall);
  // ground floor shop front
  b.s.boxB(w - 0.8, 2.6, 0.1, 0, 0.3, d / 2 + 0.01, 0, C('#1f1c19'));
  b.g.box(w - 1.4, 1.6, 0.05, 0, 1.6, d / 2 + 0.06, 0, C(frand() < 0.7 ? '#ffe2a8' : '#dfe8ff'));
  b.m.box(w + 0.6, 0.07, 1.6, 0, 3.0, d / 2 + 0.75, 0, C(pick(['#2d6ca6', '#c0392b', '#2f7d3a', '#e2b81f', '#6b3fa0'])), 0.2);
  for (let f = 1; f < fl; f++) {
    const fy = 0.3 + fh * f;
    b.s.boxB(w + 0.1, 0.16, d + 0.1, 0, fy - 0.08, 0, 0, trim);
    const nw = Math.max(2, Math.floor(w / 2.6));
    for (let i = 0; i < nw; i++) addWindow(b, -w / 2 + (i + 0.5) * w / nw, fy + 0.8, d / 2, 0, trim, 1.0, 1.2, 0.5);
    if (frand() < 0.5) { b.s.boxB(w * 0.8, 0.12, 1.0, 0, fy, d / 2 + 0.5, 0, C(SLAB)); b.m.boxB(w * 0.8, 0.9, 0.05, 0, fy + 0.1, d / 2 + 0.98, 0, C('#3a3a40')); }
  }
  flatRoof(b, w, d, 0.3 + fh * fl, wall, trim);
  endB(b);
  World.addCollider(x, z, w / 2 + 0.15, d / 2 + 0.15, ry, fh * fl);
  World.occOBB(x, z, w / 2 + 1, d / 2 + 1.8, ry, OCC.BUILD);
  if (o.sign) { const [sx, sz] = lw(x, z, ry, 0, d / 2 + 0.12); addSign(sx, y + 3.55, sz, ry, Math.min(w - 0.4, 6.8), 1.0, o.sign, o.board || '#2a2622'); }
  return { door: pt(lw(x, z, ry, 0, d / 2 + 1.6)), y };
}
function buildPetrolBunk(x, z, ry) {
  const y = World.groundHeight(x, z); const b = B5(x, z, ry, y);
  b.s.boxB(20, 0.15, 16, 0, -0.05, 0, 0, C('#7d7a74'));
  for (const px of [-5, 5]) for (const pz of [-3, 3]) b.m.boxB(0.4, 5.2, 0.4, px, 0, pz, 0, C('#e8e8e8'));
  b.p.boxB(13, 0.9, 9, 0, 5.2, 0, 0, C('#f2f2f2'));
  b.p.boxB(13.1, 0.3, 9.1, 0, 5.45, 0, 0, C('#2f7d3a'));
  b.g.box(12.6, 0.1, 8.6, 0, 5.15, 0, 0, C('#fff6e0'));
  for (const px of [-2.5, 2.5]) { b.p.boxB(0.9, 1.7, 0.6, px, 0.1, 0, 0, C('#2f7d3a')); b.g.box(0.6, 0.3, 0.05, px, 1.4, 0.31, 0, C('#b8ffcc')); b.s.boxB(1.8, 0.2, 1.2, px, 0, 0, 0, C('#9a948b')); }
  b.s.boxB(6, 3, 4, 0, 0, -7, 0, C('#f3ece0')); b.s.boxB(6.4, 0.2, 4.4, 0, 3, -7, 0, C('#2f7d3a'));
  addWindow(b, 1.5, 1.0, -5, 0, C('#2f7d3a'), 1.6, 1.2, 0.9);
  endB(b);
  for (const px of [-5, 5]) for (const pz of [-3, 3]) { const [wx, wz] = lw(x, z, ry, px, pz); World.addCollider(wx, wz, 0.25, 0.25, ry, 5); }
  for (const px of [-2.5, 2.5]) { const [wx, wz] = lw(x, z, ry, px, 0); World.addCollider(wx, wz, 0.5, 0.35, ry, 2); }
  World.addCollider(...lw(x, z, ry, 0, -7), 3.1, 2.1, ry, 3);
  World.occOBB(x, z, 10, 8, ry, OCC.BUILD);
  addSign(...(() => { const [a, c] = lw(x, z, ry, 0, 4.58); return [a, y + 5.65, c]; })(), ry, 7, 0.9, Atlas.sign('పెట్రోల్ బంక్ · డీజిల్', 'Fuel Station · Diesel ₹95/L', { bg: '#f2f2f2', fg: '#2f7d3a', border: '#2f7d3a' }));
  return { pump: pt(lw(x, z, ry, 0, 2.5)), y };
}
function buildDhaba(x, z, ry) {
  const y = World.groundHeight(x, z); const b = B5(x, z, ry, y);
  b.s.boxB(8, 3, 5, 0, 0, -3, 0, C('#d9a441'));
  b.m.box(12, 0.08, 10, 0, 3.4, 0.5, 0, C('#8a6e4a'), 0.08);
  for (const px of [-5.5, 5.5]) for (const pz of [5, -3]) b.s.boxB(0.2, 3.4, 0.2, px, 0, pz, 0, C('#5a4432'));
  for (let i = 0; i < 4; i++) { const cx = -4 + i * 2.7, cz = 2.5 + (i % 2) * 1.5; b.s.boxB(0.95, 0.08, 1.9, cx, 0.45, cz, 0, C('#c8b48a')); b.s.boxB(1.05, 0.45, 2.0, cx, 0, cz, 0, C('#6b4a32')); }
  endB(b);
  World.addCollider(...lw(x, z, ry, 0, -3), 4, 2.5, ry, 3);
  World.occOBB(x, z, 6.5, 6.5, ry, OCC.BUILD);
  addSign(...(() => { const [a, c] = lw(x, z, ry, 0, -0.45); return [a, y + 2.4, c]; })(), ry, 5, 1.0, Atlas.sign('తెలంగాణ దాబా', 'Telangana Dhaba · Meals', { bg: '#ffe9a8', fg: '#7a1f12', border: '#7a1f12' }));
  return { counter: pt(lw(x, z, ry, 0, 1)), y };
}
function buildHillShrine(x, z) {
  const y = World.groundHeight(x, z); const b = B5(x, z, 0, y);
  b.s.boxB(4, 0.6, 4, 0, -0.2, 0, 0, C(STONE));
  b.s.boxB(2.6, 2.4, 2.6, 0, 0.4, 0, 0, C('#f3ece0'));
  b.s.pyramid(3.0, 1.8, 3.0, 0, 2.8, 0, 0, C('#e07b22'));
  b.p.cone(0.15, 0.5, 0, 4.6, 0, C('#d4a62a'), 8);
  b.s.boxB(0.05, 4.5, 0.05, 1.8, 0, 1.8, 0, C('#6b4a32'));
  b.ds.quad(1.1, 0.7, 2.35, 4.1, 1.8, 0, C('#e07b22'));
  b.g.box(0.4, 0.3, 0.05, 0, 1.0, 1.32, 0, C('#ffb347'));
  endB(b);
  World.addCollider(x, z, 1.5, 1.5, 0, 3);
}
// distant city skyline (backdrop beyond the highway)
function buildSkyline() {
  const b = new GeoBuilder();
  const R = mulberry32(77);
  for (let i = 0; i < 70; i++) {
    const zz = -700 + R() * 1400, xx = 1350 + R() * 500;
    const w = 30 + R() * 50, d = 30 + R() * 40, h = 40 + Math.pow(R(), 2) * 140;
    b.boxB(w, h, d, xx, -5, zz, 0, C('#8390a0'), 0.25);
  }
  const mat = new THREE.ShaderMaterial({
    uniforms: { uHaze: { value: new THREE.Color() }, uNight: U.uGlow, uBase: { value: new THREE.Color('#7c8796') } },
    vertexShader: 'varying vec3 vW; varying vec3 vN; void main(){ vec4 wp = modelMatrix*vec4(position,1.0); vW = wp.xyz; vN = normal; gl_Position = projectionMatrix*viewMatrix*wp; }',
    fragmentShader: `uniform vec3 uHaze, uBase; uniform float uNight; varying vec3 vW; varying vec3 vN;
      float h(vec2 p){ return fract(sin(dot(p, vec2(12.9898,78.233)))*43758.5453); }
      void main(){ vec3 c = mix(uBase*0.55 + uHaze*0.25, uHaze, 0.78 - clamp(vW.y/600.0, 0.0, 0.2)); float side = abs(vN.y) < 0.5 ? 1.0 : 0.0;
        vec2 cell = floor(vec2(vW.x+vW.z, vW.y)/vec2(4.0, 3.5)); float lit = step(0.62, h(cell)) * side;
        vec2 f = fract(vec2(vW.x+vW.z, vW.y)/vec2(4.0,3.5)); float win = step(0.25,f.x)*step(f.x,0.75)*step(0.3,f.y)*step(f.y,0.75);
        c = mix(c, uHaze*0.35, uNight*0.85); c += vec3(1.0,0.8,0.5)*lit*win*uNight*0.9;
        gl_FragColor = vec4(c,1.0);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }`,
    fog: false,
  });
  const m = new THREE.Mesh(b.build(), mat); m.frustumCulled = false;
  G.scene.add(m);
  World.skylineMat = mat;
}
