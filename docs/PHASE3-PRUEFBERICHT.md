# WEZEL NEXT – Phase 3: Prüf- und Übergabebericht

Stand: 03.11.2026 · Bestehendes Sites-Projekt · Gespeicherte Version 8

## Ergebnis und Veröffentlichungsstand

Die Erweiterung ist implementiert, gebaut, mit isolierter D1-/R2-Testumgebung geprüft und als **Version 8 ohne Veröffentlichung** gespeichert. Die bestehende private Website, ihre produktive Datenbank, Benutzerkonten, veröffentlichten Inhalte und Domainzuweisungen wurden nicht verändert.

- Quellstand: `a904cacc5a8151731d09b973b0c3400ddc54fd43`.
- Bisherige aktive Version: 7. Kein Deployment von Version 8 gestartet.
- Vorbereiteter Login-Pfad: `/login`. **Noch keine live aktivierte neue Login-URL.**
- Bestehender Adminbereich: https://wezel-next.christoph-schr816017.chatgpt.site/admin – weiterhin mit dem bisherigen Zugang.
- Nach genehmigter Übernahme: Login unter https://wezel-next.christoph-schr816017.chatgpt.site/login und persönliche Kontosicherheit unter `/account/security`.

Die endgültige Freigabe erfolgt erst nach Mail-Konfiguration, persönlicher Administrator-Übernahme und Browser-Abnahme. Eine vollständig produktiv abgenommene Umstellung wird ausdrücklich noch nicht behauptet.

## Implementierte Funktionen

- Eigenständige Passwortanmeldung mit Better Auth 1.7.15; keine öffentliche Registrierung. Dunkelblaue Loginseite mit zentral konfiguriertem Schullogo, Passwortanzeige, Fehlermeldungen, Passwort-Reset und MFA-Schritt.
- Argon2id mit 19 MiB, zwei Durchläufen, einem parallelen Strang und individuellem zufälligem Salt. Hash-Ausgabe zusätzlich mit unabhängiger nativer Node-Argon2-Implementierung abgeglichen.
- Serverseitige Sitzungen, HttpOnly-Cookies, Secure unter HTTPS, SameSite=Lax. Acht Stunden maximale Laufzeit und 30 Minuten Inaktivitäts-Timeout. Keine Session-Bearer in JSON-Antworten oder LocalStorage.
- Persistente Limits pro Client sowie zusätzliche kontobezogene Sperre nach fehlgeschlagenen Passwortversuchen. CSRF-Prüfung anhand des kanonischen Ursprungs und eines erforderlichen Request-Headers.
- TOTP-MFA für System- und Schuladministratoren; bestätigte Einrichtung und zehn einmalige Wiederherstellungscodes. Kein eigenständiges Abschalten von Admin-MFA. Passkeys wurden nicht implementiert.
- Einladungen mit 24 Stunden Gültigkeit; im Serverbestand nur Token-Hash. Passwort-Reset mit 15 Minuten Gültigkeit und einmaliger Verwendung. Links verwenden URL-Fragmente, damit die Geheimnisse nicht als HTTP-URL protokolliert werden.
- Passwortänderung beendet andere Sitzungen; Passwort-Reset beendet alle bestehenden Sitzungen. Konto-Deaktivierung wirkt sofort auf Sitzungen und serverseitige Rollenprüfung.
- Ergänzung des vorhandenen Benutzerbereichs um Einladung, Passwort-Reset, MFA-Status, letzte Anmeldung und Sitzungsentzug. Sensible Verwaltungsaktionen verlangen nach der Umschaltung eine kürzlich bestätigte Administratoranmeldung.
- Einmalige Übernahme des vorhandenen Systemadministrators über dessen verifizierte Plattform-Identität; dieselbe Benutzer-ID und dieselbe Rolle bleiben erhalten. Kein anonymer Setup-Modus. Verbindliche Umschaltung erst nach geprüftem lokalem Adminzugang mit MFA und bestätigter Wiederherstellungsbereitschaft.
- Schutz der Admin-Seiten, der Vorschauen und aller bestehenden CMS-APIs über die gemeinsame serverseitige Autorisierung. Rollen werden bei jeder Anfrage aus dem bestehenden CMS-Bestand gelesen.
- CSP mit individuellen Script-Nonces statt pauschal erlaubten Inline-Skripten, gesperrten Script-Attributen, HSTS unter HTTPS, nosniff und privaten Cache-Regeln für Anmeldung, Konto, Verwaltung und APIs. Inline-Styles bleiben für die vorhandenen React-Layouts zugelassen.
- Audit-Ereignisse ohne Passwörter, Session-Bearer, Reset-Geheimnisse oder TOTP-Geheimnisse. Öffentliche Inhaltsantworten geben keine internen Autoren-IDs mehr aus.

