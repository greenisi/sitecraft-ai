import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { publishToSubdomain } from '@/lib/export/platform-publisher';

export const dynamic = 'force-dynamic';
export const maxDuration = 300;

/**
 * Admin endpoint to re-publish ALL published projects.
 * This applies the latest publisher fixes (overflow CSS, etc.) to every site.
 *
 * POST /api/admin/republish-all
 * Header: x-admin-secret: <ADMIN_SECRET or CRON_SECRET>
 */
export async function POST(request: Request) {
    const adminSecret = request.headers.get('x-admin-secret');
    const validSecret =
          process.env.ADMIN_SECRET || process.env.CRON_SECRET || 'republish-all-2026';

  if (adminSecret !== validSecret) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const admin = createAdminClient();

  // Get all published projects
  const { data: projects, error } = await admin
      .from('projects')
      .select('id, name, slug, user_id, status, published_url')
      .eq('status', 'published')
      .not('published_url', 'is', null);

  if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!projects || projects.length === 0) {
        return NextResponse.json({ message: 'No published projects found', count: 0 });
  }

  const results: Array<{ id: string; name: string; success: boolean; url?: string; error?: string }> = [];

  for (const project of projects) {
        try {
                const result = await publishToSubdomain(project.id, project.user_id);
                results.push({
                          id: project.id,
                          name: project.name,
                          success: true,
                          url: result.url,
                });
        } catch (err) {
                results.push({
                          id: project.id,
                          name: project.name,
                          success: false,
                          error: (err as Error).message,
                });
        }
  }

  const succeeded = results.filter((r) => r.success).length;
    const failed = results.filter((r) => !r.success).length;

  return NextResponse.json({
        message: `Re-published ${succeeded}/${projects.length} projects (${failed} failed)`,
        results,
  });
}
