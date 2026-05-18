import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  X,
  ChevronLeft,
  ChevronRight,
  SkipForward,
  Sparkles,
} from "lucide-react";
import { useTour } from "./useTour";
import { TOUR_STEPS, TourStep } from "./tourSteps";
import { cn } from "../../utils/cn";
import { Button } from "../../components/ui/Button";

// ─── Confetti ─────────────────────────────────────────────────────────────────

interface ConfettiPiece {
  id: number;
  x: number;
  y: number;
  color: string;
  rotation: number;
  scale: number;
  vx: number;
  vy: number;
  life: number;
}

const CONFETTI_COLORS = [
  "#4ade80",
  "#60a5fa",
  "#f59e0b",
  "#f472b6",
  "#a78bfa",
  "#34d399",
  "#fb923c",
  "#e879f9",
];

function useConfetti(trigger: boolean) {
  const [pieces, setPieces] = useState<ConfettiPiece[]>([]);

  useEffect(() => {
    if (!trigger) return;

    const cx = window.innerWidth / 2;
    const cy = window.innerHeight / 2;

    const newPieces: ConfettiPiece[] = Array.from({ length: 30 }, (_, i) => {
      const angle = Math.random() * Math.PI * 2;
      const speed = 120 + Math.random() * 200;
      return {
        id: i,
        x: cx,
        y: cy,
        color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
        rotation: Math.random() * 360,
        scale: 0.6 + Math.random() * 0.8,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 1,
      };
    });

    setPieces(newPieces);
    const timer = setTimeout(() => setPieces([]), 2500);
    return () => clearTimeout(timer);
  }, [trigger]);

  return pieces;
}

// ─── Spotlight rect ───────────────────────────────────────────────────────────

interface Rect {
  top: number;
  left: number;
  width: number;
  height: number;
}

function getTargetRect(selector: string): Rect | null {
  try {
    const el = document.querySelector(selector) as HTMLElement | null;
    if (!el) return null;
    const r = el.getBoundingClientRect();
    return { top: r.top, left: r.left, width: r.width, height: r.height };
  } catch {
    return null;
  }
}

// ─── Tooltip card ─────────────────────────────────────────────────────────────

const CARD_OFFSET = 14;

function tooltipPosition(
  rect: Rect | null,
  placement: TourStep["placement"],
  cardW: number,
  cardH: number,
): { top: number; left: number } {
  if (!rect) {
    return {
      top: window.innerHeight / 2 - cardH / 2,
      left: window.innerWidth / 2 - cardW / 2,
    };
  }
  const pad = CARD_OFFSET;
  switch (placement) {
    case "top":
      return {
        top: rect.top - cardH - pad,
        left: rect.left + rect.width / 2 - cardW / 2,
      };
    case "bottom":
      return {
        top: rect.top + rect.height + pad,
        left: rect.left + rect.width / 2 - cardW / 2,
      };
    case "left":
      return {
        top: rect.top + rect.height / 2 - cardH / 2,
        left: rect.left - cardW - pad,
      };
    case "right":
      return {
        top: rect.top + rect.height / 2 - cardH / 2,
        left: rect.left + rect.width + pad,
      };
  }
}

// ─── Welcome banner ───────────────────────────────────────────────────────────

function WelcomeBanner() {
  const { start, hasCompleted } = useTour();
  if (hasCompleted) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -16 }}
      transition={{ type: "spring", stiffness: 300, damping: 24 }}
      className={cn(
        "fixed top-4 left-1/2 -translate-x-1/2 z-40",
        "flex items-center gap-3 px-4 py-2.5 rounded-xl",
        "bg-surface-850 border border-surface-700 shadow-xl shadow-black/40",
        "text-sm text-surface-200",
      )}
    >
      <Sparkles size={16} className="text-accent-400 shrink-0" />
      <span>New here? Take a quick tour of Mosaic.</span>
      <Button variant="primary" size="sm" onClick={start}>
        Start Tour
      </Button>
      <button
        onClick={() => useTour.getState().complete()}
        className="text-surface-500 hover:text-surface-300 transition-colors ml-1"
        aria-label="Dismiss"
      >
        <X size={14} />
      </button>
    </motion.div>
  );
}

