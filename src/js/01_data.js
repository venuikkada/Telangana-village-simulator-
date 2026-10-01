// ============================================================================
// Game data tables (bilingual)
// ============================================================================
const GAME_SEC_PER_HOUR = 20;            // real seconds per game hour at 1x
const DAYS_PER_SEASON = 8;
const DAYS_PER_YEAR = DAYS_PER_SEASON * 3;
const TILE = 2;                           // metres per farm tile
const ACRE_M2 = 576;                      // in-game square metres per acre (scaled world)

const SEASONS = [
  { id: 'vanakalam', en: 'Vanakalam (Kharif)', te: 'వానాకాలం (ఖరీఫ్)', short: { en: 'Kharif', te: 'వానాకాలం' }, months: { en: 'Jun–Oct', te: 'జూన్–అక్టోబర్' }, temp: [24, 32], doy0: 161, doyStep: 18, green: 1.0 },
  { id: 'yasangi', en: 'Yasangi (Rabi)', te: 'యాసంగి (రబీ)', short: { en: 'Rabi', te: 'యాసంగి' }, months: { en: 'Nov–Feb', te: 'నవంబర్–ఫిబ్రవరి' }, temp: [14, 29], doy0: 305, doyStep: 15, green: 0.62 },
  { id: 'summer', en: 'Endakalam (Summer)', te: 'ఎండాకాలం', short: { en: 'Summer', te: 'ఎండాకాలం' }, months: { en: 'Mar–May', te: 'మార్చి–మే' }, temp: [27, 42], doy0: 60, doyStep: 12.5, green: 0.12 },
];
const WEEKDAYS = [
  { en: 'Mon', te: 'సోమవారం' }, { en: 'Tue', te: 'మంగళవారం' }, { en: 'Wed', te: 'బుధవారం' }, { en: 'Thu', te: 'గురువారం' },
  { en: 'Fri', te: 'శుక్రవారం' }, { en: 'Sat', te: 'శనివారం' }, { en: 'Sun', te: 'ఆదివారం' },
];
const SANTHA_WEEKDAY = 6; // weekly market on Sunday

const FESTIVALS = [
  { id: 'bonalu', season: 0, day: 2, en: 'Bonalu', te: 'బోనాలు', desc: { en: 'Women carry decorated pots to the village goddess. Drums in the evening at the temple.', te: 'అలంకరించిన బోనాలతో మహిళలు గ్రామ దేవతకు ఊరేగింపుగా వెళ్తారు. సాయంత్రం గుడి దగ్గర డప్పుల మోత.' }, place: 'temple' },
  { id: 'bathukamma', season: 0, day: 7, en: 'Bathukamma', te: 'బతుకమ్మ', desc: { en: 'Flower festival. Women stack flowers into Bathukammas and dance in circles by the lake at dusk.', te: 'పూల పండుగ. మహిళలు పూలతో బతుకమ్మలను పేర్చి, సాయంత్రం చెరువు కట్ట దగ్గర ఆడి పాడతారు.' }, place: 'lake' },
  { id: 'sankranti', season: 1, day: 4, en: 'Sankranti', te: 'సంక్రాంతి', desc: { en: 'Harvest festival. Muggulu at every door, kites in the sky, cattle decorated.', te: 'పంటల పండుగ. ప్రతి ఇంటి ముందు ముగ్గులు, ఆకాశంలో గాలిపటాలు, పశువులకు అలంకరణ.' }, place: 'rachabanda' },
  { id: 'ugadi', season: 2, day: 1, en: 'Ugadi', te: 'ఉగాది', desc: { en: 'Telugu New Year. Mango-leaf thoranams on doors and Ugadi pachadi at the temple.', te: 'తెలుగు సంవత్సరాది. గుమ్మాలకు మామిడి తోరణాలు, గుడిలో ఉగాది పచ్చడి.' }, place: 'temple' },
];

