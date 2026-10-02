// Languages: every on-screen sentence is written in the source as L('English', 'Telugu').
// This tool lets the game speak more languages without touching those thousand-odd calls:
//
//  * transform(src): used by the build. L(`Day ${n} of 7`, ...) becomes
//      (LANG === 'en' ? `Day ${n} of 7` : L(`Day ${n} of 7`, ..., 'Day {0} of 7', [n]))
//    so other languages can look the sentence up by its template and fill in the values.
//    ${x.en} inside a template passes x itself, so a crop or season name gets translated too.
//    Objects { en: `...${v}...`, te: ... } get _k/_a the same way (read by LN).
//  * keys: every English sentence or name the game can show, with the Telugu as a hint.
//    `node tools/i18n.mjs` writes i18n/_source.json and reports what each language is missing.
//  * check: placeholders must survive translation exactly.
import fs from 'fs';
import path from 'path';
import * as acorn from 'acorn';

const TE = /[ఀ-౿]/;
const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
export const LANG_IDS = ['hi', 'bn', 'mr', 'ta', 'gu', 'kn', 'ml', 'pa', 'or', 'as', 'ur'];

function walk(n, fn, parent) {
  if (!n || typeof n.type !== 'string') return;
  fn(n, parent);
  for (const k in n) {
    if (k === 'parent') continue;
    const v = n[k];
    if (Array.isArray(v)) { for (const c of v) if (c && typeof c.type === 'string') walk(c, fn, n); }
    else if (v && typeof v.type === 'string') walk(v, fn, n);
  }
}
const isStr = (n) => n && n.type === 'Literal' && typeof n.value === 'string';
const tplKey = (t) => t.quasis.reduce((s, q, i) => s + (i ? `{${i - 1}}` : '') + q.value.cooked, '');
// a value inside an English template: x.en means "the name of x" (translated at show time)
function argSrc(src, e) {
  if (e.type === 'MemberExpression' && !e.computed && e.property.type === 'Identifier' && e.property.name === 'en') return src.slice(e.object.start, e.object.end);
  return src.slice(e.start, e.end);
}
const teOf = (src, n) => (!n ? '' : isStr(n) ? n.value : n.type === 'TemplateLiteral' ? tplKey(n) : src.slice(n.start, n.end));

// returns the transformed source; adds every translatable English key to `keys`
export function transform(src, file, keys = new Map()) {
  const ast = acorn.parse(src, { ecmaVersion: 2022, sourceType: 'module', allowReturnOutsideFunction: true, locations: true });
  const edits = [];   // { start, end, text } replacements, or { at, text } insertions
  const add = (k, te, node) => { if (!k || !/[A-Za-z]/.test(k)) return; if (!keys.has(k)) keys.set(k, { te: te || '', at: `${file}:${node.loc.start.line}` }); };
  walk(ast, (n) => {
    if (n.type === 'CallExpression') {
      const a = n.arguments;
      if (n.callee.type === 'Identifier' && n.callee.name === 'L' && a.length === 2) {
        if (isStr(a[0])) add(a[0].value, teOf(src, a[1]), n);
        else if (a[0].type === 'TemplateLiteral') {
          const key = tplKey(a[0]); add(key, teOf(src, a[1]), n);
          const en = src.slice(a[0].start, a[0].end), te = src.slice(a[1].start, a[1].end);
          const args = a[0].expressions.map((e) => argSrc(src, e)).join(', ');
          edits.push({ start: n.start, end: n.end, text: `(LANG === 'en' ? ${en} : L(${en}, ${te}, ${JSON.stringify(key)}, [${args}]))` });
        }
      }
      // English/Telugu pairs handed to helpers: step('...', '...'), MAP_PLACES rows, etc.
      for (let i = 0; i + 1 < a.length; i++) if (isStr(a[i]) && !TE.test(a[i].value) && isStr(a[i + 1]) && TE.test(a[i + 1].value)) add(a[i].value, a[i + 1].value, n);
    }
    if (n.type === 'ArrayExpression') {
      const a = n.elements;
      for (let i = 0; i + 1 < a.length; i++) if (isStr(a[i]) && !TE.test(a[i].value) && isStr(a[i + 1]) && TE.test(a[i + 1].value)) add(a[i].value, a[i + 1].value, n);
    }
    if (n.type === 'ObjectExpression') {
      const prop = (name) => n.properties.find((p) => p.type === 'Property' && !p.computed && ((p.key.type === 'Identifier' && p.key.name === name) || (p.key.type === 'Literal' && p.key.value === name)));
      const en = prop('en'), te = prop('te');
      if (en && te) {
        if (isStr(en.value)) add(en.value.value, teOf(src, te.value), n);
        else if (en.value.type === 'TemplateLiteral') {
          const key = tplKey(en.value); add(key, teOf(src, te.value), n);
          const args = en.value.expressions.map((e) => argSrc(src, e)).join(', ');
          const last = n.properties[n.properties.length - 1];
          edits.push({ start: last.end, end: last.end, text: `, _k: ${JSON.stringify(key)}, _a: [${args}]` });
        }
      }
    }
  });
  // apply from the end so earlier offsets stay valid; skip edits nested inside a replaced range
  edits.sort((x, y) => y.start - x.start || y.end - x.end);
  let out = src; let floor = Infinity;
  for (const e of edits) {
    // a translatable template nested inside another one: keep the inner one, warn so the source can be split up
    if (e.end > floor && e.start < floor) { console.warn(`i18n: nested template in ${file} at ${e.start}; outer sentence stays English in other languages`); continue; }
    out = out.slice(0, e.start) + e.text + out.slice(e.end);
    floor = Math.min(floor, e.start);
  }
  return out;
}

