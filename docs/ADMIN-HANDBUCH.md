# Redaktionshandbuch

1. Private Website mit dem eigenen ChatGPT-Konto öffnen, dann `/admin`. Das konfigurierte Eigentümerkonto wird beim ersten Besuch Systemadmin. Kein separates Passwort nötig.
2. Unter Nachrichten, Seiten, Projekten, Veranstaltungen oder Dokumenten einen Inhalt erstellen. Titel, URL-Kürzel, Kategorie, Kurzbeschreibung und Inhalt eintragen. Die Formatleiste fügt Überschriften, Fettdruck, Listen und Links ein; die Vorschau zeigt die gerenderte Ausgabe ohne ausführbares HTML.
3. Entwurf speichern. Autoren können eigene Entwürfe bearbeiten und zur Prüfung vorlegen. Die Redaktion prüft Inhalt und Rechte. Nur Schul- und Systemadministration können freigeben und veröffentlichen; bestätigte Rechte sind Pflicht. Ein zukünftiger Veröffentlichungszeitpunkt wird bei jedem öffentlichen Abruf berücksichtigt.
4. Bilder/PDFs in der Mediathek hochladen. Erforderlich sind Alttext/Beschreibung und Herkunft/Rechte. JPEG/PNG/WebP werden im Browser auf maximal 1800 Pixel verkleinert und als WebP neu codiert. Maximal 8 MB pro Originaldatei. PDFs mit erkannten aktiven Inhalten werden abgewiesen; dies ersetzt keine Malwareprüfung. Dateien von Autoren bleiben intern, bis die Redaktion sie freigibt.
5. Titelbild im Inhaltseditor auswählen. Bei Dokumenten eine freigegebene PDF-Datei oder die offizielle Quelldatei verlinken. Neue Dateien sind neue unveränderliche Medienobjekte; beim Austausch den Inhalt auf die neue Datei umstellen. Frühere Inhaltsversionen behalten den alten Verweis. Unbenutzte Medien können gelöscht werden; referenzierte Dateien sind geschützt.
6. Veranstaltungen benötigen einen gültigen Beginn. Ende, Ort und Wiederholung (wöchentlich/monatlich, bis 52 Vorkommen) sind möglich. Serientermine behalten die Berliner Uhrzeit über Zeitumstellungen; Monatsenden werden begrenzt. Liste, Monatsansicht und ICS-Ausgabe werden aus den gespeicherten Terminen erzeugt.
7. Beim Bearbeiten existierender Inhalte werden vorherige Versionen gespeichert. Im Versionsverlauf eine frühere Fassung in den Editor laden und als Entwurf speichern. Zwischenzeitliche Änderungen führen zu einem Konflikthinweis, statt fremde Änderungen zu überschreiben.
8. Archivieren entfernt einen Inhalt aus dem öffentlichen Abruf. Administration kann archivierte Inhalte und ihren Verlauf gesondert endgültig löschen. Die letzte Operation ist nicht über das Produkt rückgängig zu machen.
9. Unter Benutzer werden Rollen vergeben und Konten gesperrt. Die eigene Administration kann sich nicht selbst herabstufen oder deaktivieren. Rollen: SYSTEM_ADMIN, SCHULADMIN, REDAKTEUR, AUTOR. Eine Änderung versendet keine E-Mail. Für weitere Personen muss zusätzlich der private Website-Zugang vom Eigentümer freigegeben werden.
10. Unter Einstellungen den Website-Designer `/admin/design` öffnen. Er pflegt Schulnamen, Kontakt, Logos, Hauptnavigation, Farben, Typografie, Footer und Startseitenblöcke. Entwurf speichern, zur Freigabe vorlegen, freigeben und erst dann veröffentlichen. Anschließend Website neu laden und neue Farben auf Kontrast prüfen. Der Wortmarkenentwurf ist noch kein freigegebenes offizielles Schullogo.

## Kontosicherheit und Sicherung

Passwortwiederherstellung und zusätzliche Anmeldeverfahren erfolgen beim Identitätsanbieter. Eine innerhalb dieser Anwendung erzwungene MFA ist noch nicht implementiert. Es existiert daher kein vermeintlicher „Passwort zurücksetzen“-Button ohne echte Funktion.

SYSTEM_ADMIN kann im Änderungsprotokoll einen JSON-Inhaltsexport herunterladen. Dieser enthält nun alle neun D1-Tabellen einschließlich Konten, Audit, Designentwurf und Designhistorie. R2-Dateibytes sind nicht enthalten und müssen separat gesichert werden. Er ist daher kein vollständiges Datenbank-/Dateibackup. Ein produktiver automatisierter Sicherungs- und Wiederherstellungsweg ist vor Freigabe einzurichten.


## Visueller Designer – Phase 2

- Branding: helles/dunkles/mobiles Logo und Favicon aus der Mediathek auswählen oder hochladen. Das bisherige Logo bleibt bis zur Designveröffentlichung aktiv. SVGs werden auf eine sichere Teilmenge beschränkt; SVGs mit Skripten, externen Referenzen, eingebetteten Bildern oder nicht erlaubten Attributen werden abgelehnt.
- Header: Position, Höhe, Farben, Sticky/Transparenz, Informationsleiste, Rahmen und Schatten ändern. Menüeinträge und Schnellzugriffe anlegen, verschieben, umbenennen und für Geräte sichtbar schalten. Einträge können bis zu zwei Unterebenen enthalten. Ziehen über den Griff, alternativ Pfeile verwenden.
- Startseite: Blocktyp wählen, hinzufügen, bearbeiten, duplizieren, entfernen, verschieben oder ausblenden. Hero separat mit Bild, mobilem Bild, Fokus, Overlay, Text, Buttons sowie Desktop-/Mobile-Höhe bearbeiten. Bei Video bleibt ein gewähltes Bild als Poster erhalten.
- Vorschau: Das eingebettete Fenster zeigt auch ungespeicherte Änderungen mit realen CSS-Viewports 1440/768/390 Pixel. Die Vorschau in einem neuen Tab zeigt den zuletzt gespeicherten Entwurf. Beide sind geschützt.
- Veröffentlichung: Entwurf speichern → zur Freigabe → Freigabe durch Schul-/Systemadministration → veröffentlichen. Änderungen setzen eine frühere Freigabe zurück. Wiederherstellen lädt eine frühere Veröffentlichung als neuen Entwurf; es veröffentlicht nicht sofort.
- Seiten: Im bisherigen Seiteneditor den Bereich „Visuelle Inhaltsblöcke“ öffnen. Bestehender Text bleibt erhalten. Änderungen an veröffentlichten Seiten landen im Entwurf; die öffentliche Fassung bleibt bis zur neuen Freigabe/Veröffentlichung unverändert.
- Medien: bis zu zwölf Dateien pro Upload, Kategorien und Filter nutzen. Rechte und gegebenenfalls Einwilligungsnachweis dokumentieren. Browseroptimierung nutzt WebP oder – falls vom Browser unterstützt – AVIF. Ein Zuschnitt wird als neue Datei angelegt; das Original bleibt erhalten. Historisch oder aktuell verwendete Dateien sind gegen Löschen geschützt.

Die automatische Kontrastprüfung prüft die aufgeführten Text-/Hintergrundpaare. Sie ersetzt keine vollständige Prüfung von Bildhintergründen, Navigation, Tastaturbedienung und Screenreadern.
