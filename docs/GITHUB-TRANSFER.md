# GitHub-Übertragung – 03.11.2026

Ziel: `https://github.com/cschro3/wezelschule`, Branch `main`.

## Herkunft und Umfang

Originalquellstand des bestehenden Sites-Projekts: `a904cacc5a8151731d09b973b0c3400ddc54fd43` (gespeicherte Version 8, Phase 3). Keine Nachbildung und kein statischer HTML-Export. Enthalten sind öffentliche React-Seiten, CMS/Admin, Website-Designer, Authentifizierung, Worker/API-Routen, Drizzle-Schema, drei versionierte SQL-Migrationen, Tests, Lockdatei, lokale Schriftarten samt Lizenzen und Betriebsdokumentation.

Alle übernommenen Originaldateien bleiben bytegleich. Die ursprüngliche README liegt zusätzlich unter `docs/history/README-SITES-BEFORE-GITHUB.md`; die neue README erklärt den aktuellen Stand. Die Ausnahme sind zwei hier nicht mitveröffentlichte Bilddateien; deren Quellpfade und Gründe stehen im Exportmanifest. An der ursprünglichen Arbeitskopie und der gehosteten Anwendung wurde nichts verändert.

Der Import übernimmt einen geprüften Dateisnapshot, nicht die gesamte bisherige Git-Historie. Das zuvor leere GitHub-Repository erhält eine neue nachvollziehbare Importhistorie. Es enthält keine automatische Site-Veröffentlichung; der GitHub-Workflow führt nur Prüfungen aus.

## Veröffentlichte Inhalte und Medien

`exports/published/content.json` enthält einen frisch gelesenen Snapshot der veröffentlichten Seiten, Dokumentverweise und zentralen Designkonfiguration. Autoren-IDs wurden entfernt. Die Datei ist eine transportable Sicherung und wird nicht als zweite aktive Einstellungsquelle eingebunden.

Die dort referenzierten und für den Export übernommenen Logos werden mit Originaldatei, ursprünglicher `/api/files/...`-Adresse, Dateigröße und SHA-256 im Medienmanifest dokumentiert. Die Ablage im Repository stellt keine R2-Wiederherstellung dar: Die Dateiroute benötigt zusätzlich ihren Datenbankeintrag und ein R2-Objekt. Nach einem Hostingumzug müssen die Dateien über die Mediathek eingebunden und die Logo-/Bildzuordnungen im Designer gesetzt oder autorisiert aus einer gesicherten DB/R2-Migration wiederhergestellt werden.

Das Repository ist öffentlich. Die beiden historischen Außenfotos `public/school/nschu01.jpg` und `public/school/nschu02.jpg` sind laut vorhandener Herkunftsdatei ausschließlich für interne Abnahme vorgesehen; sie werden nicht in dieses öffentliche Repository aufgenommen. Weitere Gebäude- und Personenbilder sowie Grafiken aus R2 werden ohne nachgewiesene öffentliche Weitergabefreigabe ebenfalls zurückgestellt. Pfade bleiben im Originalcode erhalten und sind in einer frischen Kopie bis zur separaten Übernahme nicht verfügbar. Es werden keine Ersatzfotos erfunden. Die vorhandene Site behält alle Bilder unverändert.

Öffentliche PDF-Downloads bleiben Verweise auf die offiziellen Dokumentquellen. Sie wurden nicht ungeprüft als neue Kopien veröffentlicht.

## Bewusste Ausschlüsse

- Keine echte Benutzer-/Schülerdatenbank, Passworthashes, Sessions, TOTP-Geheimnisse, Einladungs- oder Reset-Tokens.
- Keine Laufzeitgeheimnisse, `.dev.vars`, echten `.env`-Werte, privaten Schlüssel oder Quellrepository-Zugangstokens.
- Keine internen Entwürfe, unveröffentlichten Medien, Revisions-/Auditdaten oder vollständigen D1-/R2-Dumps.
- Keine generierten Builddateien, `node_modules`, Testlaufdatenbanken oder lokalen Werkzeugzustände.

Für einen vollständigen Betriebsumzug ist eine getrennte, verschlüsselte, berechtigte D1-/R2-Sicherung nötig. Diese gehört nicht in ein öffentliches Git-Repository. Benutzerkonten und sichere Wiederherstellungswege müssen dabei erhalten bleiben.

## Prüfstand und Grenzen

Am Originalquellstand bestanden Installation, TypeScript, Build, 16 Modell-/Rechte-/Brandingtests, 23 Worker-Sicherheitsszenarien, 23 CMS-/Designer-Szenarien sowie 29 Seiten-/Vorschaurenderprüfungen. Details und reale Einschränkungen: `docs/PHASE3-PRUEFBERICHT.md`. Diese Ergebnisse sind bestehende Prüfergebnisse des Originalstands, keine Behauptung eines neuen GitHub-Actions-Laufs.

Der Transfer prüft Dateiintegrität und Ausschlüsse anhand von Git-Blob-Hashes und SHA-256. Das Manifest enthält den vollständigen übertragenen Dateibestand, ausgenommen seine eigene Prüfsumme. Eine spätere CI-Ausführung auf GitHub ist separat zu bewerten.

Phase 3 ist noch nicht in der laufenden Site aktiviert. Echte E-Mail-Zustellung, persönliche Administratorübernahme, MFA mit dem echten Konto und Browser-Abnahme sind weiterhin offen. Der bisherige Plattformzugang bleibt in der Migrationsphase erhalten. Es wurde weder eine Site neu angelegt noch eine Domain geändert oder eine Datenbankmigration auf der laufenden Site ausgeführt.

## Stack und externe Abhängigkeiten

React/TypeScript mit Vinext und Cloudflare Workers, Drizzle/D1 und R2. Keine Prisma-/PostgreSQL- oder Railway-Portierung. Die Anmeldung nutzt während der Migration weiterhin die bestätigte Sites-Identität; ein Betrieb außerhalb dieses Vertrauensproxies erfordert die im Security-Rollout beschriebene sichere Übernahme und lokale Authentifizierung. Ein normaler ungeschützter Node-Webserver ersetzt diesen Proxy nicht.

`.openai/hosting.json` bewahrt die bestehende Projekt-ID und Bindings. Die ID ist kein Zugangsschlüssel und autorisiert keine Veröffentlichung. `AUTH_BASE_URL`, `BETTER_AUTH_SECRET`, `OWNER_EMAIL` und die Resend-Konfiguration werden separat im Zielbetrieb gesetzt. Die `.env.example` enthält ausschließlich Erklärungen und leere Geheimniswerte.
