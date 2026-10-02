// ============================================================================
// Farm management: land, house levels, upgrades & construction, dairy, workers,
// village development, services, rank progression
// ============================================================================
const SLOTS = {
  warehouse: { x: -172, z: 36, ry: 0, w: 16, d: 9 }, coldStorage: { x: -191, z: 36, ry: 0, w: 9, d: 9 }, quarters: { x: -152, z: 32, ry: 0, w: 10, d: 6 },
  dairyShed: { x: -190, z: 66, ry: Math.PI, w: 12, d: 7 }, garage: { x: -170, z: 68, ry: Math.PI, w: 11, d: 8 }, waterTank: { x: -152, z: 70, ry: 0, w: 3, d: 3 },
  solarPump: { x: -155, z: 50, ry: 0, w: 6, d: 3 }, farmPond: { x: -191, z: 97, ry: 0, w: 16, d: 18 }, greenhouse: { x: -164, z: 124, ry: 0, w: 26, d: 26 },
};
const HOME_RY = Math.PI / 2;
const YARD_PT = { x: -112, z: 56 };

function bundle() { return { s: new GeoBuilder(), m: new GeoBuilder(), p: new GeoBuilder(), g: new GeoBuilder(), ds: new GeoBuilder() }; }
function bundleGroup(bb) {
  const g = new THREE.Group();
  const mats = { s: MAT.std, m: MAT.metal, p: MAT.paint, g: MAT.glow, ds: MAT.stdDS };
  for (const k in bb) if (bb[k].n) { const m = new THREE.Mesh(bb[k].build(), mats[k]); m.castShadow = k !== 'g'; m.receiveShadow = true; g.add(m); }
  return g;
}

function buildPlayerHouseModel(level) {
  const bb = bundle(); const b = bb;
  const plinth = C('#8c847a');
  if (level === 0) {
    const wall = C('#e8b4c0'), trim = C('#8e3b46');
    b.s.boxB(7, 1, 6, 0, -0.6, 0, 0, plinth); b.s.boxB(6.5, 3, 5.5, 0, 0.4, 0, 0, wall); b.s.boxB(6.55, 0.5, 5.55, 0, 0.4, 0, 0, trim);
    addDoor(b, -1, 0.4, 2.75, 0, trim, C('#2f5d4a')); addWindow(b, 1.6, 1.3, 2.75, 0, trim); addWindow(b, 3.25, 1.3, 0, Math.PI / 2, trim);
    b.s.prism(6.5, 1.7, 5.5, 0, 3.4, 0, 0, wall); tileRoof(b, 6.5, 5.5, 3.28, 1.82);
    b.s.boxB(7, 1, 2.4, 0, -0.6, 4, 0, plinth);
    for (const x of [-3.1, 3.1]) b.s.boxB(0.2, 2.3, 0.2, x, 0.4, 5.0, 0, C('#6b4a32'));
    b.s.box(7.4, 0.07, 3.0, 0, 2.85, 4.2, 0, C(TILE_A), 0.18);
    b.s.boxB(0.9, 0.08, 1.9, 2, 0.75, 3.9, 0, C('#c8b48a')); b.s.boxB(1.0, 0.35, 2.0, 2, 0.4, 3.9, 0, C('#6b4a32'));
    buildHayStack(b.s, -6.2, 0, -2.5, 0.9);
    for (const [x, z] of [[-6, 2.2], [-9, 2.2], [-6, 5.4], [-9, 5.4]]) b.s.boxB(0.18, 2.3, 0.18, x, 0, z, 0, C('#5a4432'));
    thatchRoofAt(b, -7.5, 3.8, 3.4, 3.6, 2.3);
    return bundleGroup(bb);
  }
  if (level === 1) {
    const wall = C('#b7d4e6'), trim = C('#f4f1ea');
    b.s.boxB(9, 1, 7.5, 0, -0.5, 0, 0, plinth); b.s.boxB(8.5, 3.2, 7, 0, 0.5, 0, 0, wall); b.s.boxB(8.55, 0.5, 7.05, 0, 0.5, 0, 0, C('#2f5d8a'));
    addDoor(b, 0, 0.5, 3.5, 0, C('#2f5d8a'), C('#6b3a26')); addWindow(b, -2.6, 1.4, 3.5, 0, C('#2f5d8a')); addWindow(b, 2.6, 1.4, 3.5, 0, C('#2f5d8a'));
    addWindow(b, 4.25, 1.4, 0, Math.PI / 2, C('#2f5d8a')); addWindow(b, -4.25, 1.4, 0, -Math.PI / 2, C('#2f5d8a'));
    flatRoof(b, 8.5, 7, 3.7, wall, C('#2f5d8a'));
    b.s.boxB(9, 1, 2.6, 0, -0.5, 4.8, 0, plinth);
    for (const x of [-4, 0, 4]) b.s.boxB(0.26, 2.5, 0.26, x, 0.5, 5.9, 0, trim);
    b.s.boxB(9.4, 0.15, 3, 0, 3.0, 5.0, 0, C(SLAB));
    return bundleGroup(bb);
  }
  if (level === 2) {
    const wall = C('#f0e09c'), trim = C('#8e3b46');
    b.s.boxB(12.6, 1, 9.6, 0, -0.5, 0, 0, plinth); b.s.boxB(12, 3.3, 9, 0, 0.5, 0, 0, wall); b.s.boxB(12.05, 0.5, 9.05, 0, 0.5, 0, 0, trim);
    addDoor(b, 0, 0.5, 4.5, 0, trim, C('#6b3a26'), 1.4, 2.3);
    for (const x of [-4, -2.2, 2.2, 4]) addWindow(b, x, 1.4, 4.5, 0, trim);
    addWindow(b, 6, 1.4, 1.5, Math.PI / 2, trim); addWindow(b, 6, 1.4, -2, Math.PI / 2, trim); addWindow(b, -6, 1.4, 0, -Math.PI / 2, trim);
    b.s.boxB(12.6, 0.2, 9.6, 0, 3.8, 0, 0, C(SLAB));
    b.s.boxB(8, 3.1, 6.5, -1.5, 4.0, -1, 0, wall); addWindow(b, -3.5, 4.8, 2.25, 0, trim); addWindow(b, 0.5, 4.8, 2.25, 0, trim);
    flatRoof(b, 8, 6.5, 7.1, wall, trim);
    b.m.boxB(12.2, 0.9, 0.06, 0, 4.0, 4.75, 0, C('#3a3a40'));
    const cw = C('#e8e2d6');
    b.s.boxB(22, 1.5, 0.3, 0, 0, -9, 0, cw); b.s.boxB(0.3, 1.5, 18, -11, 0, 0, 0, cw); b.s.boxB(0.3, 1.5, 18, 11, 0, 0, 0, cw);
    b.s.boxB(8.5, 1.5, 0.3, -6.75, 0, 9, 0, cw); b.s.boxB(8.5, 1.5, 0.3, 6.75, 0, 9, 0, cw);
    for (const x of [-2.5, 2.5]) { b.s.boxB(0.8, 2.2, 0.8, x, 0, 9, 0, C('#d8c9a8')); b.g.box(0.3, 0.3, 0.3, x, 2.4, 9, 0, C('#ffd9a0')); }
    return bundleGroup(bb);
  }
  if (level === 3) {
    const wall = C('#f3f1ec'), trim = C('#46525a'), wood = C('#8a5a3a');
    b.s.boxB(14.6, 0.8, 10.6, 0, -0.4, 0, 0, C('#6d6a64')); b.s.boxB(14, 3.4, 10, 0, 0.4, 0, 0, wall); b.s.boxB(6, 3.4, 0.2, -3, 0.4, 5.05, 0, wood);
    b.g.box(5, 2.4, 0.06, 3.5, 1.7, 5.03, 0, C('#ffe2a8')); b.g.box(3.0, 2.0, 0.06, -7.03, 1.7, 0, Math.PI / 2, C('#ffe2a8'));
    addDoor(b, -3, 0.4, 5.1, 0, trim, C('#3a2a20'), 1.5, 2.4);
    b.s.boxB(14.4, 0.25, 10.4, 0, 3.8, 0, 0, C('#cfc9bf'));
    b.s.boxB(10, 3.2, 8, 1.5, 4.05, -0.5, 0, wall); b.g.box(7, 2.0, 0.06, 1.5, 5.0, 3.53, 0, C('#dfe8ff'));
    b.s.boxB(10.6, 0.25, 8.6, 1.5, 7.25, -0.5, 0, C('#cfc9bf'));
    for (let i = 0; i < 6; i++) b.m.box(1.5, 0.05, 2.4, -1.5 + (i % 3) * 1.7, 7.9, -2.5 + Math.floor(i / 3) * 2.6, 0, C('#1f3a6a'), -0.35);
    b.m.boxB(12, 0.9, 0.06, 0, 4.05, 5.15, 0, C('#2a2a2e'));
    for (const z of [6, 11]) for (const x of [9, 13.5]) b.m.boxB(0.2, 2.8, 0.2, x - 2, 0, z - 3, 0, trim);
    b.m.box(5.4, 0.12, 6.4, 9.25, 2.85, 5.5, 0, C('#8f969b'));
    const cw = C('#d8d2c4');
    b.s.boxB(26, 1.6, 0.3, 0, 0, -10, 0, cw); b.s.boxB(0.3, 1.6, 20, -13, 0, 0, 0, cw); b.s.boxB(0.3, 1.6, 20, 13, 0, 0, 0, cw);
    b.s.boxB(10, 1.6, 0.3, -8, 0, 10, 0, cw); b.s.boxB(7, 1.6, 0.3, 9.5, 0, 10, 0, cw);
    b.m.boxB(5.6, 1.5, 0.08, 3.3, 0, 10, 0, C('#2a2a2e'));
    b.s.boxB(6, 0.1, 3, -7, 0, 7.5, 0, C('#4f7f30')); b.s.boxB(4, 0.1, 3, 8, 0, -7, 0, C('#4f7f30'));
    return bundleGroup(bb);
  }
  // level 4: luxury agricultural estate
  const wall = C('#f6efe0'), stone = C('#b9ae9c'), trim = C('#7a5a3a');
  b.s.boxB(19, 0.9, 13, 0, -0.4, 0, 0, stone);
  b.s.boxB(18, 3.6, 12, 0, 0.5, 0, 0, wall); b.s.boxB(18.05, 0.6, 12.05, 0, 0.5, 0, 0, stone);
  for (let i = 0; i < 6; i++) b.s.boxB(0.5, 3.6, 0.5, -7.5 + i * 3, 0.5, 6.6, 0, C('#efe6d6'));
  b.s.boxB(18.8, 0.35, 2.4, 0, 4.1, 6.4, 0, stone);
  for (const x of [-6, -2, 2, 6]) b.g.box(2.4, 2.4, 0.06, x, 1.8, 6.03, 0, C('#ffe2a8'));
  addDoor(b, 0, 0.5, 6.05, 0, trim, C('#4a2a1a'), 2.0, 2.8);
  b.s.boxB(18.4, 0.3, 12.4, 0, 4.1, 0, 0, C('#d8cfbf'));
  b.s.boxB(14, 3.4, 9, 0, 4.4, -0.5, 0, wall);
  for (const x of [-4.5, 0, 4.5]) b.g.box(2.6, 2.0, 0.06, x, 5.3, 4.03, 0, C('#ffe2a8'));
  b.s.boxB(14.6, 0.3, 9.6, 0, 7.8, -0.5, 0, C('#d8cfbf'));
  for (const x of [-5, 0, 5]) for (const z of [-3, 2]) b.s.boxB(0.25, 2.2, 0.25, x, 8.1, z, 0, trim);
  b.s.boxB(11, 0.15, 6, 0, 10.3, -0.5, 0, trim);
  // side wing & garage
  b.s.boxB(8, 3.4, 8, 13, 0.4, -2, 0, wall); b.s.boxB(8.4, 0.3, 8.4, 13, 3.8, -2, 0, C('#d8cfbf'));
  b.m.boxB(6, 2.6, 0.08, 13, 0.4, 2.05, 0, C('#46525a'));
  // compound, gate, lawn, fountain
  const cw = C('#e8dcc4');
  b.s.boxB(36, 1.8, 0.4, 0, 0, -12, 0, cw); b.s.boxB(0.4, 1.8, 24, -18, 0, 0, 0, cw); b.s.boxB(0.4, 1.8, 24, 18, 0, 0, 0, cw);
  b.s.boxB(14, 1.8, 0.4, -11, 0, 12, 0, cw); b.s.boxB(14, 1.8, 0.4, 11, 0, 12, 0, cw);
  for (const x of [-4, 4]) { b.s.boxB(1.2, 3, 1.2, x, 0, 12, 0, stone); b.g.box(0.5, 0.5, 0.5, x, 3.3, 12, 0, C('#ffd9a0')); }
  b.m.boxB(6.8, 1.6, 0.08, 0, 0, 12, 0, C('#b8862a'));
  b.s.boxB(30, 0.12, 4.5, 0, 0, 9.2, 0, C('#4f8a35'));
  b.s.cyl(1.8, 0.6, -9, 0, 9.2, stone, 16); b.s.cyl(0.25, 1.4, -9, 0.6, 9.2, stone, 8);
  return bundleGroup(bb);
}
function thatchRoofAt(b, x, z, w, d, y) { b.s.pyramid(w + 1.0, 1.2, d + 1.0, x, y, z, 0, C(STRAW)); }
function houseFootprint(level) { return [[3.6, 3.2], [4.6, 4.0], [11.2, 9.2], [13.2, 10.2], [18.2, 12.2]][level]; }

