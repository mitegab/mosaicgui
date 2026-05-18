import { PropsWithChildren, ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AppHeader } from './AppHeader';
import { useUiStore } from '../../store/uiStore';
import { ToastContainer } from '../ui/ToastContainer';
import { useKeyboardShortcuts } from '../../utils/useKeyboardShortcuts';
import { cn } from '../../utils/cn';

type AppShellProps = PropsWithChildren<{
  left: ReactNode;
  right: ReactNode;
  bottom: ReactNode;
}>;

export function AppShell({ left, right, bottom, children }: AppShellProps) {
  const { leftSidebarCollapsed, bottomPanelCollapsed } = useUiStore();
  useKeyboardShortcuts();

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-[var(--bg-base)]">
      <AppHeader />

      <main
        className={cn(
          'grid min-h-0 flex-1 gap-2 p-2 transition-[grid-template-columns] duration-300 ease-spring',
          leftSidebarCollapsed
            ? 'grid-cols-[0px_minmax(0,1fr)_380px]'
            : 'grid-cols-[320px_minmax(0,1fr)_380px]',
        )}
      >
        {/* Left sidebar */}
        <motion.aside
          layout
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          className={cn(
            'min-h-0 overflow-hidden transition-opacity duration-200',
            leftSidebarCollapsed ? 'opacity-0 pointer-events-none' : 'opacity-100',
          )}
        >
          {left}
        </motion.aside>

        {/* Centre: main canvas + bottom panel */}
        <section className="grid min-h-0 gap-2 overflow-hidden"
          style={{ gridTemplateRows: bottomPanelCollapsed ? '1fr' : '1fr 260px' }}
        >
          <div className="min-h-0 overflow-hidden">
            {children}
          </div>
          <AnimatePresence initial={false}>
            {!bottomPanelCollapsed && (
              <motion.div
                key="bottom"
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 260, opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                className="overflow-hidden"
              >
                {bottom}
              </motion.div>
            )}
          </AnimatePresence>
        </section>

        {/* Right panel */}
        <aside className="min-h-0 overflow-hidden">
          {right}
        </aside>
      </main>

      <ToastContainer />
    </div>
  );
}
