# noorwegen-app
Eigen reisapp voor 3 weken Noorwegen (14 juni – 3 juli 2027).

## Techniek in het kort
- **Vite + gewoon JavaScript** (geen groot framework): weinig onderdelen, makkelijk te onderhouden.
- **Leaflet + OpenStreetMap** voor de kaart.
- **vite-plugin-pwa** maakt de app installeerbaar en zorgt dat hij offline opent.
- Reisinhoud staat in `src/data/reis.json`.
- Netlify bouwt de app automatisch (zie `netlify.toml`) en maakt per pull request een preview.
