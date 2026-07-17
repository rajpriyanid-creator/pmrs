import { useState } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Field, Input } from '@/components/ui/Form';
import { Table, THead, TH, TR, TD, EmptyState, TableSkeleton } from '@/components/ui/Table';
import { Badge } from '@/components/ui/Card';
import { toast } from '@/components/ui/Toast';
import { apiErrorMessage, api } from '@/api/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Trash2, Calendar, Clock, RefreshCw } from 'lucide-react';
import { useTeamList } from '@/api/teams';
import { REVIEW_LABELS, ReviewType } from '@/types';

function useScheduledSlots(params: Record<string, string> = {}) {
  return useQuery({
    queryKey: ['scheduled-slots', params],
    queryFn: async () => {
      const q = new URLSearchParams(params).toString();
      const res = await api.get(`/scheduling/slots${q ? `?${q}` : ''}`);
      return res.data.slots as any[];
    },
  });
}

function useAvailabilitySlots() {
  return useQuery({
    queryKey: ['availability-slots'],
    queryFn: async () => {
      const res = await api.get('/scheduling/availability');
      return res.data.slots as any[];
    },
  });
}

export function CoordinatorSchedulingPage() {
  const qc = useQueryClient();
  const { data: slotData, isLoading } = useScheduledSlots();
  const { data: availData } = useAvailabilitySlots();
  const { data: teams } = useTeamList();

  const [genForm, setGenForm] = useState({
    reviewType: 'review1',
    periodLabel: '',
    durationMinutes: 30,
  });
  const [manualForm, setManualForm] = useState({
    teamId: '',
    reviewType: 'review1',
    startTime: '',
    endTime: '',
    periodLabel: '',
  });
  const [generating, setGenerating] = useState(false);
  const [manualLoading, setManualLoading] = useState(false);

  async function handleAutoGenerate(e: React.FormEvent) {
    e.preventDefault();
    setGenerating(true);
    try {
      const res = await api.post('/scheduling/generate/coordinator', genForm);
      const r = res.data.results as any[];
      const scheduled = r.filter((x) => x.status === 'scheduled').length;
      const skipped = r.filter((x) => x.status !== 'scheduled').length;
      toast.success(`${scheduled} slot(s) scheduled. ${skipped} skipped or unscheduled.`);
      qc.invalidateQueries({ queryKey: ['scheduled-slots'] });
    } catch (err) {
      toast.error(apiErrorMessage(err));
    } finally {
      setGenerating(false);
    }
  }

  async function handleManualSlot(e: React.FormEvent) {
    e.preventDefault();
    setManualLoading(true);
    try {
      await api.post('/scheduling/generate/team', manualForm);
      toast.success('Slot created successfully.');
      qc.invalidateQueries({ queryKey: ['scheduled-slots'] });
      setManualForm({ teamId: '', reviewType: 'review1', startTime: '', endTime: '', periodLabel: '' });
    } catch (err) {
      toast.error(apiErrorMessage(err));
    } finally {
      setManualLoading(false);
    }
  }

  async function handleDeleteSlot(id: string) {
    if (!confirm('Delete this scheduled slot?')) return;
    try {
      await api.delete(`/scheduling/slots/${id}`);
      qc.invalidateQueries({ queryKey: ['scheduled-slots'] });
      toast.success('Slot deleted.');
    } catch (err) {
      toast.error(apiErrorMessage(err));
    }
  }

  async function handleClearAll() {
    if (!confirm('Clear ALL scheduled slots? This cannot be undone.')) return;
    try {
      await api.delete('/scheduling/slots');
      qc.invalidateQueries({ queryKey: ['scheduled-slots'] });
      toast.success('All slots cleared.');
    } catch (err) {
      toast.error(apiErrorMessage(err));
    }
  }

  const reviewTypes = ['review0', 'review1', 'review2', 'review3', 'viva'] as ReviewType[];

  return (
    <AppShell title="Scheduling">
      <PageHeader
        title="Review Scheduling"
        description="Generate review slots automatically from submitted availability, or create them manually per team."
        action={
          <Button variant="danger" size="sm" onClick={handleClearAll}>
            Clear All Slots
          </Button>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Auto-generate */}
        <Card>
          <div className="p-5 border-b border-[var(--color-ink)]/8">
            <h3 className="font-semibold text-[var(--color-ink)] flex items-center gap-2">
              <RefreshCw size={15} className="text-[var(--color-seal)]" /> Auto-Generate Schedules
            </h3>
            <p className="text-xs text-[var(--color-ink-faint)] mt-0.5">
              Uses submitted availability to assign clash-free slots. Prerequisite gating enforced.
            </p>
          </div>
          <form onSubmit={handleAutoGenerate} className="p-5 space-y-4">
            <Field label="Review type" required>
              <select
                className="w-full rounded-lg border border-[var(--color-ink)]/15 px-3 py-2 text-sm bg-white"
                value={genForm.reviewType}
                onChange={(e) => setGenForm({ ...genForm, reviewType: e.target.value })}
              >
                {reviewTypes.map((t) => (
                  <option key={t} value={t}>{REVIEW_LABELS[t]}</option>
                ))}
              </select>
            </Field>
            <Field label="Period label" required hint="e.g. 'Review 1 Window — Jan 2025'">
              <Input required value={genForm.periodLabel} onChange={(e) => setGenForm({ ...genForm, periodLabel: e.target.value })} />
            </Field>
            <Field label="Slot duration (minutes)">
              <Input type="number" min={10} max={120} value={genForm.durationMinutes} onChange={(e) => setGenForm({ ...genForm, durationMinutes: Number(e.target.value) })} />
            </Field>
            <Button type="submit" loading={generating} className="w-full">
              <RefreshCw size={15} /> Auto-Generate
            </Button>
          </form>
        </Card>

        {/* Manual per-team slot */}
        <Card>
          <div className="p-5 border-b border-[var(--color-ink)]/8">
            <h3 className="font-semibold text-[var(--color-ink)] flex items-center gap-2">
              <Plus size={15} className="text-[var(--color-seal)]" /> Manual Slot (Per Team)
            </h3>
            <p className="text-xs text-[var(--color-ink-faint)] mt-0.5">
              Override: create a specific slot for a team. Clash detection still applies.
            </p>
          </div>
          <form onSubmit={handleManualSlot} className="p-5 space-y-4">
            <Field label="Team" required>
              <select
                className="w-full rounded-lg border border-[var(--color-ink)]/15 px-3 py-2 text-sm bg-white"
                value={manualForm.teamId}
                onChange={(e) => setManualForm({ ...manualForm, teamId: e.target.value })}
                required
              >
                <option value="">Select team…</option>
                {teams?.items.map((t) => <option key={t._id} value={t._id}>{t.name}</option>)}
              </select>
            </Field>
            <Field label="Review type" required>
              <select
                className="w-full rounded-lg border border-[var(--color-ink)]/15 px-3 py-2 text-sm bg-white"
                value={manualForm.reviewType}
                onChange={(e) => setManualForm({ ...manualForm, reviewType: e.target.value })}
              >
                {reviewTypes.map((t) => (
                  <option key={t} value={t}>{REVIEW_LABELS[t]}</option>
                ))}
              </select>
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Start" required>
                <Input type="datetime-local" required value={manualForm.startTime} onChange={(e) => setManualForm({ ...manualForm, startTime: e.target.value })} />
              </Field>
              <Field label="End" required>
                <Input type="datetime-local" required value={manualForm.endTime} onChange={(e) => setManualForm({ ...manualForm, endTime: e.target.value })} />
              </Field>
            </div>
            <Field label="Period label" required>
              <Input required value={manualForm.periodLabel} onChange={(e) => setManualForm({ ...manualForm, periodLabel: e.target.value })} />
            </Field>
            <Button type="submit" loading={manualLoading} variant="secondary" className="w-full">
              <Plus size={15} /> Create Slot
            </Button>
          </form>
        </Card>
      </div>

      {/* Availability submissions summary */}
      {availData && availData.length > 0 && (
        <Card className="mb-6">
          <div className="p-4 border-b border-[var(--color-ink)]/8">
            <h3 className="font-semibold text-[var(--color-ink)] text-sm">Submitted Availability ({availData.length} slots)</h3>
          </div>
          <Table>
            <THead>
              <tr>
                <TH>Faculty</TH>
                <TH>Role</TH>
                <TH>Period</TH>
                <TH>Start</TH>
                <TH>End</TH>
              </tr>
            </THead>
            <tbody>
              {availData.slice(0, 10).map((s) => (
                <TR key={s._id}>
                  <TD>{s.facultyId?.name ?? '—'}</TD>
                  <TD><Badge tone="seal">{s.role}</Badge></TD>
                  <TD className="text-xs text-[var(--color-ink-faint)]">{s.periodLabel}</TD>
                  <TD className="font-data text-xs">{new Date(s.startTime).toLocaleString()}</TD>
                  <TD className="font-data text-xs">{new Date(s.endTime).toLocaleString()}</TD>
                </TR>
              ))}
            </tbody>
          </Table>
          {availData.length > 10 && (
            <p className="px-5 py-3 text-xs text-[var(--color-ink-faint)]">… and {availData.length - 10} more</p>
          )}
        </Card>
      )}

      {/* Scheduled slots */}
      <Card>
        <div className="p-4 border-b border-[var(--color-ink)]/8">
          <h3 className="font-semibold text-[var(--color-ink)] text-sm flex items-center gap-2">
            <Calendar size={15} className="text-[var(--color-seal)]" /> Scheduled Slots
          </h3>
        </div>
        {isLoading ? (
          <TableSkeleton />
        ) : !slotData || slotData.length === 0 ? (
          <EmptyState title="No slots scheduled yet" description="Run auto-generate or create manual slots above." />
        ) : (
          <Table>
            <THead>
              <tr>
                <TH>Team</TH>
                <TH>Review</TH>
                <TH>Start</TH>
                <TH>End</TH>
                <TH>Faculty</TH>
                <TH></TH>
              </tr>
            </THead>
            <tbody>
              {slotData.map((s) => (
                <TR key={s._id}>
                  <TD className="font-medium">{s.teamId?.name ?? '—'}</TD>
                  <TD><Badge tone="verdant">{REVIEW_LABELS[s.reviewType as ReviewType] ?? s.reviewType}</Badge></TD>
                  <TD className="font-data text-xs">{new Date(s.startTime).toLocaleString()}</TD>
                  <TD className="font-data text-xs">{new Date(s.endTime).toLocaleString()}</TD>
                  <TD className="text-xs text-[var(--color-ink-faint)]">
                    {(s.facultyIds ?? []).map((f: any) => f.name ?? f).join(', ')}
                  </TD>
                  <TD>
                    <button
                      onClick={() => handleDeleteSlot(s._id)}
                      className="p-1.5 rounded-lg text-[var(--color-ink-faint)] hover:text-[var(--color-flag)] hover:bg-[var(--color-flag)]/5 transition-colors"
                    >
                      <Trash2 size={14} />
                    </button>
                  </TD>
                </TR>
              ))}
            </tbody>
          </Table>
        )}
      </Card>
    </AppShell>
  );
}
