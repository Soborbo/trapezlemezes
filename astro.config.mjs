// @ts-check
import { defineConfig } from 'astro/config';
import cloudflare from '@astrojs/cloudflare';
import sitemap from '@astrojs/sitemap';
import react from '@astrojs/react';
import tracking from './src/components/conversion-tracking/src/integration.ts';

// https://astro.build/config
export default defineConfig({
  site: 'https://trapezlemezes.hu',
  output: 'static',
  adapter: cloudflare({
    imageService: 'compile'
  }),
  image: {
    service: {
      entrypoint: 'astro/assets/services/sharp'
    }
  },
  redirects: {
    '/trapezlemez-arak/': '/trapezlemez/',
  },
  integrations: [
    react(),
    sitemap({
      filter: (page) =>
        !page.includes('/koszonjuk') &&
        !page.includes('/ajanlat') &&
        !page.includes('/kosar') &&
        !page.includes('/megrendeles') &&
        !page.includes('/sikeres-megrendeles'),
    }),
    tracking({
      gtmId: 'GTM-MPGKFHFX',
      currency: 'HUF',
      sessionTimeoutMinutes: 30,
      debug: import.meta.env.DEV,
    }),
  ],
});
