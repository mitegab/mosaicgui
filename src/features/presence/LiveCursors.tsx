import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { MousePointer2 } from 'lucide-react';
import { usePresenceStore } from './usePresenceStore';
import { cn } from '../../utils/cn';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function timeAgo(iso: string): string {
  const diffSeconds = Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 1000));
  if (diffSeconds < 3) return 'just now';
  if (diffSeconds < 60) return `${diffSeconds}s ago`;
  const minutes = Math.floor(diffSeconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  return `${hours}h ago`;
}

// ---------------------------------------------------------------------------
// Remote cursor
// ---------------------------------------------------------------------------

function RemoteCursor({
  x,
  y,
  name,
  color,
}: {
  x: number;
  y: number;
  name: string;
  color: string;
}) {
  return (
    <motion.div
      className="pointer-events-none fixed left-0 top-0 z-[9999]"
      initial={{ x, y, opacity: 0 }}
      animate={{ x, y, opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ type: 'spring', stiffness: 320, damping: 28, mass: 0.6 }}
    >
      <MousePointer2 size={18} style={{ color, fill: color }} strokeWidth={1.5} />
      <div
        className="mt-0.5 ml-3 whitespace-nowrap rounded-md px-1.5 py-0.5 text-[10px] font-medium text-white shadow-card"
        style={{ background: color }}
      >
        {name}
      </div>
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Presence stack (avatars)
// ---------------------------------------------------------------------------

function PresenceAvatar({
  name,
  color,
  initials,
  lastActiveAt,
  isYou,
}: {
  name: string;
  color: string;
  initials: string;
  lastActiveAt: string;
  isYou?: boolean;
}) {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      className="relative"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div
        className="flex h-7 w-7 items-center justify-center rounded-full text-[10px] font-semibold text-white ring-2 ring-surface-900 shadow-card"
        style={{ background: color }}
      >
        {initials}
      </div>
      <AnimatePresence>
        {hovered && (
          <motion.div
            initial={{ opacity: 0, y: -4, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.95 }}
            transition={{ duration: 0.12 }}
            className="absolute right-0 top-full z-50 mt-2 w-max rounded-md border border-white/10 bg-surface-900 px-2 py-1 text-[11px] text-white/80 shadow-card-lg"
          >
            <div className="font-medium text-white">{isYou ? `${name} (you)` : name}</div>
            <div className="text-white/40">active {timeAgo(lastActiveAt)}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function PresenceStack({ className }: { className?: string }) {
  const collaborators = usePresenceStore((s) => s.collaborators);
  const localUser = usePresenceStore((s) => s.localUser);

  const all = [
    { ...localUser, isYou: true },
    ...collaborators.map((c) => ({ ...c, isYou: false })),
  ];

  const visible = all.slice(0, 4);
  const overflow = all.length - visible.length;

  return (
    <div className={cn('flex items-center -space-x-2', className)}>
      {visible.map((person) => (
        <PresenceAvatar
          key={person.id}
          name={person.name}
          color={person.color}
          initials={person.avatarInitials}
          lastActiveAt={person.lastActiveAt}
          isYou={person.isYou}
        />
      ))}
      {overflow > 0 && (
        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-surface-700 text-[10px] font-semibold text-white/70 ring-2 ring-surface-900">
          +{overflow}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Live cursor overlay
// ---------------------------------------------------------------------------

export function LiveCursors() {
  const collaborators = usePresenceStore((s) => s.collaborators);
  const updateCursor = usePresenceStore((s) => s.updateCursor);
  const localUserId = usePresenceStore((s) => s.localUser.id);

  useEffect(() => {
    const handleMove = (event: MouseEvent) => {
      updateCursor(event.clientX, event.clientY);
    };
    window.addEventListener('mousemove', handleMove);
    return () => window.removeEventListener('mousemove', handleMove);
  }, [updateCursor]);

  return (
    <>
      <AnimatePresence>
        {collaborators
          .filter((c) => c.id !== localUserId && c.cursor)
          .map((c) => (
            <RemoteCursor key={c.id} x={c.cursor!.x} y={c.cursor!.y} name={c.name} color={c.color} />
          ))}
      </AnimatePresence>
    </>
  );
}

export default LiveCursors;
