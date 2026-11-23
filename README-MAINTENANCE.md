# Lightning Horn Unicorn — Wartung & Architektur

## Einstieg

- **`index.html`** ist die einzige lauffähige Seite. CSS, JavaScript, 3D-Intro und
  Site-Shell liegen bewusst monolithisch in dieser Datei.
- **`404.html`** ist ein automatisch erzeugter, vollständiger Spiegel von
  `index.html`. GitHub Pages liefert ihn für unbekannte Pfade aus; dadurch
  funktionieren Deep-Links wie `/about`, `/vhsmultiverse` und sogar alte
  `/01_about.html`-Bookmarks ohne Redirect-Stub.

## Inhalte

- Die Dateien in **`txt/`** (`about.txt`, `vhsmultiverse.txt`, `humanart.txt`,
  `projects.txt`, `storytime.txt`, `music.txt`, `contact.txt`, `donate.txt`)
  sind die kanonischen Content-Master. Sie sind vollständige HTML-Dokumente,
  liegen aber als `.txt` vor, damit sie diff- und editorfreundlich bleiben.
- Der Loader in `index.html` parst sie mit `DOMParser`, extrahiert ausschließlich
  den Inhalt von `<main>` (`normalizeFragmentDocument`) und injiziert ihn in
  `#mainContent`. Standalone-Skripte im Head der Master werden dabei verworfen.
- Alte nummerierte Dateien und duplicate HTML-Kopien sind nicht mehr Teil der
  Site; sie liegen im Archiv `_unused_archive/` neben diesem Ordner.

## Wartungsbefehle

Nach **jeder** Änderung an `index.html` oder an Inhaltsdateien:

```bash
node tools/sync-404.js     # 404.html neu aus index.html erzeugen
node tools/gen-manifest.js # Integritäts-Manifest neu berechnen
node tools/verify.js       # Syntax, IDs, Assets, Manifest, 404-Spiegel prüfen
```

`verify.js` prüft auch, ob alle lokalen Referenzen (Bilder, Audio, GLB, Kapitel)
tatsächlich existieren. Es sollte immer *„All checks passed"* ausgeben.

## Routing

| Muster | Beispiel | Ziel |
|---|---|---|
| Kanonisch | `/about`, `/vhsmultiverse`, `/humanart`, `/projects`, `/storytime`, `/music`, `/contact`, `/donate` | Kategorie |
| Legacy-Alias (nummeriert) | `/01_about` … `/08_donate` | Kategorie |
| Legacy-Alias (alte UI) | `/hire-me` | CONTACT |
| Alte Datei-URL | `/01_about.html` | Kategorie |
| Unbekannt | `/irgendwas` | 404-Shell mit Welcome-Card |

## Externe Abhängigkeiten

Die 3D-Intro-Technik (Three.js r160, Addons) und die Schrift `VT323` kommen von
CDN. Die Site-Shell, Navigation und alle Inhalte funktionieren auch ohne diese
Ressourcen – sie werden nicht mehr über `DOMContentLoaded` blockiert.

`downloads.html` ist eine eigenständige **Paid-Feature**-Seite. Sie ist bewusst
**nicht** in der Main-Page verlinkt, sondern nur über die direkte URL
`https://www.lightninghornunicorn.com/downloads` erreichbar. Bitte keinen
Download-Link in die Navigation einbauen. Die Seite nutzt ebenfalls
CDN-Bibliotheken.
