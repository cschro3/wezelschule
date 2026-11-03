import {requireCMSUser,getSettings} from '../../../../lib/server';
import CalendarWorkspace from '../workspace';
export const dynamic='force-dynamic';
export default async function Page(){const user=await requireCMSUser('/admin/calendar/import');return <CalendarWorkspace user={user} settings={await getSettings()} initialImport/>;}