function buildUpgradeModel(id) {
  const bb = bundle(); const b = bb;
  switch (id) {
    case 'warehouse': {
      b.s.boxB(16.4, 0.4, 9.4, 0, -0.2, 0, 0, C('#8e877c')); b.s.boxB(16, 5, 9, 0, 0.2, 0, 0, C('#d8d2c4'));
      b.m.box(16.8, 0.1, 5.2, 0, 5.9, 2.3, 0, C('#9aa3a8'), 0.36); b.m.box(16.8, 0.1, 5.2, 0, 5.9, -2.3, 0, C('#9aa3a8'), -0.36);
      b.s.prism(16, 1.6, 9, 0, 5.2, 0, 0, C('#d8d2c4'));
      b.m.boxB(4, 3.6, 0.1, -3, 0.2, 4.55, 0, C('#5d6a72')); b.m.boxB(4, 3.6, 0.1, 3, 0.2, 4.55, 0, C('#5d6a72'));
      break;
    }
    case 'coldStorage': {
      b.s.boxB(9.4, 0.4, 9.4, 0, -0.2, 0, 0, C('#8e877c')); b.p.boxB(9, 5.5, 9, 0, 0.2, 0, 0, C('#f4f6f8')); b.p.boxB(9.05, 0.6, 9.05, 0, 0.2, 0, 0, C('#2d6ca6'));
      b.m.boxB(2.4, 3, 0.15, 0, 0.2, 4.55, 0, C('#c9ccd0'));
      for (let i = 0; i < 3; i++) { b.m.boxB(1.4, 1.2, 1.0, -3 + i * 3, 5.7, -2.5, 0, C('#8a9196')); b.m.cylC(0.45, 0.1, -3 + i * 3, 6.95, -2.5, C('#2f3134'), 12); }
      break;
    }
    case 'quarters': {
      b.s.boxB(10.4, 0.6, 6.4, 0, -0.3, 0, 0, C('#8e877c')); b.s.boxB(10, 3, 6, 0, 0.3, 0, 0, C('#e7d8b8'));
      for (let i = 0; i < 4; i++) { addDoor(b, -3.75 + i * 2.5, 0.3, 3, 0, C('#8e3b46'), C('#3a4f7a'), 0.9, 2.0); }
      flatRoof(b, 10, 6, 3.3, C('#e7d8b8'), C('#8e3b46'));
      break;
    }
    case 'dairyShed': {
      for (const x of [-6, -2, 2, 6]) for (const z of [-3.5, 3.5]) b.m.boxB(0.2, 3, 0.2, x, 0, z, 0, C('#5d6a72'));
      b.m.box(12.8, 0.1, 8, 0, 3.2, 0, 0, C('#9aa3a8'), 0.1);
      b.s.boxB(12, 0.2, 7, 0, 0, 0, 0, C('#8e877c'));
      b.s.boxB(11.5, 0.6, 0.8, 0, 0.2, -3, 0, C('#7d756d'));
      b.s.cyl(0.7, 0.9, 5, 0.2, 2.5, C('#2b5fa8'), 10);
      break;
    }
    case 'garage': {
      b.s.boxB(11.4, 0.2, 8.4, 0, -0.05, 0, 0, C('#6d6a64'));
      b.s.boxB(11, 4, 0.3, 0, 0, -4, 0, C('#d8c9a8')); b.s.boxB(0.3, 4, 8, -5.5, 0, 0, 0, C('#d8c9a8')); b.s.boxB(0.3, 4, 8, 5.5, 0, 0, 0, C('#d8c9a8'));
      b.m.box(11.8, 0.1, 9, 0, 4.2, 0, 0, C('#8f969b'), -0.08);
      b.s.boxB(3, 0.9, 0.8, -3, 0, -3.4, 0, C('#6b4a32'));
      for (let i = 0; i < 3; i++) b.m.cyl(0.3, 0.9, 3.5 + i * 0.7, 0, -3.3, C(pick(['#2b5fa8', '#b93a2c'])), 10);
      break;
    }
    case 'waterTank': {
      for (const [x, z] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) b.s.boxB(0.25, 5, 0.25, x, 0, z, 0, C('#cfc7ba'));
      b.s.boxB(2.6, 0.3, 2.6, 0, 5, 0, 0, C('#cfc7ba')); b.s.cyl(1.2, 1.8, 0, 5.3, 0, C('#1c1c1e'), 14);
      break;
    }
    case 'solarPump': {
      for (let i = 0; i < 6; i++) { b.m.box(1.9, 0.06, 1.4, -2 + (i % 3) * 2, 1.4, Math.floor(i / 3) * 1.5 - 0.75, 0, C('#1f3a6a'), -0.45); b.m.boxB(0.08, 1.2, 0.08, -2 + (i % 3) * 2, 0, Math.floor(i / 3) * 1.5 - 0.5, 0, C('#8e959a')); }
      break;
    }
    case 'farmPond': {
      const bund = C('#7d5a3a');
      b.s.boxB(16, 0.9, 1.4, 0, -0.1, -9, 0, bund); b.s.boxB(16, 0.9, 1.4, 0, -0.1, 9, 0, bund);
      b.s.boxB(1.4, 0.9, 18, -8, -0.1, 0, 0, bund); b.s.boxB(1.4, 0.9, 18, 8, -0.1, 0, 0, bund);
      b.s.boxB(14.6, 0.05, 16.6, 0, -0.05, 0, 0, C('#2a3a34'));
      break;
    }
    case 'greenhouse': {
      const fr = C('#c9ccd0');
      for (let i = 0; i <= 6; i++) { const z = -12 + i * 4; b.m.boxB(0.12, 4.2, 0.12, -12.5, 0, z, 0, fr); b.m.boxB(0.12, 4.2, 0.12, 12.5, 0, z, 0, fr); b.m.box(25, 0.1, 0.1, 0, 4.25, z, 0, fr); }
      b.m.box(0.1, 0.1, 24, 0, 5.4, 0, 0, fr);
      break;
    }
  }
  const g = bundleGroup(bb);
  if (id === 'farmPond') { const wg = new THREE.PlaneGeometry(14.4, 16.4); wg.rotateX(-Math.PI / 2); const w = new THREE.Mesh(wg, World.smallWaterMat); w.position.y = 0.25; g.add(w); }
  if (id === 'greenhouse') {
    const film = new THREE.MeshStandardMaterial({ color: 0xeef4f2, roughness: 0.2, transparent: true, opacity: 0.32, side: THREE.DoubleSide, depthWrite: false });
    const roof = new THREE.Mesh(new THREE.CylinderGeometry(12.6, 12.6, 24.2, 20, 1, true, -Math.PI / 2 + 0.0, Math.PI), film);
    roof.rotation.z = Math.PI / 2; roof.rotation.y = Math.PI / 2; roof.scale.set(1, 1, 0.1); roof.position.y = 4.2; g.add(roof);
    const walls = new THREE.Mesh(new THREE.BoxGeometry(25, 4.2, 24.2), film); walls.position.y = 2.1; g.add(walls);
  }
  return g;
}
function buildScaffold(w, d, h) {
  const b = new GeoBuilder(); const bam = C('#c2a36a');
  for (let x = -w / 2; x <= w / 2 + 0.01; x += w / Math.max(1, Math.round(w / 3))) for (const z of [-d / 2, d / 2]) b.boxB(0.1, h, 0.1, x, 0, z, 0, bam);
  for (let z = -d / 2; z <= d / 2 + 0.01; z += d / Math.max(1, Math.round(d / 3))) for (const x of [-w / 2, w / 2]) b.boxB(0.1, h, 0.1, x, 0, z, 0, bam);
  for (let y = 1; y < h; y += 1.6) { b.box(w, 0.08, 0.08, 0, y, -d / 2, 0, bam); b.box(w, 0.08, 0.08, 0, y, d / 2, 0, bam); b.box(0.08, 0.08, d, -w / 2, y, 0, 0, bam); b.box(0.08, 0.08, d, w / 2, y, 0, 0, bam); }
  b.boxB(w * 0.6, h * 0.35, d * 0.6, 0, 0, 0, 0, C('#a65a3a'));
  for (let i = 0; i < 6; i++) b.boxB(0.5, 0.3, 0.3, w / 2 + 1.2, i * 0.3, -1 + (i % 2) * 0.4, 0, C('#9a4e35'));
  b.sphere(0.9, -w / 2 - 1.5, 0.4, 0, C('#8a8a86'), PRIM.hemi, 1, 0.8, 1);
  const m = new THREE.Mesh(b.build(), MAT.std); m.castShadow = true; m.receiveShadow = true;
  const g = new THREE.Group(); g.add(m); return g;
}

