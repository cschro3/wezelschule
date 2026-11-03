import {SecurityError} from './request';
import {env} from 'cloudflare:workers';
export function mailReady(){return !!env.RESEND_API_KEY&&!!env.AUTH_EMAIL_FROM;}
export async function sendSecurityMail(to:string,subject:string,text:string){if(!mailReady())throw new SecurityError('Der sichere E-Mail-Versand ist noch nicht eingerichtet.');const response=await fetch('https://api.resend.com/emails',{method:'POST',headers:{Authorization:'Bearer '+env.RESEND_API_KEY,'Content-Type':'application/json'},signal:AbortSignal.timeout(10000),body:JSON.stringify({from:env.AUTH_EMAIL_FROM,to:[to],subject,text})});if(!response.ok)throw new SecurityError('Die Sicherheitsnachricht konnte nicht zugestellt werden.');}
