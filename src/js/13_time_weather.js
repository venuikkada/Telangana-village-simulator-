// ============================================================================
// Game time, calendar, weather simulation, rain & lightning, ambient FX
// ============================================================================
const Time = {
  scale: 1,
  get S() { return G.S; },
  totalMin() { return G.S.time.min; },
  totalHours() { return G.S.time.min / 60; },
  hour() { return (G.S.time.min % 1440) / 60; },
  day() { return Math.floor(G.S.time.min / 1440) + 1; },
  dayFloat() { return G.S.time.min / 1440; },
  dayOfYear() { return (this.day() - 1) % DAYS_PER_YEAR; },
  season() { return Math.floor(this.dayOfYear() / DAYS_PER_SEASON); },
  dayInSeason() { return this.dayOfYear() % DAYS_PER_SEASON; },
  year() { return Math.floor((this.day() - 1) / DAYS_PER_YEAR) + 1; },
  weekday() { return (this.day() - 1) % 7; },
  doy() { const s = SEASONS[this.season()]; return (s.doy0 + (this.dayInSeason() + this.hour() / 24) * s.doyStep) % 365; },
  yearFrac() { return (this.dayOfYear() + this.hour() / 24) / DAYS_PER_YEAR; },
  festivalToday() { const s = this.season(), d = this.dayInSeason(); return FESTIVALS.find((f) => f.season === s && f.day === d) || null; },
  fmtClock() {
    const hr = this.hour(); let h = Math.floor(hr); const m = Math.floor((hr % 1) * 60);
    const mm = String(m).padStart(2, '0');
    if (LANG === 'te') { const p = h < 12 ? (h < 4 ? 'రా.' : 'ఉ.') : h < 16 ? 'మ.' : h < 19 ? 'సా.' : 'రా.'; const h12 = h % 12 === 0 ? 12 : h % 12; return `${p} ${h12}:${mm}`; }
    const ap = h < 12 ? 'AM' : 'PM'; const h12 = h % 12 === 0 ? 12 : h % 12; return `${h12}:${mm} ${ap}`;
  },
  fmtDate() {
    const s = SEASONS[this.season()];
    return L(`Day ${this.dayInSeason() + 1} · ${s.en} · ${WEEKDAYS[this.weekday()].en} · Year ${this.year()}`, `${s.te} · ${this.dayInSeason() + 1}వ రోజు · ${WEEKDAYS[this.weekday()].te} · ${this.year()}వ సంవత్సరం`);
  },
};

