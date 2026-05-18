import React, { useState } from 'react';
import { Copy, FileJson, FileSpreadsheet, FileText, ClipboardPaste, Table2 } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { useExecutionStore } from '../../store/executionStore';
import { useQueryStore } from '../../store/queryStore';
import { copyToClipboard, readFromClipboard, rowsToMarkdownTable, rowsToTsv, parseJsonToQueryGraph } from './clipboardUtils';

type FeedbackKey = 'csv' | 'tsv' | 'markdown' | 'json' | 'paste' | null;

export function ClipboardBar() {
  const rows = useExecutionStore((s) => s.rows);
  const { setNodes, setEdges } = useQueryStore();
  const [feedback, setFeedback] = useState<FeedbackKey>(null);

  const flash = (key: FeedbackKey) => {
    setFeedback(key);
    setTimeout(() => setFeedback(null), 1500);
  };

  const rowsToCsv = (data: Record<string, unknown>[]): string => {
    if (!data.length) return '';
    const cols = Object.keys(data[0]);
    const header = cols.join(',');
    const body = data
      .map((row) =>
        cols
          .map((c) => {
            const v = String(row[c] ?? '');
            return v.includes(',') || v.includes('"') || v.includes('\n')
              ? `"${v.replace(/"/g, '""')}"`
              : v;
          })
          .join(','),
      )
      .join('\n');
    return `${header}\n${body}`;
  };

  const handleCopyCsv = async () => {
    await copyToClipboard(rowsToCsv(rows)).catch(() => {});
    flash('csv');
  };

  const handleCopyTsv = async () => {
    await copyToClipboard(rowsToTsv(rows)).catch(() => {});
    flash('tsv');
  };

  const handleCopyMarkdown = async () => {
    await copyToClipboard(rowsToMarkdownTable(rows)).catch(() => {});
    flash('markdown');
  };

  const handleCopyJson = async () => {
    await copyToClipboard(JSON.stringify(rows, null, 2)).catch(() => {});
    flash('json');
  };

  const handlePasteJson = async () => {
    try {
      const text = await readFromClipboard();
      const graph = parseJsonToQueryGraph(text);
      if (!graph) {
        alert('Clipboard does not contain a valid DSL JSON.');
        return;
      }
      setNodes(graph.nodes);
      setEdges(graph.edges);
      flash('paste');
    } catch {
      // ignore
    }
  };

  const actions: { key: FeedbackKey; label: string; icon: React.ReactNode; handler: () => void }[] = [
    { key: 'csv', label: 'Copy as CSV', icon: <Table2 className="w-3.5 h-3.5" />, handler: handleCopyCsv },
    { key: 'tsv', label: 'Copy as TSV', icon: <FileSpreadsheet className="w-3.5 h-3.5" />, handler: handleCopyTsv },
    { key: 'markdown', label: 'Copy as Markdown', icon: <FileText className="w-3.5 h-3.5" />, handler: handleCopyMarkdown },
    { key: 'json', label: 'Copy as JSON', icon: <FileJson className="w-3.5 h-3.5" />, handler: handleCopyJson },
    { key: 'paste', label: 'Paste JSON as Graph', icon: <ClipboardPaste className="w-3.5 h-3.5" />, handler: handlePasteJson },
  ];

  return (
    <div className="flex flex-wrap items-center gap-1.5 px-3 py-2 bg-[var(--bg-panel)] border border-[var(--border)] rounded-lg">
      <Copy className="w-3.5 h-3.5 text-[var(--text-muted)] mr-0.5 shrink-0" />
      {actions.map(({ key, label, icon, handler }) => (
        <Button
          key={key}
          size="xs"
          variant={feedback === key ? 'success' : 'ghost'}
          onClick={handler}
          disabled={key !== 'paste' && !rows.length}
          title={label}
        >
          {icon}
          {feedback === key ? 'Copied!' : label}
        </Button>
      ))}
    </div>
  );
}
