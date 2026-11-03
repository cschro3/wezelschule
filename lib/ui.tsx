import {ArrowUpRight,ArrowRight,CalendarDays,FileDown,Phone,Mail,MapPin,Menu,Search,X,ChevronDown,GraduationCap,BookOpen,Users,Compass,Sparkles,ArrowLeft,Monitor,Shield,Check,Plus,ExternalLink,FileText,Image as ImageIcon,Settings,LogOut,LayoutDashboard,Newspaper,Layers,Folder,UserRound,Eye,Save,Clock,Accessibility,ChevronLeft,ChevronRight} from 'lucide-react';
export const icons:Record<string,any>={arrow:ArrowUpRight,right:ArrowRight,calendar:CalendarDays,download:FileDown,contact:Phone,mail:Mail,pin:MapPin,menu:Menu,search:Search,close:X,down:ChevronDown,school:GraduationCap,book:BookOpen,users:Users,compass:Compass,spark:Sparkles,back:ArrowLeft,plan:Monitor,shield:Shield,check:Check,plus:Plus,external:ExternalLink,file:FileText,image:ImageIcon,settings:Settings,logout:LogOut,dashboard:LayoutDashboard,news:Newspaper,pages:Layers,folder:Folder,user:UserRound,eye:Eye,save:Save,clock:Clock,access:Accessibility,left:ChevronLeft,next:ChevronRight};
export function Icon({name,size=20,...props}:{name:string;size?:number;[key:string]:any}){const I=icons[name]??ArrowUpRight;return <I size={size} strokeWidth={1.6} aria-hidden="true" {...props}/>;}
export function Tag({children}:{children:React.ReactNode}){return <span className="tag">{children}</span>;}
export function LinkButton({href,children,light=false}:{href:string;children:React.ReactNode;light?:boolean}){return <a className={'button '+(light?'button-light':'')} href={href}>{children}<Icon name="arrow" size={18}/></a>;}
export function RichText({text}:{text:string}){
 function inline(t:string){return t.split(/(\*\*.*?\*\*|\[.*?\]\((?:https:\/\/[^\s)]+|\/(?!\/)[^\s)]*)\))/g).map((s,i)=>{
  if(s.startsWith('**')&&s.endsWith('**'))return <strong key={i}>{s.slice(2,-2)}</strong>;
  const m=s.match(/^\[(.*?)\]\((.*?)\)$/);if(m&&!/[\\]/.test(m[2]))return <a href={m[2]} key={i} rel="noreferrer">{m[1]}</a>;return s;
 });}
 return <div className="richtext">{text.split(/\n\n+/).map((p,i)=>p.startsWith('## ')?<h2 key={i}>{inline(p.slice(3))}</h2>:p.startsWith('- ')?<ul key={i}>{p.split('\n').map((s,j)=><li key={j}>{inline(s.replace(/^- /,''))}</li>)}</ul>:<p key={i}>{inline(p)}</p>)}</div>;
}
export function Empty({title,text,icon='news'}:{title:string;text:string;icon?:string}){return <div className="empty"><span className="empty-icon"><Icon name={icon} size={28}/></span><h3>{title}</h3><p>{text}</p></div>;}
export function formatDate(d:string,opts:Intl.DateTimeFormatOptions={day:'2-digit',month:'long',year:'numeric'}){return new Intl.DateTimeFormat('de-DE',{...opts,timeZone:'Europe/Berlin'}).format(new Date(d));}
