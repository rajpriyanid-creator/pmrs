import { FormEvent, useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, Link } from 'react-router-dom';
import { Lock, User, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Field, Input } from '@/components/ui/Form';
import { loginRequest } from '@/api/auth';
import { useAuthStore } from '@/store/authStore';
import { apiErrorMessage } from '@/api/client';
import { toast } from '@/components/ui/Toast';

export function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const setIdentity = useAuthStore((s) => s.setIdentity);
  const setSession = useAuthStore((s) => s.setSession);
  const clear = useAuthStore((s) => s.clear);

  const DEFAULT_ROUTE: Record<string, string> = {
    admin: '/admin',
    coordinator: '/coordinator',
    guide: '/guide',
    panel: '/panel',
    assistant: '/assistant/faculty',
    student: '/student',
  };

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      clear(); // Clear any stale session data
      const result = await loginRequest(username, password);
      if (result.needsRoleSelection) {
        // Legacy fallback — should no longer happen with the new backend
        setIdentity(result.identityToken, result.name);
        navigate('/select-role');
      } else {
        setSession(result.accessToken, result.profile);
        if (result.mustChangePassword) {
          navigate('/change-password');
        } else {
          const route = DEFAULT_ROUTE[result.profile.role] || '/admin';
          navigate(route);
        }
      }
    } catch (err) {
      const message = apiErrorMessage(err);
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex bg-[var(--color-paper)]">
      {/* Brand panel */}
      <div className="hidden lg:flex lg:w-[46%] relative bg-[var(--color-ink)] text-[var(--color-paper)] flex-col justify-between p-12 overflow-hidden">
        <BrandMotif />
        <div className="relative z-10">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-lg bg-white/10 flex items-center justify-center">
              <div className="h-4 w-4 rounded-full border-2 border-[var(--color-seal)]" />
            </div>
            <span className="font-display text-xl">PRMS</span>
          </div>
        </div>

        <div className="relative z-10 max-w-md">
          <h1 className="font-display text-4xl leading-[1.1] mb-4">
            Every review,<br />on the record.
          </h1>
          <p className="text-[var(--color-paper)]/70 text-base leading-relaxed">
            Project Review Management System for capstone teams, guides, panels and coordinators —
            College of Engineering Guindy, Anna University.
          </p>
        </div>

        <div className="relative z-10 flex items-center gap-6 text-sm text-[var(--color-paper)]/50">
          <span>Review 0 → Review 3 → Viva</span>
        </div>
      </div>

      {/* Form panel */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-12">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          className="w-full max-w-sm"
        >
          <div className="lg:hidden flex items-center gap-2.5 mb-10">
            <div className="h-8 w-8 rounded-lg bg-[var(--color-ink)] flex items-center justify-center">
              <div className="h-3.5 w-3.5 rounded-full border-[1.5px] border-[var(--color-seal)]" />
            </div>
            <span className="font-display text-lg text-[var(--color-ink)]">PRMS</span>
          </div>

          <h2 className="font-display text-2xl text-[var(--color-ink)] mb-1.5">Welcome back</h2>
          <p className="text-sm text-[var(--color-ink-faint)] mb-8">Sign in with your institute credentials.</p>

          <form onSubmit={handleSubmit} className="space-y-5">
            <Field label="Username">
              <div className="relative">
                <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--color-ink-faint)]" />
                <Input
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="pl-10"
                  placeholder="e.g. rgurunath"
                  autoComplete="username"
                  autoFocus
                  required
                />
              </div>
            </Field>

            <Field label="Password">
              <div className="relative">
                <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--color-ink-faint)]" />
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10"
                  placeholder="••••••••"
                  autoComplete="current-password"
                  required
                />
              </div>
            </Field>

            {error && (
              <motion.p
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="text-sm text-[var(--color-flag)] bg-[var(--color-flag-soft)] rounded-lg px-3.5 py-2.5"
              >
                {error}
              </motion.p>
            )}

            <Button type="submit" size="lg" className="w-full" loading={loading}>
              Sign in <ArrowRight size={16} />
            </Button>

            <div className="flex items-center justify-between text-xs mt-1">
              <Link
                to="/forgot-password"
                className="text-[var(--color-ink-faint)] hover:text-[var(--color-seal)] transition-colors"
              >
                Forgot password?
              </Link>
              <Link
                to="/register-panel"
                className="text-[var(--color-ink-faint)] hover:text-[var(--color-seal)] transition-colors"
              >
                Panel member sign-up
              </Link>
            </div>
          </form>

          <div className="mt-8 pt-6 border-t border-[var(--color-ink)]/8 text-center">
            <Link to="/credits" className="text-xs text-[var(--color-ink-faint)] hover:text-[var(--color-seal)] transition-colors">
              About PRMS &amp; Development Team
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

function BrandMotif() {
  return (
    <svg className="absolute inset-0 w-full h-full opacity-[0.08]" viewBox="0 0 400 600" fill="none">
      <circle cx="340" cy="80" r="120" stroke="currentColor" strokeWidth="1" />
      <circle cx="60" cy="520" r="160" stroke="currentColor" strokeWidth="1" />
      <line x1="0" y1="300" x2="400" y2="300" stroke="currentColor" strokeWidth="1" strokeDasharray="4 8" />
    </svg>
  );
}
