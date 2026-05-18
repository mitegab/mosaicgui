import { create } from 'zustand';

type Direction = 'up' | 'down' | 'left' | 'right';

interface GridState {
  selectedCells: Set<string>;
  focusedCell: { row: number; col: number } | null;
  frozenColumns: Set<number>;
  columnWidths: Record<number, number>;

  // Actions
  selectCell: (row: number, col: number) => void;
  selectRange: (fromRow: number, fromCol: number, toRow: number, toCol: number) => void;
  toggleFreezeColumn: (col: number) => void;
  resizeColumn: (col: number, width: number) => void;
  clearSelection: () => void;
  selectAll: (totalRows: number, totalCols: number) => void;
  navigateCell: (direction: Direction, totalRows: number, totalCols: number) => void;
}

function cellKey(row: number, col: number): string {
  return `${row}-${col}`;
}

export const useGridState = create<GridState>((set, get) => ({
  selectedCells: new Set(),
  focusedCell: null,
  frozenColumns: new Set(),
  columnWidths: {},

  selectCell: (row, col) =>
    set({
      selectedCells: new Set([cellKey(row, col)]),
      focusedCell: { row, col },
    }),

  selectRange: (fromRow, fromCol, toRow, toCol) => {
    const keys = new Set<string>();
    const minRow = Math.min(fromRow, toRow);
    const maxRow = Math.max(fromRow, toRow);
    const minCol = Math.min(fromCol, toCol);
    const maxCol = Math.max(fromCol, toCol);
    for (let r = minRow; r <= maxRow; r++) {
      for (let c = minCol; c <= maxCol; c++) {
        keys.add(cellKey(r, c));
      }
    }
    set({ selectedCells: keys, focusedCell: { row: toRow, col: toCol } });
  },

  toggleFreezeColumn: (col) =>
    set((state) => {
      const next = new Set(state.frozenColumns);
      if (next.has(col)) {
        next.delete(col);
      } else {
        next.add(col);
      }
      return { frozenColumns: next };
    }),

  resizeColumn: (col, width) =>
    set((state) => ({
      columnWidths: { ...state.columnWidths, [col]: Math.max(40, width) },
    })),

  clearSelection: () => set({ selectedCells: new Set(), focusedCell: null }),

  selectAll: (totalRows, totalCols) => {
    const keys = new Set<string>();
    for (let r = 0; r < totalRows; r++) {
      for (let c = 0; c < totalCols; c++) {
        keys.add(cellKey(r, c));
      }
    }
    set({ selectedCells: keys });
  },

  navigateCell: (direction, totalRows, totalCols) => {
    const { focusedCell } = get();
    if (!focusedCell) {
      set({ focusedCell: { row: 0, col: 0 }, selectedCells: new Set([cellKey(0, 0)]) });
      return;
    }
    let { row, col } = focusedCell;
    if (direction === 'up') row = Math.max(0, row - 1);
    else if (direction === 'down') row = Math.min(totalRows - 1, row + 1);
    else if (direction === 'left') col = Math.max(0, col - 1);
    else if (direction === 'right') col = Math.min(totalCols - 1, col + 1);
    set({ focusedCell: { row, col }, selectedCells: new Set([cellKey(row, col)]) });
  },
}));

export { cellKey };
