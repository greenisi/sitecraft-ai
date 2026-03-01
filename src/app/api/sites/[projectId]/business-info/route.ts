import { NextResponse } from 'next/server';
import { createRouteHandlerClient as createClient } from '@/lib/supabase/server';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const { projectId } = await params;
    const supabase = await createClient();

    const { data: business_info, error: fetchError } = await supabase
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
