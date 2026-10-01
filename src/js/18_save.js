// ============================================================================
// Save system: browser save (always) + optional cloud save through the
// artifact's private per-player store (data/users/<id>/save)
// ============================================================================
const SAVE_KEY = 'tvs_save_v1';
const SAVE_VERSION = 1;

const SaveSys = {
  lastLocal: 0, lastCloud: 0, cloudState: 'off', // off | ready | saving | readonly | error
  db: null, uid: null, ref: null, writing: false, queued: null, cloudSave: null, autoT: 0,

  // ---------- snapshot of everything needed to resume ----------
  serialize() {
    const S = G.S;
    const P = Player;
    const pv = P.vehicle;
    S.player.x = +(pv ? pv.x : P.x).toFixed(2);
    S.player.z = +(pv ? pv.z : P.z).toFixed(2);
    S.player.yaw = +(P.yaw || 0).toFixed(3);
    S.player.inVeh = pv ? pv.id : null;
    return {
      v: SAVE_VERSION,
      savedAt: Date.now(),
      day: Time.day(),
      name: S.player.name,
      money: Math.round(S.money),
      state: JSON.parse(JSON.stringify(S)),
      fields: Fields.save(),
      vehicles: Vehicles.save().filter((v) => !v.rentUntil),
      rented: Vehicles.save().filter((v) => v.rentUntil),
    };
  },
  valid(d) { return !!(d && typeof d === 'object' && d.v === SAVE_VERSION && d.state && d.state.time && d.state.player && d.fields); },

  // ---------- local ----------
  readLocal() { const d = Store.get(SAVE_KEY, null); return this.valid(d) ? d : null; },
  writeLocal(data) { const ok = Store.set(SAVE_KEY, data); if (ok) this.lastLocal = data.savedAt; return ok; },

  // ---------- save entry point ----------
  save(manual = false) {
    if (!G.started || !G.S) return false;
    let data;
    try { data = this.serialize(); } catch (e) { console.error('save failed', e); if (manual) UI.toast(L('Could not save the game.', 'ఆటను సేవ్ చేయలేకపోయాం.'), 'bad'); return false; }
    const ok = this.writeLocal(data);
    this.pushCloud(data);
    if (manual) {
      if (ok || this.cloudState === 'ready' || this.cloudState === 'saving') { UI.savedFlash(); UI.toast(L('Game saved.', 'ఆట సేవ్ అయింది.'), 'good'); }
      else UI.toast(L('This browser blocked saving. Turn on site storage, or keep this tab open.', 'ఈ బ్రౌజర్ సేవ్‌ను అడ్డుకుంది. సైట్ స్టోరేజ్ ఆన్ చేయండి.'), 'bad');
    } else if (ok) UI.savedFlash();
    return ok;
  },
  // quick synchronous save when the tab is hidden or closed
  quickLocal() { if (!G.started || !G.S) return; try { this.writeLocal(this.serialize()); } catch (e) { /* ignore */ } },

  // ---------- cloud (optional; silently absent outside the claude.ai viewer) ----------
  async initCloud(ask = false) {
    try {
      if (!window.claude || typeof window.claude.use !== 'function') return null;
      const perms = await window.claude.use('permissions');
      if (perms) {
        let st = await perms.state('db');
        if (st === 'prompt' && ask) { const r = await perms.request(['db', 'user']); st = r.db; }
        if (st === 'prompt') { this.cloudState = 'askable'; return null; }
        if (st !== 'granted') return null;
      }
      const db = await window.claude.use('db'); if (!db) return null;
      const user = await window.claude.use('user'); if (!user) return null;
      const uid = await user.id(); if (!uid) return null;
      this.db = db; this.uid = uid; this.ref = db.doc('data/users/' + uid + '/save');
      const snap = await this.ref.get();
      this.cloudState = 'ready';
      if (snap.exists) {
        const d = JSON.parse(JSON.stringify(snap.data()));
        if (this.valid(d)) { this.cloudSave = d; this.lastCloud = d.savedAt || 0; return d; }
      }
    } catch (e) {
      this.cloudState = 'off';
    }
    return null;
  },
  pushCloud(data) {
    if (!this.ref || this.cloudState === 'readonly' || this.cloudState === 'off') return;
    try { if (JSON.stringify(data).length > 240000) return; } catch (e) { return; }
    this.queued = data;
    if (!this.writing) this.flushCloud();
  },
  async flushCloud() {
    if (!this.queued) return;
    const data = this.queued; this.queued = null; this.writing = true; this.cloudState = 'saving';
    let retried = false;
    for (;;) {
      try {
        await this.ref.set(data);
        this.lastCloud = data.savedAt; this.cloudState = 'ready';
        break;
      } catch (e) {
        const code = e && e.code;
        if (code === 'unavailable' && !retried) { retried = true; await sleepMs(800 + Math.random() * 1200); continue; }
        if (code === 'invalid_argument') this.cloudState = 'readonly';
        else if (code === 'quota_exceeded') { this.cloudState = 'error'; UI.toastOnce('cloudq', L('Cloud save is full. Your game is still saved in this browser.', 'క్లౌడ్ సేవ్ నిండింది. మీ ఆట ఈ బ్రౌజర్‌లో సేవ్ అయింది.'), 'warn'); }
        else if (code === 'revoked' || code === 'not_granted' || code === 'capability_disabled' || code === 'capability_removed') this.cloudState = 'off';
        else this.cloudState = 'error';
        break;
      }
    }
    this.writing = false;
    if (this.queued && (this.cloudState === 'ready' || this.cloudState === 'error')) this.flushCloud();
  },
  // newest of browser and cloud save
  best() {
    const a = this.readLocal(), b = this.cloudSave;
    if (a && b) return (b.savedAt || 0) > (a.savedAt || 0) ? b : a;
    return a || b || null;
  },
  // turned on from the menu when the viewer has to agree first
  async enableCloud() {
    const d = await this.initCloud(true);
    if (this.cloudState === 'ready') { UI.toast(L('Cloud save is on.', 'క్లౌడ్ సేవ్ ఆన్ అయింది.'), 'good'); if (G.started) this.save(false); }
    else UI.toast(L('Cloud save is not available here. Your game still saves in this browser.', 'ఇక్కడ క్లౌడ్ సేవ్ అందుబాటులో లేదు. మీ ఆట ఈ బ్రౌజర్‌లో సేవ్ అవుతుంది.'), 'warn');
    UI.rerender();
    return d;
  },
  status() {
    const t = (ms) => { if (!ms) return '—'; const d = new Date(ms); return d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }); };
    const local = this.lastLocal ? L(`Saved in this browser at ${t(this.lastLocal)}.`, `ఈ బ్రౌజర్‌లో ${t(this.lastLocal)}కు సేవ్ అయింది.`) : L('Not saved yet in this session.', 'ఈ సెషన్‌లో ఇంకా సేవ్ కాలేదు.');
    const cloud = this.cloudState === 'ready' || this.cloudState === 'saving' ? L(' Cloud save is on, so you can continue on another device.', ' క్లౌడ్ సేవ్ ఆన్‌లో ఉంది, వేరే పరికరంలో కూడా కొనసాగించవచ్చు.')
      : this.cloudState === 'readonly' ? L(' Cloud save is read-only for your account.', ' మీ ఖాతాకు క్లౌడ్ సేవ్ చదవడానికి మాత్రమే.') : '';
    return local + cloud + L(' The game also saves every morning and after you sleep.', ' ప్రతి ఉదయం, మీరు నిద్రపోయిన తర్వాత కూడా ఆట సేవ్ అవుతుంది.');
  },
  // periodic autosave (real time) as a safety net
  tick(dt) {
    if (!G.started) return;
    this.autoT += dt;
    if (this.autoT > 150) { this.autoT = 0; this.save(false); }
  },
  wipe() { Store.del(SAVE_KEY); },
};
