'use client';
export default function Error({reset}:{reset:()=>void}){return <main className="not-found"><h1>Ein kurzer Zwischenstopp.</h1><p>Die Inhalte konnten gerade nicht geladen werden.</p><button className="button" onClick={reset}>Erneut versuchen</button><a href="/">Zur Startseite</a></main>;}
