import { NextResponse } from 'next/server';
import { requireProjectOwner } from '@/lib/project-auth';

export async function GET(
    request: Request,
  { params }: { params: Promise<{ projectId: string; serviceId: string }> }
  ) {
    try {
          const { projectId, serviceId } = await params;
          const { error, supabase } = await requireProjectOwner(projectId);
          if (error) return error;

      const { data: service, error: fetchError } = await supabase!
            .from('services')
            .select('*')
            .eq('id', serviceId)
            .eq('project_id', projectId)
            .single();

      if (fetchError || !service) {
              return NextResponse.json({ error: 'Service not found' }, { status: 404 });
      }

      return NextResponse.json({ service });
    } catch {
          return NextResponse.json({ error: 'Failed to fetch service' }, { status: 500 });
    }
}

export async function PUT(
    request: Request,
  { params }: { params: Promise<{ projectId: string; serviceId: string }> }
  ) {
    try {
          const { projectId, serviceId } = await params;
          const { error, supabase } = await requireProjectOwner(projectId);
          if (error) return error;

      const body = await request.json();
          const { name, description, price, duration_minutes, image_url, is_active, display_order } = body;

      const { data: service, error: updateError } = await supabase!
            .from('services')
            .update({
                      ...(name !== undefined && { name }),
                      ...(description !== undefined && { description }),
                      ...(price !== undefined && { price }),
                      ...(duration_minutes !== undefined && { duration_minutes }),
                      ...(image_url !== undefined && { image_url }),
                      ...(is_active !== undefined && { is_active }),
                      ...(display_order !== undefined && { display_order }),
            })
            .eq('id', serviceId)
            .eq('project_id', projectId)
            .select()
            .single();

      if (updateError) {
              return NextResponse.json({ error: updateError.message }, { status: 500 });
      }

      return NextResponse.json({ service });
    } catch {
          return NextResponse.json({ error: 'Failed to update service' }, { status: 500 });
    }
}

export async function DELETE(
    request: Request,
  { params }: { params: Promise<{ projectId: string; serviceId: string }> }
  ) {
    try {
          const { projectId, serviceId } = await params;
          const { error, supabase } = await requireProjectOwner(projectId);
          if (error) return error;

      const { error: deleteError } = await supabase!
            .from('services')
            .delete()
            .eq('id', serviceId)
            .eq('project_id', projectId);

      if (deleteError) {
              return NextResponse.json({ error: deleteError.message }, { status: 500 });
      }

      return NextResponse.json({ success: true });
    } catch {
          return NextResponse.json({ error: 'Failed to delete service' }, { status: 500 });
    }
}
