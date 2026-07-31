import { useMemo, useState, type ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Database,
  Play,
  Shield,
  Users,
  Settings,
  ChevronDown,
  Download,
  Trash2,
  type LucideIcon,
} from "lucide-react";
import { Panel } from "../../components/ui/Panel";
import { Button } from "../../components/ui/Button";
import { cn } from "../../utils/cn";
import {
  useAuditLog,
  type AuditCategory,
  type AuditEvent,
  type AuditSeverity,
} from "./useAuditLog";
import { AuditSearchBar } from "./AuditSearchBar";

const CATEGORY_META: Record<
  AuditCategory,
  {
    icon: LucideIcon;
    color: string;
    label: string;
  }
> = {
  schema: { icon: Database, color: "#8b5cf6", label: "Schema" },
  query: { icon: Play, color: "#2dd4bf", label: "Query" },
  auth: { icon: Shield, color: "#f59e0b", label: "Auth" },
  collaboration: { icon: Users, color: "#60a5fa", label: "Collaboration" },
  settings: { icon: Settings, color: "#f87171", label: "Settings" },
};

const SEVERITY_META: Record<AuditSeverity, { color: string; label: string }> = {
  info: { color: "#60a5fa", label: "Info" },
  warning: { color: "#f59e0b", label: "Warning" },
  critical: { color: "#ef4444", label: "Critical" },
};

const ALL_CATEGORIES = Object.keys(CATEGORY_META) as AuditCategory[];
const ALL_SEVERITIES = Object.keys(SEVERITY_META) as AuditSeverity[];

function timeAgo(iso: string): string {
  const diffSeconds = Math.max(
    0,
    Math.floor((Date.now() - new Date(iso).getTime()) / 1000),
  );
  if (diffSeconds < 60) return "just now";
  const minutes = Math.floor(diffSeconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

function dayLabel(iso: string): string {
  const date = new Date(iso);
  const now = new Date();
  const startOf = (d: Date) =>
    new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();

  const diffDays = Math.round((startOf(now) - startOf(date)) / 86_400_000);
  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function groupByDay(events: AuditEvent[]): Array<[string, AuditEvent[]]> {
  const groups = new Map<string, AuditEvent[]>();
  for (const event of events) {
    const label = dayLabel(event.timestamp);
    if (!groups.has(label)) groups.set(label, []);
    groups.get(label)!.push(event);
  }
  return Array.from(groups.entries());
}

function downloadBlob(content: string, filename: string, type: string) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function exportAsJson(events: AuditEvent[]) {
  downloadBlob(
    JSON.stringify(events, null, 2),
    "audit-log.json",
    "application/json",
  );
}

function exportAsCsv(events: AuditEvent[]) {
  const header = [
    "id",
    "timestamp",
    "actor",
    "action",
    "category",
    "target",
    "severity",
    "metadata",
  ];
  const rows = events.map((e) =>
    [
      e.id,
      e.timestamp,
      e.actor,
      e.action,
      e.category,
      e.target ?? "",
      e.severity,
      e.metadata ? JSON.stringify(e.metadata) : "",
    ]
      .map((value) => `"${String(value).replace(/"/g, '""')}"`)
      .join(","),
  );
  downloadBlob(
    [header.join(","), ...rows].join("\n"),
    "audit-log.csv",
    "text/csv",
  );
}

function EventItem({ event, index }: { event: AuditEvent; index: number }) {
  const [expanded, setExpanded] = useState(false);
  const meta = CATEGORY_META[event.category];
  const severity = SEVERITY_META[event.severity];
  const Icon = meta.icon;

  return (
    <motion.li
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.2, delay: Math.min(index, 12) * 0.02 }}
      className="relative flex gap-3 pb-4 pl-1"
    >
      <div className="relative flex flex-col items-center">
        <div
          className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full ring-2 ring-surface-900"
          style={{ background: `${meta.color}26`, color: meta.color }}
        >
          <Icon size={12} />
        </div>
        <div className="mt-1 w-px flex-1 bg-white/10" />
      </div>

      <div className="min-w-0 flex-1 pb-1">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-xs font-semibold text-white/85">
            {event.actor}
          </span>
          <span className="text-xs text-white/60">{event.action}</span>
          {event.target && (
            <span className="rounded bg-white/[0.06] px-1.5 py-0.5 font-mono text-[10px] text-white/50">
              {event.target}
            </span>
          )}
          <span
            className="rounded-full px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide"
            style={{ background: `${severity.color}22`, color: severity.color }}
          >
            {severity.label}
          </span>
        </div>
        <div className="mt-0.5 flex items-center gap-2 text-[10px] text-white/30">
          <span>{timeAgo(event.timestamp)}</span>
          {event.metadata && (
            <button
              onClick={() => setExpanded((v) => !v)}
              className="flex items-center gap-0.5 text-white/40 hover:text-white/70"
            >
              metadata{" "}
              <ChevronDown
                size={10}
                className={cn("transition-transform", expanded && "rotate-180")}
              />
            </button>
          )}
        </div>
        <AnimatePresence>
          {expanded && event.metadata && (
            <motion.pre
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-1.5 overflow-hidden rounded-md border border-white/10 bg-black/30 p-2 font-mono text-[10px] text-white/50"
            >
              {JSON.stringify(event.metadata, null, 2)}
            </motion.pre>
          )}
        </AnimatePresence>
      </div>
    </motion.li>
  );
}

function ChipToggle({
  active,
  color,
  onClick,
  children,
}: {
  active: boolean;
  color: string;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-medium transition-colors",
        active
          ? "border-transparent"
          : "border-white/10 text-white/40 hover:text-white/70",
      )}
      style={active ? { background: `${color}22`, color } : undefined}
    >
      {children}
    </button>
  );
}

