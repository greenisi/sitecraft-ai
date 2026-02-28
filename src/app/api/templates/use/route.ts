import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient as createClient } from '@/lib/supabase/server';
import { getTemplateById } from '@/lib/templates/premium-templates';

export async function POST(request: NextRequest) {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: { templateId: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const { templateId } = body;
  if (!templateId) {
    return NextResponse.json({ error: 'Missing templateId' }, { status: 400 });
  }

  const template = getTemplateById(templateId);
  if (!template) {
    return NextResponse.json({ error: 'Template not found' }, { status: 404 });
  }

  // Check plan
  const { data: profile } = await supabase
    .from('profiles')
    .select('plan, generation_credits')
    .eq('id', user.id)
    .single();

  if (!profile) {
    return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
  }

  if (profile.plan === 'free') {
    return NextResponse.json(
      {
        error: 'subscription_required',
        message: 'Please subscribe to generate websites.',
      },
      { status: 402 }
    );
  }

  // Create a new project pre-loaded with the template config
  const slug = template.config.business.name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .substring(0, 40);

  const uniqueSlug = `${slug}-${Date.now()}`;

  const { data: project, error: projectError } = await supabase
    .from('projects')
    .insert({
      user_id: user.id,
      name: `${template.name} — ${template.config.business.name}`,
      slug: uniqueSlug,
      site_type: template.config.siteType,
      status: 'draft',
      generation_config: template.config,
    })
    .select('id')
    .single();

  if (projectError || !project) {
    console.error('Failed to create project from template:', projectError);
    return NextResponse.json(
      { error: 'Failed to create project' },
      { status: 500 }
    );
  }

  return NextResponse.json({ projectId: project.id });
}

