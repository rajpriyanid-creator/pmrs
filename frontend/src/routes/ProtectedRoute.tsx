import { Navigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { ScopedRole } from '@/types';

export function ProtectedRoute({ allow, children }: { allow?: ScopedRole[]; children: React.ReactNode }) {
  const profile = useAuthStore((s) => s.profile);
  const accessToken = useAuthStore((s) => s.accessToken);

  if (!accessToken || !profile) return <Navigate to="/login" replace />;
  if (allow && !allow.includes(profile.role)) return <Navigate to="/login" replace />;

  return <>{children}</>;
}
