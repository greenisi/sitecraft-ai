import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(
    request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
  ) {
    const { projectId } = await params;
    const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
          return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

  const { data: project } = await supabase
      .from('projects')
      .select('*')
      .eq('id', projectId)
      .eq('user_id', user.id)
      .single();

  if (!project) {
        return NextResponse.json({ error: 'Project not found' }, { status: 404 });
  }

  const { error: updateError } = await supabase
      .from('projects')
      .update({ status: 'generating', updated_at: new Date().toISOString() })
      .eq('id', projectId);

  if (updateError) {
        return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://app.innovated.marketing';
    try {
          const genResponse = await fetch(baseUrl + '/api/projects/' + projectId + '/generate', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json', 'Cookie': request.headers.get('cookie') || '' },
          });

      if (!genResponse.ok) {
              const errData = await genResponse.json().catch(() => ({}));
              return NextResponse.json({ error: errData.error || 'Generation failed' }, { status: genResponse.status });
      }

      const result = await genResponse.json();
          return NextResponse.json({ success: true, ...result });
    } catch (err) {
          return NextResponse.json({ error: 'Failed to trigger regeneration' }, { status: 500 });
    }
}
