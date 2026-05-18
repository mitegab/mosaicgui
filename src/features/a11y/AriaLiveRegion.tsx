import { useEffect, useState } from 'react';
import { useA11yStore } from './useA11yStore';

// ─── AriaLiveRegion ────────────────────────────────────────────────────────
//
// Visually hidden but announced to screen readers via aria-live="polite".
// Subscribes to the announcements array in the a11y store and auto-clears
// after 3 seconds.

export function AriaLiveRegion() {
  const announcements = useA11yStore((s) => s.announcements);
  const [displayed, setDisplayed] = useState('');

  // Show the latest announcement and clear after 3 s
  useEffect(() => {
    if (announcements.length === 0) return;
    const latest = announcements[announcements.length - 1];
    setDisplayed(latest);

    const timer = setTimeout(() => setDisplayed(''), 3000);
    return () => clearTimeout(timer);
  }, [announcements]);

  return (
    <div
      role="status"
      aria-live="polite"
      aria-atomic="true"
      // Visually hidden — equivalent to Tailwind's sr-only
      style={{
        position: 'absolute',
        width: 1,
        height: 1,
        padding: 0,
        margin: -1,
        overflow: 'hidden',
        clip: 'rect(0,0,0,0)',
        whiteSpace: 'nowrap',
        borderWidth: 0,
      }}
    >
      {displayed}
    </div>
  );
}
