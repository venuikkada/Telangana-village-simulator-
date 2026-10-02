// ============================================================================
// Renderer, quality presets, shared shader patches, post-processing
// ============================================================================
const PRESETS = {
  LOW:       { id: 'LOW', lite: true, pr: 0.8, minPr: 0.55, maxPr: 1.1, shadows: false, shadowSize: 512, shadowRange: 40, post: false, bloom: 0, msaa: 0, drawDist: 330, grass: 0, trees: 0.4, cropDist: 100, cropDetail: 0, env: false, npc: 0.45, particles: 0.35, cloudOct: 2, rainDrops: 1500, fps: 30 },
  MEDIUM:    { id: 'MEDIUM', pr: 1.0, minPr: 0.6, maxPr: 1.25, shadows: true, shadowSize: 1024, shadowRange: 50, post: false, bloom: 0, msaa: 0, drawDist: 520, grass: 0.45, trees: 0.8, cropDist: 170, cropDetail: 1, env: true, npc: 0.8, particles: 0.75, cloudOct: 4, rainDrops: 4500, fps: 40 },
  HIGH:      { id: 'HIGH', pr: 1.25, minPr: 0.7, maxPr: 1.5, shadows: true, shadowSize: 2048, shadowRange: 70, post: true, bloom: 0.55, msaa: 4, drawDist: 720, grass: 0.8, trees: 1.0, cropDist: 250, cropDetail: 1, env: true, npc: 1.0, particles: 1.0, cloudOct: 5, rainDrops: 7000, fps: 50 },
  ULTRA:     { id: 'ULTRA', pr: 1.5, minPr: 0.8, maxPr: 2.0, shadows: true, shadowSize: 4096, shadowRange: 90, post: true, bloom: 0.65, msaa: 4, drawDist: 1000, grass: 1.0, trees: 1.0, cropDist: 380, cropDetail: 2, env: true, npc: 1.0, particles: 1.0, cloudOct: 5, rainDrops: 9000, fps: 55 },
  CINEMATIC: { id: 'CINEMATIC', pr: 2.0, minPr: 0.9, maxPr: 2.0, shadows: true, shadowSize: 4096, shadowRange: 100, post: true, bloom: 0.8, msaa: 4, drawDist: 1150, grass: 1.0, trees: 1.0, cropDist: 420, cropDetail: 2, env: true, npc: 1.0, particles: 1.0, cloudOct: 6, rainDrops: 10000, fps: 30, grain: 0.035, letterbox: true, cine: true },
};
const PRESET_ORDER = ['LOW', 'MEDIUM', 'HIGH', 'ULTRA', 'CINEMATIC'];

// Shared uniforms (same objects referenced by every patched material)
const U = {
  uTime: { value: 0 },
  uWind: { value: new THREE.Vector2(0.25, 0.08) },
  uWindStr: { value: 0.25 },
  uCloudCover: { value: 0.3 },
  uCloudOff: { value: new THREE.Vector2(0, 0) },
  uCloudShadowStr: { value: 0.45 },
  uWet: { value: 0 },
  uGreen: { value: 1 },
  uGlow: { value: 0 },
  uRain: { value: 0 },
  uSnowless: { value: 1 },
};

