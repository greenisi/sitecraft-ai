import type { SupabaseClient } from '@supabase/supabase-js';

/**
 * Resolves where a project's lead and booking alerts should be sent.
 *
 * Alerts previously went to whatever address the account was signed up with,
 * read straight from auth.users. That is often the owner's personal inbox
 * rather than the one the business actually watches, and there was no way to
 * change it -- the intake never asked, so nothing was ever stored.
 *
 * business_info.email is the owner's stated contact address for the business,
 * so it wins when present. The account email stays as the fallback, which
 * keeps every existing project working exactly as it does today.
 */
export async function resolveLeadRecipient(
  supabase: SupabaseClient,
  projectId: string,
  ownerUserId: string
): Promise<{ email: string; source: 'business_info' | 'account' | 'none' }> {
  try {
    const { data: info } = await supabase
      .from('business_info')
      .select('email')
      .eq('project_id', projectId)
      .maybeSingle();

    const stated = (info?.email || '').trim();
    // A stored value that is not a usable address must not silently swallow
    // every lead -- fall through to the account email instead.
    if (stated && /^[^@\s]+@[^@\s.]+\.[^@\s]+$/.test(stated)) {
      return { email: stated, source: 'business_info' };
    }
  } catch {
    // Never let recipient lookup break lead capture.
  }

  try {
    const { data: ownerUser } = await supabase.auth.admin.getUserById(ownerUserId);
    const accountEmail = ownerUser?.user?.email || '';
    if (accountEmail) return { email: accountEmail, source: 'account' };
  } catch {
    // Fall through.
  }

  return { email: '', source: 'none' };
}
