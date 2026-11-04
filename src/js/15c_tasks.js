// ============================================================================
// Today's tasks: a fresh list of small things to do every day (farm, village, fun and
// exploring), each with a reward and a bonus for finishing them all. The corner card shows
// these instead of pushing "go to your field and work" all day long; the bigger farm goals
// stay in the list too, and the gold arrow guides you only when you ask ("Guide me").
// Rest: after about 4 hours of work the farmer has to rest for 3 to 5 hours.
// ============================================================================
const TASK_POOL = [
  // ---- farm (only when it makes sense right now) ----
  { id: 'plough', cat: 'farm', icon: '🚜', en: 'Plough part of your field', te: 'పొలంలో కొంత దున్నండి', ev: 'work', amt: (p) => (p.by === 'player' && p.op === 'plough' ? p.n : 0), n: 20, reward: 800,
    can: () => Fields.playerFields().some((f) => !f.crop && f.countMin(1) < f.n * 0.8), go: () => Tasks.field((f) => !f.crop) },
  { id: 'sow', cat: 'farm', icon: '🌱', en: 'Sow seeds on your field', te: 'పొలంలో విత్తనాలు వేయండి', ev: 'work', amt: (p) => (p.by === 'player' && p.op === 'sow' ? p.n : 0), n: 20, reward: 900,
    can: () => Fields.playerFields().some((f) => !f.crop || f.sownTiles < f.n * 0.9), go: () => Tasks.field((f) => !f.crop || f.sownTiles < f.n * 0.9) },
  { id: 'tend', cat: 'farm', icon: '🧺', en: 'Feed, weed or spray your crop', te: 'పంటకు ఎరువు, కలుపు లేదా పిచికారీ', ev: 'work', amt: (p) => (p.by === 'player' && (p.op === 'fertilize' || p.op === 'weed' || p.op === 'spray') ? p.n : 0), n: 12, reward: 800,
    can: () => Fields.playerFields().some((f) => f.crop && f.growth < 0.9), go: () => Tasks.field((f) => f.crop && f.growth < 0.9) },
  { id: 'harvest', cat: 'farm', icon: '🌾', en: 'Harvest 1 quintal', te: '1 క్వింటాల్ కోయండి', ev: 'harvestTile', amt: (p) => p.qty || 0, n: 1, reward: 1000,
    can: () => Fields.playerFields().some((f) => f.crop && f.growth >= 0.85), go: () => Tasks.field((f) => f.crop && f.growth >= 0.85) },
  { id: 'sell', cat: 'farm', icon: '💰', en: 'Sell some of your harvest', te: 'కొంత పంట అమ్మండి', ev: 'sold', n: 1, reward: 800,
    can: () => Fields.playerFields().some((f) => f.heap && f.heap.qty > 0.05) || G.S.storage.some((e) => e.qty > 0.05), go: () => { const f = Fields.playerFields().find((q) => q.heap && q.heap.qty > 0.05 && q.heapSpot); if (f) Tasks.point(f.heapSpot.x, f.heapSpot.z, L('Harvest heap', 'పంట కుప్ప')); else Tasks.show('yardSell'); } },
  // ---- village ----
  { id: 'chai', cat: 'village', icon: '☕', en: 'Drink chai at the tea stall', te: 'టీ స్టాల్‌లో చాయ్ తాగండి', ev: 'eat', n: 1, reward: 300, go: () => Tasks.show('tea') },
  { id: 'pray', cat: 'village', icon: '🛕', en: 'Pray at the temple', te: 'గుడిలో దండం పెట్టండి', ev: 'pray', n: 1, reward: 300, go: () => Tasks.show('temple') },
  { id: 'talk', cat: 'village', icon: '💬', en: 'Talk to 2 villagers', te: 'ఇద్దరు గ్రామస్తులతో మాట్లాడండి', ev: 'talk', n: 2, reward: 500,
    go: () => { UI.close(); UI.toast(L('Walk up to any villager and talk.', 'ఏ గ్రామస్తుడి దగ్గరికైనా వెళ్ళి మాట్లాడండి.'), 'info'); } },
  { id: 'dog', cat: 'village', icon: '🐕', en: 'Pat your dog', te: 'మీ కుక్కను నిమరండి', ev: 'pat', n: 1, reward: 300, can: () => !!G.S.pet,
    go: () => { UI.close(); UI.toast(L('Your dog follows you: walk close and pat it.', 'మీ కుక్క మీ వెంటే ఉంది: దగ్గరికి వెళ్ళి నిమరండి.'), 'info'); } },
  { id: 'shop', cat: 'village', icon: '🛒', en: 'Buy something at a shop', te: 'దుకాణంలో ఏదైనా కొనండి', ev: 'bought', n: 1, reward: 300, go: () => Tasks.show('kirana') },
  { id: 'bus', cat: 'village', icon: '🚌', en: 'Ride the bus', te: 'బస్సు ఎక్కండి', ev: 'bus', n: 1, reward: 500, go: () => Tasks.show('busV') },
  // ---- fun ----
  { id: 'six', cat: 'fun', grp: 'cricket', icon: '🏏', en: 'Hit a SIX in gully cricket', te: 'వీధి క్రికెట్‌లో సిక్స్ కొట్టండి', ev: 'cricketShot', test: (p) => p.kind === 6, n: 1, reward: 700, go: () => Games.cricketStart() },
  { id: 'runs', cat: 'fun', grp: 'cricket', icon: '🏏', en: 'Score 15 runs in one innings', te: 'ఒక ఇన్నింగ్స్‌లో 15 పరుగులు చేయండి', ev: 'cricketEnd', test: (p) => p.runs >= 15, n: 1, reward: 1000, go: () => Games.cricketStart() },
  { id: 'kites', cat: 'fun', icon: '🪁', en: 'Cut 2 kites', te: '2 గాలిపటాలు తెంపండి', ev: 'kiteCut', n: 2, reward: 600, go: () => Games.kiteStart() },
  { id: 'fish', cat: 'fun', icon: '🎣', en: 'Catch 2 fish', te: '2 చేపలు పట్టండి', ev: 'fishCaught', n: 2, reward: 600, go: () => Games.fishStart() },
  { id: 'holi', cat: 'fun', icon: '🎨', en: 'Colour 3 villagers at Holi', te: 'హోలీలో 3 మందికి రంగులు చల్లండి', ev: 'holi', amt: (p) => p.n || 0, n: 3, reward: 500, go: () => { UI.close(); Emote.play('holi'); } },
  { id: 'dance', cat: 'fun', grp: 'move', icon: '💃', en: 'Dance with the villagers', te: 'గ్రామస్తులతో డాన్స్ చేయండి', ev: 'emote', test: (p) => p.id === 'dance' || p.id === 'folk', n: 1, reward: 300, go: () => { UI.close(); Emote.play('dance'); } },
  { id: 'chicken', cat: 'fun', grp: 'move', icon: '🐔', en: 'Do the chicken dance', te: 'కోడి డాన్స్ చేయండి', ev: 'emote', test: (p) => p.id === 'chicken', n: 1, reward: 300, go: () => { UI.close(); Emote.play('chicken'); } },
  { id: 'selfie', cat: 'fun', grp: 'move', icon: '🤳', en: 'Take a selfie', te: 'సెల్ఫీ తీసుకోండి', ev: 'emote', test: (p) => p.id === 'selfie', n: 1, reward: 300, go: () => { UI.close(); Emote.play('selfie'); } },
  { id: 'mango', cat: 'fun', icon: '🥭', en: 'Find a golden mango', te: 'బంగారు మామిడి కనుక్కోండి', ev: 'mango', n: 1, reward: 700, can: () => Fun.st().mangoes.length < Fun.spots.length, go: () => Fun.nearestMango() },
  { id: 'race', cat: 'fun', icon: '🏁', en: 'Win a race medal', te: 'పందెంలో పతకం గెలవండి', ev: 'raceEnd', test: (p) => !!p.medal, n: 1, reward: 1000, go: () => Fun.open() },
  { id: 'wheel', cat: 'fun', icon: '🎡', en: 'Spin the lucky wheel', te: 'లక్కీ చక్రం తిప్పండి', ev: 'wheelSpin', n: 1, reward: 200, can: () => Games.canSpin(), go: () => Games.wheel() },
  { id: 'rooster', cat: 'fun', icon: '🐓', en: 'Catch the runaway rooster', te: 'పారిపోయిన కోడిపుంజును పట్టుకోండి', ev: 'rooster', n: 1, reward: 600, go: () => Games.roosterStart() },
  { id: 'monkey', cat: 'fun', icon: '🐒', en: 'Get your things back from the monkey', te: 'కోతి నుంచి మీ వస్తువు తిరిగి తెచ్చుకోండి', ev: 'monkey', n: 1, reward: 500, go: () => Games.monkeyStart(false) },
  { id: 'splash', cat: 'fun', icon: '💦', en: 'Jump into the lake', te: 'చెరువులో దూకండి', ev: 'splash', n: 1, reward: 500, go: () => Games.jumpStart() },
  // ---- explore ----
  { id: 'place', cat: 'explore', icon: '📍', en: 'Discover a new place', te: 'కొత్త ప్రదేశం కనుక్కోండి', ev: 'discover', n: 1, reward: 500,
    can: () => Map2.places().some((p) => !Fun.st().places[p.id]), go: () => { const P = Player.pos(), f = Fun.st(); const p = Map2.places().filter((q) => !f.places[q.id]).sort((a, b) => Math.hypot(a.x - P.x, a.z - P.z) - Math.hypot(b.x - P.x, b.z - P.z))[0]; if (p) Tasks.point(p.x, p.z, Map2.placeName(p)); } },
  { id: 'heli', cat: 'explore', grp: 'ride', icon: '🚁', en: 'Fly the helicopter', te: 'హెలికాప్టర్ నడపండి', ev: 'ride', test: (p) => p.type === 'heli', n: 1, reward: 500, can: () => Vehicles.player.some((v) => v.type === 'heli'), go: () => Tasks.vehicle('heli') },
  { id: 'jeep', cat: 'explore', grp: 'ride', icon: '🚙', en: 'Take the jeep for a drive', te: 'జీపులో షికారు చేయండి', ev: 'ride', test: (p) => p.type === 'jeep', n: 1, reward: 300, can: () => Vehicles.player.some((v) => v.type === 'jeep'), go: () => Tasks.vehicle('jeep') },
  { id: 'auto', cat: 'explore', grp: 'ride', icon: '🛺', en: 'Ride an auto rickshaw', te: 'ఆటోలో తిరగండి', ev: 'ride', test: (p) => p.type === 'autorick', n: 1, reward: 300, can: () => Vehicles.player.some((v) => v.type === 'autorick'), go: () => Tasks.vehicle('autorick') },
];
const TASK_BY = Object.fromEntries(TASK_POOL.map((t) => [t.id, t]));
const TASK_BONUS = 3000;

