// ============================================================================
// Road graph + A*, NPC daily routines, animal behaviour
// ============================================================================
const Graph = {
  nodes: [], grid: new Map(), cache: new Map(),
  key(x, z) { return (Math.floor(x / 16) * 73856093) ^ (Math.floor(z / 16) * 19349663); },
  addNode(x, z, w) {
    // merge with an existing close node
    const near = this.nearestWithin(x, z, 3.5);
    if (near >= 0) return near;
    const i = this.nodes.length; this.nodes.push({ x, z, w, nb: [] });
    const k = this.key(x, z); let a = this.grid.get(k); if (!a) this.grid.set(k, (a = [])); a.push(i);
    return i;
  },
  link(a, b) { if (a === b || a < 0 || b < 0) return; const A = this.nodes[a], B = this.nodes[b]; if (!A.nb.includes(b)) A.nb.push(b); if (!B.nb.includes(a)) B.nb.push(a); },
  nearestWithin(x, z, r) {
    let best = -1, bd = r;
    const gx = Math.floor(x / 16), gz = Math.floor(z / 16);
    for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) {
      const a = this.grid.get(((gx + dx) * 73856093) ^ ((gz + dz) * 19349663)); if (!a) continue;
      for (const i of a) { const n = this.nodes[i]; const d = Math.hypot(n.x - x, n.z - z); if (d < bd) { bd = d; best = i; } }
    }
    return best;
  },
  nearest(x, z) {
    for (const r of [16, 40, 90, 200, 500]) { const i = this.nearestWithin(x, z, r); if (i >= 0) return i; }
    return 0;
  },
  build() {
    for (const r of ROADS) {
      if (r.kind === 'hwy') continue;
      const P = r.samples; let prev = -1;
      for (let i = 0; i < P.length; i += 3) { const k = this.addNode(P[i].x, P[i].z, r.w); this.link(prev, k); prev = k; }
      const last = this.addNode(P[P.length - 1].x, P[P.length - 1].z, r.w); this.link(prev, last);
    }
    // join nearby nodes of different roads (intersections)
    for (let i = 0; i < this.nodes.length; i++) {
      const n = this.nodes[i];
      const gx = Math.floor(n.x / 16), gz = Math.floor(n.z / 16);
      for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) {
        const a = this.grid.get(((gx + dx) * 73856093) ^ ((gz + dz) * 19349663)); if (!a) continue;
        for (const j of a) if (j !== i && Math.hypot(this.nodes[j].x - n.x, this.nodes[j].z - n.z) < 8) this.link(i, j);
      }
    }
  },
  astar(s, t) {
    const N = this.nodes; const g = new Map(), from = new Map(); const open = [[0, s]]; g.set(s, 0);
    const h = (i) => Math.hypot(N[i].x - N[t].x, N[i].z - N[t].z);
    let iter = 0;
    while (open.length && iter++ < 6000) {
      // pop min (small heaps are fine with linear scan)
      let bi = 0; for (let k = 1; k < open.length; k++) if (open[k][0] < open[bi][0]) bi = k;
      const [, cur] = open[bi]; open[bi] = open[open.length - 1]; open.pop();
      if (cur === t) break;
      const gc = g.get(cur);
      for (const nb of N[cur].nb) {
        const ng = gc + Math.hypot(N[nb].x - N[cur].x, N[nb].z - N[cur].z);
        if (ng < (g.has(nb) ? g.get(nb) : Infinity)) { g.set(nb, ng); from.set(nb, cur); open.push([ng + h(nb), nb]); }
      }
    }
    if (!from.has(t) && s !== t) return null;
    const out = [t]; let c = t; while (c !== s) { c = from.get(c); if (c === undefined) return null; out.push(c); }
    return out.reverse();
  },
  // path of points from (x,z) to target, walking on the left edge of roads
  path(ax, az, bx, bz, side = 1) {
    const direct = Math.hypot(bx - ax, bz - az);
    if (direct < 26) return [{ x: bx, z: bz }];
    const s = this.nearest(ax, az), t = this.nearest(bx, bz);
    const key = s + '>' + t;
    let ids = this.cache.get(key);
    if (ids === undefined) { ids = this.astar(s, t); this.cache.set(key, ids); if (this.cache.size > 3000) this.cache.clear(); }
    if (!ids) return [{ x: bx, z: bz }];
    const N = this.nodes; const pts = [];
    for (let k = 0; k < ids.length; k++) {
      const n = N[ids[k]], m = N[ids[Math.min(ids.length - 1, k + 1)]], p = N[ids[Math.max(0, k - 1)]];
      let dx = m.x - p.x, dz = m.z - p.z; const l = Math.hypot(dx, dz) || 1; dx /= l; dz /= l;
      const off = Math.max(0.6, n.w / 2 - 0.7) * side;
      pts.push({ x: n.x + dz * off, z: n.z - dx * off });
    }
    // drop first nodes that go backwards
    while (pts.length > 1 && Math.hypot(pts[1].x - ax, pts[1].z - az) < Math.hypot(pts[0].x - ax, pts[0].z - az)) pts.shift();
    pts.push({ x: bx, z: bz });
    return pts;
  },
};

