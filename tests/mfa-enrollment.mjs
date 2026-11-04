// Exercise the exact post-enable React subtree using a real local MFA response.
// Secrets stay in this process; only test names/results are written.
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {dirname,resolve,join} from 'node:path';
import {pathToFileURL} from 'node:url';
import {mkdir,mkdtemp,writeFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {randomBytes,createHash,createHmac} from 'node:crypto';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import LegacyQRCode from 'react-qr-code';
import {createLocalRuntime,OWNER} from '../scripts/local-runtime.mjs';
const require=createRequire(import.meta.url);
const {build}=require(require.resolve('esbuild',{paths:[dirname(require.resolve('vite'))]}));
await mkdir('tests/.generated/phase6',{recursive:true});
const output=resolve('tests/.generated/phase6/mfa-enrollment-component.mjs');
await build({entryPoints:['app/account/security/mfa-enrollment.tsx'],outfile:output,bundle:true,format:'esm',platform:'node',jsx:'automatic',external:['react','react/jsx-runtime','react-qr-code'],logLevel:'silent'});
const {default:MFAEnrollment}=await import(pathToFileURL(output).href);
const state=await mkdtemp(join(tmpdir(),'wezel-mfa-render-'));
const results=[],cookies=new Map(),origin='http://localhost:3000';
let runtime,setup,password;
const render=(data,extra={})=>renderToStaticMarkup(React.createElement(MFAEnrollment,{uri:data.totpURI,codes:data.backupCodes,saved:false,code:'',busy:false,onSaved(){},onCode(){},onVerify(){},...extra}));
async function check(name,fn){await fn();results.push({function:name,result:'passed'});console.log('PASS '+name);}
async function call(path,body){
  const r=await runtime.mf.dispatchFetch(origin+path,{method:body===undefined?'GET':'POST',headers:{Origin:origin,'x-wezel-request':'cms',Cookie:[...cookies].map(([k,v])=>k+'='+v).join('; '),...(body===undefined?{}:{'Content-Type':'application/json'})},...(body===undefined?{}:{body:JSON.stringify(body)})});
  for(const value of r.headers.getSetCookie()){const raw=value.split(';')[0],i=raw.indexOf('=');if(/max-age=0/i.test(value))cookies.delete(raw.slice(0,i));else cookies.set(raw.slice(0,i),raw.slice(i+1));}
  const data=await r.json();assert.equal(r.status,200,path+' request failed');return data;
}
function otp(secret){let bits='';const a='ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';for(const c of secret.replace(/=+$/,''))bits+=a.indexOf(c).toString(2).padStart(5,'0');const bytes=[];for(let i=0;i+8<=bits.length;i+=8)bytes.push(parseInt(bits.slice(i,i+8),2));const count=Buffer.alloc(8);count.writeBigUInt64BE(BigInt(Math.floor(Date.now()/30000)));const hash=createHmac('sha1',Buffer.from(bytes)).update(count).digest(),o=hash.at(-1)&15;return String((hash.readUInt32BE(o)&0x7fffffff)%1000000).padStart(6,'0');}
try{
  runtime=await createLocalRuntime({stateDirectory:state});
  await check('The original CommonJS default import reproduces the invalid React element error',async()=>{
    assert.throws(()=>renderToStaticMarkup(React.createElement(LegacyQRCode,{value:'synthetic-regression'})),/Element type is invalid/);
  });
  await check('An interrupted enrollment can be started again using the existing password and account',async()=>{
    password=randomBytes(30).toString('base64url');const token=randomBytes(32).toString('hex'),now=Date.now();
    await runtime.db.prepare('INSERT INTO auth_invitations(id,user_id,token_hash,created_by,created_at,expires_at) VALUES (?,?,?,?,?,?)').bind('mfa-render-invite',OWNER.id,createHash('sha256').update(token).digest('hex'),OWNER.id,now,now+86400000).run();
    await call('/api/security/accept-invitation',{token,password});await call('/api/auth/sign-in/email',{email:OWNER.email,password});
    const interrupted=await call('/api/auth/two-factor/enable',{password});
    assert.equal((await call('/api/security/status')).user.mfa,false);
    setup=await call('/api/auth/two-factor/enable',{password});assert.equal(setup.backupCodes.length,10);assert.notEqual(setup.totpURI,interrupted.totpURI);
    assert.equal((await runtime.db.prepare('SELECT COUNT(*) AS n FROM auth_users').first()).n,1);
  });
  await check('The real pending MFA response renders an inline QR, ten recovery codes and the confirmation form',async()=>{
    const html=render(setup);assert(html.includes('<svg'));assert(html.includes('<title>Authenticator-Einrichtung</title>'));assert.equal((html.match(/<li>/g)||[]).length,10);assert(html.includes('pattern="[0-9]{6}"'));assert(html.includes('Manuell einrichten'));assert(!html.includes('Ein kurzer Zwischenstopp.'));assert(!/<(?:img|iframe|script)\b/.test(html));
  });
  await check('Confirmation stays disabled until recovery codes are saved and is disabled during submission',async()=>{
    assert(/<button[^>]*disabled/.test(render(setup)));assert(!/<button[^>]*disabled/.test(render(setup,{saved:true})));assert(/<button[^>]*disabled/.test(render(setup,{saved:true,busy:true})));
  });
  await check('Successful TOTP verification grants CMS access without weakening the previous MFA gate',async()=>{
    const headers={Cookie:[...cookies].map(([k,v])=>k+'='+v).join('; ')};
    assert.equal((await runtime.mf.dispatchFetch(origin+'/api/admin/overview',{headers})).status,401);
    await call('/api/auth/two-factor/verify-totp',{code:otp(new URL(setup.totpURI).searchParams.get('secret')),trustDevice:false});
    assert.equal((await call('/api/security/status')).user.mfa,true);
    const after={Cookie:[...cookies].map(([k,v])=>k+'='+v).join('; ')};
    for(const path of ['/admin','/admin/design','/admin/calendar/import'])assert.equal((await runtime.mf.dispatchFetch(origin+path,{headers:after})).status,200,path);
  });
}catch(error){results.push({function:'MFA rendering integration',result:'failed',error:error.name});console.error('MFA rendering integration failed:',error.name);process.exitCode=1;}
finally{if(runtime)await runtime.dispose();await rm(state,{recursive:true,force:true});await writeFile('tests/.generated/phase6/mfa-render.json',JSON.stringify({timestamp:new Date().toISOString(),platform:process.platform,node:process.version,scope:'actual React setup subtree and actual local API; no browser claim',results},null,2)+'\n');}
