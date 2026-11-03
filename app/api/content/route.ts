import {publicEntries, getSettings} from '../../../lib/server';
import {expandEvents,makeICS} from '../../../lib/policy.mjs';
export const dynamic='force-dynamic';
export async function GET(req:Request){try{
 const url=new URL(req.url);let items=await publicEntries(url.searchParams.get('kind')||undefined);
 const q=(url.searchParams.get('q')||'').toLocaleLowerCase('de');if(q)items=items.filter(e=>(e.title+' '+e.body+' '+e.category).toLocaleLowerCase('de').includes(q));
 if(url.searchParams.get('format')==='ics')return new Response(makeICS(expandEvents(items.filter(e=>e.kind==='event'))),{headers:{'Content-Type':'text/calendar; charset=utf-8','Content-Disposition':'attachment; filename="wezelschule-termine.ics"','Cache-Control':'no-store'}});
 return Response.json({items,settings:await getSettings()},{headers:{'Cache-Control':'no-store'}});
}catch{return Response.json({error:'Die Inhalte konnten nicht geladen werden.'},{status:503});}}