// data-en="..." data-te="..." in the page shell
export function htmlKeys(html, keys = new Map()) {
  const re = /data-en="([^"]*)"(?:\s+data-te="([^"]*)")?/g; let m;
  while ((m = re.exec(html))) if (/[A-Za-z]/.test(m[1]) && !keys.has(m[1])) keys.set(m[1], { te: m[2] || '', at: 'page.html' });
  return keys;
}

export function allKeys() {
  const keys = new Map();
  const jsDir = path.join(root, 'src/js');
  for (const f of fs.readdirSync(jsDir).filter((x) => x.endsWith('.js')).sort()) transform(fs.readFileSync(path.join(jsDir, f), 'utf8'), f, keys);
  htmlKeys(fs.readFileSync(path.join(root, 'src/page.html'), 'utf8'), keys);
  return keys;
}

const ph = (s) => (String(s).match(/\{\d+\}/g) || []).sort().join(',');
export function check(lang, keys) {
  const file = path.join(root, 'i18n', lang + '.json');
  if (!fs.existsSync(file)) return { lang, missing: keys.size, bad: [], extra: 0 };
  const d = JSON.parse(fs.readFileSync(file, 'utf8'));
  let missing = 0; const bad = [];
  for (const [k] of keys) { const t = d[k]; if (typeof t !== 'string' || !t.trim()) missing++; else if (ph(t) !== ph(k)) bad.push(k); }
  const extra = Object.keys(d).filter((k) => !keys.has(k)).length;
  return { lang, missing, bad, extra };
}

if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(new URL(import.meta.url).pathname)) {
  const keys = allKeys();
  fs.mkdirSync(path.join(root, 'i18n'), { recursive: true });
  const obj = {}; for (const [k, v] of keys) obj[k] = v;
  fs.writeFileSync(path.join(root, 'i18n/_source.json'), JSON.stringify(obj, null, 1));
  let chars = 0; for (const [k] of keys) chars += k.length;
  console.log(`${keys.size} keys, ${chars} characters of English → i18n/_source.json`);
  for (const l of LANG_IDS) { const r = check(l, keys); console.log(`${l}: missing ${r.missing}, placeholder problems ${r.bad.length}${r.bad.length ? ' e.g. ' + JSON.stringify(r.bad.slice(0, 2)) : ''}, unused ${r.extra}`); }
}
