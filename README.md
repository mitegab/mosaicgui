# Mosaic GUI Studio

Production-grade visual ORM workbench scaffold built with React, TypeScript, Vite, TailwindCSS, Zustand, React Query, React Flow, Monaco Editor, Zod, Framer Motion, and Headless-compatible accessible primitives.

## Implemented phases

1. UI shell and responsive workbench layout
2. Schema engine with `/api/models/` integration, searchable model tree, metadata, relationship preview, favorites, pinning, and schema diff surface
3. React Flow visual query graph with model/filter/condition/logic/output/group/subquery nodes, drag/drop creation, connection logic, reusable/collapsible nodes, and auto-layout
4. DSL compiler and Monaco DSL Studio with graph → DSL, DSL validation, diff, format, and DSL → graph generation
5. Query execution against `/api/query/`, cancellation, history capture, metrics, and virtualized results explorer with row drawer and export
6. Query inspector/debugger and performance dashboard
7. AI query assistant module for natural language generation, fixing, optimizing, SQL-to-DSL placeholder behavior, and index suggestions
8. Test scaffolding for graph compilation, DSL sync, and execution normalization

## Development

Install Node.js and npm, then run:

- `npm install`
- `npm run dev`
- `npm test`
- `npm run build`

The local tool environment used for generation did not have `npm` installed, so dependency installation and runtime verification must be run on a machine with Node.js available.
