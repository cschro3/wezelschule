// Read-only portability audit. Does not deploy, migrate, initialize accounts,
// read environment secrets or access an existing database/media directory.
import { readFile, readdir, mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { spawnSync } from 'node:child_process';

const root=process.cwd(),sourceFiles=[];
async function walk(path){for(const item of await readdir(resolve(root,path),{withFileTypes:true})){const name=path+'/'+item.name;if(item.isDirectory())await walk(name);else if(/\.(?:tsx?|mjs)$/.test(name))sourceFiles.push(name);}}
for(const path of ['app','lib','db','worker'])await walk(path);
const sources=await Promise.all(sourceFiles.map(async path=>({path,text:await readFile(resolve(root,path),'utf8')})));
const cloudflareImports=sources.filter(x=>/from\s*['"]cloudflare:workers['"]/.test(x.text)).map(x=>x.path);
const d1Files=sources.filter(x=>/env\.DB|drizzle-orm\/d1/.test(x.text)).map(x=>x.path);
const r2Files=sources.filter(x=>/env\.BUCKET/.test(x.text)).map(x=>x.path);
const pkg=JSON.parse(await readFile('package.json','utf8'));
const native=spawnSync(process.execPath,['--input-type=module','-e',"try{await import('cloudflare:workers');console.log(JSON.stringify({supported:true}));}catch(error){console.log(JSON.stringify({supported:false,code:error.code}));}"],{encoding:'utf8',timeout:10000,env:{PATH:process.env.PATH||''}});
if(native.error||native.status!==0)throw Error('Native Node probe failed to execute.');
const nativeResult=JSON.parse(native.stdout.trim());
const checks=[
 {id:'node-version',status:parseInt(process.versions.node)>=24?'passed':'blocked',detail:'Checked local Node runtime: '+process.version+'. Hetzner must separately confirm the selected runtime.'},
 {id:'cloudflare-runtime',status:cloudflareImports.length&&!nativeResult.supported?'blocked':'manual-review',detail:'Native Node import result: '+JSON.stringify(nativeResult),files:cloudflareImports},
 {id:'database-adapter',status:d1Files.length?'blocked':'manual-review',detail:'Current Drizzle adapter and transactional operations depend on D1. A native persistent database adapter and migration/restore verification are required.',files:d1Files},
 {id:'media-adapter',status:r2Files.length?'blocked':'manual-review',detail:'Private and approved media use R2 bindings. A persistent storage adapter with the same authorization rules is required.',files:r2Files},
 {id:'production-start',status:/wrangler|local-test|Miniflare/i.test(pkg.scripts?.start||'')?'blocked':'manual-review',detail:'Current start command: '+pkg.scripts?.start},
 {id:'password-wasm',status:'manual-review',detail:'Argon2id currently imports a Worker-compiled WebAssembly module. Verify the native Node build/loader and compatibility with existing password hashes; do not replace hashing or reset accounts to hide a runtime problem.'},
 {id:'mail-transport',status:'manual-review',detail:'Current security mail uses the external Resend API; the local test captures synthetic messages. Decide the real mail provider and test its transport. An SMTP provider requires an adapter, not just an SMTP environment variable.'},
 {id:'proxy-and-origin',status:'manual-review',detail:'Confirm Hetzner port/socket handoff, trusted client-IP headers and HTTPS forwarding; force password-only AUTH_MODE=local outside Sites and reject forged platform identity headers. Retain CSRF, Secure cookies, MFA and security headers.'},
 {id:'node-capacity',status:'unverified',detail:'The advertised PHP memory_limit is not a Node.js RAM allocation. Node RAM/CPU/process limits require provider confirmation and a native-app load test.'},
 {id:'storage-and-backup',status:'unverified',detail:'Confirm writable private storage outside the document root, filesystem/locking behavior, database availability, backup location and consistent database restore.'},
 {id:'domain-cutover',status:'not-performed',detail:'Existing domain, DNS, mail records and website are untouched. No hosting order or deployment was made.'}
];
const report={format:1,checkedAt:new Date().toISOString(),scope:'read-only source audit and native Node import probe; no Hetzner server access',sourceBaseline:'6124b9732c6bf4f0665cd7d9f0fc46daf3ce7b2e',node:process.version,cloudflareImports:cloudflareImports.length,checks,readyForUnchangedNodeDeployment:false,purchaseRecommendation:'Do not regard Node.js support alone as a compatibility or capacity confirmation.'};
const output=process.argv[2];if(output){await mkdir(resolve(output,'..'),{recursive:true});await writeFile(output,JSON.stringify(report,null,2)+'\n');}
console.log(JSON.stringify(report,null,2));
