import type { SchemaModel } from '../../types/schema';
import type { QueryHistoryEntry } from '../../types/execution';

export interface LineageNode {
  id: string;
  type: 'model' | 'query';
  label: string;
}

export interface LineageEdge {
  source: string;
  target: string;
  label?: string;
}

export interface LineageGraph {
  nodes: LineageNode[];
  edges: LineageEdge[];
}

function modelNodeId(modelName: string): string {
  return `model:${modelName}`;
}

function queryNodeId(entryId: string): string {
  return `query:${entryId}`;
}

/**
 * Builds a lineage graph purely from the schema: one node per model, and one
 * edge per relation field describing how models are connected.
 */
export function buildSchemaLineage(models: SchemaModel[]): LineageGraph {
  const nodes: LineageNode[] = models.map((model) => ({
    id: modelNodeId(model.name),
    type: 'model',
    label: model.name,
  }));

  const knownModelNames = new Set(models.map((model) => model.name));
  const edges: LineageEdge[] = [];

  for (const model of models) {
    for (const field of model.fields) {
      if (field.kind !== 'relation' || !field.relatedModel) continue;
      if (!knownModelNames.has(field.relatedModel)) continue;
      edges.push({
        source: modelNodeId(model.name),
        target: modelNodeId(field.relatedModel),
        label: field.relationType,
      });
    }
  }

  return { nodes, edges };
}

/**
 * Combines schema lineage with query lineage: every unique model queried in
 * recent history becomes a query node connected to the model(s) it reads
 * (its own model, plus any related models it joins through relations).
 */
export function buildQueryLineage(history: QueryHistoryEntry[], models: SchemaModel[]): LineageGraph {
  const schemaGraph = buildSchemaLineage(models);
  const modelByName = new Map(models.map((model) => [model.name, model]));

  const recentEntries = history.slice(0, 10);
  const queryNodes: LineageNode[] = [];
  const queryEdges: LineageEdge[] = [];

  for (const entry of recentEntries) {
    if (!entry.dsl.model) continue;
    const qNodeId = queryNodeId(entry.id);
    queryNodes.push({ id: qNodeId, type: 'query', label: entry.name || entry.dsl.model });

    const touchedModels = new Set<string>([entry.dsl.model]);
    for (const relation of entry.dsl.relations) {
      touchedModels.add(relation.to);
    }
    const owningModel = modelByName.get(entry.dsl.model);
    if (owningModel) {
      for (const field of owningModel.fields) {
        if (field.kind === 'relation' && field.relatedModel) {
          touchedModels.add(field.relatedModel);
        }
      }
    }

    for (const modelName of touchedModels) {
      if (!modelByName.has(modelName)) continue;
      queryEdges.push({ source: qNodeId, target: modelNodeId(modelName) });
    }
  }

  return {
    nodes: [...schemaGraph.nodes, ...queryNodes],
    edges: [...schemaGraph.edges, ...queryEdges],
  };
}
