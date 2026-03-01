import { NextRequest, NextResponse } from 'next/server';
import { requireProjectOwner } from '@/lib/project-auth';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string; leadId: string }> }
) {
  try {
    const { projectId, leadId } = await params;
    const { error, supabase } = await requireProjectOwner(projectId);
    if (error) return error;

    const body = await request.json();
    const { status } = body;

    const { data: lead, error: updateError } = await supabase!
      .from('leads')
      .update({ status })
      .eq('id', leadId)
      .eq('project_id', projectId)
      .select()
      .single();

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    return NextResponse.json({ lead });
  } catch {
    return NextResponse.json({ error: 'Failed to update lead' }, { status: 500 });
  }
}
