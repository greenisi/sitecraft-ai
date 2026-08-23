import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { CalendarDays, Download, Globe2, Link as LinkIcon, Mail, MapPin, Phone } from 'lucide-react';
import { createAdminClient } from '@/lib/supabase/admin';
import { normalizeCard } from '@/lib/business-cards/templates';
import { ContactExchangeForm } from '@/components/business-cards/contact-exchange-form';

export const dynamic = 'force-dynamic';
type PageProps = { params: Promise<{ slug: string }> };

async function getCard(slug: string) {
  const admin = createAdminClient();
  const { data } = await admin
    .from('business_cards')
    .select('*')
    .eq('slug', slug)
    .eq('status', 'published')
    .single();
  return data ? normalizeCard(data) : null;
}

function externalUrl(value: string) {
  return /^https?:\/\//i.test(value) ? value : `https://${value}`;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const card = await getCard(slug);
  if (!card) return { title: 'Digital business card' };
  return {
    title: `${card.full_name} · ${card.company || 'Digital business card'}`,
    description: card.bio || `Connect with ${card.full_name}.`,
  };
}

export default async function PublicCardPage({ params }: PageProps) {
  const { slug } = await params;
  const card = await getCard(slug);
  if (!card) notFound();

  const admin = createAdminClient();
  await admin.from('business_cards').update({ view_count: (card.view_count || 0) + 1 }).eq('id', card.id!);
  const initial = card.full_name.split(/\s+/).map((part) => part[0]).join('').slice(0, 2).toUpperCase();

  return (
    <main className="min-h-screen bg-[#08090d] text-white" style={{ backgroundImage: `radial-gradient(circle at 50% -10%, ${card.design.accentColor}40, transparent 36%)` }}>
      <div className="mx-auto flex min-h-screen max-w-xl flex-col px-5 py-8 sm:py-12">
        <div className="overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.06] shadow-2xl backdrop-blur-xl">
          <div className="h-36" style={{ background: `linear-gradient(135deg, ${card.design.primaryColor}, ${card.design.accentColor})` }} />
          <div className="px-6 pb-7">
            <div className="-mt-14 flex items-end justify-between gap-4">
              <div className="flex h-28 w-28 items-center justify-center overflow-hidden rounded-full border-4 border-[#121319] bg-[#1e2029] text-2xl font-bold shadow-xl">
                {card.design.photoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={card.design.photoUrl} alt={card.full_name} className="h-full w-full object-cover" />
                ) : initial}
              </div>
              {card.design.logoUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={card.design.logoUrl} alt={card.company} className="mb-2 max-h-12 max-w-32 rounded-lg bg-white p-2 object-contain" />
              )}
            </div>

            <h1 className="mt-5 text-3xl font-semibold tracking-[-0.04em]">{card.full_name}</h1>
            <p className="mt-1 text-white/55">{card.job_title}{card.job_title && card.company ? ' · ' : ''}{card.company}</p>
            {card.bio && <p className="mt-5 text-[15px] leading-6 text-white/70">{card.bio}</p>}

            <a href={`/api/cards/public/${slug}/vcard`} className="mt-6 flex w-full items-center justify-center gap-2 rounded-2xl bg-white px-5 py-3.5 text-sm font-semibold text-black transition hover:bg-white/90">
              <Download className="h-4 w-4" /> Save to contacts
            </a>

            <div className="mt-5 grid grid-cols-2 gap-2.5">
              {card.phone && <a href={`tel:${card.phone}`} className="flex items-center gap-2 rounded-2xl bg-white/[0.07] px-4 py-3 text-sm text-white/80 hover:bg-white/10"><Phone className="h-4 w-4" /> Call</a>}
              {card.email && <a href={`mailto:${card.email}`} className="flex items-center gap-2 rounded-2xl bg-white/[0.07] px-4 py-3 text-sm text-white/80 hover:bg-white/10"><Mail className="h-4 w-4" /> Email</a>}
              {card.website && <a href={externalUrl(card.website)} target="_blank" rel="noreferrer" className="flex items-center gap-2 rounded-2xl bg-white/[0.07] px-4 py-3 text-sm text-white/80 hover:bg-white/10"><Globe2 className="h-4 w-4" /> Website</a>}
              {card.booking_url && <a href={externalUrl(card.booking_url)} target="_blank" rel="noreferrer" className="flex items-center gap-2 rounded-2xl bg-white/[0.07] px-4 py-3 text-sm text-white/80 hover:bg-white/10"><CalendarDays className="h-4 w-4" /> Book time</a>}
            </div>

            {card.location && <p className="mt-5 flex items-center gap-2 text-sm text-white/45"><MapPin className="h-4 w-4" />{card.location}</p>}
            {card.social_links.length > 0 && (
              <div className="mt-5 flex flex-wrap gap-2">
                {card.social_links.map((link) => <a key={`${link.label}-${link.url}`} href={externalUrl(link.url)} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 rounded-full border border-white/10 px-3 py-2 text-xs text-white/65 hover:bg-white/[0.06]"><LinkIcon className="h-3 w-3" />{link.label}</a>)}
              </div>
            )}
          </div>
        </div>

        <div className="mt-4"><ContactExchangeForm slug={slug} /></div>
        <a href="/" className="mx-auto mt-7 text-xs font-medium tracking-wide text-white/35 hover:text-white/60">Made with Sitecraft</a>
      </div>
    </main>
  );
}

