// Haalt het weerbericht op bij MET Norway (Yr) met een eigen User-Agent, zoals hun voorwaarden vragen.
// Een browser mag die User-Agent zelf niet instellen; daarom loopt het verzoek via deze kleine Netlify-functie.
// De app vraagt: /api/weer?lat=58.9985&lon=6.1376

const USER_AGENT = 'noorwegen-app/1.0 (+https://noorwegen-app.netlify.app; https://github.com/smmvisser-hash/noorwegen-app)';

export default async (verzoek) => {
  const vraag = new URL(verzoek.url).searchParams;
  const lat = Number.parseFloat(vraag.get('lat'));
  const lon = Number.parseFloat(vraag.get('lon'));
  if (!Number.isFinite(lat) || !Number.isFinite(lon) || Math.abs(lat) > 90 || Math.abs(lon) > 180) {
    return new Response(JSON.stringify({ fout: 'lat en lon ontbreken' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
  }
  // MET wil maximaal 4 decimalen (zo kunnen ze het antwoord ook beter hergebruiken).
  const url = `https://api.met.no/weatherapi/locationforecast/2.0/complete?lat=${lat.toFixed(4)}&lon=${lon.toFixed(4)}`;
  try {
    const antwoord = await fetch(url, { headers: { 'User-Agent': USER_AGENT } });
    return new Response(await antwoord.text(), {
      status: antwoord.status,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=900',
        'Netlify-CDN-Cache-Control': 'public, s-maxage=1800',
      },
    });
  } catch {
    return new Response(JSON.stringify({ fout: 'MET Norway niet bereikbaar' }), { status: 502, headers: { 'Content-Type': 'application/json' } });
  }
};

export const config = { path: '/api/weer' };
