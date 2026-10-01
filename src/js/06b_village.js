// ============================================================================
// Village layout: Ramapuram, Seethampet, Nagaram town, highway, market yard
// ============================================================================
const POI = { houses: [], shelters: [], shade: [], seethaHouses: [], townDoors: [], chimneys: [] };
World.occFreeOBB = function (cx, cz, hw, hd, rot, allowVillage = true) {
  const c = Math.cos(rot), s = Math.sin(rot); const R = Math.hypot(hw, hd);
  for (let z = cz - R; z <= cz + R; z += 1.5) for (let x = cx - R; x <= cx + R; x += 1.5) {
    const dx = x - cx, dz = z - cz; const lx = dx * c - dz * s, lz = dx * s + dz * c;
    if (Math.abs(lx) > hw || Math.abs(lz) > hd) continue;
    const o = this.occGet(x, z);
    if (!(o === OCC.FREE || (allowVillage && o === OCC.VILLAGE))) return false;
    if (fieldAt(x, z)) return false;
  }
  return true;
};

function placeHousesAlong(road, center, radius, list, opts = {}) {
  const P = road.samples; if (!P) return;
  let acc = 5 + RNG() * 6;
  for (let i = 1; i < P.length; i++) {
    acc += P[i].distanceTo(P[i - 1]);
    if (acc < (opts.gap || 12.5)) continue;
    acc = RNG() * 3;
    const a = P[i - 1], b = P[Math.min(P.length - 1, i + 1)];
    const tx = b.x - a.x, tz = b.z - a.z, tl = Math.hypot(tx, tz) || 1;
    const nx = -tz / tl, nz = tx / tl;
    for (const side of [-1, 1]) {
      if (RNG() < (opts.skip || 0.18)) continue;
      const w = rrange(6.2, 8.8), d = rrange(5.6, 7.2), ver = RNG() < 0.55;
      const off = road.w / 2 + 3.2 + (ver ? 2.4 : 0) + d / 2 + RNG() * 2;
      const cx = P[i].x + nx * off * side, cz = P[i].z + nz * off * side;
      if (Math.hypot(cx - center.x, cz - center.z) > radius) continue;
      const ry = Math.atan2(-nx * side, -nz * side);
      const [ccx, ccz] = lw(cx, cz, ry, 0, ver ? 1.2 : 0);
      if (!World.occFreeOBB(ccx, ccz, w / 2 + 1.2, d / 2 + (ver ? 2.6 : 1.3), ry)) continue;
      const hs = buildHouse(cx, cz, ry, { w, d, verandah: ver, roof: opts.roof ? pick(opts.roof) : undefined });
      list.push(hs); POI.shelters.push({ x: hs.door.x, z: hs.door.z, kind: 'veranda' });
      if (RNG() < 0.22) { const [sx, sz] = lw(cx, cz, ry, -w / 2 - 4.2, -1); if (World.occFreeOBB(sx, sz, 3.4, 2.4, ry)) { buildCattleShed(sx, sz, ry, 5, 3.6); World.occOBB(sx, sz, 3.4, 2.4, ry, OCC.BUILD); hs.shed = { x: sx, z: sz }; } }
    }
  }
}

