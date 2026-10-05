// ============================================================================
// Vehicle & implement models (built from primitives)
// ============================================================================
// place a part with local transform (o.x,o.y,o.z,o.ry) applied
function vpart(B, kind, o, args) {
  const c = Math.cos(o.ry || 0), s = Math.sin(o.ry || 0);
  const X = (lx, lz) => (o.x || 0) + lx * c + lz * s, Z = (lx, lz) => (o.z || 0) - lx * s + lz * c;
  const [w, h, d, x, y, z, ry, col, rx, rz] = args;
  if (kind === 'box') B.box(w, h, d, X(x, z), (o.y || 0) + y, Z(x, z), (o.ry || 0) + (ry || 0), col, rx || 0, rz || 0);
  else if (kind === 'cylX') B.add(PRIM.cyl12, B.mat(X(x, z), (o.y || 0) + y, Z(x, z), w, h, d, (o.ry || 0) + (ry || 0), 0, Math.PI / 2), col);
  else if (kind === 'cylY') B.add(PRIM.cyl12, B.mat(X(x, z), (o.y || 0) + y, Z(x, z), w, h, d, (o.ry || 0) + (ry || 0), rx || 0, rz || 0), col);
  else if (kind === 'sphere') B.add(PRIM.ico1, B.mat(X(x, z), (o.y || 0) + y, Z(x, z), w, h, d, (o.ry || 0) + (ry || 0)), col);
  else if (kind === 'halfX') B.add(PRIM.halfCyl, B.mat(X(x, z), (o.y || 0) + y, Z(x, z), w, h, d, (o.ry || 0) + (ry || 0) + Math.PI / 2, 0, Math.PI / 2), col);
}
function buildTractorModel(bb, o) {
  const body = C(o.color || '#b8321f'), cream = C('#efe6cf'), dark = C('#2f3134'), grey = C('#55595d'), tyre = C('#1b1b1d'), rim = C('#d9a42a');
  const P = (k, B, ...a) => vpart(B, k, o, a);
  // chassis & engine
  P('box', bb.s, 0.62, 0.45, 2.2, 0, 0.62, 0.55, 0, dark);
  P('box', bb.p, 0.74, 0.62, 1.55, 0, 1.0, 1.05, 0, body);
  P('box', bb.p, 0.76, 0.12, 1.57, 0, 1.36, 1.05, 0, body);
  P('box', bb.p, 0.77, 0.1, 1.5, 0, 1.12, 1.08, 0, cream);
  P('box', bb.s, 0.66, 0.58, 0.08, 0, 1.0, 1.84, 0, cream);
  for (let i = 0; i < 5; i++) P('box', bb.s, 0.56, 0.04, 0.02, 0, 0.8 + i * 0.1, 1.885, 0, dark);
  P('box', bb.s, 0.9, 0.12, 0.16, 0, 0.55, 1.95, 0, dark);
  // lemon & chillies charm on the bumper
  P('sphere', bb.s, 0.06, 0.07, 0.06, 0, 0.42, 2.03, 0, C('#b5c93a'));
  for (let i = 0; i < 3; i++) P('box', bb.s, 0.02, 0.09, 0.02, -0.03 + i * 0.03, 0.32 - i * 0.02, 2.03, 0, C(i === 1 ? '#2f7d3a' : '#c0231b'));
  // exhaust
  P('cylY', bb.m, 0.08, 0.95, 0.08, -0.26, 1.85, 1.45, 0, dark);
  P('cylY', bb.m, 0.1, 0.12, 0.1, -0.26, 2.33, 1.45, 0, grey);
  // air cleaner
  P('cylY', bb.m, 0.12, 0.35, 0.12, 0.26, 1.55, 1.55, 0, grey);
  // rear body, fenders, seat, steering
  P('box', bb.s, 0.9, 0.55, 0.9, 0, 0.8, -0.45, 0, dark);
  for (const sx of [-1, 1]) {
    P('halfX', bb.p, 1.5, 0.46, 1.5, sx * 0.72, 0.62, -0.55, 0, body);
    P('box', bb.p, 0.46, 0.04, 0.7, sx * 0.72, 1.36, -0.55, 0, body);
    P('box', bb.s, 0.08, 0.14, 0.08, sx * 0.62, 1.28, 1.93, 0, C('#fff6d0'));
  }
  P('box', bb.s, 0.5, 0.1, 0.45, 0, 1.25, -0.72, 0, dark);
  P('box', bb.s, 0.5, 0.5, 0.08, 0, 1.52, -0.95, -0.12, dark);
  P('cylY', bb.s, 0.05, 0.6, 0.05, 0, 1.45, -0.08, 0, grey, -0.55);
  P('cylY', bb.s, 0.38, 0.04, 0.38, 0, 1.72, -0.22, 0, dark, -0.55);
  // hitch
  P('box', bb.m, 0.9, 0.08, 0.08, 0, 0.55, -1.1, 0, grey);
  P('box', bb.m, 0.08, 0.3, 0.5, -0.35, 0.6, -1.0, 0, grey); P('box', bb.m, 0.08, 0.3, 0.5, 0.35, 0.6, -1.0, 0, grey);
  // canopy
  if (o.canopy) {
    for (const [sx, sz] of [[-0.8, -1.05], [0.8, -1.05], [-0.8, 0.3], [0.8, 0.3]]) P('box', bb.m, 0.05, 1.25, 0.05, sx, 1.95, sz, 0, grey);
    P('box', bb.s, 1.75, 0.06, 1.55, 0, 2.58, -0.37, 0, C('#2f5d8a'));
  }
  if (!o.noWheels) {
    for (const sx of [-1, 1]) { P('cylX', bb.s, 1.32, 0.38, 1.32, sx * 0.72, 0.66, -0.55, 0, tyre); P('cylX', bb.p, 0.8, 0.4, 0.8, sx * 0.72, 0.66, -0.55, 0, rim); P('cylX', bb.s, 0.72, 0.2, 0.72, sx * 0.62, 0.36, 1.35, 0, tyre); P('cylX', bb.p, 0.42, 0.22, 0.42, sx * 0.62, 0.36, 1.35, 0, rim); }
  }
}

