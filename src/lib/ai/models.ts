/**
 * Branded AI model tiers for SiteCraft.
 * Real model names are hidden from users — they only see the branded tier names.
 */

export type ModelTier = 'quick-build' | 'pro-build' | 'architect' | 'lightning';

export interface ModelConfig {
  tier: ModelTier;
  displayName: string;
  description: string;
  badge: string;
  requiresPro: boolean;
  provider: 'openrouter';
  modelId: string;
  maxTokens: number;
  reasoningEffort?: 'max' | 'xhigh' | 'high' | 'medium' | 'low' | 'minimal' | 'none';
}

export const MODEL_TIERS: Record<ModelTier, ModelConfig> = {
  'quick-build': {
    tier: 'quick-build',
    displayName: 'Quick Build',
    description: 'Fast and capable — great for most websites',
    badge: '⚡',
    requiresPro: false,
    provider: 'openrouter',
    modelId: 'moonshotai/kimi-k3',
    maxTokens: 64000,
  },
  'pro-build': {
    tier: 'pro-build',
    displayName: 'Standard',
    description: 'Smart, fast generation for most websites',
    badge: '✦',
    requiresPro: true,
    provider: 'openrouter',
    modelId: 'moonshotai/kimi-k3',
    maxTokens: 64000,
  },
  'architect': {
    tier: 'architect',
    displayName: 'Power Mode',
    description: 'More reasoning power for complex, high-detail builds',
    badge: '⚡',
    requiresPro: true,
    provider: 'openrouter',
    modelId: 'anthropic/claude-opus-5',
    maxTokens: 64000,
    reasoningEffort: 'max',
  },
  'lightning': {
    tier: 'lightning',
    displayName: 'Lightning',
    description: 'Fastest generation — great for quick iterations',
    badge: '⚡',
    requiresPro: true,
    provider: 'openrouter',
    modelId: 'moonshotai/kimi-k3',
    maxTokens: 64000,
  },
};

export const DEFAULT_FREE_TIER: ModelTier = 'quick-build';
export const DEFAULT_PRO_TIER: ModelTier = 'pro-build';

export function getModelConfig(tier: ModelTier): ModelConfig {
  return MODEL_TIERS[tier];
}

export function getAvailableTiers(isPro: boolean): ModelConfig[] {
  return Object.values(MODEL_TIERS).filter(m => !m.requiresPro || isPro);
}
