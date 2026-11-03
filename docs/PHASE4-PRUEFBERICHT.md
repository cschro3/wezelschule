# WEZEL NEXT – Gemeinsamer Prüfbericht Phase 3 und Phase 4

Stand: 03.11.2026. Ausgangspunkt ist die gespeicherte Version 8, Quellcommit `a904cacc5a8151731d09b973b0c3400ddc54fd43`. Die neue Folgeversion ist zur Speicherung **ohne Deployment** vorbereitet. Ihre tatsächlich vergebene Versionsnummer wird bei der Übergabe genannt. Die laufende private Site, D1-/R2-Daten, bestehende Benutzer, Veröffentlichungen und Domain wurden nicht verändert.

## Ergebnis

**130 automatisierte Prüfszenarien bestehen**, dazu TypeScript und ein vollständiger Worker-/Frontend-Build. Die Produktionsabhängigkeitsprüfung meldet null Schwachstellen. Die verpflichtende visuelle iPhone-/iPad-Abnahme ist **nicht abgeschlossen**: Der verwaltete Vorschauprozess meldet `http://terminal.local:4173/`, aber der Cloud-Browser erhält `ERR_CONNECTION_REFUSED`. Die Oberfläche wurde deshalb nicht als visuell abgenommen erklärt. Es wurde kein anderer Server, keine abweichende Netzwerkroute und kein öffentliches Deployment als Umgehung angelegt.

Die Phase-3-Prüfung lief erneut gegen den gemeinsamen kompilierten Worker. Passwortlogin, TOTP, Einmal-Wiederherstellungscodes, Passwort-Reset, Sitzungsentzug und serverseitige Rollenprüfungen bestehen in der isolierten Testumgebung. Kalender-APIs werden zusätzlich vor vollständiger MFA-Anmeldung abgewiesen und danach zugelassen. Redakteure dürfen importieren, aber weder Quellen administrieren noch veröffentlichen.

Echte Mailzustellung, persönliche Administratorübernahme, MFA mit dem tatsächlichen Eigentümerkonto und die Live-Umschaltung bleiben wie in Phase 3 offen. Diese Schritte wurden weder simuliert als erledigt gemeldet noch an der laufenden Site ausgelöst.

## Tatsächlich implementiert

- Vorhandene Veranstaltungsnavigation führt zur integrierten Kalenderverwaltung `/admin/calendar`; Import unter `/admin/calendar/import`.
- Fünf Schritte: Dateiauswahl, Arbeitsblatt/Spaltenzuordnung, Validierung, Vorschau/Auswahl/Bearbeitung und ausdrückliche Speicherbestätigung mit tatsächlichem Importbericht.
- XLSX einschließlich Arbeitsblattauswahl und formatierter Datum-/Uhrzeitserien; CSV mit gebräuchlichen Trennzeichen/Codierungen; UTF-8-ICS. Kopierter Tabelleninhalt kann eingefügt werden.
- Europe/Berlin als Standard, UTC für entsprechende ICS-Daten; Ganztage und mehrtägige Termine mit exklusivem internem Ende, Behandlung ungültiger Zeitumstellungszeiten.
- Duplikatprüfung über externe UID oder Titel/Beginn/Ort; Dateihash-Warnung bei wiederholtem Upload; Überspringen, geprüfte Aktualisierung mit erhaltener ID oder ausdrücklich als neu übernehmen.
- Import schreibt ausschließlich Entwürfe beziehungsweise Einreichungen zur Freigabe. Änderungen an bestehenden Einträgen liegen zunächst im vorhandenen Entwurfsfeld. Die bestehende Freigabe-/Veröffentlichungsprüfung wird wiederverwendet.
- Atomare D1-Batches für Import, Versionierung, Zeilenprotokoll und Audit. Versionswächter innerhalb des Batches und eindeutige Importzeilen verhindern mehrfaches Anwenden desselben Vorgangs. Einmal abgeschlossene Aufrufe liefern den gespeicherten Bericht.
- Monats-, Wochen- und Listenansicht, Suche, Kategorien-/Zielgruppenfilter, Einzeltermine, Bearbeitung, Archivierung, Detailansicht und Einzeltermin-Download.
- Bearbeitbare Kategorien, getrennte Typen für Veranstaltungen/Ferien/Feiertage; keine erfundenen Ferien- oder Veranstaltungsdaten.
- Öffentlicher ICS-Feed `/api/calendar`; vorhandener ICS-Export bleibt kompatibel. Interne oder nicht freigegebene Termine sind in öffentlichen Seiten, Detailrouten, Inhalts-API und beiden Feeds ausgeschlossen.
- Öffentliche ICS-Quellen mit bewusster Aktivierung und manuellem Abruf als neue Vorschau. Kein automatischer Schreib-/Publikationsweg. Gespeicherte Quelladressen werden in der Übersicht nur als Host ausgegeben.
- Das vorhandene Systemadmin-CMS-Backup enthält zusätzlich die vier Kalendertabellen. Es ist kein vollständiger Auth-/R2-Betriebsbackup und wird auch nicht so bezeichnet.

