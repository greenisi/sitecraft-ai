import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { addDomainToProject } from '@/lib/export/vercel-domains';
import { formatErrorResponse } from '@/lib/utils/errors';

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

    const { domain, projectId } = await request.json();

    if (!domain || !projectId) {
      return NextResponse.json(
        { error: { message: 'Domain and project ID are required', code: 'VALIDATION_ERROR' } },
        { status: 400 }
      );
    }

    // Validate domain format
    const domainRegex = /^[a-zA-Z0-9][a-zA-Z0-9-]*\.[a-zA-Z]{2,}$/;
    if (!domainRegex.test(domain)) {
      return NextResponse.json(
        { error: { message: 'Invalid domain format', code: 'VALIDATION_ERROR' } },
        { status: 400 }
      );
    }

    // Verify project ownership and that it's published
    const { data: project } = await supabase
      .from('projects')
      .select('id, vercel_project_name')
      .eq('id', projectId)
      .eq('user_id', user.id)
      .single();

    if (!project) {
      return NextResponse.json(
        { error: { message: 'Project not found', code: 'NOT_FOUND' } },
        { status: 404 }
      );
    }

    if (!project.vercel_project_name) {
      return NextResponse.json(
        { error: { message: 'Project must be published first', code: 'VALIDATION_ERROR' } },
        { status: 400 }
      );
    }

    // Add domain to Vercel project
    const vercelConfig = {
      token: process.env.VERCEL_PLATFORM_TOKEN!,
      teamId: process.env.VERCEL_TEAM_ID!,
    };

    let domainInfo;
    try {
      domainInfo = await addDomainToProject(
        project.vercel_project_name,
        domain,
        vercelConfig
      );
    } catch (err) {
      return NextResponse.json(
        {
          error: {
            message: `Could not add domain: ${err instanceof Error ? err.message : 'Unknown error'}`,
            code: 'DOMAIN_ERROR',
          },
        },
        { status: 400 }
      );
    }

    // Generate verification token
    const verificationToken = crypto.randomUUID();

    // Create domain record
    const admin = createAdminClient();

    // Remove any existing external domain for this project
    await admin
      .from('domains')
      .delete()
      .eq('project_id', projectId)
      .eq('domain_type', 'external');

    await admin.from('domains').insert({
      project_id: projectId,
      user_id: user.id,
      domain,
      domain_type: 'external',
      status: domainInfo.verified ? 'active' : 'pending',
      dns_configured: domainInfo.configured,
      verification_token: verificationToken,
    });

    // Update project custom_domain
    await admin
      .from('projects')
      .update({ custom_domain: domain })
      .eq('id', projectId);

    return NextResponse.json({
      data: {
        domain,
        status: domainInfo.verified ? 'active' : 'pending',
        verified: domainInfo.verified,
        instructions: domainInfo.verified
          ? []
          : [
              `Add a CNAME record for "${domain}" pointing to "cname.vercel-dns.com"`,
              'DNS propagation typically takes 5-30 minutes',
              'Click "Verify" once you\'ve added the DNS record',
            ],
        verification: domainInfo.verification,
      },
    });
  } catch (error) {
    const { error: errBody, status } = formatErrorResponse(error);
    return NextResponse.json({ error: errBody }, { status });
  }
}
