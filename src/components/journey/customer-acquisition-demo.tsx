'use client';

import { useMemo, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronRight,
  Clock3,
  Compass,
  Film,
  Mail,
  MessageSquareText,
  Phone,
  Play,
  RotateCcw,
  ShieldCheck,
  Sparkles,
  Target,
  WandSparkles,
} from 'lucide-react';

type Screen =
  | 'opening'
  | 'business'
  | 'goal'
  | 'insight'
  | 'decision'
  | 'ai-intro'
  | 'ai-preview'
  | 'service-intro'
  | 'lead'
  | 'calendar'
  | 'confirmation';

type BusinessKey = 'service' | 'creator' | 'shop' | 'professional';
type GoalKey = 'leads' | 'trust' | 'content' | 'launch';

type Lead = {
  name: string;
  business: string;
  email: string;
  phone: string;
  goal: string;
  smsConsent: boolean;
};

const businesses: Array<{
  id: BusinessKey;
  label: string;
  detail: string;
  icon: typeof Target;
}> = [
  { id: 'service', label: 'Home services', detail: 'Landscaping, remodeling, HVAC, electrical, plumbing', icon: Target },
  { id: 'creator', label: 'Cleaning & property care', detail: 'Residential, commercial, detailing, maintenance', icon: Film },
  { id: 'shop', label: 'Beauty & wellness', detail: 'Salon, spa, fitness, personal care, mobile services', icon: Sparkles },
  { id: 'professional', label: 'Local professional', detail: 'Real estate, consulting, legal, finance, specialty firms', icon: Compass },
];

const goals: Array<{ id: GoalKey; label: string; detail: string }> = [
  { id: 'leads', label: 'Book more of the right jobs', detail: 'Turn interest into good-fit phone calls, estimate requests, and appointments.' },
  { id: 'trust', label: 'Win higher-value work', detail: 'Look established before you answer the phone so price is not the whole conversation.' },
  { id: 'content', label: 'Make my proof look premium', detail: 'Turn job photos, reviews, and raw phone clips into trust-building content.' },
  { id: 'launch', label: 'Fill slow weeks more consistently', detail: 'Give referrals and local customers a clear reason to call you next.' },
];

const insightByBusiness: Record<BusinessKey, {
  eyebrow: string;
  title: string;
  body: string;
  proofLabel: string;
  proofMetric: string;
  proofDetail: string;
}> = {
  service: {
    eyebrow: 'The clearest place to start',
    title: 'Your best jobs should sell the next one.',
    body: 'The finished work, before-and-after clips, customer reviews, and service details already contain the sales story. A focused website and booking path can turn that raw proof into trust before the phone rings.',
    proofLabel: 'Home-service proof transformation',
    proofMetric: '1 job',
    proofDetail: 'becomes a website story, review proof, and weeks of social content',
  },
  creator: {
    eyebrow: 'The clearest place to start',
    title: 'Make every finished job carry its weight.',
    body: 'Clean spaces, property transformations, repeat-client reviews, and simple process clips can become a premium proof library that keeps working between appointments.',
    proofLabel: 'Property-care proof transformation',
    proofMetric: '1 job',
    proofDetail: 'becomes before-and-after proof, a service page story, and follow-up posts',
  },
  shop: {
    eyebrow: 'The clearest place to start',
    title: 'Let the transformation speak first.',
    body: 'Client reactions, before-and-after moments, service detail, and authentic phone footage can become polished proof that gives the next customer confidence to book.',
    proofLabel: 'Beauty-and-wellness proof transformation',
    proofMetric: '1 visit',
    proofDetail: 'becomes a testimonial, a service story, and polished social clips',
  },
  professional: {
    eyebrow: 'The clearest place to start',
    title: 'Turn good work into visible authority.',
    body: 'Case outcomes, client feedback, practical explanations, and a clear service-area page can help the right person trust you before making the call.',
    proofLabel: 'Local-professional proof transformation',
    proofMetric: '1 win',
    proofDetail: 'becomes useful proof, a clear service story, and referral-ready content',
  },
};

const goalCopy: Record<GoalKey, string> = {
  leads: 'The page should move the right customer from before-and-after proof to one clear call or estimate request.',
  trust: 'Show the standard of the work first so local customers have a reason to call you—not the next name on Google.',
  content: 'The website and videos should reuse the same finished-job proof so each post strengthens the next referral.',
  launch: 'A clear service area, strong reviews, and fresh job proof can help keep the crew calendar steadier during slow weeks.',
};

const defaultLead: Lead = {
  name: '',
  business: '',
  email: '',
  phone: '',
  goal: '',
  smsConsent: false,
};

