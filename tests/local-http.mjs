import { spawn, spawnSync } from 'node:child_process';
import { mkdtemp, mkdir, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import assert from 'node:assert/strict';
const state = await mkdtemp(join(tmpdir(), 'wezel-http-'));
const windows = process.platform === 'win32';
let child, output = '', stopped = false;
const results = [];
try {
  // The Windows check invokes the actual double-click launcher, including build
  // and setup, rather than merely testing an equivalent shell command.
  child = spawn(windows ? process.env.ComSpec || 'cmd.exe' : process.execPath,
    windows ? ['/d', '/s', '/c', 'START-WEZEL-TEST.cmd'] : ['scripts/local-test.mjs', 'start'],
    { cwd: process.cwd(), env: { ...process.env, CI: 'true', WEZEL_LOCAL_TEST_DIRECTORY: state }, stdio: ['ignore', 'pipe', 'pipe'] });
  child.stdout.on('data', b => { output += b; }); child.stderr.on('data', b => { output += b; }); child.once('exit', () => { stopped = true; });
  const deadline = Date.now() + 240000;
  while (!output.includes('Local test ready:') && !stopped && Date.now() < deadline) await new Promise(r => setTimeout(r, 100));
  assert(!stopped && output.includes('Local test ready:'), 'Launcher did not reach ready state. ' + output.slice(-1500));
  const get = (path, options = {}) => fetch('http://localhost:3000' + path, { redirect: 'manual', ...options });
  for (const path of ['/', '/login', '/termine', '/lokale-testseite', '/__local']) {
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
  const content = await (await get('/api/content')).json(); assert(content.items.every(x => x.id.startsWith('local-')));
  results.push({ function: 'Fresh HTTP environment contains only synthetic fixture content', result: 'passed' });
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
  await writeFile('tests/.generated/phase6/local-http.json', JSON.stringify({ timestamp: new Date().toISOString(), platform: process.platform, node: process.version, launcher: windows ? 'START-WEZEL-TEST.cmd' : 'node scripts/local-test.mjs start', results }, null, 2) + '\n');
}