// ─── Main spotlight component ─────────────────────────────────────────────────

const PADDING = 8; // spotlight padding around target

export function TourSpotlight() {
  const { isActive, currentStep, hasCompleted, next, prev, skip, complete } =
    useTour();
  const step = TOUR_STEPS[currentStep];
  const isLast = currentStep === TOUR_STEPS.length - 1;

  const [rect, setRect] = useState<Rect | null>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const [cardSize, setCardSize] = useState({ w: 320, h: 180 });

  // Measure target on each step change
  useLayoutEffect(() => {
    if (!isActive || !step) return;
    const update = () => {
      const r = getTargetRect(step.target);
      setRect(r);
    };
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, [isActive, currentStep, step]);

  // Measure tooltip card size
  useLayoutEffect(() => {
    if (cardRef.current) {
      const r = cardRef.current.getBoundingClientRect();
      setCardSize({ w: r.width, h: r.height });
    }
  });

  // Confetti on last step completion
  const [showConfetti, setShowConfetti] = useState(false);
  const confettiPieces = useConfetti(showConfetti);

  const handleComplete = () => {
    setShowConfetti(true);
    setTimeout(() => {
      complete();
      setShowConfetti(false);
    }, 400);
  };

  // Animated spotlight position (spring)
  const spotlightTop = rect ? rect.top - PADDING : window.innerHeight / 2 - 40;
  const spotlightLeft = rect ? rect.left - PADDING : window.innerWidth / 2 - 40;
  const spotlightWidth = rect ? rect.width + PADDING * 2 : 80;
  const spotlightHeight = rect ? rect.height + PADDING * 2 : 80;

  const tipPos = tooltipPosition(
    rect
      ? {
          top: spotlightTop,
          left: spotlightLeft,
          width: spotlightWidth,
          height: spotlightHeight,
        }
      : null,
    step?.placement ?? "bottom",
    cardSize.w,
    cardSize.h,
  );

  // Clamp to viewport
  const clampedTipLeft = Math.max(
    8,
    Math.min(tipPos.left, window.innerWidth - cardSize.w - 8),
  );
  const clampedTipTop = Math.max(
    8,
    Math.min(tipPos.top, window.innerHeight - cardSize.h - 8),
  );

  return (
    <>
      {/* Welcome banner (shown when tour not yet completed and not active) */}
      <AnimatePresence>
        {!isActive && !hasCompleted && <WelcomeBanner key="welcome-banner" />}
      </AnimatePresence>

      {/* Confetti burst */}
      {confettiPieces.map((piece) => (
        <motion.div
          key={piece.id}
          initial={{
            x: piece.x,
            y: piece.y,
            opacity: 1,
            scale: piece.scale,
            rotate: piece.rotation,
          }}
          animate={{
            x: piece.x + piece.vx,
            y: piece.y + piece.vy + 120,
            opacity: 0,
            scale: piece.scale * 0.4,
            rotate: piece.rotation + 360,
          }}
          transition={{ duration: 1.8 + Math.random() * 0.6, ease: "easeOut" }}
          className="fixed z-[70] w-3 h-2 rounded-sm pointer-events-none"
          style={{
            backgroundColor: piece.color,
            top: 0,
            left: 0,
          }}
        />
      ))}

      <AnimatePresence>
        {isActive && step && (
          <>
            {/* Dark overlay with cutout via clip-path / box-shadow trick */}
            <motion.div
              key="spotlight-overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-50 pointer-events-none"
              style={{
                background: "rgba(0,0,0,0.65)",
                // Cut out the spotlight area using a radial gradient mask trick
                WebkitMaskImage: rect
                  ? `path('M 0 0 L ${window.innerWidth} 0 L ${window.innerWidth} ${window.innerHeight} L 0 ${window.innerHeight} Z M ${spotlightLeft + spotlightWidth / 2} ${spotlightTop + spotlightHeight / 2} m -${spotlightWidth / 2} 0 a ${spotlightWidth / 2} ${spotlightHeight / 2} 0 1 0 ${spotlightWidth} 0 a ${spotlightWidth / 2} ${spotlightHeight / 2} 0 1 0 -${spotlightWidth} 0')`
                  : undefined,
              }}
            />

            {/* Spotlight highlight ring */}
            {rect && (
              <motion.div
                key="spotlight-ring"
                initial={{ opacity: 0, scale: 1.15 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                transition={{ type: "spring", stiffness: 300, damping: 26 }}
                className="fixed z-50 pointer-events-none rounded-xl border-2 border-accent-400/80 shadow-[0_0_0_4px_rgba(99,102,241,0.15)]"
                style={{
                  top: spotlightTop,
                  left: spotlightLeft,
                  width: spotlightWidth,
                  height: spotlightHeight,
                }}
              />
            )}

            {/* Tooltip card */}
            <motion.div
              ref={cardRef}
              key={`tooltip-${currentStep}`}
              initial={{ opacity: 0, scale: 0.92, y: 6 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: 6 }}
              transition={{ type: "spring", stiffness: 380, damping: 26 }}
              className={cn(
                "fixed z-[60] w-80 rounded-xl overflow-hidden",
                "bg-surface-900 border border-surface-700",
                "shadow-2xl shadow-black/60",
              )}
              style={{ top: clampedTipTop, left: clampedTipLeft }}
            >
              {/* Header */}
              <div className="flex items-start justify-between gap-2 px-4 pt-4 pb-2">
                <div>
                  <div className="text-[0.65rem] font-semibold uppercase tracking-wider text-accent-400 mb-0.5">
                    Step {currentStep + 1} of {TOUR_STEPS.length}
                  </div>
                  <h3 className="text-sm font-semibold text-surface-100">
                    {step.title}
                  </h3>
                </div>
                <button
                  onClick={skip}
                  className="text-surface-500 hover:text-surface-300 transition-colors shrink-0 mt-0.5"
                  aria-label="Skip tour"
                >
                  <X size={14} />
                </button>
              </div>

              {/* Progress bar */}
              <div className="mx-4 mb-3 h-1 bg-surface-800 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-accent-500 rounded-full"
                  initial={{ width: 0 }}
                  animate={{
                    width: `${((currentStep + 1) / TOUR_STEPS.length) * 100}%`,
                  }}
                  transition={{ duration: 0.35 }}
                />
              </div>

              {/* Content */}
              <p className="px-4 pb-4 text-[0.8125rem] text-surface-400 leading-relaxed">
                {step.content}
              </p>

              {/* Footer */}
              <div className="flex items-center justify-between gap-2 px-4 py-3 border-t border-surface-800">
                <button
                  onClick={skip}
                  className="flex items-center gap-1 text-xs text-surface-500 hover:text-surface-300 transition-colors"
                >
                  <SkipForward size={11} />
                  Skip tour
                </button>
                <div className="flex items-center gap-2">
                  {currentStep > 0 && (
                    <Button variant="ghost" size="sm" onClick={prev}>
                      <ChevronLeft size={13} />
                      Back
                    </Button>
                  )}
                  {isLast ? (
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={handleComplete}
                    >
                      <Sparkles size={12} />
                      Finish!
                    </Button>
                  ) : (
                    <Button variant="primary" size="sm" onClick={next}>
                      Next
                      <ChevronRight size={13} />
                    </Button>
                  )}
                </div>
              </div>
            </motion.div>

            {/* Click-through blocker (pointer events on overlay) */}
            <div
              className="fixed inset-0 z-[55]"
              onClick={skip}
              style={{
                pointerEvents: "auto",
                cursor: "default",
                background: "transparent",
              }}
            />
          </>
        )}
      </AnimatePresence>
    </>
  );
}
