// Return a destination only after the current session was invalidated.
// Local/password-only installations do not have a ChatGPT sign-out route.
export async function logoutDestination(request:typeof fetch=fetch):Promise<string>{
  const status=await request('/api/security/status',{cache:'no-store'});
  if(!status.ok)throw Error('Die Anmeldung konnte nicht geprüft werden. Bitte erneut abmelden.');
  const state=await status.json() as {mode:unknown;configured:unknown}|null;
  if(!state||typeof state.mode!=='string'||!['local','platform','migration'].includes(state.mode)||typeof state.configured!=='boolean')throw Error('Die Anmeldeart konnte nicht geprüft werden.');
  const {mode,configured}=state;
  if(mode!=='local'&&!configured)return '/signout-with-chatgpt?return_to=%2Flogin';
  const response=await request('/api/auth/sign-out',{method:'POST',headers:{'Content-Type':'application/json','x-wezel-request':'cms'},body:'{}'});
  if(!response.ok)throw Error('Abmelden war nicht möglich. Bitte erneut versuchen.');
  return mode==='local'?'/login':'/signout-with-chatgpt?return_to=%2Flogin';
}
