// ============================================================================
// UI: settings, HUD, minimap & map, menus, shops, dialogs, title, touch
// ============================================================================
const Settings = {
  v: { lang: 'en', preset: null, vol: 0.8, music: 0.55, amb: 0.8, sfx: 0.8, sens: 1, invertY: false, clickWork: false, fps: false, fps60: false, portraitOk: false, timeScale: 1 },
  load() { const s = Store.get('tvs_prefs', null); if (s) Object.assign(this.v, s); },
  save() { Store.set('tvs_prefs', this.v); },
};
const ICON = {
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
      else if (e.code === 'F1' || e.code === 'Slash') { e.preventDefault(); this.help(); }
    });
    this.beacon = new THREE.Mesh(new THREE.CylinderGeometry(1.2, 1.2, 160, 16, 1, true), new THREE.MeshBasicMaterial({ color: 0xf2b52d, transparent: true, opacity: 0.22, depthWrite: false, side: THREE.DoubleSide, blending: THREE.AdditiveBlending, fog: false }));
    this.beacon.visible = false; this.beacon.renderOrder = 7; G.scene.add(this.beacon);
  },
  applyLang() {
    LANG = Settings.v.lang;
    document.documentElement.lang = LANG === 'te' ? 'te' : 'en';
    for (const el of document.querySelectorAll('[data-en]')) el.textContent = LANG === 'te' && el.dataset.te ? el.dataset.te : el.dataset.en;
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
  savedFlash() { const s = this.el('savedot'); s.textContent = L('Saved', 'సేవ్ అయింది'); s.style.opacity = '1'; setTimeout(() => (s.style.opacity = '0'), 1400); },
  // ---------- tools ----------
  buildTools() {
    const box = this.el('tools'); if (!box) return; box.innerHTML = '';
    for (const t of TOOLS) {
      const b = h('button', { class: 'tool' + (Player.tool === t.id ? ' on' : ''), 'aria-label': LN(t), onclick: () => Player.setTool(t.id) }, h('em', null, t.key));
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
    } else if (tl !== 'hand') { o.innerHTML = ''; o.append(L('Hold ', 'పట్టుకోండి '), h('span', { class: 'kbd' }, isMobile ? L('Work', 'పని') : 'F'), L(' on your field', ' మీ పొలంలో')); o.hidden = false; }
    else o.hidden = true;
    const tbG = this.el('tbG'); if (tbG) tbG.hidden = false;
  },
  setPrompt(list) {
    const p = this.el('prompt');
    if (!list.length || this.photoMode) { p.hidden = true; return; }
    p.hidden = false; p.innerHTML = '';
    p.append(h('kbd', null, isMobile ? L('Tap', 'తాకండి') : 'E'), h('span', null, list[0].label()));
    if (list.length > 1) p.append(h('span', { class: 'more' }, L(`+${list.length - 1} more`, `+${list.length - 1} ఇంకా`)));
    const te = this.el('tbE'); if (te) te.textContent = list.length ? 'E' : 'E';
  },
  // ---------- HUD update ----------
  update(dt) {
    this.uiT -= dt; this.mapT -= dt;
    if (this.mapT <= 0) { this.mapT = isMobile ? 0.2 : 0.1; Map2.drawMini(); }
    // beacon
    const pm = Missions.primaryMarker(); const wp = G.S.waypoint;
    const tgt = wp || (pm && pm.p);
    const P = Player.pos();
    if (tgt && Math.hypot(tgt.x - P.x, tgt.z - P.z) > 14 && !this.photoMode) { this.beacon.visible = true; this.beacon.position.set(tgt.x, World.groundHeight(tgt.x, tgt.z) + 80, tgt.z); this.beacon.material.color.set(wp ? '#7fd3ff' : '#f2b52d'); this.beacon.material.opacity = 0.12 + 0.08 * Math.sin(G.t * 3); }
    else this.beacon.visible = false;
    if (this.uiT > 0 && !this.dirty) return;
    this.uiT = 0.2; this.dirty = false;
    const S = G.S; const Pl = S.player;
    this.el('money').textContent = fmtINR(S.money);
    this.el('pname').textContent = S.player.name;
    this.el('prank').textContent = LN(RANKS[S.rank]);
    const setBar = (id, v, col) => { const b = this.el('b' + id); b.style.width = clamp(v, 0, 100) + '%'; b.style.background = col || (v < 25 ? 'var(--bad)' : v < 50 ? 'var(--warn)' : 'var(--good)'); this.el('v' + id).textContent = isNaN(v) ? '-' : Math.round(v); };
    setBar('Health', Pl.health); setBar('Energy', Pl.energy, 'var(--accent)');
    const pf = Fields.playerFields(); const grow = pf.filter((f) => f.crop);
    const avgW = pf.length ? pf.reduce((s, f) => s + f.water, 0) / pf.length : NaN; setBar('Water', avgW, 'var(--indigo)');
    const avgH = grow.length ? grow.reduce((s, f) => s + f.health, 0) / grow.length : NaN; setBar('Crop', avgH);
    this.el('clock').textContent = Time.fmtClock();
    this.el('date').textContent = Time.fmtDate();
    const wid = G.S.weather.id; const W = WEATHER[wid];
    const fest = Time.festivalToday();
    this.el('wx').innerHTML = (ICON[W.icon] || '') + `<span>${LN(W)} · ${Math.round(Weather.temp)}°C${G.S.weather.drought ? ' · ' + L('Drought', 'కరువు') : ''}${fest ? ' · ' + LN(fest) : ''}${Weather.powerCut ? ' · ' + L('Power cut', 'కరెంటు లేదు') : ''}</span>`;
    // ticker
    const rows = this.el('tkrows'); if (rows.offsetParent !== null) rows.innerHTML = '';
    if (rows.offsetParent !== null) for (const c of [...CROP_IDS, 'mango']) {
      const tr = Market.trend(c);
      rows.appendChild(h('div', { class: 'tk' }, h('span', null, LN(PRODUCE[c])), h('span', { class: 'p' }, fmtINR(Market.price(c))), h('span', { class: tr > 0.005 ? 'u' : tr < -0.005 ? 'd' : '' }, tr > 0.005 ? '▲' : tr < -0.005 ? '▼' : '•')));
    }
    // missions
    const mb = this.el('missions'); mb.innerHTML = '';
    mb.appendChild(h('h4', null, L('Missions', 'లక్ష్యాలు')));
    const act = S.missions.active.slice(0, isMobile ? 2 : 4);
    if (!act.length) mb.appendChild(h('small', null, L('No active missions.', 'ప్రస్తుతం లక్ష్యాలు లేవు.')));
    for (const m of act) {
      const fr = clamp01(m.prog / m.target);
      const progTxt = m.target > 1.5 ? ` · ${m.target >= 1000 ? fmtShortINR(m.prog).replace('₹', m.tpl === 'earnSales' || m.tpl === 'income' ? '₹' : '') : fmt1(m.prog)}/${m.target >= 1000 ? fmtShortINR(m.target) : m.target}` : '';
      mb.appendChild(h('div', { class: 'ms' }, h('b', null, LN(m.title)), h('small', null, (m.reward ? L('Reward ', 'బహుమతి ') + fmtINR(m.reward) : '') + progTxt), h('div', { class: 'prog' }, h('b', { style: { width: (fr * 100).toFixed(0) + '%' } }))));
    }
    mb.onclick = () => this.office('missions');
    this.updateBL();
    this.el('fps').hidden = !Settings.v.fps;
  },
  updateBL() {
    const box = this.el('hud-bl'); const v = Player.vehicle;
    const tools = this.el('tools'); if (tools) tools.hidden = !!v || this.photoMode;
    if (v) this.el('toolopt').hidden = true; else if (this._wasInV) this.refreshTools();
    this._wasInV = !!v;
    if (this.photoMode) { box.hidden = true; return; }
    if (v) {
      box.hidden = false; box.innerHTML = '';
      const kmh = Math.round(Math.abs(v.speed) * 3.6);
      box.appendChild(h('h5', null, h('span', null, v.label()), v.rentUntil ? h('span', { class: 'chip warn' }, L('Rented ', 'అద్దె ') + Math.max(0, Math.round((v.rentUntil - Time.totalMin()) / 60 * 10) / 10) + L(' h', ' గం.')) : null));
      box.appendChild(h('div', { id: 'speedo' }, String(kmh), h('small', null, 'km/h')));
      const kv = h('div', { class: 'kv' });
      const add = (k, val) => kv.append(h('span', null, k), h('span', null, val));
      if (v.def.fuelCap > 0) add(L('Diesel', 'డీజిల్'), `${fmt1(v.fuel)} / ${v.def.fuelCap} L`);
      if (v.def.fuelCap > 0 || v.type === 'harvester') add(L('Condition', 'స్థితి'), Math.round(v.cond) + '%');
      if (v.impl) add(L('Implement', 'పనిముట్టు'), LN(IMPLEMENTS[v.impl]) + (IMPLEMENTS[v.impl].op ? (v.lowered ? L(' · lowered', ' · దించారు') : L(' · raised', ' · ఎత్తారు')) : ''));
      if (v.type === 'harvester') add(L('Header', 'హెడర్'), v.lowered ? L('Lowered — harvesting', 'దించారు — కోస్తోంది') : L('Raised', 'ఎత్తారు'));
      if (v.impl === 'seeddrill' && v.sowCrop) add(L('Sowing', 'విత్తుతోంది'), `${LN(CROPS[v.sowCrop])} (${fmt1(Inv.count('seed_' + v.sowCrop))})`);
      if (v.impl === 'sprayer') add(L('Tank', 'ట్యాంక్'), `${LN(ITEMS[v.chem])} (${fmt1(Inv.count(v.chem))} L)`);
      if (v.impl === 'spreader') add(L('Hopper', 'హాపర్'), `${LN(ITEMS[v.fert])} (${fmt1(Inv.count(v.fert))})`);
      if (v.impl === 'tanker') add(L('Water', 'నీరు'), Math.round(v.tank) + '%');
      if (v.cargoCap > 0) add(L('Cargo', 'సరుకు'), `${fmt1(v.cargoQty)} / ${v.cargoCap} q${v.cargo[0] ? ' ' + LN(PRODUCE[v.cargo[0].crop]) : ''}`);
      box.appendChild(kv);
      const hint = isMobile ? '' : v.impl && IMPLEMENTS[v.impl].op || v.type === 'harvester' ? L('G lower/raise · E get off', 'G దించు/ఎత్తు · E దిగు') : L('E get off · H horn · L lights', 'E దిగు · H హారన్ · L లైట్లు');
      if (hint) box.appendChild(h('small', { style: { color: 'var(--ink-2)' } }, hint));
      return;
    }
    const P = Player.pos();
    const f = fieldAt(P.x, P.z) || Fields.nearest(P.x, P.z, (q) => q.isPlayer && Math.hypot(q.x - P.x, q.z - P.z) < Math.hypot(q.w, q.d) / 2 + 6);
    if (f && (f.isPlayer || fieldAt(P.x, P.z))) {
      box.hidden = false; box.innerHTML = '';
      const own = f.owner === 'player' ? L('Owned', 'సొంతం') : f.owner === 'lease' ? L('Leased', 'కౌలు') : f.avail ? (f.avail === 'lease' ? L('For lease', 'కౌలుకు') : L('For sale', 'అమ్మకానికి')) : L('Neighbour\'s field', 'పొరుగువారి పొలం');
      box.appendChild(h('h5', null, h('span', null, f.label()), h('span', { class: 'chip' + (f.isPlayer ? ' good' : '') }, own)));
      box.appendChild(h('small', { style: { color: 'var(--ink-2)' } }, `${fmt1(f.acres)} ${L('acres', 'ఎకరాలు')} · ${LN(SOILS[f.soil])}${f.borewell ? ' · ' + L('Borewell', 'బోరు') : ''}${f.canal ? ' · ' + L('Canal', 'కాలువ') : ''}`));
      if (f.isPlayer) {
        const st = f.stageName();
        if (f.crop) box.appendChild(h('div', { style: { fontWeight: 700 } }, `${LN(CROPS[f.crop])} · ${LN(st)} · ${Math.round(f.growth * 100)}%`));
        else { const pl = f.countMin(1) / f.n, pr = f.countMin(2) / f.n; box.appendChild(h('div', { style: { fontWeight: 600 } }, `${L('Ploughed', 'దున్నింది')} ${Math.round(pl * 100)}% · ${L('Seedbed', 'సిద్ధం')} ${Math.round(pr * 100)}%`)); }
        const mini = h('div', { class: 'mini' });
        const cd = f.crop ? CROPS[f.crop] : null;
        const item = (k, v, bad, col) => mini.append(h('div', null, k, h('b', null, Math.round(v) + '%'), h('div', { class: 'mb' }, h('i', { style: { width: clamp(v, 0, 100) + '%', background: bad ? 'var(--bad)' : col || 'var(--good)' } }))));
        item(L('Water', 'నీరు'), f.water, cd && f.water < cd.wLo, 'var(--indigo)');
        item(L('Nutr.', 'పోషకం'), f.nut, f.nut < 25);
        item(L('Weeds', 'కలుపు'), f.weeds, f.weeds > 30);
        item(L('Pests', 'పురుగు'), f.pests, f.pests > 15);
        item(L('Health', 'ఆరోగ్యం'), f.crop ? f.health : 100, f.health < 50);
        box.appendChild(mini);
        if (f.heap) box.appendChild(h('small', null, L('Heap: ', 'కుప్ప: ') + `${fmt1(f.heap.qty)} q ${LN(PRODUCE[f.heap.crop])} (${L('grade', 'గ్రేడ్')} ${Market.qualityLabel(f.heap.q)})`));
      }
      return;
    }
    box.hidden = true;
  },
  // ---------- modal sheets ----------
  modalOpen() { return !this.el('modal').hidden; },
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
    const sh = h('div', { class: 'sheet' + (o.narrow ? ' narrow' : ''), role: 'dialog', 'aria-label': o.title }, head, o.tabs && o.tabs.length > 1 ? tabs : h('div', { class: 'ikat', style: { margin: '0 18px 10px' } }), body);
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
    const night = hr >= 19 || hr < 5;
    const list = [
      { id: 'sleep', label: () => night ? L('Sleep until morning', 'తెల్లవారే వరకు నిద్రపోండి') : L('Rest for 2 hours', '2 గంటలు విశ్రాంతి'), act: () => Sim.sleep(night) },
      { id: 'office', label: () => L('Open the farm office', 'వ్యవసాయ కార్యాలయం తెరవండి'), act: () => this.office() },
      { id: 'store', label: () => L('Storage & supplies', 'నిల్వ & సామాగ్రి'), act: () => this.office('storage') },
      { id: 'save', label: () => L('Save game', 'ఆట సేవ్ చేయండి'), act: () => SaveSys.save(true) },
    ];
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
      b.appendChild(h('div', { class: 'row' }, this.btn(L(`Sell all to trader (${fmtINR(Math.round(p * hp.q * 0.88 * hp.qty))})`, `వ్యాపారికి అమ్మండి (${fmtINR(Math.round(p * hp.q * 0.88 * hp.qty))})`), () => { Services.sellHeapToTrader(f); this.close(); }, 'acc')));
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
      b.appendChild(h('p', { class: 'empty' }, L('Selling from storage goes to the village trader (88%). Load it into a vehicle for the full yard price.', 'నిల్వ నుంచి అమ్మితే గ్రామ వ్యాపారికి (88%). పూర్తి ధరకు వాహనంలో యార్డుకు తీసుకెళ్ళండి.')));
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
        Missions.markerPos(m.mark) ? h('div', { class: 'row' }, this.btn(L('Show on map', 'మ్యాప్‌లో చూపు'), () => { S.waypoint = Missions.markerPos(m.mark); this.close(); }, 'sm alt')) : null));
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
    this.sheet({ title: L('Map of the mandal', 'మండలం మ్యాప్'), kind: 'map', render: (b) => {
      const cv = h('canvas', { id: 'fullmap', width: 1000, height: 1000 });
      const wrap = h('div', { style: { position: 'relative', width: 'min(100%, 70vh)', aspectRatio: '1', margin: '0 auto', maxWidth: '100%' } }, cv);
      b.appendChild(wrap);
      const lg = h('div', { class: 'legend', style: { marginTop: '10px' } });
      for (const [c, t] of [['#f2b52d', L('You', 'మీరు')], ['#e8a81a', L('Your fields', 'మీ పొలాలు')], ['#c4573a', L('For sale / lease', 'అమ్మకం / కౌలు')], ['#2f6fb0', L('Water', 'నీరు')], ['#f7f2e8', L('Mission', 'లక్ష్యం')], ['#7fd3ff', L('Waypoint', 'గమ్యం')]]) lg.appendChild(h('span', null, h('i', { style: { background: c } }), t));
      b.appendChild(lg);
      b.appendChild(h('div', { class: 'row', style: { marginTop: '8px' } }, this.btn(L('Clear waypoint', 'గమ్యం తీసేయండి'), () => { G.S.waypoint = null; Map2.drawFull(cv); }, 'sm alt'), h('span', { style: { color: 'var(--ink-2)', fontSize: '12px' } }, L('Tap the map to set a waypoint.', 'గమ్యం పెట్టడానికి మ్యాప్‌ను నొక్కండి.'))));
      cv.onclick = (e) => { const r = cv.getBoundingClientRect(); const px = (e.clientX - r.left) / r.width, pz = (e.clientY - r.top) / r.height; const w = Map2.fullToWorld(px, pz); G.S.waypoint = w; Map2.drawFull(cv); Audio2.sfx('click'); };
      Map2.drawFull(cv);
    } });
  },
  // ---------- settings ----------
  settings() {
    const v = Settings.v;
    this.sheet({ title: L('Menu', 'మెనూ'), kind: 'settings', narrow: true, render: (b) => {
      const setRow = (label, ctrl) => b.querySelector('.set').append(h('label', null, label), ctrl);
      b.appendChild(h('div', { class: 'set' }));
      const seg = (opts, cur, fn) => { const s = h('div', { class: 'seg' }); for (const [id, lab] of opts) s.appendChild(h('button', { class: id === cur ? 'on' : '', onclick: () => { fn(id); this.rerender(); } }, lab)); return s; };
      setRow(L('Graphics', 'గ్రాఫిక్స్'), seg(PRESET_ORDER.map((p) => [p, { LOW: L('Low', 'తక్కువ'), MEDIUM: L('Medium', 'మధ్యస్థం'), HIGH: L('High', 'ఎక్కువ'), ULTRA: L('Ultra', 'అల్ట్రా'), CINEMATIC: L('Cinematic', 'సినిమాటిక్') }[p]]), v.preset, (p) => { v.preset = p; Settings.save(); Game.setPreset(p); }));
      setRow(L('Language', 'భాష'), seg([['en', 'English'], ['te', 'తెలుగు']], v.lang, (l) => { v.lang = l; Settings.save(); this.applyLang(); }));
      setRow(L('Game speed', 'ఆట వేగం'), seg([[1, '1×'], [2, '2×'], [4, '4×'], [8, '8×']], v.timeScale, (t) => { v.timeScale = t; Time.scale = t; Settings.save(); }));
      const slider = (key) => h('input', { type: 'range', id: 'vol_' + key, min: 0, max: 1, step: 0.05, value: v[key], oninput: (e) => { v[key] = +e.target.value; Audio2.applyVolumes(); Settings.save(); } });
      setRow(L('Master volume', 'మొత్తం శబ్దం'), slider('vol')); setRow(L('Music', 'సంగీతం'), slider('music')); setRow(L('Ambience', 'పరిసర శబ్దాలు'), slider('amb')); setRow(L('Effects', 'ఎఫెక్ట్స్'), slider('sfx'));
      setRow(L('Camera speed', 'కెమెరా వేగం'), h('input', { type: 'range', id: 'sens', min: 0.3, max: 2.5, step: 0.1, value: v.sens, oninput: (e) => { v.sens = +e.target.value; Settings.save(); } }));
      const chk = (key, label) => h('label', { class: 'row' }, h('input', { type: 'checkbox', id: 'chk_' + key, checked: v[key] ? true : null, onchange: (e) => { v[key] = e.target.checked; Settings.save(); } }), label);
      setRow(L('Options', 'ఎంపికలు'), h('div', { class: 'row' }, chk('invertY', L('Invert camera Y', 'కెమెరా Y తిప్పు')), isMobile ? chk('fps60', L('Smooth 60 FPS (uses more battery)', 'స్మూత్ 60 FPS (బ్యాటరీ ఎక్కువ)')) : chk('clickWork', L('Hold left mouse to work', 'ఎడమ మౌస్‌తో పని')), chk('fps', L('Show FPS', 'FPS చూపు'))));
      if (document.fullscreenEnabled) setRow(L('Screen', 'స్క్రీన్'), h('div', { class: 'row' }, this.btn(document.fullscreenElement ? L('Exit full screen', 'ఫుల్ స్క్రీన్ ఆపు') : L('Full screen', 'ఫుల్ స్క్రీన్'), () => Game.toggleFullscreen(), 'alt sm')));
      b.appendChild(h('div', { class: 'row', style: { marginTop: '16px' } },
        this.btn(L('Save game', 'ఆట సేవ్'), () => SaveSys.save(true), 'acc'),
        this.btn(L('Controls', 'నియంత్రణలు'), () => this.help(), 'alt'),
        this.btn(L('Main menu', 'ముఖ్య మెనూ'), () => { SaveSys.save(false); location.reload(); }, 'alt')));
      b.appendChild(h('p', { class: 'empty' }, SaveSys.status()));
      if (SaveSys.cloudState === 'askable') b.appendChild(this.btn(L('Turn on cloud save', 'క్లౌడ్ సేవ్ ఆన్ చేయండి'), () => SaveSys.enableCloud(), 'alt sm'));
    } });
  },
  help() {
    this.sheet({ title: L('Controls', 'నియంత్రణలు'), narrow: true, render: (b) => {
      const rows = isMobile ? [
        [L('Left stick', 'ఎడమ స్టిక్'), L('Walk / drive', 'నడవండి / నడపండి')], [L('Drag right side', 'కుడివైపు లాగండి'), L('Look around, pinch to zoom', 'చుట్టూ చూడండి, జూమ్ కోసం పించ్')], ['E', L('Interact, talk, drive, get off', 'మాట్లాడు, నడుపు, దిగు')], [L('Work', 'పని'), L('Hold to use the selected tool on your field', 'పొలంలో పనిముట్టు వాడటానికి పట్టుకోండి')], ['G', L('Lower or raise implement', 'పనిముట్టు దించు/ఎత్తు')], ['V', L('Switch camera view', 'కెమెరా మార్చు')], [L('Tool bar', 'పనిముట్ల బార్'), L('Tap a tool; tap again to switch seed/fertilizer type', 'పనిముట్టు నొక్కండి; మళ్లీ నొక్కితే రకం మారుతుంది')],
      ] : [
        ['W A S D', L('Walk / drive', 'నడవండి / నడపండి')], ['Shift', L('Run', 'పరుగు')], ['Space', L('Jump / brake', 'దూకు / బ్రేక్')], [L('Mouse drag, wheel', 'మౌస్ లాగడం, వీల్'), L('Look around, zoom', 'చూడండి, జూమ్')], ['E', L('Interact, talk, drive, get off', 'మాట్లాడు, నడుపు, దిగు')], ['F', L('Hold to work with the selected tool', 'పనిముట్టుతో పని చేయడానికి పట్టుకోండి')],
        ['1 – 6', L('Hand, hoe, seeds, fertilizer, sprayer, sickle', 'చేయి, పార, విత్తనాలు, ఎరువు, స్ప్రేయర్, కొడవలి')], ['Q', L('Switch seed / fertilizer / chemical', 'విత్తనం / ఎరువు / మందు మార్చు')], ['G', L('Lower or raise implement', 'పనిముట్టు దించు/ఎత్తు')], ['H / L', L('Horn / headlights', 'హారన్ / లైట్లు')], ['V', L('First / third person', 'ఫస్ట్ / థర్డ్ పర్సన్')], ['M', L('Map', 'మ్యాప్')], ['B / I', L('Farm office / storage', 'వ్యవసాయ కార్యాలయం / నిల్వ')], ['P', L('Photo mode', 'ఫోటో మోడ్')], ['Esc', L('Menu & settings', 'మెనూ & సెట్టింగ్‌లు')],
      ];
      const t = h('table', { class: 't' }); for (const [k, v2] of rows) t.appendChild(h('tr', null, h('td', null, h('span', { class: 'kbd' }, k)), h('td', null, v2)));
      b.appendChild(t);
      b.appendChild(h('p', { class: 'empty' }, L('Tip: sleep at home to skip the night. Crops grow while you sleep.', 'చిట్కా: రాత్రి గడపడానికి ఇంట్లో నిద్రపోండి. మీరు నిద్రపోతున్నప్పుడు పంటలు పెరుగుతాయి.')));
    } });
  },
  photo() {
    this.photoMode = !this.photoMode;
    for (const id of ['hud-tl', 'hud-tc', 'hud-tr', 'missions', 'hud-bl', 'hud-bc', 'hud-br', 'news', 'savedot']) { const e = this.el(id); if (e) e.style.visibility = this.photoMode ? 'hidden' : ''; }
    this.el('touch').style.visibility = this.photoMode ? 'hidden' : '';
    this.el('letterbox').hidden = !(this.photoMode || (G.preset && G.preset.letterbox));
    if (this.photoMode) this.toast(L('Photo mode — press P to return', 'ఫోటో మోడ్ — తిరిగి రావడానికి P నొక్కండి'), 'info');
    if (isMobile && this.photoMode) setTimeout(() => { if (this.photoMode) { const once = () => { this.photo(); window.removeEventListener('pointerdown', once); }; window.addEventListener('pointerdown', once); } }, 400);
  },
  fade(fn, text = '') {
    const f = this.el('fade'); f.textContent = text; f.classList.add('on');
    setTimeout(() => { try { fn(); } finally { setTimeout(() => f.classList.remove('on'), 250); } }, 480);
  },
  banner(small, big, sub, ms = 4200) {
    const el = h('div', { class: 'big-banner' }, h('div', { class: 'card bb' }, h('small', null, small), h('strong', null, big), sub ? h('span', null, sub) : null));
    this.el('hud').appendChild(el); setTimeout(() => el.remove(), ms);
  },
  rankUp(R) { this.banner(L('New rank', 'కొత్త హోదా'), LN(R), LANG === 'te' ? R.en : R.te, 5000); },
  missionDone(m) { this.toast(L('Mission complete: ', 'లక్ష్యం పూర్తి: ') + LN(m.title) + (m.reward ? ' · +' + fmtINR(m.reward) : ''), 'mission'); },
  // ---------- touch controls ----------
  initTouch() {
    const joy = this.el('joy'), knob = this.el('knob');
    let id = null, cx = 0, cy = 0;
    const R = 50;
    joy.addEventListener('pointerdown', (e) => { id = e.pointerId; joy.setPointerCapture(id); const r = joy.getBoundingClientRect(); cx = r.left + r.width / 2; cy = r.top + r.height / 2; move(e); Input.joy.active = true; Audio2.unlock(); });
    const move = (e) => { if (e.pointerId !== id) return; let dx = e.clientX - cx, dy = e.clientY - cy; const d = Math.hypot(dx, dy); if (d > R) { dx = dx / d * R; dy = dy / d * R; } knob.style.transform = `translate(${dx}px, ${dy}px)`; Input.joy.x = dx / R; Input.joy.y = -dy / R; Input.run = d > R * 0.98 && !Player.vehicle && Input.runToggle; };
    joy.addEventListener('pointermove', move);
    const end = (e) => { if (e.pointerId !== id) return; id = null; knob.style.transform = ''; Input.joy.x = 0; Input.joy.y = 0; Input.joy.active = false; };
    joy.addEventListener('pointerup', end); joy.addEventListener('pointercancel', end);
    const hold = (el, on, off) => { el.addEventListener('pointerdown', (e) => { e.preventDefault(); el.setPointerCapture(e.pointerId); on(); Audio2.unlock(); }); el.addEventListener('pointerup', off); el.addEventListener('pointercancel', off); };
    hold(this.el('tbWork'), () => { Input.work = true; }, () => { Input.work = false; });
    hold(this.el('tbE'), () => { Input.interactTap = true; }, () => { });
    hold(this.el('tbG'), () => { const v = Player.vehicle; if (v) { if (v.type === 'harvester' || (v.impl && IMPLEMENTS[v.impl].op)) Input.implToggle = true; else Input.horn = true; } else Player.cycleOpt(); }, () => { });
    hold(this.el('tbV'), () => Cam.toggle(), () => { });
    hold(this.el('tbJump'), () => { if (Player.vehicle) Input.brake = true; else Input.pressedQ.add('Space'); }, () => { Input.brake = false; });
    hold(this.el('tbRun'), () => { Input.runToggle = !Input.runToggle; Input.run = Input.runToggle; this.el('tbRun').classList.toggle('on', Input.runToggle); }, () => { });
  },
  updateTouchLabels() {
    if (!isMobile) return;
    const v = Player.vehicle; const inV = !!v;
    const set = (id, txt, vis = true) => { const el = this.el(id); if (!el) return; if (el.dataset.l !== txt) { el.dataset.l = txt; el.textContent = txt; } el.style.visibility = vis ? '' : 'hidden'; };
    const implOp = !!(v && (v.type === 'harvester' || (v.impl && IMPLEMENTS[v.impl].op)));
    const toolOpt = !inV && (Player.tool === 'seeds' || Player.tool === 'fert' || Player.tool === 'sprayer');
    set('tbG', inV ? (implOp ? (v.lowered ? L('Raise', 'ఎత్తు') : L('Lower', 'దించు')) : L('Horn', 'హారన్')) : L('Type', 'రకం'), inV || toolOpt);
    set('tbV', L('View', 'వ్యూ'));
    set('tbJump', inV ? L('Brake', 'బ్రేక్') : L('Jump', 'దూకు'));
    set('tbRun', L('Run', 'పరుగు'), !inV);
    set('tbWork', L('Work', 'పని'), !inV && Player.tool !== 'hand');
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
      for (const [id, lab] of [['en', 'English'], ['te', 'తెలుగు']]) lang.appendChild(h('button', { class: v.lang === id ? 'on' : '', onclick: () => { v.lang = id; Settings.save(); this.applyLang(); segs(); acts(); } }, lab));
      const q = this.el('tqual'); q.innerHTML = '';
      for (const p of PRESET_ORDER) q.appendChild(h('button', { class: v.preset === p ? 'on' : '', onclick: () => { v.preset = p; Settings.save(); Game.setPreset(p); segs(); } }, { LOW: L('Low', 'తక్కువ'), MEDIUM: L('Medium', 'మధ్య'), HIGH: L('High', 'ఎక్కువ'), ULTRA: L('Ultra', 'అల్ట్రా'), CINEMATIC: L('Cinematic', 'సినిమా') }[p]));
    };
    const acts = () => {
      const a = this.el('tactions'); a.innerHTML = '';
      if (hasSave) a.appendChild(h('button', { class: 'tbtn pri', onclick: () => { Audio2.unlock(); onContinue(); } }, h('span', { class: 'tcont' }, L('Continue', 'కొనసాగించండి'), info ? h('small', null, typeof info === 'function' ? info() : info) : null), h('span', null, '→')));
      a.appendChild(h('button', { class: 'tbtn ' + (hasSave ? 'sec2' : 'pri'), onclick: () => { Audio2.unlock(); newForm(); } }, L('New game', 'కొత్త ఆట'), h('span', null, '+')));
      a.appendChild(h('button', { class: 'tbtn sec2', onclick: () => this.help() }, L('Controls', 'నియంత్రణలు'), h('span', null, '?')));
    };
    let gender = 'm';
    const newForm = () => {
      const f = this.el('newgame'); f.hidden = false; f.innerHTML = '';
      const name = h('input', { id: 'pnameInput', maxlength: 18, value: gender === 'm' ? L('Raju', 'రాజు') : L('Radha', 'రాధ'), 'aria-label': L('Your name', 'మీ పేరు') });
      const av = h('div', { class: 'av' });
      const draw = () => { av.innerHTML = ''; for (const [g, lab] of [['m', L('Farmer (man)', 'రైతు (పురుషుడు)')], ['f', L('Farmer (woman)', 'రైతు (స్త్రీ)')]]) av.appendChild(h('button', { class: gender === g ? 'on' : '', onclick: () => { gender = g; name.value = g === 'm' ? L('Raju', 'రాజు') : L('Radha', 'రాధ'); draw(); } }, lab)); };
      draw();
      f.append(h('label', { for: 'pnameInput', style: { fontWeight: 600 } }, L('Your name', 'మీ పేరు')), name, av, h('button', { class: 'tbtn pri', onclick: () => { Audio2.unlock(); onNew({ name: (name.value || 'Raju').trim().slice(0, 18), gender }); } }, L('Start farming', 'వ్యవసాయం మొదలుపెట్టండి'), h('span', null, '→')));
      name.focus();
    };
    segs(); acts();
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
      const initial = LN(n.name).slice(0, LANG === 'te' ? 2 : 1);
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
const Map2 = {
  S: 800, scale: 2, baseCanvas: null,
  build() {
    const N = this.S; const c = document.createElement('canvas'); c.width = N; c.height = N; const ctx = c.getContext('2d');
    const img = ctx.createImageData(N, N); const d = img.data;
    const H = World.heights, TN = World.N, step = World.step, half = WORLD_HALF;
    for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) {
      const x = -800 + i * 2 + 1, z = -800 + j * 2 + 1;
      const o = World.occGet(x, z);
      const ti = clamp(Math.round((x + half) / step), 1, TN - 2), tj = clamp(Math.round((z + half) / step), 1, TN - 2);
      const hh = H[tj * TN + ti]; const shade = clamp(1 + (H[tj * TN + ti - 1] - H[tj * TN + ti + 1]) * 0.12 + (H[(tj - 1) * TN + ti] - H[(tj + 1) * TN + ti]) * 0.12, 0.6, 1.35);
      let r = 96, g = 116, b = 66;
      if (hh > 8) { r = 118; g = 120; b = 98; }
      if (o === OCC.WATER || lakeSD(x, z) < -3) { r = 47; g = 111; b = 160; }
      else if (o === OCC.ROAD) { r = 205; g = 190; b = 160; }
      else if (o === OCC.BUILD) { r = 150; g = 92; b = 70; }
      else if (o === OCC.VILLAGE) { r = 170; g = 150; b = 112; }
      else if (o === OCC.CANAL) { r = 70; g = 140; b = 190; }
      else if (o === OCC.ROCK) { r = 140; g = 136; b = 128; }
      const k = (j * N + i) * 4;
      d[k] = clamp(r * shade, 0, 255); d[k + 1] = clamp(g * shade, 0, 255); d[k + 2] = clamp(b * shade, 0, 255); d[k + 3] = 255;
    }
    ctx.putImageData(img, 0, 0);
    this.baseCanvas = c;
    this.fieldLayer = document.createElement('canvas'); this.fieldLayer.width = N; this.fieldLayer.height = N;
    this.redrawFields();
  },
  wx(x) { return (x + 800) / 2; }, wz(z) { return (z + 800) / 2; },
  redrawFields() {
    const ctx = this.fieldLayer.getContext('2d'); ctx.clearRect(0, 0, this.S, this.S);
    for (const f of Fields.list) {
      const x = this.wx(f.x0), y = this.wz(f.z0), w = f.w / 2, hgt = f.d / 2;
      let col = f.soil === 'red' ? '#8e5236' : '#4a3f35';
      if (f.crop) col = f.growth > 0.85 ? CROPS[f.crop].ripe : CROPS[f.crop].leaf;
      ctx.fillStyle = col; ctx.fillRect(x, y, w, hgt);
      if (f.isPlayer) { ctx.strokeStyle = '#f2b52d'; ctx.lineWidth = 2; ctx.strokeRect(x + 1, y + 1, w - 2, hgt - 2); }
      else if (f.avail) { ctx.strokeStyle = '#e06a4a'; ctx.lineWidth = 1.5; ctx.setLineDash([3, 2]); ctx.strokeRect(x + 1, y + 1, w - 2, hgt - 2); ctx.setLineDash([]); }
    }
    this.fieldsAt = performance.now();
  },
  drawMini() {
    const cv = document.getElementById('minimap'); if (!cv || !this.baseCanvas) return;
    if (performance.now() - (this.fieldsAt || 0) > 4000) this.redrawFields();
    const ctx = cv.getContext('2d'); const W = cv.width; const P = Player.pos();
    const zoom = Player.vehicle ? 1.35 : 1.9;
    const yaw = Cam.yaw;
    ctx.save(); ctx.clearRect(0, 0, W, W);
    ctx.translate(W / 2, W / 2); ctx.rotate(yaw); ctx.scale(zoom, zoom); ctx.translate(-this.wx(P.x), -this.wz(P.z));
    ctx.drawImage(this.baseCanvas, 0, 0); ctx.drawImage(this.fieldLayer, 0, 0);
    ctx.restore();
    const toScr = (x, z) => { const dx = (this.wx(x) - this.wx(P.x)) * zoom, dy = (this.wz(z) - this.wz(P.z)) * zoom; const c = Math.cos(yaw), s = Math.sin(yaw); return [W / 2 + dx * c - dy * s, W / 2 + dx * s + dy * c]; };
    const R = W / 2 - 4;
    const dot = (x, z, col, r = 5, clampEdge = false) => { let [sx, sy] = toScr(x, z); const dx = sx - W / 2, dy = sy - W / 2, d = Math.hypot(dx, dy); if (d > R) { if (!clampEdge) return; sx = W / 2 + dx / d * R; sy = W / 2 + dy / d * R; } ctx.fillStyle = col; ctx.beginPath(); ctx.arc(sx, sy, r, 0, TAU); ctx.fill(); ctx.strokeStyle = '#1b1b1f'; ctx.lineWidth = 1.5; ctx.stroke(); };
    for (const v of Vehicles.player) if (v !== Player.vehicle) dot(v.x, v.z, '#ffffff', 5);
    const pm = Missions.primaryMarker(); if (pm) dot(pm.p.x, pm.p.z, '#f7f2e8', 7, true);
    if (G.S.waypoint) dot(G.S.waypoint.x, G.S.waypoint.z, '#7fd3ff', 7, true);
    // player arrow (heading relative to map rotation)
    const hd = Player.vehicle ? Player.vehicle.yaw : Player.yaw;
    const a = Math.atan2(Math.sin(hd), -Math.cos(hd)) * -1 + yaw;
    ctx.save(); ctx.translate(W / 2, W / 2); ctx.rotate(-(Math.atan2(Math.sin(hd), Math.cos(hd))) + yaw + Math.PI);
    ctx.fillStyle = '#f2b52d'; ctx.strokeStyle = '#1b1b1f'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(0, -13); ctx.lineTo(9, 10); ctx.lineTo(0, 5); ctx.lineTo(-9, 10); ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.restore();
    void a;
    const n = document.getElementById('compassN'); if (n) { const r = 72; const nx = Math.sin(yaw) * -1, ny = -Math.cos(yaw); n.style.left = `calc(50% + ${(-Math.sin(-yaw)) * r * 0.62 * (cv.clientWidth / 176)}px)`; n.style.top = `calc(50% + ${(-Math.cos(-yaw)) * r * 0.62 * (cv.clientWidth / 176)}px)`; n.style.transform = 'translate(-50%, -50%)'; void nx; void ny; }
  },
  fullToWorld(px, pz) { return { x: -800 + px * 1600, z: -800 + pz * 1600 }; },
  drawFull(cv) {
    const ctx = cv.getContext('2d'); const W = cv.width; const k = W / this.S;
    ctx.clearRect(0, 0, W, W); ctx.imageSmoothingEnabled = true;
    ctx.drawImage(this.baseCanvas, 0, 0, W, W); ctx.drawImage(this.fieldLayer, 0, 0, W, W);
    const X = (x) => this.wx(x) * k, Z = (z) => this.wz(z) * k;
    const label = (x, z, txt, size = 18, col = '#1b1b1f') => { ctx.font = `700 ${size}px "Baloo Tammudu 2", sans-serif`; ctx.textAlign = 'center'; ctx.lineWidth = 4; ctx.strokeStyle = 'rgba(255,250,240,.85)'; ctx.strokeText(txt, X(x), Z(z)); ctx.fillStyle = col; ctx.fillText(txt, X(x), Z(z)); };
    label(0, -12, L('Ramapuram', 'రామాపురం'), 26); label(SEETHA.x, SEETHA.z - 40, L('Seethampet', 'సీతంపేట'), 22); label(TOWN.x - 20, TOWN.z - 50, L('Nagaram town', 'నగరం పట్టణం'), 22);
    label(YARD.x, YARD.z + 50, L('Market yard', 'మార్కెట్ యార్డ్'), 16); label(LAKE.x, LAKE.z, L('Pedda Cheruvu (lake)', 'పెద్ద చెరువు'), 18, '#0e3352');
    label(HOME.x, HOME.z - 22, L('Your farm', 'మీ పొలం'), 18, '#7a4a00'); label(640, -700, L('Highway to Hyderabad', 'హైదరాబాద్ హైవే'), 15);
    label(POI.temple.inner.x, POI.temple.inner.z - 16, L('Temple', 'గుడి'), 13); label(POI.seedShop.counter[0] + 8, POI.seedShop.counter[1] + 18, L('Seeds', 'విత్తనాలు'), 13); label(POI.workshop.counter.x + 10, POI.workshop.counter.z + 18, L('Workshop', 'వర్క్‌షాప్'), 13);
    label(POI.shrine.x, POI.shrine.z + 30, L('Hill shrine', 'గుట్ట గుడి'), 13); label(POI.petrol.pump.x + 10, POI.petrol.pump.z + 24, L('Petrol', 'పెట్రోల్'), 13);
    const P = Player.pos();
    const dot = (x, z, col, r) => { ctx.fillStyle = col; ctx.beginPath(); ctx.arc(X(x), Z(z), r, 0, TAU); ctx.fill(); ctx.strokeStyle = '#1b1b1f'; ctx.lineWidth = 2; ctx.stroke(); };
    for (const m of G.S.missions.active) { const p = Missions.markerPos(m.mark); if (p) dot(p.x, p.z, '#f7f2e8', 8); }
    if (G.S.waypoint) dot(G.S.waypoint.x, G.S.waypoint.z, '#7fd3ff', 9);
    for (const v of Vehicles.player) dot(v.x, v.z, '#ffffff', 5);
    dot(P.x, P.z, '#f2b52d', 11);
  },
};
