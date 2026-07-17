import { useEffect, useState } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Field, Input, Select } from '@/components/ui/Form';
import { EmptyState } from '@/components/ui/Table';
import { Badge } from '@/components/ui/Card';
import { Save, CheckCircle2 } from 'lucide-react';
import { useTeamList } from '@/api/teams';
import { useTeamReviews } from '@/api/reviews';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiErrorMessage, api } from '@/api/client';
import { REVIEW_LABELS, ReviewType } from '@/types';
import { toast } from '@/components/ui/Toast';
import { useAuthStore } from '@/store/authStore';

const CRITERIA_LABELS = [
  'Criterion 1 — Problem Understanding',
  'Criterion 2 — Solution Design',
  'Criterion 3 — Implementation',
  'Criterion 4 — Presentation',
];

interface RubricRow {
  studentId: string;
  studentName: string;
  rollNo: string;
  mark1: number;
  mark2: number;
  mark3: number;
  mark4: number;
}

function useTeamStudents(teamId: string) {
  return useQuery({
    enabled: !!teamId,
    queryKey: ['team-students', teamId],
    queryFn: async () => {
      const res = await api.get(`/teams/${teamId}`);
      return (res.data.team?.students ?? []) as any[];
    },
  });
}

function useMarksForReview(teamId: string, reviewId: string) {
  return useQuery({
    enabled: !!teamId && !!reviewId,
    queryKey: ['marks', teamId, reviewId],
    queryFn: async () => {
      const res = await api.get(`/marks?teamId=${teamId}&reviewId=${reviewId}`);
      return res.data.entries as any[];
    },
  });
}

