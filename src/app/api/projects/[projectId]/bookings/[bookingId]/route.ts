import { NextRequest, NextResponse } from 'next/server';
import { after } from 'next/server';
import { requireProjectOwner } from '@/lib/project-auth';
import { createAdminClient } from '@/lib/supabase/admin';
import { sendBookingDecision } from '@/lib/email/send';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string; bookingId: string }> }
) {
  try {
    const { projectId, bookingId } = await params;
    const { error, supabase } = await requireProjectOwner(projectId);
    if (error) return error;

    const body = await request.json();
    const { status } = body;

    const { data: booking, error: updateError } = await supabase!
      .from('bookings')
      .update({ status })
      .eq('id', bookingId)
      .eq('project_id', projectId)
      .select()
      .single();

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    // Confirming or cancelling from the dashboard emails the customer too,
    // same as the one-click links in the alert email.
    if ((status === 'confirmed' || status === 'cancelled') && booking?.customer_email) {
      after(async () => {
        try {
          const admin = createAdminClient();
          const [{ data: proj }, { data: businessInfo }] = await Promise.all([
            admin.from('projects').select('name, user_id').eq('id', projectId).single(),
            admin.from('business_info').select('phone').eq('project_id', projectId).maybeSingle(),
          ]);
          const { data: ownerUser } = proj?.user_id
            ? await admin.auth.admin.getUserById(proj.user_id)
            : { data: null };
          const result = await sendBookingDecision({
            to: booking.customer_email,
            businessName: proj?.name || 'the business',
            customerName: booking.customer_name,
            decision: status,
            bookingDate: booking.booking_date,
            bookingTime: booking.booking_time,
            serviceType: booking.service_type,
            phone: (businessInfo as { phone?: string } | null)?.phone || null,
            ownerEmail: ownerUser?.user?.email || null,
          });
          if (!result.ok) console.error('Booking decision email failed:', result.error);
        } catch (err) {
          console.error('Booking decision email error:', err);
        }
      });
    }

    return NextResponse.json({ booking });
  } catch {
    return NextResponse.json({ error: 'Failed to update booking' }, { status: 500 });
  }
}
