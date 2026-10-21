import { regioVan, korteDatum, escapeHtml } from '../regio.js';

// Startscherm: alle 20 reisdagen onder elkaar.
export function toonDagen(app, dagen, reis) {
  app.innerHTML = `
    <section class="scherm">
      <h2 class="schermtitel">De 20 reisdagen</h2>
      <p class="waarschuwing">${escapeHtml(reis.let_op)}</p>
      <ol class="dagenlijst">
        ${dagen.map(dagKaart).join('')}
      </ol>
      <p class="versie">Versie: ${escapeHtml(__VERSIE__)}</p>
    </section>`;
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

function dagKaart(dag) {
  const regio = regioVan(dag);
  return `
    <li>
      <a class="dagkaart" href="#/dag/${dag.dag}" style="--accent:${regio.kleur}">
        <span class="dagnummer">${dag.dag}</span>
        <span class="dagtekst">
          <span class="dagdatum">${korteDatum(dag.datum)} · ${escapeHtml(regio.naam)}</span>
          <span class="dagtitel">${escapeHtml(dag.titel)}</span>
          <span class="kenmerken">${kenmerken(dag).map((t) => `<span>${escapeHtml(t)}</span>`).join('')}</span>
        </span>
      </a>
    </li>`;
}
