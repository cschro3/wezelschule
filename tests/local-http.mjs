import { spawn, spawnSync } from 'node:child_process';
import { mkdtemp, mkdir, writeFile, rm, access } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import assert from 'node:assert/strict';
import { randomBytes, createHmac } from 'node:crypto';
const state = await mkdtemp(join(tmpdir(), 'wezel-http-'));
const windows = process.platform === 'win32';
const coldInstall = process.env.WEZEL_EXPECT_COLD_INSTALL === '1';
let child, output = '', stopped = false;
const results = [];
try {
  if (coldInstall) {
    assert(windows, 'The cold-install launcher check requires Windows.');
    await assert.rejects(access(join(process.cwd(), 'node_modules')), { code: 'ENOENT' });
  }
  // The Windows check invokes the actual double-click launcher, including build
  // and setup, rather than merely testing an equivalent shell command.
  child = spawn(windows ? process.env.ComSpec || 'cmd.exe' : process.execPath,
    windows ? ['/d', '/s', '/c', 'START-WEZEL-TEST.cmd'] : ['scripts/local-test.mjs', 'start'],
    { cwd: process.cwd(), env: { ...process.env, CI: 'true', WEZEL_LOCAL_TEST_DIRECTORY: state }, stdio: ['ignore', 'pipe', 'pipe'] });
  child.stdout.on('data', b => { output += b; }); child.stderr.on('data', b => { output += b; }); child.once('exit', () => { stopped = true; });
  const deadline = Date.now() + (coldInstall ? 600000 : 240000);
  while (!output.includes('Local test ready:') && !stopped && Date.now() < deadline) await new Promise(r => setTimeout(r, 100));
  assert(!stopped && output.includes('Local test ready:'), 'Launcher did not reach ready state. ' + output.slice(-1500));
  if (coldInstall) results.push({ function: 'Windows launcher installs dependencies from an empty node_modules state and reaches the real HTTP server', result: 'passed' });
  const get = (path, options = {}) => fetch('http://localhost:3000' + path, { redirect: 'manual', ...options });
  for (const path of ['/', '/login', '/termine', '/unsere-schule', '/__local']) {
    const r = await get(path); assert.equal(r.status, 200, path); assert((await r.text()).length > 100);
  }
  results.push({ function: 'Actual HTTP server and Windows launcher (when on Windows) serve public pages, login and setup', result: 'passed' });
  const admin = await get('/admin'); assert(admin.status >= 300 && admin.status < 400); assert(admin.headers.get('location').startsWith('/login'));
  assert.equal((await get('/api/admin/overview', { headers: { 'oai-authenticated-user-id': 'local-owner', 'oai-authenticated-user-email': 'admin@wezel.invalid' } })).status, 401);
  results.push({ function: 'HTTP server rejects anonymous access and forged platform headers', result: 'passed' });
  assert.equal((await get('/__local/operator', { method: 'POST', headers: { Origin: 'https://other.invalid' } })).status, 403);
  const operator = await get('/__local/operator', { method: 'POST', headers: { Origin: 'http://localhost:3000' } }); assert.equal(operator.status, 303);
  const cookie = operator.headers.get('set-cookie').split(';')[0];
  const setup = await (await get('/__local', { headers: { Cookie: cookie } })).text(); assert(setup.includes('/login?mode=invite#token='));
  assert(!(await (await get('/__local')).text()).includes('#token='));
  results.push({ function: 'Local operator consent is same-origin; initial invitation is hidden until consent', result: 'passed' });
  const content = await (await get('/api/content')).json(); assert(content.items.some(x => x.id === 'source-unsere-schule')); assert(content.items.every(x => x.status === 'published' && x.rights === 1)); assert(content.settings.design.brand.name.includes('Johann Karl Wezel')); assert(!content.items.some(x => x.id.startsWith('local-')));
  results.push({ function: 'Fresh HTTP environment shows the original published school content with separate local accounts', result: 'passed' });
  const password = randomBytes(30).toString('base64url'), authCookies = new Map();
  async function post(path, body) {
    const form = body instanceof FormData;
    const r = await get(path, { method: 'POST', headers: { Origin: 'http://localhost:3000', 'x-wezel-request': 'cms', Cookie: [...authCookies].map(([k, v]) => k + '=' + v).join('; '), ...(form ? {} : { 'Content-Type': 'application/json' }) }, body: form ? body : JSON.stringify(body) });
    for (const value of r.headers.getSetCookie()) { const raw = value.split(';')[0], i = raw.indexOf('='); if (/max-age=0/i.test(value)) authCookies.delete(raw.slice(0, i)); else authCookies.set(raw.slice(0, i), raw.slice(i + 1)); }
    assert.equal(r.status, 200, path + ': ' + r.status); return r.json();
  }
  const authGet = path => get(path, { headers: { Cookie: [...authCookies].map(([k, v]) => k + '=' + v).join('; ') } });
  const token = /mode=invite#token=([a-f0-9]{64})/.exec(setup)[1];
  await post('/api/security/accept-invitation', { token, password });
  await post('/api/auth/sign-in/email', { email: 'admin@wezel.invalid', password });
  assert.equal((await authGet('/api/admin/overview')).status, 401);
  const mfa = await post('/api/auth/two-factor/enable', { password }); assert.equal(mfa.backupCodes.length, 10);
  const secret = new URL(mfa.totpURI).searchParams.get('secret'), alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  let bits = ''; for (const c of secret.replace(/=+$/, '')) bits += alphabet.indexOf(c).toString(2).padStart(5, '0');
  const bytes = []; for (let i = 0; i + 8 <= bits.length; i += 8) bytes.push(parseInt(bits.slice(i, i + 8), 2));
  const time = Buffer.alloc(8); time.writeBigUInt64BE(BigInt(Math.floor(Date.now() / 30000)));
  const hash = createHmac('sha1', Buffer.from(bytes)).update(time).digest(), offset = hash.at(-1) & 15;
  await post('/api/auth/two-factor/verify-totp', { code: String((hash.readUInt32BE(offset) & 0x7fffffff) % 1000000).padStart(6, '0'), trustDevice: false });
  for (const path of ['/admin', '/admin/design', '/admin/calendar/import']) assert.equal((await authGet(path)).status, 200, path);
  assert(!(await (await get('/__local', { headers: { Cookie: cookie } })).text()).includes('#token='));
  results.push({ function: 'Real HTTP setup link, password login, mandatory TOTP and authenticated CMS pages work together', result: 'passed' });
  const form = new FormData(); form.set('privacyReviewed', 'true'); form.set('file', new File(['Titel;Datum\nSynthetischer HTTP-Import;2026-11-21'], 'http-test.csv'));
  const job = await post('/api/calendar-admin/upload', form);
  const preview = await post('/api/calendar-admin/preview/' + job.id, { sheet: 0, mapping: { title: 0, date: 1 } }); assert.equal(preview.summary.invalid, 0);
  await post('/api/auth/sign-out', {}); assert.equal((await authGet('/api/admin/overview')).status, 401);
  results.push({ function: 'Real HTTP multipart calendar upload, preview and logout preserve boundaries', result: 'passed' });
  console.log(results.length + ' local HTTP/launcher checks passed on ' + process.platform + '.');
} catch (error) {
  results.push({ function: 'Local HTTP/launcher check', result: 'failed', error: error.message }); console.error(error.stack); process.exitCode = 1;
} finally {
  if (child && !stopped) {
    if (windows) spawnSync('taskkill', ['/pid', String(child.pid), '/t', '/f'], { stdio: 'ignore' }); else child.kill('SIGTERM');
    for (let i = 0; i < 50 && !stopped; i++) await new Promise(r => setTimeout(r, 100));
  }
  await rm(state, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 });
  await mkdir('tests/.generated/phase6', { recursive: true });
  await writeFile('tests/.generated/phase6/local-http.json', JSON.stringify({ timestamp: new Date().toISOString(), platform: process.platform, node: process.version, launcher: windows ? 'START-WEZEL-TEST.cmd' : 'node scripts/local-test.mjs start', coldInstall, results }, null, 2) + '\n');
}
