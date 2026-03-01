import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(
    request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
  ) {
    const { projectId } = await params;
    const supabase = await createClient();

  const url = new URL(request.url);
    const propertyType = url.searchParams.get('type');
    const status = url.searchParams.get('status');

  let query = supabase
      .from('properties')
      .select('*')
      .eq('project_id', projectId)
      .eq('is_active', true)
      .order('sort_order', { ascending: true });

  if (propertyType) {
        query = query.eq('property_type', propertyType);
  }
    if (status) {
          query = query.eq('status', status);
    }

  const { data: properties, error } = await query;

  if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(properties);
}
