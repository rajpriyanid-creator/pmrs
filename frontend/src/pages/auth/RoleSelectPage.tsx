import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, GraduationCap, Users2, Gavel, FileSpreadsheet, ArrowRight } from 'lucide-react';
import { getRolesRequest, selectRoleRequest } from '@/api/auth';
import { useAuthStore } from '@/store/authStore';
import { RoleOption, ScopedRole } from '@/types';
import { Skeleton } from '@/components/ui/Table';
import { apiErrorMessage } from '@/api/client';
import { toast } from '@/components/ui/Toast';

const ROLE_META: Record<ScopedRole, { icon: typeof ShieldCheck; label: string; description: string }> = {
  admin: { icon: ShieldCheck, label: 'Administrator', description: 'Full institutional oversight' },
  coordinator: { icon: Gavel, label: 'Coordinator', description: 'Schedule reviews, manage panels' },
  guide: { icon: GraduationCap, label: 'Guide', description: 'Mentor and evaluate teams' },
  panel: { icon: Users2, label: 'Panel Member', description: 'Evaluate assigned teams' },
  assistant: { icon: FileSpreadsheet, label: 'Assistant', description: 'View-only records & exports' },
  student: { icon: GraduationCap, label: 'Student', description: '' },
};

const DEFAULT_ROUTE: Record<ScopedRole, string> = {
  admin: '/admin',
  coordinator: '/coordinator',
  guide: '/guide',
  panel: '/panel',
  assistant: '/assistant/faculty',
  student: '/student',
};

export function RoleSelectPage() {
  const identityToken = useAuthStore((s) => s.identityToken);
  const candidateName = useAuthStore((s) => s.candidateName);
  const setRoleOptions = useAuthStore((s) => s.setRoleOptions);
  const setSession = useAuthStore((s) => s.setSession);
  const roleOptionsStored = useAuthStore((s) => s.roleOptions);
  const clear = useAuthStore((s) => s.clear);
  const navigate = useNavigate();

  const [options, setOptions] = useState<RoleOption[] | null>(null);
  const [selecting, setSelecting] = useState<string | null>(null);

  useEffect(() => {
    if (!identityToken) {
      navigate('/login', { replace: true });
      return;
    }
    getRolesRequest(identityToken)
      .then(async (res) => {
        setRoleOptions(res.options);

        // Auto-select if there is exactly one role option (e.g. admin-only)
        if (res.options.length === 1) {
          const only = res.options[0];
          try {
            const selectRes = await selectRoleRequest(identityToken, only.role, only.programId);
            setSession(selectRes.accessToken, selectRes.profile);
            navigate(DEFAULT_ROUTE[only.role], { replace: true });
          } catch (err) {
            toast.error(apiErrorMessage(err));
            setOptions(res.options); // fallback: show the single option
          }
          return;
        }

        setOptions(res.options);
      })
      .catch((err) => {
        toast.error(apiErrorMessage(err));
        clear();
        navigate('/login', { replace: true });
      });
  }, [identityToken]);

  async function handleSelect(option: RoleOption) {
    if (!identityToken) return;
    const key = `${option.role}:${option.programId}`;
    setSelecting(key);
    try {
      const res = await selectRoleRequest(identityToken, option.role, option.programId);
      setSession(res.accessToken, res.profile);
      navigate(DEFAULT_ROUTE[option.role]);
    } catch (err) {
      toast.error(apiErrorMessage(err));
    } finally {
      setSelecting(null);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--color-paper)] p-6">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-2xl"
      >
        <p className="text-sm text-[var(--color-ink-faint)] mb-1.5">Welcome, {candidateName ?? 'back'}</p>
        <h1 className="font-display text-2xl text-[var(--color-ink)] mb-8">Choose how you'd like to continue</h1>

        {!options ? (
          <div className="grid sm:grid-cols-2 gap-3">
            {[0, 1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-24 rounded-xl" />
            ))}
          </div>
        ) : options.length === 0 ? (
          <p className="text-sm text-[var(--color-ink-faint)]">No roles are currently assigned to this account.</p>
        ) : (
          <div className="grid sm:grid-cols-2 gap-3">
            {(roleOptionsStored.length ? roleOptionsStored : options).map((option) => {
              const meta = ROLE_META[option.role];
              const Icon = meta.icon;
              const key = `${option.role}:${option.programId}`;
              const isSelecting = selecting === key;
              return (
                <button
                  key={key}
                  onClick={() => handleSelect(option)}
                  disabled={selecting !== null}
                  className="group text-left bg-white rounded-xl border border-[var(--color-ink)]/8 shadow-[var(--shadow-card)] p-5 hover:border-[var(--color-seal)]/40 hover:shadow-[var(--shadow-raised)] transition-all disabled:opacity-60"
                >
                  <div className="flex items-start justify-between">
                    <div className="h-10 w-10 rounded-lg bg-[var(--color-seal-dim)] text-[var(--color-seal)] flex items-center justify-center mb-3">
                      <Icon size={19} />
                    </div>
                    <ArrowRight
                      size={16}
                      className="text-[var(--color-ink-faint)] opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all mt-2"
                    />
                  </div>
                  <p className="font-display text-base text-[var(--color-ink)]">{meta.label}</p>
                  <p className="text-xs text-[var(--color-ink-faint)] mt-0.5">{option.programLabel}</p>
                  {isSelecting && <p className="text-xs text-[var(--color-seal)] mt-2">Signing in…</p>}
                </button>
              );
            })}
          </div>
        )}
      </motion.div>
    </div>
  );
}
