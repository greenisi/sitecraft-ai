import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient as createClient } from '@/lib/supabase/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const { projectId } = await params;
    const supabase = await createClient();

    const { data: reviews, error: fetchError } = await supabase
      .from('reviews')
      .select('id, customer_name, rating, review_text, is_featured, created_at')
      .eq('project_id', projectId)
      .eq('is_approved', true)
      .order('is_featured', { ascending: false })
      .order('created_at', { ascending: false });

    if (fetchError) {
      return NextResponse.json({ error: fetchError.message }, { status: 500 });
    }

    return NextResponse.json({ reviews: reviews || [] });
  } catch {
    return NextResponse.json({ error: 'Failed to fetch reviews' }, { status: 500 });
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
      .select('id')
      .eq('id', projectId)
      .single();

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    const body = await request.json();
    const { customer_name, customer_email, rating, review_text } = body;

    if (!customer_name || !rating || rating < 1 || rating > 5) {
      return NextResponse.json({ error: 'Name and valid rating (1-5) are required' }, { status: 400 });
    }

    const { data: review, error: insertError } = await supabase
      .from('reviews')
      .insert({
        project_id: projectId,
        customer_name,
        customer_email: customer_email || null,
        rating,
        review_text: review_text || null,
        is_approved: false,
        is_featured: false,
      })
      .select()
      .single();

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, review }, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Failed to submit review' }, { status: 500 });
  }
}
