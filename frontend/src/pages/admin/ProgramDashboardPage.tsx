import React, { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import {
  Users,
  Sliders,
  LayoutGrid,
  GitBranch,
  ClipboardCheck,
  UserCheck,
  Calendar,
  ArrowLeft,
  LogOut,
  Menu,
  X,
  FileText,
  FileSignature,
  FileCheck,
  Wand2,
  Trash2,
  Download,
  Upload,
  Plus,
  Check,
  AlertCircle,
  Eye,
  BarChart2,
  Clock,
  CheckCircle2,
  XCircle,
  Play,
  Filter,
} from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { usePrograms } from '@/api/programs';
import { useFacultyList } from '@/api/faculty';
import {
  useStudentList,
  useDeleteStudent,
  useDeleteAllStudents,
  useImportStudents,
  downloadStudentTemplate,
} from '@/api/students';
import { useReviewPanels, useUpsertReviewPanel } from '@/api/panels';
import {
  useAllocationTable,
  useAutoAssign,
  useAutoAssignPanels,
} from '@/api/assignments';
import { useDeleteUnassignedTeams, useDeleteSoloTeams } from '@/api/teams';
import { useInstructions, useCreateInstruction, useDeleteInstruction } from '@/api/instructions';
import {
  useLetterTemplates,
  usePreviewLetter,
  useSignatures,
  useCreateSignature,
  useDeleteSignature,
  downloadLetterPDF,
} from '@/api/documents';
import { useReports, useApproveReport, useRejectReport } from '@/api/reports';
import { useProgramAttendance, downloadAttendance } from '@/api/attendance';
import {
  useScheduledSlots,
  useGenerateSchedules,
  useClearSchedules,
  useDeleteScheduledSlot,
} from '@/api/scheduling';
import { triggerDownload } from '@/lib/download';
import { toast } from '@/components/ui/Toast';
import { apiErrorMessage, api } from '@/api/client';
import { useQuery } from '@tanstack/react-query';

export function ProgramDashboardPage() {
  const { programId } = useParams<{ programId: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'student-registration';
  const [mobileOpen, setMobileOpen] = useState(false);

  const { data: programs } = usePrograms();
  const logout = useAuthStore((s) => s.logout);
  const navigate = useNavigate();

  const program = programs?.find((p) => p._id === programId || p.code === programId || p.name === programId) ?? {
    _id: programId || 'UG',
    name: programId === 'UG' ? 'UG' : programId || 'UG',
    type: 'UG' as const,
    code: 'UG',
    maxTeamSize: 4,
  };

  function setTab(tab: string) {
    setSearchParams({ tab });
    setMobileOpen(false);
  }

  const navItems = [
    { id: 'student-registration', label: 'Student Registration', icon: Users },
    { id: 'settings', label: 'Settings', icon: Sliders },
    { id: 'review-panels', label: 'Review Panels', icon: LayoutGrid },
    { id: 'team-panel-allocations', label: 'Team Panel Allocations', icon: GitBranch },
    { id: 'instructions', label: 'Instruction Templates', icon: FileText },
    { id: 'official-letters', label: 'Official Letters & Signatures', icon: FileSignature },
    { id: 'final-reports', label: 'Final Reports & Audits', icon: FileCheck },
    { id: 'review-attendance', label: 'Review Attendance', icon: ClipboardCheck },
    { id: 'student-attendance', label: 'Student Attendance', icon: UserCheck },
    { id: 'schedules', label: 'Schedules', icon: Calendar },
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
              Admin ({program.name})
            </span>
          </div>
        </div>
      </div>

      {/* Nav Menu */}
      <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto scrollbar-thin">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setTab(item.id)}
              className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-xl text-xs font-semibold transition-all text-left ${
                isActive
                  ? 'bg-[var(--color-seal)] text-[var(--color-paper)] shadow-md font-bold'
                  : 'text-[var(--color-paper)]/75 hover:bg-white/10 hover:text-[var(--color-paper)]'
              }`}
            >
              <Icon size={16} className={isActive ? 'text-[var(--color-paper)]' : 'text-[var(--color-seal-soft)]'} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Bottom Footer Actions */}
      <div className="p-4 border-t border-[var(--color-ink-soft)]/60 space-y-2">
        <button
          onClick={() => navigate('/admin')}
          className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-xs font-semibold bg-white/10 hover:bg-white/20 text-[var(--color-paper)] transition-colors"
        >
          <ArrowLeft size={14} /> Control Panel
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
          <span className="font-display font-semibold text-sm">Dashboard ({program.name})</span>
        </div>
      </div>

      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-40 flex">
          <div className="fixed inset-0 bg-[var(--color-ink)]/50 backdrop-blur-xs" onClick={() => setMobileOpen(false)} />
          <div className="relative w-72 h-full z-50">{sidebarContent}</div>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 min-w-0 p-6 lg:p-10 pt-20 lg:pt-10 overflow-y-auto space-y-6">
        {activeTab === 'student-registration' && <StudentRegistrationTab programId={program._id} programName={program.name} />}
        {activeTab === 'settings' && <SettingsTab programId={program._id} programName={program.name} maxTeamSize={program.maxTeamSize} />}
        {activeTab === 'review-panels' && <ReviewPanelsTab programName={program.name} />}
        {activeTab === 'team-panel-allocations' && <TeamPanelAllocationsTab programId={program._id} programName={program.name} />}
        {activeTab === 'instructions' && <InstructionsTab programName={program.name} />}
        {activeTab === 'official-letters' && <OfficialLettersTab programId={program._id} programName={program.name} />}
        {activeTab === 'final-reports' && <FinalReportsTab programName={program.name} />}
        {activeTab === 'review-attendance' && <ReviewAttendanceTab programName={program.name} />}
        {activeTab === 'student-attendance' && <StudentAttendanceTab programId={program._id} programName={program.name} />}
        {activeTab === 'schedules' && <SchedulesTab programName={program.name} />}
      </main>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* TAB 1: STUDENT REGISTRATION                                                */
/* -------------------------------------------------------------------------- */
function StudentRegistrationTab({ programId, programName }: { programId: string; programName: string }) {
  const { data: studentData, refetch } = useStudentList(programId);
  const deleteStudentMutation = useDeleteStudent();
  const deleteAllStudentsMutation = useDeleteAllStudents();
  const importStudentsMutation = useImportStudents();
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleDownloadTemplate() {
    try {
      const blob = await downloadStudentTemplate();
      triggerDownload(blob, `student-template-${programName.toLowerCase().replace(/\s+/g, '-')}.csv`);
      toast.success('Downloaded student CSV template');
    } catch (e) {
      toast.error(apiErrorMessage(e));
    }
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const res = await importStudentsMutation.mutateAsync({ file, programId });
      toast.success(`Imported ${res.inserted} students`);
      refetch();
    } catch (err) {
      toast.error(apiErrorMessage(err));
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }

  async function handleDeleteStudent(regNo: string) {
    if (!confirm(`Are you sure you want to delete student ${regNo}?`)) return;
    try {
      await deleteStudentMutation.mutateAsync(regNo);
      toast.success(`Deleted student ${regNo}`);
      refetch();
    } catch (e) {
      toast.error(apiErrorMessage(e));
    }
  }

  async function handleDeleteAll() {
    if (!confirm(`WARNING: Are you sure you want to delete ALL students in ${programName}?`)) return;
    try {
      await deleteAllStudentsMutation.mutateAsync(programId);
      toast.success(`Deleted all students in ${programName}`);
      refetch();
    } catch (e) {
      toast.error(apiErrorMessage(e));
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-[var(--color-ink)]">Student Registration — {programName}</h1>
          <p className="text-xs text-[var(--color-ink-faint)] mt-1">Manage student enrollments and bulk CSV imports for this programme.</p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button onClick={handleDownloadTemplate} className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-white border border-[var(--color-ink)]/15 hover:border-[var(--color-seal)] text-[var(--color-ink)] transition-colors flex items-center gap-2 shadow-xs">
            <Download size={14} /> Template
          </button>
          <button onClick={() => fileInputRef.current?.click()} className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-[var(--color-seal)] hover:bg-[var(--color-seal)]/90 text-[var(--color-paper)] transition-colors flex items-center gap-2 shadow-sm">
            <Upload size={14} /> Bulk Upload CSV
          </button>
          <input ref={fileInputRef} type="file" accept=".csv" className="hidden" onChange={handleFileChange} />
          <button onClick={handleDeleteAll} className="px-3 py-2 rounded-xl text-xs font-semibold bg-[var(--color-flag-soft)] text-[var(--color-flag)] hover:bg-[var(--color-flag)] hover:text-white transition-colors flex items-center gap-1.5">
            <Trash2 size={14} /> Delete All
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-[var(--color-ink)]/10 shadow-[var(--shadow-card)] overflow-hidden">
        <div className="p-4 border-b border-[var(--color-ink)]/10 flex items-center justify-between bg-[var(--color-paper)]/50">
          <span className="text-xs font-bold text-[var(--color-ink-soft)] uppercase tracking-wider">Enrolled Students ({studentData?.items.length ?? 0})</span>
        </div>
        {studentData?.items.length === 0 ? (
          <div className="p-12 text-center text-xs text-[var(--color-ink-faint)] font-medium">No students enrolled yet. Upload a CSV file above.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-[var(--color-ink)]/10 bg-[var(--color-paper)]/30 font-semibold text-[var(--color-ink-soft)]">
                  <th className="p-3.5 pl-6">Register No</th>
                  <th className="p-3.5">Name</th>
                  <th className="p-3.5">Email</th>
                  <th className="p-3.5 text-right pr-6">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-ink)]/5">
                {studentData?.items.map((st) => (
                  <tr key={st._id} className="hover:bg-[var(--color-paper-dim)]/50 transition-colors">
                    <td className="p-3.5 pl-6 font-data font-medium text-[var(--color-ink)]">{st.regNo}</td>
                    <td className="p-3.5 font-semibold text-[var(--color-ink)]">{st.name}</td>
                    <td className="p-3.5 text-[var(--color-ink-faint)]">{st.email}</td>
                    <td className="p-3.5 text-right pr-6">
                      <button onClick={() => handleDeleteStudent(st.regNo)} className="p-1.5 rounded hover:bg-[var(--color-flag-soft)] text-[var(--color-flag)] transition-colors">
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* TAB 2: SETTINGS                                                            */
/* -------------------------------------------------------------------------- */
function SettingsTab({ programId, programName, maxTeamSize }: { programId: string; programName: string; maxTeamSize: number }) {
  const [teamSize, setTeamSize] = useState(maxTeamSize);
  const [numReviews, setNumReviews] = useState(3);
  const [vivaRequired, setVivaRequired] = useState(true);

  const { data: config } = useQuery({
    queryKey: ['admin-config', programId],
    queryFn: async () => {
      const res = await api.get<{ config: { numReviews: number; vivaRequired: boolean } }>('/admin-config', { params: { program: programId } });
      return res.data.config;
    },
  });

  useEffect(() => {
    if (config) {
      setNumReviews(config.numReviews ?? 3);
      setVivaRequired(config.vivaRequired ?? true);
    }
  }, [config]);

  async function handleSaveTeamSize() {
    try {
      await api.patch(`/programs/${programId}`, { maxTeamSize: teamSize });
      toast.success('Updated team size limit');
    } catch (e) {
      toast.error(apiErrorMessage(e));
    }
  }

  async function handleSaveReviewSettings() {
    try {
      await api.post('/admin-config/reviews-viva', { program: programId, numReviews, vivaRequired });
      toast.success('Saved review configuration settings');
    } catch (e) {
      toast.error(apiErrorMessage(e));
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-[var(--color-ink)]">Programme Settings — {programName}</h1>
        <p className="text-xs text-[var(--color-ink-faint)] mt-1">Configure team formation rules, maximum team sizes, and review evaluation parameters.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-[var(--color-ink)]/10 shadow-[var(--shadow-card)] p-6 space-y-4">
          <h2 className="font-display text-base font-bold text-[var(--color-ink)]">Team Size Settings</h2>
          <p className="text-xs text-[var(--color-ink-faint)]">Maximum number of students permitted per project team in {programName}.</p>
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-[var(--color-ink-soft)]">Max Team Size</label>
            <input
              type="number"
              min={1}
              max={10}
              value={teamSize}
              onChange={(e) => setTeamSize(Number(e.target.value))}
              className="w-full px-3.5 py-2.5 rounded-lg border border-[var(--color-ink)]/15 text-xs font-data"
            />
          </div>
          <button onClick={handleSaveTeamSize} className="w-full py-2.5 rounded-xl text-xs font-semibold bg-[var(--color-seal)] text-[var(--color-paper)] shadow-xs">
            Save Team Size
          </button>
        </div>

        <div className="bg-white rounded-xl border border-[var(--color-ink)]/10 shadow-[var(--shadow-card)] p-6 space-y-4">
          <h2 className="font-display text-base font-bold text-[var(--color-ink)]">Review & Viva Settings</h2>
          <div className="space-y-3">
            <label className="block text-xs font-semibold text-[var(--color-ink-soft)]">Number of Reviews ({numReviews})</label>
            <input
              type="range"
              min={1}
              max={10}
              value={numReviews}
              onChange={(e) => setNumReviews(Number(e.target.value))}
              className="w-full accent-[var(--color-seal)]"
            />
          </div>
          <div className="flex items-center justify-between p-3 bg-[var(--color-paper)]/50 rounded-lg border border-[var(--color-ink)]/10">
            <span className="text-xs font-semibold text-[var(--color-ink)]">Enable Viva Session</span>
            <input type="checkbox" checked={vivaRequired} onChange={(e) => setVivaRequired(e.target.checked)} className="accent-[var(--color-seal)]" />
          </div>
          <button onClick={handleSaveReviewSettings} className="w-full py-2.5 rounded-xl text-xs font-semibold bg-[var(--color-seal)] text-[var(--color-paper)] shadow-xs">
            Save Review Settings
          </button>
        </div>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* TAB 3: REVIEW PANELS                                                       */
/* -------------------------------------------------------------------------- */
function ReviewPanelsTab({ programName }: { programName: string }) {
  const { data: panels, refetch } = useReviewPanels(programName);
  const { data: faculty } = useFacultyList();
  const upsertPanelMutation = useUpsertReviewPanel();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedFaculty, setSelectedFaculty] = useState<string[]>([]);

  async function handleCreatePanel() {
    if (selectedFaculty.length === 0) return toast.error('Select at least one faculty member');
    try {
      await upsertPanelMutation.mutateAsync({ program: programName, memberIds: selectedFaculty, coordinatorId: selectedFaculty[0] });
      toast.success('Created review panel');
      setShowCreateModal(false);
      setSelectedFaculty([]);
      refetch();
    } catch (e) {
      toast.error(apiErrorMessage(e));
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-[var(--color-ink)]">Review Panels — {programName}</h1>
          <p className="text-xs text-[var(--color-ink-faint)] mt-1">Manage panel structures and faculty assignments for project evaluations.</p>
        </div>
        <button onClick={() => setShowCreateModal(true)} className="px-4 py-2 rounded-xl text-xs font-semibold bg-[var(--color-seal)] text-[var(--color-paper)] flex items-center gap-2 shadow-sm">
          <Plus size={15} /> Create Panel
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {panels?.map((panel, idx) => (
          <div key={panel._id} className="bg-white rounded-xl border border-[var(--color-ink)]/10 shadow-[var(--shadow-card)] p-5 space-y-3">
            <div className="flex items-center justify-between border-b border-[var(--color-ink)]/10 pb-2">
              <span className="font-display font-bold text-sm text-[var(--color-ink)]">Panel #{idx + 1}</span>
              <span className="text-[10px] font-data font-bold px-2 py-0.5 rounded bg-[var(--color-seal-dim)] text-[var(--color-seal)]">
                {panel.teamIds.length} Teams
              </span>
            </div>
            <div className="space-y-1 text-xs">
              <p className="font-semibold text-[var(--color-ink-soft)]">Coordinator: {panel.coordinatorId?.name ?? 'Unassigned'}</p>
              <div className="pt-2 space-y-1">
                <p className="text-[11px] font-bold text-[var(--color-ink-faint)] uppercase">Members ({panel.memberIds.length})</p>
                {panel.memberIds.map((m) => (
                  <div key={m._id} className="px-2.5 py-1 rounded bg-[var(--color-paper)] text-[var(--color-ink)] font-medium">
                    {m.name}
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      {showCreateModal && (
        <div className="fixed inset-0 bg-[var(--color-ink)]/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-md w-full p-6 space-y-4 shadow-[var(--shadow-raised)] border border-[var(--color-ink)]/10">
            <h3 className="font-display text-lg font-bold text-[var(--color-ink)]">Create New Review Panel</h3>
            <p className="text-xs text-[var(--color-ink-faint)]">Select faculty members (max 4). First selected member becomes Coordinator.</p>

            <div className="max-h-60 overflow-y-auto space-y-1.5 border border-[var(--color-ink)]/10 p-2 rounded-lg">
              {faculty?.items.map((f) => (
                <label key={f._id} className="flex items-center gap-2 p-2 hover:bg-[var(--color-paper-dim)] rounded text-xs cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedFaculty.includes(f._id)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        if (selectedFaculty.length >= 4) return toast.error('Maximum 4 members allowed');
                        setSelectedFaculty([...selectedFaculty, f._id]);
                      } else {
                        setSelectedFaculty(selectedFaculty.filter((id) => id !== f._id));
                      }
                    }}
                  />
                  <span className="font-medium text-[var(--color-ink)]">{f.name}</span>
                </label>
              ))}
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button onClick={() => setShowCreateModal(false)} className="px-4 py-2 rounded-lg text-xs font-semibold bg-[var(--color-paper-dim)] text-[var(--color-ink)]">
                Cancel
              </button>
              <button onClick={handleCreatePanel} className="px-4 py-2 rounded-lg text-xs font-semibold bg-[var(--color-seal)] text-[var(--color-paper)]">
                Create Panel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* TAB 4: TEAM PANEL ALLOCATIONS                                              */
/* -------------------------------------------------------------------------- */
function TeamPanelAllocationsTab({ programId, programName }: { programId: string; programName: string }) {
  const { data: rows, refetch } = useAllocationTable(programId);
  const autoAssignGuidesMutation = useAutoAssign();
  const autoAssignPanelsMutation = useAutoAssignPanels();
  const deleteUnassignedMutation = useDeleteUnassignedTeams();
  const deleteSoloMutation = useDeleteSoloTeams();

  const totalTeams = rows?.length ?? 0;
  const fullyAllocated = rows?.filter((r) => r.guide && r.panel).length ?? 0;
  const pendingGuide = rows?.filter((r) => !r.guide).length ?? 0;
  const pendingPanel = rows?.filter((r) => !r.panel).length ?? 0;
  const allocatedPct = totalTeams > 0 ? Math.round((fullyAllocated / totalTeams) * 100) : 0;

  async function handleAutoAssignGuides() {
    try {
      const res = await autoAssignGuidesMutation.mutateAsync(programId);
      toast.success(`Assigned ${res.assignedCount} teams to guides`);
      refetch();
    } catch (e) {
      toast.error(apiErrorMessage(e));
    }
  }

  async function handleAutoAssignPanels() {
    try {
      const res = await autoAssignPanelsMutation.mutateAsync(programId);
      toast.success(`Assigned ${res.assignedCount} teams to review panels`);
      refetch();
    } catch (e) {
      toast.error(apiErrorMessage(e));
    }
  }

  async function handleDeleteUnassigned() {
    if (!confirm('Delete all teams without an assigned guide?')) return;
    try {
      const res = await deleteUnassignedMutation.mutateAsync(programId);
      toast.success(`Deleted ${res.deletedCount} unassigned teams`);
      refetch();
    } catch (e) {
      toast.error(apiErrorMessage(e));
    }
  }

  async function handleDeleteSolo() {
    if (!confirm('Delete all single-member (solo) teams?')) return;
    try {
      const res = await deleteSoloMutation.mutateAsync(programId);
      toast.success(`Deleted ${res.deletedCount} solo teams`);
      refetch();
    } catch (e) {
      toast.error(apiErrorMessage(e));
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-[var(--color-ink)]">Team Panel Allocations — {programName}</h1>
          <p className="text-xs text-[var(--color-ink-faint)] mt-1">Auto-assign guides and review panels without conflicts of interest.</p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button onClick={handleAutoAssignGuides} className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-[var(--color-seal)] text-[var(--color-paper)] hover:bg-[var(--color-seal)]/90 transition-colors flex items-center gap-1.5 shadow-xs">
            <Wand2 size={14} /> Auto-Assign Guides
          </button>
          <button onClick={handleAutoAssignPanels} className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-[var(--color-verdant)] text-white hover:bg-[var(--color-verdant)]/90 transition-colors flex items-center gap-1.5 shadow-xs">
            <Wand2 size={14} /> Auto-Assign Panels
          </button>
          <button onClick={handleDeleteUnassigned} className="px-3 py-2 rounded-xl text-xs font-semibold bg-[var(--color-flag-soft)] text-[var(--color-flag)] hover:bg-[var(--color-flag)] hover:text-white transition-colors flex items-center gap-1">
            <Trash2 size={14} /> Clear Unassigned
          </button>
          <button onClick={handleDeleteSolo} className="px-3 py-2 rounded-xl text-xs font-semibold bg-[var(--color-paper-dim)] text-[var(--color-ink-soft)] hover:bg-[var(--color-ink)]/10 transition-colors flex items-center gap-1">
            <Trash2 size={14} /> Clear Solo
          </button>
        </div>
      </div>

      {/* Analytics Graph & Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-[var(--color-ink)]/10 shadow-[var(--shadow-card)] space-y-2">
          <span className="text-[11px] font-bold text-[var(--color-ink-faint)] uppercase tracking-wider">Total Teams</span>
          <p className="text-2xl font-display font-bold text-[var(--color-ink)]">{totalTeams}</p>
        </div>
        <div className="bg-white p-5 rounded-xl border border-[var(--color-ink)]/10 shadow-[var(--shadow-card)] space-y-2">
          <span className="text-[11px] font-bold text-[var(--color-verdant)] uppercase tracking-wider">Fully Allocated</span>
          <p className="text-2xl font-display font-bold text-[var(--color-verdant)]">{fullyAllocated}</p>
        </div>
        <div className="bg-white p-5 rounded-xl border border-[var(--color-ink)]/10 shadow-[var(--shadow-card)] space-y-2">
          <span className="text-[11px] font-bold text-[var(--color-seal)] uppercase tracking-wider">Pending Guide</span>
          <p className="text-2xl font-display font-bold text-[var(--color-seal)]">{pendingGuide}</p>
        </div>
        <div className="bg-white p-5 rounded-xl border border-[var(--color-ink)]/10 shadow-[var(--shadow-card)] space-y-2">
          <span className="text-[11px] font-bold text-[var(--color-flag)] uppercase tracking-wider">Pending Panel</span>
          <p className="text-2xl font-display font-bold text-[var(--color-flag)]">{pendingPanel}</p>
        </div>
      </div>

      {/* Allocation Progress Graph */}
      <div className="bg-white p-6 rounded-xl border border-[var(--color-ink)]/10 shadow-[var(--shadow-card)] space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-[var(--color-ink)] uppercase tracking-wider flex items-center gap-2">
            <BarChart2 size={16} className="text-[var(--color-seal)]" /> Allocation Coverage Graph
          </span>
          <span className="text-xs font-bold text-[var(--color-seal)] font-data">{allocatedPct}% Completed</span>
        </div>
        <div className="w-full h-4 bg-[var(--color-paper-dim)] rounded-full overflow-hidden flex">
          <div className="bg-[var(--color-verdant)] transition-all duration-500" style={{ width: `${allocatedPct}%` }} title={`Allocated: ${fullyAllocated}`} />
          <div className="bg-[var(--color-seal)] transition-all duration-500" style={{ width: `${totalTeams > 0 ? ((pendingGuide) / totalTeams) * 100 : 0}%` }} title={`Pending Guide: ${pendingGuide}`} />
          <div className="bg-[var(--color-flag)] transition-all duration-500" style={{ width: `${totalTeams > 0 ? ((pendingPanel) / totalTeams) * 100 : 0}%` }} title={`Pending Panel: ${pendingPanel}`} />
        </div>
        <div className="flex items-center gap-4 text-[11px] text-[var(--color-ink-faint)] pt-1">
          <span className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-[var(--color-verdant)]" /> Fully Allocated ({fullyAllocated})</span>
          <span className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-[var(--color-seal)]" /> Needs Guide ({pendingGuide})</span>
          <span className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-[var(--color-flag)]" /> Needs Panel ({pendingPanel})</span>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-[var(--color-ink)]/10 shadow-[var(--shadow-card)] overflow-hidden">
        <div className="p-4 border-b border-[var(--color-ink)]/10 bg-[var(--color-paper)]/50 flex items-center justify-between">
          <span className="text-xs font-bold text-[var(--color-ink-soft)] uppercase tracking-wider">Allocations Summary ({rows?.length ?? 0} Teams)</span>
        </div>

        {rows?.length === 0 ? (
          <div className="p-12 text-center text-xs text-[var(--color-ink-faint)] font-medium">No teams registered for {programName}.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-[var(--color-ink)]/10 bg-[var(--color-paper)]/30 font-semibold text-[var(--color-ink-soft)]">
                  <th className="p-3.5 pl-6">Team Name</th>
                  <th className="p-3.5">Assigned Guide</th>
                  <th className="p-3.5">Assigned Panel</th>
                  <th className="p-3.5 pr-6">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-ink)]/5">
                {rows?.map((row) => (
                  <tr key={row.teamId} className="hover:bg-[var(--color-paper-dim)]/50 transition-colors">
                    <td className="p-3.5 pl-6 font-display font-bold text-[var(--color-ink)]">{row.teamName}</td>
                    <td className="p-3.5 font-medium text-[var(--color-ink)]">{row.guide?.name ?? <span className="text-[var(--color-flag)] font-bold">Unassigned</span>}</td>
                    <td className="p-3.5 font-medium text-[var(--color-ink)]">{row.panel ? `Panel (Coord: ${row.panel.coordinatorId?.name ?? 'N/A'})` : <span className="text-[var(--color-flag)] font-bold">Unassigned</span>}</td>
                    <td className="p-3.5 pr-6">
                      {row.guide && row.panel ? (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[var(--color-verdant-soft)] text-[var(--color-verdant)]">Allocated</span>
                      ) : (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[var(--color-seal-dim)] text-[var(--color-seal)]">Pending</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* TAB 5: INSTRUCTION TEMPLATES                                               */
/* -------------------------------------------------------------------------- */
function InstructionsTab({ programName }: { programName: string }) {
  const { data: instructions, refetch } = useInstructions(programName);
  const createMutation = useCreateInstruction();
  const deleteMutation = useDeleteInstruction();
  const [showModal, setShowModal] = useState(false);
  const [title, setTitle] = useState('');
  const [text, setText] = useState('');
  const [file, setFile] = useState<File | null>(null);

  async function handleCreate() {
    if (!title) return toast.error('Instruction title is required');
    try {
      const formData = new FormData();
      formData.append('program', programName);
      formData.append('title', title);
      formData.append('instructions', text);
      if (file) formData.append('file', file);

      await createMutation.mutateAsync(formData);
      toast.success('Instruction template published');
      setShowModal(false);
      setTitle('');
      setText('');
      setFile(null);
      refetch();
    } catch (e) {
      toast.error(apiErrorMessage(e));
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this instruction template?')) return;
    try {
      await deleteMutation.mutateAsync(id);
      toast.success('Deleted instruction template');
      refetch();
    } catch (e) {
      toast.error(apiErrorMessage(e));
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-[var(--color-ink)]">Instruction Templates — {programName}</h1>
          <p className="text-xs text-[var(--color-ink-faint)] mt-1">Publish review instructions and reference documents for students.</p>
        </div>
        <button onClick={() => setShowModal(true)} className="px-4 py-2 rounded-xl text-xs font-semibold bg-[var(--color-seal)] text-[var(--color-paper)] flex items-center gap-2 shadow-sm">
          <Plus size={15} /> Publish Template
        </button>
      </div>

      <div className="space-y-3">
        {instructions?.length === 0 ? (
          <div className="bg-white rounded-xl border border-[var(--color-ink)]/10 p-12 text-center text-xs text-[var(--color-ink-faint)] font-medium">
            No instruction templates published for {programName} yet.
          </div>
        ) : (
          instructions?.map((inst) => (
            <div key={inst._id} className="bg-white rounded-xl border border-[var(--color-ink)]/10 shadow-[var(--shadow-card)] p-5 flex items-center justify-between">
              <div className="space-y-1">
                <h3 className="font-display text-base font-bold text-[var(--color-ink)]">{inst.title}</h3>
                <p className="text-xs text-[var(--color-ink-soft)] leading-relaxed">{inst.instructions || 'No textual instructions attached.'}</p>
                {inst.fileName && (
                  <a href={`/api/instructions/${inst._id}/download`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--color-seal)] hover:underline pt-1">
                    <Download size={13} /> {inst.fileName}
                  </a>
                )}
              </div>
              <button onClick={() => handleDelete(inst._id)} className="p-2 text-[var(--color-flag)] hover:bg-[var(--color-flag-soft)] rounded-lg transition-colors">
                <Trash2 size={16} />
              </button>
            </div>
          ))
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-[var(--color-ink)]/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-md w-full p-6 space-y-4 shadow-[var(--shadow-raised)] border border-[var(--color-ink)]/10">
            <h3 className="font-display text-lg font-bold text-[var(--color-ink)]">Publish Instruction Template</h3>
            <div className="space-y-3">
              <input type="text" placeholder="Template Title (e.g. Review 1 Guidelines)" value={title} onChange={(e) => setTitle(e.target.value)} className="w-full px-3 py-2 border border-[var(--color-ink)]/15 rounded-lg text-xs" />
              <textarea placeholder="Instruction text / rubric breakdown..." value={text} onChange={(e) => setText(e.target.value)} rows={4} className="w-full px-3 py-2 border border-[var(--color-ink)]/15 rounded-lg text-xs" />
              <input type="file" onChange={(e) => setFile(e.target.files?.[0] || null)} className="text-xs text-[var(--color-ink-faint)]" />
            </div>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button onClick={() => setShowModal(false)} className="px-4 py-2 rounded-lg text-xs font-semibold bg-[var(--color-paper-dim)] text-[var(--color-ink)]">Cancel</button>
              <button onClick={handleCreate} className="px-4 py-2 rounded-lg text-xs font-semibold bg-[var(--color-seal)] text-[var(--color-paper)]">Publish</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* TAB 6: OFFICIAL LETTERS & SIGNATURES                                       */
/* -------------------------------------------------------------------------- */
function OfficialLettersTab({ programId, programName }: { programId: string; programName: string }) {
  const { data: templates } = useLetterTemplates();
  const { data: signatures, refetch: refetchSigs } = useSignatures();
  const createSigMutation = useCreateSignature();
  const deleteSigMutation = useDeleteSignature();

  const [selectedTemplate, setSelectedTemplate] = useState('viva_letter');
  const [teamId, setTeamId] = useState('');
  const [reviewDate, setReviewDate] = useState(new Date().toLocaleDateString('en-IN'));

  const { data: previewData } = usePreviewLetter(selectedTemplate, teamId, reviewDate);
  const { data: teams } = useAllocationTable(programId);

  const [sigLabel, setSigLabel] = useState('');
  const [sigFilename, setSigFilename] = useState('');
  const [sigBase64, setSigBase64] = useState('');
  const [downloading, setDownloading] = useState(false);

  async function handleAddSignature() {
    if (!sigLabel || !sigBase64) return toast.error('Signature label and image file are required');
    try {
      await createSigMutation.mutateAsync({ label: sigLabel, imageBase64: sigBase64, filename: sigFilename });
      toast.success('Signature uploaded');
      setSigLabel('');
      setSigFilename('');
      setSigBase64('');
      refetchSigs();
    } catch (e) {
      toast.error(apiErrorMessage(e));
    }
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setSigFilename(file.name);
    const reader = new FileReader();
    reader.onload = () => setSigBase64(reader.result as string);
    reader.readAsDataURL(file);
  }

  async function handleDeleteSig(id: string) {
    try {
      await deleteSigMutation.mutateAsync(id);
      toast.success('Deleted signature');
      refetchSigs();
    } catch (e) {
      toast.error(apiErrorMessage(e));
    }
  }

  async function handleDownloadLetter() {
    if (!teamId) return toast.error('Select a target team to generate letter');
    try {
      setDownloading(true);
      const selectedTeamObj = teams?.find((t) => t.teamId === teamId);
      await downloadLetterPDF(selectedTemplate, teamId, reviewDate, selectedTeamObj?.teamName);
      toast.success('Official PDF letter generated & downloaded');
    } catch (e) {
      toast.error(apiErrorMessage(e));
    } finally {
      setDownloading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-[var(--color-ink)]">Official Letters & Signatures — {programName}</h1>
        <p className="text-xs text-[var(--color-ink-faint)] mt-1">Generate examiner claim letters, viva appointment forms, and manage digital signatures.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Letter Generator */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-[var(--color-ink)]/10 shadow-[var(--shadow-card)] p-6 space-y-4">
          <h2 className="font-display text-base font-bold text-[var(--color-ink)]">Letter Generator</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[var(--color-ink-soft)] mb-1">Letter Type</label>
              <select value={selectedTemplate} onChange={(e) => setSelectedTemplate(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-[var(--color-ink)]/15 text-xs">
                {templates?.map((t) => (
                  <option key={t.id} value={t.id}>{t.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-[var(--color-ink-soft)] mb-1">Target Team</label>
              <select value={teamId} onChange={(e) => setTeamId(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-[var(--color-ink)]/15 text-xs">
                <option value="">Select Team...</option>
                {teams?.map((t) => (
                  <option key={t.teamId} value={t.teamId}>{t.teamName}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-[var(--color-ink-soft)] mb-1">Date</label>
              <input type="text" value={reviewDate} onChange={(e) => setReviewDate(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-[var(--color-ink)]/15 text-xs font-data" />
            </div>
          </div>

          {previewData && (
            <div className="space-y-2 pt-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-seal)]">Live Text Preview:</span>
              <pre className="p-4 rounded-lg bg-[var(--color-paper)] border border-[var(--color-ink)]/10 text-xs font-data whitespace-pre-wrap max-h-72 overflow-y-auto leading-relaxed">
                {previewData.preview}
              </pre>
            </div>
          )}

          <button
            onClick={handleDownloadLetter}
            disabled={downloading}
            className="w-full py-2.5 rounded-xl text-xs font-semibold bg-[var(--color-seal)] text-[var(--color-paper)] shadow-xs flex items-center justify-center gap-2 hover:opacity-95 disabled:opacity-50 transition-opacity"
          >
            <Download size={14} /> {downloading ? 'Generating Official PDF...' : 'Download Generated PDF Letter'}
          </button>
        </div>

        {/* Digital Signatures Manager */}
        <div className="bg-white rounded-xl border border-[var(--color-ink)]/10 shadow-[var(--shadow-card)] p-6 space-y-4">
          <h2 className="font-display text-base font-bold text-[var(--color-ink)]">Digital Signatures</h2>
          <div className="space-y-3 border-b border-[var(--color-ink)]/10 pb-4">
            <input type="text" placeholder="Signature Label (e.g. HOD Signature)" value={sigLabel} onChange={(e) => setSigLabel(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-[var(--color-ink)]/15 text-xs" />
            <input type="file" accept="image/*" onChange={handleFileChange} className="text-xs text-[var(--color-ink-faint)]" />
            <button onClick={handleAddSignature} className="w-full py-2 rounded-lg text-xs font-semibold bg-[var(--color-ink)] text-[var(--color-paper)] hover:bg-[var(--color-ink)]/90 transition-colors">
              Upload Signature
            </button>
          </div>

          <div className="space-y-2 max-h-60 overflow-y-auto">
            {signatures?.map((sig) => (
              <div key={sig._id} className="p-3 rounded-lg border border-[var(--color-ink)]/10 bg-[var(--color-paper)]/50 flex items-center justify-between">
                <div>
                  <p className="font-semibold text-xs text-[var(--color-ink)]">{sig.label || sig.role || 'Signature'}</p>
                  {sig.imageBase64 && <img src={sig.imageBase64} alt={sig.label || sig.role} className="h-8 object-contain mt-1 rounded bg-white p-0.5 border border-[var(--color-ink)]/10" />}
                </div>
                <button onClick={() => handleDeleteSig(sig._id)} className="p-1.5 text-[var(--color-flag)] hover:bg-[var(--color-flag-soft)] rounded transition-colors">
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* TAB 7: FINAL REPORTS & AUDITS                                              */
/* -------------------------------------------------------------------------- */
function FinalReportsTab({ programName }: { programName: string }) {
  const { data: reports, refetch } = useReports();
  const approveMutation = useApproveReport();
  const rejectMutation = useRejectReport();

  const [rejectModalId, setRejectModalId] = useState<string | null>(null);
  const [remarks, setRemarks] = useState('');

  async function handleApprove(id: string) {
    try {
      await approveMutation.mutateAsync(id);
      toast.success('Approved report');
      refetch();
    } catch (e) {
      toast.error(apiErrorMessage(e));
    }
  }

  async function handleReject() {
    if (!rejectModalId) return;
    try {
      await rejectMutation.mutateAsync({ id: rejectModalId, remarks });
      toast.success('Rejected report with remarks');
      setRejectModalId(null);
      setRemarks('');
      refetch();
    } catch (e) {
      toast.error(apiErrorMessage(e));
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-[var(--color-ink)]">Final Reports & Rejection Audits — {programName}</h1>
        <p className="text-xs text-[var(--color-ink-faint)] mt-1">Review student final PDF reports, approve, or reject with multi-turn audit history.</p>
      </div>

      <div className="bg-white rounded-xl border border-[var(--color-ink)]/10 shadow-[var(--shadow-card)] overflow-hidden">
        <div className="p-4 border-b border-[var(--color-ink)]/10 bg-[var(--color-paper)]/50 flex items-center justify-between">
          <span className="text-xs font-bold text-[var(--color-ink-soft)] uppercase tracking-wider">Submitted Final Reports ({reports?.length ?? 0})</span>
        </div>

        {reports?.length === 0 ? (
          <div className="p-12 text-center text-xs text-[var(--color-ink-faint)] font-medium">No reports uploaded yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-[var(--color-ink)]/10 bg-[var(--color-paper)]/30 font-semibold text-[var(--color-ink-soft)]">
                  <th className="p-3.5 pl-6">Team</th>
                  <th className="p-3.5">Uploaded By</th>
                  <th className="p-3.5">Filename</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5 pr-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-ink)]/5">
                {reports?.map((r) => (
                  <tr key={r._id} className="hover:bg-[var(--color-paper-dim)]/50 transition-colors">
                    <td className="p-3.5 pl-6 font-display font-bold text-[var(--color-ink)]">{r.teamId?.name ?? 'N/A'}</td>
                    <td className="p-3.5 font-medium text-[var(--color-ink)]">{r.uploadedBy?.name ?? 'Student'}</td>
                    <td className="p-3.5 text-[var(--color-ink-faint)] font-data">{r.filename}</td>
                    <td className="p-3.5">
                      {r.status === 'approved' && <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[var(--color-verdant-soft)] text-[var(--color-verdant)]">Approved</span>}
                      {r.status === 'rejected' && <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[var(--color-flag-soft)] text-[var(--color-flag)]">Rejected ({r.rejections?.length ?? 1}x)</span>}
                      {r.status === 'uploaded' && <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[var(--color-seal-dim)] text-[var(--color-seal)]">Uploaded</span>}
                    </td>
                    <td className="p-3.5 pr-6 text-right space-x-1">
                      <a href={`/api/reports/${r._id}/download`} target="_blank" rel="noreferrer" className="px-2.5 py-1 rounded bg-[var(--color-paper-dim)] text-[var(--color-ink)] font-semibold inline-flex items-center gap-1">
                        <Eye size={12} /> Download
                      </a>
                      {r.status !== 'approved' && (
                        <button onClick={() => handleApprove(r._id)} className="px-2.5 py-1 rounded bg-[var(--color-verdant)] text-white font-semibold">
                          Approve
                        </button>
                      )}
                      {r.status !== 'rejected' && (
                        <button onClick={() => setRejectModalId(r._id)} className="px-2.5 py-1 rounded bg-[var(--color-flag)] text-white font-semibold">
                          Reject
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {rejectModalId && (
        <div className="fixed inset-0 bg-[var(--color-ink)]/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-md w-full p-6 space-y-4 shadow-[var(--shadow-raised)] border border-[var(--color-ink)]/10">
            <h3 className="font-display text-lg font-bold text-[var(--color-ink)]">Reject Final Report</h3>
            <textarea placeholder="Reason for rejection / required revisions..." value={remarks} onChange={(e) => setRemarks(e.target.value)} rows={4} className="w-full px-3 py-2 border border-[var(--color-ink)]/15 rounded-lg text-xs" />
            <div className="flex items-center justify-end gap-2 pt-2">
              <button onClick={() => setRejectModalId(null)} className="px-4 py-2 rounded-lg text-xs font-semibold bg-[var(--color-paper-dim)] text-[var(--color-ink)]">Cancel</button>
              <button onClick={handleReject} className="px-4 py-2 rounded-lg text-xs font-semibold bg-[var(--color-flag)] text-white">Confirm Rejection</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* TAB 8: REVIEW ATTENDANCE                                                   */
/* -------------------------------------------------------------------------- */
function ReviewAttendanceTab({ programName }: { programName: string }) {
  const { data: records, isLoading } = useProgramAttendance(programName, 'review');
  const [filterKind, setFilterKind] = useState<string>('all');

  async function handleExport() {
    try {
      const res = await downloadAttendance({ program: programName, kind: 'review' });
      triggerDownload(res.data, `review-attendance-${programName.toLowerCase()}.xlsx`);
      toast.success('Downloaded Review Attendance Excel sheet');
    } catch (e) {
      toast.error(apiErrorMessage(e));
    }
  }

  const filteredRecords = records?.filter((r) => {
    if (filterKind === 'all') return true;
    return r.kind === filterKind;
  }) ?? [];

  const totalSessions = records?.length ?? 0;
  let totalStudentsEvaluated = 0;
  let totalPresentCount = 0;

  records?.forEach((rec) => {
    rec.perStudent?.forEach((st: any) => {
      totalStudentsEvaluated++;
      if (st.present) totalPresentCount++;
    });
  });

  const overallAttendanceRate = totalStudentsEvaluated > 0 ? Math.round((totalPresentCount / totalStudentsEvaluated) * 100) : 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-[var(--color-ink)]">Review Attendance — {programName}</h1>
          <p className="text-xs text-[var(--color-ink-faint)] mt-1">Faculty & team review evaluation attendance tracking across review rounds.</p>
        </div>

        <button onClick={handleExport} className="px-4 py-2 rounded-xl text-xs font-semibold bg-[var(--color-verdant)] text-white hover:bg-[var(--color-verdant)]/90 transition-colors flex items-center gap-2 shadow-xs">
          <Download size={14} /> Export Excel
        </button>
      </div>

      {/* Visual Stats Graph Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-xl border border-[var(--color-ink)]/10 shadow-[var(--shadow-card)] space-y-2">
          <span className="text-[11px] font-bold text-[var(--color-ink-faint)] uppercase tracking-wider">Recorded Sessions</span>
          <p className="text-2xl font-display font-bold text-[var(--color-ink)]">{totalSessions}</p>
        </div>
        <div className="bg-white p-5 rounded-xl border border-[var(--color-ink)]/10 shadow-[var(--shadow-card)] space-y-2">
          <span className="text-[11px] font-bold text-[var(--color-verdant)] uppercase tracking-wider">Total Present Marks</span>
          <p className="text-2xl font-display font-bold text-[var(--color-verdant)]">{totalPresentCount} / {totalStudentsEvaluated}</p>
        </div>
        <div className="bg-white p-5 rounded-xl border border-[var(--color-ink)]/10 shadow-[var(--shadow-card)] space-y-2">
          <span className="text-[11px] font-bold text-[var(--color-seal)] uppercase tracking-wider">Overall Attendance Rate</span>
          <div className="flex items-center gap-3">
            <span className="text-2xl font-display font-bold text-[var(--color-seal)] font-data">{overallAttendanceRate}%</span>
            <div className="flex-1 h-2 bg-[var(--color-paper-dim)] rounded-full overflow-hidden">
              <div className="h-full bg-[var(--color-seal)] transition-all duration-500" style={{ width: `${overallAttendanceRate}%` }} />
            </div>
          </div>
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-white rounded-xl border border-[var(--color-ink)]/10 shadow-[var(--shadow-card)] overflow-hidden">
        <div className="p-4 border-b border-[var(--color-ink)]/10 bg-[var(--color-paper)]/50 flex items-center justify-between">
          <span className="text-xs font-bold text-[var(--color-ink-soft)] uppercase tracking-wider">Attendance Logs ({filteredRecords.length})</span>
          <div className="flex items-center gap-2">
            <Filter size={14} className="text-[var(--color-ink-faint)]" />
            <select value={filterKind} onChange={(e) => setFilterKind(e.target.value)} className="px-2.5 py-1 rounded border border-[var(--color-ink)]/15 text-xs">
              <option value="all">All Types</option>
              <option value="review">Review Sessions</option>
              <option value="semester">Semester Sessions</option>
            </select>
          </div>
        </div>

        {isLoading ? (
          <div className="p-8 text-center text-xs text-[var(--color-ink-faint)]">Loading attendance logs...</div>
        ) : filteredRecords.length === 0 ? (
          <div className="p-12 text-center text-xs text-[var(--color-ink-faint)] font-medium">No review attendance recorded yet for {programName}.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-[var(--color-ink)]/10 bg-[var(--color-paper)]/30 font-semibold text-[var(--color-ink-soft)]">
                  <th className="p-3.5 pl-6">Team</th>
                  <th className="p-3.5">Date & Time</th>
                  <th className="p-3.5">Session Kind</th>
                  <th className="p-3.5">Present / Total</th>
                  <th className="p-3.5 pr-6 text-right">Student Breakdown</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-ink)]/5">
                {filteredRecords.map((rec) => {
                  const presentCount = rec.perStudent?.filter((s: any) => s.present).length ?? 0;
                  const totalCount = rec.perStudent?.length ?? 0;
                  return (
                    <tr key={rec._id} className="hover:bg-[var(--color-paper-dim)]/50 transition-colors">
                      <td className="p-3.5 pl-6 font-display font-bold text-[var(--color-ink)]">{rec.teamId?.name ?? 'Team'}</td>
                      <td className="p-3.5 text-[var(--color-ink-faint)] font-data">
                        {rec.reviewDate ? new Date(rec.reviewDate).toLocaleDateString() : 'N/A'} {rec.reviewTime ? `@ ${rec.reviewTime}` : ''}
                      </td>
                      <td className="p-3.5 uppercase text-[10px] font-bold tracking-wider text-[var(--color-seal)]">{rec.kind}</td>
                      <td className="p-3.5 font-bold font-data text-[var(--color-ink)]">{presentCount} / {totalCount}</td>
                      <td className="p-3.5 pr-6 text-right">
                        <div className="flex flex-wrap gap-1 justify-end">
                          {rec.perStudent?.map((s: any, idx: number) => (
                            <span key={idx} className={`px-2 py-0.5 rounded text-[10px] font-semibold ${s.present ? 'bg-[var(--color-verdant-soft)] text-[var(--color-verdant)]' : 'bg-[var(--color-flag-soft)] text-[var(--color-flag)]'}`}>
                              {s.studentId?.name ?? 'Student'}
                            </span>
                          ))}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* TAB 9: STUDENT ATTENDANCE                                                  */
/* -------------------------------------------------------------------------- */
function StudentAttendanceTab({ programId, programName }: { programId: string; programName: string }) {
  const { data: studentsData } = useStudentList(programId);
  const { data: attendanceData } = useProgramAttendance(programName);

  const [searchTerm, setSearchTerm] = useState('');

  const students = studentsData?.items ?? [];

  // Build per-student aggregate attendance map
  const studentStats = students.map((st) => {
    let presentSessions = 0;
    let totalSessions = 0;

    attendanceData?.forEach((rec) => {
      const entry = rec.perStudent?.find((ps: any) => ps.studentId?._id === st._id || ps.studentId === st._id);
      if (entry) {
        totalSessions++;
        if (entry.present) presentSessions++;
      }
    });

    const ratePct = totalSessions > 0 ? Math.round((presentSessions / totalSessions) * 100) : 100;
    return {
      ...st,
      presentSessions,
      totalSessions,
      ratePct,
    };
  });

  const filteredStudents = studentStats.filter(
    (st) =>
      st.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      st.regNo.toLowerCase().includes(searchTerm.toLowerCase())
  );

  async function handleExport() {
    try {
      const res = await downloadAttendance({ program: programName });
      triggerDownload(res.data, `student-attendance-${programName.toLowerCase()}.xlsx`);
      toast.success('Downloaded Student Attendance Excel sheet');
    } catch (e) {
      toast.error(apiErrorMessage(e));
    }
  }

  const avgAttendance = studentStats.length > 0 ? Math.round(studentStats.reduce((s, x) => s + x.ratePct, 0) / studentStats.length) : 100;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-[var(--color-ink)]">Student Attendance — {programName}</h1>
          <p className="text-xs text-[var(--color-ink-faint)] mt-1">Individual student review attendance records and eligibility metrics.</p>
        </div>

        <button onClick={handleExport} className="px-4 py-2 rounded-xl text-xs font-semibold bg-[var(--color-verdant)] text-white hover:bg-[var(--color-verdant)]/90 transition-colors flex items-center gap-2 shadow-xs">
          <Download size={14} /> Export Excel
        </button>
      </div>

      {/* Visual Analytics Graph Bar */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-xl border border-[var(--color-ink)]/10 shadow-[var(--shadow-card)] space-y-2">
          <span className="text-[11px] font-bold text-[var(--color-ink-faint)] uppercase tracking-wider">Total Students</span>
          <p className="text-2xl font-display font-bold text-[var(--color-ink)]">{students.length}</p>
        </div>
        <div className="bg-white p-5 rounded-xl border border-[var(--color-ink)]/10 shadow-[var(--shadow-card)] space-y-2">
          <span className="text-[11px] font-bold text-[var(--color-verdant)] uppercase tracking-wider">Eligible (&gt;=75%)</span>
          <p className="text-2xl font-display font-bold text-[var(--color-verdant)]">{studentStats.filter((s) => s.ratePct >= 75).length}</p>
        </div>
        <div className="bg-white p-5 rounded-xl border border-[var(--color-ink)]/10 shadow-[var(--shadow-card)] space-y-2">
          <span className="text-[11px] font-bold text-[var(--color-seal)] uppercase tracking-wider">Average Attendance Rate</span>
          <div className="flex items-center gap-3">
            <span className="text-2xl font-display font-bold text-[var(--color-seal)] font-data">{avgAttendance}%</span>
            <div className="flex-1 h-2 bg-[var(--color-paper-dim)] rounded-full overflow-hidden">
              <div className="h-full bg-[var(--color-seal)] transition-all duration-500" style={{ width: `${avgAttendance}%` }} />
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-[var(--color-ink)]/10 shadow-[var(--shadow-card)] overflow-hidden">
        <div className="p-4 border-b border-[var(--color-ink)]/10 bg-[var(--color-paper)]/50 flex items-center justify-between gap-4">
          <span className="text-xs font-bold text-[var(--color-ink-soft)] uppercase tracking-wider shrink-0">Student Attendance List ({filteredStudents.length})</span>
          <input
            type="text"
            placeholder="Search student by name or register number..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="px-3 py-1.5 rounded-lg border border-[var(--color-ink)]/15 text-xs max-w-xs w-full"
          />
        </div>

        {filteredStudents.length === 0 ? (
          <div className="p-12 text-center text-xs text-[var(--color-ink-faint)] font-medium">No student attendance data found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-[var(--color-ink)]/10 bg-[var(--color-paper)]/30 font-semibold text-[var(--color-ink-soft)]">
                  <th className="p-3.5 pl-6">Register No</th>
                  <th className="p-3.5">Name</th>
                  <th className="p-3.5">Email</th>
                  <th className="p-3.5">Present / Total Sessions</th>
                  <th className="p-3.5 pr-6 text-right">Attendance Rate</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-ink)]/5">
                {filteredStudents.map((st) => (
                  <tr key={st._id} className="hover:bg-[var(--color-paper-dim)]/50 transition-colors">
                    <td className="p-3.5 pl-6 font-data font-medium text-[var(--color-ink)]">{st.regNo}</td>
                    <td className="p-3.5 font-semibold text-[var(--color-ink)]">{st.name}</td>
                    <td className="p-3.5 text-[var(--color-ink-faint)]">{st.email}</td>
                    <td className="p-3.5 font-data font-bold text-[var(--color-ink)]">{st.presentSessions} / {st.totalSessions}</td>
                    <td className="p-3.5 pr-6 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <span className={`font-data font-bold ${st.ratePct >= 75 ? 'text-[var(--color-verdant)]' : 'text-[var(--color-flag)]'}`}>{st.ratePct}%</span>
                        <div className="w-16 h-2 bg-[var(--color-paper-dim)] rounded-full overflow-hidden">
                          <div className={`h-full ${st.ratePct >= 75 ? 'bg-[var(--color-verdant)]' : 'bg-[var(--color-flag)]'}`} style={{ width: `${st.ratePct}%` }} />
                        </div>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* TAB 10: SCHEDULES                                                          */
/* -------------------------------------------------------------------------- */
function SchedulesTab({ programName }: { programName: string }) {
  const { data: slots, refetch } = useScheduledSlots(programName);
  const generateMutation = useGenerateSchedules();
  const clearMutation = useClearSchedules();
  const deleteMutation = useDeleteScheduledSlot();

  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [reviewType, setReviewType] = useState('review1');
  const [periodLabel, setPeriodLabel] = useState('Odd Semester 2026');
  const [durationMinutes, setDurationMinutes] = useState(30);

  async function handleAutoGenerate() {
    try {
      const res = await generateMutation.mutateAsync({ reviewType, periodLabel, durationMinutes });
      toast.success(`Generated review schedules for ${res.results?.length ?? 0} teams`);
      setShowGenerateModal(false);
      refetch();
    } catch (e) {
      toast.error(apiErrorMessage(e));
    }
  }

  async function handleClearAll() {
    if (!confirm(`Are you sure you want to clear ALL scheduled slots for ${programName}?`)) return;
    try {
      await clearMutation.mutateAsync();
      toast.success('Cleared all scheduled slots');
      refetch();
    } catch (e) {
      toast.error(apiErrorMessage(e));
    }
  }

  async function handleDeleteSlot(id: string) {
    try {
      await deleteMutation.mutateAsync(id);
      toast.success('Deleted scheduled slot');
      refetch();
    } catch (e) {
      toast.error(apiErrorMessage(e));
    }
  }

  const review1Count = slots?.filter((s) => s.reviewType === 'review1').length ?? 0;
  const review2Count = slots?.filter((s) => s.reviewType === 'review2').length ?? 0;
  const vivaCount = slots?.filter((s) => s.reviewType === 'viva').length ?? 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-[var(--color-ink)]">Review Scheduling — {programName}</h1>
          <p className="text-xs text-[var(--color-ink-faint)] mt-1">Programme-wise schedule generation across multiple review rounds & viva sessions.</p>
        </div>

        <div className="flex items-center gap-2">
          <button onClick={() => setShowGenerateModal(true)} className="px-4 py-2 rounded-xl text-xs font-semibold bg-[var(--color-seal)] text-[var(--color-paper)] hover:bg-[var(--color-seal)]/90 transition-colors flex items-center gap-2 shadow-sm">
            <Play size={14} /> Auto-Generate Schedule
          </button>
          <button onClick={handleClearAll} className="px-3 py-2 rounded-xl text-xs font-semibold bg-[var(--color-flag-soft)] text-[var(--color-flag)] hover:bg-[var(--color-flag)] hover:text-white transition-colors flex items-center gap-1">
            <Trash2 size={14} /> Clear Schedules
          </button>
        </div>
      </div>

      {/* Visual Slot Distribution Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-[var(--color-ink)]/10 shadow-[var(--shadow-card)] space-y-2">
          <span className="text-[11px] font-bold text-[var(--color-ink-faint)] uppercase tracking-wider">Total Scheduled Slots</span>
          <p className="text-2xl font-display font-bold text-[var(--color-ink)]">{slots?.length ?? 0}</p>
        </div>
        <div className="bg-white p-5 rounded-xl border border-[var(--color-ink)]/10 shadow-[var(--shadow-card)] space-y-2">
          <span className="text-[11px] font-bold text-[var(--color-seal)] uppercase tracking-wider">Review 1 Slots</span>
          <p className="text-2xl font-display font-bold text-[var(--color-seal)]">{review1Count}</p>
        </div>
        <div className="bg-white p-5 rounded-xl border border-[var(--color-ink)]/10 shadow-[var(--shadow-card)] space-y-2">
          <span className="text-[11px] font-bold text-[var(--color-verdant)] uppercase tracking-wider">Review 2 Slots</span>
          <p className="text-2xl font-display font-bold text-[var(--color-verdant)]">{review2Count}</p>
        </div>
        <div className="bg-white p-5 rounded-xl border border-[var(--color-ink)]/10 shadow-[var(--shadow-card)] space-y-2">
          <span className="text-[11px] font-bold text-[var(--color-flag)] uppercase tracking-wider">Viva Slots</span>
          <p className="text-2xl font-display font-bold text-[var(--color-flag)]">{vivaCount}</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-[var(--color-ink)]/10 shadow-[var(--shadow-card)] overflow-hidden">
        <div className="p-4 border-b border-[var(--color-ink)]/10 bg-[var(--color-paper)]/50 flex items-center justify-between">
          <span className="text-xs font-bold text-[var(--color-ink-soft)] uppercase tracking-wider">Scheduled Review Slots ({slots?.length ?? 0})</span>
        </div>

        {slots?.length === 0 ? (
          <div className="p-12 text-center text-xs text-[var(--color-ink-faint)] font-medium">No review slots scheduled yet for {programName}. Click "Auto-Generate Schedule" above.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-[var(--color-ink)]/10 bg-[var(--color-paper)]/30 font-semibold text-[var(--color-ink-soft)]">
                  <th className="p-3.5 pl-6">Slot Time</th>
                  <th className="p-3.5">Review Type</th>
                  <th className="p-3.5">Team Name</th>
                  <th className="p-3.5">Assigned Panel / Faculty</th>
                  <th className="p-3.5 pr-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-ink)]/5">
                {slots?.map((s) => (
                  <tr key={s._id} className="hover:bg-[var(--color-paper-dim)]/50 transition-colors">
                    <td className="p-3.5 pl-6 font-data text-[var(--color-ink)]">
                      <div className="font-bold">{new Date(s.startTime).toLocaleDateString()}</div>
                      <div className="text-[11px] text-[var(--color-ink-faint)]">
                        {new Date(s.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {new Date(s.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </td>
                    <td className="p-3.5 uppercase font-bold text-[10px] text-[var(--color-seal)] tracking-wider">{s.reviewType}</td>
                    <td className="p-3.5 font-display font-bold text-[var(--color-ink)]">{s.teamId?.name ?? 'Team'}</td>
                    <td className="p-3.5 font-medium text-[var(--color-ink-soft)]">
                      {s.facultyIds?.map((f) => f.name).join(', ') || 'Assigned Panel'}
                    </td>
                    <td className="p-3.5 pr-6 text-right">
                      <button onClick={() => handleDeleteSlot(s._id)} className="p-1.5 text-[var(--color-flag)] hover:bg-[var(--color-flag-soft)] rounded transition-colors">
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showGenerateModal && (
        <div className="fixed inset-0 bg-[var(--color-ink)]/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-md w-full p-6 space-y-4 shadow-[var(--shadow-raised)] border border-[var(--color-ink)]/10">
            <h3 className="font-display text-lg font-bold text-[var(--color-ink)]">Auto-Generate Review Schedule</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-[var(--color-ink-soft)] mb-1">Review Type</label>
                <select value={reviewType} onChange={(e) => setReviewType(e.target.value)} className="w-full px-3 py-2 border border-[var(--color-ink)]/15 rounded-lg text-xs">
                  <option value="review1">Review 1</option>
                  <option value="review2">Review 2</option>
                  <option value="review3">Review 3</option>
                  <option value="viva">Viva Session</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-[var(--color-ink-soft)] mb-1">Period Label</label>
                <input type="text" value={periodLabel} onChange={(e) => setPeriodLabel(e.target.value)} className="w-full px-3 py-2 border border-[var(--color-ink)]/15 rounded-lg text-xs" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[var(--color-ink-soft)] mb-1">Duration per Team (Minutes)</label>
                <input type="number" min={10} max={120} value={durationMinutes} onChange={(e) => setDurationMinutes(Number(e.target.value))} className="w-full px-3 py-2 border border-[var(--color-ink)]/15 rounded-lg text-xs" />
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button onClick={() => setShowGenerateModal(false)} className="px-4 py-2 rounded-lg text-xs font-semibold bg-[var(--color-paper-dim)] text-[var(--color-ink)]">Cancel</button>
              <button onClick={handleAutoGenerate} className="px-4 py-2 rounded-lg text-xs font-semibold bg-[var(--color-seal)] text-[var(--color-paper)] flex items-center gap-1.5">
                <Play size={13} /> Generate
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
