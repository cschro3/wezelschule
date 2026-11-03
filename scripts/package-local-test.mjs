// Produce a source-only local test distribution; never includes runtime state,
// published-data exports, credentials, Git metadata or a hosted deployment ID.
import { readdir, readFile, writeFile, mkdir } from 'node:fs/promises';
import { resolve, relative } from 'node:path';
import { createHash } from 'node:crypto';
import { zipSync } from 'fflate';
const root = process.cwd(), files = {}, manifest = [];
const skipped = new Set(['.generated', 'node_modules', '.git', '.local-test', '.wrangler', '.sites-runtime', '.agents', '.codex', 'dist', '.next', '.vinext', 'out', 'outputs', 'work', 'coverage', 'exports']);
async function add(path) {
  const name = relative(root, path).split('\\').join('/');
  if (name.startsWith('docs/verification/') || name === 'LOCAL-TEST-PACKAGE.json' || name === 'next-env.d.ts' || name === 'public/__qa_viewports.html' || /(?:^|\/)(?:\.env(?!\.example$)|\.dev\.vars)|\.(?:log|pem|sqlite|sqlite3|db|zip|tsbuildinfo)$/.test(name)) return;
  let data = await readFile(path);
  if (name === '.openai/hosting.json') { const config = JSON.parse(data.toString('utf8')); delete config.project_id; data = Buffer.from(JSON.stringify(config, null, 2) + '\n'); }
  files['WEZEL-NEXT/' + name] = data;
  manifest.push({ path: name, bytes: data.length, sha256: createHash('sha256').update(data).digest('hex') });
}
async function walk(path) {
  let children; try { children = await readdir(path, { withFileTypes: true }); } catch (e) { if (e.code === 'ENOENT') return; throw e; }
  for (const child of children) {
    if (skipped.has(child.name) || child.isSymbolicLink()) continue;
    const full = resolve(path, child.name); if (child.isDirectory()) await walk(full); else if (child.isFile()) await add(full);
  }
}
await walk(root);
manifest.sort((a, b) => a.path.localeCompare(b.path));
files['WEZEL-NEXT/LOCAL-TEST-PACKAGE.json'] = Buffer.from(JSON.stringify({ purpose: 'isolated synthetic local test; no hosted deployment target', baseline: 'c68517161c6c5b6142087707c74eadc73abb41a7', branch: 'phase6-local-test', exclusions: ['exports of published data', 'old verification screenshots', 'all local state, secrets and sessions', 'node_modules and generated builds', 'hosted project_id'], files: manifest }, null, 2) + '\n');
const output = resolve(process.argv[2] || 'outputs/WEZEL-NEXT-LOCAL-TEST.zip'); await mkdir(resolve(output, '..'), { recursive: true });
await writeFile(output, zipSync(files, { level: 6 }));
console.log(JSON.stringify({ file: output, sourceFiles: manifest.length, bytes: (await readFile(output)).length }));
