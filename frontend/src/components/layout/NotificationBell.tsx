import { useState, useRef, useEffect } from 'react';
import { Bell } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { useMarkNotificationRead, useNotifications } from '@/api/notifications';

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const { data } = useNotifications();
  const markRead = useMarkNotificationRead();

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  const unreadCount = data?.items.filter((n) => !n.read).length ?? 0;

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="relative p-2 rounded-lg text-[var(--color-ink-soft)] hover:bg-[var(--color-ink)]/6 transition-colors"
        aria-label="Notifications"
      >
        <Bell size={19} />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-[var(--color-flag)]" />
        )}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.97 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-[var(--shadow-raised)] border border-[var(--color-ink)]/8 overflow-hidden z-50"
          >
            <div className="px-4 py-3 border-b border-[var(--color-ink)]/8">
              <p className="font-display text-sm text-[var(--color-ink)]">Notifications</p>
            </div>
            <div className="max-h-96 overflow-y-auto scrollbar-thin">
              {!data || data.items.length === 0 ? (
                <p className="text-sm text-[var(--color-ink-faint)] px-4 py-8 text-center">You're all caught up.</p>
              ) : (
                data.items.map((n) => (
                  <button
                    key={n._id}
                    onClick={() => !n.read && markRead.mutate(n._id)}
                    className={`w-full text-left px-4 py-3 border-b border-[var(--color-ink)]/6 last:border-0 hover:bg-[var(--color-paper-dim)]/60 transition-colors ${
                      !n.read ? 'bg-[var(--color-seal-dim)]/40' : ''
                    }`}
                  >
                    <p className="text-sm text-[var(--color-ink)]">{n.message}</p>
                    <p className="text-xs text-[var(--color-ink-faint)] mt-1">
                      {new Date(n.createdAt).toLocaleString(undefined, { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </button>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
