import React, { useState } from 'react';
import { Clipboard, ClipboardPaste, Check } from 'lucide-react';
import { cn } from '../../utils/cn';
import { Button } from '../../components/ui/Button';
import { useQueryStore } from '../../store/queryStore';
import { copyToClipboard, readFromClipboard } from './clipboardUtils';
import type { QueryGraphNode, QueryNodeData } from '../../types/query';

// ─── CopySnippetButton ───────────────────────────────────────────────────────

interface CopySnippetButtonProps {
  /** The graph node whose data should be serialized */
  node: QueryGraphNode;
  className?: string;
}

/**
 * A small button that serializes a graph node into a JSON DSL fragment
 * and copies it to the clipboard.
 */
export function CopySnippetButton({ node, className }: CopySnippetButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    const snippet = JSON.stringify(
      {
        __mosaicNodeSnippet: true,
        id: node.id,
        type: node.type,
        position: node.position,
        data: node.data,
      },
      null,
      2,
    );
    await copyToClipboard(snippet).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <button
      onClick={handleCopy}
      title="Copy node as DSL snippet"
      className={cn(
        'inline-flex items-center justify-center w-6 h-6 rounded transition-colors',
        'text-[var(--text-muted)] hover:text-[var(--brand)] hover:bg-[var(--brand-subtle)]',
        copied && 'text-green-400',
        className,
      )}
    >
      {copied ? <Check className="w-3.5 h-3.5" /> : <Clipboard className="w-3.5 h-3.5" />}
    </button>
  );
}

// ─── PasteNodeButton ─────────────────────────────────────────────────────────

interface PasteNodeButtonProps {
  className?: string;
}

/**
 * Reads the clipboard, tries to parse a node snippet, and upserts it into
 * the query store (placing it slightly offset from the original position).
 */
export function PasteNodeButton({ className }: PasteNodeButtonProps) {
  const { upsertNode } = useQueryStore();
  const [status, setStatus] = useState<'idle' | 'ok' | 'error'>('idle');

  const handlePaste = async () => {
    try {
      const text = await readFromClipboard();
      const parsed = JSON.parse(text);
      if (!parsed.__mosaicNodeSnippet) {
        setStatus('error');
        setTimeout(() => setStatus('idle'), 1500);
        return;
      }

      const newNode: QueryGraphNode = {
        id: `${parsed.id}-copy-${Date.now()}`,
        type: parsed.type ?? 'queryNode',
        position: {
          x: (parsed.position?.x ?? 0) + 60,
          y: (parsed.position?.y ?? 0) + 60,
        },
        data: parsed.data as QueryNodeData,
      };
      upsertNode(newNode);
      setStatus('ok');
      setTimeout(() => setStatus('idle'), 1500);
    } catch {
      setStatus('error');
      setTimeout(() => setStatus('idle'), 1500);
    }
  };

  return (
    <Button
      size="xs"
      variant={status === 'ok' ? 'success' : status === 'error' ? 'danger' : 'ghost'}
      onClick={handlePaste}
      title="Paste node from clipboard"
      className={className}
    >
      <ClipboardPaste className="w-3.5 h-3.5" />
      {status === 'ok' ? 'Pasted!' : status === 'error' ? 'Invalid' : 'Paste Node'}
    </Button>
  );
}