// ---------- weather ----------
const WEATHER = {
  sunny:    { en: 'Sunny', te: 'ఎండ', icon: 'sun', cloud: 0.10, rain: 0, wind: 0.22, fog: 0, haze: 0.1, temp: 0 },
  partly:   { en: 'Partly cloudy', te: 'పాక్షిక మేఘాలు', icon: 'partly', cloud: 0.42, rain: 0, wind: 0.3, fog: 0, haze: 0.05, temp: -1 },
  cloudy:   { en: 'Cloudy', te: 'మేఘావృతం', icon: 'cloud', cloud: 0.8, rain: 0, wind: 0.35, fog: 0.08, haze: 0, temp: -2 },
  windy:    { en: 'Gusty winds', te: 'ఈదురుగాలులు', icon: 'wind', cloud: 0.32, rain: 0, wind: 1.0, fog: 0, haze: 0.25, temp: 0, dust: true },
  heatwave: { en: 'Heat wave', te: 'వడగాలులు', icon: 'heat', cloud: 0.04, rain: 0, wind: 0.45, fog: 0, haze: 0.7, temp: 5 },
  mist:     { en: 'Morning mist', te: 'పొగమంచు', icon: 'fog', cloud: 0.3, rain: 0, wind: 0.05, fog: 1.0, haze: 0, temp: -3 },
  drizzle:  { en: 'Light rain', te: 'చిరుజల్లులు', icon: 'drizzle', cloud: 0.88, rain: 0.32, wind: 0.3, fog: 0.15, haze: 0, temp: -3 },
  rain:     { en: 'Heavy rain', te: 'భారీ వర్షం', icon: 'rain', cloud: 0.98, rain: 0.85, wind: 0.55, fog: 0.35, haze: 0, temp: -5 },
  storm:    { en: 'Thunderstorm', te: 'ఉరుములు మెరుపులతో వర్షం', icon: 'storm', cloud: 1.0, rain: 1.0, wind: 0.95, fog: 0.4, haze: 0, temp: -6, lightning: true },
};
const CLIMATE = [
  { sunny: 0.14, partly: 0.2, cloudy: 0.19, drizzle: 0.19, rain: 0.16, storm: 0.1, windy: 0.02 },
  { sunny: 0.44, partly: 0.25, cloudy: 0.1, mist: 0.13, drizzle: 0.05, windy: 0.03 },
  { sunny: 0.4, heatwave: 0.26, windy: 0.14, partly: 0.1, storm: 0.07, cloudy: 0.03 },
];

