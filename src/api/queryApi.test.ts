import { describe, expect, it, vi } from 'vitest';
import { executeQuery } from './queryApi';

describe('executeQuery', () => {
  it('normalizes backend result shapes into rows and metrics', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify({ results: [{ id: 1 }] }), { status: 200 })));
    const response = await executeQuery({ model: 'Book', filters: [], relations: [], output: ['id'], limit: 10 });
    expect(response.rows).toEqual([{ id: 1 }]);
    expect(response.metrics.rowsReturned).toBe(1);
  });
});