// ---------- wheel geometry cache ----------
const WheelGeo = {
  cache: new Map(),
  get(r, w, style = 'tractor', rimCol = '#d9a42a') {
    const k = r + '|' + w + '|' + style + '|' + rimCol; let g = this.cache.get(k); if (g) return g;
    const b = new GeoBuilder();
    const tyre = C('#1b1b1d');
    if (style === 'spoke') { // bullock cart wooden wheel
      b.add(PRIM.torus, b.mat(0, 0, 0, r * 2.2, r * 2.2, w * 6, Math.PI / 2), C('#5a4432'));
      for (let i = 0; i < 10; i++) { const a = i / 10 * TAU; b.beam(0, 0, 0, 0, Math.sin(a) * r, Math.cos(a) * r, 0.03, C('#7a5a3a')); }
      b.add(PRIM.cyl8, b.mat(0, 0, 0, 0.22, w * 1.4, 0.22, 0, 0, Math.PI / 2), C('#3a2a1e'));
    } else if (style === 'bike') {
      b.add(PRIM.torus, b.mat(0, 0, 0, r * 2.5, r * 2.5, w * 8, Math.PI / 2), tyre);
      for (let i = 0; i < 12; i++) { const a = i / 12 * TAU; b.beam(0, 0, 0, 0, Math.sin(a) * r * 0.85, Math.cos(a) * r * 0.85, 0.006, C('#c9ccd0')); }
      b.add(PRIM.cyl8, b.mat(0, 0, 0, 0.12, w * 1.2, 0.12, 0, 0, Math.PI / 2), C('#8a8e92'));
    } else {
      b.add(PRIM.cyl16, b.mat(0, 0, 0, r * 2, w, r * 2, 0, 0, Math.PI / 2), tyre);
      b.add(PRIM.cyl12, b.mat(0, 0, 0, r * 1.25, w * 1.04, r * 1.25, 0, 0, Math.PI / 2), C(rimCol));
      b.add(PRIM.cyl8, b.mat(0, 0, 0, r * 0.35, w * 1.1, r * 0.35, 0, 0, Math.PI / 2), C('#3a3a3c'));
      if (style === 'tractor') for (let i = 0; i < 14; i++) { const a = i / 14 * TAU; b.add(PRIM.box, b.mat(0, Math.sin(a) * r, Math.cos(a) * r, w * 0.95, r * 0.1, r * 0.14, 0, a, 0.5), tyre); }
    }
    g = b.build(); this.cache.set(k, g); return g;
  },
};

