import { useEffect, useRef } from 'react';
import { create } from 'zustand';
import { useQueryStore } from '../../store/queryStore';
import type { QueryNodeData } from '../../types/query';
import { LWWMap } from './lwwRegister';

export type CrdtOp = {
  type: 'node' | 'edge';
  id: string;
  value: unknown;
  timestamp: number;
  siteId: string;
};

const SITE_ID_KEY = 'mosaic-crdt-site-id';
const CHANNEL_NAME = 'mosaic-crdt';

/** A random UUID persisted per browser tab, identifying this replica in merges. */
export function getSiteId(): string {
  try {
    let id = sessionStorage.getItem(SITE_ID_KEY);
    if (!id) {
      id = crypto.randomUUID();
      sessionStorage.setItem(SITE_ID_KEY, id);
    }
    return id;
  } catch {
    return crypto.randomUUID();
  }
}

// ---------------------------------------------------------------------------
// A small log store so UI (CrdtSyncIndicator) can visualize recent merges.
// ---------------------------------------------------------------------------

interface CrdtLogState {
  ops: CrdtOp[];
  record: (op: CrdtOp) => void;
  clear: () => void;
}

export const useCrdtLogStore = create<CrdtLogState>((set) => ({
  ops: [],
  record: (op) => set((state) => ({ ops: [op, ...state.ops].slice(0, 20) })),
  clear: () => set({ ops: [] }),
}));

// ---------------------------------------------------------------------------
// GraphCrdtDocument — wraps two LWWMaps (nodes + edges) for the query graph.
// ---------------------------------------------------------------------------

export class GraphCrdtDocument {
  private nodeMap = new LWWMap<QueryNodeData>();
  private edgeMap = new LWWMap<unknown>();
  private siteId = getSiteId();

  getSiteId(): string {
    return this.siteId;
  }

  applyLocalNodeChange(nodeId: string, data: QueryNodeData, siteId: string = this.siteId): CrdtOp {
    const timestamp = Date.now();
    this.nodeMap.set(nodeId, data, siteId, timestamp);
    return { type: 'node', id: nodeId, value: data, timestamp, siteId };
  }

  applyLocalEdgeChange(edgeId: string, value: unknown, siteId: string = this.siteId): CrdtOp {
    const timestamp = Date.now();
    this.edgeMap.set(edgeId, value, siteId, timestamp);
    return { type: 'edge', id: edgeId, value, timestamp, siteId };
  }

  /**
   * Merge an operation received from another replica.
   * Returns whether the merge actually changed the resolved value, plus
   * that resolved value (which may differ from `op.value` if a concurrent
   * local write already won).
   */
  applyRemoteOp(op: CrdtOp): { changed: boolean; value: unknown } {
    const incoming = new LWWMap<unknown>();
    incoming.set(op.id, op.value, op.siteId, op.timestamp);

    const map = op.type === 'node' ? (this.nodeMap as unknown as LWWMap<unknown>) : this.edgeMap;
    const changedKeys = map.merge(incoming);

    return { changed: changedKeys.includes(op.id), value: map.get(op.id) };
  }

  getNode(id: string): QueryNodeData | undefined {
    return this.nodeMap.get(id);
  }

  serialize(): CrdtOp[] {
    const nodeOps: CrdtOp[] = this.nodeMap.entries().map(([id, reg]) => ({
      type: 'node' as const,
      id,
      value: reg.value,
      timestamp: reg.timestamp,
      siteId: reg.siteId,
    }));
    const edgeOps: CrdtOp[] = this.edgeMap.entries().map(([id, reg]) => ({
      type: 'edge' as const,
      id,
      value: reg.value,
      timestamp: reg.timestamp,
      siteId: reg.siteId,
    }));
    return [...nodeOps, ...edgeOps];
  }
}

let sharedDocument: GraphCrdtDocument | null = null;
function getSharedDocument(): GraphCrdtDocument {
  if (!sharedDocument) sharedDocument = new GraphCrdtDocument();
  return sharedDocument;
}

// ---------------------------------------------------------------------------
// useGraphCrdtSync — keeps the query graph conflict-free across browser tabs.
// ---------------------------------------------------------------------------

export function useGraphCrdtSync(): { siteId: string } {
  const nodes = useQueryStore((s) => s.nodes);
  const updateNodeData = useQueryStore((s) => s.updateNodeData);

  const docRef = useRef<GraphCrdtDocument | null>(null);
  const channelRef = useRef<BroadcastChannel | null>(null);
  const applyingRemoteRef = useRef(false);
  const prevNodesRef = useRef<Map<string, QueryNodeData>>(new Map());

  if (!docRef.current) docRef.current = getSharedDocument();

  useEffect(() => {
    if (typeof BroadcastChannel === 'undefined') return;

    const channel = new BroadcastChannel(CHANNEL_NAME);
    channelRef.current = channel;

    channel.onmessage = (event: MessageEvent<CrdtOp>) => {
      const op = event.data;
      const doc = docRef.current;
      if (!doc) return;

      const result = doc.applyRemoteOp(op);
      useCrdtLogStore.getState().record(op);

      if (result.changed && op.type === 'node') {
        applyingRemoteRef.current = true;
        updateNodeData(op.id, result.value as Partial<QueryNodeData>);
        applyingRemoteRef.current = false;
      }
    };

    return () => {
      channel.close();
      channelRef.current = null;
    };
  }, [updateNodeData]);

  useEffect(() => {
    if (applyingRemoteRef.current) return;
    const doc = docRef.current;
    if (!doc) return;

    const prev = prevNodesRef.current;
    const nextSnapshot = new Map<string, QueryNodeData>();

    for (const node of nodes) {
      nextSnapshot.set(node.id, node.data);
      if (prev.get(node.id) !== node.data) {
        const op = doc.applyLocalNodeChange(node.id, node.data);
        useCrdtLogStore.getState().record(op);
        channelRef.current?.postMessage(op);
      }
    }

    prevNodesRef.current = nextSnapshot;
  }, [nodes]);

  return { siteId: docRef.current.getSiteId() };
}