// ---------------------------------------------------------------------------
const Farm = {
  houseG: null, upG: {}, scaff: {}, signs: {}, pumpG: {},
  init() {
    this.rebuildHouse();
    for (const id in FARM_UPGRADES) if (G.S.up[id]) this.placeUpgrade(id);
    for (const c of G.S.construction) this.placeScaffold(c);
    // greenhouse field link
    const gh = Fields.byId.GH; if (gh) { gh.greenhouse = !!G.S.up.greenhouse; if (G.S.up.greenhouse && gh.owner === 'none') gh.owner = 'player'; }
    for (const f of Fields.list) { if (f.isPlayer && f.borewell && !f.pumpPos && f.id !== 'F1') this.buildPump(f); if (f.avail) this.placeSign(f); }
    this.registerInteractions();
    this.spawnDairy();
  },
  ownedAcres() { let a = 0; for (const f of Fields.list) if (f.owner === 'player' && f.id !== 'GH') a += f.acres; return a; },
  farmedAcres() { let a = 0; for (const f of Fields.list) if (f.isPlayer && f.id !== 'GH') a += f.acres; return a; },
  villages() { const s = new Set(); for (const f of Fields.list) if (f.owner === 'player') s.add(f.village); return s.size; },
  rebuildHouse() {
    if (this.houseG) { G.scene.remove(this.houseG); }
    if (this.houseCol) this.houseCol.forEach((c) => World.removeCollider(c));
    const lv = G.S.houseLevel;
    const g = buildPlayerHouseModel(lv);
    g.position.set(HOME.x, World.groundHeight(HOME.x, HOME.z), HOME.z); g.rotation.y = HOME_RY;
    G.scene.add(g); this.houseG = g;
    const [hw, hd] = houseFootprint(lv);
    this.houseCol = [World.addCollider(HOME.x, HOME.z, hw, hd, HOME_RY, 6)];
  },
  placeUpgrade(id) {
    const s = SLOTS[id]; if (!s) return;
    if (this.upG[id]) G.scene.remove(this.upG[id]);
    const g = buildUpgradeModel(id);
    g.position.set(s.x, World.groundHeight(s.x, s.z), s.z); g.rotation.y = s.ry;
    G.scene.add(g); this.upG[id] = g;
    if (id !== 'farmPond' && id !== 'greenhouse' && id !== 'solarPump') World.addCollider(s.x, s.z, s.w / 2, s.d / 2, s.ry, 5);
    if (id === 'farmPond') for (const [dx, dz, hw, hd] of [[0, -9, 8, 0.7], [0, 9, 8, 0.7], [-8, 0, 0.7, 9], [8, 0, 0.7, 9]]) World.addCollider(s.x + dx, s.z + dz, hw, hd, 0, 1);
  },
  placeScaffold(c) {
    const s = c.kind === 'up' ? SLOTS[c.id] : c.kind === 'house' ? { x: HOME.x, z: HOME.z, w: 14, d: 12 } : c.kind === 'bore' ? { x: c.x, z: c.z, w: 3, d: 3 } : Village.spot(c.id);
    if (!s) return;
    const g = buildScaffold(s.w || 6, s.d || 6, c.kind === 'house' ? 7 : 4.5);
    g.position.set(s.x, World.groundHeight(s.x, s.z), s.z); g.rotation.y = s.ry || 0;
    G.scene.add(g); this.scaff[c.key] = g;
  },
  startConstruction(kind, id, hours, label, extra = {}) {
    const S = G.S;
    if (S.construction.some((c) => c.kind === kind && c.id === id)) { UI.toast(L('Already under construction.', 'ఇప్పటికే నిర్మాణంలో ఉంది.'), 'warn'); return false; }
    const c = Object.assign({ kind, id, key: kind + ':' + id, doneAt: Time.totalMin() + hours * 60, label }, extra);
    S.construction.push(c);
    this.placeScaffold(c);
    UI.toast(L(`Construction started: ${label.en}. Ready in about ${hours} hours.`, `నిర్మాణం మొదలైంది: ${label.te}. సుమారు ${hours} గంటల్లో పూర్తి.`), 'good');
    Bus.emit('constructionStart', c);
    return true;
  },
  constructionTick() {
    const S = G.S; const now = Time.totalMin();
    const done = S.construction.filter((c) => c.doneAt <= now);
    if (!done.length) return;
    S.construction = S.construction.filter((c) => c.doneAt > now);
    for (const c of done) {
      if (this.scaff[c.key]) { G.scene.remove(this.scaff[c.key]); delete this.scaff[c.key]; }
      if (c.kind === 'up') { S.up[c.id] = true; this.placeUpgrade(c.id); if (c.id === 'greenhouse') { const gh = Fields.byId.GH; gh.owner = 'player'; gh.greenhouse = true; gh.npcPhase = 'player'; } if (c.id === 'dairyShed') { S.dairy.n = Math.max(2, S.dairy.n); this.spawnDairy(); } }
      else if (c.kind === 'house') { S.houseLevel = c.level; this.rebuildHouse(); }
      else if (c.kind === 'bore') { const f = Fields.byId[c.id]; if (f) { f.borewell = true; this.buildPump(f); } }
      else if (c.kind === 'village') Village.finish(c.id);
      UI.toast(L(`Construction finished: ${c.label.en}!`, `నిర్మాణం పూర్తయింది: ${c.label.te}!`), 'good');
      Audio2.sfx('fanfare');
      Bus.emit('built', c);
      Progress.check();
    }
  },
  buyUpgrade(id) {
    const U2 = FARM_UPGRADES[id]; if (G.S.up[id]) return;
    if (!Money.spend(U2.cost, 'upgrade')) return;
    this.startConstruction('up', id, U2.hours, { en: U2.en, te: U2.te });
  },
  upgradeHouse() {
    const lv = G.S.houseLevel; if (lv >= 4) return;
    const H = HOUSE_LEVELS[lv + 1];
    if (!Money.spend(H.cost, 'house')) return;
    this.startConstruction('house', 'home', H.hours, { en: H.en, te: H.te }, { level: lv + 1 });
  },
  buyField(f) {
    if (!f.avail || (f.avail !== 'sale' && f.avail !== 'both')) return;
    const p = f.landPrice;
    if (!Money.spend(p, 'land')) return;
    f.owner = 'player'; f.avail = null; f.npcPhase = 'player'; f.leaseUntil = 0;
    this.prepPlayerField(f);
    this.removeSign(f);
    UI.toast(L(`You bought ${f.label()} (${fmt1(f.acres)} acres)!`, `${f.label()} (${fmt1(f.acres)} ఎకరాలు) కొన్నారు!`), 'good'); Audio2.sfx('fanfare');
    Bus.emit('landBought', { field: f });
    Progress.check();
  },
  leaseField(f) {
    if (!f.avail) return;
    const p = f.leasePrice;
    if (!Money.spend(p, 'lease')) return;
    f.owner = 'lease'; f.avail = null; f.npcPhase = 'player'; f.leaseUntil = Time.day() + DAYS_PER_SEASON * 2;
    this.prepPlayerField(f);
    this.removeSign(f);
    UI.toast(L(`${f.label()} leased for two seasons.`, `${f.label()} రెండు సీజన్లకు కౌలుకు తీసుకున్నారు.`), 'good');
    Bus.emit('landLeased', { field: f });
    Progress.check();
  },
  prepPlayerField(f) {
    // the previous NPC crop is cleared; field starts as stubble
    if (f.crop && f.npcPhase !== 'player') { f.crop = null; f.growth = 0; f.sownTiles = 0; }
    f.crop = null; f.sownTiles = 0; f.growth = 0;
    for (let i = 0; i < f.n; i++) f.tiles[i] = 0;
    f.wasStubble = true; f.allDirty = true; f.cropDirty = true;
    f.water = 40; f.nut = 45; f.weeds = 8; f.pests = 0; f.health = 100; f.outbreak = false;
    if (f.hasNpcBore) f.borewell = true;
  },
  checkLeases() {
    for (const f of Fields.list) {
      if (f.owner !== 'lease' || Time.day() < f.leaseUntil) continue;
      if (f.crop && f.sownTiles > 0) { if (!f._leaseWarn) { f._leaseWarn = true; UI.toast(L(`Lease on ${f.label()} ends after this harvest.`, `ఈ కోత తర్వాత ${f.label()} కౌలు ముగుస్తుంది.`), 'warn'); } continue; }
      f.owner = 'npc'; f.npcPhase = 'fallow'; f.npcTimer = 4; f.avail = 'lease'; f._leaseWarn = false;
      this.placeSign(f);
      UI.toast(L(`Lease on ${f.label()} has ended. You can lease it again.`, `${f.label()} కౌలు ముగిసింది. మళ్లీ కౌలుకు తీసుకోవచ్చు.`), 'info');
    }
  },
  drillBorewell(f) {
    if (f.borewell) return;
    if (!Money.spend(BOREWELL_COST, 'borewell')) return;
    const pos = { x: f.x0 - 3.4, z: f.z0 + 4 };
    this.startConstruction('bore', f.id, 6, { en: `Borewell for ${f.label()}`, te: `${f.label()}కు బోరుబావి` }, pos);
  },
  buildPump(f) {
    const x = f.x0 - 3.4, z = f.z0 + 4;
    const bb = bundle();
    bb.s.boxB(2.0, 2.0, 2.0, 0, 0, 0, 0, C('#a0643f')); bb.m.box(2.5, 0.06, 2.6, 0, 2.1, 0, 0, C('#8f969b'), 0.1); bb.p.boxB(0.8, 1.6, 0.06, 0, 0, 1.02, 0, C('#2f5d8a'));
    bb.m.beam(0.7, 0.9, 1.0, 0.7, 0.9, 1.9, 0.09, C('#3a6ea5'), PRIM.cyl8); bb.s.boxB(1.8, 0.5, 1.2, 0.7, 0, 2.5, 0, C('#8e877c'));
    const g = bundleGroup(bb); g.position.set(x, World.groundHeight(x, z), z); g.rotation.y = Math.PI / 2; G.scene.add(g);
    World.addCollider(x, z, 1.1, 1.1, Math.PI / 2, 2.5);
    f.pumpPos = { spout: { x: x + 1.9, z: z + 0.7 }, y: World.groundHeight(x, z) + 0.9, x, z };
    this.pumpG[f.id] = g;
    this.addPumpInteraction(f);
  },
  placeSign(f) {
    if (this.signs[f.id]) return;
    const sp = f.heapSpot; const x = sp.x, z = sp.z; const y = World.groundHeight(x, z);
    const cv = document.createElement('canvas'); cv.width = 256; cv.height = 128; const ctx = cv.getContext('2d');
    ctx.fillStyle = '#fff3d6'; ctx.fillRect(0, 0, 256, 128); ctx.strokeStyle = '#b8432f'; ctx.lineWidth = 8; ctx.strokeRect(4, 4, 248, 120);
    ctx.fillStyle = '#b8432f'; ctx.textAlign = 'center'; ctx.font = '700 40px "Baloo Tammudu 2", sans-serif';
    ctx.fillText(f.avail === 'lease' ? 'కౌలుకు' : 'అమ్మకానికి', 128, 58);
    ctx.font = '700 26px "Hind Guntur", sans-serif'; ctx.fillStyle = '#3b2b22'; ctx.fillText((f.avail === 'lease' ? 'FOR LEASE' : 'FOR SALE') + ' · ' + fmt1(f.acres) + ' AC', 128, 100);
    const tex = new THREE.CanvasTexture(cv); tex.colorSpace = THREE.SRGBColorSpace;
    const g = new THREE.Group();
    const board = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 0.8), new THREE.MeshStandardMaterial({ map: tex, roughness: 0.7, side: THREE.DoubleSide }));
    board.position.y = 1.55; g.add(board);
    const post = new THREE.Mesh(new THREE.BoxGeometry(0.1, 1.6, 0.1), MAT.std.clone()); post.material = new THREE.MeshStandardMaterial({ color: 0x5a4432 }); post.position.y = 0.8; g.add(post);
    g.position.set(x, y, z); g.rotation.y = Math.atan2(f.x - x, f.z - z) + Math.PI;
    G.scene.add(g); this.signs[f.id] = g;
  },
  removeSign(f) { const g = this.signs[f.id]; if (g) { G.scene.remove(g); delete this.signs[f.id]; } },
  spawnDairy() {
    const S = G.S; if (!S.up.dairyShed) return;
    this.dairyAnimals = this.dairyAnimals || [];
    const s = SLOTS.dairyShed;
    while (this.dairyAnimals.length < S.dairy.n) {
      const i = this.dairyAnimals.length; const x = s.x - 4.5 + (i % 5) * 2.2, z = s.z + 1.2 * (i < 5 ? 1 : -1);
      const a = Fauna.add('buffalo', x, z, { mode: 'tether', r: 1 }); if (!a) break; this.dairyAnimals.push(a);
    }
  },
  dairyTick() {
    const S = G.S; if (!S.up.dairyShed || S.dairy.n <= 0) return;
    const need = S.dairy.n * 0.08;
    const fed = Inv.take('feed', need) || (S.flags.autoBuy && Money.spend(Math.round(ITEMS.feed.price * 1.05), 'feed', true) && (Inv.add('feed', 1), Inv.take('feed', need)));
    const litres = Math.round(S.dairy.n * 5 * (fed ? 1 : 0.4) * 10) / 10;
    const rev = Math.round(litres * 45);
    Money.add(rev, 'milk'); S.stats.milk = (S.stats.milk || 0) + litres;
    UI.toast(L(`Milk collection: ${litres} L sold for ${fmtINR(rev)}${fed ? '' : ' (buffaloes need feed!)'}`, `పాల సేకరణ: ${litres} లీ. ${fmtINR(rev)}కు అమ్మారు${fed ? '' : ' (గేదెలకు దాణా కావాలి!)'}`), fed ? 'good' : 'warn');
    Bus.emit('milk', { litres, rev });
  },
  buyBuffalo() {
    const S = G.S; if (!S.up.dairyShed) return; if (S.dairy.n >= 10) { UI.toast(L('The dairy shed is full.', 'పాడి షెడ్ నిండిపోయింది.'), 'warn'); return; }
    if (!Money.spend(65000, 'buffalo')) return;
    S.dairy.n++; this.spawnDairy(); UI.toast(L('A Murrah buffalo joins your dairy.', 'ముర్రా గేదె మీ పాడిలో చేరింది.'), 'good');
  },
  // ---- interactions ----
  addPumpInteraction(f) {
    const p = f.pumpPos; if (!p) return;
    const px = p.x !== undefined ? p.x : p.spout.x, pz = p.z !== undefined ? p.z : p.spout.z;
    Interact.add({ id: 'pump_' + f.id, x: px, z: pz, r: 3.6, prio: 2, can: () => f.isPlayer && f.borewell,
      label: () => (Player.vehicle && Player.vehicle.impl === 'tanker' ? L('Fill water tanker', 'ట్యాంకర్ నింపండి') : f.pump ? L(`Switch off pump (${f.label()})`, `మోటార్ ఆపండి (${f.label()})`) : L(`Switch on pump (${f.label()})`, `మోటార్ వేయండి (${f.label()})`)),
      act: () => {
        if (Player.vehicle && Player.vehicle.impl === 'tanker') { Services.fillTanker(Player.vehicle); return; }
        f.pump = !f.pump;
        if (f.pump && Weather.powerCut && !G.S.up.solarPump) UI.toast(L('Power cut! The pump will start when power returns.', 'కరెంటు లేదు! కరెంటు వచ్చాక మోటార్ నడుస్తుంది.'), 'warn');
        else UI.toast(f.pump ? L('Pump on — water is flowing into the field.', 'మోటార్ వేశారు — పొలానికి నీరు పారుతోంది.') : L('Pump off.', 'మోటార్ ఆపేశారు.'), 'info');
        Audio2.sfx('switch'); Bus.emit('pump', { field: f, on: f.pump });
      } });
  },
  registerInteractions() {
    // house front
    const hf = { x: HOME.x + 8, z: HOME.z };
    Interact.add({ id: 'home', x: hf.x, z: hf.z, r: 4, foot: true, prio: 3, label: () => L('Your house', 'మీ ఇల్లు'), act: () => UI.homeMenu() });
    Interact.add({ id: 'storeYard', x: YARD_PT.x, z: YARD_PT.z, r: 7, vehicle: true, prio: 3, can: () => Player.vehicle && Player.vehicle.cargoCap > 0, label: () => L('Farm storage: load / unload', 'నిల్వ: ఎక్కించు / దించు'), act: () => UI.storageMenu(Player.vehicle) });
    // field pumps & heaps & signs & canal gates
    for (const f of Fields.list) {
      if (f.id === 'F1') { f.pumpPos = { x: POI.f1Pump.spout.x, z: POI.f1Pump.spout.z, spout: POI.f1Pump.spout, y: POI.f1Pump.y }; this.addPumpInteraction(f); }
      else if (f.hasNpcBore && f.pumpPos) { const pp = f.pumpPos; f.pumpPos = { x: pp.spout.x, z: pp.spout.z, spout: pp.spout, y: pp.y }; this.addPumpInteraction(f); }
      const sp = f.heapSpot;
      Interact.add({ id: 'heap_' + f.id, x: sp.x, z: sp.z, r: 4.5, prio: 4, can: () => f.isPlayer && f.heap && f.heap.qty > 0.05,
        label: () => Player.vehicle ? L(`Load ${LN(PRODUCE[f.heap.crop])} heap (${fmt1(f.heap.qty)} q)`, `${LN(PRODUCE[f.heap.crop])} కుప్ప ఎక్కించండి (${fmt1(f.heap.qty)} క్వి.)`) : L(`Harvest heap: ${fmt1(f.heap.qty)} q ${LN(PRODUCE[f.heap.crop])}`, `పంట కుప్ప: ${fmt1(f.heap.qty)} క్వి. ${LN(PRODUCE[f.heap.crop])}`),
        act: () => Player.vehicle ? Services.loadHeap(Player.vehicle, f) : UI.heapMenu(f) });
      Interact.add({ id: 'sign_' + f.id, x: sp.x, z: sp.z, r: 3.5, foot: true, prio: 3, can: () => !!f.avail, label: () => L(`${f.label()} — ${fmt1(f.acres)} acres ${f.avail === 'lease' ? 'for lease' : 'for sale'}`, `${f.label()} — ${fmt1(f.acres)} ఎకరాలు ${f.avail === 'lease' ? 'కౌలుకు' : 'అమ్మకానికి'}`), act: () => UI.landMenu(f) });
      if (f.canal) {
        let best = null, bd = 1e9; for (const p of CANAL.samples) { const d = Math.hypot(p.x - f.x, p.z - f.z); if (d < bd) { bd = d; best = p; } }
        if (best) Interact.add({ id: 'gate_' + f.id, x: best.x, z: best.z, r: 4, foot: true, prio: 2, can: () => f.isPlayer, label: () => f.gate ? L(`Close canal gate (${f.label()})`, `కాలువ తూము మూయండి (${f.label()})`) : L(`Open canal gate to ${f.label()}`, `${f.label()}కు కాలువ తూము తెరవండి`), act: () => { if (!Weather.canalFlowing()) { UI.toast(L('The canal is dry right now. It flows in Vanakalam or when the lake is full.', 'కాలువ ఇప్పుడు ఎండిపోయింది. వానాకాలంలో లేదా చెరువు నిండినప్పుడు పారుతుంది.'), 'warn'); return; } f.gate = !f.gate; Audio2.sfx('switch'); UI.toast(f.gate ? L('Canal water is flowing into your field.', 'కాలువ నీరు మీ పొలంలోకి పారుతోంది.') : L('Gate closed.', 'తూము మూశారు.'), 'info'); Bus.emit('pump', { field: f, on: f.gate }); } });
      }
    }
    Interact.add({ id: 'ghatFill', x: POI.ghat.x, z: POI.ghat.z, r: 10, vehicle: true, can: () => Player.vehicle && Player.vehicle.impl === 'tanker', label: () => L('Fill water tanker from the lake', 'చెరువు నుంచి ట్యాంకర్ నింపండి'), act: () => Services.fillTanker(Player.vehicle) });
  },
};

