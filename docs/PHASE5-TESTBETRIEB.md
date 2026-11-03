# WEZEL NEXT – Phase 5: Testbetrieb und Freigabeentscheidung

Stand: 03.11.2026. Ergebnis: Alle in dieser Umgebung ohne Veröffentlichung ausführbaren Prüfungen sind abgeschlossen. **Kein vollständiger persönlicher Testbetrieb freigegeben; keine Veröffentlichung erfolgt.**

## Geschützter Ausgangsstand

- Bestehendes Sites-Projekt: `appgprj_6ae8542b54bc8191b9a0048a8cc1c149`.
- Gespeicherte Version 9: `appgprj_6ae8542b54bc8191b9a0048a8cc1c149~appgver_021728d63a2c8191bd3b449c56a6e927`, Quellcommit `cae689e03b31b1c866243b4d1e3c590ff0526135`, weiterhin ohne Deployment.
- PR #1 bleibt Entwurf, ungemergt und bei seinem bisherigen Kopf `29909114f7759233469f142cabf86718beabba76`. `main` bleibt unverändert. Dieser Nachtrag wird getrennt im GitHub-Zweig `phase5-testbetrieb` abgelegt.
- Keine produktive Migration, kein Reset, kein Benutzerwechsel, keine Änderung von Runtime-Geheimnissen oder Zugriffsrechten. Die offizielle Schulwebsite wurde ausschließlich zum Lesen vorhandener PDF-Dateien aufgerufen.
- Die tatsächliche Live-Datenbank zeigt weiterhin die neun bisherigen Tabellen. Neue Auth-/Kalendertabellen sind dort nicht angewendet. Runtime- und Zugriffspolitik bleiben auf Revision 1; nur `OWNER_EMAIL` ist als Runtime-Schlüssel vorhanden.

Die frühere lokale Arbeitskopie war durch Workspace-Bereinigung entfernt. Der unterstützte Sites-Quellzugriff stellte exakt den gespeicherten Version-9-Commit wieder her. Das lokale Ausführungsprofil wurde mit dem vorgesehenen Werkzeug eingerichtet; keine neue Site wurde erstellt.

## Welche Vorschau tatsächlich verfügbar ist

Der unterstützte Befehl `sites-preview start /workspace/sites/wezel-next` stellte **`http://terminal.local:4173/`** bereit. Dies ist eine interne, sitzungsgebundene QA-Adresse des Cloud Browsers, keine dauerhaft vom eigenen Computer oder iPhone erreichbare Version-9-Testadresse. Die responsive Prüfung verwendete eine ignorierte lokale Rahmenansicht unter `/__qa_viewports.html`, die die **echten unveränderten Anwendungsrouten** lädt, keine nachgebaute Website und keine gefälschten API-Speichererfolge.

Die angebotenen nativen Sites-Werkzeuge liefern für die gespeicherte, unveröffentlichte Version 9 keine eigenständige gehostete Vorschau mit separater Test-D1/R2. Ein Deployment auf die bisherige private Site wäre eine echte Übernahme auf deren bestehende Laufzeit und Datenbank. Es wurde entsprechend der Vorgabe nicht ausgeführt. Auch eine neue private Testkopie wurde nicht ohne Entscheidung angelegt.

Beim Einrichten wurde ein lokaler Datenpfadfehler behoben: Wrangler mit `--config dist/server/wrangler.json` legte seinen Standardzustand unter `dist/server/.wrangler` an, während Vite `.wrangler/state` im Projekt verwendet. Die Testmigrationen wurden anschließend ausschließlich lokal mit ausdrücklich absolutem `--persist-to /workspace/sites/wezel-next/.wrangler/state` angewendet. Produktive Ressourcen wurden nicht angesprochen.

