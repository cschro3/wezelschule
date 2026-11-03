import {SaxesParser} from 'saxes';
const tags=new Set(['svg','g','path','rect','circle','ellipse','line','polyline','polygon','title','desc','defs','linearGradient','radialGradient','stop','text','tspan','clipPath']);
const attrs=new Set(['xmlns','viewBox','width','height','x','y','x1','x2','y1','y2','cx','cy','r','rx','ry','d','points','fill','stroke','stroke-width','stroke-linecap','stroke-linejoin','stroke-miterlimit','fill-rule','clip-rule','opacity','fill-opacity','stroke-opacity','transform','id','offset','stop-color','stop-opacity','gradientUnits','gradientTransform','fx','fy','font-size','font-family','font-weight','text-anchor','clip-path','preserveAspectRatio','role','aria-label']);
const esc=(s:string)=>s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
export function sanitizeSVG(source:string){
 if(source.length>256000||/<!DOCTYPE|<!ENTITY/i.test(source))throw Error('SVG mit Dokumenttyp oder Entitäten ist nicht erlaubt.');
 let output='',count=0,root=false;const parser=new SaxesParser({xmlns:false});
 parser.on('error',e=>{throw e;});parser.on('processinginstruction',()=>{throw Error('SVG-Verarbeitungsanweisungen sind nicht erlaubt.');});
 parser.on('opentag',node=>{if(!tags.has(node.name)||++count>5000)throw Error('Nicht unterstütztes SVG-Element: '+node.name);if(!root){if(node.name!=='svg')throw Error('SVG-Wurzelelement fehlt.');root=true;}output+='<'+node.name;for(const [name,val] of Object.entries(node.attributes)){const value=String(val);if(!attrs.has(name)||/^on/i.test(name)||/[\u0000-\u0008]/.test(value))throw Error('Nicht erlaubtes SVG-Attribut: '+name);if(name==='xmlns'&&value!=='http://www.w3.org/2000/svg')throw Error('Ungültiger SVG-Namensraum.');if(/(?:url\s*\(|https?:|data:|javascript:|@import)/i.test(value)&&!(name==='xmlns'||/^url\(#[a-zA-Z0-9_-]+\)$/.test(value)))throw Error('Externe SVG-Verweise sind nicht erlaubt.');output+=' '+name+'="'+esc(value)+'"';}output+='>';});
 parser.on('text',t=>{output+=esc(t);});parser.on('cdata',t=>{output+=esc(t);});parser.on('closetag',node=>{output+='</'+node.name+'>';});parser.write(source).close();if(!root)throw Error('Keine SVG-Datei.');return output;
}