## Datenbankmigration und Erhalt

`drizzle/0003_worried_invisible_woman.sql`, inklusive Drizzle-Snapshot und Journal:

- Zusätzliche Ereignisfelder in `entries`: `all_day`, `time_zone`, `audience`, `visibility`, `rrule`, `external_id`, `calendar_source_id` und UID-Index.
- Neue Tabellen: `calendar_categories`, `calendar_sources`, `calendar_imports`, `calendar_import_rows`.
- Neun Kategorienamen als Ausgangspunkt. Keine echten Termine, keine Benutzer, keine Passwortdaten.
- Ausschließlich neue Tabellen/Spalten/Indizes und Kategorieeinträge, kein DROP, Reset oder Überschreiben bestehender Termine.

Die Migration wurde ausschließlich in isolierten lokalen Datenbanken ausgeführt. Ein vor der neuen Migration angelegter bestehender Termin behält ID, Inhalt und Version; drei bestehende Testkonten bleiben erhalten. Der Quellstand vor Phase 4 wurde zusätzlich als Git-Bundle gesichert. Ein produktiver D1-/R2-Dump wurde nicht erzeugt oder in Git übertragen.

Vor späterem Rollout: vollständige verschlüsselte D1-/R2-Sicherung und Wiederherstellungsweg durch den Betrieb prüfen. Code-Rollback auf die bisherige gespeicherte Version ist vorgesehen; additive Kalendertabellen bleiben dabei bestehen. Keine ungeprüfte Rückmigration und kein Löschen importierter Bestandsdaten.

## Pflichtprüfungen Phase 4