Die öffentliche Originalanwendung lässt sich danach bedienen. Eine Entwicklungswarnung bleibt bestehen: **„The server could not finish this Suspense boundary … Switched to client rendering.“** Der kompilierte Worker besteht die entsprechenden Renderprüfungen. Dies belegt keine fehlerfreie authentifizierte Browserabnahme; die Warnung wurde nicht durch Änderungen an Sicherheitsgrenzen oder durch Unterdrücken der Fehlerursache kaschiert.

## Isolation und Testdaten

Backendtests verwenden Miniflare mit isolierter D1/R2 und synthetischen Konten. Der neue gemeinsame Ablauf verwendet echte lokale Passwort-/TOTP-Sitzungen des kompilierten Workers, keine Plattform-Identitätsheader für die nachfolgenden Verwaltungsaktionen. Geheimnisse entstehen zufällig im Testspeicher und stehen weder im Bericht noch in den eingecheckten Nachweisen. Externe Anfragen sind in diesem gemeinsamen Test gesperrt, tatsächlich ausgelöste externe Anfragen: **0**.

Für die visuelle Prüfung wurden die aktuell veröffentlichten 15 Inhaltsdatensätze, öffentliche Branding-Einstellungen und acht tatsächlich öffentlich lesbare Medien ausschließlich lesend in die lokale Arbeitskopie übernommen. Keine produktiven Benutzer, Sitzungen oder nicht veröffentlichten privaten Inhalte wurden kopiert. Zusätzliche Kalenderdaten tragen sichtbar `TESTBETRIEB`; enthalten sind zwei veröffentlichte öffentliche Termine, ein interner Termin und ein unveröffentlichter Entwurf. Es wurden keinerlei Testtermine auf der gehosteten Site gespeichert.

## Tatsächliche Prüfergebnisse

- Abhängigkeitsinstallation, TypeScript und Build erfolgreich. Nach der CSS-Korrektur erneut gebaut; kombinierter Ablauf und Renderprüfungen erneut erfolgreich.
- Die bestehenden 130 unterschiedlichen Phase-3-/Phase-4-Prüfszenarien erneut erfolgreich: 31 Modell-/Branding-/Import-, 23 Sicherheits-, 22 Kalenderintegrations-, 23 CMS-/Designer-, 29 Render- und zwei Kalenderpersistenzprüfungen. Der zusätzliche Aufruf `integration.mjs` führt dieselbe Designersuite aus; er wird nicht als weitere unabhängige 23 Prüfungen gezählt. Bestehende CMS-Persistenz in getrennten Prozessen ebenfalls bestanden.
- Neuer gemeinsamer Test `tests/phase5-testbetrieb.mjs`: **18 bestandene Ergebnisdatensätze**, einschließlich Routenmanifest. Er prüft den Zusammenhang von Passwort/MFA, CMS-Modulen, Designentwurf/Vorschau/Publikation, echten SVG-/PDF-Uploads, Kalenderimport und Logout. Diese Testpublikationen betreffen ausschließlich die isolierte Datenbank.
- Der neue Ablauf prüfte 22 öffentliche Navigationsrouten erfolgreich und wies elf ausschließlich als Entwurf vorhandene Seiten mit 404 zurück. Die gesonderte bestehende Rendersuite prüft weitere Alias-, Detail- und Vorschauzustände.
- **60 reale responsive Layoutzustände**: 20 Originalrouten einschließlich Login × 1280, 390 und 768 px. Mit dem aktuellen öffentlichen Inhalts-/Medienstand nach Korrektur kein horizontaler Dokumentüberlauf und keine fehlenden sichtbaren Logos. Das mobile Headerlogo misst 170 × 85 CSS-px. Dies ist Chrome bei entsprechenden Breiten, keine physische iPhone-/iPad- oder Safari-Abnahme.
- Im echten öffentlichen Browserkalender bedient: Monat, Woche, Liste, Suche, Kategorien-/Zielgruppenfilter und Termindetails. Interne Termine und Entwürfe waren nicht sichtbar. Login: Passwortanzeige bei leerem Feld und Wechsel zur Passwort-vergessen-Ansicht bedient; keine persönlichen Anmeldewerte eingegeben.
- Alle sieben bestehenden externen PDF-Verweise: tatsächlicher lesender Abruf mit HTTP 200, `application/pdf` und PDF-Signatur. Der Web-Reader konnte diese URLs zunächst nicht öffnen; der anschließende direkte HTTP-Dateitest war erfolgreich. Keine Dateien oder Verweise auf wezelschule.de wurden geändert.
- Acht referenzierte öffentliche Medien tatsächlich abgerufen und mit Größe, MIME-Typ und SHA-256 dokumentiert. Die beiden Logo-Prüfsummen entsprechen dem vorangegangenen Readiness-Bericht.

