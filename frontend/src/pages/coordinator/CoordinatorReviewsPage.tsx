import { useState } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Field, Input, Select } from '@/components/ui/Form';
import { EmptyState } from '@/components/ui/Table';
import { ReviewRail } from '@/components/reviewrail/ReviewRail';
import { useTeamList } from '@/api/teams';
import { useCreateOrUpdateReview, useTeamReviews } from '@/api/reviews';
import { REVIEW_LABELS, REVIEW_ORDER, ReviewType } from '@/types';
import { toast } from '@/components/ui/Toast';
import { apiErrorMessage } from '@/api/client';
import { CalendarPlus } from 'lucide-react';

export function CoordinatorReviewsPage() {
  const { data: teamsData } = useTeamList();
  const [teamId, setTeamId] = useState('');
  const { data: reviews } = useTeamReviews(teamId);
  const { create, update } = useCreateOrUpdateReview();

  const [selectedType, setSelectedType] = useState<ReviewType>('review1');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [duration, setDuration] = useState('20');

  const existing = reviews?.find((r) => r.type === selectedType);

  async function handleSchedule() {
    if (!teamId || !date) return;
    try {
      const payload = {
        scheduledDate: new Date(date).toISOString(),
        scheduledTime: time || undefined,
        durationMinutes: duration ? Number(duration) : undefined,
      };
      if (existing) {
        await update.mutateAsync({ id: existing._id, ...payload });
      } else {
        await create.mutateAsync({ teamId, type: selectedType, ...payload });
      }
      toast.success('Review scheduled — the team has been notified.');
    } catch (err) {
      toast.error(apiErrorMessage(err));
    }
  }

  return (
    <AppShell title="Review Scheduling">
      <PageHeader title="Review Scheduling" description="Set the date, time and duration for each review stage." />

      <Card className="mb-6">
        <div className="p-6 max-w-xs">
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
        </div>

        {teamId && reviews && (
          <div className="px-6 pb-6">
            <ReviewRail reviews={reviews} />
          </div>
        )}
      </Card>

      {!teamId ? (
        <EmptyState title="Select a team to schedule its reviews" />
      ) : (
        <Card className="max-w-xl">
          <div className="p-6 space-y-5">
            <Field label="Review Stage">
              <Select value={selectedType} onChange={(e) => setSelectedType(e.target.value as ReviewType)}>
                {REVIEW_ORDER.map((t) => (
                  <option key={t} value={t}>
                    {REVIEW_LABELS[t]}
                  </option>
                ))}
              </Select>
            </Field>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Date">
                <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
              </Field>
              <Field label="Time">
                <Input type="time" value={time} onChange={(e) => setTime(e.target.value)} />
              </Field>
            </div>
            <Field label="Duration (minutes)">
              <Input type="number" min={5} max={240} value={duration} onChange={(e) => setDuration(e.target.value)} />
            </Field>
            <Button onClick={handleSchedule} loading={create.isPending || update.isPending} disabled={!date}>
              <CalendarPlus size={15} /> {existing ? 'Update Schedule' : 'Schedule Review'}
            </Button>
          </div>
        </Card>
      )}
    </AppShell>
  );
}
