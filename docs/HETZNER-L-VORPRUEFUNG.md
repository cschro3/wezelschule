# WEZEL NEXT – Hetzner Webhosting L: tatsächliche Vorprüfung

Stand: 5. November 2026. Basis: `phase6-local-test`, Commit `6124b9732c6bf4f0665cd7d9f0fc46daf3ce7b2e`, zuletzt geprüftes ZIP in Version 5. Untersuchung in einer neuen Arbeitskopie, ausschließlich mit separaten synthetischen Testkonten und temporären lokalen Testdatenbanken.

## Entscheidung

**Der aktuelle Stand läuft nicht unverändert auf normalem Node.js. Eine verbindliche Kaufempfehlung für Hetzner L ist noch nicht belegt.** L besitzt laut Anbieter Node.js und SSH; das bestätigt die Produktfunktion, nicht die Kompatibilität dieser Anwendung. XL beseitigt die gefundenen Laufzeit- und Speicheradapterprobleme ebenfalls nicht automatisch. Die vorherige Formulierung „Ja, Webhosting L“ war als Tarifkandidat gemeint und darf nicht als technische Freigabe verstanden werden.

Die Vorprüfung ist abgeschlossen. Eine produktionsfähige Portierung oder Bereitstellung bei Hetzner ist mit diesem Bericht ausdrücklich **nicht** als fertig gemeldet. Es wurde kein Tarif bestellt, keine Domain umgestellt und keine Nachricht an Hetzner versandt.

## Reale Prüfungen

| Prüfung | Ergebnis | Bedeutung |
|---|---|---|
| Aktuelle Originalquelle wiederhergestellt | ZIP-Größe 1.582.894 Bytes, SHA-256 `18189387b50e87010cae7ca8a8d9064338ca38bf99bc27e385d3cb239d753386`, CRC fehlerfrei | Kein alter Export oder optischer Nachbau verwendet |
| Installation mit festgelegter Lockdatei | Erfolgreich, pnpm 11.25.0, Node 24.22.1 auf Linux | Abhängigkeiten des geprüften Standes installierbar |
| TypeScript | Erfolgreich | Quellstand typgeprüft |
| Modell-, Rollen-, Branding-, Kalender- und Logout-Prüfungen | 35 bestanden, 0 fehlgeschlagen | Bestehende ausgewählte Regressionen unverändert funktionsfähig |
| Native Node-Importprobe | `ERR_UNSUPPORTED_ESM_URL_SCHEME` beim tatsächlichen Import von `cloudflare:workers` | Native Node-Laufzeit stellt dieses Cloudflare-Modul nicht bereit |
| Tatsächlicher Node-Standalone-Build der Anwendung | Fehlgeschlagen, Unterprozess Exit 7; fehlendes `cloudflare:workers` in `app/login/page.tsx` | Reproduzierbarer technischer Blocker, keine Hetzner-Netzwerkstörung |
| Bisheriger Cloudflare-Worker-Build | Erfolgreich, rund 11,48 s im aktuellen Linux-Prüflauf | Vorhandener Zielbuild weiterhin baubar |
| Echter lokaler HTTP-Ablauf mit bisheriger Worker-Laufzeit | 7 Prüfungen bestanden | Seiten, abgewiesene anonyme/gefälschte Zugriffe, sichere Einrichtung, Passwort, TOTP, geschütztes CMS/Designer/Import und Logout gegen echte lokale API geprüft |
| Datenerhalt im Quellpaket | Alle vorhandenen Paketdateien unverändert | Nur neue Prüfskripte und Dokumentation hinzugefügt |
| Hostingtest auf Hetzner L / produktiver Mailversand / DNS | Nicht durchgeführt | Ohne Testkonto und passenden Produktionsadapter nicht belegbar |

Maschinenlesbare Nachweise: [Ergebnisse](verification/hetzner-readiness/results.json) und [Vorprüfung](verification/hetzner-readiness/preflight.json). Die lokale HTTP-Prüfung ist kein Browser-/Safari-Test und kein nativer Node-Hostingnachweis. Die Tests greifen nicht auf den Inhalt des persönlichen lokalen `.local-test`-Verzeichnisses beim Benutzer zu.

## Gefundene Abhängigkeiten und erforderliche Änderungen

