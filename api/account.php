<?php
// ============================================================================
// Indian Village Simulator: player accounts.
//
// Sign up and sign in with an email and password, keep the farm save online so
// it can be continued on another phone or computer, and set a new password with
// a 6-digit code sent by email.
//
// Storage is one SQLite file kept next to public_html (never served, never
// touched by Git deploys), so there are no database passwords to manage.
// Passwords and reset codes are stored only as bcrypt hashes; session tokens
// only as SHA-256 hashes. The token travels in the X-Tvs-Token header, never in
// a cookie, and every POST must be JSON, so other websites cannot act for a player.
//
// Requests: api/account.php?a=<action>
//   GET  ping | me | load
//   POST signup | signin | signout | save | forgot | reset | delete
// ============================================================================
declare(strict_types=1);
error_reporting(E_ALL);
ini_set('display_errors', '0');
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');
header('X-Content-Type-Options: nosniff');
header('Referrer-Policy: no-referrer');
header('X-Robots-Tag: noindex');

const MAX_BODY = 3000000;          // bytes; a farm save is usually well under 300 KB
const MAX_SAVE = 2500000;
const SESSION_DAYS = 180;          // a sign-in lasts this long without use
const CODE_MINUTES = 15;
const BCRYPT = ['cost' => 10];
// same cost as real hashes: an unknown email takes as long as a wrong password
const DUMMY_HASH = '$2y$10$YKVCmEWEaZYbglcvD9EFB.Ptha5jkR4Pcd6FPcaFd1d/B6zLdPFoa';
const DB_VERSION = 1;

function reply(int $status, array $data): void
{
    http_response_code($status);
    echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}
function fail(int $status, string $error, array $extra = []): void
{
    reply($status, ['ok' => false, 'error' => $error] + $extra);
}

// ---------- storage ----------
function data_dir(): string
{
    $dirs = [];
    $env = getenv('TVS_DATA_DIR');
    if ($env) $dirs[] = $env;
    $root = rtrim((string)($_SERVER['DOCUMENT_ROOT'] ?? ''), '/');
    if ($root !== '') $dirs[] = dirname($root) . '/tvs-data';   // beside public_html
    $dirs[] = __DIR__ . '/.data';                                 // fallback, locked below
    foreach ($dirs as $d) {
        if (!is_dir($d)) @mkdir($d, 0700, true);
        if (is_dir($d) && is_writable($d)) {
            if (!file_exists($d . '/.htaccess')) {
                @file_put_contents($d . '/.htaccess', "<IfModule mod_authz_core.c>\n  Require all denied\n</IfModule>\n<IfModule !mod_authz_core.c>\n  Order allow,deny\n  Deny from all\n</IfModule>\n");
            }
            if (!file_exists($d . '/index.html')) @file_put_contents($d . '/index.html', '');
            return $d;
        }
    }
    fail(500, 'server_storage');
    return '';
}

function db(): PDO
{
    static $pdo = null;
    if ($pdo instanceof PDO) return $pdo;
    if (!class_exists('PDO') || !in_array('sqlite', PDO::getAvailableDrivers(), true)) fail(500, 'server_sqlite');
    $pdo = new PDO('sqlite:' . data_dir() . '/accounts.sqlite', null, null, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    ]);
    $pdo->exec('PRAGMA busy_timeout = 8000');
    $pdo->exec('PRAGMA foreign_keys = ON');
    if ((int)$pdo->query('PRAGMA user_version')->fetchColumn() < DB_VERSION) {
        $pdo->exec('PRAGMA journal_mode = WAL');
        $pdo->exec("CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            email TEXT NOT NULL UNIQUE,
            name TEXT NOT NULL DEFAULT '',
            pass TEXT NOT NULL,
            created INTEGER NOT NULL,
            last_login INTEGER NOT NULL DEFAULT 0)");
        $pdo->exec('CREATE TABLE IF NOT EXISTS sessions (
            id TEXT PRIMARY KEY,
            user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            created INTEGER NOT NULL,
            seen INTEGER NOT NULL)');
        $pdo->exec('CREATE INDEX IF NOT EXISTS sessions_user ON sessions(user_id)');
        $pdo->exec('CREATE TABLE IF NOT EXISTS saves (
            user_id INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
            data TEXT NOT NULL,
            meta TEXT NOT NULL,
            rev INTEGER NOT NULL,
            updated INTEGER NOT NULL)');
        $pdo->exec('CREATE TABLE IF NOT EXISTS resets (
            user_id INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
            code TEXT NOT NULL,
            expires INTEGER NOT NULL,
            tries INTEGER NOT NULL DEFAULT 0)');
        $pdo->exec('CREATE TABLE IF NOT EXISTS hits (k TEXT PRIMARY KEY, n INTEGER NOT NULL, t0 INTEGER NOT NULL)');
        $pdo->exec('PRAGMA user_version = ' . DB_VERSION);
    }
    return $pdo;
}

