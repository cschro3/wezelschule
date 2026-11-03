# Versendefertige Betreiberanfrage – WEZEL NEXT

Stand: 3. November 2026. **Vorbereitet, nicht versandt. Keine Antwort und keine Ticketnummer vorhanden.**

Offizieller Kontaktweg: https://help.openai.com/ → Chat-Symbol unten rechts → Supportanfrage starten. Um Weiterleitung an das zuständige ChatGPT-Sites-Team bitten. Quelle: https://help.openai.com/en/articles/6614161-how-can-i-contact-support (am 3. November 2026 geprüft).

Die Anfrage basiert auf dem Abschnitt „Konkrete Anfrage an den Sites-Betreiber“ in `PHASE6-PRIVATE-TESTUMGEBUNG.md`. Im Supportchat mit dem berechtigten Eigentümerkonto anmelden; Konto-E-Mail, Tarif und gegebenenfalls Workspace erst dort ergänzen. Keine Passwörter, Tokens, MFA-Geheimnisse oder Datenbankinhalte anhängen.

## Text zum Kopieren

**Betreff: Verbindlicher Nachweis der D1-/R2-Schreibisolation zweier privater ChatGPT-Sites-Projekte vor erster Migration**

Guten Tag,

bitte leiten Sie diese Anfrage an das für ChatGPT Sites zuständige Infrastruktur-/Sicherheitsteam weiter.

Wir möchten WEZEL NEXT ausschließlich in einem bereits angelegten separaten privaten Testprojekt mit synthetischen Daten testen. Das Original muss einschließlich Datenbank, Medien, Benutzer und Zugriffspolitik unverändert bleiben.

- Originalprojekt: `appgprj_6ae8542b54bc8191b9a0048a8cc1c149`
- Bereits angelegtes Testprojekt: `appgprj_6ae9c14e16008191b530e52d6d4afac8`
- Quellstand: GitHub `cschro3/wezelschule`, Zweig `phase5-testbetrieb`, Commit `c68517161c6c5b6142087707c74eadc73abb41a7`
- Das Testprojekt ist nach dem zuletzt dokumentierten Stand privat, unveröffentlicht und ohne gemeldete D1-/R2-Bindung. Es wurde keine Testmigration und kein Deployment ausgeführt. Der Originalstand Version 9 wurde nicht veröffentlicht.

Die verfügbaren unterstützten Projekt- und Datenbankauskünfte zeigen logische Bindings beziehungsweise leere Testbindungen, jedoch keine überprüfbare physische Ressourcen-/Berechtigungszuordnung. Unterschiedliche Projekt-IDs und logische Bindingnamen reichen uns als Sicherheitsnachweis nicht aus. Da eine Bereitstellung bereits Migrationen ausführen kann, verwenden wir ein Deployment nicht zur nachträglichen Isolationsprobe.

Bitte bestätigen Sie für diese beiden konkreten Projekte verbindlich:

1. Das Testprojekt erhält eigenständige D1- und R2-Speicherressourcen.
2. Weder der Worker des Testprojekts noch dessen Migrationen, Provisionierungs- oder Deploymentprozess besitzen Schreibzugriff auf D1-/R2-Speicher des Originalprojekts; auch bei gleichen logischen Bindingnamen `DB` und `BUCKET`.
3. Nennen Sie die technische Berechtigungsgrenze und eine belastbare Dokumentation oder einen überprüfbaren Ressourcen-/Rechtenachweis, der **vor** der ersten Testmigration geprüft werden kann. Physische IDs sind nicht zwingend, wenn ein gleichwertiger verbindlicher Nachweis vorliegt.
4. Bestätigen Sie, dass das Bereitstellen des Testprojekts weder Originalressourcen neu zuordnet noch die Zugriffspolitik des Originals erweitert. Bitte nennen Sie den unterstützten sicheren Ablauf und gegebenenfalls relevante Einschränkungen.

Bitte nehmen Sie keine Migration, Bereitstellung, Änderung der Zugriffspolitik oder sonstige Schreibaktion an einem der Projekte vor. Wir benötigen zunächst ausschließlich die dokumentierte Auskunft. Bis zur eindeutigen Bestätigung bleibt die Sites-Testbereitstellung blockiert.

Vielen Dank.

## Statusprotokoll

| Datum | Vorgang | Tatsächlicher Status |
|---|---|---|
| 2026-11-03 | Offiziellen Supportweg im OpenAI-Hilfezentrum überprüft | Chat-Symbol als Kontaktweg bestätigt |
| 2026-11-03 | Vorbereitete Anfrage konkretisiert | Versandfertiger Text oben |
| 2026-11-03 | Versand / Ticket / Betreiberantwort | Nicht erfolgt / nicht vorhanden / ausstehend |

Eine allgemeine neue Freigabe wird nicht benötigt und wurde nicht angefordert. Eine unklare oder unverbindliche Antwort hebt die bestehende Sperre nicht auf.
