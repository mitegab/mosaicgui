import { Panel } from "../../components/ui/Panel";
import { useUiStore } from "../../store/uiStore";
import { DslStudio } from "./DslStudio";
import { QueryInspector } from "../../inspector/QueryInspector";
import { PerformanceMonitor } from "../performance/PerformanceMonitor";
import { AiAssistantPanel } from "./AiAssistantPanel";

export function RightPanelHost() {
  const rightPanel = useUiStore((state) => state.rightPanel);

  return (
    <Panel
      title={rightPanelLabel(rightPanel)}
      className="h-full"
      bodyClassName="p-4 overflow-auto"
    >
      {rightPanel === "dsl" && <DslStudio />}
      {rightPanel === "inspector" && <QueryInspector />}
      {rightPanel === "performance" && <PerformanceMonitor />}
      {rightPanel === "ai" && <AiAssistantPanel />}
    </Panel>
  );
}

function rightPanelLabel(panel: string) {
  switch (panel) {
    case "inspector":
      return "Query Inspector";
    case "ai":
      return "AI Query Assistant";
    case "performance":
      return "Performance Monitor";
    default:
      return "Monaco DSL Studio";
  }
}
