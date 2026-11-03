# WEZEL NEXT – Phase 2

## Implementierte Funktionen

Der Website-Designer unter `/admin/design` erweitert dieselbe Anwendung und ist unter Einstellungen sowie direkt aus der Redaktion verlinkt. Dunkelblaue Sidebar, limegrüne Hervorhebungen und helle Flächen bleiben bestehen.

- Branding mit getrennten Logos für helle/dunkle/mobile Darstellung, Favicon, Größen/Abständen, Schulnamen und Slogan. SVG/PNG/WebP aus der vorhandenen Mediathek; SVGs werden XML-basiert auf erlaubte Elemente/Attribute beschränkt. Die Logoaktivierung erfolgt erst durch Veröffentlichung des Entwurfs.
- Headerposition, Höhe, Sticky-/Transparenzoption, Farben, Rahmen, Schatten und Informationsleiste. Hauptnavigation mit Untermenüs, frei sortierbaren Schnellzugriffen, internen/externalen Links und Gerätesichtbarkeit. Drag-and-drop und zugängliche Pfeiltasten; Pointer-Unterstützung für Touch.
- Gemeinsamer Blockeditor für Startseite und bestehende Seitenverwaltung. 20 Blocktypen: Hero, Bild, Slider, Text, Überschrift, Buttons, Spalten, Bento, Nachrichten, Termine, Projekte, Schnellzugriffe, Downloads, Kontakt, CTA, Galerie, Video, FAQ, Abstand und Statistiken. Kein freier HTML-/JavaScript-Editor.
- Hero mit responsiven Bildern/Fokus, Overlay, editierbaren Texten/Buttons, Höhen für Desktop/Mobile und lokalem Video. Autoplay nur stumm, im sichtbaren Bereich und ohne aktivierte Bewegungsreduktion. Externe Videos werden erst nach Zustimmung zum Anbieter geladen.
- Zentrale Farben und lokale Schriften, Schriftgröße, Stärke, Zeilenabstand, Überschriftenskalierung, Paletten und Rücksetzung. Bekannte Text-/Hintergrundpaare werden automatisch berechnet; unzureichende Kontraste verhindern die Designveröffentlichung.
- Footer mit Kontakt, Öffnungszeiten, freiem Text, Logo, Navigation und sozialen Links. Die drei Rechtslinks bleiben fest erreichbar.
- Mediathek mit Mehrfachupload, Kategorien, Suche/Filtern, Rechten/Einwilligungsnachweisen, Metadaten, Fokus und Zuschnitt. WebP-/AVIF-Optimierung nach Browserunterstützung. Zuschnitte sind neue Dateien. Verwendete Dateien und historische Referenzen sind gegen Löschen geschützt.
- Geschützte Vorschauen unter `/admin/preview`. Das eingebettete Fenster zeigt ungespeicherte Änderungen über einen validierten Nachrichtenkanal ausschließlich vom gleichnamigen Elternfenster. Separat geöffnete Vorschauen zeigen gespeicherte Entwürfe. Desktop/Tablet/Smartphone nutzen reale Frame-Viewports.
- Entwurf → zur Freigabe → freigegeben → veröffentlicht. Autoren entwerfen, Redakteure bearbeiten; nur Schul-/Systemadministration geben frei und veröffentlichen. Vorhandene Konten und die Hosting-Anmeldung bleiben erhalten. Änderungen veröffentlichter Seiten überschreiben nicht mehr die öffentliche Fassung. Versionskonflikte werden abgewiesen. Vorherige Designs lassen sich als Entwurf wiederherstellen.

## Geänderte Module

Neue Module: `lib/design-model.ts`, `lib/design-store.ts`, `lib/safe-svg.ts`, `app/block-renderer.tsx`, `app/admin/design/`, `app/admin/preview/`, `app/admin/media-workspace.tsx`, `app/api/favicon/`.

Erweitert: bestehender Admin-API-Handler, bestehende Seiten-/Medienverwaltung, öffentliche Startseite und Inhaltsseiten, Header/Footer, globales Designsystem, Rollenrichtlinie, Typen, Worker-CSP, Migrationen, CI und Dokumentation. Zusätzliche Abhängigkeit: `saxes` für sichere XML-Verarbeitung. Kein neues Projekt, kein zusätzlicher Authentifizierungsanbieter, kein Anschluss an andere Projekt-Datenbanken.

## Datenbank und Sicherung

Migration `0001_condemned_rumiko_fujikawa.sql` erstellt `design_drafts` und `design_history` und ergänzt nullable Inhaltsblöcke/Entwürfe, Medienmetadaten und konstante Versions-/Statusfelder. Keine bestehenden Tabellen, Benutzer, Inhalte oder Dateien werden gelöscht.

Vor Änderung: alle sieben damaligen Tabellen mit 25 Inhalten, einem Konto und einer Mediendatei aus der tatsächlichen Staging-Anwendung gesichert; Mediendatei samt Bytezahl und Prüfsumme geprüft, vorherigen Quellstand als Git-Bundle eingeschlossen. Sicherungsdatei: `WEZEL_NEXT_Sicherung_vor_Phase2_2026-11-02.zip`. Ein lokaler Wiederherstellungstest aus dieser tatsächlichen Sicherung bestätigt, dass alle bisherigen Spalten und Werte nach der Migration unverändert sind; Datenbankintegrität und Fremdschlüssel sind gültig.