// ---------- crops ----------
// yield: quintals per acre at full health; price: base ₹/quintal; days: growth days; water: soil-water use per game hour
const CROPS = {
  paddy:     { en: 'Paddy', te: 'వరి', seedCost: 1800, days: 4.0, yield: 24, price: 2300, msp: 2369, vol: 0.035, depth: 900, water: 2.6, wLo: 55, wHi: 100, nut: 1.0, pest: 0.5, pestName: { en: 'Brown planthopper', te: 'దోమపోటు' }, soil: { red: 0.95, black: 1.06 }, season: [1.0, 0.95, 0.72], spoil: 0.002, heap: '#d6ad55', leaf: '#5d9a37', ripe: '#cfa84a', fruit: '#e0c060', fruitRipe: '#d9b34f', proc: true },
  cotton:    { en: 'Cotton', te: 'పత్తి', seedCost: 2600, days: 5.0, yield: 9, price: 7200, msp: 7710, vol: 0.06, depth: 420, water: 1.3, wLo: 30, wHi: 80, nut: 1.0, pest: 0.9, pestName: { en: 'Pink bollworm', te: 'గులాబీ రంగు పురుగు' }, soil: { red: 0.86, black: 1.15 }, season: [1.0, 0.82, 0.62], spoil: 0.001, heap: '#f4f1ea', leaf: '#3f7a32', ripe: '#6b6a3a', fruit: '#8fae55', fruitRipe: '#f7f5ee', proc: true },
  maize:     { en: 'Maize', te: 'మొక్కజొన్న', seedCost: 2200, days: 3.5, yield: 26, price: 2100, msp: 2400, vol: 0.05, depth: 700, water: 1.5, wLo: 35, wHi: 85, nut: 1.25, pest: 0.75, pestName: { en: 'Fall armyworm', te: 'కత్తెర పురుగు' }, soil: { red: 1.05, black: 1.0 }, season: [1.0, 1.05, 0.76], spoil: 0.004, heap: '#e9b43a', leaf: '#4f9a3a', ripe: '#b9a15a', fruit: '#9fbf5a', fruitRipe: '#e8c257', proc: true },
  chilli:    { en: 'Chilli', te: 'మిర్చి', seedCost: 7500, days: 5.0, yield: 12, price: 14000, msp: 0, vol: 0.12, depth: 160, water: 1.35, wLo: 35, wHi: 80, nut: 1.3, pest: 1.0, pestName: { en: 'Thrips', te: 'తామర పురుగు' }, soil: { red: 1.1, black: 1.0 }, season: [0.95, 1.06, 0.7], spoil: 0.003, heap: '#b3261e', leaf: '#3c8a33', ripe: '#4c7a2a', fruit: '#3f9a2e', fruitRipe: '#c0231b', proc: false },
  turmeric:  { en: 'Turmeric', te: 'పసుపు', seedCost: 14000, days: 6.0, yield: 22, price: 10000, msp: 0, vol: 0.09, depth: 220, water: 1.45, wLo: 40, wHi: 85, nut: 1.3, pest: 0.4, pestName: { en: 'Rhizome rot', te: 'దుంప కుళ్ళు' }, soil: { red: 1.1, black: 0.95 }, season: [1.0, 0.9, 0.62], spoil: 0.001, heap: '#e3a01b', leaf: '#5aa042', ripe: '#b49a3c', fruit: '#e0a020', fruitRipe: '#e3a01b', proc: false },
  groundnut: { en: 'Groundnut', te: 'వేరుశెనగ', seedCost: 5500, days: 3.5, yield: 9, price: 6500, msp: 7263, vol: 0.06, depth: 300, water: 1.05, wLo: 28, wHi: 75, nut: 0.8, pest: 0.5, pestName: { en: 'Leaf miner', te: 'ఆకుముడత పురుగు' }, soil: { red: 1.15, black: 0.86 }, season: [1.0, 1.05, 0.85], spoil: 0.004, heap: '#b88a55', leaf: '#4f9a3c', ripe: '#8a8a40', fruit: '#e8c93c', fruitRipe: '#e8c93c', proc: true },
  tomato:    { en: 'Tomato', te: 'టమాటా', seedCost: 4000, days: 2.5, yield: 80, price: 1500, msp: 0, vol: 0.22, depth: 260, water: 1.7, wLo: 40, wHi: 80, nut: 1.3, pest: 0.8, pestName: { en: 'Fruit borer', te: 'కాయ తొలుచు పురుగు' }, soil: { red: 1.05, black: 1.0 }, season: [0.9, 1.1, 0.8], spoil: 0.09, heap: '#c9302a', leaf: '#3f8a35', ripe: '#56802e', fruit: '#6fa83a', fruitRipe: '#d0342b', proc: false },
};
const CROP_IDS = Object.keys(CROPS);
const MANGO = { en: 'Mango', te: 'మామిడి', price: 3800, spoil: 0.08, heap: '#e9a22a' };
const PRODUCE = Object.assign({}, CROPS, { mango: MANGO, milk: { en: 'Milk', te: 'పాలు', price: 0, spoil: 0 } });

