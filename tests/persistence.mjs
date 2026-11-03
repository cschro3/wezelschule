import {getPlatformProxy} from 'wrangler';
import assert from 'node:assert/strict';
import {readdir,readFile} from 'node:fs/promises';
const mode=process.argv[2];const platform=await getPlatformProxy({configPath:'dist/server/wrangler.json',persist:{path:'.sites-runtime/test-data'}});
try{if(mode==='write'){
 const table=await platform.env.DB.prepare("SELECT name FROM sqlite_master WHERE name='settings'").first();
 if(!table){for(const name of (await readdir('drizzle')).filter(x=>x.endsWith('.sql')).sort())for(const statement of (await readFile('drizzle/'+name,'utf8')).split('--> statement-breakpoint'))if(statement.trim())await platform.env.DB.prepare(statement).run();}
 else {const cols=await platform.env.DB.prepare('PRAGMA table_info(settings)').all();if(!cols.results.some(x=>x.name==='version'))for(const statement of (await readFile('drizzle/0001_condemned_rumiko_fujikawa.sql','utf8')).split('--> statement-breakpoint'))if(statement.trim())await platform.env.DB.prepare(statement).run();}
 await platform.env.DB.prepare("INSERT OR REPLACE INTO settings (key,value,updated_at) VALUES ('qa-restart-proof','persisted-between-processes',?)").bind(new Date().toISOString()).run();
 await platform.env.BUCKET.put('qa-restart-proof',new TextEncoder().encode('DEMO persistence proof'));
 console.log('Local D1/R2 persistence fixture written.');
}else{
 assert.equal((await platform.env.DB.prepare("SELECT value FROM settings WHERE key='qa-restart-proof'").first()).value,'persisted-between-processes');
 assert.equal(await (await platform.env.BUCKET.get('qa-restart-proof')).text(),'DEMO persistence proof');
 console.log('PASS D1 records and R2 bytes survived complete process restart.');
}}finally{await platform.dispose();}
