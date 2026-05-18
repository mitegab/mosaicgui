import { describe, expect, it } from 'vitest';
import { dslToGraph } from './dslToGraph';
import type { QueryDsl } from '../types/query';

describe('dslToGraph', () => {
  it('generates model, filter, output nodes and execution edges', () => {
    const dsl: QueryDsl = {
      model: 'Book',
      filters: [{ field: 'title', operator: 'icontains', value: 'django' }],
      relations: [],
      output: ['id', 'title'],
      limit: 10,
    };
    const graph = dslToGraph(dsl);
    expect(graph.nodes.map((node) => node.data.kind)).toEqual(['model', 'filter', 'output']);
    expect(graph.edges).toHaveLength(2);
  });
});
