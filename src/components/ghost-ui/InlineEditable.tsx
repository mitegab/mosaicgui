import { useRef, useState, KeyboardEvent } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../../utils/cn';

interface InlineEditableProps {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  className?: string;
  inputClassName?: string;
}

export function InlineEditable({
  value,
  onChange,
  placeholder = 'Click to edit…',
  className,
  inputClassName,
}: InlineEditableProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);

  const startEditing = () => {
    setDraft(value);
    setIsEditing(true);
    // Focus input after state update
    requestAnimationFrame(() => {
      inputRef.current?.focus();
      inputRef.current?.select();
    });
  };

  const commitEdit = () => {
    setIsEditing(false);
    const trimmed = draft.trim();
    if (trimmed !== value) {
      onChange(trimmed);
    }
  };

  const cancelEdit = () => {
    setDraft(value);
    setIsEditing(false);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      commitEdit();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      cancelEdit();
    }
  };

  return (
    <span
      className={cn('relative inline-block min-w-[4rem]', className)}
      style={{ display: 'inline-block' }}
    >
      <AnimatePresence mode="wait" initial={false}>
        {isEditing ? (
          <motion.span
            key="input"
            layout
            initial={{ opacity: 0, scaleX: 0.92 }}
            animate={{ opacity: 1, scaleX: 1 }}
            exit={{ opacity: 0, scaleX: 0.92 }}
            transition={{ type: 'spring', stiffness: 500, damping: 30, duration: 0.15 }}
            style={{ display: 'inline-block', transformOrigin: 'left center' }}
          >
            <input
              ref={inputRef}
              type="text"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onBlur={commitEdit}
              onKeyDown={handleKeyDown}
              placeholder={placeholder}
              className={cn(
                'inline bg-surface-800 border border-accent-500/50 rounded px-1.5 py-0.5',
                'text-surface-100 text-sm outline-none',
                'focus:border-accent-400 focus:ring-1 focus:ring-accent-400/30',
                'min-w-[4rem]',
                inputClassName,
              )}
              style={{ width: `max(${Math.max(draft.length, 4)}ch + 1.5rem, 4rem)` }}
            />
          </motion.span>
        ) : (
          <motion.span
            key="text"
            layout
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.12 }}
            onClick={startEditing}
            className={cn(
              'cursor-text rounded px-1 py-0.5 -mx-1',
              'text-sm text-surface-200',
              'hover:bg-surface-800/60 hover:text-surface-100',
              'border border-transparent hover:border-surface-700',
              'transition-colors duration-100',
              !value && 'text-surface-500 italic',
            )}
            title="Click to edit"
          >
            {value || placeholder}
          </motion.span>
        )}
      </AnimatePresence>
    </span>
  );
}
