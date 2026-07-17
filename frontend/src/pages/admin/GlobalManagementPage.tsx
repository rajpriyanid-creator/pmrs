import React, { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, GraduationCap, UserCheck, Trash2, Download, Upload, Plus, Edit, RefreshCw, Eye, EyeOff } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import {
  useFacultyList,
  useCreateFaculty,
  useDeleteFaculty,
  useDeleteAllFaculty,
  useImportFaculty,
  downloadFacultyTemplate,
} from '@/api/faculty';
import {
  useDesignationLimits,
  useCreateDesignationLimit,
  useSaveBatchDesignationLimits,
  useDeleteDesignationLimit,
  useDeleteAllDesignationLimits,
  useImportDesignationLimits,
  downloadDesignationLimitsTemplate,
} from '@/api/designationLimits';
import {
  usePrograms,
  useCreateProgram,
  useUpdateProgram,
  useDeleteProgram,
  useImportPrograms,
  downloadProgramTemplate,
} from '@/api/programs';
import { triggerDownload } from '@/lib/download';
import { toast } from '@/components/ui/Toast';
import { apiErrorMessage } from '@/api/client';

export function GlobalManagementPage() {
  const [activeTab, setActiveTab] = useState<'faculty' | 'pg'>('faculty');
  const logout = useAuthStore((s) => s.logout);
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[var(--color-paper)] text-[var(--color-ink)]">
      {/* Dark Ink Header with Brass Logo Mark */}
      <header className="bg-[var(--color-ink)] text-[var(--color-paper)] shadow-[var(--shadow-ledger)]">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-7 w-7 rounded-lg bg-[var(--color-ink-soft)] flex items-center justify-center shrink-0 border border-[var(--color-seal)]">
              <div className="h-3 w-3 rounded-full border-[1.5px] border-[var(--color-seal)] bg-[var(--color-seal)]" />
            </div>
            <span className="bg-[var(--color-seal-dim)] text-[var(--color-seal)] text-xs font-data font-bold px-2.5 py-1 rounded border border-[var(--color-seal)]/30">
              Admin (Global)
            </span>
            <span className="font-display font-semibold tracking-tight text-base text-[var(--color-paper)]">Project Review</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate('/admin')}
              className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-[var(--color-seal)] hover:bg-[var(--color-seal)]/90 text-[var(--color-paper)] transition-colors"
            >
              Control Panel
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
      <main className="max-w-6xl mx-auto px-6 py-8 space-y-6">
        <div>
          <h1 className="font-display text-2xl font-bold text-[var(--color-ink)]">Global Management</h1>
          <p className="text-xs font-medium text-[var(--color-ink-faint)] mt-1">Manage shared resources across all programmes.</p>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-[var(--color-ink)]/10">
          <button
            onClick={() => setActiveTab('faculty')}
            className={`flex items-center gap-2 px-5 py-3 text-xs font-semibold transition-all border-b-2 ${
              activeTab === 'faculty'
                ? 'border-[var(--color-seal)] text-[var(--color-seal)] font-bold bg-[var(--color-seal-dim)]/40'
                : 'border-transparent text-[var(--color-ink-faint)] hover:text-[var(--color-ink)]'
            }`}
          >
            <Users size={16} /> Faculty & Designation Limits
          </button>
          <button
            onClick={() => setActiveTab('pg')}
            className={`flex items-center gap-2 px-5 py-3 text-xs font-semibold transition-all border-b-2 ${
              activeTab === 'pg'
                ? 'border-[var(--color-seal)] text-[var(--color-seal)] font-bold bg-[var(--color-seal-dim)]/40'
                : 'border-transparent text-[var(--color-ink-faint)] hover:text-[var(--color-ink)]'
            }`}
          >
            <GraduationCap size={16} /> PG Programmes
          </button>
        </div>

        {activeTab === 'faculty' && <FacultyAndLimitsTab />}
        {activeTab === 'pg' && <PGProgrammesTab />}
      </main>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* TAB 1: FACULTY & DESIGNATION LIMITS                                        */
