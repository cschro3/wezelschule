'use client';

export default function WorkspaceWidth({wide,onChange}:{wide:boolean;onChange:(wide:boolean)=>void}){
  return <button type="button" className="small-button workspace-width-toggle" aria-pressed={wide} onClick={()=>onChange(!wide)}>
    <span aria-hidden="true">↔</span> {wide?'Navigation einblenden':'Mehr Arbeitsfläche'}
  </button>;
}
