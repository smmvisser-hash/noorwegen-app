import { regioVan, korteDatum, escapeHtml } from '../regio.js';

const TYPE_NAAM = {
  ferry: 'Ferry',
  bezienswaardigheid: 'Bezienswaardigheid',
  stadje: 'Stadje',
  parkeren: 'Parkeren',
  overnachting: 'Overnachting',
};

// Detailscherm van één dag.
export function toonDag(app, dagen, nummer) {
  const dag = dagen.find((d) => d.dag === nummer);
  if (!dag) {
    app.innerHTML = `<section class="scherm"><p>Deze dag bestaat niet.</p><a class="knop" href="#/">Terug</a></section>`;
    return;
  }
  const regio = regioVan(dag);
  const vorige = dagen.find((d) => d.dag === nummer - 1);
  const volgende = dagen.find((d) => d.dag === nummer + 1);

  app.innerHTML = `
    <section class="scherm dagdetail" style="--accent:${regio.kleur}">
      <a class="terug" href="#/">← Alle dagen</a>
      <p class="dagdatum">Dag ${dag.dag} · ${korteDatum(dag.datum)} · ${escapeHtml(regio.naam)}</p>
      <h2 class="schermtitel">${escapeHtml(dag.titel)}</h2>
      ${dag.voorbeeld ? '<p class="waarschuwing">Voorbeelddata: plekken en prijzen zijn nog niet gecontroleerd.</p>' : ''}
      ${dag.samenvatting ? `<p>${escapeHtml(dag.samenvatting)}</p>` : '<p class="stil">Voor deze dag is nog niets gepland.</p>'}
      ${dag.stops.length ? `
        <a class="knop" href="#/kaart/${dag.dag}">Bekijk deze dag op de kaart</a>
        <h3>Stops</h3>
        <ol class="stoplijst">
          ${dag.stops.map((s) => `
            <li>
              <span class="stoptype">${escapeHtml(TYPE_NAAM[s.type] ?? s.type)}</span>
              <strong>${escapeHtml(s.naam)}</strong>
              <span>${escapeHtml(s.info ?? '')}</span>
            </li>`).join('')}
        </ol>` : ''}
      <div class="bladeren">
        ${vorige ? `<a class="knop knop--licht" href="#/dag/${vorige.dag}">← Dag ${vorige.dag}</a>` : '<span></span>'}
        ${volgende ? `<a class="knop knop--licht" href="#/dag/${volgende.dag}">Dag ${volgende.dag} →</a>` : '<span></span>'}
      </div>
    </section>`;
}
