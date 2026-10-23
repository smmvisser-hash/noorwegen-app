// Eenvoudige lijnmotieven, geïnspireerd op Noorse rotstekeningen (helleristninger) en rosemaling.
// Alleen lijnen in de huidige tekstkleur (currentColor), zodat ze rustig blijven.

const PADEN = {
  // Boot met bemanning, zoals op de rotstekeningen van Alta en Østfold
  boot: { viewBox: '0 0 64 32', d: 'M4 18 Q32 30 60 18 M10 18 L8 10 M54 18 L57 9 M20 22 V14 M28 24 V14 M36 24 V14 M44 22 V14' },
  // Eland met gewei
  eland: {
    viewBox: '0 0 64 40',
    d: 'M14 18 Q30 14 46 18 M18 18 L16 34 M24 18 L24 34 M40 18 L40 34 M44 18 L47 34 M46 18 L52 10 L58 12 M52 10 L50 4 M52 10 L56 4 M14 18 L10 22',
  },
  // Mens met opgeheven armen
  mens: { viewBox: '0 0 32 40', d: 'M16 8 m-3 0 a3 3 0 1 0 6 0 a3 3 0 1 0 -6 0 M16 11 V26 M16 26 L10 37 M16 26 L22 37 M16 15 L8 9 L6 3 M16 15 L24 9 L26 3' },
  // Rosemaling-rank: twee gespiegelde krullen met een blaadje in het midden
  rank: {
    viewBox: '0 0 120 24',
    d: 'M4 12 H40 M80 12 H116 M40 12 C44 4 54 4 54 10 C54 14 48 14 48 11 M80 12 C76 4 66 4 66 10 C66 14 72 14 72 11 M60 4 C64 8 64 16 60 20 C56 16 56 8 60 4',
  },
};

export function motief(naam, klasse = 'motief') {
  const m = PADEN[naam];
  return `<svg class="${klasse} ${klasse}--${naam}" viewBox="${m.viewBox}" aria-hidden="true"><path d="${m.d}" /></svg>`;
}
