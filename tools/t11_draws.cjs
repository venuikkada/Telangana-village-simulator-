// What the camera draws: draw calls and triangles by object kind, on the phone setup.
const { open, waitReady } = require('./harness.cjs');
(async () => {
  const { browser, page, logs } = await open({ preset: process.env.PRESET || 'LOW', mobile: true, viewport: { width: 915, height: 412 } });
  try {
    await waitReady(page);
    await page.evaluate(() => { window.__tvs.sys.Game.start(null, { name: 'Raju' }); });
    for (const [label, pos] of [['farm', null], ['village', { x: 8, z: 4 }]]) {
      if (pos) await page.evaluate((p) => { const s = window.__tvs.sys; s.Player.x = p.x; s.Player.z = p.z; s.Player.y = s.World.groundHeight(p.x, p.z); s.Cam.focus.set(p.x, s.Player.y + 1.4, p.z); }, pos);
      await page.waitForTimeout(8000);
      const res = await page.evaluate(() => {
        const g = window.__tvs; const T = g.sys.THREE; const cam = g.camera; cam.updateMatrixWorld();
        const fr = new T.Frustum().setFromProjectionMatrix(new T.Matrix4().multiplyMatrices(cam.projectionMatrix, cam.matrixWorldInverse));
        const out = {}; const sph = new T.Sphere();
        g.scene.traverseVisible((o) => {
          if (!(o.isMesh || o.isPoints || o.isLine)) return;
          const geo = o.geometry; if (!geo) return;
          if (o.frustumCulled !== false) {
            if (o.isInstancedMesh) { if (o.count === 0) return; if (!o.boundingSphere) o.computeBoundingSphere(); sph.copy(o.boundingSphere).applyMatrix4(o.matrixWorld); }
            else { if (!geo.boundingSphere) geo.computeBoundingSphere(); sph.copy(geo.boundingSphere).applyMatrix4(o.matrixWorld); }
            if (!fr.intersectsSphere(sph)) return;
          }
          const dr = geo.drawRange; let cnt = geo.index ? geo.index.count : geo.attributes.position.count; if (dr && dr.count !== Infinity) cnt = Math.min(cnt, dr.count);
          const tri = o.isPoints ? 0 : cnt / 3; const inst = o.isInstancedMesh ? o.count : 1;
          let key = o.name || (o.userData && (o.userData.kind || o.userData.cat)) || '';
          if (!key) { let p = o.parent; while (p && !key) { key = p.name || (p.userData && (p.userData.kind || p.userData.type)) || ''; p = p.parent; } }
          if (!key) key = (o.isInstancedMesh ? 'inst:' : '') + (o.material && (o.material.name || o.material.type));
          const e = out[key] || (out[key] = { calls: 0, tri: 0 }); e.calls += Array.isArray(o.material) ? o.material.length : 1; e.tri += tri * inst;
        });
        const rows = Object.entries(out).sort((a, b) => b[1].tri - a[1].tri);
        const tc = rows.reduce((s, r) => s + r[1].calls, 0), tt = rows.reduce((s, r) => s + r[1].tri, 0);
        return { tc, tt: Math.round(tt), rows: rows.slice(0, 30).map(([k, v]) => `${k.slice(0, 34).padEnd(34)} calls ${String(v.calls).padStart(4)}  tris ${String(Math.round(v.tri)).padStart(8)}`) };
      });
      console.log(`\n=== ${label}: ~${res.tc} calls, ${res.tt} triangles ===\n` + res.rows.join('\n'));
    }
  } catch (e) { console.log('TEST ERROR', e.message); }
  console.log(logs.filter((l) => /error/i.test(l)).slice(0, 10).join('\n'));
  await browser.close();
})();
