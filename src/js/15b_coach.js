// ============================================================================
// Coach: turns the mission you are following into one simple step at a time
// ("Go to your field", "Hold Work", "Tap Buy seeds"...), points the gold arrow
// at it, and can read it aloud. When a mission is done the next one follows.
// ============================================================================
const CH = {
  pos() { return Player.pos(); },
  dist(t) { const P = Player.pos(); return Math.hypot(t.x - P.x, t.z - P.z); },
  near(t, r) { return !!t && this.dist(t) < r; },
  onField(f) { const P = Player.pos(); return !!f && P.x > f.x0 - 1 && P.x < f.x1 + 1 && P.z > f.z0 - 1 && P.z < f.z1 + 1; },
  ip(id) { const o = Interact.list.find((q) => q.id === id); return o ? { x: o.x, z: o.z, r: o.r || 3 } : null; },
  // sentences, written whole in both languages so the Telugu reads naturally
  go(t, name) {
    const far = this.dist(t) > 260 && !Player.vehicle;
    return { text: L(`Go to ${name}`, `${name} దగ్గరికి వెళ్ళండి`) + (far ? L(' — or tap Map and take an auto', ' — లేదా మ్యాప్ నొక్కి ఆటోలో వెళ్ళండి') : ''), target: { x: t.x, z: t.z, name }, icon: Player.vehicle ? 'drive' : 'walk' };
  },
  tap(label) { return isMobile ? L(`Tap “${label}”`, `“${label}” నొక్కండి`) : L(`Press E for “${label}”`, `“${label}” కోసం E నొక్కండి`); },
  // `what`/`where` arrive already in the player's language: CH.hold(L('and walk…', 'నడిచి…'))
  hold(what) { return isMobile ? L(`Hold Work ${what}`, `'పని' పట్టుకుని ${what}`) : L(`Hold F ${what}`, `F పట్టుకుని ${what}`); },
  office(where) { return isMobile ? L(`Open the Farm office (top button) → ${where}`, `వ్యవసాయ కార్యాలయం (పై బటన్) తెరవండి → ${where}`) : L(`Press B (Farm office) → ${where}`, `B నొక్కండి (వ్యవసాయ కార్యాలయం) → ${where}`); },
  yourField(f) { return f.id === 'F1' ? L('your field', 'మీ పొలం') : f.label(); },
  goField(f) { return this.go({ x: f.x, z: f.z }, this.yourField(f)); },
  goPlace(id, name) { const p = this.ip(id); return p ? this.go(p, name) : null; },
  // at a shop or service: walk there, then use it
  visit(id, name, what) {
    const p = this.ip(id); if (!p) return null;
    if (!this.near(p, p.r + 1.5)) return this.go(p, name);
    return { text: (isMobile ? L('Tap the prompt, then ', 'పక్కన వచ్చే బటన్ నొక్కి, ') : L('Press E, then ', 'E నొక్కి, ')) + what, target: null, icon: 'tap' };
  },
  money(n) { return G.S.money + 1e-6 >= n; },
  needMoney(n) { return { text: L(`Save ${fmtINR(Math.ceil(n - G.S.money))} more: sell crops, or take a crop loan at the bank`, `ఇంకా ${fmtINR(Math.ceil(n - G.S.money))} కావాలి: పంట అమ్మండి, లేదా బ్యాంకులో పంట రుణం తీసుకోండి`), icon: 'coin' }; },
  heapField(crop) { return Fields.playerFields().find((f) => f.heap && f.heap.qty > 0.05 && (!crop || f.heap.crop === crop)); },
  stored(crop) { return crop ? Storage.total(crop) : G.S.storage.reduce((s, e) => s + e.qty, 0); },
  growing(crop) { return Fields.playerFields().filter((f) => f.crop && f.sownTiles > 0 && (!crop || f.crop === crop)).sort((a, b) => b.growth - a.growth)[0]; },
  // a field to sow: finish a half-sown one first, else any empty field you farm
  freeField(crop) {
    const pf = Fields.playerFields();
    return pf.find((f) => f.crop && f.sownTiles > 0 && f.sownTiles < f.n * 0.95 && (!crop || f.crop === crop)) || pf.find((f) => !f.crop || !f.sownTiles) || null;
  },
};
const F1 = () => Fields.byId.F1;

