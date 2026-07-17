import { ReactNode } from 'react';
import { Inbox } from 'lucide-react';

export function Table({ children }: { children: ReactNode }) {
  return (
    <div className="overflow-x-auto scrollbar-thin">
      <table className="w-full text-sm border-collapse">{children}</table>
    </div>
  );
}

export function THead({ children }: { children: ReactNode }) {
  return <thead className="text-left text-xs uppercase tracking-wide text-[var(--color-ink-faint)]">{children}</thead>;
}

export function TH({ children, className = '' }: { children?: ReactNode; className?: string }) {
  return <th className={`px-4 py-3 font-medium ledger-row ${className}`}>{children}</th>;
}

export function TR({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <tr className={`ledger-row hover:bg-[var(--color-paper-dim)]/60 transition-colors ${className}`}>{children}</tr>;
}

export function TD({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <td className={`px-4 py-3 text-[var(--color-ink)] ${className}`}>{children}</td>;
}

export function EmptyState({ title, description }: { title: string; description?: string }) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-16 px-6">
      <div className="h-12 w-12 rounded-full bg-[var(--color-paper-dim)] flex items-center justify-center mb-4">
        <Inbox size={20} className="text-[var(--color-ink-faint)]" />
      </div>
      <p className="font-display text-base text-[var(--color-ink)]">{title}</p>
      {description && <p className="text-sm text-[var(--color-ink-faint)] mt-1 max-w-sm">{description}</p>}
    </div>
  );
}

export function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`animate-pulse bg-[var(--color-ink)]/8 rounded-md ${className}`} />;
}

export function TableSkeleton({ rows = 5, cols = 4 }: { rows?: number; cols?: number }) {
  return (
    <div className="p-4 space-y-3">
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} className="flex gap-4">
          {Array.from({ length: cols }).map((__, c) => (
            <Skeleton key={c} className="h-4 flex-1" />
          ))}
        </div>
      ))}
    </div>
  );
}
