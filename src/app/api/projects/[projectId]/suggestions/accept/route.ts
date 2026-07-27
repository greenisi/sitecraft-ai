import { NextResponse } from 'next/server';
import { requireProjectOwner } from '@/lib/project-auth';
import { getCapability } from '@/lib/ai/capabilities';
import { generateNewsletterFormComponent } from '@/lib/templates/base/newsletter-form';
import { injectComponentIntoPage } from '@/lib/ai/capability-installer';

export const dynamic = 'force-dynamic';

/**
 * Adds an accepted capability to a site.
 *
 * Two routes to "built", depending on whether we own a component for it:
 *
 *  - We do (newsletter): the component is written straight into the site's
 *    files and rendered on a page. Deterministic, instant, free, and identical
 *    every time -- the same reason the booking form is scaffolded rather than
 *    prompted for.
 *  - We don't yet (online ordering, catalogues): the capability is recorded and
 *    a precise edit instruction is returned for the existing edit flow to
 *    build, which is what that flow is for.
 *
 * Either way acceptance is recorded, so the suggestion stops being offered.
 */
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

  if (capabilityId === 'newsletter') {
    const businessName =
      (project as { generation_config?: { business?: { name?: string } } }).generation_config
        ?.business?.name || (project as { name?: string }).name || '';

    const installed = await injectComponentIntoPage(supabase, projectId, {
      componentName: 'NewsletterSignup',
      filePath: 'src/components/NewsletterSignup.tsx',
      content: generateNewsletterFormComponent(businessName),
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
      message: `Email signup added to ${installed.page}. Signups appear under ${capability.adminLabel}.`,
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

function buildEditInstruction(id: string, label: string, whatItDoes: string): string {
  const specifics: Record<string, string> = {
    'online-ordering':
      'Add an ordering page listing the menu items with prices, quantity steppers, a cart summary, and a checkout that posts the order. Every item must come from the real menu already on the site.',
    'product-catalog':
      'Add a shop page with a product grid, individual product detail pages, and a cart with checkout. Use the products already described on the site; do not invent new ones.',
    'property-listings':
      'Add a listings page with a filterable grid of properties, a detail page per property, and a "request a viewing" form on each.',
    'quote-requests':
      'Add a quote request section with fields for the job type, description, and optional photo upload, posting to the site form endpoint.',
    'consultation-requests':
      'Add a consultation request section capturing the nature of the matter, preferred contact method, and urgency.',
    'review-collection':
      'Add a reviews section that displays existing reviews and links to leave one.',
    'work-gallery':
      'Add a before-and-after gallery section with paired images and short captions describing each job.',
  };

  return `${label}: ${whatItDoes} ${specifics[id] || ''} Match the existing design system, use the pre-built components in @/components/kit where they fit, and keep every claim truthful to this business.`.trim();
}
