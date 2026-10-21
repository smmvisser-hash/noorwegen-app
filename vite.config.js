import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

// Versie = moment van bouwen (Nederlandse tijd); zichtbaar onderaan het startscherm.
const versie = new Date().toLocaleString('nl-NL', { timeZone: 'Europe/Amsterdam', dateStyle: 'medium', timeStyle: 'short' });

export default defineConfig({
  define: { __VERSIE__: JSON.stringify(versie) },
  plugins: [
    VitePWA({
      registerType: 'autoUpdate',
      // De registratie gebeurt in main.js, zodat de app zichzelf herlaadt bij een nieuwe versie.
      injectRegister: false,
      includeAssets: ['icons/favicon.svg', 'icons/apple-touch-icon.png'],
      manifest: {
        name: 'Noorwegen 2027',
        short_name: 'Noorwegen',
        description: 'Onze reisgids voor de zuid- en westkust van Noorwegen, 14 juni – 3 juli 2027.',
        lang: 'nl',
        start_url: '/',
        scope: '/',
        display: 'standalone',
        orientation: 'any',
        background_color: '#ffffff',
        theme_color: '#00205b',
        icons: [
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icons/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        // Alle bestanden van de app zelf worden bij de eerste keer opslaan in de cache gezet,
        // zodat de app daarna ook zonder internet opent.
        globPatterns: ['**/*.{js,css,html,svg,png,jpg,webp,json,webmanifest,gpx}'],
        navigateFallback: '/index.html',
        // Nieuwe versie direct actief maken en meteen de geopende app overnemen.
        skipWaiting: true,
        clientsClaim: true,
        runtimeCaching: [
          {
            // Kaarttegels die je al eens bekeken hebt, blijven offline beschikbaar.
            urlPattern: /^https:\/\/tile\.openstreetmap\.org\/.*/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'kaarttegels',
              expiration: { maxEntries: 3000, maxAgeSeconds: 60 * 60 * 24 * 90 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
      },
    }),
  ],
});
