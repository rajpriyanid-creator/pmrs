import { NavLink } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { NAV_BY_ROLE } from './navConfig';
import { useAuthStore } from '@/store/authStore';

export function Sidebar({ mobileOpen, onCloseMobile }: { mobileOpen: boolean; onCloseMobile: () => void }) {
  const profile = useAuthStore((s) => s.profile);
  if (!profile) return null;
  const items = NAV_BY_ROLE[profile.role];

  const content = (
    <div className="flex flex-col h-full">
      <div className="px-5 pt-6 pb-5">
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-lg bg-[var(--color-ink)] flex items-center justify-center shrink-0">
            <div className="h-3.5 w-3.5 rounded-full border-[1.5px] border-[var(--color-seal)]" />
          </div>
          <div>
            <p className="font-display text-base leading-tight text-[var(--color-ink)]">PRMS</p>
            <p className="text-[11px] text-[var(--color-ink-faint)] leading-tight capitalize">{profile.role}</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 px-3 space-y-0.5 overflow-y-auto scrollbar-thin">
        {items.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to.split('/').length <= 2}
            onClick={onCloseMobile}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-[var(--color-ink)] text-[var(--color-paper)]'
                  : 'text-[var(--color-ink-soft)] hover:bg-[var(--color-ink)]/6'
              }`
            }
          >
            <item.icon size={17} strokeWidth={2} />
            {item.label}
          </NavLink>
        ))}
      </nav>

      <div className="px-5 py-4 border-t border-[var(--color-ink)]/8">
        <p className="text-xs text-[var(--color-ink-faint)]">College of Engineering Guindy</p>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop */}
      <aside className="hidden lg:block w-64 shrink-0 h-screen sticky top-0 bg-[var(--color-paper)] border-r border-[var(--color-ink)]/8">
        {content}
      </aside>

      {/* Mobile drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div className="lg:hidden fixed inset-0 z-40" initial="closed" animate="open" exit="closed">
            <motion.div
              className="absolute inset-0 bg-[var(--color-ink)]/40"
              variants={{ open: { opacity: 1 }, closed: { opacity: 0 } }}
              onClick={onCloseMobile}
            />
            <motion.div
              className="absolute left-0 top-0 h-full w-72 bg-[var(--color-paper)] shadow-[var(--shadow-raised)]"
              variants={{ open: { x: 0 }, closed: { x: '-100%' } }}
              transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            >
              <button
                onClick={onCloseMobile}
                aria-label="Close menu"
                className="absolute top-5 right-4 p-1.5 rounded-md text-[var(--color-ink-faint)] hover:bg-[var(--color-ink)]/6"
              >
                <X size={18} />
              </button>
              {content}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
