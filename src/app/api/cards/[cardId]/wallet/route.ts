import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { NextResponse } from 'next/server';
import { PKPass } from 'passkit-generator';
import { createRouteHandlerClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';
type RouteContext = { params: Promise<{ cardId: string }> };

function requiredWalletConfig() {
  const values = {
    wwdr: process.env.APPLE_WALLET_WWDR_CERT_BASE64,
    signerCert: process.env.APPLE_WALLET_SIGNER_CERT_BASE64,
    signerKey: process.env.APPLE_WALLET_SIGNER_KEY_BASE64,
    signerKeyPassphrase: process.env.APPLE_WALLET_SIGNER_KEY_PASSPHRASE,
    passTypeIdentifier: process.env.APPLE_WALLET_PASS_TYPE_ID,
    teamIdentifier: process.env.APPLE_WALLET_TEAM_ID,
  };
  return Object.values(values).every(Boolean) ? values : null;
}

export async function GET(request: Request, { params }: RouteContext) {
  const { cardId } = await params;
  const supabase = await createRouteHandlerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: card } = await supabase
    .from('business_cards')
    .select('*')
    .eq('id', cardId)
    .eq('user_id', user.id)
    .single();
  if (!card) return NextResponse.json({ error: 'Card not found' }, { status: 404 });

  const config = requiredWalletConfig();
  if (!config) {
    return NextResponse.json(
      { error: 'Apple Wallet signing is awaiting the Sitecraft Pass Type certificate.' },
      { status: 503 },
    );
  }

  try {
    const icon = await readFile(path.join(process.cwd(), 'public', 'icon.png'));
    const origin = new URL(request.url).origin;
    const publicUrl = `${origin}/card/${card.slug}`;
    const color = card.design?.primaryColor || '#10121a';
    const accent = card.design?.accentColor || '#a78bfa';
    const text = card.design?.textColor || '#ffffff';

    const pass = new PKPass(
      {
        'icon.png': icon,
        'icon@2x.png': icon,
        'logo.png': icon,
      },
      {
        wwdr: Buffer.from(config.wwdr!, 'base64'),
        signerCert: Buffer.from(config.signerCert!, 'base64'),
        signerKey: Buffer.from(config.signerKey!, 'base64'),
        signerKeyPassphrase: config.signerKeyPassphrase,
      },
      {
        formatVersion: 1,
        serialNumber: card.id,
        passTypeIdentifier: config.passTypeIdentifier!,
        teamIdentifier: config.teamIdentifier!,
        organizationName: process.env.APPLE_WALLET_ORGANIZATION_NAME || 'Sitecraft',
        description: `${card.full_name}'s digital business card`,
        logoText: card.company || 'Sitecraft',
        backgroundColor: color,
        foregroundColor: text,
        labelColor: accent,
        sharingProhibited: false,
      },
    );
    pass.type = 'generic';
    pass.primaryFields.push({ key: 'name', label: card.company || 'BUSINESS CARD', value: card.full_name });
    pass.secondaryFields.push({ key: 'title', label: 'TITLE', value: card.job_title || 'Professional' });
    pass.auxiliaryFields.push(...[
      ...(card.phone ? [{ key: 'phone', label: 'PHONE', value: card.phone }] : []),
      ...(card.email ? [{ key: 'email', label: 'EMAIL', value: card.email }] : []),
    ].slice(0, 2));
    pass.backFields.push(
      ...(card.bio ? [{ key: 'about', label: 'ABOUT', value: card.bio }] : []),
      ...(card.website ? [{ key: 'website', label: 'WEBSITE', value: card.website }] : []),
      { key: 'profile', label: 'DIGITAL CARD', value: publicUrl },
    );
    pass.setBarcodes({ format: 'PKBarcodeFormatQR', message: publicUrl, messageEncoding: 'iso-8859-1' });
    const buffer = pass.getAsBuffer();

    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        'Content-Type': 'application/vnd.apple.pkpass',
        'Content-Disposition': `attachment; filename="${card.slug}.pkpass"`,
        'Cache-Control': 'private, no-store',
      },
    });
  } catch (error) {
    console.error('[Wallet] Pass generation failed', error);
    return NextResponse.json({ error: 'Could not generate the Wallet pass.' }, { status: 500 });
  }
}
