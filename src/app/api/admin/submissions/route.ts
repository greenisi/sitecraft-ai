import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin';

export async function GET(request: NextRequest) {
  const { error, supabase } = await requireAdmin();
  if (error) return error;

  const url = new URL(request.url);
  const status = url.searchParams.get('status');
  const projectId = url.searchParams.get('project_id');
  const formType = url.searchParams.get('form_type');

  let query = supabase!
    .from('form_submissions')
    .select('*, projects!inner(name)')
    .order('created_at', { ascending: false })
    .limit(200);

  if (status) query = query.eq('status', status);
  if (projectId) query = query.eq('project_id', projectId);
  if (formType) query = query.eq('form_type', formType);

  const { data: submissions, error: fetchError } = await query;

  if (fetchError) {
    return NextResponse.json({ error: fetchError.message }, { status: 500 });
  }

  // Flatten project name into each submission
  const result = (submissions || []).map((s: any) => ({
    ...s,
    project_name: s.projects?.name || 'Unknown',
    projects: undefined,
  }));

  return NextResponse.json({ submissions: result });
}

export async function PATCH(request: NextRequest) {
  const { error, supabase } = await requireAdmin();
  if (error) return error;

  const body = await request.json();
  const { id, status } = body;

  if (!id || !status) {
    return NextResponse.json({ error: 'id and status are required' }, { status: 400 });
  }

  const { data, error: updateError } = await supabase!
    .from('form_submissions')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  return NextResponse.json({ submission: data });
}