// ---------------- village development ----------------
const Village = {
  spots: {},
  reserveSpots() {
    const want = { tank: [40, 64, 7, 7], shops: [104, 12, 22, 9], godown: [-122, -30, 16, 10], checkdam: [-176, -170, 10, 4] };
    for (const id in want) {
      const [px, pz, w, d] = want[id];
      let found = null;
      for (let r = 0; r < 80 && !found; r += 3) for (let a = 0; a < TAU && !found; a += 0.5) {
        const x = px + Math.cos(a) * r, z = pz + Math.sin(a) * r;
        if (World.occFreeOBB(x, z, w / 2 + 1.5, d / 2 + 1.5, 0)) found = { x, z };
      }
      if (found) { this.spots[id] = { x: found.x, z: found.z, w, d, ry: 0 }; World.occOBB(found.x, found.z, w / 2 + 1.5, d / 2 + 1.5, 0, OCC.BUILD); }
    }
  },
  spot(id) { return this.spots[id] || (id === 'school' ? { x: 58, z: -119, w: 28, d: 7 } : id === 'health' ? { x: -68, z: 22, w: 13, d: 8 } : id === 'roads' || id === 'lights' ? { x: 0, z: 0, w: 4, d: 4 } : id === 'irrigation' ? (this.spots.checkdam || { x: -170, z: -165, w: 10, d: 4 }) : id === 'market' ? { x: YARD.x, z: YARD.z + 30, w: 10, d: 6 } : this.spots[id]); },
  start(id) {
    const P = VILLAGE_PROJECTS[id]; const S = G.S;
    if (S.village[id]) return;
    if (!Money.spend(P.cost, 'village')) return;
    Farm.startConstruction('village', id, P.hours, { en: P.en, te: P.te });
    Rel.add('sarpanch', 10);
  },
  finish(id) {
    const S = G.S; const P = VILLAGE_PROJECTS[id];
    S.village[id] = true; S.village.pop += P.pop; S.village.biz += P.biz; S.village.landValue += P.land;
    for (const n of NPCs.list) if (n.named) Rel.add(n.id, 3);
    this.applyVisual(id);
    Market.news({ en: `Ramapuram completes ${P.en}. Villagers celebrate!`, te: `రామాపురంలో ${P.te} పూర్తి. గ్రామస్తుల సంబరాలు!` });
  },
  applyAll() { for (const id in VILLAGE_PROJECTS) if (G.S.village[id]) this.applyVisual(id); },
  applyVisual(id) {
    if (id === 'roads') World.setCCRoads(true);
    if (id === 'lights') this.buildStreetLights();
    if (id === 'tank') { const s = this.spots.tank; if (s) { const bb = bundle(); const R = 3.2, H = 15; for (let i = 0; i < 6; i++) { const a = i / 6 * TAU; bb.s.cyl(0.3, H, Math.cos(a) * R, 0, Math.sin(a) * R, C('#cfc7ba'), 8); } bb.s.cyl(5, 0.4, 0, H, 0, C('#cfc7ba'), 16); bb.s.cyl(4.9, 5, 0, H + 0.4, 0, C('#eef4f8'), 16); bb.s.cyl(5, 0.6, 0, H + 2.6, 0, C('#2f7d3a'), 16); bb.s.cone(5.2, 1.3, 0, H + 5.4, 0, C('#cfc7ba'), 16); const g = bundleGroup(bb); g.position.set(s.x, World.groundHeight(s.x, s.z), s.z); G.scene.add(g); World.addCollider(s.x, s.z, 3.5, 3.5, 0, 4); } }
    if (id === 'shops') { const s = this.spots.shops; if (s) { const g = new THREE.Group(); const bb = bundle(); for (let i = 0; i < 4; i++) { const x = -8.25 + i * 5.5; bb.s.boxB(5.3, 3.4, 8, x, 0, 0, 0, C(['#f0e09c', '#b7d4e6', '#f4d6d0', '#cde2ae'][i])); bb.s.boxB(4.6, 2.5, 0.1, x, 0, 4.02, 0, C('#2a2622')); bb.g.box(4.2, 1.4, 0.05, x, 1.3, 4.08, 0, C('#ffe2a8')); bb.m.box(5.4, 0.07, 1.6, x, 3.0, 4.8, 0, C(['#c0392b', '#2d6ca6', '#2f7d3a', '#e2b81f'][i]), 0.2); } bb.s.boxB(22.4, 0.3, 8.4, 0, 3.4, 0, 0, C(SLAB)); g.add(bundleGroup(bb)); g.position.set(s.x, World.groundHeight(s.x, s.z), s.z); g.rotation.y = 0; G.scene.add(g); World.addCollider(s.x, s.z, 11, 4, 0, 4); } }
    if (id === 'school') { const bb = bundle(); bb.s.boxB(28, 3.2, 7, 0, 0, 0, 0, C('#f2dfab')); for (let i = 0; i < 5; i++) addWindow(bb, -11 + i * 5.5, 0.9, 3.5, 0, C('#2f6d4f'), 1.4, 1.1, 0.2); flatRoof(bb, 28, 7, 3.2, C('#f2dfab'), C('#2f6d4f'), false); const g = bundleGroup(bb); g.position.set(58, World.groundHeight(58, -118) + 4.0, -119); G.scene.add(g); }
    if (id === 'health') { const bb = bundle(); bb.s.boxB(13, 3.2, 8, 0, 0, 0, 0, C('#f5f3ee')); bb.s.boxB(13.05, 0.4, 8.05, 0, 0, 0, 0, C('#2e8b57')); for (let i = 0; i < 4; i++) addWindow(bb, -4.5 + i * 3, 0.9, -4, Math.PI, C('#2e8b57'), 1.2, 1.1, 0.7); flatRoof(bb, 13, 8, 3.2, C('#f5f3ee'), C('#2e8b57'), false); const g = bundleGroup(bb); g.position.set(-68, World.groundHeight(-68, 22) + 3.8, 22); G.scene.add(g); const amb = buildVehicleModel('pickup', { color: '#f4f4f4' }); amb.position.set(-60, World.groundHeight(-60, 12), 12); amb.rotation.y = Math.PI / 2; G.scene.add(amb); World.addCollider(-60, 12, 1, 2.4, Math.PI / 2, 2); }
    if (id === 'irrigation') { const s = this.spot('irrigation'); const bb = bundle(); bb.s.boxB(10, 1.6, 1.2, 0, -0.4, 0, 0, C('#a39b8f')); for (let i = 0; i < 4; i++) bb.m.boxB(0.6, 1.2, 0.3, -3 + i * 2, 0.2, 0.7, 0, C('#46525a')); const g = bundleGroup(bb); g.position.set(s.x, World.groundHeight(s.x, s.z), s.z); g.rotation.y = 0.6; G.scene.add(g); }
    if (id === 'godown') { const s = this.spots.godown; if (s) { const g = buildUpgradeModel('warehouse'); g.position.set(s.x, World.groundHeight(s.x, s.z), s.z); G.scene.add(g); World.addCollider(s.x, s.z, 8, 4.5, 0, 5); } }
    if (id === 'market') { const bb = bundle(); for (let i = 0; i < 6; i++) { const x = -15 + i * 6; for (const [px, pz] of [[-1.6, -1.2], [1.6, -1.2], [-1.6, 1.2], [1.6, 1.2]]) bb.s.boxB(0.08, 2.3, 0.08, x + px, 0, pz, 0, C('#6b5a48')); bb.ds.box(3.6, 0.04, 2.8, x, 2.35, 0, 0, C(['#2d6ca6', '#e07b22', '#c0392b', '#2f7d3a', '#e2b81f', '#6b3fa0'][i]), 0.08); bb.s.boxB(2.6, 0.7, 1.4, x, 0, 0.3, 0, C('#8a6a45')); } const g = bundleGroup(bb); g.position.set(YARD.x, World.groundHeight(YARD.x, YARD.z) + 0.05, YARD.z + 30); G.scene.add(g); }
  },
  buildStreetLights() {
    const bb = bundle(); const pools = new GeoBuilder(true);
    const pts = [];
    for (const r of ROADS) {
      if (!['main', 'ns', 'lane1', 'lane2', 'lane3', 'lane4', 'west', 'south'].includes(r.id)) continue;
      let acc = 0;
      for (let i = 1; i < r.samples.length; i++) {
        acc += 3; if (acc < 27) continue; acc = 0;
        const p = r.samples[i], q = r.samples[i - 1]; if (Math.hypot(p.x, p.z) > 165) continue;
        const tx = p.x - q.x, tz = p.z - q.z, tl = Math.hypot(tx, tz) || 1; const nx = -tz / tl, nz = tx / tl;
        const x = p.x + nx * (r.w / 2 + 1.2), z = p.z + nz * (r.w / 2 + 1.2);
        const o = World.occGet(x, z); if (o === OCC.BUILD || o === OCC.ROAD) continue;
        pts.push({ x, z, nx, nz });
      }
    }
    for (const p of pts) {
      const y = World.groundHeight(p.x, p.z);
      bb.m.boxB(0.12, 6, 0.12, p.x, y, p.z, 0, C('#8e959a'));
      bb.m.beam(p.x, y + 5.9, p.z, p.x - p.nx * 1.4, y + 6.1, p.z - p.nz * 1.4, 0.05, C('#8e959a'));
      bb.g.box(0.5, 0.12, 0.25, p.x - p.nx * 1.4, y + 6.02, p.z - p.nz * 1.4, Math.atan2(p.nx, p.nz), C('#fff1d0'));
      pools.quad(11, 11, p.x - p.nx * 1.8, World.groundHeight(p.x - p.nx * 1.8, p.z - p.nz * 1.8) + 0.12, p.z - p.nz * 1.8, 0, C('#ffffff'), -Math.PI / 2, Atlas.decalUV(3));
    }
    G.scene.add(bundleGroup(bb));
    const pm = new THREE.MeshBasicMaterial({ map: Atlas.dtex, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, polygonOffset: true, polygonOffsetFactor: -4, polygonOffsetUnits: -8, opacity: 0 });
    const m = new THREE.Mesh(pools.build(), pm); m.renderOrder = 3; G.scene.add(m);
    this.lightPools = m;
  },
  update() { if (this.lightPools) this.lightPools.material.opacity = U.uGlow.value * 0.9; },
  devScore() { let n = 0; for (const id in VILLAGE_PROJECTS) if (G.S.village[id]) n++; return n; },
};

