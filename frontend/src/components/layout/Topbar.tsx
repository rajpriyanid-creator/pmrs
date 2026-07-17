import { useState, useRef, useEffect } from 'react';
import { Menu, ChevronDown, LogOut, Repeat } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { NotificationBell } from './NotificationBell';
import { logoutRequest } from '@/api/auth';
import { RoleSwitcher } from '@/components/RoleSwitcher';

export function Topbar({ onOpenMobile, title }: { onOpenMobile: () => void; title: string }) {
  const profile = useAuthStore((s) => s.profile);
  const clear = useAuthStore((s) => s.clear);
  const roleOptions = useAuthStore((s) => s.roleOptions);
  const [menuOpen, setMenuOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setMenuOpen(false);
    }
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  const canSwitchRole = roleOptions.length > 1;

  async function handleLogout() {
    await logoutRequest().catch(() => {});
    clear();
    navigate('/login', { replace: true });
  }

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between h-16 px-4 lg:px-8 bg-[var(--color-paper)]/90 backdrop-blur-md border-b border-[var(--color-ink)]/8">
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenMobile}
          className="lg:hidden p-2 -ml-2 rounded-lg text-[var(--color-ink-soft)] hover:bg-[var(--color-ink)]/6"
          aria-label="Open menu"
        >
          <Menu size={20} />
        </button>
        <h1 className="font-display text-lg text-[var(--color-ink)]">{title}</h1>
      </div>

      <div className="flex items-center gap-1.5">
        <RoleSwitcher />
        <NotificationBell />
        <div className="relative" ref={ref}>
          <button
            onClick={() => setMenuOpen((o) => !o)}
            className="flex items-center gap-2 pl-2 pr-1 py-1.5 rounded-lg hover:bg-[var(--color-ink)]/6 transition-colors"
          >
            <div className="h-7 w-7 rounded-full bg-[var(--color-seal-dim)] text-[var(--color-seal)] flex items-center justify-center text-xs font-semibold">
              {profile?.name?.slice(0, 1).toUpperCase() ?? '?'}
            </div>
            <span className="hidden sm:block text-sm font-medium text-[var(--color-ink)]">{profile?.name}</span>
            <ChevronDown size={15} className="text-[var(--color-ink-faint)]" />
          </button>

          <AnimatePresence>
            {menuOpen && (
              <motion.div
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.15 }}
                className="absolute right-0 mt-2 w-52 bg-white rounded-xl shadow-[var(--shadow-raised)] border border-[var(--color-ink)]/8 overflow-hidden z-50"
              >
                {canSwitchRole && (
                  <button
                    onClick={() => {
                      setMenuOpen(false);
                      navigate('/select-role');
                    }}
                    className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-[var(--color-ink)] hover:bg-[var(--color-paper-dim)]"
                  >
                    <Repeat size={15} /> Switch role
                  </button>
                )}
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-[var(--color-flag)] hover:bg-[var(--color-flag-soft)]/50"
                >
                  <LogOut size={15} /> Sign out
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  );
}
