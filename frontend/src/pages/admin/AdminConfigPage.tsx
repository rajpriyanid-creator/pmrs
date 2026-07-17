import { useState } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Field, Input } from '@/components/ui/Form';
import { toast } from '@/components/ui/Toast';
import { apiErrorMessage, api } from '@/api/client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Settings, AlertTriangle, ToggleLeft, ToggleRight, Trash2 } from 'lucide-react';

function useAdminConfig() {
  return useQuery({
    queryKey: ['admin-config'],
    queryFn: async () => {
      const res = await api.get('/admin-config');
      return res.data.config as any;
    },
  });
}

function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className="flex items-center gap-3 group"
    >
      {checked ? (
        <ToggleRight size={28} className="text-[var(--color-verdant)]" />
      ) : (
        <ToggleLeft size={28} className="text-[var(--color-ink-faint)]" />
      )}
      <span className={`text-sm font-medium ${checked ? 'text-[var(--color-verdant)]' : 'text-[var(--color-ink-faint)]'}`}>
        {label}
      </span>
    </button>
  );
}

export function AdminConfigPage() {
  const qc = useQueryClient();
  const { data: config, isLoading } = useAdminConfig();
  const [saving, setSaving] = useState(false);
  const [local, setLocal] = useState<any>(null);
  const current = local ?? config ?? {};

  function setField(key: string, value: any) {
    setLocal((prev: any) => ({ ...(prev ?? config ?? {}), [key]: value }));
  }

  async function handleSave() {
    setSaving(true);
    try {
      await api.patch('/admin-config', {
        guideSelectionOpen: current.guideSelectionOpen,
        guideSelectionWindowStart: current.guideSelectionWindowStart || null,
        guideSelectionWindowEnd: current.guideSelectionWindowEnd || null,
        teamFormationOpen: current.teamFormationOpen,
      });
      toast.success('Configuration saved.');
      qc.invalidateQueries({ queryKey: ['admin-config'] });
      setLocal(null);
    } catch (err) {
      toast.error(apiErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  async function dangerDelete(endpoint: string, label: string) {
    const confirm1 = window.confirm(`⚠ This will permanently delete ${label}. Are you sure?`);
    if (!confirm1) return;
    const confirm2 = window.confirm(`Final confirmation: delete ${label}? This CANNOT be undone.`);
    if (!confirm2) return;
    try {
      const res = await api.delete(endpoint);
      toast.success(`Deleted ${res.data.deleted ?? 0} record(s).`);
    } catch (err) {
      toast.error(apiErrorMessage(err));
    }
  }

  return (
    <AppShell title="Admin Config">
      <PageHeader
        title="System Configuration"
        description="Control guide-selection windows, team formation, and perform danger-zone operations."
      />

      {isLoading ? (
        <div className="flex items-center justify-center p-12">
          <div className="h-8 w-8 rounded-full border-2 border-[var(--color-ink)]/15 border-t-[var(--color-seal)] animate-spin" />
        </div>
      ) : (
        <div className="space-y-6 max-w-2xl">
          {/* Guide selection window */}
          <Card>
            <div className="px-5 py-4 border-b border-[var(--color-ink)]/8">
              <h3 className="font-semibold text-[var(--color-ink)] flex items-center gap-2">
                <Settings size={15} className="text-[var(--color-seal)]" /> Guide Selection Window
              </h3>
              <p className="text-xs text-[var(--color-ink-faint)] mt-0.5">
                Controls whether students can request guides (open) and the date range for that window.
              </p>
            </div>
            <div className="p-5 space-y-5">
              <Toggle
                checked={!!current.guideSelectionOpen}
                onChange={(v) => setField('guideSelectionOpen', v)}
                label={current.guideSelectionOpen ? 'Guide selection is OPEN' : 'Guide selection is CLOSED'}
              />
              <div className="grid grid-cols-2 gap-4">
                <Field label="Window opens">
                  <Input
                    type="datetime-local"
                    value={current.guideSelectionWindowStart ? new Date(current.guideSelectionWindowStart).toISOString().slice(0, 16) : ''}
                    onChange={(e) => setField('guideSelectionWindowStart', e.target.value)}
                  />
                </Field>
                <Field label="Window closes">
                  <Input
                    type="datetime-local"
                    value={current.guideSelectionWindowEnd ? new Date(current.guideSelectionWindowEnd).toISOString().slice(0, 16) : ''}
                    onChange={(e) => setField('guideSelectionWindowEnd', e.target.value)}
                  />
                </Field>
              </div>
            </div>
          </Card>

          {/* Team formation */}
          <Card>
            <div className="px-5 py-4 border-b border-[var(--color-ink)]/8">
              <h3 className="font-semibold text-[var(--color-ink)] flex items-center gap-2">
                <Settings size={15} className="text-[var(--color-seal)]" /> Team Formation
              </h3>
              <p className="text-xs text-[var(--color-ink-faint)] mt-0.5">
                Controls whether students can create teams and send invites.
              </p>
            </div>
            <div className="p-5">
              <Toggle
                checked={!!current.teamFormationOpen}
                onChange={(v) => setField('teamFormationOpen', v)}
                label={current.teamFormationOpen ? 'Team formation is OPEN' : 'Team formation is CLOSED'}
              />
            </div>
          </Card>

          <div className="flex justify-end">
            <Button onClick={handleSave} loading={saving}>
              Save Configuration
            </Button>
          </div>

          {/* Danger Zone */}
          <Card className="border-[var(--color-flag)]/30">
            <div className="px-5 py-4 border-b border-[var(--color-flag)]/15 bg-[var(--color-flag)]/3">
              <h3 className="font-semibold text-[var(--color-flag)] flex items-center gap-2">
                <AlertTriangle size={15} /> Danger Zone
              </h3>
              <p className="text-xs text-[var(--color-flag)]/70 mt-0.5">
                These actions are irreversible. Use with extreme caution.
              </p>
            </div>
            <div className="p-5 space-y-3">
              {[
                {
                  label: 'Delete all teams',
                  desc: 'Removes every team record from the database.',
                  endpoint: '/admin-config/danger/all-teams',
                },
                {
                  label: 'Delete solo teams',
                  desc: 'Removes all teams with exactly one student.',
                  endpoint: '/admin-config/danger/solo-teams',
                },
                {
                  label: 'Delete all students',
                  desc: 'Removes all student accounts and invalidates their sessions.',
                  endpoint: '/admin-config/danger/all-students',
                },
                {
                  label: 'Delete all non-admin faculty',
                  desc: 'Removes all faculty accounts (admin accounts are preserved).',
                  endpoint: '/admin-config/danger/all-faculty',
                },
              ].map((action) => (
                <div
                  key={action.endpoint}
                  className="flex items-center justify-between p-4 rounded-xl border border-[var(--color-flag)]/15 bg-[var(--color-flag)]/2"
                >
                  <div>
                    <p className="text-sm font-medium text-[var(--color-ink)]">{action.label}</p>
                    <p className="text-xs text-[var(--color-ink-faint)] mt-0.5">{action.desc}</p>
                  </div>
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => dangerDelete(action.endpoint, action.label.toLowerCase())}
                  >
                    <Trash2 size={13} /> Delete
                  </Button>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}
    </AppShell>
  );
}
