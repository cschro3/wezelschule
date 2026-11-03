import {getSettings} from '../../../lib/server';
import SecurityPanel from './panel';
export const dynamic='force-dynamic';
export const metadata={title:'Kontosicherheit',robots:{index:false,follow:false}};
export default async function AccountSecurity(){return <SecurityPanel settings={await getSettings()}/>;}
