# Kalender und Terminimport

## Einstieg

In der vorhandenen Redaktion **Veranstaltungen** öffnen. Die Kalenderverwaltung liegt unter `/admin/calendar`, der Import unter `/admin/calendar/import`. Beide Seiten verlangen die vorhandene serverseitige Anmeldung. Die neue Funktion ist bis zur ausdrücklich freigegebenen Bereitstellung nur im geprüften Quell-/Versionsstand vorhanden.

Autoren erstellen eigene Einzeltermine. Redaktion und Administration dürfen Dateien importieren. Nur Schul- und Systemadministration dürfen freigeben, veröffentlichen, archivieren sowie Kalenderquellen und Kategorien verwalten.

## Dateien vorbereiten

Unterstützt: XLSX, CSV und ICS. Höchstens 2 MB, zwölf Excel-Arbeitsblätter, 500 Datenzeilen je ausgewähltem Blatt und 40 Spalten. Leere Excel-Blätter werden übersprungen. Entpackte Excel-Daten sind auf 16 MB begrenzt; Makros, externe Excel-Verknüpfungen, DTDs und Formeln werden nicht übernommen.

CSV: Komma, Semikolon, Tabulator oder senkrechter Strich, einschließlich zitierter Felder und mehrzeiliger Beschreibungen. Zeichencodierungen: UTF-8 einschließlich BOM, Windows-1252, UTF-16 LE/BE mit BOM. Datumsangaben: `2026-11-03`, `03.11.2026` oder `03/11/2026` (Tag/Monat/Jahr). Uhrzeit: `18:00`. Amerikanische Monat/Tag-Angaben werden nicht geraten. Excel-Datums-/Uhrzeitserien mit passenden Zellformaten und 1900-/1904-Datumssystem werden gelesen.

Beispiel für eine CSV-Kopfzeile:

```csv
Titel;Datum;Beginn;Ende;Ort;Ganztägig;Enddatum;Sichtbarkeit;Zielgruppe;Wiederholung;UID
```

Die Beispielkopfzeile enthält keine realen Schultermine. Wiederholungsregeln mit Semikolon gehören in ein zitiertes CSV-Feld. Beschreibungen sind Klartext, kein HTML. Zeitangaben werden ausdrücklich in **Europe/Berlin** verarbeitet; ICS unterstützt zusätzlich UTC. Nicht existente oder doppeldeutige Uhrzeiten bei Zeitumstellungen werden zur Korrektur angezeigt.

Ganztägig kann `ja/nein`, `true/false` oder `1/0` verwenden. Ohne Uhrzeit und ohne explizites Kennzeichen wird ein ganztägiger Termin angenommen. Ein Enddatum in CSV/Excel bezeichnet bei Ganztagen den letzten eingeschlossenen Tag. Gespeicherte und exportierte Enden folgen dem exklusiven ICS-Enddatum.

## Die fünf Schritte

1. **Datei auswählen:** Datenumfang vor dem Upload prüfen und bestätigen. Datei wählen oder kopierten Tabelleninhalt einfügen. Es werden noch keine Termine geschrieben.
2. **Spalten zuordnen:** Arbeitsblatt wählen, automatische Zuordnung kontrollieren, mindestens Titel und Datum verbinden. Nicht benötigte Spalten unzugeordnet lassen.
3. **Daten prüfen:** Fehler und Duplikate kontrollieren. Ein fehlerhafter Datensatz ist zunächst ausgeschlossen.
4. **Vorschau und Auswahl:** Zeilen auswählen/abwählen, korrigieren, Kategorie und Zielgruppe ändern und als Entwurf oder zur Freigabe markieren. Bei Duplikaten ausdrücklich überspringen, ein passendes bestehendes Ziel aktualisieren oder als neuen Termin übernehmen. Bei Aktualisierung bleibt die ursprüngliche Termin-ID erhalten.
5. **Import abschließen:** Berechtigung, Auswahl und Sichtbarkeit bestätigen und „Jetzt verbindlich importieren“ auslösen. Der Bericht nennt tatsächlich neue, aktualisierte, übersprungene und abgewählte Zeilen. Kein Import veröffentlicht selbstständig.

Wiederholte Dateien werden über ihren SHA-256 erkannt und ausdrücklich markiert. Der Server prüft Duplikate erneut beim Speichern. Wiederholung eines bereits abgeschlossenen Importaufrufs liefert den gespeicherten Bericht. Gleichzeitig geänderte Zielversionen führen zu einem Konflikt. Ein Datenbankfehler rollt den gesamten Import zurück.

## Freigeben und veröffentlichen

Nach dem Import den Termin öffnen. Inhalt und Rechte prüfen, **Freigegeben** speichern. Danach erneut öffnen und **Veröffentlicht** speichern. Redakteure können diesen letzten Schritt serverseitig nicht durchführen.

Eine Aktualisierung eines bestehenden Termins wird zunächst als separate Fassung im vorhandenen Entwurfsfeld gespeichert. Die laufende veröffentlichte Fassung bleibt bis zur Freigabe unverändert. Frühere Inhalte bleiben im Versionsverlauf erhalten.