## Prüfliste

| Funktion | Testergebnis | Gefundener Fehler / Grenze | Priorität | Erforderliche Korrektur / nächste Abnahme |
|---|---|---|---|---|
| Vorschau starten | Intern erreichbar | Keine dauerhafte isolierte Version-9-URL für den Eigentümer | P1 | Gesonderte Entscheidung über privaten isolierten Test-Release |
| Öffentliche Seiten und Navigation | Backend/SSR und 60 Browserzustände bestanden | Dev-RSC-/Suspense-Warnung | P1 | Entwicklungswarnung klären; vollständige Browserabnahme nachholen |
| Serviceseite mobil | Fehler behoben und nachgemessen | Vorher 439 px Inhalt bei 375 px verfügbarem Platz; nachher 375/375 | Behoben | Änderung im separaten Zweig prüfen; noch nicht in gespeicherter Version 9 |
| Logo, Header, Footer | Sichtbare Logos in allen 60 Zuständen geladen | Echte Safari-/Geräteabnahme fehlt | P2 | Auf iPhone und iPad gegenprüfen |
| Öffentliche Medien | Acht referenzierte Dateien erfolgreich gelesen; zwei im GitHub-Stand fehlende Original-Schulfotos ergänzt | Keine vollständige rechtliche Bildrechteprüfung | Bestand korrigiert / redaktionell | Schule bestätigt inhaltliche Nutzungsfreigaben |
| Downloads | Sieben Original-PDFs mit HTTP 200/PDF-Signatur | Inhaltliche Aktualität und Barrierefreiheit nicht bestätigt | Redaktionell | Verantwortliche prüfen Formulare |
| Kontakt | Konfigurierte Adresse, Telefon- und Mailverweise dargestellt | Keine Telefonnummer angerufen, keine echte E-Mail gesendet | Redaktionell | Schule bestätigt Kontaktdaten |
| Login / Logout / Session-Sicherheit | Backend einschließlich falschem Passwort, Cookies, Entzug, Timeout und Rate Limit bestanden | Vollständige authentifizierte Browserbedienung fehlt | P1 | Persönlich oder über sicheren unterstützten Testzugang abnehmen |
| Rollen und Benutzerverwaltung | Serverseitige Prüfungen und Einladungsablauf mit abgefangenem Mailtransport bestanden | Kein realer eingeladener Benutzer hat den Ablauf bedient | P1 | Nach sicherer Konfiguration reale kontrollierte Einladung prüfen |
| TOTP / Wiederherstellung | Synthetischer TOTP-, Wiederherstellungs- und Einmaligkeitstest bestanden | Keine persönliche Einrichtung am Eigentümerkonto | P1 | Benutzergeführt; alten Zugang erhalten |
| Passwort-Reset | Tokenablauf, Einmaligkeit und Sessionentzug im Backend bestanden | Keine echte Zustellung | P1 | Versanddomain/Resend geschützt konfigurieren und Zustellung prüfen |
| Website-Designer / Logo-Verwaltung / Header-Editor | Echte Session: Entwurf, erneutes Lesen, geschützte Vorschau, Freigabe und lokale Publikation bestanden | Authentifizierte Browserbedienung nicht nachgewiesen | P1 | Durchgängigen Bedienablauf nachholen |
| Seiten / Nachrichten / Projekte | Erstellen, Lesen, Prüfen, Freigeben und lokale Publikation bestanden | Browserformulare nicht vollständig durchlaufen | P2 | Bedienabnahme |
| Mediathek / Dokumente | Echte SVG-/PDF-Uploads, Freigabe, private Dateien und Löschsperren bestanden | Touch-Zuschnitt nicht abgenommen | P2 | Geräte-/Bedienabnahme |
| Einstellungen / Änderungsprotokoll | Persistente Designkonfiguration und Protokolldaten geprüft | Keine getrennte alte Einstellungsspeicherung aktiviert | – | Zentralen Designer weiterverwenden |
| Excel / CSV / ICS | Tatsächliche serverseitige Uploads und Speicherabläufe bestanden | Browser-Dateiauswahl bis Abschluss nicht abgenommen | P1 | Vollständigen authentifizierten Assistenten bedienen |
| Arbeitsblätter / Spalten / Vorschau | Automatische/manuelle Zuordnung, Datumsprüfung und Auswahl im Backend bestanden | Browser-Klickablauf fehlt | P2 | Bedienabnahme |
| Duplikate / Transaktionen | Wiederholungen, Original-ID bei Aktualisierung, Nebenläufigkeit und SQL-Rollback bestanden | Keine offene Backendabweichung gefunden | – | Ergebnisse erhalten |
| Entwurf / Freigabe / Veröffentlichung | Getrennte redaktionelle Rechtebestätigung und Freigabe erforderlich; isoliert bestanden | Veröffentlichung auf echter Site bewusst nicht getestet | P1 | Erst nach gesonderter Freigabe |
| Monat / Woche / Liste / Filter / Details | Reale öffentliche Browserbedienung bestanden | Kalenderabo durch private äußere Sites-Sperre begrenzt | Betriebsgrenze | Keine heimliche Öffnung der Site |
| Bestehende Daten / Adminzugang | Keine gehosteten Schreibaktionen; Ausgangs-ID im lokalen Übernahmetest erhalten | Kein vollständiger produktiver D1/R2-Restore durchgeführt | P1 | Betreiberbackup und Restore vor jeder Übernahme |

