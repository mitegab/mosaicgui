# Mosaic GUI Studio

> A visual ORM workbench for database schema inspection, graphical query authoring, and data exploration.

Mosaic combines the graph exploration of Neo4j Studio, the code intelligence of Monaco/VS Code, and the relational management of Django Admin into a single unified workspace.

---

## Tech Stack

- **Framework & Build:** React 18 · TypeScript · Vite · Tailwind CSS
- **State & Data Management:** Zustand · TanStack Query · IndexedDB (local-first)
- **Visual Canvas:** React Flow (`@xyflow/react`) · Smart edge routing
- **Editor & Validation:** Monaco Editor · Zod
- **Data Engine & Visualization:** DuckDB-Wasm · Virtualized Grid (`react-window`) · Recharts
- **UI & Motion:** Headless UI · Lucide Icons · Framer Motion

---

## Quick Start

### Prerequisites
- Node.js 18+
- npm 9+ or pnpm 8+

```bash
# Install dependencies
npm install

# Start local dev server (proxies /api/* to http://localhost:8000)
npm run dev

# Run unit tests
npm test

# Build for production
npm run build
```

---

## Key Capabilities

### Visual Query Builder & Schema Canvas
- **Node-Based Querying:** Compose relational joins, aggregations, and filters visually on an infinite canvas using React Flow.
- **Bi-Directional Sync:** Changes on the canvas translate automatically to DSL and ORM queries, and vice-versa.
- **Schema Explorer:** Search tables, inspect column types and indexes, and trace relational foreign keys visually.

### In-Browser Analytics & High-Capacity Grid
- **DuckDB-Wasm Integration:** Execute fast local analytical queries and client-side aggregations directly inside the browser.
- **Virtualized Data Grid:** Smoothly inspect and filter result sets exceeding 100k+ rows without UI lockups.
- **Visual Analytics:** Pivot results into bar, line, and area charts with Recharts.

### Developer Workspace & Ergonomics
- **Monaco DSL Studio:** Integrated code editor with schema-aware autocomplete, inline linting, and hover documentation.
- **Flexible Split-View:** Resizable docking panels, pop-out multi-window support via `BroadcastChannel`, and spatial navigation bookmarks.
- **Local-First & Offline Resilience:** Optimistic workspace state backed by IndexedDB and a full undo/redo action stack.
- **Command Palette (`⌘K`):** Global keyboard-driven navigation across entities, queries, views, and canvas bookmarks.

---

## Project Structure

```text
src/
├── api/                  API clients, schema endpoints, and query executor
├── components/
│   ├── layout/           AppShell, AppHeader, resizable docking frames
│   └── ui/               Design system primitives (buttons, panels, dialogs)
├── engine/               Graph-to-DSL and DSL-to-graph translation layers
├── features/
│   ├── canvas/           Viewport controls, semantic zoom, and bookmarks
│   ├── charts/           Recharts canvas, pivot tables, and chart toolbars
│   ├── command-palette/  Global shortcut handler and command palette (⌘K)
│   ├── data-grid/        Virtualized spreadsheet grid and cell formatters
│   ├── history/          Undo/redo command pattern and history manager
│   ├── local-first/      IndexedDB adapters and background sync queues
│   ├── monaco/           Mosaic DSL language configuration and syntax highlighting
│   ├── multi-window/     BroadcastChannel bridge and panel pop-outs
│   ├── query-builder/    Query graph workspace, forms, and validation
│   ├── results/          Data explorer, export utilities, and inspector
│   ├── schema/           Schema catalog, metadata inspect, and relation graph
│   └── wasm-engine/      DuckDB-Wasm client loader and execution pipeline
├── flows/                React Flow custom node types, handles, and inspectors
├── graph/                Edge routing and custom canvas connectors
├── store/                Zustand stores (query, schema, UI, offline state)
└── types/                TypeScript definitions for schemas, queries, and engine state
```

---

## License

This project is licensed under the MIT License. See `LICENSE` for details.
