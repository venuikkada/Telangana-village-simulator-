// ============================================================================
// UI: settings, HUD, minimap & map, menus, shops, dialogs, title, touch
// ============================================================================
const Settings = {
  v: { lang: 'en', preset: null, vol: 0.8, music: 0.55, amb: 0.8, sfx: 0.8, sens: 1, invertY: false, clickWork: false, fps: false, fps60: false, fpsMode: 'auto', camFollow: true, portraitOk: false, timeScale: 1, voice: true,
    style: 'classic', bright: 1, minimap: true, btnSize: 1, btnAlpha: 1, joyMode: 'fixed', vehCtl: 'buttons', autoRunOn: true, vibrate: true, sensVeh: 1, gyro: false, gyroSens: 1, hud: {} },
  load() { const s = Store.get('tvs_prefs', null); if (s) Object.assign(this.v, s); },
  save() { Store.set('tvs_prefs', this.v); },
};
// ---------------- languages: load a translation file and the right fonts when picked ----------------
const Lang = {
  fontsDone: {},
  info(id) { return LANGS.find((x) => x.id === id) || LANGS[0]; },
  // fetch i18n/<id>.json (English and Telugu are built in)
  async load(id) {
    if (id === 'en' || id === 'te') { I18N.dict = null; I18N.lang = id; return true; }
    if (I18N.cache[id]) { I18N.dict = I18N.cache[id]; I18N.lang = id; return true; }
    try {
      const ctl = typeof AbortController !== 'undefined' ? new AbortController() : null;
      const tm = setTimeout(() => { if (ctl) ctl.abort(); }, 9000);
      const r = await fetch(`i18n/${id}.json?v=${I18N_VER}`, ctl ? { signal: ctl.signal } : undefined);
      clearTimeout(tm);
      if (!r.ok) throw new Error('HTTP ' + r.status);
      const d = await r.json();
      I18N.cache[id] = d; I18N.dict = d; I18N.lang = id; return true;
    } catch (e) { console.warn('language file', id, e && e.message); return false; }
  },
  // each script gets its own rounded display face and an easy-to-read text face (Google Fonts, loaded once)
  fonts(id) {
    const lg = this.info(id); const root = document.documentElement;
    if (!lg.disp) { root.style.removeProperty('--font-display'); root.style.removeProperty('--font-body'); return; }
    if (!this.fontsDone[id]) {
      this.fontsDone[id] = true;
      const fam = (f, w) => 'family=' + f.replace(/ /g, '+') + ':wght@' + w;
      const q = [fam(lg.disp, '500;600;700;800')]; if (lg.body !== lg.disp) q.push(fam(lg.body, '400;500;600;700'));
      const link = document.createElement('link'); link.rel = 'stylesheet'; link.href = 'https://fonts.googleapis.com/css2?' + q.join('&') + '&display=swap';
      document.head.appendChild(link);
    }
    root.style.setProperty('--font-display', `"${lg.disp}", "Baloo Tammudu 2", system-ui, sans-serif`);
    root.style.setProperty('--font-body', `"${lg.body}", "Hind Guntur", system-ui, sans-serif`);
  },
  // switch the whole game to another language
  async set(id) {
    const ok = await this.load(id);
    if (!ok) { id = 'en'; await this.load('en'); if (G.started) UI.toast('Could not load that language. Check your internet and try again.', 'warn'); }
    Settings.v.lang = id; Settings.save();
    this.fonts(id); UI.applyLang();
    return ok;
  },
  // a drop-down with every language written in its own script
  picker(cls, onDone) {
    const sel = h('select', { class: 'langsel ' + (cls || ''), 'aria-label': 'Language', onchange: async (e) => { sel.disabled = true; await this.set(e.target.value); sel.disabled = false; if (onDone) onDone(); } },
      ...LANGS.map((lg) => h('option', { value: lg.id, selected: Settings.v.lang === lg.id ? true : null }, lg.id === 'en' ? 'English' : `${lg.name} · ${lg.en}`)));
    return sel;
  },
};
const ICON = {
  auto: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M13 5.5L8 13h4l-1 5.5 5-7.5h-4z" fill="currentColor"/></svg>',
  sun: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="4.2" fill="#f2b52d" stroke="#d6950f"/><path d="M12 2v2.5M12 19.5V22M2 12h2.5M19.5 12H22M4.9 4.9l1.8 1.8M17.3 17.3l1.8 1.8M4.9 19.1l1.8-1.8M17.3 6.7l1.8-1.8" stroke="#d6950f"/></svg>',
  partly: '<svg viewBox="0 0 24 24" fill="none" stroke-width="1.6"><circle cx="9" cy="9" r="3.6" fill="#f2b52d" stroke="#d6950f"/><path d="M7 19h10a3.5 3.5 0 0 0 .3-7 5 5 0 0 0-9.6 1.3A2.9 2.9 0 0 0 7 19z" fill="#e9eef3" stroke="#7d8a99"/></svg>',
  cloud: '<svg viewBox="0 0 24 24" fill="none" stroke-width="1.6"><path d="M6.5 18h11a4 4 0 0 0 .3-8 5.5 5.5 0 0 0-10.6 1.5A3.3 3.3 0 0 0 6.5 18z" fill="#dfe4ea" stroke="#6f7b88"/></svg>',
  drizzle: '<svg viewBox="0 0 24 24" fill="none" stroke-width="1.6" stroke-linecap="round"><path d="M6.5 14h11a4 4 0 0 0 .3-8 5.5 5.5 0 0 0-10.6 1.5A3.3 3.3 0 0 0 6.5 14z" fill="#d3dae2" stroke="#6f7b88"/><path d="M9 17l-.8 2.5M14 17l-.8 2.5" stroke="#3d7fc2"/></svg>',
  rain: '<svg viewBox="0 0 24 24" fill="none" stroke-width="1.6" stroke-linecap="round"><path d="M6.5 13h11a4 4 0 0 0 .3-8 5.5 5.5 0 0 0-10.6 1.5A3.3 3.3 0 0 0 6.5 13z" fill="#b8c2cd" stroke="#5d6976"/><path d="M8 16l-1.2 4M12 16l-1.2 4M16 16l-1.2 4" stroke="#2f6fb0"/></svg>',
  storm: '<svg viewBox="0 0 24 24" fill="none" stroke-width="1.6" stroke-linejoin="round"><path d="M6.5 13h11a4 4 0 0 0 .3-8 5.5 5.5 0 0 0-10.6 1.5A3.3 3.3 0 0 0 6.5 13z" fill="#9aa5b2" stroke="#4d5764"/><path d="M12.5 13.5l-3 5h3l-1.5 4 4.5-6h-3l1.5-3z" fill="#f2b52d" stroke="#c98a0c"/></svg>',
  wind: '<svg viewBox="0 0 24 24" fill="none" stroke="#5d6976" stroke-width="2" stroke-linecap="round"><path d="M3 9h11a3 3 0 1 0-3-3M3 13h15a3 3 0 1 1-3 3M3 17h7"/></svg>',
  heat: '<svg viewBox="0 0 24 24" fill="none" stroke-width="1.8" stroke-linecap="round"><circle cx="9" cy="9" r="4" fill="#f07b2a" stroke="#c2501a"/><path d="M15 15c1.5-1 3 1 4.5 0M13 19c1.5-1 3 1 4.5 0M17 11c1.2-.8 2.4.8 3.6 0" stroke="#c2501a"/></svg>',
  fog: '<svg viewBox="0 0 24 24" fill="none" stroke="#7d8a99" stroke-width="2" stroke-linecap="round"><path d="M4 9h16M3 13h18M5 17h14"/></svg>',
  hand: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M8 13V5.5a1.5 1.5 0 0 1 3 0V11m0-1V4.5a1.5 1.5 0 0 1 3 0V11m0-5.5a1.5 1.5 0 0 1 3 0V12m0-3.5a1.5 1.5 0 0 1 3 0V15a6 6 0 0 1-6 6h-1.5a6 6 0 0 1-5-2.7L4.6 15a1.6 1.6 0 0 1 2.6-1.8L8 14"/></svg>',
  hoe: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M4 20L15 9"/><path d="M13 5.5l5.5 5.5-2 2-5.5-5.5z" fill="currentColor"/></svg>',
  seeds: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"><path d="M7 8h10l2 12H5z"/><path d="M8.5 8c0-2 1.5-4 3.5-4s3.5 2 3.5 4"/><circle cx="10" cy="13" r=".9" fill="currentColor"/><circle cx="14" cy="15" r=".9" fill="currentColor"/><circle cx="11.5" cy="17" r=".9" fill="currentColor"/></svg>',
  fert: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"><path d="M6 5h12l-1 3 1.5 11a1 1 0 0 1-1 1h-11a1 1 0 0 1-1-1L7 8z"/><path d="M9 12h6M9 15h4"/></svg>',
  sprayer: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><rect x="5" y="7" width="8" height="13" rx="2"/><path d="M9 7V4M13 10h3l4-4M18 4l2 2M20 9l1 0"/></svg>',
  sickle: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round"><path d="M14.5 4.5a7 7 0 1 1-8.3 9.6 5.5 5.5 0 0 0 8.3-9.6z" fill="currentColor"/><path d="M7 15l-3 5"/></svg>',
};
const KIND_COL = { official: '#2e7d4f', farmer: '#a3432a', teastall: '#d9531e', shop: '#2f6d4f', mechanic: '#20364a', agent: '#2a3374', doctor: '#2e8b57', teacher: '#b0772a', moneylender: '#7a2f2f', bank: '#1f3f8a', shepherd: '#6b4a32', worker: '#57586e' };