const Weather = {
  cur: { id: 'sunny', cloud: 0.1, rain: 0, wind: 0.2, fog: 0, haze: 0.1, windX: 0.2, windZ: 0.05 },
  temp: 28, powerCut: false, strikeT: 5, windA: 0.5, rainHrs24: 0,
  init() {
    const S = G.S;
    if (!S.weather) S.weather = { id: 'partly', left: 240, drought: false };
    this.cur.id = S.weather.id;
    const W = WEATHER[S.weather.id]; Object.assign(this.cur, { cloud: W.cloud, rain: W.rain, wind: W.wind, fog: W.fog, haze: W.haze });
    this.buildRain();
  },
  canalFlowing() { const S = G.S; return S.world.lake > 30 && (Time.season() === 0 || S.village.irrigation || S.world.lake > 70); },
  pickNext() {
    const S = G.S; const s = Time.season(); const hr = Time.hour();
    const w = Object.assign({}, CLIMATE[s]);
    if (S.weather.drought) { for (const k of ['drizzle', 'rain', 'storm']) if (w[k]) w[k] *= 0.1; w.sunny = (w.sunny || 0) + 0.2; w.heatwave = (w.heatwave || 0) + (s === 2 ? 0.2 : 0.08); }
    if (!(hr >= 3.5 && hr < 8.5)) delete w.mist;
    if (s === 0 && Time.dayInSeason() < 2 && !S.weather.drought) { w.rain = (w.rain || 0) + 0.15; w.storm = (w.storm || 0) + 0.05; }
    if (S.weather.forced) { const id = S.weather.forced; S.weather.forced = null; return this.setWeather(id, 180 + frand() * 180); }
    let tot = 0; for (const k in w) tot += w[k];
    let r = frand() * tot; let pick = 'sunny';
    for (const k in w) { r -= w[k]; if (r <= 0) { pick = k; break; } }
    const dur = pick === 'storm' ? 90 + frand() * 120 : pick === 'rain' ? 150 + frand() * 200 : pick === 'mist' ? 120 + frand() * 90 : 200 + frand() * 340;
    this.setWeather(pick, dur);
  },
  setWeather(id, durMin) {
    const S = G.S; const prev = S.weather.id;
    S.weather.id = id; S.weather.left = durMin;
    this.cur.id = id;
    if (prev !== id && G.started) {
      const W = WEATHER[id];
      if (id === 'storm') UI.toast(L('Thunderstorm coming! Take shelter and protect your harvest.', 'ఉరుములతో కూడిన వర్షం వస్తోంది! సురక్షిత ప్రదేశానికి వెళ్ళండి, పంటను కాపాడుకోండి.'), 'warn');
      else if (id === 'heatwave') UI.toast(L('Heat wave warning: crops will need extra water today.', 'వడగాలుల హెచ్చరిక: ఈ రోజు పంటలకు ఎక్కువ నీరు కావాలి.'), 'warn');
      else if (id === 'rain' && prev !== 'storm') UI.toast(L('Heavy rain has started.', 'భారీ వర్షం మొదలైంది.'), 'info');
      Bus.emit('weather', { id, prev });
      void W;
    }
  },
  seasonStart() {
    const S = G.S; const s = Time.season();
    S.weather.drought = s === 0 ? frand() < 0.2 : s === 2 ? frand() < 0.25 : false;
    const name = SEASONS[s];
    UI.toast(L(`${name.en} begins.`, `${name.te} మొదలైంది.`), 'season');
    if (s === 0) Market.news(S.weather.drought ? { en: 'Monsoon fails in the region — drought declared. Water will be scarce.', te: 'ఈ ప్రాంతంలో రుతుపవనాలు విఫలం — కరువు ప్రకటించారు. నీటి కొరత ఉంటుంది.' } : { en: 'Monsoon arrives! Good time to sow paddy, cotton and maize.', te: 'రుతుపవనాలు వచ్చాయి! వరి, పత్తి, మొక్కజొన్న విత్తడానికి మంచి సమయం.' });
    else if (s === 1) Market.news({ en: 'Yasangi season begins. Chilli, groundnut and vegetables do well in the cool months.', te: 'యాసంగి మొదలైంది. చల్లని నెలల్లో మిర్చి, వేరుశెనగ, కూరగాయలు బాగా పండుతాయి.' });
    else Market.news(S.weather.drought ? { en: 'Severe summer: groundwater falling fast. Farm ponds will help.', te: 'తీవ్రమైన ఎండాకాలం: భూగర్భ జలాలు వేగంగా తగ్గుతున్నాయి. పంట కుంటలు ఉపయోగపడతాయి.' } : { en: 'Summer is here. Irrigate early mornings; heat waves are likely.', te: 'ఎండాకాలం వచ్చింది. పొద్దున్నే నీరు పెట్టండి; వడగాలులు రావచ్చు.' });
    if (S.weather.drought) { Bus.emit('drought', {}); this.pickNext(); }
    Finance.seasonSupport();
    Farm.checkLeases();
    Bus.emit('seasonStart', { s });
  },
  // game-time step (minutes)
  tick(dm) {
    const S = G.S; const hrs = dm / 60;
    S.weather.left -= dm;
    const hr = Time.hour();
    if (S.weather.left <= 0 || (S.weather.id === 'mist' && hr > 10)) this.pickNext();
    const W = this.cur;
    const sd = SEASONS[Time.season()];
    const base = sd.temp[0] + (sd.temp[1] - sd.temp[0]) * (0.5 - 0.5 * Math.cos(((hr - 5) / 24) * TAU * 1.0 + (hr > 14 ? 0 : 0)));
    this.temp = base + (WEATHER[S.weather.id].temp || 0) + (S.weather.drought ? 2 : 0);
    // wetness, lake, groundwater
    S.world.wet = clamp01(S.world.wet + W.rain * 0.55 * hrs - (0.08 + (1 - W.cloud) * 0.1 + (this.temp > 34 ? 0.08 : 0)) * hrs * (W.rain > 0.05 ? 0 : 1));
    const cap = S.village.irrigation ? 100 : 88;
    S.world.lake = clamp(S.world.lake + W.rain * 2.6 * hrs - (0.05 + (this.temp > 35 ? 0.08 : 0)) * hrs - (this.canalFlowing() ? 0.03 * hrs : 0), 0, cap);
    S.world.groundwater = clamp(S.world.groundwater + W.rain * 1.1 * hrs + (S.world.lake > 50 ? 0.03 : 0) * hrs - (Time.season() === 2 ? 0.06 : 0.015) * hrs, 0, 100);
    this.rainHrs24 = Math.max(0, this.rainHrs24 + (W.rain > 0.3 ? hrs : 0) - hrs / 24 * this.rainHrs24);
    // power cuts in storms
    if (S.world.powerCut > 0) S.world.powerCut -= dm;
    else if (S.weather.id === 'storm' && frand() < 0.12 * hrs) { S.world.powerCut = 60 + frand() * 120; if (G.started) UI.toast(L('Power cut in the village. Electric pumps have stopped.', 'గ్రామంలో కరెంటు పోయింది. మోటార్లు ఆగిపోయాయి.'), 'warn'); }
    this.powerCut = S.world.powerCut > 0;
  },
  // real-time visual update
  update(dt) {
    const S = G.S; const T = WEATHER[S.weather.id];
    const k = 1 - Math.exp(-dt * 0.25 * Math.max(1, Time.scale));
    const c = this.cur;
    let fogT = T.fog; const hr = Time.hour();
    if (T.fog > 0 && S.weather.id === 'mist') fogT = hr < 9 ? 1 : Math.max(0, 1 - (hr - 9) * 0.8);
    // gentle morning mist in winter even on clear days
    if (Time.season() === 1 && hr > 4.5 && hr < 8.5 && S.weather.id !== 'mist') fogT = Math.max(fogT, 0.25 * (1 - Math.abs(hr - 6.5) / 2));
    c.cloud = lerp(c.cloud, T.cloud, k); c.rain = lerp(c.rain, T.rain, k * 1.3); c.wind = lerp(c.wind, T.wind, k); c.fog = lerp(c.fog, fogT, k); c.haze = lerp(c.haze, T.haze + (Time.season() === 2 ? 0.15 : 0), k);
    this.windA += dt * 0.01 * (frand() - 0.3);
    const gust = 0.75 + 0.25 * Math.sin(G.t * 0.3) + 0.15 * Math.sin(G.t * 1.7);
    c.windX = Math.cos(this.windA) * c.wind * gust; c.windZ = Math.sin(this.windA) * c.wind * gust;
    U.uWind.value.set(c.windX, c.windZ); U.uWindStr.value = c.wind * gust; U.uRain.value = c.rain;
    U.uWet.value = S.world.wet; U.uGreen.value = this.greenness();
    // rain drops
    this.updateRain(dt);
    // lightning
    if (S.weather.id === 'storm' && c.rain > 0.6) {
      this.strikeT -= dt;
      if (this.strikeT <= 0) {
        this.strikeT = 5 + frand() * 14;
        const P = Player.pos();
        const exposed = !Player.vehicle && fieldAt(P.x, P.z) && !Player.inShade();
        const near = exposed && frand() < 0.12;
        const r = Sky.strike(near);
        if (near) { Player.hurt(22, 'lightning'); UI.toast(L('Lightning struck right next to you! Get off the open field.', 'మీ పక్కనే పిడుగు పడింది! పొలం నుంచి బయటకు వెళ్ళండి.'), 'bad'); for (let i = 0; i < 20; i++) FX.emit('spark', r.x, World.groundHeight(r.x, r.z) + 0.5, r.z, (frand() - 0.5) * 6, frand() * 5, (frand() - 0.5) * 6); }
      }
    }
    World.setLakeLevel(S.world.lake / 100);
    if (World.canalWater) { const flow = this.canalFlowing(); World.canalWater.visible = flow; }
    // ambient particles
    const P = Player.pos();
    const pm = G.preset.particles;
    if (Sky.night > 0.6 && c.rain < 0.1 && Time.season() !== 2 && frand() < 0.25 * pm) { const a = frand() * TAU, r = 6 + frand() * 30; const x = P.x + Math.cos(a) * r, z = P.z + Math.sin(a) * r; FX.emit('firefly', x, World.groundHeight(x, z) + 0.6 + frand() * 1.8, z, 0, 0.1, 0); }
    if ((hr > 17 && hr < 19.8) || (hr > 5.8 && hr < 8)) {
      if (frand() < 0.35 * pm) { const ch = POI.chimneys[Math.floor(frand() * POI.chimneys.length)]; if (ch && Math.hypot(ch[0] - P.x, ch[1] - P.z) < 170) { const y = World.groundHeight(ch[0], ch[1]) + 4.2; FX.emit('chimney', ch[0], y, ch[1], c.windX * 0.8, 0.9, c.windZ * 0.8); } }
    }
    const fest = Time.festivalToday();
    if (fest && hr > 16 && hr < 21 && frand() < 0.35 * pm) { const pl = fest.place === 'lake' ? POI.ghat : POI.temple.gate; if (Math.hypot(pl.x - P.x, pl.z - P.z) < 70) FX.emit('petal', pl.x + (frand() - 0.5) * 20, World.groundHeight(pl.x, pl.z) + 6, pl.z + (frand() - 0.5) * 20, 0, -0.2, 0, pick([[0.95, 0.5, 0.6], [0.98, 0.8, 0.2], [0.95, 0.4, 0.2], [0.8, 0.4, 0.9]])); }
    if (c.wind > 0.7 && c.rain < 0.1 && frand() < 0.3 * pm) { const a = frand() * TAU, r = 10 + frand() * 25; FX.emit('dust', P.x + Math.cos(a) * r, P.y + 0.3, P.z + Math.sin(a) * r, c.windX * 6, 0.3, c.windZ * 6); }
  },
  greenness() {
    const t = Time.yearFrac();
    // green peaks late monsoon, dries through summer
    const s = Time.season(), d = Time.dayInSeason() / DAYS_PER_SEASON;
    let g = s === 0 ? 0.55 + d * 0.45 : s === 1 ? 1 - d * 0.55 : 0.4 - d * 0.35;
    if (G.S.weather.drought) g *= 0.6;
    void t;
    return clamp01(g + G.S.world.wet * 0.15);
  },
  // ---- GPU rain ----
  buildRain() {
    const N = 10000;
    const off = new Float32Array(N * 2 * 3), end = new Float32Array(N * 2);
    for (let i = 0; i < N; i++) { const a = frand(), b = frand(), c = frand(); for (let k = 0; k < 2; k++) { off[(i * 2 + k) * 3] = a; off[(i * 2 + k) * 3 + 1] = b; off[(i * 2 + k) * 3 + 2] = c; end[i * 2 + k] = k; } }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(off, 3));
    g.setAttribute('aEnd', new THREE.BufferAttribute(end, 1));
    const m = new THREE.ShaderMaterial({
      uniforms: { uCam: { value: new THREE.Vector3() }, uT: { value: 0 }, uWind: U.uWind, uCol: { value: new THREE.Color(0.7, 0.75, 0.82) }, uAlpha: { value: 0.35 } },
      vertexShader: `attribute float aEnd; uniform vec3 uCam; uniform float uT; uniform vec2 uWind; varying float vA;
        void main(){ float B = 44.0, H = 26.0;
          float ox = position.x * B, oz = fract(position.z * 7.13) * B;
          float x = ox + B * floor((uCam.x - ox) / B + 0.5);
          float z = oz + B * floor((uCam.z - oz) / B + 0.5);
          float y = uCam.y - 8.0 + fract(position.y - uT * (0.85 + position.z * 0.3)) * H;
          vec3 p = vec3(x, y, z);
          vec3 dir = normalize(vec3(uWind.x*0.35, -1.0, uWind.y*0.35));
          p -= dir * aEnd * 0.9;
          vA = 1.0 - aEnd*0.6;
          gl_Position = projectionMatrix * viewMatrix * vec4(p, 1.0); }`,
      fragmentShader: `uniform vec3 uCol; uniform float uAlpha; varying float vA; void main(){ gl_FragColor = vec4(uCol, uAlpha*vA);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }`,
      transparent: true, depthWrite: false,
    });
    this.rain = new THREE.LineSegments(g, m); this.rain.frustumCulled = false; this.rain.renderOrder = 6;
    G.scene.add(this.rain);
  },
  updateRain(dt) {
    const r = this.rain; if (!r) return;
    const inten = this.cur.rain;
    const n = Math.floor(G.preset.rainDrops * inten);
    r.visible = n > 20;
    r.geometry.setDrawRange(0, n * 2);
    const u = r.material.uniforms;
    u.uCam.value.copy(G.camera.position); u.uT.value += dt * 1.45;
    const lum = 0.28 + Sky.daylight * 0.32;
    u.uCol.value.setRGB(lum * 0.85, lum * 0.9, lum);
    u.uAlpha.value = 0.14 + inten * 0.14;
    // splashes near camera
    if (inten > 0.2 && frand() < inten * G.preset.particles) {
      const c = G.camera.position;
      for (let i = 0; i < 3; i++) { const x = c.x + (frand() - 0.5) * 24, z = c.z + (frand() - 0.5) * 24; FX.emit('splash', x, World.groundHeight(x, z) + 0.05, z, 0, 1.2, 0); }
    }
  },
};