// ---------------- workers ----------------
const Workers = {
  list: [],
  maxPermanent() { return 2 + (G.S.up.quarters ? 6 : 0); },
  init() { for (const w of G.S.workers) this.spawnNPC(w); },
  spawnNPC(w) {
    const app = Humans.appearance({ gender: w.g || 'm', lower: 'lungi' });
    const n = NPCs.make({ id: 'worker_' + w.id, name: w.name, role: { en: LN(WORKER_TYPES[w.type]), te: WORKER_TYPES[w.type].te }, type: 'worker', app: { gender: w.g || 'm' } }, { door: { x: YARD_PT.x + 3, z: YARD_PT.z + 6 } });
    if (!n) return;
    n.worker = true; n.w = w; n.task = null; n.ti = 0; n.tt = 0; n.h.visible = true;
    this.list.push(n);
  },
  hire(type) {
    const S = G.S; const T = WORKER_TYPES[type];
    if (type !== 'daily' && S.workers.filter((w) => w.type !== 'daily').length >= this.maxPermanent()) { UI.toast(L('No room for more permanent workers. Build worker quarters.', 'ఇంకా శాశ్వత కూలీలకు చోటు లేదు. కూలీల నివాసాలు కట్టండి.'), 'warn'); return; }
    if (!Money.spend(T.wage, 'wage')) return;
    const g = frand() < 0.5 ? 'm' : 'f'; const names = g === 'm' ? [NAMES_M, NAMES_M_TE] : [NAMES_F, NAMES_F_TE]; const k = Math.floor(frand() * names[0].length);
    const w = { id: Date.now() % 1e7 + Math.floor(frand() * 1000), type, name: { en: names[0][k], te: names[1][k] }, g, field: 'auto', since: Time.day(), paidDay: Time.day() };
    S.workers.push(w); this.spawnNPC(w);
    UI.toast(L(`${w.name.en} joins as ${T.en}.`, `${w.name.te} ${T.te}గా చేరారు.`), 'good');
    Bus.emit('hire', { w }); Progress.check();
  },
  fire(w) {
    const S = G.S; S.workers = S.workers.filter((x) => x !== w);
    const n = this.list.find((x) => x.w === w); if (n) { n.h.visible = false; n.worker = false; n.type = 'gone'; n.home = { x: -999, z: -999 }; this.list = this.list.filter((x) => x !== n); }
  },
  dayTick() {
    const S = G.S;
    for (const w of [...S.workers]) {
      if (w.type === 'daily') { this.fire(w); continue; }
      if (Time.day() - w.paidDay >= 7) { const T = WORKER_TYPES[w.type]; if (Money.spend(T.wage, 'wage', true)) { w.paidDay = Time.day(); } else { UI.toast(L(`${w.name.en} left — wages unpaid.`, `జీతం అందక ${w.name.te} వెళ్ళిపోయారు.`), 'bad'); this.fire(w); } }
    }
  },
  fieldFor(n) {
    const w = n.w;
    if (w.field && w.field !== 'auto') { const f = Fields.byId[w.field]; if (f && f.isPlayer) return f; }
    let best = null, bs = -1;
    for (const f of Fields.playerFields()) { const t = this.taskFor(f, n); if (!t) continue; const score = t.prio * 100 - Math.hypot(f.x - n.h.x, f.z - n.h.z) * 0.1 - this.list.filter((o) => o !== n && o.field === f).length * 30; if (score > bs) { bs = score; best = f; } }
    return best;
  },
  ensure(item, amt = 1) {
    if (Inv.count(item) > 0.0001) return true;
    if (!G.S.flags.autoBuy) return false;
    const price = Math.round(Market.itemPrice(item) * 1.05);
    if (!Money.spend(price, 'autobuy', true)) return false;
    Inv.add(item, amt); return true;
  },
  taskFor(f, n) {
    const cd = f.crop ? CROPS[f.crop] : null;
    if (f.crop && f.growth >= 0.97 && f.countMin(3) > 0) return { op: 'harvest', prio: 9 };
    if (cd && f.pests > 18 && this.ensure('pesticide')) return { op: 'spray', item: 'pesticide', prio: 8 };
    if (cd && cd.wLo && f.water < cd.wLo + 4 && ((f.borewell && !f.pump) || (f.canal && !f.gate && Weather.canalFlowing()))) return { op: 'irrigate', prio: 7 };
    if (f.weeds > 30 && f.countMin(1) > 0) return { op: 'weed', prio: 6 };
    if (cd && f.nut < 30 && f.growth < 0.85 && (this.ensure('urea') || Inv.count('dap') > 0)) return { op: 'fertilize', item: Inv.count('urea') > 0 ? 'urea' : 'dap', prio: 5 };
    const plan = f.plannedCrop;
    if (plan && (!f.crop || f.crop === plan) && f.countMin(1) - f.countMin(3) > 0 && this.ensure('seed_' + plan)) return { op: 'sow', crop: plan, prio: 4 };
    if ((plan || f.wasStubble) && !f.crop && f.count(0) + f.count(1) > 0) return { op: 'prep', prio: 3 };
    return null;
  },
  tileNeeds(f, t, i) {
    const s = f.tiles[i];
    switch (t.op) { case 'harvest': return s === 3; case 'spray': return s === 3 && Time.totalHours() - f.stamp.spray[i] >= 8; case 'weed': return s >= 1 && Time.totalHours() - f.stamp.weed[i] >= 8; case 'fertilize': return s >= 1 && Time.totalHours() - f.stamp.fert[i] >= 10; case 'sow': return s === 1 || s === 2; case 'prep': return s < 2; }
    return false;
  },
  doTile(f, t, i) {
    if (t.op === 'prep') return f.apply(f.tiles[i] === 0 ? 'plough' : 'cultivate', i);
    if (t.op === 'sow') { if (!this.ensure('seed_' + t.crop)) return false; return f.apply('sow', i, { crop: t.crop }); }
    if (t.op === 'spray') { if (!this.ensure(t.item)) return false; return f.apply('spray', i, { item: t.item }); }
    if (t.op === 'fertilize') { if (!this.ensure(t.item)) return false; return f.apply('fertilize', i, { item: t.item }); }
    return f.apply(t.op, i, {});
  },
  update(dt) {
    const hr = Time.hour(); const W = Weather.cur;
    const workHours = hr > 6.8 && hr < 18.2 && W.rain < 0.45;
    for (const n of this.list) {
      const h = n.h;
      n.tt -= dt;
      if (n.w.type === 'driver' && this.driverTick(n, dt, workHours)) continue;
      if (!workHours) { this.walkTo(n, YARD_PT.x + 2, YARD_PT.z + 8, dt, hr > 20 || hr < 6); continue; }
      if (n.tt <= 0 || !n.field) { n.tt = 3; n.field = this.fieldFor(n); n.task = n.field ? this.taskFor(n.field, n) : null; }
      const f = n.field, t = n.task;
      if (!f || !t) { this.walkTo(n, YARD_PT.x + 2, YARD_PT.z + 8, dt, false); continue; }
      if (t.op === 'irrigate') {
        const p = f.pumpPos && f.borewell ? (f.pumpPos.spout || f.pumpPos) : { x: f.x0 - 2, z: f.z0 - 2 };
        if (this.walkTo(n, p.x, p.z, dt)) { if (f.borewell) f.pump = true; if (f.canal) f.gate = true; n.tt = 0; }
        continue;
      }
      // find next tile needing work near the worker
      if (n.ti === undefined || n.ti < 0 || !this.tileNeeds(f, t, n.ti)) {
        let best = -1, bd = 1e9;
        for (let i = 0; i < f.n; i++) { if (!this.tileNeeds(f, t, i)) continue; const c = f.tileCenter(i); const d = Math.hypot(c.x - h.x, c.z - h.z) + (i % f.tx) * 0.01; if (d < bd) { bd = d; best = i; } }
        n.ti = best; if (best < 0) { n.tt = 0; n.task = null; continue; }
      }
      const c = f.tileCenter(n.ti);
      if (this.walkTo(n, c.x, c.z, dt)) {
        h.pose = t.op === 'harvest' || t.op === 'weed' || t.op === 'prep' ? 'work' : 'walk';
        n.workT = (n.workT || 0) - dt * Time.scale;
        if (n.workT <= 0) { n.workT = 0.55; if (this.doTile(f, t, n.ti)) Bus.emit('work', { op: t.op === 'prep' ? 'plough' : t.op, field: f, n: 1, by: 'worker', crop: f.crop }); else n.ti = -1; n.ti = -1; }
      }
    }
  },
  // tractor drivers take a free tractor and the right implement to whichever field needs machine work
  driverTick(n, dt, workHours) {
    const S = G.S;
    if (n.job) {
      if (!n.job.done) { n.h.visible = false; n.h.x = n.job.v.x; n.h.z = n.job.v.z; return true; }
      const v = n.job.v; n.job = null; n.h.visible = true; n.h.x = v.x - 2; n.h.z = v.z; n.h.y = World.groundHeight(n.h.x, n.h.z); n.dT = 3;
      return false;
    }
    if (!workHours) return false;
    n.dT = (n.dT || 0) - dt; if (n.dT > 0) return false; n.dT = 4;
    const tractor = Vehicles.player.find((v) => (v.type === 'tractor35' || v.type === 'tractor50') && !v.job && v !== Player.vehicle && v.fuel > 1 && v.cargoQty < 0.05);
    if (!tractor) return false;
    const has = (i) => S.implements.includes(i);
    for (const f of Fields.playerFields()) {
      const t = this.taskFor(f, n); if (!t) continue;
      const impl = t.op === 'prep' ? ['rotavator', 'cultivator', 'plough'].find(has) : t.op === 'sow' && has('seeddrill') ? 'seeddrill' : t.op === 'spray' && has('sprayer') ? 'sprayer' : t.op === 'fertilize' && has('spreader') ? 'spreader' : null;
      if (!impl) continue;
      if (t.op === 'sow' && !this.ensure('seed_' + t.crop)) continue;
      if ((t.op === 'spray' || t.op === 'fertilize') && !this.ensure(t.item)) continue;
      if (this.list.some((o) => o !== n && o.job && o.job.field === f)) continue;
      tractor.attach(impl);
      if (t.crop) tractor.sowCrop = t.crop;
      if (t.op === 'spray') tractor.chem = t.item; if (t.op === 'fertilize') tractor.fert = t.item;
      n.job = new FieldJob(tractor, f, IMPLEMENTS[impl].op, {});
      n.h.visible = false;
      UI.toastOnce('driver' + f.id, L(`${n.w.name.en} is taking the tractor to ${f.label()} with the ${LN(IMPLEMENTS[impl]).toLowerCase()}.`, `${n.w.name.te} ${IMPLEMENTS[impl].te}తో ట్రాక్టర్‌ను ${f.label()}కు తీసుకెళ్తున్నారు.`), 'info');
      return true;
    }
    return false;
  },
  walkTo(n, x, z, dt, hide = false) {
    const h = n.h; const dx = x - h.x, dz = z - h.z, d = Math.hypot(dx, dz);
    if (d < 0.6) { h.speed = 0; h.pose = 'idle'; if (hide) h.visible = false; return true; }
    h.visible = true;
    const sp = 1.3 * Math.min(4, Time.scale) * (d > 60 ? 3 : 1);
    const st = Math.min(d, sp * dt); h.x += dx / d * st; h.z += dz / d * st; h.y = World.groundHeight(h.x, h.z);
    h.yaw = dampAngle(h.yaw, Math.atan2(dx, dz), 8, dt); h.speed = sp; h.pose = 'walk';
    return false;
  },
  // abstract progress during skipped time
  skip(hrs) {
    for (const n of this.list) {
      const f = this.fieldFor(n); if (!f) continue;
      let budget = Math.round(14 * hrs);
      for (let guard = 0; guard < 6 && budget > 0; guard++) {
        const t = this.taskFor(f, n); if (!t) break;
        if (t.op === 'irrigate') { if (f.borewell) f.pump = true; if (f.canal) f.gate = true; continue; }
        for (let i = 0; i < f.n && budget > 0; i++) if (this.tileNeeds(f, t, i) && this.doTile(f, t, i)) budget--;
      }
    }
  },
};

