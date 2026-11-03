import {env} from 'cloudflare:workers';
import {betterAuth,APIError} from 'better-auth';
import {drizzleAdapter} from '@better-auth/drizzle-adapter';
import {twoFactor} from 'better-auth/plugins';
import {eq} from 'drizzle-orm';
import {getDb} from '../../db';
import {users,audit,settings} from '../../db/schema';
import {authUsers,authSessions,authAccounts,authVerifications,authTwoFactors,authRateLimits} from '../../db/auth-schema';
import {hashPassword,verifyPassword} from './password';
import {sendSecurityMail} from './mail';
export const isAdmin=(role:string)=>role==='SYSTEM_ADMIN'||role==='SCHULADMIN';
export const authBaseURL=()=>env.AUTH_BASE_URL||'https://wezel-next.christoph-schr816017.chatgpt.site';
export const authReady=()=>!!env.BETTER_AUTH_SECRET&&env.BETTER_AUTH_SECRET.length>=32;
export async function authLog(actor:string|null,action:string){await getDb().insert(audit).values({id:crypto.randomUUID(),actorId:actor,action,target:'authentication',createdAt:new Date().toISOString()});}
export async function authMode(){if(env.AUTH_MODE==='platform')return 'platform';if(env.AUTH_MODE==='local')return 'local';const row=await getDb().select().from(settings).where(eq(settings.key,'auth-policy')).get();return row&&JSON.parse(row.value).mode==='local'?'local':'migration';}
export function createAuth(){if(!authReady())throw Error('Die Passwortanmeldung ist noch nicht konfiguriert.');return betterAuth({
 appName:'WEZEL NEXT',baseURL:authBaseURL(),basePath:'/api/auth',secret:env.BETTER_AUTH_SECRET!,trustedOrigins:[authBaseURL()],
 database:drizzleAdapter(getDb(),{provider:'sqlite',schema:{user:authUsers,session:authSessions,account:authAccounts,verification:authVerifications,twoFactor:authTwoFactors,rateLimit:authRateLimits},transaction:false}),
 user:{additionalFields:{username:{type:'string',required:false,input:false}},changeEmail:{enabled:false}},
 emailAndPassword:{enabled:true,disableSignUp:true,minPasswordLength:14,maxPasswordLength:128,autoSignIn:false,revokeSessionsOnPasswordReset:true,resetPasswordTokenExpiresIn:900,password:{hash:hashPassword,verify:verifyPassword},sendResetPassword:async({user,token})=>{await sendSecurityMail(user.email,'WEZEL NEXT – Passwort zurücksetzen','Setze dein Passwort innerhalb von 15 Minuten zurück:\n\n'+authBaseURL()+'/login?mode=reset#token='+token+'\n\nWenn du dies nicht angefordert hast, ignoriere die Nachricht.');},onPasswordReset:async({user})=>{await authLog(user.id,'auth.password.reset');}},
 session:{expiresIn:28800,updateAge:300,cookieCache:{enabled:false},additionalFields:{lastSeenAt:{type:'number',required:true,input:false,returned:false}}},
 rateLimit:{enabled:true,storage:'database',window:60,max:60,customRules:{'/sign-in/email':{window:300,max:5},'/request-password-reset':{window:900,max:3},'/two-factor/*':{window:300,max:5}}},
 advanced:{useSecureCookies:new URL(authBaseURL()).protocol==='https:',cookiePrefix:'wezel',defaultCookieAttributes:{httpOnly:true,sameSite:'lax',path:'/'},ipAddress:{ipAddressHeaders:['cf-connecting-ip']},database:{generateId:()=>crypto.randomUUID()}},
 databaseHooks:{session:{create:{before:async(session)=>{const user=await getDb().select().from(users).where(eq(users.id,session.userId)).get();if(!user?.active)throw new APIError('UNAUTHORIZED',{message:'Anmeldung nicht möglich.'});return {data:{...session,lastSeenAt:session.createdAt.getTime()}};},after:async(session)=>{await authLog(session.userId,'auth.session.created');}}}},
 plugins:[twoFactor({issuer:'WEZEL NEXT',skipVerificationOnEnable:false,totpOptions:{digits:6,period:30},backupCodeOptions:{amount:10,length:12}})],logger:{disabled:true},telemetry:{enabled:false}
});}
export async function localSession(headers:Headers,allowIncomplete=false){if(!authReady())return null;const result=await createAuth().api.getSession({headers,query:{disableCookieCache:true,disableRefresh:true}});if(!result)return null;const db=getDb(),row=await db.select().from(authSessions).where(eq(authSessions.id,result.session.id)).get(),cms=await db.select().from(users).where(eq(users.id,result.user.id)).get();const stamp=Date.now();if(!row||!cms?.active||stamp-row.createdAt.getTime()>28800000||stamp-row.lastSeenAt>1800000){if(row)await db.delete(authSessions).where(eq(authSessions.id,row.id));return null;}if(!allowIncomplete&&isAdmin(cms.role)&&!result.user.twoFactorEnabled)return null;if((!isAdmin(cms.role)||result.user.twoFactorEnabled)&&row.lastSeenAt===row.createdAt.getTime())await authLog(cms.id,'auth.login');await db.update(authSessions).set({lastSeenAt:stamp}).where(eq(authSessions.id,row.id));return {user:cms,authUser:result.user,session:row};}