// ---------------- dialogue pools ----------------
const TIPS = [
  { en: 'Black soil holds water — cotton loves it. Red soil suits groundnut and chilli.', te: 'నల్ల రేగడి నీటిని పట్టి ఉంచుతుంది — పత్తికి బాగుంటుంది. ఎర్ర నేల వేరుశెనగ, మిర్చికి సరిపోతుంది.' },
  { en: 'Do not leave paddy dry. Keep the field flooded until the grain fills.', te: 'వరి పొలాన్ని ఎండనివ్వకండి. గింజ పట్టే వరకు నీరు నిలబెట్టండి.' },
  { en: 'Prices dip when everyone harvests together. Store your crop and wait if you can.', te: 'అందరూ ఒకేసారి కోస్తే ధరలు పడిపోతాయి. వీలైతే నిల్వ చేసి ఆగండి.' },
  { en: 'Spray pesticide early. A pest attack left for two days eats half the crop.', te: 'పురుగుమందు ముందుగానే పిచికారీ చేయండి. రెండు రోజులు వదిలేస్తే సగం పంట పోతుంది.' },
  { en: 'Never stand in an open field when lightning comes. Go under a roof.', te: 'పిడుగులు పడుతున్నప్పుడు పొలంలో నిలబడకండి. ఏదైనా కప్పు కిందకి వెళ్ళండి.' },
  { en: 'Moneylender loans look easy. The interest is not.', te: 'వడ్డీ వ్యాపారి అప్పు సులువుగా అనిపిస్తుంది. వడ్డీ మాత్రం కాదు.' },
  { en: 'Leasing land (koulu) is cheaper than buying. Start with that.', te: 'భూమి కొనడం కంటే కౌలుకు తీసుకోవడం చౌక. అక్కడి నుంచి మొదలుపెట్టండి.' },
  { en: 'Sell paddy and cotton to the government centre at MSP when market prices are low.', te: 'మార్కెట్ ధర తక్కువగా ఉంటే వరి, పత్తిని ప్రభుత్వ కొనుగోలు కేంద్రంలో మద్దతు ధరకు అమ్మండి.' },
  { en: 'Tomato pays well but spoils in days. A cold storage changes everything.', te: 'టమాటాకు మంచి ధర వస్తుంది కానీ రోజుల్లో పాడవుతుంది. కోల్డ్ స్టోరేజ్ ఉంటే అంతా మారిపోతుంది.' },
  { en: 'A farm pond keeps your motor running in a drought year.', te: 'కరువు ఏడాదిలో పంట కుంట ఉంటే మోటారు ఆగదు.' },
  { en: 'Weeds drink your fertilizer. Weed before you spread urea.', te: 'కలుపు మీ ఎరువును తాగేస్తుంది. యూరియా చల్లే ముందు కలుపు తీయండి.' },
  { en: 'The weekly santha is on Sunday. More buyers come for vegetables that day.', te: 'వారపు సంత ఆదివారం. ఆ రోజు కూరగాయలకు ఎక్కువ మంది కొనుగోలుదారులు వస్తారు.' },
];
const GREET = {
  morning: [{ en: 'Namaskaram! Early start today?', te: 'నమస్కారం! ఈ రోజు పొద్దున్నే మొదలుపెట్టారా?' }, { en: 'Good morning. The fields look fresh after the dew.', te: 'శుభోదయం. మంచు తర్వాత పొలాలు పచ్చగా ఉన్నాయి.' }],
  day: [{ en: 'Hot sun today. Drink some water.', te: 'ఈ రోజు ఎండ బాగా ఉంది. కాస్త నీళ్లు తాగండి.' }, { en: 'Bagunnara? How is the crop?', te: 'బాగున్నారా? పంట ఎలా ఉంది?' }],
  evening: [{ en: 'Come, sit for a chai at Yadamma\'s.', te: 'రండి, యాదమ్మ దగ్గర ఒక చాయ్ తాగుదాం.' }, { en: 'Another day done. Rest well.', te: 'ఇంకో రోజు అయిపోయింది. బాగా విశ్రాంతి తీసుకోండి.' }],
  rain: [{ en: 'Good rain! The lake will fill up.', te: 'మంచి వాన! చెరువు నిండుతుంది.' }, { en: 'Stay under a roof, the lightning is close.', te: 'ఏదైనా కప్పు కింద ఉండండి, పిడుగులు దగ్గరగా పడుతున్నాయి.' }],
  heat: [{ en: 'Vadagalulu! Stay in the shade till four.', te: 'వడగాలులు! నాలుగు వరకు నీడలో ఉండండి.' }],
};

