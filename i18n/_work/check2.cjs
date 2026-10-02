// node check2.cjs <code> [--write]   reads out/<code>.txt ("N|translation" lines), checks it against keys.json,
// and with --write saves the finished dictionary to the game's i18n/<code>.json
const fs = require('fs'), path = require('path');
const dir = __dirname, code = process.argv[2], write = process.argv.includes('--write');
const keys = JSON.parse(fs.readFileSync(path.join(dir, 'keys.json'), 'utf8'));
const f = path.join(dir, 'out', code + '.txt');
if (!fs.existsSync(f)) { console.log('MISSING ' + f); process.exit(1); }
const tr = new Map();
for (const line of fs.readFileSync(f, 'utf8').split(/\r?\n/)) { const m = /^\s*(\d+)\s*\|(.*)$/.exec(line); if (m) tr.set(+m[1], m[2]); }
const ph = (s) => (String(s).match(/\{\d+\}/g) || []).sort().join(',');
const missing = [], badPh = [], dict = {};
keys.forEach((k, i) => {
  let t = tr.get(i + 1);
  if (t === undefined || !t.replace(/␣/g, '').trim()) { missing.push(i + 1); return; }
  t = t.replace(/\s+$/, '').replace(/^␣/, ' ').replace(/␣$/, ' ').replace(/␣/g, ' ');
  t = t.replace(/^\s+/, '').replace(/\s+$/, '');
  if (/^\s/.test(k)) t = ' ' + t; if (/\s$/.test(k)) t = t + ' ';
  if (ph(t) !== ph(k)) badPh.push(i + 1);
  dict[k] = t;
});
console.log(`${code}: ${keys.length} lines, translated ${keys.length - missing.length}, missing ${missing.length}${missing.length ? ' (e.g. ' + missing.slice(0, 15).join(', ') + ')' : ''}, placeholder mismatch ${badPh.length}${badPh.length ? ' (lines ' + badPh.slice(0, 15).join(', ') + ')' : ''}`);
console.log(missing.length || badPh.length ? 'FIX THE ABOVE' : 'ALL GOOD');
if (write) { fs.writeFileSync(path.join('/home/claude/telangana-village-simulator-/i18n', code + '.json'), JSON.stringify(dict, null, 0)); console.log('wrote i18n/' + code + '.json'); }
