/**
 * Curated, human-verified image galleries per industry.
 *
 * Models pick Unsplash IDs blind — they cannot see what a photo contains.
 * Audit findings (2026-07-02): a generated landscaping site used a restaurant
 * dinner plate for "Fire Features", a tabletop soil scoop for the studio
 * story, recycled 4 photos 23 times, and wrote alt text describing images
 * that didn't exist. Candidate IDs pulled from generic pools included Oreo
 * cookies and a Super Mario figurine.
 *
 * Every entry below was downloaded and VISUALLY VERIFIED by a human/AI
 * reviewer who looked at the actual pixels. `subject` describes what the
 * photo really shows — alt text must be generated FROM it, never from the
 * component's role.
 */

export type ImageTier = 'hero' | 'exterior' | 'detail' | 'texture' | 'portrait';

export interface VerifiedImage {
  id: string;
  tier: ImageTier;
  /** What the photo ACTUALLY shows — verified by looking at it. */
  subject: string;
}

export interface IndustryGallery {
  /** Regex matched against `${industry} ${description}`. */
  match: RegExp;
  images: VerifiedImage[];
}

const LANDSCAPING_GALLERY: VerifiedImage[] = [
  // ── Hero-grade: wide, finished, atmospheric ──────────────────────────
  { id: 'photo-1585320806297-9794b3e4eeae', tier: 'hero', subject: 'Crushed-gravel garden path between blooming pink camellia hedges leading to a shaded bench' },
  { id: 'photo-1568605114967-8130f3a36994', tier: 'hero', subject: 'Craftsman mountain home at dusk with glowing windows, landscaped foundation beds and a stone stepping path' },
  { id: 'photo-1600585154526-990dced4db0d', tier: 'hero', subject: 'Modern charcoal home at dusk with lit timber entry and a dry-stack stone retaining wall in front' },
  // ── Exterior / project shots ─────────────────────────────────────────
  { id: 'photo-1600566753190-17f0baa2a6c3', tier: 'exterior', subject: 'Contemporary timber-clad home with a paver driveway, dark fence and young perimeter plantings' },
  { id: 'photo-1613977257363-707ba9348227', tier: 'exterior', subject: 'White modern villa with a turquoise pool, tidy lawn and covered lounge terrace' },
  { id: 'photo-1512917774080-9991f1c4c750', tier: 'exterior', subject: 'Luxury home pool terrace with tropical greenery in warm evening light' },
  { id: 'photo-1560026301-88340cf16be7', tier: 'exterior', subject: 'Victorian home with layered shrub beds and a stone-edged front garden in bloom' },
  { id: 'photo-1605146769289-440113cc3d00', tier: 'exterior', subject: 'Tidy suburban street of newer homes with fresh lawns and clean driveways' },
  // ── Planting & garden details ────────────────────────────────────────
  { id: 'photo-1534710961216-75c88202f43e', tier: 'detail', subject: 'Purple allium blooms rising from a layered perennial border against dark evergreens' },
  { id: 'photo-1591857177580-dc82b9ac4e1e', tier: 'detail', subject: 'Raised timber garden bed densely planted with herbs, chives and young vegetables' },
  { id: 'photo-1584479898061-15742e14f50d', tier: 'detail', subject: 'Sunlit raised kitchen-garden beds with rainbow chard and leafy greens beside a house' },
  { id: 'photo-1558904541-efa843a96f01', tier: 'detail', subject: 'Fresh-cut lawn in low sunlight with buildings softly out of focus behind' },
  { id: 'photo-1466692476868-aef1dfb1e735', tier: 'detail', subject: 'Seedlings sprouting from a propagation tray in soft light' },
  { id: 'photo-1523348837708-15d4a09cfac2', tier: 'detail', subject: 'Young plants in nursery pots seen from above' },
  { id: 'photo-1416879595882-3373a0480b5b', tier: 'detail', subject: 'Potting bench with a soil scoop, potting mix and pruning shears' },
  // ── Textures (backdrops, dark sections) ──────────────────────────────
  { id: 'photo-1497250681960-ef046c08a56e', tier: 'texture', subject: 'Dense deep-green fern foliage filling the frame' },
  // ── Portraits (testimonials ONLY) ────────────────────────────────────
  { id: 'photo-1472099645785-5658abf4ff4e', tier: 'portrait', subject: 'Man in his 50s with gray hair and glasses, olive polo, warm expression' },
  { id: 'photo-1494790108377-be9c29b29330', tier: 'portrait', subject: 'Dark-haired woman laughing, red top' },
  { id: 'photo-1507003211169-0a1dd7228f2d', tier: 'portrait', subject: 'Smiling man with dark swept hair in a white v-neck' },
  { id: 'photo-1438761681033-6461ffad8d80', tier: 'portrait', subject: 'Young red-haired woman with a calm expression, lake and hills behind' },
];

