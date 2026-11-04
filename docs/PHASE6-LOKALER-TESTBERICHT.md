# WEZEL NEXT – Phase 6: unabhängiger lokaler Testbetrieb

Stand: 3. November 2026. **Lokaler Funktionstest vorbereitet und technisch geprüft; kein Deployment und keine Freigabe der gehosteten Anwendung.**

## Ergebnis und Quellstand

Die bestehende Anwendung läuft als gebauter Cloudflare Worker mit dem vorhandenen Frontend, Backend, CMS, Website-Designer, Better Auth, Argon2id, TOTP und Kalenderimport auf einer eigenen lokalen Miniflare-Laufzeit. Es wurde keine optische Nachbildung erstellt. Der lokale Starter benötigt weder Produktionsdaten noch Sites-/Cloudflare-Zugangsdaten.

- Ausgangszweig: `phase5-testbetrieb`, Commit `c68517161c6c5b6142087707c74eadc73abb41a7`.
- Neuer Arbeitszweig: https://github.com/cschro3/wezelschule/tree/phase6-local-test
- Geprüfter Implementierungsstand: `6eb77128a648b0bb53e1c1f716177a5215e6fd21`. Nachfolgende Berichtsergänzungen ändern keine Anwendungsfunktionen.
- Kein neuer Sites-Versionsstand wurde gespeichert oder veröffentlicht. Version 9 und beide vorhandenen Sites-Projekte bleiben unverändert.
- Die vorhandenen Dateien unter `app/`, `components/`, `lib/`, `db/`, `drizzle/` und `worker/` wurden byteweise gegen den Ausgangsstand verglichen: keine Änderungen.

## A – Betreiberklärung

Die vorbereitete Anfrage aus `PHASE6-PRIVATE-TESTUMGEBUNG.md` wurde übernommen und in [SITES-BETREIBERANFRAGE.md](SITES-BETREIBERANFRAGE.md) unmittelbar versendbar ausgearbeitet.

Offizieller Weg laut OpenAI-Hilfezentrum: https://help.openai.com/ → Chat-Symbol unten rechts. Die Anfrage verlangt Weiterleitung an das Sites-Infrastruktur-/Sicherheitsteam und eine verbindliche Bestätigung, dass weder Test-Worker noch Testmigrationen oder Provisionierung Schreibzugriff auf D1/R2 des Originals besitzen. Unterschiedliche Projekt-IDs und logische Bindings gelten ausdrücklich nicht als Nachweis.

**Status: vorbereitet, nicht versandt; keine Ticketnummer, keine Betreiberantwort.** Eine Supportnachricht wurde nicht beauftragt oder vorgetäuscht. Die vorhandene Sperre für Migration und Deployment des Sites-Testprojekts bleibt bestehen. Keine erneute allgemeine Freigabe wurde angefordert.

## B – Lokale Isolation und Einrichtung

- Miniflare erhält ausschließlich eigene lokale D1-/R2-Persistenzverzeichnisse. Die tatsächlichen Daten entstehen als lokale Dateien unter `.local-test/d1/` und `.local-test/r2/`.
- `.env`, `.dev.vars`, Remote-Wrangler-Konfiguration und gehostete Projekt-ID werden vom Starter nicht zur Ressourcenauswahl oder Authentifizierung gelesen.
- Keine Cloudflare-Remote-API wird für Einrichtung, Migration, Seed oder Start verwendet. Der Worker darf keine externen HTTP-Dienste erreichen; der ausgehende Transport ist vollständig abgefangen.
- Synthetische E-Mails an `@wezel.invalid` werden im Arbeitsspeicher abgelegt. Ein abgelehnter Abruf einer externen ICS-Quelle wurde tatsächlich geprüft. Es gab keine echte Mailzustellung oder Kalender-Synchronisierung.
- Passwortanmeldung ist vom ersten Start an verbindlich (`AUTH_MODE=local`). Gefälschte Sites-Identitätsheader erlauben keinen Zugriff und werden am HTTP-Eingang entfernt.
- Der Server lauscht ausschließlich auf `127.0.0.1:3000`, prüft Hostnamen und bietet keine Option zur öffentlichen Netzwerkfreigabe.
- Das erste Konto entsteht aus einem lokal erzeugten, zeitlich begrenzten Einmal-Einladungslink. Erst eine bewusste gleichursprüngliche Aktion in `/__local` zeigt den Link. Danach legt der Benutzer selbst sein Passwort fest. Administratoren benötigen anschließend TOTP.
- Sessiongeheimnis, Passwörter, Hashes, Sitzungen, TOTP-Geheimnisse und Wiederherstellungscodes fehlen im Paket, in Berichten und Git. Die synthetischen Tests erzeugen eigene Geheimnisse ausschließlich während des Testlaufs.