const STAGES = [
  { at: 0, en: 'Seedling', te: 'మొలక దశ' },
  { at: 0.22, en: 'Growing', te: 'పెరుగుదల దశ' },
  { at: 0.5, en: 'Flowering', te: 'పూత దశ' },
  { at: 0.72, en: 'Maturing', te: 'కాపు దశ' },
  { at: 1.0, en: 'Ready to harvest', te: 'కోతకు సిద్ధం' },
];
const TILE_STATE_NAMES = [
  { en: 'Unploughed', te: 'దున్నని నేల' },
  { en: 'Ploughed', te: 'దున్నిన నేల' },
  { en: 'Seedbed ready', te: 'విత్తనానికి సిద్ధం' },
  { en: 'Sown', te: 'విత్తారు' },
];
const SOILS = { red: { en: 'Red soil (chalka)', te: 'ఎర్ర నేల (చల్క)' }, black: { en: 'Black cotton soil', te: 'నల్ల రేగడి నేల' } };

// ---------- shop items ----------
const ITEMS = {
  urea:      { en: 'Urea', te: 'యూరియా', unit: { en: '45 kg bag', te: '45 కిలోల బస్తా' }, price: 270, kind: 'fert', nut: 26, shop: 'seed' },
  dap:       { en: 'DAP', te: 'డీఏపీ', unit: { en: '50 kg bag', te: '50 కిలోల బస్తా' }, price: 1350, kind: 'fert', nut: 38, shop: 'seed' },
  complex:   { en: 'NPK complex', te: 'కాంప్లెక్స్ ఎరువు', unit: { en: '50 kg bag', te: '50 కిలోల బస్తా' }, price: 1470, kind: 'fert', nut: 44, shop: 'seed' },
  organic:   { en: 'Farmyard manure', te: 'పశువుల ఎరువు', unit: { en: 'trolley', te: 'ట్రాలీ' }, price: 3000, kind: 'fert', nut: 22, soil: 12, shop: 'seed' },
  pesticide: { en: 'Pesticide', te: 'పురుగుమందు', unit: { en: '1 litre', te: '1 లీటరు' }, price: 650, kind: 'chem', shop: 'seed' },
  herbicide: { en: 'Herbicide', te: 'కలుపు మందు', unit: { en: '1 litre', te: '1 లీటరు' }, price: 480, kind: 'chem', shop: 'seed' },
  safety:    { en: 'Spraying safety kit', te: 'పిచికారీ రక్షణ కిట్', unit: { en: 'mask + gloves', te: 'మాస్క్ + గ్లౌజులు' }, price: 900, kind: 'gear', shop: 'seed', once: true },
  feed:      { en: 'Cattle feed', te: 'పశువుల దాణా', unit: { en: '50 kg bag', te: '50 కిలోల బస్తా' }, price: 1400, kind: 'feed', shop: 'kirana' },
  diesel:    { en: 'Diesel can', te: 'డీజిల్ క్యాన్', unit: { en: '20 litres', te: '20 లీటర్లు' }, price: 1990, kind: 'fuel', shop: 'kirana' },
  pumppart:  { en: 'Pump spare part', te: 'పంపు విడిభాగం', unit: { en: 'set', te: 'సెట్' }, price: 4500, kind: 'part', shop: 'workshop' },
};
const FOODS = {
  tea:    { en: 'Chai', te: 'చాయ్', price: 15, energy: 12, health: 0 },
  samosa: { en: 'Samosa & chai', te: 'సమోసా & చాయ్', price: 40, energy: 26, health: 2 },
  meal:   { en: 'Jonna rotte meal', te: 'జొన్న రొట్టె భోజనం', price: 90, energy: 55, health: 8 },
  majjiga:{ en: 'Buttermilk (majjiga)', te: 'మజ్జిగ', price: 20, energy: 10, health: 4, cool: true },
};
const DIESEL_PRICE = 95; // ₹ per litre at the pump

