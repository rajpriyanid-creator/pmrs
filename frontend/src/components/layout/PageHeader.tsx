import { ReactNode } from 'react';
import { motion } from 'framer-motion';

export function PageHeader({ title, description, action }: { title: string; description?: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-6">
      <div>
        <h2 className="font-display text-2xl text-[var(--color-ink)]">{title}</h2>
        {description && <p className="text-sm text-[var(--color-ink-faint)] mt-1">{description}</p>}
      </div>
      {action}
    </div>
  );
}

export function StatCard({
  label,
  value,
  tone = 'neutral',
}: {
  label: string;
  value: string | number;
  tone?: 'neutral' | 'seal' | 'verdant' | 'flag';
}) {
  const toneColor = {
    neutral: 'text-[var(--color-ink)]',
    seal: 'text-[var(--color-seal)]',
    verdant: 'text-[var(--color-verdant)]',
    flag: 'text-[var(--color-flag)]',
  }[tone];

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-xl border border-[var(--color-ink)]/8 shadow-[var(--shadow-card)] px-5 py-4"
    >
      <p className="text-xs font-medium text-[var(--color-ink-faint)] uppercase tracking-wide">{label}</p>
      <p className={`font-display text-3xl mt-1.5 ${toneColor}`}>{value}</p>
    </motion.div>
  );
}
