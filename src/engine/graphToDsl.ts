import type {
  NodeValidationIssue,
  QueryDsl,
  QueryGraphEdge,
  QueryGraphNode,
} from "../types/query";
import { validateDsl } from "./dslSchema";

export interface CompilationResult {
  dsl: QueryDsl;
  nodes: QueryGraphNode[];
  issues: NodeValidationIssue[];
}

export function graphToDsl(
  nodes: QueryGraphNode[],
  edges: QueryGraphEdge[],
): CompilationResult {
  const issues: NodeValidationIssue[] = [];
  const modelNode = nodes.find((node) => node.data.kind === "model");
  const outputNode = nodes.find((node) => node.data.kind === "output");
  const filters = nodes
    .filter(
      (node) => node.data.kind === "filter" || node.data.kind === "condition",
    )
    .map((node) => ({
      field: String(node.data.field ?? ""),
      operator: node.data.operator ?? "exact",
      value: node.data.value ?? "",
      logic: node.data.logic,
    }))
    .filter((filter) => filter.field.length > 0);

  if (!modelNode?.data.model) {
    issues.push({
      nodeId: modelNode?.id ?? "graph",
      message: "A model node must select a model before execution.",
      severity: "error",
    });
  }

  nodes.forEach((node) => {
    if (
      (node.data.kind === "filter" || node.data.kind === "condition") &&
      !node.data.field
    ) {
      issues.push({
        nodeId: node.id,
        message: "Filter nodes require a field.",
        severity: "error",
      });
    }
  });

  const connectedNodeIds = new Set(
    edges.flatMap((edge) => [edge.source, edge.target]),
  );
  nodes.forEach((node) => {
    if (!connectedNodeIds.has(node.id)) {
      issues.push({
        nodeId: node.id,
        message: "Node is not connected to the query execution flow.",
        severity: "warning",
      });
    }
  });

  const nodesWithErrors = nodes.map((node) => ({
    ...node,
    data: {
      ...node.data,
      errors: issues.filter((issue) => issue.nodeId === node.id),
    },
  }));

  const dsl: QueryDsl = {
    model: String(modelNode?.data.model ?? ""),
    filters,
    relations: [],
    output: outputNode?.data.fields ?? [],
    limit: 10,
  };

  const validation = validateDsl(dsl);
  if (!validation.success) {
    validation.error.issues.forEach((issue) => {
      issues.push({
        nodeId: modelNode?.id ?? "graph",
        message: issue.message,
        severity: "error",
      });
    });
  }

  const validatedNodes = nodesWithErrors.map((node) => ({
    ...node,
    data: {
      ...node.data,
      errors: issues.filter((issue) => issue.nodeId === node.id),
    },
  }));

  return {
    dsl,
    nodes: validatedNodes,
    issues,
  };
}