export function CustomerAcquisitionDemo() {
  const [screen, setScreen] = useState<Screen>('opening');
  const [business, setBusiness] = useState<BusinessKey | null>(null);
  const [goal, setGoal] = useState<GoalKey | null>(null);
  const [lead, setLead] = useState<Lead>(defaultLead);
  const [calendarDay, setCalendarDay] = useState('Tue 29');
  const [calendarTime, setCalendarTime] = useState('11:30 AM');

  const insight = business ? insightByBusiness[business] : insightByBusiness.service;
  const businessLabel = businesses.find((item) => item.id === business)?.label || 'your business';
  const goalLabel = goals.find((item) => item.id === goal)?.label || 'your next goal';

  const progress = useMemo(() => {
    if (screen === 'opening') return 0;
    if (screen === 'business') return 1;
    if (screen === 'goal') return 2;
    if (screen === 'insight') return 3;
    return 4;
  }, [screen]);

  function chooseBusiness(value: BusinessKey) {
    setBusiness(value);
    setLead((current) => ({ ...current, business: current.business || businesses.find((item) => item.id === value)?.label || '' }));
    setScreen('goal');
  }

  function chooseGoal(value: GoalKey) {
    setGoal(value);
    setLead((current) => ({ ...current, goal: current.goal || goals.find((item) => item.id === value)?.label || '' }));
    setScreen('insight');
  }

  function restart() {
    setScreen('opening');
    setBusiness(null);
    setGoal(null);
    setLead(defaultLead);
    setCalendarDay('Tue 29');
    setCalendarTime('11:30 AM');
  }

  return (
    <main className="min-h-screen overflow-hidden bg-[#f1efe9] text-[#171714]">
      <header className="relative z-20 border-b border-black/10 bg-[#f1efe9]/95 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5 md:px-8">
          <button
            type="button"
            onClick={restart}
            className="group flex items-center gap-3 text-left"
            aria-label="Restart the journey"
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#171714] text-xs font-black text-white">IM</span>
            <span>
              <span className="block text-sm font-semibold tracking-[-0.02em]">Innovated Marketing</span>
              <span className="hidden text-[10px] uppercase tracking-[0.18em] text-black/40 sm:block">Customer acquisition, designed</span>
            </span>
          </button>
          <div className="flex items-center gap-3">
            <div className="hidden items-center gap-2 text-xs text-black/45 sm:flex">
              <ShieldCheck className="h-3.5 w-3.5" />
              Local journey preview
            </div>
            {screen !== 'opening' && (
              <button
                type="button"
                onClick={restart}
                className="inline-flex items-center gap-1.5 rounded-full border border-black/10 px-3 py-1.5 text-xs font-medium text-black/55 transition hover:border-black/25 hover:text-black"
              >
                <RotateCcw className="h-3 w-3" />
                Start over
              </button>
            )}
          </div>
        </div>
        {progress > 0 && (
          <div className="absolute inset-x-0 bottom-0 h-px bg-black/5">
            <div
              className="h-px bg-[#d44b2e] transition-all duration-700"
              style={{ width: `${progress * 25}%` }}
            />
          </div>
        )}
      </header>

      {screen === 'opening' && (
        <Opening onContinue={() => setScreen('business')} />
      )}

      {screen === 'business' && (
        <QuestionShell
          step="01"
          eyebrow="Let’s make this useful"
          title="What kind of local work are we helping sell?"
          description="Choose the closest fit. We’ll shape the proof and booking journey around the way your customers decide."
          onBack={() => setScreen('opening')}
        >
          <div className="grid gap-3 sm:grid-cols-2">
            {businesses.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => chooseBusiness(item.id)}
                  className="group flex min-h-32 items-start gap-4 rounded-2xl border border-black/10 bg-white/55 p-5 text-left transition duration-300 hover:-translate-y-0.5 hover:border-black/25 hover:bg-white"
                >
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-black/10 bg-[#f7f4ed]">
                    <Icon className="h-4 w-4" />
                  </span>
                  <span>
                    <span className="block font-semibold tracking-tight">{item.label}</span>
                    <span className="mt-2 block text-sm leading-5 text-black/50">{item.detail}</span>
                  </span>
                </button>
              );
            })}
          </div>
        </QuestionShell>
      )}

      {screen === 'goal' && (
        <QuestionShell
          step="02"
          eyebrow={`For a ${businessLabel.toLowerCase()}`}
          title="What would make the biggest difference right now?"
          description="Pick the result that would make the biggest difference to the phone calls, estimates, and crew calendar."
          onBack={() => setScreen('business')}
        >
          <div className="space-y-3">
            {goals.map((item, index) => (
              <button
                key={item.id}
                type="button"
                onClick={() => chooseGoal(item.id)}
                className="group grid w-full grid-cols-[34px_1fr_auto] items-center gap-3 rounded-2xl border border-black/10 bg-white/55 p-4 text-left transition duration-300 hover:border-black/25 hover:bg-white sm:p-5"
              >
                <span className="font-serif text-lg italic text-[#d44b2e]">0{index + 1}</span>
                <span>
                  <span className="block font-semibold tracking-tight">{item.label}</span>
                  <span className="mt-1 block text-sm leading-5 text-black/45">{item.detail}</span>
                </span>
                <ArrowRight className="h-4 w-4 text-black/25 transition group-hover:translate-x-1 group-hover:text-black" />
              </button>
            ))}
          </div>
        </QuestionShell>
      )}

      {screen === 'insight' && business && goal && (
        <InsightScreen
          insight={insight}
          businessLabel={businessLabel}
          goalCopy={goalCopy[goal]}
          onBack={() => setScreen('goal')}
          onContinue={() => setScreen('decision')}
        />
      )}

      {screen === 'decision' && (
        <DecisionScreen
          businessLabel={businessLabel}
          goalLabel={goalLabel}
          onBack={() => setScreen('insight')}
          onAi={() => setScreen('ai-intro')}
          onService={() => setScreen('service-intro')}
        />
      )}

      {screen === 'ai-intro' && (
        <AiIntro
          businessLabel={businessLabel}
          goalLabel={goalLabel}
          onBack={() => setScreen('decision')}
          onContinue={() => setScreen('ai-preview')}
        />
      )}

      {screen === 'ai-preview' && (
        <AiPreview businessLabel={businessLabel} onBack={() => setScreen('ai-intro')} onRestart={restart} />
      )}

      {screen === 'service-intro' && (
        <ServiceIntro
          businessLabel={businessLabel}
          goalLabel={goalLabel}
          onBack={() => setScreen('decision')}
          onContinue={() => setScreen('lead')}
        />
      )}

      {screen === 'lead' && (
        <LeadScreen
          lead={lead}
          setLead={setLead}
          onBack={() => setScreen('service-intro')}
          onContinue={() => setScreen('calendar')}
        />
      )}

      {screen === 'calendar' && (
        <CalendarScreen
          name={lead.name}
          day={calendarDay}
          time={calendarTime}
          setDay={setCalendarDay}
          setTime={setCalendarTime}
          onBack={() => setScreen('lead')}
          onContinue={() => setScreen('confirmation')}
        />
      )}

      {screen === 'confirmation' && (
        <Confirmation
          lead={lead}
          day={calendarDay}
          time={calendarTime}
          onRestart={restart}
        />
      )}
    </main>
  );
}

