import { env } from 'cloudflare:workers';
import {headers} from 'next/headers';
import {redirect} from 'next/navigation';
import {localSession,authMode} from './security/auth';
import { eq, and, desc, sql } from 'drizzle-orm';
import { getDb } from '../db';
import { users, entries, settings, audit, limits } from '../db/schema';
import { getChatGPTUser } from '../app/chatgpt-auth';
import { defaults } from './defaults';
import { seeds } from './seeds';
import { can, isVisible } from './policy.mjs';
import type { User, SiteSettings } from './types';
export class HttpError extends Error { constructor(public status:number, message:string){super(message);} }
export const now=()=>new Date().toISOString();
export const id=()=>crypto.randomUUID();
export async function log(actor:string,action:string,target:string){await getDb().insert(audit).values({id:id(),actorId:actor,action,target,createdAt:now()});}
export async function getSettings():Promise<SiteSettings>{const row=await getDb().select().from(settings).where(eq(settings.key,'site')).get();return row?{...defaults,...JSON.parse(row.value)}:defaults;}
export async function platformUser():Promise<User|null>{
 const identity=await getChatGPTUser();if(!identity)return null;
 const db=getDb();let user=await db.select().from(users).where(eq(users.identity,identity.userId)).get();
 if(!user){
  const invite=await db.select().from(users).where(eq(users.email,identity.email.toLowerCase())).get();
  if(invite){if(invite.identity && invite.identity!==identity.userId)throw new HttpError(403,'Kontozuordnung stimmt nicht überein.');await db.update(users).set({identity:identity.userId}).where(and(eq(users.id,invite.id),sql`${users.identity} IS NULL`));user=await db.select().from(users).where(eq(users.identity,identity.userId)).get();}
  else if(env.OWNER_EMAIL && identity.email.toLowerCase()===env.OWNER_EMAIL.toLowerCase()){
   const ownerCount=await db.select({n:sql<number>`count(*)`}).from(users).where(eq(users.role,'SYSTEM_ADMIN')).get();
   if(!ownerCount?.n){await db.insert(users).values({id:id(),identity:identity.userId,email:identity.email.toLowerCase(),name:identity.displayName,role:'SYSTEM_ADMIN',active:1,createdAt:now()}).onConflictDoNothing();user=await db.select().from(users).where(eq(users.identity,identity.userId)).get();}
  }
 }
 return user?.active?user as User:null;
}
export async function currentUser():Promise<User|null>{const local=await localSession(await headers());if(local)return local.user as User;if(await authMode()==='local')return null;return platformUser();}
export async function requireCMSUser(returnTo='/admin'){const user=await currentUser();if(!user){const safe=returnTo.startsWith('/admin')&&!returnTo.startsWith('//')?returnTo:'/admin';redirect('/login?returnTo='+encodeURIComponent(safe));}return user;}
export async function authorize(action='read'){
 const user=await currentUser();if(!user)throw new HttpError(401,'Bitte mit einem freigeschalteten Redaktionskonto anmelden.');if(!can(user.role,action))throw new HttpError(403,'Für diese Aktion fehlt die Berechtigung.');return user;
}
export async function initialize(user:User){
 if(user.role!=='SYSTEM_ADMIN')return;
 const db=getDb();const ready=await db.select().from(settings).where(eq(settings.key,'initialized')).get();if(ready)return;
 // Stable keys and conflict handling make initialization idempotent. No DDL at runtime.
 const t=now();await db.batch([
  db.insert(settings).values({key:'initialized',value:t,updatedAt:t}).onConflictDoNothing(),
  ...seeds.map(s=>db.insert(entries).values({...s,id:'source-'+s.slug,authorId:user.id,version:1,createdAt:t,updatedAt:t}).onConflictDoNothing()),
  db.insert(settings).values({key:'site',value:JSON.stringify(defaults),updatedAt:t}).onConflictDoNothing(),
  db.insert(settings).values({key:'initialized',value:t,updatedAt:t}).onConflictDoNothing(),
  db.insert(audit).values({id:id(),actorId:user.id,action:'source.initialize',target:'verified-source-inventory',createdAt:t})
 ]);
}
export async function publicEntries(kind?:string){const all=await getDb().select().from(entries).orderBy(desc(entries.updatedAt));return all.filter(e=>(!kind||e.kind===kind)&&isVisible(e)&&(e.kind!=='event'||e.visibility!=='internal')).map(({draft,draftStatus,authorId,...entry})=>({...entry,authorId:null}));}
export async function rateLimit(userId:string){
 const db=getDb(),w=Math.floor(Date.now()/60000),key=userId+'-'+w;
 const row=await db.insert(limits).values({key,count:1,window:w}).onConflictDoUpdate({target:limits.key,set:{count:sql`${limits.count}+1`}}).returning().get();
 if(row.count>90)throw new HttpError(429,'Zu viele Änderungen. Bitte kurz warten.');
 await db.delete(limits).where(sql`${limits.window}<${w-2}`);
}
