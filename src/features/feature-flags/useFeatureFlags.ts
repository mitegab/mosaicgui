import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// ─── Types ─────────────────────────────────────────────────────────────────

export type FlagEnvironment = 'development' | 'staging' | 'production';

export interface FeatureFlag {
  key: string;
  name: string;
  description: string;
  enabled: boolean;
  rolloutPercent: number;
  environment: FlagEnvironment;
}

export interface ExperimentVariant {
  name: string;
  weight: number;
}

export interface Experiment {
  key: string;
  name: string;
  variants: ExperimentVariant[];
  active: boolean;
}

// ─── Stable per-browser bucket id ───────────────────────────────────────────

const BUCKET_ID_STORAGE_KEY = 'mosaic-flags-bucket-id';

function getBucketId(): string {
  if (typeof window === 'undefined') return 'server-bucket';
  try {
    let id = window.localStorage.getItem(BUCKET_ID_STORAGE_KEY);
    if (!id) {
      id = crypto.randomUUID();
      window.localStorage.setItem(BUCKET_ID_STORAGE_KEY, id);
    }
    return id;
  } catch {
    return 'ephemeral-bucket';
  }
}

/** Exposed for UI previews that need to display the raw bucket identity. */
export function getCurrentBucketId(): string {
  return getBucketId();
}

// ─── Deterministic hashing / bucketing ──────────────────────────────────────

/** FNV-1a 32-bit hash — fast, deterministic, good distribution for short strings. */
function hashString(input: string): number {
  let hash = 0x811c9dc5;
  for (let i = 0; i < input.length; i += 1) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
}

/** Maps a (bucketId, key) pair deterministically to a stable number in [0, 100). */
function bucketPercent(bucketId: string, key: string): number {
  const hash = hashString(`${bucketId}::${key}`);
  return (hash % 10000) / 100;
}

function bucketVariant(bucketId: string, key: string, variants: ExperimentVariant[]): string {
  const totalWeight = variants.reduce((sum, v) => sum + v.weight, 0) || 1;
  const point = (bucketPercent(bucketId, key) / 100) * totalWeight;
  let cumulative = 0;
  for (const variant of variants) {
    cumulative += variant.weight;
    if (point < cumulative) return variant.name;
  }
  return variants[variants.length - 1]?.name ?? '';
}

/** Exposed for UI previews so the rollout gauge can render without toggling the flag. */
export function bucketPreviewPercent(key: string): number {
  return bucketPercent(getCurrentBucketId(), key);
}

// ─── Seed data ───────────────────────────────────────────────────────────────

const SEED_FLAGS: FeatureFlag[] = [
  {
    key: 'new-query-graph-ui',
    name: 'New Query Graph UI',
    description: 'Redesigned node-based query graph editor with smoother drag interactions and inline validation.',
    enabled: true,
    rolloutPercent: 100,
    environment: 'production',
  },
  {
    key: 'ai-query-suggestions',
    name: 'AI Query Suggestions',
    description: 'Inline AI-powered autocomplete and suggestions while building queries in the DSL studio.',
    enabled: true,
    rolloutPercent: 50,
    environment: 'production',
  },
  {
    key: 'experimental-wasm-engine',
    name: 'Experimental WASM Engine',
    description: 'Executes supported queries locally via an in-browser WebAssembly engine instead of the backend.',
    enabled: true,
    rolloutPercent: 25,
    environment: 'staging',
  },
  {
    key: 'dark-launch-v2-inspector',
    name: 'Dark-launch Inspector v2',
    description: 'Next-generation schema inspector, dark-launched behind a flag for internal testing only.',
    enabled: true,
    rolloutPercent: 0,
    environment: 'development',
  },
];

const SEED_EXPERIMENTS: Experiment[] = [
  {
    key: 'run-button-color',
    name: 'Run Button Color',
    variants: [
      { name: 'purple', weight: 50 },
      { name: 'green', weight: 50 },
    ],
    active: true,
  },
];

// ─── Store ───────────────────────────────────────────────────────────────────

interface FeatureFlagsState {
  flags: FeatureFlag[];
  experiments: Experiment[];
  setFlag: (key: string, enabled: boolean) => void;
  setRolloutPercent: (key: string, percent: number) => void;
  setVariantWeight: (experimentKey: string, variantName: string, weight: number) => void;
  isEnabled: (key: string) => boolean;
  getVariant: (experimentKey: string) => string;
}

export const useFeatureFlags = create<FeatureFlagsState>()(
  persist(
    (set, get) => ({
      flags: SEED_FLAGS,
      experiments: SEED_EXPERIMENTS,

      setFlag: (key, enabled) =>
        set((state) => ({
          flags: state.flags.map((flag) => (flag.key === key ? { ...flag, enabled } : flag)),
        })),

      setRolloutPercent: (key, percent) =>
        set((state) => ({
          flags: state.flags.map((flag) =>
            flag.key === key ? { ...flag, rolloutPercent: Math.min(100, Math.max(0, Math.round(percent))) } : flag,
          ),
        })),

      setVariantWeight: (experimentKey, variantName, weight) =>
        set((state) => ({
          experiments: state.experiments.map((experiment) => {
            if (experiment.key !== experimentKey) return experiment;

            const clamped = Math.min(100, Math.max(0, Math.round(weight)));
            const others = experiment.variants.filter((v) => v.name !== variantName);
            const remaining = 100 - clamped;
            const othersTotalWeight = others.reduce((sum, v) => sum + v.weight, 0);

            const normalized = new Map(
              others.map((v) => [
                v.name,
                othersTotalWeight > 0
                  ? Math.round((v.weight / othersTotalWeight) * remaining)
                  : Math.round(remaining / (others.length || 1)),
              ]),
            );

            const variants = experiment.variants.map((v) =>
              v.name === variantName ? { ...v, weight: clamped } : { ...v, weight: normalized.get(v.name) ?? v.weight },
            );

            // Fix rounding drift so weights always sum to exactly 100.
            const drift = 100 - variants.reduce((sum, v) => sum + v.weight, 0);
            if (drift !== 0) {
              const adjustable = variants.find((v) => v.name !== variantName) ?? variants[0];
              if (adjustable) adjustable.weight += drift;
            }

            return { ...experiment, variants };
          }),
        })),

      isEnabled: (key) => {
        const flag = get().flags.find((f) => f.key === key);
        if (!flag || !flag.enabled) return false;
        if (flag.rolloutPercent >= 100) return true;
        if (flag.rolloutPercent <= 0) return false;
        return bucketPercent(getCurrentBucketId(), key) < flag.rolloutPercent;
      },

      getVariant: (experimentKey) => {
        const experiment = get().experiments.find((e) => e.key === experimentKey);
        if (!experiment || !experiment.active || experiment.variants.length === 0) return '';
        return bucketVariant(getCurrentBucketId(), experimentKey, experiment.variants);
      },
    }),
    { name: 'mosaic-feature-flags' },
  ),
);
