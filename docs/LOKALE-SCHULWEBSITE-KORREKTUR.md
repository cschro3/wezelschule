# Lokale Schulwebsite: Originalbranding und öffentliche Inhalte

Stand: 4. November 2026. Korrektur im vorhandenen Zweig `phase6-local-test`; kein Sites-Deployment.

## Fehler und Korrektur

Das bisherige lokale Paket enthielt zwar den vorhandenen Anwendungscode, startete aber mit einem vereinfachten Testlogo und erfundenen Beispielinhalten. Damit entsprach es nicht der gewünschten Schulwebsite. Außerdem wurde die technische Einrichtung unter `/__local` als erster Einstieg genannt.

Der normale lokale Start übernimmt jetzt den bereits im Repository vorhandenen öffentlichen Export vom 3. November 2026: originale Design-Einstellungen, Navigation, Startseitenblöcke, Kontaktdaten, Footer, acht veröffentlichte Inhaltsseiten und sieben Dokumenteinträge. Es wird keine ähnliche Ersatzwebsite gebaut. Die originale Startseitenüberschrift „DEINE ZUKUNFT. UNSERE SCHULE.“ und das Design bleiben erhalten. Es werden keine Schulnachrichten, Projekte oder Veranstaltungen erfunden.

Die beiden freigegebenen Johann-Karl-Wezel-Logos werden mit geprüfter PNG-Signatur, Dateigröße und SHA-256 in den lokalen R2-Speicher übernommen. Header, Login, Footer, Adminbereich und Designer verwenden die vorhandene zentrale Branding-Konfiguration. Der eindeutige Wortmarkenmodus verhindert zusätzlichen Schulnamen-Text neben dem vollständigen Logo. Die bestehenden Logo-Größen und Mobilwerte bleiben bearbeitbar.

Die Schulwebsite öffnet unter **http://localhost:3000/**. Login: `/login`; Redaktion: `/admin`; Website-Designer: `/admin/design`; Kalenderimport: `/admin/calendar/import`. `/__local` ist ausschließlich die lokale persönliche Einrichtung und bietet einen deutlichen Link zur Schulwebsite. Die Loginseite zeigt diesen Einrichtungslink nur, wenn die lokale Laufzeit das entsprechende Binding setzt.

## Konten und bestehende lokale Daten

Originalkonten, Passwort-Hashes, MFA, Sitzungen, private Entwürfe und Schülerdaten werden nicht aus dem gehosteten System kopiert. Ein neues synthetisches lokales Konto wird weiterhin selbst per Einmallink und TOTP eingerichtet; es gibt kein Standardpasswort und keinen MFA-Bypass.

Bei einer vorhandenen unveränderten alten Testgestaltung erfolgt die Übernahme automatisch. Zuvor wird eine Inhaltskopie unter `.local-test/school-preview-before-*.json` angelegt. Konten, Passwörter, MFA, Sitzungen und eigene Inhalte bleiben erhalten. Nur die vier exakt unveränderten anfänglichen Beispiel-Einträge werden archiviert, nicht gelöscht. Bearbeitete Einträge bleiben erhalten. Eigene bearbeitete Designentwürfe werden nicht automatisch ersetzt; dann ist eine ausdrückliche Wiederherstellungsaktion in `/__local` nötig, bei eingerichtetem Konto mit Systemadmin-Anmeldung und MFA. Der öffentliche Import fügt Einträge anhand ihrer ursprünglichen IDs hinzu und überschreibt vorhandene bearbeitete Einträge nicht.

Die synthetische Datenvariante bleibt ausschließlich für die getrennten automatisierten Funktionstests verfügbar. Sie ist nicht mehr der normale Benutzerstart.

## Tatsächlich enthaltene und fehlende Medien

| Medium | Zustand |
|---|---|
| Logo für hellen Hintergrund, `573e7210-7adc-4910-a6d8-635adbbe7e5b` | Original-PNG, 468.196 Bytes; SHA-256 `f12b34de9130f526d61784f71246d4362497e843c65754d77475b77f06dc2bad` |
| Logo für dunklen Hintergrund, `0e72f0df-2b4f-4575-8473-db7de6e4f43c` | Original-PNG, 504.004 Bytes; SHA-256 `a36c865873fabc834a3422fba1332aeb8e5313e852ad47ef1f460d4d3bc2d68b` |
| Hero-Upload `213f26a4-3580-4318-b824-b503bc1f2b1b` | Im vorhandenen Export nicht freigegeben; lokaler Ersatz durch das bereits im Projekt vorhandene echte Schulfoto `/school/nschu01.jpg` |
| Weitere Uploads | Im bisherigen Export ausdrücklich nicht enthalten: `02154d78-5094-43e9-95ef-3fd305c33e3c`, `232e00a6-650c-41c1-b8c2-0be671ed1ac6`, `372587e1-1d7d-48b3-83a3-2d433b71db54`, `39cd39c6-9700-4c2e-9981-c1543cdf273a`, `fcced050-5581-4e9f-b660-e03a62dc32e6` |
| Original-Dokumenteinträge | Sieben öffentliche Verweise bleiben erhalten; externe PDF-Dateien werden weiterhin von der bisherigen Schulwebsite geöffnet und sind kein lokaler Dateiabzug |

