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
    <div className="mx-auto max-w-7xl pb-8">
      {/* A large left-anchored title, the way an iOS large-title screen
          opens. The old version centred everything and repeated the page
          name in the navigation bar directly above it. */}
      <header className="flex flex-col gap-4 pt-2 md:flex-row md:items-end md:justify-between md:pt-0">
        <div>
          <h1 className="ios-title">Business cards</h1>
          <p className="ios-body mt-1.5">Design, share, and add your card to Apple Wallet.</p>
        </div>
        {cards.length > 0 && (
          <Link href="/cards/new" className="ios-btn ios-btn-primary hidden shrink-0 md:inline-flex">
            <Plus className="h-4 w-4" /> New card
          </Link>
        )}
      </header>

      {loading ? (
        <div className="flex min-h-72 items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-[color:var(--label-3)]" />
        </div>
      ) : cards.length === 0 ? (
        /* One primary action, not two. The previous empty state offered a
           solid "New card" and a white "Start designing" sixty pixels
           apart, both leading to the same screen. */
        <section className="ios-card mt-7 px-6 py-11 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[color:var(--surface-3)] text-[color:var(--accent)]">
            <QrCode className="h-6 w-6" />
          </div>
          <h2 className="ios-title-2 mt-5">Your first card starts with your brand</h2>
          <p className="ios-body mx-auto mt-2 max-w-sm">
            Your logo, photo, colours, contact details, and links. Sitecraft turns the finished design
            into every format you need.
          </p>
          <Link href="/cards/new" className="ios-btn ios-btn-primary mt-7 w-full sm:w-auto">
            <Plus className="h-4 w-4" /> Start designing
          </Link>
        </section>
      ) : (
        <div className="mt-7 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {cards.map((card) => (
            <article key={card.id} className="ios-card overflow-hidden transition active:scale-[0.985]">
              <Link href={`/cards/${card.id}`} className="block bg-[color:var(--app-bg)] p-4">
                <BusinessCardPreview card={card} />
              </Link>
              <div className="flex items-center justify-between gap-3 border-t border-[color:var(--hairline)] p-3.5">
                <div className="min-w-0">
                  <p className="truncate text-[15px] font-semibold text-[color:var(--label)]">{card.name}</p>
                  <p className="ios-footnote mt-0.5">
                    {card.status === 'published'
                      ? `${card.view_count || 0} views · ${card.save_count || 0} saves`
                      : 'Draft'}
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  {card.status === 'published' && (
                    <a
                      href={`/card/${card.slug}`}
                      target="_blank"
                      aria-label="Open public card"
                      className="rounded-lg p-2.5 text-[color:var(--label-3)] transition active:scale-90 active:text-[color:var(--label)]"
                    >
                      <ExternalLink className="h-[18px] w-[18px]" />
                    </a>
                  )}
                  <button
                    onClick={() => remove(card)}
                    disabled={deleting === card.id}
                    aria-label="Delete card"
                    className="rounded-lg p-2.5 text-[color:var(--label-3)] transition active:scale-90 active:text-rose-400"
                  >
                    {deleting === card.id ? <Loader2 className="h-[18px] w-[18px] animate-spin" /> : <Trash2 className="h-[18px] w-[18px]" />}
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      {/* On a phone the primary action sits above the tab bar within thumb
          reach, rather than at the top of a scrolling list. */}
      {cards.length > 0 && (
        <Link
          href="/cards/new"
          className="ios-btn ios-btn-primary fixed inset-x-4 bottom-[calc(4.75rem+env(safe-area-inset-bottom))] z-30 shadow-[0_10px_30px_rgba(0,0,0,0.45)] md:hidden"
        >
          <Plus className="h-4 w-4" /> New card
        </Link>
      )}
    </div>
  );
}
