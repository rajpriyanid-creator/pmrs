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
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, Trash2, CalendarClock } from 'lucide-react';

function useMyAvailability() {
  return useQuery({
    queryKey: ['my-availability'],
    queryFn: async () => {
      // Get all and filter client-side (server would need current user filter for full impl)
      const res = await api.get('/scheduling/availability');
      return res.data.slots as any[];
    },
  });
}

export function GuideAvailabilityPage() {
  const qc = useQueryClient();
  const { data, isLoading } = useMyAvailability();
  const [form, setForm] = useState({ periodLabel: '', startTime: '', endTime: '' });
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.periodLabel || !form.startTime || !form.endTime) {
      toast.error('All fields are required');
      return;
    }
    if (new Date(form.endTime) <= new Date(form.startTime)) {
      toast.error('End time must be after start time');
      return;
    }
    setSubmitting(true);
    try {
      await api.post('/scheduling/availability', {
        periodLabel: form.periodLabel,
        startTime: form.startTime,
        endTime: form.endTime,
      });
      toast.success('Availability submitted.');
      qc.invalidateQueries({ queryKey: ['my-availability'] });
      setForm({ periodLabel: '', startTime: '', endTime: '' });
    } catch (err) {
      toast.error(apiErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id: string) {
    try {
      await api.delete(`/scheduling/availability/${id}`);
      qc.invalidateQueries({ queryKey: ['my-availability'] });
      toast.success('Availability slot removed.');
    } catch (err) {
      toast.error(apiErrorMessage(err));
    }
  }

  return (
    <AppShell title="My Availability">
      <PageHeader
        title="Submit Availability"
        description="Add the time windows when you are available for review sessions. The coordinator uses these to auto-generate clash-free schedules."
      />

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <Card className="lg:col-span-2">
          <div className="p-5 border-b border-[var(--color-ink)]/8">
            <h3 className="font-semibold text-[var(--color-ink)] flex items-center gap-2">
              <Plus size={15} className="text-[var(--color-seal)]" /> Add Availability Window
            </h3>
          </div>
          <form onSubmit={handleSubmit} className="p-5 space-y-4">
            <Field label="Period label" required hint="e.g. 'Review 1 Window — Jan 2025'">
              <Input
                required
                placeholder="Review 1 Window — Jan 2025"
                value={form.periodLabel}
                onChange={(e) => setForm({ ...form, periodLabel: e.target.value })}
              />
            </Field>
            <Field label="Available from" required>
              <Input
                type="datetime-local"
                required
                value={form.startTime}
                onChange={(e) => setForm({ ...form, startTime: e.target.value })}
              />
            </Field>
            <Field label="Available until" required>
              <Input
                type="datetime-local"
                required
                value={form.endTime}
                onChange={(e) => setForm({ ...form, endTime: e.target.value })}
              />
            </Field>
            <Button type="submit" loading={submitting} className="w-full">
              <CalendarClock size={15} /> Submit Availability
            </Button>
          </form>
        </Card>

        <div className="lg:col-span-3">
          <Card>
            <div className="p-4 border-b border-[var(--color-ink)]/8">
              <h3 className="font-semibold text-[var(--color-ink)] text-sm">My Submitted Slots</h3>
            </div>
            {isLoading ? (
              <TableSkeleton />
            ) : !data || data.length === 0 ? (
              <EmptyState title="No availability submitted yet" description="Add your available time windows using the form." />
            ) : (
              <Table>
                <THead>
                  <tr>
                    <TH>Period</TH>
                    <TH>Start</TH>
                    <TH>End</TH>
                    <TH></TH>
                  </tr>
                </THead>
                <tbody>
                  {data.map((s) => (
                    <TR key={s._id}>
                      <TD>{s.periodLabel}</TD>
                      <TD className="font-data text-xs">{new Date(s.startTime).toLocaleString()}</TD>
                      <TD className="font-data text-xs">{new Date(s.endTime).toLocaleString()}</TD>
                      <TD>
                        <button
                          onClick={() => handleDelete(s._id)}
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
        </div>
      </div>
    </AppShell>
  );
}
