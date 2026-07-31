import {
  Activity,
  Bot,
  Braces,
  ChevronLeft,
  ChevronRight,
  Command,
  DatabaseZap,
  Gauge,
  GitBranch,
  Moon,
  Sun,
  Wifi,
  WifiOff,
} from "lucide-react";
import { MorphButton } from "../../features/animations/MorphButton";
import { Button } from "../ui/Button";
import { Tooltip } from "../ui/Tooltip";
import { Badge } from "../ui/Badge";
import { useUiStore, type RightPanel } from "../../store/uiStore";
import { useQueryStore } from "../../store/queryStore";
import { useExecutionStore } from "../../store/executionStore";
import { useExecuteQuery } from "../../features/query-builder/useExecuteQuery";
import { useConnectionStatus } from "../../utils/useConnectionStatus";
import { cn } from "../../utils/cn";

const rightPanels: Array<{
  id: RightPanel;
  label: string;
  icon: typeof Braces;
  shortcut: string;
}> = [
  { id: "dsl", label: "DSL Studio", icon: Braces, shortcut: "1" },
  { id: "inspector", label: "Inspector", icon: GitBranch, shortcut: "2" },
  { id: "ai", label: "AI Assistant", icon: Bot, shortcut: "3" },
  { id: "performance", label: "Performance", icon: Gauge, shortcut: "4" },
];

export function AppHeader() {
  const {
    rightPanel,
    setRightPanel,
    darkMode,
    toggleDarkMode,
    leftSidebarCollapsed,
    toggleLeftSidebar,
    setCommandPaletteOpen,
  } = useUiStore();
  const compileGraph = useQueryStore((s) => s.compileGraph);
  const isRunning = useExecutionStore((s) => s.isRunning);
  const { run, stop } = useExecuteQuery();
  const { status, latency } = useConnectionStatus();

  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b border-[var(--border-sidebar)] bg-[var(--bg-header)] px-3 gap-3 z-20">
      {/* ── Left: brand + sidebar toggle ─────────────────────────── */}
      <div className="flex items-center gap-2.5 min-w-0">
        <Tooltip content="Toggle sidebar" shortcut="\\" side="bottom">
          <button
            onClick={toggleLeftSidebar}
            className="p-1.5 rounded-lg text-white/50 hover:text-white hover:bg-white/10 transition-colors"
          >
            {leftSidebarCollapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronLeft className="h-4 w-4" />
            )}
          </button>
        </Tooltip>

        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-django-400 shadow-glow-green shrink-0">
            <DatabaseZap className="h-4 w-4 text-white" />
          </div>
          <div className="hidden sm:block">
            <h1 className="text-[0.8125rem] font-bold tracking-tight text-white leading-tight">
              Mosaic GUI Studio
            </h1>
            <p className="text-[0.625rem] text-white/40 leading-tight font-mono">
              Visual ORM Workbench
            </p>
          </div>
        </div>

        {/* Connection pill */}
        <div
          className={cn(
            "hidden lg:flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[0.6875rem] font-medium border transition-colors",
            status === "connected" &&
              "bg-success-500/10 text-success-400 border-success-500/20",
            status === "disconnected" &&
              "bg-danger-500/10  text-danger-400  border-danger-500/20",
            status === "checking" && "bg-white/5 text-white/30 border-white/10",
          )}
        >
          {status === "connected" ? (
            <Wifi className="h-3 w-3" />
          ) : status === "disconnected" ? (
            <WifiOff className="h-3 w-3" />
          ) : (
            <span className="h-2 w-2 rounded-full bg-current animate-pulse" />
          )}
          {status === "connected"
            ? latency !== null
              ? `${latency}ms`
              : "Connected"
            : status === "disconnected"
              ? "Offline"
              : "Checking…"}
        </div>
      </div>

      {/* ── Centre: right-panel nav tabs ─────────────────────────── */}
      <nav className="flex items-center gap-0.5 rounded-xl border border-white/10 bg-white/5 p-1">
        {rightPanels.map(({ id, label, icon: Icon, shortcut }) => (
          <Tooltip key={id} content={label} shortcut={shortcut} side="bottom">
            <button
              onClick={() => setRightPanel(id)}
              className={cn(
                "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all duration-150",
                rightPanel === id
                  ? "bg-django-400 text-white shadow-sm"
                  : "text-white/50 hover:text-white hover:bg-white/10",
              )}
            >
              <Icon className="h-3.5 w-3.5" />
              <span className="hidden md:inline">{label}</span>
            </button>
          </Tooltip>
        ))}
      </nav>

      {/* ── Right: actions ───────────────────────────────────────── */}
      <div className="flex items-center gap-1.5">
        {/* Command palette stub */}
        <Tooltip content="Command palette" shortcut="⌘K" side="bottom">
          <button
            onClick={() => setCommandPaletteOpen(true)}
            className="hidden lg:flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-2.5 py-1.5 text-xs text-white/40 hover:text-white/70 hover:bg-white/10 transition-colors"
          >
            <Command className="h-3 w-3" />
            <span>Search…</span>
            <kbd className="kbd">⌘K</kbd>
          </button>
        </Tooltip>

        <Tooltip content="Compile graph → DSL" side="bottom">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => compileGraph()}
            className="text-white/60 hover:text-white hover:bg-white/10 border-0"
          >
            <Activity className="h-3.5 w-3.5" />
            <span className="hidden md:inline">Compile</span>
          </Button>
        </Tooltip>

        <MorphButton isRunning={isRunning} onRun={run} onStop={stop} />

        <div className="w-px h-5 bg-white/10 mx-0.5" />

        <Tooltip
          content={darkMode ? "Light mode" : "Dark mode"}
          shortcut="⌘⇧D"
          side="bottom"
        >
          <button
            onClick={toggleDarkMode}
            className="p-1.5 rounded-lg text-white/50 hover:text-white hover:bg-white/10 transition-colors"
          >
            {darkMode ? (
              <Sun className="h-4 w-4" />
            ) : (
              <Moon className="h-4 w-4" />
            )}
          </button>
        </Tooltip>
      </div>
    </header>
  );
}
