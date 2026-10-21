// Voorstel voor de paklijsten. Jullie kunnen in de app zelf dingen toevoegen, weghalen en afvinken.

// Spullen die maar één keer mee hoeven.
export const SAMEN = {
  'Papieren en geld': [
    'Rijbewijs',
    'Huurcontract camper',
    'Reisverzekering (polis en noodnummer)',
    'Ferrytickets Hirtshals–Kristiansand',
    'Reserveringen (gletsjertocht, kano, ferry’s)',
    'Wat contante Noorse kronen',
  ],
  'Camper en koken': [
    'Beddengoed (navragen bij verhuur)',
    'Pannen, borden en bestek (navragen bij verhuur)',
    'Goed keukenmes en snijplank',
    'Campinggas (navragen welk type)',
    'Aansteker of lucifers',
    'Thermosfles',
    'Koffie, thee en koffiefilters',
    'Olie, zout, peper en kruiden',
    'Afwasmiddel, afwasborstel en theedoeken',
    'Keukenrol en vuilniszakken',
    'Diepvrieszakjes en folie',
    'Boodschappentassen',
  ],
  'Droge voorraad': ['Rijst', 'Pasta', 'Wraps', 'Havermout of muesli', 'Soep (zakjes)', 'Pindakaas en ander houdbaar beleg', 'Kruidenmixen'],
  'Off-grid': [
    'Jerrycan voor water',
    'Waterslang en kraanadapters',
    'Stroomkabel met CEE-stekker en verloopstekker',
    'Powerbanks',
    'Wc-papier',
    'Wc-vloeistof voor chemisch toilet',
    'Ducttape en klein gereedschap',
  ],
  'Buiten en wandelen': [
    'EHBO-set (met blarenpleisters en tekentang)',
    'Droogzakken (kano)',
    'Waterdicht telefoonhoesje',
    'Verrekijker',
    'Zitkussentjes',
    'Waslijn en knijpers',
    'Wasmiddel (reisverpakking)',
  ],
  Elektronica: ['Usb-lader voor in de auto', 'Oplaadkabels', 'Stekkerdoos', 'Camera met lader'],
  Overig: ['Kaartspel of spelletjes', 'Muggenspray (extra)', 'Paraplu'],
};

// Ieder neemt deze spullen zelf mee (elk een eigen lijst om af te vinken).
export const PERSOONLIJK = {
  Kleding: [
    'Wandelbroek (2×)',
    'Korte broek',
    'Sneldrogende T-shirts',
    'Thermo-ondergoed',
    'Fleece of tussenlaag',
    'Warme jas (donsjas)',
    'Regenjas',
    'Regenbroek',
    'Ondergoed',
    'Wandelsokken',
    'Gewone sokken',
    'Muts',
    'Handschoenen',
    'Buff of sjaal',
    'Pet of zonnehoed',
    'Zwemkleding',
    'Kleding voor ’s avonds',
    'Pyjama',
  ],
  Schoenen: ['Wandelschoenen (ingelopen)', 'Sneakers of gewone schoenen', 'Sandalen of slippers', 'Waterschoenen (kano)'],
  Toiletspullen: [
    'Tandenborstel en tandpasta',
    'Deodorant',
    'Douchegel en shampoo',
    'Sneldrogende handdoek',
    'Zonnebrand (factor 30–50)',
    'Lippenbalsem met SPF',
    'Medicijnen',
    'Bril of lenzen',
    'Haarborstel en elastiekjes',
    'Nagelschaartje',
  ],
  Wandelspullen: ['Dagrugzak', 'Waterfles', 'Wandelstokken', 'Zonnebril', 'Hoofdlamp'],
  Overig: [
    'Paspoort of ID-kaart',
    'Zorgpas (EHIC)',
    'Pinpas of creditcard',
    'Telefoon en oplader',
    'Oogmasker (lichte nachten)',
    'Oordopjes',
    'Muggenmiddel',
    'Boek of e-reader',
  ],
};

// Dagrugzak: dit gaat elke dag mee.
export const RUGZAK_BASIS = [
  'Water (1–1,5 liter per persoon)',
  'Lunch',
  'Snacks',
  'Regenjas',
  'Warme laag',
  'EHBO-setje',
  'Telefoon (opgeladen) en powerbank',
  'Zonnebrand en zonnebril',
  'Wc-papier en zakje',
];

const KANO = ['Droogzak', 'Waterdicht telefoonhoesje', 'Reservekleding (in de droogzak)', 'Handdoek', 'Pet of zonnehoed', 'Waterschoenen of sandalen', 'Extra water'];
const LANGE_WANDELING = ['Wandelstokken', 'Hoofdlamp', 'Extra water (2 liter per persoon)', 'Extra eten', 'Muts en handschoenen'];

// Extra spullen per dag, passend bij wat er die dag gebeurt.
export const RUGZAK_PER_DAG = {
  1: ['Paspoorten of ID-kaarten'],
  2: ['Paspoorten of ID-kaarten', 'Ferrytickets'],
  3: KANO,
  4: ['Muts en handschoenen (hoog fjell)'],
  5: ['Wandelstokken', 'Muts en handschoenen'],
  6: ['Wandelstokken', 'Muts en handschoenen', 'Extra water'],
  7: KANO,
  8: ['Reservering gletsjertocht', 'Muts en handschoenen', 'Zonnebrand factor 50 (gletsjer)', 'Stevige wandelschoenen'],
  9: ['Muts en handschoenen (Sognefjellet)'],
  10: [...LANGE_WANDELING, 'Geld voor de boot over het Gjende (bij Besseggen)'],
  11: ['Wandelstokken', 'Dalsnibba: tolgeld voor de weg'],
  12: [],
  13: ['Portemonnee', 'Paraplu', 'Boodschappentas'],
  14: ['Wandelstokken (Fløyen naar beneden)', 'Paraplu'],
  15: [...LANGE_WANDELING, 'Parkeerticket'],
  16: ['Portemonnee', 'Paraplu'],
  17: ['Ferryticket Lysefjord'],
  18: [...LANGE_WANDELING, 'Parkeerticket'],
  19: ['Paspoorten of ID-kaarten', 'Ferrytickets'],
  20: ['Paspoorten of ID-kaarten'],
};
