'use client';

import { Mail, Phone, Globe2, MapPin } from 'lucide-react';
import type { BusinessCard } from '@/types/business-card';
import { cardPublicUrl } from '@/lib/business-cards/templates';
import { CardQRCode } from './card-qr-code';

function background(card: BusinessCard) {
  const { primaryColor, accentColor, background: style } = card.design;
  if (style === 'gradient') return `linear-gradient(135deg, ${primaryColor}, ${accentColor})`;
  if (style === 'mesh') {
    return `radial-gradient(circle at 84% 12%, ${accentColor}88 0%, transparent 28%), radial-gradient(circle at 5% 92%, ${accentColor}44 0%, transparent 32%), ${primaryColor}`;
  }
  return primaryColor;
}

function fontFamily(font: BusinessCard['design']['font']) {
  if (font === 'classic') return 'Georgia, Times New Roman, serif';
  if (font === 'rounded') return 'ui-rounded, Nunito, system-ui, sans-serif';
  return 'Inter, ui-sans-serif, system-ui, sans-serif';
}

function Initials({ name }: { name: string }) {
  const initials = name.split(/\s+/).map((part) => part[0]).join('').slice(0, 2).toUpperCase();
  return <span>{initials || 'SC'}</span>;
}

export function BusinessCardPreview({ card, publicUrl, className = '' }: { card: BusinessCard; publicUrl?: string; className?: string }) {
  const portrait = card.design.orientation === 'portrait';
  const split = card.design.layout === 'split';
  const minimal = card.design.layout === 'minimal';
  const destination = publicUrl || (card.slug ? cardPublicUrl(card.slug) : 'https://app.innovated.marketing/cards');

  return (
    <div
      className={`relative isolate w-full overflow-hidden shadow-2xl ${className}`}
      style={{
        aspectRatio: portrait ? '2 / 3' : '1.75 / 1',
        borderRadius: card.design.cornerRadius,
        background: background(card),
        color: card.design.textColor,
        fontFamily: fontFamily(card.design.font),
      }}
    >
      <div className={`absolute inset-0 opacity-[0.08] ${minimal ? 'hidden' : ''}`} style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.5) 1px, transparent 1px)', backgroundSize: '28px 28px' }} />
      <div className={`relative flex h-full ${portrait ? 'flex-col p-[9%]' : 'items-stretch p-[7%]'} ${split && !portrait ? 'gap-[6%]' : ''}`}>
        <div className={`flex min-w-0 flex-1 ${portrait ? 'flex-col' : split ? 'flex-row items-center gap-[7%]' : 'flex-col justify-between'}`}>
          <div className={portrait ? 'mb-auto' : ''}>
            <div className="flex items-center gap-3">
              {card.design.showPhoto && (
                <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full border border-white/30 bg-white/15 text-sm font-bold backdrop-blur">
                  {card.design.photoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={card.design.photoUrl} alt="" className="h-full w-full object-cover" />
                  ) : <Initials name={card.full_name} />}
                </div>
              )}
              {card.design.showLogo && (
                card.design.logoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={card.design.logoUrl} alt={card.company} className="max-h-9 max-w-28 object-contain" />
                ) : (
                  <span className="max-w-32 truncate text-[10px] font-bold uppercase tracking-[0.16em] opacity-70">{card.company}</span>
                )
              )}
            </div>
          </div>

          <div className={portrait ? 'my-auto py-8' : split ? '' : 'mt-auto'}>
            <p className={`${portrait ? 'text-3xl' : 'text-[clamp(1.15rem,3vw,2rem)]'} font-semibold leading-[1.05] tracking-[-0.04em]`}>{card.full_name}</p>
            <p className="mt-2 text-[clamp(.65rem,1.4vw,.9rem)] opacity-70">{card.job_title}{card.job_title && card.company ? ' · ' : ''}{card.company}</p>
          </div>

          {!minimal && (
            <div className={`mt-5 grid gap-1.5 text-[clamp(.55rem,1.1vw,.76rem)] opacity-80 ${portrait ? '' : 'grid-cols-2'}`}>
              {card.email && <span className="flex min-w-0 items-center gap-1.5 truncate"><Mail className="h-3 w-3 shrink-0" />{card.email}</span>}
              {card.phone && <span className="flex items-center gap-1.5"><Phone className="h-3 w-3 shrink-0" />{card.phone}</span>}
              {card.website && <span className="flex min-w-0 items-center gap-1.5 truncate"><Globe2 className="h-3 w-3 shrink-0" />{card.website}</span>}
              {card.location && <span className="flex min-w-0 items-center gap-1.5 truncate"><MapPin className="h-3 w-3 shrink-0" />{card.location}</span>}
            </div>
          )}
        </div>

        {card.design.showQr && (
          <div className={`${portrait ? 'mx-auto mt-auto' : 'ml-auto flex items-end'} shrink-0`}>
            <div className="rounded-[18px] bg-white p-1.5 shadow-xl">
              <CardQRCode value={destination} size={portrait ? 94 : 82} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

