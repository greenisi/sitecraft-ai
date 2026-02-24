import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: domains, error } = await supabase
      .from('domains')
      .select(\`
        id,
        project_id,
        domain,
        domain_type,
        status,
        dns_configured,
        created_at,
        projects (name)
      \`)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const formattedDomains = (domains || []).map((d: any) => ({
      ...d,
      project_name: d.projects?.name || null,
    }));

    return NextResponse.json({ domains: formattedDomains });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch domains' },
      { status: 500 }
    );
  }
}
