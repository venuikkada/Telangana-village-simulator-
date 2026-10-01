// ============================================================================
// Geometry builder (merged vertex-coloured meshes), sign atlas, chunk system
// ============================================================================
const CCACHE = new Map();
function C(hex) { let c = CCACHE.get(hex); if (!c) { c = new THREE.Color(hex); CCACHE.set(hex, c); } return c; }

function primFrom(geom) {
  const g = geom.index ? geom.toNonIndexed() : geom;
  if (!g.attributes.normal) g.computeVertexNormals();
  return { pos: g.attributes.position.array, nor: g.attributes.normal.array, count: g.attributes.position.count, uv: g.attributes.uv ? g.attributes.uv.array : null };
}
function makePrismGeom() { // gable roof: base 1x1 at y=0, ridge along x at y=1, z=0
  const v = [
    // slope +z
    [-0.5, 0, 0.5], [0.5, 0, 0.5], [0.5, 1, 0], [-0.5, 0, 0.5], [0.5, 1, 0], [-0.5, 1, 0],
    // slope -z
    [0.5, 0, -0.5], [-0.5, 0, -0.5], [-0.5, 1, 0], [0.5, 0, -0.5], [-0.5, 1, 0], [0.5, 1, 0],
    // gable -x
    [-0.5, 0, -0.5], [-0.5, 0, 0.5], [-0.5, 1, 0],
    // gable +x
    [0.5, 0, 0.5], [0.5, 0, -0.5], [0.5, 1, 0],
  ];
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(v.flat(), 3)); g.computeVertexNormals(); return g;
}
const PRIM = {};
function initPrims() {
  PRIM.box = primFrom(new THREE.BoxGeometry(1, 1, 1));
  PRIM.cyl4 = primFrom(new THREE.CylinderGeometry(0.5, 0.5, 1, 4, 1, true));
  PRIM.cone4 = primFrom(new THREE.CylinderGeometry(0, 0.5, 1, 4, 1, true));
  PRIM.cyl6 = primFrom(new THREE.CylinderGeometry(0.5, 0.5, 1, 6));
  PRIM.cyl8 = primFrom(new THREE.CylinderGeometry(0.5, 0.5, 1, 8));
  PRIM.cyl12 = primFrom(new THREE.CylinderGeometry(0.5, 0.5, 1, 12));
  PRIM.cyl16 = primFrom(new THREE.CylinderGeometry(0.5, 0.5, 1, 16));
  PRIM.cylOpen12 = primFrom(new THREE.CylinderGeometry(0.5, 0.5, 1, 12, 1, true));
  PRIM.cone6 = primFrom(new THREE.CylinderGeometry(0, 0.5, 1, 6));
  PRIM.cone8 = primFrom(new THREE.CylinderGeometry(0, 0.5, 1, 8));
  PRIM.cone12 = primFrom(new THREE.CylinderGeometry(0, 0.5, 1, 12));
  PRIM.frustum8 = primFrom(new THREE.CylinderGeometry(0.35, 0.5, 1, 8));
  PRIM.ico0 = primFrom(new THREE.IcosahedronGeometry(0.5, 0));
  PRIM.ico1 = primFrom(new THREE.IcosahedronGeometry(0.5, 1));
  PRIM.dodec = primFrom(new THREE.DodecahedronGeometry(0.5, 0));
  PRIM.oct = primFrom(new THREE.OctahedronGeometry(0.5, 0));
  PRIM.tet = primFrom(new THREE.TetrahedronGeometry(0.5, 0));
  PRIM.hemi = primFrom(new THREE.SphereGeometry(0.5, 12, 6, 0, TAU, 0, Math.PI / 2));
  PRIM.sphere = primFrom(new THREE.SphereGeometry(0.5, 12, 8));
  PRIM.prism = primFrom(makePrismGeom());
  const pyr = new THREE.CylinderGeometry(0, 0.7071, 1, 4); pyr.rotateY(Math.PI / 4); PRIM.pyramid = primFrom(pyr);
  PRIM.quad = primFrom(new THREE.PlaneGeometry(1, 1));
  PRIM.torus = primFrom(new THREE.TorusGeometry(0.4, 0.1, 6, 14));
  PRIM.halfCyl = primFrom(new THREE.CylinderGeometry(0.5, 0.5, 1, 10, 1, true, 0, Math.PI));
}

