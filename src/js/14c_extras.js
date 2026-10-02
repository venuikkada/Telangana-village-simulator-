// ============================================================================
// Extras: a daily gift, trophies, a pet dog that follows you, photos you can
// share, an easy mode and a first-time "how to play" card. Small things that
// make the game friendlier and give players a reason to come back every day.
// ============================================================================
const ymd = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

// ---------------- daily gift: 7 days, bigger every day you come back ----------------
const DailyGift = {
  REWARDS: [
    { money: 1000 },
    { items: { urea: 2, dap: 1 } },
    { seeds: 1 },
    { money: 2500 },
    { items: { pesticide: 2, feed: 1 } },
    { money: 5000 },
    { money: 10000, big: true },
  ],
  state() { const S = G.S; if (!S.daily) S.daily = { last: null, streak: 0 }; return S.daily; },
  today() { return ymd(new Date()); },
  due() { return this.state().last !== this.today(); },
  // the gift day you get now: the next one if you came yesterday, else back to day 1
  next() { const D = this.state(); const y = new Date(); y.setDate(y.getDate() - 1); return D.last === ymd(y) ? (D.streak % 7) + 1 : 1; },
  seedCrop() { const s = Time.season(); return ['paddy', 'maize', 'groundnut', 'cotton'].sort((a, b) => CROPS[b].season[s] - CROPS[a].season[s])[0]; },
  short(r) {
    if (r.money) return fmtINR(r.money);
    if (r.seeds) return L(`${LN(CROPS[this.seedCrop()])} seeds`, `${LN(CROPS[this.seedCrop()])} విత్తనాలు`);
    return Object.keys(r.items).map((k) => `${r.items[k]} ${LN(ITEMS[k])}`).join(' + ');
  },
  icon(r) { return r.big ? '💰' : r.money ? '🪙' : r.seeds ? '🌱' : '🎒'; },
  give(r) {
    if (r.money) Money.add(r.money, 'gift');
    if (r.items) for (const k in r.items) Inv.add(k, r.items[k]);
    if (r.seeds) Inv.add('seed_' + this.seedCrop(), r.seeds);
  },
  // shown once a day, after the tutorial, when nothing else is on screen
  check() {
    if (window.__tvsNoPopups || !G.started || UI.modalOpen() || UI.photoMode || Auto.on || Player.vehicle) return;
    if (G.S.missions.tut < TUTORIAL.length || !this.due()) return;
    this.show();
  },
  show() {
    const n = this.next();
    UI.sheet({ title: L('Daily gift 🎁', 'రోజువారీ బహుమతి 🎁'), sub: L(`Day ${n} of 7 · come back every day for a bigger gift`, `7లో ${n}వ రోజు · రోజూ రండి, బహుమతి పెరుగుతుంది`), narrow: true, cls: 'gsheet', kind: 'gift',
      onClose: () => this.claim(n, true),   // closing the card still gives the gift
      render: (b) => {
        const g = h('div', { class: 'gifts' });
        this.REWARDS.forEach((r, i) => g.appendChild(h('div', { class: 'gift' + (i + 1 < n ? ' got' : i + 1 === n ? ' now' : '') },
          h('small', null, L('Day ', 'రోజు ') + (i + 1)), h('b', null, i + 1 < n ? '✓' : this.icon(r)), h('span', null, this.short(r)))));
        b.appendChild(g);
        b.appendChild(h('div', { class: 'row', style: { justifyContent: 'center', marginTop: '14px' } },
          h('button', { class: 'btn acc big', type: 'button', onclick: () => this.claim(n) }, L('Collect ', 'తీసుకోండి ') + this.short(this.REWARDS[n - 1]))));
      } });
    Audio2.sfx('ready');
  },
  claim(n, fromClose) {
    if (!this.due()) return;
    const D = this.state(); const r = this.REWARDS[n - 1];
    const btn = document.querySelector('#modal .btn.acc.big'); const br = btn ? btn.getBoundingClientRect() : null;
    D.last = this.today(); D.streak = n; D.total = (D.total || 0) + 1;
    this.give(r);
    if (!fromClose) UI.close();
    Celebrate.gift(br && br.width ? br.left + br.width / 2 : innerWidth / 2, br && br.width ? br.top : innerHeight / 2, r);
    Audio2.sfx('cash');
    UI.toast(L(`Gift collected: ${this.short(r)}. Come back tomorrow for the Day ${n % 7 + 1} gift!`, `బహుమతి వచ్చింది: ${this.short(r)}. రేపు రండి, ${n % 7 + 1}వ రోజు బహుమతి మీకోసం!`), 'good');
    SaveSys.save(false);
  },
};

