import { create } from 'zustand';
import { useEffect } from 'react';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type SyncStatus = 'saved' | 'syncing' | 'pending' | 'offline' | 'error';

export interface PendingOperation {
  id: string;
  type: 'EXECUTE_QUERY' | 'SAVE_QUERY' | 'DELETE_QUERY';
  payload: unknown;
  createdAt: string;
  retries: number;
}

interface OfflineState {
  status: SyncStatus;
  pendingOps: PendingOperation[];
  lastSyncedAt: string | null;
  isOnline: boolean;

  setStatus: (status: SyncStatus) => void;
  addPendingOp: (op: PendingOperation) => void;
  removePendingOp: (id: string) => void;
  setOnline: (online: boolean) => void;
  setLastSyncedAt: (ts: string | null) => void;
}

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

export const useOfflineStore = create<OfflineState>((set) => ({
  status: 'saved',
  pendingOps: [],
  lastSyncedAt: null,
  isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,

  setStatus: (status) => set({ status }),
  addPendingOp: (op) =>
    set((state) => ({
      pendingOps: [...state.pendingOps, op],
      status: state.isOnline ? 'pending' : 'offline',
    })),
  removePendingOp: (id) =>
    set((state) => {
      const pendingOps = state.pendingOps.filter((op) => op.id !== id);
      return {
        pendingOps,
        status: pendingOps.length === 0 ? 'saved' : state.status,
      };
    }),
  setOnline: (isOnline) =>
    set((state) => ({
      isOnline,
      status: !isOnline
        ? 'offline'
        : state.pendingOps.length > 0
          ? 'pending'
          : 'saved',
    })),
  setLastSyncedAt: (lastSyncedAt) => set({ lastSyncedAt }),
}));

// ---------------------------------------------------------------------------
// Hook: registers window online/offline event listeners
// ---------------------------------------------------------------------------

export function useOnlineStatus(): void {
  useEffect(() => {
    const store = useOfflineStore.getState();

    const handleOnline = () => store.setOnline(true);
    const handleOffline = () => store.setOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Sync the initial value in case it changed before the component mounted
    store.setOnline(navigator.onLine);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);
}