const GLSL_NOISE = /* glsl */`
uniform float uTime; uniform vec2 uWind; uniform float uWindStr; uniform float uCloudCover; uniform vec2 uCloudOff;
uniform float uCloudShadowStr; uniform float uWet; uniform float uGreen; uniform float uGlow; uniform float uRain;
float tvsHash(vec2 p){ p = fract(p*vec2(123.34, 456.21)); p += dot(p, p+45.32); return fract(p.x*p.y); }
float tvsNoise(vec2 p){ vec2 i=floor(p); vec2 f=fract(p); vec2 u=f*f*(3.0-2.0*f);
  float a=tvsHash(i), b=tvsHash(i+vec2(1.0,0.0)), c=tvsHash(i+vec2(0.0,1.0)), d=tvsHash(i+vec2(1.0,1.0));
  return mix(mix(a,b,u.x), mix(c,d,u.x), u.y); }
float tvsFbm3(vec2 p){ float s=0.0, a=0.5; for(int i=0;i<3;i++){ s+=a*tvsNoise(p); p=p*2.03+vec2(17.1,9.3); a*=0.5;} return s/0.875; }
float tvsCloudShadow(vec2 wp){
#ifdef TVS_LITE
  return 1.0;
#else
  float n = tvsFbm3(wp*0.0024 + uCloudOff);
  float thr = 1.0 - uCloudCover;
  float c = smoothstep(thr - 0.12, thr + 0.18, n);
  return 1.0 - c * uCloudShadowStr;
#endif
}
`;
const GLSL_WP = /* glsl */`
vec4 tvsWP4 = vec4(transformed, 1.0);
#ifdef USE_INSTANCING
  tvsWP4 = instanceMatrix * tvsWP4;
#endif
tvsWP4 = modelMatrix * tvsWP4;
vTvsW = tvsWP4.xyz;
`;

// generic patcher: kind = 'std' | 'terrain' | 'glow' | 'foliage' | 'grass'
// every patched material, so a quality change can rebuild their shaders
const PATCHED = [];
// plain shader materials that read TVS_LITE through their defines
const LITE_MATS = [];
function liteDefine(mat) { mat.defines = mat.defines || {}; if (G.lite) mat.defines.TVS_LITE = ''; LITE_MATS.push(mat); return mat; }
function patchMaterial(mat, kind, extra = {}) {
  PATCHED.push(mat);
  mat.onBeforeCompile = (sh) => {
    Object.assign(sh.uniforms, U);
    if (extra.uniforms) Object.assign(sh.uniforms, extra.uniforms);
    let vs = sh.vertexShader, fs = sh.fragmentShader;
    const lite = G.lite ? '#define TVS_LITE\n' : '';
    vs = vs.replace('#include <common>', '#include <common>\n' + lite + 'varying vec3 vTvsW;\n' + GLSL_NOISE + (extra.vsHead || ''));
    if (kind === 'foliage' || kind === 'grass') {
      vs = vs.replace('#include <begin_vertex>', `#include <begin_vertex>
        {
          vec3 ip = vec3(0.0);
          #ifdef USE_INSTANCING
            ip = instanceMatrix[3].xyz;
          #endif
          float hgt = ${kind === 'grass' ? 'clamp(position.y*2.4,0.0,1.0)' : 'smoothstep(1.8, 11.0, position.y)'};
          float ph = uTime*${kind === 'grass' ? '2.6' : '1.25'} + ip.x*0.37 + ip.z*0.29;
          float gust = 0.55 + 0.45*sin(uTime*0.63 + ip.x*0.021);
          float amp = hgt * (${kind === 'grass' ? '0.08 + uWindStr*0.28' : '0.05 + uWindStr*0.35'}) * gust;
          transformed.x += (sin(ph) * 0.6 + uWind.x * 1.4) * amp;
          transformed.z += (cos(ph*1.13) * 0.6 + uWind.y * 1.4) * amp;
        }`);
    }
    if (extra.vsBegin) vs = vs.replace('#include <begin_vertex>', '#include <begin_vertex>\n' + extra.vsBegin);
    vs = vs.replace('#include <worldpos_vertex>', '#include <worldpos_vertex>\n' + GLSL_WP);
    fs = fs.replace('#include <common>', '#include <common>\n' + lite + 'varying vec3 vTvsW;\n' + GLSL_NOISE + (extra.fsHead || ''));
    let colorCode = '#include <color_fragment>\nfloat tvsCS = tvsCloudShadow(vTvsW.xz);\n';
    if (kind === 'terrain') colorCode = TERRAIN_COLOR_GLSL;
    else if (kind === 'glow') colorCode = '#include <color_fragment>\nfloat tvsCS = 1.0;\nvec3 tvsGlowCol = diffuseColor.rgb;\ndiffuseColor.rgb = vec3(0.035,0.04,0.05) + tvsGlowCol*0.06;\n';
    else if (extra.color) colorCode = '#include <color_fragment>\nfloat tvsCS = tvsCloudShadow(vTvsW.xz);\n' + extra.color;
    if (kind !== 'terrain' && kind !== 'glow' && !extra.noWet) colorCode += '\ndiffuseColor.rgb *= mix(1.0, 0.74, uWet);\n';
    fs = fs.replace('#include <color_fragment>', colorCode);
    fs = fs.replace('getDirectionalLightInfo( directionalLight, directLight );', 'getDirectionalLightInfo( directionalLight, directLight );\n directLight.color *= tvsCS;');
    if (kind === 'glow') fs = fs.replace('#include <emissivemap_fragment>', '#include <emissivemap_fragment>\n totalEmissiveRadiance = tvsGlowCol * uGlow * 2.2;');
    if (kind !== 'glow') fs = fs.replace('#include <roughnessmap_fragment>', '#include <roughnessmap_fragment>\n' + (kind === 'terrain' ? 'roughnessFactor = tvsRough;' : 'roughnessFactor = mix(roughnessFactor, roughnessFactor*0.5, uWet);'));
    if (extra.fsEnd) fs = fs.replace('#include <dithering_fragment>', '#include <dithering_fragment>\n' + extra.fsEnd);
    sh.vertexShader = vs; sh.fragmentShader = fs;
    if (extra.onShader) extra.onShader(sh);
  };
  mat.customProgramCacheKey = () => 'tvs-' + kind + '-' + (extra.key || '') + (G.lite ? '-lite' : '');
  return mat;
}

