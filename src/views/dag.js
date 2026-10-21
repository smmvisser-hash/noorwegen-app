import { regioVan, korteDatum, escapeHtml } from '../regio.js';
import { kenmerken } from './dagen.js';

const TYPE_NAAM = {
  ferry: 'Ferry',
  bezienswaardigheid: 'Bezienswaardigheid',
  stadje: 'Stadje',
  parkeren: 'Parkeren',
  kano: 'Kano',
  koffie: 'Koffie & kanelboller',
};

const SLAAP_NAAM = {
  camping: 'Camping',
  camperplaats: 'Camperplaats',
  vrij: 'Vrij kamperen',
  tent: 'Tentje (mini-tocht)',
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
  const opKaart = dag.stops.length || dag.wandelingen.length || dag.overnachting;

  app.innerHTML = `
    <section class="scherm dagdetail" style="--accent:${regio.kleur}">
      <a class="terug" href="#/">← Alle dagen</a>
      <p class="dagdatum">Dag ${dag.dag} · ${korteDatum(dag.datum)} · ${escapeHtml(regio.naam)}</p>
      <h2 class="schermtitel">${escapeHtml(dag.titel)}</h2>
      <p class="kenmerken">${kenmerken(dag).map((t) => `<span>${escapeHtml(t)}</span>`).join('')}</p>
      <p>${escapeHtml(dag.samenvatting)}</p>
      ${opKaart ? `<a class="knop" href="#/kaart/${dag.dag}">Bekijk deze dag op de kaart</a>` : ''}

      <h3>Rijden</h3>
      <dl class="feiten">
        <dt>Rijtijd</dt><dd>${escapeHtml(dag.rijden.tijd)}${dag.rijden.rijdag ? '' : ' (telt niet als rijdag)'}</dd>
        ${dag.rijden.ferry ? `<dt>Ferry</dt><dd>${escapeHtml(dag.rijden.ferry)}</dd>` : ''}
      </dl>

      ${dag.wandelingen.length ? `
        <h3>Wandelingen</h3>
        ${dag.wandelingen.map(wandelKaart).join('')}` : ''}

      ${dag.stops.length ? `
        <h3>Onderweg</h3>
        <ol class="stoplijst">
          ${dag.stops.map((s) => `
            <li>
              <span class="stoptype">${escapeHtml(TYPE_NAAM[s.type] ?? s.type)}</span>
              <strong>${escapeHtml(s.naam)}</strong>
              ${s.info ? `<span>${escapeHtml(s.info)}</span>` : ''}
              ${s.prijs ? `<span class="stil">Prijs: ${escapeHtml(s.prijs)}</span>` : ''}
            </li>`).join('')}
        </ol>` : ''}

      ${dag.boodschappen.length ? `
        <h3>🛒 Boodschappen</h3>
        <ul class="stoplijst">
          ${dag.boodschappen.map((b) => `<li><strong>${escapeHtml(b.plaats)}</strong><span>${escapeHtml(b.info)}</span></li>`).join('')}
        </ul>` : ''}

      ${dag.overnachting ? `
        <h3>Overnachting</h3>
        <div class="blok">
          <span class="stoptype">${escapeHtml(SLAAP_NAAM[dag.overnachting.type] ?? dag.overnachting.type)}</span>
          <strong>${escapeHtml(dag.overnachting.naam)}</strong>
          <span>Voorzieningen: ${dag.overnachting.voorzieningen.length ? escapeHtml(dag.overnachting.voorzieningen.join(', ')) : 'geen (off-grid)'}</span>
          <span>park4night-code: ${dag.overnachting.park4night ? escapeHtml(dag.overnachting.park4night) : '<span class="stil">nog niet ingevuld</span>'}</span>
          ${dag.overnachting.info ? `<span>${escapeHtml(dag.overnachting.info)}</span>` : ''}
        </div>` : ''}

      ${dag.meenemen.length ? `
        <h3>Meenemen</h3>
        <ul class="vinklijst">${dag.meenemen.map((m) => `<li>${escapeHtml(m)}</li>`).join('')}</ul>` : ''}

      <div class="bladeren">
        ${vorige ? `<a class="knop knop--licht" href="#/dag/${vorige.dag}">← Dag ${vorige.dag}</a>` : '<span></span>'}
        ${volgende ? `<a class="knop knop--licht" href="#/dag/${volgende.dag}">Dag ${volgende.dag} →</a>` : '<span></span>'}
      </div>
    </section>`;
}

function wandelKaart(w) {
  return `
    <div class="blok">
      <strong>🥾 ${escapeHtml(w.naam)}</strong>
      <dl class="feiten">
        <dt>Afstand</dt><dd>${w.afstand_km} km</dd>
        <dt>Hoogtemeters</dt><dd>${w.hoogtemeters} m</dd>
        <dt>Duur (jullie tempo)</dt><dd>${escapeHtml(w.duur)}</dd>
        <dt>Niveau</dt><dd>${escapeHtml(w.niveau)}</dd>
      </dl>
      <span>${escapeHtml(w.info)}</span>
    </div>`;
}
