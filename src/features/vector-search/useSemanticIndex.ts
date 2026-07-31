import { useMemo } from 'react';
import { useSchemaStore } from '../../store/schemaStore';
import type { SchemaModel } from '../../types/schema';
import { cosineSimilarity, embedSchemaModel, embedText } from './embeddings';

export interface SemanticIndexEntry {
  model: SchemaModel;
  vector: Float32Array;
}

export interface SemanticSearchResult {
  model: SchemaModel;
  similarity: number;
}

/**
 * Builds (and memoizes) a local embedding for every model currently in the
 * schema store. Recomputed only when the model list changes.
 */
export function useSemanticIndex(): SemanticIndexEntry[] {
  const models = useSchemaStore((state) => state.models);

  return useMemo(
    () => models.map((model) => ({ model, vector: embedSchemaModel(model) })),
    [models],
  );
}

/**
 * Embeds a natural-language `query` and ranks indexed schema models by
 * cosine similarity, returning the top `topK` matches sorted descending.
 */
export function semanticSearch(
  query: string,
  index: SemanticIndexEntry[],
  topK = 5,
): SemanticSearchResult[] {
  const trimmed = query.trim();
  if (!trimmed) return [];

  const queryVector = embedText(trimmed);

  return index
    .map(({ model, vector }) => ({ model, similarity: cosineSimilarity(queryVector, vector) }))
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, topK);
}
