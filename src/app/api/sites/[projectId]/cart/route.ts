import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// TODO: The cart_items table needs to be created via migration
// For now, this API will return errors until the table exists
// Migration needed: CREATE TABLE cart_items (id, project_id, session_id, product_id, quantity, variant, created_at)

export async function GET(
    request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
  ) {
    const { projectId } = await params;
    const supabase = await createClient();
    const url = new URL(request.url);
    const sessionId = url.searchParams.get('session_id');

  if (!sessionId) {
        return NextResponse.json({ error: 'Session ID required' }, { status: 400 });
  }

  const { data: items, error } = await supabase
      .from('cart_items')
      .select('*, products(name, price, images)')
      .eq('project_id', projectId)
      .eq('session_id', sessionId);

  if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(items);
}

export async function POST(
    request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
  ) {
    const { projectId } = await params;
    const supabase = await createClient();
    const body = await request.json();
    const { session_id, product_id, quantity, variant } = body;

  if (!session_id || !product_id) {
        return NextResponse.json({ error: 'Session ID and product ID required' }, { status: 400 });
  }

  const { data: existing } = await supabase
      .from('cart_items')
      .select('id, quantity')
      .eq('project_id', projectId)
      .eq('session_id', session_id)
      .eq('product_id', product_id)
      .maybeSingle();

  if (existing) {
        const { data: item, error } = await supabase
          .from('cart_items')
          .update({ quantity: existing.quantity + (quantity || 1) })
          .eq('id', existing.id)
          .select('*, products(name, price, images)')
          .single();

      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
        return NextResponse.json(item);
  }

  const { data: item, error } = await supabase
      .from('cart_items')
      .insert({
              project_id: projectId,
              session_id,
              product_id,
              quantity: quantity || 1,
              variant: variant || null,
      })
      .select('*, products(name, price, images)')
      .single();

  if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(item, { status: 201 });
}

export async function DELETE(
    request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
  ) {
    const { projectId } = await params;
      const supabase = await createClient();
    const url = new URL(request.url);
    const itemId = url.searchParams.get('item_id');
    const sessionId = url.searchParams.get('session_id');

  if (!itemId || !sessionId) {
        return NextResponse.json({ error: 'Item ID and session ID required' }, { status: 400 });
  }

  const { error } = await supabase
      .from('cart_items')
      .delete()
      .eq('id', itemId)
      .eq('project_id', projectId)
      .eq('session_id', sessionId);

  if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
