import { useCallback, useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Plus, Filter, GitMerge, ArrowRight, LayoutGrid, Trash2 } from 'lucide-react';
import { cn } from '../../utils/cn';

// ─── Hook ─────────────────────────────────────────────────────────────────────

interface ContextMenuState {
  isOpen: boolean;
  x: number;
  y: number;
}

interface UseContextMenuReturn {
  isOpen: boolean;
  position: { x: number; y: number };
  open: (x: number, y: number) => void;
  close: () => void;
  onContextMenu: (e: React.MouseEvent) => void;
}

export function useContextMenu(): UseContextMenuReturn {
  const [state, setState] = useState<ContextMenuState>({ isOpen: false, x: 0, y: 0 });

  const open = useCallback((x: number, y: number) => {
    setState({ isOpen: true, x, y });
  }, []);

  const close = useCallback(() => {
    setState((s) => ({ ...s, isOpen: false }));
  }, []);

  const onContextMenu = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      open(e.clientX, e.clientY);
    },
    [open],
  );

  return { isOpen: state.isOpen, position: { x: state.x, y: state.y }, open, close, onContextMenu };
}

// ─── Actions ──────────────────────────────────────────────────────────────────

interface RadialAction {
  id: string;
  label: string;
  icon: React.ReactNode;
  color: string;
  action: () => void;
}

// ─── Component ────────────────────────────────────────────────────────────────

interface RadialContextMenuProps {
  isOpen: boolean;
  position: { x: number; y: number };
  onClose: () => void;
  onAddModelNode?: () => void;
  onAddFilterNode?: () => void;
  onAddLogicNode?: () => void;
  onAddOutputNode?: () => void;
  onAutoLayout?: () => void;
  onClearCanvas?: () => void;
}

const RADIUS = 70; // px distance from center

export function RadialContextMenu({
  isOpen,
  position,
  onClose,
  onAddModelNode,
  onAddFilterNode,
  onAddLogicNode,
  onAddOutputNode,
  onAutoLayout,
  onClearCanvas,
}: RadialContextMenuProps) {
  const overlayRef = useRef<HTMLDivElement>(null);

  const actions: RadialAction[] = [
    {
      id: 'add-model',
      label: 'Add Model Node',
      icon: <Plus size={14} />,
      color: 'bg-accent-500 hover:bg-accent-400 border-accent-400/30',
      action: () => { onAddModelNode?.(); onClose(); },
    },
    {
      id: 'add-filter',
      label: 'Add Filter Node',
      icon: <Filter size={14} />,
      color: 'bg-blue-600 hover:bg-blue-500 border-blue-400/30',
      action: () => { onAddFilterNode?.(); onClose(); },
    },
    {
      id: 'add-logic',
      label: 'Add Logic Node',
      icon: <GitMerge size={14} />,
      color: 'bg-purple-600 hover:bg-purple-500 border-purple-400/30',
      action: () => { onAddLogicNode?.(); onClose(); },
    },
    {
      id: 'add-output',
      label: 'Add Output Node',
      icon: <ArrowRight size={14} />,
      color: 'bg-emerald-600 hover:bg-emerald-500 border-emerald-400/30',
      action: () => { onAddOutputNode?.(); onClose(); },
    },
    {
      id: 'auto-layout',
      label: 'Auto-layout',
      icon: <LayoutGrid size={14} />,
      color: 'bg-amber-600 hover:bg-amber-500 border-amber-400/30',
      action: () => { onAutoLayout?.(); onClose(); },
    },
    {
      id: 'clear-canvas',
      label: 'Clear Canvas',
      icon: <Trash2 size={14} />,
      color: 'bg-red-700 hover:bg-red-600 border-red-400/30',
      action: () => { onClearCanvas?.(); onClose(); },
    },
  ];

  // Arc layout: spread actions in a semicircle from 210° to 330° (upward arc)
  const totalActions = actions.length;
  const startAngle = -150; // degrees (top-left start)
  const endAngle = -30;   // degrees (top-right end)
  const angleStep = (endAngle - startAngle) / (totalActions - 1);

  // Escape / click-outside to close
  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isOpen, onClose]);

  // Hover label state
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  return (
    <AnimatePresence>
      {isOpen && (
        <div
          ref={overlayRef}
          className="fixed inset-0 z-50"
          onMouseDown={(e) => {
            if (e.target === overlayRef.current) onClose();
          }}
        >
          {/* Center hub */}
          <motion.div
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0 }}
            transition={{ type: 'spring', stiffness: 500, damping: 28 }}
            className="absolute w-3 h-3 rounded-full bg-surface-400 border border-surface-300"
            style={{ left: position.x - 6, top: position.y - 6 }}
          />

          {/* Radial action buttons */}
          {actions.map((action, i) => {
            const angleDeg = startAngle + i * angleStep;
            const angleRad = (angleDeg * Math.PI) / 180;
            const bx = position.x + RADIUS * Math.cos(angleRad);
            const by = position.y + RADIUS * Math.sin(angleRad);

            return (
              <motion.div
                key={action.id}
                initial={{ opacity: 0, x: position.x - 18, y: position.y - 18, scale: 0.3 }}
                animate={{ opacity: 1, x: bx - 18, y: by - 18, scale: 1 }}
                exit={{ opacity: 0, x: position.x - 18, y: position.y - 18, scale: 0.3 }}
                transition={{
                  type: 'spring',
                  stiffness: 380,
                  damping: 22,
                  delay: i * 0.03,
                }}
                className="absolute"
                style={{ width: 36, height: 36 }}
              >
                <button
                  onClick={action.action}
                  onMouseEnter={() => setHoveredId(action.id)}
                  onMouseLeave={() => setHoveredId(null)}
                  className={cn(
                    'w-full h-full rounded-full flex items-center justify-center',
                    'text-white border shadow-lg shadow-black/30',
                    'transition-transform duration-100 active:scale-90',
                    action.color,
                  )}
                  aria-label={action.label}
                >
                  {action.icon}
                </button>

                {/* Tooltip */}
                <AnimatePresence>
                  {hoveredId === action.id && (
                    <motion.span
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 4 }}
                      transition={{ duration: 0.12 }}
                      className={cn(
                        'absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5',
                        'whitespace-nowrap px-2 py-1 rounded-md',
                        'text-[0.65rem] font-medium',
                        'bg-surface-800 text-surface-200 border border-surface-700',
                        'pointer-events-none shadow-lg',
                      )}
                    >
                      {action.label}
                    </motion.span>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>
      )}
    </AnimatePresence>
  );
}
