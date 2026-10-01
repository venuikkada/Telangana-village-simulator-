// Build: concatenate the page shell and the JS modules into
//   dist/game.mjs      - the game code on its own (for syntax checks and linting)
//   dist/artifact.html - page body as published on claude.ai (no doctype; the host adds it)
//   index.html         - standalone page you can open or host anywhere (GitHub Pages, itch.io, your site)
import fs from 'fs';
import path from 'path';
const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const jsDir = path.join(root, 'src/js');
const files = fs.readdirSync(jsDir).filter((f) => f.endsWith('.js')).sort();
let js = '';
for (const f of files) js += `\n// ---- ${f} ----\n` + fs.readFileSync(path.join(jsDir, f), 'utf8');
if (js.includes('</script')) throw new Error('JS contains </script');
const page = fs.readFileSync(path.join(root, 'src/page.html'), 'utf8').trimEnd();
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
  '<meta name="apple-mobile-web-app-title" content="Village Farm">',
  '<meta name="format-detection" content="telephone=no">',
  '<link rel="manifest" href="manifest.webmanifest">',
  '<link rel="icon" type="image/png" sizes="192x192" href="icons/icon-192.png">',
  '<link rel="apple-touch-icon" href="icons/apple-touch-icon.png">',
  '<style>:root{color-scheme:light}html,body{margin:0;background:#15141f}[hidden]{display:none!important}</style>',
].join('\n');
const standalone = '<!doctype html>\n<html lang="en">\n<head>\n' + head + '\n</head>\n<body>\n' + body + '</body>\n</html>\n';
fs.writeFileSync(path.join(root, 'index.html'), standalone);
console.log('built', files.length, 'modules,', (standalone.length / 1024).toFixed(1), 'KB');