## Nachweisbare Korrekturen

`app/globals.css`: Unter 600 px werden Servicekarten in einer flexiblen einzelnen Spalte dargestellt. Zuvor erzwangen die Mindestbreiten zweier Karten bei Smartphone-Breite einen seitlichen Überlauf. Nachgemessen: 439 → 375 px Scrollbreite bei unverändert 375 px verfügbarer Breite. Keine Inhalte wurden entfernt und kein `overflow:hidden` zum Verdecken des Problems verwendet.

Dies ist ein **unveröffentlichter Phase-5-Patch auf Version 9**. Die gespeicherte Sites-Version 9 wurde nicht ersetzt und keine neue Versionsnummer erfunden.

Der erste zusätzliche GitHub-CI-Lauf meldete außerdem ein fehlendes `dist/client/school/nschu01.jpg`. Ursache: Im GitHub-Quellbaum fehlten beide Schulgebäudefotos, obwohl sie im gespeicherten Sites-Original vorhanden sind. `public/school/nschu01.jpg` und `public/school/nschu02.jpg` werden exakt aus diesem Originalbestand ergänzt; ihre Git-Blob-Hashes stimmen mit dem Version-9-Quellcommit überein. Die vorhandenen Quellen-/Rechtehinweise bleiben erhalten. Dies ist eine Reparatur des GitHub-Dateibestands, keine neue Bildbeschaffung und keine produktive Veröffentlichung. Die Build-/Medienprüfung bleibt als Regressionstest bestehen.

Zusätzlich: `tests/phase5-testbetrieb.mjs` und ein entsprechender Testschritt in `.github/workflows/ci.yml`. Die CI enthält ausschließlich Prüfungen, keine Bereitstellung. Keine Datenbankmigrationen hinzugefügt oder geändert.

