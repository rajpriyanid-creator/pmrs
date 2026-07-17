import { useEffect, useState } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Field, Input } from '@/components/ui/Form';
import { Badge } from '@/components/ui/Card';
import { Lock, Plus, Trash2 } from 'lucide-react';
import { useUpdateVivaPanel, useVivaPanel } from '@/api/panels';
import { toast } from '@/components/ui/Toast';
import { apiErrorMessage } from '@/api/client';

export function CoordinatorVivaPage() {
  const { data: viva, isLoading } = useVivaPanel();
  const updateMutation = useUpdateVivaPanel();
  const [externals, setExternals] = useState<{ name: string; affiliation: string; email: string }[]>([]);

  useEffect(() => {
    if (viva) setExternals(viva.externalMembers);
  }, [viva]);

  function addRow() {
    setExternals((d) => [...d, { name: '', affiliation: '', email: '' }]);
  }

  function updateRow(i: number, patch: Partial<{ name: string; affiliation: string; email: string }>) {
    setExternals((d) => {
      const copy = [...d];
      copy[i] = { ...copy[i], ...patch };
      return copy;
    });
  }

  function removeRow(i: number) {
    setExternals((d) => d.filter((_, idx) => idx !== i));
  }

  async function handleSave() {
    if (!viva) return;
    try {
      await updateMutation.mutateAsync({ id: viva._id, externalMembers: externals });
      toast.success('Viva panel updated.');
    } catch (err) {
      toast.error(apiErrorMessage(err));
    }
  }

  if (isLoading) {
    return (
      <AppShell title="Viva Panel">
        <div className="h-40 animate-pulse bg-[var(--color-ink)]/5 rounded-xl" />
      </AppShell>
    );
  }

  return (
    <AppShell title="Viva Panel">
      <PageHeader title="Viva Panel" description="Internal members are inherited from your review panel and locked. Add external examiners below." />

      <Card className="mb-6">
        <CardHeader title="Internal Members" subtitle="Locked — carried over from your Review Panel" />
        <div className="p-6 flex flex-wrap gap-2">
          {viva?.internalMembers.map((m) => (
            <Badge key={m._id} tone="neutral">
              <Lock size={11} className="mr-1 inline" /> {m.name}
            </Badge>
          ))}
        </div>
      </Card>

      <Card>
        <CardHeader
          title="External Members"
          subtitle="Add examiners from outside the institution"
          action={
            <Button size="sm" variant="secondary" onClick={addRow}>
              <Plus size={14} /> Add
            </Button>
          }
        />
        <div className="p-6 space-y-4">
          {externals.length === 0 ? (
            <p className="text-sm text-[var(--color-ink-faint)]">No external members added yet.</p>
          ) : (
            externals.map((m, i) => (
              <div key={i} className="grid grid-cols-1 sm:grid-cols-[1fr_1fr_1fr_auto] gap-3 items-end">
                <Field label="Name">
                  <Input value={m.name} onChange={(e) => updateRow(i, { name: e.target.value })} />
                </Field>
                <Field label="Affiliation">
                  <Input value={m.affiliation} onChange={(e) => updateRow(i, { affiliation: e.target.value })} />
                </Field>
                <Field label="Email">
                  <Input type="email" value={m.email} onChange={(e) => updateRow(i, { email: e.target.value })} />
                </Field>
                <Button variant="ghost" size="sm" onClick={() => removeRow(i)} aria-label="Remove">
                  <Trash2 size={15} className="text-[var(--color-flag)]" />
                </Button>
              </div>
            ))
          )}
          <div className="pt-2">
            <Button onClick={handleSave} loading={updateMutation.isPending}>
              Save Changes
            </Button>
          </div>
        </div>
      </Card>
    </AppShell>
  );
}
