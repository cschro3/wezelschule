// Import only the reviewed public snapshot and explicitly exportable logos.
// No hosted database, private drafts, accounts, sessions or secrets are read.
import { createRequire } from 'node:module';
import { dirname, resolve } from 'node:path';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { createHash, randomUUID } from 'node:crypto';
import { pathToFileURL } from 'node:url';
const require = createRequire(import.meta.url);
export const SCHOOL_MARKER = 'school-public-v2';
export const PUBLIC_SNAPSHOT = 'exports/published/content.json';
export const PUBLIC_MEDIA_MANIFEST = 'exports/published/media-manifest.json';
export const ORIGINAL_LOGOS = ['0e72f0df-2b4f-4575-8473-db7de6e4f43c', '573e7210-7adc-4910-a6d8-635adbbe7e5b'];

export async function loadSchoolPreview(stateDirectory) {
  const snapshot = JSON.parse(await readFile(PUBLIC_SNAPSHOT, 'utf8'));
  const manifest = JSON.parse(await readFile(PUBLIC_MEDIA_MANIFEST, 'utf8'));
  if (snapshot.formatVersion !== 1 || !Array.isArray(snapshot.items) || !snapshot.settings?.design || !Array.isArray(manifest)) throw new Error('Invalid public school snapshot.');
  const logos = [];
  for (const id of ORIGINAL_LOGOS) {
    const item = manifest.find(x => x.id === id);
    if (!item?.exported || item.type !== 'image/png') throw new Error('Original school logo is not approved for export: ' + id);
    const bytes = await readFile('exports/published/media/' + id + '.png');
    if (bytes.length !== item.bytes || createHash('sha256').update(bytes).digest('hex') !== item.sha256 || bytes.subarray(0, 8).toString('hex') !== '89504e470d0a1a0a') throw new Error('Original logo integrity check failed: ' + id);
    logos.push({ ...item, bytes });
  }
  const available = new Set(ORIGINAL_LOGOS), omitted = new Map();
  const imageFields = new Set(['image', 'mobileImage', 'video', 'logo', 'darkLogo', 'mobileLogo', 'favicon']);
  function clean(value, path = 'design', parentType = '') {
    if (Array.isArray(value)) return value.map((x, i) => clean(x, path + '[' + i + ']', parentType));
    if (!value || typeof value !== 'object') return value;
    const result = { ...value }, type = value.type || parentType;
    for (const [key, child] of Object.entries(result)) {
      if (imageFields.has(key) && typeof child === 'string') {
        const match = /^\/api\/files\/([\w-]+)$/.exec(child);
        if (match && !available.has(match[1])) {
          omitted.set(match[1], { id: match[1], field: path + '.' + key, reason: manifest.find(x => x.id === match[1])?.reason || 'Not included in the approved public export.' });
          result[key] = type === 'hero' && key === 'image' ? '/school/nschu01.jpg' : '';
          if (type === 'hero' && key === 'image') result.alt = 'Außenansicht der Wezelschule Östertal';
        }
      } else if (child && typeof child === 'object') result[key] = clean(child, path + '.' + key, type);
    }
    return result;
  }
  const settings = clean(structuredClone(snapshot.settings));
  // These are known full wordmarks. Explicit mode reserves the correct width
  // on the first render and prevents a second school-name label flashing over it.
  settings.design.brand.logoMode = 'wordmark';
  const { build } = require(require.resolve('esbuild', { paths: [dirname(require.resolve('vite'))] }));
  await mkdir(stateDirectory, { recursive: true });
  const model = resolve(stateDirectory, 'school-design-model.mjs');
  await build({ entryPoints: ['lib/design-model.ts'], outfile: model, bundle: true, format: 'esm', platform: 'node', logLevel: 'silent' });
  const { designSchema, blockSchema } = await import(pathToFileURL(model).href);
  settings.design = designSchema.parse(settings.design);
  const items = snapshot.items.filter(e => e.status === 'published' && e.rights === 1 && e.visibility !== 'internal').map((entry, index) => {
    const item = clean(structuredClone(entry), 'items[' + index + ']');
    if (item.blocks) {
      const blocks = typeof item.blocks === 'string' ? JSON.parse(item.blocks) : item.blocks;
      item.blocks = JSON.stringify(clean(blocks, 'items[' + index + '].blocks').map(b => blockSchema.parse(b)));
    }
    return item;
  });
  return { settings, items, logos, report: { source: PUBLIC_SNAPSHOT, capturedAt: snapshot.capturedAt, publicItems: items.length, importedLogos: ORIGINAL_LOGOS, omittedMedia: [...omitted.values()], heroFallback: '/school/nschu01.jpg', privateAccountsImported: false } };
}

