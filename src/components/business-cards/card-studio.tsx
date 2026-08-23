'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Apple, CalendarDays, Check, ExternalLink, Globe2, ImagePlus, Loader2, Mail, MonitorSmartphone, Palette, Phone, Printer, Save, Send, Share2, Smartphone, UserRound, WalletCards } from 'lucide-react';
import { toast } from 'sonner';
import type { BusinessCard, CardDesign } from '@/types/business-card';
import { CARD_TEMPLATES, EMPTY_BUSINESS_CARD, normalizeCard } from '@/lib/business-cards/templates';
import { BusinessCardPreview } from './business-card-preview';
import { CardQRCode } from './card-qr-code';

type Panel = 'details' | 'design' | 'share';
type Preview = 'card' | 'profile' | 'wallet';

function fieldClass() {
  return 'w-full rounded-xl border border-white/10 bg-white/[0.045] px-3.5 py-2.5 text-sm text-white outline-none transition placeholder:text-white/25 focus:border-violet-400/55 focus:bg-white/[0.07]';
}

export function CardStudio({ cardId }: { cardId?: string }) {
  const router = useRouter();
  const [card, setCard] = useState<BusinessCard>(normalizeCard(EMPTY_BUSINESS_CARD));
  const [panel, setPanel] = useState<Panel>('details');
  const [preview, setPreview] = useState<Preview>('card');
  const [loading, setLoading] = useState(Boolean(cardId));
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [uploading, setUploading] = useState<'photo' | 'logo' | null>(null);
  const [walletLoading, setWalletLoading] = useState(false);
  const photoRef = useRef<HTMLInputElement>(null);
  const logoRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!cardId) return;
    fetch(`/api/cards/${cardId}`)
      .then(async (response) => {
        if (!response.ok) throw new Error('Card not found');
        return response.json();
      })
      .then((body) => setCard(normalizeCard(body.card)))
      .catch(() => {
        toast.error('This business card could not be opened.');
        router.replace('/cards');
      })
      .finally(() => setLoading(false));
  }, [cardId, router]);

  useEffect(() => {
    if (!dirty) return;
    const handler = (event: BeforeUnloadEvent) => { event.preventDefault(); };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [dirty]);

  const publicUrl = useMemo(() => card.slug
    ? `${typeof window === 'undefined' ? '' : window.location.origin}/card/${card.slug}`
    : 'https://app.innovated.marketing/cards', [card.slug]);

  function patch(values: Partial<BusinessCard>) {
    setCard((current) => ({ ...current, ...values }));
    setDirty(true);
  }

  function patchDesign(values: Partial<CardDesign>) {
    setCard((current) => ({ ...current, design: { ...current.design, ...values } }));
    setDirty(true);
  }

  async function save(status: BusinessCard['status'] = card.status) {
    setSaving(true);
    try {
      const payload: Partial<BusinessCard> = { ...card, status };
      delete payload.id;
      delete payload.user_id;
      delete payload.slug;
      delete payload.view_count;
      delete payload.save_count;
      delete payload.created_at;
      delete payload.updated_at;
      const response = await fetch(card.id ? `/api/cards/${card.id}` : '/api/cards', {
        method: card.id ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const body = await response.json().catch(() => null);
      if (!response.ok) throw new Error(body?.error || 'Could not save this card.');
      const saved = normalizeCard(body.card);
      setCard(saved);
      setDirty(false);
      toast.success(status === 'published' ? 'Your card is live.' : 'Card saved.');
      if (!card.id) router.replace(`/cards/${saved.id}`);
      return saved;
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not save this card.');
      return null;
    } finally {
      setSaving(false);
    }
  }

  async function upload(kind: 'photo' | 'logo', file?: File) {
    if (!file) return;
    setUploading(kind);
    const form = new FormData();
    form.append('file', file);
    form.append('kind', kind);
    try {
      const response = await fetch('/api/cards/assets', { method: 'POST', body: form });
      const body = await response.json().catch(() => null);
      if (!response.ok) throw new Error(body?.error || 'Upload failed.');
      patchDesign(kind === 'photo' ? { photoUrl: body.url } : { logoUrl: body.url });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Upload failed.');
    } finally {
      setUploading(null);
    }
  }

  async function publish() {
    const saved = await save('published');
    if (saved) setPanel('share');
  }

  async function share() {
    if (!card.slug || card.status !== 'published') {
      toast.error('Publish your card before sharing it.');
      return;
    }
    if (navigator.share) {
      await navigator.share({ title: `${card.full_name}'s business card`, url: publicUrl }).catch(() => null);
    } else {
      await navigator.clipboard.writeText(publicUrl);
      toast.success('Card link copied.');
    }
  }

  async function addToWallet() {
    let activeCard = card;
    if (!activeCard.id) {
      const saved = await save('published');
      if (!saved) return;
      activeCard = saved;
    } else if (dirty || activeCard.status !== 'published') {
      const saved = await save('published');
      if (!saved) return;
      activeCard = saved;
    }
    setWalletLoading(true);
    try {
      const response = await fetch(`/api/cards/${activeCard.id}/wallet`);
      if (!response.ok) {
        const body = await response.json().catch(() => null);
        throw new Error(body?.error || 'Wallet pass is unavailable.');
      }
      const blob = await response.blob();
      window.location.href = URL.createObjectURL(blob);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Wallet pass is unavailable.');
    } finally {
      setWalletLoading(false);
    }
  }

  if (loading) return <div className="flex min-h-[70vh] items-center justify-center"><Loader2 className="h-7 w-7 animate-spin text-violet-400" /></div>;

  const tabs: Array<{ id: Panel; label: string; icon: typeof UserRound }> = [
    { id: 'details', label: 'Content', icon: UserRound },
    { id: 'design', label: 'Design', icon: Palette },
    { id: 'share', label: 'Publish', icon: Send },
  ];

  return (
    <div className="mx-auto max-w-[1600px] pb-12">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-xs font-medium text-violet-300"><WalletCards className="h-3.5 w-3.5" /> Business Card Studio</div>
          <input value={card.name} onChange={(e) => patch({ name: e.target.value })} aria-label="Card name" className="mt-1 max-w-full bg-transparent text-xl font-semibold text-white outline-none placeholder:text-white/30" />
        </div>
        <div className="grid w-full grid-cols-2 gap-2 sm:flex sm:w-auto sm:items-center">
          <span className={`hidden rounded-full px-2.5 py-1 text-xs sm:inline ${card.status === 'published' ? 'bg-emerald-400/10 text-emerald-300' : 'bg-white/[0.06] text-white/45'}`}>{card.status === 'published' ? 'Live' : 'Draft'}</span>
          <button onClick={() => save()} disabled={saving || !dirty} className="flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.05] px-4 py-3 text-sm font-medium text-white transition hover:bg-white/10 disabled:opacity-45 sm:py-2.5">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Save
          </button>
          <button onClick={publish} disabled={saving} className="flex items-center justify-center gap-2 rounded-xl bg-violet-500 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-violet-500/20 transition hover:bg-violet-400 disabled:opacity-60 sm:py-2.5">
            <Send className="h-4 w-4" /> Publish
          </button>
        </div>
      </div>

      <div className="grid min-h-0 overflow-hidden rounded-[22px] border border-white/10 bg-[#0d111b]/90 shadow-2xl sm:rounded-[28px] lg:min-h-[720px] lg:grid-cols-[400px_minmax(0,1fr)]">
        <aside className="order-2 border-t border-white/10 bg-[#0a0d15] lg:order-1 lg:border-r lg:border-t-0">
          <div className="sticky top-0 z-20 grid grid-cols-3 border-b border-white/10 bg-[#0a0d15]/95 p-2 backdrop-blur-xl">
            {tabs.map(({ id, label, icon: Icon }) => (
              <button key={id} onClick={() => setPanel(id)} className={`flex items-center justify-center gap-1.5 rounded-xl px-2 py-2.5 text-xs font-semibold transition ${panel === id ? 'bg-white/10 text-white' : 'text-white/40 hover:text-white/70'}`}><Icon className="h-3.5 w-3.5" />{label}</button>
            ))}
          </div>

          <div className="max-h-none overflow-y-visible p-4 sm:p-5 lg:max-h-[680px] lg:overflow-y-auto">
            {panel === 'details' && (
              <div className="space-y-5">
                <section>
                  <h2 className="text-sm font-semibold text-white">Identity</h2>
                  <p className="mt-1 text-xs leading-5 text-white/40">This information powers the digital card, Wallet pass, and contact file.</p>
                </section>
                <div className="grid grid-cols-2 gap-3">
                  <button onClick={() => photoRef.current?.click()} className="group flex min-h-24 flex-col items-center justify-center rounded-2xl border border-dashed border-white/15 bg-white/[0.03] text-xs text-white/55 transition hover:border-violet-400/50 hover:text-white">
                    {uploading === 'photo' ? <Loader2 className="mb-2 h-5 w-5 animate-spin" /> : <ImagePlus className="mb-2 h-5 w-5" />} Profile photo
                  </button>
                  <button onClick={() => logoRef.current?.click()} className="group flex min-h-24 flex-col items-center justify-center rounded-2xl border border-dashed border-white/15 bg-white/[0.03] text-xs text-white/55 transition hover:border-violet-400/50 hover:text-white">
                    {uploading === 'logo' ? <Loader2 className="mb-2 h-5 w-5 animate-spin" /> : <ImagePlus className="mb-2 h-5 w-5" />} Company logo
                  </button>
                  <input ref={photoRef} type="file" accept="image/*" className="hidden" onChange={(e) => upload('photo', e.target.files?.[0])} />
                  <input ref={logoRef} type="file" accept="image/*" className="hidden" onChange={(e) => upload('logo', e.target.files?.[0])} />
                </div>
                {[
                  ['full_name', 'Full name', 'Isiah Green'],
                  ['job_title', 'Job title', 'Founder & CEO'],
                  ['company', 'Company', 'Innovated Marketing'],
                  ['email', 'Email', 'hello@company.com'],
                  ['phone', 'Phone', '(555) 012-3456'],
                  ['website', 'Website', 'company.com'],
                  ['location', 'Location', 'Atlanta, Georgia'],
                  ['booking_url', 'Booking link', 'cal.com/your-name'],
                ].map(([key, label, placeholder]) => (
                  <label key={key} className="block text-xs font-medium text-white/55">{label}<input value={String(card[key as keyof BusinessCard] || '')} onChange={(e) => patch({ [key]: e.target.value })} placeholder={placeholder} className={`mt-1.5 ${fieldClass()}`} /></label>
                ))}
                <label className="block text-xs font-medium text-white/55">Short introduction<textarea value={card.bio} onChange={(e) => patch({ bio: e.target.value })} rows={4} maxLength={500} className={`mt-1.5 resize-none ${fieldClass()}`} /></label>
              </div>
            )}

            {panel === 'design' && (
              <div className="space-y-6">
                <section><h2 className="text-sm font-semibold text-white">Choose a direction</h2><p className="mt-1 text-xs leading-5 text-white/40">Every template stays fully editable.</p></section>
                <div className="grid grid-cols-2 gap-2">
                  {CARD_TEMPLATES.map((template) => (
                    <button key={template.id} onClick={() => patchDesign({ template: template.id, ...template.design })} className={`rounded-2xl border p-2 text-left transition ${card.design.template === template.id ? 'border-violet-400/70 bg-violet-400/10' : 'border-white/10 bg-white/[0.025] hover:border-white/25'}`}>
                      <div className="h-16 rounded-xl" style={{ background: template.design.background === 'gradient' ? `linear-gradient(135deg, ${template.design.primaryColor}, ${template.design.accentColor})` : template.design.primaryColor }} />
                      <p className="mt-2 text-xs font-semibold text-white">{template.name}</p><p className="mt-0.5 text-[10px] text-white/35">{template.description}</p>
                    </button>
                  ))}
                </div>
                <div className="space-y-3">
                  <p className="text-xs font-medium text-white/55">Colors</p>
                  {[['primaryColor', 'Base'], ['accentColor', 'Accent'], ['textColor', 'Text']].map(([key, label]) => <label key={key} className="flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-xs text-white/55"><span>{label}</span><span className="flex items-center gap-2 font-mono text-[10px] text-white/35">{card.design[key as keyof CardDesign] as string}<input type="color" value={card.design[key as keyof CardDesign] as string} onChange={(e) => patchDesign({ [key]: e.target.value })} className="h-7 w-7 cursor-pointer rounded-full border-0 bg-transparent" /></span></label>)}
                </div>
                <label className="block text-xs font-medium text-white/55">Orientation<select value={card.design.orientation} onChange={(e) => patchDesign({ orientation: e.target.value as CardDesign['orientation'] })} className={`mt-1.5 ${fieldClass()}`}><option value="landscape">Landscape</option><option value="portrait">Portrait</option></select></label>
                <label className="block text-xs font-medium text-white/55">Typography<select value={card.design.font} onChange={(e) => patchDesign({ font: e.target.value as CardDesign['font'] })} className={`mt-1.5 ${fieldClass()}`}><option value="modern">Modern</option><option value="classic">Classic serif</option><option value="rounded">Friendly rounded</option></select></label>
                <div className="space-y-2">
                  {[['showPhoto', 'Show profile photo'], ['showLogo', 'Show company logo'], ['showQr', 'Show QR code']].map(([key, label]) => <label key={key} className="flex cursor-pointer items-center justify-between rounded-xl border border-white/10 px-3 py-2.5 text-xs text-white/65"><span>{label}</span><input type="checkbox" checked={Boolean(card.design[key as keyof CardDesign])} onChange={(e) => patchDesign({ [key]: e.target.checked })} className="accent-violet-500" /></label>)}
                </div>
              </div>
            )}

            {panel === 'share' && (
              <div className="space-y-5">
                <section><h2 className="text-sm font-semibold text-white">Publish everywhere</h2><p className="mt-1 text-xs leading-5 text-white/40">One design becomes your digital profile, contact file, QR, and Wallet pass.</p></section>
                {card.status === 'published' && card.slug ? <div className="rounded-2xl border border-emerald-400/20 bg-emerald-400/[0.07] p-4"><p className="flex items-center gap-2 text-xs font-semibold text-emerald-300"><Check className="h-3.5 w-3.5" /> Live and shareable</p><p className="mt-2 break-all text-xs text-white/45">{publicUrl}</p></div> : <button onClick={publish} className="w-full rounded-xl bg-violet-500 px-4 py-3 text-sm font-semibold text-white">Publish this card</button>}
                <button onClick={share} className="flex w-full items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.04] p-4 text-left hover:bg-white/[0.07]"><Share2 className="h-5 w-5 text-violet-300" /><span><span className="block text-sm font-semibold text-white">Share card link</span><span className="mt-0.5 block text-xs text-white/35">Text, email, AirDrop, or copy</span></span></button>
                <button onClick={addToWallet} disabled={walletLoading} className="flex w-full items-center gap-3 rounded-2xl bg-white p-4 text-left text-black transition hover:bg-white/90 disabled:opacity-60">{walletLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Apple className="h-5 w-5" />}<span><span className="block text-sm font-semibold">Add to Apple Wallet</span><span className="mt-0.5 block text-xs text-black/50">Carry the card on iPhone and Apple Watch</span></span></button>
                {card.status === 'published' && <a href={`/card/${card.slug}`} target="_blank" className="flex w-full items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.04] p-4 text-left hover:bg-white/[0.07]"><ExternalLink className="h-5 w-5 text-cyan-300" /><span><span className="block text-sm font-semibold text-white">Open public profile</span><span className="mt-0.5 block text-xs text-white/35">See what new contacts see</span></span></a>}
                <button onClick={() => window.print()} className="flex w-full items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.04] p-4 text-left hover:bg-white/[0.07]"><Printer className="h-5 w-5 text-amber-300" /><span><span className="block text-sm font-semibold text-white">Print or save as PDF</span><span className="mt-0.5 block text-xs text-white/35">Use your browser print dialog</span></span></button>
              </div>
            )}
          </div>
        </aside>

        <section className="relative order-1 flex min-w-0 flex-col bg-[radial-gradient(circle_at_50%_15%,rgba(139,92,246,.12),transparent_32%),#111622] lg:order-2">
          <div className="flex items-center justify-center border-b border-white/10 p-2 sm:p-3">
            <div className="grid w-full grid-cols-3 rounded-xl border border-white/10 bg-black/20 p-1 sm:flex sm:w-auto">
              {[{ id: 'card', icon: WalletCards, label: 'Card' }, { id: 'profile', icon: Smartphone, label: 'Profile' }, { id: 'wallet', icon: MonitorSmartphone, label: 'Wallet' }].map(({ id, icon: Icon, label }) => <button key={id} onClick={() => setPreview(id as Preview)} className={`flex min-w-0 items-center justify-center gap-1.5 rounded-lg px-2 py-2.5 text-[11px] font-medium transition sm:px-3 sm:py-2 sm:text-xs ${preview === id ? 'bg-white/10 text-white' : 'text-white/40 hover:text-white/65'}`}><Icon className="h-3.5 w-3.5 shrink-0" />{label}</button>)}
            </div>
          </div>

          <div className="flex min-h-[300px] flex-1 items-center justify-center overflow-hidden p-4 sm:min-h-[520px] sm:p-10">
            {preview === 'card' && <div className={`w-full ${card.design.orientation === 'portrait' ? 'max-w-[360px]' : 'max-w-[720px]'}`}><BusinessCardPreview card={card} publicUrl={publicUrl} /><p className="mt-5 text-center text-xs text-white/30">Print-ready design · live preview</p></div>}
            {preview === 'profile' && (
              <div className="relative h-[510px] w-[260px] overflow-hidden rounded-[38px] border-[7px] border-[#030408] bg-[#11141b] shadow-2xl sm:h-[610px] sm:w-[310px] sm:rounded-[44px] sm:border-[8px]">
                <div className="absolute left-1/2 top-2 z-10 h-5 w-24 -translate-x-1/2 rounded-full bg-black" />
                <div className="h-32" style={{ background: `linear-gradient(135deg, ${card.design.primaryColor}, ${card.design.accentColor})` }} />
                <div className="px-5 pb-5">
                  <div className="-mt-10 flex h-20 w-20 items-center justify-center overflow-hidden rounded-full border-4 border-[#11141b] bg-[#282c38] text-lg font-bold text-white">{card.design.photoUrl ? <img src={card.design.photoUrl} alt="" className="h-full w-full object-cover" /> : card.full_name.split(/\s+/).map((x) => x[0]).join('').slice(0, 2)}</div>
                  <h3 className="mt-3 text-xl font-semibold text-white">{card.full_name}</h3><p className="text-xs text-white/45">{card.job_title} · {card.company}</p><p className="mt-3 line-clamp-3 text-xs leading-5 text-white/60">{card.bio}</p>
                  <button className="mt-4 w-full rounded-xl bg-white py-2.5 text-xs font-semibold text-black">Save to contacts</button>
                  <div className="mt-3 grid grid-cols-2 gap-2">{[{ label: 'Call', Icon: Phone }, { label: 'Email', Icon: Mail }, { label: 'Website', Icon: Globe2 }, { label: 'Book time', Icon: CalendarDays }].map(({ label, Icon }) => <div key={label} className="flex items-center gap-1.5 rounded-xl bg-white/[0.06] p-2.5 text-[10px] text-white/65"><Icon className="h-3 w-3" />{label}</div>)}</div>
                </div>
              </div>
            )}
            {preview === 'wallet' && (
              <div className="w-full max-w-[430px]">
                <div className="overflow-hidden rounded-[28px] shadow-2xl" style={{ background: `linear-gradient(135deg, ${card.design.primaryColor}, ${card.design.accentColor})`, color: card.design.textColor }}>
                  <div className="flex items-center justify-between px-6 pt-5"><span className="text-xs font-bold uppercase tracking-[.16em]">{card.company || 'Sitecraft'}</span><Apple className="h-5 w-5" /></div>
                  <div className="px-6 py-9"><p className="text-[10px] uppercase tracking-wider opacity-55">Business card</p><p className="mt-1 text-3xl font-semibold tracking-[-.04em]">{card.full_name}</p><p className="mt-2 text-sm opacity-65">{card.job_title}</p></div>
                  <div className="flex justify-center rounded-t-[26px] bg-white p-6"><CardQRCode value={publicUrl} size={165} /></div>
                </div>
                <p className="mt-5 text-center text-xs leading-5 text-white/35">Wallet adapts your brand to Apple&apos;s approved pass layout.</p>
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
