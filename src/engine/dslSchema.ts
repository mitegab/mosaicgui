import { z } from 'zod';
import type { QueryDsl } from '../types/query';

export const queryDslSchema = z.object({
  model: z.string().min(1, 'Model is required'),
  filters: z.array(
    z.object({
      field: z.string().min(1, 'Filter field is required'),
      operator: z.enum(['exact', 'contains', 'icontains', 'gt', 'gte', 'lt', 'lte', 'in', 'isnull']),
      value: z.unknown(),
      logic: z.enum(['AND', 'OR']).optional(),
    }),
  ),
  relations: z.array(
    z.object({
      from: z.string(),
      to: z.string(),
      field: z.string(),
    }),
  ),
  output: z.array(z.string()),
  limit: z.number().int().min(1).max(10_000),
  offset: z.number().int().min(0).optional(),
  orderBy: z.array(z.string()).optional(),
  groups: z.array(z.lazy(() => queryDslSchema)).optional(),
}) as z.ZodType<QueryDsl>;

export type QueryDslValidation = ReturnType<typeof queryDslSchema.safeParse>;

export function validateDsl(value: unknown) {
  return queryDslSchema.safeParse(value);
}
