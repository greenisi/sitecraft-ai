'use client';

import { Suspense, useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  BriefcaseBusiness,
  Building2,
  Check,
  CheckCircle2,
  ChevronRight,
  CircleDollarSign,
  Clock3,
  Heart,
  Loader2,
  MapPin,
  PartyPopper,
  Rocket,
  ShoppingBag,
  Sparkles,
  Store,
  Target,
  Users,
  WandSparkles,
} from 'lucide-react';
import { toast } from 'sonner';
import { useCreateProject, useProjects } from '@/lib/hooks/use-projects';
import { useUser } from '@/lib/hooks/use-user';
import {
  backendForJourney,
  EMPTY_WEBSITE_JOURNEY,
  journeyReadiness,
  modelTierForJourney,
  recommendedPages,
  siteTypeForJourney,
  type BusinessModel,
  type WebsiteJourneyAnswers,
} from '@/lib/intake/website-journey';

const DRAFT_KEY = 'sitecraft.website_journey.v1';

const STEP_META = [
  { eyebrow: 'Your starting point', title: 'Where are we meeting your business today?', note: 'There is no wrong starting point. We will adapt the journey around what already exists.' },
  { eyebrow: 'The essentials', title: 'Give your website a clear identity.', note: 'Three short details help the AI choose the right structure, language, and local context.' },
  { eyebrow: 'What you sell', title: 'What should customers understand first?', note: 'Write it the way you would explain it to a good customer—not like a brochure.' },
  { eyebrow: 'Your customer', title: 'Let’s make the right person feel understood.', note: 'The strongest websites speak to a real situation, not a vague demographic.' },
  { eyebrow: 'Reasons to believe', title: 'What makes choosing you feel safe?', note: 'Real proof beats polished claims. Skip anything you do not have yet; we will never invent it.' },
  { eyebrow: 'The finish line', title: 'What should happen when the website works?', note: 'One primary action gives every page a purpose and tells us what backend to prepare.' },
  { eyebrow: 'Look and feel', title: 'How should the business feel before anyone reads a word?', note: 'Choose a few feelings. The AI will translate them into typography, color, spacing, and imagery.' },
  { eyebrow: 'Your website plan', title: 'Everything is lined up.', note: 'Review the plan, choose build quality, and Site Craft will carry the full brief into generation.' },
];

const BUSINESS_MODELS: Array<{ id: BusinessModel; label: string; detail: string; icon: typeof Store }> = [
  { id: 'local-service', label: 'Local service', detail: 'Home, field, beauty, repair, or appointment services', icon: MapPin },
  { id: 'professional-service', label: 'Professional service', detail: 'Consulting, legal, finance, agency, or B2B work', icon: BriefcaseBusiness },
  { id: 'ecommerce', label: 'Online store', detail: 'Products, orders, checkout, and fulfillment', icon: ShoppingBag },
  { id: 'restaurant', label: 'Food or hospitality', detail: 'Menu, ordering, reservations, or visits', icon: Store },
  { id: 'creator', label: 'Creator or portfolio', detail: 'Work, audience, services, or personal brand', icon: Heart },
  { id: 'saas', label: 'Software or membership', detail: 'Features, pricing, signups, or subscriptions', icon: Rocket },
  { id: 'other', label: 'Something else', detail: 'We will shape the journey around your model', icon: Building2 },
];

const FEELINGS = ['Trustworthy', 'Premium', 'Warm', 'Bold', 'Modern', 'Calm', 'Energetic', 'Established', 'Approachable', 'Innovative'];

const ACTIONS: Array<{ id: WebsiteJourneyAnswers['primaryAction']; label: string; detail: string }> = [
  { id: 'quote', label: 'Request a quote', detail: 'Best for estimates and custom work' },
  { id: 'book', label: 'Book an appointment', detail: 'Best for scheduled services' },
  { id: 'buy', label: 'Buy something', detail: 'Best for products and direct sales' },
  { id: 'call', label: 'Call the business', detail: 'Best for urgent or high-trust services' },
  { id: 'visit', label: 'Visit the location', detail: 'Best for restaurants and storefronts' },
  { id: 'subscribe', label: 'Sign up', detail: 'Best for software, memberships, and lists' },
];

