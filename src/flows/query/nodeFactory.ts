import type { QueryGraphNode, QueryNodeKind } from '../../types/query';

const labels: Record<QueryNodeKind, string> = {
  model: 'Model',
  filter: 'Filter',
  condition: 'Condition',
  logic: 'AND / OR',
  output: 'Output',
  group: 'Query Group',
  subquery: 'Subquery',
};

export function createQueryNode(kind: QueryNodeKind, index: number): QueryGraphNode {
  const id = `${kind}-${Date.now()}-${index}`;
  return {
    id,
    type: 'queryNode',
    position: { x: 120 + index * 80, y: 120 + index * 48 },
    data: {
      label: labels[kind],
      kind,
      ...(kind === 'logic' ? { logic: 'AND' as const } : {}),
      ...(kind === 'filter' || kind === 'condition' ? { operator: 'icontains' as const, field: '', value: '' } : {}),
      ...(kind === 'output' ? { fields: [] } : {}),
    },
  };
}

export function autoLayout(nodes: QueryGraphNode[]): QueryGraphNode[] {
  return nodes.map((node, index) => ({
    ...node,
    position: {
      x: 80 + (index % 4) * 260,
      y: 100 + Math.floor(index / 4) * 180,
    },
  }));
}
