'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Sparkles, ArrowRight, Tag, Check } from 'lucide-react';
import { PREMIUM_TEMPLATES, TEMPLATE_CATEGORIES, type PremiumTemplate } from '@/lib/templates/premium-templates';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export default function TemplatesPage() {
  const router = useRouter();
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const filteredTemplates =
    selectedCategory === 'All'
      ? PREMIUM_TEMPLATES
      : PREMIUM_TEMPLATES.filter((t) => t.category === selectedCategory);

  const handleUseTemplate = async (template: PremiumTemplate) => {
    if (loadingId) return;
    setLoadingId(template.id);
    try {
      const res = await fetch('/api/templates/use', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ templateId: template.id }),
      });
      if (!res.ok) throw new Error('Failed to create project from template');
      const { projectId } = await res.json();
      router.push(`/projects/${projectId}`);
    } catch (err) {
      console.error(err);
      setLoadingId(null);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-violet-600 via-purple-600 to-indigo-700 p-8 text-white">
        <div className="absolute -top-20 -right-20 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-10 -left-10 w-48 h-48 bg-white/5 rounded-full blur-2xl" />
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="h-5 w-5 text-yellow-300" />
            <span className="text-sm font-medium text-white/80 uppercase tracking-wider">Premium Templates</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold mb-3">
            Launch with a $10,000 Design
          </h1>
          <p className="text-white/70 text-lg max-w-2xl">
            Choose a professionally designed template, customize it with your business details,
            and let AI generate a stunning website in seconds. Every template includes
            animations, mobile responsiveness, and conversion-optimized layouts.
          </p>
        </div>
      </div>

      {/* Category filter */}
      <div className="flex flex-wrap gap-2">
        {TEMPLATE_CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
              selectedCategory === cat
                ? 'bg-violet-600 text-white shadow-lg shadow-violet-500/25'
                : 'bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Templates Grid */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {filteredTemplates.map((template) => (
          <div
            key={template.id}
            className="group relative flex flex-col rounded-2xl border border-border bg-card overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-black/10 hover:border-violet-500/30"
            onMouseEnter={() => setHoveredId(template.id)}
            onMouseLeave={() => setHoveredId(null)}
          >
            {/* Preview gradient */}
            <div className={`relative h-40 bg-gradient-to-br ${template.previewGradient} flex items-center justify-center overflow-hidden`}>
              {/* Decorative orbs */}
              <div
                className="absolute -top-8 -right-8 w-32 h-32 rounded-full blur-2xl opacity-40"
                style={{ backgroundColor: template.accentColor }}
              />
              <div
                className="absolute -bottom-8 -left-8 w-24 h-24 rounded-full blur-2xl opacity-30"
                style={{ backgroundColor: template.accentColor }}
              />
              {/* Template name watermark */}
              <div className="relative z-10 text-center px-4">
                <p className="text-white/30 text-xs uppercase tracking-widest font-medium mb-1">Template</p>
                <p className="text-white font-bold text-lg leading-tight">{template.name}</p>
                <div className="flex items-center justify-center gap-1 mt-2">
                  <div
                    className="w-3 h-3 rounded-full ring-2 ring-white/20"
                    style={{ backgroundColor: template.accentColor }}
                  />
                  <span className="text-white/60 text-xs">{template.style}</span>
                </div>
              </div>
              {/* Hover overlay */}
              <div className={`absolute inset-0 bg-black/40 flex items-center justify-center transition-opacity duration-200 ${hoveredId === template.id ? 'opacity-100' : 'opacity-0'}`}>
                <button
                  onClick={() => handleUseTemplate(template)}
                  disabled={loadingId !== null}
                  className="flex items-center gap-2 px-5 py-2.5 bg-white text-gray-900 rounded-full text-sm font-semibold hover:bg-white/90 transition-all duration-200 hover:scale-105 disabled:opacity-50"
                >
                  {loadingId === template.id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Sparkles className="h-4 w-4" />
                  )}
                  Use Template
                </button>
              </div>
            </div>

            {/* Card body */}
            <div className="flex flex-col flex-1 p-4 gap-3">
              <div>
                <div className="flex items-start justify-between gap-2 mb-1">
                  <h3 className="font-semibold text-base text-foreground leading-tight">{template.name}</h3>
                  <Badge variant="outline" className="text-xs flex-shrink-0">{template.category}</Badge>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">{template.description}</p>
              </div>

              {/* Tags */}
              <div className="flex flex-wrap gap-1">
                {template.tags.slice(0, 3).map((tag) => (
                  <span key={tag} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-muted text-muted-foreground text-xs">
                    <Tag className="h-2.5 w-2.5" />
                    {tag}
                  </span>
                ))}
              </div>

              {/* Features */}
              <div className="space-y-1 pt-1 border-t border-border">
                {['Scroll animations', 'Mobile responsive', 'SEO optimized'].map((feat) => (
                  <div key={feat} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Check className="h-3 w-3 text-green-500 flex-shrink-0" />
                    {feat}
                  </div>
                ))}
              </div>

              {/* CTA */}
              <Button
                onClick={() => handleUseTemplate(template)}
                disabled={loadingId !== null}
                className="w-full mt-auto bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white border-0"
                size="sm"
              >
                {loadingId === template.id ? (
                  <>
                    <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    Use This Template
                    <ArrowRight className="ml-2 h-3.5 w-3.5" />
                  </>
                )}
              </Button>
            </div>
          </div>
        ))}
      </div>

      {filteredTemplates.length === 0 && (
        <div className="text-center py-16 text-muted-foreground">
          <Sparkles className="h-8 w-8 mx-auto mb-3 opacity-30" />
          <p>No templates in this category yet. More coming soon!</p>
        </div>
      )}
    </div>
  );
}

