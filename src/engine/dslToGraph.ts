import type { QueryDsl, QueryGraphEdge, QueryGraphNode } from '../types/query';

export function dslToGraph(dsl: QueryDsl): { nodes: QueryGraphNode[]; edges: QueryGraphEdge[] } {
  const nodes: QueryGraphNode[] = [
    {
      id: 'model-1',
      type: 'queryNode',
      position: { x: 80, y: 140 },
      data: { label: dsl.model, kind: 'model', model: dsl.model },
    },
    ...dsl.filters.map<QueryGraphNode>((filter, index) => ({
      id: `filter-${index + 1}`,
      type: 'queryNode',
      position: { x: 340 + index * 240, y: 140 },
      data: {
        label: `${filter.field} ${filter.operator}`,
        kind: 'filter',
        field: filter.field,
        operator: filter.operator,
        value: filter.value,
        logic: filter.logic,
      },
    })),
    {
      id: 'output-1',
      type: 'queryNode',
      position: { x: 620 + dsl.filters.length * 240, y: 140 },
      data: { label: 'Output', kind: 'output', fields: dsl.output },
    },
  ];

  const orderedNodeIds = nodes.map((node) => node.id);
  const edges = orderedNodeIds.slice(0, -1).map<QueryGraphEdge>((source, index) => ({
    id: `${source}-${orderedNodeIds[index + 1]}`,
    source,
    target: orderedNodeIds[index + 1],
    animated: true,
  }));

  return { nodes, edges };
}
