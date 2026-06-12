import { createAdminClient } from '@/lib/supabase/admin';
import { sendBookingDecision } from '@/lib/email/send';

// One-click confirm/decline links from the owner's booking-alert email.
// Auth is the single-use random token stored on the booking at creation.
export async function GET(request: Request) {
  const url = new URL(request.url);
  const bookingId = url.searchParams.get('bid');
  const token = url.searchParams.get('token');
  const action = url.searchParams.get('action');

  if (!bookingId || !token || !['confirm', 'decline'].includes(action || '')) {
    return htmlPage('Invalid link', 'This booking link is missing information.', 400);
  }

  const sb = createAdminClient();
  const { data: booking } = await sb
    .from('bookings')
    .select('id, project_id, customer_name, customer_email, booking_date, booking_time, service_type, status, manage_token')
    .eq('id', bookingId)
    .single();

  if (!booking) {
    return htmlPage('Not found', 'This booking no longer exists.', 404);
  }
  if (!booking.manage_token || booking.manage_token !== token) {
    return htmlPage('Invalid link', 'This booking link is not valid.', 403);
  }
  if (booking.status !== 'pending') {
    return htmlPage(
      'Already handled',
      `This booking was already ${booking.status}. Manage it from your dashboard if you need to change it.`,
      200
    );
  }

  // Matches the statuses the admin dashboard uses: pending/confirmed/cancelled/completed.
  const newStatus = action === 'confirm' ? 'confirmed' : 'cancelled';
  const { error: updateError } = await sb
    .from('bookings')
    .update({ status: newStatus })
    .eq('id', bookingId);
  if (updateError) {
    return htmlPage('Update failed', `Could not update the booking (${updateError.message}). Try from your dashboard.`, 500);
  }

  // Tell the customer, branded as the business.
  const { data: project } = await sb
    .from('projects')
    .select('name, user_id')
    .eq('id', booking.project_id)
    .single();
  const { data: ownerUser } = project?.user_id
    ? await sb.auth.admin.getUserById(project.user_id)
    : { data: null };
  const { data: businessInfo } = await sb
    .from('business_info')
    .select('phone')
    .eq('project_id', booking.project_id)
    .maybeSingle();

  const emailResult = await sendBookingDecision({
    to: booking.customer_email,
    businessName: project?.name || 'the business',
    customerName: booking.customer_name,
    decision: newStatus as 'confirmed' | 'cancelled',
    bookingDate: booking.booking_date,
    bookingTime: booking.booking_time,
    serviceType: booking.service_type,
    phone: (businessInfo as { phone?: string } | null)?.phone || null,
    ownerEmail: ownerUser?.user?.email || null,
  });

  const customerNote = emailResult.ok
    ? `${booking.customer_name} has been emailed the ${action === 'confirm' ? 'confirmation' : 'update'}.`
    : `Heads up: the email to ${booking.customer_name} failed to send — reach out to them directly.`;

  return htmlPage(
    action === 'confirm' ? 'Booking confirmed ✓' : 'Booking declined',
    `${booking.customer_name} — ${booking.booking_date}${booking.booking_time !== 'flexible' ? ` at ${booking.booking_time}` : ''}. ${customerNote}`,
    200
  );
}

function htmlPage(title: string, message: string, status: number) {
  const esc = (s: string) =>
    s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!));
  return new Response(
    `<!doctype html>
<html><head><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(title)}</title></head>
<body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#0a0a0f;color:#e5e5e5;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;padding:24px">
  <div style="max-width:420px;text-align:center">
    <h1 style="font-size:24px;margin:0 0 12px;color:#fff">${esc(title)}</h1>
    <p style="font-size:15px;line-height:1.6;color:#a3a3a3">${esc(message)}</p>
  </div>
</body></html>`,
    { status, headers: { 'Content-Type': 'text/html; charset=utf-8' } }
  );
}
