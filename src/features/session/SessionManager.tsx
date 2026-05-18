import { useRef, useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Save,
  RotateCcw,
  Download,
  Upload,
  Link2,
  Check,
  Clock,
  Monitor,
} from 'lucide-react';
import { useSessionPersistence } from './useSessionPersistence';
import { restoreSession, type SessionSnapshot } from './sessionSerializer';
import { cn } from '../../utils/cn';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const SESSION_HISTORY_KEY = 'mosaic-session-history';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function timeAgo(iso: string): string {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

function abbreviateUserAgent(ua: string): string {
  // Try to extract a short device/browser hint
  if (ua.includes('iPhone')) return 'iPhone';
  if (ua.includes('iPad')) return 'iPad';
  if (ua.includes('Android')) return 'Android';
  if (ua.includes('Mac OS X')) return 'macOS';
  if (ua.includes('Windows')) return 'Windows';
  if (ua.includes('Linux')) return 'Linux';
  return 'Unknown device';
}

function readHistory(): SessionSnapshot[] {
  try {
    const raw = localStorage.getItem(SESSION_HISTORY_KEY);
    return raw ? (JSON.parse(raw) as SessionSnapshot[]) : [];
  } catch {
    return [];
  }
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

interface ActionButtonProps {
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  hint?: string;
  variant?: 'default' | 'primary';
  disabled?: boolean;
}

function ActionButton({ onClick, icon, label, hint, variant = 'default', disabled }: ActionButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'flex items-center gap-2 w-full px-3 py-2 rounded-md text-sm transition-colors',
        variant === 'primary'
          ? 'bg-indigo-600 hover:bg-indigo-500 text-white'
          : 'bg-white/[0.05] hover:bg-white/10 text-white/80 hover:text-white',
        disabled && 'opacity-40 cursor-not-allowed pointer-events-none'
      )}
    >
      <span className="shrink-0">{icon}</span>
      <span className="flex-1 text-left">{label}</span>
      {hint && (
        <span className="text-[10px] text-white/30 font-mono">{hint}</span>
      )}
    </button>
  );
}

// ---------------------------------------------------------------------------
// SessionManager panel
// ---------------------------------------------------------------------------

export function SessionManager() {
  const { save, restore, exportToFile, importFromFile, copyShareLink } =
    useSessionPersistence();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [history, setHistory] = useState<SessionSnapshot[]>([]);
  const [copiedLink, setCopiedLink] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const [savedFlash, setSavedFlash] = useState(false);

  // Refresh history list whenever the component mounts
  useEffect(() => {
    setHistory(readHistory());
  }, []);

  // -------------------------------------------------------------------------
  // Handlers
  // -------------------------------------------------------------------------

  const handleSave = useCallback(() => {
    save();
    setHistory(readHistory());
    setSavedFlash(true);
    setTimeout(() => setSavedFlash(false), 1500);
  }, [save]);

  const handleRestore = useCallback(() => {
    restore();
  }, [restore]);

  const handleCopyLink = useCallback(() => {
    copyShareLink();
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  }, [copyShareLink]);

  const handleImportClick = useCallback(() => {
    setImportError(null);
    fileInputRef.current?.click();
  }, []);

  const handleFileChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      try {
        await importFromFile(file);
        setImportError(null);
      } catch (err) {
        setImportError(err instanceof Error ? err.message : 'Import failed');
      } finally {
        // Reset input so the same file can be re-imported
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    },
    [importFromFile]
  );

  const handleRestoreHistoryEntry = useCallback((snapshot: SessionSnapshot) => {
    restoreSession(snapshot);
  }, []);

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------

  const deviceHint = abbreviateUserAgent(navigator.userAgent);

  return (
    <div className="flex flex-col gap-4 p-4 text-sm">
      {/* Header */}
      <div className="flex items-center gap-2 text-white/60">
        <Monitor size={14} />
        <span className="text-xs">{deviceHint}</span>
      </div>

      {/* Primary actions */}
      <div className="flex flex-col gap-1.5">
        <ActionButton
          onClick={handleSave}
          icon={savedFlash ? <Check size={14} className="text-emerald-400" /> : <Save size={14} />}
          label={savedFlash ? 'Saved!' : 'Save Session'}
          hint="Ctrl+S"
          variant="primary"
        />
        <ActionButton
          onClick={handleRestore}
          icon={<RotateCcw size={14} />}
          label="Restore Last"
        />
      </div>

      {/* Divider */}
      <hr className="border-white/10" />

      {/* File operations */}
      <div className="flex flex-col gap-1.5">
        <ActionButton
          onClick={exportToFile}
          icon={<Download size={14} />}
          label="Export .mosaic file"
        />
        <ActionButton
          onClick={handleImportClick}
          icon={<Upload size={14} />}
          label="Import .mosaic file"
        />
        <input
          ref={fileInputRef}
          type="file"
          accept=".mosaic,application/json"
          className="hidden"
          onChange={handleFileChange}
        />
        {importError && (
          <p className="text-xs text-red-400 px-1">{importError}</p>
        )}
      </div>

      {/* Share link */}
      <ActionButton
        onClick={handleCopyLink}
        icon={copiedLink ? <Check size={14} className="text-emerald-400" /> : <Link2 size={14} />}
        label={copiedLink ? 'Link copied!' : 'Copy Share Link'}
      />

      {/* History */}
      {history.length > 0 && (
        <>
          <hr className="border-white/10" />
          <div>
            <p className="text-[11px] text-white/40 uppercase tracking-wider mb-2">
              Auto-save history
            </p>
            <ul className="flex flex-col gap-1">
              <AnimatePresence initial={false}>
                {history.map((snap, idx) => (
                  <motion.li
                    key={snap.capturedAt}
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    transition={{ duration: 0.15, delay: idx * 0.04 }}
                    className="flex items-center justify-between gap-2 px-3 py-1.5 rounded-md bg-white/[0.03] hover:bg-white/[0.06] transition-colors"
                  >
                    <div className="flex items-center gap-1.5 min-w-0">
                      <Clock size={11} className="text-white/30 shrink-0" />
                      <span className="text-xs text-white/50 truncate">
                        {timeAgo(snap.capturedAt)}
                      </span>
                    </div>
                    <button
                      onClick={() => handleRestoreHistoryEntry(snap)}
                      className="text-[10px] text-indigo-400 hover:text-indigo-300 transition-colors shrink-0"
                    >
                      Restore
                    </button>
                  </motion.li>
                ))}
              </AnimatePresence>
            </ul>
          </div>
        </>
      )}
    </div>
  );
}

export default SessionManager;