Vier unveränderte vorhandene Anwendungsmigrationen werden lokal angewandt. Die zusätzliche Tabelle `local_test_migrations` gehört nur zum Starter und protokolliert lokal Dateinamen und Prüfsummen. Wiederholtes Setup erhält den lokalen Datenbestand. Es gibt **keine neue produktive Migration** und keinen Produktiv-Dump.

## Tatsächlich ausgeführte Prüfungen

| Prüfung | Ergebnis | Nachweis / Umfang |
|---|---|---|
| Installation mit festgelegter Lockdatei | Bestanden | Frische Windows-CI; separate Linux-Entpackung mit `pnpm install --frozen-lockfile` |
| TypeScript | Bestanden | Vorhandenes Projekt und bereinigtes entpacktes Paket |
| Build | Bestanden | `npm run local:build`; keine Verbindung zur gehosteten Datenbank |
| Lokale Migration und Seed | Bestanden | Vier Migrationen; synthetisches Administratorkonto, Inhalte und zwei selbst erstellte Logos |
| Zweites Setup | Bestanden | Keine Benutzer- oder Inhaltsersetzung; Migrationsprüfsummen bleiben erhalten |
| Lokale Laufzeit | 14 Prüfungen bestanden | Realer Worker, echte lokale Passwort-/TOTP-APIs und persistente D1-/R2-Dateien |
| Echter HTTP-Server / Windows-Starter | 6 Prüfungen bestanden | Einschließlich Einrichtungslink, Passwort/TOTP, geschützter CMS-Seiten, Multipart-Upload und Logout |
| Bisherige Modell-/Policy-/Branding-/Importtests | 31 bestanden | Node-Testlauf |
| Bisherige Sicherheitsprüfungen | 23 bestanden | Passwort-Reset, Rollen, Sitzungsentzug, CSRF, Rate Limiting, TOTP, Wiederherstellung, Audit |
| Bisherige Kalenderintegration | 22 bestanden | XLSX, CSV, ICS, Duplikate, Transaktionen, Freigaben, interne Sichtbarkeit, SSRF |
| Bisherige CMS-/Designerintegration | 23 bestanden | Logos, Header, Entwürfe, Veröffentlichung, Wiederherstellung, Medien-/Dokumentrechte |
| Vorhandene Seiten-/Vorschaudarstellung | 29 Szenarien bestanden | Serverseitiges Rendering, nicht visuelle Geräteabnahme |
| Kalender-Persistenz über Prozessgrenze | Schreiben und Lesen bestanden | Öffentliche/interne Termine bleiben getrennt |
| CMS-/Medien-Persistenz über Prozessgrenze | Schreiben und Lesen bestanden | D1-Inhalte und R2-Bytes bleiben erhalten |
| Kombinierte Phase-5-Abnahme | 18 protokollierte Ergebnisse bestanden | Ein gemeinsamer echter Passwort-/MFA-Zugang für CMS, Designer, Medien, Dokumente und Kalender |
| Neues sauberes ZIP-Verzeichnis | Bestanden | Installation, TypeScript, Build, Setup, 14 Laufzeitprüfungen und 6 HTTP-Prüfungen auf Linux |
| Windows-Archivprüfung | Bestanden | Sauber entpackt, erneut installiert/gebaut/eingerichtet; 14 Laufzeit- und 6 HTTP-Prüfungen erneut bestanden |
| Neue Browser-/iPhone-/iPad-Abnahme | Nicht durchgeführt | Siehe Grenzen unten; keine älteren Screenshots als neuer Nachweis verwendet |

