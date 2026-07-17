import { useRef, useState } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Field, Input } from '@/components/ui/Form';
import { Modal } from '@/components/ui/Modal';
import { Table, THead, TH, TR, TD, EmptyState, TableSkeleton } from '@/components/ui/Table';
import { Plus, Upload } from 'lucide-react';
import { ProgramSelect } from '@/components/layout/Selectors';
import { useCreateStudent, useImportStudents, useStudentList } from '@/api/students';
import { toast } from '@/components/ui/Toast';
import { apiErrorMessage } from '@/api/client';

export function AdminStudentsPage() {
  const [program, setProgram] = useState('');
  const [addOpen, setAddOpen] = useState(false);
  const { data, isLoading } = useStudentList(program);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const importMutation = useImportStudents();

  async function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !program) {
      if (!program) toast.error('Select a program first');
      return;
    }
    try {
      const result = await importMutation.mutateAsync({ file, program });
      toast.success(`Imported ${result.createdCount} student(s).`);
      if (result.errors.length) console.table(result.errors);
    } catch (err) {
      toast.error(apiErrorMessage(err));
    } finally {
      e.target.value = '';
    }
  }

  return (
    <AppShell title="Students">
      <PageHeader
        title="Students"
        description="Select a program to view its roster."
        action={
          <div className="flex gap-2">
            <Button variant="secondary" size="sm" onClick={() => fileInputRef.current?.click()} loading={importMutation.isPending}>
              <Upload size={15} /> Import
            </Button>
            <input ref={fileInputRef} type="file" accept=".xlsx,.xls" className="hidden" onChange={handleImport} />
            <Button size="sm" onClick={() => setAddOpen(true)} disabled={!program}>
              <Plus size={15} /> Add Student
            </Button>
          </div>
        }
      />

      <Card>
        <div className="p-4 border-b border-[var(--color-ink)]/8 max-w-xs">
          <ProgramSelect value={program} onChange={setProgram} />
        </div>

        {!program ? (
          <EmptyState title="Choose a program" description="Select a program above to view its student roster." />
        ) : isLoading ? (
          <TableSkeleton />
        ) : !data || data.items.length === 0 ? (
          <EmptyState title="No students yet" description="Add students manually or import a spreadsheet." />
        ) : (
          <Table>
            <THead>
              <tr>
                <TH>Roll No</TH>
                <TH>Name</TH>
                <TH>Email</TH>
                <TH>Username</TH>
              </tr>
            </THead>
            <tbody>
              {data.items.map((s) => (
                <TR key={s._id}>
                  <TD className="font-data">{s.rollNo}</TD>
                  <TD className="font-medium">{s.name}</TD>
                  <TD className="text-[var(--color-ink-faint)]">{s.email}</TD>
                  <TD className="font-data">{s.username}</TD>
                </TR>
              ))}
            </tbody>
          </Table>
        )}
      </Card>

      <AddStudentModal open={addOpen} onClose={() => setAddOpen(false)} program={program} />
    </AppShell>
  );
}

function AddStudentModal({ open, onClose, program }: { open: boolean; onClose: () => void; program: string }) {
  const createMutation = useCreateStudent();
  const [form, setForm] = useState({ name: '', rollNo: '', email: '', username: '' });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      const result = await createMutation.mutateAsync({ ...form, program });
      toast.success(`Added. Temporary password: ${result.tempPassword}`);
      onClose();
      setForm({ name: '', rollNo: '', email: '', username: '' });
    } catch (err) {
      toast.error(apiErrorMessage(err));
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Add Student">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Field label="Full name" required>
          <Input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        </Field>
        <Field label="Roll number" required>
          <Input required value={form.rollNo} onChange={(e) => setForm({ ...form, rollNo: e.target.value })} />
        </Field>
        <Field label="Email" required>
          <Input type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        </Field>
        <Field label="Username" required>
          <Input required value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} />
        </Field>
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" loading={createMutation.isPending}>
            Add Student
          </Button>
        </div>
      </form>
    </Modal>
  );
}
