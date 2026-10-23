// Topografische kaart van Kartverket vooraf opslaan, zodat de kaart onderweg ook zonder bereik werkt.
// Niet het hele land, maar alleen wat we nodig hebben:
// - overzicht van het reisgebied (zoom 5–9)
// - een strook langs de route (zoom 10–12)
// - detail rond overnachtingen, stops en wandelingen (zoom 13–14) en de wandelroutes zelf (zoom 15)
// De tegels worden rustig na elkaar opgehaald (een paar tegelijk), zodat we de dienst niet overbelasten.

export const TOPO_URL = 'https://cache.kartverket.no/v1/wmts/1.0.0/topo/default/webmercator/{z}/{y}/{x}.png';
export const TOPO_CACHE = 'kaart-topo';
const GEBIED = { zuid: 57.9, west: 4.6, noord: 62.4, oost: 10.2 }; // Noorwegen-deel van de reis
const TEGELIJK = 4;
const PAUZE_MS = 40;
const KB_PER_TEGEL = 80; // gemeten gemiddelde (okt. 2026), voor de verwachte grootte

const tegelX = (lng, z) => Math.floor(((lng + 180) / 360) * 2 ** z);
const tegelY = (lat, z) => {
  const r = (lat * Math.PI) / 180;
  return Math.floor(((1 - Math.log(Math.tan(r) + 1 / Math.cos(r)) / Math.PI) / 2) * 2 ** z);
};
export const tegelUrl = ({ z, x, y }) => TOPO_URL.replace('{z}', z).replace('{x}', x).replace('{y}', y);

// Alle tegels binnen een rechthoek (in graden).
function rechthoek(set, z, zuid, west, noord, oost) {
  for (let x = tegelX(west, z); x <= tegelX(oost, z); x++) {
    for (let y = tegelY(noord, z); y <= tegelY(zuid, z); y++) set.add(`${z}/${x}/${y}`);
  }
}

// Tegels binnen een straal (km) rond een punt.
function rond(set, z, lat, lng, km) {
  const dLat = km / 111;
  const dLng = km / (111 * Math.cos((lat * Math.PI) / 180));
  rechthoek(set, z, lat - dLat, lng - dLng, lat + dLat, lng + dLng);
}

// Tegels langs een lijn: om de paar honderd meter een punt met een straal eromheen.
function langs(set, z, lijn, km) {
  for (let i = 0; i < lijn.length; i++) {
    const [lat, lng] = lijn[i];
    rond(set, z, lat, lng, km);
    const volgende = lijn[i + 1];
    if (!volgende) continue;
    const afstand = Math.hypot((volgende[0] - lat) * 111, (volgende[1] - lng) * 111 * Math.cos((lat * Math.PI) / 180));
    const stappen = Math.ceil(afstand / (km / 2));
    for (let s = 1; s < stappen; s++) {
      rond(set, z, lat + ((volgende[0] - lat) * s) / stappen, lng + ((volgende[1] - lng) * s) / stappen, km);
    }
  }
}

const inNoorwegen = ([lat, lng]) => lat >= GEBIED.zuid && lat <= GEBIED.noord && lng >= GEBIED.west && lng <= GEBIED.oost;

// Lijst van alle tegels die we willen opslaan.
export function tegelLijst(dagen) {
  const set = new Set();
  for (let z = 5; z <= 9; z++) rechthoek(set, z, GEBIED.zuid, GEBIED.west, GEBIED.noord, GEBIED.oost);

  const route = [];
  const detail = [];
  const wandelroutes = [];
  for (const dag of dagen) {
    for (const s of dag.stops) route.push([s.lat, s.lng]), detail.push([s.lat, s.lng]);
    for (const w of dag.wandelingen) {
      detail.push([w.lat, w.lng]);
      if (w.route?.lijn) wandelroutes.push(w.route.lijn);
    }
    if (dag.overnachting) route.push([dag.overnachting.lat, dag.overnachting.lng]), detail.push([dag.overnachting.lat, dag.overnachting.lng]);
  }
  const routeNo = route.filter(inNoorwegen);
  langs(set, 10, routeNo, 4);
  langs(set, 11, routeNo, 2.5);
  langs(set, 12, routeNo, 0.5);
  for (const [lat, lng] of detail.filter(inNoorwegen)) {
    rond(set, 13, lat, lng, 2);
    rond(set, 14, lat, lng, 1);
  }
  for (const lijn of wandelroutes) {
    langs(set, 14, lijn, 1);
    langs(set, 15, lijn, 0.5);
  }
  return [...set].map((k) => {
    const [z, x, y] = k.split('/').map(Number);
    return { z, x, y };
  });
}

