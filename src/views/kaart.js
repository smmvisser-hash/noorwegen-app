import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { regioVan, korteDatum, escapeHtml } from '../regio.js';

// Zuid- en West-Noorwegen (plus de ferryhaven in Denemarken).
const REISGEBIED = L.latLngBounds([57.4, 4.6], [62.4, 10.2]);

const SYMBOOL = {
  ferry: '⛴',
  bezienswaardigheid: '★',
  stadje: '⌂',
  parkeren: 'P',
  kano: '🛶',
  koffie: '☕',
  wandeling: '🥾',
  overnachting: '⛺',
  supermarkt: '🛒',
};

let kaart = null;

export function sluitKaart() {
  if (kaart) {
    kaart.remove();
    kaart = null;
  }
}

// Bij de hele reis kleine stipjes, bij één dag grote symbolen.
function punt(lat, lng, symbool, kleur, popup, klein) {
  if (klein) {
    return L.circleMarker([lat, lng], { radius: 6, color: '#00205b', weight: 2, fillColor: kleur, fillOpacity: 1 })
      .bindPopup(popup);
  }
  return L.marker([lat, lng], {
    icon: L.divIcon({
      className: 'kaartpunt',
      html: `<span style="--accent:${kleur}">${symbool}</span>`,
      iconSize: [34, 34],
      iconAnchor: [17, 17],
    }),
  }).bindPopup(popup);
}

function popupTekst(titel, dag, tekst) {
  return `
    <strong>${escapeHtml(titel)}</strong><br>
    <small>Dag ${dag.dag} · ${korteDatum(dag.datum)}</small>
    ${tekst ? `<p>${escapeHtml(tekst)}</p>` : ''}
    <a href="#/dag/${dag.dag}">Naar dag ${dag.dag}</a>`;
}

// Kaartscherm. Met een dagnummer zie je alleen die dag, zonder zie je de hele reis.
export function toonKaart(app, dagen, nummer) {
  const gekozen = nummer ? dagen.filter((d) => d.dag === nummer) : dagen;

  app.innerHTML = `
    <section class="kaartscherm">
      <div class="dagkiezer" aria-label="Kies een dag">
        <a href="#/kaart" class="chip${nummer ? '' : ' chip--actief'}" style="--accent:var(--blauw)">Hele reis</a>
        ${dagen.map((d) => `
          <a href="#/kaart/${d.dag}" class="chip${d.dag === nummer ? ' chip--actief' : ''}" style="--accent:${regioVan(d).kleur}">
            Dag ${d.dag}
          </a>`).join('')}
      </div>
      <div id="kaart" class="kaart"></div>
    </section>`;

  kaart = L.map('kaart', { zoomSnap: 0.25, minZoom: 4, maxZoom: 16, maxBounds: REISGEBIED.pad(0.5) });
  L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
  }).addTo(kaart);

  // Lagen die je met het knopje rechtsboven aan- en uitzet.
  const lagen = {
    'Route en stops': L.layerGroup().addTo(kaart),
    'Wandelingen': L.layerGroup().addTo(kaart),
    'Overnachtingen': L.layerGroup().addTo(kaart),
    'Supermarkten': L.layerGroup(),
  };
  // Supermarkten alleen standaard tonen als je één dag bekijkt.
  if (nummer) lagen['Supermarkten'].addTo(kaart);
  const klein = !nummer;
  L.control.layers(null, lagen, { collapsed: true }).addTo(kaart);

  const punten = [];
  for (const dag of gekozen) {
    const kleur = regioVan(dag).kleur;

    // De lijn begint bij de overnachting van de vorige dag.
    const vorige = dagen.find((d) => d.dag === dag.dag - 1)?.overnachting;
    const lijn = [];
    if (vorige) lijn.push([vorige.lat, vorige.lng]);
    for (const s of dag.stops) lijn.push([s.lat, s.lng]);
    if (dag.overnachting) lijn.push([dag.overnachting.lat, dag.overnachting.lng]);
    if (lijn.length > 1) L.polyline(lijn, { color: kleur, weight: 5, opacity: 0.85 }).addTo(lagen['Route en stops']);
    punten.push(...lijn);

    for (const s of dag.stops) {
      punt(s.lat, s.lng, SYMBOOL[s.type] ?? '•', kleur, popupTekst(s.naam, dag, s.info), klein).addTo(lagen['Route en stops']);
    }
    for (const w of dag.wandelingen) {
      const tekst = `${w.afstand_km} km · ${w.hoogtemeters} hm · ${w.duur}`;
      punt(w.lat, w.lng, SYMBOOL.wandeling, kleur, popupTekst(w.naam, dag, tekst), klein).addTo(lagen['Wandelingen']);
      punten.push([w.lat, w.lng]);
    }
    for (const b of dag.boodschappen) {
      punt(b.lat, b.lng, SYMBOOL.supermarkt, kleur, popupTekst(`Supermarkt ${b.plaats}`, dag, b.info), klein).addTo(lagen['Supermarkten']);
    }
    if (dag.overnachting) {
      const o = dag.overnachting;
      punt(o.lat, o.lng, SYMBOOL.overnachting, kleur, popupTekst(o.naam, dag, o.info), klein).addTo(lagen['Overnachtingen']);
    }
  }

  // Bij de hele reis laten we Nederland/Denemarken buiten beeld, zodat Noorwegen groot te zien is.
  const inNoorwegen = nummer ? punten : punten.filter(([lat]) => lat > 57.9);
  if (inNoorwegen.length) kaart.fitBounds(L.latLngBounds(inNoorwegen), { padding: [24, 24], maxZoom: 11 });
  else kaart.fitBounds(REISGEBIED);
}
