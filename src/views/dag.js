import { regioVan, korteDatum, escapeHtml } from '../regio.js';
import { kenmerken } from './dagen.js';
import { vasteId } from '../opslag.js';

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
export function toonDag(app, dagen, nummer, opslag) {
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
              ${prijsRegel(s)}
              ${meerOver(s)}
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
          <form class="p4n" id="p4n">
            <label for="p4n-code">park4night-code</label>
            <div class="p4n-rij">
              <input id="p4n-code" name="code" inputmode="numeric" autocomplete="off" placeholder="bijv. 123456" value="${escapeHtml(park4night(dag, opslag))}">
              <button class="knop knop--klein" type="submit">Bewaar</button>
            </div>
            <span class="stil" id="p4n-melding" aria-live="polite"></span>
          </form>
          ${dag.overnachting.info ? `<span>${escapeHtml(dag.overnachting.info)}</span>` : ''}
          ${prijsRegel(dag.overnachting)}
        </div>` : ''}

      ${dag.meenemen.length ? `
        <h3>Meenemen</h3>
        <ul class="vinklijst">${dag.meenemen.map((m) => `<li>${escapeHtml(m)}</li>`).join('')}</ul>` : ''}

      ${dag.achtergrond ? `
        <h3>Achtergrond</h3>
        <p>${escapeHtml(dag.achtergrond)}</p>` : ''}

      ${dag.omgeving ? `
        <h3>Natuur en omgeving</h3>
        <p>${escapeHtml(dag.omgeving)}</p>` : ''}

      ${dag.verhalen.length ? `
        <h3>Verhalen en legendes</h3>
        ${dag.verhalen.map((v) => `
          <details class="blok verhaal">
            <summary>${escapeHtml(v.titel)}</summary>
            <p>${escapeHtml(v.tekst)}</p>
          </details>`).join('')}` : ''}

      <div class="bladeren">
        ${vorige ? `<a class="knop knop--licht" href="#/dag/${vorige.dag}">← Dag ${vorige.dag}</a>` : '<span></span>'}
        ${volgende ? `<a class="knop knop--licht" href="#/dag/${volgende.dag}">Dag ${volgende.dag} →</a>` : '<span></span>'}
      </div>
    </section>`;

  // park4night-code bewaren (gedeeld met de andere apparaten).
  app.querySelector('#p4n')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const code = e.target.code.value.trim();
    opslag.bewaar('park4night', vasteId('park4night', dag.dag), { dag: dag.dag, code });
    e.target.code.blur();
    app.querySelector('#p4n-melding').textContent = code ? 'Bewaard.' : 'Gewist.';
  });
}

function park4night(dag, opslag) {
  return opslag?.haal(vasteId('park4night', dag.dag))?.data.code ?? dag.overnachting.park4night ?? '';
}

function wandelKaart(w) {
  return `
    <div class="blok">
      <strong>🥾 ${escapeHtml(w.naam)}</strong>
      <dl class="feiten">
        <dt>Afstand</dt><dd>${w.afstand_km != null ? `${w.afstand_km} km` : 'nog uitzoeken'}</dd>
        <dt>Hoogtemeters</dt><dd>${w.hoogtemeters != null ? `${w.hoogtemeters} m` : 'nog uitzoeken'}</dd>
        <dt>Duur (jullie tempo)</dt><dd>${escapeHtml(w.duur)}</dd>
        <dt>Niveau</dt><dd>${escapeHtml(w.niveau)}</dd>
        <dt>Markering</dt><dd>${escapeHtml(w.markering)}</dd>
      </dl>
      <span>${escapeHtml(w.info)}</span>
      ${prijsRegel(w)}
      ${w.route ? routeBlok(w.route) : ''}
      ${meerOver(w)}
    </div>`;
}

