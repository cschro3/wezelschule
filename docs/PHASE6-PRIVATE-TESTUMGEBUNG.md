# WEZEL NEXT – Phase 6: Private Testumgebung

Stand: 03.11.2026. **Status: bestehende private Testinstanz erneut geprüft; auch der alternative Isolationsnachweis ist mit den verfügbaren Plattforminformationen nicht ausreichend belegt. Vor Migration und Deployment gestoppt. Keine funktionsfähige Test-URL bereitgestellt.**

## Gesicherter Projektstand

| Gegenstand | Tatsächlich geprüft |
|---|---|
| Originalprojekt | `appgprj_6ae8542b54bc8191b9a0048a8cc1c149` |
| Originalversion | Version 9 weiterhin ohne Deployment; Quelle `cae689e03b31b1c866243b4d1e3c590ff0526135` |
| Gewählter GitHub-Stand | `phase5-testbetrieb`, Commit `c68517161c6c5b6142087707c74eadc73abb41a7` |
| Zugehörige CI | [Erfolgreicher Lauf 41623705090](https://github.com/cschro3/wezelschule/actions/runs/41623705090), erneut verifiziert |
| Neue Testprojekt-ID | `appgprj_6ae9c14e16008191b530e52d6d4afac8` |
| Zusätzlich erstellte Sites | Genau eine |
| Testprojekt-Versionen | 0; kein Quellpaket gespeichert, kein Deployment gestartet |
| Zugriff | `custom`, Revision 1, genau ein explizit erlaubtes Eigentümerkonto, keine Gruppen, keine externen Besucher |
| Kontozuordnung | Das allein erlaubte Konto stimmt mit dem berechtigten Eigentümerkonto des Originals überein; keine E-Mail oder Konto-ID im Bericht |
| Runtime-Konfiguration der Testinstanz | Revision 0, keine Variablen oder Geheimnisse gesetzt |
| PR #1 | Weiterhin offen, Entwurf, ungemergt; Kopf `29909114f7759233469f142cabf86718beabba76` |
| `main` | Unverändert `aba8a0ff17c04d37df85bcc367d912178ae772f0` |

Die neue ID wurde unmittelbar in einer separaten lokalen `.openai/hosting.json` gespeichert. Die Original-ID wurde dort nicht übernommen. Bei einer Fortsetzung ist **dieselbe neue Instanz wiederzuverwenden**; keine zweite Testkopie erstellen.

## Aktuelle alternative Isolationsprüfung

Die zuletzt erteilte eingeschränkte Freigabe ersetzt die Vorabprüfung physischer Speicher-IDs durch einen gleichwertigen, unterstützten Nachweis. **Fehlende physische IDs allein sind damit nicht mehr der Sperrgrund.** Verbindlich bleiben eigene Testressourcen, fehlender Schreibzugriff auf die Originalressourcen und ein Nachweis vor jeder Migration bzw. Bereitstellung.

| Nachweis | Tatsächliches Ergebnis | Bewertung |
|---|---|---|
| Richtiges bereits angelegtes Testprojekt | `appgprj_6ae9c14e16008191b530e52d6d4afac8`, Version 0, keine Live-URL | Bestätigt |
| Private Zugriffspolitik | `custom`, Revision 1, Eigentümerrolle, eine erlaubte Person, keine Gruppen; gleiches berechtigtes Eigentümerkonto | Bestätigt |
| Quellzweig | `phase5-testbetrieb` unverändert bei `c68517161c6c5b6142087707c74eadc73abb41a7` | Bestätigt |
| Neue Site bzw. erweiterter Zugriff | Keine weitere Site und keine Zugriffsänderung | Bestätigt |
| Lesende Datenbankauskunft der Testinstanz | Keine gemeldete D1-Bindung und keine Tabellen | Belegt keine bereits zugewiesene eigene D1 |
| Automatische Provisionierung durch Sites | Der unterstützte Ablauf verwaltet Storage-Bindings und Ressourcenbereitstellung | Allgemeine Funktionsbeschreibung, kein ausreichender Nachweis projektübergreifender Schreibsperren |
| Verbindliche Betreiberzusicherung der D1-/R2-Trennung | In den tatsächlich geprüften Unterlagen und Werkzeugantworten nicht gefunden | Nicht bestätigt |
| Technischer Nachweis der Storage-Zuordnung und Rechtebegrenzung | Keine entsprechende prüfbare Antwort oder Vorab-Prüffunktion in der verfügbaren Schnittstelle | Nicht bestätigt |
| Gesamtentscheidung | Kein gleichwertiger positiver Isolationsnachweis | Vor Migration und Deployment stoppen |

### Zusätzlich geprüfte unterstützte Informationen

Neben den nativen Projekt-, Zugriffs- und Datenbankantworten wurden die installierte Plattformdokumentation und folgende offizielle Betreiberquellen geprüft:

- [Creating and using ChatGPT Sites](https://help.openai.com/en/articles/20001339-creating-and-using-chatgpt-sites): beschreibt private Sites, Speichergrenzen und den Umstand, dass eine Veröffentlichung die Datenbank bereits vor dem Livegang verändern kann.
- [Manage a site](https://learn.chatgpt.com/docs/sites/managing-a-site): beschreibt die Zuordnung des Quellprojekts zum Hosting und logische Storage-Bindings im Manifest.
- [Data and connections](https://learn.chatgpt.com/docs/sites/data-and-connections): beschreibt D1 für Datensätze und R2 für Dateien.
- [Managing ChatGPT Sites for your workspace](https://help.openai.com/en/articles/20001338-managing-chatgpt-sites-for-your-workspace): beschreibt Zugriffs-, Freigabe- und Workspacekontrollen.

Diese geprüften Aussagen liefern für sich keinen belastbaren Nachweis, dass die konkrete Testinstanz eigene Ressourcen erhält und keinen Schreibzugriff auf die Originalspeicher besitzt. Das ist eine **Grenze der hier verfügbaren Nachweise**, keine Feststellung einer tatsächlich vorhandenen Datenvermischung und keine Behauptung, dass Sites grundsätzlich keine Isolation unterstützt.

Unterschiedliche Projekt-IDs, gleiche bzw. unterschiedliche logische Bindingnamen, private Besucherrechte oder ein späterer Vergleich des Datenbestands werden ausdrücklich nicht als Ersatz ausgegeben. Ein Testdeployment oder Testschreibvorgang zur nachträglichen Prüfung wurde ebenfalls nicht ausgeführt, weil der Nachweis davor verlangt ist.

Die vorherige Aussage, eine weitere allgemeine Zustimmung würde die Fortsetzung ermöglichen, war zu weitgehend. Die Zustimmung liegt vor; der belastbare technische bzw. betreiberseitige Nachweis fehlt weiterhin.

### Konkrete Anfrage an den Sites-Betreiber

Bitte über einen unterstützten Weg bestätigen oder nachweisen, dass für das Testprojekt `appgprj_6ae9c14e16008191b530e52d6d4afac8` eigenständige D1-/R2-Ressourcen provisioniert werden und weder dessen Migrationen noch dessen Worker auf die Speicher des Originalprojekts `appgprj_6ae8542b54bc8191b9a0048a8cc1c149` schreiben können. Benötigt werden entweder eine verbindliche Dokumentation dieser projektbezogenen Berechtigungsgrenze oder eine überprüfbare Ressourcen-/Rechtezuordnung vor der ersten Migration. Physische IDs sind bei gleichwertigem anderem Nachweis nicht zwingend.

Diese Anfrage ist nur vorbereitet. Es wurde keine Supportnachricht versandt.

## Ursprüngliche Vorab-ID-Prüfung – historischer Stand

Private Sites-Projekte werden unterstützt. Die hier verlangte **Vorabprüfung anhand tatsächlicher physischer Speicherkennungen** lässt sich mit der verfügbaren Verbindung jedoch nicht abschließen:

1. Der lesende Datenbankabruf der neuen Testinstanz liefert `bindings: []`, `selected_binding_name: null` und `tables: []`.
2. Beim Original werden lediglich der logische Bindingname `DB` und die neun vorhandenen Tabellennamen ausgegeben. Eine physische D1-UUID ist nicht Bestandteil der Antwort.
3. Die Projekt- und Erstellungsantworten enthalten ebenfalls keine tatsächliche D1-UUID und keine R2-Bucket-/Accountkennung. Die verfügbaren nativen Werkzeuge bieten keinen getrennten Vorab-Provisionierungs- oder Ressourceninspektionsaufruf für diese Kennungen.
4. Die unterstützte Sites-Bereitstellung übernimmt die Storage-Anbindung und führt ausstehende Datenbankmigrationen vor dem Hochladen des Workers aus. Ein Deployment als bloße Probe würde deshalb die vorgeschriebene Reihenfolge umgehen.

Die logischen Einträge `d1: "DB"` und `r2: "BUCKET"` sowie die lokale Platzhalter-UUID sind **kein Nachweis** der tatsächlichen Ressourcenidentität. Aus unterschiedlichen Projekt-IDs allein wurde kein bestätigter Speicher-ID-Vergleich abgeleitet.

Deshalb wurde **kein Deployment ausgelöst, keine gehostete Migration ausgeführt und kein öffentlicher Ersatz angelegt**. Die bekannte registrierte Zieladresse wird nicht als funktionierende Test-URL ausgegeben: `current_live_url` und `current_preview_url` sind beide `null`.

## Prüfliste dieser Phase

| Funktion / Anforderung | Ergebnis | Fehler oder Grenze | Priorität | Nächster erforderlicher Schritt |
|---|---|---|---|---|
| Geprüften Quellstand auswählen | Bestanden | Keine | – | Commit für spätere Übernahme festhalten |
| Genau eine zusätzliche Instanz | Bestanden | Keine | – | Neue ID wiederverwenden |
| Nur berechtigter Eigentümerzugriff | Bestanden | Keine Erweiterung vorgenommen | – | Bei jeder späteren Bereitstellung erneut bestätigen |
| Unterschiedliche Projekt-IDs | Bestanden | Kein Ersatz für den physischen Speichernachweis | P1 | Tatsächliche Storage-Kennungen prüfen |
| Eigene Test-D1 vor Migration bestätigen | Blockiert | Keine D1-UUID / noch keine gemeldete Testbindung | Blocker | Unterstützte Vorab-Provisionierung und ID-Auskunft |
| Eigene Test-R2 bestätigen | Blockiert | Keine tatsächliche Bucket-/Accountkennung | Blocker | Ressourcenübersicht des Sites-Betreibers |
| Synthetische Daten und Testkonten anlegen | Nicht ausgeführt | Kein freigegebener Zielspeicher nachgewiesen | Abhängig | Erst nach bestandener Isolation |
| Login und Logout im echten Browser | Nicht ausgeführt | Neue Instanz nicht bereitgestellt | Abhängig | Nach zulässiger Bereitstellung |
| Persönliches Passwort / TOTP / Wiederherstellung | Vorbereitet, nicht eingerichtet | Kein laufendes Testsystem | Abhängig | Benutzergeführt, keine Geheimnisse im Chat |
| Admin, Designer, Logo, Header, Seiten, Nachrichten | Nicht an der neuen Instanz getestet | Keine laufende Anwendung | Abhängig | Vollständige Browserabnahme nachholen |
| Mediathek und Dokumente | Nicht an der neuen Instanz getestet | Keine bestätigte R2-Anbindung | Abhängig | Nur eigene synthetische Testmedien verwenden |
| Excel-/CSV-/ICS-Import | Nicht an der neuen Instanz getestet | Keine bestätigte D1-Anbindung | Abhängig | Echte Datei-Uploads mit Testdaten durchlaufen |
| Entwurf, Freigabe und Testpublikation | Nicht ausgeführt | Kein isolierter Zielspeicher nachgewiesen | Abhängig | Ausschließlich innerhalb bestätigter Testinstanz |
| Mobile Navigation / responsive Gestaltung | Nicht an der neuen Instanz getestet | Keine Test-URL | Abhängig | Browser-/Geräteprüfung |
| RSC-/Suspense-Warnung | Für neue Instanz nicht verifiziert oder behoben | Vorherige Entwicklungswarnung bleibt offen | P1 | Nach freigegebener Testbereitstellung untersuchen; Sicherheitsmodell erhalten |
| Original schützen | Bestanden für durchgeführte Aktionen | Keine gehosteten Schreibaktionen am Original | – | Schutzgrenze beibehalten |

Die bisherigen automatisierten Prüfungen und Browsernachweise aus Phase 5 sind weiterhin separat dokumentiert. Sie werden **nicht** als neue Browserergebnisse dieser noch nicht bereitgestellten Instanz ausgegeben.

## Sicherer Weg zur persönlichen Testadministration

Nach bestätigter Storage-Isolation wird der geprüfte Anwendungsstand in genau diese Testinstanz übernommen. Nur neue synthetische Testinhalte und frisch angelegte Testkonten sind zulässig; keine produktiven Konten, Passwort-Hashes, Sitzungen oder privaten Inhalte übernehmen.

Der äußere Sites-Zugang bleibt auf das Eigentümerkonto beschränkt. Der erste lokale Testadministrator wird über den bestehenden verifizierten Eigentümerzugang kontrolliert eingerichtet. Das persönliche Passwort, der TOTP-QR-Code und Wiederherstellungscodes werden ausschließlich in der geschützten Benutzeroberfläche persönlich gesetzt bzw. übernommen. Eine verbindliche lokale Loginpflicht wird erst nach erfolgreicher persönlicher Anmeldung und gesichertem Wiederherstellungsweg aktiviert. Keine fest eingebauten Passwörter und kein öffentlicher Setup-Modus.

Bis dahin wurden weder Konten noch Auth-Geheimnisse angelegt. Es wurde keine echte E-Mail-Anbindung konfiguriert, keine Mail versandt und keine kostenpflichtige externe Ressource erstellt.

## Voraussetzung für die Fortsetzung

Benötigt wird ein unterstützter, belastbarer Betreiber- oder technischer Nachweis eigener Testressourcen und fehlender Schreibberechtigung auf die Originalspeicher. Eine entsprechende Ressourcen-/Rechtezuordnung oder verbindliche Plattformzusicherung kann die früher geforderten physischen IDs ersetzen. Eine weitere allgemeine Benutzerfreigabe ist dafür weder erforderlich noch ausreichend.

Erst nach positivem Nachweis: dieselbe bestehende Testprojekt-ID verwenden, ausschließlich neue synthetische Testdaten und Konten anlegen, owner-private bereitstellen und die vollständigen Browserabläufe durchführen. Bis dahin bleiben Migration und Deployment gesperrt. Originalprojekt, Version 9, Zugriffspolitik, offizielle Schulwebsite und PR #1 wurden durch diese alternative Prüfung nicht verändert.

[Maschinenlesbarer Nachweis](verification/phase6/isolation-check.json)