const REWARDS = [
  'Great start—your path is personalized.',
  'Identity locked in. The site already feels more specific.',
  'Offer captured. Now every page can support what you sell.',
  'Customer clarity added. Generic copy is officially off the table.',
  'Trust layer ready. This is what turns attention into action.',
  'Conversion path connected. Your backend plan is taking shape.',
  'Creative direction complete. Your full build plan is ready.',
];

function Field({ label, hint, value, onChange, placeholder, multiline = false, optional = false }: {
  label: string;
  hint?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  multiline?: boolean;
  optional?: boolean;
}) {
  const shared = 'mt-2 w-full rounded-2xl border border-white/10 bg-white/[0.045] px-4 py-3.5 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-violet-400/50 focus:bg-violet-400/[0.045] focus:ring-4 focus:ring-violet-500/10';
  return (
    <label className="block">
      <span className="text-sm font-semibold text-slate-200">{label}</span>
      {optional && <span className="ml-2 text-xs font-normal text-slate-600">Optional</span>}
      {hint && <span className="mt-1 block text-xs leading-5 text-slate-500">{hint}</span>}
      {multiline ? (
        <textarea value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} rows={4} className={`${shared} resize-none`} />
      ) : (
        <input value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} className={shared} />
      )}
    </label>
  );
}

export default function NewProjectPage() {
  return <Suspense fallback={<JourneyLoading />}><WebsiteJourney /></Suspense>;
}

function JourneyLoading() {
  return <div className="flex min-h-[70vh] items-center justify-center text-slate-500"><Loader2 className="h-6 w-6 animate-spin" /></div>;
}