// ---------------- NPC manager ----------------
const NPCs = {
  list: [], byId: {}, thinkT: 0,
  spawn() {
    RNG = mulberry32(3131);
    const houses = POI.houses.slice();
    const takeHouse = (pref) => { if (!houses.length) return POI.houses[0]; let bi = 0; if (pref) { let bd = 1e9; houses.forEach((h, i) => { const d = Math.hypot(h.x - pref.x, h.z - pref.z); if (d < bd) { bd = d; bi = i; } }); } else bi = Math.floor(RNG() * houses.length); return houses.splice(bi, 1)[0]; };
    const named = [
      { id: 'sarpanch', name: { en: 'Lakshmamma', te: 'లక్ష్మమ్మ' }, role: { en: 'Sarpanch', te: 'సర్పంచ్' }, type: 'official', app: { gender: 'f', saree: '#1f9e9a' }, home: POI.sarpanchHouse },
      { id: 'ramulu', name: { en: 'Ramulu', te: 'రాములు' }, role: { en: 'Senior farmer', te: 'సీనియర్ రైతు' }, type: 'farmer', app: { gender: 'm', age: 'elder', turban: true, lungi: '#f4f1ea' } },
      { id: 'yadamma', name: { en: 'Yadamma', te: 'యాదమ్మ' }, role: { en: 'Tea stall', te: 'టీ స్టాల్' }, type: 'teastall', app: { gender: 'f', saree: '#e07b22' } },
      { id: 'srinu', name: { en: 'Srinu', te: 'శ్రీను' }, role: { en: 'Seeds & fertilizers', te: 'విత్తనాలు & ఎరువులు' }, type: 'shop', shop: 'seedShop', app: { gender: 'm', lower: 'pants', shirt: '#bcd3e8' } },
      { id: 'mallesh', name: { en: 'Mallesh', te: 'మల్లేష్' }, role: { en: 'Kirana shop', te: 'కిరాణం' }, type: 'shop', shop: 'kirana', app: { gender: 'm', lower: 'lungi' } },
      { id: 'bhaskar', name: { en: 'Bhaskar', te: 'భాస్కర్' }, role: { en: 'Tractor mechanic', te: 'ట్రాక్టర్ మెకానిక్' }, type: 'mechanic', app: { gender: 'm', lower: 'pants', shirt: '#46525a', pants: '#2c3550' } },
      { id: 'venkatesh', name: { en: 'Venkatesh', te: 'వెంకటేష్' }, role: { en: 'Commission agent', te: 'కమీషన్ ఏజెంట్' }, type: 'agent', app: { gender: 'm', lower: 'pants', shirt: '#f2efe6' } },
      { id: 'sujatha', name: { en: 'Dr. Sujatha', te: 'డా. సుజాత' }, role: { en: 'Doctor, PHC', te: 'డాక్టర్' }, type: 'doctor', app: { gender: 'f', saree: '#3d6fb8' } },
      { id: 'ravi', name: { en: 'Ravi Sir', te: 'రవి సార్' }, role: { en: 'Teacher', te: 'ఉపాధ్యాయుడు' }, type: 'teacher', app: { gender: 'm', lower: 'pants', shirt: '#e9dfbf' } },
      { id: 'hanmanthu', name: { en: 'Hanmanthu', te: 'హన్మంతు' }, role: { en: 'Moneylender', te: 'వడ్డీ వ్యాపారి' }, type: 'moneylender', app: { gender: 'm', age: 'elder', lower: 'lungi', lungi: '#f4f1ea', shirt: '#f2efe6', turban: false }, home: POI.moneylender },
      { id: 'anjali', name: { en: 'Anjali', te: 'అంజలి' }, role: { en: 'Bank officer', te: 'బ్యాంకు అధికారి' }, type: 'bank', app: { gender: 'f', saree: '#6b3fa0' } },
      { id: 'kistaiah', name: { en: 'Kistaiah', te: 'కిష్టయ్య' }, role: { en: 'Shepherd', te: 'గొర్రెల కాపరి' }, type: 'shepherd', app: { gender: 'm', lower: 'lungi', turban: true, shirt: '#e9dfbf' } },
      { id: 'pochamma', name: { en: 'Pochamma', te: 'పోచమ్మ' }, role: { en: 'Neighbour farmer', te: 'పక్కింటి రైతు' }, type: 'farmer', app: { gender: 'f', saree: '#c22b2b' }, home: 'nearPlayer' },
    ];
    for (const d of named) {
      const home = d.home === 'nearPlayer' ? takeHouse(HOME) : d.home || takeHouse(d.type === 'agent' || d.type === 'bank' ? null : null);
      this.make(d, home);
    }
    const scale = G.preset.npc;
    const add = (type, n, app, homes = null) => {
      for (let i = 0; i < Math.round(n * scale); i++) {
        const g = app.gender || (RNG() < 0.5 ? 'm' : 'f');
        const names = g === 'm' ? [NAMES_M, NAMES_M_TE] : [NAMES_F, NAMES_F_TE];
        let nm; if (app.age === 'child') { const k = NAMES_KID[Math.floor(RNG() * NAMES_KID.length)]; nm = { en: k[0], te: k[1] }; } else { const k = Math.floor(RNG() * names[0].length); nm = { en: names[0][k], te: names[1][k] }; }
        const home = homes ? homes[Math.floor(RNG() * homes.length)] : takeHouse();
        this.make({ id: type + i + '_' + this.list.length, name: nm, role: null, type, app: Object.assign({}, app, { gender: g }) }, home);
      }
    };
    add('farmer', 14, {}); add('woman', 9, { gender: 'f' }); add('child', 10, { age: 'child' }); add('elder', 6, { age: 'elder' });
    add('trader', 4, { gender: 'm', lower: 'pants' }, [POI.yard.office]); add('townsfolk', 8, {}, POI.townDoors.map((d) => ({ door: d, x: d.x, z: d.z }))); add('herder', 1, { gender: 'm', age: 'elder', turban: true });
    add('seetha', 7, {}, POI.seethaHouses.length ? POI.seethaHouses : POI.houses);
    // assign NPC farmer fields near home
    const npcFields = Fields.list.filter((f) => !f.isPlayer && !f.avail && f.owner !== 'none');
    for (const n of this.list) if (n.type === 'farmer' || n.type === 'seetha') {
      let best = null, bd = 1e9; for (const f of npcFields) { const d = Math.hypot(f.x - n.home.x, f.z - n.home.z) + (f.taken ? 300 : 0); if (d < bd) { bd = d; best = f; } }
      if (best) { n.field = best; best.taken = true; }
    }
  },
  make(d, home) {
    const app = Humans.appearance(d.app || {});
    const door = home.door || home;
    const h = Humans.create(app, door.x, door.z); if (!h) return null;
    const n = { id: d.id, name: d.name, role: d.role, type: d.type, shop: d.shop, h, home: { x: door.x, z: door.z, house: home }, path: null, pi: 0, target: null, planKey: '', jitter: (RNG() - 0.5) * 0.8, speed: app.age === 'elder' ? 0.95 : app.age === 'child' ? 1.35 : 1.2, thinkT: RNG() * 2, named: !!d.role, talkT: 0 };
    h.x = door.x; h.z = door.z; h.y = World.groundHeight(h.x, h.z);
    this.list.push(n); this.byId[n.id] = n;
    return n;
  },
  shelterNear(x, z) { let best = null, bd = 1e9; for (const s of POI.shelters) { const d = Math.hypot(s.x - x, s.z - z); if (d < bd) { bd = d; best = s; } } return bd < 140 ? best : null; },
  seat(list, n) { if (!list || !list.length) return null; const k = Math.abs(hashStr(n.id) * 1000 | 0) % list.length; return list[k]; },
  // decide where this NPC should be right now
  plan(n) {
    const hr = (Time.hour() + n.jitter + 24) % 24;
    const W = Weather.cur; const day = Time.weekday(); const fest = Time.festivalToday();
    const home = { x: n.home.x, z: n.home.z, pose: 'idle', key: 'home' };
    const inside = { x: n.home.x, z: n.home.z, inside: true, key: 'inside' };
    const P = POI;
    if (hr >= 21.8 || hr < 5.2) return inside;
    // festival gatherings in the evening
    if (fest && hr > 16.5 && hr < 20.5 && n.type !== 'teastall' && n.type !== 'trader' && n.type !== 'townsfolk') {
      const place = fest.place === 'lake' ? P.ghat : fest.place === 'temple' ? P.temple.gate : P.rachabanda.seats[0];
      const a = hashStr(n.id) * TAU; const women = n.h.app.gender === 'f';
      if (fest.id === 'bathukamma' && women) { const rr = 5 + (hashStr(n.id + 'r') * 3 | 0) * 1.5; return { x: place.x + Math.cos(a) * rr, z: place.z + Math.sin(a) * rr, pose: 'dance', key: 'fest', circle: { x: place.x, z: place.z, r: rr } }; }
      return { x: place.x + Math.cos(a) * 12, z: place.z + Math.sin(a) * 12, pose: fest.id === 'bonalu' && women ? 'idle' : 'talk', key: 'fest', carry: fest.id === 'bonalu' && women ? 'pot' : null };
    }
    // heavy rain: shelter
    if (W.rain > 0.35 && n.type !== 'bank' && n.type !== 'doctor') {
      const s = this.shelterNear(n.h.x, n.h.z);
      if (s) return { x: s.x + (hashStr(n.id) - 0.5) * 3, z: s.z + (hashStr(n.id + 'z') - 0.5) * 3, pose: 'idle', key: 'shelter' + s.x, run: true };
      return inside;
    }
    const heatRest = W.id === 'heatwave' && hr > 12 && hr < 16;
    const santha = day === SANTHA_WEEKDAY && hr > 9 && hr < 14;
    switch (n.type) {
      case 'farmer': case 'seetha': {
        if (hr < 6.3) return home;
        if (santha && hashStr(n.id) < 0.4) { const st = this.seat(P.santha.stalls, n); return { x: st.x + 1, z: st.z + 1.2, pose: 'talk', key: 'santha' }; }
        const f = n.field;
        const work = (hr < 12.4 || (hr > 14 && hr < 17.6)) && !heatRest;
        if (f && work) {
          const k = Math.floor(hashStr(n.id + Math.floor(Time.totalHours() / 2)) * f.n);
          const c = f.tileCenter(k);
          return { x: c.x, z: c.z, pose: f.crop || f.npcWorking ? (hashStr(n.id + 'p') < 0.5 ? 'work' : 'squat') : 'idle', key: 'field' + f.id + k };
        }
        if (hr < 14) { const s = P.shade[Math.floor(hashStr(n.id) * P.shade.length)] || home; return { x: s.x + 2, z: s.z + 2, pose: 'sit', key: 'rest', rel: 0.02 }; }
        if (n.h.app.gender === 'm' && hr < 20.5 && n.type === 'farmer') { const s = hashStr(n.id) < 0.5 ? this.seat(P.tea.seats, n) : this.seat(P.rachabanda.seats, n); return { x: s.x, z: s.z, ry: s.ry, ay: s.y, pose: 'sit', key: 'evening' + s.x }; }
        return hr < 20.5 ? { ...home, pose: hashStr(n.id) < 0.5 ? 'squat' : 'idle' } : inside;
      }
      case 'woman': {
        if (hr < 7) { const [dx, dz] = [n.home.x, n.home.z]; return { x: dx, z: dz, pose: 'squat', key: 'muggu' }; }
        if (hr < 8.5) { const w = hr < 7.7 ? { x: -20 + 3, z: -68 + 4 } : n.home; return { x: w.x, z: w.z, pose: 'idle', key: 'water' + (hr < 7.7), carry: hr >= 7.7 ? 'pot' : null }; }
        if (santha) { const st = this.seat(P.santha.stalls, n); return { x: st.x, z: st.z + 1.4, pose: 'talk', key: 'santha' }; }
        if (hr < 11) { const s = hashStr(n.id) < 0.5 ? P.kirana.counter : P.temple.inner; return { x: s.x + 1, z: s.z + 1, pose: 'talk', key: 'errand' }; }
        if (hr < 16) return inside;
        if (hr < 17.5) return { x: P.temple.inner.x + (hashStr(n.id) - 0.5) * 6, z: P.temple.inner.z + (hashStr(n.id + 'q') - 0.5) * 6, pose: 'idle', key: 'temple' };
        return hr < 20.5 ? { ...home, pose: 'squat' } : inside;
      }
      case 'child': {
        const schoolDay = day !== SANTHA_WEEKDAY && !fest;
        if (hr < 8.2) return { ...home, pose: 'idle', wander: 3 };
        if (schoolDay && hr < 12.5) return hr < 8.9 ? { x: P.school.gate[0], z: P.school.gate[1], pose: 'idle', key: 'gate' } : { x: P.school.classes[0], z: P.school.classes[1], inside: true, key: 'class' };
        if (schoolDay && hr < 13.5) return { x: P.school.yard[0], z: P.school.yard[1], pose: 'idle', key: 'play', wander: 8, run: true };
        if (schoolDay && hr < 16) return { x: P.school.classes[0], z: P.school.classes[1], inside: true, key: 'class2' };
        if (hr < 18.3) { const s = hashStr(n.id) < 0.5 ? P.rachabanda.seats[0] : P.temple.gate; return { x: s.x + 6, z: s.z + 6, pose: 'idle', key: 'play2', wander: 9, run: true }; }
        return hr < 19.5 ? home : inside;
      }
      case 'elder': {
        if (hr < 7.5) return { x: P.temple.inner.x, z: P.temple.inner.z + 2, pose: 'sit', key: 'temple', rel: 1.02 };
        if (hr < 10.5 || (hr > 16 && hr < 19.5)) { const s = hr < 10.5 ? this.seat(P.tea.seats, n) : this.seat(P.rachabanda.seats, n); return { x: s.x, z: s.z, ry: s.ry, ay: s.y, pose: 'sit', key: 'sit' + s.x }; }
        if (hr < 13) { const s = this.seat(P.rachabanda.seats, n); return { x: s.x, z: s.z, ry: s.ry, ay: s.y, pose: 'sit', key: 'rb' }; }
        return hr < 19.5 ? inside : inside;
      }
      case 'shop': { const s = P[n.shop]; if ((hr > 7 && hr < 13) || (hr > 15 && hr < 21)) return { x: s.inside[0], z: s.inside[1], pose: 'idle', key: 'counter', face: s.counter }; return hr < 21 ? home : inside; }
      case 'teastall': return hr > 5.5 && hr < 21.5 ? { x: P.tea.owner.x, z: P.tea.owner.z, pose: hr % 1 < 0.5 ? 'idle' : 'work', key: 'stall', face: P.tea.counter } : inside;
      case 'mechanic': return hr > 8 && hr < 19 ? { x: P.workshop.bay.x, z: P.workshop.bay.z, pose: 'squat', key: 'bay' } : hr < 20 ? (() => { const s = this.seat(P.tea.seats, n); return { x: s.x, z: s.z, ry: s.ry, ay: s.y, pose: 'sit', key: 'tea' }; })() : inside;
      case 'official': return hr > 9.5 && hr < 13 ? { x: P.panchayat.door[0], z: P.panchayat.door[1], pose: 'talk', key: 'office' } : hr > 16 && hr < 18.5 ? { x: P.rachabanda.seats[3].x, z: P.rachabanda.seats[3].z, ry: P.rachabanda.seats[3].ry, ay: P.rachabanda.seats[3].y, pose: 'sit', key: 'rb' } : hr < 21 ? home : inside;
      case 'doctor': return hr > 9 && hr < 17 ? { x: P.phc.inside[0], z: P.phc.inside[1], pose: 'idle', key: 'phc', face: P.phc.counter } : inside;
      case 'teacher': return hr > 8.6 && hr < 16.5 ? { x: P.school.classes[0], z: P.school.classes[1], inside: hr > 9, pose: 'talk', key: 'school' } : hr < 17.3 ? { x: P.busStop.stop.x, z: P.busStop.stop.z - 1.5, pose: 'idle', key: 'bus' } : inside;
      case 'moneylender': { const d = n.home.house.door; return hr > 7 && hr < 20 ? { x: d.x, z: d.z, pose: 'sit', key: 'veranda', rel: 0.95 } : inside; }
      case 'bank': return hr > 9.8 && hr < 17 ? { x: P.bank.x, z: P.bank.z, pose: 'idle', key: 'bank' } : { x: P.bank.x + 8, z: P.bank.z, inside: true, key: 'gone' };
      case 'agent': case 'trader': return hr > 7.5 && hr < 18.5 ? { x: P.yard.weigh.x + (n.type === 'trader' ? (hashStr(n.id) - 0.5) * 30 : 3), z: P.yard.weigh.z + (n.type === 'trader' ? hashStr(n.id + 'z') * 20 : 1), pose: n.type === 'agent' ? 'talk' : 'idle', key: 'yard' } : { x: P.yard.office.x, z: P.yard.office.z, inside: true, key: 'gone' };
      case 'townsfolk': { const k = Math.floor(hashStr(n.id + Math.floor(Time.totalHours() / 1.5)) * POI.townDoors.length); const d = POI.townDoors[k]; return hr > 7 && hr < 21 ? { x: d.x, z: d.z, pose: 'talk', key: 'town' + k } : inside; }
      case 'shepherd': case 'herder': {
        const zone = n.type === 'shepherd' ? { x: -40, z: -420 } : { x: -150, z: -210 };
        if (hr > 7 && hr < 17.3) { const k = Math.floor(Time.totalHours() / 1.2); return { x: zone.x + (hash2(k, 3) - 0.5) * 60, z: zone.z + (hash2(k, 7) - 0.5) * 40, pose: 'idle', key: 'graze' + k, carry: 'stick' }; }
        return hr < 19 ? home : inside;
      }
    }
    return home;
  },
  think(n) {
    const t = this.plan(n);
    const key = t.key + (t.inside ? 'i' : '');
    n.cur = t;
    if (key === n.planKey && n.path) return;
    n.planKey = key;
    n.h.carry = t.carry || null;
    const sx = n.h.x, sz = n.h.z;
    if (t.inside && Math.hypot(sx - t.x, sz - t.z) < 3) { n.h.visible = false; n.path = null; return; }
    if (!n.h.visible) { n.h.visible = true; n.h.x = n.home.x; n.h.z = n.home.z; }
    n.path = Graph.path(n.h.x, n.h.z, t.x, t.z, 1); n.pi = 0; n.arrived = false;
  },
  update(dt) {
    const P = Player.pos();
    for (const n of this.list) {
      n.thinkT -= dt;
      if (n.thinkT <= 0) { n.thinkT = 1.2 + frand() * 1.5; if (!n.talking && !n.worker) this.think(n); }
      if (n.worker) continue; // workers are driven by Workers system
      const h = n.h;
      const far = Math.hypot(h.x - P.x, h.z - P.z) > 150;
      // talking to player
      if (n.talking) { h.speed = 0; h.pose = 'talk'; h.yaw = dampAngle(h.yaw, Math.atan2(P.x - h.x, P.z - h.z), 6, dt); continue; }
      // joining in with your fun moves: dance along, wave back, laugh
      if (n.react) {
        if (G.t > n.react.until || !h.visible) n.react = null;
        else { h.speed = 0; h.pose = n.react.pose; h.yaw = dampAngle(h.yaw, Math.atan2(P.x - h.x, P.z - h.z), 5, dt); h.y = World.groundHeight(h.x, h.z); continue; }
      }
      if (!h.visible) continue;
      if (n.path && n.pi < n.path.length) {
        const wp = n.path[n.pi];
        const dx = wp.x - h.x, dz = wp.z - h.z; const d = Math.hypot(dx, dz);
        const sp = n.speed * (n.cur && n.cur.run ? 2.2 : 1) * (Weather.cur.rain > 0.35 ? 1.6 : 1) * (far ? 3 : 1);
        if (d < 0.5) { n.pi++; }
        else {
          const step = Math.min(d, sp * dt);
          h.x += dx / d * step; h.z += dz / d * step;
          h.yaw = dampAngle(h.yaw, Math.atan2(dx, dz), 8, dt);
          h.speed = sp; h.pose = 'walk';
        }
        if (!far) { const q = { x: h.x, z: h.z }; if (World.collideCircle(q, 0.3)) { h.x = q.x; h.z = q.z; } }
        h.y = World.groundHeight(h.x, h.z);
        if (n.pi >= n.path.length) { n.arrived = true; if (n.cur && n.cur.inside) h.visible = false; }
      } else {
        // arrived: act
        const t = n.cur || {};
        h.speed = 0;
        h.pose = t.pose || 'idle';
        if (t.circle) { // dance around a centre
          const a = Math.atan2(h.z - t.circle.z, h.x - t.circle.x) + dt * 0.25;
          h.x = t.circle.x + Math.cos(a) * t.circle.r; h.z = t.circle.z + Math.sin(a) * t.circle.r; h.yaw = Math.atan2(-Math.sin(a), Math.cos(a)) + Math.PI;
          h.y = World.groundHeight(h.x, h.z);
        } else if (t.wander) {
          n.wT = (n.wT || 0) - dt;
          if (n.wT <= 0) { n.wT = 1.5 + frand() * 3; n.wx = t.x + (frand() - 0.5) * t.wander * 2; n.wz = t.z + (frand() - 0.5) * t.wander * 2; }
          const dx = n.wx - h.x, dz = n.wz - h.z, d = Math.hypot(dx, dz);
          if (d > 0.4) { const sp = t.run ? 2.8 : 1.1; h.x += dx / d * sp * dt; h.z += dz / d * sp * dt; h.yaw = dampAngle(h.yaw, Math.atan2(dx, dz), 8, dt); h.speed = sp; h.pose = 'walk'; h.y = World.groundHeight(h.x, h.z); }
        } else {
          if (t.ry !== undefined) h.yaw = dampAngle(h.yaw, t.ry, 4, dt);
          else if (t.face) h.yaw = dampAngle(h.yaw, Math.atan2(t.face.x - h.x, t.face.z - h.z), 4, dt);
          if (t.pose === 'sit') { h.y = t.ay !== undefined ? t.ay : World.groundHeight(h.x, h.z) + (t.rel !== undefined ? t.rel : 0.45); }
          else h.y = World.groundHeight(h.x, h.z);
          // look at player when near
          const pd = Math.hypot(P.x - h.x, P.z - h.z);
          h.headYaw = pd < 6 ? clamp(angleDiff(h.yaw, Math.atan2(P.x - h.x, P.z - h.z)), -1, 1) : damp(h.headYaw, 0, 3, dt);
        }
      }
    }
  },
  nearestTo(x, z, r = 2.4) { let best = null, bd = r; for (const n of this.list) { if (!n.h.visible) continue; const d = Math.hypot(n.h.x - x, n.h.z - z); if (d < bd) { bd = d; best = n; } } return best; },
  // teleport everyone to their planned spot (after sleep / load)
  resync() { for (const n of this.list) { if (n.worker) continue; const t = this.plan(n); n.cur = t; n.planKey = t.key + (t.inside ? 'i' : ''); n.path = null; n.h.visible = !t.inside; n.h.x = t.x + (frand() - 0.5); n.h.z = t.z + (frand() - 0.5); n.h.y = World.groundHeight(n.h.x, n.h.z); n.h.carry = t.carry || null; } },
};

