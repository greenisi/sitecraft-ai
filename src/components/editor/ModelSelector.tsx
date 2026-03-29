"use client";

import { Lock } from "lucide-react";
import { type ModelTier, MODEL_TIERS } from "@/lib/ai/models";

const TIER_ORDER: ModelTier[] = ["quick-build", "pro-build", "lightning", "architect"];

interface ModelSelectorProps {
  selected: ModelTier;
  onSelect: (tier: ModelTier) => void;
  isPaid?: boolean;
  compact?: boolean;
}

export function ModelSelector({ selected, onSelect, isPaid = false, compact = false }: ModelSelectorProps) {
  if (compact) {
    return (
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
        {TIER_ORDER.map((tierId) => {
          const t = MODEL_TIERS[tierId];
          const locked = t.requiresPro && !isPaid;
          const active = selected === tierId;
          return (
            <button
              key={tierId}
              type="button"
              onClick={() => !locked && onSelect(tierId)}
              disabled={locked}
              title={locked ? `Upgrade to Pro to use ${t.displayName}` : t.description}
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
              {!locked && t.requiresPro && (
                <span className="text-[9px] font-bold text-violet-400/70">PRO</span>
              )}
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
      {TIER_ORDER.map((tierId) => {
        const t = MODEL_TIERS[tierId];
        const locked = t.requiresPro && !isPaid;
        const active = selected === tierId;
        return (
          <button
            key={tierId}
            type="button"
            onClick={() => !locked && onSelect(tierId)}
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
            {!locked && t.requiresPro && (
              <div className="absolute top-1.5 right-1.5 bg-violet-500/20 text-violet-400 text-[9px] font-bold px-1.5 py-0.5 rounded-full">
                PRO
              </div>
            )}
            <span className="text-lg">{t.badge}</span>
            <span className={`text-xs font-semibold ${active ? "text-purple-300" : "text-white"}`}>
              {t.displayName}
            </span>
            <span className="text-[10px] text-slate-500 leading-tight">{t.description}</span>
          </button>
        );
      })}
    </div>
  );
}

export type { ModelTier };
