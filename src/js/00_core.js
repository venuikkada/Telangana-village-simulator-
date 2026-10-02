// ============================================================================
// TELANGANA VILLAGE SIMULATOR — core utilities
// ============================================================================
import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.170.0/build/three.module.min.js';

const TAU = Math.PI * 2;
const DEG = Math.PI / 180;
const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
const clamp01 = (v) => (v < 0 ? 0 : v > 1 ? 1 : v);
const lerp = (a, b, t) => a + (b - a) * t;
const invLerp = (a, b, v) => (b === a ? 0 : (v - a) / (b - a));
const smoothstep = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
const damp = (a, b, lambda, dt) => lerp(a, b, 1 - Math.exp(-lambda * dt));
const sq = (x) => x * x;
function angleDiff(a, b) { let d = (b - a) % TAU; if (d > Math.PI) d -= TAU; if (d < -Math.PI) d += TAU; return d; }
function dampAngle(a, b, lambda, dt) { return a + angleDiff(a, b) * (1 - Math.exp(-lambda * dt)); }
const dist2 = (ax, az, bx, bz) => Math.hypot(ax - bx, az - bz);
const isMobile = (() => { try { return matchMedia('(pointer: coarse)').matches || /Android|iPhone|iPad|Mobile/i.test(navigator.userAgent); } catch (e) { return false; } })();

