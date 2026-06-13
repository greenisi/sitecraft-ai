import { createAdminClient } from '@/lib/supabase/admin';
import { ReviewForm } from './review-form';

// Hosted review page, linked from the post-completion review-request email.
// No login — the booking's manage token is the credential.
export default async function ReviewPage({
  params,
  searchParams,
}: {
  params: Promise<{ bookingId: string }>;
  searchParams: Promise<{ token?: string }>;
}) {
  const { bookingId } = await params;
  const { token } = await searchParams;

  const sb = createAdminClient();
  const { data: booking } = await sb
    .from('bookings')
    .select('id, project_id, customer_name, service_type, manage_token')
    .eq('id', bookingId)
    .single();

  const valid = booking && token && booking.manage_token && booking.manage_token === token;
  const { data: project } = valid
    ? await sb.from('projects').select('name').eq('id', booking.project_id).single()
    : { data: null };

  if (!valid || !project) {
    return (
      <main className="min-h-screen bg-gray-950 flex items-center justify-center p-6">
        <div className="max-w-md text-center">
          <h1 className="text-2xl font-bold text-white mb-3">This link has expired</h1>
          <p className="text-gray-400">This review link is no longer valid — it may have already been used.</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-950 flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <h1 className="text-2xl font-bold text-white mb-2">
          How was your experience with {project.name}?
        </h1>
        <p className="text-gray-400 mb-8">
          {booking.customer_name ? `Thanks again, ${booking.customer_name.split(' ')[0]}` : 'Thanks again'}
          {booking.service_type ? ` — we hope the ${booking.service_type.toLowerCase()} went great.` : '.'}
        </p>
        <ReviewForm bookingId={bookingId} token={token!} />
      </div>
    </main>
  );
}
