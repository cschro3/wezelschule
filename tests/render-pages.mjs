// Exercises the compiled RSC Worker, including server/client boundaries.
import {createRequire} from 'node:module';
import {dirname,resolve} from 'node:path';
import {readFile,readdir} from 'node:fs/promises';
import assert from 'node:assert/strict';
import {seeds} from '../lib/seeds.ts';
const require=createRequire(import.meta.url);
const {build}=require(require.resolve('esbuild',{paths:[dirname(require.resolve('vite'))]}));
await build({entryPoints:['lib/builtin-pages.ts'],outfile:'tests/.generated/builtin-pages.mjs',bundle:true,format:'esm',platform:'node',packages:'external',logLevel:'silent'});
const {builtinPageTemplates,schoolBuilding}=await import('./.generated/builtin-pages.mjs');
const {Miniflare}=require(require.resolve('miniflare',{paths:[dirname(require.resolve('wrangler'))]}));
const moduleNames=['index.js',...(await readdir('dist/server',{recursive:true})).filter(x=>x!=='index.js'&&/\.(?:m?js|wasm)$/.test(x))];
const mf=new Miniflare({modules:moduleNames.map(path=>({type:path.endsWith('.wasm')?'CompiledWasm':'ESModule',path:resolve('dist/server',path)})),modulesRoot:resolve('dist/server'),compatibilityDate:'2026-05-15',compatibilityFlags:['nodejs_compat'],d1Databases:{DB:'wezel-render-test'},r2Buckets:{BUCKET:'wezel-render-test'}});
const db=await mf.getD1Database('DB');
try{
 for(const name of (await readdir('drizzle')).filter(x=>x.endsWith('.sql')).sort())for(const statement of (await readFile('drizzle/'+name,'utf8')).split('--> statement-breakpoint'))if(statement.trim())await db.prepare(statement).run();
 const stamp=new Date().toISOString();
 for(const e of seeds)await db.prepare('INSERT INTO entries (id,kind,slug,title,excerpt,body,category,status,rights,source,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)').bind('source-'+e.slug,e.kind,e.slug,e.title,e.excerpt,e.body,e.category,e.status,e.rights,e.source??null,stamp,stamp).run();
 // Published fixtures exercise the homepage link helper and every detail-page kind.
 for(const kind of ['news','project','event'])await db.prepare('INSERT INTO entries (id,kind,slug,title,excerpt,body,category,status,rights,starts_at,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)').bind('demo-render-'+kind,kind,'demo-render-'+kind,'DEMO · Rendering '+kind,'Nur isolierter Test','Lokale Testinhalte','DEMO','published',1,kind==='event'?'2030-01-01T10:00:00.000Z':null,stamp,stamp).run();
 const paths=['/','/leitbild','/unsere-schule','/lernen','/digitales-lernen','/individuelle-foerderung','/berufsorientierung','/schulsozialarbeit','/downloads','/termine','/projekte','/kontakt','/service','/schulgebaeude','/vertretungsplan','/impressum','/datenschutz','/barrierefreiheit','/schule/leitbild','/lernen/digitales-lernen','/service/downloads','/aktuelles/demo-render-news','/projekte/demo-render-project','/termine/demo-render-event'];
 const failures=[];
 for(const path of paths){const r=await mf.dispatchFetch('https://wezel.test'+path);const html=await r.text();const passed=r.status===200&&/<h1[\s>]/.test(html)&&!html.includes('Ein kurzer Zwischenstopp.');if(!passed)failures.push(path);console.log((passed?'PASS ':'FAIL ')+path+' status='+r.status+' h1='+/<h1[\s>]/.test(html));}
 assert.deepEqual(failures,[],'Published pages must render an actual h1 instead of a streamed error boundary.');
 const headers={'oai-authenticated-user-id':'qa-system','oai-authenticated-user-email':'system@wezel.invalid'};
 await db.prepare("INSERT INTO users (id,identity,email,name,role,active,created_at) VALUES ('qa-system','qa-system','system@wezel.invalid','DEMO Testadmin','SYSTEM_ADMIN',1,?)").bind(stamp).run();
 let response=await mf.dispatchFetch('https://wezel.test/admin/design',{headers,redirect:'manual'});let html=await response.text();assert.equal(response.status,200);assert(html.includes('Website-Designer'));console.log('PASS protected designer SSR with local authenticated identity');
 await db.prepare('INSERT INTO entries (id,kind,slug,title,body,category,status,rights,draft,draft_status,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)').bind('demo-preview','page','demo-preview','DEMO veröffentlichte Seite','DEMO öffentlicher Text','DEMO','published',1,JSON.stringify({title:'DEMO PRIVATE VORSCHAU',body:'DEMO NICHT ÖFFENTLICHER TEXT'}),'review',stamp,stamp).run();
 response=await mf.dispatchFetch('https://wezel.test/admin/preview?document=demo-preview',{headers,redirect:'manual'});html=await response.text();assert.equal(response.status,200);assert(html.includes('DEMO PRIVATE VORSCHAU'));assert(html.includes('DEMO NICHT ÖFFENTLICHER TEXT'));console.log('PASS authenticated page preview renders its actual draft');
 response=await mf.dispatchFetch('https://wezel.test/admin/preview?document=demo-preview',{redirect:'manual'});html=await response.text();assert(!html.includes('DEMO NICHT ÖFFENTLICHER TEXT'));assert(response.status>=300&&response.status<400||html.includes('signin-with-chatgpt'));console.log('PASS anonymous page preview never returns draft content');
 const stateResponse=await mf.dispatchFetch('https://wezel.test/api/admin/design',{headers});const state=await stateResponse.json();assert.equal(stateResponse.status,200);state.config.blocks[0].title='DEMO UNVERÖFFENTLICHTES DESIGN';
 await db.prepare('INSERT INTO design_drafts (id,payload,version,base_version,state,actor_id,updated_at) VALUES (?,?,?,?,?,?,?)').bind('site',JSON.stringify(state.config),1,1,'draft','qa-system',stamp).run();
 response=await mf.dispatchFetch('https://wezel.test/admin/preview?design=1',{headers,redirect:'manual'});html=await response.text();assert(html.includes('DEMO UNVERÖFFENTLICHTES DESIGN'));const live=await (await mf.dispatchFetch('https://wezel.test/')).text();assert(!live.includes('DEMO UNVERÖFFENTLICHTES DESIGN'));console.log('PASS protected design preview renders unpublished design while the public page stays unchanged');
 const originalBuilding=await (await mf.dispatchFetch('https://wezel.test/schulgebaeude')).text();assert(originalBuilding.includes(schoolBuilding.title));assert(originalBuilding.includes('Außenansicht der Wezelschule Östertal vergrößern'));assert(originalBuilding.includes('Bildrechte zur öffentlichen Nutzung noch zu bestätigen.'));
 const template=builtinPageTemplates([])[0].entry;await db.prepare('INSERT INTO entries (id,kind,slug,title,excerpt,body,category,status,rights,blocks,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)').bind('demo-building','page',template.slug,'DEMO CMS Schulgebäude',template.excerpt,template.body,template.category,'published',1,template.blocks,stamp,stamp).run();
 const publishedBuilding=await (await mf.dispatchFetch('https://wezel.test/schulgebaeude')).text();assert(publishedBuilding.includes('DEMO CMS Schulgebäude'));assert(publishedBuilding.includes('Außenansicht der Wezelschule Östertal vergrößern'));assert(publishedBuilding.includes('Weitere Außenansicht der Wezelschule Östertal vergrößern'));assert(publishedBuilding.includes(schoolBuilding.text));assert(publishedBuilding.includes('Bildrechte zur öffentlichen Nutzung noch zu bestätigen.'));console.log('PASS school building keeps its existing gallery and renders the CMS replacement after publication');
 console.log(paths.length+' public page renders, 4 protected-render scenarios and the school-building replacement passed.');
}finally{await mf.dispose();}
