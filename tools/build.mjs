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
const standalone = '<!doctype html>\n<html lang="en">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">\n<meta name="theme-color" content="#15141f">\n<style>:root{color-scheme:light}body{margin:0}[hidden]{display:none!important}</style>\n</head>\n<body>\n' + body + '</body>\n</html>\n';
fs.writeFileSync(path.join(root, 'index.html'), standalone);
console.log('built', files.length, 'modules,', (standalone.length / 1024).toFixed(1), 'KB');
