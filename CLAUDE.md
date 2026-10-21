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
- Gebied: zuid- en westkust van Noorwegen (provincies Agder, Rogaland, Vestland), plus uitstapjes naar Geiranger (Møre og Romsdal) en Jotunheimen/Lom (Innlandet).
- Heen en terug: in één dag van Nederland naar Denemarken, daarna ferry Hirtshals–Kristiansand (heen en terug; tijden nog te kiezen, handmatig in te voeren).
- Voertuig: gehuurde grote camperbus (type VW Crafter). Kan maximaal 2 dagen off-grid staan. Afmetingen volgen nog.
- Must-sees: Preikestolen, Kjerag, Lysefjord, Bergen, Hardangerfjord, Sognefjord, Geiranger (watervallen, Fossevandring), Nigardsbreen. Daarnaast graag kleinere, minder toeristische plekken en minder bekende wandelingen zonder drukte. Jotunheimen: keuze op de dag zelf tussen Knutshøe en Besseggen (afhankelijk van weer en fitheid). Trolltunga, Trollstigen, Røros en Trondheim vallen af. Begeleide gletsjerwandeling met gids op Nigardsbreen. Bergen: halve dag + ochtend, daarna door richting Preikestolen. Ook gewenst: Nærøyfjord, Gaularfjellet en Vetlefjord, Blådalen/Møsevassbreen, Hardangervidda.
- Kanoën: 2× een dagtocht (gekozen: Byglandsfjorden en Nærøyfjord).

### Reisregels (gebruik bij elke routesuggestie)
- Maximaal 6 uur rijden per dag in Noorwegen. Ferry's zijn rusttijd en tellen niet mee. Een rijdag mag langer zijn als er ongeveer halverwege een wandeling is ingepland.
- Na elke 3 rijdagen 1 dag zonder rijden. Een kort ritje (max. ~30 min, bijv. naar een startpunt) telt niet als rijdag.
- Nooit meer dan 2 nachten achter elkaar off-grid; daarna een camping of camperplaats met stroom/water/afvoer. Verder graag zo veel mogelijk vrij kamperen.
- Tussen Preikestolen en Kjerag minimaal 2 dagen. Voor Preikestolen mag de overnachting tot 60 min van de start liggen.
- Afgesproken uitzondering: één keer 4 rijdagen achter elkaar (dag 11–14: Geiranger → Gaularfjellet → Bergen → Preikestolen).
- Alleen **gemarkeerde** wandelingen (wij kunnen slecht zelf navigeren); vermeld de markering bij elke wandeling.
- Wandelingen maximaal 6–8 uur inclusief pauzes (korter mag natuurlijk). Korte wandelingen mogen ook midden op een reisdag. We zijn redelijk fit maar lopen langzaam: reken met een rustig tempo en geef bij twijfel de langere tijd.
- Geef in de dagplanning aan waar een supermarkt is voor boodschappen (let op: zondag zijn Noorse supermarkten dicht).
- Geef per dag achtergrondinformatie: geschiedenis, legendes en folkloreverhalen.
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
- Kleuren: Noors rood, donkerblauw en wit; per dag een accent uit het wapen van de provincie (Agder, Rogaland, Vestland, Innlandet, Møre og Romsdal).
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
- **Fase 1 (eerste versie):** Vite + vanilla JS, startscherm met 20 dagen, dagdetail, Leaflet-kaart (hele reis of per dag), PWA (installeerbaar, opent offline), `netlify.toml`. Voorbeelddata voor dag 2–4 (niet gecontroleerd).
- **Fase 2 (installeren en offline testen):** af. App geïnstalleerd via Chrome op Android; opent offline en toont de melding "Geen internet" (ook als wifi aan staat zonder internet).
- Netlify: project `noorwegen-app` (adres: noorwegen-app.netlify.app). Het dubbele project `super-monstera-5e7f12` is verwijderd.
- Kaarttegels worden nu alleen offline bewaard als je ze eerst online bekeken hebt; vooraf cachen van het hele reisgebied volgt later.
- **Fase 3 (reisinhoud), tweede versie:** route voor alle 20 dagen in `src/data/reis.json`: Setesdal (kanodag) → Haukeli → Røldal → Odda/Blådalen → Hardangervidda → Nærøyfjord (kanodag) → Jostedal → Jotunheimen → Geiranger → Gaularfjellet/Vetlefjord → Bergen → Preikestolen → Lysefjord → Kjerag. Per dag: rijtijd, ferry's, wandelingen (met markering), stops, supermarkten, overnachting, achtergrond en verhalen. 8 nachten off-grid. Alles nog ongecontroleerd (tijden, prijzen, coördinaten).
- Nog te doen in fase 3: GPX-routes en hoogteprofielen van wandelingen, controle van prijzen en coördinaten, park4night-codes, kanoverhuur Byglandsfjord en Gudvangen uitzoeken, locatie en markering Blådalen/Møsevassbreen controleren.
- Te reserveren: ferry Hirtshals–Kristiansand (heen/terug), ferry Geiranger–Hellesylt, ferry Forsand–Lysebotn, kano/kajak Nærøyfjord, begeleide gletsjerwandeling Nigardsbreen, parkeren Kjerag/Preikestolen (nog controleren).
- Open vragen: accentkleuren per provincie zijn voorlopig (staan in `src/regio.js`); ferrytijden nog kiezen.
