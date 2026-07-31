import { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Bug,
  Lightbulb,
  Heart,
  HelpCircle,
  Camera,
  X,
  CheckCircle2,
  Square,
  Type as TypeIcon,
  Eraser,
  MessageSquare,
} from 'lucide-react';
import { cn } from '../../utils/cn';
import { useFeedbackStore, type Annotation, type FeedbackType } from './useFeedbackStore';
import { captureViewportScreenshot } from './ScreenshotCapture';

const TYPE_OPTIONS: Array<{ value: FeedbackType; label: string; emoji: string; icon: typeof Bug }> = [
  { value: 'bug', label: 'Bug', emoji: '🐞', icon: Bug },
  { value: 'idea', label: 'Idea', emoji: '💡', icon: Lightbulb },
  { value: 'praise', label: 'Praise', emoji: '❤️', icon: Heart },
  { value: 'other', label: 'Other', emoji: '❓', icon: HelpCircle },
];

const ANNOTATION_COLORS = ['#f59e0b', '#ef4444', '#38bdf8', '#22c55e'];

const CANVAS_WIDTH = 420;
const CANVAS_HEIGHT = 236;

type Tool = 'rect' | 'text' | null;

export function FeedbackWidget() {
  const isOpen = useFeedbackStore((s) => s.isWidgetOpen);
  const openWidget = useFeedbackStore((s) => s.openWidget);
  const closeWidget = useFeedbackStore((s) => s.closeWidget);
  const submissions = useFeedbackStore((s) => s.submissions);
  const submit = useFeedbackStore((s) => s.submit);

  const [type, setType] = useState<FeedbackType>('bug');
  const [message, setMessage] = useState('');
  const [screenshot, setScreenshot] = useState<string | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [annotations, setAnnotations] = useState<Annotation[]>([]);
  const [tool, setTool] = useState<Tool>(null);
  const [color, setColor] = useState(ANNOTATION_COLORS[0]);
  const [pendingText, setPendingText] = useState<{ x: number; y: number; value: string } | null>(null);
  const [justSubmitted, setJustSubmitted] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const dragStartRef = useRef<{ x: number; y: number } | null>(null);
  const [dragPreview, setDragPreview] = useState<Annotation | null>(null);

  const recent = useMemo(() => submissions.slice(0, 3), [submissions]);

  // ─── Canvas drawing ────────────────────────────────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const all = dragPreview ? [...annotations, dragPreview] : annotations;

    for (const annotation of all) {
      ctx.strokeStyle = annotation.color;
      ctx.fillStyle = annotation.color;
      ctx.lineWidth = 2;

      if (annotation.type === 'rect') {
        ctx.strokeRect(annotation.x, annotation.y, annotation.width ?? 0, annotation.height ?? 0);
      } else if (annotation.type === 'text' && annotation.text) {
        ctx.font = '600 13px Inter, sans-serif';
        const padding = 4;
        const textWidth = ctx.measureText(annotation.text).width;
        ctx.fillStyle = annotation.color;
        ctx.globalAlpha = 0.9;
        ctx.fillRect(annotation.x, annotation.y - 16, textWidth + padding * 2, 20);
        ctx.globalAlpha = 1;
        ctx.fillStyle = '#0a0f1a';
        ctx.fillText(annotation.text, annotation.x + padding, annotation.y - 2);
      }
    }
  }, [annotations, dragPreview]);

  function canvasPointFromEvent(e: React.MouseEvent<HTMLCanvasElement>) {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return { x: (e.clientX - rect.left) * scaleX, y: (e.clientY - rect.top) * scaleY };
  }

  function handleCanvasMouseDown(e: React.MouseEvent<HTMLCanvasElement>) {
    const point = canvasPointFromEvent(e);
    if (tool === 'rect') {
      dragStartRef.current = point;
      setDragPreview({ id: 'preview', type: 'rect', x: point.x, y: point.y, width: 0, height: 0, color });
    } else if (tool === 'text') {
      setPendingText({ x: point.x, y: point.y, value: '' });
    }
  }

  function handleCanvasMouseMove(e: React.MouseEvent<HTMLCanvasElement>) {
    if (tool !== 'rect' || !dragStartRef.current) return;
    const point = canvasPointFromEvent(e);
    const start = dragStartRef.current;
    setDragPreview({
      id: 'preview',
      type: 'rect',
      x: Math.min(start.x, point.x),
      y: Math.min(start.y, point.y),
      width: Math.abs(point.x - start.x),
      height: Math.abs(point.y - start.y),
      color,
    });
  }

  function handleCanvasMouseUp() {
    if (tool === 'rect' && dragPreview && (dragPreview.width ?? 0) > 4 && (dragPreview.height ?? 0) > 4) {
      setAnnotations((prev) => [...prev, { ...dragPreview, id: crypto.randomUUID() }]);
    }
    dragStartRef.current = null;
    setDragPreview(null);
  }

  function confirmPendingText() {
    if (pendingText && pendingText.value.trim()) {
      setAnnotations((prev) => [
        ...prev,
        { id: crypto.randomUUID(), type: 'text', x: pendingText.x, y: pendingText.y, text: pendingText.value.trim(), color },
      ]);
    }
    setPendingText(null);
  }

  async function handleCapture() {
    setIsCapturing(true);
    try {
      const dataUrl = await captureViewportScreenshot();
      setScreenshot(dataUrl);
      setAnnotations([]);
    } finally {
      setIsCapturing(false);
    }
  }

  function resetForm() {
    setType('bug');
    setMessage('');
    setScreenshot(null);
    setAnnotations([]);
    setTool(null);
    setPendingText(null);
  }

  function handleSubmit() {
    if (!message.trim()) return;
    submit({ type, message: message.trim(), screenshotDataUrl: screenshot, annotations });
    setJustSubmitted(true);
    resetForm();
    setTimeout(() => setJustSubmitted(false), 1800);
  }

  return (
    <>
      {/* Floating vertical tab, Intercom/Canny style */}
      {!isOpen && (
        <button
          type="button"
          onClick={openWidget}
          className="fixed bottom-24 right-0 z-50 flex items-center gap-1.5 rounded-t-md bg-[var(--brand)] px-3 py-2 text-xs font-semibold text-white shadow-card-lg hover:bg-[var(--brand-hover)] transition-colors"
          style={{ transform: 'rotate(-90deg) translate(50%, 0)', transformOrigin: 'bottom right' }}
        >
          <MessageSquare size={14} />
          Feedback
        </button>
      )}

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.97 }}
            transition={{ type: 'spring', stiffness: 420, damping: 32 }}
            className="fixed bottom-6 right-6 z-50 flex w-[26rem] max-h-[85vh] flex-col overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--bg-panel)] shadow-card-lg"
          >
            <header className="flex items-center justify-between border-b border-[var(--border)] px-4 py-3">
              <h3 className="text-sm font-semibold text-[var(--text-primary)]">Send feedback</h3>
              <button
                type="button"
                onClick={closeWidget}
                className="text-[var(--text-muted)] hover:text-[var(--text-primary)]"
              >
                <X size={16} />
              </button>
            </header>

            <div className="flex-1 overflow-y-auto px-4 py-3 flex flex-col gap-3">
              {justSubmitted ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.6 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ type: 'spring', stiffness: 380, damping: 18 }}
                  className="flex flex-col items-center justify-center gap-2 py-8"
                >
                  <CheckCircle2 size={40} className="text-success-500" />
                  <p className="text-sm font-medium text-[var(--text-primary)]">Thanks for the feedback!</p>
                </motion.div>
              ) : (
                <>
                  <div className="grid grid-cols-4 gap-1.5">
                    {TYPE_OPTIONS.map((opt) => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setType(opt.value)}
                        className={cn(
                          'flex flex-col items-center gap-1 rounded-lg border px-2 py-2 text-xs transition-colors',
                          type === opt.value
                            ? 'border-[var(--brand)] bg-[var(--brand-subtle)] text-[var(--brand)]'
                            : 'border-[var(--border)] text-[var(--text-secondary)] hover:bg-[var(--bg-panel-hover)]',
                        )}
                      >
                        <span className="text-base leading-none">{opt.emoji}</span>
                        {opt.label}
                      </button>
                    ))}
                  </div>

                  <textarea
                    className="input min-h-[72px] resize-none"
                    placeholder="What happened, or what's on your mind?"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                  />

                  {!screenshot ? (
                    <button
                      type="button"
                      onClick={handleCapture}
                      disabled={isCapturing}
                      className="flex items-center justify-center gap-2 rounded-md border border-dashed border-[var(--border-strong)] py-2.5 text-xs font-medium text-[var(--text-secondary)] hover:border-[var(--brand)] hover:text-[var(--brand)] transition-colors disabled:opacity-50"
                    >
                      <Camera size={14} />
                      {isCapturing ? 'Capturing…' : 'Attach screenshot'}
                    </button>
                  ) : (
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setTool(tool === 'rect' ? null : 'rect')}
                          className={cn(
                            'flex items-center gap-1 rounded-md border px-2 py-1 text-[0.6875rem]',
                            tool === 'rect'
                              ? 'border-[var(--brand)] text-[var(--brand)] bg-[var(--brand-subtle)]'
                              : 'border-[var(--border)] text-[var(--text-secondary)]',
                          )}
                        >
                          <Square size={12} /> Rectangle
                        </button>
                        <button
                          type="button"
                          onClick={() => setTool(tool === 'text' ? null : 'text')}
                          className={cn(
                            'flex items-center gap-1 rounded-md border px-2 py-1 text-[0.6875rem]',
                            tool === 'text'
                              ? 'border-[var(--brand)] text-[var(--brand)] bg-[var(--brand-subtle)]'
                              : 'border-[var(--border)] text-[var(--text-secondary)]',
                          )}
                        >
                          <TypeIcon size={12} /> Callout
                        </button>
                        <div className="flex items-center gap-1 ml-1">
                          {ANNOTATION_COLORS.map((c) => (
                            <button
                              key={c}
                              type="button"
                              onClick={() => setColor(c)}
                              className={cn('h-4 w-4 rounded-full border-2', color === c ? 'border-[var(--text-primary)]' : 'border-transparent')}
                              style={{ backgroundColor: c }}
                            />
                          ))}
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setScreenshot(null);
                            setAnnotations([]);
                            setTool(null);
                          }}
                          className="ml-auto flex items-center gap-1 text-[0.6875rem] text-[var(--text-muted)] hover:text-danger-500"
                        >
                          <Eraser size={12} /> Remove
                        </button>
                      </div>

                      <div
                        className="relative overflow-hidden rounded-md border border-[var(--border)]"
                        style={{ width: CANVAS_WIDTH, height: CANVAS_HEIGHT }}
                      >
                        <img
                          src={screenshot}
                          alt="Captured screenshot"
                          className="absolute inset-0 h-full w-full object-cover"
                          draggable={false}
                        />
                        <canvas
                          ref={canvasRef}
                          width={CANVAS_WIDTH}
                          height={CANVAS_HEIGHT}
                          className="absolute inset-0 h-full w-full"
                          style={{ cursor: tool ? 'crosshair' : 'default' }}
                          onMouseDown={handleCanvasMouseDown}
                          onMouseMove={handleCanvasMouseMove}
                          onMouseUp={handleCanvasMouseUp}
                          onMouseLeave={handleCanvasMouseUp}
                        />
                        {pendingText && (
                          <input
                            autoFocus
                            value={pendingText.value}
                            onChange={(e) => setPendingText({ ...pendingText, value: e.target.value })}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') confirmPendingText();
                              if (e.key === 'Escape') setPendingText(null);
                            }}
                            onBlur={confirmPendingText}
                            placeholder="Callout text…"
                            className="absolute z-10 rounded border border-[var(--brand)] bg-[var(--bg-panel)] px-1.5 py-0.5 text-xs text-[var(--text-primary)] outline-none"
                            style={{ left: pendingText.x, top: Math.max(0, pendingText.y - 12) }}
                          />
                        )}
                      </div>
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={handleSubmit}
                    disabled={!message.trim()}
                    className="mt-1 flex items-center justify-center rounded-md bg-[var(--brand)] py-2 text-sm font-semibold text-white hover:bg-[var(--brand-hover)] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    Submit feedback
                  </button>
                </>
              )}

              {recent.length > 0 && (
                <div className="mt-2 border-t border-[var(--border)] pt-2.5">
                  <p className="text-[0.6875rem] font-medium uppercase tracking-wide text-[var(--text-muted)] mb-1.5">
                    Recent feedback
                  </p>
                  <ul className="flex flex-col gap-1.5">
                    {recent.map((item) => {
                      const opt = TYPE_OPTIONS.find((t) => t.value === item.type);
                      return (
                        <li key={item.id} className="flex items-start gap-2 text-xs text-[var(--text-secondary)]">
                          <span>{opt?.emoji}</span>
                          <span className="line-clamp-1 flex-1">{item.message}</span>
                          <span className="text-[var(--text-muted)] shrink-0">
                            {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
