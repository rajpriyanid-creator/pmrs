import { create } from 'zustand';
import { AuthProfile, RoleOption, ScopedRole } from '@/types';

const SESSION_CONTEXT_KEY = 'prms_session_context';

interface AuthState {
  identityToken: string | null;
  accessToken: string | null;
  profile: AuthProfile | null;
  roleOptions: RoleOption[];
  candidateName: string | null;

  setIdentity: (token: string, name: string) => void;
  setRoleOptions: (options: RoleOption[]) => void;
  setSession: (accessToken: string, profile: AuthProfile) => void;
  setAccessToken: (token: string) => void;
  setProfile: (profile: AuthProfile) => void;
  logout: () => void;
  clear: () => void;
}

/**
 * Tokens are deliberately kept in memory only (Zustand state), not
 * localStorage/sessionStorage — this avoids persistent XSS-exfiltrable
 * storage. A page refresh requires the refresh-token cookie flow to
 * re-establish a session (see api/client.ts and App.tsx's bootstrap effect).
 *
 * The *role selection context* (name/role/programId — not a credential) is
 * mirrored to sessionStorage purely so a reload can ask the refresh endpoint
 * "re-mint an access token for this same role" instead of forcing the person
 * back through the role-selection screen every time they refresh the tab.
 * sessionStorage clears itself when the tab/browser closes.
 */
export const useAuthStore = create<AuthState>((set) => ({
  identityToken: null,
  accessToken: null,
  profile: null,
  roleOptions: [],
  candidateName: null,

  setIdentity: (token, name) => set({ identityToken: token, candidateName: name }),
  setRoleOptions: (options) => set({ roleOptions: options }),
  setSession: (accessToken, profile) => {
    sessionStorage.setItem(SESSION_CONTEXT_KEY, JSON.stringify(profile));
    set({ accessToken, profile, identityToken: null });
  },
  setAccessToken: (token) => set({ accessToken: token }),
  setProfile: (profile) => {
    sessionStorage.setItem(SESSION_CONTEXT_KEY, JSON.stringify(profile));
    set({ profile });
  },
  logout: () => {
    sessionStorage.removeItem(SESSION_CONTEXT_KEY);
    set({ identityToken: null, accessToken: null, profile: null, roleOptions: [], candidateName: null });
  },
  clear: () => {
    sessionStorage.removeItem(SESSION_CONTEXT_KEY);
    set({ identityToken: null, accessToken: null, profile: null, roleOptions: [], candidateName: null });
  },
}));

export function getStoredSessionContext(): AuthProfile | null {
  try {
    const raw = sessionStorage.getItem(SESSION_CONTEXT_KEY);
    return raw ? (JSON.parse(raw) as AuthProfile) : null;
  } catch {
    return null;
  }
}

export function currentRole(): ScopedRole | null {
  return useAuthStore.getState().profile?.role ?? null;
}
