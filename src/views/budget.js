import { escapeHtml, korteDatum } from '../regio.js';
import { nieuweId } from '../opslag.js';
import { huidigeKoers, naarEuro } from '../koers.js';
import { motief } from '../motieven.js';

export const BUDGET_EUR = 5000;

export const CATEGORIEEN = [
  { id: 'brandstof', naam: 'Brandstof', icoon: '⛽' },
  { id: 'tol', naam: 'Tol', icoon: '🛣️' },
  { id: 'ferry', naam: 'Ferry', icoon: '⛴' },
  { id: 'boodschappen', naam: 'Boodschappen', icoon: '🛒' },
  { id: 'camping', naam: 'Camping/camperplaats', icoon: '⛺' },
  { id: 'activiteiten', naam: 'Activiteiten & toegang', icoon: '🎟️' },
  { id: 'parkeren', naam: 'Parkeren', icoon: 'P' },
  { id: 'koffie', naam: 'Koffie & kaneelbroodjes', icoon: '☕' },
  { id: 'overig', naam: 'Overig', icoon: '•' },
];
const MUNTEN = ['NOK', 'DKK', 'EUR'];

const euro = (n, decimalen = 0) => n.toLocaleString('nl-NL', { style: 'currency', currency: 'EUR', minimumFractionDigits: decimalen, maximumFractionDigits: decimalen });
const bedragTekst = (n, munt) => `${n.toLocaleString('nl-NL', { minimumFractionDigits: 0, maximumFractionDigits: 2 })} ${munt}`;
const vandaag = () => new Date().toLocaleDateString('sv-SE'); // JJJJ-MM-DD in de eigen tijdzone

// Onthoudt de laatst gekozen munt en betaalwijze op dit apparaat (handig bij invoeren achter elkaar).
function laatste(sleutel, standaard) {
  try {
    return localStorage.getItem(`noorwegen-budget-${sleutel}`) ?? standaard;
  } catch {
    return standaard;
  }
}
function onthoud(sleutel, waarde) {
  try {
    localStorage.setItem(`noorwegen-budget-${sleutel}`, waarde);
  } catch {
    // niet erg
  }
}