const AUTOMOTIVE_GALLERY: VerifiedImage[] = [
  { id: 'photo-1503376780353-7e6692767b70', tier: 'hero', subject: 'Black performance sedan driving on a highway at dusk' },
  { id: 'photo-1492144534655-ae79c964c9d7', tier: 'exterior', subject: 'Silver sports coupe displayed in a dark luxury garage' },
  { id: 'photo-1487754180451-c456f719a1fc', tier: 'detail', subject: 'Technician pouring fresh oil into an open vehicle engine bay' },
  { id: 'photo-1549317661-bd32c8ce0db2', tier: 'exterior', subject: 'Clean blue compact car photographed in profile on a city street' },
  { id: 'photo-1553440569-bcc63803a83d', tier: 'exterior', subject: 'Red performance coupe photographed beside a forest road' },
  { id: 'photo-1618843479313-40f8afb4b4d8', tier: 'hero', subject: 'Black performance coupe with gold accents photographed from the front three-quarter angle' },
];

export const INDUSTRY_GALLERIES: IndustryGallery[] = [
  // Keep automotive ahead of healthcare: business names such as "Auto Spa"
  // must classify as vehicle services, not medical/wellness spas.
  {
    match: /automotive|auto\s*(?:spa|detail|care)|car\s*(?:wash|care|detail)|vehicle|ceramic coating|paint correction|mobile detailing/i,
    images: AUTOMOTIVE_GALLERY,
  },
  {
    match: /landscap|garden|lawn|hardscap|outdoor living|tree service|yard/i,
    images: LANDSCAPING_GALLERY,
  },
  // Additional industries get curated after visual verification — do NOT add
  // unverified IDs here. An unverified "plausible" ID is how a dinner plate
  // ends up illustrating Fire Features.
];

export function getIndustryGallery(industry: string, description: string): VerifiedImage[] | null {
  const haystack = `${industry} ${description}`;
  const hit = INDUSTRY_GALLERIES.find((g) => g.match.test(haystack));
  return hit ? hit.images : null;
}

/**
 * Prompt block listing the verified gallery with hard usage rules.
 * Empty string when no curated gallery exists for the industry.
 */
export function buildGalleryPromptBlock(industry: string, description: string): string {
  const gallery = getIndustryGallery(industry, description);
  if (!gallery) return '';

  const byTier = (tier: ImageTier) =>
    gallery
      .filter((img) => img.tier === tier)
      .map((img) => `  - ${img.id} — ${img.subject}`)
      .join('\n');

  return `
=== VERIFIED IMAGE GALLERY — THE ONLY IMAGES YOU MAY USE ===
Every ID below was visually verified by a human reviewer; the description is what the photo ACTUALLY shows. Unsplash IDs from memory are FORBIDDEN for this site — invented IDs have produced restaurant food illustrating landscaping services.

HERO-GRADE (heroes, full-bleed interludes, page banners):
${byTier('hero')}

EXTERIOR / PROJECT (portfolio, project rows, about, service areas):
${byTier('exterior')}

DETAIL (service rows, cards, process steps, galleries):
${byTier('detail')}

TEXTURE (dark-section backdrops at low opacity, pattern layers):
${byTier('texture')}

PORTRAITS (testimonial avatars ONLY — never for services or teams doing work):
${byTier('portrait')}

HARD RULES:
1. Build each URL as https://images.unsplash.com/<id>?w=...&q=80 with sizing per role.
2. USE AT LEAST 10 DISTINCT IMAGES across the site. No image may appear in more than ONE section (texture tier exempt, max 2 uses).
3. Match tier to role: heroes from HERO-GRADE only; never a detail shot as a hero; portraits only as testimonial avatars.
4. Write alt text FROM the verified description above (you may append locality/brand naturally) — NEVER describe what you wish the image showed.
5. Before/after sliders are BANNED for this site — no verified before/after pair exists. Use a project gallery with captions instead.
6. If a section's ideal subject (crew at work, fire pit, close-up stonework) has no verified image, choose the nearest verified subject and write copy/alt that matches THAT image — never fake it.`;
}
