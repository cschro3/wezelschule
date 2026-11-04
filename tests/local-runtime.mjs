// The same local runner used on Windows; real compiled Worker, persistent D1/R2,
// real Argon2id/TOTP sessions. No live accounts, credentials or network services.
import assert from 'node:assert/strict';
import { randomBytes, createHmac } from 'node:crypto';
import { mkdtemp, mkdir, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { zipSync, strToU8 } from 'fflate';
import { createLocalRuntime, OWNER, sha256 } from '../scripts/local-runtime.mjs';
const stateDirectory = await mkdtemp(join(tmpdir(), 'wezel-local-'));
let runtime = await createLocalRuntime({ stateDirectory, fixtureMode: 'synthetic' });
const origin = 'http://localhost:3000', cookies = new Map(), results = [];
const password = randomBytes(30).toString('base64url');
let secret, recovery, persistedDesign, importedId;
async function request(path, { body, method = body === undefined ? 'GET' : 'POST', authenticated = true, extraHeaders = {} } = {}) {
  const headers = { Origin: origin, 'x-wezel-request': 'cms', 'cf-connecting-ip': '127.0.0.1', ...extraHeaders };
  if (authenticated) headers.Cookie = [...cookies].map(([k, v]) => k + '=' + v).join('; ');
  if (body !== undefined && !(body instanceof FormData)) headers['Content-Type'] = 'application/json';
  const outgoing = new Request(origin + path, { method, headers, body: body instanceof FormData ? body : body === undefined ? undefined : JSON.stringify(body) });
  const r = await runtime.mf.dispatchFetch(outgoing.url, { method, headers: Object.fromEntries(outgoing.headers), ...(body === undefined ? {} : { body: new Uint8Array(await outgoing.arrayBuffer()) }), redirect: 'manual' });
  if (authenticated) for (const c of r.headers.getSetCookie()) { const raw = c.split(';')[0], i = raw.indexOf('='); if (/max-age=0/i.test(c)) cookies.delete(raw.slice(0, i)); else cookies.set(raw.slice(0, i), raw.slice(i + 1)); }
  return r;
}
async function json(path, options) { const r = await request(path, options), text = await r.text(); assert.equal(r.status, 200, path + ': status=' + r.status + ' location=' + r.headers.get('location')); let d; try { d = JSON.parse(text); } catch { throw new Error(path + ': invalid JSON response, length=' + text.length); } return d; }
async function check(name, fn) { await fn(); results.push({ function: name, result: 'passed', error: null, priority: null, correction: null }); console.log('PASS ' + name); }
function otp(value) {
  let bits = ''; const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  for (const c of value.replace(/=+$/, '')) bits += alphabet.indexOf(c).toString(2).padStart(5, '0');
  const bytes = []; for (let i = 0; i + 8 <= bits.length; i += 8) bytes.push(parseInt(bits.slice(i, i + 8), 2));
  const time = Buffer.alloc(8); time.writeBigUInt64BE(BigInt(Math.floor(Date.now() / 30000)));
  const hash = createHmac('sha1', Buffer.from(bytes)).update(time).digest(), offset = hash.at(-1) & 15;
  return String((hash.readUInt32BE(offset) & 0x7fffffff) % 1000000).padStart(6, '0');
}
async function publish(id, input) {
  for (const status of ['review', 'approved', 'published']) {
    const entry = (await json('/api/admin/overview')).entries.find(x => x.id === id);
    await json('/api/admin/entries/' + id, { method: 'PATCH', body: { ...input, blocks: typeof input.blocks === 'string' ? JSON.parse(input.blocks) : input.blocks, status, version: entry.version } });
  }
}
async function upload(bytes, name) { const form = new FormData(); form.set('privacyReviewed', 'true'); form.set('file', new File([bytes], name)); return json('/api/calendar-admin/upload', { body: form }); }
try {
  await check('All four original migrations apply locally; only synthetic accounts/content and two original test logos are seeded', async () => {
    assert.equal((await runtime.db.prepare('SELECT COUNT(*) AS n FROM local_test_migrations').first()).n, 4);
    const users = (await runtime.db.prepare('SELECT * FROM users').all()).results; assert.equal(users.length, 1); assert.equal(users[0].email, OWNER.email);
    assert.equal((await runtime.db.prepare('SELECT COUNT(*) AS n FROM auth_users').first()).n, 0);
    const data = await json('/api/content', { authenticated: false }); assert(data.items.every(e => e.id.startsWith('local-'))); assert(!JSON.stringify(data).includes('info@wezelschule.de'));
    for (const id of ['local-logo', 'local-logo-dark']) assert.equal((await request('/api/files/' + id, { authenticated: false })).status, 200);
  });
  await check('Anonymous access, forged Sites identity and public registration are rejected in local-only auth mode', async () => {
    assert.equal((await request('/api/admin/overview', { authenticated: false, extraHeaders: { 'oai-authenticated-user-id': OWNER.id, 'oai-authenticated-user-email': OWNER.email } })).status, 401);
    assert.equal((await request('/api/security/bootstrap', { body: { password }, authenticated: false })).status, 403);
    assert.equal((await request('/api/auth/sign-up/email', { body: { email: OWNER.email, password, name: 'Blocked' } })).status, 404);
  });
  await check('Single-use local invitation provisions real Argon2id without an embedded password', async () => {
    const token = randomBytes(32).toString('hex'), t = Date.now();
    await runtime.db.prepare('INSERT INTO auth_invitations(id,user_id,token_hash,created_by,created_at,expires_at) VALUES (?,?,?,?,?,?)').bind('test-invite', OWNER.id, sha256(token), OWNER.id, t, t + 86400000).run();
    await json('/api/security/accept-invitation', { body: { token, password } });
    assert.equal((await request('/api/security/accept-invitation', { body: { token, password } })).status, 400);
    const row = await runtime.db.prepare('SELECT password FROM auth_accounts').first(); assert.match(row.password, /^\$argon2id\$/);
  });
  await check('Wrong password fails; valid HTTP loopback login sets HttpOnly SameSite cookies without HTTPS-only flags', async () => {
    assert.equal((await request('/api/auth/sign-in/email', { body: { email: OWNER.email, password: randomBytes(30).toString('hex') } })).status, 401);
    const r = await request('/api/auth/sign-in/email', { body: { email: OWNER.email, password } }); assert.equal(r.status, 200);
    assert(r.headers.getSetCookie().some(c => /HttpOnly/i.test(c) && /SameSite=Lax/i.test(c) && !/; Secure/i.test(c)));
    assert.equal((await request('/api/admin/overview')).status, 401);
  });
  await check('TOTP enrollment and verification unlock the administrator; ten recovery codes are issued privately', async () => {
    const setup = await json('/api/auth/two-factor/enable', { body: { password } });
    secret = new URL(setup.totpURI).searchParams.get('secret'); recovery = setup.backupCodes;
    assert.equal(recovery.length, 10);
    await json('/api/auth/two-factor/verify-totp', { body: { code: otp(secret), trustDevice: false } });
    assert.equal((await json('/api/security/status')).user.mfa, true);
  });
  await check('Login, admin, security, designer and calendar pages render with the actual local MFA session', async () => {
    for (const path of ['/login', '/admin', '/account/security', '/admin/design', '/admin/calendar', '/admin/calendar/import', '/termine', '/lokale-testseite']) {
      const r = await request(path), html = await r.text(); assert.equal(r.status, 200, path); assert(!html.includes('Ein kurzer Zwischenstopp.'), path);
      assert(!html.includes('Bail out to client-side rendering'), path);
      if (path === '/login') assert(html.includes('Willkommen zurück.'));
    }
    const r = await request('/'); const html = await r.text();
    const assets = [...new Set([...html.matchAll(/(?:src|href)="(\/[^"?#]+\.(?:js|css|woff2?|svg))(?:[?#][^"]*)?"/g)].map(x => x[1]))];
    for (const path of assets) assert.equal((await request(path)).status, 200, path);
    assert(assets.length > 3);
  });
  await check('CMS page draft, review, approval and local publication preserve public visibility boundaries', async () => {
    const input = { kind: 'page', title: 'Lokal veröffentlichte Prüffläche', slug: 'lokale-pruefung', body: 'Synthetischer Inhalt', excerpt: 'Lokaler Test', category: 'Lokaler Test', status: 'draft', rights: 1, blocks: [] };
    const { id } = await json('/api/admin/entries', { body: input });
    assert.equal((await request('/lokale-pruefung', { authenticated: false })).status, 404);
    await publish(id, input); assert.equal((await request('/lokale-pruefung', { authenticated: false })).status, 200);
  });
  await check('Designer saves an actual draft, renders a private preview and publishes only to the local database', async () => {
    let design = await json('/api/admin/design'); const config = structuredClone(design.config); config.footer.text = 'Persistente lokale Designerprüfung'; config.brand.mobileLogoWidth = 205;
    design = await json('/api/admin/design', { method: 'PATCH', body: { config, version: design.version, baseVersion: design.publishedVersion } });
    assert.equal((await json('/api/admin/design')).config.brand.mobileLogoWidth, 205);
    assert(!(await (await request('/', { authenticated: false })).text()).includes(config.footer.text));
    assert((await (await request('/admin/preview?design=1')).text()).includes(config.footer.text));
    for (const action of ['review', 'approve', 'publish']) design = await json('/api/admin/design', { body: { action, version: design.version, baseVersion: design.publishedVersion } });
    persistedDesign = config.footer.text; assert((await (await request('/', { authenticated: false })).text()).includes(persistedDesign));
  });
  for (const format of ['csv', 'xlsx', 'ics']) await check(format.toUpperCase() + ' stages, previews/maps, imports one selected draft and rejects duplicate creation', async () => {
    const title = 'Synthetischer ' + format.toUpperCase() + ' Termin';
    let data = 'Titel;Datum;Beginn;Ende\n' + title + ';2026-11-19;15:00;16:00';
    if (format === 'xlsx') {
      const row = values => '<row>' + values.map(v => '<c t="inlineStr"><is><t>' + v + '</t></is></c>').join('') + '</row>';
      data = zipSync(Object.fromEntries(Object.entries({ '[Content_Types].xml': '<Types/>', 'xl/workbook.xml': '<workbook xmlns:r="urn:r"><sheets><sheet name="Testblatt" r:id="r1"/></sheets></workbook>', 'xl/_rels/workbook.xml.rels': '<Relationships><Relationship Id="r1" Target="worksheets/sheet1.xml"/></Relationships>', 'xl/worksheets/sheet1.xml': '<worksheet>' + row(['Titel', 'Datum', 'Beginn', 'Ende']) + row([title, '2026-11-19', '15:00', '16:00']) + '</worksheet>' }).map(([k, v]) => [k, strToU8(v)])));
    }
    if (format === 'ics') data = 'BEGIN:VCALENDAR\r\nVERSION:2.0\r\nBEGIN:VEVENT\r\nUID:local-ics-only\r\nSUMMARY:' + title + '\r\nDTSTART;TZID=Europe/Berlin:20261119T150000\r\nDTEND;TZID=Europe/Berlin:20261119T160000\r\nRRULE:FREQ=WEEKLY;COUNT=3\r\nEND:VEVENT\r\nEND:VCALENDAR';
    const job = await upload(data, 'lokaler-test.' + format);
    const mapping = format === 'ics' ? Object.fromEntries(['title', 'date', 'startTime', 'endDate', 'endTime', 'allDay', 'body', 'location', 'category', 'audience', 'visibility', 'status', 'rrule', 'externalId', 'timeZone'].map((key, i) => [key, i])) : { title: 0, date: 1, startTime: 2, endTime: 3 };
    const preview = await json('/api/calendar-admin/preview/' + job.id, { body: { sheet: 0, mapping } }); assert.equal(preview.summary.invalid, 0);
    const report = await json('/api/calendar-admin/complete/' + job.id, { body: { sheet: 0, version: job.version, confirm: true, rightsReviewed: true, choices: preview.rows.map(r => ({ row: r.row, event: r.event, action: 'create', status: 'draft' })) } }); assert.equal(report.created, 1);
    const id = report.entries[0].id; importedId = id;
    const entry = (await json('/api/admin/overview')).entries.find(e => e.id === id); assert.equal(entry.title, title); assert.equal(entry.status, 'draft');
    assert(!(await json('/api/content', { authenticated: false })).items.some(e => e.id === id));
    const duplicate = await upload(data, 'lokaler-test.' + format); assert(duplicate.repeated);
    const duplicatePreview = await json('/api/calendar-admin/preview/' + duplicate.id, { body: { sheet: 0, mapping } }); assert.equal(duplicatePreview.rows[0].duplicates[0].id, id);
    if (format === 'ics') { assert.equal(entry.rrule, 'FREQ=WEEKLY;COUNT=3'); await publish(id, { ...entry, rights: 1 }); assert((await (await request('/api/calendar', { authenticated: false })).text()).includes(title)); }
  });
  await check('Security mail is captured locally and unknown outgoing requests are blocked without contacting a remote service', async () => {
    await json('/api/auth/request-password-reset', { body: { email: OWNER.email } });
    assert.equal(runtime.mailbox.length, 1); assert(runtime.mailbox[0].text.includes('http://localhost:3000/'));
    const source = await json('/api/calendar-admin/sources', { body: { name: 'Synthetischer Egress-Test', url: 'https://calendar.google.com/calendar/ical/test/basic.ics', enabled: 1, publicDataConfirmed: true } });
    const overview = await json('/api/calendar-admin/overview'); const id = overview.sources.find(x => x.name === 'Synthetischer Egress-Test').id;
    assert((await request('/api/calendar-admin/fetch/' + id, { body: { confirm: true, privacyReviewed: true } })).status >= 400);
    assert.equal(runtime.blocked.length, 1);
  });
  await check('A fresh Miniflare process preserves migrations, local credentials, R2 media, designer changes and imported events', async () => {
    await runtime.dispose(); runtime = await createLocalRuntime({ stateDirectory, fixtureMode: 'synthetic' });
    assert.equal((await runtime.db.prepare('SELECT COUNT(*) AS n FROM local_test_migrations').first()).n, 4);
    assert.equal((await json('/api/security/status')).user.mfa, true);
    assert.equal((await json('/api/admin/design')).config.footer.text, persistedDesign);
    assert((await json('/api/admin/overview')).entries.some(x => x.id === importedId));
    assert.equal((await request('/api/files/local-logo-dark', { authenticated: false })).status, 200);
    assert.equal((await runtime.db.prepare('SELECT COUNT(*) AS n FROM users').first()).n, 1);
  });
  await check('Logout denies every protected module; password re-login still requires TOTP and a recovery code works once', async () => {
    await json('/api/auth/sign-out', { body: {} });
    for (const path of ['/api/admin/overview', '/api/admin/design', '/api/calendar-admin/overview', '/api/security/users-overview']) assert.equal((await request(path)).status, 401);
    const login = await json('/api/auth/sign-in/email', { body: { email: OWNER.email, password } }); assert(login.twoFactorRedirect);
    assert.equal((await request('/api/admin/overview')).status, 401);
    await json('/api/auth/two-factor/verify-backup-code', { body: { code: recovery[0], disableSession: false } }); assert.equal((await request('/api/admin/overview')).status, 200);
    await json('/api/auth/sign-out', { body: {} }); await json('/api/auth/sign-in/email', { body: { email: OWNER.email, password } });
    assert((await request('/api/auth/two-factor/verify-backup-code', { body: { code: recovery[0] } })).status >= 400);
    await json('/api/auth/two-factor/verify-totp', { body: { code: otp(secret), trustDevice: false } });
  });
} catch (error) {
  results.push({ function: 'First failing assertion', result: 'failed', error: String(error.message).slice(0, 500), priority: 'high', correction: 'Investigate before calling this local runtime verified.' });
  console.error(error.stack); process.exitCode = 1;
} finally {
  await runtime.dispose(); await rm(stateDirectory, { recursive: true, force: true });
  await mkdir('tests/.generated/phase6', { recursive: true });
  await writeFile('tests/.generated/phase6/local-runtime.json', JSON.stringify({ timestamp: new Date().toISOString(), platform: process.platform, node: process.version, sourceCommit: 'c68517161c6c5b6142087707c74eadc73abb41a7', runtime: 'local runner; compiled Worker; persistent local D1/R2; real password/TOTP APIs; not browser password entry', productionConnected: false, remoteRequestsSent: 0, passed: results.filter(r => r.result === 'passed').length, results }, null, 2) + '\n');
}
