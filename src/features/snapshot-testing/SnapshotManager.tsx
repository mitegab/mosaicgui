import { useMemo, useState } from "react";
import { Camera, Trash2, PlayCircle, Eye, Check, X } from "lucide-react";
import { Button } from "../../components/ui/Button";
import { Panel } from "../../components/ui/Panel";
import { useQueryStore } from "../../store/queryStore";
import { useExecutionStore } from "../../store/executionStore";
import { useSnapshotStore } from "./useSnapshotStore";
import { SnapshotDiffView } from "./SnapshotDiffView";
import { cn } from "../../utils/cn";

function formatDate(iso: string): string {
  const date = new Date(iso);
  return Number.isNaN(date.getTime())
    ? iso
    : date.toLocaleString([], { dateStyle: "medium", timeStyle: "short" });
}

export function SnapshotManager() {
  const snapshots = useSnapshotStore((state) => state.snapshots);
  const results = useSnapshotStore((state) => state.results);
  const captureSnapshot = useSnapshotStore((state) => state.captureSnapshot);
  const runRegression = useSnapshotStore((state) => state.runRegression);
  const deleteSnapshot = useSnapshotStore((state) => state.deleteSnapshot);

  const dsl = useQueryStore((state) => state.dsl);
  const rows = useExecutionStore((state) => state.rows);

  const [isCapturing, setIsCapturing] = useState(false);
  const [draftName, setDraftName] = useState("");
  const [viewingId, setViewingId] = useState<string | null>(null);

  const testedCount = useMemo(() => Object.keys(results).length, [results]);
  const passingCount = useMemo(
    () => Object.values(results).filter((r) => r.passed).length,
    [results],
  );

  const handleCaptureConfirm = () => {
    const name = draftName.trim() || `Snapshot ${snapshots.length + 1}`;
    captureSnapshot(name, dsl, rows);
    setDraftName("");
    setIsCapturing(false);
  };

  return (
    <Panel
      title="Snapshot Manager"
      subtitle="Capture query output and detect regressions"
      action={
        !isCapturing ? (
          <Button
            variant="primary"
            size="sm"
            onClick={() => setIsCapturing(true)}
          >
            <Camera size={13} />
            Capture New Snapshot
          </Button>
        ) : null
      }
      bodyClassName="p-3 flex flex-col gap-3"
    >
      {isCapturing && (
        <div className="flex items-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--bg-panel-hover)] p-2">
          <input
            autoFocus
            className="input flex-1"
            placeholder="Snapshot name…"
            value={draftName}
            onChange={(e) => setDraftName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleCaptureConfirm();
              if (e.key === "Escape") setIsCapturing(false);
            }}
          />
          <Button variant="primary" size="sm" onClick={handleCaptureConfirm}>
            Save
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsCapturing(false)}
          >
            Cancel
          </Button>
        </div>
      )}

      {snapshots.length > 0 && (
        <div className="flex flex-col gap-1">
          <div className="flex items-center justify-between text-xs text-[var(--text-secondary)]">
            <span>
              {passingCount}/{snapshots.length} snapshots passing
            </span>
            <span className="text-[var(--text-muted)]">
              {testedCount} tested
            </span>
          </div>
          <div className="h-1.5 rounded-full bg-[var(--border)] overflow-hidden">
            <div
              className="h-full bg-success-500 transition-all duration-300"
              style={{
                width: `${snapshots.length > 0 ? (passingCount / snapshots.length) * 100 : 0}%`,
              }}
            />
          </div>
        </div>
      )}

      {snapshots.length === 0 ? (
        <p className="text-xs text-[var(--text-muted)] py-4 text-center">
          No snapshots yet. Run a query, then capture a snapshot to guard
          against regressions.
        </p>
      ) : (
        <div className="flex flex-col divide-y divide-[var(--border)]">
          {snapshots.map((snapshot) => {
            const result = results[snapshot.id];
            return (
              <div key={snapshot.id} className="py-2 flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-[var(--text-primary)] truncate">
                      {snapshot.name}
                    </div>
                    <div className="text-[11px] text-[var(--text-muted)]">
                      {formatDate(snapshot.capturedAt)} ·{" "}
                      {snapshot.rowCountAtCapture} rows
                    </div>
                  </div>
                  {result && (
                    <span
                      className={cn(
                        "badge shrink-0",
                        result.passed
                          ? "bg-success-500/15 text-success-400"
                          : "bg-danger-500/15 text-danger-400",
                      )}
                    >
                      {result.passed ? <Check size={11} /> : <X size={11} />}
                      {result.passed ? "PASS" : "FAIL"}
                    </span>
                  )}
                  <button
                    type="button"
                    title="Run Test"
                    onClick={() => runRegression(snapshot.id, rows)}
                    className="p-1.5 rounded hover:bg-[var(--bg-panel-hover)] text-[var(--text-secondary)]"
                  >
                    <PlayCircle size={14} />
                  </button>
                  <button
                    type="button"
                    title="View Diff"
                    onClick={() =>
                      setViewingId((current) =>
                        current === snapshot.id ? null : snapshot.id,
                      )
                    }
                    className="p-1.5 rounded hover:bg-[var(--bg-panel-hover)] text-[var(--text-secondary)]"
                  >
                    <Eye size={14} />
                  </button>
                  <button
                    type="button"
                    title="Delete"
                    onClick={() => deleteSnapshot(snapshot.id)}
                    className="p-1.5 rounded hover:bg-danger-500/10 text-[var(--text-secondary)] hover:text-danger-400"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
                {viewingId === snapshot.id && (
                  <div className="rounded-lg border border-[var(--border)] p-3 bg-[var(--bg-panel)]">
                    <SnapshotDiffView snapshotId={snapshot.id} />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </Panel>
  );
}

export default SnapshotManager;