const _mA = new THREE.Matrix4(), _mB = new THREE.Matrix4(), _nm = new THREE.Matrix3();
class GeoBuilder {
  constructor(withUV = false) {
    this.cap = 4096; this.n = 0; this.withUV = withUV;
    this.pos = new Float32Array(this.cap * 3); this.nor = new Float32Array(this.cap * 3); this.col = new Float32Array(this.cap * 3);
    this.uv = withUV ? new Float32Array(this.cap * 2) : null;
    this.base = new THREE.Matrix4(); this.hasBase = false;
  }
  grow(extra) {
    if (this.n + extra <= this.cap) return;
    let c = this.cap; while (this.n + extra > c) c *= 2;
    const np = new Float32Array(c * 3); np.set(this.pos); this.pos = np;
    const nn = new Float32Array(c * 3); nn.set(this.nor); this.nor = nn;
    const nc = new Float32Array(c * 3); nc.set(this.col); this.col = nc;
    if (this.uv) { const nu = new Float32Array(c * 2); nu.set(this.uv); this.uv = nu; }
    this.cap = c;
  }
  setBase(x, y, z, ry = 0) { this.base.makeRotationY(ry); this.base.setPosition(x, y, z); this.hasBase = true; return this; }
  clearBase() { this.base.identity(); this.hasBase = false; return this; }
  add(prim, m, c, jit = 0.07, uvRect = null) {
    const M = this.hasBase ? _mB.multiplyMatrices(this.base, m) : m;
    _nm.getNormalMatrix(M);
    const p = prim.pos, nr = prim.nor, cnt = prim.count;
    this.grow(cnt);
    const j = 1 - jit / 2 + frand() * jit;
    const r = c.r * j, g = c.g * j, b = c.b * j;
    const e = M.elements, ne = _nm.elements;
    let o = this.n * 3;
    for (let i = 0; i < cnt; i++) {
      const x = p[i * 3], y = p[i * 3 + 1], z = p[i * 3 + 2];
      this.pos[o] = e[0] * x + e[4] * y + e[8] * z + e[12];
      this.pos[o + 1] = e[1] * x + e[5] * y + e[9] * z + e[13];
      this.pos[o + 2] = e[2] * x + e[6] * y + e[10] * z + e[14];
      const nx = nr[i * 3], ny = nr[i * 3 + 1], nz = nr[i * 3 + 2];
      let tx = ne[0] * nx + ne[3] * ny + ne[6] * nz, ty = ne[1] * nx + ne[4] * ny + ne[7] * nz, tz = ne[2] * nx + ne[5] * ny + ne[8] * nz;
      const l = Math.hypot(tx, ty, tz) || 1;
      this.nor[o] = tx / l; this.nor[o + 1] = ty / l; this.nor[o + 2] = tz / l;
      this.col[o] = r; this.col[o + 1] = g; this.col[o + 2] = b;
      if (this.uv) {
        const u0 = prim.uv ? prim.uv[i * 2] : 0, v0 = prim.uv ? prim.uv[i * 2 + 1] : 0;
        if (uvRect) { this.uv[this.n * 2 + i * 2] = uvRect[0] + u0 * uvRect[2]; this.uv[this.n * 2 + i * 2 + 1] = uvRect[1] + v0 * uvRect[3]; }
        else { this.uv[this.n * 2 + i * 2] = u0; this.uv[this.n * 2 + i * 2 + 1] = v0; }
      }
      o += 3;
    }
    this.n += cnt;
  }
  mat(x, y, z, sx, sy, sz, ry = 0, rx = 0, rz = 0) {
    _e1.set(rx, ry, rz, 'YXZ'); _q1.setFromEuler(_e1); _v1.set(x, y, z); _v2.set(sx, sy, sz);
    return _mA.compose(_v1, _q1, _v2);
  }
  // center-based box
  box(w, h, d, x, y, z, ry, c, rx = 0, rz = 0, jit) { this.add(PRIM.box, this.mat(x, y, z, w, h, d, ry || 0, rx, rz), c, jit); }
  // bottom-based box
  boxB(w, h, d, x, y, z, ry, c, jit) { this.add(PRIM.box, this.mat(x, y + h / 2, z, w, h, d, ry || 0), c, jit); }
  cyl(r, h, x, y, z, c, seg = 8, ry = 0, rx = 0, rz = 0) { this.add(PRIM['cyl' + seg] || PRIM.cyl8, this.mat(x, y + h / 2, z, r * 2, h, r * 2, ry, rx, rz), c); }
  cylC(r, h, x, y, z, c, seg = 8, ry = 0, rx = 0, rz = 0) { this.add(PRIM['cyl' + seg] || PRIM.cyl8, this.mat(x, y, z, r * 2, h, r * 2, ry, rx, rz), c); }
  cone(r, h, x, y, z, c, seg = 8, ry = 0) { this.add(PRIM['cone' + seg] || PRIM.cone8, this.mat(x, y + h / 2, z, r * 2, h, r * 2, ry), c); }
  sphere(r, x, y, z, c, prim = PRIM.ico1, sx = 1, sy = 1, sz = 1, ry = 0) { this.add(prim, this.mat(x, y, z, r * 2 * sx, r * 2 * sy, r * 2 * sz, ry), c); }
  prism(w, h, d, x, y, z, ry, c) { this.add(PRIM.prism, this.mat(x, y, z, w, h, d, ry || 0), c); }
  pyramid(w, h, d, x, y, z, ry, c) { this.add(PRIM.pyramid, this.mat(x, y + h / 2, z, w, h, d, ry || 0), c); }
  quad(w, h, x, y, z, ry, c, rx = 0, uvRect = null) { this.add(PRIM.quad, this.mat(x, y, z, w, h, 1, ry || 0, rx), c, 0, uvRect); }
  // cylinder between two points (for poles, spokes, branches)
  beam(ax, ay, az, bx, by, bz, r, c, prim = PRIM.cyl6) {
    const dx = bx - ax, dy = by - ay, dz = bz - az; const L = Math.hypot(dx, dy, dz) || 1e-4;
    _v3.set(dx / L, dy / L, dz / L); _q2.setFromUnitVectors(UP, _v3);
    _v1.set((ax + bx) / 2, (ay + by) / 2, (az + bz) / 2); _v2.set(r * 2, L, r * 2);
    this.add(prim, _mA.compose(_v1, _q2, _v2), c);
  }
  build() {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(this.pos.slice(0, this.n * 3), 3));
    g.setAttribute('normal', new THREE.BufferAttribute(this.nor.slice(0, this.n * 3), 3));
    g.setAttribute('color', new THREE.BufferAttribute(this.col.slice(0, this.n * 3), 3));
    if (this.uv) g.setAttribute('uv', new THREE.BufferAttribute(this.uv.slice(0, this.n * 2), 2));
    g.computeBoundingSphere();
    return g;
  }
}

