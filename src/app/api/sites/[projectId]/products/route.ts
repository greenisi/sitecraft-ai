import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(
    request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
  ) {
    const { projectId } = await params;
    const supabase = await createClient();

  const url = new URL(request.url);
    const category = url.searchParams.get('category');

  let query = supabase
      .from('products')
      .select('id, name, description, price, compare_at_price, images, category, sku, inventory_count, variants, is_active, sort_order')
      .eq('project_id', projectId)
      .eq('is_active', true)
      .order('sort_order', { ascending: true });

  if (category) {
        query = query.eq('category', category);
  }

  const { data: products, error } = await query;

  if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(products);
}
