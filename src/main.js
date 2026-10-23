import './style.css';
import { registerSW } from 'virtual:pwa-register';
import reis from './data/reis.json';
import { toonDagen } from './views/dagen.js';
import { toonDag } from './views/dag.js';
import { toonKaart, sluitKaart } from './views/kaart.js';
import { toonSync, statusTekst } from './views/sync.js';
import { toonBudget } from './views/budget.js';
import { toonPaklijst, toonChecklist } from './views/paklijst.js';
import { ververstKoers } from './koers.js';
import { maakOpslag } from './opslag.js';
import { backend } from './supabase.js';

const app = document.getElementById('app');
const { dagen } = reis;
const opslag = maakOpslag({ backend });

// Eenvoudige navigatie via het deel na # in de adresbalk:
// #/ = dagen, #/dag/3 = dag 3, #/kaart = kaart, #/kaart/3 = kaart van dag 3, #/budget = budget, #/paklijst = paklijst, #/checklist = checklist voor vertrek, #/sync = instellingen.
const breed = matchMedia('(min-width: 900px)');
breed.addEventListener('change', () => route(false));

function route(bovenaan = true) {
  const delen = location.hash.replace(/^#\/?/, '').split('/');
  const nummer = delen[1] ? Number(delen[1]) : null;
  sluitKaart();
  if (bovenaan) window.scrollTo(0, 0);

  const tab = ['kaart', 'budget', 'paklijst'].includes(delen[0]) ? delen[0] : 'dagen';
  // Eerst de opmaak omzetten, zodat de kaart meteen de juiste grootte heeft.
  document.body.classList.toggle('met-kaart', tab === 'kaart');
  if (tab === 'kaart') {
    toonKaart(app, dagen, nummer);
  } else if (delen[0] === 'dag' && nummer && breed.matches) {
    // Tablet: links de dagenlijst, rechts de dag.
    app.innerHTML = '<div class="tweeluik"><aside class="tweeluik-lijst" aria-label="Alle dagen"></aside><div class="tweeluik-dag"></div></div>';
    toonDagen(app.querySelector('.tweeluik-lijst'), dagen, reis.reis, opslag, { compact: true, actief: nummer });
    toonDag(app.querySelector('.tweeluik-dag'), dagen, nummer, opslag);
  } else if (delen[0] === 'dag' && nummer) {
    toonDag(app, dagen, nummer, opslag);
  } else if (delen[0] === 'checklist') {
    toonChecklist(app, opslag);
  } else if (tab === 'paklijst') {
    toonPaklijst(app, opslag, delen[1]);
  } else if (tab === 'budget') {
    toonBudget(app, opslag);
  } else if (delen[0] === 'sync') {
    toonSync(app, opslag);
  } else {
    toonDagen(app, dagen, reis.reis, opslag);
  }
  for (const link of document.querySelectorAll('.onderbalk a')) {
    link.toggleAttribute('aria-current', link.dataset.tab === tab);
  }
}

// navigator.onLine zegt alleen of er een netwerk is (bijv. wifi), niet of internet echt werkt.
// Daarom halen we ook een klein bestand van de server op; lukt dat niet, dan zijn we offline.
// Het extra ?verbinding=… zorgt dat dit verzoek niet uit de offline-opslag komt.
async function toonVerbinding() {
  let online = navigator.onLine;
  if (online) {
    try {
      const antwoord = await fetch(`/manifest.webmanifest?verbinding=${Date.now()}`, {
        cache: 'no-store',
        signal: AbortSignal.timeout(5000),
      });
      online = antwoord.ok;
    } catch {
      online = false;
    }
  }
  document.getElementById('offline-melding').hidden = online;
}

window.addEventListener('hashchange', route);
window.addEventListener('online', toonVerbinding);
window.addEventListener('offline', toonVerbinding);
// Opnieuw controleren als je de app terughaalt uit de achtergrond, en elke 30 seconden.
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible') toonVerbinding();
});
setInterval(toonVerbinding, 30000);
route();
toonVerbinding();

// Synchronisatie: bij starten, bij terugkeer van internet, bij terughalen van de app en elke minuut.
function toonSyncStatus() {
  const s = opslag.status();
  const knop = document.getElementById('syncstatus');
  knop.dataset.toestand = s.toestand;
  knop.title = statusTekst(s).uitleg;
  knop.querySelector('span').textContent = { bijgewerkt: 'Gedeeld', bezig: 'Bezig…', wacht: `${s.wachtend} wacht`, offline: 'Offline', uitgelogd: 'Inloggen', fout: 'Probleem', 'niet-ingesteld': 'Lokaal' }[s.toestand] ?? '…';
}
opslag.luister((soort) => {
  toonSyncStatus();
  const veld = document.activeElement?.tagName;
  // Gegevens van een ander apparaat binnengekomen: scherm bijwerken (niet tijdens typen, niet op de kaart).
  if (soort === 'data' && !['INPUT', 'TEXTAREA', 'SELECT'].includes(veld) && !location.hash.startsWith('#/kaart')) route(false);
  if (soort === 'status' && location.hash === '#/sync' && !['INPUT', 'TEXTAREA', 'SELECT'].includes(veld)) route(false);
});
window.addEventListener('online', () => {
  opslag.synchroniseer();
  haalKoers();
});
// Wisselkoers ophalen (maximaal twee keer per dag) en het budgetscherm bijwerken als dat open staat.
async function haalKoers() {
  await ververstKoers();
  if (location.hash === '#/budget' && !['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement?.tagName)) route(false);
}
haalKoers();
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible') opslag.synchroniseer();
});
setInterval(() => opslag.synchroniseer(), 60000);
toonSyncStatus();
opslag.synchroniseer();

// Offline-opslag registreren. Komt er een nieuwe versie binnen, dan herlaadt de app zichzelf,
// zodat je niet eerst nog de oude opgeslagen versie ziet. Er wordt elk uur gekeken of er een nieuwe versie is,
// en ook als je de app terughaalt uit de achtergrond.
registerSW({
  immediate: true,
  onRegisteredSW(_url, registratie) {
    if (!registratie) return;
    setInterval(() => registratie.update(), 60 * 60 * 1000);
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible' && navigator.onLine) registratie.update();
    });
  },
});
