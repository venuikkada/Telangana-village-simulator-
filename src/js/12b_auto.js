// ============================================================================
// Auto: "Do it for me". Walks the farmer to the next place along the roads,
// works a whole field row by row, presses the right button, or rests while the
// crop grows. Touching the stick (or WASD) hands control straight back.
// Also: tap the ground on a touch screen to walk there.
// ============================================================================
const Auto = {
  on: false, mode: null, path: [], i: 0, field: null, name: '', passes: 0, chkT: 0, lastD: 1e9, stuckN: 0, ring: null,
  // ---- start ----
  walkTo(x, z, name, viaRoads = true) {
    const P = Player.pos(); const d = Math.hypot(x - P.x, z - P.z);
    this.reset('walk'); this.name = name || '';
    this.path = viaRoads && d > 90 ? Graph.path(P.x, P.z, x, z, 0).map((p) => ({ x: p.x, z: p.z })) : [{ x, z }];
    this.showRing(x, z);
    UI.autoStatus();
  },
  farm(f) {
    if (!f) return;
    this.reset('farm'); this.field = f; this.name = f.id === 'F1' ? L('your field', 'మీ పొలం') : f.label();
    this.path = this.rows(f, 0);
    UI.autoStatus();
  },
  reset(mode) { this.on = true; this.mode = mode; this.path = []; this.i = 0; this.passes = 0; this.chkT = 0; this.lastD = 1e9; this.stuckN = 0; this.field = null; },
  stop(byPlayer) {
    if (!this.on) return;
    this.on = false; this.mode = null; this.path = []; Input.autoWork = false;
    if (this.ring) this.ring.visible = false;
    UI.autoStatus();
    if (byPlayer) Coach.key = '';   // let the coach repeat the step for the player
  },
  // serpentine rows over a field, starting at the corner nearest the farmer
  rows(f, pass) {
    const P = Player.pos(); const inset = 1.8, gap = 4.6, off = (pass % 2) * gap / 2;
    const alongX = f.w >= f.d; const pts = [];
    const a0 = alongX ? f.x0 + inset : f.z0 + inset, a1 = alongX ? f.x1 - inset : f.z1 - inset;
    let b = (alongX ? f.z0 : f.x0) + inset + off; const bEnd = (alongX ? f.z1 : f.x1) - inset + 0.01;
    let fwd = true; const lines = [];
    for (; b <= bEnd; b += gap) { lines.push([fwd ? a0 : a1, fwd ? a1 : a0, b]); fwd = !fwd; }
    // start from whichever end is closer
    const first = (l) => (alongX ? { x: l[0], z: l[2] } : { x: l[2], z: l[0] });
    const lastL = lines[lines.length - 1]; const endP = alongX ? { x: lastL[1], z: lastL[2] } : { x: lastL[2], z: lastL[1] };
    const fp = lines.length ? first(lines[0]) : { x: f.x, z: f.z };
    if (lines.length && Math.hypot(endP.x - P.x, endP.z - P.z) < Math.hypot(fp.x - P.x, fp.z - P.z)) { lines.reverse(); for (const l of lines) { const t = l[0]; l[0] = l[1]; l[1] = t; } }
    for (const l of lines) { if (alongX) { pts.push({ x: l[0], z: l[2] }, { x: l[1], z: l[2] }); } else { pts.push({ x: l[2], z: l[0] }, { x: l[2], z: l[1] }); } }
    return pts;
  },
  // ---- every frame, from Player.update: where to go and whether to work ----
  steer(dt, Pl) {
    if (!this.on) return null;
    if (UI.modalOpen() || Pl.vehicle) { this.stop(false); return null; }
    let p = this.path[this.i];
    while (p && Math.hypot(p.x - Pl.x, p.z - Pl.z) < (this.mode === 'farm' ? 0.9 : 1.6)) { this.i++; p = this.path[this.i]; this.lastD = 1e9; }
    if (!p) { this.finish(); return null; }
    const dx = p.x - Pl.x, dz = p.z - Pl.z, d = Math.hypot(dx, dz);
    // not getting closer: step around the obstacle, and if that keeps failing, hop there
    this.chkT += dt;
    if (this.chkT > 1.1) {
      if (this.lastD - d < 0.6) this.stuck(Pl, p);
      this.chkT = 0; this.lastD = d;
    }
    const f = this.field; const onF = !!f && CH.onField(f);
    const working = this.mode === 'farm' && onF;
    const nd = Pl.need;
    if (working && nd && performance.now() - nd.t < 1500 && nd.item !== 'wait') {
      // seeds, fertilizer or pesticide needed: stop so the coach can say what to tap. But a bare field
      // asks for seeds while it is still being ploughed: keep ploughing while the coach wants work here.
      const st = Coach.step;
      if (!(nd.item === 'seed' && !f.crop && st && st.icon === 'work')) { this.stop(false); return null; }
    }
    if (this.mode === 'farm' && G.S.player.energy < 2) { this.stop(false); UI.toastOnce('tired', L('You are tired. Eat something at the tea stall or rest at home.', 'మీరు అలసిపోయారు. టీ స్టాల్‌లో తినండి లేదా ఇంట్లో విశ్రాంతి తీసుకోండి.'), 'warn'); return null; }
    return { dx: dx / d, dz: dz / d, run: !working && d > 2.5, work: working };
  },
  stuck(Pl, p) {
    this.stuckN++;
    if (this.stuckN >= 4) {
      // give up walking around it: skip to the waypoint (a short hop, no fade needed)
      const q = { x: p.x, z: p.z }; World.collideCircle(q, 0.5);
      Pl.x = q.x; Pl.z = q.z; Pl.y = World.groundHeight(q.x, q.z); this.stuckN = 0; this.i++;
      return;
    }
    // sidestep: a detour point to the left or right of the blocked direction
    const dx = p.x - Pl.x, dz = p.z - Pl.z, d = Math.hypot(dx, dz) || 1; const s = this.stuckN % 2 ? 1 : -1;
    this.path.splice(this.i, 0, { x: Pl.x + (-dz / d) * 5 * s + dx / d * 2, z: Pl.z + (dx / d) * 5 * s + dz / d * 2 });
  },
  finish() {
    if (this.mode === 'farm' && this.field) {
      const st = Coach.step;
      if (st && st.icon === 'work' && this.passes < 2 && CH.onField(this.field)) { this.passes++; this.path = this.rows(this.field, this.passes); this.i = 0; return; }
    }
    const name = this.name; const mode = this.mode;
    this.stop(false);
    if (mode === 'walk' && name) UI.toast(L(`Here: ${name}`, `చేరుకున్నారు: ${name}`), 'good');
  },
  // ---- the "Do it" button: carry out the coach's current step ----
  doStep() {
    const st = Coach.step; if (!st || !G.started || UI.modalOpen()) return;
    Audio2.unlock(); Audio2.sfx('click');
    if (st.act) { st.act(); return; }
    if (st.target) {
      const d = CH.dist(st.target);
      if (Player.vehicle) { Services.fastTravel(st.target.x, st.target.z, st.target.name); return; }
      if (d > 320) { Services.fastTravel(st.target.x, st.target.z, st.target.name); return; }   // a long way: take an auto
      this.walkTo(st.target.x, st.target.z, st.target.name); return;
    }
    const P = Player.pos();
    if (st.icon === 'work') {
      if (Player.vehicle) Player.exitVehicle(true);
      const f = fieldAt(P.x, P.z) || Fields.nearest(P.x, P.z, (q) => q.isPlayer);
      if (f && f.isPlayer) this.farm(f);
      return;
    }
    if (st.icon === 'tap') { Interact.update(); Interact.trigger(); return; }
    if (st.icon === 'wait') {
      const f = fieldAt(P.x, P.z);
      if (f && f.isPlayer && f.crop) Services.waitForCrop(f); else if (!Player.vehicle) Sim.sleep(false);
      return;
    }
    if (st.icon === 'office' || st.icon === 'coin') { UI.office(st.tab || (st.icon === 'coin' ? 'finance' : undefined)); return; }
    if (st.icon === 'map') { UI.map(); return; }
    if (st.icon === 'drive') { const v = Vehicles.nearestOwned(P.x, P.z, 400); if (v) this.walkTo(v.x, v.z, v.label()); }
  },
  // ---- tap the ground (touch screens): walk there ----
  tapWalk(cx, cy) {
    if (!G.started || UI.modalOpen() || Player.vehicle || !Settings.v.tapWalk) return;   // a helper: only when turned on in the menu
    const cam = G.camera; const r = G.renderer.domElement.getBoundingClientRect();
    _v1.set(((cx - r.left) / r.width) * 2 - 1, -((cy - r.top) / r.height) * 2 + 1, 0.5).unproject(cam);
    const dir = _v1.sub(cam.position).normalize(); const o = cam.position;
    let hit = null; let prev = 0;
    for (let t = 1; t < 160; t += t < 30 ? 0.5 : 1.5) {   // march the ray until it dips under the ground
      const x = o.x + dir.x * t, y = o.y + dir.y * t, z = o.z + dir.z * t;
      if (y <= World.groundHeight(x, z)) { hit = { x: o.x + dir.x * (t + prev) / 2, z: o.z + dir.z * (t + prev) / 2 }; break; }
      prev = t;
    }
    if (!hit) return;
    this.walkTo(hit.x, hit.z, '', false);
  },
  showRing(x, z) {
    if (!this.ring) {
      const g = new THREE.RingGeometry(0.55, 0.85, 28); g.rotateX(-Math.PI / 2);
      this.ring = new THREE.Mesh(g, new THREE.MeshBasicMaterial({ color: 0xffc61a, transparent: true, opacity: 0.85, depthWrite: false, fog: false }));
      this.ring.renderOrder = 998; G.scene.add(this.ring);
    }
    this.ring.position.set(x, World.groundHeight(x, z) + 0.12, z); this.ring.visible = true; this.ringT = 0;
  },
  update(dt) {
    if (this.ring && this.ring.visible) { this.ringT = (this.ringT || 0) + dt; const s = 1 + Math.sin(this.ringT * 6) * 0.12; this.ring.scale.set(s, 1, s); if (!this.on && this.ringT > 1.2) this.ring.visible = false; }
  },
};
