# WEZEL NEXT – Abschließender Freigabebericht

**Stand: 03.11.2026 · Phase 3 und Phase 4 · gespeicherte Version 9**

## Entscheidungsvorlage

**Abnahmevorbereitung abgeschlossen; derzeit keine uneingeschränkte Freigabeempfehlung.** Der Quell-/Buildstand ist geprüft. Die verbliebenen betrieblichen und persönlichen Abnahmen sind unten als verbindliche Freigabebedingungen benannt. Es wurden keine Veröffentlichung, kein Deployment, kein Merge und keine produktiven Migrationen durchgeführt. Laufzeitgeheimnisse, Zugriffsrichtlinien, Benutzer und gehostete Inhalte wurden durch diese Prüfung nicht geändert.

Die aktuell verfügbare gespeicherte Version bleibt **9**; es wurde kein neuer Anwendungskandidat gespeichert. Änderungen dieses Readiness-Schritts betreffen Berichte, Nachweise und eine lokale Migrationsprobe im Entwurfs-PR. Der Anwendungscode von Version 9 wurde nicht verändert.

| Gegenstand | Verifizierter Stand |
|---|---|
| Sites-Projekt | `appgprj_6ae8542b54bc8191b9a0048a8cc1c149` |
| Gespeicherter Kandidat | Version 9, `appgprj_6ae8542b54bc8191b9a0048a8cc1c149~appgver_021728d63a2c8191bd3b449c56a6e927` |
| Anwendungscode | `cae689e03b31b1c866243b4d1e3c590ff0526135` |
| Deployment für Version 9 | `null` – unveröffentlicht |
| Sicherer Ausgangspunkt | Version 8 weiterhin gespeichert, ebenfalls ohne Deployment |
| Bisher veröffentlichter Rückfallstand | Version 7, Quellstand `acb6893f88af9a53cc357d446c1feb87abb1e9a0` |
| GitHub | PR #1 offen, Entwurf, nicht gemergt; `main` bleibt beim bisherigen Importstand |
| Privater Zugang | Zugangspolitik `custom`, Revision 1, eine zugelassene Person, keine Gruppen; nicht erweitert |

Die native Bestätigung nennt für das gespeicherte Archiv 155 Dateien und SHA-256 `5907ff1728dc8aa3bf1d87fc321d10c8b0a50e1bdbedeaea8888ac26dc3d323e`. Das lokale gzip-Paket lässt sich mit 155 regulären Dateien lesen; dessen gzip-SHA-256 ist `18d1e5ce31b965e36edc7cc2d35cac1d39a242b4d4b80995ed2825865cce6fd9`. Die Hashes beschreiben unterschiedliche Archivdarstellungen, keine behauptete Bytegleichheit zwischen lokalem gzip-Container und serverseitigem tar-Objekt.

## Prüfergebnis und Browsernachweise

