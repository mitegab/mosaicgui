import { AppShell } from '../components/layout/AppShell';
import { SchemaBrowser } from '../features/schema/SchemaBrowser';
import { QueryWorkspace } from '../features/query-builder/QueryWorkspace';
import { ResultsExplorer } from '../features/results/ResultsExplorer';
import { RightPanelHost } from '../features/inspector/RightPanelHost';

export function WorkspacePage() {
  return (
    <AppShell left={<SchemaBrowser />} right={<RightPanelHost />} bottom={<ResultsExplorer />}>
      <QueryWorkspace />
    </AppShell>
  );
}
