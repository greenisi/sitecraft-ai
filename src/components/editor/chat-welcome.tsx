'use client';

import { Sparkles, Building2, Globe, Utensils, Wrench } from 'lucide-react';

interface ChatWelcomeProps {
  onSuggestionClick: (prompt: string) => void;
}

const SUGGESTIONS = [
  {
    label: 'Landscaping Company',
    icon: Building2,
    prompt:
      'Create a professional website for GreenScape Elite, a landscaping company in Austin, TX. They do residential and commercial landscaping design and maintenance.',
  },
  {
    label: 'SaaS Landing Page',
    icon: Globe,
    prompt:
      'Build a modern SaaS landing page for an AI-powered project management tool called FlowSync. Include pricing, features, and testimonials.',
  },
  {
    label: 'Restaurant Website',
    icon: Utensils,
    prompt:
      'Create a warm, inviting website for Bella Italia, an Italian restaurant in downtown Chicago with a focus on homemade pasta and wood-fired pizza.',
  },
  {
    label: 'Local Plumber',
    icon: Wrench,
    prompt:
      'Build a website for QuickFix Plumbing, a 24/7 emergency plumbing service in Denver, CO. They handle residential and commercial plumbing repairs.',
  },
];

export function ChatWelcome({ onSuggestionClick }: ChatWelcomeProps) {
  return (
    <div className="flex h-full flex-col items-center justify-center px-5 py-10">
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 shadow-lg shadow-violet-500/25 mb-5 animate-fade-in">
        <Sparkles className="h-6 w-6 text-white" />
      </div>
      <h2 className="text-lg font-bold mb-1.5 animate-fade-in">What would you like to build?</h2>
      <p className="text-sm text-muted-foreground text-center mb-6 max-w-xs animate-fade-in">
        Describe your website and AI will generate a complete, production-ready site.
      </p>
      <div className="grid grid-cols-1 gap-2 w-full max-w-sm">
        {SUGGESTIONS.map((suggestion, i) => (
          <button
            key={suggestion.label}
            onClick={() => onSuggestionClick(suggestion.prompt)}
            className="group flex items-center gap-3 rounded-xl border border-border/50 bg-card px-4 py-3 text-left text-sm transition-all duration-200 hover:border-violet-500/20 hover:bg-accent hover:shadow-md hover:shadow-violet-500/5 hover:-translate-y-0.5 animate-fade-in-up"
            style={{ animationDelay: `${i * 80}ms`, animationFillMode: 'backwards' }}
          >
            <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-violet-500/10 transition-colors group-hover:bg-violet-500/20">
              <suggestion.icon className="h-4 w-4 text-violet-500" />
            </div>
            <span className="font-medium">{suggestion.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
