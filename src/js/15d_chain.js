// ============================================================================
// Mission after mission: one mission at a time on the corner card, the next one
// right after it, for ever. Farm work and fun take turns: plough the field, then a
// cup of chai; sow, then the temple bell; harvest, then gully cricket... each with a
// little story and a reward, and a bonus for every five in a row. During the
// tutorial the fun comes as breaks between the lessons and while the crop grows.
// ============================================================================
// fun and village missions: the matching rules and titles come from TASK_POOL
const CHAIN_FUN = {
  chai: { story: { en: "All that work made you thirsty. Yadamma's chai is the best in Ramapuram!", te: 'అంత పని చేశాక దాహం వేసింది. రామాపురంలో యాదమ్మ చాయ్‌ను మించింది లేదు!' },
    step: () => CH.visit('tea', L("Yadamma's tea stall", 'యాదమ్మ టీ స్టాల్'), L('buy a cup of chai', 'ఒక చాయ్ కొనండి')) },
  pray: { story: { en: "Ammamma says a good crop needs Hanuman's blessing. Off to the temple!", te: 'మంచి పంటకు ఆంజనేయుడి దీవెన కావాలని అమ్మమ్మ అంటోంది. పదండి గుడికి!' }, step: () => COACH_STEPS.pray() },
  six: { story: { en: "The village kids say you can't hit a six. Show them!", te: 'మీరు సిక్స్ కొట్టలేరని ఊరి పిల్లలు అంటున్నారు. చూపించండి!' }, play: () => Games.cricketStart() },
  splash: { story: { en: 'Phew, it is so hot! Run and jump into the lake with a big splash.', te: 'అబ్బా, ఎంత ఎండ! పరిగెత్తి చెరువులో ధబాల్న దూకండి.' }, lake: true, play: () => Games.jumpStart() },
  rooster: { story: { en: "Ranga's rooster ran away again and he is shouting the village down. Catch it!", te: 'రంగడి కోడిపుంజు మళ్ళీ పారిపోయింది, ఊరంతా అరుస్తున్నాడు. పట్టుకోండి!' }, play: () => Games.roosterStart() },
  monkey: { story: { en: 'A naughty monkey lives in the big trees. It loves stealing caps and lunch boxes!', te: 'పెద్ద చెట్లలో అల్లరి కోతి ఉంది. టోపీలు, టిఫిన్ బాక్సులు ఎత్తుకెళ్ళడం దానికి సరదా!' }, tree: true, play: () => Games.monkeyStart(false) },
  kites: { story: { en: 'The boy next door is showing off his kite. Cut 2 kites out of the sky!', te: 'పక్కింటి పిల్లాడు గాలిపటంతో గొప్పలు చెబుతున్నాడు. 2 గాలిపటాలు తెంపండి!' }, play: () => Games.kiteStart() },
  fish: { story: { en: 'Amma wants fish curry tonight. Catch 2 fish at the lake!', te: 'ఈ రాత్రి చేపల కూర కావాలని అమ్మ అంటోంది. చెరువులో 2 చేపలు పట్టండి!' }, lake: true, play: () => Games.fishStart() },
  chicken: { story: { en: 'The kids dare you to do the chicken dance in front of everyone!', te: 'అందరి ముందు కోడి డాన్స్ చేయమని పిల్లలు సవాలు చేస్తున్నారు!' }, play: () => { UI.close(); Emote.play('chicken'); } },
  dance: { story: { en: 'Music is playing at the rachabanda. Dance with the villagers!', te: 'రచ్చబండ దగ్గర పాటలు మోగుతున్నాయి. గ్రామస్తులతో కలిసి డాన్స్ చేయండి!' }, play: () => { UI.close(); Emote.play('dance'); } },
  selfie: { story: { en: 'Your cousin in Hyderabad wants a village selfie. Strike a pose!', te: 'హైదరాబాద్‌లో ఉన్న మీ చుట్టానికి ఊరి సెల్ఫీ కావాలట. ఫోజు ఇవ్వండి!' }, play: () => { UI.close(); Emote.play('selfie'); } },
  holi: { story: { en: 'Holi fun! Throw colours on 3 villagers.', te: 'హోలీ సరదా! ముగ్గురు గ్రామస్తులపై రంగులు చల్లండి.' }, play: () => { UI.close(); Emote.play('holi'); } },
  dog: { story: { en: 'Your dog has waited all day for you. Give it a good pat!', te: 'మీ కుక్క రోజంతా మీ కోసం ఎదురుచూసింది. బాగా నిమరండి!' },
    step: () => { const a = Pet.a; if (!a) return { text: L('Your dog follows you: walk close and pat it.', 'మీ కుక్క మీ వెంటే ఉంది: దగ్గరికి వెళ్ళి నిమరండి.'), icon: 'tap' }; const p = { x: a.x, z: a.z }; return CH.near(p, 3) ? { text: L('Your dog follows you: walk close and pat it.', 'మీ కుక్క మీ వెంటే ఉంది: దగ్గరికి వెళ్ళి నిమరండి.'), icon: 'tap' } : CH.go(p, L('your dog', 'మీ కుక్క')); } },
  shop: { story: { en: "It is little Chinni's birthday. Buy something at Mallesh kirana!", te: 'ఈ రోజు చిన్ని పుట్టినరోజు. మల్లేష్ కిరాణంలో ఏదైనా కొనండి!' },
    step: () => CH.visit('kirana', L('the kirana shop', 'కిరాణం'), L('buy something', 'ఏదైనా కొనండి')) },
  bus: { story: { en: 'Time for a joyride! Take the bus to Nagaram town.', te: 'షికారు సమయం! బస్సులో నగరం పట్టణానికి వెళ్ళండి.' },
    step: () => CH.visit('busV', L('the bus stop', 'బస్ స్టాప్'), L('take the bus to Nagaram', 'నగరానికి బస్సు ఎక్కండి')) },
  talk: { story: { en: 'What is the latest village gossip? Talk to 2 villagers to find out.', te: 'ఊర్లో తాజా ముచ్చట్లు ఏంటి? తెలుసుకోవడానికి ఇద్దరితో మాట్లాడండి.' },
    step: () => { const P = Player.pos(); const n = NPCs.list.filter((q) => q.named && q.h && q.h.visible).sort((a, b) => Math.hypot(a.h.x - P.x, a.h.z - P.z) - Math.hypot(b.h.x - P.x, b.h.z - P.z))[0]; if (n && !CH.near({ x: n.h.x, z: n.h.z }, 3)) return CH.go({ x: n.h.x, z: n.h.z }, LN(n.name)); return { text: L('Walk up to any villager and talk.', 'ఏ గ్రామస్తుడి దగ్గరికైనా వెళ్ళి మాట్లాడండి.'), icon: 'tap' }; } },
  mango: { story: { en: 'They say golden mangoes are hidden around the village. Find one!', te: 'ఊరి చుట్టూ బంగారు మామిడిపండ్లు దాచి ఉన్నాయట. ఒకటి కనిపెట్టండి!' },
    step: () => { const f = Fun.st(), P = Player.pos(); let s = null, bd = 1e9; Fun.spots.forEach((q, i) => { if (f.mangoes.includes(i)) return; const d = Math.hypot(q.x - P.x, q.z - P.z); if (d < bd) { bd = d; s = q; } }); return s ? CH.go(s, L('Golden mango', 'బంగారు మామిడి')) : null; } },
  wheel: { story: { en: 'Feeling lucky? Spin the lucky wheel!', te: 'అదృష్టం పరీక్షిద్దామా? లక్కీ చక్రం తిప్పండి!' }, play: () => Games.wheel() },
  race: { story: { en: 'The village race is on. Win a medal!', te: 'ఊరి పందెం మొదలైంది. పతకం గెలవండి!' }, play: () => Fun.open() },
  place: { story: { en: 'There is more to see. Discover a new place!', te: 'చూడాల్సింది ఇంకా చాలా ఉంది. కొత్త ప్రదేశం కనుక్కోండి!' },
    step: () => { const P = Player.pos(), f = Fun.st(); const p = Map2.places().filter((q) => !f.places[q.id]).sort((a, b) => Math.hypot(a.x - P.x, a.z - P.z) - Math.hypot(b.x - P.x, b.z - P.z))[0]; return p ? CH.go(p, Map2.placeName(p)) : null; } },
};
// the first breaks follow a story: chai after ploughing, the temple after sowing, cricket while the crop grows...
const CHAIN_OPENING = ['chai', 'pray', 'six', 'splash', 'rooster', 'monkey', 'kites', 'fish'];
// farm jobs: whatever the farm needs right now
const CHAIN_FARM = {
  plough: { icon: '🚜', title: { en: 'Plough your field', te: 'మీ పొలాన్ని దున్నండి' }, story: { en: 'The soil is soft after the rain. Time to plough!', te: 'వాన తర్వాత నేల మెత్తగా ఉంది. దున్నే సమయం!' }, reward: 1200 },
  sow: { icon: '🌱', title: { en: 'Sow your field', te: 'పొలంలో విత్తండి' }, story: { en: 'The field is ready. Sow the seeds and pray for rain!', te: 'పొలం సిద్ధం. విత్తనాలు వేసి వాన కోసం ఎదురుచూడండి!' }, reward: 1500 },
  tend: { icon: '🧺', title: { en: 'Feed, weed or spray your crop', te: 'పంటకు ఎరువు, కలుపు లేదా పిచికారీ' }, story: { en: 'Your crop needs some care: water, food or a little weeding.', te: 'మీ పంటకు కాస్త శ్రద్ధ కావాలి: నీరు, ఎరువు లేదా కలుపు తీయడం.' }, reward: 1000 },
  harvest: { icon: '🌾', title: { en: 'Harvest your crop', te: 'పంట కోయండి' }, story: { en: 'The crop has turned golden. Harvest time!', te: 'పంట బంగారు రంగుకు మారింది. కోత సమయం!' }, reward: 2000 },
  sell: { icon: '💰', title: { en: 'Sell your harvest', te: 'పంట అమ్మండి' }, story: { en: 'Your harvest is waiting. Sell it and count the money!', te: 'మీ పంట ఎదురుచూస్తోంది. అమ్మి డబ్బులు లెక్కపెట్టండి!' }, reward: 1500 },
};
const CHAIN_STREAK = 5, CHAIN_STREAK_BONUS = 2500;
// tutorial lessons that are followed by a fun break
const CHAIN_BREAK_AFTER = ['t_plough', 't_sow', 't_fert', 't_sell'];

