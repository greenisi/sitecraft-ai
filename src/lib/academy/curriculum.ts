import type { LucideIcon } from 'lucide-react';
import {
  BarChart3,
  Bot,
  Database,
  Globe2,
  Megaphone,
  Workflow,
} from 'lucide-react';

export interface AcademyModule {
  id: string;
  number: string;
  title: string;
  description: string;
  duration: string;
  lessons: number;
  status: 'available' | 'preview' | 'coming-soon';
  icon: LucideIcon;
}

export interface BackendRecommendation {
  title: string;
  description: string;
  outcome: string;
  accent: string;
}

export const ACADEMY_MODULES: AcademyModule[] = [
  {
    id: 'website',
    number: '01',
    title: 'Build your AI-powered website',
    description: 'Turn a plain-language business brief into a polished, conversion-ready website.',
    duration: '18 min',
    lessons: 4,
    status: 'available',
    icon: Globe2,
  },
  {
    id: 'backend',
    number: '02',
    title: 'Connect your business backend',
    description: 'Route leads, bookings, orders, and content into one operational workspace.',
    duration: '22 min',
    lessons: 5,
    status: 'preview',
    icon: Database,
  },
  {
    id: 'automations',
    number: '03',
    title: 'Automate repetitive work',
    description: 'Build follow-ups, reminders, fulfillment steps, and owner notifications.',
    duration: '28 min',
    lessons: 6,
    status: 'coming-soon',
    icon: Workflow,
  },
  {
    id: 'assistant',
    number: '04',
    title: 'Create your daily AI assistant',
    description: 'Use AI to summarize activity, prepare replies, and keep work moving.',
    duration: '25 min',
    lessons: 5,
    status: 'coming-soon',
    icon: Bot,
  },
  {
    id: 'marketing',
    number: '05',
    title: 'Run your marketing engine',
    description: 'Repurpose business information into SEO, posts, ads, and campaigns.',
    duration: '31 min',
    lessons: 7,
    status: 'coming-soon',
    icon: Megaphone,
  },
  {
    id: 'insights',
    number: '06',
    title: 'Make decisions from your data',
    description: 'Turn leads, sales, bookings, and campaign activity into useful next actions.',
    duration: '20 min',
    lessons: 4,
    status: 'coming-soon',
    icon: BarChart3,
  },
];

export const LESSON_BUILD_STEPS = [
  {
    title: 'Describe the business outcome',
    detail: 'Lead with who you help, what you sell, and the one action the website should drive.',
  },
  {
    title: 'Turn on Power Mode',
    detail: 'Use the extra reasoning power when page depth, original art direction, and working interactions matter.',
  },
  {
    title: 'Review the customer journey',
    detail: 'Check the promise, proof, offer, and primary action before adjusting colors or decorative details.',
  },
  {
    title: 'Connect the next business system',
    detail: 'Let Site Craft recommend the smallest backend that can capture and act on the website data.',
  },
];

export const BACKEND_RECOMMENDATIONS: Record<string, BackendRecommendation[]> = {
  service: [
    {
      title: 'Lead & estimate inbox',
      description: 'Send every quote form into one pipeline with service, location, urgency, and contact details.',
      outcome: 'Stop losing requests in email and text threads.',
      accent: 'from-cyan-500/25 to-blue-500/10',
    },
    {
      title: 'Booking follow-up flow',
      description: 'Confirm appointments, remind customers, and prepare an AI-written reply for new inquiries.',
      outcome: 'Respond faster without watching the inbox all day.',
      accent: 'from-violet-500/25 to-fuchsia-500/10',
    },
  ],
  ecommerce: [
    {
      title: 'Order operations center',
      description: 'Collect paid orders, customer information, item details, and fulfillment status in one place.',
      outcome: 'Know exactly what needs to ship next.',
      accent: 'from-emerald-500/25 to-teal-500/10',
    },
    {
      title: 'Fulfillment alerts',
      description: 'Flag new, delayed, or high-value orders and create a daily owner summary automatically.',
      outcome: 'Catch fulfillment problems before customers do.',
      accent: 'from-amber-500/25 to-orange-500/10',
    },
  ],
  realestate: [
    {
      title: 'Property inquiry pipeline',
      description: 'Attach every buyer inquiry to its property, price range, timeframe, and contact record.',
      outcome: 'Follow up with context instead of starting cold.',
      accent: 'from-amber-500/25 to-yellow-500/10',
    },
    {
      title: 'Viewing scheduler',
      description: 'Capture requested viewing times, notify the agent, and prepare confirmation messages.',
      outcome: 'Turn listing traffic into organized appointments.',
      accent: 'from-sky-500/25 to-indigo-500/10',
    },
  ],
  general: [
    {
      title: 'Shared customer inbox',
      description: 'Capture contact forms, customer details, notes, and status in one searchable workspace.',
      outcome: 'Give the business one source of truth.',
      accent: 'from-violet-500/25 to-indigo-500/10',
    },
    {
      title: 'AI daily briefing',
      description: 'Summarize new leads, open work, customer questions, and the three best next actions.',
      outcome: 'Start each day knowing what deserves attention.',
      accent: 'from-rose-500/25 to-orange-500/10',
    },
  ],
};

export const STARTER_PROMPT = `Create a premium multi-page website for [BUSINESS NAME], a [BUSINESS TYPE] serving [CUSTOMER] in [LOCATION].

The website must make customers feel [3 BRAND FEELINGS]. Its main goal is to get visitors to [PRIMARY ACTION]. Lead with [STRONGEST OFFER], prove trust with [REVIEWS / RESULTS / CREDENTIALS], and include pages for [PAGE LIST].

Customers should be able to [FORM / BOOK / BUY]. After the website is created, recommend the simplest backend that captures that information and tells the owner what to do next.`;
