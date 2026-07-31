import { DragEvent, useCallback, useEffect, useMemo } from "react";
import {
  addEdge,
  Background,
  BackgroundVariant,
  Controls,
  MiniMap,
  ReactFlow,
  ReactFlowProvider,
  useEdgesState,
  useNodesState,
  useReactFlow,
  useViewport,
  type Connection,
  type EdgeTypes,
  type NodeTypes,
} from "@xyflow/react";
import { Button } from "../../components/ui/Button";
import { useQueryStore } from "../../store/queryStore";
import type {
  QueryGraphEdge,
  QueryGraphNode,
  QueryNodeKind,
} from "../../types/query";
import { autoLayout, createQueryNode } from "./nodeFactory";
import { QueryNode } from "./QueryNode";
import { NodeInspector } from "./NodeInspector";
import { CanvasBookmarkBar } from "../../features/canvas/CanvasBookmarks";
import { AnimatedDataEdge } from "../../graph/AnimatedDataEdge";
import { SmartEdge } from "../../graph/SmartEdge";
import { useSemanticZoom } from "../../features/canvas/useSemanticZoom";

const nodeTypes: NodeTypes = { queryNode: QueryNode };
const edgeTypes: EdgeTypes = {
  animated: AnimatedDataEdge,
  smart: SmartEdge,
};

const palette: QueryNodeKind[] = [
  "model",
  "filter",
  "condition",
  "logic",
  "output",
  "group",
  "subquery",
];

const SNAP_GRID: [number, number] = [20, 20];

const zoomBadgeLabel: Record<string, string> = {
  detail: "🔍 Detail",
  normal: "⬜ Normal",
  overview: "🗺 Overview",
};

