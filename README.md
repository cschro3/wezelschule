# WEZEL NEXT

Originalquellcode der digitalen Schulplattform der Staatlichen Regelschule „Johann Karl Wezel“ Östertal. Importiert aus dem bestehenden Projekt, einschließlich CMS, Website-Designer und der vorbereiteten Phase 3 für Login und Sicherheit.

## Aktueller Stand

Quellbasis: `a904cacc5a8151731d09b973b0c3400ddc54fd43` · 03.11.2026 · gespeicherte Sites-Version 8. Phase 3 ist vorbereitet und lokal geprüft, aber noch nicht auf der laufenden Website veröffentlicht oder aktiviert. Die GitHub-Übertragung verändert die bestehende Website nicht.

## Enthalten

- Öffentliche Seiten, responsive Navigation, Header/Footer, Nachrichten, Projekte, Termine und Downloads.
- Adminbereich, Mediathek, Seitenverwaltung, Freigaben, Versionierung und visueller Website-Designer.
- Worker/APIs, Rollenprüfung, Better Auth, Argon2id, Sitzungen, TOTP, Einladungen und Passwort-Reset.
- Drizzle/D1-Schema und drei additive Migrationen, Tests, GitHub-CI, Lockdatei, Designsystem und lokale Schriftarten.
- Snapshot des veröffentlichten Inhalts-/Designstands und übertragbare Logos; Ausnahmen siehe Transferbericht und Medienmanifest.

## Lokaler Einstieg

Node.js 24 und pnpm 11.25.0 verwenden:

```powershell
git clone https://github.com/cschro3/wezelschule.git
cd wezelschule
npm install --global pnpm@11.25.0
pnpm install --frozen-lockfile
pnpm exec tsc --noEmit
pnpm run build
Get-ChildItem drizzle/*.sql | Sort-Object Name | ForEach-Object {
  pnpm exec wrangler d1 execute DB --local --config dist/server/wrangler.json --persist-to .wrangler/state --file $_.FullName
}
pnpm run dev
```

Der portable Entwicklungsmodus verwendet standardmäßig `http://localhost:5173`; Admin: `http://localhost:5173/admin`. Eine leere lokale Datenbank enthält noch keine echten Benutzer oder gehosteten Uploads. Der Loopback-Entwicklungsmodus bietet ausschließlich lokal eine simulierte Plattformanmeldung an; sie ist kein Produktionslogin. Für den lokalen CMS-Erstzugang muss `OWNER_EMAIL` in einer unversionierten `.dev.vars` zur ausdrücklich lokalen Testidentität `seedy@sites.test` passen. Diese Testkonfiguration niemals in eine gehostete Umgebung übernehmen. `.env.example` dokumentiert die weiteren Laufzeitwerte; keine realen Geheimnisse committen.

Die gezeigten Befehle stammen aus den vorhandenen Projektwerkzeugen; ein tatsächlicher Windows-Browserlauf wird nicht behauptet. Für Datenübernahme, lokale Seeds und Rollout die Dokumentation lesen. Der vorhandene veröffentlichte Snapshot wird bewusst nicht automatisch in eine laufende Datenbank importiert.

## Architektur und Betriebsgrenzen

Vinext/React auf Cloudflare Workers mit D1 und R2. Dies ist der tatsächliche Full-Stack-Quellstand, keine Node-/PostgreSQL-Neuimplementierung. Der Entwicklungsserver ist für lokale Arbeit vorgesehen. Ein unabhängiger Produktivbetrieb erfordert D1-/R2-Bindings, sichere Auth-Konfiguration und einen getesteten Administratorzugang. Die bisherige Plattformidentität darf außerhalb des vertrauenswürdigen Sites-Proxys nicht ungeprüft akzeptiert werden.

Das öffentliche Repository enthält keine produktiven Benutzer, Secrets, Sessions oder unveröffentlichten Inhalte. Zwei historische Fotos mit ungeklärten Weitergaberechten und weitere zurückgestellte R2-Bilder fehlen bewusst; vorhandene Verweise sind dokumentiert. Öffentliche Repository-Sichtbarkeit ersetzt keine Rechtefreigabe für Schulmedien.

## Dokumentation

- [Übertragung, Umfang und Ausnahmen](docs/GITHUB-TRANSFER.md)
- [Datei- und Medienmanifest](exports/manifest.json)
- [Phase-3-Prüfbericht mit offenen Punkten](docs/PHASE3-PRUEFBERICHT.md)
- [Sicherer Login-Rollout und Wiederherstellung](docs/SECURITY-ROLLOUT.md)
- [Admin-Handbuch](docs/ADMIN-HANDBUCH.md)
- [Bereitstellung und Rollback](docs/DEPLOYMENT-UND-ROLLBACK.md)

Frühere Berichte bleiben als historische Nachweise erhalten; für den aktuellen Sicherheitsstand gelten der Phase-3-Bericht und `SECURITY-ROLLOUT.md`. Der GitHub-Workflow prüft den Code und veröffentlicht keine Website.
