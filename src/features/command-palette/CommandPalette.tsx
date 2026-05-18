import { useEffect, useRef, useState, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Search,
  Layout,
  Database,
  History,
  Zap,
  Play,
  GitBranch,
  Trash2,
  PanelLeft,
  Command,
  ChevronRight,
} from 'lucide-react';
import { useCommandPalette } from './useCommandPalette';
import { useUiStore } from '../../store/uiStore';
import { useSchemaStore } from '../../store/schemaStore';
import { useExecutionStore } from '../../store/executionStore';
import { useQueryStore } from '../../store/queryStore';
import { cn } from '../../utils/cn';
import { ShortcutHint } from './shortcutMap';

type RightPanel = 'dsl' | 'inspector' | 'ai' | 'performance';

interface CommandItem {
  id: string;
  category: 'Navigation' | 'Schema' | 'Queries' | 'Actions';
  label: string;
  subtitle?: string;
  icon: React.ReactNode;
  shortcut?: React.ReactNode;
  action: () => void;
}

const CATEGORY_ORDER = ['Navigation', 'Actions', 'Schema', 'Queries'] as const;

export function CommandPalette() {
  const { isOpen, close } = useCommandPalette();
  const { setRightPanel, toggleLeftSidebar } = useUiStore();
  const { models, selectModel } = useSchemaStore();
  const { history, clearResults } = useExecutionStore();
  const { compileGraph } = useQueryStore();

  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Global ⌘K / Ctrl+K listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        useCommandPalette.getState().toggle();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setActiveIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  // Build command index
  const allItems: CommandItem[] = [
    // Navigation
    {
      id: 'nav-dsl',
      category: 'Navigation',
      label: 'DSL Studio',
      subtitle: 'Open the DSL editor panel',
      icon: <Layout size={14} />,
      shortcut: <ShortcutHint action="DslStudio" />,
      action: () => { setRightPanel('dsl' as RightPanel); close(); },
    },
    {
      id: 'nav-inspector',
      category: 'Navigation',
      label: 'Inspector',
      subtitle: 'Open the node inspector',
      icon: <Search size={14} />,
      shortcut: <ShortcutHint action="Inspector" />,
      action: () => { setRightPanel('inspector' as RightPanel); close(); },
    },
    {
      id: 'nav-ai',
      category: 'Navigation',
      label: 'AI Assistant',
      subtitle: 'Open the AI assistant panel',
      icon: <Zap size={14} />,
      shortcut: <ShortcutHint action="AiAssistant" />,
      action: () => { setRightPanel('ai' as RightPanel); close(); },
    },
    {
      id: 'nav-performance',
      category: 'Navigation',
      label: 'Performance',
      subtitle: 'Open query performance metrics',
      icon: <GitBranch size={14} />,
      shortcut: <ShortcutHint action="Performance" />,
      action: () => { setRightPanel('performance' as RightPanel); close(); },
    },
    // Actions
    {
      id: 'action-run',
      category: 'Actions',
      label: 'Run Query',
      subtitle: 'Execute the current query',
      icon: <Play size={14} />,
      shortcut: <ShortcutHint action="RunQuery" />,
      action: () => { window.dispatchEvent(new CustomEvent('mosaic:run-query')); close(); },
    },
    {
      id: 'action-compile',
      category: 'Actions',
      label: 'Compile Graph',
      subtitle: 'Compile the graph to DSL',
      icon: <GitBranch size={14} />,
      shortcut: <ShortcutHint action="Compile" />,
      action: () => { compileGraph(); close(); },
    },
    {
      id: 'action-clear',
      category: 'Actions',
      label: 'Clear Results',
      subtitle: 'Clear the current query results',
      icon: <Trash2 size={14} />,
      action: () => { clearResults(); close(); },
    },
    {
      id: 'action-sidebar',
      category: 'Actions',
      label: 'Toggle Sidebar',
      subtitle: 'Show or hide the left sidebar',
      icon: <PanelLeft size={14} />,
      shortcut: <ShortcutHint action="ToggleSidebar" />,
      action: () => { toggleLeftSidebar(); close(); },
    },
    // Schema models
    ...models.map((model) => ({
      id: `schema-${model.name}`,
      category: 'Schema' as const,
      label: model.name,
      subtitle: `${model.fields?.length ?? 0} fields`,
      icon: <Database size={14} />,
      action: () => { selectModel(model.name); close(); },
    })),
    // Query history
    ...history.slice(0, 10).map((entry) => ({
      id: `query-${entry.id}`,
      category: 'Queries' as const,
      label: entry.name || `Query ${entry.id.slice(0, 8)}`,
      subtitle: entry.createdAt ? new Date(entry.createdAt).toLocaleString() : undefined,
      icon: <History size={14} />,
      action: () => { close(); },
    })),
  ];

  const filtered = query.trim() === ''
    ? allItems
    : allItems.filter(
        (item) =>
          item.label.toLowerCase().includes(query.toLowerCase()) ||
          item.subtitle?.toLowerCase().includes(query.toLowerCase()) ||
          item.category.toLowerCase().includes(query.toLowerCase()),
      );

  // Group by category
  const grouped = CATEGORY_ORDER.reduce<Record<string, CommandItem[]>>((acc, cat) => {
    const items = filtered.filter((i) => i.category === cat);
    if (items.length > 0) acc[cat] = items;
    return acc;
  }, {});

  const flatFiltered = CATEGORY_ORDER.flatMap((cat) => grouped[cat] ?? []);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Escape') {
        close();
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setActiveIndex((i) => Math.min(i + 1, flatFiltered.length - 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setActiveIndex((i) => Math.max(i - 1, 0));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        flatFiltered[activeIndex]?.action();
      }
    },
    [close, flatFiltered, activeIndex],
  );

  // Reset active index when filtered list changes
  useEffect(() => {
    setActiveIndex(0);
  }, [query]);

  // Scroll active item into view
  useEffect(() => {
    if (listRef.current) {
      const activeEl = listRef.current.querySelector('[data-active="true"]');
      activeEl?.scrollIntoView({ block: 'nearest' });
    }
  }, [activeIndex]);

  let flatIndex = 0;

  return (
    <>
      {/* ⌘K badge trigger */}
      <button
        onClick={() => useCommandPalette.getState().open()}
        className={cn(
          'fixed top-3 right-3 z-40',
          'flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg',
          'bg-surface-850 border border-surface-700 text-surface-400',
          'hover:text-surface-200 hover:border-surface-600 transition-all duration-150',
          'text-xs font-medium shadow-lg',
        )}
        aria-label="Open command palette"
      >
        <Command size={12} />
        <span>K</span>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            key="cp-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh] px-4"
            style={{ backdropFilter: 'blur(6px)', backgroundColor: 'rgba(0,0,0,0.55)' }}
            onMouseDown={(e) => { if (e.target === e.currentTarget) close(); }}
          >
            <motion.div
              key="cp-panel"
              initial={{ opacity: 0, scale: 0.95, y: -8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -8 }}
              transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              className={cn(
                'w-full max-w-xl rounded-xl overflow-hidden',
                'bg-surface-900 border border-surface-700',
                'shadow-2xl shadow-black/60',
              )}
              onKeyDown={handleKeyDown}
            >
              {/* Search input */}
              <div className="flex items-center gap-3 px-4 py-3 border-b border-surface-800">
                <Search size={15} className="text-surface-400 shrink-0" />
                <input
                  ref={inputRef}
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search commands, models, queries…"
                  className={cn(
                    'flex-1 bg-transparent text-sm text-surface-100 placeholder:text-surface-500',
                    'outline-none border-none',
                  )}
                />
                {query && (
                  <button
                    onClick={() => setQuery('')}
                    className="text-surface-500 hover:text-surface-300 transition-colors"
                  >
                    ✕
                  </button>
                )}
                <kbd className="text-[0.65rem] font-mono px-1.5 py-0.5 rounded bg-surface-800 text-surface-500 border border-surface-700">
                  ESC
                </kbd>
              </div>

              {/* Results list */}
              <div ref={listRef} className="max-h-[60vh] overflow-y-auto py-2">
                {flatFiltered.length === 0 ? (
                  <div className="py-10 text-center text-sm text-surface-500">
                    No results for &ldquo;{query}&rdquo;
                  </div>
                ) : (
                  CATEGORY_ORDER.map((category) => {
                    const items = grouped[category];
                    if (!items) return null;
                    return (
                      <div key={category}>
                        <div className="px-4 py-1.5 text-[0.65rem] font-semibold uppercase tracking-wider text-surface-500">
                          {category}
                        </div>
                        {items.map((item) => {
                          const currentIndex = flatIndex++;
                          const isActive = currentIndex === activeIndex;
                          return (
                            <button
                              key={item.id}
                              data-active={isActive}
                              onClick={item.action}
                              onMouseEnter={() => setActiveIndex(currentIndex)}
                              className={cn(
                                'w-full flex items-center gap-3 px-4 py-2.5 text-left',
                                'transition-colors duration-75',
                                isActive
                                  ? 'bg-accent-500/10 text-surface-100'
                                  : 'text-surface-300 hover:bg-surface-800/50',
                              )}
                            >
                              <span
                                className={cn(
                                  'flex items-center justify-center w-6 h-6 rounded-md shrink-0',
                                  isActive ? 'bg-accent-500/20 text-accent-400' : 'bg-surface-800 text-surface-400',
                                )}
                              >
                                {item.icon}
                              </span>
                              <span className="flex-1 min-w-0">
                                <span className="block text-[0.8125rem] font-medium truncate">{item.label}</span>
                                {item.subtitle && (
                                  <span className="block text-[0.6875rem] text-surface-500 truncate">
                                    {item.subtitle}
                                  </span>
                                )}
                              </span>
                              {item.shortcut && (
                                <span className="shrink-0 ml-auto">{item.shortcut}</span>
                              )}
                              {isActive && (
                                <ChevronRight size={12} className="text-accent-400 shrink-0" />
                              )}
                            </button>
                          );
                        })}
                      </div>
                    );
                  })
                )}
              </div>

              {/* Footer hint */}
              <div className="px-4 py-2 border-t border-surface-800 flex items-center gap-3 text-[0.6875rem] text-surface-600">
                <span><kbd className="font-mono">↑↓</kbd> navigate</span>
                <span><kbd className="font-mono">↵</kbd> select</span>
                <span><kbd className="font-mono">ESC</kbd> close</span>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