/* -------------------------------------------------------------------------- */
function FacultyAndLimitsTab() {
  const { data: facultyData, refetch: refetchFaculty } = useFacultyList();
  const createFacultyMutation = useCreateFaculty();
  const deleteFacultyMutation = useDeleteFaculty();
  const deleteAllFacultyMutation = useDeleteAllFaculty();
  const importFacultyMutation = useImportFaculty();

  const { data: limitsData, refetch: refetchLimits } = useDesignationLimits();
  const createLimitMutation = useCreateDesignationLimit();
  const saveBatchLimitsMutation = useSaveBatchDesignationLimits();
  const deleteLimitMutation = useDeleteDesignationLimit();
  const deleteAllLimitsMutation = useDeleteAllDesignationLimits();
  const importLimitsMutation = useImportDesignationLimits();

  // Faculty state
  const [showFacultyList, setShowFacultyList] = useState(false);
  const [facultyFileName, setFacultyFileName] = useState('');
  const facultyFileRef = useRef<HTMLInputElement>(null);

  const [seniorityNo, setSeniorityNo] = useState<number>(1);
  const [facultyName, setFacultyName] = useState('');
  const [facultyEmail, setFacultyEmail] = useState('');
  const [facultyDesignation, setFacultyDesignation] = useState('Assistant Professor');
  const [memberType, setMemberType] = useState<'Internal' | 'External'>('Internal');

  // Designation Limits state
  const [showLimits, setShowLimits] = useState(true);
  const [limitsFileName, setLimitsFileName] = useState('');
  const limitsFileRef = useRef<HTMLInputElement>(null);

  const [newDesignation, setNewDesignation] = useState('');
  const [newUgLimit, setNewUgLimit] = useState(2);
  const [newPgLimit, setNewPgLimit] = useState(1);

  // Editable limits map
  const [editableLimits, setEditableLimits] = useState<Record<string, { ug: number; pg: number }>>({});

  React.useEffect(() => {
    if (limitsData?.items) {
      const map: Record<string, { ug: number; pg: number }> = {};
      limitsData.items.forEach((item) => {
        map[item.designation] = { ug: item.ugLimit, pg: item.pgLimit };
      });
      setEditableLimits(map);
    }
  }, [limitsData]);

  async function handleDownloadFacultyTemplate() {
    try {
      const res = await downloadFacultyTemplate();
      triggerDownload(res.data, 'faculty-template.csv');
    } catch (err) {
      toast.error(apiErrorMessage(err));
    }
  }

  async function handleUploadFaculty() {
    const file = facultyFileRef.current?.files?.[0];
    if (!file) return toast.error('Choose a CSV/Excel file first');
    try {
      const res = await importFacultyMutation.mutateAsync(file);
      toast.success(`Imported ${res.createdCount} faculty member(s)`);
      setFacultyFileName('');
      if (facultyFileRef.current) facultyFileRef.current.value = '';
    } catch (err) {
      toast.error(apiErrorMessage(err));
    }
  }

  async function handleCreateFaculty(e: React.FormEvent) {
    e.preventDefault();
    if (!facultyName || !facultyEmail) return toast.error('Name and Email required');
    try {
      const username = facultyEmail.split('@')[0].toLowerCase();
      await createFacultyMutation.mutateAsync({
        seniority: seniorityNo,
        name: facultyName,
        email: facultyEmail,
        username,
        designation: facultyDesignation,
        guideLimits: { ug: 0, pg: 0 },
      });
      toast.success('Faculty member added');
      setFacultyName('');
      setFacultyEmail('');
    } catch (err) {
      toast.error(apiErrorMessage(err));
    }
  }

  async function handleDeleteAllFaculty() {
    if (!window.confirm('Delete all non-admin faculty records?')) return;
    try {
      const res = await deleteAllFacultyMutation.mutateAsync();
      toast.success(`Deleted ${res.deletedCount} faculty record(s)`);
    } catch (err) {
      toast.error(apiErrorMessage(err));
    }
  }

  // Limits handlers
  async function handleDownloadLimitsTemplate() {
    try {
      const res = await downloadDesignationLimitsTemplate();
      triggerDownload(res.data, 'designation-limits-template.csv');
    } catch (err) {
      toast.error(apiErrorMessage(err));
    }
  }

  async function handleUploadLimits() {
    const file = limitsFileRef.current?.files?.[0];
    if (!file) return toast.error('Choose a CSV file first');
    try {
      const res = await importLimitsMutation.mutateAsync(file);
      toast.success(`Imported ${res.createdCount} designation limit(s)`);
      setLimitsFileName('');
      if (limitsFileRef.current) limitsFileRef.current.value = '';
    } catch (err) {
      toast.error(apiErrorMessage(err));
    }
  }

  async function handleCreateLimit(e: React.FormEvent) {
    e.preventDefault();
    if (!newDesignation) return toast.error('Designation required');
    try {
      await createLimitMutation.mutateAsync({
        designation: newDesignation,
        ugLimit: newUgLimit,
        pgLimit: newPgLimit,
      });
      toast.success('Designation limit added');
      setNewDesignation('');
    } catch (err) {
      toast.error(apiErrorMessage(err));
    }
  }

  async function handleSaveBatchLimits() {
    const arr = Object.entries(editableLimits).map(([desg, val]) => ({
      designation: desg,
      ugLimit: val.ug,
      pgLimit: val.pg,
    }));
    try {
      await saveBatchLimitsMutation.mutateAsync(arr);
      toast.success('Designation limits saved');
    } catch (err) {
      toast.error(apiErrorMessage(err));
    }
  }

  async function handleDeleteAllLimits() {
    if (!window.confirm('Delete all designation limits?')) return;
    try {
      const res = await deleteAllLimitsMutation.mutateAsync();
      toast.success(`Deleted ${res.deletedCount} designation limit(s)`);
    } catch (err) {
      toast.error(apiErrorMessage(err));
    }
  }

  return (
    <div className="space-y-8">
      {/* SECTION 1: FACULTY MANAGEMENT */}
      <div className="bg-white rounded-xl border border-[var(--color-ink)]/10 shadow-[var(--shadow-card)] p-6 space-y-6">
        <div>
          <h2 className="font-display text-xl font-bold text-[var(--color-ink)]">Faculty Management</h2>
          <p className="text-xs text-[var(--color-ink-faint)] mt-0.5">Centralized faculty directory & guide allocations.</p>
        </div>

        {/* Top actions: Template + Import */}
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={handleDownloadFacultyTemplate}
            className="px-4 py-2 rounded-lg text-xs font-semibold bg-[var(--color-seal)] hover:bg-[var(--color-seal)]/90 text-[var(--color-paper)] shadow-sm transition-colors flex items-center gap-1.5"
          >
            <Download size={14} /> Download Faculty CSV Template
          </button>

          <div className="flex items-center border border-[var(--color-ink)]/15 rounded-lg p-1 bg-[var(--color-paper)]">
            <label className="cursor-pointer bg-[var(--color-paper-dim)] px-3 py-1.5 rounded text-xs font-medium text-[var(--color-ink)] hover:bg-[var(--color-ink)]/6 transition-colors">
              Choose File
              <input
                ref={facultyFileRef}
                type="file"
                accept=".xlsx,.xls,.csv"
                className="hidden"
                onChange={(e) => setFacultyFileName(e.target.files?.[0]?.name || '')}
              />
            </label>
            <span className="text-xs font-data text-[var(--color-ink-faint)] px-3 max-w-[180px] truncate">
              {facultyFileName || 'No file chosen'}
            </span>
          </div>

          <button
            onClick={handleUploadFaculty}
            disabled={importFacultyMutation.isPending}
            className="px-4 py-2 rounded-lg text-xs font-semibold bg-[var(--color-ink)] hover:bg-[var(--color-ink-soft)] text-[var(--color-paper)] shadow-sm transition-colors flex items-center gap-1.5 disabled:opacity-50"
          >
            <Upload size={14} /> Bulk Faculty Upload
          </button>
        </div>

        {/* Manual Creation Form */}
        <form onSubmit={handleCreateFaculty} className="bg-[var(--color-paper)] rounded-xl p-4 border border-[var(--color-ink)]/10 space-y-4">
          <h3 className="text-xs font-bold text-[var(--color-ink)] uppercase tracking-wide">Manual Faculty Creation</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-[var(--color-ink-soft)] mb-1">Seniority No.</label>
              <input
                type="number"
                min={1}
                value={seniorityNo}
                onChange={(e) => setSeniorityNo(Number(e.target.value))}
                className="w-full text-xs font-data px-3 py-2 rounded-lg border border-[var(--color-ink)]/15 bg-white focus:outline-none focus:border-[var(--color-seal)]"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-[var(--color-ink-soft)] mb-1">Name</label>
              <input
                type="text"
                placeholder="Dr. Jane Doe"
                value={facultyName}
                onChange={(e) => setFacultyName(e.target.value)}
                className="w-full text-xs px-3 py-2 rounded-lg border border-[var(--color-ink)]/15 bg-white focus:outline-none focus:border-[var(--color-seal)]"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-[var(--color-ink-soft)] mb-1">Email ID</label>
              <input
                type="email"
                placeholder="jane@institution.edu"
                value={facultyEmail}
                onChange={(e) => setFacultyEmail(e.target.value)}
                className="w-full text-xs font-data px-3 py-2 rounded-lg border border-[var(--color-ink)]/15 bg-white focus:outline-none focus:border-[var(--color-seal)]"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-[var(--color-ink-soft)] mb-1">Designation</label>
              <input
                type="text"
                value={facultyDesignation}
                onChange={(e) => setFacultyDesignation(e.target.value)}
                className="w-full text-xs px-3 py-2 rounded-lg border border-[var(--color-ink)]/15 bg-white focus:outline-none focus:border-[var(--color-seal)]"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-[var(--color-ink-soft)] mb-1">Member Type</label>
              <select
                value={memberType}
                onChange={(e) => setMemberType(e.target.value as 'Internal' | 'External')}
                className="w-full text-xs px-3 py-2 rounded-lg border border-[var(--color-ink)]/15 bg-white focus:outline-none focus:border-[var(--color-seal)]"
              >
                <option value="Internal">Internal</option>
                <option value="External">External</option>
              </select>
            </div>
          </div>
          <button
            type="submit"
            disabled={createFacultyMutation.isPending}
            className="px-4 py-2 rounded-lg text-xs font-semibold bg-[var(--color-seal)] hover:bg-[var(--color-seal)]/90 text-[var(--color-paper)] shadow-sm transition-colors flex items-center gap-1.5 disabled:opacity-50"
          >
            <Plus size={14} /> Add Faculty Member
          </button>
        </form>

        {/* View & Delete All Buttons */}
        <div className="flex items-center gap-3 pt-2">
          <button
            onClick={() => {
              setShowFacultyList(!showFacultyList);
              refetchFaculty();
            }}
            className="px-4 py-2 rounded-lg text-xs font-semibold bg-[var(--color-verdant)] hover:bg-[var(--color-verdant)]/90 text-[var(--color-paper)] shadow-sm transition-colors flex items-center gap-1.5"
          >
            <UserCheck size={14} /> {showFacultyList ? 'Hide Faculty List' : 'View Faculty List'}
          </button>
          <button
            onClick={handleDeleteAllFaculty}
            disabled={deleteAllFacultyMutation.isPending}
            className="px-4 py-2 rounded-lg text-xs font-semibold bg-[var(--color-flag)] hover:bg-[var(--color-flag)]/90 text-[var(--color-paper)] shadow-sm transition-colors flex items-center gap-1.5 disabled:opacity-50"
          >
            <Trash2 size={14} /> Delete All Non-Admin Faculty Records
          </button>
        </div>

        {/* Faculty List Table */}
        {showFacultyList && (
          <div className="mt-4 border border-[var(--color-ink)]/10 rounded-xl overflow-hidden shadow-sm">
            <table className="w-full text-left text-xs">
              <thead className="bg-[var(--color-paper-dim)] text-[var(--color-ink)] font-semibold border-b border-[var(--color-ink)]/10">
                <tr>
                  <th className="p-3">Seniority</th>
                  <th className="p-3">Name</th>
                  <th className="p-3">Email ID</th>
                  <th className="p-3">Designation</th>
                  <th className="p-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-ink)]/8">
                {facultyData?.items?.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-6 text-center text-[var(--color-ink-faint)]">
                      No faculty records registered yet.
                    </td>
                  </tr>
                ) : (
                  facultyData?.items?.map((f) => (
                    <tr key={f._id} className="hover:bg-[var(--color-paper-dim)]/50">
                      <td className="p-3 font-data font-semibold text-[var(--color-ink)]">{f.seniority}</td>
                      <td className="p-3 font-medium">{f.name}</td>
                      <td className="p-3 font-data text-[var(--color-ink-faint)]">{f.email}</td>
                      <td className="p-3">{f.designation}</td>
                      <td className="p-3 text-right">
                        {!f.isAdmin && (
                          <button
                            onClick={async () => {
                              if (window.confirm(`Delete ${f.name}?`)) {
                                await deleteFacultyMutation.mutateAsync(f._id);
                              }
                            }}
                            className="text-[var(--color-flag)] hover:underline font-semibold"
                          >
                            Delete
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* SECTION 2: DESIGNATION TEAM LIMITS */}
      <div className="bg-white rounded-xl border border-[var(--color-ink)]/10 shadow-[var(--shadow-card)] p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-display text-xl font-bold text-[var(--color-ink)]">Designation Team Allocation Limits</h2>
            <p className="text-xs text-[var(--color-ink-faint)] mt-0.5">Configure guide allocation capacity per designation for UG and PG teams.</p>
          </div>
          <button
            onClick={() => setShowLimits(!showLimits)}
            className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-[var(--color-paper-dim)] hover:bg-[var(--color-ink)]/10 text-[var(--color-ink)] transition-colors flex items-center gap-1.5"
          >
            {showLimits ? <EyeOff size={14} /> : <Eye size={14} />} {showLimits ? 'Hide Limits' : 'Show Limits'}
          </button>
        </div>

        {showLimits && (
          <div className="space-y-6">
            {/* Download CSV Template + Upload */}
            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={handleDownloadLimitsTemplate}
                className="px-4 py-2 rounded-lg text-xs font-semibold bg-[var(--color-seal)] hover:bg-[var(--color-seal)]/90 text-[var(--color-paper)] shadow-sm transition-colors flex items-center gap-1.5"
              >
                <Download size={14} /> Download Designation CSV Template
              </button>

              <div className="flex items-center border border-[var(--color-ink)]/15 rounded-lg p-1 bg-[var(--color-paper)]">
                <label className="cursor-pointer bg-[var(--color-paper-dim)] px-3 py-1.5 rounded text-xs font-medium text-[var(--color-ink)] hover:bg-[var(--color-ink)]/6 transition-colors">
                  Choose File
                  <input
                    ref={limitsFileRef}
                    type="file"
                    accept=".csv"
                    className="hidden"
                    onChange={(e) => setLimitsFileName(e.target.files?.[0]?.name || '')}
                  />
                </label>
                <span className="text-xs font-data text-[var(--color-ink-faint)] px-3 max-w-[180px] truncate">
                  {limitsFileName || 'No file chosen'}
                </span>
              </div>

              <button
                onClick={handleUploadLimits}
                disabled={importLimitsMutation.isPending}
                className="px-4 py-2 rounded-lg text-xs font-semibold bg-[var(--color-ink)] hover:bg-[var(--color-ink-soft)] text-[var(--color-paper)] shadow-sm transition-colors flex items-center gap-1.5 disabled:opacity-50"
              >
                <Upload size={14} /> Upload Designation Limits CSV
              </button>
            </div>

            {/* Manual Designation Limit Creation */}
            <form onSubmit={handleCreateLimit} className="bg-[var(--color-paper)] rounded-xl p-4 border border-[var(--color-ink)]/10 space-y-4">
              <h3 className="text-xs font-bold text-[var(--color-ink)] uppercase tracking-wide">Manual Designation Limit Entry</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-[var(--color-ink-soft)] mb-1">Designation Title</label>
                  <input
                    type="text"
                    placeholder="Associate Professor"
                    value={newDesignation}
                    onChange={(e) => setNewDesignation(e.target.value)}
                    className="w-full text-xs px-3 py-2 rounded-lg border border-[var(--color-ink)]/15 bg-white focus:outline-none focus:border-[var(--color-seal)]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-[var(--color-ink-soft)] mb-1">UG Team Limit</label>
                  <input
                    type="number"
                    min={0}
                    value={newUgLimit}
                    onChange={(e) => setNewUgLimit(Number(e.target.value))}
                    className="w-full text-xs font-data px-3 py-2 rounded-lg border border-[var(--color-ink)]/15 bg-white focus:outline-none focus:border-[var(--color-seal)]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-[var(--color-ink-soft)] mb-1">PG Team Limit</label>
                  <input
                    type="number"
                    min={0}
                    value={newPgLimit}
                    onChange={(e) => setNewPgLimit(Number(e.target.value))}
                    className="w-full text-xs font-data px-3 py-2 rounded-lg border border-[var(--color-ink)]/15 bg-white focus:outline-none focus:border-[var(--color-seal)]"
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={createLimitMutation.isPending}
                className="px-4 py-2 rounded-lg text-xs font-semibold bg-[var(--color-seal)] hover:bg-[var(--color-seal)]/90 text-[var(--color-paper)] shadow-sm transition-colors flex items-center gap-1.5 disabled:opacity-50"
              >
                <Plus size={14} /> Add Designation Limit
              </button>
            </form>

            {/* Editable Limits Table */}
            <div className="border border-[var(--color-ink)]/10 rounded-xl overflow-hidden shadow-sm">
              <table className="w-full text-left text-xs">
                <thead className="bg-[var(--color-paper-dim)] text-[var(--color-ink)] font-semibold border-b border-[var(--color-ink)]/10">
                  <tr>
                    <th className="p-3">Designation</th>
                    <th className="p-3">UG Teams Limit</th>
                    <th className="p-3">PG Teams Limit</th>
                    <th className="p-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--color-ink)]/8">
                  {limitsData?.items?.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="p-6 text-center text-[var(--color-ink-faint)]">
                        No designation limits defined yet.
                      </td>
                    </tr>
                  ) : (
                    limitsData?.items?.map((item) => (
                      <tr key={item._id} className="hover:bg-[var(--color-paper-dim)]/50">
                        <td className="p-3 font-semibold text-[var(--color-ink)]">{item.designation}</td>
                        <td className="p-3">
                          <input
                            type="number"
                            min={0}
                            value={editableLimits[item.designation]?.ug ?? item.ugLimit}
                            onChange={(e) =>
                              setEditableLimits({
                                ...editableLimits,
                                [item.designation]: {
                                  ug: Number(e.target.value),
                                  pg: editableLimits[item.designation]?.pg ?? item.pgLimit,
                                },
                              })
                            }
                            className="w-20 text-xs font-data px-2.5 py-1 rounded border border-[var(--color-ink)]/15 bg-white"
                          />
                        </td>
                        <td className="p-3">
                          <input
                            type="number"
                            min={0}
                            value={editableLimits[item.designation]?.pg ?? item.pgLimit}
                            onChange={(e) =>
                              setEditableLimits({
                                ...editableLimits,
                                [item.designation]: {
                                  ug: editableLimits[item.designation]?.ug ?? item.ugLimit,
                                  pg: Number(e.target.value),
                                },
                              })
                            }
                            className="w-20 text-xs font-data px-2.5 py-1 rounded border border-[var(--color-ink)]/15 bg-white"
                          />
                        </td>
                        <td className="p-3 text-right">
                          <button
                            onClick={async () => {
                              if (window.confirm(`Delete limit for ${item.designation}?`)) {
                                await deleteLimitMutation.mutateAsync(item._id);
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

            <div className="flex items-center gap-3">
              <button
                onClick={handleSaveBatchLimits}
                disabled={saveBatchLimitsMutation.isPending}
                className="px-5 py-2.5 rounded-lg text-xs font-semibold bg-[var(--color-verdant)] hover:bg-[var(--color-verdant)]/90 text-[var(--color-paper)] shadow-sm transition-colors disabled:opacity-50"
              >
                Save Designation Limits
              </button>
              <button
                onClick={handleDeleteAllLimits}
                disabled={deleteAllLimitsMutation.isPending}
                className="px-5 py-2.5 rounded-lg text-xs font-semibold bg-[var(--color-flag)] hover:bg-[var(--color-flag)]/90 text-[var(--color-paper)] shadow-sm transition-colors disabled:opacity-50 flex items-center gap-1.5"
              >
                <Trash2 size={14} /> Delete All Designation Limits
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* TAB 2: PG PROGRAMMES MANAGEMENT                                            */
/* -------------------------------------------------------------------------- */
function PGProgrammesTab() {
  const { data: programs, refetch } = usePrograms();
  const createProgramMutation = useCreateProgram();
  const updateProgramMutation = useUpdateProgram();
  const deleteProgramMutation = useDeleteProgram();
  const importProgramsMutation = useImportPrograms();

  const [pgFileName, setPgFileName] = useState('');
  const pgFileRef = useRef<HTMLInputElement>(null);

  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);

  const pgList = programs?.filter((p) => p.type === 'PG') ?? [];

  async function handleDownloadPgTemplate() {
    try {
      const res = await downloadProgramTemplate();
      triggerDownload(res.data, 'programme-template.csv');
    } catch (err) {
      toast.error(apiErrorMessage(err));
    }
  }

  async function handleUploadPgPrograms() {
    const file = pgFileRef.current?.files?.[0];
    if (!file) return toast.error('Choose a CSV file first');
    try {
      const res = await importProgramsMutation.mutateAsync(file);
      toast.success(`Imported ${res.createdCount} PG programme(s)`);
      setPgFileName('');
      if (pgFileRef.current) pgFileRef.current.value = '';
    } catch (err) {
      toast.error(apiErrorMessage(err));
    }
  }

  async function handleSaveProgram(e: React.FormEvent) {
    e.preventDefault();
    if (!name || !code) return toast.error('Programme Name and Code required');
    try {
      if (editingId) {
        await updateProgramMutation.mutateAsync({
          id: editingId,
          data: { name, code, type: 'PG' },
        });
        toast.success('PG Programme updated');
        setEditingId(null);
      } else {
        await createProgramMutation.mutateAsync({
          name,
          code,
          type: 'PG',
          maxTeamSize: 4,
        });
        toast.success('PG Programme added — Card created on Control Panel');
      }
      setName('');
      setCode('');
    } catch (err) {
      toast.error(apiErrorMessage(err));
    }
  }

  return (
    <div className="bg-white rounded-xl border border-[var(--color-ink)]/10 shadow-[var(--shadow-card)] p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-xl font-bold text-[var(--color-ink)]">Postgraduate (PG) Programme Management</h2>
          <p className="text-xs text-[var(--color-ink-faint)] mt-0.5">
            Add or edit PG programmes. Cards for each PG programme are automatically generated on the Control Panel.
          </p>
        </div>
        <button
          onClick={() => refetch()}
          className="p-2 rounded-lg text-xs font-semibold bg-[var(--color-paper-dim)] hover:bg-[var(--color-ink)]/10 text-[var(--color-ink)] transition-colors flex items-center gap-1"
          title="Refresh Programme List"
        >
          <RefreshCw size={14} /> Refresh List
        </button>
      </div>

      {/* Top actions */}
      <div className="flex flex-wrap items-center gap-3">
        <button
          onClick={handleDownloadPgTemplate}
          className="px-4 py-2 rounded-lg text-xs font-semibold bg-[var(--color-seal)] hover:bg-[var(--color-seal)]/90 text-[var(--color-paper)] shadow-sm transition-colors flex items-center gap-1.5"
        >
          <Download size={14} /> Download Programme CSV Template
        </button>

        <div className="flex items-center border border-[var(--color-ink)]/15 rounded-lg p-1 bg-[var(--color-paper)]">
          <label className="cursor-pointer bg-[var(--color-paper-dim)] px-3 py-1.5 rounded text-xs font-medium text-[var(--color-ink)] hover:bg-[var(--color-ink)]/6 transition-colors">
            Choose File
            <input
              ref={pgFileRef}
              type="file"
              accept=".csv"
              className="hidden"
              onChange={(e) => setPgFileName(e.target.files?.[0]?.name || '')}
            />
          </label>
          <span className="text-xs font-data text-[var(--color-ink-faint)] px-3 max-w-[180px] truncate">
            {pgFileName || 'No file chosen'}
          </span>
        </div>

        <button
          onClick={handleUploadPgPrograms}
          disabled={importProgramsMutation.isPending}
          className="px-4 py-2 rounded-lg text-xs font-semibold bg-[var(--color-ink)] hover:bg-[var(--color-ink-soft)] text-[var(--color-paper)] shadow-sm transition-colors flex items-center gap-1.5 disabled:opacity-50"
        >
          <Upload size={14} /> Bulk Upload PG Programmes
        </button>
      </div>

      {/* Manual Creation / Edit Form */}
      <form onSubmit={handleSaveProgram} className="bg-[var(--color-paper)] rounded-xl p-4 border border-[var(--color-ink)]/10 space-y-4">
        <h3 className="text-xs font-bold text-[var(--color-ink)] uppercase tracking-wide">
          {editingId ? 'Edit PG Programme' : 'Add PG Programme Manually'}
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-[11px] font-semibold text-[var(--color-ink-soft)] mb-1">Programme Name</label>
            <input
              type="text"
              placeholder="M.E. Artificial Intelligence"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full text-xs px-3 py-2 rounded-lg border border-[var(--color-ink)]/15 bg-white focus:outline-none focus:border-[var(--color-seal)]"
            />
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-[var(--color-ink-soft)] mb-1">Programme Code</label>
            <input
              type="text"
              placeholder="MEAI"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="w-full text-xs font-data uppercase px-3 py-2 rounded-lg border border-[var(--color-ink)]/15 bg-white focus:outline-none focus:border-[var(--color-seal)]"
            />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="submit"
            className="px-4 py-2 rounded-lg text-xs font-semibold bg-[var(--color-seal)] hover:bg-[var(--color-seal)]/90 text-[var(--color-paper)] shadow-sm transition-colors flex items-center gap-1.5"
          >
            <Plus size={14} /> {editingId ? 'Update Programme' : 'Add Programme'}
          </button>
          {editingId && (
            <button
              type="button"
              onClick={() => {
                setEditingId(null);
                setName('');
                setCode('');
              }}
              className="px-4 py-2 rounded-lg text-xs font-semibold bg-[var(--color-paper-dim)] text-[var(--color-ink)]"
            >
              Cancel
            </button>
          )}
        </div>
      </form>

      {/* PG Programme Table */}
      <div className="border border-[var(--color-ink)]/10 rounded-xl overflow-hidden shadow-sm">
        <table className="w-full text-left text-xs">
          <thead className="bg-[var(--color-paper-dim)] text-[var(--color-ink)] font-semibold border-b border-[var(--color-ink)]/10">
            <tr>
              <th className="p-3">Programme Code</th>
              <th className="p-3">Programme Name</th>
              <th className="p-3">Type</th>
              <th className="p-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--color-ink)]/8">
            {pgList.length === 0 ? (
              <tr>
                <td colSpan={4} className="p-6 text-center text-[var(--color-ink-faint)]">
                  No PG programmes registered yet.
                </td>
              </tr>
            ) : (
              pgList.map((prog) => (
                <tr key={prog._id} className="hover:bg-[var(--color-paper-dim)]/50">
                  <td className="p-3 font-data font-bold text-[var(--color-seal)]">{prog.code}</td>
                  <td className="p-3 font-medium">{prog.name}</td>
                  <td className="p-3 font-data">{prog.type}</td>
                  <td className="p-3 text-right space-x-3">
                    <button
                      onClick={() => {
                        setEditingId(prog._id);
                        setName(prog.name);
                        setCode(prog.code);
                      }}
                      className="text-[var(--color-ink)] hover:underline font-semibold flex-inline items-center gap-1"
                    >
                      <Edit size={12} className="inline mr-1" /> Edit
                    </button>
                    <button
                      onClick={async () => {
                        if (window.confirm(`Delete ${prog.name}?`)) {
                          await deleteProgramMutation.mutateAsync(prog._id);
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
    </div>
  );
}