// ---- shared flows ----
// grow a crop on a free field: walk there, buy seeds when asked, hold Work
function coachSow(crop) {
  const f = CH.freeField(crop);
  if (!f) return coachLand();
  if (!CH.onField(f)) return CH.goField(f);
  if (!f.crop) f.plannedCrop = crop || f.plannedCrop;
  const nd = Player.need;
  if (nd && nd.item === 'seed' && nd.field === f && performance.now() - nd.t < 25000) return { text: CH.tap(L('Buy seeds (delivered here)', 'విత్తనాలు కొనండి (ఇక్కడికే)')) + (crop ? L(` and pick ${LN(CROPS[crop])}`, `, ${LN(CROPS[crop])} ఎంచుకోండి`) : ''), icon: 'tap' };
  const nm = crop ? LN(CROPS[crop]) : L('the crop', 'పంట');
  return { text: CH.hold(L(`and walk on the field to sow ${nm}`, `పొలంలో నడిచి ${nm} విత్తండి`)), icon: 'work', progress: f.countMin(3) / f.n };
}
// look after a growing crop until harvest
function coachGrow(f) {
  if (!CH.onField(f)) return CH.goField(f);
  const cd = CROPS[f.crop]; const pct = Math.round(f.growth * 100);
  const nd = Player.need;
  if (nd && nd.field === f && performance.now() - nd.t < 25000) {
    if (nd.item === 'pesticide') return { text: CH.tap(L('Buy pesticide (delivered here)', 'పురుగుమందు కొనండి (ఇక్కడికే)')), icon: 'tap' };
    if (nd.item === 'urea') return { text: CH.tap(L('Buy fertilizer (delivered here)', 'ఎరువు కొనండి (ఇక్కడికే)')), icon: 'tap' };
  }
  if (f.growth >= 0.97) return { text: CH.hold(L('and walk on the field to harvest', 'పొలంలో నడిచి కోయండి')), icon: 'work' };
  if (f.outbreak || f.pests > 10) return { text: CH.hold(L('on the crop: Auto sprays the pests', 'పంటపై నిలబడండి: ఆటో పురుగుమందు చల్లుతుంది')), icon: 'work' };
  if (f.weeds > 16) return { text: CH.hold(L('on the crop to pull the weeds', 'పంటపై నిలబడి కలుపు తీయండి')), icon: 'work' };
  if (f.nut < 40) return { text: CH.hold(L('on the crop to feed it', 'పంటపై నిలబడి ఎరువు వేయండి')), icon: 'work' };
  if (cd && cd.wLo && f.water < cd.wLo && !f.pump && !f.gate) return { text: CH.hold(L('on the crop to water it', 'పంటపై నిలబడి నీరు పెట్టండి')), icon: 'work' };
  if (nd && nd.item === 'wait' && nd.field === f && performance.now() - nd.t < 25000) return { text: L(`${LN(cd)} is ${pct}% grown. `, `${LN(cd)} ${pct}% పెరిగింది. `) + CH.tap(L('Rest until the crop needs you', 'పంటకు పని వచ్చే వరకు విశ్రాంతి')), icon: 'wait' };
  return { text: L(`${LN(cd)} is ${pct}% grown. `, `${LN(cd)} ${pct}% పెరిగింది. `) + CH.hold(L('for a moment, then tap “Rest”', 'కొద్దిసేపు ఉంచి, తర్వాత “విశ్రాంతి” నొక్కండి')), icon: 'wait' };
}
// sell what you have: heap by the field, home storage, or grow some first
function coachSell(crop, where) {
  const hf = CH.heapField(crop);
  if (hf) {
    if (!CH.near(hf.heapSpot, 4.5)) return CH.go(hf.heapSpot, L('the harvest heap', 'పంట కుప్ప'));
    const opt = where === 'trader' ? L('“Sell all to trader”', '“వ్యాపారికి అమ్మండి”') : where === 'msp' ? L('“Send to the MSP centre by lorry”', '“లారీలో మద్దతు ధర కేంద్రానికి”') : L('“Send to the market yard by lorry”', '“లారీలో మార్కెట్ యార్డుకు”');
    return { text: (isMobile ? L('Tap the heap, then ', 'కుప్పను నొక్కి ') : L('Press E at the heap, then ', 'కుప్ప దగ్గర E నొక్కి ')) + opt, icon: 'tap' };
  }
  if (CH.stored(crop) > 0.05) return { text: CH.office(L('Storage → “Send by lorry”', 'నిల్వ → “లారీలో పంపండి”')), icon: 'office', tab: 'storage' };
  const g = CH.growing(crop);
  if (g) return coachGrow(g);
  return coachSow(crop || CH.bestCrop());
}
CH.bestCrop = () => { const s = Time.season(); return CROP_IDS.slice().sort((a, b) => CROPS[b].season[s] - CROPS[a].season[s])[0]; };
// lease or buy another field
function coachLand() {
  const P = Player.pos();
  const f = Fields.list.filter((q) => q.avail && q.heapSpot).sort((a, b) => Math.hypot(a.x - P.x, a.z - P.z) - Math.hypot(b.x - P.x, b.z - P.z))[0];
  if (!f) return { text: L('Look for an orange “For sale / lease” field on the map', 'మ్యాప్‌లో నారింజ రంగు “అమ్మకం / కౌలు” పొలం చూడండి'), icon: 'map' };
  if (!CH.near(f.heapSpot, 4.5)) return CH.go(f.heapSpot, L('the “For lease” board', '“కౌలుకు” బోర్డు'));
  return { text: (isMobile ? L('Tap the board, then ', 'బోర్డు నొక్కి, ') : L('Press E at the board, then ', 'బోర్డు దగ్గర E నొక్కి, ')) + L('lease or buy the field', 'పొలం కౌలుకు తీసుకోండి లేదా కొనండి'), icon: 'tap' };
}