## Rollenprüfung

| Rolle | Tatsächlich geprüfte Grenze |
|---|---|
| SYSTEM_ADMIN | Passwort und MFA, Benutzeranlage, Einladung, Umschaltung und Sitzungsverwaltung erfolgreich |
| SCHULADMIN | Vorhandene Freigabe- und Veröffentlichungsrechte in CMS-Regressionssuite erfolgreich |
| REDAKTEUR | Anmeldung und Entwürfe erfolgreich; Benutzerverwaltung, Systemadministration und Veröffentlichung abgewiesen |
| AUTOR | Eigene Entwürfe und bestehende Eigentumsprüfung erfolgreich; eigenständige Veröffentlichung und Benutzerverwaltung abgewiesen |

## Datenbank und Erhalt bestehender Daten

Migration: `drizzle/0002_security_login.sql`, einschließlich Drizzle-Snapshot und Journal. Sie erstellt ausschließlich sieben zusätzliche Tabellen: `auth_users`, `auth_accounts`, `auth_sessions`, `auth_verifications`, `auth_two_factors`, `auth_rate_limits`, `auth_invitations` sowie deren Indizes. Kein DROP, kein Reset, keine Entfernung vorhandener Tabellen und keine Daten-Backfills innerhalb der Migration.

Die vorhandene Tabelle `users` bleibt die maßgebliche Rollenquelle. Neue Auth-Datensätze beziehen sich auf dieselben CMS-IDs. Getestet wurde die Anwendung aller Migrationen auf getrennten lokalen Datenbanken mit bestehenden CMS-Benutzern.

Die Live-Migration wurde **nicht angewendet**. Vor einer genehmigten Bereitstellung sind ein verschlüsselter vollständiger D1-Snapshot, eine R2-Sicherung und eine sichere Ablage des Auth-Secrets erforderlich. Sites führt die Migration bei der Bereitstellung vor dem Worker-Upload aus. Ein fehlgeschlagener Rollout kann Migrationen bereits angewendet haben; bei einer Störung Zustand prüfen und nichts ungeprüft löschen.

## Tatsächliche Prüfergebnisse

- Installation mit aktueller Lockdatei und gezielten Sicherheitspatches: bestanden.
- TypeScript `--noEmit`: bestanden.
- Worker-/Frontend-Build: bestanden.
- 16 Modell-, Rechte- und Branding-Tests: bestanden.
- 23 Sicherheitsszenarien gegen den kompilierten Worker: bestanden.
- 23 bestehende CMS-/Designer-Integrationsszenarien: bestanden.
- 24 öffentliche Seiten, vier geschützte Render-Szenarien und die Schulgebäude-CMS-Übernahme: bestanden.
- Damit **91 automatisierte Prüfszenarien** bestanden; die unten genannten manuellen und externen Prüfungen bleiben separat offen.

### Die 15 angeforderten Abläufe

