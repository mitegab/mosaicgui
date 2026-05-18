import { useMemo, useState } from "react";
import { FixedSizeList as List } from "react-window";
import { Download, FileJson, Table2 } from "lucide-react";
import { Panel } from "../../components/ui/Panel";
import { Button } from "../../components/ui/Button";
import { useExecutionStore } from "../../store/executionStore";

export function ResultsExplorer() {
  const [jsonMode, setJsonMode] = useState(false);
  const [expandedRow, setExpandedRow] = useState<Record<
    string,
    unknown
  > | null>(null);
  const rows = useExecutionStore((state) => state.rows);
  const metrics = useExecutionStore((state) => state.metrics);
  const error = useExecutionStore((state) => state.error);
  const columns = useMemo(
    () =>
      Array.from(new Set(rows.flatMap((row) => Object.keys(row)))).slice(0, 50),
    [rows],
  );

  return (
    <Panel
      title="Results Explorer"
      className="h-full"
      action={
        <div className="flex items-center gap-2">
          {metrics && (
            <span className="text-xs text-slate-400">
              {metrics.rowsReturned} rows · {metrics.executionTimeMs}ms
            </span>
          )}
          <Button
            variant="ghost"
            className="px-2 py-1 text-xs"
            onClick={() => setJsonMode((value) => !value)}
          >
            {jsonMode ? (
              <Table2 className="h-4 w-4" />
            ) : (
              <FileJson className="h-4 w-4" />
            )}{" "}
            {jsonMode ? "Grid" : "JSON"}
          </Button>
          <Button
            variant="ghost"
            className="px-2 py-1 text-xs"
            onClick={() => exportRows(rows, jsonMode ? "json" : "csv")}
          >
            <Download className="h-4 w-4" /> Export
          </Button>
        </div>
      }
      bodyClassName="grid h-full grid-cols-[minmax(0,1fr)_320px]"
    >
      <div className="min-h-0 overflow-hidden p-3">
        {error && (
          <div className="mb-3 rounded-lg border border-rose-400/30 bg-rose-500/10 p-3 text-sm text-rose-200">
            {error}
          </div>
        )}
        {rows.length === 0 ? (
          <div className="grid h-full place-items-center rounded-lg border border-dashed border-white/10 text-sm text-slate-400">
            Run a query to inspect tabular results, raw JSON, expandable rows,
            and exports.
          </div>
        ) : jsonMode ? (
          <pre className="h-full overflow-auto rounded-lg bg-surface-950 p-3 text-xs text-slate-300">
            {JSON.stringify(rows, null, 2)}
          </pre>
        ) : (
          <div className="h-full overflow-hidden rounded-lg border border-white/10">
            <div
              className="grid bg-surface-950 text-xs font-semibold text-slate-300"
              style={{
                gridTemplateColumns: `repeat(${columns.length}, minmax(160px, 1fr))`,
              }}
            >
              {columns.map((column, index) => (
                <div
                  key={column}
                  className={`border-b border-r border-white/10 px-3 py-2 ${index === 0 ? "sticky left-0 z-10 bg-surface-950" : ""}`}
                >
                  {column}
                </div>
              ))}
            </div>
            <List
              height={190}
              itemCount={rows.length}
              itemSize={36}
              width="100%"
            >
              {({ index, style }) => (
                <div
                  style={{
                    ...style,
                    display: "grid",
                    gridTemplateColumns: `repeat(${columns.length}, minmax(160px, 1fr))`,
                  }}
                  className="cursor-pointer text-xs text-slate-300 hover:bg-white/5"
                  onClick={() => setExpandedRow(rows[index])}
                >
                  {columns.map((column, columnIndex) => (
                    <div
                      key={`${index}-${column}`}
                      className={`truncate border-b border-r border-white/10 px-3 py-2 ${columnIndex === 0 ? "sticky left-0 z-10 bg-surface-900" : ""}`}
                    >
                      {String(rows[index][column] ?? "")}
                    </div>
                  ))}
                </div>
              )}
            </List>
          </div>
        )}
      </div>
      <aside className="min-h-0 overflow-auto border-l border-white/10 p-3">
        <h3 className="mb-2 text-sm font-semibold text-white">Row Drawer</h3>
        {expandedRow ? (
          <pre className="text-xs text-slate-300">
            {JSON.stringify(expandedRow, null, 2)}
          </pre>
        ) : (
          <p className="text-sm text-slate-500">
            Click a row to inspect full JSON payload.
          </p>
        )}
      </aside>
    </Panel>
  );
}

function exportRows(rows: Record<string, unknown>[], format: "csv" | "json") {
  const content =
    format === "json" ? JSON.stringify(rows, null, 2) : toCsv(rows);
  const blob = new Blob([content], {
    type: format === "json" ? "application/json" : "text/csv",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `mosaic-results.${format}`;
  link.click();
  URL.revokeObjectURL(url);
}

function toCsv(rows: Record<string, unknown>[]) {
  const columns = Array.from(new Set(rows.flatMap((row) => Object.keys(row))));
  return [
    columns.join(","),
    ...rows.map((row) =>
      columns.map((column) => JSON.stringify(row[column] ?? "")).join(","),
    ),
  ].join("\n");
}
