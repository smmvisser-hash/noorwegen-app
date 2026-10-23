import { escapeHtml, korteDatum } from '../regio.js';
import { haalWeer, bewaardWeer, weerOpDatum, laatsteDatum, symbool, windrichting, windwoord, tijdOslo, vandaagOslo } from '../weer.js';

const graden = (t) => `${Math.round(t)}°`;

function deelHtml(d) {
  const s = symbool(d.sym6);
  return `
    <li>
      <span class="weer-deel">${d.naam}<small>${String(d.van).padStart(2, '0')}–${String(d.tot).padStart(2, '0')}</small></span>
      <span class="weer-icoon" title="${escapeHtml(s.tekst)}">${s.icoon}</span>
      <strong class="weer-temp">${graden(d.temp)}</strong>
      <span class="weer-wind">💨 ${Math.round(d.wind)} m/s ${windrichting(d.richting)}${d.stoot != null ? `<small>stoten ${Math.round(d.stoot)}</small>` : ''}</span>
      <span class="weer-regen">💧 ${d.regen6 != null ? `${String(Math.round(d.regen6 * 10) / 10).replace('.', ',')} mm` : '–'}${d.kans6 != null ? `<small>${Math.round(d.kans6)}%</small>` : ''}</span>
    </li>`;
}

function dagHtml(w, kop) {
  return `
    <div class="weer-dag">
      <p class="weer-kop"><strong>${kop}</strong> <span>${graden(w.min)} / ${graden(w.max)}</span>
        <span class="stil">· wind tot ${Math.round(w.maxWind)} m/s (${windwoord(w.maxWind)})</span></p>
      ${w.delen.length ? `<ul class="weer-delen">${w.delen.map(deelHtml).join('')}</ul>` : '<p class="stil">Deze dag is bijna voorbij.</p>'}
    </div>`;
}

function bronRegel(weer) {
  if (!weer?.opgehaald) return '';
  return `<p class="stil weer-bron">Yr / MET Norway · opgehaald ${korteDatum(new Date(weer.opgehaald).toISOString().slice(0, 10))} om ${tijdOslo(weer.opgehaald)}${weer.fout ? ' · nieuw ophalen lukte niet' : ''}</p>`;
}

// Inhoud van een weerblok. nu = true: vandaag en morgen tonen in plaats van de reisdag.
function weerInhoud(weer, datum, nu) {
  if (!weer?.reeks) {
    return weer?.fout
      ? `<p class="stil">Het weerbericht kon niet worden opgehaald${navigator.onLine ? '' : ' (geen internet)'}.</p>`
      : '<p class="stil">Weerbericht ophalen…</p>';
  }
  if (nu) {
    const vandaag = vandaagOslo();
    const morgen = new Date(Date.now() + 86400000).toLocaleDateString('sv-SE', { timeZone: 'Europe/Oslo' });
    const delen = [
      [weerOpDatum(weer, vandaag), 'Vandaag'],
      [weerOpDatum(weer, morgen), 'Morgen'],
    ].filter(([w]) => w);
    return delen.map(([w, kop]) => dagHtml(w, kop)).join('') + bronRegel(weer);
  }
  const w = weerOpDatum(weer, datum);
  if (w) return dagHtml(w, korteDatum(datum)) + bronRegel(weer);
  if (datum < vandaagOslo()) return '<p class="stil">Deze dag is voorbij.</p>';
  const vanaf = new Date(Date.parse(`${datum}T12:00:00Z`) - 9 * 86400000).toISOString().slice(0, 10);
  return `<p class="stil">Yr geeft een verwachting tot ongeveer 9 dagen vooruit (nu tot ${korteDatum(laatsteDatum(weer))}).
    Voor deze dag komt die beschikbaar rond ${korteDatum(vanaf)}.</p>`;
}

// Vult een weerblok voor een plek en datum. Toont meteen het bewaarde bericht en haalt daarna een nieuw op.
// Ligt de datum buiten de verwachting, dan is er een knop om het weer van nu op die plek te bekijken.
export function vulWeer(houder, { lat, lon, datum }) {
  let nu = false;
  const teken = (weer) => {
    const binnenBereik = weer?.reeks && weerOpDatum(weer, datum);
    houder.innerHTML = `
      ${weerInhoud(weer, datum, nu)}
      ${!nu && weer?.reeks && !binnenBereik ? '<button type="button" class="knop knop--licht knop--klein weer-nu">Bekijk het weer van nu op deze plek</button>' : ''}
      ${nu ? '<button type="button" class="knop knop--licht knop--klein weer-nu">Terug naar de reisdag</button>' : ''}`;
    houder.querySelector('.weer-nu')?.addEventListener('click', () => {
      nu = !nu;
      teken(weer);
    });
  };
  teken(bewaardWeer(lat, lon));
  haalWeer(lat, lon).then((weer) => houder.isConnected && teken(weer));
}