| Nr. | Ablauf | Echtes Ergebnis und Grenze |
|---:|---|---|
| 1 | Gültiger Administratorlogin | Bestanden mit synthetischem, bestehendem Administrator in isolierter Datenbank. Persönlicher Live-Ownerzugang noch einzurichten. |
| 2 | Falsches Passwort | Abgewiesen; Limits pro Client und über wechselnde Client-Adressen geprüft. |
| 3 | `/admin` ohne Anmeldung | Weiterleitung zu `/login` nach verbindlicher lokaler Umschaltung geprüft. |
| 4 | APIs ohne Anmeldung | HTTP 401; fremde Rollen zusätzlich mit HTTP 403 abgewiesen. Plattform-Identität allein umgeht den lokalen Modus nicht. |
| 5 | Logout und erneuter Zugriff | Abgewiesen. Zusätzlich Logout auf allen Geräten sowie Inaktivitäts- und absolute Laufzeitgrenze geprüft. |
| 6 | Passwort-Reset | Mechanik bestanden: gültiges, abgelaufenes und erneut verwendetes Token sowie Entzug alter Sitzungen geprüft. E-Mail-Transport kontrolliert abgefangen; reale Zustellung noch nicht geprüft. |
| 7 | MFA-Einrichtung und Anmeldung | Bestanden mit unabhängig berechnetem Authenticator-Code; falscher Code abgewiesen, Wiederherstellungscode nur einmal nutzbar. Persönliche MFA-Einrichtung noch offen. |
| 8 | Benutzeranlage/Rollen | Bestanden, einschließlich Einladung, einmaliger Annahme, abgelaufener Einladung und Konto-Deaktivierung. |
| 9 | Redakteursanmeldung | Bestanden mit eigenem lokalen Testkonto. |
| 10 | Redakteur/Systemverwaltung | Serverseitig abgewiesen. |
| 11 | iPhone-/Desktop-Loginansicht | Responsive Oberfläche implementiert; visuelle Abnahme **offen**. Die bereitgestellte Browser-Vorschau antwortete mit Verbindungsablehnung. |
| 12 | Logo nach Neuladen | Server-Render und Branding-Tests bestanden, einschließlich des Aufbaus vor dem Bild-Ladeereignis und der Variante auf dunklen Flächen. Direkte Browser-/Safari-Neuladeprüfung weiterhin offen. |
| 13 | Website-Designer speichern | Bestehende Integrationssuite bestanden: Speichern, erneutes Lesen, Freigabe, Veröffentlichung, Historie und Konflikterkennung. Ausschließlich isolierte Datenbank. |
| 14 | Echte veröffentlichte Inhalte | Live-Bestand lesend geprüft: acht Seiten und sieben Dokumente, keine Nachrichten, Projekte oder Veranstaltungen mit erfundenen Demo-Datensätzen gefunden. Die Inhalte wurden nicht verändert. |
| 15 | Entwicklungskennzeichnungen | Gezielte Bereinigung umgesetzt und Login-/Render-Ausgaben geprüft. Notwendige Rechte-, Datenschutz- und geschützte Entwurfshinweise bleiben erhalten. |

## Abhängigkeitsscan

Nach den gezielten Updates meldet `pnpm audit --prod` **null bekannte Befunde**. Der vollständige Scan einschließlich Entwicklungswerkzeugen meldet **einen mittleren Befund**, keine hohen oder kritischen: `minimatch` 3 in der ESLint-Werkzeugkette (Glob-Verstärkung/DoS). Diese ältere Funktions-API wurde nicht durch einen inkompatiblen pauschalen Major-Override ersetzt. Der Befund liegt außerhalb der Produktionsabhängigkeiten und bleibt dokumentiert.

Better Auth ist auf 1.7.15 aktualisiert. Für diese genau versionierten geprüften Patches und minimatch 11.0.1 wurden enge Ausnahmen von der generellen siebentägigen Paket-Reifezeit hinterlegt. Alle übrigen Pakete behalten die Regel. Die Lockdatei hält die tatsächlich installierten Versionen und Integritätswerte fest. Ein Dependency-Scan ist keine vollständige Sicherheitsgarantie oder Penetrationsprüfung.

## Entfernte Entwicklungskennzeichnungen

- „Private Abnahme“ aus Admin-Sidebar und Footer.
- Reine Entwicklungs-/Abnahmeleiste aus der öffentlichen Standarddarstellung; vorhandene gespeicherte Standardkennzeichnung wird gezielt ausgeblendet, andere Infotexte bleiben nutzbar.
- Entwicklungszusatz aus der allgemeinen Seitenbeschreibung und temporäre Formulierungen in Seitentiteln/-beschreibungen.
- „Private Abnahme“ an der historischen Medienauswahl; der tatsächliche Hinweis auf noch zu bestätigende Bildrechte bleibt erhalten.

Nicht entfernt: Kennzeichnung unveröffentlichter Entwürfe, fehlende Rechtefreigaben, Fehlermeldungen und der noch ausstehende rechtliche Freigabestatus. Rechtliche Angaben wurden nicht als bereits genehmigt erfunden.

