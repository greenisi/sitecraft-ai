import { NextResponse } from 'next/server';
import { requireProjectOwner } from '@/lib/project-auth';
import { createRouteHandlerClient as createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

function normalizeType(raw: string | null | undefined): string {
  if (!raw) return '';
  const l = raw.toLowerCase().trim();
  if (l.includes('service')) return 'service';
  if (l.includes('e-com') || l.includes('ecom') || l.includes('shop') || l.includes('store') || l.includes('retail')) return 'ecommerce';
  if (l.includes('real') || l.includes('estate') || l.includes('property') || l.includes('realt')) return 'realestate';
  if (l.includes('general') || l.includes('other')) return 'general';
  return '';
}

const STEP_VISIBILITY: Record<string, string[]> = {
  service:    ['business-type','business-info','business-hours','first-service','gallery','blog','stripe'],
  ecommerce:  ['business-type','business-info','business-hours','first-product','gallery','blog','stripe'],
  realestate: ['business-type','business-info','business-hours','gallery','blog','stripe'],
  general:    ['business-type','business-info','business-hours','first-service','first-product','gallery','blog','stripe'],
};

export async function GET(request: Request, { params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await params;
  const { error: authError } = await requireProjectOwner(projectId);
  if (authError) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const supabase = await createClient();

  const [projectRes, bizInfoRes, servicesRes, productsRes, galleryRes, blogRes] = await Promise.all([
    supabase.from('projects').select('business_type, stripe_account_id').eq('id', projectId).single(),
    supabase.from('business_info').select('hours').eq('project_id', projectId).maybeSingle(),
    supabase.from('services').select('id').eq('project_id', projectId).limit(1),
    supabase.from('products').select('id').eq('project_id', projectId).limit(1),
    supabase.from('gallery_images').select('id').eq('project_id', projectId).limit(1),
    supabase.from('blog_posts').select('id').eq('project_id', projectId).limit(1),
  ]);

  const businessType = normalizeType(projectRes.data?.business_type);

  const steps: Record<string, boolean> = {
    'business-type': !!projectRes.data?.business_type,
    'business-info': !!bizInfoRes.data,
    'business-hours': !!(bizInfoRes.data?.hours && Object.keys(bizInfoRes.data.hours).length > 0),
    'first-service': !!(servicesRes.data && servicesRes.data.length > 0),
    'first-product': !!(productsRes.data && productsRes.data.length > 0),
    'gallery': !!(galleryRes.data && galleryRes.data.length > 0),
    'blog': !!(blogRes.data && blogRes.data.length > 0),
    'stripe': !!projectRes.data?.stripe_account_id,
  };

  const visibleKeys = businessType && STEP_VISIBILITY[businessType]
    ? STEP_VISIBILITY[businessType]
    : Object.keys(steps);

  const visibleSteps: Record<string, boolean> = {};
  for (const k of visibleKeys) {
    visibleSteps[k] = steps[k] ?? false;
  }

  const total = visibleKeys.length;
  const completed = visibleKeys.filter(k => steps[k]).length;

  return NextResponse.json({
    steps: visibleSteps,
    completed,
    total,
    businessType: businessType || null,
  });
}
