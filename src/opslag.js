// Lokale opslag met synchronisatie.
//
// Alles wat jullie in de app invullen (park4night-codes, uitgaven, paklijsten) wordt eerst
// op het apparaat zelf bewaard, zodat het ook zonder bereik werkt. Zodra er internet is,
// worden wijzigingen naar de gedeelde database gestuurd en die van de andere apparaten opgehaald.
// Als twee apparaten hetzelfde item wijzigen, wint de laatste wijziging.

const SLEUTEL = 'noorwegen-items';
const SLEUTEL_SYNC = 'noorwegen-laatste-sync';
// Bij het ophalen kijken we iets verder terug dan de vorige keer, zodat we niets missen
// van wijzigingen die net tegelijk binnenkwamen.
const MARGE_MS = 2 * 60 * 1000;

export function maakOpslag({ backend = null, bewaarplek = globalThis.localStorage } = {}) {
  let items = lees(SLEUTEL, {});
  let laatsteSync = lees(SLEUTEL_SYNC, null);
  const luisteraars = new Set();
  let status = { toestand: backend ? 'onbekend' : 'niet-ingesteld', bericht: '' };
  let bezig = null;
  let uitgesteld = null;

  function lees(sleutel, standaard) {
    try {
      const tekst = bewaarplek?.getItem(sleutel);
      return tekst ? JSON.parse(tekst) : standaard;
    } catch {
      return standaard;
    }
  }
  function schrijf() {
    try {
      bewaarplek?.setItem(SLEUTEL, JSON.stringify(items));
      bewaarplek?.setItem(SLEUTEL_SYNC, JSON.stringify(laatsteSync));
    } catch {
      // Opslag vol of geblokkeerd: de app blijft werken, alleen niet bewaard.
    }
  }
  // soort = 'data' (gegevens veranderd) of 'status' (synchronisatiestatus veranderd).
  function meld(soort = 'data') {
    for (const f of luisteraars) f(soort);
  }
  function zetStatus(toestand, bericht = '') {
    status = { toestand, bericht, laatsteSync };
    meld('status');
  }

  function wachtend() {
    return Object.values(items).filter((i) => i.lokaal);
  }

  // Na een wijziging even wachten en dan synchroniseren (bundelt snelle wijzigingen).
  function planSync() {
    clearTimeout(uitgesteld);
    uitgesteld = setTimeout(() => synchroniseer(), 1000);
  }

  async function synchroniseer() {
    if (!backend) return;
    if (bezig) return bezig;
    bezig = (async () => {
      try {
        if (!(await backend.ingelogd())) {
          zetStatus('uitgelogd');
          return;
        }
        if (globalThis.navigator && navigator.onLine === false) {
          zetStatus(wachtend().length ? 'wacht' : 'offline');
          return;
        }
        zetStatus('bezig');
        // 1. Eigen wijzigingen versturen.
        const teVersturen = wachtend();
        if (teVersturen.length) {
          await backend.verstuur(teVersturen.map(({ id, soort, data, verwijderd }) => ({ id, soort, data, verwijderd })));
          for (const i of teVersturen) {
            if (items[i.id] === i) delete items[i.id].lokaal;
          }
          schrijf();
        }
        // 2. Wijzigingen van anderen ophalen.
        const vanaf = laatsteSync ? new Date(new Date(laatsteSync).getTime() - MARGE_MS).toISOString() : null;
        const rijen = await backend.haalOp(vanaf);
        let veranderd = false;
        for (const r of rijen) {
          const lokaal = items[r.id];
          // Een lokale wijziging die nog niet verstuurd is, gaat voor.
          if (lokaal?.lokaal) continue;
          if (!lokaal || JSON.stringify(lokaal.data) !== JSON.stringify(r.data) || lokaal.verwijderd !== r.verwijderd) veranderd = true;
          items[r.id] = { id: r.id, soort: r.soort, data: r.data, verwijderd: r.verwijderd, gewijzigd_op: r.gewijzigd_op };
          if (!laatsteSync || r.gewijzigd_op > laatsteSync) laatsteSync = r.gewijzigd_op;
        }
        if (!rijen.length && !laatsteSync) laatsteSync = new Date(0).toISOString();
        schrijf();
        zetStatus('bijgewerkt');
        if (veranderd) meld('data');
      } catch (fout) {
        zetStatus(wachtend().length ? 'wacht' : 'fout', String(fout?.message ?? fout));
      } finally {
        bezig = null;
      }
    })();
    return bezig;
  }

  return {
    // Alle (niet-verwijderde) items van één soort.
    lijst(soort) {
      return Object.values(items).filter((i) => i.soort === soort && !i.verwijderd);
    },
    haal(id) {
      const i = items[id];
      return i && !i.verwijderd ? i : null;
    },
    bewaar(soort, id, data) {
      items[id] = { id, soort, data, verwijderd: false, gewijzigd_op: new Date().toISOString(), lokaal: true };
      schrijf();
      meld();
      planSync();
    },
    verwijder(id) {
      const i = items[id];
      if (!i) return;
      items[id] = { ...i, verwijderd: true, gewijzigd_op: new Date().toISOString(), lokaal: true };
      schrijf();
      meld();
      planSync();
    },
    synchroniseer,
    status: () => ({ ...status, wachtend: wachtend().length, laatsteSync }),
    luister(f) {
      luisteraars.add(f);
      return () => luisteraars.delete(f);
    },
    backend,
  };
}

// Vaste, herkenbare id per item dat maar één keer bestaat (bijv. de park4night-code van dag 5),
// zodat twee apparaten niet allebei een eigen versie aanmaken.
export function vasteId(soort, nummer) {
  const hex = [...soort].reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 7).toString(16).padStart(8, '0').slice(0, 8);
  return `${hex}-0000-4000-8000-${String(nummer).padStart(12, '0')}`;
}

export function nieuweId() {
  return crypto.randomUUID();
}
