// Build: concatenate the page shell and the JS modules into
//   dist/game.mjs      - the game code on its own (for syntax checks and linting)
//   dist/artifact.html - page body as published on claude.ai (no doctype; the host adds it)
//   index.html         - standalone page you can open or host anywhere (GitHub Pages, itch.io, your site)
//   i18n/_source.json  - every English sentence the game shows (what the language files translate)
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { transform, htmlKeys } from './i18n.mjs';
const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const jsDir = path.join(root, 'src/js');
const files = fs.readdirSync(jsDir).filter((f) => f.endsWith('.js')).sort();
const keys = new Map();
let js = '';
for (const f of files) js += `\n// ---- ${f} ----\n` + transform(fs.readFileSync(path.join(jsDir, f), 'utf8'), f, keys);
if (js.includes('</script')) throw new Error('JS contains </script');
// language files are fetched when picked; the version makes browsers fetch new ones after an update
const i18nDir = path.join(root, 'i18n'); fs.mkdirSync(i18nDir, { recursive: true });
const hash = crypto.createHash('sha1');
for (const f of fs.readdirSync(i18nDir).filter((x) => /^[a-z]{2}\.json$/.test(x)).sort()) hash.update(fs.readFileSync(path.join(i18nDir, f)));
js = `\nconst I18N_VER = '${hash.digest('hex').slice(0, 10)}';` + js;
const page = fs.readFileSync(path.join(root, 'src/page.html'), 'utf8').trimEnd();
htmlKeys(page, keys);
const src = {}; for (const [k, v] of keys) src[k] = v;
fs.writeFileSync(path.join(i18nDir, '_source.json'), JSON.stringify(src, null, 1));
const body = page + '\n<script type="module">' + js + '\n</script>\n';
fs.mkdirSync(path.join(root, 'dist'), { recursive: true });
fs.writeFileSync(path.join(root, 'dist/game.mjs'), js);
fs.writeFileSync(path.join(root, 'dist/artifact.html'), body);
// standalone page: also an installable web app (Add to Home Screen gives full screen on iPhone and Android)
const head = [
  '<meta charset="utf-8">',
  '<meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no,viewport-fit=cover">',
  '<meta name="theme-color" content="#15141f">',
  '<meta name="mobile-web-app-capable" content="yes">',
  '<meta name="apple-mobile-web-app-capable" content="yes">',
  '<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">',
  '<meta name="apple-mobile-web-app-title" content="Indian Village">',
  '<meta name="format-detection" content="telephone=no">',
  '<link rel="manifest" href="manifest.webmanifest">',
  '<link rel="icon" type="image/png" sizes="192x192" href="icons/icon-192.png">',
  '<link rel="apple-touch-icon" href="icons/apple-touch-icon.png">',
  '<style>:root{color-scheme:light}html,body{margin:0;background:#15141f}[hidden]{display:none!important}</style>',
].join('\n');
const standalone = '<!doctype html>\n<html lang="en">\n<head>\n' + head + '\n</head>\n<body>\n' + body + '</body>\n</html>\n';
fs.writeFileSync(path.join(root, 'index.html'), standalone);
console.log('built', files.length, 'modules,', (standalone.length / 1024).toFixed(1), 'KB,', keys.size, 'sentences');
