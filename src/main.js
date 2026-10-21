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

  let tab = 'dagen';
  if (delen[0] === 'kaart') {
    tab = 'kaart';
    toonKaart(app, dagen, nummer);
  } else if (delen[0] === 'dag' && nummer) {
    toonDag(app, dagen, nummer);
  } else {
    toonDagen(app, dagen);
  }
  document.body.classList.toggle('met-kaart', tab === 'kaart');
  for (const link of document.querySelectorAll('.onderbalk a')) {
    link.toggleAttribute('aria-current', link.dataset.tab === tab);
  }
}

function toonVerbinding() {
  document.getElementById('offline-melding').hidden = navigator.onLine;
}

window.addEventListener('hashchange', route);
window.addEventListener('online', toonVerbinding);
window.addEventListener('offline', toonVerbinding);
route();
toonVerbinding();
