import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { isHoneypotTripped, checkSubmissionRate } from '@/lib/spam-guard';

/**
 * Reviews for a published site.
 *
 * Published sites live on their own origin (slug.innovated.site) and call back
 * here, so this needs CORS and a preflight the same way bookings and
 * submit-form do -- without them every request from a real generated site
 * fails before it reaches any of the logic below. It also needs its own
 * service-role client rather than the cookie-scoped one: a visitor on another
 * origin sends no cookies, so the previous client was only ever working by
 * falling through to the anon role.
 *
 * The endpoint is deliberately narrow in what it will return and write:
 *   GET  -> approved reviews only, featured first
 *   POST -> always unapproved, so nothing reaches a site without the owner
 *           saying so
 */

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

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

    const { data: reviews, error: fetchError } = await supabase
      .from('reviews')
      .select('id, customer_name, rating, review_text, is_featured, created_at')
      .eq('project_id', projectId)
      .eq('is_approved', true)
      .order('is_featured', { ascending: false })
      .order('created_at', { ascending: false });

    if (fetchError) {
      return NextResponse.json({ error: fetchError.message }, { status: 500, headers: CORS_HEADERS });
    }

    return NextResponse.json({ reviews: reviews || [] }, { headers: CORS_HEADERS });
  } catch {
    return NextResponse.json(
      { error: 'Failed to fetch reviews' },
      { status: 500, headers: CORS_HEADERS }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const { projectId } = await params;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { data: project } = await supabase
      .from('projects')
      .select('id')
      .eq('id', projectId)
      .single();

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404, headers: CORS_HEADERS });
    }

    const body = await request.json();

    // Caught bots get a success response: telling them they were spotted just
    // teaches them which field to leave alone next time.
    if (isHoneypotTripped(body)) {
      return NextResponse.json({ success: true }, { status: 201, headers: CORS_HEADERS });
    }

    const clientIp = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
    const rate = await checkSubmissionRate(supabase, 'reviews', projectId, clientIp);
    if (!rate.allowed) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        { status: 429, headers: CORS_HEADERS }
      );
    }

    const { customer_name, customer_email, rating, review_text } = body;
    const numericRating = Number(rating);

    if (!customer_name || !numericRating || numericRating < 1 || numericRating > 5) {
      return NextResponse.json(
        { error: 'Name and valid rating (1-5) are required' },
        { status: 400, headers: CORS_HEADERS }
      );
    }

    const { data: review, error: insertError } = await supabase
      .from('reviews')
      .insert({
        project_id: projectId,
        customer_name,
        customer_email: customer_email || null,
        rating: Math.round(numericRating),
        review_text: review_text || null,
        is_approved: false,
        is_featured: false,
        ip_address: clientIp,
      })
      .select()
      .single();

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500, headers: CORS_HEADERS });
    }

    return NextResponse.json({ success: true, review }, { status: 201, headers: CORS_HEADERS });
  } catch {
    return NextResponse.json(
      { error: 'Failed to submit review' },
      { status: 500, headers: CORS_HEADERS }
    );
  }
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}
