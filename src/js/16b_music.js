// ============================================================================
// Background music: a small village band playing live in the browser.
// Tanpura drone, bansuri (bamboo flute) with gentle glides, santoor, tabla and a
// soft harmonium, in a raga for the time of day. Every song has a tune that comes
// back (intro, A, A, B, A, ending) over keherwa or dadra on the tabla, with a short
// rest between songs. Festivals and the mini-games play faster; nights are slow
// and quiet, rain brings the santoor.
// ============================================================================
const MOODS = {
  morning: { raga: 'Mohanam', notes: [0, 2, 4, 7, 9], tan: 7, mpm: 148, tala: 'keherwa', lead: 'flute', en: 'Morning in Ramapuram', te: 'రామాపురంలో ఉదయం' },
  noon: { raga: 'Madhyamavati', notes: [0, 2, 5, 7, 10], tan: 7, mpm: 158, tala: 'keherwa', lead: 'santoor', en: 'Fields at noon', te: 'మధ్యాహ్నం పొలాలు' },
  evening: { raga: 'Hamsadhwani', notes: [0, 2, 4, 7, 11], tan: 7, mpm: 136, tala: 'dadra', lead: 'flute', en: 'Evening by the lake', te: 'చెరువు ఒడ్డున సాయంత్రం' },
  night: { raga: 'Hindolam', notes: [0, 3, 5, 8, 10], tan: 5, mpm: 100, tala: null, lead: 'flute', soft: true, en: 'Village lullaby', te: 'పల్లె జోల పాట' },
  rain: { raga: 'Megh', notes: [0, 2, 5, 7, 10], tan: 7, mpm: 118, tala: 'soft', lead: 'santoor', soft: true, en: 'Monsoon rain', te: 'వాన చినుకులు' },
  festival: { raga: 'Mohanam', notes: [0, 2, 4, 7, 9], tan: 7, mpm: 192, tala: 'keherwa', lead: 'flute', fest: true, en: 'Festival night', te: 'పండుగ రాత్రి' },
  game: { raga: 'Mohanam', notes: [0, 2, 4, 7, 9], tan: 7, mpm: 184, tala: 'keherwa', lead: 'santoor', fest: true, en: 'Game time!', te: 'ఆట సమయం!' },
};
// tabla patterns: one bol per beat (matra); null is a rest
const TALAS = {
  keherwa: { n: 8, theka: ['dha', 'ge', 'na', 'ti', 'na', 'ka', 'dhi', 'na'], fill: ['dha', 'ti', 'ta', 'dha', 'ti', 'ta', 'dha', null], end: ['dha', 'ti', 'dha', null, 'dha', 'ti', 'dha', null] },
  dadra: { n: 6, theka: ['dha', 'dhi', 'na', 'dha', 'ti', 'na'], fill: ['dha', 'ti', 'ta', 'dha', 'ti', 'ta'], end: ['dha', null, 'dha', null, 'dha', null] },
  soft: { n: 8, theka: ['ge', null, null, 'tin', 'ge', null, 'na', null], fill: ['ge', null, 'na', null, 'ge', 'na', 'na', null], end: ['ge', null, null, null, 'ge', null, null, null] },
  none: { n: 8, theka: [], fill: [], end: [] },
};
// rhythms of one bar (beats per note) and of the closing bar of a phrase
const RHY8 = [[2, 1, 1, 2, 2], [1, 1, 2, 4], [3, 1, 2, 2], [2, 2, 4], [2, 1, 1, 4], [4, 2, 2], [2, 2, 2, 2], [3, 1, 4], [1, 1, 2, 2, 2], [2, 2, 1, 1, 2]];
const RHY6 = [[2, 1, 3], [1, 1, 1, 3], [3, 3], [2, 2, 2], [1, 1, 2, 2], [3, 1, 2], [2, 1, 1, 2]];
const CAD8 = [[2, 2, 4], [1, 1, 2, 4], [3, 1, 4], [2, 6]], CAD6 = [[1, 2, 3], [2, 1, 3], [3, 3]];

