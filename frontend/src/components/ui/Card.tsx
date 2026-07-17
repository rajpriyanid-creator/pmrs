import { HTMLAttributes, ReactNode } from 'react';

export function Card({ className = '', children, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`bg-white rounded-xl border border-[var(--color-ink)]/8 shadow-[var(--shadow-card)] ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({ title, subtitle, action }: { title: string; subtitle?: string; action?: ReactNode }) {
  return (
    <div className="flex items-start justify-between px-6 py-5 border-b border-[var(--color-ink)]/8">
      <div>
        <h3 className="font-display text-lg text-[var(--color-ink)]">{title}</h3>
        {subtitle && <p className="text-sm text-[var(--color-ink-faint)] mt-0.5">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

type BadgeTone = 'neutral' | 'seal' | 'verdant' | 'flag';

const badgeTones: Record<BadgeTone, string> = {
  neutral: 'bg-[var(--color-ink)]/6 text-[var(--color-ink-soft)]',
  seal: 'bg-[var(--color-seal-dim)] text-[var(--color-seal)]',
  verdant: 'bg-[var(--color-verdant-soft)] text-[var(--color-verdant)]',
  flag: 'bg-[var(--color-flag-soft)] text-[var(--color-flag)]',
};

export function Badge({ tone = 'neutral', className = '', children }: { tone?: BadgeTone; className?: string; children: ReactNode }) {
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${badgeTones[tone]} ${className}`}>
      {children}
    </span>
  );
}

export function Divider({ className = '' }: { className?: string }) {
  return <div className={`h-px bg-[var(--color-ink)]/8 ${className}`} />;
}
