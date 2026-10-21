// Wisselkoersen (dagkoers van de Europese Centrale Bank via Frankfurter, gratis en zonder account).
// De laatst opgehaalde koers wordt onthouden, zodat het budget ook offline klopt.

const SLEUTEL = 'noorwegen-koers';
const STANDAARD = { NOK: 11.5, DKK: 7.46, datum: null, bron: 'standaard' };
const BRONNEN = [
  'https://api.frankfurter.dev/v1/latest?base=EUR&symbols=NOK,DKK',
  'https://api.frankfurter.app/latest?from=EUR&to=NOK,DKK',
];
const VERVERS_NA_MS = 12 * 60 * 60 * 1000;

// Hoeveel NOK en DKK je krijgt voor 1 euro, met datum en bron.
export function huidigeKoers() {
  try {
    return JSON.parse(localStorage.getItem(SLEUTEL)) ?? STANDAARD;
  } catch {
    return STANDAARD;
  }
}

// Haalt een nieuwe koers op als de bewaarde ouder is dan 12 uur (en er internet is).
export async function ververstKoers({ forceer = false } = {}) {
  const nu = huidigeKoers();
  if (!forceer && nu.opgehaald && Date.now() - nu.opgehaald < VERVERS_NA_MS) return nu;
  if (!navigator.onLine) return nu;
  for (const url of BRONNEN) {
    try {
      const antwoord = await fetch(url, { signal: AbortSignal.timeout(8000) });
      if (!antwoord.ok) continue;
      const data = await antwoord.json();
      if (!data.rates?.NOK || !data.rates?.DKK) continue;
      const koers = { NOK: data.rates.NOK, DKK: data.rates.DKK, datum: data.date, bron: 'ECB', opgehaald: Date.now() };
      localStorage.setItem(SLEUTEL, JSON.stringify(koers));
      return koers;
    } catch {
      // volgende bron proberen
    }
  }
  return nu;
}

// Bedrag omrekenen naar euro met een gegeven koers.
export function naarEuro(bedrag, munt, koers) {
  if (munt === 'EUR') return bedrag;
  return bedrag / koers[munt];
}
