// Local preview initialization only. Never part of migrations or the hosted Worker.
import {seeds} from '../lib/seeds.ts';
import {defaults} from '../lib/defaults.ts';
import {writeFileSync} from 'node:fs';
const quote=(v)=>v===null||v===undefined?'NULL':typeof v==='number'?String(v):"'"+String(v).replace(/'/g,"''")+"'";
const stamp=new Date().toISOString();const names={publishAt:'publish_at',startsAt:'starts_at',endsAt:'ends_at',recurrenceCount:'recurrence_count',seoTitle:'seo_title',seoDescription:'seo_description'};
let sql='';for(const seed of seeds){const row={...seed,id:'source-'+seed.slug,author_id:'qa-system',version:1,created_at:stamp,updated_at:stamp};sql+='INSERT OR IGNORE INTO entries ('+Object.keys(row).map(k=>names[k]??k).join(',')+') VALUES ('+Object.values(row).map(quote).join(',')+');\n';}
sql+="INSERT OR IGNORE INTO settings (key,value,updated_at) VALUES ('site',"+quote(JSON.stringify(defaults))+','+quote(stamp)+');\n';
writeFileSync('.sites-runtime/local-seed.sql',sql);
