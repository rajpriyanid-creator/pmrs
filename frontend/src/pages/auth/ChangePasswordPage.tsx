import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Field, Input } from '@/components/ui/Form';
import { toast } from '@/components/ui/Toast';
import { apiErrorMessage, api } from '@/api/client';
import { useAuthStore } from '@/store/authStore';
import { Lock, ShieldAlert } from 'lucide-react';

export function ChangePasswordPage() {
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const profile = useAuthStore((s) => s.profile);
  const logout = useAuthStore((s) => s.logout);
  const navigate = useNavigate();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (newPassword !== confirm) {
      toast.error('Passwords do not match');
      return;
    }
    setLoading(true);
    try {
      await api.post('/auth/change-password', {
        currentPassword: oldPassword,
        newPassword: newPassword,
      });
      toast.success('Password changed. Please log in again.');
      logout?.();
      navigate('/login', { replace: true });
    } catch (err) {
      toast.error(apiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--color-paper)] px-4">
      <Card className="w-full max-w-md">
        <div className="p-8 space-y-6">
          {/* Header */}
          <div className="space-y-3">
            <div className="w-12 h-12 rounded-xl bg-[var(--color-flag)]/10 flex items-center justify-center">
              <ShieldAlert size={24} className="text-[var(--color-flag)]" />
            </div>
            <div>
              <h1 className="text-xl font-semibold text-[var(--color-ink)]">Change Password</h1>
              <p className="text-sm text-[var(--color-ink-faint)] mt-1">
                {profile ? `Welcome, ${profile.name}. ` : ''}
                You must set a new password before continuing.
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <Field label="Current password" required>
              <Input
                type="password"
                required
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
                autoFocus
              />
            </Field>

            <Field label="New password" required hint="At least 8 characters with a letter and number">
              <Input
                type="password"
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
            </Field>

            <Field label="Confirm new password" required>
              <Input
                type="password"
                required
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
              />
            </Field>

            <div className="pt-2 flex gap-2">
              <Button type="submit" loading={loading} className="flex-1">
                <Lock size={15} /> Set New Password
              </Button>
            </div>
          </form>
        </div>
      </Card>
    </div>
  );
}