const UI = {
  dirty: true, toastKeys: {}, uiT: 0, mapT: 0, sheetState: null, actionList: null,
  init() {
    this.el = (id) => document.getElementById(id);
    this.buildTools();
    this.el('bMap').onclick = () => this.map();
    this.el('bOffice').onclick = () => this.office();
    this.el('bMenu').onclick = () => this.settings();
    this.el('bPhoto').onclick = () => this.photo();
    this.el('mapwrap').onclick = () => this.map();
    this.el('prompt').onclick = () => Interact.trigger();
    this.initTouch();
    Menu.boot();
    window.addEventListener('keydown', (e) => {
      if (!G.started) return;
      const t = e.target; if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA')) return;
      if (e.code === 'Escape') { if (this.modalOpen()) this.close(); else if (this.photoMode) this.photo(); else this.settings(); e.preventDefault(); return; }
      if (this.modalOpen()) {
        if (this.actionList && /^Digit[1-9]$/.test(e.code)) { const i = +e.code.slice(5) - 1; const o = this.actionList[i]; if (o) { this.close(); o.act(); } }
        if ((e.code === 'KeyM' && this.sheetState && this.sheetState.kind === 'map') || (e.code === 'KeyB' && this.sheetState && this.sheetState.kind === 'office')) this.close();
        return;
      }
      if (e.code === 'KeyM') this.map();
      else if (e.code === 'KeyB' || e.code === 'KeyI' || e.code === 'Tab') { e.preventDefault(); this.office(e.code === 'KeyI' ? 'storage' : undefined); }
      else if (e.code === 'KeyP') this.photo();
      else if (e.code === 'Equal' && !Player.vehicle) { Input.autoRun = !Input.autoRun; Input.run = Input.autoRun; if (Input.autoRun) this.toastOnce('autorunpc', L('Auto run on: steer with the mouse. Press W or S to stop.', 'ఆటో పరుగు ఆన్: మౌస్‌తో దిశ మార్చండి. ఆపడానికి W లేదా S నొక్కండి.'), 'info'); }
      else if (e.code === 'F1' || e.code === 'Slash') { e.preventDefault(); this.help(); }
    });
    this.beacon = new THREE.Mesh(new THREE.CylinderGeometry(1.2, 1.2, 160, 16, 1, true), new THREE.MeshBasicMaterial({ color: 0xf2b52d, transparent: true, opacity: 0.22, depthWrite: false, side: THREE.DoubleSide, blending: THREE.AdditiveBlending, fog: false }));
    this.beacon.visible = false; this.beacon.renderOrder = 7; G.scene.add(this.beacon);
    Guide.init();
  },
  applyLang() {
    LANG = Settings.v.lang;
    const lg = LANGS.find((x) => x.id === LANG) || LANGS[0];
    document.documentElement.lang = LANG;
    document.documentElement.classList.toggle('rtl', !!lg.rtl);
    for (const el of document.querySelectorAll('[data-en]')) el.textContent = L(el.dataset.en, el.dataset.te);
    const tp = this.el('tpitch'); if (tp) tp.textContent = L('Start with ₹50,000, one acre of red soil and a pair of bullocks in Ramapuram. Grow it into an agricultural company.', '₹50,000, ఒక ఎకరం ఎర్ర నేల, ఒక ఎడ్ల జతతో రామాపురంలో మొదలుపెట్టండి. దాన్ని వ్యవసాయ కంపెనీగా ఎదిగించండి.');
    const tc = this.el('tcredit'); if (tc) tc.textContent = L('Prototype build · the world, sound and music are generated live in your browser.', 'ప్రోటోటైప్ · ప్రపంచం, శబ్దాలు, సంగీతం మీ బ్రౌజర్‌లోనే తయారవుతాయి.');
    this.buildTools(); this.dirty = true; Interact.promptKey = '';
    if (this.sheetState && this.sheetState.rerender) this.sheetState.rerender();
    if (Map2.baseCanvas) Map2.labelsDirty = true;
  },
  // ---------- toasts ----------
  toast(msg, kind = 'info') {
    if (!G.started) return;
    if (Sim.skipping && (kind === 'info' || kind === 'warn')) return;
    const box = this.el('toasts'); if (!box) return;
    const t = h('div', { class: 'toast ' + kind, role: 'status' }, msg);
    box.appendChild(t);
    while (box.children.length > 4) box.removeChild(box.firstChild);
    setTimeout(() => { t.style.transition = 'opacity .5s'; t.style.opacity = '0'; setTimeout(() => t.remove(), 520); }, kind === 'tip' ? 9000 : kind === 'season' || kind === 'mission' ? 5200 : 4200);
  },
  toastOnce(key, msg, kind) { const now = performance.now(); if (this.toastKeys[key] && now - this.toastKeys[key] < 15000) return; this.toastKeys[key] = now; this.toast(msg, kind); },
  moneyFlash(n) { const m = this.el('money'); if (!m) return; m.classList.remove('up', 'down'); void m.offsetWidth; m.classList.add(n >= 0 ? 'up' : 'down'); clearTimeout(this._mf); this._mf = setTimeout(() => m.classList.remove('up', 'down'), 900); this.dirty = true; },
  news(n) { const bar = this.el('newsbar'); if (!bar || !G.started) return; this.el('newstext').textContent = LN(n); bar.hidden = false; clearTimeout(this._nt); this._nt = setTimeout(() => { bar.hidden = true; }, 14000); },
  // floating "+N" feedback while working a field
  workPulse(op, n) {
    const el = this.el('workpulse'); if (!el) return;
    const now = performance.now();
    this._wpN = this._wpOp === op && now - (this._wpT || 0) < 1200 ? this._wpN + n : n;
    this._wpOp = op; this._wpT = now;
    const names = { plough: L('Ploughing', 'దున్నుతున్నారు'), cultivate: L('Ploughing', 'దున్నుతున్నారు'), sow: L('Sowing', 'విత్తుతున్నారు'), fertilize: L('Fertilizing', 'ఎరువు వేస్తున్నారు'), spray: L('Spraying', 'పిచికారీ'), weed: L('Weeding', 'కలుపు తీస్తున్నారు'), harvest: L('Harvesting', 'కోస్తున్నారు') };
    el.textContent = `${names[op] || ''} +${this._wpN}`;
    if (now - (this._wpAnim || 0) > 450) { this._wpAnim = now; el.classList.remove('go'); void el.offsetWidth; el.classList.add('go'); }
  },
  // seeds / fertilizer / pesticide delivered to the field in one tap
  quickBuy(need) {
    const f = need && need.field; const acres = f ? Math.max(1, Math.ceil(f.acres - 0.05)) : 1; const FEE = 50;
    const buy = (k, n) => {
      const price = Market.itemPrice(k) * n + FEE;
      if (!Money.spend(price, 'shop')) return;
      Inv.add(k, n); Audio2.sfx('cash'); Bus.emit('bought', { item: k, qty: n });
      if (k.startsWith('seed_')) { Player.opt.seeds = k.slice(5); if (f && !f.crop) f.plannedCrop = k.slice(5); }
      this.toast(L(`${Inv.name(k)} delivered: ${n} for ${fmtINR(price)}. Hold Work on your field.`, `${Inv.name(k)} అందింది: ${n}, ${fmtINR(price)}. పొలంలో 'పని' పట్టుకోండి.`), 'good');
      Player.need = null; this.refreshTools(); this.close();
    };
    this.sheet({ title: L('Quick delivery to your field', 'మీ పొలానికి త్వరిత డెలివరీ'), sub: L(`Srinu sends it right away · ₹${FEE} delivery`, `శ్రీను వెంటనే పంపిస్తాడు · డెలివరీ ₹${FEE}`), narrow: true, render: (b) => {
      const o = h('div', { class: 'opts' });
      if (need.item === 'seed') {
        const s = Time.season(); const score = (c) => CROPS[c].season[s] * (f ? CROPS[c].soil[f.soil] || 1 : 1);
        const list = CROP_IDS.slice().sort((a, c) => score(c) - score(a));
        const pc = f && f.plannedCrop; if (pc && list.includes(pc)) { list.splice(list.indexOf(pc), 1); list.unshift(pc); }
        b.appendChild(h('p', { class: 'empty', style: { paddingTop: '0' } }, L(`Seeds for ${acres} acre${acres > 1 ? 's' : ''}. The top crops suit this season and soil best.`, `${acres} ఎకరాలకు విత్తనాలు. పైన ఉన్న పంటలు ఈ సీజన్‌కు, నేలకు బాగా సరిపోతాయి.`)));
        list.forEach((c, i) => { const k = 'seed_' + c; const sc = score(c); o.appendChild(h('button', { class: 'btn ' + (i === 0 ? 'acc' : 'alt'), onclick: () => buy(k, acres) }, `${LN(CROPS[c])} ${sc >= 1.05 ? '★★★' : sc >= 0.95 ? '★★' : '★'} · ${CROPS[c].days} ${L('days', 'రోజులు')} · ${fmtINR(Market.itemPrice(k) * acres + FEE)}`)); });
      } else if (need.item === 'pesticide') {
        o.appendChild(h('button', { class: 'btn acc', onclick: () => buy('pesticide', acres) }, `${LN(ITEMS.pesticide)} × ${acres} · ${fmtINR(Market.itemPrice('pesticide') * acres + FEE)}`));
      } else {
        for (const k of ['urea', 'dap', 'complex', 'organic']) o.appendChild(h('button', { class: 'btn ' + (k === 'urea' ? 'acc' : 'alt'), onclick: () => buy(k, acres) }, `${LN(ITEMS[k])} × ${acres} · +${ITEMS[k].nut} ${L('nutrients', 'పోషకాలు')} · ${fmtINR(Market.itemPrice(k) * acres + FEE)}`));
      }
      b.appendChild(o);
      b.appendChild(h('p', { class: 'empty' }, L('Money: ', 'డబ్బు: ') + fmtINR(G.S.money)));
    } });
  },
  savedFlash() { const s = this.el('savedot'); s.textContent = L('Saved', 'సేవ్ అయింది'); s.style.opacity = '1'; setTimeout(() => (s.style.opacity = '0'), 1400); },
  // ---------- tools ----------
  buildTools() {
    const box = this.el('tools'); if (!box) return; box.innerHTML = '';
    for (const t of TOOLS) {
      // on touch screens the bar shows only the active tool; tapping it opens the rest
      const b = h('button', { class: 'tool' + (Player.tool === t.id ? ' on' : ''), 'aria-label': LN(t), onclick: () => { if (isMobile && !box.classList.contains('open') && Player.tool === t.id) { box.classList.add('open'); Audio2.sfx('click'); return; } box.classList.remove('open'); Player.setTool(t.id); } }, h('em', null, t.key));
      b.insertAdjacentHTML('beforeend', ICON[t.id]); b.appendChild(h('span', null, LN(t)));
      box.appendChild(b);
    }
    this.refreshTools();
  },
  refreshTools() {
    const box = this.el('tools'); if (!box) return;
    [...box.children].forEach((b, i) => b.classList.toggle('on', TOOLS[i].id === Player.tool));
    const o = this.el('toolopt'); const tl = Player.tool;
    if (tl === 'seeds' || tl === 'fert' || tl === 'sprayer') {
      const k = tl === 'seeds' ? 'seed_' + Player.opt.seeds : tl === 'fert' ? Player.opt.fert : Player.opt.sprayer;
      const unit = tl === 'seeds' ? L(' acre packs', ' ఎకరం ప్యాకెట్లు') : tl === 'fert' ? L(' bags', ' బస్తాలు') : L(' L', ' లీ.');
      o.innerHTML = ''; o.append(h('b', null, Inv.name(k)), ' · ' + fmt1(Inv.count(k)) + unit + ' · ', h('span', { class: 'kbd' }, 'Q'), ' ' + L('switch', 'మార్చు'));
      o.hidden = false;
    } else { o.innerHTML = ''; o.append(L('Hold ', 'పట్టుకోండి '), h('span', { class: 'kbd' }, isMobile ? L('Work', 'పని') : 'F'), tl === 'auto' ? L(' on your field: it ploughs, sows, feeds and harvests by itself', ' మీ పొలంలో: దున్నడం, విత్తడం, ఎరువు, కోత అన్నీ తానే చేస్తుంది') : L(' on your field', ' మీ పొలంలో')); o.hidden = isMobile && tl === 'auto'; }
    const tbG = this.el('tbG'); if (tbG) tbG.hidden = false;
  },
  setPrompt(list) {
    const p = this.el('prompt');
    if (!list.length || this.photoMode) { p.hidden = true; return; }
    p.hidden = false; p.innerHTML = '';
    p.append(h('kbd', null, isMobile ? L('Tap', 'తాకండి') : 'E'), h('span', null, list[0].label()));
    if (list.length > 1) p.append(h('span', { class: 'more' }, L(`+${list.length - 1} more`, `+${list.length - 1} ఇంకా`)));
  },
  // ---------- HUD update ----------
  // the coach strip while "Do it" is running: what is happening, and a Stop button
  // "Do it for me" started or stopped: redraw the mission card (it shows what the helper is doing)
  autoStatus() { this._mKey = ''; this.dirty = true; if (!Auto.on) Coach.key = ''; },
  // put the tips panel to the left of the mission card, or under it when there is no room
  placeTip() {
    const tip = this.el('howtip'), mb = this.el('missions'); if (!tip || tip.hidden || !mb) return;
    const r = mb.getBoundingClientRect(); const W = innerWidth;
    tip.style.top = ''; tip.style.left = ''; tip.style.right = ''; tip.style.width = '';
    if (r.left > 250) { const w = Math.min(300, r.left - 24); tip.style.width = w + 'px'; tip.style.left = (r.left - w - 8) + 'px'; tip.style.top = r.top + 'px'; }
    else { const w = Math.min(340, W - 20); tip.style.width = w + 'px'; tip.style.left = Math.max(10, Math.min(W - w - 10, r.left)) + 'px'; tip.style.top = (r.bottom + 6) + 'px'; }
  },
  // set text only when it changed (avoids needless layout work on phones)
  setText(el, txt) { if (el && el._t !== txt) { el._t = txt; el.textContent = txt; } },
  update(dt) {
    this.uiT -= dt; this.mapT -= dt; this.tickT = (this.tickT || 0) - dt;
    if (this.mapT <= 0) { this.mapT = isMobile ? 0.15 : 0.1; if (Settings.v.minimap !== false) Map2.drawMini(); }
    Guide.update();
    // light pillar over the target, seen from far away
    const t = Map2.target(); const P = Player.pos();
    if (t && Math.hypot(t.x - P.x, t.z - P.z) > 30 && !this.photoMode) { this.beacon.visible = true; this.beacon.position.set(t.x, World.groundHeight(t.x, t.z) + 80, t.z); this.beacon.material.color.set(t.wp ? '#7fd3ff' : '#f2b52d'); this.beacon.material.opacity = 0.12 + 0.08 * Math.sin(G.t * 3); }
    else this.beacon.visible = false;
    if (this.uiT > 0 && !this.dirty) return;
    this.uiT = 0.25; this.dirty = false;
    const S = G.S; const Pl = S.player;
    if (!this.moneyHold) this.setText(this.el('money'), fmtINR(S.money));   // held while coins fly in
    this.setText(this.el('pname'), S.player.name);
    this.setText(this.el('prank'), LN(RANKS[S.rank]));
    const setBar = (id, v, col) => { const b = this.el('b' + id); const w = clamp(Math.round(v), 0, 100) + '%'; const c = col || (v < 25 ? 'var(--bad)' : v < 50 ? 'var(--warn)' : 'var(--good)'); if (b._w !== w) { b._w = w; b.style.width = w; } if (b._c !== c) { b._c = c; b.style.background = c; } this.setText(this.el('v' + id), isNaN(v) ? '-' : String(Math.round(v))); };
    setBar('Health', Pl.health); setBar('Energy', Pl.energy, 'var(--accent)');
    const pf = Fields.playerFields(); const grow = pf.filter((f) => f.crop);
    const avgW = pf.length ? pf.reduce((s2, f) => s2 + f.water, 0) / pf.length : NaN; setBar('Water', avgW, 'var(--indigo)');
    const avgH = grow.length ? grow.reduce((s2, f) => s2 + f.health, 0) / grow.length : NaN; setBar('Crop', avgH);
    this.setText(this.el('clock'), Time.fmtClock());
    this.setText(this.el('date'), Time.fmtDate());
    const wid = G.S.weather.id; const W = WEATHER[wid];
    const fest = Time.festivalToday();
    const wx = (ICON[W.icon] || '') + `<span>${LN(W)} · ${Math.round(Weather.temp)}°C${G.S.weather.drought ? ' · ' + L('Drought', 'కరువు') : ''}${fest ? ' · ' + LN(fest) : ''}${Weather.powerCut ? ' · ' + L('Power cut', 'కరెంటు లేదు') : ''}</span>`;
    const wxEl = this.el('wx'); if (wxEl._t !== wx) { wxEl._t = wx; wxEl.innerHTML = wx; }
    // market ticker (only when shown, every 2 s)
    const rows = this.el('tkrows');
    if (this.tickT <= 0 && rows.offsetParent !== null) {
      this.tickT = 2; rows.innerHTML = '';
      for (const c of [...CROP_IDS, 'mango']) {
        const tr = Market.trend(c);
        rows.appendChild(h('div', { class: 'tk' }, h('span', null, LN(PRODUCE[c])), h('span', { class: 'p' }, fmtINR(Market.price(c))), h('span', { class: tr > 0.005 ? 'u' : tr < -0.005 ? 'd' : '' }, tr > 0.005 ? '▲' : tr < -0.005 ? '▼' : '•')));
      }
    }
    // mission card (top right): the mission you follow, the one step to do now, and how to do it
    Coach.update();
    const st = Coach.step; const cur = st ? st.m : Coach.current();
    const nAct = S.missions.active.length;
    const tg = Map2.target(); const tgD = tg ? Math.hypot(tg.x - P.x, tg.z - P.z) : 0;
    const howOpen = !!st && (this.howOpen || performance.now() < (this.howUntil || 0));
    const mkey = LANG + '|' + (cur ? cur.uid + ':' + Math.round(clamp01(cur.prog / cur.target) * 50) : '-') + '|' + (st ? st.text + st.icon : '') + '|' + nAct + '|' + (tg && !tg.wp ? Math.round(tgD / 10) : '') + '|' + Auto.on + '|' + howOpen + '|' + !!Settings.v.helper;
    if (mkey !== this._mKey) {
      this._mKey = mkey;
      const mb = this.el('missions'); mb.innerHTML = '';
      if (!cur) mb.append(h('h4', null, L('Missions', 'లక్ష్యాలు')), h('small', null, L('No active missions.', 'ప్రస్తుతం లక్ష్యాలు లేవు.')));
      else {
        const tut = cur.tpl.startsWith('t_');
        mb.appendChild(h('div', { class: 'mhead' }, h('h4', null, tut ? L(`Tutorial ${Math.min(TUTORIAL.length, S.missions.tut + 1)} of ${TUTORIAL.length}`, `శిక్షణ ${Math.min(TUTORIAL.length, S.missions.tut + 1)} / ${TUTORIAL.length}`) : L('Mission', 'లక్ష్యం') + (nAct > 1 ? L(` · ${nAct - 1} more`, ` · ఇంకా ${nAct - 1}`) : '')),
          cur.reward ? h('span', { class: 'rw' }, '+' + fmtShortINR(cur.reward)) : null));
        mb.appendChild(h('b', { class: 'mt' }, LN(cur.title)));
        if (Auto.on) {
          const sp = h('div', { class: 'step auto' }); sp.innerHTML = COACH_ICON[Auto.mode === 'farm' ? 'work' : 'walk'];
          sp.appendChild(h('span', null, Auto.mode === 'farm' ? L(`Working ${Auto.name}…`, `${Auto.name}లో పని చేస్తున్నారు…`) : Auto.name ? L(`Walking to ${Auto.name}…`, `${Auto.name} వైపు నడుస్తున్నారు…`) : L('Walking there…', 'అక్కడికి నడుస్తున్నారు…')));
          mb.appendChild(sp);
        } else if (st) { const sp = h('div', { class: 'step' }); sp.innerHTML = COACH_ICON[st.icon] || COACH_ICON.walk; sp.appendChild(h('span', null, st.text)); mb.appendChild(sp); }
        if (tg && !tg.wp && tg.m === cur) mb.appendChild(h('span', { class: 'go' }, `➜ ${tg.name ? tg.name + ' · ' : ''}${Map2.fmtDist(tgD)}`));
        const row = h('div', { class: 'mrow' });
        if (st && !Auto.on) row.appendChild(h('button', { class: 'how' + (howOpen ? ' on' : ''), type: 'button', onclick: (e) => { e.stopPropagation(); this.howOpen = !howOpen; this.howUntil = 0; Audio2.sfx('click'); this.dirty = true; } }, howOpen ? L('Hide tips', 'చిట్కాలు దాచు') : L('How? ❓', 'ఎలా? ❓')));
        row.appendChild(h('div', { class: 'prog' }, h('b', { style: { width: (clamp01(cur.prog / cur.target) * 100).toFixed(0) + '%' } })));
        mb.appendChild(row);
        // optional helper (Menu → "Do it for me" button): off unless the player turns it on
        if (st && (Settings.v.helper || Auto.on)) mb.appendChild(h('button', { class: 'do' + (Auto.on ? ' stop' : ''), type: 'button', onclick: (e) => { e.stopPropagation(); if (Auto.on) Auto.stop(true); else Auto.doStep(); } }, Auto.on ? L('■ Stop', '■ ఆపు') : L('▶ Do it for me', '▶ నా బదులు చేయి'), isMobile || Auto.on ? null : h('span', { class: 'kbd' }, 'Enter')));
      }
      mb.onclick = () => this.office('missions');
      // "How?" tips: a small panel beside the card (never over the controls)
      const tip = this.el('howtip');
      if (tip) {
        if (howOpen && st && !Auto.on && !this.photoMode) {
          tip.innerHTML = '';
          const ul = h('ul', null); for (const line of Coach.howTo(st)) ul.appendChild(h('li', null, line));
          tip.append(h('div', { class: 'hth' }, h('b', null, L('How to do it', 'ఎలా చేయాలి')), h('button', { class: 'x', type: 'button', 'aria-label': L('Close', 'మూసివేయి'), onclick: (e) => { e.stopPropagation(); this.howOpen = false; this.howUntil = 0; this.dirty = true; this._mKey = ''; } }, '✕')), ul);
          tip.hidden = false; this.placeTip();
        } else tip.hidden = true;
      }
    }
    this.updateBL();
    // the tool hint ("Hold F on your field…") only where it is useful: on your own field
    const to = this.el('toolopt'); const tl = Player.tool;
    if (to && !isMobile && (tl === 'auto' || tl === 'hoe' || tl === 'sickle')) { const fh = fieldAt(P.x, P.z); const hide = !(fh && fh.isPlayer) || !!Player.vehicle; if (to.hidden !== hide) to.hidden = hide; }
    const fpsEl = this.el('fps'); if (fpsEl.hidden === !!Settings.v.fps) fpsEl.hidden = !Settings.v.fps;
  },
  updateBL() {
    const box = this.el('hud-bl'); const v = Player.vehicle;
    const tools = this.el('tools'); const th = !!v || !!this.photoMode; if (tools && tools.hidden !== th) tools.hidden = th;
    if (v) this.el('toolopt').hidden = true; else if (this._wasInV) this.refreshTools();
    this._wasInV = !!v;
    if (this.photoMode) { box.hidden = true; this._blKey = ''; return; }
    if (v) {
      const kmh = Math.round(Math.abs(v.speed) * 3.6);
      const rows = [];
      if (v.def.fuelCap > 0) rows.push([L('Diesel', 'డీజిల్'), `${fmt1(v.fuel)} / ${v.def.fuelCap} L`]);
      if (v.def.fuelCap > 0 || v.type === 'harvester') rows.push([L('Condition', 'స్థితి'), Math.round(v.cond) + '%']);
      if (v.impl) rows.push([L('Implement', 'పనిముట్టు'), LN(IMPLEMENTS[v.impl]) + (IMPLEMENTS[v.impl].op ? (v.lowered ? L(' · lowered', ' · దించారు') : L(' · raised', ' · ఎత్తారు')) : '')]);
      if (v.type === 'harvester') rows.push([L('Header', 'హెడర్'), v.lowered ? L('Lowered — harvesting', 'దించారు — కోస్తోంది') : L('Raised', 'ఎత్తారు')]);
      if (v.impl === 'seeddrill' && v.sowCrop) rows.push([L('Sowing', 'విత్తుతోంది'), `${LN(CROPS[v.sowCrop])} (${fmt1(Inv.count('seed_' + v.sowCrop))})`]);
      if (v.impl === 'sprayer') rows.push([L('Tank', 'ట్యాంక్'), `${LN(ITEMS[v.chem])} (${fmt1(Inv.count(v.chem))} L)`]);
      if (v.impl === 'spreader') rows.push([L('Hopper', 'హాపర్'), `${LN(ITEMS[v.fert])} (${fmt1(Inv.count(v.fert))})`]);
      if (v.impl === 'tanker') rows.push([L('Water', 'నీరు'), Math.round(v.tank) + '%']);
      if (v.cargoCap > 0) rows.push([L('Cargo', 'సరుకు'), `${fmt1(v.cargoQty)} / ${v.cargoCap} q${v.cargo[0] ? ' ' + LN(PRODUCE[v.cargo[0].crop]) : ''}`]);
      const rent = v.rentUntil ? L('Rented ', 'అద్దె ') + Math.max(0, Math.round((v.rentUntil - Time.totalMin()) / 60 * 10) / 10) + L(' h', ' గం.') : '';
      const hint = isMobile ? '' : v.impl && IMPLEMENTS[v.impl].op || v.type === 'harvester' ? L('G lower/raise · E get off', 'G దించు/ఎత్తు · E దిగు') : L('E get off · H horn · L lights', 'E దిగు · H హారన్ · L లైట్లు');
      const key = 'v|' + v.label() + kmh + rent + rows.join() + hint;
      box.hidden = false;
      if (key === this._blKey) return;
      this._blKey = key; box.innerHTML = '';
      box.appendChild(h('h5', null, h('span', null, v.label()), rent ? h('span', { class: 'chip warn' }, rent) : null));
      box.appendChild(h('div', { id: 'speedo' }, String(kmh), h('small', null, 'km/h')));
      const kv = h('div', { class: 'kv' }); for (const [a, b] of rows) kv.append(h('span', null, a), h('span', null, b)); box.appendChild(kv);
      if (hint) box.appendChild(h('small', { style: { color: 'var(--ink-2)' } }, hint));
      return;
    }
    const P = Player.pos();
    const f = fieldAt(P.x, P.z) || Fields.nearest(P.x, P.z, (q) => q.isPlayer && Math.hypot(q.x - P.x, q.z - P.z) < Math.hypot(q.w, q.d) / 2 + 6);
    if (f && (f.isPlayer || fieldAt(P.x, P.z))) {
      const own = f.owner === 'player' ? L('Owned', 'సొంతం') : f.owner === 'lease' ? L('Leased', 'కౌలు') : f.avail ? (f.avail === 'lease' ? L('For lease', 'కౌలుకు') : L('For sale', 'అమ్మకానికి')) : L('Neighbour\'s field', 'పొరుగువారి పొలం');
      const sub = `${fmt1(f.acres)} ${L('acres', 'ఎకరాలు')} · ${LN(SOILS[f.soil])}${f.borewell ? ' · ' + L('Borewell', 'బోరు') : ''}${f.canal ? ' · ' + L('Canal', 'కాలువ') : ''}`;
      let line = '', stats = [], heap = '';
      if (f.isPlayer) {
        const cd = f.crop ? CROPS[f.crop] : null;
        line = f.crop ? `${LN(CROPS[f.crop])} · ${LN(f.stageName())} · ${Math.round(f.growth * 100)}%` : `${L('Ploughed', 'దున్నింది')} ${Math.round(f.countMin(1) / f.n * 100)}% · ${L('Seedbed', 'సిద్ధం')} ${Math.round(f.countMin(2) / f.n * 100)}%`;
        stats = [[L('Water', 'నీరు'), f.water, cd && f.water < cd.wLo, 'var(--indigo)'], [L('Nutr.', 'పోషకం'), f.nut, f.nut < 25], [L('Weeds', 'కలుపు'), f.weeds, f.weeds > 30], [L('Pests', 'పురుగు'), f.pests, f.pests > 15], [L('Health', 'ఆరోగ్యం'), f.crop ? f.health : 100, f.health < 50]];
        if (f.heap) heap = L('Heap: ', 'కుప్ప: ') + `${fmt1(f.heap.qty)} q ${LN(PRODUCE[f.heap.crop])} (${L('grade', 'గ్రేడ్')} ${Market.qualityLabel(f.heap.q)})`;
      }
      const key = 'f|' + f.id + own + sub + line + stats.map((r) => r[0] + Math.round(r[1]) + r[2]).join() + heap;
      box.hidden = false;
      if (key === this._blKey) return;
      this._blKey = key; box.innerHTML = '';
      box.appendChild(h('h5', null, h('span', null, f.label()), h('span', { class: 'chip' + (f.isPlayer ? ' good' : '') }, own)));
      box.appendChild(h('small', { style: { color: 'var(--ink-2)' } }, sub));
      if (f.isPlayer) {
        box.appendChild(h('div', { style: { fontWeight: f.crop ? 700 : 600 } }, line));
        const mini = h('div', { class: 'mini' });
        for (const [k, val, bad, col2] of stats) mini.append(h('div', null, k, h('b', null, Math.round(val) + '%'), h('div', { class: 'mb' }, h('i', { style: { width: clamp(val, 0, 100) + '%', background: bad ? 'var(--bad)' : col2 || 'var(--good)' } }))));
        box.appendChild(mini);
        if (heap) box.appendChild(h('small', null, heap));
      }
      return;
    }
    box.hidden = true; this._blKey = '';
  },
  // ---------- modal sheets ----------
  modalOpen() { return !this.el('modal').hidden || HudEdit.on; },
  close() {
    const m = this.el('modal'); m.hidden = true; m.innerHTML = '';
    const st = this.sheetState; this.sheetState = null; this.actionList = null;
    if (st && st.onClose) st.onClose();
    Audio2.sfx('click');
  },
  sheet(o) {
    const m = this.el('modal'); m.innerHTML = ''; m.hidden = false; this.actionList = null;
    const head = h('header', null, h('div', { style: { minWidth: 0 } }, h('h2', null, o.title), o.sub ? h('p', null, o.sub) : null), h('button', { class: 'x', 'aria-label': L('Close', 'మూసివేయి'), onclick: () => this.close() }, '✕'));
    const tabs = h('div', { class: 'tabs', role: 'tablist' });
    const body = h('div', { class: 'body' });
    const sh = h('div', { class: 'sheet' + (o.narrow ? ' narrow' : '') + (o.wide ? ' wide' : '') + (o.cls ? ' ' + o.cls : ''), role: 'dialog', 'aria-label': o.title }, head, o.tabs && o.tabs.length > 1 ? tabs : h('div', { class: 'ikat', style: { margin: '0 18px 10px' } }), body);
    m.appendChild(sh);
    m.onclick = (e) => { if (e.target === m) this.close(); };
    const st = { kind: o.kind, onClose: o.onClose, tab: o.tab || (o.tabs ? o.tabs[0].id : null) };
    const render = () => {
      body.innerHTML = '';
      if (o.tabs) {
        tabs.innerHTML = '';
        for (const t of o.tabs) tabs.appendChild(h('button', { class: st.tab === t.id ? 'on' : '', role: 'tab', onclick: () => { st.tab = t.id; render(); Audio2.sfx('click'); } }, t.label()));
        const t = o.tabs.find((x) => x.id === st.tab) || o.tabs[0]; t.render(body);
      } else o.render(body);
      if (o.titleFn) head.querySelector('h2').textContent = o.titleFn();
    };
    st.rerender = render;
    this.sheetState = st;
    render();
    return st;
  },
  rerender() { if (this.sheetState && this.sheetState.rerender) this.sheetState.rerender(); },
  btn(label, fn, cls = '', dis = false) { return h('button', { class: 'btn ' + cls, disabled: dis, onclick: () => { Audio2.sfx('click'); fn(); this.rerender(); this.dirty = true; } }, label); },
  // ---------- generic pickers ----------
  actionMenu(list) {
    this.sheet({ title: L('What would you like to do?', 'ఏమి చేయాలనుకుంటున్నారు?'), narrow: true, kind: 'actions', render: (b) => {
      const opts = h('div', { class: 'opts' });
      list.forEach((o, i) => opts.appendChild(h('button', { class: 'btn ' + (o.id === 'exit' ? 'alt' : ''), onclick: () => { this.close(); o.act(); } }, h('span', { class: 'kbd', style: { marginRight: '8px' } }, String(i + 1)), o.label())));
      b.appendChild(opts);
    } });
    this.actionList = list;
  },
  chooseFrom(title, list, cb) {
    this.sheet({ title, narrow: true, render: (b) => { const o = h('div', { class: 'opts' }); for (const it of list) o.appendChild(h('button', { class: 'btn alt', onclick: () => { this.close(); cb(it.id); } }, it.label)); b.appendChild(o); } });
  },
  chooseCrop(field, cb) {
    this.sheet({ title: L('Which crop will you sow?', 'ఏ పంట విత్తుతారు?'), sub: field ? `${field.label()} · ${LN(SOILS[field.soil])}` : '', narrow: true, render: (b) => {
      const o = h('div', { class: 'opts' });
      for (const c of CROP_IDS) {
        const cd = CROPS[c]; const n = Inv.count('seed_' + c); const s = cd.season[Time.season()]; const soil = field ? cd.soil[field.soil] : 1;
        o.appendChild(h('button', { class: 'btn alt', disabled: n <= 0.001, onclick: () => { this.close(); cb(c); } }, `${LN(cd)} — ${fmt1(n)} ${L('acre packs', 'ఎకరం ప్యాకెట్లు')} · ${L('season', 'సీజన్')} ${s >= 1 ? '★★' : s >= 0.9 ? '★' : '–'} · ${L('soil', 'నేల')} ${soil >= 1.05 ? '★★' : soil >= 1 ? '★' : '–'}`));
      }
      b.appendChild(o);
      b.appendChild(h('p', { class: 'empty' }, L("Buy seeds at Srinu's shop at the village crossroads.", 'గ్రామ కూడలిలోని శ్రీను దుకాణంలో విత్తనాలు కొనండి.')));
    } });
  },
  implementMenu(v) {
    const S = G.S;
    const list = v.type === 'bullock' ? ['bcart', 'bplough'] : ['none', ...S.implements];
    this.sheet({ title: L('Change implement', 'పనిముట్టు మార్చండి'), sub: v.label(), narrow: true, render: (b) => {
      const o = h('div', { class: 'opts' });
      for (const id of list) {
        if (id === 'none') { o.appendChild(h('button', { class: 'btn alt', onclick: () => { if (v.cargoQty > 0.05) { this.toast(L('Unload the trailer first.', 'ముందు ట్రాలీ ఖాళీ చేయండి.'), 'warn'); return; } v.detach(); this.close(); } }, L('Detach implement', 'పనిముట్టు తీసేయండి'))); continue; }
        const I = IMPLEMENTS[id];
        o.appendChild(h('button', { class: 'btn ' + (v.impl === id ? 'acc' : 'alt'), onclick: () => { if (v.cargoQty > 0.05 && id !== v.impl) { this.toast(L('Unload the cargo first.', 'ముందు సరుకు దించండి.'), 'warn'); return; } v.attach(id); this.close(); Audio2.sfx('load'); Bus.emit('attach', { id }); } }, `${LN(I)}${I.op ? ' · ' + L('work width ', 'పని వెడల్పు ') + I.width + ' m' : ''}${I.cargo ? ' · ' + I.cargo + ' q' : ''}`));
      }
      if (v.type !== 'bullock' && !S.implements.length) o.appendChild(h('p', { class: 'empty' }, L("You don't own any implements yet. Buy them at Bhaskar's workshop.", 'మీ దగ్గర పనిముట్లు లేవు. భాస్కర్ వర్క్‌షాప్‌లో కొనండి.')));
      b.appendChild(o);
    } });
  },
  // ---------- home & storage ----------
  homeMenu() {
    const S = G.S; const hr = Time.hour();
    const night = hr >= 16;   // late afternoon: sleep through to the next morning
    const list = [
      { id: 'sleep', label: () => night ? L('Sleep until tomorrow morning', 'రేపు ఉదయం వరకు నిద్రపోండి') : L('Rest for 2 hours', '2 గంటలు విశ్రాంతి'), act: () => Sim.sleep(night) },
      { id: 'office', label: () => L('Open the farm office', 'వ్యవసాయ కార్యాలయం తెరవండి'), act: () => this.office() },
      { id: 'store', label: () => L('Storage & supplies', 'నిల్వ & సామాగ్రి'), act: () => this.office('storage') },
      { id: 'save', label: () => L('Save game', 'ఆట సేవ్ చేయండి'), act: () => SaveSys.save(true) },
    ];
    if (!S.pet) list.splice(1, 0, { id: 'pet', label: () => L('Adopt a puppy (free) 🐶', 'కుక్కపిల్లను తెచ్చుకోండి (ఉచితం) 🐶'), act: () => Pet.menu() });
    this.actionMenu(list);
  },
  storageMenu(v) {
    const S = G.S;
    this.sheet({ title: L('Farm storage', 'వ్యవసాయ నిల్వ'), sub: `${v.label()} · ${fmt1(v.cargoQty)}/${v.cargoCap} q`, narrow: true, render: (b) => {
      b.appendChild(h('div', { class: 'sec' }, L('In the vehicle', 'వాహనంలో')));
      if (!v.cargo.length) b.appendChild(h('p', { class: 'empty' }, L('Empty.', 'ఖాళీ.')));
      for (const c of v.cargo) b.appendChild(h('div', { class: 'row' }, h('span', null, `${LN(PRODUCE[c.crop])} · ${fmt1(c.qty)} q · ${L('grade', 'గ్రేడ్')} ${Market.qualityLabel(c.q)}`)));
      if (v.cargo.length) b.appendChild(h('div', { class: 'row' }, this.btn(L('Unload all into storage', 'అంతా నిల్వలో దించండి'), () => {
        let moved = 0; for (const c of v.cargo) { const m = Storage.add(c.crop, c.qty, c.q); c.qty -= m; moved += m; }
        v.cargo = v.cargo.filter((c) => c.qty > 0.05);
        this.toast(moved > 0 ? L(`Stored ${fmt1(moved)} q.`, `${fmt1(moved)} క్వి. నిల్వ చేశారు.`) : L('Storage is full. Build a warehouse.', 'నిల్వ నిండిపోయింది. గోదాము కట్టండి.'), moved > 0 ? 'good' : 'warn'); Audio2.sfx('load');
      }, 'acc')));
      b.appendChild(h('div', { class: 'sec' }, L('In storage', 'నిల్వలో') + ` · ${fmt1(Storage.used(false))}/${Storage.cap()} q` + (Storage.coldCap() ? ` · ${L('cold', 'కోల్డ్')} ${fmt1(Storage.used(true))}/${Storage.coldCap()} q` : '')));
      if (!S.storage.length) b.appendChild(h('p', { class: 'empty' }, L('Nothing stored.', 'నిల్వలో ఏమీ లేదు.')));
      const crops = [...new Set(S.storage.map((e) => e.crop))];
      for (const c of crops) {
        const tot = Storage.total(c);
        b.appendChild(h('div', { class: 'row', style: { justifyContent: 'space-between', margin: '6px 0' } }, h('span', null, `${LN(PRODUCE[c])} · ${fmt1(tot)} q`), h('span', { class: 'row' },
          this.btn(L('Load 10 q', '10 క్వి. ఎక్కించు'), () => this.loadFromStorage(v, c, 10), 'sm alt'),
          this.btn(L('Load max', 'పూర్తిగా ఎక్కించు'), () => this.loadFromStorage(v, c, 1e9), 'sm'))));
      }
    } });
  },
  loadFromStorage(v, crop, qty) {
    const room = v.cargoCap - v.cargoQty; if (room < 0.05) { this.toast(L('Vehicle is full.', 'వాహనం నిండింది.'), 'warn'); return; }
    if (v.cargo.length && v.cargo[0].crop !== crop) { this.toast(L('Unload the other crop first.', 'ముందు వేరే పంట దించండి.'), 'warn'); return; }
    const got = Storage.take(crop, Math.min(qty, room)); if (got.qty <= 0) return;
    if (v.cargo.length) { const c = v.cargo[0]; c.q = (c.q * c.qty + got.q * got.qty) / (c.qty + got.qty); c.qty += got.qty; } else v.cargo.push({ crop, qty: got.qty, q: got.q });
    Audio2.sfx('load');
  },
  heapMenu(f) {
    const hp = f.heap; if (!hp) return;
    const p = Market.price(hp.crop);
    this.sheet({ title: L('Harvest heap', 'పంట కుప్ప'), sub: `${f.label()} · ${fmt1(hp.qty)} q ${LN(PRODUCE[hp.crop])} · ${L('grade', 'గ్రేడ్')} ${Market.qualityLabel(hp.q)}`, narrow: true, render: (b) => {
      b.appendChild(h('p', null, L(`The village trader offers ${fmtINR(Math.round(p * hp.q * 0.88))}/q right here (88% of the yard price ${fmtINR(p)}). Or load it into your cart or trailer and sell at the market yard yourself.`, `గ్రామ వ్యాపారి ఇక్కడే క్వింటాలుకు ${fmtINR(Math.round(p * hp.q * 0.88))} ఇస్తాడు (యార్డు ధర ${fmtINR(p)}లో 88%). లేదా బండిలో ఎక్కించి మార్కెట్ యార్డులో మీరే అమ్మండి.`)));
      const fee = Services.lorryFee(hp.qty); const yardNet = Math.round(p * hp.q * hp.qty * 0.99 - 10 * hp.qty - fee);
      const opts = h('div', { class: 'opts' });
      opts.appendChild(this.btn(L(`Send to the market yard by lorry (about ${fmtINR(yardNet)})`, `లారీలో మార్కెట్ యార్డుకు పంపండి (సుమారు ${fmtINR(yardNet)})`), () => { Services.lorryHeap(f, 'yard'); this.close(); }, 'acc'));
      const cd = CROPS[hp.crop];
      if (cd && cd.msp && Market.procurementOpen(hp.crop) && hp.q >= 0.99) opts.appendChild(this.btn(L(`Send to the MSP centre by lorry (about ${fmtINR(Math.round(cd.msp * hp.qty - fee))}, paid in 2 days)`, `లారీలో మద్దతు ధర కేంద్రానికి (సుమారు ${fmtINR(Math.round(cd.msp * hp.qty - fee))}, 2 రోజుల్లో)`), () => { Services.lorryHeap(f, 'msp'); this.close(); }, 'alt'));
      opts.appendChild(this.btn(L(`Sell all to trader now (${fmtINR(Math.round(p * hp.q * 0.88 * hp.qty))})`, `ఇప్పుడే వ్యాపారికి అమ్మండి (${fmtINR(Math.round(p * hp.q * 0.88 * hp.qty))})`), () => { Services.sellHeapToTrader(f); this.close(); }, 'alt'));
      b.appendChild(opts);
      if (Storage.cap() - Storage.used(false) > 0.1 && Math.hypot(f.heapSpot.x - YARD_PT.x, f.heapSpot.z - YARD_PT.z) < 70) b.appendChild(h('div', { class: 'row', style: { marginTop: '8px' } }, this.btn(L('Carry it home to storage', 'ఇంటి నిల్వకు తరలించండి'), () => { const m = Storage.add(hp.crop, hp.qty, hp.q); hp.qty -= m; if (hp.qty < 0.05) f.heap = null; f.heapDirty = true; this.close(); this.toast(L(`Moved ${fmt1(m)} q to storage.`, `${fmt1(m)} క్వి. నిల్వకు తరలించారు.`), 'good'); }, 'alt')));
    } });
  },
  landMenu(f) {
    this.sheet({ title: f.label(), sub: `${fmt1(f.acres)} ${L('acres', 'ఎకరాలు')} · ${LN(SOILS[f.soil])}${f.canal ? ' · ' + L('canal-fed', 'కాలువ నీరు') : ''}${f.hasNpcBore ? ' · ' + L('has a borewell', 'బోరు ఉంది') : ''}`, narrow: true, render: (b) => {
      const best = CROP_IDS.filter((c) => CROPS[c].soil[f.soil] >= 1.05).map((c) => LN(CROPS[c])).join(', ');
      b.appendChild(h('p', null, L(`Best crops for this soil: ${best}.`, `ఈ నేలకు మంచి పంటలు: ${best}.`)));
      const row = h('div', { class: 'row' });
      if (f.avail === 'sale' || f.avail === 'both') row.appendChild(this.btn(L(`Buy for ${fmtShortINR(f.landPrice)}`, `${fmtShortINR(f.landPrice)}కు కొనండి`), () => { Farm.buyField(f); this.close(); }, 'acc', G.S.money < f.landPrice));
      row.appendChild(this.btn(L(`Lease 2 seasons for ${fmtINR(f.leasePrice)}`, `2 సీజన్లకు కౌలు ${fmtINR(f.leasePrice)}`), () => { Farm.leaseField(f); this.close(); }, '', G.S.money < f.leasePrice));
      b.appendChild(row);
      b.appendChild(h('p', { class: 'empty' }, L('Need money? The cooperative bank in Nagaram gives crop loans at 7% a year.', 'డబ్బు కావాలా? నగరంలోని సహకార బ్యాంకు 7% వార్షిక వడ్డీకి పంట రుణాలు ఇస్తుంది.')));
    } });
  },
  // ---------- shops ----------
  foodMenu(keys, title) {
    this.sheet({ title, narrow: true, render: (b) => {
      const g = h('div', { class: 'grid' });
      for (const k of keys) { const F = FOODS[k]; g.appendChild(h('div', { class: 'item' }, h('h3', null, LN(F), h('span', { class: 'price' }, fmtINR(F.price))), h('p', null, L(`Energy +${F.energy}${F.health ? `, health +${F.health}` : ''}`, `శక్తి +${F.energy}${F.health ? `, ఆరోగ్యం +${F.health}` : ''}`)), h('div', { class: 'row' }, this.btn(L('Buy', 'కొనండి'), () => Services.eat(k), 'acc')))); }
      b.appendChild(g);
      b.appendChild(h('p', { class: 'empty' }, L(`Energy ${Math.round(G.S.player.energy)} · Health ${Math.round(G.S.player.health)}`, `శక్తి ${Math.round(G.S.player.energy)} · ఆరోగ్యం ${Math.round(G.S.player.health)}`)));
    } });
  },
  buyItem(k, n) {
    const price = Market.itemPrice(k) * n;
    if (ITEMS[k] && ITEMS[k].once && G.S.flags.safety) { this.toast(L('You already have one.', 'మీ దగ్గర ఇప్పటికే ఉంది.'), 'info'); return; }
    if (!Money.spend(price, 'shop')) return;
    if (k === 'safety') G.S.flags.safety = true; else Inv.add(k, n);
    Audio2.sfx('cash'); Bus.emit('bought', { item: k, qty: n });
    if (k.startsWith('seed_')) Rel.add('srinu', 1);
    this.refreshTools();
  },
  shop(kind) {
    const isSeed = kind === 'seed';
    this.sheet({ title: isSeed ? L("Srinu's seeds & fertilizers", 'శ్రీను విత్తనాలు & ఎరువులు') : L('Mallesh kirana', 'మల్లేష్ కిరాణం'), sub: L('Prices change with the season and the news.', 'ధరలు సీజన్, వార్తలతో మారుతాయి.'), kind: 'shop', render: (b) => {
      if (isSeed) {
        b.appendChild(h('div', { class: 'sec' }, L('Seeds (one pack sows one acre)', 'విత్తనాలు (ఒక ప్యాకెట్ = ఒక ఎకరం)')));
        const g = h('div', { class: 'grid' });
        for (const c of CROP_IDS) {
          const cd = CROPS[c]; const k = 'seed_' + c; const p = Market.itemPrice(k); const s = cd.season[Time.season()];
          g.appendChild(h('div', { class: 'item' }, h('h3', null, LN(cd), h('span', { class: 'price' }, fmtINR(p))),
            h('p', null, L(`${cd.days} days · ~${cd.yield} q/acre · market ${fmtINR(Market.price(c))}/q`, `${cd.days} రోజులు · ~${cd.yield} క్వి./ఎకరం · ధర ${fmtINR(Market.price(c))}/క్వి.`)),
            h('p', null, L(`Water ${cd.water > 2 ? 'very high' : cd.water > 1.4 ? 'medium' : 'low'} · pest risk ${cd.pest >= 0.9 ? 'high' : cd.pest >= 0.6 ? 'medium' : 'low'} · ${s >= 1 ? 'in season' : s >= 0.9 ? 'okay this season' : 'off season'}`, `నీరు ${cd.water > 2 ? 'చాలా ఎక్కువ' : cd.water > 1.4 ? 'మధ్యస్థం' : 'తక్కువ'} · పురుగు ${cd.pest >= 0.9 ? 'ఎక్కువ' : cd.pest >= 0.6 ? 'మధ్యస్థం' : 'తక్కువ'} · ${s >= 1 ? 'సీజన్‌లో' : s >= 0.9 ? 'ఫర్వాలేదు' : 'సీజన్ కాదు'}`)),
            h('div', { class: 'row' }, h('span', { class: 'chip' }, L('Have ', 'ఉన్నవి ') + fmt1(Inv.count(k))), this.btn('+1', () => this.buyItem(k, 1), 'sm acc'), this.btn('+3', () => this.buyItem(k, 3), 'sm'), this.btn('+5', () => this.buyItem(k, 5), 'sm alt'))));
        }
        b.appendChild(g);
      }
      b.appendChild(h('div', { class: 'sec' }, isSeed ? L('Fertilizers, pesticides & gear', 'ఎరువులు, పురుగుమందులు & రక్షణ') : L('Supplies', 'సామాగ్రి')));
      const g2 = h('div', { class: 'grid' });
      for (const k in ITEMS) {
        const it = ITEMS[k]; if ((isSeed && it.shop !== 'seed') || (!isSeed && it.shop !== 'kirana')) continue;
        const p = Market.itemPrice(k);
        const desc = it.kind === 'fert' ? L(`+${it.nut} nutrients per acre${it.soil ? ', builds soil health' : ''}`, `ఎకరానికి +${it.nut} పోషకాలు${it.soil ? ', నేల ఆరోగ్యం పెంచుతుంది' : ''}`) : k === 'pesticide' ? L('Kills pests on 1 acre', '1 ఎకరంలో పురుగులను చంపుతుంది') : k === 'herbicide' ? L('Clears weeds on 1 acre', '1 ఎకరంలో కలుపు తొలగిస్తుంది') : k === 'safety' ? L('No health loss while spraying', 'పిచికారీ చేసేటప్పుడు ఆరోగ్యం తగ్గదు') : k === 'feed' ? L('Keeps dairy buffaloes in milk', 'పాడి గేదెలకు దాణా') : k === 'diesel' ? L('Refuel anywhere: 20 L', 'ఎక్కడైనా 20 లీ. నింపుకోవచ్చు') : '';
        const have = k === 'safety' ? (G.S.flags.safety ? L('Owned', 'ఉంది') : '-') : fmt1(Inv.count(k));
        g2.appendChild(h('div', { class: 'item' }, h('h3', null, LN(it), h('span', { class: 'price' }, fmtINR(p))), h('p', null, `${LN(it.unit)} · ${desc}`),
          h('div', { class: 'row' }, h('span', { class: 'chip' }, L('Have ', 'ఉన్నవి ') + have), this.btn('+1', () => this.buyItem(k, 1), 'sm acc'), it.once ? null : this.btn('+5', () => this.buyItem(k, 5), 'sm'),
            k === 'diesel' && Player.vehicle ? this.btn(L('Pour into vehicle', 'వాహనంలో పోయండి'), () => Services.useCan(Player.vehicle), 'sm alt') : null)));
      }
      b.appendChild(g2);
      b.appendChild(h('p', { class: 'empty' }, L('Money: ', 'డబ్బు: ') + fmtINR(G.S.money)));
    } });
  },
  workshop() {
    const S = G.S;
    this.sheet({ title: L("Bhaskar's tractor workshop", 'భాస్కర్ ట్రాక్టర్ వర్క్‌షాప్'), sub: L('Rent, buy, repair. Custom hiring for harvests.', 'అద్దె, కొనుగోలు, మరమ్మతు. కోతకు హార్వెస్టర్ సేవ.'), kind: 'workshop', tabs: [
      { id: 'rent', label: () => L('Rent & services', 'అద్దె & సేవలు'), render: (b) => {
        b.appendChild(h('div', { class: 'sec' }, L(`Tractor with implement · 4 hours · ${fmtINR(TRACTOR_RENT_PER_HOUR * 4)}`, `పనిముట్టుతో ట్రాక్టర్ · 4 గంటలు · ${fmtINR(TRACTOR_RENT_PER_HOUR * 4)}`)));
        const g = h('div', { class: 'grid' });
        for (const id of ['rotavator', 'cultivator', 'plough', 'seeddrill', 'sprayer', 'spreader', 'trailer']) { const I = IMPLEMENTS[id]; g.appendChild(h('div', { class: 'item' }, h('h3', null, LN(I)), h('p', null, I.op ? L(`Work width ${I.width} m`, `పని వెడల్పు ${I.width} మీ.`) : L(`Carries ${I.cargo} quintals`, `${I.cargo} క్వింటాళ్లు మోస్తుంది`)), h('div', { class: 'row' }, this.btn(L('Rent', 'అద్దెకు'), () => { Services.rentTractor(id); this.close(); }, 'acc')))); }
        b.appendChild(g);
        b.appendChild(h('div', { class: 'sec' }, L(`Combine harvester service · ${fmtINR(HARVEST_SERVICE_PER_ACRE)}/acre`, `కంబైన్ హార్వెస్టర్ సేవ · ఎకరానికి ${fmtINR(HARVEST_SERVICE_PER_ACRE)}`)));
        const ready = Fields.playerFields().filter((f) => f.crop && f.growth >= 0.97);
        if (!ready.length) b.appendChild(h('p', { class: 'empty' }, L('None of your crops are ready to harvest yet.', 'మీ పంటలేవీ ఇంకా కోతకు సిద్ధం కాలేదు.')));
        for (const f of ready) b.appendChild(h('div', { class: 'row', style: { justifyContent: 'space-between', margin: '6px 0' } }, h('span', null, `${f.label()} · ${LN(CROPS[f.crop])} · ${fmt1(f.acres)} ${L('ac', 'ఎ.')}`), this.btn(L(`Harvest for ${fmtINR(Math.round(HARVEST_SERVICE_PER_ACRE * f.acres))}`, `${fmtINR(Math.round(HARVEST_SERVICE_PER_ACRE * f.acres))}కు కోయించండి`), () => { Services.harvestService(f); this.close(); }, 'acc')));
        b.appendChild(h('div', { class: 'sec' }, L('Spare parts', 'విడిభాగాలు')));
        b.appendChild(h('div', { class: 'row' }, h('span', null, `${LN(ITEMS.pumppart)} · ${fmtINR(Market.itemPrice('pumppart'))} · ${L('have', 'ఉన్నవి')} ${Inv.count('pumppart')}`), this.btn(L('Buy', 'కొనండి'), () => this.buyItem('pumppart', 1), 'sm')));
      } },
      { id: 'buy', label: () => L('Tractors & harvester', 'ట్రాక్టర్లు & హార్వెస్టర్'), render: (b) => this.vehicleShop(b, ['tractor35', 'tractor50', 'harvester']) },
      { id: 'impl', label: () => L('Implements', 'పనిముట్లు'), render: (b) => {
        const g = h('div', { class: 'grid' });
        for (const id of TRACTOR_IMPLEMENTS) { const I = IMPLEMENTS[id]; const own = S.implements.includes(id); g.appendChild(h('div', { class: 'item' }, h('h3', null, LN(I), h('span', { class: 'price' }, fmtINR(I.price))), h('p', null, I.op ? L(`Work width ${I.width} m · up to ${Math.round(I.maxSpeed * 3.6)} km/h`, `పని వెడల్పు ${I.width} మీ. · గంటకు ${Math.round(I.maxSpeed * 3.6)} కి.మీ.`) : L(`Carries ${I.cargo || 0} quintals`, `${I.cargo || 0} క్వింటాళ్లు`)), h('div', { class: 'row' }, own ? h('span', { class: 'chip good' }, L('Owned', 'ఉంది')) : this.btn(L('Buy', 'కొనండి'), () => { if (Money.spend(I.price, 'implement')) { S.implements.push(id); this.toast(L(`${I.en} delivered to your farm.`, `${I.te} మీ పొలానికి చేరింది.`), 'good'); Bus.emit('implBought', { type: id }); } }, 'acc')))); }
        b.appendChild(g);
        b.appendChild(h('p', { class: 'empty' }, L('Attach implements standing next to your tractor (E → Change implement).', 'ట్రాక్టర్ పక్కన నిలబడి పనిముట్టు మార్చండి (E → పనిముట్టు మార్చండి).')));
      } },
      { id: 'repair', label: () => L('Repair & fuel', 'మరమ్మతు & ఇంధనం'), render: (b) => {
        const vs = Vehicles.player.filter((v) => v.def.fuelCap > 0);
        if (!vs.length) b.appendChild(h('p', { class: 'empty' }, L('No motor vehicles yet.', 'ఇంకా మోటారు వాహనాలు లేవు.')));
        for (const v of vs) {
          const near = Math.hypot(v.x - POI.workshop.counter.x, v.z - POI.workshop.counter.z) < 30 || (S.up.garage && Math.hypot(v.x - SLOTS.garage.x, v.z - SLOTS.garage.z) < 25);
          b.appendChild(h('div', { class: 'row', style: { justifyContent: 'space-between', margin: '6px 0' } }, h('span', null, `${v.label()} · ${L('condition', 'స్థితి')} ${Math.round(v.cond)}% · ${L('diesel', 'డీజిల్')} ${fmt1(v.fuel)}/${v.def.fuelCap} L`),
            h('span', { class: 'row' }, this.btn(L('Repair', 'మరమ్మతు'), () => Services.repair(v), 'sm', !near || v.cond > 99), this.btn(L('Fill diesel', 'డీజిల్ నింపు'), () => Services.refuel(v), 'sm alt', !near))));
        }
        b.appendChild(h('p', { class: 'empty' }, L('Bring the vehicle within 30 m of the workshop (or your garage) to service it.', 'సర్వీస్ కోసం వాహనాన్ని వర్క్‌షాప్ (లేదా మీ షెడ్) 30 మీ. లోపు తీసుకురండి.')));
      } },
    ] });
  },
  dealer() { this.sheet({ title: L('Kisan Motors', 'కిసాన్ మోటార్స్'), sub: L('Bikes, pickups and tractors. Delivered to your farm.', 'బైకులు, పికప్‌లు, ట్రాక్టర్లు. మీ ఇంటికి డెలివరీ.'), render: (b) => this.vehicleShop(b, ['bike', 'pickup', 'tractor35', 'tractor50']) }); },
  vehicleShop(b, types) {
    const S = G.S; const g = h('div', { class: 'grid' });
    for (const t of types) {
      const V = VEHICLES[t]; const locked = (V.rank || 0) > S.rank;
      g.appendChild(h('div', { class: 'item' }, h('h3', null, LN(V), h('span', { class: 'price' }, fmtShortINR(V.price))),
        h('p', null, L(`Top speed ${Math.round(V.maxSpeed * 3.6)} km/h${V.cargo ? ` · carries ${V.cargo} q` : ''}${V.power ? ` · ${V.power} HP` : ''}`, `గరిష్ట వేగం ${Math.round(V.maxSpeed * 3.6)} కి.మీ.${V.cargo ? ` · ${V.cargo} క్వి.` : ''}${V.power ? ` · ${V.power} HP` : ''}`)),
        locked ? h('span', { class: 'chip warn' }, L('Unlocks at ', 'అన్‌లాక్: ') + LN(RANKS[V.rank])) : h('div', { class: 'row' }, this.btn(L('Buy', 'కొనండి'), () => this.buyVehicle(t), 'acc'))));
    }
    b.appendChild(g);
    b.appendChild(h('p', { class: 'empty' }, L('Money: ', 'డబ్బు: ') + fmtINR(S.money) + ' · ' + L('Bank loan limit: ', 'బ్యాంకు రుణ పరిమితి: ') + fmtINR(Finance.bankLimit())));
  },
  buyVehicle(t) {
    const V = VEHICLES[t];
    if (!Money.spend(V.price, 'vehicle')) return;
    const n = Vehicles.player.length; const sp = Vehicles.freeSpot(-108 - (n % 3) * 5, 66 + Math.floor(n / 3) * 7, t === 'harvester' ? 3.4 : 2.4);
    Vehicles.spawnOwned({ type: t, x: sp.x, z: sp.z, yaw: Math.PI, fuel: V.fuelCap });
    this.toast(L(`${V.en} delivered to your farm!`, `${V.te} మీ పొలానికి చేరింది!`), 'good'); Audio2.sfx('fanfare');
    Bus.emit('vehicleBought', { type: t });
  },
  villageMenu() {
    const S = G.S; Rel.add('sarpanch', 0);
    this.sheet({ title: L('Ramapuram Gram Panchayat', 'రామాపురం గ్రామ పంచాయతీ'), sub: L(`Sarpanch Lakshmamma · Population ${S.village.pop} · Land value +${Math.round(S.village.landValue * 100)}%`, `సర్పంచ్ లక్ష్మమ్మ · జనాభా ${S.village.pop} · భూమి విలువ +${Math.round(S.village.landValue * 100)}%`), render: (b) => {
      b.appendChild(h('p', null, L('Invest your profits in the village. Every project grows the population, business activity and land value — and the village remembers who helped.', 'మీ లాభాలను గ్రామంలో పెట్టుబడి పెట్టండి. ప్రతి ప్రాజెక్టు జనాభా, వ్యాపారం, భూమి విలువను పెంచుతుంది — సహాయం చేసినవారిని ఊరు గుర్తుంచుకుంటుంది.')));
      const g = h('div', { class: 'grid' });
      for (const id in VILLAGE_PROJECTS) {
        const P = VILLAGE_PROJECTS[id]; const done = S.village[id]; const building = S.construction.find((c) => c.kind === 'village' && c.id === id);
        g.appendChild(h('div', { class: 'item' }, h('h3', null, LN(P), h('span', { class: 'price' }, fmtShortINR(P.cost))), h('p', null, LN(P.desc)), h('p', null, L(`+${P.pop} people · land value +${Math.round(P.land * 100)}% · ${P.hours} h to build`, `+${P.pop} మంది · భూమి విలువ +${Math.round(P.land * 100)}% · ${P.hours} గం.`)),
          h('div', { class: 'row' }, done ? h('span', { class: 'chip good' }, L('Completed', 'పూర్తయింది')) : building ? h('span', { class: 'chip warn' }, L('Under construction', 'నిర్మాణంలో ఉంది')) : this.btn(L('Fund project', 'నిధులు ఇవ్వండి'), () => Village.start(id), 'acc', S.money < P.cost))));
      }
      b.appendChild(g);
    } });
  },
  financeMenu(kind) {
    const S = G.S; const bank = kind === 'bank';
    if (bank) S.flags.visitedBank = true;
    if (bank) { const m = S.missions.active.find((x) => x.tpl === 'visitBank'); if (m) Missions.progress(m, 1); }
    this.sheet({ title: bank ? L('Cooperative bank', 'సహకార బ్యాంకు') : L("Hanmanthu's loans", 'హన్మంతు అప్పులు'), sub: bank ? L('Crop loans at 7% a year. Deposits earn 6.5%.', 'పంట రుణాలు 7% వార్షిక వడ్డీ. డిపాజిట్లకు 6.5%.') : L('Instant cash, no paperwork. 1.8% interest every day.', 'పత్రాలు లేకుండా వెంటనే డబ్బు. రోజుకు 1.8% వడ్డీ.'), narrow: true, render: (b) => {
      const l = S.loans.find((x) => x.kind === kind);
      b.appendChild(h('div', { class: 'kv', style: { fontSize: '14px', marginBottom: '10px' } }, h('span', null, L('Outstanding', 'బాకీ')), h('span', null, fmtINR(l ? l.bal : 0)), h('span', null, L('Can borrow', 'తీసుకోవచ్చు')), h('span', null, fmtINR(bank ? Finance.bankLimit() : Finance.lenderLimit())), h('span', null, L('Your money', 'మీ డబ్బు')), h('span', null, fmtINR(S.money))));
      const row = h('div', { class: 'row' });
      for (const a of [25000, 50000, 100000, 250000]) row.appendChild(this.btn(L('Borrow ', 'తీసుకోండి ') + fmtShortINR(a), () => Finance.borrow(kind, a), 'sm', a > (bank ? Finance.bankLimit() : Finance.lenderLimit())));
      b.appendChild(row);
      if (l) { const r2 = h('div', { class: 'row', style: { marginTop: '8px' } }); for (const a of [10000, 50000]) r2.appendChild(this.btn(L('Repay ', 'చెల్లించండి ') + fmtShortINR(a), () => Finance.repay(kind, a), 'sm alt')); r2.appendChild(this.btn(L('Repay all', 'మొత్తం చెల్లించండి'), () => Finance.repay(kind, Math.ceil(l.bal)), 'sm acc', S.money < l.bal)); b.appendChild(r2); }
      if (bank) {
        b.appendChild(h('div', { class: 'sec' }, L('Fixed deposit', 'ఫిక్స్‌డ్ డిపాజిట్')));
        b.appendChild(h('div', { class: 'row' }, h('span', null, fmtINR(S.fd)), this.btn(L('Deposit ₹50,000', '₹50,000 డిపాజిట్'), () => { if (Money.spend(50000, 'fd')) S.fd += 50000; }, 'sm'), this.btn(L('Withdraw all', 'మొత్తం తీసుకోండి'), () => { if (S.fd > 0) { Money.add(Math.floor(S.fd), 'fd'); S.fd = 0; } }, 'sm alt', S.fd <= 0)));
        b.appendChild(h('div', { class: 'sec' }, L('Crop insurance', 'పంట బీమా')));
        b.appendChild(h('div', { class: 'row' }, h('span', null, L('2% premium at sowing. Pays out when weather ruins a crop.', 'విత్తేటప్పుడు 2% ప్రీమియం. వాతావరణం పంటను నాశనం చేస్తే పరిహారం.')), this.btn(S.flags.insure ? L('Insured — turn off', 'బీమా ఉంది — ఆపండి') : L('Insure my crops', 'నా పంటలకు బీమా'), () => { S.flags.insure = !S.flags.insure; }, S.flags.insure ? 'sm alt' : 'sm acc')));
      }
    } });
  },
  yardMenu(v) {
    const S = G.S;
    this.sheet({ title: L('Agricultural Market Yard', 'వ్యవసాయ మార్కెట్ యార్డ్'), sub: L("Venkatesh's commission: 1% + ₹10/q hamali", 'వెంకటేష్ కమీషన్: 1% + క్వింటాలుకు ₹10 హమాలీ'), narrow: true, render: (b) => {
      if (v && v.cargo.length) {
        for (const c of v.cargo) {
          const p = Market.price(c.crop); const net = Math.round(p * c.q * c.qty * 0.99 - 10 * c.qty);
          b.appendChild(h('div', { class: 'item', style: { marginBottom: '8px' } }, h('h3', null, `${LN(PRODUCE[c.crop])} · ${fmt1(c.qty)} q`, h('span', { class: 'price' }, fmtINR(p) + '/q')), h('p', null, L(`Grade ${Market.qualityLabel(c.q)} · you receive about ${fmtINR(net)}`, `గ్రేడ్ ${Market.qualityLabel(c.q)} · సుమారు ${fmtINR(net)} వస్తుంది`)),
            h('div', { class: 'row' }, this.btn(L('Sell here', 'ఇక్కడ అమ్మండి'), () => { const rev = Market.sell(c.crop, c.qty, c.q, 'yard'); this.toast(L(`Sold ${fmt1(c.qty)} q for ${fmtINR(rev)}.`, `${fmt1(c.qty)} క్వి. ${fmtINR(rev)}కు అమ్మారు.`), 'good'); c.qty = 0; v.cargo = v.cargo.filter((x) => x.qty > 0.05); Rel.add('venkatesh', 1); }, 'acc'),
              (PERISH[c.crop] || c.crop === 'turmeric') ? this.btn(L(`City broker (+10%, ₹150/q truck)`, `నగర బ్రోకర్ (+10%, క్వింటాలుకు ₹150 లారీ)`), () => { const rev = Market.sell(c.crop, c.qty, c.q, 'city'); this.toast(L(`City broker paid ${fmtINR(rev)}.`, `నగర బ్రోకర్ ${fmtINR(rev)} చెల్లించాడు.`), 'good'); c.qty = 0; v.cargo = v.cargo.filter((x) => x.qty > 0.05); }, 'alt') : null)));
        }
      } else b.appendChild(h('p', { class: 'empty' }, L('Bring produce in a cart, trailer or pickup to sell it here.', 'అమ్మడానికి బండి, ట్రాలీ లేదా పికప్‌లో పంట తీసుకురండి.')));
      b.appendChild(h('div', { class: 'sec' }, L("Today's yard prices", 'నేటి యార్డు ధరలు')));
      const t = h('table', { class: 't' }, h('tr', null, h('th', null, L('Crop', 'పంట')), h('th', null, '₹/q'), h('th', null, 'MSP')));
      for (const c of [...CROP_IDS, 'mango']) t.appendChild(h('tr', null, h('td', null, LN(PRODUCE[c])), h('td', { class: 'n' }, fmtINR(Market.price(c))), h('td', { class: 'n' }, CROPS[c] && CROPS[c].msp ? fmtINR(CROPS[c].msp) : '–')));
      b.appendChild(h('div', { class: 'tw' }, t));
    } });
  },
  mspMenu(v) {
    const S = G.S;
    this.sheet({ title: L('Govt. procurement centre', 'ప్రభుత్వ కొనుగోలు కేంద్రం'), sub: L('Minimum Support Price. Grade A/B only. Paid in 2 days.', 'కనీస మద్దతు ధర. A/B గ్రేడ్ మాత్రమే. 2 రోజుల్లో చెల్లింపు.'), narrow: true, render: (b) => {
      const el = v ? v.cargo.filter((c) => CROPS[c.crop] && CROPS[c.crop].msp && CROPS[c.crop].proc) : [];
      if (!el.length) b.appendChild(h('p', { class: 'empty' }, L('Bring paddy, cotton, maize or groundnut in a vehicle.', 'వరి, పత్తి, మొక్కజొన్న లేదా వేరుశెనగను వాహనంలో తీసుకురండి.')));
      for (const c of el) {
        const cd = CROPS[c.crop]; const open = Market.procurementOpen(c.crop); const okQ = c.q >= 0.99;
        b.appendChild(h('div', { class: 'item', style: { marginBottom: '8px' } }, h('h3', null, `${LN(cd)} · ${fmt1(c.qty)} q`, h('span', { class: 'price' }, 'MSP ' + fmtINR(cd.msp))),
          h('p', null, !open ? L('Procurement is closed now. It opens at harvest time (late Vanakalam and late Yasangi).', 'ఇప్పుడు కొనుగోళ్లు లేవు. కోత సమయంలో తెరుస్తారు (వానాకాలం, యాసంగి చివర).') : !okQ ? L('Grade C produce is not accepted here.', 'C గ్రేడ్ పంటను ఇక్కడ తీసుకోరు.') : L(`Market price today: ${fmtINR(Market.price(c.crop))}/q`, `ఈ రోజు మార్కెట్ ధర: ${fmtINR(Market.price(c.crop))}/క్వి.`)),
          h('div', { class: 'row' }, this.btn(L('Sell at MSP', 'మద్దతు ధరకు అమ్మండి'), () => {
            const amt = Math.round(cd.msp * c.qty);
            S.pending.push({ amt, due: Time.totalMin() + 2 * 1440, desc: `${fmt1(c.qty)} q ${cd.en}` });
            S.market.sup[c.crop] += c.qty / (DEPTH[c.crop] * 2); S.stats.sold[c.crop] = (S.stats.sold[c.crop] || 0) + c.qty;
            Bus.emit('sold', { crop: c.crop, qty: c.qty, rev: amt, where: 'msp', price: cd.msp });
            this.toast(L(`Accepted ${fmt1(c.qty)} q. ${fmtINR(amt)} will be paid in 2 days.`, `${fmt1(c.qty)} క్వి. తీసుకున్నారు. ${fmtINR(amt)} 2 రోజుల్లో జమ అవుతుంది.`), 'good');
            c.qty = 0; v.cargo = v.cargo.filter((x) => x.qty > 0.05);
          }, 'acc', !open || !okQ))));
      }
      if (S.pending.length) { b.appendChild(h('div', { class: 'sec' }, L('Payments due', 'రావాల్సిన చెల్లింపులు'))); for (const p of S.pending) b.appendChild(h('div', null, `${p.desc}: ${fmtINR(p.amt)} · ${L('in', '')} ${fmt1((p.due - Time.totalMin()) / 1440)} ${L('days', 'రోజుల్లో')}`)); }
    } });
  },
  santhaSell(v) {
    for (const c of v.cargo) if (c.crop === 'tomato' || c.crop === 'mango') { const rev = Market.sell(c.crop, c.qty, c.q, 'santha'); this.toast(L(`Sold ${fmt1(c.qty)} q at the santha for ${fmtINR(rev)}.`, `సంతలో ${fmt1(c.qty)} క్వి. ${fmtINR(rev)}కు అమ్మారు.`), 'good'); c.qty = 0; }
    v.cargo = v.cargo.filter((x) => x.qty > 0.05);
  },
  // ---------- farm office ----------
  office(tab) {
    const S = G.S;
    this.sheet({ title: L('Farm office', 'వ్యవసాయ కార్యాలయం'), titleFn: () => L('Farm office', 'వ్యవసాయ కార్యాలయం') + ' · ' + fmtINR(S.money), kind: 'office', tab, tabs: [
      { id: 'fields', label: () => L('Fields', 'పొలాలు'), render: (b) => this.tabFields(b) },
      { id: 'storage', label: () => L('Storage', 'నిల్వ'), render: (b) => this.tabStorage(b) },
      { id: 'workers', label: () => L('Workers', 'కూలీలు'), render: (b) => this.tabWorkers(b) },
      { id: 'build', label: () => L('Build', 'నిర్మాణం'), render: (b) => this.tabBuild(b) },
      { id: 'market', label: () => L('Market', 'మార్కెట్'), render: (b) => this.tabMarket(b) },
      { id: 'finance', label: () => L('Finance', 'ఆర్థికం'), render: (b) => this.tabFinance(b) },
      { id: 'missions', label: () => L('Missions', 'లక్ష్యాలు'), render: (b) => this.tabMissions(b) },
      { id: 'trophies', label: () => L('Trophies', 'ట్రోఫీలు') + ` ${Trophies.count()}/${TROPHIES.length}`, render: (b) => Trophies.tab(b) },
      { id: 'profile', label: () => L('Profile', 'ప్రొఫైల్'), render: (b) => this.tabProfile(b) },
    ] });
  },
  tabFields(b) {
    const S = G.S; const mine = Fields.playerFields();
    b.appendChild(h('div', { class: 'sec' }, L(`Your fields · ${fmt1(Farm.farmedAcres())} acres`, `మీ పొలాలు · ${fmt1(Farm.farmedAcres())} ఎకరాలు`)));
    const g = h('div', { class: 'grid' });
    for (const f of mine) {
      const cd = f.crop ? CROPS[f.crop] : null; const st = f.stageName();
      const it = h('div', { class: 'item' }, h('h3', null, f.label(), h('span', { class: 'price' }, `${fmt1(f.acres)} ${L('ac', 'ఎ.')}`)),
        h('p', null, `${LN(SOILS[f.soil])} · ${f.owner === 'lease' ? L('leased till day ', 'కౌలు రోజు ') + f.leaseUntil : L('owned', 'సొంతం')}${f.borewell ? ' · ' + L('borewell', 'బోరు') + (f.pump ? L(' (on)', ' (నడుస్తోంది)') : '') : ''}${f.canal ? ' · ' + L('canal', 'కాలువ') : ''}`),
        h('p', null, cd ? `${LN(cd)} · ${LN(st)} ${Math.round(f.growth * 100)}% · ${L('health', 'ఆరోగ్యం')} ${Math.round(f.health)}%` : L(`Empty · ploughed ${Math.round(f.countMin(1) / f.n * 100)}%`, `ఖాళీ · దున్నింది ${Math.round(f.countMin(1) / f.n * 100)}%`)),
        h('p', null, `${L('Water', 'నీరు')} ${Math.round(f.water)}% · ${L('Nutr.', 'పోషకం')} ${Math.round(f.nut)}% · ${L('Weeds', 'కలుపు')} ${Math.round(f.weeds)}% · ${L('Pests', 'పురుగు')} ${Math.round(f.pests)}%`));
      const row = h('div', { class: 'row' });
      const sel = h('select', { id: 'plan_' + f.id, style: { font: 'inherit', padding: '5px', borderRadius: '8px' }, onchange: (e) => { f.plannedCrop = e.target.value || null; } }, h('option', { value: '' }, L('Plan: none', 'ప్రణాళిక: లేదు')), ...CROP_IDS.map((c) => h('option', { value: c, selected: f.plannedCrop === c ? true : null }, L('Plan: ', 'ప్రణాళిక: ') + LN(CROPS[c]))));
      row.appendChild(sel);
      if (!f.borewell && f.id !== 'GH') row.appendChild(this.btn(L(`Drill borewell ${fmtShortINR(BOREWELL_COST)}`, `బోరు వేయించండి ${fmtShortINR(BOREWELL_COST)}`), () => Farm.drillBorewell(f), 'sm alt', S.money < BOREWELL_COST || S.construction.some((c) => c.id === f.id)));
      row.appendChild(this.btn(L('Show on map', 'మ్యాప్‌లో చూపు'), () => { S.waypoint = { x: f.x, z: f.z }; this.close(); this.toast(L('Waypoint set.', 'గమ్యం గుర్తించారు.'), 'info'); }, 'sm alt'));
      it.appendChild(row); g.appendChild(it);
    }
    b.appendChild(g);
    b.appendChild(h('p', { class: 'empty' }, L('Set a planned crop so your workers know what to sow.', 'మీ కూలీలు ఏమి విత్తాలో తెలియడానికి ప్రణాళిక పంట ఎంచుకోండి.')));
    b.appendChild(h('div', { class: 'sec' }, L('Land for sale or lease', 'అమ్మకానికి లేదా కౌలుకు భూమి')));
    const P = Player.pos();
    const av = Fields.list.filter((f) => f.avail).sort((a, c) => Math.hypot(a.x - P.x, a.z - P.z) - Math.hypot(c.x - P.x, c.z - P.z));
    const t = h('table', { class: 't' }, h('tr', null, h('th', null, L('Field', 'పొలం')), h('th', null, L('Acres', 'ఎకరాలు')), h('th', null, L('Soil', 'నేల')), h('th', null, L('Buy', 'కొనుగోలు')), h('th', null, L('Lease', 'కౌలు')), h('th', null, '')));
    for (const f of av.slice(0, 14)) t.appendChild(h('tr', null, h('td', null, f.label() + (f.canal ? ' · ' + L('canal', 'కాలువ') : '')), h('td', { class: 'n' }, fmt1(f.acres)), h('td', null, f.soil === 'red' ? L('Red', 'ఎర్ర') : L('Black', 'నల్ల')), h('td', { class: 'n' }, f.avail === 'lease' ? '–' : fmtShortINR(f.landPrice)), h('td', { class: 'n' }, fmtINR(f.leasePrice)), h('td', null, this.btn(L('Go', 'వెళ్ళు'), () => { S.waypoint = { x: f.heapSpot.x, z: f.heapSpot.z }; this.close(); this.toast(L('Waypoint set to the field sign.', 'పొలం బోర్డుకు గమ్యం గుర్తించారు.'), 'info'); }, 'sm alt'))));
    b.appendChild(h('div', { class: 'tw' }, t));
  },
  tabStorage(b) {
    const S = G.S;
    b.appendChild(h('div', { class: 'sec' }, L(`Produce · ${fmt1(Storage.used(false))}/${Storage.cap()} q`, `పంట నిల్వ · ${fmt1(Storage.used(false))}/${Storage.cap()} క్వి.`) + (Storage.coldCap() ? ` · ${L('cold storage', 'కోల్డ్ స్టోరేజ్')} ${fmt1(Storage.used(true))}/${Storage.coldCap()} q` : '')));
    if (!S.storage.length) b.appendChild(h('p', { class: 'empty' }, L('Nothing in storage. Drive a loaded cart or trailer into your yard to unload.', 'నిల్వలో ఏమీ లేదు. నిండిన బండిని ఇంటి ఆవరణలోకి తెచ్చి దించండి.')));
    else {
      const t = h('table', { class: 't' }, h('tr', null, h('th', null, L('Crop', 'పంట')), h('th', null, L('Quintals', 'క్వింటాళ్లు')), h('th', null, L('Grade', 'గ్రేడ్')), h('th', null, L('Trader pays', 'వ్యాపారి ధర')), h('th', null, '')));
      for (const e of S.storage) { const p = Math.round(Market.price(e.crop) * e.q * 0.88); t.appendChild(h('tr', null, h('td', null, LN(PRODUCE[e.crop]) + (e.cold ? ' ❄' : '')), h('td', { class: 'n' }, fmt1(e.qty)), h('td', null, Market.qualityLabel(e.q)), h('td', { class: 'n' }, fmtINR(p) + '/q'), h('td', null, this.btn(L('Sell 10 q', '10 క్వి. అమ్ము'), () => { const got = Storage.take(e.crop, 10); if (got.qty > 0) Market.sell(e.crop, got.qty, got.q, 'trader'); }, 'sm alt')))); }
      b.appendChild(h('div', { class: 'tw' }, t));
      const lr = h('div', { class: 'row', style: { marginTop: '8px' } });
      for (const c of [...new Set(S.storage.map((e) => e.crop))]) lr.appendChild(this.btn(L(`Send by lorry: ${LN(PRODUCE[c])} → market yard`, `లారీలో పంపండి: ${LN(PRODUCE[c])} → మార్కెట్ యార్డ్`), () => Services.lorryStored(c, 'yard'), 'sm acc'));
      b.appendChild(lr);
      b.appendChild(h('p', { class: 'empty' }, L(`A lorry gets the full market yard price for a small transport fee (₹150 + ₹30 a quintal). Selling here goes to the village trader (88%).`, `లారీలో పంపితే చిన్న రవాణా ఖర్చుతో (₹150 + క్వింటాలుకు ₹30) పూర్తి యార్డు ధర వస్తుంది. ఇక్కడ అమ్మితే గ్రామ వ్యాపారికి (88%).`)));
    }
    b.appendChild(h('div', { class: 'sec' }, L('Supplies', 'సామాగ్రి')));
    const t2 = h('table', { class: 't' });
    for (const c of CROP_IDS) { const k = 'seed_' + c; if (Inv.count(k) > 0.001) t2.appendChild(h('tr', null, h('td', null, Inv.name(k)), h('td', { class: 'n' }, fmt1(Inv.count(k)) + L(' acre packs', ' ఎకరం ప్యాకెట్లు')))); }
    for (const k in ITEMS) if (Inv.count(k) > 0.001) t2.appendChild(h('tr', null, h('td', null, LN(ITEMS[k])), h('td', { class: 'n' }, fmt1(Inv.count(k)) + ' × ' + LN(ITEMS[k].unit))));
    if (S.flags.safety) t2.appendChild(h('tr', null, h('td', null, LN(ITEMS.safety)), h('td', { class: 'n' }, L('owned', 'ఉంది'))));
    b.appendChild(t2.children.length ? h('div', { class: 'tw' }, t2) : h('p', { class: 'empty' }, L('No supplies.', 'సామాగ్రి లేదు.')));
    b.appendChild(h('div', { class: 'sec' }, L('Vehicles', 'వాహనాలు')));
    for (const v of Vehicles.player) b.appendChild(h('div', { class: 'row', style: { justifyContent: 'space-between', margin: '4px 0' } }, h('span', null, `${v.label()}${v.impl ? ' + ' + LN(IMPLEMENTS[v.impl]) : ''}${v.def.fuelCap ? ` · ${fmt1(v.fuel)} L` : ''}${v.rentUntil ? ' · ' + L('rented', 'అద్దె') : ''}`), this.btn(L('Find', 'కనుగొను'), () => { S.waypoint = { x: v.x, z: v.z }; this.close(); }, 'sm alt')));
    if (S.up.dairyShed) { b.appendChild(h('div', { class: 'sec' }, L('Dairy', 'పాడి'))); b.appendChild(h('div', { class: 'row' }, h('span', null, L(`${S.dairy.n} buffaloes · ~${S.dairy.n * 10} L milk a day · feed ${fmt1(Inv.count('feed'))} bags`, `${S.dairy.n} గేదెలు · రోజుకు ~${S.dairy.n * 10} లీ. పాలు · దాణా ${fmt1(Inv.count('feed'))} బస్తాలు`)), this.btn(L('Buy buffalo ₹65,000', 'గేదె కొనండి ₹65,000'), () => Farm.buyBuffalo(), 'sm'))); }
  },
  tabWorkers(b) {
    const S = G.S;
    b.appendChild(h('div', { class: 'row', style: { justifyContent: 'space-between' } }, h('div', { class: 'sec', style: { margin: 0 } }, L(`Workers · ${S.workers.filter((w) => w.type !== 'daily').length}/${Workers.maxPermanent()} permanent`, `కూలీలు · ${S.workers.filter((w) => w.type !== 'daily').length}/${Workers.maxPermanent()} శాశ్వత`)),
      h('label', { class: 'row' }, h('input', { type: 'checkbox', id: 'autobuy', checked: S.flags.autoBuy ? true : null, onchange: (e) => { S.flags.autoBuy = e.target.checked; } }), L('Auto-buy seeds & supplies (+5%)', 'విత్తనాలు & సామాగ్రి ఆటో-కొనుగోలు (+5%)'))));
    if (!S.workers.length) b.appendChild(h('p', { class: 'empty' }, L('No one works for you yet. Workers plough, sow your planned crop, weed, spray, irrigate and harvest by themselves.', 'ఇంకా ఎవరూ పనిలో లేరు. కూలీలు దున్నడం, ప్రణాళిక పంట విత్తడం, కలుపు, పిచికారీ, నీరు, కోత స్వయంగా చేస్తారు.')));
    for (const w of S.workers) {
      const n = Workers.list.find((x) => x.w === w); const T = WORKER_TYPES[w.type];
      const sel = h('select', { id: 'wf_' + w.id, style: { font: 'inherit', padding: '5px', borderRadius: '8px' }, onchange: (e) => { w.field = e.target.value; if (n) n.tt = 0; } }, h('option', { value: 'auto' }, L('Any field (auto)', 'ఏ పొలమైనా (ఆటో)')), ...Fields.playerFields().map((f) => h('option', { value: f.id, selected: w.field === f.id ? true : null }, f.label())));
      b.appendChild(h('div', { class: 'item', style: { marginBottom: '8px' } }, h('h3', null, `${LN(w.name)} · ${LN(T)}`, h('span', { class: 'price' }, fmtINR(T.wage) + '/' + (T.per === 'day' ? L('day', 'రోజు') : L('week', 'వారం')))),
        h('p', null, n && n.task ? L('Working: ', 'పని: ') + ({ harvest: L('harvesting', 'కోత'), spray: L('spraying', 'పిచికారీ'), weed: L('weeding', 'కలుపు'), fertilize: L('fertilizing', 'ఎరువు'), sow: L('sowing', 'విత్తడం'), prep: L('ploughing', 'దున్నడం'), irrigate: L('irrigating', 'నీరు') }[n.task.op] || '') + (n.field ? ' · ' + n.field.label() : '') : L('Waiting for work', 'పని కోసం ఎదురుచూస్తున్నారు')),
        h('div', { class: 'row' }, sel, this.btn(L('Dismiss', 'పంపించండి'), () => Workers.fire(w), 'sm alt'))));
    }
    b.appendChild(h('div', { class: 'sec' }, L('Hire', 'పనిలో పెట్టుకోండి')));
    const g = h('div', { class: 'grid' });
    for (const k in WORKER_TYPES) { const T = WORKER_TYPES[k]; g.appendChild(h('div', { class: 'item' }, h('h3', null, LN(T), h('span', { class: 'price' }, fmtINR(T.wage))), h('p', null, k === 'daily' ? L('Works today until 6 PM.', 'ఈ రోజు సాయంత్రం 6 వరకు పని.') : k === 'driver' ? L('Paid weekly. Hand work now; drives your tractor in a future update.', 'వారానికి జీతం. ప్రస్తుతం చేతి పని.') : L('Paid weekly. Lives on your farm.', 'వారానికి జీతం. మీ పొలంలోనే ఉంటారు.')), h('div', { class: 'row' }, this.btn(L('Hire', 'పెట్టుకోండి'), () => Workers.hire(k), 'acc', S.money < T.wage)))); }
    b.appendChild(g);
  },
  tabBuild(b) {
    const S = G.S;
    if (S.construction.length) { b.appendChild(h('div', { class: 'sec' }, L('Under construction', 'నిర్మాణంలో'))); for (const c of S.construction) b.appendChild(h('div', null, `${LN(c.label)} · ${fmt1(Math.max(0, (c.doneAt - Time.totalMin()) / 60))} ${L('hours left', 'గంటలు మిగిలాయి')}`)); }
    b.appendChild(h('div', { class: 'sec' }, L('Your home', 'మీ ఇల్లు')));
    const lv = S.houseLevel; const cur = HOUSE_LEVELS[lv], nx = HOUSE_LEVELS[lv + 1];
    b.appendChild(h('div', { class: 'item' }, h('h3', null, `${L('Level', 'స్థాయి')} ${lv + 1}: ${LN(cur)}`, nx ? h('span', { class: 'price' }, fmtShortINR(nx.cost)) : null), h('p', null, L(`Storage ${cur.storage} q · rest bonus ×${cur.rest}`, `నిల్వ ${cur.storage} క్వి. · విశ్రాంతి ×${cur.rest}`)),
      nx ? h('p', null, L(`Next: ${nx.en} · storage ${nx.storage} q · ${nx.hours} h to build`, `తదుపరి: ${nx.te} · నిల్వ ${nx.storage} క్వి. · ${nx.hours} గం.`)) : h('p', null, L('Fully upgraded.', 'పూర్తిగా అభివృద్ధి చేశారు.')),
      nx ? h('div', { class: 'row' }, this.btn(L('Upgrade', 'అప్‌గ్రేడ్'), () => Farm.upgradeHouse(), 'acc', S.money < nx.cost || S.construction.some((c) => c.kind === 'house'))) : null));
    b.appendChild(h('div', { class: 'sec' }, L('Farm buildings', 'వ్యవసాయ నిర్మాణాలు')));
    const g = h('div', { class: 'grid' });
    for (const id in FARM_UPGRADES) { const U2 = FARM_UPGRADES[id]; const building = S.construction.find((c) => c.kind === 'up' && c.id === id); g.appendChild(h('div', { class: 'item' }, h('h3', null, LN(U2), h('span', { class: 'price' }, fmtShortINR(U2.cost))), h('p', null, LN(U2.desc)), h('div', { class: 'row' }, S.up[id] ? h('span', { class: 'chip good' }, L('Built', 'నిర్మించారు')) : building ? h('span', { class: 'chip warn' }, L('Under construction', 'నిర్మాణంలో')) : this.btn(L(`Build · ${U2.hours} h`, `నిర్మించు · ${U2.hours} గం.`), () => Farm.buyUpgrade(id), 'acc', S.money < U2.cost)))); }
    b.appendChild(g);
  },
  tabMarket(b) {
    const S = G.S;
    const t = h('table', { class: 't' }, h('tr', null, h('th', null, L('Crop', 'పంట')), h('th', null, L('Yard ₹/q', 'యార్డు ₹/క్వి.')), h('th', null, L('24h', '24గం')), h('th', null, 'MSP'), h('th', null, L('Last 20 days', 'గత 20 రోజులు')), h('th', null, L('Stored', 'నిల్వ'))));
    for (const c of [...CROP_IDS, 'mango']) {
      const tr = Market.trend(c); const cv = h('canvas', { class: 'spark', width: 240, height: 60 });
      this.spark(cv, S.market.hist[c]);
      t.appendChild(h('tr', null, h('td', null, LN(PRODUCE[c])), h('td', { class: 'n' }, fmtINR(Market.price(c))), h('td', { class: 'n', style: { color: tr > 0 ? 'var(--good)' : tr < 0 ? 'var(--bad)' : '' } }, (tr >= 0 ? '+' : '') + (tr * 100).toFixed(1) + '%'), h('td', { class: 'n' }, CROPS[c] && CROPS[c].msp ? fmtINR(CROPS[c].msp) : '–'), h('td', null, cv), h('td', { class: 'n' }, fmt1(Storage.total(c)))));
    }
    b.appendChild(h('div', { class: 'tw' }, t));
    b.appendChild(h('div', { class: 'sec' }, L('Market news', 'మార్కెట్ వార్తలు')));
    if (!S.market.news.length) b.appendChild(h('p', { class: 'empty' }, L('No news yet.', 'ఇంకా వార్తలు లేవు.')));
    for (const n of S.market.news) b.appendChild(h('p', { style: { margin: '4px 0' } }, `${L('Day', 'రోజు')} ${Math.floor(n.t / 1440) + 1}: ${LN(n)}`));
    b.appendChild(h('p', { class: 'empty' }, L('Selling a lot at once pushes the price down. Prices recover over a couple of days.', 'ఒకేసారి ఎక్కువ అమ్మితే ధర తగ్గుతుంది. రెండు రోజుల్లో మళ్లీ కోలుకుంటుంది.')));
  },
  spark(cv, data) {
    const ctx = cv.getContext('2d'); const W = cv.width, H = cv.height; ctx.clearRect(0, 0, W, H);
    if (!data || data.length < 2) return;
    const mn = Math.min(...data), mx = Math.max(...data); const pad = 6;
    const X = (i) => pad + i / (data.length - 1) * (W - pad * 2), Y = (v) => H - pad - (mx > mn ? (v - mn) / (mx - mn) : 0.5) * (H - pad * 2);
    const css = getComputedStyle(document.documentElement);
    ctx.strokeStyle = css.getPropertyValue('--line'); ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(pad, H / 2); ctx.lineTo(W - pad, H / 2); ctx.stroke();
    ctx.beginPath(); data.forEach((v, i) => (i ? ctx.lineTo(X(i), Y(v)) : ctx.moveTo(X(i), Y(v)))); ctx.lineTo(X(data.length - 1), H); ctx.lineTo(X(0), H); ctx.closePath();
    ctx.fillStyle = css.getPropertyValue('--accent').trim() + '33'; ctx.fill();
    ctx.beginPath(); data.forEach((v, i) => (i ? ctx.lineTo(X(i), Y(v)) : ctx.moveTo(X(i), Y(v)))); ctx.strokeStyle = css.getPropertyValue('--accent'); ctx.lineWidth = 3; ctx.stroke();
    ctx.fillStyle = css.getPropertyValue('--soil'); ctx.beginPath(); ctx.arc(X(data.length - 1), Y(data[data.length - 1]), 4.5, 0, TAU); ctx.fill();
  },
  tabFinance(b) {
    const S = G.S;
    const kv = h('div', { class: 'kv', style: { fontSize: '14px', maxWidth: '420px' } });
    const add = (k, v) => kv.append(h('span', null, k), h('span', null, v));
    add(L('Cash', 'నగదు'), fmtINR(S.money)); add(L('Fixed deposit', 'ఫిక్స్‌డ్ డిపాజిట్'), fmtINR(S.fd));
    for (const l of S.loans) add(l.kind === 'bank' ? L('Bank crop loan', 'బ్యాంకు పంట రుణం') : L("Hanmanthu's loan", 'హన్మంతు అప్పు'), '−' + fmtINR(l.bal));
    add(L('Bank loan limit', 'బ్యాంకు రుణ పరిమితి'), fmtINR(Finance.bankLimit()));
    add(L('Payments due to you', 'రావాల్సిన చెల్లింపులు'), fmtINR(S.pending.reduce((s, p) => s + p.amt, 0)));
    add(L('Crop insurance', 'పంట బీమా'), S.flags.insure ? L('On', 'ఉంది') : L('Off', 'లేదు'));
    add(L('Lifetime farm income', 'మొత్తం వ్యవసాయ ఆదాయం'), fmtINR(S.stats.cropIncome)); add(L('Total spent', 'మొత్తం ఖర్చు'), fmtINR(S.stats.spent));
    b.appendChild(kv);
    b.appendChild(h('p', { class: 'empty' }, L('Loans and deposits: the cooperative bank in Nagaram (take the bus) or Hanmanthu in the village. Owned land earns ₹5,000/acre investment support every season.', 'రుణాలు, డిపాజిట్లు: నగరంలోని సహకార బ్యాంకు (బస్సులో వెళ్ళండి) లేదా గ్రామంలో హన్మంతు. సొంత భూమికి ప్రతి సీజన్ ఎకరానికి ₹5,000 పెట్టుబడి సాయం.')));
  },
  tabMissions(b) {
    const S = G.S;
    for (const m of S.missions.active) {
      const fr = clamp01(m.prog / m.target);
      b.appendChild(h('div', { class: 'item', style: { marginBottom: '8px' } }, h('h3', null, LN(m.title), h('span', { class: 'price' }, m.reward ? fmtINR(m.reward) : '')), h('p', null, LN(isMobile && m.descM ? m.descM : m.desc)), h('div', { class: 'prog' }, h('b', { style: { width: (fr * 100).toFixed(0) + '%' } })),
        h('div', { class: 'row' }, Coach.current() === m ? h('span', { class: 'chip good' }, L('Following now', 'ఇప్పుడు ఇదే')) : this.btn(L('Follow this mission', 'ఈ లక్ష్యాన్ని అనుసరించండి'), () => { Coach.follow(m); S.waypoint = null; this.close(); }, 'sm acc'))));
    }
    b.appendChild(h('div', { class: 'sec' }, L(`Completed · ${S.missions.done}`, `పూర్తయినవి · ${S.missions.done}`)));
    for (const x of S.missions.history.slice(0, 12)) b.appendChild(h('p', { style: { margin: '3px 0', color: 'var(--ink-2)' } }, `${L('Day', 'రోజు')} ${x.day} · ${LN(x.title)} · ${fmtINR(x.reward || 0)}`));
  },
  tabProfile(b) {
    const S = G.S;
    b.appendChild(h('div', { class: 'item', style: { marginBottom: '10px' } }, h('h3', null, `${S.player.name} · ${LN(RANKS[S.rank])}`), h('p', null, S.rank < 5 ? L('Next: ', 'తదుపరి: ') + LN(RANKS[S.rank + 1]) : L('You lead an agricultural company!', 'మీరు ఒక వ్యవసాయ కంపెనీని నడుపుతున్నారు!'))));
    if (S.rank < 5) for (const q of Progress.reqs(S.rank + 1)) { const fr = clamp01(q.cur / q.need); b.appendChild(h('div', { style: { margin: '6px 0' } }, h('div', { class: 'row', style: { justifyContent: 'space-between' } }, h('span', null, (q.ok ? '✓ ' : '') + LN(q)), h('span', { class: 'num' }, q.need >= 1000 ? `${fmtShortINR(q.cur)} / ${fmtShortINR(q.need)}` : `${fmt1(q.cur)} / ${q.need}`)), h('div', { class: 'prog' }, h('b', { style: { width: (fr * 100) + '%' } })))); }
    b.appendChild(h('div', { class: 'sec' }, L('Stats', 'గణాంకాలు')));
    const kv = h('div', { class: 'kv', style: { maxWidth: '460px', fontSize: '13px' } });
    const add = (k, v) => kv.append(h('span', null, k), h('span', null, v));
    add(L('Days farmed', 'వ్యవసాయ రోజులు'), String(Time.day())); add(L('Harvested', 'కోసింది'), fmt1(S.stats.harvestQ || 0) + ' q');
    for (const c in S.stats.sold) add(L('Sold: ', 'అమ్మింది: ') + LN(PRODUCE[c]), fmt1(S.stats.sold[c]) + ' q');
    add(L('Milk sold', 'అమ్మిన పాలు'), fmt1(S.stats.milk || 0) + ' L'); add(L('Missions completed', 'పూర్తి చేసిన లక్ష్యాలు'), String(S.missions.done));
    add(L('Village projects funded', 'గ్రామ ప్రాజెక్టులు'), String(Village.devScore()));
    b.appendChild(kv);
    b.appendChild(h('div', { class: 'sec' }, L('Relationships', 'సంబంధాలు')));
    const rl = h('div', { class: 'grid' });
    for (const n of NPCs.list.filter((x) => x.named)) { const r = Rel.get(n.id); rl.appendChild(h('div', { class: 'row', style: { justifyContent: 'space-between' } }, h('span', null, `${LN(n.name)} · ${LN(n.role)}`), h('span', { class: 'chip ' + (r > 30 ? 'good' : r < -10 ? 'bad' : '') }, (r > 0 ? '+' : '') + Math.round(r)))); }
    b.appendChild(rl);
  },
  // ---------- map ----------
  map() {
    this.sheet({ title: L('Map', 'మ్యాప్'), kind: 'map', wide: true, onClose: () => Map2.close(), render: (b) => Map2.open(b) });
  },
  // ---------- settings: tabs in 17c_menu.js ----------
  settings(tab) { Menu.open(tab); },
  help() {
    this.sheet({ title: L('Controls', 'నియంత్రణలు'), narrow: true, render: (b) => {
      const rows = isMobile ? [
        [L('Left stick', 'ఎడమ స్టిక్'), L('Walk; push it all the way to run', 'నడవండి; పూర్తిగా నెడితే పరుగు')], [L('Drag right side', 'కుడివైపు లాగండి'), L('Look around, pinch to zoom', 'చుట్టూ చూడండి, జూమ్ కోసం పించ్')], [L('Work', 'పని'), L('Hold on your field: Auto ploughs, sows, waters, feeds, sprays and harvests', 'పొలంలో పట్టుకోండి: ఆటో దున్నడం, విత్తడం, నీరు, ఎరువు, మందు, కోత అన్నీ చేస్తుంది')], [L('Use', 'వాడు'), L('Talk, shop, drive, buy seeds, rest, get off', 'మాట్లాడు, కొను, నడుపు, విత్తనాలు, విశ్రాంతి, దిగు')], [L('Gold arrow', 'బంగారు బాణం'), L('Always points to your next goal', 'మీ తదుపరి లక్ష్యం వైపు చూపిస్తుంది')], [L('Map', 'మ్యాప్'), L('Tap a place, then take an auto straight there', 'ఒక చోటు నొక్కి ఆటోలో నేరుగా వెళ్ళండి')], ['G', L('Lower or raise implement', 'పనిముట్టు దించు/ఎత్తు')], ['V', L('Switch camera view', 'కెమెరా మార్చు')],
      ] : [
        ['W A S D', L('Walk / drive', 'నడవండి / నడపండి')], ['Shift', L('Run', 'పరుగు')], ['Space', L('Jump / brake', 'దూకు / బ్రేక్')], [L('Mouse drag, wheel', 'మౌస్ లాగడం, వీల్'), L('Look around, zoom', 'చూడండి, జూమ్')], ['E', L('Talk, shop, drive, buy seeds, rest, get off', 'మాట్లాడు, కొను, నడుపు, విత్తనాలు, విశ్రాంతి, దిగు')], ['F', L('Hold on your field: Auto does the next job', 'పొలంలో పట్టుకోండి: ఆటో తర్వాతి పని చేస్తుంది')],
        ['1 – 6', L('Auto, hoe, seeds, fertilizer, sprayer, sickle', 'ఆటో, పార, విత్తనాలు, ఎరువు, స్ప్రేయర్, కొడవలి')], ['Q', L('Switch seed / fertilizer / chemical', 'విత్తనం / ఎరువు / మందు మార్చు')], ['G', L('Lower or raise implement', 'పనిముట్టు దించు/ఎత్తు')], ['H / L', L('Horn / headlights', 'హారన్ / లైట్లు')], ['V', L('First / third person', 'ఫస్ట్ / థర్డ్ పర్సన్')], ['M', L('Map', 'మ్యాప్')], ['B / I', L('Farm office / storage', 'వ్యవసాయ కార్యాలయం / నిల్వ')], ['P', L('Photo mode', 'ఫోటో మోడ్')], ['Esc', L('Menu & settings', 'మెనూ & సెట్టింగ్‌లు')],
      ];
      const t = h('table', { class: 't' }); for (const [k, v2] of rows) t.appendChild(h('tr', null, h('td', null, h('span', { class: 'kbd' }, k)), h('td', null, v2)));
      b.appendChild(t);
      b.appendChild(h('p', { class: 'empty' }, L('Tip: follow the gold arrow. When the crop is growing and there is nothing to do, use “Rest” on your field to jump ahead.', 'చిట్కా: బంగారు బాణాన్ని అనుసరించండి. పంట పెరుగుతూ పని లేనప్పుడు పొలంలో \'విశ్రాంతి\' వాడి సమయం ముందుకు జరపండి.')));
    } });
  },
  photo() {
    this.photoMode = !this.photoMode;
    for (const id of ['hud-tl', 'hud-tc', 'hud-tr', 'missions', 'hud-bl', 'hud-bc', 'hud-br', 'news', 'savedot', 'howtip']) { const e = this.el(id); if (e) e.style.visibility = this.photoMode ? 'hidden' : ''; }
    this.el('touch').style.visibility = this.photoMode ? 'hidden' : '';
    this.el('letterbox').hidden = !(this.photoMode || (G.preset && G.preset.letterbox));
    // a bar with two big buttons: take the photo, or go back to playing
    const bar = this.el('photobar');
    if (bar) {
      bar.hidden = !this.photoMode;
      if (this.photoMode) {
        bar.innerHTML = '';
        bar.append(h('button', { class: 'pb snap', type: 'button', onclick: () => Photo.take() }, '📸 ' + L('Take photo', 'ఫోటో తీయండి')),
          h('button', { class: 'pb', type: 'button', onclick: () => this.photo() }, '✕ ' + L('Back', 'వెనక్కి')));
      }
    }
    if (this.photoMode) this.toast(isMobile ? L('Photo mode: drag to frame your shot, then tap Take photo', 'ఫోటో మోడ్: లాగి చిత్రాన్ని సరిచేసి, ఫోటో తీయండి నొక్కండి') : L('Photo mode: frame your shot, then click Take photo (P to return)', 'ఫోటో మోడ్: చిత్రాన్ని సరిచేసి ఫోటో తీయండి నొక్కండి (తిరిగి రావడానికి P)'), 'info');
  },
  fade(fn, text = '') {
    const f = this.el('fade'); f.textContent = text; f.classList.add('on');
    setTimeout(() => { try { fn(); } finally { setTimeout(() => f.classList.remove('on'), 250); } }, 480);
  },
  banner(small, big, sub, ms = 4200) {
    const el = h('div', { class: 'big-banner' }, h('div', { class: 'card bb' }, h('small', null, small), h('strong', null, big), sub ? h('span', null, sub) : null));
    this.el('hud').appendChild(el); setTimeout(() => el.remove(), ms);
  },
  rankUp(R) { Celebrate.rank(R); },
  missionDone(m) { Celebrate.mission(m); },
  // ---------- touch controls ----------
  initTouch() {
    const joy = this.el('joy'), knob = this.el('knob'); let R = 50;
    const hasTouch = 'ontouchstart' in window;
    // pointer capture can fail on some phones when another finger is already down: never let that stop a control
    const cap = (el, e) => { try { el.setPointerCapture(e.pointerId); } catch (er) { /* keep going without capture */ } };
    // ---- hold buttons: on while any finger is on it, off when the last finger lifts (wherever it slid to)
    const hold = (el, on, off) => {
      if (!el) return;
      const ids = new Set(); let p = null;
      el.addEventListener('touchstart', (e) => { e.preventDefault(); const was = ids.size; for (const t of e.changedTouches) ids.add(t.identifier); if (!was) { on(); Audio2.unlock(); } }, { passive: false });
      const tend = (e) => { for (const t of e.changedTouches) ids.delete(t.identifier); if (!ids.size) off(); };
      el.addEventListener('touchend', tend); el.addEventListener('touchcancel', tend);
      el.addEventListener('pointerdown', (e) => { if (e.pointerType === 'touch' && hasTouch) return; e.preventDefault(); p = e.pointerId; cap(el, e); on(); Audio2.unlock(); });
      const pup = (e) => { if (p !== null && e.pointerId === p) { p = null; off(); } };
      el.addEventListener('pointerup', pup); el.addEventListener('pointercancel', pup);
    };
    // ---- the walking stick: touch events follow each finger by its id, so stick + Work + Use all work together
    let jid = null, pid = null, cx = 0, cy = 0;
    // auto run (like PUBG): push the stick up and slide your thumb onto the runner above it, then let go
    const ar = this.el('autorun'); let armed = false;
    const arShow = (show, ready) => { if (!ar || Input.autoRun) return; ar.hidden = !show; ar.classList.toggle('ready', !!ready); };
    const jmove = (x, y) => {
      let dx = x - cx, dy = y - cy; const d = Math.hypot(dx, dy); if (d > R) { dx = dx / d * R; dy = dy / d * R; }
      knob.style.transform = `translate(${dx}px, ${dy}px)`; Input.joy.x = dx / R; Input.joy.y = -dy / R; Input.run = !Player.vehicle && (Input.runToggle || d > R * 0.92);
      if (!Player.vehicle && ar && Settings.v.autoRunOn !== false) { const r = ar.getBoundingClientRect(); armed = !ar.hidden && x > r.left - 24 && x < r.right + 24 && y < r.bottom + 14; arShow(Input.joy.y > 0.8, armed); }
    };
    const jstart = (x, y) => { if (Input.autoRun) this.autoRun(false); R = 50 * (parseFloat(joy.dataset.s) || 1); const r = joy.getBoundingClientRect(); cx = r.left + r.width / 2; cy = r.top + r.height / 2; Input.joy.active = true; armed = false; jmove(x, y); Audio2.unlock(); };
    const jend = () => { jid = null; pid = null; knob.style.transform = ''; if (Hud.fx || Hud.fy) { Hud.fx = 0; Hud.fy = 0; Hud.apply(); } Input.joy.x = 0; Input.joy.y = 0; Input.joy.active = false; Input.run = Input.runToggle; if (armed && !Player.vehicle) this.autoRun(true); else arShow(false); armed = false; };
    if (ar) hold(ar, () => { if (Input.autoRun) this.autoRun(false); }, () => { });
    // floating stick (Menu > Controls): a thumb anywhere on the lower left of the 3D view becomes the stick
    this.joyApi = {
      take: (t) => {
        if (Settings.v.joyMode !== 'float' || !G.started || jid !== null || pid !== null || HudEdit.on || this.modalOpen()) return false;
        if (Player.vehicle && Settings.v.vehCtl !== 'stick') return false;
        if (t.clientX > innerWidth * 0.45 || t.clientY < innerHeight * 0.3) return false;
        jid = t.identifier; Hud.fx = 0; Hud.fy = 0; Hud.apply();
        const r = joy.getBoundingClientRect(); Hud.fx = t.clientX - (r.left + r.width / 2); Hud.fy = t.clientY - (r.top + r.height / 2); Hud.apply();
        jstart(t.clientX, t.clientY); return true;
      },
      move: (t) => { if (t.identifier === jid) jmove(t.clientX, t.clientY); },
      end: (t) => { if (t.identifier === jid) jend(); },
    };
    joy.addEventListener('touchstart', (e) => { e.preventDefault(); if (jid !== null) return; const t = e.changedTouches[0]; jid = t.identifier; jstart(t.clientX, t.clientY); }, { passive: false });
    joy.addEventListener('touchmove', (e) => { e.preventDefault(); for (const t of e.changedTouches) if (t.identifier === jid) jmove(t.clientX, t.clientY); }, { passive: false });
    const jtend = (e) => { for (const t of e.changedTouches) if (t.identifier === jid) jend(); };
    joy.addEventListener('touchend', jtend); joy.addEventListener('touchcancel', jtend);
    joy.addEventListener('pointerdown', (e) => { if (e.pointerType === 'touch' && hasTouch) return; pid = e.pointerId; cap(joy, e); jstart(e.clientX, e.clientY); });
    joy.addEventListener('pointermove', (e) => { if (pid !== null && e.pointerId === pid) jmove(e.clientX, e.clientY); });
    const pend = (e) => { if (pid !== null && e.pointerId === pid) jend(); };
    joy.addEventListener('pointerup', pend); joy.addEventListener('pointercancel', pend);
    hold(this.el('tbWork'), () => { Input.work = true; this.el('tbWork').classList.add('on'); }, () => { Input.work = false; this.el('tbWork').classList.remove('on'); });
    // driving buttons: hold to steer / accelerate / brake (several at once with more fingers)
    for (const [bid, k] of [['dL', 'l'], ['dR', 'r'], ['dU', 'u'], ['dD', 'd']]) {
      const b = this.el(bid); if (!b) continue;
      hold(b, () => { Input.drive[k] = 1; b.classList.add('on'); }, () => { Input.drive[k] = 0; b.classList.remove('on'); });
    }
    hold(this.el('tbE'), () => { Input.interactTap = true; }, () => { });
    hold(this.el('tbG'), () => { const v = Player.vehicle; if (v) { if (v.type === 'harvester' || (v.impl && IMPLEMENTS[v.impl].op)) Input.implToggle = true; else Input.horn = true; } else Player.cycleOpt(); }, () => { });
    hold(this.el('tbV'), () => Cam.toggle(), () => { });
    hold(this.el('tbJump'), () => { if (Player.vehicle) Input.brake = true; else Input.pressedQ.add('Space'); }, () => { Input.brake = false; });
    hold(this.el('tbRun'), () => { Input.runToggle = !Input.runToggle; Input.run = Input.runToggle; this.el('tbRun').classList.toggle('on', Input.runToggle); }, () => { });
  },
  // auto run on or off: the farmer keeps running where the camera looks; touch the stick or the runner to stop
  autoRun(on) {
    Input.autoRun = !!on; Input.run = on ? true : Input.runToggle;
    const ar = this.el('autorun'); if (ar) { ar.classList.toggle('on', !!on); ar.classList.remove('ready'); ar.hidden = !on; const t = ar.querySelector('span'); if (t) t.textContent = on ? L('Auto run · tap to stop', 'ఆటో పరుగు · ఆపడానికి నొక్కండి') : L('Auto run', 'ఆటో పరుగు'); }
    if (on) { Audio2.sfx('click'); UI.toastOnce('autorun', L('Auto run on: turn the camera to steer. Touch the stick to stop.', 'ఆటో పరుగు ఆన్: దిశ మార్చడానికి కెమెరా తిప్పండి. ఆపడానికి స్టిక్ తాకండి.'), 'info'); }
  },
  // vehicles: the big steer / go / brake buttons, or the same stick as walking (Menu > Controls)
  touchMode(force) {
    if (HudEdit.on) return;
    const pad = !!Player.vehicle && Settings.v.vehCtl !== 'stick';
    const dp = this.el('dpad'); if (!dp || (!force && dp.hidden !== pad)) return;
    dp.hidden = !pad; this.el('joy').style.visibility = pad ? 'hidden' : '';
    if (!pad) { const dr = Input.drive; dr.l = dr.r = dr.u = dr.d = 0; for (const b of dp.querySelectorAll('.db')) b.classList.remove('on'); }
  },
  updateTouchLabels() {
    if (!isMobile) return;
    const v = Player.vehicle; const inV = !!v;
    // in a vehicle: big steer / go / brake buttons instead of the walking stick
    if (inV && Input.autoRun) this.autoRun(false);
    this.touchMode(false);
    const set = (id, txt, vis = true) => { const el = this.el(id); if (!el) return; if (el.dataset.l !== txt) { el.dataset.l = txt; el.textContent = txt; } el.style.visibility = vis ? '' : 'hidden'; };
    const implOp = !!(v && (v.type === 'harvester' || (v.impl && IMPLEMENTS[v.impl].op)));
    const toolOpt = !inV && (Player.tool === 'seeds' || Player.tool === 'fert' || Player.tool === 'sprayer');
    set('tbG', inV ? (implOp ? (v.lowered ? L('Raise', 'ఎత్తు') : L('Lower', 'దించు')) : L('Horn', 'హారన్')) : L('Type', 'రకం'), inV || toolOpt);
    set('tbV', L('View', 'వ్యూ'));
    set('tbJump', inV ? L('Brake', 'బ్రేక్') : L('Jump', 'దూకు'));
    set('tbRun', L('Run', 'పరుగు'), !inV);
    set('tbWork', L('Work', 'పని'), !inV);
    const real = (Interact.current || []).filter((o) => o.id !== 'exit');
    set('tbE', inV && !real.length ? L('Get off', 'దిగు') : real.length ? L('Use', 'వాడు') : L('Use', 'వాడు'));
    this.el('tbE').classList.toggle('dim', !inV && !real.length);
  },
  // ---------- title / loading ----------
  loading(p, msg) { const b = document.querySelector('#lbar b'); if (b) b.style.width = Math.round(p * 100) + '%'; const m = this.el('lmsg'); if (m && msg) m.textContent = msg; },
  showTitle(hasSave, onContinue, onNew, info = '') {
    this.el('loading').hidden = true;
    const t = this.el('title'); t.hidden = false;
    const v = Settings.v;
    const segs = () => {
      const lang = this.el('tlang'); lang.innerHTML = '';
      lang.appendChild(Lang.picker('', () => { segs(); acts(); if (!this.el('newgame').hidden) newForm(); }));
      const q = this.el('tqual'); q.innerHTML = '';
      for (const p of PRESET_ORDER) q.appendChild(h('button', { class: v.preset === p ? 'on' : '', onclick: () => { v.preset = p; Settings.save(); Game.setPreset(p); segs(); } }, PRESET_NAMES()[p]));
    };
    // iPhone/iPad Safari cannot go full screen from a web page: suggest adding it to the home screen
    const a2 = this.el('a2hs');
    if (a2) {
      const ios = /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
      const standalone = navigator.standalone || matchMedia('(display-mode: standalone)').matches || matchMedia('(display-mode: fullscreen)').matches;
      let framed = false; try { framed = window.self !== window.top; } catch (e) { framed = true; }
      a2.hidden = !(ios && !standalone && !framed);
      if (!a2.hidden) { a2.innerHTML = ''; a2.append(h('b', null, L('Full screen on iPhone: ', 'ఐఫోన్‌లో ఫుల్ స్క్రీన్: ')), L('tap Share, then “Add to Home Screen”, and open the game from your home screen.', 'షేర్ నొక్కి “Add to Home Screen” ఎంచుకోండి, తర్వాత హోమ్ స్క్రీన్ నుంచి ఆట తెరవండి.')); }
    }
    const acts = () => {
      const a = this.el('tactions'); a.innerHTML = '';
      if (hasSave) a.appendChild(h('button', { class: 'tbtn pri', onclick: () => { Audio2.unlock(); Coach.prime(); Game.autoFullscreen(); onContinue(); } }, h('span', { class: 'tcont' }, L('Continue', 'కొనసాగించండి'), info ? h('small', null, typeof info === 'function' ? info() : info) : null), h('span', null, '→')));
      a.appendChild(h('button', { class: 'tbtn ' + (hasSave ? 'sec2' : 'pri'), onclick: () => { Audio2.unlock(); newForm(); } }, L('New game', 'కొత్త ఆట'), h('span', null, '+')));
      a.appendChild(h('button', { class: 'tbtn sec2', onclick: () => this.help() }, L('Controls', 'నియంత్రణలు'), h('span', null, '?')));
    };
    let gender = 'm', easy = true;
    const newForm = () => {
      const f = this.el('newgame'); f.hidden = false; f.innerHTML = '';
      const name = h('input', { id: 'pnameInput', maxlength: 18, value: gender === 'm' ? L('Raju', 'రాజు') : L('Radha', 'రాధ'), 'aria-label': L('Your name', 'మీ పేరు') });
      const av = h('div', { class: 'av' });
      const draw = () => { av.innerHTML = ''; for (const [g, lab] of [['m', L('Farmer (man)', 'రైతు (పురుషుడు)')], ['f', L('Farmer (woman)', 'రైతు (స్త్రీ)')]]) av.appendChild(h('button', { class: gender === g ? 'on' : '', onclick: () => { gender = g; name.value = g === 'm' ? L('Raju', 'రాజు') : L('Radha', 'రాధ'); draw(); } }, lab)); };
      draw();
      // difficulty: easy is the default, so anyone (kids too) can grow a crop without failing
      const dif = h('div', { class: 'av dif' });
      const drawDif = () => { dif.innerHTML = ''; for (const [e, lab, sub] of [[true, L('Easy', 'సులభం'), L('Best for kids & first time', 'పిల్లలకు, కొత్తవారికి')], [false, L('Normal', 'సాధారణం'), L('Real farming', 'నిజమైన వ్యవసాయం')]]) dif.appendChild(h('button', { class: easy === e ? 'on' : '', type: 'button', onclick: () => { easy = e; drawDif(); } }, lab, h('small', null, sub))); };
      drawDif();
      const go = h('button', { class: 'tbtn pri', id: 'startFarming', onclick: () => { Audio2.unlock(); Coach.prime(); Game.autoFullscreen(); onNew({ name: (name.value || 'Raju').trim().slice(0, 18), gender, easy }); } }, L('Start farming', 'వ్యవసాయం మొదలుపెట్టండి'), h('span', null, '→'));
      f.append(h('label', { for: 'pnameInput', style: { fontWeight: 600 } }, L('Your name', 'మీ పేరు')), name, av, dif, go);
      requestAnimationFrame(() => { try { go.scrollIntoView({ block: 'nearest' }); } catch (e) { /* old browsers */ } });   // short phone screens: keep Start in view
      if (!isMobile) name.focus();   // phones: no keyboard popping over the screen
    };
    segs(); acts();
    Account.pill();
  },
};