World.buildVillage = function () {
  RNG = mulberry32(98765);
  // village ground
  for (const zn of [{ x: VILLAGE.x, z: VILLAGE.z, r: 160 }, { x: SEETHA.x, z: SEETHA.z, r: 80 }, { x: TOWN.x, z: TOWN.z, r: 105 }]) {
    for (let z = zn.z - zn.r; z <= zn.z + zn.r; z += 2) for (let x = zn.x - zn.r; x <= zn.x + zn.r; x += 2) if (Math.hypot(x - zn.x, z - zn.z) < zn.r && this.occGet(x, z) === OCC.FREE) this.occSet(x, z, OCC.VILLAGE);
  }
  this.occRect(HOMESTEAD.x0, HOMESTEAD.z0, HOMESTEAD.x1, HOMESTEAD.z1, OCC.KEEP);
  this.occRect(-178, 110, -150, 138, OCC.KEEP); // polyhouse plot
  this.occRect(-202, 86, -180, 108, OCC.KEEP);  // farm pond plot
  // --- Ramapuram landmarks ---
  POI.temple = buildTemple(-48, -46, Math.PI / 2);
  Veg.add('banyan', -48, -68, 1.05); Veg.add('neem', -30, -60, 1.1);
  POI.shade.push({ x: -48, z: -64 });
  POI.panchayat = buildPanchayat(30, -40, 0);
  POI.rachabanda = buildRachabanda(15, -19); Veg.add('banyan', 15, -19, 1.1); POI.shade.push({ x: 15, z: -19 });
  POI.school = buildSchool(58, -118, 0);
  POI.tea = buildTeaStall(14, 11, Math.PI);
  POI.seedShop = buildShop(34, 13, Math.PI, { w: 6.5, d: 6, wall: '#f0dfaa', trim: '#2f6d4f', awning: '#2f7d3a', sign: Atlas.sign('శ్రీను ఎరువులు & విత్తనాలు', 'Srinu Fertilizers & Seeds', { bg: '#2f7d3a', fg: '#ffffff', border: '#f2c94c', fg2: '#f2c94c' }), board: '#1f4f2a',
    goods: (b, w, d) => { for (let i = 0; i < 12; i++) b.s.boxB(0.75, 0.3, 0.5, -w / 2 + 0.7 + (i % 4) * 0.8, 0.3 + Math.floor(i / 4) * 0.3, d / 2 + 0.9, 0, C(i % 3 === 0 ? '#e8e4d8' : i % 3 === 1 ? '#f2e2b0' : '#d8ecd8')); } });
  POI.kirana = buildShop(-16, 12, Math.PI, { w: 5.5, d: 5.5, wall: '#f4d6d0', trim: '#8e3b46', awning: '#c0392b', sign: Atlas.sign('మల్లేష్ కిరాణం', 'Mallesh Kirana & General', { bg: '#c0392b', fg: '#ffffff', border: '#ffd166', fg2: '#ffd166' }), board: '#6b1f16',
    goods: (b, w, d) => { for (let i = 0; i < 10; i++) b.s.box(0.22, 0.32, 0.04, -w / 2 + 0.6 + i * 0.45, 2.55, d / 2 + 0.4, 0, C(pick(['#e03131', '#f08c00', '#1971c2', '#2f9e44', '#ffd43b']))); b.s.cyl(0.3, 0.8, w / 2 - 0.6, 0.3, d / 2 + 0.8, C('#2b5fa8'), 8); } });
  POI.workshop = buildWorkshop(80, 20, Math.PI);
  POI.busStop = buildBusStop(44, -9, 0);
  POI.phc = buildShop(-68, 22, Math.PI, { w: 13, d: 8, h: 3.4, wall: '#f5f3ee', trim: '#2e8b57', awning: '#2e8b57', sign: Atlas.sign('ప్రాథమిక ఆరోగ్య కేంద్రం', 'Primary Health Centre', { bg: '#ffffff', fg: '#1d6b44', border: '#2e8b57', icon: 'plus' }), board: '#2e8b57' });
  POI.moneylender = buildHouse(-84, -20, 0, { w: 9, d: 7.5, floors: 2, roof: 'flat', wall: '#f0d67a', trim: '#7a2f2f', verandah: true, extras: false });
  POI.sarpanchHouse = buildHouse(74, -32, 0, { w: 8.5, d: 7, roof: 'flat', wall: '#dbe8f2', trim: '#2f5d8a', verandah: true, extras: false });
  buildWaterTower(-20, -68);
  buildArch(152, -5, Math.PI / 2, 'రామాపురం గ్రామానికి స్వాగతం', 'Welcome to Ramapuram');
  buildArch(-162, 8, Math.PI / 2, 'రామాపురం గ్రామానికి స్వాగతం', 'Welcome to Ramapuram');
  POI.shelters.push({ x: POI.tea.counter.x, z: POI.tea.counter.z, kind: 'tea' }, { x: POI.busStop.stop.x, z: POI.busStop.stop.z - 2, kind: 'bus' }, { x: POI.panchayat.door[0], z: POI.panchayat.door[1], kind: 'office' }, { x: POI.seedShop.counter[0], z: POI.seedShop.counter[1], kind: 'shop' }, { x: POI.temple.inner.x, z: POI.temple.inner.z, kind: 'temple' });
  // santha (weekly market ground)
  POI.santha = { x: -34, z: 86, stalls: [] };
  {
    const y = this.groundHeight(-34, 86);
    for (let i = 0; i < 10; i++) {
      const sx = -34 + (i % 5 - 2) * 7, sz = 80 + Math.floor(i / 5) * 11;
      const b = Chunks.get(sx, sz, 'std'), ds = Chunks.get(sx, sz, 'stdDS');
      for (const [px, pz] of [[-1.6, -1.2], [1.6, -1.2], [-1.6, 1.2], [1.6, 1.2]]) b.boxB(0.08, 2.3, 0.08, sx + px, y, sz + pz, 0, C('#6b5a48'));
      ds.box(3.6, 0.04, 2.8, sx, y + 2.35, sz, 0, C(pick(['#2d6ca6', '#e07b22', '#c0392b', '#2f7d3a', '#e2b81f'])), 0.08);
      b.boxB(2.6, 0.7, 1.4, sx, y, sz + 0.3, 0, C('#8a6a45'));
      POI.santha.stalls.push({ x: sx, z: sz + 1.8, y });
    }
    this.occRect(-54, 74, -14, 102, OCC.BUILD);
  }
  // lanes of houses
  for (const id of ['main', 'ns', 'lane1', 'lane2', 'lane3', 'lane4', 'west', 'south', 'lakeRd', 'east']) {
    const r = ROADS.find((q) => q.id === id);
    placeHousesAlong(r, VILLAGE, 150, POI.houses, { gap: id === 'main' || id === 'ns' ? 12 : 13.5 });
  }
  // extra infill houses on free village ground
  for (let k = 0; k < 140 && POI.houses.length < 95; k++) {
    const a = RNG() * TAU, d = 40 + RNG() * 100; const x = Math.cos(a) * d, z = Math.sin(a) * d;
    const rd = this.roadAt(x, z); if (rd) continue;
    let best = null, bd = 1e9; for (const r of ROADS) { if (r.kind === 'hwy') continue; const dd = distToPolyline(x, z, r.pts); if (dd < bd) { bd = dd; best = r; } }
    const ry = RNG() * TAU; const w = rrange(6, 8), dd2 = rrange(5.5, 7);
    if (!this.occFreeOBB(x, z, w / 2 + 1.5, dd2 / 2 + 1.5, ry)) continue;
    const hs = buildHouse(x, z, ry, { w, d: dd2 }); POI.houses.push(hs);
  }
  POI.houses.forEach((h) => { if (frand() < 0.4) POI.chimneys.push(h.chimney); });
  // --- Seethampet ---
  buildArch(-392, 362, Math.atan2(-54, 72), 'సీతంపేట', 'Seethampet');
  for (const id of ['seethaLane', 'seetha']) placeHousesAlong(ROADS.find((q) => q.id === id), SEETHA, 78, POI.seethaHouses, { gap: 12, skip: 0.1 });
  for (let k = 0; k < 60 && POI.seethaHouses.length < 22; k++) {
    const a = RNG() * TAU, d = 15 + RNG() * 55; const x = SEETHA.x + Math.cos(a) * d, z = SEETHA.z + Math.sin(a) * d;
    const ry = RNG() * TAU; if (!this.occFreeOBB(x, z, 5, 4.5, ry)) continue;
    POI.seethaHouses.push(buildHouse(x, z, ry, { roof: pick(['tile', 'thatch', 'flat', 'tile']) }));
  }
  {
    const y = this.groundHeight(-445, 405), b = B5(-445, 405, 0.4, y);
    b.s.boxB(1.8, 1.8, 1.8, 0, 0, 0, 0, C('#f3ece0')); b.s.pyramid(2.3, 1.1, 2.3, 0, 1.8, 0, 0, C('#e07b22')); b.s.sphere(0.4, 0, 0.55, 0.95, C('#e0601f'), PRIM.ico0);
    endB(b); World.addCollider(-445, 405, 1, 1, 0.4, 3); Veg.add('neem', -452, 398, 1.1);
    POI.seethaTemple = { x: -445, z: 409 };
    POI.seethaWell = { x: -420, z: 440 };
    const wb = Chunks.get(-420, 440, 'std'); const wy = this.groundHeight(-420, 440);
    wb.cyl(1.4, 0.9, -420, wy, 440, C('#8e877c'), 12); wb.boxB(0.12, 1.6, 0.12, -421.2, wy, 440, 0, C('#6b5a48')); wb.boxB(0.12, 1.6, 0.12, -418.8, wy, 440, 0, C('#6b5a48')); wb.box(2.6, 0.1, 0.1, -420, wy + 1.6, 440, 0, C('#6b5a48'));
    World.addCollider(-420, 440, 1.3, 1.3, 0, 1);
  }
  // --- Nagaram town ---
  const shopsN = [
    ['సహకార బ్యాంకు', 'Cooperative Bank', '#1f3f8a', '#ffffff', 'bank'], ['కిసాన్ మోటార్స్ · ట్రాక్టర్ & బైక్', 'Kisan Motors · Tractors & Bikes', '#b8321f', '#ffffff', 'dealer'],
    ['మెడికల్ షాప్', 'Medical Shop', '#2e8b57', '#ffffff'], ['మొబైల్ షాప్', 'Mobile Shop', '#6b3fa0', '#ffffff'], ['టిఫిన్ సెంటర్', 'Tiffin Centre', '#e07b22', '#ffffff', 'tiffin'],
    ['హార్డ్‌వేర్ & సిమెంట్', 'Hardware & Cement', '#46525a', '#ffd166'], ['పట్టు చీరలు', 'Pochampally Sarees', '#8a2f8f', '#ffffff'], ['బంగారు నగలు', 'Jewellers', '#b8862a', '#1a1406'],
    ['ఎరువుల డిపో', 'Fertilizer Depot', '#2f7d3a', '#ffffff'], ['బేకరీ & స్వీట్స్', 'Bakery & Sweets', '#d6336c', '#ffffff'], ['ఫోటో స్టూడియో', 'Photo Studio', '#1971c2', '#ffffff'], ['బట్టల దుకాణం', 'Cloth Store', '#c0392b', '#ffffff'],
  ];
  let si = 0;
  for (let x = 604; x > 492; x -= 12.5) {
    for (const side of [-1, 1]) {
      const z = side < 0 ? -142 : -108, ry = side < 0 ? 0 : Math.PI;
      if (Math.abs(x - 555) < 9 && side > 0) continue;
      const sp = shopsN[si % shopsN.length]; si++;
      const res = buildTownBlock(x, z, ry, { w: 10.5, d: 10, floors: 1 + Math.floor(RNG() * 3), sign: Atlas.sign(sp[0], sp[1], { bg: sp[2], fg: sp[3], border: sp[3] }) });
      POI.townDoors.push(res.door);
      if (sp[4]) POI[sp[4]] = { x: res.door.x, z: res.door.z, y: res.y };
    }
  }
  for (let z = -95; z < -15; z += 13) for (const side of [-1, 1]) {
    const x = side < 0 ? 541 : 569, ry = side < 0 ? Math.PI / 2 : -Math.PI / 2;
    if (!this.occFreeOBB(x, z, 6, 6, ry)) continue;
    const res = buildTownBlock(x, z, ry, { w: 10, d: 9, floors: 1 + Math.floor(RNG() * 2) }); POI.townDoors.push(res.door);
  }
  { // clock tower
    const x = 538, z = -118, y = this.groundHeight(x, z); const b = B5(x, z, 0, y);
    b.s.boxB(3, 1, 3, 0, 0, 0, 0, C(STONE)); b.s.boxB(2, 10, 2, 0, 1, 0, 0, C('#e8ddc6')); b.s.boxB(2.4, 0.3, 2.4, 0, 11, 0, 0, C('#b8432f'));
    b.s.pyramid(2.4, 2, 2.4, 0, 11.3, 0, 0, C('#b8432f'));
    for (let k = 0; k < 4; k++) { const a = k * Math.PI / 2; b.g.box(1.2, 1.2, 0.05, Math.sin(a) * 1.02, 9.4, Math.cos(a) * 1.02, a, C('#fff6d8')); }
    endB(b); World.addCollider(x, z, 1.5, 1.5, 0, 12);
  }
  POI.townBus = buildBusStop(612, -140, 0);
  // highway services
  POI.petrol = buildPetrolBunk(670, 40, -Math.PI / 2);
  POI.dhaba = buildDhaba(670, -32, -Math.PI / 2);
  Veg.add('banyan', 684, -48, 0.9);
  POI.yard = buildMarketYard();
  // highway gantry signs
  for (const [z, ry] of [[-260, 0], [260, Math.PI]]) {
    const y = this.groundHeight(640, z); const b = B5(640, z, ry, y);
    for (const sx of [-9.5, 9.5]) b.m.boxB(0.4, 7.6, 0.4, sx, 0, 0, 0, C('#8e959a'));
    b.m.box(19.4, 0.3, 0.3, 0, 7.4, 0, 0, C('#8e959a'));
    endB(b);
    for (const sx of [-9.5, 9.5]) { const [px, pz] = lw(640, z, ry, sx, 0); World.addCollider(px, pz, 0.3, 0.3, 0, 8); }
    const uv1 = Atlas.sign(ry === 0 ? 'హైదరాబాద్ ↑ 85 కి.మీ' : 'వరంగల్ ↑ 62 కి.మీ', ry === 0 ? 'Hyderabad 85 km' : 'Warangal 62 km', { bg: '#1f6b3a', fg: '#ffffff', border: '#ffffff' });
    const uv2 = Atlas.sign('← రామాపురం · నగరం', 'Ramapuram · Nagaram exit', { bg: '#1f6b3a', fg: '#ffffff', border: '#ffffff' });
    const [ax, az] = lw(640, z, ry, -4.6, 0.25); addSign(ax, y + 6.3, az, ry, 8, 2, uv1, '#1f6b3a');
    const [bx, bz] = lw(640, z, ry, 4.6, 0.25); addSign(bx, y + 6.3, bz, ry, 8, 2, uv2, '#1f6b3a');
  }
  // milestones along main road
  const main = ROADS.find((r) => r.id === 'main');
  let acc = 0, km = 0;
  for (let i = 1; i < main.samples.length; i++) {
    acc += 3; if (acc < 220) continue; acc = 0; km++;
    const p = main.samples[i], q = main.samples[i - 1]; const tx = p.x - q.x, tz = p.z - q.z, tl = Math.hypot(tx, tz) || 1;
    const x = p.x + (-tz / tl) * 5.6, z = p.z + (tx / tl) * 5.6; if (this.occGet(x, z) !== OCC.FREE && this.occGet(x, z) !== OCC.VILLAGE) continue;
    const y = this.groundHeight(x, z); const b = Chunks.get(x, z, 'std');
    const ry = Math.atan2(tx, tz) + Math.PI / 2;
    b.boxB(0.5, 0.75, 0.22, x, y, z, ry, C('#f2efe6')); b.add(PRIM.halfCyl, b.mat(x, y + 0.75, z, 0.5, 0.22, 0.5, ry, Math.PI / 2), C('#e2b81f'));
    const dist = Math.round(Math.abs(p.x) / 100) / 10;
    const uv = Atlas.custom((ctx, W, H) => { ctx.fillStyle = '#f2efe6'; ctx.fillRect(0, 0, W, H); ctx.fillStyle = '#1a1a1a'; ctx.textAlign = 'center'; ctx.font = '700 44px "Baloo Tammudu 2", sans-serif'; ctx.fillText(p.x > 0 ? 'నగరం' : 'సీతంపేట', W / 2, 50); ctx.font = '700 40px "Hind Guntur", sans-serif'; ctx.fillText((p.x > 0 ? (6.3 - p.x / 100).toFixed(1) : (4.3 + p.x / 100).toFixed(1)) + ' km', W / 2, 104); });
    const s = Chunks.get(x, z, 'sign'); const nx = Math.sin(ry), nz = Math.cos(ry);
    s.quad(0.46, 0.4, x + nx * 0.12, y + 0.42, z + nz * 0.12, ry, C('#ffffff'), 0, [uv[0], uv[1], uv[2] * 0.6, uv[3]]);
    void dist;
  }
  // electric lines & transformers
  buildPoleLine(ROADS.find((r) => r.id === 'main').pts, 1);
  buildPoleLine(ROADS.find((r) => r.id === 'ns').pts, 1, 36, 5);
  buildPoleLine(ROADS.find((r) => r.id === 'seetha').pts, -1, 40, 5);
  buildPoleLine(ROADS.find((r) => r.id === 'west').pts, -1, 36, 4.5);
  buildPoleLine(ROADS.find((r) => r.id === 'north').pts, 1, 40, 4.5);
  for (const [x, z, r] of [[-122, 16, 0], [112, -14, 0.1], [-186, 76, 0.3], [300, -14, 0], [-40, -128, 0.2], [210, -196, 0.4], [-300, 26, 0]]) if (this.occFreeOBB(x, z, 2, 1.2, r)) buildTransformer(x, z, r);
  // field pump houses (NPC fields) + player's first borewell
  const F1 = World.fields[0];
  POI.f1Pump = buildPumpHouse(F1.x1 + 3.6, F1.z0 + 5, -Math.PI / 2);
  for (const f of World.fields.slice(1)) {
    if (f.id === 'GH') continue;
    if (hash2(f.idx, 17) < 0.3 && !f.canal) {
      const x = f.x0 - 3, z = f.z0 + 4; if (this.occGet(x, z) === OCC.FREE) { const ph = buildPumpHouse(x, z, Math.PI / 2); f.pumpPos = ph; f.hasNpcBore = true; }
    }
  }
  // scattered farm huts
  for (let k = 0; k < 40 && (POI.farmHuts || (POI.farmHuts = [])).length < 8; k++) {
    const f = World.fields[1 + Math.floor(RNG() * (World.fields.length - 1))];
    if (f.id === 'GH') continue;
    const x = f.x1 + 7, z = f.z + (RNG() - 0.5) * 10, ry = -Math.PI / 2;
    if (!this.occFreeOBB(x, z, 3.5, 3.5, ry)) continue;
    POI.farmHuts.push(buildHouse(x, z, ry, { w: 4.6, d: 4.2, roof: 'thatch', verandah: false, h: 2.5 }));
    buildHayStack(Chunks.get(x, z, 'std'), x + 2.5, this.groundHeight(x + 2.5, z + 5), z + 5, 0.8);
  }
  // hill shrine
  const sh = HILLS.find((h) => h.shrine); POI.shrine = { x: sh.x, z: sh.z }; buildHillShrine(sh.x + 4, sh.z + 6);
  // lake bund (katta) steps + Bathukamma ghat
  {
    const a = Math.atan2(-160 - LAKE.z, -168 - LAKE.x);
    const rr = lakeRadius(a) + 4; const gx = LAKE.x + Math.cos(a) * rr, gz = LAKE.z + Math.sin(a) * rr;
    const y = this.groundHeight(gx, gz); const ry = Math.atan2(-Math.cos(a), -Math.sin(a));
    const b = B5(gx, gz, ry, y);
    for (let k = 0; k < 5; k++) b.s.boxB(9, 0.3, 1.2, 0, -0.3 - k * 0.3, k * 1.1, 0, C(STONE));
    endB(b);
    POI.ghat = { x: gx, z: gz, y, ry };
    Veg.add('banyan', gx + 14, gz + 6, 1.0);
  }
};
