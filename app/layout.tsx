import type {Metadata} from 'next';
import './globals.css';
import {getSettings} from '../lib/server';
import {defaultDesign,designStyle} from '../lib/design-model';
export const metadata:Metadata={metadataBase:new URL('https://wezel-next.christoph-schr816017.chatgpt.site'),title:{default:'Wezelschule Östertal · Deine Zukunft. Unsere Schule.',template:'%s · Wezelschule Östertal'},description:'Die Wezelschule Östertal in Sondershausen. Lernen, Schulleben und Service.',robots:{index:false,follow:false},icons:{icon:'/api/favicon'},openGraph:{locale:'de_DE',type:'website',title:'Wezelschule Östertal',description:'Entdecken. Lernen. Gemeinsam wachsen.'}};
export default async function RootLayout({children}:{children:React.ReactNode}){const s=await getSettings();return <html lang="de"><body style={designStyle(defaultDesign(s)) as React.CSSProperties}>{children}</body></html>;}