// ---------------- NPC dialogue ----------------
const Dialog = {
  open(n) {
    const S = G.S;
    n.talking = true;
    Bus.emit('talk', { npc: n });
    const today = Time.day();
    S.relDay = S.relDay || {};
    if (S.relDay[n.id] !== today) { S.relDay[n.id] = today; Rel.add(n.id, 1); }
    const hr = Time.hour(); const W = Weather.cur;
    const greet = W.rain > 0.3 ? pick(GREET.rain) : W.id === 'heatwave' ? pick(GREET.heat) : hr < 11 ? pick(GREET.morning) : hr < 17 ? pick(GREET.day) : pick(GREET.evening);
    let say = LN(greet);
    const opts = [];
    const svc = { srinu: () => UI.shop('seed'), mallesh: () => UI.shop('kirana'), yadamma: () => UI.foodMenu(['tea', 'samosa', 'majjiga'], L("Yadamma's tea stall", 'యాదమ్మ టీ స్టాల్')), bhaskar: () => UI.workshop(), venkatesh: () => UI.yardMenu(Player.vehicle), sujatha: () => Services.doctor(), sarpanch: () => UI.villageMenu(), hanmanthu: () => UI.financeMenu('lender'), anjali: () => UI.financeMenu('bank') };
    const svcLabel = { srinu: L('Show me seeds and fertilizer', 'విత్తనాలు, ఎరువులు చూపించండి'), mallesh: L('What do you have?', 'ఏమేమి ఉన్నాయి?'), yadamma: L('One chai, please', 'ఒక చాయ్ ఇవ్వండి'), bhaskar: L('About tractors…', 'ట్రాక్టర్ల గురించి…'), venkatesh: L("Today's prices?", 'ఈ రోజు ధరలు?'), sujatha: L("I don't feel well", 'నాకు ఒంట్లో బాగాలేదు'), sarpanch: L('Village development', 'గ్రామాభివృద్ధి'), hanmanthu: L('I need a loan', 'నాకు అప్పు కావాలి'), anjali: L('Loans and deposits', 'రుణాలు, డిపాజిట్లు') };
    if (n.id === 'sarpanch') say = L(`Namaskaram, ${S.player.name}! Ramapuram grows when its farmers grow. ${S.flags.boreFixed ? 'Thank you for fixing the borewell.' : 'The borewell under the water tank is broken — can you help?'}`, `నమస్కారం ${S.player.name} గారూ! రైతులు ఎదిగితేనే రామాపురం ఎదుగుతుంది. ${S.flags.boreFixed ? 'బోరు బాగుచేసినందుకు ధన్యవాదాలు.' : 'నీటి ట్యాంకు కింద బోరు పాడైంది — సహాయం చేస్తారా?'}`);
    if (n.id === 'ramulu' || n.type === 'farmer' || n.type === 'seetha' || n.type === 'elder') say += ' ' + LN(this.smartTip(n));
    if (n.id === 'hanmanthu') say = L('Money? I always have money. Just remember — interest every single day.', 'డబ్బా? నా దగ్గర ఎప్పుడూ ఉంటుంది. గుర్తుంచుకోండి — వడ్డీ ప్రతి రోజూ.');
    if (n.id === 'bhaskar') say = L('A tractor ploughs in an hour what bullocks plough in a day. Rent one, or buy a Bhoomi 35.', 'ఎడ్లు రోజంతా దున్నేది ట్రాక్టర్ గంటలో దున్నుతుంది. అద్దెకు తీసుకోండి, లేదా భూమి 35 కొనండి.');
    if (n.type === 'child') say = pick([L('Anna! Will you take us to the fields?', 'అన్నా! మమ్మల్ని పొలానికి తీసుకెళ్తావా?'), L('School was fun today. Ravi Sir taught us about rain!', 'ఈ రోజు బడిలో బాగుంది. రవి సార్ వాన గురించి నేర్పారు!'), L('Can I ride the bullock cart?', 'నేను ఎడ్లబండి ఎక్కొచ్చా?')]);
    if (svc[n.id]) opts.push({ label: svcLabel[n.id], act: () => { this.close(n); svc[n.id](); } });
    opts.push({ label: L('Any advice?', 'ఏదైనా సలహా?'), act: () => { UI.sheetState && (UI.sheetState.say = LN(this.smartTip(n))); this.render(n, LN(this.smartTip(n)), opts); } });
    opts.push({ label: L('Goodbye', 'సెలవు'), act: () => this.close(n), alt: true });
    this.render(n, say, opts);
    Audio2.sfx('click');
  },
  render(n, say, opts) {
    UI.sheet({ title: LN(n.name), sub: n.role ? LN(n.role) : (n.h.app.age === 'child' ? L('Village kid', 'ఊరి పిల్లవాడు') : L('Villager', 'గ్రామస్తుడు')), narrow: true, onClose: () => { n.talking = false; }, render: (b) => {
      const col = KIND_COL[n.type] || '#6b5a48';
      const initial = firstGrapheme(LN(n.name));
      b.appendChild(h('div', { class: 'dlg' }, h('div', { class: 'avatar', style: { background: col } }, initial), h('div', { style: { minWidth: 0 } }, h('p', { class: 'say' }, say),
        h('div', { class: 'opts' }, ...opts.map((o) => h('button', { class: 'btn ' + (o.alt ? 'alt' : ''), onclick: () => { Audio2.sfx('click'); o.act(); } }, o.label))),
        h('p', { class: 'empty' }, L('Friendship: ', 'స్నేహం: ') + Math.round(Rel.get(n.id))))));
    } });
  },
  close(n) { n.talking = false; UI.close(); },
  smartTip(n) {
    const mine = Fields.playerFields();
    for (const f of mine) {
      const cd = f.crop ? CROPS[f.crop] : null;
      if (cd && f.outbreak) return { en: `I saw ${cd.pestName.en} in your ${f.label()}. Spray today, not tomorrow.`, te: `మీ ${f.label()}లో ${cd.pestName.te} చూశాను. రేపు కాదు, ఈ రోజే పిచికారీ చేయండి.` };
      if (cd && f.water < cd.wLo) return { en: `Your ${f.label()} is thirsty. ${f.borewell ? 'Switch on the pump.' : f.canal ? 'Open the canal gate.' : 'A borewell would help that field.'}`, te: `మీ ${f.label()}కు నీరు కావాలి. ${f.borewell ? 'మోటార్ వేయండి.' : f.canal ? 'కాలువ తూము తెరవండి.' : 'ఆ పొలానికి బోరు వేయిస్తే మంచిది.'}` };
      if (cd && f.growth >= 0.97) return { en: `Your ${cd.en} is ready. Don't leave it standing — it loses quality every day.`, te: `మీ ${cd.te} కోతకు సిద్ధం. అలాగే వదిలేయకండి — రోజురోజుకు నాణ్యత తగ్గుతుంది.` };
      if (cd && f.weeds > 35) return { en: `Weeds are taking over ${f.label()}. Use the hoe or herbicide.`, te: `${f.label()}లో కలుపు పెరిగిపోయింది. పార లేదా కలుపు మందు వాడండి.` };
      if (cd && f.nut < 25) return { en: `${f.label()} looks pale. It needs urea or DAP.`, te: `${f.label()} పాలిపోయినట్టుంది. యూరియా లేదా డీఏపీ వేయండి.` };
      if (f.heap && Weather.cur.rain > 0.2) return { en: 'Your harvest is getting wet in the open! Move it into storage.', te: 'మీ పంట కుప్ప వానలో తడుస్తోంది! నిల్వలోకి తరలించండి.' };
    }
    const s = Time.season();
    const best = CROP_IDS.filter((c) => CROPS[c].season[s] >= 1).sort((a, b) => Market.trend(b) - Market.trend(a));
    if (best.length && frand() < 0.5) return { en: `This season ${CROPS[best[0]].en} does well, and its price is ${Market.trend(best[0]) >= 0 ? 'rising' : 'steady'}.`, te: `ఈ సీజన్‌లో ${CROPS[best[0]].te} బాగా పండుతుంది, ధర ${Market.trend(best[0]) >= 0 ? 'పెరుగుతోంది' : 'స్థిరంగా ఉంది'}.` };
    return pick(TIPS);
  },
};