// Terrain colour (vColor = vec4 weights: r grass, g redness, b rock, a dirt/village ground)
const TERRAIN_U = {
  cRed1: { value: col('#9a4a28') }, cRed2: { value: col('#b8653a') },
  cBlk1: { value: col('#2e2823') }, cBlk2: { value: col('#453b33') },
  cLush1: { value: col('#3f7d24') }, cLush2: { value: col('#73a83a') },
  cDry1: { value: col('#a99257') }, cDry2: { value: col('#c9b170') },
  cRock1: { value: col('#6f6a64') }, cRock2: { value: col('#9a948b') },
  cDirt1: { value: col('#ad7f52') }, cDirt2: { value: col('#c99d6c') },
};
const TERRAIN_HEAD = `
uniform vec3 cRed1, cRed2, cBlk1, cBlk2, cLush1, cLush2, cDry1, cDry2, cRock1, cRock2, cDirt1, cDirt2;
`;
const TERRAIN_COLOR_GLSL = /* glsl */`
vec4 tw = vColor;
vec2 tp = vTvsW.xz;
#ifdef TVS_LITE
float n1 = tvsNoise(tp*0.045), n2 = tvsNoise(tp*0.27+3.1);
float n3 = 0.35 + n2*0.3 + n1*0.1, n4 = n1;
#else
float n1 = tvsNoise(tp*0.045), n2 = tvsNoise(tp*0.27+3.1), n3 = tvsNoise(tp*1.9+7.7), n4 = tvsNoise(tp*0.011+1.3);
#endif
vec3 soil = mix(mix(cBlk1, cBlk2, n2), mix(cRed1, cRed2, n2), tw.g);
vec3 lush = mix(cLush1, cLush2, n1);
vec3 dry = mix(cDry1, cDry2, n1);
float greenLocal = clamp(uGreen + (n4-0.5)*0.5, 0.0, 1.0);
vec3 grass = mix(dry, lush, greenLocal);
float gAmt = clamp(tw.r + (n2-0.5)*0.55 + (n3-0.5)*0.25, 0.0, 1.0);
vec3 tcol = mix(soil, grass, smoothstep(0.25, 0.75, gAmt));
// village ground: dusty paths, with grassy patches between them in the green months
tcol = mix(tcol, mix(cDirt1, cDirt2, n2), clamp(tw.a*1.2 - (n3-0.5)*0.3 - smoothstep(0.5, 0.8, n1) * 0.75 * uGreen, 0.0, 1.0));
tcol = mix(tcol, mix(cRock1, cRock2, n3), clamp(tw.b, 0.0, 1.0));
tcol *= 0.86 + 0.28*n3;
float wet = uWet * (1.0 - tw.b*0.5);
#ifdef TVS_LITE
float pud = 0.0;
#else
float pud = smoothstep(0.58, 0.64, tvsNoise(tp*0.085 + 11.0)) * smoothstep(0.35, 0.9, uWet) * (0.25 + tw.a*0.75) * (1.0 - tw.r*0.6);
#endif
tcol *= mix(1.0, 0.56, wet);
tcol = mix(tcol, tcol*0.35 + vec3(0.02,0.025,0.03), pud);
diffuseColor.rgb = tcol;
float tvsRough = mix(0.96, 0.55, wet);
tvsRough = mix(tvsRough, 0.06, pud);
float tvsCS = tvsCloudShadow(tp);
`;

