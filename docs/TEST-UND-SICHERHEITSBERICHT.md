# Test- und Sicherheitsbericht · 2. November 2026

## Nachgewiesen

- TypeScript-Prüfung und Build erfolgreich (vor Bereitstellung erneut auf dem finalen Quellstand).
- 8 Policytests erfolgreich: Rollenabgrenzung, Eigentum von Autorenentwürfen, Freigabezeitpunkt/Rechte, CSRF-Herkunft/URL-Schemata, Uploadsignaturen, Berliner Sommer-/Winterzeit, Monatsenden, ICS-Escaping und UTF-8-Zeilenfaltung.
- 15 Integrationstests erfolgreich gegen die tatsächlich implementierten Route-Handler mit lokaler D1-/R2-Emulation. Im Test wird nur der Hosting-Identitätsadapter durch Testheader ersetzt; dies ist keine Funktion des gehosteten Produkts. Geprüft wurden fehlende Anmeldung, idempotente Inhaltsinitialisierung, Entwurf/Persistenz, Unsichtbarkeit nicht freigegebener Inhalte, Autoren-/Redaktionsrechte, CSRF-Abweisung, geplante Veröffentlichung, Versionskonflikte, Bild-Upload/Dateiausgabe, Veranstaltung/ICS, Einstellungen, Export, Archivierung und geschütztes endgültiges Löschen.
- Zwei getrennte Node-Prozesse: D1-Wert und R2-Dateibytes nach vollständigem Prozessende erneut gelesen, beide erhalten.
- Lokaler SQLite-Backup-/Restore: konsistente Sicherung in getrennte Datei, `integrity_check=ok`, keine Fremdschlüsselfehler, 25 Datensätze erhalten. Kein vollständiger gehosteter Dateirestore.
- Browserprüfung mit der echten lokalen Vorschau: Desktopansicht und eingebettete echte CSS-Viewports 320×812, 390×844, 768×1024. In den beiden schmalen Ansichten war `scrollWidth=clientWidth` (305 bzw. 375 Pixel Inhalt nach Scrollleiste); kein horizontaler Inhaltsüberlauf. Mobiles Menü und Service-Untermenü geöffnet, zu sieben echten PDF-Links navigiert. Dies ist kein Test auf physischer iPhone-/Android-Hardware.
- Quellenprüfung: 17 Seitenadressen (14×200, 1×404, 2×503); 7 eindeutige PDFs mit HTTP 200 und PDF-Signatur. Altfehler dokumentiert. Keine Loginversuche auf bestehenden Schulportalen.

Die maschinenlesbaren Testresultate liegen unter `docs/verification/`. Die Quelle ist versioniert; Details des privaten Deployments werden im Abschluss ausgegeben.

## Implementierte Schutzmaßnahmen

Authentifizierung durch den Hostinganbieter; serverseitige Rolle bei jedem CMS-Aufruf; dauerhafte Bindung der Identität; Sperrstatusprüfung; kein Passwortspeicher; Schutz gegen Selbstsperrung; CSRF-Origin plus eigener Requestheader; persistentes Rate Limit für Änderungen; strikt begrenzte Requestgrößen; Zod-Validierung; parametrisierte ORM-Abfragen; reine Text-/Markdown-Ausgabe durch React ohne HTML-Injektion; lokale Datei-/Schriftablage; Dateityp-/Größenprüfung; SVG-/HTML-Ausschluss; erkannte aktive PDF-Inhalte abgewiesen; erforderliche Rechteangaben; Freigabestatus; nosniff, Referrer-/Permissions-Policy, CSP, no-store für Administration/API und noindex für die Abnahme. Protokollierung wesentlicher Änderungen.

Die CSP benötigt für den Frameworkbetrieb derzeit Inline-Skripte/-Styles; sie wird nicht als vollständiger XSS-Schutz dargestellt. PDF-Signatur-/Patternprüfungen sind kein Virenscanner. Ein Upload wird nicht als umfassend schadsoftwaregeprüft ausgegeben.

## Nicht nachgewiesen / offen

Keine Lighthouse-Zahlen oder WCAG-Konformität erfunden. Vollständiger automatisierter Browser-/Accessibility-Lauf, Best-Practice-/SEO-Lighthouse-Werte, Screenreader-, Last-, physische Gerätetests und unabhängiger Sicherheitstest stehen aus. Kein Pentest fremder oder bestehender Produktionssysteme durchgeführt.

MFA-Erzwingung auf Anwendungsebene, organisatorischer Freigabenachweis, automatisierte vollständige D1-/R2-Sicherungen mit gehostetem Restore, Monitoring, Mail-Einladungen, automatische Passwort-Reset-Prozesse und öffentliche Rechtsfreigabe sind offen. GitHub-Actions ist vorbereitet, noch nicht bei GitHub ausgeführt. Keine öffentliche Domainfreigabe.

## Fehlerbehebung: Inhaltsseiten, 2. November 2026

Nach Rückmeldung zum Leitbild wurde ein Darstellungsfehler reproduziert: Navigationsdaten wurden aus einer Browserkomponente in einer Serverkomponente ausgelesen. Das führte bei Inhaltsseiten zu `Cannot read properties of undefined (reading 'map')`. Die Daten und die URL-Hilfsfunktion liegen jetzt in einem gemeinsam nutzbaren Modul; bestehende Daten und Freigaben wurden nicht verändert.

Ein neuer Regressionstest führt den vollständig gebauten RSC-Worker mit D1/R2 aus. Mit dem alten Build scheiterten neun geprüfte Pfade am fehlenden gerenderten Inhalt. Nach Korrektur bestanden 24 vollständige Seitenaufrufe einschließlich Aliasrouten sowie lokaler Demo-Nachrichten-, Projekt- und Termindetails. Die Startseite wird dabei zusätzlich mit einer veröffentlichten Testnachricht geprüft. Die GitHub-CI-Datei führt diese Prüfung nun ebenfalls nach dem Build aus. Testergebnis: `docs/verification/page-render-tests.txt`.
