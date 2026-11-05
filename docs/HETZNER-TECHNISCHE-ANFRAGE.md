# Versandfertige technische Anfrage an Hetzner

Status: vorbereitet, **nicht versandt**. Keine Bestellung, keine Bereitstellungsfreigabe und keine Übermittlung von Zugangsdaten.

**Betreff: Technische Eignung von Webhosting L für eine Node.js-Schulwebsite**

Guten Tag,

wir prüfen Webhosting L für unsere bestehende Schulwebsite WEZEL NEXT mit eigener Domain. Benötigt wird Hosting in Deutschland; ein zusätzlicher Vertrag zur individuellen Anwendungswartung ist nicht vorgesehen.

Die Anwendung enthält serverseitiges React-Rendering, ein geschütztes CMS, Passwortanmeldung mit Argon2id und TOTP-MFA, Datei-Uploads und Kalenderimport aus XLSX, CSV und ICS. Sie verwendet derzeit eine Cloudflare-Worker-Laufzeit mit D1 und R2. Diese Anbindung müsste vor dem Betrieb bei Ihnen durch eine native Node.js-Lösung und passende Daten-/Medienablage ersetzt und getestet werden. Wir behaupten keine bereits vorhandene Kompatibilität.

Bitte bestätigen Sie vor einer Buchung:

1. Welche Node.js-Versionen stehen in L aktuell zur Verfügung, insbesondere Node.js 24? Welche maximale und standardmäßige RAM-Grenze, Prozessanzahl und CPU-/Fair-Use-Grenzen gelten für eine dauerhaft laufende Node-Anwendung?
2. Welche Startdatei, Port-/Socket-Anbindung und Umgebungsvariablen erwartet die KonsoleH-Node-Konfiguration? Welche Proxyheader sind für ursprüngliches HTTPS und die echte Client-IP vertrauenswürdig?
3. Ist ein vorab außerhalb des Webhostings erzeugter Node-Standalone-Build mit den notwendigen Laufzeitabhängigkeiten zulässig? Der bisherige Worker-Build benötigte im lokalen Haupt-Node-Prozess rund 1,52 GiB Spitzen-RAM; dies ist keine Messung des fertigen Node-Produktionsbetriebs.
4. Welche PostgreSQL-/MariaDB-Versionen, Größen- und Verbindungslimits sowie TLS-Optionen gelten in L? Können diese Datenbanken aus der Node-Anwendung verwendet werden?
5. Welche dauerhaft beschreibbaren, nicht öffentlich erreichbaren Verzeichnisse stehen für private Medien zur Verfügung? Ist das Dateisystem lokal oder netzwerkbasiert? Falls SQLite eingesetzt werden soll: sind dessen Dateisperren und WAL-Modus dort zuverlässig unterstützt?
6. Welche Grenzen gelten für HTTP-Anfragegröße, Datei-Uploads, Request-Timeout, parallele Verbindungen und Cronjobs?
7. Wie lassen sich Datenbank und Medien konsistent sichern und wiederherstellen? Wo liegen die Sicherungen, und welche Aufbewahrung gilt?
8. Kann eine bereits extern registrierte Domain zunächst mit einer getrennten Test-Subdomain und HTTPS genutzt werden, ohne Hauptdomain und bestehende Mailzustellung umzustellen? Welche Zusatzkosten gelten?

Bitte nennen Sie gegebenenfalls konkrete technische Einschränkungen oder ein geeigneteres betreutes Hostingprodukt. Gewünscht ist eine Machbarkeits- und Preisbestätigung, keine automatische Buchung und kein Umzug einer bestehenden Domain.

Vielen Dank und freundliche Grüße
Christoph Schröder
