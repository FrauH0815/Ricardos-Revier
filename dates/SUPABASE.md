# Supabase für den Barbie-Raum

Aufteilung: **ChatGPT** kümmert sich um die Datenbank (Supabase) und `dates/config.js`.
**Claude** kümmert sich um die Website (`index.html`, `dates/dates.js`, `dates/dates.json`). Bitte jeweils nur die eigenen Dateien ändern.

Die Date-Ideen selbst stehen in `dates/dates.json` (100 Stück, IDs p01–p60, w01–w20, f01–f10, x01–x10).
In Supabase wird nur gespeichert, **was ihr damit erlebt habt**.

## Was `dates/dates.js` erwartet (Namen aus `dates/config.js`)

### Tabelle `ricardo_date_ideas` (DATE_IDEAS_TABLE): eine Zeile pro Idee, die geplant oder erlebt ist

| Spalte       | Typ         | Bedeutung                                            |
|--------------|-------------|------------------------------------------------------|
| `id`         | text, PK    | ID aus dates.json, z. B. `p07`                       |
| `status`     | text, null  | `'geplant'` oder `'erlebt'` (null = wieder frei)     |
| `erlebt_am`  | date        | Datum des Dates                                      |
| `erinnerung` | text        | persönliche Erinnerung                               |
| `fotos`      | text[]      | Pfade im Bucket, z. B. `p07/1730460000000-ab12c.jpg` |
| `updated_by` | text        | 'Franzi' oder 'Ricardo'                              |
| `updated_at` | timestamptz |                                                      |

Die Seite liest mit `select('id,status,erlebt_am,erinnerung,fotos')` und schreibt mit `upsert`.
Gibt es in der Tabelle weitere Spalten (z. B. Titel), stören die nicht, solange sie nicht Pflicht sind.

### Tabelle `ricardo_date_messages` (DATE_MESSAGES_TABLE): Briefkasten

`id` (uuid, default), `von` text, `an` text, `text` text, `gelesen` boolean default false, `created_at` timestamptz default now().

### Bucket `ricardo-date-photos` (DATE_PHOTOS_BUCKET), privat

- Date-Fotos unter `<id>/<datei>.jpg`, die Seite lädt sie hoch und zeigt sie über signierte Links.
- Lieblingsbild über dem Sofa unter `raum/lieblingsbild.jpg`.

### Login

E-Mail + Passwort für Franzi und Ricardo, Name in `user_metadata.name` ('Franzi' / 'Ricardo').
RLS: lesen/schreiben nur für diese beiden angemeldeten Benutzer, auch im Bucket.

## Umschalten

Solange in `dates/config.js` kein `export const DATES_READY = true;` steht, speichert die Seite alles nur auf dem jeweiligen Handy.
Wenn Tabellen, Bucket und Login stehen: `DATES_READY = true` ergänzen. Ab dann fragt die Seite nach dem Login.