| Nr. | Prüfung | Tatsächliches Ergebnis |
|---|---|---|
| 1 | Excel importieren | Bestanden: echte ZIP-/OOXML-Datei, zwei Blätter, Auswahl nur des zweiten Blatts, persistierter Termin; zusätzlich Datums-/Zeitserien und 1904-System geprüft. |
| 2 | CSV importieren | Bestanden: Upload, manuelle/automatische Zuordnung, Auswahl und tatsächliche Speicherung. |
| 3 | ICS importieren | Bestanden: UID, Berlin/UTC, Ganztag, Beschreibung und RRULE als ein kanonischer Serientermin. |
| 4 | Unterschiedliche Datumsformate | Bestanden: ISO und deutsches Format; unmögliche Daten, falsche Uhrzeiten und DST-Lücken/-Mehrdeutigkeiten abgewiesen. |
| 5 | Ganztage | Bestanden: lokaler Tagesbeginn und korrektes exklusives Ende, auch ICS ohne DTEND. |
| 6 | Mehrtägige Termine | Bestanden: Projektwoche gespeichert, einschließlich/exklusive Endkonvention sowie Überschneidung eines Zeitfensters geprüft. |
| 7 | Wiederholungen | Bestanden: Tag/Woche/Monat/Jahr, COUNT/BYDAY, Berlin-Zeit über Sommerzeitwechsel; bestehende Monatsend-Berechnung bleibt erhalten. |
| 8 | Duplikate | Bestanden: gleiche Datei, UID, Titel/Zeit/Ort, doppelte Zeilen, ausdrückliches Überspringen und Aktualisieren; keine zweite Anwendung eines parallelen Vorgangs. |
| 9 | Einzelne Termine abwählen | Bestanden: zwei von drei Zeilen gespeichert, die dritte im tatsächlichen Bericht abgewählt. |
| 10 | Fehlerhafte Datensätze | Bestanden: Daten-/Formelfehler, unbekannte Wiederholungsteile, fehlende Bestätigung und Publikationsversuch zurückgewiesen. |
| 11 | Dauerhaft speichern | Bestanden: D1-Einträge, Importbericht, Versionsverlauf und Audit überprüft. |
| 12 | Nach Neuladen/Neustart | Bestanden: erneut gelesener Bericht und zwei getrennte Node-Prozesse; beide gespeicherten Termine erhalten, öffentlicher Feed weiterhin korrekt eingeschränkt. |
| 13 | Öffentliche Sichtbarkeit | Bestanden: Entwurf → Freigegeben → Veröffentlicht über tatsächliche CMS-API; veröffentlichte Fassung und ICS kontrolliert. |
| 14 | Interne Termine schützen | Bestanden: intern markierter veröffentlichter Termin fehlt in Inhalts-API, Kalenderfeed, altem Feed und direkter Detailroute; Einzel-ICS liefert 404. |
| 15 | iPhone/iPad | Offen: responsive Gestaltung implementiert, Browser-Vorschau nicht erreichbar. Keine Screenshot-/Touch-Abnahme behauptet. |
| 16 | Bestehende Termine erhalten | Bestanden: vor Migration angelegter Termin und bestehende Benutzer nach allen Importoperationen unverändert geprüft. |

## Prüfsummen der Tests

| Suite | Ergebnis |
|---|---|
| Modelle, Rollen, Branding und Importformate | 31/31 |
| Phase-3-Worker-Sicherheit inklusive neuer Kalender-Zugriffsprüfungen | 23/23 |
| Kalender-/Import-Integration gegen kompilierten Worker | 22/22 |
| Bestehendes CMS/Website-Designer einschließlich erweitertem Backup | 23/23 |
| Öffentliche/geschützte Seiten und Schulgebäude-Übernahme | 29/29 |
| Kalenderpersistenz in getrennten Prozessen | 2/2 |
| TypeScript und Worker-/Frontend-Build | Bestanden |
| Produktionsabhängigkeiten | 0 gemeldete Schwachstellen |

Maschinenlesbare Zusammenfassung: `docs/verification/phase4-results.json`. Die Import-/Auth-Prüfungen verwendeten den tatsächlichen kompilierten Worker und lokale D1-/R2-Ressourcen. Nur Plattform-Testidentitäten und externe E-Mail-/ICS-Transportantworten wurden kontrolliert bereitgestellt. Es wurden weder echte Provider-Konten noch produktive Anmeldedaten verwendet. Erfolgreiche Transportprüfungen sind kein Nachweis realer E-Mail-Zustellung oder eines Abrufs eines Nutzerkalenders bei Google/Microsoft.

Zusätzlich wurde ein realer SQLite-Triggerfehler im zweiten Datensatz eines Import-Batches ausgelöst: Der erste Datensatz, alle Zeilenprotokolle und der Abschluss wurden nachweislich vollständig zurückgerollt. Stale-Versionen und parallele Wiederholungen wurden separat geprüft.

## Sicherheitsumfang

