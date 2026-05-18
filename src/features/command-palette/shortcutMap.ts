import React from 'react';
import { cn } from '../../utils/cn';

export const SHORTCUT_MAP: Record<string, string> = {
  RunQuery:        '⌘↩',
  Compile:         '⌘⇧C',
  CommandPalette:  '⌘K',
  ToggleSidebar:   '⌘B',
  DslStudio:       '⌘1',
  Inspector:       '⌘2',
  AiAssistant:     '⌘3',
  Performance:     '⌘4',
};

interface ShortcutHintProps {
  action: keyof typeof SHORTCUT_MAP;
  className?: string;
}

export function ShortcutHint({ action, className }: ShortcutHintProps) {
  const shortcut = SHORTCUT_MAP[action];
  if (!shortcut) return null;

  return React.createElement(
    'kbd',
    {
      className: cn(
        'inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded',
        'text-[0.6875rem] font-mono font-semibold leading-none',
        'bg-surface-800 text-surface-300 border border-surface-700',
        'shadow-[0_1px_0_0_rgba(0,0,0,0.4)]',
        className,
      ),
    },
    shortcut,
  );
}