const Tasks = {
  st() { const S = G.S; if (!S.tasks || S.tasks.day !== Time.day()) this.newDay(); return S.tasks; },
  init() {
    if (!this._bound) {
      this._bound = true;
      for (const ev of [...new Set(TASK_POOL.map((t) => t.ev))]) Bus.on(ev, (p) => { if (G.started) this.onEvent(ev, p || {}); });
    }
    this.st();
  },
  ok(t) { try { return !t.can || !!t.can(); } catch (e) { return false; } },
  // five a day: one farm job (when there is one), one in the village, two fun things and one trip
  newDay() {
    const S = G.S, had = !!S.tasks;
    const used = new Set(), list = [];
    const take = (cat, n) => {
      const c = TASK_POOL.filter((t) => t.cat === cat && !list.includes(t) && !(t.grp && used.has(t.grp)) && this.ok(t)).sort(() => Math.random() - 0.5);
      for (const t of c.slice(0, n)) { list.push(t); if (t.grp) used.add(t.grp); }
    };
    take('farm', 1); take('village', 1); take('fun', 2); take('explore', 1);
    if (list.length < 5) take('fun', 5 - list.length);
    S.tasks = { day: Time.day(), list: list.map((t) => ({ id: t.id, prog: 0, done: false })), bonus: false, swaps: 1 };
    if (had && G.started) UI.toast(L('New tasks for today!', 'ఈ రోజుకు కొత్త పనులు!') + ' 📋', 'mission');
    UI._mKey = ''; UI.dirty = true;
  },
  onEvent(ev, p) {
    const T = this.st();
    for (const e of T.list) {
      const t = TASK_BY[e.id]; if (!t || e.done || t.ev !== ev) continue;
      let a = 0; try { a = t.amt ? t.amt(p) : t.test ? (t.test(p) ? 1 : 0) : 1; } catch (er) { a = 0; }
      if (a <= 0) continue;
      e.prog = Math.min(t.n, e.prog + a);
      if (e.prog >= t.n - 1e-6) this.done(e, t);
      UI._mKey = ''; UI.dirty = true;
    }
  },
  done(e, t) {
    e.done = true; UI._mKey = ''; UI.dirty = true;
    Money.add(t.reward, 'task');
    Celebrate.ribbon({ kind: 'sun', icon: t.icon, top: L('Task done!', 'పని పూర్తి!'), title: LN(t), sub: '+' + fmtINR(t.reward), ms: 2400 });
    Audio2.sfx('mission');
    const T = G.S.tasks;
    if (!T.bonus && T.list.every((q) => q.done)) {
      T.bonus = true; Money.add(TASK_BONUS, 'task');
      Celebrate.ribbon({ kind: 'big', icon: '🎁', top: L("All of today's tasks done!", 'ఈ రోజు పనులన్నీ పూర్తి!'), title: L('Bonus', 'బోనస్') + ' ' + fmtINR(TASK_BONUS), sub: L('New tasks come every morning.', 'ప్రతి ఉదయం కొత్త పనులు వస్తాయి.'), ms: 3400 });
      Celebrate.shower(140); Audio2.sfx('fanfare');
    }
    Bus.emit('taskDone', { id: t.id });
  },
  // one free swap a day for a task you do not fancy
  swap(i) {
    const T = this.st(); const e = T.list[i]; if (!e || e.done || T.swaps < 1) return;
    const have = new Set(T.list.map((q) => q.id)), grps = new Set(T.list.map((q) => TASK_BY[q.id] && TASK_BY[q.id].grp).filter(Boolean));
    const c = TASK_POOL.filter((t) => !have.has(t.id) && !(t.grp && grps.has(t.grp)) && this.ok(t));
    if (!c.length) return;
    const t = pick(c); T.list[i] = { id: t.id, prog: 0, done: false }; T.swaps--;
    Audio2.sfx('switch'); UI._mKey = ''; UI.dirty = true;
  },
  go(e) {
    const t = TASK_BY[e.id]; if (!t || !t.go) return;
    Audio2.sfx('click');
    try { t.go(); } catch (er) { console.warn('task go', er); }
  },
  // "Show me": the gold arrow points there
  point(x, z, name) { G.S.waypoint = { x, z, name }; UI.close(); UI.toast(L('Follow the gold arrow!', 'బంగారు బాణాన్ని అనుసరించండి!'), 'info'); UI.dirty = true; },
  show(id) { const p = Map2.places().find((q) => q.id === id); if (p) this.point(p.x, p.z, Map2.placeName(p)); },
  field(pred) {
    const P = Player.pos(); const f = Fields.playerFields().filter((q) => { try { return pred(q); } catch (e) { return false; } }).sort((a, b) => Math.hypot(a.x - P.x, a.z - P.z) - Math.hypot(b.x - P.x, b.z - P.z))[0];
    if (f) this.point(f.x, f.z, f.label());
  },
  vehicle(type) { const v = Vehicles.player.find((q) => q.type === type); if (v) this.point(v.x, v.z, LN(v.def)); },
  count() { const T = this.st(); return { d: T.list.filter((e) => e.done).length, n: T.list.length }; },
  // ---- the corner card when no tutorial step or followed goal is shown ----
  card(mb) {
    const T = this.st(), c = this.count(), S = G.S;
    const mini = !!Settings.v.taskMini;
    const head = h('div', { class: 'mhead' }, h('h4', { class: 'th' }, '📋 ' + L("Today's tasks", 'ఈ రోజు పనులు') + ` · ${c.d}/${c.n}`),
      h('button', { class: 'tmin', type: 'button', 'aria-label': mini ? L('Show tasks', 'పనులు చూపించు') : L('Hide tasks', 'పనులు దాచు'), onclick: (e) => { e.stopPropagation(); Settings.v.taskMini = !mini; Settings.save(); UI._mKey = ''; UI.dirty = true; Audio2.sfx('click'); } }, mini ? '▾' : '–'));
    mb.appendChild(head);
    if (mini) return;
    const urgent = S.missions.active.filter((m) => m.special);
    for (const m of urgent.slice(0, 1)) mb.appendChild(h('div', { class: 'trow warn' }, h('i', null, '⚠️'), h('span', null, LN(m.title))));
    const open = T.list.filter((e) => !e.done), max = innerHeight < 450 ? 2 : 3;
    for (const e of open.slice(0, max)) {
      const t = TASK_BY[e.id]; if (!t) continue;
      mb.appendChild(h('div', { class: 'trow' }, h('i', null, t.icon), h('span', null, LN(t)), t.n > 1 ? h('em', null, `${Math.floor(e.prog + 1e-6)}/${t.n}`) : null));
    }
    if (!open.length) mb.appendChild(h('div', { class: 'trow ok' }, h('i', null, '✅'), h('span', null, L('All done! New tasks tomorrow.', 'అన్నీ పూర్తి! రేపు కొత్త పనులు.'))));
    else if (!T.bonus) mb.appendChild(h('small', { class: 'tbonus' }, '🎁 ' + L('Finish all for a bonus of', 'అన్నీ చేస్తే బోనస్') + ' ' + fmtINR(TASK_BONUS)));
  },
  // ---- the full list: today's tasks, farm goals and the tutorial ----
  open() {
    Fun.bar(false);
    UI.sheet({ title: L("Today's tasks", 'ఈ రోజు పనులు'), sub: L(`Day ${Time.day()} · finish all for a bonus of ${fmtINR(TASK_BONUS)}`, `రోజు ${Time.day()} · అన్నీ చేస్తే ${fmtINR(TASK_BONUS)} బోనస్`), narrow: true, kind: 'tasks', render: (b) => {
      const T = this.st(), S = G.S;
      // the mission on the corner card comes first
      const cm = Chain.cur();
      if (cm) {
        const st = Coach.step && Coach.step.m === cm ? Coach.step : null;
        const r = h('div', { class: 'row' });
        if (st && st.play) r.appendChild(UI.btn('▶ ' + L('Play', 'ఆడండి'), () => { UI.close(); Chain.play(); }, 'acc sm'));
        else if (st && st.target) r.appendChild(UI.btn(L('Go', 'వెళ్దాం') + ' ➜', () => { UI.close(); Auto.doStep(); }, 'acc sm'));
        r.appendChild(UI.btn('⏭ ' + L('Skip this mission', 'ఈ లక్ష్యం దాటవేయి'), () => { Chain.skip(); UI.rerender(); }, 'alt sm'));
        b.appendChild(h('div', { class: 'act task' }, h('div', { class: 'row', style: { justifyContent: 'space-between', flexWrap: 'nowrap' } }, h('b', null, '🎯 ' + L(`Mission ${cm.n}`, `లక్ష్యం ${cm.n}`) + ': ' + cm.icon + ' ' + LN(cm.title)), h('span', { class: 'chip good' }, '+' + fmtINR(cm.reward))),
          cm.story ? h('p', { class: 'empty', style: { textAlign: 'left', padding: '2px 0', fontStyle: 'italic' } }, LN(cm.story)) : null,
          h('div', { class: 'prog' }, h('b', { style: { width: Math.round(clamp01(cm.prog / cm.target) * 100) + '%' } })), r));
        b.appendChild(h('div', { class: 'sec' }, L("Today's tasks", 'ఈ రోజు పనులు')));
      }
      T.list.forEach((e, i) => {
        const t = TASK_BY[e.id]; if (!t) return;
        const row = h('div', { class: 'act task' + (e.done ? ' done' : '') },
          h('div', { class: 'row', style: { justifyContent: 'space-between', flexWrap: 'nowrap' } },
            h('b', null, (e.done ? '✅ ' : t.icon + ' ') + LN(t)), h('span', { class: 'chip good' }, '+' + fmtINR(t.reward))));
        if (!e.done) {
          if (t.n > 1) row.appendChild(h('div', { class: 'prog' }, h('b', { style: { width: Math.round(clamp01(e.prog / t.n) * 100) + '%' } })));
          const r = h('div', { class: 'row' });
          if (t.go) r.appendChild(UI.btn(L('Go', 'వెళ్దాం') + ' ➜', () => this.go(e), 'acc sm'));
          if (T.swaps > 0) r.appendChild(UI.btn('🔄 ' + L('Swap', 'మార్చు'), () => this.swap(i), 'alt sm'));
          row.appendChild(r);
        }
        b.appendChild(row);
      });
      b.appendChild(h('p', { class: 'empty', style: { padding: '4px 0 0' } }, T.bonus ? '🎁 ' + L('Bonus collected. New tasks come every morning.', 'బోనస్ అందింది. ప్రతి ఉదయం కొత్త పనులు వస్తాయి.') : L('One free swap a day. New tasks come every morning.', 'రోజుకు ఒకసారి ఉచితంగా మార్చుకోవచ్చు. ప్రతి ఉదయం కొత్త పనులు వస్తాయి.')));
      // the tutorial, if it is still running
      const tut = S.missions.active.find((m) => m.tpl.startsWith('t_'));
      if (tut) {
        b.appendChild(h('div', { class: 'sec' }, L('Tutorial', 'శిక్షణ') + ` · ${Math.min(TUTORIAL.length, S.missions.tut + 1)}/${TUTORIAL.length}`));
        b.appendChild(h('div', { class: 'act' }, h('b', null, LN(tut.title)), h('div', { class: 'row' }, UI.btn(L('Skip tutorial', 'శిక్షణ దాటవేయి'), () => this.skipTutorial(), 'alt sm'))));
      }
      // bigger farm goals: guided only when you ask
      const goals = Missions.ordered().filter((m) => !m.tpl.startsWith('t_'));
      if (goals.length) {
        b.appendChild(h('div', { class: 'sec' }, L('Farm goals', 'వ్యవసాయ లక్ష్యాలు')));
        for (const m of goals) {
          const on = S.missions.focus === m.uid;
          b.appendChild(h('div', { class: 'act' }, h('div', { class: 'row', style: { justifyContent: 'space-between', flexWrap: 'nowrap' } }, h('b', null, (m.special ? '⚠️ ' : '') + LN(m.title)), m.reward ? h('span', { class: 'chip good' }, '+' + fmtShortINR(m.reward)) : null),
            h('div', { class: 'prog' }, h('b', { style: { width: Math.round(clamp01(m.prog / m.target) * 100) + '%' } })),
            h('div', { class: 'row' }, on ? UI.btn(L('Stop guiding', 'దారి చూపడం ఆపు'), () => Coach.follow(null), 'alt sm') : UI.btn('🧭 ' + L('Guide me', 'దారి చూపించు'), () => { Coach.follow(m); UI.close(); }, 'acc sm'))));
        }
      }
    } });
  },
  skipTutorial() {
    const M = G.S.missions;
    M.active = M.active.filter((m) => !m.tpl.startsWith('t_')); M.tut = TUTORIAL.length;
    if (M.focus && !M.active.some((m) => m.uid === M.focus)) M.focus = null;
    Missions.ensure(); Coach.key = ''; UI._mKey = ''; UI.dirty = true;
    UI.close(); UI.toast(L('Tutorial skipped. Here comes your first mission!', 'శిక్షణ దాటవేశారు. ఇదిగో మీ మొదటి లక్ష్యం!'), 'good');
  },
};

