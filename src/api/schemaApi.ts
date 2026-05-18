import { z } from 'zod';
import { apiGet } from './http';
import type { FieldKind, SchemaModel } from '../types/schema';

const rawFieldSchema = z
  .object({
    name: z.string(),
    type: z.string().optional(),
    kind: z.string().optional(),
    nullable: z.boolean().optional(),
    null: z.boolean().optional(),
    unique: z.boolean().optional(),
    primaryKey: z.boolean().optional(),
    primary_key: z.boolean().optional(),
    indexed: z.boolean().optional(),
    db_index: z.boolean().optional(),
    relatedModel: z.string().optional(),
    related_model: z.string().optional(),
    relationType: z.string().optional(),
    relation_type: z.string().optional(),
    constraints: z.array(z.string()).optional(),
    sampleValues: z.array(z.unknown()).optional(),
    sample_values: z.array(z.unknown()).optional(),
    description: z.string().optional(),
  })
  .passthrough();

const rawModelSchema = z
  .object({
    name: z.string(),
    appLabel: z.string().optional(),
    app_label: z.string().optional(),
    tableName: z.string().optional(),
    table_name: z.string().optional(),
    description: z.string().optional(),
    rowEstimate: z.number().optional(),
    row_estimate: z.number().optional(),
    fields: z.array(rawFieldSchema).default([]),
  })
  .passthrough();

const modelsResponseSchema = z.union([
  z.array(rawModelSchema),
  z.object({ models: z.array(rawModelSchema) }),
  z.object({ results: z.array(rawModelSchema) }),
]);

export async function fetchModels(signal?: AbortSignal): Promise<SchemaModel[]> {
  const raw = await apiGet<unknown>('/api/models/', signal);
  const parsed = modelsResponseSchema.parse(raw);
  const models = Array.isArray(parsed) ? parsed : 'models' in parsed ? parsed.models : parsed.results;
  return models.map((model) => ({
    name: model.name,
    appLabel: model.appLabel ?? model.app_label,
    tableName: model.tableName ?? model.table_name,
    description: model.description,
    rowEstimate: model.rowEstimate ?? model.row_estimate,
    fields: model.fields.map((field) => ({
      name: field.name,
      type: field.type ?? 'unknown',
      kind: normalizeFieldKind(field.kind ?? field.type),
      nullable: field.nullable ?? field.null,
      unique: field.unique,
      primaryKey: field.primaryKey ?? field.primary_key,
      indexed: field.indexed ?? field.db_index,
      relatedModel: field.relatedModel ?? field.related_model,
      relationType: normalizeRelationType(field.relationType ?? field.relation_type),
      constraints: field.constraints,
      sampleValues: field.sampleValues ?? field.sample_values,
      description: field.description,
    })),
  }));
}

function normalizeFieldKind(value?: string): FieldKind {
  const lower = value?.toLowerCase() ?? '';
  if (lower.includes('char') || lower.includes('text') || lower.includes('uuid') || lower.includes('email')) return 'string';
  if (lower.includes('int') || lower.includes('decimal') || lower.includes('float') || lower.includes('number')) return 'number';
  if (lower.includes('bool')) return 'boolean';
  if (lower.includes('datetime')) return 'datetime';
  if (lower.includes('date')) return 'date';
  if (lower.includes('json')) return 'json';
  if (lower.includes('foreign') || lower.includes('many') || lower.includes('relation')) return 'relation';
  return 'unknown';
}

function normalizeRelationType(value?: string): SchemaModel['fields'][number]['relationType'] {
  if (value === 'one-to-one' || value === 'one-to-many' || value === 'many-to-one' || value === 'many-to-many') return value;
  return undefined;
}
