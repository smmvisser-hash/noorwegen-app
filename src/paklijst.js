// Paklijsten: welke spullen er op een lijst staan en wat er is afgevinkt.
//
// De voorgestelde spullen (src/data/paklijst.js) staan vast in de app. In de gedeelde opslag staan alleen:
// - 'pakitem': spullen die jullie zelf hebben toegevoegd
// - 'pakweg': voorgestelde spullen die jullie hebben weggehaald
// - 'vink': wat er is afgevinkt (apart per persoon of per dag, zodat jullie elkaar niet overschrijven)
// - 'reiziger': de namen van de twee reizigers
import { SAMEN, PERSOONLIJK, RUGZAK_BASIS, RUGZAK_PER_DAG, VERTREK } from './data/paklijst.js';
import { vasteId, nieuweId } from './opslag.js';

// Vaste id op basis van een tekst, zodat elk apparaat voor hetzelfde vinkje dezelfde id gebruikt.
export function tekstId(soort, tekst) {
  const hash = (zaad) => {
    let h = zaad >>> 0;
    for (const c of `${soort}|${tekst}`) h = Math.imul(h ^ c.charCodeAt(0), 2654435761) >>> 0;
    h = Math.imul(h ^ (h >>> 16), 2246822507) >>> 0;
    return (Math.imul(h ^ (h >>> 13), 3266489909) ^ (h >>> 16)) >>> 0;
  };
  const hex = [1, 2, 3, 4].map((z) => hash(z * 0x9e3779b1).toString(16).padStart(8, '0')).join('');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-4${hex.slice(13, 16)}-8${hex.slice(17, 20)}-${hex.slice(20, 32)}`;
}

const slug = (tekst) => tekst.toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

export function reizigers(opslag) {
  return {
    a: opslag.haal(vasteId('reiziger', 1))?.data.naam || 'Reiziger 1',
    b: opslag.haal(vasteId('reiziger', 2))?.data.naam || 'Reiziger 2',
  };
}

export function bewaarNaam(opslag, wie, naam) {
  opslag.bewaar('reiziger', vasteId('reiziger', wie === 'a' ? 1 : 2), { wie, naam: naam.trim() });
}

// lijst = 'samen', 'persoonlijk', 'vertrek' of 'rugzak' (dan met dag).
// Geeft [{sleutel, naam, groep, voor, eigen}] terug, in de volgorde van de groepen.
export function spullen(opslag, lijst, dag = null) {
  const bereik = dag ? `dag${dag}` : lijst;
  const weg = new Set(opslag.lijst('pakweg').map((i) => i.data.sleutel + '|' + i.data.bereik));
  let voorstel;
  if (lijst === 'rugzak') {
    voorstel = [
      ...RUGZAK_BASIS.map((naam) => ({ naam, groep: 'Basis' })),
      ...(RUGZAK_PER_DAG[dag] ?? []).map((naam) => ({ naam, groep: 'Voor vandaag' })),
    ];
  } else {
    voorstel = Object.entries({ samen: SAMEN, persoonlijk: PERSOONLIJK, vertrek: VERTREK }[lijst]).flatMap(([groep, namen]) => namen.map((naam) => ({ naam, groep })));
  }
  const gezien = new Set();
  const uitVoorstel = voorstel
    .map((s) => ({ ...s, sleutel: `std-${lijst}-${slug(s.naam)}`, voor: 'beiden', eigen: false }))
    .filter((s) => !gezien.has(s.sleutel) && gezien.add(s.sleutel) && !weg.has(s.sleutel + '|' + bereik));
  const eigen = opslag
    .lijst('pakitem')
    .map((i) => i.data)
    .filter((d) => d.lijst === lijst && (lijst !== 'rugzak' || d.dag === dag))
    .sort((x, y) => x.gemaakt.localeCompare(y.gemaakt))
    .map((d) => ({ sleutel: d.id, naam: d.naam, groep: d.groep, voor: d.voor ?? 'beiden', eigen: true }));
  // Eigen spullen bij hun groep zetten.
  const alle = [...uitVoorstel];
  for (const e of eigen) {
    const laatste = alle.findLastIndex((s) => s.groep === e.groep);
    alle.splice(laatste === -1 ? alle.length : laatste + 1, 0, e);
  }
  return alle;
}

// wie = 'samen', 'a', 'b' of 'dag5'.
export function isAfgevinkt(opslag, sleutel, wie) {
  return Boolean(opslag.haal(tekstId('vink', `${sleutel}|${wie}`))?.data.aan);
}

export function zetVink(opslag, sleutel, wie, aan) {
  opslag.bewaar('vink', tekstId('vink', `${sleutel}|${wie}`), { sleutel, wie, aan });
}

export function voegToe(opslag, { naam, groep, lijst, dag = null, voor = 'beiden' }) {
  const id = nieuweId();
  opslag.bewaar('pakitem', id, { id, naam: naam.trim(), groep, lijst, dag, voor, gemaakt: new Date().toISOString() });
}

export function haalWeg(opslag, item, lijst, dag = null) {
  if (item.eigen) {
    opslag.verwijder(item.sleutel);
  } else {
    const bereik = dag ? `dag${dag}` : lijst;
    opslag.bewaar('pakweg', tekstId('pakweg', `${item.sleutel}|${bereik}`), { sleutel: item.sleutel, bereik });
  }
}