// ---------- input ----------
function body(): array
{
    if ((int)($_SERVER['CONTENT_LENGTH'] ?? 0) > MAX_BODY) fail(413, 'too_big');
    $raw = file_get_contents('php://input', false, null, 0, MAX_BODY + 1);
    if ($raw === false || $raw === '') return [];
    if (strlen($raw) > MAX_BODY) fail(413, 'too_big');
    $j = json_decode($raw, true);
    if (!is_array($j)) fail(400, 'bad_request');
    return $j;
}
function clean_email($e): string
{
    $e = strtolower(trim((string)$e));
    if ($e === '' || strlen($e) > 254 || !filter_var($e, FILTER_VALIDATE_EMAIL)) fail(400, 'bad_email');
    return $e;
}
function check_password($p): string
{
    $p = (string)$p;
    if (strlen($p) > 200) fail(400, 'bad_request');
    $common = ['12345678', '123456789', '1234567890', '87654321', '11111111', '00000000', '12341234', 'password', 'password1', 'passw0rd', 'qwertyui', 'qwerty123', 'iloveyou', 'abcd1234', 'abcdefgh', 'india123', 'asdfghjk'];
    if (strlen($p) < 8 || in_array(strtolower($p), $common, true)) fail(400, 'weak_password');
    return $p;
}
function clean_name($n): string
{
    $n = @preg_replace('/[\x00-\x1F\x7F]+/u', '', (string)$n);
    if (!is_string($n)) return '';
    $n = trim($n);
    return function_exists('mb_substr') ? mb_substr($n, 0, 24) : substr($n, 0, 24);
}
function ip(): string
{
    return (string)($_SERVER['REMOTE_ADDR'] ?? '?');
}

// ---------- throttling: counts per key in a time window ----------
function hits_check(string $key, int $max, int $window): void
{
    $st = db()->prepare('SELECT n, t0 FROM hits WHERE k = ?');
    $st->execute([hash('sha256', $key)]);
    $r = $st->fetch();
    if ($r && time() - (int)$r['t0'] < $window && (int)$r['n'] >= $max) {
        fail(429, 'too_many', ['wait' => $window - (time() - (int)$r['t0'])]);
    }
}
function hits_add(string $key, int $window): void
{
    $db = db();
    $k = hash('sha256', $key);
    $now = time();
    $st = $db->prepare('SELECT t0 FROM hits WHERE k = ?');
    $st->execute([$k]);
    $t0 = $st->fetchColumn();
    if ($t0 !== false && $now - (int)$t0 < $window) $db->prepare('UPDATE hits SET n = n + 1 WHERE k = ?')->execute([$k]);
    else $db->prepare('INSERT OR REPLACE INTO hits (k, n, t0) VALUES (?, 1, ?)')->execute([$k, $now]);
    if (random_int(1, 100) === 1) $db->prepare('DELETE FROM hits WHERE t0 < ?')->execute([$now - 86400]);
}
function limit(string $key, int $max, int $window): void
{
    hits_check($key, $max, $window);
    hits_add($key, $window);
}

