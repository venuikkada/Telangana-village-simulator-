// ============================================================================
// Account: sign up and sign in with an email, so a farm travels between phones
// and computers. The game talks to api/account.php on its own website. The
// browser save always stays; the account keeps the same farm online.
// Inside the claude.ai viewer there is no such server, so the panel sends
// players to the website instead.
// ============================================================================
const ACCOUNT_API = 'api/account.php';
const GAME_SITE = 'https://peru-dove-641366.hostingersite.com/';

const Account = {
  st: null,          // this browser's sign-in: { token, email, name, base, synced, lost }
  avail: null,       // can this page reach the account server? null = not asked yet
  remote: null,      // summary of the online save: { rev, day, money, name, savedAt }
  state: 'idle',     // idle | saving | saved | offline | conflict
  view: 'in', f: { email: '', pass: '', code: '' }, err: '', note: '', busy: false,
  pending: null, pushing: false, timer: 0, lastPush: 0,

  load() {
    const s = Store.get('tvs_acct', null);
    this.st = s && typeof s.token === 'string' && /^[a-f0-9]{64}$/.test(s.token) ? s : null;
  },
  keep() {
    if (!this.st) { Store.del('tvs_acct'); return; }
    Store.set('tvs_acct', this.st);
    // remembered after signing out too, so signing in again on this device is not mistaken for a different farm
    Store.set('tvs_acct_last', { email: this.st.email, base: this.st.base || 0, synced: this.st.synced || 0 });
  },
  // the claude.ai viewer (and a file opened from disk) cannot reach the account server
  sandboxed() { return !!(window.claude && typeof window.claude.use === 'function') || !/^https?:$/.test(location.protocol); },

  // ---------- talking to the server ----------
  async call(a, body) {
    const get = body === undefined;
    const headers = { Accept: 'application/json' };
    if (this.st) headers['X-Tvs-Token'] = this.st.token;
    if (!get) headers['Content-Type'] = 'application/json';
    const ctl = typeof AbortController === 'function' ? new AbortController() : null;
    const tm = setTimeout(() => { if (ctl) ctl.abort(); }, a === 'save' || a === 'load' ? 45000 : 15000);
    let r, j = null;
    try {
      r = await fetch(ACCOUNT_API + '?a=' + a, { method: get ? 'GET' : 'POST', headers, body: get ? undefined : JSON.stringify(body), cache: 'no-store', credentials: 'omit', signal: ctl ? ctl.signal : undefined });
      try { j = await r.json(); } catch (e) { j = null; }
    } catch (e) { throw { error: 'network' }; } finally { clearTimeout(tm); }
    if (!j || typeof j !== 'object' || typeof j.ok !== 'boolean') throw { error: r.status >= 500 ? 'server' : 'unavailable' };
    this.avail = true;
    if (!j.ok) { if (j.error === 'signed_out' && this.st) this.lost(); throw j; }
    return j;
  },
  msg(e) {
    switch (e && e.error) {
      case 'bad_email': return L('Please type a correct email address.', 'సరైన ఈమెయిల్ చిరునామా టైప్ చేయండి.');
      case 'weak_password': return L('Use a longer password: at least 8 letters or numbers, and not an easy one like 12345678.', 'పొడవైన పాస్‌వర్డ్ వాడండి: కనీసం 8 అక్షరాలు లేదా అంకెలు, 12345678 లాంటి సులభమైనది కాదు.');
      case 'email_taken': return L('This email already has an account. Please sign in.', 'ఈ ఈమెయిల్‌కు ఇప్పటికే ఖాతా ఉంది. దయచేసి సైన్ ఇన్ చేయండి.');
      case 'bad_login': return L('Wrong email or password.', 'ఈమెయిల్ లేదా పాస్‌వర్డ్ తప్పు.');
      case 'bad_password': return L('Wrong password.', 'పాస్‌వర్డ్ తప్పు.');
      case 'too_many': return L('Too many tries. Please wait a few minutes and try again.', 'చాలా ప్రయత్నాలు అయ్యాయి. కొన్ని నిమిషాలు ఆగి మళ్ళీ ప్రయత్నించండి.');
      case 'bad_code': return L('That code is wrong or too old. Ask for a new code.', 'ఆ కోడ్ తప్పు లేదా పాతది. కొత్త కోడ్ అడగండి.');
      case 'mail_failed': return L('We could not send the email just now. Please try again later.', 'ఇప్పుడు ఈమెయిల్ పంపలేకపోయాం. కాసేపటి తర్వాత ప్రయత్నించండి.');
      case 'network': return L('No internet connection. Please try again.', 'ఇంటర్నెట్ కనెక్షన్ లేదు. మళ్ళీ ప్రయత్నించండి.');
      default: return L('Something went wrong. Please try again in a little while.', 'ఏదో పొరపాటు జరిగింది. కాసేపటి తర్వాత ప్రయత్నించండి.');
    }
  },

  // ---------- start-up: a remembered sign-in, then line up the two farms ----------
  async init() {
    this.load();
    if (!this.st || this.sandboxed()) return;
    try {
      const r = await this.call('me');
      if (!this.st) return;
      this.st.email = r.user.email; this.st.name = r.user.name; this.keep();
      await this.sync(r.save);
    } catch (e) { if (this.st) this.state = 'offline'; }
  },
  // which farm moved on since this browser last met the account? copy it across, or ask
  async sync(remote) {
    const s = this.st; if (!s) return;
    this.remote = remote || null;
    const local = SaveSys.readLocal();
    const here = G.started ? SaveSys.serialize() : local;
    const hereAt = local ? local.savedAt : 0;   // when this browser last saved
    if (!remote) { if (here) this.push(here); else this.state = 'idle'; return; }
    if (!here) { await this.pull(); return; }
    if (remote.savedAt && remote.savedAt === hereAt) { s.base = remote.rev; s.synced = hereAt; this.keep(); this.state = 'saved'; return; }
    const there = remote.rev !== s.base, moved = hereAt !== s.synced;
    if (!there && !moved) { this.state = 'saved'; return; }
    if (!there) { this.push(here); return; }      // only this browser played on
    if (!moved) { await this.pull(); return; }    // only the account moved on (another device)
    this.ask(remote, here);                       // both: the player chooses
  },
  // bring the account's farm into this browser
  async pull() {
    let r;
    try { r = await this.call('load'); } catch (e) { if (e.error !== 'signed_out') this.state = 'offline'; this.paint(); return false; }
    const d = r.data;
    if (!r.save || !SaveSys.valid(d)) { this.state = 'idle'; return false; }
    this.st.base = r.save.rev; this.st.synced = d.savedAt; this.keep();
    this.remote = r.save; this.state = 'saved';
    SaveSys.prefer = d; SaveSys.writeLocal(d);
    if (G.started) {
      // the farm on screen is replaced: stop it saving over the new one, then reopen
      SaveSys.hold = true;
      this.tell(L('Opening the farm from your account…', 'మీ ఖాతాలోని పొలం తెరుస్తున్నాం…'));
      setTimeout(() => location.reload(), 700);
    } else {
      this.tell(L('Farm loaded from your account', 'మీ ఖాతా నుంచి పొలం వచ్చింది'), L('Tap Continue to play.', 'ఆడటానికి కొనసాగించండి నొక్కండి.'), 'good');
      this.refresh();
    }
    return true;
  },
  // send a save to the account; while one is on its way the newest one waits
  push(data, force) {
    if (!this.st || !data) return;
    this.pending = { data, force: !!force || !!(this.pending && this.pending.force) };
    if (!this.pushing) this.flush();
  },
  async flush() {
    const p = this.pending, s = this.st;
    if (!p || !s || this.pushing) return;
    if (this.state === 'conflict' && !p.force) return;   // waiting for the player to choose
    this.pending = null; this.pushing = true; clearTimeout(this.timer); this.timer = 0;
    this.state = 'saving'; this.paint();
    let retry = 0;
    try {
      const r = await this.call('save', { data: JSON.stringify(p.data), base: s.base || 0, force: p.force });
      s.base = r.rev; s.synced = p.data.savedAt; s.lost = 0; this.keep();
      this.remote = { rev: r.rev, day: p.data.day, money: Math.round(p.data.money), name: p.data.name, savedAt: p.data.savedAt };
      this.state = 'saved'; this.lastPush = Date.now();
    } catch (e) {
      const sv = e.save || {};
      if (e.error === 'conflict' && s.lost && sv.savedAt === s.lost) {
        // our own earlier save arrived but its answer was lost on the way: carry on from it
        s.base = sv.rev; s.lost = 0; this.keep(); this.pending = this.pending || p; retry = 50; this.state = 'idle';
      } else if (e.error === 'conflict') {
        this.state = 'conflict'; this.remote = sv; this.pending = null;
        if (G.started || !UI.modalOpen()) this.ask(sv, p.data);
      } else if (e.error === 'network' || e.error === 'server' || e.error === 'unavailable' || e.error === 'too_many') {
        if (e.error === 'network') s.lost = p.data.savedAt;
        this.pending = this.pending || p; this.state = 'offline'; retry = 60000;
      } else if (e.error !== 'signed_out') this.state = 'idle';   // too big or not a save: the browser copy stays
    } finally { this.pushing = false; this.paint(); }
    if (this.pending && this.st && this.state !== 'conflict') { clearTimeout(this.timer); this.timer = setTimeout(() => this.flush(), retry || 50); }
  },
  // the game saved: send it on, at most about every 45 seconds unless the player asked
  saved(data, now) {
    if (!this.st || !data) return;
    this.pending = { data, force: !!(this.pending && this.pending.force) };
    if (this.pushing || this.state === 'conflict') return;
    const wait = now ? 0 : Math.max(0, 45000 - (Date.now() - this.lastPush));
    clearTimeout(this.timer); this.timer = 0;
    if (wait) this.timer = setTimeout(() => this.flush(), wait); else this.flush();
  },
  // wait (a little) for the last save to arrive, before reloading or signing out
  async settle(ms = 5000) {
    if (this.pending && !this.pushing) this.flush();
    const t0 = Date.now();
    while ((this.pushing || (this.pending && this.state !== 'conflict')) && Date.now() - t0 < ms) await sleepMs(100);
  },

  // ---------- both farms changed: which one stays? ----------
  ask(remote, here) {
    this.state = 'conflict';
    const card = (title, d, pick) => h('button', { class: 'btn alt afarm', type: 'button', onclick: () => { Audio2.sfx('click'); UI.close(); pick(); } },
      h('b', null, title), h('span', null, Game.saveInfo(d) || L('New farm', 'కొత్త పొలం')), d && d.savedAt ? h('small', null, this.when(d.savedAt)) : null);
    UI.sheet({ title: L('Which farm do you want to play?', 'ఏ పొలంలో ఆడాలనుకుంటున్నారు?'), sub: L('This device and your account have different farms.', 'ఈ పరికరంలో, మీ ఖాతాలో వేర్వేరు పొలాలు ఉన్నాయి.'), narrow: true, kind: 'acctpick', render: (b) => {
      b.append(h('div', { class: 'afarms' },
        card(L('The farm in your account', 'మీ ఖాతాలోని పొలం'), remote, () => { this.state = 'idle'; this.pull(); }),
        card(L('The farm on this device', 'ఈ పరికరంలోని పొలం'), here, () => { this.state = 'idle'; this.push(G.started ? SaveSys.serialize() : here, true); this.paint(); })),
      h('p', { class: 'asmall' }, L('The farm you do not choose is replaced.', 'మీరు ఎంచుకోని పొలం దీనితో మారిపోతుంది.')));
    } });
  },
  when(ms) {
    if (!ms) return '';
    const d = new Date(ms), loc = LANG === 'en' ? undefined : LANG + '-IN';
    try {
      const t = d.toLocaleTimeString(loc, { hour: 'numeric', minute: '2-digit' });
      return d.toDateString() === new Date().toDateString() ? t : d.toLocaleDateString(loc, { day: 'numeric', month: 'short' }) + ', ' + t;
    } catch (e) { return d.toLocaleString(); }
  },

  // ---------- signing in and out ----------
  farmerName() { const d = G.started && G.S ? G.S.player : SaveSys.readLocal(); return (d && d.name) || ''; },
  shown() { const s = this.st; return (this.remote && this.remote.name) || s.name || s.email.split('@')[0]; },
  async submit(kind) {
    if (this.busy) return;
    const f = this.f, email = f.email.trim();
    this.err = ''; this.note = '';
    if (kind !== 'delete' && !email) { this.err = this.msg({ error: 'bad_email' }); this.paint(true); return; }
    this.busy = true; this.paint(true);
    try {
      if (kind === 'in' || kind === 'up') {
        const r = await this.call(kind === 'up' ? 'signup' : 'signin', { email, password: f.pass, name: kind === 'up' ? this.farmerName() : undefined });
        f.pass = '';
        if (kind === 'up') await this.welcome(r, L('Account created!', 'ఖాతా తెరిచాం!'), L('Your farm now saves online too.', 'ఇప్పుడు మీ పొలం ఆన్‌లైన్‌లో కూడా సేవ్ అవుతుంది.'), true);
        else await this.welcome(r, L('Signed in', 'సైన్ ఇన్ అయ్యారు'), L('Your farm saves online now.', 'ఇప్పుడు మీ పొలం ఆన్‌లైన్‌లో సేవ్ అవుతుంది.'), false);
      } else if (kind === 'forgot') {
        await this.call('forgot', { email });
        this.view = 'code'; f.code = '';
        this.note = L(`We sent a 6-digit code to ${email}. It can take a minute; look in the spam folder too.`, `${email} కు 6 అంకెల కోడ్ పంపాం. ఒక నిమిషం పట్టొచ్చు; స్పామ్ ఫోల్డర్‌లో కూడా చూడండి.`);
      } else if (kind === 'code') {
        const r = await this.call('reset', { email, code: f.code, password: f.pass });
        f.pass = ''; f.code = '';
        await this.welcome(r, L('New password saved', 'కొత్త పాస్‌వర్డ్ సేవ్ అయింది'), L('You are signed in.', 'మీరు సైన్ ఇన్ అయ్యారు.'), false);
      } else if (kind === 'delete') {
        await this.call('delete', { password: f.pass });
        f.pass = ''; this.forget(); Store.del('tvs_acct_last'); this.view = 'in';
        UI.close(); this.tell(L('Account deleted', 'ఖాతా తొలగించాం'), L('The farm on this device stays.', 'ఈ పరికరంలోని పొలం అలాగే ఉంటుంది.'));
        this.refresh();
      }
    } catch (e) {
      if (e.error === 'unavailable') this.avail = false;
      this.err = this.msg(e);
    }
    this.busy = false; this.paint(true);
  },
  async welcome(r, title, sub, isNew) {
    const last = Store.get('tvs_acct_last', null), same = last && last.email === r.user.email;
    this.st = { token: r.token, email: r.user.email, name: r.user.name, base: same ? last.base : 0, synced: same ? last.synced : 0, lost: 0 };
    this.keep(); this.state = 'idle'; this.view = 'me';
    UI.close();
    if (isNew) { Celebrate.burst(innerWidth / 2, innerHeight * 0.4, 70, 0.8); Audio2.sfx('tada'); }
    this.tell(title, sub, 'good');
    await this.sync(r.save);
    this.refresh();
  },
  async signOut() {
    if (G.started) SaveSys.save(false);
    await this.settle(5000);
    const s = this.st;
    try { await this.call('signout', {}); } catch (e) { /* forgotten here either way */ }
    if (this.st === s) this.forget();
    this.view = 'in';
    this.tell(L('Signed out', 'సైన్ అవుట్ అయ్యారు'), L('Your farm stays on this device.', 'మీ పొలం ఈ పరికరంలో అలాగే ఉంటుంది.'));
    this.refresh();
  },
  forget() { this.st = null; this.keep(); this.remote = null; this.state = 'idle'; this.pending = null; clearTimeout(this.timer); this.timer = 0; },
  lost() {
    this.forget();
    this.tell(L('Please sign in again', 'దయచేసి మళ్ళీ సైన్ ఇన్ చేయండి'), L('to keep saving your farm online.', 'పొలాన్ని ఆన్‌లైన్‌లో సేవ్ చేస్తూ ఉండటానికి.'), 'warn');
    this.refresh();
  },

  // ---------- screens ----------
  // a short message: a toast in the game, a card over the title screen
  tell(title, sub, kind = 'info') {
    if (G.started) { UI.toast(sub ? title + ' · ' + sub : title, kind); return; }
    Celebrate.ribbon({ kind: 'sun', icon: kind === 'good' ? '✅' : kind === 'warn' ? '⚠️' : '👤', top: L('Account', 'ఖాతా'), title, sub: sub || '', ms: 3000 });
  },
  refresh() { if (!G.started) Game.showTitle(); this.paint(); },
  // redraw the account sheet, unless the player is typing in it (keeps the keyboard up)
  paint(force) {
    const st = UI.sheetState;
    if (st && (st.kind === 'account' || (st.kind === 'settings' && st.tab === 'account')) && st.rerender) {
      const a = document.activeElement;
      if (force || !(a && a.tagName === 'INPUT' && a.closest && a.closest('#modal'))) st.rerender();
    }
    if (!G.started) this.pill();
  },
  // the round button in the corner of the title screen
  pill() {
    const t = document.getElementById('title'); if (!t || t.hidden) return;
    let b = document.getElementById('tacct');
    if (!b) { b = h('button', { id: 'tacct', type: 'button', onclick: () => { Audio2.unlock(); this.open(); } }); t.appendChild(b); }
    const s = this.st; b.innerHTML = ''; b.classList.toggle('out', !s);
    b.append(h('i', { 'aria-hidden': 'true' }, '👤'),
      h('span', null, h('b', null, s ? this.shown() : L('Login / Sign up', 'లాగిన్ / సైన్ అప్')), h('small', null, s ? (this.state === 'offline' ? L('Offline', 'ఆఫ్‌లైన్') : L('Farm saved online', 'పొలం ఆన్‌లైన్‌లో సేవ్')) : L('Save your farm online', 'పొలాన్ని ఆన్‌లైన్‌లో సేవ్ చేయండి'))));
    if (s) b.append(h('em', { 'aria-hidden': 'true' }, '✓'));
  },
  go(view) { this.view = view; this.err = ''; this.note = ''; UI.rerender(); },
  open(view) {
    this.err = ''; this.note = '';
    this.view = view || (this.st ? 'me' : this.view === 'up' ? 'up' : 'in');
    if (!this.f.email) { const last = Store.get('tvs_acct_last', null); this.f.email = this.st ? this.st.email : last && last.email ? last.email : ''; }
    UI.sheet({ title: L('Your account', 'మీ ఖాతా'), narrow: true, kind: 'account', cls: 'acct', render: (b) => this.render(b) });
    this.check();
  },
  // can this page reach the account server? asked once, when an account screen opens
  check() {
    if (this.avail !== null || this.sandboxed() || this.checking) return;
    this.checking = true;
    this.call('ping').then(() => { this.checking = false; this.paint(); }, (e) => { this.checking = false; if (e.error === 'unavailable') { this.avail = false; this.paint(true); } });
  },
  input(key, type, label, extra) {
    const id = 'acct_' + key;
    const el = h('input', Object.assign({ id, name: key === 'email' ? 'email' : key === 'code' ? 'code' : 'password', type, value: this.f[key] || '', autocapitalize: 'none', autocorrect: 'off', spellcheck: 'false', oninput: (e) => { this.f[key] = e.target.value; } }, extra || {}));
    let box = el;
    if (type === 'password') {
      const eye = h('button', { type: 'button', class: 'eye', 'aria-label': L('Show password', 'పాస్‌వర్డ్ చూపు'), onclick: () => { const show = el.type === 'password'; el.type = show ? 'text' : 'password'; eye.textContent = show ? '🙈' : '👁'; } }, '👁');
      box = h('div', { class: 'pw' }, el, eye);
    }
    return h('div', { class: 'afield' }, h('label', { for: id }, label), box);
  },
  render(b) {
    const f = this.f;
    const lead = h('p', { class: 'alead' }, '☁️ ' + L('Save your farm online and play it on any phone or computer.', 'మీ పొలాన్ని ఆన్‌లైన్‌లో సేవ్ చేసి ఏ ఫోన్ లేదా కంప్యూటర్‌లోనైనా ఆడండి.'));
    // no account server here (claude.ai viewer): point to the website
    if (this.sandboxed() || this.avail === false) {
      const onSite = location.href.startsWith(GAME_SITE);
      b.append(lead, h('p', null, L('Sign in and sign up work on the game website.', 'సైన్ ఇన్, సైన్ అప్ ఆట వెబ్‌సైట్‌లో పనిచేస్తాయి.')),
        onSite ? h('p', { class: 'aerr' }, this.msg({ error: 'server' })) : h('a', { class: 'btn acc big', href: GAME_SITE, target: '_blank', rel: 'noopener' }, L('Open the game website', 'ఆట వెబ్‌సైట్ తెరవండి')));
      return;
    }
    const msgs = () => [this.err ? h('p', { class: 'aerr', role: 'alert' }, this.err) : null, this.note ? h('p', { class: 'anote', role: 'status' }, this.note) : null];
    const submit = (label, cls = 'acc') => h('button', { type: 'submit', class: 'btn big ' + cls, disabled: this.busy }, this.busy ? L('Please wait…', 'కొంచెం ఆగండి…') : label);
    const link = (label, fn, cls = '') => h('button', { type: 'button', class: 'alink ' + cls, onclick: fn }, label);
    const form = (kind, ...kids) => h('form', { class: 'aform', novalidate: true, onsubmit: (e) => { e.preventDefault(); this.submit(kind); } }, ...kids);
    const email = () => this.input('email', 'email', L('Email', 'ఈమెయిల్'), { autocomplete: 'email', inputmode: 'email', placeholder: 'name@example.com', maxlength: 254 });
    const pass = (auto, ph) => this.input('pass', 'password', auto === 'new-password' && this.view !== 'up' ? L('New password', 'కొత్త పాస్‌వర్డ్') : L('Password', 'పాస్‌వర్డ్'), { autocomplete: auto, placeholder: ph || '', maxlength: 200 });
    const v = this.view;

    if (this.st && v !== 'delete') {
      const s = this.st, r = this.remote;
      const stat = this.state === 'saving' ? L('Saving your farm to your account…', 'మీ పొలాన్ని ఖాతాలో సేవ్ చేస్తున్నాం…')
        : this.state === 'offline' ? L('Offline. Your farm will be saved online when the internet is back.', 'ఆఫ్‌లైన్. ఇంటర్నెట్ వచ్చాక మీ పొలం ఆన్‌లైన్‌లో సేవ్ అవుతుంది.')
          : this.state === 'conflict' ? L('This device and your account have different farms.', 'ఈ పరికరంలో, మీ ఖాతాలో వేర్వేరు పొలాలు ఉన్నాయి.')
            : r && r.savedAt ? L('Your farm is saved online:', 'మీ పొలం ఆన్‌లైన్‌లో సేవ్ అయింది:') : L('Your farm will be saved online the next time the game saves.', 'ఆట తదుపరి సారి సేవ్ అయినప్పుడు మీ పొలం ఆన్‌లైన్‌లో సేవ్ అవుతుంది.');
      b.append(...[h('div', { class: 'ame' }, h('div', { class: 'aav' }, firstGrapheme(this.shown()).toUpperCase()), h('div', null, h('b', null, this.shown()), h('small', null, s.email))),
        h('div', { class: 'astat ' + this.state }, h('span', null, stat), r && r.savedAt && this.state !== 'conflict' ? h('small', null, Game.saveInfo(r) + ' · ' + this.when(r.savedAt)) : null),
        this.state === 'conflict' ? h('button', { type: 'button', class: 'btn acc big', onclick: () => this.ask(this.remote || {}, G.started ? SaveSys.serialize() : SaveSys.readLocal()) }, L('Choose which farm to keep', 'ఏ పొలం ఉంచాలో ఎంచుకోండి')) : null,
        h('div', { class: 'row', style: { marginTop: '12px', flexWrap: 'wrap' } },
          G.started ? UI.btn(L('Save now', 'ఇప్పుడే సేవ్ చేయండి'), () => SaveSys.save(true), 'acc') : null,
          UI.btn(L('Sign out', 'సైన్ అవుట్'), () => this.signOut(), 'alt')),
        h('p', { class: 'asmall', style: { marginTop: '14px' } }, L('Signed in on this device. Your farm is also saved in this browser.', 'ఈ పరికరంలో సైన్ ఇన్ అయ్యారు. మీ పొలం ఈ బ్రౌజర్‌లో కూడా సేవ్ అవుతుంది.')),
        link(L('Delete my account', 'నా ఖాతా తొలగించు'), () => { f.pass = ''; this.go('delete'); }, 'danger')].filter(Boolean));
      return;
    }
    if (v === 'delete') {
      b.append(form('delete', h('p', { class: 'alead' }, L('This deletes your account and the farm saved in it. The farm on this device stays. Type your password to confirm.', 'ఇది మీ ఖాతాను, అందులో సేవ్ అయిన పొలాన్ని తొలగిస్తుంది. ఈ పరికరంలోని పొలం అలాగే ఉంటుంది. నిర్ధారించడానికి పాస్‌వర్డ్ టైప్ చేయండి.')),
        pass('current-password'), ...msgs(), submit(L('Delete forever', 'శాశ్వతంగా తొలగించు'), 'bad'), link(L('Cancel', 'రద్దు'), () => this.go('me'))));
      return;
    }
    if (v === 'forgot') {
      b.append(form('forgot', h('p', { class: 'alead' }, L('Forgot your password? We will email you a code to set a new one.', 'పాస్‌వర్డ్ మర్చిపోయారా? కొత్తది పెట్టడానికి మీకు ఈమెయిల్‌లో కోడ్ పంపుతాం.')),
        email(), ...msgs(), submit(L('Send code', 'కోడ్ పంపండి')), link(L('Back to sign in', 'సైన్ ఇన్‌కు వెనక్కి'), () => this.go('in'))));
      return;
    }
    if (v === 'code') {
      b.append(form('code', ...msgs(),
        this.input('code', 'text', L('6-digit code', '6 అంకెల కోడ్'), { autocomplete: 'one-time-code', inputmode: 'numeric', maxlength: 6, placeholder: '123456' }),
        pass('new-password', L('At least 8 characters', 'కనీసం 8 అక్షరాలు')),
        submit(L('Set new password', 'కొత్త పాస్‌వర్డ్ పెట్టండి')),
        h('div', { class: 'row' }, link(L('Send a new code', 'కొత్త కోడ్ పంపండి'), () => this.go('forgot')), link(L('Back to sign in', 'సైన్ ఇన్‌కు వెనక్కి'), () => this.go('in')))));
      return;
    }
    // sign in / create account
    const up = v === 'up';
    const seg = h('div', { class: 'seg aseg', role: 'tablist' },
      h('button', { type: 'button', role: 'tab', class: up ? '' : 'on', onclick: () => this.go('in') }, L('Sign in', 'సైన్ ఇన్')),
      h('button', { type: 'button', role: 'tab', class: up ? 'on' : '', onclick: () => this.go('up') }, L('Create account', 'ఖాతా తెరవండి')));
    b.append(lead, seg, form(up ? 'up' : 'in', email(),
      up ? pass('new-password', L('At least 8 characters', 'కనీసం 8 అక్షరాలు')) : pass('current-password'),
      ...msgs(), submit(up ? L('Create account', 'ఖాతా తెరవండి') : L('Sign in', 'సైన్ ఇన్')),
      up ? h('p', { class: 'asmall' }, L('We use your email only to sign you in and to help if you forget your password.', 'మీ ఈమెయిల్‌ను సైన్ ఇన్ కోసం, పాస్‌వర్డ్ మర్చిపోతే సహాయం కోసం మాత్రమే వాడతాం.'))
        : link(L('Forgot password?', 'పాస్‌వర్డ్ మర్చిపోయారా?'), () => this.go('forgot'))));
  },
};