function WebsiteJourney() {
  const router = useRouter();
  const params = useSearchParams();
  const { user, loading: userLoading } = useUser();
  const createProject = useCreateProject();
  const { data: existingProjects } = useProjects();
  // Only worth asking from the second project onward — there is nothing to
  // share with on the first. Defaults to empty, i.e. keep the data separate.
  const [shareDataWith, setShareDataWith] = useState<string>('');
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<WebsiteJourneyAnswers>(EMPTY_WEBSITE_JOURNEY);
  const [hydrated, setHydrated] = useState(false);
  const [reward, setReward] = useState<string | null>(null);
  const [validationMessage, setValidationMessage] = useState<string | null>(null);

  useEffect(() => {
    if (userLoading) return;
    if (!user) {
      const destination = `${window.location.pathname}${window.location.search}`;
      router.replace(`/login?redirect=${encodeURIComponent(destination)}`);
    }
  }, [router, user, userLoading]);

  useEffect(() => {
    const restoreTimer = window.setTimeout(() => {
      let restored = { ...EMPTY_WEBSITE_JOURNEY };
      try {
        const draft = JSON.parse(localStorage.getItem(DRAFT_KEY) || '{}');
        if (draft && typeof draft === 'object') restored = { ...restored, ...draft };
      } catch {}

      try {
        const warm = JSON.parse(sessionStorage.getItem('sitecraft.start_prefill') || '{}');
        if (warm && typeof warm === 'object') {
          if (typeof warm.businessName === 'string' && warm.businessName) restored.businessName = warm.businessName;
          if (typeof warm.verticalLabel === 'string' && warm.verticalLabel) restored.industry = warm.verticalLabel;
          if (typeof warm.vertical === 'string' && warm.vertical) restored.businessModel = 'local-service';
        }
      } catch {}

      const business = params.get('business');
      const vertical = params.get('vertical');
      if (business) restored.businessName = business;
      if (vertical) restored.industry = vertical.replace(/-/g, ' ');
      setAnswers(restored);
      setHydrated(true);
    }, 0);
    return () => window.clearTimeout(restoreTimer);
  }, [params]);

  useEffect(() => {
    if (!hydrated) return;
    try { localStorage.setItem(DRAFT_KEY, JSON.stringify(answers)); } catch {}
  }, [answers, hydrated]);

  const readiness = journeyReadiness(answers);
  const backend = useMemo(() => backendForJourney(answers), [answers]);
  const pages = useMemo(() => recommendedPages(answers), [answers]);
  const progress = Math.round((currentStep / (STEP_META.length - 1)) * 100);
  const meta = STEP_META[currentStep];

  function update<K extends keyof WebsiteJourneyAnswers>(key: K, value: WebsiteJourneyAnswers[K]) {
    setAnswers((current) => ({ ...current, [key]: value }));
    setValidationMessage(null);
  }

  function validateStep() {
    if (currentStep === 1 && (!answers.businessName.trim() || !answers.industry.trim())) return 'Add the business name and what the business does.';
    if (currentStep === 2 && !answers.offer.trim()) return 'Tell us what customers can hire you for or buy.';
    if (currentStep === 3 && (!answers.idealCustomer.trim() || !answers.customerProblem.trim())) return 'Describe the ideal customer and what they need solved.';
    if (currentStep === 6 && answers.brandFeelings.length === 0) return 'Choose at least one feeling for the website.';
    return null;
  }

  function goNext() {
    const error = validateStep();
    if (error) {
      setValidationMessage(error);
      return;
    }
    setReward(REWARDS[currentStep] || null);
    window.setTimeout(() => setReward(null), 2200);
    setCurrentStep((step) => Math.min(step + 1, STEP_META.length - 1));
  }

  function toggleFeeling(feeling: string) {
    update('brandFeelings', answers.brandFeelings.includes(feeling)
      ? answers.brandFeelings.filter((item) => item !== feeling)
      : answers.brandFeelings.length < 4 ? [...answers.brandFeelings, feeling] : answers.brandFeelings);
  }

  function createWebsite() {
    const tier = modelTierForJourney(answers);
    createProject.mutate(
      {
        name: answers.businessName.trim(),
        siteType: siteTypeForJourney(answers.businessModel),
        journey: answers,
        shareDataWithProjectId: shareDataWith || undefined,
      },
      {
        onSuccess: (project) => {
          try {
            localStorage.removeItem(DRAFT_KEY);
            sessionStorage.removeItem('sitecraft.start_prefill');
            sessionStorage.setItem(`sitecraft.journey_autostart.${project.id}`, JSON.stringify({ tier, createdAt: Date.now() }));
          } catch {}
          router.replace(`/projects/${project.id}?journey=1&tier=${tier}`);
        },
        onError: (error) => toast.error('We saved your answers, but could not start the build.', { description: error instanceof Error ? error.message : 'Please try again.' }),
      }
    );
  }

  if (!hydrated || userLoading) return <JourneyLoading />;

  return (
    <div className="relative min-h-[calc(100vh-5rem)] overflow-hidden pb-10">
      <div className="pointer-events-none absolute -left-48 top-24 h-96 w-96 rounded-full bg-violet-600/10 blur-3xl" />
      <div className="pointer-events-none absolute -right-40 bottom-16 h-96 w-96 rounded-full bg-cyan-500/10 blur-3xl" />

      {reward && (
        <div className="fixed left-1/2 top-20 z-50 flex -translate-x-1/2 items-center gap-2 rounded-full border border-emerald-300/20 bg-emerald-950/95 px-4 py-2.5 text-sm font-medium text-emerald-200 shadow-2xl backdrop-blur">
          <CheckCircle2 className="h-4 w-4" />{reward}
        </div>
      )}

      <div className="relative mx-auto max-w-7xl px-4 py-6 md:px-6 md:py-10">
        <header className="mb-8 flex items-center justify-between gap-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-fuchsia-500 shadow-lg shadow-violet-950/30"><WandSparkles className="h-5 w-5 text-white" /></div>
            <div><p className="text-sm font-semibold text-white">Website Journey</p><p className="text-xs text-slate-500">Your answers save automatically</p></div>
          </div>
          <button type="button" onClick={() => router.push('/dashboard')} className="rounded-full border border-white/10 px-4 py-2 text-xs font-medium text-slate-400 transition hover:bg-white/5 hover:text-white">Save & exit</button>
        </header>

        <div className="mb-7">
          <div className="flex items-center justify-between text-xs"><span className="font-medium text-violet-300">Step {currentStep + 1} of {STEP_META.length}</span><span className="text-slate-500">{progress}% of your plan ready</span></div>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/[0.06]"><div className="h-full rounded-full bg-gradient-to-r from-violet-500 via-fuchsia-400 to-cyan-400 transition-all duration-500" style={{ width: `${Math.max(progress, 4)}%` }} /></div>
        </div>

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
          <main className="rounded-[32px] border border-white/10 bg-[#0b0e1a]/90 p-6 shadow-2xl shadow-black/20 backdrop-blur md:p-9">
            <div className="min-h-[590px]">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-violet-300">{meta.eyebrow}</p>
              <h1 className="mt-3 max-w-3xl text-3xl font-semibold tracking-[-0.035em] text-white md:text-5xl">{meta.title}</h1>
              <p className="mt-4 max-w-2xl text-sm leading-6 text-slate-400 md:text-base">{meta.note}</p>

              <div className="mt-8">{renderStep()}</div>
            </div>

            {currentStep === STEP_META.length - 1 && (existingProjects?.length ?? 0) > 0 && (
              <div className="mb-5 rounded-2xl border border-white/10 bg-white/[0.03] p-5">
                <p className="text-sm font-semibold text-white">Customer data</p>
                <p className="mt-1 text-sm leading-6 text-slate-400">
                  Is this another site for a business you already have here? If so it can share one
                  customer list, booking diary and order queue. Separate businesses should stay apart.
                </p>
                <label className="mt-4 block">
                  <span className="mb-2 block text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Share customers, bookings and orders with
                  </span>
                  <select
                    value={shareDataWith}
                    onChange={(event) => setShareDataWith(event.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-[#0b0e1a] px-4 py-3 text-sm text-white"
                  >
                    <option value="">Keep this project's data separate (recommended)</option>
                    {existingProjects?.map((project) => (
                      <option key={project.id} value={project.id}>
                        {project.name}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
            )}

            {validationMessage && <p role="alert" className="mb-4 rounded-xl border border-rose-400/20 bg-rose-400/[0.07] px-4 py-3 text-sm text-rose-200">{validationMessage}</p>}
            <div className="flex items-center justify-between border-t border-white/10 pt-6">
              <button type="button" onClick={() => setCurrentStep((step) => Math.max(0, step - 1))} disabled={currentStep === 0 || createProject.isPending} className="inline-flex min-h-11 items-center gap-2 rounded-full px-4 text-sm font-medium text-slate-400 transition hover:bg-white/5 hover:text-white disabled:pointer-events-none disabled:opacity-0"><ArrowLeft className="h-4 w-4" />Back</button>
              {currentStep < STEP_META.length - 1 ? (
                <button type="button" onClick={goNext} className="inline-flex min-h-12 items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-semibold text-slate-950 transition hover:-translate-y-0.5 hover:bg-violet-100">Keep going <ArrowRight className="h-4 w-4" /></button>
              ) : (
                <button type="button" onClick={createWebsite} disabled={createProject.isPending} className="inline-flex min-h-12 items-center gap-2 rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-500 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-violet-950/30 transition hover:-translate-y-0.5 disabled:opacity-60">
                  {createProject.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                  {createProject.isPending ? 'Preparing your build…' : 'Create my website'}
                </button>
              )}
            </div>
          </main>

          <aside className="space-y-4 xl:sticky xl:top-6 xl:self-start">
            <div className="overflow-hidden rounded-[28px] border border-white/10 bg-[#0b0e1a]/90 p-5">
              <div className="flex items-center justify-between"><div><p className="text-xs font-semibold uppercase tracking-[0.16em] text-cyan-300">Your site is learning</p><h2 className="mt-1 font-semibold text-white">Website readiness</h2></div><div className="flex h-12 w-12 items-center justify-center rounded-full border border-cyan-300/20 bg-cyan-300/[0.07] text-sm font-bold text-cyan-200">{readiness}%</div></div>
              <div className="mt-5 space-y-3">
                {[
                  [Building2, answers.businessName || 'Business identity'],
                  [CircleDollarSign, answers.offer ? 'Offer understood' : 'Offer comes next'],
                  [Users, answers.idealCustomer ? 'Customer understood' : 'Customer still open'],
                  [Target, ACTIONS.find((item) => item.id === answers.primaryAction)?.label || 'Primary action'],
                ].map(([Icon, label]) => {
                  const ItemIcon = Icon as typeof Building2;
                  return <div key={String(label)} className="flex items-center gap-3 rounded-xl bg-white/[0.03] px-3 py-2.5"><ItemIcon className="h-4 w-4 flex-none text-violet-300" /><span className="truncate text-xs text-slate-400">{String(label)}</span></div>;
                })}
              </div>
            </div>

            <div className="rounded-[28px] border border-white/10 bg-[#0b0e1a]/80 p-5">
              <div className="flex items-center gap-2 text-sm font-semibold text-white"><Sparkles className="h-4 w-4 text-amber-300" />Why we ask</div>
              <p className="mt-3 text-xs leading-5 text-slate-500">Every answer removes guesswork from the copy, design, pages, and business system. If you skip an optional detail, the AI uses a clearly marked placeholder instead of making up facts.</p>
            </div>

            <div className="flex items-center justify-center gap-5 text-[11px] text-slate-600"><span className="flex items-center gap-1.5"><Clock3 className="h-3.5 w-3.5" />About 4 minutes</span><span className="flex items-center gap-1.5"><BadgeCheck className="h-3.5 w-3.5" />No technical questions</span></div>
          </aside>
        </div>
      </div>
    </div>
  );

  function renderStep() {
    if (currentStep === 0) return (
      <div className="space-y-7">
        <div className="grid gap-3 sm:grid-cols-3">
          {[
            ['new', 'Starting something new', 'Turn the idea into a clear first presence'],
            ['established', 'Growing an established business', 'Build around what already works'],
            ['replace', 'Replacing an old website', 'Keep the truth; upgrade the experience'],
          ].map(([id, label, detail]) => <button key={id} type="button" onClick={() => update('stage', id as WebsiteJourneyAnswers['stage'])} className={`rounded-2xl border p-4 text-left transition ${answers.stage === id ? 'border-violet-400/50 bg-violet-500/10 shadow-lg shadow-violet-950/20' : 'border-white/10 bg-white/[0.025] hover:border-white/20'}`}><span className="text-sm font-semibold text-white">{label}</span><span className="mt-2 block text-xs leading-5 text-slate-500">{detail}</span>{answers.stage === id && <Check className="mt-4 h-4 w-4 text-violet-300" />}</button>)}
        </div>
        <div><p className="mb-3 text-sm font-semibold text-slate-200">What kind of business is this?</p><div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{BUSINESS_MODELS.map((model) => <button key={model.id} type="button" onClick={() => update('businessModel', model.id)} className={`flex items-start gap-3 rounded-2xl border p-4 text-left transition ${answers.businessModel === model.id ? 'border-cyan-300/40 bg-cyan-300/[0.07]' : 'border-white/10 bg-white/[0.025] hover:border-white/20'}`}><model.icon className={`mt-0.5 h-5 w-5 flex-none ${answers.businessModel === model.id ? 'text-cyan-300' : 'text-slate-600'}`} /><span><span className="block text-sm font-semibold text-white">{model.label}</span><span className="mt-1 block text-xs leading-5 text-slate-500">{model.detail}</span></span></button>)}</div></div>
      </div>
    );

    if (currentStep === 1) return <div className="grid gap-5 md:grid-cols-2"><Field label="Business name" value={answers.businessName} onChange={(value) => update('businessName', value)} placeholder="Example: Harbor & Pine Plumbing" /><Field label="What does the business do?" value={answers.industry} onChange={(value) => update('industry', value)} placeholder="Residential plumbing and drain repair" /><div className="md:col-span-2"><Field label="Where do you serve customers?" optional value={answers.location} onChange={(value) => update('location', value)} placeholder="Savannah and surrounding coastal communities" hint="A city, service area, or 'online worldwide' is enough." /></div></div>;

    if (currentStep === 2) return <div className="grid gap-5"><Field label="What can customers hire you for or buy?" value={answers.offer} onChange={(value) => update('offer', value)} placeholder="Emergency repairs, water heater installation, and preventative maintenance for homeowners" multiline /><Field label="What should we feature first?" optional value={answers.featuredOffer} onChange={(value) => update('featuredOffer', value)} placeholder="Same-day service with clear pricing before work begins" hint="Use your strongest service, product, package, or promotion." /></div>;

    if (currentStep === 3) return <div className="grid gap-5"><Field label="Who is the ideal customer?" value={answers.idealCustomer} onChange={(value) => update('idealCustomer', value)} placeholder="Busy homeowners who value reliable work and do not want surprise charges" multiline /><Field label="What are they worried about or trying to solve?" value={answers.customerProblem} onChange={(value) => update('customerProblem', value)} placeholder="They need the issue fixed quickly, but they worry about no-shows, unclear pricing, and messy work" multiline /></div>;

    if (currentStep === 4) return <div className="grid gap-5"><Field label="What proof can the website use?" optional value={answers.proof} onChange={(value) => update('proof', value)} placeholder="Licensed and insured, 4.9-star customer rating, workmanship guarantee, locally owned" multiline hint="Reviews, results, credentials, guarantees, recognizable clients, or a strong process all count." /><Field label="Years of experience" optional value={answers.yearsInBusiness} onChange={(value) => update('yearsInBusiness', value)} placeholder="12" /></div>;

    if (currentStep === 5) return <div className="space-y-6"><div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{ACTIONS.map((action) => <button key={action.id} type="button" onClick={() => update('primaryAction', action.id)} className={`rounded-2xl border p-4 text-left transition ${answers.primaryAction === action.id ? 'border-violet-400/50 bg-violet-500/10' : 'border-white/10 bg-white/[0.025] hover:border-white/20'}`}><span className="flex items-center justify-between gap-3 text-sm font-semibold text-white">{action.label}{answers.primaryAction === action.id && <Check className="h-4 w-4 text-violet-300" />}</span><span className="mt-2 block text-xs leading-5 text-slate-500">{action.detail}</span></button>)}</div><Field label="Contact details customers may use" optional value={answers.contactDetails} onChange={(value) => update('contactDetails', value)} placeholder="Phone, email, hours, address, or booking instructions" multiline hint="Only enter information you want displayed on the website." /><div className="rounded-2xl border border-cyan-300/15 bg-cyan-300/[0.045] p-4"><p className="text-xs font-semibold uppercase tracking-[0.16em] text-cyan-300">Smart connection</p><p className="mt-2 text-sm font-semibold text-white">{backend.title}</p><p className="mt-1 text-xs leading-5 text-slate-400">{backend.description}</p></div></div>;

    if (currentStep === 6) return <div className="space-y-6"><div><p className="text-sm font-semibold text-slate-200">Choose up to four feelings.</p><div className="mt-3 flex flex-wrap gap-2">{FEELINGS.map((feeling) => <button key={feeling} type="button" onClick={() => toggleFeeling(feeling)} className={`min-h-10 rounded-full border px-4 py-2 text-sm font-medium transition ${answers.brandFeelings.includes(feeling) ? 'border-fuchsia-300/40 bg-fuchsia-300/10 text-fuchsia-100' : 'border-white/10 bg-white/[0.025] text-slate-400 hover:text-white'}`}>{answers.brandFeelings.includes(feeling) && <Check className="mr-1.5 inline h-3.5 w-3.5" />}{feeling}</button>)}</div></div><div className="grid gap-5 md:grid-cols-2"><Field label="Color direction" optional value={answers.colorPreference} onChange={(value) => update('colorPreference', value)} placeholder="Deep green, cream, and warm copper" /><Field label="A website you like" optional value={answers.inspirationUrl} onChange={(value) => update('inspirationUrl', value)} placeholder="https://example.com" /></div><Field label="Anything you do not want?" optional value={answers.avoid} onChange={(value) => update('avoid', value)} placeholder="No stock photos of handshakes, no overly dark pages, no jargon" /></div>;

    return (
      <div className="space-y-5">
        <div className="flex items-start gap-4 rounded-2xl border border-emerald-300/20 bg-emerald-300/[0.06] p-5">
          <PartyPopper className="mt-0.5 h-6 w-6 flex-none text-emerald-300" />
          <div>
            <p className="font-semibold text-emerald-100">Your answers are now a production-ready website brief.</p>
            <p className="mt-1 text-sm leading-6 text-emerald-100/60">Site Craft will use the details you supplied, infer sensible structure, and never invent business facts you did not provide.</p>
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-2xl border border-white/10 bg-white/[0.025] p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-violet-300">Recommended pages</p>
            <div className="mt-4 space-y-2">
              {pages.map((page) => (
                <div key={page} className="flex items-center gap-2 text-sm text-slate-300">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                  {page}
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/[0.025] p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-cyan-300">Connected operations</p>
            <p className="mt-4 text-sm font-semibold text-white">{backend.title}</p>
            <p className="mt-2 text-xs leading-5 text-slate-500">{backend.description}</p>
            <div className="mt-4 flex items-center gap-2 text-xs font-medium text-emerald-300">
              <ChevronRight className="h-4 w-4" />
              Suggested automatically after the build
            </div>
          </div>
        </div>
        <div>
          <p className="text-sm font-semibold text-slate-200">Choose your generation power</p>
          <div className="mt-3 grid gap-3 md:grid-cols-2">
            <button
              type="button"
              onClick={() => update('buildQuality', 'smart')}
              className={`rounded-2xl border p-4 text-left transition ${answers.buildQuality === 'smart' ? 'border-emerald-300/40 bg-emerald-300/[0.07]' : 'border-white/10 bg-white/[0.025]'}`}
            >
              <span className="flex items-center gap-2 text-sm font-semibold text-white">
                Standard
                <span className="rounded-full bg-emerald-300/10 px-2 py-0.5 text-[10px] text-emerald-300">Recommended</span>
              </span>
              <span className="mt-2 block text-xs leading-5 text-slate-500">Excellent quality with a faster build time for most websites.</span>
            </button>
            <button
              type="button"
              onClick={() => update('buildQuality', 'ultra')}
              className={`rounded-2xl border p-4 text-left transition ${answers.buildQuality === 'ultra' ? 'border-amber-300/40 bg-amber-300/[0.07]' : 'border-white/10 bg-white/[0.025]'}`}
            >
              <span className="flex items-center gap-2 text-sm font-semibold text-white">
                Power Mode
                <span className="rounded-full bg-amber-300/10 px-2 py-0.5 text-[10px] font-bold text-amber-300">MORE POWER</span>
              </span>
              <span className="mt-2 block text-xs leading-5 text-slate-500">Adds deeper reasoning for complex pages, interactions, and high-detail builds.</span>
            </button>
          </div>
        </div>
        <div className="rounded-2xl bg-black/20 px-4 py-3 text-xs text-slate-500">
          Selected engine:{' '}
          <span className="font-medium text-slate-300">
            {modelTierForJourney(answers) === 'architect' ? 'Power Mode' : 'Standard'}
          </span>
        </div>
      </div>
    );
  }
}