// ---------- implements ----------
const IMPLEMENTS = {
  bplough:    { en: 'Wooden plough', te: 'నాగలి', op: 'plough', width: 1.5, maxSpeed: 1.9, price: 0, bullock: true },
  bcart:      { en: 'Bullock cart', te: 'ఎడ్లబండి', op: null, cargo: 8, price: 0, bullock: true },
  plough:     { en: 'MB plough', te: 'ఎంబీ నాగలి', op: 'plough', width: 1.9, maxSpeed: 3.4, price: 38000 },
  cultivator: { en: 'Cultivator', te: 'కల్టివేటర్', op: 'cultivate', width: 2.7, maxSpeed: 3.9, price: 32000 },
  rotavator:  { en: 'Rotavator', te: 'రోటవేటర్', op: 'rotavate', width: 2.3, maxSpeed: 3.1, price: 105000 },
  seeddrill:  { en: 'Seed drill', te: 'సీడ్ డ్రిల్', op: 'sow', width: 2.6, maxSpeed: 3.5, price: 68000 },
  spreader:   { en: 'Fertilizer spreader', te: 'ఎరువుల స్ప్రెడర్', op: 'fertilize', width: 6.5, maxSpeed: 4.2, price: 42000 },
  sprayer:    { en: 'Boom sprayer', te: 'బూమ్ స్ప్రేయర్', op: 'spray', width: 8.5, maxSpeed: 4.2, price: 55000 },
  trailer:    { en: 'Trailer', te: 'ట్రాలీ', op: null, cargo: 40, price: 140000 },
  tanker:     { en: 'Water tanker', te: 'నీటి ట్యాంకర్', op: 'water', width: 3.2, maxSpeed: 4.2, price: 115000, tank: 100 },
};
const TRACTOR_IMPLEMENTS = ['plough', 'cultivator', 'rotavator', 'seeddrill', 'spreader', 'sprayer', 'trailer', 'tanker'];

// ---------- vehicles ----------
const VEHICLES = {
  bullock:   { en: 'Bullock pair', te: 'ఎడ్ల జత', maxSpeed: 2.1, rev: 0.8, accel: 1.1, turn: 1.1, wheelBase: 3.2, fuelCap: 0, fuelUse: 0, price: 0, cam: 7.5, sell: 60000 },
  moped:     { en: 'Old moped', te: 'పాత మోపెడ్', maxSpeed: 12.5, rev: 2, accel: 3.4, turn: 1.9, wheelBase: 1.25, fuelCap: 5, fuelUse: 0.35, cargo: 1, price: 0, cam: 5.5, two: true, sell: 18000 },
  bike:      { en: 'Motorcycle', te: 'మోటార్ సైకిల్', maxSpeed: 19, rev: 2.5, accel: 5.2, turn: 1.9, wheelBase: 1.35, fuelCap: 12, fuelUse: 0.5, cargo: 1, price: 92000, cam: 5.8, two: true, shop: 'dealer' },
  tractor35: { en: 'Bhoomi 35 tractor', te: 'భూమి 35 ట్రాక్టర్', maxSpeed: 8.3, rev: 3, accel: 2.4, turn: 1.0, wheelBase: 2.1, fuelCap: 50, fuelUse: 3.2, price: 540000, cam: 9, power: 35, shop: 'workshop' },
  tractor50: { en: 'Bhoomi 50 Power tractor', te: 'భూమి 50 పవర్ ట్రాక్టర్', maxSpeed: 9.7, rev: 3, accel: 2.9, turn: 1.0, wheelBase: 2.35, fuelCap: 65, fuelUse: 4.4, price: 820000, cam: 9.5, power: 50, rank: 1, shop: 'workshop' },
  harvester: { en: 'Combine harvester', te: 'కంబైన్ హార్వెస్టర్', maxSpeed: 5.6, rev: 1.5, accel: 1.4, turn: 0.75, wheelBase: 3.4, fuelCap: 120, fuelUse: 9, price: 2100000, cam: 15, rank: 2, header: 4.6, shop: 'workshop' },
  pickup:    { en: 'Pickup van', te: 'పికప్ వ్యాన్', maxSpeed: 22, rev: 4, accel: 4.2, turn: 1.25, wheelBase: 2.8, fuelCap: 45, fuelUse: 2.6, cargo: 20, price: 780000, cam: 9, shop: 'dealer' },
};
const TRACTOR_RENT_PER_HOUR = 900;
const HARVEST_SERVICE_PER_ACRE = 2400;

