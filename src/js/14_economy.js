// ============================================================================
// Economy: inventory, money, market prices & news, storage, finance
// ============================================================================
const Stats = { walk: 0, drive: 0, pumpHrs: 0 };

const Inv = {
  count(k) { return (G.S.inv && G.S.inv[k]) || 0; },
  add(k, n) { G.S.inv[k] = (G.S.inv[k] || 0) + n; UI.dirty = true; },
  take(k, n) { const c = this.count(k); if (c + 1e-9 < n) return false; G.S.inv[k] = Math.max(0, c - n); UI.dirty = true; return true; },
  name(k) { if (k.startsWith('seed_')) { const c = CROPS[k.slice(5)]; return L(`${c.en} seeds`, `${c.te} విత్తనాలు`); } return ITEMS[k] ? LN(ITEMS[k]) : k; },
};

const Money = {
  add(n, why) { const S = G.S; S.money += n; if (n > 0) { S.stats.earned += n; if (why === 'crop' || why === 'milk') S.stats.cropIncome += n; } UI.moneyFlash(n); Bus.emit('money', { n, why }); },
  spend(n, why, quiet) {
    const S = G.S;
    if (S.money + 1e-6 < n) { if (!quiet) { UI.toast(L(`Not enough money. You need ${fmtINR(n)}.`, `డబ్బు సరిపోదు. ${fmtINR(n)} కావాలి.`), 'bad'); Audio2.sfx('error'); } return false; }
    S.money -= n; S.stats.spent += n; UI.moneyFlash(-n); Bus.emit('spent', { n, why }); return true;
  },
};

// [amplitude, month-of-peak as year fraction]
const PRICE_PHASE = { paddy: [0.07, 0.8], cotton: [0.1, 0.7], maize: [0.09, 0.75], chilli: [0.14, 0.3], turmeric: [0.12, 0.45], groundnut: [0.08, 0.8], tomato: [0.33, 0.05], mango: [0.2, 0.9] };
const VOL = { paddy: 0.012, cotton: 0.02, maize: 0.022, chilli: 0.035, turmeric: 0.028, groundnut: 0.02, tomato: 0.07, mango: 0.04 };
const DEPTH = { paddy: 900, cotton: 420, maize: 700, chilli: 160, turmeric: 220, groundnut: 300, tomato: 260, mango: 200 };
const NEWS = [
  { crop: 'cotton', mult: 1.1, hrs: 60, en: 'Heavy rains damage cotton in northern districts — cotton prices up.', te: 'ఉత్తర జిల్లాల్లో భారీ వర్షాలకు పత్తి దెబ్బతింది — పత్తి ధర పెరిగింది.' },
  { crop: 'chilli', mult: 1.16, hrs: 72, en: 'Export orders for Teja chilli surge.', te: 'తేజ మిర్చికి ఎగుమతి ఆర్డర్లు భారీగా పెరిగాయి.' },
  { crop: 'tomato', mult: 0.55, hrs: 36, en: 'Bumper tomato arrivals at city markets — prices crash.', te: 'నగర మార్కెట్లకు టమాటా భారీగా వచ్చింది — ధరలు పడిపోయాయి.' },
  { crop: 'tomato', mult: 1.6, hrs: 40, en: 'Tomato shortage in the city — traders pay a premium.', te: 'నగరంలో టమాటా కొరత — వ్యాపారులు ఎక్కువ ధర ఇస్తున్నారు.' },
  { crop: 'maize', mult: 1.12, hrs: 60, en: 'Poultry feed mills are buying maize aggressively.', te: 'కోళ్ల దాణా మిల్లులు మొక్కజొన్నను భారీగా కొంటున్నాయి.' },
  { crop: 'paddy', mult: 1.06, hrs: 60, en: 'Government raises paddy procurement targets.', te: 'ప్రభుత్వం వరి కొనుగోలు లక్ష్యాన్ని పెంచింది.' },
  { crop: 'paddy', mult: 0.93, hrs: 48, en: 'Rice mills report full godowns; paddy bids soften.', te: 'రైస్ మిల్లుల గోదాములు నిండాయి; వరి ధర తగ్గింది.' },
  { crop: 'turmeric', mult: 1.1, hrs: 60, en: 'Festival demand lifts turmeric prices at Nizamabad.', te: 'పండుగల డిమాండ్‌తో నిజామాబాద్‌లో పసుపు ధర పెరిగింది.' },
  { crop: 'groundnut', mult: 1.09, hrs: 48, en: 'Oil mills stock up on groundnut.', te: 'నూనె మిల్లులు వేరుశెనగను నిల్వ చేసుకుంటున్నాయి.' },
  { crop: 'cotton', mult: 0.92, hrs: 48, en: 'Cheaper cotton imports; mills cut bids.', te: 'చౌక దిగుమతులతో మిల్లులు పత్తి ధర తగ్గించాయి.' },
  { crop: 'chilli', mult: 0.88, hrs: 48, en: 'Cold storages release old chilli stock; prices dip.', te: 'కోల్డ్ స్టోరేజీల నుంచి పాత మిర్చి విడుదల; ధర తగ్గింది.' },
  { item: 'diesel', mult: 1.05, hrs: 96, en: 'Diesel price hiked by ₹4 a litre.', te: 'డీజిల్ లీటరుకు ₹4 పెరిగింది.' },
  { item: 'urea', mult: 1.3, hrs: 60, en: 'Urea shortage at cooperatives — dealers charging more.', te: 'సహకార సంఘాల్లో యూరియా కొరత — డీలర్లు ఎక్కువ వసూలు చేస్తున్నారు.' },
  { pest: 'cotton', hrs: 72, en: 'Pink bollworm alert issued for cotton farmers.', te: 'పత్తి రైతులకు గులాబీ పురుగు హెచ్చరిక.' },
  { pest: 'maize', hrs: 72, en: 'Fall armyworm spotted in nearby mandals.', te: 'పక్క మండలాల్లో కత్తెర పురుగు కనిపించింది.' },
  { crop: 'mango', mult: 1.2, hrs: 60, en: 'Banganapalli mango demand strong in city markets.', te: 'నగర మార్కెట్లలో బంగినపల్లి మామిడికి మంచి డిమాండ్.' },
];

