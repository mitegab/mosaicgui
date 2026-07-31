import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { FlaskConical, CheckCircle2, XCircle } from 'lucide-react';
import { cn } from '../../utils/cn';
import {
  bucketPreviewPercent,
  useFeatureFlags,
  type FeatureFlag,
  type FlagEnvironment,
} from './useFeatureFlags';

const ENV_BADGE_STYLES: Record<FlagEnvironment, string> = {
  development: 'bg-surface-700/60 text-surface-200 border border-surface-500/40',
  staging: 'bg-warning-500/15 text-warning-500 border border-warning-500/30',
  production: 'bg-success-500/15 text-success-500 border border-success-500/30',
};

function Toggle({ enabled, onChange }: { enabled: boolean; onChange: (next: boolean) => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={enabled}
      onClick={() => onChange(!enabled)}
      className={cn(
        'relative h-5 w-9 shrink-0 rounded-full transition-colors duration-150',
        enabled ? 'bg-[var(--brand)]' : 'bg-[var(--border-strong)]',
      )}
    >
      <motion.span
        className="absolute top-0.5 h-4 w-4 rounded-full bg-white shadow-sm"
        animate={{ left: enabled ? 18 : 2 }}
        transition={{ type: 'spring', stiffness: 500, damping: 32 }}
      />
    </button>
  );
}

function RolloutSlider({ flag }: { flag: FeatureFlag }) {
  const setRolloutPercent = useFeatureFlags((s) => s.setRolloutPercent);
  const previewPercent = useMemo(() => bucketPreviewPercent(flag.key), [flag.key, flag.rolloutPercent]);
  const isInRollout = previewPercent < flag.rolloutPercent;

  return (
    <div className="flex flex-col gap-1.5 min-w-[180px]">
      <div className="flex items-center gap-2">
        <input
          type="range"
          min={0}
          max={100}
          step={1}
          value={flag.rolloutPercent}
          onChange={(e) => setRolloutPercent(flag.key, Number(e.target.value))}
          className="w-28 accent-[var(--brand)]"
        />
        <span className="text-xs font-mono text-[var(--text-secondary)] w-9 text-right">{flag.rolloutPercent}%</span>
      </div>
      <div
        className={cn(
          'inline-flex items-center gap-1 text-[0.6875rem] font-medium rounded-full px-2 py-0.5 w-fit',
          isInRollout
            ? 'bg-success-500/15 text-success-500'
            : 'bg-surface-700/40 text-[var(--text-muted)]',
        )}
        title={`Bucket score: ${previewPercent.toFixed(2)}`}
      >
        {isInRollout ? <CheckCircle2 size={12} /> : <XCircle size={12} />}
        {isInRollout ? "You're in ✓" : "You're out"}
      </div>
    </div>
  );
}

function ExperimentCard({ experimentKey }: { experimentKey: string }) {
  const experiment = useFeatureFlags((s) => s.experiments.find((e) => e.key === experimentKey));
  const setVariantWeight = useFeatureFlags((s) => s.setVariantWeight);
  const assignedVariant = useFeatureFlags((s) => s.getVariant(experimentKey));

  if (!experiment) return null;

  return (
    <div className="rounded-lg border border-[var(--border)] bg-[var(--bg-panel)] p-3.5 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FlaskConical size={14} className="text-[var(--brand)]" />
          <span className="text-sm font-semibold text-[var(--text-primary)]">{experiment.name}</span>
          <code className="text-[0.6875rem] text-[var(--text-muted)]">{experiment.key}</code>
        </div>
        <span
          className={cn(
            'badge',
            experiment.active ? 'bg-success-500/15 text-success-500' : 'bg-surface-700/40 text-[var(--text-muted)]',
          )}
        >
          {experiment.active ? 'Active' : 'Paused'}
        </span>
      </div>

      <div className="flex flex-col gap-2.5">
        {experiment.variants.map((variant) => (
          <div key={variant.name} className="flex items-center gap-3">
            <span className="text-xs w-16 shrink-0 capitalize text-[var(--text-secondary)]">{variant.name}</span>
            <input
              type="range"
              min={0}
              max={100}
              step={1}
              value={variant.weight}
              onChange={(e) => setVariantWeight(experiment.key, variant.name, Number(e.target.value))}
              className="flex-1 accent-[var(--brand)]"
            />
            <span className="text-xs font-mono w-10 text-right text-[var(--text-secondary)]">{variant.weight}%</span>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-2 rounded-md bg-[var(--brand-subtle)] px-3 py-2 text-xs">
        <span className="text-[var(--text-secondary)]">Your assigned variant:</span>
        <span className="font-semibold text-[var(--brand)] capitalize">{assignedVariant || '—'}</span>
      </div>
    </div>
  );
}

export function FeatureFlagPanel() {
  const flags = useFeatureFlags((s) => s.flags);
  const experiments = useFeatureFlags((s) => s.experiments);
  const setFlag = useFeatureFlags((s) => s.setFlag);

  return (
    <div className="flex flex-col gap-6 p-4">
      <div>
        <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-1">Feature Flags</h3>
        <p className="text-xs text-[var(--text-muted)] mb-3">
          Rollouts are bucketed deterministically per browser, so refreshing the page won't change your status.
        </p>

        <div className="overflow-hidden rounded-lg border border-[var(--border)]">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-[var(--border)] bg-[var(--bg-panel-hover)] text-[0.6875rem] uppercase tracking-wide text-[var(--text-muted)]">
                <th className="px-3.5 py-2 font-medium">Flag</th>
                <th className="px-3.5 py-2 font-medium">Environment</th>
                <th className="px-3.5 py-2 font-medium">Enabled</th>
                <th className="px-3.5 py-2 font-medium">Rollout</th>
              </tr>
            </thead>
            <tbody>
              {flags.map((flag) => (
                <tr key={flag.key} className="border-b border-[var(--border)] last:border-0">
                  <td className="px-3.5 py-3 align-top max-w-xs">
                    <div className="font-medium text-[var(--text-primary)]">{flag.name}</div>
                    <div className="text-xs text-[var(--text-muted)] mt-0.5">{flag.description}</div>
                    <code className="text-[0.6875rem] text-[var(--text-muted)]">{flag.key}</code>
                  </td>
                  <td className="px-3.5 py-3 align-top">
                    <span className={cn('badge', ENV_BADGE_STYLES[flag.environment])}>{flag.environment}</span>
                  </td>
                  <td className="px-3.5 py-3 align-top">
                    <Toggle enabled={flag.enabled} onChange={(enabled) => setFlag(flag.key, enabled)} />
                  </td>
                  <td className="px-3.5 py-3 align-top">
                    <RolloutSlider flag={flag} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div>
        <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-1">Experiments</h3>
        <p className="text-xs text-[var(--text-muted)] mb-3">
          Variant weights always sum to 100%; adjusting one variant auto-normalizes the others.
        </p>
        <div className="flex flex-col gap-3">
          {experiments.map((experiment) => (
            <ExperimentCard key={experiment.key} experimentKey={experiment.key} />
          ))}
        </div>
      </div>
    </div>
  );
}
