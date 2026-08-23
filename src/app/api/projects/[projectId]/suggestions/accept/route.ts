import { NextResponse } from 'next/server';
import { requireProjectOwner } from '@/lib/project-auth';
import { getCapability } from '@/lib/ai/capabilities';
import { generateNewsletterFormComponent } from '@/lib/templates/base/newsletter-form';
import { generateBookingFormComponent, deriveBookingOptions } from '@/lib/templates/base/booking-form';
import { generateQuoteFormComponent, deriveQuoteOptions } from '@/lib/templates/base/quote-form';
import { injectComponentIntoPage } from '@/lib/ai/capability-installer';

export const dynamic = 'force-dynamic';

/**
 * Adds an accepted capability to a site.
 *
 * Two routes to "built", depending on whether we own a component for it:
 *
 *  - We do: the component is written straight into the site's files and
 *    rendered on a page. Deterministic, instant, free, and identical every
 *    time -- the same reason the booking form is scaffolded rather than
 *    prompted for.
 *  - We don't yet (ordering, catalogues, listings): the capability is recorded
 *    and a precise edit instruction is returned for the existing edit flow to
 *    build, which is what that flow is for.
 *
 * Either way acceptance is recorded, so the suggestion stops being offered.
 */

interface SiteContext {
  businessName: string;
  siteType: string;
  industry: string;
}

interface PrebuiltCapability {
  componentName: string;
  filePath: string;
  build: (context: SiteContext) => string;
  preferPages?: RegExp[];
  /** What the owner is told once it is on the page. */
  installedMessage: (page: string, adminLabel: string) => string;
}

/**
 * Capabilities we can build ourselves. Adding one is a data change, not a new
 * branch, which is the point: every entry here is a capability that stops
 * being a suggestion the owner has to act on and becomes something the product
 * actually did.
 */
const PREBUILT: Record<string, PrebuiltCapability> = {
  newsletter: {
    componentName: 'NewsletterSignup',
    filePath: 'src/components/NewsletterSignup.tsx',
    build: (context) => generateNewsletterFormComponent(context.businessName),
    installedMessage: (page, adminLabel) =>
      `Email signup added to ${page}. Signups appear under ${adminLabel}.`,
  },

  'appointment-booking': {
    componentName: 'BookingForm',
    filePath: 'src/components/BookingForm.tsx',
    build: (context) =>
      generateBookingFormComponent(deriveBookingOptions(context.siteType, context.industry)),
    // Someone booking has already decided; put it where they go to do it.
    preferPages: [/\/(book|booking|appointments?|reservations?)\/page\.tsx$/, /\/contact\/page\.tsx$/],
    installedMessage: (page, adminLabel) =>
      `Booking added to ${page}, showing real availability. Requests arrive under ${adminLabel} for you to confirm or decline.`,
  },

  'quote-requests': {
    componentName: 'QuoteRequestForm',
    filePath: 'src/components/QuoteRequestForm.tsx',
    build: (context) =>
      generateQuoteFormComponent(deriveQuoteOptions(context.siteType, context.industry)),
    preferPages: [/\/(quote|quotes|estimates?)\/page\.tsx$/, /\/contact\/page\.tsx$/],
    installedMessage: (page, adminLabel) =>
      `Quote requests added to ${page}, with photo upload. They arrive under ${adminLabel}.`,
  },
};

export async function POST(
  request: Request,
  { params }: { params: Promise<{ projectId: string }> }
) {
  const { projectId } = await params;
  const { error: authError, supabase, project } = await requireProjectOwner(projectId);
  if (authError || !supabase || !project) {
    return authError || NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const body = await request.json().catch(() => ({}));
  const capabilityId = typeof body.capabilityId === 'string' ? body.capabilityId : '';
  const capability = getCapability(capabilityId);
  if (!capability) {
    return NextResponse.json({ error: 'Unknown capability' }, { status: 400 });
  }

  const already: string[] = Array.isArray(
    (project as { accepted_capabilities?: string[] }).accepted_capabilities
  )
    ? (project as { accepted_capabilities?: string[] }).accepted_capabilities!
    : [];

  // Record acceptance first: if the install half-fails we still stop nagging,
  // and the owner can retry from the dashboard rather than being re-offered
  // something they already said yes to.
  if (!already.includes(capabilityId)) {
    await supabase
      .from('projects')
      .update({ accepted_capabilities: [...already, capabilityId] })
      .eq('id', projectId);
  }

  const prebuilt = PREBUILT[capabilityId];
  if (prebuilt) {
    const context = siteContext(project);

    const installed = await injectComponentIntoPage(supabase, projectId, {
      componentName: prebuilt.componentName,
      filePath: prebuilt.filePath,
      content: prebuilt.build(context),
      preferPages: prebuilt.preferPages,
    });

    if (!installed.ok) {
      return NextResponse.json({
        status: 'recorded',
        message: installed.reason,
        adminHref: `/projects/${projectId}/${capability.adminPath}`,
      });
    }

    return NextResponse.json({
      status: 'installed',
      // The site's live copy only changes on the next publish, and an owner
      // who checks immediately and sees nothing concludes it did not work.
      needsRepublish: true,
      message: prebuilt.installedMessage(installed.page!, capability.adminLabel),
      adminHref: `/projects/${projectId}/${capability.adminPath}`,
    });
  }

  // No prebuilt component yet — hand the edit flow a specific instruction
  // rather than a vague one, so it builds the right thing.
  return NextResponse.json({
    status: 'needs-build',
    editInstruction: buildEditInstruction(capabilityId, capability.label, capability.whatItDoes),
    message: `${capability.label} is ready to build.`,
    adminHref: `/projects/${projectId}/${capability.adminPath}`,
  });
}

/**
 * siteType and industry are frequently null or empty on older projects, and
 * "null null" would match a trade regex by accident, so everything is coerced
 * to a plain string before it reaches the derive functions.
 */
function siteContext(project: unknown): SiteContext {
  const config = (project as { generation_config?: { siteType?: string; business?: { name?: string; industry?: string } } })
    .generation_config;
  return {
    businessName: config?.business?.name || (project as { name?: string }).name || '',
    siteType: config?.siteType || '',
    industry: config?.business?.industry || '',
  };
}

function buildEditInstruction(id: string, label: string, whatItDoes: string): string {
  const specifics: Record<string, string> = {
    'online-ordering':
      'Add an ordering page listing the menu items with prices, quantity steppers, a cart summary, and a checkout that posts the order. Every item must come from the real menu already on the site.',
    'product-catalog':
      'Add a shop page with a product grid, individual product detail pages, and a cart with checkout. Use the products already described on the site; do not invent new ones.',
    'property-listings':
      'Add a listings page with a filterable grid of properties, a detail page per property, and a "request a viewing" form on each.',
    'consultation-requests':
      'Add a consultation request section capturing the nature of the matter, preferred contact method, and urgency.',
    'review-collection':
      'Add a reviews section that displays existing reviews and links to leave one.',
    'work-gallery':
      'Add a before-and-after gallery section with paired images and short captions describing each job.',
  };

  return `${label}: ${whatItDoes} ${specifics[id] || ''} Match the existing design system, use the pre-built components in @/components/kit where they fit, and keep every claim truthful to this business.`.trim();
}
