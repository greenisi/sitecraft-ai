import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(
    request: NextRequest,
  { params }: { params: Promise<{ projectId: string; productId: string }> }
  ) {
    const { projectId, productId } = await params;
    const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
          return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

  const { data: product, error } = await supabase
      .from('products')
      .select('*')
      .eq('id', productId)
      .eq('project_id', projectId)
      .single();

  if (error || !product) {
        return NextResponse.json({ error: 'Product not found' }, { status: 404 });
  }

  return NextResponse.json(product);
}

export async function PUT(
    request: NextRequest,
  { params }: { params: Promise<{ projectId: string; productId: string }> }
  ) {
    const { projectId, productId } = await params;
    const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
          return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

  const body = await request.json();
    const { name, description, price, compare_at_price, images, category, sku, inventory_count, variants, is_active, sort_order } = body;

  const updates: Record<string, unknown> = {};
    if (name !== undefined) updates.name = name;
    if (description !== undefined) updates.description = description;
    if (price !== undefined) updates.price = price;
    if (compare_at_price !== undefined) updates.compare_at_price = compare_at_price;
    if (images !== undefined) updates.images = images;
    if (category !== undefined) updates.category = category;
    if (sku !== undefined) updates.sku = sku;
    if (inventory_count !== undefined) updates.inventory_count = inventory_count;
    if (variants !== undefined) updates.variants = variants;
    if (is_active !== undefined) updates.is_active = is_active;
    if (sort_order !== undefined) updates.sort_order = sort_order;

  const { data: product, error } = await supabase
      .from('products')
      .update(updates)
      .eq('id', productId)
      .eq('project_id', projectId)
      .select()
      .single();

  if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(product);
}

export async function DELETE(
    request: NextRequest,
  { params }: { params: Promise<{ projectId: string; productId: string }> }
  ) {
    const { projectId, productId } = await params;
    const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
          return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

  const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', productId)
      .eq('project_id', projectId);

  if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
