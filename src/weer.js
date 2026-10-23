// Weerbericht van MET Norway (Yr), via de Netlify-functie /api/weer.
// Het laatste resultaat per plek wordt op het apparaat bewaard, zodat het ook zonder internet te zien is.

const SLEUTEL = 'noorwegen-weer';
const MIN_WACHT_MS = 30 * 60 * 1000; // niet vaker dan eens per half uur per plek ophalen
const TIJDZONE = 'Europe/Oslo';

const plekSleutel = (lat, lon) => `${lat.toFixed(3)},${lon.toFixed(3)}`;

function leesAlles() {
  try {
    return JSON.parse(localStorage.getItem(SLEUTEL)) ?? {};
  } catch {
    return {};
  }
}

function bewaar(sleutel, waarde) {
  const alles = leesAlles();
  alles[sleutel] = waarde;
  // Oude plekken (langer dan 3 dagen niet opgehaald) opruimen.
  for (const [k, v] of Object.entries(alles)) if (Date.now() - v.opgehaald > 3 * 24 * 3600 * 1000) delete alles[k];
  try {
    localStorage.setItem(SLEUTEL, JSON.stringify(alles));
  } catch {
    // opslag vol: dan alleen niet bewaard
  }
}

// Alleen bewaren wat de app gebruikt (scheelt veel ruimte).
function inkorten(json) {
  return json.properties.timeseries.map(({ time, data }) => {
    const d = data.instant.details;
    const zes = data.next_6_hours;
    return {
      t: time,
      temp: d.air_temperature,
      wind: d.wind_speed,
      stoot: d.wind_speed_of_gust ?? null,
      richting: d.wind_from_direction,
      sym6: zes?.summary.symbol_code ?? null,
      regen6: zes?.details.precipitation_amount ?? null,
      kans6: zes?.details.probability_of_precipitation ?? null,
      min6: zes?.details.air_temperature_min ?? null,
      max6: zes?.details.air_temperature_max ?? null,
    };
  });
}

// Bewaard weerbericht voor een plek (of null).
export function bewaardWeer(lat, lon) {
  return leesAlles()[plekSleutel(lat, lon)] ?? null;
}

// Haalt het weer op als het bewaarde bericht verlopen is en er internet is. Geeft altijd het beste
// beschikbare bericht terug: {reeks, opgehaald, verloopt} of null, plus fout als ophalen mislukte.
export async function haalWeer(lat, lon) {
  const oud = bewaardWeer(lat, lon);
  const vers = oud && Date.now() < Math.max(oud.verloopt, oud.opgehaald + MIN_WACHT_MS);
  if (vers || navigator.onLine === false) return oud;
  try {
    const antwoord = await fetch(`/api/weer?lat=${lat.toFixed(4)}&lon=${lon.toFixed(4)}`, { signal: AbortSignal.timeout(15000) });
    if (!antwoord.ok) throw new Error(`status ${antwoord.status}`);
    const json = await antwoord.json();
    const verloopt = Date.parse(antwoord.headers.get('Expires') ?? '') || Date.now() + 60 * 60 * 1000;
    const nieuw = { reeks: inkorten(json), opgehaald: Date.now(), verloopt: Math.min(verloopt, Date.now() + 2 * 3600 * 1000) };
    bewaar(plekSleutel(lat, lon), nieuw);
    return nieuw;
  } catch (fout) {
    return oud ? { ...oud, fout: String(fout.message ?? fout) } : { fout: String(fout.message ?? fout) };
  }
}

const datumOslo = new Intl.DateTimeFormat('sv-SE', { timeZone: TIJDZONE, year: 'numeric', month: '2-digit', day: '2-digit' });
const uurOslo = new Intl.DateTimeFormat('nl-NL', { timeZone: TIJDZONE, hour: '2-digit', hour12: false });
export const tijdOslo = (ms) => new Date(ms).toLocaleTimeString('nl-NL', { timeZone: TIJDZONE, hour: '2-digit', minute: '2-digit' });
export const vandaagOslo = () => datumOslo.format(new Date());

