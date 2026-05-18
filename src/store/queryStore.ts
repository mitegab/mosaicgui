import { create } from 'zustand';
import type { QueryDsl, QueryGraphEdge, QueryGraphNode, QueryVersion } from '../types/query';
import { graphToDsl } from '../engine/graphToDsl';

const defaultDsl: QueryDsl = {
  model: '',
  filters: [],
  relations: [],
  output: [],
  limit: 10,
};

const initialNodes: QueryGraphNode[] = [
  {
    id: 'model-1',
    type: 'queryNode',
    position: { x: 80, y: 120 },
    data: { label: 'Select Model', kind: 'model', model: '' },
  },
  {
    id: 'output-1',
    type: 'queryNode',
    position: { x: 680, y: 120 },
    data: { label: 'Output', kind: 'output', fields: [] },
  },
];

const initialEdges: QueryGraphEdge[] = [
  { id: 'model-1-output-1', source: 'model-1', target: 'output-1', animated: true },
];

interface QueryState {
  nodes: QueryGraphNode[];
  edges: QueryGraphEdge[];
  dsl: QueryDsl;
  versions: QueryVersion[];
  selectedNodeId?: string;
  setNodes: (nodes: QueryGraphNode[]) => void;
  setEdges: (edges: QueryGraphEdge[]) => void;
  setDsl: (dsl: QueryDsl) => void;
  selectNode: (nodeId?: string) => void;
  upsertNode: (node: QueryGraphNode) => void;
  updateNodeData: (nodeId: string, data: Partial<QueryGraphNode['data']>) => void;
  compileGraph: () => QueryDsl;
  restoreVersion: (version: QueryVersion) => void;
  snapshotVersion: (name: string) => void;
}

export const useQueryStore = create<QueryState>((set, get) => ({
  nodes: initialNodes,
  edges: initialEdges,
  dsl: defaultDsl,
  versions: [],
  setNodes: (nodes) => set({ nodes }),
  setEdges: (edges) => set({ edges }),
  setDsl: (dsl) => set({ dsl }),
  selectNode: (selectedNodeId) => set({ selectedNodeId }),
  upsertNode: (node) =>
    set((state) => ({
      nodes: state.nodes.some((item) => item.id === node.id)
        ? state.nodes.map((item) => (item.id === node.id ? node : item))
        : [...state.nodes, node],
    })),
  updateNodeData: (nodeId, data) =>
    set((state) => ({
      nodes: state.nodes.map((node) => (node.id === nodeId ? { ...node, data: { ...node.data, ...data } } : node)),
    })),
  compileGraph: () => {
    const result = graphToDsl(get().nodes, get().edges);
    set({ dsl: result.dsl, nodes: result.nodes });
    return result.dsl;
  },
  restoreVersion: (version) => set({ nodes: version.graph.nodes, edges: version.graph.edges, dsl: version.dsl }),
  snapshotVersion: (name) => {
    const state = get();
    const dsl = state.compileGraph();
    const version: QueryVersion = {
      id: crypto.randomUUID(),
      name,
      createdAt: new Date().toISOString(),
      graph: { nodes: state.nodes, edges: state.edges },
      dsl,
    };
    set((current) => ({ versions: [version, ...current.versions] }));
  },
}));
