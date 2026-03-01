import { NextResponse } from 'next/server';
import { requireProjectOwner } from '@/lib/project-auth';

export async function GET(
    request: Request,
  { params }: { params: Promise<{ projectId: string }> }
  ) {
    try {
          const { projectId } = await params;
          const { error, supabase } = await requireProjectOwner(projectId);
          if (error) return error;

      const { data: services, error: fetchError } = await supabase!
            .from('services')
            .select('*')
            .eq('project_id', projectId)
            .order('sort_order', { ascending: true });

      if (fetchError) {
              return NextResponse.json({ error: fetchError.message }, { status: 500 });
      }

      return NextResponse.json({ services: services || [] });
    } catch {
          return NextResponse.json({ error: 'Failed to fetch services' }, { status: 500 });
    }
}

export async function POST(
    request: Request,
  { params }: { params: Promise<{ projectId: string }> }
  ) {
    try {
          const { projectId } = await params;
          const { error, supabase } = await requireProjectOwner(projectId);
          if (error) return error;

      const body = await request.json();
          const { name, description, price, duration, image_url, features, is_active, sort_order } = body;

      if (!name) {
              return NextResponse.json({ error: 'Name is required' }, { status: 400 });
      }

      const { data: service, error: insertError } = await supabase!
            .from('services')
            .insert({
                      project_id: projectId,
                      name,
                      description: description || null,
                      price: price || null,
                      duration: duration || null,
                      image_url: image_url || null,
                      features: features || [],
                      is_active: is_active !== undefined ? is_active : true,
                      sort_order: sort_order || 0,
            })
            .select()
            .single();

      if (insertError) {
              return NextResponse.json({ error: insertError.message }, { status: 500 });
      }

      return NextResponse.json({ service }, { status: 201 });
    } catch {
          return NextResponse.json({ error: 'Failed to create service' }, { status: 500 });
    }
}
