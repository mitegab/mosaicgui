/**
 * commandTypes.ts
 * Command pattern types and concrete implementations for the undo/redo stack.
 */

import type { XYPosition } from '@xyflow/react';
import type { QueryGraphNode, QueryGraphEdge, QueryNodeData } from '../../types/query';

// ---------------------------------------------------------------------------
// Store API surface (subset of queryStore we need for commands)
// ---------------------------------------------------------------------------

export interface QueryStoreApi {
  getState: () => {
    nodes: QueryGraphNode[];
    edges: QueryGraphEdge[];
  };
  upsertNode: (node: QueryGraphNode) => void;
  setNodes: (nodes: QueryGraphNode[]) => void;
  setEdges: (edges: QueryGraphEdge[]) => void;
  updateNodeData: (nodeId: string, data: Partial<QueryNodeData>) => void;
}

// ---------------------------------------------------------------------------
// Base Command interface
// ---------------------------------------------------------------------------

export interface Command {
  id: string;
  type: string;
  description: string;
  timestamp: string;
  execute(): void;
  undo(): void;
}

// ---------------------------------------------------------------------------
// AddNodeCommand
// ---------------------------------------------------------------------------

export class AddNodeCommand implements Command {
  readonly id: string;
  readonly type = 'ADD_NODE';
  readonly description: string;
  readonly timestamp: string;

  constructor(
    private readonly node: QueryGraphNode,
    private readonly store: QueryStoreApi
  ) {
    this.id = crypto.randomUUID();
    this.timestamp = new Date().toISOString();
    this.description = `Add node "${node.data.label}"`;
  }

  execute(): void {
    this.store.upsertNode(this.node);
  }

  undo(): void {
    const { nodes } = this.store.getState();
    this.store.setNodes(nodes.filter((n) => n.id !== this.node.id));
  }
}

// ---------------------------------------------------------------------------
// RemoveNodeCommand
// ---------------------------------------------------------------------------

export class RemoveNodeCommand implements Command {
  readonly id: string;
  readonly type = 'REMOVE_NODE';
  readonly description: string;
  readonly timestamp: string;

  /** Edges connected to the removed node, saved for undo. */
  private readonly affectedEdges: QueryGraphEdge[];

  constructor(
    private readonly node: QueryGraphNode,
    private readonly store: QueryStoreApi
  ) {
    this.id = crypto.randomUUID();
    this.timestamp = new Date().toISOString();
    this.description = `Remove node "${node.data.label}"`;

    // Snapshot all edges touching this node at construction time
    const { edges } = store.getState();
    this.affectedEdges = edges.filter(
      (e) => e.source === node.id || e.target === node.id
    );
  }

  execute(): void {
    const { nodes, edges } = this.store.getState();
    this.store.setNodes(nodes.filter((n) => n.id !== this.node.id));
    this.store.setEdges(
      edges.filter(
        (e) => e.source !== this.node.id && e.target !== this.node.id
      )
    );
  }

  undo(): void {
    this.store.upsertNode(this.node);
    // Restore connected edges
    const { edges } = this.store.getState();
    const edgeIds = new Set(edges.map((e) => e.id));
    const toRestore = this.affectedEdges.filter((e) => !edgeIds.has(e.id));
    if (toRestore.length > 0) {
      this.store.setEdges([...edges, ...toRestore]);
    }
  }
}

// ---------------------------------------------------------------------------
// UpdateNodeCommand
// ---------------------------------------------------------------------------

export class UpdateNodeCommand implements Command {
  readonly id: string;
  readonly type = 'UPDATE_NODE';
  readonly description: string;
  readonly timestamp: string;

  constructor(
    private readonly nodeId: string,
    private readonly prev: Partial<QueryNodeData>,
    private readonly next: Partial<QueryNodeData>,
    private readonly store: QueryStoreApi
  ) {
    this.id = crypto.randomUUID();
    this.timestamp = new Date().toISOString();
    this.description = `Update node ${nodeId}`;
  }

  execute(): void {
    this.store.updateNodeData(this.nodeId, this.next);
  }

  undo(): void {
    this.store.updateNodeData(this.nodeId, this.prev);
  }
}

// ---------------------------------------------------------------------------
// MoveNodeCommand
// ---------------------------------------------------------------------------

