// Kleuren per regio. De accentkleuren zijn voorlopig gekozen naar de wapens van de provincies;
// pas ze hier aan als je andere tinten wilt — de hele app volgt dan automatisch.
export const REGIO = {
  agder: { naam: 'Agder', kleur: '#c8961e' },
  rogaland: { naam: 'Rogaland', kleur: '#b0122d' },
  vestland: { naam: 'Vestland', kleur: '#1d5f8a' },
  innlandet: { naam: 'Innlandet', kleur: '#4f7a3a' },
  more: { naam: 'Møre og Romsdal', kleur: '#6a4c93' },
  onderweg: { naam: 'Onderweg', kleur: '#6b7280' },
};

const LEEG = { naam: 'Nog te plannen', kleur: '#c4c9d4' };

export function regioVan(dag) {
  return REGIO[dag.regio] ?? LEEG;
}

const WEEKDAGEN = ['zo', 'ma', 'di', 'wo', 'do', 'vr', 'za'];
const MAANDEN = ['jan', 'feb', 'mrt', 'apr', 'mei', 'jun', 'jul', 'aug', 'sep', 'okt', 'nov', 'dec'];

// "2027-06-14" -> "ma 14 jun"
export function korteDatum(iso) {
  const [j, m, d] = iso.split('-').map(Number);
  const datum = new Date(Date.UTC(j, m - 1, d));
  return `${WEEKDAGEN[datum.getUTCDay()]} ${d} ${MAANDEN[m - 1]}`;
}

export function escapeHtml(tekst) {
  return String(tekst).replace(/[&<>"']/g, (t) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[t]);
}
