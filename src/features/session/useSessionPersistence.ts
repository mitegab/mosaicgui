import { useEffect, useCallback, useRef } from 'react';
import { useQueryStore } from '../../store/queryStore';
import { useUiStore } from '../../store/uiStore';
import { useSchemaStore } from '../../store/schemaStore';
import {
  captureSession,
  restoreSession,
  serializeSession,
  deserializeSession,
  type SessionSnapshot,
} from './sessionSerializer';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const SESSION_KEY = 'mosaic-session';
const SESSION_HISTORY_KEY = 'mosaic-session-history';
const DEBOUNCE_MS = 1000;
const MAX_HISTORY = 5;

// ---------------------------------------------------------------------------
// LocalStorage helpers
// ---------------------------------------------------------------------------

function readHistory(): SessionSnapshot[] {
  try {
    const raw = localStorage.getItem(SESSION_HISTORY_KEY);
    return raw ? (JSON.parse(raw) as SessionSnapshot[]) : [];
  } catch {
    return [];
  }
}

function writeHistory(history: SessionSnapshot[]): void {
  try {
    localStorage.setItem(SESSION_HISTORY_KEY, JSON.stringify(history));
  } catch {
    // Ignore quota errors
  }
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export interface SessionPersistenceActions {
  /** Manually save current session. */
  save: () => void;
  /** Restore the most recently auto-saved session. */
  restore: () => void;
  /** Export the current session as a `.mosaic` JSON file download. */
  exportToFile: () => void;
  /** Import a `.mosaic` file and restore the session from it. */
  importFromFile: (file: File) => Promise<void>;
  /** Serialize session and copy the URL with hash to the clipboard. */
  copyShareLink: () => void;
}

export function useSessionPersistence(): SessionPersistenceActions {
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // -------------------------------------------------------------------------
  // On mount: check URL hash for #session= and auto-restore
  // -------------------------------------------------------------------------
  useEffect(() => {
    const hash = window.location.hash;
    if (hash.startsWith('#session=')) {
      const encoded = hash.slice('#session='.length);
      const snapshot = deserializeSession(encoded);
      if (snapshot) {
        restoreSession(snapshot);
        // Clean the hash from the URL without triggering navigation
        window.history.replaceState(null, '', window.location.pathname + window.location.search);
        return; // Skip localStorage restore when URL hash is present
      }
    }

    // Restore from localStorage on mount
    try {
      const raw = localStorage.getItem(SESSION_KEY);
      if (raw) {
        const snapshot = JSON.parse(raw) as SessionSnapshot;
        if (snapshot?.version === '1.0') {
          restoreSession(snapshot);
        }
      }
    } catch {
      // Ignore corrupt data
    }
  // Run only once on mount
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // -------------------------------------------------------------------------
  // Auto-save: subscribe to all relevant stores and debounce saves
  // -------------------------------------------------------------------------
  useEffect(() => {
    const scheduleAutoSave = () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        const snapshot = captureSession();
        try {
          localStorage.setItem(SESSION_KEY, JSON.stringify(snapshot));
        } catch {
          // Ignore quota errors
        }
      }, DEBOUNCE_MS);
    };

    const unsubQuery = useQueryStore.subscribe(scheduleAutoSave);
    const unsubUi = useUiStore.subscribe(scheduleAutoSave);
    const unsubSchema = useSchemaStore.subscribe(scheduleAutoSave);

    return () => {
      unsubQuery();
      unsubUi();
      unsubSchema();
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  // -------------------------------------------------------------------------
  // save
  // -------------------------------------------------------------------------
  const save = useCallback(() => {
    const snapshot = captureSession();

    // Persist as current session
    try {
      localStorage.setItem(SESSION_KEY, JSON.stringify(snapshot));
    } catch {
      // Ignore
    }

    // Append to history (most recent first, capped at MAX_HISTORY)
    const history = readHistory();
    const updated = [snapshot, ...history].slice(0, MAX_HISTORY);
    writeHistory(updated);
  }, []);

  // -------------------------------------------------------------------------
  // restore
  // -------------------------------------------------------------------------
  const restore = useCallback(() => {
    try {
      const raw = localStorage.getItem(SESSION_KEY);
      if (raw) {
        const snapshot = JSON.parse(raw) as SessionSnapshot;
        restoreSession(snapshot);
      }
    } catch {
      console.error('[useSessionPersistence] Failed to restore session');
    }
  }, []);

  // -------------------------------------------------------------------------
  // exportToFile
  // -------------------------------------------------------------------------
  const exportToFile = useCallback(() => {
    const snapshot = captureSession();
    const json = JSON.stringify(snapshot, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `mosaic-session-${new Date().toISOString().replace(/[:.]/g, '-')}.mosaic`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, []);

  // -------------------------------------------------------------------------
  // importFromFile
  // -------------------------------------------------------------------------
  const importFromFile = useCallback(async (file: File): Promise<void> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const text = e.target?.result as string;
          const snapshot = JSON.parse(text) as SessionSnapshot;
          if (snapshot?.version !== '1.0') {
            reject(new Error('Unsupported session format'));
            return;
          }
          restoreSession(snapshot);
          resolve();
        } catch (err) {
          reject(err);
        }
      };
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsText(file);
    });
  }, []);

  // -------------------------------------------------------------------------
  // copyShareLink
  // -------------------------------------------------------------------------
  const copyShareLink = useCallback(() => {
    const snapshot = captureSession();
    const encoded = serializeSession(snapshot);
    const url = `${window.location.origin}${window.location.pathname}${window.location.search}#session=${encoded}`;
    navigator.clipboard.writeText(url).catch((err) => {
      console.error('[useSessionPersistence] Clipboard write failed:', err);
    });
  }, []);

  return { save, restore, exportToFile, importFromFile, copyShareLink };
}
