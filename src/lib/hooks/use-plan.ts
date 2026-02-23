'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useUser } from './use-user';

interface PlanInfo {
  plan: string;
  credits: number;
  isPaid: boolean;
}

export function usePlan(): PlanInfo & { loading: boolean } {
  const { user, loading: userLoading } = useUser();
  const [plan, setPlan] = useState('free');
  const [credits, setCredits] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (userLoading) return;
    if (!user) {
      setLoading(false);
      return;
    }

    const supabase = createClient();
    supabase
      .from('profiles')
      .select('plan, generation_credits')
      .eq('id', user.id)
      .single()
      .then(({ data }) => {
        if (data) {
          setPlan(data.plan || 'free');
          setCredits(data.generation_credits || 0);
        }
        setLoading(false);
      });
  }, [user, userLoading]);

  return {
    plan,
    credits,
    isPaid: plan !== 'free',
    loading,
  };
    }