// ---------- farm upgrades ----------
const FARM_UPGRADES = {
  waterTank:   { en: 'Farm water tank', te: 'వ్యవసాయ నీటి ట్యాంకు', cost: 45000, hours: 8, desc: { en: 'Stores pumped water. Pumps on your fields run 25% stronger.', te: 'పంపిన నీటిని నిల్వ చేస్తుంది. మీ పొలాల మోటార్లు 25% ఎక్కువ నీరు ఇస్తాయి.' } },
  farmPond:    { en: 'Farm pond (panta kunta)', te: 'పంట కుంట', cost: 55000, hours: 16, desc: { en: 'Harvests rain. Keeps pumps running during drought.', te: 'వాన నీటిని ఒడిసి పడుతుంది. కరువులో కూడా మోటార్లు నడుస్తాయి.' } },
  solarPump:   { en: 'Solar pump', te: 'సోలార్ పంపు', cost: 160000, hours: 10, desc: { en: 'Daytime pumping that ignores power cuts, +20% water flow.', te: 'కరెంటు కోతలతో సంబంధం లేకుండా పగటిపూట నీరు, 20% ఎక్కువ ప్రవాహం.' } },
  warehouse:   { en: 'Warehouse (godown)', te: 'గోదాము', cost: 280000, hours: 24, desc: { en: '+400 quintals of storage; grain spoils 60% slower.', te: '+400 క్వింటాళ్ల నిల్వ; ధాన్యం 60% నెమ్మదిగా పాడవుతుంది.' } },
  coldStorage: { en: 'Cold storage', te: 'కోల్డ్ స్టోరేజ్', cost: 650000, hours: 30, desc: { en: '+150 quintals for tomato, chilli and mango with almost no spoilage.', te: 'టమాటా, మిర్చి, మామిడికి +150 క్వింటాళ్లు; దాదాపు పాడవదు.' } },
  greenhouse:  { en: 'Polyhouse', te: 'పాలీహౌస్', cost: 450000, hours: 24, desc: { en: 'Adds a weather-proof 1-acre plot. Tomato yields +40%.', te: 'వాతావరణ రక్షిత 1 ఎకరం పొలం. టమాటా దిగుబడి +40%.' } },
  dairyShed:   { en: 'Dairy shed + 2 buffaloes', te: 'పాడి షెడ్ + 2 గేదెలు', cost: 320000, hours: 18, desc: { en: 'Milk twice a day. Needs cattle feed.', te: 'రోజుకు రెండుసార్లు పాలు. దాణా అవసరం.' } },
  garage:      { en: 'Machinery garage', te: 'యంత్రాల షెడ్', cost: 180000, hours: 14, desc: { en: 'Repair at home. Machines wear 50% slower.', te: 'ఇంటి దగ్గరే మరమ్మతు. యంత్రాలు 50% నెమ్మదిగా అరుగుతాయి.' } },
  quarters:    { en: 'Worker quarters', te: 'కూలీల నివాసాలు', cost: 240000, hours: 20, desc: { en: 'Hire up to 6 more permanent workers.', te: 'మరో 6 మంది శాశ్వత కూలీలను పెట్టుకోవచ్చు.' } },
};
const BOREWELL_COST = 65000;
const HOUSE_LEVELS = [
  { en: 'Small village house', te: 'చిన్న పల్లె ఇల్లు', cost: 0, hours: 0, storage: 30, rest: 1.0 },
  { en: 'Improved house', te: 'మెరుగైన ఇల్లు', cost: 250000, hours: 20, storage: 45, rest: 1.15 },
  { en: 'Large farmhouse', te: 'పెద్ద ఫామ్‌హౌస్', cost: 750000, hours: 30, storage: 60, rest: 1.3 },
  { en: 'Modern farmhouse', te: 'ఆధునిక ఫామ్‌హౌస్', cost: 1800000, hours: 40, storage: 80, rest: 1.45 },
  { en: 'Luxury agricultural estate', te: 'విలాసవంతమైన వ్యవసాయ ఎస్టేట్', cost: 4500000, hours: 60, storage: 120, rest: 1.6 },
];
const VILLAGE_PROJECTS = {
  roads:      { en: 'CC roads', te: 'సీసీ రోడ్లు', cost: 1200000, hours: 36, pop: 40, biz: 8, land: 0.06, desc: { en: 'Concrete village roads. Faster, mud-free travel.', te: 'గ్రామంలో కాంక్రీట్ రోడ్లు. బురద లేని వేగమైన ప్రయాణం.' } },
  lights:     { en: 'Street lights', te: 'వీధి దీపాలు', cost: 450000, hours: 12, pop: 15, biz: 4, land: 0.02, desc: { en: 'LED lights along village roads. Evenings stay busy.', te: 'గ్రామ రోడ్ల వెంబడి ఎల్ఈడీ దీపాలు. సాయంత్రాలు సందడిగా ఉంటాయి.' } },
  tank:       { en: 'Drinking water tank', te: 'మంచినీటి ట్యాంకు', cost: 800000, hours: 30, pop: 35, biz: 3, land: 0.04, desc: { en: 'A new overhead tank with taps for every street.', te: 'ప్రతి వీధికి నల్లాలతో కొత్త ఓవర్‌హెడ్ ట్యాంకు.' } },
  shops:      { en: 'Shopping complex', te: 'షాపింగ్ కాంప్లెక్స్', cost: 1000000, hours: 36, pop: 30, biz: 14, land: 0.05, desc: { en: 'Six new shops. Supplies 4% cheaper.', te: 'ఆరు కొత్త దుకాణాలు. సామాన్లు 4% చౌక.' } },
  school:     { en: 'School upgrade', te: 'పాఠశాల అభివృద్ధి', cost: 900000, hours: 30, pop: 30, biz: 2, land: 0.05, desc: { en: 'New classrooms and a playground.', te: 'కొత్త తరగతి గదులు, ఆట స్థలం.' } },
  health:     { en: 'Health centre upgrade', te: 'ఆరోగ్య కేంద్రం అభివృద్ధి', cost: 1100000, hours: 30, pop: 30, biz: 2, land: 0.05, desc: { en: 'A new ward and ambulance. Treatment is cheaper.', te: 'కొత్త వార్డు, అంబులెన్సు. వైద్యం చౌక.' } },
  irrigation: { en: 'Canal lining & check dam', te: 'కాలువ లైనింగ్ & చెక్ డ్యామ్', cost: 1500000, hours: 40, pop: 20, biz: 6, land: 0.08, desc: { en: 'The lake holds more water and the canal flows all year.', te: 'చెరువులో ఎక్కువ నీరు నిలుస్తుంది, కాలువ ఏడాది పొడవునా పారుతుంది.' } },
  godown:     { en: 'Village godown', te: 'గ్రామ గోదాము', cost: 850000, hours: 30, pop: 10, biz: 8, land: 0.03, desc: { en: 'Shared storage steadies local prices.', te: 'ఉమ్మడి నిల్వతో స్థానిక ధరలు స్థిరంగా ఉంటాయి.' } },
  market:     { en: 'Market expansion', te: 'మార్కెట్ విస్తరణ', cost: 1400000, hours: 36, pop: 25, biz: 16, land: 0.06, desc: { en: 'More traders at the yard. Sale prices +3%.', te: 'యార్డులో ఎక్కువ వ్యాపారులు. అమ్మకం ధర +3%.' } },
};