export function AuditTimeline() {
  const events = useAuditLog((s) => s.events);
  const clear = useAuditLog((s) => s.clear);

  const [search, setSearch] = useState("");
  const [categories, setCategories] = useState<Set<AuditCategory>>(
    new Set(ALL_CATEGORIES),
  );
  const [severities, setSeverities] = useState<Set<AuditSeverity>>(
    new Set(ALL_SEVERITIES),
  );

  const toggleCategory = (cat: AuditCategory) =>
    setCategories((prev) => {
      const next = new Set(prev);
      if (next.has(cat)) next.delete(cat);
      else next.add(cat);
      return next;
    });

  const toggleSeverity = (sev: AuditSeverity) =>
    setSeverities((prev) => {
      const next = new Set(prev);
      if (next.has(sev)) next.delete(sev);
      else next.add(sev);
      return next;
    });

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return events.filter((event) => {
      if (!categories.has(event.category)) return false;
      if (!severities.has(event.severity)) return false;
      if (!query) return true;
      return (
        event.actor.toLowerCase().includes(query) ||
        event.action.toLowerCase().includes(query) ||
        (event.target ?? "").toLowerCase().includes(query)
      );
    });
  }, [events, categories, severities, search]);

  const grouped = useMemo(() => groupByDay(filtered), [filtered]);

  return (
    <Panel
      title="Activity Timeline"
      subtitle={`${filtered.length} of ${events.length} events`}
      action={
        <div className="flex items-center gap-1.5">
          <Button
            size="xs"
            variant="ghost"
            onClick={() => exportAsCsv(filtered)}
          >
            <Download size={11} /> CSV
          </Button>
          <Button
            size="xs"
            variant="ghost"
            onClick={() => exportAsJson(filtered)}
          >
            <Download size={11} /> JSON
          </Button>
          <Button size="xs" variant="ghost" onClick={clear} title="Clear log">
            <Trash2 size={11} />
          </Button>
        </div>
      }
      bodyClassName="flex flex-col"
    >
      <div className="shrink-0 space-y-2 border-b border-white/10 p-2.5">
        <AuditSearchBar value={search} onChange={setSearch} />
        <div className="flex flex-wrap items-center gap-1.5">
          {ALL_CATEGORIES.map((cat) => (
            <ChipToggle
              key={cat}
              active={categories.has(cat)}
              color={CATEGORY_META[cat].color}
              onClick={() => toggleCategory(cat)}
            >
              {CATEGORY_META[cat].label}
            </ChipToggle>
          ))}
          <div className="mx-1 h-4 w-px bg-white/10" />
          {ALL_SEVERITIES.map((sev) => (
            <ChipToggle
              key={sev}
              active={severities.has(sev)}
              color={SEVERITY_META[sev].color}
              onClick={() => toggleSeverity(sev)}
            >
              {SEVERITY_META[sev].label}
            </ChipToggle>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-3">
        {grouped.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 py-12 text-white/25">
            <Shield size={20} />
            <span className="text-xs">No matching events</span>
          </div>
        ) : (
          grouped.map(([label, dayEvents]) => (
            <div key={label} className="mb-4">
              <h3 className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-white/30">
                {label}
              </h3>
              <ul>
                {dayEvents.map((event, index) => (
                  <EventItem key={event.id} event={event} index={index} />
                ))}
              </ul>
            </div>
          ))
        )}
      </div>
    </Panel>
  );
}

export default AuditTimeline;
