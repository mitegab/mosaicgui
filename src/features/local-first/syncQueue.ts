import { useEffect } from 'react';
import type { PendingOperation } from '../../store/offlineStore';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const STORAGE_KEY = 'mosaic-sync-queue';
const MAX_RETRIES = 3;

// ---------------------------------------------------------------------------
// SyncQueue class
// ---------------------------------------------------------------------------

export class SyncQueue {
  private queue: PendingOperation[] = [];
  private isProcessing = false;

  constructor() {
    this.loadFromStorage();
  }

  // -------------------------------------------------------------------------
  // Enqueue / dequeue
  // -------------------------------------------------------------------------

  enqueue(op: PendingOperation): void {
    this.queue.push(op);
    this.saveToStorage();
  }

  dequeue(): PendingOperation | undefined {
    const op = this.queue.shift();
    this.saveToStorage();
    return op;
  }

  peek(): PendingOperation | undefined {
    return this.queue[0];
  }

  size(): number {
    return this.queue.length;
  }

  getAll(): PendingOperation[] {
    return [...this.queue];
  }

  // -------------------------------------------------------------------------
  // Process
  // -------------------------------------------------------------------------

  async process(
    executor: (op: PendingOperation) => Promise<void>
  ): Promise<void> {
    if (this.isProcessing) return;
    this.isProcessing = true;

    try {
      // Take a snapshot so newly enqueued ops during processing aren't lost
      const ops = this.getAll();

      for (const op of ops) {
        let success = false;

        for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
          try {
            await executor(op);
            success = true;
            break;
          } catch {
            if (attempt < MAX_RETRIES) {
              // Exponential backoff: 500ms, 1000ms, 2000ms
              await sleep(500 * Math.pow(2, attempt));
            }
          }
        }

        if (success) {
          // Remove from queue (find by id in case queue mutated)
          this.queue = this.queue.filter((q) => q.id !== op.id);
          this.saveToStorage();
        } else {
          // Increment retry count in queue
          this.queue = this.queue.map((q) =>
            q.id === op.id ? { ...q, retries: (q.retries ?? 0) + 1 } : q
          );
          // If permanently failed (exceeded retries), remove it
          this.queue = this.queue.filter((q) => q.retries <= MAX_RETRIES);
          this.saveToStorage();
        }
      }
    } finally {
      this.isProcessing = false;
    }
  }

  // -------------------------------------------------------------------------
  // Persistence
  // -------------------------------------------------------------------------

  loadFromStorage(): void {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as PendingOperation[];
        this.queue = Array.isArray(parsed) ? parsed : [];
      }
    } catch {
      this.queue = [];
    }
  }

  saveToStorage(): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.queue));
    } catch {
      // Storage quota exceeded — silently fail
    }
  }

  clear(): void {
    this.queue = [];
    localStorage.removeItem(STORAGE_KEY);
  }
}

// ---------------------------------------------------------------------------
// Shared singleton
// ---------------------------------------------------------------------------

export const syncQueue = new SyncQueue();

// ---------------------------------------------------------------------------
// Hook: triggers queue processing when the browser comes back online
// ---------------------------------------------------------------------------

export function useSyncOnReconnect(
  executor: (op: PendingOperation) => Promise<void>
): void {
  useEffect(() => {
    const handleOnline = () => {
      syncQueue.process(executor).catch(console.error);
    };

    window.addEventListener('online', handleOnline);

    return () => {
      window.removeEventListener('online', handleOnline);
    };
    // executor is intentionally excluded from deps — callers should memoize it
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