// ---------------------------------------------------------------------------
const MAT = {};
function buildMaterials() {
  MAT.std = patchMaterial(new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.88, metalness: 0 }), 'std');
  MAT.stdDS = patchMaterial(new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.85, metalness: 0, side: THREE.DoubleSide }), 'std', { key: 'ds' });
  MAT.metal = patchMaterial(new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.42, metalness: 0.55 }), 'std', { key: 'metal' });
  MAT.paint = patchMaterial(new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.38, metalness: 0.15 }), 'std', { key: 'paint' });
  MAT.glow = patchMaterial(new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.2, metalness: 0, emissive: 0xffffff }), 'glow');
  MAT.glass = new THREE.MeshStandardMaterial({ color: 0x1e2a33, roughness: 0.08, metalness: 0.3, transparent: true, opacity: 0.55 });
  MAT.foliage = patchMaterial(new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.82, metalness: 0 }), 'foliage');
  // wild flowers: white petals take each plant's colour, the green stem and yellow eye keep theirs
  MAT.flower = patchMaterial(new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.7, metalness: 0, side: THREE.DoubleSide }), 'grass', { key: 'flower', noWet: true, onShader: (sh) => {
    sh.vertexShader = sh.vertexShader.replace('#include <color_vertex>', `
      vColor = vec3(1.0);
      vColor *= color;
      #ifdef USE_INSTANCING_COLOR
        vColor = mix(vColor, vColor * instanceColor.xyz, step(0.9, min(color.r, min(color.g, color.b))));
      #endif`);
  } });
  MAT.foliageDS = patchMaterial(new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.8, metalness: 0, side: THREE.DoubleSide }), 'foliage', { key: 'ds' });
  MAT.grass = patchMaterial(new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.9, metalness: 0, side: THREE.DoubleSide }), 'grass', {
    color: 'diffuseColor.rgb *= mix(vec3(1.35,1.05,0.55), vec3(1.0), uGreen);',
  });
  MAT.terrain = patchMaterial(new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.95, metalness: 0 }), 'terrain', { uniforms: TERRAIN_U, fsHead: TERRAIN_HEAD });
  MAT.road = patchMaterial(new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.9, metalness: 0, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -4 }), 'std', { key: 'road',
    color: '#ifdef TVS_LITE\nfloat rn = tvsNoise(vTvsW.xz*0.2)*0.24;\n#else\nfloat rn = tvsNoise(vTvsW.xz*1.3)*0.18 + tvsNoise(vTvsW.xz*0.2)*0.12;\n#endif\ndiffuseColor.rgb *= 0.88 + rn;' });
  MAT.char = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.78, metalness: 0 });
  patchMaterial(MAT.char, 'std', { key: 'char', noWet: true });
  MAT.animal = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.9, metalness: 0 });
  patchMaterial(MAT.animal, 'std', { key: 'animal', noWet: true });
}

