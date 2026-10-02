// ============================================================================
// Celebrate: the happy moments. Confetti in the colours of the flag and the
// festival, coins that fly into your wallet while the money counts up, stars,
// a fanfare and a little buzz on phones. Also the sunrise card each morning.
// Everything here is drawn over the game and never blocks a tap.
// ============================================================================
const Celebrate = {
  cv: null, ctx: null, parts: [], raf: 0, last: 0, dpr: 1, queue: [], showing: false,
  COLS: ['#ff9933', '#ffffff', '#138808', '#f2b52d', '#e84393', '#1e90ff', '#ff5252', '#8e44ad', '#ffd700', '#ff7f50'],
  calm() { try { return matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) { return false; } },
  layer() { return document.getElementById('app') || document.body; },
  ensure() {
    if (!this.cv) { const cv = document.createElement('canvas'); cv.id = 'confetti'; cv.setAttribute('aria-hidden', 'true'); this.layer().appendChild(cv); this.cv = cv; this.ctx = cv.getContext('2d'); }
    const dpr = Math.min(2, window.devicePixelRatio || 1); const w = Math.round(innerWidth * dpr), h2 = Math.round(innerHeight * dpr);
    if (this.cv.width !== w || this.cv.height !== h2) { this.cv.width = w; this.cv.height = h2; }
    this.dpr = dpr;
  },
  // paper bits and marigold petals shooting up from a point
  burst(x, y, n = 80, power = 1) {
    if (this.calm()) n = Math.round(n / 4);
    this.ensure();
    for (let i = 0; i < n; i++) {
      const a = -Math.PI / 2 + (Math.random() - 0.5) * 2.4; const sp = (380 + Math.random() * 520) * power;
      this.parts.push({ x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, rot: Math.random() * TAU, vr: (Math.random() - 0.5) * 16, w: 6 + Math.random() * 7, hh: 3 + Math.random() * 5, c: this.COLS[(Math.random() * this.COLS.length) | 0], life: 2.2 + Math.random() * 1.2, t: 0, petal: Math.random() < 0.28 });
    }
    this.go();
  },
  // a shower from the top of the screen, for the big moments
  shower(n = 140) {
    if (this.calm()) n = Math.round(n / 4);
    this.ensure();
    for (let i = 0; i < n; i++) this.parts.push({ x: Math.random() * innerWidth, y: -20 - Math.random() * innerHeight * 0.5, vx: (Math.random() - 0.5) * 120, vy: 60 + Math.random() * 160, rot: Math.random() * TAU, vr: (Math.random() - 0.5) * 12, w: 6 + Math.random() * 7, hh: 3 + Math.random() * 5, c: this.COLS[(Math.random() * this.COLS.length) | 0], life: 3.2 + Math.random() * 1.5, t: 0, petal: Math.random() < 0.35 });
    this.go();
  },
  go() { if (!this.raf) { this.last = performance.now(); this.raf = requestAnimationFrame((t) => this.step(t)); } },
  step(t) {
    const dt = Math.min(0.05, Math.max(0.001, (t - this.last) / 1000)); this.last = t;
    const c = this.ctx, d = this.dpr; c.setTransform(1, 0, 0, 1, 0, 0); c.clearRect(0, 0, this.cv.width, this.cv.height);
    const alive = [];
    for (const p of this.parts) {
      p.t += dt; if (p.t > p.life) continue;
      p.vy += 820 * dt; p.vx *= 1 - 1.8 * dt; p.vy *= 1 - 1.4 * dt;   // gravity and air
      p.x += p.vx * dt + Math.sin(p.t * 6 + p.rot) * 18 * dt; p.y += p.vy * dt; p.rot += p.vr * dt;
      if (p.y > innerHeight + 30) continue;
      alive.push(p);
      c.globalAlpha = Math.min(1, (p.life - p.t) / 0.6);
      c.setTransform(d, 0, 0, d, p.x * d, p.y * d); c.rotate(p.rot); c.scale(1, Math.cos(p.t * 9 + p.rot));   // the paper flips as it falls
      c.fillStyle = p.c;
      if (p.petal) { c.beginPath(); c.ellipse(0, 0, p.w * 0.55, p.hh * 0.75, 0, 0, TAU); c.fill(); }
      else c.fillRect(-p.w / 2, -p.hh / 2, p.w, p.hh);
    }
    this.parts = alive;
    c.setTransform(1, 0, 0, 1, 0, 0); c.globalAlpha = 1;
    if (alive.length) this.raf = requestAnimationFrame((tt) => this.step(tt));
    else { this.raf = 0; c.clearRect(0, 0, this.cv.width, this.cv.height); }
  },
  buzz(p) { try { if (navigator.vibrate) navigator.vibrate(p); } catch (e) { /* not on this phone */ } },
  // coins fly from (x, y) into the money counter, which then counts up to the new amount
  coins(x, y, amount, n = 10) {
    const money = UI.el('money'); if (!money || !G.S) return;
    const to = G.S.money, from = to - amount;
    UI.moneyHold = true; money.textContent = fmtINR(from);
    const r = money.getBoundingClientRect(); const tx = r.left + 14, ty = r.top + r.height / 2 - 12;
    const fly = !this.calm() && typeof money.animate === 'function';
    if (!fly) { this.roll(from, to, 700); return; }
    let landed = 0;
    for (let i = 0; i < n; i++) {
      const el = h('i', { class: 'coinfx', 'aria-hidden': 'true' }, '₹'); this.layer().appendChild(el);
      const sx = x + (Math.random() - 0.5) * 70, sy = y + (Math.random() - 0.5) * 30;
      const mx = (sx + tx) / 2 + (Math.random() - 0.5) * 120, my = Math.min(sy, ty) - 40 - Math.random() * 80;
      const a = el.animate([
        { transform: `translate(${sx}px, ${sy}px) scale(.2)`, opacity: 0 },
        { transform: `translate(${sx}px, ${sy - 26}px) scale(1.15)`, opacity: 1, offset: 0.18 },
        { transform: `translate(${mx}px, ${my}px) scale(1)`, opacity: 1, offset: 0.55 },
        { transform: `translate(${tx}px, ${ty}px) scale(.55)`, opacity: 0.85 },
      ], { duration: 950, delay: 120 + i * 75, easing: 'cubic-bezier(.45,0,.55,1)', fill: 'both' });
      a.onfinish = () => {
        el.remove(); landed++;
        if (landed % 2 === 1) Audio2.sfx('coin');
        money.classList.remove('bump'); void money.offsetWidth; money.classList.add('bump');
        if (landed === 1) this.roll(from, to, 900);
      };
    }
    setTimeout(() => { UI.moneyHold = false; }, 3200);   // safety: never leave the counter frozen
  },
  roll(from, to, ms) {
    const money = UI.el('money'); const t0 = performance.now(); UI.moneyHold = true;
    const tick = (t) => {
      const k = Math.min(1, (t - t0) / ms); const e = 1 - Math.pow(1 - k, 3);
      money.textContent = fmtINR(from + (to - from) * e);
      if (k < 1) requestAnimationFrame(tick); else { UI.moneyHold = false; UI.dirty = true; }
    };
    requestAnimationFrame(tick);
  },
  // the card at the top: stars, a title and a cheer; one at a time
  ribbon(o) {
    this.queue.push(o); if (!this.showing) this.next();
  },
  next() {
    const o = this.queue.shift(); if (!o) { this.showing = false; return; }
    this.showing = true;
    const stars = o.stars ? h('div', { class: 'stars' }, ...Array.from({ length: o.stars }, (_, i) => h('i', { style: { animationDelay: (0.25 + i * 0.18) + 's' } }, '★'))) : null;
    const el = h('div', { class: 'cele ' + (o.kind || ''), role: 'status', 'aria-live': 'polite' },
      o.icon ? h('b', { class: 'cic' }, o.icon) : stars, h('small', null, o.top), h('strong', null, o.title), o.sub ? h('span', null, o.sub) : null);
    this.layer().appendChild(el);
    const ms = o.ms || 2600;
    setTimeout(() => { el.classList.add('out'); setTimeout(() => { el.remove(); this.next(); }, 420); }, ms);
  },
  praise() { const p = [L('Shabash!', 'శభాష్!'), L('Excellent!', 'అద్భుతం!'), L('Super!', 'సూపర్!'), L('Well done!', 'బాగా చేశారు!'), L('Amazing!', 'అదిరింది!')]; return p[(Math.random() * p.length) | 0]; },
  cardPoint() { const e = UI.el('missions'); const r = e && e.offsetParent !== null ? e.getBoundingClientRect() : null; return r && r.width ? { x: r.left + r.width / 2, y: r.top + 24 } : { x: innerWidth - 120, y: 220 }; },
  // ---- the moments ----
  mission(m) {
    if (!G.started) return;
    const tutDone = m.tpl.startsWith('t_') && G.S.missions.tut >= TUTORIAL.length;
    this.ribbon({ kind: 'mission', stars: 3, top: L('Mission complete', 'లక్ష్యం పూర్తి'), title: LN(m.title), sub: this.praise() + (m.reward ? '  +' + fmtINR(m.reward) : '') });
    const p = this.cardPoint();
    this.burst(p.x, p.y, 70, 0.9); this.burst(innerWidth / 2, 70, 60, 0.8);
    if (m.reward) this.coins(p.x, p.y, m.reward);
    Audio2.sfx('tada'); this.buzz([18, 40, 26]);
    if (tutDone) {
      setTimeout(() => this.shower(170), 900);
      this.ribbon({ kind: 'big', icon: '🎉', top: L('Tutorial complete', 'శిక్షణ పూర్తి'), title: L('You are a real farmer now!', 'మీరు ఇప్పుడు నిజమైన రైతు!'), sub: L('Missions, trophies and a daily gift are waiting.', 'లక్ష్యాలు, ట్రోఫీలు, రోజువారీ బహుమతి మీ కోసం.'), ms: 3400 });
    }
  },
  trophy(t) {
    this.ribbon({ kind: 'trophy', icon: t.icon, top: L('Trophy unlocked!', 'ట్రోఫీ వచ్చింది!'), title: LN(t), sub: '+' + fmtINR(t.reward) });
    this.burst(innerWidth / 2, 80, 70, 0.9);
    this.coins(innerWidth / 2, 110, t.reward, 6);
    Audio2.sfx('fanfare'); this.buzz([14, 30, 14]);
  },
  rank(R) {
    this.ribbon({ kind: 'big', icon: '⭐', top: L('New rank', 'కొత్త హోదా'), title: LN(R), sub: this.praise(), ms: 3400 });
    this.shower(180); Audio2.sfx('fanfare'); this.buzz([20, 50, 20, 50, 30]);
  },
  gift(x, y, r) {
    this.burst(x, y, 60, 0.8);
    if (r.money) this.coins(x, y, r.money, 8);
  },
  // a soft sunrise card, no confetti
  morning(newDay) {
    if (!G.started) return;
    const fest = Time.festivalToday();
    this.ribbon({ kind: 'sun', icon: '☀️', top: L('Good morning!', 'శుభోదయం!'), title: Time.fmtDate(), sub: fest ? LN(fest) + ' 🎉' : (newDay ? L('A fresh day on the farm', 'పొలంలో కొత్త రోజు') : ''), ms: 2600 });
  },
};
