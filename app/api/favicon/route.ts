import {getSettings} from '../../../lib/server';
import {defaultDesign} from '../../../lib/design-model';
import {env} from 'cloudflare:workers';
import {getDb} from '../../../db';
import {media} from '../../../db/schema';
import {eq} from 'drizzle-orm';
export const dynamic='force-dynamic';
export async function GET(){const logo=defaultDesign(await getSettings()).brand.favicon;if(logo.startsWith('/api/files/')){const m=await getDb().select().from(media).where(eq(media.id,logo.split('/').at(-1)!)).get();if(m?.approved&&m.type.startsWith('image/')){const f=await env.BUCKET!.get(m.key);if(f)return new Response(f.body,{headers:{'Content-Type':m.type,'Cache-Control':'no-cache','X-Content-Type-Options':'nosniff'}});}}return new Response(null,{status:307,headers:{Location:'/favicon.svg','Cache-Control':'no-cache'}});}
