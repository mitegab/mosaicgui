import {
  Activity,
  Bot,
  Braces,
  DatabaseZap,
  Gauge,
  GitBranch,
  Play,
} from "lucide-react";
import { Button } from "../ui/Button";
import { useUiStore, type RightPanel } from "../../store/uiStore";
import { useQueryStore } from "../../store/queryStore";
import { useExecutionStore } from "../../store/executionStore";
import { useExecuteQuery } from "../../features/query-builder/useExecuteQuery";

const rightPanels: Array<{
  id: RightPanel;
  label: string;
  icon: typeof Braces;
}> = [
  { id: "dsl", label: "DSL Studio", icon: Braces },
  { id: "inspector", label: "Inspector", icon: GitBranch },
  { id: "ai", label: "AI Assistant", icon: Bot },
  { id: "performance", label: "Performance", icon: Gauge },
];

export function AppHeader() {
  const { rightPanel, setRightPanel } = useUiStore();
  const compileGraph = useQueryStore((state) => state.compileGraph);
  const isRunning = useExecutionStore((state) => state.isRunning);
  const { run, stop } = useExecuteQuery();

  return (
    <header className="flex h-16 shrink-0 items-center justify-between border-b border-white/10 bg-surface-950/80 px-4 backdrop-blur">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent-500 shadow-glow">
          <DatabaseZap className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-lg font-semibold tracking-tight text-white">
            Mosaic GUI Studio
          </h1>
          <p className="text-xs text-slate-400">
            Visual ORM Workbench · Query Graph · DSL Compiler · Inspector
          </p>
        </div>
      </div>

      <nav className="flex items-center gap-2 rounded-xl border border-white/10 bg-surface-900 p-1">
        {rightPanels.map((panel) => {
          const Icon = panel.icon;
          return (
            <button
              key={panel.id}
              onClick={() => setRightPanel(panel.id)}
              className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition ${
                rightPanel === panel.id
                  ? "bg-accent-500 text-white"
                  : "text-slate-300 hover:bg-white/10"
              }`}
            >
              <Icon className="h-4 w-4" />
              {panel.label}
            </button>
          );
        })}
      </nav>

      <div className="flex items-center gap-2">
        <Button variant="ghost" onClick={() => compileGraph()}>
          <Activity className="h-4 w-4" /> Compile
        </Button>
        <Button
          variant={isRunning ? "danger" : "primary"}
          onClick={isRunning ? stop : run}
        >
          <Play className="h-4 w-4" /> {isRunning ? "Stop Query" : "Run Query"}
        </Button>
      </div>
    </header>
  );
}