// ---------- compulsory rest ----------
const Rest = {
  WORK_H: 4, lastWork: -9, nagT: -99,
  init() {
    if (this._bound) return; this._bound = true;
    Bus.on('work', (p) => { if (p && p.by === 'player') this.lastWork = G.t; });
    Bus.on('sleep', (p) => this.rested(p && p.night ? 24 : 2));
  },
  P() { const P = G.S.player; if (typeof P.workMin !== 'number') P.workMin = 0; return P; },
  limit() { return this.WORK_H * 60 * (G.S.easy ? 1.25 : 1); },
  hoursNeeded() { const P = this.P(); return clamp(3 + (P.energy < 60 ? 1 : 0) + (P.energy < 30 || Weather.cur.id === 'heatwave' ? 1 : 0), 3, 5); },
  update(dt) {
    if (!G.started || G.S.explore) return;
    const P = this.P();
    if (P.mustRest) return;
    if (G.t - this.lastWork < 0.5) {
      P.workMin += dt * (60 / GAME_SEC_PER_HOUR) * Time.scale;
      const lim = this.limit();
      if (P.workMin >= lim) this.need();
      else if (P.workMin >= lim - 30 && !P.restWarned) { P.restWarned = true; UI.toast(L('You have worked for hours. Half an hour more, then you must rest.', 'గంటల తరబడి పని చేశారు. ఇంకో అరగంట తర్వాత తప్పకుండా విశ్రాంతి తీసుకోవాలి.'), 'warn'); }
    }
    if (P.energy <= 0.5) this.need();
  },
  need() {
    const P = this.P(); if (P.mustRest) return;
    P.mustRest = true; P.restH = this.hoursNeeded();
    if (Auto.on) Auto.stop(false);
    Audio2.sfx('yawn');
    Celebrate.ribbon({ kind: 'sun', icon: '😴', top: L('Compulsory rest', 'తప్పనిసరి విశ్రాంతి'), title: L(`Rest for ${P.restH} hours`, `${P.restH} గంటలు విశ్రాంతి తీసుకోండి`), sub: L('You worked hard. No more work until you rest.', 'బాగా కష్టపడ్డారు. విశ్రాంతి తీసుకునే వరకు పని లేదు.'), ms: 3400 });
    UI._mKey = ''; UI.dirty = true;
    if (isMobile) UI.updateTouchLabels();
    Bus.emit('mustRest', { h: P.restH });
  },
  // tried to work while too tired: a short reminder, not too often
  nag() {
    if (G.t - this.nagT < 6) return; this.nagT = G.t;
    UI.toast(isMobile ? L('Too tired to work! Tap 😴 Rest first.', 'పని చేయలేనంత అలసట! ముందు 😴 విశ్రాంతి నొక్కండి.') : L('Too tired to work! Press R to rest first.', 'పని చేయలేనంత అలసట! ముందు విశ్రాంతికి R నొక్కండి.'), 'warn');
    Audio2.sfx('yawn');
  },
  start() {
    const P = this.P(); if (this.busy) return;
    const v = Player.vehicle;
    if (v) { if (v.def.fly && v.alt > 0.3) { UI.toast(L('Land the helicopter first.', 'ముందు హెలికాప్టర్ దించండి.'), 'warn'); return; } Player.exitVehicle(true); if (Player.vehicle) return; }
    if (Games.mode) Games.stop();
    if (UI.modalOpen()) UI.close();
    const hrs = P.mustRest ? (P.restH || 3) : 3;
    const home = Math.hypot(Player.x - (HOME.x + 8), Player.z - HOME.z) < 30;
    this.busy = true;
    Player.em = { id: 'sleep', t: 0, hop: 0, snapped: false };   // lie down for a moment, then the hours pass
    Audio2.sfx('yawn'); setTimeout(() => Audio2.sfx('snore'), 800);
    setTimeout(() => {
      UI.fade(() => {
        try {
          const d0 = Time.day();
          Sim.advance(hrs * 60);
          const k = home ? HOUSE_LEVELS[G.S.houseLevel].rest : 1;
          P.energy = Math.min(100, P.energy + hrs * 16 * k); P.health = Math.min(100, P.health + hrs * 3 * k);
          this.rested(hrs);
          if (Player.em && Player.em.id === 'sleep') Player.em = null;
          if (Time.day() !== d0) { P.energy = 100; Celebrate.morning(true); }
          else UI.toast(L(`You rested for ${hrs} hours. Ready to work again!`, `${hrs} గంటలు విశ్రాంతి తీసుకున్నారు. మళ్ళీ పనికి సిద్ధం!`), 'good');
          Audio2.sfx('ready'); SaveSys.save(false);
          Bus.emit('rest', { h: hrs });
        } finally { this.busy = false; }
      }, L(`Resting for ${hrs} hours…`, `${hrs} గంటలు విశ్రాంతి…`));
    }, 1300);
  },
  // any rest of 3 hours or more (or a night) clears the tiredness
  rested(hrs) {
    const P = this.P();
    if (hrs >= 3) { P.workMin = 0; P.mustRest = false; P.restWarned = false; }
    else P.workMin = Math.max(0, P.workMin - hrs * 60);
    UI._mKey = ''; UI.dirty = true;
    if (isMobile && G.started) UI.updateTouchLabels();
  },
};
