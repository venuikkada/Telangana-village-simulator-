// ============================================================================
// Missions: tutorial chain + adaptive procedural missions
// ============================================================================
const TUTORIAL = [
  { tpl: 't_walk', title: { en: 'Walk to your field', te: 'మీ పొలం దగ్గరికి నడవండి' }, desc: { en: 'Your 1-acre field is just south-west of your house. Follow the marker on the map.', te: 'మీ 1 ఎకరం పొలం ఇంటికి నైరుతి దిక్కున ఉంది. మ్యాప్‌లో గుర్తును అనుసరించండి.' }, descM: {en: "Your 1-acre field is just south-west of your house. Walk with the left stick and follow the gold beacon.", te: "మీ 1 ఎకరం పొలం ఇంటికి నైరుతి దిక్కున ఉంది. ఎడమ స్టిక్‌తో నడిచి బంగారు రంగు గుర్తును అనుసరించండి."}, reward: 500, target: 1, mark: 'F1' },
  { tpl: 't_plough', title: { en: 'Plough your first field', te: 'మీ మొదటి పొలాన్ని దున్నండి' }, desc: { en: 'Stand by your bullocks and press E → "Change implement" → Wooden plough. Drive with E, lower the plough with G. Or use the hoe (key 2, hold F), or rent a tractor at Bhaskar\'s workshop.', te: 'మీ ఎడ్ల దగ్గర E నొక్కి → "పనిముట్టు మార్చండి" → నాగలి. E తో నడపండి, G తో నాగలి దించండి. లేదా పార (2 కీ, F పట్టుకోండి) వాడండి, లేదా భాస్కర్ వర్క్‌షాప్‌లో ట్రాక్టర్ అద్దెకు తీసుకోండి.' }, descM: {en: "Walk to your bullocks and tap Use → Change implement → Wooden plough. Tap Use again to drive, then tap Lower to start ploughing. Or pick the hoe in the tool bar and hold Work while you walk.", te: "మీ ఎడ్ల దగ్గర 'వాడు' నొక్కి → పనిముట్టు మార్చండి → నాగలి. మళ్లీ 'వాడు' నొక్కి నడపండి, 'దించు' నొక్కి దున్నండి. లేదా పనిముట్ల బార్‌లో పార ఎంచుకుని నడుస్తూ 'పని' పట్టుకోండి."}, reward: 1500, target: 0.8, mark: 'F1' },
  { tpl: 't_seeds', title: { en: 'Buy seeds at Srinu\'s shop', te: 'శ్రీను దుకాణంలో విత్తనాలు కొనండి' }, desc: { en: 'Srinu\'s seed & fertilizer shop is at the village crossroads. It\'s Vanakalam — paddy or cotton are safe choices. Buy some urea too.', te: 'శ్రీను దుకాణం గ్రామ కూడలిలో ఉంది. ఇది వానాకాలం — వరి లేదా పత్తి మంచి ఎంపిక. కొంచెం యూరియా కూడా కొనండి.' }, reward: 500, target: 1, mark: 'seed' },
  { tpl: 't_sow', title: { en: 'Sow your field', te: 'మీ పొలంలో విత్తండి' }, desc: { en: 'Pick the seed bag (key 3), press Q to choose the crop, and hold F while walking over ploughed soil.', te: 'విత్తనాల సంచి (3 కీ) ఎంచుకోండి, Q తో పంట మార్చండి, దున్నిన నేలపై నడుస్తూ F పట్టుకోండి.' }, descM: {en: "Pick the seed bag in the tool bar, tap Type to choose the crop, then hold Work while you walk over ploughed soil.", te: "పనిముట్ల బార్‌లో విత్తనాల సంచి ఎంచుకోండి, 'రకం' నొక్కి పంట మార్చండి, దున్నిన నేలపై నడుస్తూ 'పని' పట్టుకోండి."}, reward: 1500, target: 0.8, mark: 'F1' },
  { tpl: 't_water', title: { en: 'Water your crop', te: 'పంటకు నీరు పెట్టండి' }, desc: { en: 'Switch on the borewell pump at the corner of your field (press E there). Get the field above 60% water.', te: 'పొలం మూలలోని బోరు మోటార్ వేయండి (అక్కడ E నొక్కండి). పొలంలో నీరు 60% దాటాలి.' }, descM: {en: "Walk to the pump house at the corner of your field and tap Use to switch the pump on. Get the field above 60% water.", te: "పొలం మూలలోని మోటార్ గది దగ్గరకు వెళ్ళి 'వాడు' నొక్కి మోటార్ వేయండి. పొలంలో నీరు 60% దాటాలి."}, reward: 1000, target: 60, mark: 'F1pump' },
  { tpl: 't_fert', title: { en: 'Apply fertilizer', te: 'ఎరువు వేయండి' }, desc: { en: 'Select fertilizer (key 4) and hold F while walking across your crop. Q switches between urea, DAP and others.', te: 'ఎరువు (4 కీ) ఎంచుకుని, పంటపై నడుస్తూ F పట్టుకోండి. Q తో యూరియా, డీఏపీ మార్చవచ్చు.' }, descM: {en: "Pick fertilizer in the tool bar and hold Work while you walk across your crop. Type switches between urea, DAP and others.", te: "పనిముట్ల బార్‌లో ఎరువు ఎంచుకుని, పంటపై నడుస్తూ 'పని' పట్టుకోండి. 'రకం' నొక్కితే యూరియా, డీఏపీ మారుతాయి."}, reward: 1000, target: 0.5, mark: 'F1' },
  { tpl: 't_harvest', title: { en: 'Harvest your crop', te: 'పంట కోయండి' }, desc: { en: 'When the crop is ready, use the sickle (key 6, hold F) or hire a combine harvester at the workshop. Sleep at home to pass the nights faster.', te: 'పంట సిద్ధమైనప్పుడు కొడవలి (6 కీ, F పట్టుకోండి) వాడండి లేదా వర్క్‌షాప్‌లో హార్వెస్టర్ పెట్టించండి. రాత్రులు త్వరగా గడపడానికి ఇంట్లో నిద్రపోండి.' }, descM: {en: "When the crop is ready, pick the sickle and hold Work, or hire a combine harvester at the workshop. Sleep at home to pass the nights faster.", te: "పంట సిద్ధమైనప్పుడు కొడవలి ఎంచుకుని 'పని' పట్టుకోండి, లేదా వర్క్‌షాప్‌లో హార్వెస్టర్ పెట్టించండి. రాత్రులు త్వరగా గడపడానికి ఇంట్లో నిద్రపోండి."}, reward: 2000, target: 0.8, mark: 'F1' },
  { tpl: 't_sell', title: { en: 'Sell your harvest at the market yard', te: 'మార్కెట్ యార్డులో పంట అమ్మండి' }, desc: { en: 'Drive your bullock cart to the heap at your field and press E to load. Take it to the Agricultural Market Yard in Nagaram and sell at the weighbridge.', te: 'ఎడ్లబండిని పొలంలోని కుప్ప దగ్గరకు తెచ్చి E నొక్కి ఎక్కించండి. నగరంలోని వ్యవసాయ మార్కెట్ యార్డుకు తీసుకెళ్ళి వే బ్రిడ్జ్ దగ్గర అమ్మండి.' }, descM: {en: "Drive the bullock cart to the heap at your field and tap Use to load it. Take it to the Agricultural Market Yard in Nagaram and sell at the weighbridge.", te: "ఎడ్లబండిని పొలంలోని కుప్ప దగ్గరకు తెచ్చి 'వాడు' నొక్కి ఎక్కించండి. నగరంలోని మార్కెట్ యార్డుకు తీసుకెళ్ళి వే బ్రిడ్జ్ దగ్గర అమ్మండి."}, reward: 5000, target: 1, mark: 'yard' },
];

