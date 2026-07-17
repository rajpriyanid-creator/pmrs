import { useEffect, useState } from 'react';
import axios from 'axios';
import { api } from '@/api/client';
import { getStoredSessionContext, useAuthStore } from '@/store/authStore';

/**
 * Runs once on app mount. If a prior role-selection context was stored for
 * this tab (see authStore.setSession) and a valid httpOnly refresh cookie is
 * still present, silently mints a fresh access token so the person lands
 * back on their dashboard instead of the login screen after a reload.
 */
export function useSessionBootstrap(): boolean {
  const [ready, setReady] = useState(false);
  const setSession = useAuthStore((s) => s.setSession);

  useEffect(() => {
    const context = getStoredSessionContext();
    if (!context) {
      setReady(true);
      return;
    }
    axios
      .post(
        `${api.defaults.baseURL}/auth/refresh`,
        { role: context.role, programId: context.programId },
        { withCredentials: true }
      )
      .then((res) => {
        setSession(res.data.accessToken, context);
      })
      .catch(() => {
        // Cookie missing/expired — the person will be routed to /login by ProtectedRoute.
      })
      .finally(() => setReady(true));
  }, [setSession]);

  return ready;
}
