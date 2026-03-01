import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient as createClient } from '@/lib/supabase/server';

const TIME_SLOTS = ['09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00'];

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const { projectId } = await params;
    const supabase = await createClient();
    const url = new URL(request.url);
    const date = url.searchParams.get('date');

    if (!date) {
      return NextResponse.json({ error: 'Date parameter is required' }, { status: 400 });
    }

    const { data: bookings } = await supabase
      .from('bookings')
      .select('booking_time')
      .eq('project_id', projectId)
      .eq('booking_date', date)
      .in('status', ['pending', 'confirmed']);

    const bookedTimes = new Set(bookings?.map((b) => b.booking_time) || []);
    const availableSlots = TIME_SLOTS.filter((slot) => !bookedTimes.has(slot));

    return NextResponse.json({ date, available_slots: availableSlots });
  } catch {
    return NextResponse.json({ error: 'Failed to fetch availability' }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const { projectId } = await params;
    const supabase = await createClient();

    const { data: project } = await supabase
      .from('projects')
      .select('id, user_id')
      .eq('id', projectId)
      .single();

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    const body = await request.json();
    const { service_id, customer_name, customer_email, customer_phone, booking_date, booking_time, notes } = body;

    if (!customer_name || !customer_email || !booking_date || !booking_time) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    if (!TIME_SLOTS.includes(booking_time)) {
      return NextResponse.json({ error: 'Invalid time slot' }, { status: 400 });
    }

    const { data: existing } = await supabase
      .from('bookings')
      .select('id')
      .eq('project_id', projectId)
      .eq('booking_date', booking_date)
      .eq('booking_time', booking_time)
      .in('status', ['pending', 'confirmed'])
      .single();

    if (existing) {
      return NextResponse.json({ error: 'Time slot is no longer available' }, { status: 409 });
    }

    const { data: booking, error: insertError } = await supabase
      .from('bookings')
      .insert({
        project_id: projectId,
        service_id: service_id || null,
        customer_name,
        customer_email,
        customer_phone: customer_phone || null,
        booking_date,
        booking_time,
        notes: notes || null,
        status: 'pending',
      })
      .select()
      .single();

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    await supabase.from('notifications').insert({
      project_id: projectId,
      type: 'new_booking',
      recipient_email: customer_email,
      subject: `New booking from ${customer_name}`,
      body: `Date: ${booking_date}\nTime: ${booking_time}\nEmail: ${customer_email}\nPhone: ${customer_phone || 'N/A'}\nNotes: ${notes || 'N/A'}`,
      status: 'pending',
    });

    return NextResponse.json({ success: true, booking }, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Failed to create booking' }, { status: 500 });
  }
}
