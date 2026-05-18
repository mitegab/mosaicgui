export type FieldKind = 'string' | 'number' | 'boolean' | 'date' | 'datetime' | 'json' | 'relation' | 'unknown';

export interface SchemaField {
  name: string;
  type: string;
  kind: FieldKind;
  nullable?: boolean;
  unique?: boolean;
  primaryKey?: boolean;
  indexed?: boolean;
  relatedModel?: string;
  relationType?: 'one-to-one' | 'one-to-many' | 'many-to-one' | 'many-to-many';
  constraints?: string[];
  sampleValues?: unknown[];
  description?: string;
}

export interface SchemaModel {
  name: string;
  appLabel?: string;
  tableName?: string;
  description?: string;
  rowEstimate?: number;
  fields: SchemaField[];
}

export interface SchemaDiff {
  addedModels: string[];
  removedModels: string[];
  changedModels: Array<{
    model: string;
    addedFields: string[];
    removedFields: string[];
    changedFields: string[];
  }>;
}
