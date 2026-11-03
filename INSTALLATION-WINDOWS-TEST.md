# WEZEL NEXT unter Windows lokal testen

Diese Arbeitskopie erweitert den geprüften Zweig `phase5-testbetrieb` (`c68517161c6c5b6142087707c74eadc73abb41a7`) um einen lokalen Teststarter. Sie ist kein Deployment und keine neue Site. Der echte Worker und die vorhandenen Datenmodelle laufen mit Miniflare auf dem eigenen Rechner. Datenbank, Dateien und Zugangsdaten werden lokal neu angelegt.

## Voraussetzungen

- Windows 10/11 x64, Node.js **24 LTS**, VS Code; genügend freier Speicher für Abhängigkeiten.
- Node installieren: https://nodejs.org/ → anschließend VS Code/Terminal neu öffnen.
- Internet wird nur zum erstmaligen Herunterladen der Entwicklungsabhängigkeiten benötigt.
- Kein Cloudflare-/Sites-Konto, keine produktive `.env`, kein API-Schlüssel, kein Datenbankdump, keine echten Schulkonten.

## Einfacher Start

1. ZIP in einen kurzen lokalen Pfad entpacken, z. B. `C:\WEZEL-NEXT`. Nicht direkt im ZIP arbeiten.
2. In VS Code den entpackten Projektordner öffnen.
3. `START-WEZEL-TEST.cmd` doppelt anklicken. Es installiert bei Bedarf die festgelegten Abhängigkeiten, baut den Worker, initialisiert ausschließlich lokale Daten und startet den Testserver. Das Fenster offen lassen.
4. http://localhost:3000/__local im Browser öffnen. „Lokale Testverwaltung öffnen“ wählen.
5. Den einmaligen Einrichtungslink wählen und **selbst** ein neues langes Passwort für `admin@wezel.invalid` festlegen. Diese Adresse ist synthetisch; es wird keine echte E-Mail versandt.
6. Auf `/login` anmelden. Unter `/account/security` TOTP einrichten und Wiederherstellungscodes privat sichern. Ein Administrator ohne vollständige MFA erhält keinen CMS-Zugriff.
7. Website: http://localhost:3000 · Admin: http://localhost:3000/admin · Designer: http://localhost:3000/admin/design · Import: http://localhost:3000/admin/calendar/import.

Der lokale Testpostausgang ist nach bewusster lokaler Freischaltung unter http://localhost:3000/__local/mail erreichbar. Nachrichten bleiben nur bis zum nächsten Serverneustart im Arbeitsspeicher. Links stehen in der Nachricht und können in die Browseradresszeile kopiert werden. Dies ist eine Entwicklungshilfe, kein öffentlicher Maildienst. Neue Testkonten ausschließlich mit `@wezel.invalid` anlegen.

## Dieselben Schritte als Befehle

Im VS-Code-Terminal im Projektordner (PowerShell oder Eingabeaufforderung):

```powershell
node --version
npx --yes pnpm@11.25.0 install --frozen-lockfile
npm run local:build
npm run local:setup
npm run local:test
npm run local:start
```

`local:setup` ist wiederholbar und erhält lokale Inhalte. `local:test` erzeugt eine eigene temporäre Datenbank mit einem zufälligen Testpasswort und TOTP; es verändert das persönliche lokale Testkonto nicht. Der Server muss für diese API-Prüfung nicht laufen. Zusätzlich prüft `node tests/local-http.mjs` den echten HTTP-Start auf Port 3000; vorher den laufenden Server mit Strg+C beenden. Unter Windows führt dieser Test das echte `.cmd`-Startskript aus.

Nach Codeänderungen den Server beenden, `npm run local:build` und `npm run local:start` ausführen. Der lokale Starter verwendet bewusst den gebauten Worker. Der normale Vite-HMR-Modus ist ein getrennter Entwicklungsweg.

## Testdaten, Speicher und Isolation

- `.local-test/d1/`: lokale D1-kompatible SQLite-Dateien.
- `.local-test/r2/`: lokaler R2-kompatibler Objektspeicher.
- `.local-test/local-config.json`: automatisch erzeugtes lokales Sessiongeheimnis; **nicht weitergeben oder in Git aufnehmen**.
- Das gesamte Verzeichnis ist ignoriert und fehlt im herunterladbaren Paket. Keine fertigen Kontopasswörter oder MFA-Schlüssel werden mitgeliefert.
- Der Starter liest **keine** `.env`, `.dev.vars`, Wrangler-Remote-Konfiguration oder Sites-Projekt-ID. Er verwendet keine Cloudflare-Fernaufrufe. Alle ausgehenden Worker-HTTP-Anfragen werden abgefangen; nur synthetische Nachrichten an `@wezel.invalid` gelangen in den lokalen Postausgang. Externe Kalender-Synchronisierung und echte Mailzustellung sind hier absichtlich gesperrt.
- Der Windows-Server lauscht ausschließlich auf `127.0.0.1:3000`, prüft Hostnamen und entfernt übergebene Sites-Identitätsheader. Nicht mit Tunneln oder Portfreigaben öffentlich zugänglich machen.
- Vier vorhandene versionierte Migrationen werden nur auf diese neue lokale Datenbank angewandt; Prüfsummen verhindern die unbemerkte Änderung bereits angewandter Migrationen. Ein separater lokaler Migrationsnachweis ersetzt keine Produktionseinführung.
- Der Testbestand enthält selbst erstellte Logos, erfundene Seiten, Nachrichten, Projekte und Termine. Veröffentlichungen im CMS ändern nur diese lokalen Dateien.

Ein lokales Backup erfolgt bei gestopptem Server durch Kopieren von `.local-test`. Es enthält persönliche lokale Zugangsdaten/Hashes und ist vertraulich aufzubewahren. Für einen vollständigen **lokalen** Neustart dieses Verzeichnis bei gestopptem Server umbenennen; keine gehostete Datenbank anfassen.

## Häufige Probleme

- `node` nicht gefunden: Node.js 24 installieren, Terminal neu starten.
- PowerShell blockiert `npx.ps1`: `npx.cmd --yes pnpm@11.25.0 install --frozen-lockfile` verwenden oder das `.cmd`-Startskript starten.
- Port 3000 belegt: vorhandenen lokalen Testserver beenden. Kein zweites Startfenster öffnen.
- Einrichtungslink abgelaufen: Server neu starten und einen neuen Link in der lokalen Testverwaltung öffnen. Das erste Konto wird nicht überschrieben.
- Nach Neustart wieder anmelden: normale Session-/MFA-Prüfung; das Konto und TOTP bleiben lokal erhalten.
- Externe ICS-Quelle schlägt fehl: im isolierten Testbetrieb erwartet. Für den Import die synthetischen Dateien in `tests/fixtures/local/` verwenden.

## Tatsächliche Prüfergebnisse

Siehe `docs/PHASE6-LOKALER-TESTBERICHT.md`. Ein Linux-Ergebnis wird dort nicht als Windows-Test bezeichnet. Windows-Launcher und Installation werden zusätzlich in GitHub Actions auf `windows-latest` geprüft; dessen tatsächlicher Status ist im Bericht verlinkt.
