import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronDown, RefreshCw } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { api, apiErrorMessage } from '@/api/client';
import { toast } from '@/components/ui/Toast';

interface RoleOption {
  role: string;
  programId: string | null;
  programLabel: string;
}

const ROLE_LABELS: Record<string, string> = {
  admin: 'Admin',
  coordinator: 'Coordinator',
  guide: 'Guide',
  panel: 'Panel Member',
  assistant: 'Assistant',
  student: 'Student',
};

/**
 * RoleSwitcher — lets multi-role faculty switch between their role×program
 * contexts at runtime without a full logout.
 */
export function RoleSwitcher() {
  const profile = useAuthStore((s) => s.profile);
  const setProfile = useAuthStore((s) => s.setProfile);
  const setAccessToken = useAuthStore((s) => s.setAccessToken);
  const identityToken = useAuthStore((s) => s.identityToken);

  const [open, setOpen] = useState(false);
  const [options, setOptions] = useState<RoleOption[]>([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  if (!profile || profile.role === 'student') return null; // students can't switch roles

  async function loadOptions() {
    if (!identityToken) return;
    setLoading(true);
    try {
      const res = await api.get('/auth/roles', {
        headers: { Authorization: `Bearer ${identityToken}` },
      });
      setOptions(res.data.options ?? []);
    } catch (err) {
      // If identity token expired, fall back to just showing current role
      setOptions([]);
    } finally {
      setLoading(false);
    }
  }

  async function handleSelect(opt: RoleOption) {
    setOpen(false);
    if (!identityToken) {
      toast.error('Session expired. Please log in again.');
      return;
    }
    try {
      const res = await api.post(
        '/auth/select-role',
        { role: opt.role, programId: opt.programId },
        { headers: { Authorization: `Bearer ${identityToken}` } }
      );
      setAccessToken(res.data.accessToken);
      setProfile(res.data.profile);

      // Navigate to the appropriate dashboard
      const roleMap: Record<string, string> = {
        admin: '/admin',
        coordinator: '/coordinator',
        guide: '/guide',
        panel: '/panel',
        assistant: '/assistant/faculty',
      };
      navigate(roleMap[opt.role] ?? '/');
    } catch (err) {
      toast.error(apiErrorMessage(err));
    }
  }

  const currentLabel = profile
    ? `${ROLE_LABELS[profile.role] ?? profile.role}`
    : '';

  return (
    <div className="relative">
      <button
        id="role-switcher-btn"
        onClick={() => {
          if (!open) loadOptions();
          setOpen((v) => !v);
        }}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium
                   bg-[var(--color-ink)]/6 hover:bg-[var(--color-ink)]/10
                   text-[var(--color-ink)] transition-colors"
        title="Switch role"
      >
        <RefreshCw size={13} className="text-[var(--color-seal)]" />
        <span>{currentLabel}</span>
        <ChevronDown size={13} className={`transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <>
          {/* Backdrop */}
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          {/* Dropdown */}
          <div className="absolute right-0 top-full mt-1.5 z-50 w-60 rounded-xl border border-[var(--color-ink)]/8
                          bg-white shadow-lg shadow-[var(--color-ink)]/6 overflow-hidden">
            <div className="px-3 py-2 border-b border-[var(--color-ink)]/8">
              <p className="text-xs font-medium text-[var(--color-ink-faint)] uppercase tracking-wide">Switch to</p>
            </div>
            {loading ? (
              <div className="p-4 flex justify-center">
                <div className="h-5 w-5 rounded-full border-2 border-[var(--color-ink)]/15 border-t-[var(--color-seal)] animate-spin" />
              </div>
            ) : options.length === 0 ? (
              <div className="p-4 text-sm text-[var(--color-ink-faint)] text-center">
                No other roles available
              </div>
            ) : (
              <div className="py-1 max-h-64 overflow-y-auto">
                {options.map((opt, i) => {
                  const isCurrentRole = opt.role === profile?.role && opt.programId === profile?.programId;
                  return (
                    <button
                      key={i}
                      onClick={() => handleSelect(opt)}
                      disabled={isCurrentRole}
                      className={`w-full text-left px-3 py-2.5 flex items-center justify-between gap-2
                                  text-sm transition-colors
                                  ${isCurrentRole
                                    ? 'bg-[var(--color-seal)]/5 text-[var(--color-seal)] cursor-default'
                                    : 'hover:bg-[var(--color-ink)]/4 text-[var(--color-ink)]'
                                  }`}
                    >
                      <span>
                        <span className="font-medium">{ROLE_LABELS[opt.role] ?? opt.role}</span>
                        {opt.programLabel && opt.programLabel !== 'All Programs' && (
                          <span className="text-xs text-[var(--color-ink-faint)] ml-1.5">({opt.programLabel})</span>
                        )}
                      </span>
                      {isCurrentRole && (
                        <span className="text-xs bg-[var(--color-seal)]/15 text-[var(--color-seal)] px-1.5 py-0.5 rounded">
                          Current
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