// Laatste dag waarvoor het bericht een verwachting heeft.
export function laatsteDatum(weer) {
  return weer?.reeks?.length ? datumOslo.format(new Date(weer.reeks.at(-1).t)) : null;
}

// Verwachting voor één datum (JJJJ-MM-DD): ochtend, middag en avond, plus minimum en maximum.
export function weerOpDatum(weer, datum) {
  const opDag = (weer?.reeks ?? []).filter((p) => datumOslo.format(new Date(p.t)) === datum);
  if (!opDag.length) return null;
  const met6 = opDag.filter((p) => p.sym6);
  const nu = Date.now();
  const delen = [
    { naam: 'Ochtend', uur: 8 },
    { naam: 'Middag', uur: 14 },
    { naam: 'Avond', uur: 20 },
  ]
    .map(({ naam, uur }) => {
      // Het meetpunt dat het dichtst bij dit uur ligt (vanaf 2–3 dagen vooruit is er één per 6 uur).
      const kandidaten = met6.map((p) => ({ p, uur: Number(uurOslo.format(new Date(p.t))) })).filter((k) => Math.abs(k.uur - uur) <= 3);
      kandidaten.sort((a, b) => Math.abs(a.uur - uur) - Math.abs(b.uur - uur));
      const k = kandidaten[0];
      // Vandaag: dagdelen die al voorbij zijn overslaan.
      if (!k || Date.parse(k.p.t) + 6 * 3600 * 1000 < nu) return null;
      return { naam, van: k.uur, tot: (k.uur + 6) % 24, ...k.p };
    })
    .filter(Boolean);
  const temps = opDag.flatMap((p) => [p.temp, p.min6, p.max6]).filter((t) => t != null);
  return { datum, delen, min: Math.min(...temps), max: Math.max(...temps), maxWind: Math.max(...opDag.map((p) => p.wind)) };
}

// Weersymbool van MET (bijv. 'lightrainshowers_day') naar een emoji en Nederlandse tekst.
const SYMBOLEN = [
  ['thunder', '⛈️', 'onweer'],
  ['heavysnow', '❄️', 'zware sneeuwval'],
  ['snow', '🌨️', 'sneeuw'],
  ['sleet', '🌨️', 'natte sneeuw'],
  ['heavyrainshowers', '🌧️', 'zware buien'],
  ['lightrainshowers', '🌦️', 'lichte buien'],
  ['rainshowers', '🌦️', 'buien'],
  ['heavyrain', '🌧️', 'zware regen'],
  ['lightrain', '🌧️', 'lichte regen'],
  ['rain', '🌧️', 'regen'],
  ['fog', '🌫️', 'mist'],
  ['partlycloudy', '⛅', 'half bewolkt'],
  ['cloudy', '☁️', 'bewolkt'],
  ['fair', '🌤️', 'licht bewolkt'],
  ['clearsky', '☀️', 'zonnig'],
];
export function symbool(code) {
  const s = SYMBOLEN.find(([naam]) => code?.startsWith(naam));
  if (!s) return { icoon: '·', tekst: '' };
  if (s[0] === 'clearsky' && code.endsWith('_night')) return { icoon: '🌙', tekst: 'helder' };
  return { icoon: s[1], tekst: s[2] };
}

const WINDRICHTINGEN = ['N', 'NO', 'O', 'ZO', 'Z', 'ZW', 'W', 'NW'];
export const windrichting = (graden) => WINDRICHTINGEN[Math.round(((graden % 360) + 360) % 360 / 45) % 8];

// Korte omschrijving van de windkracht (m/s) zoals Yr die gebruikt.
export function windwoord(ms) {
  if (ms < 1.6) return 'windstil';
  if (ms < 5.5) return 'zwakke wind';
  if (ms < 8) return 'matige wind';
  if (ms < 10.8) return 'vrij krachtige wind';
  if (ms < 13.9) return 'krachtige wind';
  if (ms < 17.2) return 'harde wind';
  return 'storm';
}