Die bereits durchgeführten **130 automatisierten Prüfszenarien**, TypeScript, Build und Produktionsabhängigkeitsprüfung sind im Phase-4-Bericht dokumentiert. Der zugehörige [GitHub-CI-Lauf](https://github.com/cschro3/wezelschule/actions/runs/41606816390) wurde erneut gelesen: erfolgreich, für den vorgesehenen GitHub-Anwendungskandidaten. Diese Prüfung wird nicht als erneute Ausführung sämtlicher 130 Szenarien in dieser Readiness-Runde ausgegeben.

### Unterstützte Wiederherstellung der lokalen Vorschau

Die Arbeitskopie hatte keine `.sites-runtime/execution-profile.json` und fiel deshalb in den portablen Vinext-Startmodus. Dieser meldete einen anderen Dev-Server mit PID 14 und Verzeichnis `/site`. Das vorgesehene Projektwerkzeug `configure-execution-profile.mjs` stellte unter der vorhandenen verwalteten Linux-Umgebung das ignorierte lokale Profil wieder her. Anschließend wurden ausschließlich lokale D1-Migrationen und lokale Testdaten vorbereitet. Keine Netzwerkrechte, keine Domain und kein Hosting-Zugang wurden geändert.

Die Vorschau unter der vom Werkzeug ausgegebenen Adresse `http://terminal.local:4173/` ist wieder erreichbar. Die vollständige Entwicklungsansicht zeigte nach der Schemaeinrichtung jedoch weiterhin eine RSC-/Suspense-Warnung mit Wechsel auf Client-Rendering. Eine vollständige fehlerfreie authentifizierte Browser-End-to-End-Abnahme ist damit noch nicht belegt.

### Tatsächlich nachgeholte Layoutprüfung

Die **unveränderten React-Originalkomponenten** wurden separat in Chrome-Frames mit lesenden, synthetischen Verwaltungsfixtures gerendert. Schreibende Fixture-Anfragen waren gesperrt; es wurden keine simulierten Speichererfolge als reale CMS-Operationen ausgegeben. Die synthetische Person heißt sichtbar „Lokale Layoutprüfung“. Die Layoutdaten enthalten nur den öffentlichen Inhaltsstand und die beiden vorhandenen Schullogos, keine produktiven Benutzer oder Schülerdaten.

| Oberfläche | Desktop 1280 px | iPhone-Breite 390 px | iPad-Breite 768 px |
|---|---|---|---|
| Login | Kein horizontaler Dokumentüberlauf; Logo geladen | Kein Überlauf; Logo 170 × 85 px | Kein Überlauf; Logo geladen |
| Adminbereich | Kein Überlauf | Kein Überlauf; mobile Sidebar geöffnet und geschlossen darstellbar | Kein Überlauf |
| Website-Designer | Kein Überlauf; beide Logo-Auswahlen verfügbar | Kein Überlauf; Designer-Menü geöffnet, Logo sichtbar | Kein Überlauf |
| Kalenderverwaltung | Kein Überlauf | Kein Überlauf | Kein Überlauf |
| Kalenderimport | Kein Überlauf; Auswahlfeld vorhanden | Kein Überlauf | Kein Überlauf; Formular vollständig innerhalb der Seitenbreite |

Gemessen wurden **15 tatsächliche DOM-/Layoutzustände** mit geladenen Logos und sichtbaren Überschriften. Die Inhaltsbreite kann wegen der Chrome-Scrollbar um 15 px unter der Framebreite liegen. Dies ist eine responsive Chrome-Prüfung, keine Behauptung einer Safari-, Touch- oder physischen iPhone-/iPad-Abnahme.

Zusätzlich bedient: Passwortanzeige bei leerem Feld, Wechsel zur Passwort-vergessen-Ansicht, mobile Admin- und Designer-Sidebar. Das Importfeld akzeptiert `.xlsx,.csv,.ics`; ohne Datei und Datenschutzbestätigung bleibt die Importaktion gesperrt. Es wurden keine persönlichen Passwörter, TOTP-Geheimnisse oder Wiederherstellungscodes im Browser verwendet. Der vollständige authentifizierte Browser-Import bleibt offen; die tatsächlichen Server-Speicherabläufe sind durch die vorhandene Worker-Integrationssuite geprüft.

Nachweise:

- [Maschinenlesbare Layoutmessungen](verification/release-layout-results.json)
- [Login in Smartphone-Breite](verification/release-login-iphone.jpg)
- [Geöffnete Admin-Sidebar](verification/release-admin-iphone.jpg)
- [Geöffnetes Designer-Menü](verification/release-designer-iphone.jpg)
- [Kalenderimport Desktop](verification/release-import-desktop.jpg)
- [Kalenderimport Tablet](verification/release-import-ipad.jpg)

## Erhalt der bestehenden Daten

Die gehostete D1-Datenbank wurde ausschließlich über lesende Schnittstellen geprüft. Sie enthält weiterhin die neun bisherigen fachlichen Tabellen; die neuen `auth_*`- und Kalendertabellen sind dort noch nicht vorhanden.

| Bestand | Zu Beginn | Am Ende der Bestandsprüfung | Aussage |
|---|---:|---:|---|
| Inhalte insgesamt | 26 | 26 | Alle bestehenden IDs weiterhin vorhanden |
| Seiten / Dokumente | 19 / 7 | 19 / 7 | Kein Inhalt durch die Prüfung entfernt |
| Veröffentlicht / Entwurf | 15 / 11 | 15 / 11 | Keine Freigabe durch die Prüfung ausgelöst |
| Veranstaltungen | 0 | 0 | Kein künstlicher Termin in den gehosteten Bestand importiert |
| Benutzer | 1 aktiver SYSTEM_ADMIN | 1 aktiver SYSTEM_ADMIN | Vollständig gelesener Benutzerdatensatz unverändert |
| Medien | 15, alle freigegeben | 15, alle freigegeben | Vollständig gelesene Metadaten unverändert |
| Einstellungen | 2 Datensätze | 2 Datensätze | Aktive öffentliche Design-/Branding-Konfiguration unverändert |

Die beiden aktiven Logo-Dateien wurden erneut über die freigegebene öffentliche Dateiroute gelesen. Größe und SHA-256 blieben identisch: dunkler Untergrund `a36c865873fabc834a3422fba1332aeb8e5313e852ad47ef1f460d4d3bc2d68b`, heller Untergrund `f12b34de9130f526d61784f71246d4362497e843c65754d77475b77f06dc2bad`.

**Beobachtete parallele Inhaltsänderung:** `/schulsozialarbeit` wechselte während der Prüfung von Version 3 auf 6; der Textkörper ist im zuletzt gelesenen Stand leer. Es wurde von dieser Prüfung keine entsprechende Schreibaktion ausgeführt. Dieser neue Bestand wird nicht zurückgesetzt. Redaktionell prüfen, ob die Textinformation bewusst durch ein Bild ersetzt wurde und als zugänglicher Text weiterhin benötigt wird.

Die Datenansicht kürzt einen langen Einstellungswert und einen langen Inhaltswert. Deshalb wird keine vollständige byteweise Prüfung aller privaten Rohdaten oder sämtlicher R2-Objekte behauptet. Der vollständige veröffentlichte Inhalt wurde zusätzlich über die Inhalts-API gelesen: gleiche IDs und gleiche Einstellungen, mit der genannten parallelen Seitenänderung. Vor dem tatsächlichen Rollout muss eine neue konsistente Sicherung des dann aktuellen Bestands entstehen; keine ältere Inhalts-JSON in die laufende Datenbank importieren.

## E-Mail-Anbindung: konkret vorbereitet

Die Anwendung verwendet den vorhandenen Resend-HTTPS-Adapter unter `lib/security/mail.ts`, keine SMTP-Integration. Der geschützte Laufzeitabruf zeigt derzeit nur `OWNER_EMAIL`; alle folgenden neuen Werte fehlen noch. Es wurden keine Laufzeitwerte geändert.

| Einstellung | Benötigter Wert / Prüfung | Status |
|---|---|---|
| `AUTH_BASE_URL` | Kanonischer Ursprung `https://wezel-next.christoph-schr816017.chatgpt.site` ohne Schrägstrich am Ende | Vorbereitet, noch nicht gesetzt |
| `AUTH_MODE` | Zunächst `migration`, bestehender Zugang bleibt bis zur bewussten Umschaltung erhalten | Vorbereitet, noch nicht gesetzt |
| `BETTER_AUTH_SECRET` | Mindestens 32 kryptografisch zufällige Bytes aus dem freigegebenen Geheimnis-/Passwortmanager; einmalig erzeugen und verschlüsselt sichern | Fehlt |
| `AUTH_EMAIL_FROM` | Von Schule/Schulträger freigegebener Absender einer tatsächlich verifizierten Versanddomain | Entscheidung und Domainnachweis fehlen |
| `RESEND_API_KEY` | Geschützter Schlüssel mit Sending access, möglichst auf genau diese Versanddomain beschränkt | Fehlt |
| `OWNER_EMAIL` | Bestehende geschützte Eigentümerzuordnung erhalten; Operator bestätigt Übereinstimmung mit dem vorhandenen Konto | Vorhanden, Geheimniswert nicht ausgelesen |
| `CALENDAR_ICS_HOSTS` | Optional; nur bewusst freigegebene zusätzliche öffentliche Hosts | Für Standardhosts nicht erforderlich |

Für die Domainverifizierung werden die tatsächlich von Resend angegebenen SPF-/DKIM-Einträge und berechtigter DNS-Zugang benötigt. Keine DNS-Einträge erfinden und keinen bestehenden SPF-Eintrag ungeprüft ersetzen. Domain-/DNS-Änderungen sowie Anbieterfreigabe erfolgen erst nach gesonderter Zustimmung. Bei einem fremden Mailanbieter wäre eine geprüfte Adapteränderung nötig; SMTP-Zugangsdaten lassen sich nicht unverändert in diesen Adapter eintragen.

Für Sicherheitsnachrichten Tracking deaktivieren. Nach der später genehmigten Konfiguration tatsächliche Einladung und Passwort-Reset an eine ausdrücklich festgelegte, kontrollierte Empfängeradresse senden; Zustellung in Posteingang/Spam, Absender, korrekten HTTPS-Ursprung, Tokenablauf, Einmalverwendung und Sitzungsentzug prüfen. Bisher bestand lediglich der kontrollierte Transporttest, keine echte Zustellprüfung. Echte Schlüssel und Zugangsdaten werden ausschließlich geschützt hinterlegt, nicht über Chat oder Git.

Primärquellen: [Resend-Domainverifizierung](https://resend.com/docs/dashboard/domains/introduction), [domainbeschränkte Sending-access-Schlüssel](https://resend.com/changelog/new-api-key-permissions).

## Sichere persönliche Administratorübernahme

Für einen vollständigen Browserlauf vor einem Site-Rollout kann der zuständige Operator die vorhandene portable Arbeitskopie auf einem eigenen lokalen Rechner unter localhost mit einem ausdrücklich lokalen Testkonto prüfen; diese zusätzliche Abnahme ist hier nicht erfolgt. Es wird dafür keine neue Site angelegt.

Die persönliche Übernahme wird **jetzt vorbereitet, nicht durchgeführt**. Sie ist erst nach genehmigtem privaten Code-Rollout mit angewendeter additiver Migration erreichbar. Der bisherige verifizierte Plattformzugang bleibt in diesem ersten Schritt erhalten. Kein öffentliches Setup und kein Standardpasswort werden aktiviert.

1. Eigentümer meldet sich mit seinem bestehenden berechtigten Sites-/ChatGPT-Konto an und öffnet `/account/security`. Kontozuordnung und gleiche CMS-Benutzer-ID prüfen.
2. Eigentümer gibt sein selbst gewähltes Passwort selbst ein: mindestens 14 Zeichen, bevorzugt ein längerer individueller Passwortmanager-Eintrag. Keine Werte im Bericht, Chat oder durch die Assistenz ablesen lassen.
3. In `/login` den neuen Zugang prüfen. Authenticator einrichten; QR nur vom Eigentümer in seiner App scannen, sechsstelligen 30-Sekunden-TOTP bestätigen und automatische Uhrzeit am Gerät sicherstellen.
4. Zehn Einmal-Wiederherstellungscodes unmittelbar getrennt vom Passwort verschlüsselt oder physisch sicher verwahren. Keine Screenshots davon an den Prüfbericht anhängen.
5. In einem zweiten Browser-/Privatfenster Passwort und TOTP prüfen. Bei einem ausdrücklich vereinbarten Wiederherstellungstest einen Code verwenden, diesen auf der Sicherung als verbraucht markieren und die verbleibenden neun Codes schützen. Es gibt in Version 9 keine sichtbare Verwaltungsfläche zum erneuten Anzeigen bereits verworfener persönlicher Codes.
6. Echte Reset-Mail prüfen; Wiederanmeldung, Session-Invalidierung und weiterhin gleiche Rollen bestätigen. Die bestehende vertrauenswürdige Plattform-Sitzung bis zum erfolgreichen Abschluss behalten.
7. Nach erfolgreicher persönlicher Abnahme und bestätigter Sicherung in der Kontosicherheit **gesondert** „Verbindlich auf Passwort und MFA umstellen“ auslösen. Das ist eine weitere sicherheitswirksame Entscheidung, keine automatische Folge des Code-Deployments.
8. Anschließend im getrennten Fenster anonymen Zugriff, alleinige Plattform-Identität, Autor-/Redaktionsrollen und Logout kontrollieren. Ein zweiter realer Systemadmin bzw. organisatorischer Wiederherstellungsverantwortlicher muss bewusst benannt werden; es wurde kein zusätzliches Konto angelegt.

Die äußere private Sites-Zugangskontrolle bleibt bestehen. Eine per E-Mail eingeladene Person erhält dadurch noch keinen Zugang zur privaten Site. Eine Ausweitung dieser Berechtigung benötigt eigene Zustimmung. Solange der Eigentümer das einzige Administratorkonto ist, bilden seine gesicherten Wiederherstellungscodes und der dokumentierte Operator-Weg die besonders wichtige Wiederherstellungsgrenze.

## Verbindlicher Sicherungs-, Migrations- und Rolloutablauf

### Gate A – Voraussetzungen vor jeder produktiven Aktion

- Eigentümer erteilt ausdrücklich die Freigabe für **Version 9 auf der bestehenden privaten Site**. Das ist keine Freigabe der offiziellen Schul-Domain, keiner öffentlichen Zugriffsöffnung und keines PR-Merges.
- Vollständiger authentifizierter Browserlauf, die RSC-Warnung und Safari-/Geräteprüfung sind geklärt oder eine ausdrücklich dokumentierte Entscheidung zu verbleibenden Abnahmerisiken liegt vor.
- Schul-/Betriebsverantwortliche bestätigen Versanddomain, Geheimnisablage, zuständige Person, Sicherungszugang und Wiederherstellungszuständigkeit. Reale Konfigurationswerte sind geschützt verfügbar.
- Kurzes Wartungsfenster und organisatorische Pause für Inhalts-/Dateiänderungen vereinbaren. Keine nicht implementierte Wartungs- oder Read-only-Umgebungsvariable voraussetzen.

### Gate B – vollständige Sicherung des dann aktuellen Bestands

1. Aktiven Code-/Versionsstand, Zugriffspolitik und Runtime-Revision erfassen. Laufzeitgeheimnisse verschlüsselt separat sichern; sie gehören nie in Repository oder unverschlüsselten Bericht.
2. Berechtigter Operator exportiert die gesamte tatsächliche D1-Datenbank konsistent einschließlich Benutzern, später vorhandenen Auth-Tabellen, Sitzungen, Einstellungen, Revisionen und Migrationsstand. Normales CMS-Backup und die begrenzte Tabellenansicht ersetzen dies nicht.
3. R2 vollständig in ein gesichertes Ziel kopieren: alle Objektschlüssel, Größen, Metadaten und Prüfsummen, inklusive unreferenzierter bzw. nicht öffentlicher Dateien. Keine Synchronisierung mit Löschoption gegen den Quell-Bucket.
4. Manifest, Zeitpunkt, Dateianzahl/-größen und SHA-256 des Exports protokollieren; Archiv verschlüsseln und Zugriff begrenzen. D1-Snapshot und R2-Manifest müssen zum vereinbarten Änderungsstopp passen.
5. D1-Export und R2-Kopie in eine getrennte Wiederherstellungsumgebung zurückspielen; Integrität, Fremdschlüssel, IDs, Versionsnummern und Medienreferenzen prüfen. Ohne tatsächlich erfolgreichen Restore-Nachweis kein Start der Übernahme.

Für Betreiber mit bestätigtem direkten Cloudflare-Zugang ist beispielsweise `wrangler d1 export <ECHTE_DATENBANK> --remote --output <GESCHUETZTER_EXPORTPFAD>` geeignet. Die generierte lokale Wrangler-Konfiguration enthält lediglich eine Platzhalter-ID und darf dafür nicht verwendet werden. In der aktuellen Sites-Verbindung ist kein vollständiger D1-/R2-Export-/Restore-Zugang verfügbar; der zuständige Hosting-Operator muss ihn bereitstellen bzw. den Vorgang ausführen. D1 Time Travel kann nach Prüfung der konkreten Verfügbarkeit zusätzlich einen Bookmark sichern, ersetzt jedoch keine R2-/Geheimnissicherung.

Cloudflare weist darauf hin, dass ein D1-Export Datenbankanfragen blockiert. Dies im Wartungsfenster einplanen. Für R2-Bulk-Kopien unterstützt der Anbieter beispielsweise rclone; erforderliche Konten/Objektzugänge müssen auf die passenden Ressourcen begrenzt sein. Es wurden keine solchen produktiven Aktionen ausgeführt.

Primärquellen: [D1 Export](https://developers.cloudflare.com/d1/best-practices/import-export-data/), [D1 Time Travel](https://developers.cloudflare.com/d1/reference/time-travel/), [R2/rclone](https://developers.cloudflare.com/r2/examples/rclone/).

### Gate C – additive Migration und privater Code-Rollout

1. Nur den bestätigten bestehenden Projekt-Identifier und die gespeicherte Version 9 verwenden; keinen neuen Build aus ungeprüften späteren Commits und keine neue Site erstellen.
2. Vorhandene Migrationen 0000/0001 anhand des tatsächlichen Standes bestätigen. Die noch ausstehenden Migrationen sind `0002_security_login.sql` und `0003_worried_invisible_woman.sql`. Im vorgesehenen Sites-Deployment einmalig anwenden lassen; nicht zusätzlich manuell gegen dieselbe Datenbank ausführen.
3. Die Migrationen erstellen Auth-/Kalendertabellen, ergänzen Ereignisfelder/Indizes und Kategorienamen. Keine Benutzer-/Inhalts-Seeds, keine Demo-Termine und keine Snapshot-JSON in die laufende Datenbank importieren.
4. Nach Migration und Worker-Übernahme alle vorab erfassten Benutzer-/Inhalts-/Medien-IDs, Rollen, Versionsstände und Einstellungen mit B0 vergleichen; neue Kategorien und Tabellen getrennt davon prüfen. Bei Fehler zunächst tatsächlichen Schema-/Deploymentstand lesen, nicht blind erneut starten.
5. Bisherigen privaten Zugang erhalten. Startseite, Logos, Unterseiten, Downloads und bestehende ChatGPT-Admin-Anmeldung prüfen. Anschließend Mail und persönliche Übernahme im Übergangsmodus abnehmen.
6. Nach erfolgreicher persönlicher Übernahme einen weiteren zusammenpassenden verschlüsselten D1-/R2-/Secret-Sicherungsstand B1 erstellen. Erst danach die gesondert bestätigte lokale Loginpflicht aktivieren und wieder prüfen.

Ein Merge von PR #1 ist ein eigener Vorgang und wurde nicht freigegeben. Für ein technisches Deployment ist kein stillschweigender Merge erforderlich. Die offizielle Schul-Domain bleibt von dieser privaten Übernahme getrennt.

### Gate D – Abbruch und Rollback

Sofortiger Abbruch bei verlorenem Administratorzugang, fehlenden Bestands-IDs, unberechtigter Veröffentlichung interner Inhalte, nicht funktionierender Mail-Wiederherstellung oder Migrationsfehlern.

- Zuerst weitere schreibende Vorgänge organisatorisch stoppen und den tatsächlichen Stand protokollieren.
- Bei reinem Codefehler nach ausdrücklicher Operatorentscheidung die bisherige gespeicherte Version 7 unter derselben privaten Zugriffspolitik wieder übernehmen. Version 8 war nicht veröffentlicht und ist deshalb nicht der bewährte Live-Rückfallstand.
- Additive Auth-/Kalendertabellen nicht ungeprüft löschen. Ein Code-Rollback setzt Datenbankzustand und Auth-Policy nicht zurück. Den weiterhin vertrauenswürdigen Plattformzugang nur innerhalb der erhaltenen privaten Sites-Grenze verwenden.
- Bei echter Datenbeschädigung aus dem verifizierten passenden B0/B1-Sicherungsstand wiederherstellen; konsistentes Auth-Secret und R2-Objekte mitnehmen. Zuerst den Fehlerstand selbst sichern. Ein Restore kann nach dem Sicherungszeitpunkt erfolgte Änderungen verlieren; kein pauschales Restore ohne Prüfung.
- Ein Wiederherstellungsziel ist der bestätigte B0-Stand vor dem Wartungsfenster. Es wird keine garantierte RTO/RPO-Zahl behauptet, solange kein produktiver Betreiber-Restore vermessen wurde.

## Tatsächliche zusätzliche Wiederherstellungsprobe

`tests/release-migration-rehearsal.py` wurde gegen isoliertes SQLite und zwei lokale Logo-Objektkopien ausgeführt. Ausgangsschema 0000/0001 mit einem synthetischen bestehenden Konto, vier Inhalten einschließlich zwei Terminen, aktueller öffentlicher Designkonfiguration und Designrevisionen. Danach SQLite-Backup erzeugt, 0002/0003 angewendet und in ein getrenntes Ziel zurückgespielt.

Ergebnis: alle alten Spaltenwerte unverändert, Benutzer-/Inhalts-/Medien-IDs erhalten, `integrity_check=ok`, keine Fremdschlüsselverletzungen, wiederhergestellte Daten identisch, beide Dateigrößen und SHA-256 unverändert. Das ist eine bestandene lokale Probe und **kein** behaupteter vollständiger produktiver D1-/R2-Restore.

[Maschinenlesbares Ergebnis](verification/release-rehearsal.json). Ohne zusätzliche Datenquellen lässt sich die Probe mit synthetischer Konfiguration und dem vorhandenen Favicon durch `python tests/release-migration-rehearsal.py` reproduzieren; es erfolgt keinerlei Netzwerk-/Produktionszugriff.

## Verbleibende Risiken und Freigabebedingungen

| Risiko / offener Nachweis | Bewertung | Vor verbindlicher Freigabe |
|---|---|---|
| Vollständiger authentifizierter Browserablauf; Dev-RSC-Suspense-Warnung | Hoch | Ursache klären und vollständigen Assistenten mit sicherem Testzugang durchlaufen |
| Safari auf iPhone/iPad, Tastatur, Dateiauswahl und Touch | Offen | Echte Geräte bzw. unterstützte entsprechende Browserabnahme nachholen |
| Reale Mailzustellung und Domainfreigabe | Hoch | Versanddomain/Absender, Sending-access-Key und kontrollierte Zustelltests |
| Persönliche Administratorübernahme, TOTP und Wiederherstellung | Hoch | Benutzergeführt nach genehmigtem privaten Übergangsrollout; bestehenden Zugang bis dahin erhalten |
| Vollständiges produktives D1-/R2-Backup und Operator-Restore | Hoch | Berechtigten Zugang sowie tatsächlichen Sicherungs-/Restore-Nachweis bereitstellen |
| Parallele Inhaltsänderung Schulsozialarbeit, leerer Textkörper | Redaktionell | Aktuellen Inhalt und zugängliche Textinformation bestätigen; nicht zurücksetzen |
| Bildrechte und abschließende rechtliche Angaben | Redaktionell | Zuständige Schulverantwortliche prüfen; technische Abnahme erteilt keine Inhaltsfreigabe |
| Private äußere Sites-Sperre | Betriebsgrenze | Einladungen und externe Kalenderabos benötigen geeigneten Site-Zugang; keine automatische Öffnung |
| RRULE-Teilmenge, manueller ICS-Abruf, kein OAuth/Timer | Bekannte Funktionsgrenze | Im Kalender-Handbuch dokumentiert; bewusste Abnahme dieses Umfangs |

**Für die nächste Entscheidung benötigt:** bestätigter Versandabsender/Versanddomain und DNS-Zuständigkeit, geschützter Resend-Sendeschlüssel, zugelassene Geheimnisablage, Betreiberzugang für vollständige Sicherung/Wiederherstellung sowie die persönliche Browser-/MFA-Abnahme. Keine dieser fehlenden Voraussetzungen wurde als erledigt markiert.
