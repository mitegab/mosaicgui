import { useEffect, useState } from 'react';
import { Search, X } from 'lucide-react';
import { cn } from '../../utils/cn';

interface AuditSearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  debounceMs?: number;
}

export function AuditSearchBar({
  value,
  onChange,
  placeholder = 'Search actor, action, or target…',
  className,
  debounceMs = 300,
}: AuditSearchBarProps) {
  const [local, setLocal] = useState(value);

  useEffect(() => {
    setLocal(value);
  }, [value]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      if (local !== value) onChange(local);
    }, debounceMs);
    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [local, debounceMs]);

  return (
    <div className={cn('relative', className)}>
      <Search size={13} className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-white/30" />
      <input
        value={local}
        onChange={(e) => setLocal(e.target.value)}
        placeholder={placeholder}
        className="h-8 w-full rounded-md border border-white/10 bg-white/[0.03] pl-8 pr-7 text-xs text-white/80 outline-none focus:border-teal-400/50"
      />
      {local && (
        <button
          onClick={() => setLocal('')}
          className="absolute right-2 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60"
        >
          <X size={12} />
        </button>
      )}
    </div>
  );
}

export default AuditSearchBar;