// ---- one step function per mission type ----
const COACH_STEPS = {
  t_walk: () => CH.goField(F1()),
  t_plough: () => { const f = F1(); if (!CH.onField(f)) return CH.goField(f); return { text: CH.hold(L('and walk around the field to plough it', 'పొలమంతా నడిచి దున్నండి')), icon: 'work', progress: f.countMin(2) / f.n / 0.8 }; },
  t_seeds: () => {
    const f = F1(); if (!CH.onField(f)) return CH.goField(f);
    const nd = Player.need;
    if (nd && nd.item === 'seed' && performance.now() - nd.t < 25000) return { text: CH.tap(L('Buy seeds (delivered here)', 'విత్తనాలు కొనండి (ఇక్కడికే)')) + L(', then pick the top crop', ', పైన ఉన్న పంట ఎంచుకోండి'), icon: 'tap' };
    return { text: CH.hold(L('on the field until it asks for seeds', 'విత్తనాలు అడిగే వరకు పొలంలో ఉంచండి')), icon: 'work' };
  },
  t_sow: () => coachSow(F1().crop || F1().plannedCrop || null),
  t_water: () => {
    const f = F1(); if (!CH.onField(f)) return CH.goField(f);
    if (f.pump) return { text: L(`The pump is filling the field (${Math.round(f.water)}%). Keep holding Work or wait a little`, `మోటార్ పొలం నింపుతోంది (${Math.round(f.water)}%). 'పని' పట్టుకోండి లేదా కొద్దిసేపు ఆగండి`), icon: 'wait', progress: f.water / 60 };
    return { text: CH.hold(L('on the crop: the pump starts by itself', 'పంటపై నిలబడండి: మోటార్ తానే మొదలవుతుంది')), icon: 'work', progress: f.water / 60 };
  },
  t_fert: () => {
    const f = F1(); const nd = Player.need;
    if (nd && nd.item === 'urea' && performance.now() - nd.t < 25000) return { text: CH.tap(L('Buy fertilizer (delivered here)', 'ఎరువు కొనండి (ఇక్కడికే)')), icon: 'tap' };
    if (!CH.onField(f)) return CH.goField(f);
    return { text: CH.hold(L('and walk on the crop to spread fertilizer', 'పంటపై నడిచి ఎరువు చల్లండి')), icon: 'work' };
  },
  t_harvest: () => { const f = F1(); if (f.crop && f.sownTiles > 0) return coachGrow(f); return coachSell(null, 'trader'); },
  t_sell: () => coachSell(null, 'trader'),
  plant: (m) => coachSow(m.crop),
  harvestQ: (m) => { const g = CH.growing(m.crop); return g ? coachGrow(g) : coachSow(m.crop); },
  deliver: (m) => coachSell(m.crop, 'yard'),
  msp: () => coachSell(CROP_IDS.find((c) => Market.procurementOpen(c) && (CH.heapField(c) || CH.stored(c) > 0.05)) || null, 'msp'),
  earnSales: () => coachSell(null, 'trader'),
  income: () => coachSell(null, 'trader'),
  sellHigh: (m) => {
    const c = m.crop || m.crop2; const p = c ? Market.price(c) : 0;
    if (c && p < m.price) return { text: L(`Wait for a better price: ${LN(PRODUCE[c])} is ${fmtINR(p)} now, you need ${fmtINR(m.price)}. Keep farming meanwhile`, `మంచి ధర వచ్చే వరకు ఆగండి: ${LN(PRODUCE[c])} ఇప్పుడు ${fmtINR(p)}, కావాల్సింది ${fmtINR(m.price)}. ఈలోగా వ్యవసాయం చేయండి`), icon: 'wait' };
    return coachSell(c, 'yard');
  },
  santha: () => {
    const p = { x: POI.santha.x, z: POI.santha.z };
    if (Time.weekday() !== SANTHA_WEEKDAY) return { text: L('The santha is on Sunday. Keep your tomatoes until then', 'సంత ఆదివారం. అప్పటివరకు టమాటాలు దాచండి'), icon: 'wait' };
    const v = Player.vehicle;
    if (!v || !v.cargo.some((c) => c.crop === 'tomato' || c.crop === 'mango')) return { text: L('Load tomatoes into your bullock cart, then drive to the santha ground', 'ఎడ్లబండిలో టమాటాలు ఎక్కించి సంత మైదానానికి నడపండి'), icon: 'drive' };
    return CH.near(p, 18) ? { text: CH.tap(L('Sell at the Sunday santha (+5%)', 'ఆదివారం సంతలో అమ్మండి (+5%)')), icon: 'tap' } : CH.go(p, L('the santha ground', 'సంత మైదానం'));
  },
  buyTractor: () => { const pr = VEHICLES.tractor35.price; if (!CH.money(pr)) return CH.needMoney(pr); return CH.visit('workshop', L("Bhaskar's workshop", 'భాస్కర్ వర్క్‌షాప్'), L('buy the Bhoomi 35 tractor', 'భూమి 35 ట్రాక్టర్ కొనండి')); },
  buyImpl: (m) => { const I = IMPLEMENTS[m.impl]; if (I && !CH.money(I.price)) return CH.needMoney(I.price); return CH.visit('workshop', L("Bhaskar's workshop", 'భాస్కర్ వర్క్‌షాప్'), L(`buy the ${I ? LN(I) : L('implement', 'పనిముట్టు')}`, `${I ? I.te : 'పనిముట్టు'} కొనండి`)); },
  rentT: () => CH.visit('workshop', L("Bhaskar's workshop", 'భాస్కర్ వర్క్‌షాప్'), L('rent a tractor', 'ట్రాక్టర్ అద్దెకు తీసుకోండి')),
  expand: () => coachLand(),
  ownLand: () => coachLand(),
  leaseLand: () => coachLand(),
  build: (m) => { const U2 = FARM_UPGRADES[m.up]; if (U2 && !CH.money(U2.cost)) return CH.needMoney(U2.cost); return { text: CH.office(L(`Build → ${U2 ? U2.en : ''}`, `నిర్మాణం → ${U2 ? U2.te : ''}`)), icon: 'office', tab: 'build' }; },
  house: () => { const H = HOUSE_LEVELS[Math.min(4, G.S.houseLevel + 1)]; if (H && !CH.money(H.cost)) return CH.needMoney(H.cost); return { text: CH.office(L('Build → upgrade your house', 'నిర్మాణం → ఇల్లు పెంచండి')), icon: 'office', tab: 'build' }; },
  village: (m) => { const P2 = VILLAGE_PROJECTS[m.proj]; if (P2 && !CH.money(P2.cost)) return CH.needMoney(P2.cost); return CH.visit('panchayat', L('the panchayat office', 'పంచాయతీ కార్యాలయం'), L(`fund ${P2 ? P2.en : 'the project'}`, `${P2 ? P2.te : 'ప్రాజెక్టు'}కు నిధులు ఇవ్వండి`)); },
  repairBore: () => {
    if (Inv.count('pumppart') < 1) return CH.visit('workshop', L("Bhaskar's workshop", 'భాస్కర్ వర్క్‌షాప్'), L('buy a pump spare part', 'పంపు విడిభాగం కొనండి'));
    return CH.visit('vbore', L('the village borewell', 'గ్రామ బోరు'), L('repair the borewell', 'బోరు బాగుచేయండి'));
  },
  hire: () => ({ text: CH.office(L('Workers → Hire', 'కూలీలు → పెట్టుకోండి')), icon: 'office', tab: 'workers' }),
  rankUp: () => ({ text: CH.office(L('Profile: see what you need', 'ప్రొఫైల్: ఏం కావాలో చూడండి')), icon: 'office', tab: 'profile' }),
  talk: (m) => { const n = NPCs.byId[m.npc]; if (!n) return null; const p = { x: n.h.x, z: n.h.z }; if (!CH.near(p, 3)) return CH.go(p, LN(n.name)); return { text: CH.tap(L('Talk to ', 'మాట్లాడండి: ') + LN(n.name)), icon: 'tap' }; },
  milk: () => (Inv.count('feed') < 1 ? CH.visit('kirana', L('the kirana shop', 'కిరాణం'), L('buy cattle feed', 'పశువుల దాణా కొనండి')) : { text: L('Milk is sold every morning and evening. Keep the buffaloes fed', 'పాలు ప్రతి ఉదయం, సాయంత్రం అమ్ముతారు. గేదెలకు దాణా పెట్టండి'), icon: 'wait' }),
  repay: () => { const bank = G.S.loans.some((l) => l.kind === 'bank'); return bank ? CH.visit('bank', L('the bank in Nagaram', 'నగరం బ్యాంకు'), L('repay the loan', 'రుణం తీర్చండి')) : CH.visit('lender', L("Hanmanthu's house", 'హన్మంతు'), L('repay the loan', 'అప్పు తీర్చండి')); },
  pray: () => CH.visit('temple', L('the temple', 'గుడి'), L('pray (₹51)', 'దండం పెట్టండి (₹51)')),
  visitBank: () => CH.goPlace('bank', L('the bank in Nagaram', 'నగరం బ్యాంకు')),
  organic: () => {
    if (Inv.count('organic') < 0.05) return CH.visit('seed', L("Srinu's shop", 'శ్రీను దుకాణం'), L('buy farmyard manure', 'పశువుల ఎరువు కొనండి'));
    Player.opt.fert = 'organic';
    const g = CH.growing(); if (!g) return coachSow(CH.bestCrop());
    if (!CH.onField(g)) return CH.goField(g);
    g.autoMode = 'fert';
    return { text: CH.hold(L('and walk on the crop to spread the manure', 'పంటపై నడిచి పశువుల ఎరువు చల్లండి')), icon: 'work' };
  },
  savePest: (m) => { const f = Fields.byId[m.field]; return f ? coachGrow(f) : null; },
  drought: () => { const f = Fields.playerFields().filter((q) => q.crop).sort((a, b) => a.health - b.health)[0]; return f ? coachGrow(f) : { text: L('Keep every crop healthy until the season ends', 'సీజన్ ముగిసే వరకు పంటలన్నీ ఆరోగ్యంగా ఉంచండి'), icon: 'wait' }; },
  festival: (m) => {
    const t = Missions.markerPos(m.mark); if (!t) return null;
    const nm = m.mark === 'ghat' ? L('the lake ghat', 'చెరువు ఘాట్') : L('the temple', 'గుడి');
    if (Time.hour() < 16.5) return { text: L(`The celebration is at ${m.mark === 'ghat' ? 'the lake ghat' : 'the temple'} from 4:30 PM`, `వేడుక సాయంత్రం 4:30 నుంచి`), target: { x: t.x, z: t.z, name: nm }, icon: 'wait' };
    return CH.go(t, nm);
  },
  _default: (m) => { const t = Missions.markerPos(m.mark); if (t) return CH.go(t, Missions.markerName(m.mark) || LN(m.title)); return { text: CH.office(L('Missions', 'లక్ష్యాలు')), icon: 'office', tab: 'missions' }; },
};

