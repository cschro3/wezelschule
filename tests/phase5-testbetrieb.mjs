// Cross-module acceptance through the compiled original Worker and real local
// D1/R2. All identities, passwords, media and calendar entries are synthetic.
// No browser cookies, production bindings or live network services are used.
import { createRequire } from 'node:module';
import { dirname, resolve } from 'node:path';
import { readFile, readdir, mkdir, writeFile, access } from 'node:fs/promises';
import { randomBytes, createHmac } from 'node:crypto';
import assert from 'node:assert/strict';
const require = createRequire(import.meta.url);
const { Miniflare } = require(require.resolve('miniflare', { paths: [dirname(require.resolve('wrangler'))] }));
const moduleNames = ['index.js', ...(await readdir('dist/server', { recursive: true })).filter(p => p !== 'index.js' && /\.(?:m?js|wasm)$/.test(p))];
const password = randomBytes(30).toString('base64url');
let egress = 0;
const mf = new Miniflare({
  modules: moduleNames.map(p => ({ type: p.endsWith('.wasm') ? 'CompiledWasm' : 'ESModule', path: resolve('dist/server', p) })),
  modulesRoot: resolve('dist/server'), compatibilityDate: '2026-05-15', compatibilityFlags: ['nodejs_compat'],
  d1Databases: { DB: 'wezel-phase5-acceptance' }, r2Buckets: { BUCKET: 'wezel-phase5-acceptance' },
  bindings: { AUTH_BASE_URL: 'https://wezel.test', AUTH_MODE: 'migration', BETTER_AUTH_SECRET: randomBytes(40).toString('hex'), OWNER_EMAIL: 'system@wezel.invalid' },
  outboundService: () => { egress++; return new Response('External access disabled in isolated acceptance tests', { status: 502 }); }
});
const db = await mf.getD1Database('DB'), cookies = new Map(), results = [];
let counter = 0;
async function request(path, { method = 'GET', body, authenticated = true, platform = false } = {}) {
  const headers = { Origin: 'https://wezel.test', 'x-wezel-request': 'cms', 'cf-connecting-ip': '192.0.2.' + (++counter % 200 + 1) };
  if (authenticated) headers.Cookie = [...cookies].map(([k, v]) => k + '=' + v).join('; ');
  if (platform) Object.assign(headers, { 'oai-authenticated-user-id': 'qa-system', 'oai-authenticated-user-email': 'system@wezel.invalid' });
  if (body !== undefined && !(body instanceof FormData)) headers['Content-Type'] = 'application/json';
  // Serialize multipart with its actual boundary before crossing the Node /
  // workerd transport boundary, exactly as an HTTP browser request would.
  const outgoing = new Request('https://wezel.test' + path, { method, headers, body: body instanceof FormData ? body : body === undefined ? undefined : JSON.stringify(body) });
  const r = await mf.dispatchFetch(outgoing.url, { method, headers: Object.fromEntries(outgoing.headers), body: body === undefined ? undefined : new Uint8Array(await outgoing.arrayBuffer()), redirect: 'manual' });
  if (authenticated) for (const c of r.headers.getSetCookie()) { const raw = c.split(';')[0], i = raw.indexOf('='); if (/max-age=0/i.test(c)) cookies.delete(raw.slice(0, i)); else cookies.set(raw.slice(0, i), raw.slice(i + 1)); }
  return r;
}
async function json(path, options) {
  const r = await request(path, options), data = await r.json();
  assert.equal(r.status, 200, path + ' status=' + r.status + (r.status === 200 ? '' : ' ' + String(data.error ?? '').slice(0, 300)));
  return data;
}
const post = (path, body, options = {}) => json(path, { ...options, method: 'POST', body });
async function check(name, action) {
  const started = Date.now();
  await action();
  results.push({ function: name, result: 'passed', error: null, priority: null, correction: null, milliseconds: Date.now() - started });
  console.log('PASS ' + name);
}
function otp(secret) {
  let bits = ''; const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  for (const c of secret.replace(/=+$/, '')) bits += alphabet.indexOf(c).toString(2).padStart(5, '0');
  const bytes = []; for (let i = 0; i + 8 <= bits.length; i += 8) bytes.push(parseInt(bits.slice(i, i + 8), 2));
  const time = Buffer.alloc(8); time.writeBigUInt64BE(BigInt(Math.floor(Date.now() / 30000)));
  const hash = createHmac('sha1', Buffer.from(bytes)).update(time).digest(), offset = hash.at(-1) & 15;
  return String((hash.readUInt32BE(offset) & 0x7fffffff) % 1000000).padStart(6, '0');
}
async function publish(id, input) {
  for (const status of ['review', 'approved', 'published']) {
    const old = (await json('/api/admin/overview')).entries.find(e => e.id === id);
    await json('/api/admin/entries/' + id, { method: 'PATCH', body: { ...input, blocks: typeof input.blocks === 'string' ? JSON.parse(input.blocks) : input.blocks, status, version: old.version } });
  }
}
let design, mediaId, documentId;
async function designAction(action) {
  design = await post('/api/admin/design', { action, version: design.version, baseVersion: design.publishedVersion });
}
try {
  for (const file of (await readdir('drizzle')).filter(p => p.endsWith('.sql')).sort()) for (const sql of (await readFile('drizzle/' + file, 'utf8')).split('--> statement-breakpoint')) if (sql.trim()) await db.prepare(sql).run();
  await db.exec(await readFile('tests/local-fixtures.sql', 'utf8'));
  await check('Local administrator enrollment, password login and TOTP preserve existing CMS identity', async () => {
    await post('/api/security/bootstrap', { password }, { platform: true });
    await post('/api/auth/sign-in/email', { email: 'system@wezel.invalid', password });
    const setup = await post('/api/auth/two-factor/enable', { password });
    assert.equal(setup.backupCodes.length, 10);
    const secret = new URL(setup.totpURI).searchParams.get('secret');
    await post('/api/auth/two-factor/verify-totp', { code: otp(secret), trustDevice: false });
    const status = await json('/api/security/status');
    assert.equal((await db.prepare('SELECT id FROM auth_users').first()).id, 'qa-system');
    assert.equal(status.user.role, 'SYSTEM_ADMIN'); assert.equal(status.user.mfa, true);
  });
  await check('All protected administration pages render through an actual MFA-authenticated session', async () => {
    for (const path of ['/admin', '/admin/design', '/admin/calendar', '/admin/calendar/import', '/account/security']) {
      const r = await request(path), html = await r.text();
      assert.equal(r.status, 200, path); assert(!html.includes('Ein kurzer Zwischenstopp.'), path);
    }
  });
  await check('User management, media, settings, audit and calendar overview APIs accept the same real session', async () => {
    const overview = await json('/api/admin/overview');
    for (const key of ['entries', 'users', 'media', 'settings', 'audit']) assert(overview[key], key);
    await json('/api/security/users-overview'); await json('/api/calendar-admin/overview');
  });
  await check('An original synthetic SVG is securely uploaded and remains private until referenced', async () => {
    const form = new FormData();
    form.set('file', new File(['<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 100"><rect width="240" height="100" fill="#101D35"/><path d="M20 70 L100 20 L180 70" fill="none" stroke="#C7F36B" stroke-width="8"/></svg>'], 'phase5-eigenes-testlogo.svg', { type: 'image/svg+xml' }));
    form.set('alt', 'Eigenes synthetisches Logo für isolierten Test'); form.set('rights', 'Im isolierten Test selbst erstellt'); form.set('approved', '1');
    mediaId = (await post('/api/admin/media', form)).id;
    assert.equal((await request('/api/files/' + mediaId, { authenticated: false })).status, 404);
  });
  await check('Logo, header, navigation, homepage, theme and footer persist as a private design draft', async () => {
    design = await json('/api/admin/design');
    const config = structuredClone(design.config);
    config.brand.logo = '/api/files/' + mediaId; config.brand.darkLogo = config.brand.logo; config.brand.mobileLogo = config.brand.logo;
    config.brand.logoMode = 'wordmark'; config.brand.mobileLogoWidth = 190;
    config.header.sticky = false; config.footer.text = 'Isolierte Phase-5-Footerprüfung';
    config.blocks[0].title = 'ISOLIERTE PHASE-5-STARTSEITE';
    config.navigation = config.navigation.toReversed();
    config.theme.secondary = '#3666F5';
    design = await json('/api/admin/design', { method: 'PATCH', body: { config, version: design.version, baseVersion: design.publishedVersion } });
    const fresh = await json('/api/admin/design'); assert.equal(fresh.config.brand.mobileLogoWidth, 190); assert.equal(fresh.config.footer.text, config.footer.text);
    const publicState = await json('/api/content', { authenticated: false }); assert(!JSON.stringify(publicState).includes('ISOLIERTE PHASE-5-STARTSEITE'));
  });
  await check('Draft design preview is authenticated and publication changes only isolated public content', async () => {
    const preview = await request('/admin/preview?design=1'); assert((await preview.text()).includes('ISOLIERTE PHASE-5-STARTSEITE'));
    const anonymous = await request('/admin/preview?design=1', { authenticated: false }); assert(anonymous.status >= 300 && anonymous.status < 400);
    for (const action of ['review', 'approve', 'publish']) await designAction(action);
    const publicState = await json('/api/content', { authenticated: false }); assert.equal(publicState.settings.design.brand.mobileLogoWidth, 190);
    assert.equal((await request('/api/files/' + mediaId, { authenticated: false })).status, 200);
  });
  await check('A self-created valid PDF uploads without active content and remains private before document release', async () => {
    const objects = ['<< /Type /Catalog /Pages 2 0 R >>', '<< /Type /Pages /Kids [3 0 R] /Count 1 >>', '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 200 200] /Contents 4 0 R >>', '<< /Length 0 >>\nstream\n\nendstream'];
    let pdf = '%PDF-1.4\n'; const offsets = [0];
    for (const [i, object] of objects.entries()) { offsets.push(Buffer.byteLength(pdf)); pdf += `${i + 1} 0 obj\n${object}\nendobj\n`; }
    const xref = Buffer.byteLength(pdf); pdf += 'xref\n0 5\n0000000000 65535 f \n' + offsets.slice(1).map(n => String(n).padStart(10, '0') + ' 00000 n \n').join('') + `trailer\n<< /Size 5 /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`;
    const form = new FormData(); form.set('file', new File([pdf], 'phase5-eigenes-testdokument.pdf', { type: 'application/pdf' })); form.set('alt', 'Selbst erstelltes leeres Testdokument'); form.set('rights', 'Im isolierten Test selbst erstellt'); form.set('approved', '1');
    documentId = (await post('/api/admin/media', form)).id;
    assert.equal((await request('/api/files/' + documentId, { authenticated: false })).status, 404);
  });
  for (const kind of ['page', 'news', 'project', 'document', 'event']) await check(kind + ': create, reload, review, approve and publish through MFA-authenticated CMS', async () => {
    const input = { kind, slug: 'phase5-' + kind, title: 'Isolierte Phase-5-Prüfung ' + kind, excerpt: 'Nur Testdaten', body: 'Kein echter Schulinhalt', category: 'Phase 5', status: 'draft', rights: 1, blocks: [], ...(kind === 'document' ? { source: '/api/files/' + documentId } : {}), ...(kind === 'event' ? { startsAt: '2026-11-03T17:00:00.000Z', endsAt: '2026-11-03T18:00:00.000Z', location: 'Testort', allDay: 0, timeZone: 'Europe/Berlin', audience: 'Testgruppe', visibility: 'public', rrule: null } : {}) };
    const { id } = await post('/api/admin/entries', input);
    assert((await json('/api/admin/overview')).entries.some(e => e.id === id));
    assert(!(await json('/api/content', { authenticated: false })).items.some(e => e.id === id));
    await publish(id, input);
    assert((await json('/api/content', { authenticated: false })).items.some(e => e.id === id));
    if (kind === 'document') {
      const file = await request('/api/files/' + documentId, { authenticated: false }); assert.equal(file.status, 200); assert.match(file.headers.get('Content-Disposition'), /^attachment/); assert((await file.text()).startsWith('%PDF-1.4'));
    }
    if (kind !== 'document') {
      const path = (kind === 'news' ? '/aktuelles/' : kind === 'project' ? '/projekte/' : kind === 'event' ? '/termine/' : '/') + input.slug;
      const response = await request(path, { authenticated: false }); assert.equal(response.status, 200); assert((await response.text()).includes(input.title));
    }
  });
  await check('CSV import, mapping and confirmation work with local password plus TOTP rather than platform headers', async () => {
    const form = new FormData(); form.set('privacyReviewed', 'true'); form.set('file', new File(['Veranstaltung;Tag;Von;Bis\nIsolierter kombinierter Import;2026-11-05;16:00;17:00'], 'phase5.csv'));
    const job = await post('/api/calendar-admin/upload', form);
    const preview = await post('/api/calendar-admin/preview/' + job.id, { sheet: 0, mapping: { title: 0, date: 1, startTime: 2, endTime: 3 } });
    assert.equal(preview.summary.invalid, 0);
    const report = await post('/api/calendar-admin/complete/' + job.id, { sheet: 0, version: job.version, confirm: true, rightsReviewed: true, choices: preview.rows.map(r => ({ row: r.row, event: r.event, action: 'create', status: 'review' })) });
    assert.equal(report.created, 1);
    const entry = (await json('/api/admin/overview')).entries.find(e => e.id === report.entries[0].id);
    assert.equal(entry.status, 'review'); assert(!(await json('/api/content', { authenticated: false })).items.some(e => e.id === entry.id));
    // Import privacy review is deliberately separate from the explicit
    // editorial rights confirmation required before public release.
    assert.equal(entry.rights, 0);
    await publish(entry.id, { ...entry, rights: 1 });
    assert((await (await request('/api/calendar', { authenticated: false })).text()).includes('Isolierter kombinierter Import'));
  });
  await check('Referenced media deletion is denied and history remains available', async () => {
    assert.equal((await request('/api/admin/media/' + mediaId, { method: 'DELETE' })).status, 409);
    assert((await json('/api/admin/design')).history.length >= 2);
  });
  await check('All original public static image and font references in rendered pages exist in the build', async () => {
    const r = await request('/schulgebaeude', { authenticated: false }), html = await r.text();
    assert.equal(r.status, 200);
    const paths = [...new Set([...html.matchAll(/(?:src|href)="(\/[^"?#]+\.(?:jpg|png|webp|svg|woff2?))(?:[?#][^"]*)?"/g)].map(x => x[1]))];
    for (const path of paths) await access(resolve('dist/client', '.' + path));
    assert(paths.some(p => p === '/school/nschu01.jpg'));
    assert.equal(egress, 0);
  });
  await check('Every published page and rendered internal navigation link resolves while draft-only pages remain private', async () => {
    const all = (await json('/api/admin/overview')).entries;
    const publicPages = (await json('/api/content', { authenticated: false })).items.filter(e => e.kind === 'page');
    const pending = new Set(['/', '/aktuelles', '/projekte', '/termine', '/downloads', '/kontakt', '/service', '/schulgebaeude', '/vertretungsplan', '/impressum', '/datenschutz', '/barrierefreiheit', ...publicPages.map(e => '/' + e.slug)]);
    const visited = new Set();
    while (pending.size) {
      const path = pending.values().next().value; pending.delete(path); if (visited.has(path)) continue;
      visited.add(path); assert(visited.size < 100, 'Unexpected navigation expansion');
      const r = await request(path, { authenticated: false }), html = await r.text();
      assert.equal(r.status, 200, path); assert(!html.includes('Ein kurzer Zwischenstopp.'), path);
      for (const [, href] of html.matchAll(/href="(\/[^"#?]*)"/g)) {
        if (!href.startsWith('//') && !/^\/(?:api|admin|account|login|signin-with-chatgpt|signout-with-chatgpt|_)/.test(href) && !/\.[a-z\d]+$/i.test(href) && !visited.has(href)) pending.add(href);
      }
    }
    for (const e of all.filter(e => e.kind === 'page' && e.status === 'draft')) {
      const r = await request('/' + e.slug, { authenticated: false }); assert.equal(r.status, 404, e.slug);
    }
    results.push({ function: 'Public navigation crawl evidence', result: 'passed', routes: [...visited].sort(), draftPagesRejected: all.filter(e => e.kind === 'page' && e.status === 'draft').length, error: null, priority: null, correction: null });
  });
  await check('Logout removes access to every protected module and leaves published test content available', async () => {
    await post('/api/auth/sign-out', {});
    for (const path of ['/api/admin/overview', '/api/admin/design', '/api/calendar-admin/overview', '/api/security/users-overview']) assert.equal((await request(path)).status, 401, path);
    assert.equal((await request('/api/content', { authenticated: false })).status, 200);
  });
} catch (error) {
  results.push({ function: 'Acceptance stopped at first failing assertion', result: 'failed', error: String(error.message).slice(0, 500), priority: 'high', correction: 'Investigate the actual failed assertion; no live data was changed.' });
  process.exitCode = 1; console.error(error.stack);
} finally {
  await mkdir('tests/.generated/phase5', { recursive: true });
  await writeFile('tests/.generated/phase5/combined-report.json', JSON.stringify({ timestamp: new Date().toISOString(), baselineVersion9: 'cae689e03b31b1c866243b4d1e3c590ff0526135', scope: 'compiled Worker; in-memory D1/R2; synthetic identities; local password and TOTP; no production services; not browser E2E', productionConnected: false, externalRequests: egress, passed: results.filter(r => r.result === 'passed').length, results }, null, 2) + '\n');
  await mf.dispose();
}
