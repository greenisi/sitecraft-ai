import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(
    request: NextRequest,
  { params }: { params: Promise<{ projectId: string; propertyId: string }> }
  ) {
    const { projectId, propertyId } = await params;
    const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
          return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

  const { data: property, error } = await supabase
      .from('properties')
      .select('*')
      .eq('id', propertyId)
      .eq('project_id', projectId)
      .single();

  if (error || !property) {
        return NextResponse.json({ error: 'Property not found' }, { status: 404 });
  }

  return NextResponse.json(property);
}

export async function PUT(
    request: NextRequest,
  { params }: { params: Promise<{ projectId: string; propertyId: string }> }
  ) {
    const { projectId, propertyId } = await params;
    const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
          return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

  const body = await request.json();
    const allowedFields = ['title', 'description', 'property_type', 'status', 'price', 'address', 'city', 'state', 'zip_code', 'bedrooms', 'bathrooms', 'square_feet', 'lot_size', 'year_built', 'images', 'features', 'mls_number', 'virtual_tour_url', 'sort_order'];

  const updates: Record<string, unknown> = {};
    for (const field of allowedFields) {
          if (body[field] !== undefined) {
                  updates[field] = body[field];
          }
    }

  const { data: property, error } = await supabase
      .from('properties')
      .update(updates)
      .eq('id', propertyId)
      .eq('project_id', projectId)
      .select()
      .single();

  if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(property);
}

export async function DELETE(
    request: NextRequest,
  { params }: { params: Promise<{ projectId: string; propertyId: string }> }
  ) {
    const { projectId, propertyId } = await params;
    const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
          return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

  const { error } = await supabase
      .from('properties')
      .delete()
      .eq('id', propertyId)
      .eq('project_id', projectId);

  if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