// ---------------- trophies ----------------
const TROPHIES = [
  { id: 'sow', icon: '🌱', en: 'First seeds', te: 'మొదటి విత్తనాలు', how: { en: 'Sow your first crop', te: 'మొదటి పంట విత్తండి' }, reward: 500, ok: (S) => S.stats.harvestQ > 0 || Fields.playerFields().some((f) => f.crop && f.sownTiles > 0) },
  { id: 'harvest', icon: '🌾', en: 'First harvest', te: 'మొదటి కోత', how: { en: 'Harvest a crop', te: 'ఒక పంట కోయండి' }, reward: 1000, ok: (S) => S.stats.harvestQ > 0 },
  { id: 'sale', icon: '🤝', en: 'First sale', te: 'మొదటి అమ్మకం', how: { en: 'Sell your crop', te: 'మీ పంట అమ్మండి' }, reward: 1000, ok: (S) => S.stats.cropIncome > 0 },
  { id: 'worker', icon: '👷', en: 'The boss', te: 'యజమాని', how: { en: 'Hire a worker', te: 'ఒక కూలీని పెట్టుకోండి' }, reward: 1000, ok: (S) => S.workers.length > 0 },
  { id: 'pray', icon: '🛕', en: 'Blessed', te: 'దేవుని దీవెన', how: { en: 'Pray at the temple', te: 'గుడిలో దండం పెట్టండి' }, reward: 500, ok: (S) => !!S.flags.prayed },
  { id: 'pet', icon: '🐶', en: 'Best friend', te: 'ప్రాణ స్నేహితుడు', how: { en: 'Adopt a puppy at your house', te: 'మీ ఇంటి దగ్గర కుక్కపిల్లను తెచ్చుకోండి' }, reward: 500, ok: (S) => !!S.pet },
  { id: 'photo', icon: '📸', en: 'Photographer', te: 'ఫోటోగ్రాఫర్', how: { en: 'Take a photo in photo mode', te: 'ఫోటో మోడ్‌లో ఫోటో తీయండి' }, reward: 500, ok: (S) => !!S.flags.photo },
  { id: 'lakh', icon: '💰', en: 'Lakhpati', te: 'లక్షాధికారి', how: { en: 'Have ₹1 lakh', te: '₹1 లక్ష కూడబెట్టండి' }, reward: 2000, ok: (S) => S.money >= 100000 },
  { id: 'friends', icon: '😊', en: 'Village friend', te: 'గ్రామ స్నేహితుడు', how: { en: 'Make 3 good friends in the village', te: 'గ్రామంలో 3 మంచి స్నేహితులను సంపాదించండి' }, reward: 2000, ok: () => NPCs.list.filter((n) => n.named && Rel.get(n.id) > 30).length >= 3 },
  { id: 'house', icon: '🏠', en: 'New home', te: 'కొత్త ఇల్లు', how: { en: 'Upgrade your house', te: 'మీ ఇల్లు పెద్దది చేయండి' }, reward: 3000, ok: (S) => S.houseLevel >= 1 },
  { id: 'milk', icon: '🥛', en: 'Milkman', te: 'పాల రైతు', how: { en: 'Sell 100 litres of milk', te: '100 లీటర్ల పాలు అమ్మండి' }, reward: 3000, ok: (S) => (S.stats.milk || 0) >= 100 },
  { id: 'missions', icon: '🎯', en: 'Go-getter', te: 'పట్టుదల', how: { en: 'Complete 10 missions', te: '10 లక్ష్యాలు పూర్తి చేయండి' }, reward: 3000, ok: (S) => S.missions.done >= 10 },
  { id: 'tractor', icon: '🚜', en: 'Tractor owner', te: 'ట్రాక్టర్ యజమాని', how: { en: 'Buy a tractor', te: 'ట్రాక్టర్ కొనండి' }, reward: 5000, ok: () => Vehicles.player.some((v) => /^tractor/.test(v.type) && !v.rentUntil) },
  { id: 'acres', icon: '🗺️', en: 'Big farmer', te: 'పెద్ద రైతు', how: { en: 'Farm 5 acres', te: '5 ఎకరాలు సాగు చేయండి' }, reward: 5000, ok: () => Farm.farmedAcres() >= 5 },
  { id: 'crops4', icon: '🧺', en: 'Crop expert', te: 'పంటల నిపుణుడు', how: { en: 'Sell 4 different crops', te: '4 రకాల పంటలు అమ్మండి' }, reward: 5000, ok: (S) => Object.keys(S.stats.sold).length >= 4 },
  { id: 'harvest50', icon: '🏆', en: 'Bumper harvest', te: 'భారీ దిగుబడి', how: { en: 'Harvest 50 quintals in all', te: 'మొత్తం 50 క్వింటాళ్లు కోయండి' }, reward: 5000, ok: (S) => S.stats.harvestQ >= 50 },
  { id: 'rank', icon: '⭐', en: 'Rising farmer', te: 'ఎదుగుతున్న రైతు', how: { en: 'Reach the third rank', te: 'మూడో హోదా చేరుకోండి' }, reward: 5000, ok: (S) => S.rank >= 2 },
  { id: 'village', icon: '🏫', en: 'Village hero', te: 'గ్రామ హీరో', how: { en: 'Fund a village project', te: 'ఒక గ్రామ ప్రాజెక్టుకు డబ్బు ఇవ్వండి' }, reward: 5000, ok: () => Village.devScore() >= 1 },
  { id: 'gift', icon: '🎁', en: 'Loyal farmer', te: 'నమ్మకమైన రైతు', how: { en: 'Collect the daily gift 7 days in a row', te: '7 రోజులు వరుసగా రోజువారీ బహుమతి తీసుకోండి' }, reward: 5000, ok: (S) => !!S.daily && S.daily.streak >= 7 },
  { id: 'tenlakh', icon: '💎', en: 'Ten lakh club', te: 'పది లక్షల క్లబ్', how: { en: 'Have ₹10 lakh', te: '₹10 లక్షలు కూడబెట్టండి' }, reward: 10000, ok: (S) => S.money >= 1000000 },
  { id: 'crore', icon: '👑', en: 'Crorepati', te: 'కోటీశ్వరుడు', how: { en: 'Have ₹1 crore', te: '₹1 కోటి కూడబెట్టండి' }, reward: 50000, ok: (S) => S.money >= 10000000 },
];
const Trophies = {
  first: true,
  got(id) { return !!(G.S.trophies && G.S.trophies[id]); },
  count() { return TROPHIES.filter((t) => this.got(t.id)).length; },
  check() {
    const S = G.S; if (!S.trophies) S.trophies = {};
    // a save from before trophies existed: hand out everything already earned in one go, quietly
    if (this.first) {
      this.first = false;
      const won = TROPHIES.filter((t) => !S.trophies[t.id] && this.test(t));
      if (won.length > 1) {
        let sum = 0; for (const t of won) { S.trophies[t.id] = Time.day(); sum += t.reward; }
        Money.add(sum, 'trophy');
        UI.toast(L(`You already earned ${won.length} trophies! +${fmtINR(sum)}. See them in Farm office → Trophies.`, `మీకు ఇప్పటికే ${won.length} ట్రోఫీలు వచ్చాయి! +${fmtINR(sum)}. వ్యవసాయ కార్యాలయం → ట్రోఫీలు చూడండి.`), 'mission');
        return;
      }
    }
    if (UI.photoMode) return;
    const t = TROPHIES.find((x) => !S.trophies[x.id] && this.test(x));   // one at a time, so each gets its moment
    if (t) this.unlock(t);
  },
  test(t) { try { return !!t.ok(G.S); } catch (e) { return false; } },
  unlock(t) {
    const S = G.S; S.trophies[t.id] = Time.day();
    Money.add(t.reward, 'trophy');
    Celebrate.trophy(t);
    if (Settings.v.voice) Coach.say(L(`Trophy unlocked: ${t.en}!`, `ట్రోఫీ వచ్చింది: ${t.te}!`));
  },
  tab(b) {
    const n = this.count();
    b.appendChild(h('div', { class: 'sec' }, L(`Trophies · ${n} of ${TROPHIES.length}`, `ట్రోఫీలు · ${TROPHIES.length}లో ${n}`)));
    b.appendChild(h('div', { class: 'prog', style: { margin: '2px 0 12px' } }, h('b', { style: { width: (n / TROPHIES.length * 100).toFixed(0) + '%' } })));
    const g = h('div', { class: 'trophies' });
    for (const t of TROPHIES) {
      const day = G.S.trophies && G.S.trophies[t.id];
      g.appendChild(h('div', { class: 'troph' + (day ? '' : ' locked') }, h('b', { 'aria-hidden': 'true' }, t.icon), h('strong', null, LN(t)),
        h('span', null, day ? L(`Won on day ${day}`, `${day}వ రోజు గెలిచారు`) : LN(t.how)), h('em', null, '+' + fmtShortINR(t.reward))));
    }
    b.appendChild(g);
  },
};

