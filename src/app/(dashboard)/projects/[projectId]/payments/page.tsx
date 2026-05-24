export const dynamic = 'force-dynamic';

import { redirect } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { StripeConnectCard } from '@/components/payments/stripe-connect-card';
import { ArrowLeft } from 'lucide-react';

export default async function PaymentsPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: project } = await supabase
    .from('projects')
    .select('id, user_id, name')
    .eq('id', projectId)
    .single();
  if (!project || project.user_id !== user.id) redirect('/dashboard');

  return (
    <div className="max-w-3xl mx-auto px-6 py-10 space-y-6">
      <div>
        <Link
          href={`/projects/${projectId}/workspace`}
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-3"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Back to {project.name}
        </Link>
        <h1 className="text-2xl font-semibold">Payments</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Connect Stripe so customers can pay you on your generated site.
        </p>
      </div>

      <StripeConnectCard projectId={projectId} />
    </div>
  );
}