Die fehlenden Uploads werden nicht ungeprüft in das öffentliche Repository kopiert. Ihre nicht auflösbaren Bildverweise werden nur in der lokalen importierten Kopie entfernt; die ursprüngliche Exportdatei und gehostete Inhalte bleiben unverändert. Das Laufzeitprotokoll `.local-test/school-preview-report.json` nennt die tatsächlich betroffenen Felder. Ein vollständiger aktueller Datenbank- oder Medienexport wird nicht behauptet.

## Prüfungen

| Prüfung | Tatsächlicher lokaler Befund |
|---|---|
| Festgelegte Installation, TypeScript, Worker-Build | Erfolgreich auf Linux mit Node 24 und pnpm 11.25.0 |
| Bestehende isolierte lokale Sicherheits-/CMS-/Kalenderabläufe | 14 Prüfungen bestanden |
| Neue Schulwebsite-Prüfung | 7 Prüfungen bestanden: Originaldesign und 15 öffentliche Einträge, beide exakten PNGs, Startseite und Login, acht Inhaltsseiten und erreichbare Medien, echte Passwort-/TOTP-Einrichtung vor Upgrade, Erhalt von Passwort/MFA/Sitzung/eigenem Entwurf bei Upgrade, erneuter Start ohne Neuimport |
| Echter HTTP-Start mit Schulbestand | 6 Prüfungen auf Linux bestanden, einschließlich Einladung, Passwort, TOTP, geschütztem CMS, Multipart-Import und Logout |
| Windows und sauberes ZIP | Der Workflow `WEZEL local Windows test` prüft den echten `.cmd`-Kaltstart ohne `node_modules`, dann Installation, Build, Setup und Tests erneut aus dem ZIP unter `WEZEL Test Ä`. Maßgeblich sind der konkrete erfolgreiche Workflow und seine `windows-local-verification`-Dateien; Linux-Ergebnisse gelten nicht als Windows-Nachweis. |
| Visuelle Browser-/iPhone-/iPad-Prüfung | Nicht bestätigt. Der unterstützte Vorschau-Daemon startete, der Cloud-Browser konnte die Vorschau zunächst nicht verbinden und blockierte anschließend die Beobachtung des Fehler-Tabs durch seine URL-Richtlinie. Keine Umgehung und keine erfundenen Screenshots. HTTP- und Renderingprüfungen ersetzen keine visuelle Geräteabnahme. |

Der Windows-Workflow und die gemeinsame Linux-Regression werden vor Auslieferung des neuen ZIP auf dem konkreten Quellstand ausgewertet. Aktuelle Läufe: https://github.com/cschro3/wezelschule/actions . Der Download soll aus dem erfolgreichen Windows-Artefakt `wezel-next-local-test-package` stammen. Die ältere npm-Korrektur bleibt erhalten: keine npm-ungültigen `miniflare>sharp`-Overrides in `package.json`; alle 17 festgelegten Regeln stehen unverändert in `pnpm-workspace.yaml`.

## Geänderte Module und Grenzen

Neu: `scripts/local-school.mjs`, `tests/school-preview.mjs`, dieser Bericht. Angepasst: lokale Laufzeit, Einrichtungsoberfläche und Paketierer; Windows-Startausgabe; lokale Login-Hilfe und Typdeklaration; Tests, CI und Windows-Anleitung. Keine Datenbankmigration geändert. Der Paketierer nimmt gezielt nur den öffentlichen Inhaltsexport, sein Medienmanifest und die zwei freigegebenen PNGs zusätzlich auf; Authentifizierungsdaten, lokale Zustände, Geheimnisse, Builds und sonstige Exporte bleiben ausgeschlossen.

Der Server bindet weiterhin ausschließlich an `127.0.0.1:3000`. Authentifizierung, MFA, Rollen, lokale CSRF-Prüfung und blockierter externer Mail-/Worker-Transport bleiben bestehen. Die bestehende Site, ihre Speicherressourcen, Version 9, `main`, `phase5-testbetrieb`, PR #1 und `wezelschule.de` werden nicht verändert. Keine neue Site, kein Deployment, keine produktive Migration, kein Merge und keine echte Mailzustellung.

## Korrektur des lokalen Einrichtungsformulars – 4. November 2026

