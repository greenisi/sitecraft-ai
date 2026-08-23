"use client";

import { Gauge, Lock, Zap } from "lucide-react";
import { type ModelTier, MODEL_TIERS } from "@/lib/ai/models";

const VISIBLE_TIERS: ModelTier[] = ["pro-build", "architect"];

interface ModelSelectorProps {
  selected: ModelTier;
  onSelect: (tier: ModelTier) => void;
  isPaid?: boolean;
  compact?: boolean;
}

export function ModelSelector({
  selected,
  onSelect,
  isPaid = false,
  compact = false,
}: ModelSelectorProps) {
  // Saved projects may still carry an older Quick Build or Lightning value.
  // Present those as Standard until the user explicitly chooses Power Mode.
  const visibleSelection = selected === "architect" ? "architect" : "pro-build";

  if (compact) {
    return (
      <div
        className="inline-flex max-w-full items-center gap-1 rounded-xl border border-border/70 bg-muted/45 p-1"
        aria-label="Website generation power"
      >
        {VISIBLE_TIERS.map((tierId) => {
          const tier = MODEL_TIERS[tierId];
          const locked = tier.requiresPro && !isPaid;
          const active = visibleSelection === tierId;
          const isPower = tierId === "architect";

          return (
            <button
              key={tierId}
              type="button"
              onClick={() => !locked && onSelect(tierId)}
              disabled={locked}
              aria-pressed={active}
              title={locked ? `Upgrade to use ${tier.displayName}` : tier.description}
              className={`group flex min-h-9 items-center gap-2 rounded-lg px-3 text-xs font-semibold whitespace-nowrap transition-all ${
                active
                  ? isPower
                    ? "border border-amber-400/35 bg-amber-400/12 text-amber-200 shadow-sm shadow-amber-500/10"
                    : "border border-primary/25 bg-background text-foreground shadow-sm"
                  : locked
                    ? "cursor-not-allowed text-muted-foreground/45"
                    : "border border-transparent text-muted-foreground hover:bg-background/65 hover:text-foreground"
              }`}
            >
              {isPower ? (
                <Zap className="h-3.5 w-3.5" aria-hidden="true" />
              ) : (
                <Gauge className="h-3.5 w-3.5" aria-hidden="true" />
              )}
              <span>{tier.displayName}</span>
              {isPower && (
                <span className="rounded-full bg-amber-300/15 px-1.5 py-0.5 text-[9px] font-black tracking-[0.08em] text-amber-300">
                  MORE POWER
                </span>
              )}
              {locked && <Lock className="h-3 w-3" aria-hidden="true" />}
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      {VISIBLE_TIERS.map((tierId) => {
        const tier = MODEL_TIERS[tierId];
        const locked = tier.requiresPro && !isPaid;
        const active = visibleSelection === tierId;
        const isPower = tierId === "architect";

        return (
          <button
            key={tierId}
            type="button"
            onClick={() => !locked && onSelect(tierId)}
            disabled={locked}
            aria-pressed={active}
            className={`relative min-h-24 rounded-2xl border p-4 text-left transition-all ${
              active
                ? isPower
                  ? "border-amber-400/45 bg-amber-400/10 shadow-lg shadow-amber-500/10"
                  : "border-primary/40 bg-primary/8 shadow-lg shadow-primary/10"
                : locked
                  ? "cursor-not-allowed border-border/50 bg-muted/30 opacity-55"
                  : "border-border bg-muted/35 hover:border-primary/30 hover:bg-muted/60"
            }`}
          >
            <span className="flex items-center gap-2">
              {isPower ? (
                <Zap className="h-4 w-4 text-amber-300" aria-hidden="true" />
              ) : (
                <Gauge className="h-4 w-4 text-primary" aria-hidden="true" />
              )}
              <span className="font-semibold text-foreground">{tier.displayName}</span>
              {isPower && (
                <span className="rounded-full bg-amber-300/15 px-2 py-0.5 text-[9px] font-black tracking-[0.08em] text-amber-300">
                  MORE POWER
                </span>
              )}
              {locked && <Lock className="ml-auto h-3.5 w-3.5 text-muted-foreground" />}
            </span>
            <span className="mt-2 block text-xs leading-5 text-muted-foreground">
              {tier.description}
            </span>
          </button>
        );
      })}
    </div>
  );
}

export type { ModelTier };
