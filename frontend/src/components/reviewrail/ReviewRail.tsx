import { motion } from 'framer-motion';
import { Check, Clock, Circle } from 'lucide-react';
import { REVIEW_LABELS, REVIEW_ORDER, Review } from '@/types';

type StageStatus = 'completed' | 'current' | 'scheduled' | 'upcoming';

function deriveStatus(review: Review | undefined, isNext: boolean): StageStatus {
  if (!review) return 'upcoming';
  if (review.closed) return 'completed';
  if (review.scheduledDate) return isNext ? 'current' : 'scheduled';
  return 'upcoming';
}

export function ReviewRail({
  reviews,
  averages,
  onSelect,
}: {
  reviews: Review[];
  averages?: Record<string, number>; // reviewType -> average score
  onSelect?: (type: (typeof REVIEW_ORDER)[number]) => void;
}) {
  const byType = new Map(reviews.map((r) => [r.type, r]));
  const firstIncompleteIndex = REVIEW_ORDER.findIndex((t) => {
    const r = byType.get(t);
    return !r || !r.closed;
  });

  return (
    <div className="w-full overflow-x-auto scrollbar-thin pb-2">
      <div className="relative flex items-start min-w-[560px] px-2">
        {/* Base connector line */}
        <div className="absolute top-5 left-6 right-6 h-[2px] bg-[var(--color-ink)]/10" />
        <motion.div
          className="absolute top-5 left-6 h-[2px] bg-[var(--color-verdant)] origin-left"
          initial={{ scaleX: 0 }}
          animate={{ scaleX: Math.max(0, firstIncompleteIndex) / (REVIEW_ORDER.length - 1) }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          style={{ right: '1.5rem', width: 'calc(100% - 3rem)' }}
        />

        {REVIEW_ORDER.map((type, i) => {
          const review = byType.get(type);
          const status = deriveStatus(review, i === firstIncompleteIndex);
          const average = averages?.[type];

          return (
            <button
              key={type}
              onClick={() => onSelect?.(type)}
              className="relative z-10 flex-1 flex flex-col items-center gap-2 group cursor-pointer"
            >
              <motion.div
                whileHover={{ scale: 1.08 }}
                className={nodeClasses(status)}
                aria-label={`${REVIEW_LABELS[type]} — ${status}`}
              >
                {status === 'completed' ? (
                  <Check size={16} strokeWidth={2.5} />
                ) : status === 'current' ? (
                  <Clock size={14} strokeWidth={2.5} />
                ) : (
                  <Circle size={8} fill="currentColor" />
                )}
                {status === 'current' && (
                  <motion.span
                    className="absolute inset-0 rounded-full border-2 border-[var(--color-seal)]"
                    animate={{ scale: [1, 1.35], opacity: [0.6, 0] }}
                    transition={{ duration: 1.6, repeat: Infinity, ease: 'easeOut' }}
                  />
                )}
              </motion.div>

              <div className="text-center">
                <p className="text-xs font-medium text-[var(--color-ink)]">{REVIEW_LABELS[type]}</p>
                {review?.scheduledDate && (
                  <p className="font-data text-[10px] text-[var(--color-ink-faint)] mt-0.5">
                    {new Date(review.scheduledDate).toLocaleDateString(undefined, { day: '2-digit', month: 'short' })}
                    {review.scheduledTime ? ` · ${review.scheduledTime}` : ''}
                  </p>
                )}
                {typeof average === 'number' && average > 0 && (
                  <p className="font-data text-[11px] font-semibold text-[var(--color-verdant)] mt-0.5">
                    {average.toFixed(1)}
                  </p>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function nodeClasses(status: StageStatus): string {
  const base = 'relative flex items-center justify-center h-10 w-10 rounded-full transition-colors duration-300';
  switch (status) {
    case 'completed':
      return `${base} bg-[var(--color-verdant)] text-white`;
    case 'current':
      return `${base} bg-[var(--color-paper)] text-[var(--color-seal)] border-2 border-[var(--color-seal)]`;
    case 'scheduled':
      return `${base} bg-[var(--color-paper)] text-[var(--color-ink-soft)] border-2 border-[var(--color-ink)]/25`;
    default:
      return `${base} bg-[var(--color-paper-dim)] text-[var(--color-ink)]/25 border-2 border-[var(--color-ink)]/10`;
  }
}
