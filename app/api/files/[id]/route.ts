import {env} from 'cloudflare:workers';
import {eq} from 'drizzle-orm';
import {getDb} from '../../../../db';
import {media} from '../../../../db/schema';
import {currentUser,publicEntries,getSettings} from '../../../../lib/server';
export const dynamic='force-dynamic';
export async function GET(req:Request,ctx:{params:Promise<{id:string}>}){
 const {id}=await ctx.params;const item=await getDb().select().from(media).where(eq(media.id,id)).get();if(!item)return new Response('Nicht gefunden',{status:404});const editor=await currentUser();if(!editor){if(!item.approved)return new Response('Nicht gefunden',{status:404});const path='/api/files/'+id;const used=JSON.stringify(await getSettings()).includes(path)||(await publicEntries()).some(e=>JSON.stringify(e).includes(path));if(!used)return new Response('Nicht gefunden',{status:404});}
 const file=await env.BUCKET!.get(item.key);if(!file)return new Response('Nicht gefunden',{status:404});
 const name=item.name.replace(/[^a-zA-Z0-9._-]/g,'_');
 return new Response(file.body,{headers:{'Content-Type':item.type,'Content-Disposition':`${item.type==='application/pdf'?'attachment':'inline'}; filename="${name}"`,'X-Content-Type-Options':'nosniff','Cache-Control':'private, no-store','Content-Security-Policy':"default-src 'none'; sandbox",'ETag':file.httpEtag}});
}
