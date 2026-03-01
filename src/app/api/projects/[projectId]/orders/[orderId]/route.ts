import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(
    request: NextRequest,
  { params }: { params: Promise<{ projectId: string; orderId: string }> }
  ) {
    const { projectId, orderId } = await params;
    const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
          return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

  const { data: order, error } = await supabase
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .eq('project_id', projectId)
      .single();

  if (error || !order) {
        return NextResponse.json({ error: 'Order not found' }, { status: 404 });
  }

  return NextResponse.json(order);
}

export async function PUT(
    request: NextRequest,
  { params }: { params: Promise<{ projectId: string; orderId: string }> }
  ) {
    const { projectId, orderId } = await params;
    const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
          return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

  const body = await request.json();
    const { status, shipping_address, tracking_number, notes } = body;

  const updates: Record<string, unknown> = {};
    if (status !== undefined) updates.status = status;
    if (shipping_address !== undefined) updates.shipping_address = shipping_address;
    if (tracking_number !== undefined) updates.tracking_number = tracking_number;
    if (notes !== undefined) updates.notes = notes;

  const { data: order, error } = await supabase
      .from('orders')
      .update(updates)
      .eq('id', orderId)
      .eq('project_id', projectId)
      .select()
      .single();

  if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(order);
}
