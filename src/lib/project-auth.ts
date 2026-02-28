import { createRouteHandlerClient as createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function requireProjectOwner(projectId: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
        return {
                error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }),
                user: null,
                supabase: null,
                project: null,
        };
  }

  const { data: project } = await supabase
      .from('projects')
      .select('id, user_id, name, slug, business_type, status')
      .eq('id', projectId)
      .eq('user_id', user.id)
      .single();

  if (!project) {
        return {
                error: NextResponse.json({ error: 'Project not found' }, { status: 404 }),
                user: null,
                supabase: null,
                project: null,
        };
  }

  return { error: null, user, supabase, project };
}
