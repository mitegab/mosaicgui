import { useState, useRef, useEffect } from 'react';
import { ExternalLink, X, Minimize2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../../utils/cn';
import { usePopOut, type PopOutContent } from './usePopOut';

// ─── Props ─────────────────────────────────────────────────────────────────

interface PopOutButtonProps {
  panelId: string;
  label: string;
  /** Which content type to pop out. Defaults to matching the panelId. */
  content?: PopOutContent;
  className?: string;
}

// ─── PiP mini-view ─────────────────────────────────────────────────────────

interface PipViewProps {
  panelId: string;
  label: string;
  onClose: () => void;
}

function PipView({ panelId, label, onClose }: PipViewProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const dragStart = useRef<{ mx: number; my: number; px: number; py: number } | null>(null);

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    dragStart.current = { mx: e.clientX, my: e.clientY, px: pos.x, py: pos.y };
  };

  useEffect(() => {
    if (!isDragging) return;
    const handleMove = (e: MouseEvent) => {
      if (!dragStart.current) return;
      setPos({
        x: dragStart.current.px + (e.clientX - dragStart.current.mx),
        y: dragStart.current.py + (e.clientY - dragStart.current.my),
      });
    };
    const handleUp = () => setIsDragging(false);
    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup', handleUp);
    return () => {
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleUp);
    };
  }, [isDragging]);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9, y: 20 }}
      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
      style={{
        position: 'fixed',
        bottom: `${-pos.y + 24}px`,
        right: `${-pos.x + 24}px`,
        zIndex: 9999,
        width: 320,
        height: 240,
        cursor: isDragging ? 'grabbing' : 'default',
      }}
      className="rounded-xl overflow-hidden shadow-2xl border border-white/10 bg-surface-900 flex flex-col"
    >
      {/* Drag handle / title bar */}
      <div
        onMouseDown={handleMouseDown}
        className="flex items-center justify-between px-2.5 py-1.5 bg-surface-850 border-b border-white/10 cursor-grab select-none"
      >
        <div className="flex items-center gap-1.5">
          <Minimize2 size={10} className="text-white/40" />
          <span className="text-[0.65rem] font-medium text-white/60 uppercase tracking-wider">
            PiP · {label}
          </span>
        </div>
        <button
          onClick={onClose}
          className="text-white/40 hover:text-white/80 transition-colors rounded p-0.5"
          aria-label={`Close ${label} picture-in-picture`}
        >
          <X size={11} />
        </button>
      </div>

      {/* Content area — mini preview */}
      <div className="flex-1 min-h-0 overflow-hidden relative">
        <div className="absolute inset-0 p-2 flex flex-col gap-1.5 overflow-hidden">
          {/* Fake toolbar */}
          <div className="flex items-center gap-1">
            {['Query', 'Schema', 'AI'].map((t) => (
              <div
                key={t}
                className="h-4 px-2 rounded text-[0.55rem] bg-surface-800 text-white/50 flex items-center"
              >
                {t}
              </div>
            ))}
          </div>
          {/* Fake content lines */}
          {[100, 80, 90, 60, 75].map((w, i) => (
            <div
              key={i}
              className="h-2 rounded-sm bg-surface-800 opacity-60"
              style={{ width: `${w}%` }}
            />
          ))}
          {/* Panel label watermark */}
          <div className="mt-auto text-[0.5rem] text-white/20 text-center tracking-widest uppercase">
            {panelId}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// ─── PopOutButton ──────────────────────────────────────────────────────────

export function PopOutButton({ panelId, label, content, className }: PopOutButtonProps) {
  const resolvedContent: PopOutContent =
    content ?? (['results', 'monaco', 'inspector'].includes(panelId)
      ? (panelId as PopOutContent)
      : 'results');

  const { popOut, closePopOut, isPopped } = usePopOut(panelId);
  const [pipVisible, setPipVisible] = useState(false);

  const handleClick = () => {
    if (isPopped) {
      // Already popped out — toggle PiP instead
      setPipVisible((v) => !v);
    } else {
      popOut(resolvedContent);
      // Show PiP alongside the external window
      setPipVisible(true);
    }
  };

  const handleClosePip = () => {
    setPipVisible(false);
    if (isPopped) closePopOut();
  };

  return (
    <>
      <button
        onClick={handleClick}
        aria-label={isPopped ? `Show ${label} picture-in-picture` : `Pop out ${label}`}
        title={isPopped ? `${label} is popped out — toggle PiP` : `Pop out ${label} to a new window`}
        className={cn(
          'relative inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium',
          'bg-surface-800 hover:bg-surface-700 border border-white/10 hover:border-white/20',
          'text-white/60 hover:text-white/90 transition-all duration-150',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500',
          className
        )}
      >
        {/* Green indicator dot when popped out */}
        {isPopped && (
          <span
            aria-hidden="true"
            className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_4px_theme(colors.emerald.400)] ring-1 ring-surface-900"
          />
        )}
        <ExternalLink size={12} />
        <span>{label}</span>
      </button>

      <AnimatePresence>
        {pipVisible && (
          <PipView panelId={panelId} label={label} onClose={handleClosePip} />
        )}
      </AnimatePresence>
    </>
  );
}
