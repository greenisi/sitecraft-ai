'use client';

import { useRef, useState } from 'react';
import {
  ArrowLeft,
  Check,
  ChevronDown,
  Film,
  History,
  MessageSquareText,
  RotateCcw,
  ShieldCheck,
  Sparkles,
  Upload,
} from 'lucide-react';

type Step = 'footage' | 'brief' | 'plan';

type DemoClip = {
  id: string;
  name: string;
  detail: string;
  tone: string;
  preview?: string;
};

type ChecklistItem = {
  id: string;
  label: string;
  description: string;
  enabled: boolean;
  planned?: boolean;
};

type PlanVersion = {
  number: number;
  summary: string;
  headline: string;
  length: string;
  checklist: ChecklistItem[];
};

const demoClips: DemoClip[] = [
  {
    id: 'customer-reaction',
    name: 'customer-reaction.mov',
    detail: '0:18 · Portrait',
    tone: 'from-amber-950 via-stone-900 to-neutral-950',
  },
  {
    id: 'finished-work',
    name: 'finished-patio.mov',
    detail: '0:12 · Landscape',
    tone: 'from-emerald-950 via-slate-900 to-neutral-950',
  },
  {
    id: 'team-at-work',
    name: 'crew-at-work.mov',
    detail: '0:24 · Portrait',
    tone: 'from-blue-950 via-slate-900 to-neutral-950',
  },
];

const baseChecklist: ChecklistItem[] = [
  {
    id: 'assembly',
    label: 'Build the strongest story',
    description: 'Open on the finished patio, show the crew at work, and end on the customer reaction.',
    enabled: true,
  },
  {
    id: 'silence',
    label: 'Tighten pauses and blank space',
    description: 'Remove slow starts and long gaps while keeping the testimonial natural.',
    enabled: true,
    planned: true,
  },
  {
    id: 'captions',
    label: 'Add clean branded captions',
    description: 'Use high-contrast captions sized for phones and keep them clear of platform controls.',
    enabled: true,
    planned: true,
  },
  {
    id: 'audio',
    label: 'Clean and level the audio',
    description: 'Reduce background noise and balance voices, music, and ambient sound.',
    enabled: true,
    planned: true,
  },
  {
    id: 'graphics',
    label: 'Add one proof point',
    description: 'Show “Designed and built in 7 days” over the finished result.',
    enabled: true,
    planned: true,
  },
  {
    id: 'profanity',
    label: 'Catch sensitive language',
    description: 'Flag profanity for review before muting or bleeping it.',
    enabled: false,
    planned: true,
  },
];

function initialPlan(): PlanVersion {
  return {
    number: 1,
    headline: 'A fast before-and-after patio story',
    summary:
      'A polished 30-second social promo that leads with the finished transformation, proves the work with a quick process montage, and closes on the customer’s genuine reaction.',
    length: 'About 30 seconds',
    checklist: baseChecklist,
  };
}

