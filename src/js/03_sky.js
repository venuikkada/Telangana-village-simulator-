// ============================================================================
// Sky dome, sun/moon, day-night lighting, fog, environment lighting, lightning
// ============================================================================
const SKY_KEYS = [
  // elev, top, horizon, sun colour, sun intensity, hemi sky, hemi ground, hemi int, env int, exposure
  [-20, '#010308', '#050a18', '#000000', 0.0, '#3a4c80', '#22242c', 0.32, 0.38, 1.6],
  [-10, '#050b1f', '#18203f', '#000000', 0.0, '#3c4d7c', '#23242b', 0.34, 0.44, 1.48],
  [-4, '#18305c', '#5b4468', '#ff6a30', 0.0, '#3e4f7c', '#241a18', 0.22, 0.45, 1.25],
  [0, '#2a4c86', '#d9794c', '#ff7a3a', 0.35, '#6c7ca6', '#4a3024', 0.34, 0.6, 1.12],
  [5, '#3a66a8', '#f0a26a', '#ff9d58', 1.5, '#95a8cf', '#654532', 0.45, 0.75, 1.02],
  [12, '#3a74c4', '#f1c79c', '#ffc890', 2.3, '#a9bcdd', '#6d5038', 0.5, 0.85, 0.98],
  [25, '#2f78d6', '#a8d0f0', '#ffeedb', 2.9, '#b9cce8', '#806546', 0.55, 0.95, 1.0],
  [50, '#2470d8', '#b0d6f3', '#fff7ec', 3.25, '#c3d6ee', '#8a6c4c', 0.6, 1.0, 0.98],
  [90, '#1f69d2', '#b6daf4', '#ffffff', 3.4, '#c8daef', '#8a6c4c', 0.6, 1.0, 0.98],
].map((k) => ({ e: k[0], top: col(k[1]), hor: col(k[2]), sun: col(k[3]), si: k[4], hs: col(k[5]), hg: col(k[6]), hi: k[7], ei: k[8], ex: k[9] }));