const Market = {
  init() {
    const S = G.S;
    if (!S.market) {
      S.market = { dem: {}, sup: {}, ev: [], hist: {}, prev: {}, news: [], shop: {} };
      for (const c of [...CROP_IDS, 'mango']) { S.market.dem[c] = 0.95 + frand() * 0.1; S.market.sup[c] = 1; S.market.hist[c] = []; }
      for (const c of [...CROP_IDS, 'mango']) { S.market.prev[c] = this.price(c); for (let i = 0; i < 12; i++) S.market.hist[c].push(Math.round(this.price(c) * (0.94 + frand() * 0.12))); }
    }
  },
  base(c) { return c === 'mango' ? MANGO.price : CROPS[c].price; },
  price(c) {
    const S = G.S; const M = S.market;
    const [A, ph] = PRICE_PHASE[c];
    const season = 1 + A * Math.cos(TAU * (Time.yearFrac() - ph));
    const sup = Math.pow(M.sup[c] || 1, -0.55);
    const dem = M.dem[c] || 1;
    const weather = (S.weather.drought ? 1.1 : 1) * (c === 'tomato' && Weather.rainHrs24 > 6 ? 1.15 : 1);
    let ev = 1; for (const e of M.ev) if (e.crop === c) ev *= e.mult;
    const vm = S.village.market ? 1.03 : 1;
    return Math.round(this.base(c) * season * sup * dem * weather * ev * vm);
  },
  shopMult(item) { const S = G.S; let m = S.market.shop[item] || 1; if (S.village.shops) m *= 0.96; const rel = S.rel.srinu || 0; if (rel > 50) m *= 0.97; return m; },
  itemPrice(k) { if (k.startsWith('seed_')) { const c = k.slice(5); const sow = Time.dayInSeason() < 3 ? 1.08 : 1; return Math.round(CROPS[c].seedCost * sow * this.shopMult('seeds')); } return Math.round(ITEMS[k].price * this.shopMult(k)); },
  dieselPrice() { return Math.round(DIESEL_PRICE * (G.S.market.shop.diesel || 1)); },
  hourTick() {
    const S = G.S; const M = S.market;
    const volK = S.village.godown ? 0.7 : 1;
    for (const c of [...CROP_IDS, 'mango']) {
      const n = (frand() + frand() + frand() - 1.5) * 1.4;
      M.dem[c] = clamp(M.dem[c] + (1 - M.dem[c]) * 0.025 + n * VOL[c] * volK, 0.6, 1.5);
      M.sup[c] = 1 + (M.sup[c] - 1) * 0.972;
    }
    for (const e of M.ev) e.left -= 1;
    const expired = M.ev.filter((e) => e.left <= 0);
    for (const e of expired) { if (e.item) M.shop[e.item] = 1; if (e.pest && S.flags.pestEvent === e.pest) S.flags.pestEvent = null; }
    M.ev = M.ev.filter((e) => e.left > 0);
    if (frand() < 1 / 26 && M.ev.length < 3) this.randomEvent();
    if (Time.hour() < 1) this.dayTick();
  },
  dayTick() {
    const M = G.S.market;
    for (const c of [...CROP_IDS, 'mango']) { M.hist[c].push(this.price(c)); if (M.hist[c].length > 20) M.hist[c].shift(); M.prev[c] = M.hist[c][M.hist[c].length - 2] || this.price(c); }
  },
  randomEvent() {
    const M = G.S.market;
    const opts = NEWS.filter((n) => !M.ev.some((e) => (n.crop && e.crop === n.crop) || (n.item && e.item === n.item) || (n.pest && e.pest === n.pest)));
    if (!opts.length) return;
    const n = opts[Math.floor(frand() * opts.length)];
    M.ev.push({ crop: n.crop || null, item: n.item || null, pest: n.pest || null, mult: n.mult || 1, left: n.hrs, en: n.en, te: n.te });
    if (n.item) M.shop[n.item] = n.mult;
    if (n.pest) G.S.flags.pestEvent = n.pest;
    this.news(n);
  },
  news(n) { const M = G.S.market; M.news.unshift({ en: n.en, te: n.te, t: Time.totalMin() }); if (M.news.length > 8) M.news.pop(); UI.news(n); },
  trend(c) { const M = G.S.market; const p = this.price(c), q = M.prev[c] || p; return (p - q) / q; },
  qualityLabel(q) { return q >= 1.04 ? 'A' : q >= 0.99 ? 'B' : 'C'; },
  // sell a quantity; returns revenue
  sell(crop, qty, q, where) {
    const S = G.S; const p = this.price(crop);
    let unit = p * q;
    let fees = 0;
    if (where === 'yard') { fees = unit * qty * 0.01 + 10 * qty; }
    else if (where === 'trader') unit *= 0.88;
    else if (where === 'city') { unit *= 1.1; fees = 150 * qty; }
    else if (where === 'santha') unit *= 1.05;
    const rev = Math.max(0, Math.round(unit * qty - fees));
    S.market.sup[crop] = (S.market.sup[crop] || 1) + qty / (DEPTH[crop] || 400);
    S.stats.sold[crop] = (S.stats.sold[crop] || 0) + qty;
    Money.add(rev, 'crop');
    Bus.emit('sold', { crop, qty, rev, where, price: unit });
    Audio2.sfx('cash');
    return rev;
  },
  procurementOpen(crop) {
    const s = Time.season(), d = Time.dayInSeason();
    if (!CROPS[crop] || !CROPS[crop].msp || !CROPS[crop].proc) return false;
    return (s === 0 && d >= 4) || (s === 1 && d <= 3) || (s === 1 && d >= 6) || (s === 2 && d <= 2);
  },
};