Die Einträge umfassen teilweise dieselben Geschäftsabläufe auf unterschiedlichen Ebenen. Sie werden nicht zu einer künstlichen Anzahl unabhängiger Funktionen addiert. `tests/integration.mjs` ist der Einstieg in die vorhandene Designer-Suite und zählt nicht als zweite Suite.

### Einzelprüfungen der neuen Laufzeit

| Funktion | Ergebnis | Fehler | Priorität / Korrektur |
|---|---|---|---|
| Vier Migrationen, synthetische Inhalte, helle/dunkle Testlogos | Bestanden | Keine | – |
| Anonymer Zugriff, gefälschte Plattformidentität, Registrierung | Korrekt abgelehnt | Keine | – |
| Einmalige Einladung und Argon2id-Passwortspeicherung | Bestanden | Keine | – |
| Falsches/richtiges Passwort und lokale HttpOnly-/SameSite-Cookies | Bestanden | Keine | HTTPS-Cookies der gehosteten Anwendung bleiben unverändert |
| TOTP-Einrichtung, Bestätigung und zehn Wiederherstellungscodes | Bestanden | Keine | Codes nicht protokolliert |
| Login-, Admin-, Designer-, Sicherheits-, Kalender- und Testseiten | Bestanden | Keine im geprüften HTML | Keine visuelle Abnahme behauptet |
| CMS-Entwurf → Prüfung → Freigabe → lokale Veröffentlichung | Bestanden | Keine | Entwurf bleibt vorher privat |
| Designer speichern, neu lesen, private Vorschau und Veröffentlichung | Bestanden | Keine | Nur lokale Datenbank |
| CSV mit Zuordnung, Vorschau, Entwurf und Duplikaterkennung | Bestanden | Keine | Synthetische Datei |
| XLSX mit Zuordnung, Vorschau, Entwurf und Duplikaterkennung | Bestanden | Keine | Synthetische Arbeitsmappe |
| ICS einschließlich Wiederholung, Duplikaten und Freigabe | Bestanden | Keine | Synthetischer Kalender |
| Lokaler Mailtransport und blockierter externer ICS-Abruf | Bestanden | Keine | Keine echte Zustellung |
| Neustart erhält Konto, MFA-Sitzung, Logos, Design und Termine | Bestanden | Keine | Neue Miniflare-Instanz mit denselben lokalen Dateien |
| Logout, erneute MFA-Anmeldung und einmaliger Wiederherstellungscode | Bestanden | Keine | Wiederverwendung abgelehnt |
| HTTP-Start und Aufruf öffentlicher Seiten | Bestanden | Keine | Auf Windows echtes `.cmd`-Skript |
| HTTP-Zugriff ohne Login / mit gefälschten Identitätsheadern | Korrekt abgelehnt | Keine | – |
| Lokale Betreiberoberfläche und CSRF-Grenze | Bestanden | Keine | Einrichtungslink erst nach lokaler bewusster Aktion |
| Frischer HTTP-Testbestand enthält nur synthetische Einträge | Bestanden | Keine | Keine Originaldaten importiert |
| Echter HTTP-Einrichtungslink → Passwort → TOTP → geschützte Seiten | Bestanden | Keine | Benutzergeheimnisse nur im Testprozess |
| Echter HTTP-Multipart-Kalenderupload, Vorschau und Logout | Bestanden | Keine | Schutzgrenzen bleiben erhalten |

## Windows-Nachweise und reproduzierbare Befehle

Erster Windows-Lauf: https://github.com/cschro3/wezelschule/actions/runs/41633475535 – erfolgreich auf Microsoft Windows Server 2025, Image `windows-2025-vs2026`, Node `24.22.2`, pnpm `11.25.0`. Installation, TypeScript, Build, zweimal Setup, 14 Laufzeitprüfungen und damals vier HTTP-Prüfungen bestanden.

