import { lazy, Suspense } from "react";
import { Panel } from "../../components/ui/Panel";
import { useUiStore } from "../../store/uiStore";
import { StructuredQueryForm } from "./StructuredQueryForm";

const QueryGraphCanvas = lazy(() =>
  import("../../flows/query/QueryGraphCanvas").then((module) => ({
    default: module.QueryGraphCanvas,
  })),
);

export function QueryWorkspace() {
  const { workspaceMode, setWorkspaceMode } = useUiStore();

  return (
    <Panel
      title="Visual Query Graph Builder"
      action={
        <div className="flex rounded-lg border border-white/10 bg-surface-950 p-1">
          {(["graph", "form"] as const).map((mode) => (
            <button
              key={mode}
              onClick={() => setWorkspaceMode(mode)}
              className={`rounded-md px-3 py-1 text-xs capitalize ${workspaceMode === mode ? "bg-accent-500 text-white" : "text-slate-400"}`}
            >
              {mode}
            </button>
          ))}
        </div>
      }
      bodyClassName="h-full"
      className="h-full"
    >
      {workspaceMode === "graph" ? (
        <Suspense
          fallback={
            <div className="grid h-full place-items-center text-sm text-slate-400">
              Loading React Flow graph engine…
            </div>
          }
        >
          <QueryGraphCanvas />
        </Suspense>
      ) : (
        <StructuredQueryForm />
      )}
    </Panel>
  );
}
