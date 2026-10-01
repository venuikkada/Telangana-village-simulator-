// Shared Playwright harness: serves dist/artifact.html on a fake origin, maps the
// three.js CDN import to node_modules, stubs Google Fonts.
const path = require('path');
const fs = require('fs');
let pw; try { pw = require('playwright'); } catch (e) { pw = require(path.join(require('child_process').execSync('npm root -g').toString().trim(), 'playwright')); }
const { chromium } = pw;
const ROOT = path.resolve(__dirname, '..');
fs.mkdirSync(path.join(ROOT, 'shots/readme'), { recursive: true });
async function open(opts = {}) {
  const browser = await chromium.launch({ headless: true, args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--enable-webgl', '--autoplay-policy=no-user-gesture-required'] });
  const ctx = await browser.newContext({ viewport: opts.viewport || { width: 1280, height: 720 }, deviceScaleFactor: 1, isMobile: !!opts.mobile, hasTouch: !!opts.mobile, userAgent: opts.mobile ? 'Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Mobile Safari/537.36' : undefined });
  const page = await ctx.newPage();
  const logs = [];
  page.on('console', (m) => logs.push(`[${m.type()}] ${m.text()}`));
  page.on('pageerror', (e) => logs.push(`[pageerror] ${e.message}\n${e.stack || ''}`));
  await page.route('**/*', async (route) => {
    const url = route.request().url();
    if (url.startsWith('http://tvs.test/') && !url.startsWith('http://tvs.test/fonts/')) {
      const html = fs.readFileSync(path.join(ROOT, 'dist/artifact.html'), 'utf8');
      const doc = '<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><style>:root{color-scheme:light;padding:env(safe-area-inset-top) 0 env(safe-area-inset-bottom)}body{margin:0;font:14px system-ui;background:#fafaf7}img{max-width:100%}[hidden]{display:none!important}</style></head><body>' + html + '</body></html>';
      return route.fulfill({ status: 200, contentType: 'text/html', body: doc });
    }
    if (url.includes('cdn.jsdelivr.net/npm/three@0.170.0/build/three.module.min.js')) {
      return route.fulfill({ status: 200, contentType: 'application/javascript', headers: { 'Access-Control-Allow-Origin': '*' }, body: fs.readFileSync(path.join(ROOT, 'node_modules/three/build/three.module.min.js'), 'utf8') });
    }
    if (url.includes('fonts.googleapis.com')) {
      const faces = [];
      for (const [fam, dir, w] of [['Baloo Tammudu 2', 'baloo-tammudu-2', [500, 600, 700, 800]], ['Hind Guntur', 'hind-guntur', [400, 500, 600, 700]]]) for (const wt of w) for (const sub of ['telugu', 'latin']) faces.push(`@font-face{font-family:'${fam}';font-style:normal;font-weight:${wt};font-display:swap;src:url(http://tvs.test/fonts/${dir}/${dir}-${sub}-${wt}-normal.woff2) format('woff2');${sub === 'telugu' ? 'unicode-range:U+0951-0952,U+0964-0965,U+0C00-0C7F,U+1CDA,U+1CF2,U+200C-200D,U+25CC;' : ''}}`);
      return route.fulfill({ status: 200, contentType: 'text/css', headers: { 'Access-Control-Allow-Origin': '*' }, body: faces.join('\n') });
    }
    if (url.startsWith('http://tvs.test/fonts/')) {
      const rel = url.slice('http://tvs.test/fonts/'.length); const dir = rel.split('/')[0];
      return route.fulfill({ status: 200, contentType: 'font/woff2', headers: { 'Access-Control-Allow-Origin': '*' }, body: fs.readFileSync(path.join(ROOT, 'node_modules/@fontsource', dir, 'files', rel.split('/')[1])) });
    }
    if (url.includes('fonts.gstatic.com')) return route.abort();
    return route.abort();
  });
  if (opts.preset) await page.addInitScript((p) => { try { localStorage.setItem('tvs_prefs', JSON.stringify(Object.assign(JSON.parse(localStorage.getItem('tvs_prefs') || '{}'), { preset: p }))); } catch (e) {} }, opts.preset);
  await page.goto('http://tvs.test/', { waitUntil: 'load' });
  return { browser, ctx, page, logs };
}
async function waitReady(page, timeout = 240000) {
  await page.waitForFunction(() => window.__tvs && (window.__tvs.ready || document.getElementById('lmsg').textContent.includes('wrong') || document.getElementById('lmsg').textContent.includes('WebGL')), null, { timeout, polling: 500 });
  return page.evaluate(() => ({ ready: window.__tvs.ready, msg: document.getElementById('lmsg').textContent }));
}
module.exports = { open, waitReady, ROOT };
