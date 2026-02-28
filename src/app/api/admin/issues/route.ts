import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin';

export async function GET() {
  const { error, supabase } = await requireAdmin();
  if (error) return error;

  const { data: issues, error: dbError } = await supabase
    .from('issues')
    .select('*, projects(name), profiles:user_id(display_name)')
    .order('created_at', { ascending: false });

  if (dbError) {
    return NextResponse.json({ error: dbError.message }, { status: 500 });
  }

  return NextResponse.json({ issues: issues || [] });
}

export async function PATCH(request: NextRequest) {
  const { error, supabase } = await requireAdmin();
  if (error) return error;

  const body = await request.json();
  const { issueId, status, admin_notes, priority } = body;

  if (!issueId) {
    return NextResponse.json({ error: 'Issue ID is required' }, { status: 400 });
  }

  const updates: Record<string, any> = { updated_at: new Date().toISOString() };
  if (status) updates.status = status;
  if (admin_notes !== undefined) updates.admin_notes = admin_notes;
  if (priority) updates.priority = priority;

  const { error: updateError } = await supabase
    .from('issues')
    .update(updates)
    .eq('id', issueId);

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
