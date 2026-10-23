import { regioVan, korteDatum, escapeHtml } from '../regio.js';
import { vulWeer } from './weer.js';
import { vandaagOslo } from '../weer.js';
import { FERRIES } from '../data/ferries.js';
import { boekingId } from './ferry.js';
import { polarstepsLink } from '../polarsteps.js';

// Startscherm: alle 20 reisdagen onder elkaar.
export function toonDagen(app, dagen, reis, opslag) {
  // Tijdens de reis: bovenaan het weer van vandaag.
  const vandaag = dagen.find((d) => d.datum === vandaagOslo());
  const plek = vandaag && (vandaag.overnachting ?? dagen.find((d) => d.dag === vandaag.dag - 1)?.overnachting);
  app.innerHTML = `
    <section class="scherm">
      <h2 class="schermtitel">De 20 reisdagen</h2>
      ${plek ? `
        <a class="blok vandaag" href="#/dag/${vandaag.dag}" style="--accent:${regioVan(vandaag).kleur}">
          <strong>Vandaag: dag ${vandaag.dag} · ${escapeHtml(vandaag.titel)}</strong>
        </a>
        <div class="blok weer" id="weer-vandaag"></div>` : ''}
      ${polarstepsLink(opslag) ? `<a class="knop polarsteps-knop" href="${escapeHtml(polarstepsLink(opslag))}" target="_blank" rel="noopener">📖 Ons reisdagboek in Polarsteps</a>` : ''}
      <p class="waarschuwing">${escapeHtml(reis.let_op)}</p>
      <ol class="dagenlijst">
        ${dagen.map((d) => dagKaart(d, opslag)).join('')}
      </ol>
      <p class="versie">Versie: ${escapeHtml(__VERSIE__)}</p>
    </section>`;
  if (plek) vulWeer(app.querySelector('#weer-vandaag'), { lat: plek.lat, lon: plek.lng, datum: vandaag.datum });
}

// Korte kenmerken van een dag als kleine labels.
export function kenmerken(dag) {
  const k = [];
  k.push(dag.rijden.rijdag ? `🚐 ${dag.rijden.tijd}` : '🚐 rustdag');
  if (dag.rijden.ferry) k.push('⛴ ferry');
  if (dag.wandelingen.length) k.push('🥾 wandelen');
  if (dag.stops.some((s) => s.type === 'kano')) k.push('🛶 kano');
  if (dag.boodschappen.length) k.push('🛒 boodschappen');
  if (['vrij', 'tent', 'camperplaats'].includes(dag.overnachting?.type)) k.push('⛺ off-grid');
  return k;
}

function dagKaart(dag, opslag) {
  const regio = regioVan(dag);
  // Zelf ingevulde ferrytijd (Hirtshals–Kristiansand) ook op de dagkaart tonen.
  const ferry = FERRIES.find((f) => f.handmatig && f.dagen.includes(dag.dag));
  const vertrek = ferry && opslag?.haal(boekingId(ferry))?.data.vertrek;
  return `
    <li>
      <a class="dagkaart" href="#/dag/${dag.dag}" style="--accent:${regio.kleur}">
        <span class="dagnummer">${dag.dag}</span>
        <span class="dagtekst">
          <span class="dagdatum">${korteDatum(dag.datum)} · ${escapeHtml(regio.naam)}</span>
          <span class="dagtitel">${escapeHtml(dag.titel)}</span>
          <span class="kenmerken">${kenmerken(dag).map((t) => `<span>${escapeHtml(t === '⛴ ferry' && vertrek ? `⛴ ferry ${vertrek}` : t)}</span>`).join('')}</span>
        </span>
      </a>
    </li>`;
}
