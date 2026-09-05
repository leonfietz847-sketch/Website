# Access Point

Eine eigenständige, responsive Passwortabfrage ohne Backend oder externe Laufzeitabhängigkeiten.

## Start

`index.html` direkt im Browser öffnen. Die Seite funktioniert ohne Build-Schritt.

## Funktionen

- Vollständiger Name und Passwort als Pflichtfelder
- Verständliche Fehlermeldungen bei leeren Eingaben
- Zufälliges Passwort mit `crypto.getRandomValues`
- Passwort anzeigen/verbergen
- Lokale Validierung ohne Datenübertragung

## Registrierung und Rollen

Über „Neues Konto erstellen“ können neue Benutzerkonten im Browser angelegt werden. Neue Konten sehen nach dem Login nur die Wetterübersicht. Der Admin `Leon Fietz` hat zusätzlich Zugriff auf die Kontenverwaltung und kann registrierte Konten löschen.

Beim Dashboard-Aufruf wird der ungefähre Standort über den öffentlichen IP-Dienst `ipwho.is` ermittelt. Für diesen Ort kommen die Wetterdaten von Open-Meteo. Das Ortsfeld kann die automatische Auswahl jederzeit überschreiben.

Admins können beim Erstellen eines Kontos zwischen `Benutzer · Nur ansehen` und `Admin · Vollzugriff` wählen. Wetterkarten sind anklickbar und vergleichen den ausgewählten Messwert mit Berlin, Paris, London, Rom und New York.

## Admin-Demozugang

Name: `Leon Fietz`

Passwort: `kJ*yRhn&nKV3mo%Ge&`

Die Admin-Prüfung läuft ausschließlich im Frontend und ist daher nur für eine lokale Demo geeignet. Für einen echten Adminzugang müssen Benutzer und Passwörter serverseitig gespeichert und geprüft werden.
