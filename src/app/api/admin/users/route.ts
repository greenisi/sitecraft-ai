import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin';

export async function GET() {
    const { error, supabase } = await requireAdmin();
    if (error) return error;

  const { data: profiles, error: dbError } = await supabase!
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });

  if (dbError) {
        return NextResponse.json({ error: dbError.message }, { status: 500 });
  }

  return NextResponse.json({ users: profiles });
}

export async function PATCH(request: NextRequest) {
    const { error, supabase } = await requireAdmin();
    if (error) return error;

  const body = await request.json();
    const { userId, plan, generation_credits, role } = body;

  if (!userId) {
        return NextResponse.json({ error: 'userId is required' }, { status: 400 });
  }

  const updates: Record<string, unknown> = {};
    if (plan !== undefined) updates.plan = plan;
    if (generation_credits !== undefined) updates.generation_credits = generation_credits;
    if (role !== undefined) updates.role = role;

  const { data, error: dbError } = await supabase!
      .from('profiles')
      .update(updates)
      .eq('id', userId)
      .select()
      .single();

  if (dbError) {
        return NextResponse.json({ error: dbError.message }, { status: 500 });
  }

  return NextResponse.json({ user: data });
}