## Persönliche Administratorübernahme vorbereiten

Die produktive Konfiguration enthält noch kein `BETTER_AUTH_SECRET`, `AUTH_BASE_URL`, `AUTH_MODE`, `AUTH_EMAIL_FROM` oder `RESEND_API_KEY`. Es wurden keine Werte gesetzt und keine echten E-Mails versandt.

Nach ausdrücklich genehmigter Bereitstellung in der passenden Umgebung: bestehenden verifizierten Eigentümerzugang in `migration` erhalten, unter `/account/security` dieselbe CMS-Konto-ID übernehmen, Passwort persönlich setzen, TOTP persönlich scannen/bestätigen und zehn Einmal-Wiederherstellungscodes getrennt sichern. In einer zweiten Sitzung Anmeldung und Wiederherstellung prüfen. Erst nach tatsächlichem Mail-/Reset-Test und gesichertem Wiederherstellungsweg die gesonderte Umstellung auf verbindlichen Passwort-/MFA-Login bestätigen. Keine Zugangsdaten über Chat oder Git übermitteln. Der vollständige Ablauf und Backup-/Rollback-Gates bleiben im [Freigabebericht](FINAL-RELEASE-READINESS.md) beschrieben.

## Vorbereitete Freigabeentscheidung – nicht ausgeführt

**Empfehlung zur Entscheidung:** Eine separate, ausschließlich private Sites-Testkopie desselben GitHub-Projekts mit eigener D1/R2 und ausschließlich synthetischen Testkonten freigeben. Quelle wäre der geprüfte Phase-5-Zweig auf Grundlage von Version 9 einschließlich mobiler CSS-Korrektur. Das Originalprojekt, seine Benutzer und seine Daten würden dabei unverändert bleiben. Keine offizielle Schul-Domain, keine Öffnung der Zugriffspolitik, kein externer Hoster und kein Merge von PR #1.

Dafür müssten ausdrücklich **Anlage und privates Testdeployment einer getrennten Sites-Instanz** genehmigt werden. Die technische Provisionierung und Datenisolation wären vor dem Deployment über die tatsächlich zurückgegebenen Projekt- und Storage-IDs zu prüfen. Eine solche zusätzliche Instanz wurde hier weder angelegt noch als bereits verfügbar behauptet. Falls ausschließlich die bisherige Projekt-ID verwendet werden soll, ist derzeit kein gleichwertiger isolierter gehosteter Vorschauweg angeboten; ein Rollout auf deren Laufzeit und Datenbank bleibt gesperrt.

Diese Entscheidung ersetzt keine Freigabe für spätere Übernahme in die bestehende private Site. Der frühere Sicherungs-, additive Migrations- und Rollbackplan gilt unverändert. Ein direktes Deployment ohne diese Entscheidung würde die verbindlichen Grenzen verletzen und wurde deshalb unterlassen.

## Dateien und Reproduktion

- [Gemeinsame Backend-Prüfergebnisse](verification/phase5/combined-report.json)
- [Bestehende Suiten: Ausführungsstatus](verification/phase5/automated-results.json)
- [60 tatsächliche Layoutmessungen](verification/phase5/browser-results.json)
- [PDF-Abrufe](verification/phase5/external-downloads.json)
- [Öffentliche Medien: Typen, Größen und Hashes](verification/phase5/public-assets.json)
- [Login in Smartphone-Breite](verification/phase5/login-mobile.jpg)
- [Korrigierte Serviceseite in Smartphone-Breite](verification/phase5/service-mobile-fixed.jpg)

Nach dokumentierter Installation und Build: `node tests/phase5-testbetrieb.mjs`. Der Test erstellt seine eigene isolierte Datenbank und seine synthetischen Medien; echte Geheimnisse, Benutzer oder Verbindungen sind dafür nicht erforderlich. Er ist keine Anweisung, Testdaten in eine bestehende gehostete Datenbank einzuspielen.
