import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(
    request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
  ) {
    const { projectId } = await params;
    const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
          return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

  const { data: project } = await supabase
      .from('projects')
      .select('id')
      .eq('id', projectId)
      .eq('user_id', user.id)
            .single();

  if (!project) {
        return NextResponse.json({ error: 'Project not found' }, { status: 404 });
  }

  const { data: products, error } = await supabase
      .from('products')
      .select('*')
      .eq('project_id', projectId)
      .order('sort_order', { ascending: true });

  if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(products);
}

export async function POST(
    request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
  ) {
    const { projectId } = await params;
    const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
          return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

  const { data: project } = await supabase
      .from('projects')
      .select('id')
      .eq('id', projectId)
      .eq('user_id', user.id)
      .single();

  if (!project) {
        return NextResponse.json({ error: 'Project not found' }, { status: 404 });
  }

  const body = await request.json();
    const { name, description, price, compare_at_price, images, category, sku, inventory_count, variants, is_active } = body;

  if (!name || price === undefined) {
        return NextResponse.json({ error: 'Name and price are required' }, { status: 400 });
  }

  const { count } = await supabase
      .from('products')
      .select('*', { count: 'exact', head: true })
      .eq('project_id', projectId);

  const { data: product, error } = await supabase
      .from('products')
      .insert({
              project_id: projectId,
              name,
              description: description || null,
              price,
              compare_at_price: compare_at_price || null,
              images: images || [],
              category: category || null,
              sku: sku || null,
              inventory_count: inventory_count ?? 0,
              variants: variants || [],
              is_active: is_active ?? true,
              sort_order: (count || 0),
      })
      .select()
      .single();

  if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(product, { status: 201 });
}
