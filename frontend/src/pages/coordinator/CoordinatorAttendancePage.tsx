import { useState } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Field, Input, Select, Checkbox } from '@/components/ui/Form';
import { EmptyState } from '@/components/ui/Table';
import { useTeamList } from '@/api/teams';
import { useTeamReviews } from '@/api/reviews';
import { useSubmitAttendance } from '@/api/attendance';
import { REVIEW_LABELS, ReviewType, Student } from '@/types';
import { toast } from '@/components/ui/Toast';
import { apiErrorMessage } from '@/api/client';
import { ClipboardCheck } from 'lucide-react';

export function CoordinatorAttendancePage() {
  const { data: teamsData } = useTeamList();
  const [teamId, setTeamId] = useState('');
  const [kind, setKind] = useState<'review' | 'semester'>('review');
  const [reviewId, setReviewId] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [presentMap, setPresentMap] = useState<Record<string, boolean>>({});

  const team = teamsData?.items.find((t) => t._id === teamId);
  const { data: reviews } = useTeamReviews(teamId);
  const submitMutation = useSubmitAttendance();

  const students = (team?.students as Student[] | undefined) ?? [];

  async function handleSubmit() {
    if (!teamId) return;
    try {
      await submitMutation.mutateAsync({
        teamId,
        reviewId: kind === 'review' ? reviewId || null : null,
        kind,
        perStudent: students.map((s) => ({ studentId: s._id, present: presentMap[s._id] ?? true })),
        reviewDate: date ? new Date(date).toISOString() : undefined,
        reviewTime: time || undefined,
      });
      toast.success('Attendance recorded.');
    } catch (err) {
      toast.error(apiErrorMessage(err));
    }
  }

  return (
    <AppShell title="Attendance">
      <PageHeader title="Record Attendance" description="Coordinator-only. Date, time and presence are saved together." />

      <Card className="max-w-xl">
        <div className="p-6 space-y-5">
          <Field label="Team">
            <Select value={teamId} onChange={(e) => setTeamId(e.target.value)}>
              <option value="">Select team…</option>
              {teamsData?.items.map((t) => (
                <option key={t._id} value={t._id}>
                  {t.name}
                </option>
              ))}
            </Select>
          </Field>

          {teamId && (
            <>
              <Field label="Attendance type">
                <Select value={kind} onChange={(e) => setKind(e.target.value as 'review' | 'semester')}>
                  <option value="review">Review-linked</option>
                  <option value="semester">Semester (general)</option>
                </Select>
              </Field>

              {kind === 'review' && (
                <Field label="Review stage">
                  <Select value={reviewId} onChange={(e) => setReviewId(e.target.value)}>
                    <option value="">Select stage…</option>
                    {reviews?.map((r) => (
                      <option key={r._id} value={r._id}>
                        {REVIEW_LABELS[r.type as ReviewType]}
                      </option>
                    ))}
                  </Select>
                </Field>
              )}

              <div className="grid grid-cols-2 gap-4">
                <Field label="Date">
                  <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
                </Field>
                <Field label="Time">
                  <Input type="time" value={time} onChange={(e) => setTime(e.target.value)} />
                </Field>
              </div>

              {students.length === 0 ? (
                <EmptyState title="No students in this team" />
              ) : (
                <div className="space-y-2 border-t border-[var(--color-ink)]/8 pt-4">
                  {students.map((s) => (
                    <div key={s._id} className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-[var(--color-ink)]">{s.name}</p>
                        <p className="text-xs text-[var(--color-ink-faint)] font-data">{s.rollNo}</p>
                      </div>
                      <Checkbox
                        label="Present"
                        checked={presentMap[s._id] ?? true}
                        onChange={(e) => setPresentMap((prev) => ({ ...prev, [s._id]: e.target.checked }))}
                      />
                    </div>
                  ))}
                </div>
              )}

              <Button onClick={handleSubmit} loading={submitMutation.isPending} disabled={students.length === 0}>
                <ClipboardCheck size={15} /> Save Attendance
              </Button>
            </>
          )}
        </div>
      </Card>
    </AppShell>
  );
}
