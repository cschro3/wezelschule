import {contentReview} from '../../../../lib/content-review';
import {env} from 'cloudflare:workers';
import {eq,and,desc,sql} from 'drizzle-orm';
import {z} from 'zod';
import {getDb} from '../../../../db';
import {entries,users,media,settings,audit,revisions,designDrafts,designHistory} from '../../../../db/schema';
import {authorize,initialize,log,rateLimit,id,now,HttpError,getSettings} from '../../../../lib/server';
import {can,ownsOrEdits,roles,kinds,validOrigin,validURL,fileType} from '../../../../lib/policy.mjs';
import {designState,saveDesign,designAction,assertAssetsApproved,assertPublishedLinks} from '../../../../lib/design-store';
import {blockSchema,defaultDesign} from '../../../../lib/design-model';
import {authSessions,authUsers} from '../../../../db/auth-schema';
import {authMode,localSession} from '../../../../lib/security/auth';
import {sanitizeSVG} from '../../../../lib/safe-svg';
import {builtinPageTemplates} from '../../../../lib/builtin-pages';
export const dynamic='force-dynamic';
const urlField=z.string().max(1000).refine(validURL,'Nur relative Pfade oder HTTPS-URLs sind erlaubt.').nullable().optional();
const dt=z.string().datetime().nullable().optional();
const contentSchema=z.object({kind:z.enum(kinds as ['page','news','event','project','document']),slug:z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).max(100),title:z.string().trim().min(3).max(180),excerpt:z.string().max(500).default(''),body:z.string().max(60000).default(''),category:z.string().min(1).max(80),status:z.enum(['draft','review','approved','published','archived']),image:urlField,source:urlField,rights:z.number().int().min(0).max(1),publishAt:dt,startsAt:dt,endsAt:dt,location:z.string().max(250).nullable().optional(),recurrence:z.enum(['none','weekly','monthly']).default('none'),recurrenceCount:z.number().int().min(1).max(52).default(1),seoTitle:z.string().max(180).nullable().optional(),seoDescription:z.string().max(300).nullable().optional(),blocks:z.array(blockSchema).max(60).nullable().optional(),version:z.number().int().optional()});
function validateMeta(value:string,approved:number){let raw;try{raw=JSON.parse(value);}catch{throw new HttpError(400,'Ungültige Medienmetadaten.');}const m=z.object({category:z.string().max(80).optional(),width:z.number().int().min(1).max(30000).optional(),height:z.number().int().min(1).max(30000).optional(),focusX:z.number().min(0).max(100).optional(),focusY:z.number().min(0).max(100).optional(),studentImage:z.boolean().optional(),consent:z.string().max(2000).optional()}).strict().parse(raw);if(approved&&m.studentImage&&(m.consent?.trim().length??0)<8)throw new HttpError(400,'Für Schülerbilder ist ein dokumentierter Freigabenachweis erforderlich.');}
function ok(data:unknown){return Response.json(data,{headers:{'Cache-Control':'no-store'}});}
async function bounded(req:Request,max:number){
 const reader=req.body?.getReader();if(!reader)return req;
 const chunks:Uint8Array[]=[];let total=0;
 while(true){const {value,done}=await reader.read();if(done)break;total+=value.length;if(total>max){await reader.cancel();throw new HttpError(413,'Die Anfrage ist zu groß.');}chunks.push(value);}
 const body=new Uint8Array(total);let offset=0;for(const c of chunks){body.set(c,offset);offset+=c.length;}
 return new Request(req.url,{method:req.method,headers:req.headers,body});
}
async function perform(req:Request,ctx:{params:Promise<{path:string[]}>}){
 const {path}=await ctx.params;const endpoint=path[0],target=path[1];const user=await authorize();const db=getDb();
 if(req.method!=='GET'){
  if(!validOrigin(req.headers.get('origin'),req.url)||req.headers.get('x-wezel-request')!=='cms')throw new HttpError(403,'Ungültige Anfrageherkunft.');
  await rateLimit(user.id);
  req=await bounded(req,endpoint==='media'?24*1024*1024:1500*1024);
 }
 if(req.method==='GET'){
  await initialize(user);
  if(endpoint==='design'){if(!can(user.role,'design'))throw new HttpError(403,'Designer-Zugriff fehlt.');return ok(await designState());}
  if(endpoint==='overview'){
   const all=await db.select().from(entries).orderBy(desc(entries.updatedAt));const designRefs=JSON.stringify([await getSettings(),await db.select().from(designDrafts),await db.select().from(designHistory)]);const historicalRefs=JSON.stringify(await db.select().from(revisions));
   return ok({user,entries:all.filter(e=>ownsOrEdits(user,e)),builtinPages:builtinPageTemplates(all),review:contentReview(all,await getSettings()),media:(await db.select().from(media).orderBy(desc(media.createdAt))).map(m=>({...m,usage:[...all.filter(e=>JSON.stringify(e).includes('/api/files/'+m.id)).map(e=>e.title),...(designRefs.includes('/api/files/'+m.id)?['Website-Design / Versionsverlauf']:[]),...(historicalRefs.includes('/api/files/'+m.id)?['Frühere Inhaltsversion']:[])]})),settings:await getSettings(),audit:can(user.role,'settings')?await db.select().from(audit).orderBy(desc(audit.createdAt)).limit(50):[],users:can(user.role,'users')?await db.select().from(users):[]});
  }
  if(endpoint==='revisions'&&target){const e=await db.select().from(entries).where(eq(entries.id,target)).get();if(!e||!ownsOrEdits(user,e))throw new HttpError(404,'Inhalt nicht gefunden.');return ok(await db.select().from(revisions).where(eq(revisions.entryId,target)).orderBy(desc(revisions.createdAt)));}
  if(endpoint==='backup'){
   await authorize('system');await log(user.id,'backup.export','database');
   const names=['users','settings','entries','media','revisions','audit','rate_limits','design_drafts','design_history'];const result=await env.DB!.batch(names.map(t=>env.DB!.prepare('SELECT * FROM '+t)));return ok({format:2,exportedAt:now(),attachmentsInline:false,tables:Object.fromEntries(names.map((name,i)=>[name,result[i].results]))});
  }
  throw new HttpError(404,'Nicht gefunden.');
 }
 if(endpoint==='design'){
  if(req.method==='PATCH')return ok(await saveDesign(user,z.object({config:z.unknown(),version:z.number().int(),baseVersion:z.number().int()}).parse(await req.json())));
  return ok(await designAction(user,z.object({action:z.enum(['review','approve','publish','discard','restore']),version:z.number().int(),baseVersion:z.number().int(),revisionId:z.string().optional()}).parse(await req.json())));
 }
 if(endpoint==='entries'){
  await authorize('write');const previous=target?await db.select().from(entries).where(eq(entries.id,target)).get():undefined;
  if(target&&!previous)throw new HttpError(404,'Inhalt nicht gefunden.');
  if(previous&&(!ownsOrEdits(user,previous)))throw new HttpError(403,'Dieser Inhalt kann mit Ihrer Rolle nicht verändert werden.');
  if(req.method==='DELETE'){
   if(!can(user.role,'publish'))throw new HttpError(403,'Nur die Redaktion darf Inhalte archivieren.');
   if(!previous)throw new HttpError(404,'Inhalt nicht gefunden.');
   if(new URL(req.url).searchParams.get('permanent')==='1'){
    await authorize('settings');if(previous.status!=='archived')throw new HttpError(400,'Vor dem endgültigen Löschen erst archivieren.');
    await db.batch([db.delete(revisions).where(eq(revisions.entryId,previous.id)),db.delete(entries).where(eq(entries.id,previous.id))]);await log(user.id,'entry.delete',previous.id);return ok({ok:true});
   }
   await db.update(entries).set({status:'archived',version:previous.version+1,updatedAt:now()}).where(eq(entries.id,previous.id));await log(user.id,'entry.archive',previous.id);return ok({ok:true});
  }
  const input=contentSchema.parse(await req.json());
  if(['approved','archived'].includes(input.status)&&!can(user.role,'publish'))throw new HttpError(403,'Freigabe und Archivierung nur durch die Administration.');
  if(input.status==='published'){
   if(!can(user.role,'publish'))throw new HttpError(403,'Veröffentlichung nur durch die Administration.');
   if(previous?.status!=='approved'&&previous?.draftStatus!=='approved')throw new HttpError(400,'Vor der Veröffentlichung zuerst freigeben.');
   if(input.blocks){await assertAssetsApproved(input.blocks);await assertPublishedLinks(input.blocks,input.kind==='page'?['/'+input.slug]:[]);}
   if(!input.rights)throw new HttpError(400,'Inhalts- und Nutzungsrechte müssen bestätigt sein.');
   if(input.kind==='document'&&!input.source)throw new HttpError(400,'Ein veröffentlichtes Dokument benötigt eine Datei oder offizielle PDF-URL.');
   for(const path of [input.image,input.kind==='document'?input.source:null])if(path?.startsWith('/api/files/')){const m=await db.select().from(media).where(eq(media.id,path.split('/').at(-1)!)).get();if(!m?.approved)throw new HttpError(400,'Verwendete Dateien müssen zuerst freigegeben werden.');if(path===input.image&&!m.type.startsWith('image/'))throw new HttpError(400,'Titelbilder müssen Bilddateien sein.');if(input.kind==='document'&&path===input.source&&m.type!=='application/pdf')throw new HttpError(400,'Dokumente benötigen eine PDF-Datei.');}
  }
  if(input.kind==='event'&&(!input.startsAt||(input.endsAt&&input.endsAt<input.startsAt)))throw new HttpError(400,'Gültiger Beginn und Endzeitpunkt erforderlich.');
  if(previous&&input.version!==previous.version)throw new HttpError(409,'Dieser Inhalt wurde zwischenzeitlich geändert. Bitte neu laden.');
  if(input.image&&!/^\/(?:api\/files|school)\//.test(input.image))throw new HttpError(400,'Titelbilder müssen aus der lokalen Mediathek stammen.');
  const {version,blocks,...rest}=input;const fields={...rest,...(blocks!==undefined?{blocks:blocks?JSON.stringify(blocks):null}:{})};const key=previous?.id??id(),stamp=now();if(input.status==='published'&&!fields.publishAt)fields.publishAt=stamp;
  if(previous){
   const staged=previous.status==='published'&&input.status!=='published'&&input.status!=='archived';
   const changes=staged?{draft:JSON.stringify(fields),draftStatus:input.status,updatedAt:stamp,version:previous.version+1}:{...fields,draft:null,draftStatus:'draft',updatedAt:stamp,version:previous.version+1};
   const changed=await db.update(entries).set(changes).where(and(eq(entries.id,key),eq(entries.version,previous.version))).returning().get();if(!changed)throw new HttpError(409,'Dieser Inhalt wurde zwischenzeitlich geändert.');
   await db.insert(revisions).values({id:id(),entryId:key,version:previous.version,snapshot:JSON.stringify(previous),actorId:user.id,createdAt:stamp});
  }else {const created=await db.insert(entries).values({...fields,id:key,authorId:user.id,version:1,createdAt:stamp,updatedAt:stamp}).onConflictDoNothing().returning().get();if(!created)throw new HttpError(409,'Für dieses URL-Kürzel existiert bereits ein Inhalt. Bitte die Seitenliste neu laden und den vorhandenen Eintrag bearbeiten.');}
  await log(user.id,input.status==='published'?'entry.publish':'entry.'+(previous?'update':'create'),key+'@'+(previous?previous.version+1:1));return ok({ok:true,id:key});
 }
 if(endpoint==='media'){
  await authorize('media');
  if(req.method==='DELETE'&&target){
   await authorize('publish');const item=await db.select().from(media).where(eq(media.id,target)).get();if(!item)throw new HttpError(404,'Datei nicht gefunden.');
   const refs=await db.select({id:entries.id}).from(entries).where(sql`${entries.image}=${'/api/files/'+target} OR ${entries.body} LIKE ${'%/api/files/'+target+'%'} OR ${entries.source}=${'/api/files/'+target} OR ${entries.blocks} LIKE ${'%/api/files/'+target+'%'} OR ${entries.draft} LIKE ${'%/api/files/'+target+'%'}`);
   const site=await getSettings();const historic=await db.select().from(revisions);const designs=[...await db.select().from(designDrafts),...await db.select().from(designHistory)];if(refs.length||JSON.stringify(site).includes('/api/files/'+target)||historic.some(r=>r.snapshot.includes('/api/files/'+target))||designs.some(d=>JSON.stringify(d).includes('/api/files/'+target)))throw new HttpError(409,'Die Datei wird noch verwendet. Zuerst die Verweise entfernen.');
   await env.BUCKET!.delete(item.key);await db.delete(media).where(eq(media.id,target));await log(user.id,'media.delete',target);return ok({ok:true});
  }
  if(req.method==='PATCH'&&target){
   const original=await db.select().from(media).where(eq(media.id,target)).get();if(!original)throw new HttpError(404,'Datei nicht gefunden.');if(user.role==='AUTOR'&&(original.uploaderId!==user.id||original.approved))throw new HttpError(403,'Autoren dürfen nur eigene interne Medien bearbeiten.');const input=z.object({alt:z.string().min(1).max(500),rights:z.string().min(8).max(2000),approved:z.number().int().min(0).max(1),version:z.number().int().min(1),metadata:z.string().max(4000).nullable().optional()}).parse(await req.json());
   if(input.approved!==original.approved&&!can(user.role,'publish'))throw new HttpError(403,'Medienfreigabe nur durch die Administration.');if(input.metadata)validateMeta(input.metadata,input.approved);if(!input.approved){const path='/api/files/'+target;if(JSON.stringify(await getSettings()).includes(path)||(await db.select().from(entries)).some(e=>e.status==='published'&&JSON.stringify({...e,draft:null}).includes(path)))throw new HttpError(409,'Die Datei wird öffentlich verwendet und kann nicht ohne Austausch zurückgezogen werden.');}
   const {version,...fields}=input;const changed=await db.update(media).set({...fields,version:version+1}).where(and(eq(media.id,target),eq(media.version,version))).returning().get();if(!changed)throw new HttpError(409,'Die Datei wurde zwischenzeitlich geändert. Bitte neu laden.');await log(user.id,'media.review',target);return ok({ok:true});
  }
  const form=await req.formData(),file=form.get('file'),alt=String(form.get('alt')||''),rights=String(form.get('rights')||'');
  if(!(file instanceof File)||!alt.trim()||rights.trim().length<8)throw new HttpError(400,'Datei, Beschreibung und Nachweis der Nutzungsrechte erforderlich.');
  if(file.size>(file.type.startsWith('video/')?20:8)*1024*1024||file.size===0)throw new HttpError(400,'Dateien dürfen höchstens 8 MB groß sein.');
  let bytes=new Uint8Array(await file.arrayBuffer());let type=fileType(bytes);
  if(file.type==='image/svg+xml'){try{bytes=new TextEncoder().encode(sanitizeSVG(new TextDecoder().decode(bytes)));type='image/svg+xml';}catch(e:any){throw new HttpError(400,'Unsicheres SVG: '+e.message);}}
  if(bytes.length>12&&String.fromCharCode(...bytes.slice(4,8))==='ftyp'&&['avif','avis'].includes(String.fromCharCode(...bytes.slice(8,12))))type='image/avif';
  if(bytes.length>12&&String.fromCharCode(...bytes.slice(4,8))==='ftyp'&&/^(isom|iso[2-9]|mp4[12]|avc1|M4V )$/.test(String.fromCharCode(...bytes.slice(8,12))))type='video/mp4';
  if(bytes[0]===0x1a&&bytes[1]===0x45&&bytes[2]===0xdf&&bytes[3]===0xa3&&file.type==='video/webm')type='video/webm';
  if(!type||type!==file.type)throw new HttpError(400,'Erlaubt sind geprüfte JPEG-, PNG-, WebP-, SVG-, PDF-, MP4- und WebM-Dateien.');
  if(type==='application/pdf'&&new TextDecoder('latin1').decode(bytes).match(/\/(JavaScript|JS|OpenAction|AA|EmbeddedFile)\b/))throw new HttpError(400,'Aktive oder eingebettete PDF-Inhalte sind nicht erlaubt.');
  const key=id(),approved=form.get('approved')==='1'&&can(user.role,'publish')?1:0;
  const metadata=String(form.get('metadata')||'{}');validateMeta(metadata,approved);
  await env.BUCKET!.put(key,bytes,{httpMetadata:{contentType:type}});
  try{await db.insert(media).values({id:key,key,metadata,name:file.name.slice(0,180),type,bytes:bytes.length,alt:alt.slice(0,500),rights:rights.slice(0,2000),approved,uploaderId:user.id,createdAt:now()});}catch(e){await env.BUCKET!.delete(key);throw e;}
  await log(user.id,'media.upload',key);return ok({ok:true,url:'/api/files/'+key,id:key});
 }
 if(endpoint==='users'){
  await authorize('users');if(await authMode()==='local'){const session=await localSession(req.headers);if(!session||Date.now()-session.session.createdAt.getTime()>900000)throw new HttpError(403,'Für Benutzeränderungen bitte erneut anmelden.');}const input=z.object({email:z.string().email().transform(s=>s.toLowerCase()),name:z.string().min(2).max(120),role:z.enum(roles as [string,...string[]]),active:z.number().int().min(0).max(1)}).parse(await req.json());
  const previous=await db.select().from(users).where(eq(users.email,input.email)).get();
  if((input.role==='SYSTEM_ADMIN'||previous?.role==='SYSTEM_ADMIN')&&user.role!=='SYSTEM_ADMIN')throw new HttpError(403,'Nur die Systemadministration darf diese Rolle ändern.');
  if(previous?.id===user.id&&(input.active===0||input.role!==user.role))throw new HttpError(400,'Das eigene administrative Konto kann hier nicht gesperrt oder herabgestuft werden.');
  if(previous)await db.update(users).set(input).where(eq(users.id,previous.id));else await db.insert(users).values({...input,id:id(),createdAt:now()});const account=await db.select().from(users).where(eq(users.email,input.email)).get();if(account){if(!input.active)await db.delete(authSessions).where(eq(authSessions.userId,account.id));await db.update(authUsers).set({name:input.name,updatedAt:new Date()}).where(eq(authUsers.id,account.id));}await log(user.id,'user.upsert',input.email);return ok({ok:true});
 }
 if(endpoint==='settings'){
  await authorize('settings');const input=z.object({schoolName:z.string().min(2).max(150),address:z.string().max(250),phone:z.string().regex(/^[0-9 +()/\-]{4,40}$/),email:z.string().email(),primary:z.string().regex(/^#[0-9a-fA-F]{6}$/),accent:z.string().regex(/^#[0-9a-fA-F]{6}$/),royal:z.string().regex(/^#[0-9a-fA-F]{6}$/),footer:z.string().max(300),hero:z.boolean(),profile:z.boolean(),news:z.boolean(),events:z.boolean(),logo:z.string().max(200).refine(s=>!s||/^\/api\/files\/[\w-]+$/.test(s)),navigation:z.array(z.object({label:z.string().min(1).max(35),href:z.string().refine(s=>s.startsWith('/')&&validURL(s))})).max(6)}).parse(await req.json());
  throw new HttpError(409,'Bitte Einstellungen mit Entwurfsversion im Website-Designer unter /admin/design speichern.');
 }
 throw new HttpError(404,'Nicht gefunden.');
}
async function handle(req:Request,ctx:any){try{return await perform(req,ctx);}catch(e:any){if(e instanceof z.ZodError)return Response.json({error:e.issues.map((i:any)=>i.path.join('.')+': '+i.message).join(' · ')},{status:400});return Response.json({error:e instanceof HttpError?e.message:'Die Änderung konnte nicht gespeichert werden. Bitte prüfen Sie Ihre Eingaben.'},{status:e instanceof HttpError?e.status:500});}}
export const GET=handle;export const POST=handle;export const PATCH=handle;export const DELETE=handle;
