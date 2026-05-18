import { useEffect, useRef } from 'react';

// ─── Types ─────────────────────────────────────────────────────────────────

export interface StateChangeMessage {
  type: 'STATE_CHANGE';
  slice: string;
  data: unknown;
  ts: number;
}

// ─── BroadcastChannel singleton ────────────────────────────────────────────

let _channel: BroadcastChannel | null = null;

function getChannel(): BroadcastChannel | null {
  if (typeof BroadcastChannel === 'undefined') {
    // Not supported in this environment (e.g., older browsers, SSR)
    return null;
  }
  if (!_channel) {
    _channel = new BroadcastChannel('mosaic-state');
  }
  return _channel;
}

// ─── broadcastStateChange ──────────────────────────────────────────────────

/**
 * Post a STATE_CHANGE message to all other tabs/windows subscribed to
 * the 'mosaic-state' BroadcastChannel.
 */
export function broadcastStateChange(slice: string, data: unknown): void {
  const ch = getChannel();
  if (!ch) return;

  const msg: StateChangeMessage = {
    type: 'STATE_CHANGE',
    slice,
    data,
    ts: Date.now(),
  };

  try {
    ch.postMessage(msg);
  } catch (err) {
    console.warn('[BroadcastBridge] Failed to post message:', err);
  }
}

// ─── subscribeToStateChanges ───────────────────────────────────────────────

/**
 * Subscribe to STATE_CHANGE messages from other tabs/windows.
 * Returns an unsubscribe function.
 */
export function subscribeToStateChanges(
  callback: (msg: StateChangeMessage) => void
): () => void {
  const ch = getChannel();
  if (!ch) return () => {};

  const handler = (event: MessageEvent<StateChangeMessage>) => {
    if (event.data && event.data.type === 'STATE_CHANGE') {
      callback(event.data);
    }
  };

  ch.addEventListener('message', handler);

  return () => {
    ch.removeEventListener('message', handler);
  };
}

// ─── useStateBroadcast ─────────────────────────────────────────────────────

/**
 * React hook that broadcasts `value` under `slice` whenever `value` changes.
 * Debounced by 200 ms to avoid flooding the channel on rapid updates.
 */
export function useStateBroadcast(slice: string, value: unknown): void {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (timerRef.current !== null) {
      clearTimeout(timerRef.current);
    }

    timerRef.current = setTimeout(() => {
      broadcastStateChange(slice, value);
      timerRef.current = null;
    }, 200);

    return () => {
      if (timerRef.current !== null) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [slice, value]);
}
