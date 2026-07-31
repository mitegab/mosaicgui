import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export type AuditCategory = 'query' | 'schema' | 'settings' | 'auth' | 'collaboration';
export type AuditSeverity = 'info' | 'warning' | 'critical';

export interface AuditEvent {
  id: string;
  timestamp: string;
  actor: string;
  action: string;
  category: AuditCategory;
  target?: string;
  metadata?: Record<string, unknown>;
  severity: AuditSeverity;
}

const MAX_EVENTS = 500;

interface AuditLogState {
  events: AuditEvent[];
  log: (event: Omit<AuditEvent, 'id' | 'timestamp'>) => void;
  clear: () => void;
}

export const useAuditLog = create<AuditLogState>()(
  persist(
    (set) => ({
      events: [],
      log: (event) =>
        set((state) => {
          const newEvent: AuditEvent = {
            ...event,
            id: crypto.randomUUID(),
            timestamp: new Date().toISOString(),
          };
          return { events: [newEvent, ...state.events].slice(0, MAX_EVENTS) };
        }),
      clear: () => set({ events: [] }),
    }),
    {
      name: 'mosaic-audit-log',
      storage: createJSONStorage(() => sessionStorage),
    },
  ),
);

/** Convenience function to append an audit event from anywhere, even outside React. */
export function logAudit(
  action: string,
  category: AuditCategory,
  target?: string,
  metadata?: Record<string, unknown>,
): void {
  useAuditLog.getState().log({
    actor: 'You',
    action,
    category,
    target,
    metadata,
    severity: 'info',
  });
}

// ---------------------------------------------------------------------------
// Seed a realistic demo history spanning the last few days, so the timeline
// has something to show (and group/filter) on first run.
// ---------------------------------------------------------------------------

function hoursAgo(hours: number): string {
  return new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();
}

if (useAuditLog.getState().events.length === 0) {
  const seed: AuditEvent[] = [
    {
      id: crypto.randomUUID(),
      timestamp: hoursAgo(0.2),
      actor: 'Priya Nair',
      action: 'Executed query',
      category: 'query',
      target: 'Revenue Funnel',
      metadata: { rows: 128, durationMs: 342 },
      severity: 'info',
    },
    {
      id: crypto.randomUUID(),
      timestamp: hoursAgo(1.5),
      actor: 'Marcus Bell',
      action: 'Updated schema field',
      category: 'schema',
      target: 'User.email',
      metadata: { change: 'added unique constraint' },
      severity: 'info',
    },
    {
      id: crypto.randomUUID(),
      timestamp: hoursAgo(3),
      actor: 'Elena Ruiz',
      action: 'Query execution failed',
      category: 'query',
      target: 'Churn Report',
      metadata: { error: 'Timeout after 30s' },
      severity: 'critical',
    },
    {
      id: crypto.randomUUID(),
      timestamp: hoursAgo(6),
      actor: 'You',
      action: 'Signed in',
      category: 'auth',
      metadata: { device: 'Chrome / Windows' },
      severity: 'info',
    },
    {
      id: crypto.randomUUID(),
      timestamp: hoursAgo(9),
      actor: 'Sam Kowalski',
      action: 'Joined collaboration session',
      category: 'collaboration',
      target: 'Order Analytics graph',
      severity: 'info',
    },
    {
      id: crypto.randomUUID(),
      timestamp: hoursAgo(27),
      actor: 'Priya Nair',
      action: 'Changed workspace settings',
      category: 'settings',
      target: 'Notification preferences',
      metadata: { emailDigest: 'weekly' },
      severity: 'warning',
    },
    {
      id: crypto.randomUUID(),
      timestamp: hoursAgo(30),
      actor: 'Marcus Bell',
      action: 'Deleted saved query',
      category: 'query',
      target: 'Legacy Orders (deprecated)',
      severity: 'warning',
    },
    {
      id: crypto.randomUUID(),
      timestamp: hoursAgo(50),
      actor: 'Elena Ruiz',
      action: 'Added model relation',
      category: 'schema',
      target: 'Order.customer',
      severity: 'info',
    },
  ];

  useAuditLog.setState({ events: seed });
}
