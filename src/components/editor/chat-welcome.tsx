'use client';

import { Sparkles, MessageSquare, Palette, Layout, Globe, Lock } from 'lucide-react';

interface ChatWelcomeProps {
  onSuggestionClick: (prompt: string) => void;
  projectName?: string;
  projectDescription?: string;
  isPaid?: boolean;
}

export function ChatWelcome({ onSuggestionClick, projectName, projectDescription, isPaid = true }: ChatWelcomeProps) {
  const hasProjectInfo = projectName && projectName !== 'Untitled Project';
  const isLocked = !isPaid;

  // Smart starter questions based on project info
  const smartQuestions = hasProjectInfo
    ? [
        {
          label: 'Build my website',
          icon: Globe,
          prompt: `Build a professional website for ${projectName}.${projectDescription ? ' ' + projectDescription : ''} Make it modern, responsive, and include all essential pages.`,
        },
        {
          label: 'Help me plan first',
          icon: MessageSquare,
          prompt: `I want to create a website for ${projectName}.${projectDescription ? ' ' + projectDescription : ''} Before you start building, can you ask me a few questions to understand exactly what I need? I want to make sure it turns out perfect.`,
        },
        {
          label: 'Choose a style',
          icon: Palette,
          prompt: `I need a website for ${projectName}. Can you suggest 3 different design styles and color schemes that would work well for this type of business? Describe each option so I can pick my favorite before you start building.`,
        },
        {
          label: 'Plan the pages',
          icon: Layout,
          prompt: `For ${projectName}${projectDescription ? ' (' + projectDescription + ')' : ''}, what pages would you recommend? List out the ideal site structure with a brief description of what each page should include, then ask me if I want to add or remove anything.`,
        },
      ]
    : [
        {
          label: 'Help me get started',
          icon: MessageSquare,
          prompt: 'I want to create a website but I\'m not sure where to start. Can you ask me some questions to help figure out what I need?',
        },
        {
          label: 'Business website',
          icon: Globe,
          prompt: 'I need a professional business website. Can you ask me about my business so you can create something perfect for me?',
        },
        {
          label: 'Landing page',
          icon: Layout,
          prompt: 'I want to create a landing page. Can you help me figure out the right layout and content by asking me a few questions?',
        },
        {
          label: 'Choose a style',
          icon: Palette,
          prompt: 'Before building anything, can you help me pick a design style? Ask me about my preferences so you can suggest the perfect look.',
        },
      ];

  return (
    <div className="flex h-full flex-col items-center justify-center px-5 py-10">
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 shadow-lg shadow-violet-500/25 mb-5 animate-fade-in">
        <Sparkles className="h-6 w-6 text-white" />
      </div>

      {hasProjectInfo ? (
        <>
          <h2 className="text-lg font-bold mb-1.5 animate-fade-in text-center">
            {"Let's build "}{projectName}{"!"}
          </h2>
          {projectDescription && (
            <p className="text-xs text-muted-foreground text-center mb-2 max-w-xs animate-fade-in italic">
              &ldquo;{projectDescription}&rdquo;
            </p>
          )}
          <p className="text-sm text-muted-foreground text-center mb-6 max-w-xs animate-fade-in">
            How would you like to get started?
          </p>
        </>
      ) : (
        <>
          <h2 className="text-lg font-bold mb-1.5 animate-fade-in">What would you like to build?</h2>
          <p className="text-sm text-muted-foreground text-center mb-6 max-w-xs animate-fade-in">
            {"Tell me about your project and I'll help you create the perfect website."}
          </p>
        </>
      )}

      <div className="grid grid-cols-1 gap-2 w-full max-w-sm">
        {smartQuestions.map((suggestion, i) => (
          <button
            key={suggestion.label}
            onClick={() => onSuggestionClick(suggestion.prompt)}
            className={`group flex items-center gap-3 rounded-xl border border-border/50 bg-card px-4 py-3 text-left text-sm transition-all duration-200 animate-fade-in-up ${
              isLocked
                ? 'opacity-60 cursor-not-allowed hover:border-border/50 hover:bg-card hover:shadow-none hover:translate-y-0'
                : 'hover:border-violet-500/20 hover:bg-accent hover:shadow-md hover:shadow-violet-500/5 hover:-translate-y-0.5'
            }`}
            style={{ animationDelay: `${i * 80}ms`, animationFillMode: 'backwards' }}
          >
            <div className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg transition-colors ${
              isLocked
                ? 'bg-gray-500/10'
                : 'bg-violet-500/10 group-hover:bg-violet-500/20'
            }`}>
              {isLocked ? (
                <Lock className="h-4 w-4 text-gray-400" />
              ) : (
                <suggestion.icon className="h-4 w-4 text-violet-500" />
              )}
            </div>
            <span className={`font-medium ${isLocked ? 'text-muted-foreground' : ''}`}>{suggestion.label}</span>
            {isLocked && (
              <Lock className="h-3 w-3 text-gray-400 ml-auto flex-shrink-0" />
            )}
          </button>
        ))}
      </div>

      {isLocked && (
        <p className="text-xs text-muted-foreground text-center mt-4 animate-fade-in">
          Upgrade to Pro to unlock AI website generation
        </p>
      )}
    </div>
  );
            }
