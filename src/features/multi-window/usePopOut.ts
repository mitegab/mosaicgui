import { useRef, useCallback } from 'react';
import { create } from 'zustand';

// ─── Zustand store for tracking active pop-outs ────────────────────────────

interface PopOutStore {
  activePopOuts: Set<string>;
  _addPopOut: (id: string) => void;
  _removePopOut: (id: string) => void;
}

export const usePopOutStore = create<PopOutStore>((set) => ({
  activePopOuts: new Set<string>(),
  _addPopOut: (id) =>
    set((s) => ({ activePopOuts: new Set([...s.activePopOuts, id]) })),
  _removePopOut: (id) =>
    set((s) => {
      const next = new Set(s.activePopOuts);
      next.delete(id);
      return { activePopOuts: next };
    }),
}));

// ─── Global map: panelId → child Window reference ─────────────────────────

const windowRegistry = new Map<string, Window>();

// ─── HTML shell injected into the popped-out window ───────────────────────

function buildPopOutShell(panelId: string, contentType: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Mosaic — ${contentType} (${panelId})</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      background: #0d0d0f;
      color: #e2e8f0;
      font-family: ui-monospace, 'Cascadia Code', 'Fira Code', monospace;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      gap: 12px;
    }
    .badge {
      background: #1e293b;
      border: 1px solid #334155;
      border-radius: 8px;
      padding: 6px 14px;
      font-size: 0.75rem;
      color: #94a3b8;
      letter-spacing: 0.05em;
      text-transform: uppercase;
    }
    h1 { font-size: 1.25rem; color: #f8fafc; }
    p  { font-size: 0.875rem; color: #64748b; }
  </style>
</head>
<body>
  <div class="badge">Mosaic GUI Studio</div>
  <h1>${contentType}</h1>
  <p>Panel ID: ${panelId}</p>
  <p>Waiting for content from main window…</p>
  <script>
    // Notify the opener that this window is ready
    if (window.opener) {
      window.opener.postMessage(
        { type: 'MOSAIC_POPOUT_INIT', panelId: '${panelId}', contentType: '${contentType}' },
        window.location.origin || '*'
      );
    }
    // Listen for state updates from the main window
    window.addEventListener('message', (e) => {
      if (e.data && e.data.type === 'MOSAIC_STATE_UPDATE') {
        console.debug('[Mosaic PopOut] state update received:', e.data);
      }
    });
  </script>
</body>
</html>`;
}

// ─── Hook ──────────────────────────────────────────────────────────────────

export type PopOutContent = 'results' | 'monaco' | 'inspector';

export function usePopOut(panelId: string) {
  const { _addPopOut, _removePopOut, activePopOuts } = usePopOutStore();

  // Keep a ref so callbacks always see the latest registry entry
  const windowRef = useRef<Window | null>(windowRegistry.get(panelId) ?? null);

  const popOut = useCallback(
    (content: PopOutContent) => {
      // If a window is already open for this panel, focus it instead of opening a new one
      const existing = windowRegistry.get(panelId);
      if (existing && !existing.closed) {
        existing.focus();
        return;
      }

      const childWin = window.open(
        '',
        panelId,
        'width=1200,height=800,resizable=yes,scrollbars=yes'
      );

      if (!childWin) {
        console.warn(`[usePopOut] Could not open window for panel "${panelId}". Popup may be blocked.`);
        return;
      }

      // Write the HTML shell
      childWin.document.open();
      childWin.document.write(buildPopOutShell(panelId, content));
      childWin.document.close();

      // Register
      windowRegistry.set(panelId, childWin);
      windowRef.current = childWin;
      _addPopOut(panelId);

      // Detect when the child window is closed
      const interval = setInterval(() => {
        if (childWin.closed) {
          clearInterval(interval);
          windowRegistry.delete(panelId);
          windowRef.current = null;
          _removePopOut(panelId);
        }
      }, 500);
    },
    [panelId, _addPopOut, _removePopOut]
  );

  const closePopOut = useCallback(
    (id?: string) => {
      const targetId = id ?? panelId;
      const win = windowRegistry.get(targetId);
      if (win && !win.closed) {
        win.close();
      }
      windowRegistry.delete(targetId);
      if (targetId === panelId) windowRef.current = null;
      _removePopOut(targetId);
    },
    [panelId, _removePopOut]
  );

  const sendMessage = useCallback(
    (payload: unknown) => {
      const win = windowRegistry.get(panelId);
      if (win && !win.closed) {
        win.postMessage(payload, '*');
      }
    },
    [panelId]
  );

  return {
    popOut,
    closePopOut,
    sendMessage,
    isPopped: activePopOuts.has(panelId),
    activePopOuts,
  };
}