// ---------------------------------------------------------------------------
// Post processing: HDR scene RT -> bloom -> grade/tonemap composite
class PostFX {
  constructor(renderer) {
    this.r = renderer;
    this.cam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    this.quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2));
    this.quad.frustumCulled = false;
    this.fsScene = new THREE.Scene(); this.fsScene.add(this.quad);
    const vs = 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }';
    this.bright = new THREE.ShaderMaterial({
      uniforms: { tSrc: { value: null }, uTexel: { value: new THREE.Vector2() }, uThr: { value: 1.0 } },
      vertexShader: vs, toneMapped: false, depthTest: false, depthWrite: false,
      fragmentShader: `uniform sampler2D tSrc; uniform vec2 uTexel; uniform float uThr; varying vec2 vUv;
        void main(){ vec3 c = texture2D(tSrc, vUv + uTexel*vec2(-0.5,-0.5)).rgb + texture2D(tSrc, vUv + uTexel*vec2(0.5,-0.5)).rgb
          + texture2D(tSrc, vUv + uTexel*vec2(-0.5,0.5)).rgb + texture2D(tSrc, vUv + uTexel*vec2(0.5,0.5)).rgb; c *= 0.25;
          float l = max(max(c.r,c.g),c.b); float k = smoothstep(uThr, uThr*1.8+0.2, l); gl_FragColor = vec4(min(c*k, vec3(12.0)), 1.0); }`,
    });
    this.blur = new THREE.ShaderMaterial({
      uniforms: { tSrc: { value: null }, uDir: { value: new THREE.Vector2() } },
      vertexShader: vs, toneMapped: false, depthTest: false, depthWrite: false,
      fragmentShader: `uniform sampler2D tSrc; uniform vec2 uDir; varying vec2 vUv;
        void main(){ vec3 c = texture2D(tSrc, vUv).rgb*0.2270270270;
          c += texture2D(tSrc, vUv + uDir*1.3846153846).rgb*0.3162162162; c += texture2D(tSrc, vUv - uDir*1.3846153846).rgb*0.3162162162;
          c += texture2D(tSrc, vUv + uDir*3.2307692308).rgb*0.0702702703; c += texture2D(tSrc, vUv - uDir*3.2307692308).rgb*0.0702702703;
          gl_FragColor = vec4(c, 1.0); }`,
    });
    this.comp = new THREE.ShaderMaterial({
      uniforms: { tScene: { value: null }, tBloom: { value: null }, uBloom: { value: 0.5 }, uVig: { value: 0.35 }, uGrain: { value: 0 }, uTime: { value: 0 }, uSat: { value: 1.06 }, uContrast: { value: 1.04 }, uTint: { value: new THREE.Vector3(1, 1, 1) }, uRes: { value: new THREE.Vector2(1, 1) }, uFlash: { value: 0 } },
      vertexShader: vs, depthTest: false, depthWrite: false,
      fragmentShader: `uniform sampler2D tScene, tBloom; uniform float uBloom, uVig, uGrain, uTime, uSat, uContrast, uFlash; uniform vec3 uTint; uniform vec2 uRes; varying vec2 vUv;
        void main(){
          vec3 c = texture2D(tScene, vUv).rgb;
          c += texture2D(tBloom, vUv).rgb * uBloom;
          c *= uTint; c += uFlash;
          float l = dot(c, vec3(0.2126,0.7152,0.0722)); c = mix(vec3(l), c, uSat);
          gl_FragColor = vec4(c, 1.0);
          #include <tonemapping_fragment>
          #include <colorspace_fragment>
          vec3 d = gl_FragColor.rgb;
          d = (d - 0.5) * uContrast + 0.5;
          vec2 q = vUv - 0.5; q.x *= uRes.x/uRes.y*0.8; d *= 1.0 - dot(q,q)*uVig;
          float n = fract(sin(dot(floor(vUv*uRes) + fract(uTime)*97.0, vec2(12.9898,78.233)))*43758.5453);
          d += (n - 0.5) * uGrain;
          gl_FragColor = vec4(clamp(d, 0.0, 1.0), 1.0);
        }`,
    });
    this.w = 1; this.h = 1; this.samples = 0; this.rtScene = null;
    const gl = renderer.getContext();
    this.hdr = !!(renderer.extensions.has('EXT_color_buffer_float') || renderer.extensions.has('EXT_color_buffer_half_float'));
    this.isWebGL2 = typeof WebGL2RenderingContext !== 'undefined' && gl instanceof WebGL2RenderingContext;
  }
  setSize(w, h, samples) {
    if (w === this.w && h === this.h && samples === this.samples && this.rtScene) return;
    this.w = w; this.h = h; this.samples = samples;
    [this.rtScene, this.rtA, this.rtB, this.rtC].forEach((rt) => rt && rt.dispose());
    const type = this.hdr ? THREE.HalfFloatType : THREE.UnsignedByteType;
    this.rtScene = new THREE.WebGLRenderTarget(w, h, { type, samples: this.isWebGL2 ? samples : 0, depthBuffer: true });
    const hw = Math.max(2, w >> 1), hh = Math.max(2, h >> 1), qw = Math.max(2, w >> 2), qh = Math.max(2, h >> 2);
    this.rtA = new THREE.WebGLRenderTarget(hw, hh, { type, depthBuffer: false });
    this.rtB = new THREE.WebGLRenderTarget(qw, qh, { type, depthBuffer: false });
    this.rtC = new THREE.WebGLRenderTarget(qw, qh, { type, depthBuffer: false });
    this.bright.uniforms.uTexel.value.set(1 / w, 1 / h);
    this.comp.uniforms.uRes.value.set(w, h);
  }
  pass(mat, target) { this.quad.material = mat; this.r.setRenderTarget(target); this.r.render(this.fsScene, this.cam); }
  render(scene, camera, bloomAmt) {
    const r = this.r;
    r.setRenderTarget(this.rtScene);
    r.render(scene, camera);
    if (bloomAmt > 0) {
      this.bright.uniforms.tSrc.value = this.rtScene.texture; this.pass(this.bright, this.rtA);
      this.blur.uniforms.tSrc.value = this.rtA.texture; this.blur.uniforms.uDir.value.set(1 / this.rtA.width, 0); this.pass(this.blur, this.rtB);
      this.blur.uniforms.tSrc.value = this.rtB.texture; this.blur.uniforms.uDir.value.set(0, 1 / this.rtB.height); this.pass(this.blur, this.rtC);
      this.blur.uniforms.tSrc.value = this.rtC.texture; this.blur.uniforms.uDir.value.set(2 / this.rtC.width, 0); this.pass(this.blur, this.rtB);
      this.blur.uniforms.tSrc.value = this.rtB.texture; this.blur.uniforms.uDir.value.set(0, 2 / this.rtB.height); this.pass(this.blur, this.rtC);
    }
    this.comp.uniforms.tScene.value = this.rtScene.texture;
    this.comp.uniforms.tBloom.value = this.rtC.texture;
    this.comp.uniforms.uBloom.value = bloomAmt;
    this.pass(this.comp, null);
  }
}