export const geschatteMB = (aantal) => Math.round((aantal * KB_PER_TEGEL) / 1024);

// Toestand van het opslaan; schermen kunnen meeluisteren.
const toestand = { bezig: false, klaar: 0, totaal: 0, mislukt: 0, bytes: 0, stoppen: false, melding: '' };
const luisteraars = new Set();
const meld = () => luisteraars.forEach((f) => f({ ...toestand }));
export const opslagToestand = () => ({ ...toestand });
export function luisterOpslag(f) {
  luisteraars.add(f);
  return () => luisteraars.delete(f);
}
export function stopOpslaan() {
  toestand.stoppen = true;
}

// Hoeveel tegels er al in de offline opslag staan.
export async function telOpgeslagen(tegels) {
  if (!('caches' in window)) return 0;
  const cache = await caches.open(TOPO_CACHE);
  const sleutels = new Set((await cache.keys()).map((r) => r.url));
  return tegels.filter((t) => sleutels.has(tegelUrl(t))).length;
}

// Tegels ophalen die nog niet opgeslagen zijn. Kan gestopt en later hervat worden.
export async function slaKaartOp(dagen) {
  if (toestand.bezig) return;
  Object.assign(toestand, { bezig: true, klaar: 0, totaal: 0, mislukt: 0, bytes: 0, stoppen: false, melding: '' });
  meld();
  try {
    // Vragen of de browser deze opslag niet zomaar mag opruimen.
    await navigator.storage?.persist?.();
    const cache = await caches.open(TOPO_CACHE);
    const tegels = tegelLijst(dagen);
    const al = new Set((await cache.keys()).map((r) => r.url));
    const nodig = tegels.map(tegelUrl).filter((u) => !al.has(u));
    toestand.totaal = tegels.length;
    toestand.klaar = tegels.length - nodig.length;
    meld();
    let i = 0;
    const werker = async () => {
      while (i < nodig.length && !toestand.stoppen) {
        const url = nodig[i++];
        try {
          const antwoord = await fetch(url, { mode: 'cors' });
          if (!antwoord.ok) throw new Error(antwoord.status);
          const blob = await antwoord.clone().blob();
          await cache.put(url, antwoord);
          toestand.bytes += blob.size;
          toestand.klaar++;
        } catch {
          toestand.mislukt++;
          if (!navigator.onLine) toestand.stoppen = true;
        }
        if (toestand.klaar % 10 === 0) meld();
        await new Promise((r) => setTimeout(r, PAUZE_MS));
      }
    };
    await Promise.all(Array.from({ length: TEGELIJK }, werker));
    toestand.melding = toestand.stoppen
      ? navigator.onLine ? 'Gestopt. Tik nog eens op de knop om verder te gaan.' : 'Geen internet meer. Ga later verder; wat al opgeslagen is, blijft bewaard.'
      : toestand.mislukt ? `Klaar, maar ${toestand.mislukt} stukjes kaart lukten niet. Tik nog eens om die opnieuw te proberen.` : 'Klaar! De kaart werkt nu ook zonder internet.';
  } catch (fout) {
    toestand.melding = `Opslaan lukte niet (${fout.message ?? fout}).`;
  } finally {
    toestand.bezig = false;
    meld();
  }
}
