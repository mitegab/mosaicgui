import type { Edge, Node } from '@xyflow/react';

export type QueryNodeKind = 'model' | 'filter' | 'condition' | 'logic' | 'output' | 'group' | 'subquery';
export type ConditionOperator = 'exact' | 'contains' | 'icontains' | 'gt' | 'gte' | 'lt' | 'lte' | 'in' | 'isnull';
export type LogicOperator = 'AND' | 'OR';

export interface NodeValidationIssue {
  nodeId: string;
  message: string;
  severity: 'error' | 'warning';
}

export interface QueryNodeData extends Record<string, unknown> {
  label: string;
  kind: QueryNodeKind;
  model?: string;
  field?: string;
  operator?: ConditionOperator;
  value?: unknown;
  logic?: LogicOperator;
  fields?: string[];
  collapsed?: boolean;
  reusable?: boolean;
  errors?: NodeValidationIssue[];
}

export type QueryGraphNode = Node<QueryNodeData>;
export type QueryGraphEdge = Edge;

export interface QueryFilter {
  field: string;
  operator: ConditionOperator;
  value: unknown;
  logic?: LogicOperator;
}

export interface QueryRelation {
  from: string;
  to: string;
  field: string;
}

export interface QueryDsl {
  model: string;
  filters: QueryFilter[];
  relations: QueryRelation[];
  output: string[];
  limit: number;
  offset?: number;
  orderBy?: string[];
  groups?: QueryDsl[];
}

export interface QueryVersion {
  id: string;
  name: string;
  createdAt: string;
  graph: {
    nodes: QueryGraphNode[];
    edges: QueryGraphEdge[];
  };
  dsl: QueryDsl;
  bookmarked?: boolean;
}
