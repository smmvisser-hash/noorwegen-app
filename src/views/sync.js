import { escapeHtml } from '../regio.js';
import { polarstepsLink, bewaarPolarsteps } from '../polarsteps.js';
import reis from '../data/reis.json';
import { tegelLijst, geschatteMB, telOpgeslagen, slaKaartOp, stopOpslaan, opslagToestand, luisterOpslag } from '../kaartopslag.js';

const UITLEG = {
  'niet-ingesteld': 'Synchronisatie is nog niet ingesteld. Alles wat je invult, wordt alleen op dit apparaat bewaard.',
  uitgelogd: 'Log in om je gegevens te delen met de andere apparaten.',
  onbekend: 'Even geduld…',
  bezig: 'Bezig met synchroniseren…',
  bijgewerkt: 'Alles is bijgewerkt.',
  offline: 'Geen internet. Wijzigingen worden bewaard en later gedeeld.',
  wacht: 'Geen internet. Er wachten wijzigingen; die worden gedeeld zodra er bereik is.',
  fout: 'Synchroniseren lukte niet. De app probeert het later opnieuw.',
};

export function statusTekst(s) {
  const tijd = s.laatsteSync && s.laatsteSync > '2000' ? new Date(s.laatsteSync).toLocaleString('nl-NL', { dateStyle: 'short', timeStyle: 'short' }) : null;
  return { uitleg: UITLEG[s.toestand] ?? s.toestand, tijd };
}

// Vertaalt de foutmelding van Supabase naar gewone taal, met de originele melding erachter.
function inlogFout(err) {
  if (!navigator.onLine) return 'Voor inloggen is internet nodig.';
  const melding = String(err?.message ?? err ?? '');
  const uitleg = [
    [/invalid login credentials/i, 'E-mailadres of wachtwoord klopt niet, of dit account bestaat niet in dit Supabase-project (Authentication → Users).'],
    [/email not confirmed/i, 'Dit account is nog niet bevestigd. Maak het in Supabase opnieuw aan met "Auto confirm user" aangevinkt.'],
    [/secret api key/i, 'In Netlify staat de geheime (secret) sleutel. Gebruik de publishable/anon key.'],
    [/invalid api key|no api key|apikey/i, 'De sleutel in Netlify (VITE_SUPABASE_ANON_KEY) klopt niet.'],
    [/failed to fetch|networkerror|load failed|fetch/i, 'Supabase is niet bereikbaar. Klopt de Project URL in Netlify (VITE_SUPABASE_URL)? Die moet eruitzien als https://….supabase.co'],
  ].find(([patroon]) => patroon.test(melding));
  return `${uitleg ? uitleg[1] : 'Inloggen lukte niet.'} (Melding: ${melding || 'onbekend'})`;
}

// Melding na het bewaren van de Polarsteps-link (blijft staan als het scherm opnieuw getekend wordt).
let polarstepsMelding = null;