Das bisherige `settings.site` bleibt die alleinige aktive Konfiguration. Entwürfe sind getrennte Arbeitsstände. Designveröffentlichungen schreiben Konfiguration, Version und Audit in einer atomaren D1-Batchoperation. Ein Code-Rollback auf die vorherige gespeicherte Sites-Version ist mit dem additiv erweiterten Schema möglich; keine Spalten dafür löschen. Inhalts-/Dateiwiederherstellungen benötigen einen gesonderten geprüften Betriebsablauf.

Der Systemexport enthält alle neun D1-Tabellen. Die R2-Dateibytes sind weiterhin separat zu sichern; der Export wird ausdrücklich nicht als vollständiges Datei-Backup ausgegeben.

## Tests und tatsächliche Ergebnisse

| Prüfung | Ergebnis und Umfang |
| --- | --- |
| TypeScript und Produktionsbuild | erfolgreich |
| Policy-/Modelltests | 11 erfolgreich, einschließlich Rollen, Zeitberechnung, Kontrast und deterministischer Defaults ohne sichere Browser-UUID-API |
| Designer-/CMS-Integration | 20 erfolgreich gegen echte Route-Handler mit lokaler D1-/R2-Emulation; nur der Hosting-Identitätsadapter ist testweise gebunden |
| Öffentliche RSC-Seiten | 24 vollständige gerenderte Seiten einschließlich Alias- und lokalen Demo-Detailseiten erfolgreich |
| Geschützte RSC-Vorschauen | vier Szenarien erfolgreich: Designer mit Testidentität, tatsächlicher Seitenentwurf, Schutz bei fehlender Identität, unveröffentlichtes Design getrennt vom öffentlichen Inhalt |
| Neustart | D1-Wert und R2-Dateibytes nach vollständigem Prozessende erneut gelesen |
| Migration aus Sicherung | sieben ursprüngliche Tabellen und alle bisherigen Werte unverändert; Integrität/Fremdschlüssel gültig |
| Browser: öffentlicher Auftritt | Desktop und Frame-Viewports 320/390/768 Pixel geprüft; Inhaltsbreiten 305/375/753 Pixel jeweils ohne horizontalen Überlauf |

Die Integrationstests bilden A–F ab: Logo speichern/aktivieren/zurücksetzen; Navigation mit Untermenü und Sortierung; neue Sektion speichern/neu laden/veröffentlichen; Footer veröffentlichen/zurücksetzen; verweigerte Autoren-/Redaktionsfreigaben; alte Designversion als Entwurf und erneute Veröffentlichung. Zusätzlich getestet: konkurrierendes Speichern/Veröffentlichen, Metadatenkonflikte, manipulierte SVGs und Links, Kontrastblockierung, Schülerbildfreigaben, Entwurfsleck-Vermeidung, Löschschutz, Kalender/ICS und Systemexport.

Maschinenlesbare Nachweise und Protokolle stehen in `docs/verification/`.

## Offene Probleme und Abnahmegrenzen

Ein realer redaktioneller Login war im Cloud-Browser nicht verfügbar. Daher werden die genannten Prüfungen ausdrücklich als API-/RSC-Tests mit lokalen Testidentitäten bezeichnet, nicht als vollständig durchgeklickte OAuth-Browserabläufe. Manuelle interaktive Abnahme von Upload, Zuschnitt, Touch-Drag-and-drop und Designer auf echten iPhone-/iPad-Geräten steht aus. Für diese Abnahme ist ein angemeldetes berechtigtes Redaktionskonto im Testbrowser erforderlich; ein neues Passwort oder ein neues Benutzerkonto ist nicht erforderlich.

Die Kontrastprüfung ersetzt keinen vollständigen WCAG-Audit. Lighthouse-Zahlen, unabhängiger Sicherheitstest und vollständiger gehosteter Restore samt Dateien sind nicht nachgewiesen. AVIF hängt von der Browserunterstützung ab; WebP ist der funktionierende Rückfall. SVG-Unterstützung umfasst die dokumentierte sichere Teilmenge, nicht beliebige SVG-Programme/Filter oder externe Referenzen.

Die bisher offenen Bild-/Inhaltsrechte, endgültigen Rechtstexte, betriebliche Hosting-/Datenschutzfreigaben und Kontosicherheitsanforderungen bleiben für den offiziellen Schulbetrieb zu klären. Keine Schul-Domain umgestellt, kein Zugang öffentlich erweitert, keine Einladung versandt, keine realen Schülerdaten zu Testzwecken angelegt.

## Bereitstellung

Dasselbe private Sites-Projekt `appgprj_6ae8542b54bc8191b9a0048a8cc1c149` und dieselben Speicherbindungen `DB`/`BUCKET`. Die bestätigte Staging-URL und der genaue veröffentlichte Quellstand werden im Abschluss genannt. Der Designer ist über `/admin/design` erreichbar; der Veröffentlichungsknopf im Designer veröffentlicht Inhalte nur innerhalb dieser bestehenden privaten Staging-Anwendung.
