import { escapeHtml } from '../regio.js';
import { spullen, reizigers, bewaarNaam, isAfgevinkt, zetVink, voegToe, haalWeg } from '../paklijst.js';

// Staat de lijst in "aanpassen"-stand (met verwijderknoppen)? Blijft zo als het scherm opnieuw getekend wordt.
const aanpassen = { paklijst: false, rugzak: false };

function laatsteTab() {
  try {
    return localStorage.getItem('noorwegen-paklijst-tab') ?? 'samen';
  } catch {
    return 'samen';
  }
}

// Afvinklijst met voortgang, gegroepeerd. wie = van wie de vinkjes zijn ('samen', 'a', 'b' of 'dag5').
function lijstHtml(opslag, items, wie, { metGroepen = true, namen = null } = {}) {
  const af = items.filter((s) => isAfgevinkt(opslag, s.sleutel, wie)).length;
  const groepen = [...new Set(items.map((s) => s.groep))];
  const regels = (groep) =>
    items
      .filter((s) => s.groep === groep)
      .map((s) => `
        <li>
          <label>
            <input type="checkbox" data-sleutel="${escapeHtml(s.sleutel)}" ${isAfgevinkt(opslag, s.sleutel, wie) ? 'checked' : ''}>
            <span>${escapeHtml(s.naam)}${namen && s.voor !== 'beiden' ? ` <small class="stil">(alleen ${escapeHtml(namen[s.voor])})</small>` : ''}</span>
          </label>
          <button type="button" class="wis" data-sleutel="${escapeHtml(s.sleutel)}" aria-label="Haal ${escapeHtml(s.naam)} van de lijst">✕</button>
        </li>`)
      .join('');
  return `
    <div class="voortgang">
      <span><strong>${af}</strong> van ${items.length} ingepakt</span>
      <div class="balk" role="img" aria-label="${af} van ${items.length} ingepakt"><i style="width:${items.length ? (af / items.length) * 100 : 0}%"></i></div>
    </div>
    ${groepen
      .map((g) => `${metGroepen ? `<h4 class="groepkop">${escapeHtml(g)}</h4>` : ''}<ul class="afvinklijst">${regels(g)}</ul>`)
      .join('')}`;
}

// Gemeenschappelijke knoppen: afvinken, weghalen, alles uitvinken, aanpassen.
function koppel(root, opslag, items, wie, lijst, dag, opnieuw, stand) {
  for (const vak of root.querySelectorAll('input[type=checkbox][data-sleutel]')) {
    vak.addEventListener('change', () => {
      zetVink(opslag, vak.dataset.sleutel, wie, vak.checked);
      vak.blur();
      opnieuw();
    });
  }
  for (const knop of root.querySelectorAll('.wis[data-sleutel]')) {
    knop.addEventListener('click', () => {
      const item = items.find((s) => s.sleutel === knop.dataset.sleutel);
      if (!item) return;
      const tekst = lijst === 'persoonlijk' && item.voor === 'beiden' ? `"${item.naam}" van de lijst halen? (Ook bij de ander.)` : `"${item.naam}" van de lijst halen?`;
      if (confirm(tekst)) {
        haalWeg(opslag, item, lijst, dag);
        opnieuw();
      }
    });
  }
  root.querySelector('.alles-uit')?.addEventListener('click', () => {
    if (!confirm('Alle vinkjes van deze lijst weghalen?')) return;
    for (const s of items) if (isAfgevinkt(opslag, s.sleutel, wie)) zetVink(opslag, s.sleutel, wie, false);
    opnieuw();
  });
  root.querySelector('.aanpassen-knop')?.addEventListener('click', () => {
    aanpassen[stand] = !aanpassen[stand];
    opnieuw();
  });
}