export function MarksEntryPage({ title }: { title: string }) {
  const qc = useQueryClient();
  const { data: teamsData } = useTeamList();
  const [teamId, setTeamId] = useState('');
  const [reviewId, setReviewId] = useState('');
  const [rows, setRows] = useState<RubricRow[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const { data: reviews } = useTeamReviews(teamId);
  const scoreable = reviews?.filter((r) => r.hasMarks) ?? [];
  const { data: students } = useTeamStudents(teamId);
  const { data: entries } = useMarksForReview(teamId, reviewId);
  const profile = useAuthStore((s) => s.profile);

  // Build rubric rows from students, pre-populated with my existing entries
  useEffect(() => {
    if (!students) return;
    const newRows: RubricRow[] = students.map((s: any) => {
      const existing = entries?.find((e: any) => {
        const sid = typeof e.studentId === 'object' ? e.studentId._id : e.studentId;
        const eid = typeof e.enteredBy === 'object' ? e.enteredBy._id : e.enteredBy;
        return sid === (s._id ?? s) && eid === profile?.userId;
      });
      return {
        studentId: s._id ?? s,
        studentName: s.name ?? 'Student',
        rollNo: s.rollNo ?? '',
        mark1: existing?.mark1 ?? 0,
        mark2: existing?.mark2 ?? 0,
        mark3: existing?.mark3 ?? 0,
        mark4: existing?.mark4 ?? 0,
      };
    });
    setRows(newRows);
  }, [students, entries, profile?.userId]);

  function updateMark(idx: number, field: 'mark1' | 'mark2' | 'mark3' | 'mark4', value: string) {
    const n = Math.min(10, Math.max(0, Number(value) || 0));
    setRows((prev) => prev.map((r, i) => (i === idx ? { ...r, [field]: n } : r)));
  }

  async function handleSubmit(confirm: boolean) {
    if (!teamId || !reviewId || rows.length === 0) return;
    setSubmitting(true);
    try {
      await api.post('/marks/bulk', {
        teamId,
        reviewId,
        studentMarks: rows.map((r) => ({
          studentId: r.studentId,
          mark1: r.mark1,
          mark2: r.mark2,
          mark3: r.mark3,
          mark4: r.mark4,
        })),
        confirm,
      });
      toast.success(confirm ? 'Marks confirmed and published.' : 'Draft saved.');
      qc.invalidateQueries({ queryKey: ['marks', teamId, reviewId] });
    } catch (err) {
      toast.error(apiErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  const allConfirmed = Boolean(entries?.length) && entries?.every((e: any) => {
    const eid = typeof e.enteredBy === 'object' ? e.enteredBy._id : e.enteredBy;
    return eid !== profile?.userId || e.confirmed;
  });

  return (
    <AppShell title={title}>
      <PageHeader
        title="Marks Entry"
        description="Enter rubric marks per student (each criterion 0–10; total 40 → percentage). Save a draft any time; confirming publishes to the team."
      />

      <div className="space-y-5">
        <Card className="max-w-lg">
          <div className="p-5 space-y-4">
            <Field label="Team">
              <Select
                value={teamId}
                onChange={(e) => {
                  setTeamId(e.target.value);
                  setReviewId('');
                  setRows([]);
                }}
              >
                <option value="">Select team…</option>
                {teamsData?.items.map((t) => (
                  <option key={t._id} value={t._id}>{t.name}</option>
                ))}
              </Select>
            </Field>

            <Field label="Review Stage">
              <Select
                value={reviewId}
                onChange={(e) => setReviewId(e.target.value)}
                disabled={!teamId}
              >
                <option value="">Select stage…</option>
                {scoreable.map((r) => (
                  <option key={r._id} value={r._id}>
                    {REVIEW_LABELS[r.type as ReviewType]} {r.closed ? '(closed)' : ''}
                  </option>
                ))}
              </Select>
            </Field>
          </div>
        </Card>

        {teamId && reviewId && rows.length === 0 && (
          <EmptyState title="No students in this team" />
        )}

        {teamId && reviewId && rows.length > 0 && (
          <>
            <Card>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-[var(--color-ink)]/8">
                      <th className="px-4 py-3 text-left font-semibold text-[var(--color-ink)] text-xs">Student</th>
                      {CRITERIA_LABELS.map((label, i) => (
                        <th key={i} className="px-3 py-3 text-center font-semibold text-[var(--color-ink)] text-xs min-w-[90px]">
                          <span className="block">{`C${i + 1}`}</span>
                          <span className="block text-[10px] text-[var(--color-ink-faint)] font-normal">/10</span>
                        </th>
                      ))}
                      <th className="px-4 py-3 text-center font-semibold text-[var(--color-ink)] text-xs">Total</th>
                      <th className="px-4 py-3 text-center font-semibold text-[var(--color-ink)] text-xs">%</th>
                    </tr>
                    <tr className="border-b border-[var(--color-ink)]/4">
                      <td />
                      {CRITERIA_LABELS.map((label, i) => (
                        <td key={i} className="px-3 py-1.5 text-center">
                          <span className="text-[10px] text-[var(--color-ink-faint)] leading-tight block">{label.split('—')[1]?.trim()}</span>
                        </td>
                      ))}
                      <td /><td />
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((row, idx) => {
                      const total = row.mark1 + row.mark2 + row.mark3 + row.mark4;
                      const pct = Math.round((total / 40) * 10000) / 100;
                      const existingEntry = entries?.find((e: any) => {
                        const sid = typeof e.studentId === 'object' ? e.studentId._id : e.studentId;
                        const eid = typeof e.enteredBy === 'object' ? e.enteredBy._id : e.enteredBy;
                        return sid === row.studentId && eid === profile?.userId;
                      });
                      return (
                        <tr key={row.studentId} className="border-b border-[var(--color-ink)]/5 hover:bg-[var(--color-ink)]/2">
                          <td className="px-4 py-3">
                            <p className="font-medium text-[var(--color-ink)]">{row.studentName}</p>
                            <p className="text-xs font-data text-[var(--color-ink-faint)]">{row.rollNo}</p>
                            {existingEntry?.confirmed && (
                              <Badge tone="verdant" className="mt-1">Published</Badge>
                            )}
                          </td>
                          {(['mark1', 'mark2', 'mark3', 'mark4'] as const).map((mk) => (
                            <td key={mk} className="px-3 py-3">
                              <input
                                type="number"
                                min={0}
                                max={10}
                                step={0.5}
                                value={row[mk]}
                                onChange={(e) => updateMark(idx, mk, e.target.value)}
                                className="w-16 text-center rounded-lg border border-[var(--color-ink)]/15 px-2 py-1.5
                                           text-sm font-data bg-white focus:outline-none focus:border-[var(--color-seal)]
                                           focus:ring-1 focus:ring-[var(--color-seal)]/20"
                              />
                            </td>
                          ))}
                          <td className="px-4 py-3 text-center font-data font-semibold text-[var(--color-ink)]">
                            {total}<span className="text-xs text-[var(--color-ink-faint)] font-normal">/40</span>
                          </td>
                          <td className="px-4 py-3 text-center font-data font-semibold">
                            <span className={`${pct >= 60 ? 'text-[var(--color-verdant)]' : pct >= 40 ? 'text-[var(--color-seal)]' : 'text-[var(--color-flag)]'}`}>
                              {pct}%
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </Card>

            {/* Summary row */}
            <Card className="max-w-xs">
              <div className="p-4">
                <p className="text-xs text-[var(--color-ink-faint)] mb-1">Team Average</p>
                <p className="text-2xl font-data font-bold text-[var(--color-ink)]">
                  {rows.length > 0
                    ? `${Math.round(
                        (rows.reduce((sum, r) => sum + r.mark1 + r.mark2 + r.mark3 + r.mark4, 0) /
                          (rows.length * 40)) *
                          10000
                      ) / 100}%`
                    : '—'}
                </p>
              </div>
            </Card>

            <div className="flex gap-2">
              <Button
                variant="secondary"
                onClick={() => handleSubmit(false)}
                loading={submitting}
              >
                <Save size={15} /> Save Draft
              </Button>
              <Button
                variant="success"
                onClick={() => handleSubmit(true)}
                loading={submitting}
              >
                <CheckCircle2 size={15} /> Confirm & Publish
              </Button>
            </div>
          </>
        )}

        {!teamId && <EmptyState title="Select a team to begin" />}
      </div>
    </AppShell>
  );
}
