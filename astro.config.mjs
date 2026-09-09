import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

const noindexRoutePrefixes = ['/current/', '/current2/', '/lab/'];

// Deployment refresh: 2026-09-04 portrait lab
export default defineConfig({
  site: 'https://aapopihkala.fi',
  integrations: [
    sitemap({
      filter: (page) => {
        const pathname = new URL(page).pathname;
        return !noindexRoutePrefixes.some((prefix) => pathname.startsWith(prefix));
      },
    }),
  ],
});
