import { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  ChevronDown,
  ChevronRight,
  Database,
  GitCompare,
  Loader2,
  Pin,
  Search,
  Star,
  X,
} from 'lucide-react';
import { Panel } from '../../components/ui/Panel';
import { Button } from '../../components/ui/Button';
import { Badge, fieldTypeBadgeVariant } from '../../components/ui/Badge';
import { fetchModels } from '../../api/schemaApi';
import { mockSchemaModels } from '../../api/mockSchema';
import { useSchemaStore } from '../../store/schemaStore';
import type { SchemaField, SchemaModel } from '../../types/schema';
import { cn } from '../../utils/cn';

/** Highlight matching text segments */
function Highlight({ text, query }: { text: string; query: string }) {
  if (!query) return <>{text}</>;
  const idx = text.toLowerCase().indexOf(query.toLowerCase());
  if (idx === -1) return <>{text}</>;
  return (
    <>
      {text.slice(0, idx)}
      <mark className="bg-warning-400/30 text-warning-400 rounded-[2px] px-[1px]">
        {text.slice(idx, idx + query.length)}
      </mark>
      {text.slice(idx + query.length)}
    </>
  );
}

export function SchemaBrowser() {
  const [search, setSearch] = useState('');
  const [showDiff, setShowDiff] = useState(false);
  const {
    models, selectedModel, selectedField, favorites, pinnedModels,
    setModels, selectModel, selectField, toggleFavorite, togglePinnedModel,
  } = useSchemaStore();

  const modelsQuery = useQuery({
    queryKey: ['schema-models'],
    queryFn: ({ signal }) => fetchModels(signal),
  });

  useEffect(() => {
    if (modelsQuery.data) setModels(modelsQuery.data);
  }, [modelsQuery.data, setModels]);

  useEffect(() => {
    if (models.length === 0 && modelsQuery.isError) setModels(mockSchemaModels);
  }, [models.length, modelsQuery.isError, setModels]);

  const visibleModels = useMemo(() => {
    const q = search.toLowerCase().trim();
    const source = models.length > 0 ? models : mockSchemaModels;
    return source
      .filter(
        (m) =>
          m.name.toLowerCase().includes(q) ||
          m.fields.some((f) => f.name.toLowerCase().includes(q)),
      )
      .sort(
        (a, b) =>
          Number(pinnedModels.includes(b.name)) - Number(pinnedModels.includes(a.name)) ||
          a.name.localeCompare(b.name),
      );
  }, [models, pinnedModels, search]);

  const activeModel =
    visibleModels.find((m) => m.name === selectedModel) ?? visibleModels[0];
  const activeField = selectedField
    ? activeModel?.fields.find((f) => f.name === selectedField)
    : activeModel?.fields[0];

  useEffect(() => {
    if (!selectedModel && activeModel) selectModel(activeModel.name);
  }, [activeModel, selectModel, selectedModel]);

  return (
    <Panel
      sidebar
      title="Schema Browser"
      subtitle={`${visibleModels.length} model${visibleModels.length !== 1 ? 's' : ''}`}
      action={modelsQuery.isLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin text-white/40" /> : null}
      bodyClassName="flex flex-col min-h-0"
      className="h-full"
    >
      {/* Search bar */}
      <div className="px-3 py-2.5 border-b border-[var(--border-sidebar)]">
        <label className="flex items-center gap-2 rounded-lg bg-white/8 border border-white/10 px-3 py-2 focus-within:border-django-400/50 focus-within:bg-white/10 transition-colors">
          <Search className="h-3.5 w-3.5 text-white/30 shrink-0" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 bg-transparent text-sm text-white placeholder:text-white/30 outline-none min-w-0"
            placeholder="Search models & fields…"
          />
          {search && (
            <button onClick={() => setSearch('')} className="text-white/30 hover:text-white/60 transition-colors">
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </label>

        <div className="flex gap-1.5 mt-2">
          <Button
            variant="ghost"
            size="xs"
            className="flex-1 text-white/50 hover:text-white hover:bg-white/10"
            onClick={() => setShowDiff((v) => !v)}
          >
            <GitCompare className="h-3.5 w-3.5" />
            {showDiff ? 'Hide Diff' : 'Schema Diff'}
          </Button>
          <Button
            variant="ghost"
            size="xs"
            className="flex-1 text-white/50 hover:text-white hover:bg-white/10"
            onClick={() => activeModel && togglePinnedModel(activeModel.name)}
          >
            <Pin className="h-3.5 w-3.5" />
            {activeModel && pinnedModels.includes(activeModel.name) ? 'Unpin' : 'Pin'}
          </Button>
        </div>
      </div>

      {/* Main content */}
      <div className="flex min-h-0 flex-1 overflow-hidden">
        {/* Model list */}
        <div className="w-[46%] min-h-0 overflow-y-auto border-r border-[var(--border-sidebar)] py-2 px-1.5">
          {visibleModels.length === 0 && (
            <p className="px-3 py-4 text-xs text-white/30 text-center">No models match</p>
          )}
          {visibleModels.map((model) => (
            <ModelTreeItem
              key={model.name}
              model={model}
              activeModel={activeModel?.name}
              selectedField={activeField?.name}
              favorite={favorites.includes(model.name)}
              pinned={pinnedModels.includes(model.name)}
              searchQuery={search}
              onSelectModel={() => selectModel(model.name)}
              onSelectField={(f) => { selectModel(model.name); selectField(f); }}
              onFavorite={() => toggleFavorite(model.name)}
            />
          ))}
        </div>

        {/* Field inspector / diff */}
        <div className="flex-1 min-h-0 overflow-y-auto p-3">
          {showDiff
            ? <SchemaDiffPreview models={visibleModels} />
            : <FieldInspector model={activeModel} field={activeField} searchQuery={search} />}
        </div>
      </div>
    </Panel>
  );
}

function ModelTreeItem({
  model, activeModel, selectedField, favorite, pinned, searchQuery,
  onSelectModel, onSelectField, onFavorite,
}: {
  model: SchemaModel;
  activeModel?: string;
  selectedField?: string;
  favorite: boolean;
  pinned: boolean;
  searchQuery: string;
  onSelectModel: () => void;
  onSelectField: (field: SchemaField) => void;
  onFavorite: () => void;
}) {
  const expanded = activeModel === model.name;

  return (
    <div className={cn('mb-1 rounded-lg overflow-hidden', expanded && 'bg-white/5')}>
      <button
        className={cn(
          'flex w-full items-center gap-2 px-2.5 py-2 text-left rounded-lg transition-colors',
          expanded ? 'text-white' : 'text-white/70 hover:text-white hover:bg-white/5',
        )}
        onClick={onSelectModel}
      >
        {expanded
          ? <ChevronDown  className="h-3.5 w-3.5 text-django-400 shrink-0" />
          : <ChevronRight className="h-3.5 w-3.5 text-white/30 shrink-0" />}
        <Database className={cn('h-3.5 w-3.5 shrink-0', expanded ? 'text-django-400' : 'text-white/40')} />
        <span className="flex-1 min-w-0 truncate text-xs font-medium">
          <Highlight text={model.name} query={searchQuery} />
        </span>
        {pinned && <Pin className="h-3 w-3 text-django-400 shrink-0" />}
        <button
          aria-label={`${favorite ? 'Unfavorite' : 'Favorite'} ${model.name}`}
          onClick={(e) => { e.stopPropagation(); onFavorite(); }}
          className={cn('rounded p-0.5 transition-colors shrink-0', favorite ? 'text-warning-400' : 'text-white/20 hover:text-warning-400')}
        >
          <Star className="h-3 w-3" fill={favorite ? 'currentColor' : 'none'} />
        </button>
      </button>

      {expanded && (
        <div className="pb-1.5 px-1.5 space-y-0.5">
          {model.fields.map((field) => (
            <button
              key={field.name}
              onClick={() => onSelectField(field)}
              className={cn(
                'flex w-full items-center justify-between rounded-md px-2 py-1.5 text-left transition-colors',
                selectedField === field.name
                  ? 'bg-django-400/20 text-django-300'
                  : 'text-white/50 hover:text-white hover:bg-white/5',
              )}
            >
              <span className="text-xs truncate">
                <Highlight text={field.name} query={searchQuery} />
              </span>
              <Badge variant={fieldTypeBadgeVariant(field.type)} className="ml-2 shrink-0 text-[0.6rem]">
                {field.type.length > 8 ? field.type.slice(0, 8) + '…' : field.type}
              </Badge>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function FieldInspector({ model, field, searchQuery }: { model?: SchemaModel; field?: SchemaField; searchQuery?: string }) {
  if (!model || !field)
    return (
      <div className="flex flex-col items-center justify-center h-32 gap-2 text-center">
        <Database className="h-8 w-8 text-white/10" />
        <p className="text-xs text-white/30">Select a field to inspect metadata</p>
      </div>
    );

  const meta = [
    ['Type',        field.type],
    ['Nullable',    String(Boolean(field.nullable))],
    ['Unique',      String(Boolean(field.unique))],
    ['Indexed',     String(Boolean(field.indexed))],
    ['Primary Key', String(Boolean(field.primaryKey))],
    ['Related To',  field.relatedModel ?? '—'],
  ] as [string, string][];

  return (
    <div className="space-y-3 animate-slide-in-up">
      <div>
        <p className="text-[0.625rem] font-mono text-white/30 uppercase tracking-widest">
          {model.tableName ?? model.name}
        </p>
        <h3 className="text-base font-bold text-white mt-0.5">
          <Highlight text={field.name} query={searchQuery ?? ''} />
        </h3>
        <p className="text-xs text-white/50 mt-0.5">
          {field.description ?? `${field.type} · ${field.kind}`}
        </p>
      </div>

      <dl className="grid grid-cols-2 gap-1.5">
        {meta.map(([label, value]) => (
          <div key={label} className="rounded-lg bg-white/5 border border-white/8 p-2.5">
            <dt className="text-[0.625rem] uppercase tracking-wide text-white/30">{label}</dt>
            <dd className="mt-0.5 text-xs font-semibold text-white">{value}</dd>
          </div>
        ))}
      </dl>

      {field.relatedModel && (
        <div className="rounded-lg bg-white/5 border border-white/8 p-2.5">
          <p className="text-[0.625rem] uppercase tracking-wide text-white/30 mb-2">Relationship</p>
          <div className="flex items-center gap-2 text-xs flex-wrap">
            <Badge variant="brand">{model.name}</Badge>
            <span className="text-white/30 font-mono">{field.relationType ?? '→'}</span>
            <Badge variant="teal">{field.relatedModel}</Badge>
          </div>
        </div>
      )}

      {field.sampleValues && field.sampleValues.length > 0 && (
        <div className="rounded-lg bg-white/5 border border-white/8 p-2.5">
          <p className="text-[0.625rem] uppercase tracking-wide text-white/30 mb-2">Sample Values</p>
          <div className="flex flex-wrap gap-1.5">
            {field.sampleValues.map((v, i) => (
              <span key={i} className="rounded-md bg-white/10 border border-white/10 px-2 py-0.5 text-[0.6875rem] font-mono text-white/70">
                {String(v)}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function SchemaDiffPreview({ models }: { models: SchemaModel[] }) {
  return (
    <div className="space-y-2 animate-slide-in-up">
      <div className="flex items-center gap-2 mb-3">
        <GitCompare className="h-4 w-4 text-django-400" />
        <h3 className="text-sm font-semibold text-white">Schema Diff Viewer</h3>
      </div>
      <p className="text-xs text-white/40 mb-3">
        Future-ready comparison surface for DB evolution. Current snapshot:
      </p>
      {models.map((model) => (
        <div key={model.name} className="rounded-lg bg-white/5 border border-white/8 p-2.5">
          <div className="text-xs font-semibold text-white">{model.name}</div>
          <div className="text-[0.6875rem] text-white/40 mt-0.5 font-mono">
            {model.fields.length} fields · {model.rowEstimate ?? 'unknown'} rows
          </div>
        </div>
      ))}
    </div>
  );
}
