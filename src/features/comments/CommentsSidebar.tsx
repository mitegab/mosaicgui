import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, CheckCircle2, ArrowRight, AtSign } from 'lucide-react';
import { Panel } from '../../components/ui/Panel';
import { cn } from '../../utils/cn';
import { useCommentsStore, type CommentThread } from './useCommentsStore';
import { usePresenceStore } from '../presence/usePresenceStore';
import { useQueryStore } from '../../store/queryStore';

type FilterTab = 'all' | 'open' | 'resolved' | 'mentions';

const TABS: { id: FilterTab; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'open', label: 'Open' },
  { id: 'resolved', label: 'Resolved' },
  { id: 'mentions', label: 'Mentions' },
];

function timeAgo(iso: string): string {
  const diffSeconds = Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 1000));
  if (diffSeconds < 60) return 'just now';
  const minutes = Math.floor(diffSeconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

function ThreadRow({ thread }: { thread: CommentThread }) {
  const nodes = useQueryStore((s) => s.nodes);
  const selectNode = useQueryStore((s) => s.selectNode);
  const lastMessage = thread.messages[thread.messages.length - 1];
  const node = nodes.find((n) => n.id === thread.nodeId);
  const nodeLabel = (node?.data.label as string | undefined) ?? thread.nodeId;

  return (
    <motion.li
      layout
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -6 }}
      className="rounded-md border border-white/10 bg-white/[0.02] p-2.5"
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 min-w-0">
          <span
            className={cn(
              'h-1.5 w-1.5 shrink-0 rounded-full',
              thread.resolved ? 'bg-emerald-400' : 'bg-amber-400',
            )}
          />
          <span className="truncate text-xs font-semibold text-white/80">{nodeLabel}</span>
        </div>
        <button
          onClick={() => selectNode(thread.nodeId)}
          className="flex shrink-0 items-center gap-1 rounded-md border border-white/10 bg-white/[0.03] px-1.5 py-0.5 text-[10px] text-white/60 hover:bg-white/10"
        >
          Jump to node <ArrowRight size={10} />
        </button>
      </div>
      {lastMessage && (
        <p className="mt-1 truncate text-[11px] text-white/50">
          <span className="font-medium text-white/70">{lastMessage.author}:</span> {lastMessage.text}
        </p>
      )}
      <div className="mt-1 flex items-center gap-2 text-[10px] text-white/30">
        <span>{thread.messages.length} {thread.messages.length === 1 ? 'reply' : 'replies'}</span>
        {lastMessage && <span>· {timeAgo(lastMessage.createdAt)}</span>}
      </div>
    </motion.li>
  );
}

function Section({ title, threads }: { title: string; threads: CommentThread[] }) {
  if (threads.length === 0) return null;
  return (
    <div className="space-y-1.5">
      <h3 className="px-0.5 text-[10px] font-semibold uppercase tracking-wide text-white/30">
        {title} ({threads.length})
      </h3>
      <ul className="space-y-1.5">
        <AnimatePresence initial={false}>
          {threads.map((thread) => (
            <ThreadRow key={thread.id} thread={thread} />
          ))}
        </AnimatePresence>
      </ul>
    </div>
  );
}

export function CommentsSidebar() {
  const threads = useCommentsStore((s) => s.threads);
  const localUserName = usePresenceStore((s) => s.localUser.name);
  const [tab, setTab] = useState<FilterTab>('all');

  const filtered = useMemo(() => {
    switch (tab) {
      case 'open':
        return threads.filter((t) => !t.resolved);
      case 'resolved':
        return threads.filter((t) => t.resolved);
      case 'mentions':
        return threads.filter((t) => t.messages.some((m) => m.text.includes(`@${localUserName}`)));
      default:
        return threads;
    }
  }, [threads, tab, localUserName]);

  const open = filtered.filter((t) => !t.resolved);
  const resolved = filtered.filter((t) => t.resolved);

  return (
    <Panel
      title="Comments"
      subtitle={`${threads.length} thread${threads.length === 1 ? '' : 's'} across graph`}
      bodyClassName="flex flex-col"
    >
      <div className="flex shrink-0 gap-1 border-b border-white/10 px-2 py-1.5">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={cn(
              'rounded-full px-2.5 py-1 text-[11px] font-medium transition-colors',
              tab === t.id ? 'bg-teal-500/20 text-teal-300' : 'text-white/40 hover:text-white/70',
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto p-2.5">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 py-10 text-white/25">
            {tab === 'mentions' ? <AtSign size={20} /> : tab === 'resolved' ? <CheckCircle2 size={20} /> : <MessageSquare size={20} />}
            <span className="text-xs">No {tab === 'all' ? '' : tab} comment threads</span>
          </div>
        ) : (
          <>
            <Section title="Open" threads={open} />
            <Section title="Resolved" threads={resolved} />
          </>
        )}
      </div>
    </Panel>
  );
}

export default CommentsSidebar;
