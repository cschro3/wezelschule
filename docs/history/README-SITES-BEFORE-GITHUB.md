# WEZEL NEXT

Private, isolierte Entwicklungs- und Abnahmeumgebung für die Wezelschule Östertal in Sondershausen. Die bestehende Schulwebsite und die offizielle Domain werden nicht verändert.

## Start und Architektur

Node.js 24, pnpm 11.25.0. `pnpm install --frozen-lockfile`, `pnpm run build`. Der App-Router läuft mit Vinext auf der Sites/Cloudflare-Worker-Infrastruktur. React, TypeScript, lokales CSS-Designsystem, Drizzle/D1 für Inhalte und R2 für Uploads. Dies ist eine bewusste Abweichung vom bevorzugten Next.js-Node/PostgreSQL/Prisma/Railway-Stack; kein PostgreSQL oder Prisma ist angebunden. Für den öffentlichen Schulbetrieb bleibt diese Entscheidung mit Schulträger/Datenschutz und Betrieb zu klären.

Migrationsdateien in `drizzle/` sind versioniert und enthalten ausschließlich Schemaänderungen. `.openai/hosting.json` bindet `DB` und `BUCKET`. Sites provisioniert die isolierten Ressourcen. Die Inhalte werden nach der ersten autorisierten Systemadmin-Anmeldung idempotent aus `lib/seeds.ts` importiert. Die vorhandenen Datenbanken anderer Projekte bleiben unberührt.

## Anmeldung

Geschützter Einstieg `/admin`, Anmeldung über ChatGPT. `OWNER_EMAIL` als Runtime-Secret legt ausschließlich den ersten Systemadmin fest. Kein öffentliches Self-Service-Admin-Setup, kein Standardpasswort, keine selbst entwickelte Passwort- oder OAuth-Verwaltung. Weitere Konten werden nach E-Mail vorgemerkt und beim ersten Besuch dauerhaft an ihre vom Hosting bestätigte Identität gebunden. Privater Website-Zugang und redaktionelle Rolle sind separate Prüfungen.

Lokale `.dev.vars` bleiben unversioniert. Testidentitäten werden ausschließlich durch die Testumgebung injiziert. Testfixtures niemals in die gehostete Datenbank importieren. Der Hosting-Proxy muss eigene Identitätsheader der Besucher entfernen und bestätigte Identitätsheader setzen; direkter öffentlicher Zugriff auf den Origin ist nicht vorgesehen.

## Checks

- `pnpm exec tsc --noEmit`
- `node --test tests/policy.test.mjs tests/design-model.test.mjs`
- `pnpm run build`
- `node tests/integration.mjs`: reale Route-Handler mit lokal emulierter D1-/R2-Infrastruktur; ausschließlich die Identitätsumgebung wird im Test gebunden. Isolierter Datenpfad `.sites-runtime/test-data`.
- `node tests/persistence.mjs write` und danach in einem neuen Prozess `node tests/persistence.mjs read`.

Die GitHub-Actions-Datei ist vorbereitet. Ein neues GitHub-Repository konnte mit den verfügbaren Werkzeugen nicht angelegt werden; die Quelle wird im Git-Repository des Sites-Projekts versioniert. Eine GitHub-CI-Ausführung wird nicht behauptet.

## Dokumentation

- `docs/ADMIN-HANDBUCH.md`
- `docs/DEPLOYMENT-UND-ROLLBACK.md`
- `docs/TEST-UND-SICHERHEITSBERICHT.md`
- `docs/ABNAHME.md`
- `docs/content-inventory.json`
- `docs/migration-matrix.csv`

Externe Dokumente bleiben Links auf die offizielle Quelle. Keine Schulnachrichten oder Termine erfunden. Fehlende Seiteninhalte liegen intern als Entwürfe. Schriftarten werden lokal mit OFL-Lizenzen ausgeliefert. Außenfotos sind nur für die private Abnahme übernommen; die öffentliche Nutzung benötigt noch Rechtebestätigung.

## Phase 2 – Website-Designer

`/admin/design` ergänzt die vorhandene Redaktion. Das gespeicherte Live-Design liegt ausschließlich im bestehenden `settings`-Datensatz `site`; Arbeitsstände stehen in `design_drafts`, veröffentlichte Versionen in `design_history`. Keine parallele aktive Konfiguration. Die vorhandenen Einträge erhalten `blocks`, `draft` und `draft_status`, Medien erhalten JSON-Metadaten. `settings.version` und die vorhandenen Eintrags-/Medienversionen sichern konkurrierende Änderungen ab.

Neue Migration: `0001_condemned_rumiko_fujikawa.sql`. Ausschließlich additive Tabellen/Spalten, keine Löschungen oder Backfills. Die frühere Quelle bleibt als gespeicherte Sites-Version und vor Phase 2 als Git-Bundle/Datensnapshot samt Datei gesichert.

`node tests/integration.mjs` startet jetzt die gemeinsame Suite `tests/designer-integration.mjs`; der alte Testablauf, in dem Redakteure selbst veröffentlichen durften, wurde an die ausdrücklich verlangte Administrationsfreigabe angepasst. `tests/render-pages.mjs` prüft zusätzlich geschützte Vorschauen mit lokalen Testidentitäten. Dies ersetzt keinen realen OAuth-Browserlogin.
