import {eq} from 'drizzle-orm';
import {getDb} from '../../../db';
import {entries as table} from '../../../db/schema';
import {requireChatGPTUser} from '../../chatgpt-auth';
import {authorize,getSettings,publicEntries,requireCMSUser} from '../../../lib/server';
import {designState} from '../../../lib/design-store';
import {defaultDesign} from '../../../lib/design-model';
import {ownsOrEdits} from '../../../lib/policy.mjs';
import {notFound} from 'next/navigation';
import Preview from './preview-client';
export const dynamic='force-dynamic';
export const metadata={title:'Geschützte Vorschau',robots:{index:false,follow:false}};
export default async function PreviewPage({searchParams}:{searchParams:Promise<{design?:string;document?:string}>}){const params=await searchParams;const designMode=!!params.design||!params.document;const returnTo='/admin/preview'+(designMode?'?design=1':'?document='+encodeURIComponent(params.document!));await requireCMSUser(returnTo);const user=await authorize('read'),settings=await getSettings(),publicItems=await publicEntries();let design=defaultDesign(settings),page=null;
 if(designMode){await authorize('design');design=(await designState()).config;}
 if(params.document){const row=await getDb().select().from(table).where(eq(table.id,params.document)).get();if(!row||!ownsOrEdits(user,row))notFound();page={...row,...(row.draft?JSON.parse(row.draft):{}),id:row.id};}
 return <Preview initial={design} settings={settings} entries={publicItems} page={page} allowMessages={designMode}/>;}