const SKY_VS = /* glsl */`varying vec3 vDir; void main(){ vec4 wp = modelMatrix * vec4(position,1.0); vDir = wp.xyz - cameraPosition; gl_Position = projectionMatrix * viewMatrix * wp; gl_Position.z = gl_Position.w; }`;
const SKY_FS = (oct) => /* glsl */`
uniform vec3 uSunDir, uMoonDir, uTop, uHorizon, uGround, uSunCol, uCloudCol, uCloudDark;
uniform float uMoonPhase, uSunVis, uMoonVis, uStarVis, uCloudCover, uTime, uHaze, uFlash, uMoonBright;
uniform vec2 uCloudOff;
varying vec3 vDir;
float hash13(vec3 p3){ p3 = fract(p3*0.1031); p3 += dot(p3, p3.zyx+31.32); return fract((p3.x+p3.y)*p3.z); }
float h2(vec2 p){ p = fract(p*vec2(123.34, 456.21)); p += dot(p, p+45.32); return fract(p.x*p.y); }
float n2(vec2 p){ vec2 i=floor(p); vec2 f=fract(p); vec2 u=f*f*(3.0-2.0*f); return mix(mix(h2(i),h2(i+vec2(1.0,0.0)),u.x), mix(h2(i+vec2(0.0,1.0)),h2(i+vec2(1.0,1.0)),u.x), u.y); }
float fbm(vec2 p){ float s=0.0, a=0.5, t=0.0; for(int i=0;i<${oct};i++){ s+=a*n2(p); t+=a; p=p*2.07+vec2(19.1,7.3); a*=0.5; } return s/t; }
void main(){
  vec3 d = normalize(vDir);
  float y = d.y;
  float t = pow(clamp(y, 0.0, 1.0), 0.42);
  vec3 col = mix(uHorizon, uTop, t);
  col = mix(col, uGround, smoothstep(0.0, -0.12, y));
  float sd = max(dot(d, uSunDir), 0.0);
  float disc = smoothstep(0.99955, 0.99978, sd);
  col += uSunCol * (disc * 24.0 + pow(sd, 14.0) * 0.28 + pow(sd, 380.0) * 1.8) * uSunVis;
  col += uSunCol * pow(sd, 3.0) * 0.16 * (1.0 - t) * clamp(uSunVis + 0.3, 0.0, 1.0);
  if (uStarVis > 0.01 && y > 0.0) {
    vec3 sp = d * 380.0; vec3 cell = floor(sp); float r = hash13(cell);
    float star = 0.0;
    if (r > 0.9962) { vec3 f = fract(sp) - 0.5; float dd = length(f); float tw = 0.65 + 0.35 * sin(uTime * 2.7 + r * 311.0); star = smoothstep(0.32, 0.0, dd) * tw * ((r - 0.9962) / 0.0038 * 0.8 + 0.2); }
    float band = exp(-pow(dot(d, normalize(vec3(0.55, 0.25, 0.8))), 2.0) * 14.0);
    col += vec3(star) * uStarVis * smoothstep(0.02, 0.3, y) * 1.7;
    col += vec3(0.16, 0.18, 0.28) * band * fbm(d.xz * 9.0 + 2.0) * uStarVis * 0.35 * smoothstep(0.05, 0.4, y);
  }
  float md = dot(d, uMoonDir);
  const float MR = 0.99955;
  if (md > MR && uMoonVis > 0.01) {
    vec3 w = uMoonDir; vec3 u = normalize(cross(vec3(0.0, 1.0, 0.0), w)); vec3 v = cross(w, u);
    vec3 rel = d - w * md; float rad = sqrt(1.0 - MR * MR);
    float px = dot(rel, u) / rad, py = dot(rel, v) / rad;
    float rr = px * px + py * py;
    float pz = sqrt(max(0.0, 1.0 - rr));
    vec3 nrm = vec3(px, py, pz);
    float ph = uMoonPhase * 6.2831853;
    vec3 Lm = vec3(sin(ph), 0.0, -cos(ph));
    float lit = smoothstep(-0.06, 0.1, dot(nrm, Lm));
    float maria = 0.72 + 0.28 * n2(vec2(px, py) * 3.2 + 4.0);
    float edge = smoothstep(1.0, 0.9, sqrt(rr));
    col = mix(col, vec3(1.0, 0.97, 0.9) * maria * (lit * 1.5 + 0.035), edge * uMoonVis);
  }
  col += vec3(0.45, 0.52, 0.7) * pow(max(md, 0.0), 120.0) * 0.25 * uMoonVis * uMoonBright;
  if (y > 0.0) {
    float tt = 1200.0 / max(y, 0.035);
    vec2 cp = d.xz * tt * 0.00038 + uCloudOff * 0.5;
    float n = fbm(cp);
    float thr = 1.0 - uCloudCover;
    float dens = smoothstep(thr - 0.06, thr + 0.32, n);
    float ns = fbm(cp + uSunDir.xz * 0.045);
    float shade = clamp(0.6 + (n - ns) * 3.2, 0.0, 1.0);
    vec3 cc = mix(uCloudDark, uCloudCol, shade);
    cc += uSunCol * pow(sd, 5.0) * 0.55 * uSunVis * (1.0 - dens * 0.6);
    float fade = smoothstep(0.0, 0.16, y);
    col = mix(col, cc, dens * fade * 0.96);
  }
  col = mix(col, uHorizon, uHaze * (1.0 - smoothstep(0.0, 0.38, y)));
  col += vec3(0.7, 0.75, 1.0) * uFlash;
  gl_FragColor = vec4(col, 1.0);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}`;

