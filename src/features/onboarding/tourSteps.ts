export interface TourStep {
  id: string;
  target: string;
  title: string;
  content: string;
  placement: 'top' | 'bottom' | 'left' | 'right';
}

export const TOUR_STEPS: TourStep[] = [
  {
    id: 'welcome',
    target: 'body',
    title: 'Welcome to Mosaic GUI Studio',
    content:
      'Mosaic lets you visually build, inspect, and execute database queries without writing raw SQL. This quick tour will show you the key areas of the interface.',
    placement: 'bottom',
  },
  {
    id: 'schema-browser',
    target: '[data-tour="schema-browser"]',
    title: 'Schema Browser',
    content:
      'Browse all your database models and their fields here. Click a model to inspect its schema, or drag it onto the canvas to start building a query.',
    placement: 'right',
  },
  {
    id: 'graph-canvas',
    target: '[data-tour="graph-canvas"]',
    title: 'Graph Canvas',
    content:
      'This is where you build your queries visually. Drag nodes from the palette, connect them with edges, and watch the DSL update in real time.',
    placement: 'bottom',
  },
  {
    id: 'node-palette',
    target: '[data-tour="node-palette"]',
    title: 'Node Palette',
    content:
      'Use the palette to add different node types: Model, Filter, Logic, and Output. Each node type represents a step in your query pipeline.',
    placement: 'right',
  },
  {
    id: 'dsl-studio',
    target: '[data-tour="dsl-studio"]',
    title: 'DSL Studio',
    content:
      'The DSL Studio shows the generated query language in real time as you edit the graph. You can also hand-edit the DSL and see changes reflect on the canvas.',
    placement: 'left',
  },
  {
    id: 'run-query',
    target: '[data-tour="run-query"]',
    title: 'Run Your Query',
    content:
      'Hit the Run button (or press ⌘↩) to execute your query against the connected database. Results appear in the panel below.',
    placement: 'bottom',
  },
  {
    id: 'inspector',
    target: '[data-tour="inspector"]',
    title: 'Node Inspector',
    content:
      'Select any node on the canvas to inspect and edit its properties here — field selections, filter conditions, relation joins, and more.',
    placement: 'left',
  },
  {
    id: 'ai-assistant',
    target: '[data-tour="ai-assistant"]',
    title: 'AI Assistant',
    content:
      'Stuck? The AI Assistant can generate queries from plain-English descriptions, explain DSL snippets, and suggest optimizations. Press ⌘3 to open it.',
    placement: 'left',
  },
];