Archivprüfung des nachgebesserten Pakets: https://github.com/cschro3/wezelschule/actions/runs/41634461904 – erfolgreich, einschließlich sauberem Entpacken und erneuter Installation/Build/Tests auf Windows. Das ZIP enthält jetzt insbesondere auch `pnpm-workspace.yaml`, Typdeklarationen, Hooks und Vendor-Dateien.

Abschließender Windows-Lauf mit sechs vollständigen HTTP-Prüfungen: https://github.com/cschro3/wezelschule/actions/runs/41634762106 – erfolgreich; alle Schritte einschließlich der Wiederholung aus dem sauberen ZIP-Verzeichnis bestanden. Gemeinsame Linux-Regression: https://github.com/cschro3/wezelschule/actions/runs/41634762102 – erfolgreich.

Die vollständige Anleitung steht in [INSTALLATION-WINDOWS-TEST.md](../INSTALLATION-WINDOWS-TEST.md). Die tatsächlich geprüften Kernbefehle lauten:

```powershell
npm install --global pnpm@11.25.0
pnpm install --frozen-lockfile
npm run local:build
npm run local:setup
npm run local:test
npm run local:start
```

Alternativ `START-WEZEL-TEST.cmd` starten. Danach http://localhost:3000/__local öffnen und das eigene lokale Konto einschließlich TOTP einrichten. Öffentliche Testwebsite: http://localhost:3000, Admin: http://localhost:3000/admin. Diese Adressen gelten auf dem eigenen Rechner nach Start; sie sind keine gehosteten Sites-URLs.

## Paketprüfung und behobene Fehler

`WEZEL-NEXT-LOCAL-TEST.zip` enthält den vorhandenen Anwendungscode, alle vier Migrationen, festgelegte Paketkonfiguration, den lokalen Starter, Dokumentation und synthetische CSV-/XLSX-/ICS-Beispiele. `LOCAL-TEST-PACKAGE.json` enthält Dateiprüfsummen.

Der erste Entpackungsversuch deckte einen Paketfehler auf: Die pnpm-Workspace-Konfiguration fehlte und die eingefrorene Installation wurde deshalb abgelehnt. Der Paketierer wurde korrigiert; auch Typdeklarationen, Hooks und Vendor-Dateien werden erhalten. Der nächste frische Installations- und Buildlauf bestand. Ein früher Offline-Versuch ohne vorhandene Paketmetadaten wurde ebenfalls als fehlgeschlagen erkannt; die normale dokumentierte Installation ist erfolgreich. Keine Lockdatei oder Paket-Sicherheitsregel wurde zur Umgehung gelockert.

Absichtlich ausgeschlossen: veröffentlichte Datenexporte, historische Verifikationsscreenshots, gehostete Projekt-ID im Paketmanifest, Git-Metadaten, lokale Datenbank-/Medien-/Sessiondateien, Geheimnisse, `node_modules` und generierte Builds. Der GitHub-Quellzweig bewahrt vorhandene Dateien; die Bereinigung erfolgt ausschließlich im herunterladbaren Testpaket.

Alle 254 ursprünglichen GitHub-Dateien wurden mit der Paketliste abgeglichen: 32 historische Export-/Verifikationsdateien werden bewusst ausgeschlossen, keine weitere ursprüngliche Quelldatei fehlt. ZIP-Integrität und Manifestprüfsummen wurden geprüft. Der abschließende Dateinachweis steht in `PHASE6-LOKAL-VERIFIKATION.json`.

## Grenzen und offene Punkte

