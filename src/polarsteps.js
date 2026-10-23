// Link naar jullie reis op Polarsteps. Die staat niet in de code (de deelcode in de link is privé),
// maar in de gedeelde opslag: alleen zichtbaar na inloggen, en daarna op alle apparaten.
import { vasteId } from './opslag.js';

const ID = vasteId('polarsteps', 1);

export function polarstepsLink(opslag) {
  return opslag?.haal(ID)?.data.url ?? '';
}

// Controleert en bewaart de link. Geeft een foutmelding terug, of '' als het gelukt is.
export function bewaarPolarsteps(opslag, tekst) {
  const invoer = tekst.trim();
  if (!invoer) {
    opslag.bewaar('polarsteps', ID, { url: '' });
    return '';
  }
  let url;
  try {
    url = new URL(invoer.startsWith('http') ? invoer : `https://${invoer}`);
  } catch {
    return 'Dit lijkt geen link. Kopieer de deellink uit Polarsteps en plak hem hier.';
  }
  if (!/(^|\.)polarsteps\.com$/.test(url.hostname)) return 'Dit is geen Polarsteps-link (die begint met https://www.polarsteps.com/).';
  url.protocol = 'https:';
  url.searchParams.delete('referral');
  opslag.bewaar('polarsteps', ID, { url: url.toString() });
  return '';
}
