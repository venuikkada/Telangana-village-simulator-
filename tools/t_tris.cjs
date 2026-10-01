const { open, waitReady, ROOT } = require('./harness.cjs');
(async () => {
  const { browser, page, logs } = await open({ preset: process.env.PRESET || 'LOW', viewport: { width: 640, height: 360 } });
  try {
    await waitReady(page);
    await page.waitForTimeout(4000);
    const res = await page.evaluate(() => {
      const g = window.__tvs; const T = g.sys.THREE; const out = {};
      const cam = g.camera; const frustum = new T.Frustum(); const m = new T.Matrix4().multiplyMatrices(cam.projectionMatrix, cam.matrixWorldInverse); frustum.setFromProjectionMatrix(m);
      g.scene.traverseVisible((o) => {
        if (!o.isMesh && !o.isLineSegments && !o.isPoints) return;
        const geo = o.geometry; if (!geo) return;
        const tri = (geo.index ? geo.index.count : geo.attributes.position.count) / 3;
        const inst = o.isInstancedMesh ? o.count : 1;
        let key = o.name || (o.isInstancedMesh ? 'inst:' + (o.userData.kind || o.material.type) : o.material && o.material.type) || 'mesh';
        if (o.userData && o.userData.chunk) key = 'chunk';
        if (o.userData && o.userData.crop) key = 'crop:' + o.userData.crop;
        if (o.isInstancedMesh && o.material === g.sys.Humans.parts?.torso?.mesh.material) key = 'human';
        const e = out[key] || (out[key] = { n: 0, tri: 0 }); e.n++; e.tri += tri * inst;
      });
      const arr = Object.entries(out).sort((a, b) => b[1].tri - a[1].tri).slice(0, 25).map(([k, v]) => `${k}: n=${v.n} tri=${Math.round(v.tri)}`);
      return arr;
    });
    console.log(res.join('\n'));
  } catch (e) { console.log('TEST ERROR', e.message); }
  console.log(logs.slice(0, 20).join('\n'));
  await browser.close();
})();