const RANKS = [
  { en: 'Small Farmer', te: 'చిన్న రైతు' },
  { en: 'Successful Farmer', te: 'విజయవంతమైన రైతు' },
  { en: 'Large Farmer', te: 'పెద్ద రైతు' },
  { en: 'Agricultural Business Owner', te: 'వ్యవసాయ వ్యాపారవేత్త' },
  { en: 'Village Agribusiness', te: 'గ్రామ వ్యవసాయ సంస్థ' },
  { en: 'Agricultural Company', te: 'వ్యవసాయ కంపెనీ' },
];

const WORKER_TYPES = {
  daily:  { en: 'Daily labourer', te: 'రోజు కూలీ', wage: 500, per: 'day' },
  farmhand: { en: 'Permanent farmhand', te: 'శాశ్వత పాలేరు', wage: 12000, per: 'week' },
  driver: { en: 'Tractor driver', te: 'ట్రాక్టర్ డ్రైవర్', wage: 15000, per: 'week' },
};

// ---------- names ----------
const NAMES_M = ['Raju', 'Narsimha', 'Yadagiri', 'Srinivas', 'Mahesh', 'Ramesh', 'Anjaiah', 'Balaiah', 'Suresh', 'Venkanna', 'Komuraiah', 'Laxman', 'Sailu', 'Mallaiah', 'Ravinder', 'Shankar', 'Ramana', 'Buchaiah', 'Kumar', 'Naresh'];
const NAMES_M_TE = ['రాజు', 'నర్సింహ', 'యాదగిరి', 'శ్రీనివాస్', 'మహేష్', 'రమేష్', 'అంజయ్య', 'బాలయ్య', 'సురేష్', 'వెంకన్న', 'కొమురయ్య', 'లక్ష్మణ్', 'శైలు', 'మల్లయ్య', 'రవీందర్', 'శంకర్', 'రమణ', 'బుచ్చయ్య', 'కుమార్', 'నరేష్'];
const NAMES_F = ['Laxmi', 'Saroja', 'Sammakka', 'Rajitha', 'Swapna', 'Manjula', 'Padma', 'Renuka', 'Anitha', 'Bharathi', 'Kavitha', 'Sunitha', 'Yashoda', 'Mangamma', 'Sujatha', 'Latha', 'Radha', 'Shobha', 'Vani', 'Jyothi'];
const NAMES_F_TE = ['లక్ష్మి', 'సరోజ', 'సమ్మక్క', 'రజిత', 'స్వప్న', 'మంజుల', 'పద్మ', 'రేణుక', 'అనిత', 'భారతి', 'కవిత', 'సునీత', 'యశోద', 'మంగమ్మ', 'సుజాత', 'లత', 'రాధ', 'శోభ', 'వాణి', 'జ్యోతి'];
const NAMES_KID = [['Chinnu', 'చిన్ను'], ['Bunny', 'బన్నీ'], ['Pinky', 'పింకీ'], ['Sai', 'సాయి'], ['Honey', 'హనీ'], ['Tinku', 'టింకు'], ['Chitti', 'చిట్టి'], ['Bablu', 'బబ్లూ'], ['Lucky', 'లక్కీ'], ['Munni', 'మున్ని']];

const PALETTE = {
  skin: ['#8d5a3b', '#a0694a', '#7a4b30', '#b27a57', '#6e4429', '#94613f', '#7f5034'],
  hair: ['#15110e', '#1c1612', '#2a211b', '#d8d3cc'],
  shirtM: ['#f2efe6', '#bcd3e8', '#e9dfbf', '#f3e7a0', '#bfd9b5', '#d9e3ef', '#c7b8a2', '#9fb7d6', '#e7c7a8'],
  lungi: ['#f4f1ea', '#3a5a9a', '#6b2e3a', '#2f5d4a', '#e8e1cf'],
  pants: ['#3b3f4a', '#5b4a3a', '#2c3550', '#6a6458'],
  saree: ['#b0306a', '#2e8b57', '#e07b22', '#e2b81f', '#6b3fa0', '#c22b2b', '#1f9e9a', '#d9466f', '#3d6fb8', '#8a2f8f'],
  blouse: ['#e2b81f', '#2e8b57', '#b0306a', '#1f3f8a', '#c22b2b', '#f0e6d0'],
  towel: ['#f4f1ea', '#b93a2c', '#e9dfbf'],
  turban: ['#f4f1ea', '#e07b22', '#e9dfbf'],
};
