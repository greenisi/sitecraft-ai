import { NextResponse } from 'next/server';
import { requireProjectOwner } from '@/lib/project-auth';
import { createRouteHandlerClient as createClient } from '@/lib/supabase/server';

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

  const project = projectRes.data;
    const bizInfo = bizInfoRes.data;
    const basePath = `/projects/${projectId}/admin`;

  const hasBusinessType = !!(project?.business_type && project.business_type !== '');
    const hasBusinessInfo = !!bizInfo;
    const hasService = !!(servicesRes.data && servicesRes.data.length > 0);
    const hasProduct = !!(productsRes.data && productsRes.data.length > 0);
    const hasGallery = !!(galleryRes.data && galleryRes.data.length > 0);
    const hasBlog = !!(blogRes.data && blogRes.data.length > 0);
    const hasHours = !!(bizInfo?.hours && JSON.stringify(bizInfo.hours) !== '{}');
    const hasStripe = !!(project?.stripe_account_id && project.stripe_account_id !== '');

  const steps = [
    { id: 'business-type', label: 'Choose Business Type', description: 'Select what kind of business you run', href: basePath + '/setup', completed: hasBusinessType },
    { id: 'business-info', label: 'Add Business Info', description: 'Add your contact details and address', href: basePath + '/business-info', completed: hasBusinessInfo },
    { id: 'business-hours', label: 'Set Up Business Hours', description: 'Let customers know when you are open', href: basePath + '/business-info', completed: hasHours },
    { id: 'first-service', label: 'Add Your First Service', description: 'Showcase what you offer', href: basePath + '/services', completed: hasService },
    { id: 'first-product', label: 'Add Your First Product', description: 'List products for sale', href: basePath + '/products', completed: hasProduct },
    { id: 'gallery', label: 'Upload Gallery Images', description: 'Show off your work with photos', href: basePath + '/gallery', completed: hasGallery },
    { id: 'blog', label: 'Write Your First Blog Post', description: 'Share news and updates', href: basePath + '/blog', completed: hasBlog },
    { id: 'stripe', label: 'Connect Stripe for Payments', description: 'Accept payments from customers', href: basePath + '/setup', completed: hasStripe },
      ];

  const completedCount = steps.filter(s => s.completed).length;

  return NextResponse.json({ steps, completedCount, totalCount: steps.length });
}
