import type { SupabaseClient } from '@supabase/supabase-js';

/**
 * Which projects' customer data a dashboard should show.
 *
 * A project is normally its own island: `data_group_id` defaults to the
 * project's own id, so this returns just that project and every dashboard
 * behaves exactly as it did before groups existed.
 *
 * When an owner has opted a project into an existing group, this returns every
 * project in it, so leads, bookings and orders pool across their sites.
 *
 * The owner check is not decorative. Group membership is a plain uuid column,
 * so without filtering by user_id a bad or guessed value could pull another
 * account's customers into view. Reads are always scoped to the caller.
 */
export async function getSharedProjectIds(
  supabase: SupabaseClient,
  projectId: string,
  ownerUserId: string
): Promise<string[]> {
  try {
    const { data: project } = await supabase
      .from('projects')
      .select('data_group_id, user_id')
      .eq('id', projectId)
      .maybeSingle();

    const groupId = (project as { data_group_id?: string } | null)?.data_group_id;
    const owner = (project as { user_id?: string } | null)?.user_id;

    // No group yet (migration not applied, or a legacy row) — behave as before.
    if (!groupId || !owner || owner !== ownerUserId) return [projectId];

    const { data: siblings } = await supabase
      .from('projects')
      .select('id')
      .eq('data_group_id', groupId)
      .eq('user_id', ownerUserId);

    const ids = (siblings || []).map((row) => (row as { id: string }).id).filter(Boolean);
    return ids.length > 0 ? ids : [projectId];
  } catch {
    // A failed lookup must narrow, never widen: showing too little is a bug,
    // showing another account's customers is a breach.
    return [projectId];
  }
}

/** True when this project pools its customer data with at least one other. */
export async function isSharingData(
  supabase: SupabaseClient,
  projectId: string,
  ownerUserId: string
): Promise<boolean> {
  const ids = await getSharedProjectIds(supabase, projectId, ownerUserId);
  return ids.length > 1;
}