| Punkt | Status | Priorität | Nächster sicherer Schritt |
|---|---|---|---|
| Verbindlicher gehosteter D1-/R2-Isolationsnachweis | Weiterhin offen | Blocker nur für Sites-Deployment | Vorbereitete Betreiberanfrage über offiziellen Supportweg versenden; verbindliche Antwort prüfen |
| Neue interaktive Browser-/iPhone-/iPad-Abnahme | Nicht erfolgt | P2 für lokale Abnahme | Lokales Paket auf eigenem Windows-PC starten und UI-Abnahme durchführen |
| Vorschau in dieser verwalteten Umgebung | Unterstützter Startversuch abgebrochen | P2 | Der Vorschau-Daemon startete in einer anderen Container-/Portumgebung ohne die verlangte Ausführungskennzeichnung. Keine Schutzprüfung wurde dafür abgeschwächt; kein Ersatz über öffentliche Freigabe |
| RSC-/Suspense-Warnung im Vite-Entwicklungsmodus | Nicht als behoben nachgewiesen | P2 | Die lokale Testlaufzeit nutzt den gebauten Worker. Kein Bailout im geprüften HTML; das ersetzt keine Untersuchung der früheren HMR-Warnung |
| Persönliches Passwort/MFA des Benutzers | Noch nicht auf dessen Rechner eingerichtet | P2 | Selbst über lokalen Einrichtungsweg festlegen; keine Geheimnisse im Chat |
| Echte E-Mail / externe Synchronisierung | Bewusst nicht aktiviert | Kein lokaler Blocker | Lokalen Postausgang und Dateiimport verwenden |
| Echtes Windows-10/11-Gerät / Safari | Nicht direkt geprüft | P2 | CI prüft Windows Server 2025; persönliche Geräteabnahme bleibt erforderlich |
| Echte Schulmedien, Inhalte und Bildrechte | Nicht Teil des synthetischen Datenbestands | Redaktionell | Keine Originalmedien oder Benutzer nachträglich ungeprüft importieren |

Die technischen Funktionsprüfungen sind bestanden; eine vollständig visuell abgenommene Produktionsversion wird nicht behauptet.

## Originalschutz und geänderte Module

Es wurden keine schreibenden Sites-Aufrufe, gehosteten Migrationen, Veröffentlichungen, Mailzustellungen oder Änderungen an `wezelschule.de` vorgenommen. Keine neue Site wurde erstellt. GitHub `main` blieb auf `aba8a0ff17c04d37df85bcc367d912178ae772f0`, `phase5-testbetrieb` auf `c68517161c6c5b6142087707c74eadc73abb41a7`. PR #1 ist weiterhin offen, Draft und ungemergt; sein Head bleibt `29909114f7759233469f142cabf86718beabba76`.

Neu/angepasst: `scripts/local-runtime.mjs`, `scripts/local-test.mjs`, `scripts/package-local-test.mjs`, `START-WEZEL-TEST.cmd`, `tests/local-runtime.mjs`, `tests/local-http.mjs`, drei Dateien unter `tests/fixtures/local/`, `.github/workflows/local-windows.yml`, zusätzliche npm-Skripte, `.gitignore`, README und Phase-6-Dokumentation. Bestehende Anwendungs- und Migrationsdateien wurden nicht ersetzt.


## Fortsetzung und Download – 4. November 2026

Die GitHub-Prüfungen des Implementierungsstands wurden erneut ausgelesen: Linux- und Windows-Lauf weiterhin erfolgreich; PR #1 weiterhin offen, Draft und ungemergt. Die temporäre lokale Arbeitskopie und das letzte Downloadpaket wurden durch automatische Workspace-Bereinigung entfernt. Der Abschlussbericht wird deshalb im Testzweig gesichert; das bereinigte Paket wird direkt aus dem unveränderten Anwendungscode über den vorhandenen Windows-Prüflauf neu erstellt und als GitHub-Artefakt verfügbar gemacht. Alle bisherigen Paketfilter und die erneute Installation aus dem ZIP bleiben erhalten. Es werden keine Originaldaten importiert und keine Sites-Bereitstellung ausgeführt.

Die einzige technische Anpassung dieser Fortsetzung ist das zusätzliche Aufbewahren des bereits erzeugten ZIP im Windows-Workflow. Anwendungs-, Authentifizierungs- und Migrationsdateien bleiben unverändert. Die Betreiberanfrage bleibt vorbereitet und nicht versandt.
