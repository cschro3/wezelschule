export const roles = ['SYSTEM_ADMIN','SCHULADMIN','REDAKTEUR','AUTOR'];
export const kinds = ['page','news','event','project','document'];
export function can(role, action) {
 if (role === 'SYSTEM_ADMIN') return true;
 if (role === 'SCHULADMIN') return action !== 'system';
 if (role === 'REDAKTEUR') return ['read','write','media','design'].includes(action);
 if (role === 'AUTOR') return ['read','write','media'].includes(action);
 return false;
}
export function isVisible(entry, now = new Date().toISOString()) {
 return entry.status === 'published' && !!entry.rights && (!entry.publishAt || entry.publishAt <= now);
}
export function ownsOrEdits(user, entry) { return user.role !== 'AUTOR' || entry.authorId === user.id; }
export function validOrigin(origin, expected) { try { return new URL(origin).origin === new URL(expected).origin; } catch {return false;} }
export function validURL(s) { if (!s) return true; if(s.startsWith('/') && !s.startsWith('//') && !/[\\\r\n]/.test(s))return true;try{return new URL(s).protocol === 'https:';}catch{return false;} }
function berlinParts(date){const p=new Intl.DateTimeFormat('en-GB',{timeZone:'Europe/Berlin',year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',second:'2-digit',hourCycle:'h23'}).formatToParts(date);return Object.fromEntries(p.filter(x=>x.type!=='literal').map(x=>[x.type,+x.value]));}
function localEpoch(p){return Date.UTC(p.year,p.month-1,p.day,p.hour,p.minute,p.second);}
function berlinInstant(local){let guess=local;for(let i=0;i<3;i++){const diff=localEpoch(berlinParts(new Date(guess)))-local;if(!diff)break;guess-=diff;}return guess;}
export function expandEvents(items) {
 const out=[];
 for(const item of items){
  if(!item.startsAt)continue;
  const start=new Date(item.startsAt),end=item.endsAt?new Date(item.endsAt):null,p=berlinParts(start);
  const count=item.recurrence==='none'?1:Math.min(item.recurrenceCount||1,52);
  for(let i=0;i<count;i++){
   const d=new Date(localEpoch(p));
   if(item.recurrence==='weekly')d.setUTCDate(d.getUTCDate()+7*i);
   if(item.recurrence==='monthly'){d.setUTCDate(1);d.setUTCMonth(d.getUTCMonth()+i);const days=new Date(Date.UTC(d.getUTCFullYear(),d.getUTCMonth()+1,0)).getUTCDate();d.setUTCDate(Math.min(p.day,days));}
   const instant=i?berlinInstant(d.getTime()):start.getTime(),e=end?new Date(instant+end.getTime()-start.getTime()):null;
   out.push({...item,occurrence:i,startsAt:new Date(instant).toISOString(),endsAt:e?.toISOString()??null});
  }
 }
 return out.sort((a,b)=>a.startsAt.localeCompare(b.startsAt));
}
export function icsEscape(t) { return String(t??'').replace(/\\/g,'\\\\').replace(/\r?\n/g,'\\n').replace(/,/g,'\\,').replace(/;/g,'\\;'); }
export function makeICS(items, stamp=new Date().toISOString()){
 const date=s=>s.replace(/[-:]/g,'').replace(/\.\d{3}/,'');
 return ['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//WEZEL NEXT//Schulkalender//DE',...items.flatMap(x=>['BEGIN:VEVENT',`UID:${x.id}-${x.occurrence??0}@wezel-next`,`DTSTAMP:${date(stamp)}`,`DTSTART:${date(x.startsAt)}`,...(x.endsAt?[`DTEND:${date(x.endsAt)}`]:[]),`SUMMARY:${icsEscape(x.title)}`,`LOCATION:${icsEscape(x.location)}`,'END:VEVENT']),'END:VCALENDAR',''].map(line=>{let out='',bytes=0;for(const char of line){const n=new TextEncoder().encode(char).length;if(bytes+n>74){out+='\r\n ';bytes=1;}out+=char;bytes+=n;}return out;}).join('\r\n');
}
export function fileType(bytes) {
 if(bytes[0]===0xff&&bytes[1]===0xd8&&bytes[2]===0xff)return 'image/jpeg';
 if(bytes[0]===0x89&&String.fromCharCode(...bytes.slice(1,4))==='PNG')return 'image/png';
 if(String.fromCharCode(...bytes.slice(0,4))==='RIFF'&&String.fromCharCode(...bytes.slice(8,12))==='WEBP')return 'image/webp';
 if(String.fromCharCode(...bytes.slice(0,5))==='%PDF-')return 'application/pdf';
 return null;
}