| Bereich | Befund im tatsächlichen Code | Notwendige Arbeit |
|---|---|---|
| Laufzeit | 12 Anwendungsdateien importieren `cloudflare:workers`; `worker/index.ts` verwendet Cloudflare-spezifische HTTP-Verarbeitung | Separater Node-Produktionsstart, sichere Umgebungs- und Request-Anbindung, kompatible Response-/CSP-Verarbeitung |
| Datenbank | `db/index.ts` nutzt Drizzle D1; Designer und Kalender verwenden direkte D1-Batches für atomare Veröffentlichungen und Importe | Native persistente Datenbankanbindung auswählen; Schema, Transaktionen, Versionsprüfungen, Migration und Restore nachweisen. Kein ersatzloses Auflösen der Batches |
| Medien | Datei-API, Favicon und Mediathek nutzen R2 | Dauerhafte private Medienablage mit Pfadschutz, Zugriffskontrolle, atomaren Schreibvorgängen und geprüfter Sicherung |
| Passwörter | Argon2id verwendet ein Worker-kompiliertes WebAssembly-Modul | Node-kompatiblen Loader prüfen und vorhandene Hashes weiter verifizieren; keine Passwort-/MFA-Rücksetzung als Abkürzung |
| Anmeldung und Reverse Proxy | Sites-Identitätsheader und Cloudflare-IP-Header existieren als Plattformpfad | Außerhalb Sites `AUTH_MODE=local` erzwingen, fremde Plattform-Identitätsheader abweisen, nur dokumentierte Proxyinformationen vertrauen, HTTPS-Origin/Secure-Cookies/CSRF erhalten |
| E-Mail | Sicherheitsmails verwenden derzeit die Resend-HTTP-API; die lokale Testumgebung fängt synthetische Nachrichten ab | Tatsächlichen Mailanbieter festlegen und Versand/Reset/Einladungen testen. Für bestehendes SMTP ist ein Transportadapter erforderlich |
| Lokaler Starter | `local:start` startet Miniflare mit separatem Testzustand und lokalem Einrichtungsweg | Diesen Starter nicht als öffentlichen Produktionsserver verwenden |

Der vorhandene Startbefehl verwendet Wrangler im lokalen Modus. Das ist keine eigenständige Hetzner-Produktionskonfiguration. Externes Cloudflare-D1/R2 einfach weiter zu verwenden würde den gewünschten vollständig deutschen Speicherbetrieb nicht allein nachweisen.

## Tatsächliche Ressourcenmessung und Grenzen

- Der erfolgreiche bisherige Worker-Build erreichte im gemessenen Haupt-Node-Prozess rund **1.557,18 MiB Spitzen-RSS** (ca. 1,52 GiB). Das ist **Buildspeicher**, kein belegter RAM-Bedarf der fertigen Website. Externe Builds über CI könnten später sinnvoll sein.
- Der Node-Prozess des lokalen Miniflare-Starters erreichte im HTTP-Prüflauf rund **269,33 MiB Spitzen-RSS**. Die separate `workerd`-Laufzeit ist in diesem Wert **nicht enthalten**. Daraus lässt sich weder ein Bedarf von nur 269 MiB noch eine Eignung für ein bestimmtes Hetzner-RAM-Limit ableiten.
- Werte stammen aus `process.resourceUsage().maxRSS` der jeweils instrumentierten Node-Prozesse. Eine zuverlässige Gesamtmessung des Prozessbaums war in dieser Umgebung nicht verfügbar; es wird kein Gesamt-RAM-Wert erfunden.
- Die beworbenen 384 MB und zehn PHP-Prozesse von L sind PHP-Merkmale. Die Node.js-Dokumentation nennt eine konfigurierbare Speichergrenze, aber die geprüften Unterlagen belegen keine für dieses Projekt zugesicherte Node-RAM-/CPU-Zuteilung. Shared Hosting unterliegt zusätzlich Fair Use.

**Noch erforderlich:** gültige Node-RAM-/CPU-Grenzen und Proxy-/Startvorgaben bestätigen lassen; nach der Portierung die echte Node-Anwendung bei Seitenaufrufen, Login/Argon2id/MFA, Uploads, Designer-Vorschau und XLSX/CSV/ICS-Import unter paralleler Last messen. Der aktuelle Befund ist keine Lasttest- oder Kapazitätsfreigabe.

