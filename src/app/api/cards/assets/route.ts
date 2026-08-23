import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  const supabase = await createRouteHandlerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const form = await request.formData().catch(() => null);
  const file = form?.get('file');
  const kind = form?.get('kind') === 'logo' ? 'logo' : 'photo';
  if (!(file instanceof File) || !file.type.startsWith('image/')) {
    return NextResponse.json({ error: 'Choose a valid image.' }, { status: 400 });
  }
  if (file.size > 5 * 1024 * 1024) {
    return NextResponse.json({ error: 'Image must be smaller than 5 MB.' }, { status: 400 });
  }

  const extension = file.name.split('.').pop()?.replace(/[^a-z0-9]/gi, '').toLowerCase() || 'png';
  const storagePath = `${user.id}/business-cards/${kind}-${crypto.randomUUID()}.${extension}`;
  const { error } = await supabase.storage
    .from('project-assets')
    .upload(storagePath, new Uint8Array(await file.arrayBuffer()), {
      contentType: file.type,
      upsert: false,
    });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const { data } = supabase.storage.from('project-assets').getPublicUrl(storagePath);
  return NextResponse.json({ url: data.publicUrl });
}

