import React, { memo, useState, useRef, useEffect, CSSProperties } from 'react';
import { cn } from '../../utils/cn';
import { cellKey } from './useGridState';

export interface GridCellData {
  rows: Record<string, unknown>[];
  columns: string[];
  selectedCells: Set<string>;
  focusedCell: { row: number; col: number } | null;
  frozenColumns: Set<number>;
  onCellClick: (row: number, col: number, shiftKey: boolean) => void;
  onCellDoubleClick: (row: number, col: number) => void;
  onCellEdit: (row: number, col: number, value: string) => void;
}

interface GridCellProps {
  rowIndex: number;
  columnIndex: number;
  style: CSSProperties;
  data: GridCellData;
}

const GridCell = memo(({ rowIndex, columnIndex, style, data }: GridCellProps) => {
  const { rows, columns, selectedCells, focusedCell, frozenColumns, onCellClick, onCellDoubleClick, onCellEdit } = data;

  const [editing, setEditing] = useState(false);
  const [editValue, setEditValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const row = rows[rowIndex];
  const col = columns[columnIndex];
  const rawValue = row ? row[col] : undefined;
  const displayValue = rawValue === null || rawValue === undefined ? '' : String(rawValue);

  const key = cellKey(rowIndex, columnIndex);
  const isSelected = selectedCells.has(key);
  const isFocused = focusedCell?.row === rowIndex && focusedCell?.col === columnIndex;
  const isFrozen = frozenColumns.has(columnIndex);

  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editing]);

  const handleDoubleClick = () => {
    setEditValue(displayValue);
    setEditing(true);
    onCellDoubleClick(rowIndex, columnIndex);
  };

  const handleBlur = () => {
    setEditing(false);
    onCellEdit(rowIndex, columnIndex, editValue);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === 'Escape') {
      if (e.key === 'Escape') setEditValue(displayValue);
      setEditing(false);
      if (e.key !== 'Escape') onCellEdit(rowIndex, columnIndex, editValue);
    }
  };

  const cellStyle: CSSProperties = {
    ...style,
    ...(isFrozen
      ? {
          position: 'sticky',
          left: 0,
          zIndex: 10,
          boxShadow: '2px 0 4px rgba(0,0,0,0.3)',
        }
      : {}),
  };

  return (
    <div
      style={cellStyle}
      title={displayValue}
      onClick={(e) => onCellClick(rowIndex, columnIndex, e.shiftKey)}
      onDoubleClick={handleDoubleClick}
      className={cn(
        'flex items-center px-2 text-xs border-b border-r border-[var(--border)] cursor-pointer select-none',
        'text-[var(--text-primary)] truncate transition-colors duration-75',
        isFrozen && 'bg-[var(--bg-panel)]',
        isSelected && !isFrozen && 'bg-accent-500/20',
        isSelected && isFrozen && 'bg-accent-500/30',
        isFocused && 'ring-2 ring-inset ring-accent-400',
        !isSelected && !isFrozen && 'hover:bg-[var(--bg-panel-hover)]',
      )}
    >
      {editing ? (
        <input
          ref={inputRef}
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          className="w-full bg-transparent outline-none text-xs text-[var(--text-primary)]"
          onClick={(e) => e.stopPropagation()}
        />
      ) : (
        <span className="truncate w-full">{displayValue}</span>
      )}
    </div>
  );
});

GridCell.displayName = 'GridCell';

export default GridCell;