// ---------------- storage ----------------
const PERISH = { tomato: true, mango: true, chilli: true };
const Storage = {
  cap() { const S = G.S; return HOUSE_LEVELS[S.houseLevel].storage + (S.up.warehouse ? 400 : 0); },
  coldCap() { return G.S.up.coldStorage ? 150 : 0; },
  used(cold) { let s = 0; for (const e of G.S.storage) if (!!e.cold === !!cold) s += e.qty; return s; },
  total(crop) { let s = 0; for (const e of G.S.storage) if (e.crop === crop) s += e.qty; return s; },
  add(crop, qty, q) {
    const S = G.S; let left = qty;
    const put = (cold) => {
      const room = (cold ? this.coldCap() : this.cap()) - this.used(cold); if (room <= 0.01 || left <= 0) return;
      const amt = Math.min(room, left);
      let e = S.storage.find((x) => x.crop === crop && !!x.cold === cold);
      if (!e) { e = { crop, qty: 0, q: q, cold }; S.storage.push(e); }
      e.q = (e.q * e.qty + q * amt) / (e.qty + amt); e.qty += amt; left -= amt;
    };
    if (PERISH[crop]) put(true);
    put(false);
    UI.dirty = true;
    return qty - left;
  },
  take(crop, qty) {
    const S = G.S; let got = 0, qs = 0;
    for (const e of S.storage) { if (e.crop !== crop || got >= qty) continue; const a = Math.min(e.qty, qty - got); e.qty -= a; got += a; qs += a * e.q; }
    S.storage = S.storage.filter((e) => e.qty > 0.01);
    UI.dirty = true;
    return { qty: got, q: got > 0 ? qs / got : 1 };
  },
  spoil(hrs) {
    const S = G.S;
    for (const e of S.storage) {
      const base = (PRODUCE[e.crop].spoil || 0.002) / 24;
      const k = e.cold ? 0.05 : S.up.warehouse ? 0.4 : 1;
      e.qty *= 1 - base * k * hrs;
    }
    for (const v of Vehicles.player) for (const c of v.cargo) c.qty *= 1 - (PRODUCE[c.crop].spoil || 0.002) / 24 * hrs * 1.2;
    for (const f of Fields.list) if (f.heap) { f.heap.qty *= 1 - (PRODUCE[f.heap.crop].spoil || 0.002) / 24 * hrs * 1.3; if (f.heap.qty < 0.05) f.heapDirty = true; }
  },
};

