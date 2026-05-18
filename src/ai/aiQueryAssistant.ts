import type { AiQueryRequest, AiQueryResponse } from '../types/ai';
import type { QueryDsl } from '../types/query';

export async function generateAiQuery(request: AiQueryRequest): Promise<AiQueryResponse> {
  const prompt = request.prompt.toLowerCase();
  const current = request.currentDsl;

  if (request.mode === 'suggest-indexes') {
    return {
      explanation: 'Suggested indexes are based on filtered and ordered fields. Confirm with production query plans before applying migrations.',
      suggestedIndexes: current?.filters.map((filter) => `${current.model}.${filter.field}`) ?? [],
    };
  }

  if (request.mode === 'optimize' && current) {
    return {
      dsl: { ...current, limit: Math.min(current.limit, 100), output: current.output.length ? current.output : ['id'] },
      explanation: 'Reduced limit and encouraged explicit projection to lower database and network cost.',
    };
  }

  if (request.mode === 'fix' && current) {
    return {
      dsl: { ...current, model: current.model || inferModel(prompt), limit: current.limit || 10 },
      explanation: 'Filled missing model and sane limit defaults. Backend validation should confirm field names.',
    };
  }

  const dsl: QueryDsl = {
    model: inferModel(prompt),
    filters: inferFilters(prompt),
    relations: [],
    output: ['id', 'title'],
    limit: 10,
  };

  return {
    dsl,
    explanation: 'Generated a DSL draft from natural language. Review field names against the schema browser before execution.',
    warnings: ['AI output is a draft and must pass `/api/validate-query/` before production use.'],
  };
}

function inferModel(prompt: string) {
  if (prompt.includes('user')) return 'User';
  if (prompt.includes('author')) return 'Author';
  if (prompt.includes('tag')) return 'Tag';
  return 'Book';
}

function inferFilters(prompt: string): QueryDsl['filters'] {
  const filters: QueryDsl['filters'] = [];
  if (prompt.includes('django')) filters.push({ field: 'title', operator: 'icontains', value: 'django', logic: 'AND' });
  const year = prompt.match(/after (\d{4})/)?.[1];
  if (year) filters.push({ field: 'published_at', operator: 'gt', value: `${year}-01-01`, logic: 'AND' });
  return filters;
}