// ---------------- chunk system (static world geometry) ----------------
const Chunks = {
  CH: isMobile ? 192 : 128, map: new Map(), meshes: [],
  key(x, z) { return Math.floor(x / this.CH) + ',' + Math.floor(z / this.CH); },
  get(x, z, bucket = 'std') {
    const k = this.key(x, z);
    let c = this.map.get(k);
    if (!c) { c = { k, cx: (Math.floor(x / this.CH) + 0.5) * this.CH, cz: (Math.floor(z / this.CH) + 0.5) * this.CH, b: {} }; this.map.set(k, c); }
    let b = c.b[bucket]; if (!b) b = c.b[bucket] = new GeoBuilder(bucket === 'sign' || bucket === 'decal');
    return b;
  },
  finalize() {
    for (const c of this.map.values()) {
      for (const bucket in c.b) {
        const b = c.b[bucket]; if (b.n === 0) continue;
        const mat = bucket === 'metal' ? MAT.metal : bucket === 'glow' ? MAT.glow : bucket === 'stdDS' ? MAT.stdDS : bucket === 'paint' ? MAT.paint : bucket === 'sign' ? Atlas.mat : bucket === 'decal' ? Atlas.decalMat : bucket === 'foliage' ? MAT.foliage : MAT.std;
        const m = new THREE.Mesh(b.build(), mat);
        m.castShadow = bucket !== 'glow' && bucket !== 'decal' && bucket !== 'sign';
        m.receiveShadow = bucket !== 'glow';
        m.userData.chunk = c;
        m.matrixAutoUpdate = false; m.updateMatrix();
        G.scene.add(m);
        this.meshes.push(m);
      }
      c.b = {};
    }
  },
  updateVisibility(camPos) {
    const D = G.preset.drawDist * (G.preset.lite ? 0.8 : 1) + (G.preset.lite ? 30 : 60);
    for (const m of this.meshes) {
      const c = m.userData.chunk; const d = Math.hypot(c.cx - camPos.x, c.cz - camPos.z) - this.CH * 0.7;
      m.visible = d < D;
    }
  },
};

