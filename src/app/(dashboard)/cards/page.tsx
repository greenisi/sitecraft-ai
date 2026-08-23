'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { ExternalLink, Loader2, Plus, QrCode, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import type { BusinessCard } from '@/types/business-card';
import { normalizeCard } from '@/lib/business-cards/templates';
import { BusinessCardPreview } from '@/components/business-cards/business-card-preview';

export default function BusinessCardsPage() {
  const [cards, setCards] = useState<BusinessCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const response = await fetch('/api/cards');
      if (!response.ok) throw new Error();
      const body = await response.json();
      setCards((body.cards || []).map(normalizeCard));
    } catch {
      toast.error('Business cards could not be loaded.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function remove(card: BusinessCard) {
    if (!card.id || !window.confirm(`Delete “${card.name}”? This cannot be undone.`)) return;
    setDeleting(card.id);
    const response = await fetch(`/api/cards/${card.id}`, { method: 'DELETE' });
    if (response.ok) {
      setCards((current) => current.filter((item) => item.id !== card.id));
      toast.success('Card deleted.');
    } else toast.error('Card could not be deleted.');
    setDeleting(null);
  }

  return (
    <div className="mx-auto max-w-7xl pb-8 pt-5 md:pt-8">
      <section className="flex flex-col justify-between gap-5 md:flex-row md:items-center">
          <div>
            <h1 className="text-2xl font-semibold tracking-[-.035em] text-white sm:text-3xl">Business cards</h1>
            <p className="mt-1.5 text-sm text-white/45">Design, share, and add your card to Apple Wallet.</p>
          </div>
          <Link href="/cards/new" className="flex shrink-0 items-center justify-center gap-2 rounded-xl bg-violet-500 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-violet-500/20 transition hover:bg-violet-400"><Plus className="h-4 w-4" /> New card</Link>
      </section>

      {loading ? <div className="flex min-h-72 items-center justify-center"><Loader2 className="h-7 w-7 animate-spin text-violet-400" /></div> : cards.length === 0 ? (
        <section className="mt-8 flex min-h-[340px] flex-col items-center justify-center rounded-[24px] border border-dashed border-white/15 bg-white/[0.025] px-6 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-violet-400/10 text-violet-300"><QrCode className="h-7 w-7" /></div>
          <h2 className="mt-5 text-xl font-semibold text-white">Your first card starts with your brand</h2>
          <p className="mt-2 max-w-md text-sm leading-6 text-white/45">Use your logo, photo, colors, contact details, and links. Sitecraft turns the finished design into every format you need.</p>
          <Link href="/cards/new" className="mt-6 flex items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-semibold text-black"><Plus className="h-4 w-4" /> Start designing</Link>
        </section>
      ) : (
        <div className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {cards.map((card) => (
            <article key={card.id} className="premium-feature-card group overflow-hidden rounded-[26px] border border-white/10 bg-[#101522] transition hover:-translate-y-0.5 hover:border-white/20">
              <Link href={`/cards/${card.id}`} className="block bg-[#0a0d14] p-4"><BusinessCardPreview card={card} className="transition duration-300 group-hover:scale-[1.01]" /></Link>
              <div className="flex items-center justify-between gap-3 p-4">
                <div className="min-w-0"><p className="truncate text-sm font-semibold text-white">{card.name}</p><p className="mt-1 text-xs text-white/35">{card.status === 'published' ? `${card.view_count || 0} views · ${card.save_count || 0} saves` : 'Draft'}</p></div>
                <div className="flex items-center gap-1">
                  {card.status === 'published' && <a href={`/card/${card.slug}`} target="_blank" aria-label="Open public card" className="rounded-lg p-2 text-white/35 hover:bg-white/[0.06] hover:text-white"><ExternalLink className="h-4 w-4" /></a>}
                  <button onClick={() => remove(card)} disabled={deleting === card.id} aria-label="Delete card" className="rounded-lg p-2 text-white/30 hover:bg-rose-400/10 hover:text-rose-300">{deleting === card.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}</button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