export function VisualStudioDemo() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [step, setStep] = useState<Step>('footage');
  const [clips, setClips] = useState<DemoClip[]>(demoClips);
  const [instruction, setInstruction] = useState(
    'Make a polished Instagram promo that feels trustworthy and keeps the customer reaction.'
  );
  const [goal, setGoal] = useState('');
  const [tone, setTone] = useState('');
  const [revision, setRevision] = useState('');
  const [versions, setVersions] = useState<PlanVersion[]>([initialPlan()]);
  const [currentVersion, setCurrentVersion] = useState(1);
  const [approved, setApproved] = useState(false);

  const currentPlan = versions.find((version) => version.number === currentVersion) || versions[0];
  const activeStep = step === 'footage' ? 1 : step === 'brief' ? 2 : 3;

  function addLocalFiles(files: FileList) {
    const additions = Array.from(files)
      .filter((file) => file.type.startsWith('video/'))
      .map((file, index) => ({
        id: `local-${file.name}-${file.size}`,
        name: file.name,
        detail: 'Local preview · not uploaded',
        preview: URL.createObjectURL(file),
        tone: index % 2 ? 'from-violet-950 via-slate-900 to-neutral-950' : 'from-cyan-950 via-slate-900 to-neutral-950',
      }));
    if (additions.length) setClips((existing) => [...existing, ...additions]);
  }

  function createPlan() {
    setVersions([initialPlan()]);
    setCurrentVersion(1);
    setApproved(false);
    setStep('plan');
  }

  function revisePlan() {
    const request = revision.trim();
    if (!request) return;
    const nextNumber = Math.max(...versions.map((version) => version.number)) + 1;
    const next: PlanVersion = {
      ...currentPlan,
      number: nextNumber,
      headline: request.toLowerCase().includes('short')
        ? 'A sharper, faster patio transformation'
        : 'A refined patio transformation story',
      length: request.toLowerCase().includes('short') ? 'About 20 seconds' : currentPlan.length,
      summary: `${currentPlan.summary} Revision: ${request}`,
      checklist: currentPlan.checklist.map((item) =>
        request.toLowerCase().includes('brand') && item.id === 'graphics'
          ? { ...item, enabled: true, description: 'Add the company mark, brand colors, and one concise proof point.' }
          : item
      ),
    };
    setVersions((existing) => [...existing, next]);
    setCurrentVersion(nextNumber);
    setRevision('');
    setApproved(false);
  }

  function toggleChecklist(id: string) {
    const nextNumber = Math.max(...versions.map((version) => version.number)) + 1;
    const next = {
      ...currentPlan,
      number: nextNumber,
      summary: currentPlan.summary,
      checklist: currentPlan.checklist.map((item) =>
        item.id === id ? { ...item, enabled: !item.enabled } : item
      ),
    };
    setVersions((existing) => [...existing, next]);
    setCurrentVersion(nextNumber);
    setApproved(false);
  }

  function restart() {
    setStep('footage');
    setGoal('');
    setTone('');
    setRevision('');
    setVersions([initialPlan()]);
    setCurrentVersion(1);
    setApproved(false);
  }

  return (
    <main className="min-h-screen bg-[#070708] text-white">
      <header className="border-b border-white/10 bg-[#0a0a0b]">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white text-sm font-black text-black">S</div>
            <div>
              <div className="text-sm font-semibold tracking-tight">Sitecraft</div>
              <div className="text-xs text-white/45">AI Visual Studio</div>
            </div>
          </div>
          <div className="flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1.5 text-xs text-emerald-200">
            <ShieldCheck className="h-3.5 w-3.5" />
            Local demo · nothing is uploaded
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-5 py-8 md:py-12">
        <div className="mb-8 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="mb-3 text-xs font-semibold uppercase tracking-[0.22em] text-violet-300">
              Make business content without learning video editing
            </div>
            <h1 className="max-w-3xl text-3xl font-semibold tracking-[-0.04em] text-white md:text-5xl">
              Turn raw phone clips into a story people remember.
            </h1>
            <p className="mt-4 max-w-2xl text-sm leading-6 text-white/55 md:text-base">
              Sitecraft studies the footage, asks only what it still needs to know, and explains the edit before rendering.
            </p>
          </div>
          <div className="flex items-center gap-2" aria-label={`Step ${activeStep} of 3`}>
            {['Footage', 'Brief', 'Plan'].map((label, index) => {
              const number = index + 1;
              const complete = number < activeStep;
              const active = number === activeStep;
              return (
                <div
                  key={label}
                  className={`rounded-full px-3 py-2 text-xs font-medium ${
                    complete
                      ? 'bg-emerald-400/10 text-emerald-200'
                      : active
                        ? 'bg-white text-black'
                        : 'bg-white/5 text-white/35'
                  }`}
                >
                  {complete ? '✓' : number} {label}
                </div>
              );
            })}
          </div>
        </div>

        {step === 'footage' && (
          <section className="animate-fade-in overflow-hidden rounded-[28px] border border-white/10 bg-[#101012]">
            <div className="grid lg:grid-cols-[1.2fr_0.8fr]">
              <div className="border-b border-white/10 p-5 md:p-7 lg:border-b-0 lg:border-r">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="text-xs font-semibold uppercase tracking-[0.18em] text-white/40">Your footage</div>
                    <h2 className="mt-2 text-xl font-semibold">Three moments tell the whole story</h2>
                  </div>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="inline-flex items-center gap-2 rounded-full border border-white/15 px-4 py-2 text-xs font-semibold text-white/80 transition hover:border-white/30 hover:bg-white/5"
                  >
                    <Upload className="h-3.5 w-3.5" />
                    Add local clips
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="video/*"
                    multiple
                    className="hidden"
                    onChange={(event) => event.target.files && addLocalFiles(event.target.files)}
                  />
                </div>

                <div className="mt-6 grid gap-3 sm:grid-cols-3">
                  {clips.map((clip, index) => (
                    <article key={clip.id} className="overflow-hidden rounded-2xl border border-white/10 bg-black/30">
                      <div className={`relative aspect-[4/5] overflow-hidden bg-gradient-to-br ${clip.tone}`}>
                        {clip.preview ? (
                          <video src={clip.preview} muted className="h-full w-full object-cover" />
                        ) : (
                          <div className="absolute inset-0">
                            <div className="absolute inset-x-5 bottom-5 h-20 rounded-[50%] bg-white/[0.08] blur-xl" />
                            <div className="absolute bottom-7 left-6 right-6 h-12 rounded-xl border border-white/10 bg-white/[0.06]" />
                            <Film className="absolute left-1/2 top-1/2 h-8 w-8 -translate-x-1/2 -translate-y-1/2 text-white/35" />
                          </div>
                        )}
                        <div className="absolute left-3 top-3 rounded-full bg-black/60 px-2.5 py-1 text-[10px] font-medium text-white/75">
                          Clip {index + 1}
                        </div>
                      </div>
                      <div className="p-3">
                        <div className="truncate text-sm font-medium text-white/85">{clip.name}</div>
                        <div className="mt-1 text-xs text-white/35">{clip.detail}</div>
                      </div>
                    </article>
                  ))}
                </div>
              </div>

              <div className="flex flex-col justify-between p-5 md:p-7">
                <div>
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-violet-400/10 text-violet-200">
                    <MessageSquareText className="h-5 w-5" />
                  </div>
                  <h2 className="mt-5 text-xl font-semibold">What should this video accomplish?</h2>
                  <p className="mt-2 text-sm leading-6 text-white/45">
                    One sentence is enough. The AI will infer the rest from the footage and ask only what matters.
                  </p>
                  <textarea
                    value={instruction}
                    onChange={(event) => setInstruction(event.target.value)}
                    rows={5}
                    className="mt-5 w-full resize-none rounded-2xl border border-white/10 bg-black/25 px-4 py-3 text-sm leading-6 text-white outline-none placeholder:text-white/25 focus:border-violet-300/50"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => setStep('brief')}
                  disabled={!clips.length || !instruction.trim()}
                  className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-semibold text-black transition hover:bg-violet-100 disabled:opacity-40"
                >
                  <Sparkles className="h-4 w-4" />
                  Review my footage
                </button>
              </div>
            </div>
          </section>
        )}

        {step === 'brief' && (
          <section className="animate-fade-in rounded-[28px] border border-white/10 bg-[#101012] p-5 md:p-8">
            <div className="grid gap-8 lg:grid-cols-[0.78fr_1.22fr]">
              <div>
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-violet-400/10 text-violet-200">
                  <Sparkles className="h-5 w-5" />
                </div>
                <div className="mt-5 text-xs font-semibold uppercase tracking-[0.18em] text-violet-300">What I understood</div>
                <h2 className="mt-2 text-2xl font-semibold tracking-tight">You want trust, proof, and a strong finish.</h2>
                <p className="mt-3 text-sm leading-6 text-white/50">
                  I found a clear transformation, useful process footage, and a natural customer reaction. I’ll keep those moments and avoid making it feel over-produced.
                </p>
                <div className="mt-6 space-y-3">
                  {[
                    ['Best format', 'Vertical social video'],
                    ['Strongest hook', 'Finished patio reveal'],
                    ['Must-keep moment', 'Customer reaction'],
                    ['Recommended length', '20–30 seconds'],
                  ].map(([label, value]) => (
                    <div key={label} className="flex items-center justify-between gap-4 border-b border-white/10 pb-3 text-sm">
                      <span className="text-white/35">{label}</span>
                      <span className="text-right font-medium text-white/85">{value}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-2xl border border-white/10 bg-black/20 p-5 md:p-6">
                <div className="text-xs font-semibold uppercase tracking-[0.18em] text-white/40">Two quick questions</div>
                <Question
                  label="What matters most?"
                  value={goal}
                  options={['Get more leads', 'Build trust', 'Show the transformation']}
                  onChange={setGoal}
                />
                <Question
                  label="How should it feel?"
                  value={tone}
                  options={['Warm and genuine', 'Bold and energetic', 'Clean and premium']}
                  onChange={setTone}
                />
                <div className="mt-7 rounded-2xl border border-emerald-400/15 bg-emerald-400/[0.06] p-4 text-sm leading-6 text-emerald-100/75">
                  <strong className="text-emerald-100">My assumption:</strong> this is for Instagram and Facebook. You can change that later in plain language.
                </div>
                <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <button type="button" onClick={() => setStep('footage')} className="inline-flex items-center gap-2 text-sm text-white/45 hover:text-white">
                    <ArrowLeft className="h-4 w-4" />
                    Back
                  </button>
                  <button
                    type="button"
                    onClick={createPlan}
                    disabled={!goal || !tone}
                    className="inline-flex items-center justify-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-semibold text-black transition hover:bg-violet-100 disabled:opacity-40"
                  >
                    <Check className="h-4 w-4" />
                    Make my edit plan
                  </button>
                </div>
              </div>
            </div>
          </section>
        )}

        {step === 'plan' && (
          <section className="animate-fade-in space-y-5">
            <div className="overflow-hidden rounded-[28px] border border-white/10 bg-[#101012]">
              <div className="border-b border-white/10 p-5 md:p-8">
                <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
                  <div>
                    <div className="text-xs font-semibold uppercase tracking-[0.18em] text-violet-300">Edit plan · Version {currentPlan.number}</div>
                    <h2 className="mt-3 text-2xl font-semibold tracking-tight md:text-3xl">{currentPlan.headline}</h2>
                    <p className="mt-3 max-w-3xl text-sm leading-6 text-white/55">{currentPlan.summary}</p>
                  </div>
                  <div className={`shrink-0 rounded-full px-3 py-2 text-xs font-semibold ${approved ? 'bg-emerald-400/10 text-emerald-200' : 'bg-white/5 text-white/50'}`}>
                    {approved ? '✓ Plan approved' : currentPlan.length}
                  </div>
                </div>
              </div>

              <div className="grid lg:grid-cols-[1.3fr_0.7fr]">
                <div className="border-b border-white/10 p-5 md:p-8 lg:border-b-0 lg:border-r">
                  <h3 className="text-sm font-semibold">What Sitecraft will change</h3>
                  <div className="mt-4 space-y-2">
                    {currentPlan.checklist.filter((item) => item.enabled).map((item, index) => (
                      <div key={item.id} className="flex gap-4 rounded-2xl border border-white/8 bg-black/20 p-4">
                        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-400/10 text-xs font-semibold text-emerald-200">
                          {index + 1}
                        </div>
                        <div>
                          <div className="text-sm font-medium text-white/90">{item.label}</div>
                          <div className="mt-1 text-xs leading-5 text-white/40">{item.description}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <aside className="p-5 md:p-8">
                  <div className="text-xs font-semibold uppercase tracking-[0.18em] text-white/40">Story order</div>
                  <ol className="mt-5 space-y-5">
                    {[
                      ['0–3 sec', 'Open on the finished patio'],
                      ['3–14 sec', 'Show the transformation and craft'],
                      ['14–22 sec', 'Customer reaction with captions'],
                      ['Final beat', 'Brand and simple next step'],
                    ].map(([time, scene]) => (
                      <li key={time} className="grid grid-cols-[58px_1fr] gap-3 text-sm">
                        <span className="text-white/30">{time}</span>
                        <span className="text-white/75">{scene}</span>
                      </li>
                    ))}
                  </ol>
                </aside>
              </div>
            </div>

            <div className="grid gap-5 lg:grid-cols-2">
              <div className="rounded-[24px] border border-white/10 bg-[#101012] p-5">
                <label htmlFor="demo-revision" className="text-sm font-semibold">Want a change? Just say it.</label>
                <div className="mt-3 flex gap-2">
                  <input
                    id="demo-revision"
                    value={revision}
                    onChange={(event) => setRevision(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter') revisePlan();
                    }}
                    placeholder="Make it shorter and use my brand colors."
                    className="min-w-0 flex-1 rounded-full border border-white/10 bg-black/25 px-4 py-3 text-sm text-white outline-none placeholder:text-white/25 focus:border-violet-300/50"
                  />
                  <button
                    type="button"
                    onClick={revisePlan}
                    disabled={!revision.trim()}
                    className="rounded-full bg-white px-5 py-3 text-sm font-semibold text-black transition hover:bg-violet-100 disabled:opacity-40"
                  >
                    Update
                  </button>
                </div>
              </div>

              <details className="rounded-[24px] border border-white/10 bg-[#101012]">
                <summary className="flex cursor-pointer list-none items-center justify-between p-5 text-sm font-semibold">
                  Advanced edit checklist
                  <ChevronDown className="h-4 w-4 text-white/40" />
                </summary>
                <div className="space-y-3 border-t border-white/10 p-5">
                  {currentPlan.checklist.map((item) => (
                    <label key={item.id} className="flex cursor-pointer items-start gap-3">
                      <input
                        type="checkbox"
                        checked={item.enabled}
                        onChange={() => toggleChecklist(item.id)}
                        className="mt-1 h-4 w-4 accent-violet-400"
                      />
                      <span>
                        <span className="block text-sm text-white/80">{item.label}</span>
                        {item.planned && <span className="text-xs text-white/35">Available when rendering is connected</span>}
                      </span>
                    </label>
                  ))}
                </div>
              </details>
            </div>

            <div className="flex flex-col gap-4 rounded-[24px] border border-amber-300/15 bg-amber-300/[0.06] p-5 md:flex-row md:items-center md:justify-between">
              <div className="max-w-2xl">
                <div className="text-sm font-semibold text-amber-100">Demo boundary</div>
                <p className="mt-1 text-xs leading-5 text-amber-100/55">
                  This preview saves nothing and renders nothing. It demonstrates the approved journey while uploads, transcription, and media rendering remain safely disconnected.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setApproved(true)}
                disabled={approved}
                className="inline-flex shrink-0 items-center justify-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-semibold text-black transition hover:bg-emerald-100 disabled:bg-emerald-200"
              >
                <Check className="h-4 w-4" />
                {approved ? 'Plan approved' : 'Approve this plan'}
              </button>
            </div>

            {versions.length > 1 && (
              <details className="rounded-[24px] border border-white/10 bg-[#101012]">
                <summary className="flex cursor-pointer list-none items-center gap-2 p-5 text-sm font-semibold">
                  <History className="h-4 w-4 text-violet-300" />
                  Version history
                </summary>
                <div className="grid gap-2 border-t border-white/10 p-5 sm:grid-cols-2">
                  {[...versions].reverse().map((version) => (
                    <button
                      key={version.number}
                      type="button"
                      onClick={() => {
                        setCurrentVersion(version.number);
                        setApproved(false);
                      }}
                      className={`flex items-center justify-between rounded-xl border p-3 text-left ${
                        version.number === currentVersion
                          ? 'border-violet-300/40 bg-violet-300/10'
                          : 'border-white/10 bg-black/20 hover:border-white/20'
                      }`}
                    >
                      <span>
                        <span className="block text-sm text-white/80">Version {version.number}</span>
                        <span className="text-xs text-white/35">{version.headline}</span>
                      </span>
                      {version.number === currentVersion ? (
                        <span className="text-xs text-violet-200">Current</span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs text-white/50"><RotateCcw className="h-3 w-3" /> Restore</span>
                      )}
                    </button>
                  ))}
                </div>
              </details>
            )}

            <button type="button" onClick={restart} className="inline-flex items-center gap-2 text-sm text-white/40 hover:text-white">
              <RotateCcw className="h-4 w-4" />
              Restart demo
            </button>
          </section>
        )}
      </div>
    </main>
  );
}

function Question({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (value: string) => void;
}) {
  return (
    <div className="mt-6">
      <div className="text-sm font-semibold text-white">{label}</div>
      <div className="mt-3 flex flex-wrap gap-2">
        {options.map((option) => (
          <button
            key={option}
            type="button"
            onClick={() => onChange(option)}
            className={`rounded-full border px-4 py-2 text-xs font-medium transition ${
              value === option
                ? 'border-white bg-white text-black'
                : 'border-white/10 bg-white/[0.03] text-white/55 hover:border-white/25 hover:text-white'
            }`}
          >
            {option}
          </button>
        ))}
      </div>
    </div>
  );
}
