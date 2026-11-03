# WEZEL NEXT – sicherer Übergang zu Passwort und MFA

Die Phase-3-Version ergänzt die vorhandene Anwendung. Keine neue Site, keine Änderung an der offiziellen Schul-Domain und kein automatisches Ersetzen bestehender Administratorzugänge.

## Vor der Übernahme

1. Vorhandene private Site-Zugriffssperre erhalten. Vollständigen D1-Snapshot und R2-Sicherung durch einen berechtigten Operator verschlüsselt sichern. Die normale CMS-Inhaltssicherung exportiert absichtlich keine Passwort-, Sitzungs-, Reset- oder MFA-Daten; sie ersetzt diesen Operator-Backup nicht.
2. Die Bereitstellung über Sites wendet `drizzle/0002_security_login.sql` nach den vorhandenen Migrationen vor dem Worker-Upload an. Nicht zusätzlich manuell gegen dieselbe Datenbank ausführen. Sie erstellt ausschließlich zusätzliche `auth_*`-Tabellen. Keine bestehenden Tabellen oder Konten werden entfernt. Vorhandene Rollen bleiben in `users` maßgeblich.
3. Runtime-Werte aus `.env.example` setzen: kanonische HTTPS-URL, kryptografisch zufälliger `BETTER_AUTH_SECRET`, freigegebener E-Mail-Absender und Mail-API-Zugang. In der Übergangsphase `AUTH_MODE=migration` verwenden. Reale Werte gehören ausschließlich in die Geheimnisverwaltung, nicht in Repository, Berichte oder Chat.
4. Den Auth-Secret verschlüsselt separat sichern. Er wird zur Verschlüsselung der MFA-Daten benötigt. Ungeplantes Ersetzen kann MFA-Daten unbrauchbar machen.
5. Die geprüfte Version erst nach Freigabe auf die bestehende private Site übernehmen. Keine Freigabe der öffentlichen Site-Zugriffe oder offiziellen Schul-Domain damit verbinden.

## Einmalige Übernahme des Administrators

- Im vorhandenen, berechtigten ChatGPT-/Sites-Konto anmelden und `/account/security` öffnen.
- Ein eigenes Passwort festlegen. Die serverseitig verifizierte Kontozuordnung übernimmt dieselbe CMS-Benutzer-ID. Der Übernahme-Endpunkt ist für Unberechtigte gesperrt, nach erfolgter Übernahme für dieses Konto geschlossen und nach der Umschaltung vollständig gesperrt.
- Unter `/login` mit dem neuen Passwort anmelden. MFA mit einer Authenticator-App einrichten, den Code bestätigen und die zehn Wiederherstellungscodes getrennt vom Passwort sicher verwahren.
- Neue Anmeldung in einem getrennten Browserfenster einschließlich MFA prüfen. Wiederherstellungscodes wurden in der isolierten Testsuite tatsächlich geprüft; die persönlichen Codes müssen vom Administrator selbst aufbewahrt werden.
- Einladungs- und Reset-Mail an ein kontrolliertes Konto real zustellen und den Link prüfen. Dieser Live-Zustelltest kann ohne Mail-Zugang nicht erfolgen.
- Erst dann unter Kontosicherheit die verbindliche Umschaltung bestätigen. Sie erfordert eine frische lokale Systemadministrator-Sitzung mit aktivierter MFA, konfigurierten E-Mail-Versand und die Bestätigung gesicherter Wiederherstellungscodes. Danach autorisiert eine alleinige Plattform-Identität keine CMS-Anfrage mehr.

## Laufender Betrieb

- Rollen bleiben `SYSTEM_ADMIN`, `SCHULADMIN`, `REDAKTEUR`, `AUTOR`. Jede CMS-Aktion prüft die aktuelle Rolle und den Aktivierungsstatus serverseitig.
- Passwörter: Argon2id, 19 MiB, zwei Durchläufe, ein paralleler Strang, zufälliges 16-Byte-Salt; keine Standardpasswörter. Die Worker-Wasm-Ausgabe wurde zusätzlich gegen die unabhängige native Node-Argon2-Implementierung geprüft.
- Sitzungen: HttpOnly, Secure bei HTTPS, SameSite=Lax; maximal acht Stunden, Ende nach 30 Minuten ohne Aktivität. Sitzungs-Cookies werden nicht als Browser-LocalStorage-Daten verwaltet. Sitzungs-Bearer werden aus JSON-Antworten entfernt.
- Passwortänderung beendet andere Sitzungen auch bei gegenteiligem Client-Wunsch. Zurücksetzung beendet alle bisherigen Sitzungen. Ein deaktiviertes Konto verliert seine Sitzungen und seine API-Berechtigungen.
- Einladungen: 24 Stunden, zufälliger Einmal-Link, serverseitig nur Token-Hash. Passwort-Reset: 15 Minuten und einmalig. E-Mail-Links transportieren das Token im Fragment, damit es nicht als HTTP-URL im Zugriffsprotokoll oder Referrer erscheint.
- Rate-Limits gelten persistent pro Client und zusätzlich kontobezogen nach fehlgeschlagenen Passwortversuchen. MFA unterliegt eigenen Limits.
- Unter Benutzer → Zugang und Sicherheit stehen Einladungen, Passwort-Reset, MFA-Status, letzte Anmeldung und Sitzungsentzug bereit. Sensible Verwaltungsaktionen verlangen im lokalen Modus eine kürzlich bestätigte Administratoranmeldung. Das eigene administrative Konto kann nicht beiläufig gesperrt/herabgestuft werden.
- MFA für Administratoren ist verpflichtend. Selbstständiges Abschalten ist gesperrt; Wiederherstellung über Einmalcodes oder einen anderen berechtigten, frisch angemeldeten Systemadministrator. Passkeys sind nicht implementiert; die verfügbare MFA-Methode ist TOTP.