// ---------------- finance ----------------
const Finance = {
  bankLimit() { const owned = Farm.ownedAcres(); let bal = 0; for (const l of G.S.loans) if (l.kind === 'bank') bal += l.bal; return Math.max(0, 100000 + 75000 * owned - bal); },
  lenderLimit() { let bal = 0; for (const l of G.S.loans) if (l.kind === 'lender') bal += l.bal; return Math.max(0, 200000 - bal); },
  debt() { return G.S.loans.reduce((s, l) => s + l.bal, 0); },
  borrow(kind, amt) {
    amt = Math.round(amt);
    const lim = kind === 'bank' ? this.bankLimit() : this.lenderLimit();
    if (amt <= 0 || amt > lim) { UI.toast(L('That is above your loan limit.', 'అది మీ రుణ పరిమితి కంటే ఎక్కువ.'), 'bad'); return false; }
    const rate = kind === 'bank' ? 0.07 / DAYS_PER_YEAR : 0.018;
    let l = G.S.loans.find((x) => x.kind === kind); if (!l) { l = { kind, bal: 0, rate, day: Time.day() }; G.S.loans.push(l); }
    l.bal += amt; Money.add(amt, 'loan');
    UI.toast(kind === 'bank' ? L(`Crop loan of ${fmtINR(amt)} credited at 7% a year.`, `${fmtINR(amt)} పంట రుణం 7% వార్షిక వడ్డీకి జమ అయింది.`) : L(`Hanmanthu lends ${fmtINR(amt)} at 1.8% interest per day.`, `హన్మంతు ${fmtINR(amt)} రోజుకు 1.8% వడ్డీకి ఇచ్చాడు.`), kind === 'bank' ? 'good' : 'warn');
    Bus.emit('loan', { kind, amt });
    return true;
  },
  repay(kind, amt) {
    const l = G.S.loans.find((x) => x.kind === kind); if (!l) return false;
    amt = Math.min(Math.round(amt), Math.ceil(l.bal));
    if (!Money.spend(amt, 'repay')) return false;
    l.bal -= amt; if (l.bal < 1) { G.S.loans = G.S.loans.filter((x) => x !== l); UI.toast(L('Loan fully repaid!', 'రుణం పూర్తిగా తీరింది!'), 'good'); Bus.emit('loanRepaid', { kind }); if (kind === 'lender') Rel.add('hanmanthu', 5); }
    return true;
  },
  dayTick() {
    const S = G.S;
    for (const l of S.loans) { l.bal *= 1 + l.rate; if (l.kind === 'lender' && l.bal > 150000 && frand() < 0.3) UI.toast(L('Hanmanthu is asking about his money...', 'హన్మంతు తన డబ్బు గురించి అడుగుతున్నాడు...'), 'warn'); }
    if (S.fd > 0) S.fd *= 1 + 0.065 / DAYS_PER_YEAR;
    // wages
    Workers.dayTick();
  },
  seasonSupport() {
    const a = Farm.ownedAcres(); if (a <= 0) return;
    const amt = Math.round(5000 * a);
    Money.add(amt, 'support');
    UI.toast(L(`Farmer investment support: ${fmtINR(amt)} credited for ${fmt1(a)} acres.`, `రైతు పెట్టుబడి సాయం: ${fmt1(a)} ఎకరాలకు ${fmtINR(amt)} జమ అయింది.`), 'good');
  },
  pendingTick() {
    const S = G.S; const now = Time.totalMin();
    for (const p of S.pending) if (p.due <= now && !p.paid) { p.paid = true; Money.add(p.amt, 'crop'); UI.toast(L(`MSP payment received: ${fmtINR(p.amt)} for ${p.desc}.`, `మద్దతు ధర చెల్లింపు అందింది: ${p.desc}కు ${fmtINR(p.amt)}.`), 'good'); Audio2.sfx('cash'); }
    S.pending = S.pending.filter((p) => !p.paid);
  },
};

// relationships
const Rel = {
  get(id) { return G.S.rel[id] || 0; },
  add(id, n) { G.S.rel[id] = clamp((G.S.rel[id] || 0) + n, -100, 100); Bus.emit('rel', { id, v: G.S.rel[id] }); },
};