const Sky = {
  sunDir: new THREE.Vector3(0, 1, 0), moonDir: new THREE.Vector3(0, -1, 0),
  sunElev: 30, moonElev: -10, moonPhase: 0.5, night: 0, daylight: 1,
  flash: 0, bloomMul: 1, envTimer: 0, lastEnvElev: -999, lastEnvCloud: -1,
  fogBase: 0.0018,
  init() {
    const uni = {
      uSunDir: { value: new THREE.Vector3(0, 1, 0) }, uMoonDir: { value: new THREE.Vector3(0, -1, 0) },
      uTop: { value: new THREE.Color() }, uHorizon: { value: new THREE.Color() }, uGround: { value: new THREE.Color('#3a3530') },
      uSunCol: { value: new THREE.Color() }, uCloudCol: { value: new THREE.Color('#ffffff') }, uCloudDark: { value: new THREE.Color('#9aa3b0') },
      uMoonPhase: { value: 0.5 }, uSunVis: { value: 1 }, uMoonVis: { value: 0 }, uStarVis: { value: 0 }, uCloudCover: U.uCloudCover,
      uTime: U.uTime, uHaze: { value: 0 }, uFlash: { value: 0 }, uMoonBright: { value: 1 }, uCloudOff: U.uCloudOff,
    };
    this.uni = uni;
    this.mat = new THREE.ShaderMaterial({ uniforms: uni, vertexShader: SKY_VS, fragmentShader: SKY_FS(G.preset ? G.preset.cloudOct : 4), side: THREE.BackSide, depthWrite: false, fog: false });
    this.mesh = new THREE.Mesh(new THREE.SphereGeometry(1000, 40, 20), this.mat);
    this.mesh.frustumCulled = false; this.mesh.renderOrder = -10;
    G.scene.add(this.mesh);
    // env capture scene
    this.envScene = new THREE.Scene();
    this.envMesh = new THREE.Mesh(this.mesh.geometry, this.mat);
    this.envScene.add(this.envMesh);
    this.pmrem = new THREE.PMREMGenerator(G.renderer);
    // lights
    const sun = new THREE.DirectionalLight(0xffffff, 3);
    sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048);
    sun.shadow.bias = -0.00025; sun.shadow.normalBias = 0.035;
    const sc = sun.shadow.camera; sc.near = 1; sc.far = 600;
    G.scene.add(sun); G.scene.add(sun.target);
    this.sun = sun;
    this.hemi = new THREE.HemisphereLight(0xc8daef, 0x7a6652, 0.6);
    G.scene.add(this.hemi);
    Bus.on('preset', (P) => this.onPreset(P));
    if (G.preset) this.onPreset(G.preset);
    // lightning bolt
    this.boltMat = new THREE.LineBasicMaterial({ color: 0xdfe6ff, transparent: true, opacity: 1, fog: false, depthWrite: false });
    this.bolt = new THREE.LineSegments(new THREE.BufferGeometry(), this.boltMat);
    this.bolt.visible = false; this.bolt.frustumCulled = false;
    G.scene.add(this.bolt);
  },
  onPreset(P) {
    this.sun.castShadow = P.shadows;
    const s = P.shadowSize;
    if (this.sun.shadow.mapSize.x !== s) {
      this.sun.shadow.mapSize.set(s, s);
      if (this.sun.shadow.map) { this.sun.shadow.map.dispose(); this.sun.shadow.map = null; }
    }
    const r = P.shadowRange;
    const c = this.sun.shadow.camera; c.left = -r; c.right = r; c.top = r; c.bottom = -r; c.updateProjectionMatrix();
    this.mat.fragmentShader = SKY_FS(P.cloudOct); this.mat.needsUpdate = true;
    if (!P.env) { G.scene.environment = null; if (this.envRT) { this.envRT.dispose(); this.envRT = null; } }
    this.lastEnvElev = -999;
  },
  sunDirection(hour, doy, out) {
    const lat = 17.9 * DEG;
    const decl = 23.44 * DEG * Math.sin(TAU * (284 + doy) / 365);
    const H = (hour - 12.2) * 15 * DEG;
    const sinAlt = Math.sin(lat) * Math.sin(decl) + Math.cos(lat) * Math.cos(decl) * Math.cos(H);
    const alt = Math.asin(clamp(sinAlt, -1, 1));
    const cosAz = (Math.sin(decl) - Math.sin(alt) * Math.sin(lat)) / Math.max(1e-4, Math.cos(alt) * Math.cos(lat));
    let az = Math.acos(clamp(cosAz, -1, 1));
    if (H > 0) az = TAU - az;
    out.set(Math.sin(az) * Math.cos(alt), Math.sin(alt), -Math.cos(az) * Math.cos(alt)).normalize();
    return alt / DEG;
  },
  keyAt(e) {
    const K = SKY_KEYS;
    if (e <= K[0].e) return [K[0], K[0], 0];
    for (let i = 0; i < K.length - 1; i++) if (e < K[i + 1].e) return [K[i], K[i + 1], (e - K[i].e) / (K[i + 1].e - K[i].e)];
    return [K[K.length - 1], K[K.length - 1], 0];
  },
  update(dt) {
    const S = G.S; if (!S) return;
    const W = Weather.cur; // interpolated weather params
    const hour = Time.hour(), doy = Time.doy();
    this.sunElev = this.sunDirection(hour, doy, this.sunDir);
    this.moonPhase = ((Time.dayFloat() / 8) + 0.5) % 1;
    this.moonElev = this.sunDirection(hour - this.moonPhase * 24.8, doy, this.moonDir);
    const [a, b, t] = this.keyAt(this.sunElev);
    const top = _c1.copy(a.top).lerp(b.top, t);
    const hor = _c2.copy(a.hor).lerp(b.hor, t);
    const u = this.uni;
    const cloud = W.cloud, rain = W.rain, haze = W.haze, fog = W.fog;
    const day = clamp01((this.sunElev + 6) / 14);
    this.daylight = day; this.night = 1 - clamp01((this.sunElev + 10) / 12);
    // overcast desaturation
    const grey = (0.62 * day + 0.03) * (1 - rain * 0.5);
    const greyTop = new THREE.Color(grey * 0.62, grey * 0.68, grey * 0.76);
    const greyHor = new THREE.Color(grey * 0.78, grey * 0.8, grey * 0.84);
    const oc = smoothstep(0.35, 1.0, cloud);
    top.lerp(greyTop, oc * 0.88);
    hor.lerp(greyHor, oc * 0.8);
    if (haze > 0) hor.lerp(new THREE.Color(0.78 * day + 0.05, 0.66 * day + 0.04, 0.46 * day + 0.03), haze * 0.55);
    if (fog > 0) { const fg = 0.55 * day + 0.04; hor.lerp(new THREE.Color(fg, fg * 1.02, fg * 1.06), fog * 0.75); top.lerp(new THREE.Color(fg * 0.9, fg * 0.95, fg), fog * 0.45); }
    u.uTop.value.copy(top); u.uHorizon.value.copy(hor);
    u.uGround.value.copy(hor).multiplyScalar(0.55);
    const sunCol = _c1.copy(a.sun).lerp(b.sun, t);
    u.uSunCol.value.copy(sunCol);
    u.uSunDir.value.copy(this.sunDir); u.uMoonDir.value.copy(this.moonDir);
    const sunVis = (1 - smoothstep(0.55, 0.97, cloud)) * (1 - fog * 0.6);
    u.uSunVis.value = sunVis * smoothstep(-3, 1, this.sunElev);
    const moonB = 0.25 + 0.75 * (1 - Math.abs(this.moonPhase - 0.5) * 2);
    u.uMoonBright.value = moonB;
    u.uMoonVis.value = smoothstep(-2, 4, this.moonElev) * (1 - smoothstep(0.6, 0.95, cloud)) * (0.35 + this.night * 0.65);
    u.uMoonPhase.value = this.moonPhase;
    u.uStarVis.value = this.night * (1 - smoothstep(0.35, 0.8, cloud)) * (1 - fog * 0.8);
    u.uHaze.value = clamp01(haze * 0.6 + fog * 0.7 + rain * 0.3);
    const cc = (0.95 * day + 0.06) * (1 - rain * 0.42);
    u.uCloudCol.value.setRGB(cc, cc * 0.99, cc * 0.97).lerp(sunCol, 0.12 * day);
    const cd = (0.5 - rain * 0.25) * day + 0.035;
    u.uCloudDark.value.setRGB(cd * 0.92, cd * 0.96, cd * 1.05);
    // cloud drift
    U.uCloudOff.value.x += W.windX * dt * 0.006 + dt * 0.0015;
    U.uCloudOff.value.y += W.windZ * dt * 0.006;
    U.uCloudCover.value = cloud;
    U.uCloudShadowStr.value = 0.55 * u.uSunVis.value * (1 - oc * 0.6);
    // flash decay
    if (this.flash > 0) this.flash = Math.max(0, this.flash - dt * 5);
    u.uFlash.value = this.flash * 0.6;
    // lights
    const sunUp = this.sunElev > -2;
    const sunI = lerp(a.si, b.si, t) * (1 - cloud * 0.72) * (1 - rain * 0.3) * (1 - fog * 0.4);
    const moonI = 0.6 * moonB * smoothstep(-2, 8, this.moonElev) * (1 - cloud * 0.75);
    const L = this.sun;
    if (sunUp && sunI > moonI) {
      L.color.copy(sunCol); L.intensity = sunI; this.lightDir = this.sunDir;
    } else {
      L.color.set('#9fb4e6'); L.intensity = moonI; this.lightDir = this.moonDir;
    }
    if (this.lightDir.y < 0.06) { this._ld = this._ld || new THREE.Vector3(); this._ld.copy(this.lightDir); this._ld.y = 0.06; this._ld.normalize(); this.lightDir = this._ld; }
    const hs = _c2.copy(a.hs).lerp(b.hs, t);
    this.hemi.color.copy(hs).lerp(greyTop, oc * 0.7);
    this.hemi.groundColor.copy(a.hg).lerp(b.hg, t);
    let hi = lerp(a.hi, b.hi, t) * (1 - rain * 0.25);
    if (!G.preset.env) hi *= 2.1;
    this.hemi.intensity = hi + this.flash * 3;
    G.scene.environmentIntensity = lerp(a.ei, b.ei, t) * (1 - rain * 0.3) + this.flash * 2;
    G.renderer.toneMappingExposure = lerp(a.ex, b.ex, t) * (1 + rain * 0.12 + oc * 0.06);
    // fog
    const f = G.scene.fog;
    f.color.copy(hor);
    if (World.skylineMat) World.skylineMat.uniforms.uHaze.value.copy(hor);
    const P = G.preset;
    const base = Math.max(1.7 / P.drawDist, 0.0011);
    f.density = base + fog * 0.011 * (hour < 10 ? 1 : 0.55) + rain * 0.0032 + haze * 0.0016 + cloud * 0.0004;
    // glow for windows / lamps at night
    U.uGlow.value = clamp01(this.night * 1.2 + (1 - day) * 0.3) * (0.85 + rain * 0.15);
    this.bloomMul = 0.8 + this.night * 0.6;
    // post grade tint
    if (P.post) {
      const tint = Render.post.comp.uniforms.uTint.value;
      const golden = smoothstep(18, 4, this.sunElev) * smoothstep(-4, 2, this.sunElev);
      tint.set(1 + golden * 0.05 + haze * 0.04, 1 + golden * 0.01, 1 - golden * 0.05 - haze * 0.05 + this.night * 0.06);
      Render.post.comp.uniforms.uSat.value = 1.14 - oc * 0.18 - this.night * 0.15;
      Render.post.comp.uniforms.uFlash.value = this.flash * 0.35;
    }
    // environment map refresh
    if (P.env) {
      this.envTimer -= dt;
      if (Math.abs(this.sunElev - this.lastEnvElev) > 2 || Math.abs(cloud - this.lastEnvCloud) > 0.1 || this.envTimer <= 0) {
        this.lastEnvElev = this.sunElev; this.lastEnvCloud = cloud; this.envTimer = 25;
        this.refreshEnv();
      }
    }
    this.bolt.visible = this.flash > 0.25;
  },
  refreshEnv() {
    const flash = this.uni.uFlash.value; this.uni.uFlash.value = 0;
    const old = this.envRT;
    this.envRT = this.pmrem.fromScene(this.envScene, 0, 1, 1100);
    G.scene.environment = this.envRT.texture;
    if (old) old.dispose();
    this.uni.uFlash.value = flash;
  },
  placeShadow(focus) {
    const L = this.sun; const d = this.lightDir || this.sunDir;
    const P = G.preset;
    const texel = (2 * P.shadowRange) / P.shadowSize;
    // snap focus in light space to reduce shimmering
    const z = _v1.copy(d).normalize();
    const x = _v2.crossVectors(UP, z); if (x.lengthSq() < 1e-6) x.set(1, 0, 0); x.normalize();
    const y = _v3.crossVectors(z, x);
    const fx = focus.dot(x), fy = focus.dot(y);
    const sx = Math.round(fx / texel) * texel - fx, sy = Math.round(fy / texel) * texel - fy;
    const fxx = focus.x + x.x * sx + y.x * sy, fyy = focus.y + x.y * sx + y.y * sy, fzz = focus.z + x.z * sx + y.z * sy;
    L.target.position.set(fxx, fyy, fzz);
    L.position.set(fxx + z.x * 260, fyy + z.y * 260, fzz + z.z * 260);
    L.target.updateMatrixWorld();
  },
  strike(nearPlayer = false) {
    const p = Player.pos();
    const a = frand() * TAU, r = nearPlayer ? 18 + frand() * 25 : 180 + frand() * 450;
    const x = p.x + Math.cos(a) * r, z = p.z + Math.sin(a) * r;
    const pts = [];
    let cx = x + (frand() - 0.5) * 60, cy = 420, cz = z + (frand() - 0.5) * 60;
    const gy = World.groundHeight ? World.groundHeight(x, z) : 0;
    const steps = 14;
    for (let i = 0; i < steps; i++) {
      const t = (i + 1) / steps;
      const nx = lerp(cx, x, 0.35) + (frand() - 0.5) * 28 * (1 - t), ny = lerp(420, gy, t), nz = lerp(cz, z, 0.35) + (frand() - 0.5) * 28 * (1 - t);
      pts.push(cx, cy, cz, nx, ny, nz);
      if (frand() < 0.3 && i < steps - 3) { pts.push(nx, ny, nz, nx + (frand() - 0.5) * 40, ny - 30 - frand() * 40, nz + (frand() - 0.5) * 40); }
      cx = nx; cy = ny; cz = nz;
    }
    this.bolt.geometry.dispose();
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3));
    this.bolt.geometry = g;
    this.flash = 1.0;
    const delay = Math.min(3.5, r / 343);
    setTimeout(() => Audio2.thunder(r), delay * 1000);
    return { x, z, r };
  },
};