export function toonBudget(app, opslag) {
  const uitgaven = opslag.lijst('uitgave').map((u) => u.data).sort((a, b) => (b.datum + b.tijd).localeCompare(a.datum + a.tijd));
  const koers = huidigeKoers();
  const totaal = uitgaven.reduce((s, u) => s + u.bedrag_eur, 0);
  const perCategorie = Object.fromEntries(CATEGORIEEN.map((c) => [c.id, 0]));
  const perBetaling = { pin: 0, contant: 0 };
  const contantPerMunt = {};
  for (const u of uitgaven) {
    perCategorie[u.categorie] = (perCategorie[u.categorie] ?? 0) + u.bedrag_eur;
    perBetaling[u.betaling] += u.bedrag_eur;
    if (u.betaling === 'contant') contantPerMunt[u.munt] = (contantPerMunt[u.munt] ?? 0) + u.bedrag;
  }
  const munt = laatste('munt', 'NOK');
  const betaling = laatste('betaling', 'pin');
  const procent = Math.min(100, (totaal / BUDGET_EUR) * 100);

  app.innerHTML = `
    <section class="scherm budget">
      <h2 class="schermtitel">Budget</h2>

      <div class="blok budget-totaal">
        <div class="budget-cijfers">
          <span><strong>${euro(totaal)}</strong> uitgegeven</span>
          <span class="stil">nog ${euro(BUDGET_EUR - totaal)} van ${euro(BUDGET_EUR)}</span>
        </div>
        <div class="balk" role="img" aria-label="${Math.round(procent)} procent van het budget gebruikt"><i style="width:${procent}%"></i></div>
        <div class="budget-cijfers stil">
          <span>💳 Gepind: ${euro(perBetaling.pin)}</span>
          <span>💶 Contant: ${euro(perBetaling.contant)}</span>
        </div>
        ${Object.keys(contantPerMunt).length ? `<span class="stil">Contant per munt: ${Object.entries(contantPerMunt).map(([m, b]) => escapeHtml(bedragTekst(b, m))).join(' · ')}</span>` : ''}
      </div>

      <h3>Uitgave toevoegen</h3>
      <form id="uitgave" class="formulier budget-formulier">
        <label>Bedrag
          <input name="bedrag" inputmode="decimal" autocomplete="off" placeholder="0" required>
        </label>
        <fieldset class="keuze">
          <legend>Munt</legend>
          ${MUNTEN.map((m) => `<label><input type="radio" name="munt" value="${m}" ${m === munt ? 'checked' : ''}><span>${m}</span></label>`).join('')}
        </fieldset>
        <fieldset class="keuze">
          <legend>Betaald met</legend>
          <label><input type="radio" name="betaling" value="pin" ${betaling === 'pin' ? 'checked' : ''}><span>💳 Pin</span></label>
          <label><input type="radio" name="betaling" value="contant" ${betaling === 'contant' ? 'checked' : ''}><span>💶 Contant</span></label>
        </fieldset>
        <label>Categorie
          <select name="categorie" required>
            <option value="" disabled selected>Kies…</option>
            ${CATEGORIEEN.map((c) => `<option value="${c.id}">${c.icoon} ${escapeHtml(c.naam)}</option>`).join('')}
          </select>
        </label>
        <label>Omschrijving <span class="stil">(mag leeg)</span>
          <input name="omschrijving" autocomplete="off" placeholder="bijv. Rema 1000 Odda">
        </label>
        <label>Datum
          <input name="datum" type="date" value="${vandaag()}" required>
        </label>
        <button class="knop" type="submit">Toevoegen</button>
        <p class="foutmelding" id="budgetfout" hidden></p>
      </form>
      <p class="stil koersregel">Koers: 1 euro = ${koers.NOK.toLocaleString('nl-NL')} NOK = ${koers.DKK.toLocaleString('nl-NL')} DKK
        ${koers.bron === 'ECB' ? `(ECB, ${escapeHtml(koers.datum)})` : '(standaardkoers, nog niet opgehaald)'}</p>

      <h3>Per categorie</h3>
      <ul class="categorielijst">
        ${CATEGORIEEN.map((c) => {
          const b = perCategorie[c.id];
          const deel = totaal ? (b / totaal) * 100 : 0;
          return `<li><span>${c.icoon} ${escapeHtml(c.naam)}</span><strong>${euro(b)}</strong><div class="balk balk--dun"><i style="width:${deel}%"></i></div></li>`;
        }).join('')}
      </ul>

      <h3>Alle uitgaven (${uitgaven.length})</h3>
      ${uitgaven.length ? `<ul class="uitgavenlijst">
        ${uitgaven.map((u) => {
          const cat = CATEGORIEEN.find((c) => c.id === u.categorie);
          return `<li>
            <span class="uitgave-icoon" aria-hidden="true">${cat?.icoon ?? '•'}</span>
            <span class="uitgave-tekst">
              <strong>${escapeHtml(u.omschrijving || cat?.naam || '')}</strong>
              <span class="stil">${korteDatum(u.datum)} · ${u.betaling === 'pin' ? '💳 pin' : '💶 contant'}${u.munt !== 'EUR' ? ` · ${escapeHtml(bedragTekst(u.bedrag, u.munt))}` : ''}</span>
            </span>
            <strong class="uitgave-bedrag">${euro(u.bedrag_eur, 2)}</strong>
            <button class="wis" data-id="${u.id}" aria-label="Verwijder deze uitgave">✕</button>
          </li>`;
        }).join('')}
      </ul>` : `<div class="leeg">${motief('boot')}<p class="stil">Nog geen uitgaven.</p></div>`}
    </section>`;

  app.querySelector('#uitgave').addEventListener('submit', (e) => {
    e.preventDefault();
    const f = new FormData(e.target);
    const bedrag = Number(String(f.get('bedrag')).replace(/\s/g, '').replace(',', '.'));
    const fout = app.querySelector('#budgetfout');
    if (!(bedrag > 0)) {
      fout.textContent = 'Vul een bedrag in, bijvoorbeeld 125 of 12,50.';
      fout.hidden = false;
      return;
    }
    const id = nieuweId();
    const munt = f.get('munt');
    const koersNu = huidigeKoers();
    opslag.bewaar('uitgave', id, {
      id,
      datum: f.get('datum'),
      tijd: new Date().toTimeString().slice(0, 8),
      bedrag,
      munt,
      bedrag_eur: Math.round(naarEuro(bedrag, munt, koersNu) * 100) / 100,
      koers: munt === 'EUR' ? 1 : koersNu[munt],
      koers_bron: koersNu.bron,
      categorie: f.get('categorie'),
      betaling: f.get('betaling'),
      omschrijving: String(f.get('omschrijving') ?? '').trim(),
    });
    onthoud('munt', munt);
    onthoud('betaling', f.get('betaling'));
    document.activeElement?.blur();
    toonBudget(app, opslag);
  });

  for (const knop of app.querySelectorAll('.wis')) {
    knop.addEventListener('click', () => {
      if (confirm('Deze uitgave verwijderen?')) {
        opslag.verwijder(knop.dataset.id);
        toonBudget(app, opslag);
      }
    });
  }
}