const Music = {
  SA: 146.83,   // D: the tanpura's Sa; the flute and santoor play an octave above
  song: null, tBar: 0, tTan: 0, tanI: 0, songN: 0, heard: null, ready: false,
  // the band's mixing desk: one bus per instrument, a little reverb on each
  setup(A) {
    const c = A.ctx, mk = (pan, wet) => {
      const g = c.createGain(); let o = g;
      if (c.createStereoPanner) { const p = c.createStereoPanner(); p.pan.value = pan; g.connect(p); o = p; }
      o.connect(A.musicBus);
      if (wet > 0) { const s = c.createGain(); s.gain.value = wet; g.connect(s); s.connect(A.verb); }
      return g;
    };
    this.bFlute = mk(-0.18, 0.55); this.bSant = mk(0.3, 0.5); this.bTabla = mk(0.06, 0.16); this.bTanL = mk(-0.45, 0.35); this.bTanR = mk(0.45, 0.35); this.bHarm = mk(-0.05, 0.35); this.bBell = mk(0.2, 0.4);
    // harmonium bellows: a slow, soft tremolo
    const lfo = c.createOscillator(); lfo.frequency.value = 4.6; const lg = c.createGain(); lg.gain.value = 0.12; lfo.connect(lg); lg.connect(this.bHarm.gain); lfo.start();
    const wave = (h) => { const re = new Float32Array(h.length), im = new Float32Array(h.length); h.forEach((v, i) => { im[i] = v; }); return c.createPeriodicWave(re, im); };
    this.wFlute = wave([0, 1, 0.2, 0.07, 0.025]);
    this.wSant = wave([0, 1, 0.55, 0.3, 0.16, 0.08, 0.05]);
    this.wNa = wave([0, 1, 0.5, 0.3, 0.15, 0.08]);
    this.wReed = wave([0, 1, 0.6, 0.45, 0.32, 0.22, 0.15, 0.1, 0.06]);
    this.ready = true;
  },
  pickMood() {
    if (typeof Games !== 'undefined' && Games.mode) return 'game';
    if (!G.started || !G.S) return 'morning';
    const hr = Time.hour(), W = Weather.cur;
    if (Time.festivalToday() && hr > 16 && hr < 23) return 'festival';
    if (W && W.rain > 0.45) return 'rain';
    if (hr >= 20.5 || hr < 5) return 'night';
    return hr < 11 ? 'morning' : hr < 16 ? 'noon' : 'evening';
  },
  // ---------------- composing ----------------
  fq(deg, base) { const N = this.song.mood.notes, o = Math.floor(deg / 5), k = ((deg % 5) + 5) % 5; return base * Math.pow(2, (N[k] + 12 * o) / 12); },
  motif(rng, rhy, start, lo, hi) {
    const out = []; let d = start;
    for (let i = 0; i < rhy.length; i++) {
      if (i > 0) { const r = rng(); d = clamp(d + (r < 0.33 ? 1 : r < 0.66 ? -1 : r < 0.78 ? 2 : r < 0.9 ? -2 : 0), lo, hi); }
      out.push([d, rhy[i]]);
    }
    return out;
  },
  // the same tune with a new ending, so the phrase answers itself
  vary(rng, m, lo, hi) { const out = m.map((x) => x.slice()); const k = out.length - 1; out[k][0] = clamp(out[k][0] + (rng() < 0.5 ? 1 : -1) * (1 + Math.floor(rng() * 2)), lo, hi); return out; },
  // walk home step by step and hold the home note
  cadence(rng, rhy, home) { const a = rng() < 0.6 ? 1 : -1, k = rhy.length; return rhy.map((b, i) => [i === k - 1 ? home : home + a * (k - 1 - i), b]); },
  compose(id) {
    const mood = MOODS[id], T = TALAS[mood.tala || 'none'], n = T.n;
    const rng = mulberry32((++this.songN * 7919 + Math.floor(Math.random() * 1e9)) >>> 0);
    const RH = n === 6 ? RHY6 : RHY8, CD = n === 6 ? CAD6 : CAD8, pick = (a) => a[Math.floor(rng() * a.length)];
    const a1 = this.motif(rng, pick(RH), pick([0, 2, 3]), -2, 6), a2 = this.motif(rng, pick(RH), a1[a1.length - 1][0], -2, 6);
    const A = [a1, a2, this.vary(rng, a1, -2, 6), this.cadence(rng, pick(CD), 0)];
    const b1 = this.motif(rng, pick(RH), pick([5, 6, 7]), 3, 9), b2 = this.motif(rng, pick(RH), b1[b1.length - 1][0], 3, 9);
    const B = [b1, b2, this.vary(rng, b1, 3, 9), this.cadence(rng, pick(CD), rng() < 0.5 ? 5 : 3)];
    const other = mood.lead === 'flute' ? 'santoor' : 'flute';
    const bars = [{ part: 'intro' }, { part: 'intro', fillIn: true }];
    const secs = mood.soft ? [['A', mood.lead], ['B', other], ['A3', mood.lead]] : [['A', mood.lead], ['A2', mood.lead], ['B', other], ['A3', mood.lead]];
    for (const [s, who] of secs) for (let i = 0; i < 4; i++) bars.push({ part: s, who, mel: (s === 'B' ? B : A)[i], i, last: i === 3 });
    bars.push({ part: 'end' });
    return { id, mood, T, n, md: 60 / mood.mpm, bars, at: 0, rng };
  },
  // ---------------- the band ----------------
  tick(A, now) {
    if (!this.ready) this.setup(A);
    if (this.tBar < now - 0.5) this.tBar = now + 0.15;   // the page was asleep: start again cleanly
    if (this.tTan < now - 0.5) this.tTan = now + 0.1;
    while (this.tTan < now + 0.6) this.tanpura();
    const want = this.pickMood();
    // a mini-game starting or ending changes the song at the next bar
    if (this.song && this.song.at < this.song.bars.length - 1 && (want === 'game') !== (this.song.id === 'game')) { this.song.at = this.song.bars.length - 1; this.hush(); }
    let guard = 0;
    while (this.tBar < now + 0.6 && guard++ < 6) {
      if (!this.song || this.song.at >= this.song.bars.length) {
        const first = !this.song;
        this.song = this.compose(want);
        if (!first) this.tBar += this.song.n * this.song.md * (want === 'game' ? 0.5 : 2);   // a breath between songs
        // the name of the new music, now and then (not for every mini-game)
        if (this.heard !== want && G.started && want !== 'game') { this.heard = want; if (Settings.v.music > 0.05 && performance.now() - (this.heardAt || -1e9) > 150000) { this.heardAt = performance.now(); UI.toast('🎵 ' + LN(MOODS[want]), 'music'); } }
        if (this.tBar >= now + 0.6) break;
      }
      const s = this.song, b = s.bars[s.at];
      this.bar(s, b, this.tBar);
      this.tBar += s.n * s.md; s.at++;
    }
  },
  bar(s, b, t) {
    const md = s.md, n = s.n, M = s.mood, F = this.SA * 2;
    // tabla: joins after the intro; fills at the end of a phrase, a flourish to finish
    if (b.part !== 'intro' || b.fillIn) {
      const pat = b.part === 'end' ? s.T.end : (b.last || b.fillIn) ? s.T.fill : s.T.theka;
      const vol = M.soft ? 0.55 : 1;
      pat.forEach((bol, i) => { if (bol && !(b.fillIn && i < n / 2)) this.bol(bol, t + i * md + (i % 2 ? md * 0.035 : 0), (i === 0 ? 1 : 0.62) * vol); });
      if (M.fest) for (let i = 0; i < n; i += n / 2) this.manjira(t + i * md);
    }
    // harmonium: swells in under the tune
    if (b.i === 0 && (b.part === 'A2' || b.part === 'A3' || (b.part === 'B' && !M.soft))) this.harmonium([this.SA, this.SA * Math.pow(2, M.tan / 12), this.SA * 2], t, n * md * 4, M.soft ? 0.5 : 0.85);
    if (b.part === 'intro' && !b.fillIn) this.harmonium([this.SA, this.SA * Math.pow(2, M.tan / 12)], t, n * md * 2.2, 0.6);
    // santoor: a rising run to open, and at the very end
    if (b.part === 'intro' && !b.fillIn) { const run = [0, 1, 2, 3, 4, 5, 7]; for (let i = 0; i < Math.min(n, run.length); i++) this.santoor(this.fq(run[i], F), t + i * md, 0.05 + i * 0.004); }
    if (b.part === 'intro' && b.fillIn) { this.santoor(this.fq(5, F), t, 0.06); this.roll(this.fq(5, F), t + md, md * 2, 0.04); }
    if (b.part === 'end') { [7, 5, 3, 2, 0].forEach((d, i) => this.santoor(this.fq(d, F), t + i * md * 0.5, 0.05)); this.flute([[{ f: this.fq(0, F), t: t + md * 2.5, d: md * (n - 2) }]], 0.75); }
    // the tune: the flute plays a whole four-bar phrase as one breath; the santoor strikes and rolls
    if (b.mel) {
      if (b.who === 'flute') { if (b.i === 0) this.fluteLine(s, b, t); }
      else this.santoorLine(s, b, t);
      // answers in the second A: the santoor echoes the end of each bar
      if (b.part === 'A2' && b.who === 'flute' && !b.last) { const lastDeg = b.mel[b.mel.length - 1][0]; this.santoor(this.fq(lastDeg + 5, F), t + (n - 1) * md, 0.035); this.santoor(this.fq(lastDeg + 3, F), t + (n - 0.5) * md, 0.03); }
    }
  },
  fluteLine(s, b, t) {
    const F = this.SA * 2, md = s.md, rng = s.rng, notes = [];
    const at0 = s.at;
    for (let k = 0; k < 4; k++) {
      const bb = s.bars[at0 + k]; if (!bb || !bb.mel || bb.who !== 'flute') break;
      let tt = t + k * s.n * md;
      for (const [deg, beats] of bb.mel) {
        const d = beats * md;
        if (beats >= 2 && rng() < 0.3) notes.push({ f: this.fq(deg + 1, F), t: tt, d: 0.07, grace: true });   // a quick touch of the note above
        notes.push({ f: this.fq(deg, F), t: tt + (notes.length && notes[notes.length - 1].grace ? 0.07 : 0), d });
        tt += d;
      }
    }
    if (notes.length) this.flute([notes], s.mood.soft ? 0.7 : 1);
  },
  santoorLine(s, b, t) {
    const F = this.SA * 2, md = s.md; let tt = t;
    for (const [deg, beats] of b.mel) {
      const f = this.fq(deg, F), d = beats * md;
      this.santoor(f, tt, 0.07);
      if (beats >= 2) this.roll(f, tt + md * 0.5, d - md * 0.5, 0.045);   // long notes ring on as a soft roll
      tt += d;
    }
  },
  // ---------------- instruments ----------------
  osc(c, wave, f, t) { const o = c.createOscillator(); if (wave && typeof wave !== 'string') o.setPeriodicWave(wave); else o.type = wave || 'sine'; o.frequency.setValueAtTime(f, t); return o; },
  // bansuri: one voice per phrase, sliding between notes, breath noise, vibrato on long notes
  flute(lines, vol) {
    const A = Audio2, c = A.ctx;
    for (const notes of lines) {
      if (!notes.length) continue;
      const t0 = notes[0].t, last = notes[notes.length - 1], t1 = last.t + last.d;
      const o = this.osc(c, this.wFlute, notes[0].f * 0.97, t0);
      const vib = c.createOscillator(); vib.frequency.value = 5.2; const vg = c.createGain(); vg.gain.value = 0; vib.connect(vg); vg.connect(o.frequency);
      const g = c.createGain(); g.gain.setValueAtTime(0.0001, t0);
      const gk = c.createGain();   // lets a song change fade this breath out early
      const pk = 0.1 * vol;
      const br = A.noiseSrc(); const bf = c.createBiquadFilter(); bf.type = 'bandpass'; bf.Q.value = 0.9; bf.frequency.value = notes[0].f * 2.2; const bg = c.createGain(); bg.gain.value = 0.16;
      br.connect(bf); bf.connect(bg); bg.connect(g);
      o.connect(g); g.connect(gk); gk.connect(this.bFlute);
      let prev = null;
      for (const nt of notes) {
        const leap = prev ? Math.abs(Math.log2(nt.f / prev.f)) : 0;
        if (!prev) { o.frequency.setTargetAtTime(nt.f, t0, 0.03); g.gain.setTargetAtTime(pk, t0, 0.03); }
        else {
          const glide = nt.grace || prev.grace ? 0.012 : leap > 0.2 ? 0.05 : 0.018;   // big jumps slide (meend)
          o.frequency.setTargetAtTime(nt.f, nt.t - glide, glide);
          if (!nt.grace && !prev.grace && (leap < 0.01 || Math.random() < 0.35)) { g.gain.setTargetAtTime(pk * 0.45, nt.t - 0.03, 0.01); g.gain.setTargetAtTime(pk, nt.t + 0.005, 0.02); }   // tonguing
        }
        bf.frequency.setTargetAtTime(nt.f * 2.2, nt.t, 0.03);
        vg.gain.setTargetAtTime(0, nt.t, 0.04);
        if (nt.d > 0.55 && !nt.grace) vg.gain.setTargetAtTime(nt.f * 0.009, nt.t + 0.28, 0.18);
        prev = nt;
      }
      g.gain.setTargetAtTime(0.0001, t1 - 0.05, 0.14);
      const end = t1 + 0.9;
      o.start(t0); vib.start(t0); br.start(t0, Math.random()); o.stop(end); vib.stop(end); br.stop(end);
      this.live = (this.live || []).filter((x) => x.end > c.currentTime); this.live.push({ gk, end });
    }
  },
  // stop the flute that is still playing (a mini-game starts, or the music is turned off)
  hush() { const c = Audio2.ctx; if (!c) return; for (const x of this.live || []) if (x.end > c.currentTime) x.gk.gain.setTargetAtTime(0.0001, c.currentTime, 0.08); this.live = []; },
  // santoor: a hammered pair of strings, bright then mellow
  santoor(f, t, vol, soft) {
    const A = Audio2, c = A.ctx;
    const o = this.osc(c, this.wSant, f, t), o2 = this.osc(c, this.wSant, f, t); o2.detune.value = 6;
    const lp = c.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.setValueAtTime(Math.min(12000, f * 9), t); lp.frequency.exponentialRampToValueAtTime(f * 2.2, t + 0.45);
    const g = c.createGain(); const dec = clamp(1.7 - Math.log2(f / 300) * 0.35, 0.6, 2.2);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + 0.004); g.gain.exponentialRampToValueAtTime(0.0001, t + dec);
    o.connect(lp); o2.connect(lp); lp.connect(g); g.connect(this.bSant);
    o.start(t); o2.start(t); o.stop(t + dec + 0.05); o2.stop(t + dec + 0.05);
    if (!soft) A.burst(0.012, vol * 0.6, 'highpass', 3200, this.bSant, t - c.currentTime, 0.7);   // the hammer
  },
  roll(f, t, d, vol) { const step = 0.12; for (let x = 0, k = 0; x < d - 0.05 && k < 12; x += step, k++) this.santoor(f, t + x, vol * (1 - x / (d + 0.4)) * (k % 2 ? 0.8 : 1), true); },
  // tanpura: Pa (or Ma), Sa, Sa, low Sa, again and again, each string buzzing as it rings
  tanpura() {
    const A = Audio2, c = A.ctx, M = (this.song || { mood: MOODS.morning }).mood, t = this.tTan, i = this.tanI++ % 4;
    const f = i === 0 ? this.SA * Math.pow(2, M.tan / 12) / 2 : i === 3 ? this.SA / 2 : this.SA;
    this.tTan += i === 3 ? 1.6 : 0.95;
    const o = this.osc(c, 'sawtooth', f, t), o2 = this.osc(c, 'sawtooth', f * 1.0018, t);
    const lp = c.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 850; lp.Q.value = 0.4;
    const bp = c.createBiquadFilter(); bp.type = 'bandpass'; bp.Q.value = 5; bp.frequency.setValueAtTime(f * 3, t); bp.frequency.exponentialRampToValueAtTime(f * 15, t + 3);   // the jawari shimmer
    const sg = c.createGain(); sg.gain.value = 0.55;
    const g = c.createGain(); const v = (M.soft ? 0.017 : 0.022) * (i === 3 ? 1.15 : 1);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(v, t + 0.03); g.gain.exponentialRampToValueAtTime(v * 0.45, t + 1.2); g.gain.exponentialRampToValueAtTime(0.0001, t + 4.4);
    o.connect(lp); o2.connect(lp); o.connect(bp); bp.connect(sg); lp.connect(g); sg.connect(g); g.connect(i % 2 ? this.bTanR : this.bTanL);
    o.start(t); o2.start(t); o.stop(t + 4.5); o2.stop(t + 4.5);
  },
  harmonium(fs, t, d, vol) {
    const c = Audio2.ctx;
    for (const f of fs) {
      const o = this.osc(c, this.wReed, f, t), o2 = this.osc(c, this.wReed, f, t); o2.detune.value = 9;
      const lp = c.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 1300; lp.Q.value = 0.5;
      const g = c.createGain(); const v = 0.0105 * vol;
      g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(v, t + 0.7); g.gain.setValueAtTime(v, t + d - 1.1); g.gain.exponentialRampToValueAtTime(0.0001, t + d);
      o.connect(lp); o2.connect(lp); lp.connect(g); g.connect(this.bHarm);
      o.start(t); o2.start(t); o.stop(t + d + 0.05); o2.stop(t + d + 0.05);
    }
  },
  manjira(t) {
    const A = Audio2, c = A.ctx;
    for (const [r, a] of [[1, 1], [1.49, 0.7], [2.13, 0.45]]) { const o = this.osc(c, 'sine', 3400 * r, t); const g = c.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.011 * a, t + 0.004); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.9); o.connect(g); g.connect(this.bBell); o.start(t); o.stop(t + 0.95); }
    A.burst(0.04, 0.03, 'highpass', 7000, this.bBell, t - c.currentTime, 0.7);
  },
  // tabla: bayan (left, deep, with the wrist slide) and dayan (right, tuned to Sa)
  bol(name, t, a) {
    switch (name) {
      case 'dha': this.ge(t, a); this.na(t, a); break;
      case 'dhi': this.ge(t, a); this.tin(t, a); break;
      case 'ge': this.ge(t, a); break;
      case 'na': this.na(t, a); break;
      case 'tin': this.tin(t, a); break;
      case 'ti': case 'ta': this.ti(t, a); break;
      case 'ka': this.ka(t, a); break;
    }
  },
  ge(t, a) {
    const c = Audio2.ctx, f = this.SA / 2; const o = this.osc(c, 'sine', f * 1.2, t);
    o.frequency.exponentialRampToValueAtTime(f * 0.9, t + 0.07); o.frequency.exponentialRampToValueAtTime(f * 1.1, t + 0.4);
    const g = c.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.34 * a, t + 0.006); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.55);
    o.connect(g); g.connect(this.bTabla); o.start(t); o.stop(t + 0.58);
  },
  na(t, a) {
    const A = Audio2, c = A.ctx, f = this.SA * 2; const o = this.osc(c, this.wNa, f, t);
    const lp = c.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.setValueAtTime(5200, t); lp.frequency.exponentialRampToValueAtTime(700, t + 0.2);
    const g = c.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.085 * a, t + 0.003); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.38);
    o.connect(lp); lp.connect(g); g.connect(this.bTabla); o.start(t); o.stop(t + 0.4);
    A.burst(0.016, 0.07 * a, 'bandpass', 3300, this.bTabla, t - c.currentTime, 1.4);
  },
  tin(t, a) {
    const c = Audio2.ctx, f = this.SA * 2; const o = this.osc(c, 'sine', f, t);
    const g = c.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.07 * a, t + 0.004); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.65);
    o.connect(g); g.connect(this.bTabla); o.start(t); o.stop(t + 0.67);
  },
  ti(t, a) { const A = Audio2; A.burst(0.045, 0.1 * a, 'bandpass', 2300, this.bTabla, t - A.ctx.currentTime, 1.2); },
  ka(t, a) { const A = Audio2; A.burst(0.05, 0.16 * a, 'lowpass', 520, this.bTabla, t - A.ctx.currentTime, 0.8); },
};
