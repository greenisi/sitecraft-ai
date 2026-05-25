import type { MetadataRoute } from 'next';

const SITE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://app.innovated.marketing';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: ['/', '/for/', '/pricing', '/domains'],
        // Protect authed dashboards + API surface from indexing
        disallow: ['/dashboard', '/projects/', '/admin/', '/api/', '/start', '/issues'],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
