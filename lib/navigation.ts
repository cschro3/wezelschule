import type {Entry} from './types';

export const submenus=[
 [{label:'Schulprofil',href:'/unsere-schule',text:'Das macht uns aus'},{label:'Leitbild',href:'/leitbild',text:'Was uns verbindet'},{label:'Unser Schulgebäude',href:'/schulgebaeude',text:'Ein erster Einblick'}],
 [{label:'Digitales Lernen',href:'/digitales-lernen',text:'Wissen neu entdecken'},{label:'Individuelle Förderung',href:'/individuelle-foerderung',text:'Jeder Lernweg zählt'},{label:'Berufsorientierung',href:'/berufsorientierung',text:'Den eigenen Weg finden'}],
 [{label:'Aktuelles',href:'/aktuelles',text:'Nachrichten der Schule'},{label:'Projekte',href:'/projekte',text:'Gemeinsam etwas bewegen'},{label:'Termine',href:'/termine',text:'Was als Nächstes kommt'},{label:'Schulsozialarbeit',href:'/schulsozialarbeit',text:'Ein offenes Ohr'}],
 [{label:'Downloads & Anmeldung',href:'/downloads',text:'Formulare an einem Ort'},{label:'Wichtige Links',href:'/service',text:'Direkt zum richtigen Angebot'},{label:'Kontakt',href:'/kontakt',text:'So erreichen Sie uns'}]
];
export function entryHref(e:Entry){return e.kind==='news'?'/aktuelles/'+e.slug:e.kind==='event'?'/termine/'+e.slug:e.kind==='project'?'/projekte/'+e.slug:'/'+e.slug;}
