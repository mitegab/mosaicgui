import { useState } from 'react';
import { Bookmark, Clock, Database } from 'lucide-react';
import { AppShell } from '../components/layout/AppShell';
import { Panel } from '../components/ui/Panel';
import { SchemaBrowser } from '../features/schema/SchemaBrowser';
import { QueryHistoryPanel } from '../features/schema/QueryHistoryPanel';
import { SavedQueriesPanel } from '../features/schema/SavedQueriesPanel';
import { QueryWorkspace } from '../features/query-builder/QueryWorkspace';
import { ResultsExplorer } from '../features/results/ResultsExplorer';
import { RightPanelHost } from '../features/inspector/RightPanelHost';
import { cn } from '../utils/cn';

type LeftTab = 'schema' | 'history' | 'saved';

const leftTabs: { id: LeftTab; label: string; icon: typeof Database }[] = [
  { id: 'schema',  label: 'Schema',  icon: Database },
  { id: 'history', label: 'History', icon: Clock },
  { id: 'saved',   label: 'Saved',   icon: Bookmark },
];

function LeftSidebar() {
  const [tab, setTab] = useState<LeftTab>('schema');

  return (
    <div className="flex flex-col h-full gap-0 overflow-hidden rounded-[10px] bg-[var(--bg-sidebar)] border border-[var(--border-sidebar)]">
      {/* Tab bar */}
      <div className="flex shrink-0 border-b border-[var(--border-sidebar)] px-2 pt-2 gap-0.5">
        {leftTabs.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={cn(
              'flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-t-lg transition-colors -mb-px border-b-2',
              tab === id
                ? 'border-django-400 text-white bg-white/5'
                : 'border-transparent text-white/40 hover:text-white/70 hover:bg-white/5',
            )}
          >
            <Icon className="h-3.5 w-3.5" />
            {label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="flex-1 min-h-0 overflow-hidden">
        {tab === 'schema'  && <SchemaBrowser />}
        {tab === 'history' && (
          <div className="h-full overflow-y-auto">
            <QueryHistoryPanel />
          </div>
        )}
        {tab === 'saved' && (
          <div className="h-full overflow-y-auto">
            <SavedQueriesPanel />
          </div>
        )}
      </div>
    </div>
  );
}

export function WorkspacePage() {
  return (
    <AppShell
      left={<LeftSidebar />}
      right={<RightPanelHost />}
      bottom={<ResultsExplorer />}
    >
      <QueryWorkspace />
    </AppShell>
  );
}
