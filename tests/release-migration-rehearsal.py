"""Local-only rehearsal. Never connects to D1/R2 or reads production credentials."""
import argparse,sqlite3,pathlib,json,hashlib,tempfile,shutil,datetime
p=argparse.ArgumentParser();p.add_argument('--public-snapshot');p.add_argument('--media-dir');p.add_argument('--report',default='tests/.generated/release-rehearsal.json');a=p.parse_args()
root=pathlib.Path(__file__).resolve().parent.parent
stamp='2026-11-03T00:00:00.000Z'
def digest(v):return hashlib.sha256(json.dumps(v,ensure_ascii=False,sort_keys=True,default=str).encode()).hexdigest()
with tempfile.TemporaryDirectory(prefix='wezel-release-rehearsal-') as name:
 work=pathlib.Path(name);db=sqlite3.connect(work/'before.sqlite');db.execute('PRAGMA foreign_keys=ON')
 for m in sorted((root/'drizzle').glob('000[01]_*.sql')):db.executescript(m.read_text())
 db.execute('INSERT INTO users(id,identity,email,name,role,active,created_at) VALUES (?,?,?,?,?,?,?)',('qa-preserved','qa-preserved','qa-preserved@wezel.invalid','QA Bestandskonto','SYSTEM_ADMIN',1,stamp))
 settings=json.loads(pathlib.Path(a.public_snapshot).read_text())['settings'] if a.public_snapshot else {'schoolName':'QA Schule','logo':'/api/files/qa-logo','design':{'brand':{'logo':'/api/files/qa-logo','darkLogo':'/api/files/qa-dark'}}}
 db.execute('INSERT INTO settings(key,value,version,updated_at) VALUES (?,?,?,?)',('site',json.dumps(settings,ensure_ascii=False),7,stamp))
 for i,kind in enumerate(['page','event','event','document']):db.execute('INSERT INTO entries(id,kind,slug,title,body,category,status,rights,starts_at,ends_at,recurrence,recurrence_count,author_id,version,created_at,updated_at,blocks,draft,draft_status) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)',('qa-entry-'+str(i),kind,'qa-'+str(i),'QA Bestandsinhalt '+str(i),'Bewahrter Text äöü','QA','published' if i!=2 else 'draft',1,'2026-11-03T17:00:00.000Z' if kind=='event' else None,'2026-11-03T18:00:00.000Z' if kind=='event' else None,'weekly' if i==1 else 'none',3 if i==1 else 1,'qa-preserved',5,stamp,stamp,'[]',None,'draft'))
 db.execute('INSERT INTO design_drafts(id,payload,version,base_version,state,actor_id,updated_at) VALUES (?,?,?,?,?,?,?)',('site',json.dumps(settings),3,7,'review','qa-preserved',stamp));db.execute('INSERT INTO design_history(id,version,snapshot,actor_id,created_at) VALUES (?,?,?,?,?)',('qa-history',7,json.dumps(settings),'qa-preserved',stamp))
 source=pathlib.Path(a.media_dir) if a.media_dir else root/'public';files=list(source.glob('*.png')) if a.media_dir else [root/'public/favicon.svg'];objects=work/'r2-original';objects.mkdir();manifest=[]
 for i,f in enumerate(files):
  data=f.read_bytes();key='qa-object-'+str(i)+f.suffix;(objects/key).write_bytes(data);manifest.append({'key':key,'bytes':len(data),'sha256':hashlib.sha256(data).hexdigest()});db.execute('INSERT INTO media(id,key,name,type,bytes,alt,rights,approved,version,uploader_id,created_at,metadata) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)',('qa-media-'+str(i),key,f.name,'image/png' if f.suffix=='.png' else 'image/svg+xml',len(data),'QA Objekt','Nur lokale Wiederherstellungsprobe',1,4,'qa-preserved',stamp,'{}'))
 db.commit()
 tables=[r[0] for r in db.execute("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name")]
 columns={t:[r[1] for r in db.execute('PRAGMA table_info('+t+')')] for t in tables}
 def snapshot(conn):return {t:list(conn.execute('SELECT '+','.join('"'+c+'"' for c in columns[t])+' FROM "'+t+'" ORDER BY rowid')) for t in tables}
 before=snapshot(db);backup=sqlite3.connect(work/'backup.sqlite');db.backup(backup);backup.close();shutil.copytree(objects,work/'r2-backup')
 for m in sorted((root/'drizzle').glob('000[23]_*.sql')):db.executescript(m.read_text())
 assert snapshot(db)==before,'Existing columns or rows changed'
 assert db.execute('PRAGMA integrity_check').fetchone()[0]=='ok';assert not list(db.execute('PRAGMA foreign_key_check'))
 assert db.execute("SELECT visibility FROM entries WHERE kind='event'").fetchone()[0]=='public'
 restored=sqlite3.connect(work/'restored.sqlite');saved=sqlite3.connect(work/'backup.sqlite');saved.backup(restored);saved.close()
 assert snapshot(restored)==before;assert restored.execute('PRAGMA integrity_check').fetchone()[0]=='ok';assert not list(restored.execute('PRAGMA foreign_key_check'));restored.close()
 shutil.copytree(work/'r2-backup',work/'r2-restored')
 for obj in manifest:
  value=(work/'r2-restored'/obj['key']).read_bytes();assert len(value)==obj['bytes'];assert hashlib.sha256(value).hexdigest()==obj['sha256']
 result={'timestamp':datetime.datetime.now(datetime.timezone.utc).isoformat(),'scope':'local SQLite and filesystem objects; not a production D1/R2 restore','result':'passed','baselineTables':len(tables),'existingUsersPreserved':1,'existingEntriesPreserved':4,'existingEventEntriesPreserved':2,'existingSettingsAndDesignRevisionsPreserved':True,'mediaObjectsRestored':len(manifest),'oldColumnValuesUnchanged':True,'migrationOrder':['0002_security_login.sql','0003_worried_invisible_woman.sql'],'integrityCheck':'ok','foreignKeyViolations':0,'backupRestoreDigestMatch':digest(snapshot(sqlite3.connect(work/'restored.sqlite')))==digest(before),'productionConnected':False}
 path=root/a.report;path.parent.mkdir(parents=True,exist_ok=True);path.write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n');print(json.dumps(result,ensure_ascii=False))
