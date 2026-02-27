import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { purchaseDomain, setNameservers } from '@/lib/domains/namecom';
import { addDomainToProject } from '@/lib/export/vercel-domains';
import { formatErrorResponse } from '@/lib/utils/errors';
import type { ContactInfo } from '@/lib/domains/namecom';

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: { message: 'Unauthorized', code: 'AUTH_ERROR' } },
        { status: 401 }
      );
    }

    const { domain, projectId, contacts } = await request.json();

    if (!domain || !projectId) {
      return NextResponse.json(
        { error: { message: 'Domain and project ID are required', code: 'VALIDATION_ERROR' } },
        { status: 400 }
      );
    }

    // Verify project ownership and that it's published
    const { data: project } = await supabase
      .from('projects')
      .select('id, vercel_project_name, status, published_url')
      .eq('id', projectId)
      .eq('user_id', user.id)
      .single();

    if (!project) {
      return NextResponse.json(
        { error: { message: 'Project not found', code: 'NOT_FOUND' } },
        { status: 404 }
      );
    }

    if (!project.vercel_project_name && !project.published_url) {
      return NextResponse.json(
        { error: { message: 'Project must be published first', code: 'VALIDATION_ERROR' } },
        { status: 400 }
      );
    }

    // Default contacts for reseller — in production, collect from user
    const purchaseContacts: ContactInfo = contacts || {
      firstName: 'Domain',
      lastName: 'Owner',
      email: user.email || 'domains@innovatedmarketing.com',
      phone: '+1.5555555555',
      address1: '123 Main St',
      city: 'Anytown',
      state: 'CA',
      zip: '90210',
      country: 'US',
    };

    // 1. Purchase domain via Name.com
    const purchaseResult = await purchaseDomain(domain, purchaseContacts);

    // 2. Point domain to Vercel (set CNAME or nameservers)
    // Using Vercel's recommended approach: add domain to project
    // Derive vercel project name from published_url if not set directly
    let vercelProjectName = project.vercel_project_name;
    if (!vercelProjectName && project.published_url) {
      // published_url format: https://SLUG.innovated.site
      const urlMatch = project.published_url.match(/https?:\/\/([^.]+)\.innovated\.site/);
      if (urlMatch) vercelProjectName = 'sc-' + urlMatch[1];
    }
    if (!vercelProjectName) {
      return NextResponse.json({ error: { message: 'Could not determine Vercel project name', code: 'VALIDATION_ERROR' } }, { status: 400 });
    }

    const vercelConfig = {
      token: process.env.VERCEL_PLATFORM_TOKEN!,
      teamId: process.env.VERCEL_TEAM_ID!,
    };

    await addDomainToProject(vercelProjectName, domain, vercelConfig);

    // 3. Set nameservers to point to Vercel (alternative approach)
    // For purchased domains, we can directly set nameservers
    // Vercel expects: ns1.vercel-dns.com, ns2.vercel-dns.com
    try {
      await setNameservers(domain, [
        'ns1.vercel-dns.com',
        'ns2.vercel-dns.com',
      ]);
    } catch (nsError) {
      // Nameserver update may take time — non-fatal
      console.warn('Nameserver update note:', nsError);
    }

    // 4. Create domain record in DB
    const admin = createAdminClient();
    await admin.from('domains').insert({
      project_id: projectId,
      user_id: user.id,
      domain,
      domain_type: 'purchased',
      status: 'pending', // Will become active once DNS propagates
      dns_configured: true,
      namecom_order_id: String(purchaseResult.order?.orderId || ''),
    });

    // 5. Update project custom_domain
    await admin
      .from('projects')
      .update({ custom_domain: domain })
      .eq('id', projectId);

    return NextResponse.json({
      data: {
        domain,
        status: 'pending',
        message: 'Domain purchased! DNS propagation typically takes 5-30 minutes.',
        orderId: purchaseResult.order?.orderId,
      },
    });
  } catch (error) {
    const { error: errBody, status } = formatErrorResponse(error);
    return NextResponse.json({ error: errBody }, { status });
  }
}
