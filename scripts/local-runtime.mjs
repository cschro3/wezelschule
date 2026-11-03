// Local-only runtime. Never reads wrangler.toml, .dev.vars, .env or Sites IDs.
import { createRequire } from 'node:module';
import { dirname, resolve } from 'node:path';
import { readFile, readdir, mkdir, writeFile } from 'node:fs/promises';
import { randomBytes, createHash } from 'node:crypto';
import { pathToFileURL } from 'node:url';
const require = createRequire(import.meta.url);
export const OWNER = { id: 'local-owner', email: 'admin@wezel.invalid', name: 'Lokale Testadministration' };
export const sha256 = value => createHash('sha256').update(value).digest('hex');

export async function createLocalRuntime({ stateDirectory = resolve('.local-test'), origin = 'http://localhost:3000', persist = true } = {}) {
  const url = new URL(origin);
  if (!['localhost', '127.0.0.1', '[::1]'].includes(url.hostname) || url.username || url.password) throw new Error('Only loopback origins are supported.');
  const state = resolve(stateDirectory);
  await mkdir(state, { recursive: true });
  let config;
  try { config = JSON.parse(await readFile(resolve(state, 'local-config.json'), 'utf8')); }
  catch (e) {
    if (e.code !== 'ENOENT') throw e;
    config = { format: 1, purpose: 'synthetic-local-test-only', secret: randomBytes(48).toString('hex') };
    await writeFile(resolve(state, 'local-config.json'), JSON.stringify(config), { mode: 0o600, flag: 'wx' });
  }
  if (config.purpose !== 'synthetic-local-test-only' || config.format !== 1 || config.secret?.length !== 96) throw new Error('Invalid local state; refusing to use it.');
  const { Miniflare } = require(require.resolve('miniflare', { paths: [dirname(require.resolve('wrangler'))] }));
  const files = ['index.js', ...(await readdir('dist/server', { recursive: true })).filter(p => p !== 'index.js' && /\.(?:m?js|wasm)$/.test(p))];
  const mailbox = [], blocked = [];
  const mf = new Miniflare({
    modules: files.map(p => ({ type: p.endsWith('.wasm') ? 'CompiledWasm' : 'ESModule', path: resolve('dist/server', p) })),
    modulesRoot: resolve('dist/server'), compatibilityDate: '2026-05-15', compatibilityFlags: ['nodejs_compat'],
    d1Databases: { DB: 'wezel-synthetic-local-d1' }, r2Buckets: { BUCKET: 'wezel-synthetic-local-r2' },
    d1Persist: persist ? resolve(state, 'd1') : false, r2Persist: persist ? resolve(state, 'r2') : false,
    assets: { directory: resolve('dist/client'), binding: 'ASSETS', routerConfig: { has_user_worker: true } },
    bindings: { AUTH_BASE_URL: origin, AUTH_MODE: 'local', BETTER_AUTH_SECRET: config.secret,
      // This string is an inert local marker, not a Resend key. Every fetch is intercepted below.
      RESEND_API_KEY: 'local-mail-sink-no-network', AUTH_EMAIL_FROM: 'WEZEL Test <noreply@wezel.invalid>' },
    outboundService: async request => {
      const target = new URL(request.url);
      if (target.origin === 'https://api.resend.com' && target.pathname === '/emails' && request.method === 'POST') {
        const message = await request.json();
        if (!Array.isArray(message.to) || !message.to.every(x => typeof x === 'string' && x.endsWith('@wezel.invalid'))) return new Response('Only synthetic recipients are allowed', { status: 400 });
        mailbox.push({ ...message, capturedAt: new Date().toISOString() });
        return Response.json({ id: 'local-' + mailbox.length });
      }
      blocked.push({ host: target.hostname, method: request.method });
      return new Response('External requests are disabled in local test mode', { status: 502 });
    }
  });
  const db = await mf.getD1Database('DB');
  await db.prepare('CREATE TABLE IF NOT EXISTS local_test_migrations (name TEXT PRIMARY KEY, digest TEXT NOT NULL)').run();
  for (const name of (await readdir('drizzle')).filter(p => p.endsWith('.sql')).sort()) {
    const sql = await readFile('drizzle/' + name, 'utf8'), hash = sha256(sql);
    const previous = await db.prepare('SELECT digest FROM local_test_migrations WHERE name=?').bind(name).first();
    if (previous) { if (previous.digest !== hash) throw new Error('Applied migration changed: ' + name); continue; }
    const statements = sql.split('--> statement-breakpoint').map(s => s.trim()).filter(Boolean).map(s => db.prepare(s));
    await db.batch([...statements, db.prepare('INSERT INTO local_test_migrations(name,digest) VALUES (?,?)').bind(name, hash)]);
  }
  const seeded = await db.prepare("SELECT value FROM settings WHERE key='local-test-marker'").first();
  if (!seeded) {
    const count = await db.prepare('SELECT COUNT(*) AS n FROM users').first();
    if (count.n !== 0) throw new Error('Refusing to seed a database that already contains users.');
    await seed(db, mf, state);
  } else if (seeded.value !== 'synthetic-only-v1') throw new Error('Unexpected database marker.');
  return { mf, db, mailbox, blocked, state, origin, dispose: () => mf.dispose() };
}