// ---------- seeded random ----------
function mulberry32(a) {
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
let RNG = mulberry32(20261001);
const rnd = () => RNG();
const rrange = (a, b) => a + (b - a) * RNG();
const rint = (a, b) => Math.floor(a + (b - a + 1) * RNG());
const pick = (arr) => arr[Math.floor(RNG() * arr.length)];
const chance = (p) => RNG() < p;
function hash2(x, z) {
  let h = (Math.imul(x | 0, 374761393) + Math.imul(z | 0, 668265263)) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}
function hashStr(s) { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return (h >>> 0) / 4294967296; }
// free (non-seeded) random for runtime variety
const frand = Math.random;

// ---------- 2D simplex noise (seeded) ----------
class Noise2 {
  constructor(seed = 1) {
    const r = mulberry32(seed);
    const p = new Uint8Array(256);
    for (let i = 0; i < 256; i++) p[i] = i;
    for (let i = 255; i > 0; i--) { const j = Math.floor(r() * (i + 1)); const t = p[i]; p[i] = p[j]; p[j] = t; }
    this.perm = new Uint8Array(512);
    for (let i = 0; i < 512; i++) this.perm[i] = p[i & 255];
  }
  noise(xin, yin) {
    const F2 = 0.36602540378, G2 = 0.21132486540;
    const grad = Noise2.G;
    const perm = this.perm;
    const s = (xin + yin) * F2;
    const i = Math.floor(xin + s), j = Math.floor(yin + s);
    const t = (i + j) * G2;
    const x0 = xin - (i - t), y0 = yin - (j - t);
    const i1 = x0 > y0 ? 1 : 0, j1 = x0 > y0 ? 0 : 1;
    const x1 = x0 - i1 + G2, y1 = y0 - j1 + G2;
    const x2 = x0 - 1 + 2 * G2, y2 = y0 - 1 + 2 * G2;
    const ii = i & 255, jj = j & 255;
    let n0 = 0, n1 = 0, n2 = 0;
    let t0 = 0.5 - x0 * x0 - y0 * y0;
    if (t0 > 0) { const g = (perm[ii + perm[jj]] % 8) * 2; t0 *= t0; n0 = t0 * t0 * (grad[g] * x0 + grad[g + 1] * y0); }
    let t1 = 0.5 - x1 * x1 - y1 * y1;
    if (t1 > 0) { const g = (perm[ii + i1 + perm[jj + j1]] % 8) * 2; t1 *= t1; n1 = t1 * t1 * (grad[g] * x1 + grad[g + 1] * y1); }
    let t2 = 0.5 - x2 * x2 - y2 * y2;
    if (t2 > 0) { const g = (perm[ii + 1 + perm[jj + 1]] % 8) * 2; t2 *= t2; n2 = t2 * t2 * (grad[g] * x2 + grad[g + 1] * y2); }
    return 70 * (n0 + n1 + n2);
  }
  fbm(x, y, oct = 4) {
    let a = 0.5, f = 1, s = 0, n = 0;
    for (let i = 0; i < oct; i++) { s += a * this.noise(x * f, y * f); n += a; a *= 0.5; f *= 2.03; }
    return s / n;
  }
}
Noise2.G = new Float32Array([1, 1, -1, 1, 1, -1, -1, -1, 1, 0, -1, 0, 0, 1, 0, -1]);
const NZ = new Noise2(7);
const NZ2 = new Noise2(911);

// ---------- language ----------
// Every sentence is written L('English', 'Telugu'). Other languages come from i18n/<code>.json,
// loaded when picked: a sentence with values, L(`Day ${n}`...), is turned by the build into
// L(en, te, 'Day {0}', [n]) so the translation can put the values where its grammar wants them.
let LANG = 'en';
const LANGS = [
  { id: 'en', name: 'English', en: 'English' },
  { id: 'hi', name: 'हिन्दी', en: 'Hindi', disp: 'Baloo 2', body: 'Hind' },
  { id: 'bn', name: 'বাংলা', en: 'Bengali', disp: 'Baloo Da 2', body: 'Hind Siliguri' },
  { id: 'mr', name: 'मराठी', en: 'Marathi', disp: 'Baloo 2', body: 'Hind' },
  { id: 'te', name: 'తెలుగు', en: 'Telugu' },
  { id: 'ta', name: 'தமிழ்', en: 'Tamil', disp: 'Baloo Thambi 2', body: 'Hind Madurai' },
  { id: 'kn', name: 'ಕನ್ನಡ', en: 'Kannada', disp: 'Baloo Tamma 2', body: 'Hind Mysuru' },
];
const I18N = { dict: null, lang: 'en', cache: {} };
const TR = (en) => { const d = I18N.dict; const t = d && d[en]; return t || en; };
const LT = (key, args, en) => {
  const d = I18N.dict; const t = d && d[key]; if (!t) return en;
  return t.replace(/\{(\d+)\}/g, (m, i) => { const v = args[+i]; return v && typeof v === 'object' ? LN(v) : v === undefined || v === null ? '' : String(v); });
};
const L = (en, te, key, args) => (LANG === 'en' ? en : LANG === 'te' ? (te || en) : key !== undefined ? LT(key, args, en) : TR(en));
const LN = (o) => {
  if (!o) return '';
  if (LANG === 'en') return o.en;
  if (LANG === 'te') return o.te || o.en;
  return o[LANG] || (o._k !== undefined ? LT(o._k, o._a, o.en) : TR(o.en));
};
// first letter of a name, whole (Indic letters are often two or three code points)
function firstGrapheme(s) {
  s = String(s || '');
  try { if (typeof Intl !== 'undefined' && Intl.Segmenter) { const it = new Intl.Segmenter(undefined, { granularity: 'grapheme' }).segment(s)[Symbol.iterator]().next(); if (!it.done) return it.value.segment; } } catch (e) { /* old browsers */ }
  return Array.from(s).slice(0, LANG === 'en' ? 1 : 2).join('');
}

// ---------- money / number formatting (Indian system) ----------
function fmtINR(n, sym = true) {
  const neg = n < 0; n = Math.round(Math.abs(n));
  const s = String(n);
  let last3 = s.slice(-3); let rest = s.slice(0, -3);
  if (rest) last3 = ',' + last3;
  rest = rest.replace(/\B(?=(\d{2})+(?!\d))/g, ',');
  return (neg ? '-' : '') + (sym ? '₹' : '') + rest + last3;
}
function fmtShortINR(n) {
  const a = Math.abs(n), sg = n < 0 ? '-' : '';
  if (a >= 1e7) return sg + '₹' + (a / 1e7).toFixed(a >= 1e8 ? 1 : 2).replace(/\.0+$/, '') + L(' Cr', ' కోట్లు');
  if (a >= 1e5) return sg + '₹' + (a / 1e5).toFixed(a >= 1e6 ? 1 : 2).replace(/\.0+$/, '') + L(' L', ' లక్షలు');
  return fmtINR(n);
}
const fmt1 = (n) => (Math.round(n * 10) / 10).toFixed(1);
const pct = (n) => Math.round(n) + '%';

// ---------- event bus ----------
const Bus = {
  h: {},
  on(e, f) { (this.h[e] || (this.h[e] = [])).push(f); return f; },
  off(e, f) { const a = this.h[e]; if (a) { const i = a.indexOf(f); if (i >= 0) a.splice(i, 1); } },
  emit(e, p) { const a = this.h[e]; if (a) for (let i = 0; i < a.length; i++) { try { a[i](p); } catch (err) { console.error('bus', e, err); } } },
};

// ---------- DOM helpers ----------
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
function h(tag, attrs, ...kids) {
  const el = document.createElement(tag);
  if (attrs) for (const k in attrs) {
    const v = attrs[k];
    if (v === undefined || v === null || v === false) continue;
    if (k === 'class') el.className = v;
    else if (k === 'style' && typeof v === 'object') Object.assign(el.style, v);
    else if (k.startsWith('on') && typeof v === 'function') el.addEventListener(k.slice(2), v);
    else if (k === 'text') el.textContent = v;
    else if (k === 'html') el.innerHTML = v;
    else el.setAttribute(k, v === true ? '' : v);
  }
  for (const kid of kids.flat()) {
    if (kid === null || kid === undefined || kid === false) continue;
    el.appendChild(typeof kid === 'string' || typeof kid === 'number' ? document.createTextNode(String(kid)) : kid);
  }
  return el;
}
const nextFrame = () => new Promise((r) => requestAnimationFrame(() => r()));
const sleepMs = (ms) => new Promise((r) => setTimeout(r, ms));

// ---------- safe storage ----------
const Store = {
  get(k, d = null) { try { const v = localStorage.getItem(k); return v === null ? d : JSON.parse(v); } catch (e) { return d; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); return true; } catch (e) { return false; } },
  del(k) { try { localStorage.removeItem(k); } catch (e) { /* ignore */ } },
};

// ---------- shared temp math objects ----------
const _v1 = new THREE.Vector3(), _v2 = new THREE.Vector3(), _v3 = new THREE.Vector3();
const _q1 = new THREE.Quaternion(), _q2 = new THREE.Quaternion();
const _m1 = new THREE.Matrix4(), _m2 = new THREE.Matrix4(), _m3 = new THREE.Matrix4();
const _e1 = new THREE.Euler();
const _c1 = new THREE.Color(), _c2 = new THREE.Color();
const UP = new THREE.Vector3(0, 1, 0);
const col = (hex) => new THREE.Color(hex);

// global game object (systems attach here)
const G = {
  ready: false, started: false, paused: true, t: 0, dt: 0, frame: 0,
  S: null,             // serializable state
  scene: null, camera: null, renderer: null,
  preset: null,
};
window.__tvs = G; // debug handle