function QueryGraphCanvasInner() {
  const storeNodes = useQueryStore((state) => state.nodes);
  const storeEdges = useQueryStore((state) => state.edges);
  const selectedNodeId = useQueryStore((state) => state.selectedNodeId);
  const setStoreNodes = useQueryStore((state) => state.setNodes);
  const setStoreEdges = useQueryStore((state) => state.setEdges);
  const selectNode = useQueryStore((state) => state.selectNode);
  const updateNodeData = useQueryStore((state) => state.updateNodeData);
  const compileGraph = useQueryStore((state) => state.compileGraph);

  const [nodes, setNodes, onNodesChange] = useNodesState(storeNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(storeEdges);

  const { getViewport, setViewport, fitView } = useReactFlow();
  const { zoom } = useViewport();
  const zoomLevel = useSemanticZoom();

  /* ── Restore viewport from session ── */
  useEffect(() => {
    try {
      const saved = sessionStorage.getItem("mosaic-viewport");
      if (saved) {
        const vp = JSON.parse(saved) as { x: number; y: number; zoom: number };
        setViewport(vp, { duration: 0 });
      }
    } catch {
      /* ignore */
    }
  }, [setViewport]);

  /* ── Persist viewport on move ── */
  const handleMoveEnd = useCallback(() => {
    const vp = getViewport();
    sessionStorage.setItem("mosaic-viewport", JSON.stringify(vp));
  }, [getViewport]);

  const handleJump = useCallback(
    (bookmark: { x: number; y: number; zoom: number }) => {
      setViewport(
        { x: bookmark.x, y: bookmark.y, zoom: bookmark.zoom },
        { duration: 600 },
      );
    },
    [setViewport],
  );

  const selectedNode = useMemo(
    () => nodes.find((node) => node.id === selectedNodeId),
    [nodes, selectedNodeId],
  );

  const syncNodes = useCallback(
    (next: QueryGraphNode[]) => {
      setNodes(next);
      setStoreNodes(next);
    },
    [setNodes, setStoreNodes],
  );

  const syncEdges = useCallback(
    (next: QueryGraphEdge[]) => {
      setEdges(next);
      setStoreEdges(next);
    },
    [setEdges, setStoreEdges],
  );

  const onConnect = useCallback(
    (connection: Connection) => {
      const nextEdges = addEdge(
        { ...connection, type: "animated", animated: true },
        edges,
      );
      syncEdges(nextEdges);
      window.setTimeout(() => compileGraph(), 350);
    },
    [compileGraph, edges, syncEdges],
  );

  const addNode = useCallback(
    (kind: QueryNodeKind) => {
      const next = [...nodes, createQueryNode(kind, nodes.length + 1)];
      syncNodes(next);
      window.setTimeout(() => compileGraph(), 350);
    },
    [compileGraph, nodes, syncNodes],
  );

  const onDrop = useCallback(
    (event: DragEvent<HTMLDivElement>) => {
      event.preventDefault();
      const kind = event.dataTransfer.getData(
        "application/mosaic-node",
      ) as QueryNodeKind;
      if (!kind) return;
      addNode(kind);
    },
    [addNode],
  );

  return (
    <div
      className="grid h-full grid-cols-[minmax(0,1fr)_300px] gap-3"
      data-tour="graph-canvas"
    >
      <div className="relative min-h-0 overflow-hidden rounded-xl border border-white/10 bg-surface-950">
        {/* Node palette toolbar */}
        <div className="absolute left-3 top-3 z-10 flex flex-wrap gap-1.5 rounded-xl border border-white/10 bg-surface-900/95 p-2 backdrop-blur">
          {palette.map((kind) => (
            <button
              key={kind}
              draggable
              onDragStart={(event) =>
                event.dataTransfer.setData("application/mosaic-node", kind)
              }
              onClick={() => addNode(kind)}
              className="rounded-lg border border-white/10 bg-surface-800 px-2 py-1 text-xs capitalize text-slate-200 hover:bg-surface-700 transition"
            >
              + {kind}
            </button>
          ))}
          <div className="mx-1 h-4 w-px bg-white/10 self-center" />
          <Button
            variant="ghost"
            className="px-2 py-1 text-xs"
            onClick={() => {
              syncNodes(autoLayout(nodes));
              fitView({ duration: 400 });
            }}
          >
            Layout
          </Button>
          <Button
            variant="ghost"
            className="px-2 py-1 text-xs"
            onClick={() => compileGraph()}
          >
            Validate
          </Button>
        </div>

        {/* Semantic zoom badge */}
        <div className="absolute left-3 bottom-16 z-10">
          <span className="rounded-full border border-white/10 bg-surface-900/90 px-2 py-0.5 text-[10px] text-slate-400 backdrop-blur">
            {zoomBadgeLabel[zoomLevel]} · {Math.round(zoom * 100)}%
          </span>
        </div>

        {/* Bookmark bar */}
        <div className="absolute right-3 top-3 z-10">
          <CanvasBookmarkBar
            onJump={handleJump}
            getCurrentViewport={() => getViewport()}
          />
        </div>

        <ReactFlow
          nodes={nodes}
          edges={edges}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          snapToGrid
          snapGrid={SNAP_GRID}
          minZoom={0.05}
          maxZoom={4}
          defaultEdgeOptions={{
            type: "animated",
            animated: true,
            style: { stroke: "#a78bfa", strokeWidth: 1.8 },
          }}
          connectionLineStyle={{
            stroke: "#a78bfa",
            strokeWidth: 2,
            strokeDasharray: "5 3",
          }}
          onNodesChange={(changes) => {
            onNodesChange(changes);
            window.setTimeout(() => setStoreNodes(nodes), 0);
          }}
          onEdgesChange={(changes) => {
            onEdgesChange(changes);
            window.setTimeout(() => setStoreEdges(edges), 0);
          }}
          onConnect={onConnect}
          onNodeClick={(_, node) => selectNode(node.id)}
          onPaneClick={() => selectNode(undefined)}
          onDrop={onDrop}
          onDragOver={(event) => event.preventDefault()}
          onMoveEnd={handleMoveEnd}
          fitView
          proOptions={{ hideAttribution: true }}
        >
          <MiniMap
            pannable
            zoomable
            nodeColor={(n) => {
              const kind = (n.data as { kind?: string }).kind ?? "";
              const palette: Record<string, string> = {
                model: "#06b6d4",
                filter: "#8b5cf6",
                condition: "#f59e0b",
                logic: "#10b981",
                output: "#0ea5e9",
              };
              return palette[kind] ?? "#64748b";
            }}
          />
          <Controls />
          <Background
            variant={BackgroundVariant.Dots}
            gap={20}
            size={1}
            color="#1e2a3d"
          />
        </ReactFlow>
      </div>

      <NodeInspector
        node={selectedNode}
        onChange={(nodeId, data) => {
          updateNodeData(nodeId, data);
          const next = nodes.map((node) =>
            node.id === nodeId
              ? { ...node, data: { ...node.data, ...data } }
              : node,
          );
          syncNodes(next);
          window.setTimeout(() => compileGraph(), 350);
        }}
      />
    </div>
  );
}

export function QueryGraphCanvas() {
  return (
    <ReactFlowProvider>
      <QueryGraphCanvasInner />
    </ReactFlowProvider>
  );
}
