import {getSettings} from '../../lib/server';
import {authMode} from '../../lib/security/auth';
import LoginScreen from './screen';
export const dynamic='force-dynamic';
export const metadata={title:'Anmelden · WEZEL NEXT',robots:{index:false,follow:false}};
export default async function Login({searchParams}:{searchParams:Promise<{mode?:string;returnTo?:string}>}){const p=await searchParams;const returnTo=p.returnTo?.startsWith('/admin')&&!p.returnTo.includes('\\')?p.returnTo:'/admin';return <LoginScreen settings={await getSettings()} mode={p.mode??'login'} returnTo={returnTo} allowPlatform={await authMode()!=='local'}/>;}