// ---------------- minimap & full map ----------------
// Places shown with icons: [interaction id or POI key, icon, colour, English, Telugu, label priority]
const MAP_PLACES = [
  ['home', 'home', '#d99a12', 'Your house', 'మీ ఇల్లు', 1], ['seed', 'seed', '#2f7d3a', 'Seed shop', 'విత్తనాల దుకాణం', 1],
  ['kirana', 'bag', '#c0392b', 'Kirana', 'కిరాణం', 2], ['tea', 'cup', '#d9531e', 'Tea stall', 'టీ స్టాల్', 2],
  ['workshop', 'tractor', '#20364a', 'Tractor workshop', 'ట్రాక్టర్ వర్క్‌షాప్', 1], ['temple', 'temple', '#c2501a', 'Temple', 'గుడి', 2],
  ['panchayat', 'flag', '#2f5d8a', 'Panchayat', 'పంచాయతీ', 2], ['phc', 'plus', '#2e8b57', 'Health centre', 'ఆరోగ్య కేంద్రం', 2],
  ['lender', 'coin', '#7a2f2f', 'Moneylender', 'వడ్డీ వ్యాపారి', 3], ['busV', 'bus', '#6b3fa0', 'Bus stop', 'బస్ స్టాప్', 2],
  ['busT', 'bus', '#6b3fa0', 'Town bus stand', 'పట్టణ బస్ స్టాండ్', 2], ['bank', 'bank', '#1f3f8a', 'Bank', 'బ్యాంకు', 2],
  ['dealer', 'tractor', '#b8321f', 'Kisan Motors', 'కిసాన్ మోటార్స్', 2], ['tiffin', 'cup', '#e07b22', 'Tiffin centre', 'టిఫిన్ సెంటర్', 3],
  ['yardSell', 'scale', '#a86a12', 'Market yard', 'మార్కెట్ యార్డ్', 1], ['petrol', 'fuel', '#b8321f', 'Petrol bunk', 'పెట్రోల్ బంక్', 2],
  ['dhaba', 'cup', '#d9531e', 'Dhaba', 'దాబా', 3], ['santha', 'basket', '#8a5a2a', 'Santha ground', 'సంత మైదానం', 3],
  ['ghat', 'water', '#2f6fb0', 'Lake ghat', 'చెరువు ఘాట్', 3], ['shrine', 'hill', '#c2501a', 'Hill shrine', 'గుట్ట గుడి', 3],
];
// small white glyph on a coloured disc
function mapIcon(ctx, kind, x, y, r, col, ring) {
  ctx.save(); ctx.translate(x, y);
  ctx.beginPath(); ctx.arc(0, 0, r, 0, TAU); ctx.fillStyle = col; ctx.fill();
  ctx.lineWidth = Math.max(1.2, r * 0.2); ctx.strokeStyle = ring || '#fffaf0'; ctx.stroke();
  const k = r / 10; ctx.scale(k, k);
  ctx.fillStyle = '#fff'; ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  const P = (pts, close = true) => { ctx.beginPath(); pts.forEach(([a, b], i) => (i ? ctx.lineTo(a, b) : ctx.moveTo(a, b))); if (close) ctx.closePath(); };
  const dot = (a, b, rr) => { ctx.beginPath(); ctx.arc(a, b, rr, 0, TAU); ctx.fill(); };
  switch (kind) {
    case 'home': P([[-6, 0], [0, -6], [6, 0], [4.5, 0], [4.5, 5.5], [-4.5, 5.5], [-4.5, 0]]); ctx.fill(); break;
    case 'seed': P([[0, 6], [0, -1]], false); ctx.stroke(); ctx.beginPath(); ctx.ellipse(-3.2, -2.4, 3.6, 1.8, -0.6, 0, TAU); ctx.fill(); ctx.beginPath(); ctx.ellipse(3.2, -3.4, 3.6, 1.8, 0.6, 0, TAU); ctx.fill(); break;
    case 'bag': P([[-5, -2], [5, -2], [4, 6], [-4, 6]]); ctx.fill(); ctx.beginPath(); ctx.arc(0, -2, 3, Math.PI, 0); ctx.stroke(); break;
    case 'cup': P([[-5, -2], [3, -2], [2.4, 5], [-4.4, 5]]); ctx.fill(); ctx.beginPath(); ctx.arc(3.6, 1.4, 2.2, -1.2, 1.4); ctx.stroke(); P([[-2.5, -4.5], [-2, -7]], false); ctx.stroke(); P([[0.5, -4.5], [1, -7]], false); ctx.stroke(); break;
    case 'tractor': dot(-2.5, 2, 4); dot(4.5, 3.8, 2.3); P([[-1, -1], [5.5, -1], [5.5, 2], [-1, 2]]); ctx.fill(); P([[-3, -6], [1, -6], [1, -1], [-3, -1]]); ctx.fill(); ctx.fillStyle = col; dot(-2.5, 2, 1.6); break;
    case 'temple': P([[-6, 6], [6, 6], [4, 1], [2.6, 1], [1.8, -3], [0.9, -3], [0, -7], [-0.9, -3], [-1.8, -3], [-2.6, 1], [-4, 1]]); ctx.fill(); break;
    case 'flag': P([[-4, 7], [-4, -7]], false); ctx.stroke(); P([[-4, -7], [5.5, -4.5], [-4, -1.5]]); ctx.fill(); break;
    case 'plus': ctx.fillRect(-1.9, -6, 3.8, 12); ctx.fillRect(-6, -1.9, 12, 3.8); break;
    case 'coin': ctx.font = '800 13px "Hind Guntur", sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('₹', 0, 0.8); break;
    case 'bus': P([[-5.5, -5.5], [5.5, -5.5], [5.5, 4], [-5.5, 4]]); ctx.fill(); ctx.fillStyle = col; ctx.fillRect(-4, -4, 8, 3.2); ctx.fillStyle = '#fff'; dot(-3, 5, 1.6); dot(3, 5, 1.6); break;
    case 'bank': P([[-6.5, -2.5], [0, -7], [6.5, -2.5]]); ctx.fill(); for (const xx of [-4.5, -0.8, 2.9]) ctx.fillRect(xx, -1.5, 1.7, 6); ctx.fillRect(-6.5, 5, 13, 1.8); break;
    case 'fuel': P([[-5, -6], [2, -6], [2, 6], [-5, 6]]); ctx.fill(); ctx.fillStyle = col; ctx.fillRect(-3.6, -4.5, 4.2, 3); P([[2, -2], [5, 0], [5, 4]], false); ctx.stroke(); break;
    case 'scale': P([[0, -6], [0, 6]], false); ctx.stroke(); P([[-6, -3.5], [6, -3.5]], false); ctx.stroke(); P([[-6, -3.5], [-8, 1.5], [-4, 1.5]]); ctx.fill(); P([[6, -3.5], [4, 1.5], [8, 1.5]]); ctx.fill(); ctx.fillRect(-3.5, 5.2, 7, 1.8); break;
    case 'basket': P([[-6.5, -1], [6.5, -1], [4.5, 6], [-4.5, 6]]); ctx.fill(); ctx.fillStyle = col; for (const xx of [-3, 0, 3]) dot(xx, -2.8, 2.1); ctx.fillStyle = '#fff'; for (const xx of [-3, 0, 3]) dot(xx, -3.2, 1.5); break;
    case 'water': for (const yy of [-3.5, 0.5, 4.5]) { ctx.beginPath(); ctx.moveTo(-6.5, yy); ctx.bezierCurveTo(-3.5, yy - 3, -1.5, yy + 3, 1.2, yy); ctx.bezierCurveTo(3.5, yy - 3, 5, yy + 2, 6.5, yy); ctx.stroke(); } break;
    case 'hill': P([[-7, 6], [-1, -3], [2, 1], [3.5, -1], [7, 6]]); ctx.fill(); P([[-1, -3], [-1, -8]], false); ctx.lineWidth = 1.4; ctx.stroke(); P([[-1, -8], [3, -6.6], [-1, -5.2]]); ctx.fill(); break;
    case 'field': ctx.lineWidth = 1.6; for (let i = -1; i <= 1; i++) { P([[-6, i * 3.6], [6, i * 3.6]], false); ctx.stroke(); } P([[-6, -6], [6, -6], [6, 6], [-6, 6]]); ctx.stroke(); break;
    case 'star': P(Array.from({ length: 10 }, (_, i) => { const a = -Math.PI / 2 + i * Math.PI / 5, rr = i % 2 ? 3.2 : 7.2; return [Math.cos(a) * rr, Math.sin(a) * rr]; })); ctx.fill(); break;
    case 'pin': dot(0, 0, 3.6); break;
  }
  ctx.restore();
}

