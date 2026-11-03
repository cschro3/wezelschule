import {requireChatGPTUser} from '../../chatgpt-auth';
import {authorize,requireCMSUser} from '../../../lib/server';
import Designer from './workspace';
export const dynamic='force-dynamic';
export const metadata={title:'Website-Designer'};
export default async function DesignPage(){await requireCMSUser('/admin/design');const user=await authorize('design');return <Designer user={user}/>;}
