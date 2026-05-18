import { describe, expect, it } from 'vitest';
import { graphToDsl } from './graphToDsl';
import type { QueryGraphEdge, QueryGraphNode } from '../types/query';

const nodes: QueryGraphNode[] = [
  { id: 'model-1', type: 'queryNode', position: { x: 0, y: 0 }, data: { label: 'Book', kind: 'model', model: 'Book' } },
  { id: 'filter-1', type: 'queryNode', position: { x: 0, y: 0 }, data: { label: 'Title contains django', kind: 'filter', field: 'title', operator: 'icontains', value: 'django' } },
  { id: 'output-1', type: 'queryNode', position: { x: 0, y: 0 }, data: { label: 'Output', kind: 'output', fields: ['id', 'title'] } },
];

const edges: QueryGraphEdge[] = [
  { id: 'model-filter', source: 'model-1', target: 'filter-1' },
  { id: 'filter-output', source: 'filter-1', target: 'output-1' },
];

describe('graphToDsl', () => {
  it('compiles a connected query graph into JSON DSL', () => {
    const result = graphToDsl(nodes, edges);
    expect(result.dsl).toEqual({
      model: 'Book',
      filters: [{ field: 'title', operator: 'icontains', value: 'django', logic: undefined }],
      relations: [],
      output: ['id', 'title'],
      limit: 10,
    });
    expect(result.issues).toHaveLength(0);
  });

  it('prevents invalid query execution when model is missing', () => {
    const result = graphToDsl([{ ...nodes[0], data: { ...nodes[0].data, model: '' } }], []);
    expect(result.issues.some((issue) => issue.severity === 'error')).toBe(true);
  });
});
