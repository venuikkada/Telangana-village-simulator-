// ============================================================================
// Audio: synthesized ambience, spatial one-shots, engines, generative raga music
// ============================================================================
const RAGAS = {
  morning: { name: 'Mohanam', notes: [0, 2, 4, 7, 9] },
  noon: { name: 'Madhyamavati', notes: [0, 2, 5, 7, 10] },
  evening: { name: 'Hamsadhwani', notes: [0, 2, 4, 7, 11] },
  night: { name: 'Hindolam', notes: [0, 3, 5, 8, 10] },
};
const Audio2 = {
  ctx: null, ok: false, active: 0, birdT: 2, dogT: 8, cowT: 6, bellDone: {}, engType: null, nextBeat: 0, beatIdx: 0, phraseQ: [], droneT: 0, melT: 0, lastNote: 0,
  unlock() {
    if (this.ctx) { if (this.ctx.state !== 'running' && this.ctx.state !== 'closed') this.ctx.resume().catch(() => {}); return; }
    try {
      const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return;
      this.ctx = new AC();
    } catch (e) { return; }
    const c = this.ctx;
    this.master = c.createGain(); this.comp = c.createDynamicsCompressor(); this.comp.threshold.value = -14; this.comp.ratio.value = 3;
    this.master.connect(this.comp); this.comp.connect(c.destination);
    this.musicBus = c.createGain(); this.ambBus = c.createGain(); this.sfxBus = c.createGain();
    this.musicBus.connect(this.master); this.ambBus.connect(this.master); this.sfxBus.connect(this.master);
    // reverb-ish send for music
    this.verb = c.createConvolver(); this.verb.buffer = this.makeIR(2.2); const vg = c.createGain(); vg.gain.value = 0.35; this.verb.connect(vg); vg.connect(this.master);
    this.noise = this.makeNoise(2);
    this.buildAmbience();
    this.applyVolumes();
    this.ok = true;
    this.nextBeat = c.currentTime + 0.3;
  },
  makeNoise(sec) { const c = this.ctx; const b = c.createBuffer(1, c.sampleRate * sec, c.sampleRate); const d = b.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1; return b; },
  makeIR(sec) { const c = this.ctx; const n = c.sampleRate * sec; const b = c.createBuffer(2, n, c.sampleRate); for (let ch = 0; ch < 2; ch++) { const d = b.getChannelData(ch); for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / n, 3); } return b; },
  applyVolumes() {
    if (!this.ctx) return; const v = Settings.v;
    this.master.gain.value = v.vol; this.musicBus.gain.value = v.music * 0.5; this.ambBus.gain.value = v.amb; this.sfxBus.gain.value = v.sfx;
  },
  noiseSrc(loop = true) { const s = this.ctx.createBufferSource(); s.buffer = this.noise; s.loop = loop; return s; },
  buildAmbience() {
    const c = this.ctx;
    // wind
    const wn = this.noiseSrc(); const wf = c.createBiquadFilter(); wf.type = 'bandpass'; wf.frequency.value = 420; wf.Q.value = 0.5; const wg = c.createGain(); wg.gain.value = 0;
    wn.connect(wf); wf.connect(wg); wg.connect(this.ambBus); wn.start(); this.windG = wg; this.windF = wf;
    // rain hiss + roof rumble
    const rn = this.noiseSrc(); const rh = c.createBiquadFilter(); rh.type = 'highpass'; rh.frequency.value = 900; const rl = c.createBiquadFilter(); rl.type = 'lowpass'; rl.frequency.value = 7000; const rg = c.createGain(); rg.gain.value = 0;
    rn.connect(rh); rh.connect(rl); rl.connect(rg); rg.connect(this.ambBus); rn.start(); this.rainG = rg;
    const rr = this.noiseSrc(); const rrl = c.createBiquadFilter(); rrl.type = 'lowpass'; rrl.frequency.value = 380; const rrg = c.createGain(); rrg.gain.value = 0;
    rr.connect(rrl); rrl.connect(rrg); rrg.connect(this.ambBus); rr.start(); this.rumbleG = rrg;
    // crickets: AM-modulated high sines
    const cg = c.createGain(); cg.gain.value = 0; cg.connect(this.ambBus); this.crickG = cg;
    for (const f of [4300, 4710, 5180]) {
      const o = c.createOscillator(); o.frequency.value = f; const am = c.createGain(); am.gain.value = 0;
      const lfo = c.createOscillator(); lfo.type = 'square'; lfo.frequency.value = 22 + Math.random() * 8; const lg = c.createGain(); lg.gain.value = 0.02;
      const slow = c.createOscillator(); slow.frequency.value = 0.6 + Math.random() * 0.8; const sg = c.createGain(); sg.gain.value = 0.015;
      lfo.connect(lg); lg.connect(am.gain); slow.connect(sg); sg.connect(am.gain);
      o.connect(am); am.connect(cg); o.start(); lfo.start(); slow.start();
    }
    // positional murmur (tea stall / santha / yard)
    const mn = this.noiseSrc(); const mf = c.createBiquadFilter(); mf.type = 'bandpass'; mf.frequency.value = 650; mf.Q.value = 1.2; const mg = c.createGain(); mg.gain.value = 0;
    this.murmurP = this.panner(); mn.connect(mf); mf.connect(mg); mg.connect(this.murmurP); this.murmurP.connect(this.ambBus); mn.start(); this.murmurG = mg; this.murmurF = mf;
    // pump hum
    const po = c.createOscillator(); po.type = 'sawtooth'; po.frequency.value = 50; const pf = c.createBiquadFilter(); pf.type = 'lowpass'; pf.frequency.value = 300; const pg = c.createGain(); pg.gain.value = 0;
    const pn = this.noiseSrc(); const pnf = c.createBiquadFilter(); pnf.type = 'bandpass'; pnf.frequency.value = 900; pnf.Q.value = 2; const png = c.createGain(); png.gain.value = 0.6;
    this.pumpP = this.panner(); po.connect(pf); pf.connect(pg); pn.connect(pnf); pnf.connect(png); png.connect(pg); pg.connect(this.pumpP); this.pumpP.connect(this.ambBus); po.start(); pn.start(); this.pumpG = pg;
    // engine voice (reused)
    const e1 = c.createOscillator(); e1.type = 'sawtooth'; const e2 = c.createOscillator(); e2.type = 'sawtooth'; const e3 = c.createOscillator(); e3.type = 'square';
    const ef = c.createBiquadFilter(); ef.type = 'lowpass'; ef.frequency.value = 600; ef.Q.value = 2; const eg = c.createGain(); eg.gain.value = 0;
    const en = this.noiseSrc(); const enf = c.createBiquadFilter(); enf.type = 'bandpass'; enf.frequency.value = 1500; const eng = c.createGain(); eng.gain.value = 0.05;
    e1.connect(ef); e2.connect(ef); const e3g = c.createGain(); e3g.gain.value = 0.5; e3.connect(e3g); e3g.connect(ef); en.connect(enf); enf.connect(eng); eng.connect(ef);
    ef.connect(eg); eg.connect(this.sfxBus); e1.start(); e2.start(); e3.start(); en.start();
    this.eng = { e1, e2, e3, ef, eg };
  },
  panner() {
    const p = this.ctx.createPanner(); p.panningModel = G.preset && (G.preset.id === 'ULTRA' || G.preset.id === 'CINEMATIC') && !isMobile ? 'HRTF' : 'equalpower';
    p.distanceModel = 'inverse'; p.refDistance = 6; p.maxDistance = 400; p.rolloffFactor = 1.15; return p;
  },
  setPos(p, x, y, z) { if (p.positionX) { p.positionX.value = x; p.positionY.value = y; p.positionZ.value = z; } else p.setPosition(x, y, z); },
  env(g, t, a, peak, d) { g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(peak, t + a); g.gain.exponentialRampToValueAtTime(0.0001, t + a + d); },
  // ---------- one-shots ----------
  tone(type, f0, f1, dur, vol, dest, t = 0) {
    const c = this.ctx; const now = c.currentTime + t;
    const o = c.createOscillator(); o.type = type; o.frequency.setValueAtTime(f0, now); if (f1 !== f0) o.frequency.exponentialRampToValueAtTime(f1, now + dur);
    const g = c.createGain(); this.env(g, now, 0.008, vol, dur); o.connect(g); g.connect(dest); o.start(now); o.stop(now + dur + 0.05);
    return o;
  },
  burst(dur, vol, ftype, freq, dest, t = 0, q = 1) {
    const c = this.ctx; const now = c.currentTime + t;
    const s = this.noiseSrc(false); const f = c.createBiquadFilter(); f.type = ftype; f.frequency.value = freq; f.Q.value = q;
    const g = c.createGain(); this.env(g, now, 0.005, vol, dur); s.connect(f); f.connect(g); g.connect(dest); s.start(now, Math.random()); s.stop(now + dur + 0.05);
  },
  sfx(name) {
    if (!this.ok) return; const d = this.sfxBus; const c = this.ctx;
    switch (name) {
      case 'click': this.tone('sine', 1400, 1100, 0.04, 0.12, d); break;
      case 'switch': this.tone('square', 220, 180, 0.05, 0.08, d); this.burst(0.08, 0.1, 'highpass', 3000, d); break;
      case 'cash': this.burst(0.08, 0.25, 'bandpass', 3000, d); this.tone('triangle', 2093, 2093, 0.35, 0.18, d, 0.05); this.tone('triangle', 2637, 2637, 0.4, 0.15, d, 0.12); break;
      case 'mission': [523, 659, 784, 880, 1047].forEach((f, i) => this.tone('triangle', f, f, 0.28, 0.16, d, i * 0.09)); break;
      case 'fanfare': [392, 523, 659, 784].forEach((f, i) => this.tone('sawtooth', f, f, 0.35, 0.07, d, i * 0.12)); [523, 659, 784].forEach((f) => this.tone('triangle', f, f, 1.2, 0.08, d, 0.5)); break;
      case 'alert': this.tone('square', 880, 880, 0.12, 0.08, d); this.tone('square', 660, 660, 0.16, 0.08, d, 0.15); break;
      case 'error': this.tone('sawtooth', 140, 120, 0.25, 0.1, d); break;
      case 'ready': [784, 988, 1175].forEach((f, i) => this.tone('sine', f, f, 0.6, 0.12, d, i * 0.12)); break;
      case 'pump': this.burst(0.6, 0.15, 'bandpass', 700, d, 0, 2); break;
      case 'load': this.burst(0.25, 0.35, 'lowpass', 220, d); this.burst(0.2, 0.25, 'lowpass', 180, d, 0.18); break;
      case 'wrench': for (let i = 0; i < 3; i++) this.tone('square', 2400 + i * 300, 2200, 0.05, 0.06, d, i * 0.12); break;
      case 'slurp': this.burst(0.3, 0.12, 'bandpass', 1500, d, 0, 4); break;
      case 'bell': this.bell(d, 700, 0.25); break;
      case 'hydraulic': { const s = this.noiseSrc(false); const f = c.createBiquadFilter(); f.type = 'bandpass'; f.Q.value = 3; f.frequency.setValueAtTime(400, c.currentTime); f.frequency.exponentialRampToValueAtTime(1800, c.currentTime + 0.6); const g = c.createGain(); this.env(g, c.currentTime, 0.05, 0.15, 0.6); s.connect(f); f.connect(g); g.connect(d); s.start(); s.stop(c.currentTime + 0.8); break; }
      case 'jump': this.burst(0.08, 0.12, 'lowpass', 300, d); break;
      case 'shutter': this.burst(0.04, 0.35, 'highpass', 2500, d); this.burst(0.06, 0.25, 'bandpass', 1200, d, 0.07, 2); break;
      case 'bump': this.burst(0.3, 0.5, 'lowpass', 160, d); this.tone('sine', 80, 40, 0.3, 0.3, d); break;
    }
  },
  work(op) {
    if (!this.ok) return; const t = performance.now(); if (t - (this._lw || 0) < 180) return; this._lw = t; const d = this.sfxBus;
    if (op === 'plough' || op === 'weed' || op === 'cultivate') this.burst(0.1, 0.25, 'lowpass', 260, d);
    else if (op === 'sow' || op === 'fertilize') this.burst(0.12, 0.12, 'bandpass', 3200, d, 0, 1.5);
    else if (op === 'spray') this.burst(0.25, 0.1, 'highpass', 5000, d);
    else if (op === 'harvest') { const c = this.ctx; const s = this.noiseSrc(false); const f = c.createBiquadFilter(); f.type = 'bandpass'; f.Q.value = 2; f.frequency.setValueAtTime(2600, c.currentTime); f.frequency.exponentialRampToValueAtTime(900, c.currentTime + 0.14); const g = c.createGain(); this.env(g, c.currentTime, 0.01, 0.22, 0.14); s.connect(f); f.connect(g); g.connect(d); s.start(); s.stop(c.currentTime + 0.2); }
  },
  bell(dest, f0, vol, t = 0) { for (const [r, a, dcy] of [[1, 1, 3.2], [2.0, 0.5, 2.2], [2.76, 0.4, 1.8], [4.07, 0.25, 1.2], [5.4, 0.15, 0.9]]) this.tone('sine', f0 * r, f0 * r, dcy, vol * a, dest, t); },
  // positional one-shot
  at(name, x, z, y = 1) {
    if (!this.ok || this.active > 14) return;
    const P = Player.pos(); const dd = Math.hypot(x - P.x, z - P.z); if (dd > 220) return;
    const c = this.ctx; const p = this.panner(); this.setPos(p, x, y + World.groundHeight(x, z), z); p.connect(this.ambBus);
    this.active++; setTimeout(() => { this.active--; p.disconnect(); }, 4000);
    const now = c.currentTime;
    switch (name) {
      case 'moo': { const o = c.createOscillator(); o.type = 'sawtooth'; o.frequency.setValueAtTime(118, now); o.frequency.linearRampToValueAtTime(96, now + 1.1); const f = c.createBiquadFilter(); f.type = 'lowpass'; f.frequency.setValueAtTime(500, now); f.frequency.linearRampToValueAtTime(900, now + 0.3); f.frequency.linearRampToValueAtTime(350, now + 1.2); const g = c.createGain(); this.env(g, now, 0.15, 0.5, 1.1); o.connect(f); f.connect(g); g.connect(p); o.start(now); o.stop(now + 1.4); break; }
      case 'bleat': { const o = c.createOscillator(); o.type = 'sawtooth'; o.frequency.value = 390; const v = c.createOscillator(); v.frequency.value = 8; const vg = c.createGain(); vg.gain.value = 35; v.connect(vg); vg.connect(o.frequency); const f = c.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = 1300; f.Q.value = 2; const g = c.createGain(); this.env(g, now, 0.03, 0.3, 0.55); o.connect(f); f.connect(g); g.connect(p); o.start(now); v.start(now); o.stop(now + 0.7); v.stop(now + 0.7); break; }
      case 'bark': for (let i = 0; i < 2; i++) { this.burst(0.09, 0.5, 'bandpass', 900, p, i * 0.22, 1.5); this.tone('square', 320, 220, 0.09, 0.15, p, i * 0.22); } break;
      case 'cluck': for (let i = 0; i < 3; i++) this.tone('square', 650, 500, 0.05, 0.08, p, i * 0.11); break;
      case 'meow': { const o = c.createOscillator(); o.type = 'triangle'; o.frequency.setValueAtTime(520, now); o.frequency.linearRampToValueAtTime(820, now + 0.25); o.frequency.linearRampToValueAtTime(430, now + 0.6); const g = c.createGain(); this.env(g, now, 0.05, 0.2, 0.55); o.connect(g); g.connect(p); o.start(now); o.stop(now + 0.7); break; }
      case 'horn': this.tone('square', 410, 410, 0.45, 0.12, p); this.tone('square', 515, 515, 0.45, 0.1, p); break;
      case 'rooster': { const o = c.createOscillator(); o.type = 'sawtooth'; o.frequency.setValueAtTime(480, now); o.frequency.linearRampToValueAtTime(880, now + 0.35); o.frequency.linearRampToValueAtTime(820, now + 0.9); o.frequency.linearRampToValueAtTime(560, now + 1.3); const f = c.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = 1500; f.Q.value = 1.5; const g = c.createGain(); this.env(g, now, 0.05, 0.4, 1.3); o.connect(f); f.connect(g); g.connect(p); o.start(now); o.stop(now + 1.5); break; }
      case 'templebell': for (let k = 0; k < 4; k++) this.bell(p, 610, 0.5, k * 1.4); break;
      case 'birds': { const n = 2 + Math.floor(Math.random() * 4); const base = 2600 + Math.random() * 1600; for (let k = 0; k < n; k++) this.tone('sine', base, base * (1.2 + Math.random() * 0.4), 0.07, 0.06, p, k * 0.13); break; }
      case 'gajjelu': for (let k = 0; k < 2; k++) this.tone('triangle', 2900 + k * 260, 2700, 0.18, 0.05, p, k * 0.07); break;
    }
  },
  horn(v) { if (!this.ok) return; const d = this.sfxBus; const lo = v && (v.type === 'bus' || v.type === 'truck'); this.tone('square', lo ? 300 : 420, lo ? 300 : 420, 0.5, 0.12, d); this.tone('square', lo ? 380 : 525, lo ? 380 : 525, 0.5, 0.1, d); },
  thunder(dist) {
    if (!this.ok) return; const c = this.ctx; const now = c.currentTime;
    const vol = clamp(1.4 - dist / 600, 0.15, 1.2);
    const s = this.noiseSrc(false); const f = c.createBiquadFilter(); f.type = 'lowpass'; f.frequency.setValueAtTime(dist < 120 ? 2500 : 900, now); f.frequency.exponentialRampToValueAtTime(70, now + 3.5);
    const g = c.createGain(); g.gain.setValueAtTime(0.0001, now); g.gain.exponentialRampToValueAtTime(vol, now + (dist < 120 ? 0.02 : 0.25)); g.gain.exponentialRampToValueAtTime(vol * 0.5, now + 1.2); g.gain.exponentialRampToValueAtTime(0.0001, now + 4.5);
    s.connect(f); f.connect(g); g.connect(this.ambBus); s.start(now); s.stop(now + 4.6);
  },
  engineFor(v) { this.engVeh = v; },
  // ---------- per-frame ----------
  update(dt) {
    if (!this.ok) return;
    const c = this.ctx; const now = c.currentTime;
    // listener
    const cam = G.camera; const L = c.listener;
    _v1.set(0, 0, -1).applyQuaternion(cam.quaternion);
    if (L.positionX) { L.positionX.value = cam.position.x; L.positionY.value = cam.position.y; L.positionZ.value = cam.position.z; L.forwardX.value = _v1.x; L.forwardY.value = _v1.y; L.forwardZ.value = _v1.z; L.upX.value = 0; L.upY.value = 1; L.upZ.value = 0; }
    else { L.setPosition(cam.position.x, cam.position.y, cam.position.z); L.setOrientation(_v1.x, _v1.y, _v1.z, 0, 1, 0); }
    const W = Weather.cur; const night = Sky.night; const hr = Time.hour();
    const set = (param, v) => param.setTargetAtTime(v, now, 0.4);
    set(this.windG.gain, W.wind * 0.18 + 0.01); set(this.windF.frequency, 300 + W.wind * 500 + Math.sin(G.t * 0.7) * 80);
    set(this.rainG.gain, W.rain * 0.22); set(this.rumbleG.gain, W.rain * 0.25);
    set(this.crickG.gain, night * (1 - W.rain) * (Time.season() === 2 ? 0.4 : 1) * 0.6);
    // murmur near gatherings
    const P = Player.pos(); let mp = null, md = 1e9;
    const spots = [[POI.tea.counter.x, POI.tea.counter.z, hr > 6 && hr < 21], [POI.yard.weigh.x, POI.yard.weigh.z, hr > 8 && hr < 18], [POI.santha.x, POI.santha.z, Time.weekday() === SANTHA_WEEKDAY && hr > 9 && hr < 14], [POI.rachabanda.seats[0].x, POI.rachabanda.seats[0].z, hr > 16 && hr < 20]];
    for (const [x, z, on] of spots) { if (!on) continue; const d = Math.hypot(x - P.x, z - P.z); if (d < md) { md = d; mp = [x, z]; } }
    if (mp && md < 90) { this.setPos(this.murmurP, mp[0], 1.5, mp[1]); set(this.murmurG.gain, 0.25 * (0.6 + 0.4 * Math.sin(G.t * 3.1) * Math.sin(G.t * 1.7)) * (1 - W.rain * 0.7)); this.murmurF.frequency.setTargetAtTime(500 + Math.random() * 500, now, 0.1); }
    else set(this.murmurG.gain, 0);
    // pump hum at nearest running pump
    let pp = null, pd = 1e9;
    for (const f of Fields.list) if (f.pump && f.pumpPos && (!Weather.powerCut || G.S.up.solarPump)) { const sp = f.pumpPos.spout || f.pumpPos; const d = Math.hypot(sp.x - P.x, sp.z - P.z); if (d < pd) { pd = d; pp = sp; } }
    if (pp && pd < 60) { this.setPos(this.pumpP, pp.x, World.groundHeight(pp.x, pp.z) + 1, pp.z); set(this.pumpG.gain, 0.12); if (frand() < 0.3 * G.preset.particles) FX.emit('water', pp.x, World.groundHeight(pp.x, pp.z) + 0.9, pp.z, (frand() - 0.5) * 0.6, 0.6, (frand() - 0.5) * 0.6); } else set(this.pumpG.gain, 0);
    // engine
    const v = this.engVeh;
    const E = this.eng;
    if (v && v.def.fuelCap >= 0 && v.type !== 'bullock' && (v.def.fuelCap === 0 || v.fuel > 0)) {
      const two = v.def.two; const big = v.type === 'harvester' || v.type === 'pickup';
      const base = two ? 42 : big ? 34 : 27; const span = two ? 120 : big ? 55 : 48;
      const f = base + v.rpm * span;
      E.e1.frequency.setTargetAtTime(f, now, 0.05); E.e2.frequency.setTargetAtTime(f * 1.012, now, 0.05); E.e3.frequency.setTargetAtTime(f * 0.5, now, 0.05);
      E.ef.frequency.setTargetAtTime((two ? 900 : 280) + v.rpm * (two ? 1800 : 900), now, 0.08);
      set(E.eg.gain, (two ? 0.06 : 0.11) + v.rpm * 0.08);
    } else set(E.eg.gain, 0);
    if (v && v.type === 'bullock' && Math.abs(v.speed) > 0.3) { this.gT = (this.gT || 0) - dt; if (this.gT <= 0) { this.gT = 0.55; this.at('gajjelu', v.x, v.z, 1.2); } }
    // random ambience
    this.birdT -= dt; if (this.birdT <= 0) { this.birdT = 1.5 + Math.random() * 4; if (Sky.daylight > 0.3 && W.rain < 0.3) { const a = Math.random() * TAU, r = 10 + Math.random() * 40; this.at('birds', P.x + Math.cos(a) * r, P.z + Math.sin(a) * r, 6); } }
    // temple bells & rooster at fixed hours
    const day = Time.day();
    for (const bh of [6, 12, 18]) { const k = day + ':' + bh; if (hr >= bh && hr < bh + 0.2 && !this.bellDone[k]) { this.bellDone[k] = true; this.at('templebell', POI.temple.inner.x, POI.temple.inner.z, 4); } }
    if (hr > 5.2 && hr < 6.4 && Math.random() < dt * 0.15) { const h = POI.houses[Math.floor(Math.random() * POI.houses.length)]; if (h) this.at('rooster', h.x, h.z, 1.5); }
    this.music(now);
  },
  // ---------- generative music ----------
  raga() { const h = Time.hour(); return h >= 5 && h < 11 ? RAGAS.morning : h >= 11 && h < 16 ? RAGAS.noon : h >= 16 && h < 20 ? RAGAS.evening : RAGAS.night; },
  music(now) {
    if (Settings.v.music <= 0.001) return;
    const SA = 146.83; // D3
    const fest = Time.festivalToday() && Time.hour() > 16;
    const busy = Sky.daylight > 0.5 || fest;
    while (this.nextBeat < now + 0.4) {
      const t = this.nextBeat; const i = this.beatIdx++;
      const eighth = fest ? 0.24 : 0.32;
      this.nextBeat += eighth;
      // tanpura drone every 12 eighths
      if (i % 12 === 0) { [[SA * 1.5, 0], [SA * 2, 0.6], [SA * 2, 1.2], [SA, 1.8]].forEach(([f, dt2]) => this.pluck(f, t + dt2 * (eighth / 0.32))); }
      // dappu + talam rhythm (6/8 tisra)
      if (busy && G.started) {
        const pat = [1, 0, 0, 1, 0, 1, 1, 0, 1, 1, 0, 0];
        if (pat[i % 12]) this.dappu(t, i % 6 === 0 ? 1 : 0.6);
        if (i % 6 === 0 || (fest && i % 3 === 0)) this.talam(t);
      }
      // melody: bansuri phrases
      if (i % 2 === 0) {
        if (!this.phraseQ.length && (i % 24 === 0) && Math.random() < (busy ? 0.75 : 0.5)) this.phraseQ = this.makePhrase();
        const n = this.phraseQ.shift();
        if (n !== undefined && n !== null) this.flute(SA * 2 * Math.pow(2, n / 12), t, eighth * 2 * (this.phraseQ.length === 0 ? 2.5 : 1));
      }
    }
  },
  makePhrase() {
    const R = this.raga().notes; const deg = [...R, 12, 14, 16].filter((x) => x <= 16);
    const len = 5 + Math.floor(Math.random() * 6); const out = [];
    let idx = deg.indexOf(this.lastNote); if (idx < 0) idx = Math.floor(Math.random() * 5);
    for (let k = 0; k < len; k++) { idx = clamp(idx + Math.round((Math.random() - 0.5) * 3), 0, deg.length - 1); out.push(Math.random() < 0.12 ? null : deg[idx]); }
    out.push(Math.random() < 0.5 ? 0 : 7); this.lastNote = out[out.length - 1];
    return out;
  },
  pluck(f, t) {
    const c = this.ctx; const o = c.createOscillator(); o.type = 'sawtooth'; o.frequency.value = f; const o2 = c.createOscillator(); o2.type = 'sawtooth'; o2.frequency.value = f * 1.003;
    const fl = c.createBiquadFilter(); fl.type = 'lowpass'; fl.frequency.setValueAtTime(2400, t); fl.frequency.exponentialRampToValueAtTime(500, t + 1.8);
    const g = c.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.05, t + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, t + 2.6);
    o.connect(fl); o2.connect(fl); fl.connect(g); g.connect(this.musicBus); g.connect(this.verb); o.start(t); o2.start(t); o.stop(t + 2.7); o2.stop(t + 2.7);
  },
  flute(f, t, dur) {
    const c = this.ctx; const o = c.createOscillator(); o.type = 'sine'; o.frequency.setValueAtTime(f * 0.985, t); o.frequency.exponentialRampToValueAtTime(f, t + 0.08);
    const vib = c.createOscillator(); vib.frequency.value = 5.3; const vg = c.createGain(); vg.gain.setValueAtTime(0, t); vg.gain.linearRampToValueAtTime(f * 0.006, t + 0.35); vib.connect(vg); vg.connect(o.frequency);
    const o2 = c.createOscillator(); o2.type = 'triangle'; o2.frequency.value = f * 2; const g2 = c.createGain(); g2.gain.value = 0.12; o2.connect(g2);
    const g = c.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.07, t + 0.06); g.gain.setValueAtTime(0.065, t + dur * 0.7); g.gain.exponentialRampToValueAtTime(0.0001, t + dur + 0.25);
    o.connect(g); g2.connect(g); g.connect(this.musicBus); g.connect(this.verb);
    const b = this.noiseSrc(false); const bf = c.createBiquadFilter(); bf.type = 'bandpass'; bf.frequency.value = f * 3; bf.Q.value = 3; const bg = c.createGain(); this.env(bg, t, 0.02, 0.03, 0.12); b.connect(bf); bf.connect(bg); bg.connect(this.musicBus);
    o.start(t); vib.start(t); o2.start(t); b.start(t, Math.random()); o.stop(t + dur + 0.3); vib.stop(t + dur + 0.3); o2.stop(t + dur + 0.3); b.stop(t + 0.2);
  },
  dappu(t, acc) {
    const c = this.ctx; const o = c.createOscillator(); o.type = 'sine'; o.frequency.setValueAtTime(115, t); o.frequency.exponentialRampToValueAtTime(48, t + 0.22);
    const g = c.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.22 * acc, t + 0.005); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.3);
    o.connect(g); g.connect(this.musicBus); o.start(t); o.stop(t + 0.32);
    this.burst(0.05, 0.1 * acc, 'bandpass', 1800, this.musicBus, t - c.currentTime, 0.8);
  },
  talam(t) { for (const r of [1, 1.47, 2.09]) this.tone('sine', 3100 * r, 3100 * r, 0.25, 0.012, this.musicBus, t - this.ctx.currentTime); },
};