export class MoveNodeCommand implements Command {
  readonly id: string;
  readonly type = 'MOVE_NODE';
  readonly description: string;
  readonly timestamp: string;

  constructor(
    private readonly nodeId: string,
    private readonly from: XYPosition,
    private readonly to: XYPosition,
    private readonly store: QueryStoreApi
  ) {
    this.id = crypto.randomUUID();
    this.timestamp = new Date().toISOString();
    this.description = `Move node ${nodeId}`;
  }

  execute(): void {
    const { nodes } = this.store.getState();
    this.store.setNodes(
      nodes.map((n) =>
        n.id === this.nodeId ? { ...n, position: this.to } : n
      )
    );
  }

  undo(): void {
    const { nodes } = this.store.getState();
    this.store.setNodes(
      nodes.map((n) =>
        n.id === this.nodeId ? { ...n, position: this.from } : n
      )
    );
  }
}

// ---------------------------------------------------------------------------
// AddEdgeCommand
// ---------------------------------------------------------------------------

export class AddEdgeCommand implements Command {
  readonly id: string;
  readonly type = 'ADD_EDGE';
  readonly description: string;
  readonly timestamp: string;

  constructor(
    private readonly edge: QueryGraphEdge,
    private readonly store: QueryStoreApi
  ) {
    this.id = crypto.randomUUID();
    this.timestamp = new Date().toISOString();
    this.description = `Add edge ${edge.source} → ${edge.target}`;
  }

  execute(): void {
    const { edges } = this.store.getState();
    if (!edges.some((e) => e.id === this.edge.id)) {
      this.store.setEdges([...edges, this.edge]);
    }
  }

  undo(): void {
    const { edges } = this.store.getState();
    this.store.setEdges(edges.filter((e) => e.id !== this.edge.id));
  }
}

// ---------------------------------------------------------------------------
// RemoveEdgeCommand
// ---------------------------------------------------------------------------

export class RemoveEdgeCommand implements Command {
  readonly id: string;
  readonly type = 'REMOVE_EDGE';
  readonly description: string;
  readonly timestamp: string;

  constructor(
    private readonly edge: QueryGraphEdge,
    private readonly store: QueryStoreApi
  ) {
    this.id = crypto.randomUUID();
    this.timestamp = new Date().toISOString();
    this.description = `Remove edge ${edge.source} → ${edge.target}`;
  }

  execute(): void {
    const { edges } = this.store.getState();
    this.store.setEdges(edges.filter((e) => e.id !== this.edge.id));
  }

  undo(): void {
    const { edges } = this.store.getState();
    if (!edges.some((e) => e.id === this.edge.id)) {
      this.store.setEdges([...edges, this.edge]);
    }
  }
}

// ---------------------------------------------------------------------------
// Factory
// ---------------------------------------------------------------------------

export type CommandKind =
  | 'addNode'
  | 'removeNode'
  | 'updateNode'
  | 'moveNode'
  | 'addEdge'
  | 'removeEdge';

export type CommandFactoryArgs =
  | { kind: 'addNode'; node: QueryGraphNode; store: QueryStoreApi }
  | { kind: 'removeNode'; node: QueryGraphNode; store: QueryStoreApi }
  | { kind: 'updateNode'; nodeId: string; prev: Partial<QueryNodeData>; next: Partial<QueryNodeData>; store: QueryStoreApi }
  | { kind: 'moveNode'; nodeId: string; from: XYPosition; to: XYPosition; store: QueryStoreApi }
  | { kind: 'addEdge'; edge: QueryGraphEdge; store: QueryStoreApi }
  | { kind: 'removeEdge'; edge: QueryGraphEdge; store: QueryStoreApi };

export function createCommand(args: CommandFactoryArgs): Command {
  switch (args.kind) {
    case 'addNode':
      return new AddNodeCommand(args.node, args.store);
    case 'removeNode':
      return new RemoveNodeCommand(args.node, args.store);
    case 'updateNode':
      return new UpdateNodeCommand(args.nodeId, args.prev, args.next, args.store);
    case 'moveNode':
      return new MoveNodeCommand(args.nodeId, args.from, args.to, args.store);
    case 'addEdge':
      return new AddEdgeCommand(args.edge, args.store);
    case 'removeEdge':
      return new RemoveEdgeCommand(args.edge, args.store);
  }
}
