const { open, waitReady, ROOT } = require('./harness.cjs');
const path = require('path');
(async () => {
  const { browser, page, logs } = await open({ preset: 'LOW', viewport: { width: 960, height: 540 } });
  let seen = 0;
  const newLogs = () => { const l = logs.slice(seen).filter((x) => !x.startsWith('[log]') && !x.includes('GPU stall') && !x.includes('Automatic fallback')); seen = logs.length; return l; };
  const ev = async (name, fn, arg) => {
    try {
      const r = await Promise.race([page.evaluate(fn, arg), new Promise((_, rej) => setTimeout(() => rej(new Error('eval timeout')), 90000))]);
      console.log(`✓ ${name}:`, typeof r === 'string' ? r : JSON.stringify(r));
    } catch (e) { console.log(`✗ ${name}: ${e.message.split('\n')[0]}`); }
    const l = newLogs(); if (l.length) console.log('   logs:\n   ' + l.join('\n   ').slice(0, 3000));
  };
  try {
    await waitReady(page);
    await page.waitForTimeout(1500);
    await page.screenshot({ path: path.join(ROOT, 'shots/p_title.png'), timeout: 120000 });
    newLogs();
    // UI flow: New game -> name -> start
    await page.click('#tactions button.pri');
    await page.waitForTimeout(400);
    await page.fill('#pnameInput', 'Venu');
    await page.click('#newgame .tbtn.pri');
    await page.waitForFunction(() => window.__tvs.started, null, { timeout: 90000 });
    await page.waitForTimeout(3000);
    await page.screenshot({ path: path.join(ROOT, 'shots/p_start.png'), timeout: 120000 });
    await ev('state', () => { const g = window.__tvs, s = g.sys, S = g.S; return { name: S.player.name, money: S.money, clock: s.Time.fmtClock(), date: s.Time.fmtDate(), missions: S.missions.active.map((m) => m.tpl), veh: s.Vehicles.player.map((v) => v.type + '@' + v.x.toFixed(0) + ',' + v.z.toFixed(0)), P: [s.Player.x.toFixed(1), s.Player.z.toFixed(1)], F1: s.Fields.byId.F1 && { o: s.Fields.byId.F1.owner, bw: s.Fields.byId.F1.borewell, n: s.Fields.byId.F1.n, acres: s.Fields.byId.F1.acres }, GH: s.Fields.byId.GH && s.Fields.byId.GH.owner, avail: s.Fields.list.filter((f) => f.avail).map((f) => f.id + ':' + f.avail + ':' + f.acres).join(' ') }; });
    // buy seeds and fertilizer through the shop function
    await ev('buy', () => { const s = window.__tvs.sys; s.UI.buyItem('seed_paddy', 1); s.UI.buyItem('urea', 2); s.UI.buyItem('pesticide', 1); s.UI.close && s.UI.modalOpen() && s.UI.close(); return { money: window.__tvs.S.money, inv: window.__tvs.S.inv, missions: window.__tvs.S.missions.active.map((m) => m.tpl + ':' + m.prog.toFixed(2)) }; });
    // walk to field: t_walk
    await ev('walk to F1', () => { const s = window.__tvs.sys; const f = s.Fields.byId.F1; s.Player.x = f.x; s.Player.z = f.z; s.Missions.update(); return window.__tvs.S.missions.active.map((m) => m.tpl + ':' + m.prog.toFixed(2)); });
    // keyboard: select hoe and hold F while standing in F1
    await page.evaluate(() => { const s = window.__tvs.sys; const f = s.Fields.byId.F1; s.Player.x = f.x0 + 5; s.Player.z = f.z0 + 5; });
    await page.keyboard.press('Digit2');
    await page.keyboard.down('KeyF'); await page.waitForTimeout(6000); await page.keyboard.up('KeyF');
    await ev('keyboard hoe', () => { const s = window.__tvs.sys; const f = s.Fields.byId.F1; return { tool: s.Player.tool, ploughed: f.countMin(1), energy: window.__tvs.S.player.energy.toFixed(2) }; });
    // plough with hoe over every tile
    const workAll = (tool, opt) => { const s = window.__tvs.sys; const f = s.Fields.byId.F1; s.Player.setTool(tool); if (opt) s.Player.opt[opt[0]] = opt[1]; s.Player.yaw = 0; let calls = 0; for (let z = f.z0 + 1; z < f.z1; z += 2) for (let x = f.x0 + 1; x < f.x1; x += 2) { s.Player.x = x; s.Player.z = z - 0.8; s.Player.doWork(f); calls++; } return { calls, t0: f.count(0), t1: f.count(1), t2: f.count(2), t3: f.count(3), crop: f.crop, nut: f.nut.toFixed(1), weeds: f.weeds.toFixed(1), missions: window.__tvs.S.missions.active.map((m) => m.tpl + ':' + m.prog.toFixed(2)) }; };
    await ev('hoe', workAll, 'hoe');
    await ev('hoe again (cultivate)', workAll, 'hoe');
    await ev('sow', ([tool, opt]) => { const s = window.__tvs.sys; const f = s.Fields.byId.F1; s.Player.setTool(tool); s.Player.opt.seeds = 'paddy'; let calls = 0; for (let z = f.z0 + 1; z < f.z1; z += 2) for (let x = f.x0 + 1; x < f.x1; x += 2) { s.Player.x = x; s.Player.z = z - 0.8; s.Player.yaw = 0; s.Player.doWork(f); calls++; } return { calls, t3: f.count(3), crop: f.crop, seeds: s.Inv.count('seed_paddy').toFixed(2), missions: window.__tvs.S.missions.active.map((m) => m.tpl + ':' + m.prog.toFixed(2)) }; }, ['seeds']);
    await ev('pump on', () => { const s = window.__tvs.sys; const it = s.Interact.list.find((o) => o.id === 'pump_F1'); if (!it) return 'no pump interaction'; it.act(); return { pump: s.Fields.byId.F1.pump, label: it.label() }; });
    await ev('advance 6h', () => { const s = window.__tvs.sys; s.Sim.advance(360); const f = s.Fields.byId.F1; return { clock: s.Time.fmtClock(), water: f.water.toFixed(1), growth: f.growth.toFixed(3), health: f.health.toFixed(1), pump: f.pump, missions: window.__tvs.S.missions.active.map((m) => m.tpl + ':' + m.prog.toFixed(2)) }; });
    await ev('fertilize', () => { const s = window.__tvs.sys; const f = s.Fields.byId.F1; s.Player.setTool('fert'); s.Player.opt.fert = 'urea'; for (let z = f.z0 + 1; z < f.z1; z += 2) for (let x = f.x0 + 1; x < f.x1; x += 2) { s.Player.x = x; s.Player.z = z - 0.8; s.Player.yaw = 0; s.Player.doWork(f); } return { nut: f.nut.toFixed(1), urea: s.Inv.count('urea').toFixed(2), missions: window.__tvs.S.missions.active.map((m) => m.tpl + ':' + m.prog.toFixed(2)) }; });
    await ev('grow with care', () => { const s = window.__tvs.sys; const f = s.Fields.byId.F1; const out = [];
      const pass = (tool, opt) => { s.Player.setTool(tool); if (opt) s.Player.opt[opt[0]] = opt[1]; for (let z = f.z0 + 1; z < f.z1; z += 2) for (let x = f.x0 + 1; x < f.x1; x += 2) { s.Player.x = x; s.Player.z = z - 0.8; s.Player.yaw = 0; s.Player.doWork(f); } };
      s.UI.buyItem('urea', 2); s.UI.buyItem('pesticide', 2); if (s.UI.modalOpen()) s.UI.close();
      for (let k = 0; k < 14 && f.growth < 1; k++) {
        if (f.water < 70) f.pump = true;
        if (f.weeds > 20) pass('hoe');
        if (f.outbreak || f.pests > 8) pass('sprayer', ['sprayer', 'pesticide']);
        if (f.nut < 30) pass('fert', ['fert', 'urea']);
        s.Sim.advance(8 * 60);
        out.push(`${s.Time.fmtClock()} d${s.Time.day()} g=${f.growth.toFixed(2)} h=${f.health.toFixed(0)} w=${f.water.toFixed(0)} n=${f.nut.toFixed(0)} p=${f.pests.toFixed(0)}${f.outbreak ? '!' : ''} wd=${f.weeds.toFixed(0)}`);
      }
      return out; });
    await page.waitForTimeout(2500);
    await page.screenshot({ path: path.join(ROOT, 'shots/p_grown.png'), timeout: 120000 });
    await ev('harvest', () => { const s = window.__tvs.sys; const f = s.Fields.byId.F1; s.Player.setTool('sickle'); for (let z = f.z0 + 1; z < f.z1; z += 2) for (let x = f.x0 + 1; x < f.x1; x += 2) { s.Player.x = x; s.Player.z = z - 0.8; s.Player.yaw = 0; s.Player.doWork(f); } return { heap: f.heap && { crop: f.heap.crop, qty: f.heap.qty.toFixed(2), q: f.heap.q.toFixed(2) }, crop: f.crop, t3: f.count(3), missions: window.__tvs.S.missions.active.map((m) => m.tpl + ':' + m.prog.toFixed(2)) }; });
    await ev('load cart + sell at yard', () => { const s = window.__tvs.sys; const f = s.Fields.byId.F1; const v = s.Vehicles.player.find((q) => q.type === 'bullock'); s.Services.loadHeap(v, f); const cargo = v.cargo.map((c) => c.crop + ':' + c.qty.toFixed(2)); s.Player.enterVehicle(v); s.UI.yardMenu(v); const html = document.getElementById('modal').innerText.slice(0, 300); return { cargo, html }; });
    await ev('click first sell button', () => { const b = [...document.querySelectorAll('#modal button.btn')].find((x) => /sell|అమ్మ/i.test(x.textContent)); if (!b) return 'no sell button: ' + [...document.querySelectorAll('#modal button')].map((x) => x.textContent).join('|'); b.click(); const s = window.__tvs.sys; return { clicked: b.textContent, money: Math.round(window.__tvs.S.money), cargo: s.Player.vehicle && s.Player.vehicle.cargo.length, missions: window.__tvs.S.missions.active.map((m) => m.tpl + ':' + m.prog.toFixed(2)), done: window.__tvs.S.missions.done }; });
    await ev('close + exit vehicle', () => { const s = window.__tvs.sys; if (s.UI.modalOpen()) s.UI.close(); s.Player.exitVehicle(true); return { inV: !!s.Player.vehicle, P: [s.Player.x.toFixed(1), s.Player.z.toFixed(1)] }; });
    // every menu
    const menus = ['homeMenu', 'office', 'map', 'settings', 'help', 'villageMenu', 'workshop', 'dealer'];
    for (const m of menus) await ev('menu ' + m, (m) => { const s = window.__tvs.sys; s.UI[m](); const t = document.getElementById('modal').innerText.length; s.UI.close(); return 'chars=' + t; }, m);
    for (const tab of ['fields', 'storage', 'workers', 'build', 'market', 'finance', 'missions', 'trophies', 'profile']) await ev('office tab ' + tab, (tab) => { const s = window.__tvs.sys; s.UI.office(tab); const t = document.getElementById('modal').innerText.length; s.UI.close(); return 'chars=' + t; }, tab);
    for (const k of ['seed', 'kirana']) await ev('shop ' + k, (k) => { const s = window.__tvs.sys; s.UI.shop(k); const t = document.getElementById('modal').innerText.length; s.UI.close(); return 'chars=' + t; }, k);
    await ev('finance menus', () => { const s = window.__tvs.sys; s.UI.financeMenu('bank'); const a = document.getElementById('modal').innerText.length; s.UI.close(); s.UI.financeMenu('lender'); const b = document.getElementById('modal').innerText.length; s.UI.close(); return [a, b]; });
    await ev('msp + land + heap menus', () => { const s = window.__tvs.sys; s.UI.mspMenu(null); s.UI.close(); const f = s.Fields.list.find((q) => q.avail); s.UI.landMenu(f); const t = document.getElementById('modal').innerText.slice(0, 200); s.UI.close(); return t; });
    await ev('food + doctor + pray', () => { const s = window.__tvs.sys; s.UI.foodMenu(['tea', 'samosa'], 'Tea'); s.UI.close(); s.Services.eat('tea'); s.Services.doctor(); s.Services.pray(); return { money: Math.round(window.__tvs.S.money), energy: Math.round(window.__tvs.S.player.energy) }; });
    await ev('dialog with every named NPC', () => { const s = window.__tvs.sys; const out = []; for (const n of s.NPCs.list.filter((q) => q.named)) { s.Dialog.open(n); out.push(n.id + ':' + document.querySelector('#modal .say').textContent.length); s.Dialog.close(n); } return out.join(' '); });
    await ev('borrow + repay', () => { const s = window.__tvs.sys; s.Finance.borrow('bank', 50000); s.Finance.repay('bank', 10000); return { money: Math.round(window.__tvs.S.money), loans: window.__tvs.S.loans }; });
    await ev('lease field + rent tractor + harvester svc', () => { const s = window.__tvs.sys; const f = s.Fields.list.find((q) => q.avail === 'lease' || q.avail === 'both'); s.Farm.leaseField(f); s.Services.rentTractor('plough'); return { leased: f.id, owner: f.owner, money: Math.round(window.__tvs.S.money), veh: s.Vehicles.player.map((v) => v.type + (v.rentUntil ? '(rent)' : '')) }; });
    await ev('drive rented tractor 3s', async () => { const s = window.__tvs.sys; const v = s.Vehicles.player.find((q) => q.rentUntil); s.Player.enterVehicle(v); for (let i = 0; i < 90; i++) v.update(1 / 30, { throttle: 1, steer: 0.2, brake: false }); const sp = v.speed; s.Player.toggleImplement(); for (let i = 0; i < 30; i++) v.update(1 / 30, { throttle: 1, steer: 0, brake: false }); s.Player.exitVehicle(true); return { x: v.x.toFixed(1), z: v.z.toFixed(1), speed: sp.toFixed(2), fuel: v.fuel.toFixed(2), lowered: v.lowered }; });
    await ev('hire worker + upgrades + village project', () => { const s = window.__tvs.sys; window.__tvs.S.money += 3000000; s.Workers.hire('farmhand'); s.Farm.buyUpgrade('waterTank'); s.Farm.upgradeHouse(); s.Village.start('lights'); s.Farm.drillBorewell(s.Fields.list.find((f) => f.owner === 'lease')); return { workers: window.__tvs.S.workers.length, cons: window.__tvs.S.construction.map((c) => c.key) }; });
    await ev('advance 2 days (construction)', () => { const s = window.__tvs.sys; s.Sim.advance(48 * 60); return { cons: window.__tvs.S.construction.map((c) => c.key), up: window.__tvs.S.up, house: window.__tvs.S.houseLevel, village: window.__tvs.S.village, date: s.Time.fmtDate(), rank: window.__tvs.S.rank, missions: window.__tvs.S.missions.active.map((m) => m.tpl) }; });
    await ev('buy tractor + implement', () => { const s = window.__tvs.sys; s.UI.buyVehicle('tractor35'); const before = window.__tvs.S.implements.slice(); s.UI.workshop(); const b = [...document.querySelectorAll('#modal button.btn')].find((x) => /Cultivator|కల్టివేటర్/.test(x.textContent)); if (b) b.click(); s.UI.close(); return { veh: s.Vehicles.player.map((v) => v.type), impl: window.__tvs.S.implements, before }; });
    await ev('field job via worker driver? sleep', () => { const s = window.__tvs.sys; s.Player.x = -122; s.Player.z = 56; s.Sim.sleep(true); return 'sleep queued'; });
    await page.waitForTimeout(2000);
    await ev('after sleep', () => { const s = window.__tvs.sys; return { clock: s.Time.fmtClock(), date: s.Time.fmtDate(), energy: window.__tvs.S.player.energy }; });
    await ev('save', () => { const s = window.__tvs.sys; const ok = s.SaveSys.save(true); const raw = localStorage.getItem('tvs_save_v1'); return { ok, size: raw ? raw.length : 0, status: s.SaveSys.status() }; });
    await page.waitForTimeout(3000);
    await page.screenshot({ path: path.join(ROOT, 'shots/p_after.png'), timeout: 120000 });
    // reload and continue
    await page.reload({ waitUntil: 'load' });
    await waitReady(page);
    await page.waitForTimeout(1000);
    await page.screenshot({ path: path.join(ROOT, 'shots/p_title2.png'), timeout: 120000 });
    newLogs();
    await page.click('#tactions button.pri');
    await page.waitForFunction(() => window.__tvs.started, null, { timeout: 90000 });
    await page.waitForTimeout(2500);
    await ev('restored', () => { const g = window.__tvs, s = g.sys, S = g.S; return { name: S.player.name, money: Math.round(S.money), date: s.Time.fmtDate(), clock: s.Time.fmtClock(), up: S.up, house: S.houseLevel, veh: s.Vehicles.player.map((v) => v.type), fields: s.Fields.playerFields().map((f) => f.id + ':' + f.owner + ':' + (f.crop || '-') + ':' + f.count(0)), workers: S.workers.length, missions: S.missions.active.map((m) => m.tpl) }; });
    await page.screenshot({ path: path.join(ROOT, 'shots/p_restored.png'), timeout: 120000 });
  } catch (e) { console.log('TEST ERROR', e.message); }
  const l = newLogs(); if (l.length) console.log('remaining logs:\n' + l.join('\n').slice(0, 4000));
  await browser.close();
})();
