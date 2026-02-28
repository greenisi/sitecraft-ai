import { NextResponse } from 'next/server';
import { requireProjectOwner } from '@/lib/project-auth';

export async function GET(
    request: Request,
  { params }: { params: Promise<{ projectId: string }> }
  ) {
    try {
          const { projectId } = await params;
          const { error, project } = await requireProjectOwner(projectId);
          if (error) return error;

      return NextResponse.json({ business_type: project!.business_type });
    } catch {
          return NextResponse.json({ error: 'Failed to get business type' }, { status: 500 });
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

      const { business_type } = await request.json();

      if (!['service', 'ecommerce', 'realestate', 'other'].includes(business_type)) {
              return NextResponse.json({ error: 'Invalid business type' }, { status: 400 });
      }

      const { error: updateError } = await supabase!
            .from('projects')
            .update({ business_type })
            .eq('id', projectId);

      if (updateError) {
              return NextResponse.json({ error: updateError.message }, { status: 500 });
      }

      return NextResponse.json({ business_type });
    } catch {
          return NextResponse.json({ error: 'Failed to update business type' }, { status: 500 });
    }
}