const Missions = {
  init() {
    const S = G.S;
    if (!S.missions) S.missions = { active: [], done: 0, tut: 0, seq: 1, history: [] };
    const on = (ev) => Bus.on(ev, (p) => { if (G.started) this.onEvent(ev, p); });
    if (!this._bound) { this._bound = true; ['work', 'harvestTile', 'sold', 'landBought', 'landLeased', 'built', 'hire', 'rank', 'bought', 'vehicleBought', 'implBought', 'rent', 'pump', 'talk', 'eat', 'pray', 'bus', 'boreFixed', 'milk', 'loanRepaid', 'loaded', 'pestOutbreak', 'drought', 'seasonStart', 'constructionStart'].forEach(on); }
    this.ensure();
  },
  markerPos(key) {
    if (!key) return null;
    if (key === 'F1') return { x: Fields.byId.F1.x, z: Fields.byId.F1.z };
    if (key === 'F1pump') { const f = Fields.byId.F1; return f.pumpPos ? { x: f.pumpPos.x, z: f.pumpPos.z } : { x: f.x1, z: f.z0 }; }
    if (key === 'seed') return { x: POI.seedShop.counter[0], z: POI.seedShop.counter[1] };
    if (key === 'yard') return { x: POI.yard.weigh.x, z: POI.yard.weigh.z };
    if (key === 'workshop') return { x: POI.workshop.counter.x, z: POI.workshop.counter.z };
    if (key === 'panchayat') return { x: POI.panchayat.door[0], z: POI.panchayat.door[1] };
    if (key === 'home') return { x: HOME.x + 8, z: HOME.z };
    if (key === 'temple') return { x: POI.temple.inner.x, z: POI.temple.inner.z };
    if (key === 'ghat') return { x: POI.ghat.x, z: POI.ghat.z };
    if (key === 'santha') return { x: POI.santha.x, z: POI.santha.z };
    if (key === 'bank') return POI.bank ? { x: POI.bank.x, z: POI.bank.z } : null;
    if (key === 'vbore') return { x: -17, z: -63 };
    if (key.startsWith('npc:')) { const n = NPCs.byId[key.slice(4)]; return n ? { x: n.h.x, z: n.h.z } : null; }
    if (key.startsWith('field:')) { const f = Fields.byId[key.slice(6)]; return f ? { x: f.x, z: f.z } : null; }
    return null;
  },
  add(m) {
    const S = G.S; m.uid = S.missions.seq++; m.prog = m.prog || 0; m.t0 = Time.totalMin();
    S.missions.active.push(m);
    UI.toast(L('New mission: ', 'కొత్త లక్ష్యం: ') + LN(m.title), 'mission');
    if (m.tpl.startsWith('t_')) setTimeout(() => UI.toast(LN(isMobile && m.descM ? m.descM : m.desc), 'tip'), 900);
    UI.dirty = true;
    return m;
  },
  ensure() {
    const S = G.S; const M = S.missions;
    if (M.tut < TUTORIAL.length && !M.active.some((m) => m.tpl.startsWith('t_'))) { const t = TUTORIAL[M.tut]; this.add(JSON.parse(JSON.stringify(Object.assign({}, t, { prog: 0, mark: t.mark })))); }
    const want = M.tut < 3 ? 0 : M.tut < TUTORIAL.length ? 2 : 3;
    let guard = 0;
    while (M.active.filter((m) => !m.tpl.startsWith('t_') && !m.special).length < want && guard++ < 20) { const m = this.generate(); if (!m) break; this.add(m); }
  },
  complete(m) {
    const S = G.S;
    S.missions.active = S.missions.active.filter((x) => x !== m);
    S.missions.done++;
    if (m.reward) Money.add(m.reward, 'mission');
    if (m.rel) Rel.add(m.rel, 10);
    if (m.tpl.startsWith('t_')) { S.missions.tut++; if (S.missions.tut >= TUTORIAL.length) UI.toast(L('Tutorial complete! The village is yours to grow.', 'శిక్షణ పూర్తయింది! ఇక గ్రామాన్ని అభివృద్ధి చేయడం మీ చేతుల్లో.'), 'good'); }
    S.missions.history.unshift({ title: m.title, reward: m.reward, day: Time.day() }); if (S.missions.history.length > 30) S.missions.history.pop();
    UI.missionDone(m);
    Audio2.sfx('mission');
    Bus.emit('missionDone', { m });
    this.ensure();
  },
  fail(m, why) { const S = G.S; S.missions.active = S.missions.active.filter((x) => x !== m); UI.toast(L('Mission failed: ', 'లక్ష్యం విఫలమైంది: ') + LN(m.title) + (why ? ' — ' + LN(why) : ''), 'bad'); this.ensure(); },
  progress(m, val, abs = false) { m.prog = abs ? val : m.prog + val; UI.dirty = true; if (m.prog >= m.target - 1e-6) this.complete(m); },
  onEvent(ev, p) {
    const S = G.S;
    for (const m of [...S.missions.active]) {
      const f1 = Fields.byId.F1;
      switch (m.tpl) {
        case 't_plough': if (ev === 'work' && p.field === f1) this.progress(m, f1.countMin(1) / f1.n, true); break;
        case 't_seeds': if (ev === 'bought' && p.item.startsWith('seed_')) this.progress(m, 1); break;
        case 't_sow': if (ev === 'work' && p.op === 'sow' && p.field === f1) this.progress(m, f1.countMin(3) / f1.n, true); break;
        case 't_fert': if (ev === 'work' && p.op === 'fertilize' && p.field.isPlayer) { m.tiles = (m.tiles || 0) + p.n; this.progress(m, m.tiles / f1.n, true); } break;
        case 't_harvest': if (ev === 'work' && p.op === 'harvest' && p.field.isPlayer) { m.tiles = (m.tiles || 0) + p.n; this.progress(m, Math.min(1, m.tiles / f1.n), true); } break;
        case 't_sell': if (ev === 'sold') this.progress(m, 1); break;
        case 'deliver': if (ev === 'sold' && (p.where === 'yard' || p.where === 'msp' || p.where === 'city') && (!m.crop || m.crop === p.crop)) this.progress(m, p.qty); break;
        case 'plant': if (ev === 'work' && p.op === 'sow' && p.crop === m.crop && p.field.isPlayer) this.progress(m, p.n * p.field.acres / p.field.n); break;
        case 'harvestQ': if (ev === 'harvestTile' && p.crop === m.crop) this.progress(m, p.qty); break;
        case 'earnSales': if (ev === 'sold') this.progress(m, p.rev); break;
        case 'sellHigh': if (ev === 'sold' && p.crop === m.crop && p.price >= m.price) this.progress(m, 1); break;
        case 'msp': if (ev === 'sold' && p.where === 'msp') this.progress(m, p.qty); break;
        case 'santha': if (ev === 'sold' && p.where === 'santha') this.progress(m, 1); break;
        case 'buyTractor': if (ev === 'vehicleBought' && p.type.startsWith('tractor')) this.progress(m, 1); break;
        case 'buyImpl': if (ev === 'implBought' && p.type === m.impl) this.progress(m, 1); break;
        case 'build': if (ev === 'built' && p.kind === 'up' && p.id === m.up) this.progress(m, 1); break;
        case 'house': if (ev === 'built' && p.kind === 'house') this.progress(m, 1); break;
        case 'village': if (ev === 'built' && p.kind === 'village' && p.id === m.proj) this.progress(m, 1); break;
        case 'repairBore': if (ev === 'boreFixed') this.progress(m, 1); break;
        case 'hire': if (ev === 'hire') this.progress(m, 1); break;
        case 'talk': if (ev === 'talk' && p.npc.id === m.npc) this.progress(m, 1); break;
        case 'milk': if (ev === 'milk') this.progress(m, p.litres); break;
        case 'organic': if (ev === 'work' && p.op === 'fertilize' && p.field.isPlayer && G.S._lastFert === 'organic') this.progress(m, p.n * p.field.acres / p.field.n); break;
        case 'repay': if (ev === 'loanRepaid') this.progress(m, 1); break;
        case 'pray': if (ev === 'pray') this.progress(m, 1); break;
        case 'rentT': if (ev === 'rent') this.progress(m, 1); break;
        case 'leaseLand': if (ev === 'landLeased' || ev === 'landBought') this.progress(m, 1); break;
      }
    }
    if (ev === 'pestOutbreak' && p.field.isPlayer && !S.missions.active.some((m) => m.tpl === 'savePest' && m.field === p.field.id)) {
      const cd = CROPS[p.field.crop];
      this.add({ tpl: 'savePest', special: true, field: p.field.id, title: { en: `Save ${p.field.label()} from ${LN(cd.pestName)}`, te: `${p.field.label()}ను ${cd.pestName.te} నుంచి కాపాడండి` }, desc: { en: 'Spray pesticide over the whole crop within 12 hours (sprayer, key 5).', te: '12 గంటల్లో పంట మొత్తం పురుగుమందు పిచికారీ చేయండి (స్ప్రేయర్, 5 కీ).' }, reward: 2500, target: 1, deadline: Time.totalMin() + 12 * 60, mark: 'field:' + p.field.id });
    }
    if (ev === 'drought' && !S.missions.active.some((m) => m.tpl === 'drought')) {
      this.add({ tpl: 'drought', special: true, title: { en: 'Survive the drought', te: 'కరువును తట్టుకోండి' }, desc: { en: 'Keep every crop you grow this season above 50% health until the season ends. Borewells, a farm pond and the canal will help.', te: 'ఈ సీజన్ ముగిసే వరకు మీ పంటలన్నీ 50% ఆరోగ్యం పైన ఉంచండి. బోర్లు, పంట కుంట, కాలువ సహాయపడతాయి.' }, reward: 25000, target: 1, season: Time.season() });
    }
    if (ev === 'seasonStart') { for (const m of [...S.missions.active]) if (m.tpl === 'drought' && m.season !== Time.season()) { if (!m.failed) this.complete(m); } }
  },
  // periodic state checks
  update() {
    const S = G.S; const P = Player.pos();
    for (const m of [...S.missions.active]) {
      switch (m.tpl) {
        case 't_walk': { const f = Fields.byId.F1; if (P.x > f.x0 - 2 && P.x < f.x1 + 2 && P.z > f.z0 - 2 && P.z < f.z1 + 2) this.progress(m, 1); break; }
        // tutorial steps the player already did out of order complete on their own
        case 't_plough': { const f = Fields.byId.F1; if (f.countMin(1) / f.n >= m.target || f.crop) this.progress(m, 1, true); break; }
        case 't_seeds': { if (CROP_IDS.some((c) => Inv.count('seed_' + c) > 0.01) || Fields.byId.F1.crop || S.stats.harvestQ > 0) this.progress(m, 1); break; }
        case 't_sow': { const f = Fields.byId.F1; if (f.countMin(3) / f.n >= m.target || S.stats.harvestQ > 0) this.progress(m, 1, true); break; }
        case 't_fert': case 't_harvest': { if (S.stats.harvestQ > 0 && (m.tpl === 't_fert' || Fields.byId.F1.heap || Storage.used(false) + Storage.used(true) > 0 || S.stats.sold && Object.keys(S.stats.sold).length)) this.progress(m, m.target, true); break; }
        case 't_water': { const f = Fields.byId.F1; if (f.crop) this.progress(m, Math.min(m.target, f.water), true); else if (S.stats.harvestQ > 0) this.progress(m, m.target, true); break; }
        case 'expand': this.progress(m, Farm.farmedAcres(), true); break;
        case 'ownLand': this.progress(m, Farm.ownedAcres(), true); break;
        case 'income': this.progress(m, S.stats.cropIncome, true); break;
        case 'rankUp': if (S.rank >= m.rank) this.progress(m, 1); break;
        case 'savePest': { const f = Fields.byId[m.field]; if (!f || !f.crop) { this.fail(m); break; } if (!f.outbreak && f.pests < 12) this.progress(m, 1); else if (Time.totalMin() > m.deadline) this.fail(m, { en: 'the pests spread', te: 'పురుగులు వ్యాపించాయి' }); break; }
        case 'drought': { for (const f of Fields.playerFields()) if (f.crop && f.health < 50) { m.failed = true; this.fail(m, { en: `${f.label()} wilted`, te: `${f.label()} వాడిపోయింది` }); break; } break; }
        case 'festival': { const pl = this.markerPos(m.mark); const hr = Time.hour(); if (pl && Math.hypot(P.x - pl.x, P.z - pl.z) < 25 && hr > 16.5 && hr < 21) this.progress(m, 1); if (Time.day() > m.day) this.fail(m); break; }
        case 'visitBank': { const pl = this.markerPos('bank'); if (pl && Math.hypot(P.x - pl.x, P.z - pl.z) < 8) this.progress(m, 1); break; }
      }
      if (m.deadline && Time.totalMin() > m.deadline && S.missions.active.includes(m) && m.tpl !== 'savePest') this.fail(m, { en: 'time ran out', te: 'సమయం అయిపోయింది' });
    }
    // festival mission on the day
    const fest = Time.festivalToday();
    if (fest && !S.missions.active.some((m) => m.tpl === 'festival') && S.missions.lastFest !== Time.day()) {
      S.missions.lastFest = Time.day();
      this.add({ tpl: 'festival', special: true, day: Time.day(), title: { en: `Join the ${fest.en} celebration`, te: `${fest.te} వేడుకలో పాల్గొనండి` }, desc: fest.desc, reward: 1500, target: 1, mark: fest.place === 'lake' ? 'ghat' : 'temple' });
    }
  },
  // ---- procedural generator ----
  generate() {
    const S = G.S; const active = S.missions.active.map((m) => m.tpl + (m.crop || m.up || m.proj || m.impl || ''));
    const s = Time.season();
    const goodCrops = CROP_IDS.filter((c) => CROPS[c].season[s] >= 0.95);
    const acres = Farm.farmedAcres();
    const hasTractor = Vehicles.player.some((v) => v.owned && v.type.startsWith('tractor'));
    const cands = [];
    const push = (w, mk) => { if (w > 0) cands.push([w, mk]); };
    push(3, () => { const c = pick(goodCrops); const n = Math.max(1, Math.min(3, Math.round(acres * 0.6))); return { tpl: 'plant', crop: c, title: { en: `Plant ${n} acre${n > 1 ? 's' : ''} of ${CROPS[c].en}`, te: `${n} ఎకరాల్లో ${CROPS[c].te} వేయండి` }, desc: { en: `${CROPS[c].en} suits ${SEASONS[s].en}. Sow it on your own or leased land.`, te: `${CROPS[c].te} ${SEASONS[s].te}కి సరిపోతుంది. మీ సొంత లేదా కౌలు భూమిలో విత్తండి.` }, target: n, reward: 1500 * n }; });
    const growing = Fields.playerFields().filter((f) => f.crop);
    if (growing.length) push(3, () => { const f = pick(growing); const exp = CROPS[f.crop].yield * f.acres * 0.6; const q = Math.max(2, Math.round(exp)); return { tpl: 'harvestQ', crop: f.crop, title: { en: `Harvest ${q} quintals of ${CROPS[f.crop].en}`, te: `${q} క్వింటాళ్ల ${CROPS[f.crop].te} కోయండి` }, desc: { en: 'Bring the crop to harvest in good health for a bigger yield.', te: 'మంచి దిగుబడికి పంటను ఆరోగ్యంగా ఉంచి కోయండి.' }, target: q, reward: Math.round(q * 120) }; });
    const stockCrops = [...new Set([...S.storage.map((e) => e.crop), ...Fields.list.filter((f) => f.heap && f.isPlayer).map((f) => f.heap.crop), ...growing.map((f) => f.crop)])].filter((c) => CROPS[c]);
    if (stockCrops.length) push(3, () => { const c = pick(stockCrops); const q = Math.max(3, Math.round(4 + acres * 3)); return { tpl: 'deliver', crop: c, title: { en: `Deliver ${q} quintals of ${CROPS[c].en} to the market yard`, te: `మార్కెట్ యార్డుకు ${q} క్వింటాళ్ల ${CROPS[c].te} చేర్చండి` }, desc: { en: 'Sell at the weighbridge in Nagaram, or at the MSP centre.', te: 'నగరంలోని వే బ్రిడ్జ్ దగ్గర లేదా మద్దతు ధర కేంద్రంలో అమ్మండి.' }, target: q, reward: q * 150, mark: 'yard' }; });
    push(2, () => { const tiers = [50000, 100000, 250000, 500000, 1000000, 2500000, 5000000]; const x = tiers.find((t) => t > S.stats.cropIncome * 0.25) || 5000000; return { tpl: 'earnSales', title: { en: `Earn ${fmtShortINR(x)} from crop sales`, te: `పంట అమ్మకాలతో ${fmtShortINR(x)} సంపాదించండి` }, desc: { en: 'Any sale counts — yard, MSP centre, santha or trader.', te: 'ఏ అమ్మకమైనా లెక్కే — యార్డు, మద్దతు ధర, సంత లేదా వ్యాపారి.' }, target: x, reward: Math.round(x * 0.04) }; });
    { const tiers = [100000, 500000, 1000000, 2500000, 5000000, 10000000, 20000000]; const x = tiers.find((t) => t > S.stats.cropIncome); if (x) push(1.5, () => ({ tpl: 'income', title: { en: `Reach ${fmtShortINR(x)} farming income`, te: `వ్యవసాయ ఆదాయం ${fmtShortINR(x)}కు చేర్చండి` }, desc: { en: 'Your lifetime earnings from crops and milk.', te: 'పంటలు, పాల నుంచి మీ మొత్తం ఆదాయం.' }, target: x, reward: Math.round(x * 0.02) })); }
    if (!hasTractor) push(S.money > 300000 ? 4 : 1.2, () => ({ tpl: 'buyTractor', title: { en: 'Buy your first tractor', te: 'మీ మొదటి ట్రాక్టర్ కొనండి' }, desc: { en: 'Bhaskar sells the Bhoomi 35 at his workshop. A bank crop loan can help.', te: 'భాస్కర్ వర్క్‌షాప్‌లో భూమి 35 దొరుకుతుంది. బ్యాంకు పంట రుణం సహాయపడుతుంది.' }, target: 1, reward: 20000, mark: 'workshop' }));
    if (hasTractor) { const missing = TRACTOR_IMPLEMENTS.filter((i) => !S.implements.includes(i)); if (missing.length) push(2, () => { const i = pick(missing); return { tpl: 'buyImpl', impl: i, title: { en: `Buy a ${IMPLEMENTS[i].en}`, te: `${IMPLEMENTS[i].te} కొనండి` }, desc: { en: 'More implements, faster work.', te: 'ఎక్కువ పనిముట్లు, వేగమైన పని.' }, target: 1, reward: Math.round(IMPLEMENTS[i].price * 0.08), mark: 'workshop' }; }); }
    { const tiers = [2, 3, 5, 10, 15, 25, 40]; const n = tiers.find((t) => t > acres + 0.05); if (n) push(2.5, () => ({ tpl: 'expand', title: { en: `Expand your farm to ${n} acres`, te: `మీ వ్యవసాయాన్ని ${n} ఎకరాలకు విస్తరించండి` }, desc: { en: 'Lease (koulu) or buy fields — look for the For Sale / For Lease boards.', te: 'పొలాలను కౌలుకు తీసుకోండి లేదా కొనండి — "అమ్మకానికి / కౌలుకు" బోర్డులు చూడండి.' }, target: n, reward: n * 2500 })); }
    if (Farm.ownedAcres() < 30) { const n = Math.max(2, Math.ceil(Farm.ownedAcres() + 1)); push(1.2, () => ({ tpl: 'ownLand', title: { en: `Own ${n} acres of land`, te: `${n} ఎకరాల భూమి సొంతం చేసుకోండి` }, desc: { en: 'Owned land raises your loan limit and earns the seasonal investment support.', te: 'సొంత భూమి రుణ పరిమితిని పెంచుతుంది, సీజనల్ పెట్టుబడి సాయం వస్తుంది.' }, target: n, reward: n * 4000 })); }
    { const ups = Object.keys(FARM_UPGRADES).filter((u) => !S.up[u] && !S.construction.some((c) => c.id === u)); if (ups.length) push(2, () => { ups.sort((a, b) => FARM_UPGRADES[a].cost - FARM_UPGRADES[b].cost); const u = ups[Math.floor(frand() * Math.min(3, ups.length))]; const U2 = FARM_UPGRADES[u]; return { tpl: 'build', up: u, title: { en: `Build a ${U2.en}`, te: `${U2.te} నిర్మించండి` }, desc: U2.desc, target: 1, reward: Math.round(U2.cost * 0.1), mark: 'home' }; }); }
    if (S.houseLevel < 4 && !S.construction.some((c) => c.kind === 'house')) push(1.2, () => { const H = HOUSE_LEVELS[S.houseLevel + 1]; return { tpl: 'house', title: { en: `Upgrade your home to a ${H.en}`, te: `మీ ఇంటిని ${H.te}గా మార్చండి` }, desc: { en: 'A bigger home stores more produce and restores more energy.', te: 'పెద్ద ఇంట్లో ఎక్కువ నిల్వ, ఎక్కువ విశ్రాంతి.' }, target: 1, reward: Math.round(H.cost * 0.08), mark: 'home' }; });
    { const projs = Object.keys(VILLAGE_PROJECTS).filter((p) => !S.village[p] && !S.construction.some((c) => c.id === p)); if (projs.length && S.rank >= 1) push(1.5, () => { const p = pick(projs); const P2 = VILLAGE_PROJECTS[p]; return { tpl: 'village', proj: p, rel: 'sarpanch', title: { en: `Fund ${P2.en} for Ramapuram`, te: `రామాపురానికి ${P2.te} నిధులు ఇవ్వండి` }, desc: P2.desc, target: 1, reward: Math.round(P2.cost * 0.05), mark: 'panchayat' }; }); }
    if (!S.flags.boreFixed) push(1.5, () => ({ tpl: 'repairBore', rel: 'sarpanch', title: { en: 'Repair the village borewell', te: 'గ్రామ బోరుబావిని బాగుచేయండి' }, desc: { en: 'The hand-pump borewell under the water tank is broken. Buy a pump spare part at Bhaskar\'s workshop and fix it.', te: 'నీటి ట్యాంకు కింద ఉన్న బోరు పాడైంది. భాస్కర్ వర్క్‌షాప్‌లో పంపు విడిభాగం కొని బాగుచేయండి.' }, target: 1, reward: 8000, mark: 'vbore' }));
    if (S.rank >= 1 && S.workers.length < Workers.maxPermanent()) push(1.5, () => ({ tpl: 'hire', title: { en: 'Hire a worker', te: 'ఒక కూలీని పెట్టుకోండి' }, desc: { en: 'Workers plough, sow, weed, spray and harvest on their own. Hire from the farm office at your house.', te: 'కూలీలు దున్నడం, విత్తడం, కలుపు తీయడం, పిచికారీ, కోత స్వయంగా చేస్తారు. ఇంటి వద్ద వ్యవసాయ కార్యాలయం నుంచి పెట్టుకోండి.' }, target: 1, reward: 3000, mark: 'home' }));
    { const named = NPCs.list.filter((n) => n.named && n.h.visible); if (named.length) push(1.5, () => { const n = pick(named); return { tpl: 'talk', npc: n.id, rel: n.id, title: { en: `Visit ${n.name.en}`, te: `${n.name.te}ను కలవండి` }, desc: { en: `${n.name.en} (${n.role.en}) wants a word with you.`, te: `${n.name.te} (${n.role.te}) మీతో మాట్లాడాలనుకుంటున్నారు.` }, target: 1, reward: 1000, mark: 'npc:' + n.id }; }); }
    if (stockCrops.some((c) => CROPS[c].msp) && CROP_IDS.some((c) => Market.procurementOpen(c))) push(1.5, () => { const c = stockCrops.find((x) => Market.procurementOpen(x)) || 'paddy'; const q = Math.max(3, Math.round(acres * 4)); return { tpl: 'msp', title: { en: `Sell ${q} quintals at the MSP centre`, te: `మద్దతు ధర కేంద్రంలో ${q} క్వింటాళ్లు అమ్మండి` }, desc: { en: `The government centre buys ${CROPS[c].en} at ₹${CROPS[c].msp}/q. Payment arrives after 2 days.`, te: `ప్రభుత్వ కేంద్రం ${CROPS[c].te}ని క్వింటాలుకు ₹${CROPS[c].msp}కు కొంటుంది. చెల్లింపు 2 రోజుల్లో.` }, target: q, reward: q * 80, mark: 'yard' }; });
    if (stockCrops.length) push(1.2, () => { const c = pick(stockCrops); const tgt = Math.round(Market.price(c) * 1.08); return { tpl: 'sellHigh', crop: c, title: { en: `Sell ${CROPS[c].en} above ₹${tgt}/q`, te: `${CROPS[c].te}ను క్వింటాలుకు ₹${tgt} పైన అమ్మండి` }, desc: { en: 'Store it and watch the ticker. Prices move with supply, weather and news.', te: 'నిల్వ చేసి ధరలు గమనించండి. సరఫరా, వాతావరణం, వార్తలతో ధరలు మారుతాయి.' }, target: 1, reward: 4000, crop2: c, price: tgt, deadline: Time.totalMin() + 6 * 1440 }; });
    if (S.up.dairyShed) push(1.5, () => { const q = 40 + S.dairy.n * 10; return { tpl: 'milk', title: { en: `Sell ${q} litres of milk`, te: `${q} లీటర్ల పాలు అమ్మండి` }, desc: { en: 'Keep the buffaloes fed with cattle feed from the kirana.', te: 'కిరాణం నుంచి దాణా తెచ్చి గేదెలకు పెట్టండి.' }, target: q, reward: q * 20 }; });
    if (Finance.debt() > 1000) push(1.2, () => ({ tpl: 'repay', title: { en: 'Clear a loan', te: 'ఒక రుణం తీర్చండి' }, desc: { en: 'Interest keeps growing every day. Pay it off at the bank or with Hanmanthu.', te: 'వడ్డీ రోజూ పెరుగుతుంది. బ్యాంకులో లేదా హన్మంతుకు చెల్లించండి.' }, target: 1, reward: 3000 }));
    push(0.6, () => ({ tpl: 'pray', title: { en: 'Offer prayers at the Anjaneya temple', te: 'ఆంజనేయ స్వామి గుడిలో దండం పెట్టండి' }, desc: { en: 'Farmers here start a season with a visit to the temple.', te: 'ఇక్కడి రైతులు సీజన్‌ను గుడి దర్శనంతో మొదలుపెడతారు.' }, target: 1, reward: 500, mark: 'temple' }));
    if (Inv.count('organic') < 1 && acres >= 1) push(0.8, () => ({ tpl: 'organic', title: { en: 'Spread farmyard manure on 1 acre', te: '1 ఎకరంలో పశువుల ఎరువు చల్లండి' }, desc: { en: 'Organic manure feeds the crop and improves soil health for future seasons.', te: 'పశువుల ఎరువు పంటకు బలం, భవిష్యత్ సీజన్లకు నేల ఆరోగ్యం.' }, target: 1, reward: 3000 }));
    if (!hasTractor) push(1, () => ({ tpl: 'rentT', title: { en: 'Rent a tractor from Bhaskar', te: 'భాస్కర్ దగ్గర ట్రాక్టర్ అద్దెకు తీసుకోండి' }, desc: { en: 'Four hours of a tractor ploughs far faster than bullocks.', te: 'నాలుగు గంటల ట్రాక్టర్ ఎడ్ల కంటే చాలా వేగంగా దున్నుతుంది.' }, target: 1, reward: 1500, mark: 'workshop' }));
    if (acres < 4) push(1.5, () => ({ tpl: 'leaseLand', title: { en: 'Lease or buy another field', te: 'ఇంకో పొలం కౌలుకు తీసుకోండి లేదా కొనండి' }, desc: { en: 'Fields with a board say "For lease" or "For sale". Leasing costs about ₹12,000 an acre for two seasons.', te: '"కౌలుకు" లేదా "అమ్మకానికి" బోర్డులు ఉన్న పొలాలు చూడండి. కౌలు ఎకరానికి రెండు సీజన్లకు సుమారు ₹12,000.' }, target: 1, reward: 2000 }));
    if (Time.weekday() === SANTHA_WEEKDAY - 1 || Time.weekday() === SANTHA_WEEKDAY) if (stockCrops.includes('tomato')) push(2, () => ({ tpl: 'santha', title: { en: 'Sell tomatoes at the Sunday santha', te: 'ఆదివారం సంతలో టమాటాలు అమ్మండి' }, desc: { en: 'Load tomatoes into a vehicle and drive to the santha ground on Sunday.', te: 'ఆదివారం టమాటాలను వాహనంలో సంత మైదానానికి తీసుకెళ్ళండి.' }, target: 1, reward: 2000, mark: 'santha' }));
    if (S.rank < 5) push(0.8, () => ({ tpl: 'rankUp', rank: S.rank + 1, title: { en: `Become a ${RANKS[S.rank + 1].en}`, te: `${RANKS[S.rank + 1].te} అవ్వండి` }, desc: { en: 'Check the Profile tab in the farm office for what is needed.', te: 'అవసరాల కోసం వ్యవసాయ కార్యాలయంలో ప్రొఫైల్ చూడండి.' }, target: 1, reward: 10000 * (S.rank + 1) }));
    if (POI.bank && !S.flags.visitedBank) push(0.7, () => ({ tpl: 'visitBank', title: { en: 'Visit the cooperative bank in Nagaram', te: 'నగరంలోని సహకార బ్యాంకును సందర్శించండి' }, desc: { en: 'Take the bus from the village stop. Ask Anjali about crop loans and deposits.', te: 'గ్రామ స్టాప్ నుంచి బస్సు ఎక్కండి. పంట రుణాలు, డిపాజిట్ల గురించి అంజలిని అడగండి.' }, target: 1, reward: 800, mark: 'bank' }));
    const fresh = cands.filter(([, mk]) => true);
    for (let tries = 0; tries < 12 && fresh.length; tries++) {
      let tot = 0; for (const [w] of fresh) tot += w;
      let r = frand() * tot; let idx = 0; for (let i = 0; i < fresh.length; i++) { r -= fresh[i][0]; if (r <= 0) { idx = i; break; } }
      const m = fresh[idx][1]();
      const key = m.tpl + (m.crop || m.up || m.proj || m.impl || '');
      if (!active.includes(key)) return m;
      fresh.splice(idx, 1);
    }
    return null;
  },
  primaryMarker() {
    const S = G.S; for (const m of S.missions.active) { const p = this.markerPos(m.mark); if (p) return { p, m }; } return null;
  },
};