## Sichere Fortsetzung

1. Die [vorbereitete technische Anfrage](HETZNER-TECHNISCHE-ANFRAGE.md) mit dem Provider klären. Sie ist noch nicht versandt. Keine Zugangsdaten, Benutzerlisten oder Schülerdaten erforderlich.
2. In einer getrennten Arbeitskopie den Node-Produktionsadapter und die zu Hetzner passenden Daten-/Medienadapter implementieren. Die bestehenden Cloudflare- und lokalen Testwege zunächst erhalten.
3. Für die Datenbank native Transaktionen, Konfliktprüfungen und bestehende SQLite-/D1-Semantik prüfen; ein PostgreSQL-/MariaDB-Adapter ist keine bloße Änderung einer Verbindungszeichenfolge. Eine lokale SQLite-Datei nur nach Bestätigung des Dateisystems und sicheren Locking-/Backup-Verhaltens erwägen.
4. Erst bei erfolgreichem Node-Build und Start, abgesicherten APIs, vollständigen Funktionsprüfungen und bestätigten Ressourcen einen Tarif als geeignet freigeben. Die jetzige Prüfung verpflichtet nicht zum Kauf von L oder XL.
5. Auf einem getrennten geschützten Testhost bereitstellen. KonsoleH aktiviert Node.js pro ausgewählter Domain und deaktiviert dort andere Webanwendungen; die bestehende Hauptdomain keinesfalls vor Abnahme als Testziel ändern.
6. Änderungen auf dem Benutzer-PC liegen in `.local-test` und fehlen absichtlich im öffentlichen Quellpaket. Vor einem Umzug diese Inhalte und Medien vertraulich sichern und gezielt übertragen; keine Konten, Passwort-Hashes oder Sitzungen in GitHub oder in einen allgemein zugänglichen ZIP-Export aufnehmen.
7. Vor Umschaltung Sicherung und Wiederherstellung testen, Mail-/DNS-Bestand dokumentieren und einen Rückwechsel vorbereiten. Domain erst nach ausdrücklicher Freigabe umstellen.

## Schutz des bestehenden Systems

Keine Änderung an `main`, `phase5-testbetrieb`, `phase6-local-test`, PR #1, Sites-Projekten, gehosteten Datenbanken, Medien, Benutzern, `.local-test` des Benutzers, `wezelschule.de` oder DNS/MX. Das funktionierende Downloadpaket wird durch diese Prüfskripte nicht ersetzt. Keine produktive Migration, keine kostenpflichtige Ressource, kein Deployment und keine echte Mailzustellung.

## Offizielle Quellen, geprüft am 5. November 2026

- [Node.js-Konfiguration, Aktivierung ab L/XL und Einstellungen](https://docs.hetzner.com/de/managed/administration-on-konsoleh/nodejs/)
- [Produktübersicht, Sicherungen, Standort, SSH und PHP-Merkmale](https://docs.hetzner.com/de/managed/webhosting/overview/)
- [Aktuelle Webhosting-Produktseite, Node.js, Datenbanken, externe Domains](https://www.hetzner.com/de/webhosting/)
- [Fair Use für gemeinsam genutzte Ressourcen](https://docs.hetzner.com/de/managed/webhosting/fair-use-web-hosting/)
- [Datenbankverbindungen und getrennte Datenbankserver](https://docs.hetzner.com/managed/databases/faq/)

## Reproduktion ohne Providerzugang

Im sauberen Checkout mit installierten, festgelegten Abhängigkeiten:

```sh
node scripts/hosting-preflight.mjs tests/.generated/hetzner/preflight.json
node tests/hosting-node-build.mjs tests/.generated/hetzner/native-node-build.json
```

Die Vorprüfung schreibt ausschließlich den optional angegebenen Bericht und gibt blockierte Punkte aus. Die Node-Buildprobe erstellt eine temporäre Kopie ohne `.env`, produktive Geheimnisse oder Laufzeitdaten, stellt `output: standalone` nur dort ein und verwendet keinen Cloudflare-Plugin-/Laufzeit-Bypass. Die Kopie wird anschließend entfernt. Exit 2 der Prüfdatei bedeutet: Zielbuild nicht kompatibel. Auf dem hier geprüften Stand ist das der tatsächliche Befund.