## Redaktionelle Bestandsprüfung

Keine veröffentlichten Demo-Nachrichten, Beispielprojekte oder Testtermine im aktuellen Inhaltsbestand gefunden. Keine Inhalte gelöscht oder pauschal archiviert.

Intern markiert bzw. vor endgültiger Freigabe zu bestätigen:

1. Nutzungsrechte der historischen Schulfotos und Lizenzbelege für eingesetzte Medien; bei Schülerbildern weiterhin dokumentierte Einwilligung.
2. Abschließendes Impressum, Datenschutzinformationen für tatsächliches Hosting/Auth/E-Mail und Barrierefreiheitserklärung durch die verantwortliche Stelle.
3. Kontakt-E-Mail `info@wezelschule.de` durch die Schule bestätigen. Adresse und Telefon stimmen mit den Angaben auf der bisherigen offiziellen Schulwebsite überein; die dortige E-Mail-Adresse ist für die maschinelle Prüfung verschleiert.
4. Inhaltliche Gültigkeit und Aktualität der vorhandenen Formulare. Alle sieben bestehenden Download-URLs antworteten bei der lesenden Erreichbarkeitsprüfung mit HTTP 200.

Die weiterführenden Portal-/Schul.Cloud-Anmeldevorgänge wurden nicht mit fremden Zugangsdaten getestet.

## Geänderte Module

- `app/login`, `app/account/security`, `app/api/auth`, `app/api/security`, `app/admin/security-users.tsx`.
- `lib/security` mit Passwort-Hashing, Framework-Konfiguration, Sitzungsprüfung, Anfragelimits und Mail-Adapter.
- Bestehende Server-Autorisierung, Admin-/Designer-/Vorschau-Seiten und Benutzerverwaltung.
- `db/auth-schema.ts`, Migration 0002 und Drizzle-Metadaten.
- Öffentliche Darstellung, Layout-Metadaten, zentrale Branding-Nutzung, interne Inhaltsprüfung und Worker-Sicherheitsheader.
- `package.json`, Lockdatei, eng begrenzte Paket-Overrides, `.env.example` und Betriebsanleitung `docs/SECURITY-ROLLOUT.md`.
- Neue Security-Integrationssuite sowie Anpassung vorhandener Render-/CMS-Tests für Worker-Wasm.

## Noch erforderlich – keine Zugangsdaten in diesen Bericht eintragen

1. Freigabe zur Übernahme von Version 8 auf die **bestehende private Site**. Keine offizielle Schul-Domain und keine öffentliche Site-Freigabe damit verbinden.
2. Auth-Secret und kanonische URL sicher konfigurieren. Aktuell ist auf der vorhandenen Site nur die bisherige Owner-Zuordnung konfiguriert; neue Auth-/Mail-Geheimnisse wurden nicht gesetzt.
3. Freigegebenen Mail-Versandzugang und Absender für den implementierten Resend-Adapter bereitstellen. Reale Einladung und Reset-Mail an ein kontrolliertes Konto zustellen.
4. Persönliche Administratorübernahme, MFA und Sicherung der Wiederherstellungscodes durch den Administrator selbst. Erst danach die verbindliche lokale Anmeldung aktivieren.
5. Browser-/iPhone-/iPad-Abnahme nach Bereitstellung. Die aktuelle Umgebungsgrenze wurde nicht durch einen simulierten Screenshot oder einen erfundenen Test ersetzt.
6. Die genannten redaktionellen und rechtlichen Freigaben.

Die private äußere Sites-Zugriffssperre bleibt erhalten. Eingeladene Redakteure benötigen zusätzlich Zugang zur privaten Site; dieser wurde nicht automatisch erweitert. Die neue Passwortanmeldung ist nach der Umschaltung die CMS-Anmeldung, ersetzt jedoch nicht die äußere Zugangspolitik des Hostinganbieters.

## Referenzen

- Better Auth: https://better-auth.com/docs/authentication/email-password
- Better Auth TOTP: https://better-auth.com/docs/plugins/2fa
- OWASP Passwortspeicherung: https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html
- Cloudflare Wasm: https://developers.cloudflare.com/workers/runtime-apis/webassembly/javascript/
- Bisherige offizielle Kontaktangaben: https://wezelschule.de/index.php/impressum
