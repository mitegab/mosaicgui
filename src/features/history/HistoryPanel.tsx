import { useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Undo2,
  Redo2,
  Trash2,
  PlusCircle,
  MinusCircle,
  MoveRight,
  Pencil,
  GitBranch,
} from 'lucide-react';
import { useUndoRedo } from './useUndoRedo';
import { cn } from '../../utils/cn';
import type { Command } from './commandTypes';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function timeAgo(iso: string): string {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (diff < 5) return 'just now';
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  return `${Math.floor(diff / 3600)}h ago`;
}

// ---------------------------------------------------------------------------
// Command type → visual metadata
// ---------------------------------------------------------------------------

interface CommandMeta {
  icon: React.ReactNode;
  borderColor: string;
  bgColor: string;
}

function getCommandMeta(type: string): CommandMeta {
  if (type.startsWith('ADD_')) {
    return {
      icon: <PlusCircle size={12} />,
      borderColor: 'border-l-emerald-500',
      bgColor: 'bg-emerald-500/5',
    };
  }
  if (type.startsWith('REMOVE_')) {
    return {
      icon: <MinusCircle size={12} />,
      borderColor: 'border-l-red-500',
      bgColor: 'bg-red-500/5',
    };
  }
  if (type.startsWith('MOVE_')) {
    return {
      icon: <MoveRight size={12} />,
      borderColor: 'border-l-sky-500',
      bgColor: 'bg-sky-500/5',
    };
  }
  if (type.startsWith('UPDATE_')) {
    return {
      icon: <Pencil size={12} />,
      borderColor: 'border-l-amber-500',
      bgColor: 'bg-amber-500/5',
    };
  }
  // Fallback
  return {
    icon: <GitBranch size={12} />,
    borderColor: 'border-l-white/20',
    bgColor: 'bg-white/[0.03]',
  };
}

// ---------------------------------------------------------------------------
// CommandItem
// ---------------------------------------------------------------------------

interface CommandItemProps {
  command: Command;
  isFuture?: boolean;
  onClick?: () => void;
}

function CommandItem({ command, isFuture = false, onClick }: CommandItemProps) {
  const meta = getCommandMeta(command.type);

  return (
    <motion.li
      layout
      initial={{ opacity: 0, x: -6 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 6 }}
      transition={{ duration: 0.15 }}
      onClick={onClick}
      className={cn(
        'flex items-center gap-2 px-2 py-1.5 rounded-sm border-l-2',
        meta.borderColor,
        meta.bgColor,
        isFuture ? 'opacity-35' : 'opacity-100',
        !isFuture && onClick && 'cursor-pointer hover:brightness-110 transition-all'
      )}
      title={isFuture ? 'Future state (redo available)' : 'Click to undo to here'}
    >
      <span className={cn('shrink-0', isFuture ? 'text-white/30' : 'text-white/60')}>
        {meta.icon}
      </span>
      <span className={cn('flex-1 text-xs truncate', isFuture ? 'text-white/30' : 'text-white/70')}>
        {command.description}
      </span>
      <span className="text-[10px] text-white/20 shrink-0">{timeAgo(command.timestamp)}</span>
    </motion.li>
  );
}

// ---------------------------------------------------------------------------
// HistoryPanel
// ---------------------------------------------------------------------------

export function HistoryPanel() {
  const { past, future, canUndo, canRedo, undo, redo, clear } = useUndoRedo();

  // Batch undo: undo until the clicked command is the last item in past
  const handleBatchUndo = useCallback(
    (targetIndex: number) => {
      // targetIndex is index from the reversed (display) list
      // past[last] is most recent; we undo down to targetIndex+1 items remaining
      const stepsToUndo = past.length - 1 - targetIndex;
      for (let i = 0; i < stepsToUndo; i++) {
        useUndoRedo().undo();
      }
    },
    [past]
  );

  const pastReversed = [...past].reverse();

  return (
    <div className="flex flex-col h-full text-sm">
      {/* Toolbar */}
      <div className="flex items-center gap-1.5 px-3 py-2 border-b border-white/10 shrink-0">
        <button
          onClick={undo}
          disabled={!canUndo}
          className={cn(
            'flex items-center gap-1.5 px-2 py-1 rounded text-xs transition-colors',
            canUndo
              ? 'bg-white/[0.06] hover:bg-white/10 text-white/80'
              : 'opacity-30 cursor-not-allowed text-white/40'
          )}
          title="Undo (Ctrl+Z)"
        >
          <Undo2 size={12} />
          <span>Undo</span>
          <span className="text-[10px] text-white/30 font-mono">Ctrl+Z</span>
        </button>

        <button
          onClick={redo}
          disabled={!canRedo}
          className={cn(
            'flex items-center gap-1.5 px-2 py-1 rounded text-xs transition-colors',
            canRedo
              ? 'bg-white/[0.06] hover:bg-white/10 text-white/80'
              : 'opacity-30 cursor-not-allowed text-white/40'
          )}
          title="Redo (Ctrl+Y)"
        >
          <Redo2 size={12} />
          <span>Redo</span>
          <span className="text-[10px] text-white/30 font-mono">Ctrl+Y</span>
        </button>

        <div className="flex-1" />

        <button
          onClick={clear}
          disabled={past.length === 0 && future.length === 0}
          className={cn(
            'flex items-center gap-1 px-2 py-1 rounded text-xs transition-colors',
            past.length > 0 || future.length > 0
              ? 'text-white/40 hover:text-red-400 hover:bg-red-500/10'
              : 'opacity-30 cursor-not-allowed text-white/20'
          )}
          title="Clear history"
        >
          <Trash2 size={11} />
          <span>Clear</span>
        </button>
      </div>

      {/* Command list */}
      <div className="flex-1 overflow-y-auto px-2 py-2 space-y-0.5">
        {past.length === 0 && future.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-24 text-white/25 text-xs gap-1">
            <GitBranch size={18} className="opacity-40" />
            <span>No history yet</span>
          </div>
        ) : (
          <>
            {/* Past commands — most recent first */}
            <AnimatePresence initial={false}>
              {pastReversed.map((cmd, displayIdx) => {
                const originalIdx = past.length - 1 - displayIdx;
                return (
                  <CommandItem
                    key={cmd.id}
                    command={cmd}
                    onClick={() => handleBatchUndo(originalIdx)}
                  />
                );
              })}
            </AnimatePresence>

            {/* Current state divider */}
            <div className="flex items-center gap-2 py-1 px-1">
              <div className="flex-1 h-px bg-white/20" />
              <span className="text-[10px] text-white/30 font-mono whitespace-nowrap">
                ─── current ───
              </span>
              <div className="flex-1 h-px bg-white/20" />
            </div>

            {/* Future commands (greyed out) */}
            <AnimatePresence initial={false}>
              {future.map((cmd) => (
                <CommandItem key={cmd.id} command={cmd} isFuture />
              ))}
            </AnimatePresence>
          </>
        )}
      </div>

      {/* Footer stats */}
      {(past.length > 0 || future.length > 0) && (
        <div className="shrink-0 px-3 py-1.5 border-t border-white/10 text-[10px] text-white/25 flex gap-3">
          <span>{past.length} past</span>
          <span>{future.length} future</span>
        </div>
      )}
    </div>
  );
}

export default HistoryPanel;
