import { NextResponse } from 'next/server';
import { requireProjectOwner } from '@/lib/project-auth';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const { projectId } = await params;
    const { error, supabase } = await requireProjectOwner(projectId);
    if (error) return error;

    const { data: business_info, error: fetchError } = await supabase!
      .from('business_info')
      .select('*')
      .eq('project_id', projectId)
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') {
      return NextResponse.json({ error: fetchError.message }, { status: 500 });
    }

    return NextResponse.json({ business_info: business_info || null });
  } catch {
    return NextResponse.json({ error: 'Failed to fetch business info' }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const { projectId } = await params;
    const { error, supabase } = await requireProjectOwner(projectId);
    if (error) return error;

    const body = await request.json();
    const { phone, email, address, city, state, zip, country, hours, social_links, google_maps_url } = body;

    const { data: business_info, error: upsertError } = await supabase!
      .from('business_info')
      .upsert({
        project_id: projectId,
        phone: phone || null,
        email: email || null,
        address: address || null,
        city: city || null,
        state: state || null,
        zip: zip || null,
        country: country || 'USA',
        hours: hours || {},
        social_links: social_links || {},
        google_maps_url: google_maps_url || null,
      }, { onConflict: 'project_id' })
      .select()
      .single();

    if (upsertError) {
      return NextResponse.json({ error: upsertError.message }, { status: 500 });
    }

    return NextResponse.json({ business_info });
  } catch {
    return NextResponse.json({ error: 'Failed to update business info' }, { status: 500 });
  }
}