export async function applySchoolPreview({ db, bucket, owner, stateDirectory, backup = true }) {
  const data = await loadSchoolPreview(stateDirectory), time = new Date().toISOString();
  const previous = await db.prepare("SELECT * FROM settings WHERE key='site'").first();
  let backupFile = null;
  if (backup && previous) {
    const entries = (await db.prepare('SELECT * FROM entries').all()).results;
    backupFile = 'school-preview-before-' + Date.now() + '.json';
    await writeFile(resolve(stateDirectory, backupFile), JSON.stringify({ createdAt: time, settings: previous, entries, excludes: 'Accounts, passwords, MFA and sessions are not exported.' }, null, 2) + '\n', { mode: 0o600, flag: 'wx' });
  }
  for (const logo of data.logos) {
    const exists = await db.prepare('SELECT id FROM media WHERE id=?').bind(logo.id).first();
    if (exists) continue;
    const key = 'school-preview/' + logo.id + '.png';
    await bucket.put(key, logo.bytes, { httpMetadata: { contentType: 'image/png' } });
    await db.prepare('INSERT INTO media(id,key,name,type,bytes,alt,rights,approved,uploader_id,metadata,created_at) VALUES (?,?,?,?,?,?,?,1,?,?,?)').bind(logo.id, key, logo.id === ORIGINAL_LOGOS[0] ? 'Schullogo für dunklen Hintergrund.png' : 'Schullogo für hellen Hintergrund.png', 'image/png', logo.bytes.length, 'Johann Karl Wezel Östertal – Schullogo', logo.reason, owner.id, JSON.stringify({ category: 'Branding', studentImage: false }), time).run();
  }
  const columns = { id: 'id', kind: 'kind', slug: 'slug', title: 'title', excerpt: 'excerpt', body: 'body', blocks: 'blocks', category: 'category', status: 'status', image: 'image', source: 'source', rights: 'rights', publishAt: 'publish_at', startsAt: 'starts_at', endsAt: 'ends_at', location: 'location', recurrence: 'recurrence', recurrenceCount: 'recurrence_count', seoTitle: 'seo_title', seoDescription: 'seo_description', version: 'version', createdAt: 'created_at', updatedAt: 'updated_at', allDay: 'all_day', timeZone: 'time_zone', audience: 'audience', visibility: 'visibility', rrule: 'rrule', externalId: 'external_id' };
  const statements = [
    db.prepare("INSERT INTO settings(key,value,updated_at) VALUES ('site',?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value, version=settings.version+1, updated_at=excluded.updated_at").bind(JSON.stringify(data.settings), time),
    db.prepare("INSERT INTO settings(key,value,updated_at) VALUES ('initialized',?,?) ON CONFLICT(key) DO NOTHING").bind(time, time),
    db.prepare("INSERT INTO settings(key,value,updated_at) VALUES ('local-test-marker',?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value, updated_at=excluded.updated_at").bind(SCHOOL_MARKER, time)
  ];
  for (const item of data.items) {
    const row = { ...item, authorId: owner.id, allDay: item.allDay ?? 0, timeZone: item.timeZone || 'Europe/Berlin', audience: item.audience || 'Alle', visibility: 'public', recurrence: item.recurrence || 'none', recurrenceCount: item.recurrenceCount || 1, version: item.version || 1, createdAt: item.createdAt || time, updatedAt: item.updatedAt || time };
    const fields = Object.keys(columns).filter(k => row[k] !== undefined);
    statements.push(db.prepare('INSERT OR IGNORE INTO entries(' + fields.map(k => columns[k]).join(',') + ',author_id) VALUES (' + [...fields, 'authorId'].map(() => '?').join(',') + ')').bind(...fields.map(k => row[k]), owner.id));
  }
  // Retain the old fixtures as archived records, only if they are still the
  // exact unedited initial examples. User-created/edited entries are preserved.
  for (const kind of ['page', 'news', 'project', 'event']) statements.push(db.prepare("UPDATE entries SET status='archived', updated_at=? WHERE id=? AND title=? AND version=1 AND author_id=?").bind(time, 'local-' + kind, 'Synthetischer Test: ' + kind, owner.id));
  statements.push(db.prepare('INSERT INTO audit(id,actor_id,action,target,created_at) VALUES (?,?,?,?,?)').bind(randomUUID(), owner.id, 'local.school.restore', 'published-public-snapshot', time));
  await db.batch(statements);
  const report = { ...data.report, appliedAt: time, backupFile };
  await writeFile(resolve(stateDirectory, 'school-preview-report.json'), JSON.stringify(report, null, 2) + '\n', { mode: 0o600 });
  return report;
}