// Route uit OpenStreetMap met hoogteprofiel en downloadbaar GPX-bestand.
function routeBlok(r) {
  return `
    <div class="route">
      <strong>Route en hoogteprofiel</strong>
      ${hoogteprofiel(r.profiel)}
      <span class="stil">${escapeHtml(r.omschrijving)}: ${r.enkele_reis_km} km enkele reis${r.heen_en_terug ? `, ${r.totaal_km} km heen en terug` : ''} ·
        stijgen ca. ${r.totaal_stijging_m} m · ${r.laagste_m}–${r.hoogste_m} m hoogte (berekend uit de route)</span>
      <a class="knop knop--licht knop--klein" href="${escapeHtml(r.gpx)}" download>GPX-bestand downloaden</a>
      <span class="bronregel">${escapeHtml(r.bron)}</span>
    </div>`;
}

// Eenvoudig hoogteprofiel als SVG: afstand (km) horizontaal, hoogte (m) verticaal.
function hoogteprofiel(profiel) {
  const B = 320, H = 130, L = 46, O = 18;
  const maxKm = profiel[profiel.length - 1][0] || 1;
  const hoogtes = profiel.map((p) => p[1]);
  const lo = Math.floor(Math.min(...hoogtes) / 100) * 100;
  const hi = Math.ceil(Math.max(...hoogtes) / 100) * 100 || lo + 100;
  const x = (km) => L + (km / maxKm) * (B - L - 4);
  const y = (m) => 4 + (1 - (m - lo) / (hi - lo)) * (H - O - 4);
  const lijn = profiel.map(([km, m]) => `${x(km).toFixed(1)},${y(m).toFixed(1)}`).join(' ');
  return `
    <svg class="profiel" viewBox="0 0 ${B} ${H}" role="img" aria-label="Hoogteprofiel van ${lo} tot ${hi} meter over ${maxKm} km">
      <polygon points="${x(0)},${y(lo)} ${lijn} ${x(maxKm)},${y(lo)}" class="profiel-vlak" />
      <polyline points="${lijn}" class="profiel-lijn" />
      <text x="${L - 4}" y="${y(hi) + 4}" text-anchor="end">${hi} m</text>
      <text x="${L - 4}" y="${y(lo)}" text-anchor="end">${lo} m</text>
      <text x="${L}" y="${H - 3}">0 km</text>
      <text x="${B - 4}" y="${H - 3}" text-anchor="end">${maxKm} km</text>
    </svg>`;
}

// Prijs met (als bekend) de datum waarop die is opgezocht en een link naar de bron.
function prijsRegel(item) {
  if (!item.prijs) return '';
  const datum = item.gecontroleerd ? ` · opgezocht ${korteDatum(item.gecontroleerd)} ${item.gecontroleerd.slice(0, 4)}` : '';
  const bron = item.bron ? ` · <a href="${escapeHtml(item.bron)}" target="_blank" rel="noopener">bron</a>` : '';
  return `<span class="prijs">💰 ${escapeHtml(item.prijs)}<span class="stil">${datum}</span>${bron}</span>`;
}

// Foto (als die er is) en een uitklapbaar stuk met de uitgebreide beschrijving.
function meerOver(item) {
  return `
    ${item.afbeelding ? foto(item.afbeelding) : ''}
    ${item.beschrijving ? `
      <details class="meer">
        <summary>Meer over ${escapeHtml(item.naam)}</summary>
        <p>${escapeHtml(item.beschrijving)}</p>
      </details>` : ''}`;
}

function foto(a) {
  return `
    <figure class="foto">
      <img src="${escapeHtml(a.src)}" alt="${escapeHtml(a.bijschrift ?? '')}" loading="lazy" width="${a.breedte ?? ''}" height="${a.hoogte ?? ''}">
      <figcaption>
        ${escapeHtml(a.bijschrift ?? '')}${a.maker ? ` · Foto: ${escapeHtml(a.maker)}` : ''}${a.licentie ? ` (${escapeHtml(a.licentie)})` : ''}
        ${a.bron ? ` · <a href="${escapeHtml(a.bron)}" target="_blank" rel="noopener">bron</a>` : ''}
      </figcaption>
    </figure>`;
}
