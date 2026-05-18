/**
 * sessionSerializer.ts
 * Captures, serializes, and restores the full UI session state.
 * Uses getState() pattern so it works outside of React components.
 */

import { useQueryStore } from '../../store/queryStore';
import { useUiStore } from '../../store/uiStore';
import { useSchemaStore } from '../../store/schemaStore';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface SessionSnapshot {
  version: '1.0';
  capturedAt: string;
  query: {
    nodes: unknown[];
    edges: unknown[];
    dsl: unknown;
  };
  ui: {
    workspaceMode: string;
    rightPanel: string;
    leftSidebarCollapsed: boolean;
    bottomPanelCollapsed: boolean;
  };
  schema: {
    selectedModel: string | undefined;
    favorites: string[];
    pinnedModels: string[];
  };
  cursorPosition: { x: number; y: number } | null;
}

// ---------------------------------------------------------------------------
// captureSession
// ---------------------------------------------------------------------------

export function captureSession(): SessionSnapshot {
  const queryState = useQueryStore.getState();
  const uiState = useUiStore.getState();
  const schemaState = useSchemaStore.getState();

  return {
    version: '1.0',
    capturedAt: new Date().toISOString(),
    query: {
      nodes: queryState.nodes,
      edges: queryState.edges,
      dsl: queryState.dsl,
    },
    ui: {
      workspaceMode: uiState.workspaceMode,
      rightPanel: uiState.rightPanel,
      leftSidebarCollapsed: uiState.leftSidebarCollapsed,
      bottomPanelCollapsed: uiState.bottomPanelCollapsed,
    },
    schema: {
      selectedModel: schemaState.selectedModel,
      favorites: schemaState.favorites,
      pinnedModels: schemaState.pinnedModels,
    },
    cursorPosition: null,
  };
}

// ---------------------------------------------------------------------------
// restoreSession
// ---------------------------------------------------------------------------

export function restoreSession(snapshot: SessionSnapshot): void {
  // Restore query state
  const queryStore = useQueryStore.getState();
  queryStore.setNodes(snapshot.query.nodes as Parameters<typeof queryStore.setNodes>[0]);
  queryStore.setEdges(snapshot.query.edges as Parameters<typeof queryStore.setEdges>[0]);
  queryStore.setDsl(snapshot.query.dsl as Parameters<typeof queryStore.setDsl>[0]);

  // Restore UI state
  const uiStore = useUiStore.getState();
  uiStore.setWorkspaceMode(snapshot.ui.workspaceMode as Parameters<typeof uiStore.setWorkspaceMode>[0]);
  uiStore.setRightPanel(snapshot.ui.rightPanel as Parameters<typeof uiStore.setRightPanel>[0]);

  // Sync sidebar/bottom panel collapsed flags
  const currentUi = useUiStore.getState();
  if (currentUi.leftSidebarCollapsed !== snapshot.ui.leftSidebarCollapsed) {
    uiStore.toggleLeftSidebar();
  }
  if (currentUi.bottomPanelCollapsed !== snapshot.ui.bottomPanelCollapsed) {
    uiStore.toggleBottomPanel();
  }

  // Restore schema state
  const schemaStore = useSchemaStore.getState();
  schemaStore.selectModel(snapshot.schema.selectedModel);

  // Restore favorites
  const currentFavorites = useSchemaStore.getState().favorites;
  // Remove ones not in snapshot
  for (const fav of currentFavorites) {
    if (!snapshot.schema.favorites.includes(fav)) {
      schemaStore.toggleFavorite(fav);
    }
  }
  // Add ones from snapshot that are missing
  const newFavorites = useSchemaStore.getState().favorites;
  for (const fav of snapshot.schema.favorites) {
    if (!newFavorites.includes(fav)) {
      schemaStore.toggleFavorite(fav);
    }
  }

  // Restore pinned models
  const currentPinned = useSchemaStore.getState().pinnedModels;
  for (const model of currentPinned) {
    if (!snapshot.schema.pinnedModels.includes(model)) {
      schemaStore.togglePinnedModel(model);
    }
  }
  const newPinned = useSchemaStore.getState().pinnedModels;
  for (const model of snapshot.schema.pinnedModels) {
    if (!newPinned.includes(model)) {
      schemaStore.togglePinnedModel(model);
    }
  }
}

// ---------------------------------------------------------------------------
// serializeSession — JSON → base64 (URL-safe)
// ---------------------------------------------------------------------------

export function serializeSession(snapshot: SessionSnapshot): string {
  const json = JSON.stringify(snapshot);
  // btoa requires a binary string; encode to UTF-8 first
  const bytes = new TextEncoder().encode(json);
  let binary = '';
  bytes.forEach((b) => (binary += String.fromCharCode(b)));
  return btoa(binary)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

// ---------------------------------------------------------------------------
// deserializeSession — base64 → SessionSnapshot (with error handling)
// ---------------------------------------------------------------------------

export function deserializeSession(encoded: string): SessionSnapshot | null {
  try {
    // Restore URL-safe base64 to standard base64
    const standard = encoded.replace(/-/g, '+').replace(/_/g, '/');
    const binary = atob(standard);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    const json = new TextDecoder().decode(bytes);
    const parsed = JSON.parse(json) as SessionSnapshot;

    // Basic version check
    if (parsed.version !== '1.0') {
      console.warn('[sessionSerializer] Unsupported session version:', parsed.version);
      return null;
    }

    return parsed;
  } catch (err) {
    console.error('[sessionSerializer] Failed to deserialize session:', err);
    return null;
  }
}
