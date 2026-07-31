# Mosaic GUI Studio

Production-grade **Visual ORM Workbench** — a hybrid of VS Code + Neo4j Studio + Django Admin.

Built with React 18 · TypeScript (strict) · Vite · TailwindCSS · Zustand · TanStack Query · **React Flow (@xyflow/react)** · Monaco Editor · Framer Motion · Recharts · Zod · Headless UI · Lucide React.

---

## Running locally

```bash
npm install
npm run dev       # http://localhost:5173
npm test          # Vitest unit suite
npm run build     # Production build
```

The Vite dev server proxies `/api/*` → `http://localhost:8000` (Mosaic Core API).

---

## Architecture

```
src/
  api/            HTTP client, schemaApi, queryApi, mockSchema
  ai/             Natural-language → DSL assistant
  components/
    layout/       AppHeader, AppShell (resizable split-view)
    ui/           Button, Panel, Badge, Tooltip, ToastContainer
    ghost-ui/     FloatingActionButton, RadialContextMenu, InlineEditable
  engine/         graphToDsl, dslToGraph, dslSchema (Zod)
  features/
    a11y/         High-contrast, reduced-motion, ARIA live regions, focus trap
    animations/   SkeletonLoader, MorphButton, StaggeredList, SpringModal, PageTransition
    canvas/       SemanticZoom, CanvasBookmarks
    charts/       Recharts canvas, ChartToolbar, PivotTable, useChartStore
    clipboard/    clipboardUtils, ClipboardBar, NodeSnippetCopy, useClipboardHistory
    command-palette/ CommandPalette, useCommandPalette, shortcutMap
    data-grid/    SpreadsheetGrid (react-window 100k+), GridCell, useGridState
    history/      commandTypes, useUndoRedo (Ctrl+Z/Y), HistoryPanel
    inspector/    DslStudio (Monaco), AiAssistantPanel, RightPanelHost
    local-first/  IndexedDB adapter, syncQueue, SyncStatusBar, useOptimisticQuery
    monaco/       mosaicLanguage (autocomplete+hover), useMonacoTheme (custom dark theme)
    multi-window/ usePopOut, BroadcastBridge (BroadcastChannel), PopOutButton
    onboarding/   TourSpotlight, tourSteps, useTour (with confetti)
    performance/  PerformanceMonitor dashboard
    presentation/ usePresentationMode, PresentationOverlay (kiosk)
    query-builder/ QueryWorkspace, StructuredQueryForm, useExecuteQuery
    results/      ResultsExplorer (virtualized grid + row drawer + export)
    schema/       SchemaBrowser (search, field metadata, relationship preview, diff)
    session/      sessionSerializer, useSessionPersistence, SessionManager
    split-view/   useResizablePanels, Gutter, LayoutManager
    telemetry/    useFpsCounter, useMemoryMonitor, NetworkWaterfall, TelemetryHUD
    theme-builder/ ThemeBuilder, ThemePreview
    wasm-engine/  duckdbLoader (DuckDB Wasm), clientSideFilter, WasmQueryPanel
  flows/query/    QueryGraphCanvas, QueryNode, NodeInspector, nodeFactory
  graph/          AnimatedDataEdge (particles), SmartEdge, edgeRouter
  inspector/      QueryInspector (DSL + ORM + plan + logs)
  pages/          WorkspacePage
  store/          queryStore · schemaStore · executionStore · uiStore · offlineStore · themeStore
  types/          query · schema · execution · ai
  utils/          cn, debounce, useKeyboardShortcuts, useConnectionStatus
```

---

## Feature matrix (all 20 implemented)

| # | Feature | Key files |
|---|---------|-----------|
| 1 | Canvas infinite zoom & spatial navigation | `features/canvas/`, `useSemanticZoom`, `CanvasBookmarks`, viewport persistence |
| 2 | Universal command palette (⌘K) | `features/command-palette/CommandPalette`, `shortcutMap` |
| 3 | Local-first optimistic state | `store/offlineStore`, `features/local-first/` (IndexedDB, syncQueue, SyncStatusBar) |
| 4 | Spreadsheet data grid (100k+ rows) | `features/data-grid/SpreadsheetGrid`, `GridCell`, `useGridState` |
| 5 | Multi-window & pop-out | `features/multi-window/usePopOut`, `BroadcastBridge`, `PopOutButton` |
| 6 | Theme builder | `store/themeStore`, `features/theme-builder/ThemeBuilder`, CSS variable injection |
| 7 | DuckDB Wasm client-side query engine | `features/wasm-engine/duckdbLoader`, `clientSideFilter`, `WasmQueryPanel` |
| 8 | Rich graph interactions | `graph/AnimatedDataEdge` (SVG particles), `SmartEdge`, `edgeRouter`, snap-to-grid |
| 9 | Ghost UI & progressive disclosure | `components/ghost-ui/FloatingActionButton`, `RadialContextMenu`, `InlineEditable` |
| 10 | Split-view tiling window manager | `features/split-view/`, `Gutter`, `LayoutManager`, resizable `AppShell` |
| 11 | Monaco editor enhancements | `features/monaco/mosaicLanguage` (autocomplete, hover), `useMonacoTheme` |
| 12 | Cross-device session hydration | `features/session/sessionSerializer`, `useSessionPersistence`, URL-hash handoff |
| 13 | Client-side chart builder | `features/charts/ChartCanvas` (Recharts), `ChartToolbar`, `PivotTable` |
| 14 | Accessibility | `features/a11y/` (ARIA live, FocusTrap, A11yToolbar, high-contrast CSS) |
| 15 | Guided tours & onboarding | `features/onboarding/TourSpotlight`, confetti burst, localStorage completion flag |
| 16 | Performance telemetry HUD | `features/telemetry/` (FPS, heap memory, NetworkWaterfall, TelemetryHUD) |
| 17 | Undo/redo stack | `features/history/commandTypes`, `useUndoRedo` (Ctrl+Z/Y), `HistoryPanel` |
| 18 | Micro-interactions & animations | `features/animations/` (SkeletonLoader, MorphButton, StaggeredList, SpringModal) |
| 19 | Presentation & kiosk mode | `features/presentation/usePresentationMode`, `PresentationOverlay` |
| 20 | Advanced clipboard integration | `features/clipboard/clipboardUtils`, `ClipboardBar`, `NodeSnippetCopy`, history |
