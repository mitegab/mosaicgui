import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  ChevronRight,
  Database,
  GitCompare,
  Loader2,
  Pin,
  Search,
  Star,
} from "lucide-react";
import { Panel } from "../../components/ui/Panel";
import { Button } from "../../components/ui/Button";
import { fetchModels } from "../../api/schemaApi";
import { mockSchemaModels } from "../../api/mockSchema";
import { useSchemaStore } from "../../store/schemaStore";
import type { SchemaField, SchemaModel } from "../../types/schema";
import { cn } from "../../utils/cn";

export function SchemaBrowser() {
  const [search, setSearch] = useState("");
  const [showDiff, setShowDiff] = useState(false);
  const {
    models,
    selectedModel,
    selectedField,
    favorites,
    pinnedModels,
    setModels,
    selectModel,
    selectField,
    toggleFavorite,
    togglePinnedModel,
  } = useSchemaStore();

  const modelsQuery = useQuery({
    queryKey: ["schema-models"],
    queryFn: ({ signal }) => fetchModels(signal),
  });

  useEffect(() => {
    if (modelsQuery.data) {
      setModels(modelsQuery.data);
    }
  }, [modelsQuery.data, setModels]);

  useEffect(() => {
    if (models.length === 0 && modelsQuery.isError) {
      setModels(mockSchemaModels);
    }
  }, [models.length, modelsQuery.isError, setModels]);

  const visibleModels = useMemo(() => {
    const query = search.toLowerCase().trim();
    const source = models.length > 0 ? models : mockSchemaModels;
    return source
      .filter(
        (model) =>
          model.name.toLowerCase().includes(query) ||
          model.fields.some((field) =>
            field.name.toLowerCase().includes(query),
          ),
      )
      .sort(
        (a, b) =>
          Number(pinnedModels.includes(b.name)) -
            Number(pinnedModels.includes(a.name)) ||
          a.name.localeCompare(b.name),
      );
  }, [models, pinnedModels, search]);

  const activeModel =
    visibleModels.find((model) => model.name === selectedModel) ??
    visibleModels[0];
  const activeField = selectedField ?? activeModel?.fields[0];

  useEffect(() => {
    if (!selectedModel && activeModel) selectModel(activeModel.name);
  }, [activeModel, selectModel, selectedModel]);

  return (
    <Panel
      title="Schema Browser"
      action={
        modelsQuery.isLoading ? (
          <Loader2 className="h-4 w-4 animate-spin text-accent-300" />
        ) : null
      }
      bodyClassName="grid h-full grid-rows-[auto_minmax(0,1fr)]"
      className="h-full"
    >
      <div className="space-y-3 border-b border-white/10 p-4">
        <label className="flex items-center gap-2 rounded-lg border border-white/10 bg-surface-950 px-3 py-2 text-sm text-slate-400">
          <Search className="h-4 w-4" />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="w-full bg-transparent text-slate-100 outline-none"
            placeholder="Search models and fields"
          />
        </label>
        <div className="flex gap-2">
          <Button
            variant="ghost"
            className="flex-1"
            onClick={() => setShowDiff((value) => !value)}
          >
            <GitCompare className="h-4 w-4" /> Schema Diff
          </Button>
          <Button
            variant="ghost"
            className="flex-1"
            onClick={() => activeModel && togglePinnedModel(activeModel.name)}
          >
            <Pin className="h-4 w-4" /> Pin
          </Button>
        </div>
      </div>

      <div className="grid min-h-0 grid-cols-[1fr_1fr]">
        <div className="min-h-0 overflow-auto border-r border-white/10 p-3">
          {visibleModels.map((model) => (
            <ModelTreeItem
              key={model.name}
              model={model}
              activeModel={activeModel?.name}
              selectedField={activeField?.name}
              favorite={favorites.includes(model.name)}
              pinned={pinnedModels.includes(model.name)}
              onSelectModel={() => selectModel(model.name)}
              onSelectField={(field) => {
                selectModel(model.name);
                selectField(field);
              }}
              onFavorite={() => toggleFavorite(model.name)}
            />
          ))}
        </div>

        <div className="min-h-0 overflow-auto p-4">
          {showDiff ? (
            <SchemaDiffPreview models={visibleModels} />
          ) : (
            <FieldInspector model={activeModel} field={activeField} />
          )}
        </div>
      </div>
    </Panel>
  );
}

