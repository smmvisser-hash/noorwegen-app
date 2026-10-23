// Vertrektijden van ferry's via Entur (de Noorse reisplanner, gratis en zonder account).
// Entur heeft alleen tijden voor de komende maanden. Is de reisdag nog te ver weg, dan tonen we de tijden
// van dezelfde weekdag binnenkort als voorbeeld. Het laatste resultaat wordt op het apparaat bewaard.

const URL = 'https://api.entur.io/journey-planner/v3/graphql';
const KLANT = 'smmvisser-noorwegenapp';
const SLEUTEL = 'noorwegen-ferrytijden';
const VERVERS_NA_MS = 12 * 60 * 60 * 1000;

function leesAlles() {
  try {
    return JSON.parse(localStorage.getItem(SLEUTEL)) ?? {};
  } catch {
    return {};
  }
}

export function bewaardeTijden(ferry, datum) {
  return leesAlles()[`${ferry.id}|${datum}`] ?? null;
}

// Tijdverschil van Oslo met UTC op een datum, bijv. '+02:00' in de zomer.
function verschilOslo(datum) {
  const tekst = new Intl.DateTimeFormat('en-US', { timeZone: 'Europe/Oslo', timeZoneName: 'shortOffset' })
    .formatToParts(new Date(`${datum}T12:00:00Z`))
    .find((d) => d.type === 'timeZoneName').value; // bijv. 'GMT+2'
  const uren = Number(tekst.replace('GMT', '') || 0);
  return `${uren < 0 ? '-' : '+'}${String(Math.abs(uren)).padStart(2, '0')}:00`;
}

async function vraagTijden(ferry, datum) {
  const query = `{ trip(from:{place:"${ferry.van}"}, to:{place:"${ferry.naar}"}, dateTime:"${datum}T04:00:00${verschilOslo(datum)}",
    numTripPatterns:60, searchWindow:1200,
    modes:{accessMode:foot, egressMode:foot, directMode:null, transportModes:[{transportMode:water}]}) {
    tripPatterns { legs { mode aimedStartTime aimedEndTime } } } }`;
  const antwoord = await fetch(URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'ET-Client-Name': KLANT },
    body: JSON.stringify({ query }),
    signal: AbortSignal.timeout(15000),
  });
  if (!antwoord.ok) throw new Error(`status ${antwoord.status}`);
  const json = await antwoord.json();
  if (json.errors) throw new Error(json.errors[0].message);
  const tijden = new Map();
  for (const t of json.data.trip.tripPatterns) {
    for (const l of t.legs) {
      // Alleen afvaarten op die dag zelf (de tijden staan in Noorse tijd).
      if (l.mode === 'water' && l.aimedStartTime.startsWith(datum)) tijden.set(l.aimedStartTime.slice(11, 16), l.aimedEndTime.slice(11, 16));
    }
  }
  return [...tijden].sort().map(([vertrek, aankomst]) => ({ vertrek, aankomst }));
}

const plusDagen = (datum, n) => new Date(Date.parse(`${datum}T12:00:00Z`) + n * 86400000).toISOString().slice(0, 10);

// Geeft {tijden, voorbeeldDatum?, opgehaald, fout?} of null.
export async function haalTijden(ferry, datum) {
  const sleutel = `${ferry.id}|${datum}`;
  const oud = leesAlles()[sleutel] ?? null;
  if ((oud && Date.now() - oud.opgehaald < VERVERS_NA_MS) || navigator.onLine === false) return oud;
  try {
    let tijden = await vraagTijden(ferry, datum);
    let voorbeeldDatum = null;
    if (!tijden.length) {
      // Zelfde weekdag in de komende week als voorbeeld.
      const vandaag = new Date().toISOString().slice(0, 10);
      const weekdag = new Date(`${datum}T12:00:00Z`).getUTCDay();
      for (let i = 1; i <= 7; i++) {
        const kandidaat = plusDagen(vandaag, i);
        if (new Date(`${kandidaat}T12:00:00Z`).getUTCDay() === weekdag) {
          voorbeeldDatum = kandidaat;
          break;
        }
      }
      tijden = voorbeeldDatum && voorbeeldDatum < datum ? await vraagTijden(ferry, voorbeeldDatum) : [];
    }
    const nieuw = { tijden, voorbeeldDatum: tijden.length ? voorbeeldDatum : null, opgehaald: Date.now() };
    const alles = leesAlles();
    alles[sleutel] = nieuw;
    try {
      localStorage.setItem(SLEUTEL, JSON.stringify(alles));
    } catch {
      // niet erg
    }
    return nieuw;
  } catch (fout) {
    return oud ? { ...oud, fout: String(fout.message ?? fout) } : { tijden: [], fout: String(fout.message ?? fout) };
  }
}