Der anschließend gemeldete Fehler `Origin rejected` wurde auf eine falsche Referrer-Policy im lokalen HTTP-Starter zurückgeführt. Bei nativen Formular-POSTs kann `no-referrer` den Origin-Header auf `null` setzen. Der Server lehnte das zu Recht ab; die ausliefernde Seite war falsch konfiguriert. Grundlage: [WHATWG Fetch, Abschnitt 3.2 Origin](https://fetch.spec.whatwg.org/#append-a-request-origin-header).

Der Starter liefert jetzt `Referrer-Policy: same-origin`. Fremde, fehlende, `null`- oder falsche-Port-Origins werden weiterhin abgelehnt; es gibt weder eine Referer-Ausnahme noch einen MFA- oder CSRF-Bypass. Der vorhandene Anwendungs-Worker liefert seine eigenen unveränderten Sicherheitsheader. Keine Datenbank- oder Kontenänderung ist erforderlich.

Der HTTP-Regressionstest prüft jetzt ausdrücklich die ausgelieferte Formular-Policy, `form-action self`, `no-store`, die fünf abgelehnten Origin-Fälle ohne Cookie-Erteilung, den erlaubten Operator-POST mit HttpOnly-/SameSite-Cookie sowie den Schutz der Wiederherstellungsaktion. Das bisherige reine Setzen eines passenden Origin-Headers hatte die falsche Seiten-Policy nicht erfasst. Der korrigierte lokale HTTP-Lauf besteht aus sieben Prüfungen auf Linux beziehungsweise acht unter Windows einschließlich Kaltinstallation. Das sind tatsächliche HTTP-Tests; eine interaktive Browserprüfung wird damit weiterhin nicht behauptet.

Aktualisierung: Server stoppen, Projektdateien aktualisieren oder nur in `scripts/local-test.mjs` die eine Regel `res.setHeader('Referrer-Policy', 'no-referrer');` durch `res.setHeader('Referrer-Policy', 'same-origin');` ersetzen, Server wieder starten und `/__local` frisch öffnen. `.local-test` bleibt erhalten.

## MFA-Absturz nach „Authenticator einrichten“ – 4. November 2026

Der nächste Benutzerbericht zeigte die globale Fehlerseite unmittelbar nach dem Start der MFA-Einrichtung. Der Fehler ist unabhängig vom zuvor korrigierten Origin-Header: `react-qr-code` liefert unter CommonJS/ESM-Interop ein Exportobjekt als Standardimport. Wird dieses Objekt direkt als React-Komponente verwendet, bricht React mit „Element type is invalid“ ab. Der alte Standardimport wurde mit dem installierten Paket tatsächlich so reproduziert.

Die MFA-Einrichtungsansicht ist jetzt als eigene Komponente in `app/account/security/mfa-enrollment.tsx` gekapselt. Sie normalisiert den CommonJS-Standardimport, behält QR-Code, manuelle Einrichtung, zehn Wiederherstellungscodes und die Bestätigungssperre bei. Eine lokale Fehlergrenze verhindert, dass ein künftiger QR-Renderfehler die gesamte Kontoseite ersetzt; die manuelle Einrichtung und Codes bleiben dann verfügbar. Die Antwortdaten werden vor der Anzeige geprüft.

Neue automatische Prüfung: `node tests/mfa-enrollment.mjs` (Teil von `npm run local:test`). Fünf tatsächlich bestandene Prüfungen: ursprünglicher React-Fehler reproduziert; unterbrochene Einrichtung mit demselben Konto/Passwort erneut gestartet; echte lokale MFA-Antwort mit SVG, zehn Codes und Bestätigungsformular gerendert; Aktivieren bis zur Sicherungsbestätigung beziehungsweise während einer Anfrage gesperrt; echte TOTP-Bestätigung mit anschließendem Zugriff auf CMS, Designer und Kalenderimport. Alle Passwörter, TOTP-Geheimnisse und Codes stammen nur aus der temporären synthetischen Testdatenbank und werden nicht protokolliert oder ins Paket übernommen.

Zusätzlicher Browsernachweis: Die echte neue MFA-Komponente wurde mit ursprünglichem Stylesheet in einer temporären Vite-Komponentenvorschau mit ausdrücklich synthetischen Daten gerendert. Im Cloud-Browser erschienen der QR-Code, zehn Testcodes, die manuelle Einrichtung und das Codefeld. Der Aktivieren-Button war vor dem Setzen der Sicherungs-Checkbox deaktiviert und danach aktiviert. Dies bestätigt die interaktive Komponentenansicht, nicht die vollständige persönliche MFA-Anmeldung im Browser. Die Backend-Anmeldung und TOTP-Bestätigung wurden separat über die reale lokale API geprüft. Die temporäre Vorschau enthält keine Konten und ist nicht Teil der ausgelieferten Anwendung.

Keine Backend-, Authentifizierungs- oder Datenbankmigration geändert, keine Sicherheitsprüfung deaktiviert und kein Konto zurückgesetzt. Der bestehende pending MFA-Datensatz lässt sich durch erneutes Einrichten ersetzen; das wurde mit dem vorhandenen synthetischen Konto geprüft. Benutzer müssen nach Aktualisierung und Worker-Neubau die Kontoseite frisch laden. `.local-test` bleibt erhalten. Die Prüfung des Windows-Starts und des frisch entpackten ZIP erfolgt erneut im konkreten GitHub-Prüflauf; ein vollständiger visueller iPhone-/iPad-Abnahmelauf wird weiterhin nicht behauptet.
