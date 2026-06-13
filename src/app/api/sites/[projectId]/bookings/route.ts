import { NextRequest, NextResponse } from 'next/server';
import { after } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { randomBytes } from 'crypto';
import { sendLeadAcknowledgment, sendLeadAlert } from '@/lib/email/send';
import { isHoneypotTripped, checkSubmissionRate } from '@/lib/spam-guard';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const TIME_SLOTS = ['09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00'];

// Published sites call this cross-origin.
const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const { projectId } = await params;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const url = new URL(request.url);
    const date = url.searchParams.get('date');

    if (!date) {
      return NextResponse.json({ error: 'Date parameter is required' }, { status: 400, headers: CORS_HEADERS });
    }

    const { data: bookings } = await supabase
      .from('bookings')
      .select('booking_time')
      .eq('project_id', projectId)
      .eq('booking_date', date)
      .in('status', ['pending', 'confirmed']);

    const bookedTimes = new Set(bookings?.map((b) => b.booking_time) || []);
    const availableSlots = TIME_SLOTS.filter((slot) => !bookedTimes.has(slot));

    return NextResponse.json({ date, available_slots: availableSlots }, { headers: CORS_HEADERS });
  } catch {
    return NextResponse.json({ error: 'Failed to fetch availability' }, { status: 500, headers: CORS_HEADERS });
  }
}

