import { PropsWithChildren, ReactNode } from 'react';
import { useFeatureFlags } from './useFeatureFlags';

/** Subscribes to a single flag's enabled/rollout state. */
export function useFlag(key: string): boolean {
  return useFeatureFlags((state) => state.isEnabled(key));
}

/** Subscribes to the current browser's assigned variant for an experiment. */
export function useVariant(experimentKey: string): string {
  return useFeatureFlags((state) => state.getVariant(experimentKey));
}

interface FlagGateProps extends PropsWithChildren {
  flag: string;
  fallback?: ReactNode;
}

/**
 * Conditionally renders children when a feature flag is enabled for the
 * current browser's bucket, otherwise renders `fallback`.
 *
 * @example
 * <FlagGate flag="ai-query-suggestions" fallback={null}>
 *   <AiSuggestions />
 * </FlagGate>
 */
export function FlagGate({ flag, fallback = null, children }: FlagGateProps) {
  const enabled = useFlag(flag);
  return <>{enabled ? children : fallback}</>;
}

interface ExperimentVariantProps extends PropsWithChildren {
  experiment: string;
  variant: string;
}

/**
 * Renders children only when the current browser has been bucketed into the
 * given variant of an experiment — useful for simple A/B rendering.
 *
 * @example
 * <ExperimentVariant experiment="run-button-color" variant="green">
 *   <RunButton className="bg-success-500" />
 * </ExperimentVariant>
 */
export function ExperimentVariant({ experiment, variant, children }: ExperimentVariantProps) {
  const assigned = useVariant(experiment);
  return assigned === variant ? <>{children}</> : null;
}