function ModelTreeItem({
  model,
  activeModel,
  selectedField,
  favorite,
  pinned,
  onSelectModel,
  onSelectField,
  onFavorite,
}: {
  model: SchemaModel;
  activeModel?: string;
  selectedField?: string;
  favorite: boolean;
  pinned: boolean;
  onSelectModel: () => void;
  onSelectField: (field: SchemaField) => void;
  onFavorite: () => void;
}) {
  const expanded = activeModel === model.name;
  return (
    <div className="mb-2 rounded-lg border border-white/10 bg-surface-950/60">
      <button
        className="flex w-full items-center gap-2 px-3 py-2 text-left"
        onClick={onSelectModel}
      >
        <ChevronRight
          className={cn("h-4 w-4 transition", expanded && "rotate-90")}
        />
        <Database className="h-4 w-4 text-accent-300" />
        <span className="min-w-0 flex-1 truncate text-sm font-medium">
          {model.name}
        </span>
        {pinned && <Pin className="h-3 w-3 text-accent-300" />}
        <button
          aria-label={`favorite ${model.name}`}
          onClick={(event) => {
            event.stopPropagation();
            onFavorite();
          }}
          className={cn(
            "rounded p-1 text-slate-500 hover:text-amber-300",
            favorite && "text-amber-300",
          )}
        >
          <Star className="h-3 w-3" />
        </button>
      </button>
      {expanded && (
        <div className="space-y-1 px-2 pb-2">
          {model.fields.map((field) => (
            <button
              key={field.name}
              onClick={() => onSelectField(field)}
              className={cn(
                "flex w-full items-center justify-between rounded-md px-3 py-1.5 text-left text-xs text-slate-400 hover:bg-white/10",
                selectedField === field.name &&
                  "bg-accent-500/20 text-accent-300",
              )}
            >
              <span>{field.name}</span>
              <span>{field.type}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function FieldInspector({
  model,
  field,
}: {
  model?: SchemaModel;
  field?: SchemaField;
}) {
  if (!model || !field)
    return (
      <div className="text-sm text-slate-500">
        Select a field to inspect metadata.
      </div>
    );

  return (
    <div className="space-y-4">
      <div>
        <p className="text-xs uppercase tracking-wide text-slate-500">
          {model.tableName ?? model.name}
        </p>
        <h3 className="text-lg font-semibold text-white">{field.name}</h3>
        <p className="text-sm text-slate-400">
          {field.description ?? `${field.type} · ${field.kind}`}
        </p>
      </div>
      <dl className="grid grid-cols-2 gap-2 text-xs">
        {[
          ["Type", field.type],
          ["Nullable", String(Boolean(field.nullable))],
          ["Unique", String(Boolean(field.unique))],
          ["Indexed", String(Boolean(field.indexed))],
          ["Primary Key", String(Boolean(field.primaryKey))],
          ["Related Model", field.relatedModel ?? "—"],
        ].map(([label, value]) => (
          <div
            key={label}
            className="rounded-lg border border-white/10 bg-surface-950 p-3"
          >
            <dt className="text-slate-500">{label}</dt>
            <dd className="mt-1 font-medium text-slate-200">{value}</dd>
          </div>
        ))}
      </dl>
      <div className="rounded-lg border border-white/10 bg-surface-950 p-3">
        <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
          Relationship Preview
        </h4>
        {field.relatedModel ? (
          <div className="flex items-center gap-2 text-sm">
            <span className="rounded bg-accent-500/20 px-2 py-1 text-accent-300">
              {model.name}
            </span>
            <span className="text-slate-500">
              {field.relationType ?? "relates to"}
            </span>
            <span className="rounded bg-cyan-500/20 px-2 py-1 text-cyan-300">
              {field.relatedModel}
            </span>
          </div>
        ) : (
          <p className="text-sm text-slate-500">
            No relationship metadata for this field.
          </p>
        )}
      </div>
      <div className="rounded-lg border border-white/10 bg-surface-950 p-3">
        <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
          Sample Values
        </h4>
        <div className="flex flex-wrap gap-2">
          {(field.sampleValues ?? ["No samples available"]).map(
            (value, index) => (
              <span
                key={`${field.name}-${index}`}
                className="rounded bg-white/10 px-2 py-1 text-xs text-slate-300"
              >
                {String(value)}
              </span>
            ),
          )}
        </div>
      </div>
    </div>
  );
}

function SchemaDiffPreview({ models }: { models: SchemaModel[] }) {
  return (
    <div className="space-y-3">
      <h3 className="text-lg font-semibold text-white">Schema Diff Viewer</h3>
      <p className="text-sm text-slate-400">
        Future-ready comparison surface for DB evolution. Current schema
        snapshot:
      </p>
      {models.map((model) => (
        <div
          key={model.name}
          className="rounded-lg border border-white/10 bg-surface-950 p-3 text-sm"
        >
          <div className="font-medium text-slate-200">{model.name}</div>
          <div className="text-xs text-slate-500">
            {model.fields.length} fields · {model.rowEstimate ?? "unknown"} rows
          </div>
        </div>
      ))}
    </div>
  );
}
