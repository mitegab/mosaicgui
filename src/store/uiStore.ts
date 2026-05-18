import { create } from 'zustand';

export type WorkspaceMode = 'graph' | 'form';
export type RightPanel = 'dsl' | 'inspector' | 'ai' | 'performance';

interface UiState {
  workspaceMode: WorkspaceMode;
  rightPanel: RightPanel;
  leftSidebarCollapsed: boolean;
  bottomPanelCollapsed: boolean;
  setWorkspaceMode: (mode: WorkspaceMode) => void;
  setRightPanel: (panel: RightPanel) => void;
  toggleLeftSidebar: () => void;
  toggleBottomPanel: () => void;
}

export const useUiStore = create<UiState>((set) => ({
  workspaceMode: 'graph',
  rightPanel: 'dsl',
  leftSidebarCollapsed: false,
  bottomPanelCollapsed: false,
  setWorkspaceMode: (workspaceMode) => set({ workspaceMode }),
  setRightPanel: (rightPanel) => set({ rightPanel }),
  toggleLeftSidebar: () => set((state) => ({ leftSidebarCollapsed: !state.leftSidebarCollapsed })),
  toggleBottomPanel: () => set((state) => ({ bottomPanelCollapsed: !state.bottomPanelCollapsed })),
}));
