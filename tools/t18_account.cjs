// Accounts: create one on a computer, play, sign in on a phone and continue the same farm,
// a clash when both devices played, a wrong password, and a password reset with the
// emailed code. Runs its own PHP server (php -S) with a throwaway data folder.
const { open, waitReady, ROOT } = require('./harness.cjs');
const path = require('path');
const fs = require('fs');
const os = require('os');
const { spawn } = require('child_process');
const ok = (c, msg) => { console.log((c ? 'PASS ' : 'FAIL ') + msg); if (!c) process.exitCode = 1; };
const shot = (page, n) => page.screenshot({ path: path.join(ROOT, 'shots', n + '.png'), timeout: 120000 }).catch((e) => console.log('shot failed', n, e.message));

(async () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'tvs-acct-'));
  const mail = path.join(tmp, 'mail.log');
  const PORT = 8097;
  const php = spawn('php', ['-S', '127.0.0.1:' + PORT, '-t', ROOT], { env: Object.assign({}, process.env, { TVS_DATA_DIR: path.join(tmp, 'data'), TVS_MAIL_LOG: mail }), stdio: 'ignore' });
  await new Promise((r) => setTimeout(r, 900));
  const devs = [];
  const mk = async (opts) => {
    const d = await open(Object.assign({ api: 'http://127.0.0.1:' + PORT, preset: 'LOW' }, opts));
    devs.push(d);
    d.ev = (fn, a) => d.page.evaluate(fn, a);
    d.waitFor = async (fn, ms = 30000, a) => { const t0 = Date.now(); while (Date.now() - t0 < ms) { try { if (await d.page.evaluate(fn, a)) return true; } catch (e) { /* page reloading */ } await d.page.waitForTimeout(300); } return false; };
    await waitReady(d.page);
    await d.page.waitForSelector('#tacct', { timeout: 60000 });
    return d;
  };
  const submit = (d) => d.page.click('#modal form button[type=submit]');
  try {
    // ---- computer: create an account from the title screen ----
    const A = await mk({ viewport: { width: 1280, height: 720 } });
    let t = await A.ev(() => document.getElementById('tacct').textContent);
    ok(/Sign in/.test(t), 'title corner offers Sign in: ' + t);
    await A.page.click('#tacct');
    await A.page.waitForSelector('#modal .aseg');
    await shot(A.page, 'acct_signin');
    await A.page.click('#modal .aseg button:nth-child(2)');
    await A.page.fill('#acct_email', 'Farmer.Venu@Example.com');
    await A.page.fill('#acct_pass', '1234');
    await submit(A);
    await A.waitFor(() => !!document.querySelector('#modal .aerr'), 10000);
    t = await A.ev(() => document.querySelector('#modal .aerr').textContent);
    ok(/longer password/.test(t), 'short password refused: ' + t);
    await A.page.fill('#acct_pass', 'green-fields-2026');
    await shot(A.page, 'acct_signup');
    await submit(A);
    ok(await A.waitFor(() => !!window.__tvs.sys.Account.st && document.getElementById('modal').hidden, 15000), 'account created, sheet closed');
    t = await A.ev(() => document.getElementById('tacct').textContent);
    ok(/✓/.test(t), 'title corner shows signed in: ' + t);
    await shot(A.page, 'acct_title_signed_in');
    // a new farm, saved: it goes to the account
    await A.ev(() => [...document.querySelectorAll('#tactions .tbtn')].find((x) => /New game/.test(x.textContent)).click());
    await A.page.waitForSelector('#startFarming');
    await A.ev(() => { document.getElementById('pnameInput').value = 'Venu'; document.getElementById('startFarming').click(); });
    ok(await A.waitFor(() => window.__tvs.S && document.getElementById('hud').hidden === false, 90000), 'computer: new game started');
    await A.ev(() => { window.__tvs.S.money = 77777; window.__tvs.sys.SaveSys.save(true); });
    ok(await A.waitFor(() => window.__tvs.sys.Account.state === 'saved', 20000), 'computer: farm saved to the account');
    const size = await A.ev(() => JSON.stringify(window.__tvs.sys.SaveSys.serialize()).length);
    console.log('save size', (size / 1024).toFixed(1) + ' KB');
    await A.ev(() => window.__tvs.sys.UI.settings());
    t = await A.ev(() => document.getElementById('modal').textContent);
    ok(/farmer\.venu@example\.com/.test(t), 'menu shows the account');
    await A.ev(() => window.__tvs.sys.UI.close());

    // ---- phone: sign in, the farm comes along ----
    const B = await mk({ mobile: true, viewport: { width: 915, height: 412 } });
    ok(await B.ev(() => !window.__tvs.sys.SaveSys.best()), 'phone: no farm here yet');
    await B.page.click('#tacct');
    await B.page.waitForSelector('#acct_email');
    await B.page.fill('#acct_email', 'farmer.venu@example.com');
    await B.page.fill('#acct_pass', 'wrong-password');
    await submit(B);
    await B.waitFor(() => !!document.querySelector('#modal .aerr'), 10000);
    ok(/Wrong email or password/.test(await B.ev(() => document.querySelector('#modal .aerr').textContent)), 'phone: wrong password refused');
    await B.page.fill('#acct_pass', 'green-fields-2026');
    await submit(B);
    ok(await B.waitFor(() => { const s = window.__tvs.sys; const b = s.SaveSys.best(); return !!s.Account.st && !!b && b.money === 77777; }, 20000), 'phone: the farm came from the account');
    await B.page.waitForTimeout(600);
    t = await B.ev(() => document.getElementById('tactions').textContent);
    ok(/Continue/.test(t) && /Venu/.test(t), 'phone: title offers Continue with that farm: ' + t);
    await shot(B.page, 'acct_phone_title');
    await B.ev(() => document.querySelector('#tactions .tbtn.pri').click());
    ok(await B.waitFor(() => window.__tvs.S && document.getElementById('hud').hidden === false && Math.round(window.__tvs.S.money) === 77777, 90000), 'phone: continued the same farm');
    await B.ev(() => { window.__tvs.S.money = 88888; window.__tvs.sys.SaveSys.save(true); });
    ok(await B.waitFor(() => window.__tvs.sys.Account.state === 'saved', 20000), 'phone: played on and saved');

    // ---- the computer still has the older farm open and saves: it must ask ----
    await A.ev(() => { window.__tvs.S.money = 11111; window.__tvs.sys.SaveSys.save(true); });
    ok(await A.waitFor(() => { const u = window.__tvs.sys.UI; return !!u.sheetState && u.sheetState.kind === 'acctpick'; }, 20000), 'computer: asked which farm to keep');
    t = await A.ev(() => document.getElementById('modal').textContent);
    ok(/88/.test(t) && /11/.test(t), 'computer: both farms shown: ' + t.slice(0, 220));
    await shot(A.page, 'acct_choose');
    const reloaded = A.page.waitForEvent('load', { timeout: 60000 });
    await A.ev(() => document.querySelector('#modal .afarm').click());   // the farm in the account
    await reloaded;
    await waitReady(A.page);
    await A.page.waitForSelector('#tacct', { timeout: 60000 });
    ok(await A.waitFor(() => { const b = window.__tvs.sys.SaveSys.best(); return !!b && b.money === 88888; }, 20000), 'computer: now has the phone\'s farm');
    ok(await A.waitFor(() => window.__tvs.sys.Account.state === 'saved', 15000), 'computer: in step with the account after reopening');

    // ---- phone: sign out, forgot password, emailed code, new password ----
    await B.ev(() => window.__tvs.sys.Account.signOut());
    ok(await B.waitFor(() => !window.__tvs.sys.Account.st, 15000), 'phone: signed out');
    await B.ev(() => window.__tvs.sys.Account.open());
    await B.page.waitForSelector('#modal .alink');
    await B.ev(() => [...document.querySelectorAll('#modal .alink')].find((x) => /Forgot/.test(x.textContent)).click());
    await B.page.waitForSelector('#acct_email');
    ok((await B.page.inputValue('#acct_email')) === 'farmer.venu@example.com', 'phone: email remembered');
    await submit(B);
    ok(await B.waitFor(() => !!document.getElementById('acct_code'), 15000), 'phone: code screen shown');
    const code = fs.readFileSync(mail, 'utf8').trim().split('\n').pop().split(' ')[1];
    await B.page.fill('#acct_code', code);
    await B.page.fill('#acct_pass', 'new-fields-2026');
    await shot(B.page, 'acct_reset');
    await submit(B);
    ok(await B.waitFor(() => !!window.__tvs.sys.Account.st && document.getElementById('modal').hidden, 15000), 'phone: new password set, signed in');
    ok(await B.waitFor(() => window.__tvs.sys.Account.state === 'saved', 15000), 'phone: same farm recognised, no false clash: ' + await B.ev(() => window.__tvs.sys.Account.state));
    // the old password no longer works
    const old = await B.ev(async () => { const r = await fetch('api/account.php?a=signin', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: 'farmer.venu@example.com', password: 'green-fields-2026' }) }); return r.status; });
    ok(old === 401, 'old password refused after reset: ' + old);
    for (const d of devs) { const errs = d.logs.filter((l) => /pageerror|\[error\]/.test(l) && !/favicon|ERR_FAILED|net::|Failed to load resource/.test(l)); ok(errs.length === 0, 'no page errors ' + JSON.stringify(errs.slice(0, 3))); }
  } catch (e) {
    console.log('FAIL exception', e.message);
    process.exitCode = 1;
  } finally {
    for (const d of devs) await d.browser.close().catch(() => {});
    php.kill();
  }
})();
