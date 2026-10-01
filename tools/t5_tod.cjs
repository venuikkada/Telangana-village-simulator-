const { open, waitReady, ROOT } = require('./harness.cjs');
const path = require('path');
(async () => {
  const { browser, page, logs } = await open({ preset: process.env.PRESET || 'HIGH', viewport: { width: 640, height: 360 } });
  try {
    await waitReady(page);
    await page.evaluate(() => window.__tvs.sys.Game.start(null, { name: 'T' }));
    await page.waitForTimeout(1500);
    await page.evaluate(() => { const s = window.__tvs.sys; s.UI.photo(); document.getElementById('toasts').style.display = 'none'; s.Cam.intro = (dt, cam) => { cam.position.set(-150, 16, 150); cam.lookAt(-70, 2, 40); s.Cam.focus.set(-110, 0, 95); }; });
    const shots = (process.env.SHOTS || '5.6:sunny,6.4:sunny,8.5:sunny,13:sunny,17.6:sunny,18.6:sunny,21:sunny,13:rain,16:storm,7:mist,13:heatwave').split(',');
    for (const sh of shots) {
      const [hr, wx] = sh.split(':');
      await page.evaluate(([hr, wx]) => { const g = window.__tvs, s = g.sys; g.S.time.min = Math.floor(g.S.time.min / 1440) * 1440 + (+hr) * 60; g.S.weather.id = wx; g.S.weather.left = 9999; const T = s.Weather; Object.assign(T.cur, { id: wx }); const W = { sunny: [0.1, 0, 0.2, 0, 0.1], rain: [0.98, 0.85, 0.55, 0.35, 0], storm: [1, 1, 0.95, 0.4, 0], mist: [0.3, 0, 0.05, 1, 0], heatwave: [0.04, 0, 0.45, 0, 0.7] }[wx]; Object.assign(T.cur, { cloud: W[0], rain: W[1], wind: W[2], fog: W[3], haze: W[4] }); g.S.world.wet = wx === 'rain' || wx === 'storm' ? 0.8 : 0.1; s.Sky.lastEnvElev = -999; }, [hr, wx]);
      if (process.env.DRIVE) await page.evaluate(() => { const s = window.__tvs.sys; const v = s.Vehicles.player.find((q) => q.type === 'moped'); s.Player.enterVehicle(v); v.lights = true; s.Cam.intro = null; s.Cam.yaw = v.yaw + Math.PI; });
      await page.waitForTimeout(2500);
      await page.screenshot({ path: path.join(ROOT, `shots/tod_${hr}_${wx}${process.env.DRIVE ? '_drive' : ''}.png`), timeout: 120000 });
      const info = await page.evaluate(() => { const s = window.__tvs.sys; return { elev: s.Sky.sunElev.toFixed(1), night: s.Sky.night.toFixed(2), exp: window.__tvs.renderer.toneMappingExposure.toFixed(2), sunI: s.Sky.sun.intensity.toFixed(2), hemi: s.Sky.hemi.intensity.toFixed(2), env: window.__tvs.scene.environmentIntensity.toFixed(2) }; });
      console.log(sh, JSON.stringify(info));
    }
  } catch (e) { console.log('TEST ERROR', e.message); }
  console.log(logs.filter((l) => !l.startsWith('[log]') && !l.includes('GPU stall')).slice(0, 20).join('\n'));
  await browser.close();
})();
