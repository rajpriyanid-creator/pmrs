import React, { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/authStore';
import { selectRole, getAvailableRoles } from '@/api/auth';
import { RoleOption } from '@/types';
import { toast } from '@/components/ui/Toast';
import { apiErrorMessage } from '@/api/client';
import { UserCheck, ChevronDown } from 'lucide-react';

export function RoleSwitcher() {
  const profile = useAuthStore((s) => s.profile);
  const setSession = useAuthStore((s) => s.setSession);
  const [options, setOptions] = useState<RoleOption[]>([]);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    getAvailableRoles()
      .then((res) => setOptions(res.roles))
      .catch(() => {});
  }, []);

  if (!options || options.length <= 1) return null;

  async function handleSwitch(role: RoleOption['role'], programId?: string) {
    try {
      const res = await selectRole(role, programId);
      setSession(res.accessToken, res.profile);
      toast.success(`Switched role to ${res.profile.role.toUpperCase()}`);
      setOpen(false);
      window.location.reload();
    } catch (e) {
      toast.error(apiErrorMessage(e));
    }
  }

  return (
    <div className="relative inline-block text-left">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[var(--color-seal-dim)] text-[var(--color-seal)] border border-[var(--color-seal)]/30 text-xs font-semibold hover:bg-[var(--color-seal)] hover:text-white transition-all shadow-xs"
      >
        <UserCheck size={14} />
        <span>Role: {profile?.role.toUpperCase()}</span>
        <ChevronDown size={12} />
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-48 rounded-xl bg-white shadow-[var(--shadow-raised)] border border-[var(--color-ink)]/10 z-50 p-1.5 space-y-1">
          <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-[var(--color-ink-faint)]">
            Switch Active Context
          </div>
          {options.map((opt, i) => (
            <button
              key={`${opt.role}-${opt.programId || i}`}
              onClick={() => handleSwitch(opt.role, opt.programId)}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                profile?.role === opt.role && profile?.programId === opt.programId
                  ? 'bg-[var(--color-seal)] text-white font-bold'
                  : 'text-[var(--color-ink)] hover:bg-[var(--color-paper-dim)]'
              }`}
            >
              <span>{opt.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
