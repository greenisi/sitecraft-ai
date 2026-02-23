import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function POST(
    request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
  ) {
    const { projectId } = await params;

  // CORS headers for cross-origin requests from published sites
  const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
  };

  try {
        const body = await request.json();
        const {
                name,
                email,
                phone,
                message,
                service_needed,
                preferred_date,
                form_type = 'contact',
                source_page,
                ...extraFields
        } = body;

      // Basic validation
      if (!name && !email && !phone) {
              return NextResponse.json(
                { error: 'At least one of name, email, or phone is required' },
                { status: 400, headers }
                      );
      }

      // Use service role to bypass RLS for inserts
      const supabase = createClient(supabaseUrl, supabaseServiceKey);

      // Verify project exists
      const { data: project } = await supabase
          .from('projects')
          .select('id')
          .eq('id', projectId)
          .single();

      if (!project) {
              return NextResponse.json(
                { error: 'Invalid project' },
                { status: 404, headers }
                      );
      }

      // Get IP for spam tracking
      const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';

      // Insert submission
      const { data: submission, error } = await supabase
          .from('form_submissions')
          .insert({
                    project_id: projectId,
                    form_type,
                    name: name || null,
                    email: email || null,
                    phone: phone || null,
                    message: message || null,
                    service_needed: service_needed || null,
                    preferred_date: preferred_date || null,
                    form_data: Object.keys(extraFields).length > 0 ? extraFields : {},
                    source_page: source_page || null,
                    ip_address: ip,
                    status: 'new',
          })
          .select('id, created_at')
          .single();

      if (error) {
              console.error('Form submission error:', error);
              return NextResponse.json(
                { error: 'Failed to submit form' },
                { status: 500, headers }
                      );
      }

      return NextResponse.json(
        {
                  success: true,
                  message: 'Form submitted successfully',
                  id: submission.id,
                  timestamp: submission.created_at,
        },
        { status: 201, headers }
            );
  } catch (err) {
        console.error('Form submission error:', err);
        return NextResponse.json(
          { error: 'Internal server error' },
          { status: 500, headers }
              );
  }
}

export async function OPTIONS() {
    return new NextResponse(null, {
          status: 204,
          headers: {
                  'Access-Control-Allow-Origin': '*',
                  'Access-Control-Allow-Methods': 'POST, OPTIONS',
                  'Access-Control-Allow-Headers': 'Content-Type',
          },
    });
}
