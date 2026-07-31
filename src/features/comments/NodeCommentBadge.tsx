import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { MessageCircle, Send, Check, RotateCcw } from 'lucide-react';
import { useCommentsStore, type CommentThread } from './useCommentsStore';
import { usePresenceStore } from '../presence/usePresenceStore';
import { cn } from '../../utils/cn';

const REACTIONS = ['👍', '🎉', '❤️'];

function timeAgo(iso: string): string {
  const diffSeconds = Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 1000));
  if (diffSeconds < 60) return 'just now';
  const minutes = Math.floor(diffSeconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

function AuthorChip({ author }: { author: string }) {
  const initials = author
    .split(' ')
    .filter(Boolean)
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
  return (
    <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-teal-500/20 text-[9px] font-semibold text-teal-300">
      {initials}
    </div>
  );
}

function ThreadCard({ thread, author }: { thread: CommentThread; author: string }) {
  const addReply = useCommentsStore((s) => s.addReply);
  const toggleReaction = useCommentsStore((s) => s.toggleReaction);
  const resolveThread = useCommentsStore((s) => s.resolveThread);
  const reopenThread = useCommentsStore((s) => s.reopenThread);
  const [draft, setDraft] = useState('');

  const submit = () => {
    if (!draft.trim()) return;
    addReply(thread.id, draft.trim(), author);
    setDraft('');
  };

  return (
    <div className="rounded-md border border-white/10 bg-white/[0.02] p-2">
      <div className="max-h-48 space-y-2 overflow-y-auto pr-1">
        {thread.messages.map((message) => (
          <div key={message.id} className="flex gap-2">
            <AuthorChip author={message.author} />
            <div className="min-w-0 flex-1">
              <div className="flex items-baseline gap-1.5">
                <span className="text-[11px] font-semibold text-white/80">{message.author}</span>
                <span className="text-[10px] text-white/30">{timeAgo(message.createdAt)}</span>
              </div>
              <p className="text-xs text-white/70 break-words">{message.text}</p>
              <div className="mt-1 flex gap-1">
                {REACTIONS.map((emoji) => (
                  <button
                    key={emoji}
                    onClick={() => toggleReaction(thread.id, message.id, emoji)}
                    className="flex items-center gap-1 rounded-full border border-white/10 bg-white/[0.03] px-1.5 py-0.5 text-[10px] text-white/60 hover:bg-white/10"
                  >
                    <span>{emoji}</span>
                    {message.reactions[emoji] ? <span>{message.reactions[emoji]}</span> : null}
                  </button>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-2 flex items-center gap-1.5">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') submit();
          }}
          placeholder="Reply…"
          className="flex-1 rounded-md border border-white/10 bg-white/[0.03] px-2 py-1 text-xs text-white/80 outline-none focus:border-teal-400/50"
        />
        <button
          onClick={submit}
          disabled={!draft.trim()}
          className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-teal-500/20 text-teal-300 hover:bg-teal-500/30 disabled:opacity-30"
        >
          <Send size={12} />
        </button>
      </div>

      <label className="mt-2 flex cursor-pointer items-center gap-1.5 text-[11px] text-white/50">
        <input
          type="checkbox"
          checked={thread.resolved}
          onChange={() => (thread.resolved ? reopenThread(thread.id) : resolveThread(thread.id))}
          className="accent-teal-500"
        />
        {thread.resolved ? (
          <span className="flex items-center gap-1 text-emerald-400">
            <Check size={11} /> Resolved
          </span>
        ) : (
          <span className="flex items-center gap-1">
            <RotateCcw size={11} /> Resolve thread
          </span>
        )}
      </label>
    </div>
  );
}

export function NodeCommentBadge({ nodeId, className }: { nodeId: string; className?: string }) {
  const author = usePresenceStore((s) => s.localUser.name);
  const threads = useCommentsStore((s) => s.threads.filter((t) => t.nodeId === nodeId));
  const addThread = useCommentsStore((s) => s.addThread);
  const [open, setOpen] = useState(false);
  const [newThreadDraft, setNewThreadDraft] = useState('');

  const totalMessages = threads.reduce((sum, t) => sum + t.messages.length, 0);
  const hasUnresolved = threads.some((t) => !t.resolved);

  const startThread = () => {
    if (!newThreadDraft.trim()) return;
    addThread(nodeId, newThreadDraft.trim(), author);
    setNewThreadDraft('');
  };

  return (
    <div className={cn('relative', className)}>
      <button
        onClick={() => setOpen((v) => !v)}
        className={cn(
          'flex h-6 items-center gap-1 rounded-full border px-1.5 text-[10px] font-semibold shadow-card transition-colors',
          hasUnresolved
            ? 'border-amber-400/40 bg-amber-500/20 text-amber-200 animate-pulse-ring'
            : totalMessages > 0
              ? 'border-white/10 bg-white/10 text-white/70'
              : 'border-white/10 bg-white/5 text-white/40',
        )}
        title={totalMessages > 0 ? `${totalMessages} comment(s)` : 'Add comment'}
      >
        <MessageCircle size={11} />
        {totalMessages > 0 && <span>{totalMessages}</span>}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: -6 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: -6 }}
            transition={{ duration: 0.14 }}
            className="absolute left-1/2 top-full z-50 mt-2 w-72 -translate-x-1/2 space-y-2 rounded-lg border border-white/10 bg-surface-900 p-2 shadow-card-lg"
          >
            {threads.map((thread) => (
              <ThreadCard key={thread.id} thread={thread} author={author} />
            ))}

            <div className="rounded-md border border-dashed border-white/10 p-2">
              <textarea
                value={newThreadDraft}
                onChange={(e) => setNewThreadDraft(e.target.value)}
                placeholder="Start a new comment thread…"
                rows={2}
                className="w-full resize-none rounded-md border border-white/10 bg-white/[0.03] px-2 py-1 text-xs text-white/80 outline-none focus:border-teal-400/50"
              />
              <button
                onClick={startThread}
                disabled={!newThreadDraft.trim()}
                className="mt-1 flex w-full items-center justify-center gap-1 rounded-md bg-teal-500/20 py-1 text-[11px] font-medium text-teal-300 hover:bg-teal-500/30 disabled:opacity-30"
              >
                <Send size={11} /> Comment
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default NodeCommentBadge;
