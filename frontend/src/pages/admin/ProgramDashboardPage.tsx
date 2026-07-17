import React, { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
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
import { triggerDownload } from '@/lib/download';
import { toast } from '@/components/ui/Toast';
import { apiErrorMessage, api } from '@/api/client';
import { useQuery, useQueryClient } from '@tanstack/react-query';

export function ProgramDashboardPage() {
  const { programId } = useParams<{ programId: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'student-registration';

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
  }

  return (
    <div className="min-h-screen bg-[var(--color-paper)] text-[var(--color-ink)]">
      {/* Dark Ink Header with Brass Logo Mark */}
      <header className="bg-[var(--color-ink)] text-[var(--color-paper)] shadow-[var(--shadow-ledger)]">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between gap-4 overflow-x-auto">
          {/* Left Identity */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="h-7 w-7 rounded-lg bg-[var(--color-ink-soft)] flex items-center justify-center shrink-0 border border-[var(--color-seal)]">
              <div className="h-3 w-3 rounded-full border-[1.5px] border-[var(--color-seal)] bg-[var(--color-seal)]" />
            </div>
            <span className="bg-[var(--color-seal-dim)] text-[var(--color-seal)] text-xs font-data font-bold px-2.5 py-1 rounded border border-[var(--color-seal)]/30">
              Admin ({program.name})
            </span>
            <span className="font-display font-semibold tracking-tight text-base text-[var(--color-paper)]">Project Review</span>
          </div>

          {/* Navigation Tabs */}
          <nav className="flex items-center gap-1 overflow-x-auto text-xs font-medium py-1">
            {[
              { id: 'student-registration', label: 'Student Registration' },
              { id: 'settings', label: 'Settings' },
              { id: 'review-panels', label: 'Review Panels' },
              { id: 'team-panel-allocations', label: 'Team Panel Allocations' },
              { id: 'review-attendance', label: 'Review Attendance' },
              { id: 'student-attendance', label: 'Student Attendance' },
              { id: 'schedules', label: 'Schedules' },
            ].map((t) => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`px-3 py-1.5 rounded-md transition-colors whitespace-nowrap ${
                  activeTab === t.id
                    ? 'bg-[var(--color-seal)] text-[var(--color-paper)] font-semibold shadow-sm'
                    : 'text-[var(--color-paper)]/80 hover:bg-white/10'
                }`}
              >
                {t.label}
              </button>
            ))}
          </nav>

          {/* Right Action buttons */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => navigate('/admin')}
              className="px-3 py-1.5 rounded-md text-xs font-semibold bg-[var(--color-seal)] hover:bg-[var(--color-seal)]/90 text-[var(--color-paper)] transition-colors"
            >
              Control Panel
            </button>
            <button
              onClick={() => {
                logout();
                navigate('/login', { replace: true });
              }}
              className="px-3 py-1.5 rounded-md text-xs font-semibold bg-white/10 hover:bg-white/20 text-[var(--color-paper)] transition-colors"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-6xl mx-auto px-6 py-8">
        {activeTab === 'student-registration' && <StudentRegistrationTab programName={program.name} />}
        {activeTab === 'settings' && <AdminSettingsTab programName={program.name} />}
        {activeTab === 'review-panels' && <ReviewPanelsTab programName={program.name} />}
        {activeTab === 'team-panel-allocations' && <TeamPanelAllocationsTab programName={program.name} />}
        {activeTab === 'review-attendance' && <ReviewAttendanceTab programName={program.name} />}
        {activeTab === 'student-attendance' && <StudentAttendanceTab programName={program.name} />}
        {activeTab === 'schedules' && <SchedulesTab programName={program.name} />}
      </main>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* TAB 1: STUDENT REGISTRATION                                                */
/* -------------------------------------------------------------------------- */
function StudentRegistrationTab({ programName }: { programName: string }) {
  const { data: studentsData, refetch } = useStudentList(programName);
  const deleteStudentMutation = useDeleteStudent();
  const deleteAllStudentsMutation = useDeleteAllStudents();
  const importStudentsMutation = useImportStudents();

  const [fileName, setFileName] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);
  const [showStudents, setShowStudents] = useState(false);

  async function handleDownloadTemplate() {
    try {
      const res = await downloadStudentTemplate();
      triggerDownload(res.data, 'student-template.csv');
    } catch (err) {
      toast.error(apiErrorMessage(err));
    }
  }

  async function handleUploadStudents() {
    const file = fileRef.current?.files?.[0];
    if (!file) {
      toast.error('Please choose a file first');
      return;
    }
    try {
      const res = await importStudentsMutation.mutateAsync({ file, program: programName });
      toast.success(`Imported ${res.createdCount} student(s)`);
      setFileName('');
      if (fileRef.current) fileRef.current.value = '';
    } catch (err) {
      toast.error(apiErrorMessage(err));
    }
  }

  async function handleDeleteAll() {
    if (!window.confirm(`Delete all students registered under ${programName}?`)) return;
    try {
      const res = await deleteAllStudentsMutation.mutateAsync(programName);
      toast.success(`Deleted ${res.deletedCount} student(s)`);
    } catch (err) {
      toast.error(apiErrorMessage(err));
    }
  }

  return (
    <div className="bg-white rounded-xl border border-[var(--color-ink)]/10 shadow-[var(--shadow-card)] p-8 space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-[var(--color-ink)]">Student Management — {programName}</h1>
        <h2 className="text-xs font-semibold text-[var(--color-ink-faint)] mt-1">Programme-wise student database ({programName})</h2>
      </div>

      <div className="space-y-4">
        {/* Top actions */}
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={handleDownloadTemplate}
            className="px-4 py-2 rounded-lg text-xs font-semibold bg-[var(--color-seal)] hover:bg-[var(--color-seal)]/90 text-[var(--color-paper)] shadow-sm transition-colors"
          >
            Download Student CSV Template
          </button>

          <div className="flex items-center border border-[var(--color-ink)]/15 rounded-lg p-1 bg-[var(--color-paper)]">
            <label className="cursor-pointer bg-[var(--color-paper-dim)] px-3 py-1.5 rounded text-xs font-medium text-[var(--color-ink)] hover:bg-[var(--color-ink)]/6 transition-colors">
              Choose File
              <input
                ref={fileRef}
                type="file"
                accept=".xlsx,.xls,.csv"
                className="hidden"
                onChange={(e) => setFileName(e.target.files?.[0]?.name || '')}
              />
            </label>
            <span className="text-xs font-data text-[var(--color-ink-faint)] px-3 max-w-[180px] truncate">{fileName || 'No file chosen'}</span>
          </div>

          <button
            onClick={handleUploadStudents}
            disabled={importStudentsMutation.isPending}
            className="px-5 py-2 rounded-lg text-xs font-semibold bg-[var(--color-ink)] hover:bg-[var(--color-ink-soft)] text-[var(--color-paper)] shadow-sm transition-colors disabled:opacity-50"
          >
            Upload Students
          </button>
        </div>

        {/* View & Delete All Buttons */}
        <div className="flex items-center gap-3 pt-2">
          <button
            onClick={() => {
              setShowStudents(!showStudents);
              refetch();
            }}
            className="px-5 py-2 rounded-lg text-xs font-semibold bg-[var(--color-verdant)] hover:bg-[var(--color-verdant)]/90 text-[var(--color-paper)] shadow-sm transition-colors"
          >
            {showStudents ? 'Hide Students' : 'View Registered Students'}
          </button>
          <button
            onClick={handleDeleteAll}
            disabled={deleteAllStudentsMutation.isPending}
            className="px-5 py-2 rounded-lg text-xs font-semibold bg-[var(--color-flag)] hover:bg-[var(--color-flag)]/90 text-[var(--color-paper)] shadow-sm transition-colors disabled:opacity-50"
          >
            Delete All Students
          </button>
        </div>

        {/* Students Table */}
        {showStudents && (
          <div className="mt-4 border border-[var(--color-ink)]/10 rounded-xl overflow-hidden shadow-sm">
            <table className="w-full text-left text-xs">
              <thead className="bg-[var(--color-paper-dim)] text-[var(--color-ink)] font-semibold border-b border-[var(--color-ink)]/10">
                <tr>
                  <th className="p-3">Roll No</th>
                  <th className="p-3">Name</th>
                  <th className="p-3">Email</th>
                  <th className="p-3">Programme</th>
                  <th className="p-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-ink)]/8">
                {studentsData?.items?.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-6 text-center text-[var(--color-ink-faint)]">
                      No students registered yet for {programName}.
                    </td>
                  </tr>
                ) : (
                  studentsData?.items?.map((st) => (
                    <tr key={st._id} className="hover:bg-[var(--color-paper-dim)]/50">
                      <td className="p-3 font-data font-semibold text-[var(--color-ink)]">{st.rollNo}</td>
                      <td className="p-3 font-medium">{st.name}</td>
                      <td className="p-3 text-[var(--color-ink-faint)] font-data">{st.email}</td>
                      <td className="p-3">{st.program}</td>
                      <td className="p-3 text-right">
                        <button
                          onClick={async () => {
                            if (window.confirm(`Delete ${st.name}?`)) {
                              await deleteStudentMutation.mutateAsync(st._id);
                            }
                          }}
                          className="text-[var(--color-flag)] hover:underline font-semibold"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))
                )}
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
function AdminSettingsTab({ programName }: { programName: string }) {
  const [subTab, setSubTab] = useState<'guide' | 'teamsize' | 'review'>('guide');
  const qc = useQueryClient();

  const { data: config } = useQuery({
    queryKey: ['admin-config'],
    queryFn: async () => {
      const res = await api.get('/admin-config');
      return res.data.config || {};
    },
  });

  const [startDateTime, setStartDateTime] = useState('');
  const [endDateTime, setEndDateTime] = useState('');
  const [minTeamSize, setMinTeamSize] = useState(1);
  const [maxTeamSize, setMaxTeamSize] = useState(4);
  const [numReviews, setNumReviews] = useState(3);
  const [vivaRequired, setVivaRequired] = useState(true);

  useEffect(() => {
    if (config) {
      if (config.guideSelectionWindowStart) {
        setStartDateTime(new Date(config.guideSelectionWindowStart).toISOString().slice(0, 16));
      }
      if (config.guideSelectionWindowEnd) {
        setEndDateTime(new Date(config.guideSelectionWindowEnd).toISOString().slice(0, 16));
      }
    }
  }, [config]);

  async function handleSaveGuideSettings(e: React.FormEvent) {
    e.preventDefault();
    try {
      await api.patch('/admin-config', {
        guideSelectionOpen: true,
        guideSelectionWindowStart: startDateTime ? new Date(startDateTime).toISOString() : null,
        guideSelectionWindowEnd: endDateTime ? new Date(endDateTime).toISOString() : null,
      });
      toast.success('Guide Selection settings updated.');
      qc.invalidateQueries({ queryKey: ['admin-config'] });
    } catch (err) {
      toast.error(apiErrorMessage(err));
    }
  }

  async function handleSaveReviewSettings() {
    try {
      await api.patch('/admin-config', {
        numReviews,
        vivaRequired,
      });
      toast.success('Review settings saved.');
      qc.invalidateQueries({ queryKey: ['admin-config'] });
    } catch (err) {
      toast.error(apiErrorMessage(err));
    }
  }

  return (
    <div className="bg-white rounded-xl border border-[var(--color-ink)]/10 shadow-[var(--shadow-card)] overflow-hidden space-y-6">
      {/* Dark Ink Banner with Brass Accent */}
      <div className="bg-[var(--color-ink)] text-[var(--color-paper)] p-8 border-b-2 border-[var(--color-seal)]">
        <h1 className="font-display text-3xl font-bold tracking-tight">Admin Settings — {programName}</h1>
      </div>

      <div className="px-8 pb-8 space-y-6">
        {/* Sub-tabs header */}
        <div className="flex border-b border-[var(--color-ink)]/10">
          <button
            onClick={() => setSubTab('guide')}
            className={`px-5 py-3 text-xs font-semibold transition-all border-b-2 ${
              subTab === 'guide'
                ? 'border-[var(--color-seal)] text-[var(--color-seal)] font-bold'
                : 'border-transparent text-[var(--color-ink-faint)] hover:text-[var(--color-ink)]'
            }`}
          >
            Guide Selection Settings
          </button>
          <button
            onClick={() => setSubTab('teamsize')}
            className={`px-5 py-3 text-xs font-semibold transition-all border-b-2 ${
              subTab === 'teamsize'
                ? 'border-[var(--color-seal)] text-[var(--color-seal)] font-bold'
                : 'border-transparent text-[var(--color-ink-faint)] hover:text-[var(--color-ink)]'
            }`}
          >
            Team Size Configuration
          </button>
          <button
            onClick={() => setSubTab('review')}
            className={`px-5 py-3 text-xs font-semibold transition-all border-b-2 ${
              subTab === 'review'
                ? 'border-[var(--color-seal)] text-[var(--color-seal)] font-bold'
                : 'border-transparent text-[var(--color-ink-faint)] hover:text-[var(--color-ink)]'
            }`}
          >
            Review Configuration
          </button>
        </div>

        {/* Sub-tab 1: Guide Settings */}
        {subTab === 'guide' && (
          <div className="max-w-md bg-[var(--color-paper)] rounded-xl p-6 border border-[var(--color-ink)]/10 space-y-5">
            <h2 className="font-display text-base font-bold text-[var(--color-ink)]">Guide Selection Request Window</h2>

            <form onSubmit={handleSaveGuideSettings} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[var(--color-ink-soft)] mb-1">Start Date & Time</label>
                <input
                  type="datetime-local"
                  value={startDateTime}
                  onChange={(e) => setStartDateTime(e.target.value)}
                  className="w-full text-xs font-data px-3.5 py-2.5 rounded-lg border border-[var(--color-ink)]/15 focus:outline-none focus:border-[var(--color-seal)] bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[var(--color-ink-soft)] mb-1">End Date & Time</label>
                <input
                  type="datetime-local"
                  value={endDateTime}
                  onChange={(e) => setEndDateTime(e.target.value)}
                  className="w-full text-xs font-data px-3.5 py-2.5 rounded-lg border border-[var(--color-ink)]/15 focus:outline-none focus:border-[var(--color-seal)] bg-white"
                />
              </div>

              <button
                type="submit"
                className="px-5 py-2.5 rounded-lg text-xs font-semibold bg-[var(--color-seal)] hover:bg-[var(--color-seal)]/90 text-[var(--color-paper)] shadow-sm transition-colors"
              >
                Update Guide Settings
              </button>
            </form>
          </div>
        )}

        {/* Sub-tab 2: Team Size */}
        {subTab === 'teamsize' && (
          <div className="max-w-md bg-[var(--color-paper)] rounded-xl p-6 border border-[var(--color-ink)]/10 space-y-5">
            <h2 className="font-display text-base font-bold text-[var(--color-ink)]">Programme-wise Team Size Settings</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-[var(--color-ink-soft)] mb-1">Min Team Size</label>
                <input
                  type="number"
                  min={1}
                  value={minTeamSize}
                  onChange={(e) => setMinTeamSize(Number(e.target.value))}
                  className="w-full text-xs font-data px-3.5 py-2.5 rounded-lg border border-[var(--color-ink)]/15 bg-white"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[var(--color-ink-soft)] mb-1">Max Team Size</label>
                <input
                  type="number"
                  min={1}
                  value={maxTeamSize}
                  onChange={(e) => setMaxTeamSize(Number(e.target.value))}
                  className="w-full text-xs font-data px-3.5 py-2.5 rounded-lg border border-[var(--color-ink)]/15 bg-white"
                />
              </div>
            </div>
            <button
              onClick={() => toast.success('Team size settings saved.')}
              className="px-5 py-2.5 rounded-lg text-xs font-semibold bg-[var(--color-seal)] hover:bg-[var(--color-seal)]/90 text-[var(--color-paper)] shadow-sm transition-colors"
            >
              Save Team Size
            </button>
          </div>
        )}

        {/* Sub-tab 3: Review Settings */}
        {subTab === 'review' && (
          <div className="max-w-xl bg-[var(--color-paper)] rounded-xl p-6 border border-[var(--color-ink)]/10 space-y-6">
            <div>
              <h2 className="font-display text-base font-bold text-[var(--color-ink)]">Review Configuration & Viva Settings</h2>
              <p className="text-xs text-[var(--color-ink-faint)] mt-1 leading-relaxed">
                Configure review count limits and enable/disable Viva. All scheduling and marks entry automatically generate active review slots.
              </p>
            </div>

            {/* Number of Reviews Control */}
            <div className="space-y-3">
              <label className="block text-xs font-semibold text-[var(--color-ink-soft)]">Number of Reviews (Slider & Increments)</label>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setNumReviews(Math.max(1, numReviews - 1))}
                  className="h-8 w-8 rounded-full bg-[var(--color-paper-dim)] hover:bg-[var(--color-ink)]/10 text-[var(--color-ink)] flex items-center justify-center font-bold text-sm"
                >
                  -
                </button>
                <span className="text-2xl font-display font-bold text-[var(--color-seal)] w-6 text-center">{numReviews}</span>
                <button
                  type="button"
                  onClick={() => setNumReviews(Math.min(10, numReviews + 1))}
                  className="h-8 w-8 rounded-full bg-[var(--color-paper-dim)] hover:bg-[var(--color-ink)]/10 text-[var(--color-ink)] flex items-center justify-center font-bold text-sm"
                >
                  +
                </button>
                <span className="text-xs font-data text-[var(--color-ink-faint)] ml-2">(min 1, max 10)</span>
              </div>
              <input
                type="range"
                min={1}
                max={10}
                value={numReviews}
                onChange={(e) => setNumReviews(Number(e.target.value))}
                className="w-full accent-[var(--color-seal)]"
              />
            </div>

            {/* Viva Switch */}
            <div className="flex items-center justify-between p-4 bg-white rounded-xl border border-[var(--color-ink)]/10">
              <div>
                <p className="text-xs font-semibold text-[var(--color-ink)]">Enable / Disable Viva</p>
                <p className="text-[11px] text-[var(--color-ink-faint)] mt-0.5">When enabled, a Viva slot is appended after reviews.</p>
              </div>
              <button
                type="button"
                onClick={() => setVivaRequired(!vivaRequired)}
                className={`w-12 h-6 flex items-center rounded-full p-1 transition-colors ${
                  vivaRequired ? 'bg-[var(--color-seal)]' : 'bg-[var(--color-ink-faint)]/30'
                }`}
              >
                <div className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${vivaRequired ? 'translate-x-6' : 'translate-x-0'}`} />
              </button>
            </div>

            {/* Active Slot Types Preview */}
            <div className="space-y-2">
              <p className="text-xs font-semibold text-[var(--color-ink-soft)]">Preview Active Review Slots:</p>
              <div className="flex flex-wrap gap-2">
                {Array.from({ length: numReviews }).map((_, i) => (
                  <span key={i} className="px-3 py-1 rounded-full text-xs font-semibold bg-[var(--color-seal-dim)] text-[var(--color-seal)] border border-[var(--color-seal-soft)]">
                    Review {i + 1}
                  </span>
                ))}
                {vivaRequired && (
                  <span className="px-3 py-1 rounded-full text-xs font-semibold bg-[var(--color-verdant-soft)] text-[var(--color-verdant)] border border-[var(--color-verdant)]/20">
                    Viva Session
                  </span>
                )}
              </div>
            </div>

            <button
              onClick={handleSaveReviewSettings}
              className="w-full py-3 rounded-xl text-xs font-semibold bg-[var(--color-seal)] hover:bg-[var(--color-seal)]/90 text-[var(--color-paper)] shadow-sm transition-colors"
            >
              Save Review Configuration
            </button>
          </div>
        )}
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
    if (selectedFaculty.length === 0) {
      toast.error('Select at least one faculty member');
      return;
    }
    try {
      await upsertPanelMutation.mutateAsync({
        program: programName,
        memberIds: selectedFaculty,
      });
      toast.success('Review Panel created');
      setShowCreateModal(false);
      setSelectedFaculty([]);
      refetch();
    } catch (err) {
      toast.error(apiErrorMessage(err));
    }
  }

  return (
    <div className="bg-white rounded-xl border border-[var(--color-ink)]/10 shadow-[var(--shadow-card)] p-8 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-bold text-[var(--color-ink)]">Review Panel Management</h1>
        <button
          onClick={() => setShowCreateModal(true)}
          className="px-5 py-2.5 rounded-lg text-xs font-semibold bg-[var(--color-seal)] hover:bg-[var(--color-seal)]/90 text-[var(--color-paper)] shadow-sm transition-colors"
        >
          Create New Review Panel
        </button>
      </div>

      <div className="border border-[var(--color-ink)]/10 rounded-xl overflow-hidden">
        <div className="bg-[var(--color-paper-dim)] px-5 py-3 border-b border-[var(--color-ink)]/10">
          <h2 className="text-xs font-bold text-[var(--color-ink)] uppercase tracking-wide">Programme-wise Panels ({programName})</h2>
        </div>

        {panels?.length === 0 ? (
          <div className="p-12 text-center text-xs text-[var(--color-ink-faint)]">
            No review panels created yet for {programName}. Click "Create New Review Panel" to get started.
          </div>
        ) : (
          <div className="divide-y divide-[var(--color-ink)]/8">
            {panels?.map((panel, idx) => (
              <div key={panel._id} className="p-5 flex items-center justify-between hover:bg-[var(--color-paper-dim)]/50">
                <div>
                  <h3 className="font-display text-sm font-bold text-[var(--color-ink)]">Panel #{idx + 1}</h3>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {panel.memberIds.map((m) => (
                      <span key={m._id} className="px-2.5 py-1 rounded bg-[var(--color-paper-dim)] text-[var(--color-ink)] text-[11px] font-medium border border-[var(--color-ink)]/8">
                        {m.name}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showCreateModal && (
        <div className="fixed inset-0 bg-[var(--color-ink)]/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-md w-full p-6 space-y-4 shadow-[var(--shadow-raised)] border border-[var(--color-ink)]/10">
            <h3 className="font-display text-lg font-bold text-[var(--color-ink)]">Create New Review Panel</h3>
            <p className="text-xs text-[var(--color-ink-faint)]">Select faculty members to include in this review panel (max 4).</p>

            <div className="max-h-60 overflow-y-auto space-y-1.5 border border-[var(--color-ink)]/10 p-2 rounded-lg">
              {faculty?.items.map((f) => (
                <label key={f._id} className="flex items-center gap-2 p-2 hover:bg-[var(--color-paper-dim)] rounded text-xs cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedFaculty.includes(f._id)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        if (selectedFaculty.length >= 4) {
                          toast.error('Maximum 4 members allowed');
                          return;
                        }
                        setSelectedFaculty([...selectedFaculty, f._id]);
                      } else {
                        setSelectedFaculty(selectedFaculty.filter((id) => id !== f._id));
                      }
                    }}
                  />
                  <span className="font-medium text-[var(--color-ink)]">{f.name}</span>
                  <span className="text-[var(--color-ink-faint)] text-[10px]">({f.designation})</span>
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
/* TAB 4-7: SUB-PANEL MODULES                                                 */
/* -------------------------------------------------------------------------- */
function TeamPanelAllocationsTab({ programName }: { programName: string }) {
  return (
    <div className="bg-white rounded-xl border border-[var(--color-ink)]/10 shadow-[var(--shadow-card)] p-8 space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-[var(--color-ink)]">Team Panel Allocation — {programName}</h1>
        <p className="text-xs text-[var(--color-ink-faint)] mt-1">Programme-wise panel allocation to student teams.</p>
      </div>
      <div className="p-8 text-center text-xs text-[var(--color-ink-faint)] border border-dashed border-[var(--color-ink)]/20 rounded-xl">
        Select a review panel and manage panel assignments for student teams in {programName}.
      </div>
    </div>
  );
}

function ReviewAttendanceTab({ programName }: { programName: string }) {
  return (
    <div className="bg-white rounded-xl border border-[var(--color-ink)]/10 shadow-[var(--shadow-card)] p-8 space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-[var(--color-ink)]">Review Attendance — {programName}</h1>
        <p className="text-xs text-[var(--color-ink-faint)] mt-1">Faculty attendance tracking during project reviews.</p>
      </div>
      <div className="p-8 text-center text-xs text-[var(--color-ink-faint)] border border-dashed border-[var(--color-ink)]/20 rounded-xl">
        Faculty review attendance records for {programName}.
      </div>
    </div>
  );
}

function StudentAttendanceTab({ programName }: { programName: string }) {
  return (
    <div className="bg-white rounded-xl border border-[var(--color-ink)]/10 shadow-[var(--shadow-card)] p-8 space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-[var(--color-ink)]">Student Attendance — {programName}</h1>
        <p className="text-xs text-[var(--color-ink-faint)] mt-1">Student attendance history during project reviews.</p>
      </div>
      <div className="p-8 text-center text-xs text-[var(--color-ink-faint)] border border-dashed border-[var(--color-ink)]/20 rounded-xl">
        Student attendance records for {programName}.
      </div>
    </div>
  );
}

function SchedulesTab({ programName }: { programName: string }) {
  return (
    <div className="bg-white rounded-xl border border-[var(--color-ink)]/10 shadow-[var(--shadow-card)] p-8 space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-[var(--color-ink)]">Review Scheduling — {programName}</h1>
        <p className="text-xs text-[var(--color-ink-faint)] mt-1">Programme-wise schedule generation across multiple review rounds & viva sessions.</p>
      </div>
      <div className="p-8 text-center text-xs text-[var(--color-ink-faint)] border border-dashed border-[var(--color-ink)]/20 rounded-xl">
        Review schedules and slot generation for {programName}.
      </div>
    </div>
  );
}
