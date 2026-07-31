import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Link2, ChevronDown } from 'lucide-react';
import { useGraphCrdtSync, useCrdtLogStore, type CrdtOp } from './graphCrdtSync';
import { cn } from '../../utils/cn';

function hashString(input: string): number {
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    hash = (hash << 5) - hash + input.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

function colorForSite(siteId: string): string {
  const hue = Math.round((hashString(siteId) * 137.508) % 360);
  return `hsl(${hue}, 65%, 60%)`;
}

function formatTime(timestamp: number): string {
  return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

function OpRow({ op }: { op: CrdtOp }) {
  const color = colorForSite(op.siteId);
  return (
    <div className="flex items-center gap-2 px-2 py-1.5 rounded-md bg-white/[0.03] border border-white/5">
      <span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: color }} />
      <span className="text-[10px] font-mono text-white/50 shrink-0">{op.type}</span>
      <span className="text-xs text-white/70 truncate flex-1">{op.id}</span>
      <span className="text-[10px] text-white/30 font-mono shrink-0">{formatTime(op.timestamp)}</span>
    </div>
  );
}

export function CrdtSyncIndicator({ className }: { className?: string }) {
  const [expanded, setExpanded] = useState(false);
  const { siteId } = useGraphCrdtSync();
  const ops = useCrdtLogStore((s) => s.ops);

  return (
    <div className={cn('relative', className)}>
      <button
        onClick={() => setExpanded((v) => !v)}
        className="flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-[11px] font-medium text-white/70 hover:bg-white/[0.08] transition-colors"
        title={`Site: ${siteId}`}
      >
        <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
        </span>
        <Link2 size={11} />
        <span>CRDT synced</span>
        <ChevronDown size={11} className={cn('transition-transform', expanded && 'rotate-180')} />
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.97 }}
            transition={{ duration: 0.14 }}
            className="absolute right-0 top-full z-50 mt-2 w-72 rounded-lg border border-white/10 bg-surface-900 p-2 shadow-card-lg"
          >
            <div className="flex items-center justify-between px-1 pb-1.5">
              <span className="text-[11px] font-semibold text-white/70">Last merge operations</span>
              <span className="text-[10px] font-mono text-white/30">{siteId.slice(0, 8)}</span>
            </div>
            <div className="space-y-1 max-h-56 overflow-y-auto">
              {ops.length === 0 ? (
                <div className="px-2 py-4 text-center text-[11px] text-white/30">No operations yet</div>
              ) : (
                ops.slice(0, 5).map((op, index) => <OpRow key={`${op.id}-${op.timestamp}-${index}`} op={op} />)
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default CrdtSyncIndicator;
