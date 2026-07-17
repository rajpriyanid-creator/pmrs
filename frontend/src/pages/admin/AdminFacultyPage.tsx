import { useRef, useState } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Field, Input, Checkbox } from '@/components/ui/Form';
import { Modal } from '@/components/ui/Modal';
import { Table, THead, TH, TR, TD, EmptyState, TableSkeleton } from '@/components/ui/Table';
import { Badge } from '@/components/ui/Card';
import { Plus, Upload, Download, Search } from 'lucide-react';
import { downloadFacultyList, downloadFacultyTemplate, useCreateFaculty, useFacultyList, useImportFaculty } from '@/api/faculty';
import { triggerDownload } from '@/lib/download';
import { toast } from '@/components/ui/Toast';
import { apiErrorMessage } from '@/api/client';

export function AdminFacultyPage() {
  const [search, setSearch] = useState('');
  const [addOpen, setAddOpen] = useState(false);
  const { data, isLoading } = useFacultyList(search);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const importMutation = useImportFaculty();

  async function handleTemplate() {
    const res = await downloadFacultyTemplate();
    triggerDownload(res.data, 'faculty-import-template.xlsx');
  }

  async function handleExport() {
    const res = await downloadFacultyList();
    triggerDownload(res.data, 'faculty.xlsx');
  }

  async function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const result = await importMutation.mutateAsync(file);
      toast.success(`Imported ${result.createdCount} faculty member(s).`);
      if (result.errors.length) toast.error(`${result.errors.length} row(s) had errors — see console.`);
      if (result.errors.length) console.table(result.errors);
    } catch (err) {
      toast.error(apiErrorMessage(err));
    } finally {
      e.target.value = '';
    }
  }

  return (
    <AppShell title="Faculty">
      <PageHeader
        title="Faculty"
        description="Seniority governs auto-assignment order; guide limits are enforced separately for UG and PG."
        action={
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" size="sm" onClick={handleTemplate}>
              <Download size={15} /> Template
            </Button>
            <Button variant="secondary" size="sm" onClick={() => fileInputRef.current?.click()} loading={importMutation.isPending}>
              <Upload size={15} /> Import
            </Button>
            <input ref={fileInputRef} type="file" accept=".xlsx,.xls" className="hidden" onChange={handleImport} />
            <Button variant="secondary" size="sm" onClick={handleExport}>
              <Download size={15} /> Export
            </Button>
            <Button size="sm" onClick={() => setAddOpen(true)}>
              <Plus size={15} /> Add Faculty
            </Button>
          </div>
        }
      />

      <Card>
        <div className="p-4 border-b border-[var(--color-ink)]/8">
          <div className="relative max-w-xs">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-ink-faint)]" />
            <Input placeholder="Search name, username, email…" className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
        </div>

        {isLoading ? (
          <TableSkeleton />
        ) : !data || data.items.length === 0 ? (
          <EmptyState title="No faculty yet" description="Add faculty manually or import a spreadsheet to get started." />
        ) : (
          <Table>
            <THead>
              <tr>
                <TH>Seniority</TH>
                <TH>Name</TH>
                <TH>Designation</TH>
                <TH>UG Limit</TH>
                <TH>PG Limit</TH>
                <TH>Roles</TH>
              </tr>
            </THead>
            <tbody>
              {data.items.map((f) => (
                <TR key={f._id}>
                  <TD className="font-data">{f.seniority}</TD>
                  <TD>
                    <p className="font-medium">{f.name}</p>
                    <p className="text-xs text-[var(--color-ink-faint)]">{f.username}</p>
                  </TD>
                  <TD>{f.designation}</TD>
                  <TD className="font-data">{f.guideLimits.ug}</TD>
                  <TD className="font-data">{f.guideLimits.pg}</TD>
                  <TD>
                    <div className="flex gap-1.5 flex-wrap">
                      {f.isAdmin && <Badge tone="flag">Admin</Badge>}
                      {f.isAssistant && <Badge tone="seal">Assistant</Badge>}
                      {!f.isActive && <Badge>Inactive</Badge>}
                    </div>
                  </TD>
                </TR>
              ))}
            </tbody>
          </Table>
        )}
      </Card>

      <AddFacultyModal open={addOpen} onClose={() => setAddOpen(false)} />
    </AppShell>
  );
}

function AddFacultyModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const createMutation = useCreateFaculty();
  const [form, setForm] = useState({
    name: '',
    username: '',
    email: '',
    designation: '',
    seniority: 1,
    ugLimit: 0,
    pgLimit: 0,
    isAdmin: false,
    isAssistant: false,
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      const result = await createMutation.mutateAsync({
        name: form.name,
        username: form.username,
        email: form.email,
        designation: form.designation,
        seniority: Number(form.seniority),
        guideLimits: { ug: Number(form.ugLimit), pg: Number(form.pgLimit) },
        isAdmin: form.isAdmin,
        isAssistant: form.isAssistant,
      });
      toast.success(`Added. Temporary password: ${result.tempPassword}`);
      onClose();
      setForm({ name: '', username: '', email: '', designation: '', seniority: 1, ugLimit: 0, pgLimit: 0, isAdmin: false, isAssistant: false });
    } catch (err) {
      toast.error(apiErrorMessage(err));
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Add Faculty">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Field label="Full name" required>
          <Input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        </Field>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Username" required>
            <Input required value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} />
          </Field>
          <Field label="Email" required>
            <Input type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          </Field>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Designation" required>
            <Input required value={form.designation} onChange={(e) => setForm({ ...form, designation: e.target.value })} />
          </Field>
          <Field label="Seniority rank" required hint="Lower = more senior">
            <Input type="number" min={1} required value={form.seniority} onChange={(e) => setForm({ ...form, seniority: Number(e.target.value) })} />
          </Field>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Field label="UG guide limit">
            <Input type="number" min={0} value={form.ugLimit} onChange={(e) => setForm({ ...form, ugLimit: Number(e.target.value) })} />
          </Field>
          <Field label="PG guide limit">
            <Input type="number" min={0} value={form.pgLimit} onChange={(e) => setForm({ ...form, pgLimit: Number(e.target.value) })} />
          </Field>
        </div>
        <div className="flex gap-6 pt-1">
          <Checkbox label="Admin" checked={form.isAdmin} onChange={(e) => setForm({ ...form, isAdmin: e.target.checked })} />
          <Checkbox label="Assistant" checked={form.isAssistant} onChange={(e) => setForm({ ...form, isAssistant: e.target.checked })} />
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" loading={createMutation.isPending}>
            Add Faculty
          </Button>
        </div>
      </form>
    </Modal>
  );
}
