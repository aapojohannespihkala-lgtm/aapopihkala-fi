import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

// Deployment refresh: 2026-09-04 portrait lab
export default defineConfig({
  site: 'https://aapopihkala.fi',
  integrations: [sitemap()]
});
