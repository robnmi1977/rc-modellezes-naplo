# RC modellezés

Statikus (GitHub Pages) változat a claude.ai „RC modellezés” dashboardból.

- `index.html`, `style.css`, `app.js` – az oldal (a számítások az eredeti dashboard logikáját követik)
- `data/` – adat-pillanatkép
  - `log.json` – „1.10 buggy history 2026-” / maintenance history
  - `y2023.json` … `y2026.json` – „1.8 buggy truggy history” évenkénti lapjai
  - `myrcm_*.csv`, `bajnoksag.csv` – MyRCM eredmények és bajnoki helyezések
  - `meta.json` – a pillanatkép dátuma
- `vendor/d3.min.js` – d3 v7 (ISC licenc, `vendor/d3.LICENSE`)

Az adatok nem frissülnek maguktól: új szervizbejegyzések után a `data/` fájlokat kell újragenerálni és pusholni.
