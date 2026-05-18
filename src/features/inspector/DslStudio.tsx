import { useMemo, useState } from "react";
import Editor from "@monaco-editor/react";
import { Braces, Diff, WandSparkles } from "lucide-react";
import { Button } from "../../components/ui/Button";
import { dslToGraph } from "../../engine/dslToGraph";
import { validateDsl } from "../../engine/dslSchema";
import { useQueryStore } from "../../store/queryStore";
import type { QueryDsl } from "../../types/query";

export function DslStudio() {
  const dsl = useQueryStore((state) => state.dsl);
  const setDsl = useQueryStore((state) => state.setDsl);
  const setNodes = useQueryStore((state) => state.setNodes);
  const setEdges = useQueryStore((state) => state.setEdges);
  const compileGraph = useQueryStore((state) => state.compileGraph);
  const [draft, setDraft] = useState(() => JSON.stringify(dsl, null, 2));
  const [showDiff, setShowDiff] = useState(false);

  const parsed = useMemo(() => {
    try {
      const value = JSON.parse(draft) as unknown;
      return validateDsl(value);
    } catch (error) {
      return {
        success: false as const,
        error: {
          issues: [
            {
              path: [],
              message: error instanceof Error ? error.message : "Invalid JSON",
            },
          ],
        },
      };
    }
  }, [draft]);

  const diagnostics = parsed.success
    ? []
    : parsed.error.issues.map(
        (issue) => `${issue.path.join(".") || "root"}: ${issue.message}`,
      );

  return (
    <div className="flex h-full flex-col gap-3">
      <div className="flex flex-wrap gap-2">
        <Button
          variant="ghost"
          onClick={() => {
            const next = compileGraph();
            setDraft(JSON.stringify(next, null, 2));
          }}
        >
          <Braces className="h-4 w-4" /> Sync UI → DSL
        </Button>
        <Button
          variant="ghost"
          disabled={!parsed.success}
          onClick={() => parsed.success && setDsl(parsed.data as QueryDsl)}
        >
          <WandSparkles className="h-4 w-4" /> Apply DSL
        </Button>
        <Button
          variant="ghost"
          disabled={!parsed.success}
          onClick={() => {
            if (!parsed.success) return;
            const graph = dslToGraph(parsed.data as QueryDsl);
            setDsl(parsed.data as QueryDsl);
            setNodes(graph.nodes);
            setEdges(graph.edges);
          }}
        >
          Generate DSL → Graph
        </Button>
        <Button variant="ghost" onClick={() => setShowDiff((value) => !value)}>
          <Diff className="h-4 w-4" /> Diff
        </Button>
        <Button
          variant="ghost"
          disabled={!parsed.success}
          onClick={() =>
            parsed.success && setDraft(JSON.stringify(parsed.data, null, 2))
          }
        >
          Format Query
        </Button>
      </div>

      {diagnostics.length > 0 && (
        <div className="rounded-lg border border-rose-400/30 bg-rose-500/10 p-3 text-xs text-rose-200">
          {diagnostics.map((diagnostic) => (
            <div key={diagnostic}>{diagnostic}</div>
          ))}
        </div>
      )}

      {showDiff && (
        <div className="grid grid-cols-2 gap-2 rounded-lg border border-white/10 bg-surface-950 p-2 text-xs">
          <div>
            <div className="mb-1 text-slate-500">Compiled UI DSL</div>
            <pre className="max-h-40 overflow-auto text-slate-300">
              {JSON.stringify(dsl, null, 2)}
            </pre>
          </div>
          <div>
            <div className="mb-1 text-slate-500">Editor Draft</div>
            <pre className="max-h-40 overflow-auto text-slate-300">{draft}</pre>
          </div>
        </div>
      )}

      <div className="min-h-0 flex-1 overflow-hidden rounded-lg border border-white/10">
        <Editor
          height="100%"
          defaultLanguage="json"
          value={draft}
          theme="vs-dark"
          options={{
            minimap: { enabled: false },
            fontSize: 12,
            wordWrap: "on",
            tabSize: 2,
          }}
          onChange={(value) => setDraft(value ?? "")}
          beforeMount={(monaco) => {
            monaco.languages.json.jsonDefaults.setDiagnosticsOptions({
              validate: true,
              schemas: [
                {
                  uri: "mosaic://query-dsl.schema.json",
                  fileMatch: ["*"],
                  schema: {
                    type: "object",
                    required: [
                      "model",
                      "filters",
                      "relations",
                      "output",
                      "limit",
                    ],
                    properties: {
                      model: {
                        type: "string",
                        enum: useQueryStore
                          .getState()
                          .nodes.filter((node) => node.data.kind === "model")
                          .map((node) => String(node.data.model ?? ""))
                          .filter(Boolean),
                      },
                      filters: { type: "array" },
                      relations: { type: "array" },
                      output: { type: "array", items: { type: "string" } },
                      limit: { type: "number", minimum: 1 },
                    },
                  },
                },
              ],
            });
          }}
        />
      </div>
    </div>
  );
}
