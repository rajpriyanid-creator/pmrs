import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Field, Input } from '@/components/ui/Form';
import { toast } from '@/components/ui/Toast';
import { apiErrorMessage, api } from '@/api/client';
import { ArrowLeft, KeyRound, Mail, ShieldCheck } from 'lucide-react';

type Step = 'email' | 'otp' | 'newPassword' | 'done';

export function ForgotPasswordPage() {
  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSendOtp(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/auth/forgot-password', { email });
      toast.success('OTP sent! Check your email.');
      setStep('otp');
    } catch (err) {
      toast.error(apiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  async function handleVerifyOtp(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.post('/auth/verify-otp', { email, otp });
      setResetToken(res.data.resetToken);
      setStep('newPassword');
    } catch (err) {
      toast.error(apiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  async function handleReset(e: React.FormEvent) {
    e.preventDefault();
    if (newPassword !== confirm) {
      toast.error('Passwords do not match');
      return;
    }
    setLoading(true);
    try {
      await api.post('/auth/reset-password', {
        resetToken,
        newPassword,
      });
      setStep('done');
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
          {step === 'done' ? (
            <div className="text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-[var(--color-verdant)]/10 flex items-center justify-center mx-auto">
                <ShieldCheck size={32} className="text-[var(--color-verdant)]" />
              </div>
              <h1 className="text-xl font-semibold text-[var(--color-ink)]">Password reset!</h1>
              <p className="text-sm text-[var(--color-ink-faint)]">You can now log in with your new password.</p>
              <Link
                to="/login"
                className="inline-block mt-2 text-sm text-[var(--color-seal)] underline underline-offset-2"
              >
                Go to Login
              </Link>
            </div>
          ) : (
            <>
              <div className="space-y-1">
                <div className="flex items-center gap-3 mb-4">
                  {step !== 'email' && (
                    <button
                      onClick={() => setStep(step === 'otp' ? 'email' : 'otp')}
                      className="text-[var(--color-ink-faint)] hover:text-[var(--color-ink)] transition-colors"
                    >
                      <ArrowLeft size={18} />
                    </button>
                  )}
                  <div className="w-9 h-9 rounded-full bg-[var(--color-seal)]/10 flex items-center justify-center">
                    {step === 'email' ? (
                      <Mail size={18} className="text-[var(--color-seal)]" />
                    ) : (
                      <KeyRound size={18} className="text-[var(--color-seal)]" />
                    )}
                  </div>
                </div>
                <h1 className="text-xl font-semibold text-[var(--color-ink)]">
                  {step === 'email' && 'Forgot Password'}
                  {step === 'otp' && 'Verify OTP'}
                  {step === 'newPassword' && 'New Password'}
                </h1>
                <p className="text-sm text-[var(--color-ink-faint)]">
                  {step === 'email' && 'Enter your registered email to receive a one-time password.'}
                  {step === 'otp' && `Enter the 6-digit OTP sent to ${email}.`}
                  {step === 'newPassword' && 'Choose a strong new password.'}
                </p>
              </div>

              {step === 'email' && (
                <form onSubmit={handleSendOtp} className="space-y-4">
                  <Field label="Email" required>
                    <Input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="your@email.com"
                      autoFocus
                    />
                  </Field>
                  <Button type="submit" loading={loading} className="w-full">
                    Send OTP
                  </Button>
                </form>
              )}

              {step === 'otp' && (
                <form onSubmit={handleVerifyOtp} className="space-y-4">
                  <Field label="OTP (6 digits)" required>
                    <Input
                      type="text"
                      inputMode="numeric"
                      maxLength={6}
                      required
                      value={otp}
                      onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                      placeholder="123456"
                      className="tracking-widest text-center text-lg font-data"
                      autoFocus
                    />
                  </Field>
                  <Button type="submit" loading={loading} className="w-full">
                    Verify OTP
                  </Button>
                  <button
                    type="button"
                    onClick={() => handleSendOtp({ preventDefault: () => {} } as any)}
                    className="w-full text-sm text-[var(--color-ink-faint)] hover:text-[var(--color-seal)] transition-colors"
                  >
                    Resend OTP
                  </button>
                </form>
              )}

              {step === 'newPassword' && (
                <form onSubmit={handleReset} className="space-y-4">
                  <Field label="New password" required hint="At least 8 characters with a letter and number">
                    <Input
                      type="password"
                      required
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      autoFocus
                    />
                  </Field>
                  <Field label="Confirm password" required>
                    <Input
                      type="password"
                      required
                      value={confirm}
                      onChange={(e) => setConfirm(e.target.value)}
                    />
                  </Field>
                  <Button type="submit" loading={loading} className="w-full">
                    Reset Password
                  </Button>
                </form>
              )}

              {step === 'email' && (
                <div className="text-center text-sm">
                  <Link to="/login" className="text-[var(--color-ink-faint)] hover:text-[var(--color-seal)] transition-colors">
                    Back to Login
                  </Link>
                </div>
              )}
            </>
          )}
        </div>
      </Card>
    </div>
  );
}