const Map2 = {
  x0: -800, z0: -800, span: 1600, N: 1024, k: 0.64, base: null, terrain: null, roadsC: null, composedAt: 0, miniR: 0,
  view: null, full: null,
  build() {
    this.N = isMobile ? 768 : 1024; this.k = this.N / this.span;
    this.terrain = this.renderTerrain();
    this.roadsC = this.renderRoads();
    this.base = document.createElement('canvas'); this.base.width = this.base.height = this.N;
    this.compose();
    Bus.on('landBought', () => this.compose()); Bus.on('landLeased', () => this.compose());
  },
  canvasXY(x, z) { return [(x - this.x0) * this.k, (z - this.z0) * this.k]; },
  // terrain colours from the same weights the 3D ground uses, with hill shading, water and buildings
  renderTerrain() {
    const N = this.N, k = this.k; const c = document.createElement('canvas'); c.width = c.height = N; const ctx = c.getContext('2d');
    const img = ctx.createImageData(N, N); const d = img.data;
    const H = World.heights, TN = World.N, step = World.step, half = WORLD_HALF;
    const W4 = World.terrainMesh.geometry.attributes.color.array;
    const RED = [168, 102, 64], BLK = [92, 78, 64], LUSH = [104, 150, 66], DRY = [178, 163, 104], ROCK = [156, 150, 140], DIRT = [196, 172, 132];
    // per-vertex hill shade, interpolated per pixel below
    const SH = new Float32Array(TN * TN);
    for (let j = 1; j < TN - 1; j++) for (let i = 1; i < TN - 1; i++) { const hk = j * TN + i; SH[hk] = clamp(1 + (H[hk - 1] - H[hk + 1]) * 0.07 + (H[hk - TN] - H[hk + TN]) * 0.07, 0.72, 1.28); }
    for (let i = 0; i < TN; i++) { SH[i] = SH[i + TN] || 1; SH[(TN - 1) * TN + i] = SH[(TN - 2) * TN + i] || 1; }
    for (let j = 0; j < TN; j++) { SH[j * TN] = SH[j * TN + 1] || 1; SH[j * TN + TN - 1] = SH[j * TN + TN - 2] || 1; }
    const ROOF = [178, 92, 66], VIL = [205, 186, 150], WATER = [62, 132, 190], DEEP = [38, 92, 150];
    const green = clamp01(U.uGreen.value);
    const w = [0, 0, 0, 0];
    for (let j = 0; j < N; j++) {
      const z = this.z0 + (j + 0.5) / k;
      const fj = clamp((z + half) / step, 0, TN - 1.001), j0 = Math.floor(fj), tj = fj - j0;
      for (let i = 0; i < N; i++) {
        const x = this.x0 + (i + 0.5) / k;
        const fi = clamp((x + half) / step, 0, TN - 1.001), i0 = Math.floor(fi), ti = fi - i0;
        const q00 = (j0 * TN + i0) * 4, q10 = q00 + 4, q01 = q00 + TN * 4, q11 = q01 + 4;
        for (let c2 = 0; c2 < 4; c2++) w[c2] = (W4[q00 + c2] * (1 - ti) + W4[q10 + c2] * ti) * (1 - tj) + (W4[q01 + c2] * (1 - ti) + W4[q11 + c2] * ti) * tj;
        const gw = w[0], rd = w[1], rk = clamp01(w[2]), dt = clamp01(w[3]);
        const gm = smoothstep(0.25, 0.75, gw);
        let r = 0, g = 0, b = 0;
        for (let c2 = 0; c2 < 3; c2++) {
          const soil = BLK[c2] + (RED[c2] - BLK[c2]) * rd;
          const grass = DRY[c2] + (LUSH[c2] - DRY[c2]) * green;
          let v = soil + (grass - soil) * gm;
          v += (DIRT[c2] - v) * dt; v += (ROCK[c2] - v) * rk;
          if (c2 === 0) r = v; else if (c2 === 1) g = v; else b = v;
        }
        // hill shading (light from the north-west)
        const v00 = j0 * TN + i0;
        const sh = (SH[v00] * (1 - ti) + SH[v00 + 1] * ti) * (1 - tj) + (SH[v00 + TN] * (1 - ti) + SH[v00 + TN + 1] * ti) * tj;
        r = (r * 0.75 + 128 * 0.25) * sh; g = (g * 0.75 + 132 * 0.25) * sh; b = (b * 0.75 + 92 * 0.25) * sh;
        const o = World.occGet(x, z);
        if (o === OCC.BUILD) { r = ROOF[0]; g = ROOF[1]; b = ROOF[2]; }
        else if (o === OCC.VILLAGE) { r = r * 0.35 + VIL[0] * 0.65; g = g * 0.35 + VIL[1] * 0.65; b = b * 0.35 + VIL[2] * 0.65; }
        if (Math.abs(x - LAKE.x) < LAKE.r + 50 && Math.abs(z - LAKE.z) < LAKE.r + 50) {
          const sd = lakeSD(x, z);
          if (sd < 0) { const dp = smoothstep(0, 45, -sd); r = WATER[0] + (DEEP[0] - WATER[0]) * dp; g = WATER[1] + (DEEP[1] - WATER[1]) * dp; b = WATER[2] + (DEEP[2] - WATER[2]) * dp; }
          else if (sd < 3) { r = r * 0.5 + 120; g = g * 0.5 + 115; b = b * 0.5 + 95; }
        }
        const p = (j * N + i) * 4;
        d[p] = r; d[p + 1] = g; d[p + 2] = b; d[p + 3] = 255;
      }
    }
    ctx.putImageData(img, 0, 0);
    // tree canopy dots
    if (Veg.sets) for (const S of Veg.sets) {
      if (S.small) continue;
      const rr = S.kind === 'banyan' ? 4.5 : S.kind === 'palm' || S.kind === 'datepalm' || S.kind === 'eucalyptus' ? 1.3 : 2.1;
      ctx.fillStyle = S.kind === 'mango' ? 'rgba(34,70,24,.85)' : 'rgba(46,88,34,.8)';
      for (let i = 0; i < S.n; i++) { ctx.beginPath(); ctx.arc((S.xs[i] - this.x0) * k, (S.zs[i] - this.z0) * k, Math.max(1, rr * k * 1.6), 0, TAU); ctx.fill(); }
    }
    return c;
  },
  renderRoads() {
    const N = this.N, k = this.k; const c = document.createElement('canvas'); c.width = c.height = N; const ctx = c.getContext('2d');
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    const path = (pts) => { ctx.beginPath(); pts.forEach((p, i) => { const x = (p.x - this.x0) * k, y = (p.z - this.z0) * k; if (i) ctx.lineTo(x, y); else ctx.moveTo(x, y); }); };
    const canal = CANAL.samples || CANAL.pts.map(([x, z]) => ({ x, z }));
    path(canal); ctx.strokeStyle = 'rgba(220,238,248,.9)'; ctx.lineWidth = Math.max(4, (CANAL.w + 3) * k); ctx.stroke();
    ctx.strokeStyle = '#3d86c6'; ctx.lineWidth = Math.max(2.4, CANAL.w * k); ctx.stroke();
    const sty = { hwy: { cas: '#4a4741', fill: '#b9b4a8', min: 6 }, main: { cas: '#6c5c47', fill: '#fbf3dc', min: 3.2 }, village: { cas: '#857358', fill: '#efe2c4', min: 2.6 }, track: { cas: '#7a5f44', fill: '#d6bb8f', min: 1.9 } };
    const order = ['track', 'village', 'main', 'hwy'];
    for (const pass of ['cas', 'fill']) for (const kind of order) for (const r of ROADS) {
      const kk = r.kind === 'cc' ? 'village' : r.kind; if (kk !== kind || !r.samples) continue;
      const st = sty[kind]; const w = Math.max(st.min, r.w * k * 1.25);
      path(r.samples); ctx.strokeStyle = st[pass]; ctx.lineWidth = pass === 'cas' ? w + 1.8 : w; ctx.stroke();
    }
    const hwy = ROADS.find((r) => r.kind === 'hwy');
    if (hwy) { path(hwy.samples); ctx.setLineDash([6, 6]); ctx.strokeStyle = '#e8c547'; ctx.lineWidth = 1; ctx.stroke(); ctx.setLineDash([]); }
    return c;
  },
  fieldColor(f) {
    if (f.crop && f.sownTiles > 0) { const cd = CROPS[f.crop]; return f.growth > 0.85 ? cd.ripe : f.growth > 0.25 ? cd.leaf : (f.soil === 'red' ? '#8a5a36' : '#4a4034'); }
    const pl = f.countMin(1) / Math.max(1, f.n);
    if (f.soil === 'red') return pl > 0.5 ? '#86452a' : f.wasStubble ? '#a07a52' : '#94643f';
    return pl > 0.5 ? '#3e352d' : f.wasStubble ? '#62574a' : '#4c4136';
  },
  fsig(f) { return (f.crop && f.sownTiles > 0 ? f.crop + (f.growth > 0.85 ? 2 : f.growth > 0.25 ? 1 : 0) : f.countMin(1) * 2 > f.n ? 'p' : f.wasStubble ? 's' : 'n') + (f.isPlayer ? 'o' : f.avail ? 'a' : ''); },
  // one field on the map: fill, bund line, roads over it, ownership outline
  drawField(ctx, f) {
    const k = this.k; const x = Math.floor((f.x0 - this.x0) * k), y = Math.floor((f.z0 - this.z0) * k), w = Math.ceil(f.w * k), h = Math.ceil(f.d * k);
    ctx.fillStyle = this.fieldColor(f); ctx.fillRect(x, y, w, h);
    ctx.strokeStyle = 'rgba(70,48,30,.6)'; ctx.lineWidth = 1; ctx.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
    ctx.drawImage(this.roadsC, x, y, w, h, x, y, w, h);
    if (f.isPlayer) { ctx.strokeStyle = '#ffd23a'; ctx.lineWidth = 2.6; ctx.strokeRect(x + 1.3, y + 1.3, w - 2.6, h - 2.6); }
    else if (f.avail) { ctx.setLineDash([4, 3]); ctx.strokeStyle = '#ff7a45'; ctx.lineWidth = 1.8; ctx.strokeRect(x + 1, y + 1, w - 2, h - 2); ctx.setLineDash([]); }
    f.mapSig = this.fsig(f);
  },
  compose() {
    if (!this.base) return;
    const ctx = this.base.getContext('2d');
    ctx.drawImage(this.terrain, 0, 0);
    ctx.drawImage(this.roadsC, 0, 0);
    for (const f of Fields.list) this.drawField(ctx, f);
    this.composedAt = performance.now();
  },
  // repaint only the fields whose look changed (a few at a time, no hitch)
  refreshFields() {
    this.composedAt = performance.now();
    const ctx = this.base.getContext('2d'); let n = 0;
    for (const f of Fields.list) { if (this.fsig(f) === f.mapSig) continue; this.drawField(ctx, f); if (++n >= 10) break; }
  },
  places() {
    if (this._places) return this._places;
    if (!Interact.list.some((q) => q.id === 'home')) return [];
    const out = [];
    for (const [id, icon, col, en, te, pri] of MAP_PLACES) {
      let p = null;
      if (id === 'ghat') p = POI.ghat; else if (id === 'shrine') p = POI.shrine;
      else { const o = Interact.list.find((q) => q.id === id); if (o) p = o; }
      if (p) out.push({ id, icon, col, en, te, pri, x: p.x, z: p.z });
    }
    this._places = out; return out;
  },
  placeName(p) { return L(p.en, p.te); },
  // the place, mission target or waypoint the guide is pointing at
  target() {
    const wp = G.S && G.S.waypoint;
    if (wp) return { x: wp.x, z: wp.z, name: wp.name || L('Waypoint', 'గమ్యం'), wp: true };
    const st = Coach.step;   // the next step of the mission you follow
    if (st && st.target) return { x: st.target.x, z: st.target.z, name: st.target.name, m: st.m };
    return null;
  },
  fmtDist(d) { return d >= 1000 ? (d / 1000).toFixed(1) + ' km' : Math.round(d) + ' m'; },
  // ---- minimap: north-up, zooms out with vehicle speed ----
  drawMini() {
    const cv = document.getElementById('minimap'); if (!cv || !this.base) return;
    if (performance.now() - this.composedAt > 2000) this.refreshFields();
    const dpr = Math.min(2, window.devicePixelRatio || 1); const W = Math.max(64, Math.round((cv.clientWidth || 132) * dpr));
    if (cv.width !== W) { cv.width = W; cv.height = W; }
    const ctx = cv.getContext('2d'); const P = Player.pos(); const v = Player.vehicle;
    const want = v ? clamp(120 + Math.abs(v.speed) * 7, 120, 280) : 100;
    this.miniR = this.miniR ? this.miniR + (want - this.miniR) * 0.15 : want;
    const R = this.miniR, k = this.k, s = W / (2 * R);
    ctx.fillStyle = '#7a8a58'; ctx.fillRect(0, 0, W, W);
    ctx.imageSmoothingEnabled = true;
    ctx.drawImage(this.base, (P.x - R - this.x0) * k, (P.z - R - this.z0) * k, 2 * R * k, 2 * R * k, 0, 0, W, W);
    const toS = (x, z) => [W / 2 + (x - P.x) * s, W / 2 + (z - P.z) * s];
    // camera view cone
    _vegFw.set(0, 0, -1).applyQuaternion(G.camera.quaternion);
    const ca = Math.atan2(_vegFw.x, -_vegFw.z);
    ctx.save(); ctx.translate(W / 2, W / 2); ctx.rotate(ca);
    const cone = ctx.createRadialGradient(0, 0, 0, 0, 0, W * 0.42); cone.addColorStop(0, 'rgba(255,248,220,.45)'); cone.addColorStop(1, 'rgba(255,248,220,0)');
    ctx.fillStyle = cone; ctx.beginPath(); ctx.moveTo(0, 0); ctx.arc(0, 0, W * 0.42, -Math.PI / 2 - 0.62, -Math.PI / 2 + 0.62); ctx.closePath(); ctx.fill(); ctx.restore();
    const edge = W / 2 - 3 * dpr;
    const ir = 6.5 * dpr;
    for (const pl of this.places()) { const [x, y] = toS(pl.x, pl.z); if (Math.hypot(x - W / 2, y - W / 2) < edge - ir) mapIcon(ctx, pl.icon, x, y, ir, pl.col); }
    for (const q of Vehicles.player) { if (q === v) continue; const [x, y] = toS(q.x, q.z); if (Math.hypot(x - W / 2, y - W / 2) < edge - 4 * dpr) { ctx.fillStyle = '#fff'; ctx.strokeStyle = '#1b1b1f'; ctx.lineWidth = 1.5 * dpr; ctx.beginPath(); ctx.arc(x, y, 3.6 * dpr, 0, TAU); ctx.fill(); ctx.stroke(); } }
    const t = this.target();
    if (t) this.drawTarget(ctx, toS(t.x, t.z), W / 2, W / 2, edge - 8 * dpr, dpr, t, Math.hypot(t.x - P.x, t.z - P.z), true);
    this.drawPlayer(ctx, W / 2, W / 2, dpr * 1.05);
  },
  drawPlayer(ctx, x, y, sc) {
    const hd = Player.vehicle ? Player.vehicle.yaw : Player.yaw;
    ctx.save(); ctx.translate(x, y); ctx.rotate(Math.PI - hd); ctx.scale(sc, sc);
    ctx.shadowColor = 'rgba(0,0,0,.45)'; ctx.shadowBlur = 4;
    ctx.fillStyle = '#ffcf33'; ctx.strokeStyle = '#1b1b1f'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(0, -11); ctx.lineTo(8, 9); ctx.lineTo(0, 4.5); ctx.lineTo(-8, 9); ctx.closePath(); ctx.fill(); ctx.shadowBlur = 0; ctx.stroke();
    ctx.restore();
  },
  // gold target: a pulsing marker when in view, an arrow with the distance on the rim when not
  drawTarget(ctx, [tx, ty], cx, cy, rim, dpr, t, dist, round) {
    const col = t.wp ? '#43b6ff' : '#ffc61a';
    const dx = tx - cx, dy = ty - cy; const d = Math.hypot(dx, dy);
    let out = false;
    if (round) out = d > rim; else out = Math.abs(dx) > cx - 16 * dpr || Math.abs(dy) > cy - 16 * dpr;
    if (!out) {
      const pulse = 0.5 + 0.5 * Math.sin(G.t * 5);
      ctx.beginPath(); ctx.arc(tx, ty, (9 + pulse * 6) * dpr, 0, TAU); ctx.strokeStyle = col; ctx.globalAlpha = 0.8 - pulse * 0.5; ctx.lineWidth = 2.5 * dpr; ctx.stroke(); ctx.globalAlpha = 1;
      mapIcon(ctx, t.wp ? 'pin' : 'star', tx, ty, 7.5 * dpr, t.wp ? '#1d7fc4' : '#d99a12', '#fff');
      return;
    }
    const a = Math.atan2(dy, dx);
    let ex, ey;
    if (round) { ex = cx + Math.cos(a) * rim; ey = cy + Math.sin(a) * rim; }
    else { const m = 16 * dpr; const sx = (cx - m) / Math.abs(Math.cos(a) || 1e-6), sy = (cy - m) / Math.abs(Math.sin(a) || 1e-6); const rr = Math.min(sx, sy); ex = cx + Math.cos(a) * rr; ey = cy + Math.sin(a) * rr; }
    ctx.save(); ctx.translate(ex, ey); ctx.rotate(a);
    ctx.fillStyle = col; ctx.strokeStyle = '#1b1b1f'; ctx.lineWidth = 1.6 * dpr;
    ctx.beginPath(); ctx.moveTo(8 * dpr, 0); ctx.lineTo(-6 * dpr, -7 * dpr); ctx.lineTo(-3 * dpr, 0); ctx.lineTo(-6 * dpr, 7 * dpr); ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.restore();
    const lx = ex - Math.cos(a) * 20 * dpr, ly = ey - Math.sin(a) * 15 * dpr;
    const txt = this.fmtDist(dist);
    ctx.font = `800 ${10.5 * dpr}px "Hind Guntur", sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.lineWidth = 3 * dpr; ctx.strokeStyle = 'rgba(20,18,28,.85)'; ctx.strokeText(txt, lx, ly); ctx.fillStyle = '#fff6d8'; ctx.fillText(txt, lx, ly);
  },
  // ---- full map: drag to pan, wheel or pinch to zoom, tap a place for options ----
  open(body) {
    const P = Player.pos();
    if (!this.view) this.view = { cx: P.x, cz: P.z, s: 0 };
    else { this.view.cx = P.x; this.view.cz = P.z; }
    const wrap = h('div', { class: 'mapx' });
    const box = h('div', { class: 'mapcv' });
    const cv = h('canvas', { id: 'fullmap', 'aria-label': L('Map of the mandal', 'మండలం మ్యాప్') });
    const btn = (t, lab, fn) => h('button', { 'aria-label': lab, title: lab, onclick: (e) => { e.stopPropagation(); fn(); Audio2.sfx('click'); } }, t);
    box.append(cv, h('div', { class: 'mapbtns' },
      btn('+', L('Zoom in', 'జూమ్ ఇన్'), () => this.zoom(1.5)), btn('−', L('Zoom out', 'జూమ్ అవుట్'), () => this.zoom(1 / 1.5)),
      btn('◎', L('Centre on me', 'నా దగ్గరికి'), () => { const q = Player.pos(); this.view.cx = q.x; this.view.cz = q.z; this.fullDirty = true; })));
    const side = h('div', { class: 'mapside' });
    const sel = h('div', { class: 'mapsel' });
    const lg = h('div', { class: 'legend' });
    for (const [c, t] of [['#ffcf33', L('You', 'మీరు')], ['#ffd23a', L('Your fields', 'మీ పొలాలు')], ['#ff7a45', L('For sale / lease', 'అమ్మకం / కౌలు')], ['#d99a12', L('Mission', 'లక్ష్యం')], ['#43b6ff', L('Waypoint', 'గమ్యం')]]) lg.appendChild(h('span', null, h('i', { style: { background: c } }), t));
    side.append(sel, lg);
    wrap.append(box, side); body.appendChild(wrap);
    this.full = { cv, box, sel, sel0: null };
    this.renderSel(null);
    this.bindFull(cv);
    this.sizeFull();
    this._fullLoop = () => { if (!this.full) return; if (!this.full.cv.isConnected) { this.close(); return; } this.drawFull(); requestAnimationFrame(this._fullLoop); };
    requestAnimationFrame(this._fullLoop);
    this._onResize = () => this.sizeFull(); window.addEventListener('resize', this._onResize);
  },
  close() { this.full = null; if (this._onResize) window.removeEventListener('resize', this._onResize); },
  sizeFull() {
    const F = this.full; if (!F) return;
    const dpr = Math.min(2, window.devicePixelRatio || 1); const w = Math.max(120, F.box.clientWidth), hh = Math.max(120, F.box.clientHeight);
    F.cv.width = Math.round(w * dpr); F.cv.height = Math.round(hh * dpr); F.dpr = dpr; F.w = w; F.h = hh;
    if (!this.view.s) this.view.s = Math.min(w, hh) / 520;
    this.fullDirty = true;
  },
  zoom(f, sx, sy) {
    const F = this.full; if (!F) return; const V = this.view;
    const ax = sx === undefined ? F.w / 2 : sx, ay = sy === undefined ? F.h / 2 : sy;
    const wx = V.cx + (ax - F.w / 2) / V.s, wz = V.cz + (ay - F.h / 2) / V.s;
    V.s = clamp(V.s * f, Math.min(F.w, F.h) / 1500, 6);
    V.cx = wx - (ax - F.w / 2) / V.s; V.cz = wz - (ay - F.h / 2) / V.s;
    this.clampView(); this.fullDirty = true;
  },
  clampView() { const V = this.view; V.cx = clamp(V.cx, -760, 760); V.cz = clamp(V.cz, -760, 760); },
  screenToWorld(sx, sy) { const F = this.full, V = this.view; return { x: V.cx + (sx - F.w / 2) / V.s, z: V.cz + (sy - F.h / 2) / V.s }; },
  bindFull(cv) {
    const ptrs = new Map(); let moved = 0, pinch = 0;
    const local = (e) => { const r = cv.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top]; };
    cv.addEventListener('pointerdown', (e) => { try { cv.setPointerCapture(e.pointerId); } catch (err) { /* synthetic pointer */ } ptrs.set(e.pointerId, local(e)); moved = 0; if (ptrs.size === 2) { const [a, b] = [...ptrs.values()]; pinch = Math.hypot(a[0] - b[0], a[1] - b[1]); } });
    cv.addEventListener('pointermove', (e) => {
      const p = ptrs.get(e.pointerId); if (!p) return; const q = local(e);
      if (ptrs.size === 1) { const dx = q[0] - p[0], dy = q[1] - p[1]; moved += Math.abs(dx) + Math.abs(dy); this.view.cx -= dx / this.view.s; this.view.cz -= dy / this.view.s; this.clampView(); this.fullDirty = true; }
      ptrs.set(e.pointerId, q);
      if (ptrs.size === 2) { const [a, b] = [...ptrs.values()]; const d = Math.hypot(a[0] - b[0], a[1] - b[1]); if (pinch > 0) this.zoom(d / pinch, (a[0] + b[0]) / 2, (a[1] + b[1]) / 2); pinch = d; moved = 99; }
    });
    const up = (e) => { const had = ptrs.size; const p = ptrs.get(e.pointerId); ptrs.delete(e.pointerId); if (ptrs.size < 2) pinch = 0; if (had === 1 && p && moved < 8 && e.type === 'pointerup') this.tap(p[0], p[1]); };
    cv.addEventListener('pointerup', up); cv.addEventListener('pointercancel', up);
    cv.addEventListener('wheel', (e) => { e.preventDefault(); const [x, y] = local(e); this.zoom(Math.exp(-e.deltaY * 0.0016), x, y); }, { passive: false });
  },
  tap(sx, sy) {
    const V = this.view; let best = null, bd = 22;
    for (const pl of this.places()) { const x = (pl.x - V.cx) * V.s + this.full.w / 2, y = (pl.z - V.cz) * V.s + this.full.h / 2; const d = Math.hypot(x - sx, y - sy); if (d < bd) { bd = d; best = pl; } }
    if (!best) for (const f of Fields.playerFields()) { const x = (f.x - V.cx) * V.s + this.full.w / 2, y = (f.z - V.cz) * V.s + this.full.h / 2; const d = Math.hypot(x - sx, y - sy); if (d < bd) { bd = d; best = { id: 'field:' + f.id, x: f.x, z: f.z, en: f.label(), te: f.label(), icon: 'field', col: '#b0861a' }; } }
    if (!best) { const w = this.screenToWorld(sx, sy); best = { id: 'wp', x: w.x, z: w.z, en: 'Marked spot', te: 'గుర్తు పెట్టిన చోటు', icon: 'pin', col: '#1d7fc4' }; }
    G.S.waypoint = { x: best.x, z: best.z, name: this.placeName(best) };
    this.renderSel(best); this.fullDirty = true; Audio2.sfx('click'); UI.dirty = true;
  },
  renderSel(pl) {
    const F = this.full; if (!F) return; const sel = F.sel; sel.innerHTML = '';
    const P = Player.pos();
    if (!pl) {
      const t = this.target();
      sel.append(h('b', null, L('Where to?', 'ఎక్కడికి?')), h('small', null, L('Tap a place on the map. The gold arrow will lead you there, or take an auto straight there.', 'మ్యాప్‌లో ఒక చోటు నొక్కండి. బంగారు బాణం దారి చూపిస్తుంది, లేదా ఆటోలో నేరుగా వెళ్ళండి.')));
      if (t) sel.append(h('small', null, L('Now heading to: ', 'ఇప్పుడు వెళ్తున్నది: ') + t.name + ' · ' + this.fmtDist(Math.hypot(t.x - P.x, t.z - P.z))));
      return;
    }
    const d = Math.hypot(pl.x - P.x, pl.z - P.z);
    const fare = Services.travelFare(d);
    sel.append(h('b', null, this.placeName(pl)), h('small', null, this.fmtDist(d) + L(' away · the gold arrow now points here', ' దూరం · బంగారు బాణం ఇటు చూపిస్తుంది')));
    const row = h('div', { class: 'opts' });
    row.appendChild(h('button', { class: 'btn acc', onclick: () => { UI.close(); Services.fastTravel(pl.x, pl.z, this.placeName(pl)); } }, Player.vehicle ? L(`Drive there now (${Math.round(Services.travelMins(d))} min)`, `ఇప్పుడే అక్కడికి నడపండి (${Math.round(Services.travelMins(d))} నిమి.)`) : L(`Take an auto there (${fmtINR(fare)})`, `ఆటోలో వెళ్ళండి (${fmtINR(fare)})`)));
    row.appendChild(h('button', { class: 'btn alt', onclick: () => { UI.close(); } }, L('Walk with the arrow', 'బాణంతో నడవండి')));
    row.appendChild(h('button', { class: 'btn alt sm', onclick: () => { G.S.waypoint = null; this.renderSel(null); this.fullDirty = true; UI.dirty = true; } }, L('Clear target', 'గమ్యం తీసేయండి')));
    sel.appendChild(row);
  },
  drawFull() {
    const F = this.full; if (!F) return;
    if (!this.fullDirty && G.frame % 6) return; this.fullDirty = false;
    const cv = F.cv, ctx = cv.getContext('2d'), dpr = F.dpr, V = this.view, k = this.k;
    const W = cv.width, H = cv.height, s = V.s * dpr;
    ctx.fillStyle = '#6b7a50'; ctx.fillRect(0, 0, W, H);
    ctx.imageSmoothingEnabled = true;
    const hw = W / 2 / s, hh = H / 2 / s;
    ctx.drawImage(this.base, (V.cx - hw - this.x0) * k, (V.cz - hh - this.z0) * k, 2 * hw * k, 2 * hh * k, 0, 0, W, H);
    const toS = (x, z) => [W / 2 + (x - V.cx) * s, H / 2 + (z - V.cz) * s];
    const P = Player.pos();
    // labels never overlap: each one claims its box, later ones that would collide are skipped
    const boxes = [], iconBoxes = [];
    const hit = (list, x0, y0, x1, y1) => list.some((b) => x0 < b[2] && x1 > b[0] && y0 < b[3] && y1 > b[1]);
    const label = (x, y, txt, size, col = '#1b1b1f', halo = 'rgba(255,250,240,.9)', avoidIcons = true) => {
      ctx.font = `700 ${size * dpr}px "Baloo Tammudu 2", "Hind Guntur", sans-serif`;
      const w = ctx.measureText(txt).width / 2 + 3 * dpr, hh2 = size * dpr * 0.62;
      const x0 = x - w, y0 = y - hh2, x1 = x + w, y1 = y + hh2;
      if (hit(boxes, x0, y0, x1, y1) || (avoidIcons && hit(iconBoxes, x0, y0, x1, y1))) return;
      boxes.push([x0, y0, x1, y1]);
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.lineJoin = 'round'; ctx.lineWidth = 4 * dpr; ctx.strokeStyle = halo; ctx.strokeText(txt, x, y); ctx.fillStyle = col; ctx.fillText(txt, x, y);
    };
    // places: icons first (they reserve their spot), then names by importance
    const ir = clamp(5 + V.s * 4, 7, 12) * dpr;
    const vis = [];
    for (const pl of this.places()) {
      const [sx, sy] = toS(pl.x, pl.z); if (sx < -20 || sy < -20 || sx > W + 20 || sy > H + 20) continue;
      mapIcon(ctx, pl.icon, sx, sy, ir, pl.col); iconBoxes.push([sx - ir, sy - ir, sx + ir, sy + ir]); vis.push([pl, sx, sy]);
    }
    const [ppx, ppy] = toS(P.x, P.z); iconBoxes.push([ppx - 12 * dpr, ppy - 12 * dpr, ppx + 12 * dpr, ppy + 12 * dpr]);
    const big = V.s < 0.9;
    for (const [x, z, en, te, sz] of [[0, -30, 'Ramapuram', 'రామాపురం', 22], [SEETHA.x, SEETHA.z - 50, 'Seethampet', 'సీతంపేట', 19], [TOWN.x - 20, TOWN.z - 60, 'Nagaram town', 'నగరం పట్టణం', 19], [LAKE.x, LAKE.z, 'Pedda Cheruvu', 'పెద్ద చెరువు', 16], [640, -640, 'Highway', 'హైవే', 14]]) { if (!big && V.s > 1.4) continue; const [sx, sy] = toS(x, z); label(sx, sy, L(en, te), big ? sz : sz * 0.85, '#2a1f14', 'rgba(255,250,240,.9)', false); }
    for (const pri of [1, 2, 3]) for (const [pl, sx, sy] of vis) if (pl.pri === pri && (pri === 1 || (pri === 2 && V.s > 0.75) || V.s > 1.4)) label(sx, sy + ir + 9 * dpr, this.placeName(pl), 12, '#1b1b1f');
    for (const f of Fields.playerFields()) { const [sx, sy] = toS(f.x, f.z); if (V.s > 0.5) label(sx, sy + Math.max(14 * dpr, f.d * s * 0.32), f.label(), 12, '#5a3a00'); }
    for (const q of Vehicles.player) { if (q === Player.vehicle) continue; const [sx, sy] = toS(q.x, q.z); ctx.fillStyle = '#fff'; ctx.strokeStyle = '#1b1b1f'; ctx.lineWidth = 1.6 * dpr; ctx.beginPath(); ctx.arc(sx, sy, 4.5 * dpr, 0, TAU); ctx.fill(); ctx.stroke(); }
    const t = this.target();
    if (t) {
      const [tx, ty] = toS(t.x, t.z); const [px, py] = toS(P.x, P.z);
      ctx.setLineDash([6 * dpr, 6 * dpr]); ctx.strokeStyle = t.wp ? 'rgba(67,182,255,.9)' : 'rgba(255,198,26,.95)'; ctx.lineWidth = 2.5 * dpr; ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(tx, ty); ctx.stroke(); ctx.setLineDash([]);
      this.drawTarget(ctx, [tx, ty], W / 2, H / 2, 0, dpr, t, Math.hypot(t.x - P.x, t.z - P.z), false);
    }
    const [px, py] = toS(P.x, P.z);
    this.drawPlayer(ctx, px, py, dpr * 1.25);
  },
};

// ---------------- on-screen guide: a gold marker over the target, or an arrow at the screen edge ----------------
const Guide = {
  el: null, last: '',
  init() {
    this.el = document.getElementById('nav');
    // gold chevron that floats ahead of you and points the way
    const sh = new THREE.Shape(); sh.moveTo(0, 1.1); sh.lineTo(0.85, -0.2); sh.lineTo(0.42, -0.2); sh.lineTo(0.42, -0.95); sh.lineTo(-0.42, -0.95); sh.lineTo(-0.42, -0.2); sh.lineTo(-0.85, -0.2); sh.closePath();
    const g = new THREE.ShapeGeometry(sh); g.rotateX(Math.PI / 2);
    this.arrow = new THREE.Mesh(g, new THREE.MeshBasicMaterial({ color: 0xffc61a, transparent: true, opacity: 0.92, depthWrite: false, fog: false, side: THREE.DoubleSide }));
    this.arrow.renderOrder = 999; this.arrow.visible = false; this.arrow.frustumCulled = false; G.scene.add(this.arrow);
  },
  update() {
    const el = this.el; if (!el) return;
    const t = G.started && !UI.photoMode && !UI.modalOpen() ? Map2.target() : null;
    const P = Player.pos();
    const dist = t ? Math.hypot(t.x - P.x, t.z - P.z) : 0;
    if (t && t.wp && dist < 10) { G.S.waypoint = null; UI.toast(L(`You reached ${t.name}.`, `${t.name} చేరుకున్నారు.`), 'good'); UI.dirty = true; }
    if (!t || dist < 7) { if (!el.hidden) el.hidden = true; this.arrow.visible = false; return; }
    // 3D arrow just ahead of the player
    const ang = Math.atan2(t.x - P.x, t.z - P.z);
    const v = Player.vehicle; const ahead = v ? (v.type === 'harvester' ? 7 : 5) : 3;
    const ax = P.x + Math.sin(ang) * ahead, az = P.z + Math.cos(ang) * ahead;
    this.arrow.visible = dist > 12;
    this.arrow.position.set(ax, World.groundHeight(ax, az) + (v ? 0.7 : 0.45) + Math.sin(G.t * 4) * 0.08, az);
    // lie flat but lean toward the camera so it reads clearly from any side
    const cx = G.camera.position.x - ax, cz = G.camera.position.z - az, cl = Math.hypot(cx, cz) || 1;
    _v2.set(cx / cl * 0.8, 1, cz / cl * 0.8).normalize();
    _q1.setFromUnitVectors(UP, _v2); _q2.setFromAxisAngle(UP, ang);
    this.arrow.quaternion.copy(_q1).multiply(_q2);
    this.arrow.scale.setScalar(v ? 1.6 : 1.05);
    this.arrow.material.color.set(t.wp ? 0x43b6ff : 0xffc61a);
    // screen marker
    const cam = G.camera; const W = window.innerWidth, H = window.innerHeight;
    _v1.set(t.x, World.groundHeight(t.x, t.z) + 2.2, t.z).applyMatrix4(cam.matrixWorldInverse);
    const behind = _v1.z > -0.5;
    _v1.applyMatrix4(cam.projectionMatrix);
    let sx = (_v1.x * 0.5 + 0.5) * W, sy = (-_v1.y * 0.5 + 0.5) * H;
    if (behind) { sx = W - sx; sy = H - sy; }
    const mx = isMobile ? 72 : 70, top = isMobile ? 64 : 90, bot = isMobile ? 150 : 110;
    let edge = behind || sx < mx || sx > W - mx || sy < top || sy > H - bot;
    let rot = 0;
    if (edge) {
      const cx = W / 2, cy = (top + H - bot) / 2; let dx = sx - cx, dy = sy - cy;
      if (behind && Math.abs(dy) < 1) dy = 1;
      const kx = (W / 2 - mx) / Math.max(1e-3, Math.abs(dx)), ky = ((H - bot - top) / 2) / Math.max(1e-3, Math.abs(dy)); const kk = Math.min(kx, ky);
      sx = cx + dx * kk; sy = cy + dy * kk; rot = Math.atan2(dy, dx) * 180 / Math.PI + 90;
    }
    el.hidden = false;
    el.style.transform = `translate3d(${sx.toFixed(1)}px, ${sy.toFixed(1)}px, 0)`;
    const txt = (t.name ? t.name + ' · ' : '') + Map2.fmtDist(dist);
    const key = txt + (edge ? '|e' + Math.round(rot / 5) : '') + (t.wp ? 'w' : '');
    if (key !== this.last) {
      this.last = key;
      el.classList.toggle('edge', edge); el.classList.toggle('wp', !!t.wp);
      el.querySelector('.ar').style.transform = `rotate(${rot}deg)`;
      el.querySelector('.tx').textContent = txt;
    }
  },
};