// ---------- implement models ----------
function buildImplementModel(type) {
  const bb = { s: new GeoBuilder(), m: new GeoBuilder(), p: new GeoBuilder() };
  const orange = C('#e07b22'), blue = C('#2d5f9a'), green = C('#2f7d3a'), grey = C('#55595d'), dark = C('#2f3134'), yellow = C('#e2b81f');
  const box = (B, w, h, d, x, y, z, col, rx = 0, ry = 0, rz = 0) => B.box(w, h, d, x, y, z, ry, col, rx, rz);
  let wheelsLocal = [];
  switch (type) {
    case 'plough':
      box(bb.p, 1.8, 0.12, 0.12, 0, 0.7, -0.2, blue); box(bb.p, 0.12, 0.12, 1.3, 0, 0.7, -0.8, blue);
      for (const x of [-0.5, 0.5]) { box(bb.m, 0.1, 0.55, 0.1, x, 0.42, -0.9 + x * 0.3, grey); box(bb.m, 0.5, 0.35, 0.08, x + 0.12, 0.18, -0.95 + x * 0.3, C('#9aa0a5'), 0, 0.6, 0.3); }
      break;
    case 'cultivator':
      box(bb.p, 2.6, 0.12, 0.12, 0, 0.65, -0.3, green); box(bb.p, 2.6, 0.12, 0.12, 0, 0.65, -0.9, green); box(bb.p, 0.12, 0.12, 0.8, 0, 0.72, -0.55, green);
      for (let i = 0; i < 9; i++) { const x = -1.2 + i * 0.3, z = i % 2 ? -0.3 : -0.9; bb.m.beam(x, 0.62, z, x, 0.05, z - 0.25, 0.025, grey); }
      break;
    case 'rotavator':
      box(bb.p, 2.2, 0.55, 0.75, 0, 0.45, -0.7, orange); box(bb.p, 2.25, 0.08, 0.95, 0, 0.75, -0.7, orange);
      box(bb.m, 0.3, 0.45, 0.35, 0, 0.85, -0.3, grey); box(bb.m, 2.1, 0.06, 0.06, 0, 0.2, -1.05, dark);
      for (const x of [-1.12, 1.12]) box(bb.p, 0.06, 0.55, 0.8, x, 0.4, -0.7, orange);
      break;
    case 'seeddrill':
      box(bb.p, 2.5, 0.12, 0.12, 0, 0.55, -0.3, blue); box(bb.p, 2.4, 0.55, 0.55, 0, 1.0, -0.65, C('#1f5fa0'));
      box(bb.p, 2.45, 0.06, 0.6, 0, 1.3, -0.65, yellow);
      for (let i = 0; i < 9; i++) { const x = -1.1 + i * 0.275; bb.m.beam(x, 0.75, -0.65, x, 0.08, -0.62, 0.025, grey); }
      wheelsLocal.push([1.3, 0.3, -0.9, 0.3, 0.1]); wheelsLocal.push([-1.3, 0.3, -0.9, 0.3, 0.1]);
      break;
    case 'spreader':
      box(bb.p, 0.9, 0.1, 0.9, 0, 0.55, -0.6, orange);
      bb.p.add(PRIM.cone12, bb.p.mat(0, 1.05, -0.6, 1.1, 0.9, 1.1, 0, Math.PI), orange);
      bb.m.add(PRIM.cyl12, bb.m.mat(0, 0.42, -0.6, 0.75, 0.05, 0.75), grey);
      break;
    case 'sprayer':
      bb.p.add(PRIM.cyl16, bb.p.mat(0, 0.95, -0.65, 1.0, 1.1, 0.9, 0, 0, Math.PI / 2), C('#f2f2ee'));
      box(bb.p, 1.2, 0.1, 1.0, 0, 0.35, -0.65, blue);
      box(bb.m, 0.1, 0.9, 0.1, 0, 0.8, -1.15, grey);
      break;
    case 'trailer':
      box(bb.p, 2.0, 0.08, 3.6, 0, 0.9, -2.6, blue);
      for (const x of [-1.0, 1.0]) box(bb.p, 0.06, 0.75, 3.6, x, 1.32, -2.6, blue);
      box(bb.p, 2.0, 0.75, 0.06, 0, 1.32, -0.8, blue); box(bb.p, 2.0, 0.75, 0.06, 0, 1.32, -4.4, blue);
      for (let i = 0; i < 5; i++) box(bb.p, 2.04, 0.06, 0.06, 0, 1.1 + (i % 2) * 0.35, -1.0 - i * 0.8, yellow);
      box(bb.m, 0.1, 0.1, 1.1, 0, 0.72, -0.35, grey);
      box(bb.s, 0.3, 0.5, 0.3, 0, 0.45, -2.6, dark);
      wheelsLocal.push([1.12, 0.48, -2.6, 0.48, 0.3]); wheelsLocal.push([-1.12, 0.48, -2.6, 0.48, 0.3]);
      break;
    case 'tanker':
      bb.p.add(PRIM.cyl16, bb.p.mat(0, 1.25, -2.4, 1.6, 3.2, 1.6, 0, Math.PI / 2, 0), C('#2d5f9a'));
      box(bb.p, 1.2, 0.1, 3.0, 0, 0.55, -2.4, dark);
      box(bb.m, 0.1, 0.1, 1.1, 0, 0.72, -0.35, grey);
      bb.m.add(PRIM.cyl8, bb.m.mat(0, 0.7, -4.05, 0.14, 0.3, 0.14, 0, Math.PI / 2, 0), grey);
      wheelsLocal.push([1.0, 0.48, -2.4, 0.48, 0.3]); wheelsLocal.push([-1.0, 0.48, -2.4, 0.48, 0.3]);
      break;
    case 'bplough':
      bb.s.beam(0, 0.95, 1.9, 0, 0.35, -0.2, 0.06, C('#6b4a32'));
      bb.s.beam(0, 0.35, -0.2, 0, 0.1, -0.5, 0.07, C('#5a3e2a'));
      box(bb.m, 0.14, 0.1, 0.4, 0, 0.06, -0.62, grey, 0.4);
      bb.s.beam(0, 0.3, -0.35, 0.05, 1.0, -0.95, 0.04, C('#6b4a32'));
      break;
    case 'bcart':
      box(bb.s, 1.35, 0.1, 2.3, 0, 1.0, -0.6, C('#7a5a3a'));
      for (const x of [-0.66, 0.66]) { box(bb.s, 0.08, 0.4, 2.3, x, 1.25, -0.6, C('#6b4a32')); for (let i = 0; i < 6; i++) box(bb.s, 0.05, 0.4, 0.05, x, 1.25, -1.6 + i * 0.4, C('#5a3e2a')); }
      bb.s.beam(0, 1.02, 0.55, 0, 1.05, 2.4, 0.06, C('#6b4a32'));
      wheelsLocal.push([0.82, 0.78, -0.6, 0.78, 0.12, 'spoke']); wheelsLocal.push([-0.82, 0.78, -0.6, 0.78, 0.12, 'spoke']);
      break;
  }
  const g = new THREE.Group();
  for (const k of ['s', 'm', 'p']) if (bb[k].n) { const m = new THREE.Mesh(bb[k].build(), k === 'm' ? MAT.metal : k === 'p' ? MAT.paint : MAT.std); m.castShadow = true; m.receiveShadow = true; g.add(m); }
  g.userData.wheels = [];
  for (const [x, y, z, r, w, st] of wheelsLocal) {
    const wm = new THREE.Mesh(WheelGeo.get(r, w, st || 'car', '#9aa0a5'), MAT.std); wm.position.set(x, y, z); wm.castShadow = true; g.add(wm); g.userData.wheels.push({ m: wm, r });
  }
  // moving parts
  if (type === 'sprayer') {
    const booms = [];
    for (const sx of [-1, 1]) {
      const piv = new THREE.Group(); piv.position.set(sx * 0.2, 1.35, -1.2);
      const bm = new GeoBuilder(); bm.box(4.1, 0.07, 0.07, sx * 2.05, 0, 0, 0, C('#55595d')); for (let i = 0; i < 8; i++) bm.box(0.04, 0.2, 0.04, sx * (0.3 + i * 0.5), -0.12, 0, 0, C('#2f3134'));
      const mm = new THREE.Mesh(bm.build(), MAT.metal); mm.castShadow = true; piv.add(mm); g.add(piv); booms.push({ piv, sx });
    }
    g.userData.booms = booms;
  }
  if (type === 'rotavator') {
    const rb = new GeoBuilder(); rb.add(PRIM.cyl8, rb.mat(0, 0, 0, 0.12, 2.1, 0.12, 0, 0, Math.PI / 2), C('#3a3a3c'));
    for (let i = 0; i < 12; i++) { const a = i * 0.9, x = -0.95 + i * 0.17; rb.box(0.04, 0.34, 0.08, x, Math.sin(a) * 0.12, Math.cos(a) * 0.12, 0, C('#9aa0a5'), a); }
    const rotor = new THREE.Mesh(rb.build(), MAT.metal); rotor.position.set(0, 0.3, -0.7); g.add(rotor); g.userData.rotor = rotor;
  }
  if (type === 'spreader') {
    const d = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.34, 0.04, 10), MAT.metal); d.position.set(0, 0.42, -0.6); g.add(d); g.userData.rotor = d; g.userData.rotAxis = 'y';
  }
  // cargo heap (trailer / cart)
  if (type === 'trailer' || type === 'bcart') {
    const hm = new THREE.Mesh(new THREE.SphereGeometry(1, 12, 6, 0, TAU, 0, Math.PI / 2), new THREE.MeshStandardMaterial({ color: 0xd6ad55, roughness: 0.95 }));
    hm.position.set(0, type === 'trailer' ? 0.95 : 1.05, type === 'trailer' ? -2.6 : -0.6); hm.visible = false; hm.castShadow = true;
    g.add(hm); g.userData.heap = hm; g.userData.heapScale = type === 'trailer' ? [0.95, 0.75, 1.75] : [0.62, 0.5, 1.1];
  }
  return g;
}

