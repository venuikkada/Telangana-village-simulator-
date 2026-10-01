const path = require('path'); const fs = require('fs');
let pw; try { pw = require('playwright'); } catch (e) { pw = require(path.join(require('child_process').execSync('npm root -g').toString().trim(), 'playwright')); }
const { chromium } = pw;
const ROOT = path.resolve(__dirname, '..');
(async () => {
  const browser = await chromium.launch({ headless: true, args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const page = await (await browser.newContext({ viewport: { width: 800, height: 450 } })).newPage();
  const logs = []; page.on('pageerror', (e) => logs.push('pageerror ' + e.message)); page.on('console', (m) => { if (m.type() === 'error') logs.push(m.text()); });
  await page.route('**/*', (route) => { const u = route.request().url();
    if (u.startsWith('http://site.test/')) return route.fulfill({ status: 200, contentType: 'text/html', body: fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8') });
    if (u.includes('three.module.min.js')) return route.fulfill({ status: 200, contentType: 'application/javascript', headers: { 'Access-Control-Allow-Origin': '*' }, body: fs.readFileSync(path.join(ROOT, 'node_modules/three/build/three.module.min.js'), 'utf8') });
    if (u.includes('fonts.googleapis.com')) return route.fulfill({ status: 200, contentType: 'text/css', body: '' });
    return route.abort(); });
  await page.goto('http://site.test/');
  await page.waitForFunction(() => window.__tvs && window.__tvs.ready, null, { timeout: 120000 });
  const r = await page.evaluate(() => ({ title: document.title, ready: window.__tvs.ready, titleShown: !document.getElementById('title').hidden }));
  console.log(JSON.stringify(r), logs.join('\n'));
  await browser.close();
})();