## Sites-Grenze und eigenständiger Betrieb

Die private Sites-Zugriffssperre bleibt zusätzlich bestehen. Ein eingeladener Redakteur benötigt auch Zugang zur privaten Site. Diese Berechtigung wird nicht automatisch erweitert. Der lokale Passwortlogin ersetzt nach der Umschaltung die CMS-Authentifizierung, nicht die äußere Zugriffspolitik des Hostinganbieters.

Bei Betrieb außerhalb der vertrauenswürdigen Sites-Gateway-Umgebung müssen Plattform-Identitätsheader am Eingang entfernt werden und der lokale Modus verpflichtend sein. Eine direkte Veröffentlichung mit ungeschützter Plattform-/Migrationsauthentifizierung ist unzulässig. Dieses Repository behält die vorhandene Worker-/D1-/R2-Architektur; es ist kein neuer Node-/SMTP-Hostingexport.

## Wiederherstellung

Vorrangig einen noch unbenutzten MFA-Wiederherstellungscode oder einen zweiten berechtigten Administrator verwenden. Bei technischer Störung unter erhaltener privater Site-Sperre die vorherige geprüfte Version wieder bereitstellen. Ein vorübergehender Plattform-Notzugang benötigt eine dokumentierte Owner-Prüfung durch den berechtigten Operator; er darf niemals automatisch oder für öffentliche direkte Aufrufe aktiviert werden. Ein fehlgeschlagener Rollout kann Migrationen bereits angewendet haben; zuerst den Zustand klären. Neue Auth-Tabellen nicht löschen. Bei Datenwiederherstellung zusammenpassenden verschlüsselten D1-Snapshot und Auth-Secret wiederherstellen.

## Datenschutz und Inhalte

Echte Inhalte wurden nicht gelöscht oder neu veröffentlicht. Verdachtsfälle werden intern im Dashboard angezeigt. Historische Schulfotos, Bildlizenzen, abschließende rechtliche Angaben und die Kontakt-E-Mail bleiben redaktionell zu prüfen. Die aktuelle öffentliche Bestandsaufnahme enthält acht Seiten und sieben Dokumente, keine Nachrichten, Projekte oder Termine mit Demo-Markierung.

Entwicklungs-Badges wurden aus der normalen Oberfläche entfernt. Die Kennzeichnung einer geschützten unveröffentlichten Vorschau, Rechteprüfungen, Fehlermeldungen und die noch ausstehende rechtliche Freigabe wurden bewusst erhalten.

## Abhängigkeiten und Prüfgrenzen

Next/React/RSC, Vite und betroffene transitive Pakete wurden aktualisiert. Better Auth 1.7.15 wird eingesetzt. Die unveränderte generelle siebentägige Paket-Reifezeit hat ausschließlich exakt versionierte Ausnahmen für die geprüften Better-Auth- und minimatch-Sicherheitspatches; diese sind im Lockfile nachvollziehbar. Ein verbleibender mittlerer Audit-Hinweis betrifft minimatch 3 in der ESLint-Werkzeugkette. Keine pauschale Major-Override wurde erzwungen, da die aufrufenden Werkzeuge die ältere API erwarten. Der Befund liegt außerhalb der Produktionsabhängigkeiten.

Die Prüfungen sind keine vollständige Penetrationsprüfung und keine Garantie gegen alle künftigen Schwachstellen. Echte Mail-Zustellung, persönliche Owner-Übernahme und Browser-/iPhone-Abnahme bleiben vor der Umschaltung zu erledigen. Die lokale Browservorschau war trotz bereinigter veralteter Sperrdatei nicht erreichbar.
