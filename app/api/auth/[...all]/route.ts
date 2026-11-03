import {accountLocked,recordPasswordAttempt} from '../../../../lib/security/throttle';
import {eq} from 'drizzle-orm';
import {readSecurityJSON} from '../../../../lib/security/request';
import {mailReady} from '../../../../lib/security/mail';
import {getDb} from '../../../../db';
import {authUsers} from '../../../../db/auth-schema';
import {createAuth,authReady,localSession,isAdmin,authLog,authBaseURL} from '../../../../lib/security/auth';
export const dynamic='force-dynamic';
const allowed=new Set(['sign-in/email','sign-out','get-session','request-password-reset','reset-password','change-password','list-sessions','revoke-session','revoke-sessions','revoke-other-sessions','two-factor/enable','two-factor/disable','two-factor/get-totp-uri','two-factor/verify-totp','two-factor/verify-backup-code','two-factor/generate-backup-codes']);
async function performAuth(req:Request,ctx:{params:Promise<{all:string[]}>}){const path=(await ctx.params).all.join('/');let attemptedEmail='';if(!allowed.has(path))return Response.json({error:'Nicht gefunden.'},{status:404});if(!authReady())return Response.json({error:'Die Passwortanmeldung ist noch nicht eingerichtet. Bitte die Schuladministration kontaktieren.'},{status:503});
 if(req.method!=='GET'&&(req.headers.get('origin')!==new URL(authBaseURL()).origin||req.headers.get('x-wezel-request')!=='cms'))return Response.json({error:'Ungültige Anfrageherkunft.'},{status:403});
 if(req.method==='POST'){let body:any;try{body=await readSecurityJSON(req);}catch{return Response.json({error:'Ungültige oder zu große Anfrage.'},{status:400});}if(path==='request-password-reset'&&!mailReady())return Response.json({error:'Der E-Mail-Versand ist noch nicht eingerichtet. Bitte die Schuladministration kontaktieren.'},{status:503});
  if(path==='sign-in/email'){const identifier=String(body.email||'').trim().toLowerCase();if(!identifier.includes('@')){const found=await getDb().select({email:authUsers.email}).from(authUsers).where(eq(authUsers.username,identifier)).get();body.email=found?.email??'unavailable@invalid.invalid';}else body.email=identifier;attemptedEmail=body.email;if(await accountLocked(attemptedEmail))return Response.json({error:'Zu viele fehlgeschlagene Anmeldungen. Bitte in 15 Minuten erneut versuchen.'},{status:429,headers:{'Retry-After':'900'}});}
  if(path==='change-password')body.revokeOtherSessions=true;
  if(path==='two-factor/disable'){const current=await localSession(req.headers);if(!current||isAdmin(current.user.role))return Response.json({error:'MFA ist für Administratoren verpflichtend.'},{status:403});}
  req=new Request(req.url,{method:'POST',headers:req.headers,body:JSON.stringify(body)});
 }
 const response=await createAuth().handler(req);if(attemptedEmail&&(response.ok||response.status===401))await recordPasswordAttempt(attemptedEmail,response.ok);if(path==='sign-in/email'&&!response.ok)await authLog(null,'auth.login.failed');if(path==='sign-out'&&response.ok)await authLog(null,'auth.logout');if(['two-factor/verify-totp','two-factor/verify-backup-code'].includes(path)&&response.ok)await authLog(null,'auth.mfa.verified');let secured:Response;if(response.headers.get('content-type')?.includes('application/json')){const data=await response.clone().json();const strip=(v:any):any=>Array.isArray(v)?v.map(strip):v&&typeof v==='object'?Object.fromEntries(Object.entries(v).filter(([k])=>k!=='token').map(([k,x])=>[k,strip(x)])):v;secured=new Response(JSON.stringify(strip(data)),response);}else secured=new Response(response.body,response);secured.headers.set('Cache-Control','private, no-store');return secured;
}
export async function handle(req:Request,ctx:any){try{return await performAuth(req,ctx);}catch{return Response.json({error:'Die Anmeldung ist momentan nicht verfügbar. Bitte erneut versuchen oder die Administration kontaktieren.'},{status:503,headers:{'Cache-Control':'no-store'}});}}
export const GET=handle;export const POST=handle;