// ---------------------------------------------------------------------------
const Render = {
  pr: 1, frameTimes: [], lastAdjust: 0, goodWindows: 0, post: null,
  init(canvas) {
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: !isMobile, powerPreference: 'high-performance', stencil: false });
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.0;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.shadowMap.autoUpdate = true;
    G.renderer = renderer;
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0xbfd2e2, 0.0018);
    G.scene = scene;
    const cam = new THREE.PerspectiveCamera(58, 1, 0.2, 3000);
    cam.position.set(0, 30, 60);
    G.camera = cam;
    this.post = new PostFX(renderer);
    window.addEventListener('resize', () => this.resize());
    this.resize();
  },
  applyPreset(id) {
    const P = PRESETS[id] || PRESETS.MEDIUM;
    const prev = G.preset;
    G.preset = P;
    this.pr = clamp(P.pr, P.minPr, P.maxPr);
    const r = G.renderer;
    const shadowChanged = !prev || prev.shadows !== P.shadows;
    const liteChanged = !!G.lite !== !!P.lite;
    G.lite = !!P.lite;
    r.shadowMap.enabled = P.shadows;
    if ((shadowChanged || liteChanged) && G.scene) G.scene.traverse((o) => { if (o.material) { (Array.isArray(o.material) ? o.material : [o.material]).forEach((m) => (m.needsUpdate = true)); } });
    if (liteChanged) {
      for (const m of PATCHED) m.needsUpdate = true;
      for (const m of LITE_MATS) { if (G.lite) m.defines.TVS_LITE = ''; else delete m.defines.TVS_LITE; m.needsUpdate = true; }
    }
    if (prev && (shadowChanged || liteChanged)) this.warm();
    // nothing past the fog is visible, so clip it early (also sharpens depth precision on phones)
    if (G.camera) { G.camera.far = Math.max(520, P.drawDist * 1.75); G.camera.updateProjectionMatrix(); }
    Bus.emit('preset', P);
    this.resize();
  },
  resize() {
    const r = G.renderer; if (!r) return;
    const w = Math.max(1, window.innerWidth), h = Math.max(1, window.innerHeight);
    r.setPixelRatio(this.pr);
    r.setSize(w, h, false);
    r.domElement.style.width = w + 'px'; r.domElement.style.height = h + 'px';
    G.camera.aspect = w / h; G.camera.updateProjectionMatrix();
    const P = G.preset;
    if (P && P.post) this.post.setSize(Math.floor(w * this.pr), Math.floor(h * this.pr), P.msaa);
  },
  // dynamic resolution
  track(dtMs) {
    const P = G.preset; if (!P || !G.started) return;
    this.frameTimes.push(dtMs);
    const now = performance.now();
    if (now - this.lastAdjust < 1500) return;
    if (this.frameTimes.length < 20) return;
    const arr = this.frameTimes; this.frameTimes = [];
    arr.sort((a, b) => a - b);
    const med = arr[Math.floor(arr.length * 0.6)];
    // steady ~33 ms frames on a 60 FPS target: the screen is running at 30 Hz, not the GPU struggling
    if (Loop.capFps === 60 && arr[Math.floor(arr.length * 0.2)] > 29 && med < 37) { this.lastAdjust = now; return; }
    const target = 1000 / (Loop.capFps || P.fps);
    this.lastAdjust = now;
    if (med > target * 1.3 && this.pr > P.minPr + 0.001) { this.pr = Math.max(P.minPr, this.pr - 0.1); this.goodWindows = 0; this.resize(); }
    else if (med < target * 1.02) { this.goodWindows++; if (this.goodWindows >= 3 && this.pr < P.maxPr - 0.001) { this.pr = Math.min(P.maxPr, this.pr + 0.05); this.goodWindows = 0; this.resize(); } }
    else this.goodWindows = 0;
  },
  // compile every shader up front so the first look at a new object does not stall a frame
  warm() {
    if (!G.renderer || !G.scene || !G.camera) return;
    try { G.renderer.compile(G.scene, G.camera); } catch (e) { /* older drivers: compile lazily */ }
  },
  render() {
    const P = G.preset;
    const r = G.renderer;
    if (P.post) {
      const c = this.post.comp.uniforms;
      c.uTime.value = G.t; c.uGrain.value = P.grain || 0.0;
      c.uVig.value = P.cine ? 0.55 : 0.32;
      this.post.render(G.scene, G.camera, P.bloom * (Sky.bloomMul || 1));
    } else {
      r.setRenderTarget(null);
      r.render(G.scene, G.camera);
    }
  },
};