const Chain = {
  t: 0, waitT: 0,
  st() { const S = G.S; if (!S.chain) S.chain = { n: 0, seq: 0, cur: null, next: 'farm', recent: [], streak: 0, funN: 0 }; return S.chain; },
  cur() { return G.S && G.S.chain ? G.S.chain.cur : null; },
  init() {
    if (!this._bound) {
      this._bound = true;
      const evs = new Set(['work', 'sold']); for (const id in CHAIN_FUN) if (TASK_BY[id]) evs.add(TASK_BY[id].ev);
      for (const ev of evs) Bus.on(ev, (p) => { if (G.started) this.onEvent(ev, p || {}); });
    }
    this.st(); this.waitT = 1.5;
  },
  ok(id) { const t = TASK_BY[id]; return !!t && Tasks.ok(t); },
  // ---- making missions ----
  makeFun(not) {
    const c = this.st();
    let id = null;
    if (c.funN < CHAIN_OPENING.length) { const o = CHAIN_OPENING.slice(c.funN).find((x) => x !== not && this.ok(x)); if (o) id = o; }
    if (!id) {
      const ids = Object.keys(CHAIN_FUN).filter((x) => x !== not && this.ok(x));
      const fresh = ids.filter((x) => !c.recent.includes(x));
      const pool = fresh.length ? fresh : ids; if (!pool.length) return null;
      id = pool[Math.floor(Math.random() * pool.length)];
    }
    const t = TASK_BY[id], D = CHAIN_FUN[id];
    c.funN++;
    return { tpl: 'c_fun', kind: 'fun', id, icon: t.icon, title: { en: t.en, te: t.te }, story: D.story, target: t.n, reward: Math.max(600, t.reward) };
  },
  needsCare(f) { const cd = CROPS[f.crop]; return !!(f.crop && f.sownTiles > 0 && f.growth < 0.97 && (f.outbreak || f.pests > 10 || f.weeds > 16 || f.nut < 40 || (cd && cd.wLo && f.water < cd.wLo && !f.pump && !f.gate))); },
  farmJob() {
    const pf = Fields.playerFields(); if (!pf.length) return null;
    let f = pf.find((q) => q.crop && q.sownTiles > 0 && q.growth >= 0.97);
    if (f) return { job: 'harvest', field: f.id, need: Math.max(4, Math.round(f.sownTiles * 0.7)) };
    if (CH.heapField() || CH.stored() > 0.05) return { job: 'sell' };
    f = pf.find((q) => this.needsCare(q)); if (f) return { job: 'tend', field: f.id };
    f = pf.find((q) => !q.crop && q.countMin(1) < q.n * 0.8); if (f) return { job: 'plough', field: f.id };
    f = CH.freeField(); if (f && f.countMin(3) < f.n * 0.8) return { job: 'sow', field: f.id };
    return null;   // the crops are growing: nothing to do on the farm right now
  },
  makeFarm() {
    const j = this.farmJob(); if (!j) return null;
    const D = CHAIN_FARM[j.job];
    return Object.assign({ tpl: 'c_farm', kind: 'farm', icon: D.icon, title: D.title, story: D.story, target: 1, reward: D.reward }, j);
  },
  start(m) {
    if (!m) return;
    const c = this.st();
    m.uid = 'c' + (++c.seq); m.n = c.n + 1; m.chain = true; m.prog = 0; m.t0 = Time.totalMin();
    c.cur = m;
    Coach.key = ''; UI._mKey = ''; UI.dirty = true;
    Bus.emit('chainNew', { id: m.id || m.job, n: m.n });
  },
  // a tutorial lesson just finished: some fun before the next one
  afterLesson(m) {
    const c = this.st(); if (c.cur || !CHAIN_BREAK_AFTER.includes(m.tpl)) return;
    c.breakDue = true; this.waitT = 2.4;   // the lesson's celebration first, then the fun
  },
  ensure() {
    const c = this.st(); if (c.cur) return;
    const M = G.S.missions;
    if (c.breakDue) { c.breakDue = false; this.start(this.makeFun()); if (!c.cur) Missions.ensure(); return; }
    if (M.tut < TUTORIAL.length) {
      // still learning: a fun break while the crop grows and there is nothing to do
      const tm = M.active.find((m) => m.tpl.startsWith('t_')), st = Coach.step;
      if (tm && st && st.m === tm && st.icon === 'wait' && !Auto.on && Time.totalMin() >= (c.calmUntil || 0)) this.start(this.makeFun());
      return;
    }
    let m = c.next === 'farm' ? this.makeFarm() : null;
    if (!m) m = this.makeFun();
    if (!m) m = this.makeFarm();
    this.start(m);
  },
  // ---- progress ----
  setProg(m, v) { if (Math.abs(v - m.prog) > 0.004) { m.prog = v; UI.dirty = true; } },
  onEvent(ev, p) {
    const m = this.cur(); if (!m) return;
    if (m.kind === 'fun') {
      const t = TASK_BY[m.id]; if (!t || t.ev !== ev) return;
      let a = 0; try { a = t.amt ? t.amt(p) : t.test ? (t.test(p) ? 1 : 0) : 1; } catch (e) { a = 0; }
      if (a <= 0) return;
      m.prog = Math.min(m.target, m.prog + a); UI._mKey = ''; UI.dirty = true;
      if (m.prog >= m.target - 1e-6) this.done(m);
      return;
    }
    if (m.job === 'harvest' && ev === 'work' && p.op === 'harvest' && p.field && p.field.id === m.field && p.by !== 'ai') m.got = (m.got || 0) + (p.n || 0);
    if (m.job === 'sell' && ev === 'sold') { m.prog = 1; this.done(m); }
  },
  check(m) {
    if (m.kind !== 'farm') return;
    const f = m.field ? Fields.byId[m.field] : null;
    if (m.field && (!f || !f.isPlayer)) { this.drop(); return; }
    switch (m.job) {
      case 'plough': { const fr = f.countMin(1) / f.n; this.setProg(m, clamp01(fr / 0.8)); if (fr >= 0.8 || f.crop) this.done(m); break; }
      case 'sow': { const fr = f.countMin(3) / f.n; this.setProg(m, clamp01(fr / 0.8)); if (fr >= 0.8) this.done(m); break; }
      case 'tend': if (!f.crop) this.drop(); else if (!this.needsCare(f)) { m.prog = 1; this.done(m); } break;
      case 'harvest': this.setProg(m, clamp01((m.got || 0) / (m.need || 4))); if ((m.got || 0) >= (m.need || 4) || !f.crop) { m.prog = 1; this.done(m); } break;
      case 'sell': if (!CH.heapField() && CH.stored() <= 0.05 && !CH.growing()) this.drop(); break;
    }
  },
  update(dt) {
    if (!G.started || !G.S || G.S.explore) return;
    this.t += dt; if (this.t < 0.5) return;
    const step = this.t; this.t = 0;
    const m = this.cur();
    if (m) { this.check(m); return; }
    if (this.waitT > 0) { this.waitT -= step; return; }   // a moment to enjoy the last one
    if (UI.modalOpen() || Rest.busy) return;
    this.ensure();
  },
  // ---- finishing ----
  done(m) {
    const c = this.st(); if (!m || c.cur !== m) return;
    c.cur = null; c.n++; c.streak++;
    c.recent.unshift(m.id || m.job); c.recent.length = Math.min(c.recent.length, 6);
    c.next = m.kind === 'farm' ? 'fun' : 'farm';
    Money.add(m.reward, 'mission');
    Celebrate.ribbon({ kind: 'sun', icon: m.icon, top: L(`Mission ${m.n} done!`, `లక్ష్యం ${m.n} పూర్తి!`), title: LN(m.title), sub: '+' + fmtINR(m.reward), ms: 2600 });
    Audio2.sfx('mission');
    if (c.streak % CHAIN_STREAK === 0) setTimeout(() => {
      if (!G.started) return;
      Money.add(CHAIN_STREAK_BONUS, 'mission');
      Celebrate.ribbon({ kind: 'big', icon: '🔥', top: L(`${c.streak} missions in a row!`, `వరుసగా ${c.streak} లక్ష్యాలు!`), title: L('Bonus', 'బోనస్') + ' ' + fmtINR(CHAIN_STREAK_BONUS), sub: L('Keep going!', 'ఇలాగే కొనసాగించండి!'), ms: 3200 });
      Celebrate.shower(120); Audio2.sfx('fanfare');
    }, 2900);
    this.waitT = 0;
    Coach.key = ''; UI._mKey = ''; UI.dirty = true;
    Bus.emit('chainDone', { id: m.id || m.job, n: m.n });
    if (G.S.missions.tut < TUTORIAL.length) Missions.ensure();   // back to the lessons
    else this.ensure();   // and straight on to the next mission
  },
  // the farm job went away (field sold, crop lost...): on to the next one, no reward
  drop() { const c = this.st(); c.cur = null; c.next = 'fun'; this.waitT = 0; Coach.key = ''; UI._mKey = ''; UI.dirty = true; if (G.S.missions.tut < TUTORIAL.length) Missions.ensure(); else this.ensure(); },
  // not this one: a different fun mission instead (during the tutorial: back to the lesson)
  skip() {
    const c = this.st(), m = c.cur; if (!m) return;
    Audio2.sfx('switch');
    c.cur = null; c.recent.unshift(m.id || m.job); c.recent.length = Math.min(c.recent.length, 6);
    Coach.key = ''; UI._mKey = ''; UI.dirty = true;
    if (G.S.missions.tut < TUTORIAL.length) { c.calmUntil = Time.totalMin() + 180; Missions.ensure(); return; }   // back to the lesson, no breaks for 3 game hours
    this.start(this.makeFun(m.id) || this.makeFarm());
  },
  play() {
    const m = this.cur(); if (!m || m.kind !== 'fun') return;
    const D = CHAIN_FUN[m.id]; if (!D || !D.play) return;
    Audio2.unlock(); Audio2.sfx('click');
    try { D.play(); } catch (e) { console.warn('chain play', e); }
  },
  // ---- the coach's one step for the mission ----
  step(m) {
    const P = Player.pos();
    if (m.kind === 'farm') {
      if (G.S.player.mustRest) return { text: isMobile ? L('Rest first: tap 😴 Rest on the card', 'ముందు విశ్రాంతి: కార్డులో 😴 విశ్రాంతి నొక్కండి') : L('Rest first: press R', 'ముందు విశ్రాంతి: R నొక్కండి'), icon: 'wait', act: () => Rest.start() };
      const f = m.field ? Fields.byId[m.field] : null;
      switch (m.job) {
        case 'plough': if (!CH.onField(f)) return CH.goField(f); return { text: CH.hold(L('and walk around the field to plough it', 'పొలమంతా నడిచి దున్నండి')), icon: 'work' };
        case 'sow': return coachSow(f && f.crop || null);
        case 'tend': case 'harvest': return f ? coachGrow(f) : null;
        case 'sell': return coachSell(null, 'trader');
      }
      return null;
    }
    const D = CHAIN_FUN[m.id]; if (!D) return null;
    if (D.step) return D.step(m);
    if (Games.mode) return { text: L('Playing! Use the big round button.', 'ఆడుతున్నారు! పెద్ద గుండ్రటి బటన్ వాడండి.'), icon: 'play' };
    if (D.lake && lakeSD(P.x, P.z) > 12) return CH.go({ x: POI.ghat.x, z: POI.ghat.z }, L('the lake ghat', 'చెరువు ఘాట్'));
    if (D.tree && !Games.monkeyTree(P.x, P.z, 6, 45)) { const t = Games.monkeyTree(P.x, P.z, 0, 1200); if (t) return CH.go({ x: t.x, z: t.z }, L('the big trees', 'పెద్ద చెట్లు')); }
    return { text: L('Tap ▶ Play on this card', 'ఈ కార్డులో ▶ ఆడండి నొక్కండి'), icon: 'play', play: true, act: () => this.play() };
  },
  // ---- the corner card ----
  card(mb, cur, st, tg, tgD, howOpen) {
    const short = innerHeight < 430;   // a phone on its side: only what matters, with ▶ Play always in view
    const play = st && st.play && !Auto.on ? h('button', { class: 'play' + (short ? ' sm' : ''), type: 'button', onclick: (e) => { e.stopPropagation(); this.play(); } }, '▶ ' + L('Play', 'ఆడండి')) : null;
    mb.appendChild(h('div', { class: 'mhead' }, h('h4', { class: 'ch' }, (innerWidth >= 700 ? '🎯 ' : '') + L(`Mission ${cur.n}`, `లక్ష్యం ${cur.n}`)),
      short ? play : null,
      cur.reward ? h('span', { class: 'rw' }, '+' + fmtShortINR(cur.reward)) : null,
      h('button', { class: 'tmin', type: 'button', title: L('Skip this mission', 'ఈ లక్ష్యం దాటవేయి'), 'aria-label': L('Skip this mission', 'ఈ లక్ష్యం దాటవేయి'), onclick: (e) => { e.stopPropagation(); this.skip(); } }, '⏭')));
    mb.appendChild(h('b', { class: 'mt' }, cur.icon + ' ' + LN(cur.title)));
    if (cur.story && !short) mb.appendChild(h('i', { class: 'story' }, LN(cur.story)));
    if (Auto.on) {
      const sp = h('div', { class: 'step auto' }); sp.innerHTML = COACH_ICON[Auto.mode === 'farm' ? 'work' : 'walk'];
      sp.appendChild(h('span', null, Auto.mode === 'farm' ? L(`Working ${Auto.name}…`, `${Auto.name}లో పని చేస్తున్నారు…`) : Auto.name ? L(`Walking to ${Auto.name}…`, `${Auto.name} వైపు నడుస్తున్నారు…`) : L('Walking there…', 'అక్కడికి నడుస్తున్నారు…')));
      mb.appendChild(sp);
    } else if (st) { const sp = h('div', { class: 'step' }); sp.innerHTML = COACH_ICON[st.icon] || COACH_ICON.walk; sp.appendChild(h('span', null, short && st.play ? cur.icon + ' ' + LN(cur.title) : st.text)); mb.appendChild(sp); }
    if (tg && !tg.wp && tg.m === cur && !short) mb.appendChild(h('span', { class: 'go' }, `➜ ${tg.name ? tg.name + ' · ' : ''}${Map2.fmtDist(tgD)}`));
    const row = h('div', { class: 'mrow' });
    if (play && !short) row.appendChild(play);
    else if (st && !Auto.on && !st.play) row.appendChild(h('button', { class: 'how' + (howOpen ? ' on' : ''), type: 'button', onclick: (e) => { e.stopPropagation(); UI.howOpen = !howOpen; UI.howUntil = 0; Audio2.sfx('click'); UI.dirty = true; } }, howOpen ? L('Hide tips', 'చిట్కాలు దాచు') : L('How? ❓', 'ఎలా? ❓')));
    row.appendChild(h('div', { class: 'prog' }, h('b', { style: { width: (clamp01(cur.prog / cur.target) * 100).toFixed(0) + '%' } })));
    if (cur.target > 1) row.appendChild(h('em', { class: 'cnt' }, `${Math.floor(cur.prog + 1e-6)}/${cur.target}`));
    mb.appendChild(row);
    if (st && (Settings.v.helper || Auto.on) && cur.kind === 'farm') mb.appendChild(h('button', { class: 'do' + (Auto.on ? ' stop' : ''), type: 'button', onclick: (e) => { e.stopPropagation(); if (Auto.on) Auto.stop(true); else Auto.doStep(); } }, Auto.on ? L('■ Stop', '■ ఆపు') : L('▶ Do it for me', '▶ నా బదులు చేయి')));
    // today's tasks still count in the background
    const tc = Tasks.count(); if (!short) mb.appendChild(h('small', { class: 'tday' }, '📋 ' + L("Today's tasks", 'ఈ రోజు పనులు') + ` ${tc.d}/${tc.n}`));
  },
};
