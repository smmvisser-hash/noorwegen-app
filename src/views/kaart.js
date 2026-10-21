import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { regioVan, korteDatum, escapeHtml } from '../regio.js';

// Zuid- en West-Noorwegen (plus de ferryhaven in Denemarken).
const REISGEBIED = L.latLngBounds([57.4, 4.6], [61.7, 10.2]);

let kaart = null;

export function sluitKaart() {
  if (kaart) {
    kaart.remove();
    kaart = null;
  }
}

// Kaartscherm. Met een dagnummer zie je alleen die dag, zonder zie je de hele reis.
export function toonKaart(app, dagen, nummer) {
  const geplande = dagen.filter((d) => d.stops.length);
  const gekozen = nummer ? geplande.filter((d) => d.dag === nummer) : geplande;

  app.innerHTML = `
    <section class="kaartscherm">
      <div class="dagkiezer" role="tablist" aria-label="Kies een dag">
        <a href="#/kaart" class="chip${nummer ? '' : ' chip--actief'}">Hele reis</a>
        ${geplande.map((d) => `
          <a href="#/kaart/${d.dag}" class="chip${d.dag === nummer ? ' chip--actief' : ''}" style="--accent:${regioVan(d).kleur}">
            Dag ${d.dag}
          </a>`).join('')}
      </div>
      <div id="kaart" class="kaart"></div>
    </section>`;

  kaart = L.map('kaart', { zoomControl: true, minZoom: 5, maxZoom: 16, maxBounds: REISGEBIED.pad(0.5) });
  L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
  }).addTo(kaart);

  const punten = [];
  for (const dag of gekozen) {
    const kleur = regioVan(dag).kleur;
    const lijn = dag.stops.map((s) => [s.lat, s.lng]);
    punten.push(...lijn);
    L.polyline(lijn, { color: kleur, weight: 5, opacity: 0.85 }).addTo(kaart);
    for (const stop of dag.stops) {
      L.circleMarker([stop.lat, stop.lng], {
        radius: stop.type === 'overnachting' ? 10 : 8,
        color: '#00205b',
        weight: 2,
        fillColor: stop.type === 'overnachting' ? '#00205b' : kleur,
        fillOpacity: 1,
      })
        .bindPopup(`
          <strong>${escapeHtml(stop.naam)}</strong><br>
          <small>Dag ${dag.dag} · ${korteDatum(dag.datum)}</small>
          <p>${escapeHtml(stop.info ?? '')}</p>
          <a href="#/dag/${dag.dag}">Naar dag ${dag.dag}</a>`)
        .addTo(kaart);
    }
  }

  if (punten.length) kaart.fitBounds(L.latLngBounds(punten), { padding: [32, 32], maxZoom: 11 });
  else kaart.fitBounds(REISGEBIED);
}
