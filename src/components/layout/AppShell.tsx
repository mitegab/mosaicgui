import { PropsWithChildren, ReactNode } from 'react';
import { motion } from 'framer-motion';
import { AppHeader } from './AppHeader';
import { useUiStore } from '../../store/uiStore';
import { cn } from '../../utils/cn';

type AppShellProps = PropsWithChildren<{
  left: ReactNode;
  right: ReactNode;
  bottom: ReactNode;
}>;

export function AppShell({ left, right, bottom, children }: AppShellProps) {
  const { leftSidebarCollapsed, bottomPanelCollapsed } = useUiStore();

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-surface-950 text-slate-100">
      <AppHeader />
      <main
        className={cn(
          'grid min-h-0 flex-1 gap-3 p-3 transition-[grid-template-columns]',
          leftSidebarCollapsed ? 'grid-cols-[64px_minmax(0,1fr)_420px]' : 'grid-cols-[360px_minmax(0,1fr)_420px]',
        )}
      >
        <motion.aside layout className="min-h-0 overflow-hidden">
          {left}
        </motion.aside>
        <section className="grid min-h-0 grid-rows-[minmax(0,1fr)_auto] gap-3 overflow-hidden">
          <div className="min-h-0 overflow-hidden">{children}</div>
          {!bottomPanelCollapsed && <div className="h-72 overflow-hidden">{bottom}</div>}
        </section>
        <aside className="min-h-0 overflow-hidden">{right}</aside>
      </main>
    </div>
  );
}