- Bestehende serverseitige Authentifizierung, MFA-Sitzungen, Rollen, CSRF-Herkunft und Request-Header bleiben wirksam. Import für Autoren und anonyme Nutzer gesperrt, Veröffentlichung ausschließlich durch die Administration.
- Größen-/Zeilen-/Spalten-/Textlimits, ZIP-Entpacklimit, tatsächliche OOXML-Struktur, keine Makros/externen Excel-Verknüpfungen/DTD-Auswertung, keine Formel- oder HTML-Ausführung.
- Externe Kalender: HTTPS, explizite Host-Freigaben, keine IP-Adressen/Benutzerinfo/abweichenden Ports, keine Weiterleitungen, zehn Sekunden und 2 MB; keine Besucher-Cookies oder Auth-Header. Erlaubte zusätzliche Hosts sind eine bewusste Betriebsentscheidung und dürfen keine unkontrollierten Benutzer-Domains sein.
- Private Importvorschauen, 24 Stunden Zugriffsfrist; Entfernung des Rohinhalts nach Abschluss beziehungsweise bei der nächsten schreibenden Aktion nach Ablauf. Kein automatischer Hintergrund-Löschdienst behauptet.
- Personenbezogene Inhalte benötigen weiterhin eine redaktionelle Prüfung. ICS-Teilnehmer, Organisatoren, Anhänge und Alarme werden verworfen. Logs/Audit enthalten keine Passwörter oder Sitzungsgeheimnisse.

## Grenzen und offene Punkte

1. Visuelle iPhone-/iPad-Abnahme und vollständiger Browserdurchlauf des Assistenten sind blockiert und vor Freigabe nachzuholen.
2. Echte Phase-3-Mailzustellung, persönliche Administratorübernahme, TOTP-Einrichtung mit dem echten Konto und Wiederherstellungsweg sind weiterhin offen.
3. Keine Google-/Microsoft-OAuth-Anbindung, keine privaten Zugangscodes und keine zeitgesteuerte Synchronisierung. ICS-Quellen werden nur manuell als Vorschau abgerufen.
4. RRULE unterstützt die im Kalender-Handbuch genannten Teilmengen. Serienausnahmen/abgesagte Termine werden zur bewussten manuellen Behandlung zurückgewiesen. Die Anzeige ist auf 5.000 Vorkommen pro Zeitraum begrenzt.
5. Die vorhandene private Sites-Zugangskontrolle kann externe Kalenderabonnements blockieren. Sie wird nicht umgangen oder öffentlich freigeschaltet.
6. Kein vollständiger produktiver Daten-/Medienumzug und keine produktiven Migrationen durchgeführt. Die neue Kalenderverwaltung hat deshalb noch keine live freigeschaltete URL. Getesteter Anwendungspfad: `/admin/calendar`, Importpfad: `/admin/calendar/import`.

Die neue Version ist ein überprüfbarer Freigabekandidat mit den genannten offenen Abnahmen, keine als vollständig produktiv abgenommen ausgegebene Veröffentlichung.

## Geänderte und neue Dateien

- `.env.example`
- `.github/workflows/ci.yml`
- `README.md`
- `app/[...slug]/page.tsx`
- `app/admin/calendar/event-fields.tsx`
- `app/admin/calendar/import-wizard.tsx`
- `app/admin/calendar/import/page.tsx`
- `app/admin/calendar/page.tsx`
- `app/admin/calendar/workspace.tsx`
- `app/admin/workspace.tsx`
- `app/api/admin/[...path]/route.ts`
- `app/api/calendar-admin/[...path]/route.ts`
- `app/api/calendar/route.ts`
- `app/api/content/route.ts`
- `app/calendar.tsx`
- `app/collections.tsx`
- `app/globals.css`
- `db/schema.ts`
- `docs/KALENDER-HANDBUCH.md`
- `docs/PHASE4-PRUEFBERICHT.md`
- `docs/verification/phase4-results.json`
- `drizzle/0003_worried_invisible_woman.sql`
- `drizzle/meta/0003_snapshot.json`
- `drizzle/meta/_journal.json`
- `lib/calendar-import.ts`
- `lib/calendar-model.ts`
- `lib/calendar-store.ts`
- `lib/server.ts`
- `lib/types.ts`
- `package.json`
- `pnpm-lock.yaml`
- `tests/calendar-integration.mjs`
- `tests/calendar-persistence.mjs`
- `tests/calendar.test.mjs`
- `tests/designer-integration.mjs`
- `tests/security-integration.mjs`
