import { Link, useNavigate } from 'react-router-dom';
import { Globe, GraduationCap, ArrowRight, BookOpen, RefreshCw } from 'lucide-react';
import { usePrograms } from '@/api/programs';
import { useAuthStore } from '@/store/authStore';

export function AdminOverviewPage() {
  const { data: programs, isLoading, refetch } = usePrograms();
  const logout = useAuthStore((s) => s.logout);
  const navigate = useNavigate();

  const ugProgram = programs?.find((p) => p.type === 'UG') ?? {
    _id: 'ug-default',
    name: 'UG',
    type: 'UG' as const,
    code: 'UG',
    maxTeamSize: 4,
  };

  const pgPrograms = programs?.filter((p) => p.type === 'PG') ?? [
    {
      _id: 'pg-default-1',
      name: 'M.E. CSE with spln. In Data Science and Cyber Security',
      type: 'PG' as const,
      code: 'MECSEDS',
      maxTeamSize: 4,
    },
    {
      _id: 'pg-default-2',
      name: 'M.E. Computer Science and Engineering',
      type: 'PG' as const,
      code: 'MECSE',
      maxTeamSize: 4,
    },
  ];

  return (
    <div className="min-h-screen bg-[var(--color-paper)] text-[var(--color-ink)]">
      {/* Dark Ink Header with Brass Logo Mark */}
      <header className="bg-[var(--color-ink)] text-[var(--color-paper)] shadow-[var(--shadow-ledger)]">
        <div className="max-w-4xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-7 w-7 rounded-lg bg-[var(--color-ink-soft)] flex items-center justify-center shrink-0 border border-[var(--color-seal)]">
              <div className="h-3 w-3 rounded-full border-[1.5px] border-[var(--color-seal)] bg-[var(--color-seal)]" />
            </div>
            <span className="bg-[var(--color-seal-dim)] text-[var(--color-seal)] text-xs font-data font-bold px-2.5 py-1 rounded border border-[var(--color-seal)]/30">
              Admin
            </span>
            <span className="font-display font-semibold tracking-tight text-base text-[var(--color-paper)]">Control Panel</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => refetch()}
              className="p-2 rounded-lg text-xs font-semibold bg-white/10 hover:bg-white/20 text-[var(--color-paper)] transition-colors flex items-center gap-1.5"
              title="Refresh Programme List"
            >
              <RefreshCw size={14} />
            </button>
            <button
              onClick={() => {
                logout();
                navigate('/login', { replace: true });
              }}
              className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-white/10 hover:bg-white/20 text-[var(--color-paper)] transition-colors"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="max-w-4xl mx-auto px-6 py-8 space-y-8">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-[var(--color-ink)]">Admin Overview</h1>
          <p className="mt-1 text-xs text-[var(--color-ink-faint)]">Select a context to manage students, panels, and reviews.</p>
        </div>

        {/* GLOBAL MANAGEMENT SECTION */}
        <section className="space-y-3">
          <h2 className="text-xs font-bold tracking-wider text-[var(--color-seal)] uppercase">Global Management</h2>
          <Link
            to="/admin/global-management"
            className="group flex items-center justify-between p-5 rounded-2xl bg-white border border-[var(--color-ink)]/10 shadow-[var(--shadow-card)] hover:shadow-[var(--shadow-raised)] hover:border-[var(--color-seal)] transition-all"
          >
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-xl bg-[var(--color-seal-dim)] text-[var(--color-seal)] flex items-center justify-center shrink-0 border border-[var(--color-seal-soft)]">
                <Globe className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-display text-base font-bold text-[var(--color-ink)] group-hover:text-[var(--color-seal)] transition-colors">Global Management</h3>
                <p className="text-xs font-medium text-[var(--color-ink-faint)] mt-0.5">Faculty · Designation Limits · PG Programmes</p>
              </div>
            </div>
            <ArrowRight className="h-5 w-5 text-[var(--color-ink-faint)] group-hover:text-[var(--color-seal)] group-hover:translate-x-1 transition-all" />
          </Link>
        </section>

        {/* PROGRAMMES SECTION */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold tracking-wider text-[var(--color-seal)] uppercase">Programmes</h2>
            <span className="text-xs font-data text-[var(--color-ink-faint)]">{1 + pgPrograms.length} active programmes</span>
          </div>

          {isLoading ? (
            <div className="p-8 text-center text-[var(--color-ink-faint)] text-sm">Loading programmes...</div>
          ) : (
            <div className="space-y-3">
              {/* UG Card */}
              <Link
                to={`/admin-dashboard/programme/${encodeURIComponent(ugProgram.name)}`}
                className="group flex items-center justify-between p-5 rounded-2xl bg-white border border-[var(--color-ink)]/10 shadow-[var(--shadow-card)] hover:shadow-[var(--shadow-raised)] hover:border-[var(--color-seal)] transition-all"
              >
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-xl bg-[var(--color-verdant-soft)] text-[var(--color-verdant)] flex items-center justify-center shrink-0 border border-[var(--color-verdant)]/20">
                    <BookOpen className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="font-display text-base font-bold text-[var(--color-ink)] group-hover:text-[var(--color-seal)] transition-colors">{ugProgram.name}</h3>
                    <p className="text-xs font-medium text-[var(--color-ink-faint)] mt-0.5">Undergraduate programme</p>
                  </div>
                </div>
                <ArrowRight className="h-5 w-5 text-[var(--color-ink-faint)] group-hover:text-[var(--color-seal)] group-hover:translate-x-1 transition-all" />
              </Link>

              {/* PG Cards */}
              {pgPrograms.map((prog) => (
                <Link
                  key={prog._id}
                  to={`/admin-dashboard/programme/${encodeURIComponent(prog.name)}`}
                  className="group flex items-center justify-between p-5 rounded-2xl bg-white border border-[var(--color-ink)]/10 shadow-[var(--shadow-card)] hover:shadow-[var(--shadow-raised)] hover:border-[var(--color-seal)] transition-all"
                >
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-xl bg-[var(--color-seal-dim)] text-[var(--color-seal)] flex items-center justify-center shrink-0 border border-[var(--color-seal-soft)]">
                      <GraduationCap className="h-6 w-6" />
                    </div>
                    <div>
                      <h3 className="font-display text-base font-bold text-[var(--color-ink)] group-hover:text-[var(--color-seal)] transition-colors">{prog.name}</h3>
                      <p className="text-xs font-medium text-[var(--color-ink-faint)] mt-0.5">PG programme</p>
                    </div>
                  </div>
                  <ArrowRight className="h-5 w-5 text-[var(--color-ink-faint)] group-hover:text-[var(--color-seal)] group-hover:translate-x-1 transition-all" />
                </Link>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
