import {publicEntries} from '../../../lib/server';
import {calendarICS} from '../../../lib/calendar-model';
export const dynamic='force-dynamic';
export async function GET(req:Request){try{const url=new URL(req.url);let items=await publicEntries('event');const id=url.searchParams.get('id');if(id)items=items.filter(e=>e.id===id);if(id&&!items.length)return new Response('Nicht gefunden',{status:404});return new Response(calendarICS(items),{headers:{'Content-Type':'text/calendar; charset=utf-8','Content-Disposition':`attachment; filename="wezel-${id?'termin':'kalender'}.ics"`,'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});}catch{return new Response('Kalender derzeit nicht verfügbar',{status:503});}}
