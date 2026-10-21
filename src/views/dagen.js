import { regioVan, korteDatum, escapeHtml } from '../regio.js';

// Startscherm: alle 20 reisdagen onder elkaar.
export function toonDagen(app, dagen) {
  app.innerHTML = `
    <section class="scherm">
      <h2 class="schermtitel">De 20 reisdagen</h2>
      <ol class="dagenlijst">
        ${dagen.map(dagKaart).join('')}
      </ol>
    </section>`;
}

function dagKaart(dag) {
  const regio = regioVan(dag);
  const leeg = !dag.stops.length && dag.titel === 'Nog te plannen';
  return `
    <li>
      <a class="dagkaart${leeg ? ' dagkaart--leeg' : ''}" href="#/dag/${dag.dag}" style="--accent:${regio.kleur}">
        <span class="dagnummer">${dag.dag}</span>
        <span class="dagtekst">
          <span class="dagdatum">${korteDatum(dag.datum)}${dag.regio ? ` · ${escapeHtml(regio.naam)}` : ''}</span>
          <span class="dagtitel">${escapeHtml(dag.titel)}</span>
        </span>
        ${dag.voorbeeld ? '<span class="label">voorbeeld</span>' : ''}
      </a>
    </li>`;
}
