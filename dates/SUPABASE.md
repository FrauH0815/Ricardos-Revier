# Supabase für den Barbie-Raum

Aufteilung: **ChatGPT** kümmert sich um die Datenbank (Supabase) und `dates/config.js`.
**Claude** kümmert sich um die Website (`index.html`, `dates/dates.js`, `dates/dates.json`). Bitte jeweils nur die eigenen Dateien ändern.

## Was die Oberfläche speichern muss

1. **Status pro Date-Idee**: `date_id` (z01–z60, k01–k40 aus `dates/dates.json`), `status` ('geplant' oder 'erledigt'), `datum`.
2. **Briefe**: von (Franzi/Ricardo), an, Text, gelesen ja/nein, erstellt am.
3. **Fotos pro Date**: `date_id` und Pfad im privaten Bucket.
4. **Lieblingsbild über dem Sofa**: im privaten Bucket, Pfad `raum/lieblingsbild.jpg`.

Login: E-Mail + Passwort für zwei Benutzer, Name in `user_metadata.name` ('Franzi' / 'Ricardo'). Zugriff per RLS nur für diese beiden.

## Umschalten

Solange in `dates/config.js` kein `export const DATES_READY = true;` steht, speichert die Seite alles nur auf dem jeweiligen Handy.
Erst wenn Login und Tabellen fertig sind, `DATES_READY = true` setzen. Vorher braucht Claude die genauen Spalten
der Tabellen `ricardo_date_ideas` und `ricardo_date_messages` (und ggf. Foto-Tabelle), damit `dates/dates.js` passt.
