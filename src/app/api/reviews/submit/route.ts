import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

// Accepts a review from the hosted /r/[bookingId] page. The booking's manage
// token is the credential and is cleared on use — one review per booking.
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const bookingId = body.booking_id as string;
    const token = body.token as string;
    const rating = Number(body.rating);
    const reviewText = (body.review_text || '').trim() || null;

    if (!bookingId || !token || !Number.isInteger(rating) || rating < 1 || rating > 5) {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
    }

    const sb = createAdminClient();
    const { data: booking } = await sb
      .from('bookings')
      .select('id, project_id, customer_name, customer_email, manage_token, status')
      .eq('id', bookingId)
      .single();

    if (!booking || !booking.manage_token || booking.manage_token !== token) {
      return NextResponse.json({ error: 'This review link is no longer valid' }, { status: 403 });
    }

    const { error: insertError } = await sb.from('reviews').insert({
      project_id: booking.project_id,
      customer_name: booking.customer_name,
      customer_email: booking.customer_email,
      rating,
      review_text: reviewText,
      is_approved: false, // owner approves from the dashboard before it shows on the site
    });
    if (insertError) {
      console.error('Review insert error:', insertError);
      return NextResponse.json({ error: 'Could not save your review' }, { status: 500 });
    }

    // Single use: clearing the token also invalidates the emailed link.
    await sb.from('bookings').update({ manage_token: null }).eq('id', bookingId);

    // Let the owner know — the cron sweep delivers it.
    await sb.from('notifications').insert({
      project_id: booking.project_id,
      type: 'new_review',
      recipient_email: '',
      subject: `New ${rating}-star review from ${booking.customer_name}`,
      body: `${'★'.repeat(rating)}${'☆'.repeat(5 - rating)}\n\n${reviewText || '(no written review)'}\n\nApprove it from your dashboard to show it on your site.`,
      status: 'pending',
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Review submit error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
