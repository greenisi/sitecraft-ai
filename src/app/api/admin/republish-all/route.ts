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
  // Fail closed: no env secret = no access. The previous literal fallback
  // 'republish-all-2026' was a footgun — anyone with the URL could mass-rebuild
  // every published site, which means propagating any current publish-code bug
  // to every customer in one call.
  const validSecret = process.env.ADMIN_SECRET || process.env.CRON_SECRET;
  if (!validSecret) {
    return NextResponse.json(
      { error: 'Admin secret not configured on server' },
      { status: 503 }
    );
  }

  const adminSecret = request.headers.get('x-admin-secret');
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

  const results: Array<{
    id: string;
    name: string;
    status: 'published' | 'deploying' | 'failed';
    url?: string;
    error?: string;
  }> = [];

  for (const project of projects) {
        try {
                const result = await publishToSubdomain(project.id, project.user_id);
                if (result.status === 'published') {
                          results.push({
                                    id: project.id,
                                    name: project.name,
                                    status: 'published',
                                    url: result.url,
                          });
                } else {
                          results.push({
                                    id: project.id,
                                    name: project.name,
                                    status: 'deploying',
                          });
                }
        } catch (err) {
                results.push({
                          id: project.id,
                          name: project.name,
                          status: 'failed',
                          error: (err as Error).message,
                });
        }
  }

  const succeeded = results.filter((r) => r.status === 'published').length;
    const deploying = results.filter((r) => r.status === 'deploying').length;
    const failed = results.filter((r) => r.status === 'failed').length;

  return NextResponse.json({
        message: `Re-published ${succeeded}/${projects.length} projects (${deploying} still deploying, ${failed} failed)`,
        results,
  });
}
