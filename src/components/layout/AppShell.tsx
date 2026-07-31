import { AnimatePresence, motion } from "framer-motion";
import { LayoutGrid, PanelBottom, PanelLeft } from "lucide-react";
import { PropsWithChildren, ReactNode, useState } from "react";
import { Gutter } from "../../features/split-view/Gutter";
import { LayoutManager } from "../../features/split-view/LayoutManager";
import { useResizablePanels } from "../../features/split-view/useResizablePanels";
import { useUiStore } from "../../store/uiStore";
import { cn } from "../../utils/cn";
import { AppHeader } from "./AppHeader";
import { ToastContainer } from "../ui/ToastContainer";
import { useKeyboardShortcuts } from "../../utils/useKeyboardShortcuts";

type AppShellProps = PropsWithChildren<{
  left: ReactNode;
  right: ReactNode;
  bottom: ReactNode;
}>;

export function AppShell({ left, right, bottom, children }: AppShellProps) {
  const {
    leftSidebarCollapsed,
    bottomPanelCollapsed,
    toggleLeftSidebar,
    toggleBottomPanel,
  } = useUiStore();
  const {
    layout,
    leftGutterHandlers,
    rightGutterHandlers,
    bottomGutterHandlers,
    saveLayout,
    loadLayout,
    deleteLayout,
    savedLayouts,
    applyPreset,
    presetNames,
  } = useResizablePanels();
  const [showLayoutMgr, setShowLayoutMgr] = useState(false);
  useKeyboardShortcuts();

  const leftWidth = leftSidebarCollapsed ? 0 : layout.leftWidth;
  const rightWidth = layout.rightWidth;
  const bottomHeight = layout.bottomHeight;

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-[var(--bg-base,#070a12)] text-slate-100">
      <AppHeader />

      {/* Layout control bar */}
      <div className="relative flex h-8 shrink-0 items-center gap-2 border-b border-white/5 bg-surface-950/70 px-3 backdrop-blur">
        {/* Sidebar toggles */}
        <button
          onClick={toggleLeftSidebar}
          title="Toggle sidebar (⌘B)"
          className={cn(
            "rounded p-1 transition hover:bg-white/10",
            leftSidebarCollapsed ? "text-accent-300" : "text-slate-500",
          )}
        >
          <PanelLeft className="h-3.5 w-3.5" />
        </button>
        <button
          onClick={toggleBottomPanel}
          title="Toggle results panel"
          className={cn(
            "rounded p-1 transition hover:bg-white/10",
            bottomPanelCollapsed ? "text-accent-300" : "text-slate-500",
          )}
        >
          <PanelBottom className="h-3.5 w-3.5" />
        </button>

        <div className="mx-1 h-4 w-px bg-white/10" />

        {/* Preset buttons */}
        {presetNames.map((preset) => (
          <button
            key={preset}
            onClick={() => applyPreset(preset)}
            className="rounded px-2 py-0.5 text-[10px] capitalize text-slate-500 transition hover:bg-white/10 hover:text-slate-200"
          >
            {preset.replace(/-/g, " ")}
          </button>
        ))}

        <div className="mx-1 h-4 w-px bg-white/10" />

        <button
          onClick={() => setShowLayoutMgr((v) => !v)}
          className="flex items-center gap-1 rounded px-2 py-0.5 text-[10px] text-slate-500 transition hover:bg-white/10 hover:text-slate-200"
        >
          <LayoutGrid className="h-3 w-3" /> Layouts
        </button>

        {/* Layout manager popover */}
        <AnimatePresence>
          {showLayoutMgr && (
            <div className="absolute left-40 top-9 z-50">
              <LayoutManager
                savedLayouts={savedLayouts}
                presetNames={presetNames}
                onLoad={loadLayout}
                onSave={saveLayout}
                onDelete={deleteLayout}
                onApplyPreset={applyPreset}
                onClose={() => setShowLayoutMgr(false)}
              />
            </div>
          )}
        </AnimatePresence>
      </div>

      {/* Main workspace */}
      <main className="flex min-h-0 flex-1 overflow-hidden p-2">
        {/* Left sidebar */}
        <AnimatePresence initial={false}>
          {!leftSidebarCollapsed && (
            <motion.aside
              key="left"
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: leftWidth, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              style={{ width: leftWidth }}
              className="min-h-0 shrink-0 overflow-hidden"
            >
              {left}
            </motion.aside>
          )}
        </AnimatePresence>

        {/* Left gutter */}
        {!leftSidebarCollapsed && (
          <Gutter
            orientation="vertical"
            {...leftGutterHandlers()}
            className="mx-1"
          />
        )}

        {/* Centre column: main canvas + bottom panel */}
        <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
          <div className="min-h-0 flex-1 overflow-hidden">{children}</div>

          {/* Bottom gutter + panel */}
          <AnimatePresence initial={false}>
            {!bottomPanelCollapsed && (
              <motion.div
                key="bottom"
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: bottomHeight, opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                className="shrink-0 overflow-hidden"
              >
                <Gutter
                  orientation="horizontal"
                  {...bottomGutterHandlers()}
                  className="my-1"
                />
                <div
                  style={{ height: bottomHeight - 10 }}
                  className="overflow-hidden"
                >
                  {bottom}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Right gutter */}
        <Gutter
          orientation="vertical"
          {...rightGutterHandlers()}
          className="mx-1"
        />

        {/* Right panel */}
        <aside
          style={{ width: rightWidth }}
          className="min-h-0 shrink-0 overflow-hidden"
        >
          {right}
        </aside>
      </main>

      <ToastContainer />
    </div>
  );
}
