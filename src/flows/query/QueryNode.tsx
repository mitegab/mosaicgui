import { memo } from "react";
import { Handle, NodeProps, Position } from "@xyflow/react";
import { motion } from "framer-motion";
import {
  AlertTriangle,
  Braces,
  Clipboard,
  Database,
  Filter,
  GitBranch,
  Layers,
  Repeat,
  SquareStack,
} from "lucide-react";
import type {
  QueryGraphNode,
  QueryNodeData,
  QueryNodeKind,
} from "../../types/query";
import { useSemanticZoom } from "../../features/canvas/useSemanticZoom";
import { cn } from "../../utils/cn";

const iconByKind: Record<QueryNodeKind, typeof Database> = {
  model: Database,
  filter: Filter,
  condition: GitBranch,
  logic: Braces,
  output: SquareStack,
  group: Layers,
  subquery: Repeat,
};

const colorByKind: Record<QueryNodeKind, string> = {
  model: "border-cyan-400/40 bg-cyan-500/10 text-cyan-200",
  filter: "border-violet-400/40 bg-violet-500/10 text-violet-200",
  condition: "border-amber-400/40 bg-amber-500/10 text-amber-200",
  logic: "border-emerald-400/40 bg-emerald-500/10 text-emerald-200",
  output: "border-sky-400/40 bg-sky-500/10 text-sky-200",
  group: "border-slate-400/40 bg-slate-500/10 text-slate-200",
  subquery: "border-pink-400/40 bg-pink-500/10 text-pink-200",
};

function copyNodeAsSnippet(data: QueryNodeData) {
  const snippet = JSON.stringify(
    { __mosaicNodeSnippet: true, ...data },
    null,
    2,
  );
  navigator.clipboard.writeText(snippet).catch(() => undefined);
}

function QueryNodeComponent({ data, selected }: NodeProps<QueryGraphNode>) {
  const zoomLevel = useSemanticZoom();
  const Icon = iconByKind[data.kind];
  const hasError = data.errors?.some((issue) => issue.severity === "error");
  const hasWarning = data.errors?.some((issue) => issue.severity === "warning");
  const isOverview = zoomLevel === "overview";

  return (
    <motion.div
      data-tour={`node-${data.kind}`}
      className={cn(
        "group rounded-xl border bg-surface-900 shadow-2xl",
        isOverview ? "min-w-36 max-w-44" : "min-w-52",
        colorByKind[data.kind],
        selected && "ring-2 ring-accent-300",
        hasError && "border-rose-400 ring-2 ring-rose-500/30",
      )}
      initial={{ opacity: 0, scale: 0.88 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ scale: 1.025 }}
      transition={{ type: "spring", stiffness: 380, damping: 26 }}
    >
      <Handle
        type="target"
        position={Position.Left}
        className="!border-surface-950 !bg-accent-300"
      />

      {/* Header */}
      <div
        className={cn(
          "flex items-center gap-2 border-b border-white/10 px-3 py-2",
          isOverview && "border-b-0 py-1.5",
        )}
      >
        <Icon className={cn("h-4 w-4 shrink-0", isOverview && "h-3.5 w-3.5")} />
        <div className="min-w-0 flex-1">
          <div
            className={cn(
              "node-header-label truncate text-sm font-semibold",
              isOverview && "text-xs",
            )}
          >
            {data.label}
          </div>
          {!isOverview && (
            <div className="text-[10px] uppercase tracking-wide opacity-70">
              {data.kind}
            </div>
          )}
        </div>

        {/* Ghost hover: copy snippet button */}
        {!isOverview && (
          <button
            className="nodrag nopan opacity-0 group-hover:opacity-100 rounded p-0.5 text-slate-400 transition hover:text-accent-300"
            onClick={() => copyNodeAsSnippet(data)}
            title="Copy node as DSL snippet"
          >
            <Clipboard className="h-3 w-3" />
          </button>
        )}

        {!isOverview && (hasError || hasWarning) && (
          <AlertTriangle
            className={cn(
              "h-4 w-4",
              hasError ? "text-rose-300" : "text-amber-300",
            )}
          />
        )}
      </div>

      {/* Detail body — hidden in overview zoom level */}
      {!data.collapsed && !isOverview && (
        <div className="node-detail-content space-y-1 px-3 py-2 text-xs text-slate-300">
          {data.model && (
            <div>
              Model: <span className="text-cyan-300">{data.model}</span>
            </div>
          )}
          {data.field && (
            <div>
              Field: <span className="text-violet-300">{data.field}</span>
            </div>
          )}
          {data.operator && (
            <div>
              Op: <span className="text-amber-300">{data.operator}</span>
            </div>
          )}
          {data.value !== undefined && data.value !== "" && (
            <div>
              Value:{" "}
              <span className="text-emerald-300">{String(data.value)}</span>
            </div>
          )}
          {data.logic && (
            <div>
              Logic: <span className="text-emerald-300">{data.logic}</span>
            </div>
          )}
          {data.fields && data.fields.length > 0 && (
            <div>
              Output:{" "}
              <span className="text-sky-300">{data.fields.join(", ")}</span>
            </div>
          )}
          {data.errors?.map((issue) => (
            <div
              key={`${issue.nodeId}-${issue.message}`}
              className={cn(
                issue.severity === "error" ? "text-rose-300" : "text-amber-300",
              )}
            >
              {issue.message}
            </div>
          ))}
        </div>
      )}

      <Handle
        type="source"
        position={Position.Right}
        className="!border-surface-950 !bg-accent-300"
      />
    </motion.div>
  );
}

export const QueryNode = memo(QueryNodeComponent);
