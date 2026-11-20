# Fekete Family Racing Stats

RoB, Fekete Zsombor és Fekete Hunor MyRCM versenyeredményei és bajnoki helyezései – statikus (GitHub Pages) változat a claude.ai „RC modellezés” dashboard versenyes részéből. A szerviztörténet csak az eredeti dashboardban van.

- `index.html`, `style.css`, `app.js` – az oldal
- `data/`
  - `myrcm_rob.csv`, `myrcm_zsombor.csv`, `myrcm_hunor.csv` – versenyenkénti eredmények
  - `bajnoksag.csv` – bajnoki szezonvégi helyezések (MyRCM Championship)
  - `meta.json` – a pillanatkép dátuma
- `vendor/d3.min.js` – d3 v7 (ISC licenc, `vendor/d3.LICENSE`)

Az adatok nem frissülnek maguktól: új verseny után a `data/` fájlokat kell újragenerálni és pusholni.