// Booking submission from a published site. FormAutoWire posts here when a
// form has a date field, so field names vary — accept both the FormAutoWire
// names (name/email/preferred_date) and the structured booking-widget names
// (customer_name/booking_date/...). Creates the booking as 'pending', then
// post-response: acknowledges the visitor and alerts the owner with one-click
// confirm/decline links.
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const { projectId } = await params;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { data: project } = await supabase
      .from('projects')
      .select('id, user_id, name')
      .eq('id', projectId)
      .single();

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404, headers: CORS_HEADERS });
    }

    const body = await request.json();
    const customerName = (body.customer_name || body.name || '').trim();
    const customerEmail = (body.customer_email || body.email || '').trim();
    const customerPhone = (body.customer_phone || body.phone || '').trim() || null;
    const bookingDate = (body.booking_date || body.preferred_date || body.date || '').trim();
    const bookingTime = (body.booking_time || body.preferred_time || body.time || '').trim() || 'flexible';
    const serviceType = (body.service_type || body.service_needed || body.service || '').trim() || null;
    const notes = (body.notes || body.message || '').trim() || null;
    const sourcePage = body.source_page || null;

    if (isHoneypotTripped(body)) {
      return NextResponse.json(
        { success: true, message: 'Booking request received' },
        { status: 201, headers: CORS_HEADERS }
      );
    }

    if (!customerName || !customerEmail) {
      return NextResponse.json({ error: 'Name and email are required' }, { status: 400, headers: CORS_HEADERS });
    }

    const clientIp = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
    const rate = await checkSubmissionRate(supabase, 'bookings', projectId, clientIp);
    if (!rate.allowed) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        { status: 429, headers: CORS_HEADERS }
      );
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(bookingDate) || isNaN(new Date(bookingDate + 'T00:00:00').getTime())) {
      return NextResponse.json({ error: 'A valid date (YYYY-MM-DD) is required' }, { status: 400, headers: CORS_HEADERS });
    }

    // Only enforce slot conflicts for structured time slots — free-text or
    // 'flexible' times from generic forms can't double-book a slot.
    if (TIME_SLOTS.includes(bookingTime)) {
      const { data: existing } = await supabase
        .from('bookings')
        .select('id')
        .eq('project_id', projectId)
        .eq('booking_date', bookingDate)
        .eq('booking_time', bookingTime)
        .in('status', ['pending', 'confirmed'])
        .maybeSingle();

      if (existing) {
        return NextResponse.json({ error: 'Time slot is no longer available' }, { status: 409, headers: CORS_HEADERS });
      }
    }

    const manageToken = randomBytes(24).toString('hex');
    const { data: booking, error: insertError } = await supabase
      .from('bookings')
      .insert({
        project_id: projectId,
        service_id: body.service_id || null,
        customer_name: customerName,
        customer_email: customerEmail,
        customer_phone: customerPhone,
        booking_date: bookingDate,
        booking_time: bookingTime,
        service_type: serviceType,
        notes,
        status: 'pending',
        manage_token: manageToken,
        ip_address: clientIp,
      })
      .select('id, created_at')
      .single();

    if (insertError) {
      console.error('Booking insert error:', insertError);
      return NextResponse.json({ error: 'Failed to create booking' }, { status: 500, headers: CORS_HEADERS });
    }

    const bookingId = booking.id as string;
    after(async () => {
      try {
        const projectName = (project as { name?: string }).name || 'your website';
        const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://app.innovated.marketing';

        // Owner email lives in auth.users — profiles has no reliable email column.
        const { data: ownerUser } = await supabase.auth.admin.getUserById(project.user_id);
        const ownerEmail = ownerUser?.user?.email || '';
        const { data: businessInfo } = await supabase
          .from('business_info')
          .select('phone')
          .eq('project_id', projectId)
          .maybeSingle();

        // Acknowledge the visitor immediately.
        const ackResult = await sendLeadAcknowledgment({
          to: customerEmail,
          businessName: projectName,
          visitorName: customerName,
          formType: 'booking',
          phone: (businessInfo as { phone?: string } | null)?.phone || null,
          serviceNeeded: serviceType,
          preferredDate: `${bookingDate}${bookingTime !== 'flexible' ? ` at ${bookingTime}` : ''}`,
          ownerEmail: ownerEmail || null,
        });
        if (!ackResult.ok) console.error('Booking acknowledgment failed:', ackResult.error);

        // Owner alert — queue first so the cron sweep retries failed sends.
        const { data: notification } = await supabase
          .from('notifications')
          .insert({
            project_id: projectId,
            type: 'new_booking',
            recipient_email: ownerEmail,
            subject: `New booking request from ${customerName} — ${bookingDate}`,
            body: [
              `Name: ${customerName}`,
              `Email: ${customerEmail}`,
              customerPhone && `Phone: ${customerPhone}`,
              `Date: ${bookingDate} (${bookingTime})`,
              serviceType && `Service: ${serviceType}`,
              notes && `Notes: ${notes}`,
            ].filter(Boolean).join('\n'),
            status: 'pending',
          })
          .select('id')
          .single();

        if (ownerEmail) {
          const manageBase = `${appUrl}/api/bookings/manage?bid=${bookingId}&token=${manageToken}`;
          const result = await sendLeadAlert({
            to: ownerEmail,
            projectName,
            formType: 'booking',
            name: customerName,
            email: customerEmail,
            phone: customerPhone,
            message: notes,
            serviceNeeded: serviceType,
            preferredDate: `${bookingDate}${bookingTime !== 'flexible' ? ` at ${bookingTime}` : ''}`,
            sourcePage,
            leadsUrl: `${appUrl}/projects/${projectId}/admin/bookings`,
            bookingActions: {
              confirmUrl: `${manageBase}&action=confirm`,
              declineUrl: `${manageBase}&action=decline`,
            },
          });
          if (result.ok && notification) {
            await supabase
              .from('notifications')
              .update({ status: 'sent', sent_at: new Date().toISOString() })
              .eq('id', notification.id);
          } else if (!result.ok) {
            console.error('Booking alert failed (left pending for cron retry):', result.error);
          }
        }
      } catch (err) {
        console.error('Post-booking processing error:', err);
      }
    });

    return NextResponse.json(
      { success: true, message: 'Booking request received', id: bookingId, timestamp: booking.created_at },
      { status: 201, headers: CORS_HEADERS }
    );
  } catch (err) {
    console.error('Booking submission error:', err);
    return NextResponse.json({ error: 'Failed to create booking' }, { status: 500, headers: CORS_HEADERS });
  }
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}
