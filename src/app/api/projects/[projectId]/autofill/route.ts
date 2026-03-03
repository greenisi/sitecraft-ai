import { NextResponse } from 'next/server';
import { requireProjectOwner } from '@/lib/project-auth';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const { projectId } = await params;
    const { error: authError, supabase, project } = await requireProjectOwner(projectId);
    if (authError || !supabase || !project)
      return authError || NextResponse.json({ error: 'Not found' }, { status: 404 });

    // Get generation_config from project
    const { data: proj } = await supabase
      .from('projects')
      .select('generation_config, business_type, name')
      .eq('id', projectId)
      .single();

    const config = (proj?.generation_config as any) || {};
    const biz = config.business || {};
    const siteType = config.siteType || proj?.business_type || 'business';

    // 1. Upsert business_info with project-specific data
    const defaultHours: Record<string, { open: string; close: string; closed: boolean }> = {};
    ['Monday','Tuesday','Wednesday','Thursday','Friday'].forEach(d => {
      defaultHours[d] = { open: '09:00', close: '17:00', closed: false };
    });
    ['Saturday','Sunday'].forEach(d => {
      defaultHours[d] = { open: '09:00', close: '17:00', closed: true };
    });

    await supabase.from('business_info').upsert({
      project_id: projectId,
      phone: biz.phone || '(555) 000-0000',
      email: biz.email || (biz.name ? biz.name.toLowerCase().replace(/[^a-z0-9]/g, '') + '@example.com' : 'info@example.com'),
      address: biz.address || '123 Main Street',
      city: biz.city || 'Anytown',
      state: biz.state || 'CA',
      zip: biz.zip || '90210',
      country: biz.country || 'USA',
      hours: defaultHours,
      social_links: { facebook: '', instagram: '', twitter: '', linkedin: '', youtube: '' },
      google_maps_url: '',
    }, { onConflict: 'project_id' });

    // 2. Set business_type on project if not set
    if (!proj?.business_type && siteType) {
      await supabase.from('projects').update({ business_type: siteType }).eq('id', projectId);
    }

    // 3. Seed sample services for service-type businesses
    const serviceTypes = ['business', 'local-service', 'service'];
    if (serviceTypes.includes(siteType.toLowerCase())) {
      const { data: existingServices } = await supabase
        .from('services').select('id').eq('project_id', projectId).limit(1);
      if (!existingServices || existingServices.length === 0) {
        const industry = biz.industry || 'General';
        const sampleServices = generateServices(industry, biz.name || 'Business');
        for (let i = 0; i < sampleServices.length; i++) {
          await supabase.from('services').insert({
            project_id: projectId,
            name: sampleServices[i].name,
            description: sampleServices[i].description,
            price: sampleServices[i].price,
            duration: sampleServices[i].duration || null,
            is_active: true,
            sort_order: i,
          });
        }
      }
    }

    // 4. Seed sample products for ecommerce-type businesses
    const ecomTypes = ['ecommerce', 'e-commerce', 'shop', 'store'];
    if (ecomTypes.includes(siteType.toLowerCase())) {
      const { data: existingProducts } = await supabase
        .from('products').select('id').eq('project_id', projectId).limit(1);
      if (!existingProducts || existingProducts.length === 0) {
        const industry = biz.industry || 'General';
        const sampleProducts = generateProducts(industry, biz.name || 'Store');
        for (let i = 0; i < sampleProducts.length; i++) {
          await supabase.from('products').insert({
            project_id: projectId,
            name: sampleProducts[i].name,
            description: sampleProducts[i].description,
            price: sampleProducts[i].price,
            category: sampleProducts[i].category || null,
            is_active: true,
            sort_order: i,
            images: [],
            inventory_count: 50,
          });
        }
      }
    }

    return NextResponse.json({ success: true, siteType, businessName: biz.name || proj?.name });
  } catch (err) {
    console.error('Autofill error:', err);
    return NextResponse.json({ error: 'Autofill failed' }, { status: 500 });
  }
}

