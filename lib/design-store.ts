import {env} from 'cloudflare:workers';
import {eq,desc} from 'drizzle-orm';
import {getDb} from '../db';
import {settings,designDrafts,designHistory,media} from '../db/schema';
import {defaultDesign,designSchema,contrastIssues,type Design} from './design-model';
import {getSettings,HttpError,id,now,log,publicEntries} from './server';
import type {User} from './types';
import {can} from './policy.mjs';
export async function designState(){const db=getDb();const live=await getSettings(),row=await db.select().from(settings).where(eq(settings.key,'site')).get(),draft=await db.select().from(designDrafts).where(eq(designDrafts.id,'site')).get();return {live:defaultDesign(live),publishedVersion:row?.version??1,version:draft?.version??0,baseVersion:draft?.baseVersion??row?.version??1,state:draft?.state??'draft',config:draft?designSchema.parse(JSON.parse(draft.payload)):defaultDesign(live),history:await db.select().from(designHistory).orderBy(desc(designHistory.version)).limit(30)};}
export async function saveDesign(user:User,input:{config?:unknown;version:number;baseVersion:number}){
 if(!can(user.role,'design'))throw new HttpError(403,'Keine Berechtigung für den Website-Designer.');
 const config=designSchema.parse(input.config),state=await designState(),db=getDb();
 if(state.version!==input.version||state.publishedVersion!==input.baseVersion)throw new HttpError(409,'Der Entwurf oder die veröffentlichte Version wurde zwischenzeitlich geändert. Bitte neu laden.');
 const stamp=now();await db.insert(designHistory).values({id:'baseline-'+state.publishedVersion,version:state.publishedVersion,snapshot:JSON.stringify(state.live),actorId:user.id,createdAt:stamp}).onConflictDoNothing();
 const values={payload:JSON.stringify(config),version:state.version+1,baseVersion:input.baseVersion,state:'draft',actorId:user.id,updatedAt:stamp};
 const changed=state.version?await db.update(designDrafts).set(values).where(eq(designDrafts.version,state.version)).returning().get():await db.insert(designDrafts).values({id:'site',...values}).onConflictDoNothing().returning().get();
 if(!changed)throw new HttpError(409,'Dieser Entwurf wurde parallel gespeichert.');await log(user.id,'design.save','draft:'+changed.version);return designState();
}
export async function assertAssetsApproved(config:unknown){
 const refs=new Map<string,string>();const visit=(v:any,key='')=>{if(typeof v==='string'&&v.startsWith('/api/files/'))refs.set(v.split('/').at(-1)!,key);else if(Array.isArray(v))v.forEach(x=>visit(x,key));else if(v&&typeof v==='object')Object.entries(v).forEach(([k,x])=>visit(x,k));};visit(config);
 for(const [ref,key] of refs){const m=await getDb().select().from(media).where(eq(media.id,ref)).get();if(!m?.approved)throw new HttpError(400,'Alle verwendeten Medien müssen zuerst freigegeben werden.');if(['logo','darkLogo','mobileLogo','favicon','image','mobileImage'].includes(key)&&!m.type.startsWith('image/'))throw new HttpError(400,'Logos und Bilder benötigen eine Bilddatei.');if(key==='video'&&!m.type.startsWith('video/'))throw new HttpError(400,'Der Videobereich benötigt eine Videodatei.');const meta=m.metadata?JSON.parse(m.metadata):{};if(meta.studentImage&&!meta.consent)throw new HttpError(400,'Für Schülerbilder fehlt der dokumentierte Freigabenachweis.');}
}
export async function assertPublishedLinks(config:unknown,extra:string[]=[]){
 const known=new Set(['/','/aktuelles','/termine','/projekte','/schulleben','/service','/downloads','/formulare','/kontakt','/schulgebaeude','/vertretungsplan','/impressum','/datenschutz','/barrierefreiheit','/schule/leitbild','/schueler/schulsozialarbeit','/service/downloads','/service/vertretungsplan','/service/wichtige-links','/lernen/digitales-lernen',...extra]);
 for(const e of await publicEntries())known.add(e.kind==='page'?'/'+e.slug:e.kind==='news'?'/aktuelles/'+e.slug:e.kind==='project'?'/projekte/'+e.slug:e.kind==='event'?'/termine/'+e.slug:'/downloads');
 const missing=new Set<string>();const visit=(v:any)=>{if(!v||typeof v!=='object')return;if(v.hidden||v.visible===false||v.desktop===false&&v.mobile===false)return;if(typeof v.href==='string'&&v.href.startsWith('/')&&!v.href.startsWith('/api/files/')){const path=v.href.split(/[?#]/)[0].replace(/\/$/,'')||'/';if(!known.has(path))missing.add(path);}if(Array.isArray(v))v.forEach(visit);else Object.values(v).forEach(visit);};visit(config);if(missing.size)throw new HttpError(400,'Interne Linkziele sind noch nicht veröffentlicht: '+[...missing].join(', '));
}
export async function designAction(user:User,input:{action:string;version:number;baseVersion:number;revisionId?:string}){
 if(!can(user.role,'design'))throw new HttpError(403,'Designer-Zugriff fehlt.');const state=await designState(),db=getDb();
 if(state.version!==input.version||state.publishedVersion!==input.baseVersion)throw new HttpError(409,'Zwischenzeitliche Änderungen gefunden. Bitte neu laden.');
 const key='site',stamp=now();
 if(input.action==='restore'){
  if(!can(user.role,'settings'))throw new HttpError(403,'Wiederherstellung nur durch die Administration.');
  const revision=await db.select().from(designHistory).where(eq(designHistory.id,input.revisionId??'')).get();if(!revision)throw new HttpError(404,'Version nicht gefunden.');return saveDesign(user,{config:JSON.parse(revision.snapshot),version:state.version,baseVersion:state.publishedVersion});
 }
 if(input.action==='discard')return saveDesign(user,{config:state.live,version:state.version,baseVersion:state.publishedVersion});
 if(input.action==='publish'){
  if(!can(user.role,'publish'))throw new HttpError(403,'Nur Schul- und Systemadministration dürfen veröffentlichen.');
  if(state.state!=='approved')throw new HttpError(400,'Den gespeicherten Entwurf zuerst freigeben.');
  const bad=contrastIssues(state.config).filter(x=>!x.aa);if(bad.length)throw new HttpError(400,'Kontrast unter 4,5:1: '+bad.map(x=>x.label).join(', '));
  await assertAssetsApproved(state.config);await assertPublishedLinks(state.config);
  const liveSettings=await getSettings(),d=state.config,version=state.publishedVersion+1,rev=id();
  const next={...liveSettings,design:d,schoolName:d.brand.name,logo:d.brand.logo,primary:d.theme.primary,accent:d.theme.accent,royal:d.theme.secondary,footer:d.footer.name,address:d.footer.address,phone:d.footer.phone,email:d.footer.email,navigation:d.navigation.filter(n=>!n.hidden).map(n=>({label:n.label,href:n.href}))};
  const result=await env.DB!.batch([
   env.DB!.prepare('INSERT INTO design_history (id,version,snapshot,actor_id,created_at) SELECT ?,?,?,?,? FROM settings s JOIN design_drafts d ON d.id=? WHERE s.key=? AND s.version=? AND d.version=? AND d.state=? ON CONFLICT(version) DO NOTHING').bind(rev,version,JSON.stringify(d),user.id,stamp,key,key,state.publishedVersion,state.version,'approved'),
   env.DB!.prepare('UPDATE settings SET value=?,version=?,updated_at=? WHERE key=? AND version=? AND EXISTS(SELECT 1 FROM design_history WHERE id=?)').bind(JSON.stringify(next),version,stamp,key,state.publishedVersion,rev),
   env.DB!.prepare('UPDATE design_drafts SET base_version=?,version=version+1,state=?,updated_at=?,actor_id=? WHERE id=? AND version=? AND EXISTS(SELECT 1 FROM design_history WHERE id=?)').bind(version,'published',stamp,user.id,key,state.version,rev),
   env.DB!.prepare('INSERT INTO audit (id,actor_id,action,target,created_at) SELECT ?,?,?,?,? WHERE EXISTS(SELECT 1 FROM design_history WHERE id=?)').bind(id(),user.id,'design.publish','version:'+version,stamp,rev)
  ]);if(!result[0].meta.changes)throw new HttpError(409,'Veröffentlichung wegen paralleler Änderung abgebrochen.');
 }else{
  const next=input.action==='review'?'review':input.action==='approve'?'approved':null;if(!next)throw new HttpError(400,'Unbekannte Aktion.');
  if(next==='approved'&&!can(user.role,'publish'))throw new HttpError(403,'Freigabe nur durch die Administration.');
  if(!state.version)throw new HttpError(400,'Den Entwurf zuerst speichern.');
  const changed=await db.update(designDrafts).set({state:next,version:state.version+1,actorId:user.id,updatedAt:stamp}).where(eq(designDrafts.version,state.version)).returning().get();if(!changed)throw new HttpError(409,'Entwurf wurde zwischenzeitlich geändert.');await log(user.id,'design.'+next,'draft:'+changed.version);
 }
 return designState();
}