const Coach = {
  step: null, key: '', changedAt: 0, banT: 0,
  // the mission the player follows: their own pick, else tutorial first
  current() {
    const S = G.S; if (!S || !S.missions) return null;
    const act = Missions.ordered(); if (!act.length) return null;
    return (S.missions.focus && act.find((m) => m.uid === S.missions.focus)) || act[0];
  },
  follow(m) { G.S.missions.focus = m ? m.uid : null; this.key = ''; UI.dirty = true; UI._mKey = ''; },
  compute() {
    const m = this.current(); if (!m) return null;
    let st = null;
    try { st = (COACH_STEPS[m.tpl] || COACH_STEPS._default)(m); } catch (e) { st = null; }
    if (!st) { try { st = COACH_STEPS._default(m); } catch (e) { st = null; } }
    if (st) { st.m = m; if (st.target && CH.dist(st.target) < 6) st.target = null; }
    return st;
  },
  update() {
    if (!G.started) return;
    const st = this.compute(); this.step = st;
    // numbers (water %, growth %) update the card but do not count as a new step
    const k = st ? st.m.uid + '|' + st.text.replace(/[\d,.%₹]+/g, '#') : '';
    const now = performance.now();
    if (k !== this.key) { this.key = k; this.changedAt = now; this.activeAt = now; if (st) this.show(st, false); return; }
    if (!st || Auto.on) return;
    // still making progress (closer to the place, field getting done)? then no reminder needed
    const tg = st.target; const mark = Math.round(clamp01(st.m.prog / st.m.target) * 40) + '|' + (tg ? Math.round(CH.dist(tg) / 12) : '') + '|' + (st.progress !== undefined ? Math.round(st.progress * 20) : '');
    if (mark !== this.mark) { this.mark = mark; this.activeAt = now; }
    // stuck on the same step for a while: a gentle reminder in the corner, at most once a minute
    if (now - this.activeAt > 40000 && now - (this.remindAt || 0) > 60000 && !UI.modalOpen() && !UI.photoMode) { this.remindAt = now; this.activeAt = now; this.show(st, true); }
  },
  // a new step (or a reminder): the corner card glows, the tips open for a reminder, and it can be read aloud
  show(st, reminder) {
    const mb = UI.el('missions'); if (!mb || UI.photoMode) return;
    mb.classList.remove('flash', 'remind'); void mb.offsetWidth; mb.classList.add(reminder ? 'remind' : 'flash');
    if (reminder) { UI.howUntil = performance.now() + 14000; Audio2.sfx('hint'); }
    else { UI.howOpen = false; UI.howUntil = 0; if (G.t > 2) Audio2.sfx('step'); }   // a new step: close old tips
    UI._mKey = ''; UI.dirty = true;
    if (!reminder || Settings.v.voice === 'always') this.say(st.text);
    else if (Settings.v.voice) this.say(L('Reminder: ', 'గుర్తుందా: ') + st.text);
  },
  // two or three short lines on HOW to do the current step, in the player's words
  howTo(st) {
    if (!st) return [];
    const m = isMobile;
    switch (st.icon) {
      case 'walk': return [
        L('Follow the gold arrow on the screen. The map shows a dotted line to it.', 'తెరపై బంగారు బాణాన్ని అనుసరించండి. మ్యాప్‌లో దానికి చుక్కల గీత ఉంటుంది.'),
        m ? L('Push the left stick all the way to run.', 'పరుగెత్తడానికి ఎడమ స్టిక్‌ను పూర్తిగా నెట్టండి.') : L('W A S D to walk, hold Shift to run.', 'W A S D తో నడవండి, Shift పట్టుకుంటే పరుగు.'),
        L('Far away? Open the Map, tap the place and take an auto.', 'దూరంగా ఉందా? మ్యాప్ తెరిచి, ఆ చోటు నొక్కి ఆటోలో వెళ్ళండి.')];
      case 'drive': return [
        m ? L('Walk next to your vehicle and tap Use to get in.', 'మీ వాహనం దగ్గరికి వెళ్ళి ఎక్కడానికి \'వాడు\' నొక్కండి.') : L('Walk next to your vehicle and press E to get in.', 'మీ వాహనం దగ్గరికి వెళ్ళి ఎక్కడానికి E నొక్కండి.'),
        m ? L('Push the stick up to go, left or right to turn.', 'ముందుకు వెళ్ళడానికి స్టిక్ పైకి, తిరగడానికి ఎడమ/కుడికి నెట్టండి.') : L('W to go, A and D to turn, Space to brake.', 'W తో ముందుకు, A/D తో తిరగండి, Space తో బ్రేక్.'),
        L('Follow the gold arrow.', 'బంగారు బాణాన్ని అనుసరించండి.')];
      case 'work': return [
        L('Stand on your field: it has a gold border on the map.', 'మీ పొలంలో నిలబడండి: మ్యాప్‌లో దానికి బంగారు అంచు ఉంటుంది.'),
        m ? L('Press and HOLD the yellow Work button.', 'పసుపు \'పని\' బటన్‌ను నొక్కి పట్టుకోండి.') : L('Press and HOLD the F key.', 'F కీని నొక్కి పట్టుకోండి.'),
        L('Keep holding it and walk up and down the field until the bar is full.', 'పట్టుకునే ఉండి, బార్ నిండే వరకు పొలంలో అటూ ఇటూ నడవండి.')];
      case 'tap': return [
        L('Walk close: a button with the name pops up at the bottom.', 'దగ్గరికి వెళ్ళండి: కింద పేరుతో ఒక బటన్ వస్తుంది.'),
        m ? L('Tap Use (or tap that button).', '\'వాడు\' నొక్కండి (లేదా ఆ బటన్ నొక్కండి).') : L('Press E (or click that button).', 'E నొక్కండి (లేదా ఆ బటన్ క్లిక్ చేయండి).'),
        L('In the list that opens, the top choice is usually the right one.', 'తెరుచుకునే జాబితాలో పైది సాధారణంగా సరైనది.')];
      case 'wait': return [
        L('Your crop is growing. Nothing to do right now.', 'మీ పంట పెరుగుతోంది. ఇప్పుడు చేయాల్సింది ఏమీ లేదు.'),
        m ? L('Stand on the field and tap Use → Rest to skip ahead.', 'పొలంలో నిలబడి \'వాడు\' → విశ్రాంతి నొక్కి సమయం ముందుకు జరపండి.') : L('Stand on the field and press E → Rest to skip ahead.', 'పొలంలో నిలబడి E → విశ్రాంతి నొక్కి సమయం ముందుకు జరపండి.'),
        L('Or explore the village and come back later.', 'లేదా గ్రామం చుట్టి వచ్చి తర్వాత రండి.')];
      case 'office': return [
        m ? L('Tap the clipboard button at the top of the screen.', 'తెర పైన ఉన్న క్లిప్‌బోర్డ్ బటన్ నొక్కండి.') : L('Press B, or click the clipboard button at the top.', 'B నొక్కండి, లేదా పైన క్లిప్‌బోర్డ్ బటన్ క్లిక్ చేయండి.'),
        L('Then pick the tab named in the mission.', 'తర్వాత లక్ష్యంలో చెప్పిన ట్యాబ్ ఎంచుకోండి.')];
      case 'map': return [
        m ? L('Tap the map button at the top (or the round mini map).', 'పైన మ్యాప్ బటన్ (లేదా గుండ్రటి చిన్న మ్యాప్) నొక్కండి.') : L('Press M, or click the round mini map.', 'M నొక్కండి, లేదా గుండ్రటి చిన్న మ్యాప్ క్లిక్ చేయండి.'),
        L('Tap a place on the map to see it and take an auto there.', 'మ్యాప్‌లో ఒక చోటు నొక్కి చూడండి, ఆటోలో అక్కడికి వెళ్ళండి.')];
      case 'coin': return [
        L('Harvest and sell crops at the market yard to earn money.', 'పంట కోసి మార్కెట్ యార్డులో అమ్మి డబ్బు సంపాదించండి.'),
        L('Short of money? The bank in Nagaram gives crop loans.', 'డబ్బు తక్కువగా ఉందా? నగరం బ్యాంకు పంట రుణాలు ఇస్తుంది.')];
      default: return [L('Follow the gold arrow and read the yellow line above.', 'బంగారు బాణాన్ని అనుసరించి, పైన పసుపు వాక్యం చదవండి.')];
    }
  },
  say(text) {
    if (!Settings.v.voice || !window.speechSynthesis || !window.SpeechSynthesisUtterance) return;
    try {
      const vs = speechSynthesis.getVoices(); const want = LANG;
      const v = vs.find((x) => x.lang && x.lang.toLowerCase().replace('_', '-').startsWith(want + '-in')) || vs.find((x) => x.lang && x.lang.toLowerCase().startsWith(want));
      if (!v && LANG !== 'en') return;   // no voice for this language on the device: stay quiet rather than mispronounce
      speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text.replace(/[“”"]/g, '').replace(/→/g, ', ').replace(/₹/g, 'rupees '));
      if (v) { u.voice = v; u.lang = v.lang; } else u.lang = 'en-IN';
      u.rate = 1; u.pitch = 1.05; u.volume = Math.min(1, (Settings.v.vol || 0.8) + 0.2);
      speechSynthesis.speak(u);
    } catch (e) { /* speech not available */ }
  },
  // iOS and Android only allow speech after a tap: say nothing once to unlock it
  prime() { if (this._primed || !window.speechSynthesis || !window.SpeechSynthesisUtterance) return; this._primed = true; try { const u = new SpeechSynthesisUtterance(' '); u.volume = 0; speechSynthesis.speak(u); } catch (e) { /* ignore */ } },
};
const COACH_ICON = {
  walk: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="13" cy="4" r="2" fill="currentColor"/><path d="M9 21l3-7 3 3v4M7 12l3-4h4l3 4M12 8l-1 6"/></svg>',
  drive: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="7" cy="17" r="3"/><circle cx="18" cy="18" r="2"/><path d="M4 14V8h7l2 5h6v5M11 8V5h-4"/></svg>',
  work: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M13 5.5L8 13h4l-1 5.5 5-7.5h-4z" fill="currentColor"/></svg>',
  tap: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M9 11V5.5a1.5 1.5 0 0 1 3 0V11m0-1.5a1.5 1.5 0 0 1 3 0V11m0-.5a1.5 1.5 0 0 1 3 0v4.5a6 6 0 0 1-6 6h-1a6 6 0 0 1-5-2.7L4 15.6a1.6 1.6 0 0 1 2.6-1.8L9 15"/><path d="M5 4l1.5 1.5M3.5 8.5h2M12.5 1.5V3" /></svg>',
  wait: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="13" r="8"/><path d="M12 9v4l3 2M9 2h6"/></svg>',
  office: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M8 4h8v3H8z M6 5H5a1 1 0 0 0-1 1v14a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1V6a1 1 0 0 0-1-1h-1 M8 12h8 M8 16h5"/></svg>',
  map: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"><path d="M3 6l6-2 6 2 6-2v14l-6 2-6-2-6 2z M9 4v14 M15 6v14"/></svg>',
  coin: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="12" r="9"/><path d="M8.5 8h7M8.5 11h7M9 8c4 0 5 3 0 3l5 5" stroke-linecap="round" stroke-linejoin="round"/></svg>',
};