// Scherm met de paklijst: samen (1×) en per persoon.
export function toonPaklijst(app, opslag, tab = null) {
  tab = ['samen', 'a', 'b'].includes(tab) ? tab : laatsteTab();
  try {
    localStorage.setItem('noorwegen-paklijst-tab', tab);
  } catch {
    // niet erg
  }
  const namen = reizigers(opslag);
  const lijst = tab === 'samen' ? 'samen' : 'persoonlijk';
  const items = spullen(opslag, lijst).filter((s) => lijst === 'samen' || s.voor === 'beiden' || s.voor === tab);
  const groepen = [...new Set(spullen(opslag, lijst).map((s) => s.groep))];
  const opnieuw = () => toonPaklijst(app, opslag, tab);

  app.innerHTML = `
    <section class="scherm paklijst ${aanpassen.paklijst ? 'aanpassen' : ''}">
      <h2 class="schermtitel">Paklijst</h2>
      <nav class="tabs" aria-label="Kies een lijst">
        <a href="#/paklijst/samen" ${tab === 'samen' ? 'aria-current="page"' : ''}>Samen (1×)</a>
        <a href="#/paklijst/a" ${tab === 'a' ? 'aria-current="page"' : ''}>${escapeHtml(namen.a)}</a>
        <a href="#/paklijst/b" ${tab === 'b' ? 'aria-current="page"' : ''}>${escapeHtml(namen.b)}</a>
      </nav>
      <p class="stil">${tab === 'samen' ? 'Spullen die maar één keer mee hoeven.' : `Wat ${escapeHtml(namen[tab])} zelf inpakt. De ander heeft een eigen lijst om af te vinken.`}</p>

      <div class="blok">${lijstHtml(opslag, items, tab, { namen: lijst === 'persoonlijk' ? namen : null })}</div>

      <div class="knoppen">
        <button type="button" class="knop knop--licht aanpassen-knop">${aanpassen.paklijst ? 'Klaar met aanpassen' : 'Lijst aanpassen'}</button>
        <button type="button" class="knop knop--licht alles-uit">Alles uitvinken</button>
      </div>

      <h3>Iets toevoegen</h3>
      <form class="formulier" id="pak-toevoegen">
        <label>Wat
          <input name="naam" autocomplete="off" required placeholder="bijv. Opvouwbare emmer">
        </label>
        <label>Groep
          <select name="groep">${groepen.map((g) => `<option>${escapeHtml(g)}</option>`).join('')}</select>
        </label>
        ${lijst === 'persoonlijk' ? `
          <fieldset class="keuze">
            <legend>Voor wie</legend>
            <label><input type="radio" name="voor" value="beiden" checked><span>Allebei</span></label>
            <label><input type="radio" name="voor" value="${tab}"><span>Alleen ${escapeHtml(namen[tab])}</span></label>
          </fieldset>` : ''}
        <button class="knop" type="submit">Toevoegen</button>
      </form>

      <details class="blok namen">
        <summary>Namen van de reizigers</summary>
        <form class="formulier" id="namen">
          <label>Reiziger 1 <input name="a" autocomplete="off" value="${escapeHtml(namen.a === 'Reiziger 1' ? '' : namen.a)}" placeholder="Reiziger 1"></label>
          <label>Reiziger 2 <input name="b" autocomplete="off" value="${escapeHtml(namen.b === 'Reiziger 2' ? '' : namen.b)}" placeholder="Reiziger 2"></label>
          <button class="knop" type="submit">Namen bewaren</button>
        </form>
      </details>
    </section>`;

  koppel(app, opslag, items, tab, lijst, null, opnieuw, 'paklijst');

  app.querySelector('#pak-toevoegen').addEventListener('submit', (e) => {
    e.preventDefault();
    const f = new FormData(e.target);
    if (!String(f.get('naam')).trim()) return;
    document.activeElement?.blur();
    voegToe(opslag, { naam: f.get('naam'), groep: f.get('groep'), lijst, voor: f.get('voor') ?? 'beiden' });
    opnieuw();
  });
  app.querySelector('#namen').addEventListener('submit', (e) => {
    e.preventDefault();
    const f = new FormData(e.target);
    document.activeElement?.blur();
    bewaarNaam(opslag, 'a', String(f.get('a')));
    bewaarNaam(opslag, 'b', String(f.get('b')));
    opnieuw();
  });
}

// Blok "Dagrugzak" op de dagpagina.
export function toonRugzak(houder, dag, opslag) {
  const items = spullen(opslag, 'rugzak', dag);
  const wie = `dag${dag}`;
  const opnieuw = () => toonRugzak(houder, dag, opslag);
  houder.className = `rugzak ${aanpassen.rugzak ? 'aanpassen' : ''}`;
  houder.innerHTML = `
    <h3>Dagrugzak</h3>
    <div class="blok">${lijstHtml(opslag, items, wie)}</div>
    <form class="p4n-rij rugzak-toevoegen">
      <input name="naam" autocomplete="off" required placeholder="Iets toevoegen…" aria-label="Iets toevoegen aan de dagrugzak">
      <button class="knop" type="submit">+</button>
    </form>
    <div class="knoppen">
      <button type="button" class="knop knop--licht knop--klein aanpassen-knop">${aanpassen.rugzak ? 'Klaar' : 'Aanpassen'}</button>
      <button type="button" class="knop knop--licht knop--klein alles-uit">Alles uitvinken</button>
    </div>`;
  koppel(houder, opslag, items, wie, 'rugzak', dag, opnieuw, 'rugzak');
  houder.querySelector('form').addEventListener('submit', (e) => {
    e.preventDefault();
    const naam = e.target.naam.value;
    if (!naam.trim()) return;
    document.activeElement?.blur();
    voegToe(opslag, { naam, groep: 'Voor vandaag', lijst: 'rugzak', dag });
    opnieuw();
  });
}