// Scherm met synchronisatiestatus en inloggen/uitloggen.
export async function toonSync(app, opslag) {
  const s = opslag.status();
  const { uitleg, tijd } = statusTekst(s);
  const gebruiker = opslag.backend ? await opslag.backend.gebruiker() : null;

  app.innerHTML = `
    <section class="scherm">
      <a class="terug" href="#/">← Alle dagen</a>
      <h2 class="schermtitel">Instellingen</h2>
      <h3>Synchronisatie</h3>
      <div class="blok sync-${escapeHtml(s.toestand)}">
        <strong>${escapeHtml(uitleg)}</strong>
        ${s.wachtend ? `<span>${s.wachtend} wijziging(en) wachten om gedeeld te worden.</span>` : ''}
        ${tijd ? `<span class="stil">Laatst bijgewerkt: ${escapeHtml(tijd)}</span>` : ''}
        ${s.toestand === 'fout' && s.bericht ? `<span class="stil">Melding: ${escapeHtml(s.bericht)}</span>` : ''}
      </div>
      ${!opslag.backend ? `
        <p class="stil">Tip: de koppeling wordt ingesteld in Netlify met de variabelen <code>VITE_SUPABASE_URL</code> en
        <code>VITE_SUPABASE_ANON_KEY</code>. Daarna moet de app opnieuw gebouwd worden.</p>` : gebruiker ? `
        <p>Ingelogd als <strong>${escapeHtml(gebruiker.email)}</strong>.</p>
        <div class="knoppen">
          <button class="knop" id="nu-sync">Nu synchroniseren</button>
          <button class="knop knop--licht" id="uitloggen">Uitloggen</button>
        </div>` : `
        <form id="inlogformulier" class="formulier">
          <label>E-mail <input type="email" name="email" autocomplete="username" required></label>
          <label>Wachtwoord <input type="password" name="wachtwoord" autocomplete="current-password" required></label>
          <button class="knop" type="submit">Inloggen</button>
          <p class="foutmelding" id="inlogfout" hidden></p>
        </form>
        <p class="stil">Je hoeft maar één keer per apparaat in te loggen. Daarna blijf je ingelogd, ook zonder internet.</p>`}

      <h3>Offline kaart</h3>
      <div class="blok" id="kaartopslag"></div>

      <h3>Polarsteps</h3>
      <form id="polarsteps" class="formulier">
        <label>Link naar jullie reis
          <input name="url" type="url" inputmode="url" autocomplete="off" placeholder="https://www.polarsteps.com/…" value="${escapeHtml(polarstepsLink(opslag))}">
        </label>
        <button class="knop" type="submit">Link bewaren</button>
        ${polarstepsMelding ? `<p class="${polarstepsMelding.fout ? 'foutmelding' : 'gelukt'}" aria-live="polite">${escapeHtml(polarstepsMelding.tekst)}</p>` : ''}
        <p class="stil">Kopieer in Polarsteps bij jullie reis de link via <b>Delen</b> en plak hem hier.
          De link wordt alleen gedeeld met jullie eigen apparaten, niet openbaar.</p>
      </form>
    </section>`;

  toonKaartopslag(app.querySelector('#kaartopslag'));

  app.querySelector('#polarsteps').addEventListener('submit', (e) => {
    e.preventDefault();
    document.activeElement?.blur();
    const fout = bewaarPolarsteps(opslag, e.target.url.value);
    polarstepsMelding = { fout: Boolean(fout), tekst: fout || (polarstepsLink(opslag) ? 'Bewaard. Op het startscherm en op elke dagpagina staat nu een knop naar Polarsteps.' : 'Link gewist.') };
    toonSync(app, opslag).then(() => {
      if (fout) app.querySelector('#polarsteps input').value = e.target.url.value;
    });
  });

  app.querySelector('#nu-sync')?.addEventListener('click', () => opslag.synchroniseer());
  app.querySelector('#uitloggen')?.addEventListener('click', async () => {
    await opslag.backend.uitloggen();
    toonSync(app, opslag);
  });
  app.querySelector('#inlogformulier')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const form = new FormData(e.target);
    const fout = app.querySelector('#inlogfout');
    fout.hidden = true;
    try {
      await opslag.backend.inloggen(form.get('email'), form.get('wachtwoord'));
      await opslag.synchroniseer();
      toonSync(app, opslag);
    } catch (err) {
      fout.textContent = inlogFout(err);
      fout.hidden = false;
    }
  });
}

// Blok "Offline kaart": topokaart van Kartverket vooraf opslaan, met voortgang.
let stopLuisteren = null;
async function toonKaartopslag(houder) {
  const tegels = tegelLijst(reis.dagen);
  let opgeslagen = await telOpgeslagen(tegels);
  const teken = (t) => {
    if (!houder.isConnected) return stopLuisteren?.();
    if (t.bezig) opgeslagen = t.klaar;
    const procent = Math.round((opgeslagen / tegels.length) * 100);
    houder.innerHTML = `
      <span>De topokaart van het reisgebied: overzicht, een strook langs de route en extra detail rond
        overnachtingen en wandelingen. Ongeveer ${geschatteMB(tegels.length)} MB.</span>
      <span class="stil">Doe dit thuis via wifi en laat het scherm aan (15–30 minuten). Stoppen en later verdergaan kan.</span>
      <div class="voortgang">
        <span><strong>${procent}%</strong> opgeslagen (${opgeslagen} van ${tegels.length} stukjes)</span>
        <div class="balk" role="img" aria-label="${procent} procent opgeslagen"><i style="width:${procent}%"></i></div>
      </div>
      ${t.melding && !t.bezig ? `<p class="${t.melding.startsWith('Klaar!') ? 'gelukt' : 'stil'}">${escapeHtml(t.melding)}</p>` : ''}
      ${t.bezig
        ? '<button type="button" class="knop knop--licht" id="kaart-stop">Stoppen</button>'
        : `<button type="button" class="knop" id="kaart-opslaan" ${opgeslagen === tegels.length ? 'disabled' : ''}>${
            opgeslagen === tegels.length ? '✓ Kaart is offline opgeslagen' : opgeslagen ? 'Verder met opslaan' : 'Kaart offline opslaan'}</button>`}`;
    houder.querySelector('#kaart-opslaan')?.addEventListener('click', () => {
      if (!navigator.onLine) return alert('Er is nu geen internet. Probeer het thuis via wifi.');
      slaKaartOp(reis.dagen).then(async () => {
        opgeslagen = await telOpgeslagen(tegels);
        teken(opslagToestand());
      });
    });
    houder.querySelector('#kaart-stop')?.addEventListener('click', stopOpslaan);
  };
  stopLuisteren?.();
  stopLuisteren = luisterOpslag(teken);
  teken(opslagToestand());
}