function generateServices(industry: string, bizName: string) {
  const ind = industry.toLowerCase();
  if (ind.includes('cannabis') || ind.includes('dispensary')) {
    return [
      { name: 'In-Store Consultation', description: 'Personalized guidance from our knowledgeable budtenders to find the perfect product for your needs.', price: 0, duration: '30 min' },
      { name: 'Online Ordering & Pickup', description: 'Browse our menu online and pick up your order at your convenience.', price: 0, duration: '15 min' },
      { name: 'Loyalty Program', description: 'Earn points on every purchase and redeem for discounts on future orders.', price: 0, duration: null },
    ];
  }
  if (ind.includes('coffee') || ind.includes('cafe') || ind.includes('roast')) {
    return [
      { name: 'Espresso Bar', description: 'Handcrafted espresso drinks made with freshly roasted beans.', price: 5, duration: '5 min' },
      { name: 'Pour-Over Service', description: 'Single-origin pour-over coffee brewed to perfection at your table.', price: 7, duration: '10 min' },
      { name: 'Catering & Events', description: 'Full-service coffee catering for your corporate events and private parties.', price: 200, duration: '2 hrs' },
    ];
  }
  if (ind.includes('dental') || ind.includes('dentist')) {
    return [
      { name: 'General Cleaning', description: 'Professional dental cleaning and oral health assessment.', price: 150, duration: '60 min' },
      { name: 'Teeth Whitening', description: 'Professional-grade whitening treatment for a brighter smile.', price: 350, duration: '90 min' },
      { name: 'Dental Consultation', description: 'Comprehensive exam with X-rays and personalized treatment plan.', price: 100, duration: '45 min' },
    ];
  }
  if (ind.includes('yoga') || ind.includes('fitness') || ind.includes('gym')) {
    return [
      { name: 'Group Yoga Class', description: 'All-levels group session focusing on breath, alignment, and mindfulness.', price: 25, duration: '60 min' },
      { name: 'Private Session', description: 'One-on-one instruction tailored to your personal goals and abilities.', price: 80, duration: '60 min' },
      { name: 'Monthly Membership', description: 'Unlimited access to all classes and studio amenities.', price: 99, duration: null },
    ];
  }
  if (ind.includes('florist') || ind.includes('flower')) {
    return [
      { name: 'Custom Bouquet', description: 'A beautifully arranged bouquet crafted to your specifications.', price: 65, duration: '30 min' },
      { name: 'Wedding Florals', description: 'Complete floral design for your special day including ceremony and reception.', price: 1500, duration: null },
      { name: 'Weekly Subscription', description: 'Fresh seasonal flowers delivered to your door every week.', price: 45, duration: null },
    ];
  }
  if (ind.includes('real estate') || ind.includes('realty')) {
    return [
      { name: 'Property Valuation', description: 'Expert assessment of your property current market value.', price: 0, duration: '60 min' },
      { name: 'Buyer Consultation', description: 'Personalized session to understand your needs and begin your home search.', price: 0, duration: '45 min' },
      { name: 'Listing Package', description: 'Professional photography, staging advice, and full MLS listing.', price: 500, duration: null },
    ];
  }
  return [
    { name: 'Consultation', description: 'Initial consultation to discuss your needs and goals with ' + bizName + '.', price: 0, duration: '30 min' },
    { name: 'Standard Service', description: 'Our most popular service package tailored to your requirements.', price: 99, duration: '60 min' },
    { name: 'Premium Package', description: 'Comprehensive premium service with dedicated support and follow-up.', price: 249, duration: '90 min' },
  ];
}

function generateProducts(industry: string, bizName: string) {
  const ind = industry.toLowerCase();
  if (ind.includes('coffee') || ind.includes('cafe') || ind.includes('roast')) {
    return [
      { name: 'House Blend - Whole Bean', description: 'Our signature medium roast blend with notes of chocolate and caramel. 12oz bag.', price: 16.99, category: 'Coffee Beans' },
      { name: 'Single Origin Ethiopian', description: 'Light roast single origin with bright fruity notes. 12oz bag.', price: 19.99, category: 'Coffee Beans' },
      { name: 'Branded Ceramic Mug', description: 'Handcrafted ceramic mug featuring our logo. 14oz capacity.', price: 14.99, category: 'Merchandise' },
    ];
  }
  if (ind.includes('cannabis') || ind.includes('dispensary')) {
    return [
      { name: 'Premium Flower - 3.5g', description: 'Top-shelf indoor-grown flower. Strain varies by availability.', price: 45, category: 'Flower' },
      { name: 'Organic Edibles Pack', description: 'Assorted organic gummies, 100mg total. Made with natural ingredients.', price: 25, category: 'Edibles' },
      { name: 'Rolling Accessories Kit', description: 'Complete kit with papers, tips, and tray.', price: 15, category: 'Accessories' },
    ];
  }
  return [
    { name: 'Starter Package', description: 'Everything you need to get started with ' + bizName + '.', price: 29.99, category: 'Packages' },
    { name: 'Professional Kit', description: 'Our best-selling professional-grade product bundle.', price: 79.99, category: 'Packages' },
    { name: 'Gift Card', description: 'Give the gift of ' + bizName + '. Available in any amount.', price: 50, category: 'Gift Cards' },
  ];
}
