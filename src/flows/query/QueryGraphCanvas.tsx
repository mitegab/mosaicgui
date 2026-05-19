import { DragEvent, useCallback, useMemo } from 'react';
import { addEdge, Background, Controls, MiniMap, ReactFlow, useEdgesState, useNodesState, type Connection, type NodeTypes, ReactFlowProvider, useReactFlow } from '@xyflow/react';
import { Button } from '../../components/ui/Button';
import { useQueryStore } from '../../store/queryStore';
import type { QueryGraphNode, QueryNodeKind } from '../../types/query';
import { autoLayout, createQueryNode } from './nodeFactory';
import { QueryNode } from './QueryNode';
import { NodeInspector } from './NodeInspector';
import { CanvasBookmarkBar } from '../../features/canvas/CanvasBookmarks';

const nodeTypes: NodeTypes = { queryNode: QueryNode };
const palette: QueryNodeKind[] = ['model', 'filter', 'condition', 'logic', 'output', 'group', 'subquery'];

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

  const { getViewport, setViewport } = useReactFlow();

  const handleJump = useCallback((bookmark: any) => {
    setViewport({ x: bookmark.x, y: bookmark.y, zoom: bookmark.zoom }, { duration: 800 });
  }, [setViewport]);

  const handleGetViewport = useCallback(() => {
    return getViewport();
  }, [getViewport]);

  const selectedNode = useMemo(() => nodes.find((node) => node.id === selectedNodeId), [nodes, selectedNodeId]);

  const syncNodes = useCallback(
    (next: QueryGraphNode[]) => {
      setNodes(next);
      setStoreNodes(next);
    },
    [setNodes, setStoreNodes],
  );

  const onConnect = useCallback(
    (connection: Connection) => {
      const nextEdges = addEdge({ ...connection, animated: true }, edges);
      setEdges(nextEdges);
      setStoreEdges(nextEdges);
      window.setTimeout(() => compileGraph(), 350);
    },
    [compileGraph, edges, setEdges, setStoreEdges],
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
      const kind = event.dataTransfer.getData('application/mosaic-node') as QueryNodeKind;
      if (!kind) return;
      addNode(kind);
    },
    [addNode],
  );

  return (
    <div className="grid h-full grid-cols-[minmax(0,1fr)_300px] gap-3">
      <div className="relative min-h-0 overflow-hidden rounded-xl border border-white/10 bg-surface-950">
        <div className="absolute left-3 top-3 z-10 flex flex-wrap gap-2 rounded-xl border border-white/10 bg-surface-900/90 p-2 backdrop-blur">
          {palette.map((kind) => (
            <button
              key={kind}
              draggable
              onDragStart={(event) => event.dataTransfer.setData('application/mosaic-node', kind)}
              onClick={() => addNode(kind)}
              className="rounded-lg border border-white/10 bg-surface-800 px-2 py-1 text-xs capitalize text-slate-200 hover:bg-surface-700"
            >
              + {kind}
            </button>
          ))}
          <Button variant="ghost" className="px-2 py-1 text-xs" onClick={() => syncNodes(autoLayout(nodes))}>
            Auto-layout
          </Button>
          <Button variant="ghost" className="px-2 py-1 text-xs" onClick={() => compileGraph()}>
            Validate
          </Button>
        </div>

        <div className="absolute right-3 top-3 z-10">
          <CanvasBookmarkBar onJump={handleJump} getCurrentViewport={handleGetViewport} />
        </div>

        <ReactFlow
          nodes={nodes}
          edges={edges}
          nodeTypes={nodeTypes}
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
          fitView
        >
          <MiniMap pannable zoomable />
          <Controls />
          <Background />
        </ReactFlow>
      </div>
      <NodeInspector
        node={selectedNode}
        onChange={(nodeId, data) => {
          updateNodeData(nodeId, data);
          const next = nodes.map((node) => (node.id === nodeId ? { ...node, data: { ...node.data, ...data } } : node));
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
