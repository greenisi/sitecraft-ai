import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(
    request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
  ) {
    const { projectId } = await params;
    const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
          return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

  const { data: project } = await supabase
      .from('projects')
      .select('id')
      .eq('id', projectId)
      .eq('user_id', user.id)
      .single();

  if (!project) {
        return NextResponse.json({ error: 'Project not found' }, { status: 404 });
  }

  const { data: properties, error } = await supabase
      .from('properties')
      .select('*')
      .eq('project_id', projectId)
      .order('sort_order', { ascending: true });

  if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(properties);
}

export async function POST(
    request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
  ) {
    const { projectId } = await params;
    const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
          return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

  const { data: project } = await supabase
      .from('projects')
      .select('id')
      .eq('id', projectId)
      .eq('user_id', user.id)
      .single();

  if (!project) {
        return NextResponse.json({ error: 'Project not found' }, { status: 404 });
  }

  const body = await request.json();
    const { title, description, property_type, status, price, address, city, state, zip_code, bedrooms, bathrooms, square_feet, lot_size, year_built, images, features, mls_number, virtual_tour_url } = body;

  if (!title || price === undefined) {
        return NextResponse.json({ error: 'Title and price are required' }, { status: 400 });
  }

  const { count } = await supabase
      .from('properties')
      .select('*', { count: 'exact', head: true })
      .eq('project_id', projectId);

  const { data: property, error } = await supabase
      .from('properties')
      .insert({
              project_id: projectId,
              title,
              description: description || null,
              property_type: property_type || 'house',
              status: status || 'for_sale',
              price,
              address: address || null,
              city: city || null,
              state: state || null,
              zip_code: zip_code || null,
              bedrooms: bedrooms || null,
              bathrooms: bathrooms || null,
              square_feet: square_feet || null,
              lot_size: lot_size || null,
              year_built: year_built || null,
              images: images || [],
              features: features || [],
              mls_number: mls_number || null,
              virtual_tour_url: virtual_tour_url || null,
              sort_order: (count || 0),
      })
      .select()
      .single();

  if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(property, { status: 201 });
        }
