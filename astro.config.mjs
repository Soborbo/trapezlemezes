// @ts-check
import { defineConfig } from 'astro/config';
import cloudflare from '@astrojs/cloudflare';
import sitemap from '@astrojs/sitemap';

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
  integrations: [
    sitemap({
      filter: (page) => !page.includes('/koszonjuk') && !page.includes('/ajanlat'),
    }),
  ],
});
