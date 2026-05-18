import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type WorkspaceMode = 'graph' | 'form';
export type RightPanel = 'dsl' | 'inspector' | 'ai' | 'performance';

interface UiState {
  workspaceMode: WorkspaceMode;
  rightPanel: RightPanel;
  leftSidebarCollapsed: boolean;
  bottomPanelCollapsed: boolean;
  darkMode: boolean;
  commandPaletteOpen: boolean;
  setWorkspaceMode: (mode: WorkspaceMode) => void;
  setRightPanel: (panel: RightPanel) => void;
  toggleLeftSidebar: () => void;
  toggleBottomPanel: () => void;
  toggleDarkMode: () => void;
  setCommandPaletteOpen: (open: boolean) => void;
}

export const useUiStore = create<UiState>()(
  persist(
    (set) => ({
      workspaceMode: 'graph',
      rightPanel: 'dsl',
      leftSidebarCollapsed: false,
      bottomPanelCollapsed: false,
      darkMode: true,
      commandPaletteOpen: false,
      setWorkspaceMode: (workspaceMode) => set({ workspaceMode }),
      setRightPanel: (rightPanel) => set({ rightPanel }),
      toggleLeftSidebar: () => set((s) => ({ leftSidebarCollapsed: !s.leftSidebarCollapsed })),
      toggleBottomPanel: () => set((s) => ({ bottomPanelCollapsed: !s.bottomPanelCollapsed })),
      toggleDarkMode: () => set((s) => ({ darkMode: !s.darkMode })),
      setCommandPaletteOpen: (commandPaletteOpen) => set({ commandPaletteOpen }),
    }),
    { name: 'mosaic-ui' }
  )
);
