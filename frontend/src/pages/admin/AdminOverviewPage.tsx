import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Globe, GraduationCap, ArrowRight, BookOpen, RefreshCw, LayoutDashboard, LogOut, Menu, X } from 'lucide-react';
import { usePrograms } from '@/api/programs';
import { useAuthStore } from '@/store/authStore';
import { RoleSwitcher } from '@/components/RoleSwitcher';

export function AdminOverviewPage() {
  const { data: programs, isLoading, refetch } = usePrograms();
  const logout = useAuthStore((s) => s.logout);
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

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

  const sidebarContent = (
    <div className="flex flex-col h-full bg-[var(--color-ink)] text-[var(--color-paper)] border-r border-[var(--color-ink-soft)]">
      {/* Branding Header */}
      <div className="p-6 border-b border-[var(--color-ink-soft)]/60">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-lg bg-[var(--color-ink-soft)] flex items-center justify-center shrink-0 border border-[var(--color-seal)]">
            <div className="h-3.5 w-3.5 rounded-full border-[1.5px] border-[var(--color-seal)] bg-[var(--color-seal)]" />
          </div>
          <div>
            <span className="font-display font-bold tracking-tight text-base text-[var(--color-paper)] block">Project Review</span>
            <span className="bg-[var(--color-seal-dim)] text-[var(--color-seal)] text-[10px] font-data font-bold px-2 py-0.5 rounded border border-[var(--color-seal)]/30 inline-block mt-1">
              Admin Control Panel
            </span>
          </div>
        </div>
      </div>

      {/* Nav Menu */}
      <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto scrollbar-thin">
        <button
          onClick={() => {
            navigate('/admin');
            setMobileOpen(false);
          }}
          className="w-full flex items-center gap-3 px-3.5 py-3 rounded-xl text-xs font-semibold bg-[var(--color-seal)] text-[var(--color-paper)] shadow-md font-bold text-left"
        >
          <LayoutDashboard size={16} />
          <span>Overview</span>
        </button>

        <button
          onClick={() => {
            navigate('/admin/global-management');
            setMobileOpen(false);
          }}
          className="w-full flex items-center gap-3 px-3.5 py-3 rounded-xl text-xs font-semibold text-[var(--color-paper)]/75 hover:bg-white/10 hover:text-[var(--color-paper)] transition-all text-left"
        >
          <Globe size={16} className="text-[var(--color-seal-soft)]" />
          <span>Global Management</span>
        </button>

        <div className="pt-4 pb-1">
          <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-seal-soft)] px-3">Programmes</p>
        </div>

        <button
          onClick={() => {
            navigate(`/admin-dashboard/programme/${encodeURIComponent(ugProgram.name)}`);
            setMobileOpen(false);
          }}
          className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-medium text-[var(--color-paper)]/75 hover:bg-white/10 hover:text-[var(--color-paper)] transition-all text-left"
        >
          <BookOpen size={15} className="text-[var(--color-verdant-soft)] shrink-0" />
          <span className="truncate">{ugProgram.name}</span>
        </button>

        {pgPrograms.map((prog) => (
          <button
            key={prog._id}
            onClick={() => {
              navigate(`/admin-dashboard/programme/${encodeURIComponent(prog.name)}`);
              setMobileOpen(false);
            }}
            className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-medium text-[var(--color-paper)]/75 hover:bg-white/10 hover:text-[var(--color-paper)] transition-all text-left"
          >
            <GraduationCap size={15} className="text-[var(--color-seal-soft)] shrink-0" />
            <span className="truncate">{prog.name}</span>
          </button>
        ))}
      </nav>

      {/* Bottom Footer Actions */}
      <div className="p-4 border-t border-[var(--color-ink-soft)]/60 space-y-2">
        <button
          onClick={() => refetch()}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold bg-white/10 hover:bg-white/20 text-[var(--color-paper)] transition-colors"
        >
          <RefreshCw size={14} /> Refresh List
        </button>
        <button
          onClick={() => {
            logout();
            navigate('/login', { replace: true });
          }}
          className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-xs font-semibold bg-[var(--color-flag)]/80 hover:bg-[var(--color-flag)] text-[var(--color-paper)] transition-colors"
        >
          <LogOut size={14} /> Logout
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex bg-[var(--color-paper)] text-[var(--color-ink)]">
      {/* Desktop Left Side Panel */}
      <aside className="hidden lg:block w-72 shrink-0 h-screen sticky top-0 shadow-[var(--shadow-raised)] z-20">
        {sidebarContent}
      </aside>

      {/* Mobile Top Header & Overlay Drawer */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-14 bg-[var(--color-ink)] text-[var(--color-paper)] px-4 flex items-center justify-between z-30 border-b border-[var(--color-seal)]/30">
        <div className="flex items-center gap-2.5">
          <button onClick={() => setMobileOpen(!mobileOpen)} className="p-1.5 rounded-lg bg-white/10 text-[var(--color-paper)]">
            {mobileOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
          <span className="font-display font-semibold text-sm">Control Panel</span>
        </div>
      </div>

      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-40 flex">
          <div className="fixed inset-0 bg-[var(--color-ink)]/50 backdrop-blur-xs" onClick={() => setMobileOpen(false)} />
          <div className="relative w-72 h-full z-50">{sidebarContent}</div>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 min-w-0 p-6 lg:p-10 pt-20 lg:pt-10 overflow-y-auto space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="font-display text-2xl font-bold tracking-tight text-[var(--color-ink)]">Admin Overview</h1>
            <p className="mt-1 text-xs text-[var(--color-ink-faint)]">Select a context from the side panel to manage students, panels, and reviews.</p>
          </div>
          <RoleSwitcher />
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
      </main>
    </div>
  );
}
