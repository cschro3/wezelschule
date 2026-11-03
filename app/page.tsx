import {getSettings,publicEntries} from '../lib/server';
import {defaultDesign} from '../lib/design-model';
import {Header,Footer} from './shell';
import {BlockRenderer} from './block-renderer';
export const dynamic='force-dynamic';
export default async function Home(){const [settings,entries]=await Promise.all([getSettings(),publicEntries()]);const design=defaultDesign(settings);return <><Header settings={settings}/><main id="main"><BlockRenderer blocks={design.blocks} design={design} entries={entries}/></main><Footer settings={settings}/></>;}
