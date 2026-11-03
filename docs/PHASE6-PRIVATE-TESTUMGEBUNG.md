# WEZEL NEXT – Phase 6: Private Testumgebung

Stand: 03.11.2026. **Status: eine private, unveröffentlichte Testinstanz angelegt; vor Migration und Deployment an der vorgeschriebenen Speicher-ID-Prüfung gestoppt. Keine funktionsfähige Test-URL bereitgestellt.**

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

## Technischer Blocker

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

Benötigt wird ein **unterstützter Sites-Betreiberweg**, der vor der ersten Migration die eigene Test-D1 und Test-R2 provisioniert und deren tatsächliche Kennungen sowie die Zuordnung zum neuen Projekt ausweist. Anschließend müssen sie mit der Ressourcenzuordnung des Originals abgeglichen werden. Die bestehende Benutzerfreigabe reicht für die beauftragte private Testkopie aus; es fehlt die technische Ressourcenprüfung, keine weitere allgemeine Zustimmung.

Danach: dieselbe Testprojekt-ID verwenden, die neuen Ressourcen kontrollieren, nur synthetische Daten initialisieren, owner-private bereitstellen und erst dann die verlangten vollständigen Browserabläufe dokumentieren. Ohne diesen Nachweis bleibt die Bereitstellung gesperrt. Die offizielle Schulwebsite und das ursprüngliche Sites-Projekt sind kein Ausweichziel.

[Maschinenlesbarer Nachweis](verification/phase6/isolation-check.json)
