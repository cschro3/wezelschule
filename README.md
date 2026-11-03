# WEZEL NEXT

Bestehende Schulplattform der Staatlichen Regelschule „Johann Karl Wezel“ Östertal. React/TypeScript und Vinext auf Cloudflare Workers, Drizzle/D1 und R2.

## Stand

Phase 3 (gespeicherte Version 8, Quellbasis a904cacc5a8151731d09b973b0c3400ddc54fd43) bleibt der sichere Ausgangspunkt. Phase 4 ergänzt die vorhandene Veranstaltungsverwaltung. Die gemeinsame Folgeversion wird ohne Deployment gespeichert. Die aktive private Website, Datenbank, Benutzer und Domain bleiben unverändert. Eine Bereitstellung benötigt die ausdrückliche Freigabe des Eigentümers.

## Funktionen

CMS, Mediathek, Website-Designer, zentrale Logo-Konfiguration, Entwürfe, Freigaben und Versionierung. Phase 3 enthält Better Auth, Argon2id, TOTP-MFA, sichere Sitzungen, Einladungen und Passwort-Reset. Der Plattformzugang bleibt bis zur geprüften und ausdrücklich aktivierten Administratorübernahme erhalten.

Kalender: /admin/calendar · Import: /admin/calendar/import · Öffentlich: /termine · ICS: /api/calendar. XLSX, CSV und ICS werden mit Zuordnung, Vorschau, Auswahl und Duplikaterkennung verarbeitet. Neue Termine beginnen als Entwurf oder zur Freigabe. Interne Termine werden nie öffentlich ausgegeben. Öffentliche ICS-Quellen können bewusst aktiviert und manuell als Vorschau abgerufen werden. Keine automatische Synchronisierung oder Veröffentlichung.

## Entwicklung und Prüfungen

Node.js 24, pnpm 11.25.0:

```sh
pnpm install --frozen-lockfile
pnpm exec tsc --noEmit
pnpm run build
node --test tests/policy.test.mjs tests/design-model.test.mjs tests/branding-render.test.mjs tests/calendar.test.mjs
node tests/security-integration.mjs
node tests/calendar-integration.mjs
node tests/integration.mjs
node tests/render-pages.mjs
node tests/calendar-persistence.mjs write
node tests/calendar-persistence.mjs read
```

Der portable Entwicklungsmodus startet mit pnpm run dev auf Port 5173. Lokale Migrationen in Dateireihenfolge mit wrangler d1 execute DB --local --config dist/server/wrangler.json --persist-to .wrangler/state --file drizzle/DATEI.sql anwenden. Testfixtures und lokale Anmeldesimulation niemals in eine gehostete Datenbank übernehmen. Echte Benutzer und Uploads liegen in D1/R2, nicht automatisch in Git.

Ein unabhängiger öffentlicher Betrieb erfordert korrekte D1/R2-Bindings, sichere Auth-Konfiguration und die geprüfte Administratorübernahme. Außerhalb des vertrauenswürdigen Sites-Proxys niemals fremde Identitätsheader akzeptieren. Keine Prisma-/PostgreSQL-/Railway-Portierung. Geheimnisse separat konfigurieren; .env.example enthält keine realen Zugangsdaten.

Worker-Tests verwenden isolierte D1/R2-Bindings. E-Mail- und externe ICS-Transporttests verwenden kontrollierte Testantworten. Persönliche Administratorübernahme, echte Mailzustellung und visuelle Mobile-Abnahme sind davon getrennt. GitHub Actions prüft den Code und deployt keine Website.

## Dokumentation

- [Abschließender Freigabebericht und Ablaufplan](docs/FINAL-RELEASE-READINESS.md)

- [Gemeinsamer Prüfbericht Phase 3 und 4](docs/PHASE4-PRUEFBERICHT.md)
- [Kalender-Handbuch und Formatgrenzen](docs/KALENDER-HANDBUCH.md)
- [Sicherer Login-Rollout und Wiederherstellung](docs/SECURITY-ROLLOUT.md)
- [Admin-Handbuch](docs/ADMIN-HANDBUCH.md)
- [Bereitstellung und Rollback](docs/DEPLOYMENT-UND-ROLLBACK.md)

Frühere Berichte bleiben historische Nachweise. Bildrechte, Rechtsangaben und Inhalte benötigen weiterhin eine redaktionelle Freigabe. Schulferien und Veranstaltungen werden nicht erfunden.
