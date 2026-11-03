# Bereitstellung und Rückfall

## Isolierte Abnahme

Sites-Projekt `appgprj_6ae8542b54bc8191b9a0048a8cc1c149`, nur für den Eigentümer. Kein DNS-Eingriff und keine Umstellung von wezelschule.de. Die Vorschau ist eine eigenständige gehostete Anwendung; Sites bezeichnet die native Bereitstellung technisch als Deployment, die fachliche Nutzung bleibt private Entwicklung/Abnahme.

`DB` und `BUCKET` werden aus dem Manifest gebunden. `OWNER_EMAIL` wird ausschließlich als geheimer Laufzeitwert konfiguriert. Keine Daten echter Schüler. Kein Anschluss an bestehende Startklar-/Coach-/Railway-Datenbanken.

Vor Bereitstellung TypeScript, Policytests, Integrationstests und Build ausführen. Den genauen Quellstand in das Sites-Git-Repository pushen und das daraus gebaute Archiv als private Version speichern/bereitstellen. Niemals Sites-ID oder Datenbindungen durch ein neues Projekt ersetzen, wenn diese Version weiterentwickelt wird.

## Lokale Vorschau

Nach Schemaerweiterung `pnpm run db:generate`; generierte SQL prüfen und unverändert versionieren. Build erzeugt `dist/server/wrangler.json`. Migrationen ausschließlich mit `wrangler d1 execute DB --local --config dist/server/wrangler.json --persist-to .wrangler/state --file ...` lokal anwenden. Für die interne lokale Ansicht können `tests/local-fixtures.sql` und das durch `node scripts/seed-local.mjs` erzeugte `.sites-runtime/local-seed.sql` verwendet werden. Diese Dateien nicht in die gehostete Datenbank übernehmen.

## Öffentlicher Betrieb: noch keine Freigabe

Vorher Hosting-/Datenschutzentscheidung, Verträge und Speicherorte, Rechtsangaben, Bildrechte, Inhalte, MFA, Sicherungsbetrieb, Monitoring und belastbare Last-/Barrierefreiheitstests klären. PostgreSQL/Prisma/Railway ist derzeit nicht implementiert. Wenn diese Architektur verbindlich gewünscht wird, ist eine getrennte Portierung samt Datenmigration erforderlich; die vorhandene Quelle enthält keine vorgetäuschte PostgreSQL-Anbindung.

## Migration und Rollback

Die Matrix dokumentiert 24 Quellziele. Zielpfade mit Bereichspräfix werden von Aliasrouten unterstützt. Der Sonderfall `/index.php/...` ist für die spätere offizielle Domainübernahme konzeptionell erfasst; Weiterleitungen auf der Altwebsite sind nicht gesetzt. Bei Umschaltung zuerst gesicherte Inhalte, echte Dokumentversionen, Dateirechte und eindeutige neue URLs abnehmen, dann 301-Regeln am zuständigen Webserver einrichten und DNS nur nach schriftlicher Freigabe ändern.

Rollback einer reinen Codeänderung: zuvor geprüfte gespeicherte Sites-Version im selben Projekt bereitstellen; Zugangsrichtlinie unverändert lassen. Vorwärtige, additive Migrationen bevorzugen. Ein Code-Rollback setzt Datenbankschema und Inhalte nicht zurück. Vor destruktiven Migrationen vollständige Daten-/Dateisicherung und getesteten Restore durch die Betriebsverantwortlichen sicherstellen.

Lokaler Wiederherstellungstest: konsistente SQLite-Sicherung per Backup-API erzeugt, in separate Datei zurückgespielt, Integrität und Fremdschlüssel geprüft, 25 Inhaltsdatensätze erhalten. Das ist kein Nachweis eines vollständigen gehosteten D1-/R2-Restores.
