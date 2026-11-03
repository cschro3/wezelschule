import {eq,sql} from 'drizzle-orm';
import {getDb} from '../../db';
import {authRateLimits} from '../../db/auth-schema';
async function accountKey(email:string){return 'credential:'+Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(email.toLowerCase()))),b=>b.toString(16).padStart(2,'0')).join('');}
export async function accountLocked(email:string){const key=await accountKey(email),row=await getDb().select().from(authRateLimits).where(eq(authRateLimits.key,key)).get();return !!row&&Date.now()-row.lastRequest<900000&&row.count>=8;}
export async function recordPasswordAttempt(email:string,success:boolean){const key=await accountKey(email),db=getDb();if(success){await db.delete(authRateLimits).where(eq(authRateLimits.key,key));return;}const stamp=Date.now();await db.insert(authRateLimits).values({id:crypto.randomUUID(),key,count:1,lastRequest:stamp}).onConflictDoUpdate({target:authRateLimits.key,set:{count:sql`CASE WHEN ${authRateLimits.lastRequest}<${stamp-900000} THEN 1 ELSE ${authRateLimits.count}+1 END`,lastRequest:stamp}});}
