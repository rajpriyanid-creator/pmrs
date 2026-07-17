import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Field, Input, Select } from '@/components/ui/Form';
import { toast } from '@/components/ui/Toast';
import { apiErrorMessage, api } from '@/api/client';
import { UserPlus, CheckCircle2 } from 'lucide-react';

export function RegisterPanelPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [form, setForm] = useState({
    name: '',
    email: '',
    username: '',
    password: '',
    confirmPassword: '',
    designation: '',
    seniority: 99,
    memberType: 'internal' as 'internal' | 'external',
  });

  function field(key: keyof typeof form) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setForm({ ...form, [key]: e.target.value });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (form.password !== form.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    setLoading(true);
    try {
      await api.post('/auth/register-panel', {
        name: form.name,
        email: form.email,
        username: form.username,
        password: form.password,
        designation: form.designation || 'Panel Member',
        seniority: Number(form.seniority),
        memberType: form.memberType,
      });
      setDone(true);
    } catch (err) {
      toast.error(apiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--color-paper)] px-4 py-8">
      <Card className="w-full max-w-lg">
        <div className="p-8 space-y-6">
          {done ? (
            <div className="text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-[var(--color-verdant)]/10 flex items-center justify-center mx-auto">
                <CheckCircle2 size={32} className="text-[var(--color-verdant)]" />
              </div>
              <h1 className="text-xl font-semibold text-[var(--color-ink)]">Registration complete!</h1>
              <p className="text-sm text-[var(--color-ink-faint)]">
                Your panel member account has been created. An admin will assign you to panels shortly.
              </p>
              <Button onClick={() => navigate('/login')} className="mt-2">
                Go to Login
              </Button>
            </div>
          ) : (
            <>
              <div className="space-y-1">
                <div className="w-10 h-10 rounded-xl bg-[var(--color-seal)]/10 flex items-center justify-center mb-3">
                  <UserPlus size={20} className="text-[var(--color-seal)]" />
                </div>
                <h1 className="text-xl font-semibold text-[var(--color-ink)]">Panel Member Registration</h1>
                <p className="text-sm text-[var(--color-ink-faint)]">
                  Create your account to participate in project review panels.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <Field label="Full name" required>
                  <Input required value={form.name} onChange={field('name')} placeholder="Dr. Jane Smith" />
                </Field>

                <div className="grid grid-cols-2 gap-4">
                  <Field label="Username" required>
                    <Input required value={form.username} onChange={field('username')} placeholder="jsmith" />
                  </Field>
                  <Field label="Email" required>
                    <Input type="email" required value={form.email} onChange={field('email')} placeholder="jane@university.edu" />
                  </Field>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <Field label="Designation">
                    <Input value={form.designation} onChange={field('designation')} placeholder="Associate Professor" />
                  </Field>
                  <Field label="Member type" required>
                    <Select value={form.memberType} onChange={field('memberType')}>
                      <option value="internal">Internal</option>
                      <option value="external">External</option>
                    </Select>
                  </Field>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <Field label="Password" required hint="8+ chars, letter + number">
                    <Input type="password" required value={form.password} onChange={field('password')} />
                  </Field>
                  <Field label="Confirm password" required>
                    <Input type="password" required value={form.confirmPassword} onChange={field('confirmPassword')} />
                  </Field>
                </div>

                <div className="flex justify-between items-center pt-2">
                  <Link to="/login" className="text-sm text-[var(--color-ink-faint)] hover:text-[var(--color-seal)] transition-colors">
                    Already have an account?
                  </Link>
                  <Button type="submit" loading={loading}>
                    Register
                  </Button>
                </div>
              </form>
            </>
          )}
        </div>
      </Card>
    </div>
  );
}
