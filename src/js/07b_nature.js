// ============================================================================
// Nature: wild flowers (marigold, chamanthi, hibiscus colours) around wherever
// you are, and butterflies that flutter between them on fine days.
// Both are single instanced draws and refill only when you move a few metres.
// ============================================================================
const FLOWER_COLS = ['#ff9a1f', '#ffc61a', '#ffe04a', '#ffffff', '#ff5fa2', '#e04ac0', '#b06cff', '#ff7a3d'];
const BUTTERFLY_COLS = ['#ffb21f', '#ffe14d', '#5ec8ff', '#ffffff', '#ff7ab8', '#9be15d', '#ff8c42'];
const Nature = {
  flowers: null, fly: null, flies: [], lastF: null, ready: false,
  init() {
    // a little plant: green stem and leaf, three blooms of five petals each
    const pos = [], col = [];
    const tri = (a, b, c, ca, cb, cc) => { pos.push(...a, ...b, ...c); col.push(...ca, ...cb, ...cc); };
    const green = [0.32, 0.82, 0.24], dark = [0.2, 0.5, 0.15], white = [1, 1, 1], eye = [1, 0.82, 0.25];
    // a tuft of leaves, then three stems
    for (let k = 0; k < 5; k++) { const a = (k / 5) * TAU + 0.3; tri([Math.cos(a + 1.4) * 0.03, 0, Math.sin(a + 1.4) * 0.03], [Math.cos(a - 1.4) * 0.03, 0, Math.sin(a - 1.4) * 0.03], [Math.cos(a) * 0.17, 0.1, Math.sin(a) * 0.17], dark, dark, green); }
    for (const [bx, by, bz] of [[0, 0.34, 0], [0.11, 0.25, 0.08], [-0.1, 0.23, -0.06]]) tri([-0.012, 0, 0], [0.012, 0, 0], [bx, by, bz], dark, dark, green);
    for (const [bx, by, bz, r] of [[0, 0.34, 0, 0.11], [0.11, 0.25, 0.08, 0.09], [-0.1, 0.23, -0.06, 0.085]]) {
      for (let k = 0; k < 6; k++) {
        const a0 = (k / 6) * TAU, a1 = a0 + 0.46, a2 = a0 - 0.46;
        tri([bx, by + 0.012, bz], [bx + Math.cos(a1) * r, by + 0.02, bz + Math.sin(a1) * r], [bx + Math.cos(a2) * r, by + 0.02, bz + Math.sin(a2) * r], white, white, white);
        tri([bx, by + 0.012, bz], [bx + Math.cos(a0 + 0.12) * r * 1.05, by + 0.035, bz + Math.sin(a0 + 0.12) * r * 1.05], [bx + Math.cos(a0 - 0.12) * r * 1.05, by + 0.035, bz + Math.sin(a0 - 0.12) * r * 1.05], white, white, white);
      }
      for (let k = 0; k < 3; k++) { const a = (k / 3) * TAU; tri([bx, by + 0.03, bz], [bx + Math.cos(a) * r * 0.32, by + 0.03, bz + Math.sin(a) * r * 0.32], [bx + Math.cos(a + 2.1) * r * 0.32, by + 0.03, bz + Math.sin(a + 2.1) * r * 0.32], eye, eye, eye); }
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3)); g.computeVertexNormals();
    // every normal points up: the flowers light like the ground they stand on (no dark undersides)
    const nr = g.attributes.normal.array; for (let i = 0; i < nr.length; i += 3) { nr[i] = 0; nr[i + 1] = 1; nr[i + 2] = 0; }
    this.fMax = isMobile ? 650 : 1100;
    const m = new THREE.InstancedMesh(g, MAT.flower, this.fMax);
    m.frustumCulled = false; m.castShadow = false; m.receiveShadow = true; m.count = 0;
    m.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    m.setColorAt(0, new THREE.Color(1, 1, 1));
    this.flowers = m; G.scene.add(m);
    // butterflies: one wing shape, two instances per butterfly (the second mirrored)
    const wp = [0, 0, 0.05, 0.13, 0, 0.09, 0.17, 0, -0.01, 0, 0, 0.05, 0.17, 0, -0.01, 0.1, 0, -0.1, 0, 0, 0.05, 0.1, 0, -0.1, 0, 0, -0.06];
    const wc = []; for (let i = 0; i < wp.length; i += 3) { const edge = Math.hypot(wp[i], wp[i + 2]) > 0.12; wc.push(...(edge ? [0.55, 0.42, 0.3] : [1, 1, 1])); }
    const wg = new THREE.BufferGeometry();
    wg.setAttribute('position', new THREE.Float32BufferAttribute(wp, 3)); wg.setAttribute('color', new THREE.Float32BufferAttribute(wc, 3));
    this.nFly = isMobile ? 10 : 16;
    const fm = new THREE.InstancedMesh(wg, new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.DoubleSide }), this.nFly * 2);
    fm.frustumCulled = false; fm.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    for (let i = 0; i < this.nFly; i++) {
      const c = new THREE.Color(BUTTERFLY_COLS[i % BUTTERFLY_COLS.length]);
      fm.setColorAt(i * 2, c); fm.setColorAt(i * 2 + 1, c);
      this.flies.push({ x: 0, y: 1, z: 0, tx: 0, ty: 1, tz: 0, sp: 1.2 + frand() * 0.8, ph: frand() * TAU, t: frand() * 5, s: 0.9 + frand() * 0.5, yaw: 0 });
    }
    this.fly = fm; G.scene.add(fm);
    this._o = new THREE.Object3D(); this._c = new THREE.Color();
    this.ready = true;
  },
  // refill the flower ring when the camera has moved a few metres
  updateFlowers(cam) {
    const m = this.flowers; if (!m) return;
    if (this.lastF && Math.hypot(cam.x - this.lastF.x, cam.z - this.lastF.z) < 8) return;
    this.lastF = { x: cam.x, z: cam.z };
    const R = isMobile ? 40 : 52, cell = 2.0; const o = this._o, c = this._c; let n = 0; const max = this.fMax;
    const cand = [];
    const gx0 = Math.floor((cam.x - R) / cell), gx1 = Math.floor((cam.x + R) / cell), gz0 = Math.floor((cam.z - R) / cell), gz1 = Math.floor((cam.z + R) / cell);
    for (let gz = gz0; gz <= gz1; gz++) for (let gx = gx0; gx <= gx1; gx++) {
      const hsh = hash2(gx * 7 + 3, gz * 5 - 11);
      // clumps: flowers grow in patches, more of them in the village gardens
      const patch = NZ.noise(gx * 0.11, gz * 0.11);
      const x = (gx + hash2(gx, gz + 9)) * cell, z = (gz + hash2(gz - 4, gx)) * cell;
      const d2 = (x - cam.x) * (x - cam.x) + (z - cam.z) * (z - cam.z); if (d2 > R * R) continue;
      const occ = World.occGet(x, z);
      const want = occ === OCC.VILLAGE ? 0.42 : occ === OCC.FREE || occ === OCC.KEEP || occ === OCC.BUND ? 0.24 : -1;
      if (want < 0 || hsh > want + patch * 0.25) continue;
      if (fieldAt(x, z)) continue;
      cand.push([d2, x, z, gx, gz]);
    }
    cand.sort((a, b) => a[0] - b[0]);
    for (const [, x, z, gx, gz] of cand) {
      if (n >= max) break;
      o.position.set(x, World.groundHeight(x, z) - 0.01, z);
      o.rotation.set(0, hash2(gz, gx * 3) * TAU, 0);
      const s = 1.0 + hash2(gx * 2, gz) * 0.8; o.scale.set(s, s, s); o.updateMatrix();
      m.setMatrixAt(n, o.matrix);
      // patches share a colour, like a real bed of marigolds
      const ci = Math.floor((NZ.noise(gx * 0.07 + 40, gz * 0.07) * 0.5 + 0.5) * FLOWER_COLS.length + hash2(gx, gz) * 1.4) % FLOWER_COLS.length;
      m.setColorAt(n, c.set(FLOWER_COLS[ci]));
      n++;
    }
    m.count = n;
    const im = m.instanceMatrix; im.clearUpdateRanges(); im.addUpdateRange(0, Math.max(1, n) * 16); im.needsUpdate = true;
    if (m.instanceColor) { const ic = m.instanceColor; ic.clearUpdateRanges(); ic.addUpdateRange(0, Math.max(1, n) * 3); ic.needsUpdate = true; }
    this.spots = cand.slice(0, Math.min(n, 60)).map((q) => ({ x: q[1], z: q[2] }));
  },
  update(dt, cam) {
    if (!this.ready) return;
    this.updateFlowers(cam);
    const fm = this.fly; const W = Weather.cur;
    const show = G.started && W.rain < 0.25 && Sky.daylight > 0.5 && !Player.vehicle;
    fm.visible = show; if (!show) return;
    const P = Player.pos(); const o = this._o; const spots = this.spots || [];
    for (let i = 0; i < this.flies.length; i++) {
      const b = this.flies[i];
      b.t += dt;
      // far from the player or reached its flower: pick another flower near the player
      const dp = Math.hypot(b.x - P.x, b.z - P.z);
      if (dp > 26 || b.t > 5 || Math.hypot(b.tx - b.x, b.tz - b.z) < 0.4) {
        b.t = 0;
        const sp = spots.length ? spots[(Math.random() * spots.length) | 0] : { x: P.x + (frand() - 0.5) * 20, z: P.z + (frand() - 0.5) * 20 };
        b.tx = sp.x + (frand() - 0.5) * 2; b.tz = sp.z + (frand() - 0.5) * 2; b.ty = World.groundHeight(b.tx, b.tz) + 0.4 + frand() * 1.4;
        if (dp > 26) { b.x = P.x + (frand() - 0.5) * 24; b.z = P.z + (frand() - 0.5) * 24; b.y = World.groundHeight(b.x, b.z) + 1.5; }
      }
      const dx = b.tx - b.x, dz = b.tz - b.z, dy = b.ty - b.y, d = Math.hypot(dx, dz) || 1;
      b.yaw = dampAngle(b.yaw, Math.atan2(dx, dz), 4, dt);
      const v = b.sp * dt;
      b.x += (dx / d) * v + Math.sin(b.t * 3.1 + b.ph) * dt * 0.6; b.z += (dz / d) * v + Math.cos(b.t * 2.7 + b.ph) * dt * 0.6;
      b.y += dy * Math.min(1, dt * 1.5) + Math.sin(b.t * 7 + b.ph) * dt * 0.5;
      const flap = Math.sin(G.t * 22 + b.ph) * 1.05 + 0.25;
      for (let k = 0; k < 2; k++) {
        o.position.set(b.x, b.y, b.z); o.rotation.set(0, b.yaw, (k ? -1 : 1) * flap); o.scale.set((k ? -1 : 1) * b.s, b.s, b.s); o.updateMatrix();
        fm.setMatrixAt(i * 2 + k, o.matrix);
      }
    }
    fm.instanceMatrix.needsUpdate = true;
  },
};