// ---------------- pet dog: follows you around, cheers you up ----------------
const Pet = {
  a: null, idle: 0, barkT: 12, jumpT: 0, patAt: -1e9,
  KINDS: [{ en: 'Moti', te: 'మోతీ', col: '#b58352' }, { en: 'Kalu', te: 'కాలు', col: '#2a2420' }, { en: 'Tommy', te: 'టామీ', col: '#e6d9bf' }],
  name() { const p = G.S && G.S.pet; return p ? LN(p) : ''; },
  spawn() {
    if (!G.S.pet || this.a) return;
    const P = Player.pos();
    const a = Fauna.add('dog', P.x - 2, P.z - 2, { mode: 'pet', col: G.S.pet.col });
    if (a) { a.s = 0.92; this.a = a; }
  },
  menu() {
    UI.sheet({ title: L('Adopt a puppy 🐶', 'కుక్కపిల్లను తెచ్చుకోండి 🐶'), sub: L('Free! Your dog follows you everywhere and cheers you up.', 'ఉచితం! మీ కుక్క మీతో పాటే తిరుగుతుంది, మీకు ఉత్సాహం ఇస్తుంది.'), narrow: true, render: (b) => {
      const o = h('div', { class: 'pets' });
      for (const k of this.KINDS) o.appendChild(h('button', { class: 'btn alt pet', type: 'button', onclick: () => this.adopt(k) }, h('i', { style: { background: k.col } }), LN(k)));
      b.appendChild(o);
    } });
  },
  adopt(k) {
    G.S.pet = { en: k.en, te: k.te, col: k.col };
    UI.close(); this.spawn();
    if (this.a) { Audio2.at('bark', this.a.x, this.a.z); this.jumpT = 0.6; }
    UI.toast(L(`${k.en} is your dog now! It follows you everywhere. Stand still next to it to pat it.`, `${k.te} ఇప్పుడు మీ కుక్క! మీ వెంటే వస్తుంది. దగ్గర ఆగి నిమరండి.`), 'good');
    SaveSys.save(false);
  },
  // the "Pat" choice only shows when you stand still next to your dog, so it never crowds out real actions
  canPat(P) { const a = this.a; return !!a && Player.speed < 0.3 && Math.hypot(a.x - P.x, a.z - P.z) < 2.6; },
  pat() {
    const a = this.a; if (!a) return;
    this.jumpT = 0.6; this.idle = 0; a.pose = 'stand';
    Audio2.at('bark', a.x, a.z);
    const now = Time.totalMin();
    if (now - this.patAt < 90) { UI.toast(L(`${this.name()} wags its tail.`, `${this.name()} తోక ఊపుతోంది.`), 'info'); return; }
    this.patAt = now;
    const P = G.S.player; P.energy = Math.min(100, P.energy + 10);
    UI.toast(L(`${this.name()} is happy! +10 energy`, `${this.name()} సంతోషంగా ఉంది! +10 శక్తి`), 'good');
  },
  // every frame from Fauna.update: trot behind and to the left of the farmer (or the vehicle)
  steer(a, dt) {
    const P = Player.pos(); const v = Player.vehicle;
    const yaw = v ? v.yaw : Player.yaw; const sy = Math.sin(yaw), cy = Math.cos(yaw);
    const back = v ? 5.5 : 2.0, side = v ? 2.4 : 1.0;
    const tx = P.x - sy * back + cy * side, tz = P.z - cy * back - sy * side;
    const pd = Math.hypot(P.x - a.x, P.z - a.z);
    if (pd > 45) {   // left far behind (fast travel, a fast vehicle): catch up out of sight
      const q = { x: tx, z: tz }; World.collideCircle(q, 0.4); a.x = q.x; a.z = q.z; a.speed = 0;
    }
    const dx = tx - a.x, dz = tz - a.z, d = Math.hypot(dx, dz);
    a.visible = true;
    if (d > 0.7) {
      const want = Math.min(v ? 17 : 10.5, 1.4 + d * 1.9);
      a.speed = damp(a.speed, want, 6, dt);
      const step = Math.min(d, a.speed * dt);
      a.x += dx / d * step; a.z += dz / d * step;
      a.yaw = dampAngle(a.yaw, Math.atan2(dx, dz), 9, dt);
      a.pose = 'stand'; this.idle = 0;
      const q = { x: a.x, z: a.z }; if (World.collideCircle(q, 0.3)) { a.x = q.x; a.z = q.z; }
    } else {
      a.speed = damp(a.speed, 0, 7, dt); this.idle += dt;
      a.yaw = dampAngle(a.yaw, Math.atan2(P.x - a.x, P.z - a.z), 3, dt);
      if (this.idle > 8 && !v) a.pose = 'lie';
    }
    a.happy = pd < 7; a.alert = this.jumpT > 0;
    let lift = 0;
    if (this.jumpT > 0) { this.jumpT -= dt; lift = Math.sin(Math.max(0, this.jumpT) / 0.6 * Math.PI) * 0.45; }
    a.y = World.groundHeight(a.x, a.z) + lift;
    this.barkT -= dt;
    if (this.barkT <= 0) { this.barkT = 20 + frand() * 30; if (pd < 12 && frand() < 0.45) Audio2.at('bark', a.x, a.z); }
  },
};

