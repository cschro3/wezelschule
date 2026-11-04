// Default end-user profile: actual published school appearance, separate local
// accounts. The synthetic profile is tested separately by local-runtime.mjs.
import assert from 'node:assert/strict';
import { mkdtemp, readFile, mkdir, writeFile, rm, access } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { randomBytes, createHmac, createHash } from 'node:crypto';
import { createLocalRuntime, OWNER } from '../scripts/local-runtime.mjs';
import { ORIGINAL_LOGOS, SCHOOL_MARKER } from '../scripts/local-school.mjs';
const state = await mkdtemp(join(tmpdir(), 'wezel-school-'));
const legacyState = await mkdtemp(join(tmpdir(), 'wezel-school-upgrade-'));
const results = [], snapshot = JSON.parse(await readFile('exports/published/content.json', 'utf8'));
let runtime = await createLocalRuntime({ stateDirectory: state }), legacy;
async function check(name, fn) { await fn(); results.push({ function: name, result: 'passed' }); console.log('PASS ' + name); }
async function json(runtime, path) { const response = await runtime.mf.dispatchFetch('http://localhost:3000' + path); assert.equal(response.status, 200, path); return response.json(); }
const cookies = new Map();
async function post(runtime, path, body) {
  const r = await runtime.mf.dispatchFetch('http://localhost:3000' + path, { method: 'POST', headers: { Origin: 'http://localhost:3000', 'x-wezel-request': 'cms', 'Content-Type': 'application/json', Cookie: [...cookies].map(([k, v]) => k + '=' + v).join('; ') }, body: JSON.stringify(body) });
  for (const value of r.headers.getSetCookie()) { const raw = value.split(';')[0], i = raw.indexOf('='); if (/max-age=0/i.test(value)) cookies.delete(raw.slice(0, i)); else cookies.set(raw.slice(0, i), raw.slice(i + 1)); }
  const data = await r.json(); assert.equal(r.status, 200, path + ': ' + (data.error || r.status)); return data;
}
function otp(secret) {
  let bits = ''; const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  for (const c of secret.replace(/=+$/, '')) bits += alphabet.indexOf(c).toString(2).padStart(5, '0');
  const bytes = []; for (let i = 0; i + 8 <= bits.length; i += 8) bytes.push(parseInt(bits.slice(i, i + 8), 2));
  const count = Buffer.alloc(8); count.writeBigUInt64BE(BigInt(Math.floor(Date.now() / 30000)));
  const hash = createHmac('sha1', Buffer.from(bytes)).update(count).digest(), offset = hash.at(-1) & 15;
  return String((hash.readUInt32BE(offset) & 0x7fffffff) % 1000000).padStart(6, '0');
}
try {
  await check('Default setup imports original school design and published texts while creating no copied authentication accounts', async () => {
    const data = await json(runtime, '/api/content');
    assert.equal(data.settings.schoolName, snapshot.settings.schoolName);
    assert.equal(data.settings.design.brand.name, snapshot.settings.design.brand.name);
    assert.equal(data.settings.design.brand.logoMode, 'wordmark');
    assert.equal(data.items.length, snapshot.items.filter(x => x.status === 'published' && x.rights === 1).length);
    assert(data.items.every(x => x.status === 'published' && x.rights === 1 && !x.id.startsWith('local-')));
    const users = (await runtime.db.prepare('SELECT * FROM users').all()).results; assert.equal(users.length, 1); assert.equal(users[0].email, OWNER.email);
    assert.equal((await runtime.db.prepare('SELECT COUNT(*) AS n FROM auth_users').first()).n, 0);
    assert.equal((await runtime.db.prepare("SELECT value FROM settings WHERE key='local-test-marker'").first()).value, SCHOOL_MARKER);
  });
  await check('Both original approved school logos retain their exact PNG bytes and render anonymously', async () => {
    for (const id of ORIGINAL_LOGOS) {
      const source = await readFile('exports/published/media/' + id + '.png');
      const response = await runtime.mf.dispatchFetch('http://localhost:3000/api/files/' + id);
      assert.equal(response.status, 200); assert.equal(response.headers.get('Content-Type'), 'image/png');
      assert.equal(createHash('sha256').update(Buffer.from(await response.arrayBuffer())).digest('hex'), createHash('sha256').update(source).digest('hex'));
    }
  });
  await check('Homepage and login use actual school branding, original headline and a real school photo', async () => {
    const home = await runtime.mf.dispatchFetch('http://localhost:3000/'), html = await home.text(); assert.equal(home.status, 200);
    assert(html.includes('DEINE ZUKUNFT.') && html.includes('UNSERE SCHULE.'));
    assert(html.includes('/school/nschu01.jpg') && html.includes('/api/files/' + ORIGINAL_LOGOS[1]));
    assert(!html.includes('LOKAL TESTEN.') && !html.includes('LOKALER TEST'));
    const login = await runtime.mf.dispatchFetch('http://localhost:3000/login'), loginHTML = await login.text(); assert.equal(login.status, 200);
    assert(loginHTML.includes('/api/files/' + ORIGINAL_LOGOS[0])); assert(loginHTML.includes('Redaktionszugang auf diesem Rechner einrichten'));
    const file = await runtime.mf.dispatchFetch('http://localhost:3000/school/nschu01.jpg'); assert.equal(file.status, 200); assert((await file.arrayBuffer()).byteLength > 50000);
  });
  await check('Every original published text page renders and every rendered local media reference resolves', async () => {
    for (const entry of snapshot.items.filter(e => e.kind === 'page' && e.status === 'published' && e.rights === 1)) {
      const response = await runtime.mf.dispatchFetch('http://localhost:3000/' + entry.slug), html = await response.text(); assert.equal(response.status, 200, entry.slug);
      assert(!html.includes('Ein kurzer Zwischenstopp.'), entry.slug);
      for (const path of [...new Set([...html.matchAll(/src="(\/api\/files\/[^"?#]+)(?:[?#][^"]*)?"/g)].map(x => x[1]))]) assert.equal((await runtime.mf.dispatchFetch('http://localhost:3000' + path)).status, 200, path);
    }
    const report = JSON.parse(await readFile(join(state, 'school-preview-report.json'), 'utf8')); assert(report.omittedMedia.length > 0); assert.equal(report.privateAccountsImported, false);
  });
  await check('A real local password and TOTP are enrolled on the previous synthetic profile before upgrade', async () => {
    legacy = await createLocalRuntime({ stateDirectory: legacyState, fixtureMode: 'synthetic' });
    const token = randomBytes(32).toString('hex'), t = Date.now(), password = randomBytes(30).toString('base64url');
    await legacy.db.prepare('INSERT INTO auth_invitations(id,user_id,token_hash,created_by,created_at,expires_at) VALUES (?,?,?,?,?,?)').bind('upgrade-invite', OWNER.id, createHash('sha256').update(token).digest('hex'), OWNER.id, t, t + 86400000).run();
    await post(legacy, '/api/security/accept-invitation', { token, password });
    await post(legacy, '/api/auth/sign-in/email', { email: OWNER.email, password });
    const setup = await post(legacy, '/api/auth/two-factor/enable', { password });
    await post(legacy, '/api/auth/two-factor/verify-totp', { code: otp(new URL(setup.totpURI).searchParams.get('secret')), trustDevice: false });
    await legacy.db.prepare("INSERT INTO entries(id,kind,slug,title,body,category,status,rights,author_id,version,created_at,updated_at) VALUES ('own-local-draft','page','mein-entwurf','Eigener Entwurf','Beibehalten','Schule','draft',1,?,2,?,?)").bind(OWNER.id, new Date().toISOString(), new Date().toISOString()).run();
  });
  await check('Automatic school restoration preserves local password, MFA, session and own draft, and backs up previous settings', async () => {
    const before = await legacy.db.prepare('SELECT password FROM auth_accounts').first();
    const factor = await legacy.db.prepare('SELECT secret FROM auth_two_factors').first();
    await legacy.dispose(); legacy = await createLocalRuntime({ stateDirectory: legacyState });
    assert(legacy.schoolReport?.backupFile); await access(join(legacyState, legacy.schoolReport.backupFile));
    assert.equal((await legacy.db.prepare('SELECT password FROM auth_accounts').first()).password, before.password);
    assert.equal((await legacy.db.prepare('SELECT secret FROM auth_two_factors').first()).secret, factor.secret);
    const status = await legacy.mf.dispatchFetch('http://localhost:3000/api/security/status', { headers: { Cookie: [...cookies].map(([k, v]) => k + '=' + v).join('; ') } });
    assert.equal((await status.json()).user.mfa, true);
    assert.equal((await legacy.db.prepare("SELECT body FROM entries WHERE id='own-local-draft'").first()).body, 'Beibehalten');
    assert.equal((await legacy.db.prepare("SELECT status FROM entries WHERE id='local-page'").first()).status, 'archived');
    const publicData = await json(legacy, '/api/content'); assert(!publicData.items.some(x => x.id.startsWith('local-')));
    assert.equal(publicData.settings.design.brand.logo, snapshot.settings.design.brand.logo);
    assert(!(await readFile(join(legacyState, legacy.schoolReport.backupFile), 'utf8')).includes(before.password));
  });
  await check('A restart keeps the restored real branding and original R2 logos without a second import', async () => {
    await runtime.dispose(); runtime = await createLocalRuntime({ stateDirectory: state });
    assert.equal(runtime.schoolReport, null); const settings = (await json(runtime, '/api/content')).settings;
    assert.equal(settings.design.brand.logo, snapshot.settings.design.brand.logo);
    assert.equal((await runtime.db.prepare('SELECT COUNT(*) AS n FROM users').first()).n, 1);
    assert.equal((await runtime.mf.dispatchFetch('http://localhost:3000/api/files/' + ORIGINAL_LOGOS[0])).status, 200);
  });
} catch (error) {
  results.push({ function: 'School preview verification', result: 'failed', error: error.message }); console.error(error.stack); process.exitCode = 1;
} finally {
  await runtime.dispose(); if (legacy) await legacy.dispose();
  await rm(state, { recursive: true, force: true }); await rm(legacyState, { recursive: true, force: true });
  await mkdir('tests/.generated/phase6', { recursive: true });
  await writeFile('tests/.generated/phase6/school-preview.json', JSON.stringify({ timestamp: new Date().toISOString(), platform: process.platform, node: process.version, scope: 'actual school appearance; approved original PNG logos; published public snapshot; no copied accounts', passed: results.filter(r => r.result === 'passed').length, results }, null, 2) + '\n');
}