// ---------- sessions ----------
function new_session(int $uid): string
{
    $token = bin2hex(random_bytes(32));
    $now = time();
    $db = db();
    $db->prepare('INSERT INTO sessions (id, user_id, created, seen) VALUES (?, ?, ?, ?)')->execute([hash('sha256', $token), $uid, $now, $now]);
    // a player keeps at most 20 signed-in devices
    $db->prepare('DELETE FROM sessions WHERE user_id = ? AND id NOT IN (SELECT id FROM sessions WHERE user_id = ? ORDER BY seen DESC LIMIT 20)')->execute([$uid, $uid]);
    return $token;
}
function token(): string
{
    $t = (string)($_SERVER['HTTP_X_TVS_TOKEN'] ?? '');
    return preg_match('/^[a-f0-9]{64}$/', $t) ? $t : '';
}
function auth(): array
{
    $t = token();
    if ($t === '') fail(401, 'signed_out');
    $db = db();
    $sid = hash('sha256', $t);
    $st = $db->prepare('SELECT u.id, u.email, u.name, s.seen FROM sessions s JOIN users u ON u.id = s.user_id WHERE s.id = ?');
    $st->execute([$sid]);
    $u = $st->fetch();
    $now = time();
    if (!$u || $now - (int)$u['seen'] > SESSION_DAYS * 86400) {
        if ($u) $db->prepare('DELETE FROM sessions WHERE id = ?')->execute([$sid]);
        fail(401, 'signed_out');
    }
    if ($now - (int)$u['seen'] > 3600) $db->prepare('UPDATE sessions SET seen = ? WHERE id = ?')->execute([$now, $sid]);
    return $u;
}
function user_out(array $u): array
{
    return ['email' => (string)$u['email'], 'name' => (string)$u['name']];
}
// day, money, name and time of the online save, without the save itself
function save_meta(int $uid): ?array
{
    $st = db()->prepare('SELECT meta, rev FROM saves WHERE user_id = ?');
    $st->execute([$uid]);
    $r = $st->fetch();
    if (!$r) return null;
    $m = json_decode((string)$r['meta'], true);
    if (!is_array($m)) $m = [];
    $m['rev'] = (int)$r['rev'];
    return $m;
}

// ---------- email ----------
function send_code(string $email, string $name, string $code): bool
{
    $log = getenv('TVS_MAIL_LOG');   // local tests write the code to a file instead
    if ($log) return file_put_contents($log, $email . ' ' . $code . "\n", FILE_APPEND) !== false;
    $host = strtolower((string)preg_replace('/[^A-Za-z0-9.-]/', '', (string)($_SERVER['SERVER_NAME'] ?? 'localhost')));
    $host = (string)preg_replace('/^www\./', '', $host);
    $from = 'no-reply@' . $host;
    $hi = $name !== '' ? $name : 'farmer';
    $subject = 'Your Indian Village Simulator code: ' . $code;
    $text = "Namaste $hi,\r\n\r\nYour code to set a new password is:\r\n\r\n    $code\r\n\r\n"
        . 'Type it in the game within ' . CODE_MINUTES . " minutes.\r\n"
        . "If you did not ask for a new password, you can ignore this email. Your account is safe.\r\n\r\n"
        . "Happy farming!\r\nIndian Village Simulator\r\n";
    $headers = "From: Indian Village Simulator <$from>\r\nReply-To: $from\r\nMIME-Version: 1.0\r\nContent-Type: text/plain; charset=UTF-8\r\nContent-Transfer-Encoding: 8bit";
    if (@mail($email, $subject, $text, $headers, '-f' . $from)) return true;
    return @mail($email, $subject, $text, $headers);
}