async function seed(db, mf, state) {
  const { build } = require(require.resolve('esbuild', { paths: [dirname(require.resolve('vite'))] }));
  const modelPath = resolve(state, 'design-model.mjs');
  await build({ entryPoints: ['lib/design-model.ts'], outfile: modelPath, bundle: true, format: 'esm', platform: 'node', logLevel: 'silent' });
  const { defaultDesign, designSchema } = await import(pathToFileURL(modelPath).href);
  const t = new Date().toISOString();
  const settings = { schoolName: 'WEZEL NEXT – Lokaler Test', address: 'Synthetischer Testort', phone: '', email: OWNER.email,
    primary: '#101D35', accent: '#C7F36B', royal: '#3666F5', footer: 'Ausschließlich synthetische Testdaten', hero: true, profile: true, news: true, events: true,
    navigation: [{ label: 'Testseite', href: '/lokale-testseite' }, { label: 'Kalender', href: '/termine' }], logo: '/api/files/local-logo' };
  const d = defaultDesign(settings);
  d.brand.shortName = 'WEZEL TEST'; d.brand.name = settings.schoolName; d.brand.slogan = 'Isolierter lokaler Funktionstest';
  d.brand.darkLogo = '/api/files/local-logo-dark'; d.brand.mobileLogo = settings.logo; d.brand.logoMode = 'wordmark';
  d.header.sticky = false;
  d.navigation = d.navigation.map(n => ({ ...n, children: [] }));
  d.footer.links = []; d.footer.text = settings.footer; d.footer.name = settings.schoolName;
  d.blocks = [d.blocks[0], d.blocks[1], d.blocks[4], { ...d.blocks[4], id: 'local-events', type: 'events', title: 'Synthetische Termine' }];
  Object.assign(d.blocks[0], { title: 'WEZEL NEXT.\nLOKAL TESTEN.', text: 'Diese Arbeitskopie ist vom gehosteten System getrennt.', eyebrow: 'LOKALER TESTBETRIEB', image: '', buttons: [] });
  settings.design = designSchema.parse(d);
  const logo = color => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 340 110"><path d="M15 85L55 32L90 85 M30 85V95H110V85 M90 85V24Q118 15 118 35" fill="none" stroke="${color}" stroke-width="6"/><path d="M20 90L65 78L108 90" fill="none" stroke="#C7F36B" stroke-width="5"/><text x="135" y="54" font-family="sans-serif" font-size="29" font-weight="bold" fill="${color}">WEZEL</text><text x="135" y="82" font-family="sans-serif" font-size="18" fill="${color}">LOKALER TEST</text></svg>`;
  await db.batch([
    db.prepare('INSERT INTO users(id,email,name,role,active,created_at) VALUES (?,?,?,?,1,?)').bind(OWNER.id, OWNER.email, OWNER.name, 'SYSTEM_ADMIN', t),
    ...[['local-test-marker', 'synthetic-only-v1'], ['initialized', t], ['site', JSON.stringify(settings)]].map(([k, v]) => db.prepare('INSERT INTO settings(key,value,updated_at) VALUES (?,?,?)').bind(k, v, t)),
    ...['page', 'news', 'project', 'event'].map((kind, i) => db.prepare('INSERT INTO entries(id,kind,slug,title,excerpt,body,status,rights,author_id,created_at,updated_at,starts_at,ends_at) VALUES (?,?,?,?,?,?,\'published\',1,?,?,?,?,?)').bind('local-' + kind, kind, kind === 'page' ? 'lokale-testseite' : 'lokaler-' + kind, 'Synthetischer Test: ' + kind, 'Keine echten Schulnachrichten oder personenbezogenen Daten.', 'Dieser Inhalt wurde ausschließlich für den lokalen Funktionstest erstellt.', OWNER.id, t, t, kind === 'event' ? '2026-11-16T15:00:00.000Z' : null, kind === 'event' ? '2026-11-16T16:00:00.000Z' : null)),
    db.prepare('INSERT INTO calendar_categories(id,name,color,kind) VALUES (?,?,?,?)').bind('local-category', 'Lokaler Test', '#3666F5', 'event')
  ]);
  const bucket = await mf.getR2Bucket('BUCKET');
  for (const [id, color] of [['local-logo', '#101D35'], ['local-logo-dark', '#FFFFFF']]) {
    const svg = logo(color), key = id + '.svg';
    await bucket.put(key, svg, { httpMetadata: { contentType: 'image/svg+xml' } });
    await db.prepare('INSERT INTO media(id,key,name,type,bytes,alt,rights,approved,uploader_id,created_at) VALUES (?,?,?,?,?,?,?,1,?,?)').bind(id, key, key, 'image/svg+xml', Buffer.byteLength(svg), 'Selbst erstelltes synthetisches Testlogo', 'Für diesen Test selbst erstellt', OWNER.id, t).run();
  }
}
