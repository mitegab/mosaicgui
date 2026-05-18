import { useState, useEffect, useCallback, useRef } from 'react';
import { Trash2 } from 'lucide-react';
import { cn } from '../../utils/cn';

// ─── Types ─────────────────────────────────────────────────────────────────

export interface NetworkRequest {
  id: string;
  url: string;
  method: string;
  startTime: number;   // ms since epoch (Date.now())
  endTime: number | null;
  status: number | null;
  duration: number | null; // ms
}

// ─── Duration colour helper ────────────────────────────────────────────────

function durationColor(ms: number | null): string {
  if (ms === null) return 'bg-white/20';
  if (ms < 200)   return 'bg-emerald-400';
  if (ms < 1000)  return 'bg-amber-400';
  return 'bg-red-400';
}

function durationTextColor(ms: number | null): string {
  if (ms === null) return 'text-white/30';
  if (ms < 200)   return 'text-emerald-400';
  if (ms < 1000)  return 'text-amber-400';
  return 'text-red-400';
}

function statusColor(status: number | null): string {
  if (status === null) return 'text-white/30';
  if (status < 300)    return 'text-emerald-400';
  if (status < 400)    return 'text-amber-400';
  return 'text-red-400';
}

const MAX_REQUESTS = 50;

let _idCounter = 0;
function nextId() { return `req-${++_idCounter}`; }

// ─── NetworkWaterfall ──────────────────────────────────────────────────────

export function NetworkWaterfall() {
  const [requests, setRequests] = useState<NetworkRequest[]>([]);
  // Use a ref so the monkey-patch closure always has the latest setter
  const setRequestsRef = useRef(setRequests);
  setRequestsRef.current = setRequests;

  // ── Monkey-patch window.fetch ──────────────────────────────────────────
  useEffect(() => {
    const originalFetch = window.fetch.bind(window);

    const proxiedFetch = new Proxy(originalFetch, {
      apply(target, thisArg, args: [RequestInfo | URL, RequestInit?]) {
        const [input, init] = args;
        const url    = typeof input === 'string' ? input : input instanceof URL ? input.href : (input as Request).url;
        const method = (init?.method ?? (input instanceof Request ? input.method : 'GET')).toUpperCase();
        const id        = nextId();
        const startTime = Date.now();

        // Register pending request
        setRequestsRef.current((prev) => {
          const entry: NetworkRequest = { id, url, method, startTime, endTime: null, status: null, duration: null };
          return [entry, ...prev].slice(0, MAX_REQUESTS);
        });

        const promise = Reflect.apply(target, thisArg, args) as Promise<Response>;

        promise.then((res) => {
          const endTime  = Date.now();
          const duration = endTime - startTime;
          setRequestsRef.current((prev) =>
            prev.map((r) => r.id === id ? { ...r, endTime, status: res.status, duration } : r)
          );
          return res;
        }).catch(() => {
          const endTime  = Date.now();
          setRequestsRef.current((prev) =>
            prev.map((r) => r.id === id ? { ...r, endTime, status: 0, duration: endTime - startTime } : r)
          );
        });

        return promise;
      },
    });

    window.fetch = proxiedFetch as typeof window.fetch;

    return () => {
      window.fetch = originalFetch as typeof window.fetch;
    };
  }, []);

  const clearRequests = useCallback(() => setRequests([]), []);

  // ── Timeline calculation ────────────────────────────────────────────────
  // Relative to the oldest request in the current list
  const windowStart = requests.length > 0 ? Math.min(...requests.map((r) => r.startTime)) : 0;
  const windowEnd   = requests.length > 0
    ? Math.max(...requests.map((r) => r.endTime ?? r.startTime + (r.duration ?? 0) + 1))
    : windowStart + 1;
  const windowSpan  = Math.max(windowEnd - windowStart, 1);

  return (
    <div className="flex flex-col text-xs">
      {/* ── Header bar ───────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-white/8">
        <span className="font-semibold text-white/60 uppercase tracking-wider text-[0.65rem]">
          Network ({requests.length}/{MAX_REQUESTS})
        </span>
        <button
          onClick={clearRequests}
          title="Clear requests"
          aria-label="Clear network requests"
          className="flex items-center gap-1 text-white/30 hover:text-white/70 transition-colors"
        >
          <Trash2 size={11} />
          <span className="text-[0.6rem]">Clear</span>
        </button>
      </div>

      {/* ── Column headers ───────────────────────────────────────────────── */}
      <div className="grid grid-cols-[2fr_60px_50px_70px_1fr] gap-1 px-3 py-1.5 border-b border-white/5 text-[0.6rem] text-white/30 uppercase tracking-wider">
        <div>Name</div>
        <div>Method</div>
        <div>Status</div>
        <div>Duration</div>
        <div>Timeline</div>
      </div>

      {/* ── Rows ─────────────────────────────────────────────────────────── */}
      {requests.length === 0 ? (
        <div className="px-3 py-6 text-center text-white/20 text-[0.7rem]">
          No requests intercepted yet
        </div>
      ) : (
        <div className="overflow-y-auto max-h-64">
          {requests.map((req) => {
            const barLeft  = ((req.startTime - windowStart) / windowSpan) * 100;
            const barWidth = req.duration !== null
              ? Math.max((req.duration / windowSpan) * 100, 0.5)
              : 1;

            const shortUrl = (() => {
              try { return new URL(req.url).pathname; } catch { return req.url; }
            })();

            return (
              <div
                key={req.id}
                className="grid grid-cols-[2fr_60px_50px_70px_1fr] gap-1 px-3 py-1 hover:bg-white/4 border-b border-white/4 items-center"
              >
                {/* Name */}
                <div
                  className="truncate text-white/70 font-mono"
                  title={req.url}
                >
                  {shortUrl}
                </div>

                {/* Method */}
                <div className="text-blue-300/80 font-mono">{req.method}</div>

                {/* Status */}
                <div className={cn('font-mono', statusColor(req.status))}>
                  {req.status ?? '…'}
                </div>

                {/* Duration */}
                <div className={cn('font-mono', durationTextColor(req.duration))}>
                  {req.duration !== null ? `${req.duration}ms` : '…'}
                </div>

                {/* Timeline bar */}
                <div className="relative h-3 rounded overflow-hidden bg-white/5">
                  <div
                    className={cn('absolute h-full rounded', durationColor(req.duration), 'opacity-80')}
                    style={{
                      left:  `${barLeft}%`,
                      width: `${barWidth}%`,
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
