import { escapeHtml } from '../regio.js';
import { nieuweId } from '../opslag.js';
import { polarstepsLink } from '../polarsteps.js';

// Blok "Dagboek en notities" op de dagpagina: knop naar Polarsteps en korte, privé notities per dag.
// Elke notitie is een apart item, zodat jullie tegelijk kunnen schrijven zonder elkaar te overschrijven.
export function toonNotities(houder, dag, opslag) {
  const link = polarstepsLink(opslag);
  const notities = opslag
    .lijst('notitie')
    .map((i) => i.data)
    .filter((n) => n.dag === dag)
    .sort((a, b) => a.gemaakt.localeCompare(b.gemaakt));
  const opnieuw = () => toonNotities(houder, dag, opslag);

  houder.innerHTML = `
    <h3>Dagboek en notities</h3>
    ${link
      ? `<a class="knop polarsteps-knop" href="${escapeHtml(link)}" target="_blank" rel="noopener">📖 Schrijf in Polarsteps</a>`
      : `<p class="stil">Het dagboek houden jullie bij in Polarsteps. Vul de link naar jullie reis één keer in bij
          <a href="#/sync">Instellingen</a>, dan staat hier een knop.</p>`}
    <div class="blok notities">
      <strong>Notities (alleen voor jullie)</strong>
      <span class="stil">Praktische dingen om te onthouden, bijv. "goede bakker", "camping rumoerig", "parkeren 300 NOK".</span>
      ${notities.length ? `<ul class="notitielijst">${notities
        .map((n) => `
          <li>
            <span>${escapeHtml(n.tekst).replace(/\n/g, '<br>')}</span>
            <button type="button" class="wis" data-id="${n.id}" aria-label="Verwijder deze notitie">✕</button>
          </li>`)
        .join('')}</ul>` : ''}
      <form class="notitie-toevoegen">
        <textarea name="tekst" rows="2" placeholder="Nieuwe notitie…" aria-label="Nieuwe notitie"></textarea>
        <button class="knop knop--klein" type="submit">Notitie bewaren</button>
      </form>
    </div>`;

  houder.querySelector('form').addEventListener('submit', (e) => {
    e.preventDefault();
    const tekst = e.target.tekst.value.trim();
    if (!tekst) return;
    document.activeElement?.blur();
    const id = nieuweId();
    opslag.bewaar('notitie', id, { id, dag, tekst, gemaakt: new Date().toISOString() });
    opnieuw();
  });
  for (const knop of houder.querySelectorAll('.wis')) {
    knop.addEventListener('click', () => {
      if (!confirm('Deze notitie verwijderen?')) return;
      opslag.verwijder(knop.dataset.id);
      opnieuw();
    });
  }
}
