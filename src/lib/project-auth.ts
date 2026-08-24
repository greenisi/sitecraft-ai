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

  // generation_config, accepted_capabilities and follow_up_answers are read
  // by callers off the returned project. They were missing from this list,
  // and because a Supabase select returns whatever it selected rather than
  // erroring on an unread field, every one of those reads quietly saw
  // undefined: suggestions always came back empty, accepting a capability
  // overwrote the previously accepted ones with a fresh single-item array,
  // and the per-trade copy fell through to its generic branch every time.
  const { data: project } = await supabase
      .from('projects')
      .select(
        'id, user_id, name, slug, business_type, status, generation_config, accepted_capabilities, follow_up_answers'
      )
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