// ---------------- sign / decal atlas ----------------
const Atlas = {
  W: 2048, H: 2048, SW: 512, SH: 128, n: 0, ctx: null, tex: null, mat: null,
  init() {
    const c = document.createElement('canvas'); c.width = this.W; c.height = this.H;
    this.ctx = c.getContext('2d'); this.canvas = c;
    this.ctx.fillStyle = '#777'; this.ctx.fillRect(0, 0, this.W, this.H);
    this.tex = new THREE.CanvasTexture(c); this.tex.colorSpace = THREE.SRGBColorSpace; this.tex.anisotropy = 4;
    this.mat = new THREE.MeshStandardMaterial({ map: this.tex, roughness: 0.62, metalness: 0, emissiveMap: this.tex, emissive: 0xffffff, emissiveIntensity: 0 });
    patchMaterial(this.mat, 'std', { key: 'sign', noWet: true });
    // decals (muggulu rangoli + light pools) atlas
    const d = document.createElement('canvas'); d.width = 1024; d.height = 256; this.dctx = d.getContext('2d');
    this.drawMuggulu();
    this.dtex = new THREE.CanvasTexture(d); this.dtex.colorSpace = THREE.SRGBColorSpace;
    this.decalMat = new THREE.MeshStandardMaterial({ map: this.dtex, transparent: true, depthWrite: false, roughness: 0.9, polygonOffset: true, polygonOffsetFactor: -4, polygonOffsetUnits: -8 });
  },
  slot() {
    const cols = this.W / this.SW; const i = this.n++;
    const sx = (i % cols) * this.SW, sy = Math.floor(i / cols) * this.SH;
    return { sx, sy, uv: [sx / this.W, 1 - (sy + this.SH) / this.H, this.SW / this.W, this.SH / this.H] };
  },
  // draws a bilingual sign into a new slot, returns uv rect
  sign(te, en, o = {}) {
    const s = this.slot(); const ctx = this.ctx; const W = this.SW, H = this.SH;
    ctx.save(); ctx.translate(s.sx, s.sy);
    ctx.fillStyle = o.bg || '#f4e7c4'; ctx.fillRect(0, 0, W, H);
    if (o.stripe) { ctx.fillStyle = o.stripe; ctx.fillRect(0, 0, W, 12); ctx.fillRect(0, H - 12, W, 12); }
    ctx.strokeStyle = o.border || '#6b1f16'; ctx.lineWidth = 8; ctx.strokeRect(4, 4, W - 8, H - 8);
    ctx.fillStyle = o.fg || '#6b1f16'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    const fitText = (txt, font, maxW, size) => { let sz = size; ctx.font = font.replace('#', sz); while (ctx.measureText(txt).width > maxW && sz > 10) { sz -= 2; ctx.font = font.replace('#', sz); } };
    if (en) {
      fitText(te, '700 #px "Baloo Tammudu 2", "Noto Sans Telugu", sans-serif', W - 40, 58); ctx.fillText(te, W / 2, H * 0.4);
      ctx.fillStyle = o.fg2 || o.fg || '#6b1f16';
      fitText(en.toUpperCase(), '600 #px "Hind Guntur", "Noto Sans Telugu", sans-serif', W - 60, 26); ctx.fillText(en.toUpperCase(), W / 2, H * 0.8);
    } else { fitText(te, '700 #px "Baloo Tammudu 2", "Noto Sans Telugu", sans-serif', W - 40, 70); ctx.fillText(te, W / 2, H * 0.54); }
    if (o.icon === 'plus') { ctx.fillStyle = '#2e8b57'; ctx.fillRect(16, 34, 60, 60); ctx.fillStyle = '#fff'; ctx.fillRect(38, 42, 16, 44); ctx.fillRect(24, 56, 44, 16); }
    ctx.restore();
    this.tex.needsUpdate = true;
    return s.uv;
  },
  // custom-drawn slot
  custom(draw) { const s = this.slot(); this.ctx.save(); this.ctx.translate(s.sx, s.sy); draw(this.ctx, this.SW, this.SH); this.ctx.restore(); this.tex.needsUpdate = true; return s.uv; },
  drawMuggulu() {
    const ctx = this.dctx; ctx.clearRect(0, 0, 1024, 256);
    for (let k = 0; k < 3; k++) {
      ctx.save(); ctx.translate(k * 256 + 128, 128);
      ctx.strokeStyle = 'rgba(250,248,240,0.95)'; ctx.fillStyle = 'rgba(250,248,240,0.95)'; ctx.lineWidth = 5;
      const n = 5 + k * 2; const sp = 170 / n;
      for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) { const x = (i - (n - 1) / 2) * sp, y = (j - (n - 1) / 2) * sp; if (Math.abs(x) + Math.abs(y) <= 90) { ctx.beginPath(); ctx.arc(x, y, 3, 0, TAU); ctx.fill(); } }
      for (let r = 20; r < 100; r += 22) { ctx.beginPath(); for (let a = 0; a <= TAU + 0.01; a += TAU / 64) { const rr = r + Math.sin(a * (4 + k * 2)) * 8; const x = Math.cos(a) * rr, y = Math.sin(a) * rr; if (a === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y); } ctx.stroke(); }
      const cols = ['#d6336c', '#f08c00', '#37b24d'];
      ctx.fillStyle = cols[k]; ctx.globalAlpha = 0.85;
      for (let a = 0; a < 8; a++) { ctx.beginPath(); ctx.ellipse(Math.cos(a * TAU / 8) * 40, Math.sin(a * TAU / 8) * 40, 12, 6, a * TAU / 8, 0, TAU); ctx.fill(); }
      ctx.restore();
    }
    // light pool (radial) in slot 3
    const g = ctx.createRadialGradient(896, 128, 0, 896, 128, 128);
    g.addColorStop(0, 'rgba(255,220,160,0.55)'); g.addColorStop(0.5, 'rgba(255,200,130,0.18)'); g.addColorStop(1, 'rgba(255,190,120,0)');
    ctx.fillStyle = g; ctx.fillRect(768, 0, 256, 256);
  },
  decalUV(k) { return [k * 0.25, 0, 0.25, 1]; },
};

// add a flat decal (muggulu) on the ground
function addDecal(x, z, size, k, ry = 0) {
  const b = Chunks.get(x, z, 'decal');
  const y = World.groundHeight(x, z) + 0.04;
  b.quad(size, size, x, y, z, ry, C('#ffffff'), -Math.PI / 2, Atlas.decalUV(k));
}
// add a sign board: quad with atlas uv, with a backing board
function addSign(x, y, z, ry, w, h, uv, board = '#3b2b22', posts = 0, postH = 0) {
  const s = Chunks.get(x, z, 'sign');
  const nx = Math.sin(ry), nz = Math.cos(ry);
  s.quad(w, h, x + nx * 0.07, y, z + nz * 0.07, ry, C('#ffffff'), 0, uv);
  const b = Chunks.get(x, z, 'std');
  b.box(w + 0.16, h + 0.16, 0.1, x, y, z, ry, C(board));
  if (posts) {
    const px = Math.cos(ry), pz = -Math.sin(ry);
    for (const sg of [-1, 1]) b.boxB(0.12, postH, 0.12, x + px * (w / 2 - 0.2) * sg, y - h / 2 - postH + 0.05, z + pz * (w / 2 - 0.2) * sg, ry, C('#4a4640'));
  }
}