// ---------- the actions ----------
try {
    $a = (string)($_GET['a'] ?? '');
    $method = (string)($_SERVER['REQUEST_METHOD'] ?? 'GET');
    $posts = ['signup', 'signin', 'signout', 'save', 'forgot', 'reset', 'delete'];
    if (in_array($a, $posts, true)) {
        if ($method !== 'POST') fail(405, 'post_only');
        if (stripos((string)($_SERVER['CONTENT_TYPE'] ?? ''), 'application/json') !== 0) fail(415, 'json_only');
    }

    switch ($a) {
        case 'ping':
            db();
            reply(200, ['ok' => true, 'v' => 1]);

        case 'signup':
            $in = body();
            $email = clean_email($in['email'] ?? '');
            $pass = check_password($in['password'] ?? '');
            $name = clean_name($in['name'] ?? '');
            limit('signup:' . ip(), 60, 3600);
            $db = db();
            $st = $db->prepare('SELECT id FROM users WHERE email = ?');
            $st->execute([$email]);
            if ($st->fetch()) fail(409, 'email_taken');
            $now = time();
            try {
                $db->prepare('INSERT INTO users (email, name, pass, created, last_login) VALUES (?, ?, ?, ?, ?)')
                    ->execute([$email, $name, password_hash($pass, PASSWORD_BCRYPT, BCRYPT), $now, $now]);
            } catch (PDOException $e) {
                fail(409, 'email_taken');
            }
            $uid = (int)$db->lastInsertId();
            reply(200, ['ok' => true, 'token' => new_session($uid), 'user' => ['email' => $email, 'name' => $name], 'save' => null]);

        case 'signin':
            $in = body();
            $email = clean_email($in['email'] ?? '');
            $pass = (string)($in['password'] ?? '');
            hits_check('signin-ip:' . ip(), 300, 900);
            hits_check('signin:' . $email, 10, 900);
            $st = db()->prepare('SELECT id, email, name, pass FROM users WHERE email = ?');
            $st->execute([$email]);
            $u = $st->fetch();
            $ok = password_verify($pass, $u ? (string)$u['pass'] : DUMMY_HASH);
            if (!$u || !$ok) {
                hits_add('signin-ip:' . ip(), 900);
                hits_add('signin:' . $email, 900);
                fail(401, 'bad_login');
            }
            $uid = (int)$u['id'];
            db()->prepare('UPDATE users SET last_login = ? WHERE id = ?')->execute([time(), $uid]);
            reply(200, ['ok' => true, 'token' => new_session($uid), 'user' => user_out($u), 'save' => save_meta($uid)]);

        case 'signout':
            $t = token();
            if ($t !== '') db()->prepare('DELETE FROM sessions WHERE id = ?')->execute([hash('sha256', $t)]);
            reply(200, ['ok' => true]);

        case 'me':
            $u = auth();
            reply(200, ['ok' => true, 'user' => user_out($u), 'save' => save_meta((int)$u['id'])]);

        case 'load':
            $u = auth();
            $st = db()->prepare('SELECT data, meta, rev FROM saves WHERE user_id = ?');
            $st->execute([(int)$u['id']]);
            $r = $st->fetch();
            if (!$r) reply(200, ['ok' => true, 'save' => null, 'data' => null]);
            $m = json_decode((string)$r['meta'], true);
            if (!is_array($m)) $m = [];
            $m['rev'] = (int)$r['rev'];
            // the save was checked to be JSON when it came in: send it as it is
            http_response_code(200);
            echo '{"ok":true,"save":' . json_encode($m, JSON_UNESCAPED_UNICODE) . ',"data":' . $r['data'] . '}';
            exit;

        case 'save':
            $u = auth();
            $uid = (int)$u['id'];
            limit('save:' . $uid, 600, 3600);
            $in = body();
            $data = $in['data'] ?? null;
            if (!is_string($data) || strlen($data) < 2) fail(400, 'bad_request');
            if (strlen($data) > MAX_SAVE) fail(413, 'too_big');
            $save = json_decode($data, true);
            if (!is_array($save) || !isset($save['v'], $save['state'], $save['fields'])) fail(400, 'bad_save');
            $meta = [
                'day' => (int)($save['day'] ?? 0),
                'money' => (int)round((float)($save['money'] ?? 0)),
                'name' => clean_name($save['name'] ?? ''),
                'savedAt' => (int)($save['savedAt'] ?? 0),
            ];
            $base = (int)($in['base'] ?? 0);
            $db = db();
            $db->exec('BEGIN IMMEDIATE');
            $st = $db->prepare('SELECT rev, meta FROM saves WHERE user_id = ?');
            $st->execute([$uid]);
            $cur = $st->fetch();
            // another device saved since this one last synced: let the player choose
            if ($cur && empty($in['force']) && (int)$cur['rev'] !== $base) {
                $db->exec('ROLLBACK');
                $m = json_decode((string)$cur['meta'], true);
                if (!is_array($m)) $m = [];
                $m['rev'] = (int)$cur['rev'];
                fail(409, 'conflict', ['save' => $m]);
            }
            $rev = (int)round(microtime(true) * 1000);
            if ($cur && $rev <= (int)$cur['rev']) $rev = (int)$cur['rev'] + 1;
            $db->prepare('INSERT OR REPLACE INTO saves (user_id, data, meta, rev, updated) VALUES (?, ?, ?, ?, ?)')
                ->execute([$uid, $data, json_encode($meta, JSON_UNESCAPED_UNICODE), $rev, time()]);
            $db->exec('COMMIT');
            reply(200, ['ok' => true, 'rev' => $rev]);

        case 'forgot':
            $in = body();
            $email = clean_email($in['email'] ?? '');
            limit('forgot-ip:' . ip(), 30, 3600);
            limit('forgot:' . $email, 4, 3600);
            $st = db()->prepare('SELECT id, name FROM users WHERE email = ?');
            $st->execute([$email]);
            $u = $st->fetch();
            if ($u) {
                $code = str_pad((string)random_int(0, 999999), 6, '0', STR_PAD_LEFT);
                db()->prepare('INSERT OR REPLACE INTO resets (user_id, code, expires, tries) VALUES (?, ?, ?, 0)')
                    ->execute([(int)$u['id'], password_hash($code, PASSWORD_BCRYPT, BCRYPT), time() + CODE_MINUTES * 60]);
                if (!send_code($email, (string)$u['name'], $code)) {
                    error_log('tvs accounts: mail() failed');
                    fail(500, 'mail_failed');
                }
            }
            // the same answer whether or not the email has an account
            reply(200, ['ok' => true]);

        case 'reset':
            $in = body();
            $email = clean_email($in['email'] ?? '');
            $code = (string)preg_replace('/\D+/', '', (string)($in['code'] ?? ''));
            $pass = check_password($in['password'] ?? '');
            limit('reset-ip:' . ip(), 60, 3600);
            $db = db();
            $st = $db->prepare('SELECT u.id, u.email, u.name, r.code, r.expires, r.tries FROM users u JOIN resets r ON r.user_id = u.id WHERE u.email = ?');
            $st->execute([$email]);
            $r = $st->fetch();
            if (!$r || (int)$r['expires'] < time() || (int)$r['tries'] >= 5 || strlen($code) !== 6) {
                if ($r) $db->prepare('UPDATE resets SET tries = tries + 1 WHERE user_id = ?')->execute([(int)$r['id']]);
                fail(400, 'bad_code');
            }
            if (!password_verify($code, (string)$r['code'])) {
                $db->prepare('UPDATE resets SET tries = tries + 1 WHERE user_id = ?')->execute([(int)$r['id']]);
                fail(400, 'bad_code');
            }
            $uid = (int)$r['id'];
            $db->prepare('UPDATE users SET pass = ?, last_login = ? WHERE id = ?')->execute([password_hash($pass, PASSWORD_BCRYPT, BCRYPT), time(), $uid]);
            $db->prepare('DELETE FROM resets WHERE user_id = ?')->execute([$uid]);
            $db->prepare('DELETE FROM sessions WHERE user_id = ?')->execute([$uid]);   // signed out on every other device
            reply(200, ['ok' => true, 'token' => new_session($uid), 'user' => user_out($r), 'save' => save_meta($uid)]);

        case 'delete':
            $u = auth();
            $uid = (int)$u['id'];
            $in = body();
            limit('delete:' . $uid, 10, 3600);
            $st = db()->prepare('SELECT pass FROM users WHERE id = ?');
            $st->execute([$uid]);
            $hash = $st->fetchColumn();
            if ($hash === false || !password_verify((string)($in['password'] ?? ''), (string)$hash)) fail(401, 'bad_password');
            $db = db();
            foreach (['saves', 'sessions', 'resets'] as $t) $db->prepare("DELETE FROM $t WHERE user_id = ?")->execute([$uid]);
            $db->prepare('DELETE FROM users WHERE id = ?')->execute([$uid]);
            reply(200, ['ok' => true]);

        default:
            fail(404, 'unknown');
    }
} catch (Throwable $e) {
    error_log('tvs accounts: ' . $e->getMessage());
    fail(500, 'server');
}
