import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { AffiliateClient } from './affiliate-client';

export default async function AffiliatePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  // Get or create affiliate record
  let { data: affiliate } = await supabase
    .from('affiliates')
    .select('*')
    .eq('user_id', user.id)
    .single();

  if (!affiliate) {
    // Auto-create affiliate record for the user
    const code = user.id.substring(0, 8).toUpperCase();
    const { data: newAffiliate } = await supabase
      .from('affiliates')
      .insert({
        user_id: user.id,
        affiliate_code: code,
        referral_link: `https://app.innovated.marketing/signup?ref=${code}`,
      })
      .select()
      .single();
    affiliate = newAffiliate;
  }

  // Get referrals
  const { data: referrals } = await supabase
    .from('referrals')
    .select('*')
    .eq('affiliate_id', affiliate?.id)
    .order('created_at', { ascending: false })
    .limit(100);

  // Get user profile for plan info
  const { data: profile } = await supabase
    .from('profiles')
    .select('plan, generation_credits')
    .eq('id', user.id)
    .single();

  return (
    <AffiliateClient
      affiliate={affiliate}
      referrals={referrals || []}
      userPlan={profile?.plan || 'free'}
    />
  );
}