// ---------------- services ----------------
const Services = {
  rentTractor(impl) {
    const hours = 4; const cost = TRACTOR_RENT_PER_HOUR * hours;
    if (Vehicles.player.some((v) => v.rentUntil > 0)) { UI.toast(L('You already have a rented tractor.', 'మీ దగ్గర ఇప్పటికే అద్దె ట్రాక్టర్ ఉంది.'), 'warn'); return; }
    if (!Money.spend(cost, 'rent')) return;
    const sp = Vehicles.freeSpot(POI.workshop.spawn.x, POI.workshop.spawn.z, 2.6);
    const v = Vehicles.spawnOwned({ type: 'tractor35', x: sp.x, z: sp.z, yaw: Math.PI, impl, rentUntil: Time.totalMin() + hours * 60, fuel: 50 });
    v.owned = false;
    UI.toast(L(`Tractor with ${LN(IMPLEMENTS[impl])} rented for ${hours} hours. It's parked outside the workshop.`, `${LN(IMPLEMENTS[impl])}తో ట్రాక్టర్ ${hours} గంటలకు అద్దెకు తీసుకున్నారు. వర్క్‌షాప్ బయట ఉంది.`), 'good');
    Bus.emit('rent', { v });
  },
  rentalTick() {
    const now = Time.totalMin();
    for (const v of [...Vehicles.player]) {
      if (!v.rentUntil) continue;
      if (now > v.rentUntil - 30 && !v._rentWarn) { v._rentWarn = true; UI.toast(L('Your tractor rental ends in 30 minutes.', 'మీ ట్రాక్టర్ అద్దె 30 నిమిషాల్లో ముగుస్తుంది.'), 'warn'); }
      if (now >= v.rentUntil && Player.vehicle !== v) { if (v.cargoQty > 0.05) { for (const c of v.cargo) Storage.add(c.crop, c.qty, c.q); } Vehicles.removeOwned(v); UI.toast(L('Bhaskar collected the rented tractor.', 'అద్దె ట్రాక్టర్‌ను భాస్కర్ తీసుకెళ్ళాడు.'), 'info'); }
    }
  },
  harvestService(f) {
    if (!f.crop || f.growth < 0.97) { UI.toast(L('That crop is not ready yet.', 'ఆ పంట ఇంకా సిద్ధం కాలేదు.'), 'warn'); return; }
    const cost = Math.round(HARVEST_SERVICE_PER_ACRE * f.acres);
    if (!Money.spend(cost, 'service')) return;
    const sp = f.heapSpot;
    const v = new Vehicle('harvester', { x: sp.x, z: sp.z, yaw: 0 }); Vehicles.all.push(v);
    v.svc = true;
    new FieldJob(v, f, 'harvest', { free: true, direct: true, onDone: () => { setTimeout(() => { v.destroy(); Vehicles.all.splice(Vehicles.all.indexOf(v), 1); this.svcList = (this.svcList || []).filter((x) => x !== v); }, 1500); UI.toast(L(`Harvest of ${f.label()} complete. The produce is in the heap at the field edge.`, `${f.label()} కోత పూర్తి. పంట పొలం అంచున కుప్పగా ఉంది.`), 'good'); } });
    (this.svcList || (this.svcList = [])).push(v);
    UI.toast(L(`A combine harvester is coming to ${f.label()}.`, `${f.label()}కు కంబైన్ హార్వెస్టర్ వస్తోంది.`), 'good');
  },
  updateSvc(dt) { for (const v of this.svcList || []) if (v.job) v.job.update(dt); },
  repair(v) {
    const cost = Math.round((100 - v.cond) * (v.type === 'harvester' ? 400 : v.type.startsWith('tractor') ? 150 : 60) * (G.S.up.garage ? 0.7 : 1));
    if (cost <= 0) { UI.toast(L('It is in perfect condition.', 'పూర్తిగా బాగుంది.'), 'info'); return; }
    if (!Money.spend(cost, 'repair')) return;
    v.cond = 100; UI.toast(L(`${v.label()} repaired for ${fmtINR(cost)}.`, `${v.label()} మరమ్మతు ${fmtINR(cost)}కు పూర్తి.`), 'good'); Audio2.sfx('wrench');
  },
  refuel(v) {
    if (!v || v.def.fuelCap <= 0) return;
    const litres = Math.max(0, v.def.fuelCap - v.fuel); if (litres < 0.5) { UI.toast(L('The tank is already full.', 'ట్యాంక్ ఇప్పటికే నిండుగా ఉంది.'), 'info'); return; }
    const cost = Math.round(litres * Market.dieselPrice());
    if (!Money.spend(cost, 'fuel')) return;
    v.fuel = v.def.fuelCap; UI.toast(L(`Filled ${fmt1(litres)} L of diesel for ${fmtINR(cost)}.`, `${fmt1(litres)} లీ. డీజిల్ ${fmtINR(cost)}కు నింపారు.`), 'good'); Audio2.sfx('pump');
    Bus.emit('refuel', {});
  },
  useCan(v) {
    if (!v || v.def.fuelCap <= 0) return;
    if (!Inv.take('diesel', 1)) { UI.toast(L('You have no diesel cans.', 'మీ దగ్గర డీజిల్ క్యాన్ లేదు.'), 'warn'); return; }
    v.fuel = Math.min(v.def.fuelCap, v.fuel + 20); UI.toast(L('Poured 20 L of diesel.', '20 లీ. డీజిల్ పోశారు.'), 'good');
  },
  fillTanker(v) { v.tank = 100; UI.toast(L('Water tanker filled.', 'నీటి ట్యాంకర్ నిండింది.'), 'good'); Audio2.sfx('pump'); },
  loadHeap(v, f) {
    const cap = v.cargoCap - v.cargoQty;
    if (v.cargoCap <= 0) { UI.toast(L('This vehicle cannot carry produce. Attach a trailer or use the bullock cart.', 'ఈ వాహనం పంటను మోయలేదు. ట్రాలీ అటాచ్ చేయండి లేదా ఎడ్లబండి వాడండి.'), 'warn'); return; }
    if (cap < 0.05) { UI.toast(L('The vehicle is full.', 'వాహనం నిండిపోయింది.'), 'warn'); return; }
    if (v.cargo.length && v.cargo[0].crop !== f.heap.crop) { UI.toast(L('Unload the other crop first.', 'ముందు వేరే పంటను దించండి.'), 'warn'); return; }
    const amt = Math.min(cap, f.heap.qty);
    if (v.cargo.length) { const c = v.cargo[0]; c.q = (c.q * c.qty + f.heap.q * amt) / (c.qty + amt); c.qty += amt; } else v.cargo.push({ crop: f.heap.crop, qty: amt, q: f.heap.q });
    f.heap.qty -= amt; if (f.heap.qty < 0.05) f.heap = null; f.heapDirty = true;
    UI.toast(L(`Loaded ${fmt1(amt)} quintals.`, `${fmt1(amt)} క్వింటాళ్లు ఎక్కించారు.`), 'good'); Audio2.sfx('load');
    Bus.emit('loaded', { v, qty: amt });
  },
  // hire a lorry: the produce is sold at the market yard (or MSP centre) without driving there
  lorryFee(qty) { return Math.round(150 + qty * 30); },
  lorry(where, crop, qty, q) {
    const S = G.S; const fee = this.lorryFee(qty);
    if (where === 'msp') {
      const cd = CROPS[crop]; const amt = Math.round(cd.msp * qty);
      S.pending.push({ amt: Math.max(0, amt - fee), due: Time.totalMin() + 2 * 1440, desc: `${fmt1(qty)} q ${cd.en} (MSP)` });
      S.market.sup[crop] = (S.market.sup[crop] || 1) + qty / (DEPTH[crop] * 2); S.stats.sold[crop] = (S.stats.sold[crop] || 0) + qty;
      Bus.emit('sold', { crop, qty, rev: amt, where: 'msp', price: cd.msp });
      UI.toast(L(`The lorry took ${fmt1(qty)} q to the MSP centre. ${fmtINR(amt - fee)} arrives in 2 days (after ${fmtINR(fee)} transport).`, `లారీ ${fmt1(qty)} క్వి. మద్దతు ధర కేంద్రానికి తీసుకెళ్లింది. ${fmtINR(amt - fee)} 2 రోజుల్లో వస్తుంది (రవాణా ${fmtINR(fee)} తర్వాత).`), 'good');
      Audio2.sfx('cash');
      return amt - fee;
    }
    const rev = Market.sell(crop, qty, q, 'yard');
    Money.spend(Math.min(fee, G.S.money), 'transport', true);
    UI.toast(L(`The lorry sold ${fmt1(qty)} q at the market yard for ${fmtINR(rev)} (transport ${fmtINR(fee)}).`, `లారీ ${fmt1(qty)} క్వి. మార్కెట్ యార్డులో ${fmtINR(rev)}కు అమ్మింది (రవాణా ${fmtINR(fee)}).`), 'good');
    return rev - fee;
  },
  lorryHeap(f, where) { const h = f.heap; if (!h) return; this.lorry(where, h.crop, h.qty, h.q); f.heap = null; f.heapDirty = true; },
  lorryStored(crop, where) { const got = Storage.take(crop, 1e9); if (got.qty > 0.05) this.lorry(where, crop, got.qty, got.q); },
  sellHeapToTrader(f) {
    const h = f.heap; if (!h) return;
    const rev = Market.sell(h.crop, h.qty, h.q, 'trader');
    UI.toast(L(`Village trader paid ${fmtINR(rev)} for ${fmt1(h.qty)} q.`, `గ్రామ వ్యాపారి ${fmt1(h.qty)} క్వి.కు ${fmtINR(rev)} చెల్లించాడు.`), 'good');
    f.heap = null; f.heapDirty = true;
  },
  busTravel(to) {
    if (!Money.spend(20, 'bus')) return;
    const dest = to === 'town' ? POI.townBus.stop : POI.busStop.stop;
    UI.fade(() => { if (Player.vehicle) Player.exitVehicle(true); Player.x = dest.x; Player.z = dest.z + 1.5; Player.y = World.groundHeight(Player.x, Player.z); Sim.advance(30); Cam.focus.set(Player.x, Player.y + 1.4, Player.z); });
    Bus.emit('bus', { to });
  },
  // quick trips from the map: an auto-rickshaw on foot, or your own vehicle driven there for you
  travelFare(d) { return Math.round(10 + d / 50); },
  travelMins(d) { const v = Player.vehicle; const sp = v ? Math.max(3, v.def.maxSpeed * 0.75) : 8; return 6 + d / sp / 3; },
  fastTravel(x, z, name) {
    const P = Player.pos(); const d = Math.hypot(x - P.x, z - P.z);
    if (d < 25) { UI.toast(L('You are already here.', 'మీరు ఇక్కడే ఉన్నారు.'), 'info'); return; }
    const v = Player.vehicle;
    if (v && v.def.fuelCap > 0 && v.fuel <= 0.05) { UI.toast(L('No diesel left. Refuel first, or get off and take an auto.', 'డీజిల్ లేదు. ముందు నింపించండి, లేదా దిగి ఆటోలో వెళ్ళండి.'), 'warn'); return; }
    if (!v && !Money.spend(this.travelFare(d), 'travel')) return;
    const mins = this.travelMins(d);
    UI.fade(() => {
      if (v) {
        const sp = Vehicles.freeSpot(x, z, v.type === 'harvester' ? 3.4 : 2.6);
        v.yaw = Math.atan2(sp.x - P.x, sp.z - P.z); v.tYaw = v.yaw; v.x = sp.x; v.z = sp.z; v.speed = 0; v.lowered = false;
        if (v.def.fuelCap > 0) v.fuel = Math.max(0, v.fuel - v.def.fuelUse * mins / 60 * 0.6);
        v.place(); Player.x = v.x; Player.z = v.z; Player.y = v.y;
      } else {
        const p = { x: x + (frand() - 0.5) * 2, z: z + 2 };
        World.collideCircle(p, 0.6); World.collideCircle(p, 0.6);
        Player.x = clamp(p.x, -PLAY_HALF, PLAY_HALF); Player.z = clamp(p.z, -PLAY_HALF, PLAY_HALF); Player.y = World.groundHeight(Player.x, Player.z); Player.speed = 0;
      }
      Sim.advance(mins);
      const q = Player.pos(); Cam.focus.set(q.x, q.y + 1.4, q.z); Cam.yaw = (v ? v.yaw : Player.yaw) + Math.PI;
      if (G.S.waypoint && Math.hypot(G.S.waypoint.x - x, G.S.waypoint.z - z) < 30) G.S.waypoint = null;
      UI.toast(L(`You reached ${name}.`, `${name} చేరుకున్నారు.`), 'good');
      UI.dirty = true;
    }, v ? L('Driving…', 'నడుపుతున్నారు…') : L('Riding an auto…', 'ఆటోలో వెళ్తున్నారు…'));
    Bus.emit('travel', { x, z });
  },
  // skip ahead an hour at a time until the crop needs something (water, food, weeding, spraying or harvest)
  waitForCrop(f) {
    if (!f || !f.crop) return;
    const needs = () => { const cd = CROPS[f.crop]; return !f.crop || f.growth >= 0.97 || f.outbreak || f.pests > 10 || f.weeds > 16 || (f.nut < 40 && f.growth < 0.9) || (cd && cd.wLo && f.water < cd.wLo && !f.pump && !f.gate); };
    UI.fade(() => {
      let hrs = 0;
      while (hrs < 24 && !needs()) {
        const cd0 = CROPS[f.crop];   // a good farmer keeps the water running while resting
        if (cd0 && cd0.wLo && f.water < cd0.wLo + 6) { if (f.borewell && !f.pump) f.pump = true; else if (f.canal && !f.gate && Weather.canalFlowing()) f.gate = true; }
        Sim.advance(60); hrs++;
      }
      const P = G.S.player; P.energy = Math.min(100, P.energy + hrs * 2.5);
      Player.need = null;
      const cd = f.crop ? CROPS[f.crop] : null;
      const what = !f.crop ? '' : f.growth >= 0.97 ? L('It is ready: hold Work to harvest!', 'పంట సిద్ధం: కోయడానికి \'పని\' పట్టుకోండి!') : f.outbreak || f.pests > 10 ? L('Pests! Hold Work to spray.', 'పురుగులు! పిచికారీకి \'పని\' పట్టుకోండి.') : f.weeds > 16 ? L('Weeds came up: hold Work to weed.', 'కలుపు వచ్చింది: \'పని\' పట్టుకోండి.') : f.nut < 40 ? L('The crop is hungry: hold Work to feed it.', 'పంటకు ఆకలి: ఎరువు కోసం \'పని\' పట్టుకోండి.') : cd && f.water < cd.wLo ? L('The field is dry: hold Work to water it.', 'పొలం ఎండిపోయింది: నీటికి \'పని\' పట్టుకోండి.') : '';
      UI.toast(L(`${hrs} hours passed. `, `${hrs} గంటలు గడిచాయి. `) + (cd ? `${LN(cd)} ${Math.round(f.growth * 100)}%. ` : '') + what, 'good');
      UI.dirty = true;
    }, L('Resting while the crop grows…', 'పంట పెరిగే వరకు విశ్రాంతి…'));
  },
  eat(k) { const F = FOODS[k]; if (!Money.spend(F.price, 'food')) return; const P = G.S.player; P.energy = Math.min(100, P.energy + F.energy); P.health = Math.min(100, P.health + F.health); UI.toast(L(`${F.en}: energy +${F.energy}`, `${F.te}: శక్తి +${F.energy}`), 'good'); Audio2.sfx('slurp'); Bus.emit('eat', { k }); },
  doctor() { const cost = G.S.village.health ? 100 : 200; if (!Money.spend(cost, 'doctor')) return; G.S.player.health = Math.min(100, G.S.player.health + 60); UI.toast(L('Dr. Sujatha checked you and gave medicine. Health +60.', 'డా. సుజాత పరీక్షించి మందులు ఇచ్చారు. ఆరోగ్యం +60.'), 'good'); Rel.add('sujatha', 2); },
  pray() { if (!Money.spend(51, 'temple')) return; const P = G.S.player; P.energy = Math.min(100, P.energy + 8); UI.toast(L('You offered ₹51 at the temple. You feel calm.', 'గుడిలో ₹51 కానుక సమర్పించారు. మనసు ప్రశాంతంగా ఉంది.'), 'good'); Audio2.sfx('bell'); Bus.emit('pray', {}); },
  repairVillageBorewell() {
    const S = G.S; if (S.flags.boreFixed) return;
    if (!Inv.take('pumppart', 1)) { UI.toast(L('You need a pump spare part from Bhaskar\'s workshop.', 'భాస్కర్ వర్క్‌షాప్ నుంచి పంపు విడిభాగం కావాలి.'), 'warn'); return; }
    S.flags.boreFixed = true; UI.toast(L('The village borewell works again! Women no longer walk to Seethampet for water.', 'గ్రామ బోరుబావి మళ్లీ పనిచేస్తోంది! నీటి కోసం సీతంపేట వెళ్ళాల్సిన అవసరం లేదు.'), 'good');
    for (const n of NPCs.list) if (n.named) Rel.add(n.id, 4);
    Audio2.sfx('fanfare'); Bus.emit('boreFixed', {});
  },
  registerInteractions() {
    const P = POI;
    const add = (o) => Interact.add(o);
    add({ id: 'tea', x: P.tea.counter.x, z: P.tea.counter.z, r: 3.5, foot: true, prio: 3, label: () => L("Yadamma's tea stall", 'యాదమ్మ టీ స్టాల్'), act: () => UI.foodMenu(['tea', 'samosa', 'majjiga'], L("Yadamma's tea stall", 'యాదమ్మ టీ స్టాల్')) });
    add({ id: 'seed', x: P.seedShop.counter[0], z: P.seedShop.counter[1], r: 3.5, foot: true, prio: 3, label: () => L("Srinu's seeds & fertilizers", 'శ్రీను విత్తనాలు & ఎరువులు'), act: () => UI.shop('seed') });
    add({ id: 'kirana', x: P.kirana.counter[0], z: P.kirana.counter[1], r: 3.5, foot: true, prio: 3, label: () => L('Mallesh kirana', 'మల్లేష్ కిరాణం'), act: () => UI.shop('kirana') });
    add({ id: 'workshop', x: P.workshop.counter.x, z: P.workshop.counter.z, r: 5, prio: 3, label: () => L("Bhaskar's tractor workshop", 'భాస్కర్ ట్రాక్టర్ వర్క్‌షాప్'), act: () => UI.workshop() });
    add({ id: 'busV', x: P.busStop.stop.x, z: P.busStop.stop.z, r: 4, foot: true, prio: 2, label: () => L('Take the bus to Nagaram town (₹20)', 'నగరం పట్టణానికి బస్సు (₹20)'), act: () => Services.busTravel('town') });
    add({ id: 'busT', x: P.townBus.stop.x, z: P.townBus.stop.z, r: 4, foot: true, prio: 2, label: () => L('Take the bus to Ramapuram (₹20)', 'రామాపురానికి బస్సు (₹20)'), act: () => Services.busTravel('village') });
    add({ id: 'phc', x: P.phc.counter[0], z: P.phc.counter[1], r: 4, foot: true, prio: 3, label: () => L('See the doctor', 'డాక్టర్‌ను కలవండి') + ` (${fmtINR(G.S.village.health ? 100 : 200)})`, act: () => Services.doctor() });
    add({ id: 'panchayat', x: P.panchayat.door[0], z: P.panchayat.door[1], r: 4, foot: true, prio: 3, label: () => L('Village development (Sarpanch)', 'గ్రామాభివృద్ధి (సర్పంచ్)'), act: () => UI.villageMenu() });
    add({ id: 'lender', x: P.moneylender.door.x, z: P.moneylender.door.z, r: 3.5, foot: true, prio: 3, label: () => L("Hanmanthu's house (loans)", 'హన్మంతు ఇల్లు (అప్పులు)'), act: () => UI.financeMenu('lender') });
    if (P.bank) add({ id: 'bank', x: P.bank.x, z: P.bank.z, r: 4, foot: true, prio: 3, label: () => L('Cooperative bank', 'సహకార బ్యాంకు'), act: () => UI.financeMenu('bank') });
    if (P.dealer) add({ id: 'dealer', x: P.dealer.x, z: P.dealer.z, r: 4.5, foot: true, prio: 3, label: () => L('Kisan Motors showroom', 'కిసాన్ మోటార్స్ షోరూమ్'), act: () => UI.dealer() });
    if (P.tiffin) add({ id: 'tiffin', x: P.tiffin.x, z: P.tiffin.z, r: 4, foot: true, prio: 3, label: () => L('Tiffin centre', 'టిఫిన్ సెంటర్'), act: () => UI.foodMenu(['samosa', 'meal', 'tea'], L('Tiffin centre', 'టిఫిన్ సెంటర్')) });
    add({ id: 'dhaba', x: P.dhaba.counter.x, z: P.dhaba.counter.z, r: 5, prio: 3, label: () => L('Telangana Dhaba', 'తెలంగాణ దాబా'), act: () => UI.foodMenu(['meal', 'majjiga', 'tea'], L('Telangana Dhaba', 'తెలంగాణ దాబా')) });
    add({ id: 'petrol', x: P.petrol.pump.x, z: P.petrol.pump.z, r: 7, vehicle: true, prio: 3, can: () => Player.vehicle && Player.vehicle.def.fuelCap > 0, label: () => L(`Refuel diesel (₹${Market.dieselPrice()}/L)`, `డీజిల్ నింపండి (₹${Market.dieselPrice()}/లీ.)`), act: () => Services.refuel(Player.vehicle) });
    add({ id: 'yardSell', x: P.yard.weigh.x, z: P.yard.weigh.z, r: 9, prio: 4, label: () => Player.vehicle && Player.vehicle.cargoQty > 0.05 ? L('Weighbridge: sell your load', 'వే బ్రిడ్జ్: మీ సరుకు అమ్మండి') : L('Market yard prices', 'మార్కెట్ యార్డ్ ధరలు'), act: () => UI.yardMenu(Player.vehicle) });
    add({ id: 'msp', x: P.yard.office.x, z: P.yard.office.z, r: 9, prio: 3, label: () => L('Govt. procurement centre (MSP)', 'ప్రభుత్వ కొనుగోలు కేంద్రం (మద్దతు ధర)'), act: () => UI.mspMenu(Player.vehicle) });
    add({ id: 'temple', x: P.temple.inner.x, z: P.temple.inner.z, r: 5, foot: true, prio: 2, label: () => L('Pray at the temple (₹51)', 'గుడిలో దండం పెట్టండి (₹51)'), act: () => Services.pray() });
    add({ id: 'santha', x: P.santha.x, z: P.santha.z, r: 18, vehicle: true, prio: 3, can: () => Time.weekday() === SANTHA_WEEKDAY && Player.vehicle && Player.vehicle.cargo.some((c) => c.crop === 'tomato' || c.crop === 'mango'), label: () => L('Sell at the Sunday santha (+5%)', 'ఆదివారం సంతలో అమ్మండి (+5%)'), act: () => UI.santhaSell(Player.vehicle) });
    add({ id: 'vbore', x: -17, z: -63, r: 4, foot: true, prio: 2, can: () => !G.S.flags.boreFixed && G.S.missions.active.some((m) => m.tpl === 'repairBore'), label: () => L('Repair the village borewell', 'గ్రామ బోరుబావి బాగుచేయండి'), act: () => Services.repairVillageBorewell() });
    add({ id: 'fuelCan', x: 0, z: 0, r: 0, prio: -2, can: () => false, label: () => '', act: () => { } });
  },
};

