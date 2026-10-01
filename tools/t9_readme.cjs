// Clean screenshots for the README
const { open, waitReady, ROOT } = require('./harness.cjs');
const path = require('path');
const OUT = (n) => path.join(ROOT, 'shots/readme', n);
async function prep(page) {
  await page.addStyleTag({ content: '#toasts,.big-banner,#newsbar{display:none!important}' });
}
(async () => {
  { // desktop
    const { browser, page } = await open({ preset: 'HIGH', viewport: { width: 1280, height: 720 } });
    await waitReady(page); await prep(page);
    await page.evaluate(() => window.__tvs.sys.Game.start(null, { name: 'Venu' }));
    // gameplay at F1 with a growing paddy crop
    await page.evaluate(() => { const g = window.__tvs, s = g.sys; g.S.time.min = 9.3 * 60; const f = s.Fields.byId.F1; for (let i = 0; i < f.n; i++) f.tiles[i] = 3; f.sownTiles = f.n; f.crop = 'paddy'; f.growth = 0.62; f.water = 82; f.health = 96; f.cropDirty = true; f.allDirty = true; f.fu.uLeafRipe.value.set('#cfa84a'); f.fu.uFruitA.value.set('#e0c060'); f.fu.uFruitB.value.set('#d9b34f'); s.Player.x = f.x0 - 3; s.Player.z = f.z1 - 5; s.Player.yaw = Math.PI / 2 + 0.3; s.Cam.yaw = s.Player.yaw + Math.PI; s.Cam.pitch = 0.3; s.Cam.focus.set(s.Player.x, 1.5, s.Player.z); s.Player.setTool('sickle'); });
    await page.waitForTimeout(7000);
    await page.screenshot({ path: OUT('gameplay.png'), timeout: 180000 });
    // golden hour over the village, HUD hidden
    await page.evaluate(() => { const g = window.__tvs, s = g.sys; g.S.time.min = 17.45 * 60; s.Sky.lastEnvElev = -999; s.UI.photo(); s.Cam.intro = (dt, cam) => { cam.position.set(-120, 22, 118); cam.lookAt(-20, 4, 0); s.Cam.focus.set(-70, 0, 60); }; });
    await page.waitForTimeout(6000);
    await page.screenshot({ path: OUT('golden-hour.png'), timeout: 180000 });
    // night drive with headlights
    await page.evaluate(() => { const g = window.__tvs, s = g.sys; g.S.time.min = 20.6 * 60; s.Sky.lastEnvElev = -999; s.Cam.intro = null; const v = s.Vehicles.player.find((q) => q.type === 'bullock'); s.Player.enterVehicle(v); v.lights = true; s.Cam.yaw = v.yaw + Math.PI + 0.5; s.Cam.pitch = 0.22; s.Cam.tDist = s.Cam.dist = 9; });
    await page.waitForTimeout(6000);
    await page.screenshot({ path: OUT('night.png'), timeout: 180000 });
    await browser.close();
  }
  { // phone landscape
    const { browser, page } = await open({ mobile: true, viewport: { width: 915, height: 412 } });
    await waitReady(page); await prep(page);
    await page.evaluate(() => window.__tvs.sys.Game.start(null, { name: 'Venu' }));
    await page.evaluate(() => { const g = window.__tvs, s = g.sys; g.S.time.min = 10 * 60; const f = s.Fields.byId.F1; for (let i = 0; i < f.n; i++) f.tiles[i] = i % 12 < 7 ? 3 : 1; f.sownTiles = f.count(3); f.crop = 'cotton'; f.growth = 0.45; f.water = 64; f.cropDirty = true; f.allDirty = true; s.Player.x = f.x0 + 4; s.Player.z = f.z0 + 6; s.Player.yaw = 0.6; s.Cam.yaw = s.Player.yaw + Math.PI; s.Cam.focus.set(s.Player.x, 1.5, s.Player.z); s.Player.setTool('hoe'); });
    await page.waitForTimeout(7000);
    await page.screenshot({ path: OUT('phone.png'), timeout: 180000 });
    await browser.close();
  }
  console.log('done');
})();
