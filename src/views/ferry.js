import { escapeHtml, korteDatum } from '../regio.js';
import { vasteId } from '../opslag.js';
import { haalTijden, bewaardeTijden } from '../ferry.js';
import { GECONTROLEERD } from '../data/ferries.js';

const RESERVEREN = {
  verplicht: { tekst: 'Reserveren nodig', klasse: 'label--rood' },
  aangeraden: { tekst: 'Reserveren sterk aangeraden', klasse: 'label--oranje' },
  'niet-nodig': { tekst: 'Niet reserveren, aansluiten', klasse: 'label--groen' },
};
const WEEKDAG = ['zondag', 'maandag', 'dinsdag', 'woensdag', 'donderdag', 'vrijdag', 'zaterdag'];

export const boekingId = (ferry) => vasteId('ferryboeking', ferry.dagen[0]);

// Blok voor één ferry op de dagpagina (de vertrektijden worden daarna ingevuld met vulFerry).
export function ferryHtml(ferry, dag, opslag) {
  const r = RESERVEREN[ferry.reserveren];
  const weekdag = new Date(`${dag.datum}T12:00:00Z`).getUTCDay();
  const druk = ferry.drukDagen?.includes(weekdag);
  const boeking = ferry.handmatig ? opslag?.haal(boekingId(ferry))?.data ?? {} : null;
  return `
    <div class="blok ferry" data-ferry="${ferry.id}">
      <strong>⛴ ${escapeHtml(ferry.naam)} <span class="stil">(${escapeHtml(ferry.duur)})</span></strong>
      <span class="label ${r.klasse}">${r.tekst}</span>
      <span>${escapeHtml(ferry.reserveerTekst)}</span>
      <span><b>Drukte (schatting):</b> ${escapeHtml(ferry.drukte)}${druk ? ` <b>Dag ${dag.dag} is een ${WEEKDAG[weekdag]}: reken op extra drukte.</b>` : ''}</span>
      ${ferry.seizoen ? `<span class="stil">${escapeHtml(ferry.seizoen)}</span>` : ''}
      ${ferry.handmatig ? boekingHtml(boeking) : '<div class="ferry-tijden"></div>'}
      <span class="stil prijs-bron">Informatie gecontroleerd ${korteDatum(GECONTROLEERD)}${ferry.link ? ` · <a href="${escapeHtml(ferry.link)}" target="_blank" rel="noopener">website rederij</a>` : ''}</span>
    </div>`;
}

function boekingHtml(b) {
  return `
    <form class="formulier ferry-boeking">
      <div class="twee">
        <label>Vertrek <input name="vertrek" type="time" value="${escapeHtml(b.vertrek ?? '')}"></label>
        <label>Aankomst <input name="aankomst" type="time" value="${escapeHtml(b.aankomst ?? '')}"></label>
      </div>
      <label>Rederij <input name="rederij" autocomplete="off" placeholder="Color Line of Fjord Line" value="${escapeHtml(b.rederij ?? '')}"></label>
      <label>Boekingsnummer <input name="nummer" autocomplete="off" value="${escapeHtml(b.nummer ?? '')}"></label>
      <label>Notitie <input name="notitie" autocomplete="off" placeholder="bijv. inchecken 60 min vooraf" value="${escapeHtml(b.notitie ?? '')}"></label>
      <button class="knop" type="submit">Bewaren</button>
      <span class="stil" aria-live="polite"></span>
    </form>`;
}

function tijdenHtml(resultaat, ferry) {
  if (!resultaat) return '<p class="stil">Vertrektijden ophalen…</p>';
  if (!resultaat.tijden?.length) {
    if (resultaat.fout && !resultaat.opgehaald) return `<p class="stil">Vertrektijden konden niet worden opgehaald${navigator.onLine ? '' : ' (geen internet)'}.</p>`;
    return `<p class="stil">Nog geen vertrektijden bekend${ferry.seizoen ? ' (deze ferry vaart nu niet)' : ''}.${ferry.link ? ' Kijk op de website van de rederij.' : ''}</p>`;
  }
  const t = resultaat.tijden;
  return `
    <details class="ferry-lijst">
      <summary><b>Vertrektijden</b>${resultaat.voorbeeldDatum ? ' <span class="label label--oranje">voorbeeld</span>' : ''}<br>
        <span class="stil">${t.length === 1 ? `1 afvaart om ${t[0].vertrek}` : `${t.length} afvaarten, van ${t[0].vertrek} tot ${t.at(-1).vertrek}`} · tik om te zien</span></summary>
      ${resultaat.voorbeeldDatum ? `<p class="stil">Tijden van ${korteDatum(resultaat.voorbeeldDatum)} (zelfde weekdag). De dienstregeling voor de reisdag is nog niet bekend.</p>` : ''}
      <ul class="tijden">${t.map((x) => `<li>${x.vertrek}<small>→ ${x.aankomst}</small></li>`).join('')}</ul>
    </details>
    <span class="stil">Bron: Entur · opgehaald ${korteDatum(new Date(resultaat.opgehaald).toISOString().slice(0, 10))}${resultaat.fout ? ' · nieuw ophalen lukte niet' : ''}</span>`;
}

// Vertrektijden invullen en het invulformulier voor de handmatige ferry koppelen.
export function vulFerry(houder, ferry, dag, opslag) {
  const form = houder.querySelector('.ferry-boeking');
  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const f = Object.fromEntries(new FormData(form));
      for (const k in f) f[k] = String(f[k]).trim();
      document.activeElement?.blur();
      opslag.bewaar('ferryboeking', boekingId(ferry), { ferry: ferry.id, dag: dag.dag, ...f });
      form.querySelector('[aria-live]').textContent = 'Bewaard.';
    });
    return;
  }
  const plek = houder.querySelector('.ferry-tijden');
  plek.innerHTML = tijdenHtml(bewaardeTijden(ferry, dag.datum), ferry);
  haalTijden(ferry, dag.datum).then((r) => plek.isConnected && (plek.innerHTML = tijdenHtml(r, ferry)));
}
