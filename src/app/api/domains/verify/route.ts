import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getDomainConfig } from '@/lib/export/vercel-domains';
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

    const { domainId } = await request.json();

    if (!domainId) {
      return NextResponse.json(
        { error: { message: 'Domain ID is required', code: 'VALIDATION_ERROR' } },
        { status: 400 }
      );
    }

    // Get domain record (user owns it)
    const { data: domainRecord } = await supabase
      .from('domains')
      .select('*')
      .eq('id', domainId)
      .eq('user_id', user.id)
      .single();

    if (!domainRecord) {
      return NextResponse.json(
        { error: { message: 'Domain not found', code: 'NOT_FOUND' } },
        { status: 404 }
      );
    }

    if (domainRecord.status === 'active') {
      return NextResponse.json({
        data: { verified: true, status: 'active', domain: domainRecord.domain },
      });
    }

    // Check DNS configuration via Vercel
    const vercelConfig = {
      token: process.env.VERCEL_PLATFORM_TOKEN!,
      teamId: process.env.VERCEL_TEAM_ID!,
    };

    const config = await getDomainConfig(domainRecord.domain, vercelConfig);

    const admin = createAdminClient();

    if (config.configured && config.verified) {
      // Domain is verified — update status
      await admin
        .from('domains')
        .update({
          status: 'active',
          dns_configured: true,
        })
        .eq('id', domainId);

      return NextResponse.json({
        data: {
          verified: true,
          status: 'active',
          domain: domainRecord.domain,
        },
      });
    }

    // Not yet verified
    return NextResponse.json({
      data: {
        verified: false,
        status: 'pending',
        domain: domainRecord.domain,
        configured: config.configured,
        message: config.configured
          ? 'DNS is configured but not yet verified. This may take a few more minutes.'
          : 'DNS records not yet detected. Please add a CNAME record pointing to cname.vercel-dns.com',
      },
    });
  } catch (error) {
    const { error: errBody, status } = formatErrorResponse(error);
    return NextResponse.json({ error: errBody }, { status });
  }
}
