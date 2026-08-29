export const prerender = true;

export async function GET() {
  const modules = import.meta.glob('../data/ajankohtaista/*.md', {
    eager: true,
  });

  const urls = [
    { loc: 'https://aapopihkala.fi/' },
    { loc: 'https://aapopihkala.fi/maisema-arkkitehti-espoo' },
    { loc: 'https://aapopihkala.fi/kaupunkiluonto' },
    { loc: 'https://aapopihkala.fi/hulevedet' },
    { loc: 'https://aapopihkala.fi/biodiversiteetti' },
  ];

  for (const [path, post] of Object.entries(modules)) {
    const slug = path.split('/').pop().replace('.md', '');

    urls.push({
      loc: `https://aapopihkala.fi/ajankohtaista/${slug}`,
      lastmod: post.frontmatter.date,
    });
  }

  const body = urls
    .map(
      ({ loc, lastmod }) => `
  <url>
    <loc>${loc}</loc>
    ${lastmod ? `<lastmod>${lastmod}</lastmod>` : ''}
  </url>`
    )
    .join('');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${body}
</urlset>`;

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
    },
  });
}
