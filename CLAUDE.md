# Reisgids-app Noorwegen 2027

## Over de gebruikers
- Twee reizigers (ik en mijn partner). Ik heb **nul programmeerervaring**.
- Leg elke stap uit in gewone, Nederlandse taal. Vertel precies wat ik zelf moet doen (klikken, installeren, invullen).
- Maak bij grotere wijzigingen eerst een plan en wacht op mijn akkoord.
- Vraag nooit om wachtwoorden of sleutels in de chat; leg uit waar ik ze zelf invul (bijv. een `.env`-bestand dat niet in Git komt).
- Sla na elke werkende stap een versie op in Git met een korte Nederlandse beschrijving.
- Ik werk alleen met Claude Code in de browser en de Android-app (cloudsessies), nooit met een terminal op mijn eigen computer. Geef dus nooit instructies als "open je terminal" of "draai dit lokaal".
- Werkwijze: jij maakt wijzigingen op een branch en een pull request; ik bekijk het resultaat via de Netlify deploy-preview op mijn telefoon en merge zelf in GitHub. Leg bij elke pull request uit hoe ik de previewlink vind en wat ik moet controleren.
- Als iets een externe website nodig heeft die de cloudomgeving blokkeert (netwerktoegang), zeg dat duidelijk en leg uit wat ik moet aanpassen.

## De reis
- Periode: 14 juni t/m 3 juli 2027 (20 dagen).
- Gebied: zuid- en westkust van Noorwegen (provincies Agder, Rogaland, Vestland).
- Heen en terug: in één dag van Nederland naar Denemarken, daarna ferry Denemarken–Noorwegen (haven en tijden nog te kiezen; handmatig in te voeren).
- Voertuig: gehuurde grote camperbus (type VW Crafter). Kan maximaal 2 dagen off-grid staan. Afmetingen volgen nog.
- Must-sees: Preikestolen, Kjerag, Lysefjord, Bergen, Hardangerfjord, Sognefjord. Daarnaast graag kleinere, minder toeristische plekken.

### Reisregels (gebruik bij elke routesuggestie)
- Maximaal 6 uur rijden per dag in Noorwegen (inclusief ferries).
- Na elke 3 rijdagen 1 dag zonder rijden.
- Nooit meer dan 2 nachten achter elkaar off-grid; daarna een camping of camperplaats met stroom/water/afvoer.
- Wandelingen maximaal 6 uur inclusief pauzes. We zijn redelijk fit maar lopen langzaam: reken met een rustig tempo en geef bij twijfel de langere tijd.
- Overnachten: mix van campings, camperplaatsen en vrij kamperen (allemannsretten).

### Interesses
Wandelen, kanoën, kleine stadjes, koffie en kaneelbroodjes (kanelboller), wildkamperen, lokale legendes en cultuur, Noorse en inheemse (Sami) kunst.

### Eten en budget
- We koken vooral zelf. Droge voorraad (rijst, pasta, wraps) nemen we mee; groenten, zuivel, vis en vlees kopen we daar.
- Budget: €5.000 totaal voor alles behalve de camperhuur. Categorieën: brandstof, tol, ferry, boodschappen, camping/camperplaats, activiteiten & toegang, parkeren, koffie & kaneelbroodjes, overig.
- Vaste bestelling bij koffietentjes: 2 kaneelbroodjes, 1 thee, 1 koffie.

## De app

### Technische keuzes
- Progressive Web App, **offline-first**. Alle apparaten zijn Android (2 telefoons, 1 tablet) met Chrome; optimaliseer en test daarvoor (installatie via Chrome, smalle telefoon- en tabletweergave).
- Eenvoudige, goed onderhoudbare techniek: Vite + vanilla JavaScript of een lichte framework-keuze; leg de keuze uit.
- Kaart: Leaflet + OpenStreetMap; kaarttegels voor het reisgebied vooraf cachen met beperkte zoomniveaus.
- Reisinhoud als JSON-bestanden in het project (werkt offline).
- Code staat op GitHub; hosting via Netlify, gekoppeld aan de GitHub-repository, met deploy-previews per pull request.
- Sync tussen 2 telefoons en 1 tablet: Supabase (gratis laag), lokaal opslaan en synchroniseren zodra er bereik is.
- Geen navigatiefunctie nodig.

### Functies
1. Interactieve kaart met route en aanbevolen stops, ook per dag te bekijken; lagen voor supermarkten, koffietentjes/bakkerijen (min. 4 sterren, momentopname) met geschatte prijs van de vaste bestelling (zelf bij te werken).
2. Dagprogramma; bij wandelingen: route (GPX), afstand, geschatte duur, hoogtemeters en hoogteprofiel.
3. Overnachtingssuggesties met coördinaten, type, voorzieningen en park4night-code (tekstveld).
4. Info per bezienswaardigheid, met prijzen voor toegang en parkeren en de datum waarop die gecontroleerd zijn.
5. Weerbericht via de Yr/MET Norway API (met correcte User-Agent); laatste resultaat offline tonen met ophaaltijd.
6. Ferrytijden via de Entur API, plus handmatig veld voor de ferry Denemarken–Noorwegen.
7. Budgettracker (zie categorieën), gesynchroniseerd.
8. Paklijst voor de hele reis en een dagrugzaklijst per dag, afvinkbaar en gesynchroniseerd.
9. Reisdagboek per dag met tekst en foto's (verkleind opslaan); optioneel een alleen-lezen deelbare link.

### Taal en stijl
- Alles in het Nederlands.
- Strak, rustig design, goed leesbaar buiten in de zon, groot genoeg om met één hand te bedienen.
- Kleuren: Noors rood, donkerblauw en wit; per dag een accent uit het wapen van de provincie (Agder, Rogaland, Vestland).
- Motieven: strakke lijnen geïnspireerd op rosemaling en op rotstekeningen (helleristninger).
- Gebruik geen Sami-vlag of duodji-patronen als decoratie; Sami-kunst wel als inhoud (info over musea, kunstenaars).

## Bouwvolgorde
1. Fundament + kaart + PWA (offline), zichtbaar via Netlify-preview
2. Installeren op Android en offline testen
3. Reisinhoud: route, dagprogramma, wandelingen, stops, overnachtingen
4. Sync, budget, paklijsten
5. Weer en ferries
6. Reisdagboek en afwerking

## Status
- (Werk deze sectie bij na elke fase: wat af is, wat geboekt is, open vragen.)