function Opening({ onContinue }: { onContinue: () => void }) {
  return (
    <section className="relative min-h-[calc(100vh-4rem)]">
      <div className="absolute inset-y-0 right-0 hidden w-[42%] bg-[#171714] lg:block" />
      <div className="relative mx-auto grid min-h-[calc(100vh-4rem)] max-w-7xl lg:grid-cols-[58%_42%]">
        <div className="flex items-center px-5 py-12 md:px-8 lg:py-10">
          <div className="max-w-3xl">
            <div className="animate-fade-in inline-flex items-center gap-2 rounded-full border border-black/10 bg-white/50 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-black/55">
              <span className="h-1.5 w-1.5 rounded-full bg-[#d44b2e]" />
              You found the card. Here’s the idea behind it.
            </div>
            <h1 className="mt-5 max-w-4xl font-serif text-5xl leading-[0.94] tracking-[-0.055em] sm:text-6xl md:text-7xl lg:text-[5.2rem]">
              Turn the work you already do into
              <span className="block italic text-[#d44b2e]">the customers you want next.</span>
            </h1>
            <p className="mt-5 max-w-xl text-base leading-7 text-black/55 md:text-lg">
              Your best jobs should sell the next one. We turn job photos, before-and-after phone clips, reviews, and service details into a premium website, polished videos, and one clear path to call or request an estimate.
            </p>
            <button
              type="button"
              onClick={onContinue}
              className="group mt-7 inline-flex items-center gap-3 rounded-full bg-[#171714] px-6 py-3.5 text-sm font-semibold text-white transition hover:bg-[#d44b2e]"
            >
              Show me the transformation
              <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
            </button>
            <div className="mt-8 flex flex-wrap gap-x-7 gap-y-3 text-xs text-black/45">
              {['Proof that earns trust', 'A website that helps win calls', 'A clear path to booked work'].map((item) => (
                <span key={item} className="inline-flex items-center gap-2">
                  <Check className="h-3.5 w-3.5 text-[#d44b2e]" />
                  {item}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="relative min-h-[440px] overflow-hidden bg-[#171714] p-6 text-white lg:min-h-0 lg:p-8">
          <div className="absolute inset-0 opacity-40 [background-image:linear-gradient(rgba(255,255,255,.06)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.06)_1px,transparent_1px)] [background-size:42px_42px]" />
          <div className="relative flex h-full items-center justify-center">
            <div className="relative w-full max-w-md">
              <div className="absolute -left-8 -top-12 font-serif text-[9rem] leading-none text-white/[0.04]">01</div>
              <div className="relative rotate-[-2deg] rounded-[28px] border border-white/15 bg-[#252521] p-5 shadow-2xl shadow-black/30">
                <div className="flex items-center justify-between">
                  <div className="text-xs font-semibold uppercase tracking-[0.18em] text-white/45">Harbor & Stone</div>
                  <div className="rounded-full bg-[#d44b2e] px-2.5 py-1 text-[9px] font-semibold uppercase tracking-wider">Now booking</div>
                </div>
                <div className="mt-12 font-serif text-4xl leading-[0.96]">
                  Outdoor spaces
                  <span className="block italic text-[#e9b9a9]">made for living.</span>
                </div>
                <div className="mt-5 h-px bg-white/10" />
                <div className="mt-5 grid grid-cols-3 gap-2">
                  <div className="col-span-2 h-28 rounded-xl bg-gradient-to-br from-[#4b604c] to-[#222d24]" />
                  <div className="h-28 rounded-xl bg-gradient-to-b from-[#9c7658] to-[#4c3528]" />
                </div>
              </div>
              <div className="absolute -bottom-10 -right-5 w-52 rotate-[4deg] rounded-2xl border border-white/10 bg-[#f0ede4] p-4 text-[#171714] shadow-2xl">
                <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-black/45">
                  <Play className="h-3 w-3 fill-[#d44b2e] text-[#d44b2e]" />
                  Customer story
                </div>
                <div className="mt-6 font-serif text-xl italic leading-tight">“They made the whole yard feel like home.”</div>
                <div className="mt-4 text-[10px] text-black/40">30-sec social edit · captions · proof</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function QuestionShell({
  step,
  eyebrow,
  title,
  description,
  onBack,
  children,
}: {
  step: string;
  eyebrow: string;
  title: string;
  description: string;
  onBack: () => void;
  children: React.ReactNode;
}) {
  return (
    <section className="mx-auto grid min-h-[calc(100vh-4rem)] max-w-6xl items-center gap-10 px-5 py-12 md:px-8 lg:grid-cols-[0.76fr_1.24fr] lg:py-16">
      <div className="max-w-md">
        <div className="font-serif text-6xl italic text-[#d44b2e]/25">{step}</div>
        <div className="-mt-3 text-xs font-semibold uppercase tracking-[0.18em] text-[#d44b2e]">{eyebrow}</div>
        <h1 className="mt-4 font-serif text-4xl leading-[1.02] tracking-[-0.04em] md:text-5xl">{title}</h1>
        <p className="mt-5 text-sm leading-6 text-black/50">{description}</p>
        <button type="button" onClick={onBack} className="mt-8 inline-flex items-center gap-2 text-sm text-black/45 hover:text-black">
          <ArrowLeft className="h-4 w-4" />
          Back
        </button>
      </div>
      <div>{children}</div>
    </section>
  );
}

function InsightScreen({
  insight,
  businessLabel,
  goalCopy,
  onBack,
  onContinue,
}: {
  insight: (typeof insightByBusiness)[BusinessKey];
  businessLabel: string;
  goalCopy: string;
  onBack: () => void;
  onContinue: () => void;
}) {
  return (
    <section className="mx-auto max-w-7xl px-5 py-10 md:px-8 md:py-16">
      <div className="grid items-center gap-10 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="max-w-xl">
          <div className="text-xs font-semibold uppercase tracking-[0.18em] text-[#d44b2e]">{insight.eyebrow}</div>
          <h1 className="mt-4 font-serif text-4xl leading-[1] tracking-[-0.045em] md:text-6xl">{insight.title}</h1>
          <p className="mt-6 text-base leading-7 text-black/55">{insight.body}</p>
          <div className="mt-6 border-l-2 border-[#d44b2e] pl-4 text-sm leading-6 text-black/65">{goalCopy}</div>
          <button
            type="button"
            onClick={onContinue}
            className="group mt-8 inline-flex items-center gap-3 rounded-full bg-[#171714] px-6 py-3.5 text-sm font-semibold text-white transition hover:bg-[#d44b2e]"
          >
            Show me my two paths
            <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
          </button>
          <button type="button" onClick={onBack} className="ml-4 text-sm text-black/40 hover:text-black">Back</button>
        </div>

        <div className="relative min-h-[520px] overflow-hidden rounded-[32px] bg-[#1b1b18] p-5 text-white shadow-2xl shadow-black/10 md:p-8">
          <div className="absolute inset-0 opacity-20 [background-image:radial-gradient(rgba(255,255,255,.3)_1px,transparent_1px)] [background-size:24px_24px]" />
          <div className="relative">
            <div className="flex items-center justify-between text-xs uppercase tracking-[0.16em] text-white/40">
              <span>{insight.proofLabel}</span>
              <span>Selected work</span>
            </div>
            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl bg-[#ece5d7] p-4 text-[#171714]">
                <div className="text-[9px] font-semibold uppercase tracking-[0.16em] text-black/35">Before</div>
                <div className="mt-7 text-lg font-bold">We offer quality service.</div>
                <div className="mt-3 space-y-2">
                  <div className="h-2 w-full rounded bg-black/10" />
                  <div className="h-2 w-4/5 rounded bg-black/10" />
                  <div className="h-16 rounded-lg bg-black/5" />
                </div>
                <div className="mt-5 inline-block rounded bg-black/10 px-3 py-2 text-[10px]">Learn more</div>
              </div>
              <div className="rounded-2xl bg-[#384537] p-4">
                <div className="text-[9px] font-semibold uppercase tracking-[0.16em] text-white/45">After</div>
                <div className="mt-7 font-serif text-2xl leading-tight">A clear promise, backed by proof.</div>
                <div className="mt-6 flex gap-2">
                  <div className="h-16 flex-1 rounded-lg bg-[#c8996b]" />
                  <div className="h-16 w-16 rounded-lg bg-white/10" />
                </div>
                <div className="mt-5 inline-flex rounded-full bg-white px-3 py-2 text-[10px] font-semibold text-[#171714]">Request an estimate</div>
              </div>
            </div>
            <div className="mt-4 grid gap-4 sm:grid-cols-[1fr_0.72fr]">
              <div className="rounded-2xl border border-white/10 bg-white/[0.05] p-5">
                <div className="flex items-center gap-2 text-xs text-white/45"><Film className="h-3.5 w-3.5" /> Raw phone clip → customer story</div>
                <div className="mt-8 grid grid-cols-3 gap-2">
                  <div className="aspect-[4/5] rounded-lg bg-gradient-to-b from-[#82624c] to-[#30231d]" />
                  <div className="aspect-[4/5] rounded-lg bg-gradient-to-b from-[#48624c] to-[#1f2e23]" />
                  <div className="aspect-[4/5] rounded-lg bg-gradient-to-b from-[#3e4d60] to-[#1e2530]" />
                </div>
              </div>
              <div className="flex flex-col justify-between rounded-2xl bg-[#d44b2e] p-5">
                <div className="text-xs uppercase tracking-[0.16em] text-white/65">Result</div>
                <div>
                  <div className="font-serif text-5xl italic">{insight.proofMetric}</div>
                  <div className="mt-2 text-xs leading-5 text-white/75">{insight.proofDetail}</div>
                </div>
              </div>
            </div>
            <div className="mt-5 text-[10px] leading-4 text-white/30">
              Preview shown to explain the idea. Calls and booked work vary by service, area, competition, reviews, and follow-through.
            </div>
          </div>
        </div>
      </div>
      <div className="mt-10 text-center text-xs uppercase tracking-[0.16em] text-black/30">
        Tailored for {businessLabel.toLowerCase()}
      </div>
    </section>
  );
}

function DecisionScreen({
  businessLabel,
  goalLabel,
  onBack,
  onAi,
  onService,
}: {
  businessLabel: string;
  goalLabel: string;
  onBack: () => void;
  onAi: () => void;
  onService: () => void;
}) {
  return (
    <section className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-7xl flex-col justify-center px-5 py-12 md:px-8">
      <div className="mx-auto max-w-3xl text-center">
        <div className="text-xs font-semibold uppercase tracking-[0.2em] text-[#d44b2e]">Your work. Your proof. Your choice.</div>
        <h1 className="mt-4 font-serif text-4xl tracking-[-0.045em] md:text-6xl">Want us to build it, or start it yourself?</h1>
        <p className="mx-auto mt-5 max-w-xl text-sm leading-6 text-black/50">
          Both paths use the same {businessLabel.toLowerCase()} proof to support {goalLabel.toLowerCase()}. The difference is who does the hands-on work.
        </p>
      </div>

      <div className="mt-10 grid gap-5 lg:grid-cols-2">
        <button
          type="button"
          onClick={onService}
          className="group relative overflow-hidden rounded-[30px] bg-[#171714] p-6 text-left text-white transition duration-500 hover:-translate-y-1 hover:bg-[#24241f] md:p-8"
        >
          <div className="absolute right-0 top-0 h-44 w-44 rounded-full bg-[#d44b2e]/15 blur-3xl" />
          <div className="relative">
            <div className="flex items-center justify-between">
              <span className="flex h-11 w-11 items-center justify-center rounded-full border border-white/15 bg-white/[0.05]"><Compass className="h-5 w-5" /></span>
              <span className="rounded-full bg-[#d44b2e] px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.14em]">Recommended</span>
            </div>
            <div className="mt-12 text-xs font-semibold uppercase tracking-[0.18em] text-[#e9aa94]">Done for you · built around your best work</div>
            <h2 className="mt-3 font-serif text-4xl tracking-[-0.035em]">Build my growth system</h2>
            <p className="mt-4 max-w-lg text-sm leading-6 text-white/50">
              We turn your finished jobs, reviews, service area, and raw phone clips into a polished website, proof videos, and a clear booking path.
            </p>
            <div className="mt-7 inline-flex items-center gap-2 text-sm font-semibold">
              See the done-for-you process
              <ChevronRight className="h-4 w-4" />
            </div>
          </div>
        </button>

        <button
          type="button"
          onClick={onAi}
          className="group relative overflow-hidden rounded-[30px] border border-black/10 bg-white/65 p-6 text-left transition duration-500 hover:-translate-y-1 hover:bg-white md:p-8"
        >
          <div className="flex items-center justify-between">
            <span className="flex h-11 w-11 items-center justify-center rounded-full bg-[#171714] text-white"><WandSparkles className="h-5 w-5" /></span>
            <ArrowRight className="h-5 w-5 text-black/25 transition group-hover:translate-x-1 group-hover:text-black" />
          </div>
          <div className="mt-12 text-xs font-semibold uppercase tracking-[0.18em] text-[#d44b2e]">Sitecraft self-serve · move at your pace</div>
          <h2 className="mt-3 font-serif text-4xl tracking-[-0.035em]">Start it myself</h2>
          <p className="mt-4 max-w-lg text-sm leading-6 text-black/50">
            Sitecraft guides you in turning your job proof into a strong website, customer stories, and a simple way for local customers to call or request an estimate.
          </p>
          <div className="mt-7 inline-flex items-center gap-2 text-sm font-semibold">
            Preview the guided build
            <ChevronRight className="h-4 w-4" />
          </div>
        </button>
      </div>
      <button type="button" onClick={onBack} className="mx-auto mt-8 inline-flex items-center gap-2 text-sm text-black/40 hover:text-black">
        <ArrowLeft className="h-4 w-4" /> Back to your insight
      </button>
    </section>
  );
}

function AiIntro({
  businessLabel,
  goalLabel,
  onBack,
  onContinue,
}: {
  businessLabel: string;
  goalLabel: string;
  onBack: () => void;
  onContinue: () => void;
}) {
  return (
    <PathShell tone="light" label="Start it myself · Sitecraft self-serve" onBack={onBack}>
      <div className="grid items-center gap-10 lg:grid-cols-[0.88fr_1.12fr]">
        <div>
          <div className="text-xs font-semibold uppercase tracking-[0.18em] text-[#d44b2e]">Sitecraft already knows the direction</div>
          <h1 className="mt-4 font-serif text-5xl leading-[0.98] tracking-[-0.05em] md:text-6xl">Start with your best work—not a blank screen.</h1>
          <p className="mt-6 text-sm leading-6 text-black/52">
            We carried forward your answers: {businessLabel.toLowerCase()}, focused on {goalLabel.toLowerCase()}. Sitecraft would ask for your service area, reviews, and a few strong job photos or clips, then show what it plans to make.
          </p>
          <button type="button" onClick={onContinue} className="group mt-8 inline-flex items-center gap-3 rounded-full bg-[#171714] px-6 py-3.5 text-sm font-semibold text-white hover:bg-[#d44b2e]">
            Show my Sitecraft preview
            <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
          </button>
        </div>
        <div className="rounded-[30px] border border-black/10 bg-white/60 p-5 shadow-xl shadow-black/5 md:p-7">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs font-semibold uppercase tracking-[0.16em] text-black/35">Your build brief</div>
              <div className="mt-2 font-serif text-2xl">A clear path to the next booked job</div>
            </div>
            <span className="rounded-full bg-emerald-700/10 px-3 py-1.5 text-xs font-semibold text-emerald-800">Ready to review</span>
          </div>
          <div className="mt-6 space-y-2">
            {[
              ['Promise', 'A clear reason to call you instead of the next local competitor'],
              ['Website', 'Job proof, reviews, service area, and one estimate-request path'],
              ['Videos', 'Testimonials, promos, and social clips from raw phone footage'],
              ['Follow-up', 'New-call details and the next step for you and the customer'],
            ].map(([label, value], index) => (
              <div key={label} className="grid grid-cols-[30px_76px_1fr] items-start gap-2 rounded-xl border border-black/[0.07] bg-white/70 p-3 text-sm">
                <span className="font-serif italic text-[#d44b2e]">0{index + 1}</span>
                <span className="font-semibold">{label}</span>
                <span className="text-black/45">{value}</span>
              </div>
            ))}
          </div>
          <div className="mt-5 rounded-2xl bg-[#171714] p-4 text-sm text-white">
            <div className="flex items-center gap-2 font-semibold"><MessageSquareText className="h-4 w-4 text-[#e9aa94]" /> Sitecraft asks:</div>
            <div className="mt-2 text-white/55">“Which finished job best shows the work you want more of?”</div>
          </div>
        </div>
      </div>
    </PathShell>
  );
}

function AiPreview({
  businessLabel,
  onBack,
  onRestart,
}: {
  businessLabel: string;
  onBack: () => void;
  onRestart: () => void;
}) {
  return (
    <PathShell tone="dark" label="Your Sitecraft workspace preview" onBack={onBack}>
      <div className="grid gap-8 lg:grid-cols-[0.7fr_1.3fr]">
        <div>
          <div className="text-xs font-semibold uppercase tracking-[0.18em] text-[#e9aa94]">Your job proof, ready to put to work</div>
          <h1 className="mt-4 font-serif text-5xl leading-[0.98] tracking-[-0.045em]">One job can help win the next one.</h1>
          <p className="mt-5 text-sm leading-6 text-white/50">
            Sitecraft turns the same finished job into a website story, review proof, a short promo, and weeks of useful social posts. You review the plan, then ask for changes in plain language.
          </p>
          <div className="mt-7 space-y-3">
            {['Website story with before-and-after proof', 'Phone call and estimate-request path', 'Testimonial and promo video plan', 'Service-area and review checklist'].map((item) => (
              <div key={item} className="flex items-center gap-3 text-sm text-white/70">
                <CheckCircle2 className="h-4 w-4 text-emerald-300" />
                {item}
              </div>
            ))}
          </div>
          <div className="mt-8 rounded-2xl border border-amber-300/20 bg-amber-300/[0.07] p-4 text-xs leading-5 text-amber-100/60">
            Demo boundary: this preview creates no account, website, media, lead, or external resource.
          </div>
          <button type="button" onClick={onRestart} className="mt-7 inline-flex items-center gap-2 text-sm text-white/50 hover:text-white">
            <RotateCcw className="h-4 w-4" /> Return to the opening
          </button>
        </div>

        <div className="overflow-hidden rounded-[28px] border border-white/10 bg-[#24241f]">
          <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
            <div className="flex items-center gap-3">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white text-xs font-bold text-black">S</span>
              <span>
                <span className="block text-sm font-semibold">{businessLabel} booked-job plan</span>
                <span className="text-xs text-white/35">Preview only · nothing has been created</span>
              </span>
            </div>
            <span className="rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-black">Approve direction</span>
          </div>
          <div className="grid min-h-[460px] sm:grid-cols-[170px_1fr]">
            <aside className="border-b border-white/10 p-4 sm:border-b-0 sm:border-r">
              {['Overview', 'Website', 'Job proof', 'Videos', 'Calls & estimates'].map((item, index) => (
                <div key={item} className={`mb-1 rounded-lg px-3 py-2 text-xs ${index === 0 ? 'bg-white text-black' : 'text-white/40'}`}>{item}</div>
              ))}
            </aside>
            <div className="p-5">
              <div className="text-xs uppercase tracking-[0.16em] text-white/35">How a local customer gets to the call</div>
              <div className="mt-5 space-y-3">
                {[
                  ['01', 'Show the finished work', 'Lead with the kind of job you want to book again.'],
                  ['02', 'Back it up with proof', 'Use before-and-after photos, reviews, and a clear service area.'],
                  ['03', 'Make the call easy', 'Offer one obvious phone-call or estimate-request next step.'],
                  ['04', 'Reuse every good job', 'Turn raw phone clips into a testimonial, promo, and social posts.'],
                ].map(([number, title, body]) => (
                  <div key={number} className="grid grid-cols-[34px_1fr] gap-3 rounded-xl border border-white/10 bg-black/15 p-4">
                    <span className="font-serif italic text-[#e9aa94]">{number}</span>
                    <span>
                      <span className="block text-sm font-semibold">{title}</span>
                      <span className="mt-1 block text-xs leading-5 text-white/35">{body}</span>
                    </span>
                  </div>
                ))}
              </div>
              <div className="mt-4 flex items-center gap-2 rounded-full border border-white/10 bg-black/20 px-4 py-3 text-xs text-white/35">
                <Sparkles className="h-3.5 w-3.5 text-[#e9aa94]" />
                Tell Sitecraft: “Show the finished deck first and put the estimate button under the review.”
              </div>
            </div>
          </div>
        </div>
      </div>
    </PathShell>
  );
}

function ServiceIntro({
  businessLabel,
  goalLabel,
  onBack,
  onContinue,
}: {
  businessLabel: string;
  goalLabel: string;
  onBack: () => void;
  onContinue: () => void;
}) {
  return (
    <PathShell tone="dark" label="Build my growth system · done for you" onBack={onBack}>
      <div className="grid items-center gap-10 lg:grid-cols-[0.9fr_1.1fr]">
        <div>
          <div className="text-xs font-semibold uppercase tracking-[0.18em] text-[#e9aa94]">Your best work becomes the sales proof</div>
          <h1 className="mt-4 font-serif text-5xl leading-[0.98] tracking-[-0.05em] md:text-6xl">Look established before you answer the phone.</h1>
          <p className="mt-6 text-sm leading-6 text-white/50">
            For your {businessLabel.toLowerCase()}, we would start with {goalLabel.toLowerCase()}, then turn finished jobs, reviews, service details, and phone clips into a website, proof videos, and a simple path to a call or estimate request.
          </p>
          <button type="button" onClick={onContinue} className="group mt-8 inline-flex items-center gap-3 rounded-full bg-white px-6 py-3.5 text-sm font-semibold text-black hover:bg-[#f2c9ba]">
            Tell us the essentials
            <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
          </button>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          {[
            ['01', 'Find the jobs to feature', 'We choose the work, reviews, and service details most likely to build trust.'],
            ['02', 'Shape the story', 'We show what makes the work different and why a local customer should call.'],
            ['03', 'Build the full path', 'We create the website, proof videos, estimate request, and follow-up steps.'],
            ['04', 'Keep it current', 'We turn new finished jobs into fresh proof for slow weeks and referrals.'],
          ].map(([number, title, body], index) => (
            <div key={number} className={`rounded-2xl border p-5 ${index === 0 ? 'border-[#d44b2e]/40 bg-[#d44b2e]/10' : 'border-white/10 bg-white/[0.04]'}`}>
              <div className="font-serif text-3xl italic text-[#e9aa94]">{number}</div>
              <div className="mt-7 text-sm font-semibold">{title}</div>
              <div className="mt-2 text-xs leading-5 text-white/40">{body}</div>
            </div>
          ))}
        </div>
      </div>
    </PathShell>
  );
}

function LeadScreen({
  lead,
  setLead,
  onBack,
  onContinue,
}: {
  lead: Lead;
  setLead: React.Dispatch<React.SetStateAction<Lead>>;
  onBack: () => void;
  onContinue: () => void;
}) {
  const ready = lead.name.trim() && lead.business.trim() && lead.email.trim() && lead.phone.trim() && lead.goal.trim();

  return (
    <section className="mx-auto grid min-h-[calc(100vh-4rem)] max-w-6xl items-center gap-10 px-5 py-12 md:px-8 lg:grid-cols-[0.76fr_1.24fr]">
      <div>
        <div className="text-xs font-semibold uppercase tracking-[0.18em] text-[#d44b2e]">A little context. Nothing more.</div>
        <h1 className="mt-4 font-serif text-5xl leading-[0.98] tracking-[-0.045em]">Make the first conversation useful from minute one.</h1>
        <p className="mt-5 max-w-md text-sm leading-6 text-black/50">
          No account and no long intake form. These five details let us prepare a relevant conversation and send the appointment information.
        </p>
        <div className="mt-7 space-y-3 text-xs text-black/45">
          <div className="flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-[#d44b2e]" /> Demo only—nothing leaves this browser.</div>
          <div className="flex items-center gap-2"><Clock3 className="h-4 w-4 text-[#d44b2e]" /> Usually takes under one minute.</div>
        </div>
        <button type="button" onClick={onBack} className="mt-8 inline-flex items-center gap-2 text-sm text-black/45 hover:text-black"><ArrowLeft className="h-4 w-4" /> Back</button>
      </div>

      <div className="rounded-[30px] border border-black/10 bg-white/60 p-5 shadow-xl shadow-black/5 md:p-7">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Your name" value={lead.name} onChange={(value) => setLead((current) => ({ ...current, name: value }))} placeholder="Jordan Lee" />
          <Field label="Business" value={lead.business} onChange={(value) => setLead((current) => ({ ...current, business: value }))} placeholder="Business name" />
          <Field label="Email" value={lead.email} type="email" onChange={(value) => setLead((current) => ({ ...current, email: value }))} placeholder="jordan@example.com" />
          <Field label="Phone" value={lead.phone} type="tel" onChange={(value) => setLead((current) => ({ ...current, phone: value }))} placeholder="(555) 555-0123" />
        </div>
        <div className="mt-4">
          <Field
            label="What would make this conversation valuable?"
            value={lead.goal}
            onChange={(value) => setLead((current) => ({ ...current, goal: value }))}
            placeholder="I want more deck projects and a steadier crew calendar during slow weeks."
            multiline
          />
        </div>
        <label className="mt-4 flex cursor-pointer items-start gap-3 rounded-xl border border-black/[0.07] bg-[#f7f4ed] p-3 text-xs leading-5 text-black/50">
          <input
            type="checkbox"
            checked={lead.smsConsent}
            onChange={(event) => setLead((current) => ({ ...current, smsConsent: event.target.checked }))}
            className="mt-0.5 h-4 w-4 accent-[#d44b2e]"
          />
          <span>Send appointment confirmation and reminders by text. Consent is optional and can be withdrawn anytime.</span>
        </label>
        <button
          type="button"
          onClick={onContinue}
          disabled={!ready}
          className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#171714] px-6 py-3.5 text-sm font-semibold text-white transition hover:bg-[#d44b2e] disabled:cursor-not-allowed disabled:opacity-35"
        >
          See available times
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </section>
  );
}

function CalendarScreen({
  name,
  day,
  time,
  setDay,
  setTime,
  onBack,
  onContinue,
}: {
  name: string;
  day: string;
  time: string;
  setDay: (value: string) => void;
  setTime: (value: string) => void;
  onBack: () => void;
  onContinue: () => void;
}) {
  const days = ['Tue 29', 'Wed 30', 'Thu 31'];
  const times = ['10:00 AM', '11:30 AM', '2:00 PM', '3:30 PM'];

  return (
    <section className="mx-auto grid min-h-[calc(100vh-4rem)] max-w-6xl items-center gap-10 px-5 py-12 md:px-8 lg:grid-cols-[0.7fr_1.3fr]">
      <div>
        <div className="text-xs font-semibold uppercase tracking-[0.18em] text-[#d44b2e]">The natural next step</div>
        <h1 className="mt-4 font-serif text-5xl leading-[0.98] tracking-[-0.045em]">Choose a time that feels easy.</h1>
        <p className="mt-5 max-w-md text-sm leading-6 text-black/50">
          We’ll use the conversation to understand the business, sharpen the opportunity, and tell you honestly what we would prioritize first.
        </p>
        <div className="mt-7 rounded-2xl border border-black/10 bg-white/45 p-4 text-sm">
          <div className="font-semibold">30-minute booked-jobs planning call</div>
          <div className="mt-2 text-xs leading-5 text-black/45">Your best jobs, reviews, service area, website, slow weeks, and next practical step. No pressure and no account required.</div>
        </div>
        <button type="button" onClick={onBack} className="mt-7 inline-flex items-center gap-2 text-sm text-black/45 hover:text-black"><ArrowLeft className="h-4 w-4" /> Back</button>
      </div>

      <div className="overflow-hidden rounded-[30px] border border-black/10 bg-white/70 shadow-xl shadow-black/5">
        <div className="border-b border-black/10 p-5 md:p-6">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#171714] text-white"><CalendarDays className="h-4 w-4" /></span>
            <span>
              <span className="block text-sm font-semibold">Welcome, {name || 'there'}.</span>
              <span className="text-xs text-black/40">Times shown in your local timezone</span>
            </span>
          </div>
        </div>
        <div className="grid md:grid-cols-[0.82fr_1.18fr]">
          <div className="border-b border-black/10 p-5 md:border-b-0 md:border-r md:p-6">
            <div className="text-xs font-semibold uppercase tracking-[0.16em] text-black/35">Select a day</div>
            <div className="mt-4 space-y-2">
              {days.map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => setDay(item)}
                  className={`flex w-full items-center justify-between rounded-xl border px-4 py-3 text-sm ${day === item ? 'border-[#d44b2e] bg-[#d44b2e] text-white' : 'border-black/10 bg-white/60 hover:border-black/25'}`}
                >
                  <span>{item}</span>
                  {day === item && <Check className="h-4 w-4" />}
                </button>
              ))}
            </div>
          </div>
          <div className="p-5 md:p-6">
            <div className="text-xs font-semibold uppercase tracking-[0.16em] text-black/35">Choose a time</div>
            <div className="mt-4 grid grid-cols-2 gap-2">
              {times.map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => setTime(item)}
                  className={`rounded-xl border px-3 py-3 text-xs font-semibold ${time === item ? 'border-[#171714] bg-[#171714] text-white' : 'border-black/10 bg-white/60 hover:border-black/25'}`}
                >
                  {item}
                </button>
              ))}
            </div>
            <div className="mt-5 rounded-xl bg-[#f1efe9] p-4 text-xs leading-5 text-black/45">
              <strong className="text-black/70">Demo booking:</strong> this selection stays on your device and does not reserve a real appointment.
            </div>
            <button type="button" onClick={onContinue} className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#171714] px-5 py-3.5 text-sm font-semibold text-white hover:bg-[#d44b2e]">
              Confirm preview appointment
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

function Confirmation({
  lead,
  day,
  time,
  onRestart,
}: {
  lead: Lead;
  day: string;
  time: string;
  onRestart: () => void;
}) {
  return (
    <section className="mx-auto max-w-6xl px-5 py-12 md:px-8 md:py-16">
      <div className="overflow-hidden rounded-[34px] bg-[#171714] text-white">
        <div className="grid lg:grid-cols-[0.95fr_1.05fr]">
          <div className="p-6 md:p-10">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-300 text-[#171714]"><Check className="h-5 w-5" /></div>
            <div className="mt-7 text-xs font-semibold uppercase tracking-[0.18em] text-emerald-200">Preview confirmed</div>
            <h1 className="mt-3 font-serif text-5xl leading-[0.98] tracking-[-0.045em]">You’ll know exactly what happens next.</h1>
            <p className="mt-5 text-sm leading-6 text-white/50">
              In the live journey, {lead.name || 'the customer'} would receive a branded confirmation with an easy reschedule or cancel link. You would receive their business details, goal, and how they found you—without forcing an account.
            </p>
            <div className="mt-7 rounded-2xl border border-white/10 bg-white/[0.05] p-5">
              <div className="text-sm font-semibold">{day} · {time}</div>
              <div className="mt-1 text-xs text-white/35">30-minute booked-jobs planning call</div>
              <div className="mt-4 flex flex-wrap gap-2">
                <span className="rounded-full border border-white/10 px-3 py-1.5 text-[10px] text-white/50">Reschedule</span>
                <span className="rounded-full border border-white/10 px-3 py-1.5 text-[10px] text-white/50">Cancel</span>
                <span className="rounded-full border border-white/10 px-3 py-1.5 text-[10px] text-white/50">Add to calendar</span>
              </div>
            </div>
            <button type="button" onClick={onRestart} className="mt-7 inline-flex items-center gap-2 text-sm text-white/45 hover:text-white"><RotateCcw className="h-4 w-4" /> Replay the journey</button>
          </div>

          <div className="bg-[#f1efe9] p-6 text-[#171714] md:p-10">
            <div className="text-xs font-semibold uppercase tracking-[0.18em] text-[#d44b2e]">Prepare without homework</div>
            <h2 className="mt-3 font-serif text-3xl tracking-[-0.035em]">Three optional things to bring</h2>
            <div className="mt-6 space-y-3">
              {[
                ['Your best customer', 'Who they are, what they value, and why they chose you.'],
                ['One current frustration', 'Slow weeks, the wrong phone calls, price shoppers, or a website that feels dated.'],
                ['A job you are proud of', 'A finished project, customer review, or before-and-after worth showing.'],
              ].map(([title, body], index) => (
                <div key={title} className="grid grid-cols-[32px_1fr] gap-3 rounded-2xl border border-black/10 bg-white/55 p-4">
                  <span className="font-serif italic text-[#d44b2e]">0{index + 1}</span>
                  <span>
                    <span className="block text-sm font-semibold">{title}</span>
                    <span className="mt-1 block text-xs leading-5 text-black/45">{body}</span>
                  </span>
                </div>
              ))}
            </div>
            <div className="mt-6 rounded-2xl bg-[#dfdacd] p-5">
              <div className="text-xs font-semibold uppercase tracking-[0.16em] text-black/40">Live notification sequence</div>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <Notice icon={Mail} title="Customer email" body="Confirmation, what to expect, and calendar link." />
                <Notice icon={Phone} title={lead.smsConsent ? 'Customer text' : 'Text not selected'} body={lead.smsConsent ? 'Confirmation and considerate reminders.' : 'Email only; SMS consent remains optional.'} />
                <Notice icon={Sparkles} title="Your alert" body="Business, goal, source, phone number, and appointment." />
                <Notice icon={Clock3} title="Reminders" body="Useful, branded, and easy to reschedule." />
              </div>
            </div>
            <div className="mt-5 text-xs leading-5 text-black/40">
              Demo only: no appointment, email, SMS, lead, or notification was created or sent.
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function PathShell({
  tone,
  label,
  onBack,
  children,
}: {
  tone: 'light' | 'dark';
  label: string;
  onBack: () => void;
  children: React.ReactNode;
}) {
  const dark = tone === 'dark';
  return (
    <section className={`min-h-[calc(100vh-4rem)] ${dark ? 'bg-[#171714] text-white' : ''}`}>
      <div className="mx-auto max-w-7xl px-5 py-10 md:px-8 md:py-16">
        <div className="mb-10 flex items-center justify-between">
          <button type="button" onClick={onBack} className={`inline-flex items-center gap-2 text-sm ${dark ? 'text-white/45 hover:text-white' : 'text-black/45 hover:text-black'}`}>
            <ArrowLeft className="h-4 w-4" /> Back
          </button>
          <div className={`rounded-full border px-3 py-1.5 text-xs font-semibold ${dark ? 'border-white/10 text-white/50' : 'border-black/10 text-black/45'}`}>{label}</div>
        </div>
        {children}
      </div>
    </section>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  type = 'text',
  multiline = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  type?: string;
  multiline?: boolean;
}) {
  const shared = 'mt-2 w-full rounded-xl border border-black/10 bg-white/70 px-4 py-3 text-sm outline-none placeholder:text-black/25 focus:border-[#d44b2e]';
  return (
    <label className="block text-xs font-semibold text-black/60">
      {label}
      {multiline ? (
        <textarea value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} rows={3} className={`${shared} resize-none`} />
      ) : (
        <input type={type} value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} className={shared} />
      )}
    </label>
  );
}

function Notice({
  icon: Icon,
  title,
  body,
}: {
  icon: typeof Mail;
  title: string;
  body: string;
}) {
  return (
    <div className="flex gap-3">
      <Icon className="mt-0.5 h-4 w-4 shrink-0 text-[#d44b2e]" />
      <span>
        <span className="block text-xs font-semibold">{title}</span>
        <span className="mt-1 block text-[10px] leading-4 text-black/45">{body}</span>
      </span>
    </div>
  );
}
