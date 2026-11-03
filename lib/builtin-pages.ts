import {blockSchema} from './design-model';
import type {Entry} from './types';

// The original page is retained until an administrator publishes its CMS copy.
export const schoolBuilding={
 slug:'schulgebaeude',label:'Schulgebäude',category:'Ein erster Einblick',
 title:'Hier beginnt dein Weg.',excerpt:'Die Wezelschule Östertal in Sondershausen.',
 images:[{src:'/school/nschu01.jpg',alt:'Außenansicht der Wezelschule Östertal'},{src:'/school/nschu02.jpg',alt:'Weitere Außenansicht der Wezelschule Östertal'}],
 caption:'Vorhandene Aufnahmen der Schulwebsite. Historisches Bildmaterial · Bildrechte zur öffentlichen Nutzung noch zu bestätigen.',
 heading:'Ein Ort im Östertal.',address:'Segelteichstraße 36 · 99706 Sondershausen',
 text:'Weitere Innenaufnahmen oder ein virtueller Rundgang können nach Freigabe geeigneter Originalbilder ergänzt werden.'
};
export type BuiltinPage={label:string;slug:string;entry:Partial<Entry>};
export function builtinPageTemplates(existing:Pick<Entry,'kind'|'slug'>[]):BuiltinPage[]{
 if(existing.some(e=>e.kind==='page'&&e.slug===schoolBuilding.slug))return [];
 const p=schoolBuilding;
 const gallery=blockSchema.parse({id:'school-building-gallery',type:'gallery',title:'',text:p.caption,padding:0,columns:2,lightbox:true,items:p.images.map((x,i)=>({id:'school-building-image-'+i,title:x.alt,image:x.src,alt:x.alt}))});
 const text=blockSchema.parse({id:'school-building-text',type:'text',title:p.heading,text:p.address+'\n\n'+p.text,padding:28});
 return [{label:p.label,slug:p.slug,entry:{kind:'page',slug:p.slug,title:p.title,excerpt:p.excerpt,category:p.category,body:'',status:'draft',rights:0,blocks:JSON.stringify([gallery,text]),seoTitle:p.label}}];
}
