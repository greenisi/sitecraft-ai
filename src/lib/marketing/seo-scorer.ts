import type { SeoMetadata, SeoChecklistItem, SeoScore } from '@/types/marketing';

interface BusinessInfo {
  business_name?: string;
  phone?: string;
  email?: string;
  address?: string;
  city?: string;
  state?: string;
  hours?: Record<string, unknown>;
  social_links?: Record<string, unknown>;
  google_maps_url?: string;
}

interface ScorerInput {
  seoEntries: SeoMetadata[];
  businessInfo: BusinessInfo | null;
  projectStatus: string;
  hasCustomDomain: boolean;
  pageCount: number;
}

export function calculateSeoScore(input: ScorerInput): SeoScore {
  const checklist: SeoChecklistItem[] = [];
  const { seoEntries, businessInfo, projectStatus, hasCustomDomain, pageCount } = input;

  const homeSeo = seoEntries.find((e) => e.page_path === '/');

  // ─── META TAGS (30 points) ───────────────────────────────────────

  // Meta title exists and good length (10 pts)
  const titleLen = homeSeo?.meta_title?.length || 0;
  const titleGood = titleLen >= 30 && titleLen <= 65;
  checklist.push({
    id: 'meta-title',
    label: 'Meta title',
    description: titleLen === 0
      ? 'No meta title set. This is what appears in Google search results.'
      : titleGood
        ? `Meta title is ${titleLen} characters (ideal: 50-60).`
        : `Meta title is ${titleLen} characters. Aim for 50-60 characters.`,
    status: titleLen === 0 ? 'fail' : titleGood ? 'pass' : 'warning',
    points: titleLen === 0 ? 0 : titleGood ? 10 : 5,
    maxPoints: 10,
    category: 'meta_tags',
  });

  // Meta description exists and good length (10 pts)
  const descLen = homeSeo?.meta_description?.length || 0;
  const descGood = descLen >= 120 && descLen <= 165;
  checklist.push({
    id: 'meta-description',
    label: 'Meta description',
    description: descLen === 0
      ? 'No meta description set. This appears below the title in search results.'
      : descGood
        ? `Meta description is ${descLen} characters (ideal: 150-160).`
        : `Meta description is ${descLen} characters. Aim for 150-160 characters.`,
    status: descLen === 0 ? 'fail' : descGood ? 'pass' : 'warning',
    points: descLen === 0 ? 0 : descGood ? 10 : 5,
    maxPoints: 10,
    category: 'meta_tags',
  });

  // Open Graph tags (5 pts)
  const hasOg = !!(homeSeo?.og_title && homeSeo?.og_description);
  checklist.push({
    id: 'og-tags',
    label: 'Open Graph tags',
    description: hasOg
      ? 'Open Graph tags are set for social media sharing.'
      : 'Missing Open Graph tags. Your links won\'t look good when shared on social media.',
    status: hasOg ? 'pass' : 'fail',
    points: hasOg ? 5 : 0,
    maxPoints: 5,
    category: 'meta_tags',
  });

  // Twitter card tags (5 pts)
  const hasTwitter = !!(homeSeo?.twitter_title || homeSeo?.twitter_card);
  checklist.push({
    id: 'twitter-tags',
    label: 'Twitter/X card tags',
    description: hasTwitter
      ? 'Twitter card tags are set.'
      : 'Missing Twitter card tags for better link previews on X.',
    status: hasTwitter ? 'pass' : 'warning',
    points: hasTwitter ? 5 : 0,
    maxPoints: 5,
    category: 'meta_tags',
  });

  // ─── CONTENT QUALITY (25 points) ────────────────────────────────

  // Keywords defined (5 pts)
  const hasKeywords = (homeSeo?.keywords?.length || 0) >= 3;
  checklist.push({
    id: 'keywords',
    label: 'Keywords defined',
    description: hasKeywords
      ? `${homeSeo!.keywords.length} keywords defined for your homepage.`
      : 'Define at least 3 target keywords to help search engines understand your content.',
    status: hasKeywords ? 'pass' : 'fail',
    points: hasKeywords ? 5 : 0,
    maxPoints: 5,
    category: 'content_quality',
  });

  // Schema markup (10 pts)
  const hasSchema = homeSeo?.schema_markup && Object.keys(homeSeo.schema_markup).length > 0;
  checklist.push({
    id: 'schema-markup',
    label: 'Schema markup',
    description: hasSchema
      ? 'Structured data (schema markup) is set up for rich search results.'
      : 'No schema markup. Adding structured data helps Google understand your business.',
    status: hasSchema ? 'pass' : 'fail',
    points: hasSchema ? 10 : 0,
    maxPoints: 10,
    category: 'content_quality',
  });

  // Canonical URL (5 pts)
  const hasCanonical = !!homeSeo?.canonical_url;
  checklist.push({
    id: 'canonical-url',
    label: 'Canonical URL',
    description: hasCanonical
      ? 'Canonical URL is set to prevent duplicate content issues.'
      : 'No canonical URL set. This helps avoid duplicate content penalties.',
    status: hasCanonical ? 'pass' : 'warning',
    points: hasCanonical ? 5 : 2,
    maxPoints: 5,
    category: 'content_quality',
  });

  // Robots directive (5 pts)
  const hasRobots = homeSeo?.robots === 'index, follow';
  checklist.push({
    id: 'robots',
    label: 'Robots directive',
    description: hasRobots
      ? 'Your site is set to be indexed by search engines.'
      : homeSeo?.robots
        ? `Robots is set to "${homeSeo.robots}". Ensure this is intentional.`
        : 'No robots directive set.',
    status: hasRobots ? 'pass' : homeSeo ? 'warning' : 'fail',
    points: hasRobots ? 5 : homeSeo ? 3 : 0,
    maxPoints: 5,
    category: 'content_quality',
  });

  // ─── BUSINESS PRESENCE (25 points) ──────────────────────────────

  // Business info complete (10 pts)
  const hasName = !!businessInfo?.business_name;
  const hasPhone = !!businessInfo?.phone;
  const hasEmail = !!businessInfo?.email;
  const hasAddress = !!businessInfo?.address || !!businessInfo?.city;
  const infoCount = [hasName, hasPhone, hasEmail, hasAddress].filter(Boolean).length;
  checklist.push({
    id: 'business-info',
    label: 'Business info complete',
    description: infoCount === 4
      ? 'All core business info is filled in (name, phone, email, address).'
      : `${infoCount}/4 business details complete. Missing: ${[!hasName && 'name', !hasPhone && 'phone', !hasEmail && 'email', !hasAddress && 'address'].filter(Boolean).join(', ')}.`,
    status: infoCount === 4 ? 'pass' : infoCount >= 2 ? 'warning' : 'fail',
    points: Math.round((infoCount / 4) * 10),
    maxPoints: 10,
    category: 'business_presence',
  });

  // Business hours (5 pts)
  const hasHours = businessInfo?.hours && Object.keys(businessInfo.hours).length > 0;
  checklist.push({
    id: 'business-hours',
    label: 'Business hours set',
    description: hasHours
      ? 'Business hours are configured.'
      : 'Add your business hours so customers know when you\'re open.',
    status: hasHours ? 'pass' : 'warning',
    points: hasHours ? 5 : 0,
    maxPoints: 5,
    category: 'business_presence',
  });

  // Social links (5 pts)
  const socialLinks = businessInfo?.social_links || {};
  const socialCount = Object.values(socialLinks).filter(Boolean).length;
  checklist.push({
    id: 'social-links',
    label: 'Social media links',
    description: socialCount > 0
      ? `${socialCount} social media link(s) connected.`
      : 'No social media links. Add your profiles to boost credibility.',
    status: socialCount >= 2 ? 'pass' : socialCount === 1 ? 'warning' : 'fail',
    points: socialCount >= 2 ? 5 : socialCount === 1 ? 3 : 0,
    maxPoints: 5,
    category: 'business_presence',
  });

  // Google Maps (5 pts)
  const hasGoogleMaps = !!businessInfo?.google_maps_url;
  checklist.push({
    id: 'google-maps',
    label: 'Google Maps linked',
    description: hasGoogleMaps
      ? 'Google Maps link is set up.'
      : 'Add your Google Maps URL to help customers find you.',
    status: hasGoogleMaps ? 'pass' : 'warning',
    points: hasGoogleMaps ? 5 : 0,
    maxPoints: 5,
    category: 'business_presence',
  });

  // ─── TECHNICAL (20 points) ──────────────────────────────────────

  // Site published (10 pts)
  const isPublished = projectStatus === 'published';
  checklist.push({
    id: 'site-published',
    label: 'Site is published',
    description: isPublished
      ? 'Your website is live and accessible to search engines.'
      : 'Your site isn\'t published yet. Search engines can\'t index an unpublished site.',
    status: isPublished ? 'pass' : 'fail',
    points: isPublished ? 10 : 0,
    maxPoints: 10,
    category: 'technical',
  });

  // Custom domain (5 pts)
  checklist.push({
    id: 'custom-domain',
    label: 'Custom domain',
    description: hasCustomDomain
      ? 'Custom domain is connected for better SEO authority.'
      : 'Using a subdomain. A custom domain improves search ranking authority.',
    status: hasCustomDomain ? 'pass' : 'warning',
    points: hasCustomDomain ? 5 : 2,
    maxPoints: 5,
    category: 'technical',
  });

  // All pages have unique titles (5 pts)
  const titledPages = seoEntries.filter((e) => e.meta_title);
  const uniqueTitles = new Set(titledPages.map((e) => e.meta_title));
  const allUnique = titledPages.length > 0 && uniqueTitles.size === titledPages.length;
  const coverage = pageCount > 0 ? titledPages.length / pageCount : 0;
  checklist.push({
    id: 'unique-titles',
    label: 'Unique page titles',
    description: titledPages.length === 0
      ? 'No pages have meta titles set.'
      : allUnique && coverage >= 0.8
        ? `All ${titledPages.length} pages have unique meta titles.`
        : `${titledPages.length}/${pageCount} pages have titles. ${!allUnique ? 'Some titles are duplicated.' : ''}`,
    status: allUnique && coverage >= 0.8 ? 'pass' : titledPages.length > 0 ? 'warning' : 'fail',
    points: allUnique && coverage >= 0.8 ? 5 : titledPages.length > 0 ? 2 : 0,
    maxPoints: 5,
    category: 'technical',
  });

  // Calculate totals
  const totalScore = checklist.reduce((sum, item) => sum + item.points, 0);
  const maxScore = checklist.reduce((sum, item) => sum + item.maxPoints, 0);

  const categoryScores = (cat: SeoChecklistItem['category']) => {
    const items = checklist.filter((i) => i.category === cat);
    return {
      score: items.reduce((s, i) => s + i.points, 0),
      max: items.reduce((s, i) => s + i.maxPoints, 0),
    };
  };

  return {
    score: totalScore,
    maxScore,
    checklist,
    categories: {
      meta_tags: categoryScores('meta_tags'),
      content_quality: categoryScores('content_quality'),
      business_presence: categoryScores('business_presence'),
      technical: categoryScores('technical'),
    },
  };
}