// ---------------- rank progression ----------------
const Progress = {
  reqs(r) {
    const S = G.S; const inc = S.stats.cropIncome; const ac = Farm.farmedAcres(); const own = Farm.ownedAcres(); const wk = S.workers.filter((w) => w.type !== 'daily').length;
    switch (r) {
      case 1: return [{ en: 'Farm income ₹2.5 lakh', te: 'వ్యవసాయ ఆదాయం ₹2.5 లక్షలు', ok: inc >= 250000, cur: inc, need: 250000 }, { en: 'Farm 2 acres (own or lease)', te: '2 ఎకరాల సాగు', ok: ac >= 2, cur: ac, need: 2 }];
      case 2: return [{ en: 'Farm income ₹10 lakh', te: 'ఆదాయం ₹10 లక్షలు', ok: inc >= 1000000, cur: inc, need: 1000000 }, { en: 'Farm 10 acres', te: '10 ఎకరాల సాగు', ok: ac >= 10, cur: ac, need: 10 }];
      case 3: return [{ en: 'Farm income ₹30 lakh', te: 'ఆదాయం ₹30 లక్షలు', ok: inc >= 3000000, cur: inc, need: 3000000 }, { en: 'Build a warehouse', te: 'గోదాము నిర్మించండి', ok: !!S.up.warehouse, cur: S.up.warehouse ? 1 : 0, need: 1 }, { en: 'Employ 3 permanent workers', te: '3 శాశ్వత కూలీలు', ok: wk >= 3, cur: wk, need: 3 }];
      case 4: return [{ en: 'Farm income ₹80 lakh', te: 'ఆదాయం ₹80 లక్షలు', ok: inc >= 8000000, cur: inc, need: 8000000 }, { en: 'Cold storage or dairy', te: 'కోల్డ్ స్టోరేజ్ లేదా పాడి', ok: !!(S.up.coldStorage || S.up.dairyShed), cur: (S.up.coldStorage || S.up.dairyShed) ? 1 : 0, need: 1 }, { en: 'Fund 3 village projects', te: '3 గ్రామ ప్రాజెక్టులు', ok: Village.devScore() >= 3, cur: Village.devScore(), need: 3 }];
      case 5: return [{ en: 'Farm income ₹2 crore', te: 'ఆదాయం ₹2 కోట్లు', ok: inc >= 20000000, cur: inc, need: 20000000 }, { en: 'Own 25 acres', te: '25 ఎకరాలు సొంతం', ok: own >= 25, cur: own, need: 25 }, { en: 'Own land in 2 villages', te: '2 గ్రామాల్లో భూమి', ok: Farm.villages() >= 2, cur: Farm.villages(), need: 2 }];
    }
    return [];
  },
  check() {
    const S = G.S;
    while (S.rank < 5 && this.reqs(S.rank + 1).every((q) => q.ok)) {
      S.rank++;
      const R = RANKS[S.rank];
      UI.rankUp(R);
      Audio2.sfx('fanfare');
      Bus.emit('rank', { rank: S.rank });
    }
  },
};
