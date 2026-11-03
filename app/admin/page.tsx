import {requireChatGPTUser} from '../chatgpt-auth';
import {currentUser,initialize,requireCMSUser} from '../../lib/server';
import AdminClient from './workspace';
export const dynamic='force-dynamic';
export const metadata={title:'Redaktion',robots:{index:false,follow:false}};
export default async function Admin(){await requireCMSUser('/admin');const user=await currentUser();if(!user)return <main className="not-found"><h1>Geschützter<br/>Redaktionsbereich.</h1><p>Ihr Konto ist noch nicht für die Redaktion freigeschaltet. Die Schuladministration kann die Berechtigung vergeben.</p><a href="/" className="button">Zur Website</a></main>;await initialize(user);return <AdminClient/>;}
