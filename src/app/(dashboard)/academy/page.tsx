'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  BookOpen,
  Check,
  CheckCircle2,
  ChevronRight,
  Clipboard,
  Clock3,
  Database,
  GraduationCap,
  Lightbulb,
  MonitorPlay,
  Play,
  Sparkles,
  WandSparkles,
} from 'lucide-react';
import {
  ACADEMY_MODULES,
  BACKEND_RECOMMENDATIONS,
  LESSON_BUILD_STEPS,
  STARTER_PROMPT,
} from '@/lib/academy/curriculum';

const BUSINESS_TYPES = [
  { id: 'service', label: 'Local service' },
  { id: 'ecommerce', label: 'Online store' },
  { id: 'realestate', label: 'Real estate' },
  { id: 'general', label: 'Other business' },
];

const STORAGE_KEY = 'sitecraft-academy-website-lesson';

export default function AcademyPage() {
  const [businessType, setBusinessType] = useState('service');
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [copied, setCopied] = useState(false);
  const [showVideoPlan, setShowVideoPlan] = useState(false);
  const [showBackendPlan, setShowBackendPlan] = useState(false);

  useEffect(() => {
    let restoreTimer: number | undefined;
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
      if (Array.isArray(saved)) {
        restoreTimer = window.setTimeout(
          () => setCompletedSteps(saved.filter(Number.isInteger)),
          0
        );
      }
    } catch {
      // Progress is a convenience; the lesson still works without storage.
    }
    return () => {
      if (restoreTimer !== undefined) window.clearTimeout(restoreTimer);
    };
  }, []);

  const progress = Math.round((completedSteps.length / LESSON_BUILD_STEPS.length) * 100);
  const recommendations = useMemo(
    () => BACKEND_RECOMMENDATIONS[businessType] ?? BACKEND_RECOMMENDATIONS.general,
    [businessType]
  );

  function toggleStep(index: number) {
    const next = completedSteps.includes(index)
      ? completedSteps.filter((step) => step !== index)
      : [...completedSteps, index].sort();
    setCompletedSteps(next);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      // Non-fatal in private browsing modes.
    }
  }

  async function copyPrompt() {
    await navigator.clipboard.writeText(STARTER_PROMPT);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  }

  return (
    <div className="mx-auto max-w-[1480px] space-y-6 pb-12 sm:space-y-8 sm:pb-16">
      <section className="relative overflow-hidden rounded-[24px] border border-white/10 bg-[#0c1020]/90 px-5 py-7 shadow-2xl shadow-violet-950/20 sm:rounded-[32px] md:px-10 md:py-11">
        <div className="absolute -right-24 -top-28 h-80 w-80 rounded-full bg-violet-600/20 blur-3xl" />
        <div className="absolute -bottom-36 left-1/3 h-72 w-72 rounded-full bg-cyan-500/10 blur-3xl" />
        <div className="relative grid gap-6 xl:grid-cols-[1.25fr_0.75fr] xl:items-end">
          <div>
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-violet-400/20 bg-violet-500/10 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-violet-200">
              <GraduationCap className="h-4 w-4" />
              Sitecraft Academy
            </div>
            <h1 className="max-w-4xl text-3xl font-semibold tracking-[-0.04em] text-white sm:text-4xl md:text-6xl">
              Build smarter, one lesson at a time.
            </h1>
            <p className="mt-5 max-w-3xl text-base leading-7 text-slate-300 md:text-lg">
              Short, practical lessons that turn a website into a connected operating system—then show owners exactly what to automate next.
            </p>
            <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <a
                href="#lesson"
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-white px-5 py-2.5 text-sm font-semibold text-slate-950 transition hover:-translate-y-0.5 hover:bg-violet-100"
              >
              Start lesson one <ArrowRight className="h-4 w-4" />
              </a>
              <Link
                href="/projects/new?tier=architect&source=academy"
                className="hidden min-h-12 items-center justify-center gap-2 rounded-2xl border border-white/15 bg-white/5 px-5 py-2.5 text-sm font-semibold text-white transition hover:border-violet-400/40 hover:bg-violet-500/10 sm:inline-flex"
              >
                Build alongside the lesson
              </Link>
            </div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-5 backdrop-blur-xl">
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-400">Starter path</span>
              <span className="font-semibold text-white">{progress}% complete</span>
            </div>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full rounded-full bg-gradient-to-r from-violet-500 via-fuchsia-400 to-cyan-400 transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
            <div className="mt-5 hidden grid-cols-3 gap-3 sm:grid">
              {[
                ['6', 'modules'],
                ['31', 'lessons'],
                ['2.4h', 'total'],
              ].map(([value, label]) => (
                <div key={label} className="rounded-2xl bg-black/20 px-3 py-4 text-center">
                  <p className="text-lg font-semibold text-white">{value}</p>
                  <p className="mt-0.5 text-xs text-slate-500">{label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="-mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-3 md:mx-0 md:grid md:grid-cols-2 md:overflow-visible md:px-0 xl:grid-cols-3">
        {ACADEMY_MODULES.map((module) => {
          const Icon = module.icon;
          const active = module.status === 'available';
          return (
            <article
              key={module.id}
              className={`group min-w-[82vw] snap-center rounded-3xl border p-5 transition md:min-w-0 ${
                active
                  ? 'border-violet-400/30 bg-gradient-to-br from-violet-500/15 to-cyan-500/5 shadow-lg shadow-violet-950/20'
                  : 'border-white/10 bg-[#0c1020]/75 hover:border-white/20'
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className={`flex h-11 w-11 items-center justify-center rounded-2xl ${active ? 'bg-violet-400 text-slate-950' : 'bg-white/5 text-slate-400'}`}>
                  <Icon className="h-5 w-5" />
                </div>
                <span className="font-mono text-xs text-slate-600">{module.number}</span>
              </div>
              <h2 className="mt-5 text-lg font-semibold text-white">{module.title}</h2>
              <p className="mt-2 min-h-12 text-sm leading-6 text-slate-400">{module.description}</p>
              <div className="mt-5 flex items-center justify-between border-t border-white/10 pt-4 text-xs text-slate-500">
                <span className="flex items-center gap-1.5"><Clock3 className="h-3.5 w-3.5" />{module.duration}</span>
                <span>{module.lessons} lessons</span>
                <span className={active ? 'text-violet-300' : ''}>
                  {active ? 'Start now' : module.status === 'preview' ? 'Preview' : 'Coming soon'}
                </span>
              </div>
            </article>
          );
        })}
      </section>

      <section className="hidden rounded-[24px] border border-white/10 bg-[#0c1020]/75 p-5 sm:rounded-[32px] md:block md:p-8">
        <div className="grid gap-7 lg:grid-cols-[0.8fr_1.2fr] lg:items-center">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-300">Education + implementation</p>
            <h2 className="mt-3 text-2xl font-semibold tracking-tight text-white md:text-3xl">Every lesson leaves something working.</h2>
            <p className="mt-3 text-sm leading-6 text-slate-400">
              Business owners learn the reason behind each decision while Site Craft helps them put it into practice immediately. Progress is measured in systems activated, not videos watched.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-4">
            {[
              ['01', 'Learn', 'See the complete workflow'],
              ['02', 'Build', 'Follow it in your project'],
              ['03', 'Connect', 'Activate the right backend'],
              ['04', 'Automate', 'Recover time every week'],
            ].map(([number, title, detail]) => (
              <div key={title} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                <span className="font-mono text-[11px] text-violet-300">{number}</span>
                <h3 className="mt-5 text-sm font-semibold text-white">{title}</h3>
                <p className="mt-1.5 text-xs leading-5 text-slate-500">{detail}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="lesson" className="grid scroll-mt-6 gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-6">
          <article className="premium-feature-card overflow-hidden rounded-[24px] border border-white/10 bg-[#0c1020]/90 sm:rounded-[32px]">
            <div className="relative aspect-video min-h-[220px] overflow-hidden bg-[#070a12] sm:min-h-[320px]">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_20%,rgba(139,92,246,0.24),transparent_36%),radial-gradient(circle_at_20%_80%,rgba(34,211,238,0.12),transparent_34%)]" />
              <div className="absolute inset-x-[8%] bottom-[10%] top-[10%] overflow-hidden rounded-2xl border border-white/10 bg-slate-950/90 shadow-2xl">
                <div className="flex h-9 items-center gap-2 border-b border-white/10 bg-white/[0.03] px-4">
                  <span className="h-2.5 w-2.5 rounded-full bg-rose-400/70" />
                  <span className="h-2.5 w-2.5 rounded-full bg-amber-400/70" />
                  <span className="h-2.5 w-2.5 rounded-full bg-emerald-400/70" />
                  <div className="ml-4 h-4 w-1/3 rounded-full bg-white/5" />
                </div>
                <div className="grid h-[calc(100%-2.25rem)] grid-cols-[30%_70%]">
                  <div className="border-r border-white/10 p-5">
                    <div className="h-3 w-20 rounded-full bg-violet-400/40" />
                    <div className="mt-6 space-y-3">
                      {[85, 68, 92, 58].map((width, index) => (
                        <div key={index} className="h-2 rounded-full bg-white/[0.06]" style={{ width: `${width}%` }} />
                      ))}
                    </div>
                    <div className="mt-8 rounded-xl border border-violet-400/20 bg-violet-500/10 p-3">
                      <Sparkles className="h-4 w-4 text-violet-300" />
                      <div className="mt-3 h-2 w-full rounded bg-violet-200/15" />
                      <div className="mt-2 h-2 w-2/3 rounded bg-violet-200/10" />
                    </div>
                  </div>
                  <div className="relative p-6">
                    <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-cyan-300">Live build</div>
                    <div className="mt-4 h-6 w-2/3 rounded-md bg-white/80" />
                    <div className="mt-3 h-3 w-4/5 rounded bg-white/10" />
                    <div className="mt-2 h-3 w-3/5 rounded bg-white/10" />
                    <div className="mt-7 hidden grid-cols-3 gap-3 sm:grid">
                      {[0, 1, 2].map((card) => (
                        <div key={card} className="h-20 rounded-xl border border-white/10 bg-gradient-to-br from-white/[0.07] to-transparent" />
                      ))}
                    </div>
                    <div className="absolute bottom-5 right-5 rounded-full border border-emerald-400/30 bg-emerald-400/10 px-3 py-1.5 text-[10px] font-medium text-emerald-300">
                      Backend ready
                    </div>
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowVideoPlan((visible) => !visible)}
                className="absolute left-1/2 top-1/2 flex h-16 w-16 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-white/20 bg-white text-slate-950 shadow-2xl transition hover:scale-105"
                aria-label="Preview the screen-recording plan"
              >
                <Play className="ml-1 h-6 w-6 fill-current" />
              </button>
              {showVideoPlan && (
                <div className="absolute inset-[8%] z-10 flex items-center justify-center rounded-2xl border border-violet-300/20 bg-slate-950/95 p-6 text-center shadow-2xl backdrop-blur">
                  <div className="max-w-md">
                    <MonitorPlay className="mx-auto h-9 w-9 text-violet-300" />
                    <p className="mt-4 text-xs font-semibold uppercase tracking-[0.18em] text-violet-300">Screen-recording treatment</p>
                    <h3 className="mt-2 text-xl font-semibold text-white">Watch the real workflow, one decision at a time.</h3>
                    <p className="mt-3 text-sm leading-6 text-slate-400">
                      The finished lesson combines a clean Site Craft screen capture, concise narration, cursor emphasis, readable captions, and chapter callouts. No talking-head filler.
                    </p>
                    <button
                      type="button"
                      onClick={() => setShowVideoPlan(false)}
                      className="mt-5 rounded-full border border-white/15 bg-white/5 px-4 py-2 text-xs font-semibold text-white transition hover:bg-white/10"
                    >
                      Return to lesson
                    </button>
                  </div>
                </div>
              )}
              <div className="absolute bottom-5 left-5 rounded-full border border-white/10 bg-black/50 px-3 py-1.5 text-xs text-slate-300 backdrop-blur">
                Screen-recorded tutorial treatment · 08:42
              </div>
            </div>

            <div className="p-6 md:p-8">
              <div className="flex flex-wrap items-center gap-3 text-xs font-medium text-slate-400">
                <span className="rounded-full bg-violet-500/15 px-3 py-1.5 text-violet-200">Module 01 · Lesson 01</span>
                <span>Beginner</span>
                <span>8 minutes</span>
              </div>
              <h2 className="mt-5 text-2xl font-semibold tracking-tight text-white sm:text-3xl md:text-4xl">
                From one business description to a working website
              </h2>
              <p className="mt-4 max-w-3xl text-base leading-7 text-slate-400">
                Learn the brief structure that helps AI understand the customer, the offer, the trust signals, and the action the website needs to produce—before worrying about colors.
              </p>

              <div className="mt-6 rounded-2xl border border-cyan-300/15 bg-cyan-300/[0.04] p-5">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-300">The Site Craft difference</p>
                <p className="mt-2 text-sm leading-6 text-slate-300">
                  A polished page is only the beginning. Site Craft helps an owner create the customer experience, capture what happens next, and connect that activity to one workspace—so the website becomes part of how the business runs.
                </p>
              </div>

              <div className="mt-7 grid gap-3 md:grid-cols-3">
                {[
                  'Write a useful generation brief',
                  'Review the customer journey',
                  'Choose the right backend next',
                ].map((outcome) => (
                  <div key={outcome} className="flex gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-sm text-slate-300">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 flex-none text-emerald-400" />
                    {outcome}
                  </div>
                ))}
              </div>
            </div>
          </article>

          <article className="rounded-[24px] border border-white/10 bg-[#0c1020]/90 p-5 sm:rounded-[32px] md:p-8">
            <div className="flex flex-col items-start gap-4 sm:flex-row sm:justify-between sm:gap-5">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-violet-300">Build-along checklist</p>
                <h3 className="mt-2 text-2xl font-semibold text-white">Complete the lesson in your own project</h3>
              </div>
              <div className="rounded-2xl bg-white/5 px-4 py-3 text-center">
                <p className="text-xl font-semibold text-white">{completedSteps.length}/{LESSON_BUILD_STEPS.length}</p>
                <p className="text-[11px] text-slate-500">complete</p>
              </div>
            </div>
            <div className="mt-6 space-y-3">
              {LESSON_BUILD_STEPS.map((step, index) => {
                const complete = completedSteps.includes(index);
                return (
                  <button
                    key={step.title}
                    type="button"
                    onClick={() => toggleStep(index)}
                    className={`flex w-full items-start gap-4 rounded-2xl border p-4 text-left transition ${
                      complete
                        ? 'border-emerald-400/20 bg-emerald-400/[0.06]'
                        : 'border-white/10 bg-white/[0.025] hover:border-violet-400/30 hover:bg-violet-500/[0.05]'
                    }`}
                  >
                    <span className={`mt-0.5 flex h-7 w-7 flex-none items-center justify-center rounded-full border ${complete ? 'border-emerald-400 bg-emerald-400 text-slate-950' : 'border-slate-600 text-slate-500'}`}>
                      {complete ? <Check className="h-4 w-4" /> : index + 1}
                    </span>
                    <span>
                      <span className={`block text-sm font-semibold ${complete ? 'text-emerald-200' : 'text-white'}`}>{step.title}</span>
                      <span className="mt-1 block text-sm leading-6 text-slate-500">{step.detail}</span>
                    </span>
                  </button>
                );
              })}
            </div>
          </article>

          <article className="rounded-[32px] border border-violet-400/20 bg-gradient-to-br from-violet-500/10 to-cyan-500/[0.04] p-6 md:p-8">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="flex gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-violet-400 text-slate-950">
                  <WandSparkles className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-violet-300">Prompt recipe</p>
                  <h3 className="mt-1 text-xl font-semibold text-white">The customer-first website brief</h3>
                </div>
              </div>
              <button
                type="button"
                onClick={copyPrompt}
                className="inline-flex min-h-11 items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-slate-200 transition hover:bg-white/10"
              >
                {copied ? <Check className="h-4 w-4 text-emerald-400" /> : <Clipboard className="h-4 w-4" />}
                {copied ? 'Copied' : 'Copy prompt'}
              </button>
            </div>
            <pre className="mt-6 whitespace-pre-wrap rounded-2xl border border-white/10 bg-black/25 p-5 font-mono text-xs leading-6 text-slate-300 md:text-sm">
              {STARTER_PROMPT}
            </pre>
          </article>
        </div>

        <aside className="space-y-6 xl:sticky xl:top-6 xl:self-start">
          <article className="rounded-[28px] border border-white/10 bg-[#0c1020]/95 p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-cyan-400/15 text-cyan-300">
                <Sparkles className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-cyan-300">Smart next move</p>
                <h3 className="mt-1 font-semibold text-white">What should this site connect to?</h3>
              </div>
            </div>
            <p className="mt-4 text-sm leading-6 text-slate-400">
              This is the recommendation experience Site Craft can show immediately after generation.
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              {BUSINESS_TYPES.map((type) => (
                <button
                  key={type.id}
                  type="button"
                  onClick={() => setBusinessType(type.id)}
                  className={`min-h-10 rounded-full px-3.5 py-2 text-xs font-medium transition ${
                    businessType === type.id
                      ? 'bg-white text-slate-950'
                      : 'border border-white/10 bg-white/[0.03] text-slate-400 hover:text-white'
                  }`}
                >
                  {type.label}
                </button>
              ))}
            </div>
            <div className="mt-5 space-y-3">
              {recommendations.map((recommendation) => (
                <div key={recommendation.title} className={`rounded-2xl border border-white/10 bg-gradient-to-br ${recommendation.accent} p-4`}>
                  <div className="flex items-center justify-between gap-3">
                    <h4 className="text-sm font-semibold text-white">{recommendation.title}</h4>
                    <ChevronRight className="h-4 w-4 text-slate-500" />
                  </div>
                  <p className="mt-2 text-xs leading-5 text-slate-400">{recommendation.description}</p>
                  <p className="mt-3 text-xs font-medium text-slate-200">{recommendation.outcome}</p>
                </div>
              ))}
            </div>
            {showBackendPlan && (
              <div className="mt-4 rounded-2xl border border-emerald-400/20 bg-emerald-400/[0.06] p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-emerald-300">Suggested activation plan</p>
                <ol className="mt-3 space-y-2 text-xs leading-5 text-slate-300">
                  <li>1. Detect the site&apos;s forms, products, bookings, and customer actions.</li>
                  <li>2. Create only the tables, inboxes, and statuses this business needs.</li>
                  <li>3. Connect the website, send a test record, and let the owner approve it.</li>
                  <li>4. Recommend one useful automation after real activity arrives.</li>
                </ol>
              </div>
            )}
            <button
              type="button"
              onClick={() => setShowBackendPlan((visible) => !visible)}
              aria-expanded={showBackendPlan}
              className="mt-5 flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-violet-500"
            >
              <Database className="h-4 w-4" />
              {showBackendPlan ? 'Hide backend plan' : 'Preview backend plan'}
            </button>
          </article>

          <article className="rounded-[28px] border border-amber-300/15 bg-amber-300/[0.05] p-5">
            <div className="flex gap-3">
              <Lightbulb className="mt-0.5 h-5 w-5 flex-none text-amber-300" />
              <div>
                <h3 className="font-semibold text-amber-100">Why this lesson comes first</h3>
                <p className="mt-2 text-sm leading-6 text-amber-100/60">
                  The advantage is not collecting more AI tools. It is knowing which useful step to take next. Each lesson ends with working business infrastructure and a measurable time-saving outcome, so owners can build confidence from evidence—not hype.
                </p>
              </div>
            </div>
          </article>

          <article className="rounded-[28px] border border-white/10 bg-[#0c1020]/80 p-5">
            <div className="flex items-center gap-2 text-sm font-semibold text-white">
              <BookOpen className="h-4 w-4 text-violet-300" />
              Lesson format
            </div>
            <ul className="mt-4 space-y-3 text-sm text-slate-400">
              {['5–12 minute real screen recording', 'Narration, captions, zooms, and chapter cards', 'Plain-language business explanation', 'Copyable prompt or template', 'Build-along checklist', 'Smart next automation'].map((item) => (
                <li key={item} className="flex gap-2.5">
                  <Check className="mt-0.5 h-4 w-4 flex-none text-emerald-400" />
                  {item}
                </li>
              ))}
            </ul>
          </article>
        </aside>
      </section>
    </div>
  );
}
