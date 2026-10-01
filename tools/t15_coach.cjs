// Coach check: the step-by-step instruction for every mission type, in English and Telugu,
// plus the tutorial played with nothing but the coach's instructions.
const { open, waitReady } = require('./harness.cjs');
(async () => {
  const { browser, page, logs } = await open({ mobile: true, viewport: { width: 915, height: 412 } });
  try {
    await waitReady(page);
    await page.evaluate(() => { const s = window.__tvs.sys; s.Settings.v.voice = false; s.Game.start(null, { name: 'Raju' }); });
    await page.waitForTimeout(2500);
    // 1) every mission type, from two spots (home and the village), both languages
    const r = await page.evaluate(() => {
      const s = window.__tvs.sys, g = window.__tvs;
      const tpls = [{ tpl: 'plant', crop: 'maize', target: 1 }, { tpl: 'harvestQ', crop: 'paddy', target: 5 }, { tpl: 'deliver', crop: 'paddy', target: 5 }, { tpl: 'msp', target: 3 }, { tpl: 'earnSales', target: 50000 }, { tpl: 'income', target: 100000 }, { tpl: 'sellHigh', crop: 'paddy', crop2: 'paddy', price: 99999, target: 1 }, { tpl: 'santha', target: 1 }, { tpl: 'buyTractor', target: 1 }, { tpl: 'buyImpl', impl: 'plough', target: 1 }, { tpl: 'rentT', target: 1 }, { tpl: 'expand', target: 2 }, { tpl: 'ownLand', target: 2 }, { tpl: 'leaseLand', target: 1 }, { tpl: 'build', up: 'waterTank', target: 1 }, { tpl: 'house', target: 1 }, { tpl: 'village', proj: 'lights', target: 1 }, { tpl: 'repairBore', target: 1 }, { tpl: 'hire', target: 1 }, { tpl: 'rankUp', rank: 1, target: 1 }, { tpl: 'talk', npc: 'srinu', target: 1 }, { tpl: 'milk', target: 40 }, { tpl: 'repay', target: 1 }, { tpl: 'pray', target: 1 }, { tpl: 'visitBank', target: 1 }, { tpl: 'organic', target: 1 }, { tpl: 'savePest', field: 'F1', target: 1 }, { tpl: 'drought', target: 1 }, { tpl: 'festival', mark: 'temple', target: 1 }, { tpl: 'mystery', mark: 'yard', target: 1 }];
      const out = [];
      for (const lang of ['en', 'te']) {
        window.LANG_SET = lang; s.Settings.v.lang = lang; s.UI.applyLang();
        for (const m of tpls) {
          m.title = { en: m.tpl, te: m.tpl }; m.uid = 9000 + out.length;
          let st; try { st = (s.Coach && (window.__coachSteps || null)); } catch (e) { st = null; }
          const fn = window.__tvs.sys.COACH_STEPS[m.tpl] || window.__tvs.sys.COACH_STEPS._default;
          let res; try { res = fn(m); } catch (e) { res = { text: 'ERROR ' + e.message }; }
          out.push(`${lang} ${m.tpl.padEnd(10)} → ${res ? res.text : '(null)'}${res && res.target ? '  [→ ' + res.target.name + ']' : ''}`);
        }
      }
      s.Settings.v.lang = 'en'; s.UI.applyLang();
      return out;
    });
    console.log(r.join('\n'));
    // 2) the tutorial, doing only what the coach says
    const step = () => page.evaluate(() => { const s = window.__tvs.sys; s.Coach.update(); const st = s.Coach.step; return st ? { m: st.m.tpl, text: st.text, icon: st.icon, target: st.target && st.target.name } : null; });
    const log = [];
    for (let i = 0; i < 40; i++) {
      const st = await step(); if (!st) { log.push('no step'); break; }
      const key = st.m + ': ' + st.text; if (log[log.length - 1] !== key) log.push(key);
      const did = await page.evaluate((st) => {
        const s = window.__tvs.sys, P = s.Player; const g = window.__tvs;
        if (st.target) { const t = s.Coach.step.target; P.x = t.x + 1; P.z = t.z + 1; P.y = s.World.groundHeight(P.x, P.z); return 'walked'; }
        if (st.icon === 'work' || st.icon === 'wait' && /Hold|పట్టుకుని/.test(st.text)) { const f = s.Fields.list.find((q) => q.isPlayer && P.x > q.x0 - 1 && P.x < q.x1 + 1 && P.z > q.z0 - 1 && P.z < q.z1 + 1) || s.Fields.byId.F1; for (let z = f.z0 + 1; z < f.z1; z += 2.5) for (let x = f.x0 + 1; x < f.x1; x += 2.5) { P.x = x; P.z = z; P.doWork(f); } P.x = f.x0 + 3; P.z = f.z0 + 3; s.Missions.update(); if (s.Coach.step && /pump is filling/.test(s.Coach.step.text)) s.Sim.advance(120); return 'worked'; }
        if (st.icon === 'tap' || st.icon === 'wait') {
          s.Interact.update(); const cur = s.Interact.current || []; const real = cur.filter((o) => o.id !== 'exit');
          if (real.length) {
            const o = real[0]; o.act();
            const modal = document.getElementById('modal');
            if (!modal.hidden) { const b = modal.querySelector('.btn.acc') || modal.querySelector('.opts .btn'); if (b) b.click(); }
            s.Missions.update(); return 'tapped ' + o.id;
          }
          return 'nothing to tap';
        }
        return 'skip';
      }, st);
      if (did === 'nothing to tap') { await page.waitForTimeout(300); }
      await page.waitForTimeout(did.startsWith('tapped rest') ? 1600 : 250);
      const tut = await page.evaluate(() => window.__tvs.S.missions.tut);
      if (tut >= 8) { log.push('TUTORIAL DONE'); break; }
    }
    console.log('\n' + log.join('\n'));
    console.log(JSON.stringify(await page.evaluate(() => ({ money: Math.round(window.__tvs.S.money), tut: window.__tvs.S.missions.tut, day: window.__tvs.sys.Time.day(), active: window.__tvs.S.missions.active.map((m) => m.tpl) }))));
  } catch (e) { console.log('TEST ERROR', e.message); }
  console.log(logs.filter((l) => /pageerror|\[error\]/i.test(l)).slice(0, 10).join('\n'));
  await browser.close();
})();
