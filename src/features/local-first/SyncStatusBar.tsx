import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CheckCircle2,
  Loader2,
  Clock,
  WifiOff,
  XCircle,
  RefreshCw,
  X,
} from 'lucide-react';
import { useOfflineStore } from '../../store/offlineStore';
import type { SyncStatus, PendingOperation } from '../../store/offlineStore';
import { cn } from '../../utils/cn';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatTime(iso: string | null): string {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

function opLabel(type: PendingOperation['type']): string {
  switch (type) {
    case 'EXECUTE_QUERY': return 'Execute query';
    case 'SAVE_QUERY': return 'Save query';
    case 'DELETE_QUERY': return 'Delete query';
    default: return type;
  }
}

// ---------------------------------------------------------------------------
// Status indicator config
// ---------------------------------------------------------------------------

interface StatusConfig {
  label: (pendingCount: number) => string;
  icon: React.ReactNode;
  className: string;
}

const STATUS_CONFIGS: Record<SyncStatus, StatusConfig> = {
  saved: {
    label: () => 'Saved',
    icon: <CheckCircle2 size={13} />,
    className: 'text-emerald-400',
  },
  syncing: {
    label: () => 'Syncing…',
    icon: (
      <motion.span
        animate={{ rotate: 360 }}
        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
        className="inline-flex"
      >
        <Loader2 size={13} />
      </motion.span>
    ),
    className: 'text-sky-400',
  },
  pending: {
    label: (n) => `Pending (${n} op${n !== 1 ? 's' : ''})`,
    icon: <Clock size={13} />,
    className: 'text-amber-400 cursor-pointer',
  },
  offline: {
    label: () => 'Offline — changes saved locally',
    icon: <WifiOff size={13} />,
    className: 'text-amber-400',
  },
  error: {
    label: () => 'Sync Error',
    icon: <XCircle size={13} />,
    className: 'text-red-400',
  },
};

// ---------------------------------------------------------------------------
// Pending operations popover
// ---------------------------------------------------------------------------

interface PendingPopoverProps {
  ops: PendingOperation[];
  onClose: () => void;
}

function PendingPopover({ ops, onClose }: PendingPopoverProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 6 }}
      transition={{ duration: 0.15 }}
      className="absolute bottom-full mb-1.5 left-0 z-50 w-72 rounded-lg border border-white/10 bg-[#1a1d23] shadow-xl"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-white/10">
        <span className="text-xs font-semibold text-white/80">Pending operations</span>
        <button
          onClick={onClose}
          className="text-white/40 hover:text-white/70 transition-colors"
          aria-label="Close popover"
        >
          <X size={12} />
        </button>
      </div>

      {/* List */}
      <ul className="max-h-48 overflow-y-auto divide-y divide-white/5">
        {ops.length === 0 ? (
          <li className="px-3 py-2 text-xs text-white/40">No pending operations.</li>
        ) : (
          ops.map((op) => (
            <li key={op.id} className="px-3 py-2">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs text-white/70 truncate">{opLabel(op.type)}</span>
                {op.retries > 0 && (
                  <span className="text-[10px] text-amber-400 shrink-0">
                    {op.retries} retry
                  </span>
                )}
              </div>
              <div className="text-[10px] text-white/30 mt-0.5">
                {new Date(op.createdAt).toLocaleTimeString()}
              </div>
            </li>
          ))
        )}
      </ul>
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// SyncStatusBar
// ---------------------------------------------------------------------------

export function SyncStatusBar() {
  const { status, pendingOps, lastSyncedAt, setStatus } = useOfflineStore();
  const [popoverOpen, setPopoverOpen] = useState(false);

  const config = STATUS_CONFIGS[status];
  const pendingCount = pendingOps.length;

  const handleRetry = () => {
    setStatus('syncing');
    // Real retry logic would dispatch the queue — here we signal intent
    setTimeout(() => {
      setStatus(pendingOps.length > 0 ? 'pending' : 'saved');
    }, 1500);
  };

  const handleStatusClick = () => {
    if (status === 'pending') {
      setPopoverOpen((v) => !v);
    }
  };

  return (
    <div
      className="
        relative flex items-center gap-3 px-4
        h-[28px] w-full
        border-t border-white/[0.06]
        bg-[#12141a]/90 backdrop-blur-sm
        text-[11px] select-none
      "
    >
      {/* Animated status badge */}
      <AnimatePresence mode="wait">
        <motion.button
          key={status}
          initial={{ opacity: 0, x: -4 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 4 }}
          transition={{ duration: 0.18 }}
          onClick={handleStatusClick}
          className={cn(
            'flex items-center gap-1.5 font-medium leading-none',
            config.className
          )}
        >
          {config.icon}
          <span>{config.label(pendingCount)}</span>
        </motion.button>
      </AnimatePresence>

      {/* Retry button (error state) */}
      {status === 'error' && (
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          onClick={handleRetry}
          className="flex items-center gap-1 text-red-400 hover:text-red-300 transition-colors"
          title="Retry sync"
        >
          <RefreshCw size={11} />
          <span>Retry</span>
        </motion.button>
      )}

      {/* Last synced timestamp */}
      {lastSyncedAt && status === 'saved' && (
        <span className="text-white/25 ml-1">
          Last sync: {formatTime(lastSyncedAt)}
        </span>
      )}

      {/* Pending operations popover */}
      <AnimatePresence>
        {popoverOpen && (
          <PendingPopover
            ops={pendingOps}
            onClose={() => setPopoverOpen(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

export default SyncStatusBar;
