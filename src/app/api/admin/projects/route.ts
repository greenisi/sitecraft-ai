import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin';

export async function GET() {
    const { error, supabase } = await requireAdmin();
    if (error) return error;

  const { data: projects, error: dbError } = await supabase!
      .from('projects')
      .select('id, user_id, name, slug, site_type, status, thumbnail_url, published_url, created_at, updated_at, last_generated_at')
      .order('created_at', { ascending: false });

  if (dbError) {
        return NextResponse.json({ error: dbError.message }, { status: 500 });
  }

  const userIds = [...new Set(projects?.map(p => p.user_id) || [])];
    const { data: profiles } = await supabase!
      .from('profiles')
      .select('id, display_name')
      .in('id', userIds);

  const profileMap = new Map(profiles?.map(p => [p.id, p.display_name]) || []);

  const enrichedProjects = projects?.map(p => ({
        ...p,
        user_display_name: profileMap.get(p.user_id) || 'Unknown',
  }));

  return NextResponse.json({ projects: enrichedProjects });
}
