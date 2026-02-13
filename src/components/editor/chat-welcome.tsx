'use client';

import { Sparkles } from 'lucide-react';

interface ChatWelcomeProps {
  onSuggestionClick: (prompt: string) => void;
}

const SUGGESTIONS = [
  {
    label: 'Landscaping Company',
    prompt: 'Create a professional website for GreenScape Elite, a landscaping company in Austin, TX. They do residential and commercial landscaping design and maintenance.',
  },
  {
    label: 'SaaS Landing Page',
    prompt: 'Build a modern SaaS landing page for an AI-powered project management tool called FlowSync. Include pricing, features, and testimonials.',
  },
  {
    label: 'Restaurant Website',
    prompt: 'Create a warm, inviting website for Bella Italia, an Italian restaurant in downtown Chicago with a focus on homemade pasta and wood-fired pizza.',
  },
  {
    label: 'Local Plumber',
    prompt: 'Build a website for QuickFix Plumbing, a 24/7 emergency plumbing service in Denver, CO. They handle residential and commercial plumbing repairs.',
  },
];

export function ChatWelcome({ onSuggestionClick }: ChatWelcomeProps) {
  return (
    <div className="flex h-full flex-col items-center justify-center px-6 py-12">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 mb-6">
        <Sparkles className="h-7 w-7 text-primary" />
      </div>
      <h2 className="text-xl font-semibold mb-2">What would you like to build?</h2>
      <p className="text-sm text-muted-foreground text-center mb-8 max-w-sm">
        Describe your website in a few words and I&apos;ll generate a complete, production-ready site for you.
      </p>

      <div className="grid grid-cols-1 gap-3 w-full max-w-sm">
        {SUGGESTIONS.map((suggestion) => (
          <button
            key={suggestion.label}
            onClick={() => onSuggestionClick(suggestion.prompt)}
            className="rounded-xl border bg-card px-4 py-3 text-left text-sm transition-colors hover:bg-accent hover:text-accent-foreground"
          >
            <span className="font-medium">{suggestion.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
