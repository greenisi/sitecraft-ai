import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(
    request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
  ) {
    const { projectId } = await params;
    const supabase = await createClient();

  const { data: services, error } = await supabase
      .from('services')
      .select('id, name, description, price, duration, image_url, features, is_active, sort_order')
      .eq('project_id', projectId)
      .eq('is_active', true)
      .order('sort_order', { ascending: true });

  if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(services);
}