// ---------------- photos: frame a shot, save it or share it ----------------
const Photo = {
  url() {
    const o = location.origin || '';
    if (/^https:\/\//.test(o) && !/claude|localhost|127\.0\.0\.1/.test(o)) return (o + location.pathname).replace(/index\.html$/, '').replace(/^https:\/\//, '').replace(/\/$/, '');
    return 'peru-dove-641366.hostingersite.com';
  },
  shareText() { return L(`My farm in Indian Village Simulator 🌾 Play free: https://${this.url()}`, `భారతీయ గ్రామ సిమ్యులేటర్‌లో నా పొలం 🌾 ఉచితంగా ఆడండి: https://${this.url()}`); },
  // share the game link: the phone's share sheet when there is one, else WhatsApp
  invite() {
    const text = L('Come farm with me in Indian Village Simulator! Free in your browser, phone or PC 🌾', 'భారతీయ గ్రామ సిమ్యులేటర్‌లో నాతో వ్యవసాయం చేయండి! ఫోన్, కంప్యూటర్ బ్రౌజర్‌లో ఉచితం 🌾');
    const url = 'https://' + this.url();
    const wa = () => window.open('https://wa.me/?text=' + encodeURIComponent(text + ' ' + url), '_blank', 'noopener');
    // inside an embedded page the share sheet can be blocked: fall back to WhatsApp (but not if the player just cancelled)
    if (navigator.share) { navigator.share({ title: 'Indian Village Simulator', text, url }).catch((e) => { if (!e || e.name !== 'AbortError') wa(); }); return; }
    wa();
  },
  take() {
    if (!G.started) return;
    const cv = G.renderer.domElement; const old = Render.pr;
    const want = clamp(1600 / Math.max(1, innerWidth), old, 2);   // a sharper picture than the play view
    let out = null;
    try {
      if (want > old + 0.05) { Render.pr = want; Render.resize(); }
      Render.render();
      out = document.createElement('canvas'); out.width = cv.width; out.height = cv.height;
      const c = out.getContext('2d'); c.drawImage(cv, 0, 0);
      this.stamp(c, out.width, out.height);
    } catch (e) { out = null; console.warn('photo', e); }
    finally { if (Render.pr !== old) { Render.pr = old; Render.resize(); } }
    const fl = UI.el('flash'); if (fl) { fl.classList.remove('on'); void fl.offsetWidth; fl.classList.add('on'); }
    Audio2.sfx('shutter');
    if (!out) { UI.toast(L('Could not take the photo on this device.', 'ఈ పరికరంలో ఫోటో తీయలేకపోయాం.'), 'bad'); return; }
    G.S.flags.photo = true;
    const done = (blob) => this.preview(blob || null, out);
    try { out.toBlob(done, 'image/jpeg', 0.9); } catch (e) { done(null); }
  },
  stamp(c, W, H) {
    const s = Math.max(0.7, Math.min(W, H * 1.6) / 1000); const S = G.S;
    const bh = 100 * s;
    const g = c.createLinearGradient(0, H - bh, 0, H); g.addColorStop(0, 'rgba(10,8,16,0)'); g.addColorStop(0.55, 'rgba(10,8,16,0.55)'); g.addColorStop(1, 'rgba(10,8,16,0.78)');
    c.fillStyle = g; c.fillRect(0, H - bh, W, bh);
    const x = 22 * s;
    c.textBaseline = 'alphabetic'; c.shadowColor = 'rgba(0,0,0,0.5)'; c.shadowBlur = 6 * s;
    c.fillStyle = '#f4b62e'; c.font = `800 ${Math.round(30 * s)}px "Baloo Tammudu 2", system-ui, sans-serif`;
    c.fillText(L('Indian Village Simulator', 'భారతీయ గ్రామ సిమ్యులేటర్'), x, H - 44 * s);
    c.fillStyle = '#ffffff'; c.font = `600 ${Math.round(18 * s)}px "Hind Guntur", system-ui, sans-serif`;
    c.fillText(`${S.player.name} · ${L('Day', 'రోజు')} ${Time.day()} · ${L('Play free', 'ఉచితంగా ఆడండి')}: ${this.url()}`, x, H - 16 * s);
    c.shadowBlur = 0;
  },
  preview(blob, canvas) {
    let src = '';
    try { src = blob ? URL.createObjectURL(blob) : canvas.toDataURL('image/jpeg', 0.88); } catch (e) { src = ''; }
    const name = `indian-village-day-${Time.day()}.jpg`;
    let file = null; try { if (blob) file = new File([blob], name, { type: 'image/jpeg' }); } catch (e) { file = null; }
    let canShareFile = false; try { canShareFile = !!(file && navigator.canShare && navigator.canShare({ files: [file] })); } catch (e) { canShareFile = false; }
    if (UI.photoMode) UI.photo();
    UI.sheet({ title: L('Your photo 📸', 'మీ ఫోటో 📸'), sub: L('Show your farm to friends and family!', 'మీ పొలాన్ని స్నేహితులకు, కుటుంబానికి చూపించండి!'), narrow: true, kind: 'photo',
      onClose: () => { if (blob && src) setTimeout(() => URL.revokeObjectURL(src), 2000); },
      render: (b) => {
        if (src) b.appendChild(h('img', { class: 'shot', src, alt: L('Photo of your farm', 'మీ పొలం ఫోటో') }));
        const row = h('div', { class: 'row', style: { justifyContent: 'center', marginTop: '10px', flexWrap: 'wrap' } });
        if (canShareFile) row.appendChild(h('button', { class: 'btn acc', type: 'button', onclick: () => { navigator.share({ files: [file], title: 'Indian Village Simulator', text: this.shareText() }).catch((e) => { if (!e || e.name !== 'AbortError') UI.toast(L('Sharing is blocked here. Use Save photo, then share it from your gallery.', 'ఇక్కడ షేర్ కుదరదు. ఫోటో సేవ్ చేసి గ్యాలరీ నుంచి షేర్ చేయండి.'), 'warn'); }); } }, L('Share photo', 'ఫోటో షేర్ చేయండి')));
        if (src) row.appendChild(h('a', { class: 'btn ' + (canShareFile ? 'alt' : 'acc'), href: src, download: name }, L('Save photo', 'ఫోటో సేవ్ చేయండి')));
        row.appendChild(h('a', { class: 'btn alt wa', href: 'https://wa.me/?text=' + encodeURIComponent(this.shareText()), target: '_blank', rel: 'noopener' }, L('Invite on WhatsApp', 'వాట్సాప్‌లో ఆహ్వానించండి')));
        b.appendChild(row);
        b.appendChild(h('p', { class: 'empty', style: { textAlign: 'center', padding: '8px 0 0' } }, isMobile ? L('Tip: press and hold the photo to save it to your gallery.', 'చిట్కా: ఫోటోను నొక్కి పట్టుకుని గ్యాలరీలో సేవ్ చేయండి.') : L('Tip: right-click the photo to copy it.', 'చిట్కా: ఫోటోపై రైట్-క్లిక్ చేసి కాపీ చేయండి.')));
      } });
  },
};

// ---------------- how to play: three big cards the first time ----------------
const HowTo = {
  show() {
    const cards = [
      ['🕹️', L('Move', 'కదలండి'), isMobile ? L('Drag the left stick to walk; push it all the way to run. Drag the right side of the screen to look around.', 'ఎడమ స్టిక్ లాగి నడవండి; పూర్తిగా నెడితే పరుగు. చుట్టూ చూడటానికి తెర కుడివైపు లాగండి.') : L('W A S D to walk, hold Shift to run. Drag the mouse to look around.', 'W A S D తో నడవండి, Shift పట్టుకుంటే పరుగు. మౌస్ లాగి చుట్టూ చూడండి.')],
      ['🟡', L('Follow the gold arrow', 'బంగారు బాణాన్ని అనుసరించండి'), L('The gold arrow on the screen and the line on the map show you the way to the next place.', 'తెరపై బంగారు బాణం, మ్యాప్‌లో గీత తదుపరి చోటికి దారి చూపిస్తాయి.')],
      ['📋', L('Your mission is in the corner', 'మీ లక్ష్యం మూలలో ఉంటుంది'), L('The card at the top right always says what to do next. Tap “How?” on it for easy tips.', 'పై కుడి మూలలోని కార్డు తదుపరి పని ఏమిటో ఎప్పుడూ చెబుతుంది. సులభమైన చిట్కాల కోసం దానిపై “ఎలా?” నొక్కండి.')],
      ['🎁', L('Gifts & trophies', 'బహుమతులు & ట్రోఫీలు'), L('Come back every day for a gift, win trophies, and adopt a puppy at your house.', 'రోజూ వచ్చి బహుమతి తీసుకోండి, ట్రోఫీలు గెలవండి, ఇంటి దగ్గర కుక్కపిల్లను తెచ్చుకోండి.')],
    ];
    UI.sheet({ title: L('How to play', 'ఎలా ఆడాలి'), narrow: true, kind: 'howto', onClose: () => { Settings.v.seenHowTo = true; Settings.save(); }, render: (b) => {
      const g = h('div', { class: 'howto' });
      for (const [ic, t, d] of cards) g.appendChild(h('div', { class: 'hcard' }, h('b', { 'aria-hidden': 'true' }, ic), h('div', null, h('strong', null, t), h('span', null, d))));
      b.appendChild(g);
      b.appendChild(h('div', { class: 'row', style: { justifyContent: 'center', marginTop: '12px' } }, h('button', { class: 'btn acc big', type: 'button', onclick: () => UI.close() }, L("Let's play! ▶", 'ఆడదాం! ▶'))));
    } });
  },
};

// ---------------- glue ----------------
const Extras = {
  t: 0, howAt: 0,
  start(loaded) {
    if (!this._bound) { this._bound = true; Bus.on('pray', () => { if (G.started) G.S.flags.prayed = true; }); }
    const S = G.S; if (!S.trophies) S.trophies = {}; if (!S.daily) S.daily = { last: null, streak: 0 };
    Trophies.first = loaded; this.t = 2.5;
    Pet.a = null; Pet.spawn();
    // first game on this device: the how-to card, once the welcome banner has had a moment
    this.howAt = !loaded && !Settings.v.seenHowTo && !window.__tvsNoPopups ? performance.now() + 1800 : 0;
  },
  update(dt) {
    if (this.howAt && performance.now() >= this.howAt) { if (UI.modalOpen()) this.howAt += 1000; else { this.howAt = 0; HowTo.show(); } }
    this.t -= dt; if (this.t > 0) return; this.t = 2;
    Trophies.check();
    DailyGift.check();
  },
  // easy mode: crops forgive mistakes, the farmer tires slowly
  easy() { return !!(G.S && G.S.easy); },
};
