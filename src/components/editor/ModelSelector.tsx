"use client";

import { useState } from "react";
import { Lock } from "lucide-react";

type ModelTier = "quick-build" | "pro-build" | "architect" | "lightning";

interface TierOption {
  tier: ModelTier;
  displayName: string;
  description: string;
  badge: string;
  requiresPro: boolean;
}

const TIERS: TierOption[] = [
  { tier: "quick-build", displayName: "Quick Build", description: "Fast and capable", badge: "⚡", requiresPro: false },
  { tier: "pro-build", displayName: "Pro Build", description: "Fast and smart", badge: "🚀", requiresPro: true },
  { tier: "architect", displayName: "Architect Mode", description: "Highest quality", badge: "🏗️", requiresPro: true },
  { tier: "lightning", displayName: "Lightning", description: "Fastest", badge: "⚡", requiresPro: true },
];

interface ModelSelectorProps {
  selected: ModelTier;
  onSelect: (tier: ModelTier) => void;
  isPro?: boolean;
  compact?: boolean;
}

export function ModelSelector({ selected, onSelect, isPro = false, compact = false }: ModelSelectorProps) {
  const available = TIERS.filter((t) => !t.requiresPro || isPro);

  if (compact) {
    return (
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
        {TIERS.map((t) => {
          const locked = t.requiresPro && !isPro;
          const active = selected === t.tier;
          return (
            <button
              key={t.tier}
              onClick={() => !locked && onSelect(t.tier)}
              disabled={locked}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
                active
                  ? "bg-purple-500/20 text-purple-300 border border-purple-500/40"
                  : locked
                  ? "bg-slate-800/50 text-slate-600 cursor-not-allowed"
                  : "bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 border border-transparent"
              }`}
            >
              <span>{t.badge}</span>
              <span>{t.displayName}</span>
              {locked && <Lock className="w-3 h-3 text-slate-600" />}
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
      {TIERS.map((t) => {
        const locked = t.requiresPro && !isPro;
        const active = selected === t.tier;
        return (
          <button
            key={t.tier}
            onClick={() => !locked && onSelect(t.tier)}
            disabled={locked}
            className={`relative flex flex-col items-center gap-1 p-3 rounded-xl text-center transition-all min-h-[80px] ${
              active
                ? "bg-purple-500/15 border-2 border-purple-500/50 shadow-lg shadow-purple-500/10"
                : locked
                ? "bg-slate-800/40 border border-slate-700/50 opacity-50 cursor-not-allowed"
                : "bg-slate-800/60 border border-slate-700 hover:border-purple-500/30 hover:bg-slate-800"
            }`}
          >
            {locked && (
              <div className="absolute top-1.5 right-1.5 bg-amber-500/20 text-amber-400 text-[9px] font-bold px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
                <Lock className="w-2.5 h-2.5" /> PRO
              </div>
            )}
            <span className="text-lg">{t.badge}</span>
            <span className={`text-xs font-semibold ${active ? "text-purple-300" : "text-white"}`}>
              {t.displayName}
            </span>
            <span className="text-[10px] text-slate-500">{t.description}</span>
          </button>
        );
      })}
    </div>
  );
}

export type { ModelTier };
