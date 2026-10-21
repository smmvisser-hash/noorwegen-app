import './style.css';
import reis from './data/reis.json';
import { toonDagen } from './views/dagen.js';
import { toonDag } from './views/dag.js';
import { toonKaart, sluitKaart } from './views/kaart.js';

const app = document.getElementById('app');
const { dagen } = reis;

// Eenvoudige navigatie via het deel na # in de adresbalk:
// #/ = dagen, #/dag/3 = dag 3, #/kaart = kaart, #/kaart/3 = kaart van dag 3.
function route() {
  const delen = location.hash.replace(/^#\/?/, '').split('/');
  const nummer = delen[1] ? Number(delen[1]) : null;
  sluitKaart();
  window.scrollTo(0, 0);

  const tab = delen[0] === 'kaart' ? 'kaart' : 'dagen';
  // Eerst de opmaak omzetten, zodat de kaart meteen de juiste grootte heeft.
  document.body.classList.toggle('met-kaart', tab === 'kaart');
  if (tab === 'kaart') {
    toonKaart(app, dagen, nummer);
  } else if (delen[0] === 'dag' && nummer) {
    toonDag(app, dagen, nummer);
  } else {
    toonDagen(app, dagen, reis.reis);
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
