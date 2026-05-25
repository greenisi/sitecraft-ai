import type { MetadataRoute } from 'next';
import { VERTICALS } from './for/[vertical]/vertical-config';

const SITE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://app.innovated.marketing';

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  return [
    { url: SITE_URL,           lastModified: now, changeFrequency: 'weekly',  priority: 1.0 },
    { url: `${SITE_URL}/pricing`, lastModified: now, changeFrequency: 'monthly', priority: 0.8 },
    ...Object.keys(VERTICALS).map(slug => ({
      url: `${SITE_URL}/for/${slug}`,
      lastModified: now,
      changeFrequency: 'weekly' as const,
      priority: 0.9,
    })),
  ];
}