**Intern** schließt einen Termin unabhängig vom Veröffentlichungsstatus aus öffentlichen Seiten, Inhalts-APIs, Kalenderansichten und ICS-Dateien aus. Ein zukünftiges Veröffentlichungsdatum und ungeprüfte Rechte sperren ebenfalls die öffentliche Ausgabe.

Archivieren erhält den Datensatz und nimmt ihn aus der öffentlichen Ausgabe. Kategorien lassen sich bearbeiten; vorhandene Terminkategorien werden bei einer Namensänderung nicht automatisch umgeschrieben. Ferien und Feiertage werden als eigene Kalenderdaten über die passenden Kategorien gepflegt oder importiert. Es werden keine ungeprüften Ferientage erzeugt.

## Serien und öffentliche Kalender

Monat, Woche und Liste, Suche sowie Kategorien-/Zielgruppenfilter stehen zur Verfügung. Mehrtägige Termine erscheinen an den betroffenen Tagen. Details enthalten den Download für einen Einzeltermin; der gesamte öffentliche Kalender liegt unter `/api/calendar`. Die bisherige Exportadresse `/api/content?kind=event&format=ics` bleibt erhalten.

Unterstützte neue RRULE-Teile: `FREQ=DAILY|WEEKLY|MONTHLY|YEARLY`, `INTERVAL=1..52`, `COUNT=1..366` oder `UNTIL`, und `BYDAY` mit Wochentagen bei wöchentlichen Serien. Beispiel: `FREQ=WEEKLY;COUNT=12;BYDAY=MO,WE`. Nicht unterstützte Erweiterungen und ICS-Ausnahmen (`RECURRENCE-ID`, `EXDATE`, `RDATE`, `DURATION`) werden zurückgewiesen; sie müssen als einzelne Termine mit DTEND exportiert werden. Abgesagte Ereignisse werden nicht automatisch gelöscht. Alte Wochen-/Monatsserien behalten ihre bisherige Datumsberechnung.

Der öffentliche Feed benötigt für ein tatsächliches Abonnement eine vom Kalenderprogramm erreichbare Website. Das bestehende private Sites-Zugangstor kann externe Kalenderprogramme blockieren. Es wird weder abgeschaltet noch umgangen.

## Externe Quellen

Nur die Administration kann eine öffentliche HTTPS-ICS-Quelle anlegen und die manuelle Aktualisierung bewusst aktivieren. Ein Abruf erzeugt stets eine neue Importvorschau; er überschreibt oder veröffentlicht keine Termine. Standardmäßig zugelassen sind `calendar.google.com`, `outlook.office365.com` und `outlook.live.com`. Weitere ausschließlich vertrauenswürdige öffentliche Hosts können im Betrieb über `CALENDAR_ICS_HOSTS` einzeln freigegeben werden; keine Wildcards und keine beliebigen Benutzer-Domains verwenden.

HTTP, IP-Adressen, Zugangsdaten in URLs, andere Ports, nicht freigegebene Hosts und Weiterleitungen werden abgelehnt. Abrufe haben zehn Sekunden Zeitlimit und 2 MB Antwortlimit, übertragen keine Besucher-Cookies oder Anmeldedaten und geben gespeicherte URL-Pfade nicht an die Verwaltungsübersicht zurück. Nur öffentliche Adressen ohne geheime Zugangscodes hinterlegen.

Google-/Microsoft-OAuth, private Kontokalender und zeitgesteuerte Synchronisierung sind nicht implementiert. Es gibt keinen versteckten automatischen Abruf.

## Datenschutz und Betrieb

Teilnehmer, Organisatoren, Alarme und Anhänge aus ICS werden nicht importiert. Beschreibungstexte müssen dennoch redaktionell auf personenbezogene Daten geprüft werden. Eine technische Prüfung kann keine inhaltliche Datenschutzfreigabe ersetzen.

Tabellendaten in privaten Importvorschauen sind 24 Stunden zugreifbar. Nach Abschluss wird der Tabelleninhalt entfernt. Abgelaufene Nutzdaten werden beim nächsten schreibenden Kalenderaufruf geleert; ein zeitgesteuerter Löschdienst ist nicht vorhanden. Importberichte und Audit-Ereignisse enthalten IDs und Zähler, keine Sitzungs- oder Reset-Geheimnisse.

Vor einer später freigegebenen Übernahme: D1 und R2 getrennt gesichert bereitstellen, Phase-3-Mailkonfiguration und Administratorübernahme abschließen und Browser-/Mobile-Abnahme durchführen. Die Migration `0003_worried_invisible_woman.sql` ist additiv. Sie ergänzt Ereignisfelder und vier Kalendertabellen, erstellt Indizes und neun Kategorienamen, aber keine Veranstaltungen und keine Benutzer. Keine vorhandenen Termine werden gelöscht oder umgeschrieben.
