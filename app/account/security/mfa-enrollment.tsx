'use client';
import {Component,type ReactNode} from 'react';
import QRCodeModule from 'react-qr-code';

// The published CommonJS package exposes its React component under `default`.
// Some ESM bundlers return that exports object as the default import instead.
const QRCode = (QRCodeModule as unknown as {default?:typeof QRCodeModule}).default ?? QRCodeModule;

class QRBoundary extends Component<{children:ReactNode},{failed:boolean}> {
  state={failed:false};
  static getDerivedStateFromError(){return {failed:true};}
  render(){return this.state.failed
    ? <p role="alert">Der QR-Code konnte nicht angezeigt werden. Nutze unten „Manuell einrichten“; deine Wiederherstellungscodes bleiben verfügbar.</p>
    : this.props.children;}
}

export type MFAEnrollmentProps={
  uri:string;codes:string[];saved:boolean;code:string;busy:boolean;
  onSaved:(value:boolean)=>void;onCode:(value:string)=>void;onVerify:()=>void;
};

export default function MFAEnrollment({uri,codes,saved,code,busy,onSaved,onCode,onVerify}:MFAEnrollmentProps){
  return <>
    <h3>1. Mit deiner Authenticator-App scannen</h3>
    <div className="auth-qr"><QRBoundary key={uri}><QRCode value={uri} size={192} title="Authenticator-Einrichtung"/></QRBoundary></div>
    <details><summary>Manuell einrichten</summary><code className="security-secret">{uri}</code></details>
    <h3>2. Wiederherstellungscodes sicher aufbewahren</h3>
    <p>Jeder Code kann einmal verwendet werden. Bewahre die Codes getrennt vom Passwort auf.</p>
    <ul className="recovery-codes">{codes.map(c=><li key={c}><code>{c}</code></li>)}</ul>
    <label className="checkbox-label"><input type="checkbox" checked={saved} onChange={e=>onSaved(e.target.checked)}/> Ich habe die Codes sicher aufbewahrt.</label>
    <form onSubmit={e=>{e.preventDefault();onVerify();}}>
      <label>3. Sechsstelligen Code bestätigen<input required inputMode="numeric" pattern="[0-9]{6}" autoComplete="one-time-code" value={code} onChange={e=>onCode(e.target.value)}/></label>
      <button className="button" disabled={busy||!saved}>MFA aktivieren</button>
    </form>
  </>;
}
