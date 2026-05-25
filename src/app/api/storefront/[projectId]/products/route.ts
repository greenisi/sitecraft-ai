import { createAdminClient } from '@/lib/supabase/admin';
import { corsPreflight, withCors } from '@/lib/utils/cors';

/**
 * GET /api/storefront/[projectId]/products
 *
 * Public + CORS-enabled. Called by the merchant's generated site from its
 * own origin. Returns active products only.
 */

export async function OPTIONS() {
  return corsPreflight();
}

export async function GET(_req: Request, { params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await params;
  const admin = createAdminClient();
  const { data, error } = await admin
    .from('products')
    .select('id, name, description, price, compare_at_price, images, category, sku, inventory_count, variants, sort_order')
    .eq('project_id', projectId)
    .eq('is_active', true)
    .order('sort_order', { ascending: true });
  if (error) return withCors({ error: error.message }, { status: 500 });
  return withCors({ products: data ?? [] });
}
