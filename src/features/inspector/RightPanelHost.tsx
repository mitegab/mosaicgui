import { Panel } from '../../components/ui/Panel';
import { useUiStore, type RightPanel } from '../../store/uiStore';
import { DslStudio } from './DslStudio';
import { QueryInspector } from '../../inspector/QueryInspector';
import { PerformanceMonitor } from '../performance/PerformanceMonitor';
import { AiAssistantPanel } from './AiAssistantPanel';
import { cn } from '../../utils/cn';

const PANEL_META: Record<RightPanel, { label: string; subtitle: string }> = {
  dsl:         { label: 'DSL Studio',        subtitle: 'Monaco-powered query editor' },
  inspector:   { label: 'Query Inspector',   subtitle: 'Execution plan & logs' },
  ai:          { label: 'AI Assistant',      subtitle: 'Natural language → DSL' },
  performance: { label: 'Performance',       subtitle: 'Latency metrics & trends' },
};

export function RightPanelHost() {
  const rightPanel = useUiStore((s) => s.rightPanel);
  const meta = PANEL_META[rightPanel];

  return (
    <Panel
      title={meta.label}
      subtitle={meta.subtitle}
      className="h-full"
      bodyClassName={cn(
        'overflow-auto',
        rightPanel === 'dsl' ? 'p-3 flex flex-col' : 'p-3',
      )}
    >
      <div className={cn('h-full', rightPanel === 'dsl' && 'flex flex-col')}>
        {rightPanel === 'dsl'         && <DslStudio />}
        {rightPanel === 'inspector'   && <QueryInspector />}
        {rightPanel === 'performance' && <PerformanceMonitor />}
        {rightPanel === 'ai'          && <AiAssistantPanel />}
      </div>
    </Panel>
  );
}