// ---------------- animals ----------------
const Fauna = {
  list: [], herdT: 0,
  spawn() {
    RNG = mulberry32(5151);
    // ambient animals stop at a budget so working animals (bullocks, dairy buffaloes) always have room
    this.budget = Math.round(Animals.max * (0.62 + 0.38 * G.preset.npc)) - 30;
    this.spawning = true;
    // shepherd's flock and the herder's cattle first, then strays, then house animals
    const sh = NPCs.byId.kistaiah;
    for (let i = 0; i < 24; i++) this.add('sheep', sh.home.x + (RNG() - 0.5) * 8, sh.home.z + (RNG() - 0.5) * 8, { mode: 'herd', leader: sh, spread: 12 });
    const hd = NPCs.list.find((n) => n.type === 'herder');
    if (hd) for (let i = 0; i < 10; i++) this.add(RNG() < 0.5 ? 'buffalo' : 'cow', hd.home.x + (RNG() - 0.5) * 8, hd.home.z + (RNG() - 0.5) * 8, { mode: 'herd', leader: hd, spread: 16 });
    for (let i = 0; i < 9; i++) { const a = RNG() * TAU, d = 20 + RNG() * 110; this.add('dog', Math.cos(a) * d, Math.sin(a) * d, { mode: 'dog', r: 70 }); }
    for (let i = 0; i < 3; i++) this.add('dog', SEETHA.x + (RNG() - 0.5) * 40, SEETHA.z + (RNG() - 0.5) * 40, { mode: 'dog', r: 40 });
    for (let i = 0; i < 8; i++) this.add('goat', SEETHA.x + 60 + RNG() * 20, SEETHA.z - 20 + RNG() * 20, { mode: 'wander', r: 25 });
    const houses = POI.houses;
    for (const hs of houses) {
      if (hs.shed && RNG() < 0.9) { const n = 1 + Math.floor(RNG() * 2); for (let i = 0; i < n; i++) this.add(RNG() < 0.55 ? 'buffalo' : 'cow', hs.shed.x + (i - 0.5) * 2, hs.shed.z + 2.8, { mode: 'tether', r: 1.6 }); }
      if (RNG() < 0.22) { const [x, z] = lw(hs.x, hs.z, hs.ry, hs.w / 2 + 2, hs.d / 2 + 2); for (let i = 0; i < 3 + Math.floor(RNG() * 4); i++) this.add('chicken', x + RNG() * 2, z + RNG() * 2, { mode: 'wander', r: 7 }); }
      if (RNG() < 0.1) { const [x, z] = lw(hs.x, hs.z, hs.ry, -hs.w / 2 - 2, hs.d / 2 + 1.5); for (let i = 0; i < 2 + Math.floor(RNG() * 3); i++) this.add('goat', x + RNG() * 2, z + RNG() * 2, { mode: 'wander', r: 9 }); }
      if (RNG() < 0.06) this.add('cat', hs.door.x, hs.door.z, { mode: 'wander', r: 8 });
    }
    for (const hs of POI.seethaHouses) if (RNG() < 0.35) this.add(RNG() < 0.5 ? 'buffalo' : 'cow', hs.x + 5, hs.z + 3, { mode: 'tether', r: 1.6 });
    this.spawning = false;
  },
  add(sp, x, z, o) {
    if (this.spawning && Animals.list.length >= this.budget) return null;
    const a = Animals.create(sp, x, z, o); if (!a) return null;
    a.mode = o.mode; a.home = { x, z }; a.r = o.r || 5; a.leader = o.leader; a.spread = o.spread || 10; a.timer = frand() * 3; a.tx = x; a.tz = z;
    a.ox = (frand() - 0.5) * a.spread; a.oz = (frand() - 0.5) * a.spread;
    a.y = World.groundHeight(x, z);
    this.list.push(a);
    return a;
  },
  update(dt) {
    const P = Player.pos(); const night = Sky.night > 0.7; const hr = Time.hour();
    for (const a of this.list) {
      if (a.mode === 'vehicle') continue;
      if (a.mode === 'pet') { if (G.started) Pet.steer(a, dt); continue; }
      const far = Math.hypot(a.x - P.x, a.z - P.z) > 170;
      a.timer -= dt;
      if (a.mode === 'herd' && a.leader) {
        const L = a.leader.h;
        a.visible = L.visible || Math.hypot(a.x - a.leader.home.x, a.z - a.leader.home.z) > 6;
        if (!L.visible) { a.tx = a.leader.home.x + a.ox * 0.4; a.tz = a.leader.home.z + a.oz * 0.4 + 6; }
        else if (a.timer <= 0) { a.timer = 2 + frand() * 4; a.tx = L.x + a.ox + (frand() - 0.5) * 3; a.tz = L.z + a.oz + (frand() - 0.5) * 3; }
      } else if (a.timer <= 0) {
        a.timer = 3 + frand() * 6;
        if (a.mode === 'tether') { a.tx = a.home.x + (frand() - 0.5) * a.r; a.tz = a.home.z + (frand() - 0.5) * a.r; a.pose = night ? 'lie' : frand() < 0.5 ? 'graze' : 'stand'; }
        else if (a.mode === 'dog') {
          if (hr > 12 && hr < 15 && frand() < 0.6) { a.pose = 'lie'; a.tx = a.x; a.tz = a.z; }
          else { const nd = Graph.nodes[Graph.nearest(a.home.x + (frand() - 0.5) * a.r * 2, a.home.z + (frand() - 0.5) * a.r * 2)]; a.tx = nd.x + (frand() - 0.5) * 4; a.tz = nd.z + (frand() - 0.5) * 4; a.pose = 'stand'; }
          const pd = Math.hypot(P.x - a.x, P.z - a.z);
          if (pd < 14 && frand() < (night ? 0.5 : 0.15)) { Audio2.at('bark', a.x, a.z); a.alert = true; a.happy = !night; } else { a.alert = false; }
        } else { a.tx = a.home.x + (frand() - 0.5) * a.r * 2; a.tz = a.home.z + (frand() - 0.5) * a.r * 2; a.pose = frand() < 0.4 ? 'graze' : 'stand'; }
        if (!far && frand() < 0.08) { const snd = a.S.sound; if (snd !== 'bark') Audio2.at(snd, a.x, a.z); }
      }
      if (!a.visible) continue;
      const dx = a.tx - a.x, dz = a.tz - a.z, d = Math.hypot(dx, dz);
      const maxSp = a.S.speed * (a.mode === 'herd' && d > 12 ? 1.8 : 1) * (far ? 3 : 1);
      if (d > 0.35 && a.pose !== 'lie') {
        a.speed = damp(a.speed, Math.min(maxSp, d * 0.8), 3, dt);
        a.x += dx / d * a.speed * dt; a.z += dz / d * a.speed * dt;
        a.yaw = dampAngle(a.yaw, Math.atan2(dx, dz), 3, dt);
        if (a.pose === 'graze' && d > 1.5) a.pose = 'stand';
        if (!far) { const q = { x: a.x, z: a.z }; if (World.collideCircle(q, a.S.W * 0.6)) { a.x = q.x; a.z = q.z; a.timer = 0; } }
      } else a.speed = damp(a.speed, 0, 5, dt);
      a.y = World.groundHeight(a.x, a.z);
      if (a.mode === 'herd' && a.speed < 0.2 && a.leader.h.visible) a.pose = frand() < 0.01 ? (a.pose === 'graze' ? 'stand' : 'graze') : a.pose;
    }
  },
};