// ---------- full vehicle models ----------
function vehicleMeshFrom(bb) {
  const g = new THREE.Group();
  for (const k of ['s', 'm', 'p', 'g']) if (bb[k] && bb[k].n) {
    const mat = k === 'm' ? MAT.metal : k === 'p' ? MAT.paint : k === 'g' ? MAT.glow : MAT.std;
    const m = new THREE.Mesh(bb[k].build(), mat); m.castShadow = k !== 'g'; m.receiveShadow = true; g.add(m);
  }
  return g;
}
function buildVehicleModel(type, o = {}) {
  const bb = { s: new GeoBuilder(), m: new GeoBuilder(), p: new GeoBuilder(), g: new GeoBuilder() };
  const wheels = []; // [x, y, z, r, w, style, steer, rim]
  const lights = [];
  let seat = { x: 0, y: 1.3, z: 0 }, pose = 'drive', cam = 9;
  const W = (x, y, z, r, w, style = 'car', steer = false, rim = '#9aa0a5') => wheels.push([x, y, z, r, w, style, steer, rim]);
  switch (type) {
    case 'tractor35': case 'tractor50': {
      buildTractorModel(bb, { color: type === 'tractor50' ? '#2d5f9a' : '#b8321f', noWheels: true, canopy: type === 'tractor50' });
      const s = type === 'tractor50' ? 1.08 : 1;
      W(0.72, 0.66, -0.55, 0.66 * s, 0.38, 'tractor', false, '#d9a42a'); W(-0.72, 0.66, -0.55, 0.66 * s, 0.38, 'tractor', false, '#d9a42a');
      W(0.62, 0.36, 1.35, 0.36, 0.2, 'tractor', true, '#d9a42a'); W(-0.62, 0.36, 1.35, 0.36, 0.2, 'tractor', true, '#d9a42a');
      seat = { x: 0, y: 1.3, z: -0.72 }; lights.push([0.62, 1.28, 1.97], [-0.62, 1.28, 1.97]);
      break;
    }
    case 'harvester': {
      const y = C('#e2b81f'), gr = C('#2f7d3a'), dk = C('#2f3134'), gl = C('#1e2a33');
      bb.p.box(2.6, 1.9, 5.2, 0, 2.05, -0.4, 0, y); bb.p.box(2.62, 0.25, 5.22, 0, 1.2, -0.4, 0, gr);
      bb.p.box(2.2, 1.0, 2.2, 0, 3.4, -1.3, 0, y);
      bb.s.box(1.6, 1.3, 1.5, 0, 3.55, 1.45, 0, gl); bb.p.box(1.7, 0.12, 1.6, 0, 4.25, 1.45, 0, C('#f2f2ee'));
      bb.p.box(1.2, 0.9, 1.4, 0, 1.3, 2.4, 0, y);
      bb.p.box(4.6, 0.55, 1.4, 0, 0.55, 3.55, 0, y); bb.m.box(4.7, 0.06, 0.25, 0, 0.3, 4.2, 0, C('#9aa0a5'));
      for (const sx of [-2.28, 2.28]) bb.p.box(0.08, 0.8, 1.4, sx, 0.7, 3.55, 0, y);
      bb.m.beam(1.25, 3.0, -2.6, 1.3, 3.3, 1.2, 0.12, dk);
      for (let i = 0; i < 4; i++) bb.s.box(0.06, 0.06, 0.06, 0, 0.9, 4.2, 0, dk);
      W(1.3, 0.85, 0.9, 0.85, 0.55, 'tractor', false, '#e2b81f'); W(-1.3, 0.85, 0.9, 0.85, 0.55, 'tractor', false, '#e2b81f');
      W(1.05, 0.5, -2.4, 0.5, 0.3, 'car', true, '#e2b81f'); W(-1.05, 0.5, -2.4, 0.5, 0.3, 'car', true, '#e2b81f');
      seat = { x: 0, y: 3.05, z: 1.45 }; cam = 15; lights.push([0.6, 4.1, 2.25], [-0.6, 4.1, 2.25]);
      break;
    }
    case 'moped': case 'bike': {
      const body = C(type === 'bike' ? '#1f1f24' : '#2d6ca6'), chrome = C('#c9ccd0');
      bb.p.box(0.26, 0.28, 0.6, 0, 0.78, 0.15, 0, body);
      bb.s.box(0.26, 0.1, 0.62, 0, 0.9, -0.28, 0, C('#1a1a1a'));
      bb.m.beam(0, 0.45, 0.62, 0, 1.05, 0.5, 0.03, chrome); bb.m.box(0.7, 0.03, 0.03, 0, 1.05, 0.48, 0, chrome);
      bb.m.beam(0, 0.4, -0.62, 0, 0.8, -0.2, 0.03, chrome); bb.m.beam(0.1, 0.36, -0.3, 0.1, 0.38, -0.75, 0.04, C('#6a6a6a'));
      bb.p.box(0.18, 0.16, 0.14, 0, 0.98, 0.62, 0, body);
      if (type === 'bike') { bb.p.box(0.3, 0.22, 0.45, 0, 1.0, 0.18, 0, C('#b8321f')); }
      W(0, 0.32, 0.62, 0.32, 0.07, 'bike', true); W(0, 0.32, -0.62, 0.32, 0.08, 'bike');
      seat = { x: 0, y: 0.92, z: -0.25 }; pose = 'ride'; cam = 5.5; lights.push([0, 0.98, 0.7]);
      break;
    }
    case 'pickup': {
      const body = C(o.color || '#d8dde2'), dk = C('#2f3134'), gl = C('#1e2a33');
      bb.p.box(1.8, 0.75, 4.6, 0, 0.9, 0, 0, body);
      bb.p.box(1.75, 0.8, 1.7, 0, 1.65, 0.75, 0, body); bb.s.box(1.6, 0.55, 1.72, 0, 1.72, 0.76, 0, gl); bb.s.box(1.62, 0.56, 1.4, 0, 1.72, 0.75, 0, gl);
      for (const x of [-0.88, 0.88]) bb.p.box(0.06, 0.45, 2.3, x, 1.45, -1.2, 0, body);
      bb.p.box(1.8, 0.45, 0.06, 0, 1.45, -2.32, 0, body);
      bb.s.box(1.82, 0.25, 0.2, 0, 0.62, 2.3, 0, dk); bb.s.box(1.82, 0.25, 0.2, 0, 0.62, -2.3, 0, dk);
      for (const x of [-0.72, 0.72]) { W(x, 0.38, 1.45, 0.38, 0.26, 'car', true); W(x, 0.38, -1.45, 0.38, 0.26, 'car'); }
      seat = { x: 0.4, y: 1.2, z: 0.6 }; pose = 'drive'; lights.push([0.65, 1.0, 2.31], [-0.65, 1.0, 2.31]);
      break;
    }
    case 'bus': {
      const lo = C('#1f8a8a'), up = C('#f2efe6'), stripe = C('#e2b81f'), dk = C('#2f3134');
      bb.p.box(2.5, 1.3, 10.8, 0, 1.25, 0, 0, lo); bb.p.box(2.5, 1.35, 10.8, 0, 2.55, 0, 0, up); bb.p.box(2.52, 0.18, 10.82, 0, 1.93, 0, 0, stripe);
      bb.p.box(2.5, 0.12, 10.8, 0, 3.25, 0, 0, up);
      for (let i = 0; i < 8; i++) for (const x of [-1.26, 1.26]) bb.g.box(0.04, 0.75, 1.0, x, 2.45, -4.4 + i * 1.2, 0, C(frand() < 0.7 ? '#ffe2a8' : '#000000'));
      bb.s.box(2.2, 1.0, 0.05, 0, 2.4, 5.41, 0, C('#1e2a33'));
      bb.s.box(2.4, 0.25, 0.2, 0, 0.6, 5.4, 0, dk); bb.s.box(2.4, 0.25, 0.2, 0, 0.6, -5.4, 0, dk);
      for (const x of [-1.1, 1.1]) { W(x, 0.5, 3.6, 0.5, 0.32, 'car', true); W(x, 0.5, -3.2, 0.5, 0.42, 'car'); }
      seat = { x: -0.8, y: 1.5, z: 4.6 }; cam = 16; lights.push([0.9, 0.9, 5.42], [-0.9, 0.9, 5.42]);
      break;
    }
    case 'truck': {
      const cab = C(o.color || pick(['#e07b22', '#e2b81f', '#c0392b', '#2f7d3a'])), box2 = C(pick(['#2d5f9a', '#2f7d3a', '#8a2f8f', '#b8321f'])), dk = C('#2f3134');
      bb.p.box(2.3, 1.7, 1.9, 0, 1.9, 2.9, 0, cab); bb.s.box(2.1, 0.7, 0.05, 0, 2.25, 3.86, 0, C('#1e2a33'));
      bb.p.box(2.35, 0.3, 1.95, 0, 2.9, 2.9, 0, C('#e2b81f'));
      bb.p.box(2.4, 1.8, 5.4, 0, 2.2, -0.9, 0, box2); bb.s.sphere(1.25, 0, 3.1, -0.9, C('#6b4a32'), PRIM.ico1, 1, 0.45, 2.3);
      for (let i = 0; i < 4; i++) bb.p.box(2.44, 0.1, 5.44, 0, 1.5 + i * 0.4, -0.9, 0, C(i % 2 ? '#e2b81f' : '#c0392b'));
      bb.s.box(2.3, 0.4, 7.9, 0, 0.9, 0.3, 0, dk);
      for (const x of [-1.05, 1.05]) { W(x, 0.55, 2.8, 0.55, 0.35, 'car', true); W(x, 0.55, -1.8, 0.55, 0.45, 'car'); W(x, 0.55, -2.9, 0.55, 0.45, 'car'); }
      seat = { x: -0.6, y: 1.8, z: 2.9 }; cam = 14; lights.push([0.85, 1.2, 3.87], [-0.85, 1.2, 3.87]);
      break;
    }
    case 'car': case 'taxi': {
      const body = C(o.color || (type === 'taxi' ? '#f2c20f' : pick(['#c0392b', '#f2f2ee', '#2d6ca6', '#7a7f87', '#e07b22', '#2f7d3a']))), dk = C('#2f3134'), gl = C('#1e2a33');
      bb.p.box(1.62, 0.62, 3.7, 0, 0.62, 0, 0, body);                       // body
      bb.p.box(1.5, 0.56, 2.0, 0, 1.2, -0.25, 0, body);                      // cabin
      bb.s.box(1.53, 0.4, 1.72, 0, 1.22, -0.22, 0, gl, 0, 0, 0); bb.s.box(1.32, 0.4, 2.03, 0, 1.22, -0.25, 0, gl, 0, 0, 0);   // windows
      bb.s.box(1.66, 0.2, 0.14, 0, 0.42, 1.86, 0, dk); bb.s.box(1.66, 0.2, 0.14, 0, 0.42, -1.86, 0, dk);                      // bumpers
      bb.s.box(0.9, 0.12, 0.05, 0, 0.62, 1.86, 0, C('#9aa0a5'));                                                                // grille
      if (type === 'taxi') { bb.p.box(1.64, 0.1, 3.72, 0, 0.8, 0, 0, C('#1a1a1a'), 0, 0, 0); bb.p.box(0.55, 0.16, 0.26, 0, 1.56, -0.25, 0, C('#f2f2ee')); }
      for (const x of [-0.74, 0.74]) { W(x, 0.33, 1.15, 0.33, 0.22, 'car', true); W(x, 0.33, -1.15, 0.33, 0.22, 'car'); }
      seat = { x: 0.35, y: 0.45, z: -0.15 }; cam = 7.5; lights.push([0.55, 0.72, 1.87], [-0.55, 0.72, 1.87]);
      break;
    }
    case 'jeep': {
      const body = C(o.color || pick(['#3f5f2a', '#b8321f', '#20364a', '#e2b81f'])), dk = C('#2f3134'), mt = C('#3a3d42');
      bb.p.box(1.72, 0.72, 3.8, 0, 0.9, 0, 0, body);                         // tub
      bb.p.box(1.72, 0.28, 1.25, 0, 1.38, 1.22, 0, body);                    // bonnet
      bb.s.box(1.52, 0.5, 0.06, 0, 1.75, 0.6, 0, C('#1e2a33'), 0.25);        // windscreen
      for (const x of [-0.8, 0.8]) bb.m.box(0.08, 0.75, 0.08, x, 1.62, -0.55, 0, mt);
      bb.m.box(1.68, 0.08, 0.08, 0, 2.0, -0.55, 0, mt);                       // roll bar
      bb.s.cyl(0.36, 0.24, 0, 0.95, -2.02, dk, 10, 0, Math.PI / 2);          // spare wheel
      bb.s.box(1.8, 0.2, 0.16, 0, 0.5, 1.92, 0, dk); bb.s.box(1.8, 0.2, 0.16, 0, 0.5, -1.92, 0, dk);
      for (const x of [-0.8, 0.8]) { W(x, 0.42, 1.25, 0.42, 0.3, 'car', true); W(x, 0.42, -1.25, 0.42, 0.3, 'car'); }
      seat = { x: 0.4, y: 0.95, z: 0.05 }; cam = 7.5; lights.push([0.6, 1.1, 1.87], [-0.6, 1.1, 1.87]);
      break;
    }
    case 'scooter': {
      const body = C(o.color || pick(['#e84393', '#2d6ca6', '#f2f2ee', '#e2b81f', '#2f7d3a'])), dk = C('#2a2a2e'), ch = C('#c9ccd0');
      bb.p.box(0.42, 0.22, 0.95, 0, 0.42, -0.1, 0, body);                    // floor board
      bb.p.box(0.46, 0.42, 0.62, 0, 0.7, -0.4, 0, body);                     // body under the seat
      bb.s.box(0.36, 0.1, 0.6, 0, 0.96, -0.38, 0, dk);                       // seat
      bb.p.box(0.38, 0.78, 0.16, 0, 0.78, 0.42, 0, body);                    // front shield
      bb.m.beam(0, 0.38, 0.58, 0, 1.18, 0.46, 0.03, ch); bb.m.box(0.64, 0.04, 0.04, 0, 1.18, 0.46, 0, ch);
      W(0, 0.24, 0.6, 0.24, 0.08, 'bike', true); W(0, 0.24, -0.62, 0.24, 0.09, 'bike');
      seat = { x: 0, y: 0.9, z: -0.32 }; pose = 'ride'; cam = 5.5; lights.push([0, 1.02, 0.52]);
      break;
    }
    case 'cycle': {
      const fr = C(o.color || pick(['#1f1f24', '#2d6ca6', '#c0392b', '#2f7d3a'])), ch = C('#c9ccd0'), dk = C('#1a1a1a');
      bb.m.beam(0, 0.36, -0.5, 0, 0.78, -0.05, 0.022, fr); bb.m.beam(0, 0.78, -0.05, 0, 0.84, 0.42, 0.022, fr);
      bb.m.beam(0, 0.36, -0.5, 0, 0.38, 0.02, 0.02, fr); bb.m.beam(0, 0.38, 0.02, 0, 0.84, 0.42, 0.024, fr); bb.m.beam(0, 0.38, 0.02, 0, 0.8, -0.05, 0.022, fr);
      bb.m.beam(0, 0.36, 0.55, 0, 0.98, 0.42, 0.022, ch); bb.m.box(0.52, 0.03, 0.03, 0, 0.99, 0.4, 0, ch);
      bb.s.box(0.14, 0.06, 0.26, 0, 0.84, -0.06, 0, dk);
      W(0, 0.36, 0.55, 0.36, 0.035, 'bike', true); W(0, 0.36, -0.5, 0.36, 0.035, 'bike');
      seat = { x: 0, y: 0.82, z: -0.08 }; pose = 'ride'; cam = 5;
      break;
    }
    case 'kart': {
      const body = C(o.color || pick(['#e2b81f', '#c0392b', '#2f7d3a', '#2d6ca6'])), dk = C('#2f3134');
      bb.s.box(1.1, 0.08, 1.95, 0, 0.17, 0, 0, dk);                          // chassis
      bb.p.box(0.72, 0.2, 0.55, 0, 0.32, 0.82, 0, body);                     // nose
      bb.p.box(1.25, 0.14, 0.28, 0, 0.3, -0.98, 0, body);                    // rear bumper
      for (const x of [-0.5, 0.5]) bb.p.box(0.24, 0.2, 1.0, x, 0.3, 0.02, 0, body);
      bb.s.box(0.46, 0.42, 0.4, 0, 0.44, -0.4, 0, C('#1a1a1a'));            // seat back
      bb.m.box(0.32, 0.04, 0.04, 0, 0.62, 0.28, 0, dk); bb.m.beam(0, 0.3, 0.45, 0, 0.62, 0.3, 0.02, dk);
      for (const x of [-0.56, 0.56]) { W(x, 0.16, 0.66, 0.16, 0.18, 'car', true); W(x * 1.04, 0.19, -0.64, 0.19, 0.25, 'car'); }
      seat = { x: 0, y: 0.3, z: -0.32 }; cam = 5.2;
      break;
    }
    case 'heli': {
      const body = C(o.color || '#c0392b'), wh = C('#f2f2ee'), dk = C('#2f3134'), gl = C('#1e2a33');
      bb.p.sphere(1, 0, 1.6, 0.2, body, PRIM.ico1, 1.2, 1.0, 1.75);         // cabin
      bb.s.sphere(1, 0, 1.78, 0.95, gl, PRIM.ico1, 0.98, 0.72, 0.92);       // glass nose
      bb.p.box(0.34, 0.34, 3.7, 0, 1.78, -2.7, 0, body); bb.p.box(0.36, 0.08, 3.7, 0, 1.6, -2.7, 0, wh);   // tail boom
      bb.p.box(0.08, 0.95, 0.62, 0, 2.2, -4.45, 0, body); bb.p.box(1.1, 0.06, 0.4, 0, 1.85, -4.2, 0, body);
      bb.p.box(2.2, 0.12, 1.4, 0, 1.0, 0.2, 0, wh);                          // belly stripe
      for (const x of [-0.92, 0.92]) { bb.m.box(0.08, 0.08, 3.1, x, 0.1, 0.2, 0, dk); for (const z of [-0.6, 0.9]) bb.m.beam(x, 0.1, z, x * 0.6, 0.85, z, 0.04, dk); }
      bb.m.cyl(0.14, 0.45, 0, 2.6, 0.25, dk, 8);                             // rotor mast
      seat = { x: 0.35, y: 1.0, z: 0.55 }; cam = 18; lights.push([0, 0.95, 1.95]);
      break;
    }
    case 'auto': {
      const body = C('#2f7d3a'), roof = C('#e2b81f');
      bb.p.box(1.3, 0.7, 2.3, 0, 0.75, 0, 0, body); bb.p.box(1.35, 0.08, 2.2, 0, 1.9, -0.1, 0, roof);
      for (const [x, z] of [[-0.62, -1.1], [0.62, -1.1], [-0.6, 0.8], [0.6, 0.8]]) bb.m.box(0.05, 0.85, 0.05, x, 1.47, z, 0, C('#2f3134'));
      bb.p.box(1.3, 0.8, 0.1, 0, 1.45, -1.15, 0, roof); bb.s.box(1.1, 0.6, 0.05, 0, 1.45, 1.0, 0, C('#1e2a33'));
      W(0, 0.28, 1.0, 0.28, 0.14, 'car', true); W(0.58, 0.28, -0.7, 0.28, 0.14, 'car'); W(-0.58, 0.28, -0.7, 0.28, 0.14, 'car');
      seat = { x: 0, y: 1.0, z: 0.5 }; cam = 6; lights.push([0, 1.0, 1.16]);
      break;
    }
  }
  const g = vehicleMeshFrom(bb);
  const wheelObjs = [];
  for (const [x, y, z, r, w, st, steer, rim] of wheels) {
    const piv = new THREE.Group(); piv.position.set(x, y, z);
    const wm = new THREE.Mesh(WheelGeo.get(r, w, st, rim), MAT.std); wm.castShadow = true;
    piv.add(wm); g.add(piv); wheelObjs.push({ piv, m: wm, r, steer });
  }
  // headlight glow (per vehicle material so it can switch)
  const lightMat = new THREE.MeshStandardMaterial({ color: 0x333333, emissive: 0xfff2cc, emissiveIntensity: 0, roughness: 0.3 });
  for (const [x, y, z] of lights) { const lm = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.14, 0.04), lightMat); lm.position.set(x, y, z); g.add(lm); }
  g.userData = { wheels: wheelObjs, seat, pose, cam, lightMat };
  if (type === 'heli') {
    const bm = new THREE.MeshStandardMaterial({ color: 0x2a2c30, roughness: 0.6 });
    const rotor = new THREE.Group(); rotor.position.set(0, 3.08, 0.25);
    for (let k = 0; k < 2; k++) { const b = new THREE.Mesh(new THREE.BoxGeometry(9.2, 0.05, 0.32), bm); b.rotation.y = k * Math.PI / 2; b.castShadow = true; rotor.add(b); }
    const tail = new THREE.Group(); tail.position.set(0.24, 2.2, -4.5);
    for (let k = 0; k < 2; k++) { const b = new THREE.Mesh(new THREE.BoxGeometry(0.05, 1.3, 0.14), bm); b.rotation.x = k * Math.PI / 2; tail.add(b); }
    g.add(rotor); g.add(tail); g.userData.rotor = rotor; g.userData.tailRotor = tail;
  }
  return g;
}
