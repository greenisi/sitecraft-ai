import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: issues, error } = await supabase
      .from('issues')
      .select('*, projects(name)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return NextResponse.json({ issues });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { category, subject, description, project_id, screenshot_url } = body;

    if (!subject || !description) {
      return NextResponse.json(
        { error: 'Subject and description are required' },
        { status: 400 }
      );
    }

    const validCategories = ['bug', 'feature', 'billing', 'domain', 'generation', 'publishing', 'other'];
    const safeCategory = validCategories.includes(category) ? category : 'other';

    const { data: issue, error } = await supabase
      .from('issues')
      .insert({
        user_id: user.id,
        project_id: project_id || null,
        category: safeCategory,
        subject,
        description,
        screenshot_url: screenshot_url || null,
        status: 'open',
        priority: 'medium',
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ issue }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
